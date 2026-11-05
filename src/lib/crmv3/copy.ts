/** CRM v3 chrome strings. Shared screen copy stays in CRM v2 tables. Locales cannot drift. */
import { DESK_AR, DESK_DE, DESK_EN, DESK_RU, DESK_TR } from "@/lib/crmv3/copy-desk";
import { LATER_AR, LATER_DE, LATER_EN, LATER_RU, LATER_TR } from "@/lib/crmv3/copy-later";
import { CASH_AR, CASH_DE, CASH_EN, CASH_RU, CASH_TR } from "@/lib/crmv3/copy-cash";
import { PEOPLE_AR, PEOPLE_DE, PEOPLE_EN, PEOPLE_RU, PEOPLE_TR } from "@/lib/crmv3/copy-people";
import { GOALS_AR, GOALS_DE, GOALS_EN, GOALS_RU, GOALS_TR } from "@/lib/crmv3/copy-goals";
import { LINE_AR, LINE_DE, LINE_EN, LINE_RU, LINE_TR } from "@/lib/crmv3/copy-line";
import { REVIEW_AR, REVIEW_DE, REVIEW_EN, REVIEW_RU, REVIEW_TR } from "@/lib/crmv3/copy-review";
import { WD_AR, WD_DE, WD_EN, WD_RU, WD_TR } from "@/lib/crmv3/copy-withdraw";
import { DEP_AR, DEP_DE, DEP_EN, DEP_RU, DEP_TR } from "@/lib/crmv3/copy-deposit";
import { NAV_AR, NAV_DE, NAV_EN, NAV_RU, NAV_TR } from "@/lib/crmv3/copy-nav";
import { LISTS_AR, LISTS_DE, LISTS_EN, LISTS_RU, LISTS_TR } from "@/lib/crmv3/copy-lists";
import { INSIGHTS_AR, INSIGHTS_DE, INSIGHTS_EN, INSIGHTS_RU, INSIGHTS_TR } from "@/lib/crmv3/copy-insights";
import { BOOK_AR, BOOK_DE, BOOK_EN, BOOK_RU, BOOK_TR } from "@/lib/crmv3/copy-book";
import { TABLE_AR, TABLE_DE, TABLE_EN, TABLE_RU, TABLE_TR } from "@/lib/crmv3/copy-table";
import { TODAY_AR, TODAY_DE, TODAY_EN, TODAY_RU, TODAY_TR } from "@/lib/crmv3/copy-today";
import { LEDGER_AR, LEDGER_DE, LEDGER_EN, LEDGER_RU, LEDGER_TR } from "@/lib/crmv3/copy-ledger";
import { GALLERY_AR, GALLERY_DE, GALLERY_EN, GALLERY_RU, GALLERY_TR } from "@/lib/crmv3/copy-gallery";
import { NOTICE_AR, NOTICE_DE, NOTICE_EN, NOTICE_RU, NOTICE_TR } from "@/lib/crmv3/copy-notices";
import { SYSTEM_AR, SYSTEM_DE, SYSTEM_EN, SYSTEM_RU, SYSTEM_TR } from "@/lib/crmv3/copy-system";
import { DOSSIER_AR, DOSSIER_DE, DOSSIER_EN, DOSSIER_RU, DOSSIER_TR } from "@/lib/crmv3/copy-dossier";
import { BOARD_AR, BOARD_DE, BOARD_EN, BOARD_RU, BOARD_TR } from "@/lib/crmv3/copy-board";
import { PICK_AR, PICK_DE, PICK_EN, PICK_RU, PICK_TR } from "@/lib/crmv3/copy-picks";
import { PERIOD_AR, PERIOD_DE, PERIOD_EN, PERIOD_RU, PERIOD_TR } from "@/lib/crmv3/copy-period";
import { RISK_AR, RISK_DE, RISK_EN, RISK_RU, RISK_TR } from "@/lib/crmv3/copy-risk";
import { INBOX_AR, INBOX_DE, INBOX_EN, INBOX_RU, INBOX_TR } from "@/lib/crmv3/copy-inbox";
import { PAY_AR, PAY_DE, PAY_EN, PAY_RU, PAY_TR } from "@/lib/crmv3/copy-payout";
import { FUND_AR, FUND_DE, FUND_EN, FUND_RU, FUND_TR } from "@/lib/crmv3/copy-funding";
import { THREAD_AR, THREAD_DE, THREAD_EN, THREAD_RU, THREAD_TR } from "@/lib/crmv3/copy-thread";
import { PAPER_AR, PAPER_DE, PAPER_EN, PAPER_RU, PAPER_TR } from "@/lib/crmv3/copy-papers";
import { DENSE_AR, DENSE_DE, DENSE_EN, DENSE_RU, DENSE_TR } from "@/lib/crmv3/copy-dense";
import { BOARD52_AR, BOARD52_DE, BOARD52_EN, BOARD52_RU, BOARD52_TR } from "@/lib/crmv3/copy-board52";
import { BLOT_AR, BLOT_DE, BLOT_EN, BLOT_RU, BLOT_TR } from "@/lib/crmv3/copy-blotter";
import { CASE_AR, CASE_DE, CASE_EN, CASE_RU, CASE_TR } from "@/lib/crmv3/copy-cases";
import { SHIFT_AR, SHIFT_DE, SHIFT_EN, SHIFT_RU, SHIFT_TR } from "@/lib/crmv3/copy-shift";
import { LEAD_AR, LEAD_DE, LEAD_EN, LEAD_RU, LEAD_TR } from "@/lib/crmv3/copy-leads";
import { TRIAGE_AR, TRIAGE_DE, TRIAGE_EN, TRIAGE_RU, TRIAGE_TR } from "@/lib/crmv3/copy-triage";
import { SOP_AR, SOP_DE, SOP_EN, SOP_RU, SOP_TR } from "@/lib/crmv3/copy-sop";
import { ALERT_AR, ALERT_DE, ALERT_EN, ALERT_RU, ALERT_TR } from "@/lib/crmv3/copy-alerts";
import { HEALTH_AR, HEALTH_DE, HEALTH_EN, HEALTH_RU, HEALTH_TR } from "@/lib/crmv3/copy-health";
import { INTRO_AR, INTRO_DE, INTRO_EN, INTRO_RU, INTRO_TR } from "@/lib/crmv3/copy-intro";
import { EXPIRY_AR, EXPIRY_DE, EXPIRY_EN, EXPIRY_RU, EXPIRY_TR } from "@/lib/crmv3/copy-expiry";
import { REJECT_AR, REJECT_DE, REJECT_EN, REJECT_RU, REJECT_TR } from "@/lib/crmv3/copy-rejects";
import { HEAT_AR, HEAT_DE, HEAT_EN, HEAT_RU, HEAT_TR } from "@/lib/crmv3/copy-heatmap";
import { DIGEST_AR, DIGEST_DE, DIGEST_EN, DIGEST_RU, DIGEST_TR } from "@/lib/crmv3/copy-digest";
import { COMPARE_AR, COMPARE_DE, COMPARE_EN, COMPARE_RU, COMPARE_TR } from "@/lib/crmv3/copy-compare";
import { STALE_AR, STALE_DE, STALE_EN, STALE_RU, STALE_TR } from "@/lib/crmv3/copy-stale";
import { DUPE_AR, DUPE_DE, DUPE_EN, DUPE_RU, DUPE_TR } from "@/lib/crmv3/copy-dupes";
import { MIX_AR, MIX_DE, MIX_EN, MIX_RU, MIX_TR } from "@/lib/crmv3/copy-mix";
import { VIP_AR, VIP_DE, VIP_EN, VIP_RU, VIP_TR } from "@/lib/crmv3/copy-vip";
import { CLOCK_AR, CLOCK_DE, CLOCK_EN, CLOCK_RU, CLOCK_TR } from "@/lib/crmv3/copy-clocks";
import { PULSE_AR, PULSE_DE, PULSE_EN, PULSE_RU, PULSE_TR } from "@/lib/crmv3/copy-pulse";
import { WEEK_AR, WEEK_DE, WEEK_EN, WEEK_RU, WEEK_TR } from "@/lib/crmv3/copy-week";
import { SHIELD_AR, SHIELD_DE, SHIELD_EN, SHIELD_RU, SHIELD_TR } from "@/lib/crmv3/copy-shield";
import { LIST_AR, LIST_DE, LIST_EN, LIST_RU, LIST_TR } from "@/lib/crmv3/copy-shiftlist";
import { LANE_AR, LANE_DE, LANE_EN, LANE_RU, LANE_TR } from "@/lib/crmv3/copy-lane";
import { EDGE_AR, EDGE_DE, EDGE_EN, EDGE_RU, EDGE_TR } from "@/lib/crmv3/copy-edge";
import { RW_AR, RW_DE, RW_EN, RW_RU, RW_TR } from "@/lib/crmv3/copy-riskwatch";
import { PACK_AR, PACK_DE, PACK_EN, PACK_RU, PACK_TR } from "@/lib/crmv3/copy-pack";
import { MARK_AR, MARK_DE, MARK_EN, MARK_RU, MARK_TR } from "@/lib/crmv3/copy-marks";
import { SZ_AR, SZ_DE, SZ_EN, SZ_RU, SZ_TR } from "@/lib/crmv3/copy-snooze";
import { FM_AR, FM_DE, FM_EN, FM_RU, FM_TR } from "@/lib/crmv3/copy-focus";
import { PIN_AR, PIN_DE, PIN_EN, PIN_RU, PIN_TR } from "@/lib/crmv3/copy-pin";
import { DT_AR, DT_DE, DT_EN, DT_RU, DT_TR } from "@/lib/crmv3/copy-timer";
import { VS_AR, VS_DE, VS_EN, VS_RU, VS_TR } from "@/lib/crmv3/copy-voice";
import { UM_AR, UM_DE, UM_EN, UM_RU, UM_TR } from "@/lib/crmv3/copy-utc";
import { BN_AR, BN_DE, BN_EN, BN_RU, BN_TR } from "@/lib/crmv3/copy-banner";
import { QK_AR, QK_DE, QK_EN, QK_RU, QK_TR } from "@/lib/crmv3/copy-links";
import { CH_AR, CH_DE, CH_EN, CH_RU, CH_TR } from "@/lib/crmv3/copy-check";
import { NP_AR, NP_DE, NP_EN, NP_RU, NP_TR } from "@/lib/crmv3/copy-notepad";

