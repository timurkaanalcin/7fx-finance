/**
 * Customer snoozes and deposit methods.
 * Run: npx tsx tests/crmv4-round104.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND104_COPY } from "../src/lib/crmv4/copy-round104";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeMethod,
  clearSnoozes,
  methodLines,
  methodText,
  namedMethods,
  noteText,
  readHiddenMethods,
  readSnoozes,
  snoozeCustomer,
  toggleMethod,
  visibleDeposits,
  visibleMethods,
  visiblePeople,
  wakeCustomer,
} from "../src/lib/crmv4/round104";

function main() {
  const present = ["ada", "bea"];
  assert.equal(noteText("  "), "");
  assert.equal(noteText(" Call\nlater "), "Call later");
  assert.equal(noteText("x".repeat(90)).length, 80);
  assert.deepEqual(readSnoozes([{ id: "  " }, { id: "nope", note: "x" }, { id: "ada", note: "  " }, { id: "ada", note: "again" }], present), [{ id: "ada", note: "" }]);
  const snoozed = snoozeCustomer([], "ada", "Call later", present);
  assert.equal(snoozeCustomer(snoozed, "nope", "x", present).length, 1);
  assert.equal(snoozeCustomer(snoozed, "ada", "Tomorrow", present)[0].note, "Tomorrow");
  assert.equal(snoozeCustomer(snoozed, "ada", "   ", present)[0].note, "");
  assert.deepEqual(wakeCustomer(snoozed, "ada", present), []);
  assert.deepEqual(clearSnoozes(), []);
  const people = [
    { id: "ada", name: "Ada Lane", email: "ada@desk.test" },
    { id: "bea", name: "Bea", email: "bea@desk.test" },
  ];
  assert.deepEqual(visiblePeople(people, snoozed, "later", true).map((row) => row.id), ["ada"]);
  assert.deepEqual(visiblePeople(people, snoozed, "", false).map((row) => row.id), ["bea"]);

  const rows = [
    { id: "a", label: "Ada", method: { label: " Wire ", type: "BANK" } },
    { id: "b", label: "Bea", method: { label: "", type: "BANK" } },
    { id: "c", label: "Cid", method: "CRYPTO" },
    { id: "d", label: "Dot", method: null },
    { id: "e", label: "Eve", method: { label: "", type: "" } },
  ];
  assert.equal(methodText({ label: " Wire ", type: "BANK" }), "Wire");
  assert.equal(methodText({ label: "", type: "BANK" }), "BANK");
  assert.equal(methodText("CRYPTO"), "CRYPTO");
  assert.equal(methodText(null), "");
  assert.deepEqual(methodLines(rows), [
    { method: "", count: 2 },
    { method: "BANK", count: 1 },
    { method: "CRYPTO", count: 1 },
    { method: "Wire", count: 1 },
  ]);
  assert.deepEqual(namedMethods(rows), ["BANK", "CRYPTO", "Wire"]);
  assert.equal(namedMethods([{ method: null }]).includes("BANK"), false);
  assert.deepEqual(visibleDeposits(rows, "BANK", false, "bea").map((row) => row.id), ["b"]);
  assert.deepEqual(visibleDeposits(rows, "", true, "").map((row) => row.id), ["d", "e"]);
  assert.deepEqual(readHiddenMethods(["BANK", "CARD", ""], ["BANK", "CRYPTO"]), ["BANK"]);
  assert.deepEqual(toggleMethod(["BANK"], "CARD", ["BANK"]), ["BANK"]);
  assert.deepEqual(visibleMethods(["BANK", "CRYPTO"], ["CRYPTO"], false), ["BANK"]);
  assert.equal(activeMethod("CRYPTO", ["BANK"]), "");

  const copy = Object.keys(ROUND104_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND104_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "nqTitle"), "Snooze list");
  assert.equal(crmv4Text("tr", "mgTitle"), ROUND104_COPY.tr.mgTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-snooze-list/);
  assert.match(css, /\.c4-dep-method/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round104.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes('?? "BANK"'), false);
  assert.match(view, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(view, /\/api\/admin\/deposits\?take=40/);
  assert.match(view, /data-snooze-list/);
  assert.match(view, /data-dep-method/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "snoozelist"/);
  assert.match(app, /view === "depmethod"/);
  console.log("crmv4 round104 tests passed");
}

main();
