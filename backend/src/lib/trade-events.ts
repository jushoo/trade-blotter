import type { Server } from 'socket.io'
import type { TradeDTO } from '../schemas/trade'

export const TRADE_EVENTS = {
  CREATED: 'trade:created',
  AMENDED: 'trade:amended',
  CANCELLED: 'trade:cancelled',
} as const

export type TradeEventName = (typeof TRADE_EVENTS)[keyof typeof TRADE_EVENTS]

/** Broadcast a trade event to all connected clients. */
export function broadcastTrade(
  io: Server,
  event: TradeEventName,
  payload: TradeDTO,
): void {
  io.emit(event, payload)
}
