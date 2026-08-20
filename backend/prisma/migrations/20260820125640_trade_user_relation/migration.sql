-- AlterTable
ALTER TABLE "trades" ADD COLUMN     "user_id" TEXT;

-- CreateIndex
CREATE INDEX "trades_user_id_idx" ON "trades"("user_id");

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
