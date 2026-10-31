/** CRM v3 copy for the statement and currency desk. */
type Row = readonly [string, string, string, string, string];
const ROWS = {
  statementSheet: ["Statement", "Ekstre", "Auszug", "Выписка", "كشف"] as Row,
  statementHint: ["This is not a ledger document. Nothing is sent.", "Bu bir defter belgesi değildir. Hiçbir şey gönderilmez.", "Das ist kein Ledger-Beleg. Nichts wird gesendet.", "Это не документ книги. Ничего не отправляется.", "هذا ليس مستند دفتر. لا يُرسل شيء."] as Row,
  statementFrom: ["From", "Başlangıç", "Von", "С", "من"] as Row,
  statementTo: ["To", "Bitiş", "Bis", "По", "إلى"] as Row,
  statementHideEmpty: ["Hide empty parts", "Boş bölümleri gizle", "Leere Teile ausblenden", "Скрыть пустые части", "أخفِ الأقسام الفارغة"] as Row,
  statementCopy: ["Copy summary", "Özeti kopyala", "Zusammenfassung kopieren", "Копировать сводку", "انسخ الملخص"] as Row,
  statementCopied: ["Summary copied. Nothing is sent.", "Özet kopyalandı. Hiçbir şey gönderilmez.", "Zusammenfassung kopiert. Nichts wird gesendet.", "Сводка скопирована. Ничего не отправляется.", "نُسخ الملخص. لا يُرسل شيء."] as Row,
  statementPrint: ["Print statement", "Ekstreyi yazdır", "Auszug drucken", "Печать выписки", "اطبع الكشف"] as Row,
  statementPrinted: ["Printed", "Yazdırıldı", "Gedruckt", "Напечатано", "طُبع"] as Row,
  statementDeposits: ["Deposits", "Yatırımlar", "Einzahlungen", "Депозиты", "إيداعات"] as Row,
  statementWithdrawals: ["Withdrawals", "Çekimler", "Auszahlungen", "Выводы", "سحوبات"] as Row,
  statementPositions: ["Positions", "Pozisyonlar", "Positionen", "Позиции", "صفقات"] as Row,
  statementNotes: ["Notes", "Notlar", "Notizen", "Заметки", "ملاحظات"] as Row,
  statementPending: ["Pending", "Bekleyen", "Offen", "В ожидании", "قيد الانتظار"] as Row,
  statementApproved: ["Approved", "Onaylı", "Freigegeben", "Одобрено", "معتمد"] as Row,
  statementLatest: ["Latest note", "Son not", "Letzte Notiz", "Последняя заметка", "آخر ملاحظة"] as Row,
  payMethods: ["Payment methods", "Ödeme yöntemleri", "Zahlungsmethoden", "Способы оплаты", "طرق الدفع"] as Row,
  payHint: ["These totals follow the rows on this page.", "Bu toplamlar bu sayfadaki satırları izler.", "Diese Summen folgen den Zeilen auf dieser Seite.", "Итоги следуют строкам этой страницы.", "هذه المجاميع تتبع صفوف هذه الصفحة."] as Row,
  payCount: ["Count", "Adet", "Anzahl", "Число", "العدد"] as Row,
  paySort: ["Sort by count", "Sayıya göre sırala", "Nach Anzahl sortieren", "Сортировка по числу", "رتّب حسب العدد"] as Row,
  payEmpty: ["No methods on this page", "Bu sayfada yöntem yok", "Keine Methoden auf dieser Seite", "На этой странице нет способов", "لا طرق في هذه الصفحة"] as Row,
  payLargest: ["Most used", "En çok kullanılan", "Am häufigsten", "Самый частый", "الأكثر استخدامًا"] as Row,
  payApproval: ["Approved share", "Onay payı", "Freigabeanteil", "Доля одобренных", "حصة الاعتماد"] as Row,
  payPending: ["Pending", "Bekleyen", "Offen", "В ожидании", "قيد الانتظار"] as Row,
  payAge: ["Average age", "Ortalama yaş", "Durchschnittsalter", "Средний возраст", "متوسط العمر"] as Row,
  fxDesk: ["Currencies", "Para birimleri", "Währungen", "Валюты", "العملات"] as Row,
  fxHint: ["Conversion is display only. Nothing is posted.", "Çevirme yalnızca gösterimdir. Hiçbir şey gönderilmez.", "Die Umrechnung ist nur Anzeige. Nichts wird gesendet.", "Пересчёт только для показа. Ничего не отправляется.", "التحويل للعرض فقط. لا يُرسل شيء."] as Row,
  fxAge: ["Quote time", "Kur saati", "Kurszeit", "Время котировки", "وقت السعر"] as Row,
  fxMissing: ["Missing", "Yok", "Fehlt", "Нет", "غير متوفر"] as Row,
  fxAmount: ["Amount", "Tutar", "Betrag", "Сумма", "المبلغ"] as Row,
  fxFrom: ["From", "Kaynak", "Von", "Из", "من"] as Row,
  fxTo: ["To", "Hedef", "Nach", "В", "إلى"] as Row,
  fxResult: ["Result", "Sonuç", "Ergebnis", "Результат", "النتيجة"] as Row,
  fxMixBal: ["Balance mix", "Bakiye dağılımı", "Saldoverteilung", "Состав балансов", "توزيع الأرصدة"] as Row,
  fxMixCash: ["Deposit mix", "Yatırım dağılımı", "Einzahlungsverteilung", "Состав депозитов", "توزيع الإيداعات"] as Row,
  fxLargest: ["Largest", "En büyük", "Größte", "Крупнейшая", "الأكبر"] as Row,
  quickPlus: ["Create", "Oluştur", "Anlegen", "Создать", "إنشاء"] as Row,
  quickHint: ["Customer, note, and reminder use the existing save. A call stays in this browser.", "Müşteri, not ve anımsatıcı var olan kaydı kullanır. Arama bu tarayıcıda kalır.", "Kunde, Notiz und Erinnerung nutzen das vorhandene Speichern. Ein Anruf bleibt im Browser.", "Клиент, заметка и напоминание используют существующее сохранение. Звонок остаётся в браузере.", "العميل والملاحظة والتذكير يستخدمون الحفظ الموجود. المكالمة تبقى في المتصفح."] as Row,
  quickCustomer: ["Customer", "Müşteri", "Kunde", "Клиент", "عميل"] as Row,
  quickNote: ["Note", "Not", "Notiz", "Заметка", "ملاحظة"] as Row,
  quickReminder: ["Reminder", "Anımsatıcı", "Erinnerung", "Напоминание", "تذكير"] as Row,
  quickCall: ["Call log", "Arama kaydı", "Anrufprotokoll", "Журнал звонка", "سجل مكالمة"] as Row,
  quickSearch: ["Search", "Ara", "Suche", "Поиск", "بحث"] as Row,
  quickLocal: ["This stays in this browser. Nothing is sent.", "Bu tarayıcıda kalır. Hiçbir şey gönderilmez.", "Das bleibt in diesem Browser. Nichts wird gesendet.", "Это остаётся в этом браузере. Ничего не отправляется.", "هذا يبقى في هذا المتصفح. لا يُرسل شيء."] as Row,
  quickSends: ["This uses the existing save.", "Bu, var olan kaydı kullanır.", "Das nutzt das vorhandene Speichern.", "Это использует существующее сохранение.", "هذا يستخدم الحفظ الموجود."] as Row,
  quickSaved: ["Saved", "Kaydedildi", "Gespeichert", "Сохранено", "تم الحفظ"] as Row,
  quickNeedId: ["Customer id", "Müşteri kimliği", "Kunden-ID", "Идентификатор клиента", "معرف العميل"] as Row,
} as const;

type Key = keyof typeof ROWS;
function column(index: 0 | 1 | 2 | 3 | 4): { [K in Key]: string } {
  const out = {} as { [K in Key]: string };
  (Object.keys(ROWS) as Key[]).forEach((key) => { out[key] = ROWS[key][index]; });
  return out;
}

export const CASH_EN = column(0);
export const CASH_TR = column(1);
export const CASH_DE = column(2);
export const CASH_RU = column(3);
export const CASH_AR = column(4);

