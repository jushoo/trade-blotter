import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'
import type { PrismaClient } from '../../generated/prisma/client'
import { prisma, pool } from '../db'

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient
  }
}

async function dbPlugin(fastify: FastifyInstance) {
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
