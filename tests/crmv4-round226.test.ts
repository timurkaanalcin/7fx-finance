/**
 * Brocade swatches and pennant marks.
 * Run: TZ=UTC npx tsx tests/crmv4-round226.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND226_COPY } from "../src/lib/crmv4/copy-round226";
import {
  activeLoom,
  activePace,
  activePly,
  activeThread,
  addSwatch,
  addSwatchTag,
  addSwatchView,
  clothDensity,
  coolingSwatch,
  cyclePace,
  dyeOf,
  fairWeaver,
  houseDye,
  lateSwatch,
  leadingPennant,
  loomGap,
  loomOf,
  moveSwatchFocus,
  peakLoom,
  pennantLane,
  pennantMark,
  pennantRowsCsv,
  pennantState,
  pennantStep,
  pennantTone,
  pennantsCsv,
  plyOf,
  quietLoom,
  readSwatchViews,
  setSwatchPly,
  setSwatchWax,
  sharedPennantCount,
  snoozeSwatch,
  stitchedPennant,
  suggestDye,
  suggestThread,
  swatchesCsv,
  threadOf,
  widePennant,
} from "../src/lib/crmv4/round226";

function main() {
  assert.equal(dyeOf("  graphite "), "GRAPHITE");
  assert.equal(dyeOf("ivory"), "IVORY");
  assert.equal(dyeOf("champagne"), "CHAMPAGNE");
  assert.equal(dyeOf("   "), "");
  assert.equal(dyeOf("slate"), "");
  assert.equal(loomOf("1"), 1);
  assert.equal(loomOf(6), 6);
  assert.equal(loomOf("6"), 6);
  assert.equal(loomOf("0"), null);
  assert.equal(loomOf(0), null);
  assert.equal(loomOf("7"), null);
  assert.equal(loomOf("06"), null);
  assert.equal(loomOf(""), null);
  assert.equal(loomOf(1.5), null);
  assert.equal(threadOf("6"), 6);
  assert.equal(threadOf(18), 18);
  assert.equal(threadOf("36"), 36);
  assert.equal(threadOf("4"), null);
  assert.equal(threadOf("06"), null);
  assert.equal(plyOf("2"), 2);
  assert.equal(plyOf(4), 4);
  assert.equal(plyOf("6"), 6);
  assert.equal(plyOf("1"), null);
  assert.equal(plyOf("0"), null);
  assert.equal(peakLoom(3), true);
  assert.equal(peakLoom(5), true);
  assert.equal(peakLoom(2), false);
  assert.equal(quietLoom(6), true);
  assert.equal(quietLoom(5), false);
  assert.equal(loomGap(1, 6), 5);
  assert.equal(loomGap(6, 1), -5);
  assert.equal(loomGap(null, 3), null);
  assert.equal(loomGap(1, 0), null);
  assert.equal(houseDye("graphite"), true);
  assert.equal(houseDye("CHAMPAGNE"), true);
  assert.equal(houseDye("ivory"), false);
  assert.equal(activeLoom("peak"), "peak");
  assert.equal(activeLoom("6"), "6");
  assert.equal(activeLoom("9"), "all");
  assert.equal(activeThread("18"), "18");
  assert.equal(activeThread("4"), "all");
  assert.equal(activePace("flare", ["hush", "glide", "flare"]), "flare");
  assert.equal(activePace("rush", ["hush", "glide", "flare"]), "all");
  assert.equal(activePly("4"), "4");
  assert.equal(activePly("1"), "all");
  assert.equal(clothDensity("tight"), "tight");
  assert.equal(clothDensity("roomy"), "airy");
  assert.equal(moveSwatchFocus(0, 3, 1), 1);
  assert.equal(moveSwatchFocus(0, 3, -1), 2);
  assert.equal(suggestDye([]), "GRAPHITE");
  assert.equal(suggestThread([]), 18);
  assert.equal(fairWeaver([], "Ada, Bea"), "Ada");

  const first = addSwatch([], {
    id: "a",
    title: "  North brocade ",
    note: "quiet",
    weaver: "Ada",
    loom: "1",
    dye: "graphite",
    pace: "hush",
    thread: "6",
    tags: "a b c q",
    ply: "4",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North brocade");
  assert.equal(first[0].dye, "GRAPHITE");
  assert.equal(first[0].loom, 1);
  assert.equal(first[0].thread, 6);
  assert.deepEqual(first[0].tags, ["a", "b"]);
  assert.equal(first[0].ply, 4);
  assert.equal(first[0].wax, false);
  assert.equal(first[0].audit, "save");
  assert.equal(addSwatch(first, { id: "b", title: "   " }).length, 1);
  assert.equal(addSwatch(first, { id: "a", title: "Other" }).length, 1);
  const raised = setSwatchPly(first, "a", "6");
  assert.equal(raised[0].ply, 6);
  assert.equal(raised[0].audit, "ply");
  const waxed = setSwatchWax(first, "a", true);
  assert.equal(waxed[0].wax, true);
  assert.equal(waxed[0].audit, "wax");
  const snoozed = snoozeSwatch(first, "a");
  assert.equal(snoozed[0].thread, 18);
  const glided = cyclePace(first, "a");
  assert.equal(glided[0].pace, "glide");
  const tagged = addSwatchTag(first, "a", "a");
  assert.deepEqual(tagged[0].tags, ["a", "b"]);
  const views = addSwatchView([], {
    id: "v",
    name: "Peak",
    tray: "open",
    query: "",
    weaver: "all",
    dye: "all",
    pace: "all",
    loom: "peak",
    thread: "all",
    ply: "all",
  });
  assert.equal(readSwatchViews(views).length, 1);
  const late = addSwatch([{ ...first[0], ply: 2 }], { id: "b", title: "Late loom", loom: "1", ply: "2" });
  assert.equal(lateSwatch(late.find((swatch) => swatch.id === "a")!, 6), true);
  assert.equal(lateSwatch(late.find((swatch) => swatch.id === "b")!, 4), false);
  const cooling = addSwatch([], { id: "c", title: "Cooling cloth", loom: "6", pace: "flare", ply: "2" });
  assert.equal(coolingSwatch(cooling[0]), true);
  assert.equal(coolingSwatch({ ...cooling[0], pace: "hush" }), false);
  assert.equal(coolingSwatch({ ...cooling[0], loom: 5 }), false);

  assert.equal(pennantState("hello"), "set");
  assert.equal(pennantState({ name: "  " }), "clear");
  assert.equal(pennantState({ name: "Ada", leads: 1, valid: 1, invalid: 0, deposits: 4 }), "");
  assert.equal(pennantMark({ name: "North desk", leads: 2, valid: 3, invalid: 1 }), "NOR");
  assert.equal(pennantLane({ name: "Ada", valid: 3, invalid: 1 }), "oriflamme");
  assert.equal(pennantLane({ name: "North", valid: 1, invalid: 0 }), "pennant");
  assert.equal(pennantLane({ name: "Desk 4", valid: 2, invalid: 2 }), "gonfalon");
  assert.equal(pennantLane({ name: "A1", valid: 1, invalid: 0 }), "gonfalon");
  assert.equal(pennantTone({ name: "Ada", valid: 3, invalid: 1 }), "bright");
  assert.equal(pennantTone({ name: "Ada", valid: 1, invalid: 4 }), "dim");
  assert.equal(pennantTone({ name: "Ada", valid: 2, invalid: 2 }), "even");
  assert.equal(pennantTone({ name: "Ada" }), "mist");
  assert.equal(pennantTone({ name: "Ada", leads: 0 }), "hush");
  assert.equal(stitchedPennant({ name: "North-desk", valid: 1, invalid: 0 }), true);
  assert.equal(stitchedPennant({ name: "Ada", valid: 1, invalid: 0 }), false);
  assert.equal(widePennant("Ada"), false);
  assert.equal(widePennant("North desk"), true);
  assert.equal(pennantStep(""), 0);
  assert.equal(pennantStep("Ada"), 1);
  assert.equal(pennantStep("North desk"), 2);
  assert.equal(pennantStep("One two three"), 3);
  const book = [
    { id: "1", label: "North desk", note: { name: "North desk", leads: 4, valid: 3, invalid: 1 } },
    { id: "2", label: "Ada Lane", note: { name: "Ada Lane", leads: 5, valid: 1, invalid: 4 } },
    { id: "3", label: "Desk 4", note: { name: "Desk 4", leads: 2, valid: 2, invalid: 2 } },
  ];
  assert.equal(leadingPennant(book), "pennant");
  assert.equal(sharedPennantCount(book), 0);
  const paired = [
    book[0],
    { id: "4", label: "North extra", note: { name: "North extra", leads: 1, valid: 2, invalid: 0 } },
  ];
  assert.equal(sharedPennantCount(paired), 2);
  assert.match(pennantsCsv(book), /pennant,1/);
  assert.match(pennantRowsCsv(book, ["2"]), /Ada Lane,ADA,oriflamme,dim,2,0,1,1,0,1/);
  assert.match(swatchesCsv(first, 6), /North brocade,Ada,1,GRAPHITE,hush,6,4,a b,0,0,0,0,5,0,0,1,0,0,0,quiet,save/);

  const keys = Object.keys(ROUND226_COPY.en);
  assert.ok(keys.length >= 120);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND226_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND226_COPY[locale][key as keyof typeof ROUND226_COPY.en], "string");
      assert.ok(ROUND226_COPY[locale][key as keyof typeof ROUND226_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "brdTitle"), ROUND226_COPY.tr.brdTitle);
  assert.equal(crmv4Text("de", "wmpTitle"), ROUND226_COPY.de.wmpTitle);
  assert.equal(crmv4Text("ru", "brdSub"), ROUND226_COPY.ru.brdSub);
  assert.equal(crmv4Text("ar", "wmpSub"), ROUND226_COPY.ar.wmpSub);
  assert.equal(crmv4Text("en", "brdLogo"), "7FX");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-brd/);
  assert.match(css, /\.c4-pnt-index/);
  assert.match(css, /\.c4-mkt-brocade/);
  assert.match(css, /\.c4-mkt-brocade-index/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round226.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /name/);
  assert.match(viewFile, /leads/);
  assert.match(viewFile, /valid/);
  assert.match(viewFile, /invalid/);
  assert.match(viewFile, /swatchesCsv/);
  assert.match(viewFile, /pennantsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "t"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "m"/);
  assert.match(viewFile, /event\.key === "h"/);
  assert.match(viewFile, /event\.key === "w"/);
  assert.match(viewFile, /event\.key === "g"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/analytics\/affiliates\?period=month/);
  assert.match(viewFile, /data-swatches/);
  assert.match(viewFile, /data-pennants/);
  assert.match(viewFile, /data-keyed/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /marketing/);
  assert.match(viewFile, /suggestDye/);
  assert.match(viewFile, /c4-pnt-time/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "brdc"/);
  assert.match(app, /view === "pnnt"/);
  assert.match(app, /BrocadeSwatches/);
  assert.match(app, /PennantMarks/);
  const marketing = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Marketing.tsx"), "utf8");
  assert.match(marketing, /c4-mkt-brocade/);
  assert.match(marketing, /c4-mkt-brocade-index/);
  assert.match(marketing, /c4-mkt-mount/);
  assert.match(marketing, /c4-mkt-salon/);
  assert.match(marketing, /c4-mkt-folio/);
  assert.match(marketing, /data-logo="mono"/);
  assert.match(marketing, /data-desk="brocade"/);
  assert.match(marketing, /SegmentBoard/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND226_COPY.en, key);
  const audit = viewFile.match(/"(brdAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND226_COPY.en, key);
  console.log("crmv4 round226 tests passed");
}

main();
