/**
 * Horologium rules, ripple plates, the ivory lamp exedra, and the graphite broker fauces.
 * Run: TZ=UTC npx tsx tests/crmv4-round314.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND314_COPY } from "../src/lib/crmv4/copy-round314";
import {
  ROUND314_FEATURES,
  activeVane,
  activeNotch,
  activeStaff,
  activeWood,
  addHorologium,
  briskHorologium,
  dropHorologiumView,
  fairBearer,
  fullVane,
  rippleCapital,
  rippleDigit,
  rippleEven,
  rippleFirst,
  rippleFort,
  rippleHarbor,
  rippleHouse,
  rippleHue,
  rippleLanesCsv,
  rippleLength,
  rippleLower,
  rippleLane,
  rippleOpen,
  ripplePost,
  rippleRowsCsv,
  rippleScroll,
  rippleSpace,
  rippleSpark,
  rippleState,
  rippleTail,
  rippleUpper,
  rippleVowel,
  houseWood,
  idleHorologium,
  lateHorologium,
  leadingRipple,
  moveHorologiumFocus,
  horologiumBand,
  horologiumGap,
  horologiumVane,
  horologiumInner,
  horologiumOuter,
  horologiumNotch,
  horologiumStaff,
  horologiumWood,
  overdueHorologium,
  pairVane,
  readHorologiumViews,
  restingHorologium,
  suggestNotch,
  suggestStaff,
  suggestWood,
  type RippleRow,
  type Horologium,
} from "../src/lib/crmv4/round314";

function rule(partial: Partial<Horologium> & { id: string; title: string }): Horologium {
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
  assert.equal(ROUND314_FEATURES.length, 25);
  assert.equal(ROUND314_FEATURES.includes("ripple"), true);
  assert.equal(ROUND314_FEATURES.includes("drip"), true);
  assert.equal(ROUND314_FEATURES.includes("fair-keeper"), true);
  assert.equal(ROUND314_FEATURES.includes("chest"), true);
  assert.equal(ROUND314_FEATURES.includes("metal"), true);
  assert.equal(horologiumStaff(" basin "), "basin");
  assert.equal(horologiumStaff("brass"), "");
  assert.equal(horologiumNotch("5"), 5);
  assert.equal(horologiumNotch(10), 10);
  assert.equal(horologiumNotch(20), 20);
  assert.equal(horologiumNotch(40), 40);
  assert.equal(horologiumNotch("8"), null);
  assert.equal(horologiumVane("1"), 1);
  assert.equal(horologiumVane(3), 3);
  assert.equal(horologiumVane("9"), 9);
  assert.equal(horologiumVane("4"), null);
  assert.equal(horologiumWood("bronze"), "BRONZE");
  assert.equal(horologiumWood("glass"), "GLASS");
  assert.equal(horologiumWood("clay"), "CLAY");
  assert.equal(horologiumWood("hot"), "");
  assert.equal(horologiumInner("basin"), true);
  assert.equal(horologiumInner("SPOUT"), true);
  assert.equal(horologiumInner("float"), false);
  assert.equal(horologiumOuter("float"), true);
  assert.equal(horologiumOuter("tank"), true);
  assert.equal(horologiumOuter("basin"), false);
  assert.equal(horologiumBand("basin"), "bowl");
  assert.equal(horologiumBand("spout"), "jet");
  assert.equal(horologiumBand("float"), "bob");
  assert.equal(horologiumBand("tank"), "well");
  assert.equal(horologiumBand(""), "");
  assert.equal(horologiumGap("basin", "tank"), 3);
  assert.equal(horologiumGap("float", "nope"), null);
  assert.equal(houseWood("bronze"), true);
  assert.equal(houseWood("glass"), false);
  assert.equal(pairVane(3), true);
  assert.equal(pairVane(1), false);
  assert.equal(fullVane("9"), true);
  assert.equal(fullVane(3), false);
  assert.equal(activeStaff("inner"), "inner");
  assert.equal(activeStaff("float"), "float");
  assert.equal(activeStaff("gold"), "all");
  assert.equal(activeNotch("40"), "40");
  assert.equal(activeNotch("5"), "5");
  assert.equal(activeNotch("7"), "all");
  assert.equal(activeVane("1"), "1");
  assert.equal(activeVane("4"), "all");
  assert.equal(activeWood("clay", ["CLAY"]), "CLAY");
  assert.equal(activeWood("hot", ["CLAY"]), "all");
  assert.equal(moveHorologiumFocus(0, 3, -1), 2);
  assert.equal(moveHorologiumFocus(0, 0, 1), 0);

  const cards = [
    rule({ id: "a", title: "Ada", staff: "float", vane: 1, bearer: "Ned" }),
    rule({ id: "b", title: "Bea", staff: "basin", wood: "CLAY", notch: 40, vane: 9, bearer: "Ned" }),
    rule({ id: "c", title: "Cara", staff: "tank", wood: "GLASS", notch: 10, bearer: "Ida" }),
  ];
  assert.equal(overdueHorologium(cards[0]), true);
  assert.equal(briskHorologium(cards[1]), true);
  assert.equal(restingHorologium(cards[2]), true);
  assert.equal(idleHorologium(rule({ id: "i", title: "Idle", notch: 5, vane: 1 })), true);
  assert.equal(lateHorologium(cards[1], "tank"), true);
  assert.equal(lateHorologium(cards[1], "basin"), false);
  assert.equal(suggestWood([]), "CLAY");
  assert.equal(suggestWood(cards), "BRONZE");
  assert.equal(suggestNotch([], 3), 5);
  assert.equal(suggestNotch([], 6), 10);
  assert.equal(suggestNotch([], 11), 20);
  assert.equal(suggestNotch([], 16), 40);
  assert.equal(suggestNotch(cards, 6), 20);
  assert.equal(suggestStaff(6), "basin");
  assert.equal(suggestStaff(7), "tank");
  assert.equal(fairBearer(cards, "Ida,Ned"), "Ida");
  const saved = addHorologium([], { title: "Dora", staff: "float", wood: "glass", notch: "10", vane: "3", tags: "e f x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].wood, "GLASS");
  assert.equal(saved[0].notch, 10);
  assert.equal(saved[0].vane, 3);
  assert.equal(saved[0].tags.join(""), "ef");
  assert.equal(addHorologium(saved, { title: "Dora" }).length, 1);
  assert.equal(dropHorologiumView([{ id: "v", name: "Morning", tray: "yard", query: "", bearer: "", wood: "all", staff: "all", notch: "all", vane: "all" }], "v").length, 0);
  assert.equal(readHorologiumViews([{ id: "v", name: "Morning", tray: "rack" }])[0].tray, "rack");

  assert.equal(rippleHouse("LOCAL"), true);
  assert.equal(rippleHouse({ lastIp: true }), true);
  assert.equal(rippleHarbor({ lastIp: false }), true);
  assert.equal(rippleHouse({ lastIp: "loop" }), true);
  assert.equal(rippleFort("re-check"), true);
  assert.equal(rippleHarbor("needs review"), true);
  assert.equal(rippleSpark("US"), true);
  assert.equal(rippleSpark("NET"), true);
  assert.equal(rippleSpark("ABCD"), false);
  assert.equal(rippleScroll("VeryLongIpAddress"), true);
  assert.equal(rippleScroll("Constantinople"), false);
  assert.equal(rippleLane("12"), "spark");
  assert.equal(rippleLane("10.1.1.1"), "digit");
  assert.equal(rippleLane("Amsterdam"), "vowel");
  assert.equal(rippleLane("Paris"), "post");
  assert.equal(ripplePost("Paris"), true);
  assert.equal(rippleOpen(""), true);
  assert.equal(rippleOpen({ lastIp: "" }), true);
  assert.equal(rippleState({ name: "Ada" }), "");
  assert.equal(rippleState({ lastIp: "Paris", balance: 1 }), "");
  assert.equal(rippleHue("LOCAL"), "champagne");
  assert.equal(rippleHue("needs review"), "graphite");
  assert.equal(rippleHue("Amsterdam"), "ivory");
  assert.equal(rippleLength("hold"), 4);
  assert.equal(rippleEven("hold"), true);
  assert.equal(rippleFirst("Paris"), true);
  assert.equal(rippleSpace("needs review"), true);
  assert.equal(rippleVowel("Amsterdam"), true);
  assert.equal(rippleDigit("Room4"), true);
  assert.equal(rippleCapital("PARIS"), true);
  assert.equal(rippleLower("paris"), true);
  assert.equal(rippleUpper("HOUSEX"), true);
  assert.equal(rippleUpper("LOCAL"), false);
  assert.equal(rippleTail("Room4"), true);
  const marks: RippleRow[] = [
    { id: "1", label: "Ada", ripple: "LOCAL" },
    { id: "2", label: "Bea", ripple: "LOOP" },
    { id: "3", label: "Cara", ripple: "Paris" },
  ];
  assert.equal(leadingRipple(marks), "house");
  assert.match(rippleLanesCsv(marks), /house,2/);
  assert.match(rippleRowsCsv(marks, ["1"]), /Ada,LOCAL/);
  assert.equal(crmv4Text("tr", "ckdTitle"), ROUND314_COPY.tr.ckdTitle);
  assert.equal(crmv4Text("de", "rplTitle"), ROUND314_COPY.de.rplTitle);
  assert.equal(crmv4Text("ru", "lmpExedraKicker"), ROUND314_COPY.ru.lmpExedraKicker);
  assert.equal(crmv4Text("ar", "bknFaucesLead"), ROUND314_COPY.ar.bknFaucesLead);
  const keys = Object.keys(ROUND314_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND314_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-horologium/);
  assert.match(css, /\.c4-ripple/);
  assert.match(css, /\.c4-horologium-column/);
  assert.match(css, /\.c4-ripple-column/);
  assert.match(css, /\.c4-lamp-exedra/);
  assert.match(css, /\.c4-broker-fauces/);
  assert.match(css, /\.c4-lamp-exedra-mast/);
  assert.match(css, /\.c4-broker-fauces-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round314.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /lastIp:/);
  assert.match(viewFile, /horologiumCsv/);
  assert.match(viewFile, /rippleRowsCsv/);
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
  assert.match(viewFile, /c4-ripple-search/);
  assert.match(viewFile, /horologiumTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "ckd"/);
  assert.match(app, /view === "rpl"/);
  const lamp = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round134.tsx"), "utf8");
  assert.match(lamp, /c4-lamp-exedra/);
  assert.match(lamp, /c4-lamp-exedra-mast/);
  assert.match(lamp, /data-logo="mono"/);
  assert.match(lamp, /lmpExedraKicker/);
  assert.match(lamp, /lmpExedraLead/);
  assert.match(lamp, /data-lamp/);
  assert.equal(lamp.includes("amount"), false);
  assert.match(lamp, /c4-broker-fauces/);
  assert.match(lamp, /c4-broker-fauces-mast/);
  assert.match(lamp, /bknFaucesKicker/);
  assert.match(lamp, /bknFaucesLead/);
  assert.match(lamp, /data-broker/);
  assert.equal(lamp.includes("price"), false);
  assert.equal(lamp.includes("currency"), false);
  const namedKeys = `${viewFile}\n${lamp}`.match(/"(ckd|rpl|lmpExedra|bknFauces)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND314_COPY.en[key as keyof typeof ROUND314_COPY.en], "string", key);
  console.log("crmv4 round314 tests passed");
}

main();
