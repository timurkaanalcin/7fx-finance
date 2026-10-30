/**
 * Marketing HTML is private. Vercel does not key the CDN on Cookie, and a
 * stored s-maxage document would be reused for later requests to the same URL.
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
  const privateHeader = "private, no-store";
  for (const path of ["/", "/markets", "/faq", "/platform", "/ios", "/licenses", "/markets/forex"]) {
    const res = ask(path);
    assert.equal(res.headers.get("cache-control"), privateHeader, path);
    assert.equal(String(res.headers.get("cache-control")).includes("s-maxage"), false, path);
    assert.equal(res.headers.get("vary"), null, path);
  }

  for (const cookie of [
    "fx_lang=tr",
    "fx_lang=en",
    "7fx_session=abc",
    "deskflow_session=abc",
    "7fx_impersonation=abc",
    "unrelated=1",
  ]) {
    for (const path of ["/", "/markets", "/faq"]) {
      const res = ask(path, cookie);
      assert.equal(res.headers.get("cache-control"), privateHeader, `${path} ${cookie}`);
      assert.equal(String(res.headers.get("cache-control")).includes("s-maxage"), false, cookie);
    }
  }

  assert.equal(ask("/login").headers.get("cache-control"), privateHeader);
  assert.equal(ask("/trade").headers.get("cache-control"), privateHeader);
  assert.equal(ask("/profile").headers.get("cache-control"), privateHeader);
  assert.equal(ask("/izcrm").headers.get("cache-control"), privateHeader);

  const otherHost = ask("/faq", undefined, "7fx.login.org.tr");
  assert.equal(otherHost.headers.get("cache-control"), privateHeader);

  const finance = ask("/markets", undefined, "7fx.financeunit.co");
  assert.equal(finance.headers.get("cache-control"), privateHeader);

  console.log("public-cache tests passed");
}

main();
