-- Additive only. Production already has `License` from `prisma db push`.
-- These columns are nullable. Existing rows stay valid and stay blank.
ALTER TABLE `License`
  ADD COLUMN `licenseType` VARCHAR(255) NULL,
  ADD COLUMN `jurisdiction` VARCHAR(255) NULL,
  ADD COLUMN `status` VARCHAR(255) NULL,
  ADD COLUMN `issuedOn` DATE NULL,
  ADD COLUMN `expiresOn` DATE NULL,
  ADD COLUMN `scope` TEXT NULL,
  ADD COLUMN `address` TEXT NULL;
