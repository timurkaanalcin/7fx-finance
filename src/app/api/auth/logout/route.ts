import { NextResponse } from "next/server";
import { isDocumentNav, navRedirect, readAuthBody } from "@/lib/auth-nav";
import { clearSessionCookie } from "@/lib/auth";
import { hostnameFromRequest } from "@/lib/crm-host";

export const dynamic = "force-dynamic";

/** POST /api/auth/logout — form navigation (nav=1) 303s to /login; JSON clients get { ok: true }. */
export async function POST(req: Request) {
  const host = hostnameFromRequest({ headers: { get: (n: string) => req.headers.get(n) } });
  const body = await readAuthBody(req);
  const res = isDocumentNav(req, body)
    ? navRedirect(req, body.desk === "crmv4" ? "/login?desk=crmv4" : "/login")
    : NextResponse.json({ ok: true });
  clearSessionCookie(res, host);
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}
