/**
 * Moonphase rules, surname plates, the ivory ledger alveus, and the graphite queue destrictarium.
 * Run: TZ=UTC npx tsx tests/crmv4-round341.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND341_COPY } from "../src/lib/crmv4/copy-round341";
import {
  ROUND341_FEATURES,
  activeGlaze,
  activeLimb,
  activePhase,
  activeAge,
  addMoon,
  briskMoon,
  dropMoonView,
  fairKeeper,
  surnameRoyal,
  surnameBrief,
  surnameCapital,
  surnameDigit,
  surnameEven,
  surnameFirst,
  surnameGap,
  surnameHue,
  surnameJoin,
  surnameLane,
  surnameLanesCsv,
  surnameLength,
  surnameCivic,
  surnameLower,
  surnameGuild,
  surnameNoble,
  surnameOpen,
  surnamePlain,
  surnameLong,
  surnameRowsCsv,
  surnameSoon,
  surnameSpace,
  surnameState,
  surnameUpper,
  surnameVowel,
  fullPhase,
  idleMoon,
  lateMoon,
  leadingSurname,
  moveMoonFocus,
  moonBand,
  moonAge,
  moonFilm,
  moonGap,
  moonInner,
  moonLimb,
  moonOuter,
  moonPhase,
  moonTimeline,
  overdueMoon,
  pairPhase,
  quietGlaze,
  readMoonViews,
  reminderMoonPhases,
  restingMoon,
  suggestGlaze,
  suggestLimb,
  suggestAge,
  type SurnameRow,
  type MoonPhase,
} from "../src/lib/crmv4/round341";

function rule(partial: Partial<MoonPhase> & { id: string; title: string }): MoonPhase {
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
  assert.equal(ROUND341_FEATURES.length, 25);
  assert.equal(ROUND341_FEATURES.includes("surname-plate"), true);
  assert.equal(ROUND341_FEATURES.includes("age-sla"), true);
  assert.equal(ROUND341_FEATURES.includes("fair-keeper"), true);
  assert.equal(ROUND341_FEATURES.includes("casket-file"), true);
  assert.equal(ROUND341_FEATURES.includes("dark-notices"), true);
  assert.equal(ROUND341_FEATURES.includes("moonphase-search"), true);
  assert.equal(ROUND341_FEATURES.includes("age-timeline"), true);
  assert.equal(moonLimb(" dark "), "dark");
  assert.equal(moonLimb("brass"), "");
  assert.equal(moonAge("7"), 7);
  assert.equal(moonAge(14), 14);
  assert.equal(moonAge(21), 21);
  assert.equal(moonAge(28), 28);
  assert.equal(moonAge("4"), null);
  assert.equal(moonAge("12"), null);
  assert.equal(moonPhase("4"), 4);
  assert.equal(moonPhase(8), 8);
  assert.equal(moonPhase("12"), 12);
  assert.equal(moonPhase("3"), null);
  assert.equal(moonPhase("7"), null);
  assert.equal(moonFilm("gilt"), "GILT");
  assert.equal(moonFilm("ivory"), "IVORY");
  assert.equal(moonFilm("graphite"), "GRAPHITE");
  assert.equal(moonFilm("hot"), "");
  assert.equal(moonInner("dark"), true);
  assert.equal(moonInner("CRESCENT"), true);
  assert.equal(moonInner("disk"), false);
  assert.equal(moonOuter("disk"), true);
  assert.equal(moonOuter("gibbous"), true);
  assert.equal(moonOuter("dark"), false);
  assert.equal(moonBand("dark"), "shadow");
  assert.equal(moonBand("crescent"), "horn");
  assert.equal(moonBand("disk"), "face");
  assert.equal(moonBand("gibbous"), "hump");
  assert.equal(moonGap("dark", "gibbous"), 3);
  assert.equal(quietGlaze("ivory"), true);
  assert.equal(quietGlaze("gilt"), false);
  assert.equal(pairPhase(8), true);
  assert.equal(pairPhase(4), false);
  assert.equal(fullPhase(12), true);
  assert.equal(fullPhase(8), false);
  assert.equal(activeLimb("inner"), "inner");
  assert.equal(activeAge("14"), "14");
  assert.equal(activeAge("8"), "all");
  assert.equal(activePhase("12"), "12");
  assert.equal(activePhase("7"), "all");
  assert.equal(activeGlaze("gilt", ["GILT"]), "GILT");
  assert.equal(suggestLimb(6), "dark");
  assert.equal(suggestLimb(10), "gibbous");
  assert.equal(suggestAge([], 3), 7);
  assert.equal(suggestAge([], 8), 14);
  assert.equal(suggestAge([], 14), 21);
  assert.equal(suggestAge([], 20), 28);
  assert.equal(suggestGlaze([]), "IVORY");
  assert.equal(moveMoonFocus(0, 3, 1), 1);
  assert.equal(moveMoonFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", piece: "dark" });
  const due = rule({ id: "b", title: "Bea", piece: "disk", lock: 4 });
  const quiet = rule({ id: "c", title: "Cara", drop: 7, lock: 4 });
  const cell = rule({ id: "d", title: "Dora", film: "GILT", drop: 28, lock: 12 });
  const fax = rule({ id: "e", title: "Eve", piece: "gibbous", film: "IVORY", drop: 14 });
  assert.equal(lateMoon(late, "gibbous"), true);
  assert.equal(lateMoon(late, "dark"), false);
  assert.equal(overdueMoon(due), true);
  assert.equal(idleMoon(quiet), true);
  assert.equal(briskMoon(cell), true);
  assert.equal(restingMoon(fax), true);
  assert.deepEqual(reminderMoonPhases([due, late]), ["Bea"]);
  assert.equal(fairKeeper([rule({ id: "1", title: "One", setter: "Ada" }), rule({ id: "2", title: "Two", setter: "Bea" }), rule({ id: "3", title: "Three", setter: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", drop: 28 }), rule({ id: "2", title: "East", drop: 14 })];
  assert.match(moonTimeline(cards).map((lane) => lane.drop).join(","), /28/);
  const saved = addMoon([], { title: "Ada", piece: "crescent", drop: "14", film: "gilt", lock: "8", tags: "n w x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].piece, "crescent");
  assert.equal(saved[0].drop, 14);
  assert.equal(saved[0].lock, 8);
  assert.deepEqual(saved[0].tags, ["n", "w"]);
  assert.equal(addMoon(saved, { title: "Ada" }).length, 1);
  assert.equal(addMoon([], { title: "Eve" })[0].lock, 4);
  assert.equal(dropMoonView([{ id: "v", name: "Morning", tray: "board", query: "", setter: "", film: "all", piece: "all", drop: "all", lock: "all" }], "v").length, 0);
  assert.equal(readMoonViews([{ id: "v", name: "Morning", tray: "peg" }])[0].tray, "peg");

  assert.equal(surnameRoyal("royal"), true);
  assert.equal(surnameRoyal("ROYAL"), true);
  assert.equal(surnameNoble("NOBLE"), true);
  assert.equal(surnameCivic("CIVIC"), true);
  assert.equal(surnameGuild("GUILD"), true);
  assert.equal(surnameRoyal({ lastName: true }), true);
  assert.equal(surnamePlain({ lastName: false }), true);
  assert.equal(surnameNoble({ lastName: false }), false);
  assert.equal(surnamePlain({ lastName: "Letter" }), true);
  assert.equal(surnameRoyal({ lastName: "Letter" }), false);
  assert.equal(surnameBrief({ lastName: "Kaya" }), true);
  assert.equal(surnameJoin("SMITH-JONES"), true);
  assert.equal(surnameJoin("ANNA NOAH"), false);
  assert.equal(surnameGap("O'NEIL"), true);
  assert.equal(surnameGap("LIVEHOLD"), false);
  assert.equal(surnameBrief("Kaya"), true);
  assert.equal(surnameBrief("ROYAL"), false);
  assert.equal(surnameLong("Abcdefghijklmnop"), true);
  assert.equal(surnameLong("Amsterdam"), false);
  assert.equal(surnameLane("ROYAL"), "royal");
  assert.equal(surnameLane("Kaya"), "brief");
  assert.equal(surnameLane("Letter"), "plain");
  assert.equal(surnameLane("10language"), "mark");
  assert.equal(surnameLane("Amsterdam"), "vowel");
  assert.equal(surnameOpen(""), true);
  assert.equal(surnameOpen({ lastName: "" }), true);
  assert.equal(surnameState({ name: "Ada" }), "");
  assert.equal(surnameState({ lastName: "Paris", balance: 1 }), "");
  assert.equal(surnameHue("ROYAL"), "champagne");
  assert.equal(surnameHue("SMITH-JONES"), "graphite");
  assert.equal(surnameHue("CIVIC"), "champagne");
  assert.equal(surnameSoon("Kaya"), true);
  assert.equal(surnameSoon("ROYAL"), false);
  assert.equal(surnameSoon("Device"), true);
  assert.equal(surnameSoon("Leonard"), false);
  assert.equal(surnameSoon("Amsterdam"), false);
  assert.equal(surnameHue("Letter"), "ivory");
  assert.equal(surnameLength("turk"), 4);
  assert.equal(surnameEven("turk"), true);
  assert.equal(surnameFirst("Paris"), true);
  assert.equal(surnameSpace("needs review"), true);
  assert.equal(surnameVowel("Amsterdam"), true);
  assert.equal(surnameDigit("Room4"), true);
  assert.equal(surnameCapital("PARIS"), true);
  assert.equal(surnameLower("paris"), true);
  assert.equal(surnameUpper("LEONARD"), true);
  assert.equal(surnameUpper("ROYAL"), true);
  assert.equal(surnameUpper("NG"), false);
  const marks: SurnameRow[] = [
    { id: "1", label: "Ada", code: "ROYAL" },
    { id: "2", label: "Bea", code: "ROYAL" },
    { id: "3", label: "Cara", code: "Paris" },
  ];
  assert.equal(leadingSurname(marks), "royal");
  assert.match(surnameLanesCsv(marks), /royal,2/);
  assert.match(surnameRowsCsv(marks, ["1"]), /Ada,ROYAL/);
  assert.equal(crmv4Text("tr", "mphTitle"), ROUND341_COPY.tr.mphTitle);
  assert.equal(crmv4Text("de", "lnmTitle"), ROUND341_COPY.de.lnmTitle);
  assert.equal(crmv4Text("ru", "wsgAlveusKicker"), ROUND341_COPY.ru.wsgAlveusKicker);
  assert.equal(crmv4Text("ar", "tksDestrictariumLead"), ROUND341_COPY.ar.tksDestrictariumLead);
  const keys = Object.keys(ROUND341_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND341_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-moonphase/);
  assert.match(css, /\.c4-surname/);
  assert.match(css, /\.c4-moonphase-column/);
  assert.match(css, /\.c4-surname-column/);
  assert.match(css, /\.c4-wd-stat-alveus/);
  assert.match(css, /\.c4-tkt-stat-destrictarium/);
  assert.match(css, /\.c4-wd-alveus-mast/);
  assert.match(css, /\.c4-tks-destrictarium-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round341.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /lastName:/);
  assert.match(viewFile, /moonCsv/);
  assert.match(viewFile, /surnameRowsCsv/);
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
  assert.match(viewFile, /suggestGlaze/);
  assert.match(viewFile, /c4-surname-search/);
  assert.match(viewFile, /moonTimeline/);
  assert.match(viewFile, /c4-moonphase-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "mph"/);
  assert.match(app, /view === "lnm"/);
  const host = `${fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round122.tsx"), "utf8")}\n${fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round123.tsx"), "utf8")}`;
  assert.match(host, /c4-wd-stat-alveus/);
  assert.match(host, /c4-wd-alveus-mast/);
  assert.match(host, /data-logo="mono"/);
  assert.match(host, /wsgAlveusKicker/);
  assert.match(host, /wsgAlveusLead/);
  assert.match(host, /data-wd-stat/);
  assert.equal(host.includes("amount"), false);
  assert.match(host, /c4-tkt-stat-destrictarium/);
  assert.match(host, /c4-tks-destrictarium-mast/);
  assert.match(host, /tksDestrictariumKicker/);
  assert.match(host, /tksDestrictariumLead/);
  assert.match(host, /data-tkt-stat/);
  assert.equal(host.includes("currency"), false);
  assert.equal(host.includes("profit"), false);
  const namedKeys = `${viewFile}\n${host}`.match(/"(mph|lnm|wsgAlveus|tksDestrictarium)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND341_COPY.en[key as keyof typeof ROUND341_COPY.en], "string", key);
  console.log("crmv4 round341 tests passed");
}

main();
