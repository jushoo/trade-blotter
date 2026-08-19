import type { Server, Socket } from 'socket.io'

// Trade event names. Keep these in sync with the frontend.
export const TRADE_EVENTS = {
  CREATED: 'trade:created',
  AMENDED: 'trade:amended',
  CANCELLED: 'trade:cancelled',
} as const

export function registerSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    console.log(`socket connected: ${socket.id}`)

    socket.on('disconnect', (reason) => {
      console.log(`socket disconnected: ${socket.id} (${reason})`)
    })
  })
}

// Helper: broadcast a trade event to all connected clients.
export function broadcastTrade(
  io: Server,
  event: (typeof TRADE_EVENTS)[keyof typeof TRADE_EVENTS],
  payload: unknown,
): void {
  io.emit(event, payload)
}
