/** Shared CRM / membership field helpers for admin + trader profile */

export const ACCOUNT_TYPES = ["STANDARD", "VIP", "PRO", "DEMO"] as const;
export const ACCOUNT_CURRENCIES = ["USD", "EUR", "TRY", "GBP", "CHF", "JPY", "AUD", "CAD"] as const;
export type AccountCurrency = (typeof ACCOUNT_CURRENCIES)[number];

export function normalizeAccountCurrency(value: unknown, fallback = "USD"): AccountCurrency {
  const raw = String(value ?? "")
    .trim()
    .toUpperCase()
    .slice(0, 8);
  if ((ACCOUNT_CURRENCIES as readonly string[]).includes(raw)) {
    return raw as AccountCurrency;
  }
  return (ACCOUNT_CURRENCIES as readonly string[]).includes(fallback)
    ? (fallback as AccountCurrency)
    : "USD";
}

export function isSupportedAccountCurrency(value: unknown): value is AccountCurrency {
  const raw = String(value ?? "")
    .trim()
    .toUpperCase();
  return (ACCOUNT_CURRENCIES as readonly string[]).includes(raw);
}

export const DOC_STATUSES = ["NONE", "PENDING", "APPROVED", "REJECTED"] as const;

export const SALE_STATUSES = [
  "NEW",
  "NO_ANSWER",
  "CALLBACK",
  "INTERESTED",
  "NOT_INTERESTED",
  "WRONG_NUMBER",
  "DEPOSITED",
  "RETENTION",
  "DO_NOT_CALL",
  "CONVERTED",
  "CONTACTED",
  "LOST",
] as const;

export const RETENTION_STATUSES = [
  "ACTIVE",
  "INACTIVE",
  "AT_RISK",
  "CHURNED",
  "VIP",
] as const;

export const POTENTIAL_STATUSES = ["LOW", "MEDIUM", "HIGH", "HOT"] as const;
export const VALIDATION_STATUSES = [
  "UNVERIFIED",
  "PENDING",
  "VERIFIED",
  "REJECTED",
] as const;

export type MembershipWritable = {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  language?: string | null;
  timezone?: string | null;
  country?: string | null;
  address?: string | null;
  accountType?: string | null;
  registrationDate?: string | null;
  registrationCountry?: string | null;
  isResident?: boolean;
  tradingServer?: string | null;
  tradingGroup?: string | null;
  desk?: string | null;
  deskId?: string | null;
  campaign?: string | null;
  affiliateA?: string | null;
  affiliateB?: string | null;
  affiliateC?: string | null;
  retentionStatus?: string | null;
  saleStatus?: string | null;
  potentialStatus?: string | null;
  validationStatus?: string | null;
  ftd?: boolean;
  brokerName?: string | null;
  assigneeName?: string | null;
  documentsStatus?: string | null;
  name?: string | null;
};

/** Fields traders may self-edit */
export const TRADER_EDITABLE = [
  "phone",
  "language",
  "timezone",
  "address",
] as const;

export function displayName(u: {
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string;
}) {
  const composed = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return composed || u.name || u.email || "—";
}

function strOrNull(v: unknown, max = 200): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  const s = String(v).trim();
  if (!s) return null;
  return s.slice(0, max);
}

function boolOrUndef(v: unknown): boolean | undefined {
  if (typeof v === "boolean") return v;
  return undefined;
}

function dateOrNull(v: unknown): Date | null | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === "") return null;
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

