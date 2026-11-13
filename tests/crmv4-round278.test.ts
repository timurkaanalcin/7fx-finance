/**
 * Cross-staff sights, server plates, and the reports chartroom.
 * Run: TZ=UTC npx tsx tests/crmv4-round278.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND278_COPY } from "../src/lib/crmv4/copy-round278";
import {
  ROUND278_FEATURES,
  activeBead,
  activeFinish,
  activeHeight,
  activeReach,
  activeShade,
  addSight,
  addSightView,
  briskSight,
  bulkSightMark,
  busiestKeeper,
  cycleShade,
  dipHeight,
  dropSightView,
  fairKeeper,
  finishOf,
  houseFinish,
  idleSight,
  keenReach,
  lateSight,
  leadingServer,
  liftHeight,
  lowerBead,
  moveSightFocus,
  neighborSightCount,
  overdueSight,
  raiseBead,
  reachBand,
  reachGap,
  reachOf,
  readSightViews,
  restingSight,
  serverCap,
  serverEcho,
  serverHue,
  serverKnown,
  serverLane,
  serverLanesCsv,
  serverLeap,
  serverNotch,
  serverRowsCsv,
  serverSlash,
  serverStamp,
  serverState,
  serverStep,
  serverTail,
  serverTwin,
  serverWide,
  shadeOf,
  sightCsv,
  sightTimeline,
  staffBead,
  staffHeight,
  stillReach,
  suggestFinish,
  suggestHeight,
  suggestReach,
  type ServerRow,
  type StaffSight,
} from "../src/lib/crmv4/round278";

function card(partial: Partial<StaffSight> & { id: string; title: string }): StaffSight {
  return {
    note: "",
    helmsman: "",
    station: "",
    angle: null,
    finish: "",
    vane: "",
    ring: 1,
    tags: [],
    sighted: false,
    locked: false,
    stowed: false,
    flagged: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND278_FEATURES.length, 25);
  assert.equal(reachOf(" near "), "near");
  assert.equal(reachOf("paris"), "");
  assert.equal(staffHeight("12"), 12);
  assert.equal(staffHeight(24), 24);
  assert.equal(staffHeight("48"), 48);
  assert.equal(staffHeight("10"), null);
  assert.equal(staffHeight("4"), null);
  assert.equal(staffBead("1"), 1);
  assert.equal(staffBead(3), 3);
  assert.equal(staffBead("9"), 9);
  assert.equal(staffBead("2"), null);
  assert.equal(staffBead("4"), null);
  assert.equal(staffBead("8"), null);
  assert.equal(finishOf("ivory"), "IVORY");
  assert.equal(finishOf("graphite"), "GRAPHITE");
  assert.equal(finishOf("champagne"), "CHAMPAGNE");
  assert.equal(finishOf("gilt"), "");
  assert.equal(shadeOf("mist"), "mist");
  assert.equal(shadeOf("ink"), "ink");
  assert.equal(shadeOf("gilt"), "gilt");
  assert.equal(shadeOf("glass"), "");
  assert.equal(keenReach("quarter"), true);
  assert.equal(keenReach("STERN"), true);
  assert.equal(keenReach("near"), false);
  assert.equal(stillReach("near"), true);
  assert.equal(stillReach("beam"), true);
  assert.equal(stillReach("quarter"), false);
  assert.equal(reachBand("near"), "dawn");
  assert.equal(reachBand("beam"), "noon");
  assert.equal(reachBand("quarter"), "dusk");
  assert.equal(reachBand("stern"), "night");
  assert.equal(reachBand(""), "");
  assert.equal(reachGap("near", "beam"), 1);
  assert.equal(reachGap("beam", "near"), -1);
  assert.equal(reachGap("", "near"), null);
  assert.equal(houseFinish("ivory"), true);
  assert.equal(houseFinish("CHAMPAGNE"), true);
  assert.equal(houseFinish("graphite"), false);
  assert.equal(activeReach("keen"), "keen");
  assert.equal(activeReach("quarter"), "quarter");
  assert.equal(activeReach("paris"), "all");
  assert.equal(activeHeight("24"), "24");
  assert.equal(activeHeight("9"), "all");
  assert.equal(activeShade("ink", ["mist", "ink", "gilt"]), "ink");
  assert.equal(activeShade("glass", ["mist", "ink", "gilt"]), "all");
  assert.equal(activeBead("3"), "3");
  assert.equal(activeBead("2"), "all");
  assert.equal(activeFinish("ivory"), "ivory");
  assert.equal(moveSightFocus(0, 4, 1), 1);
  assert.equal(moveSightFocus(0, 4, -1), 3);
  assert.equal(suggestFinish([]), "IVORY");
  assert.equal(suggestHeight([], 5), 12);
  assert.equal(suggestHeight([], 10), 24);
  assert.equal(suggestHeight([], 18), 48);
  assert.equal(suggestReach(8), "near");
  assert.equal(suggestReach(10), "quarter");

  const saved = addSight([], { id: "a", title: "North", note: "keep", helmsman: "Ada", station: "quarter", finish: "ivory", vane: "mist", angle: 12, ring: 1, tags: "c d e" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].audit, "save");
  assert.equal(saved[0].angle, 12);
  assert.equal(saved[0].ring, 1);
  assert.deepEqual(saved[0].tags, ["c", "d"]);
  assert.equal(addSight(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(liftHeight(saved, "a")[0].angle, 24);
  assert.equal(dipHeight([{ ...saved[0], angle: null }], "a")[0].angle, 48);
  assert.equal(raiseBead(saved, "a")[0].ring, 3);
  assert.equal(raiseBead([{ ...saved[0], ring: 9 }], "a")[0].ring, 9);
  assert.equal(lowerBead(saved, "a")[0].ring, 1);
  assert.equal(cycleShade(saved, "a")[0].vane, "ink");
  assert.equal(fairKeeper([
    card({ id: "1", title: "One", helmsman: "Ada", station: "near" }),
    card({ id: "2", title: "Two", helmsman: "Ada", station: "near" }),
    card({ id: "3", title: "Three", helmsman: "Bea", station: "beam", sighted: true }),
  ], "Ada,Bea"), "Bea");
  assert.equal(overdueSight(card({ id: "o", title: "Late", station: "quarter", angle: 12 })), true);
  assert.equal(overdueSight(card({ id: "o2", title: "Seen", station: "quarter", angle: 12, sighted: true })), false);
  assert.equal(lateSight(card({ id: "l", title: "Behind", station: "near", ring: 1 }), "stern"), true);
  assert.equal(idleSight(card({ id: "i", title: "Still", station: "near", vane: "mist", ring: 1 })), true);
  assert.equal(briskSight(card({ id: "b", title: "Fast", station: "stern", vane: "gilt", ring: 9 })), true);
  assert.equal(restingSight(card({ id: "r", title: "Rest", station: "stern", vane: "ink", angle: 48 })), true);
  assert.equal(neighborSightCount([
    card({ id: "n1", title: "A", ring: 1 }),
    card({ id: "n2", title: "B", ring: 3 }),
  ]), 2);
  assert.equal(busiestKeeper([
    card({ id: "h1", title: "A", helmsman: "Ada" }),
    card({ id: "h2", title: "B", helmsman: "Ada" }),
    card({ id: "h3", title: "C", helmsman: "Bea" }),
  ]), "Ada");
  assert.equal(bulkSightMark(saved, ["a"])[0].sighted, true);
  const views = addSightView([], { id: "v", name: "Open", tray: "rail", station: "near", angle: "12", ring: "1", vane: "mist", finish: "ivory" });
  assert.equal(views.length, 1);
  assert.equal(dropSightView(views, "v").length, 0);
  assert.equal(readSightViews(views)[0].station, "near");
  assert.match(sightCsv(saved, "stern"), /title,helmsman,station/);
  assert.equal(sightTimeline(saved)[0].ring, 1);

  const rows: ServerRow[] = [
    { id: "1", label: "Ada desk", note: { tradingServer: "LIVE" } },
    { id: "2", label: "Bea desk", note: { tradingServer: "DEMO" } },
    { id: "3", label: "Cal desk", note: { tradingServer: "mt4" } },
    { id: "4", label: "Deep", note: { tradingServer: "ctrader" } },
    { id: "5", label: "Split", note: { tradingServer: "srv-2" } },
    { id: "6", label: "Known", note: { tradingServer: "omega" } },
    { id: "7", label: "Money", note: { tradingServer: "LIVE", amount: 4 } },
  ];
  assert.equal(serverLane(rows[0].note), "beacon");
  assert.equal(serverLane(rows[1].note), "lantern");
  assert.equal(serverLane(rows[2].note), "house");
  assert.equal(serverLane(rows[3].note), "house");
  assert.equal(serverLane(rows[4].note), "buoy");
  assert.equal(serverLane(rows[5].note), "road");
  assert.equal(serverState(rows[6].note), "");
  assert.equal(serverHue(rows[0].note), "champagne");
  assert.equal(serverHue(rows[1].note), "graphite");
  assert.equal(serverHue(rows[2].note), "champagne");
  assert.equal(serverHue(rows[3].note), "ivory");
  assert.equal(serverStamp(rows[0].note), "LIV");
  assert.equal(serverKnown(rows[2].note), true);
  assert.equal(serverKnown(rows[5].note), false);
  assert.equal(serverEcho({ tradingServer: "aba" }), true);
  assert.equal(serverLeap({ tradingServer: "port" }), true);
  assert.equal(serverTwin({ tradingServer: "letter" }), true);
  assert.equal(serverWide({ tradingServer: "ab_cd" }), true);
  assert.equal(serverNotch({ tradingServer: "ab-cd" }), true);
  assert.equal(serverSlash({ tradingServer: "ab/cd" }), true);
  assert.equal(serverCap({ tradingServer: "Tr" }), true);
  assert.equal(serverTail({ tradingServer: "idea" }), true);
  assert.equal(serverStep(rows[0].note), 4);
  assert.equal(leadingServer(rows), "house");
  assert.match(serverLanesCsv(rows), /house,2/);
  assert.match(serverRowsCsv(rows, ["1"]), /Ada desk,LIVE,LIV,beacon,champagne/);

  const locales = ["en", "tr", "de", "ru", "ar"] as const;
  const keys = Object.keys(ROUND278_COPY.en).sort();
  for (const locale of locales) assert.deepEqual(Object.keys(ROUND278_COPY[locale]).sort(), keys);
  assert.equal(crmv4Text("tr", "crsTitle"), ROUND278_COPY.tr.crsTitle);
  assert.equal(crmv4Text("de", "svrTitle"), ROUND278_COPY.de.svrTitle);
  assert.equal(crmv4Text("ru", "crsSub"), ROUND278_COPY.ru.crsSub);
  assert.equal(crmv4Text("ar", "svrSub"), ROUND278_COPY.ar.svrSub);
  assert.equal(crmv4Text("en", "crsLogo"), "7FX");
  assert.equal(crmv4Text("en", "crsTitle"), "Cross-staff sights");
  assert.equal(crmv4Text("en", "svrTitle"), "Server plates");
  assert.equal(crmv4Text("en", "rptRoomKicker"), "Chart room");
  assert.notEqual(ROUND278_COPY.tr.crsTitle, ROUND278_COPY.en.crsTitle);
  assert.equal(crmv4Text("en", "qplTitle"), "Quay plates");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-crossstaff/);
  assert.match(css, /\.c4-serverplate-index/);
  assert.match(css, /\.c4-crossstaff-column/);
  assert.match(css, /\.c4-serverplate-column/);
  assert.match(css, /\.c4-report-chartroom/);
  assert.match(css, /\.c4-report-chart-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round278.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /tradingServer:/);
  assert.match(viewFile, /sightCsv/);
  assert.match(viewFile, /serverRowsCsv/);
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
  assert.match(viewFile, /suggestFinish/);
  assert.match(viewFile, /c4-serverplate-search/);
  assert.match(viewFile, /sightTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "crs"/);
  assert.match(app, /view === "svr"/);
  const reports = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round43.tsx"), "utf8");
  assert.match(reports, /c4-report-chartroom/);
  assert.match(reports, /c4-report-chart-mast/);
  assert.match(reports, /c4-report-pastry/);
  assert.match(reports, /data-logo="mono"/);
  assert.match(reports, /rptRoomKicker/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND278_COPY.en, key);
  const named = viewFile.match(/"(crs|svr)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of named) assert.ok(key in ROUND278_COPY.en, key);
  const room = reports.match(/v4\("(rptRoom[a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || [];
  for (const key of room) assert.ok(key in ROUND278_COPY.en, key);
  console.log("crmv4 round278 tests passed");
}

main();
