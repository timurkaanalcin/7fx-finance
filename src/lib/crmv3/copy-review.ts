/** CRM v3 copy for document review and reports. */
type Row = readonly [string, string, string, string, string];
const ROWS = {
  kycDesk: ["Document review", "Belge inceleme", "Dokumentenprüfung", "Проверка документов", "مراجعة المستندات"] as Row,
  kycHint: ["The queue is the loaded pending documents. The checklist stays in this browser and does not approve anything. Approve and reject use the existing review call. The reason is optional.", "Kuyruk, yüklenen bekleyen belgelerdir. Liste bu tarayıcıda durur ve bir şeyi onaylamaz. Onay ve ret mevcut inceleme çağrısını kullanır. Gerekçe isteğe bağlıdır.", "Die Warteschlange sind die geladenen offenen Dokumente. Die Liste bleibt in diesem Browser und genehmigt nichts. Freigabe und Ablehnung nutzen den vorhandenen Prüfruf. Der Grund ist optional.", "Очередь — это загруженные ожидающие документы. Список остаётся в этом браузере и ничего не одобряет. Одобрение и отказ используют существующий вызов проверки. Причина необязательна.", "الطابور هو المستندات المعلّقة المحمّلة. القائمة تبقى في هذا المتصفح ولا توافق على شيء. الموافقة والرفض يستخدمان نداء المراجعة القائم. السبب اختياري."] as Row,
  kycQueue: ["Pending customers", "Bekleyen müşteriler", "Offene Kunden", "Ожидающие клиенты", "عملاء معلّقون"] as Row,
  kycEmpty: ["No pending document in the loaded rows.", "Yüklenen satırlarda bekleyen belge yok.", "Kein offenes Dokument in den geladenen Zeilen.", "В загруженных строках нет ожидающего документа.", "لا مستند معلّق في الصفوف المحمّلة."] as Row,
  kycNoFile: ["No file on the loaded row.", "Yüklenen satırda dosya yok.", "Keine Datei in der geladenen Zeile.", "В загруженной строке нет файла.", "لا ملف في الصف المحمّل."] as Row,
  kycPreview: ["Document preview", "Belge önizleme", "Dokumentvorschau", "Просмотр документа", "معاينة المستند"] as Row,
  kycCheckName: ["Name matches", "Ad uyuyor", "Name stimmt", "Имя совпадает", "الاسم يطابق"] as Row,
  kycCheckPhoto: ["Photo is clear", "Fotoğraf net", "Foto ist klar", "Фото чёткое", "الصورة واضحة"] as Row,
  kycCheckExpiry: ["Not expired", "Süresi dolmamış", "Nicht abgelaufen", "Срок не истёк", "لم تنتهِ"] as Row,
  kycCheckReadable: ["Text is readable", "Yazı okunuyor", "Text ist lesbar", "Текст читается", "النص مقروء"] as Row,
  kycCheckHint: ["Saved in this browser only.", "Yalnızca bu tarayıcıda durur.", "Nur in diesem Browser gespeichert.", "Только в этом браузере.", "يُحفظ في هذا المتصفح فقط."] as Row,
  kycReason: ["Reason", "Gerekçe", "Grund", "Причина", "السبب"] as Row,
  kycReasonHint: ["Optional. Left blank, nothing extra is sent.", "İsteğe bağlı. Boş bırakılırsa fazladan bir şey gönderilmez.", "Optional. Bleibt es leer, wird nichts Zusätzliches gesendet.", "Необязательно. Если пусто, лишнего не отправляется.", "اختياري. إذا تُرك فارغًا لا يُرسل شيء إضافي."] as Row,
  kycApprove: ["Approve", "Onayla", "Freigeben", "Одобрить", "موافقة"] as Row,
  kycReject: ["Reject", "Reddet", "Ablehnen", "Отклонить", "رفض"] as Row,
  kycSearch: ["Search the loaded queue", "Yüklenen kuyrukta ara", "Geladene Warteschlange durchsuchen", "Искать в загруженной очереди", "ابحث في الطابور المحمّل"] as Row,
  kycDocs: ["Documents", "Belgeler", "Dokumente", "Документы", "المستندات"] as Row,
  reportsTitle: ["Reports", "Raporlar", "Berichte", "Отчёты", "التقارير"] as Row,
  reportsHint: ["Each file is the loaded rows. Currencies stay apart. A CSV also writes the existing export note. Print uses the browser dialog and uploads nothing.", "Her dosya yüklenen satırlardır. Para birimleri ayrı kalır. CSV ayrıca mevcut dışa aktarma notunu yazar. Yazdırma tarayıcı penceresini kullanır ve bir şey yüklemez.", "Jede Datei sind die geladenen Zeilen. Währungen bleiben getrennt. Eine CSV schreibt auch die vorhandene Exportnotiz. Drucken nutzt den Browserdialog und lädt nichts hoch.", "Каждый файл — это загруженные строки. Валюты остаются отдельно. CSV также пишет существующую заметку экспорта. Печать использует диалог браузера и ничего не загружает.", "كل ملف هو الصفوف المحمّلة. العملات تبقى منفصلة. ملف CSV يكتب أيضًا ملاحظة التصدير القائمة. الطباعة تستخدم حوار المتصفح ولا ترفع شيئًا."] as Row,
  reportsCustomers: ["Customers", "Müşteriler", "Kunden", "Клиенты", "العملاء"] as Row,
  reportsDeposits: ["Deposits", "Yatırımlar", "Einzahlungen", "Депозиты", "الإيداعات"] as Row,
  reportsWithdrawals: ["Withdrawals", "Çekimler", "Auszahlungen", "Выводы", "السحوبات"] as Row,
  reportsTickets: ["Tickets", "Biletler", "Tickets", "Тикеты", "التذاكر"] as Row,
  reportsCsv: ["Save CSV", "CSV kaydet", "CSV sichern", "Сохранить CSV", "حفظ CSV"] as Row,
  reportsPrint: ["Print this list", "Bu listeyi yazdır", "Diese Liste drucken", "Печатать этот список", "طباعة هذه القائمة"] as Row,
  reportsEmpty: ["No loaded rows.", "Yüklenen satır yok.", "Keine geladenen Zeilen.", "Нет загруженных строк.", "لا صفوف محمّلة."] as Row,
  reportsAll: ["All currencies", "Tüm para birimleri", "Alle Währungen", "Все валюты", "كل العملات"] as Row,
  reportsRows: ["Rows", "Satır", "Zeilen", "Строки", "صفوف"] as Row,
} as const;

type Key = keyof typeof ROWS;
function column(index: 0 | 1 | 2 | 3 | 4): { [K in Key]: string } {
  const out = {} as { [K in Key]: string };
  (Object.keys(ROWS) as Key[]).forEach((key) => { out[key] = ROWS[key][index]; });
  return out;
}

export const REVIEW_EN = column(0);
export const REVIEW_TR = column(1);
export const REVIEW_DE = column(2);
export const REVIEW_RU = column(3);
export const REVIEW_AR = column(4);