const enBase = {
  money: "Money",
  v3mark: "CRM v3",
  searchFab: "Search",
  pullHint: "Pull to refresh",
  refreshing: "Refreshing",
  openRow: "Open",
};

const en = { ...enBase, ...DESK_EN, ...LATER_EN, ...CASH_EN, ...PEOPLE_EN, ...GOALS_EN, ...LINE_EN, ...REVIEW_EN, ...WD_EN, ...DEP_EN, ...NAV_EN, ...LISTS_EN, ...INSIGHTS_EN, ...BOOK_EN, ...TABLE_EN, ...TODAY_EN, ...LEDGER_EN, ...GALLERY_EN, ...NOTICE_EN, ...SYSTEM_EN, ...DOSSIER_EN, ...BOARD_EN, ...PICK_EN, ...PERIOD_EN, ...RISK_EN, ...INBOX_EN, ...PAY_EN, ...FUND_EN, ...THREAD_EN, ...PAPER_EN, ...DENSE_EN, ...BOARD52_EN, ...BLOT_EN, ...CASE_EN, ...SHIFT_EN, ...LEAD_EN, ...TRIAGE_EN, ...SOP_EN, ...ALERT_EN, ...HEALTH_EN, ...INTRO_EN, ...EXPIRY_EN, ...REJECT_EN, ...HEAT_EN, ...DIGEST_EN, ...COMPARE_EN, ...STALE_EN, ...DUPE_EN, ...MIX_EN, ...VIP_EN, ...CLOCK_EN, ...PULSE_EN, ...WEEK_EN, ...SHIELD_EN, ...LIST_EN, ...LANE_EN, ...EDGE_EN, ...RW_EN, ...PACK_EN, ...MARK_EN, ...SZ_EN, ...FM_EN, ...PIN_EN, ...DT_EN, ...VS_EN, ...UM_EN, ...BN_EN, ...QK_EN, ...CH_EN, ...NP_EN };

