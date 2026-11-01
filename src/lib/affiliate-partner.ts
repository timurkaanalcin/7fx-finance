import { randomBytes } from "crypto";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function newAffiliateToken(): string {
  return randomBytes(24).toString("base64url");
}

function clip(v: unknown, n: number): string | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  return s.slice(0, n);
}

function asBool(v: unknown, fallback: boolean): boolean {
  if (typeof v === "boolean") return v;
  if (v === "yes" || v === "true" || v === 1 || v === "1") return true;
  if (v === "no" || v === "false" || v === 0 || v === "0") return false;
  return fallback;
}

export type PartnerWrite = {
  sourceKey?: string;
  name?: string;
  surname?: string | null;
  email?: string | null;
  active?: boolean;
  checkOnFraud?: boolean;
  allowDuplicatePhones?: boolean;
  allowedIps?: string | null;
  allowedSources?: string | null;
  note?: string | null;
  callbackUrl?: string | null;
};

export function parsePartnerWrite(body: Record<string, unknown>, mode: "create" | "patch"): { data?: PartnerWrite; error?: string } {
  const data: PartnerWrite = {};
  if (mode === "create" || body.sourceKey !== undefined || body.source !== undefined) {
    const sourceKey = clip(body.sourceKey ?? body.source, 120);
    if (!sourceKey || sourceKey === "—") return { error: "Source name is required" };
    if (/[\r\n]/.test(sourceKey)) return { error: "Source name is invalid" };
    data.sourceKey = sourceKey;
  }
  if (mode === "create" || body.name !== undefined) {
    const name = clip(body.name, 120) || data.sourceKey || null;
    if (!name) return { error: "Name is required" };
    data.name = name;
  }
  if (body.surname !== undefined) data.surname = clip(body.surname, 120);
  if (body.email !== undefined) {
    const email = clip(body.email, 191);
    if (email && !EMAIL_RE.test(email)) return { error: "Enter a valid email" };
    data.email = email ? email.toLowerCase() : null;
  }
  if (body.active !== undefined) data.active = asBool(body.active, true);
  if (body.checkOnFraud !== undefined) data.checkOnFraud = asBool(body.checkOnFraud, false);
  if (body.allowDuplicatePhones !== undefined) data.allowDuplicatePhones = asBool(body.allowDuplicatePhones, false);
  if (body.allowedIps !== undefined) data.allowedIps = clip(body.allowedIps, 4000);
  if (body.allowedSources !== undefined) data.allowedSources = clip(body.allowedSources, 4000);
  if (body.note !== undefined) data.note = clip(body.note, 4000);
  if (body.callbackUrl !== undefined) {
    const url = clip(body.callbackUrl, 2000);
    if (url && !/^https?:\/\//i.test(url)) return { error: "Callback URL must start with http:// or https://" };
    data.callbackUrl = url;
  }
  if (mode === "create" && !data.name && data.sourceKey) data.name = data.sourceKey;
  return { data };
}

export function parseStreamWrite(body: Record<string, unknown>, mode: "create" | "patch"): {
  data?: { name?: string; declaredSource?: string; landingUrl?: string | null; active?: boolean; note?: string | null };
  error?: string;
} {
  const data: { name?: string; declaredSource?: string; landingUrl?: string | null; active?: boolean; note?: string | null } = {};
  if (mode === "create" || body.name !== undefined) {
    const name = clip(body.name, 120);
    if (!name) return { error: "Stream name is required" };
    data.name = name;
  }
  if (mode === "create" || body.declaredSource !== undefined || body.source !== undefined) {
    const declared = clip(body.declaredSource ?? body.source, 80);
    if (!declared) return { error: "Declared source is required" };
    data.declaredSource = declared;
  }
  if (body.landingUrl !== undefined || body.landing !== undefined) data.landingUrl = clip(body.landingUrl ?? body.landing, 4000);
  if (body.note !== undefined) data.note = clip(body.note, 4000);
  if (body.active !== undefined) data.active = asBool(body.active, true);
  return { data };
}
