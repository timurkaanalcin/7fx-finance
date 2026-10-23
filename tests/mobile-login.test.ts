/**
 * Mobile sign-in: same-host redirects, origin allowlist, and the terminal
 * blackout that must not latch while the page is still visible.
 * Run: ./node_modules/.bin/tsx tests/mobile-login.test.ts
 */
import assert from "node:assert/strict";
import { isDocumentNav, loginLandingPath, navRedirect, readAuthBody } from "../src/lib/auth-nav";
import { publicAbsoluteUrl, publicRequestOrigin } from "../src/lib/request-origin";
import { isAllowedApiOrigin } from "../src/lib/security/origins";
import { shouldCoverForCapture } from "../src/lib/security/screenshot-cover";

function req(url: string, headers: Record<string, string>, body?: BodyInit) {
  return new Request(url, { method: "POST", headers, body });
}

async function main() {
  assert.equal(shouldCoverForCapture({ reason: "blur", visibilityState: "visible" }), false);
  assert.equal(shouldCoverForCapture({ reason: "pagehide", visibilityState: "visible" }), false);
  assert.equal(shouldCoverForCapture({ reason: "visibility", visibilityState: "visible" }), false);
  assert.equal(shouldCoverForCapture({ reason: "blur", visibilityState: "hidden" }), true);
  assert.equal(shouldCoverForCapture({ reason: "pagehide", visibilityState: "hidden" }), true);
  assert.equal(shouldCoverForCapture({ reason: "visibility", visibilityState: "prerender" }), true);
  assert.equal(shouldCoverForCapture({ reason: "print", visibilityState: "visible" }), true);
  assert.equal(shouldCoverForCapture({ reason: "key", visibilityState: "visible" }), true);

  const prevApp = process.env.NEXT_PUBLIC_APP_URL;
  process.env.NEXT_PUBLIC_APP_URL = "https://7fx.financeunit.co";
  try {
    const customer = req("http://127.0.0.1:3000/api/auth/login", {
      "x-forwarded-host": "7fx.customer.org.tr",
      "x-forwarded-proto": "https",
      host: "127.0.0.1:3000",
    });
    assert.equal(publicRequestOrigin(customer), "https://7fx.customer.org.tr");
    assert.equal(publicAbsoluteUrl(customer, "/trade"), "https://7fx.customer.org.tr/trade");

    for (const host of [
      "7fx.financeunit.co",
      "7fx.control.org.tr",
      "7fx.login.org.tr",
    ]) {
      const r = req("http://127.0.0.1:3000/api/auth/login", {
        "x-forwarded-host": host,
        "x-forwarded-proto": "https",
      });
      assert.equal(publicRequestOrigin(r), `https://${host}`);
      const jump = navRedirect(r, "/izcrm");
      assert.equal(jump.status, 303);
      assert.equal(jump.headers.get("location"), `https://${host}/izcrm`);
    }

    const internal = req("http://127.0.0.1:3000/api/auth/login", { host: "127.0.0.1:3000" });
    assert.equal(publicRequestOrigin(internal), "https://7fx.financeunit.co");
  } finally {
    if (prevApp === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = prevApp;
  }

  const trader = req("https://7fx.customer.org.tr/api/auth/login", {
    host: "7fx.customer.org.tr",
    "x-forwarded-proto": "https",
  });
  assert.equal(loginLandingPath(trader, { role: "TRADER" }), "/trade");
  assert.equal(loginLandingPath(trader, { role: "ADMIN", crmReadOnly: true }), "/trade");
  assert.equal(loginLandingPath(trader, { role: "ADMIN", crmReadOnly: false }), "/izcrm");

  const crm = req("https://crm7fx.customer.org.tr/api/auth/login", {
    host: "crm7fx.customer.org.tr",
  });
  assert.equal(loginLandingPath(crm, { role: "TRADER" }), "https://7fx.customer.org.tr/trade");
  assert.equal(loginLandingPath(crm, { role: "ADMIN" }), "/izcrm");

  const form = req(
    "https://7fx.financeunit.co/api/auth/login",
    { "content-type": "application/x-www-form-urlencoded", host: "7fx.financeunit.co" },
    "email=a%40b.co&password=secret&nav=1"
  );
  assert.equal(isDocumentNav(form, {}), true);
  const parsed = await readAuthBody(form.clone());
  assert.equal(parsed.email, "a@b.co");
  assert.equal(parsed.password, "secret");
  assert.equal(parsed.nav, "1");

  const json = req(
    "https://7fx.financeunit.co/api/auth/login",
    { "content-type": "application/json", host: "7fx.financeunit.co" },
    JSON.stringify({ email: "a@b.co", password: "secret" })
  );
  assert.equal(isDocumentNav(json, {}), false);
  assert.equal(isDocumentNav(json, { nav: "1" }), true);

  for (const origin of [
    "https://7fx.customer.org.tr",
    "https://7fx.financeunit.co",
    "https://7fx.control.org.tr",
    "https://7fx.login.org.tr",
    null,
    "null",
    "capacitor://localhost",
  ]) {
    assert.equal(isAllowedApiOrigin(origin), true, String(origin));
  }
  assert.equal(isAllowedApiOrigin("https://evil.example"), false);

  console.log("mobile-login tests ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
