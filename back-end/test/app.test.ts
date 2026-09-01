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
