/**
 * Stackfreed rules, nocturlabe plates, the ivory promise hypocaust, and the graphite calling vestibulum.
 * Run: TZ=UTC npx tsx tests/crmv4-round329.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND329_COPY } from "../src/lib/crmv4/copy-round329";
import {
  ROUND329_FEATURES,
  activeLock,
  activePart,
  activeTooth,
  activeWash,
  addStackfreed,
  briskStackfreed,
  stackfreedBand,
  stackfreedGap,
  stackfreedInner,
  stackfreedLock,
  stackfreedOuter,
  stackfreedPart,
  stackfreedTimeline,
  stackfreedTooth,
  stackfreedWash,
  dropStackfreedView,
  fairKeeper,
  fullLock,
  idleStackfreed,
  lateStackfreed,
  leadingNocturlabe,
  moveStackfreedFocus,
  overdueStackfreed,
  pairLock,
  quietWash,
  readStackfreedViews,
  reminderStackfreedRules,
  restingStackfreed,
  nocturlabeBanner,
  nocturlabeCapital,
  nocturlabeChip,
  nocturlabeCode,
  nocturlabeDigit,
  nocturlabeEven,
  nocturlabeFirst,
  nocturlabeGap,
  nocturlabeHue,
  nocturlabeJoin,
  nocturlabeLane,
  nocturlabeLanesCsv,
  nocturlabeLength,
  nocturlabeLower,
  nocturlabeOpen,
  nocturlabePlain,
  nocturlabeRowsCsv,
  nocturlabeSpace,
  nocturlabeState,
  nocturlabeTail,
  nocturlabeUpper,
  nocturlabeVowel,
  suggestPart,
  suggestTooth,
  suggestWash,
  type Stackfreed,
  type NocturlabeRow,
} from "../src/lib/crmv4/round329";

function rule(partial: Partial<Stackfreed> & { id: string; title: string }): Stackfreed {
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
  assert.equal(ROUND329_FEATURES.length, 25);
  assert.equal(ROUND329_FEATURES.includes("switch-nocturlabe"), true);
  assert.equal(ROUND329_FEATURES.includes("beat-sla"), true);
  assert.equal(ROUND329_FEATURES.includes("fair-ward"), true);
  assert.equal(ROUND329_FEATURES.includes("chest"), true);
  assert.equal(ROUND329_FEATURES.includes("notice-center"), true);
  assert.equal(ROUND329_FEATURES.includes("quick-search"), true);
  assert.equal(ROUND329_FEATURES.includes("pip-timeline"), true);
  assert.equal(stackfreedPart(" lobe "), "lobe");
  assert.equal(stackfreedPart("brass"), "");
  assert.equal(stackfreedTooth("4"), 4);
  assert.equal(stackfreedTooth(8), 8);
  assert.equal(stackfreedTooth(12), 12);
  assert.equal(stackfreedTooth(16), 16);
  assert.equal(stackfreedTooth("5"), null);
  assert.equal(stackfreedLock("2"), 2);
  assert.equal(stackfreedLock(4), 4);
  assert.equal(stackfreedLock("8"), 8);
  assert.equal(stackfreedLock("3"), null);
  assert.equal(stackfreedWash("gilt"), "GILT");
  assert.equal(stackfreedWash("ivory"), "IVORY");
  assert.equal(stackfreedWash("graphite"), "GRAPHITE");
  assert.equal(stackfreedWash("hot"), "");
  assert.equal(stackfreedInner("lobe"), true);
  assert.equal(stackfreedInner("SNAIL"), true);
  assert.equal(stackfreedInner("yoke"), false);
  assert.equal(stackfreedOuter("yoke"), true);
  assert.equal(stackfreedOuter("barrel"), true);
  assert.equal(stackfreedOuter("lobe"), false);
  assert.equal(stackfreedBand("lobe"), "crest");
  assert.equal(stackfreedBand("snail"), "ramp");
  assert.equal(stackfreedBand("yoke"), "hook");
  assert.equal(stackfreedBand("barrel"), "drum");
  assert.equal(stackfreedGap("lobe", "barrel"), 3);
  assert.equal(quietWash("ivory"), true);
  assert.equal(quietWash("gilt"), false);
  assert.equal(pairLock(4), true);
  assert.equal(pairLock(2), false);
  assert.equal(fullLock(8), true);
  assert.equal(fullLock(4), false);
  assert.equal(activePart("inner"), "inner");
  assert.equal(activeTooth("8"), "8");
  assert.equal(activeLock("8"), "8");
  assert.equal(activeTooth("6"), "all");
  assert.equal(activeLock("3"), "all");
  assert.equal(activeWash("gilt", ["GILT"]), "GILT");
  assert.equal(suggestPart(8), "lobe");
  assert.equal(suggestPart(9), "barrel");
  assert.equal(suggestTooth([], 4), 4);
  assert.equal(suggestTooth([], 11), 8);
  assert.equal(suggestTooth([], 20), 16);
  assert.equal(suggestWash([]), "IVORY");
  assert.equal(moveStackfreedFocus(0, 3, 1), 1);
  assert.equal(moveStackfreedFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", part: "lobe" });
  const due = rule({ id: "b", title: "Bea", part: "yoke", lock: 2 });
  const quiet = rule({ id: "c", title: "Cara", tooth: 4, lock: 2 });
  const live = rule({ id: "d", title: "Dora", wash: "GILT", tooth: 16, lock: 8 });
  const rest = rule({ id: "e", title: "Eve", part: "barrel", wash: "IVORY", tooth: 8 });
  assert.equal(lateStackfreed(late, "barrel"), true);
  assert.equal(lateStackfreed(late, "lobe"), false);
  assert.equal(overdueStackfreed(due), true);
  assert.equal(idleStackfreed(quiet), true);
  assert.equal(briskStackfreed(live), true);
  assert.equal(restingStackfreed(rest), true);
  assert.deepEqual(reminderStackfreedRules([due, late]), ["Bea"]);
  assert.equal(fairKeeper([rule({ id: "1", title: "One", keeper: "Ada" }), rule({ id: "2", title: "Two", keeper: "Bea" }), rule({ id: "3", title: "Three", keeper: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", tooth: 16 }), rule({ id: "2", title: "East", tooth: 8 })];
  assert.match(stackfreedTimeline(cards).map((lane) => lane.tooth).join(","), /16|8/);
  const saved = addStackfreed([], { title: "Ada", part: "snail", tooth: "8", wash: "gilt", lock: "4", tags: "s f x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].part, "snail");
  assert.equal(saved[0].tooth, 8);
  assert.equal(saved[0].lock, 4);
  assert.deepEqual(saved[0].tags, ["s", "f"]);
  assert.equal(addStackfreed(saved, { title: "Ada" }).length, 1);
  assert.equal(addStackfreed([], { title: "Eve" })[0].lock, 2);
  assert.equal(dropStackfreedView([{ id: "v", name: "Morning", tray: "bench", query: "", keeper: "", wash: "all", part: "all", tooth: "all", lock: "all" }], "v").length, 0);
  assert.equal(readStackfreedViews([{ id: "v", name: "Morning", tray: "latch" }])[0].tray, "latch");

  assert.equal(nocturlabeCode("open"), true);
  assert.equal(nocturlabeCode("HOLD"), true);
  assert.equal(nocturlabeCode({ withdrawalsEnabled: true }), true);
  assert.equal(nocturlabePlain({ withdrawalsEnabled: false }), true);
  assert.equal(nocturlabeCode({ withdrawalsEnabled: "plain" }), false);
  assert.equal(nocturlabeJoin("OPEN-HOLD"), true);
  assert.equal(nocturlabeJoin("OPEN HOLD"), false);
  assert.equal(nocturlabeGap("OPEN.HOLD"), true);
  assert.equal(nocturlabeGap("OPENHOLD"), false);
  assert.equal(nocturlabeChip("Stamp"), true);
  assert.equal(nocturlabeChip("OPEN"), false);
  assert.equal(nocturlabeBanner("Abcdefghijkl"), true);
  assert.equal(nocturlabeBanner("Amsterdam"), false);
  assert.equal(nocturlabeLane("OPEN"), "code");
  assert.equal(nocturlabeLane("Paris"), "chip");
  assert.equal(nocturlabeLane("Letter"), "plain");
  assert.equal(nocturlabeLane("10lang"), "mark");
  assert.equal(nocturlabeLane("Amsterdam"), "vowel");
  assert.equal(nocturlabeOpen(""), true);
  assert.equal(nocturlabeOpen({ withdrawalsEnabled: "" }), true);
  assert.equal(nocturlabeState({ name: "Ada" }), "");
  assert.equal(nocturlabeState({ withdrawalsEnabled: "Paris", balance: 1 }), "");
  assert.equal(nocturlabeHue("OPEN"), "champagne");
  assert.equal(nocturlabeHue("OPEN-HOLD"), "graphite");
  assert.equal(nocturlabeHue("Letter"), "ivory");
  assert.equal(nocturlabeLength("hold"), 4);
  assert.equal(nocturlabeEven("hold"), true);
  assert.equal(nocturlabeFirst("Paris"), true);
  assert.equal(nocturlabeSpace("needs review"), true);
  assert.equal(nocturlabeVowel("Amsterdam"), true);
  assert.equal(nocturlabeDigit("Room4"), true);
  assert.equal(nocturlabeCapital("PARIS"), true);
  assert.equal(nocturlabeLower("paris"), true);
  assert.equal(nocturlabeUpper("ENGLISH"), true);
  assert.equal(nocturlabeUpper("EN"), false);
  assert.equal(nocturlabeTail("Room4"), true);
  const marks: NocturlabeRow[] = [
    { id: "1", label: "Ada", code: "OPEN" },
    { id: "2", label: "Bea", code: "HOLD" },
    { id: "3", label: "Cara", code: "Paris" },
  ];
  assert.equal(leadingNocturlabe(marks), "code");
  assert.match(nocturlabeLanesCsv(marks), /code,2/);
  assert.match(nocturlabeRowsCsv(marks, ["1"]), /Ada,OPEN/);
  assert.equal(crmv4Text("tr", "sfrTitle"), ROUND329_COPY.tr.sfrTitle);
  assert.equal(crmv4Text("de", "nlbTitle"), ROUND329_COPY.de.nlbTitle);
  assert.equal(crmv4Text("ru", "prmHypocaustKicker"), ROUND329_COPY.ru.prmHypocaustKicker);
  assert.equal(crmv4Text("ar", "clgVestibulumLead"), ROUND329_COPY.ar.clgVestibulumLead);
  const keys = Object.keys(ROUND329_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND329_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-stackfreed/);
  assert.match(css, /\.c4-nocturlabe/);
  assert.match(css, /\.c4-stackfreed-column/);
  assert.match(css, /\.c4-nocturlabe-column/);
  assert.match(css, /\.c4-prm-hypocaust/);
  assert.match(css, /\.c4-clg-vestibulum/);
  assert.match(css, /\.c4-prm-hypocaust-mast/);
  assert.match(css, /\.c4-clg-vestibulum-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round329.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /withdrawalsEnabled/);
  assert.match(viewFile, /stackfreedCsv/);
  assert.match(viewFile, /nocturlabeRowsCsv/);
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
  assert.match(viewFile, /c4-nocturlabe-search/);
  assert.match(viewFile, /stackfreedTimeline/);
  assert.match(viewFile, /c4-stackfreed-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "sfr"/);
  assert.match(app, /view === "nlb"/);
  const host = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round149.tsx"), "utf8");
  assert.match(host, /c4-prm-hypocaust/);
  assert.match(host, /c4-prm-hypocaust-mast/);
  assert.match(host, /data-logo="mono"/);
  assert.match(host, /prmHypocaustKicker/);
  assert.match(host, /prmHypocaustLead/);
  assert.match(host, /data-promise/);
  assert.equal(host.includes("amount"), false);
  assert.match(host, /c4-clg-vestibulum/);
  assert.match(host, /c4-clg-vestibulum-mast/);
  assert.match(host, /clgVestibulumKicker/);
  assert.match(host, /clgVestibulumLead/);
  assert.match(host, /data-calling/);
  assert.equal(host.includes("currency"), false);
  assert.equal(host.includes("saleStatus"), false);
  const namedKeys = `${viewFile}\n${host}`.match(/"(sfr|nlb|prmHypocaust|clgVestibulum)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND329_COPY.en[key as keyof typeof ROUND329_COPY.en], "string", key);
  console.log("crmv4 round329 tests passed");
}

main();
