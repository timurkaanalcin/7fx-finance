import { DEFAULT_SITE, normalizeSiteKey } from "@/lib/sites-shared";
import {
  type ColumnMapping,
  type ImportDefaults,
  type ImportTargetField,
  type MappedCustomer,
  type ParsedTable,
} from "./types";
import { ACCOUNT_CURRENCIES, SALE_STATUSES, normalizeAccountCurrency } from "@/lib/membership";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

/** Header aliases → target field (TR / EN / RU / common CRM) */
const ALIASES: Record<ImportTargetField, string[]> = {
  ignore: [],
  firstName: [
    "first name",
    "firstname",
    "first_name",
    "ad",
    "adi",
    "adı",
    "isim",
    "имя",
    "vorname",
    "given name",
    "givenname",
  ],
  lastName: [
    "last name",
    "lastname",
    "last_name",
    "soyad",
    "soyadi",
    "soyadı",
    "фамилия",
    "nachname",
    "surname",
    "family name",
  ],
  fullName: [
    "full name",
    "fullname",
    "name",
    "ad soyad",
    "adsoyad",
    "müşteri",
    "musteri",
    "client",
    "customer",
    "фио",
    "имя фамилия",
    "ham satır",
  ],
  email: [
    "email",
    "e-mail",
    "e-posta",
    "eposta",
    "mail",
    "почта",
    "электронная почта",
    "email address",
  ],
  phone: [
    "phone",
    "telefon",
    "tel",
    "mobile",
    "gsm",
    "cep",
    "телефон",
    "phone number",
    "whatsapp",
  ],
  country: ["country", "ülke", "ulke", "страна", "land", "nation", "country code"],
  city: ["city", "şehir", "sehir", "город", "stadt", "town"],
  language: ["language", "dil", "lang", "язык", "sprache", "locale"],
  currency: ["currency", "para birimi", "parabirimi", "валюта", "währung", "ccy"],
  desk: ["desk", "masa", "стол", "office", "team", "retention", "sale"],
  saleStatus: [
    "sale status",
    "salestatus",
    "satış durumu",
    "satis durumu",
    "status",
    "durum",
    "статус",
    "lead status",
  ],
  source: [
    "source",
    "kaynak",
    "affiliate",
    "affiliatea",
    "a_aid",
    "campaign",
    "kampanya",
    "utm",
    "источник",
    "partner",
  ],
  note: ["note", "not", "notes", "yorum", "comment", "комментарий", "remark", "açıklama"],
  balance: [
    "balance",
    "bakiye",
    "başlangıç bakiyesi",
    "baslangic bakiyesi",
    "starting balance",
    "deposit",
    "баланс",
  ],
  password: ["password", "şifre", "sifre", "pass", "пароль", "kennwort"],
};

