/**
 * Bell slips and trading groups.
 * Run: npx tsx tests/crmv4-round133.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND133_COPY } from "../src/lib/crmv4/copy-round133";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeTradingGroup,
  addBell,
  bellCopy,
  bellText,
  bellsCsv,
  floorLabel,
  groupLines,
  groupShare,
  groupText,
  leadingGroup,
  namedGroups,
  readBells,
  readHiddenGroups,
  resetBells,
  setBellHeld,
  setBellRung,
  toggleBellPin,
  toggleGroup,
  visibleBells,
  visibleGroupCustomers,
  visibleGroups,
} from "../src/lib/crmv4/round133";

function main() {
  assert.equal(bellText("  Keys\nB  "), "Keys B");
  assert.equal(bellText("   "), "");
  assert.equal(bellText("x".repeat(140)).length, 100);
  assert.equal(floorLabel("  12  "), "12");
  assert.equal(floorLabel("   "), "");
  assert.equal(floorLabel("y".repeat(40)).length, 12);
  assert.deepEqual(readBells([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Ring the desk", floor: "  ", pinned: 1, rung: 1 }, "nope"]), [
    { id: "2", text: "Ring the desk", floor: "", pinned: false, rung: false, held: false },
  ]);
  const saved = addBell([], { id: "a", text: " Ring the desk ", floor: " 4 " });
  assert.deepEqual(saved, [{ id: "a", text: "Ring the desk", floor: "4", pinned: false, rung: false, held: false }]);
  assert.equal(addBell(saved, { id: "b", text: "  " }).length, 1);
  assert.equal(addBell(saved, { id: "c", text: "Ring the desk" }).length, 1);
  assert.equal(addBell(saved, { id: "a", text: "Other bag" }).length, 1);
  const pinned = toggleBellPin(saved, "a");
  assert.equal(pinned[0].pinned, true);
  const rung = setBellRung(pinned, "a", true);
  assert.equal(rung[0].rung, true);
  const held = setBellHeld(rung, "a", true);
  assert.equal(held[0].held, true);
  assert.deepEqual(visibleBells(pinned, "waiting", "desk").map((slip) => slip.id), ["a"]);
  assert.deepEqual(visibleBells(pinned, "waiting", "4"), []);
  assert.deepEqual(visibleBells(rung, "waiting", ""), []);
  assert.deepEqual(visibleBells(rung, "rung", "").map((slip) => slip.id), ["a"]);
  assert.deepEqual(visibleBells(held, "rung", ""), []);
  assert.deepEqual(visibleBells(held, "held", "").map((slip) => slip.id), ["a"]);
  assert.equal(bellCopy("  Ring the desk "), "Ring the desk");
  assert.equal(bellCopy("   "), "");
  assert.deepEqual(resetBells(), []);
  const many = Array.from({ length: 40 }, (_, index) => ({ id: `n${index}`, text: `Slip ${index}`, floor: "" }));
  assert.equal(readBells(many).length, 36);
  assert.equal(bellsCsv([{ id: "", text: "skip" }, { id: "a", text: 'Ring "the" desk', floor: "Bay, 2", pinned: true, rung: false, held: false }]), 'text,floor,pinned,rung,held\n"Ring ""the"" desk","Bay, 2",1,0,0');
  assert.equal(bellsCsv([]), "text,floor,pinned,rung,held");
  assert.equal(bellsCsv(saved).includes("amount"), false);

  assert.equal(groupText(" VIP-USD "), "VIP-USD");
  assert.equal(groupText({ tradingGroup: " STD-USD " }), "STD-USD");
  assert.equal(groupText(""), "");
  assert.equal(groupText(1 as never), "");
  assert.equal(groupText({ saleStatus: "NEW" }), "");
  assert.equal(groupText({ retentionStatus: "ACTIVE" }), "");
  assert.equal(groupText({ potentialStatus: "HIGH" }), "");
  assert.equal(groupText({ documentsStatus: "APPROVED" }), "");
  assert.equal(groupText({ accountType: "VIP" }), "");
  assert.equal(groupText({ role: "TRADER" }), "");
  assert.equal(groupText({ timezone: "UTC" }), "");
  assert.equal(groupText({ language: "en" }), "");
  assert.equal(groupText({ validation: "VERIFIED" }), "");
  assert.equal(groupText({ validationStatus: "VERIFIED" }), "");
  assert.equal(groupText({ desk: "Istanbul" }), "");
  const rows = [
    { id: "u1", label: "Ada", tradingGroup: "VIP-USD" },
    { id: "u2", label: "Bea", tradingGroup: { tradingGroup: "STD-USD" } },
    { id: "u3", label: "Cid", tradingGroup: "VIP-USD" },
    { id: "u4", label: "Dot", tradingGroup: "" },
    { id: "u5", label: "Eve", tradingGroup: { saleStatus: "NEW" } as never },
  ];
  assert.deepEqual(groupLines(rows), [
    { tradingGroup: "", count: 2 },
    { tradingGroup: "STD-USD", count: 1 },
    { tradingGroup: "VIP-USD", count: 2 },
  ]);
  assert.deepEqual(namedGroups(rows), ["STD-USD", "VIP-USD"]);
  assert.equal(groupShare(2, 5), 40);
  assert.equal(groupShare(0, 5), 0);
  assert.equal(groupShare(1, 0), 0);
  assert.equal(leadingGroup(rows), "VIP-USD");
  assert.equal(leadingGroup([{ tradingGroup: "" }]), "");
  assert.deepEqual(visibleGroupCustomers(rows, "VIP-USD", false, "ada").map((row) => row.id), ["u1"]);
  assert.deepEqual(visibleGroupCustomers(rows, "", true, "").map((row) => row.id), ["u4", "u5"]);
  assert.deepEqual(visibleGroupCustomers(rows, "VIP-USD", false, "100"), []);
  assert.deepEqual(readHiddenGroups(["VIP-USD", "OLD", ""], ["VIP-USD", "STD-USD"]), ["VIP-USD"]);
  assert.deepEqual(toggleGroup(["VIP-USD"], "OLD", ["VIP-USD"]), ["VIP-USD"]);
  assert.deepEqual(visibleGroups(["VIP-USD", "STD-USD"], ["STD-USD"], false), ["VIP-USD"]);
  assert.equal(activeTradingGroup("STD-USD", ["VIP-USD"]), "");
  assert.equal(groupLines(rows).every((line) => !("amount" in line) && !("currency" in line)), true);

  const copy = Object.keys(ROUND133_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND133_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "bllTitle"), "Bell slips");
  assert.equal(crmv4Text("tr", "tgrTitle"), ROUND133_COPY.tr.tgrTitle);
  assert.equal(crmv4Text("de", "bllFloor"), ROUND133_COPY.de.bllFloor);
  assert.equal(crmv4Text("ru", "tgrBlank"), ROUND133_COPY.ru.tgrBlank);
  assert.equal(crmv4Text("ar", "tgrBoard"), ROUND133_COPY.ar.tgrBoard);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-bell/);
  assert.match(css, /\.c4-trgroup/);
  assert.match(css, /\.c4-top-rail/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round133.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("fetch("), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes("currency"), false);
  assert.equal(view.includes("balance"), false);
  assert.equal(view.includes("saleStatus"), false);
  assert.equal(view.includes("retentionStatus"), false);
  assert.equal(view.includes("potentialStatus"), false);
  assert.equal(view.includes("documentsStatus"), false);
  assert.equal(view.includes("accountType"), false);
  assert.equal(view.includes("validationStatus"), false);
  assert.match(view, /tradingGroup/);
  assert.match(view, /bellsCsv/);
  assert.match(view, /Escape/);
  assert.match(view, /event\.key !== "\/"/);
  assert.match(view, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(view, /data-bell/);
  assert.match(view, /data-trgroup/);
  assert.match(view, /data-logo="mono"/);
  assert.match(view, /customers/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "bell"/);
  assert.match(app, /view === "trgroup"/);
  assert.match(app, /c4-top-rail/);
  assert.match(app, /data-logo="mono"/);
  console.log("crmv4 round133 tests passed");
}

main();
