/**
 * Waywiser wheels, hour plates, and the lamp court.
 * Run: TZ=UTC npx tsx tests/crmv4-round286.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND286_COPY } from "../src/lib/crmv4/copy-round286";
import {
  ROUND286_FEATURES,
  activeRim,
  activeRoad,
  activeSpoke,
  activeTurn,
  addWaywiser,
  briskWay,
  dipSpoke,
  dropWayView,
  fairWalker,
  fullTurn,
  hourEven,
  hourHue,
  hourLane,
  hourLanesCsv,
  hourLeap,
  hourLive,
  hourMark,
  hourQuiet,
  hourRowsCsv,
  hourSpace,
  hourStale,
  hourState,
  hourStep,
  hourTail,
  hourToday,
  hourTwin,
  hourWeekend,
  hourWide,
  houseRim,
  idleWay,
  lateWay,
  leadingHour,
  liftSpoke,
  moveWayFocus,
  overdueWay,
  pairTurn,
  pavedRoad,
  readWayViews,
  restingWay,
  roadGap,
  softRoad,
  suggestRoad,
  suggestSpoke,
  suggestWayRim,
  wayBand,
  wayRim,
  wayRoad,
  waySpoke,
  wayTurn,
  type HourRow,
  type Waywiser,
} from "../src/lib/crmv4/round286";

const NOW = Date.parse("2026-11-13T12:00:00.000Z");

function wheel(partial: Partial<Waywiser> & { id: string; title: string }): Waywiser {
  return {
    note: "",
    walker: "",
    road: "",
    spoke: null,
    rim: "",
    turn: 1,
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
  assert.equal(ROUND286_FEATURES.length, 25);
  assert.equal(wayRoad(" court "), "court");
  assert.equal(wayRoad("paris"), "");
  assert.equal(waySpoke("4"), 4);
  assert.equal(waySpoke(6), 6);
  assert.equal(waySpoke("8"), 8);
  assert.equal(waySpoke("5"), null);
  assert.equal(waySpoke("16"), null);
  assert.equal(wayTurn("1"), 1);
  assert.equal(wayTurn(2), 2);
  assert.equal(wayTurn("3"), 3);
  assert.equal(wayTurn("4"), null);
  assert.equal(wayRim("oak"), "OAK");
  assert.equal(wayRim("iron"), "IRON");
  assert.equal(wayRim("gilt"), "GILT");
  assert.equal(wayRim("pitch"), "");
  assert.equal(pavedRoad("lane"), true);
  assert.equal(pavedRoad("COURT"), true);
  assert.equal(pavedRoad("park"), false);
  assert.equal(softRoad("quay"), true);
  assert.equal(softRoad("park"), true);
  assert.equal(softRoad("lane"), false);
  assert.equal(wayBand("lane"), "dawn");
  assert.equal(wayBand("court"), "noon");
  assert.equal(wayBand("quay"), "dusk");
  assert.equal(wayBand("park"), "night");
  assert.equal(wayBand(""), "");
  assert.equal(roadGap("lane", "court"), 1);
  assert.equal(roadGap("court", "lane"), -1);
  assert.equal(roadGap("", "lane"), null);
  assert.equal(houseRim("iron"), true);
  assert.equal(houseRim("GILT"), true);
  assert.equal(houseRim("oak"), false);
  assert.equal(pairTurn(2), true);
  assert.equal(pairTurn("2"), true);
  assert.equal(pairTurn(1), false);
  assert.equal(fullTurn(3), true);
  assert.equal(fullTurn(2), false);
  assert.equal(activeRoad("paved"), "paved");
  assert.equal(activeRoad("lane"), "lane");
  assert.equal(activeRoad("paris"), "all");
  assert.equal(activeSpoke("6"), "6");
  assert.equal(activeSpoke("5"), "all");
  assert.equal(activeRim("gilt", ["OAK", "IRON", "GILT"]), "GILT");
  assert.equal(activeRim("mist", ["OAK", "IRON", "GILT"]), "all");
  assert.equal(activeTurn("2"), "2");
  assert.equal(activeTurn("9"), "all");
  assert.equal(moveWayFocus(0, 4, 1), 1);
  assert.equal(moveWayFocus(0, 4, -1), 3);
  assert.equal(suggestWayRim([]), "OAK");
  assert.equal(suggestSpoke([], 5), 4);
  assert.equal(suggestSpoke([], 10), 6);
  assert.equal(suggestSpoke([], 20), 8);
  assert.equal(suggestRoad(8), "lane");
  assert.equal(suggestRoad(11), "park");
  assert.equal(fairWalker([wheel({ id: "1", title: "Lane", walker: "Ada" })], "Ada,Bea"), "Bea");

  const saved = addWaywiser([], { id: "1", title: "Quay", road: "quay", spoke: 4, rim: "iron", turn: 1, walker: "Ada" });
  assert.equal(saved[0].audit, "save");
  assert.equal(overdueWay(saved[0]), true);
  assert.equal(briskWay(saved[0]), false);
  assert.equal(liftSpoke(saved, "1")[0].spoke, 6);
  assert.equal(dipSpoke([{ ...saved[0], spoke: null }], "1")[0].spoke, 8);
  const quiet = wheel({ id: "2", title: "Calm", road: "quay", rim: "", spoke: 4, turn: 1 });
  assert.equal(idleWay(quiet), true);
  assert.equal(lateWay(wheel({ id: "4", title: "Late", road: "lane", turn: 1 }), "park"), true);
  const rest = wheel({ id: "3", title: "Rest", road: "park", rim: "OAK", spoke: 6, turn: 2 });
  assert.equal(restingWay(rest), true);
  assert.equal(briskWay(wheel({ id: "5", title: "Keen", road: "lane", rim: "GILT", spoke: 8, turn: 3 })), true);
  const views = readWayViews([{ id: "v1", name: "Morning", tray: "shed", road: "paved", spoke: "6", turn: "2", rim: "iron" }]);
  assert.equal(views[0].tray, "shed");
  assert.equal(views[0].road, "paved");
  assert.equal(views[0].rim, "IRON");
  assert.equal(dropWayView(views, "v1").length, 0);

  assert.equal(hourLane("2026-11-13T11:50:00.000Z", NOW), "live");
  assert.equal(hourLive("2026-11-13T11:50:00.000Z", NOW), true);
  assert.equal(hourLane("2026-11-12T13:00:00.000Z", NOW), "noon");
  assert.equal(hourLane("2026-11-12T07:00:00.000Z", NOW), "dawn");
  assert.equal(hourLane("2026-11-12T18:00:00.000Z", NOW), "dusk");
  assert.equal(hourLane("2026-11-12T22:00:00.000Z", NOW), "night");
  assert.equal(hourLane("2026-10-01T13:00:00.000Z", NOW), "stale");
  assert.equal(hourStale("2026-10-01T13:00:00.000Z", NOW), true);
  assert.equal(hourLane("", NOW), "");
  assert.equal(hourQuiet(""), true);
  assert.equal(hourQuiet({ lastSeenAt: "2026-11-13T11:50:00.000Z" }), false);
  assert.equal(hourHue("2026-11-13T11:50:00.000Z", NOW), "champagne");
  assert.equal(hourHue("2026-10-01T13:00:00.000Z", NOW), "graphite");
  assert.equal(hourHue("2026-11-12T07:00:00.000Z", NOW), "ivory");
  assert.equal(hourToday("2026-11-13T08:00:00.000Z", NOW), true);
  assert.equal(hourToday("2026-11-12T08:00:00.000Z", NOW), false);
  assert.equal(hourWeekend("2026-11-08T13:00:00.000Z", NOW), true);
  assert.equal(hourWeekend("2026-11-13T08:00:00.000Z", NOW), false);
  assert.equal(hourEven("2026-11-12T08:00:00.000Z", NOW), true);
  assert.equal(hourEven("2026-11-12T13:00:00.000Z", NOW), false);
  assert.equal(hourStep("2026-11-12T13:00:00.000Z", NOW), 13);
  assert.equal(hourStep("", NOW), 0);
  assert.equal(hourLeap("2026-11-11T13:00:00.000Z", NOW), true);
  assert.equal(hourWide("2026-11-11T13:00:00.000Z", NOW), false);
  assert.equal(hourWide("2026-10-01T13:00:00.000Z", NOW), true);
  assert.equal(hourTwin("2026-11-12T13:00:00.000Z", NOW), true);
  assert.equal(hourTwin("2026-11-12T13:15:00.000Z", NOW), false);
  assert.equal(hourTail("2026-11-12T13:00:00.000Z"), true);
  assert.equal(hourTail("2026-11-12T13:00:00"), false);
  assert.equal(hourMark("2026-11-12T13:00:00.000Z"), true);
  assert.equal(hourSpace("2026-11-12 13:00:00Z"), true);
  assert.equal(hourState({ lastSeenAt: "2026-11-13T11:50:00.000Z", amount: 3 }, NOW), "");
  assert.equal(hourState("", NOW), "clear");
  assert.equal(hourState({ city: "x" }, NOW), "");
  const rows: HourRow[] = [
    { id: "1", label: "Ada", seen: "2026-11-13T11:50:00.000Z" },
    { id: "2", label: "Bea", seen: "2026-11-12T07:00:00.000Z" },
  ];
  assert.equal(leadingHour(rows, NOW), "live");
  assert.match(hourLanesCsv(rows, NOW), /live,1/);
  assert.match(hourLanesCsv(rows, NOW), /dawn,1/);
  assert.match(hourRowsCsv(rows, ["1"], NOW), /Ada,2026-11-13T11:50:00.000Z/);

  const locales = ["en", "tr", "de", "ru", "ar"] as const;
  const keys = Object.keys(ROUND286_COPY.en).sort();
  for (const locale of locales) assert.deepEqual(Object.keys(ROUND286_COPY[locale]).sort(), keys);
  assert.equal(crmv4Text("tr", "wyrTitle"), ROUND286_COPY.tr.wyrTitle);
  assert.equal(crmv4Text("de", "hrsTitle"), ROUND286_COPY.de.hrsTitle);
  assert.equal(crmv4Text("ru", "wyrSub"), ROUND286_COPY.ru.wyrSub);
  assert.equal(crmv4Text("ar", "hrsSub"), ROUND286_COPY.ar.hrsSub);
  assert.equal(crmv4Text("en", "wyrLogo"), "7FX");
  assert.equal(crmv4Text("en", "hrsLogo"), "7FX");
  assert.equal(crmv4Text("en", "wyrTitle"), "Waywiser wheels");
  assert.equal(crmv4Text("en", "hrsTitle"), "Hour plates");
  assert.equal(crmv4Text("en", "scLampKicker"), "Lamp court");
  assert.notEqual(ROUND286_COPY.tr.wyrTitle, ROUND286_COPY.en.wyrTitle);
  assert.notEqual(ROUND286_COPY.ar.hrsTitle, ROUND286_COPY.en.hrsTitle);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-waywiser/);
  assert.match(css, /\.c4-hourplate-index/);
  assert.match(css, /\.c4-waywiser-column/);
  assert.match(css, /\.c4-hourplate-column/);
  assert.match(css, /\.c4-shortcut-lamp/);
  assert.match(css, /\.c4-case-lamp-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round286.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /lastSeenAt:/);
  assert.match(viewFile, /wayCsv/);
  assert.match(viewFile, /hourRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "n"/);
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
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestWayRim/);
  assert.match(viewFile, /c4-hourplate-search/);
  assert.match(viewFile, /wayTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "wyr"/);
  assert.match(app, /view === "hrs"/);
  const desk = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round54.tsx"), "utf8");
  assert.match(desk, /c4-shortcut-lamp/);
  assert.match(desk, /c4-shortcut-lamp-seal/);
  assert.match(desk, /c4-shortcut-lamp-mast/);
  assert.match(desk, /c4-case-lamp/);
  assert.match(desk, /c4-case-lamp-mast/);
  assert.match(desk, /data-logo="mono"/);
  assert.match(desk, /scLampKicker/);
  assert.match(desk, /scLampLead/);
  assert.match(desk, /cqLampKicker/);
  assert.match(desk, /cqLampLead/);
  assert.match(desk, /aria-required=\{false\}/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND286_COPY.en, key);
  const named = viewFile.match(/"(wyr|hrs|scLamp|cqLamp)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of named) assert.ok(key in ROUND286_COPY.en, key);
  const lamp = desk.match(/v4\("((?:scLamp|cqLamp)[a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || [];
  for (const key of lamp) assert.ok(key in ROUND286_COPY.en, key);
  console.log("crmv4 round286 tests passed");
}

main();
