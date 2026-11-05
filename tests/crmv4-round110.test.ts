/**
 * Reminder chips and customer risk.
 * Run: npx tsx tests/crmv4-round110.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND110_COPY } from "../src/lib/crmv4/copy-round110";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeRisk,
  addReminder,
  dueLabel,
  namedRisks,
  readHiddenRisks,
  readReminders,
  reminderText,
  riskLines,
  riskText,
  setReminderDone,
  setReminderHidden,
  toggleReminderPin,
  toggleRisk,
  visibleCustomers,
  visibleReminders,
  visibleRisks,
} from "../src/lib/crmv4/round110";

function main() {
  assert.equal(reminderText("  Call\nAda  "), "Call Ada");
  assert.equal(reminderText("   "), "");
  assert.equal(dueLabel(""), "");
  assert.equal(dueLabel(" Friday "), "Friday");
  const blank = addReminder([], { id: "a", text: "  ", due: "Friday", at: "1" });
  assert.equal(blank.length, 0);
  const saved = addReminder([], { id: "a", text: "Call Ada", due: "", at: "1" });
  assert.equal(saved[0].due, "");
  assert.equal(saved[0].done, false);
  const again = addReminder(saved, { id: "b", text: "Call Ada", due: "", at: "2" });
  assert.equal(again.length, 1);
  const other = addReminder(saved, { id: "b", text: "Call Ada", due: "Friday", at: "2" });
  assert.equal(other.length, 2);
  const pinned = toggleReminderPin(other, "b");
  assert.equal(pinned.find((item) => item.id === "b")?.pinned, true);
  const done = setReminderDone(pinned, "a", true);
  assert.deepEqual(visibleReminders(done, "", "open").map((item) => item.id), ["b"]);
  assert.deepEqual(visibleReminders(done, "friday", "open").map((item) => item.id), ["b"]);
  assert.deepEqual(visibleReminders(done, "", "done").map((item) => item.id), ["a"]);
  const hidden = setReminderHidden(done, "b", true);
  assert.deepEqual(visibleReminders(hidden, "", "hidden").map((item) => item.id), ["b"]);
  const reread = readReminders([{ id: "z", text: "  ", due: "x", done: true }, { id: "a", text: "Call Ada", due: "", done: true, pinned: false, hidden: false }]);
  assert.deepEqual(reread.map((item) => item.id), ["a"]);

  const rows = [
    { id: "u1", label: "Ada ada@x", risk: { risk: " HIGH ", tier: "VIP", accountType: "STANDARD" } },
    { id: "u2", label: "Bea", risk: { risk: "", tier: " VIP ", accountType: "STANDARD" } },
    { id: "u3", label: "Cid", risk: { risk: "", tier: "", accountType: "PRO" } },
    { id: "u4", label: "Dot", risk: { risk: "", tier: "", accountType: "" } },
    { id: "u5", label: "Eve", risk: { saleStatus: "NEW", retentionStatus: "HOT" } as never },
  ];
  assert.equal(riskText({ risk: " HIGH ", tier: "VIP", accountType: "STANDARD" }), "HIGH");
  assert.equal(riskText({ risk: "", tier: " VIP ", accountType: "STANDARD" }), "VIP");
  assert.equal(riskText({ risk: "", tier: "", accountType: "PRO" }), "PRO");
  assert.equal(riskText({ risk: "", tier: "", accountType: "" }), "");
  assert.equal(riskText({ saleStatus: "NEW" } as never), "");
  assert.deepEqual(riskLines(rows), [
    { risk: "", count: 2 },
    { risk: "HIGH", count: 1 },
    { risk: "PRO", count: 1 },
    { risk: "VIP", count: 1 },
  ]);
  assert.deepEqual(namedRisks(rows), ["HIGH", "PRO", "VIP"]);
  assert.equal(namedRisks([{ risk: null }]).includes("STANDARD"), false);
  assert.deepEqual(visibleCustomers(rows, "VIP", false, "bea").map((row) => row.id), ["u2"]);
  assert.deepEqual(visibleCustomers(rows, "", true, "").map((row) => row.id), ["u4", "u5"]);
  assert.deepEqual(readHiddenRisks(["VIP", "LOW", ""], ["VIP", "PRO"]), ["VIP"]);
  assert.deepEqual(toggleRisk(["VIP"], "LOW", ["VIP"]), ["VIP"]);
  assert.deepEqual(visibleRisks(["VIP", "PRO"], ["PRO"], false), ["VIP"]);
  assert.equal(activeRisk("PRO", ["VIP"]), "");

  const copy = Object.keys(ROUND110_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND110_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "qnTitle"), "Reminder chips");
  assert.equal(crmv4Text("tr", "krTitle"), ROUND110_COPY.tr.krTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-remind-polish/);
  assert.match(css, /\.c4-risk-glance/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round110.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes('?? "STANDARD"'), false);
  assert.equal(view.includes("saleStatus"), false);
  assert.equal(view.includes("riskScore"), false);
  assert.match(view, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(view, /data-remind-polish/);
  assert.match(view, /data-risk-glance/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "remindpolish"/);
  assert.match(app, /view === "riskglance"/);
  console.log("crmv4 round110 tests passed");
}

main();
