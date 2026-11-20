/**
 * Chronograph rules, timezone plates, the ivory tag lesche, and the graphite session megaron.
 * Run: TZ=UTC npx tsx tests/crmv4-round348.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND348_COPY } from "../src/lib/crmv4/copy-round348";
import {
  ROUND348_FEATURES,
  activeFinish,
  activeMode,
  activeHour,
  activeHammer,
  addChronograph,
  briskChronograph,
  dropChronographView,
  fairKeeper,
  timezoneHome,
  timezoneBrief,
  timezoneCapital,
  timezoneDigit,
  timezoneEven,
  timezoneFirst,
  timezoneGap,
  timezoneHue,
  timezoneJoin,
  timezoneCitizen,
  timezoneLane,
  timezoneLanesCsv,
  timezoneLength,
  timezoneLower,
  timezoneGuest,
  timezoneAway,
  timezoneOpen,
  timezonePlain,
  timezoneLong,
  timezoneRowsCsv,
  timezoneSoon,
  timezoneSpace,
  timezoneState,
  timezoneUpper,
  timezoneVowel,
  fullHammer,
  idleChronograph,
  lateChronograph,
  leadingTimezone,
  moveChronographFocus,
  chronographBand,
  chronographHour,
  chronographGap,
  chronographInner,
  chronographMode,
  chronographOuter,
  chronographHammer,
  chronographFilm,
  chronographTimeline,
  overdueChronograph,
  pairHammer,
  quietFinish,
  readChronographViews,
  reminderChronographs,
  restingChronograph,
  suggestFinish,
  suggestMode,
  suggestHour,
  type TimezoneRow,
  type Chronograph,
} from "../src/lib/crmv4/round348";

function rule(partial: Partial<Chronograph> & { id: string; title: string }): Chronograph {
  return {
    note: "",
    setter: "",
    piece: "",
    drop: null,
    film: "",
    lock: 6,
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
  assert.equal(ROUND348_FEATURES.length, 25);
  assert.equal(ROUND348_FEATURES.includes("timezone-plate"), true);
  assert.equal(ROUND348_FEATURES.includes("chronograph-pin-sla"), true);
  assert.equal(ROUND348_FEATURES.includes("fair-timekeeper"), true);
  assert.equal(ROUND348_FEATURES.includes("column-archive"), true);
  assert.equal(ROUND348_FEATURES.includes("column-reminders"), true);
  assert.equal(ROUND348_FEATURES.includes("chronograph-search"), true);
  assert.equal(ROUND348_FEATURES.includes("column-timeline"), true);
  assert.equal(chronographMode(" column "), "column");
  assert.equal(chronographMode("brass"), "");
  assert.equal(chronographHour("4"), 4);
  assert.equal(chronographHour(8), 8);
  assert.equal(chronographHour(12), 12);
  assert.equal(chronographHour(16), 16);
  assert.equal(chronographHour("6"), null);
  assert.equal(chronographHour("2"), null);
  assert.equal(chronographHammer("3"), 3);
  assert.equal(chronographHammer(6), 6);
  assert.equal(chronographHammer("12"), 12);
  assert.equal(chronographHammer("1"), null);
  assert.equal(chronographHammer("4"), null);
  assert.equal(chronographFilm("gilt"), "GILT");
  assert.equal(chronographFilm("ivory"), "IVORY");
  assert.equal(chronographFilm("graphite"), "GRAPHITE");
  assert.equal(chronographFilm("hot"), "");
  assert.equal(chronographInner("column"), true);
  assert.equal(chronographInner("CLUTCH"), true);
  assert.equal(chronographInner("heart"), false);
  assert.equal(chronographOuter("heart"), true);
  assert.equal(chronographOuter("brake"), true);
  assert.equal(chronographOuter("column"), false);
  assert.equal(chronographBand("column"), "pillar");
  assert.equal(chronographBand("clutch"), "mesh");
  assert.equal(chronographBand("heart"), "cam");
  assert.equal(chronographBand("brake"), "shoe");
  assert.equal(chronographGap("column", "brake"), 3);
  assert.equal(quietFinish("ivory"), true);
  assert.equal(quietFinish("gilt"), false);
  assert.equal(pairHammer(6), true);
  assert.equal(pairHammer(3), false);
  assert.equal(fullHammer(12), true);
  assert.equal(fullHammer(6), false);
  assert.equal(activeMode("inner"), "inner");
  assert.equal(activeHour("12"), "12");
  assert.equal(activeHour("5"), "all");
  assert.equal(activeHammer("12"), "12");
  assert.equal(activeHammer("1"), "all");
  assert.equal(activeFinish("gilt", ["GILT"]), "GILT");
  assert.equal(suggestMode(6), "column");
  assert.equal(suggestMode(14), "brake");
  assert.equal(suggestHour([], 4), 4);
  assert.equal(suggestHour([], 8), 8);
  assert.equal(suggestHour([], 14), 12);
  assert.equal(suggestHour([], 20), 16);
  assert.equal(suggestFinish([]), "IVORY");
  assert.equal(moveChronographFocus(0, 3, 1), 1);
  assert.equal(moveChronographFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", piece: "column" });
  const due = rule({ id: "b", title: "Bea", piece: "heart", lock: 3 });
  const quiet = rule({ id: "c", title: "Cara", drop: 4, lock: 3 });
  const cell = rule({ id: "d", title: "Dora", film: "GILT", drop: 16, lock: 12 });
  const fax = rule({ id: "e", title: "Eve", piece: "brake", film: "IVORY", drop: 8 });
  assert.equal(lateChronograph(late, "brake"), true);
  assert.equal(lateChronograph(late, "column"), false);
  assert.equal(overdueChronograph(due), true);
  assert.equal(idleChronograph(quiet), true);
  assert.equal(briskChronograph(cell), true);
  assert.equal(restingChronograph(fax), true);
  assert.deepEqual(reminderChronographs([due, late]), ["Bea"]);
  assert.equal(fairKeeper([rule({ id: "1", title: "One", setter: "Ada" }), rule({ id: "2", title: "Two", setter: "Bea" }), rule({ id: "3", title: "Three", setter: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", drop: 12 }), rule({ id: "2", title: "East", drop: 8 })];
  assert.match(chronographTimeline(cards).map((mail) => mail.drop).join(","), /12/);
  const saved = addChronograph([], { title: "Ada", piece: "clutch", drop: "8", film: "gilt", lock: "6", tags: "c h x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].piece, "clutch");
  assert.equal(saved[0].drop, 8);
  assert.equal(saved[0].lock, 6);
  assert.deepEqual(saved[0].tags, ["c", "h"]);
  assert.equal(addChronograph(saved, { title: "Ada" }).length, 1);
  assert.equal(addChronograph([], { title: "Eve" })[0].lock, 3);
  assert.equal(dropChronographView([{ id: "v", name: "Morning", tray: "board", query: "", setter: "", film: "all", piece: "all", drop: "all", lock: "all" }], "v").length, 0);
  assert.equal(readChronographViews([{ id: "v", name: "Morning", tray: "peg" }])[0].tray, "peg");

  const stamp = "2026-11-20T07:30:00.000Z";
  assert.equal(timezoneHome("utc"), true);
  assert.equal(timezoneHome("UTC"), true);
  assert.equal(timezoneAway("CET"), true);
  assert.equal(timezoneGuest("EET"), true);
  assert.equal(timezoneCitizen("TRT"), true);
  assert.equal(timezoneHome({ timezone: true }), true);
  assert.equal(timezonePlain({ timezone: false }), true);
  assert.equal(timezoneAway({ timezone: false }), false);
  assert.equal(timezonePlain({ timezone: "Letter" }), true);
  assert.equal(timezoneHome({ timezone: "Letter" }), false);
  assert.equal(timezoneBrief({ timezone: "GMT" }), true);
  assert.equal(timezoneJoin("Europe/Istanbul"), true);
  assert.equal(timezoneJoin("ANNA NOAH"), false);
  assert.equal(timezoneGap("US-East"), true);
  assert.equal(timezoneGap("LIVEHOLD"), false);
  assert.equal(timezoneBrief("GMT"), true);
  assert.equal(timezoneBrief("UTC"), false);
  assert.equal(timezoneLong("CentralStandardTZ"), true);
  assert.equal(timezoneLong(stamp), false);
  assert.equal(timezoneLane("UTC"), "utc");
  assert.equal(timezoneLane("Trt"), "trt");
  assert.equal(timezoneLane("Letter"), "plain");
  assert.equal(timezoneLane("20261120T0730Z"), "mark");
  assert.equal(timezoneLane("Europe"), "vowel");
  assert.equal(timezoneOpen(""), true);
  assert.equal(timezoneOpen({ timezone: "" }), true);
  assert.equal(timezoneState({ name: "Ada" }), "");
  assert.equal(timezoneState({ timezone: "Paris", balance: 1 }), "");
  assert.equal(timezoneHue("UTC"), "champagne");
  assert.equal(timezoneHue("Europe/Istanbul"), "graphite");
  assert.equal(timezoneHue("EET"), "champagne");
  assert.equal(timezoneSoon("ABCDE"), true);
  assert.equal(timezoneSoon("UTC"), false);
  assert.equal(timezoneSoon("Europe"), false);
  assert.equal(timezoneHue("Letter"), "ivory");
  assert.equal(timezoneLength("yes"), 3);
  assert.equal(timezoneEven("ab"), true);
  assert.equal(timezoneFirst("Paris"), true);
  assert.equal(timezoneSpace("needs review"), true);
  assert.equal(timezoneVowel("Amsterdam"), true);
  assert.equal(timezoneDigit("Room4"), true);
  assert.equal(timezoneCapital("PARIS"), true);
  assert.equal(timezoneLower("paris"), true);
  assert.equal(timezoneUpper("BERLIN"), true);
  assert.equal(timezoneUpper("CET"), false);
  assert.equal(timezoneUpper("UTC"), false);
  const marks: TimezoneRow[] = [
    { id: "1", label: "Ada", code: "UTC" },
    { id: "2", label: "Bea", code: "UTC" },
    { id: "3", label: "Cara", code: "Madrid" },
  ];
  assert.equal(leadingTimezone(marks), "utc");
  assert.match(timezoneLanesCsv(marks), /utc,2/);
  assert.match(timezoneRowsCsv(marks, ["1"]), /Ada,UTC/);
  assert.equal(crmv4Text("tr", "chgTitle"), ROUND348_COPY.tr.chgTitle);
  assert.equal(crmv4Text("de", "tznTitle"), ROUND348_COPY.de.tznTitle);
  assert.equal(crmv4Text("ru", "plLescheKicker"), ROUND348_COPY.ru.plLescheKicker);
  assert.equal(crmv4Text("ar", "syMegaronLead"), ROUND348_COPY.ar.syMegaronLead);
  const keys = Object.keys(ROUND348_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND348_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-chronograph/);
  assert.match(css, /\.c4-tznplate/);
  assert.match(css, /\.c4-chronograph-column/);
  assert.match(css, /\.c4-tznplate-column/);
  assert.match(css, /\.c4-tag-lesche/);
  assert.match(css, /\.c4-session-megaron/);
  assert.match(css, /\.c4-pl-lesche-mast/);
  assert.match(css, /\.c4-sy-megaron-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round348.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /timezone:/);
  assert.match(viewFile, /chronographCsv/);
  assert.match(viewFile, /timezoneRowsCsv/);
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
  assert.match(viewFile, /c4-tznplate-search/);
  assert.match(viewFile, /chronographTimeline/);
  assert.match(viewFile, /c4-chronograph-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "chg"/);
  assert.match(app, /view === "tzn"/);
  const palette = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round93.tsx"), "utf8");
  const note = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round95.tsx"), "utf8");
  const host = `${palette}\n${note}`;
  assert.match(host, /c4-tag-lesche/);
  assert.match(host, /c4-pl-lesche-mast/);
  assert.match(host, /data-logo="mono"/);
  assert.match(host, /plLescheKicker/);
  assert.match(host, /plLescheLead/);
  assert.match(host, /data-tag-palette/);
  assert.equal(palette.includes("amount"), false);
  assert.match(host, /c4-session-megaron/);
  assert.match(host, /c4-sy-megaron-mast/);
  assert.match(host, /syMegaronKicker/);
  assert.match(host, /syMegaronLead/);
  assert.match(host, /data-session-note/);
  assert.equal(note.includes("currency"), false);
  assert.equal(note.includes("profit"), false);
  const namedKeys = `${viewFile}\n${host}`.match(/"(chg|tzn|plLesche|syMegaron)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND348_COPY.en[key as keyof typeof ROUND348_COPY.en], "string", key);
  console.log("crmv4 round348 tests passed");
}

main();
