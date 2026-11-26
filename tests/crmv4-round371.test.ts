/**
 * Basse-taille pits, sale stage plates, the ivory document pastoforion, and the graphite audit synthronon.
 * Run: TZ=UTC npx tsx tests/crmv4-round371.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND371_COPY } from "../src/lib/crmv4/copy-round371";
import { ROUND370_FEATURES } from "../src/lib/crmv4/round370";
import {
  ROUND371_FEATURES,
  activeFinish,
  activeMode,
  activeHour,
  activeHammer,
  addBasse,
  briskBasse,
  dropBasseView,
  fairKeeper,
  sspHome,
  sspDesk,
  sspBrief,
  sspDigit,
  sspEven,
  sspFirst,
  sspRoute,
  sspHue,
  sspJoin,
  sspCitizen,
  sspLane,
  sspLanesCsv,
  sspLength,
  sspLower,
  sspGuest,
  sspAway,
  sspOpen,
  sspPlain,
  sspLong,
  sspRowsCsv,
  sspSoon,
  sspSpace,
  sspState,
  sspUpper,
  sspVowel,
  fullHammer,
  idleBasse,
  lateBasse,
  leadingSel,
  moveBasseFocus,
  basseBand,
  basseHour,
  basseGap,
  basseInner,
  basseMode,
  basseOuter,
  basseHammer,
  basseFilm,
  basseTimeline,
  overdueBasse,
  pairHammer,
  quietFinish,
  readBasseViews,
  reminderBasseCards,
  restingBasse,
  suggestFinish,
  suggestMode,
  suggestHour,
  type SspRow,
  type Basse,
} from "../src/lib/crmv4/round371";

function rule(partial: Partial<Basse> & { id: string; title: string }): Basse {
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
  assert.equal(ROUND371_FEATURES.length, 25);
  assert.equal(ROUND371_FEATURES.includes("sale-stage-plate"), true);
  assert.equal(ROUND371_FEATURES.includes("pit-heat-sla"), true);
  assert.equal(ROUND371_FEATURES.includes("fair-engraver"), true);
  assert.equal(ROUND371_FEATURES.includes("pit-archive"), true);
  assert.equal(ROUND371_FEATURES.includes("pit-reminders"), true);
  assert.equal(ROUND371_FEATURES.includes("basse-search"), true);
  assert.equal(ROUND371_FEATURES.includes("pit-timeline"), true);
  for (const feature of ROUND371_FEATURES) assert.equal((ROUND370_FEATURES as readonly string[]).includes(feature), false, feature);
  assert.equal(basseMode(" bed "), "bed");
  assert.equal(basseMode("brass"), "");
  assert.equal(basseHour("2"), 2);
  assert.equal(basseHour(5), 5);
  assert.equal(basseHour(10), 10);
  assert.equal(basseHour(20), 20);
  assert.equal(basseHour("4"), null);
  assert.equal(basseHour("8"), null);
  assert.equal(basseHammer("2"), 2);
  assert.equal(basseHammer(4), 4);
  assert.equal(basseHammer("8"), 8);
  assert.equal(basseHammer("3"), null);
  assert.equal(basseHammer("6"), null);
  assert.equal(basseFilm("glaze"), "GLAZE");
  assert.equal(basseFilm("ivory"), "IVORY");
  assert.equal(basseFilm("graphite"), "GRAPHITE");
  assert.equal(basseFilm("soot"), "");
  assert.equal(basseInner("bed"), true);
  assert.equal(basseInner("GROUND"), true);
  assert.equal(basseInner("lip"), false);
  assert.equal(basseOuter("lip"), true);
  assert.equal(basseOuter("crest"), true);
  assert.equal(basseOuter("bed"), false);
  assert.equal(basseBand("bed"), "basin");
  assert.equal(basseBand("ground"), "meadow");
  assert.equal(basseBand("lip"), "edge");
  assert.equal(basseBand("crest"), "crown");
  assert.equal(basseGap("bed", "crest"), 3);
  assert.equal(quietFinish("graphite"), true);
  assert.equal(quietFinish("ivory"), false);
  assert.equal(quietFinish("glaze"), false);
  assert.equal(pairHammer(4), true);
  assert.equal(pairHammer(2), false);
  assert.equal(fullHammer(8), true);
  assert.equal(fullHammer(4), false);
  assert.equal(activeMode("inner"), "inner");
  assert.equal(activeHour("2"), "2");
  assert.equal(activeHour("4"), "all");
  assert.equal(activeHammer("8"), "8");
  assert.equal(activeHammer("3"), "all");
  assert.equal(activeFinish("glaze", ["GLAZE"]), "GLAZE");
  assert.equal(suggestMode(4), "bed");
  assert.equal(suggestMode(12), "crest");
  assert.equal(suggestHour([], 1), 2);
  assert.equal(suggestHour([], 3), 5);
  assert.equal(suggestHour([], 7), 10);
  assert.equal(suggestHour([], 15), 20);
  assert.equal(suggestFinish([]), "IVORY");
  assert.equal(moveBasseFocus(0, 3, 1), 1);
  assert.equal(moveBasseFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", piece: "bed" });
  const due = rule({ id: "b", title: "Bea", piece: "lip", lock: 2 });
  const quiet = rule({ id: "c", title: "Cara", drop: 2, lock: 2 });
  const cell = rule({ id: "d", title: "Dora", film: "GLAZE", drop: 20, lock: 8 });
  const fax = rule({ id: "e", title: "Eve", piece: "crest", film: "IVORY", drop: 5 });
  assert.equal(lateBasse(late, "crest"), true);
  assert.equal(lateBasse(late, "bed"), false);
  assert.equal(overdueBasse(due), true);
  assert.equal(idleBasse(quiet), true);
  assert.equal(briskBasse(cell), true);
  assert.equal(restingBasse(fax), true);
  assert.deepEqual(reminderBasseCards([due, late]), ["Bea"]);
  assert.equal(fairKeeper([rule({ id: "1", title: "One", setter: "Ada" }), rule({ id: "2", title: "Two", setter: "Bea" }), rule({ id: "3", title: "Three", setter: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", drop: 5 }), rule({ id: "2", title: "East", drop: 2 })];
  assert.match(basseTimeline(cards).map((mail) => mail.drop).join(","), /5/);
  const saved = addBasse([], { title: "Ada", piece: "ground", drop: "5", film: "glaze", lock: "4", tags: "b t x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].piece, "ground");
  assert.equal(saved[0].drop, 5);
  assert.equal(saved[0].lock, 4);
  assert.deepEqual(saved[0].tags, ["b", "t"]);
  assert.equal(addBasse(saved, { title: "Ada" }).length, 1);
  assert.equal(addBasse([], { title: "Eve" })[0].lock, 2);
  assert.equal(dropBasseView([{ id: "v", name: "Morning", tray: "board", query: "", setter: "", film: "all", piece: "all", drop: "all", lock: "all" }], "v").length, 0);
  assert.equal(readBasseViews([{ id: "v", name: "Morning", tray: "peg" }])[0].tray, "peg");

  const now = Date.parse("2026-11-20T12:00:00.000Z");
  assert.equal(sspHome("HOT", now), true);
  assert.equal(sspHome("YES", now), true);
  assert.equal(sspDesk("CALL", now), true);
  assert.equal(sspHome("2026-11-20T01:00:00.000Z", now), true);
  assert.equal(sspAway("quiet book", now), true);
  assert.equal(sspGuest("NEW", now), true);
  assert.equal(sspCitizen("LOST", now), true);
  assert.equal(sspDesk("2026-11-19T18:00:00.000Z", now), true);
  assert.equal(sspHome({ saleStatus: true }, now), true);
  assert.equal(sspHome({ saleStatus: "2026-11-20T08:00:00.000Z" }, now), true);
  assert.equal(sspPlain({ saleStatus: false }, now), true);
  assert.equal(sspAway({ saleStatus: false }, now), false);
  assert.equal(sspPlain({ saleStatus: "Granite" }, now), true);
  assert.equal(sspHome({ saleStatus: "Granite" }, now), false);
  assert.equal(sspBrief({ saleStatus: "PLATE" }, now), true);
  assert.equal(sspJoin("LIVE&BOOK", now), true);
  assert.equal(sspJoin("ANNA NOAH", now), false);
  assert.equal(sspRoute("SALE/EAST", now), true);
  assert.equal(sspRoute("SETHOLD", now), false);
  assert.equal(sspBrief("ADDRESS", now), false);
  assert.equal(sspBrief("PLATE", now), true);
  assert.equal(sspLong("GraphiteXYZ", now), true);
  assert.equal(sspLong("GraphiteXY", now), false);
  assert.equal(sspLane("HOT", now), "hall");
  assert.equal(sspLane("CALL", now), "desk");
  assert.equal(sspLane("NEW", now), "hold");
  assert.equal(sspLane("LOST", now), "guest");
  assert.equal(sspLane("PAIR", now), "join");
  assert.equal(sspLane("2026-11-19T12:00:00.000Z", now), "desk");
  assert.equal(sspLane("2026-11-15T12:00:00.000Z", now), "hold");
  assert.equal(sspLane("2026-11-10T12:00:00.000Z", now), "guest");
  assert.equal(sspLane("Granite", now), "plain");
  assert.equal(sspLane("PLATE", now), "brief");
  assert.equal(sspLane("4ROOM", now), "stamp");
  assert.equal(sspLane("Amsterdam", now), "vowel");
  assert.equal(sspLane("quiet book", now), "vacant");
  assert.equal(sspLane("alpha/beta/gamma", now), "route");
  assert.equal(sspLane("clear file", now), "hall");
  assert.equal(sspOpen(""), true);
  assert.equal(sspOpen({ saleStatus: "" }), true);
  assert.equal(sspState({ name: "Ada" }), "");
  assert.equal(sspState({ saleStatus: "HOT", balance: 1 }), "");
  assert.equal(sspHue("HOT", now), "champagne");
  assert.equal(sspHue("PAIR&FILE", now), "champagne");
  assert.equal(sspHue("NEW", now), "ivory");
  assert.equal(sspHue("CALL", now), "graphite");
  assert.equal(sspSoon("PLATE", now), true);
  assert.equal(sspSoon("HOT", now), false);
  assert.equal(sspSoon("ABCDEFG", now), true);
  assert.equal(sspSoon("AB", now), false);
  assert.equal(sspHue("Granite", now), "ivory");
  assert.equal(sspLength("yes"), 3);
  assert.equal(sspEven("ab"), true);
  assert.equal(sspFirst("Paris"), true);
  assert.equal(sspSpace("needs review"), true);
  assert.equal(sspVowel("Amsterdam"), true);
  assert.equal(sspDigit("Room4"), true);
  assert.equal(sspLower("paris"), true);
  assert.equal(sspUpper("ADDRESS"), true);
  assert.equal(sspUpper("ID"), false);
  assert.equal(sspUpper("CLEAR"), false);
  const marks: SspRow[] = [
    { id: "1", label: "Ada", code: "HOT" },
    { id: "2", label: "Bea", code: "HOT" },
    { id: "3", label: "Cara", code: "Granite" },
  ];
  assert.equal(leadingSel(marks), "hall");
  assert.match(sspLanesCsv(marks), /hall,2/);
  assert.match(sspRowsCsv(marks, ["1"]), /Ada,HOT/);
  assert.equal(crmv4Text("tr", "btlTitle"), ROUND371_COPY.tr.btlTitle);
  assert.equal(crmv4Text("de", "sspTitle"), ROUND371_COPY.de.sspTitle);
  assert.equal(crmv4Text("ru", "ksPastoforionKicker"), ROUND371_COPY.ru.ksPastoforionKicker);
  assert.equal(crmv4Text("ar", "auSynthrononLead"), ROUND371_COPY.ar.auSynthrononLead);
  const keys = Object.keys(ROUND371_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND371_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-basse/);
  assert.match(css, /\.c4-sspplate/);
  assert.match(css, /\.c4-basse-column/);
  assert.match(css, /\.c4-sspplate-column/);
  assert.match(css, /\.c4-ks-pastoforion/);
  assert.match(css, /\.c4-au-synthronon/);
  assert.match(css, /\.c4-ks-pastoforion-mast/);
  assert.match(css, /\.c4-au-synthronon-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round371.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /saleStatus:/);
  assert.match(viewFile, /basseCsv/);
  assert.match(viewFile, /sspRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestFinish/);
  assert.match(viewFile, /c4-sspplate-search/);
  assert.match(viewFile, /basseTimeline/);
  assert.match(viewFile, /c4-basse-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "btl"/);
  assert.match(app, /view === "ssp"/);
  const studio = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round37.tsx"), "utf8");
  assert.match(studio, /c4-ks-pastoforion/);
  assert.match(studio, /c4-ks-pastoforion-mast/);
  assert.match(studio, /data-logo="mono"/);
  assert.match(studio, /ksPastoforionKicker/);
  assert.match(studio, /ksPastoforionLead/);
  assert.match(studio, /data-ks-pastoforion/);
  assert.match(studio, /c4-au-synthronon/);
  assert.match(studio, /c4-au-synthronon-mast/);
  assert.match(studio, /auSynthrononKicker/);
  assert.match(studio, /auSynthrononLead/);
  assert.match(studio, /data-au-synthronon/);
  assert.match(studio, /aria-required=\{false\}/);
  assert.equal(studio.includes("amount"), false);
  assert.equal(studio.includes("balance"), false);
  const namedKeys = `${viewFile}\n${studio}`.match(/"(btl|ssp|ksPastoforion|auSynthronon)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND371_COPY.en[key as keyof typeof ROUND371_COPY.en], "string", key);
  console.log("crmv4 round371 tests passed");
}

main();
