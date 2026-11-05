/**
 * Supply notes and KYC statuses.
 * Run: npx tsx tests/crmv3-round124.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { SU_AR, SU_DE, SU_EN, SU_RU, SU_TR } from "../src/lib/crmv3/copy-supply";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { keyTitle } from "../src/lib/crmv3/insights";
import { KYC_STATUS_KEY, SUPPLY_KEY } from "../src/lib/crmv3/supply";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import {
  activeStatus,
  addNote,
  binLabel,
  namedStatuses,
  noteText,
  readHiddenStatuses,
  readNotes,
  resetNotes,
  setNoteHidden,
  statusLines,
  statusText,
  toggleNotePin,
  toggleStatus,
  visibleCustomers,
  visibleNotes,
  visibleStatuses,
} from "../src/lib/crmv3/supply";

function main() {
  assert.equal(SUPPLY_KEY, "crmv3-supply-notes");
  assert.equal(KYC_STATUS_KEY, "crmv3-kyc-sg-hide");
  assert.equal(noteText("  Toner\nA  "), "Toner A");
  assert.equal(noteText("   "), "");
  assert.equal(noteText("x".repeat(140)).length, 120);
  assert.equal(binLabel("  Bin 3  "), "Bin 3");
  assert.equal(binLabel("   "), "");
  assert.equal(binLabel("y".repeat(50)).length, 40);
  assert.deepEqual(readNotes([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Restock", bin: "  ", pinned: 1 }, "nope"]), [
    { id: "2", text: "Restock", bin: "", pinned: false, hidden: false },
  ]);
  const saved = addNote([], { id: "a", text: " Front shelf ", bin: " Bin 3 " });
  assert.deepEqual(saved, [{ id: "a", text: "Front shelf", bin: "Bin 3", pinned: false, hidden: false }]);
  assert.equal(addNote(saved, { id: "b", text: "  " }).length, 1);
  assert.equal(addNote(saved, { id: "c", text: "Front shelf" }).length, 1);
  assert.equal(addNote(saved, { id: "a", text: "Other bin" }).length, 1);
  const pinned = toggleNotePin(saved, "a");
  assert.equal(pinned[0].pinned, true);
  const hidden = setNoteHidden(pinned, "a", true);
  assert.equal(hidden[0].hidden, true);
  assert.deepEqual(visibleNotes(pinned, false, "front").map((note) => note.id), ["a"]);
  assert.deepEqual(visibleNotes(pinned, false, "bin"), []);
  assert.deepEqual(visibleNotes(hidden, false, ""), []);
  assert.deepEqual(visibleNotes(hidden, true, "").map((note) => note.id), ["a"]);
  assert.deepEqual(resetNotes(), []);
  const many = Array.from({ length: 41 }, (_, index) => ({ id: `n${index}`, text: `Note ${index}`, bin: "" }));
  assert.equal(readNotes(many).length, 40);

  assert.equal(statusText(" PENDING "), "PENDING");
  assert.equal(statusText({ status: " APPROVED " }), "APPROVED");
  assert.equal(statusText(""), "");
  assert.equal(statusText(1 as never), "");
  assert.equal(statusText({ validationStatus: "OK" } as never), "");
  const rows = [
    { id: "u1", label: "Ada", status: "PENDING" },
    { id: "u2", label: "Bea", status: { status: "APPROVED" } },
    { id: "u3", label: "Cid", status: "PENDING" },
    { id: "u4", label: "Dot", status: "" },
    { id: "u5", label: "Eve", status: { saleStatus: "NEW" } as never },
  ];
  assert.deepEqual(statusLines(rows), [
    { status: "", count: 2 },
    { status: "APPROVED", count: 1 },
    { status: "PENDING", count: 2 },
  ]);
  assert.deepEqual(namedStatuses(rows), ["APPROVED", "PENDING"]);
  assert.deepEqual(visibleCustomers(rows, "PENDING", false, "ada").map((row) => row.id), ["u1"]);
  assert.deepEqual(visibleCustomers(rows, "", true, "").map((row) => row.id), ["u4", "u5"]);
  assert.deepEqual(visibleCustomers(rows, "PENDING", false, "100"), []);
  assert.deepEqual(readHiddenStatuses(["PENDING", "NEW", ""], ["PENDING", "APPROVED"]), ["PENDING"]);
  assert.deepEqual(toggleStatus(["PENDING"], "NEW", ["PENDING"]), ["PENDING"]);
  assert.deepEqual(visibleStatuses(["PENDING", "APPROVED"], ["APPROVED"], false), ["PENDING"]);
  assert.equal(activeStatus("APPROVED", ["PENDING"]), "");
  assert.equal(statusLines(rows).every((line) => !("amount" in line) && !("currency" in line)), true);

  const copy = Object.keys(SU_EN).sort();
  for (const table of [SU_TR, SU_DE, SU_RU, SU_AR]) assert.deepEqual(Object.keys(table).sort(), copy);
  assert.equal(crmv3Text("en", "splTitle"), "Supply notes");
  assert.equal(crmv3Text("tr", "kysTitle"), SU_TR.kysTitle);
  assert.equal(crmv3Text("de", "splBin"), SU_DE.splBin);
  assert.equal(crmv3Text("ru", "kysBlank"), SU_RU.kysBlank);
  assert.equal(crmv3Text("ar", "kysBoard"), SU_AR.kysBoard);
  assert.equal(keyTitle("crmv3-supply-notes", "de"), "Vorratsnotizen");
  assert.equal(keyTitle("crmv3-kyc-sg-hide", "ar"), "حالات التحقق");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "supply"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "kycsg"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("supply"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("kycsg"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("supply")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "compliance" && (group.ids as readonly string[]).includes("kycsg")), true);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-supply/);
  assert.match(css, /\.c3-kyc-sg/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv3/desk/supply.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("fetch("), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes("currency"), false);
  assert.equal(view.includes("balance"), false);
  assert.equal(view.includes("validationStatus"), false);
  assert.match(view, /documentsStatus/);
  assert.match(view, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(view, /data-supply/);
  assert.match(view, /data-kyc-sg/);
  assert.match(view, /data-logo="mono"/);
  assert.match(view, /kyc/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "supply"/);
  assert.match(app, /view === "kycsg"/);
  console.log("crmv3 round124 tests passed");
}

main();
