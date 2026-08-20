import fp from 'fastify-plugin'
import cors from '@fastify/cors'
import type { FastifyInstance } from 'fastify'

async function corsPlugin(fastify: FastifyInstance) {
  const origins = fastify.config.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  await fastify.register(cors, {
    origin: origins.length === 1 ? origins[0] : origins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  })
}

export default fp(corsPlugin, {
  name: 'cors',
  dependencies: ['config'],
})
