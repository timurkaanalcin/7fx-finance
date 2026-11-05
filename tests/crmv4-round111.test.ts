/**
 * Reminder chips and customer risk.
 * Run: npx tsx tests/crmv4-round111.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND111_COPY } from "../src/lib/crmv4/copy-round111";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeRisk,
  addChip,
  chipText,
  dueLabel,
  namedRisks,
  readChips,
  readHiddenRisks,
  resetChips,
  riskLines,
  riskText,
  setChipHidden,
  toggleChipDone,
  toggleChipPin,
  toggleRisk,
  visibleChips,
  visibleCustomers,
  visibleRisks,
} from "../src/lib/crmv4/round111";

function main() {
  assert.equal(chipText("  Call\nAda  "), "Call Ada");
  assert.equal(chipText("   "), "");
  assert.equal(chipText("x".repeat(90)).length, 80);
  assert.equal(dueLabel("  Friday  "), "Friday");
  assert.equal(dueLabel("   "), "");
  assert.deepEqual(readChips([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Call", due: "  ", pinned: 1, done: "yes" }]), [
    { id: "2", text: "Call", due: "", pinned: false, hidden: false, done: false },
  ]);
  const saved = addChip([], { id: "a", text: " Call ", due: " Friday " });
  assert.deepEqual(saved, [{ id: "a", text: "Call", due: "Friday", pinned: false, hidden: false, done: false }]);
  assert.equal(addChip(saved, { id: "b", text: "  " }).length, 1);
  assert.equal(addChip(saved, { id: "a", text: "Other" }).length, 1);
  const pinned = toggleChipPin(saved, "a");
  assert.equal(pinned[0].pinned, true);
  const hidden = setChipHidden(pinned, "a", true);
  assert.equal(hidden[0].hidden, true);
  const done = toggleChipDone(saved, "a");
  assert.equal(done[0].done, true);
  assert.deepEqual(visibleChips(done, "done", "fri").map((chip) => chip.id), ["a"]);
  assert.deepEqual(visibleChips(hidden, "open", ""), []);
  assert.deepEqual(resetChips(), []);

  assert.equal(riskText({ risk: " HIGH ", accountType: "VIP" }), "HIGH");
  assert.equal(riskText({ risk: "", tier: " Gold " }), "Gold");
  assert.equal(riskText({ risk: "", tier: "", accountType: " VIP " }), "VIP");
  assert.equal(riskText({ potentialStatus: "HOT", balance: 5000 } as never), "");
  assert.equal(riskText({ risk: 15 } as never), "");
  const rows = [
    { id: "u1", label: "Ada", risk: { risk: "HIGH" } },
    { id: "u2", label: "Bea", risk: { accountType: "VIP" } },
    { id: "u3", label: "Cid", risk: { tier: "Gold" } },
    { id: "u4", label: "Dot", risk: { potentialStatus: "HOT" } },
    { id: "u5", label: "Eve" },
  ];
  assert.deepEqual(riskLines(rows), [
    { risk: "", count: 2 },
    { risk: "Gold", count: 1 },
    { risk: "HIGH", count: 1 },
    { risk: "VIP", count: 1 },
  ]);
  assert.deepEqual(namedRisks(rows), ["Gold", "HIGH", "VIP"]);
  assert.deepEqual(visibleCustomers(rows, "VIP", false, "bea").map((row) => row.id), ["u2"]);
  assert.deepEqual(visibleCustomers(rows, "", true, "").map((row) => row.id), ["u4", "u5"]);
  assert.deepEqual(readHiddenRisks(["VIP", "MADE", ""], ["VIP", "HIGH"]), ["VIP"]);
  assert.deepEqual(toggleRisk(["VIP"], "MADE", ["VIP"]), ["VIP"]);
  assert.deepEqual(visibleRisks(["VIP", "HIGH"], ["HIGH"], false), ["VIP"]);
  assert.equal(activeRisk("HIGH", ["VIP"]), "");

  const copy = Object.keys(ROUND111_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND111_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "hcTitle"), "Reminder chips");
  assert.equal(crmv4Text("tr", "vpTitle"), ROUND111_COPY.tr.vpTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-remind-polish/);
  assert.match(css, /\.c4-risk-glance/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round111.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("fetch("), false);
  assert.equal(view.includes("potentialStatus"), false);
  assert.equal(view.includes("balance"), false);
  assert.match(view, /\/api\/admin\/users\?view=table&take=40&meta=0&role=TRADER/);
  assert.match(view, /data-remind-polish/);
  assert.match(view, /data-risk-glance/);
  assert.match(view, /data-logo="mono"/);
  assert.match(view, /customers/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "remindpolish"/);
  assert.match(app, /view === "riskglance"/);
  console.log("crmv4 round111 tests passed");
}

main();
