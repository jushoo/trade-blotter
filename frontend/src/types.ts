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

/** Payload sent to POST /trades (create). Trader is set from the session. */
export type CreateTradeInput = {
  symbol: string
  side: Trade["side"]
  quantity: number
  price: number
}

/** Payload sent to PATCH /trades/:id (amend). All fields optional. */
export type AmendTradeInput = Partial<CreateTradeInput>
