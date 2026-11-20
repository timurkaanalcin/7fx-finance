/**
 * Pulsometer rules, invalid-mark plates, the ivory pin opisthodomos, and the graphite jump stylobate.
 * Run: TZ=UTC npx tsx tests/crmv4-round350.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND350_COPY } from "../src/lib/crmv4/copy-round350";
import {
  ROUND350_FEATURES,
  activeFinish,
  activeMode,
  activeHour,
  activeHammer,
  addPulsometer,
  briskPulsometer,
  dropPulsometerView,
  fairKeeper,
  markHome,
  markBrief,
  markCapital,
  markDigit,
  markEven,
  markFirst,
  markGap,
  markHue,
  markJoin,
  markCitizen,
  markLane,
  markLanesCsv,
  markLength,
  markLower,
  markGuest,
  markAway,
  markOpen,
  markPlain,
  markLong,
  markRowsCsv,
  markSoon,
  markSpace,
  markState,
  markUpper,
  markVowel,
  fullHammer,
  idlePulsometer,
  latePulsometer,
  leadingMark,
  movePulsometerFocus,
  pulsometerBand,
  pulsometerHour,
  pulsometerGap,
  pulsometerInner,
  pulsometerMode,
  pulsometerOuter,
  pulsometerHammer,
  pulsometerFilm,
  pulsometerTimeline,
  overduePulsometer,
  pairHammer,
  quietFinish,
  readPulsometerViews,
  reminderPulsometers,
  restingPulsometer,
  suggestFinish,
  suggestMode,
  suggestHour,
  type MarkRow,
  type Pulsometer,
} from "../src/lib/crmv4/round350";

function rule(partial: Partial<Pulsometer> & { id: string; title: string }): Pulsometer {
  return {
    note: "",
    setter: "",
    piece: "",
    drop: null,
    film: "",
    lock: 4,
    tags: [],
    raised: false,
    pinned: false,
    coffered: false,
    starred: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND350_FEATURES.length, 25);
  assert.equal(ROUND350_FEATURES.includes("mark-plate"), true);
  assert.equal(ROUND350_FEATURES.includes("pulsometer-pin-sla"), true);
  assert.equal(ROUND350_FEATURES.includes("quiet-keeper"), true);
  assert.equal(ROUND350_FEATURES.includes("beat-archive"), true);
  assert.equal(ROUND350_FEATURES.includes("beat-reminders"), true);
  assert.equal(ROUND350_FEATURES.includes("pulsometer-search"), true);
  assert.equal(ROUND350_FEATURES.includes("beat-timeline"), true);
  assert.equal(pulsometerMode(" beat "), "beat");
  assert.equal(pulsometerMode("brass"), "");
  assert.equal(pulsometerHour("4"), 4);
  assert.equal(pulsometerHour(8), 8);
  assert.equal(pulsometerHour(16), 16);
  assert.equal(pulsometerHour(32), 32);
  assert.equal(pulsometerHour("5"), null);
  assert.equal(pulsometerHour("2"), null);
  assert.equal(pulsometerHammer("3"), 3);
  assert.equal(pulsometerHammer(6), 6);
  assert.equal(pulsometerHammer("9"), 9);
  assert.equal(pulsometerHammer("2"), null);
  assert.equal(pulsometerHammer("4"), null);
  assert.equal(pulsometerFilm("gilt"), "GILT");
  assert.equal(pulsometerFilm("ivory"), "IVORY");
  assert.equal(pulsometerFilm("graphite"), "GRAPHITE");
  assert.equal(pulsometerFilm("hot"), "");
  assert.equal(pulsometerInner("beat"), true);
  assert.equal(pulsometerInner("COUNT"), true);
  assert.equal(pulsometerInner("rest"), false);
  assert.equal(pulsometerOuter("rest"), true);
  assert.equal(pulsometerOuter("sprint"), true);
  assert.equal(pulsometerOuter("beat"), false);
  assert.equal(pulsometerBand("beat"), "wrist");
  assert.equal(pulsometerBand("count"), "tally");
  assert.equal(pulsometerBand("rest"), "pause");
  assert.equal(pulsometerBand("sprint"), "dash");
  assert.equal(pulsometerGap("beat", "sprint"), 3);
  assert.equal(quietFinish("ivory"), true);
  assert.equal(quietFinish("gilt"), false);
  assert.equal(pairHammer(6), true);
  assert.equal(pairHammer(3), false);
  assert.equal(fullHammer(9), true);
  assert.equal(fullHammer(6), false);
  assert.equal(activeMode("inner"), "inner");
  assert.equal(activeHour("16"), "16");
  assert.equal(activeHour("5"), "all");
  assert.equal(activeHammer("9"), "9");
  assert.equal(activeHammer("2"), "all");
  assert.equal(activeFinish("gilt", ["GILT"]), "GILT");
  assert.equal(suggestMode(6), "beat");
  assert.equal(suggestMode(14), "sprint");
  assert.equal(suggestHour([], 3), 4);
  assert.equal(suggestHour([], 8), 8);
  assert.equal(suggestHour([], 14), 16);
  assert.equal(suggestHour([], 20), 32);
  assert.equal(suggestFinish([]), "IVORY");
  assert.equal(movePulsometerFocus(0, 3, 1), 1);
  assert.equal(movePulsometerFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", piece: "beat" });
  const due = rule({ id: "b", title: "Bea", piece: "rest", lock: 3 });
  const quiet = rule({ id: "c", title: "Cara", drop: 4, lock: 3 });
  const cell = rule({ id: "d", title: "Dora", film: "GILT", drop: 32, lock: 9 });
  const fax = rule({ id: "e", title: "Eve", piece: "sprint", film: "IVORY", drop: 8 });
  assert.equal(latePulsometer(late, "sprint"), true);
  assert.equal(latePulsometer(late, "beat"), false);
  assert.equal(overduePulsometer(due), true);
  assert.equal(idlePulsometer(quiet), true);
  assert.equal(briskPulsometer(cell), true);
  assert.equal(restingPulsometer(fax), true);
  assert.deepEqual(reminderPulsometers([due, late]), ["Bea"]);
  assert.equal(fairKeeper([rule({ id: "1", title: "One", setter: "Ada" }), rule({ id: "2", title: "Two", setter: "Bea" }), rule({ id: "3", title: "Three", setter: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", drop: 16 }), rule({ id: "2", title: "East", drop: 8 })];
  assert.match(pulsometerTimeline(cards).map((mail) => mail.drop).join(","), /16/);
  const saved = addPulsometer([], { title: "Ada", piece: "count", drop: "8", film: "gilt", lock: "6", tags: "b r x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].piece, "count");
  assert.equal(saved[0].drop, 8);
  assert.equal(saved[0].lock, 6);
  assert.deepEqual(saved[0].tags, ["b", "r"]);
  assert.equal(addPulsometer(saved, { title: "Ada" }).length, 1);
  assert.equal(addPulsometer([], { title: "Eve" })[0].lock, 3);
  assert.equal(dropPulsometerView([{ id: "v", name: "Morning", tray: "board", query: "", setter: "", film: "all", piece: "all", drop: "all", lock: "all" }], "v").length, 0);
  assert.equal(readPulsometerViews([{ id: "v", name: "Morning", tray: "peg" }])[0].tray, "peg");

  const stamp = "2026-11-20T07:30:00.000Z";
  assert.equal(markHome("geo"), true);
  assert.equal(markHome("GEO"), true);
  assert.equal(markHome("INV_WRONG_GEO"), true);
  assert.equal(markAway("DUPE"), true);
  assert.equal(markAway("INV_DUPLICATE"), true);
  assert.equal(markGuest("TRASH"), true);
  assert.equal(markGuest("INV_TRASH"), true);
  assert.equal(markCitizen("AGE"), true);
  assert.equal(markCitizen("INV_UNDERAGE"), true);
  assert.equal(markHome({ leadInvalidReason: true }), true);
  assert.equal(markPlain({ leadInvalidReason: false }), true);
  assert.equal(markAway({ leadInvalidReason: false }), false);
  assert.equal(markPlain({ leadInvalidReason: "Letter" }), true);
  assert.equal(markHome({ leadInvalidReason: "Letter" }), false);
  assert.equal(markBrief({ leadInvalidReason: "ABCD" }), true);
  assert.equal(markJoin("Desk/West"), true);
  assert.equal(markJoin("ANNA NOAH"), false);
  assert.equal(markGap("US-East"), true);
  assert.equal(markGap("LIVEHOLD"), false);
  assert.equal(markBrief("ABCD"), true);
  assert.equal(markBrief("GEO"), false);
  assert.equal(markLong("TwelveCharsX"), true);
  assert.equal(markLong(stamp), false);
  assert.equal(markLane("GEO"), "geo");
  assert.equal(markLane("INV_WRONG_GEO"), "geo");
  assert.equal(markLane("Age"), "age");
  assert.equal(markLane("Letter"), "plain");
  assert.equal(markLane("20261120T0730Z"), "mark");
  assert.equal(markLane("Europe"), "vowel");
  assert.equal(markOpen(""), true);
  assert.equal(markOpen({ leadInvalidReason: "" }), true);
  assert.equal(markState({ name: "Ada" }), "");
  assert.equal(markState({ leadInvalidReason: "Paris", balance: 1 }), "");
  assert.equal(markHue("GEO"), "champagne");
  assert.equal(markHue("Desk/West"), "graphite");
  assert.equal(markHue("TRASH"), "champagne");
  assert.equal(markSoon("ABCDEFG"), true);
  assert.equal(markSoon("GEO"), false);
  assert.equal(markSoon("Europe"), false);
  assert.equal(markHue("Letter"), "ivory");
  assert.equal(markLength("yes"), 3);
  assert.equal(markEven("ab"), true);
  assert.equal(markFirst("Paris"), true);
  assert.equal(markSpace("needs review"), true);
  assert.equal(markVowel("Amsterdam"), true);
  assert.equal(markDigit("Room4"), true);
  assert.equal(markCapital("PARIS"), true);
  assert.equal(markLower("paris"), true);
  assert.equal(markUpper("BERLIN"), true);
  assert.equal(markUpper("PARIS"), false);
  assert.equal(markUpper("GEO"), false);
  const marks: MarkRow[] = [
    { id: "1", label: "Ada", code: "GEO" },
    { id: "2", label: "Bea", code: "GEO" },
    { id: "3", label: "Cara", code: "Madrid" },
  ];
  assert.equal(leadingMark(marks), "geo");
  assert.match(markLanesCsv(marks), /geo,2/);
  assert.match(markRowsCsv(marks, ["1"]), /Ada,GEO/);
  assert.equal(crmv4Text("tr", "plsTitle"), ROUND350_COPY.tr.plsTitle);
  assert.equal(crmv4Text("de", "mrkTitle"), ROUND350_COPY.de.mrkTitle);
  assert.equal(crmv4Text("ru", "rlOpisthodomosKicker"), ROUND350_COPY.ru.rlOpisthodomosKicker);
  assert.equal(crmv4Text("ar", "jvStylobateLead"), ROUND350_COPY.ar.jvStylobateLead);
  const keys = Object.keys(ROUND350_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND350_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-pulsometer/);
  assert.match(css, /\.c4-mrkplate/);
  assert.match(css, /\.c4-pulsometer-column/);
  assert.match(css, /\.c4-mrkplate-column/);
  assert.match(css, /\.c4-pin-opisthodomos/);
  assert.match(css, /\.c4-jump-stylobate/);
  assert.match(css, /\.c4-rl-opisthodomos-mast/);
  assert.match(css, /\.c4-jv-stylobate-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round350.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /leadInvalidReason:/);
  assert.match(viewFile, /pulsometerCsv/);
  assert.match(viewFile, /markRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestFinish/);
  assert.match(viewFile, /c4-mrkplate-search/);
  assert.match(viewFile, /pulsometerTimeline/);
  assert.match(viewFile, /c4-pulsometer-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "pls"/);
  assert.match(app, /view === "mrk"/);
  const rail = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round96.tsx"), "utf8");
  const jumps = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round98.tsx"), "utf8");
  const host = `${rail}\n${jumps}`;
  assert.match(host, /c4-pin-opisthodomos/);
  assert.match(host, /c4-rl-opisthodomos-mast/);
  assert.match(host, /data-logo="mono"/);
  assert.match(host, /rlOpisthodomosKicker/);
  assert.match(host, /rlOpisthodomosLead/);
  assert.match(host, /data-pin-rail/);
  const opisthodomos = rail.slice(rail.indexOf("export function PinRail"), rail.indexOf("export function DepStatusGlance"));
  assert.equal(opisthodomos.includes("amount"), false);
  assert.equal(opisthodomos.includes("balance"), false);
  assert.match(host, /c4-jump-stylobate/);
  assert.match(host, /c4-jv-stylobate-mast/);
  assert.match(host, /jvStylobateKicker/);
  assert.match(host, /jvStylobateLead/);
  assert.match(host, /data-recent-jumps/);
  assert.equal(jumps.includes("currency"), false);
  assert.equal(jumps.includes("profit"), false);
  const namedKeys = `${viewFile}\n${host}`.match(/"(pls|mrk|rlOpisthodomos|jvStylobate)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND350_COPY.en[key as keyof typeof ROUND350_COPY.en], "string", key);
  console.log("crmv4 round350 tests passed");
}

main();
