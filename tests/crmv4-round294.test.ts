/**
 * Torquetum arcs, latch plates, the graphite banner court, and the ivory type cabinet.
 * Run: TZ=UTC npx tsx tests/crmv4-round294.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND294_COPY } from "../src/lib/crmv4/copy-round294";
import {
  ROUND294_FEATURES,
  activeAir,
  activeAltitude,
  activeDegree,
  activeTooth,
  addTorquetum,
  altitudeGap,
  briskTorquetum,
  dropTorquetumView,
  fairArcScribe,
  fullTooth,
  houseAir,
  idleTorquetum,
  innerAltitude,
  lateTorquetum,
  latchAhead,
  latchDust,
  latchEvening,
  latchEven,
  latchFirst,
  latchHeld,
  latchHue,
  latchLane,
  latchLanesCsv,
  latchLeap,
  latchMark,
  latchMinutes,
  latchMorning,
  latchOpen,
  latchRowsCsv,
  latchSoon,
  latchSpace,
  latchSpark,
  latchState,
  latchStep,
  latchTail,
  latchToday,
  latchTwin,
  latchWeekday,
  latchWeekend,
  leadingLatch,
  liftDegree,
  lowerDegree,
  moveTorquetumFocus,
  outerAltitude,
  overdueTorquetum,
  pairTooth,
  readTorquetumViews,
  restingTorquetum,
  suggestAltitude,
  suggestDegree,
  suggestTorquetumAir,
  torquetumAir,
  torquetumAltitude,
  torquetumBand,
  torquetumDegree,
  torquetumTooth,
  type LatchRow,
  type Torquetum,
} from "../src/lib/crmv4/round294";

const NOW = Date.parse("2026-11-13T12:00:00.000Z");

function arc(partial: Partial<Torquetum> & { id: string; title: string }): Torquetum {
  return {
    note: "",
    scribe: "",
    altitude: "",
    degree: null,
    air: "",
    tooth: 1,
    tags: [],
    scribed: false,
    sleeved: false,
    chested: false,
    flagged: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND294_FEATURES.length, 25);
  assert.equal(ROUND294_FEATURES.includes("latch"), true);
  assert.equal(ROUND294_FEATURES.includes("degree"), true);
  assert.equal(ROUND294_FEATURES.includes("fair-scribe"), true);
  assert.equal(torquetumAltitude(" low "), "low");
  assert.equal(torquetumAltitude("brass"), "");
  assert.equal(torquetumDegree("15"), 15);
  assert.equal(torquetumDegree(30), 30);
  assert.equal(torquetumDegree("45"), 45);
  assert.equal(torquetumDegree("20"), null);
  assert.equal(torquetumTooth("1"), 1);
  assert.equal(torquetumTooth(3), 3);
  assert.equal(torquetumTooth("5"), 5);
  assert.equal(torquetumTooth("2"), null);
  assert.equal(torquetumAir("still"), "STILL");
  assert.equal(torquetumAir("haze"), "HAZE");
  assert.equal(torquetumAir("squall"), "SQUALL");
  assert.equal(torquetumAir("hot"), "");
  assert.equal(innerAltitude("low"), true);
  assert.equal(innerAltitude("MID"), true);
  assert.equal(innerAltitude("high"), false);
  assert.equal(outerAltitude("zenith"), true);
  assert.equal(outerAltitude("high"), true);
  assert.equal(outerAltitude("low"), false);
  assert.equal(torquetumBand("low"), "floor");
  assert.equal(torquetumBand("mid"), "rail");
  assert.equal(torquetumBand("high"), "arch");
  assert.equal(torquetumBand("zenith"), "crown");
  assert.equal(torquetumBand(""), "");
  assert.equal(altitudeGap("low", "zenith"), 3);
  assert.equal(altitudeGap("high", "nope"), null);
  assert.equal(houseAir("haze"), true);
  assert.equal(houseAir("still"), false);
  assert.equal(pairTooth(3), true);
  assert.equal(pairTooth(1), false);
  assert.equal(fullTooth("5"), true);
  assert.equal(fullTooth(3), false);
  assert.equal(activeAltitude("inner"), "inner");
  assert.equal(activeAltitude("zenith"), "zenith");
  assert.equal(activeAltitude("gold"), "all");
  assert.equal(activeDegree("45"), "45");
  assert.equal(activeDegree("20"), "all");
  assert.equal(activeTooth("1"), "1");
  assert.equal(activeTooth("2"), "all");
  assert.equal(activeAir("squall", ["SQUALL"]), "SQUALL");
  assert.equal(activeAir("hot", ["SQUALL"]), "all");
  assert.equal(moveTorquetumFocus(0, 3, -1), 2);
  assert.equal(moveTorquetumFocus(0, 0, 1), 0);

  const cards = [
    arc({ id: "a", title: "Ada", altitude: "zenith", tooth: 1, scribe: "Ned" }),
    arc({ id: "b", title: "Bea", altitude: "low", air: "SQUALL", degree: 45, tooth: 5, scribe: "Ned" }),
    arc({ id: "c", title: "Cara", altitude: "high", air: "STILL", degree: 30, scribe: "Ida" }),
  ];
  assert.equal(overdueTorquetum(cards[0]), true);
  assert.equal(briskTorquetum(cards[1]), true);
  assert.equal(restingTorquetum(arc({ id: "r", title: "Rest", altitude: "zenith", air: "STILL", degree: 30 })), true);
  assert.equal(idleTorquetum(arc({ id: "i", title: "Idle", degree: 15, tooth: 1 })), true);
  assert.equal(lateTorquetum(cards[1], "zenith"), true);
  assert.equal(lateTorquetum(cards[1], "low"), false);
  assert.equal(suggestTorquetumAir(cards), "STILL");
  assert.equal(suggestTorquetumAir([...cards, arc({ id: "d", title: "Dora", air: "SQUALL" })]), "SQUALL");
  assert.equal(suggestDegree([], 8), 15);
  assert.equal(suggestDegree([], 12), 30);
  assert.equal(suggestDegree([], 20), 45);
  assert.equal(suggestDegree(cards, 8), 30);
  assert.equal(suggestDegree([...cards, arc({ id: "e", title: "Eve", degree: 45 })], 8), 45);
  assert.equal(suggestAltitude(10), "low");
  assert.equal(suggestAltitude(15), "zenith");
  assert.equal(fairArcScribe(cards, "Ned,Ida"), "Ida");
  const added = addTorquetum(cards, { title: "Dora", altitude: "mid", degree: "30", tooth: "3", tags: "a b c" });
  assert.equal(added.length, 4);
  assert.equal(added[3].audit, "save");
  assert.deepEqual(added[3].tags, ["a", "b"]);
  assert.equal(addTorquetum(cards, { title: "Ada" }).length, 3);
  const lifted = liftDegree(cards, "a");
  assert.equal(lifted[0].degree, 15);
  assert.equal(lowerDegree(lifted, "a")[0].degree, 45);
  assert.equal(dropTorquetumView([{ id: "v", name: "Desk", tray: "arc", query: "", scribe: "", air: "all", altitude: "all", degree: "all", tooth: "all" }], "v").length, 0);
  assert.equal(readTorquetumViews([{ id: "", name: "x" }]).length, 0);

  assert.equal(latchLane("2026-11-13T11:00:00.000Z", NOW), "spark");
  assert.equal(latchSoon("2026-11-13T11:00:00.000Z", NOW), true);
  assert.equal(latchSoon("2026-11-13T10:00:00.000Z", NOW), false);
  assert.equal(latchLane("2026-11-13T08:00:00.000Z", NOW), "day");
  assert.equal(latchLane("2026-11-01T12:00:00.000Z", NOW), "fortnight");
  assert.equal(latchLane("2026-10-01T12:00:00.000Z", NOW), "season");
  assert.equal(latchLane("2026-06-01T12:00:00.000Z", NOW), "dust");
  assert.equal(latchLane("2026-11-14T12:00:00.000Z", NOW), "ahead");
  assert.equal(latchLane("2020-01-01T12:00:00.000Z", NOW), "");
  assert.equal(latchState("", NOW), "clear");
  assert.equal(latchOpen(""), true);
  assert.equal(latchState({ loginBlockedAt: "2026-11-13T11:00:00.000Z" }, NOW), "set");
  assert.equal(latchState({ city: "x" }, NOW), "");
  assert.equal(latchState({ loginBlockedAt: "2026-11-13T11:00:00.000Z", amount: 3 }, NOW), "");
  assert.equal(latchHue("2026-11-13T11:00:00.000Z", NOW), "champagne");
  assert.equal(latchHue("2026-11-13T08:00:00.000Z", NOW), "ivory");
  assert.equal(latchHue("2026-10-01T12:00:00.000Z", NOW), "graphite");
  assert.equal(latchHue("2026-11-14T12:00:00.000Z", NOW), "champagne");
  assert.equal(latchHue("2026-06-01T12:00:00.000Z", NOW), "graphite");
  assert.equal(latchSpark("2026-11-13T11:00:00.000Z", NOW), true);
  assert.equal(latchDust("2026-06-01T12:00:00.000Z", NOW), true);
  assert.equal(latchAhead("2026-11-14T12:00:00.000Z", NOW), true);
  assert.equal(latchHeld("2026-11-01T12:00:00.000Z", NOW), true);
  assert.equal(latchHeld("2026-06-01T12:00:00.000Z", NOW), false);
  assert.equal(latchMinutes("2026-11-13T11:00:00.000Z", NOW), 60);
  assert.equal(latchToday("2026-11-13T11:00:00.000Z", NOW), true);
  assert.equal(latchToday("2026-11-12T12:00:00.000Z", NOW), false);
  assert.equal(latchWeekday("2026-11-13T11:00:00.000Z", NOW), true);
  assert.equal(latchWeekend("2026-11-14T12:00:00.000Z", NOW), true);
  assert.equal(latchWeekend("2026-11-13T11:00:00.000Z", NOW), false);
  assert.equal(latchMorning("2026-11-13T08:00:00.000Z", NOW), true);
  assert.equal(latchMorning("2026-11-13T18:00:00.000Z", NOW), false);
  assert.equal(latchEvening("2026-11-13T19:00:00.000Z", NOW), true);
  assert.equal(latchEvening("2026-11-13T08:00:00.000Z", NOW), false);
  assert.equal(latchEven("2026-11-12T12:00:00.000Z", NOW), true);
  assert.equal(latchEven("2026-11-13T11:00:00.000Z", NOW), false);
  assert.equal(latchFirst("2026-11-01T12:00:00.000Z", NOW), true);
  assert.equal(latchStep("2026-11-13T11:00:00.000Z", NOW), 11);
  assert.equal(latchStep("", NOW), 0);
  assert.equal(latchLeap("2024-11-13T12:00:00.000Z", NOW), true);
  assert.equal(latchLeap("2026-11-13T11:00:00.000Z", NOW), false);
  assert.equal(latchTwin("2026-11-06T12:00:00.000Z", NOW), true);
  assert.equal(latchTwin("2026-11-12T12:00:00.000Z", NOW), false);
  assert.equal(latchTail("2026-11-13T11:00:00.000Z"), true);
  assert.equal(latchTail("2026-11-13T11:00:00"), false);
  assert.equal(latchMark("2026-11-13T11:00:00.000Z"), true);
  assert.equal(latchSpace("2026-11-13 11:00:00Z"), true);
  const rows: LatchRow[] = [
    { id: "1", label: "Ada", blocked: "2026-11-13T11:00:00.000Z" },
    { id: "2", label: "Bea", blocked: "2026-06-01T12:00:00.000Z" },
  ];
  assert.equal(leadingLatch(rows, NOW), "spark");
  assert.match(latchLanesCsv(rows, NOW), /spark,1/);
  assert.match(latchLanesCsv(rows, NOW), /dust,1/);
  assert.match(latchRowsCsv(rows, ["1"], NOW), /Ada,2026-11-13T11:00:00.000Z/);

  const locales = ["en", "tr", "de", "ru", "ar"] as const;
  const keys = Object.keys(ROUND294_COPY.en).sort();
  for (const locale of locales) assert.deepEqual(Object.keys(ROUND294_COPY[locale]).sort(), keys);
  assert.equal(crmv4Text("tr", "trqTitle"), ROUND294_COPY.tr.trqTitle);
  assert.equal(crmv4Text("de", "lbpTitle"), ROUND294_COPY.de.lbpTitle);
  assert.equal(crmv4Text("ru", "trqSub"), ROUND294_COPY.ru.trqSub);
  assert.equal(crmv4Text("ar", "lbpSub"), ROUND294_COPY.ar.lbpSub);
  assert.equal(crmv4Text("en", "trqLogo"), "7FX");
  assert.equal(crmv4Text("en", "lbpLogo"), "7FX");
  assert.equal(crmv4Text("en", "trqTitle"), "Torquetum arcs");
  assert.equal(crmv4Text("en", "lbpTitle"), "Latch plates");
  assert.equal(crmv4Text("en", "bnCourtKicker"), "Graphite banner court");
  assert.equal(crmv4Text("en", "dgCabinetKicker"), "Ivory type cabinet");
  assert.notEqual(ROUND294_COPY.tr.trqTitle, ROUND294_COPY.en.trqTitle);
  assert.notEqual(ROUND294_COPY.ar.lbpTitle, ROUND294_COPY.en.lbpTitle);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-torquetum/);
  assert.match(css, /\.c4-latch-index/);
  assert.match(css, /\.c4-torquetum-column/);
  assert.match(css, /\.c4-latch-column/);
  assert.match(css, /\.c4-banner-court/);
  assert.match(css, /\.c4-type-cabinet-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round294.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /loginBlockedAt:/);
  assert.match(viewFile, /torquetumCsv/);
  assert.match(viewFile, /latchRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0&role=TRADER/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestTorquetumAir/);
  assert.match(viewFile, /c4-latch-search/);
  assert.match(viewFile, /torquetumTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "trq"/);
  assert.match(app, /view === "lbp"/);
  const court = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round87.tsx"), "utf8");
  assert.match(court, /c4-banner-court/);
  assert.match(court, /c4-banner-court-mast/);
  assert.match(court, /data-logo="mono"/);
  assert.match(court, /bnCourtKicker/);
  assert.match(court, /bnCourtLead/);
  assert.match(court, /data-status-banner/);
  assert.equal(court.includes("amount"), false);
  assert.match(court, /c4-type-cabinet/);
  assert.match(court, /c4-type-cabinet-mast/);
  assert.match(court, /dgCabinetKicker/);
  assert.match(court, /dgCabinetLead/);
  assert.match(court, /data-type-glance/);
  const named = `${viewFile}\n${court}`.match(/"(trq|lbp|bnCourt|dgCabinet)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of named) assert.equal(typeof ROUND294_COPY.en[key as keyof typeof ROUND294_COPY.en], "string", key);
  console.log("crmv4 round294 tests passed");
}

main();
