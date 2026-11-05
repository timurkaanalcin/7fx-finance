/**
 * Staff roster and withdrawal methods.
 * Run: npx tsx tests/crmv4-round113.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND113_COPY } from "../src/lib/crmv4/copy-round113";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeMethod,
  addStaff,
  methodLines,
  methodText,
  namedMethods,
  readHiddenMethods,
  readStaff,
  resetStaff,
  roleLabel,
  setStaffHidden,
  staffName,
  toggleMethod,
  toggleStaffPin,
  visibleMethods,
  visibleStaff,
  visibleWithdrawals,
} from "../src/lib/crmv4/round113";

function main() {
  assert.equal(staffName("  Ada\nKaya  "), "Ada Kaya");
  assert.equal(staffName("   "), "");
  assert.equal(staffName("x".repeat(90)).length, 80);
  assert.equal(roleLabel("  Desk  "), "Desk");
  assert.equal(roleLabel("   "), "");
  assert.deepEqual(readStaff([{ id: "", name: "Ada" }, { id: "1", name: "  " }, { id: "2", name: "Ada", role: "  ", pinned: 1 }]), [
    { id: "2", name: "Ada", role: "", pinned: false, hidden: false },
  ]);
  const saved = addStaff([], { id: "a", name: " Ada ", role: " Desk " });
  assert.deepEqual(saved, [{ id: "a", name: "Ada", role: "Desk", pinned: false, hidden: false }]);
  assert.equal(addStaff(saved, { id: "b", name: "  " }).length, 1);
  assert.equal(addStaff(saved, { id: "c", name: "Ada", role: "Desk" }).length, 1);
  const pinned = toggleStaffPin(saved, "a");
  assert.equal(pinned[0].pinned, true);
  const hidden = setStaffHidden(pinned, "a", true);
  assert.equal(hidden[0].hidden, true);
  assert.deepEqual(visibleStaff(pinned, false, "desk").map((person) => person.id), ["a"]);
  assert.deepEqual(visibleStaff(hidden, false, ""), []);
  assert.deepEqual(resetStaff(), []);

  assert.equal(methodText({ label: " Wire ", type: "BANK", channel: "SWIFT" }), "Wire");
  assert.equal(methodText({ label: "", type: " BANK " }), "BANK");
  assert.equal(methodText({ label: "", type: "", channel: " Card " }), "Card");
  assert.equal(methodText(" crypto "), "crypto");
  assert.equal(methodText(""), "");
  assert.equal(methodText(12 as never), "");
  assert.equal(methodText({ amount: 50 } as never), "");
  const rows = [
    { id: "w1", label: "Ada PENDING", method: { label: "Wire" } },
    { id: "w2", label: "Bea PENDING", method: { type: "BANK" } },
    { id: "w3", label: "Cid APPROVED", method: "Wire" },
    { id: "w4", label: "Dot", method: "" },
    { id: "w5", label: "Eve", method: { amount: 20 } as never },
  ];
  assert.deepEqual(methodLines(rows), [
    { method: "", count: 2 },
    { method: "BANK", count: 1 },
    { method: "Wire", count: 2 },
  ]);
  assert.deepEqual(namedMethods(rows), ["BANK", "Wire"]);
  assert.deepEqual(visibleWithdrawals(rows, "Wire", false, "ada").map((row) => row.id), ["w1"]);
  assert.deepEqual(visibleWithdrawals(rows, "", true, "").map((row) => row.id), ["w4", "w5"]);
  assert.deepEqual(readHiddenMethods(["Wire", "Cash", ""], ["Wire", "BANK"]), ["Wire"]);
  assert.deepEqual(toggleMethod(["Wire"], "Cash", ["Wire"]), ["Wire"]);
  assert.deepEqual(visibleMethods(["Wire", "BANK"], ["BANK"], false), ["Wire"]);
  assert.equal(activeMethod("BANK", ["Wire"]), "");
  assert.equal(methodLines(rows).every((line) => !("amount" in line)), true);

  const copy = Object.keys(ROUND113_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND113_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "spTitle"), "Staff roster");
  assert.equal(crmv4Text("tr", "wgTitle"), ROUND113_COPY.tr.wgTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-staff-polish/);
  assert.match(css, /\.c4-wd-methods/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round113.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("fetch("), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes("currency"), false);
  assert.match(view, /\/api\/admin\/withdrawals\?take=40/);
  assert.match(view, /data-staff-polish/);
  assert.match(view, /data-wd-methods/);
  assert.match(view, /data-logo="mono"/);
  assert.match(view, /roster/);
  assert.match(view, /withdraw/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "staffpolish"/);
  assert.match(app, /view === "wdmethod"/);
  console.log("crmv4 round113 tests passed");
}

main();
