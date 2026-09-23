-- M1 Finance: user roles + deposit methods/requests

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'TRADER';

CREATE TABLE IF NOT EXISTS "DepositMethod" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "bankName" TEXT,
    "accountHolder" TEXT,
    "iban" TEXT,
    "asset" TEXT,
    "network" TEXT,
    "address" TEXT,
    "instructions" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DepositMethod_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DepositRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "methodId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    CONSTRAINT "DepositRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DepositRequest_userId_status_idx" ON "DepositRequest"("userId", "status");
CREATE INDEX IF NOT EXISTS "DepositRequest_status_idx" ON "DepositRequest"("status");

DO $$ BEGIN
  ALTER TABLE "DepositRequest" ADD CONSTRAINT "DepositRequest_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "DepositRequest" ADD CONSTRAINT "DepositRequest_methodId_fkey"
    FOREIGN KEY ("methodId") REFERENCES "DepositMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
