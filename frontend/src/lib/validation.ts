import { z } from "zod"
import type { CreateTradeInput, AmendTradeInput } from "@/types"

/** Shared validation schemas for create and amend. Form values are all
 * strings (inputs); numbers are parsed at submit time. */

export const sideSchema = z.enum(["BUY", "SELL"])

export const tradeSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  quantity: z.number(),
  price: z.number(),
  side: sideSchema,
  trader: z.string(),
  tradeDate: z.string(),
  status: z.enum(["ACTIVE", "CANCELLED"]),
})

export const tradeArraySchema = z.array(tradeSchema)

const positiveIntString = z
  .string()
  .min(1, "Quantity is required.")
  .refine((v) => /^\d+$/.test(v) && Number(v) > 0, "Quantity must be a positive integer.")

const positiveNumberString = z
  .string()
  .min(1, "Price is required.")
  .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, "Price must be greater than 0.")

export const createTradeSchema = z.object({
  symbol: z.string().min(1, "Symbol is required.").max(16, "Symbol must be 16 chars or fewer."),
  side: sideSchema,
  quantity: positiveIntString,
  price: positiveNumberString,
  trader: z.string().min(1, "Trader is required.").max(32, "Trader must be 32 chars or fewer."),
})

export const amendTradeSchema = z.object({
  symbol: z.string().min(1).max(16).optional(),
  side: sideSchema.optional(),
  quantity: positiveIntString.optional(),
  price: positiveNumberString.optional(),
  trader: z.string().min(1).max(32).optional(),
})

export type CreateFormValues = z.infer<typeof createTradeSchema>
export type AmendFormValues = z.infer<typeof amendTradeSchema>

export const createFormDefaults: CreateFormValues = {
  symbol: "",
  side: "BUY",
  quantity: "",
  price: "",
  trader: "",
}

/** Convert create form values to the API input. */
export function toCreateInput(values: CreateFormValues): CreateTradeInput {
  return {
    symbol: values.symbol.trim(),
    side: values.side,
    quantity: Number(values.quantity),
    price: Number(values.price),
    trader: values.trader.trim(),
  }
}

/** Convert amend form values to the API input. Empty/undefined fields are
 * omitted so the backend keeps the existing value. */
export function toAmendInput(values: AmendFormValues): AmendTradeInput {
  const out: AmendTradeInput = {}
  if (values.symbol?.trim()) out.symbol = values.symbol.trim()
  if (values.side) out.side = values.side
  if (values.quantity?.trim()) out.quantity = Number(values.quantity)
  if (values.price?.trim()) out.price = Number(values.price)
  if (values.trader?.trim()) out.trader = values.trader.trim()
  return out
}
