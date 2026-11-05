/** CRM v4 chrome. Screen copy stays in the CRM v2 tables. Locales cannot drift. */
import { ROUND1_COPY } from "@/lib/crmv4/copy-round1";
import { ROUND2_COPY } from "@/lib/crmv4/copy-round2";
import { ROUND3_COPY } from "@/lib/crmv4/copy-round3";
import { ROUND4_COPY } from "@/lib/crmv4/copy-round4";
import { ROUND5_COPY } from "@/lib/crmv4/copy-round5";
import { ROUND6_COPY } from "@/lib/crmv4/copy-round6";
import { ROUND7_COPY } from "@/lib/crmv4/copy-round7";
import { ROUND8_COPY } from "@/lib/crmv4/copy-round8";
import { ROUND9_COPY } from "@/lib/crmv4/copy-round9";
import { ROUND10_COPY } from "@/lib/crmv4/copy-round10";
import { ROUND11_COPY } from "@/lib/crmv4/copy-round11";
import { ROUND12_COPY } from "@/lib/crmv4/copy-round12";
import { ROUND13_COPY } from "@/lib/crmv4/copy-round13";
import { ROUND14_COPY } from "@/lib/crmv4/copy-round14";
import { ROUND15_COPY } from "@/lib/crmv4/copy-round15";
import { ROUND16_COPY } from "@/lib/crmv4/copy-round16";
import { ROUND17_COPY } from "@/lib/crmv4/copy-round17";
import { ROUND18_COPY } from "@/lib/crmv4/copy-round18";
import { ROUND19_COPY } from "@/lib/crmv4/copy-round19";
import { ROUND20_COPY } from "@/lib/crmv4/copy-round20";
import { ROUND21_COPY } from "@/lib/crmv4/copy-round21";
import { ROUND22_COPY } from "@/lib/crmv4/copy-round22";
import { ROUND23_COPY } from "@/lib/crmv4/copy-round23";
import { ROUND24_COPY } from "@/lib/crmv4/copy-round24";
import { ROUND25_COPY } from "@/lib/crmv4/copy-round25";
import { ROUND26_COPY } from "@/lib/crmv4/copy-round26";
import { ROUND27_COPY } from "@/lib/crmv4/copy-round27";
import { ROUND28_COPY } from "@/lib/crmv4/copy-round28";
import { ROUND29_COPY } from "@/lib/crmv4/copy-round29";
import { ROUND30_COPY } from "@/lib/crmv4/copy-round30";
import { ROUND31_COPY } from "@/lib/crmv4/copy-round31";
import { ROUND32_COPY } from "@/lib/crmv4/copy-round32";
import { ROUND33_COPY } from "@/lib/crmv4/copy-round33";
import { ROUND34_COPY } from "@/lib/crmv4/copy-round34";
import { ROUND35_COPY } from "@/lib/crmv4/copy-round35";
import { ROUND36_COPY } from "@/lib/crmv4/copy-round36";
import { ROUND37_COPY } from "@/lib/crmv4/copy-round37";
import { ROUND38_COPY } from "@/lib/crmv4/copy-round38";
import { ROUND39_COPY } from "@/lib/crmv4/copy-round39";
import { ROUND40_COPY } from "@/lib/crmv4/copy-round40";
import { ROUND41_COPY } from "@/lib/crmv4/copy-round41";
import { ROUND42_COPY } from "@/lib/crmv4/copy-round42";
import { ROUND43_COPY } from "@/lib/crmv4/copy-round43";
import { ROUND45_COPY } from "@/lib/crmv4/copy-round45";
import { ROUND46_COPY } from "@/lib/crmv4/copy-round46";
import { ROUND47_COPY } from "@/lib/crmv4/copy-round47";
import { ROUND48_COPY } from "@/lib/crmv4/copy-round48";
import { ROUND49_COPY } from "@/lib/crmv4/copy-round49";
import { ROUND50_COPY } from "@/lib/crmv4/copy-round50";
import { ROUND51_COPY } from "@/lib/crmv4/copy-round51";
import { ROUND52_COPY } from "@/lib/crmv4/copy-round52";
import { ROUND53_COPY } from "@/lib/crmv4/copy-round53";
import { ROUND54_COPY } from "@/lib/crmv4/copy-round54";
import { ROUND55_COPY } from "@/lib/crmv4/copy-round55";
import { ROUND56_COPY } from "@/lib/crmv4/copy-round56";
import { ROUND57_COPY } from "@/lib/crmv4/copy-round57";
import { ROUND58_COPY } from "@/lib/crmv4/copy-round58";
import { ROUND59_COPY } from "@/lib/crmv4/copy-round59";
import { ROUND60_COPY } from "@/lib/crmv4/copy-round60";
import { ROUND61_COPY } from "@/lib/crmv4/copy-round61";
import { ROUND62_COPY } from "@/lib/crmv4/copy-round62";
import { ROUND63_COPY } from "@/lib/crmv4/copy-round63";
import { ROUND64_COPY } from "@/lib/crmv4/copy-round64";
import { ROUND65_COPY } from "@/lib/crmv4/copy-round65";
import { ROUND66_COPY } from "@/lib/crmv4/copy-round66";

