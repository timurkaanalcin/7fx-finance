/**
 * CRM v3 snooze list and deposit method glance.
 * Run: npx tsx tests/crmv3-round104.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { NQ_AR, NQ_DE, NQ_EN, NQ_RU, NQ_TR } from "../src/lib/crmv3/copy-snoozelist";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import {
  METHOD_KEY,
  SNOOZE_KEY,
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
} from "../src/lib/crmv3/snoozelist";

const ROOT = path.resolve(__dirname, "..");

function main() {
  assert.equal(SNOOZE_KEY, "crmv3-customer-snooze");
  assert.equal(METHOD_KEY, "crmv3-dep-method-hide");
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

  const copy = Object.keys(NQ_EN).sort();
  assert.deepEqual(Object.keys(NQ_TR).sort(), copy);
  assert.deepEqual(Object.keys(NQ_DE).sort(), copy);
  assert.deepEqual(Object.keys(NQ_RU).sort(), copy);
  assert.deepEqual(Object.keys(NQ_AR).sort(), copy);
  assert.notEqual(NQ_TR.nqTitle, NQ_EN.nqTitle);
  assert.notEqual(NQ_DE.mgHint, NQ_EN.mgHint);
  assert.notEqual(NQ_RU.mgBlank, NQ_EN.mgBlank);
  assert.notEqual(NQ_AR.nqBlank, NQ_EN.nqBlank);
  assert.equal(crmv3Text("en", "nqTitle"), "Snooze list");
  assert.equal(crmv3Text("tr", "mgTitle"), NQ_TR.mgTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-customer-snooze", "de"), "Pausenliste");
  assert.equal(keyTitle("crmv3-dep-method-hide", "tr"), "Yatırma yöntemi");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "snoozelist"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "depmethod"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("snoozelist"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("depmethod"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("snoozelist")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "money" && (group.ids as readonly string[]).includes("depmethod")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-snooze-list/);
  assert.match(css, /\.c3-dep-method/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/snoozelist.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes('?? "BANK"'), false);
  assert.match(view, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(view, /\/api\/admin\/deposits\?take=40/);
  assert.match(view, /data-snooze-list/);
  assert.match(view, /data-dep-method/);
  assert.match(view, /SNOOZE_KEY/);
  assert.match(view, /METHOD_KEY/);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "snoozelist"/);
  assert.match(app, /view === "depmethod"/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round104 tests passed");
}

main();
