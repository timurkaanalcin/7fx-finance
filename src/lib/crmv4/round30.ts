/** Pure helpers for CRM v4 round 30. The rail fold is stored in the browser. */

export const RAIL_KEY = "crmv4-rail-fold";

export const NAV_SECTIONS = [
  { id: "work", ids: ["overview", "customers", "accttype", "retstat", "potstat", "valstat", "trgroup", "broker", "server", "zones", "cities", "browsers", "systems", "devices", "atlas", "regions", "langglance", "countryglance", "dense", "notices", "tags", "blotter", "tradesym", "orderstat", "symbolglance", "ordertype", "tradeside", "sidesg", "orderstatus", "pad", "cases", "shortcuts", "leads", "leadstat", "sourceglance", "leadsrc", "triage", "positions", "support", "ticketassign", "ticketstatus", "tktsg", "casepriority", "casepriopolish", "ticketchannel", "assignee", "prioglance", "suppulse", "inbox", "thread", "marketing", "agenda", "health", "rejects", "heatmap", "compare", "stale", "dupes", "vip", "week", "lane", "riskwatch", "snooze", "sideglance", "reasons", "ivsource", "vintage", "natal", "house", "courtesy"] },
  { id: "money", ids: ["finance", "deposit", "depcurrency", "withdraw", "wdmethod", "payout", "payboard", "wdreason", "wdstatus", "wdsg", "wdglance", "funding", "goals", "depboard", "depmethod", "depglance", "depstatus", "depchannel", "ibpay", "ibglance", "ibstatus", "ibcountry", "ibctry", "pulse", "glance", "curchips", "zeroglance"] },
  { id: "compliance", ids: ["kyc", "kycstatus", "kycsg", "kycdocstat", "doctype", "doctypemix", "docstatus", "gallery", "risk", "riskglance", "logs", "history", "auditdays", "alerts", "expiry", "docpulse", "kycglance", "kycfile"] },
  { id: "insights", ids: ["insights", "reports", "affiliates", "affchan", "sources"] },
  { id: "desk", ids: ["settings", "me", "day", "control", "prefs", "roster", "staffpolish", "access", "handoff", "handoffpolish", "quiet", "accents", "sop", "folders", "scratch", "jumps", "density", "vault", "cheats", "digest", "glass", "eod", "scripts", "prep", "winlog", "packet", "clocks", "snippets", "swatches", "scale", "shield", "stickies", "shiftlist", "edge", "outcomes", "maildense", "callpack", "markbar", "focusmode", "pinboard", "desktimer", "licglance", "voicetray", "utcmark", "statusbanner", "quicklinks", "checklist", "scratchpad", "contacts", "reminders", "tagpalette", "filterpresets", "sessionnote", "pinrail", "mutelist", "recentjumps", "watchwords", "layoutlock", "draftstash", "focuscustomer", "bookmarks", "snoozelist", "checkpolish", "colortags", "savedviews", "followqueue", "rowdensity", "csvpresets", "remindpolish", "meetnotes", "quickdial", "callbackqueue", "visitlog", "parkspot", "locker", "courier", "visitor", "mailroom", "reception", "supply", "confroom", "breakroom", "lounge", "pantry", "coat", "concierge", "valet", "porter", "bell", "lamp", "host", "callwin", "arrival", "place", "watch", "keys", "stacks", "cues", "ribbons", "playbill", "interlude", "folio", "vellum", "quire", "promise", "calling", "briefing", "lexicon", "dispatch", "wings", "loom", "bands", "kiln", "handles", "proofs", "given", "dockets", "family", "quay", "belts", "bench", "plates", "perch", "presence", "hearth", "lantern", "stitch", "cloth", "proof", "ribbon", "quill", "seal", "wax", "gilt", "ftd", "marq", "gate", "cloak", "latch", "nook", "bolt", "oriel", "trial", "atelier", "notice", "vestry", "shutter"] },
] as const;

export type NavSectionId = (typeof NAV_SECTIONS)[number]["id"];

export function sectionPath(id: string): string {
  return id === "overview" ? "" : id;
}

export function activeGroup(view: string): NavSectionId | "" {
  const found = NAV_SECTIONS.find((group) => (group.ids as readonly string[]).includes(view));
  return found ? found.id : "";
}

export function filterSection(ids: readonly string[], names: Record<string, string>, query: string): string[] {
  const text = query.trim().toLowerCase();
  if (!text) return [...ids];
  return ids.filter((id) => `${names[id] || ""} ${id}`.toLowerCase().includes(text));
}

export function readFold(raw: string | null): boolean {
  return raw === "1";
}

export function matchedCount(names: Record<string, string>, query: string): number {
  return NAV_SECTIONS.reduce((sum, group) => sum + filterSection(group.ids, names, query).length, 0);
}
