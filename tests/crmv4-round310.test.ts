/**
 * Chorobates rules, datum plates, the ivory break caldarium, and the graphite lounge triclinium.
 * Run: TZ=UTC npx tsx tests/crmv4-round310.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND310_COPY } from "../src/lib/crmv4/copy-round310";
import {
  ROUND310_FEATURES,
  activeVane,
  activeNotch,
  activeStaff,
  activeWood,
  addChorobates,
  briskChorobates,
  dropChorobatesView,
  fairBearer,
  fullVane,
  datumCapital,
  datumDigit,
  datumEven,
  datumFirst,
  datumFort,
  datumHarbor,
  datumHouse,
  datumHue,
  datumLength,
  datumLower,
  datumLane,
  datumLanesCsv,
  datumOpen,
  datumPost,
  datumRowsCsv,
  datumScroll,
  datumSpace,
  datumSpark,
  datumState,
  datumTail,
  datumUpper,
  datumVowel,
  houseWood,
  idleChorobates,
  lateChorobates,
  leadingDatum,
  moveChorobatesFocus,
  chorobatesBand,
  chorobatesGap,
  chorobatesVane,
  chorobatesInner,
  chorobatesOuter,
  chorobatesNotch,
  chorobatesStaff,
  chorobatesWood,
  overdueChorobates,
  pairVane,
  readChorobatesViews,
  restingChorobates,
  suggestNotch,
  suggestStaff,
  suggestWood,
  type DatumRow,
  type Chorobates,
} from "../src/lib/crmv4/round310";

function rule(partial: Partial<Chorobates> & { id: string; title: string }): Chorobates {
  return {
    note: "",
    bearer: "",
    staff: "",
    notch: null,
    wood: "",
    vane: 1,
    tags: [],
    sighted: false,
    racked: false,
    cased: false,
    starred: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND310_FEATURES.length, 25);
  assert.equal(ROUND310_FEATURES.includes("datum"), true);
  assert.equal(ROUND310_FEATURES.includes("peg"), true);
  assert.equal(ROUND310_FEATURES.includes("fair-beam"), true);
  assert.equal(ROUND310_FEATURES.includes("chest"), true);
  assert.equal(chorobatesStaff(" beam "), "beam");
  assert.equal(chorobatesStaff("brass"), "");
  assert.equal(chorobatesNotch("4"), 4);
  assert.equal(chorobatesNotch(8), 8);
  assert.equal(chorobatesNotch(16), 16);
  assert.equal(chorobatesNotch(32), 32);
  assert.equal(chorobatesNotch("10"), null);
  assert.equal(chorobatesVane("1"), 1);
  assert.equal(chorobatesVane(5), 5);
  assert.equal(chorobatesVane("8"), 8);
  assert.equal(chorobatesVane("9"), null);
  assert.equal(chorobatesWood("ash"), "ASH");
  assert.equal(chorobatesWood("elm"), "ELM");
  assert.equal(chorobatesWood("box"), "BOX");
  assert.equal(chorobatesWood("hot"), "");
  assert.equal(chorobatesInner("beam"), true);
  assert.equal(chorobatesInner("SILL"), true);
  assert.equal(chorobatesInner("pier"), false);
  assert.equal(chorobatesOuter("pier"), true);
  assert.equal(chorobatesOuter("arch"), true);
  assert.equal(chorobatesOuter("beam"), false);
  assert.equal(chorobatesBand("beam"), "level");
  assert.equal(chorobatesBand("sill"), "plumb");
  assert.equal(chorobatesBand("pier"), "cord");
  assert.equal(chorobatesBand("arch"), "stake");
  assert.equal(chorobatesBand(""), "");
  assert.equal(chorobatesGap("beam", "arch"), 3);
  assert.equal(chorobatesGap("pier", "nope"), null);
  assert.equal(houseWood("ash"), true);
  assert.equal(houseWood("elm"), false);
  assert.equal(pairVane(5), true);
  assert.equal(pairVane(1), false);
  assert.equal(fullVane("8"), true);
  assert.equal(fullVane(5), false);
  assert.equal(activeStaff("inner"), "inner");
  assert.equal(activeStaff("pier"), "pier");
  assert.equal(activeStaff("gold"), "all");
  assert.equal(activeNotch("32"), "32");
  assert.equal(activeNotch("4"), "4");
  assert.equal(activeNotch("7"), "all");
  assert.equal(activeVane("1"), "1");
  assert.equal(activeVane("9"), "all");
  assert.equal(activeWood("box", ["BOX"]), "BOX");
  assert.equal(activeWood("hot", ["BOX"]), "all");
  assert.equal(moveChorobatesFocus(0, 3, -1), 2);
  assert.equal(moveChorobatesFocus(0, 0, 1), 0);

  const cards = [
    rule({ id: "a", title: "Ada", staff: "pier", vane: 1, bearer: "Ned" }),
    rule({ id: "b", title: "Bea", staff: "beam", wood: "BOX", notch: 32, vane: 8, bearer: "Ned" }),
    rule({ id: "c", title: "Cara", staff: "arch", wood: "ELM", notch: 8, bearer: "Ida" }),
  ];
  assert.equal(overdueChorobates(cards[0]), true);
  assert.equal(briskChorobates(cards[1]), true);
  assert.equal(restingChorobates(cards[2]), true);
  assert.equal(idleChorobates(rule({ id: "i", title: "Idle", notch: 4, vane: 1 })), true);
  assert.equal(lateChorobates(cards[1], "arch"), true);
  assert.equal(lateChorobates(cards[1], "beam"), false);
  assert.equal(suggestWood([]), "BOX");
  assert.equal(suggestWood(cards), "ASH");
  assert.equal(suggestNotch([], 3), 4);
  assert.equal(suggestNotch([], 5), 8);
  assert.equal(suggestNotch([], 10), 16);
  assert.equal(suggestNotch([], 14), 32);
  assert.equal(suggestNotch(cards, 6), 16);
  assert.equal(suggestStaff(6), "beam");
  assert.equal(suggestStaff(7), "arch");
  assert.equal(fairBearer(cards, "Ida,Ned"), "Ida");
  const saved = addChorobates([], { title: "Dora", staff: "pier", wood: "elm", notch: "8", vane: "5", tags: "a e x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].wood, "ELM");
  assert.equal(saved[0].notch, 8);
  assert.equal(saved[0].vane, 5);
  assert.equal(saved[0].tags.join(""), "ae");
  assert.equal(addChorobates(saved, { title: "Dora" }).length, 1);
  assert.equal(dropChorobatesView([{ id: "v", name: "Morning", tray: "yard", query: "", bearer: "", wood: "all", staff: "all", notch: "all", vane: "all" }], "v").length, 0);
  assert.equal(readChorobatesViews([{ id: "v", name: "Morning", tray: "rack" }])[0].tray, "rack");

  assert.equal(datumHouse("HOUSE"), true);
  assert.equal(datumHouse({ campaign: true }), true);
  assert.equal(datumHarbor({ campaign: false }), true);
  assert.equal(datumHouse({ campaign: "partner" }), true);
  assert.equal(datumFort("re-check"), true);
  assert.equal(datumHarbor("needs review"), true);
  assert.equal(datumSpark("US"), true);
  assert.equal(datumScroll("Constantinople"), true);
  assert.equal(datumLane("Amsterdam"), "vowel");
  assert.equal(datumLane("Paris"), "post");
  assert.equal(datumPost("Paris"), true);
  assert.equal(datumOpen(""), true);
  assert.equal(datumOpen({ campaign: "" }), true);
  assert.equal(datumState({ name: "Ada" }), "");
  assert.equal(datumState({ campaign: "Paris", balance: 1 }), "");
  assert.equal(datumHue("HOUSE"), "champagne");
  assert.equal(datumHue("needs review"), "graphite");
  assert.equal(datumHue("Amsterdam"), "ivory");
  assert.equal(datumLength("hold"), 4);
  assert.equal(datumEven("hold"), true);
  assert.equal(datumFirst("Paris"), true);
  assert.equal(datumSpace("needs review"), true);
  assert.equal(datumVowel("Amsterdam"), true);
  assert.equal(datumDigit("Room4"), true);
  assert.equal(datumCapital("PARIS"), true);
  assert.equal(datumLower("paris"), true);
  assert.equal(datumUpper("HOUSE"), true);
  const marks: DatumRow[] = [
    { id: "1", label: "Ada", datum: "HOUSE" },
    { id: "2", label: "Bea", datum: "PARTNER" },
    { id: "3", label: "Cara", datum: "Paris" },
  ];
  assert.equal(leadingDatum(marks), "house");
  assert.match(datumLanesCsv(marks), /house,2/);
  assert.match(datumRowsCsv(marks, ["1"]), /Ada,HOUSE/);
  assert.equal(crmv4Text("tr", "chbTitle"), ROUND310_COPY.tr.chbTitle);
  assert.equal(crmv4Text("de", "dtmTitle"), ROUND310_COPY.de.dtmTitle);
  assert.equal(crmv4Text("ru", "brkCaldariumKicker"), ROUND310_COPY.ru.brkCaldariumKicker);
  assert.equal(crmv4Text("ar", "lngTricliniumLead"), ROUND310_COPY.ar.lngTricliniumLead);
  const keys = Object.keys(ROUND310_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND310_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-chorobates/);
  assert.match(css, /\.c4-datum/);
  assert.match(css, /\.c4-chorobates-column/);
  assert.match(css, /\.c4-datum-column/);
  assert.match(css, /\.c4-break-caldarium/);
  assert.match(css, /\.c4-lounge-triclinium/);
  assert.match(css, /\.c4-break-caldarium-mast/);
  assert.match(css, /\.c4-lounge-triclinium-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round310.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /campaign:/);
  assert.match(viewFile, /chorobatesCsv/);
  assert.match(viewFile, /datumRowsCsv/);
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
  assert.match(viewFile, /suggestWood/);
  assert.match(viewFile, /c4-datum-search/);
  assert.match(viewFile, /chorobatesTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "chb"/);
  assert.match(app, /view === "dtm"/);
  const pause = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round126.tsx"), "utf8");
  assert.match(pause, /c4-break-caldarium/);
  assert.match(pause, /c4-break-caldarium-mast/);
  assert.match(pause, /data-logo="mono"/);
  assert.match(pause, /brkCaldariumKicker/);
  assert.match(pause, /brkCaldariumLead/);
  assert.match(pause, /data-break/);
  assert.equal(pause.includes("amount"), false);
  const lounge = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round127.tsx"), "utf8");
  assert.match(lounge, /c4-lounge-triclinium/);
  assert.match(lounge, /c4-lounge-triclinium-mast/);
  assert.match(lounge, /lngTricliniumKicker/);
  assert.match(lounge, /lngTricliniumLead/);
  assert.match(lounge, /data-lounge/);
  assert.equal(lounge.includes("price"), false);
  assert.equal(lounge.includes("amount"), false);
  assert.equal(lounge.includes("currency"), false);
  const namedKeys = `${viewFile}\n${pause}\n${lounge}`.match(/"(chb|dtm|brkCaldarium|lngTriclinium)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND310_COPY.en[key as keyof typeof ROUND310_COPY.en], "string", key);
  console.log("crmv4 round310 tests passed");
}

main();
