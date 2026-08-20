import createError from '@fastify/error'

export const TradeNotFoundError = createError(
  'TRADE_NOT_FOUND',
  'Trade not found',
  404,
)

export const TradeNotActiveError = createError(
  'TRADE_NOT_ACTIVE',
  'The trade is not active',
  409,
)
