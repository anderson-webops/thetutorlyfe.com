import express from 'express'
import { rateLimit } from 'express-rate-limit'
import helmet from 'helmet'

import { BoundedRateStore } from './boundedRateStore.js'

const readOnlyMethods = ['GET', 'HEAD', 'OPTIONS'] as const
const leadMethods = ['POST', 'OPTIONS'] as const

const grades = new Set([
  '3rd Grade',
  '4th Grade',
  '5th Grade',
  '6th Grade',
  '7th Grade',
  '8th Grade',
  '9th Grade',
  '10th Grade',
  'Other / Not sure',
])

const subjects = new Set([
  'General Math Help',
  'Fractions & Decimals',
  'Pre-Algebra',
  'Algebra',
  'Geometry',
  'Test / Exam Prep',
  'Homework Support',
  'Other',
])

interface LeadPayload {
  email: string
  grade: string
  message: string
  parentName: string
  phone: string
  preferred: string
  studentName: string
  subject: string
}

export interface AppOptions {
  fetchImpl?: typeof fetch
  isReady?: () => boolean
  isStopping?: () => boolean
  leadWebhookUrl?: string
  maxConcurrentLeadDeliveries?: number
  trustProxyHops?: number
}

function validateTrustProxyHops(value: number) {
  if (!Number.isSafeInteger(value) || value < 0 || value > 2)
    throw new RangeError('trustProxyHops must be an integer between 0 and 2')
}

function methodsForApiPath(path: string) {
  return path === '/leads' ? leadMethods : readOnlyMethods
}

function parseWebhookUrl(rawValue: string | undefined) {
  const value = rawValue?.trim()
  if (!value)
    return undefined

  let url: URL
  try {
    url = new URL(value)
  }
  catch {
    throw new RangeError('LEAD_WEBHOOK_URL must be a valid HTTPS URL without embedded credentials')
  }

  if (url.protocol !== 'https:' || url.username || url.password)
    throw new RangeError('LEAD_WEBHOOK_URL must be an HTTPS URL without embedded credentials')

  return url.toString()
}

function readString(body: Record<string, unknown>, name: string, maximumLength: number) {
  const value = body[name]
  if (value === undefined || value === null)
    return ''
  if (typeof value !== 'string')
    return undefined

  const trimmed = value.trim()
  if (trimmed.length > maximumLength)
    return undefined

  return trimmed
}

function parseLeadPayload(value: unknown): LeadPayload | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return undefined

  const body = value as Record<string, unknown>
  const parentName = readString(body, 'parentName', 120)
  const studentName = readString(body, 'studentName', 120)
  const email = readString(body, 'email', 254)
  const phone = readString(body, 'phone', 40)
  const grade = readString(body, 'grade', 40)
  const subject = readString(body, 'subject', 80)
  const preferred = readString(body, 'preferred', 240)
  const message = readString(body, 'message', 2_000)

  if (
    parentName === undefined
    || studentName === undefined
    || email === undefined
    || phone === undefined
    || grade === undefined
    || subject === undefined
    || preferred === undefined
    || message === undefined
  )
    return undefined
  if (!parentName || !email || !phone || !grade)
    return undefined
  if (!/^\S+@\S+\.\S+$/.test(email) || email.includes('\r') || email.includes('\n'))
    return undefined
  if (phone.replace(/\D/g, '').length < 7)
    return undefined
  if (!grades.has(grade) || (subject && !subjects.has(subject)))
    return undefined

  return {
    email,
    grade,
    message,
    parentName,
    phone,
    preferred,
    studentName,
    subject,
  }
}

function serializeLead(lead: LeadPayload) {
  return new URLSearchParams({
    ...lead,
    source: 'thetutorlyfe website',
    submittedAt: new Date().toISOString(),
  })
}

