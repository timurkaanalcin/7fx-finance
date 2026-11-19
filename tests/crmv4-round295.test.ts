/**
 * Heliometer halves, plumb plates, the ivory link cloister, and the graphite priority nave.
 * Run: TZ=UTC npx tsx tests/crmv4-round295.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND295_COPY } from "../src/lib/crmv4/copy-round295";
import {
  ROUND295_FEATURES,
  activeGlass,
  activeSecond,
  activeSeparation,
  activeSlide,
  addHeliometer,
  briskHeliometer,
  dropHeliometerView,
  fairHalfReader,
  fullSlide,
  heliometerBand,
  heliometerGlass,
  heliometerSecond,
  heliometerSeparation,
  heliometerSlide,
  houseGlass,
  idleHeliometer,
  innerSeparation,
  lateHeliometer,
  leadingPlumb,
  liftSecond,
  lowerSecond,
  moveHeliometerFocus,
  outerSeparation,
  overdueHeliometer,
  pairSlide,
  plumbBob,
  plumbDrop,
  plumbEven,
  plumbEvening,
  plumbFirst,
  plumbHeld,
  plumbHue,
  plumbLane,
  plumbLanesCsv,
  plumbLeap,
  plumbMark,
  plumbMinutes,
  plumbMorning,
  plumbOpen,
  plumbRowsCsv,
  plumbSlack,
  plumbSoon,
  plumbSpace,
  plumbState,
  plumbStep,
  plumbTail,
  plumbToday,
  plumbTwin,
  plumbWeekday,
  plumbWeekend,
  readHeliometerViews,
  restingHeliometer,
  separationGap,
  suggestHeliometerGlass,
  suggestSecond,
  suggestSeparation,
  type Heliometer,
  type PlumbRow,
} from "../src/lib/crmv4/round295";

const NOW = Date.parse("2026-11-13T12:00:00.000Z");

function half(partial: Partial<Heliometer> & { id: string; title: string }): Heliometer {
  return {
    note: "",
    reader: "",
    separation: "",
    second: null,
    glass: "",
    slide: 2,
    tags: [],
    split: false,
    cased: false,
    vaulted: false,
    flagged: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND295_FEATURES.length, 25);
  assert.equal(ROUND295_FEATURES.includes("plumb"), true);
  assert.equal(ROUND295_FEATURES.includes("seconds"), true);
  assert.equal(ROUND295_FEATURES.includes("fair-reader"), true);
  assert.equal(heliometerSeparation(" near "), "near");
  assert.equal(heliometerSeparation("brass"), "");
  assert.equal(heliometerSecond("8"), 8);
  assert.equal(heliometerSecond(16), 16);
  assert.equal(heliometerSecond("32"), 32);
  assert.equal(heliometerSecond("20"), null);
  assert.equal(heliometerSlide("2"), 2);
  assert.equal(heliometerSlide(4), 4);
  assert.equal(heliometerSlide("8"), 8);
  assert.equal(heliometerSlide("3"), null);
  assert.equal(heliometerGlass("clear"), "CLEAR");
  assert.equal(heliometerGlass("veil"), "VEIL");
  assert.equal(heliometerGlass("flare"), "FLARE");
  assert.equal(heliometerGlass("hot"), "");
  assert.equal(innerSeparation("near"), true);
  assert.equal(innerSeparation("MID"), true);
  assert.equal(innerSeparation("far"), false);
  assert.equal(outerSeparation("limb"), true);
  assert.equal(outerSeparation("far"), true);
  assert.equal(outerSeparation("near"), false);
  assert.equal(heliometerBand("near"), "hearth");
  assert.equal(heliometerBand("mid"), "sill");
  assert.equal(heliometerBand("far"), "eave");
  assert.equal(heliometerBand("limb"), "finial");
  assert.equal(heliometerBand(""), "");
  assert.equal(separationGap("near", "limb"), 3);
  assert.equal(separationGap("far", "nope"), null);
  assert.equal(houseGlass("veil"), true);
  assert.equal(houseGlass("clear"), false);
  assert.equal(pairSlide(4), true);
  assert.equal(pairSlide(2), false);
  assert.equal(fullSlide("8"), true);
  assert.equal(fullSlide(4), false);
  assert.equal(activeSeparation("inner"), "inner");
  assert.equal(activeSeparation("limb"), "limb");
  assert.equal(activeSeparation("gold"), "all");
  assert.equal(activeSecond("32"), "32");
  assert.equal(activeSecond("20"), "all");
  assert.equal(activeSlide("2"), "2");
  assert.equal(activeSlide("3"), "all");
  assert.equal(activeGlass("flare", ["FLARE"]), "FLARE");
  assert.equal(activeGlass("hot", ["FLARE"]), "all");
  assert.equal(moveHeliometerFocus(0, 3, -1), 2);
  assert.equal(moveHeliometerFocus(0, 0, 1), 0);

  const cards = [
    half({ id: "a", title: "Ada", separation: "limb", slide: 2, reader: "Ned" }),
    half({ id: "b", title: "Bea", separation: "near", glass: "FLARE", second: 32, slide: 8, reader: "Ned" }),
    half({ id: "c", title: "Cara", separation: "far", glass: "CLEAR", second: 16, reader: "Ida" }),
  ];
  assert.equal(overdueHeliometer(cards[0]), true);
  assert.equal(briskHeliometer(cards[1]), true);
  assert.equal(restingHeliometer(half({ id: "r", title: "Rest", separation: "limb", glass: "CLEAR", second: 16 })), true);
  assert.equal(idleHeliometer(half({ id: "i", title: "Idle", second: 8, slide: 2 })), true);
  assert.equal(lateHeliometer(cards[1], "limb"), true);
  assert.equal(lateHeliometer(cards[1], "near"), false);
  assert.equal(suggestHeliometerGlass(cards), "CLEAR");
  assert.equal(suggestHeliometerGlass([...cards, half({ id: "d", title: "Dora", glass: "FLARE" })]), "FLARE");
  assert.equal(suggestSecond([], 8), 8);
  assert.equal(suggestSecond([], 12), 16);
  assert.equal(suggestSecond([], 20), 32);
  assert.equal(suggestSecond(cards, 8), 16);
  assert.equal(suggestSecond([...cards, half({ id: "e", title: "Eve", second: 32 })], 8), 32);
  assert.equal(suggestSeparation(10), "near");
  assert.equal(suggestSeparation(15), "limb");
  assert.equal(fairHalfReader(cards, "Ned,Ida"), "Ida");
  const added = addHeliometer(cards, { title: "Dora", separation: "mid", second: "16", slide: "4", tags: "a b c" });
  assert.equal(added.length, 4);
  assert.equal(added[3].audit, "save");
  assert.deepEqual(added[3].tags, ["a", "b"]);
  assert.equal(addHeliometer(cards, { title: "Ada" }).length, 3);
  const lifted = liftSecond(cards, "a");
  assert.equal(lifted[0].second, 8);
  assert.equal(lowerSecond(lifted, "a")[0].second, 32);
  assert.equal(dropHeliometerView([{ id: "v", name: "Desk", tray: "half", query: "", reader: "", glass: "all", separation: "all", second: "all", slide: "all" }], "v").length, 0);
  assert.equal(readHeliometerViews([{ id: "", name: "x" }]).length, 0);

  assert.equal(plumbLane("2026-11-13T15:00:00.000Z", NOW), "bob");
  assert.equal(plumbSoon("2026-11-13T13:00:00.000Z", NOW), true);
  assert.equal(plumbSoon("2026-11-13T15:00:00.000Z", NOW), false);
  assert.equal(plumbLane("2026-11-14T12:00:00.000Z", NOW), "cord");
  assert.equal(plumbLane("2026-11-20T12:00:00.000Z", NOW), "weight");
  assert.equal(plumbLane("2026-12-20T12:00:00.000Z", NOW), "slack");
  assert.equal(plumbLane("2026-11-12T12:00:00.000Z", NOW), "coil");
  assert.equal(plumbLane("2026-10-01T12:00:00.000Z", NOW), "drop");
  assert.equal(plumbLane("2020-01-01T12:00:00.000Z", NOW), "");
  assert.equal(plumbState("", NOW), "clear");
  assert.equal(plumbOpen(""), true);
  assert.equal(plumbState({ retentionFollowUpAt: "2026-11-13T15:00:00.000Z" }, NOW), "set");
  assert.equal(plumbState({ city: "x" }, NOW), "");
  assert.equal(plumbState({ retentionFollowUpAt: "2026-11-13T15:00:00.000Z", amount: 3 }, NOW), "");
  assert.equal(plumbHue("2026-11-13T15:00:00.000Z", NOW), "champagne");
  assert.equal(plumbHue("2026-11-14T12:00:00.000Z", NOW), "ivory");
  assert.equal(plumbHue("2026-11-20T12:00:00.000Z", NOW), "ivory");
  assert.equal(plumbHue("2026-12-20T12:00:00.000Z", NOW), "graphite");
  assert.equal(plumbHue("2026-10-01T12:00:00.000Z", NOW), "graphite");
  assert.equal(plumbHue("2026-11-12T12:00:00.000Z", NOW), "champagne");
  assert.equal(plumbBob("2026-11-13T15:00:00.000Z", NOW), true);
  assert.equal(plumbDrop("2026-10-01T12:00:00.000Z", NOW), true);
  assert.equal(plumbSlack("2026-12-20T12:00:00.000Z", NOW), true);
  assert.equal(plumbHeld("2026-11-13T15:00:00.000Z", NOW), true);
  assert.equal(plumbHeld("2026-11-14T12:00:00.000Z", NOW), true);
  assert.equal(plumbHeld("2026-10-01T12:00:00.000Z", NOW), false);
  assert.equal(plumbMinutes("2026-11-13T15:00:00.000Z", NOW), 180);
  assert.equal(plumbMinutes("2026-11-12T12:00:00.000Z", NOW), null);
  assert.equal(plumbToday("2026-11-13T15:00:00.000Z", NOW), true);
  assert.equal(plumbToday("2026-11-12T12:00:00.000Z", NOW), false);
  assert.equal(plumbWeekday("2026-11-13T15:00:00.000Z", NOW), true);
  assert.equal(plumbWeekend("2026-11-14T12:00:00.000Z", NOW), true);
  assert.equal(plumbWeekend("2026-11-13T15:00:00.000Z", NOW), false);
  assert.equal(plumbMorning("2026-11-13T08:00:00.000Z", NOW), true);
  assert.equal(plumbMorning("2026-11-13T18:00:00.000Z", NOW), false);
  assert.equal(plumbEvening("2026-11-13T19:00:00.000Z", NOW), true);
  assert.equal(plumbEvening("2026-11-13T08:00:00.000Z", NOW), false);
  assert.equal(plumbEven("2026-11-12T12:00:00.000Z", NOW), true);
  assert.equal(plumbEven("2026-11-13T15:00:00.000Z", NOW), false);
  assert.equal(plumbFirst("2026-11-01T12:00:00.000Z", NOW), true);
  assert.equal(plumbStep("2026-11-13T15:00:00.000Z", NOW), 11);
  assert.equal(plumbStep("", NOW), 0);
  assert.equal(plumbLeap("2024-11-13T12:00:00.000Z", NOW), true);
  assert.equal(plumbLeap("2026-11-13T15:00:00.000Z", NOW), false);
  assert.equal(plumbTwin("2026-11-06T12:00:00.000Z", NOW), true);
  assert.equal(plumbTwin("2026-11-12T12:00:00.000Z", NOW), false);
  assert.equal(plumbTail("2026-11-13T15:00:00.000Z"), true);
  assert.equal(plumbTail("2026-11-13T15:00:00"), false);
  assert.equal(plumbMark("2026-11-13T15:00:00.000Z"), true);
  assert.equal(plumbSpace("2026-11-13 15:00:00Z"), true);
  const rows: PlumbRow[] = [
    { id: "1", label: "Ada", follow: "2026-11-13T15:00:00.000Z" },
    { id: "2", label: "Bea", follow: "2026-10-01T12:00:00.000Z" },
  ];
  assert.equal(leadingPlumb(rows, NOW), "bob");
  assert.match(plumbLanesCsv(rows, NOW), /bob,1/);
  assert.match(plumbLanesCsv(rows, NOW), /drop,1/);
  assert.match(plumbRowsCsv(rows, ["1"], NOW), /Ada,2026-11-13T15:00:00.000Z/);

  const locales = ["en", "tr", "de", "ru", "ar"] as const;
  const keys = Object.keys(ROUND295_COPY.en).sort();
  for (const locale of locales) assert.deepEqual(Object.keys(ROUND295_COPY[locale]).sort(), keys);
  assert.equal(crmv4Text("tr", "hlmTitle"), ROUND295_COPY.tr.hlmTitle);
  assert.equal(crmv4Text("de", "pmbTitle"), ROUND295_COPY.de.pmbTitle);
  assert.equal(crmv4Text("ru", "hlmSub"), ROUND295_COPY.ru.hlmSub);
  assert.equal(crmv4Text("ar", "pmbSub"), ROUND295_COPY.ar.pmbSub);
  assert.equal(crmv4Text("en", "hlmLogo"), "7FX");
  assert.equal(crmv4Text("en", "pmbLogo"), "7FX");
  assert.equal(crmv4Text("en", "hlmTitle"), "Heliometer halves");
  assert.equal(crmv4Text("en", "pmbTitle"), "Plumb plates");
  assert.equal(crmv4Text("en", "qkCloisterKicker"), "Ivory link cloister");
  assert.equal(crmv4Text("en", "pgNaveKicker"), "Graphite priority nave");
  assert.notEqual(ROUND295_COPY.tr.hlmTitle, ROUND295_COPY.en.hlmTitle);
  assert.notEqual(ROUND295_COPY.ar.pmbTitle, ROUND295_COPY.en.pmbTitle);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-heliometer/);
  assert.match(css, /\.c4-plumb-index/);
  assert.match(css, /\.c4-heliometer-column/);
  assert.match(css, /\.c4-plumb-column/);
  assert.match(css, /\.c4-link-cloister/);
  assert.match(css, /\.c4-priority-nave-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round295.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /retentionFollowUpAt:/);
  assert.match(viewFile, /heliometerCsv/);
  assert.match(viewFile, /plumbRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0&role=TRADER/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestHeliometerGlass/);
  assert.match(viewFile, /c4-plumb-search/);
  assert.match(viewFile, /heliometerTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "hlm"/);
  assert.match(app, /view === "pmb"/);
  const court = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round88.tsx"), "utf8");
  assert.match(court, /c4-link-cloister/);
  assert.match(court, /c4-link-cloister-mast/);
  assert.match(court, /data-logo="mono"/);
  assert.match(court, /qkCloisterKicker/);
  assert.match(court, /qkCloisterLead/);
  assert.match(court, /data-quick-links/);
  assert.equal(court.includes("amount"), false);
  assert.match(court, /c4-priority-nave/);
  assert.match(court, /c4-priority-nave-mast/);
  assert.match(court, /pgNaveKicker/);
  assert.match(court, /pgNaveLead/);
  assert.match(court, /data-priority-glance/);
  const named = `${viewFile}\n${court}`.match(/"(hlm|pmb|qkCloister|pgNave)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of named) assert.equal(typeof ROUND295_COPY.en[key as keyof typeof ROUND295_COPY.en], "string", key);
  console.log("crmv4 round295 tests passed");
}

main();
