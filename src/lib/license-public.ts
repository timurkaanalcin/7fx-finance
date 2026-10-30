import { prisma } from "@/lib/prisma";
import type { PublicLicense } from "@/lib/license-record";

const select = {
  id: true,
  regulator: true,
  number: true,
  entity: true,
  registerUrl: true,
  logo: true,
} as const;

export async function listPublicLicenses(): Promise<PublicLicense[]> {
  try {
    return await prisma.license.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select,
    });
  } catch {
    return [];
  }
}

export async function getPublicLicense(id: string): Promise<PublicLicense | null> {
  const clean = id.trim().slice(0, 64);
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(clean)) return null;
  try {
    return await prisma.license.findFirst({
      where: { id: clean, active: true },
      select,
    });
  } catch {
    return null;
  }
}
