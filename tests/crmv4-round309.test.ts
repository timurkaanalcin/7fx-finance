/**
 * Baculus rules, azimuth plates, the ivory supply cryptoporticus, and the graphite room diaeta.
 * Run: TZ=UTC npx tsx tests/crmv4-round309.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND309_COPY } from "../src/lib/crmv4/copy-round309";
import {
  ROUND309_FEATURES,
  activeVane,
  activeNotch,
  activeStaff,
  activeWood,
  addBaculus,
  briskBaculus,
  dropBaculusView,
  fairBearer,
  fullVane,
  azimuthCapital,
  azimuthDigit,
  azimuthEven,
  azimuthFirst,
  azimuthFort,
  azimuthHarbor,
  azimuthHouse,
  azimuthHue,
  azimuthLength,
  azimuthLower,
  azimuthLane,
  azimuthLanesCsv,
  azimuthOpen,
  azimuthPost,
  azimuthRowsCsv,
  azimuthScroll,
  azimuthSpace,
  azimuthSpark,
  azimuthState,
  azimuthTail,
  azimuthUpper,
  azimuthVowel,
  houseWood,
  idleBaculus,
  lateBaculus,
  leadingAzimuth,
  moveBaculusFocus,
  baculusBand,
  baculusGap,
  baculusVane,
  baculusInner,
  baculusOuter,
  baculusNotch,
  baculusStaff,
  baculusWood,
  overdueBaculus,
  pairVane,
  readBaculusViews,
  restingBaculus,
  suggestNotch,
  suggestStaff,
  suggestWood,
  type AzimuthRow,
  type Baculus,
} from "../src/lib/crmv4/round309";

function rule(partial: Partial<Baculus> & { id: string; title: string }): Baculus {
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
  assert.equal(ROUND309_FEATURES.length, 25);
  assert.equal(ROUND309_FEATURES.includes("azimuth"), true);
  assert.equal(ROUND309_FEATURES.includes("notch"), true);
  assert.equal(ROUND309_FEATURES.includes("fair-staff"), true);
  assert.equal(ROUND309_FEATURES.includes("case"), true);
  assert.equal(baculusStaff(" reed "), "reed");
  assert.equal(baculusStaff("brass"), "");
  assert.equal(baculusNotch("3"), 3);
  assert.equal(baculusNotch(6), 6);
  assert.equal(baculusNotch(12), 12);
  assert.equal(baculusNotch(24), 24);
  assert.equal(baculusNotch("10"), null);
  assert.equal(baculusVane("2"), 2);
  assert.equal(baculusVane(4), 4);
  assert.equal(baculusVane("9"), 9);
  assert.equal(baculusVane("8"), null);
  assert.equal(baculusWood("lime"), "LIME");
  assert.equal(baculusWood("yew"), "YEW");
  assert.equal(baculusWood("oak"), "OAK");
  assert.equal(baculusWood("hot"), "");
  assert.equal(baculusInner("reed"), true);
  assert.equal(baculusInner("WAND"), true);
  assert.equal(baculusInner("pole"), false);
  assert.equal(baculusOuter("pole"), true);
  assert.equal(baculusOuter("mast"), true);
  assert.equal(baculusOuter("reed"), false);
  assert.equal(baculusBand("reed"), "stem");
  assert.equal(baculusBand("wand"), "switch");
  assert.equal(baculusBand("pole"), "shaft");
  assert.equal(baculusBand("mast"), "spar");
  assert.equal(baculusBand(""), "");
  assert.equal(baculusGap("reed", "mast"), 3);
  assert.equal(baculusGap("pole", "nope"), null);
  assert.equal(houseWood("lime"), true);
  assert.equal(houseWood("yew"), false);
  assert.equal(pairVane(4), true);
  assert.equal(pairVane(2), false);
  assert.equal(fullVane("9"), true);
  assert.equal(fullVane(4), false);
  assert.equal(activeStaff("inner"), "inner");
  assert.equal(activeStaff("pole"), "pole");
  assert.equal(activeStaff("gold"), "all");
  assert.equal(activeNotch("24"), "24");
  assert.equal(activeNotch("3"), "3");
  assert.equal(activeNotch("7"), "all");
  assert.equal(activeVane("2"), "2");
  assert.equal(activeVane("8"), "all");
  assert.equal(activeWood("oak", ["OAK"]), "OAK");
  assert.equal(activeWood("hot", ["OAK"]), "all");
  assert.equal(moveBaculusFocus(0, 3, -1), 2);
  assert.equal(moveBaculusFocus(0, 0, 1), 0);

  const cards = [
    rule({ id: "a", title: "Ada", staff: "pole", vane: 2, bearer: "Ned" }),
    rule({ id: "b", title: "Bea", staff: "reed", wood: "OAK", notch: 24, vane: 9, bearer: "Ned" }),
    rule({ id: "c", title: "Cara", staff: "mast", wood: "YEW", notch: 6, bearer: "Ida" }),
  ];
  assert.equal(overdueBaculus(cards[0]), true);
  assert.equal(briskBaculus(cards[1]), true);
  assert.equal(restingBaculus(cards[2]), true);
  assert.equal(idleBaculus(rule({ id: "i", title: "Idle", notch: 3, vane: 2 })), true);
  assert.equal(lateBaculus(cards[1], "mast"), true);
  assert.equal(lateBaculus(cards[1], "reed"), false);
  assert.equal(suggestWood([]), "OAK");
  assert.equal(suggestWood(cards), "LIME");
  assert.equal(suggestNotch([], 4), 3);
  assert.equal(suggestNotch([], 5), 6);
  assert.equal(suggestNotch([], 9), 12);
  assert.equal(suggestNotch([], 14), 24);
  assert.equal(suggestNotch(cards, 6), 12);
  assert.equal(suggestStaff(7), "reed");
  assert.equal(suggestStaff(8), "mast");
  assert.equal(fairBearer(cards, "Ida,Ned"), "Ida");
  const saved = addBaculus([], { title: "Dora", staff: "pole", wood: "yew", notch: "6", vane: "4", tags: "b c x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].wood, "YEW");
  assert.equal(saved[0].notch, 6);
  assert.equal(saved[0].vane, 4);
  assert.equal(saved[0].tags.join(""), "bc");
  assert.equal(addBaculus(saved, { title: "Dora" }).length, 1);
  assert.equal(dropBaculusView([{ id: "v", name: "Morning", tray: "yard", query: "", bearer: "", wood: "all", staff: "all", notch: "all", vane: "all" }], "v").length, 0);
  assert.equal(readBaculusViews([{ id: "v", name: "Morning", tray: "rack" }])[0].tray, "rack");

  assert.equal(azimuthHouse("ENGLISH"), true);
  assert.equal(azimuthHouse({ language: true }), true);
  assert.equal(azimuthHarbor({ language: false }), true);
  assert.equal(azimuthHouse({ language: "turkish" }), true);
  assert.equal(azimuthFort("re-check"), true);
  assert.equal(azimuthHarbor("needs review"), true);
  assert.equal(azimuthSpark("US"), true);
  assert.equal(azimuthScroll("Constantinople"), true);
  assert.equal(azimuthLane("Amsterdam"), "vowel");
  assert.equal(azimuthLane("Paris"), "post");
  assert.equal(azimuthPost("Paris"), true);
  assert.equal(azimuthOpen(""), true);
  assert.equal(azimuthOpen({ language: "" }), true);
  assert.equal(azimuthState({ name: "Ada" }), "");
  assert.equal(azimuthState({ language: "Paris", balance: 1 }), "");
  assert.equal(azimuthHue("ENGLISH"), "champagne");
  assert.equal(azimuthHue("needs review"), "graphite");
  assert.equal(azimuthHue("Amsterdam"), "ivory");
  assert.equal(azimuthLength("hold"), 4);
  assert.equal(azimuthEven("hold"), true);
  assert.equal(azimuthFirst("Paris"), true);
  assert.equal(azimuthSpace("needs review"), true);
  assert.equal(azimuthVowel("Amsterdam"), true);
  assert.equal(azimuthDigit("Room4"), true);
  assert.equal(azimuthCapital("PARIS"), true);
  assert.equal(azimuthLower("paris"), true);
  assert.equal(azimuthUpper("ENGLISH"), true);
  assert.equal(azimuthTail("Room4"), true);
  const marks: AzimuthRow[] = [
    { id: "1", label: "Ada", azimuth: "ENGLISH" },
    { id: "2", label: "Bea", azimuth: "TURKISH" },
    { id: "3", label: "Cara", azimuth: "Paris" },
  ];
  assert.equal(leadingAzimuth(marks), "house");
  assert.match(azimuthLanesCsv(marks), /house,2/);
  assert.match(azimuthRowsCsv(marks, ["1"]), /Ada,ENGLISH/);
  assert.equal(crmv4Text("tr", "bclTitle"), ROUND309_COPY.tr.bclTitle);
  assert.equal(crmv4Text("de", "azmTitle"), ROUND309_COPY.de.azmTitle);
  assert.equal(crmv4Text("ru", "splCryptoporticusKicker"), ROUND309_COPY.ru.splCryptoporticusKicker);
  assert.equal(crmv4Text("ar", "rmnDiaetaLead"), ROUND309_COPY.ar.rmnDiaetaLead);
  const keys = Object.keys(ROUND309_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND309_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-baculus/);
  assert.match(css, /\.c4-azimuth/);
  assert.match(css, /\.c4-baculus-column/);
  assert.match(css, /\.c4-azimuth-column/);
  assert.match(css, /\.c4-supply-cryptoporticus/);
  assert.match(css, /\.c4-room-diaeta/);
  assert.match(css, /\.c4-supply-cryptoporticus-mast/);
  assert.match(css, /\.c4-room-diaeta-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round309.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /language:/);
  assert.match(viewFile, /baculusCsv/);
  assert.match(viewFile, /azimuthRowsCsv/);
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
  assert.match(viewFile, /c4-azimuth-search/);
  assert.match(viewFile, /baculusTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "bcl"/);
  assert.match(app, /view === "azm"/);
  const supply = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round124.tsx"), "utf8");
  assert.match(supply, /c4-supply-cryptoporticus/);
  assert.match(supply, /c4-supply-cryptoporticus-mast/);
  assert.match(supply, /data-logo="mono"/);
  assert.match(supply, /splCryptoporticusKicker/);
  assert.match(supply, /splCryptoporticusLead/);
  assert.match(supply, /data-supply/);
  assert.equal(supply.includes("amount"), false);
  const room = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round125.tsx"), "utf8");
  assert.match(room, /c4-room-diaeta/);
  assert.match(room, /c4-room-diaeta-mast/);
  assert.match(room, /rmnDiaetaKicker/);
  assert.match(room, /rmnDiaetaLead/);
  assert.match(room, /data-room/);
  assert.equal(room.includes("price"), false);
  assert.equal(room.includes("amount"), false);
  assert.equal(room.includes("currency"), false);
  const namedKeys = `${viewFile}\n${supply}\n${room}`.match(/"(bcl|azm|splCryptoporticus|rmnDiaeta)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND309_COPY.en[key as keyof typeof ROUND309_COPY.en], "string", key);
  console.log("crmv4 round309 tests passed");
}

main();