const trBase: typeof enBase = {
  money: "Para",
  v3mark: "CRM v3",
  searchFab: "Ara",
  pullHint: "Yenilemek için çekin",
  refreshing: "Yenileniyor",
  openRow: "Aç",
};

const tr = { ...trBase, ...DESK_TR, ...LATER_TR, ...CASH_TR, ...PEOPLE_TR, ...GOALS_TR, ...LINE_TR, ...REVIEW_TR, ...WD_TR, ...DEP_TR, ...NAV_TR, ...LISTS_TR, ...INSIGHTS_TR, ...BOOK_TR, ...TABLE_TR, ...TODAY_TR, ...LEDGER_TR, ...GALLERY_TR, ...NOTICE_TR, ...SYSTEM_TR, ...DOSSIER_TR, ...BOARD_TR, ...PICK_TR, ...PERIOD_TR, ...RISK_TR, ...INBOX_TR, ...PAY_TR, ...FUND_TR, ...THREAD_TR, ...PAPER_TR, ...DENSE_TR, ...BOARD52_TR, ...BLOT_TR, ...CASE_TR, ...SHIFT_TR, ...LEAD_TR, ...TRIAGE_TR, ...SOP_TR, ...ALERT_TR, ...HEALTH_TR, ...INTRO_TR, ...EXPIRY_TR, ...REJECT_TR, ...HEAT_TR, ...DIGEST_TR, ...COMPARE_TR, ...STALE_TR, ...DUPE_TR, ...MIX_TR, ...VIP_TR, ...CLOCK_TR, ...PULSE_TR, ...WEEK_TR, ...SHIELD_TR, ...LIST_TR, ...LANE_TR, ...EDGE_TR, ...RW_TR, ...PACK_TR, ...MARK_TR, ...SZ_TR, ...FM_TR, ...PIN_TR, ...DT_TR, ...VS_TR, ...UM_TR, ...BN_TR, ...QK_TR, ...CH_TR, ...NP_TR };

