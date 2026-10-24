import { timingSafeEqual } from "node:crypto";

export type CronAuth = "ok" | "unset" | "forbidden";

/**
 * Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when that env var is set.
 * An unset secret fails closed so the route cannot be triggered anonymously.
 */
export function cronAuthorization(secret: string | undefined, header: string | null): CronAuth {
  if (typeof secret !== "string" || secret.length === 0) return "unset";
  const expected = `Bearer ${secret}`;
  const got = header ?? "";
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return "forbidden";
  return timingSafeEqual(a, b) ? "ok" : "forbidden";
}
