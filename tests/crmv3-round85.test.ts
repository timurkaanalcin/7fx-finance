/**
 * CRM v3 voice tray and withdrawal reason glance.
 * Run: npx tsx tests/crmv3-round85.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { VS_AR, VS_DE, VS_EN, VS_RU, VS_TR } from "../src/lib/crmv3/copy-voice";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import {
  REASON_KEY,
  VOICE_KEY,
  activeReason,
  addSnippet,
  namedReasons,
  readHiddenReasons,
  readSnippets,
  reasonLines,
  reasonText,
  toggleReason,
  visibleReasons,
  visibleSnippets,
  visibleWithdrawals,
} from "../src/lib/crmv3/voice";

const ROOT = path.resolve(__dirname, "..");

function main() {
  assert.equal(VOICE_KEY, "crmv3-voice-snippets");
  assert.equal(REASON_KEY, "crmv3-reason-hide");
  assert.equal(addSnippet([], { id: "1", text: "   ", at: "t" }).length, 0);
  const saved = addSnippet([], { id: "1", text: " Thanks for the call ", at: "2026-11-05T10:00:00Z" });
  assert.equal(saved[0].text, "Thanks for the call");
  assert.equal(addSnippet(saved, { id: "1", text: "Again", at: "t" }).length, 1);
  const later = addSnippet(saved, { id: "2", text: "Second line", at: "2026-11-05T11:00:00Z" });
  const pinned = later.map((item) => (item.id === "2" ? { ...item, pinned: true } : item));
  assert.equal(visibleSnippets(pinned, "", false)[0].id, "2");
  assert.equal(visibleSnippets(pinned, "thanks", false)[0].id, "1");
  assert.equal(visibleSnippets(pinned, "zzz", false).length, 0);
  assert.equal(visibleSnippets(pinned.map((item) => ({ ...item, hidden: item.id === "1" })), "", true)[0].id, "1");
  assert.deepEqual(readSnippets([{ id: "9", text: "  " }, { id: "1", text: "Thanks" }]).map((item) => item.id), ["1"]);

  const rows = [
    { id: "a", label: "Ada", note: " Rent " },
    { id: "b", label: "Bea", note: "Rent" },
    { id: "c", label: "Cid", note: "" },
    { id: "d", label: "Dot", note: "   " },
    { id: "e", label: "Eve", note: "School" },
  ];
  assert.equal(reasonText("  Rent "), "Rent");
  assert.deepEqual(reasonLines(rows), [
    { reason: "", count: 2 },
    { reason: "Rent", count: 2 },
    { reason: "School", count: 1 },
  ]);
  assert.deepEqual(namedReasons(rows), ["Rent", "School"]);
  assert.deepEqual(visibleWithdrawals(rows, "Rent", false, "ada").map((row) => row.id), ["a"]);
  assert.deepEqual(visibleWithdrawals(rows, "", true, "").map((row) => row.id), ["c", "d"]);
  assert.equal(visibleWithdrawals(rows, "School", false, "").some((row) => row.id === "c"), false);
  assert.deepEqual(readHiddenReasons(["Rent", "Made up", ""], ["Rent", "School"]), ["Rent"]);
  assert.deepEqual(toggleReason(["Rent"], "School", ["Rent", "School"]), ["Rent", "School"]);
  assert.deepEqual(visibleReasons(["Rent", "School"], ["School"], false), ["Rent"]);
  assert.equal(activeReason("School", ["Rent"]), "");
  assert.equal(activeReason(" Rent ", ["Rent"]), "Rent");

  const copy = Object.keys(VS_EN).sort();
  assert.deepEqual(Object.keys(VS_TR).sort(), copy);
  assert.deepEqual(Object.keys(VS_DE).sort(), copy);
  assert.deepEqual(Object.keys(VS_RU).sort(), copy);
  assert.deepEqual(Object.keys(VS_AR).sort(), copy);
  assert.notEqual(VS_TR.vsTitle, VS_EN.vsTitle);
  assert.notEqual(VS_DE.wrHint, VS_EN.wrHint);
  assert.notEqual(VS_RU.wrBlank, VS_EN.wrBlank);
  assert.notEqual(VS_AR.vsCopied, VS_EN.vsCopied);
  assert.equal(crmv3Text("en", "vsTitle"), "Voice tray");
  assert.equal(crmv3Text("tr", "wrTitle"), VS_TR.wrTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-voice-snippets", "de"), "Sprachablage");
  assert.equal(keyTitle("crmv3-reason-hide", "tr"), "Gerekçe bakışı");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "voicetray"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "wdreason"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("voicetray"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("wdreason"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("voicetray")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "money" && (group.ids as readonly string[]).includes("wdreason")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-voice-tray/);
  assert.match(css, /\.c3-reason-glance/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/voice.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.match(view, /clipboard\.writeText/);
  assert.match(view, /\/api\/admin\/withdrawals\?take=40/);
  assert.match(view, /data-voice-tray/);
  assert.match(view, /data-reason-glance/);
  assert.match(view, /VOICE_KEY/);
  assert.match(view, /REASON_KEY/);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "voicetray"/);
  assert.match(app, /view === "wdreason"/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round85 tests passed");
}

main();
