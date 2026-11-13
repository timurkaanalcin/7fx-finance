/**
 * Barometer tubes and surname plates.
 * Run: TZ=UTC npx tsx tests/crmv4-round268.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND268_COPY } from "../src/lib/crmv4/copy-round268";
import {
  ROUND268_FEATURES,
  activeLimb,
  activeBarometerSpan,
  activeMotion,
  activeInk,
  activeBarometerMark,
  addBarometer,
  addBarometerView,
  briskTube,
  bulkBarometerPin,
  busiestBarometerKeeper,
  barometerCsv,
  barometerMark,
  barometerTimeline,
  barometerSpan,
  limbBand,
  limbGap,
  limbOf,
  cycleMotion,
  dropBarometerView,
  fairBarometerKeeper,
  inkOf,
  houseInk,
  idleTube,
  lateTube,
  leadingSurname,
  lengthenBarometer,
  lowerBarometer,
  moveBarometerFocus,
  neighborBarometerCount,
  overdueTube,
  peakLimb,
  quietLimb,
  raiseBarometer,
  readBarometerViews,
  restingTube,
  shortenBarometer,
  suggestBarometerSpan,
  suggestLimb,
  suggestInk,
  motionOf,
  surnameCap,
  surnameEcho,
  surnameHue,
  surnameKnown,
  surnameLane,
  surnameLanesCsv,
  surnameLeap,
  surnameNotch,
  surnameRowsCsv,
  surnameSlash,
  surnameStamp,
  surnameState,
  surnameStep,
  surnameTail,
  surnameTwin,
  surnameWide,
} from "../src/lib/crmv4/round268";

function main() {
  assert.equal(ROUND268_FEATURES.length, 25);
  assert.equal(limbOf(" stem "), "stem");
  assert.equal(limbOf("paris"), "");
  assert.equal(barometerSpan("12"), 12);
  assert.equal(barometerSpan(24), 24);
  assert.equal(barometerSpan("48"), 48);
  assert.equal(barometerSpan("15"), null);
  assert.equal(barometerMark("1"), 1);
  assert.equal(barometerMark(3), 3);
  assert.equal(barometerMark("5"), 5);
  assert.equal(barometerMark("7"), 7);
  assert.equal(barometerMark("2"), null);
  assert.equal(barometerMark("4"), null);
  assert.equal(inkOf("ivory"), "IVORY");
  assert.equal(inkOf("graphite"), "GRAPHITE");
  assert.equal(inkOf("champagne"), "CHAMPAGNE");
  assert.equal(inkOf("brass"), "");
  assert.equal(motionOf("rise"), "rise");
  assert.equal(motionOf("still"), "still");
  assert.equal(motionOf("fall"), "fall");
  assert.equal(motionOf("lift"), "");
  assert.equal(peakLimb("stem"), true);
  assert.equal(peakLimb("SCALE"), true);
  assert.equal(peakLimb("bowl"), false);
  assert.equal(quietLimb("bowl"), true);
  assert.equal(quietLimb("cistern"), true);
  assert.equal(quietLimb("stem"), false);
  assert.equal(limbBand("stem"), "early");
  assert.equal(limbBand("bowl"), "early");
  assert.equal(limbBand("scale"), "mid");
  assert.equal(limbBand("cistern"), "late");
  assert.equal(limbBand(""), "");
  assert.equal(limbGap("stem", "bowl"), 1);
  assert.equal(limbGap("bowl", "stem"), -1);
  assert.equal(limbGap("", "stem"), null);
  assert.equal(houseInk("ivory"), true);
  assert.equal(houseInk("CHAMPAGNE"), true);
  assert.equal(houseInk("graphite"), false);
  assert.equal(activeLimb("peak"), "peak");
  assert.equal(activeLimb("stem"), "stem");
  assert.equal(activeLimb("paris"), "all");
  assert.equal(activeBarometerSpan("24"), "24");
  assert.equal(activeBarometerSpan("9"), "all");
  assert.equal(activeMotion("still", ["rise", "still", "fall"]), "still");
  assert.equal(activeMotion("gale", ["rise", "still", "fall"]), "all");
  assert.equal(activeBarometerMark("3"), "3");
  assert.equal(activeBarometerMark("2"), "all");
  assert.equal(activeInk("graphite"), "graphite");
  assert.equal(activeInk("brass"), "all");
  assert.equal(moveBarometerFocus(0, 3, 1), 1);
  assert.equal(moveBarometerFocus(0, 3, -1), 2);
  assert.equal(suggestInk([]), "IVORY");
  assert.equal(suggestBarometerSpan([], 4), 12);
  assert.equal(suggestBarometerSpan([], 8), 24);
  assert.equal(suggestBarometerSpan([], 16), 48);
  assert.equal(suggestLimb(4), "stem");
  assert.equal(suggestLimb(12), "scale");
  assert.equal(fairBarometerKeeper([], "Nia, Sol"), "Nia");

  const first = addBarometer([], {
    id: "a",
    title: "  North tube ",
    note: "",
    weaver: "Nia",
    frame: "stem",
    dye: "ivory",
    shuttle: "rise",
    wait: 12,
    rank: 1,
    tags: "a a b",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North tube");
  assert.equal(first[0].note, "");
  assert.equal(first[0].dye, "IVORY");
  assert.equal(first[0].tags.join(""), "ab");
  assert.equal(first[0].audit, "save");
  assert.equal(overdueTube(first[0]), true);
  assert.equal(addBarometer(first, { id: "a", title: "Other" }).length, 1);
  assert.equal(addBarometer(first, { id: "b", title: "North tube" }).length, 1);
  assert.equal(addBarometer(first, { id: "b", title: "   " }).length, 1);
  assert.equal(addBarometer([], { id: "d", title: "Bare" })[0].rank, 1);

  const pinned = bulkBarometerPin(first, ["a"]);
  assert.equal(overdueTube(pinned[0]), false);
  assert.equal(fairBarometerKeeper(pinned, "Nia, Sol"), "Nia");
  const quiet = addBarometer(pinned, { id: "q", title: "Bowl rest", weaver: "Sol", frame: "bowl", shuttle: "rise", rank: 1 });
  assert.equal(idleTube(quiet[0]), true);
  assert.equal(lateTube(quiet[0], "cistern"), false);
  const behind = addBarometer([], { id: "z", title: "Stem late", frame: "stem", rank: 1 });
  assert.equal(lateTube(behind[0], "cistern"), true);
  assert.equal(lateTube({ ...behind[0], rank: 7 }, "cistern"), false);
  const rushed = addBarometer([], { id: "r", title: "Stem spark", frame: "stem", shuttle: "still", rank: 7 });
  assert.equal(briskTube(rushed[0]), true);
  const rested = addBarometer([], { id: "s", title: "Cistern fall", frame: "cistern", shuttle: "fall", wait: 48 });
  assert.equal(restingTube(rested[0]), true);
  assert.equal(lengthenBarometer(rested, "s")[0].wait, 48);
  assert.equal(lengthenBarometer([{ ...rested[0], wait: null }], "s")[0].wait, 12);
  assert.equal(lengthenBarometer(first, "a")[0].wait, 24);
  assert.equal(shortenBarometer(first, "a")[0].wait, 12);
  assert.equal(shortenBarometer([{ ...first[0], wait: null }], "a")[0].wait, 48);
  assert.equal(cycleMotion(first, "a")[0].shuttle, "still");
  assert.equal(raiseBarometer(first, "a")[0].rank, 3);
  assert.equal(lowerBarometer(first, "a")[0].rank, 1);
  assert.equal(lowerBarometer([{ ...first[0], rank: 7 }], "a")[0].rank, 5);
  assert.equal(busiestBarometerKeeper(quiet), "Sol");
  assert.equal(neighborBarometerCount(quiet) >= 0, true);
  assert.match(barometerCsv(first, "cistern"), /North tube/);
  assert.match(barometerTimeline(first).map((lane) => lane.rank).join(","), /1/);

  const inkBook = addBarometer(addBarometer([], { id: "y1", title: "Graph one", dye: "graphite", frame: "bowl" }), { id: "y2", title: "Graph two", dye: "graphite", frame: "stem" });
  assert.equal(suggestInk(inkBook), "GRAPHITE");
  assert.equal(suggestBarometerSpan(rested, 4), 48);

  const views = addBarometerView([], { id: "v", name: "Peak", tray: "open", frame: "peak", wait: "12", dye: "ivory", shuttle: "rise", rank: "1" });
  assert.equal(views[0].frame, "peak");
  assert.equal(dropBarometerView(views, "v").length, 0);
  assert.equal(readBarometerViews([{ id: "v", name: "Peak", tray: "nope" }])[0].tray, "open");

  assert.equal(surnameState("Ross"), "set");
  assert.equal(surnameLane("Ross"), "hall");
  assert.equal(surnameStamp("Ross"), "RO");
  assert.equal(surnameHue("Ross"), "champagne");
  assert.equal(surnameStep("Ross"), 4);
  assert.equal(surnameLeap("Ross"), false);
  assert.equal(surnameKnown("Ross"), true);
  assert.equal(surnameTwin("Ross"), true);
  assert.equal(surnameLane("Vale"), "porch");
  assert.equal(surnameStamp("Vale"), "VA");
  assert.equal(surnameHue("Vale"), "graphite");
  assert.equal(surnameKnown("vale"), true);
  assert.equal(surnameLeap("Vale"), false);
  assert.equal(surnameTail("Vale"), true);
  assert.equal(surnameLane("Maria"), "stair");
  assert.equal(surnameStamp("Maria"), "MA");
  assert.equal(surnameHue("Maria"), "ivory");
  assert.equal(surnameKnown("Maria"), false);
  assert.equal(surnameLeap("Maria"), true);
  assert.equal(surnameLeap("Marian"), false);
  assert.equal(surnameNotch("Mary-Ann"), true);
  assert.equal(surnameLane("Mary-Ann"), "gate");
  assert.equal(surnameSlash("A/B"), true);
  assert.equal(surnameLane("A/B"), "gate");
  assert.equal(surnameWide("Ann_Marie"), true);
  assert.equal(surnameTwin("Book"), true);
  assert.equal(surnameEcho("Radar"), true);
  assert.equal(surnameCap("Ross"), true);
  assert.equal(surnameCap("ross"), false);
  assert.equal(surnameLane("ross"), "hall");
  assert.equal(surnameState("12"), "clear");
  assert.equal(surnameState(""), "clear");
  assert.equal(surnameState({ lastName: "Ross", balance: 1 }), "");
  assert.equal(surnameState({ title: "Ross" }), "");
  assert.equal(surnameLane({ name: "Vale" }), "porch");

  const book = [
    { id: "1", label: "Ross", note: "Ross" },
    { id: "2", label: "Vale", note: "Vale" },
    { id: "3", label: "Maria", note: "Maria" },
  ];
  assert.equal(leadingSurname(book), "hall");
  assert.match(surnameLanesCsv(book), /hall,1/);
  assert.match(surnameRowsCsv(book, ["1"]), /Ross,Ross,RO,hall,champagne/);
  assert.match(surnameRowsCsv(book, ["1"]), /Vale,VA,porch,graphite/);
  assert.match(surnameRowsCsv(book, ["1"]), /Maria,MA,stair,ivory/);

  const keys = Object.keys(ROUND268_COPY.en);
  assert.ok(keys.length >= 150);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND268_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND268_COPY[locale][key as keyof typeof ROUND268_COPY.en], "string");
      assert.ok(ROUND268_COPY[locale][key as keyof typeof ROUND268_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "bmtTitle"), ROUND268_COPY.tr.bmtTitle);
  assert.equal(crmv4Text("de", "snmTitle"), ROUND268_COPY.de.snmTitle);
  assert.equal(crmv4Text("ru", "bmtSub"), ROUND268_COPY.ru.bmtSub);
  assert.equal(crmv4Text("ar", "snmSub"), ROUND268_COPY.ar.snmSub);
  assert.equal(crmv4Text("en", "bmtLogo"), "7FX");
  assert.equal(crmv4Text("en", "bmtTitle"), "Barometer tubes");
  assert.notEqual(ROUND268_COPY.tr.bmtTitle, ROUND268_COPY.en.bmtTitle);
  assert.equal(crmv4Text("en", "sxtTitle"), "Sextant sights");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-barometer/);
  assert.match(css, /\.c4-surname-index/);
  assert.match(css, /\.c4-barometer-ledger|\.c4-barometer-board/);
  assert.match(css, /\.c4-surname-bar/);
  assert.match(css, /\.c4-shift-oriel/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round268.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /lastName:/);
  assert.match(viewFile, /barometerCsv/);
  assert.match(viewFile, /surnameRowsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "r"/);
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
  assert.match(viewFile, /suggestInk/);
  assert.match(viewFile, /c4-surname-search/);
  assert.match(viewFile, /barometerTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "bmt"/);
  assert.match(app, /view === "snm"/);
  const shift = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round75.tsx"), "utf8");
  assert.match(shift, /c4-shift-oriel/);
  assert.match(shift, /bmtShiftLead/);
  assert.match(shift, /data-desk="oriel"/);
  assert.match(shift, /data-logo="mono"/);
  assert.equal(shift.includes("amount"), false);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND268_COPY.en, key);
  const audit = viewFile.match(/"(bmtAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND268_COPY.en, key);
  const shiftUsed = new Set(shift.match(/v4\("([a-zA-Z]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(shiftUsed)) {
    if (key.startsWith("bmt") || key.startsWith("snm")) assert.ok(key in ROUND268_COPY.en, key);
  }
  console.log("crmv4 round268 tests passed");
}

main();
