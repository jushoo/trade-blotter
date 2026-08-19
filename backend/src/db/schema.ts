import { pgTable, pgEnum, serial, text, integer, doublePrecision, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core'

export const side = pgEnum('side', ['BUY', 'SELL'])

export const tradeStatus = pgEnum('trade_status', ['ACTIVE', 'CANCELLED'])

export const trades = pgTable(
  'trades',
  {
    // Internal serial primary key. Not exposed by the API.
    id: serial('id').primaryKey(),
    // Business id string, e.g. "TRD-100001". Unique. Set by the server.
    tradeId: text('trade_id').notNull(),
    symbol: text('symbol').notNull(),
    side: side('side').notNull(),
    quantity: integer('quantity').notNull(),
    price: doublePrecision('price').notNull(),
    trader: text('trader').notNull(),
    // Canonical trade date. Server sets it on create. Amend does not change it.
    tradeDate: timestamp('trade_date', { withTimezone: true }).notNull().defaultNow(),
    status: tradeStatus('status').notNull().default('ACTIVE'),
    // Audit columns. Not exposed by the API.
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tradeIdUq: uniqueIndex('trades_trade_id_uq').on(t.tradeId),
    symbolIdx: index('trades_symbol_idx').on(t.symbol),
    statusIdx: index('trades_status_idx').on(t.status),
    tradeDateIdx: index('trades_trade_date_idx').on(t.tradeDate),
  }),
)

export type Trade = typeof trades.$inferSelect
export type NewTrade = typeof trades.$inferInsert
