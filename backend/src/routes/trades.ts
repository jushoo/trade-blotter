import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { db, trades, type Trade as TradeRow } from '../db'
import { eq, desc } from 'drizzle-orm'
import { broadcastTrade, TRADE_EVENTS } from '../plugins/socket'

/**
 * Canonical trade object sent to and received by the API.
 * Only these eight fields cross the API boundary.
 */
export interface TradeDTO {
  id: string
  symbol: string
  quantity: number
  price: number
  side: 'BUY' | 'SELL'
  trader: string
  tradeDate: string
  status: 'ACTIVE' | 'CANCELLED'
}

/** Map a database row to the canonical Trade DTO. */
function toTradeDTO(row: TradeRow): TradeDTO {
  return {
    id: row.tradeId,
    symbol: row.symbol,
    quantity: row.quantity,
    price: row.price,
    side: row.side,
    trader: row.trader,
    tradeDate: row.tradeDate.toISOString(),
    status: row.status,
  }
}

const tradeInput = z.object({
  symbol: z.string().min(1).max(16),
  side: z.enum(['BUY', 'SELL']),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
  trader: z.string().min(1).max(32),
})

const tradePatch = z.object({
  symbol: z.string().min(1).max(16).optional(),
  side: z.enum(['BUY', 'SELL']).optional(),
  quantity: z.number().int().positive().optional(),
  price: z.number().positive().optional(),
  trader: z.string().min(1).max(32).optional(),
})

export const tradesRoutes: FastifyPluginAsync = async (fastify) => {
  // List all trades, newest trade date first.
  fastify.get('/trades', async () => {
    const rows = await db.select().from(trades).orderBy(desc(trades.tradeDate))
    return rows.map(toTradeDTO)
  })

  // Get one trade by its business id.
  fastify.get<{ Params: { id: string } }>('/trades/:id', async (req, reply) => {
    const [row] = await db.select().from(trades).where(eq(trades.tradeId, req.params.id))
    if (!row) return reply.code(404).send({ error: 'Trade not found' })
    return toTradeDTO(row)
  })

  // Create a trade. The tradeId is a Postgres generated column derived from
  // the serial id, so a single INSERT produces the full row.
  fastify.post('/trades', async (req, reply) => {
    const parsed = tradeInput.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() })

    const [row] = await db
      .insert(trades)
      .values(parsed.data)
      .returning()
    if (!row) throw new Error('Insert returned no row')

    const dto = toTradeDTO(row)
    broadcastTrade(fastify.io, TRADE_EVENTS.CREATED, dto)
    return reply.code(201).send(dto)
  })

  // Amend a trade. Only allowed when the status is ACTIVE.
  fastify.patch<{ Params: { id: string } }>('/trades/:id', async (req, reply) => {
    const parsed = tradePatch.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() })

    const [existing] = await db.select().from(trades).where(eq(trades.tradeId, req.params.id))
    if (!existing) return reply.code(404).send({ error: 'Trade not found' })
    if (existing.status !== 'ACTIVE') {
      return reply.code(409).send({ error: 'The trade is not active' })
    }

    const [row] = await db
      .update(trades)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(trades.tradeId, req.params.id))
      .returning()
    if (!row) return reply.code(404).send({ error: 'Trade not found' })

    const dto = toTradeDTO(row)
    broadcastTrade(fastify.io, TRADE_EVENTS.AMENDED, dto)
    return dto
  })

  // Cancel a trade. Sets the status to CANCELLED. Idempotent guard: a cancelled
  // trade cannot be cancelled again.
  fastify.delete<{ Params: { id: string } }>('/trades/:id', async (req, reply) => {
    const [existing] = await db.select().from(trades).where(eq(trades.tradeId, req.params.id))
    if (!existing) return reply.code(404).send({ error: 'Trade not found' })
    if (existing.status === 'CANCELLED') {
      return reply.code(409).send({ error: 'The trade is not active' })
    }

    const [row] = await db
      .update(trades)
      .set({ status: 'CANCELLED', updatedAt: new Date() })
      .where(eq(trades.tradeId, req.params.id))
      .returning()
    if (!row) return reply.code(404).send({ error: 'Trade not found' })

    const dto = toTradeDTO(row)
    broadcastTrade(fastify.io, TRADE_EVENTS.CANCELLED, dto)
    return dto
  })
}
