/**
 * CRM v2 is an admin app on both /crmv2 and /izcrm/crmv2.
 * Signed-out visitors redirect like /izcrm. Live views do not ship sample rows.
 * Run: npx tsx tests/crmv2-route.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { middleware } from "../src/middleware";
import { approvalBody, approvalEndpoint, ledgerBody } from "../src/lib/crmv2/payload";
import { CRM_V2_COMING_SOON, CRM_V2_SECTIONS, crmv2Href } from "../src/lib/crmv2/sections";
import { crmv2Text } from "../src/lib/crmv2/copy";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function ask(pathname: string, opts?: { cookie?: string; host?: string }) {
  const host = opts?.host || "7fx.customer.org.tr";
  return middleware(
    new NextRequest(`https://${host}${pathname}`, {
      headers: {
        host,
        "x-forwarded-host": host,
        "x-forwarded-proto": "https",
        ...(opts?.cookie ? { cookie: opts.cookie } : {}),
      },
    })
  );
}

function main() {
  assert.equal(fs.existsSync(path.join(ROOT, "public/crmv2")), false);
  assert.equal(fs.existsSync(path.join(ROOT, "src/crmv2/index.html")), false);
  assert.equal(fs.existsSync(path.join(ROOT, "src/app/crmv2/route.ts")), false);

  const signedOut = ask("/crmv2");
  const izcrm = ask("/izcrm");
  assert.equal(signedOut.status, 307);
  assert.equal(signedOut.headers.get("location"), izcrm.headers.get("location"));
  assert.equal(ask("/crmv2/").status, 307);
  assert.equal(ask("/crmv2/").headers.get("location"), "https://7fx.customer.org.tr/login");
  assert.equal(ask("/izcrm/crmv2").status, 307);
  assert.equal(ask("/izcrm/crmv2/").status, 307);
  assert.equal(ask("/izcrm/crmv2/", { host: "crm7fx.customer.org.tr" }).headers.get("location"), "https://crm7fx.customer.org.tr/login");
  assert.equal(ask("/crmv2", { host: "crm7fx.customer.org.tr" }).headers.get("location"), "https://crm7fx.customer.org.tr/login");

  assert.equal(ask("/crmv2/", { cookie: "7fx_session=admin" }).headers.get("x-middleware-rewrite"), "https://7fx.customer.org.tr/crmv2");
  assert.equal(ask("/izcrm/crmv2/", { cookie: "7fx_session=admin" }).headers.get("x-middleware-rewrite"), "https://7fx.customer.org.tr/izcrm/crmv2");
  assert.equal(ask("/izcrm/traders/", { cookie: "7fx_session=admin" }).status, 308);

  const env = process.env as { NODE_ENV?: string };
  const prev = env.NODE_ENV;
  env.NODE_ENV = "production";
  try {
    for (const pathName of ["/crmv2", "/crmv2/", "/izcrm/crmv2", "/izcrm", "/izcrm/traders", "/"]) {
      const csp = ask(pathName, { cookie: "7fx_session=admin" }).headers.get("content-security-policy") || "";
      assert.equal(csp.includes("cdn.tailwindcss.com"), false, pathName);
      assert.equal(csp.includes("cdnjs.cloudflare.com"), false, pathName);
      assert.match(csp, /style-src 'self' 'unsafe-inline'/);
    }
  } finally {
    env.NODE_ENV = prev;
  }

  for (const file of ["src/app/crmv2/[[...section]]/page.tsx", "src/app/(admin)/izcrm/crmv2/[[...section]]/page.tsx"]) {
    const src = read(file);
    assert.match(src, /requireAdmin/);
    assert.match(src, /redirect\("\/login"\)/);
    assert.match(src, /CrmV2App/);
  }
  const layout = read("src/app/(admin)/izcrm/layout.tsx");
  assert.match(layout, /\/izcrm\/crmv2/);
  assert.match(layout, /AdminChrome/);

  const app = read("src/components/crmv2/CrmV2App.tsx");
  for (const sample of ["Murat Kaya", "Finance_Admin_01", "12,482", "$42.1M"]) {
    assert.equal(app.includes(sample), false, sample);
  }
  for (const section of CRM_V2_SECTIONS) assert.match(app, new RegExp(`view === "${section.id}"`));
  assert.match(app, /approvalBody/);
  assert.match(app, /ledgerBody/);
  assert.match(app, /aria-required=\{false\}/);
  assert.match(app, /sourceUserId/);
  assert.match(app, /data-coming-soon/);
  assert.match(app, /md:hidden/);
  assert.match(app, /font-normal/);

  const nav = read("src/lib/crm-nav.ts");
  assert.match(nav, /href: "\/izcrm", labelKey: "crm.nav.dashboard", exact: true/);
  assert.match(nav, /href: "\/izcrm\/traders"/);
  assert.match(nav, /href: "\/izcrm\/crmv2"/);

  assert.equal(crmv2Href("/crmv2", ""), "/crmv2");
  assert.equal(crmv2Href("/izcrm/crmv2", "customers", { q: "ada" }), "/izcrm/crmv2/customers?q=ada");
  assert.equal(crmv2Text("en", "overview"), "Overview");
  assert.equal(crmv2Text("tr", "customers"), "Müşteriler");
  assert.equal(crmv2Text("xx", "overview"), "Overview");
  assert.ok(CRM_V2_COMING_SOON.includes("campaignSend"));
  assert.ok(CRM_V2_COMING_SOON.includes("leadMapping"));

  const approved = approvalBody("d1", "approve", "   ");
  assert.deepEqual(approved, { id: "d1", action: "approve" });
  assert.equal("approvalReason" in approved, false);
  assert.equal(approvalBody("d1", "approve", "checked").approvalReason, "checked");
  assert.equal(approvalEndpoint("WITHDRAW"), "/api/admin/withdrawals");
  assert.equal(approvalEndpoint("MARGIN"), "/api/admin/balance-requests");
  assert.equal(approvalEndpoint("DEPOSIT"), "/api/admin/deposits");

  const noSource = ledgerBody({ type: "TRANSFER", amount: "10", sourceUserId: "  ", comment: "" });
  assert.equal("sourceUserId" in noSource, false);
  assert.equal("comment" in noSource, false);
  const withSource = ledgerBody({ type: "TRANSFER", amount: "10", sourceUserId: "src-1", comment: "move" });
  assert.equal(withSource.sourceUserId, "src-1");
  assert.equal(withSource.comment, "move");

  console.log("crmv2-route tests passed");
}

main();
