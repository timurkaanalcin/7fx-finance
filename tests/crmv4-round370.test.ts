/**
 * Cloisonné cell rules, document type plates, the ivory note cella, and the graphite desk ambon.
 * Run: TZ=UTC npx tsx tests/crmv4-round370.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND370_COPY } from "../src/lib/crmv4/copy-round370";
import { ROUND369_FEATURES } from "../src/lib/crmv4/round369";
import {
  ROUND370_FEATURES,
  activeFinish,
  activeMode,
  activeHour,
  activeHammer,
  addCloison,
  briskCloison,
  dropCloisonView,
  fairKeeper,
  dtpHome,
  dtpDesk,
  dtpBrief,
  dtpDigit,
  dtpEven,
  dtpFirst,
  dtpRoute,
  dtpHue,
  dtpJoin,
  dtpCitizen,
  dtpLane,
  dtpLanesCsv,
  dtpLength,
  dtpLower,
  dtpGuest,
  dtpAway,
  dtpOpen,
  dtpPlain,
  dtpLong,
  dtpRowsCsv,
  dtpSoon,
  dtpSpace,
  dtpState,
  dtpUpper,
  dtpVowel,
  fullHammer,
  idleCloison,
  lateCloison,
  leadingSel,
  moveCloisonFocus,
  cloisonBand,
  cloisonHour,
  cloisonGap,
  cloisonInner,
  cloisonMode,
  cloisonOuter,
  cloisonHammer,
  cloisonFilm,
  cloisonTimeline,
  overdueCloison,
  pairHammer,
  quietFinish,
  readCloisonViews,
  reminderCloisonCards,
  restingCloison,
  suggestFinish,
  suggestMode,
  suggestHour,
  type DtpRow,
  type Cloison,
} from "../src/lib/crmv4/round370";

function rule(partial: Partial<Cloison> & { id: string; title: string }): Cloison {
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
  assert.equal(ROUND370_FEATURES.length, 25);
  assert.equal(ROUND370_FEATURES.includes("document-type-plate"), true);
  assert.equal(ROUND370_FEATURES.includes("cell-heat-sla"), true);
  assert.equal(ROUND370_FEATURES.includes("fair-enameller"), true);
  assert.equal(ROUND370_FEATURES.includes("cell-archive"), true);
  assert.equal(ROUND370_FEATURES.includes("cell-reminders"), true);
  assert.equal(ROUND370_FEATURES.includes("cloison-search"), true);
  assert.equal(ROUND370_FEATURES.includes("cell-timeline"), true);
  for (const feature of ROUND370_FEATURES) assert.equal((ROUND369_FEATURES as readonly string[]).includes(feature), false, feature);
  assert.equal(cloisonMode(" floor "), "floor");
  assert.equal(cloisonMode("brass"), "");
  assert.equal(cloisonHour("3"), 3);
  assert.equal(cloisonHour(6), 6);
  assert.equal(cloisonHour(12), 12);
  assert.equal(cloisonHour(24), 24);
  assert.equal(cloisonHour("4"), null);
  assert.equal(cloisonHour("8"), null);
  assert.equal(cloisonHammer("3"), 3);
  assert.equal(cloisonHammer(6), 6);
  assert.equal(cloisonHammer("9"), 9);
  assert.equal(cloisonHammer("2"), null);
  assert.equal(cloisonHammer("4"), null);
  assert.equal(cloisonFilm("flux"), "FLUX");
  assert.equal(cloisonFilm("ivory"), "IVORY");
  assert.equal(cloisonFilm("graphite"), "GRAPHITE");
  assert.equal(cloisonFilm("soot"), "");
  assert.equal(cloisonInner("floor"), true);
  assert.equal(cloisonInner("WALL"), true);
  assert.equal(cloisonInner("wire"), false);
  assert.equal(cloisonOuter("wire"), true);
  assert.equal(cloisonOuter("rim"), true);
  assert.equal(cloisonOuter("floor"), false);
  assert.equal(cloisonBand("floor"), "ground");
  assert.equal(cloisonBand("wall"), "partition");
  assert.equal(cloisonBand("wire"), "cloisons");
  assert.equal(cloisonBand("rim"), "border");
  assert.equal(cloisonGap("floor", "rim"), 3);
  assert.equal(quietFinish("graphite"), true);
  assert.equal(quietFinish("ivory"), false);
  assert.equal(quietFinish("flux"), false);
  assert.equal(pairHammer(6), true);
  assert.equal(pairHammer(3), false);
  assert.equal(fullHammer(9), true);
  assert.equal(fullHammer(6), false);
  assert.equal(activeMode("inner"), "inner");
  assert.equal(activeHour("3"), "3");
  assert.equal(activeHour("4"), "all");
  assert.equal(activeHammer("9"), "9");
  assert.equal(activeHammer("2"), "all");
  assert.equal(activeFinish("flux", ["FLUX"]), "FLUX");
  assert.equal(suggestMode(4), "floor");
  assert.equal(suggestMode(12), "rim");
  assert.equal(suggestHour([], 2), 3);
  assert.equal(suggestHour([], 5), 6);
  assert.equal(suggestHour([], 10), 12);
  assert.equal(suggestHour([], 20), 24);
  assert.equal(suggestFinish([]), "IVORY");
  assert.equal(moveCloisonFocus(0, 3, 1), 1);
  assert.equal(moveCloisonFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", piece: "floor" });
  const due = rule({ id: "b", title: "Bea", piece: "wire", lock: 3 });
  const quiet = rule({ id: "c", title: "Cara", drop: 3, lock: 3 });
  const cell = rule({ id: "d", title: "Dora", film: "FLUX", drop: 24, lock: 9 });
  const fax = rule({ id: "e", title: "Eve", piece: "rim", film: "IVORY", drop: 6 });
  assert.equal(lateCloison(late, "rim"), true);
  assert.equal(lateCloison(late, "floor"), false);
  assert.equal(overdueCloison(due), true);
  assert.equal(idleCloison(quiet), true);
  assert.equal(briskCloison(cell), true);
  assert.equal(restingCloison(fax), true);
  assert.deepEqual(reminderCloisonCards([due, late]), ["Bea"]);
  assert.equal(fairKeeper([rule({ id: "1", title: "One", setter: "Ada" }), rule({ id: "2", title: "Two", setter: "Bea" }), rule({ id: "3", title: "Three", setter: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", drop: 6 }), rule({ id: "2", title: "East", drop: 3 })];
  assert.match(cloisonTimeline(cards).map((mail) => mail.drop).join(","), /6/);
  const saved = addCloison([], { title: "Ada", piece: "wall", drop: "6", film: "flux", lock: "6", tags: "c z x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].piece, "wall");
  assert.equal(saved[0].drop, 6);
  assert.equal(saved[0].lock, 6);
  assert.deepEqual(saved[0].tags, ["c", "z"]);
  assert.equal(addCloison(saved, { title: "Ada" }).length, 1);
  assert.equal(addCloison([], { title: "Eve" })[0].lock, 3);
  assert.equal(dropCloisonView([{ id: "v", name: "Morning", tray: "board", query: "", setter: "", film: "all", piece: "all", drop: "all", lock: "all" }], "v").length, 0);
  assert.equal(readCloisonViews([{ id: "v", name: "Morning", tray: "peg" }])[0].tray, "peg");

  const now = Date.parse("2026-11-20T12:00:00.000Z");
  assert.equal(dtpHome("ID", now), true);
  assert.equal(dtpHome("YES", now), true);
  assert.equal(dtpDesk("ADDRESS", now), true);
  assert.equal(dtpHome("2026-11-20T01:00:00.000Z", now), true);
  assert.equal(dtpAway("quiet book", now), true);
  assert.equal(dtpGuest("SELFIE", now), true);
  assert.equal(dtpCitizen("OTHER", now), true);
  assert.equal(dtpDesk("2026-11-19T18:00:00.000Z", now), true);
  assert.equal(dtpHome({ docType: true }, now), true);
  assert.equal(dtpHome({ docType: "2026-11-20T08:00:00.000Z" }, now), true);
  assert.equal(dtpPlain({ docType: false }, now), true);
  assert.equal(dtpAway({ docType: false }, now), false);
  assert.equal(dtpPlain({ docType: "Granite" }, now), true);
  assert.equal(dtpHome({ docType: "Granite" }, now), false);
  assert.equal(dtpBrief({ docType: "CARD" }, now), true);
  assert.equal(dtpJoin("LIVE&BOOK", now), true);
  assert.equal(dtpJoin("ANNA NOAH", now), false);
  assert.equal(dtpRoute("SALE/EAST", now), true);
  assert.equal(dtpRoute("SETHOLD", now), false);
  assert.equal(dtpBrief("ADDRESS", now), false);
  assert.equal(dtpBrief("CARD", now), true);
  assert.equal(dtpLong("GraphiteXY", now), true);
  assert.equal(dtpLong("NineChars", now), false);
  assert.equal(dtpLane("ID", now), "hall");
  assert.equal(dtpLane("ADDRESS", now), "desk");
  assert.equal(dtpLane("SELFIE", now), "hold");
  assert.equal(dtpLane("OTHER", now), "guest");
  assert.equal(dtpLane("PAIR", now), "join");
  assert.equal(dtpLane("2026-11-19T12:00:00.000Z", now), "hold");
  assert.equal(dtpLane("2026-11-15T12:00:00.000Z", now), "guest");
  assert.equal(dtpLane("Granite", now), "plain");
  assert.equal(dtpLane("CARD", now), "brief");
  assert.equal(dtpLane("4ROOM", now), "stamp");
  assert.equal(dtpLane("Amsterdam", now), "vowel");
  assert.equal(dtpLane("quiet book", now), "vacant");
  assert.equal(dtpLane("alpha/beta/gamma", now), "route");
  assert.equal(dtpLane("clear file", now), "hall");
  assert.equal(dtpOpen(""), true);
  assert.equal(dtpOpen({ docType: "" }), true);
  assert.equal(dtpState({ name: "Ada" }), "");
  assert.equal(dtpState({ docType: "ID", balance: 1 }), "");
  assert.equal(dtpHue("ID", now), "champagne");
  assert.equal(dtpHue("PAIR&FILE", now), "champagne");
  assert.equal(dtpHue("SELFIE", now), "ivory");
  assert.equal(dtpHue("ADDRESS", now), "graphite");
  assert.equal(dtpSoon("CARD", now), true);
  assert.equal(dtpSoon("ID", now), false);
  assert.equal(dtpSoon("ABCDEF", now), true);
  assert.equal(dtpSoon("AB", now), false);
  assert.equal(dtpHue("Granite", now), "ivory");
  assert.equal(dtpLength("yes"), 3);
  assert.equal(dtpEven("ab"), true);
  assert.equal(dtpFirst("Paris"), true);
  assert.equal(dtpSpace("needs review"), true);
  assert.equal(dtpVowel("Amsterdam"), true);
  assert.equal(dtpDigit("Room4"), true);
  assert.equal(dtpLower("paris"), true);
  assert.equal(dtpUpper("SELFIE"), true);
  assert.equal(dtpUpper("ID"), false);
  assert.equal(dtpUpper("CLEAR"), false);
  const marks: DtpRow[] = [
    { id: "1", label: "Ada", code: "ID" },
    { id: "2", label: "Bea", code: "ID" },
    { id: "3", label: "Cara", code: "Granite" },
  ];
  assert.equal(leadingSel(marks), "hall");
  assert.match(dtpLanesCsv(marks), /hall,2/);
  assert.match(dtpRowsCsv(marks, ["1"]), /Ada,ID/);
  assert.equal(crmv4Text("tr", "cznTitle"), ROUND370_COPY.tr.cznTitle);
  assert.equal(crmv4Text("de", "dtpTitle"), ROUND370_COPY.de.dtpTitle);
  assert.equal(crmv4Text("ru", "nsCellaKicker"), ROUND370_COPY.ru.nsCellaKicker);
  assert.equal(crmv4Text("ar", "thAmbonLead"), ROUND370_COPY.ar.thAmbonLead);
  const keys = Object.keys(ROUND370_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND370_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-cloison/);
  assert.match(css, /\.c4-dtpplate/);
  assert.match(css, /\.c4-cloison-column/);
  assert.match(css, /\.c4-dtpplate-column/);
  assert.match(css, /\.c4-ns-cella/);
  assert.match(css, /\.c4-th-ambon/);
  assert.match(css, /\.c4-ns-cella-mast/);
  assert.match(css, /\.c4-th-ambon-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round370.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /docType:/);
  assert.match(viewFile, /cloisonCsv/);
  assert.match(viewFile, /dtpRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/documents\?take=24/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestFinish/);
  assert.match(viewFile, /c4-dtpplate-search/);
  assert.match(viewFile, /cloisonTimeline/);
  assert.match(viewFile, /c4-cloison-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "czn"/);
  assert.match(app, /view === "dtp"/);
  const notes = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round34.tsx"), "utf8");
  assert.match(notes, /c4-ns-cella/);
  assert.match(notes, /c4-ns-cella-mast/);
  assert.match(notes, /data-logo="mono"/);
  assert.match(notes, /nsCellaKicker/);
  assert.match(notes, /nsCellaLead/);
  assert.match(notes, /data-ns-cella/);
  const studio = notes.slice(notes.indexOf("export function NoteStudio"));
  assert.equal(studio.includes("amount"), false);
  assert.equal(studio.includes("balance"), false);
  const hero = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round35.tsx"), "utf8");
  assert.match(hero, /c4-th-ambon/);
  assert.match(hero, /c4-th-ambon-mast/);
  assert.match(hero, /thAmbonKicker/);
  assert.match(hero, /thAmbonLead/);
  assert.match(hero, /data-th-ambon/);
  const namedKeys = `${viewFile}\n${notes}\n${hero}`.match(/"(czn|dtp|nsCella|thAmbon)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND370_COPY.en[key as keyof typeof ROUND370_COPY.en], "string", key);
  console.log("crmv4 round370 tests passed");
}

main();
