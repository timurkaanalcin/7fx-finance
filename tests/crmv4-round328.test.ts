/**
 * Virgule rules, gunter plates, the ivory quire bibliotheca, and the graphite courtesy thermopolium.
 * Run: TZ=UTC npx tsx tests/crmv4-round328.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND328_COPY } from "../src/lib/crmv4/copy-round328";
import {
  ROUND328_FEATURES,
  activeLock,
  activePart,
  activeTooth,
  activeWash,
  addVirgule,
  briskVirgule,
  virguleBand,
  virguleGap,
  virguleInner,
  virguleLock,
  virguleOuter,
  virgulePart,
  virguleTimeline,
  virguleTooth,
  virguleWash,
  dropVirguleView,
  fairKeeper,
  fullLock,
  idleVirgule,
  lateVirgule,
  leadingGunter,
  moveVirguleFocus,
  overdueVirgule,
  pairLock,
  quietWash,
  readVirguleViews,
  reminderVirguleRules,
  restingVirgule,
  gunterBanner,
  gunterCapital,
  gunterChip,
  gunterCode,
  gunterDigit,
  gunterEven,
  gunterFirst,
  gunterGap,
  gunterHue,
  gunterJoin,
  gunterLane,
  gunterLanesCsv,
  gunterLength,
  gunterLower,
  gunterOpen,
  gunterPlain,
  gunterRowsCsv,
  gunterSpace,
  gunterState,
  gunterTail,
  gunterUpper,
  gunterVowel,
  suggestPart,
  suggestTooth,
  suggestWash,
  type Virgule,
  type GunterRow,
} from "../src/lib/crmv4/round328";

function rule(partial: Partial<Virgule> & { id: string; title: string }): Virgule {
  return {
    note: "",
    keeper: "",
    part: "",
    tooth: null,
    wash: "",
    lock: 3,
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
  assert.equal(ROUND328_FEATURES.length, 25);
  assert.equal(ROUND328_FEATURES.includes("switch-gunter"), true);
  assert.equal(ROUND328_FEATURES.includes("beat-sla"), true);
  assert.equal(ROUND328_FEATURES.includes("fair-ward"), true);
  assert.equal(ROUND328_FEATURES.includes("chest"), true);
  assert.equal(ROUND328_FEATURES.includes("notice-center"), true);
  assert.equal(ROUND328_FEATURES.includes("quick-search"), true);
  assert.equal(ROUND328_FEATURES.includes("pip-timeline"), true);
  assert.equal(virgulePart(" body "), "body");
  assert.equal(virgulePart("brass"), "");
  assert.equal(virguleTooth("3"), 3);
  assert.equal(virguleTooth(6), 6);
  assert.equal(virguleTooth(9), 9);
  assert.equal(virguleTooth(12), 12);
  assert.equal(virguleTooth("5"), null);
  assert.equal(virguleLock("3"), 3);
  assert.equal(virguleLock(6), 6);
  assert.equal(virguleLock("9"), 9);
  assert.equal(virguleLock("4"), null);
  assert.equal(virguleWash("gilt"), "GILT");
  assert.equal(virguleWash("ivory"), "IVORY");
  assert.equal(virguleWash("graphite"), "GRAPHITE");
  assert.equal(virguleWash("hot"), "");
  assert.equal(virguleInner("body"), true);
  assert.equal(virguleInner("BEAK"), true);
  assert.equal(virguleInner("staff"), false);
  assert.equal(virguleOuter("staff"), true);
  assert.equal(virguleOuter("dart"), true);
  assert.equal(virguleOuter("body"), false);
  assert.equal(virguleBand("body"), "rib");
  assert.equal(virguleBand("beak"), "tip");
  assert.equal(virguleBand("staff"), "bar");
  assert.equal(virguleBand("dart"), "nip");
  assert.equal(virguleGap("body", "dart"), 3);
  assert.equal(quietWash("ivory"), true);
  assert.equal(quietWash("gilt"), false);
  assert.equal(pairLock(6), true);
  assert.equal(pairLock(3), false);
  assert.equal(fullLock(9), true);
  assert.equal(fullLock(6), false);
  assert.equal(activePart("inner"), "inner");
  assert.equal(activeTooth("6"), "6");
  assert.equal(activeLock("9"), "9");
  assert.equal(activeTooth("8"), "all");
  assert.equal(activeLock("8"), "all");
  assert.equal(activeWash("gilt", ["GILT"]), "GILT");
  assert.equal(suggestPart(8), "body");
  assert.equal(suggestPart(9), "dart");
  assert.equal(suggestTooth([], 4), 3);
  assert.equal(suggestTooth([], 11), 9);
  assert.equal(suggestTooth([], 20), 12);
  assert.equal(suggestWash([]), "IVORY");
  assert.equal(moveVirguleFocus(0, 3, 1), 1);
  assert.equal(moveVirguleFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", part: "body" });
  const due = rule({ id: "b", title: "Bea", part: "staff", lock: 3 });
  const quiet = rule({ id: "c", title: "Cara", tooth: 3, lock: 3 });
  const live = rule({ id: "d", title: "Dora", wash: "GILT", tooth: 12, lock: 9 });
  const rest = rule({ id: "e", title: "Eve", part: "dart", wash: "IVORY", tooth: 6 });
  assert.equal(lateVirgule(late, "dart"), true);
  assert.equal(lateVirgule(late, "body"), false);
  assert.equal(overdueVirgule(due), true);
  assert.equal(idleVirgule(quiet), true);
  assert.equal(briskVirgule(live), true);
  assert.equal(restingVirgule(rest), true);
  assert.deepEqual(reminderVirguleRules([due, late]), ["Bea"]);
  assert.equal(fairKeeper([rule({ id: "1", title: "One", keeper: "Ada" }), rule({ id: "2", title: "Two", keeper: "Bea" }), rule({ id: "3", title: "Three", keeper: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", tooth: 12 }), rule({ id: "2", title: "East", tooth: 6 })];
  assert.match(virguleTimeline(cards).map((lane) => lane.tooth).join(","), /12|6/);
  const saved = addVirgule([], { title: "Ada", part: "beak", tooth: "6", wash: "gilt", lock: "6", tags: "v g x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].part, "beak");
  assert.equal(saved[0].tooth, 6);
  assert.equal(saved[0].lock, 6);
  assert.deepEqual(saved[0].tags, ["v", "g"]);
  assert.equal(addVirgule(saved, { title: "Ada" }).length, 1);
  assert.equal(addVirgule([], { title: "Eve" })[0].lock, 3);
  assert.equal(dropVirguleView([{ id: "v", name: "Morning", tray: "bench", query: "", keeper: "", wash: "all", part: "all", tooth: "all", lock: "all" }], "v").length, 0);
  assert.equal(readVirguleViews([{ id: "v", name: "Morning", tray: "latch" }])[0].tray, "latch");

  assert.equal(gunterCode("open"), true);
  assert.equal(gunterCode("HOLD"), true);
  assert.equal(gunterCode({ withdrawalsEnabled: true }), true);
  assert.equal(gunterPlain({ withdrawalsEnabled: false }), true);
  assert.equal(gunterCode({ withdrawalsEnabled: "plain" }), false);
  assert.equal(gunterJoin("OPEN/HOLD"), true);
  assert.equal(gunterJoin("OPEN HOLD"), false);
  assert.equal(gunterGap("OPEN_HOLD"), true);
  assert.equal(gunterGap("OPENHOLD"), false);
  assert.equal(gunterChip("Tile"), true);
  assert.equal(gunterChip("OPEN"), false);
  assert.equal(gunterBanner("Abcdefghijklmn"), true);
  assert.equal(gunterBanner("Amsterdam"), false);
  assert.equal(gunterLane("OPEN"), "code");
  assert.equal(gunterLane("Paris"), "plain");
  assert.equal(gunterLane("10lang"), "mark");
  assert.equal(gunterLane("Letter"), "vowel");
  assert.equal(gunterOpen(""), true);
  assert.equal(gunterOpen({ withdrawalsEnabled: "" }), true);
  assert.equal(gunterState({ name: "Ada" }), "");
  assert.equal(gunterState({ withdrawalsEnabled: "Paris", balance: 1 }), "");
  assert.equal(gunterHue("OPEN"), "champagne");
  assert.equal(gunterHue("OPEN/HOLD"), "graphite");
  assert.equal(gunterHue("Letter"), "ivory");
  assert.equal(gunterLength("hold"), 4);
  assert.equal(gunterEven("hold"), true);
  assert.equal(gunterFirst("Paris"), true);
  assert.equal(gunterSpace("needs review"), true);
  assert.equal(gunterVowel("Amsterdam"), true);
  assert.equal(gunterDigit("Room4"), true);
  assert.equal(gunterCapital("PARIS"), true);
  assert.equal(gunterLower("paris"), true);
  assert.equal(gunterUpper("ENGLISH"), true);
  assert.equal(gunterUpper("EN"), false);
  assert.equal(gunterTail("Room4"), true);
  const marks: GunterRow[] = [
    { id: "1", label: "Ada", code: "OPEN" },
    { id: "2", label: "Bea", code: "HOLD" },
    { id: "3", label: "Cara", code: "Paris" },
  ];
  assert.equal(leadingGunter(marks), "code");
  assert.match(gunterLanesCsv(marks), /code,2/);
  assert.match(gunterRowsCsv(marks, ["1"]), /Ada,OPEN/);
  assert.equal(crmv4Text("tr", "vrgTitle"), ROUND328_COPY.tr.vrgTitle);
  assert.equal(crmv4Text("de", "gntTitle"), ROUND328_COPY.de.gntTitle);
  assert.equal(crmv4Text("ru", "qreBibliothecaKicker"), ROUND328_COPY.ru.qreBibliothecaKicker);
  assert.equal(crmv4Text("ar", "ctsThermopoliumLead"), ROUND328_COPY.ar.ctsThermopoliumLead);
  const keys = Object.keys(ROUND328_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND328_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-virgule/);
  assert.match(css, /\.c4-gunter/);
  assert.match(css, /\.c4-virgule-column/);
  assert.match(css, /\.c4-gunter-column/);
  assert.match(css, /\.c4-qre-bibliotheca/);
  assert.match(css, /\.c4-cts-thermopolium/);
  assert.match(css, /\.c4-qre-bibliotheca-mast/);
  assert.match(css, /\.c4-cts-thermopolium-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round328.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /withdrawalsEnabled/);
  assert.match(viewFile, /virguleCsv/);
  assert.match(viewFile, /gunterRowsCsv/);
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
  assert.match(viewFile, /c4-gunter-search/);
  assert.match(viewFile, /virguleTimeline/);
  assert.match(viewFile, /c4-virgule-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "vrg"/);
  assert.match(app, /view === "gnt"/);
  const host = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round148.tsx"), "utf8");
  assert.match(host, /c4-qre-bibliotheca/);
  assert.match(host, /c4-qre-bibliotheca-mast/);
  assert.match(host, /data-logo="mono"/);
  assert.match(host, /qreBibliothecaKicker/);
  assert.match(host, /qreBibliothecaLead/);
  assert.match(host, /data-quire/);
  assert.equal(host.includes("amount"), false);
  assert.match(host, /c4-cts-thermopolium/);
  assert.match(host, /c4-cts-thermopolium-mast/);
  assert.match(host, /ctsThermopoliumKicker/);
  assert.match(host, /ctsThermopoliumLead/);
  assert.match(host, /data-courtesy/);
  assert.equal(host.includes("currency"), false);
  assert.equal(host.includes("saleStatus"), false);
  const namedKeys = `${viewFile}\n${host}`.match(/"(vrg|gnt|qreBibliotheca|ctsThermopolium)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND328_COPY.en[key as keyof typeof ROUND328_COPY.en], "string", key);
  console.log("crmv4 round328 tests passed");
}

main();
