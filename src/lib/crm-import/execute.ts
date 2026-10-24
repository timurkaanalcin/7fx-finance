import { randomBytes } from "crypto";
import { hashPassword, writeAudit } from "@/lib/auth";
import { allocateUniqueAccountLoginId } from "@/lib/account-login-id";
import { prisma } from "@/lib/prisma";
import { normalizeAccountCurrency } from "@/lib/membership";
import { isPlaceholderEmail } from "./map";
import type { DuplicateMode, ImportRowResult, RowValidation } from "./types";

function randomPassword(len = 12): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[bytes[i]! % alphabet.length];
  return out;
}

function buildAddress(city: string | null, existing?: string | null): string | null {
  if (!city && !existing) return null;
  if (city && existing) return `${city} — ${existing}`.slice(0, 500);
  return (city || existing || null)?.slice(0, 500) || null;
}

export async function executeImport(opts: {
  validations: RowValidation[];
  duplicateMode: DuplicateMode;
  adminId: string;
  adminName: string;
}): Promise<{
  results: ImportRowResult[];
  summary: { created: number; updated: number; skipped: number; errors: number };
}> {
  const results: ImportRowResult[] = [];
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  // Process in small batches with transactions
  const BATCH = 25;
  const rows = opts.validations;

  for (let start = 0; start < rows.length; start += BATCH) {
    const chunk = rows.slice(start, start + BATCH);
    for (const v of chunk) {
      const m = v.mapped;
      try {
        if (!v.ok) {
          results.push({
            rowIndex: v.rowIndex,
            status: "error",
            email: m.email,
            accountLoginId: null,
            userId: null,
            password: null,
            message: v.errors.join(", ") || "validation_failed",
          });
          errors += 1;
          continue;
        }

        if (v.duplicateInFile && opts.duplicateMode === "skip") {
          // Skip subsequent duplicates in file (first already handled)
          const prior = results.find(
            (r) =>
              r.email.toLowerCase() === m.email.toLowerCase() &&
              (r.status === "created" || r.status === "updated" || r.status === "skipped")
          );
          if (prior) {
            results.push({
              rowIndex: v.rowIndex,
              status: "skipped",
              email: m.email,
              accountLoginId: null,
              userId: null,
              password: null,
              message: "duplicate_in_file",
            });
            skipped += 1;
            continue;
          }
        }

        if (v.duplicateInDb && opts.duplicateMode === "skip") {
          results.push({
            rowIndex: v.rowIndex,
            status: "skipped",
            email: m.email,
            accountLoginId: null,
            userId: v.existingUserId,
            password: null,
            message: "duplicate_in_db",
          });
          skipped += 1;
          continue;
        }

        const plainPassword = m.password && m.password.length >= 6 ? m.password : randomPassword(12);
        const passwordHash = await hashPassword(plainPassword);
        const name = `${m.firstName} ${m.lastName}`.trim() || m.email.split("@")[0];
        const currency = normalizeAccountCurrency(m.currency, "USD");
        const address = buildAddress(m.city, null);
        const balance = Number.isFinite(m.balance) ? Math.max(0, m.balance) : 0;

        if (v.duplicateInDb && opts.duplicateMode === "update" && v.existingUserId) {
          const user = await prisma.$transaction(async (tx) => {
            const updatedUser = await tx.user.update({
              where: { id: v.existingUserId! },
              data: {
                name,
                firstName: m.firstName || null,
                lastName: m.lastName || null,
                phone: m.phone,
                country: m.country,
                language: m.language,
                desk: m.desk,
                saleStatus: m.saleStatus,
                assigneeName: m.assigneeName,
                affiliateA: m.source,
                campaign: m.source,
                address,
                ...(m.password && m.password.length >= 6 ? { passwordHash } : {}),
              },
              include: { account: true },
            });
            if (updatedUser.account) {
              // Only bump balance if mapped balance > 0 and admin intends start balance
              if (balance > 0) {
                await tx.account.update({
                  where: { userId: updatedUser.id },
                  data: {
                    balance,
                    equity: balance,
                    freeMargin: balance,
                    currency,
                  },
                });
              } else {
                await tx.account.update({
                  where: { userId: updatedUser.id },
                  data: { currency },
                });
              }
            }
            if (m.note) {
              await tx.userNote.create({
                data: {
                  userId: updatedUser.id,
                  authorId: opts.adminId,
                  authorName: opts.adminName,
                  body: `[Import] ${m.note}`.slice(0, 4000),
                },
              });
            }
            return updatedUser;
          });

          results.push({
            rowIndex: v.rowIndex,
            status: "updated",
            email: user.email,
            accountLoginId: user.accountLoginId,
            userId: user.id,
            password: m.password && m.password.length >= 6 ? plainPassword : null,
            message: null,
          });
          updated += 1;
          continue;
        }

        // Create new
        const accountLoginId = await allocateUniqueAccountLoginId();
        const email = m.email.toLowerCase();

        // Race-safe: re-check email
        const clash = await prisma.user.findUnique({ where: { email }, select: { id: true } });
        if (clash) {
          if (opts.duplicateMode === "skip") {
            results.push({
              rowIndex: v.rowIndex,
              status: "skipped",
              email,
              accountLoginId: null,
              userId: clash.id,
              password: null,
              message: "duplicate_in_db",
            });
            skipped += 1;
            continue;
          }
          // fall through as update
          v.existingUserId = clash.id;
          v.duplicateInDb = true;
          // recursive-ish: redo as update in same loop by pushing back — simpler inline:
          const user = await prisma.user.update({
            where: { id: clash.id },
            data: {
              name,
              firstName: m.firstName || null,
              lastName: m.lastName || null,
              phone: m.phone,
              country: m.country,
              language: m.language,
              desk: m.desk,
              assigneeName: m.assigneeName,
              saleStatus: m.saleStatus,
              affiliateA: m.source,
              campaign: m.source,
              address,
            },
          });
          results.push({
            rowIndex: v.rowIndex,
            status: "updated",
            email: user.email,
            accountLoginId: user.accountLoginId,
            userId: user.id,
            password: null,
            message: null,
          });
          updated += 1;
          continue;
        }

        const user = await prisma.$transaction(async (tx) => {
          const createdUser = await tx.user.create({
            data: {
              email,
              accountLoginId,
              passwordHash,
              name,
              firstName: m.firstName || null,
              lastName: m.lastName || null,
              phone: m.phone,
              role: "TRADER",
              active: true,
              registrationDate: new Date(),
              language: m.language,
              country: m.country,
              registrationCountry: m.country,
              desk: m.desk,
              assigneeName: m.assigneeName,
              site: m.site || "7fx",
              saleStatus: m.saleStatus || "NEW",
              affiliateA: m.source,
              campaign: m.source,
              referralCodeUsed: m.source ? `import:${m.source}`.slice(0, 64) : "admin-import",
              address,
              account: {
                create: {
                  balance,
                  equity: balance,
                  margin: 0,
                  freeMargin: balance,
                  leverage: 100,
                  currency,
                },
              },
            },
          });
          if (m.note) {
            await tx.userNote.create({
              data: {
                userId: createdUser.id,
                authorId: opts.adminId,
                authorName: opts.adminName,
                body: `[Import] ${m.note}`.slice(0, 4000),
              },
            });
          }
          return createdUser;
        });

        results.push({
          rowIndex: v.rowIndex,
          status: "created",
          email: user.email,
          accountLoginId: user.accountLoginId,
          userId: user.id,
          password: plainPassword,
          message: isPlaceholderEmail(email) ? "email_placeholder" : null,
        });
        created += 1;
      } catch (e) {
        console.error("[import] row", v.rowIndex, e);
        results.push({
          rowIndex: v.rowIndex,
          status: "error",
          email: m.email,
          accountLoginId: null,
          userId: null,
          password: null,
          message: e instanceof Error ? e.message.slice(0, 200) : "import_failed",
        });
        errors += 1;
      }
    }
  }

  await writeAudit({
    adminId: opts.adminId,
    action: "BULK_IMPORT_USERS",
    note: `created=${created} updated=${updated} skipped=${skipped} errors=${errors}`,
    meta: { created, updated, skipped, errors, total: rows.length },
  });

  return { results, summary: { created, updated, skipped, errors } };
}

export function resultsToCsv(results: ImportRowResult[]): string {
  const header = ["row", "status", "email", "accountLoginId", "userId", "password", "message"];
  const lines = [header.join(",")];
  for (const r of results) {
    const cols = [
      String(r.rowIndex + 1),
      r.status,
      r.email,
      r.accountLoginId || "",
      r.userId || "",
      r.password || "",
      r.message || "",
    ].map((c) => {
      const s = String(c);
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    });
    lines.push(cols.join(","));
  }
  return lines.join("\n");
}
