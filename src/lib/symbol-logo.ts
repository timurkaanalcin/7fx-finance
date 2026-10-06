import manifest from "../../public/logos/manifest.json";

const LOGO_MAP = manifest as Record<string, string>;

/** Resolve a public logo URL for a trading symbol, or null if none. */
export function symbolLogoUrl(symbol: string): string | null {
  return LOGO_MAP[symbol] ?? null;
}
