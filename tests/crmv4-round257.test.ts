/**
 * Cistern slips and join plates.
 * Run: TZ=UTC npx tsx tests/crmv4-round257.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND257_COPY } from "../src/lib/crmv4/copy-round257";
import {
  ROUND257_FEATURES,
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
} from "../src/lib/crmv4/round257";

function main() {
  assert.equal(ROUND257_FEATURES.length, 25);
  assert.equal(seasonOf(" ebb "), "ebb");
  assert.equal(seasonOf("paris"), "");
  assert.equal(windowOf("3"), 3);
  assert.equal(windowOf(9), 9);
  assert.equal(windowOf("21"), 21);
  assert.equal(windowOf("20"), null);
  assert.equal(warmthOf("1"), 1);
  assert.equal(warmthOf(3), 3);
  assert.equal(warmthOf("5"), 5);
  assert.equal(warmthOf("7"), 7);
  assert.equal(warmthOf("2"), null);
  assert.equal(fiberOf("clay"), "CLAY");
  assert.equal(fiberOf("stone"), "STONE");
  assert.equal(fiberOf("glass"), "GLASS");
  assert.equal(fiberOf("oak"), "");
  assert.equal(cadenceOf("still"), "still");
  assert.equal(cadenceOf("drift"), "drift");
  assert.equal(cadenceOf("surge"), "surge");
  assert.equal(cadenceOf("walk"), "");
  assert.equal(peakSeason("flood"), true);
  assert.equal(peakSeason("SPRING"), true);
  assert.equal(peakSeason("neap"), false);
  assert.equal(quietSeason("ebb"), true);
  assert.equal(quietSeason("neap"), true);
  assert.equal(quietSeason("flood"), false);
  assert.equal(seasonBand("ebb"), "early");
  assert.equal(seasonBand("neap"), "early");
  assert.equal(seasonBand("flood"), "mid");
  assert.equal(seasonBand("spring"), "late");
  assert.equal(seasonBand(""), "");
  assert.equal(seasonGap("ebb", "neap"), 1);
  assert.equal(seasonGap("neap", "ebb"), -1);
  assert.equal(seasonGap("", "ebb"), null);
  assert.equal(houseFiber("clay"), true);
  assert.equal(houseFiber("STONE"), true);
  assert.equal(houseFiber("glass"), false);
  assert.equal(activeSeason("peak"), "peak");
  assert.equal(activeSeason("ebb"), "ebb");
  assert.equal(activeSeason("paris"), "all");
  assert.equal(activeWindow("3"), "3");
  assert.equal(activeWindow("20"), "all");
  assert.equal(activeCadence("drift", ["still", "drift", "surge"]), "drift");
  assert.equal(activeCadence("walk", ["still", "drift", "surge"]), "all");
  assert.equal(activeWarmth("5"), "5");
  assert.equal(activeWarmth("2"), "all");
  assert.equal(activeFiber("stone"), "stone");
  assert.equal(activeFiber("oak"), "all");
  assert.equal(moveSlipFocus(0, 3, 1), 1);
  assert.equal(moveSlipFocus(0, 3, -1), 2);
  assert.equal(suggestFiber([]), "CLAY");
  assert.equal(suggestWindow([], 4), 3);
  assert.equal(suggestWindow([], 12), 9);
  assert.equal(suggestWindow([], 19), 21);
  assert.equal(fairKeeper([], "Ada, Bea"), "Ada");

  const first = addSlip([], {
    id: "a",
    title: "  North cistern ",
    note: "",
    keeper: "Ada",
    season: "flood",
    fiber: "clay",
    cadence: "still",
    window: 3,
    warmth: 1,
    tags: "m m n",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North cistern");
  assert.equal(first[0].note, "");
  assert.equal(first[0].fiber, "CLAY");
  assert.equal(first[0].tags.join(""), "mn");
  assert.equal(first[0].audit, "save");
  assert.equal(overdueSlip(first[0]), true);
  assert.equal(addSlip(first, { id: "a", title: "Other" }).length, 1);
  assert.equal(addSlip(first, { id: "b", title: "North cistern" }).length, 1);
  assert.equal(addSlip(first, { id: "b", title: "   " }).length, 1);

  const pinned = bulkSlipPin(first, ["a"]);
  assert.equal(overdueSlip(pinned[0]), false);
  assert.equal(fairKeeper(pinned, "Ada, Bea"), "Ada");
  const quiet = addSlip(pinned, { id: "q", title: "Neap rest", keeper: "Bea", season: "neap", cadence: "still", warmth: 1 });
  assert.equal(idleSlip(quiet[0]), true);
  assert.equal(lateSlip(quiet[0], "flood"), false);
  const behind = addSlip([], { id: "z", title: "Ebb late", season: "ebb", warmth: 1 });
  assert.equal(lateSlip(behind[0], "spring"), true);
  assert.equal(lateSlip({ ...behind[0], warmth: 3 }, "spring"), false);
  const rushed = addSlip([], { id: "r", title: "Flood surge", season: "flood", cadence: "surge", warmth: 7 });
  assert.equal(rushSlip(rushed[0]), true);
  const rested = addSlip([], { id: "s", title: "Neap drift", season: "neap", cadence: "drift", window: 21 });
  assert.equal(restingSlip(rested[0]), true);
  assert.equal(lengthenWindow(rested, "s")[0].window, 21);
  assert.equal(lengthenWindow([{ ...rested[0], window: null }], "s")[0].window, 3);
  assert.equal(lengthenWindow(first, "a")[0].window, 9);
  assert.equal(shortenWindow(first, "a")[0].window, 3);
  assert.equal(shortenWindow([{ ...first[0], window: null }], "a")[0].window, 21);
  assert.equal(cycleCadence(first, "a")[0].cadence, "drift");
  assert.equal(raiseWarmth(first, "a")[0].warmth, 3);
  assert.equal(lowerWarmth(first, "a")[0].warmth, 1);
  assert.equal(lowerWarmth([{ ...first[0], warmth: 7 }], "a")[0].warmth, 5);
  assert.equal(busiestKeeper(quiet), "Bea");
  assert.equal(neighborSlipCount(quiet) >= 0, true);
  assert.match(slipCsv(first, "spring"), /North cistern/);
  assert.match(slipTimeline(first).map((lane) => lane.warmth).join(","), /1/);

  const glassBook = addSlip(addSlip([], { id: "y1", title: "Glass one", fiber: "glass", season: "neap" }), { id: "y2", title: "Glass two", fiber: "glass", season: "flood" });
  assert.equal(suggestFiber(glassBook), "GLASS");
  assert.equal(suggestWindow(rested, 4), 21);

  const views = addSlipView([], { id: "v", name: "Peak", tray: "open", season: "peak", window: "3", fiber: "clay", cadence: "still", warmth: "1" });
  assert.equal(views[0].season, "peak");
  assert.equal(dropSlipView(views, "v").length, 0);
  assert.equal(readSlipViews([{ id: "v", name: "Peak", tray: "nope" }])[0].tray, "open");

  assert.equal(plateState("1990-03-15"), "set");
  assert.equal(plateLane("1990-03-15"), "night");
  assert.equal(plateStamp("1990-03-15"), "0000");
  assert.equal(plateHue("1990-03-15"), "ivory");
  assert.equal(plateHue("1990-03-15T14:30:00Z"), "graphite");
  assert.equal(plateHue("1990-03-15T18:45:00Z"), "champagne");
  assert.equal(plateStep("1990-03-15T18:45:00Z"), 18);
  assert.equal(plateNotch("1990-03-15"), true);
  assert.equal(plateNotch("1990-03-15T14:30:00Z"), true);
  assert.equal(plateNotch("1990-03-15T09:11:00Z"), false);
  assert.equal(plateEcho("1990-03-15T09:11:00Z"), true);
  assert.equal(plateEcho("1990-03-15T09:22:00Z"), true);
  assert.equal(plateEcho("1990-03-15T14:30:00Z"), false);
  assert.equal(plateWide("1990-03-15T18:45:00Z"), true);
  assert.equal(plateWide("1990-03-15T14:30:00Z"), false);
  assert.equal(plateSpoken("1990-03-11"), true);
  assert.equal(plateSpoken("1990-03-17"), true);
  assert.equal(plateSpoken("1990-03-15"), false);
  assert.equal(plateLane("1990-03-15T05:00:00Z"), "night");
  assert.equal(plateLane("1990-03-15T06:00:00Z"), "morning");
  assert.equal(plateLane("1990-03-15T12:00:00Z"), "afternoon");
  assert.equal(plateLane("1990-03-15T17:00:00Z"), "afternoon");
  assert.equal(plateLane("1990-03-15T18:00:00Z"), "evening");
  assert.equal(plateLeap("2000-02-29"), true);
  assert.equal(plateLane("2000-02-29"), "night");
  assert.equal(plateState("1900-02-29"), "clear");
  assert.equal(plateState("1990-02-31"), "clear");
  assert.equal(plateState(""), "clear");
  assert.equal(plateState("paris"), "clear");
  assert.equal(plateState({ createdAt: "1990-03-15", balance: 1 }), "");
  assert.equal(plateState({ code: "HOUSE" }), "");
  assert.equal(plateLane({ createdAt: "1990-03-15T14:30:00Z" }), "afternoon");

  const book = [
    { id: "1", label: "Ada", note: "1990-12-01T20:00:00Z" },
    { id: "2", label: "Bea", note: "1991-01-11T22:30:00Z" },
    { id: "3", label: "Cem", note: "1990-03-15T08:00:00Z" },
  ];
  assert.equal(leadingPlate(book), "evening");
  assert.match(plateLanesCsv(book), /evening,2/);
  assert.match(plateRowsCsv(book, ["1"]), /2000,evening,ivory/);
  assert.match(plateRowsCsv(book, ["1"]), /2230,evening,graphite/);
  assert.match(plateRowsCsv(book, ["1"]), /0800,morning,ivory/);

  const keys = Object.keys(ROUND257_COPY.en);
  assert.ok(keys.length >= 160);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND257_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND257_COPY[locale][key as keyof typeof ROUND257_COPY.en], "string");
      assert.ok(ROUND257_COPY[locale][key as keyof typeof ROUND257_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "cstTitle"), ROUND257_COPY.tr.cstTitle);
  assert.equal(crmv4Text("de", "jnpTitle"), ROUND257_COPY.de.jnpTitle);
  assert.equal(crmv4Text("ru", "cstSub"), ROUND257_COPY.ru.cstSub);
  assert.equal(crmv4Text("ar", "jnpSub"), ROUND257_COPY.ar.jnpSub);
  assert.equal(crmv4Text("en", "cstLogo"), "7FX");
  assert.equal(crmv4Text("en", "cstTitle"), "Cistern slips");
  assert.notEqual(ROUND257_COPY.tr.cstTitle, ROUND257_COPY.en.cstTitle);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-cst/);
  assert.match(css, /\.c4-jnp-index/);
  assert.match(css, /\.c4-win-laurel/);
  assert.match(css, /\.c4-scale-letter/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round257.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /createdAt/);
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
  assert.match(viewFile, /c4-jnp-search/);
  assert.match(viewFile, /slipTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "cst"/);
  assert.match(app, /view === "jnp"/);
  const win = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round69.tsx"), "utf8");
  const scale = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round73.tsx"), "utf8");
  assert.match(win, /c4-win-laurel/);
  assert.match(win, /data-logo="mono"/);
  assert.match(scale, /c4-scale-letter/);
  assert.match(scale, /data-logo="mono"/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND257_COPY.en, key);
  const audit = viewFile.match(/"(cstAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND257_COPY.en, key);
  const salon = `${win}\n${scale}`.match(/"((?:wnLaurel|tyLetter)[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of salon) assert.ok(key in ROUND257_COPY.en, key);
  console.log("crmv4 round257 tests passed");
}

main();
