/**
 * Read-only check: CRM CSV exports require an admin session.
 * Staff scope is the existing Prisma filter plus the scoped-staff allowlist.
 * This does not change those checks. Gaps are printed for the report.
 * Run: npx tsx tests/crm-csv-auth.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import { isScopedStaff, scopedRequestAllowed } from "../src/lib/crm-scope";

function read(rel: string): string {
  return fs.readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");
}

const staff = { id: "staff-1", name: "Scoped", role: "ADMIN", jobTitle: "sales_mgr" };

async function main() {
  assert.equal(isScopedStaff(staff), true);
  assert.equal(isScopedStaff({ role: "ADMIN", jobTitle: "admin" }), false);
  assert.equal(await scopedRequestAllowed(staff, "http://localhost/api/admin/export-audit", "POST"), false);
  assert.equal(await scopedRequestAllowed(staff, "http://localhost/api/admin/leads/export", "GET"), true);
  assert.equal(await scopedRequestAllowed(staff, "http://localhost/api/admin/deposits", "GET"), true);
  assert.equal(await scopedRequestAllowed(staff, "http://localhost/api/admin/withdrawals", "GET"), true);

  const audit = read("src/app/api/admin/export-audit/route.ts");
  assert.match(audit, /await requireAdmin\(\)/);
  assert.match(audit, /crmReadOnly/);
  assert.match(audit, /Exports disabled for read-only admins/);

  const leads = read("src/app/api/admin/leads/export/route.ts");
  assert.match(leads, /requireAdminWrite\(\)/);
  assert.match(leads, /scopeUserWhere\(admin, \{ role: "TRADER" \}\)/);

  const deposits = read("src/app/api/admin/deposits/route.ts");
  const withdrawals = read("src/app/api/admin/withdrawals/route.ts");
  assert.match(deposits, /export async function GET[\s\S]*await requireAdmin\(\)/);
  assert.match(withdrawals, /export async function GET[\s\S]*await requireAdmin\(\)/);
  const depositPost = deposits.slice(deposits.indexOf("export async function POST"));
  const withdrawalPost = withdrawals.slice(withdrawals.indexOf("export async function POST"));
  assert.match(depositPost, /requireAdminPerm\("canApproveDeposits"\)/);
  assert.match(withdrawalPost, /requireAdminPerm\("canApproveDeposits"\)/);
  assert.equal(depositPost.includes("moneyQueue"), false);
  assert.equal(withdrawalPost.includes("moneyQueue"), false);

  const scope = read("src/lib/crm-scope.ts");
  assert.match(scope, /export-audit/);
  const prisma = read("src/lib/prisma.ts");
  for (const model of ["DepositRequest", "WithdrawalRequest", "BalanceLedger", "Account", "Communication"]) {
    assert.match(prisma, new RegExp(`"${model}"`));
  }

  const gated = ["src/app/(admin)/izcrm/traders/page.tsx", "src/app/(admin)/izcrm/balance-requests/page.tsx"];
  for (const rel of gated) assert.match(read(rel), /\/api\/admin\/export-audit/);

  const clientCsv = [
    "src/components/crm/use-money-queue.ts",
    "src/app/(admin)/izcrm/summary/page.tsx",
    "src/app/(admin)/izcrm/tickets/page.tsx",
    "src/app/(admin)/izcrm/transactions/page.tsx",
    "src/app/(admin)/izcrm/communications/page.tsx",
    "src/app/(admin)/izcrm/uyelikler/page.tsx",
    "src/app/(admin)/izcrm/analytics/affiliates/page.tsx",
    "src/app/(admin)/izcrm/analytics/report/page.tsx",
  ];
  const ungated = clientCsv.filter((rel) => !read(rel).includes("/api/admin/export-audit"));
  console.log(
    "csv auth gaps (unchanged): read-only admins can download these client CSVs because they skip export-audit:",
    ungated.join(", ") || "none"
  );
  console.log("crm csv auth tests passed");
}

void main();