const enBase = {
  v4mark: "CRM v4",
  financeNav: "Finance",
  subOverview: "Desk",
  subCustomers: "Accounts",
  subFinance: "Requests",
  subPositions: "Book",
  subSupport: "Tickets",
  subMarketing: "Outreach",
  subLogs: "History",
  subSettings: "Workspace",
  subControl: "System",
  admin: "Admin",
  reminders: "Reminders",
  notes: "Notes",
  language: "Language",
  footer: "7FX · All rights reserved",
  openMenu: "Open menu",
  savePreset: "Save filters",
  presetName: "Preset name",
  editPreset: "Rename",
  deletePreset: "Delete preset",
  clearFilters: "Clear filters",
  showFilters: "Show filters",
  hideFilters: "Hide filters",
  tableSettings: "Table settings",
  columns: "Columns",
  sortName: "Sort by name",
  sortBalance: "Sort by balance",
  perPage: "Per page",
  denseRows: "Dense rows",
  reminderBody: "Reminder",
  reminderWhen: "When",
  addReminder: "Add reminder",
  noReminders: "No reminders",
  scratchHint: "These notes stay in this browser.",
  addScratch: "Add note",
  noScratch: "No notes yet",
  localOnly: "Saved on this browser only.",
  langTabs: "Language",
  prevCustomer: "Previous customer",
  nextCustomer: "Next customer",
  customerId: "ID",
  monthPrev: "Previous month",
  monthNext: "Next month",
  today: "Today",
  noEvents: "Nothing scheduled",
  mix: "Mix",
  gear: "Settings",
  pendingBadge: "Pending",
  pullHint: "Pull to refresh",
  refreshing: "Refreshing",
};

