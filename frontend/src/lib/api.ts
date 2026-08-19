import type { Trade, CreateTradeInput, AmendTradeInput } from "@/types"

const BASE_URL = "http://localhost:4000"

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
  const res = await fetch(`${BASE_URL}/trades`)
  if (!res.ok) throw new Error(await parseError(res))
  return res.json() as Promise<Trade[]>
}

/** Fetch one trade by its business id. */
export async function fetchTrade(id: string): Promise<Trade> {
  const res = await fetch(`${BASE_URL}/trades/${encodeURIComponent(id)}`)
  if (!res.ok) throw new Error(await parseError(res))
  return res.json() as Promise<Trade>
}

/** Create a new trade. Returns the created trade. */
export async function createTrade(input: CreateTradeInput): Promise<Trade> {
  const res = await fetch(`${BASE_URL}/trades`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json() as Promise<Trade>
}

/** Amend an active trade. Returns the amended trade. */
export async function amendTrade(
  id: string,
  input: AmendTradeInput,
): Promise<Trade> {
  const res = await fetch(`${BASE_URL}/trades/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json() as Promise<Trade>
}

/** Cancel an active trade. Returns the cancelled trade. */
export async function cancelTrade(id: string): Promise<Trade> {
  const res = await fetch(`${BASE_URL}/trades/${encodeURIComponent(id)}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json() as Promise<Trade>
}
