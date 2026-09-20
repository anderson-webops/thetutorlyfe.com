import type { Options } from 'express-rate-limit'
import { describe, expect, it } from 'vitest'

import { BoundedRateStore } from '../src/boundedRateStore.js'

describe('bounded rate storage', () => {
  it('preserves established windows and collapses excess identities into one strict bucket', () => {
    let now = 0
    const store = new BoundedRateStore(4, () => now)
    store.init({ windowMs: 60_000 } as Options)

    for (let index = 0; index < 4; index++)
      expect(store.increment(String(index)).totalHits).toBe(1)

    expect(store.increment('0').totalHits).toBe(2)
    for (let index = 0; index < 50_000; index++)
      expect(store.increment(`overflow-${index}`).totalHits).toBe(index + 1)

    store.decrement('unknown-overflow-identity')
    expect(store.increment('new-overflow').totalHits).toBe(50_001)
    expect(store.increment('0').totalHits).toBe(3)
    now = 60_000
    expect(store.increment('new-window').totalHits).toBe(1)
    expect(store.increment('0').totalHits).toBe(1)
    store.shutdown()
  })

  it('rejects an unusable capacity', () => {
    expect(() => new BoundedRateStore(0)).toThrow(RangeError)
  })
})
