/**
 * Anonymous marketing HTML can sit on the CDN. Personalized HTML cannot.
 * Run: npx tsx tests/public-cache.test.ts
 */
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { middleware } from "../src/middleware";

function ask(path: string, cookie?: string, host = "7fx.customer.org.tr") {
  return middleware(
    new NextRequest(`http://127.0.0.1:3000${path}`, {
      headers: {
        "x-forwarded-host": host,
        "x-forwarded-proto": "https",
        host: "127.0.0.1:3000",
        ...(cookie ? { cookie } : {}),
      },
    })
  );
}

function main() {
  for (const path of ["/", "/markets", "/faq", "/platform", "/ios", "/markets/forex"]) {
    const res = ask(path);
    assert.equal(
      res.headers.get("cache-control"),
      "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      path
    );
    assert.match(String(res.headers.get("vary")), /Cookie/, path);
  }

  for (const cookie of ["fx_lang=tr", "fx_lang=en", "7fx_session=abc", "deskflow_session=abc", "7fx_impersonation=abc"]) {
    for (const path of ["/", "/markets", "/faq"]) {
      const res = ask(path, cookie);
      assert.equal(res.headers.get("cache-control"), "private, no-store", `${path} ${cookie}`);
      assert.equal(String(res.headers.get("cache-control")).includes("s-maxage"), false, cookie);
    }
  }

  assert.equal(ask("/login").headers.get("cache-control"), "private, no-store");
  assert.equal(ask("/trade").headers.get("cache-control"), "private, no-store");
  assert.equal(ask("/profile").headers.get("cache-control"), "private, no-store");
  assert.equal(ask("/izcrm").headers.get("cache-control"), "private, no-store");

  const otherHost = ask("/faq", undefined, "7fx.login.org.tr");
  assert.equal(otherHost.headers.get("cache-control"), "private, no-store");

  const finance = ask("/markets", undefined, "7fx.financeunit.co");
  assert.match(String(finance.headers.get("cache-control")), /s-maxage=3600/);

  console.log("public-cache tests passed");
}

main();
