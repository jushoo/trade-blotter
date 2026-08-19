import 'dotenv/config'
import { db, trades } from './db'

const rows = [
  {
    tradeId: 'TRD-100001',
    symbol: 'AAPL',
    side: 'BUY' as const,
    quantity: 5000,
    price: 227.45,
    trader: 'JSMITH',
    tradeDate: new Date('2026-08-18T09:15:23Z'),
    status: 'ACTIVE' as const,
  },
  {
    tradeId: 'TRD-100002',
    symbol: 'MSFT',
    side: 'SELL' as const,
    quantity: 1200,
    price: 534.22,
    trader: 'ABROWN',
    tradeDate: new Date('2026-08-18T09:18:54Z'),
    status: 'ACTIVE' as const,
  },
  {
    tradeId: 'TRD-100003',
    symbol: 'TSLA',
    side: 'BUY' as const,
    quantity: 800,
    price: 341.75,
    trader: 'MJONES',
    tradeDate: new Date('2026-08-18T09:20:11Z'),
    status: 'CANCELLED' as const,
  },
]

async function main() {
  console.log('Seeding trades...')
  await db.insert(trades).values(rows).onConflictDoNothing({ target: trades.tradeId })
  console.log('Seed complete.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => process.exit())
