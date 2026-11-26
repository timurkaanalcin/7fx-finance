/** Burin cuts, colophon keepers, the ivory margin mensa, and the graphite month quaternion. Every locale carries the English keys. */

const ROWS = [
  [
    "mgMensaKicker",
    "Ivory margin mensa",
    "Fildişi marj mensası",
    "Elfenbein-Margenmensa",
    "Слоновая менса маржи",
    "مائدة الهامش العاجية"
  ],
  [
    "mgMensaLead",
    "The margin level sits on an ivory mensa. Champagne fills the track. Graphite ticks mark the quarters. The level itself is unchanged.",
    "Marj düzeyi fildişi bir mensada durur. Şampanya izi doldurur. Grafit çentikler çeyrekleri işaretler. Düzeyin kendisi değişmez.",
    "Die Margenhöhe sitzt auf einer Elfenbeinmensa. Champagner füllt die Bahn. Graphitkerben markieren die Viertel. Die Höhe selbst bleibt unverändert.",
    "Уровень маржи сидит на слоновой менсе. Шампань заполняет дорожку. Графитовые насечки отмечают четверти. Сам уровень не меняется.",
    "مستوى الهامش يجلس على مائدة عاجية. الشامبانيا تملأ المسار. علامات الغرافيت تعلّم الأرباع. المستوى نفسه لا يتغيّر."
  ],
  [
    "mgMensaLogo",
    "7FX",
    "7FX",
    "7FX",
    "7FX",
    "7FX"
  ],
  [
    "msQuaternionKicker",
    "Graphite month quaternion",
    "Grafit ay kuaterniyonu",
    "Graphit-Monatsquaternion",
    "Графитовый кватернион месяца",
    "رباعية الشهر الغرافيت"
  ],
  [
    "msQuaternionLead",
    "The month opens as a graphite quaternion. Ivory holds the leaf. Champagne lines the hinge. The rows themselves are unchanged.",
    "Ay grafit bir kuaterniyon olarak açılır. Fildişi yaprağı tutar. Şampanya menteşeyi çizer. Satırların kendisi değişmez.",
    "Der Monat öffnet sich als Graphitquaternion. Elfenbein hält das Blatt. Champagner säumt das Scharnier. Die Zeilen selbst bleiben unverändert.",
    "Месяц открывается графитовым кватернионом. Слоновая кость держит лист. Шампань обводит шарнир. Сами строки не меняются.",
    "الشهر يُفتح كرباعية غرافيت. العاج يمسك الورقة. الشامبانيا تخطّ المفصل. الصفوف نفسها لا تتغيّر."
  ],
  [
    "msQuaternionLogo",
    "7FX",
    "7FX",
    "7FX",
    "7FX",
    "7FX"
  ],
  [
    "burAdd",
    "Add burin",
    "Burin ekle",
    "Burin hinzufügen",
    "Добавить бурен",
    "أضف بورينًا"
  ],
  [
    "burAll",
    "All",
    "Tümü",
    "Alle",
    "Все",
    "الكل"
  ],
  [
    "burApply",
    "Apply",
    "Uygula",
    "Anwenden",
    "Применить",
    "طبّق"
  ],
  [
    "burGilt",
    "Gilt",
    "Yaldız",
    "Gold",
    "Позолота",
    "تذهيب"
  ],
  [
    "burAuditRib",
    "Rib stepped",
    "Kaburga adımlandı",
    "Rippe gestuft",
    "Ребро сдвинуто",
    "تقدّم الضلع"
  ],
  [
    "burAuditEdit",
    "Title edited",
    "Başlık düzenlendi",
    "Titel geändert",
    "Название изменено",
    "عُدّل العنوان"
  ],
  [
    "burAuditGlaze",
    "Glaze set",
    "Sır ayarlandı",
    "Glasur gesetzt",
    "Глазурь задана",
    "ضُبط الطلاء"
  ],
  [
    "burAuditFree",
    "Lowered",
    "İndirildi",
    "Gesenkt",
    "Опущено",
    "أُخفض"
  ],
  [
    "burAuditLower",
    "Minutes lowered",
    "Dakika indirildi",
    "Minuten gesenkt",
    "Минуты снижены",
    "انخفضت الدقائق"
  ],
  [
    "burAuditNote",
    "Note edited",
    "Not düzenlendi",
    "Notiz geändert",
    "Заметка изменена",
    "عُدّلت الملاحظة"
  ],
  [
    "burAuditOpen",
    "Opened",
    "Açıldı",
    "Geöffnet",
    "Открыто",
    "فُتح"
  ],
  [
    "burAuditVise",
    "Clamped",
    "Mengenede",
    "Eingespannt",
    "В тисках",
    "ثُبّت بالملزمة"
  ],
  [
    "burAuditRaise",
    "Raised",
    "Yükseltildi",
    "Angehoben",
    "Поднято",
    "رُفع"
  ],
  [
    "burAuditReturn",
    "Returned",
    "Geri alındı",
    "Zurückgenommen",
    "Возвращено",
    "أُعيد"
  ],
  [
    "burAuditSave",
    "Saved",
    "Kaydedildi",
    "Gespeichert",
    "Сохранено",
    "حُفظ"
  ],
  [
    "burAuditSpan",
    "Minutes stepped",
    "Dakika adımlandı",
    "Minuten gestuft",
    "Минуты сдвинуты",
    "تقدّمت الدقائق"
  ],
  [
    "burAuditStar",
    "Starred",
    "Yıldızlandı",
    "Mit Stern",
    "Отмечено звездой",
    "وُضع نجماً"
  ],
  [
    "burAuditTag",
    "Tag changed",
    "Etiket değişti",
    "Marke geändert",
    "Метка изменена",
    "تغيّرت العلامة"
  ],
  [
    "burAuditFolio",
    "Filed in the folio",
    "Folyoya kondu",
    "Ins Folio gelegt",
    "В фолио",
    "وُضع في الكراسة"
  ],
  [
    "burRib",
    "Rib",
    "Kaburga",
    "Rippe",
    "Ребро",
    "ضلع"
  ],
  [
    "burStone",
    "Stone",
    "Taş",
    "Stein",
    "Камень",
    "حجر"
  ],
  [
    "burBlankGraver",
    "No cut",
    "Kesik yok",
    "Kein Schnitt",
    "Без реза",
    "بلا قطع"
  ],
  [
    "burBrisk",
    "Brisk gilt",
    "Canlı yaldız",
    "Lebhaftes Gold",
    "Живая позолота",
    "تذهيب نشيط"
  ],
  [
    "burBulkPearl",
    "Pearl selected",
    "Seçilene inci",
    "Auswahl perlen",
    "Жемчуг выбранному",
    "لؤلؤ للمحدد"
  ],
  [
    "burBulkRaise",
    "Raise selected",
    "Seçileni yükselt",
    "Auswahl heben",
    "Поднять выбранное",
    "ارفع المحدد"
  ],
  [
    "burBulkTag",
    "Tag selected",
    "Seçilene etiket",
    "Auswahl markieren",
    "Пометить выбранное",
    "علّم المحدد"
  ],
  [
    "burBulkFolio",
    "Folio selected",
    "Seçileni folyoya koy",
    "Auswahl ins Folio",
    "Убрать выбранное в фолио",
    "ضع المحدد في الكراسة"
  ],
  [
    "burBusy",
    "Busiest hand",
    "En yoğun el",
    "Beschäftigste Hand",
    "Самая занятая рука",
    "أكثر الأيدي انشغالًا"
  ],
  [
    "burChart",
    "Cut chart",
    "Kesik çizelgesi",
    "Schnitttafel",
    "Схема резов",
    "مخطط القطع"
  ],
  [
    "burVise",
    "Vise",
    "Mengene",
    "Schraubstock",
    "Тиски",
    "ملزمة"
  ],
  [
    "burViseIt",
    "Clamp this burin",
    "Bu burini mengenele",
    "Diesen Burin einspannen",
    "Зажать этот бурен",
    "ثبّت هذا البورين"
  ],
  [
    "burCool",
    "Cool",
    "Serin",
    "Kühl",
    "Прохлада",
    "بارد"
  ],
  [
    "burCopy",
    "Copy",
    "Kopyala",
    "Kopieren",
    "Копировать",
    "انسخ"
  ],
  [
    "burCsv",
    "Export burins",
    "Burinleri aktar",
    "Burins exportieren",
    "Экспорт буренов",
    "صدّر البورين"
  ],
  [
    "burCustomers",
    "Open accounts",
    "Hesapları aç",
    "Konten öffnen",
    "Открыть счета",
    "افتح الحسابات"
  ],
  [
    "burGraver",
    "Graver",
    "Graver",
    "Graver",
    "Гравер",
    "غرافر"
  ],
  [
    "burDesk",
    "Station",
    "İstasyon",
    "Station",
    "Станция",
    "محطة"
  ],
  [
    "burFolio",
    "Folio",
    "Folyo",
    "Folio",
    "Фолио",
    "كراسة"
  ],
  [
    "burFolioIt",
    "File this burin",
    "Bu burini folyoya koy",
    "Diesen Burin ins Folio",
    "Убрать этот бурен в фолио",
    "ضع هذا البورين في الكراسة"
  ],
  [
    "burDropView",
    "Drop view",
    "Görünümü bırak",
    "Ansicht lösen",
    "Снять вид",
    "أزل المشهد"
  ],
  [
    "burBurr",
    "Burr",
    "Burr",
    "Burr",
    "Бурр",
    "بر"
  ],
  [
    "burEdit",
    "Title",
    "Başlık",
    "Titel",
    "Название",
    "عنوان"
  ],
  [
    "burEmpty",
    "No burins on this stone",
    "Bu taşta burin yok",
    "Keine Burins auf diesem Stein",
    "На этом камне нет буренов",
    "لا بورين على هذا الحجر"
  ],
  [
    "burFair",
    "Least-open hand",
    "En az açık el",
    "Am wenigsten offene Hand",
    "Наименее открытая рука",
    "اليد الأقل انشغالًا"
  ],
  [
    "burGlaze",
    "Glaze",
    "Sır",
    "Glasur",
    "Глазурь",
    "طلاء"
  ],
  [
    "burHand",
    "Hand",
    "El",
    "Hand",
    "Рука",
    "يد"
  ],
  [
    "burFree",
    "Lower",
    "İndir",
    "Senken",
    "Опустить",
    "أخفض"
  ],
  [
    "burPearl",
    "Pearl",
    "İnci",
    "Perle",
    "Жемчуг",
    "لؤلؤ"
  ],
  [
    "burHint",
    "Burin cuts stay in this browser. Graver and hatch are warm. Burr and dry are cool. Spans are 12, 24, 48, or 96 minutes. Ribs are 3, 5, or 7. Pearl, ink, and gilt are the glazes. Pearl is quiet. Tags are g and h. A viewer can look and cannot change a cut. Money stays off this stone.",
    "Burin kesikleri bu tarayıcıda kalır. Graver ve hatch ılıktır. Burr ve dry serindir. Aralıklar 12, 24, 48 veya 96 dakikadır. Kaburgalar 3, 5 veya 7'dir. İnci, mürekkep ve yaldız sırlardır. İnci sakindir. Etiketler g ve h'dir. İzleyici bakabilir, bir kesiği değiştiremez. Para bu taşta yoktur.",
    "Burinschnitte bleiben in diesem Browser. Graver und Hatch sind warm. Burr und Dry sind kühl. Spannen sind 12, 24, 48 oder 96 Minuten. Rippen sind 3, 5 oder 7. Perle, Tinte und Gold sind die Glasuren. Perle ist ruhig. Marken sind g und h. Ein Betrachter sieht zu und ändert keinen Schnitt. Geld bleibt von diesem Stein.",
    "Резы бурена остаются в этом браузере. Гравер и хэтч тёплые. Бурр и драй прохладные. Промежутки: 12, 24, 48 или 96 минут. Рёбра: 3, 5 или 7. Жемчуг, чернила и позолота — глазури. Жемчуг тих. Метки — g и h. Наблюдатель смотрит и не меняет рез. Деньги остаются вне камня.",
    "قطع البورين تبقى في هذا المتصفح. غرافر وهاتش دافئان. بر ودراي باردان. المدد 12 أو 24 أو 48 أو 96 دقيقة. الأضلاع 3 أو 5 أو 7. اللؤلؤ والحبر والتذهيب هي الطلاءات. اللؤلؤ هادئ. العلامتان g وh. المشاهد ينظر ولا يغيّر قطعًا. المال يبقى خارج الحجر."
  ],
  [
    "burIdle",
    "Idle burin",
    "Boş burin",
    "Untätiger Burin",
    "Праздный бурен",
    "بورين خامل"
  ],
  [
    "burWarm",
    "Warm",
    "Ilık",
    "Warm",
    "Тепло",
    "دافئ"
  ],
  [
    "burKeys",
    "Keys",
    "Tuşlar",
    "Tasten",
    "Клавиши",
    "مفاتيح"
  ],
  [
    "burLogo",
    "7FX",
    "7FX",
    "7FX",
    "7FX",
    "7FX"
  ],
  [
    "burLower",
    "Lower minutes",
    "Dakikayı indir",
    "Minuten senken",
    "Снизить минуты",
    "أخفض الدقائق"
  ],
  [
    "burInk",
    "Ink",
    "Mürekkep",
    "Tinte",
    "Чернила",
    "حبر"
  ],
  [
    "burDry",
    "Dry",
    "Dry",
    "Dry",
    "Драй",
    "دراي"
  ],
  [
    "burHatch",
    "Hatch",
    "Hatch",
    "Hatch",
    "Хэтч",
    "هاتش"
  ],
  [
    "burNote",
    "Note",
    "Not",
    "Notiz",
    "Заметка",
    "ملاحظة"
  ],
  [
    "burOpen",
    "Open burins",
    "Açık burinler",
    "Offene Burins",
    "Открытые бурены",
    "بورين مفتوح"
  ],
  [
    "burOverdue",
    "Overdue drypoint",
    "Gecikmiş kuru uç",
    "Überfällige Kaltnadel",
    "Просроченная сухая игла",
    "إبرة جافة متأخرة"
  ],
  [
    "burQuiet",
    "Quiet pearl",
    "Sakin inci",
    "Ruhige Perle",
    "Тихий жемчуг",
    "لؤلؤ هادئ"
  ],
  [
    "burRaise",
    "Raise",
    "Yükselt",
    "Heben",
    "Поднять",
    "ارفع"
  ],
  [
    "burRaiseSpan",
    "Raise minutes",
    "Dakikayı yükselt",
    "Minuten heben",
    "Поднять минуты",
    "ارفع الدقائق"
  ],
  [
    "burRemind",
    "Burin reminders",
    "Burin anımsatıcıları",
    "Burin-Erinnerungen",
    "Напоминания бурена",
    "تذكيرات البورين"
  ],
  [
    "burResting",
    "Resting drypoint",
    "Dinlenen kuru uç",
    "Ruhende Kaltnadel",
    "Отдыхающая сухая игла",
    "إبرة جافة مستريحة"
  ],
  [
    "burSaveView",
    "Save view",
    "Görünümü kaydet",
    "Ansicht speichern",
    "Сохранить вид",
    "احفظ المشهد"
  ],
  [
    "burSearch",
    "Search burins",
    "Burin ara",
    "Burins suchen",
    "Искать бурены",
    "ابحث في البورين"
  ],
  [
    "burCut",
    "Cut",
    "Kesik",
    "Schnitt",
    "Рез",
    "قطع"
  ],
  [
    "burSortHand",
    "Sort by hand",
    "Ele göre sırala",
    "Nach Hand sortieren",
    "Сортировать по руке",
    "رتّب حسب اليد"
  ],
  [
    "burSortCut",
    "Sort by cut",
    "Kesiğe göre sırala",
    "Nach Schnitt sortieren",
    "Сортировать по резу",
    "رتّب حسب القطع"
  ],
  [
    "burSpan",
    "Span",
    "Aralık",
    "Spanne",
    "Промежуток",
    "مدى"
  ],
  [
    "burStar",
    "Star",
    "Yıldız",
    "Stern",
    "Звезда",
    "نجم"
  ],
  [
    "burSub",
    "Cut under the plate",
    "Levha altındaki kesik",
    "Schnitt unter der Platte",
    "Рез под пластиной",
    "قطع تحت اللوحة"
  ],
  [
    "burSuggest",
    "Suggest",
    "Öner",
    "Vorschlagen",
    "Предложить",
    "اقترح"
  ],
  [
    "burTag",
    "Tag",
    "Etiket",
    "Marke",
    "Метка",
    "علامة"
  ],
  [
    "burTight",
    "Tight burins",
    "Sıkı burinler",
    "Enge Burins",
    "Плотные бурены",
    "بورين ضيق"
  ],
  [
    "burTimeline",
    "Span timeline",
    "Aralık zaman çizelgesi",
    "Spannezeitstrahl",
    "Шкала промежутков",
    "خط المدد"
  ],
  [
    "burTitle",
    "Burin rules",
    "Burin kuralları",
    "Burinregeln",
    "Правила бурена",
    "قواعد البورين"
  ],
  [
    "burUnstar",
    "Unstar",
    "Yıldızı kaldır",
    "Stern lösen",
    "Снять звезду",
    "أزل النجم"
  ],
  [
    "burUnvise",
    "Unclamp",
    "Mengeneyi kaldır",
    "Spannung lösen",
    "Снять тиски",
    "أزل الملزمة"
  ],
  [
    "burUnfolio",
    "Open the folio",
    "Folyoyu aç",
    "Folio öffnen",
    "Открыть фолио",
    "افتح الكراسة"
  ],
  [
    "burViewName",
    "View name",
    "Görünüm adı",
    "Ansichtsname",
    "Имя вида",
    "اسم المشهد"
  ],
  [
    "burViewer",
    "A viewer can look and cannot change a burin.",
    "İzleyici bakabilir, bir burini değiştiremez.",
    "Ein Betrachter sieht zu und ändert keinen Burin.",
    "Наблюдатель смотрит и не меняет бурен.",
    "المشاهد ينظر ولا يغيّر بورينًا."
  ],
  [
    "colAll",
    "All",
    "Tümü",
    "Alle",
    "Все",
    "الكل"
  ],
  [
    "colBlank",
    "Blank",
    "İşaretsiz",
    "Unmarkiert",
    "Без отметки",
    "بلا علامة"
  ],
  [
    "colBrief",
    "Brief keeper",
    "Kısa bekçi",
    "Kurzer Hüter",
    "Короткий хранитель",
    "حافظ قصير"
  ],
  [
    "colBulkClear",
    "Clear review",
    "İncelemeyi kaldır",
    "Prüfung lösen",
    "Снять проверку",
    "أزل المراجعة"
  ],
  [
    "colBulkReview",
    "Review selected",
    "Seçileni incele",
    "Auswahl prüfen",
    "Проверить выбранное",
    "راجع المحدد"
  ],
  [
    "colGilt",
    "Gilt",
    "Yaldız",
    "Gold",
    "Позолота",
    "تذهيب"
  ],
  [
    "colChart",
    "Chart",
    "Çizelge",
    "Tafel",
    "Схема",
    "مخطط"
  ],
  [
    "colCopied",
    "Copied",
    "Kopyalandı",
    "Kopiert",
    "Скопировано",
    "نُسخ"
  ],
  [
    "colCopy",
    "Copy",
    "Kopyala",
    "Kopieren",
    "Копировать",
    "انسخ"
  ],
  [
    "colCsv",
    "Export keeper lanes",
    "Bekçi şeritlerini aktar",
    "Hüterbahnen exportieren",
    "Экспорт полос хранителя",
    "صدّر ممرات الحافظ"
  ],
  [
    "colCustomer",
    "Open account",
    "Hesabı aç",
    "Konto öffnen",
    "Открыть счёт",
    "افتح الحساب"
  ],
  [
    "colEmpty",
    "No keepers in this lane",
    "Bu şeritte bekçi yok",
    "Keine Hüter in dieser Bahn",
    "В этой полосе нет хранителей",
    "لا حافظ في هذا الممر"
  ],
  [
    "colFailed",
    "Keepers could not load",
    "Bekçiler yüklenemedi",
    "Hüter konnten nicht laden",
    "Хранители не загрузились",
    "تعذّر تحميل الحفظة"
  ],
  [
    "colFresh",
    "Fresh",
    "Taze",
    "Frisch",
    "Свежее",
    "جديد"
  ],
  [
    "colInk",
    "Ink",
    "Mürekkep",
    "Tinte",
    "Чернила",
    "حبر"
  ],
  [
    "colHide",
    "Hide",
    "Gizle",
    "Verbergen",
    "Скрыть",
    "أخفِ"
  ],
  [
    "colHint",
    "Colophon plates read the keeper name already stored on the account. Lead, mine, own, keep, firm, and set are the mark. Queue, pool, open, and free sit the desk. Soon, defer, and month wait. Left names return. A plus of three to ten digits is the mark. Four to nine digits sit the desk. A date today is the mark. Within two days is the desk. Within six days waits. Older is returned. A brief keeper is four characters. Money fields are not read. The plate does not change the saved keeper.",
    "Kolofon levhalar hesapta kayıtlı bekçi adını okur. Önder, benim, sahip, tut, sağlam ve ayarla işarettir. Kuyruk, havuz, açık ve serbest masa başındadır. Yakında, ertele ve ay bekler. Ayrılan adlar geri döner. Üç ile on rakamlı artı işarettir. Dört ile dokuz rakam masa başındadır. Bugünkü bir tarih işarettir. İki gün içinde masa başındadır. Altı gün içinde bekler. Daha eskisi geri döner. Kısa bekçi dört karakterdir. Para alanları okunmaz. Levha kayıtlı bekçiyi değiştirmez.",
    "Kolophonplatten lesen den schon gespeicherten Hüternamen des Kontos. Führung, mein, eigen, halten, fest und gesetzt sind die Marke. Schlange, Becken, offen und frei sitzen am Pult. Bald, aufschieben und Monat warten. Verlassene Namen kommen zurück. Ein Plus aus drei bis zehn Ziffern ist die Marke. Vier bis neun Ziffern sitzen am Pult. Ein Datum heute ist die Marke. Binnen zwei Tagen ist das Pult. Binnen sechs Tagen wartet es. Älteres kommt zurück. Ein kurzer Hüter hat vier Zeichen. Geldfelder werden nicht gelesen. Die Platte ändert den gespeicherten Hüter nicht.",
    "Плато колофона читает уже сохранённое имя хранителя счёта. Ведущий, мой, свой, держать, твёрдо и задано — это метка. Очередь, пул, открыто и свободно сидят за столом. Скоро, отложить и месяц ждут. Ушедшие имена возвращаются. Плюс из трёх–десяти цифр — метка. От четырёх до девяти цифр сидят за столом. Дата сегодня — метка. В пределах двух дней — стол. В пределах шести дней ждёт. Старше возвращается. Короткий хранитель — четыре знака. Денежные поля не читаются. Плато не меняет сохранённого хранителя.",
    "ألواح الكولوفون تقرأ اسم الحافظ المحفوظ على الحساب. قائد وملكي وخاص وأمسك وراسخ ومضبوط هي العلامة. طابور وحوض ومفتوح وحرّ تجلس على المكتب. قريبًا وأجّل وشهر تنتظر. الأسماء المغادرة تُعاد. زائد من ثلاثة إلى عشرة أرقام هو العلامة. من أربعة إلى تسعة أرقام تجلس على المكتب. تاريخ اليوم هو العلامة. خلال يومين هو المكتب. خلال ستة أيام ينتظر. الأقدم يُعاد. الحافظ القصير أربعة أحرف. حقول المال لا تُقرأ. اللوح لا يغيّر الحافظ المحفوظ."
  ],
  [
    "colPearl",
    "Pearl",
    "İnci",
    "Perle",
    "Жемчуг",
    "لؤلؤ"
  ],
  [
    "colPair",
    "Paired",
    "Eşli",
    "Gepaart",
    "Парный",
    "مزدوج"
  ],
  [
    "colLaneDesk",
    "Desk",
    "Masa",
    "Pult",
    "Стол",
    "مكتب"
  ],
  [
    "colLaneReturn",
    "Returned",
    "Geri",
    "Zurück",
    "Возврат",
    "مُعاد"
  ],
  [
    "colLaneMark",
    "Mark",
    "İşaret",
    "Marke",
    "Метка",
    "علامة"
  ],
  [
    "colLaneLater",
    "Later",
    "Sonra",
    "Später",
    "Позже",
    "لاحقًا"
  ],
  [
    "colLaneShut",
    "Shut",
    "Kapalı",
    "Zu",
    "Закрыто",
    "مغلق"
  ],
  [
    "colLead",
    "Leading keeper",
    "Önde gelen bekçi",
    "Führender Hüter",
    "Ведущий хранитель",
    "الحافظ المتقدّم"
  ],
  [
    "colLoading",
    "Loading keepers",
    "Bekçiler yükleniyor",
    "Hüter werden geladen",
    "Хранители загружаются",
    "يُحمَّل الحفظة"
  ],
  [
    "colLogo",
    "7FX",
    "7FX",
    "7FX",
    "7FX",
    "7FX"
  ],
  [
    "colSpan",
    "Extended",
    "Uzatılmış",
    "Verlängert",
    "Расширенное",
    "ممتد"
  ],
  [
    "colOpen",
    "Clear keeper",
    "Açık bekçi",
    "Offener Hüter",
    "Чистый хранитель",
    "حافظ واضح"
  ],
  [
    "colBare",
    "Open mark",
    "Açık iz",
    "Offene Marke",
    "Открытая метка",
    "علامة مفتوحة"
  ],
  [
    "colReview",
    "Review",
    "İncele",
    "Prüfen",
    "Проверить",
    "راجع"
  ],
  [
    "colReviewed",
    "Reviewed",
    "İncelendi",
    "Geprüft",
    "Проверено",
    "مُراجَع"
  ],
  [
    "colScope",
    "Scope",
    "Kapsam",
    "Umfang",
    "Объём",
    "نطاق"
  ],
  [
    "colRowCsv",
    "Export colophon keepers",
    "Kolofon bekçilerini aktar",
    "Kolophonhüter exportieren",
    "Экспорт хранителей колофона",
    "صدّر حفظة الكولوفون"
  ],
  [
    "colSearch",
    "Search keepers",
    "Bekçi ara",
    "Hüter suchen",
    "Искать хранителей",
    "ابحث في الحفظة"
  ],
  [
    "colShapeAll",
    "Any shape",
    "Her biçim",
    "Jede Form",
    "Любая форма",
    "أي شكل"
  ],
  [
    "colShapeBrief",
    "Brief keepers",
    "Kısa bekçiler",
    "Kurze Hüter",
    "Краткие хранители",
    "حفظة قصيرة"
  ],
  [
    "colShapeEven",
    "Even lengths",
    "Çift uzunluklar",
    "Gerade Längen",
    "Чётные длины",
    "أطوال زوجية"
  ],
  [
    "colShapeReturn",
    "Returned keepers",
    "Geri dönen bekçiler",
    "Zurückgekehrte Hüter",
    "Возвращённые хранители",
    "حفظة مرتجعة"
  ],
  [
    "colShapeMark",
    "Leading keepers",
    "Önde gelen bekçiler",
    "Führende Hüter",
    "Ведущие хранители",
    "حفظة متقدّمة"
  ],
  [
    "colShapeLater",
    "Waiting keepers",
    "Bekleyen bekçiler",
    "Wartende Hüter",
    "Хранители ожидания",
    "حفظة الانتظار"
  ],
  [
    "colShapePair",
    "Joined keepers",
    "Birleşik bekçiler",
    "Verbundene Hüter",
    "Соединённые хранители",
    "حفظة منضمّة"
  ],
  [
    "colShapeSpan",
    "Extended keepers",
    "Uzatılmış bekçiler",
    "Lange Hüter",
    "Длинные хранители",
    "حفظة ممتدة"
  ],
  [
    "colShapeOpen",
    "Clear keepers",
    "Açık bekçiler",
    "Offene Hüter",
    "Открытые хранители",
    "حفظة مفتوحة"
  ],
  [
    "colShapeBare",
    "Open marks",
    "Açık izler",
    "Offene Marken",
    "Открытые метки",
    "علامات مفتوحة"
  ],
  [
    "colShapeScope",
    "Scoped keepers",
    "Kapsamlı bekçiler",
    "Begrenzte Hüter",
    "Ограниченные хранители",
    "حفظة محدودة"
  ],
  [
    "colShapeSpace",
    "Spaced keepers",
    "Boşluklu bekçiler",
    "Hüter mit Leerraum",
    "Хранители с пробелом",
    "حفظة بمسافة"
  ],
  [
    "colShapeDigit",
    "Digit keepers",
    "Rakam bekçileri",
    "Ziffernhüter",
    "Цифровые хранители",
    "حفظة رقم"
  ],
  [
    "colShapeUpper",
    "Capital keepers",
    "Büyük bekçiler",
    "Hüter in Großbuchstaben",
    "Хранители заглавными",
    "حفظة كبيرة"
  ],
  [
    "colShapeShut",
    "Closed keepers",
    "Kapalı bekçiler",
    "Geschlossene Hüter",
    "Закрытые хранители",
    "حفظة مغلقة"
  ],
  [
    "colShapeVowel",
    "Vowel keepers",
    "Ünlü bekçiler",
    "Vokalhüter",
    "Хранители на гласную",
    "حفظة بحرف علة"
  ],
  [
    "colShare",
    "Lead share",
    "Lider payı",
    "Führungsanteil",
    "Доля ведущих",
    "حصة القادة"
  ],
  [
    "colShow",
    "Show hidden",
    "Gizlileri göster",
    "Verborgene zeigen",
    "Показать скрытые",
    "أظهر المخفي"
  ],
  [
    "colStampLane",
    "Digit stamp",
    "Rakam damgası",
    "Ziffernstempel",
    "Цифровой штамп",
    "ختم رقم"
  ],
  [
    "colSub",
    "Saved keeper",
    "Kayıtlı bekçi",
    "Gespeicherter Hüter",
    "Сохранённый хранитель",
    "الحافظ المحفوظ"
  ],
  [
    "colTitle",
    "Colophon keepers",
    "Kolofon bekçileri",
    "Kolophonhüter",
    "Хранители колофона",
    "حفظة الكولوفون"
  ],
  [
    "colToneLead",
    "Leading hue",
    "Önde gelen ton",
    "Führender Ton",
    "Ведущий тон",
    "اللون المتقدّم"
  ],
  [
    "colViewer",
    "A viewer can look, not mark a review.",
    "İzleyici bakabilir, inceleme işaretleyemez.",
    "Ein Betrachter sieht zu und setzt keine Prüfung.",
    "Наблюдатель смотрит и не ставит проверку.",
    "المشاهد ينظر ولا يضع مراجعة."
  ]
] as const;

type CopyRow = { [K in (typeof ROWS)[number][0]]: string };

function pack(index: 1 | 2 | 3 | 4 | 5): CopyRow {
  return Object.fromEntries(ROWS.map((row) => [row[0], row[index]])) as CopyRow;
}

export const ROUND380_COPY = {
  en: pack(1),
  tr: pack(2),
  de: pack(3),
  ru: pack(4),
  ar: pack(5),
};
