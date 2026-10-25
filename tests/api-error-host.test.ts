/**
 * API error text stays generic, and login redirects follow X-Forwarded-Host.
 * Run: npx tsx tests/api-error-host.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { middleware } from "../src/middleware";
import { clientErrorMessage, publicErrorText } from "../src/lib/security/public-error";
import { isTrustedRedirectHost, locationForRequest } from "../src/lib/request-origin";

const ROOT = path.resolve(__dirname, "..");
const DOMAINS = [
  "7fx.customer.org.tr",
  "7fx.financeunit.co",
  "7fx.control.org.tr",
  "7fx.login.org.tr",
] as const;

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function headers(extra: Record<string, string>) {
  return {
    get(name: string) {
      const key = name.toLowerCase();
      for (const [k, v] of Object.entries(extra)) {
        if (k.toLowerCase() === key) return v;
      }
      return null;
    },
  };
}

function main() {
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
    publicErrorText(new Error("Unique constraint failed on the fields: (`email`)"), "Import failed"),
    "Import failed"
  );
  assert.equal(
    publicErrorText(
      new Error(
        "Authentication failed against database server at `127.0.0.1`, the provided database credentials for `sevenfx` are not valid."
      ),
      "Server error"
    ),
    "Server error"
  );
  assert.equal(
    publicErrorText(new Error("Can't reach database server at `127.0.0.1:3306`"), "Server error"),
    "Server error"
  );
  assert.equal(publicErrorText(new Error("connect ECONNREFUSED 127.0.0.1:3306"), "Order error"), "Order error");
  assert.equal(
    publicErrorText(new Error("The column `User.secret` does not exist in the current database."), "Server error"),
    "Server error"
  );
  assert.equal(
    publicErrorText(new Error("Invalid `prisma.user.create()` invocation:\n\nUnique constraint failed"), "Import failed"),
    "Import failed"
  );

  const logged: unknown[] = [];
  const orig = console.error;
  console.error = (...args: unknown[]) => {
    logged.push(args[0]);
  };
  try {
    assert.equal(
      clientErrorMessage("[orders]", new Error("Invalid symbol"), "Order error"),
      "Invalid symbol"
    );
    assert.equal(logged.length, 0);
    assert.equal(
      clientErrorMessage("[orders]", new Error("Unique constraint failed on the fields: (`email`)"), "Order error"),
      "Order error"
    );
    assert.deepEqual(logged, ["[orders]"]);
  } finally {
    console.error = orig;
  }

  const execute = read("src/lib/crm-import/execute.ts");
  assert.equal(execute.includes("e.message"), false);
  assert.match(execute, /Email already registered/);
  assert.match(execute, /Import failed/);
  const yahoo = read("src/lib/yahoo.ts");
  assert.equal(yahoo.includes("e.message"), false);
  assert.match(yahoo, /console\.error\("\[yahoo-ohlc\]"/);
  assert.match(yahoo, /console\.error\("\[yahoo-quote\]"/);
  assert.match(yahoo, /Quote unavailable/);

  const gate = read("src/middleware.ts");
  assert.equal(gate.includes('new URL("/login", req.url)'), false);
  assert.equal(gate.includes('new URL("/trade", req.url)'), false);
  assert.equal(gate.includes('new URL("/izcrm", req.url)'), false);
  assert.match(gate, /locationForRequest\(req, "\/login"\)/);
  assert.match(read("src/app/(auth)/login/page.tsx"), /locationForRequest\(/);

  for (const host of DOMAINS) {
    const internal = "http://127.0.0.1:3000/trade";
    const built = locationForRequest(
      {
        url: internal,
        headers: headers({
          "x-forwarded-host": host,
          "x-forwarded-proto": "https",
          host: "127.0.0.1:3000",
        }),
      },
      "/login"
    );
    assert.equal(built, `https://${host}/login`, host);

    const req = new NextRequest(internal, {
      headers: {
        "x-forwarded-host": host,
        "x-forwarded-proto": "https",
        host: "127.0.0.1:3000",
      },
    });
    assert.match(req.url, /localhost|127\.0\.0\.1/, `${host} req.url should stay internal`);
    const res = middleware(req);
    assert.equal(res.headers.get("location"), `https://${host}/login`, host);
  }

  const signedIn = new NextRequest("http://localhost:3000/login", {
    headers: {
      "x-forwarded-host": "7fx.financeunit.co",
      "x-forwarded-proto": "https",
      host: "localhost:3000",
      cookie: "7fx_session=present",
    },
  });
  assert.equal(middleware(signedIn).headers.get("location"), "https://7fx.financeunit.co/trade");

  const crm = new NextRequest("http://127.0.0.1:3000/izcrm", {
    headers: {
      "x-forwarded-host": "crm7fx.customer.org.tr",
      "x-forwarded-proto": "https",
      host: "127.0.0.1:3000",
    },
  });
  assert.equal(middleware(crm).headers.get("location"), "https://crm7fx.customer.org.tr/login");

  assert.equal(isTrustedRedirectHost("evil.com"), false);
  assert.equal(isTrustedRedirectHost("evil.vercel.app"), false);
  assert.equal(isTrustedRedirectHost("7fx-finance.vercel.app.evil.com"), false);
  assert.equal(isTrustedRedirectHost("7fx-finance.vercel.app"), true);
  assert.equal(isTrustedRedirectHost("7fx-finance-git-main-team.vercel.app"), true);
  assert.equal(isTrustedRedirectHost("localhost"), true);
  assert.equal(isTrustedRedirectHost("127.0.0.1"), true);

  const poisoned = {
    url: "http://127.0.0.1:3000/trade",
    headers: headers({
      "x-forwarded-host": "evil.com",
      "x-forwarded-proto": "https",
      host: "evil.com",
    }),
  };
  assert.equal(locationForRequest(poisoned, "/login"), "http://127.0.0.1:3000/login");
  assert.equal(locationForRequest(poisoned, "/login").includes("evil.com"), false);

  const preview = locationForRequest(
    {
      url: "http://127.0.0.1:3000/faq",
      headers: headers({
        "x-forwarded-host": "7fx-finance-git-main-team.vercel.app",
        "x-forwarded-proto": "https",
        host: "127.0.0.1:3000",
      }),
    },
    "/faq"
  );
  assert.equal(preview, "https://7fx-finance-git-main-team.vercel.app/faq");

  const evilPreview = locationForRequest(
    {
      url: "https://7fx.customer.org.tr/markets",
      headers: headers({
        "x-forwarded-host": "evil.vercel.app",
        "x-forwarded-proto": "https",
      }),
    },
    "/markets"
  );
  assert.equal(evilPreview, "https://7fx.customer.org.tr/markets");

  const evilReq = new NextRequest("http://127.0.0.1:3000/trade", {
    headers: {
      "x-forwarded-host": "evil.com",
      "x-forwarded-proto": "https",
      host: "evil.com",
    },
  });
  const evilLocation = evilReq && middleware(evilReq).headers.get("location");
  assert.equal(evilLocation?.includes("evil.com"), false);
  assert.match(String(evilLocation), /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/login$/);

  console.log("api-error-host tests passed");
}

main();
