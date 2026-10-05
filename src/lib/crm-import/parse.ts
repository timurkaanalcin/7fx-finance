import * as XLSX from "xlsx";
import Papa from "papaparse";
import mammoth from "mammoth";
import {
  IMPORT_MAX_BYTES,
  IMPORT_MAX_ROWS,
  type ParsedTable,
} from "./types";

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE =
  /(?:\+|00)?[\d][\d\s()./-]{7,}\d/g;

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

function cleanCell(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return String(v).replace(/\u0000/g, "").trim();
}

function normalizeTable(columns: string[], rows: string[][]): { columns: string[]; rows: string[][] } {
  const cols =
    columns.length > 0
      ? columns.map((c, i) => (c ? String(c).trim() : `Col${i + 1}`))
      : [];
  // Ensure unique column names
  const seen = new Map<string, number>();
  const uniq = cols.map((c) => {
    const base = c || "Col";
    const n = (seen.get(base) || 0) + 1;
    seen.set(base, n);
    return n === 1 ? base : `${base}_${n}`;
  });
  const limited = rows
    .map((r) => {
      const out = uniq.map((_, i) => cleanCell(r[i] ?? ""));
      return out;
    })
    .filter((r) => r.some((c) => c.length > 0))
    .slice(0, IMPORT_MAX_ROWS);
  return { columns: uniq, rows: limited };
}

function sheetToTable(sheet: XLSX.WorkSheet): { columns: string[]; rows: string[][] } {
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: false,
    defval: "",
  }) as unknown[][];
  if (!aoa.length) return { columns: [], rows: [] };
  const header = (aoa[0] || []).map((c) => cleanCell(c));
  const hasHeader = header.some((h) => h.length > 0 && !/^\d+(\.\d+)?$/.test(h));
  if (hasHeader) {
    const body = aoa.slice(1).map((r) => (r || []).map((c) => cleanCell(c)));
    return normalizeTable(header, body);
  }
  const width = Math.max(...aoa.map((r) => (r || []).length), 0);
  const cols = Array.from({ length: width }, (_, i) => `Col${i + 1}`);
  const body = aoa.map((r) => (r || []).map((c) => cleanCell(c)));
  return normalizeTable(cols, body);
}

function parseDelimited(text: string, delimiter?: string): { columns: string[]; rows: string[][] } {
  const result = Papa.parse<string[]>(text, {
    delimiter: delimiter || undefined,
    skipEmptyLines: "greedy",
    dynamicTyping: false,
  });
  const data = (result.data || []).filter((r) => Array.isArray(r) && r.some((c) => String(c || "").trim()));
  if (!data.length) return { columns: [], rows: [] };
  const header = data[0].map((c) => cleanCell(c));
  const looksHeader = header.some((h) => /[a-zA-ZçğıöşüÇĞİÖŞÜа-яА-Я]/.test(h));
  if (looksHeader) {
    return normalizeTable(
      header,
      data.slice(1).map((r) => r.map((c) => cleanCell(c)))
    );
  }
  const width = Math.max(...data.map((r) => r.length), 0);
  return normalizeTable(
    Array.from({ length: width }, (_, i) => `Col${i + 1}`),
    data.map((r) => r.map((c) => cleanCell(c)))
  );
}

function extractContactsFromLines(text: string): { columns: string[]; rows: string[][]; unstructured: boolean } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return { columns: [], rows: [], unstructured: true };

  // Try delimiter detection on whole text first
  const sample = lines.slice(0, 20).join("\n");
  const semi = (sample.match(/;/g) || []).length;
  const comma = (sample.match(/,/g) || []).length;
  const tab = (sample.match(/\t/g) || []).length;
  const pipe = (sample.match(/\|/g) || []).length;
  if (tab >= 3 || semi >= 3 || pipe >= 3 || comma >= 6) {
    let delim = ",";
    if (tab >= semi && tab >= pipe && tab >= 2) delim = "\t";
    else if (semi >= pipe && semi >= 2) delim = ";";
    else if (pipe >= 2) delim = "|";
    const table = parseDelimited(text, delim);
    if (table.rows.length > 0) return { ...table, unstructured: false };
  }

  // Fall back: one row per line with email/phone auto-detect + raw line as note/name
  const rows: string[][] = [];
  for (const line of lines) {
    const emails = line.match(EMAIL_RE) || [];
    const phones = (line.match(PHONE_RE) || [])
      .map((p) => p.replace(/\s+/g, " ").trim())
      .filter((p) => p.replace(/\D/g, "").length >= 8);
    // Skip lines without an email or phone — unstructured import needs a contact
    if (!emails.length && !phones.length) continue;
    const namePart = line
      .replace(EMAIL_RE, " ")
      .replace(PHONE_RE, " ")
      .replace(/[|,;]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    rows.push([namePart, emails[0] || "", phones[0] || "", line]);
  }
  return {
    columns: ["Ad Soyad", "E-posta", "Telefon", "Ham satır"],
    rows,
    unstructured: true,
  };
}

