/**
 * Rehaut rules, first-trade plates, the ivory mute telesterion, and the graphite word skene.
 * Run: TZ=UTC npx tsx tests/crmv4-round351.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND351_COPY } from "../src/lib/crmv4/copy-round351";
import {
  ROUND351_FEATURES,
  activeFinish,
  activeMode,
  activeHour,
  activeHammer,
  addRehaut,
  briskRehaut,
  dropRehautView,
  fairKeeper,
  fdpHome,
  fdpBrief,
  fdpCapital,
  fdpDigit,
  fdpEven,
  fdpFirst,
  fdpGap,
  fdpHue,
  fdpJoin,
  fdpCitizen,
  fdpLane,
  fdpLanesCsv,
  fdpLength,
  fdpLower,
  fdpGuest,
  fdpAway,
  fdpOpen,
  fdpPlain,
  fdpLong,
  fdpRowsCsv,
  fdpSoon,
  fdpSpace,
  fdpState,
  fdpUpper,
  fdpVowel,
  fullHammer,
  idleRehaut,
  lateRehaut,
  leadingFdp,
  moveRehautFocus,
  rehautBand,
  rehautHour,
  rehautGap,
  rehautInner,
  rehautMode,
  rehautOuter,
  rehautHammer,
  rehautFilm,
  rehautTimeline,
  overdueRehaut,
  pairHammer,
  quietFinish,
  readRehautViews,
  reminderRehauts,
  restingRehaut,
  suggestFinish,
  suggestMode,
  suggestHour,
  type FdpRow,
  type Rehaut,
} from "../src/lib/crmv4/round351";

function rule(partial: Partial<Rehaut> & { id: string; title: string }): Rehaut {
  return {
    note: "",
    setter: "",
    piece: "",
    drop: null,
    film: "",
    lock: 2,
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
  assert.equal(ROUND351_FEATURES.length, 25);
  assert.equal(ROUND351_FEATURES.includes("first-trade-plate"), true);
  assert.equal(ROUND351_FEATURES.includes("rehaut-pin-sla"), true);
  assert.equal(ROUND351_FEATURES.includes("quiet-keeper"), true);
  assert.equal(ROUND351_FEATURES.includes("ring-archive"), true);
  assert.equal(ROUND351_FEATURES.includes("ring-reminders"), true);
  assert.equal(ROUND351_FEATURES.includes("rehaut-search"), true);
  assert.equal(ROUND351_FEATURES.includes("ring-timeline"), true);
  assert.equal(rehautMode(" chapter "), "chapter");
  assert.equal(rehautMode("brass"), "");
  assert.equal(rehautHour("5"), 5);
  assert.equal(rehautHour(10), 10);
  assert.equal(rehautHour(20), 20);
  assert.equal(rehautHour(40), 40);
  assert.equal(rehautHour("4"), null);
  assert.equal(rehautHour("8"), null);
  assert.equal(rehautHammer("2"), 2);
  assert.equal(rehautHammer(4), 4);
  assert.equal(rehautHammer("8"), 8);
  assert.equal(rehautHammer("3"), null);
  assert.equal(rehautHammer("6"), null);
  assert.equal(rehautFilm("gilt"), "GILT");
  assert.equal(rehautFilm("ivory"), "IVORY");
  assert.equal(rehautFilm("graphite"), "GRAPHITE");
  assert.equal(rehautFilm("hot"), "");
  assert.equal(rehautInner("chapter"), true);
  assert.equal(rehautInner("MINUTE"), true);
  assert.equal(rehautInner("railroad"), false);
  assert.equal(rehautOuter("railroad"), true);
  assert.equal(rehautOuter("pulse"), true);
  assert.equal(rehautOuter("chapter"), false);
  assert.equal(rehautBand("chapter"), "ring");
  assert.equal(rehautBand("minute"), "tick");
  assert.equal(rehautBand("railroad"), "rail");
  assert.equal(rehautBand("pulse"), "beat");
  assert.equal(rehautGap("chapter", "pulse"), 3);
  assert.equal(quietFinish("ivory"), true);
  assert.equal(quietFinish("gilt"), false);
  assert.equal(pairHammer(4), true);
  assert.equal(pairHammer(2), false);
  assert.equal(fullHammer(8), true);
  assert.equal(fullHammer(4), false);
  assert.equal(activeMode("inner"), "inner");
  assert.equal(activeHour("20"), "20");
  assert.equal(activeHour("7"), "all");
  assert.equal(activeHammer("8"), "8");
  assert.equal(activeHammer("3"), "all");
  assert.equal(activeFinish("gilt", ["GILT"]), "GILT");
  assert.equal(suggestMode(4), "chapter");
  assert.equal(suggestMode(10), "pulse");
  assert.equal(suggestHour([], 3), 5);
  assert.equal(suggestHour([], 8), 10);
  assert.equal(suggestHour([], 14), 20);
  assert.equal(suggestHour([], 20), 40);
  assert.equal(suggestFinish([]), "IVORY");
  assert.equal(moveRehautFocus(0, 3, 1), 1);
  assert.equal(moveRehautFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", piece: "chapter" });
  const due = rule({ id: "b", title: "Bea", piece: "railroad", lock: 2 });
  const quiet = rule({ id: "c", title: "Cara", drop: 5, lock: 2 });
  const cell = rule({ id: "d", title: "Dora", film: "GILT", drop: 40, lock: 8 });
  const fax = rule({ id: "e", title: "Eve", piece: "pulse", film: "IVORY", drop: 10 });
  assert.equal(lateRehaut(late, "pulse"), true);
  assert.equal(lateRehaut(late, "chapter"), false);
  assert.equal(overdueRehaut(due), true);
  assert.equal(idleRehaut(quiet), true);
  assert.equal(briskRehaut(cell), true);
  assert.equal(restingRehaut(fax), true);
  assert.deepEqual(reminderRehauts([due, late]), ["Bea"]);
  assert.equal(fairKeeper([rule({ id: "1", title: "One", setter: "Ada" }), rule({ id: "2", title: "Two", setter: "Bea" }), rule({ id: "3", title: "Three", setter: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", drop: 20 }), rule({ id: "2", title: "East", drop: 10 })];
  assert.match(rehautTimeline(cards).map((mail) => mail.drop).join(","), /20/);
  const saved = addRehaut([], { title: "Ada", piece: "minute", drop: "10", film: "gilt", lock: "4", tags: "c m x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].piece, "minute");
  assert.equal(saved[0].drop, 10);
  assert.equal(saved[0].lock, 4);
  assert.deepEqual(saved[0].tags, ["c", "m"]);
  assert.equal(addRehaut(saved, { title: "Ada" }).length, 1);
  assert.equal(addRehaut([], { title: "Eve" })[0].lock, 2);
  assert.equal(dropRehautView([{ id: "v", name: "Morning", tray: "board", query: "", setter: "", film: "all", piece: "all", drop: "all", lock: "all" }], "v").length, 0);
  assert.equal(readRehautViews([{ id: "v", name: "Morning", tray: "peg" }])[0].tray, "peg");

  assert.equal(fdpHome("funded"), true);
  assert.equal(fdpHome("FUNDED"), true);
  assert.equal(fdpHome("FTD_YES"), true);
  assert.equal(fdpAway("OPEN"), true);
  assert.equal(fdpAway("FTD_NONE"), true);
  assert.equal(fdpGuest("HOLD"), true);
  assert.equal(fdpGuest("FTD_HOLD"), true);
  assert.equal(fdpCitizen("DEMO"), true);
  assert.equal(fdpCitizen("FTD_DEMO"), true);
  assert.equal(fdpHome({ ftd: true }), true);
  assert.equal(fdpPlain({ ftd: false }), false);
  assert.equal(fdpAway({ ftd: false }), true);
  assert.equal(fdpPlain({ ftd: "Letter" }), true);
  assert.equal(fdpHome({ ftd: "Letter" }), false);
  assert.equal(fdpBrief({ ftd: "ABCDE" }), true);
  assert.equal(fdpJoin("Desk+West"), true);
  assert.equal(fdpJoin("ANNA NOAH"), false);
  assert.equal(fdpGap("US:East"), true);
  assert.equal(fdpGap("LIVEHOLD"), false);
  assert.equal(fdpBrief("ABCDE"), true);
  assert.equal(fdpBrief("FUNDED"), false);
  assert.equal(fdpLong("FourteenCharsX"), true);
  assert.equal(fdpLong("20261120T0730Z"), false);
  assert.equal(fdpLane("FUNDED"), "funded");
  assert.equal(fdpLane("FTD_YES"), "funded");
  assert.equal(fdpLane("Hold"), "hold");
  assert.equal(fdpLane("Letter"), "plain");
  assert.equal(fdpLane("20261120T0730Z"), "stamp");
  assert.equal(fdpLane("Amsterdam"), "vowel");
  assert.equal(fdpOpen(""), true);
  assert.equal(fdpOpen({ ftd: "" }), true);
  assert.equal(fdpState({ name: "Ada" }), "");
  assert.equal(fdpState({ ftd: "Paris", balance: 1 }), "");
  assert.equal(fdpHue("FUNDED"), "champagne");
  assert.equal(fdpHue("Desk+West"), "graphite");
  assert.equal(fdpHue("HOLD"), "champagne");
  assert.equal(fdpSoon("ABCDEFGHI"), true);
  assert.equal(fdpSoon("FUNDED"), false);
  assert.equal(fdpSoon("Europe"), false);
  assert.equal(fdpHue("Letter"), "ivory");
  assert.equal(fdpLength("yes"), 3);
  assert.equal(fdpEven("ab"), true);
  assert.equal(fdpFirst("Paris"), true);
  assert.equal(fdpSpace("needs review"), true);
  assert.equal(fdpVowel("Amsterdam"), true);
  assert.equal(fdpDigit("Room4"), true);
  assert.equal(fdpCapital("PARIS"), true);
  assert.equal(fdpLower("paris"), true);
  assert.equal(fdpUpper("AMSTERDAM"), true);
  assert.equal(fdpUpper("PARIS"), false);
  assert.equal(fdpUpper("FUNDED"), false);
  const marks: FdpRow[] = [
    { id: "1", label: "Ada", code: "FUNDED" },
    { id: "2", label: "Bea", code: "FUNDED" },
    { id: "3", label: "Cara", code: "Madrid" },
  ];
  assert.equal(leadingFdp(marks), "funded");
  assert.match(fdpLanesCsv(marks), /funded,2/);
  assert.match(fdpRowsCsv(marks, ["1"]), /Ada,FUNDED/);
  assert.equal(crmv4Text("tr", "rhtTitle"), ROUND351_COPY.tr.rhtTitle);
  assert.equal(crmv4Text("de", "fdpTitle"), ROUND351_COPY.de.fdpTitle);
  assert.equal(crmv4Text("ru", "muTelesterionKicker"), ROUND351_COPY.ru.muTelesterionKicker);
  assert.equal(crmv4Text("ar", "wwSkeneLead"), ROUND351_COPY.ar.wwSkeneLead);
  const keys = Object.keys(ROUND351_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND351_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-rehaut/);
  assert.match(css, /\.c4-fdpplate/);
  assert.match(css, /\.c4-rehaut-column/);
  assert.match(css, /\.c4-fdpplate-column/);
  assert.match(css, /\.c4-mute-telesterion/);
  assert.match(css, /\.c4-watch-skene/);
  assert.match(css, /\.c4-mu-telesterion-mast/);
  assert.match(css, /\.c4-ww-skene-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round351.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /ftd:/);
  assert.match(viewFile, /rehautCsv/);
  assert.match(viewFile, /fdpRowsCsv/);
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
  assert.match(viewFile, /c4-fdpplate-search/);
  assert.match(viewFile, /rehautTimeline/);
  assert.match(viewFile, /c4-rehaut-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "rht"/);
  assert.match(app, /view === "fdp"/);
  const mute = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round97.tsx"), "utf8");
  const words = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round99.tsx"), "utf8");
  const host = `${mute}\n${words}`;
  assert.match(host, /c4-mute-telesterion/);
  assert.match(host, /c4-mu-telesterion-mast/);
  assert.match(host, /data-logo="mono"/);
  assert.match(host, /muTelesterionKicker/);
  assert.match(host, /muTelesterionLead/);
  assert.match(host, /data-mute-list/);
  const telesterion = mute.slice(mute.indexOf("export function MuteList"), mute.indexOf("export function SymbolGlance"));
  assert.equal(telesterion.includes("amount"), false);
  assert.equal(telesterion.includes("balance"), false);
  assert.match(host, /c4-watch-skene/);
  assert.match(host, /c4-ww-skene-mast/);
  assert.match(host, /wwSkeneKicker/);
  assert.match(host, /wwSkeneLead/);
  assert.match(host, /data-watch-words/);
  const skene = words.slice(words.indexOf("export function WatchWords"), words.indexOf("export function LanguageGlance"));
  assert.equal(skene.includes("currency"), false);
  assert.equal(skene.includes("profit"), false);
  const namedKeys = `${viewFile}\n${host}`.match(/"(rht|fdp|muTelesterion|wwSkene)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND351_COPY.en[key as keyof typeof ROUND351_COPY.en], "string", key);
  console.log("crmv4 round351 tests passed");
}

main();
