/**
 * Client-facing API error text. Known short messages pass through.
 * Stack frames, connection strings, and secret names do not.
 */
const UNSAFE =
  /(?:mysql|postgres(?:ql)?|mongodb|redis|rediss):\/\/|password\s*=|AUTH_SECRET|JWT_SECRET|DATABASE_URL|SEED_SECRET|CRON_SECRET|OPENAI_API_KEY|VAPID_|PRIVATE KEY|BEGIN [A-Z0-9 ]*PRIVATE|Invalid `prisma|prisma\.\w+\.\w+\(|\/home\/|\/workspace\/|node_modules|\bat\s+\S+:\d+:\d+/i;

export function publicErrorText(input: unknown, fallback: string): string {
  const msg = input instanceof Error ? input.message : typeof input === "string" ? input : "";
  if (!msg || msg.length > 240 || /[\r\n]/.test(msg) || UNSAFE.test(msg)) return fallback;
  const trimmed = msg.trim();
  if (!trimmed || UNSAFE.test(trimmed)) return fallback;
  return trimmed;
}
