import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'
import { Server, type Socket } from 'socket.io'

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
    },
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
