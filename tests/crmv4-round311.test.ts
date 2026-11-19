/**
 * Groma rules, pace plates, the ivory pantry apotheca, and the graphite coat apodyterium.
 * Run: TZ=UTC npx tsx tests/crmv4-round311.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND311_COPY } from "../src/lib/crmv4/copy-round311";
import {
  ROUND311_FEATURES,
  activeVane,
  activeNotch,
  activeStaff,
  activeWood,
  addGroma,
  briskGroma,
  dropGromaView,
  fairBearer,
  fullVane,
  paceCapital,
  paceDigit,
  paceEven,
  paceFirst,
  paceFort,
  paceHarbor,
  paceHouse,
  paceHue,
  paceLength,
  paceLower,
  paceLane,
  paceLanesCsv,
  paceOpen,
  pacePost,
  paceRowsCsv,
  paceScroll,
  paceSpace,
  paceSpark,
  paceState,
  paceTail,
  paceUpper,
  paceVowel,
  houseWood,
  idleGroma,
  lateGroma,
  leadingPace,
  moveGromaFocus,
  gromaBand,
  gromaGap,
  gromaVane,
  gromaInner,
  gromaOuter,
  gromaNotch,
  gromaStaff,
  gromaWood,
  overdueGroma,
  pairVane,
  readGromaViews,
  restingGroma,
  suggestNotch,
  suggestStaff,
  suggestWood,
  type PaceRow,
  type Groma,
} from "../src/lib/crmv4/round311";

function rule(partial: Partial<Groma> & { id: string; title: string }): Groma {
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
  assert.equal(ROUND311_FEATURES.length, 25);
  assert.equal(ROUND311_FEATURES.includes("pace"), true);
  assert.equal(ROUND311_FEATURES.includes("stake"), true);
  assert.equal(ROUND311_FEATURES.includes("fair-cross"), true);
  assert.equal(ROUND311_FEATURES.includes("cist"), true);
  assert.equal(gromaStaff(" cardo "), "cardo");
  assert.equal(gromaStaff("brass"), "");
  assert.equal(gromaNotch("3"), 3);
  assert.equal(gromaNotch(6), 6);
  assert.equal(gromaNotch(12), 12);
  assert.equal(gromaNotch(24), 24);
  assert.equal(gromaNotch("10"), null);
  assert.equal(gromaVane("2"), 2);
  assert.equal(gromaVane(4), 4);
  assert.equal(gromaVane("9"), 9);
  assert.equal(gromaVane("1"), null);
  assert.equal(gromaWood("bronze"), "BRONZE");
  assert.equal(gromaWood("iron"), "IRON");
  assert.equal(gromaWood("tin"), "TIN");
  assert.equal(gromaWood("hot"), "");
  assert.equal(gromaInner("cardo"), true);
  assert.equal(gromaInner("DECUMANUS"), true);
  assert.equal(gromaInner("via"), false);
  assert.equal(gromaOuter("via"), true);
  assert.equal(gromaOuter("limes"), true);
  assert.equal(gromaOuter("cardo"), false);
  assert.equal(gromaBand("cardo"), "square");
  assert.equal(gromaBand("decumanus"), "right");
  assert.equal(gromaBand("via"), "line");
  assert.equal(gromaBand("limes"), "bound");
  assert.equal(gromaBand(""), "");
  assert.equal(gromaGap("cardo", "limes"), 3);
  assert.equal(gromaGap("via", "nope"), null);
  assert.equal(houseWood("bronze"), true);
  assert.equal(houseWood("iron"), false);
  assert.equal(pairVane(4), true);
  assert.equal(pairVane(2), false);
  assert.equal(fullVane("9"), true);
  assert.equal(fullVane(4), false);
  assert.equal(activeStaff("inner"), "inner");
  assert.equal(activeStaff("via"), "via");
  assert.equal(activeStaff("gold"), "all");
  assert.equal(activeNotch("24"), "24");
  assert.equal(activeNotch("3"), "3");
  assert.equal(activeNotch("7"), "all");
  assert.equal(activeVane("2"), "2");
  assert.equal(activeVane("1"), "all");
  assert.equal(activeWood("tin", ["TIN"]), "TIN");
  assert.equal(activeWood("hot", ["TIN"]), "all");
  assert.equal(moveGromaFocus(0, 3, -1), 2);
  assert.equal(moveGromaFocus(0, 0, 1), 0);

  const cards = [
    rule({ id: "a", title: "Ada", staff: "via", vane: 2, bearer: "Ned" }),
    rule({ id: "b", title: "Bea", staff: "cardo", wood: "TIN", notch: 24, vane: 9, bearer: "Ned" }),
    rule({ id: "c", title: "Cara", staff: "limes", wood: "IRON", notch: 6, bearer: "Ida" }),
  ];
  assert.equal(overdueGroma(cards[0]), true);
  assert.equal(briskGroma(cards[1]), true);
  assert.equal(restingGroma(cards[2]), true);
  assert.equal(idleGroma(rule({ id: "i", title: "Idle", notch: 3, vane: 2 })), true);
  assert.equal(lateGroma(cards[1], "limes"), true);
  assert.equal(lateGroma(cards[1], "cardo"), false);
  assert.equal(suggestWood([]), "TIN");
  assert.equal(suggestWood(cards), "BRONZE");
  assert.equal(suggestNotch([], 3), 3);
  assert.equal(suggestNotch([], 5), 6);
  assert.equal(suggestNotch([], 10), 12);
  assert.equal(suggestNotch([], 14), 24);
  assert.equal(suggestNotch(cards, 6), 12);
  assert.equal(suggestStaff(5), "cardo");
  assert.equal(suggestStaff(6), "limes");
  assert.equal(fairBearer(cards, "Ida,Ned"), "Ida");
  const saved = addGroma([], { title: "Dora", staff: "via", wood: "iron", notch: "6", vane: "4", tags: "c d x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].wood, "IRON");
  assert.equal(saved[0].notch, 6);
  assert.equal(saved[0].vane, 4);
  assert.equal(saved[0].tags.join(""), "cd");
  assert.equal(addGroma(saved, { title: "Dora" }).length, 1);
  assert.equal(dropGromaView([{ id: "v", name: "Morning", tray: "yard", query: "", bearer: "", wood: "all", staff: "all", notch: "all", vane: "all" }], "v").length, 0);
  assert.equal(readGromaViews([{ id: "v", name: "Morning", tray: "rack" }])[0].tray, "rack");

  assert.equal(paceHouse("CHROME"), true);
  assert.equal(paceHouse({ lastBrowser: true }), true);
  assert.equal(paceHarbor({ lastBrowser: false }), true);
  assert.equal(paceHouse({ lastBrowser: "safari" }), true);
  assert.equal(paceFort("re-check"), true);
  assert.equal(paceHarbor("needs review"), true);
  assert.equal(paceSpark("US"), true);
  assert.equal(paceScroll("Constantinople"), true);
  assert.equal(paceLane("Amsterdam"), "vowel");
  assert.equal(paceLane("Paris"), "post");
  assert.equal(pacePost("Paris"), true);
  assert.equal(paceOpen(""), true);
  assert.equal(paceOpen({ lastBrowser: "" }), true);
  assert.equal(paceState({ name: "Ada" }), "");
  assert.equal(paceState({ lastBrowser: "Paris", balance: 1 }), "");
  assert.equal(paceHue("CHROME"), "champagne");
  assert.equal(paceHue("needs review"), "graphite");
  assert.equal(paceHue("Amsterdam"), "ivory");
  assert.equal(paceLength("hold"), 4);
  assert.equal(paceEven("hold"), true);
  assert.equal(paceFirst("Paris"), true);
  assert.equal(paceSpace("needs review"), true);
  assert.equal(paceVowel("Amsterdam"), true);
  assert.equal(paceDigit("Room4"), true);
  assert.equal(paceCapital("PARIS"), true);
  assert.equal(paceLower("paris"), true);
  assert.equal(paceUpper("HOUSE"), true);
  const marks: PaceRow[] = [
    { id: "1", label: "Ada", pace: "CHROME" },
    { id: "2", label: "Bea", pace: "SAFARI" },
    { id: "3", label: "Cara", pace: "Paris" },
  ];
  assert.equal(leadingPace(marks), "house");
  assert.match(paceLanesCsv(marks), /house,2/);
  assert.match(paceRowsCsv(marks, ["1"]), /Ada,CHROME/);
  assert.equal(crmv4Text("tr", "gmaTitle"), ROUND311_COPY.tr.gmaTitle);
  assert.equal(crmv4Text("de", "pcsTitle"), ROUND311_COPY.de.pcsTitle);
  assert.equal(crmv4Text("ru", "pntApothecaKicker"), ROUND311_COPY.ru.pntApothecaKicker);
  assert.equal(crmv4Text("ar", "cctApodyteriumLead"), ROUND311_COPY.ar.cctApodyteriumLead);
  const keys = Object.keys(ROUND311_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND311_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-groma/);
  assert.match(css, /\.c4-pace/);
  assert.match(css, /\.c4-groma-column/);
  assert.match(css, /\.c4-pace-column/);
  assert.match(css, /\.c4-pantry-apotheca/);
  assert.match(css, /\.c4-coat-apodyterium/);
  assert.match(css, /\.c4-pantry-apotheca-mast/);
  assert.match(css, /\.c4-coat-apodyterium-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round311.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /lastBrowser:/);
  assert.match(viewFile, /gromaCsv/);
  assert.match(viewFile, /paceRowsCsv/);
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
  assert.match(viewFile, /c4-pace-search/);
  assert.match(viewFile, /gromaTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "gma"/);
  assert.match(app, /view === "pcs"/);
  const pantry = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round128.tsx"), "utf8");
  assert.match(pantry, /c4-pantry-apotheca/);
  assert.match(pantry, /c4-pantry-apotheca-mast/);
  assert.match(pantry, /data-logo="mono"/);
  assert.match(pantry, /pntApothecaKicker/);
  assert.match(pantry, /pntApothecaLead/);
  assert.match(pantry, /data-pantry/);
  assert.equal(pantry.includes("amount"), false);
  const coat = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round129.tsx"), "utf8");
  assert.match(coat, /c4-coat-apodyterium/);
  assert.match(coat, /c4-coat-apodyterium-mast/);
  assert.match(coat, /cctApodyteriumKicker/);
  assert.match(coat, /cctApodyteriumLead/);
  assert.match(coat, /data-coat/);
  assert.equal(coat.includes("price"), false);
  assert.equal(coat.includes("amount"), false);
  assert.equal(coat.includes("currency"), false);
  const namedKeys = `${viewFile}\n${pantry}\n${coat}`.match(/"(gma|pcs|pntApotheca|cctApodyterium)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND311_COPY.en[key as keyof typeof ROUND311_COPY.en], "string", key);
  console.log("crmv4 round311 tests passed");
}

main();
