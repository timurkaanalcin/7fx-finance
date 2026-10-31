/**
 * CRM v3 desk tools reuse v4 helpers and keep their own browser keys.
 * Run: npx tsx tests/crmv3-desk.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { CRM_V3_COPY } from "../src/lib/crmv3/copy";
import { emailOk, formScore, phoneShort } from "../src/lib/crmv4/round17";
import { stageFor } from "../src/lib/crmv4/round16";
import { methodName } from "../src/lib/crmv4/round15";

const ROOT = path.resolve(__dirname, "..");

function main() {
  const locales = ["en", "tr", "de", "ru", "ar"] as const;
  const english = Object.keys(CRM_V3_COPY.en);
  for (const locale of locales) {
    assert.deepEqual(Object.keys(CRM_V3_COPY[locale]), english, locale);
  }
  assert.equal(CRM_V3_COPY.en.leadBoard.length > 0, true);
  assert.equal(CRM_V3_COPY.tr.feedTitle.length > 0, true);
  assert.notEqual(CRM_V3_COPY.tr.leadLocal, CRM_V3_COPY.en.leadLocal);

  const desk = path.join(ROOT, "src/components/crmv3/desk");
  const files = fs.readdirSync(desk).filter((name) => name.endsWith(".ts") || name.endsWith(".tsx"));
  const source = files.map((name) => fs.readFileSync(path.join(desk, name), "utf8")).join("\n");
  assert.match(source, /crmv3-lead-stage/);
  assert.match(source, /crmv3-call-log/);
  assert.match(source, /crmv3-fin-reason/);
  assert.equal(source.includes("crmv4-"), false);

  const v4 = fs.readFileSync(path.join(ROOT, "src/components/crmv4/round17.tsx"), "utf8");
  assert.match(v4, /crmv4-call-log/);
  const v4lead = fs.readFileSync(path.join(ROOT, "src/components/crmv4/round16.tsx"), "utf8");
  assert.match(v4lead, /crmv4-lead-stage/);

  assert.equal(emailOk(""), true);
  assert.equal(emailOk("ada@desk.test"), true);
  assert.equal(emailOk("not-an-email"), false);
  assert.equal(phoneShort("123"), true);
  assert.equal(phoneShort(""), false);
  assert.equal(formScore({ name: "Ada", email: "ada@desk.test", phone: "5551234567", country: "TR" }), 100);
  assert.equal(stageFor({ id: "1", saleStatus: "NEW" }, {}), "inbox");
  assert.equal(methodName({ label: "Wire" }), "Wire");

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);

  console.log("crmv3 desk tests passed");
}

main();
