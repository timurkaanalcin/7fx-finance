/**
 * Parking notes and lead sources.
 * Run: npx tsx tests/crmv4-round118.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND118_COPY } from "../src/lib/crmv4/copy-round118";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  SOURCE_FIELDS,
  activeSource,
  addNote,
  bayLabel,
  namedSources,
  noteText,
  readHiddenSources,
  readNotes,
  resetNotes,
  setNoteHidden,
  sourceLines,
  sourceText,
  toggleNotePin,
  toggleSource,
  visibleLeads,
  visibleNotes,
  visibleSources,
} from "../src/lib/crmv4/round118";

function main() {
  assert.equal(noteText("  Bay\nA  "), "Bay A");
  assert.equal(noteText("   "), "");
  assert.equal(noteText("x".repeat(140)).length, 120);
  assert.equal(bayLabel("  Lot 2  "), "Lot 2");
  assert.equal(bayLabel("   "), "");
  assert.equal(bayLabel("y".repeat(50)).length, 40);
  assert.deepEqual(readNotes([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Parked", bay: "  ", pinned: 1 }, "nope"]), [
    { id: "2", text: "Parked", bay: "", pinned: false, hidden: false },
  ]);
  const saved = addNote([], { id: "a", text: " Desk bay ", bay: " Lot 2 " });
  assert.deepEqual(saved, [{ id: "a", text: "Desk bay", bay: "Lot 2", pinned: false, hidden: false }]);
  assert.equal(addNote(saved, { id: "b", text: "  " }).length, 1);
  assert.equal(addNote(saved, { id: "c", text: "Desk bay" }).length, 1);
  assert.equal(addNote(saved, { id: "a", text: "Other bay" }).length, 1);
  const pinned = toggleNotePin(saved, "a");
  assert.equal(pinned[0].pinned, true);
  const hidden = setNoteHidden(pinned, "a", true);
  assert.equal(hidden[0].hidden, true);
  assert.deepEqual(visibleNotes(pinned, false, "desk").map((note) => note.id), ["a"]);
  assert.deepEqual(visibleNotes(pinned, false, "lot"), []);
  assert.deepEqual(visibleNotes(hidden, false, ""), []);
  assert.deepEqual(visibleNotes(hidden, true, "").map((note) => note.id), ["a"]);
  assert.deepEqual(resetNotes(), []);
  const many = Array.from({ length: 41 }, (_, index) => ({ id: `n${index}`, text: `Note ${index}`, bay: "" }));
  assert.equal(readNotes(many).length, 40);

  assert.equal(sourceText(" WEB "), "WEB");
  assert.equal(sourceText({ campaign: "  Spring " }), "Spring");
  assert.equal(sourceText({ campaign: "  ", affiliateA: "Desk" }), "Desk");
  assert.equal(sourceText({ affiliateB: "", affiliateC: "  ", referralCodeUsed: "CODE" }), "CODE");
  assert.equal(sourceText(""), "");
  assert.equal(sourceText(1 as never), "");
  assert.equal(sourceText({ leadSource: "ADS", source: "WEB" } as never), "");
  assert.equal(sourceText({ leadInvalidSource: "import" } as never), "");
  assert.equal(sourceText({ campaign: 4 } as never), "");
  assert.deepEqual(SOURCE_FIELDS.includes("campaign" as never), true);
  const rows = [
    { id: "u1", label: "Ada", source: { campaign: "WEB" } },
    { id: "u2", label: "Bea", source: { affiliateA: "DESK" } },
    { id: "u3", label: "Cid", source: { campaign: "WEB" } },
    { id: "u4", label: "Dot", source: "" },
    { id: "u5", label: "Eve", source: { leadSource: "ADS" } as never },
  ];
  assert.deepEqual(sourceLines(rows), [
    { source: "", count: 2 },
    { source: "DESK", count: 1 },
    { source: "WEB", count: 2 },
  ]);
  assert.deepEqual(namedSources(rows), ["DESK", "WEB"]);
  assert.deepEqual(visibleLeads(rows, "WEB", false, "ada").map((row) => row.id), ["u1"]);
  assert.deepEqual(visibleLeads(rows, "", true, "").map((row) => row.id), ["u4", "u5"]);
  assert.deepEqual(visibleLeads(rows, "WEB", false, "desk"), []);
  assert.deepEqual(readHiddenSources(["WEB", "NEW", ""], ["WEB", "DESK"]), ["WEB"]);
  assert.deepEqual(toggleSource(["WEB"], "NEW", ["WEB"]), ["WEB"]);
  assert.deepEqual(visibleSources(["WEB", "DESK"], ["DESK"], false), ["WEB"]);
  assert.equal(activeSource("DESK", ["WEB"]), "");
  assert.equal(sourceLines(rows).every((line) => !("amount" in line) && !("balance" in line) && !("currency" in line)), true);

  const copy = Object.keys(ROUND118_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND118_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "bayTitle"), "Parking notes");
  assert.equal(crmv4Text("tr", "lsgTitle"), ROUND118_COPY.tr.lsgTitle);
  assert.equal(crmv4Text("de", "bayPlace"), ROUND118_COPY.de.bayPlace);
  assert.equal(crmv4Text("ru", "lsgBlank"), ROUND118_COPY.ru.lsgBlank);
  assert.equal(crmv4Text("ar", "lsgLeads"), ROUND118_COPY.ar.lsgLeads);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-park-spot/);
  assert.match(css, /\.c4-lead-src/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round118.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("fetch("), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes("balance"), false);
  assert.equal(view.includes("currency"), false);
  assert.match(view, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(view, /data-park-spot/);
  assert.match(view, /data-lead-src/);
  assert.match(view, /data-logo="mono"/);
  assert.match(view, /leads/);
  assert.match(view, /customers/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "parkspot"/);
  assert.match(app, /view === "leadsrc"/);
  console.log("crmv4 round118 tests passed");
}

main();
