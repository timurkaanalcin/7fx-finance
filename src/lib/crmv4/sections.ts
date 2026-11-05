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
  { id: "insights", path: "insights" },
  { id: "prefs", path: "prefs" },
  { id: "roster", path: "roster" },
  { id: "withdraw", path: "withdraw" },
  { id: "deposit", path: "deposit" },
  { id: "inbox", path: "inbox" },
  { id: "agenda", path: "agenda" },
  { id: "day", path: "day" },
  { id: "affiliates", path: "affiliates" },
  { id: "payout", path: "payout" },
  { id: "access", path: "access" },
  { id: "risk", path: "risk" },
  { id: "funding", path: "funding" },
  { id: "thread", path: "thread" },
  { id: "gallery", path: "gallery" },
  { id: "history", path: "history" },
  { id: "dense", path: "dense" },
  { id: "notices", path: "notices" },
  { id: "tags", path: "tags" },
  { id: "blotter", path: "blotter" },
  { id: "pad", path: "pad" },
  { id: "cases", path: "cases" },
  { id: "shortcuts", path: "shortcuts" },
  { id: "payboard", path: "payboard" },
  { id: "handoff", path: "handoff" },
  { id: "leads", path: "leads" },
  { id: "quiet", path: "quiet" },
  { id: "triage", path: "triage" },
  { id: "accents", path: "accents" },
  { id: "depboard", path: "depboard" },
  { id: "sop", path: "sop" },
  { id: "alerts", path: "alerts" },
  { id: "folders", path: "folders" },
  { id: "health", path: "health" },
  { id: "scratch", path: "scratch" },
  { id: "ibpay", path: "ibpay" },
  { id: "jumps", path: "jumps" },
  { id: "expiry", path: "expiry" },
  { id: "density", path: "density" },
  { id: "rejects", path: "rejects" },
  { id: "vault", path: "vault" },
  { id: "heatmap", path: "heatmap" },
  { id: "cheats", path: "cheats" },
  { id: "digest", path: "digest" },
  { id: "glass", path: "glass" },
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

export const CRM_V4_MORE = ["positions", "marketing", "goals", "kyc", "risk", "withdraw", "deposit", "inbox", "agenda", "reports", "insights", "affiliates", "payout", "funding", "thread", "gallery", "history", "dense", "notices", "tags", "blotter", "pad", "cases", "shortcuts", "payboard", "handoff", "leads", "quiet", "triage", "accents", "depboard", "sop", "alerts", "folders", "health", "scratch", "ibpay", "jumps", "expiry", "density", "rejects", "vault", "heatmap", "cheats", "digest", "glass", "access", "settings", "me", "day", "prefs", "roster", "logs", "control"] as const;

export function crmv4Href(base: string, path: string, query?: Record<string, string>): string {
  const root = base.replace(/\/+$/, "") || "/crmv4";
  const url = path ? `${root}/${path}` : root;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v) params.set(k, v);
  const s = params.toString();
  return s ? `${url}?${s}` : url;
}
