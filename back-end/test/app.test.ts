import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'

import { createApp } from '../src/app.js'
import { readServerConfig } from '../src/server-config.js'

const validLead = {
  email: 'parent@example.com',
  grade: '5th Grade',
  message: 'Fractions are the main challenge.',
  parentName: 'Jane Smith',
  phone: '(555) 123-4567',
  preferred: 'Weekday evenings',
  studentName: 'Alex',
  subject: 'Fractions & Decimals',
}

describe('API security contract', () => {
  it('provides minimal GET and HEAD probes and fails readiness closed', async () => {
    let ready = true
    let stopping = false
    const app = createApp({
      isReady: () => ready,
      isStopping: () => stopping,
      leadWebhookUrl: '',
    })

    for (const path of ['/healthz', '/readyz', '/api/healthz', '/api/readyz', '/api/health']) {
      for (const method of ['get', 'head'] as const) {
        const response = await request(app)[method](path).expect(200)
        expect(response.headers['cache-control']).toBe('no-store')
        expect(response.headers['set-cookie']).toBeUndefined()
        expect(response.headers.location).toBeUndefined()
        expect(response.headers['x-powered-by']).toBeUndefined()
        if (method === 'get')
          expect(response.body).toEqual({ ok: true })
        else
          expect(response.text).toBeUndefined()
      }
    }

    ready = false
    await request(app).get('/readyz').expect(503, { ok: false })
    await request(app).head('/readyz').expect(503)
    await request(app).get('/healthz').expect(200, { ok: true })
    ready = true
    stopping = true
    await request(app).get('/api/readyz').expect(503, { ok: false })
    await request(app).get('/api/healthz').expect(200, { ok: true })
    await request(app).post('/api/leads').send(validLead).expect(503, { error: 'service_stopping' })

    await request(createApp({ leadWebhookUrl: '' })).get('/readyz').expect(503, { ok: false })
    await request(createApp({
      isReady: () => {
        throw new Error('private dependency detail')
      },
      leadWebhookUrl: '',
    })).get('/readyz').expect(503, { ok: false })
  })

  it('serves a minimal, uncached health response with security headers', async () => {
    const response = await request(createApp()).get('/api/health').expect(200)

    expect(response.body).toEqual({ ok: true })
    expect(response.headers['cache-control']).toBe('no-store')
    expect(response.headers['x-content-type-options']).toBe('nosniff')
    expect(response.headers['x-frame-options']).toBe('DENY')
    expect(response.headers['x-powered-by']).toBeUndefined()
  })

  it('does not grant cross-origin access from an arbitrary origin', async () => {
    const response = await request(createApp())
      .get('/api/health')
      .set('Origin', 'https://attacker.example')
      .expect(200)

    expect(response.headers['access-control-allow-origin']).toBeUndefined()
    expect(response.headers['access-control-allow-credentials']).toBeUndefined()
  })

  it('allows only read-only API methods', async () => {
    const response = await request(createApp()).post('/api/health').send({ value: true }).expect(405)

    expect(response.body).toEqual({ error: 'method_not_allowed' })
    expect(response.headers.allow).toBe('GET, HEAD, OPTIONS')
  })

  it('reserves POST exclusively for the bounded lead endpoint', async () => {
    const response = await request(createApp()).get('/api/leads').expect(405)

    expect(response.body).toEqual({ error: 'method_not_allowed' })
    expect(response.headers.allow).toBe('POST, OPTIONS')
  })

  it('answers preflight-like requests without granting CORS access', async () => {
    const response = await request(createApp()).options('/api/health').expect(204)

    expect(response.headers.allow).toBe('GET, HEAD, OPTIONS')
    expect(response.headers['access-control-allow-origin']).toBeUndefined()
  })

  it('advertises the lead endpoint method without granting cross-origin access', async () => {
    const response = await request(createApp()).options('/api/leads').expect(204)

    expect(response.headers.allow).toBe('POST, OPTIONS')
    expect(response.headers['access-control-allow-origin']).toBeUndefined()
  })

  it('rejects invalid lead data before consulting a destination', async () => {
    const response = await request(createApp()).post('/api/leads').send({ ...validLead, email: 'invalid' }).expect(400)

    expect(response.body).toEqual({ error: 'invalid_request' })
  })

  it('rejects malformed JSON without exposing parser details', async () => {
    const response = await request(createApp())
      .post('/api/leads')
      .set('Content-Type', 'application/json')
      .send('{"parentName":')
      .expect(400)

    expect(response.body).toEqual({ error: 'invalid_request' })
  })

  it('rejects oversized JSON with a bounded generic response', async () => {
    const response = await request(createApp())
      .post('/api/leads')
      .send({ ...validLead, message: 'x'.repeat(20_000) })
      .expect(413)

    expect(response.body).toEqual({ error: 'request_too_large' })
  })

  it('fails closed when the owner-controlled lead destination is not configured', async () => {
    const response = await request(createApp()).post('/api/leads').send(validLead).expect(503)

    expect(response.body).toEqual({ error: 'lead_destination_unconfigured' })
  })

  it('forwards only validated lead fields to the configured HTTPS destination', async () => {
    const fetchImpl = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => new Response(null, { status: 204 }))
    const app = createApp({
      fetchImpl: fetchImpl as typeof fetch,
      leadWebhookUrl: 'https://leads.example/collect',
    })

    await request(app).post('/api/leads').send({ ...validLead, ignored: 'not forwarded' }).expect(202, { ok: true })

    expect(fetchImpl).toHaveBeenCalledOnce()
    const [url, init] = fetchImpl.mock.calls[0]!
    expect(url).toBe('https://leads.example/collect')
    expect(init?.method).toBe('POST')
    expect(init?.redirect).toBe('error')
    expect(init?.body).toBeInstanceOf(URLSearchParams)

    const body = init?.body as URLSearchParams
    expect(body.get('parentName')).toBe(validLead.parentName)
    expect(body.get('grade')).toBe(validLead.grade)
    expect(body.get('source')).toBe('thetutorlyfe website')
    expect(body.get('submittedAt')).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(body.has('ignored')).toBe(false)
  })

  it('does not report success when the lead destination rejects delivery', async () => {
    const fetchImpl = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => new Response(null, { status: 500 }))
    const app = createApp({
      fetchImpl: fetchImpl as typeof fetch,
      leadWebhookUrl: 'https://leads.example/collect',
    })

    await request(app).post('/api/leads').send(validLead).expect(502, { error: 'lead_delivery_failed' })
  })

  it('bounds aggregate outbound lead delivery and releases capacity', async () => {
    let releaseDeliveries!: () => void
    let reportStarted!: () => void
    let started = 0
    const deliveryGate = new Promise<void>((resolve) => {
      releaseDeliveries = resolve
    })
    const bothStarted = new Promise<void>((resolve) => {
      reportStarted = resolve
    })
    const fetchImpl = vi.fn(async () => {
      started += 1
      if (started === 2)
        reportStarted()
      await deliveryGate
      return new Response(null, { status: 204 })
    })
    const app = createApp({
      fetchImpl: fetchImpl as typeof fetch,
      leadWebhookUrl: 'https://leads.example/collect',
      maxConcurrentLeadDeliveries: 2,
    })

    const first = request(app).post('/api/leads').send(validLead)
    const second = request(app).post('/api/leads').send(validLead)
    const firstResult = first.then(response => response)
    const secondResult = second.then(response => response)
    await bothStarted

    const overloaded = await request(app).post('/api/leads').send(validLead).expect(503)
    expect(overloaded.body).toEqual({ error: 'lead_delivery_busy' })
    expect(overloaded.headers['retry-after']).toBe('5')

    releaseDeliveries()
    const completed = await Promise.all([firstResult, secondResult])
    expect(completed.map(response => response.status)).toEqual([202, 202])
    await request(app).post('/api/leads').send(validLead).expect(202, { ok: true })
  })

  it('cancels unread provider bodies before releasing a delivery slot', async () => {
    let canceled = false
    const fetchImpl = vi.fn(async () => new Response(new ReadableStream({
      cancel() {
        canceled = true
      },
      start(controller) {
        controller.enqueue(new TextEncoder().encode('provider detail that must not be retained'))
      },
    }), { status: 500 }))
    const app = createApp({
      fetchImpl: fetchImpl as typeof fetch,
      leadWebhookUrl: 'https://leads.example/collect',
    })

    await request(app).post('/api/leads').send(validLead).expect(502, { error: 'lead_delivery_failed' })
    expect(canceled).toBe(true)
  })

  it('does not expose the former mutable page-view endpoint', async () => {
    await request(createApp()).get('/api/pageview').expect(404, { error: 'not_found' })
  })

  it('returns JSON 404 responses outside the API', async () => {
    await request(createApp()).get('/missing').expect(404, { error: 'not_found' })
  })

  it('rejects unsafe proxy-hop configuration', () => {
    expect(() => createApp({ trustProxyHops: -1 })).toThrow(RangeError)
    expect(() => createApp({ trustProxyHops: 3 })).toThrow(RangeError)
    expect(() => createApp({ leadWebhookUrl: 'http://leads.example/collect' })).toThrow(RangeError)
    expect(() => createApp({ leadWebhookUrl: 'https://user:secret@leads.example/collect' })).toThrow(RangeError)
    expect(() => createApp({ maxConcurrentLeadDeliveries: 0 })).toThrow(RangeError)
  })

  it('does not retain a malformed secret-bearing webhook value in the configuration error', () => {
    const sentinel = 'https://[private-token.example/path?token=do-not-log'
    let thrown: unknown
    try {
      createApp({ leadWebhookUrl: sentinel })
    }
    catch (error) {
      thrown = error
    }

    expect(thrown).toBeInstanceOf(RangeError)
    expect(String(thrown)).toContain('LEAD_WEBHOOK_URL')
    expect(String(thrown)).not.toContain(sentinel)
  })

  it('keeps the standalone API on loopback and bounds listener settings', () => {
    expect(readServerConfig({})).toEqual({ host: '127.0.0.1', port: 3006, trustProxyHops: 0 })
    expect(readServerConfig({ HOST: '::1', PORT: '3007', TRUST_PROXY_HOPS: '1' })).toEqual({
      host: '::1',
      port: 3007,
      trustProxyHops: 1,
    })
    expect(() => readServerConfig({ HOST: '0.0.0.0' })).toThrow(RangeError)
    expect(() => readServerConfig({ PORT: '0' })).toThrow(RangeError)
    expect(() => readServerConfig({ TRUST_PROXY_HOPS: '3' })).toThrow(RangeError)
  })
})
