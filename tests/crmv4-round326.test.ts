/**
 * Deadbeat rules, diptych plates, the ivory folio pinacotheca, and the graphite natal horreum.
 * Run: TZ=UTC npx tsx tests/crmv4-round326.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND326_COPY } from "../src/lib/crmv4/copy-round326";
import {
  ROUND326_FEATURES,
  activeLock,
  activeTooth,
  activeWash,
  activePart,
  addDeadbeat,
  briskDeadbeat,
  dropDeadbeatView,
  deadbeatLock,
  deadbeatBand,
  deadbeatGap,
  deadbeatWash,
  deadbeatInner,
  deadbeatOuter,
  deadbeatPart,
  deadbeatTimeline,
  deadbeatTooth,
  fairKeeper,
  fullLock,
  idleDeadbeat,
  lateDeadbeat,
  leadingDiptych,
  moveDeadbeatFocus,
  overdueDeadbeat,
  pairLock,
  quietWash,
  readDeadbeatViews,
  reminderDeadbeatRules,
  restingDeadbeat,
  suggestTooth,
  suggestWash,
  suggestPart,
  diptychScroll,
  diptychTile,
  diptychCapital,
  diptychLocale,
  diptychPlain,
  diptychDigit,
  diptychEven,
  diptychFirst,
  diptychHue,
  diptychSlash,
  diptychLane,
  diptychLanesCsv,
  diptychLength,
  diptychLower,
  diptychOpen,
  diptychRowsCsv,
  diptychScore,
  diptychSpace,
  diptychState,
  diptychTail,
  diptychUpper,
  diptychVowel,
  type Deadbeat,
  type DiptychRow,
} from "../src/lib/crmv4/round326";

function rule(partial: Partial<Deadbeat> & { id: string; title: string }): Deadbeat {
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
  assert.equal(ROUND326_FEATURES.length, 25);
  assert.equal(ROUND326_FEATURES.includes("language-diptych"), true);
  assert.equal(ROUND326_FEATURES.includes("lock-sla"), true);
  assert.equal(ROUND326_FEATURES.includes("fair-keeper"), true);
  assert.equal(ROUND326_FEATURES.includes("case"), true);
  assert.equal(ROUND326_FEATURES.includes("notice-center"), true);
  assert.equal(ROUND326_FEATURES.includes("quick-search"), true);
  assert.equal(ROUND326_FEATURES.includes("tooth-timeline"), true);
  assert.equal(deadbeatPart(" anchor "), "anchor");
  assert.equal(deadbeatPart("brass"), "");
  assert.equal(deadbeatTooth("5"), 5);
  assert.equal(deadbeatTooth(10), 10);
  assert.equal(deadbeatTooth(15), 15);
  assert.equal(deadbeatTooth(20), 20);
  assert.equal(deadbeatTooth("4"), null);
  assert.equal(deadbeatLock("3"), 3);
  assert.equal(deadbeatLock(6), 6);
  assert.equal(deadbeatLock("12"), 12);
  assert.equal(deadbeatLock("5"), null);
  assert.equal(deadbeatWash("gilt"), "GILT");
  assert.equal(deadbeatWash("ivory"), "IVORY");
  assert.equal(deadbeatWash("graphite"), "GRAPHITE");
  assert.equal(deadbeatWash("hot"), "");
  assert.equal(deadbeatInner("anchor"), true);
  assert.equal(deadbeatInner("FORK"), true);
  assert.equal(deadbeatInner("jewel"), false);
  assert.equal(deadbeatOuter("jewel"), true);
  assert.equal(deadbeatOuter("wheel"), true);
  assert.equal(deadbeatOuter("anchor"), false);
  assert.equal(deadbeatBand("anchor"), "hook");
  assert.equal(deadbeatBand("fork"), "tine");
  assert.equal(deadbeatBand("jewel"), "stone");
  assert.equal(deadbeatBand("wheel"), "rim");
  assert.equal(deadbeatGap("anchor", "wheel"), 3);
  assert.equal(quietWash("ivory"), true);
  assert.equal(quietWash("gilt"), false);
  assert.equal(pairLock(6), true);
  assert.equal(pairLock(3), false);
  assert.equal(fullLock(12), true);
  assert.equal(fullLock(6), false);
  assert.equal(activePart("inner"), "inner");
  assert.equal(activeTooth("10"), "10");
  assert.equal(activeLock("12"), "12");
  assert.equal(activeWash("gilt", ["GILT"]), "GILT");
  assert.equal(suggestPart(7), "anchor");
  assert.equal(suggestPart(8), "wheel");
  assert.equal(suggestTooth([], 5), 5);
  assert.equal(suggestTooth([], 12), 15);
  assert.equal(suggestTooth([], 20), 20);
  assert.equal(suggestWash([]), "IVORY");
  assert.equal(moveDeadbeatFocus(0, 3, 1), 1);
  assert.equal(moveDeadbeatFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", part: "anchor" });
  const due = rule({ id: "b", title: "Bea", part: "jewel", lock: 3 });
  const quiet = rule({ id: "c", title: "Cara", tooth: 5, lock: 3 });
  const live = rule({ id: "d", title: "Dora", wash: "GILT", tooth: 20, lock: 12 });
  const rest = rule({ id: "e", title: "Eve", part: "wheel", wash: "IVORY", tooth: 10 });
  assert.equal(lateDeadbeat(late, "wheel"), true);
  assert.equal(lateDeadbeat(late, "anchor"), false);
  assert.equal(overdueDeadbeat(due), true);
  assert.equal(idleDeadbeat(quiet), true);
  assert.equal(briskDeadbeat(live), true);
  assert.equal(restingDeadbeat(rest), true);
  assert.deepEqual(reminderDeadbeatRules([due, late]), ["Bea"]);
  assert.equal(fairKeeper([rule({ id: "1", title: "One", keeper: "Ada" }), rule({ id: "2", title: "Two", keeper: "Bea" }), rule({ id: "3", title: "Three", keeper: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", tooth: 20 }), rule({ id: "2", title: "East", tooth: 10 })];
  assert.match(deadbeatTimeline(cards).map((lane) => lane.tooth).join(","), /20|10/);
  const saved = addDeadbeat([], { title: "Ada", part: "fork", tooth: "10", wash: "gilt", lock: "6", tags: "d b x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].part, "fork");
  assert.equal(saved[0].tooth, 10);
  assert.equal(saved[0].lock, 6);
  assert.deepEqual(saved[0].tags, ["d", "b"]);
  assert.equal(addDeadbeat(saved, { title: "Ada" }).length, 1);
  assert.equal(addDeadbeat([], { title: "Eve" })[0].lock, 3);
  assert.equal(dropDeadbeatView([{ id: "v", name: "Morning", tray: "bench", query: "", keeper: "", wash: "all", part: "all", tooth: "all", lock: "all" }], "v").length, 0);
  assert.equal(readDeadbeatViews([{ id: "v", name: "Morning", tray: "latch" }])[0].tray, "latch");

  assert.equal(diptychLocale("en"), true);
  assert.equal(diptychLocale("TR"), true);
  assert.equal(diptychLocale({ language: true }), true);
  assert.equal(diptychPlain({ language: false }), true);
  assert.equal(diptychLocale({ language: "plain" }), false);
  assert.equal(diptychSlash("en/tr"), true);
  assert.equal(diptychSlash("en_tr"), false);
  assert.equal(diptychScore("en_US"), true);
  assert.equal(diptychTile("en-US"), true);
  assert.equal(diptychTile("en"), false);
  assert.equal(diptychScroll("VeryLongTongue"), true);
  assert.equal(diptychScroll("Amsterdam"), false);
  assert.equal(diptychLane("en"), "locale");
  assert.equal(diptychLane("NET"), "plain");
  assert.equal(diptychLane("10lang"), "index");
  assert.equal(diptychLane("Amsterdam"), "vowel");
  assert.equal(diptychOpen(""), true);
  assert.equal(diptychOpen({ language: "" }), true);
  assert.equal(diptychState({ name: "Ada" }), "");
  assert.equal(diptychState({ language: "Paris", balance: 1 }), "");
  assert.equal(diptychHue("en"), "champagne");
  assert.equal(diptychHue("en/tr"), "graphite");
  assert.equal(diptychHue("Amsterdam"), "ivory");
  assert.equal(diptychLength("hold"), 4);
  assert.equal(diptychEven("hold"), true);
  assert.equal(diptychFirst("Paris"), true);
  assert.equal(diptychSpace("needs review"), true);
  assert.equal(diptychVowel("Amsterdam"), true);
  assert.equal(diptychDigit("Room4"), true);
  assert.equal(diptychCapital("PARIS"), true);
  assert.equal(diptychLower("paris"), true);
  assert.equal(diptychUpper("ENGLISH"), true);
  assert.equal(diptychUpper("EN"), false);
  assert.equal(diptychTail("Room4"), true);
  const marks: DiptychRow[] = [
    { id: "1", label: "Ada", code: "en" },
    { id: "2", label: "Bea", code: "tr" },
    { id: "3", label: "Cara", code: "Paris" },
  ];
  assert.equal(leadingDiptych(marks), "locale");
  assert.match(diptychLanesCsv(marks), /locale,2/);
  assert.match(diptychRowsCsv(marks, ["1"]), /Ada,en/);
  assert.equal(crmv4Text("tr", "dbkTitle"), ROUND326_COPY.tr.dbkTitle);
  assert.equal(crmv4Text("de", "dycTitle"), ROUND326_COPY.de.dycTitle);
  assert.equal(crmv4Text("ru", "folPinacothecaKicker"), ROUND326_COPY.ru.folPinacothecaKicker);
  assert.equal(crmv4Text("ar", "ntlHorreumLead"), ROUND326_COPY.ar.ntlHorreumLead);
  const keys = Object.keys(ROUND326_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND326_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-deadbeat/);
  assert.match(css, /\.c4-diptych/);
  assert.match(css, /\.c4-deadbeat-column/);
  assert.match(css, /\.c4-diptych-column/);
  assert.match(css, /\.c4-fol-pinacotheca/);
  assert.match(css, /\.c4-ntl-horreum/);
  assert.match(css, /\.c4-fol-pinacotheca-mast/);
  assert.match(css, /\.c4-ntl-horreum-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round326.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /language/);
  assert.match(viewFile, /deadbeatCsv/);
  assert.match(viewFile, /diptychRowsCsv/);
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
  assert.match(viewFile, /c4-diptych-search/);
  assert.match(viewFile, /deadbeatTimeline/);
  assert.match(viewFile, /c4-deadbeat-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "dbk"/);
  assert.match(app, /view === "dyc"/);
  const host = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round146.tsx"), "utf8");
  assert.match(host, /c4-fol-pinacotheca/);
  assert.match(host, /c4-fol-pinacotheca-mast/);
  assert.match(host, /data-logo="mono"/);
  assert.match(host, /folPinacothecaKicker/);
  assert.match(host, /folPinacothecaLead/);
  assert.match(host, /data-folio/);
  assert.equal(host.includes("amount"), false);
  assert.match(host, /c4-ntl-horreum/);
  assert.match(host, /c4-ntl-horreum-mast/);
  assert.match(host, /ntlHorreumKicker/);
  assert.match(host, /ntlHorreumLead/);
  assert.match(host, /data-natal/);
  assert.equal(host.includes("currency"), false);
  assert.equal(host.includes("saleStatus"), false);
  const namedKeys = `${viewFile}\n${host}`.match(/"(dbk|dyc|folPinacotheca|ntlHorreum)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND326_COPY.en[key as keyof typeof ROUND326_COPY.en], "string", key);
  console.log("crmv4 round326 tests passed");
}

main();