const deBase: typeof enBase = {
  money: "Geld",
  v3mark: "CRM v3",
  searchFab: "Suchen",
  pullHint: "Zum Aktualisieren ziehen",
  refreshing: "Aktualisierung",
  openRow: "Öffnen",
};

const de = { ...deBase, ...DESK_DE, ...LATER_DE, ...CASH_DE, ...PEOPLE_DE, ...GOALS_DE, ...LINE_DE, ...REVIEW_DE, ...WD_DE, ...DEP_DE, ...NAV_DE, ...LISTS_DE, ...INSIGHTS_DE, ...BOOK_DE, ...TABLE_DE, ...TODAY_DE, ...LEDGER_DE, ...GALLERY_DE, ...NOTICE_DE, ...SYSTEM_DE, ...DOSSIER_DE, ...BOARD_DE, ...PICK_DE, ...PERIOD_DE, ...RISK_DE, ...INBOX_DE, ...PAY_DE, ...FUND_DE, ...THREAD_DE, ...PAPER_DE, ...DENSE_DE, ...BOARD52_DE, ...BLOT_DE, ...CASE_DE, ...SHIFT_DE, ...LEAD_DE, ...TRIAGE_DE, ...SOP_DE, ...ALERT_DE, ...HEALTH_DE, ...INTRO_DE, ...EXPIRY_DE, ...REJECT_DE, ...HEAT_DE, ...DIGEST_DE, ...COMPARE_DE, ...STALE_DE, ...DUPE_DE, ...MIX_DE, ...VIP_DE, ...CLOCK_DE, ...PULSE_DE, ...WEEK_DE, ...SHIELD_DE, ...LIST_DE, ...LANE_DE, ...EDGE_DE, ...RW_DE, ...PACK_DE, ...MARK_DE, ...SZ_DE, ...FM_DE, ...PIN_DE, ...DT_DE, ...VS_DE, ...UM_DE, ...BN_DE, ...QK_DE, ...CH_DE, ...NP_DE };

const ruBase: typeof enBase = {
  money: "Деньги",
  v3mark: "CRM v3",
  searchFab: "Поиск",
  pullHint: "Потяните, чтобы обновить",
  refreshing: "Обновление",
  openRow: "Открыть",
};

