/**
 * Supply notes and KYC statuses.
 * Run: npx tsx tests/crmv4-round124.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND124_COPY } from "../src/lib/crmv4/copy-round124";
import { crmv4Text } from "../src/lib/crmv4/copy";
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
} from "../src/lib/crmv4/round124";

function main() {
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

  const copy = Object.keys(ROUND124_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND124_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "splTitle"), "Supply notes");
  assert.equal(crmv4Text("tr", "kysTitle"), ROUND124_COPY.tr.kysTitle);
  assert.equal(crmv4Text("de", "splBin"), ROUND124_COPY.de.splBin);
  assert.equal(crmv4Text("ru", "kysBlank"), ROUND124_COPY.ru.kysBlank);
  assert.equal(crmv4Text("ar", "kysBoard"), ROUND124_COPY.ar.kysBoard);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-supply/);
  assert.match(css, /\.c4-kyc-sg/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round124.tsx"), "utf8");
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
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "supply"/);
  assert.match(app, /view === "kycsg"/);
  console.log("crmv4 round124 tests passed");
}

main();
