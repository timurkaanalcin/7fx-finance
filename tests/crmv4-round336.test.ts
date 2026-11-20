/**
 * Barrel rules, backstaff plates, the ivory quay navalia, and the graphite belt praetorium.
 * Run: TZ=UTC npx tsx tests/crmv4-round336.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND336_COPY } from "../src/lib/crmv4/copy-round336";
import {
  ROUND336_FEATURES,
  activeFinish,
  activePart,
  activeSpring,
  activeTurn,
  addBarrel,
  backstaffBead,
  backstaffCapital,
  backstaffDeu,
  backstaffDigit,
  backstaffEven,
  backstaffFirst,
  backstaffGap,
  backstaffGbr,
  backstaffHue,
  backstaffJoin,
  backstaffLane,
  backstaffLanesCsv,
  backstaffLength,
  backstaffLower,
  backstaffOpen,
  backstaffPlain,
  backstaffRibbon,
  backstaffRowsCsv,
  backstaffSpace,
  backstaffState,
  backstaffTur,
  backstaffUpper,
  backstaffUsa,
  backstaffVowel,
  barrelBand,
  barrelBeat,
  barrelFilm,
  barrelGap,
  barrelInner,
  barrelLimb,
  barrelOuter,
  barrelRate,
  barrelTimeline,
  briskBarrel,
  dropBarrelView,
  fairWinder,
  fullSpring,
  idleBarrel,
  lateBarrel,
  leadingBackstaff,
  moveBarrelFocus,
  overdueBarrel,
  pairSpring,
  quietFinish,
  readBarrelViews,
  reminderBarrelRules,
  restingBarrel,
  suggestFinish,
  suggestPart,
  suggestTurn,
  type BackstaffRow,
  type Barrel,
} from "../src/lib/crmv4/round336";

function rule(partial: Partial<Barrel> & { id: string; title: string }): Barrel {
  return {
    note: "",
    striker: "",
    limb: "",
    beat: null,
    film: "",
    rate: 1,
    tags: [],
    poised: false,
    pegged: false,
    coffered: false,
    starred: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND336_FEATURES.length, 25);
  assert.equal(ROUND336_FEATURES.includes("country-backstaff"), true);
  assert.equal(ROUND336_FEATURES.includes("wind-sla"), true);
  assert.equal(ROUND336_FEATURES.includes("fair-winder"), true);
  assert.equal(ROUND336_FEATURES.includes("chest"), true);
  assert.equal(ROUND336_FEATURES.includes("arbor-notices"), true);
  assert.equal(ROUND336_FEATURES.includes("barrel-search"), true);
  assert.equal(ROUND336_FEATURES.includes("turn-timeline"), true);
  assert.equal(barrelLimb(" arbor "), "arbor");
  assert.equal(barrelLimb("brass"), "");
  assert.equal(barrelBeat("4"), 4);
  assert.equal(barrelBeat(8), 8);
  assert.equal(barrelBeat(16), 16);
  assert.equal(barrelBeat(32), 32);
  assert.equal(barrelBeat("6"), null);
  assert.equal(barrelRate("1"), 1);
  assert.equal(barrelRate(4), 4);
  assert.equal(barrelRate("7"), 7);
  assert.equal(barrelRate("2"), null);
  assert.equal(barrelFilm("gilt"), "GILT");
  assert.equal(barrelFilm("ivory"), "IVORY");
  assert.equal(barrelFilm("graphite"), "GRAPHITE");
  assert.equal(barrelFilm("hot"), "");
  assert.equal(barrelInner("arbor"), true);
  assert.equal(barrelInner("DRUM"), true);
  assert.equal(barrelInner("click"), false);
  assert.equal(barrelOuter("click"), true);
  assert.equal(barrelOuter("ratchet"), true);
  assert.equal(barrelOuter("arbor"), false);
  assert.equal(barrelBand("arbor"), "hook");
  assert.equal(barrelBand("drum"), "shell");
  assert.equal(barrelBand("click"), "pawl");
  assert.equal(barrelBand("ratchet"), "wheel");
  assert.equal(barrelGap("arbor", "ratchet"), 3);
  assert.equal(quietFinish("ivory"), true);
  assert.equal(quietFinish("gilt"), false);
  assert.equal(pairSpring(4), true);
  assert.equal(pairSpring(1), false);
  assert.equal(fullSpring(7), true);
  assert.equal(fullSpring(4), false);
  assert.equal(activePart("inner"), "inner");
  assert.equal(activeTurn("8"), "8");
  assert.equal(activeSpring("7"), "7");
  assert.equal(activeTurn("6"), "all");
  assert.equal(activeSpring("3"), "all");
  assert.equal(activeFinish("gilt", ["GILT"]), "GILT");
  assert.equal(suggestPart(7), "arbor");
  assert.equal(suggestPart(10), "ratchet");
  assert.equal(suggestTurn([], 3), 4);
  assert.equal(suggestTurn([], 8), 8);
  assert.equal(suggestTurn([], 14), 16);
  assert.equal(suggestTurn([], 20), 32);
  assert.equal(suggestFinish([]), "IVORY");
  assert.equal(moveBarrelFocus(0, 3, 1), 1);
  assert.equal(moveBarrelFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", limb: "arbor" });
  const due = rule({ id: "b", title: "Bea", limb: "click", rate: 1 });
  const quiet = rule({ id: "c", title: "Cara", beat: 4, rate: 1 });
  const cell = rule({ id: "d", title: "Dora", film: "GILT", beat: 32, rate: 7 });
  const fax = rule({ id: "e", title: "Eve", limb: "ratchet", film: "IVORY", beat: 8 });
  assert.equal(lateBarrel(late, "ratchet"), true);
  assert.equal(lateBarrel(late, "arbor"), false);
  assert.equal(overdueBarrel(due), true);
  assert.equal(idleBarrel(quiet), true);
  assert.equal(briskBarrel(cell), true);
  assert.equal(restingBarrel(fax), true);
  assert.deepEqual(reminderBarrelRules([due, late]), ["Bea"]);
  assert.equal(fairWinder([rule({ id: "1", title: "One", striker: "Ada" }), rule({ id: "2", title: "Two", striker: "Bea" }), rule({ id: "3", title: "Three", striker: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", beat: 32 }), rule({ id: "2", title: "East", beat: 10 })];
  assert.match(barrelTimeline(cards).map((lane) => lane.beat).join(","), /32|8/);
  const saved = addBarrel([], { title: "Ada", limb: "drum", beat: "8", film: "gilt", rate: "4", tags: "a b x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].limb, "drum");
  assert.equal(saved[0].beat, 8);
  assert.equal(saved[0].rate, 4);
  assert.deepEqual(saved[0].tags, ["a", "b"]);
  assert.equal(addBarrel(saved, { title: "Ada" }).length, 1);
  assert.equal(addBarrel([], { title: "Eve" })[0].rate, 1);
  assert.equal(dropBarrelView([{ id: "v", name: "Morning", tray: "board", query: "", striker: "", film: "all", limb: "all", beat: "all", rate: "all" }], "v").length, 0);
  assert.equal(readBarrelViews([{ id: "v", name: "Morning", tray: "peg" }])[0].tray, "peg");

  assert.equal(backstaffUsa("usa"), true);
  assert.equal(backstaffUsa("USA"), true);
  assert.equal(backstaffGbr("GBR"), true);
  assert.equal(backstaffDeu("DEU"), true);
  assert.equal(backstaffTur("TUR"), true);
  assert.equal(backstaffUsa({ country: true }), true);
  assert.equal(backstaffPlain({ country: false }), true);
  assert.equal(backstaffGbr({ country: false }), false);
  assert.equal(backstaffPlain({ country: "plain" }), true);
  assert.equal(backstaffUsa({ country: "plain" }), false);
  assert.equal(backstaffJoin("USA+GBR"), true);
  assert.equal(backstaffJoin("USA GBR"), false);
  assert.equal(backstaffGap("USA;GBR"), true);
  assert.equal(backstaffGap("LIVEHOLD"), false);
  assert.equal(backstaffBead("Beadname"), true);
  assert.equal(backstaffBead("USA"), false);
  assert.equal(backstaffRibbon("Abcdefghijklmnopqr"), true);
  assert.equal(backstaffRibbon("Amsterdam"), false);
  assert.equal(backstaffLane("USA"), "usa");
  assert.equal(backstaffLane("Beadname"), "bead");
  assert.equal(backstaffLane("Letter"), "plain");
  assert.equal(backstaffLane("10language"), "mark");
  assert.equal(backstaffLane("Amsterdam"), "vowel");
  assert.equal(backstaffOpen(""), true);
  assert.equal(backstaffOpen({ country: "" }), true);
  assert.equal(backstaffState({ name: "Ada" }), "");
  assert.equal(backstaffState({ country: "Paris", balance: 1 }), "");
  assert.equal(backstaffHue("USA"), "champagne");
  assert.equal(backstaffHue("USA+GBR"), "graphite");
  assert.equal(backstaffHue("Letter"), "ivory");
  assert.equal(backstaffLength("turk"), 4);
  assert.equal(backstaffEven("turk"), true);
  assert.equal(backstaffFirst("Paris"), true);
  assert.equal(backstaffSpace("needs review"), true);
  assert.equal(backstaffVowel("Amsterdam"), true);
  assert.equal(backstaffDigit("Room4"), true);
  assert.equal(backstaffCapital("PARIS"), true);
  assert.equal(backstaffLower("paris"), true);
  assert.equal(backstaffUpper("TURK"), true);
  assert.equal(backstaffUpper("USA"), false);
  assert.equal(backstaffUpper("EN"), false);
  const marks: BackstaffRow[] = [
    { id: "1", label: "Ada", code: "USA" },
    { id: "2", label: "Bea", code: "USA" },
    { id: "3", label: "Cara", code: "Paris" },
  ];
  assert.equal(leadingBackstaff(marks), "usa");
  assert.match(backstaffLanesCsv(marks), /usa,2/);
  assert.match(backstaffRowsCsv(marks, ["1"]), /Ada,USA/);
  assert.equal(crmv4Text("tr", "brlTitle"), ROUND336_COPY.tr.brlTitle);
  assert.equal(crmv4Text("de", "bksTitle"), ROUND336_COPY.de.bksTitle);
  assert.equal(crmv4Text("ru", "quyNavaliaKicker"), ROUND336_COPY.ru.quyNavaliaKicker);
  assert.equal(crmv4Text("ar", "zblPraetoriumLead"), ROUND336_COPY.ar.zblPraetoriumLead);
  const keys = Object.keys(ROUND336_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND336_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-barrel/);
  assert.match(css, /\.c4-backstaff/);
  assert.match(css, /\.c4-barrel-column/);
  assert.match(css, /\.c4-backstaff-column/);
  assert.match(css, /\.c4-quy-navalia/);
  assert.match(css, /\.c4-zbl-praetorium/);
  assert.match(css, /\.c4-quy-navalia-mast/);
  assert.match(css, /\.c4-zbl-praetorium-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round336.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /country/);
  assert.match(viewFile, /barrelCsv/);
  assert.match(viewFile, /backstaffRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0&role=TRADER/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestFinish/);
  assert.match(viewFile, /c4-backstaff-search/);
  assert.match(viewFile, /barrelTimeline/);
  assert.match(viewFile, /c4-barrel-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "brl"/);
  assert.match(app, /view === "bks"/);
  const host = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round156.tsx"), "utf8");
  assert.match(host, /c4-quy-navalia/);
  assert.match(host, /c4-quy-navalia-mast/);
  assert.match(host, /data-logo="mono"/);
  assert.match(host, /quyNavaliaKicker/);
  assert.match(host, /quyNavaliaLead/);
  assert.match(host, /data-quays/);
  assert.equal(host.includes("amount"), false);
  assert.match(host, /c4-zbl-praetorium/);
  assert.match(host, /c4-zbl-praetorium-mast/);
  assert.match(host, /zblPraetoriumKicker/);
  assert.match(host, /zblPraetoriumLead/);
  assert.match(host, /data-belts/);
  assert.equal(host.includes("currency"), false);
  assert.equal(host.includes("saleStatus"), false);
  const namedKeys = `${viewFile}\n${host}`.match(/"(brl|bks|quyNavalia|zblPraetorium)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND336_COPY.en[key as keyof typeof ROUND336_COPY.en], "string", key);
  console.log("crmv4 round336 tests passed");
}

main();
