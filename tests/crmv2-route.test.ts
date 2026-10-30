/**
 * /crmv2 is admin-only HTML. Signed-out visitors redirect like /izcrm.
 * An admin (mocked) receives the dashboard document.
 * Run: npx tsx tests/crmv2-route.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { NextRequest } from "next/server";
import { middleware } from "../src/middleware";
import { crmv2Response } from "../src/crmv2/respond";

const require = createRequire(import.meta.url);
const headers = require("../src/lib/security/response-headers.cjs") as {
  contentSecurityPolicy: (opts: { https: boolean; dev: boolean; crmv2?: boolean }) => string;
  staticSecurityHeaders: () => { key: string; value: string }[];
};

const ROOT = path.resolve(__dirname, "..");
const HTML = fs.readFileSync(path.join(ROOT, "src/crmv2/index.html"), "utf8");

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

async function main() {
  assert.equal(fs.existsSync(path.join(ROOT, "public/crmv2")), false);
  assert.equal(fs.existsSync(path.join(ROOT, "public/crmv2/index.html")), false);
  assert.match(HTML, /12,482/);
  assert.match(HTML, /Murat Kaya/);
  assert.match(HTML, /Finance_Admin_01/);
  assert.match(HTML, /href="\/crmv2"/);
  assert.match(HTML, /action="\/api\/auth\/logout"/);
  assert.match(HTML, /name="nav" value="1"/);
  assert.equal(HTML.includes('href="/api/auth/logout"'), false);
  const otherHrefs = HTML.match(/href="#"/g) || [];
  assert.equal(otherHrefs.length, 5);

  const signedOut = ask("/crmv2");
  const izcrm = ask("/izcrm");
  assert.equal(signedOut.status, 307);
  assert.equal(signedOut.status, izcrm.status);
  assert.equal(signedOut.headers.get("location"), "https://7fx.customer.org.tr/login");
  assert.equal(signedOut.headers.get("location"), izcrm.headers.get("location"));

  const slash = ask("/crmv2/");
  assert.equal(slash.status, 307);
  assert.equal(slash.headers.get("location"), "https://7fx.customer.org.tr/login");

  const faqSlash = ask("/faq/");
  assert.equal(faqSlash.status, 308);
  assert.equal(faqSlash.headers.get("location"), "https://7fx.customer.org.tr/faq");

  const crmHost = ask("/crmv2", { host: "crm7fx.customer.org.tr" });
  const crmIz = ask("/izcrm", { host: "crm7fx.customer.org.tr" });
  assert.equal(crmHost.status, 307);
  assert.equal(crmHost.headers.get("location"), crmIz.headers.get("location"));
  assert.equal(crmHost.headers.get("location"), "https://crm7fx.customer.org.tr/login");

  const trader = ask("/crmv2", { cookie: "7fx_session=trader-token" });
  assert.equal(trader.headers.get("x-middleware-next"), "1");
  const adminCookie = ask("/crmv2/", { cookie: "7fx_session=admin-token" });
  assert.equal(adminCookie.headers.get("x-middleware-rewrite"), "https://7fx.customer.org.tr/crmv2");

  const env = process.env as { NODE_ENV?: string };
  const prev = env.NODE_ENV;
  env.NODE_ENV = "production";
  try {
    const open = ask("/izcrm", { cookie: "7fx_session=admin-token" }).headers.get("content-security-policy") || "";
    const gated = ask("/crmv2", { cookie: "7fx_session=admin-token" }).headers.get("content-security-policy") || "";
    const slashCsp = ask("/crmv2/", { cookie: "7fx_session=admin-token" }).headers.get("content-security-policy") || "";
    assert.equal(open.includes("cdn.tailwindcss.com"), false);
    assert.equal(open.includes("cdnjs.cloudflare.com"), false);
    assert.equal(open.includes("unsafe-eval"), false);
    assert.match(open, /style-src 'self' 'unsafe-inline'/);
    for (const csp of [gated, slashCsp]) {
      assert.match(csp, /script-src 'self' 'unsafe-inline' 'unsafe-eval' https:\/\/cdn\.tailwindcss\.com/);
      assert.match(csp, /style-src 'self' 'unsafe-inline' https:\/\/cdnjs\.cloudflare\.com/);
      assert.match(csp, /font-src 'self' data: https:\/\/cdnjs\.cloudflare\.com/);
    }
    const home = ask("/").headers.get("content-security-policy") || "";
    assert.equal(home.includes("cdn.tailwindcss.com"), false);
    assert.equal(home.includes("cdnjs.cloudflare.com"), false);
  } finally {
    env.NODE_ENV = prev;
  }

  const strict = headers.contentSecurityPolicy({ https: true, dev: false });
  const loose = headers.contentSecurityPolicy({ https: true, dev: false, crmv2: true });
  assert.equal(strict.includes("cdn.tailwindcss.com"), false);
  assert.equal(strict.includes("cdnjs.cloudflare.com"), false);
  assert.match(loose, /https:\/\/cdn\.tailwindcss\.com/);
  assert.match(loose, /https:\/\/cdnjs\.cloudflare\.com/);
  assert.match(loose, /unsafe-inline/);
  const staticCsp = headers.staticSecurityHeaders().find((h) => h.key === "Content-Security-Policy")?.value || "";
  assert.equal(staticCsp.includes("cdn.tailwindcss.com"), false);

  const req = new Request("https://7fx.customer.org.tr/crmv2", {
    headers: { host: "7fx.customer.org.tr", "x-forwarded-host": "7fx.customer.org.tr", "x-forwarded-proto": "https" },
  });
  const denied = await crmv2Response(req, async () => null);
  assert.equal(denied.status, 307);
  assert.equal(denied.headers.get("location"), "https://7fx.customer.org.tr/login");

  const notAdmin = await crmv2Response(req, async () => ({ role: "TRADER" }));
  assert.equal(notAdmin.status, 307);
  assert.equal(notAdmin.headers.get("location"), "https://7fx.customer.org.tr/login");

  const routeSrc = fs.readFileSync(path.join(ROOT, "src/app/crmv2/route.ts"), "utf8");
  assert.match(routeSrc, /crmv2Response\(req, requireAdmin\)/);
  assert.match(routeSrc, /from "@\/lib\/auth"/);

  const ok = await crmv2Response(req, async () => ({ role: "ADMIN" }));
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get("content-type"), "text/html; charset=utf-8");
  assert.equal(ok.headers.get("cache-control"), "private, no-store");
  assert.equal(await ok.text(), HTML);

  console.log("crmv2-route tests passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
