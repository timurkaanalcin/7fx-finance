/**
 * Orrery orbs, ward plates, the ivory tally court, and the champagne proof loft.
 * Run: TZ=UTC npx tsx tests/crmv4-round291.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND291_COPY } from "../src/lib/crmv4/copy-round291";
import {
  ROUND291_FEATURES,
  activeClimate,
  activeMoon,
  activeRadius,
  activeWorld,
  addOrrery,
  briskOrrery,
  dropOrreryView,
  fairOrbKeeper,
  fullMoon,
  houseClimate,
  idleOrrery,
  innerWorld,
  lateOrrery,
  leadingWard,
  liftRadius,
  lowerRadius,
  moveOrreryFocus,
  orreryBand,
  orreryClimate,
  orreryMoon,
  orreryRadius,
  orreryWorld,
  outerWorld,
  overdueOrrery,
  pairMoon,
  readOrreryViews,
  restingOrrery,
  suggestOrreryClimate,
  suggestRadius,
  suggestWorld,
  wardEven,
  wardFirst,
  wardHeld,
  wardHour,
  wardHue,
  wardLane,
  wardLanesCsv,
  wardLeap,
  wardMark,
  wardMinutes,
  wardMorning,
  wardOpen,
  wardRowsCsv,
  wardSoon,
  wardSpace,
  wardSpent,
  wardState,
  wardStep,
  wardTail,
  wardToday,
  wardTwin,
  wardWeekday,
  wardWeekend,
  worldGap,
  type Orrery,
  type WardRow,
} from "../src/lib/crmv4/round291";

const NOW = Date.parse("2026-11-13T12:00:00.000Z");

function orb(partial: Partial<Orrery> & { id: string; title: string }): Orrery {
  return {
    note: "",
    keeper: "",
    world: "",
    radius: null,
    climate: "",
    moon: 0,
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
  assert.equal(ROUND291_FEATURES.length, 25);
  assert.equal(ROUND291_FEATURES.includes("ward"), true);
  assert.equal(ROUND291_FEATURES.includes("radius"), true);
  assert.equal(ROUND291_FEATURES.includes("fair-keeper"), true);
  assert.equal(orreryWorld(" mercury "), "mercury");
  assert.equal(orreryWorld("brass"), "");
  assert.equal(orreryRadius("2"), 2);
  assert.equal(orreryRadius(4), 4);
  assert.equal(orreryRadius("8"), 8);
  assert.equal(orreryRadius("6"), null);
  assert.equal(orreryRadius("15"), null);
  assert.equal(orreryMoon("0"), 0);
  assert.equal(orreryMoon(2), 2);
  assert.equal(orreryMoon("4"), 4);
  assert.equal(orreryMoon("1"), null);
  assert.equal(orreryMoon("3"), null);
  assert.equal(orreryClimate("frost"), "FROST");
  assert.equal(orreryClimate("mild"), "MILD");
  assert.equal(orreryClimate("blaze"), "BLAZE");
  assert.equal(orreryClimate("hot"), "");
  assert.equal(innerWorld("mercury"), true);
  assert.equal(innerWorld("VENUS"), true);
  assert.equal(innerWorld("mars"), false);
  assert.equal(outerWorld("saturn"), true);
  assert.equal(outerWorld("mars"), true);
  assert.equal(outerWorld("mercury"), false);
  assert.equal(orreryBand("mercury"), "inner");
  assert.equal(orreryBand("venus"), "warm");
  assert.equal(orreryBand("mars"), "red");
  assert.equal(orreryBand("saturn"), "ring");
  assert.equal(orreryBand(""), "");
  assert.equal(worldGap("mercury", "saturn"), 3);
  assert.equal(worldGap("mars", "nope"), null);
  assert.equal(houseClimate("mild"), true);
  assert.equal(houseClimate("frost"), false);
  assert.equal(pairMoon(2), true);
  assert.equal(pairMoon(0), false);
  assert.equal(fullMoon("4"), true);
  assert.equal(fullMoon(2), false);
  assert.equal(activeWorld("inner"), "inner");
  assert.equal(activeWorld("saturn"), "saturn");
  assert.equal(activeWorld("gold"), "all");
  assert.equal(activeRadius("8"), "8");
  assert.equal(activeRadius("3"), "all");
  assert.equal(activeMoon("0"), "0");
  assert.equal(activeMoon("1"), "all");
  assert.equal(activeClimate("blaze", ["BLAZE"]), "BLAZE");
  assert.equal(activeClimate("hot", ["BLAZE"]), "all");
  assert.equal(moveOrreryFocus(0, 3, -1), 2);
  assert.equal(moveOrreryFocus(0, 0, 1), 0);

  const cards = [
    orb({ id: "a", title: "Ada", world: "mars", moon: 0, keeper: "Ned" }),
    orb({ id: "b", title: "Bea", world: "mercury", climate: "BLAZE", radius: 8, moon: 4, keeper: "Ned" }),
    orb({ id: "c", title: "Cara", world: "saturn", climate: "FROST", radius: 4, keeper: "Ida" }),
  ];
  assert.equal(overdueOrrery(cards[0]), true);
  assert.equal(briskOrrery(cards[1]), true);
  assert.equal(restingOrrery(cards[2]), true);
  assert.equal(idleOrrery(orb({ id: "i", title: "Idle", radius: 2 })), true);
  assert.equal(lateOrrery(cards[1], "saturn"), true);
  assert.equal(lateOrrery(cards[1], "mercury"), false);
  assert.equal(suggestOrreryClimate(cards), "FROST");
  assert.equal(suggestOrreryClimate([...cards, orb({ id: "d", title: "Dora", climate: "BLAZE" })]), "BLAZE");
  assert.equal(suggestRadius([], 7), 2);
  assert.equal(suggestRadius([], 12), 4);
  assert.equal(suggestRadius([], 20), 8);
  assert.equal(suggestRadius(cards, 7), 4);
  assert.equal(suggestRadius([...cards, orb({ id: "e", title: "Eve", radius: 8 })], 7), 8);
  assert.equal(suggestWorld(9), "mercury");
  assert.equal(suggestWorld(15), "saturn");
  assert.equal(fairOrbKeeper(cards, "Ned,Ida"), "Ida");
  const added = addOrrery(cards, { title: "Dora", world: "venus", radius: "4", moon: "2", tags: "x y z" });
  assert.equal(added.length, 4);
  assert.equal(added[3].audit, "save");
  assert.deepEqual(added[3].tags, ["x", "y"]);
  assert.equal(addOrrery(cards, { title: "Ada" }).length, 3);
  const lifted = liftRadius(cards, "a");
  assert.equal(lifted[0].radius, 2);
  assert.equal(lowerRadius(lifted, "a")[0].radius, 8);
  assert.equal(dropOrreryView([{ id: "v", name: "Desk", tray: "arm", query: "", keeper: "", climate: "all", world: "all", radius: "all", moon: "all" }], "v").length, 0);
  assert.equal(readOrreryViews([{ id: "", name: "x" }]).length, 0);

  assert.equal(wardLane("2026-11-13T12:20:00.000Z", NOW), "hour");
  assert.equal(wardSoon("2026-11-13T12:10:00.000Z", NOW), true);
  assert.equal(wardSoon("2026-11-13T13:00:00.000Z", NOW), false);
  assert.equal(wardLane("2026-11-13T18:00:00.000Z", NOW), "day");
  assert.equal(wardLane("2026-11-16T12:00:00.000Z", NOW), "week");
  assert.equal(wardLane("2026-12-01T12:00:00.000Z", NOW), "far");
  assert.equal(wardLane("2026-11-13T10:00:00.000Z", NOW), "spent");
  assert.equal(wardLane("2031-11-13T12:00:00.000Z", NOW), "");
  assert.equal(wardState("", NOW), "clear");
  assert.equal(wardOpen(""), true);
  assert.equal(wardState({ lockedUntil: "2026-11-13T12:20:00.000Z" }, NOW), "set");
  assert.equal(wardState({ city: "x" }, NOW), "");
  assert.equal(wardState({ lockedUntil: "2026-11-13T12:20:00.000Z", amount: 3 }, NOW), "");
  assert.equal(wardHue("2026-11-13T12:20:00.000Z", NOW), "champagne");
  assert.equal(wardHue("2026-11-13T18:00:00.000Z", NOW), "ivory");
  assert.equal(wardHue("2026-11-16T12:00:00.000Z", NOW), "graphite");
  assert.equal(wardHue("2026-12-01T12:00:00.000Z", NOW), "champagne");
  assert.equal(wardHue("2026-11-13T10:00:00.000Z", NOW), "graphite");
  assert.equal(wardHour("2026-11-13T12:20:00.000Z", NOW), true);
  assert.equal(wardSpent("2026-11-13T10:00:00.000Z", NOW), true);
  assert.equal(wardHeld("2026-12-01T12:00:00.000Z", NOW), true);
  assert.equal(wardHeld("2026-11-13T10:00:00.000Z", NOW), false);
  assert.equal(wardMinutes("2026-11-13T12:20:00.000Z", NOW), 20);
  assert.equal(wardToday("2026-11-13T18:00:00.000Z", NOW), true);
  assert.equal(wardToday("2026-11-14T12:00:00.000Z", NOW), false);
  assert.equal(wardWeekday("2026-11-13T18:00:00.000Z", NOW), true);
  assert.equal(wardWeekend("2026-11-14T12:00:00.000Z", NOW), true);
  assert.equal(wardWeekend("2026-11-13T18:00:00.000Z", NOW), false);
  assert.equal(wardMorning("2026-11-13T08:00:00.000Z", NOW), true);
  assert.equal(wardMorning("2026-11-13T18:00:00.000Z", NOW), false);
  assert.equal(wardEven("2026-11-12T12:00:00.000Z", NOW), true);
  assert.equal(wardEven("2026-11-13T18:00:00.000Z", NOW), false);
  assert.equal(wardFirst("2026-11-01T12:00:00.000Z", NOW), true);
  assert.equal(wardStep("2026-11-13T18:00:00.000Z", NOW), 11);
  assert.equal(wardStep("", NOW), 0);
  assert.equal(wardLeap("2024-11-13T12:00:00.000Z", NOW), true);
  assert.equal(wardLeap("2026-11-13T18:00:00.000Z", NOW), false);
  assert.equal(wardTwin("2026-11-06T12:00:00.000Z", NOW), true);
  assert.equal(wardTwin("2026-11-12T12:00:00.000Z", NOW), false);
  assert.equal(wardTail("2026-11-13T12:20:00.000Z"), true);
  assert.equal(wardTail("2026-11-13T12:20:00"), false);
  assert.equal(wardMark("2026-11-13T12:20:00.000Z"), true);
  assert.equal(wardSpace("2026-11-13 12:20:00Z"), true);
  const rows: WardRow[] = [
    { id: "1", label: "Ada", until: "2026-11-13T12:20:00.000Z" },
    { id: "2", label: "Bea", until: "2026-11-16T12:00:00.000Z" },
  ];
  assert.equal(leadingWard(rows, NOW), "hour");
  assert.match(wardLanesCsv(rows, NOW), /hour,1/);
  assert.match(wardLanesCsv(rows, NOW), /week,1/);
  assert.match(wardRowsCsv(rows, ["1"], NOW), /Ada,2026-11-13T12:20:00.000Z/);

  const locales = ["en", "tr", "de", "ru", "ar"] as const;
  const keys = Object.keys(ROUND291_COPY.en).sort();
  for (const locale of locales) assert.deepEqual(Object.keys(ROUND291_COPY[locale]).sort(), keys);
  assert.equal(crmv4Text("tr", "oryTitle"), ROUND291_COPY.tr.oryTitle);
  assert.equal(crmv4Text("de", "wrdTitle"), ROUND291_COPY.de.wrdTitle);
  assert.equal(crmv4Text("ru", "orySub"), ROUND291_COPY.ru.orySub);
  assert.equal(crmv4Text("ar", "wrdSub"), ROUND291_COPY.ar.wrdSub);
  assert.equal(crmv4Text("en", "oryLogo"), "7FX");
  assert.equal(crmv4Text("en", "wrdLogo"), "7FX");
  assert.equal(crmv4Text("en", "oryTitle"), "Orrery orbs");
  assert.equal(crmv4Text("en", "wrdTitle"), "Ward plates");
  assert.equal(crmv4Text("en", "gcCourtKicker"), "Ivory tally court");
  assert.equal(crmv4Text("en", "xpLoftKicker"), "Champagne proof loft");
  assert.notEqual(ROUND291_COPY.tr.oryTitle, ROUND291_COPY.en.oryTitle);
  assert.notEqual(ROUND291_COPY.ar.wrdTitle, ROUND291_COPY.en.wrdTitle);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-orrery/);
  assert.match(css, /\.c4-ward-index/);
  assert.match(css, /\.c4-orrery-column/);
  assert.match(css, /\.c4-ward-column/);
  assert.match(css, /\.c4-tally-court/);
  assert.match(css, /\.c4-proof-loft-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round291.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /lockedUntil:/);
  assert.match(viewFile, /orreryCsv/);
  assert.match(viewFile, /wardRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0&role=TRADER/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestOrreryClimate/);
  assert.match(viewFile, /c4-ward-search/);
  assert.match(viewFile, /orreryTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "ory"/);
  assert.match(app, /view === "wrd"/);
  const tally = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round75.tsx"), "utf8");
  const loft = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round76.tsx"), "utf8");
  assert.match(tally, /c4-tally-court/);
  assert.match(tally, /c4-tally-court-mast/);
  assert.match(tally, /data-logo="mono"/);
  assert.match(tally, /gcCourtKicker/);
  assert.match(tally, /gcCourtLead/);
  assert.match(tally, /data-glance-strip/);
  assert.match(loft, /c4-proof-loft/);
  assert.match(loft, /c4-proof-loft-mast/);
  assert.match(loft, /xpLoftKicker/);
  assert.match(loft, /xpLoftLead/);
  assert.match(loft, /data-docpulse/);
  const named = viewFile.match(/"(ory|wrd|gcCourt|xpLoft)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of named) assert.equal(typeof ROUND291_COPY.en[key as keyof typeof ROUND291_COPY.en], "string", key);
  console.log("crmv4 round291 tests passed");
}

main();
