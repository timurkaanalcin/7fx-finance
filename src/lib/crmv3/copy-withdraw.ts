/** CRM v3 copy for withdrawal review and grouped search. */
type Row = readonly [string, string, string, string, string];
const ROWS = {
  wdDesk: ["Withdrawal review", "Çekim inceleme", "Auszahlungsprüfung", "Проверка вывода", "مراجعة السحب"] as Row,
  wdHint: ["The queue is the loaded pending withdrawals. Balance is the account currency. Deposits stay in their own currency and are not added to the balance. The checklist stays in this browser and does not approve anything. Approve and reject use the existing withdrawal call. The reason is optional.", "Kuyruk, yüklenen bekleyen çekimlerdir. Bakiye hesap para birimidir. Yatırımlar kendi para biriminde kalır ve bakiyeye eklenmez. Liste bu tarayıcıda durur ve bir şeyi onaylamaz. Onay ve ret mevcut çekim çağrısını kullanır. Gerekçe isteğe bağlıdır.", "Die Warteschlange sind die geladenen offenen Auszahlungen. Der Saldo ist die Kontowährung. Einzahlungen bleiben in ihrer Währung und werden nicht zum Saldo addiert. Die Liste bleibt in diesem Browser und genehmigt nichts. Freigabe und Ablehnung nutzen den vorhandenen Auszahlungsaufruf. Der Grund ist optional.", "Очередь — это загруженные ожидающие выводы. Баланс в валюте счёта. Депозиты остаются в своей валюте и не прибавляются к балансу. Список остаётся в этом браузере и ничего не одобряет. Одобрение и отказ используют существующий вызов вывода. Причина необязательна.", "الطابور هو السحوبات المعلّقة المحمّلة. الرصيد بعملة الحساب. الإيداعات تبقى بعملتها ولا تُضاف إلى الرصيد. القائمة تبقى في هذا المتصفح ولا توافق على شيء. الموافقة والرفض يستخدمان نداء السحب القائم. السبب اختياري."] as Row,
  wdQueue: ["Pending withdrawals", "Bekleyen çekimler", "Offene Auszahlungen", "Ожидающие выводы", "سحوبات معلّقة"] as Row,
  wdEmpty: ["No pending withdrawal in the loaded rows.", "Yüklenen satırlarda bekleyen çekim yok.", "Keine offene Auszahlung in den geladenen Zeilen.", "В загруженных строках нет ожидающего вывода.", "لا سحب معلّق في الصفوف المحمّلة."] as Row,
  wdBalance: ["Account balance", "Hesap bakiyesi", "Kontostand", "Баланс счёта", "رصيد الحساب"] as Row,
  wdDeposits: ["Recent deposits", "Son yatırımlar", "Letzte Einzahlungen", "Недавние депозиты", "إيداعات أخيرة"] as Row,
  wdPositions: ["Loaded positions", "Yüklenen pozisyonlar", "Geladene Positionen", "Загруженные позиции", "مراكز محمّلة"] as Row,
  wdKyc: ["KYC", "KYC", "KYC", "KYC", "التحقق"] as Row,
  wdNoDeposit: ["No loaded deposit for this customer.", "Bu müşteri için yüklenen yatırım yok.", "Keine geladene Einzahlung für diesen Kunden.", "Нет загруженного депозита для этого клиента.", "لا إيداع محمّل لهذا العميل."] as Row,
  wdNoPosition: ["No loaded position for this customer.", "Bu müşteri için yüklenen pozisyon yok.", "Keine geladene Position für diesen Kunden.", "Нет загруженной позиции для этого клиента.", "لا مركز محمّل لهذا العميل."] as Row,
  wdSplit: ["These figures are not added together.", "Bu rakamlar birbirine eklenmez.", "Diese Zahlen werden nicht addiert.", "Эти числа не складываются.", "هذه الأرقام لا تُجمع."] as Row,
  wdCheckKyc: ["KYC status read", "KYC durumu okundu", "KYC-Status gelesen", "Статус KYC прочитан", "قُرئ وضع التحقق"] as Row,
  wdCheckBalance: ["Balance read", "Bakiye okundu", "Saldo gelesen", "Баланс прочитан", "قُرئ الرصيد"] as Row,
  wdCheckDeposits: ["Deposits read", "Yatırımlar okundu", "Einzahlungen gelesen", "Депозиты прочитаны", "قُرئت الإيداعات"] as Row,
  wdCheckPositions: ["Positions read", "Pozisyonlar okundu", "Positionen gelesen", "Позиции прочитаны", "قُرئت المراكز"] as Row,
  wdCheckHint: ["Saved in this browser only.", "Yalnızca bu tarayıcıda durur.", "Nur in diesem Browser gespeichert.", "Только в этом браузере.", "يُحفظ في هذا المتصفح فقط."] as Row,
  wdReason: ["Reason", "Gerekçe", "Grund", "Причина", "السبب"] as Row,
  wdReasonHint: ["Optional. Left blank, no reason is sent.", "İsteğe bağlı. Boş bırakılırsa gerekçe gönderilmez.", "Optional. Bleibt es leer, wird kein Grund gesendet.", "Необязательно. Если пусто, причина не отправляется.", "اختياري. إذا تُرك فارغًا لا يُرسل سبب."] as Row,
  wdApprove: ["Approve", "Onayla", "Freigeben", "Одобрить", "موافقة"] as Row,
  wdReject: ["Reject", "Reddet", "Ablehnen", "Отклонить", "رفض"] as Row,
  wdSearch: ["Search the loaded queue", "Yüklenen kuyrukta ara", "Geladene Warteschlange durchsuchen", "Искать в загруженной очереди", "ابحث في الطابور المحمّل"] as Row,
  findTitle: ["Search", "Arama", "Suche", "Поиск", "بحث"] as Row,
  findHint: ["Customers, tickets, finance rows, and pages from the loaded results.", "Müşteriler, biletler, finans satırları ve sayfalar yüklenen sonuçlardandır.", "Kunden, Tickets, Finanzzeilen und Seiten aus den geladenen Ergebnissen.", "Клиенты, тикеты, финансовые строки и страницы из загруженных результатов.", "العملاء والتذاكر وصفوف المالية والصفحات من النتائج المحمّلة."] as Row,
  findCustomers: ["Customers", "Müşteriler", "Kunden", "Клиенты", "العملاء"] as Row,
  findTickets: ["Tickets", "Biletler", "Tickets", "Тикеты", "التذاكر"] as Row,
  findFinance: ["Finance", "Finans", "Finanzen", "Финансы", "المالية"] as Row,
  findPages: ["Pages", "Sayfalar", "Seiten", "Страницы", "الصفحات"] as Row,
  findRecent: ["Recent searches", "Son aramalar", "Letzte Suchen", "Недавние поиски", "عمليات بحث أخيرة"] as Row,
  findClear: ["Clear recent searches", "Son aramaları temizle", "Letzte Suchen leeren", "Очистить недавние поиски", "مسح عمليات البحث الأخيرة"] as Row,
  findEmpty: ["Nothing in the loaded results.", "Yüklenen sonuçlarda bir şey yok.", "Nichts in den geladenen Ergebnissen.", "В загруженных результатах ничего нет.", "لا شيء في النتائج المحمّلة."] as Row,
  findRecentEmpty: ["No recent search in this browser.", "Bu tarayıcıda son arama yok.", "Keine letzte Suche in diesem Browser.", "В этом браузере нет недавнего поиска.", "لا بحث أخير في هذا المتصفح."] as Row,
} as const;

type Key = keyof typeof ROWS;
function column(index: 0 | 1 | 2 | 3 | 4): { [K in Key]: string } {
  const out = {} as { [K in Key]: string };
  (Object.keys(ROWS) as Key[]).forEach((key) => { out[key] = ROWS[key][index]; });
  return out;
}

export const WD_EN = column(0);
export const WD_TR = column(1);
export const WD_DE = column(2);
export const WD_RU = column(3);
export const WD_AR = column(4);