/** Parse admin membership PATCH body into Prisma update data */
export function parseMembershipUpdate(
  body: Record<string, unknown>,
  opts?: { traderSelf?: boolean }
): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  const trader = opts?.traderSelf;

  const setStr = (key: string, max = 200) => {
    if (!(key in body)) return;
    if (trader && !(TRADER_EDITABLE as readonly string[]).includes(key)) return;
    data[key] = strOrNull(body[key], max);
  };

  setStr("firstName", 80);
  setStr("lastName", 80);
  setStr("phone", 40);
  setStr("language", 16);
  setStr("timezone", 64);
  setStr("country", 80);
  setStr("address", 500);
  setStr("accountType", 40);
  setStr("registrationCountry", 80);
  setStr("tradingServer", 80);
  setStr("tradingGroup", 80);
  setStr("desk", 80);
  setStr("deskId", 80);
  setStr("campaign", 120);
  setStr("affiliateA", 80);
  setStr("affiliateB", 80);
  setStr("affiliateC", 80);
  setStr("retentionStatus", 40);
  setStr("saleStatus", 40);
  setStr("potentialStatus", 40);
  setStr("validationStatus", 40);
  setStr("brokerName", 120);
  setStr("assigneeName", 120);
  setStr("documentsStatus", 40);
  setStr("name", 120);

  if (!trader && "birthDate" in body) {
    data.birthDate = dateOrNull(body.birthDate);
  }
  if (!trader && "registrationDate" in body) {
    data.registrationDate = dateOrNull(body.registrationDate);
  }
  if (!trader && "isResident" in body) {
    const b = boolOrUndef(body.isResident);
    if (b !== undefined) data.isResident = b;
  }
  if (!trader && "ftd" in body) {
    const b = boolOrUndef(body.ftd);
    if (b !== undefined) data.ftd = b;
  }

  // Keep display name in sync when first/last provided
  if (
    (data.firstName !== undefined || data.lastName !== undefined) &&
    data.name === undefined
  ) {
    const fn =
      data.firstName !== undefined
        ? (data.firstName as string | null)
        : undefined;
    const ln =
      data.lastName !== undefined
        ? (data.lastName as string | null)
        : undefined;
    if (fn !== undefined || ln !== undefined) {
      // caller should merge with existing; we only set if both sides known via body
      const composed = [body.firstName ?? fn, body.lastName ?? ln]
        .map((x) => (x == null ? "" : String(x).trim()))
        .filter(Boolean)
        .join(" ");
      if (composed) data.name = composed.slice(0, 120);
    }
  }

  return data;
}

export function serializeUserMembership(u: Record<string, unknown>) {
  const account = u.account as Record<string, unknown> | null | undefined;
  return {
    id: u.id,
    email: u.email,
    accountLoginId: (u.accountLoginId as string | null) ?? null,
    name: u.name,
    role: u.role,
    active: u.active !== false,
    lastLoginAt: u.lastLoginAt ?? null,
    createdAt: u.createdAt,
    firstName: u.firstName ?? null,
    lastName: u.lastName ?? null,
    phone: u.phone ?? null,
    birthDate: u.birthDate ?? null,
    language: u.language ?? "en",
    timezone: u.timezone ?? "Europe/Istanbul",
    country: u.country ?? null,
    address: u.address ?? null,
    accountType: u.accountType ?? "STANDARD",
    registrationDate: u.registrationDate ?? u.createdAt ?? null,
    registrationCountry: u.registrationCountry ?? null,
    isResident: Boolean(u.isResident),
    tradingServer: u.tradingServer ?? null,
    tradingGroup: u.tradingGroup ?? null,
    desk: u.desk ?? null,
    deskId: u.deskId ?? null,
    campaign: u.campaign ?? null,
    affiliateA: u.affiliateA ?? null,
    affiliateB: u.affiliateB ?? null,
    affiliateC: u.affiliateC ?? null,
    retentionStatus: u.retentionStatus ?? null,
    saleStatus: u.saleStatus ?? null,
    potentialStatus: u.potentialStatus ?? null,
    validationStatus: u.validationStatus ?? null,
    ftd: Boolean(u.ftd),
    brokerName: u.brokerName ?? null,
    assigneeName: u.assigneeName ?? null,
    documentsStatus: u.documentsStatus ?? "NONE",
    canManageUsers: u.canManageUsers,
    canApproveDeposits: u.canApproveDeposits,
    canEditRates: u.canEditRates,
    canManageMethods: u.canManageMethods,
    canAdjustBalance: u.canAdjustBalance,
    tradingAccountId: (account?.id as string) ?? null,
    leverage: (account?.leverage as number) ?? 100,
    balance: (account?.balance as number) ?? 0,
    equity: (account?.equity as number) ?? 0,
    credit: (account?.credit as number) ?? 0,
    bonus: (account?.bonus as number) ?? 0,
    currency: (account?.currency as string) ?? "USD",
    margin: (account?.margin as number) ?? 0,
    freeMargin: (account?.freeMargin as number) ?? 0,
  };
}
