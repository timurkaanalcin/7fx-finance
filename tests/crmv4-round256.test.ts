/**
 * Reliquary slips and natal plates.
 * Run: TZ=UTC npx tsx tests/crmv4-round256.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND256_COPY } from "../src/lib/crmv4/copy-round256";
import {
  ROUND256_FEATURES,
  activeCadence,
  activeFiber,
  activeSeason,
  activeWarmth,
  activeWindow,
  addSlip,
  addSlipView,
  bulkSlipPin,
  busiestKeeper,
  cadenceOf,
  cycleCadence,
  dropSlipView,
  fairKeeper,
  fiberOf,
  houseFiber,
  idleSlip,
  lateSlip,
  leadingPlate,
  lengthenWindow,
  lowerWarmth,
  moveSlipFocus,
  neighborSlipCount,
  overdueSlip,
  peakSeason,
  plateEcho,
  plateHue,
  plateLane,
  plateLanesCsv,
  plateLeap,
  plateNotch,
  plateRowsCsv,
  plateSpoken,
  plateStamp,
  plateState,
  plateStep,
  plateWide,
  quietSeason,
  raiseWarmth,
  readSlipViews,
  restingSlip,
  rushSlip,
  seasonBand,
  seasonGap,
  seasonOf,
  shortenWindow,
  slipCsv,
  slipTimeline,
  suggestFiber,
  suggestWindow,
  warmthOf,
  windowOf,
} from "../src/lib/crmv4/round256";

function main() {
  assert.equal(ROUND256_FEATURES.length, 25);
  assert.equal(seasonOf(" frost "), "frost");
  assert.equal(seasonOf("paris"), "");
  assert.equal(windowOf("7"), 7);
  assert.equal(windowOf(14), 14);
  assert.equal(windowOf("28"), 28);
  assert.equal(windowOf("20"), null);
  assert.equal(warmthOf("2"), 2);
  assert.equal(warmthOf(4), 4);
  assert.equal(warmthOf("6"), 6);
  assert.equal(warmthOf("8"), 8);
  assert.equal(warmthOf("7"), null);
  assert.equal(fiberOf("linen"), "LINEN");
  assert.equal(fiberOf("wool"), "WOOL");
  assert.equal(fiberOf("silk"), "SILK");
  assert.equal(fiberOf("oak"), "");
  assert.equal(cadenceOf("hush"), "hush");
  assert.equal(cadenceOf("walk"), "walk");
  assert.equal(cadenceOf("rush"), "rush");
  assert.equal(cadenceOf("still"), "");
  assert.equal(peakSeason("frost"), true);
  assert.equal(peakSeason("HARVEST"), true);
  assert.equal(peakSeason("bloom"), false);
  assert.equal(quietSeason("thaw"), true);
  assert.equal(quietSeason("bloom"), true);
  assert.equal(quietSeason("frost"), false);
  assert.equal(seasonBand("frost"), "early");
  assert.equal(seasonBand("thaw"), "early");
  assert.equal(seasonBand("bloom"), "mid");
  assert.equal(seasonBand("harvest"), "late");
  assert.equal(seasonBand(""), "");
  assert.equal(seasonGap("frost", "thaw"), 1);
  assert.equal(seasonGap("thaw", "frost"), -1);
  assert.equal(seasonGap("", "frost"), null);
  assert.equal(houseFiber("linen"), true);
  assert.equal(houseFiber("WOOL"), true);
  assert.equal(houseFiber("silk"), false);
  assert.equal(activeSeason("peak"), "peak");
  assert.equal(activeSeason("frost"), "frost");
  assert.equal(activeSeason("paris"), "all");
  assert.equal(activeWindow("7"), "7");
  assert.equal(activeWindow("20"), "all");
  assert.equal(activeCadence("walk", ["hush", "walk", "rush"]), "walk");
  assert.equal(activeCadence("still", ["hush", "walk", "rush"]), "all");
  assert.equal(activeWarmth("6"), "6");
  assert.equal(activeWarmth("3"), "all");
  assert.equal(activeFiber("wool"), "wool");
  assert.equal(activeFiber("oak"), "all");
  assert.equal(moveSlipFocus(0, 3, 1), 1);
  assert.equal(moveSlipFocus(0, 3, -1), 2);
  assert.equal(suggestFiber([]), "LINEN");
  assert.equal(suggestWindow([], 4), 7);
  assert.equal(suggestWindow([], 12), 14);
  assert.equal(suggestWindow([], 19), 28);
  assert.equal(fairKeeper([], "Ada, Bea"), "Ada");

  const first = addSlip([], {
    id: "a",
    title: "  North reliquary ",
    note: "",
    keeper: "Ada",
    season: "frost",
    fiber: "linen",
    cadence: "hush",
    window: 7,
    warmth: 2,
    tags: "a a b",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North reliquary");
  assert.equal(first[0].note, "");
  assert.equal(first[0].fiber, "LINEN");
  assert.equal(first[0].tags.join(""), "ab");
  assert.equal(first[0].audit, "save");
  assert.equal(overdueSlip(first[0]), true);
  assert.equal(addSlip(first, { id: "a", title: "Other" }).length, 1);
  assert.equal(addSlip(first, { id: "b", title: "North reliquary" }).length, 1);
  assert.equal(addSlip(first, { id: "b", title: "   " }).length, 1);

  const pinned = bulkSlipPin(first, ["a"]);
  assert.equal(overdueSlip(pinned[0]), false);
  assert.equal(fairKeeper(pinned, "Ada, Bea"), "Ada");
  const quiet = addSlip(pinned, { id: "q", title: "Thaw rest", keeper: "Bea", season: "thaw", cadence: "hush", warmth: 2 });
  assert.equal(idleSlip(quiet[0]), true);
  assert.equal(lateSlip(quiet[0], "bloom"), false);
  const behind = addSlip([], { id: "z", title: "Frost late", season: "frost", warmth: 2 });
  assert.equal(lateSlip(behind[0], "harvest"), true);
  assert.equal(lateSlip({ ...behind[0], warmth: 4 }, "harvest"), false);
  const rushed = addSlip([], { id: "r", title: "Frost rush", season: "frost", cadence: "rush", warmth: 8 });
  assert.equal(rushSlip(rushed[0]), true);
  const rested = addSlip([], { id: "s", title: "Bloom rest", season: "bloom", cadence: "walk", window: 28 });
  assert.equal(restingSlip(rested[0]), true);
  assert.equal(lengthenWindow(rested, "s")[0].window, 28);
  assert.equal(lengthenWindow([{ ...rested[0], window: null }], "s")[0].window, 7);
  assert.equal(lengthenWindow(first, "a")[0].window, 14);
  assert.equal(shortenWindow(first, "a")[0].window, 7);
  assert.equal(shortenWindow([{ ...first[0], window: null }], "a")[0].window, 28);
  assert.equal(cycleCadence(first, "a")[0].cadence, "walk");
  assert.equal(raiseWarmth(first, "a")[0].warmth, 4);
  assert.equal(lowerWarmth(first, "a")[0].warmth, 2);
  assert.equal(lowerWarmth([{ ...first[0], warmth: 8 }], "a")[0].warmth, 6);
  assert.equal(busiestKeeper(quiet), "Bea");
  assert.equal(neighborSlipCount(quiet) >= 0, true);
  assert.match(slipCsv(first, "harvest"), /North reliquary/);
  assert.match(slipTimeline(first).map((lane) => lane.warmth).join(","), /2/);

  const silkBook = addSlip(addSlip([], { id: "y1", title: "Silk one", fiber: "silk", season: "thaw" }), { id: "y2", title: "Silk two", fiber: "silk", season: "bloom" });
  assert.equal(suggestFiber(silkBook), "SILK");
  assert.equal(suggestWindow(rested, 4), 28);

  const views = addSlipView([], { id: "v", name: "Peak", tray: "open", season: "peak", window: "7", fiber: "linen", cadence: "hush", warmth: "2" });
  assert.equal(views[0].season, "peak");
  assert.equal(dropSlipView(views, "v").length, 0);
  assert.equal(readSlipViews([{ id: "v", name: "Peak", tray: "nope" }])[0].tray, "open");

  assert.equal(plateState("1990-03-15"), "set");
  assert.equal(plateLane("1990-03-15"), "spring");
  assert.equal(plateStamp("1990-03-15"), "MAR15");
  assert.equal(plateHue("1990-03-15"), "graphite");
  assert.equal(plateHue("1990-03-05"), "ivory");
  assert.equal(plateHue("1990-03-21"), "champagne");
  assert.equal(plateStep("1990-03-15"), 3);
  assert.equal(plateNotch("1990-03-15"), true);
  assert.equal(plateNotch("1990-03-01"), true);
  assert.equal(plateNotch("1990-03-02"), false);
  assert.equal(plateEcho("1990-03-11"), true);
  assert.equal(plateEcho("1990-03-22"), true);
  assert.equal(plateEcho("1990-03-15"), false);
  assert.equal(plateWide("1990-03-21"), true);
  assert.equal(plateWide("1990-03-15"), false);
  assert.equal(plateSpoken("1990-03-11"), true);
  assert.equal(plateSpoken("1990-03-17"), true);
  assert.equal(plateSpoken("1990-03-15"), false);
  assert.equal(plateLane("1990-12-01"), "winter");
  assert.equal(plateLane("1990-07-04"), "summer");
  assert.equal(plateLane("1990-10-31"), "autumn");
  assert.equal(plateLeap("2000-02-29"), true);
  assert.equal(plateLane("2000-02-29"), "winter");
  assert.equal(plateState("1900-02-29"), "clear");
  assert.equal(plateState("1990-02-31"), "clear");
  assert.equal(plateState(""), "clear");
  assert.equal(plateState("paris"), "clear");
  assert.equal(plateState({ birthDate: "1990-03-15", balance: 1 }), "");
  assert.equal(plateState({ code: "HOUSE" }), "");
  assert.equal(plateLane({ birthDate: "1990-03-15" }), "spring");

  const book = [
    { id: "1", label: "Ada", note: "1990-12-01" },
    { id: "2", label: "Bea", note: "1991-01-11" },
    { id: "3", label: "Cem", note: "1990-03-15" },
  ];
  assert.equal(leadingPlate(book), "winter");
  assert.match(plateLanesCsv(book), /winter,2/);
  assert.match(plateRowsCsv(book, ["1"]), /1990-12-01,DEC01,winter,ivory/);
  assert.match(plateRowsCsv(book, ["1"]), /1990-03-15,MAR15,spring,graphite/);

  const keys = Object.keys(ROUND256_COPY.en);
  assert.ok(keys.length >= 160);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND256_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND256_COPY[locale][key as keyof typeof ROUND256_COPY.en], "string");
      assert.ok(ROUND256_COPY[locale][key as keyof typeof ROUND256_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "rlqTitle"), ROUND256_COPY.tr.rlqTitle);
  assert.equal(crmv4Text("de", "ntpTitle"), ROUND256_COPY.de.ntpTitle);
  assert.equal(crmv4Text("ru", "rlqSub"), ROUND256_COPY.ru.rlqSub);
  assert.equal(crmv4Text("ar", "ntpSub"), ROUND256_COPY.ar.ntpSub);
  assert.equal(crmv4Text("en", "rlqLogo"), "7FX");
  assert.equal(crmv4Text("en", "rlqTitle"), "Reliquary slips");
  assert.notEqual(ROUND256_COPY.tr.rlqTitle, ROUND256_COPY.en.rlqTitle);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-rlq/);
  assert.match(css, /\.c4-ntp-index/);
  assert.match(css, /\.c4-stale-cloister/);
  assert.match(css, /\.c4-prep-oratory/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round256.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /birthDate/);
  assert.match(viewFile, /slipCsv/);
  assert.match(viewFile, /plateRowsCsv/);
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
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-traders/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestFiber/);
  assert.match(viewFile, /c4-ntp-search/);
  assert.match(viewFile, /slipTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "rlq"/);
  assert.match(app, /view === "ntp"/);
  const stale = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round67.tsx"), "utf8");
  const prep = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round68.tsx"), "utf8");
  assert.match(stale, /c4-stale-cloister/);
  assert.match(stale, /data-logo="mono"/);
  assert.match(prep, /c4-prep-oratory/);
  assert.match(prep, /data-logo="mono"/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND256_COPY.en, key);
  const audit = viewFile.match(/"(rlqAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND256_COPY.en, key);
  const salon = `${stale}\n${prep}`.match(/"((?:slCloister|mpOratory)[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of salon) assert.ok(key in ROUND256_COPY.en, key);
  console.log("crmv4 round256 tests passed");
}

main();
