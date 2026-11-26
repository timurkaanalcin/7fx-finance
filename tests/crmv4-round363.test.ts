/**
 * Triovis rules, grant plates, the ivory park carceres, and the graphite source spina.
 * Run: TZ=UTC npx tsx tests/crmv4-round363.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND363_COPY } from "../src/lib/crmv4/copy-round363";
import {
  ROUND363_FEATURES,
  activeFinish,
  activeMode,
  activeHour,
  activeHammer,
  addTriovis,
  briskTriovis,
  dropTriovisView,
  fairKeeper,
  edrHome,
  edrBrief,
  edrCapital,
  edrDigit,
  edrEven,
  edrFirst,
  edrRoute,
  edrHue,
  edrJoin,
  edrCitizen,
  edrLane,
  edrLanesCsv,
  edrLength,
  edrLower,
  edrGuest,
  edrAway,
  edrOpen,
  edrPlain,
  edrLong,
  edrRowsCsv,
  edrSoon,
  edrSpace,
  edrState,
  edrUpper,
  edrVowel,
  edrDesk,
  fullHammer,
  idleTriovis,
  lateTriovis,
  leadingSel,
  moveTriovisFocus,
  triovisBand,
  triovisHour,
  triovisGap,
  triovisInner,
  triovisMode,
  triovisOuter,
  triovisHammer,
  triovisFilm,
  triovisTimeline,
  overdueTriovis,
  pairHammer,
  quietFinish,
  readTriovisViews,
  reminderTriovises,
  restingTriovis,
  suggestFinish,
  suggestMode,
  suggestHour,
  type CgnRow,
  type Triovis,
} from "../src/lib/crmv4/round363";

function rule(partial: Partial<Triovis> & { id: string; title: string }): Triovis {
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
  assert.equal(ROUND363_FEATURES.length, 25);
  assert.equal(ROUND363_FEATURES.includes("grant-plate"), true);
  assert.equal(ROUND363_FEATURES.includes("triovis-hook-sla"), true);
  assert.equal(ROUND363_FEATURES.includes("fair-regulator"), true);
  assert.equal(ROUND363_FEATURES.includes("whip-archive"), true);
  assert.equal(ROUND363_FEATURES.includes("whip-reminders"), true);
  assert.equal(ROUND363_FEATURES.includes("triovis-search"), true);
  assert.equal(ROUND363_FEATURES.includes("whip-timeline"), true);
  assert.equal(triovisMode(" index "), "index");
  assert.equal(triovisMode("brass"), "");
  assert.equal(triovisHour("5"), 5);
  assert.equal(triovisHour(10), 10);
  assert.equal(triovisHour(20), 20);
  assert.equal(triovisHour(40), 40);
  assert.equal(triovisHour("6"), null);
  assert.equal(triovisHour("12"), null);
  assert.equal(triovisHammer("3"), 3);
  assert.equal(triovisHammer(6), 6);
  assert.equal(triovisHammer("9"), 9);
  assert.equal(triovisHammer("2"), null);
  assert.equal(triovisHammer("4"), null);
  assert.equal(triovisFilm("gilt"), "GILT");
  assert.equal(triovisFilm("ivory"), "IVORY");
  assert.equal(triovisFilm("graphite"), "GRAPHITE");
  assert.equal(triovisFilm("hot"), "");
  assert.equal(triovisInner("index"), true);
  assert.equal(triovisInner("BOOT"), true);
  assert.equal(triovisInner("spring"), false);
  assert.equal(triovisOuter("pins"), true);
  assert.equal(triovisOuter("spring"), true);
  assert.equal(triovisOuter("index"), false);
  assert.equal(triovisBand("index"), "hand");
  assert.equal(triovisBand("boot"), "foot");
  assert.equal(triovisBand("pins"), "pair");
  assert.equal(triovisBand("spring"), "whip");
  assert.equal(triovisGap("index", "spring"), 3);
  assert.equal(quietFinish("ivory"), true);
  assert.equal(quietFinish("gilt"), false);
  assert.equal(pairHammer(6), true);
  assert.equal(pairHammer(3), false);
  assert.equal(fullHammer(9), true);
  assert.equal(fullHammer(6), false);
  assert.equal(activeMode("inner"), "inner");
  assert.equal(activeHour("5"), "5");
  assert.equal(activeHour("7"), "all");
  assert.equal(activeHammer("9"), "9");
  assert.equal(activeHammer("5"), "all");
  assert.equal(activeFinish("gilt", ["GILT"]), "GILT");
  assert.equal(suggestMode(4), "index");
  assert.equal(suggestMode(10), "spring");
  assert.equal(suggestHour([], 3), 5);
  assert.equal(suggestHour([], 8), 10);
  assert.equal(suggestHour([], 14), 20);
  assert.equal(suggestHour([], 20), 40);
  assert.equal(suggestFinish([]), "IVORY");
  assert.equal(moveTriovisFocus(0, 3, 1), 1);
  assert.equal(moveTriovisFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", piece: "index" });
  const due = rule({ id: "b", title: "Bea", piece: "pins", lock: 3 });
  const quiet = rule({ id: "c", title: "Cara", drop: 5, lock: 3 });
  const cell = rule({ id: "d", title: "Dora", film: "GILT", drop: 40, lock: 9 });
  const fax = rule({ id: "e", title: "Eve", piece: "spring", film: "IVORY", drop: 10 });
  assert.equal(lateTriovis(late, "spring"), true);
  assert.equal(lateTriovis(late, "index"), false);
  assert.equal(overdueTriovis(due), true);
  assert.equal(idleTriovis(quiet), true);
  assert.equal(briskTriovis(cell), true);
  assert.equal(restingTriovis(fax), true);
  assert.deepEqual(reminderTriovises([due, late]), ["Bea"]);
  assert.equal(fairKeeper([rule({ id: "1", title: "One", setter: "Ada" }), rule({ id: "2", title: "Two", setter: "Bea" }), rule({ id: "3", title: "Three", setter: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", drop: 10 }), rule({ id: "2", title: "East", drop: 5 })];
  assert.match(triovisTimeline(cards).map((mail) => mail.drop).join(","), /10/);
  const saved = addTriovis([], { title: "Ada", piece: "boot", drop: "10", film: "gilt", lock: "6", tags: "a w x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].piece, "boot");
  assert.equal(saved[0].drop, 10);
  assert.equal(saved[0].lock, 6);
  assert.deepEqual(saved[0].tags, ["a", "w"]);
  assert.equal(addTriovis(saved, { title: "Ada" }).length, 1);
  assert.equal(addTriovis([], { title: "Eve" })[0].lock, 3);
  assert.equal(dropTriovisView([{ id: "v", name: "Morning", tray: "board", query: "", setter: "", film: "all", piece: "all", drop: "all", lock: "all" }], "v").length, 0);
  assert.equal(readTriovisViews([{ id: "v", name: "Morning", tray: "peg" }])[0].tray, "peg");

  const now = Date.parse("2026-11-20T12:00:00.000Z");
  assert.equal(edrHome("YES", now), true);
  assert.equal(edrHome("DESK", now), true);
  assert.equal(edrHome("2026-11-20T01:00:00.000Z", now), true);
  assert.equal(edrAway("closed seat", now), true);
  assert.equal(edrGuest("2026-11-10T12:00:00.000Z", now), true);
  assert.equal(edrCitizen("2025-01-01T00:00:00.000Z", now), true);
  assert.equal(edrDesk("2026-11-17T12:00:00.000Z", now), true);
  assert.equal(edrHome({ canEditRates: true }, now), true);
  assert.equal(edrHome({ canEditRates: "2026-11-20T08:00:00.000Z" }, now), true);
  assert.equal(edrPlain({ canEditRates: false }, now), true);
  assert.equal(edrAway({ canEditRates: false }, now), false);
  assert.equal(edrPlain({ canEditRates: "Granite" }, now), true);
  assert.equal(edrHome({ canEditRates: "Granite" }, now), false);
  assert.equal(edrBrief({ canEditRates: "ABCD" }, now), true);
  assert.equal(edrJoin("SALE+DESK", now), true);
  assert.equal(edrJoin("ANNA NOAH", now), false);
  assert.equal(edrRoute("SALE;EAST", now), true);
  assert.equal(edrRoute("SETHOLD", now), false);
  assert.equal(edrBrief("MARKS", now), false);
  assert.equal(edrBrief("YES", now), false);
  assert.equal(edrLong("FifteenCharsLong", now), true);
  assert.equal(edrLong("FourteenCharsX", now), false);
  assert.equal(edrLane("YES", now), "hall");
  assert.equal(edrLane("NIGHT", now), "desk");
  assert.equal(edrLane("HOLD", now), "hold");
  assert.equal(edrLane("GUEST", now), "guest");
  assert.equal(edrLane("PAIR", now), "join");
  assert.equal(edrLane("2026-11-17T12:00:00.000Z", now), "desk");
  assert.equal(edrLane("2026-11-10T12:00:00.000Z", now), "hold");
  assert.equal(edrLane("2025-01-01T00:00:00.000Z", now), "guest");
  assert.equal(edrLane("Granite", now), "plain");
  assert.equal(edrLane("ABCD", now), "brief");
  assert.equal(edrLane("20261120T073000Z", now), "stamp");
  assert.equal(edrLane("Amsterdam", now), "vowel");
  assert.equal(edrLane("closed seat", now), "vacant");
  assert.equal(edrLane("alpha/beta/gamma", now), "route");
  assert.equal(edrLane("staff desk", now), "hall");
  assert.equal(edrOpen(""), true);
  assert.equal(edrOpen({ canEditRates: "" }), true);
  assert.equal(edrState({ name: "Ada" }), "");
  assert.equal(edrState({ canEditRates: "Paris", balance: 1 }), "");
  assert.equal(edrHue("YES", now), "champagne");
  assert.equal(edrHue("SALE+DESK", now), "graphite");
  assert.equal(edrHue("2026-11-10T12:00:00.000Z", now), "champagne");
  assert.equal(edrHue("2026-11-17T12:00:00.000Z", now), "graphite");
  assert.equal(edrSoon("ABCD", now), true);
  assert.equal(edrSoon("YES", now), false);
  assert.equal(edrSoon("MARKS", now), true);
  assert.equal(edrHue("Marble", now), "ivory");
  assert.equal(edrLength("yes"), 3);
  assert.equal(edrEven("ab"), true);
  assert.equal(edrFirst("Paris"), true);
  assert.equal(edrSpace("needs review"), true);
  assert.equal(edrVowel("Amsterdam"), true);
  assert.equal(edrDigit("Room4"), true);
  assert.equal(edrCapital("PARIS"), true);
  assert.equal(edrLower("paris"), true);
  assert.equal(edrUpper("SEALED"), true);
  assert.equal(edrUpper("HOT"), false);
  assert.equal(edrUpper("WARM"), false);
  const marks: CgnRow[] = [
    { id: "1", label: "Ada", code: "YES" },
    { id: "2", label: "Bea", code: "YES" },
    { id: "3", label: "Cara", code: "Marble" },
  ];
  assert.equal(leadingSel(marks), "hall");
  assert.match(edrLanesCsv(marks), /hall,2/);
  assert.match(edrRowsCsv(marks, ["1"]), /Ada,YES/);
  assert.equal(crmv4Text("tr", "tvsTitle"), ROUND363_COPY.tr.tvsTitle);
  assert.equal(crmv4Text("de", "edrTitle"), ROUND363_COPY.de.edrTitle);
  assert.equal(crmv4Text("ru", "bayCarceresKicker"), ROUND363_COPY.ru.bayCarceresKicker);
  assert.equal(crmv4Text("ar", "lsgSpinaLead"), ROUND363_COPY.ar.lsgSpinaLead);
  const keys = Object.keys(ROUND363_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND363_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-triovis/);
  assert.match(css, /\.c4-edrplate/);
  assert.match(css, /\.c4-triovis-column/);
  assert.match(css, /\.c4-edrplate-column/);
  assert.match(css, /\.c4-park-carceres/);
  assert.match(css, /\.c4-lead-spina/);
  assert.match(css, /\.c4-bay-carceres-mast/);
  assert.match(css, /\.c4-lsg-spina-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round363.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /canEditRates:/);
  assert.match(viewFile, /triovisCsv/);
  assert.match(viewFile, /edrRowsCsv/);
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
  assert.match(viewFile, /c4-edrplate-search/);
  assert.match(viewFile, /triovisTimeline/);
  assert.match(viewFile, /c4-triovis-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "tvs"/);
  assert.match(app, /view === "edr"/);
  const tags = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round118.tsx"), "utf8");
  assert.match(tags, /c4-park-carceres/);
  assert.match(tags, /c4-bay-carceres-mast/);
  assert.match(tags, /data-logo="mono"/);
  assert.match(tags, /bayCarceresKicker/);
  assert.match(tags, /bayCarceresLead/);
  assert.match(tags, /data-park-carceres/);
  const gallery = tags.slice(tags.indexOf("export function ParkingNotes"), tags.indexOf("export function LeadSources"));
  assert.equal(gallery.includes("amount"), false);
  assert.equal(gallery.includes("price"), false);
  assert.match(tags, /c4-lead-spina/);
  assert.match(tags, /c4-lsg-spina-mast/);
  assert.match(tags, /lsgSpinaKicker/);
  assert.match(tags, /lsgSpinaLead/);
  assert.match(tags, /data-lead-spina/);
  const porch = tags.slice(tags.indexOf("export function LeadSources"));
  assert.equal(porch.includes("amount"), false);
  assert.equal(porch.includes("profit"), false);
  assert.match(porch, /sourceText/);
  const namedKeys = `${viewFile}\n${tags}`.match(/"(tvs|edr|bayCarceres|lsgSpina)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND363_COPY.en[key as keyof typeof ROUND363_COPY.en], "string", key);
  console.log("crmv4 round363 tests passed");
}

main();
