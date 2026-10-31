/** Pure helpers for CRM v4 round 32. Counts stay inside one currency. */

export type PeriodDays = 7 | 30 | 90;

export type FunnelPerson = {
  id: string;
  createdAt?: string | null;
  documentsStatus?: string | null;
  ftd?: boolean | null;
};

export type LoadedPosition = { userId?: string | null; openedAt?: string | null };

export type MoneyBit = {
  amount?: number | null;
  currency?: string | null;
  at?: string | null;
  label: string;
};

export type MoneyGroup = { currency: string; rows: { label: string; count: number; amount: number }[] };

const DAY = 86_400_000;

const CATALOG: Record<string, readonly [string, string, string, string, string]> = {
  "crmv4-theme-mode": ["Theme", "Tema", "Thema", "Тема", "السمة"],
  "crmv4-tour-done": ["Tour finished", "Tur bitti", "Rundgang fertig", "Тур закончен", "انتهت الجولة"],
  "crmv4-rail-fold": ["Collapsed rail", "Dar ray", "Eingeklappte Leiste", "Свёрнутая полоса", "الشريط المطوي"],
  "crmv4-smart-lists": ["Named lists", "Adlı listeler", "Benannte Listen", "Именованные списки", "قوائم مسماة"],
  "crmv4-staff-prefs": ["Staff profile", "Personel profili", "Personalprofil", "Профиль сотрудника", "ملف الموظف"],
  "crmv4-density": ["Density", "Sıklık", "Dichte", "Плотность", "الكثافة"],
  "crmv4-accent": ["Accent", "Vurgu", "Akzent", "Акцент", "اللمسة"],
  "crmv4-scratch-notes": ["Scratch notes", "Karalama", "Notizblock", "Черновик", "مسودة"],
  "crmv4-dep-review": ["Deposit checklist", "Yatırım listesi", "Einzahlungs-Liste", "Список депозита", "قائمة الإيداع"],
  "crmv4-wd-review": ["Withdrawal checklist", "Çekim listesi", "Auszahlungs-Liste", "Список вывода", "قائمة السحب"],
  "crmv4-doc-review": ["Document checklist", "Belge listesi", "Dokumenten-Liste", "Список документов", "قائمة المستندات"],
  "crmv4-inbox-canned": ["Canned replies", "Hazır yanıtlar", "Textbausteine", "Заготовки", "ردود جاهزة"],
  "crmv4-overview-layout": ["Overview layout", "Özet düzeni", "Übersicht", "Макет обзора", "ترتيب النظرة"],
  "crmv4-month-targets": ["Month targets", "Ay hedefleri", "Monatsziele", "Цели месяца", "أهداف الشهر"],
  "crmv4-view-history": ["Opened pages", "Açılan sayfalar", "Geöffnete Seiten", "Открытые страницы", "صفحات مفتوحة"],
  "crmv4-trail": ["This visit", "Bu ziyaret", "Dieser Besuch", "Этот визит", "هذه الزيارة"],
  "crmv4-ticket-count": ["Ticket count", "Bilet sayısı", "Ticketzahl", "Число заявок", "عدد التذاكر"],
};

const LOCALE_INDEX = { en: 0, tr: 1, de: 2, ru: 3, ar: 4 } as const;
export type PrefLocale = keyof typeof LOCALE_INDEX;

export function inPeriod(iso: string | null | undefined, days: PeriodDays, now: number): boolean {
  if (!iso) return false;
  const at = Date.parse(iso);
  if (!Number.isFinite(at)) return false;
  return at <= now && at >= now - days * DAY;
}

export function firstTradesInPeriod(rows: LoadedPosition[], days: PeriodDays, now: number): string[] {
  const earliest = new Map<string, number>();
  for (const row of rows) {
    const id = String(row.userId || "");
    const at = Date.parse(String(row.openedAt || ""));
    if (!id || !Number.isFinite(at)) continue;
    const prev = earliest.get(id);
    if (prev == null || at < prev) earliest.set(id, at);
  }
  const start = now - days * DAY;
  const out: string[] = [];
  earliest.forEach((at, id) => {
    if (at >= start && at <= now) out.push(id);
  });
  return out.sort();
}

export function funnelCounts(people: FunnelPerson[], traded: readonly string[], days: PeriodDays, now: number): { registered: number; kyc: number; deposit: number; trade: number } {
  const trades = new Set(traded);
  const registered = people.filter((row) => inPeriod(row.createdAt, days, now));
  const kyc = registered.filter((row) => String(row.documentsStatus || "").toUpperCase() === "APPROVED");
  const deposit = kyc.filter((row) => Boolean(row.ftd));
  const trade = deposit.filter((row) => trades.has(row.id));
  return { registered: registered.length, kyc: kyc.length, deposit: deposit.length, trade: trade.length };
}

export function moneyGroups(rows: MoneyBit[], days: PeriodDays, now: number): MoneyGroup[] {
  const map = new Map<string, Map<string, { count: number; amount: number }>>();
  for (const row of rows) {
    if (!inPeriod(row.at, days, now)) continue;
    const currency = String(row.currency || "").toUpperCase();
    if (!currency) continue;
    const label = row.label.trim() || "—";
    const byLabel = map.get(currency) || new Map();
    const current = byLabel.get(label) || { count: 0, amount: 0 };
    current.count += 1;
    const amount = Number(row.amount);
    if (Number.isFinite(amount)) current.amount = Math.round((current.amount + amount) * 100) / 100;
    byLabel.set(label, current);
    map.set(currency, byLabel);
  }
  const currencies: string[] = [];
  map.forEach((_value, currency) => currencies.push(currency));
  return currencies.sort((a, b) => a.localeCompare(b)).map((currency) => {
    const byLabel = map.get(currency) || new Map<string, { count: number; amount: number }>();
    const labels: string[] = [];
    byLabel.forEach((_value, label) => labels.push(label));
    return {
      currency,
      rows: labels.sort((a, b) => a.localeCompare(b)).map((label) => {
        const value = byLabel.get(label) || { count: 0, amount: 0 };
        return { label, count: value.count, amount: value.amount };
      }),
    };
  });
}

export function barShare(rows: { amount: number; count: number }[]): number[] {
  const maxAmount = Math.max(0, ...rows.map((row) => row.amount));
  if (maxAmount > 0) return rows.map((row) => Math.round((row.amount / maxAmount) * 100));
  const maxCount = Math.max(0, ...rows.map((row) => row.count));
  if (!maxCount) return rows.map(() => 0);
  return rows.map((row) => Math.round((row.count / maxCount) * 100));
}

export function byteSize(value: string): number {
  return new TextEncoder().encode(value).length;
}

export function listedKeys(entries: { key: string; value: string; where: "browser" | "tab" }[]): { key: string; value: string; where: "browser" | "tab"; bytes: number }[] {
  return entries
    .filter((row) => row.key.startsWith("crmv4-"))
    .map((row) => ({ ...row, bytes: byteSize(row.value) }))
    .sort((a, b) => a.where.localeCompare(b.where) || a.key.localeCompare(b.key));
}

export function keyTitle(key: string, locale: PrefLocale): string {
  const row = CATALOG[key];
  return row ? row[LOCALE_INDEX[locale]] : "";
}

export function catalogLocalesComplete(): boolean {
  return Object.values(CATALOG).every((row) => row.length === 5 && row.every((name) => name.trim().length > 0));
}
