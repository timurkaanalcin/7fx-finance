/**
 * Logout must expire every session-cookie variant (host-only, Domain=host,
 * Domain=registrable parent, COOKIE_DOMAIN) and send a form POST to /login.
 * Run: ./node_modules/.bin/tsx tests/logout-cookie.test.ts
 */
import assert from "node:assert/strict";

process.env.DATABASE_URL ||= "mysql://7fx:7fxlocal@127.0.0.1:3306/deskflow_trade";
process.env.AUTH_SECRET ||= "local-dev-auth-secret-not-for-production";

const HOSTS = [
  "7fx.customer.org.tr",
  "7fx.financeunit.co",
  "7fx.control.org.tr",
  "7fx.login.org.tr",
] as const;

function parents(host: string): string {
  if (host.endsWith(".org.tr")) return host.slice(host.indexOf(".") + 1);
  if (host.endsWith(".financeunit.co")) return "financeunit.co";
  throw new Error(host);
}

async function main() {
  const { cookieDomainsForHost, sessionClearCookieHeaders, SESSION_COOKIE_NAMES } = await import(
    "../src/lib/session-cookie"
  );
  const { POST } = await import("../src/app/api/auth/logout/route");

  assert.deepEqual(cookieDomainsForHost("localhost"), [""]);
  assert.deepEqual(cookieDomainsForHost("127.0.0.1"), [""]);

  const prevDomain = process.env.COOKIE_DOMAIN;
  delete process.env.COOKIE_DOMAIN;
  try {
    for (const host of HOSTS) {
      const domains = cookieDomainsForHost(host);
      assert.deepEqual(domains, ["", host, parents(host)]);
      const lines = sessionClearCookieHeaders(host, false);
      assert.equal(lines.length, SESSION_COOKIE_NAMES.length * domains.length);
      for (const name of SESSION_COOKIE_NAMES) {
        const mine = lines.filter((line) => line.startsWith(`${name}=`));
        assert.equal(mine.length, domains.length);
        for (const line of mine) {
          assert.match(line, /Path=\//);
          assert.match(line, /Max-Age=0/);
          assert.match(line, /Expires=Thu, 01 Jan 1970 00:00:00 GMT/);
          assert.match(line, /HttpOnly/);
          assert.match(line, /SameSite=Lax/);
          assert.equal(line.includes("Secure"), false);
        }
        assert.equal(
          mine.some((line) => line.includes("Domain=")),
          true
        );
        assert.ok(mine.some((line) => !/Domain=/.test(line)));
        assert.ok(mine.some((line) => line.includes(`Domain=${host}`)));
        assert.ok(mine.some((line) => line.includes(`Domain=${parents(host)}`)));
      }

      const secure = sessionClearCookieHeaders(host, true);
      assert.ok(secure.some((line) => line.startsWith("7fx_session=") && line.endsWith("Secure")));
      assert.ok(
        secure.some((line) => line.startsWith("7fx_session=") && line.includes(`Domain=${parents(host)}`) && !line.includes("Secure"))
      );
    }

    process.env.COOKIE_DOMAIN = ".sessions.example";
    const withEnv = cookieDomainsForHost("7fx.control.org.tr");
    assert.ok(withEnv.includes("sessions.example"));
    assert.ok(sessionClearCookieHeaders("7fx.control.org.tr", false).some((line) => line.includes("Domain=sessions.example")));
  } finally {
    if (prevDomain === undefined) delete process.env.COOKIE_DOMAIN;
    else process.env.COOKIE_DOMAIN = prevDomain;
  }

  const json = await POST(
    new Request("https://7fx.customer.org.tr/api/auth/logout", {
      method: "POST",
      headers: {
        host: "7fx.customer.org.tr",
        "content-type": "application/json",
        "x-forwarded-proto": "https",
      },
      body: "{}",
    })
  );
  assert.equal(json.status, 200);
  assert.equal(json.headers.get("cache-control"), "private, no-store");
  const setCookies = json.headers.getSetCookie();
  assert.ok(setCookies.length >= 9);
  assert.ok(setCookies.some((line) => line.startsWith("7fx_session=") && !line.includes("Domain=") && line.includes("Max-Age=0")));
  assert.ok(setCookies.some((line) => line.includes("Domain=7fx.customer.org.tr") && line.startsWith("7fx_session=")));
  assert.ok(setCookies.some((line) => line.includes("Domain=customer.org.tr") && line.startsWith("deskflow_session=")));
  assert.ok(setCookies.some((line) => line.startsWith("7fx_admin_backup=") && line.includes("Expires=Thu, 01 Jan 1970 00:00:00 GMT")));
  assert.ok(setCookies.some((line) => line.startsWith("7fx_impersonation=") && !line.includes("Domain=") && line.includes("Max-Age=0")));
  assert.ok(setCookies.some((line) => line.startsWith("7fx_impersonation=") && line.includes("Domain=customer.org.tr")));
  const body = await json.json();
  assert.equal(body.ok, true);

  const form = await POST(
    new Request("https://7fx.financeunit.co/api/auth/logout", {
      method: "POST",
      headers: {
        host: "7fx.financeunit.co",
        "content-type": "application/x-www-form-urlencoded",
        "x-forwarded-proto": "https",
      },
      body: "nav=1",
    })
  );
  assert.equal(form.status, 303);
  assert.equal(form.headers.get("location"), "https://7fx.financeunit.co/login");
  const formCookies = form.headers.getSetCookie();
  assert.ok(formCookies.some((line) => line.startsWith("7fx_session=") && line.includes("Domain=financeunit.co") && line.includes("Max-Age=0")));
  assert.ok(formCookies.some((line) => line.startsWith("7fx_admin_backup=") && line.includes("Domain=7fx.financeunit.co")));

  const crm = await POST(
    new Request("https://crm7fx.customer.org.tr/api/auth/logout", {
      method: "POST",
      headers: {
        host: "crm7fx.customer.org.tr",
        "content-type": "application/x-www-form-urlencoded",
        "x-forwarded-proto": "https",
      },
      body: "nav=1",
    })
  );
  assert.equal(crm.status, 303);
  assert.equal(crm.headers.get("location"), "https://crm7fx.customer.org.tr/login");
  assert.ok(
    crm.headers.getSetCookie().some((line) => line.startsWith("7fx_session=") && line.includes("Domain=customer.org.tr"))
  );

  console.log("logout-cookie.test.ts ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
