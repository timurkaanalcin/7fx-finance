import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const licenses = await prisma.license.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        regulator: true,
        number: true,
        entity: true,
        registerUrl: true,
        licenseType: true,
        jurisdiction: true,
        status: true,
        issuedOn: true,
        expiresOn: true,
        scope: true,
        address: true,
        logo: true,
      },
    });
    return NextResponse.json({ licenses }, { headers: { "Cache-Control": "public, max-age=60" } });
  } catch {
    return NextResponse.json({ licenses: [] });
  }
}
