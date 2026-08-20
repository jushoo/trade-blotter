import type { PrismaClient, Trade } from '../../generated/prisma/client'
import { makeTradeId, parseTradeId } from '../lib/trade-id'
import { TradeNotFoundError, TradeNotActiveError } from '../lib/errors'
import type { TradeDTO, TradeInput, TradePatch } from '../schemas/trade'

/** Map a database row to the canonical Trade DTO. The id is computed on read. */
export function toTradeDTO(row: Trade): TradeDTO {
  return {
    id: makeTradeId(row.id),
    symbol: row.symbol,
    quantity: row.quantity,
    price: row.price,
    side: row.side,
    trader: row.trader,
    tradeDate: row.tradeDate.toISOString(),
    status: row.status,
  }
}

export async function listTrades(prisma: PrismaClient): Promise<TradeDTO[]> {
  const rows = await prisma.trade.findMany({ orderBy: { tradeDate: 'desc' } })
  return rows.map(toTradeDTO)
}

export async function getTrade(
  prisma: PrismaClient,
  id: string,
): Promise<TradeDTO> {
  const serial = parseTradeId(id)
  if (serial === null) throw new TradeNotFoundError()

  const row = await prisma.trade.findUnique({ where: { id: serial } })
  if (!row) throw new TradeNotFoundError()
  return toTradeDTO(row)
}

export async function createTrade(
  prisma: PrismaClient,
  input: TradeInput,
): Promise<TradeDTO> {
  const row = await prisma.trade.create({ data: input })
  return toTradeDTO(row)
}

export async function amendTrade(
  prisma: PrismaClient,
  id: string,
  patch: TradePatch,
): Promise<TradeDTO> {
  const serial = parseTradeId(id)
  if (serial === null) throw new TradeNotFoundError()

  const existing = await prisma.trade.findUnique({ where: { id: serial } })
  if (!existing) throw new TradeNotFoundError()
  if (existing.status !== 'ACTIVE') throw new TradeNotActiveError()

  const row = await prisma.trade.update({
    where: { id: serial },
    data: { ...patch, updatedAt: new Date() },
  })
  return toTradeDTO(row)
}

export async function cancelTrade(
  prisma: PrismaClient,
  id: string,
): Promise<TradeDTO> {
  const serial = parseTradeId(id)
  if (serial === null) throw new TradeNotFoundError()

  const existing = await prisma.trade.findUnique({ where: { id: serial } })
  if (!existing) throw new TradeNotFoundError()
  if (existing.status === 'CANCELLED') throw new TradeNotActiveError()

  const row = await prisma.trade.update({
    where: { id: serial },
    data: { status: 'CANCELLED', updatedAt: new Date() },
  })
  return toTradeDTO(row)
}