function normHeader(h: string): string {
  return String(h || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_/\\]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function guessMapping(columns: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const used = new Set<ImportTargetField>();

  // Prefer longer / exact alias matches so "başlangıç bakiyesi" ≠ language ("dil")
  const catalog: { field: ImportTargetField; alias: string }[] = [];
  for (const [field, aliases] of Object.entries(ALIASES) as [ImportTargetField, string[]][]) {
    if (field === "ignore") continue;
    for (const a of aliases) catalog.push({ field, alias: a });
  }
  catalog.sort((a, b) => b.alias.length - a.alias.length);

  for (const col of columns) {
    const n = normHeader(col);
    let found: ImportTargetField = "ignore";
    let bestScore = 0;
    for (const { field, alias } of catalog) {
      if (used.has(field)) continue;
      let score = 0;
      if (n === alias) score = 1000 + alias.length;
      else if (n.startsWith(alias + " ") || n.endsWith(" " + alias) || n.includes(" " + alias + " "))
        score = 500 + alias.length;
      else if (alias.length >= 4 && n.includes(alias)) score = 100 + alias.length;
      else if (alias.length >= 3 && n === alias) score = 1000 + alias.length;
      if (score > bestScore) {
        bestScore = score;
        found = field;
      }
    }
    if (found !== "ignore") used.add(found);
    mapping[col] = found;
  }
  return mapping;
}

export function splitFullName(full: string): { firstName: string; lastName: string } {
  const parts = String(full || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "-" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function cell(row: string[], columns: string[], col: string): string {
  const i = columns.indexOf(col);
  if (i < 0) return "";
  return String(row[i] ?? "").trim();
}

function pickMapped(row: string[], columns: string[], mapping: ColumnMapping, field: ImportTargetField): string {
  for (const col of columns) {
    if (mapping[col] === field) {
      const v = cell(row, columns, col);
      if (v) return v;
    }
  }
  return "";
}

function normalizePhone(raw: string): string | null {
  const s = String(raw || "").trim();
  if (!s) return null;
  const digits = s.replace(/\D/g, "");
  if (digits.length < 7) return null;
  return s.slice(0, 40);
}

function normalizeSaleStatus(raw: string): string | null {
  const s = String(raw || "").trim().toUpperCase().replace(/\s+/g, "_");
  if (!s) return null;
  if ((SALE_STATUSES as readonly string[]).includes(s)) return s;
  const aliases: Record<string, string> = {
    YENI: "NEW",
    NEW: "NEW",
    CEVAPSIZ: "NO_ANSWER",
    NOANSWER: "NO_ANSWER",
    GERI_ARA: "CALLBACK",
    CALLBACK: "CALLBACK",
    ILGILI: "INTERESTED",
    INTERESTED: "INTERESTED",
    ILGISIZ: "NOT_INTERESTED",
    YATIRIM: "DEPOSITED",
    DEPOSITED: "DEPOSITED",
    KAYIP: "LOST",
    LOST: "LOST",
  };
  return aliases[s.replace(/-/g, "_")] || s.slice(0, 40);
}

function normalizeLang(raw: string): string {
  const s = String(raw || "").trim().toLowerCase();
  if (!s) return "tr";
  if (s.startsWith("tr") || s === "türkçe" || s === "turkce" || s === "turkish") return "tr";
  if (s.startsWith("en") || s === "english" || s === "ingilizce") return "en";
  if (s.startsWith("ru") || s === "russian" || s === "русский") return "ru";
  if (s.startsWith("de") || s === "german" || s === "deutsch") return "de";
  if (s.startsWith("ar") || s === "arabic") return "ar";
  return s.slice(0, 8);
}

/** Generate unique placeholder email when schema requires email but row has only phone. */
export function placeholderEmail(phone: string | null, rowIndex: number): string {
  const digits = (phone || "").replace(/\D/g, "").slice(-12) || `r${rowIndex}`;
  const stamp = Date.now().toString(36);
  return `import+${digits}.${stamp}.${rowIndex}@noemail.7fx.local`.toLowerCase().slice(0, 190);
}

export function applyMapping(
  table: ParsedTable,
  mapping: ColumnMapping,
  defaults: ImportDefaults = {}
): MappedCustomer[] {
  const site = normalizeSiteKey(defaults.site) ?? DEFAULT_SITE;
  const defCurrency = normalizeAccountCurrency(defaults.currency || "USD", "USD");
  const out: MappedCustomer[] = [];

  for (let i = 0; i < table.rows.length; i++) {
    const row = table.rows[i];
    let firstName = pickMapped(row, table.columns, mapping, "firstName");
    let lastName = pickMapped(row, table.columns, mapping, "lastName");
    const fullName = pickMapped(row, table.columns, mapping, "fullName");
    if ((!firstName || !lastName) && fullName) {
      const split = splitFullName(fullName);
      if (!firstName) firstName = split.firstName;
      if (!lastName) lastName = split.lastName;
    }

    let email = pickMapped(row, table.columns, mapping, "email").toLowerCase();
    const phone = normalizePhone(pickMapped(row, table.columns, mapping, "phone"));
    let emailPlaceholder = false;
    if (!email && phone) {
      email = placeholderEmail(phone, i);
      emailPlaceholder = true;
    }

    const country =
      pickMapped(row, table.columns, mapping, "country") || defaults.country || null;
    const city = pickMapped(row, table.columns, mapping, "city") || null;
    const language = normalizeLang(
      pickMapped(row, table.columns, mapping, "language") || defaults.language || "tr"
    );
    const currencyRaw = pickMapped(row, table.columns, mapping, "currency") || defaults.currency || defCurrency;
    const currency = normalizeAccountCurrency(currencyRaw, defCurrency);
    const desk =
      pickMapped(row, table.columns, mapping, "desk") || defaults.desk || null;
    const assigneeName = (defaults.assigneeName || "").trim() || null;
    const saleStatus =
      normalizeSaleStatus(
        pickMapped(row, table.columns, mapping, "saleStatus") || defaults.saleStatus || ""
      ) || null;
    const source =
      pickMapped(row, table.columns, mapping, "source") || defaults.source || null;
    const note = pickMapped(row, table.columns, mapping, "note") || null;
    const balRaw = pickMapped(row, table.columns, mapping, "balance");
    const balance = balRaw !== "" && Number.isFinite(Number(balRaw)) ? Number(balRaw) : 0;
    const password = pickMapped(row, table.columns, mapping, "password") || null;

    out.push({
      rowIndex: i,
      firstName: firstName.slice(0, 80),
      lastName: lastName.slice(0, 80),
      email: email.slice(0, 190),
      phone,
      country: country ? String(country).slice(0, 80) : null,
      city: city ? String(city).slice(0, 80) : null,
      language,
      currency: (ACCOUNT_CURRENCIES as readonly string[]).includes(currency) ? currency : "USD",
      desk: desk ? String(desk).slice(0, 80) : null,
      saleStatus,
      source: source ? String(source).slice(0, 120) : null,
      assigneeName: assigneeName ? String(assigneeName).slice(0, 120) : null,
      note: note ? String(note).slice(0, 2000) : null,
      balance: Math.max(0, balance),
      password: password && password.length >= 6 ? password.slice(0, 128) : password ? password : null,
      emailPlaceholder,
      site,
    });
  }
  return out;
}

export function isValidEmailFormat(email: string): boolean {
  return EMAIL_RE.test(email) && !email.endsWith("@noemail.7fx.local");
}

export function isPlaceholderEmail(email: string): boolean {
  return /@noemail\.7fx\.local$/i.test(email);
}
