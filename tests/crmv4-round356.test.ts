/**
 * Anglage rules, seal plates, the ivory column naos, and the graphite audit adyton.
 * Run: TZ=UTC npx tsx tests/crmv4-round356.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND356_COPY } from "../src/lib/crmv4/copy-round356";
import {
  ROUND356_FEATURES,
  activeFinish,
  activeMode,
  activeHour,
  activeHammer,
  addAnglage,
  briskAnglage,
  dropAnglageView,
  fairKeeper,
  selHome,
  selBrief,
  selCapital,
  selDigit,
  selEven,
  selFirst,
  selRoute,
  selHue,
  selJoin,
  selCitizen,
  selLane,
  selLanesCsv,
  selLength,
  selLower,
  selGuest,
  selAway,
  selOpen,
  selPlain,
  selLong,
  selRowsCsv,
  selSoon,
  selSpace,
  selState,
  selUpper,
  selVowel,
  selDesk,
  fullHammer,
  idleAnglage,
  lateAnglage,
  leadingSel,
  moveAnglageFocus,
  anglageBand,
  anglageHour,
  anglageGap,
  anglageInner,
  anglageMode,
  anglageOuter,
  anglageHammer,
  anglageFilm,
  anglageTimeline,
  overdueAnglage,
  pairHammer,
  quietFinish,
  readAnglageViews,
  reminderAnglages,
  restingAnglage,
  suggestFinish,
  suggestMode,
  suggestHour,
  type SelRow,
  type Anglage,
} from "../src/lib/crmv4/round356";

function rule(partial: Partial<Anglage> & { id: string; title: string }): Anglage {
  return {
    note: "",
    setter: "",
    piece: "",
    drop: null,
    film: "",
    lock: 3,
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
  assert.equal(ROUND356_FEATURES.length, 25);
  assert.equal(ROUND356_FEATURES.includes("seal-plate"), true);
  assert.equal(ROUND356_FEATURES.includes("anglage-pin-sla"), true);
  assert.equal(ROUND356_FEATURES.includes("fair-chamferer"), true);
  assert.equal(ROUND356_FEATURES.includes("arris-archive"), true);
  assert.equal(ROUND356_FEATURES.includes("arris-reminders"), true);
  assert.equal(ROUND356_FEATURES.includes("anglage-search"), true);
  assert.equal(ROUND356_FEATURES.includes("arris-timeline"), true);
  assert.equal(anglageMode(" arris "), "arris");
  assert.equal(anglageMode("brass"), "");
  assert.equal(anglageHour("5"), 5);
  assert.equal(anglageHour(10), 10);
  assert.equal(anglageHour(20), 20);
  assert.equal(anglageHour(40), 40);
  assert.equal(anglageHour("6"), null);
  assert.equal(anglageHour("12"), null);
  assert.equal(anglageHammer("3"), 3);
  assert.equal(anglageHammer(6), 6);
  assert.equal(anglageHammer("12"), 12);
  assert.equal(anglageHammer("1"), null);
  assert.equal(anglageHammer("4"), null);
  assert.equal(anglageFilm("gilt"), "GILT");
  assert.equal(anglageFilm("ivory"), "IVORY");
  assert.equal(anglageFilm("graphite"), "GRAPHITE");
  assert.equal(anglageFilm("hot"), "");
  assert.equal(anglageInner("arris"), true);
  assert.equal(anglageInner("BEVEL"), true);
  assert.equal(anglageInner("ogive"), false);
  assert.equal(anglageOuter("ogive"), true);
  assert.equal(anglageOuter("knife"), true);
  assert.equal(anglageOuter("arris"), false);
  assert.equal(anglageBand("arris"), "edge");
  assert.equal(anglageBand("bevel"), "face");
  assert.equal(anglageBand("ogive"), "curve");
  assert.equal(anglageBand("knife"), "cut");
  assert.equal(anglageGap("arris", "knife"), 3);
  assert.equal(quietFinish("ivory"), true);
  assert.equal(quietFinish("gilt"), false);
  assert.equal(pairHammer(6), true);
  assert.equal(pairHammer(3), false);
  assert.equal(fullHammer(12), true);
  assert.equal(fullHammer(6), false);
  assert.equal(activeMode("inner"), "inner");
  assert.equal(activeHour("20"), "20");
  assert.equal(activeHour("7"), "all");
  assert.equal(activeHammer("12"), "12");
  assert.equal(activeHammer("4"), "all");
  assert.equal(activeFinish("gilt", ["GILT"]), "GILT");
  assert.equal(suggestMode(4), "arris");
  assert.equal(suggestMode(10), "knife");
  assert.equal(suggestHour([], 3), 5);
  assert.equal(suggestHour([], 8), 10);
  assert.equal(suggestHour([], 14), 20);
  assert.equal(suggestHour([], 20), 40);
  assert.equal(suggestFinish([]), "IVORY");
  assert.equal(moveAnglageFocus(0, 3, 1), 1);
  assert.equal(moveAnglageFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", piece: "arris" });
  const due = rule({ id: "b", title: "Bea", piece: "ogive", lock: 3 });
  const quiet = rule({ id: "c", title: "Cara", drop: 5, lock: 3 });
  const cell = rule({ id: "d", title: "Dora", film: "GILT", drop: 40, lock: 12 });
  const fax = rule({ id: "e", title: "Eve", piece: "knife", film: "IVORY", drop: 10 });
  assert.equal(lateAnglage(late, "knife"), true);
  assert.equal(lateAnglage(late, "arris"), false);
  assert.equal(overdueAnglage(due), true);
  assert.equal(idleAnglage(quiet), true);
  assert.equal(briskAnglage(cell), true);
  assert.equal(restingAnglage(fax), true);
  assert.deepEqual(reminderAnglages([due, late]), ["Bea"]);
  assert.equal(fairKeeper([rule({ id: "1", title: "One", setter: "Ada" }), rule({ id: "2", title: "Two", setter: "Bea" }), rule({ id: "3", title: "Three", setter: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", drop: 20 }), rule({ id: "2", title: "East", drop: 10 })];
  assert.match(anglageTimeline(cards).map((mail) => mail.drop).join(","), /20/);
  const saved = addAnglage([], { title: "Ada", piece: "bevel", drop: "10", film: "gilt", lock: "6", tags: "a n x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].piece, "bevel");
  assert.equal(saved[0].drop, 10);
  assert.equal(saved[0].lock, 6);
  assert.deepEqual(saved[0].tags, ["a", "n"]);
  assert.equal(addAnglage(saved, { title: "Ada" }).length, 1);
  assert.equal(addAnglage([], { title: "Eve" })[0].lock, 3);
  assert.equal(dropAnglageView([{ id: "v", name: "Morning", tray: "board", query: "", setter: "", film: "all", piece: "all", drop: "all", lock: "all" }], "v").length, 0);
  assert.equal(readAnglageViews([{ id: "v", name: "Morning", tray: "peg" }])[0].tray, "peg");

  assert.equal(selHome("SET"), true);
  assert.equal(selHome("ARMED"), true);
  assert.equal(selHome("READY"), true);
  assert.equal(selAway("OFF"), true);
  assert.equal(selGuest("HOLD"), true);
  assert.equal(selGuest("PAUSED"), true);
  assert.equal(selCitizen("CUT"), true);
  assert.equal(selCitizen("LAPSED"), true);
  assert.equal(selDesk("WAIT"), true);
  assert.equal(selDesk("DUE"), true);
  assert.equal(selHome({ crmReadOnly: true }), true);
  assert.equal(selPlain({ crmReadOnly: false }), false);
  assert.equal(selAway({ crmReadOnly: false }), true);
  assert.equal(selPlain({ crmReadOnly: "Letter" }), true);
  assert.equal(selHome({ crmReadOnly: "Letter" }), false);
  assert.equal(selBrief({ crmReadOnly: "TOKEN" }), true);
  assert.equal(selJoin("SET+WAIT"), true);
  assert.equal(selJoin("ANNA NOAH"), false);
  assert.equal(selRoute("SET:WAIT"), true);
  assert.equal(selRoute("SETHOLD"), false);
  assert.equal(selBrief("TOKEN"), true);
  assert.equal(selBrief("SET"), false);
  assert.equal(selLong("EighteenCharsLongX"), true);
  assert.equal(selLong("20261120T073000ZZ"), false);
  assert.equal(selLane("ARMED"), "home");
  assert.equal(selLane("WAIT"), "desk");
  assert.equal(selLane("HOLD"), "hold");
  assert.equal(selLane("CUT"), "guest");
  assert.equal(selLane("Letter"), "plain");
  assert.equal(selLane("20261120T073000Z"), "stamp");
  assert.equal(selLane("Amsterdam"), "vowel");
  assert.equal(selOpen(""), true);
  assert.equal(selOpen({ crmReadOnly: "" }), true);
  assert.equal(selState({ name: "Ada" }), "");
  assert.equal(selState({ crmReadOnly: "Paris", balance: 1 }), "");
  assert.equal(selHue("SET"), "champagne");
  assert.equal(selHue("SET+WAIT"), "graphite");
  assert.equal(selHue("HOLD"), "champagne");
  assert.equal(selHue("WAIT"), "graphite");
  assert.equal(selSoon("TOKEN"), true);
  assert.equal(selSoon("SET"), false);
  assert.equal(selSoon("NINECHARS"), true);
  assert.equal(selHue("Letter"), "ivory");
  assert.equal(selLength("yes"), 3);
  assert.equal(selEven("ab"), true);
  assert.equal(selFirst("Paris"), true);
  assert.equal(selSpace("needs review"), true);
  assert.equal(selVowel("Amsterdam"), true);
  assert.equal(selDigit("Room4"), true);
  assert.equal(selCapital("PARIS"), true);
  assert.equal(selLower("paris"), true);
  assert.equal(selUpper("SEALEDX"), true);
  assert.equal(selUpper("SET"), false);
  assert.equal(selUpper("WAIT"), false);
  const marks: SelRow[] = [
    { id: "1", label: "Ada", code: "SET" },
    { id: "2", label: "Bea", code: "SET" },
    { id: "3", label: "Cara", code: "Madrid" },
  ];
  assert.equal(leadingSel(marks), "home");
  assert.match(selLanesCsv(marks), /home,2/);
  assert.match(selRowsCsv(marks, ["1"]), /Ada,SET/);
  assert.equal(crmv4Text("tr", "aglTitle"), ROUND356_COPY.tr.aglTitle);
  assert.equal(crmv4Text("de", "selTitle"), ROUND356_COPY.de.selTitle);
  assert.equal(crmv4Text("ru", "xvNaosKicker"), ROUND356_COPY.ru.xvNaosKicker);
  assert.equal(crmv4Text("ar", "uyAdytonLead"), ROUND356_COPY.ar.uyAdytonLead);
  const keys = Object.keys(ROUND356_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND356_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-anglage/);
  assert.match(css, /\.c4-selplate/);
  assert.match(css, /\.c4-anglage-column/);
  assert.match(css, /\.c4-selplate-column/);
  assert.match(css, /\.c4-csv-naos/);
  assert.match(css, /\.c4-audit-adyton/);
  assert.match(css, /\.c4-xv-naos-mast/);
  assert.match(css, /\.c4-uy-adyton-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round356.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /crmReadOnly:/);
  assert.match(viewFile, /anglageCsv/);
  assert.match(viewFile, /selRowsCsv/);
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
  assert.match(viewFile, /c4-selplate-search/);
  assert.match(viewFile, /anglageTimeline/);
  assert.match(viewFile, /c4-anglage-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "agl"/);
  assert.match(app, /view === "sel"/);
  const tags = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round110.tsx"), "utf8");
  assert.match(tags, /c4-csv-naos/);
  assert.match(tags, /c4-xv-naos-mast/);
  assert.match(tags, /data-logo="mono"/);
  assert.match(tags, /xvNaosKicker/);
  assert.match(tags, /xvNaosLead/);
  assert.match(tags, /data-csv-naos/);
  const gallery = tags.slice(tags.indexOf("export function CsvColumnDesk"), tags.indexOf("export function AuditDayStrip"));
  assert.equal(gallery.includes("amount"), false);
  assert.equal(gallery.includes("price"), false);
  assert.match(tags, /c4-audit-adyton/);
  assert.match(tags, /c4-uy-adyton-mast/);
  assert.match(tags, /uyAdytonKicker/);
  assert.match(tags, /uyAdytonLead/);
  assert.match(tags, /data-audit-adyton/);
  const porch = tags.slice(tags.indexOf("export function AuditDayStrip"));
  assert.equal(porch.includes("currency"), false);
  assert.equal(porch.includes("profit"), false);
  const namedKeys = `${viewFile}\n${tags}`.match(/"(agl|sel|xvNaos|uyAdyton)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND356_COPY.en[key as keyof typeof ROUND356_COPY.en], "string", key);
  console.log("crmv4 round356 tests passed");
}

main();
