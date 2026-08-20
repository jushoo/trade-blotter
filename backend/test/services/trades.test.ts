import { describe, it, expect } from 'vitest'
import { toTradeDTO } from '../../src/services/trades'
import type { Trade } from '../../generated/prisma/client'

function makeRow(overrides: Partial<Trade> = {}): Trade {
  return {
    id: 1,
    symbol: 'AAPL',
    side: 'BUY',
    quantity: 5000,
    price: 227.45,
    trader: 'JSMITH',
    tradeDate: new Date('2026-08-18T09:15:23.000Z'),
    status: 'ACTIVE',
    createdAt: new Date('2026-08-18T09:15:23.000Z'),
    updatedAt: new Date('2026-08-18T09:15:23.000Z'),
    ...overrides,
  } as Trade
}

describe('toTradeDTO', () => {
  it('maps the serial id to the business id', () => {
    const dto = toTradeDTO(makeRow())

    expect(dto.id).toBe('TRD-100001')
    expect(dto.symbol).toBe('AAPL')
    expect(dto.side).toBe('BUY')
    expect(dto.quantity).toBe(5000)
    expect(dto.price).toBe(227.45)
    expect(dto.trader).toBe('JSMITH')
    expect(dto.tradeDate).toBe('2026-08-18T09:15:23.000Z')
    expect(dto.status).toBe('ACTIVE')
  })
})
