/**
 * Overcoil rules, torquetum plates, the ivory kiln figlina, and the graphite handle armamentarium.
 * Run: TZ=UTC npx tsx tests/crmv4-round333.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND333_COPY } from "../src/lib/crmv4/copy-round333";
import {
  ROUND333_FEATURES,
  activeBeat,
  activeFilm,
  activeLimb,
  activeRate,
  addOvercoil,
  briskOvercoil,
  dropOvercoilView,
  torquetumBead,
  torquetumCapital,
  torquetumDigit,
  torquetumEven,
  torquetumFirst,
  torquetumGap,
  torquetumHold,
  torquetumHue,
  torquetumJoin,
  torquetumLane,
  torquetumLanesCsv,
  torquetumLength,
  torquetumLive,
  torquetumLower,
  torquetumOpen,
  torquetumPlain,
  torquetumRest,
  torquetumRibbon,
  torquetumRowsCsv,
  torquetumSpace,
  torquetumState,
  torquetumUpper,
  torquetumVowel,
  torquetumWatch,
  fairMaker,
  fullRate,
  overcoilBand,
  overcoilBeat,
  overcoilFilm,
  overcoilGap,
  overcoilInner,
  overcoilLimb,
  overcoilOuter,
  overcoilRate,
  overcoilTimeline,
  idleOvercoil,
  lateOvercoil,
  leadingTorquetum,
  moveOvercoilFocus,
  overdueOvercoil,
  pairRate,
  quietFilm,
  readOvercoilViews,
  reminderOvercoilRules,
  restingOvercoil,
  suggestBeat,
  suggestFilm,
  suggestLimb,
  type TorquetumRow,
  type Overcoil,
} from "../src/lib/crmv4/round333";

function rule(partial: Partial<Overcoil> & { id: string; title: string }): Overcoil {
  return {
    note: "",
    maker: "",
    limb: "",
    beat: null,
    film: "",
    rate: 2,
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
  assert.equal(ROUND333_FEATURES.length, 25);
  assert.equal(ROUND333_FEATURES.includes("active-torquetum"), true);
  assert.equal(ROUND333_FEATURES.includes("rate-sla"), true);
  assert.equal(ROUND333_FEATURES.includes("fair-maker"), true);
  assert.equal(ROUND333_FEATURES.includes("casket"), true);
  assert.equal(ROUND333_FEATURES.includes("coil-notices"), true);
  assert.equal(ROUND333_FEATURES.includes("coil-search"), true);
  assert.equal(ROUND333_FEATURES.includes("arc-timeline"), true);
  assert.equal(overcoilLimb(" coil "), "coil");
  assert.equal(overcoilLimb("brass"), "");
  assert.equal(overcoilBeat("4"), 4);
  assert.equal(overcoilBeat(8), 8);
  assert.equal(overcoilBeat(16), 16);
  assert.equal(overcoilBeat(24), 24);
  assert.equal(overcoilBeat("3"), null);
  assert.equal(overcoilRate("2"), 2);
  assert.equal(overcoilRate(6), 6);
  assert.equal(overcoilRate("10"), 10);
  assert.equal(overcoilRate("3"), null);
  assert.equal(overcoilFilm("gilt"), "GILT");
  assert.equal(overcoilFilm("ivory"), "IVORY");
  assert.equal(overcoilFilm("graphite"), "GRAPHITE");
  assert.equal(overcoilFilm("hot"), "");
  assert.equal(overcoilInner("coil"), true);
  assert.equal(overcoilInner("COLLET"), true);
  assert.equal(overcoilInner("stud"), false);
  assert.equal(overcoilOuter("stud"), true);
  assert.equal(overcoilOuter("terminal"), true);
  assert.equal(overcoilOuter("coil"), false);
  assert.equal(overcoilBand("coil"), "spiral");
  assert.equal(overcoilBand("collet"), "boss");
  assert.equal(overcoilBand("stud"), "pin");
  assert.equal(overcoilBand("terminal"), "end");
  assert.equal(overcoilGap("coil", "terminal"), 3);
  assert.equal(quietFilm("ivory"), true);
  assert.equal(quietFilm("gilt"), false);
  assert.equal(pairRate(6), true);
  assert.equal(pairRate(2), false);
  assert.equal(fullRate(10), true);
  assert.equal(fullRate(6), false);
  assert.equal(activeLimb("inner"), "inner");
  assert.equal(activeBeat("8"), "8");
  assert.equal(activeRate("10"), "10");
  assert.equal(activeBeat("3"), "all");
  assert.equal(activeRate("3"), "all");
  assert.equal(activeFilm("gilt", ["GILT"]), "GILT");
  assert.equal(suggestLimb(7), "coil");
  assert.equal(suggestLimb(10), "terminal");
  assert.equal(suggestBeat([], 3), 4);
  assert.equal(suggestBeat([], 8), 8);
  assert.equal(suggestBeat([], 12), 16);
  assert.equal(suggestBeat([], 20), 24);
  assert.equal(suggestFilm([]), "GRAPHITE");
  assert.equal(moveOvercoilFocus(0, 3, 1), 1);
  assert.equal(moveOvercoilFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", limb: "coil" });
  const due = rule({ id: "b", title: "Bea", limb: "stud", rate: 2 });
  const quiet = rule({ id: "c", title: "Cara", beat: 4, rate: 2 });
  const live = rule({ id: "d", title: "Dora", film: "GILT", beat: 24, rate: 10 });
  const rest = rule({ id: "e", title: "Eve", limb: "terminal", film: "IVORY", beat: 8 });
  assert.equal(lateOvercoil(late, "terminal"), true);
  assert.equal(lateOvercoil(late, "coil"), false);
  assert.equal(overdueOvercoil(due), true);
  assert.equal(idleOvercoil(quiet), true);
  assert.equal(briskOvercoil(live), true);
  assert.equal(restingOvercoil(rest), true);
  assert.deepEqual(reminderOvercoilRules([due, late]), ["Bea"]);
  assert.equal(fairMaker([rule({ id: "1", title: "One", maker: "Ada" }), rule({ id: "2", title: "Two", maker: "Bea" }), rule({ id: "3", title: "Three", maker: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", beat: 24 }), rule({ id: "2", title: "East", beat: 8 })];
  assert.match(overcoilTimeline(cards).map((lane) => lane.beat).join(","), /24|8/);
  const saved = addOvercoil([], { title: "Ada", limb: "collet", beat: "8", film: "gilt", rate: "6", tags: "c s x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].limb, "collet");
  assert.equal(saved[0].beat, 8);
  assert.equal(saved[0].rate, 6);
  assert.deepEqual(saved[0].tags, ["c", "s"]);
  assert.equal(addOvercoil(saved, { title: "Ada" }).length, 1);
  assert.equal(addOvercoil([], { title: "Eve" })[0].rate, 2);
  assert.equal(dropOvercoilView([{ id: "v", name: "Morning", tray: "board", query: "", maker: "", film: "all", limb: "all", beat: "all", rate: "all" }], "v").length, 0);
  assert.equal(readOvercoilViews([{ id: "v", name: "Morning", tray: "peg" }])[0].tray, "peg");

  assert.equal(torquetumLive("live"), true);
  assert.equal(torquetumLive("LIVE"), true);
  assert.equal(torquetumHold("HOLD"), true);
  assert.equal(torquetumWatch("WATCH"), true);
  assert.equal(torquetumRest("REST"), true);
  assert.equal(torquetumLive({ active: true }), true);
  assert.equal(torquetumHold({ active: false }), true);
  assert.equal(torquetumPlain({ active: "plain" }), true);
  assert.equal(torquetumLive({ active: "plain" }), false);
  assert.equal(torquetumJoin("LIVE&HOLD"), true);
  assert.equal(torquetumJoin("LIVE HOLD"), false);
  assert.equal(torquetumGap("LIVE;HOLD"), true);
  assert.equal(torquetumGap("LIVEHOLD"), false);
  assert.equal(torquetumBead("London"), true);
  assert.equal(torquetumBead("LIVE"), false);
  assert.equal(torquetumRibbon("Abcdefghijklmnopqr"), true);
  assert.equal(torquetumRibbon("Amsterdam"), false);
  assert.equal(torquetumLane("LIVE"), "live");
  assert.equal(torquetumLane("London"), "bead");
  assert.equal(torquetumLane("Letters"), "plain");
  assert.equal(torquetumLane("10language"), "mark");
  assert.equal(torquetumLane("Amsterdam"), "vowel");
  assert.equal(torquetumOpen(""), true);
  assert.equal(torquetumOpen({ active: "" }), true);
  assert.equal(torquetumState({ name: "Ada" }), "");
  assert.equal(torquetumState({ active: "Paris", balance: 1 }), "");
  assert.equal(torquetumHue("LIVE"), "champagne");
  assert.equal(torquetumHue("LIVE&HOLD"), "graphite");
  assert.equal(torquetumHue("Letters"), "ivory");
  assert.equal(torquetumLength("hold"), 4);
  assert.equal(torquetumEven("hold"), true);
  assert.equal(torquetumFirst("Paris"), true);
  assert.equal(torquetumSpace("needs review"), true);
  assert.equal(torquetumVowel("Amsterdam"), true);
  assert.equal(torquetumDigit("Room4"), true);
  assert.equal(torquetumCapital("PARIS"), true);
  assert.equal(torquetumLower("paris"), true);
  assert.equal(torquetumUpper("LIVE"), true);
  assert.equal(torquetumUpper("EN"), false);
  const marks: TorquetumRow[] = [
    { id: "1", label: "Ada", code: "LIVE" },
    { id: "2", label: "Bea", code: "LIVE" },
    { id: "3", label: "Cara", code: "Paris" },
  ];
  assert.equal(leadingTorquetum(marks), "live");
  assert.match(torquetumLanesCsv(marks), /live,2/);
  assert.match(torquetumRowsCsv(marks, ["1"]), /Ada,LIVE/);
  assert.equal(crmv4Text("tr", "ovcTitle"), ROUND333_COPY.tr.ovcTitle);
  assert.equal(crmv4Text("de", "tqmTitle"), ROUND333_COPY.de.tqmTitle);
  assert.equal(crmv4Text("ru", "klnFiglinaKicker"), ROUND333_COPY.ru.klnFiglinaKicker);
  assert.equal(crmv4Text("ar", "hdlArmamentariumLead"), ROUND333_COPY.ar.hdlArmamentariumLead);
  const keys = Object.keys(ROUND333_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND333_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-overcoil/);
  assert.match(css, /\.c4-torquetum/);
  assert.match(css, /\.c4-overcoil-column/);
  assert.match(css, /\.c4-torquetum-column/);
  assert.match(css, /\.c4-kln-figlina/);
  assert.match(css, /\.c4-hdl-armamentarium/);
  assert.match(css, /\.c4-kln-figlina-mast/);
  assert.match(css, /\.c4-hdl-armamentarium-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round333.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /active/);
  assert.match(viewFile, /overcoilCsv/);
  assert.match(viewFile, /torquetumRowsCsv/);
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
  assert.match(viewFile, /suggestFilm/);
  assert.match(viewFile, /c4-torquetum-search/);
  assert.match(viewFile, /overcoilTimeline/);
  assert.match(viewFile, /c4-overcoil-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "ovc"/);
  assert.match(app, /view === "tqm"/);
  const host = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round153.tsx"), "utf8");
  assert.match(host, /c4-kln-figlina/);
  assert.match(host, /c4-kln-figlina-mast/);
  assert.match(host, /data-logo="mono"/);
  assert.match(host, /klnFiglinaKicker/);
  assert.match(host, /klnFiglinaLead/);
  assert.match(host, /data-kiln/);
  assert.equal(host.includes("amount"), false);
  assert.match(host, /c4-hdl-armamentarium/);
  assert.match(host, /c4-hdl-armamentarium-mast/);
  assert.match(host, /hdlArmamentariumKicker/);
  assert.match(host, /hdlArmamentariumLead/);
  assert.match(host, /data-handles/);
  assert.equal(host.includes("currency"), false);
  assert.equal(host.includes("saleStatus"), false);
  const namedKeys = `${viewFile}\n${host}`.match(/"(ovc|tqm|klnFiglina|hdlArmamentarium)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND333_COPY.en[key as keyof typeof ROUND333_COPY.en], "string", key);
  console.log("crmv4 round333 tests passed");
}

main();
