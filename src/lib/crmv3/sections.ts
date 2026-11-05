export const CRM_V3_SECTIONS = [
  { id: "overview", path: "" },
  { id: "customers", path: "customers" },
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
  { id: "finance", path: "finance" },
  { id: "positions", path: "positions" },
  { id: "support", path: "support" },
  { id: "agenda", path: "agenda" },
  { id: "day", path: "day" },
  { id: "marketing", path: "marketing" },
  { id: "goals", path: "goals" },
  { id: "kyc", path: "kyc" },
  { id: "gallery", path: "gallery" },
  { id: "history", path: "history" },
  { id: "risk", path: "risk" },
  { id: "withdraw", path: "withdraw" },
  { id: "payout", path: "payout" },
  { id: "deposit", path: "deposit" },
  { id: "funding", path: "funding" },
  { id: "inbox", path: "inbox" },
  { id: "thread", path: "thread" },
  { id: "reports", path: "reports" },
  { id: "insights", path: "insights" },
  { id: "affiliates", path: "affiliates" },
  { id: "settings", path: "settings" },
  { id: "me", path: "me" },
  { id: "prefs", path: "prefs" },
  { id: "roster", path: "roster" },
  { id: "access", path: "access" },
  { id: "logs", path: "logs" },
  { id: "control", path: "control" },
] as const;

export type CrmV3SectionId = (typeof CRM_V3_SECTIONS)[number]["id"];

/** Campaign send has no outbound mail transport. Lead mapping uses the settings API. */
export const CRM_V3_COMING_SOON = ["campaignSend"] as const;

/** Bottom bar on phones and tablets. Finance is labeled Money in the chrome. */
export const CRM_V3_TABS = ["overview", "customers", "finance", "support"] as const;

export const CRM_V3_MORE = ["positions", "marketing", "goals", "kyc", "gallery", "history", "risk", "withdraw", "payout", "deposit", "funding", "inbox", "thread", "agenda", "day", "dense", "notices", "tags", "blotter", "pad", "cases", "shortcuts", "payboard", "handoff", "leads", "quiet", "triage", "accents", "depboard", "sop", "alerts", "folders", "health", "scratch", "ibpay", "jumps", "expiry", "density", "rejects", "vault", "reports", "insights", "affiliates", "settings", "me", "prefs", "roster", "access", "logs", "control"] as const;

export function crmv3Href(base: string, path: string, query?: Record<string, string>): string {
  const root = base.replace(/\/+$/, "") || "/crmv3";
  const url = path ? `${root}/${path}` : root;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v) params.set(k, v);
  const s = params.toString();
  return s ? `${url}?${s}` : url;
}
