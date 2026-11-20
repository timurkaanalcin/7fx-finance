/**
 * Tourbillon rules, language plates, the ivory retention thermopolium, and the graphite potential horreum.
 * Run: TZ=UTC npx tsx tests/crmv4-round345.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND345_COPY } from "../src/lib/crmv4/copy-round345";
import {
  ROUND345_FEATURES,
  activeFinish,
  activeMode,
  activeHour,
  activeHammer,
  addTourbillon,
  briskTourbillon,
  dropTourbillonView,
  fairKeeper,
  languageHome,
  languageBrief,
  languageCapital,
  languageDigit,
  languageEven,
  languageFirst,
  languageGap,
  languageHue,
  languageJoin,
  languageCitizen,
  languageLane,
  languageLanesCsv,
  languageLength,
  languageLower,
  languageGuest,
  languageAway,
  languageOpen,
  languagePlain,
  languageLong,
  languageRowsCsv,
  languageSoon,
  languageSpace,
  languageState,
  languageUpper,
  languageVowel,
  fullHammer,
  idleTourbillon,
  lateTourbillon,
  leadingLanguage,
  moveTourbillonFocus,
  tourbillonBand,
  tourbillonHour,
  tourbillonGap,
  tourbillonInner,
  tourbillonMode,
  tourbillonOuter,
  tourbillonHammer,
  tourbillonFilm,
  tourbillonTimeline,
  overdueTourbillon,
  pairHammer,
  quietFinish,
  readTourbillonViews,
  reminderTourbillons,
  restingTourbillon,
  suggestFinish,
  suggestMode,
  suggestHour,
  type LanguageRow,
  type Tourbillon,
} from "../src/lib/crmv4/round345";

function rule(partial: Partial<Tourbillon> & { id: string; title: string }): Tourbillon {
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
  assert.equal(ROUND345_FEATURES.length, 25);
  assert.equal(ROUND345_FEATURES.includes("language-plate"), true);
  assert.equal(ROUND345_FEATURES.includes("pin-sla"), true);
  assert.equal(ROUND345_FEATURES.includes("fair-smith"), true);
  assert.equal(ROUND345_FEATURES.includes("cage-file"), true);
  assert.equal(ROUND345_FEATURES.includes("cage-notices"), true);
  assert.equal(ROUND345_FEATURES.includes("tourbillon-search"), true);
  assert.equal(ROUND345_FEATURES.includes("cage-timeline"), true);
  assert.equal(tourbillonMode(" cage "), "cage");
  assert.equal(tourbillonMode("brass"), "");
  assert.equal(tourbillonHour("5"), 5);
  assert.equal(tourbillonHour(10), 10);
  assert.equal(tourbillonHour(15), 15);
  assert.equal(tourbillonHour(20), 20);
  assert.equal(tourbillonHour("4"), null);
  assert.equal(tourbillonHour("8"), null);
  assert.equal(tourbillonHammer("3"), 3);
  assert.equal(tourbillonHammer(5), 5);
  assert.equal(tourbillonHammer("7"), 7);
  assert.equal(tourbillonHammer("4"), null);
  assert.equal(tourbillonHammer("6"), null);
  assert.equal(tourbillonFilm("gilt"), "GILT");
  assert.equal(tourbillonFilm("ivory"), "IVORY");
  assert.equal(tourbillonFilm("graphite"), "GRAPHITE");
  assert.equal(tourbillonFilm("hot"), "");
  assert.equal(tourbillonInner("cage"), true);
  assert.equal(tourbillonInner("FLYING"), true);
  assert.equal(tourbillonInner("carriage"), false);
  assert.equal(tourbillonOuter("carriage"), true);
  assert.equal(tourbillonOuter("karrusel"), true);
  assert.equal(tourbillonOuter("cage"), false);
  assert.equal(tourbillonBand("cage"), "ring");
  assert.equal(tourbillonBand("flying"), "orbit");
  assert.equal(tourbillonBand("carriage"), "bridge");
  assert.equal(tourbillonBand("karrusel"), "frame");
  assert.equal(tourbillonGap("cage", "karrusel"), 3);
  assert.equal(quietFinish("ivory"), true);
  assert.equal(quietFinish("gilt"), false);
  assert.equal(pairHammer(5), true);
  assert.equal(pairHammer(3), false);
  assert.equal(fullHammer(7), true);
  assert.equal(fullHammer(5), false);
  assert.equal(activeMode("inner"), "inner");
  assert.equal(activeHour("10"), "10");
  assert.equal(activeHour("4"), "all");
  assert.equal(activeHammer("7"), "7");
  assert.equal(activeHammer("4"), "all");
  assert.equal(activeFinish("gilt", ["GILT"]), "GILT");
  assert.equal(suggestMode(6), "cage");
  assert.equal(suggestMode(14), "karrusel");
  assert.equal(suggestHour([], 4), 5);
  assert.equal(suggestHour([], 8), 10);
  assert.equal(suggestHour([], 14), 15);
  assert.equal(suggestHour([], 20), 20);
  assert.equal(suggestFinish([]), "IVORY");
  assert.equal(moveTourbillonFocus(0, 3, 1), 1);
  assert.equal(moveTourbillonFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", piece: "cage" });
  const due = rule({ id: "b", title: "Bea", piece: "carriage", lock: 3 });
  const quiet = rule({ id: "c", title: "Cara", drop: 5, lock: 3 });
  const cell = rule({ id: "d", title: "Dora", film: "GILT", drop: 20, lock: 7 });
  const fax = rule({ id: "e", title: "Eve", piece: "karrusel", film: "IVORY", drop: 10 });
  assert.equal(lateTourbillon(late, "karrusel"), true);
  assert.equal(lateTourbillon(late, "cage"), false);
  assert.equal(overdueTourbillon(due), true);
  assert.equal(idleTourbillon(quiet), true);
  assert.equal(briskTourbillon(cell), true);
  assert.equal(restingTourbillon(fax), true);
  assert.deepEqual(reminderTourbillons([due, late]), ["Bea"]);
  assert.equal(fairKeeper([rule({ id: "1", title: "One", setter: "Ada" }), rule({ id: "2", title: "Two", setter: "Bea" }), rule({ id: "3", title: "Three", setter: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", drop: 15 }), rule({ id: "2", title: "East", drop: 10 })];
  assert.match(tourbillonTimeline(cards).map((mail) => mail.drop).join(","), /15/);
  const saved = addTourbillon([], { title: "Ada", piece: "flying", drop: "10", film: "gilt", lock: "5", tags: "c k x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].piece, "flying");
  assert.equal(saved[0].drop, 10);
  assert.equal(saved[0].lock, 5);
  assert.deepEqual(saved[0].tags, ["c", "k"]);
  assert.equal(addTourbillon(saved, { title: "Ada" }).length, 1);
  assert.equal(addTourbillon([], { title: "Eve" })[0].lock, 3);
  assert.equal(dropTourbillonView([{ id: "v", name: "Morning", tray: "board", query: "", setter: "", film: "all", piece: "all", drop: "all", lock: "all" }], "v").length, 0);
  assert.equal(readTourbillonViews([{ id: "v", name: "Morning", tray: "peg" }])[0].tray, "peg");

  assert.equal(languageHome("engl"), true);
  assert.equal(languageHome("ENGL"), true);
  assert.equal(languageAway("TURK"), true);
  assert.equal(languageGuest("DEUT"), true);
  assert.equal(languageCitizen("ARAB"), true);
  assert.equal(languageHome({ language: true }), true);
  assert.equal(languagePlain({ language: false }), true);
  assert.equal(languageAway({ language: false }), false);
  assert.equal(languagePlain({ language: "Letter" }), true);
  assert.equal(languageHome({ language: "Letter" }), false);
  assert.equal(languageBrief({ language: "Note" }), true);
  assert.equal(languageJoin("ENGL&TURK"), true);
  assert.equal(languageJoin("ANNA NOAH"), false);
  assert.equal(languageGap("U,S"), true);
  assert.equal(languageGap("LIVEHOLD"), false);
  assert.equal(languageBrief("Note"), true);
  assert.equal(languageBrief("ENGL"), false);
  assert.equal(languageLong("Abcdefghijkl"), true);
  assert.equal(languageLong("Amsterdam"), false);
  assert.equal(languageLane("ENGL"), "engl");
  assert.equal(languageLane("Note"), "brief");
  assert.equal(languageLane("Letter"), "plain");
  assert.equal(languageLane("10language"), "mark");
  assert.equal(languageLane("Amsterdam"), "vowel");
  assert.equal(languageOpen(""), true);
  assert.equal(languageOpen({ language: "" }), true);
  assert.equal(languageState({ name: "Ada" }), "");
  assert.equal(languageState({ language: "Paris", balance: 1 }), "");
  assert.equal(languageHue("ENGL"), "champagne");
  assert.equal(languageHue("ENGL&TURK"), "graphite");
  assert.equal(languageHue("DEUT"), "champagne");
  assert.equal(languageSoon("Note"), true);
  assert.equal(languageSoon("ENGL"), false);
  assert.equal(languageSoon("Device"), true);
  assert.equal(languageSoon("Compan"), true);
  assert.equal(languageSoon("Amsterdam"), false);
  assert.equal(languageHue("Letter"), "ivory");
  assert.equal(languageLength("yes"), 3);
  assert.equal(languageEven("ab"), true);
  assert.equal(languageFirst("Paris"), true);
  assert.equal(languageSpace("needs review"), true);
  assert.equal(languageVowel("Amsterdam"), true);
  assert.equal(languageDigit("Room4"), true);
  assert.equal(languageCapital("PARIS"), true);
  assert.equal(languageLower("paris"), true);
  assert.equal(languageUpper("LEONARD"), true);
  assert.equal(languageUpper("TURK"), true);
  assert.equal(languageUpper("ENGL"), true);
  assert.equal(languageUpper("NG"), false);
  const marks: LanguageRow[] = [
    { id: "1", label: "Ada", code: "ENGL" },
    { id: "2", label: "Bea", code: "ENGL" },
    { id: "3", label: "Cara", code: "Madrid" },
  ];
  assert.equal(leadingLanguage(marks), "engl");
  assert.match(languageLanesCsv(marks), /engl,2/);
  assert.match(languageRowsCsv(marks, ["1"]), /Ada,ENGL/);
  assert.equal(crmv4Text("tr", "tbxTitle"), ROUND345_COPY.tr.tbxTitle);
  assert.equal(crmv4Text("de", "lgxTitle"), ROUND345_COPY.de.lgxTitle);
  assert.equal(crmv4Text("ru", "rtnThermopoliumKicker"), ROUND345_COPY.ru.rtnThermopoliumKicker);
  assert.equal(crmv4Text("ar", "potHorreumLead"), ROUND345_COPY.ar.potHorreumLead);
  const keys = Object.keys(ROUND345_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND345_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-tourbillon/);
  assert.match(css, /\.c4-language/);
  assert.match(css, /\.c4-tourbillon-column/);
  assert.match(css, /\.c4-language-column/);
  assert.match(css, /\.c4-retain-thermopolium/);
  assert.match(css, /\.c4-potential-horreum/);
  assert.match(css, /\.c4-rtn-thermopolium-mast/);
  assert.match(css, /\.c4-pot-horreum-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round345.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /language:/);
  assert.match(viewFile, /tourbillonCsv/);
  assert.match(viewFile, /languageRowsCsv/);
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
  assert.match(viewFile, /c4-language-search/);
  assert.match(viewFile, /tourbillonTimeline/);
  assert.match(viewFile, /c4-tourbillon-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "tbx"/);
  assert.match(app, /view === "lgx"/);
  const host = `${fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round130.tsx"), "utf8")}\n${fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round131.tsx"), "utf8")}`;
  assert.match(host, /c4-retain-thermopolium/);
  assert.match(host, /c4-rtn-thermopolium-mast/);
  assert.match(host, /data-logo="mono"/);
  assert.match(host, /rtnThermopoliumKicker/);
  assert.match(host, /rtnThermopoliumLead/);
  assert.match(host, /data-retain/);
  assert.equal(host.includes("amount"), false);
  assert.match(host, /c4-potential-horreum/);
  assert.match(host, /c4-pot-horreum-mast/);
  assert.match(host, /potHorreumKicker/);
  assert.match(host, /potHorreumLead/);
  assert.match(host, /data-potential/);
  assert.equal(host.includes("currency"), false);
  assert.equal(host.includes("profit"), false);
  const namedKeys = `${viewFile}\n${host}`.match(/"(tbx|lgx|rtnThermopolium|potHorreum)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND345_COPY.en[key as keyof typeof ROUND345_COPY.en], "string", key);
  console.log("crmv4 round345 tests passed");
}

main();
