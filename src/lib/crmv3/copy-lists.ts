/** CRM v3 copy for the customer record header and named lists. */
type Row = readonly [string, string, string, string, string];
const ROWS = {
  recHead: ["Customer record", "Müşteri kaydı", "Kundenakte", "Карточка клиента", "سجل العميل"] as Row,
  recHint: ["Identity, status, and figures are from the loaded row. Each money line is one currency. They are not added together. The actions open existing pages. They do not send a review.", "Kimlik, durum ve rakamlar yüklenen satırdandır. Her para satırı tek para birimidir. Birbirine eklenmez. Eylemler mevcut sayfaları açar. Bir inceleme göndermez.", "Identität, Status und Zahlen kommen aus der geladenen Zeile. Jede Geldzeile ist eine Währung. Sie werden nicht addiert. Die Aktionen öffnen vorhandene Seiten. Sie senden keine Prüfung.", "Личность, статус и цифры взяты из загруженной строки. Каждая денежная строка — одна валюта. Они не складываются. Действия открывают существующие страницы. Они не отправляют проверку.", "الهوية والوضع والأرقام من الصف المحمّل. كل سطر مال بعملة واحدة. لا تُجمع. الإجراءات تفتح صفحات قائمة. لا ترسل مراجعة."] as Row,
  recKyc: ["KYC", "KYC", "KYC", "KYC", "التحقق"] as Row,
  recNoKyc: ["No KYC status on the row", "Satırda KYC durumu yok", "Kein KYC-Status in der Zeile", "В строке нет статуса KYC", "لا وضع تحقق في الصف"] as Row,
  recStage: ["Stage", "Aşama", "Stufe", "Этап", "المرحلة"] as Row,
  recNoStage: ["No stage on the row", "Satırda aşama yok", "Keine Stufe in der Zeile", "В строке нет этапа", "لا مرحلة في الصف"] as Row,
  recRetention: ["Retention", "Tutundurma", "Bindung", "Удержание", "الإبقاء"] as Row,
  recNoRetention: ["No retention status on the row", "Satırda tutundurma durumu yok", "Kein Bindungsstatus in der Zeile", "В строке нет статуса удержания", "لا وضع إبقاء في الصف"] as Row,
  recReading: ["Desk reading", "Masa okuması", "Tischlesung", "Чтение стола", "قراءة المكتب"] as Row,
  recReadingHint: ["A reading of the loaded fields. Not a stored risk grade.", "Yüklenen alanların okuması. Kayıtlı bir risk notu değil.", "Eine Lesung der geladenen Felder. Keine gespeicherte Risikostufe.", "Чтение загруженных полей. Это не сохранённая оценка риска.", "قراءة للحقول المحمّلة. ليست درجة خطر محفوظة."] as Row,
  recBalance: ["Balance", "Bakiye", "Saldo", "Баланс", "الرصيد"] as Row,
  recEquity: ["Equity", "Özkaynak", "Eigenkapital", "Средства", "حقوق الملكية"] as Row,
  recDeposits: ["Loaded deposits", "Yüklenen yatırımlar", "Geladene Einzahlungen", "Загруженные депозиты", "إيداعات محمّلة"] as Row,
  recWithdrawals: ["Loaded withdrawals", "Yüklenen çekimler", "Geladene Auszahlungen", "Загруженные выводы", "سحوبات محمّلة"] as Row,
  recNone: ["None in the loaded rows.", "Yüklenen satırlarda yok.", "Keine in den geladenen Zeilen.", "Нет в загруженных строках.", "لا شيء في الصفوف المحمّلة."] as Row,
  recSplit: ["These figures are not added together.", "Bu rakamlar birbirine eklenmez.", "Diese Zahlen werden nicht addiert.", "Эти числа не складываются.", "هذه الأرقام لا تُجمع."] as Row,
  recNotes: ["Notes", "Notlar", "Notizen", "Заметки", "ملاحظات"] as Row,
  recMoney: ["Money", "Para", "Geld", "Деньги", "المال"] as Row,
  recFiles: ["Files", "Dosyalar", "Dateien", "Файлы", "ملفات"] as Row,
  recOpen: ["Open", "Aç", "Öffnen", "Открыть", "فتح"] as Row,
  recId: ["Customer id", "Müşteri kimliği", "Kunden-ID", "Идентификатор клиента", "معرّف العميل"] as Row,
  recCopied: ["Id copied.", "Kimlik kopyalandı.", "ID kopiert.", "Идентификатор скопирован.", "نُسخ المعرف."] as Row,
  listTitle: ["Named lists", "Adlı listeler", "Benannte Listen", "Именованные списки", "قوائم مسماة"] as Row,
  listHint: ["Stored in this browser. A count is among the loaded rows, not the whole book. Opening a list filters the loaded customer table. It does not call a new endpoint.", "Bu tarayıcıda durur. Sayı yüklenen satırlar içindir, tüm defter değil. Listeyi açmak yüklenen müşteri tablosunu süzer. Yeni bir uç çağırmaz.", "Bleibt in diesem Browser. Eine Zahl gilt für die geladenen Zeilen, nicht für das ganze Buch. Eine Liste öffnen filtert die geladene Kundentabelle. Sie ruft keinen neuen Endpunkt.", "Хранится в этом браузере. Счёт — среди загруженных строк, не по всей книге. Открытие списка фильтрует загруженную таблицу клиентов. Новый адрес не вызывается.", "تبقى في هذا المتصفح. العدد بين الصفوف المحمّلة، لا الدفتر كله. فتح قائمة يصفّي جدول العملاء المحمّل. لا ينادي طرفًا جديدًا."] as Row,
  listName: ["List name", "Liste adı", "Listenname", "Имя списка", "اسم القائمة"] as Row,
  listKyc: ["KYC on the row", "Satırdaki KYC", "KYC in der Zeile", "KYC в строке", "التحقق في الصف"] as Row,
  listStage: ["Stage on the row", "Satırdaki aşama", "Stufe in der Zeile", "Этап в строке", "المرحلة في الصف"] as Row,
  listCountry: ["Country on the row", "Satırdaki ülke", "Land in der Zeile", "Страна в строке", "البلد في الصف"] as Row,
  listFtd: ["First deposit", "İlk yatırım", "Erste Einzahlung", "Первый депозит", "أول إيداع"] as Row,
  listAny: ["Any", "Hepsi", "Alle", "Любой", "الكل"] as Row,
  listYes: ["Yes", "Evet", "Ja", "Да", "نعم"] as Row,
  listNo: ["No", "Hayır", "Nein", "Нет", "لا"] as Row,
  listSave: ["Save list", "Listeyi kaydet", "Liste sichern", "Сохранить список", "حفظ القائمة"] as Row,
  listRename: ["Rename", "Yeniden adlandır", "Umbenennen", "Переименовать", "إعادة تسمية"] as Row,
  listUp: ["Move up", "Yukarı", "Nach oben", "Выше", "أعلى"] as Row,
  listDown: ["Move down", "Aşağı", "Nach unten", "Ниже", "أسفل"] as Row,
  listDelete: ["Delete", "Sil", "Löschen", "Удалить", "حذف"] as Row,
  listEmpty: ["No named list in this browser.", "Bu tarayıcıda adlı liste yok.", "Keine benannte Liste in diesem Browser.", "В этом браузере нет именованного списка.", "لا قائمة مسماة في هذا المتصفح."] as Row,
  listOpen: ["No rule on this list. The count is every loaded row.", "Bu listede kural yok. Sayı yüklenen her satırdır.", "Keine Regel in dieser Liste. Die Zahl ist jede geladene Zeile.", "В этом списке нет правила. Счёт — каждая загруженная строка.", "لا قاعدة في هذه القائمة. العدد هو كل صف محمّل."] as Row,
  listCount: ["Loaded", "Yüklenen", "Geladen", "Загружено", "محمّل"] as Row,
  listMissing: ["That list is not in this browser.", "Bu liste bu tarayıcıda yok.", "Diese Liste ist nicht in diesem Browser.", "Этого списка нет в этом браузере.", "هذه القائمة ليست في هذا المتصفح."] as Row,
  listShowing: ["Showing the loaded rows that match this list.", "Bu listeye uyan yüklenen satırlar gösteriliyor.", "Die geladenen Zeilen, die zu dieser Liste passen.", "Показаны загруженные строки, которые подходят этому списку.", "تُعرض الصفوف المحمّلة التي تطابق هذه القائمة."] as Row,
} as const;

type Key = keyof typeof ROWS;
function column(index: 0 | 1 | 2 | 3 | 4): { [K in Key]: string } {
  const out = {} as { [K in Key]: string };
  (Object.keys(ROWS) as Key[]).forEach((key) => { out[key] = ROWS[key][index]; });
  return out;
}

export const LISTS_EN = column(0);
export const LISTS_TR = column(1);
export const LISTS_DE = column(2);
export const LISTS_RU = column(3);
export const LISTS_AR = column(4);
