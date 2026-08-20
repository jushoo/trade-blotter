import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db'
import type { Trade as TradeRow } from '../../generated/prisma/client'
import { makeTradeId, parseTradeId } from '../lib/trade-id'
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

/** Map a database row to the canonical Trade DTO. The id is computed on read. */
function toTradeDTO(row: TradeRow): TradeDTO {
  return {
    id: makeTradeId(row.id),
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
    const rows = await prisma.trade.findMany({ orderBy: { tradeDate: 'desc' } })
    return rows.map(toTradeDTO)
  })

  // Get one trade by its business id.
  fastify.get<{ Params: { id: string } }>('/trades/:id', async (req, reply) => {
    const serial = parseTradeId(req.params.id)
    if (serial === null) return reply.code(404).send({ error: 'Trade not found' })

    const row = await prisma.trade.findUnique({ where: { id: serial } })
    if (!row) return reply.code(404).send({ error: 'Trade not found' })
    return toTradeDTO(row)
  })

  // Create a trade. The serial id comes from the autoincrement sequence and the
  // business id is derived from it when the row is read back.
  fastify.post('/trades', async (req, reply) => {
    const parsed = tradeInput.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() })

    const row = await prisma.trade.create({ data: parsed.data })

    const dto = toTradeDTO(row)
    broadcastTrade(fastify.io, TRADE_EVENTS.CREATED, dto)
    return reply.code(201).send(dto)
  })

  // Amend a trade. Only allowed when the status is ACTIVE.
  fastify.patch<{ Params: { id: string } }>('/trades/:id', async (req, reply) => {
    const parsed = tradePatch.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() })

    const serial = parseTradeId(req.params.id)
    if (serial === null) return reply.code(404).send({ error: 'Trade not found' })

    const existing = await prisma.trade.findUnique({ where: { id: serial } })
    if (!existing) return reply.code(404).send({ error: 'Trade not found' })
    if (existing.status !== 'ACTIVE') {
      return reply.code(409).send({ error: 'The trade is not active' })
    }

    const row = await prisma.trade.update({
      where: { id: serial },
      data: { ...parsed.data, updatedAt: new Date() },
    })

    const dto = toTradeDTO(row)
    broadcastTrade(fastify.io, TRADE_EVENTS.AMENDED, dto)
    return dto
  })

  // Cancel a trade. Sets the status to CANCELLED. Idempotent guard: a cancelled
  // trade cannot be cancelled again.
  fastify.delete<{ Params: { id: string } }>('/trades/:id', async (req, reply) => {
    const serial = parseTradeId(req.params.id)
    if (serial === null) return reply.code(404).send({ error: 'Trade not found' })

    const existing = await prisma.trade.findUnique({ where: { id: serial } })
    if (!existing) return reply.code(404).send({ error: 'Trade not found' })
    if (existing.status === 'CANCELLED') {
      return reply.code(409).send({ error: 'The trade is not active' })
    }

    const row = await prisma.trade.update({
      where: { id: serial },
      data: { status: 'CANCELLED', updatedAt: new Date() },
    })

    const dto = toTradeDTO(row)
    broadcastTrade(fastify.io, TRADE_EVENTS.CANCELLED, dto)
    return dto
  })
}
