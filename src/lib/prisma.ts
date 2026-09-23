import { PrismaClient } from "@prisma/client";

/**
 * Resolve DATABASE_URL for Prisma.
 * - cPanel / local MySQL: set DATABASE_URL explicitly (mysql://...).
 * - Netlify only: when process.env.NETLIFY is set and DATABASE_URL is unset,
 *   use @netlify/database getConnectionString() (or NETLIFY_DB_URL fallbacks).
 */
function ensureDatabaseUrl(): void {
  if (process.env.DATABASE_URL) return;

  if (process.env.NETLIFY) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getConnectionString } = require("@netlify/database") as {
        getConnectionString: () => string;
      };
      process.env.DATABASE_URL = getConnectionString();
      return;
    } catch {
      // Package unavailable / env not provisioned yet
    }

    const fallback =
      process.env.NETLIFY_DB_URL ||
      process.env.NETLIFY_DATABASE_URL ||
      process.env.NETLIFY_DATABASE_URL_UNPOOLED;
    if (fallback) {
      process.env.DATABASE_URL = fallback;
    }
  }
}

ensureDatabaseUrl();

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
