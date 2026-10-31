/**
 * CRM v3 is an additive admin app on /crmv3 and /izcrm/crmv3.
 * It keeps v2 data helpers, optional approval reason, and optional source account.
 * Run: npx tsx tests/crmv3-route.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { middleware } from "../src/middleware";
import { approvalBody, ledgerBody } from "../src/lib/crmv2/payload";
import { CRM_V3_COMING_SOON, CRM_V3_SECTIONS, crmv3Href } from "../src/lib/crmv3/sections";
import { crmv3Text } from "../src/lib/crmv3/copy";

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
  assert.equal(fs.existsSync(path.join(ROOT, "public/crmv3")), false);
  assert.equal(fs.existsSync(path.join(ROOT, "src/app/crmv3/route.ts")), false);

  const signedOut = ask("/crmv3");
  const izcrm = ask("/izcrm");
  assert.equal(signedOut.status, 307);
  assert.equal(signedOut.headers.get("location"), izcrm.headers.get("location"));
  assert.equal(ask("/crmv3/").status, 307);
  assert.equal(ask("/crmv3/").headers.get("location"), "https://7fx.customer.org.tr/login");
  assert.equal(ask("/izcrm/crmv3").status, 307);
  assert.equal(ask("/izcrm/crmv3/").status, 307);
  assert.equal(ask("/izcrm/crmv3/", { host: "crm7fx.customer.org.tr" }).headers.get("location"), "https://crm7fx.customer.org.tr/login");
  assert.equal(ask("/crmv3", { host: "7fx.financeunit.co" }).headers.get("location"), "https://7fx.financeunit.co/login");

  assert.equal(ask("/crmv3/", { cookie: "7fx_session=admin" }).headers.get("x-middleware-rewrite"), "https://7fx.customer.org.tr/crmv3");
  assert.equal(ask("/izcrm/crmv3/", { cookie: "7fx_session=admin" }).headers.get("x-middleware-rewrite"), "https://7fx.customer.org.tr/izcrm/crmv3");

  const env = process.env as { NODE_ENV?: string };
  const prev = env.NODE_ENV;
  env.NODE_ENV = "production";
  try {
    for (const pathName of ["/crmv3", "/crmv3/", "/izcrm/crmv3"]) {
      const csp = ask(pathName, { cookie: "7fx_session=admin" }).headers.get("content-security-policy") || "";
      assert.equal(csp.includes("cdn.tailwindcss.com"), false, pathName);
      assert.match(csp, /style-src 'self' 'unsafe-inline'/);
    }
  } finally {
    env.NODE_ENV = prev;
  }

  for (const file of ["src/app/crmv3/[[...section]]/page.tsx", "src/app/(admin)/izcrm/crmv3/[[...section]]/page.tsx"]) {
    const src = read(file);
    assert.match(src, /requireAdmin/);
    assert.match(src, /redirect\("\/login"\)/);
    assert.match(src, /CrmV3App/);
  }

  const layout = read("src/app/(admin)/izcrm/layout.tsx");
  assert.match(layout, /\/izcrm\/crmv2/);
  assert.match(layout, /\/izcrm\/crmv3/);

  const v2 = readTree("src/components/crmv2");
  assert.equal(v2.includes("crmv3"), false);
  assert.equal(v2.includes("data-crmv3-root"), false);

  const app = readTree("src/components/crmv3");
  for (const sample of ["Murat Kaya", "Finance_Admin_01", "12,482", "$42.1M"]) {
    assert.equal(app.includes(sample), false, sample);
  }
  for (const section of CRM_V3_SECTIONS) assert.match(app, new RegExp(`view === "${section.id}"`));
  assert.match(app, /approvalBody/);
  assert.match(app, /ledgerBody/);
  assert.match(app, /aria-required=\{false\}/);
  assert.match(app, /sourceUserId/);
  assert.match(app, /data-coming-soon/);
  assert.match(app, /leadStatusMapping/);
  assert.match(app, /c3-tabs/);
  assert.match(app, /c3-fab/);
  assert.match(app, /SwipeRow/);
  assert.match(app, /font-normal/);
  assert.match(read("src/lib/auth.ts"), /\/crmv3/);

  const nav = read("src/lib/crm-nav.ts");
  assert.match(nav, /href: "\/izcrm\/crmv2"/);
  assert.match(nav, /href: "\/izcrm\/crmv3", labelKey: "crm.nav.crmv3"/);
  for (const loc of ["en", "tr", "de", "ru", "ar"]) {
    assert.match(read(`src/lib/i18n/dictionaries/${loc}.ts`), /"crm\.nav\.crmv3": "CRM v3"/);
  }

  assert.equal(crmv3Href("/crmv3", ""), "/crmv3");
  assert.equal(crmv3Href("/izcrm/crmv3", "customers", { q: "ada" }), "/izcrm/crmv3/customers?q=ada");
  assert.equal(crmv3Text("en", "money"), "Money");
  assert.equal(crmv3Text("tr", "money"), "Para");
  assert.equal(crmv3Text("xx", "money"), "Money");
  assert.deepEqual([...CRM_V3_COMING_SOON], ["campaignSend"]);

  const approved = approvalBody("d1", "approve", "   ");
  assert.equal("approvalReason" in approved, false);
  const noSource = ledgerBody({ type: "TRANSFER", amount: "10", sourceUserId: "  ", comment: "" });
  assert.equal("sourceUserId" in noSource, false);

  console.log("crmv3-route tests passed");
}

main();
