/**
 * Ferry passes and referral ribbons.
 * Run: TZ=UTC npx tsx tests/crmv4-round249.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND249_COPY } from "../src/lib/crmv4/copy-round249";
import {
  activeCrossing,
  activeRung,
  activeSail,
  activeWait,
  activeWeather,
  addFerryPass,
  addFerryView,
  crossingBand,
  crossingGap,
  crossingOf,
  cycleWeather,
  fairCoxswain,
  ferryCsv,
  ferryTimeline,
  houseSail,
  idlePass,
  latePass,
  leadingRibbon,
  lengthenWait,
  lowerRung,
  moveFerryFocus,
  neighborPassCount,
  peakCrossing,
  quietCrossing,
  raiseRung,
  readFerryViews,
  ribbonBound,
  ribbonHue,
  ribbonJoin,
  ribbonLane,
  ribbonLanesCsv,
  ribbonNotch,
  ribbonRowsCsv,
  ribbonStamp,
  ribbonState,
  ribbonStep,
  ribbonWide,
  rungOf,
  sailOf,
  setPassFlag,
  setPassRung,
  shortenWait,
  suggestSail,
  suggestWait,
  waitOf,
  weatherOf,
} from "../src/lib/crmv4/round249";

function main() {
  assert.equal(crossingOf(" mole "), "mole");
  assert.equal(crossingOf("paris"), "");
  assert.equal(waitOf("12"), 12);
  assert.equal(waitOf(24), 24);
  assert.equal(waitOf("36"), 36);
  assert.equal(waitOf("10"), null);
  assert.equal(rungOf("1"), 1);
  assert.equal(rungOf(3), 3);
  assert.equal(rungOf("5"), 5);
  assert.equal(rungOf("9"), 9);
  assert.equal(rungOf("2"), null);
  assert.equal(sailOf("canvas"), "CANVAS");
  assert.equal(sailOf("oak"), "OAK");
  assert.equal(sailOf("tar"), "TAR");
  assert.equal(sailOf("linen"), "");
  assert.equal(weatherOf("calm"), "calm");
  assert.equal(weatherOf("breeze"), "breeze");
  assert.equal(weatherOf("gale"), "gale");
  assert.equal(weatherOf("warm"), "");
  assert.equal(peakCrossing("quay"), true);
  assert.equal(peakCrossing("DOCK"), true);
  assert.equal(peakCrossing("mole"), false);
  assert.equal(quietCrossing("slipway"), true);
  assert.equal(quietCrossing("quay"), false);
  assert.equal(crossingBand("quay"), "early");
  assert.equal(crossingBand("pier"), "mid");
  assert.equal(crossingBand("dock"), "late");
  assert.equal(crossingBand(""), "");
  assert.equal(crossingGap("mole", "pier"), 1);
  assert.equal(crossingGap("pier", "mole"), -1);
  assert.equal(crossingGap("", "mole"), null);
  assert.equal(houseSail("canvas"), true);
  assert.equal(houseSail("OAK"), true);
  assert.equal(houseSail("tar"), false);
  assert.equal(activeCrossing("peak"), "peak");
  assert.equal(activeCrossing("mole"), "mole");
  assert.equal(activeCrossing("paris"), "all");
  assert.equal(activeWait("12"), "12");
  assert.equal(activeWait("10"), "all");
  assert.equal(activeWeather("gale", ["calm", "breeze", "gale"]), "gale");
  assert.equal(activeWeather("loud", ["calm", "breeze", "gale"]), "all");
  assert.equal(activeRung("5"), "5");
  assert.equal(activeRung("2"), "all");
  assert.equal(activeSail("oak"), "oak");
  assert.equal(activeSail("silk"), "all");
  assert.equal(moveFerryFocus(0, 3, 1), 1);
  assert.equal(moveFerryFocus(0, 3, -1), 2);
  assert.equal(suggestSail([]), "CANVAS");
  assert.equal(suggestWait([], 4), 12);
  assert.equal(suggestWait([], 12), 24);
  assert.equal(suggestWait([], 19), 36);
  assert.equal(fairCoxswain([], "Ada, Bea"), "Ada");

  const first = addFerryPass([], {
    id: "a",
    title: "  North ferry ",
    note: "quiet",
    coxswain: "Ada",
    crossing: "mole",
    sail: "canvas",
    weather: "breeze",
    wait: "12",
    rung: "3",
    tags: "a b",
  });
  assert.equal(first[0].title, "North ferry");
  assert.equal(first[0].sail, "CANVAS");
  assert.equal(first[0].wait, 12);
  assert.equal(first[0].rung, 3);
  assert.deepEqual(first[0].tags, ["a", "b"]);
  assert.equal(latePass(first[0], "pier"), true);
  assert.equal(idlePass(first[0]), false);
  const weathered = cycleWeather(first, "a");
  assert.equal(weathered[0].weather, "gale");
  const raised = raiseRung(first, "a");
  assert.equal(raised[0].rung, 5);
  const lowered = lowerRung(raised, "a");
  assert.equal(lowered[0].rung, 3);
  const longer = lengthenWait(first, "a");
  assert.equal(longer[0].wait, 24);
  const shorter = shortenWait(longer, "a");
  assert.equal(shorter[0].wait, 12);
  const flagged = setPassFlag(first, "a", true);
  assert.equal(flagged[0].flagged, true);
  assert.equal(setPassRung(first, "a", 2)[0].rung, 3);
  assert.equal(ferryTimeline(first).map((lane) => lane.rung).join(","), "3");
  assert.match(ferryCsv(first, "pier"), /North ferry,Ada,mole,CANVAS,breeze,12,3,a b,0,0,0,0,1,1,0,0,1,1,early,0,0,0,save,quiet/);
  const views = addFerryView([], {
    id: "v",
    name: " Peak ",
    tray: "open",
    query: "north",
    coxswain: "Ada",
    sail: "canvas",
    weather: "breeze",
    crossing: "peak",
    wait: "12",
    rung: "3",
  });
  assert.equal(readFerryViews(views)[0].crossing, "peak");
  assert.equal(neighborPassCount(first), 0);

  assert.equal(ribbonState("NORTH"), "set");
  assert.equal(ribbonState("  "), "clear");
  assert.equal(ribbonState("AB"), "clear");
  assert.equal(ribbonState({ campaign: "NORTH", balance: 4 }), "");
  assert.equal(ribbonStamp("NORTH"), "NH5");
  assert.equal(ribbonStamp("AABB"), "AB4");
  assert.equal(ribbonLane("AABB"), "twin");
  assert.equal(ribbonLane("FX-NORTH"), "split");
  assert.equal(ribbonLane("7FXCODE"), "digit");
  assert.equal(ribbonLane("NORTH"), "brief");
  assert.equal(ribbonLane("NORTHERN"), "name");
  assert.equal(ribbonLane("ABCDEFGHIJKLMN"), "full");
  assert.equal(ribbonLane("AB12CD"), "mixed");
  assert.equal(ribbonLane("A_B2"), "split");
  assert.equal(ribbonLane(""), "");
  assert.equal(ribbonHue("AABB"), "gilt");
  assert.equal(ribbonHue("NORTH"), "slate");
  assert.equal(ribbonHue("AAA1"), "mist");
  assert.equal(ribbonBound("FX-NORTH"), true);
  assert.equal(ribbonBound("7FXCODE"), true);
  assert.equal(ribbonBound("NORTH"), false);
  assert.equal(ribbonWide("ABCDEFGHIJKLMN"), true);
  assert.equal(ribbonWide("NORTH"), false);
  assert.equal(ribbonNotch("FX-NORTH"), true);
  assert.equal(ribbonNotch("AABB"), false);
  assert.equal(ribbonStep("AABB"), 2);
  assert.equal(ribbonStep(""), 0);
  assert.equal(ribbonJoin("AAA1"), true);
  assert.equal(ribbonJoin("AABB"), false);

  const book = [
    { id: "1", label: "Ada", note: "AABB" },
    { id: "2", label: "Bea", note: "AABB" },
    { id: "3", label: "Cem", note: "NORTH" },
  ];
  assert.equal(leadingRibbon(book), "twin");
  assert.match(ribbonLanesCsv(book), /twin,2/);
  assert.match(ribbonRowsCsv(book, ["1"]), /AABB,AB4,twin,gilt,2,0,0,0,0,1,0,0,0,0,0,0,1/);

  const keys = Object.keys(ROUND249_COPY.en);
  assert.ok(keys.length >= 120);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND249_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND249_COPY[locale][key as keyof typeof ROUND249_COPY.en], "string");
      assert.ok(ROUND249_COPY[locale][key as keyof typeof ROUND249_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "fryTitle"), ROUND249_COPY.tr.fryTitle);
  assert.equal(crmv4Text("de", "rfrTitle"), ROUND249_COPY.de.rfrTitle);
  assert.equal(crmv4Text("ru", "frySub"), ROUND249_COPY.ru.frySub);
  assert.equal(crmv4Text("ar", "rfrSub"), ROUND249_COPY.ar.rfrSub);
  assert.equal(crmv4Text("en", "fryLogo"), "7FX");
  assert.equal(crmv4Text("en", "fryTitle"), "Ferry passes");
  assert.notEqual(ROUND249_COPY.tr.fryTitle, ROUND249_COPY.en.fryTitle);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-fry/);
  assert.match(css, /\.c4-rfr-index/);
  assert.match(css, /\.c4-triage-salon/);
  assert.match(css, /\.c4-alert-salon/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round249.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /campaign/);
  assert.match(viewFile, /title/);
  assert.match(viewFile, /ferryCsv/);
  assert.match(viewFile, /ribbonRowsCsv/);
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
  assert.match(viewFile, /data-passes/);
  assert.match(viewFile, /data-ribbons/);
  assert.match(viewFile, /data-traders/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestSail/);
  assert.match(viewFile, /c4-rfr-search/);
  assert.match(viewFile, /ferryTimeline/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "fry"/);
  assert.match(app, /view === "cmp"/);
  assert.match(app, /FerryPasses/);
  assert.match(app, /CampaignMarks/);
  const triage = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round57.tsx"), "utf8");
  assert.match(triage, /c4-triage-salon/);
  assert.match(triage, /data-logo="mono"/);
  const alerts = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round59.tsx"), "utf8");
  assert.match(alerts, /c4-alert-salon/);
  assert.match(alerts, /data-logo="mono"/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND249_COPY.en, key);
  const audit = viewFile.match(/"(fryAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND249_COPY.en, key);
  const salon = `${triage}\n${alerts}`.match(/v4\("(trSalon[a-zA-Z]+|raSalon[a-zA-Z]+)"\)/g)?.map((item) => item.slice(4, -2)) || [];
  for (const key of salon) assert.ok(key in ROUND249_COPY.en, key);
  console.log("crmv4 round249 tests passed");
}

main();
