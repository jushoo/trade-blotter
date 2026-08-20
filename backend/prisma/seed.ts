import 'dotenv/config'
import { faker } from '@faker-js/faker'
import type { Side, TradeStatus } from '../generated/prisma/client'
import { createPrismaBundle } from '../src/db'

// The seed only runs on an empty table, so re-running is safe and the sequence
// never needs a manual reset. To regenerate after a first run, truncate trades
// first. Seeded rows let the autoincrement sequence assign the ids (1..300), so
// the business ids become TRD-100001..100300.
const TRADE_COUNT = 300

// Fixed seed keeps the generated rows stable between runs.
const FAKER_SEED = 20260820

// Curated tickers with a rough base price, so generated prices stay plausible.
const TICKERS = [
  { symbol: 'AAPL', price: 227 },
  { symbol: 'MSFT', price: 534 },
  { symbol: 'NVDA', price: 160 },
  { symbol: 'TSLA', price: 342 },
  { symbol: 'AMZN', price: 220 },
  { symbol: 'GOOGL', price: 190 },
  { symbol: 'META', price: 600 },
  { symbol: 'AMD', price: 180 },
  { symbol: 'NFLX', price: 950 },
  { symbol: 'INTC', price: 25 },
  { symbol: 'JPM', price: 290 },
  { symbol: 'V', price: 350 },
  { symbol: 'WMT', price: 105 },
  { symbol: 'XOM', price: 115 },
  { symbol: 'KO', price: 70 },
  { symbol: 'DIS', price: 95 },
  { symbol: 'BA', price: 180 },
  { symbol: 'ORCL', price: 170 },
  { symbol: 'CRM', price: 260 },
  { symbol: 'ADBE', price: 400 },
  { symbol: 'PYPL', price: 90 },
  { symbol: 'UBER', price: 75 },
  { symbol: 'ABNB', price: 120 },
  { symbol: 'SHOP', price: 90 },
  { symbol: 'SQ', price: 90 },
]

type TradeRow = {
  symbol: string
  side: Side
  quantity: number
  price: number
  trader: string
  tradeDate: Date
  status: TradeStatus
}

faker.seed(FAKER_SEED)

// A stable set of trader codes ("JSMITH") built from generated names.
const traders = faker.helpers.uniqueArray(
  () =>
    `${faker.person.firstName()[0]}${faker.person.lastName()}`
      .toUpperCase()
      .replace(/[^A-Z]/g, ''),
  12,
)

const roundToCents = (n: number) => Math.round(n * 100) / 100

function makeTrade(): TradeRow {
  const { symbol, price: basePrice } = faker.helpers.arrayElement(TICKERS)
  return {
    symbol,
    side: faker.helpers.arrayElement(['BUY', 'SELL'] as const),
    // Lot sizes in multiples of 100, like the previous hand-written rows.
    quantity: faker.number.int({ min: 1, max: 200 }) * 100,
    price: roundToCents(basePrice * faker.number.float({ min: 0.97, max: 1.03 })),
    trader: faker.helpers.arrayElement(traders),
    tradeDate: faker.date.between({
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      to: new Date(),
    }),
    // Mostly active with a small share of cancelled trades.
    status: faker.helpers.weightedArrayElement([
      { value: 'ACTIVE' as const, weight: 9 },
      { value: 'CANCELLED' as const, weight: 1 },
    ]),
  }
}

async function main() {
  const databaseUrl = process.env['DATABASE_URL']
  if (!databaseUrl) throw new Error('DATABASE_URL is not set.')

  const { prisma, pool } = createPrismaBundle(databaseUrl)

  console.log('Seeding trades...')
  const count = await prisma.trade.count()
  if (count > 0) {
    console.log('Seed skipped: trades already present.')
    await prisma.$disconnect()
    await pool.end()
    return
  }

  const rows = faker.helpers.multiple(makeTrade, { count: TRADE_COUNT })
  await prisma.trade.createMany({ data: rows })
  console.log(`Seed complete: ${rows.length} trades inserted.`)

  await prisma.$disconnect()
  await pool.end()
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
