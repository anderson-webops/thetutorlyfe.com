import type { ClientRateLimitInfo, Options, Store } from 'express-rate-limit'

const defaultMaximumKeys = 2_048

/**
 * Preserve normal per-client windows while bounding memory. Once the key limit
 * is reached, new identities share one strict overflow bucket until expiry.
 */
export class BoundedRateStore implements Store {
  readonly localKeys = true
  private readonly counters = new Map<string, ClientRateLimitInfo>()
  private lastTime = 0
  private overflow: ClientRateLimitInfo | undefined
  private windowMs = 60_000

  constructor(
    private readonly maxKeys = defaultMaximumKeys,
    private readonly clock = Date.now,
  ) {
    if (!Number.isSafeInteger(maxKeys) || maxKeys < 1)
      throw new RangeError('maxKeys must be a positive safe integer')
  }

  init(options: Options) {
    this.windowMs = options.windowMs
  }

  private now() {
    this.lastTime = Math.max(this.lastTime, this.clock())
    return this.lastTime
  }

  private prune(now: number) {
    for (const [key, value] of this.counters) {
      if (value.resetTime!.getTime() > now)
        break
      this.counters.delete(key)
    }

    if (this.overflow && this.overflow.resetTime!.getTime() <= now)
      this.overflow = undefined
  }

  increment(key: string): ClientRateLimitInfo {
    const now = this.now()
    this.prune(now)
    let value = this.counters.get(key)

    if (!value) {
      if (this.counters.size < this.maxKeys) {
        value = { totalHits: 0, resetTime: new Date(now + this.windowMs) }
        this.counters.set(key, value)
      }
      else {
        this.overflow ??= { totalHits: 0, resetTime: new Date(now + this.windowMs) }
        value = this.overflow
      }
    }

    value.totalHits = Math.min(Number.MAX_SAFE_INTEGER, value.totalHits + 1)
    return { ...value }
  }

  decrement(key: string) {
    this.prune(this.now())
    const value = this.counters.get(key)
    if (value)
      value.totalHits = Math.max(0, value.totalHits - 1)
  }

  resetKey(key: string) {
    this.counters.delete(key)
  }

  resetAll() {
    this.counters.clear()
    this.overflow = undefined
  }

  shutdown() {
    this.resetAll()
  }
}
