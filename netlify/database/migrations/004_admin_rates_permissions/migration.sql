-- M1 Finance: admin permissions, trading rates, symbol overrides, audit log

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "canManageUsers" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "canApproveDeposits" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "canEditRates" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "canManageMethods" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "canAdjustBalance" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS "TradingSettings" (
    "id" TEXT NOT NULL,
    "spreadMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "commissionPerLot" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "defaultLeverage" INTEGER NOT NULL DEFAULT 100,
    "marginCallThresholdPct" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "defaultMinVolume" DOUBLE PRECISION NOT NULL DEFAULT 0.01,
    "defaultMaxVolume" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "defaultContractMult" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TradingSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "TradingSettings" ("id", "spreadMultiplier", "commissionPerLot", "defaultLeverage", "marginCallThresholdPct", "defaultMinVolume", "defaultMaxVolume", "defaultContractMult", "updatedAt")
VALUES ('default', 1, 0, 100, 50, 0.01, 100, 1, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

CREATE TABLE IF NOT EXISTS "SymbolSettings" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "spreadAbs" DOUBLE PRECISION,
    "spreadMultiplier" DOUBLE PRECISION,
    "contractMultiplier" DOUBLE PRECISION,
    "minVolume" DOUBLE PRECISION,
    "maxVolume" DOUBLE PRECISION,
    "commissionPerLot" DOUBLE PRECISION,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SymbolSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SymbolSettings_symbol_key" ON "SymbolSettings"("symbol");

CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetId" TEXT,
    "note" TEXT,
    "meta" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AuditLog_adminId_createdAt_idx" ON "AuditLog"("adminId", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action");

DO $$ BEGIN
  ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminId_fkey"
    FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
