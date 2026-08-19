import type { FastifyInstance } from 'fastify'

declare module 'fastify' {
  interface FastifyInstance {
    io: import('socket.io').Server
  }
}

export type { FastifyInstance }
