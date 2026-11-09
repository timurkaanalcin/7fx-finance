/**
 * Coat check notes and KYC file statuses.
 * Run: npx tsx tests/crmv4-round129.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND129_COPY } from "../src/lib/crmv4/copy-round129";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeFile,
  addNote,
  fileLines,
  fileText,
  hookLabel,
  namedFiles,
  noteText,
  readHiddenFiles,
  readNotes,
  resetNotes,
  setNoteHidden,
  toggleFile,
  toggleNotePin,
  visibleDocs,
  visibleFiles,
  visibleNotes,
} from "../src/lib/crmv4/round129";

function main() {
  assert.equal(noteText("  Hook\nA  "), "Hook A");
  assert.equal(noteText("   "), "");
  assert.equal(noteText("x".repeat(140)).length, 120);
  assert.equal(hookLabel("  Ticket 12  "), "Ticket 12");
  assert.equal(hookLabel("   "), "");
  assert.equal(hookLabel("y".repeat(50)).length, 40);
  assert.deepEqual(readNotes([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Wool coat", hook: "  ", pinned: 1 }, "nope"]), [
    { id: "2", text: "Wool coat", hook: "", pinned: false, hidden: false },
  ]);
  const saved = addNote([], { id: "a", text: " Navy coat ", hook: " Hook 4 " });
  assert.deepEqual(saved, [{ id: "a", text: "Navy coat", hook: "Hook 4", pinned: false, hidden: false }]);
  assert.equal(addNote(saved, { id: "b", text: "  " }).length, 1);
  assert.equal(addNote(saved, { id: "c", text: "Navy coat" }).length, 1);
  assert.equal(addNote(saved, { id: "a", text: "Other hook" }).length, 1);
  const pinned = toggleNotePin(saved, "a");
  assert.equal(pinned[0].pinned, true);
  const hidden = setNoteHidden(pinned, "a", true);
  assert.equal(hidden[0].hidden, true);
  assert.deepEqual(visibleNotes(pinned, false, "navy").map((note) => note.id), ["a"]);
  assert.deepEqual(visibleNotes(pinned, false, "hook"), []);
  assert.deepEqual(visibleNotes(hidden, false, ""), []);
  assert.deepEqual(visibleNotes(hidden, true, "").map((note) => note.id), ["a"]);
  assert.deepEqual(resetNotes(), []);
  const many = Array.from({ length: 41 }, (_, index) => ({ id: `n${index}`, text: `Note ${index}`, hook: "" }));
  assert.equal(readNotes(many).length, 40);

  assert.equal(fileText(" APPROVED "), "APPROVED");
  assert.equal(fileText({ kyc: " PENDING " }), "PENDING");
  assert.equal(fileText({ file: " REJECTED " }), "REJECTED");
  assert.equal(fileText(""), "");
  assert.equal(fileText(1 as never), "");
  assert.equal(fileText({ status: "APPROVED" }), "");
  assert.equal(fileText({ docType: "PASSPORT" }), "");
  assert.equal(fileText({ type: "ID" }), "");
  const rows = [
    { id: "d1", label: "Ada", file: "APPROVED" },
    { id: "d2", label: "Bea", file: { kyc: "PENDING" } },
    { id: "d3", label: "Cid", file: "APPROVED" },
    { id: "d4", label: "Dot", file: "" },
    { id: "d5", label: "Eve", file: { status: "REJECTED" } as never },
  ];
  assert.deepEqual(fileLines(rows), [
    { file: "", count: 2 },
    { file: "APPROVED", count: 2 },
    { file: "PENDING", count: 1 },
  ]);
  assert.deepEqual(namedFiles(rows), ["APPROVED", "PENDING"]);
  assert.deepEqual(visibleDocs(rows, "APPROVED", false, "ada").map((row) => row.id), ["d1"]);
  assert.deepEqual(visibleDocs(rows, "", true, "").map((row) => row.id), ["d4", "d5"]);
  assert.deepEqual(visibleDocs(rows, "APPROVED", false, "100"), []);
  assert.deepEqual(readHiddenFiles(["APPROVED", "OLD", ""], ["APPROVED", "PENDING"]), ["APPROVED"]);
  assert.deepEqual(toggleFile(["APPROVED"], "OLD", ["APPROVED"]), ["APPROVED"]);
  assert.deepEqual(visibleFiles(["APPROVED", "PENDING"], ["PENDING"], false), ["APPROVED"]);
  assert.equal(activeFile("PENDING", ["APPROVED"]), "");
  assert.equal(fileLines(rows).every((line) => !("amount" in line) && !("currency" in line)), true);

  const copy = Object.keys(ROUND129_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND129_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "cctTitle"), "Coat check notes");
  assert.equal(crmv4Text("tr", "kflTitle"), ROUND129_COPY.tr.kflTitle);
  assert.equal(crmv4Text("de", "cctHook"), ROUND129_COPY.de.cctHook);
  assert.equal(crmv4Text("ru", "kflBlank"), ROUND129_COPY.ru.kflBlank);
  assert.equal(crmv4Text("ar", "kflBoard"), ROUND129_COPY.ar.kflBoard);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-coat/);
  assert.match(css, /\.c4-kyc-file/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round129.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("fetch("), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes("currency"), false);
  assert.equal(view.includes("balance"), false);
  assert.equal(view.includes("saleStatus"), false);
  assert.equal(view.includes("docType"), false);
  assert.equal(view.includes("retentionStatus"), false);
  assert.equal(view.includes("row.status"), false);
  assert.match(view, /userDocumentsStatus/);
  assert.match(view, /\/api\/admin\/documents\?take=40/);
  assert.match(view, /data-coat/);
  assert.match(view, /data-kyc-file/);
  assert.match(view, /data-logo="mono"/);
  assert.match(view, /kyc/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "coat"/);
  assert.match(app, /view === "kycfile"/);
  console.log("crmv4 round129 tests passed");
}

main();
