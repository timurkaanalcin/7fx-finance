/**
 * CRM v4 is an additive admin app on /crmv4 and /izcrm/crmv4.
 * It keeps v2 data helpers, optional approval reason, and optional source account.
 * Run: npx tsx tests/crmv4-route.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { middleware } from "../src/middleware";
import { approvalBody, ledgerBody } from "../src/lib/crmv2/payload";
import { CRM_V4_COMING_SOON, CRM_V4_SECTIONS, crmv4Href } from "../src/lib/crmv4/sections";
import { crmv4Text } from "../src/lib/crmv4/copy";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function readTree(rel: string): string {
  const dir = path.join(ROOT, rel);
  const files: string[] = [];
  const walk = (current: string) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const next = path.join(current, entry.name);
      if (entry.isDirectory()) walk(next);
      else if (/\.(tsx|ts|css)$/.test(entry.name)) files.push(fs.readFileSync(next, "utf8"));
    }
  };
  walk(dir);
  return files.join("\n");
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
  assert.equal(fs.existsSync(path.join(ROOT, "public/crmv4")), false);
  assert.equal(fs.existsSync(path.join(ROOT, "src/app/crmv4/route.ts")), false);

  const signedOut = ask("/crmv4");
  const izcrm = ask("/izcrm");
  assert.equal(signedOut.status, 307);
  assert.equal(izcrm.headers.get("location"), "https://7fx.customer.org.tr/login");
  assert.equal(signedOut.headers.get("location"), "https://7fx.customer.org.tr/login?desk=crmv4");
  assert.equal(ask("/crmv4/").status, 307);
  assert.equal(ask("/crmv4/").headers.get("location"), "https://7fx.customer.org.tr/login?desk=crmv4");
  assert.equal(ask("/izcrm/crmv4").status, 307);
  assert.equal(ask("/izcrm/crmv4/").status, 307);
  assert.equal(ask("/izcrm/crmv4/", { host: "crm7fx.customer.org.tr" }).headers.get("location"), "https://crm7fx.customer.org.tr/login?desk=crmv4");
  assert.equal(ask("/crmv4", { host: "7fx.financeunit.co" }).headers.get("location"), "https://7fx.financeunit.co/login?desk=crmv4");

  assert.equal(ask("/crmv4/", { cookie: "7fx_session=admin" }).headers.get("x-middleware-rewrite"), "https://7fx.customer.org.tr/crmv4");
  assert.equal(ask("/izcrm/crmv4/", { cookie: "7fx_session=admin" }).headers.get("x-middleware-rewrite"), "https://7fx.customer.org.tr/izcrm/crmv4");

  const env = process.env as { NODE_ENV?: string };
  const prev = env.NODE_ENV;
  env.NODE_ENV = "production";
  try {
    for (const pathName of ["/crmv4", "/crmv4/", "/izcrm/crmv4"]) {
      const csp = ask(pathName, { cookie: "7fx_session=admin" }).headers.get("content-security-policy") || "";
      assert.equal(csp.includes("cdn.tailwindcss.com"), false, pathName);
      assert.match(csp, /style-src 'self' 'unsafe-inline'/);
    }
  } finally {
    env.NODE_ENV = prev;
  }

  for (const file of ["src/app/crmv4/[[...section]]/page.tsx", "src/app/(admin)/izcrm/crmv4/[[...section]]/page.tsx"]) {
    const src = read(file);
    assert.match(src, /requireAdmin/);
    assert.match(src, /redirect\("\/login\?desk=crmv4"\)/);
    assert.match(src, /CrmV4App/);
  }

  const layout = read("src/app/(admin)/izcrm/layout.tsx");
  assert.match(layout, /\/izcrm\/crmv2/);
  assert.match(layout, /\/izcrm\/crmv3/);
  assert.match(layout, /\/izcrm\/crmv4/);

  const v2 = readTree("src/components/crmv2");
  assert.equal(v2.includes("crmv4"), false);
  assert.equal(v2.includes("data-crmv4-root"), false);
  const v3 = readTree("src/components/crmv3");
  assert.equal(v3.includes("crmv4"), false);

  const app = readTree("src/components/crmv4");
  for (const sample of ["Murat Kaya", "Finance_Admin_01", "12,482", "$42.1M"]) {
    assert.equal(app.includes(sample), false, sample);
  }
  for (const section of CRM_V4_SECTIONS) assert.match(app, new RegExp(`view === "${section.id}"`));
  assert.match(app, /approvalBody/);
  assert.match(app, /ledgerBody/);
  assert.match(app, /aria-required=\{false\}/);
  assert.match(app, /sourceUserId/);
  assert.match(app, /data-coming-soon/);
  assert.match(app, /leadStatusMapping/);
  assert.match(app, /c4-tabs/);
  assert.match(app, /c4-rail/);
  assert.match(app, /c4-drawer/);
  assert.match(app, /SwipeRow/);
  assert.match(app, /font-normal/);
  assert.match(app, /crmv4-customer-presets/);
  assert.match(app, /crmv4-scratch-notes/);
  assert.match(read("src/lib/auth.ts"), /\/crmv4/);

  const nav = read("src/lib/crm-nav.ts");
  assert.match(nav, /href: "\/izcrm\/crmv2"/);
  assert.match(nav, /href: "\/izcrm\/crmv3", labelKey: "crm.nav.crmv3"/);
  assert.match(nav, /href: "\/izcrm\/crmv4", labelKey: "crm.nav.crmv4"/);
  for (const loc of ["en", "tr", "de", "ru", "ar"]) {
    assert.match(read(`src/lib/i18n/dictionaries/${loc}.ts`), /"crm\.nav\.crmv4": "CRM v4"/);
  }

  assert.equal(crmv4Href("/crmv4", ""), "/crmv4");
  assert.equal(crmv4Href("/izcrm/crmv4", "customers", { q: "ada" }), "/izcrm/crmv4/customers?q=ada");
  assert.equal(crmv4Text("en", "financeNav"), "Finance");
  assert.equal(crmv4Text("tr", "financeNav"), "Finans");
  assert.equal(crmv4Text("xx", "financeNav"), "Finance");
  assert.deepEqual([...CRM_V4_COMING_SOON], ["campaignSend"]);

  const approved = approvalBody("d1", "approve", "   ");
  assert.equal("approvalReason" in approved, false);
  const noSource = ledgerBody({ type: "TRANSFER", amount: "10", sourceUserId: "  ", comment: "" });
  assert.equal("sourceUserId" in noSource, false);

  console.log("crmv4-route tests passed");
}

main();
