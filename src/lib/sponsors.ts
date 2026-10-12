export type SponsorRow = {
  id: string;
  name: string;
  url: string | null;
  logo: string;
  logoW: number;
  logoH: number;
  priority: number;
  active: boolean;
  sortOrder: number;
};

export const MAX_LOGO_CHARS = 700_000; // ~500 KB binary
const LOGO_RE = /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/;

export function validLogo(s: unknown): s is string {
  return typeof s === "string" && s.length <= MAX_LOGO_CHARS && LOGO_RE.test(s);
}

export function cleanUrl(u: unknown): string | null {
  const s = String(u ?? "").trim();
  if (!s) return null;
  try {
    const p = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
    if (p.protocol !== "https:" && p.protocol !== "http:") return null;
    return p.toString().slice(0, 500);
  } catch {
    return null;
  }
}

/** Heuristic "AI" ordering score — higher first. */
export function sponsorScore(s: SponsorRow): number {
  let score = 0;
  if (s.active) score += 1000;
  score += Math.max(0, Math.min(10, s.priority || 0)) * 50;
  if (s.logoW > 0 && s.logoH > 0) {
    const ratio = s.logoW / s.logoH;
    // Wide wordmarks (≈2.5–4:1) read best in a logo row
    score += Math.max(0, 40 - Math.abs(ratio - 3) * 12);
    const minSide = Math.min(s.logoW, s.logoH);
    score += minSide >= 80 ? 30 : minSide >= 40 ? 15 : 0;
  }
  if (s.url) score += 10;
  return score;
}

export function aiOrder(list: SponsorRow[]): SponsorRow[] {
  return [...list].sort(
    (a, b) => sponsorScore(b) - sponsorScore(a) || a.name.localeCompare(b.name)
  );
}
