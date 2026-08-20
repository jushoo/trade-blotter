import 'dotenv/config'
import { prisma } from '../src/db'

// Seed rows let the autoincrement sequence assign the ids (1, 2, 3), so the
// business ids become TRD-100001..100003. The seed only runs on an empty table,
// so re-running is safe and the sequence never needs a manual reset.
const rows = [
  {
    symbol: 'AAPL',
    side: 'BUY' as const,
    quantity: 5000,
    price: 227.45,
    trader: 'JSMITH',
    tradeDate: new Date('2026-08-18T09:15:23Z'),
    status: 'ACTIVE' as const,
  },
  {
    symbol: 'MSFT',
    side: 'SELL' as const,
    quantity: 1200,
    price: 534.22,
    trader: 'ABROWN',
    tradeDate: new Date('2026-08-18T09:18:54Z'),
    status: 'ACTIVE' as const,
  },
  {
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
  const count = await prisma.trade.count()
  if (count > 0) {
    console.log('Seed skipped: trades already present.')
    return
  }

  await prisma.trade.createMany({ data: rows })
  console.log('Seed complete.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => process.exit())
