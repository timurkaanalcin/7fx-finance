export const CRM_V4_SECTIONS = [
  { id: "overview", path: "" },
  { id: "customers", path: "customers" },
  { id: "finance", path: "finance" },
  { id: "positions", path: "positions" },
  { id: "support", path: "support" },
  { id: "marketing", path: "marketing" },
  { id: "settings", path: "settings" },
  { id: "logs", path: "logs" },
  { id: "control", path: "control" },
  { id: "me", path: "me" },
  { id: "goals", path: "goals" },
  { id: "kyc", path: "kyc" },
  { id: "reports", path: "reports" },
] as const;

export type CrmV4SectionId = (typeof CRM_V4_SECTIONS)[number]["id"];

/** Campaign send has no outbound mail transport. Lead mapping uses the settings API. */
export const CRM_V4_COMING_SOON = ["campaignSend"] as const;

/** Phone bottom bar. Wider screens use the top nav. */
export const CRM_V4_TABS = ["overview", "customers", "finance", "support"] as const;

export const CRM_V4_NAV = [
  { id: "overview", path: "", sub: "subOverview" },
  { id: "customers", path: "customers", sub: "subCustomers" },
  { id: "finance", path: "finance", sub: "subFinance" },
  { id: "positions", path: "positions", sub: "subPositions" },
  { id: "support", path: "support", sub: "subSupport" },
  { id: "marketing", path: "marketing", sub: "subMarketing" },
  { id: "logs", path: "logs", sub: "subLogs" },
] as const;

export const CRM_V4_MORE = ["positions", "marketing", "goals", "kyc", "reports", "settings", "me", "logs", "control"] as const;

export function crmv4Href(base: string, path: string, query?: Record<string, string>): string {
  const root = base.replace(/\/+$/, "") || "/crmv4";
  const url = path ? `${root}/${path}` : root;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v) params.set(k, v);
  const s = params.toString();
  return s ? `${url}?${s}` : url;
}
