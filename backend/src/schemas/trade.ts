import { z } from 'zod'

export const sideSchema = z.enum(['BUY', 'SELL'])
export const statusSchema = z.enum(['ACTIVE', 'CANCELLED'])

/** Canonical trade object sent to and received by the API. */
export const tradeSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
  side: sideSchema,
  trader: z.string(),
  tradeDate: z.string().datetime(),
  status: statusSchema,
})

export const tradeInputSchema = z.object({
  symbol: z.string().min(1).max(16),
  side: sideSchema,
  quantity: z.number().int().positive(),
  price: z.number().positive(),
})

export const tradePatchSchema = tradeInputSchema.partial()

export const tradeParamsSchema = z.object({
  id: z.string().min(1),
})

export type TradeDTO = z.infer<typeof tradeSchema>
export type TradeInput = z.infer<typeof tradeInputSchema>
export type TradePatch = z.infer<typeof tradePatchSchema>
export type TradeParams = z.infer<typeof tradeParamsSchema>
