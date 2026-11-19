/**
 * Kamal rules, meridian plates, the ivory mail tholos, and the graphite reception clerestory.
 * Run: TZ=UTC npx tsx tests/crmv4-round308.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND308_COPY } from "../src/lib/crmv4/copy-round308";
import {
  ROUND308_FEATURES,
  activePin,
  activeSpan,
  activeQuarter,
  activeFinish,
  addKamal,
  briskKamal,
  dropKamalView,
  fairSighter,
  fullPin,
  meridianCapital,
  meridianDigit,
  meridianEven,
  meridianFirst,
  meridianFort,
  meridianHarbor,
  meridianHouse,
  meridianHue,
  meridianLength,
  meridianLower,
  meridianLane,
  meridianLanesCsv,
  meridianOpen,
  meridianPost,
  meridianRowsCsv,
  meridianScroll,
  meridianSpace,
  meridianSpark,
  meridianState,
  meridianTail,
  meridianUpper,
  meridianVowel,
  houseFinish,
  idleKamal,
  lateKamal,
  leadingMeridian,
  moveKamalFocus,
  kamalBand,
  kamalGap,
  kamalPin,
  kamalInner,
  kamalOuter,
  kamalSpan,
  kamalQuarter,
  kamalCloth,
  overdueKamal,
  pairPin,
  readKamalViews,
  restingKamal,
  suggestSpan,
  suggestQuarter,
  suggestFinish,
  type MeridianRow,
  type Kamal,
} from "../src/lib/crmv4/round308";

function rule(partial: Partial<Kamal> & { id: string; title: string }): Kamal {
  return {
    note: "",
    sighter: "",
    quarter: "",
    span: null,
    finish: "",
    pin: 1,
    tags: [],
    laid: false,
    locked: false,
    held: false,
    starred: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND308_FEATURES.length, 25);
  assert.equal(ROUND308_FEATURES.includes("meridian"), true);
  assert.equal(ROUND308_FEATURES.includes("knot"), true);
  assert.equal(ROUND308_FEATURES.includes("fair-board"), true);
  assert.equal(ROUND308_FEATURES.includes("chest"), true);
  assert.equal(kamalQuarter(" palm "), "palm");
  assert.equal(kamalQuarter("brass"), "");
  assert.equal(kamalSpan("4"), 4);
  assert.equal(kamalSpan(8), 8);
  assert.equal(kamalSpan(16), 16);
  assert.equal(kamalSpan(32), 32);
  assert.equal(kamalSpan("12"), null);
  assert.equal(kamalPin("1"), 1);
  assert.equal(kamalPin(5), 5);
  assert.equal(kamalPin("7"), 7);
  assert.equal(kamalPin("2"), null);
  assert.equal(kamalCloth("hemp"), "HEMP");
  assert.equal(kamalCloth("flax"), "FLAX");
  assert.equal(kamalCloth("wire"), "WIRE");
  assert.equal(kamalCloth("hot"), "");
  assert.equal(kamalInner("palm"), true);
  assert.equal(kamalInner("FIST"), true);
  assert.equal(kamalInner("cubit"), false);
  assert.equal(kamalOuter("cubit"), true);
  assert.equal(kamalOuter("fathom"), true);
  assert.equal(kamalOuter("palm"), false);
  assert.equal(kamalBand("palm"), "hand");
  assert.equal(kamalBand("fist"), "knuckle");
  assert.equal(kamalBand("cubit"), "forearm");
  assert.equal(kamalBand("fathom"), "arm");
  assert.equal(kamalBand(""), "");
  assert.equal(kamalGap("palm", "fathom"), 3);
  assert.equal(kamalGap("cubit", "nope"), null);
  assert.equal(houseFinish("hemp"), true);
  assert.equal(houseFinish("flax"), false);
  assert.equal(pairPin(5), true);
  assert.equal(pairPin(1), false);
  assert.equal(fullPin("7"), true);
  assert.equal(fullPin(5), false);
  assert.equal(activeQuarter("inner"), "inner");
  assert.equal(activeQuarter("cubit"), "cubit");
  assert.equal(activeQuarter("gold"), "all");
  assert.equal(activeSpan("32"), "32");
  assert.equal(activeSpan("4"), "4");
  assert.equal(activeSpan("7"), "all");
  assert.equal(activePin("1"), "1");
  assert.equal(activePin("2"), "all");
  assert.equal(activeFinish("wire", ["WIRE"]), "WIRE");
  assert.equal(activeFinish("hot", ["WIRE"]), "all");
  assert.equal(moveKamalFocus(0, 3, -1), 2);
  assert.equal(moveKamalFocus(0, 0, 1), 0);

  const cards = [
    rule({ id: "a", title: "Ada", quarter: "cubit", pin: 1, sighter: "Ned" }),
    rule({ id: "b", title: "Bea", quarter: "palm", finish: "WIRE", span: 32, pin: 7, sighter: "Ned" }),
    rule({ id: "c", title: "Cara", quarter: "fathom", finish: "FLAX", span: 8, sighter: "Ida" }),
  ];
  assert.equal(overdueKamal(cards[0]), true);
  assert.equal(briskKamal(cards[1]), true);
  assert.equal(restingKamal(cards[2]), true);
  assert.equal(idleKamal(rule({ id: "i", title: "Idle", span: 4, pin: 1 })), true);
  assert.equal(lateKamal(cards[1], "fathom"), true);
  assert.equal(lateKamal(cards[1], "palm"), false);
  assert.equal(suggestFinish([]), "WIRE");
  assert.equal(suggestFinish(cards), "HEMP");
  assert.equal(suggestSpan([], 4), 4);
  assert.equal(suggestSpan([], 5), 8);
  assert.equal(suggestSpan([], 9), 16);
  assert.equal(suggestSpan([], 14), 32);
  assert.equal(suggestSpan(cards, 6), 16);
  assert.equal(suggestQuarter(7), "palm");
  assert.equal(suggestQuarter(8), "fathom");
  assert.equal(fairSighter(cards, "Ida,Ned"), "Ida");
  const saved = addKamal([], { title: "Dora", quarter: "cubit", finish: "flax", span: "8", pin: "5", tags: "k m x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].finish, "FLAX");
  assert.equal(saved[0].span, 8);
  assert.equal(saved[0].pin, 5);
  assert.equal(saved[0].tags.join(""), "km");
  assert.equal(addKamal(saved, { title: "Dora" }).length, 1);
  assert.equal(dropKamalView([{ id: "v", name: "Morning", tray: "face", query: "", sighter: "", finish: "all", quarter: "all", span: "all", pin: "all" }], "v").length, 0);
  assert.equal(readKamalViews([{ id: "v", name: "Morning", tray: "sleeve" }])[0].tray, "sleeve");

  assert.equal(meridianHouse("TURKEY"), true);
  assert.equal(meridianHouse({ country: true }), true);
  assert.equal(meridianHarbor({ country: false }), true);
  assert.equal(meridianHouse({ country: "germany" }), true);
  assert.equal(meridianFort("re-check"), true);
  assert.equal(meridianHarbor("needs review"), true);
  assert.equal(meridianSpark("US"), true);
  assert.equal(meridianScroll("Constantinople"), true);
  assert.equal(meridianLane("Amsterdam"), "vowel");
  assert.equal(meridianLane("Paris"), "post");
  assert.equal(meridianPost("Paris"), true);
  assert.equal(meridianOpen(""), true);
  assert.equal(meridianOpen({ country: "" }), true);
  assert.equal(meridianState({ name: "Ada" }), "");
  assert.equal(meridianState({ country: "Paris", balance: 1 }), "");
  assert.equal(meridianHue("TURKEY"), "champagne");
  assert.equal(meridianHue("needs review"), "graphite");
  assert.equal(meridianHue("Amsterdam"), "ivory");
  assert.equal(meridianLength("hold"), 4);
  assert.equal(meridianEven("hold"), true);
  assert.equal(meridianFirst("Paris"), true);
  assert.equal(meridianSpace("needs review"), true);
  assert.equal(meridianVowel("Amsterdam"), true);
  assert.equal(meridianDigit("Room4"), true);
  assert.equal(meridianCapital("PARIS"), true);
  assert.equal(meridianLower("paris"), true);
  assert.equal(meridianUpper("TURKEY"), true);
  assert.equal(meridianTail("Room4"), true);
  const marks: MeridianRow[] = [
    { id: "1", label: "Ada", meridian: "TURKEY" },
    { id: "2", label: "Bea", meridian: "GERMANY" },
    { id: "3", label: "Cara", meridian: "Paris" },
  ];
  assert.equal(leadingMeridian(marks), "house");
  assert.match(meridianLanesCsv(marks), /house,2/);
  assert.match(meridianRowsCsv(marks, ["1"]), /Ada,TURKEY/);
  assert.equal(crmv4Text("tr", "kmlTitle"), ROUND308_COPY.tr.kmlTitle);
  assert.equal(crmv4Text("de", "mdnTitle"), ROUND308_COPY.de.mdnTitle);
  assert.equal(crmv4Text("ru", "mlrTholosKicker"), ROUND308_COPY.ru.mlrTholosKicker);
  assert.equal(crmv4Text("ar", "rxnClerestoryLead"), ROUND308_COPY.ar.rxnClerestoryLead);
  const keys = Object.keys(ROUND308_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND308_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-kamal/);
  assert.match(css, /\.c4-meridian/);
  assert.match(css, /\.c4-kamal-column/);
  assert.match(css, /\.c4-meridian-column/);
  assert.match(css, /\.c4-mail-tholos/);
  assert.match(css, /\.c4-reception-clerestory/);
  assert.match(css, /\.c4-mail-tholos-mast/);
  assert.match(css, /\.c4-reception-clerestory-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round308.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /country:/);
  assert.match(viewFile, /kamalCsv/);
  assert.match(viewFile, /meridianRowsCsv/);
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
  assert.match(viewFile, /c4-meridian-search/);
  assert.match(viewFile, /kamalTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "kml"/);
  assert.match(app, /view === "mdn"/);
  const mail = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round122.tsx"), "utf8");
  assert.match(mail, /c4-mail-tholos/);
  assert.match(mail, /c4-mail-tholos-mast/);
  assert.match(mail, /data-logo="mono"/);
  assert.match(mail, /mlrTholosKicker/);
  assert.match(mail, /mlrTholosLead/);
  assert.match(mail, /data-mail-room/);
  assert.equal(mail.includes("amount"), false);
  const desk = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round123.tsx"), "utf8");
  assert.match(desk, /c4-reception-clerestory/);
  assert.match(desk, /c4-reception-clerestory-mast/);
  assert.match(desk, /rxnClerestoryKicker/);
  assert.match(desk, /rxnClerestoryLead/);
  assert.match(desk, /data-reception/);
  assert.equal(desk.includes("price"), false);
  assert.equal(desk.includes("amount"), false);
  assert.equal(desk.includes("currency"), false);
  const namedKeys = `${viewFile}\n${mail}\n${desk}`.match(/"(kml|mdn|mlrTholos|rxnClerestory)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND308_COPY.en[key as keyof typeof ROUND308_COPY.en], "string", key);
  console.log("crmv4 round308 tests passed");
}

main();
