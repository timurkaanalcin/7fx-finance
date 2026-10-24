/**
 * Server-only site helpers. Other sites push customers via POST /api/ingest/customers
 * with a per-site bearer token (SITE_INGEST_TOKENS env).
 */
import { createHash, timingSafeEqual } from "crypto";
import { DEFAULT_SITE, normalizeSiteKey } from "@/lib/sites-shared";

export * from "@/lib/sites-shared";

export function ownSiteKey(): string {
  return normalizeSiteKey(process.env.SITE_KEY) ?? DEFAULT_SITE;
}

/**
 * SITE_INGEST_TOKENS env: "mfx:<token>,other:<token>" (comma/semicolon/newline separated).
 * Returns the site key the bearer token belongs to, or null.
 */
export function siteForIngestToken(token: string | null | undefined): string | null {
  if (!token || token.length < 24) return null;
  const raw = process.env.SITE_INGEST_TOKENS || "";
  const want = createHash("sha256").update(token).digest();
  let hit: string | null = null;
  for (const part of raw.split(/[,;\n]+/)) {
    const i = part.indexOf(":");
    if (i <= 0) continue;
    const key = normalizeSiteKey(part.slice(0, i));
    const tok = part.slice(i + 1).trim();
    if (!key || tok.length < 24) continue;
    const have = createHash("sha256").update(tok).digest();
    if (timingSafeEqual(want, have)) hit = key; // no early exit (constant-ish time)
  }
  return hit;
}
