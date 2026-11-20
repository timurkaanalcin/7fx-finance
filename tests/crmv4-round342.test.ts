/**
 * Sonnerie rules, residency plates, the ivory document nymphaeum, and the graphite trade macellum.
 * Run: TZ=UTC npx tsx tests/crmv4-round342.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND342_COPY } from "../src/lib/crmv4/copy-round342";
import {
  ROUND342_FEATURES,
  activeFinish,
  activeMode,
  activeHour,
  activeHammer,
  addSonnerie,
  briskSonnerie,
  dropSonnerieView,
  fairStriker,
  residencyHome,
  residencyBrief,
  residencyCapital,
  residencyDigit,
  residencyEven,
  residencyFirst,
  residencyGap,
  residencyHue,
  residencyJoin,
  residencyCitizen,
  residencyLane,
  residencyLanesCsv,
  residencyLength,
  residencyLower,
  residencyGuest,
  residencyAway,
  residencyOpen,
  residencyPlain,
  residencyLong,
  residencyRowsCsv,
  residencySoon,
  residencySpace,
  residencyState,
  residencyUpper,
  residencyVowel,
  fullHammer,
  idleSonnerie,
  lateSonnerie,
  leadingResidency,
  moveSonnerieFocus,
  sonnerieBand,
  sonnerieHour,
  sonnerieGap,
  sonnerieInner,
  sonnerieMode,
  sonnerieOuter,
  sonnerieHammer,
  sonnerieFilm,
  sonnerieTimeline,
  overdueSonnerie,
  pairHammer,
  quietFinish,
  readSonnerieViews,
  reminderSonneries,
  restingSonnerie,
  suggestFinish,
  suggestMode,
  suggestHour,
  type ResidencyRow,
  type Sonnerie,
} from "../src/lib/crmv4/round342";

function rule(partial: Partial<Sonnerie> & { id: string; title: string }): Sonnerie {
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
  assert.equal(ROUND342_FEATURES.length, 25);
  assert.equal(ROUND342_FEATURES.includes("residency-plate"), true);
  assert.equal(ROUND342_FEATURES.includes("hour-sla"), true);
  assert.equal(ROUND342_FEATURES.includes("fair-striker"), true);
  assert.equal(ROUND342_FEATURES.includes("casket-file"), true);
  assert.equal(ROUND342_FEATURES.includes("silent-notices"), true);
  assert.equal(ROUND342_FEATURES.includes("sonnerie-search"), true);
  assert.equal(ROUND342_FEATURES.includes("hour-timeline"), true);
  assert.equal(sonnerieMode(" silent "), "silent");
  assert.equal(sonnerieMode("brass"), "");
  assert.equal(sonnerieHour("3"), 3);
  assert.equal(sonnerieHour(6), 6);
  assert.equal(sonnerieHour(9), 9);
  assert.equal(sonnerieHour(12), 12);
  assert.equal(sonnerieHour("4"), null);
  assert.equal(sonnerieHour("7"), null);
  assert.equal(sonnerieHammer("2"), 2);
  assert.equal(sonnerieHammer(3), 3);
  assert.equal(sonnerieHammer("5"), 5);
  assert.equal(sonnerieHammer("4"), null);
  assert.equal(sonnerieHammer("7"), null);
  assert.equal(sonnerieFilm("gilt"), "GILT");
  assert.equal(sonnerieFilm("ivory"), "IVORY");
  assert.equal(sonnerieFilm("graphite"), "GRAPHITE");
  assert.equal(sonnerieFilm("hot"), "");
  assert.equal(sonnerieInner("silent"), true);
  assert.equal(sonnerieInner("PETITE"), true);
  assert.equal(sonnerieInner("grande"), false);
  assert.equal(sonnerieOuter("grande"), true);
  assert.equal(sonnerieOuter("passing"), true);
  assert.equal(sonnerieOuter("silent"), false);
  assert.equal(sonnerieBand("silent"), "hush");
  assert.equal(sonnerieBand("petite"), "chime");
  assert.equal(sonnerieBand("grande"), "peal");
  assert.equal(sonnerieBand("passing"), "strike");
  assert.equal(sonnerieGap("silent", "passing"), 3);
  assert.equal(quietFinish("ivory"), true);
  assert.equal(quietFinish("gilt"), false);
  assert.equal(pairHammer(3), true);
  assert.equal(pairHammer(2), false);
  assert.equal(fullHammer(5), true);
  assert.equal(fullHammer(3), false);
  assert.equal(activeMode("inner"), "inner");
  assert.equal(activeHour("6"), "6");
  assert.equal(activeHour("4"), "all");
  assert.equal(activeHammer("5"), "5");
  assert.equal(activeHammer("4"), "all");
  assert.equal(activeFinish("gilt", ["GILT"]), "GILT");
  assert.equal(suggestMode(6), "silent");
  assert.equal(suggestMode(10), "passing");
  assert.equal(suggestHour([], 3), 3);
  assert.equal(suggestHour([], 8), 6);
  assert.equal(suggestHour([], 14), 9);
  assert.equal(suggestHour([], 20), 12);
  assert.equal(suggestFinish([]), "IVORY");
  assert.equal(moveSonnerieFocus(0, 3, 1), 1);
  assert.equal(moveSonnerieFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", piece: "silent" });
  const due = rule({ id: "b", title: "Bea", piece: "grande", lock: 2 });
  const quiet = rule({ id: "c", title: "Cara", drop: 3, lock: 2 });
  const cell = rule({ id: "d", title: "Dora", film: "GILT", drop: 12, lock: 5 });
  const fax = rule({ id: "e", title: "Eve", piece: "passing", film: "IVORY", drop: 6 });
  assert.equal(lateSonnerie(late, "passing"), true);
  assert.equal(lateSonnerie(late, "silent"), false);
  assert.equal(overdueSonnerie(due), true);
  assert.equal(idleSonnerie(quiet), true);
  assert.equal(briskSonnerie(cell), true);
  assert.equal(restingSonnerie(fax), true);
  assert.deepEqual(reminderSonneries([due, late]), ["Bea"]);
  assert.equal(fairStriker([rule({ id: "1", title: "One", setter: "Ada" }), rule({ id: "2", title: "Two", setter: "Bea" }), rule({ id: "3", title: "Three", setter: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", drop: 12 }), rule({ id: "2", title: "East", drop: 6 })];
  assert.match(sonnerieTimeline(cards).map((lane) => lane.drop).join(","), /12/);
  const saved = addSonnerie([], { title: "Ada", piece: "petite", drop: "6", film: "gilt", lock: "3", tags: "s p x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].piece, "petite");
  assert.equal(saved[0].drop, 6);
  assert.equal(saved[0].lock, 3);
  assert.deepEqual(saved[0].tags, ["s", "p"]);
  assert.equal(addSonnerie(saved, { title: "Ada" }).length, 1);
  assert.equal(addSonnerie([], { title: "Eve" })[0].lock, 2);
  assert.equal(dropSonnerieView([{ id: "v", name: "Morning", tray: "board", query: "", setter: "", film: "all", piece: "all", drop: "all", lock: "all" }], "v").length, 0);
  assert.equal(readSonnerieViews([{ id: "v", name: "Morning", tray: "peg" }])[0].tray, "peg");

  assert.equal(residencyHome("home"), true);
  assert.equal(residencyHome("HOME"), true);
  assert.equal(residencyAway("AWAY"), true);
  assert.equal(residencyGuest("GUEST"), true);
  assert.equal(residencyCitizen("CITIZEN"), true);
  assert.equal(residencyHome({ isResident: true }), true);
  assert.equal(residencyPlain({ isResident: false }), true);
  assert.equal(residencyAway({ isResident: false }), false);
  assert.equal(residencyPlain({ isResident: "Letter" }), true);
  assert.equal(residencyHome({ isResident: "Letter" }), false);
  assert.equal(residencyBrief({ isResident: "Yes" }), true);
  assert.equal(residencyJoin("HOME/AWAY"), true);
  assert.equal(residencyJoin("ANNA NOAH"), false);
  assert.equal(residencyGap("U.S"), true);
  assert.equal(residencyGap("LIVEHOLD"), false);
  assert.equal(residencyBrief("Yes"), true);
  assert.equal(residencyBrief("HOME"), false);
  assert.equal(residencyLong("Abcdefghijkl"), true);
  assert.equal(residencyLong("Amsterdam"), false);
  assert.equal(residencyLane("HOME"), "home");
  assert.equal(residencyLane("Yes"), "brief");
  assert.equal(residencyLane("Letter"), "plain");
  assert.equal(residencyLane("10language"), "mark");
  assert.equal(residencyLane("Amsterdam"), "vowel");
  assert.equal(residencyOpen(""), true);
  assert.equal(residencyOpen({ isResident: "" }), true);
  assert.equal(residencyState({ name: "Ada" }), "");
  assert.equal(residencyState({ isResident: "Paris", balance: 1 }), "");
  assert.equal(residencyHue("HOME"), "champagne");
  assert.equal(residencyHue("HOME/AWAY"), "graphite");
  assert.equal(residencyHue("GUEST"), "champagne");
  assert.equal(residencySoon("Yes"), true);
  assert.equal(residencySoon("HOME"), false);
  assert.equal(residencySoon("Device"), false);
  assert.equal(residencySoon("Paris"), true);
  assert.equal(residencySoon("Amsterdam"), false);
  assert.equal(residencyHue("Letter"), "ivory");
  assert.equal(residencyLength("yes"), 3);
  assert.equal(residencyEven("ab"), true);
  assert.equal(residencyFirst("Paris"), true);
  assert.equal(residencySpace("needs review"), true);
  assert.equal(residencyVowel("Amsterdam"), true);
  assert.equal(residencyDigit("Room4"), true);
  assert.equal(residencyCapital("PARIS"), true);
  assert.equal(residencyLower("paris"), true);
  assert.equal(residencyUpper("LEONARD"), true);
  assert.equal(residencyUpper("HOME"), true);
  assert.equal(residencyUpper("NG"), false);
  const marks: ResidencyRow[] = [
    { id: "1", label: "Ada", code: "HOME" },
    { id: "2", label: "Bea", code: "HOME" },
    { id: "3", label: "Cara", code: "Paris" },
  ];
  assert.equal(leadingResidency(marks), "home");
  assert.match(residencyLanesCsv(marks), /home,2/);
  assert.match(residencyRowsCsv(marks, ["1"]), /Ada,HOME/);
  assert.equal(crmv4Text("tr", "snrTitle"), ROUND342_COPY.tr.snrTitle);
  assert.equal(crmv4Text("de", "rsdTitle"), ROUND342_COPY.de.rsdTitle);
  assert.equal(crmv4Text("ru", "kysNymphaeumKicker"), ROUND342_COPY.ru.kysNymphaeumKicker);
  assert.equal(crmv4Text("ar", "sdgMacellumLead"), ROUND342_COPY.ar.sdgMacellumLead);
  const keys = Object.keys(ROUND342_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND342_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-sonnerie/);
  assert.match(css, /\.c4-residency/);
  assert.match(css, /\.c4-sonnerie-column/);
  assert.match(css, /\.c4-residency-column/);
  assert.match(css, /\.c4-kyc-sg-nymphaeum/);
  assert.match(css, /\.c4-trade-side-macellum/);
  assert.match(css, /\.c4-kys-nymphaeum-mast/);
  assert.match(css, /\.c4-sdg-macellum-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round342.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /isResident:/);
  assert.match(viewFile, /sonnerieCsv/);
  assert.match(viewFile, /residencyRowsCsv/);
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
  assert.match(viewFile, /c4-residency-search/);
  assert.match(viewFile, /sonnerieTimeline/);
  assert.match(viewFile, /c4-sonnerie-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "snr"/);
  assert.match(app, /view === "rsd"/);
  const host = `${fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round124.tsx"), "utf8")}\n${fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round125.tsx"), "utf8")}`;
  assert.match(host, /c4-kyc-sg-nymphaeum/);
  assert.match(host, /c4-kys-nymphaeum-mast/);
  assert.match(host, /data-logo="mono"/);
  assert.match(host, /kysNymphaeumKicker/);
  assert.match(host, /kysNymphaeumLead/);
  assert.match(host, /data-kyc-sg/);
  assert.equal(host.includes("amount"), false);
  assert.match(host, /c4-trade-side-macellum/);
  assert.match(host, /c4-sdg-macellum-mast/);
  assert.match(host, /sdgMacellumKicker/);
  assert.match(host, /sdgMacellumLead/);
  assert.match(host, /data-trade-side/);
  assert.equal(host.includes("currency"), false);
  assert.equal(host.includes("profit"), false);
  const namedKeys = `${viewFile}\n${host}`.match(/"(snr|rsd|kysNymphaeum|sdgMacellum)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND342_COPY.en[key as keyof typeof ROUND342_COPY.en], "string", key);
  console.log("crmv4 round342 tests passed");
}

main();