const ru = { ...ruBase, ...DESK_RU, ...LATER_RU, ...CASH_RU, ...PEOPLE_RU, ...GOALS_RU, ...LINE_RU, ...REVIEW_RU, ...WD_RU, ...DEP_RU, ...NAV_RU, ...LISTS_RU, ...INSIGHTS_RU, ...BOOK_RU, ...TABLE_RU, ...TODAY_RU, ...LEDGER_RU, ...GALLERY_RU, ...NOTICE_RU, ...SYSTEM_RU, ...DOSSIER_RU, ...BOARD_RU, ...PICK_RU, ...PERIOD_RU, ...RISK_RU, ...INBOX_RU, ...PAY_RU, ...FUND_RU, ...THREAD_RU, ...PAPER_RU, ...DENSE_RU, ...BOARD52_RU, ...BLOT_RU, ...CASE_RU, ...SHIFT_RU, ...LEAD_RU, ...TRIAGE_RU, ...SOP_RU, ...ALERT_RU, ...HEALTH_RU, ...INTRO_RU, ...EXPIRY_RU, ...REJECT_RU, ...HEAT_RU, ...DIGEST_RU, ...COMPARE_RU, ...STALE_RU, ...DUPE_RU, ...MIX_RU, ...VIP_RU, ...CLOCK_RU, ...PULSE_RU, ...WEEK_RU, ...SHIELD_RU, ...LIST_RU, ...LANE_RU, ...EDGE_RU, ...RW_RU, ...PACK_RU, ...MARK_RU, ...SZ_RU, ...FM_RU, ...PIN_RU, ...DT_RU, ...VS_RU, ...UM_RU, ...BN_RU, ...QK_RU, ...CH_RU, ...NP_RU };

const arBase: typeof enBase = {
  money: "المال",
  v3mark: "CRM v3",
  searchFab: "بحث",
  pullHint: "اسحب للتحديث",
  refreshing: "جارٍ التحديث",
  openRow: "فتح",
};

const ar = { ...arBase, ...DESK_AR, ...LATER_AR, ...CASH_AR, ...PEOPLE_AR, ...GOALS_AR, ...LINE_AR, ...REVIEW_AR, ...WD_AR, ...DEP_AR, ...NAV_AR, ...LISTS_AR, ...INSIGHTS_AR, ...BOOK_AR, ...TABLE_AR, ...TODAY_AR, ...LEDGER_AR, ...GALLERY_AR, ...NOTICE_AR, ...SYSTEM_AR, ...DOSSIER_AR, ...BOARD_AR, ...PICK_AR, ...PERIOD_AR, ...RISK_AR, ...INBOX_AR, ...PAY_AR, ...FUND_AR, ...THREAD_AR, ...PAPER_AR, ...DENSE_AR, ...BOARD52_AR, ...BLOT_AR, ...CASE_AR, ...SHIFT_AR, ...LEAD_AR, ...TRIAGE_AR, ...SOP_AR, ...ALERT_AR, ...HEALTH_AR, ...INTRO_AR, ...EXPIRY_AR, ...REJECT_AR, ...HEAT_AR, ...DIGEST_AR, ...COMPARE_AR, ...STALE_AR, ...DUPE_AR, ...MIX_AR, ...VIP_AR, ...CLOCK_AR, ...PULSE_AR, ...WEEK_AR, ...SHIELD_AR, ...LIST_AR, ...LANE_AR, ...EDGE_AR, ...RW_AR, ...PACK_AR, ...MARK_AR, ...SZ_AR, ...FM_AR, ...PIN_AR, ...DT_AR, ...VS_AR, ...UM_AR, ...BN_AR, ...QK_AR, ...CH_AR, ...NP_AR };

export const CRM_V3_COPY = { en, tr, de, ru, ar };

export type CrmV3CopyKey = keyof typeof en;

export function crmv3Text(locale: string, key: CrmV3CopyKey): string {
  const base = locale.toLowerCase().split("-")[0];
  const table = CRM_V3_COPY[base as keyof typeof CRM_V3_COPY] || CRM_V3_COPY.en;
  return table[key] || CRM_V3_COPY.en[key];
}
