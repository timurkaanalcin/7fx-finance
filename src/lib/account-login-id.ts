/**
 * 16-digit numeric login account ID (Account ID).
 * Digits only, unique per user, assigned on registration / backfill.
 */
import { randomInt } from "crypto";
import { prisma } from "./prisma";

export const ACCOUNT_LOGIN_ID_LEN = 16;
export const ACCOUNT_LOGIN_ID_RE = /^\d{16}$/;

/** Generate a 16-digit numeric string (no leading zero). */
export function generateAccountLoginId(): string {
  let id = String(randomInt(1, 10));
  for (let i = 0; i < ACCOUNT_LOGIN_ID_LEN - 1; i++) {
    id += String(randomInt(0, 10));
  }
  return id;
}

export function isAccountLoginId(value: string): boolean {
  return ACCOUNT_LOGIN_ID_RE.test(String(value || "").trim());
}

/** Allocate a unique 16-digit ID; retries on rare collisions. */
export async function allocateUniqueAccountLoginId(
  maxAttempts = 24
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const candidate = generateAccountLoginId();
    const existing = await prisma.user.findUnique({
      where: { accountLoginId: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
  }
  throw new Error("ACCOUNT_LOGIN_ID_ALLOC_FAILED");
}

/** Backfill missing accountLoginId for existing users (idempotent). */
export async function backfillMissingAccountLoginIds(): Promise<number> {
  const missing = await prisma.user.findMany({
    where: { OR: [{ accountLoginId: null }, { accountLoginId: "" }] },
    select: { id: true },
    take: 5000,
  });
  let updated = 0;
  for (const row of missing) {
    const accountLoginId = await allocateUniqueAccountLoginId();
    try {
      await prisma.user.update({
        where: { id: row.id },
        data: { accountLoginId },
      });
      updated += 1;
    } catch {
      // Unique race — retry once with a fresh ID
      try {
        const retry = await allocateUniqueAccountLoginId();
        await prisma.user.update({
          where: { id: row.id },
          data: { accountLoginId: retry },
        });
        updated += 1;
      } catch (err) {
        console.error("[7fx] accountLoginId backfill failed for", row.id, err);
      }
    }
  }
  if (updated > 0) {
    console.log(`[7fx] Backfilled accountLoginId for ${updated} user(s)`);
  }
  return updated;
}