export function createApp(options: AppOptions = {}) {
  const trustProxyHops = options.trustProxyHops ?? 0
  const leadWebhookUrl = parseWebhookUrl(options.leadWebhookUrl ?? process.env.LEAD_WEBHOOK_URL)
  const fetchImpl = options.fetchImpl ?? fetch
  const maxConcurrentLeadDeliveries = options.maxConcurrentLeadDeliveries ?? 16
  validateTrustProxyHops(trustProxyHops)
  if (!Number.isSafeInteger(maxConcurrentLeadDeliveries) || maxConcurrentLeadDeliveries < 1 || maxConcurrentLeadDeliveries > 128)
    throw new RangeError('maxConcurrentLeadDeliveries must be an integer between 1 and 128')

  const app = express()
  let inFlightLeadDeliveries = 0

  app.disable('etag')
  app.disable('x-powered-by')
  app.set('query parser', 'simple')
  if (trustProxyHops > 0)
    app.set('trust proxy', trustProxyHops)

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        baseUri: ["'none'"],
        defaultSrc: ["'none'"],
        formAction: ["'none'"],
        frameAncestors: ["'none'"],
      },
      useDefaults: false,
    },
    strictTransportSecurity: {
      includeSubDomains: false,
      maxAge: 31_536_000,
      preload: false,
    },
    xFrameOptions: { action: 'deny' },
  }))

  app.use((_request, response, next) => {
    response.set('Cache-Control', 'no-store')
    next()
  })

  const stopping = options.isStopping ?? (() => false)
  const ready = options.isReady ?? (() => Boolean(leadWebhookUrl))
  const probe = (liveness: boolean): express.RequestHandler => (request, response) => {
    let ok = liveness
    if (!liveness) {
      try {
        ok = !stopping() && ready()
      }
      catch {
        ok = false
      }
    }

    response.status(ok ? 200 : 503)
    return request.method === 'HEAD' ? response.end() : response.json({ ok })
  }

  for (const route of ['/healthz', '/api/healthz', '/api/health']) {
    app.head(route, probe(true))
    app.get(route, probe(true))
  }
  for (const route of ['/readyz', '/api/readyz']) {
    app.head(route, probe(false))
    app.get(route, probe(false))
  }

  app.use((_request, response, next) => {
    if (stopping()) {
      response.set('Retry-After', '5').status(503).json({ error: 'service_stopping' })
      return
    }
    next()
  })

  app.use('/api', (request, response, next) => {
    const allowedMethods = methodsForApiPath(request.path)
    const allowHeader = allowedMethods.join(', ')

    if (request.method === 'OPTIONS') {
      response.set('Allow', allowHeader).status(204).end()
      return
    }

    if (!allowedMethods.some(method => method === request.method)) {
      response.set('Allow', allowHeader).status(405).json({ error: 'method_not_allowed' })
      return
    }

    next()
  })

  app.use('/api', rateLimit({
    legacyHeaders: false,
    limit: 300,
    passOnStoreError: false,
    standardHeaders: 'draft-8',
    store: new BoundedRateStore(),
    windowMs: 60_000,
  }))

  app.post(
    '/api/leads',
    rateLimit({
      legacyHeaders: false,
      limit: 6,
      passOnStoreError: false,
      standardHeaders: 'draft-8',
      store: new BoundedRateStore(),
      windowMs: 15 * 60_000,
    }),
    express.json({ limit: '16kb', strict: true }),
    async (request, response) => {
      const lead = parseLeadPayload(request.body)
      if (!lead) {
        response.status(400).json({ error: 'invalid_request' })
        return
      }

      if (!leadWebhookUrl) {
        response.status(503).json({ error: 'lead_destination_unconfigured' })
        return
      }

      if (inFlightLeadDeliveries >= maxConcurrentLeadDeliveries) {
        response.set('Retry-After', '5').status(503).json({ error: 'lead_delivery_busy' })
        return
      }

      inFlightLeadDeliveries += 1
      let webhookResponse: Response | undefined
      try {
        webhookResponse = await fetchImpl(leadWebhookUrl, {
          body: serializeLead(lead),
          headers: {
            'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
            'user-agent': 'TheTutorLyfe/1.0',
          },
          method: 'POST',
          redirect: 'error',
          signal: AbortSignal.timeout(10_000),
        })

        if (!webhookResponse.ok) {
          response.status(502).json({ error: 'lead_delivery_failed' })
          return
        }

        response.status(202).json({ ok: true })
      }
      catch {
        response.status(502).json({ error: 'lead_delivery_failed' })
      }
      finally {
        try {
          await webhookResponse?.body?.cancel()
        }
        catch {
          // A consumed or closed provider response still releases this slot.
        }
        inFlightLeadDeliveries -= 1
      }
    },
  )

  app.use('/api', (_request, response) => {
    response.status(404).json({ error: 'not_found' })
  })

  app.use((_request, response) => {
    response.status(404).json({ error: 'not_found' })
  })

  app.use((error: unknown, _request: express.Request, response: express.Response, next: express.NextFunction) => {
    if (response.headersSent) {
      next(error)
      return
    }

    if (
      error !== null
      && typeof error === 'object'
      && 'status' in error
      && (error.status === 400 || error.status === 413)
    ) {
      const status = error.status
      response.status(status).json({ error: status === 413 ? 'request_too_large' : 'invalid_request' })
      return
    }

    response.status(500).json({ error: 'internal_server_error' })
  })

  return app
}
