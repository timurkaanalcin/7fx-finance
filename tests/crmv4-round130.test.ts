/**
 * Concierge notes and retention statuses.
 * Run: npx tsx tests/crmv4-round130.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND130_COPY } from "../src/lib/crmv4/copy-round130";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeRetain,
  addNote,
  errandLabel,
  namedRetains,
  noteText,
  readHiddenRetains,
  readNotes,
  resetNotes,
  retainLines,
  retainText,
  setNoteHidden,
  toggleNotePin,
  toggleRetain,
  visibleCustomers,
  visibleNotes,
  visibleRetains,
} from "../src/lib/crmv4/round130";

function main() {
  assert.equal(noteText("  Bell\nA  "), "Bell A");
  assert.equal(noteText("   "), "");
  assert.equal(noteText("x".repeat(140)).length, 120);
  assert.equal(errandLabel("  Keys  "), "Keys");
  assert.equal(errandLabel("   "), "");
  assert.equal(errandLabel("y".repeat(50)).length, 40);
  assert.deepEqual(readNotes([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Call the lobby", errand: "  ", pinned: 1 }, "nope"]), [
    { id: "2", text: "Call the lobby", errand: "", pinned: false, hidden: false },
  ]);
  const saved = addNote([], { id: "a", text: " Hold the taxi ", errand: " Door 2 " });
  assert.deepEqual(saved, [{ id: "a", text: "Hold the taxi", errand: "Door 2", pinned: false, hidden: false }]);
  assert.equal(addNote(saved, { id: "b", text: "  " }).length, 1);
  assert.equal(addNote(saved, { id: "c", text: "Hold the taxi" }).length, 1);
  assert.equal(addNote(saved, { id: "a", text: "Other errand" }).length, 1);
  const pinned = toggleNotePin(saved, "a");
  assert.equal(pinned[0].pinned, true);
  const hidden = setNoteHidden(pinned, "a", true);
  assert.equal(hidden[0].hidden, true);
  assert.deepEqual(visibleNotes(pinned, false, "taxi").map((note) => note.id), ["a"]);
  assert.deepEqual(visibleNotes(pinned, false, "door"), []);
  assert.deepEqual(visibleNotes(hidden, false, ""), []);
  assert.deepEqual(visibleNotes(hidden, true, "").map((note) => note.id), ["a"]);
  assert.deepEqual(resetNotes(), []);
  const many = Array.from({ length: 41 }, (_, index) => ({ id: `n${index}`, text: `Note ${index}`, errand: "" }));
  assert.equal(readNotes(many).length, 40);

  assert.equal(retainText(" ACTIVE "), "ACTIVE");
  assert.equal(retainText({ retain: " AT_RISK " }), "AT_RISK");
  assert.equal(retainText(""), "");
  assert.equal(retainText(1 as never), "");
  assert.equal(retainText({ saleStatus: "NEW" }), "");
  assert.equal(retainText({ documentsStatus: "APPROVED" }), "");
  assert.equal(retainText({ status: "PENDING" }), "");
  assert.equal(retainText({ role: "TRADER" }), "");
  const rows = [
    { id: "u1", label: "Ada", retain: "ACTIVE" },
    { id: "u2", label: "Bea", retain: { retain: "AT_RISK" } },
    { id: "u3", label: "Cid", retain: "ACTIVE" },
    { id: "u4", label: "Dot", retain: "" },
    { id: "u5", label: "Eve", retain: { saleStatus: "NEW" } as never },
  ];
  assert.deepEqual(retainLines(rows), [
    { retain: "", count: 2 },
    { retain: "ACTIVE", count: 2 },
    { retain: "AT_RISK", count: 1 },
  ]);
  assert.deepEqual(namedRetains(rows), ["ACTIVE", "AT_RISK"]);
  assert.deepEqual(visibleCustomers(rows, "ACTIVE", false, "ada").map((row) => row.id), ["u1"]);
  assert.deepEqual(visibleCustomers(rows, "", true, "").map((row) => row.id), ["u4", "u5"]);
  assert.deepEqual(visibleCustomers(rows, "ACTIVE", false, "100"), []);
  assert.deepEqual(readHiddenRetains(["ACTIVE", "OLD", ""], ["ACTIVE", "AT_RISK"]), ["ACTIVE"]);
  assert.deepEqual(toggleRetain(["ACTIVE"], "OLD", ["ACTIVE"]), ["ACTIVE"]);
  assert.deepEqual(visibleRetains(["ACTIVE", "AT_RISK"], ["AT_RISK"], false), ["ACTIVE"]);
  assert.equal(activeRetain("AT_RISK", ["ACTIVE"]), "");
  assert.equal(retainLines(rows).every((line) => !("amount" in line) && !("currency" in line)), true);

  const copy = Object.keys(ROUND130_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND130_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "cncTitle"), "Concierge notes");
  assert.equal(crmv4Text("tr", "rtnTitle"), ROUND130_COPY.tr.rtnTitle);
  assert.equal(crmv4Text("de", "cncErrand"), ROUND130_COPY.de.cncErrand);
  assert.equal(crmv4Text("ru", "rtnBlank"), ROUND130_COPY.ru.rtnBlank);
  assert.equal(crmv4Text("ar", "rtnBoard"), ROUND130_COPY.ar.rtnBoard);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-concierge/);
  assert.match(css, /\.c4-retain/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round130.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("fetch("), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes("currency"), false);
  assert.equal(view.includes("balance"), false);
  assert.equal(view.includes("saleStatus"), false);
  assert.equal(view.includes("documentsStatus"), false);
  assert.equal(view.includes("accountType"), false);
  assert.match(view, /retentionStatus/);
  assert.match(view, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(view, /data-concierge/);
  assert.match(view, /data-retain/);
  assert.match(view, /data-logo="mono"/);
  assert.match(view, /customers/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "concierge"/);
  assert.match(app, /view === "retstat"/);
  console.log("crmv4 round130 tests passed");
}

main();
