import { io, type Socket } from "socket.io-client"
import type { Trade } from "@/types"

const URL = "http://localhost:4000"

export const TRADE_EVENTS = {
  CREATED: "trade:created",
  AMENDED: "trade:amended",
  CANCELLED: "trade:cancelled",
} as const

export type TradeEventName =
  (typeof TRADE_EVENTS)[keyof typeof TRADE_EVENTS]

export type TradeListener = (trade: Trade) => void

let socket: Socket | null = null

/** Singleton socket client. Connects once, reused across components. */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(URL, { transports: ["websocket"] })
  }
  return socket
}
