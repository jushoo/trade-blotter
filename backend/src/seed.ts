import 'dotenv/config'
import { db, trades } from './db'

const rows = [
  {
    symbol: 'AAPL',
    side: 'BUY' as const,
    quantity: 100,
    price: 224.5,
    status: 'FILLED' as const,
    counterparty: 'Goldman Sachs',
    trader: 'A. Khan',
    reference: 'AAPL-100',
  },
  {
    symbol: 'MSFT',
    side: 'SELL' as const,
    quantity: 50,
    price: 431.2,
    status: 'OPEN' as const,
    counterparty: 'Morgan Stanley',
    trader: 'A. Khan',
    reference: 'MSFT-50',
  },
  {
    symbol: 'NVDA',
    side: 'BUY' as const,
    quantity: 25,
    price: 138.7,
    status: 'PARTIAL' as const,
    counterparty: 'JPMorgan',
    trader: 'M. Lopez',
    reference: 'NVDA-25',
  },
]

async function main() {
  console.log('Seeding trades...')
  await db.insert(trades).values(rows).onConflictDoNothing()
  console.log('Seed complete.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => process.exit())
