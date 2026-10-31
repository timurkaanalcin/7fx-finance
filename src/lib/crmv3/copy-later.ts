/** Extra CRM v3 copy for rounds 18–20. */
type Row = readonly [string, string, string, string, string];
const ROWS = {
  teamBoard: ["Team board", "Ekip panosu", "Teampult", "Доска команды", "لوحة الفريق"] as Row,
  teamCaption: ["Counts are this page and this browser. Nothing is posted.", "Sayılar bu sayfa ve bu tarayıcıdır. Hiçbir şey gönderilmez.", "Zahlen sind diese Seite und dieser Browser. Nichts wird gesendet.", "Счётчики этой страницы и этого браузера. Ничего не отправляется.", "الأعداد من هذه الصفحة وهذا المتصفح. لا يُرسل شيء."] as Row,
  teamFind: ["Find a person", "Kişi ara", "Person suchen", "Найти человека", "ابحث عن شخص"] as Row,
  teamHideIdle: ["Hide empty", "Boşları gizle", "Leere ausblenden", "Скрыть пустые", "أخفِ الفارغ"] as Row,
  teamBehind: ["Behind target", "Hedefin gerisinde", "Hinter dem Ziel", "Ниже цели", "دون الهدف"] as Row,
  teamCsv: ["Export board", "Panoyu dışa aktar", "Tafel exportieren", "Экспорт доски", "تصدير اللوحة"] as Row,
  teamRank: ["Rank", "Sıra", "Rang", "Место", "الترتيب"] as Row,
  teamAssigned: ["Assigned", "Atanan", "Zugewiesen", "Назначено", "معيّن"] as Row,
  teamFunded: ["Funded", "Fonlanan", "Finanziert", "С депозитом", "ممول"] as Row,
  teamCalls: ["Calls", "Aramalar", "Anrufe", "Звонки", "مكالمات"] as Row,
  teamTickets: ["Tickets", "Talepler", "Tickets", "Заявки", "تذاكر"] as Row,
  teamTarget: ["Target", "Hedef", "Ziel", "Цель", "الهدف"] as Row,
  teamPace: ["Calls each", "Kişi başı arama", "Anrufe je Kunde", "Звонки на клиента", "مكالمات لكل عميل"] as Row,
  teamShare: ["Funded share", "Fonlanan pay", "Finanzierungsanteil", "Доля с депозитом", "حصة التمويل"] as Row,
  teamProgress: ["Progress", "İlerleme", "Fortschritt", "Прогресс", "التقدم"] as Row,
  teamGap: ["Still to go", "Kalan", "Noch offen", "Ещё", "المتبقي"] as Row,
  teamFirst: ["First", "Birinci", "Erster", "Первый", "الأول"] as Row,
  watchTitle: ["Risk watch", "Risk izleme", "Risiko-Watch", "Контроль риска", "مراقبة المخاطر"] as Row,
  watchCaption: ["Nothing is sent and nothing is blocked.", "Hiçbir şey gönderilmez ve hiçbir şey durdurulmaz.", "Nichts wird gesendet und nichts wird blockiert.", "Ничего не отправляется и ничего не блокируется.", "لا يُرسل شيء ولا يُمنع شيء."] as Row,
  watchKyc: ["KYC gap", "KYC eksiği", "KYC-Lücke", "Пробел KYC", "فجوة KYC"] as Row,
  watchLarge: ["Large deposit", "Büyük yatırım", "Große Einzahlung", "Крупный депозит", "إيداع كبير"] as Row,
  watchRapid: ["Rapid deposits", "Hızlı yatırımlar", "Schnelle Einzahlungen", "Частые депозиты", "إيداعات متقاربة"] as Row,
  watchWithdraw: ["Many withdrawals", "Çok çekim", "Viele Auszahlungen", "Много выводов", "سحوبات كثيرة"] as Row,
  watchQuiet: ["Quiet then active", "Sessizken hareket", "Still, dann aktiv", "Тишина, затем активность", "هادئ ثم نشط"] as Row,
  watchThreshold: ["Large from", "Büyük eşiği", "Groß ab", "Крупный от", "كبير من"] as Row,
  watchSearch: ["Find a hit", "Kayıt ara", "Treffer suchen", "Найти строку", "ابحث عن نتيجة"] as Row,
  watchCsv: ["Export watch", "İzlemeyi dışa aktar", "Watch exportieren", "Экспорт контроля", "تصدير المراقبة"] as Row,
  watchFlag: ["Flag", "İşaretle", "Markieren", "Отметить", "علّم"] as Row,
  watchClear: ["Clear flag", "İşareti kaldır", "Markierung weg", "Снять отметку", "أزل العلامة"] as Row,
  watchHide: ["Hide", "Gizle", "Ausblenden", "Скрыть", "أخفِ"] as Row,
  colChooser: ["Columns", "Sütunlar", "Spalten", "Столбцы", "الأعمدة"] as Row,
  denseRows: ["Dense rows", "Sık satır", "Dichte Zeilen", "Плотные строки", "صفوف كثيفة"] as Row,
  resetCols: ["Reset columns", "Sütunları sıfırla", "Spalten zurück", "Сбросить столбцы", "أعد الأعمدة"] as Row,
  viewName: ["View name", "Görünüm adı", "Ansichtsname", "Имя вида", "اسم العرض"] as Row,
  saveView: ["Save view", "Görünümü kaydet", "Ansicht speichern", "Сохранить вид", "احفظ العرض"] as Row,
  applyView: ["Apply", "Uygula", "Anwenden", "Применить", "طبّق"] as Row,
  deleteView: ["Delete", "Sil", "Löschen", "Удалить", "احذف"] as Row,
  localKeys: ["Browser data", "Tarayıcı verisi", "Browserdaten", "Данные браузера", "بيانات المتصفح"] as Row,
  localStay: ["The file stays on this computer. Nothing is uploaded.", "Dosya bu bilgisayarda kalır. Hiçbir şey yüklenmez.", "Die Datei bleibt auf diesem Computer. Nichts wird hochgeladen.", "Файл остаётся на этом компьютере. Ничего не загружается.", "الملف يبقى على هذا الحاسوب. لا يُرفع شيء."] as Row,
  localShare: ["Pins are shared on purpose. Other lists keep their own keys.", "Sabitlemeler bilerek ortaktır. Diğer listelerin kendi anahtarı vardır.", "Pins werden absichtlich geteilt. Andere Listen behalten eigene Schlüssel.", "Закрепления общие специально. У остальных списков свои ключи.", "التثبيت مشترك عمدًا. القوائم الأخرى تحتفظ بمفاتيحها."] as Row,
  localCount: ["Saved keys", "Kayıtlı anahtar", "Gespeicherte Schlüssel", "Сохранённые ключи", "المفاتيح المحفوظة"] as Row,
  localExport: ["Export", "Dışa aktar", "Exportieren", "Экспорт", "تصدير"] as Row,
  localImport: ["Import", "İçe aktar", "Importieren", "Импорт", "استيراد"] as Row,
  localBad: ["That file is not a browser pack.", "Bu dosya bir tarayıcı paketi değil.", "Diese Datei ist kein Browserpaket.", "Этот файл не пакет браузера.", "هذا الملف ليس حزمة متصفح."] as Row,
  localConfirm: ["Remove every CRM v3 key in this browser?", "Bu tarayıcıdaki her CRM v3 anahtarı silinsin mi?", "Jeden CRM-v3-Schlüssel in diesem Browser entfernen?", "Удалить все ключи CRM v3 в этом браузере?", "حذف كل مفاتيح CRM v3 في هذا المتصفح؟"] as Row,
  localReset: ["Reset", "Sıfırla", "Zurücksetzen", "Сбросить", "إعادة ضبط"] as Row,
  footSection: ["Section", "Bölüm", "Bereich", "Раздел", "القسم"] as Row,
  footTime: ["Local time", "Yerel saat", "Ortszeit", "Местное время", "الوقت المحلي"] as Row,
  footShortcuts: ["Shortcuts", "Kısayollar", "Kürzel", "Сочетания", "اختصارات"] as Row,
  keySearch: ["Open search", "Aramayı aç", "Suche öffnen", "Открыть поиск", "افتح البحث"] as Row,
  keyHelp: ["Open this list", "Bu listeyi aç", "Diese Liste öffnen", "Открыть этот список", "افتح هذه القائمة"] as Row,
  keyGo: ["Then a letter opens a section", "Sonra bir harf bölüm açar", "Danach öffnet ein Buchstabe einen Bereich", "Затем буква открывает раздел", "ثم حرف يفتح قسمًا"] as Row,
  moreWork: ["Work", "İş", "Arbeit", "Работа", "العمل"] as Row,
  moreRecords: ["Records", "Kayıtlar", "Unterlagen", "Записи", "السجلات"] as Row,
  moreDesk: ["Desk", "Masa", "Pult", "Стол", "المكتب"] as Row,
  moreSession: ["This session", "Bu oturum", "Diese Sitzung", "Эта сессия", "هذه الجلسة"] as Row,
  rowsShowing: ["Showing", "Gösterilen", "Sichtbar", "Показано", "المعروض"] as Row,
  stateEmpty: ["Nothing to show", "Gösterilecek yok", "Nichts zu zeigen", "Нечего показать", "لا شيء للعرض"] as Row,
} as const;

type Key = keyof typeof ROWS;
function column(index: 0 | 1 | 2 | 3 | 4): { [K in Key]: string } {
  const out = {} as { [K in Key]: string };
  (Object.keys(ROWS) as Key[]).forEach((key) => { out[key] = ROWS[key][index]; });
  return out;
}

export const LATER_EN = column(0);
export const LATER_TR = column(1);
export const LATER_DE = column(2);
export const LATER_RU = column(3);
export const LATER_AR = column(4);
