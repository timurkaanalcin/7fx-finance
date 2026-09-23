-- Referral / invite code for registration (MySQL-compatible; Railway uses prisma db push)

CREATE TABLE IF NOT EXISTS `SystemSettings` (
    `id` VARCHAR(191) NOT NULL,
    `referralCode` VARCHAR(64) NOT NULL DEFAULT '3526754',
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `SystemSettings` (`id`, `referralCode`, `updatedAt`)
VALUES ('default', '3526754', CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE `id` = `id`;

ALTER TABLE `User` ADD COLUMN `referralCodeUsed` VARCHAR(64) NULL;
