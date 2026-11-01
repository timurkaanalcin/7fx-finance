/**
 * Redirect hosts follow APP_URL at runtime, including https://mfx.customer.org.tr.
 * Run: npx tsx tests/request-origin-env.test.ts
 */
import assert from "node:assert/strict";
import { mainSiteOrigin } from "../src/lib/crm-host";
import { isTrustedRedirectHost, locationForRequest, publicRequestOrigin } from "../src/lib/request-origin";
import { isAllowedApiOrigin } from "../src/lib/security/origins";
import { isIndexableHost, primaryOrigin } from "../src/lib/seo-hosts";
import { fallbackSiteOrigin } from "../src/lib/site-origin";

const KEYS = ["APP_URL", "MAIN_SITE_ORIGIN", "NEXT_PUBLIC_SITE_ORIGIN", "NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_APP_URL"] as const;

function withSiteEnv(values: Partial<Record<(typeof KEYS)[number], string>>, fn: () => void) {
  const prev = new Map<string, string | undefined>();
  for (const key of KEYS) prev.set(key, process.env[key]);
  for (const key of KEYS) delete process.env[key];
  for (const [key, value] of Object.entries(values)) {
    if (value) process.env[key] = value;
  }
  try {
    fn();
  } finally {
    for (const key of KEYS) {
      const old = prev.get(key);
      if (old === undefined) delete process.env[key];
      else process.env[key] = old;
    }
  }
}

function headers(map: Record<string, string>) {
  return { get: (name: string) => map[name.toLowerCase()] || null };
}

function main() {
  withSiteEnv({ APP_URL: "https://mfx.customer.org.tr" }, () => {
    assert.equal(fallbackSiteOrigin(), "https://mfx.customer.org.tr");
    assert.equal(primaryOrigin(), "https://mfx.customer.org.tr");
    assert.equal(mainSiteOrigin(), "https://mfx.customer.org.tr");
    assert.equal(isTrustedRedirectHost("mfx.customer.org.tr"), true);
    assert.equal(isTrustedRedirectHost("evil.com"), false);
    assert.equal(isTrustedRedirectHost("7fx.customer.org.tr"), true);
    assert.equal(isIndexableHost("mfx.customer.org.tr"), true);
    assert.equal(isAllowedApiOrigin("https://mfx.customer.org.tr"), true);
    assert.equal(isAllowedApiOrigin("https://evil.example"), false);

    const internal = locationForRequest(
      { url: "http://0.0.0.0:8080/izcrm", headers: headers({}) },
      "/login"
    );
    assert.equal(internal, "https://mfx.customer.org.tr/login");

    const sameHost = locationForRequest(
      {
        url: "http://127.0.0.1:3000/izcrm",
        headers: headers({
          "x-forwarded-host": "mfx.customer.org.tr",
          "x-forwarded-proto": "https",
          host: "127.0.0.1:3000",
        }),
      },
      "/izcrm"
    );
    assert.equal(sameHost, "https://mfx.customer.org.tr/izcrm");

    const bound = new Request("http://127.0.0.1:3000/api/auth/login", { headers: { host: "127.0.0.1:3000" } });
    assert.equal(publicRequestOrigin(bound), "https://mfx.customer.org.tr");
  });

  withSiteEnv({ MAIN_SITE_ORIGIN: "https://mfx.customer.org.tr", NEXT_PUBLIC_APP_URL: "https://7fx.customer.org.tr" }, () => {
    assert.equal(mainSiteOrigin(), "https://mfx.customer.org.tr");
    assert.equal(isTrustedRedirectHost("mfx.customer.org.tr"), true);
  });

  console.log("request-origin env tests passed");
}

main();
