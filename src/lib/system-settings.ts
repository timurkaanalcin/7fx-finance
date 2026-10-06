/**
 * Singleton system settings (referral / invite code, terminal impersonation, etc.).
 */
import { prisma } from "./prisma";
import {
  DEFAULT_LEAD_STATUS_MAPPING,
  parseLeadStatusMapping,
  type LeadStatusMapping,
} from "./lead-status";

/** Active default referral code for public registration (digits). */
export const DEFAULT_REFERRAL_CODE = "213950812";

/** Previous defaults — migrated to DEFAULT_REFERRAL_CODE on ensure if still present. */
const LEGACY_REFERRAL_CODES = new Set(["3526754"]);

export type SystemSettingsRow = {
  id: string;
  referralCode: string;
  referralRequired: boolean;
  /** Admins may open trader terminal as that user — default ON for everyone */
  terminalImpersonationEnabled: boolean;
  /** JSON blob for Valid/Invalid/Potential saleStatus mapping */
  leadStatusMappingJson: string | null;
  leadStatusMapping: LeadStatusMapping;
  updatedAt?: Date;
};

const DEFAULTS: SystemSettingsRow = {
  id: "default",
  referralCode: DEFAULT_REFERRAL_CODE,
  referralRequired: true,
  terminalImpersonationEnabled: true,
  leadStatusMappingJson: null,
  leadStatusMapping: { ...DEFAULT_LEAD_STATUS_MAPPING, valid: [...DEFAULT_LEAD_STATUS_MAPPING.valid], invalid: [...DEFAULT_LEAD_STATUS_MAPPING.invalid], potential: [...DEFAULT_LEAD_STATUS_MAPPING.potential] },
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
  terminalImpersonationEnabled?: boolean | null;
  leadStatusMappingJson?: string | null;
  updatedAt?: Date;
}): SystemSettingsRow {
  const leadStatusMappingJson = row.leadStatusMappingJson ?? null;
  return {
    id: row.id,
    referralCode: String(row.referralCode || DEFAULT_REFERRAL_CODE).trim(),
    referralRequired: row.referralRequired !== false,
    // Default ON: only false when explicitly set false
    terminalImpersonationEnabled: row.terminalImpersonationEnabled !== false,
    leadStatusMappingJson,
    leadStatusMapping: parseLeadStatusMapping(leadStatusMappingJson),
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
        terminalImpersonationEnabled: true,
      },
    });

    const current = String(row.referralCode || "").trim();
    const patch: {
      referralCode?: string;
      referralRequired?: boolean;
      terminalImpersonationEnabled?: boolean;
    } = {};
    if (LEGACY_REFERRAL_CODES.has(current) || !current) {
      patch.referralCode = DEFAULT_REFERRAL_CODE;
    }
    if (row.referralRequired === false && process.env.FORCE_REFERRAL_REQUIRED !== "0") {
      patch.referralRequired = true;
    }
    // Ensure impersonation stays ON unless explicitly disabled in DB
    if (
      (row as { terminalImpersonationEnabled?: boolean | null }).terminalImpersonationEnabled ==
        null &&
      process.env.FORCE_IMPERSONATION_OFF !== "1"
    ) {
      patch.terminalImpersonationEnabled = true;
    }
    if (Object.keys(patch).length) {
      row = await prisma.systemSettings.update({
        where: { id: "default" },
        data: patch,
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

export async function isTerminalImpersonationEnabled(): Promise<boolean> {
  const row = await getSystemSettings();
  return row.terminalImpersonationEnabled !== false;
}

export async function setReferralCode(code: string): Promise<SystemSettingsRow> {
  const referralCode = String(code || "").trim();
  if (!referralCode) {
    throw new Error("EMPTY_REFERRAL_CODE");
  }
  const row = await prisma.systemSettings.upsert({
    where: { id: "default" },
    update: { referralCode },
    create: {
      id: "default",
      referralCode,
      referralRequired: true,
      terminalImpersonationEnabled: true,
    },
  });
  invalidateSystemSettingsCache();
  return normalizeRow(row);
}

export async function setSystemSettings(opts: {
  referralCode?: string;
  referralRequired?: boolean;
  terminalImpersonationEnabled?: boolean;
  leadStatusMapping?: LeadStatusMapping;
  leadStatusMappingJson?: string | null;
}): Promise<SystemSettingsRow> {
  const data: {
    referralCode?: string;
    referralRequired?: boolean;
    terminalImpersonationEnabled?: boolean;
    leadStatusMappingJson?: string | null;
  } = {};
  if (opts.referralCode != null) {
    const referralCode = String(opts.referralCode).trim();
    if (!referralCode) throw new Error("EMPTY_REFERRAL_CODE");
    data.referralCode = referralCode;
  }
  if (opts.referralRequired != null) {
    data.referralRequired = Boolean(opts.referralRequired);
  }
  if (opts.terminalImpersonationEnabled != null) {
    data.terminalImpersonationEnabled = Boolean(opts.terminalImpersonationEnabled);
  }
  if (opts.leadStatusMapping != null) {
    const m = parseLeadStatusMapping(JSON.stringify(opts.leadStatusMapping));
    data.leadStatusMappingJson = JSON.stringify(m);
  } else if (opts.leadStatusMappingJson !== undefined) {
    data.leadStatusMappingJson = opts.leadStatusMappingJson
      ? JSON.stringify(parseLeadStatusMapping(opts.leadStatusMappingJson))
      : null;
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
      terminalImpersonationEnabled: data.terminalImpersonationEnabled ?? true,
      leadStatusMappingJson: data.leadStatusMappingJson ?? null,
    },
  });
  invalidateSystemSettingsCache();
  return normalizeRow(row);
}
