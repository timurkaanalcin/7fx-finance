/** Pure helpers for CRM v4 round 31. Named lists stay in the browser. */

export const LIST_KEY = "crmv4-smart-lists";

export type ListRules = {
  kyc: string;
  stage: string;
  country: string;
  ftd: "" | "yes" | "no";
};

export type SmartList = {
  id: string;
  name: string;
  rules: ListRules;
};

export type ListRow = {
  documentsStatus?: string | null;
  saleStatus?: string | null;
  country?: string | null;
  ftd?: boolean | null;
};

const EMPTY: ListRules = { kyc: "", stage: "", country: "", ftd: "" };

export function emptyRules(): ListRules {
  return { ...EMPTY };
}

export function readLists(raw: unknown): SmartList[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as { id?: unknown; name?: unknown; rules?: unknown };
    const name = String(row.name || "").trim();
    if (!name) return [];
    const rules = row.rules && typeof row.rules === "object" ? row.rules as Record<string, unknown> : {};
    const ftd = rules.ftd === "yes" || rules.ftd === "no" ? rules.ftd : "";
    return [{
      id: String(row.id || name),
      name: name.slice(0, 40),
      rules: {
        kyc: String(rules.kyc || "").trim(),
        stage: String(rules.stage || "").trim(),
        country: String(rules.country || "").trim(),
        ftd,
      },
    }];
  });
}

export function addList(lists: SmartList[], name: string, rules: ListRules): SmartList[] {
  const label = name.trim();
  if (!label) return lists;
  return [...lists, { id: `${lists.length}-${label.slice(0, 8)}`, name: label.slice(0, 40), rules: { ...rules, kyc: rules.kyc.trim(), stage: rules.stage.trim(), country: rules.country.trim() } }];
}

export function renameList(lists: SmartList[], id: string, name: string): SmartList[] {
  const label = name.trim();
  if (!label) return lists;
  return lists.map((item) => item.id === id ? { ...item, name: label.slice(0, 40) } : item);
}

export function deleteList(lists: SmartList[], id: string): SmartList[] {
  return lists.filter((item) => item.id !== id);
}

export function moveList(lists: SmartList[], id: string, dir: -1 | 1): SmartList[] {
  const index = lists.findIndex((item) => item.id === id);
  const next = index + dir;
  if (index < 0 || next < 0 || next >= lists.length) return lists;
  const copy = lists.slice();
  const [row] = copy.splice(index, 1);
  copy.splice(next, 0, row);
  return copy;
}

export function matchList(row: ListRow, rules: ListRules): boolean {
  if (rules.kyc && String(row.documentsStatus || "").toLowerCase() !== rules.kyc.toLowerCase()) return false;
  if (rules.stage && String(row.saleStatus || "").toLowerCase() !== rules.stage.toLowerCase()) return false;
  if (rules.country && String(row.country || "").toLowerCase() !== rules.country.toLowerCase()) return false;
  if (rules.ftd === "yes" && !row.ftd) return false;
  if (rules.ftd === "no" && row.ftd) return false;
  return true;
}

export function countList(rows: ListRow[], rules: ListRules): number {
  return rows.filter((row) => matchList(row, rules)).length;
}

export function listIsOpen(rules: ListRules): boolean {
  return !rules.kyc && !rules.stage && !rules.country && !rules.ftd;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "—";
  return parts.slice(0, 2).map((part) => part.slice(0, 1).toUpperCase()).join("");
}
