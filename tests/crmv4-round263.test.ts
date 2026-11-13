/**
 * Buttery slips and provenance plates.
 * Run: TZ=UTC npx tsx tests/crmv4-round263.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND263_COPY } from "../src/lib/crmv4/copy-round263";
import {
  ROUND263_FEATURES,
  activeButteryRank,
  activeButteryWait,
  activeCellar,
  activeGlass,
  activePour,
  addButtery,
  addButteryView,
  briskButtery,
  bulkButteryPin,
  busiestButterySteward,
  butteryCsv,
  butteryRank,
  butteryTimeline,
  butteryWait,
  cellarBand,
  cellarGap,
  cellarOf,
  cyclePour,
  dropButteryView,
  fairButterySteward,
  glassOf,
  houseGlass,
  idleButtery,
  lateButtery,
  leadingSource,
  lengthenButtery,
  lowerButtery,
  moveButteryFocus,
  neighborButteryCount,
  overdueButtery,
  peakCellar,
  pourOf,
  quietCellar,
  raiseButtery,
  readButteryViews,
  restingButtery,
  shortenButtery,
  sourceCap,
  sourceEcho,
  sourceHue,
  sourceKnown,
  sourceLane,
  sourceLanesCsv,
  sourceLeap,
  sourceNotch,
  sourceRowsCsv,
  sourceSlash,
  sourceStamp,
  sourceState,
  sourceStep,
  sourceTail,
  sourceTwin,
  sourceWide,
  suggestButteryWait,
  suggestCellar,
  suggestGlass,
} from "../src/lib/crmv4/round263";

function main() {
  assert.equal(ROUND263_FEATURES.length, 25);
  assert.equal(cellarOf(" rack "), "rack");
  assert.equal(cellarOf("paris"), "");
  assert.equal(butteryWait("15"), 15);
  assert.equal(butteryWait(30), 30);
  assert.equal(butteryWait("45"), 45);
  assert.equal(butteryWait("12"), null);
  assert.equal(butteryRank("1"), 1);
  assert.equal(butteryRank(3), 3);
  assert.equal(butteryRank("5"), 5);
  assert.equal(butteryRank("7"), 7);
  assert.equal(butteryRank("2"), null);
  assert.equal(glassOf("flint"), "FLINT");
  assert.equal(glassOf("green"), "GREEN");
  assert.equal(glassOf("amber"), "AMBER");
  assert.equal(glassOf("oat"), "");
  assert.equal(pourOf("still"), "still");
  assert.equal(pourOf("spark"), "spark");
  assert.equal(pourOf("cask"), "cask");
  assert.equal(pourOf("brisk"), "");
  assert.equal(peakCellar("vault"), true);
  assert.equal(peakCellar("RACK"), true);
  assert.equal(peakCellar("bin"), false);
  assert.equal(quietCellar("bin"), true);
  assert.equal(quietCellar("cave"), true);
  assert.equal(quietCellar("vault"), false);
  assert.equal(cellarBand("vault"), "early");
  assert.equal(cellarBand("bin"), "early");
  assert.equal(cellarBand("rack"), "mid");
  assert.equal(cellarBand("cave"), "late");
  assert.equal(cellarBand(""), "");
  assert.equal(cellarGap("vault", "bin"), 1);
  assert.equal(cellarGap("bin", "vault"), -1);
  assert.equal(cellarGap("", "vault"), null);
  assert.equal(houseGlass("flint"), true);
  assert.equal(houseGlass("AMBER"), true);
  assert.equal(houseGlass("green"), false);
  assert.equal(activeCellar("peak"), "peak");
  assert.equal(activeCellar("vault"), "vault");
  assert.equal(activeCellar("paris"), "all");
  assert.equal(activeButteryWait("30"), "30");
  assert.equal(activeButteryWait("9"), "all");
  assert.equal(activePour("spark", ["still", "spark", "cask"]), "spark");
  assert.equal(activePour("gale", ["still", "spark", "cask"]), "all");
  assert.equal(activeButteryRank("5"), "5");
  assert.equal(activeButteryRank("2"), "all");
  assert.equal(activeGlass("green"), "green");
  assert.equal(activeGlass("mint"), "all");
  assert.equal(moveButteryFocus(0, 3, 1), 1);
  assert.equal(moveButteryFocus(0, 3, -1), 2);
  assert.equal(suggestGlass([]), "FLINT");
  assert.equal(suggestButteryWait([], 4), 15);
  assert.equal(suggestButteryWait([], 8), 30);
  assert.equal(suggestButteryWait([], 16), 45);
  assert.equal(suggestCellar(4), "vault");
  assert.equal(suggestCellar(12), "rack");
  assert.equal(fairButterySteward([], "Ada, Bea"), "Ada");

  const first = addButtery([], {
    id: "a",
    title: "  North vault ",
    note: "",
    steward: "Ada",
    cellar: "vault",
    glass: "flint",
    pour: "still",
    wait: 15,
    rank: 1,
    tags: "a a b",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North vault");
  assert.equal(first[0].note, "");
  assert.equal(first[0].glass, "FLINT");
  assert.equal(first[0].tags.join(""), "ab");
  assert.equal(first[0].audit, "save");
  assert.equal(overdueButtery(first[0]), true);
  assert.equal(addButtery(first, { id: "a", title: "Other" }).length, 1);
  assert.equal(addButtery(first, { id: "b", title: "North vault" }).length, 1);
  assert.equal(addButtery(first, { id: "b", title: "   " }).length, 1);

  const pinned = bulkButteryPin(first, ["a"]);
  assert.equal(overdueButtery(pinned[0]), false);
  assert.equal(fairButterySteward(pinned, "Ada, Bea"), "Ada");
  const quiet = addButtery(pinned, { id: "q", title: "Bin rest", steward: "Bea", cellar: "bin", pour: "still", rank: 1 });
  assert.equal(idleButtery(quiet[0]), true);
  assert.equal(lateButtery(quiet[0], "vault"), false);
  assert.equal(lateButtery(quiet[0], "rack"), false);
  const behind = addButtery([], { id: "z", title: "Bin late", cellar: "bin", rank: 1 });
  assert.equal(lateButtery(behind[0], "cave"), true);
  assert.equal(lateButtery({ ...behind[0], rank: 3 }, "cave"), false);
  const rushed = addButtery([], { id: "r", title: "Vault spark", cellar: "vault", pour: "spark", rank: 7 });
  assert.equal(briskButtery(rushed[0]), true);
  const rested = addButtery([], { id: "s", title: "Cave cask", cellar: "cave", pour: "cask", wait: 45 });
  assert.equal(restingButtery(rested[0]), true);
  assert.equal(lengthenButtery(rested, "s")[0].wait, 45);
  assert.equal(lengthenButtery([{ ...rested[0], wait: null }], "s")[0].wait, 15);
  assert.equal(lengthenButtery(first, "a")[0].wait, 30);
  assert.equal(shortenButtery(first, "a")[0].wait, 15);
  assert.equal(shortenButtery([{ ...first[0], wait: null }], "a")[0].wait, 45);
  assert.equal(cyclePour(first, "a")[0].pour, "spark");
  assert.equal(raiseButtery(first, "a")[0].rank, 3);
  assert.equal(lowerButtery(first, "a")[0].rank, 1);
  assert.equal(lowerButtery([{ ...first[0], rank: 7 }], "a")[0].rank, 5);
  assert.equal(busiestButterySteward(quiet), "Bea");
  assert.equal(neighborButteryCount(quiet) >= 0, true);
  assert.match(butteryCsv(first, "cave"), /North vault/);
  assert.match(butteryTimeline(first).map((lane) => lane.rank).join(","), /1/);

  const greenBook = addButtery(addButtery([], { id: "y1", title: "Green one", glass: "green", cellar: "bin" }), { id: "y2", title: "Green two", glass: "green", cellar: "vault" });
  assert.equal(suggestGlass(greenBook), "GREEN");
  assert.equal(suggestButteryWait(rested, 4), 45);

  const views = addButteryView([], { id: "v", name: "Peak", tray: "open", cellar: "peak", wait: "15", glass: "flint", pour: "still", rank: "1" });
  assert.equal(views[0].cellar, "peak");
  assert.equal(dropButteryView(views, "v").length, 0);
  assert.equal(readButteryViews([{ id: "v", name: "Peak", tray: "nope" }])[0].tray, "open");

  assert.equal(sourceState("MANUAL"), "set");
  assert.equal(sourceLane("MANUAL"), "hand");
  assert.equal(sourceStamp("MANUAL"), "MANU");
  assert.equal(sourceHue("MANUAL"), "champagne");
  assert.equal(sourceStep("MANUAL"), 6);
  assert.equal(sourceLeap("MANUAL"), true);
  assert.equal(sourceKnown("MANUAL"), true);
  assert.equal(sourceTail("MANUAL"), false);
  assert.equal(sourceLane("AUTO"), "clock");
  assert.equal(sourceStamp("AUTO"), "AUTO");
  assert.equal(sourceHue("AUTO"), "graphite");
  assert.equal(sourceTail("AUTO"), true);
  assert.equal(sourceKnown("auto"), true);
  assert.equal(sourceLane("STAFF"), "mark");
  assert.equal(sourceStamp("STAFF"), "STAF");
  assert.equal(sourceHue("STAFF"), "ivory");
  assert.equal(sourceKnown("STAFF"), false);
  assert.equal(sourceLeap("AUTO"), false);
  assert.equal(sourceNotch("PRE-SET"), true);
  assert.equal(sourceLane("PRE-SET"), "join");
  assert.equal(sourceHue("PRE-SET"), "champagne");
  assert.equal(sourceSlash("A/B"), true);
  assert.equal(sourceLane("A/B"), "join");
  assert.equal(sourceWide("PRE_SET"), true);
  assert.equal(sourceTwin("BOOK"), true);
  assert.equal(sourceEcho("RADAR"), true);
  assert.equal(sourceCap("Manual"), true);
  assert.equal(sourceCap("manual"), false);
  assert.equal(sourceLane("manual"), "hand");
  assert.equal(sourceState("12"), "clear");
  assert.equal(sourceState(""), "clear");
  assert.equal(sourceState({ leadInvalidSource: "MANUAL", balance: 1 }), "");
  assert.equal(sourceState({ code: "HOUSE" }), "");
  assert.equal(sourceLane({ source: "AUTO" }), "clock");

  const book = [
    { id: "1", label: "Ada", note: "MANUAL" },
    { id: "2", label: "Bea", note: "AUTO" },
    { id: "3", label: "Cem", note: "STAFF" },
  ];
  assert.equal(leadingSource(book), "hand");
  assert.match(sourceLanesCsv(book), /hand,1/);
  assert.match(sourceRowsCsv(book, ["1"]), /MANUAL,MANU,hand,champagne/);
  assert.match(sourceRowsCsv(book, ["1"]), /AUTO,AUTO,clock,graphite/);
  assert.match(sourceRowsCsv(book, ["1"]), /STAFF,STAF,mark,ivory/);

  const keys = Object.keys(ROUND263_COPY.en);
  assert.ok(keys.length >= 150);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND263_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND263_COPY[locale][key as keyof typeof ROUND263_COPY.en], "string");
      assert.ok(ROUND263_COPY[locale][key as keyof typeof ROUND263_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "btyTitle"), ROUND263_COPY.tr.btyTitle);
  assert.equal(crmv4Text("de", "prvTitle"), ROUND263_COPY.de.prvTitle);
  assert.equal(crmv4Text("ru", "btySub"), ROUND263_COPY.ru.btySub);
  assert.equal(crmv4Text("ar", "prvSub"), ROUND263_COPY.ar.prvSub);
  assert.equal(crmv4Text("en", "btyLogo"), "7FX");
  assert.equal(crmv4Text("en", "btyTitle"), "Buttery slips");
  assert.notEqual(ROUND263_COPY.tr.btyTitle, ROUND263_COPY.en.btyTitle);
  assert.equal(crmv4Text("en", "lrdTitle"), "Larder slips");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-bty/);
  assert.match(css, /\.c4-prv-index/);
  assert.match(css, /\.c4-bty-ledger/);
  assert.match(css, /\.c4-prv-bar/);
  assert.match(css, /\.c4-inbox-cellar/);
  assert.match(css, /\.c4-kyc-cellar/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round263.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /leadInvalidSource/);
  assert.match(viewFile, /butteryCsv/);
  assert.match(viewFile, /sourceRowsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "r"/);
  assert.match(viewFile, /event\.key === "l"/);
  assert.match(viewFile, /event\.key === "g"/);
  assert.match(viewFile, /event\.key === "h"/);
  assert.match(viewFile, /event\.key === "w"/);
  assert.match(viewFile, /event\.key === "b"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /event\.key === "u"/);
  assert.match(viewFile, /event\.key === "y"/);
  assert.match(viewFile, /event\.key === "m"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0&role=TRADER/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-traders/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestGlass/);
  assert.match(viewFile, /c4-prv-search/);
  assert.match(viewFile, /butteryTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "bty"/);
  assert.match(app, /view === "prv"/);
  const inbox = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round29.tsx"), "utf8");
  const kyc = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round27.tsx"), "utf8");
  assert.match(inbox, /c4-inbox-cellar/);
  assert.match(kyc, /c4-kyc-cellar/);
  assert.match(kyc, /aria-required=\{false\}/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND263_COPY.en, key);
  const audit = viewFile.match(/"(btyAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND263_COPY.en, key);
  console.log("crmv4 round263 tests passed");
}

main();
