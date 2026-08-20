import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'
import type { Env } from '../schema/env'

declare module 'fastify' {
  interface FastifyInstance {
    config: Env
  }
}

async function configPlugin(fastify: FastifyInstance, options: { config: Env }) {
  fastify.decorate('config', options.config)
}

export default fp(configPlugin, {
  name: 'config',
})
