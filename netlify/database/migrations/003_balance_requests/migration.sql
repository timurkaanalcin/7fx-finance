-- M1 Finance: margin-call balance reset / add requests (admin approval required)

CREATE TABLE IF NOT EXISTS "BalanceRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reason" TEXT NOT NULL DEFAULT 'MARGIN_CALL',
    "adminNote" TEXT,
    "equityAt" DOUBLE PRECISION,
    "marginLvl" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    CONSTRAINT "BalanceRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "BalanceRequest_userId_status_idx" ON "BalanceRequest"("userId", "status");
CREATE INDEX IF NOT EXISTS "BalanceRequest_status_idx" ON "BalanceRequest"("status");

DO $$ BEGIN
  ALTER TABLE "BalanceRequest" ADD CONSTRAINT "BalanceRequest_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
