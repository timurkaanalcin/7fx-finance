/**
 * Host and path rules for public indexing.
 * Run: npx tsx tests/seo-hosts.test.ts
 */
import assert from "node:assert/strict";
import {
  isIndexableHost,
  isMarketingPath,
  metadataOrigin,
  normalizeHost,
  shouldNoindex,
} from "../src/lib/seo-hosts";

function main() {
  assert.equal(normalizeHost("7FX.Customer.org.tr:443"), "7fx.customer.org.tr");
  assert.equal(normalizeHost("7fx.financeunit.co, proxy.internal"), "7fx.financeunit.co");
  assert.equal(normalizeHost(null), "");

  assert.equal(isIndexableHost("7fx.customer.org.tr"), true);
  assert.equal(isIndexableHost("7fx.financeunit.co"), true);
  for (const host of [
    "7fx.control.org.tr",
    "7fx.login.org.tr",
    "crm7fx.customer.org.tr",
    "localhost",
    "7fx-finance.vercel.app",
    "",
  ]) {
    assert.equal(isIndexableHost(host), false, host);
    assert.equal(shouldNoindex(host, "/"), true, host);
  }

  assert.equal(shouldNoindex("7fx.customer.org.tr", "/"), false);
  assert.equal(shouldNoindex("7fx.financeunit.co", "/ios"), false);
  assert.equal(shouldNoindex("7fx.financeunit.co", "/ios/"), false);
  for (const path of ["/trade", "/login", "/register", "/izcrm", "/api/auth/login", "/profile", "/admin"]) {
    assert.equal(shouldNoindex("7fx.customer.org.tr", path), true, path);
    assert.equal(isMarketingPath(path), false, path);
  }

  assert.equal(metadataOrigin("7fx.financeunit.co"), "https://7fx.financeunit.co");
  assert.equal(metadataOrigin("7fx.control.org.tr"), "https://7fx.control.org.tr");
  assert.equal(metadataOrigin("preview.example"), "https://7fx.customer.org.tr");

  console.log("seo-hosts tests passed");
}

main();
