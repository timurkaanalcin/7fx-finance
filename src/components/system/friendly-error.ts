const TECHNICAL =
  /user yok|no session|prisma|syntaxerror|stack trace|econn|fetch failed|failed to fetch|unexpected token|internal server|networkerror|typeerror|unauthorized|forbidden|\b[45]\d\d\b/i;

/** Turn a raw API or runtime string into a short sentence a trader can act on. */
export function friendlyError(raw: string | null | undefined, fallback: string): string {
  const text = (raw || "").replace(/\s+/g, " ").trim();
  if (!text || text.length > 140 || TECHNICAL.test(text)) return fallback;
  return text;
}
