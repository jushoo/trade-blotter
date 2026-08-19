import { pgTable, pgEnum, serial, text, integer, doublePrecision, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core'

export const side = pgEnum('side', ['BUY', 'SELL'])

export const tradeStatus = pgEnum('trade_status', [
  'PENDING',
  'OPEN',
  'FILLED',
  'PARTIAL',
  'CANCELLED',
  'REJECTED',
])

export const trades = pgTable(
  'trades',
  {
    id: serial('id').primaryKey(),
    symbol: text('symbol').notNull(),
    side: side('side').notNull(),
    quantity: integer('quantity').notNull(),
    price: doublePrecision('price').notNull(),
    status: tradeStatus('status').notNull().default('OPEN'),
    counterparty: text('counterparty'),
    trader: text('trader'),
    reference: text('reference'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    referenceUq: uniqueIndex('trades_reference_uq').on(t.reference),
    symbolIdx: index('trades_symbol_idx').on(t.symbol),
    statusIdx: index('trades_status_idx').on(t.status),
    createdIdx: index('trades_created_at_idx').on(t.createdAt),
  }),
)

export type Trade = typeof trades.$inferSelect
export type NewTrade = typeof trades.$inferInsert
