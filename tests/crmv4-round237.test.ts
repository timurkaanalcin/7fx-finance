/**
 * Observatory slips and posture marks.
 * Run: TZ=UTC npx tsx tests/crmv4-round237.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND237_COPY } from "../src/lib/crmv4/copy-round237";
import {
  activeBay,
  activeGait,
  activeSpan,
  activeWeight,
  addWatch,
  addWatchTag,
  addWatchView,
  adjacentWatchCount,
  bayBand,
  bayGap,
  bayOf,
  coolingWatch,
  cycleGait,
  fairWatcher,
  glassOf,
  houseGlass,
  joinedPosture,
  lateWatch,
  leadingPosture,
  moveWatchFocus,
  peakBay,
  postureLane,
  postureRowsCsv,
  postureSigil,
  postureState,
  postureStep,
  postureTone,
  posturesCsv,
  quietBay,
  readWatchViews,
  setWatchSeal,
  setWatchWeight,
  sharedPostureCount,
  snoozeWatch,
  spanOf,
  suggestGlass,
  suggestSpan,
  watchesCsv,
  watchTimeline,
  weightOf,
  widePosture,
} from "../src/lib/crmv4/round237";

function main() {
  assert.equal(glassOf("  crystal "), "CRYSTAL");
  assert.equal(glassOf("flint"), "FLINT");
  assert.equal(glassOf("smoke"), "SMOKE");
  assert.equal(glassOf("oak"), "");
  assert.equal(bayOf("2"), 2);
  assert.equal(bayOf(7), 7);
  assert.equal(bayOf("0"), null);
  assert.equal(bayOf("8"), null);
  assert.equal(spanOf("5"), 5);
  assert.equal(spanOf(15), 15);
  assert.equal(spanOf("60"), 60);
  assert.equal(spanOf("10"), null);
  assert.equal(weightOf("1"), 1);
  assert.equal(weightOf(4), 4);
  assert.equal(weightOf("7"), 7);
  assert.equal(weightOf("0"), null);
  assert.equal(peakBay(2), true);
  assert.equal(peakBay(6), true);
  assert.equal(peakBay(3), false);
  assert.equal(quietBay(7), true);
  assert.equal(quietBay(6), false);
  assert.equal(bayBand(2), "early");
  assert.equal(bayBand(4), "mid");
  assert.equal(bayBand(6), "late");
  assert.equal(bayGap(1, 5), 4);
  assert.equal(bayGap(5, 1), -4);
  assert.equal(bayGap(null, 4), null);
  assert.equal(houseGlass("crystal"), true);
  assert.equal(houseGlass("SMOKE"), true);
  assert.equal(houseGlass("flint"), false);
  assert.equal(activeBay("peak"), "peak");
  assert.equal(activeBay("7"), "7");
  assert.equal(activeBay("8"), "all");
  assert.equal(activeSpan("60"), "60");
  assert.equal(activeSpan("10"), "all");
  assert.equal(activeGait("walk", ["still", "walk", "rush"]), "walk");
  assert.equal(activeGait("hush", ["still", "walk", "rush"]), "all");
  assert.equal(activeWeight("4"), "4");
  assert.equal(activeWeight("2"), "all");
  assert.equal(moveWatchFocus(0, 3, 1), 1);
  assert.equal(moveWatchFocus(0, 3, -1), 2);
  assert.equal(suggestGlass([]), "CRYSTAL");
  assert.equal(suggestSpan([]), 15);
  assert.equal(fairWatcher([], "Ada, Bea"), "Ada");

  const first = addWatch([], {
    id: "a",
    title: "  North watch ",
    note: "quiet",
    watcher: "Ada",
    bay: "2",
    glass: "crystal",
    gait: "still",
    span: "5",
    tags: "a b c d e",
    weight: "4",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North watch");
  assert.equal(first[0].glass, "CRYSTAL");
  assert.equal(first[0].bay, 2);
  assert.equal(first[0].span, 5);
  assert.deepEqual(first[0].tags, ["a", "b", "c", "d"]);
  assert.equal(first[0].weight, 4);
  assert.equal(first[0].seal, false);
  assert.equal(first[0].audit, "save");
  assert.equal(addWatch(first, { id: "b", title: "   " }).length, 1);
  const raised = setWatchWeight(first, "a", "7");
  assert.equal(raised[0].weight, 7);
  assert.equal(raised[0].audit, "weight");
  const sealed = setWatchSeal(first, "a", true);
  assert.equal(sealed[0].seal, true);
  assert.equal(sealed[0].audit, "seal");
  const snoozed = snoozeWatch(first, "a");
  assert.equal(snoozed[0].span, 15);
  assert.equal(snoozeWatch(snoozed, "a")[0].span, 60);
  assert.equal(snoozeWatch(snoozeWatch(snoozed, "a"), "a")[0].span, 60);
  const paced = cycleGait(first, "a");
  assert.equal(paced[0].gait, "walk");
  const tagged = addWatchTag(first, "a", "a");
  assert.deepEqual(tagged[0].tags, ["a", "b", "c", "d"]);
  const views = addWatchView([], {
    id: "v",
    name: "Peak",
    tray: "open",
    query: "",
    watcher: "all",
    glass: "all",
    gait: "all",
    bay: "peak",
    span: "all",
    weight: "all",
  });
  assert.equal(readWatchViews(views).length, 1);
  const late = addWatch(addWatch([], { id: "a", title: "Late bay", bay: "1", weight: "1" }), { id: "b", title: "Near bay", bay: "4", weight: "1" });
  assert.equal(lateWatch(late.find((card) => card.id === "a")!, 5), true);
  assert.equal(lateWatch(late.find((card) => card.id === "b")!, 5), false);
  const cooling = addWatch([], { id: "c", title: "Cooling bay", bay: "7", gait: "rush", weight: "1" });
  assert.equal(coolingWatch(cooling[0]), true);
  assert.equal(coolingWatch({ ...cooling[0], gait: "walk" }), false);
  assert.equal(coolingWatch({ ...cooling[0], bay: 6 }), false);
  const far = addWatch(addWatch([], { id: "n1", title: "Far bay", bay: "1", weight: "1" }), { id: "n2", title: "Fourth bay", bay: "4", weight: "1" });
  assert.equal(adjacentWatchCount(far), 2);
  const close = addWatch(addWatch([], { id: "n3", title: "Near bay two", bay: "1", weight: "1" }), { id: "n4", title: "Third bay", bay: "3", weight: "1" });
  assert.equal(adjacentWatchCount(close), 0);
  assert.equal(watchTimeline(far).map((lane) => lane.bay).join(","), "1,4");

  assert.equal(postureState("hello"), "set");
  assert.equal(postureState({ name: "  " }), "clear");
  assert.equal(postureState({ name: "Ada", check: "VERIFIED", tier: "VIP", deposits: 4 }), "");
  assert.equal(postureSigil({ name: "North desk" }), "ND");
  assert.equal(postureSigil({ name: "One two three" }), "OT");
  assert.equal(postureLane({ name: "Desk 4", check: "VERIFIED" }), "cipher");
  assert.equal(postureLane({ name: "Ada Lane", check: "VERIFIED" }), "seal");
  assert.equal(postureLane({ name: "Ada Lane", check: "PENDING" }), "queue");
  assert.equal(postureLane({ name: "Ada Lane", check: "REJECTED" }), "gate");
  assert.equal(postureLane({ name: "Ada Lane", check: "UNVERIFIED" }), "vault");
  assert.equal(postureLane({ name: "Ada Lane", check: "" }), "hall");
  assert.equal(postureTone({ name: "Ada", tier: "VIP" }), "gilt");
  assert.equal(postureTone({ name: "Ada", tier: "DEMO" }), "ash");
  assert.equal(postureTone({ name: "Ada", tier: "PRO" }), "linen");
  assert.equal(postureTone({ name: "Ada", tier: "STANDARD" }), "pale");
  assert.equal(postureTone({ name: "Ada", tier: "" }), "haze");
  assert.equal(joinedPosture({ name: "North+desk" }), true);
  assert.equal(joinedPosture({ name: "North&desk" }), false);
  assert.equal(widePosture({ name: "Ada Lane" }), false);
  assert.equal(widePosture({ name: "North window" }), true);
  assert.equal(postureStep(""), 0);
  assert.equal(postureStep("Ada"), 1);
  assert.equal(postureStep("North desk"), 2);
  assert.equal(postureStep("One two three"), 3);
  const book = [
    { id: "1", label: "North window", note: { name: "North window", check: "", tier: "" } },
    { id: "2", label: "Ada Lane", note: { name: "Ada Lane", check: "VERIFIED", tier: "VIP" } },
    { id: "3", label: "Desk four", note: { name: "Desk 4", check: "PENDING", tier: "DEMO" } },
  ];
  assert.equal(leadingPosture(book), "seal");
  assert.equal(sharedPostureCount(book), 0);
  const paired = [
    book[0],
    { id: "4", label: "North wind", note: { name: "North wind", check: "" } },
  ];
  assert.equal(sharedPostureCount(paired), 2);
  assert.match(posturesCsv(book), /cipher,1/);
  assert.match(postureRowsCsv(book, ["2"]), /Ada Lane,AL,seal,gilt,2,0,0,0,0,0,1,0,0,1/);
  assert.match(watchesCsv(first, 5), /North watch,Ada,2,CRYSTAL,still,5,4,a b c d,0,0,0,0,3,0,0,1,0,0,0,quiet,save/);

  const keys = Object.keys(ROUND237_COPY.en);
  assert.ok(keys.length >= 120);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND237_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND237_COPY[locale][key as keyof typeof ROUND237_COPY.en], "string");
      assert.ok(ROUND237_COPY[locale][key as keyof typeof ROUND237_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "obvTitle"), ROUND237_COPY.tr.obvTitle);
  assert.equal(crmv4Text("de", "psrTitle"), ROUND237_COPY.de.psrTitle);
  assert.equal(crmv4Text("ru", "obvSub"), ROUND237_COPY.ru.obvSub);
  assert.equal(crmv4Text("ar", "psrSub"), ROUND237_COPY.ar.psrSub);
  assert.equal(crmv4Text("en", "obvLogo"), "7FX");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-obv/);
  assert.match(css, /\.c4-psr-index/);
  assert.match(css, /\.c4-risk-observatory/);
  assert.match(css, /\.c4-insight-observatory/);
  assert.match(css, /\.c4-insight-observatory-search/);
  assert.match(css, /\.c4-risk-observatory-index/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round237.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /validationStatus/);
  assert.match(viewFile, /accountType/);
  assert.match(viewFile, /title/);
  assert.match(viewFile, /watchesCsv/);
  assert.match(viewFile, /posturesCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "t"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "u"/);
  assert.match(viewFile, /event\.key === "s"/);
  assert.match(viewFile, /event\.key === "g"/);
  assert.match(viewFile, /event\.key === "h"/);
  assert.match(viewFile, /event\.key === "w"/);
  assert.match(viewFile, /event\.key === "d"/);
  assert.match(viewFile, /event\.key === "r"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0&role=TRADER/);
  assert.match(viewFile, /data-slips/);
  assert.match(viewFile, /data-postures/);
  assert.match(viewFile, /data-traders/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestGlass/);
  assert.match(viewFile, /c4-psr-search/);
  assert.match(viewFile, /watchTimeline/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "obv"/);
  assert.match(app, /view === "psr"/);
  assert.match(app, /ObservatorySlips/);
  assert.match(app, /PostureMarks/);
  const risk = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round47.tsx"), "utf8");
  assert.match(risk, /c4-risk-observatory/);
  assert.match(risk, /c4-risk-observatory-index/);
  assert.match(risk, /c4-risk-observatory-links/);
  assert.match(risk, /data-desk="observatory"/);
  assert.match(risk, /data-logo="mono"/);
  const insights = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round32.tsx"), "utf8");
  assert.match(insights, /c4-insight-observatory/);
  assert.match(insights, /c4-insight-observatory-mast/);
  assert.match(insights, /c4-insight-observatory-search/);
  assert.match(insights, /data-desk="observatory"/);
  assert.match(insights, /data-logo="mono"/);
  assert.match(insights, /obv/);
  assert.match(insights, /psr/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND237_COPY.en, key);
  const audit = viewFile.match(/"(obvAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND237_COPY.en, key);
  const riskUsed = new Set(risk.match(/v4\("(obv|psr)[a-zA-Z0-9]+"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(riskUsed)) assert.ok(key in ROUND237_COPY.en, key);
  const insightUsed = new Set(insights.match(/v4\("(obv|psr)[a-zA-Z0-9]+"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(insightUsed)) assert.ok(key in ROUND237_COPY.en, key);
  console.log("crmv4 round237 tests passed");
}

main();
