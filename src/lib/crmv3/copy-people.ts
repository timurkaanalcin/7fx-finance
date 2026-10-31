/** CRM v3 copy for alert rules, compare, onboarding, and the staff page. */
type Row = readonly [string, string, string, string, string];
const ROWS = {
  alertCenter: ["Alert rules", "Uyarı kuralları", "Alarmregeln", "Правила оповещений", "قواعد التنبيه"] as Row,
  alertHint: ["Checked on the rows loaded here. Shown in this desk only. No push, mail, or SMS is sent.", "Burada yüklenen satırlarda bakılır. Yalnızca bu masada gösterilir. Anlık bildirim, e-posta veya SMS gönderilmez.", "Geprüft an den hier geladenen Zeilen. Nur in diesem Pult sichtbar. Kein Push, keine Mail, keine SMS.", "Проверка по строкам на этой странице. Только на этом столе. Без push, почты и SMS.", "تُفحص على الصفوف المحملة هنا. تظهر في هذا المكتب فقط. بلا إشعار فوري أو بريد أو رسالة."] as Row,
  alertLarge: ["Large deposit", "Büyük yatırım", "Große Einzahlung", "Крупный депозит", "إيداع كبير"] as Row,
  alertSla: ["Ticket over SLA", "SLA aşımı", "Ticket über SLA", "Заявка дольше SLA", "تذكرة تجاوزت المهلة"] as Row,
  alertFollow: ["Follow-up overdue", "Takip gecikti", "Nachfassen überfällig", "Просрочен дозвон", "متابعة متأخرة"] as Row,
  alertWatch: ["Risk watch", "Risk izleme", "Risiko-Wache", "Риск-лист", "مراقبة المخاطر"] as Row,
  alertQuiet: ["Quiet, then active", "Sessizken hareket", "Ruhig, dann aktiv", "Тихий, затем активный", "هادئ ثم نشط"] as Row,
  alertLargeAt: ["Large from", "Büyük eşiği", "Groß ab", "Крупный от", "كبير من"] as Row,
  alertSlaHours: ["SLA hours", "SLA saati", "SLA-Stunden", "Часы SLA", "ساعات المهلة"] as Row,
  alertMute: ["Hide this alert", "Bu uyarıyı gizle", "Diesen Alarm ausblenden", "Скрыть это оповещение", "إخفاء هذا التنبيه"] as Row,
  alertEmpty: ["No alerts on this page", "Bu sayfada uyarı yok", "Keine Alarme auf dieser Seite", "На этой странице нет оповещений", "لا تنبيهات في هذه الصفحة"] as Row,
  alertOn: ["On", "Açık", "An", "Вкл", "تشغيل"] as Row,
  compareDesk: ["Compare", "Karşılaştır", "Vergleich", "Сравнение", "مقارنة"] as Row,
  compareHint: ["Up to three customers from this page. Cash and positions are the loaded rows. Stage and heat stay in this browser.", "Bu sayfadan en fazla üç müşteri. Nakit ve pozisyonlar yüklenen satırlardır. Aşama ve ısı bu tarayıcıda kalır.", "Bis zu drei Kunden von dieser Seite. Zahlungen und Positionen sind die geladenen Zeilen. Stufe und Wärme bleiben im Browser.", "До трёх клиентов с этой страницы. Деньги и позиции — загруженные строки. Этап и тепло остаются в браузере.", "حتى ثلاثة عملاء من هذه الصفحة. النقد والمراكز صفوف محمّلة. المرحلة والحرارة تبقيان في هذا المتصفح."] as Row,
  compareBalance: ["Balance", "Bakiye", "Saldo", "Баланс", "الرصيد"] as Row,
  compareCash: ["Cash", "Nakit", "Zahlungen", "Деньги", "النقد"] as Row,
  comparePositions: ["Positions", "Pozisyonlar", "Positionen", "Позиции", "المراكز"] as Row,
  compareStage: ["Stage", "Aşama", "Stufe", "Этап", "المرحلة"] as Row,
  compareHeat: ["Heat", "Isı", "Wärme", "Тепло", "الحرارة"] as Row,
  compareLast: ["Last contact", "Son temas", "Letzter Kontakt", "Последний контакт", "آخر تواصل"] as Row,
  compareHigher: ["Higher balance", "Daha yüksek bakiye", "Höherer Saldo", "Баланс выше", "رصيد أعلى"] as Row,
  compareNeed: ["Select two or three customers", "İki veya üç müşteri seçin", "Zwei oder drei Kunden wählen", "Выберите двух или трёх клиентов", "اختر عميلين أو ثلاثة"] as Row,
  compareSwipe: ["Swipe the cards", "Kartları kaydırın", "Karten wischen", "Листайте карточки", "اسحب البطاقات"] as Row,
  onboardCard: ["Onboarding", "Başlangıç", "Start", "Старт", "البدء"] as Row,
  onboardHint: ["Steps come from the loaded rows. KYC has no date on the customer, so the gap around it stays blank. Nothing is sent.", "Adımlar yüklenen satırlardan gelir. KYC tarihinin müşteride kaydı yok, bu yüzden o aralık boş kalır. Bir şey gönderilmez.", "Die Schritte kommen aus den geladenen Zeilen. KYC hat kein Datum am Kunden, die Lücke bleibt leer. Es wird nichts gesendet.", "Шаги из загруженных строк. У KYC нет даты в карточке, промежуток остаётся пустым. Ничего не отправляется.", "الخطوات من الصفوف المحملة. التحقق بلا تاريخ في البطاقة، فتبقى الفجوة فارغة. لا يُرسل شيء."] as Row,
  stepRegistered: ["Registered", "Kayıt", "Registriert", "Регистрация", "التسجيل"] as Row,
  stepKycDone: ["KYC approved", "KYC onaylı", "KYC genehmigt", "KYC одобрен", "التحقق موافق"] as Row,
  stepFirstDeposit: ["First deposit", "İlk yatırım", "Erste Einzahlung", "Первый депозит", "أول إيداع"] as Row,
  stepFirstTrade: ["First trade", "İlk işlem", "Erster Trade", "Первая сделка", "أول صفقة"] as Row,
  stepSecondDeposit: ["Second deposit", "İkinci yatırım", "Zweite Einzahlung", "Второй депозит", "الإيداع الثاني"] as Row,
  stepNoDate: ["No date on the loaded row", "Yüklenen satırda tarih yok", "Kein Datum in der geladenen Zeile", "В загруженной строке нет даты", "لا تاريخ في الصف المحمّل"] as Row,
  stepOpen: ["Not yet", "Henüz değil", "Noch nicht", "Ещё нет", "ليس بعد"] as Row,
  stepDays: ["days", "gün", "Tage", "дн.", "يوم"] as Row,
  cohortTitle: ["Registration weeks", "Kayıt haftaları", "Registrierungswochen", "Недели регистрации", "أسابيع التسجيل"] as Row,
  cohortHint: ["Each week counts customers loaded for this panel. First trade uses loaded positions.", "Her hafta bu panelde yüklenen müşterileri sayar. İlk işlem yüklenen pozisyonlardandır.", "Jede Woche zählt die hier geladenen Kunden. Der erste Trade nutzt geladene Positionen.", "Каждая неделя считает клиентов, загруженных здесь. Первая сделка берётся из загруженных позиций.", "كل أسبوع يعد العملاء المحمّلين هنا. أول صفقة من المراكز المحمّلة."] as Row,
  cohortEmpty: ["No registration week on the loaded rows.", "Yüklenen satırlarda kayıt haftası yok.", "Keine Registrierungswoche in den geladenen Zeilen.", "В загруженных строках нет недели регистрации.", "لا أسبوع تسجيل في الصفوف المحمّلة."] as Row,
  staffProfile: ["My profile", "Profilim", "Mein Profil", "Мой профиль", "ملفي"] as Row,
  staffHint: ["Stored in this browser. The sign-in name and password are not changed.", "Bu tarayıcıda durur. Giriş adı ve parola değişmez.", "Bleibt in diesem Browser. Anmeldename und Passwort ändern sich nicht.", "Хранится в этом браузере. Имя входа и пароль не меняются.", "يُحفظ في هذا المتصفح. اسم الدخول وكلمة المرور لا يتغيران."] as Row,
  signInName: ["Sign-in name", "Giriş adı", "Anmeldename", "Имя входа", "اسم الدخول"] as Row,
  shownName: ["Name shown here", "Burada görünen ad", "Name hier", "Имя на этой странице", "الاسم الظاهر هنا"] as Row,
  defaultTab: ["Default tab", "Varsayılan sekme", "Standardreiter", "Вкладка по умолчанию", "التبويب الافتراضي"] as Row,
  defaultFilters: ["Customer filters", "Müşteri süzgeçleri", "Kundenfilter", "Фильтры клиентов", "مرشحات العملاء"] as Row,
  openTab: ["Open my tab", "Sekmemi aç", "Meinen Reiter öffnen", "Открыть мою вкладку", "فتح تبويبي"] as Row,
  openFilters: ["Open customers with these filters", "Müşterileri bu süzgeçle aç", "Kunden mit diesen Filtern öffnen", "Открыть клиентов с этими фильтрами", "فتح العملاء بهذه المرشحات"] as Row,
  workStart: ["Work starts", "Mesai başı", "Arbeit beginnt", "Начало работы", "بدء العمل"] as Row,
  workEnd: ["Work ends", "Mesai sonu", "Arbeit endet", "Конец работы", "نهاية العمل"] as Row,
  workHint: ["Shown on this page. Nobody is paged.", "Bu sayfada gösterilir. Kimse aranmaz.", "Nur auf dieser Seite. Niemand wird gerufen.", "Только на этой странице. Никого не вызывают.", "يظهر في هذه الصفحة فقط. لا يُستدعى أحد."] as Row,
  densityHere: ["Dense rows", "Sık satırlar", "Dichte Zeilen", "Плотные строки", "صفوف كثيفة"] as Row,
  themeHere: ["Dark theme", "Koyu tema", "Dunkles Thema", "Тёмная тема", "سمة داكنة"] as Row,
  resetPrefs: ["Reset these preferences", "Bu tercihleri sıfırla", "Diese Einstellungen zurücksetzen", "Сбросить эти настройки", "إعادة هذه التفضيلات"] as Row,
} as const;

type Key = keyof typeof ROWS;
function column(index: 0 | 1 | 2 | 3 | 4): { [K in Key]: string } {
  const out = {} as { [K in Key]: string };
  (Object.keys(ROWS) as Key[]).forEach((key) => { out[key] = ROWS[key][index]; });
  return out;
}

export const PEOPLE_EN = column(0);
export const PEOPLE_TR = column(1);
export const PEOPLE_DE = column(2);
export const PEOPLE_RU = column(3);
export const PEOPLE_AR = column(4);
