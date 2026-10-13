/** Client-safe invalid reason list. */
export const INVALID_REASONS = [
  { code: "INV_WRONG_GEO", en: "Wrong geo (wrong country)", tr: "Yanlış ülke", ru: "Wrong geo — неправильная страна" },
  { code: "INV_WRONG_LANGUAGE", en: "Wrong language (no Turkish)", tr: "Yanlış dil (Türkçe bilmiyor)", ru: "Wrong language — не говорит на тур." },
  { code: "INV_WRONG_PERSON", en: "Wrong person", tr: "Yanlış kişi", ru: "Wrong person — не тот человек" },
  { code: "INV_WRONG_NUMBER", en: "Wrong number (disconnected/invalid)", tr: "Yanlış numara (kapalı/geçersiz)", ru: "Wrong number — номер отключен/недействителен" },
  { code: "INV_WRONG_INFO", en: "Wrong info (job/loan/no-deposit)", tr: "Yanlış bilgi (iş/kredi/yatırımsız)", ru: "Wrong info — работа/кредит/без депозита" },
  { code: "INV_WRONG_SOURCE", en: "Wrong source (unordered traffic)", tr: "Yanlış kaynak (sipariş dışı trafik)", ru: "Wrong source — незаказанный источник" },
  { code: "INV_UNDERAGE", en: "Underage / age outside 21-65", tr: "Yaş 21-65 dışı", ru: "Underage 21-65 — возраст вне 21-65" },
  { code: "INV_TRASH", en: "Trash (swearing/trolling/police)", tr: "Çöp (küfür/trol/polis tehdidi)", ru: "Trash — мат/троллинг/угрозы полицией" },
  { code: "INV_DUPLICATE", en: "Duplicate", tr: "Mükerrer", ru: "Duplicate — дубль" },
  { code: "INV_NOT_REGISTERED", en: "Not registered / registered 1-2 days ago", tr: "Kayıt olmadı / 1-2 gün önce", ru: "Not Registered — отрицает / 1-2 дня назад" },
  { code: "INV_NOT_IN_WH", en: "Not in working hours", tr: "Mesai dışı", ru: "Not in WH — не в рабочее время" },
  { code: "INV_NO_DOCS", en: "Immigrants without docs", tr: "Belgesiz göçmen", ru: "Иммигранты без документов" },
] as const;
export const INVALID_CODES: string[] = INVALID_REASONS.map((r) => r.code);
export const isInvalidCode = (c: unknown) => typeof c === "string" && INVALID_CODES.includes(c);

