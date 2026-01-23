/*
  Warnings:

  - A unique constraint covering the columns `[txHash]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nowPaymentId]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "TxStatus" ADD VALUE 'EXPIRED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TxType" ADD VALUE 'BET';
ALTER TYPE "TxType" ADD VALUE 'WIN';

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "blockNumber" INTEGER,
ADD COLUMN     "confirmations" INTEGER DEFAULT 0,
ADD COLUMN     "cryptoAmount" TEXT,
ADD COLUMN     "cryptoCurrency" TEXT,
ADD COLUMN     "exchangeRate" TEXT,
ADD COLUMN     "fromAddress" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "netAmount" BIGINT,
ADD COLUMN     "nowPaymentId" TEXT,
ADD COLUMN     "paymentExpiry" TIMESTAMP(3),
ADD COLUMN     "paymentUrl" TEXT,
ADD COLUMN     "toAddress" TEXT,
ADD COLUMN     "txHash" TEXT,
ADD COLUMN     "usdtAmount" TEXT,
ADD COLUMN     "withdrawalFee" BIGINT;

-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "withdrawalAddress" TEXT,
ADD COLUMN     "withdrawalNetwork" TEXT DEFAULT 'TRC20';

-- CreateTable
CREATE TABLE "SupportedCrypto" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "network" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "minDepositUsd" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "icon" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "totalDeposits" INTEGER NOT NULL DEFAULT 0,
    "totalVolume" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportedCrypto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentSettings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SupportedCrypto_symbol_key" ON "SupportedCrypto"("symbol");

-- CreateIndex
CREATE INDEX "SupportedCrypto_isActive_orderIndex_idx" ON "SupportedCrypto"("isActive", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentSettings_key_key" ON "PaymentSettings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_txHash_key" ON "Transaction"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_nowPaymentId_key" ON "Transaction"("nowPaymentId");

-- CreateIndex
CREATE INDEX "Transaction_walletId_idx" ON "Transaction"("walletId");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE INDEX "Transaction_type_idx" ON "Transaction"("type");

-- CreateIndex
CREATE INDEX "Transaction_nowPaymentId_idx" ON "Transaction"("nowPaymentId");

-- CreateIndex
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");
