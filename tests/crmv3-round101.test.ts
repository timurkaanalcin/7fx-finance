/**
 * CRM v3 draft stash and document type mix.
 * Run: npx tsx tests/crmv3-round101.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DF_AR, DF_DE, DF_EN, DF_RU, DF_TR } from "../src/lib/crmv3/copy-draft";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import {
  DRAFT_KEY,
  MIX_KEY,
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
} from "../src/lib/crmv3/drafts";

const ROOT = path.resolve(__dirname, "..");

function main() {
  assert.equal(DRAFT_KEY, "crmv3-draft-stash");
  assert.equal(MIX_KEY, "crmv3-doc-mix-hide");
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

  const copy = Object.keys(DF_EN).sort();
  assert.deepEqual(Object.keys(DF_TR).sort(), copy);
  assert.deepEqual(Object.keys(DF_DE).sort(), copy);
  assert.deepEqual(Object.keys(DF_RU).sort(), copy);
  assert.deepEqual(Object.keys(DF_AR).sort(), copy);
  assert.notEqual(DF_TR.dfTitle, DF_EN.dfTitle);
  assert.notEqual(DF_DE.kmHint, DF_EN.kmHint);
  assert.notEqual(DF_RU.kmBlank, DF_EN.kmBlank);
  assert.notEqual(DF_AR.dfBlank, DF_EN.dfBlank);
  assert.equal(crmv3Text("en", "dfTitle"), "Draft stash");
  assert.equal(crmv3Text("tr", "kmTitle"), DF_TR.kmTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-draft-stash", "de"), "Entwurfsfach");
  assert.equal(keyTitle("crmv3-doc-mix-hide", "tr"), "Tür karışımı");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "draftstash"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "doctypemix"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("draftstash"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("doctypemix"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("draftstash")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "compliance" && (group.ids as readonly string[]).includes("doctypemix")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-draft-stash/);
  assert.match(css, /\.c3-doc-mix/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/drafts.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes('?? "OTHER"'), false);
  assert.equal(view.includes("row.kind"), false);
  assert.match(view, /\/api\/admin\/documents\?take=40/);
  assert.match(view, /data-draft-stash/);
  assert.match(view, /data-doc-mix/);
  assert.match(view, /DRAFT_KEY/);
  assert.match(view, /MIX_KEY/);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "draftstash"/);
  assert.match(app, /view === "doctypemix"/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round101 tests passed");
}

main();
