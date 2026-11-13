/**
 * Parcel slips and language ribbons.
 * Run: TZ=UTC npx tsx tests/crmv4-round254.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND254_COPY } from "../src/lib/crmv4/copy-round254";
import {
  ROUND254_FEATURES,
  activeCloth,
  activePace,
  activeParcelRank,
  activeParcelSpan,
  activeWatch,
  addParcel,
  addParcelView,
  bulkParcelPin,
  busiestCourier,
  cyclePace,
  dropParcelView,
  fairCourier,
  houseCloth,
  idleParcel,
  lateParcel,
  leadingRibbon,
  lengthenWatch,
  lowerParcelRank,
  moveParcelFocus,
  neighborParcelCount,
  overdueParcel,
  paceOf,
  parcelCsv,
  parcelRankOf,
  parcelSpanOf,
  parcelTimeline,
  peakWatch,
  quietWatch,
  raiseParcelRank,
  readParcelViews,
  restingParcel,
  ribbonEcho,
  ribbonHue,
  ribbonLane,
  ribbonLanesCsv,
  ribbonNotch,
  ribbonRowsCsv,
  ribbonSpoken,
  ribbonStamp,
  ribbonState,
  ribbonStep,
  ribbonWide,
  rushParcel,
  shortenWatch,
  suggestCloth,
  suggestWatch,
  watchBand,
  watchGap,
  watchOf,
  clothOf,
} from "../src/lib/crmv4/round254";

function main() {
  assert.equal(ROUND254_FEATURES.length, 25);
  assert.equal(watchOf(" matins "), "matins");
  assert.equal(watchOf("paris"), "");
  assert.equal(parcelSpanOf("20"), 20);
  assert.equal(parcelSpanOf(40), 40);
  assert.equal(parcelSpanOf("80"), 80);
  assert.equal(parcelSpanOf("30"), null);
  assert.equal(parcelRankOf("2"), 2);
  assert.equal(parcelRankOf(4), 4);
  assert.equal(parcelRankOf("6"), 6);
  assert.equal(parcelRankOf("8"), 8);
  assert.equal(parcelRankOf("1"), null);
  assert.equal(clothOf("linen"), "LINEN");
  assert.equal(clothOf("wool"), "WOOL");
  assert.equal(clothOf("silk"), "SILK");
  assert.equal(clothOf("oak"), "");
  assert.equal(paceOf("walk"), "walk");
  assert.equal(paceOf("trot"), "trot");
  assert.equal(paceOf("canter"), "canter");
  assert.equal(paceOf("sprint"), "");
  assert.equal(peakWatch("matins"), true);
  assert.equal(peakWatch("SEXT"), true);
  assert.equal(peakWatch("lauds"), false);
  assert.equal(quietWatch("terce"), true);
  assert.equal(quietWatch("compline"), true);
  assert.equal(quietWatch("matins"), false);
  assert.equal(watchBand("matins"), "early");
  assert.equal(watchBand("prime"), "mid");
  assert.equal(watchBand("sext"), "late");
  assert.equal(watchBand(""), "");
  assert.equal(watchGap("matins", "lauds"), 1);
  assert.equal(watchGap("lauds", "matins"), -1);
  assert.equal(watchGap("", "matins"), null);
  assert.equal(houseCloth("linen"), true);
  assert.equal(houseCloth("WOOL"), true);
  assert.equal(houseCloth("silk"), false);
  assert.equal(activeWatch("peak"), "peak");
  assert.equal(activeWatch("matins"), "matins");
  assert.equal(activeWatch("paris"), "all");
  assert.equal(activeParcelSpan("20"), "20");
  assert.equal(activeParcelSpan("30"), "all");
  assert.equal(activePace("trot", ["walk", "trot", "canter"]), "trot");
  assert.equal(activePace("sprint", ["walk", "trot", "canter"]), "all");
  assert.equal(activeParcelRank("6"), "6");
  assert.equal(activeParcelRank("1"), "all");
  assert.equal(activeCloth("wool"), "wool");
  assert.equal(activeCloth("oak"), "all");
  assert.equal(moveParcelFocus(0, 3, 1), 1);
  assert.equal(moveParcelFocus(0, 3, -1), 2);
  assert.equal(suggestCloth([]), "LINEN");
  assert.equal(suggestWatch([], 4), 20);
  assert.equal(suggestWatch([], 12), 40);
  assert.equal(suggestWatch([], 19), 80);
  assert.equal(fairCourier([], "Ada, Bea"), "Ada");

  const first = addParcel([], {
    id: "a",
    title: "  North parcel ",
    note: "",
    courier: "Ada",
    watch: "matins",
    cloth: "linen",
    pace: "walk",
    span: 20,
    rank: 2,
    tags: "a a b",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North parcel");
  assert.equal(first[0].note, "");
  assert.equal(first[0].cloth, "LINEN");
  assert.equal(first[0].tags.join(""), "ab");
  assert.equal(first[0].audit, "save");
  assert.equal(overdueParcel(first[0]), true);
  assert.equal(addParcel(first, { id: "a", title: "Other" }).length, 1);
  assert.equal(addParcel(first, { id: "b", title: "North parcel" }).length, 1);
  assert.equal(addParcel(first, { id: "b", title: "   " }).length, 1);

  const pinned = bulkParcelPin(first, ["a"]);
  assert.equal(overdueParcel(pinned[0]), false);
  const quiet = addParcel(pinned, { id: "q", title: "Night rest", courier: "Bea", watch: "terce", pace: "walk", rank: 2 });
  assert.equal(idleParcel(quiet[0]), true);
  assert.equal(lateParcel(quiet[0], "compline"), false);
  const behind = addParcel([], { id: "z", title: "Dawn late", watch: "matins", rank: 2 });
  assert.equal(lateParcel(behind[0], "compline"), true);
  assert.equal(lateParcel({ ...behind[0], rank: 4 }, "compline"), false);
  const rushed = addParcel([], { id: "r", title: "Dawn rush", watch: "matins", pace: "canter", rank: 8 });
  assert.equal(rushParcel(rushed[0]), true);
  const rested = addParcel([], { id: "s", title: "Noon rest", watch: "lauds", pace: "trot", span: 80 });
  assert.equal(restingParcel(rested[0]), true);
  assert.equal(lengthenWatch(rested, "s")[0].span, 80);
  assert.equal(lengthenWatch([{ ...rested[0], span: null }], "s")[0].span, 20);
  assert.equal(lengthenWatch(first, "a")[0].span, 40);
  assert.equal(shortenWatch(first, "a")[0].span, 20);
  assert.equal(shortenWatch([{ ...first[0], span: null }], "a")[0].span, 80);
  assert.equal(cyclePace(first, "a")[0].pace, "trot");
  assert.equal(raiseParcelRank(first, "a")[0].rank, 4);
  assert.equal(lowerParcelRank(first, "a")[0].rank, 2);
  assert.equal(lowerParcelRank([{ ...first[0], rank: 8 }], "a")[0].rank, 6);
  assert.equal(busiestCourier(quiet), "Bea");
  assert.equal(neighborParcelCount(quiet) >= 0, true);
  assert.match(parcelCsv(first, "compline"), /North parcel/);
  assert.match(parcelTimeline(first).map((lane) => lane.rank).join(","), /2/);

  const silkBook = addParcel(addParcel([], { id: "y1", title: "Silk one", cloth: "silk", watch: "lauds" }), { id: "y2", title: "Silk two", cloth: "silk", watch: "prime" });
  assert.equal(suggestCloth(silkBook), "SILK");
  assert.equal(suggestWatch(rested, 4), 80);

  const views = addParcelView([], { id: "v", name: "Peak", tray: "open", watch: "peak", span: "20", cloth: "linen", pace: "walk", rank: "2" });
  assert.equal(views[0].watch, "peak");
  assert.equal(dropParcelView(views, "v").length, 0);
  assert.equal(readParcelViews([{ id: "v", name: "Peak", tray: "nope" }])[0].tray, "open");

  assert.equal(ribbonState("en"), "set");
  assert.equal(ribbonLane("en"), "house");
  assert.equal(ribbonStamp("en"), "EN2");
  assert.equal(ribbonHue("en"), "graphite");
  assert.equal(ribbonSpoken("en"), true);
  assert.equal(ribbonEcho("aa"), true);
  assert.equal(ribbonLane("aa"), "code");
  assert.equal(ribbonState("English"), "set");
  assert.equal(ribbonLane("English"), "plain");
  assert.equal(ribbonStamp("English"), "EH7");
  assert.equal(ribbonHue("English"), "graphite");
  assert.equal(ribbonSpoken("English"), true);
  assert.equal(ribbonWide("English"), false);
  assert.equal(ribbonLane("en-US"), "locale");
  assert.equal(ribbonNotch("en-US"), true);
  assert.equal(ribbonLane("Brazilian Portuguese"), "pair");
  assert.equal(ribbonLane("North Desk Team"), "phrase");
  assert.equal(ribbonLane("pt_BR"), "locale");
  assert.equal(ribbonLane("zh9"), "cipher");
  assert.equal(ribbonLane("Constantine"), "essay");
  assert.equal(ribbonStep("Constantine"), 8);
  assert.equal(ribbonWide("Portuguese"), true);
  assert.equal(ribbonHue("Miriam"), "ink");
  assert.equal(ribbonLane("Miriam"), "plain");
  assert.equal(ribbonState("X"), "clear");
  assert.equal(ribbonState({ language: "en", balance: 1 }), "");
  assert.equal(ribbonState({ code: "en" }), "");

  const book = [
    { id: "1", label: "Ada", note: "en" },
    { id: "2", label: "Bea", note: "en" },
    { id: "3", label: "Cem", note: "Miriam" },
  ];
  assert.equal(leadingRibbon(book), "house");
  assert.match(ribbonLanesCsv(book), /house,2/);
  assert.match(ribbonRowsCsv(book, ["1"]), /en,EN2,house,graphite,2,0,0,0,1,1,0,0,0,0,0,0,0,1/);
  assert.match(ribbonRowsCsv(book, ["1"]), /Miriam,MM6,plain,ink,4,0,0,0,0,0,0,0,0,0,0,0,1,0/);

  const keys = Object.keys(ROUND254_COPY.en);
  assert.ok(keys.length >= 140);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND254_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND254_COPY[locale][key as keyof typeof ROUND254_COPY.en], "string");
      assert.ok(ROUND254_COPY[locale][key as keyof typeof ROUND254_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "pslTitle"), ROUND254_COPY.tr.pslTitle);
  assert.equal(crmv4Text("de", "lrbTitle"), ROUND254_COPY.de.lrbTitle);
  assert.equal(crmv4Text("ru", "pslSub"), ROUND254_COPY.ru.pslSub);
  assert.equal(crmv4Text("ar", "lrbSub"), ROUND254_COPY.ar.lrbSub);
  assert.equal(crmv4Text("en", "pslLogo"), "7FX");
  assert.equal(crmv4Text("en", "pslTitle"), "Parcel slips");
  assert.notEqual(ROUND254_COPY.tr.pslTitle, ROUND254_COPY.en.pslTitle);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-psl/);
  assert.match(css, /\.c4-lrb-index/);
  assert.match(css, /\.c4-reject-atelier/);
  assert.match(css, /\.c4-cheat-atelier/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round254.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /language/);
  assert.match(viewFile, /parcelCsv/);
  assert.match(viewFile, /ribbonRowsCsv/);
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
  assert.match(viewFile, /data-ribbons/);
  assert.match(viewFile, /data-traders/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestCloth/);
  assert.match(viewFile, /c4-lrb-search/);
  assert.match(viewFile, /parcelTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "psl"/);
  assert.match(app, /view === "lrb"/);
  const rejects = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round63.tsx"), "utf8");
  const cheats = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round64.tsx"), "utf8");
  assert.match(rejects, /c4-reject-atelier/);
  assert.match(rejects, /data-logo="mono"/);
  assert.match(cheats, /c4-cheat-atelier/);
  assert.match(cheats, /data-logo="mono"/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND254_COPY.en, key);
  const audit = viewFile.match(/"(pslAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND254_COPY.en, key);
  const atelier = `${rejects}\n${cheats}`.match(/"((?:rj|cs)Atelier[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of atelier) assert.ok(key in ROUND254_COPY.en, key);
  console.log("crmv4 round254 tests passed");
}

main();
