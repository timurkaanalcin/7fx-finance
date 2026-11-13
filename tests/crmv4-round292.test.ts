/**
 * Clepsydra bowls, tide plates, the graphite pin atelier, and the champagne hour dial.
 * Run: TZ=UTC npx tsx tests/crmv4-round292.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND292_COPY } from "../src/lib/crmv4/copy-round292";
import {
  ROUND292_FEATURES,
  activeDrip,
  activeDrop,
  activeNotch,
  activeVessel,
  addClepsydra,
  briskClepsydra,
  clepsydraBand,
  clepsydraDrip,
  clepsydraDrop,
  clepsydraNotch,
  clepsydraVessel,
  dropClepsydraView,
  fairBowlKeeper,
  fullNotch,
  houseDrip,
  idleClepsydra,
  innerVessel,
  lateClepsydra,
  leadingTide,
  liftDrop,
  lowerDrop,
  moveClepsydraFocus,
  outerVessel,
  overdueClepsydra,
  pairNotch,
  readClepsydraViews,
  restingClepsydra,
  suggestClepsydraDrip,
  suggestDrop,
  suggestVessel,
  tideEbb,
  tideEven,
  tideFirst,
  tideHeld,
  tideHue,
  tideLane,
  tideLanesCsv,
  tideLeap,
  tideMark,
  tideMinutes,
  tideMorning,
  tideOpen,
  tideRowsCsv,
  tideSoon,
  tideSpace,
  tideSpent,
  tideState,
  tideStep,
  tideTail,
  tideToday,
  tideTwin,
  tideWeekday,
  tideWeekend,
  vesselGap,
  type Clepsydra,
  type TideRow,
} from "../src/lib/crmv4/round292";

const NOW = Date.parse("2026-11-13T12:00:00.000Z");

function bowl(partial: Partial<Clepsydra> & { id: string; title: string }): Clepsydra {
  return {
    note: "",
    keeper: "",
    vessel: "",
    drop: null,
    drip: "",
    notch: 1,
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
  assert.equal(ROUND292_FEATURES.length, 25);
  assert.equal(ROUND292_FEATURES.includes("tide"), true);
  assert.equal(ROUND292_FEATURES.includes("drop"), true);
  assert.equal(ROUND292_FEATURES.includes("fair-keeper"), true);
  assert.equal(clepsydraVessel(" clay "), "clay");
  assert.equal(clepsydraVessel("brass"), "");
  assert.equal(clepsydraDrop("3"), 3);
  assert.equal(clepsydraDrop(6), 6);
  assert.equal(clepsydraDrop("9"), 9);
  assert.equal(clepsydraDrop("4"), null);
  assert.equal(clepsydraDrop("15"), null);
  assert.equal(clepsydraNotch("1"), 1);
  assert.equal(clepsydraNotch(3), 3);
  assert.equal(clepsydraNotch("5"), 5);
  assert.equal(clepsydraNotch("0"), null);
  assert.equal(clepsydraNotch("2"), null);
  assert.equal(clepsydraDrip("trickle"), "TRICKLE");
  assert.equal(clepsydraDrip("steady"), "STEADY");
  assert.equal(clepsydraDrip("rush"), "RUSH");
  assert.equal(clepsydraDrip("hot"), "");
  assert.equal(innerVessel("clay"), true);
  assert.equal(innerVessel("GLASS"), true);
  assert.equal(innerVessel("bronze"), false);
  assert.equal(outerVessel("pearl"), true);
  assert.equal(outerVessel("bronze"), true);
  assert.equal(outerVessel("clay"), false);
  assert.equal(clepsydraBand("clay"), "earthen");
  assert.equal(clepsydraBand("glass"), "clear");
  assert.equal(clepsydraBand("bronze"), "cast");
  assert.equal(clepsydraBand("pearl"), "pale");
  assert.equal(clepsydraBand(""), "");
  assert.equal(vesselGap("clay", "pearl"), 3);
  assert.equal(vesselGap("bronze", "nope"), null);
  assert.equal(houseDrip("steady"), true);
  assert.equal(houseDrip("trickle"), false);
  assert.equal(pairNotch(3), true);
  assert.equal(pairNotch(1), false);
  assert.equal(fullNotch("5"), true);
  assert.equal(fullNotch(3), false);
  assert.equal(activeVessel("inner"), "inner");
  assert.equal(activeVessel("pearl"), "pearl");
  assert.equal(activeVessel("gold"), "all");
  assert.equal(activeDrop("9"), "9");
  assert.equal(activeDrop("4"), "all");
  assert.equal(activeNotch("1"), "1");
  assert.equal(activeNotch("2"), "all");
  assert.equal(activeDrip("rush", ["RUSH"]), "RUSH");
  assert.equal(activeDrip("hot", ["RUSH"]), "all");
  assert.equal(moveClepsydraFocus(0, 3, -1), 2);
  assert.equal(moveClepsydraFocus(0, 0, 1), 0);

  const cards = [
    bowl({ id: "a", title: "Ada", vessel: "bronze", notch: 1, keeper: "Ned" }),
    bowl({ id: "b", title: "Bea", vessel: "clay", drip: "RUSH", drop: 9, notch: 5, keeper: "Ned" }),
    bowl({ id: "c", title: "Cara", vessel: "pearl", drip: "TRICKLE", drop: 6, keeper: "Ida" }),
  ];
  assert.equal(overdueClepsydra(cards[0]), true);
  assert.equal(briskClepsydra(cards[1]), true);
  assert.equal(restingClepsydra(cards[2]), true);
  assert.equal(idleClepsydra(bowl({ id: "i", title: "Idle", drop: 3, notch: 1 })), true);
  assert.equal(lateClepsydra(cards[1], "pearl"), true);
  assert.equal(lateClepsydra(cards[1], "clay"), false);
  assert.equal(suggestClepsydraDrip(cards), "TRICKLE");
  assert.equal(suggestClepsydraDrip([...cards, bowl({ id: "d", title: "Dora", drip: "RUSH" })]), "RUSH");
  assert.equal(suggestDrop([], 7), 3);
  assert.equal(suggestDrop([], 12), 6);
  assert.equal(suggestDrop([], 20), 9);
  assert.equal(suggestDrop(cards, 7), 6);
  assert.equal(suggestDrop([...cards, bowl({ id: "e", title: "Eve", drop: 9 })], 7), 9);
  assert.equal(suggestVessel(9), "clay");
  assert.equal(suggestVessel(15), "pearl");
  assert.equal(fairBowlKeeper(cards, "Ned,Ida"), "Ida");
  const added = addClepsydra(cards, { title: "Dora", vessel: "glass", drop: "6", notch: "3", tags: "x y z" });
  assert.equal(added.length, 4);
  assert.equal(added[3].audit, "save");
  assert.deepEqual(added[3].tags, ["x", "y"]);
  assert.equal(addClepsydra(cards, { title: "Ada" }).length, 3);
  const lifted = liftDrop(cards, "a");
  assert.equal(lifted[0].drop, 3);
  assert.equal(lowerDrop(lifted, "a")[0].drop, 9);
  assert.equal(dropClepsydraView([{ id: "v", name: "Desk", tray: "bowl", query: "", keeper: "", drip: "all", vessel: "all", drop: "all", notch: "all" }], "v").length, 0);
  assert.equal(readClepsydraViews([{ id: "", name: "x" }]).length, 0);

  assert.equal(tideLane("2026-11-13T15:00:00.000Z", NOW), "ebb");
  assert.equal(tideSoon("2026-11-13T13:30:00.000Z", NOW), true);
  assert.equal(tideSoon("2026-11-13T15:00:00.000Z", NOW), false);
  assert.equal(tideLane("2026-11-13T20:00:00.000Z", NOW), "neap");
  assert.equal(tideLane("2026-11-18T12:00:00.000Z", NOW), "spring");
  assert.equal(tideLane("2026-12-03T12:00:00.000Z", NOW), "flood");
  assert.equal(tideLane("2026-11-13T10:00:00.000Z", NOW), "spent");
  assert.equal(tideLane("2031-11-13T12:00:00.000Z", NOW), "");
  assert.equal(tideState("", NOW), "clear");
  assert.equal(tideOpen(""), true);
  assert.equal(tideState({ expiresAt: "2026-11-13T15:00:00.000Z" }, NOW), "set");
  assert.equal(tideState({ city: "x" }, NOW), "");
  assert.equal(tideState({ expiresAt: "2026-11-13T15:00:00.000Z", amount: 3 }, NOW), "");
  assert.equal(tideHue("2026-11-13T15:00:00.000Z", NOW), "champagne");
  assert.equal(tideHue("2026-11-13T20:00:00.000Z", NOW), "ivory");
  assert.equal(tideHue("2026-11-18T12:00:00.000Z", NOW), "graphite");
  assert.equal(tideHue("2026-12-03T12:00:00.000Z", NOW), "champagne");
  assert.equal(tideHue("2026-11-13T10:00:00.000Z", NOW), "graphite");
  assert.equal(tideEbb("2026-11-13T15:00:00.000Z", NOW), true);
  assert.equal(tideSpent("2026-11-13T10:00:00.000Z", NOW), true);
  assert.equal(tideHeld("2026-12-03T12:00:00.000Z", NOW), true);
  assert.equal(tideHeld("2026-11-13T10:00:00.000Z", NOW), false);
  assert.equal(tideMinutes("2026-11-13T15:00:00.000Z", NOW), 180);
  assert.equal(tideToday("2026-11-13T20:00:00.000Z", NOW), true);
  assert.equal(tideToday("2026-11-14T12:00:00.000Z", NOW), false);
  assert.equal(tideWeekday("2026-11-13T18:00:00.000Z", NOW), true);
  assert.equal(tideWeekend("2026-11-14T12:00:00.000Z", NOW), true);
  assert.equal(tideWeekend("2026-11-13T18:00:00.000Z", NOW), false);
  assert.equal(tideMorning("2026-11-13T08:00:00.000Z", NOW), true);
  assert.equal(tideMorning("2026-11-13T18:00:00.000Z", NOW), false);
  assert.equal(tideEven("2026-11-12T12:00:00.000Z", NOW), true);
  assert.equal(tideEven("2026-11-13T18:00:00.000Z", NOW), false);
  assert.equal(tideFirst("2026-11-01T12:00:00.000Z", NOW), true);
  assert.equal(tideStep("2026-11-13T18:00:00.000Z", NOW), 11);
  assert.equal(tideStep("", NOW), 0);
  assert.equal(tideLeap("2024-11-13T12:00:00.000Z", NOW), true);
  assert.equal(tideLeap("2026-11-13T18:00:00.000Z", NOW), false);
  assert.equal(tideTwin("2026-11-06T12:00:00.000Z", NOW), true);
  assert.equal(tideTwin("2026-11-12T12:00:00.000Z", NOW), false);
  assert.equal(tideTail("2026-11-13T12:20:00.000Z"), true);
  assert.equal(tideTail("2026-11-13T12:20:00"), false);
  assert.equal(tideMark("2026-11-13T12:20:00.000Z"), true);
  assert.equal(tideSpace("2026-11-13 12:20:00Z"), true);
  const rows: TideRow[] = [
    { id: "1", label: "Ada", expires: "2026-11-13T15:00:00.000Z" },
    { id: "2", label: "Bea", expires: "2026-11-18T12:00:00.000Z" },
  ];
  assert.equal(leadingTide(rows, NOW), "ebb");
  assert.match(tideLanesCsv(rows, NOW), /ebb,1/);
  assert.match(tideLanesCsv(rows, NOW), /spring,1/);
  assert.match(tideRowsCsv(rows, ["1"], NOW), /Ada,2026-11-13T15:00:00.000Z/);

  const locales = ["en", "tr", "de", "ru", "ar"] as const;
  const keys = Object.keys(ROUND292_COPY.en).sort();
  for (const locale of locales) assert.deepEqual(Object.keys(ROUND292_COPY[locale]).sort(), keys);
  assert.equal(crmv4Text("tr", "clyTitle"), ROUND292_COPY.tr.clyTitle);
  assert.equal(crmv4Text("de", "tdeTitle"), ROUND292_COPY.de.tdeTitle);
  assert.equal(crmv4Text("ru", "clySub"), ROUND292_COPY.ru.clySub);
  assert.equal(crmv4Text("ar", "tdeSub"), ROUND292_COPY.ar.tdeSub);
  assert.equal(crmv4Text("en", "clyLogo"), "7FX");
  assert.equal(crmv4Text("en", "tdeLogo"), "7FX");
  assert.equal(crmv4Text("en", "clyTitle"), "Clepsydra bowls");
  assert.equal(crmv4Text("en", "tdeTitle"), "Tide plates");
  assert.equal(crmv4Text("en", "pnAtelierKicker"), "Graphite pin atelier");
  assert.equal(crmv4Text("en", "dtDialKicker"), "Champagne hour dial");
  assert.notEqual(ROUND292_COPY.tr.clyTitle, ROUND292_COPY.en.clyTitle);
  assert.notEqual(ROUND292_COPY.ar.tdeTitle, ROUND292_COPY.en.tdeTitle);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-clepsydra/);
  assert.match(css, /\.c4-tide-index/);
  assert.match(css, /\.c4-clepsydra-column/);
  assert.match(css, /\.c4-tide-column/);
  assert.match(css, /\.c4-pin-atelier/);
  assert.match(css, /\.c4-hour-dial-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round292.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /expiresAt:/);
  assert.match(viewFile, /clepsydraCsv/);
  assert.match(viewFile, /tideRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0&role=TRADER/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestClepsydraDrip/);
  assert.match(viewFile, /c4-tide-search/);
  assert.match(viewFile, /clepsydraTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "cly"/);
  assert.match(app, /view === "tde"/);
  const pin = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round83.tsx"), "utf8");
  const dial = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round84.tsx"), "utf8");
  assert.match(pin, /c4-pin-atelier/);
  assert.match(pin, /c4-pin-atelier-mast/);
  assert.match(pin, /data-logo="mono"/);
  assert.match(pin, /pnAtelierKicker/);
  assert.match(pin, /pnAtelierLead/);
  assert.match(pin, /data-pin-board/);
  assert.match(dial, /c4-hour-dial/);
  assert.match(dial, /c4-hour-dial-mast/);
  assert.match(dial, /dtDialKicker/);
  assert.match(dial, /dtDialLead/);
  assert.match(dial, /data-desk-timer/);
  const named = viewFile.match(/"(cly|tde|pnAtelier|dtDial)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of named) assert.equal(typeof ROUND292_COPY.en[key as keyof typeof ROUND292_COPY.en], "string", key);
  console.log("crmv4 round292 tests passed");
}

main();
