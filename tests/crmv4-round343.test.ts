/**
 * Lever rules, street plates, the ivory campaign porticus, and the graphite stage crypta.
 * Run: TZ=UTC npx tsx tests/crmv4-round343.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND343_COPY } from "../src/lib/crmv4/copy-round343";
import {
  ROUND343_FEATURES,
  activeFinish,
  activeMode,
  activeHour,
  activeHammer,
  addLever,
  briskLever,
  dropLeverView,
  fairKeeper,
  streetHome,
  streetBrief,
  streetCapital,
  streetDigit,
  streetEven,
  streetFirst,
  streetGap,
  streetHue,
  streetJoin,
  streetCitizen,
  streetLane,
  streetLanesCsv,
  streetLength,
  streetLower,
  streetGuest,
  streetAway,
  streetOpen,
  streetPlain,
  streetLong,
  streetRowsCsv,
  streetSoon,
  streetSpace,
  streetState,
  streetUpper,
  streetVowel,
  fullHammer,
  idleLever,
  lateLever,
  leadingStreet,
  moveLeverFocus,
  leverBand,
  leverHour,
  leverGap,
  leverInner,
  leverMode,
  leverOuter,
  leverHammer,
  leverFilm,
  leverTimeline,
  overdueLever,
  pairHammer,
  quietFinish,
  readLeverViews,
  reminderLevers,
  restingLever,
  suggestFinish,
  suggestMode,
  suggestHour,
  type StreetRow,
  type Lever,
} from "../src/lib/crmv4/round343";

function rule(partial: Partial<Lever> & { id: string; title: string }): Lever {
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
  assert.equal(ROUND343_FEATURES.length, 25);
  assert.equal(ROUND343_FEATURES.includes("street-plate"), true);
  assert.equal(ROUND343_FEATURES.includes("angle-sla"), true);
  assert.equal(ROUND343_FEATURES.includes("fair-keeper"), true);
  assert.equal(ROUND343_FEATURES.includes("casket-file"), true);
  assert.equal(ROUND343_FEATURES.includes("draw-notices"), true);
  assert.equal(ROUND343_FEATURES.includes("lever-search"), true);
  assert.equal(ROUND343_FEATURES.includes("angle-timeline"), true);
  assert.equal(leverMode(" draw "), "draw");
  assert.equal(leverMode("brass"), "");
  assert.equal(leverHour("3"), 3);
  assert.equal(leverHour(6), 6);
  assert.equal(leverHour(9), 9);
  assert.equal(leverHour(12), 12);
  assert.equal(leverHour("4"), null);
  assert.equal(leverHour("7"), null);
  assert.equal(leverHammer("2"), 2);
  assert.equal(leverHammer(3), 3);
  assert.equal(leverHammer("5"), 5);
  assert.equal(leverHammer("4"), null);
  assert.equal(leverHammer("7"), null);
  assert.equal(leverFilm("gilt"), "GILT");
  assert.equal(leverFilm("ivory"), "IVORY");
  assert.equal(leverFilm("graphite"), "GRAPHITE");
  assert.equal(leverFilm("hot"), "");
  assert.equal(leverInner("draw"), true);
  assert.equal(leverInner("BANK"), true);
  assert.equal(leverInner("roller"), false);
  assert.equal(leverOuter("roller"), true);
  assert.equal(leverOuter("guard"), true);
  assert.equal(leverOuter("draw"), false);
  assert.equal(leverBand("draw"), "pull");
  assert.equal(leverBand("bank"), "stop");
  assert.equal(leverBand("roller"), "jewel");
  assert.equal(leverBand("guard"), "dart");
  assert.equal(leverGap("draw", "guard"), 3);
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
  assert.equal(suggestMode(6), "draw");
  assert.equal(suggestMode(10), "guard");
  assert.equal(suggestHour([], 4), 3);
  assert.equal(suggestHour([], 8), 6);
  assert.equal(suggestHour([], 14), 9);
  assert.equal(suggestHour([], 20), 12);
  assert.equal(suggestFinish([]), "IVORY");
  assert.equal(moveLeverFocus(0, 3, 1), 1);
  assert.equal(moveLeverFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", piece: "draw" });
  const due = rule({ id: "b", title: "Bea", piece: "roller", lock: 2 });
  const quiet = rule({ id: "c", title: "Cara", drop: 3, lock: 2 });
  const cell = rule({ id: "d", title: "Dora", film: "GILT", drop: 12, lock: 5 });
  const fax = rule({ id: "e", title: "Eve", piece: "guard", film: "IVORY", drop: 6 });
  assert.equal(lateLever(late, "guard"), true);
  assert.equal(lateLever(late, "draw"), false);
  assert.equal(overdueLever(due), true);
  assert.equal(idleLever(quiet), true);
  assert.equal(briskLever(cell), true);
  assert.equal(restingLever(fax), true);
  assert.deepEqual(reminderLevers([due, late]), ["Bea"]);
  assert.equal(fairKeeper([rule({ id: "1", title: "One", setter: "Ada" }), rule({ id: "2", title: "Two", setter: "Bea" }), rule({ id: "3", title: "Three", setter: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", drop: 12 }), rule({ id: "2", title: "East", drop: 6 })];
  assert.match(leverTimeline(cards).map((lane) => lane.drop).join(","), /12/);
  const saved = addLever([], { title: "Ada", piece: "bank", drop: "6", film: "gilt", lock: "3", tags: "d g x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].piece, "bank");
  assert.equal(saved[0].drop, 6);
  assert.equal(saved[0].lock, 3);
  assert.deepEqual(saved[0].tags, ["d", "g"]);
  assert.equal(addLever(saved, { title: "Ada" }).length, 1);
  assert.equal(addLever([], { title: "Eve" })[0].lock, 2);
  assert.equal(dropLeverView([{ id: "v", name: "Morning", tray: "board", query: "", setter: "", film: "all", piece: "all", drop: "all", lock: "all" }], "v").length, 0);
  assert.equal(readLeverViews([{ id: "v", name: "Morning", tray: "peg" }])[0].tray, "peg");

  assert.equal(streetHome("lane"), true);
  assert.equal(streetHome("LANE"), true);
  assert.equal(streetAway("COURT"), true);
  assert.equal(streetGuest("MEWS"), true);
  assert.equal(streetCitizen("YARD"), true);
  assert.equal(streetHome({ address: true }), true);
  assert.equal(streetPlain({ address: false }), true);
  assert.equal(streetAway({ address: false }), false);
  assert.equal(streetPlain({ address: "Letter" }), true);
  assert.equal(streetHome({ address: "Letter" }), false);
  assert.equal(streetBrief({ address: "Room" }), true);
  assert.equal(streetJoin("LANE&COURT"), true);
  assert.equal(streetJoin("ANNA NOAH"), false);
  assert.equal(streetGap("U,S"), true);
  assert.equal(streetGap("LIVEHOLD"), false);
  assert.equal(streetBrief("Room"), true);
  assert.equal(streetBrief("LANE"), false);
  assert.equal(streetLong("Abcdefghijklmn"), true);
  assert.equal(streetLong("Amsterdam"), false);
  assert.equal(streetLane("LANE"), "lane");
  assert.equal(streetLane("Room"), "brief");
  assert.equal(streetLane("Letter"), "plain");
  assert.equal(streetLane("10language"), "mark");
  assert.equal(streetLane("Amsterdam"), "vowel");
  assert.equal(streetOpen(""), true);
  assert.equal(streetOpen({ address: "" }), true);
  assert.equal(streetState({ name: "Ada" }), "");
  assert.equal(streetState({ address: "Paris", balance: 1 }), "");
  assert.equal(streetHue("LANE"), "champagne");
  assert.equal(streetHue("LANE&COURT"), "graphite");
  assert.equal(streetHue("MEWS"), "champagne");
  assert.equal(streetSoon("Room"), true);
  assert.equal(streetSoon("LANE"), false);
  assert.equal(streetSoon("Device"), true);
  assert.equal(streetSoon("Madrid"), true);
  assert.equal(streetSoon("Amsterdam"), false);
  assert.equal(streetHue("Letter"), "ivory");
  assert.equal(streetLength("yes"), 3);
  assert.equal(streetEven("ab"), true);
  assert.equal(streetFirst("Paris"), true);
  assert.equal(streetSpace("needs review"), true);
  assert.equal(streetVowel("Amsterdam"), true);
  assert.equal(streetDigit("Room4"), true);
  assert.equal(streetCapital("PARIS"), true);
  assert.equal(streetLower("paris"), true);
  assert.equal(streetUpper("LEONARD"), true);
  assert.equal(streetUpper("COURT"), true);
  assert.equal(streetUpper("LANE"), false);
  assert.equal(streetUpper("NG"), false);
  const marks: StreetRow[] = [
    { id: "1", label: "Ada", code: "LANE" },
    { id: "2", label: "Bea", code: "LANE" },
    { id: "3", label: "Cara", code: "Madrid" },
  ];
  assert.equal(leadingStreet(marks), "lane");
  assert.match(streetLanesCsv(marks), /lane,2/);
  assert.match(streetRowsCsv(marks, ["1"]), /Ada,LANE/);
  assert.equal(crmv4Text("tr", "lvrTitle"), ROUND343_COPY.tr.lvrTitle);
  assert.equal(crmv4Text("de", "sttTitle"), ROUND343_COPY.de.sttTitle);
  assert.equal(crmv4Text("ru", "acgPorticusKicker"), ROUND343_COPY.ru.acgPorticusKicker);
  assert.equal(crmv4Text("ar", "ldsCryptaLead"), ROUND343_COPY.ar.ldsCryptaLead);
  const keys = Object.keys(ROUND343_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND343_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-lever/);
  assert.match(css, /\.c4-street/);
  assert.match(css, /\.c4-lever-column/);
  assert.match(css, /\.c4-street-column/);
  assert.match(css, /\.c4-aff-chan-porticus/);
  assert.match(css, /\.c4-lead-stat-crypta/);
  assert.match(css, /\.c4-acg-porticus-mast/);
  assert.match(css, /\.c4-lds-crypta-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round343.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /address:/);
  assert.match(viewFile, /leverCsv/);
  assert.match(viewFile, /streetRowsCsv/);
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
  assert.match(viewFile, /c4-street-search/);
  assert.match(viewFile, /leverTimeline/);
  assert.match(viewFile, /c4-lever-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "lvr"/);
  assert.match(app, /view === "stt"/);
  const host = `${fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round126.tsx"), "utf8")}\n${fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round127.tsx"), "utf8")}`;
  assert.match(host, /c4-aff-chan-porticus/);
  assert.match(host, /c4-acg-porticus-mast/);
  assert.match(host, /data-logo="mono"/);
  assert.match(host, /acgPorticusKicker/);
  assert.match(host, /acgPorticusLead/);
  assert.match(host, /data-aff-chan/);
  assert.equal(host.includes("amount"), false);
  assert.match(host, /c4-lead-stat-crypta/);
  assert.match(host, /c4-lds-crypta-mast/);
  assert.match(host, /ldsCryptaKicker/);
  assert.match(host, /ldsCryptaLead/);
  assert.match(host, /data-lead-stat/);
  assert.equal(host.includes("currency"), false);
  assert.equal(host.includes("profit"), false);
  const namedKeys = `${viewFile}\n${host}`.match(/"(lvr|stt|acgPorticus|ldsCrypta)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND343_COPY.en[key as keyof typeof ROUND343_COPY.en], "string", key);
  console.log("crmv4 round343 tests passed");
}

main();
