/**
 * Public licenses are a document page built only from stored fields.
 * Run: npx tsx tests/licenses-page.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  httpsRegisterUrl,
  licenseFields,
  LICENSE_MISSING,
  UNSTORED_LICENSE_FIELDS,
  type PublicLicense,
} from "../src/lib/license-record";
import { publicBundle } from "../src/lib/public-doc-copy";
import { isMarketingPath, shouldNoindex } from "../src/lib/seo-hosts";
import type { Locale } from "../src/lib/i18n/locales";
import { en } from "../src/lib/i18n/dictionaries/en";
import { tr } from "../src/lib/i18n/dictionaries/tr";
import { de } from "../src/lib/i18n/dictionaries/de";
import { ru } from "../src/lib/i18n/dictionaries/ru";
import { ar } from "../src/lib/i18n/dictionaries/ar";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

const SAMPLE: PublicLicense = {
  id: "clicense1",
  regulator: "Example Authority",
  number: "REG-1",
  entity: "Example Ltd",
  registerUrl: "https://register.example/lookup",
  logo: null,
};

function main() {
  const fields = licenseFields(SAMPLE);
  const byKey = Object.fromEntries(fields.map((field) => [field.key, field]));
  assert.equal(byKey.authority.value, "Example Authority");
  assert.equal(byKey.authority.missing, false);
  assert.equal(byKey.number.value, "REG-1");
  assert.equal(byKey.entity.value, "Example Ltd");
  for (const key of UNSTORED_LICENSE_FIELDS) {
    assert.equal(byKey[key].missing, true, key);
    assert.equal(byKey[key].value, LICENSE_MISSING, key);
  }
  assert.equal(byKey.scope.wide, true);
  assert.equal(byKey.jurisdiction.wide, true);
  assert.equal(byKey.issued.wide, false);

  const blank = licenseFields({ id: "x", regulator: "  ", number: "", entity: "", registerUrl: "", logo: null });
  assert.ok(blank.every((field) => field.missing && field.value === LICENSE_MISSING));

  assert.equal(httpsRegisterUrl("https://register.example/a"), "https://register.example/a");
  assert.equal(httpsRegisterUrl("http://register.example/a"), null);
  assert.equal(httpsRegisterUrl("javascript:alert(1)"), null);
  assert.equal(httpsRegisterUrl(""), null);

  const schema = read("prisma/schema.prisma");
  const model = schema.slice(schema.indexOf("model License {"), schema.indexOf("model Notification"));
  for (const column of ["jurisdiction", "issuedAt", "expiresAt", "scope", "licenseType"]) {
    assert.equal(model.includes(column), false, column);
  }
  for (const column of ["regulator", "number", "entity", "registerUrl", "logo"]) {
    assert.match(model, new RegExp(`\\b${column}\\b`));
  }

  const page = read("src/app/(public)/licenses/page.tsx");
  const detail = read("src/app/(public)/licenses/[id]/page.tsx");
  const sheet = read("src/components/licenses/LicenseSheet.tsx");
  const landing = read("src/components/landing/LandingPage.tsx");
  const section = read("src/components/landing/LicensesSection.tsx");
  const css = read("src/app/(public)/licenses/licenses.css");
  assert.match(page, /listPublicLicenses/);
  assert.match(detail, /getPublicLicense/);
  assert.match(detail, /notFound/);
  assert.match(sheet, /viewFull/);
  assert.match(sheet, /LICENSE_MISSING/);
  assert.match(css, /@media print/);
  assert.match(css, /data-fx-theme="dark"/);
  assert.match(css, /fx-lic-seal/);
  assert.equal(/FCA|CySEC|ASIC|123456/.test(sheet + page + detail), false);
  assert.match(landing, /href="\/licenses"/);
  assert.match(section, /href="\/licenses"/);
  assert.equal(section.includes("/api/licenses"), false);
  assert.match(read("src/components/public/PublicDoc.tsx"), /href: "\/licenses"/);
  assert.equal(isMarketingPath("/licenses"), true);
  assert.equal(shouldNoindex("7fx.customer.org.tr", "/licenses"), false);
  assert.equal(shouldNoindex("7fx.customer.org.tr", "/licenses/clicense1"), true);

  const locales = { en, tr, de, ru, ar };
  for (const [name, dict] of Object.entries(locales)) {
    assert.equal(typeof dict["landing.nav.licenses"], "string", name);
    assert.equal(typeof dict["landing.licenses.summary"], "string", name);
    assert.equal(typeof dict["landing.licenses.open"], "string", name);
    const copy = publicBundle(name as Locale).licenses;
    assert.equal(copy.stamp.length > 0, true, name);
    for (const key of UNSTORED_LICENSE_FIELDS) {
      assert.equal(typeof copy[key], "string", `${name} ${key}`);
    }
  }
  assert.equal(en["landing.nav.licenses"], "Licenses");
  assert.equal(tr["landing.nav.licenses"], "Lisanslar");
  assert.notEqual(de["landing.licenses.open"], en["landing.licenses.open"]);
  assert.notEqual(ru["landing.licenses.summary"], en["landing.licenses.summary"]);
  assert.notEqual(ar["landing.licenses.open"], en["landing.licenses.open"]);
  const english = Object.values(publicBundle("en").licenses).join(" ");
  assert.equal(/[çğıöşüÇĞİÖŞÜıİ]/.test(english), false);

  console.log("licenses page tests passed");
}

main();
