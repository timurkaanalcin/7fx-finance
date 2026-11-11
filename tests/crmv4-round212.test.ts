/**
 * Ambulatory lanterns and country lamps.
 * Run: TZ=UTC npx tsx tests/crmv4-round212.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND212_COPY } from "../src/lib/crmv4/copy-round212";
import {
  activeGlass,
  activePulse,
  activeStation,
  addLantern,
  addLanternMark,
  addLanternView,
  adjacentLanternCount,
  busiestKeeper,
  catalogLamp,
  catalogLampCount,
  clashStationCount,
  cyclePulse,
  densityOf,
  fairKeeper,
  flameOf,
  glassClashCount,
  glassOf,
  giltLampCount,
  houseFlame,
  knockLoad,
  lampCopy,
  lampLane,
  lampOf,
  lampRowsCsv,
  lampState,
  lampTone,
  lampsCsv,
  lanternsCsv,
  lateLantern,
  lateShare,
  leadingLamp,
  leadingLampTone,
  moveFocus,
  nextLantern,
  oilLoad,
  oilOf,
  pairKeeperCount,
  peakStation,
  quietHouseCount,
  quietStation,
  readLanternViews,
  setLanternOil,
  sharedFlameCount,
  sharedLampCount,
  snoozeLantern,
  soonLantern,
  stationGap,
  stationOf,
  stationSpan,
  suggestFlame,
  suggestGlass,
  suggestKeeper,
  usedStations,
  visibleLampCustomers,
  wideLampCount,
  windowLanterns,
} from "../src/lib/crmv4/round212";

function main() {
  assert.equal(flameOf("  ember "), "EMBER");
  assert.equal(flameOf("ivory"), "IVORY");
  assert.equal(flameOf("champagne"), "CHAMPAGNE");
  assert.equal(flameOf("   "), "");
  assert.equal(flameOf("gold"), "");
  assert.equal(stationOf("1"), 1);
  assert.equal(stationOf(6), 6);
  assert.equal(stationOf("6"), 6);
  assert.equal(stationOf("0"), null);
  assert.equal(stationOf(0), null);
  assert.equal(stationOf("7"), null);
  assert.equal(stationOf("06"), null);
  assert.equal(stationOf(""), null);
  assert.equal(stationOf(1.5), null);
  assert.equal(glassOf("2"), 2);
  assert.equal(glassOf(6), 6);
  assert.equal(glassOf("12"), 12);
  assert.equal(glassOf("4"), null);
  assert.equal(glassOf("02"), null);
  assert.equal(oilOf("0"), 0);
  assert.equal(oilOf(1), 1);
  assert.equal(oilOf("4"), 4);
  assert.equal(oilOf("3"), null);
  assert.equal(peakStation(2), true);
  assert.equal(peakStation(5), true);
  assert.equal(peakStation(4), false);
  assert.equal(quietStation(1), true);
  assert.equal(quietStation(6), true);
  assert.equal(quietStation(2), false);
  assert.equal(stationGap(1, 6), 5);
  assert.equal(stationGap(6, 1), -5);
  assert.equal(stationGap(null, 3), null);
  assert.equal(stationGap(1, 0), null);
  assert.equal(houseFlame("ivory"), true);
  assert.equal(houseFlame("CHAMPAGNE"), true);
  assert.equal(houseFlame("ember"), false);
  assert.equal(activeStation("peak"), "peak");
  assert.equal(activeStation("6"), "6");
  assert.equal(activeStation("7"), "all");
  assert.equal(activeGlass("6"), "6");
  assert.equal(activeGlass("4"), "all");
  assert.equal(activePulse("hush", ["hush", "bell", "knock"]), "hush");
  assert.equal(activePulse("nope", ["hush", "bell", "knock"]), "all");
  assert.equal(densityOf("low"), "low");
  assert.equal(densityOf("nope"), "tall");
  assert.equal(moveFocus(0, 3, 1), 1);
  assert.equal(moveFocus(0, 3, -1), 2);

  const first = addLantern([], {
    id: "a",
    title: "  North walk ",
    note: "quiet",
    keeper: "Ada",
    station: "1",
    flame: "ivory",
    pulse: "hush",
    glass: "6",
    marks: "m n o z",
    oil: "1",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North walk");
  assert.equal(first[0].flame, "IVORY");
  assert.equal(first[0].station, 1);
  assert.equal(first[0].glass, 6);
  assert.deepEqual(first[0].marks, ["m", "n", "o"]);
  assert.equal(first[0].oil, 1);
  assert.equal(first[0].audit, "save");
  assert.equal(addLantern(first, { id: "a", title: "Other" }).length, 1);
  assert.equal(addLantern(first, { id: "b", title: "North walk" }).length, 1);
  assert.equal(addLantern(first, { id: "c", title: "   " }).length, 1);
  const voiced = cyclePulse(first, "a");
  assert.equal(voiced[0].pulse, "bell");
  assert.equal(cyclePulse(voiced, "a")[0].pulse, "knock");
  assert.equal(cyclePulse(cyclePulse(voiced, "a"), "a")[0].pulse, "hush");
  assert.equal(addLanternMark(first, "a", "p")[0].marks.length, 3);
  assert.equal(addLanternMark(first, "a", "m")[0].marks.length, 3);
  assert.equal(setLanternOil(first, "a", 0)[0].oil, 0);
  assert.equal(setLanternOil(first, "a", 2)[0].oil, 1);
  const snoozed = snoozeLantern([{ ...first[0], glass: null }], "a");
  assert.equal(snoozed[0].glass, 2);
  assert.equal(snoozeLantern(snoozed, "a")[0].glass, 6);
  assert.equal(snoozeLantern(snoozeLantern(snoozed, "a"), "a")[0].glass, 12);
  assert.equal(snoozeLantern(snoozeLantern(snoozeLantern(snoozed, "a"), "a"), "a")[0].glass, 12);

  const desk = addLantern(addLantern(addLantern(addLantern([], {
    id: "late",
    title: "Late",
    keeper: "Ada",
    station: 1,
    flame: "ivory",
    pulse: "hush",
    glass: 6,
  }), {
    id: "due",
    title: "Due",
    keeper: "Bo",
    station: 3,
    flame: "ivory",
    pulse: "bell",
    glass: 2,
  }), {
    id: "near",
    title: "Near",
    keeper: "Ada",
    station: 5,
    flame: "champagne",
    pulse: "knock",
    glass: 12,
  }), {
    id: "peak",
    title: "Peak",
    keeper: "Cy",
    station: 2,
    flame: "ember",
    pulse: "hush",
    glass: 6,
    oil: 1,
  });
  assert.equal(lateLantern(desk.find((row) => row.id === "late")!, 4), true);
  assert.equal(soonLantern(desk.find((row) => row.id === "due")!), true);
  assert.equal(lateShare(desk, 4) > 0, true);
  assert.equal(suggestFlame([]), "EMBER");
  assert.equal(suggestGlass([]), 6);
  assert.equal(suggestKeeper(desk), "Cy");
  assert.equal(fairKeeper(desk, "Ada, Bo, Cy"), "Bo");
  assert.equal(busiestKeeper(desk), "Ada");
  assert.equal(usedStations(desk), 4);
  assert.equal(clashStationCount(desk), 0);
  assert.equal(glassClashCount(desk), 2);
  assert.equal(adjacentLanternCount(desk), 2);
  assert.equal(pairKeeperCount(desk), 2);
  assert.equal(sharedFlameCount(desk), 2);
  assert.equal(oilLoad(desk), 1);
  assert.equal(quietHouseCount(desk), 1);
  assert.equal(knockLoad(desk), 1);
  assert.equal(stationSpan(desk), 4);
  assert.equal(nextLantern(desk, 4), "late");
  assert.equal(windowLanterns(desk, 4).some((row) => row.id === "due"), true);
  const sheet = lanternsCsv(desk, 4);
  assert.match(sheet, /title,keeper,station/);
  assert.match(sheet, /Late,Ada,1,IVORY/);
  const saved = addLanternView([], {
    id: "v1",
    name: "Open ivory",
    tray: "open",
    query: "",
    keeper: "all",
    flame: "ivory",
    pulse: "all",
    station: "all",
    glass: "all",
    oil: "all",
  });
  assert.equal(readLanternViews(saved).length, 1);

  assert.equal(lampOf("Turkey"), "TU");
  assert.equal(lampOf("Germany"), "GE");
  assert.equal(lampOf("a"), "A");
  assert.equal(lampLane("turkey"), "south");
  assert.equal(lampLane("germany"), "mid");
  assert.equal(lampLane("arabia"), "north");
  assert.equal(lampTone("turkey"), "gilt");
  assert.equal(lampTone("tr"), "gilt");
  assert.equal(lampTone("germany"), "ink");
  assert.equal(lampTone("de"), "ink");
  assert.equal(lampTone("russia"), "ivory");
  assert.equal(lampTone("emirates"), "mist");
  assert.equal(lampTone("france"), "plain");
  assert.equal(catalogLamp("turkey"), true);
  assert.equal(catalogLamp("arabia"), true);
  assert.equal(catalogLamp("tr"), false);
  assert.equal(lampState({ language: "en", country: "turkey" }), "");
  assert.equal(lampState({ country: null }), "clear");
  assert.equal(lampState({ country: "Turkey" }), "set");
  assert.equal(lampCopy("United Arab Emirates"), "unitedarabemirates");

  const rows = [
    { id: "1", label: "Ada", note: { country: "Turkey" } },
    { id: "2", label: "Bo", note: { country: "Germany" } },
    { id: "3", label: "Cy", note: { country: "Russia" } },
    { id: "4", label: "Fay", note: { country: null } },
    { id: "5", label: "Ivo", note: { language: "en" } },
    { id: "6", label: "Ned", note: "United Arab Emirates" },
  ];
  assert.equal(catalogLampCount(rows), 3);
  assert.equal(wideLampCount(rows), 1);
  assert.equal(giltLampCount(rows), 1);
  assert.equal(sharedLampCount(rows), 0);
  assert.equal(leadingLamp(rows), "south");
  assert.equal(leadingLampTone(rows), "gilt");
  assert.equal(visibleLampCustomers(rows, "south", null, "ada", "all", [], "all").length, 1);
  const counts = lampsCsv(rows);
  assert.match(counts, /lane,south,3/);
  assert.match(counts, /catalog,catalog,3/);
  const rowSheet = lampRowsCsv(rows, ["1"]);
  assert.match(rowSheet, /Ada,TU,south,gilt,1,0,1/);
  assert.match(rowSheet, /Fay,,blank,,0,0,0/);

  const keys = Object.keys(ROUND212_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND212_COPY[locale]).sort(), keys);
    for (const key of keys) {
      assert.equal(typeof ROUND212_COPY[locale][key as keyof typeof ROUND212_COPY.en], "string");
      assert.ok(ROUND212_COPY[locale][key as keyof typeof ROUND212_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "alnTitle"), ROUND212_COPY.tr.alnTitle);
  assert.equal(crmv4Text("de", "clmTitle"), ROUND212_COPY.de.clmTitle);
  assert.equal(crmv4Text("ru", "alnSub"), ROUND212_COPY.ru.alnSub);
  assert.equal(crmv4Text("ar", "clmSub"), ROUND212_COPY.ar.clmSub);
  assert.equal(crmv4Text("en", "alnLogo"), "7FX");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-aln/);
  assert.match(css, /\.c4-clm-index/);
  assert.match(css, /\.c4-logs-ambulatory/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round212.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.equal(viewFile.includes("saleStatus"), false);
  assert.equal(viewFile.includes("retentionStatus"), false);
  assert.equal(viewFile.includes("potentialStatus"), false);
  assert.equal(viewFile.includes("documentsStatus"), false);
  assert.equal(viewFile.includes("validationStatus"), false);
  assert.equal(viewFile.includes("registrationDate"), false);
  assert.equal(viewFile.includes("birthDate"), false);
  assert.equal(viewFile.includes("lastContactAt"), false);
  assert.equal(viewFile.includes("assigneeId"), false);
  assert.equal(viewFile.includes("lastBrowser"), false);
  assert.match(viewFile, /country/);
  assert.match(viewFile, /lanternsCsv/);
  assert.match(viewFile, /lampsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /event\.key === "o"/);
  assert.match(viewFile, /event\.key === "g"/);
  assert.match(viewFile, /event\.key === "h"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-lanterns/);
  assert.match(viewFile, /data-lamps/);
  assert.match(viewFile, /data-catalog/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestFlame/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "amln"/);
  assert.match(app, /view === "clmp"/);
  assert.match(app, /AmbulatoryLanterns/);
  assert.match(app, /CountryLamps/);
  const logs = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Logs.tsx"), "utf8");
  assert.match(logs, /c4-logs-ambulatory/);
  assert.match(logs, /c4-logs-index/);
  assert.match(logs, /data-logo="mono"/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of used) assert.ok(key in ROUND212_COPY.en, key);
  console.log("crmv4 round212 tests passed");
}

main();
