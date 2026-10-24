/**
 * Public default is English. A stored locale code still resolves.
 * Run: npx tsx tests/public-default.test.ts
 */
import assert from "node:assert/strict";
import { translate } from "../src/lib/i18n/dictionaries";
import { PUBLIC_DEFAULT_LOCALE, defaultLocaleFor, normalizeLocale } from "../src/lib/i18n/locales";
import { DESCRIPTION, IOS_TITLE, OG_ALT, TITLE, marketingMetadata, organizationJsonLd } from "../src/lib/seo";

function main() {
  assert.equal(PUBLIC_DEFAULT_LOCALE, "en");
  assert.equal(defaultLocaleFor("public"), "en");
  assert.equal(normalizeLocale(null), "en");
  assert.equal(normalizeLocale(""), "en");
  assert.equal(normalizeLocale("tr"), "tr");
  assert.equal(normalizeLocale("de-DE"), "de");

  assert.equal(translate("en", "landing.heroTitle"), "Trade global markets from one account");
  assert.equal(translate("tr", "landing.heroTitle"), "Küresel piyasalarda tek hesaptan işlem yapın");
  assert.equal(translate("en", "common.signIn"), "Sign In");

  assert.equal(TITLE, "7FX — Global multi-asset trading platform");
  assert.ok(DESCRIPTION.startsWith("7FX is an international"));
  assert.equal(DESCRIPTION.includes("hisse"), false);
  assert.equal(OG_ALT.includes("küresel"), false);

  const home = marketingMetadata("7fx.customer.org.tr", "/");
  assert.deepEqual(home.title, { absolute: TITLE });
  assert.equal(home.description, DESCRIPTION);
  assert.equal(home.openGraph?.locale, "en_US");
  assert.ok(home.openGraph?.alternateLocale?.includes("tr_TR"));
  assert.equal(home.openGraph?.title, TITLE);

  const ios = marketingMetadata("7fx.financeunit.co", "/ios");
  assert.deepEqual(ios.title, { absolute: IOS_TITLE });
  assert.equal(String(ios.description).includes("iPad'e"), false);
  assert.equal(ios.openGraph?.locale, "en_US");

  const ld = JSON.parse(organizationJsonLd("https://7fx.customer.org.tr")) as {
    "@graph": { "@type": string; inLanguage?: string; description?: string }[];
  };
  const site = ld["@graph"].find((node) => node["@type"] === "WebSite");
  assert.ok(site);
  assert.equal(site?.inLanguage, "en");
  assert.equal(site?.description, DESCRIPTION);

  console.log("public-default tests passed");
}

main();
