import type { Trade, CreateTradeInput, AmendTradeInput } from "@/types"
import { tradeSchema, tradeArraySchema } from "@/lib/validation"

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000"

async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.json()
    if (typeof body?.error === "string") return body.error
    return JSON.stringify(body)
  } catch {
    return res.statusText
  }
}

/** Fetch all trades, newest trade date first. */
export async function fetchTrades(): Promise<Trade[]> {
  const res = await fetch(`${BASE_URL}/trades`, { credentials: "include" })
  if (!res.ok) throw new Error(await parseError(res))
  return tradeArraySchema.parse(await res.json())
}

/** Create a new trade. Returns the created trade. */
export async function createTrade(input: CreateTradeInput): Promise<Trade> {
  const res = await fetch(`${BASE_URL}/trades`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return tradeSchema.parse(await res.json())
}

/** Amend an active trade. Returns the amended trade. */
export async function amendTrade(
  id: string,
  input: AmendTradeInput,
): Promise<Trade> {
  const res = await fetch(`${BASE_URL}/trades/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return tradeSchema.parse(await res.json())
}

/** Cancel an active trade. Returns the cancelled trade. */
export async function cancelTrade(id: string): Promise<Trade> {
  const res = await fetch(`${BASE_URL}/trades/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  })
  if (!res.ok) throw new Error(await parseError(res))
  return tradeSchema.parse(await res.json())
}
