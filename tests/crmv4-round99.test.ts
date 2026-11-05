/**
 * Watch words and customer languages.
 * Run: npx tsx tests/crmv4-round99.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND99_COPY } from "../src/lib/crmv4/copy-round99";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
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
} from "../src/lib/crmv4/round99";

function main() {
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

  const copy = Object.keys(ROUND99_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND99_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "wwTitle"), "Watch words");
  assert.equal(crmv4Text("tr", "lgTitle"), ROUND99_COPY.tr.lgTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-watch-words/);
  assert.match(css, /\.c4-lang-glance/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round99.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes('?? "en"'), false);
  assert.match(view, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(view, /data-watch-words/);
  assert.match(view, /data-lang-glance/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "watchwords"/);
  assert.match(app, /view === "langglance"/);
  console.log("crmv4 round99 tests passed");
}

main();
