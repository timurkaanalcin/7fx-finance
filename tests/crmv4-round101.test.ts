/**
 * Draft stash and document type mix.
 * Run: npx tsx tests/crmv4-round101.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND101_COPY } from "../src/lib/crmv4/copy-round101";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeMix,
  addDraft,
  draftText,
  mixLines,
  mixType,
  namedMix,
  readDrafts,
  readHiddenMix,
  toggleMix,
  visibleDocs,
  visibleDrafts,
  visibleMix,
} from "../src/lib/crmv4/round101";

function main() {
  assert.equal(draftText("  "), "");
  assert.equal(draftText(" Call\nAda "), "Call Ada");
  assert.equal(draftText("x".repeat(90)).length, 80);
  assert.equal(addDraft([], { id: "1", text: "   ", at: "t" }).length, 0);
  const saved = addDraft([], { id: "1", text: "Call Ada", at: "2026-11-05T10:00:00Z" });
  assert.equal(addDraft(saved, { id: "2", text: "Call Ada", at: "t" }).length, 1);
  const later = addDraft(saved, { id: "2", text: "Hold the file", at: "2026-11-05T11:00:00Z" });
  const pinned = later.map((draft) => (draft.id === "1" ? { ...draft, pinned: true } : draft));
  assert.equal(visibleDrafts(pinned, "", false)[0].id, "1");
  assert.equal(visibleDrafts(pinned, "hold", false)[0].text, "Hold the file");
  assert.equal(visibleDrafts(pinned, "hold", false).some((draft) => draft.id === "1"), false);
  assert.equal(visibleDrafts(pinned.map((draft) => ({ ...draft, hidden: draft.id === "2" })), "", true)[0].text, "Hold the file");
  assert.deepEqual(readDrafts([{ id: "9", text: "  " }, { id: "1", text: "Call Ada" }, { id: "3", text: "Call Ada" }]).map((draft) => draft.id), ["1"]);

  const rows = [
    { id: "a", label: "Ada", docType: " ID " },
    { id: "b", label: "Bea", docType: "ID" },
    { id: "c", label: "Cid", docType: "PASSPORT" },
    { id: "d", label: "Dot", docType: "" },
    { id: "e", label: "Eve", docType: null },
  ];
  assert.equal(mixType(" ID "), "ID");
  assert.equal(mixType({ docType: "POA" }), "POA");
  assert.equal(mixType({ kind: "PASSPORT" }), "");
  assert.equal(mixType(null), "");
  assert.deepEqual(mixLines(rows), [
    { type: "", count: 2 },
    { type: "ID", count: 2 },
    { type: "PASSPORT", count: 1 },
  ]);
  assert.deepEqual(namedMix(rows), ["ID", "PASSPORT"]);
  assert.equal(namedMix([{ docType: null }]).includes("OTHER"), false);
  assert.deepEqual(visibleDocs(rows, "ID", false, "bea").map((row) => row.id), ["b"]);
  assert.deepEqual(visibleDocs(rows, "", true, "").map((row) => row.id), ["d", "e"]);
  assert.deepEqual(readHiddenMix(["ID", "OTHER", ""], ["ID", "PASSPORT"]), ["ID"]);
  assert.deepEqual(toggleMix(["ID"], "SELFIE", ["ID"]), ["ID"]);
  assert.deepEqual(visibleMix(["ID", "PASSPORT"], ["PASSPORT"], false), ["ID"]);
  assert.equal(activeMix("PASSPORT", ["ID"]), "");

  const copy = Object.keys(ROUND101_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND101_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "dfTitle"), "Draft stash");
  assert.equal(crmv4Text("tr", "kmTitle"), ROUND101_COPY.tr.kmTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-draft-stash/);
  assert.match(css, /\.c4-doc-mix/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round101.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes('?? "OTHER"'), false);
  assert.match(view, /\/api\/admin\/documents\?take=40/);
  assert.match(view, /data-draft-stash/);
  assert.match(view, /data-doc-mix/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "draftstash"/);
  assert.match(app, /view === "doctypemix"/);
  console.log("crmv4 round101 tests passed");
}

main();
