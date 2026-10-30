/** Client-safe invalid reason list. English is the source string; other locales are display labels. */
export const INVALID_REASONS = [
  { code: "INV_WRONG_GEO", en: "Wrong geo (wrong country)", tr: "Yanlış ülke", ru: "Неверная страна", de: "Falsches Land", ar: "دولة غير صحيحة" },
  { code: "INV_WRONG_LANGUAGE", en: "Wrong language (no Turkish)", tr: "Yanlış dil (Türkçe bilmiyor)", ru: "Неверный язык (не говорит по-турецки)", de: "Falsche Sprache (kein Türkisch)", ar: "لغة غير مناسبة (لا يتحدث التركية)" },
  { code: "INV_WRONG_PERSON", en: "Wrong person", tr: "Yanlış kişi", ru: "Не тот человек", de: "Falsche Person", ar: "شخص غير صحيح" },
  { code: "INV_WRONG_NUMBER", en: "Wrong number (disconnected/invalid)", tr: "Yanlış numara (kapalı/geçersiz)", ru: "Неверный номер (отключён или недействителен)", de: "Falsche Nummer (getrennt oder ungültig)", ar: "رقم غير صحيح (مفصول أو غير صالح)" },
  { code: "INV_WRONG_INFO", en: "Wrong info (job/loan/no-deposit)", tr: "Yanlış bilgi (iş/kredi/yatırımsız)", ru: "Неверные данные (работа, кредит или без депозита)", de: "Falsche Angaben (Arbeit, Kredit oder keine Einzahlung)", ar: "معلومات غير صحيحة (عمل أو قرض أو بدون إيداع)" },
  { code: "INV_WRONG_SOURCE", en: "Wrong source (unordered traffic)", tr: "Yanlış kaynak (sipariş dışı trafik)", ru: "Неверный источник (незаказанный трафик)", de: "Falsche Quelle (nicht bestellter Traffic)", ar: "مصدر غير صحيح (حركة غير مطلوبة)" },
  { code: "INV_UNDERAGE", en: "Underage / age outside 21-65", tr: "Yaş 21-65 dışı", ru: "Возраст вне 21–65", de: "Alter außerhalb 21–65", ar: "العمر خارج 21–65" },
  { code: "INV_TRASH", en: "Trash (swearing/trolling/police)", tr: "Çöp (küfür/trol/polis tehdidi)", ru: "Мусор (мат, троллинг или угрозы полицией)", de: "Ausschuss (Beleidigung, Trolling oder Polizei)", ar: "مهمل (سب أو إزعاج أو تهديد بالشرطة)" },
  { code: "INV_DUPLICATE", en: "Duplicate", tr: "Mükerrer", ru: "Дубль", de: "Duplikat", ar: "مكرر" },
  { code: "INV_NOT_REGISTERED", en: "Not registered / registered 1-2 days ago", tr: "Kayıt olmadı / 1-2 gün önce", ru: "Не регистрировался или регистрация 1–2 дня назад", de: "Nicht registriert oder vor 1–2 Tagen", ar: "غير مسجّل أو سُجّل قبل 1–2 يوم" },
  { code: "INV_NOT_IN_WH", en: "Not in working hours", tr: "Mesai dışı", ru: "Вне рабочих часов", de: "Außerhalb der Arbeitszeit", ar: "خارج ساعات العمل" },
  { code: "INV_NO_DOCS", en: "Immigrants without docs", tr: "Belgesiz göçmen", ru: "Иммигранты без документов", de: "Zuwanderer ohne Dokumente", ar: "مهاجرون بلا وثائق" },
] as const;
export const INVALID_CODES: string[] = INVALID_REASONS.map((r) => r.code);
export const isInvalidCode = (c: unknown) => typeof c === "string" && INVALID_CODES.includes(c);
