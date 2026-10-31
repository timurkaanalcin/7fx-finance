/**
 * CRM v3 round 39: settings sections and the phone pass.
 * Run: npx tsx tests/crmv3-round39.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { SYSTEM_AR, SYSTEM_DE, SYSTEM_EN, SYSTEM_RU, SYSTEM_TR } from "../src/lib/crmv3/copy-system";
import { PHONE_WIDTHS, accountCurrencies, activeMethods, methodOn, sysSection } from "../src/lib/crmv3/system";

const ROOT = path.resolve(__dirname, "..");

function main() {
  assert.deepEqual(PHONE_WIDTHS, [360, 375, 390, 430]);
  assert.equal(methodOn({ active: false }), false);
  assert.equal(methodOn({}), true);
  assert.equal(activeMethods([{ active: true }, { active: false }, {}]), 2);
  assert.deepEqual(accountCurrencies([{ currency: "usd" }, { currency: "USD" }, { currency: "TRY" }]), [
    { currency: "TRY", count: 1 },
    { currency: "USD", count: 2 },
  ]);
  assert.equal(sysSection("desks"), "desks");
  assert.equal(sysSection("currencies"), "currencies");
  assert.equal(sysSection("nope"), "methods");

  const copy = Object.keys(SYSTEM_EN).sort();
  assert.deepEqual(Object.keys(SYSTEM_TR).sort(), copy);
  assert.deepEqual(Object.keys(SYSTEM_DE).sort(), copy);
  assert.deepEqual(Object.keys(SYSTEM_RU).sort(), copy);
  assert.deepEqual(Object.keys(SYSTEM_AR).sort(), copy);

  const lib = fs.readFileSync(path.join(ROOT, "src/lib/crmv3/system.ts"), "utf8");
  assert.equal(lib.includes("crmv4"), false);
  const page = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/system.tsx"), "utf8");
  assert.match(page, /\/api\/admin\/methods/);
  assert.match(page, /PATCH/);
  assert.match(page, /\/api\/admin\/desks/);
  assert.match(page, /data-sys="1"/);
  assert.equal(page.includes("crmv4"), false);
  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-sys-desk/);
  assert.match(css, /\.c3-record-foot/);
  assert.match(css, /\.c3-phone-sheet/);
  assert.match(css, /min-height:\s*44px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const settings = fs.readFileSync(path.join(ROOT, "src/components/crmv3/views/Settings.tsx"), "utf8");
  assert.match(settings, /SystemDesk/);
  assert.match(settings, /PhoneSheet/);
  const customers = fs.readFileSync(path.join(ROOT, "src/components/crmv3/views/Customers.tsx"), "utf8");
  assert.match(customers, /c3-record-foot/);
  const tree = fs.readdirSync(path.join(ROOT, "src/components/crmv3"), { recursive: true }) as string[];
  for (const file of tree) {
    if (!String(file).endsWith(".tsx") && !String(file).endsWith(".ts")) continue;
    const src = fs.readFileSync(path.join(ROOT, "src/components/crmv3", String(file)), "utf8");
    assert.equal(src.includes("crmv4"), false, String(file));
  }
  console.log("crmv3 round39 tests passed");
}

main();
