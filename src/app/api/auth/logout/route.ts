import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";
import { hostnameFromRequest } from "@/lib/crm-host";

export async function POST(req: Request) {
  const host = hostnameFromRequest({ headers: { get: (n: string) => req.headers.get(n) } });
  const res = NextResponse.json({ ok: true });
  clearSessionCookie(res, host);
  return res;
}
