/**
 * Scaphe rules, shade plates, the ivory porter oecus, and the graphite bell andron.
 * Run: TZ=UTC npx tsx tests/crmv4-round313.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND313_COPY } from "../src/lib/crmv4/copy-round313";
import {
  ROUND313_FEATURES,
  activeVane,
  activeNotch,
  activeStaff,
  activeWood,
  addScaphe,
  briskScaphe,
  dropScapheView,
  fairBearer,
  fullVane,
  shadeCapital,
  shadeDigit,
  shadeEven,
  shadeFirst,
  shadeFort,
  shadeHarbor,
  shadeHouse,
  shadeHue,
  shadeLanesCsv,
  shadeLength,
  shadeLower,
  shadeLane,
  shadeOpen,
  shadePost,
  shadeRowsCsv,
  shadeScroll,
  shadeSpace,
  shadeSpark,
  shadeState,
  shadeTail,
  shadeUpper,
  shadeVowel,
  houseWood,
  idleScaphe,
  lateScaphe,
  leadingShade,
  moveScapheFocus,
  scapheBand,
  scapheGap,
  scapheVane,
  scapheInner,
  scapheOuter,
  scapheNotch,
  scapheStaff,
  scapheWood,
  overdueScaphe,
  pairVane,
  readScapheViews,
  restingScaphe,
  suggestNotch,
  suggestStaff,
  suggestWood,
  type ShadeRow,
  type Scaphe,
} from "../src/lib/crmv4/round313";

function rule(partial: Partial<Scaphe> & { id: string; title: string }): Scaphe {
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
  assert.equal(ROUND313_FEATURES.length, 25);
  assert.equal(ROUND313_FEATURES.includes("shade"), true);
  assert.equal(ROUND313_FEATURES.includes("hour"), true);
  assert.equal(ROUND313_FEATURES.includes("fair-bowl"), true);
  assert.equal(ROUND313_FEATURES.includes("vault"), true);
  assert.equal(scapheStaff(" lip "), "lip");
  assert.equal(scapheStaff("brass"), "");
  assert.equal(scapheNotch("6"), 6);
  assert.equal(scapheNotch(9), 9);
  assert.equal(scapheNotch(12), 12);
  assert.equal(scapheNotch(15), 15);
  assert.equal(scapheNotch("8"), null);
  assert.equal(scapheVane("2"), 2);
  assert.equal(scapheVane(4), 4);
  assert.equal(scapheVane("8"), 8);
  assert.equal(scapheVane("5"), null);
  assert.equal(scapheWood("marble"), "MARBLE");
  assert.equal(scapheWood("slate"), "SLATE");
  assert.equal(scapheWood("chalk"), "CHALK");
  assert.equal(scapheWood("hot"), "");
  assert.equal(scapheInner("lip"), true);
  assert.equal(scapheInner("BOWL"), true);
  assert.equal(scapheInner("pin"), false);
  assert.equal(scapheOuter("pin"), true);
  assert.equal(scapheOuter("well"), true);
  assert.equal(scapheOuter("lip"), false);
  assert.equal(scapheBand("lip"), "rim");
  assert.equal(scapheBand("bowl"), "cup");
  assert.equal(scapheBand("pin"), "style");
  assert.equal(scapheBand("well"), "base");
  assert.equal(scapheBand(""), "");
  assert.equal(scapheGap("lip", "well"), 3);
  assert.equal(scapheGap("pin", "nope"), null);
  assert.equal(houseWood("marble"), true);
  assert.equal(houseWood("slate"), false);
  assert.equal(pairVane(4), true);
  assert.equal(pairVane(2), false);
  assert.equal(fullVane("8"), true);
  assert.equal(fullVane(4), false);
  assert.equal(activeStaff("inner"), "inner");
  assert.equal(activeStaff("pin"), "pin");
  assert.equal(activeStaff("gold"), "all");
  assert.equal(activeNotch("15"), "15");
  assert.equal(activeNotch("6"), "6");
  assert.equal(activeNotch("7"), "all");
  assert.equal(activeVane("2"), "2");
  assert.equal(activeVane("5"), "all");
  assert.equal(activeWood("chalk", ["CHALK"]), "CHALK");
  assert.equal(activeWood("hot", ["CHALK"]), "all");
  assert.equal(moveScapheFocus(0, 3, -1), 2);
  assert.equal(moveScapheFocus(0, 0, 1), 0);

  const cards = [
    rule({ id: "a", title: "Ada", staff: "pin", vane: 2, bearer: "Ned" }),
    rule({ id: "b", title: "Bea", staff: "lip", wood: "CHALK", notch: 15, vane: 8, bearer: "Ned" }),
    rule({ id: "c", title: "Cara", staff: "well", wood: "SLATE", notch: 9, bearer: "Ida" }),
  ];
  assert.equal(overdueScaphe(cards[0]), true);
  assert.equal(briskScaphe(cards[1]), true);
  assert.equal(restingScaphe(cards[2]), true);
  assert.equal(idleScaphe(rule({ id: "i", title: "Idle", notch: 6, vane: 2 })), true);
  assert.equal(lateScaphe(cards[1], "well"), true);
  assert.equal(lateScaphe(cards[1], "lip"), false);
  assert.equal(suggestWood([]), "CHALK");
  assert.equal(suggestWood(cards), "MARBLE");
  assert.equal(suggestNotch([], 3), 6);
  assert.equal(suggestNotch([], 5), 9);
  assert.equal(suggestNotch([], 10), 12);
  assert.equal(suggestNotch([], 14), 15);
  assert.equal(suggestNotch(cards, 6), 12);
  assert.equal(suggestStaff(5), "lip");
  assert.equal(suggestStaff(6), "well");
  assert.equal(fairBearer(cards, "Ida,Ned"), "Ida");
  const saved = addScaphe([], { title: "Dora", staff: "pin", wood: "slate", notch: "9", vane: "4", tags: "a b x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].wood, "SLATE");
  assert.equal(saved[0].notch, 9);
  assert.equal(saved[0].vane, 4);
  assert.equal(saved[0].tags.join(""), "ab");
  assert.equal(addScaphe(saved, { title: "Dora" }).length, 1);
  assert.equal(dropScapheView([{ id: "v", name: "Morning", tray: "yard", query: "", bearer: "", wood: "all", staff: "all", notch: "all", vane: "all" }], "v").length, 0);
  assert.equal(readScapheViews([{ id: "v", name: "Morning", tray: "rack" }])[0].tray, "rack");

  assert.equal(shadeHouse("NORTH"), true);
  assert.equal(shadeHouse({ deskId: true }), true);
  assert.equal(shadeHarbor({ deskId: false }), true);
  assert.equal(shadeHouse({ deskId: "south" }), true);
  assert.equal(shadeFort("re-check"), true);
  assert.equal(shadeHarbor("needs review"), true);
  assert.equal(shadeSpark("US"), true);
  assert.equal(shadeScroll("Constantinople"), true);
  assert.equal(shadeLane("Amsterdam"), "vowel");
  assert.equal(shadeLane("Paris"), "post");
  assert.equal(shadePost("Paris"), true);
  assert.equal(shadeOpen(""), true);
  assert.equal(shadeOpen({ deskId: "" }), true);
  assert.equal(shadeState({ name: "Ada" }), "");
  assert.equal(shadeState({ deskId: "Paris", balance: 1 }), "");
  assert.equal(shadeHue("NORTH"), "champagne");
  assert.equal(shadeHue("needs review"), "graphite");
  assert.equal(shadeHue("Amsterdam"), "ivory");
  assert.equal(shadeLength("hold"), 4);
  assert.equal(shadeEven("hold"), true);
  assert.equal(shadeFirst("Paris"), true);
  assert.equal(shadeSpace("needs review"), true);
  assert.equal(shadeVowel("Amsterdam"), true);
  assert.equal(shadeDigit("Room4"), true);
  assert.equal(shadeCapital("PARIS"), true);
  assert.equal(shadeLower("paris"), true);
  assert.equal(shadeUpper("HOUSE"), true);
  const marks: ShadeRow[] = [
    { id: "1", label: "Ada", shade: "NORTH" },
    { id: "2", label: "Bea", shade: "SOUTH" },
    { id: "3", label: "Cara", shade: "Paris" },
  ];
  assert.equal(leadingShade(marks), "house");
  assert.match(shadeLanesCsv(marks), /house,2/);
  assert.match(shadeRowsCsv(marks, ["1"]), /Ada,NORTH/);
  assert.equal(crmv4Text("tr", "scpTitle"), ROUND313_COPY.tr.scpTitle);
  assert.equal(crmv4Text("de", "shdTitle"), ROUND313_COPY.de.shdTitle);
  assert.equal(crmv4Text("ru", "prtOecusKicker"), ROUND313_COPY.ru.prtOecusKicker);
  assert.equal(crmv4Text("ar", "bllAndronLead"), ROUND313_COPY.ar.bllAndronLead);
  const keys = Object.keys(ROUND313_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND313_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-scaphe/);
  assert.match(css, /\.c4-shade/);
  assert.match(css, /\.c4-scaphe-column/);
  assert.match(css, /\.c4-shade-column/);
  assert.match(css, /\.c4-porter-oecus/);
  assert.match(css, /\.c4-bell-andron/);
  assert.match(css, /\.c4-porter-oecus-mast/);
  assert.match(css, /\.c4-bell-andron-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round313.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /deskId:/);
  assert.match(viewFile, /scapheCsv/);
  assert.match(viewFile, /shadeRowsCsv/);
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
  assert.match(viewFile, /c4-shade-search/);
  assert.match(viewFile, /scapheTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "scp"/);
  assert.match(app, /view === "shd"/);
  const porter = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round132.tsx"), "utf8");
  assert.match(porter, /c4-porter-oecus/);
  assert.match(porter, /c4-porter-oecus-mast/);
  assert.match(porter, /data-logo="mono"/);
  assert.match(porter, /prtOecusKicker/);
  assert.match(porter, /prtOecusLead/);
  assert.match(porter, /data-porter/);
  assert.equal(porter.includes("amount"), false);
  const bell = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round133.tsx"), "utf8");
  assert.match(bell, /c4-bell-andron/);
  assert.match(bell, /c4-bell-andron-mast/);
  assert.match(bell, /bllAndronKicker/);
  assert.match(bell, /bllAndronLead/);
  assert.match(bell, /data-bell/);
  assert.equal(bell.includes("price"), false);
  assert.equal(bell.includes("amount"), false);
  assert.equal(bell.includes("currency"), false);
  const namedKeys = `${viewFile}\n${porter}\n${bell}`.match(/"(scp|shd|prtOecus|bllAndron)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND313_COPY.en[key as keyof typeof ROUND313_COPY.en], "string", key);
    console.log("crmv4 round313 tests passed");
}

main();
