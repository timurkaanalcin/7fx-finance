-- Update default referral code to 213950812; add optional referralRequired flag
-- On Railway, schema is applied via `prisma db push` at start — this file is documentation / Netlify fallback.

-- ADD COLUMN may already exist after prisma db push; ignore duplicate-column errors if run manually.
ALTER TABLE `SystemSettings`
  ADD COLUMN `referralRequired` BOOLEAN NOT NULL DEFAULT true;

UPDATE `SystemSettings`
SET `referralCode` = '213950812', `updatedAt` = CURRENT_TIMESTAMP(3)
WHERE `id` = 'default'
  AND (`referralCode` = '3526754' OR `referralCode` IS NULL OR `referralCode` = '');

INSERT INTO `SystemSettings` (`id`, `referralCode`, `referralRequired`, `updatedAt`)
VALUES ('default', '213950812', true, CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE `id` = `id`;
