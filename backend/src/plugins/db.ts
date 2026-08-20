import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'
import type { PrismaClient } from '../../generated/prisma/client'
import { createPrismaBundle } from '../db'

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient
  }
}

async function dbPlugin(fastify: FastifyInstance) {
  const { prisma, pool } = createPrismaBundle(fastify.config.DATABASE_URL)

  fastify.decorate('prisma', prisma)

  fastify.addHook('onClose', async () => {
    await prisma.$disconnect()
    await pool.end()
  })
}

export default fp(dbPlugin, {
  name: 'db',
  dependencies: ['config'],
})
