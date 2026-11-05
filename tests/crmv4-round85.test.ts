/**
 * Voice snippets and withdrawal reasons.
 * Run: npx tsx tests/crmv4-round85.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND85_COPY } from "../src/lib/crmv4/copy-round85";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
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
} from "../src/lib/crmv4/round85";

function main() {
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

  const copy = Object.keys(ROUND85_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND85_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "vsTitle"), "Voice tray");
  assert.equal(crmv4Text("tr", "wrTitle"), ROUND85_COPY.tr.wrTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-voice-tray/);
  assert.match(css, /\.c4-reason-glance/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round85.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.match(view, /clipboard\.writeText/);
  assert.match(view, /\/api\/admin\/withdrawals\?take=40/);
  assert.match(view, /data-voice-tray/);
  assert.match(view, /data-reason-glance/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "voicetray"/);
  assert.match(app, /view === "wdreason"/);
  console.log("crmv4 round85 tests passed");
}

main();
