/**
 * Pin rail and deposit statuses.
 * Run: npx tsx tests/crmv4-round96.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND96_COPY } from "../src/lib/crmv4/copy-round96";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
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
} from "../src/lib/crmv4/round96";

function main() {
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

  const copy = Object.keys(ROUND96_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND96_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "rlTitle"), "Pin rail");
  assert.equal(crmv4Text("tr", "dzTitle"), ROUND96_COPY.tr.dzTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-pin-rail/);
  assert.match(css, /\.c4-dep-status/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round96.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.match(view, /\/api\/admin\/deposits\?take=40/);
  assert.match(view, /data-pin-rail/);
  assert.match(view, /data-dep-status/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "pinrail"/);
  assert.match(app, /view === "depstatus"/);
  console.log("crmv4 round96 tests passed");
}

main();
