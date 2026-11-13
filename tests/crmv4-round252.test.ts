/**
 * Choir cards and assignment crests.
 * Run: TZ=UTC npx tsx tests/crmv4-round252.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND252_COPY } from "../src/lib/crmv4/copy-round252";
import {
  ROUND252_FEATURES,
  activeBar,
  activeCloth,
  activeMeasure,
  activeTempo,
  activeVerse,
  addCardView,
  addChoirCard,
  bulkCardPin,
  busiestSinger,
  crestBound,
  crestHue,
  crestJoin,
  crestLane,
  crestLanesCsv,
  crestNotch,
  crestRowsCsv,
  crestStamp,
  crestState,
  crestStep,
  crestWide,
  cycleTempo,
  dropCardView,
  fairSinger,
  houseCloth,
  idleCard,
  lateCard,
  leadingCrest,
  lengthenBar,
  lowerMeasure,
  measureOf,
  barOf,
  clothOf,
  moveCardFocus,
  neighborCardCount,
  overdueCard,
  peakVerse,
  quietVerse,
  raiseMeasure,
  readCardViews,
  restingCard,
  rushCard,
  shortenBar,
  suggestBar,
  suggestCloth,
  tempoOf,
  verseBand,
  verseGap,
  verseOf,
  cardCsv,
  cardTimeline,
} from "../src/lib/crmv4/round252";

function main() {
  assert.equal(ROUND252_FEATURES.length, 25);
  assert.equal(verseOf(" stanza "), "stanza");
  assert.equal(verseOf("paris"), "");
  assert.equal(barOf("6"), 6);
  assert.equal(barOf(12), 12);
  assert.equal(barOf("18"), 18);
  assert.equal(barOf("10"), null);
  assert.equal(measureOf("2"), 2);
  assert.equal(measureOf(4), 4);
  assert.equal(measureOf("8"), 8);
  assert.equal(measureOf("16"), 16);
  assert.equal(measureOf("3"), null);
  assert.equal(clothOf("linen"), "LINEN");
  assert.equal(clothOf("gilt"), "GILT");
  assert.equal(clothOf("wax"), "WAX");
  assert.equal(clothOf("silk"), "");
  assert.equal(tempoOf("largo"), "largo");
  assert.equal(tempoOf("andante"), "andante");
  assert.equal(tempoOf("presto"), "presto");
  assert.equal(tempoOf("warm"), "");
  assert.equal(peakVerse("intro"), true);
  assert.equal(peakVerse("OUTRO"), true);
  assert.equal(peakVerse("stanza"), false);
  assert.equal(quietVerse("coda"), true);
  assert.equal(quietVerse("intro"), false);
  assert.equal(verseBand("intro"), "early");
  assert.equal(verseBand("chorus"), "mid");
  assert.equal(verseBand("coda"), "late");
  assert.equal(verseBand(""), "");
  assert.equal(verseGap("stanza", "chorus"), 1);
  assert.equal(verseGap("chorus", "stanza"), -1);
  assert.equal(verseGap("", "stanza"), null);
  assert.equal(houseCloth("linen"), true);
  assert.equal(houseCloth("GILT"), true);
  assert.equal(houseCloth("wax"), false);
  assert.equal(activeVerse("peak"), "peak");
  assert.equal(activeVerse("stanza"), "stanza");
  assert.equal(activeVerse("paris"), "all");
  assert.equal(activeBar("6"), "6");
  assert.equal(activeBar("10"), "all");
  assert.equal(activeTempo("presto", ["largo", "andante", "presto"]), "presto");
  assert.equal(activeTempo("loud", ["largo", "andante", "presto"]), "all");
  assert.equal(activeMeasure("8"), "8");
  assert.equal(activeMeasure("3"), "all");
  assert.equal(activeCloth("gilt"), "gilt");
  assert.equal(activeCloth("silk"), "all");
  assert.equal(moveCardFocus(0, 3, 1), 1);
  assert.equal(moveCardFocus(0, 3, -1), 2);
  assert.equal(suggestCloth([]), "LINEN");
  assert.equal(suggestBar([], 4), 6);
  assert.equal(suggestBar([], 12), 12);
  assert.equal(suggestBar([], 19), 18);
  assert.equal(fairSinger([], "Ada, Bea"), "Ada");

  const first = addChoirCard([], {
    id: "a",
    title: "  North card ",
    note: "",
    reader: "Ada",
    folio: "intro",
    ink: "linen",
    pace: "largo",
    margin: 6,
    quire: 2,
    tags: "a a b",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North card");
  assert.equal(first[0].note, "");
  assert.equal(first[0].ink, "LINEN");
  assert.equal(first[0].tags.join(""), "ab");
  assert.equal(first[0].audit, "save");
  assert.equal(overdueCard(first[0]), true);
  assert.equal(addChoirCard(first, { id: "a", title: "Other" }).length, 1);
  assert.equal(addChoirCard(first, { id: "b", title: "North card" }).length, 1);
  assert.equal(addChoirCard(first, { id: "b", title: "   " }).length, 1);

  const pinned = bulkCardPin(first, ["a"]);
  assert.equal(overdueCard(pinned[0]), false);
  const quiet = addChoirCard(pinned, { id: "q", title: "Bridge rest", reader: "Bea", folio: "bridge", pace: "largo", quire: 2 });
  assert.equal(idleCard(quiet[0]), true);
  assert.equal(lateCard(quiet[0], "outro"), true);
  const rushed = addChoirCard([], { id: "r", title: "Intro rush", folio: "intro", pace: "presto", quire: 8 });
  assert.equal(rushCard(rushed[0]), true);
  const rested = addChoirCard([], { id: "s", title: "Chorus rest", folio: "chorus", pace: "andante", margin: 18 });
  assert.equal(restingCard(rested[0]), true);
  assert.equal(lengthenBar(rested, "s")[0].margin, 18);
  assert.equal(lengthenBar([{ ...rested[0], margin: null }], "s")[0].margin, 6);
  assert.equal(shortenBar(first, "a")[0].margin, 6);
  assert.equal(shortenBar([{ ...first[0], margin: null }], "a")[0].margin, 18);
  assert.equal(cycleTempo(first, "a")[0].pace, "andante");
  assert.equal(raiseMeasure(first, "a")[0].quire, 4);
  assert.equal(lowerMeasure(first, "a")[0].quire, 16);
  assert.equal(busiestSinger(quiet), "Bea");
  assert.equal(neighborCardCount(quiet) >= 0, true);
  assert.match(cardCsv(first, "outro"), /North card/);
  assert.match(cardTimeline(first).map((lane) => lane.quire).join(","), /2/);

  const views = addCardView([], { id: "v", name: "Peak", tray: "open", folio: "peak", margin: "6", ink: "linen", pace: "largo", quire: "2" });
  assert.equal(views[0].folio, "peak");
  assert.equal(dropCardView(views, "v").length, 0);
  assert.equal(readCardViews([{ id: "v", name: "Peak", tray: "nope" }])[0].tray, "open");

  assert.equal(crestState("ADA"), "set");
  assert.equal(crestLane("ADA"), "house");
  assert.equal(crestStamp("ADA"), "AA3");
  assert.equal(crestHue("ADA"), "ivory");
  assert.equal(crestJoin("AAB"), true);
  assert.equal(crestLane("AAB"), "house");
  assert.equal(crestState("Ada Lovelace"), "set");
  assert.equal(crestLane("Ada Lovelace"), "duo");
  assert.equal(crestStamp("Ada Lovelace"), "AE11");
  assert.equal(crestHue("Ada Lovelace"), "ivory");
  assert.equal(crestStep("Ada Lovelace"), 7);
  assert.equal(crestBound("Ada Lovelace"), true);
  assert.equal(crestWide("Ada Lovelace"), false);
  assert.equal(crestNotch("Ada Lovelace"), false);
  assert.equal(crestLane("Ada Lovelace Kent"), "bench");
  assert.equal(crestWide("Ada Lovelace Kent"), true);
  assert.equal(crestLane("Anne-Marie"), "link");
  assert.equal(crestNotch("Anne-Marie"), true);
  assert.equal(crestLane("Bo"), "brief");
  assert.equal(crestLane("ConstantinePaul"), "long");
  assert.equal(crestHue("Miriam"), "ink");
  assert.equal(crestLane("Miriam"), "plain");
  assert.equal(crestState("X"), "clear");
  assert.equal(crestState({ assigneeName: "Ada", balance: 1 }), "");
  assert.equal(crestState({ code: "Ada" }), "");

  const book = [
    { id: "1", label: "Ada", note: "Ada Lovelace" },
    { id: "2", label: "Bea", note: "Ada Lovelace" },
    { id: "3", label: "Cem", note: "Miriam" },
  ];
  assert.equal(leadingCrest(book), "duo");
  assert.match(crestLanesCsv(book), /duo,2/);
  assert.match(crestRowsCsv(book, ["1"]), /Ada Lovelace,AE11,duo,ivory,7,0,0,0,1,0,0,1,0,0,0,0,1/);
  assert.match(crestRowsCsv(book, ["1"]), /Miriam,MM6,plain,ink,4,0,0,0,1,0,0,0,0,0,0,1,0/);

  const keys = Object.keys(ROUND252_COPY.en);
  assert.ok(keys.length >= 140);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND252_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND252_COPY[locale][key as keyof typeof ROUND252_COPY.en], "string");
      assert.ok(ROUND252_COPY[locale][key as keyof typeof ROUND252_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "chrTitle"), ROUND252_COPY.tr.chrTitle);
  assert.equal(crmv4Text("de", "acrTitle"), ROUND252_COPY.de.acrTitle);
  assert.equal(crmv4Text("ru", "chrSub"), ROUND252_COPY.ru.chrSub);
  assert.equal(crmv4Text("ar", "acrSub"), ROUND252_COPY.ar.acrSub);
  assert.equal(crmv4Text("en", "chrLogo"), "7FX");
  assert.equal(crmv4Text("en", "chrTitle"), "Choir cards");
  assert.notEqual(ROUND252_COPY.tr.chrTitle, ROUND252_COPY.en.chrTitle);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-chr/);
  assert.match(css, /\.c4-acr-index/);
  assert.match(css, /\.c4-dense-press/);
  assert.match(css, /\.c4-folder-press/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round252.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /assigneeName/);
  assert.match(viewFile, /cardCsv/);
  assert.match(viewFile, /crestRowsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "t"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "u"/);
  assert.match(viewFile, /event\.key === "s"/);
  assert.match(viewFile, /event\.key === "f"/);
  assert.match(viewFile, /event\.key === "h"/);
  assert.match(viewFile, /event\.key === "w"/);
  assert.match(viewFile, /event\.key === "d"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /event\.key === "b"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "m"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0&role=TRADER/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-crests/);
  assert.match(viewFile, /data-traders/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestCloth/);
  assert.match(viewFile, /c4-acr-search/);
  assert.match(viewFile, /cardTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "chr"/);
  assert.match(app, /view === "acr"/);
  const dense = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round51.tsx"), "utf8");
  const folders = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round59.tsx"), "utf8");
  assert.match(dense, /c4-dense-press/);
  assert.match(dense, /data-logo="mono"/);
  assert.match(folders, /c4-folder-press/);
  assert.match(folders, /data-logo="mono"/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND252_COPY.en, key);
  const audit = viewFile.match(/"(chrAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND252_COPY.en, key);
  const salon = `${dense}\n${folders}`.match(/"((?:dn|bm)Press[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of salon) assert.ok(key in ROUND252_COPY.en, key);
  console.log("crmv4 round252 tests passed");
}

main();
