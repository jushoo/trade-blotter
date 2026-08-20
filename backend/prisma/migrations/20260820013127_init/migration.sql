-- CreateEnum
CREATE TYPE "side" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "trade_status" AS ENUM ('ACTIVE', 'CANCELLED');

-- CreateTable
CREATE TABLE "trades" (
    "id" SERIAL NOT NULL,
    "symbol" TEXT NOT NULL,
    "side" "side" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "trader" TEXT NOT NULL,
    "trade_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "trade_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trades_symbol_idx" ON "trades"("symbol");

-- CreateIndex
CREATE INDEX "trades_status_idx" ON "trades"("status");

-- CreateIndex
CREATE INDEX "trades_trade_date_idx" ON "trades"("trade_date");
