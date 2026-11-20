/**
 * Contrate rules, jacquemart plates, the ivory briefing apodyterium, and the graphite lexicon frigidarium.
 * Run: TZ=UTC npx tsx tests/crmv4-round330.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND330_COPY } from "../src/lib/crmv4/copy-round330";
import {
  ROUND330_FEATURES,
  activeLock,
  activePart,
  activeTooth,
  activeWash,
  addContrate,
  briskContrate,
  contrateBand,
  contrateGap,
  contrateInner,
  contrateLock,
  contrateOuter,
  contratePart,
  contrateTimeline,
  contrateTooth,
  contrateWash,
  dropContrateView,
  fairKeeper,
  fullLock,
  idleContrate,
  lateContrate,
  leadingJacquemart,
  moveContrateFocus,
  overdueContrate,
  pairLock,
  quietWash,
  readContrateViews,
  reminderContrateRules,
  restingContrate,
  jacquemartBanner,
  jacquemartCapital,
  jacquemartChip,
  jacquemartCode,
  jacquemartDigit,
  jacquemartEven,
  jacquemartFirst,
  jacquemartGap,
  jacquemartHue,
  jacquemartJoin,
  jacquemartLane,
  jacquemartLanesCsv,
  jacquemartLength,
  jacquemartLower,
  jacquemartOpen,
  jacquemartPlain,
  jacquemartRowsCsv,
  jacquemartSpace,
  jacquemartState,
  jacquemartTail,
  jacquemartUpper,
  jacquemartVowel,
  suggestPart,
  suggestTooth,
  suggestWash,
  type Contrate,
  type JacquemartRow,
} from "../src/lib/crmv4/round330";

function rule(partial: Partial<Contrate> & { id: string; title: string }): Contrate {
  return {
    note: "",
    keeper: "",
    part: "",
    tooth: null,
    wash: "",
    lock: 1,
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
  assert.equal(ROUND330_FEATURES.length, 25);
  assert.equal(ROUND330_FEATURES.includes("login-jacquemart"), true);
  assert.equal(ROUND330_FEATURES.includes("beat-sla"), true);
  assert.equal(ROUND330_FEATURES.includes("fair-ward"), true);
  assert.equal(ROUND330_FEATURES.includes("chest"), true);
  assert.equal(ROUND330_FEATURES.includes("notice-center"), true);
  assert.equal(ROUND330_FEATURES.includes("quick-search"), true);
  assert.equal(ROUND330_FEATURES.includes("pip-timeline"), true);
  assert.equal(contratePart(" pinion "), "pinion");
  assert.equal(contratePart("brass"), "");
  assert.equal(contrateTooth("3"), 3);
  assert.equal(contrateTooth(6), 6);
  assert.equal(contrateTooth(9), 9);
  assert.equal(contrateTooth(12), 12);
  assert.equal(contrateTooth("5"), null);
  assert.equal(contrateLock("1"), 1);
  assert.equal(contrateLock(3), 3);
  assert.equal(contrateLock("5"), 5);
  assert.equal(contrateLock("2"), null);
  assert.equal(contrateWash("gilt"), "GILT");
  assert.equal(contrateWash("ivory"), "IVORY");
  assert.equal(contrateWash("graphite"), "GRAPHITE");
  assert.equal(contrateWash("hot"), "");
  assert.equal(contrateInner("pinion"), true);
  assert.equal(contrateInner("WHEEL"), true);
  assert.equal(contrateInner("arbor"), false);
  assert.equal(contrateOuter("arbor"), true);
  assert.equal(contrateOuter("staff"), true);
  assert.equal(contrateOuter("pinion"), false);
  assert.equal(contrateBand("pinion"), "mesh");
  assert.equal(contrateBand("wheel"), "rim");
  assert.equal(contrateBand("arbor"), "axle");
  assert.equal(contrateBand("staff"), "stave");
  assert.equal(contrateGap("pinion", "staff"), 3);
  assert.equal(quietWash("ivory"), true);
  assert.equal(quietWash("gilt"), false);
  assert.equal(pairLock(3), true);
  assert.equal(pairLock(1), false);
  assert.equal(fullLock(5), true);
  assert.equal(fullLock(3), false);
  assert.equal(activePart("inner"), "inner");
  assert.equal(activeTooth("6"), "6");
  assert.equal(activeLock("5"), "5");
  assert.equal(activeTooth("4"), "all");
  assert.equal(activeLock("2"), "all");
  assert.equal(activeWash("gilt", ["GILT"]), "GILT");
  assert.equal(suggestPart(8), "pinion");
  assert.equal(suggestPart(10), "staff");
  assert.equal(suggestTooth([], 4), 3);
  assert.equal(suggestTooth([], 10), 6);
  assert.equal(suggestTooth([], 11), 9);
  assert.equal(suggestTooth([], 20), 12);
  assert.equal(suggestWash([]), "IVORY");
  assert.equal(moveContrateFocus(0, 3, 1), 1);
  assert.equal(moveContrateFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", part: "pinion" });
  const due = rule({ id: "b", title: "Bea", part: "arbor", lock: 1 });
  const quiet = rule({ id: "c", title: "Cara", tooth: 3, lock: 1 });
  const live = rule({ id: "d", title: "Dora", wash: "GILT", tooth: 12, lock: 5 });
  const rest = rule({ id: "e", title: "Eve", part: "staff", wash: "IVORY", tooth: 6 });
  assert.equal(lateContrate(late, "staff"), true);
  assert.equal(lateContrate(late, "pinion"), false);
  assert.equal(overdueContrate(due), true);
  assert.equal(idleContrate(quiet), true);
  assert.equal(briskContrate(live), true);
  assert.equal(restingContrate(rest), true);
  assert.deepEqual(reminderContrateRules([due, late]), ["Bea"]);
  assert.equal(fairKeeper([rule({ id: "1", title: "One", keeper: "Ada" }), rule({ id: "2", title: "Two", keeper: "Bea" }), rule({ id: "3", title: "Three", keeper: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", tooth: 12 }), rule({ id: "2", title: "East", tooth: 6 })];
  assert.match(contrateTimeline(cards).map((lane) => lane.tooth).join(","), /12|6/);
  const saved = addContrate([], { title: "Ada", part: "wheel", tooth: "6", wash: "gilt", lock: "3", tags: "c r x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].part, "wheel");
  assert.equal(saved[0].tooth, 6);
  assert.equal(saved[0].lock, 3);
  assert.deepEqual(saved[0].tags, ["c", "r"]);
  assert.equal(addContrate(saved, { title: "Ada" }).length, 1);
  assert.equal(addContrate([], { title: "Eve" })[0].lock, 1);
  assert.equal(dropContrateView([{ id: "v", name: "Morning", tray: "bench", query: "", keeper: "", wash: "all", part: "all", tooth: "all", lock: "all" }], "v").length, 0);
  assert.equal(readContrateViews([{ id: "v", name: "Morning", tray: "latch" }])[0].tray, "latch");

  assert.equal(jacquemartCode("in"), true);
  assert.equal(jacquemartCode("HOLD"), true);
  assert.equal(jacquemartCode({ loginEnabled: true }), true);
  assert.equal(jacquemartPlain({ loginEnabled: false }), true);
  assert.equal(jacquemartCode({ loginEnabled: "plain" }), false);
  assert.equal(jacquemartJoin("IN/HOLD"), true);
  assert.equal(jacquemartJoin("IN HOLD"), false);
  assert.equal(jacquemartGap("IN:HOLD"), true);
  assert.equal(jacquemartGap("INHOLD"), false);
  assert.equal(jacquemartChip("Wren"), true);
  assert.equal(jacquemartChip("HOLD"), false);
  assert.equal(jacquemartBanner("Abcdefghijklmn"), true);
  assert.equal(jacquemartBanner("Amsterdam"), false);
  assert.equal(jacquemartLane("IN"), "code");
  assert.equal(jacquemartLane("Wren"), "chip");
  assert.equal(jacquemartLane("Letter"), "plain");
  assert.equal(jacquemartLane("10lang"), "mark");
  assert.equal(jacquemartLane("Amsterdam"), "vowel");
  assert.equal(jacquemartOpen(""), true);
  assert.equal(jacquemartOpen({ loginEnabled: "" }), true);
  assert.equal(jacquemartState({ name: "Ada" }), "");
  assert.equal(jacquemartState({ loginEnabled: "Paris", balance: 1 }), "");
  assert.equal(jacquemartHue("IN"), "champagne");
  assert.equal(jacquemartHue("IN/HOLD"), "graphite");
  assert.equal(jacquemartHue("Letter"), "ivory");
  assert.equal(jacquemartLength("hold"), 4);
  assert.equal(jacquemartEven("hold"), true);
  assert.equal(jacquemartFirst("Paris"), true);
  assert.equal(jacquemartSpace("needs review"), true);
  assert.equal(jacquemartVowel("Amsterdam"), true);
  assert.equal(jacquemartDigit("Room4"), true);
  assert.equal(jacquemartCapital("PARIS"), true);
  assert.equal(jacquemartLower("paris"), true);
  assert.equal(jacquemartUpper("ENGLISH"), true);
  assert.equal(jacquemartUpper("EN"), false);
  assert.equal(jacquemartTail("Room4"), true);
  const marks: JacquemartRow[] = [
    { id: "1", label: "Ada", code: "IN" },
    { id: "2", label: "Bea", code: "HOLD" },
    { id: "3", label: "Cara", code: "Paris" },
  ];
  assert.equal(leadingJacquemart(marks), "code");
  assert.match(jacquemartLanesCsv(marks), /code,2/);
  assert.match(jacquemartRowsCsv(marks, ["1"]), /Ada,IN/);
  assert.equal(crmv4Text("tr", "ctrTitle"), ROUND330_COPY.tr.ctrTitle);
  assert.equal(crmv4Text("de", "jcqTitle"), ROUND330_COPY.de.jcqTitle);
  assert.equal(crmv4Text("ru", "brfApodyteriumKicker"), ROUND330_COPY.ru.brfApodyteriumKicker);
  assert.equal(crmv4Text("ar", "lexFrigidariumLead"), ROUND330_COPY.ar.lexFrigidariumLead);
  const keys = Object.keys(ROUND330_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND330_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-contrate/);
  assert.match(css, /\.c4-jacquemart/);
  assert.match(css, /\.c4-contrate-column/);
  assert.match(css, /\.c4-jacquemart-column/);
  assert.match(css, /\.c4-brf-apodyterium/);
  assert.match(css, /\.c4-lex-frigidarium/);
  assert.match(css, /\.c4-brf-apodyterium-mast/);
  assert.match(css, /\.c4-lex-frigidarium-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round330.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /loginEnabled/);
  assert.match(viewFile, /contrateCsv/);
  assert.match(viewFile, /jacquemartRowsCsv/);
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
  assert.match(viewFile, /c4-jacquemart-search/);
  assert.match(viewFile, /contrateTimeline/);
  assert.match(viewFile, /c4-contrate-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "ctr"/);
  assert.match(app, /view === "jcq"/);
  const host = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round150.tsx"), "utf8");
  assert.match(host, /c4-brf-apodyterium/);
  assert.match(host, /c4-brf-apodyterium-mast/);
  assert.match(host, /data-logo="mono"/);
  assert.match(host, /brfApodyteriumKicker/);
  assert.match(host, /brfApodyteriumLead/);
  assert.match(host, /data-briefing/);
  assert.equal(host.includes("amount"), false);
  assert.match(host, /c4-lex-frigidarium/);
  assert.match(host, /c4-lex-frigidarium-mast/);
  assert.match(host, /lexFrigidariumKicker/);
  assert.match(host, /lexFrigidariumLead/);
  assert.match(host, /data-lexicon/);
  assert.equal(host.includes("currency"), false);
  assert.equal(host.includes("saleStatus"), false);
  const namedKeys = `${viewFile}\n${host}`.match(/"(ctr|jcq|brfApodyterium|lexFrigidarium)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND330_COPY.en[key as keyof typeof ROUND330_COPY.en], "string", key);
  console.log("crmv4 round330 tests passed");
}

main();
