import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

export interface PrismaBundle {
  prisma: PrismaClient
  pool: pg.Pool
}

/** Create a Prisma client and its pg pool. The caller owns both lifecycles. */
export function createPrismaBundle(databaseUrl: string): PrismaBundle {
  const pool = new pg.Pool({ connectionString: databaseUrl })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })
  return { prisma, pool }
}
