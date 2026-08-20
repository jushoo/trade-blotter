import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'
import { Server, type Socket } from 'socket.io'
import { fromNodeHeaders } from 'better-auth/node'
import { auth } from '../lib/auth'

declare module 'fastify' {
  interface FastifyInstance {
    io: Server
  }
}

async function socketPlugin(fastify: FastifyInstance) {
  const io = new Server(fastify.server, {
    cors: {
      origin: fastify.config.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })

  io.use(async (socket: Socket, next) => {
    try {
      const result = await auth.api.getSession({
        headers: fromNodeHeaders(socket.handshake.headers),
      })
      if (!result) {
        return next(new Error('unauthorized'))
      }
      next()
    } catch (err) {
      next(err instanceof Error ? err : new Error('unauthorized'))
    }
  })

  io.on('connection', (socket: Socket) => {
    fastify.log.info({ socketId: socket.id }, 'socket connected')

    socket.on('disconnect', (reason) => {
      fastify.log.info({ socketId: socket.id, reason }, 'socket disconnected')
    })
  })

  fastify.decorate('io', io)

  fastify.addHook('onClose', async () => {
    await io.close()
  })
}

export default fp(socketPlugin, {
  name: 'socket',
  dependencies: ['config'],
})
