import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { db, trades } from '../db'
import { eq, desc } from 'drizzle-orm'
import { broadcastTrade, TRADE_EVENTS } from '../plugins/socket'

const tradeInput = z.object({
  symbol: z.string().min(1).max(16),
  side: z.enum(['BUY', 'SELL']),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
  counterparty: z.string().optional(),
  trader: z.string().optional(),
  reference: z.string().optional(),
})

const tradePatch = z.object({
  quantity: z.number().int().positive().optional(),
  price: z.number().positive().optional(),
  status: z.enum(['PENDING', 'OPEN', 'FILLED', 'PARTIAL', 'CANCELLED', 'REJECTED']).optional(),
  counterparty: z.string().optional(),
  trader: z.string().optional(),
})

export const tradesRoutes: FastifyPluginAsync = async (fastify) => {
  // List trades.
  fastify.get('/trades', async () => {
    return db.select().from(trades).orderBy(desc(trades.createdAt))
  })

  // Get one trade.
  fastify.get<{ Params: { id: string } }>('/trades/:id', async (req, reply) => {
    const [trade] = await db.select().from(trades).where(eq(trades.id, Number(req.params.id)))
    if (!trade) return reply.code(404).send({ error: 'Trade not found' })
    return trade
  })

  // Create a trade.
  fastify.post('/trades', async (req, reply) => {
    const parsed = tradeInput.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() })
    const [trade] = await db.insert(trades).values(parsed.data).returning()
    broadcastTrade(fastify.io, TRADE_EVENTS.CREATED, trade)
    return reply.code(201).send(trade)
  })

  // Amend a trade.
  fastify.patch<{ Params: { id: string } }>('/trades/:id', async (req, reply) => {
    const parsed = tradePatch.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() })
    const [trade] = await db
      .update(trades)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(trades.id, Number(req.params.id)))
      .returning()
    if (!trade) return reply.code(404).send({ error: 'Trade not found' })
    broadcastTrade(fastify.io, TRADE_EVENTS.UPDATED, trade)
    return trade
  })

  // Cancel a trade.
  fastify.delete<{ Params: { id: string } }>('/trades/:id', async (req, reply) => {
    const [trade] = await db
      .update(trades)
      .set({ status: 'CANCELLED', updatedAt: new Date() })
      .where(eq(trades.id, Number(req.params.id)))
      .returning()
    if (!trade) return reply.code(404).send({ error: 'Trade not found' })
    broadcastTrade(fastify.io, TRADE_EVENTS.CANCELLED, trade)
    return trade
  })
}
