/**
 * Cylinder rules, rete plates, the ivory vellum solarium, and the graphite house cavum.
 * Run: TZ=UTC npx tsx tests/crmv4-round327.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND327_COPY } from "../src/lib/crmv4/copy-round327";
import {
  ROUND327_FEATURES,
  activeLock,
  activePart,
  activeTooth,
  activeWash,
  addCylinder,
  briskCylinder,
  cylinderBand,
  cylinderGap,
  cylinderInner,
  cylinderLock,
  cylinderOuter,
  cylinderPart,
  cylinderTimeline,
  cylinderTooth,
  cylinderWash,
  dropCylinderView,
  fairKeeper,
  fullLock,
  idleCylinder,
  lateCylinder,
  leadingRete,
  moveCylinderFocus,
  overdueCylinder,
  pairLock,
  quietWash,
  readCylinderViews,
  reminderCylinderRules,
  restingCylinder,
  reteBanner,
  reteCapital,
  reteChip,
  reteCode,
  reteDigit,
  reteEven,
  reteFirst,
  reteGap,
  reteHue,
  reteJoin,
  reteLane,
  reteLanesCsv,
  reteLength,
  reteLower,
  reteOpen,
  retePlain,
  reteRowsCsv,
  reteSpace,
  reteState,
  reteTail,
  reteUpper,
  reteVowel,
  suggestPart,
  suggestTooth,
  suggestWash,
  type Cylinder,
  type ReteRow,
} from "../src/lib/crmv4/round327";

function rule(partial: Partial<Cylinder> & { id: string; title: string }): Cylinder {
  return {
    note: "",
    keeper: "",
    part: "",
    tooth: null,
    wash: "",
    lock: 2,
    tags: [],
    banked: false,
    latched: false,
    cased: false,
    starred: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND327_FEATURES.length, 25);
  assert.equal(ROUND327_FEATURES.includes("region-rete"), true);
  assert.equal(ROUND327_FEATURES.includes("lift-sla"), true);
  assert.equal(ROUND327_FEATURES.includes("fair-keeper"), true);
  assert.equal(ROUND327_FEATURES.includes("vault"), true);
  assert.equal(ROUND327_FEATURES.includes("notice-center"), true);
  assert.equal(ROUND327_FEATURES.includes("quick-search"), true);
  assert.equal(ROUND327_FEATURES.includes("tooth-timeline"), true);
  assert.equal(cylinderPart(" shell "), "shell");
  assert.equal(cylinderPart("brass"), "");
  assert.equal(cylinderTooth("4"), 4);
  assert.equal(cylinderTooth(8), 8);
  assert.equal(cylinderTooth(12), 12);
  assert.equal(cylinderTooth(16), 16);
  assert.equal(cylinderTooth("5"), null);
  assert.equal(cylinderLock("2"), 2);
  assert.equal(cylinderLock(4), 4);
  assert.equal(cylinderLock("8"), 8);
  assert.equal(cylinderLock("3"), null);
  assert.equal(cylinderWash("gilt"), "GILT");
  assert.equal(cylinderWash("ivory"), "IVORY");
  assert.equal(cylinderWash("graphite"), "GRAPHITE");
  assert.equal(cylinderWash("hot"), "");
  assert.equal(cylinderInner("shell"), true);
  assert.equal(cylinderInner("ARBOR"), true);
  assert.equal(cylinderInner("banking"), false);
  assert.equal(cylinderOuter("banking"), true);
  assert.equal(cylinderOuter("impulse"), true);
  assert.equal(cylinderOuter("shell"), false);
  assert.equal(cylinderBand("shell"), "lip");
  assert.equal(cylinderBand("arbor"), "pin");
  assert.equal(cylinderBand("banking"), "rail");
  assert.equal(cylinderBand("impulse"), "kick");
  assert.equal(cylinderGap("shell", "impulse"), 3);
  assert.equal(quietWash("ivory"), true);
  assert.equal(quietWash("gilt"), false);
  assert.equal(pairLock(4), true);
  assert.equal(pairLock(2), false);
  assert.equal(fullLock(8), true);
  assert.equal(fullLock(4), false);
  assert.equal(activePart("inner"), "inner");
  assert.equal(activeTooth("8"), "8");
  assert.equal(activeLock("8"), "8");
  assert.equal(activeWash("gilt", ["GILT"]), "GILT");
  assert.equal(suggestPart(8), "shell");
  assert.equal(suggestPart(9), "impulse");
  assert.equal(suggestTooth([], 4), 4);
  assert.equal(suggestTooth([], 11), 12);
  assert.equal(suggestTooth([], 20), 16);
  assert.equal(suggestWash([]), "IVORY");
  assert.equal(moveCylinderFocus(0, 3, 1), 1);
  assert.equal(moveCylinderFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", part: "shell" });
  const due = rule({ id: "b", title: "Bea", part: "banking", lock: 2 });
  const quiet = rule({ id: "c", title: "Cara", tooth: 4, lock: 2 });
  const live = rule({ id: "d", title: "Dora", wash: "GILT", tooth: 16, lock: 8 });
  const rest = rule({ id: "e", title: "Eve", part: "impulse", wash: "IVORY", tooth: 8 });
  assert.equal(lateCylinder(late, "impulse"), true);
  assert.equal(lateCylinder(late, "shell"), false);
  assert.equal(overdueCylinder(due), true);
  assert.equal(idleCylinder(quiet), true);
  assert.equal(briskCylinder(live), true);
  assert.equal(restingCylinder(rest), true);
  assert.deepEqual(reminderCylinderRules([due, late]), ["Bea"]);
  assert.equal(fairKeeper([rule({ id: "1", title: "One", keeper: "Ada" }), rule({ id: "2", title: "Two", keeper: "Bea" }), rule({ id: "3", title: "Three", keeper: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", tooth: 16 }), rule({ id: "2", title: "East", tooth: 8 })];
  assert.match(cylinderTimeline(cards).map((lane) => lane.tooth).join(","), /16|8/);
  const saved = addCylinder([], { title: "Ada", part: "arbor", tooth: "8", wash: "gilt", lock: "4", tags: "c y x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].part, "arbor");
  assert.equal(saved[0].tooth, 8);
  assert.equal(saved[0].lock, 4);
  assert.deepEqual(saved[0].tags, ["c", "y"]);
  assert.equal(addCylinder(saved, { title: "Ada" }).length, 1);
  assert.equal(addCylinder([], { title: "Eve" })[0].lock, 2);
  assert.equal(dropCylinderView([{ id: "v", name: "Morning", tray: "bench", query: "", keeper: "", wash: "all", part: "all", tooth: "all", lock: "all" }], "v").length, 0);
  assert.equal(readCylinderViews([{ id: "v", name: "Morning", tray: "latch" }])[0].tray, "latch");

  assert.equal(reteCode("eu"), true);
  assert.equal(reteCode("AS"), true);
  assert.equal(reteCode({ lastRegion: true }), true);
  assert.equal(retePlain({ lastRegion: false }), true);
  assert.equal(reteCode({ lastRegion: "plain" }), false);
  assert.equal(reteJoin("EU-AS"), true);
  assert.equal(reteJoin("EU AS"), false);
  assert.equal(reteGap("New York"), true);
  assert.equal(reteGap("NewYork"), false);
  assert.equal(reteChip("Ion"), true);
  assert.equal(reteChip("EU"), false);
  assert.equal(reteBanner("Abcdefghijklmnopqr"), true);
  assert.equal(reteBanner("Amsterdam"), false);
  assert.equal(reteLane("EU"), "code");
  assert.equal(reteLane("Paris"), "plain");
  assert.equal(reteLane("10lang"), "mark");
  assert.equal(reteLane("Amsterdam"), "vowel");
  assert.equal(reteOpen(""), true);
  assert.equal(reteOpen({ lastRegion: "" }), true);
  assert.equal(reteState({ name: "Ada" }), "");
  assert.equal(reteState({ lastRegion: "Paris", balance: 1 }), "");
  assert.equal(reteHue("EU"), "champagne");
  assert.equal(reteHue("EU-AS"), "graphite");
  assert.equal(reteHue("Amsterdam"), "ivory");
  assert.equal(reteLength("hold"), 4);
  assert.equal(reteEven("hold"), true);
  assert.equal(reteFirst("Paris"), true);
  assert.equal(reteSpace("needs review"), true);
  assert.equal(reteVowel("Amsterdam"), true);
  assert.equal(reteDigit("Room4"), true);
  assert.equal(reteCapital("PARIS"), true);
  assert.equal(reteLower("paris"), true);
  assert.equal(reteUpper("ENGLISH"), true);
  assert.equal(reteUpper("EN"), false);
  assert.equal(reteTail("Room4"), true);
  const marks: ReteRow[] = [
    { id: "1", label: "Ada", code: "EU" },
    { id: "2", label: "Bea", code: "AS" },
    { id: "3", label: "Cara", code: "Paris" },
  ];
  assert.equal(leadingRete(marks), "code");
  assert.match(reteLanesCsv(marks), /code,2/);
  assert.match(reteRowsCsv(marks, ["1"]), /Ada,EU/);
  assert.equal(crmv4Text("tr", "cylTitle"), ROUND327_COPY.tr.cylTitle);
  assert.equal(crmv4Text("de", "rteTitle"), ROUND327_COPY.de.rteTitle);
  assert.equal(crmv4Text("ru", "vlmSolariumKicker"), ROUND327_COPY.ru.vlmSolariumKicker);
  assert.equal(crmv4Text("ar", "hhdCavumLead"), ROUND327_COPY.ar.hhdCavumLead);
  const keys = Object.keys(ROUND327_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND327_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-cylinder/);
  assert.match(css, /\.c4-rete/);
  assert.match(css, /\.c4-cylinder-column/);
  assert.match(css, /\.c4-rete-column/);
  assert.match(css, /\.c4-vlm-solarium/);
  assert.match(css, /\.c4-hhd-cavum/);
  assert.match(css, /\.c4-vlm-solarium-mast/);
  assert.match(css, /\.c4-hhd-cavum-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round327.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /lastRegion/);
  assert.match(viewFile, /cylinderCsv/);
  assert.match(viewFile, /reteRowsCsv/);
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
  assert.match(viewFile, /suggestWash/);
  assert.match(viewFile, /c4-rete-search/);
  assert.match(viewFile, /cylinderTimeline/);
  assert.match(viewFile, /c4-cylinder-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "cyl"/);
  assert.match(app, /view === "rte"/);
  const host = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round147.tsx"), "utf8");
  assert.match(host, /c4-vlm-solarium/);
  assert.match(host, /c4-vlm-solarium-mast/);
  assert.match(host, /data-logo="mono"/);
  assert.match(host, /vlmSolariumKicker/);
  assert.match(host, /vlmSolariumLead/);
  assert.match(host, /data-vellum/);
  assert.equal(host.includes("amount"), false);
  assert.match(host, /c4-hhd-cavum/);
  assert.match(host, /c4-hhd-cavum-mast/);
  assert.match(host, /hhdCavumKicker/);
  assert.match(host, /hhdCavumLead/);
  assert.match(host, /data-house/);
  assert.equal(host.includes("currency"), false);
  assert.equal(host.includes("saleStatus"), false);
  const namedKeys = `${viewFile}\n${host}`.match(/"(cyl|rte|vlmSolarium|hhdCavum)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND327_COPY.en[key as keyof typeof ROUND327_COPY.en], "string", key);
  console.log("crmv4 round327 tests passed");
}

main();
