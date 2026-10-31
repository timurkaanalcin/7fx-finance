/** CRM v3 copy for monthly goals and the recent trail. */
type Row = readonly [string, string, string, string, string];
const ROWS = {
  goalsTitle: ["Goals", "Hedefler", "Ziele", "Цели", "الأهداف"] as Row,
  goalsHint: ["Targets stay in this browser. Month-to-date uses the loaded rows. The run rate is an estimate.", "Hedefler bu tarayıcıda durur. Ay başından bugüne yüklenen satırlardır. Koşu hızı bir tahmindir.", "Ziele bleiben in diesem Browser. Der Monat bis heute nutzt die geladenen Zeilen. Die Hochrechnung ist eine Schätzung.", "Цели остаются в этом браузере. Месяц до сегодня считается по загруженным строкам. Темп — это оценка.", "الأهداف تبقى في هذا المتصفح. من أول الشهر حتى اليوم من الصفوف المحمّلة. معدل السير تقدير."] as Row,
  goalFtd: ["First deposits", "İlk yatırımlar", "Ersteinzahlungen", "Первые депозиты", "أول الإيداعات"] as Row,
  goalFtdHint: ["A first deposit is the earliest deposit in the loaded list, when that date is this month.", "İlk yatırım, yüklenen listedeki en erken yatırımdır ve tarihi bu aydaysa sayılır.", "Eine Ersteinzahlung ist die früheste Einzahlung in der geladenen Liste, wenn das Datum in diesem Monat liegt.", "Первый депозит — самый ранний в загруженном списке, если его дата в этом месяце.", "أول إيداع هو الأقدم في القائمة المحمّلة إذا كان تاريخه في هذا الشهر."] as Row,
  goalTraders: ["Active traders", "İşlem yapanlar", "Aktive Trader", "Активные трейдеры", "المتداولون النشطون"] as Row,
  goalTraderHint: ["A trader counts once when a loaded position was opened this month.", "Bir kişi, bu ay açılmış yüklü bir pozisyonu varsa bir kez sayılır.", "Eine Person zählt einmal, wenn eine geladene Position in diesem Monat eröffnet wurde.", "Человек считается один раз, если загруженная позиция открыта в этом месяце.", "يُحسب الشخص مرة واحدة إذا فُتح مركز محمّل في هذا الشهر."] as Row,
  goalDeposits: ["Deposits", "Yatırımlar", "Einzahlungen", "Депозиты", "الإيداعات"] as Row,
  goalDepositHint: ["Totals stay in the currency of the loaded row. TRY is not added into USD.", "Toplamlar satırın para biriminde kalır. TRY, USD içine eklenmez.", "Summen bleiben in der Währung der Zeile. TRY wird nicht in USD addiert.", "Суммы остаются в валюте строки. TRY не прибавляется к USD.", "المجاميع تبقى بعملة الصف. لا تُضاف الليرة التركية إلى الدولار."] as Row,
  goalMtd: ["Month to date", "Ay başından bugüne", "Monat bis heute", "С начала месяца", "من أول الشهر"] as Row,
  goalEstimate: ["Estimate", "Tahmin", "Schätzung", "Оценка", "تقدير"] as Row,
  goalNoTarget: ["No target stored", "Kayıtlı hedef yok", "Kein Ziel gespeichert", "Цель не сохранена", "لا هدف محفوظ"] as Row,
  goalDay: ["Day of the month", "Ayın günü", "Tag im Monat", "День месяца", "يوم الشهر"] as Row,
  goalAhead: ["Ahead of a straight pace", "Düz temponun önünde", "Vor dem geraden Tempo", "Впереди ровного темпа", "أمام الإيقاع المستقيم"] as Row,
  goalBehind: ["Behind a straight pace", "Düz temponun gerisinde", "Hinter dem geraden Tempo", "Позади ровного темпа", "خلف الإيقاع المستقيم"] as Row,
  goalEven: ["On a straight pace", "Düz tempoda", "Im geraden Tempo", "В ровном темпе", "على الإيقاع المستقيم"] as Row,
  goalLeft: ["Still to go", "Kalan", "Noch offen", "Ещё осталось", "المتبقي"] as Row,
  goalPast: ["Past the target", "Hedefi geçti", "Über dem Ziel", "Выше цели", "تجاوز الهدف"] as Row,
  goalMet: ["On the target", "Hedefte", "Auf dem Ziel", "На цели", "على الهدف"] as Row,
  goalReset: ["Reset these targets", "Bu hedefleri sıfırla", "Diese Ziele zurücksetzen", "Сбросить эти цели", "إعادة هذه الأهداف"] as Row,
  recentViews: ["Opened recently", "Son açılanlar", "Zuletzt geöffnet", "Недавно открытые", "فُتح مؤخرًا"] as Row,
  recentHint: ["Stored in this browser. A finance row or ticket reopens when it is in the loaded list.", "Bu tarayıcıda durur. Finans satırı veya bilet, yüklenen listede varsa yeniden açılır.", "Bleibt in diesem Browser. Eine Finanzzeile oder ein Ticket öffnet sich wieder, wenn sie in der geladenen Liste steht.", "Хранится в этом браузере. Строка финансов или тикет откроется снова, если она есть в загруженном списке.", "يُحفظ في هذا المتصفح. صف مالي أو تذكرة يُعاد فتحه إذا كان في القائمة المحمّلة."] as Row,
  recentEmpty: ["Nothing opened in this browser yet", "Bu tarayıcıda henüz bir şey açılmadı", "In diesem Browser wurde noch nichts geöffnet", "В этом браузере ещё ничего не открывали", "لم يُفتح شيء في هذا المتصفح بعد"] as Row,
  recentClear: ["Clear this list", "Bu listeyi temizle", "Diese Liste leeren", "Очистить этот список", "مسح هذه القائمة"] as Row,
  kindCustomer: ["Customer", "Müşteri", "Kunde", "Клиент", "عميل"] as Row,
  kindTicket: ["Ticket", "Bilet", "Ticket", "Тикет", "تذكرة"] as Row,
  kindFinance: ["Finance", "Finans", "Finanzen", "Финансы", "المالية"] as Row,
  crumbs: ["Path", "Yol", "Pfad", "Путь", "المسار"] as Row,
  backStack: ["Back", "Geri", "Zurück", "Назад", "رجوع"] as Row,
} as const;

type Key = keyof typeof ROWS;
function column(index: 0 | 1 | 2 | 3 | 4): { [K in Key]: string } {
  const out = {} as { [K in Key]: string };
  (Object.keys(ROWS) as Key[]).forEach((key) => { out[key] = ROWS[key][index]; });
  return out;
}

export const GOALS_EN = column(0);
export const GOALS_TR = column(1);
export const GOALS_DE = column(2);
export const GOALS_RU = column(3);
export const GOALS_AR = column(4);
