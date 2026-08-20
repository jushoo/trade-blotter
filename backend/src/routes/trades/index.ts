import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import {
  tradeSchema,
  tradeInputSchema,
  tradePatchSchema,
  tradeParamsSchema,
} from '../../schemas/trade'
import {
  listTrades,
  getTrade,
  createTrade,
  amendTrade,
  cancelTrade,
} from '../../services/trades'
import { broadcastTrade, TRADE_EVENTS } from '../../lib/trade-events'

const tradesRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // List all trades, newest trade date first.
  fastify.get(
    '/',
    {
      preHandler: [fastify.authenticate],
      schema: { response: { 200: tradeSchema.array() } },
    },
    async () => listTrades(fastify.prisma),
  )

  // Get one trade by its business id.
  fastify.get(
    '/:id',
    {
      preHandler: [fastify.authenticate],
      schema: { params: tradeParamsSchema, response: { 200: tradeSchema } },
    },
    async (request) => getTrade(fastify.prisma, request.params.id),
  )

  // Create a trade. The business id is derived from the autoincrement serial.
  fastify.post(
    '/',
    {
      preHandler: [fastify.authenticate],
      schema: { body: tradeInputSchema, response: { 201: tradeSchema } },
    },
    async (request, reply) => {
      const user = request.user
      if (!user) {
        const err = new Error('Unauthorized') as Error & { statusCode: number }
        err.statusCode = 401
        throw err
      }
      const dto = await createTrade(fastify.prisma, request.body, user)
      broadcastTrade(fastify.io, TRADE_EVENTS.CREATED, dto)
      reply.status(201)
      return dto
    },
  )

  // Amend a trade. Only allowed when the status is ACTIVE.
  fastify.patch(
    '/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: tradeParamsSchema,
        body: tradePatchSchema,
        response: { 200: tradeSchema },
      },
    },
    async (request) => {
      const dto = await amendTrade(fastify.prisma, request.params.id, request.body)
      broadcastTrade(fastify.io, TRADE_EVENTS.AMENDED, dto)
      return dto
    },
  )

  // Cancel a trade. A cancelled trade cannot be cancelled again.
  fastify.delete(
    '/:id',
    {
      preHandler: [fastify.authenticate],
      schema: { params: tradeParamsSchema, response: { 200: tradeSchema } },
    },
    async (request) => {
      const dto = await cancelTrade(fastify.prisma, request.params.id)
      broadcastTrade(fastify.io, TRADE_EVENTS.CANCELLED, dto)
      return dto
    },
  )
}

export default tradesRoutes
