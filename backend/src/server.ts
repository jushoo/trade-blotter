import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { Server } from 'socket.io'
import { tradesRoutes } from './routes/trades'
import { registerSocketHandlers } from './plugins/socket'

const PORT = Number(process.env['PORT'] ?? 4000)
const HOST = process.env['HOST'] ?? '0.0.0.0'
const CORS_ORIGIN = process.env['CORS_ORIGIN'] ?? 'http://localhost:5173'

async function start() {
  const fastify = Fastify({ logger: true })

  await fastify.register(cors, {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  })

  // Attach Socket.IO to the Fastify underlying HTTP server.
  const io = new Server(fastify.server, {
    cors: { origin: CORS_ORIGIN, methods: ['GET', 'POST'] },
  })

  fastify.decorate('io', io)

  await fastify.register(tradesRoutes)
  registerSocketHandlers(io)

  await fastify.listen({ port: PORT, host: HOST })
  fastify.log.info(`Backend HTTP+WS listening on http://${HOST}:${PORT}`)
}

start().catch((error) => {
  console.error(error)
  process.exit(1)
})
