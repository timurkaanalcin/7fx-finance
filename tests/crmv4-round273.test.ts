/**
 * Theodolite circles and tier plates.
 * Run: TZ=UTC npx tsx tests/crmv4-round273.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND273_COPY } from "../src/lib/crmv4/copy-round273";
import {
  ROUND273_FEATURES,
  activeArc,
  activeBead,
  activeFinish,
  activeLimb,
  activeStation,
  addCircle,
  addCircleView,
  briskCircle,
  bulkCircleClamp,
  busiestSurveyor,
  circleCsv,
  theodoliteBead,
  theodoliteArc,
  circleTimeline,
  stationBand,
  stationGap,
  stationOf,
  cycleLimb,
  dropCircleView,
  fairSurveyor,
  finishOf,
  houseFinish,
  idleCircle,
  lateCircle,
  leadingTier,
  widenArc,
  lowerBead,
  moveTheodoliteFocus,
  neighborBeadCount,
  overdueCircle,
  keenStation,
  stillStation,
  raiseBead,
  readCircleViews,
  restingCircle,
  narrowArc,
  suggestArc,
  suggestStation,
  suggestFinish,
  limbOf,
  tierCap,
  tierEcho,
  tierHue,
  tierKnown,
  tierLane,
  tierLanesCsv,
  tierLeap,
  tierNotch,
  tierRowsCsv,
  tierSlash,
  tierStamp,
  tierState,
  tierStep,
  tierTail,
  tierTwin,
  tierWide,
} from "../src/lib/crmv4/round273";

function main() {
  assert.equal(ROUND273_FEATURES.length, 25);
  assert.equal(stationOf(" zenith "), "zenith");
  assert.equal(stationOf("paris"), "");
  assert.equal(theodoliteArc("15"), 15);
  assert.equal(theodoliteArc(45), 45);
  assert.equal(theodoliteArc("90"), 90);
  assert.equal(theodoliteArc("20"), null);
  assert.equal(theodoliteArc("12"), null);
  assert.equal(theodoliteBead("2"), 2);
  assert.equal(theodoliteBead(4), 4);
  assert.equal(theodoliteBead("8"), 8);
  assert.equal(theodoliteBead("16"), 16);
  assert.equal(theodoliteBead("3"), null);
  assert.equal(theodoliteBead("1"), null);
  assert.equal(theodoliteBead("32"), null);
  assert.equal(finishOf("ivory"), "IVORY");
  assert.equal(finishOf("graphite"), "GRAPHITE");
  assert.equal(finishOf("champagne"), "CHAMPAGNE");
  assert.equal(finishOf("brass"), "");
  assert.equal(limbOf("circle"), "circle");
  assert.equal(limbOf("vernier"), "vernier");
  assert.equal(limbOf("clamp"), "clamp");
  assert.equal(limbOf("west"), "");
  assert.equal(keenStation("azimuth"), true);
  assert.equal(keenStation("NADIR"), true);
  assert.equal(keenStation("zenith"), false);
  assert.equal(stillStation("zenith"), true);
  assert.equal(stillStation("transit"), true);
  assert.equal(stillStation("azimuth"), false);
  assert.equal(stationBand("zenith"), "dawn");
  assert.equal(stationBand("transit"), "noon");
  assert.equal(stationBand("azimuth"), "dusk");
  assert.equal(stationBand("nadir"), "night");
  assert.equal(stationBand(""), "");
  assert.equal(stationGap("zenith", "transit"), 1);
  assert.equal(stationGap("transit", "zenith"), -1);
  assert.equal(stationGap("", "zenith"), null);
  assert.equal(houseFinish("graphite"), true);
  assert.equal(houseFinish("CHAMPAGNE"), true);
  assert.equal(houseFinish("ivory"), false);
  assert.equal(activeStation("keen"), "keen");
  assert.equal(activeStation("azimuth"), "azimuth");
  assert.equal(activeStation("paris"), "all");
  assert.equal(activeArc("45"), "45");
  assert.equal(activeArc("9"), "all");
  assert.equal(activeLimb("vernier", ["circle", "vernier", "clamp"]), "vernier");
  assert.equal(activeLimb("presto", ["circle", "vernier", "clamp"]), "all");
  assert.equal(activeBead("8"), "8");
  assert.equal(activeBead("3"), "all");
  assert.equal(activeFinish("graphite"), "graphite");
  assert.equal(moveTheodoliteFocus(0, 4, -1), 3);

  const open = {
    id: "a",
    title: "Azimuth sight",
    note: "ridge",
    surveyor: "Nia",
    station: "azimuth",
    arc: 15,
    finish: "IVORY",
    limb: "circle",
    bead: 2,
    tags: [],
    clamped: false,
    benched: false,
    cased: false,
    flagged: false,
    audit: "save",
  };
  assert.equal(overdueCircle(open), true);
  assert.equal(overdueCircle({ ...open, clamped: true }), false);
  assert.equal(overdueCircle({ ...open, station: "zenith" }), false);
  assert.equal(lateCircle({ ...open, station: "zenith", bead: 2 }, "nadir"), true);
  assert.equal(lateCircle({ ...open, station: "zenith", bead: 2 }, "azimuth"), false);
  assert.equal(idleCircle({ ...open, station: "zenith", limb: "circle", bead: 2 }), true);
  assert.equal(briskCircle({ ...open, bead: 16, limb: "clamp", station: "nadir" }), true);
  assert.equal(restingCircle({ ...open, arc: 90, limb: "vernier", station: "nadir" }), true);
  assert.equal(suggestArc([], 5), 15);
  assert.equal(suggestArc([], 10), 45);
  assert.equal(suggestArc([], 18), 90);
  assert.equal(suggestArc([open], 18), 15);
  assert.equal(suggestStation(7), "zenith");
  assert.equal(suggestStation(9), "azimuth");
  assert.equal(suggestFinish([open]), "IVORY");
  assert.equal(fairSurveyor([open, { ...open, id: "b", title: "Other", surveyor: "Nia" }], "Ada,Nia"), "Ada");
  assert.equal(busiestSurveyor([open]), "Nia");

  let book = addCircle([], { id: "c1", title: "Ridge", surveyor: "Ada", station: "zenith", arc: 15, finish: "ivory", limb: "circle", bead: 2, note: "optional" });
  book = addCircle(book, { id: "c1", title: "Ridge again" });
  assert.equal(book.length, 1);
  book = widenArc(book, "c1");
  assert.equal(book[0].arc, 45);
  book = narrowArc(book, "c1");
  assert.equal(book[0].arc, 15);
  book = raiseBead(book, "c1");
  assert.equal(book[0].bead, 4);
  book = lowerBead(book, "c1");
  assert.equal(book[0].bead, 2);
  book = cycleLimb(book, "c1");
  assert.equal(book[0].limb, "vernier");
  book = bulkCircleClamp(book, ["c1"]);
  assert.equal(book[0].clamped, true);
  const views = addCircleView([], { id: "v1", name: "Field", tray: "field", station: "zenith", surveyor: "Ada" });
  assert.equal(readCircleViews(views)[0].station, "zenith");
  assert.equal(dropCircleView(views, "v1").length, 0);
  assert.match(circleCsv(book, "nadir"), /Ridge,Ada,zenith/);
  assert.equal(circleTimeline(book).some((lane) => lane.bead === 2), true);
  assert.equal(neighborBeadCount(book), 0);

  assert.equal(tierState("STANDARD"), "set");
  assert.equal(tierLane("STANDARD"), "nave");
  assert.equal(tierStamp("STANDARD"), "ST");
  assert.equal(tierHue("STANDARD"), "champagne");
  assert.equal(tierKnown("standard"), true);
  assert.equal(tierCap("STANDARD"), true);
  assert.equal(tierCap("standard"), false);
  assert.equal(tierLeap("STANDARD"), false);
  assert.equal(tierTail("STANDARD"), false);
  assert.equal(tierLane("VIP"), "loft");
  assert.equal(tierStamp("VIP"), "VI");
  assert.equal(tierHue("VIP"), "graphite");
  assert.equal(tierKnown("VIP"), true);
  assert.equal(tierLane("DEMO"), "closet");
  assert.equal(tierHue("DEMO"), "ivory");
  assert.equal(tierLeap("DEMO"), true);
  assert.equal(tierTail("DEMO"), true);
  assert.equal(tierLane("PRO"), "study");
  assert.equal(tierHue("PRO"), "champagne");
  assert.equal(tierKnown("PRO"), true);
  assert.equal(tierStep("PRO"), 3);
  assert.equal(tierWide("AT_RISK"), true);
  assert.equal(tierLane("AT_RISK"), "stile");
  assert.equal(tierKnown("AT_RISK"), false);
  assert.equal(tierNotch("AT-RISK"), true);
  assert.equal(tierSlash("A/B"), true);
  assert.equal(tierTwin("Book"), true);
  assert.equal(tierEcho("Radar"), true);
  assert.equal(tierState("12"), "clear");
  assert.equal(tierState(""), "clear");
  assert.equal(tierState({ accountType: "STANDARD", balance: 1 }), "");
  assert.equal(tierState({ title: "STANDARD" }), "");
  assert.equal(tierLane({ code: "VIP" }), "loft");

  const plates = [
    { id: "1", label: "Ada", note: "STANDARD" },
    { id: "2", label: "Bea", note: "VIP" },
    { id: "3", label: "Cal", note: "PRO" },
  ];
  assert.equal(leadingTier(plates), "nave");
  assert.match(tierLanesCsv(plates), /nave,1/);
  assert.match(tierRowsCsv(plates, ["1"]), /Ada,STANDARD,ST,nave,champagne/);
  assert.match(tierRowsCsv(plates, ["1"]), /Bea,VIP,VI,loft,graphite/);
  assert.match(tierRowsCsv(plates, ["1"]), /Cal,PRO,PR,study,champagne/);

  const keys = Object.keys(ROUND273_COPY.en);
  assert.ok(keys.length >= 150);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND273_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND273_COPY[locale][key as keyof typeof ROUND273_COPY.en], "string");
      assert.ok(ROUND273_COPY[locale][key as keyof typeof ROUND273_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "thdTitle"), ROUND273_COPY.tr.thdTitle);
  assert.equal(crmv4Text("de", "tirTitle"), ROUND273_COPY.de.tirTitle);
  assert.equal(crmv4Text("ru", "thdSub"), ROUND273_COPY.ru.thdSub);
  assert.equal(crmv4Text("ar", "tirSub"), ROUND273_COPY.ar.tirSub);
  assert.equal(crmv4Text("en", "thdLogo"), "7FX");
  assert.equal(crmv4Text("en", "thdTitle"), "Theodolite circles");
  assert.equal(crmv4Text("en", "tirTitle"), "Tier plates");
  assert.notEqual(ROUND273_COPY.tr.thdTitle, ROUND273_COPY.en.thdTitle);
  assert.equal(crmv4Text("en", "pndTitle"), "Pendulum bobs");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-theodolite/);
  assert.match(css, /\.c4-tier-index/);
  assert.match(css, /\.c4-theodolite-arc/);
  assert.match(css, /\.c4-tier-stake/);
  assert.match(css, /\.c4-dsk-atelier/);
  assert.match(css, /\.c4-grp-folio/);
  assert.match(css, /\.c4-ops-sextant/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round273.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /accountType:/);
  assert.match(viewFile, /circleCsv/);
  assert.match(viewFile, /tierRowsCsv/);
  assert.match(viewFile, /Escape/);
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
  assert.match(viewFile, /c4-tier-search/);
  assert.match(viewFile, /circleTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "thd"/);
  assert.match(app, /view === "tir"/);
  const ops = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Ops.tsx"), "utf8");
  assert.match(ops, /c4-dsk-atelier/);
  assert.match(ops, /c4-grp-folio/);
  assert.match(ops, /c4-ops-sextant/);
  assert.match(ops, /dskAtelierKicker/);
  assert.match(ops, /grpFolioKicker/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND273_COPY.en, key);
  const audit = viewFile.match(/"(thdAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND273_COPY.en, key);
  const opsUsed = new Set(ops.match(/v4\("([a-zA-Z]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(opsUsed)) {
    if (key.startsWith("dskAtelier") || key.startsWith("grpFolio") || key.startsWith("thd") || key.startsWith("tir")) assert.ok(key in ROUND273_COPY.en, key);
  }
  console.log("crmv4 round273 tests passed");
}

main();
