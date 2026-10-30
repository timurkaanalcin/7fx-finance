export const CRM_V2_SECTIONS = [
  { id: "overview", path: "" },
  { id: "customers", path: "customers" },
  { id: "finance", path: "finance" },
  { id: "positions", path: "positions" },
  { id: "support", path: "support" },
  { id: "marketing", path: "marketing" },
  { id: "settings", path: "settings" },
  { id: "logs", path: "logs" },
] as const;

export type CrmV2SectionId = (typeof CRM_V2_SECTIONS)[number]["id"];

/** Surfaces with no backend. The UI says so instead of inventing rows. */
export const CRM_V2_COMING_SOON = ["campaignSend", "leadMapping"] as const;

export function crmv2Href(base: string, path: string, query?: Record<string, string>): string {
  const root = base.replace(/\/+$/, "") || "/crmv2";
  const url = path ? `${root}/${path}` : root;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v) params.set(k, v);
  const s = params.toString();
  return s ? `${url}?${s}` : url;
}
