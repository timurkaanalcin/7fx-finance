/**
 * Parking notes and lead sources.
 * Run: npx tsx tests/crmv3-round118.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { PK_AR, PK_DE, PK_EN, PK_RU, PK_TR } from "../src/lib/crmv3/copy-parkspot";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { keyTitle } from "../src/lib/crmv3/insights";
import { LEAD_SOURCE_KEY, PARK_KEY } from "../src/lib/crmv3/parkspot";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
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
} from "../src/lib/crmv3/parkspot";

function main() {
  assert.equal(PARK_KEY, "crmv3-parking-notes");
  assert.equal(LEAD_SOURCE_KEY, "crmv3-lead-src-hide");
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

  const copy = Object.keys(PK_EN).sort();
  for (const table of [PK_TR, PK_DE, PK_RU, PK_AR]) assert.deepEqual(Object.keys(table).sort(), copy);
  assert.equal(crmv3Text("en", "bayTitle"), "Parking notes");
  assert.equal(crmv3Text("tr", "lsgTitle"), PK_TR.lsgTitle);
  assert.equal(crmv3Text("de", "bayPlace"), PK_DE.bayPlace);
  assert.equal(crmv3Text("ru", "lsgBlank"), PK_RU.lsgBlank);
  assert.equal(crmv3Text("ar", "lsgLeads"), PK_AR.lsgLeads);
  assert.equal(keyTitle("crmv3-parking-notes", "de"), "Parknotizen");
  assert.equal(keyTitle("crmv3-lead-src-hide", "ar"), "مصادر العملاء المحتملين");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "parkspot"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "leadsrc"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("parkspot"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("leadsrc"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("parkspot")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "work" && (group.ids as readonly string[]).includes("leadsrc")), true);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-park-spot/);
  assert.match(css, /\.c3-lead-src/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv3/desk/parkspot.tsx"), "utf8");
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
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "parkspot"/);
  assert.match(app, /view === "leadsrc"/);
  console.log("crmv3 round118 tests passed");
}

main();
