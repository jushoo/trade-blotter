import 'dotenv/config'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client.ts'

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

/** Shared Prisma bundle. Used by routes and by Better Auth. */
export const { prisma, pool } = createPrismaBundle(process.env.DATABASE_URL ?? '')
