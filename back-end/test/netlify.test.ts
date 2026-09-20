import type { HandlerContext, HandlerEvent, HandlerResponse } from '@netlify/functions'
import { describe, expect, it } from 'vitest'

import { handler } from '../../netlify/functions/api.js'

function eventFor(path: string, method = 'GET') {
  return {
    body: null,
    headers: { host: 'thetutorlyfe.com' },
    httpMethod: method,
    isBase64Encoded: false,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    path,
    queryStringParameters: null,
    rawQuery: '',
    rawUrl: `https://thetutorlyfe.com${path}`,
    requestContext: {
      identity: { sourceIp: '127.0.0.1' },
    },
  } as unknown as HandlerEvent
}

describe('Netlify API adapter', () => {
  it('runs the same Express health route through the function boundary', async () => {
    const response = await handler(eventFor('/api/health'), {} as HandlerContext) as HandlerResponse

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body || '{}')).toEqual({ ok: true })
    expect(response.headers?.['access-control-allow-origin']).toBeUndefined()
    expect(response.headers?.['cache-control']).toBe('no-store')
  })

  it('exposes root and API probe aliases without cookies or redirects', async () => {
    for (const path of ['/healthz', '/api/healthz']) {
      for (const method of ['GET', 'HEAD']) {
        const response = await handler(eventFor(path, method), {} as HandlerContext) as HandlerResponse
        expect(response.statusCode).toBe(200)
        expect(response.headers?.['cache-control']).toBe('no-store')
        expect(response.headers?.['set-cookie']).toBeUndefined()
        expect(response.headers?.location).toBeUndefined()
        if (method === 'GET')
          expect(JSON.parse(response.body || '{}')).toEqual({ ok: true })
        else
          expect(response.body || '').toBe('')
      }
    }
  })
})
