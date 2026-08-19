/**
 * Canonical trade model. Matches the backend API exactly.
 */
export interface Trade {
  id: string
  symbol: string
  quantity: number
  price: number
  side: "BUY" | "SELL"
  trader: string
  tradeDate: string
  status: "ACTIVE" | "CANCELLED"
}

/** Payload sent to POST /trades (create). */
export type CreateTradeInput = {
  symbol: string
  side: Trade["side"]
  quantity: number
  price: number
  trader: string
}

/** Payload sent to PATCH /trades/:id (amend). All fields optional. */
export type AmendTradeInput = Partial<CreateTradeInput>
