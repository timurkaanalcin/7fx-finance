/** Pure helpers for CRM v3 insights and saved browser keys. Counts stay inside one currency. */

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
  "crmv3-theme": ["Theme", "Tema", "Thema", "Тема", "السمة"],
  "crmv3-motion": ["Motion", "Hareket", "Bewegung", "Движение", "الحركة"],
  "crmv3-rail-fold": ["Collapsed rail", "Dar ray", "Eingeklappte Leiste", "Свёрнутая полоса", "الشريط المطوي"],
  "crmv3-smart-lists": ["Named lists", "Adlı listeler", "Benannte Listen", "Именованные списки", "قوائم مسماة"],
  "crmv3-staff-prefs": ["Staff profile", "Personel profili", "Personalprofil", "Профиль сотрудника", "ملف الموظف"],
  "crmv3-banner": ["Banner", "Şerit", "Hinweis", "Полоса", "الشريط"],
  "crmv3-decimals": ["Decimals", "Ondalık", "Dezimalen", "Знаки", "الكسور"],
  "crmv3-trail": ["This visit", "Bu ziyaret", "Dieser Besuch", "Этот визит", "هذه الزيارة"],
  "crmv3-pins": ["Pins", "Sabitlemeler", "Pins", "Закрепления", "التثبيت"],
  "crmv3-tags": ["Tags", "Etiketler", "Marken", "Метки", "الوسوم"],
  "crmv3-recent": ["Recent customers", "Son müşteriler", "Letzte Kunden", "Недавние клиенты", "عملاء حديثون"],
  "crmv3-dnc": ["Do not call", "Arama yok", "Nicht anrufen", "Не звонить", "لا تتصل"],
  "crmv3-prefer-time": ["Preferred time", "Tercih saati", "Wunschzeit", "Удобное время", "الوقت المفضل"],
  "crmv3-palette-recent": ["Recent search", "Son arama", "Letzte Suche", "Недавний поиск", "بحث حديث"],
  "crmv3-call-log": ["Call notes", "Arama notları", "Anrufnotizen", "Заметки звонков", "ملاحظات الاتصال"],
  "crmv3-dep-review": ["Deposit checklist", "Yatırım listesi", "Einzahlungs-Liste", "Список депозита", "قائمة الإيداع"],
  "crmv3-wd-review": ["Withdrawal checklist", "Çekim listesi", "Auszahlungs-Liste", "Список вывода", "قائمة السحب"],
  "crmv3-doc-review": ["Document checklist", "Belge listesi", "Dokumenten-Liste", "Список документов", "قائمة المستندات"],
  "crmv3-inbox-canned": ["Canned replies", "Hazır yanıtlar", "Textbausteine", "Заготовки", "ردود جاهزة"],
  "crmv3-overview-layout": ["Overview layout", "Özet düzeni", "Übersicht", "Макет обзора", "ترتيب النظرة"],
  "crmv3-month-targets": ["Month targets", "Ay hedefleri", "Monatsziele", "Цели месяца", "أهداف الشهر"],
  "crmv3-view-history": ["Opened pages", "Açılan sayfalar", "Geöffnete Seiten", "Открытые страницы", "صفحات مفتوحة"],
  "crmv3-alert-rules": ["Alert rules", "Uyarı kuralları", "Hinweisregeln", "Правила оповещений", "قواعد التنبيه"],
  "crmv3-goal": ["Goal", "Hedef", "Ziel", "Цель", "الهدف"],
  "crmv3-agent-targets": ["Agent targets", "Temsilci hedefleri", "Agentenziele", "Цели агента", "أهداف الوكيل"],
  "crmv3-lead-stage": ["Lead stage", "Aday aşaması", "Lead-Stufe", "Этап лида", "مرحلة العميل"],
  "crmv3-lead-stage-at": ["Stage time", "Aşama zamanı", "Stufenzeit", "Время этапа", "وقت المرحلة"],
  "crmv3-lead-follow": ["Follow-up", "Takip", "Nachfassen", "Повторный контакт", "المتابعة"],
  "crmv3-lead-heat": ["Lead heat", "Aday ısısı", "Lead-Wärme", "Тепло лида", "حرارة العميل"],
  "crmv3-lead-note": ["Lead note", "Aday notu", "Lead-Notiz", "Заметка лида", "ملاحظة العميل"],
  "crmv3-risk-threshold": ["Large from", "Büyük eşiği", "Groß ab", "Крупный от", "كبير من"],
  "crmv3-risk-flags": ["Risk flags", "Risk işaretleri", "Risikomarken", "Отметки риска", "علامات الخطر"],
  "crmv3-risk-hide": ["Hidden watch", "Gizli izleme", "Versteckte Watch", "Скрытый контроль", "مراقبة مخفية"],
  "crmv3-feed-pins": ["Pinned feed", "Sabit akış", "Angehefteter Feed", "Закреплённая лента", "تغذية مثبتة"],
  "crmv3-fin-look": ["Finance look", "Para görünümü", "Geldansicht", "Вид денег", "عرض المال"],
  "crmv3-fin-checks": ["Finance checks", "Para kontrolleri", "Geldprüfungen", "Проверки денег", "فحوص المال"],
  "crmv3-fin-reason": ["Finance reason", "Para gerekçesi", "Geldgrund", "Причина денег", "سبب المال"],
  "crmv3-columns": ["Columns", "Sütunlar", "Spalten", "Колонки", "أعمدة"],
  "crmv3-tasks": ["Tasks", "Görevler", "Aufgaben", "Задачи", "مهام"],
  "crmv3-note-pins": ["Pinned notes", "Sabit notlar", "Angeheftete Notizen", "Закреплённые заметки", "ملاحظات مثبتة"],
  "crmv3-staff-load": ["Staff filter", "Personel süzgeci", "Personalfilter", "Фильтр сотрудников", "مرشّح الموظفين"],
  "crmv3-kyc-check": ["Reviewer checklist", "İnceleme listesi", "Prüfliste", "Список проверки", "قائمة المراجعة"],
  "crmv3-notif-read": ["Notice read", "Bildirim okundu", "Hinweis gelesen", "Уведомление прочитано", "تنبيه مقروء"],
  "crmv3-board-density": ["Card density", "Kart yoğunluğu", "Kartendichte", "Плотность карточек", "كثافة البطاقات"],
  "crmv3-board-stages": ["Board stages", "Tahta aşamaları", "Tafelphasen", "Этапы доски", "مراحل اللوحة"],
  "crmv3-board-tips": ["Dismissed tips", "Kapatılan ipuçları", "Verworfene Hinweise", "Закрытые подсказки", "تلميحات مغلقة"],
  "crmv3-list-picks": ["Local picks", "Yerel seçim", "Lokale Auswahl", "Локальный выбор", "تحديد محلي"],
  "crmv3-list-pins": ["Pinned lists", "Sabitlenen listeler", "Angeheftete Listen", "Закреплённые списки", "قوائم مثبتة"],
  "crmv3-risk-thresholds": ["Risk thresholds", "Risk eşikleri", "Risikogrenzen", "Пороги риска", "حدود المخاطر"],
  "crmv3-risk-count": ["Withdrawal count", "Çekim sayısı", "Auszahlungszahl", "Число выводов", "عدد السحوبات"],
  "crmv3-risk-notes": ["Risk notes", "Risk notları", "Risikonotizen", "Заметки риска", "ملاحظات المخاطر"],
  "crmv3-sla-hours": ["Hour limit", "Saat sınırı", "Stundenlimit", "Предел в часах", "حد الساعات"],
  "crmv3-ticket-views": ["Ticket views", "Talep görünümleri", "Ticket-Ansichten", "Виды заявок", "عروض الطلبات"],
  "crmv3-ticket-due": ["Due-soon window", "Yakında penceresi", "Fenster bald fällig", "Окно «скоро»", "نافذة القرب"],
  "crmv3-desk-role": ["Viewer preview", "İzleyici önizlemesi", "Betrachtervorschau", "Режим просмотра", "معاينة المشاهد"],
  "crmv3-payout-views": ["Withdrawal views", "Çekim görünümleri", "Auszahlungsansichten", "Виды выводов", "عروض السحب"],
  "crmv3-access-views": ["Permission views", "Yetki görünümleri", "Rechte-Ansichten", "Виды прав", "عروض الصلاحيات"],
  "crmv3-funding-views": ["Deposit views", "Yatırım görünümleri", "Einzahlungsansichten", "Виды депозитов", "عروض الإيداع"],
  "crmv3-segment-cards": ["Segment pins", "Segment sabitlemeleri", "Segment-Pins", "Закрепления сегментов", "تثبيت الشرائح"],
  "crmv3-thread-drafts": ["Thread drafts", "Yazışma taslakları", "Entwürfe", "Черновики", "مسودات"],
  "crmv3-thread-canned": ["Saved replies", "Kayıtlı yanıtlar", "Gespeicherte Antworten", "Сохранённые ответы", "ردود محفوظة"],
  "crmv3-gallery-checks": ["Document checklist", "Belge listesi", "Dokumentenliste", "Список документов", "قائمة الوثائق"],
  "crmv3-dense-columns": ["Dense columns", "Sıkı sütunlar", "Dichte Spalten", "Плотные колонки", "أعمدة كثيفة"],
  "crmv3-day-done": ["Day done", "Gün tamam", "Tag erledigt", "День сделан", "اليوم تم"],
  "crmv3-inbox-local-read": ["Notice read marks", "Bildirim okundu", "Hinweis gelesen", "Прочтение уведомлений", "قراءة الإشعارات"],
  "crmv3-tag-board-pins": ["Pinned tags", "Sabit etiketler", "Angeheftete Marken", "Закреплённые метки", "وسوم مثبتة"],
  "crmv3-tag-board-hidden": ["Hidden tags", "Gizli etiketler", "Versteckte Marken", "Скрытые метки", "وسوم مخفية"],
  "crmv3-desk-pad": ["Desk pad", "Masa notu", "Tischblock", "Блокнот стола", "دفتر المكتب"],
  "crmv3-case-pins": ["Case pins", "Dosya sabitleme", "Fall-Pins", "Закрепления дел", "تثبيت الملفات"],
  "crmv3-shortcuts": ["Shortcut rail", "Kısayol şeridi", "Kurzleiste", "Полоса ярлыков", "شريط الاختصارات"],
  "crmv3-shift-handoff": ["Shift handoff", "Vardiya devri", "Schichtübergabe", "Передача смены", "تسليم الوردية"],
  "crmv3-lead-watch": ["Lead watch", "Aday izleme", "Lead-Beobachtung", "Наблюдение за лидом", "متابعة العميل"],
  "crmv3-alert-mute": ["Muted alerts", "Sessiz uyarılar", "Stummgeschaltete Hinweise", "Отключённые сигналы", "تنبيهات صامتة"],
  "crmv3-focus-flag": ["Focus", "Odak", "Fokus", "Фокус", "التركيز"],
  "crmv3-quiet-hours": ["Quiet hours", "Sessiz saatler", "Ruhezeiten", "Тихие часы", "ساعات الهدوء"],
  "crmv3-triage-pins": ["Triage pins", "Ayrım sabitleme", "Triage-Pins", "Закрепления разбора", "تثبيت الفرز"],
  "crmv3-triage-snooze": ["Triage snooze", "Ayrım erteleme", "Triage-Schlummern", "Отложить разбор", "تأجيل الفرز"],
  "crmv3-gold-intensity": ["Gold intensity", "Altın yoğunluğu", "Goldstärke", "Насыщенность золота", "شدة الذهب"],
  "crmv3-chrome-density": ["Chrome density", "Krom yoğunluğu", "Chromdichte", "Плотность хрома", "كثافة الإطار"],
  "crmv3-sop-lists": ["Desk checklists", "Masa listeleri", "Tischlisten", "Списки стола", "قوائم المكتب"],
  "crmv3-risk-mute": ["Muted severities", "Sessiz şiddetler", "Stumme Schwere", "Скрытые уровни", "الشدات المكتومة"],
  "crmv3-risk-ack": ["Acknowledged alerts", "Onaylanan uyarılar", "Zur Kenntnis genommene Hinweise", "Подтверждённые сигналы", "التنبيهات المقرّة"],
  "crmv3-bookmark-folders": ["Bookmark folders", "Yer imi klasörleri", "Lesezeichenordner", "Папки закладок", "مجلدات الإشارات"],
  "crmv3-health-watch": ["Watched customers", "İzlenen müşteriler", "Beobachtete Kunden", "Наблюдаемые клиенты", "العملاء تحت المراقبة"],
  "crmv3-scratchboard": ["Scratchboard", "Not tahtası", "Notiztafel", "Черновая доска", "لوحة الملاحظات"],
  "crmv3-ib-marks": ["Introducer marks", "Tanıtıcı işaretleri", "Vermittlermarken", "Отметки посредника", "علامات المعرّف"],
  "crmv3-jump-history": ["Recent routes", "Son yollar", "Letzte Routen", "Недавние маршруты", "المسارات الأخيرة"],
  "crmv3-doc-snooze": ["Document snooze", "Belge erteleme", "Dokument-Schlummern", "Отложить документ", "تأجيل المستند"],
  "crmv3-doc-window": ["Document window", "Belge penceresi", "Dokumentfenster", "Окно документа", "نافذة المستند"],
  "crmv3-panel-density": ["Panel density", "Panel yoğunluğu", "Paneldichte", "Плотность панелей", "كثافة اللوحات"],
  "crmv3-reject-pins": ["Pinned rejected orders", "Sabitlenen reddedilen emirler", "Angeheftete abgelehnte Orders", "Закреплённые отклонённые ордера", "الأوامر المرفوضة المثبتة"],
  "crmv3-vault-hints": ["Vault labels", "Kasa etiketleri", "Tresorlabels", "Метки хранилища", "تسميات الخزنة"],
  "crmv3-heat-pins": ["Pinned heatmap cells", "Sabitlenen ısı hücreleri", "Angeheftete Wärmezellen", "Закреплённые ячейки", "الخلايا المثبتة"],
  "crmv3-heat-mode": ["Heatmap grouping", "Isı gruplaması", "Wärmegruppierung", "Группировка карты", "تجميع الخريطة"],
  "crmv3-cheat-sheet": ["Desk tips", "Masa ipuçları", "Tischtipps", "Подсказки стола", "نصائح المكتب"],
  "crmv3-digest-hide": ["Hidden digest rows", "Gizlenen özet satırları", "Versteckte Übersicht", "Скрытые строки сводки", "صفوف الملخص المخفية"],
  "crmv3-panel-glass": ["Panel glass", "Pano camı", "Flächenglas", "Стекло панелей", "زجاج اللوحات"],
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
    .filter((row) => row.key.startsWith("crmv3-"))
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
