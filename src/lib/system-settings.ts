/**
 * Singleton system settings (referral / invite code, etc.).
 */
import { prisma } from "./prisma";

/** Active default referral code for public registration (digits). */
export const DEFAULT_REFERRAL_CODE = "213950812";

/** Previous defaults — migrated to DEFAULT_REFERRAL_CODE on ensure if still present. */
const LEGACY_REFERRAL_CODES = new Set(["3526754"]);

export type SystemSettingsRow = {
  id: string;
  referralCode: string;
  referralRequired: boolean;
  updatedAt?: Date;
};

const DEFAULTS: SystemSettingsRow = {
  id: "default",
  referralCode: DEFAULT_REFERRAL_CODE,
  referralRequired: true,
};

let cache: { at: number; row: SystemSettingsRow } | null = null;
const TTL_MS = 5_000;

export function invalidateSystemSettingsCache() {
  cache = null;
}

function normalizeRow(row: {
  id: string;
  referralCode: string;
  referralRequired?: boolean | null;
  updatedAt?: Date;
}): SystemSettingsRow {
  return {
    id: row.id,
    referralCode: String(row.referralCode || DEFAULT_REFERRAL_CODE).trim(),
    referralRequired: row.referralRequired !== false,
    updatedAt: row.updatedAt,
  };
}

export async function ensureSystemSettings(): Promise<SystemSettingsRow> {
  try {
    let row = await prisma.systemSettings.upsert({
      where: { id: "default" },
      update: {},
      create: {
        id: "default",
        referralCode: DEFAULT_REFERRAL_CODE,
        referralRequired: true,
      },
    });

    // One-time migrate known legacy defaults → current DEFAULT_REFERRAL_CODE
    const current = String(row.referralCode || "").trim();
    if (LEGACY_REFERRAL_CODES.has(current) || !current) {
      row = await prisma.systemSettings.update({
        where: { id: "default" },
        data: { referralCode: DEFAULT_REFERRAL_CODE },
      });
    }

    const normalized = normalizeRow(row);
    cache = { at: Date.now(), row: normalized };
    return normalized;
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

export async function isReferralRequired(): Promise<boolean> {
  const row = await getSystemSettings();
  return row.referralRequired !== false;
}

export async function setReferralCode(code: string): Promise<SystemSettingsRow> {
  const referralCode = String(code || "").trim();
  if (!referralCode) {
    throw new Error("EMPTY_REFERRAL_CODE");
  }
  const row = await prisma.systemSettings.upsert({
    where: { id: "default" },
    update: { referralCode },
    create: { id: "default", referralCode, referralRequired: true },
  });
  invalidateSystemSettingsCache();
  return normalizeRow(row);
}

export async function setSystemSettings(opts: {
  referralCode?: string;
  referralRequired?: boolean;
}): Promise<SystemSettingsRow> {
  const data: { referralCode?: string; referralRequired?: boolean } = {};
  if (opts.referralCode != null) {
    const referralCode = String(opts.referralCode).trim();
    if (!referralCode) throw new Error("EMPTY_REFERRAL_CODE");
    data.referralCode = referralCode;
  }
  if (opts.referralRequired != null) {
    data.referralRequired = Boolean(opts.referralRequired);
  }
  if (Object.keys(data).length === 0) {
    return getSystemSettings();
  }
  const row = await prisma.systemSettings.upsert({
    where: { id: "default" },
    update: data,
    create: {
      id: "default",
      referralCode: data.referralCode ?? DEFAULT_REFERRAL_CODE,
      referralRequired: data.referralRequired ?? true,
    },
  });
  invalidateSystemSettingsCache();
  return normalizeRow(row);
}
