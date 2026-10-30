/** Public license shape. Mirrors the stored License columns. No other facts are invented. */
export type PublicLicense = {
  id: string;
  regulator: string;
  number: string;
  entity: string;
  registerUrl: string;
  logo: string | null;
};

export const LICENSE_MISSING = "—";

export type LicenseFieldKey =
  | "authority"
  | "number"
  | "type"
  | "entity"
  | "jurisdiction"
  | "issued"
  | "valid"
  | "scope";

export type LicenseField = {
  key: LicenseFieldKey;
  value: string;
  missing: boolean;
  wide: boolean;
};

/** Stored columns that can fill a document row. */
const STORED: Partial<Record<LicenseFieldKey, keyof PublicLicense>> = {
  authority: "regulator",
  number: "number",
  entity: "entity",
};

/**
 * Fields the document shows that the License model does not store.
 * The page renders these as an em dash until a real value exists.
 */
export const UNSTORED_LICENSE_FIELDS: readonly LicenseFieldKey[] = [
  "type",
  "jurisdiction",
  "issued",
  "valid",
  "scope",
];

const ORDER: readonly LicenseFieldKey[] = [
  "authority",
  "number",
  "type",
  "entity",
  "jurisdiction",
  "issued",
  "valid",
  "scope",
];

export function licenseFields(row: PublicLicense): LicenseField[] {
  return ORDER.map((key) => {
    const source = STORED[key];
    const raw = source ? String(row[source] ?? "").trim() : "";
    const missing = raw.length === 0;
    return {
      key,
      value: missing ? LICENSE_MISSING : raw,
      missing,
      wide: key === "scope" || key === "jurisdiction",
    };
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
