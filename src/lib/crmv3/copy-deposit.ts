/** CRM v3 copy for deposit review and the support inbox. */
type Row = readonly [string, string, string, string, string];
const ROWS = {
  depDesk: ["Deposit review", "Yatırım inceleme", "Einzahlungsprüfung", "Проверка депозита", "مراجعة الإيداع"] as Row,
  depHint: ["The queue is the loaded pending deposits. Balance is the account currency. Other cash stays in its own currency and is not added to this deposit. The checklist stays in this browser and does not approve anything. Approve and reject use the existing deposit call. The reason and the source account are optional.", "Kuyruk, yüklenen bekleyen yatırımlardır. Bakiye hesap para birimidir. Diğer nakit kendi para biriminde kalır ve bu yatırıma eklenmez. Liste bu tarayıcıda durur ve bir şeyi onaylamaz. Onay ve ret mevcut yatırım çağrısını kullanır. Gerekçe ve kaynak hesap isteğe bağlıdır.", "Die Warteschlange sind die geladenen offenen Einzahlungen. Der Saldo ist die Kontowährung. Anderes Geld bleibt in seiner Währung und wird nicht zu dieser Einzahlung addiert. Die Liste bleibt in diesem Browser und genehmigt nichts. Freigabe und Ablehnung nutzen den vorhandenen Einzahlungsaufruf. Grund und Quellkonto sind optional.", "Очередь — это загруженные ожидающие депозиты. Баланс в валюте счёта. Другие суммы остаются в своей валюте и не прибавляются к этому депозиту. Список остаётся в этом браузере и ничего не одобряет. Одобрение и отказ используют существующий вызов депозита. Причина и счёт-источник необязательны.", "الطابور هو الإيداعات المعلّقة المحمّلة. الرصيد بعملة الحساب. النقد الآخر يبقى بعملته ولا يُضاف إلى هذا الإيداع. القائمة تبقى في هذا المتصفح ولا توافق على شيء. الموافقة والرفض يستخدمان نداء الإيداع القائم. السبب والحساب المصدر اختياريان."] as Row,
  depQueue: ["Pending deposits", "Bekleyen yatırımlar", "Offene Einzahlungen", "Ожидающие депозиты", "إيداعات معلّقة"] as Row,
  depEmpty: ["No pending deposit in the loaded rows.", "Yüklenen satırlarda bekleyen yatırım yok.", "Keine offene Einzahlung in den geladenen Zeilen.", "В загруженных строках нет ожидающего депозита.", "لا إيداع معلّق في الصفوف المحمّلة."] as Row,
  depBalance: ["Account balance", "Hesap bakiyesi", "Kontostand", "Баланс счёта", "رصيد الحساب"] as Row,
  depCash: ["Other loaded cash", "Diğer yüklenen nakit", "Anderes geladenes Geld", "Другие загруженные суммы", "نقد محمّل آخر"] as Row,
  depPositions: ["Loaded positions", "Yüklenen pozisyonlar", "Geladene Positionen", "Загруженные позиции", "مراكز محمّلة"] as Row,
  depKyc: ["KYC", "KYC", "KYC", "KYC", "التحقق"] as Row,
  depNote: ["Note on the row", "Satırdaki not", "Notiz in der Zeile", "Заметка в строке", "ملاحظة الصف"] as Row,
  depNoNote: ["No note on the loaded row.", "Yüklenen satırda not yok.", "Keine Notiz in der geladenen Zeile.", "В загруженной строке нет заметки.", "لا ملاحظة في الصف المحمّل."] as Row,
  depReceipt: ["Receipt", "Dekont", "Beleg", "Квитанция", "إيصال"] as Row,
  depNoReceipt: ["No receipt on the loaded row.", "Yüklenen satırda dekont yok.", "Kein Beleg in der geladenen Zeile.", "В загруженной строке нет квитанции.", "لا إيصال في الصف المحمّل."] as Row,
  depSplit: ["These figures are not added together.", "Bu rakamlar birbirine eklenmez.", "Diese Zahlen werden nicht addiert.", "Эти числа не складываются.", "هذه الأرقام لا تُجمع."] as Row,
  depCheckAmount: ["Amount read", "Tutar okundu", "Betrag gelesen", "Сумма прочитана", "قُرئ المبلغ"] as Row,
  depCheckMethod: ["Method read", "Yöntem okundu", "Weg gelesen", "Способ прочитан", "قُرئت الطريقة"] as Row,
  depCheckKyc: ["KYC status read", "KYC durumu okundu", "KYC-Status gelesen", "Статус KYC прочитан", "قُرئ وضع التحقق"] as Row,
  depCheckReceipt: ["Receipt looked for", "Dekont arandı", "Beleg gesucht", "Квитанция проверена", "بُحث عن الإيصال"] as Row,
  depCheckHint: ["Saved in this browser only.", "Yalnızca bu tarayıcıda durur.", "Nur in diesem Browser gespeichert.", "Только в этом браузере.", "يُحفظ في هذا المتصفح فقط."] as Row,
  depReason: ["Reason", "Gerekçe", "Grund", "Причина", "السبب"] as Row,
  depReasonHint: ["Optional. Left blank, no reason is sent.", "İsteğe bağlı. Boş bırakılırsa gerekçe gönderilmez.", "Optional. Bleibt es leer, wird kein Grund gesendet.", "Необязательно. Если пусто, причина не отправляется.", "اختياري. إذا تُرك فارغًا لا يُرسل سبب."] as Row,
  depSource: ["Source account", "Kaynak hesap", "Quellkonto", "Счёт-источник", "الحساب المصدر"] as Row,
  depSourceHint: ["Optional. Left blank, it is not sent. This call credits the customer's account.", "İsteğe bağlı. Boş bırakılırsa gönderilmez. Bu çağrı müşterinin hesabını yatırır.", "Optional. Bleibt es leer, wird es nicht gesendet. Dieser Aufruf schreibt dem Kundenkonto gut.", "Необязательно. Если пусто, он не отправляется. Этот вызов зачисляет счёт клиента.", "اختياري. إذا تُرك فارغًا لا يُرسل. هذا النداء يودِع حساب العميل."] as Row,
  depApprove: ["Approve", "Onayla", "Freigeben", "Одобрить", "موافقة"] as Row,
  depReject: ["Reject", "Reddet", "Ablehnen", "Отклонить", "رفض"] as Row,
  depSearch: ["Search the loaded queue", "Yüklenen kuyrukta ara", "Geladene Warteschlange durchsuchen", "Искать в загруженной очереди", "ابحث في الطابور المحمّل"] as Row,
  inboxTitle: ["Support inbox", "Destek kutusu", "Support-Posteingang", "Входящие поддержки", "صندوق الدعم"] as Row,
  inboxHint: ["Threads are the loaded chat. A reply is sent only when you press send, through the existing chat call. Canned replies stay in this browser until you insert one. Nothing else is sent from this page.", "Yazışmalar yüklenen sohbettir. Yanıt yalnızca gönder'e basınca, mevcut sohbet çağrısıyla gider. Hazır yanıtlar bu tarayıcıda durur, ta ki siz ekleyene kadar. Bu sayfa başka bir şey göndermez.", "Die Fäden sind der geladene Chat. Eine Antwort geht erst, wenn Sie senden, über den vorhandenen Chat-Aufruf. Textbausteine bleiben in diesem Browser, bis Sie einen einsetzen. Diese Seite sendet sonst nichts.", "Темы — это загруженный чат. Ответ уходит только когда вы нажимаете отправить, через существующий вызов чата. Заготовки остаются в этом браузере, пока вы их не вставите. Эта страница больше ничего не отправляет.", "المحادثات هي الدردشة المحمّلة. الرد يُرسل فقط عند الضغط على إرسال، عبر نداء الدردشة القائم. الردود الجاهزة تبقى في هذا المتصفح حتى تُدرجها. هذه الصفحة لا ترسل غير ذلك."] as Row,
  inboxWaiting: ["Waiting", "Bekliyor", "Wartet", "Ждёт", "بانتظار"] as Row,
  inboxUnread: ["Unread", "Okunmamış", "Ungelesen", "Не прочитано", "غير مقروء"] as Row,
  inboxAnswered: ["Answered", "Yanıtlandı", "Beantwortet", "Отвечено", "أُجيب"] as Row,
  inboxEmpty: ["No loaded thread.", "Yüklenen yazışma yok.", "Kein geladener Faden.", "Нет загруженной темы.", "لا محادثة محمّلة."] as Row,
  inboxNoThread: ["Choose a thread.", "Bir yazışma seçin.", "Einen Faden wählen.", "Выберите тему.", "اختر محادثة."] as Row,
  inboxAutomatic: ["Automatic", "Otomatik", "Automatisch", "Автоматически", "تلقائي"] as Row,
  inboxStaff: ["Staff", "Personel", "Personal", "Сотрудник", "الموظف"] as Row,
  inboxCustomer: ["Customer", "Müşteri", "Kunde", "Клиент", "العميل"] as Row,
  inboxCanned: ["Canned replies", "Hazır yanıtlar", "Textbausteine", "Заготовки", "ردود جاهزة"] as Row,
  inboxCannedHint: ["Stored in this browser. Inserting one only fills the draft.", "Bu tarayıcıda durur. Eklemek yalnızca taslağı doldurur.", "Bleibt in diesem Browser. Einsetzen füllt nur den Entwurf.", "Хранится в этом браузере. Вставка только заполняет черновик.", "تُحفظ في هذا المتصفح. الإدراج يملأ المسودة فقط."] as Row,
  inboxSaveCanned: ["Save this reply", "Bu yanıtı kaydet", "Diesen Text sichern", "Сохранить этот ответ", "حفظ هذا الرد"] as Row,
  inboxSend: ["Send", "Gönder", "Senden", "Отправить", "إرسال"] as Row,
  inboxDraft: ["Reply", "Yanıt", "Antwort", "Ответ", "الرد"] as Row,
  inboxSearch: ["Search loaded threads", "Yüklenen yazışmalarda ara", "Geladene Fäden durchsuchen", "Искать в загруженных темах", "ابحث في المحادثات المحمّلة"] as Row,
} as const;

type Key = keyof typeof ROWS;
function column(index: 0 | 1 | 2 | 3 | 4): { [K in Key]: string } {
  const out = {} as { [K in Key]: string };
  (Object.keys(ROWS) as Key[]).forEach((key) => { out[key] = ROWS[key][index]; });
  return out;
}

export const DEP_EN = column(0);
export const DEP_TR = column(1);
export const DEP_DE = column(2);
export const DEP_RU = column(3);
export const DEP_AR = column(4);
