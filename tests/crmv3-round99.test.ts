/**
 * CRM v3 watch words and customer language glance.
 * Run: npx tsx tests/crmv3-round99.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { WW_AR, WW_DE, WW_EN, WW_RU, WW_TR } from "../src/lib/crmv3/copy-watch";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import {
  LANG_KEY,
  WATCH_KEY,
  activeLanguage,
  addWord,
  highlightParts,
  languageLines,
  languageText,
  namedLanguages,
  readHiddenLanguages,
  readWords,
  toggleLanguage,
  visibleCustomers,
  visibleLanguages,
  visibleWords,
  wordText,
} from "../src/lib/crmv3/words";

const ROOT = path.resolve(__dirname, "..");

function main() {
  assert.equal(WATCH_KEY, "crmv3-watch-words");
  assert.equal(LANG_KEY, "crmv3-lang-hide");
  assert.equal(wordText("  "), "");
  assert.equal(wordText(" Desk\nquiet "), "Desk quiet");
  assert.equal(wordText("x".repeat(50)).length, 40);
  assert.equal(addWord([], { id: "1", text: "   ", at: "t" }).length, 0);
  const saved = addWord([], { id: "1", text: "Ada", at: "2026-11-05T10:00:00Z" });
  assert.equal(addWord(saved, { id: "2", text: "ada", at: "t" }).length, 1);
  const later = addWord(saved, { id: "2", text: "Lane", at: "2026-11-05T11:00:00Z" });
  const pinned = later.map((word) => (word.id === "1" ? { ...word, pinned: true } : word));
  assert.equal(visibleWords(pinned, "", false)[0].id, "1");
  assert.equal(visibleWords(pinned, "lane", false)[0].text, "Lane");
  assert.equal(visibleWords(pinned.map((word) => ({ ...word, hidden: word.id === "2" })), "", true)[0].text, "Lane");
  assert.deepEqual(readWords([{ id: "9", text: "  " }, { id: "1", text: "Ada" }, { id: "3", text: "ADA" }]).map((word) => word.id), ["1"]);
  const parts = highlightParts("Ada Lane", ["ada"]);
  assert.equal(parts.filter((part) => part.hit).map((part) => part.text).join(""), "Ada");
  assert.equal(highlightParts("Bea", ["ada"]).some((part) => part.hit), false);
  assert.equal(highlightParts("Ada Lane", []).some((part) => part.hit), false);

  const rows = [
    { id: "a", label: "Ada", language: " EN " },
    { id: "b", label: "Bea", language: "en" },
    { id: "c", label: "Cid", language: "", locale: "tr" },
    { id: "d", label: "Dot", language: null },
    { id: "e", label: "Eve" },
  ];
  assert.equal(languageText({ language: " EN " }), "EN");
  assert.equal(languageText({ language: "", locale: "tr" }), "tr");
  assert.equal(languageText({}), "");
  assert.deepEqual(languageLines(rows), [
    { language: "", count: 2 },
    { language: "en", count: 1 },
    { language: "EN", count: 1 },
    { language: "tr", count: 1 },
  ]);
  assert.deepEqual(namedLanguages(rows), ["en", "EN", "tr"]);
  assert.equal(namedLanguages([{ language: null }]).includes("en"), false);
  assert.deepEqual(visibleCustomers(rows, "en", false, "bea").map((row) => row.id), ["b"]);
  assert.deepEqual(visibleCustomers(rows, "", true, "").map((row) => row.id), ["d", "e"]);
  assert.equal(visibleCustomers(rows, "tr", false, "").some((row) => row.id === "d"), false);
  assert.deepEqual(readHiddenLanguages(["en", "Invented", ""], ["en", "tr"]), ["en"]);
  assert.deepEqual(toggleLanguage(["en"], "tr", ["en", "tr"]), ["en", "tr"]);
  assert.deepEqual(visibleLanguages(["en", "tr"], ["tr"], false), ["en"]);
  assert.equal(activeLanguage("tr", ["en"]), "");

  const copy = Object.keys(WW_EN).sort();
  assert.deepEqual(Object.keys(WW_TR).sort(), copy);
  assert.deepEqual(Object.keys(WW_DE).sort(), copy);
  assert.deepEqual(Object.keys(WW_RU).sort(), copy);
  assert.deepEqual(Object.keys(WW_AR).sort(), copy);
  assert.notEqual(WW_TR.wwTitle, WW_EN.wwTitle);
  assert.notEqual(WW_DE.lgHint, WW_EN.lgHint);
  assert.notEqual(WW_RU.lgBlank, WW_EN.lgBlank);
  assert.notEqual(WW_AR.wwBlank, WW_EN.wwBlank);
  assert.equal(crmv3Text("en", "wwTitle"), "Watch words");
  assert.equal(crmv3Text("tr", "lgTitle"), WW_TR.lgTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-watch-words", "de"), "Beobachtungswörter");
  assert.equal(keyTitle("crmv3-lang-hide", "tr"), "Dil bakışı");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "watchwords"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "langglance"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("watchwords"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("langglance"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("watchwords")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "work" && (group.ids as readonly string[]).includes("langglance")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-watch-words/);
  assert.match(css, /\.c3-lang-glance/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/words.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes('?? "en"'), false);
  assert.match(view, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(view, /data-watch-words/);
  assert.match(view, /data-lang-glance/);
  assert.match(view, /WATCH_KEY/);
  assert.match(view, /LANG_KEY/);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "watchwords"/);
  assert.match(app, /view === "langglance"/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round99 tests passed");
}

main();
