import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { locationForRequest } from "@/lib/request-origin";

const HTML = fs.readFileSync(path.join(process.cwd(), "src/crmv2/index.html"), "utf8");

const OVERVIEW = '<a href="/crmv2" class="nav-item active flex items-center gap-3 p-3 rounded-lg">';

export type CrmV2Home = "/crmv2" | "/izcrm/crmv2";

type CrmV2Guard = () => Promise<{ role?: string | null } | null>;

/** One HTML file. The overview link follows the URL that served the page. */
export function crmv2Document(home: CrmV2Home): string {
  if (home === "/crmv2") return HTML;
  return HTML.replace(OVERVIEW, OVERVIEW.replace('href="/crmv2"', 'href="/izcrm/crmv2"'));
}

export function crmv2Home(req: Request): CrmV2Home {
  const hinted = (req.headers.get("x-7fx-url") || "").split("?")[0].replace(/\/+$/, "");
  if (hinted === "/izcrm/crmv2" || hinted === "/crmv2") return hinted;
  let pathname = "/";
  try {
    pathname = new URL(req.url).pathname;
  } catch {
    pathname = "/";
  }
  pathname = pathname.replace(/\/+$/, "") || "/";
  return pathname === "/izcrm/crmv2" ? "/izcrm/crmv2" : "/crmv2";
}

/** Admin session required. Signed-out visitors and non-admins go to /login, same destination as /izcrm. */
export async function crmv2Response(req: Request, guard: CrmV2Guard = requireAdmin): Promise<NextResponse> {
  const admin = await guard();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.redirect(locationForRequest(req, "/login"), 307);
  }
  return new NextResponse(crmv2Document(crmv2Home(req)), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
