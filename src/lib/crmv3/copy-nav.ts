/** CRM v3 copy for grouped navigation. */
type Row = readonly [string, string, string, string, string];
const ROWS = {
  navWork: ["Work", "İş", "Arbeit", "Работа", "العمل"] as Row,
  navMoney: ["Money", "Para", "Geld", "Деньги", "المال"] as Row,
  navCompliance: ["Compliance", "Uyum", "Prüfung", "Проверка", "الالتزام"] as Row,
  navInsights: ["Insights", "İçgörü", "Einblick", "Обзор", "الرؤية"] as Row,
  navDesk: ["Desk", "Masa", "Pult", "Стол", "المكتب"] as Row,
  railNav: ["Sections", "Bölümler", "Bereiche", "Разделы", "الأقسام"] as Row,
  railFold: ["Collapse the section rail", "Bölüm rayını daralt", "Bereichsleiste einklappen", "Свернуть полосу разделов", "طي شريط الأقسام"] as Row,
  railExpand: ["Expand the section rail", "Bölüm rayını aç", "Bereichsleiste ausklappen", "Развернуть полосу разделов", "فتح شريط الأقسام"] as Row,
  railFoldShort: ["Collapse", "Daralt", "Einklappen", "Свернуть", "طي"] as Row,
  railExpandShort: ["Expand", "Aç", "Ausklappen", "Развернуть", "فتح"] as Row,
  railHere: ["Open page", "Açık sayfa", "Offene Seite", "Открытая страница", "الصفحة المفتوحة"] as Row,
  railFind: ["Find a loaded page", "Yüklenen bir sayfa bul", "Geladene Seite finden", "Найти загруженную страницу", "ابحث عن صفحة محمّلة"] as Row,
  railNone: ["No loaded page matches.", "Yüklenen sayfa eşleşmedi.", "Keine geladene Seite passt.", "Нет подходящей загруженной страницы.", "لا صفحة محمّلة تطابق."] as Row,
  railStored: ["The collapsed rail is stored in this browser.", "Daraltılmış ray bu tarayıcıda durur.", "Die eingeklappte Leiste bleibt in diesem Browser.", "Свёрнутая полоса хранится в этом браузере.", "الشريط المطوي يبقى في هذا المتصفح."] as Row,
} as const;

type Key = keyof typeof ROWS;
function column(index: 0 | 1 | 2 | 3 | 4): { [K in Key]: string } {
  const out = {} as { [K in Key]: string };
  (Object.keys(ROWS) as Key[]).forEach((key) => { out[key] = ROWS[key][index]; });
  return out;
}

export const NAV_EN = column(0);
export const NAV_TR = column(1);
export const NAV_DE = column(2);
export const NAV_RU = column(3);
export const NAV_AR = column(4);
