/**
 * Planisphere discs, seal plates, the ivory voice folio, and the champagne date rail.
 * Run: TZ=UTC npx tsx tests/crmv4-round293.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND293_COPY } from "../src/lib/crmv4/copy-round293";
import {
  ROUND293_FEATURES,
  activeChart,
  activePeg,
  activeSpan,
  activeWind,
  addPlanisphere,
  briskPlanisphere,
  chartGap,
  dropPlanisphereView,
  fairDiscKeeper,
  fullPeg,
  houseWind,
  idlePlanisphere,
  innerChart,
  latePlanisphere,
  leadingSeal,
  liftSpan,
  lowerSpan,
  movePlanisphereFocus,
  outerChart,
  overduePlanisphere,
  pairPeg,
  planisphereBand,
  planisphereChart,
  planispherePeg,
  planisphereSpan,
  planisphereWind,
  readPlanisphereViews,
  restingPlanisphere,
  sealEven,
  sealFirst,
  sealHeld,
  sealHue,
  sealLane,
  sealLanesCsv,
  sealLeap,
  sealMark,
  sealMinutes,
  sealMint,
  sealMorning,
  sealOpen,
  sealRowsCsv,
  sealRust,
  sealSoon,
  sealSpace,
  sealState,
  sealStep,
  sealTail,
  sealToday,
  sealTwin,
  sealWeekday,
  sealWeekend,
  suggestChart,
  suggestPlanisphereWind,
  suggestSpan,
  type Planisphere,
  type SealRow,
} from "../src/lib/crmv4/round293";

const NOW = Date.parse("2026-11-13T12:00:00.000Z");

function disc(partial: Partial<Planisphere> & { id: string; title: string }): Planisphere {
  return {
    note: "",
    keeper: "",
    chart: "",
    span: null,
    wind: "",
    peg: 2,
    tags: [],
    logged: false,
    locked: false,
    stowed: false,
    flagged: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND293_FEATURES.length, 25);
  assert.equal(ROUND293_FEATURES.includes("seal"), true);
  assert.equal(ROUND293_FEATURES.includes("span"), true);
  assert.equal(ROUND293_FEATURES.includes("fair-keeper"), true);
  assert.equal(planisphereChart(" lyre "), "lyre");
  assert.equal(planisphereChart("brass"), "");
  assert.equal(planisphereSpan("5"), 5);
  assert.equal(planisphereSpan(10), 10);
  assert.equal(planisphereSpan("15"), 15);
  assert.equal(planisphereSpan("6"), null);
  assert.equal(planispherePeg("2"), 2);
  assert.equal(planispherePeg(4), 4);
  assert.equal(planispherePeg("6"), 6);
  assert.equal(planispherePeg("1"), null);
  assert.equal(planisphereWind("calm"), "CALM");
  assert.equal(planisphereWind("breeze"), "BREEZE");
  assert.equal(planisphereWind("gale"), "GALE");
  assert.equal(planisphereWind("hot"), "");
  assert.equal(innerChart("lyre"), true);
  assert.equal(innerChart("HARP"), true);
  assert.equal(innerChart("crown"), false);
  assert.equal(outerChart("keel"), true);
  assert.equal(outerChart("crown"), true);
  assert.equal(outerChart("lyre"), false);
  assert.equal(planisphereBand("lyre"), "string");
  assert.equal(planisphereBand("harp"), "frame");
  assert.equal(planisphereBand("crown"), "arc");
  assert.equal(planisphereBand("keel"), "hull");
  assert.equal(planisphereBand(""), "");
  assert.equal(chartGap("lyre", "keel"), 3);
  assert.equal(chartGap("crown", "nope"), null);
  assert.equal(houseWind("breeze"), true);
  assert.equal(houseWind("calm"), false);
  assert.equal(pairPeg(4), true);
  assert.equal(pairPeg(2), false);
  assert.equal(fullPeg("6"), true);
  assert.equal(fullPeg(4), false);
  assert.equal(activeChart("inner"), "inner");
  assert.equal(activeChart("keel"), "keel");
  assert.equal(activeChart("gold"), "all");
  assert.equal(activeSpan("15"), "15");
  assert.equal(activeSpan("6"), "all");
  assert.equal(activePeg("2"), "2");
  assert.equal(activePeg("3"), "all");
  assert.equal(activeWind("gale", ["GALE"]), "GALE");
  assert.equal(activeWind("hot", ["GALE"]), "all");
  assert.equal(movePlanisphereFocus(0, 3, -1), 2);
  assert.equal(movePlanisphereFocus(0, 0, 1), 0);

  const cards = [
    disc({ id: "a", title: "Ada", chart: "crown", peg: 2, keeper: "Ned" }),
    disc({ id: "b", title: "Bea", chart: "lyre", wind: "GALE", span: 15, peg: 6, keeper: "Ned" }),
    disc({ id: "c", title: "Cara", chart: "keel", wind: "CALM", span: 10, keeper: "Ida" }),
  ];
  assert.equal(overduePlanisphere(cards[0]), true);
  assert.equal(briskPlanisphere(cards[1]), true);
  assert.equal(restingPlanisphere(cards[2]), true);
  assert.equal(idlePlanisphere(disc({ id: "i", title: "Idle", span: 5, peg: 2 })), true);
  assert.equal(latePlanisphere(cards[1], "keel"), true);
  assert.equal(latePlanisphere(cards[1], "lyre"), false);
  assert.equal(suggestPlanisphereWind(cards), "CALM");
  assert.equal(suggestPlanisphereWind([...cards, disc({ id: "d", title: "Dora", wind: "GALE" })]), "GALE");
  assert.equal(suggestSpan([], 7), 5);
  assert.equal(suggestSpan([], 12), 10);
  assert.equal(suggestSpan([], 20), 15);
  assert.equal(suggestSpan(cards, 7), 10);
  assert.equal(suggestSpan([...cards, disc({ id: "e", title: "Eve", span: 15 })], 7), 15);
  assert.equal(suggestChart(8), "lyre");
  assert.equal(suggestChart(15), "keel");
  assert.equal(fairDiscKeeper(cards, "Ned,Ida"), "Ida");
  const added = addPlanisphere(cards, { title: "Dora", chart: "harp", span: "10", peg: "4", tags: "x y z" });
  assert.equal(added.length, 4);
  assert.equal(added[3].audit, "save");
  assert.deepEqual(added[3].tags, ["x", "y"]);
  assert.equal(addPlanisphere(cards, { title: "Ada" }).length, 3);
  const lifted = liftSpan(cards, "a");
  assert.equal(lifted[0].span, 5);
  assert.equal(lowerSpan(lifted, "a")[0].span, 15);
  assert.equal(dropPlanisphereView([{ id: "v", name: "Desk", tray: "disc", query: "", keeper: "", wind: "all", chart: "all", span: "all", peg: "all" }], "v").length, 0);
  assert.equal(readPlanisphereViews([{ id: "", name: "x" }]).length, 0);

  assert.equal(sealLane("2026-11-13T06:00:00.000Z", NOW), "mint");
  assert.equal(sealSoon("2026-11-13T10:00:00.000Z", NOW), true);
  assert.equal(sealSoon("2026-11-13T06:00:00.000Z", NOW), false);
  assert.equal(sealLane("2026-11-08T12:00:00.000Z", NOW), "linen");
  assert.equal(sealLane("2026-10-20T12:00:00.000Z", NOW), "oak");
  assert.equal(sealLane("2026-08-01T12:00:00.000Z", NOW), "iron");
  assert.equal(sealLane("2026-01-01T12:00:00.000Z", NOW), "rust");
  assert.equal(sealLane("2026-11-14T12:00:00.000Z", NOW), "");
  assert.equal(sealLane("2020-01-01T12:00:00.000Z", NOW), "");
  assert.equal(sealState("", NOW), "clear");
  assert.equal(sealOpen(""), true);
  assert.equal(sealState({ passwordChangedAt: "2026-11-13T06:00:00.000Z" }, NOW), "set");
  assert.equal(sealState({ city: "x" }, NOW), "");
  assert.equal(sealState({ passwordChangedAt: "2026-11-13T06:00:00.000Z", amount: 3 }, NOW), "");
  assert.equal(sealHue("2026-11-13T06:00:00.000Z", NOW), "champagne");
  assert.equal(sealHue("2026-11-08T12:00:00.000Z", NOW), "ivory");
  assert.equal(sealHue("2026-10-20T12:00:00.000Z", NOW), "graphite");
  assert.equal(sealHue("2026-08-01T12:00:00.000Z", NOW), "champagne");
  assert.equal(sealHue("2026-01-01T12:00:00.000Z", NOW), "graphite");
  assert.equal(sealMint("2026-11-13T06:00:00.000Z", NOW), true);
  assert.equal(sealRust("2026-01-01T12:00:00.000Z", NOW), true);
  assert.equal(sealHeld("2026-08-01T12:00:00.000Z", NOW), true);
  assert.equal(sealHeld("2026-01-01T12:00:00.000Z", NOW), false);
  assert.equal(sealMinutes("2026-11-13T06:00:00.000Z", NOW), 360);
  assert.equal(sealToday("2026-11-13T06:00:00.000Z", NOW), true);
  assert.equal(sealToday("2026-11-12T12:00:00.000Z", NOW), false);
  assert.equal(sealWeekday("2026-11-13T06:00:00.000Z", NOW), true);
  assert.equal(sealWeekend("2026-11-14T12:00:00.000Z", NOW), true);
  assert.equal(sealWeekend("2026-11-13T06:00:00.000Z", NOW), false);
  assert.equal(sealMorning("2026-11-13T08:00:00.000Z", NOW), true);
  assert.equal(sealMorning("2026-11-13T18:00:00.000Z", NOW), false);
  assert.equal(sealEven("2026-11-12T12:00:00.000Z", NOW), true);
  assert.equal(sealEven("2026-11-13T06:00:00.000Z", NOW), false);
  assert.equal(sealFirst("2026-11-01T12:00:00.000Z", NOW), true);
  assert.equal(sealStep("2026-11-13T06:00:00.000Z", NOW), 11);
  assert.equal(sealStep("", NOW), 0);
  assert.equal(sealLeap("2024-11-13T12:00:00.000Z", NOW), true);
  assert.equal(sealLeap("2026-11-13T06:00:00.000Z", NOW), false);
  assert.equal(sealTwin("2026-11-06T12:00:00.000Z", NOW), true);
  assert.equal(sealTwin("2026-11-12T12:00:00.000Z", NOW), false);
  assert.equal(sealTail("2026-11-13T06:00:00.000Z"), true);
  assert.equal(sealTail("2026-11-13T06:00:00"), false);
  assert.equal(sealMark("2026-11-13T06:00:00.000Z"), true);
  assert.equal(sealSpace("2026-11-13 06:00:00Z"), true);
  const rows: SealRow[] = [
    { id: "1", label: "Ada", changed: "2026-11-13T06:00:00.000Z" },
    { id: "2", label: "Bea", changed: "2026-10-20T12:00:00.000Z" },
  ];
  assert.equal(leadingSeal(rows, NOW), "mint");
  assert.match(sealLanesCsv(rows, NOW), /mint,1/);
  assert.match(sealLanesCsv(rows, NOW), /oak,1/);
  assert.match(sealRowsCsv(rows, ["1"], NOW), /Ada,2026-11-13T06:00:00.000Z/);

  const locales = ["en", "tr", "de", "ru", "ar"] as const;
  const keys = Object.keys(ROUND293_COPY.en).sort();
  for (const locale of locales) assert.deepEqual(Object.keys(ROUND293_COPY[locale]).sort(), keys);
  assert.equal(crmv4Text("tr", "plnTitle"), ROUND293_COPY.tr.plnTitle);
  assert.equal(crmv4Text("de", "slxTitle"), ROUND293_COPY.de.slxTitle);
  assert.equal(crmv4Text("ru", "plnSub"), ROUND293_COPY.ru.plnSub);
  assert.equal(crmv4Text("ar", "slxSub"), ROUND293_COPY.ar.slxSub);
  assert.equal(crmv4Text("en", "plnLogo"), "7FX");
  assert.equal(crmv4Text("en", "slxLogo"), "7FX");
  assert.equal(crmv4Text("en", "plnTitle"), "Planisphere discs");
  assert.equal(crmv4Text("en", "slxTitle"), "Seal plates");
  assert.equal(crmv4Text("en", "vsFolioKicker"), "Ivory voice folio");
  assert.equal(crmv4Text("en", "cdRailKicker"), "Champagne date rail");
  assert.notEqual(ROUND293_COPY.tr.plnTitle, ROUND293_COPY.en.plnTitle);
  assert.notEqual(ROUND293_COPY.ar.slxTitle, ROUND293_COPY.en.slxTitle);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-planisphere/);
  assert.match(css, /\.c4-seal-index/);
  assert.match(css, /\.c4-planisphere-column/);
  assert.match(css, /\.c4-seal-column/);
  assert.match(css, /\.c4-voice-folio/);
  assert.match(css, /\.c4-date-rail-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round293.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /passwordChangedAt:/);
  assert.match(viewFile, /planisphereCsv/);
  assert.match(viewFile, /sealRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0&role=TRADER/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestPlanisphereWind/);
  assert.match(viewFile, /c4-seal-search/);
  assert.match(viewFile, /planisphereTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "pln"/);
  assert.match(app, /view === "slp"/);
  const voice = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round85.tsx"), "utf8");
  const rail = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round86.tsx"), "utf8");
  assert.match(voice, /c4-voice-folio/);
  assert.match(voice, /c4-voice-folio-mast/);
  assert.match(voice, /data-logo="mono"/);
  assert.match(voice, /vsFolioKicker/);
  assert.match(voice, /vsFolioLead/);
  assert.match(voice, /data-voice-tray/);
  assert.equal(voice.includes("amount"), false);
  assert.match(rail, /c4-date-rail/);
  assert.match(rail, /c4-date-rail-mast/);
  assert.match(rail, /cdRailKicker/);
  assert.match(rail, /cdRailLead/);
  assert.match(rail, /data-utc-marks/);
  assert.equal(rail.includes("amount"), false);
  const named = viewFile.match(/"(pln|slp|slx|vsFolio|cdRail)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of named) assert.equal(typeof ROUND293_COPY.en[key as keyof typeof ROUND293_COPY.en], "string", key);
  console.log("crmv4 round293 tests passed");
}

main();
