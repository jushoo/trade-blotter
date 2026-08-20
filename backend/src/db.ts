import 'dotenv/config'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

const url = process.env['DATABASE_URL']
if (!url) throw new Error('DATABASE_URL is not set.')

const pool = new pg.Pool({ connectionString: url })
const adapter = new PrismaPg(pool)

export const prisma = new PrismaClient({ adapter })
