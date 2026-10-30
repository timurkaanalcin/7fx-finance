/**
 * Public licenses follow the stored register's field names and never invent values.
 * Run: npx tsx tests/licenses-page.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  EMPTY_LICENSE,
  httpsRegisterUrl,
  licenseEntries,
  LICENSE_MISSING,
  REGISTER_FIELD_ORDER,
  type PublicLicense,
} from "../src/lib/license-record";
import { registerKind } from "../src/lib/license-register";
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
  ...EMPTY_LICENSE,
  id: "clicense1",
  regulator: "Financial Conduct Authority",
  number: "REG-1",
  entity: "Example Ltd",
  registerUrl: "https://register.fca.org.uk/",
  status: "Authorised",
};

function main() {
  assert.equal(registerKind(SAMPLE), "fca");
  assert.equal(registerKind({ ...EMPTY_LICENSE, regulator: "Other Authority", registerUrl: "https://register.example/lookup" }), "generic");
  assert.equal(registerKind({ ...EMPTY_LICENSE, regulator: "Financial Conduct Authority", registerUrl: "" }), "fca");

  const fca = licenseEntries(SAMPLE, "en");
  assert.deepEqual(fca.map((field) => field.key), [...REGISTER_FIELD_ORDER]);
  assert.equal(fca[0].key, "entity");
  assert.equal(fca[0].value, "Example Ltd");
  assert.equal(fca.find((field) => field.key === "number")?.value, "REG-1");
  assert.equal(fca.find((field) => field.key === "status")?.value, "Authorised");
  for (const key of ["licenseType", "jurisdiction", "issuedOn", "expiresOn", "scope", "address"] as const) {
    const field = fca.find((item) => item.key === key);
    assert.equal(field?.missing, true, key);
    assert.equal(field?.value, LICENSE_MISSING, key);
  }
  assert.equal(fca.find((field) => field.key === "scope")?.wide, true);
  assert.equal(fca.find((field) => field.key === "address")?.wide, true);

  const labels = publicBundle("en").licenses.fca;
  assert.equal(labels.entity, "Registered firm name");
  assert.equal(labels.number, "Firm reference number");
  assert.equal(labels.status, "Current authorisation status");
  assert.equal(labels.licenseType, "Firm type");
  assert.equal(labels.issuedOn, "Date first authorised by regulator");
  assert.equal(labels.scope, "Activities and permissions");
  assert.equal(labels.address, "Principal address");
  assert.equal(publicBundle("en").licenses.generic.licenseType, "License type");
  assert.notEqual(publicBundle("tr").licenses.fca.entity, labels.entity);

  const dated = licenseEntries({
    ...SAMPLE,
    issuedOn: new Date("2013-10-01T00:00:00.000Z"),
    expiresOn: null,
  }, "en");
  assert.match(dated.find((field) => field.key === "issuedOn")?.value || "", /2013/);
  assert.equal(dated.find((field) => field.key === "issuedOn")?.value.includes("2013-10-02"), false);
  assert.equal(dated.find((field) => field.key === "expiresOn")?.missing, true);

  assert.equal(httpsRegisterUrl("https://register.fca.org.uk/"), "https://register.fca.org.uk/");
  assert.equal(httpsRegisterUrl("http://register.fca.org.uk/"), null);
  assert.equal(httpsRegisterUrl("javascript:alert(1)"), null);

  const schema = read("prisma/schema.prisma");
  const model = schema.slice(schema.indexOf("model License {"), schema.indexOf("model Notification"));
  for (const column of ["licenseType", "jurisdiction", "status", "issuedOn", "expiresOn", "scope", "address"]) {
    assert.match(model, new RegExp(`${column}\\s+`), column);
  }
  assert.match(model, /issuedOn\s+DateTime\?/);
  assert.match(model, /expiresOn\s+DateTime\?/);
  const sql = read("prisma/migrations/20261030180000_license_register_fields/migration.sql");
  assert.match(sql, /ADD COLUMN `licenseType` VARCHAR\(255\) NULL/);
  assert.match(sql, /ADD COLUMN `issuedOn` DATE NULL/);
  assert.match(sql, /ADD COLUMN `expiresOn` DATE NULL/);
  assert.match(sql, /ADD COLUMN `scope` TEXT NULL/);
  assert.match(sql, /ADD COLUMN `address` TEXT NULL/);
  assert.equal(/DROP|DELETE|UPDATE /i.test(sql), false);

  const sheet = read("src/components/licenses/LicenseSheet.tsx");
  const admin = read("src/app/api/admin/licenses/route.ts");
  const pub = read("src/app/api/licenses/route.ts");
  assert.match(sheet, /fx-lic-verify-btn/);
  assert.match(sheet, /registerKind/);
  assert.equal(/row\?\.logo|validLogo|fx-lic-regulator-logo/.test(sheet), false);
  assert.match(admin, /licenseType/);
  assert.match(admin, /issuedOn/);
  assert.match(admin, /expiresOn/);
  assert.match(pub, /licenseType/);
  assert.match(read("src/app/(admin)/izcrm/licenses/page.tsx"), /gap\.lic\.scope/);
  assert.match(read("src/app/(public)/licenses/licenses.css"), /@media print/);
  assert.equal(isMarketingPath("/licenses"), true);
  assert.equal(shouldNoindex("7fx.customer.org.tr", "/licenses"), false);

  const locales = { en, tr, de, ru, ar };
  for (const [name, dict] of Object.entries(locales)) {
    for (const key of ["gap.lic.status", "gap.lic.type", "gap.lic.jurisdiction", "gap.lic.issued", "gap.lic.expires", "gap.lic.scope", "gap.lic.address"]) {
      assert.equal(typeof dict[key], "string", `${name} ${key}`);
    }
    const copy = publicBundle(name as Locale).licenses;
    for (const key of REGISTER_FIELD_ORDER) {
      assert.equal(typeof copy.generic[key], "string", `${name} generic ${key}`);
      assert.equal(typeof copy.fca[key], "string", `${name} fca ${key}`);
    }
  }
  const english = JSON.stringify(publicBundle("en").licenses);
  assert.equal(/[çğıöşüÇĞİÖŞÜıİ]/.test(english), false);

  console.log("licenses page tests passed");
}

main();
