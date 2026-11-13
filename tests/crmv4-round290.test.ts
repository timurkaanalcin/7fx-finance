/**
 * Equatorium rings, register plates, the ivory snooze court, and the graphite queue hall.
 * Run: TZ=UTC npx tsx tests/crmv4-round290.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND290_COPY } from "../src/lib/crmv4/copy-round290";
import {
  ROUND290_FEATURES,
  activeArc,
  activeMetal,
  activeTemper,
  activeTooth,
  addEquatorium,
  briskEquatorium,
  dropEquatoriumView,
  equatoriumArc,
  equatoriumBand,
  equatoriumMetal,
  equatoriumTemper,
  equatoriumTooth,
  fairKeeper,
  firmMetal,
  fullTooth,
  houseTemper,
  idleEquatorium,
  lateEquatorium,
  leadingRegister,
  liftArc,
  lowerArc,
  metalGap,
  moveEquatoriumFocus,
  overdueEquatorium,
  pairTooth,
  readEquatoriumViews,
  registerAnniversary,
  registerArchive,
  registerDawn,
  registerDays,
  registerEven,
  registerFirst,
  registerFuture,
  registerHue,
  registerLane,
  registerLanesCsv,
  registerLeap,
  registerMark,
  registerMorning,
  registerQuiet,
  registerRowsCsv,
  registerSpace,
  registerState,
  registerStep,
  registerTail,
  registerToday,
  registerTwin,
  registerWeekday,
  registerWeekend,
  registerWelcome,
  restingEquatorium,
  softMetal,
  suggestArc,
  suggestEquatoriumTemper,
  suggestMetal,
  type Equatorium,
  type RegisterRow,
} from "../src/lib/crmv4/round290";

const NOW = Date.parse("2026-11-13T12:00:00.000Z");

function ring(partial: Partial<Equatorium> & { id: string; title: string }): Equatorium {
  return {
    note: "",
    keeper: "",
    metal: "",
    arc: null,
    temper: "",
    tooth: 1,
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
  assert.equal(ROUND290_FEATURES.length, 25);
  assert.equal(ROUND290_FEATURES.includes("register"), true);
  assert.equal(ROUND290_FEATURES.includes("arc"), true);
  assert.equal(ROUND290_FEATURES.includes("fair-keeper"), true);
  assert.equal(equatoriumMetal(" brass "), "brass");
  assert.equal(equatoriumMetal("paris"), "");
  assert.equal(equatoriumArc("15"), 15);
  assert.equal(equatoriumArc(30), 30);
  assert.equal(equatoriumArc("45"), 45);
  assert.equal(equatoriumArc("9"), null);
  assert.equal(equatoriumArc("20"), null);
  assert.equal(equatoriumTooth("1"), 1);
  assert.equal(equatoriumTooth(3), 3);
  assert.equal(equatoriumTooth("5"), 5);
  assert.equal(equatoriumTooth("2"), null);
  assert.equal(equatoriumTooth("4"), null);
  assert.equal(equatoriumTemper("cool"), "COOL");
  assert.equal(equatoriumTemper("warm"), "WARM");
  assert.equal(equatoriumTemper("hot"), "HOT");
  assert.equal(equatoriumTemper("gold"), "");
  assert.equal(firmMetal("brass"), true);
  assert.equal(firmMetal("IVORY"), true);
  assert.equal(firmMetal("steel"), false);
  assert.equal(softMetal("ebony"), true);
  assert.equal(softMetal("steel"), true);
  assert.equal(softMetal("brass"), false);
  assert.equal(equatoriumBand("brass"), "dawn");
  assert.equal(equatoriumBand("ivory"), "noon");
  assert.equal(equatoriumBand("steel"), "dusk");
  assert.equal(equatoriumBand("ebony"), "night");
  assert.equal(equatoriumBand(""), "");
  assert.equal(metalGap("brass", "ivory"), 1);
  assert.equal(metalGap("ivory", "brass"), -1);
  assert.equal(metalGap("", "brass"), null);
  assert.equal(houseTemper("warm"), true);
  assert.equal(houseTemper("HOT"), true);
  assert.equal(houseTemper("cool"), false);
  assert.equal(pairTooth(3), true);
  assert.equal(pairTooth("3"), true);
  assert.equal(pairTooth(1), false);
  assert.equal(fullTooth(5), true);
  assert.equal(fullTooth(3), false);
  assert.equal(activeMetal("firm"), "firm");
  assert.equal(activeMetal("brass"), "brass");
  assert.equal(activeMetal("paris"), "all");
  assert.equal(activeArc("30"), "30");
  assert.equal(activeArc("9"), "all");
  assert.equal(activeTemper("hot", ["COOL", "WARM", "HOT"]), "HOT");
  assert.equal(activeTemper("mist", ["COOL", "WARM", "HOT"]), "all");
  assert.equal(activeTooth("3"), "3");
  assert.equal(activeTooth("2"), "all");
  assert.equal(moveEquatoriumFocus(0, 4, 1), 1);
  assert.equal(moveEquatoriumFocus(0, 4, -1), 3);
  assert.equal(suggestEquatoriumTemper([]), "COOL");
  assert.equal(suggestArc([], 5), 15);
  assert.equal(suggestArc([], 10), 30);
  assert.equal(suggestArc([], 20), 45);
  assert.equal(suggestMetal(8), "brass");
  assert.equal(suggestMetal(14), "ebony");
  assert.equal(fairKeeper([ring({ id: "1", title: "Brass", keeper: "Ada" })], "Ada,Bea"), "Bea");

  const saved = addEquatorium([], { id: "1", title: "Ebony", metal: "ebony", arc: 15, temper: "warm", tooth: 1, keeper: "Ada" });
  assert.equal(saved[0].audit, "save");
  assert.equal(overdueEquatorium(saved[0]), true);
  assert.equal(briskEquatorium(saved[0]), false);
  assert.equal(liftArc(saved, "1")[0].arc, 30);
  assert.equal(lowerArc([{ ...saved[0], arc: null }], "1")[0].arc, 45);
  const quiet = ring({ id: "2", title: "Calm", metal: "ebony", temper: "", arc: 15, tooth: 1 });
  assert.equal(idleEquatorium(quiet), true);
  assert.equal(lateEquatorium(ring({ id: "4", title: "Late", metal: "brass", tooth: 1 }), "ebony"), true);
  const rest = ring({ id: "3", title: "Rest", metal: "ebony", temper: "COOL", arc: 30, tooth: 3 });
  assert.equal(restingEquatorium(rest), true);
  assert.equal(briskEquatorium(ring({ id: "5", title: "Keen", metal: "brass", temper: "HOT", arc: 45, tooth: 5 })), true);
  const views = readEquatoriumViews([{ id: "v1", name: "Dawn", tray: "case", metal: "firm", arc: "30", tooth: "3", temper: "warm" }]);
  assert.equal(views[0].tray, "case");
  assert.equal(views[0].metal, "firm");
  assert.equal(views[0].temper, "WARM");
  assert.equal(dropEquatoriumView(views, "v1").length, 0);

  assert.equal(registerLane("2026-11-13T11:00:00.000Z", NOW), "dawn");
  assert.equal(registerDawn("2026-11-13T11:00:00.000Z", NOW), true);
  assert.equal(registerWelcome("2026-11-13T11:00:00.000Z", NOW), true);
  assert.equal(registerLane("2026-11-06T12:00:00.000Z", NOW), "week");
  assert.equal(registerLane("2026-10-20T12:00:00.000Z", NOW), "moon");
  assert.equal(registerLane("2026-01-13T12:00:00.000Z", NOW), "year");
  assert.equal(registerLane("2024-11-13T12:00:00.000Z", NOW), "archive");
  assert.equal(registerArchive("2024-11-13T12:00:00.000Z", NOW), true);
  assert.equal(registerLane("", NOW), "");
  assert.equal(registerQuiet(""), true);
  assert.equal(registerQuiet({ registrationDate: "2026-11-13T11:00:00.000Z" }), false);
  assert.equal(registerHue("2026-11-13T11:00:00.000Z", NOW), "champagne");
  assert.equal(registerHue("2024-11-13T12:00:00.000Z", NOW), "graphite");
  assert.equal(registerHue("2026-11-06T12:00:00.000Z", NOW), "ivory");
  assert.equal(registerToday("2026-11-13T11:00:00.000Z", NOW), true);
  assert.equal(registerToday("2026-11-12T11:00:00.000Z", NOW), false);
  assert.equal(registerWeekday("2026-11-13T11:00:00.000Z", NOW), true);
  assert.equal(registerWeekend("2026-11-08T12:00:00.000Z", NOW), true);
  assert.equal(registerWeekend("2026-11-13T11:00:00.000Z", NOW), false);
  assert.equal(registerMorning("2026-11-13T11:00:00.000Z", NOW), true);
  assert.equal(registerMorning("2026-11-13T12:00:00.000Z", NOW), false);
  assert.equal(registerEven("2026-11-12T11:00:00.000Z", NOW), true);
  assert.equal(registerEven("2026-11-13T11:00:00.000Z", NOW), false);
  assert.equal(registerFirst("2026-11-01T12:00:00.000Z", NOW), true);
  assert.equal(registerStep("2026-11-13T11:00:00.000Z", NOW), 11);
  assert.equal(registerStep("", NOW), 0);
  assert.equal(registerDays("2026-11-06T12:00:00.000Z", NOW), 7);
  assert.equal(registerLeap("2024-11-13T12:00:00.000Z", NOW), true);
  assert.equal(registerLeap("2026-11-13T11:00:00.000Z", NOW), false);
  assert.equal(registerAnniversary("2024-11-13T12:00:00.000Z", NOW), true);
  assert.equal(registerAnniversary("2026-11-13T11:00:00.000Z", NOW), false);
  assert.equal(registerFuture("2026-11-13T18:00:00.000Z", NOW), true);
  assert.equal(registerFuture("2026-11-15T12:00:00.000Z", NOW), false);
  assert.equal(registerQuiet("2026-11-15T12:00:00.000Z"), true);
  assert.equal(registerTwin("2026-11-06T12:00:00.000Z", NOW), true);
  assert.equal(registerTwin("2026-11-12T12:00:00.000Z", NOW), false);
  assert.equal(registerTail("2026-11-13T11:00:00.000Z"), true);
  assert.equal(registerTail("2026-11-13T11:00:00"), false);
  assert.equal(registerMark("2026-11-13T11:00:00.000Z"), true);
  assert.equal(registerSpace("2026-11-13 11:00:00Z"), true);
  assert.equal(registerState({ registrationDate: "2026-11-13T11:00:00.000Z", amount: 3 }, NOW), "");
  assert.equal(registerState("", NOW), "clear");
  assert.equal(registerState({ city: "x" }, NOW), "");
  const rows: RegisterRow[] = [
    { id: "1", label: "Ada", opened: "2026-11-13T11:00:00.000Z" },
    { id: "2", label: "Bea", opened: "2026-11-06T12:00:00.000Z" },
  ];
  assert.equal(leadingRegister(rows, NOW), "dawn");
  assert.match(registerLanesCsv(rows, NOW), /dawn,1/);
  assert.match(registerLanesCsv(rows, NOW), /week,1/);
  assert.match(registerRowsCsv(rows, ["1"], NOW), /Ada,2026-11-13T11:00:00.000Z/);

  const locales = ["en", "tr", "de", "ru", "ar"] as const;
  const keys = Object.keys(ROUND290_COPY.en).sort();
  for (const locale of locales) assert.deepEqual(Object.keys(ROUND290_COPY[locale]).sort(), keys);
  assert.equal(crmv4Text("tr", "eqmTitle"), ROUND290_COPY.tr.eqmTitle);
  assert.equal(crmv4Text("de", "rgdTitle"), ROUND290_COPY.de.rgdTitle);
  assert.equal(crmv4Text("ru", "eqmSub"), ROUND290_COPY.ru.eqmSub);
  assert.equal(crmv4Text("ar", "rgdSub"), ROUND290_COPY.ar.rgdSub);
  assert.equal(crmv4Text("en", "eqmLogo"), "7FX");
  assert.equal(crmv4Text("en", "rgdLogo"), "7FX");
  assert.equal(crmv4Text("en", "eqmTitle"), "Equatorium rings");
  assert.equal(crmv4Text("en", "rgdTitle"), "Register plates");
  assert.equal(crmv4Text("en", "szCourtKicker"), "Ivory snooze court");
  assert.equal(crmv4Text("en", "qpHallKicker"), "Graphite queue hall");
  assert.notEqual(ROUND290_COPY.tr.eqmTitle, ROUND290_COPY.en.eqmTitle);
  assert.notEqual(ROUND290_COPY.ar.rgdTitle, ROUND290_COPY.en.rgdTitle);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-equatorium/);
  assert.match(css, /\.c4-register-index/);
  assert.match(css, /\.c4-equatorium-column/);
  assert.match(css, /\.c4-register-column/);
  assert.match(css, /\.c4-snooze-court/);
  assert.match(css, /\.c4-queue-hall-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round290.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /registrationDate:/);
  assert.match(viewFile, /equatoriumCsv/);
  assert.match(viewFile, /registerRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0&role=TRADER/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestEquatoriumTemper/);
  assert.match(viewFile, /c4-register-search/);
  assert.match(viewFile, /equatoriumTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "eqm"/);
  assert.match(app, /view === "rgd"/);
  const court = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round81.tsx"), "utf8");
  const hall = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round82.tsx"), "utf8");
  assert.match(court, /c4-snooze-court/);
  assert.match(court, /c4-snooze-court-mast/);
  assert.match(court, /data-logo="mono"/);
  assert.match(court, /szCourtKicker/);
  assert.match(court, /szCourtLead/);
  assert.match(court, /data-snooze-strip/);
  assert.match(hall, /c4-queue-hall/);
  assert.match(hall, /c4-queue-hall-mast/);
  assert.match(hall, /qpHallKicker/);
  assert.match(hall, /qpHallLead/);
  assert.match(hall, /data-queue-pulse/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND290_COPY.en, key);
  const named = viewFile.match(/"(eqm|rgd|szCourt|qpHall)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of named) assert.ok(key in ROUND290_COPY.en, key);
  const courtKeys = court.match(/"(szCourt)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  const hallKeys = hall.match(/"(qpHall)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of [...courtKeys, ...hallKeys]) assert.ok(key in ROUND290_COPY.en, key);
  console.log("crmv4 round290 tests passed");
}

main();
