import type { PublicLicense } from "@/lib/license-record";

/**
 * Which public register a stored row points at.
 * Labels follow that register's own field names. The page stays a 7FX document.
 */
export type RegisterKind = "fca" | "generic";

function hostOf(registerUrl: string): string {
  try {
    return new URL(registerUrl).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
}

/**
 * The only production row points at the Financial Services Register
 * (regulator "Financial Conduct Authority", URL https://register.fca.org.uk/).
 * Field names for that register come from the FCA Register Extract handbook:
 * registered firm name, firm reference number, current authorisation status,
 * firm type, date first authorised, activities and permissions, principal address.
 */
export function registerKind(row: Pick<PublicLicense, "regulator" | "registerUrl">): RegisterKind {
  const host = hostOf(row.registerUrl);
  if (host === "register.fca.org.uk") return "fca";
  if (row.regulator.trim().toLowerCase() === "financial conduct authority") return "fca";
  return "generic";
}
