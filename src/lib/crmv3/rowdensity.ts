/** Local desk row density, and introducer counts grouped by the country already on each row. */

export const ROW_DENSITY_KEY = "crmv3-row-density";
export const IB_COUNTRY_KEY = "crmv3-ib-country-hide";

export const ROW_DENSITIES = ["comfortable", "compact", "dense"] as const;
export type RowDensity = (typeof ROW_DENSITIES)[number];

export type CountryValue = { country?: unknown; registrationCountry?: unknown; region?: unknown } | string | null | undefined;

export type CountryRow = { country?: CountryValue; label?: string | null };

export type CountryLine = { country: string; count: number };

export function rowDensity(raw: unknown): RowDensity | "" {
  const value = String(raw || "").trim();
  return (ROW_DENSITIES as readonly string[]).includes(value) ? (value as RowDensity) : "";
}

/** An unknown value is left out. The open spacing is comfortable. */
export function activeDensity(raw: unknown): RowDensity {
  return rowDensity(raw) || "comfortable";
}

export function resetDensity(): RowDensity {
  return "comfortable";
}

function plain(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

/** Country, then registration country, then region. A login country is not used. */
export function countryText(value: CountryValue): string {
  if (typeof value === "string") return plain(value);
  if (!value || typeof value !== "object") return "";
  return plain(value.country) || plain(value.registrationCountry) || plain(value.region);
}

export function countryLines(rows: readonly CountryRow[]): CountryLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const country = countryText(row.country);
    map.set(country, (map.get(country) || 0) + 1);
  }
  const out: CountryLine[] = [];
  map.forEach((count, country) => out.push({ country, count }));
  return out.sort((a, b) => {
    if (!a.country) return -1;
    if (!b.country) return 1;
    return a.country.localeCompare(b.country);
  });
}

export function namedCountries(rows: readonly CountryRow[]): string[] {
  return countryLines(rows).map((line) => line.country).filter(Boolean);
}

export function readHiddenCountries(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => countryText(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const country = countryText(String(item || ""));
    if (!country || !allow.has(country) || out.includes(country)) continue;
    out.push(country);
  }
  return out;
}

export function toggleCountry(hidden: readonly string[], country: string, present: readonly string[]): string[] {
  const current = readHiddenCountries(hidden, present);
  const next = countryText(country);
  if (!next || !present.map((item) => countryText(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleCountries(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenCountries(hidden, present));
  return namedCountries(present.map((country) => ({ country }))).filter((country) => (showHidden ? gone.has(country) : !gone.has(country)));
}

export function activeCountry(selected: string, visible: readonly string[]): string {
  const country = countryText(selected);
  if (!country) return "";
  return visible.some((item) => countryText(item) === country) ? country : "";
}

export function visibleIntroducers<T extends CountryRow>(rows: readonly T[], country: string, blank: boolean, query: string): T[] {
  const want = countryText(country);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = countryText(row.country);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (!text) return true;
    return `${row.label || ""} ${got}`.toLowerCase().includes(text);
  });
}
