/**
 * Security headers and API error hygiene.
 * Run: npx tsx tests/security-headers.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { publicErrorText } from "../src/lib/security/public-error";

const require = createRequire(import.meta.url);
const headers = require("../src/lib/security/response-headers.cjs") as {
  PERMISSIONS_POLICY: string;
  HSTS_VALUE: string;
  FRAME_OPTIONS: string;
  contentSecurityPolicy: (opts: { https: boolean; dev: boolean }) => string;
  requestIsHttps: (forwarded: string | null, protocol: string) => boolean;
  staticSecurityHeaders: () => { key: string; value: string }[];
};

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function main() {
  assert.equal(headers.FRAME_OPTIONS, "DENY");
  assert.equal(headers.requestIsHttps("https", "http:"), true);
  assert.equal(headers.requestIsHttps("http", "http:"), false);
  assert.equal(headers.requestIsHttps(null, "https:"), true);
  const httpCsp = headers.contentSecurityPolicy({ https: false, dev: false });
  const httpsCsp = headers.contentSecurityPolicy({ https: true, dev: false });
  assert.match(httpCsp, /frame-ancestors 'none'/);
  assert.equal(httpCsp.includes("upgrade-insecure-requests"), false);
  assert.match(httpsCsp, /upgrade-insecure-requests/);
  assert.equal(httpsCsp.includes("unsafe-eval"), false);
  assert.match(headers.contentSecurityPolicy({ https: false, dev: true }), /unsafe-eval/);
  const staticHeaders = headers.staticSecurityHeaders();
  for (const key of ["X-Frame-Options", "Referrer-Policy", "Permissions-Policy", "Content-Security-Policy", "Strict-Transport-Security"]) {
    assert.ok(staticHeaders.some((h) => h.key === key), key);
  }
  assert.equal(staticHeaders.find((h) => h.key === "Strict-Transport-Security")?.value, headers.HSTS_VALUE);
  assert.match(headers.PERMISSIONS_POLICY, /camera=\(\)/);
  assert.match(headers.PERMISSIONS_POLICY, /payment=\(\)/);
  assert.match(headers.PERMISSIONS_POLICY, /usb=\(\)/);

  const middleware = read("src/middleware.ts");
  assert.match(middleware, /X-Frame-Options", "DENY"/);
  assert.match(middleware, /Referrer-Policy", "strict-origin-when-cross-origin"/);
  assert.match(middleware, /frame-ancestors 'none'/);
  assert.match(middleware, /Strict-Transport-Security", HSTS_VALUE/);
  assert.match(middleware, /Permissions-Policy", PERMISSIONS_POLICY/);
  assert.equal(middleware.includes("Content-Security-Policy-Report-Only"), false);

  const config = read("next.config.mjs");
  assert.match(config, /staticSecurityHeaders\(\)/);
  assert.match(config, /_next\/static/);

  const server = read("server.js");
  assert.match(server, /applyNodeSecurityHeaders/);
  assert.equal(server.includes("SAMEORIGIN"), false);
  assert.equal(server.includes("internal server error"), true);

  assert.equal(publicErrorText(new Error("Invalid symbol"), "Order error"), "Invalid symbol");
  assert.equal(publicErrorText(new Error("Yetersiz serbest marj"), "Order error"), "Yetersiz serbest marj");
  assert.equal(
    publicErrorText(new Error("Password must be at least 8 characters"), "Invalid request"),
    "Password must be at least 8 characters"
  );
  assert.equal(
    publicErrorText(new Error("The main ADMIN_EMAIL account cannot be deleted"), "Invalid request"),
    "The main ADMIN_EMAIL account cannot be deleted"
  );
  assert.equal(
    publicErrorText(new Error("connect ECONNREFUSED mysql://sevenfx:sevenfx@127.0.0.1:3306/sevenfx"), "Order error"),
    "Order error"
  );
  assert.equal(publicErrorText(new Error("Missing AUTH_SECRET"), "Server error"), "Server error");
  assert.equal(
    publicErrorText(new Error("Invalid `prisma.order.create()` invocation"), "Order error"),
    "Order error"
  );
  assert.equal(publicErrorText(new Error("boom\n    at placeOrder (/workspace/src/lib/trading.ts:10:1)"), "Order error"), "Order error");
  assert.equal(publicErrorText("not-an-error", "Quote fetch failed"), "not-an-error");
  assert.equal(publicErrorText(undefined, "Quote fetch failed"), "Quote fetch failed");

  const orders = read("src/app/api/orders/route.ts");
  assert.match(orders, /clientErrorMessage\("\[orders\]", e, "Order error"\)/);
  assert.equal(orders.includes("e.message"), false);
  assert.match(read("src/app/api/auth/login/route.ts"), /Sign-in error/);
  assert.equal(read("src/app/api/auth/login/route.ts").includes("publicErrorText"), false);
  assert.equal(read("src/app/api/auth/login/route.ts").includes("clientErrorMessage"), false);

  console.log("security-headers tests passed");
}

main();
