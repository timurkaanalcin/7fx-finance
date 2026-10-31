/** CRM v3 chrome strings. Shared screen copy stays in CRM v2 tables. Locales cannot drift. */
import { DESK_AR, DESK_DE, DESK_EN, DESK_RU, DESK_TR } from "@/lib/crmv3/copy-desk";

const enBase = {
  money: "Money",
  v3mark: "CRM v3",
  searchFab: "Search",
  pullHint: "Pull to refresh",
  refreshing: "Refreshing",
  openRow: "Open",
};

const en = { ...enBase, ...DESK_EN };

const trBase: typeof enBase = {
  money: "Para",
  v3mark: "CRM v3",
  searchFab: "Ara",
  pullHint: "Yenilemek için çekin",
  refreshing: "Yenileniyor",
  openRow: "Aç",
};

const tr = { ...trBase, ...DESK_TR };

const deBase: typeof enBase = {
  money: "Geld",
  v3mark: "CRM v3",
  searchFab: "Suchen",
  pullHint: "Zum Aktualisieren ziehen",
  refreshing: "Aktualisierung",
  openRow: "Öffnen",
};

const de = { ...deBase, ...DESK_DE };

const ruBase: typeof enBase = {
  money: "Деньги",
  v3mark: "CRM v3",
  searchFab: "Поиск",
  pullHint: "Потяните, чтобы обновить",
  refreshing: "Обновление",
  openRow: "Открыть",
};

const ru = { ...ruBase, ...DESK_RU };

const arBase: typeof enBase = {
  money: "المال",
  v3mark: "CRM v3",
  searchFab: "بحث",
  pullHint: "اسحب للتحديث",
  refreshing: "جارٍ التحديث",
  openRow: "فتح",
};

const ar = { ...arBase, ...DESK_AR };

export const CRM_V3_COPY = { en, tr, de, ru, ar };

export type CrmV3CopyKey = keyof typeof en;

export function crmv3Text(locale: string, key: CrmV3CopyKey): string {
  const base = locale.toLowerCase().split("-")[0];
  const table = CRM_V3_COPY[base as keyof typeof CRM_V3_COPY] || CRM_V3_COPY.en;
  return table[key] || CRM_V3_COPY.en[key];
}
