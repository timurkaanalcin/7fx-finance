import { prisma } from "@/lib/prisma";
import { isPlaceholderEmail, isValidEmailFormat } from "./map";
import type { DuplicateMode, MappedCustomer, RowValidation } from "./types";

export async function validateMappedRows(
  mapped: MappedCustomer[],
  opts: { duplicateMode: DuplicateMode }
): Promise<RowValidation[]> {
  const emails = mapped
    .map((m) => m.email.toLowerCase())
    .filter((e) => e && !isPlaceholderEmail(e));
  const uniqueEmails = Array.from(new Set(emails));

  const existing =
    uniqueEmails.length > 0
      ? await prisma.user.findMany({
          where: { email: { in: uniqueEmails } },
          select: { id: true, email: true },
          take: 5000,
        })
      : [];
  const dbByEmail = new Map(existing.map((u) => [u.email.toLowerCase(), u.id]));

  const fileCounts = new Map<string, number>();
  for (const m of mapped) {
    if (!m.email || isPlaceholderEmail(m.email)) continue;
    const k = m.email.toLowerCase();
    fileCounts.set(k, (fileCounts.get(k) || 0) + 1);
  }

  const seenInFile = new Set<string>();
  const results: RowValidation[] = [];

  for (const m of mapped) {
    const errors: string[] = [];
    const warnings: string[] = [];
    const emailKey = m.email.toLowerCase();
    const duplicateInFile =
      !isPlaceholderEmail(m.email) &&
      ((fileCounts.get(emailKey) || 0) > 1 || seenInFile.has(emailKey));
    if (!isPlaceholderEmail(m.email) && m.email) seenInFile.add(emailKey);

    const existingUserId = dbByEmail.get(emailKey) || null;
    const duplicateInDb = Boolean(existingUserId);

    if (!m.email && !m.phone) {
      errors.push("email_or_phone_required");
    }
    if (m.email && !isPlaceholderEmail(m.email) && !isValidEmailFormat(m.email)) {
      errors.push("invalid_email");
    }
    if (m.phone) {
      const digits = m.phone.replace(/\D/g, "");
      if (digits.length < 7 || digits.length > 16) errors.push("invalid_phone");
    }
    if (!m.firstName && !m.lastName) {
      warnings.push("missing_name");
      // Allow import with fallback name from email
    }
    if (m.password && m.password.length < 6) {
      errors.push("password_too_short");
    }
    if (m.emailPlaceholder) {
      warnings.push("email_placeholder");
    }
    if (duplicateInFile) {
      if (opts.duplicateMode === "skip") warnings.push("duplicate_in_file");
      else warnings.push("duplicate_in_file");
    }
    if (duplicateInDb) {
      if (opts.duplicateMode === "skip") warnings.push("duplicate_in_db_skip");
      else warnings.push("duplicate_in_db_update");
    }

    // Require at least email OR phone was already checked; if only placeholder email without phone — error
    if (m.emailPlaceholder && !m.phone) {
      errors.push("email_or_phone_required");
    }
    const ok = errors.length === 0;

    results.push({
      rowIndex: m.rowIndex,
      ok,
      errors,
      warnings,
      duplicateInFile,
      duplicateInDb,
      existingUserId,
      mapped: {
        ...m,
        firstName: m.firstName || (m.email ? m.email.split("@")[0] : "Import"),
        lastName: m.lastName || "-",
      },
    });
  }

  // Fix duplicate-in-file: first occurrence ok, rest get error if mode skip, or warning
  const firstEmail = new Map<string, number>();
  for (const r of results) {
    if (isPlaceholderEmail(r.mapped.email)) continue;
    const k = r.mapped.email.toLowerCase();
    if (!k) continue;
    if (!firstEmail.has(k)) {
      firstEmail.set(k, r.rowIndex);
      continue;
    }
    r.duplicateInFile = true;
    if (!r.warnings.includes("duplicate_in_file")) r.warnings.push("duplicate_in_file");
    if (opts.duplicateMode === "skip") {
      // Will be skipped at execute; keep ok if otherwise valid so preview shows skip
    } else {
      // update mode — later rows with same email in file still conflict; mark error
      r.errors.push("duplicate_in_file");
      r.ok = false;
    }
  }

  return results;
}
