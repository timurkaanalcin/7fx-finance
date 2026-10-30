import { requireAdmin } from "@/lib/auth";
import { crmv2Response } from "@/crmv2/respond";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET(req: Request) {
  return crmv2Response(req, requireAdmin);
}
