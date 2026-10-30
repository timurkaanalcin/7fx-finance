import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { locationForRequest } from "@/lib/request-origin";

const HTML = fs.readFileSync(path.join(process.cwd(), "src/crmv2/index.html"), "utf8");

type CrmV2Guard = () => Promise<{ role?: string | null } | null>;

/** Admin session required. Signed-out visitors and non-admins go to /login, same destination as /izcrm. */
export async function crmv2Response(req: Request, guard: CrmV2Guard = requireAdmin): Promise<NextResponse> {
  const admin = await guard();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.redirect(locationForRequest(req, "/login"), 307);
  }
  return new NextResponse(HTML, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
