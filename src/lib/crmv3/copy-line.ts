/** CRM v3 copy for the customer timeline and desk arrangement. */
type Row = readonly [string, string, string, string, string];
const ROWS = {
  lineTitle: ["Timeline", "Zaman çizelgesi", "Zeitlinie", "Лента", "الخط الزمني"] as Row,
  lineHint: ["Loaded rows only, newest first. Amounts stay in the currency on the row. Calls stay in this browser and nothing is sent.", "Yalnızca yüklenen satırlar, en yeni üstte. Tutarlar satırdaki para biriminde kalır. Aramalar bu tarayıcıda durur ve bir şey gönderilmez.", "Nur geladene Zeilen, neueste zuerst. Beträge bleiben in der Währung der Zeile. Anrufe bleiben in diesem Browser und es wird nichts gesendet.", "Только загруженные строки, новые сверху. Суммы остаются в валюте строки. Звонки остаются в этом браузере, ничего не отправляется.", "الصفوف المحمّلة فقط، الأحدث أولًا. المبالغ تبقى بعملة الصف. المكالمات تبقى في هذا المتصفح ولا يُرسل شيء."] as Row,
  lineDeposit: ["Deposit", "Yatırım", "Einzahlung", "Депозит", "إيداع"] as Row,
  lineWithdrawal: ["Withdrawal", "Çekim", "Auszahlung", "Вывод", "سحب"] as Row,
  linePosition: ["Position", "Pozisyon", "Position", "Позиция", "مركز"] as Row,
  lineTicket: ["Ticket", "Bilet", "Ticket", "Тикет", "تذكرة"] as Row,
  lineNote: ["Note", "Not", "Notiz", "Заметка", "ملاحظة"] as Row,
  lineCall: ["Call", "Arama", "Anruf", "Звонок", "مكالمة"] as Row,
  lineAll: ["All", "Tümü", "Alle", "Все", "الكل"] as Row,
  lineSearch: ["Search the loaded rows", "Yüklenen satırlarda ara", "Geladene Zeilen durchsuchen", "Искать в загруженных строках", "ابحث في الصفوف المحمّلة"] as Row,
  lineEmpty: ["Nothing in the loaded rows matches.", "Yüklenen satırlarda eşleşme yok.", "Nichts in den geladenen Zeilen passt.", "В загруженных строках нет совпадений.", "لا شيء في الصفوف المحمّلة يطابق."] as Row,
  lineNoDate: ["No date on the loaded row", "Yüklenen satırda tarih yok", "Kein Datum in der geladenen Zeile", "В загруженной строке нет даты", "لا تاريخ في الصف المحمّل"] as Row,
  lineLoaded: ["Loaded", "Yüklendi", "Geladen", "Загружено", "محمّل"] as Row,
  arrangeTitle: ["Arrange this desk", "Bu masayı düzenle", "Diesen Tisch ordnen", "Собрать этот стол", "رتّب هذا المكتب"] as Row,
  arrangeHint: ["Show, hide, and reorder the cards below. Stored in this browser. The header stays put.", "Aşağıdaki kartları göster, gizle ve sırala. Bu tarayıcıda durur. Üst kısım yerinde kalır.", "Die Karten unten einblenden, ausblenden und ordnen. Bleibt in diesem Browser. Der Kopf bleibt stehen.", "Показать, скрыть и упорядочить карточки ниже. Хранится в этом браузере. Шапка остаётся на месте.", "أظهر البطاقات أدناه أو أخفها أو أعد ترتيبها. يُحفظ في هذا المتصفح. الرأس يبقى مكانه."] as Row,
  arrangeShow: ["Show", "Göster", "Zeigen", "Показать", "إظهار"] as Row,
  arrangeUp: ["Move up", "Yukarı al", "Nach oben", "Выше", "إلى الأعلى"] as Row,
  arrangeDown: ["Move down", "Aşağı al", "Nach unten", "Ниже", "إلى الأسفل"] as Row,
  arrangeReset: ["Reset this arrangement", "Bu düzeni sıfırla", "Diese Ordnung zurücksetzen", "Сбросить этот порядок", "إعادة هذا الترتيب"] as Row,
  arrangeEmpty: ["Every card is hidden. Show one to bring the desk back.", "Tüm kartlar gizli. Masayı geri getirmek için birini göster.", "Jede Karte ist ausgeblendet. Eine einblenden, dann kehrt der Tisch zurück.", "Все карточки скрыты. Покажите одну, чтобы стол вернулся.", "كل البطاقات مخفية. أظهر واحدة ليعود المكتب."] as Row,
} as const;

type Key = keyof typeof ROWS;
function column(index: 0 | 1 | 2 | 3 | 4): { [K in Key]: string } {
  const out = {} as { [K in Key]: string };
  (Object.keys(ROWS) as Key[]).forEach((key) => { out[key] = ROWS[key][index]; });
  return out;
}

export const LINE_EN = column(0);
export const LINE_TR = column(1);
export const LINE_DE = column(2);
export const LINE_RU = column(3);
export const LINE_AR = column(4);
