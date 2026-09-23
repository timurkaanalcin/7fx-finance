/**
 * Singleton system settings (referral / invite code, etc.).
 */
import { prisma } from "./prisma";

export const DEFAULT_REFERRAL_CODE = "3526754";

export type SystemSettingsRow = {
  id: string;
  referralCode: string;
  updatedAt?: Date;
};

const DEFAULTS: SystemSettingsRow = {
  id: "default",
  referralCode: DEFAULT_REFERRAL_CODE,
};

let cache: { at: number; row: SystemSettingsRow } | null = null;
const TTL_MS = 5_000;

export function invalidateSystemSettingsCache() {
  cache = null;
}

export async function ensureSystemSettings(): Promise<SystemSettingsRow> {
  try {
    const row = await prisma.systemSettings.upsert({
      where: { id: "default" },
      update: {},
      create: {
        id: "default",
        referralCode: DEFAULT_REFERRAL_CODE,
      },
    });
    return row;
  } catch {
    return { ...DEFAULTS };
  }
}

export async function getSystemSettings(): Promise<SystemSettingsRow> {
  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) return cache.row;
  const row = await ensureSystemSettings();
  cache = { at: now, row };
  return row;
}

export async function getReferralCode(): Promise<string> {
  const row = await getSystemSettings();
  return String(row.referralCode || DEFAULT_REFERRAL_CODE).trim();
}

export async function setReferralCode(code: string): Promise<SystemSettingsRow> {
  const referralCode = String(code || "").trim();
  if (!referralCode) {
    throw new Error("EMPTY_REFERRAL_CODE");
  }
  const row = await prisma.systemSettings.upsert({
    where: { id: "default" },
    update: { referralCode },
    create: { id: "default", referralCode },
  });
  invalidateSystemSettingsCache();
  return row;
}