const trBase: typeof enBase = {
  v4mark: "CRM v4",
  financeNav: "Finans",
  subOverview: "Masa",
  subCustomers: "Hesaplar",
  subFinance: "Talepler",
  subPositions: "Defter",
  subSupport: "Biletler",
  subMarketing: "Erişim",
  subLogs: "Geçmiş",
  subSettings: "Çalışma alanı",
  subControl: "Sistem",
  admin: "Yönetici",
  reminders: "Anımsatıcılar",
  notes: "Notlar",
  language: "Dil",
  footer: "7FX · Tüm hakları saklıdır",
  openMenu: "Menüyü aç",
  savePreset: "Filtreyi kaydet",
  presetName: "Ön ayar adı",
  editPreset: "Yeniden adlandır",
  deletePreset: "Ön ayarı sil",
  clearFilters: "Filtreleri temizle",
  showFilters: "Filtreleri göster",
  hideFilters: "Filtreleri gizle",
  tableSettings: "Tablo ayarları",
  columns: "Sütunlar",
  sortName: "Ada göre sırala",
  sortBalance: "Bakiyeye göre sırala",
  perPage: "Sayfa başına",
  denseRows: "Sık satırlar",
  reminderBody: "Anımsatıcı",
  reminderWhen: "Zaman",
  addReminder: "Anımsatıcı ekle",
  noReminders: "Anımsatıcı yok",
  scratchHint: "Bu notlar bu tarayıcıda kalır.",
  addScratch: "Not ekle",
  noScratch: "Henüz not yok",
  localOnly: "Yalnızca bu tarayıcıda saklanır.",
  langTabs: "Dil",
  prevCustomer: "Önceki müşteri",
  nextCustomer: "Sonraki müşteri",
  customerId: "Kimlik",
  monthPrev: "Önceki ay",
  monthNext: "Sonraki ay",
  today: "Bugün",
  noEvents: "Plan yok",
  mix: "Dağılım",
  gear: "Ayarlar",
  pendingBadge: "Bekleyen",
  pullHint: "Yenilemek için çekin",
  refreshing: "Yenileniyor",
};

const deBase: typeof enBase = {
  v4mark: "CRM v4",
  financeNav: "Finanzen",
  subOverview: "Pult",
  subCustomers: "Konten",
  subFinance: "Anträge",
  subPositions: "Buch",
  subSupport: "Tickets",
  subMarketing: "Ansprache",
  subLogs: "Verlauf",
  subSettings: "Arbeitsbereich",
  subControl: "System",
  admin: "Admin",
  reminders: "Erinnerungen",
  notes: "Notizen",
  language: "Sprache",
  footer: "7FX · Alle Rechte vorbehalten",
  openMenu: "Menü öffnen",
  savePreset: "Filter speichern",
  presetName: "Name der Vorlage",
  editPreset: "Umbenennen",
  deletePreset: "Vorlage löschen",
  clearFilters: "Filter leeren",
  showFilters: "Filter zeigen",
  hideFilters: "Filter ausblenden",
  tableSettings: "Tabelleneinstellungen",
  columns: "Spalten",
  sortName: "Nach Name sortieren",
  sortBalance: "Nach Saldo sortieren",
  perPage: "Pro Seite",
  denseRows: "Dichte Zeilen",
  reminderBody: "Erinnerung",
  reminderWhen: "Zeitpunkt",
  addReminder: "Erinnerung hinzufügen",
  noReminders: "Keine Erinnerungen",
  scratchHint: "Diese Notizen bleiben in diesem Browser.",
  addScratch: "Notiz hinzufügen",
  noScratch: "Noch keine Notizen",
  localOnly: "Nur in diesem Browser gespeichert.",
  langTabs: "Sprache",
  prevCustomer: "Vorheriger Kunde",
  nextCustomer: "Nächster Kunde",
  customerId: "Kennung",
  monthPrev: "Vorheriger Monat",
  monthNext: "Nächster Monat",
  today: "Heute",
  noEvents: "Nichts geplant",
  mix: "Mix",
  gear: "Einstellungen",
  pendingBadge: "Offen",
  pullHint: "Zum Aktualisieren ziehen",
  refreshing: "Aktualisierung",
};

