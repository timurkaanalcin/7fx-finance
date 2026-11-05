/**
 * CRM v3 pin rail and deposit status glance.
 * Run: npx tsx tests/crmv3-round96.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { RL_AR, RL_DE, RL_EN, RL_RU, RL_TR } from "../src/lib/crmv3/copy-rail";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import {
  DEP_STATUS_KEY,
  RAIL_KEY,
  activeStatus,
  addShortcut,
  moveShortcut,
  namedStatuses,
  readHiddenStatuses,
  readShortcuts,
  sectionId,
  sectionPath,
  shortcutName,
  statusLines,
  statusText,
  toggleStatus,
  visibleDeposits,
  visibleShortcuts,
  visibleStatuses,
} from "../src/lib/crmv3/pinrail";

const ROOT = path.resolve(__dirname, "..");

function main() {
  assert.equal(RAIL_KEY, "crmv3-pin-rail");
  assert.equal(DEP_STATUS_KEY, "crmv3-dep-status-hide");
  assert.equal(shortcutName("  "), "");
  assert.equal(shortcutName(" People\nboard "), "People board");
  assert.equal(sectionId("customers"), "customers");
  assert.equal(sectionId("overview"), "overview");
  assert.equal(sectionId("nope"), "");
  assert.equal(sectionId("customers/abc"), "");
  assert.equal(sectionPath("customers"), "customers");
  assert.equal(sectionPath("overview"), "");
  assert.equal(addShortcut([], { id: "1", name: "", section: "customers" }).length, 0);
  assert.equal(addShortcut([], { id: "1", name: "People", section: "nope" }).length, 0);
  const first = addShortcut([], { id: "1", name: "People", section: "customers" });
  const second = addShortcut(first, { id: "2", name: "Files", section: "kyc" });
  assert.equal(addShortcut(second, { id: "3", name: "Again", section: "customers" }).length, 2);
  assert.equal(visibleShortcuts(second, "", false).map((item) => item.id).join(","), "1,2");
  const moved = moveShortcut(second, "2", -1);
  assert.equal(visibleShortcuts(moved, "", false)[0].id, "2");
  assert.equal(moveShortcut(moved, "2", -1).find((item) => item.id === "2")?.order, moved.find((item) => item.id === "2")?.order);
  const pinned = second.map((item) => (item.id === "2" ? { ...item, pinned: true } : item));
  assert.equal(visibleShortcuts(pinned, "", false)[0].id, "2");
  assert.equal(visibleShortcuts(pinned, "people", false)[0].section, "customers");
  assert.equal(visibleShortcuts(pinned.map((item) => ({ ...item, hidden: item.id === "1" })), "", true)[0].name, "People");
  assert.deepEqual(readShortcuts([{ id: "9", name: "", section: "customers" }, { id: "1", name: "People", section: "nope" }, { id: "2", name: "People", section: "kyc" }]).map((item) => item.id), ["2"]);

  const rows = [
    { id: "a", label: "Ada", status: " PENDING " },
    { id: "b", label: "Bea", status: "PENDING" },
    { id: "c", label: "Cid", status: { status: "APPROVED" } },
    { id: "d", label: "Dot", status: null },
    { id: "e", label: "Eve" },
  ];
  assert.equal(statusText(" PENDING "), "PENDING");
  assert.equal(statusText(undefined), "");
  assert.deepEqual(statusLines(rows), [
    { status: "", count: 2 },
    { status: "APPROVED", count: 1 },
    { status: "PENDING", count: 2 },
  ]);
  assert.deepEqual(namedStatuses(rows), ["APPROVED", "PENDING"]);
  assert.equal(namedStatuses([{ status: null }]).includes("REJECTED"), false);
  assert.deepEqual(visibleDeposits(rows, "PENDING", false, "ada").map((row) => row.id), ["a"]);
  assert.deepEqual(visibleDeposits(rows, "", true, "").map((row) => row.id), ["d", "e"]);
  assert.equal(visibleDeposits(rows, "APPROVED", false, "").some((row) => row.id === "d"), false);
  assert.deepEqual(readHiddenStatuses(["PENDING", "Invented", ""], ["PENDING", "APPROVED"]), ["PENDING"]);
  assert.deepEqual(toggleStatus(["PENDING"], "APPROVED", ["PENDING", "APPROVED"]), ["PENDING", "APPROVED"]);
  assert.deepEqual(visibleStatuses(["PENDING", "APPROVED"], ["APPROVED"], false), ["PENDING"]);
  assert.equal(activeStatus("APPROVED", ["PENDING"]), "");

  const copy = Object.keys(RL_EN).sort();
  assert.deepEqual(Object.keys(RL_TR).sort(), copy);
  assert.deepEqual(Object.keys(RL_DE).sort(), copy);
  assert.deepEqual(Object.keys(RL_RU).sort(), copy);
  assert.deepEqual(Object.keys(RL_AR).sort(), copy);
  assert.notEqual(RL_TR.rlTitle, RL_EN.rlTitle);
  assert.notEqual(RL_DE.dzHint, RL_EN.dzHint);
  assert.notEqual(RL_RU.dzBlank, RL_EN.dzBlank);
  assert.notEqual(RL_AR.rlUnknown, RL_EN.rlUnknown);
  assert.equal(crmv3Text("en", "rlTitle"), "Pin rail");
  assert.equal(crmv3Text("tr", "dzTitle"), RL_TR.dzTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-pin-rail", "de"), "Pin-Leiste");
  assert.equal(keyTitle("crmv3-dep-status-hide", "tr"), "Durum bakışı");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "pinrail"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "depstatus"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("pinrail"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("depstatus"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("pinrail")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "money" && (group.ids as readonly string[]).includes("depstatus")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-pin-rail/);
  assert.match(css, /\.c3-dep-status/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/rail.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.match(view, /\/api\/admin\/deposits\?take=40/);
  assert.match(view, /data-pin-rail/);
  assert.match(view, /data-dep-status/);
  assert.match(view, /RAIL_KEY/);
  assert.match(view, /DEP_STATUS_KEY/);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "pinrail"/);
  assert.match(app, /view === "depstatus"/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round96 tests passed");
}

main();
