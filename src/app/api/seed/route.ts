import { NextResponse } from "next/server";
import { ensureDemoSeed } from "@/lib/ensure-seed";

/**
 * Optional protected seed endpoint.
 * POST /api/seed with header: Authorization: Bearer <SEED_SECRET or AUTH_SECRET>
 */
export async function POST(req: Request) {
  const expected =
    process.env.SEED_SECRET || process.env.AUTH_SECRET || process.env.JWT_SECRET;
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  if (!expected || token !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureDemoSeed();
    return NextResponse.json({ ok: true, seeded: true, message: "ensureDemoSeed completed" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
