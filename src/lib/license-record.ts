/**
 * Public license shape. Values come only from stored columns.
 * A blank optional column stays an em dash on the page.
 */
export type PublicLicense = {
  id: string;
  regulator: string;
  number: string;
  entity: string;
  registerUrl: string;
  licenseType: string | null;
  jurisdiction: string | null;
  status: string | null;
  issuedOn: Date | null;
  expiresOn: Date | null;
  scope: string | null;
  address: string | null;
};

export const LICENSE_MISSING = "—";

export type LicenseFieldId =
  | "entity"
  | "number"
  | "status"
  | "licenseType"
  | "jurisdiction"
  | "issuedOn"
  | "expiresOn"
  | "scope"
  | "address";

export type LicenseFieldLabels = Record<LicenseFieldId, string>;

export type LicenseEntry = {
  key: LicenseFieldId;
  value: string;
  missing: boolean;
  wide: boolean;
};

/** Reading order of a public-register entry: name, reference, status, then the rest. */
export const REGISTER_FIELD_ORDER: readonly LicenseFieldId[] = [
  "entity",
  "number",
  "status",
  "licenseType",
  "jurisdiction",
  "issuedOn",
  "expiresOn",
  "scope",
  "address",
];

const WIDE = new Set<LicenseFieldId>(["scope", "address"]);

export const EMPTY_LICENSE: PublicLicense = {
  id: "",
  regulator: "",
  number: "",
  entity: "",
  registerUrl: "",
  licenseType: null,
  jurisdiction: null,
  status: null,
  issuedOn: null,
  expiresOn: null,
  scope: null,
  address: null,
};

function text(value: string | null | undefined): string {
  return String(value ?? "").trim();
}

/** Calendar day stored on the column, in the page language. UTC so the day does not shift. */
export function formatLicenseDate(value: Date | null | undefined, locale: string): string {
  if (!value || Number.isNaN(value.getTime())) return "";
  const day = value.getUTCFullYear() + "-" + String(value.getUTCMonth() + 1).padStart(2, "0") + "-" + String(value.getUTCDate()).padStart(2, "0");
  const [year, month, date] = day.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, date));
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(utc);
}

function rawValue(row: PublicLicense, key: LicenseFieldId, locale: string): string {
  if (key === "issuedOn" || key === "expiresOn") return formatLicenseDate(row[key], locale);
  return text(row[key]);
}

export function licenseEntries(row: PublicLicense, locale: string): LicenseEntry[] {
  return REGISTER_FIELD_ORDER.map((key) => {
    const value = rawValue(row, key, locale);
    const missing = value.length === 0;
    return { key, value: missing ? LICENSE_MISSING : value, missing, wide: WIDE.has(key) };
  });
}

/** Official-register links are rendered only for https URLs already stored on the record. */
export function httpsRegisterUrl(raw: string | null | undefined): string | null {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function registerHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "";
  }
}