const ruBase: typeof enBase = {
  v4mark: "CRM v4",
  financeNav: "Финансы",
  subOverview: "Стол",
  subCustomers: "Счета",
  subFinance: "Заявки",
  subPositions: "Книга",
  subSupport: "Заявки",
  subMarketing: "Охват",
  subLogs: "История",
  subSettings: "Рабочая область",
  subControl: "Система",
  admin: "Админ",
  reminders: "Напоминания",
  notes: "Заметки",
  language: "Язык",
  footer: "7FX · Все права защищены",
  openMenu: "Открыть меню",
  savePreset: "Сохранить фильтры",
  presetName: "Имя набора",
  editPreset: "Переименовать",
  deletePreset: "Удалить набор",
  clearFilters: "Сбросить фильтры",
  showFilters: "Показать фильтры",
  hideFilters: "Скрыть фильтры",
  tableSettings: "Настройки таблицы",
  columns: "Столбцы",
  sortName: "По имени",
  sortBalance: "По балансу",
  perPage: "На странице",
  denseRows: "Плотные строки",
  reminderBody: "Напоминание",
  reminderWhen: "Когда",
  addReminder: "Добавить напоминание",
  noReminders: "Нет напоминаний",
  scratchHint: "Эти заметки остаются в этом браузере.",
  addScratch: "Добавить заметку",
  noScratch: "Заметок пока нет",
  localOnly: "Хранится только в этом браузере.",
  langTabs: "Язык",
  prevCustomer: "Предыдущий клиент",
  nextCustomer: "Следующий клиент",
  customerId: "Идентификатор",
  monthPrev: "Предыдущий месяц",
  monthNext: "Следующий месяц",
  today: "Сегодня",
  noEvents: "Ничего не запланировано",
  mix: "Состав",
  gear: "Настройки",
  pendingBadge: "Ожидают",
  pullHint: "Потяните, чтобы обновить",
  refreshing: "Обновление",
};

const arBase: typeof enBase = {
  v4mark: "CRM v4",
  financeNav: "المالية",
  subOverview: "المكتب",
  subCustomers: "الحسابات",
  subFinance: "الطلبات",
  subPositions: "السجل",
  subSupport: "التذاكر",
  subMarketing: "التواصل",
  subLogs: "السجل",
  subSettings: "مساحة العمل",
  subControl: "النظام",
  admin: "المشرف",
  reminders: "التذكيرات",
  notes: "الملاحظات",
  language: "اللغة",
  footer: "7FX · جميع الحقوق محفوظة",
  openMenu: "فتح القائمة",
  savePreset: "حفظ عوامل التصفية",
  presetName: "اسم الإعداد",
  editPreset: "إعادة التسمية",
  deletePreset: "حذف الإعداد",
  clearFilters: "مسح عوامل التصفية",
  showFilters: "إظهار عوامل التصفية",
  hideFilters: "إخفاء عوامل التصفية",
  tableSettings: "إعدادات الجدول",
  columns: "الأعمدة",
  sortName: "ترتيب حسب الاسم",
  sortBalance: "ترتيب حسب الرصيد",
  perPage: "لكل صفحة",
  denseRows: "صفوف كثيفة",
  reminderBody: "تذكير",
  reminderWhen: "الوقت",
  addReminder: "إضافة تذكير",
  noReminders: "لا توجد تذكيرات",
  scratchHint: "تبقى هذه الملاحظات في هذا المتصفح.",
  addScratch: "إضافة ملاحظة",
  noScratch: "لا ملاحظات بعد",
  localOnly: "يُحفظ في هذا المتصفح فقط.",
  langTabs: "اللغة",
  prevCustomer: "العميل السابق",
  nextCustomer: "العميل التالي",
  customerId: "المعرف",
  monthPrev: "الشهر السابق",
  monthNext: "الشهر التالي",
  today: "اليوم",
  noEvents: "لا شيء مجدول",
  mix: "التوزيع",
  gear: "الإعدادات",
  pendingBadge: "معلق",
  pullHint: "اسحب للتحديث",
  refreshing: "جارٍ التحديث",
};

