import { describe, it, expect } from 'vitest'
import { makeTradeId, parseTradeId } from '../src/lib/trade-id'

describe('makeTradeId', () => {
  it('adds the serial offset', () => {
    expect(makeTradeId(1)).toBe('TRD-100001')
    expect(makeTradeId(3)).toBe('TRD-100003')
  })
})

describe('parseTradeId', () => {
  it('returns the serial for a valid business id', () => {
    expect(parseTradeId('TRD-100001')).toBe(1)
    expect(parseTradeId('TRD-100003')).toBe(3)
  })

  it('returns null for invalid ids', () => {
    expect(parseTradeId('TRD-000000')).toBeNull()
    expect(parseTradeId('TRD-0')).toBeNull()
    expect(parseTradeId('X-100001')).toBeNull()
    expect(parseTradeId('')).toBeNull()
  })
})
