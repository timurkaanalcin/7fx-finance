/**
 * CRM v4 round 39 helpers.
 * Run: npx tsx tests/crmv4-round39.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND39_COPY } from "../src/lib/crmv4/copy-round39";
import { PHONE_WIDTHS, accountCurrencies, activeMethods, methodOn, sysSection } from "../src/lib/crmv4/round39";

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
  assert.equal(sysSection("nope"), "methods");
  const copy = Object.keys(ROUND39_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND39_COPY[locale]).sort(), copy);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-sys-desk/);
  assert.match(css, /\.c4-record-foot/);
  assert.match(css, /\.c4-phone-sheet/);
  assert.match(css, /min-height: 44px/);
  assert.match(css, /#7a5e30/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round39.tsx"), "utf8");
  assert.match(view, /\/api\/admin\/methods/);
  assert.match(view, /PATCH/);
  assert.match(view, /\/api\/admin\/desks/);
  const page = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Customers.tsx"), "utf8");
  assert.match(page, /c4-record-foot/);
  console.log("crmv4 round39 tests passed");
}

main();