const en = { ...enBase, ...ROUND1_COPY.en, ...ROUND2_COPY.en, ...ROUND3_COPY.en, ...ROUND4_COPY.en, ...ROUND5_COPY.en, ...ROUND6_COPY.en, ...ROUND7_COPY.en, ...ROUND8_COPY.en, ...ROUND9_COPY.en, ...ROUND10_COPY.en, ...ROUND11_COPY.en, ...ROUND12_COPY.en, ...ROUND13_COPY.en, ...ROUND14_COPY.en, ...ROUND15_COPY.en, ...ROUND16_COPY.en, ...ROUND17_COPY.en, ...ROUND18_COPY.en, ...ROUND19_COPY.en, ...ROUND20_COPY.en, ...ROUND21_COPY.en, ...ROUND22_COPY.en, ...ROUND23_COPY.en, ...ROUND24_COPY.en, ...ROUND25_COPY.en, ...ROUND26_COPY.en, ...ROUND27_COPY.en, ...ROUND28_COPY.en, ...ROUND29_COPY.en, ...ROUND30_COPY.en, ...ROUND31_COPY.en, ...ROUND32_COPY.en, ...ROUND33_COPY.en, ...ROUND34_COPY.en, ...ROUND35_COPY.en, ...ROUND36_COPY.en, ...ROUND37_COPY.en, ...ROUND38_COPY.en, ...ROUND39_COPY.en, ...ROUND40_COPY.en, ...ROUND41_COPY.en, ...ROUND42_COPY.en, ...ROUND43_COPY.en, ...ROUND45_COPY.en, ...ROUND46_COPY.en, ...ROUND47_COPY.en, ...ROUND48_COPY.en, ...ROUND49_COPY.en, ...ROUND50_COPY.en, ...ROUND51_COPY.en, ...ROUND52_COPY.en, ...ROUND53_COPY.en, ...ROUND54_COPY.en, ...ROUND55_COPY.en, ...ROUND56_COPY.en, ...ROUND57_COPY.en, ...ROUND58_COPY.en, ...ROUND59_COPY.en, ...ROUND60_COPY.en, ...ROUND61_COPY.en, ...ROUND62_COPY.en, ...ROUND63_COPY.en, ...ROUND64_COPY.en, ...ROUND65_COPY.en, ...ROUND66_COPY.en };
const tr: typeof en = { ...trBase, ...ROUND1_COPY.tr, ...ROUND2_COPY.tr, ...ROUND3_COPY.tr, ...ROUND4_COPY.tr, ...ROUND5_COPY.tr, ...ROUND6_COPY.tr, ...ROUND7_COPY.tr, ...ROUND8_COPY.tr, ...ROUND9_COPY.tr, ...ROUND10_COPY.tr, ...ROUND11_COPY.tr, ...ROUND12_COPY.tr, ...ROUND13_COPY.tr, ...ROUND14_COPY.tr, ...ROUND15_COPY.tr, ...ROUND16_COPY.tr, ...ROUND17_COPY.tr, ...ROUND18_COPY.tr, ...ROUND19_COPY.tr, ...ROUND20_COPY.tr, ...ROUND21_COPY.tr, ...ROUND22_COPY.tr, ...ROUND23_COPY.tr, ...ROUND24_COPY.tr, ...ROUND25_COPY.tr, ...ROUND26_COPY.tr, ...ROUND27_COPY.tr, ...ROUND28_COPY.tr, ...ROUND29_COPY.tr, ...ROUND30_COPY.tr, ...ROUND31_COPY.tr, ...ROUND32_COPY.tr, ...ROUND33_COPY.tr, ...ROUND34_COPY.tr, ...ROUND35_COPY.tr, ...ROUND36_COPY.tr, ...ROUND37_COPY.tr, ...ROUND38_COPY.tr, ...ROUND39_COPY.tr, ...ROUND40_COPY.tr, ...ROUND41_COPY.tr, ...ROUND42_COPY.tr, ...ROUND43_COPY.tr, ...ROUND45_COPY.tr, ...ROUND46_COPY.tr, ...ROUND47_COPY.tr, ...ROUND48_COPY.tr, ...ROUND49_COPY.tr, ...ROUND50_COPY.tr, ...ROUND51_COPY.tr, ...ROUND52_COPY.tr, ...ROUND53_COPY.tr, ...ROUND54_COPY.tr, ...ROUND55_COPY.tr, ...ROUND56_COPY.tr, ...ROUND57_COPY.tr, ...ROUND58_COPY.tr, ...ROUND59_COPY.tr, ...ROUND60_COPY.tr, ...ROUND61_COPY.tr, ...ROUND62_COPY.tr, ...ROUND63_COPY.tr, ...ROUND64_COPY.tr, ...ROUND65_COPY.tr, ...ROUND66_COPY.tr };
const de: typeof en = { ...deBase, ...ROUND1_COPY.de, ...ROUND2_COPY.de, ...ROUND3_COPY.de, ...ROUND4_COPY.de, ...ROUND5_COPY.de, ...ROUND6_COPY.de, ...ROUND7_COPY.de, ...ROUND8_COPY.de, ...ROUND9_COPY.de, ...ROUND10_COPY.de, ...ROUND11_COPY.de, ...ROUND12_COPY.de, ...ROUND13_COPY.de, ...ROUND14_COPY.de, ...ROUND15_COPY.de, ...ROUND16_COPY.de, ...ROUND17_COPY.de, ...ROUND18_COPY.de, ...ROUND19_COPY.de, ...ROUND20_COPY.de, ...ROUND21_COPY.de, ...ROUND22_COPY.de, ...ROUND23_COPY.de, ...ROUND24_COPY.de, ...ROUND25_COPY.de, ...ROUND26_COPY.de, ...ROUND27_COPY.de, ...ROUND28_COPY.de, ...ROUND29_COPY.de, ...ROUND30_COPY.de, ...ROUND31_COPY.de, ...ROUND32_COPY.de, ...ROUND33_COPY.de, ...ROUND34_COPY.de, ...ROUND35_COPY.de, ...ROUND36_COPY.de, ...ROUND37_COPY.de, ...ROUND38_COPY.de, ...ROUND39_COPY.de, ...ROUND40_COPY.de, ...ROUND41_COPY.de, ...ROUND42_COPY.de, ...ROUND43_COPY.de, ...ROUND45_COPY.de, ...ROUND46_COPY.de, ...ROUND47_COPY.de, ...ROUND48_COPY.de, ...ROUND49_COPY.de, ...ROUND50_COPY.de, ...ROUND51_COPY.de, ...ROUND52_COPY.de, ...ROUND53_COPY.de, ...ROUND54_COPY.de, ...ROUND55_COPY.de, ...ROUND56_COPY.de, ...ROUND57_COPY.de, ...ROUND58_COPY.de, ...ROUND59_COPY.de, ...ROUND60_COPY.de, ...ROUND61_COPY.de, ...ROUND62_COPY.de, ...ROUND63_COPY.de, ...ROUND64_COPY.de, ...ROUND65_COPY.de, ...ROUND66_COPY.de };
const ru: typeof en = { ...ruBase, ...ROUND1_COPY.ru, ...ROUND2_COPY.ru, ...ROUND3_COPY.ru, ...ROUND4_COPY.ru, ...ROUND5_COPY.ru, ...ROUND6_COPY.ru, ...ROUND7_COPY.ru, ...ROUND8_COPY.ru, ...ROUND9_COPY.ru, ...ROUND10_COPY.ru, ...ROUND11_COPY.ru, ...ROUND12_COPY.ru, ...ROUND13_COPY.ru, ...ROUND14_COPY.ru, ...ROUND15_COPY.ru, ...ROUND16_COPY.ru, ...ROUND17_COPY.ru, ...ROUND18_COPY.ru, ...ROUND19_COPY.ru, ...ROUND20_COPY.ru, ...ROUND21_COPY.ru, ...ROUND22_COPY.ru, ...ROUND23_COPY.ru, ...ROUND24_COPY.ru, ...ROUND25_COPY.ru, ...ROUND26_COPY.ru, ...ROUND27_COPY.ru, ...ROUND28_COPY.ru, ...ROUND29_COPY.ru, ...ROUND30_COPY.ru, ...ROUND31_COPY.ru, ...ROUND32_COPY.ru, ...ROUND33_COPY.ru, ...ROUND34_COPY.ru, ...ROUND35_COPY.ru, ...ROUND36_COPY.ru, ...ROUND37_COPY.ru, ...ROUND38_COPY.ru, ...ROUND39_COPY.ru, ...ROUND40_COPY.ru, ...ROUND41_COPY.ru, ...ROUND42_COPY.ru, ...ROUND43_COPY.ru, ...ROUND45_COPY.ru, ...ROUND46_COPY.ru, ...ROUND47_COPY.ru, ...ROUND48_COPY.ru, ...ROUND49_COPY.ru, ...ROUND50_COPY.ru, ...ROUND51_COPY.ru, ...ROUND52_COPY.ru, ...ROUND53_COPY.ru, ...ROUND54_COPY.ru, ...ROUND55_COPY.ru, ...ROUND56_COPY.ru, ...ROUND57_COPY.ru, ...ROUND58_COPY.ru, ...ROUND59_COPY.ru, ...ROUND60_COPY.ru, ...ROUND61_COPY.ru, ...ROUND62_COPY.ru, ...ROUND63_COPY.ru, ...ROUND64_COPY.ru, ...ROUND65_COPY.ru, ...ROUND66_COPY.ru };
const ar: typeof en = { ...arBase, ...ROUND1_COPY.ar, ...ROUND2_COPY.ar, ...ROUND3_COPY.ar, ...ROUND4_COPY.ar, ...ROUND5_COPY.ar, ...ROUND6_COPY.ar, ...ROUND7_COPY.ar, ...ROUND8_COPY.ar, ...ROUND9_COPY.ar, ...ROUND10_COPY.ar, ...ROUND11_COPY.ar, ...ROUND12_COPY.ar, ...ROUND13_COPY.ar, ...ROUND14_COPY.ar, ...ROUND15_COPY.ar, ...ROUND16_COPY.ar, ...ROUND17_COPY.ar, ...ROUND18_COPY.ar, ...ROUND19_COPY.ar, ...ROUND20_COPY.ar, ...ROUND21_COPY.ar, ...ROUND22_COPY.ar, ...ROUND23_COPY.ar, ...ROUND24_COPY.ar, ...ROUND25_COPY.ar, ...ROUND26_COPY.ar, ...ROUND27_COPY.ar, ...ROUND28_COPY.ar, ...ROUND29_COPY.ar, ...ROUND30_COPY.ar, ...ROUND31_COPY.ar, ...ROUND32_COPY.ar, ...ROUND33_COPY.ar, ...ROUND34_COPY.ar, ...ROUND35_COPY.ar, ...ROUND36_COPY.ar, ...ROUND37_COPY.ar, ...ROUND38_COPY.ar, ...ROUND39_COPY.ar, ...ROUND40_COPY.ar, ...ROUND41_COPY.ar, ...ROUND42_COPY.ar, ...ROUND43_COPY.ar, ...ROUND45_COPY.ar, ...ROUND46_COPY.ar, ...ROUND47_COPY.ar, ...ROUND48_COPY.ar, ...ROUND49_COPY.ar, ...ROUND50_COPY.ar, ...ROUND51_COPY.ar, ...ROUND52_COPY.ar, ...ROUND53_COPY.ar, ...ROUND54_COPY.ar, ...ROUND55_COPY.ar, ...ROUND56_COPY.ar, ...ROUND57_COPY.ar, ...ROUND58_COPY.ar, ...ROUND59_COPY.ar, ...ROUND60_COPY.ar, ...ROUND61_COPY.ar, ...ROUND62_COPY.ar, ...ROUND63_COPY.ar, ...ROUND64_COPY.ar, ...ROUND65_COPY.ar, ...ROUND66_COPY.ar };

export const CRM_V4_COPY = { en, tr, de, ru, ar };

export type CrmV4CopyKey = keyof typeof en;

export function crmv4Text(locale: string, key: CrmV4CopyKey): string {
  const base = locale.toLowerCase().split("-")[0];
  const table = CRM_V4_COPY[base as keyof typeof CRM_V4_COPY] || CRM_V4_COPY.en;
  return table[key] || CRM_V4_COPY.en[key];
}