async function parsePdf(buffer: Buffer): Promise<{ text: string; warning: string | null }> {
  try {
    // pdf-parse v2 API
    const mod = await import("pdf-parse");
    const PDFParse = (mod as { PDFParse: new (opts: { data: Buffer }) => { getText: () => Promise<{ text: string }>; destroy: () => Promise<void> } }).PDFParse;
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      const text = String(result?.text || "").trim();
      if (!text) {
        return {
          text: "",
          warning:
            "PDF'de metin bulunamadı (taranmış görüntü olabilir). Excel/CSV yüklemeniz önerilir. / No extractable text found (likely a scanned PDF). Please upload Excel/CSV instead.",
        };
      }
      return { text, warning: null };
    } finally {
      try {
        await parser.destroy();
      } catch {
        /* ignore */
      }
    }
  } catch (e) {
    console.error("[import] pdf parse", e);
    return {
      text: "",
      warning: "PDF okunamadı. Excel/CSV deneyin. / Could not read PDF.",
    };
  }
}

async function parseDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return String(result.value || "");
}

function parseJson(text: string): { columns: string[]; rows: string[][] } {
  const data = JSON.parse(text);
  const arr = Array.isArray(data)
    ? data
    : Array.isArray((data as { data?: unknown }).data)
      ? (data as { data: unknown[] }).data
      : Array.isArray((data as { users?: unknown }).users)
        ? (data as { users: unknown[] }).users
        : Array.isArray((data as { customers?: unknown }).customers)
          ? (data as { customers: unknown[] }).customers
          : null;
  if (!arr || !arr.length) return { columns: [], rows: [] };
  if (typeof arr[0] !== "object" || arr[0] == null) {
    return normalizeTable(
      ["value"],
      arr.map((v) => [cleanCell(v)])
    );
  }
  const keys: string[] = [];
  const keySet = new Set<string>();
  for (const item of arr) {
    if (item && typeof item === "object") {
      for (const k of Object.keys(item as object)) {
        if (!keySet.has(k)) {
          keySet.add(k);
          keys.push(k);
        }
      }
    }
  }
  const rows = arr.map((item) =>
    keys.map((k) => {
      const v = item && typeof item === "object" ? (item as Record<string, unknown>)[k] : "";
      if (v == null) return "";
      if (typeof v === "object") return JSON.stringify(v);
      return cleanCell(v);
    })
  );
  return normalizeTable(keys, rows);
}

export function detectFormat(fileName: string, mime?: string | null): string {
  const ext = extOf(fileName);
  if (ext) return ext;
  const m = String(mime || "").toLowerCase();
  if (m.includes("csv")) return "csv";
  if (m.includes("spreadsheet") || m.includes("excel")) return "xlsx";
  if (m.includes("pdf")) return "pdf";
  if (m.includes("word") || m.includes("officedocument.wordprocessing")) return "docx";
  if (m.includes("json")) return "json";
  return "txt";
}

export async function parseImportFile(opts: {
  buffer: Buffer;
  fileName: string;
  mime?: string | null;
}): Promise<ParsedTable> {
  if (opts.buffer.length > IMPORT_MAX_BYTES) {
    throw new Error(`File too large (max ${IMPORT_MAX_BYTES / (1024 * 1024)} MB)`);
  }
  const format = detectFormat(opts.fileName, opts.mime);
  const fileName = opts.fileName || `upload.${format}`;

  if (["xlsx", "xls", "ods"].includes(format)) {
    const wb = XLSX.read(opts.buffer, { type: "buffer", cellDates: true });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) {
      return { columns: [], rows: [], format, fileName, warning: "Empty workbook" };
    }
    const table = sheetToTable(wb.Sheets[sheetName]);
    return { ...table, format, fileName, unstructured: false, warning: null };
  }

  if (format === "csv" || format === "tsv") {
    const text = opts.buffer.toString("utf8");
    const table = parseDelimited(text, format === "tsv" ? "\t" : undefined);
    return { ...table, format, fileName, unstructured: false, warning: null };
  }

  if (format === "json") {
    const text = opts.buffer.toString("utf8");
    const table = parseJson(text);
    return { ...table, format, fileName, unstructured: false, warning: null };
  }

  if (format === "docx") {
    const text = await parseDocx(opts.buffer);
    const extracted = extractContactsFromLines(text);
    return {
      ...extracted,
      format,
      fileName,
      warning: extracted.rows.length
        ? null
        : "DOCX içinde satır/iletişim bulunamadı. / No rows found in DOCX.",
    };
  }

  if (format === "pdf") {
    const { text, warning } = await parsePdf(opts.buffer);
    if (!text) {
      return { columns: [], rows: [], format, fileName, unstructured: true, warning };
    }
    const extracted = extractContactsFromLines(text);
    return {
      ...extracted,
      format,
      fileName,
      warning:
        warning ||
        (extracted.rows.length
          ? null
          : "PDF'de satır bulunamadı. / No rows found in PDF."),
    };
  }

  // txt / unknown — treat as text
  const text = opts.buffer.toString("utf8");
  // BOM strip
  const cleaned = text.replace(/^\uFEFF/, "");
  // If looks like CSV
  if ((cleaned.match(/,/g) || []).length > 3 || (cleaned.match(/\t/g) || []).length > 2) {
    const table = parseDelimited(cleaned);
    if (table.rows.length) {
      return { ...table, format: format || "txt", fileName, unstructured: false, warning: null };
    }
  }
  const extracted = extractContactsFromLines(cleaned);
  return {
    ...extracted,
    format: format || "txt",
    fileName,
    warning: extracted.rows.length ? null : "Metin bulunamadı. / No text rows found.",
  };
}

export function tableSamples(table: ParsedTable, n = 3): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (let i = 0; i < table.columns.length; i++) {
    const col = table.columns[i];
    out[col] = table.rows
      .slice(0, 20)
      .map((r) => r[i] || "")
      .filter(Boolean)
      .slice(0, n);
  }
  return out;
}
