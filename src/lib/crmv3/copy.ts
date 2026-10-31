/** CRM v3 chrome strings. Shared screen copy stays in CRM v2 tables. Locales cannot drift. */
import { DESK_AR, DESK_DE, DESK_EN, DESK_RU, DESK_TR } from "@/lib/crmv3/copy-desk";
import { LATER_AR, LATER_DE, LATER_EN, LATER_RU, LATER_TR } from "@/lib/crmv3/copy-later";
import { CASH_AR, CASH_DE, CASH_EN, CASH_RU, CASH_TR } from "@/lib/crmv3/copy-cash";
import { PEOPLE_AR, PEOPLE_DE, PEOPLE_EN, PEOPLE_RU, PEOPLE_TR } from "@/lib/crmv3/copy-people";
import { GOALS_AR, GOALS_DE, GOALS_EN, GOALS_RU, GOALS_TR } from "@/lib/crmv3/copy-goals";
import { LINE_AR, LINE_DE, LINE_EN, LINE_RU, LINE_TR } from "@/lib/crmv3/copy-line";
import { REVIEW_AR, REVIEW_DE, REVIEW_EN, REVIEW_RU, REVIEW_TR } from "@/lib/crmv3/copy-review";
import { WD_AR, WD_DE, WD_EN, WD_RU, WD_TR } from "@/lib/crmv3/copy-withdraw";

const enBase = {
  money: "Money",
  v3mark: "CRM v3",
  searchFab: "Search",
  pullHint: "Pull to refresh",
  refreshing: "Refreshing",
  openRow: "Open",
};

const en = { ...enBase, ...DESK_EN, ...LATER_EN, ...CASH_EN, ...PEOPLE_EN, ...GOALS_EN, ...LINE_EN, ...REVIEW_EN, ...WD_EN };

const trBase: typeof enBase = {
  money: "Para",
  v3mark: "CRM v3",
  searchFab: "Ara",
  pullHint: "Yenilemek için çekin",
  refreshing: "Yenileniyor",
  openRow: "Aç",
};

const tr = { ...trBase, ...DESK_TR, ...LATER_TR, ...CASH_TR, ...PEOPLE_TR, ...GOALS_TR, ...LINE_TR, ...REVIEW_TR, ...WD_TR };

const deBase: typeof enBase = {
  money: "Geld",
  v3mark: "CRM v3",
  searchFab: "Suchen",
  pullHint: "Zum Aktualisieren ziehen",
  refreshing: "Aktualisierung",
  openRow: "Öffnen",
};

const de = { ...deBase, ...DESK_DE, ...LATER_DE, ...CASH_DE, ...PEOPLE_DE, ...GOALS_DE, ...LINE_DE, ...REVIEW_DE, ...WD_DE };

const ruBase: typeof enBase = {
  money: "Деньги",
  v3mark: "CRM v3",
  searchFab: "Поиск",
  pullHint: "Потяните, чтобы обновить",
  refreshing: "Обновление",
  openRow: "Открыть",
};

const ru = { ...ruBase, ...DESK_RU, ...LATER_RU, ...CASH_RU, ...PEOPLE_RU, ...GOALS_RU, ...LINE_RU, ...REVIEW_RU, ...WD_RU };

const arBase: typeof enBase = {
  money: "المال",
  v3mark: "CRM v3",
  searchFab: "بحث",
  pullHint: "اسحب للتحديث",
  refreshing: "جارٍ التحديث",
  openRow: "فتح",
};

const ar = { ...arBase, ...DESK_AR, ...LATER_AR, ...CASH_AR, ...PEOPLE_AR, ...GOALS_AR, ...LINE_AR, ...REVIEW_AR, ...WD_AR };

export const CRM_V3_COPY = { en, tr, de, ru, ar };

export type CrmV3CopyKey = keyof typeof en;

export function crmv3Text(locale: string, key: CrmV3CopyKey): string {
  const base = locale.toLowerCase().split("-")[0];
  const table = CRM_V3_COPY[base as keyof typeof CRM_V3_COPY] || CRM_V3_COPY.en;
  return table[key] || CRM_V3_COPY.en[key];
}
