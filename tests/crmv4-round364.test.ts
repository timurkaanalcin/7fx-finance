/**
 * Wolf-tooth rules, document plates, the ivory visit atrium, and the graphite document podium.
 * Run: TZ=UTC npx tsx tests/crmv4-round364.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND364_COPY } from "../src/lib/crmv4/copy-round364";
import {
  ROUND364_FEATURES,
  activeFinish,
  activeMode,
  activeHour,
  activeHammer,
  addWolf,
  briskWolf,
  dropWolfView,
  fairKeeper,
  doxHome,
  doxBrief,
  doxDigit,
  doxEven,
  doxFirst,
  doxRoute,
  doxHue,
  doxJoin,
  doxCitizen,
  doxLane,
  doxLanesCsv,
  doxLength,
  doxLower,
  doxGuest,
  doxAway,
  doxOpen,
  doxPlain,
  doxLong,
  doxRowsCsv,
  doxSoon,
  doxSpace,
  doxState,
  doxUpper,
  doxVowel,
  doxDesk,
  fullHammer,
  idleWolf,
  lateWolf,
  leadingSel,
  moveWolfFocus,
  wolfBand,
  wolfHour,
  wolfGap,
  wolfInner,
  wolfMode,
  wolfOuter,
  wolfHammer,
  wolfFilm,
  wolfTimeline,
  overdueWolf,
  pairHammer,
  quietFinish,
  readWolfViews,
  reminderWolfes,
  restingWolf,
  suggestFinish,
  suggestMode,
  suggestHour,
  type DoxRow,
  type Wolf,
} from "../src/lib/crmv4/round364";

function rule(partial: Partial<Wolf> & { id: string; title: string }): Wolf {
  return {
    note: "",
    setter: "",
    piece: "",
    drop: null,
    film: "",
    lock: 2,
    tags: [],
    raised: false,
    pinned: false,
    coffered: false,
    starred: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND364_FEATURES.length, 25);
  assert.equal(ROUND364_FEATURES.includes("document-plate"), true);
  assert.equal(ROUND364_FEATURES.includes("wolf-click-sla"), true);
  assert.equal(ROUND364_FEATURES.includes("fair-winder"), true);
  assert.equal(ROUND364_FEATURES.includes("fang-archive"), true);
  assert.equal(ROUND364_FEATURES.includes("fang-reminders"), true);
  assert.equal(ROUND364_FEATURES.includes("wolf-search"), true);
  assert.equal(ROUND364_FEATURES.includes("fang-timeline"), true);
  assert.equal(wolfMode(" click "), "click");
  assert.equal(wolfMode("brass"), "");
  assert.equal(wolfHour("4"), 4);
  assert.equal(wolfHour(8), 8);
  assert.equal(wolfHour(16), 16);
  assert.equal(wolfHour(32), 32);
  assert.equal(wolfHour("6"), null);
  assert.equal(wolfHour("12"), null);
  assert.equal(wolfHammer("2"), 2);
  assert.equal(wolfHammer(5), 5);
  assert.equal(wolfHammer("7"), 7);
  assert.equal(wolfHammer("3"), null);
  assert.equal(wolfHammer("4"), null);
  assert.equal(wolfFilm("gilt"), "GILT");
  assert.equal(wolfFilm("ivory"), "IVORY");
  assert.equal(wolfFilm("graphite"), "GRAPHITE");
  assert.equal(wolfFilm("hot"), "");
  assert.equal(wolfInner("click"), true);
  assert.equal(wolfInner("TOOTH"), true);
  assert.equal(wolfInner("pawl"), false);
  assert.equal(wolfOuter("pawl"), true);
  assert.equal(wolfOuter("ratch"), true);
  assert.equal(wolfOuter("click"), false);
  assert.equal(wolfBand("click"), "bite");
  assert.equal(wolfBand("tooth"), "fang");
  assert.equal(wolfBand("pawl"), "stop");
  assert.equal(wolfBand("ratch"), "wind");
  assert.equal(wolfGap("click", "ratch"), 3);
  assert.equal(quietFinish("graphite"), true);
  assert.equal(quietFinish("ivory"), false);
  assert.equal(quietFinish("gilt"), false);
  assert.equal(pairHammer(5), true);
  assert.equal(pairHammer(2), false);
  assert.equal(fullHammer(7), true);
  assert.equal(fullHammer(5), false);
  assert.equal(activeMode("inner"), "inner");
  assert.equal(activeHour("4"), "4");
  assert.equal(activeHour("7"), "all");
  assert.equal(activeHammer("7"), "7");
  assert.equal(activeHammer("3"), "all");
  assert.equal(activeFinish("gilt", ["GILT"]), "GILT");
  assert.equal(suggestMode(4), "click");
  assert.equal(suggestMode(10), "ratch");
  assert.equal(suggestHour([], 3), 4);
  assert.equal(suggestHour([], 8), 8);
  assert.equal(suggestHour([], 14), 16);
  assert.equal(suggestHour([], 20), 32);
  assert.equal(suggestFinish([]), "GRAPHITE");
  assert.equal(moveWolfFocus(0, 3, 1), 1);
  assert.equal(moveWolfFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", piece: "click" });
  const due = rule({ id: "b", title: "Bea", piece: "pawl", lock: 2 });
  const quiet = rule({ id: "c", title: "Cara", drop: 4, lock: 2 });
  const cell = rule({ id: "d", title: "Dora", film: "GILT", drop: 32, lock: 7 });
  const fax = rule({ id: "e", title: "Eve", piece: "ratch", film: "GRAPHITE", drop: 8 });
  assert.equal(lateWolf(late, "ratch"), true);
  assert.equal(lateWolf(late, "click"), false);
  assert.equal(overdueWolf(due), true);
  assert.equal(idleWolf(quiet), true);
  assert.equal(briskWolf(cell), true);
  assert.equal(restingWolf(fax), true);
  assert.deepEqual(reminderWolfes([due, late]), ["Bea"]);
  assert.equal(fairKeeper([rule({ id: "1", title: "One", setter: "Ada" }), rule({ id: "2", title: "Two", setter: "Bea" }), rule({ id: "3", title: "Three", setter: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", drop: 8 }), rule({ id: "2", title: "East", drop: 4 })];
  assert.match(wolfTimeline(cards).map((mail) => mail.drop).join(","), /8/);
  const saved = addWolf([], { title: "Ada", piece: "tooth", drop: "8", film: "gilt", lock: "5", tags: "k n x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].piece, "tooth");
  assert.equal(saved[0].drop, 8);
  assert.equal(saved[0].lock, 5);
  assert.deepEqual(saved[0].tags, ["k", "n"]);
  assert.equal(addWolf(saved, { title: "Ada" }).length, 1);
  assert.equal(addWolf([], { title: "Eve" })[0].lock, 2);
  assert.equal(dropWolfView([{ id: "v", name: "Morning", tray: "board", query: "", setter: "", film: "all", piece: "all", drop: "all", lock: "all" }], "v").length, 0);
  assert.equal(readWolfViews([{ id: "v", name: "Morning", tray: "peg" }])[0].tray, "peg");

  const now = Date.parse("2026-11-20T12:00:00.000Z");
  assert.equal(doxHome("PASS", now), true);
  assert.equal(doxHome("YES", now), true);
  assert.equal(doxDesk("PENDING", now), true);
  assert.equal(doxHome("2026-11-20T01:00:00.000Z", now), true);
  assert.equal(doxAway("closed file", now), true);
  assert.equal(doxGuest("2026-11-14T12:00:00.000Z", now), true);
  assert.equal(doxCitizen("2025-01-01T00:00:00.000Z", now), true);
  assert.equal(doxDesk("2026-11-19T12:00:00.000Z", now), true);
  assert.equal(doxHome({ documentsStatus: true }, now), true);
  assert.equal(doxHome({ documentsStatus: "2026-11-20T08:00:00.000Z" }, now), true);
  assert.equal(doxPlain({ documentsStatus: false }, now), true);
  assert.equal(doxAway({ documentsStatus: false }, now), false);
  assert.equal(doxPlain({ documentsStatus: "Granite" }, now), true);
  assert.equal(doxHome({ documentsStatus: "Granite" }, now), false);
  assert.equal(doxBrief({ documentsStatus: "MARKS" }, now), true);
  assert.equal(doxJoin("PASS+FILE", now), true);
  assert.equal(doxJoin("ANNA NOAH", now), false);
  assert.equal(doxRoute("SALE:EAST", now), true);
  assert.equal(doxRoute("SETHOLD", now), false);
  assert.equal(doxBrief("MARK", now), false);
  assert.equal(doxBrief("PASS", now), false);
  assert.equal(doxLong("TwelveCharsX", now), true);
  assert.equal(doxLong("ElevenCharX", now), false);
  assert.equal(doxLane("PASS", now), "hall");
  assert.equal(doxLane("PENDING", now), "desk");
  assert.equal(doxLane("HOLD", now), "hold");
  assert.equal(doxLane("REJECTED", now), "guest");
  assert.equal(doxLane("PAIR", now), "join");
  assert.equal(doxLane("2026-11-19T12:00:00.000Z", now), "desk");
  assert.equal(doxLane("2026-11-14T12:00:00.000Z", now), "hold");
  assert.equal(doxLane("2025-01-01T00:00:00.000Z", now), "guest");
  assert.equal(doxLane("Granite", now), "plain");
  assert.equal(doxLane("MARKS", now), "brief");
  assert.equal(doxLane("20261120T073000Z", now), "stamp");
  assert.equal(doxLane("Amsterdam", now), "vowel");
  assert.equal(doxLane("closed file", now), "vacant");
  assert.equal(doxLane("alpha/beta/gamma", now), "route");
  assert.equal(doxLane("kyc file", now), "hall");
  assert.equal(doxOpen(""), true);
  assert.equal(doxOpen({ documentsStatus: "" }), true);
  assert.equal(doxState({ name: "Ada" }), "");
  assert.equal(doxState({ documentsStatus: "Paris", balance: 1 }), "");
  assert.equal(doxHue("PASS", now), "champagne");
  assert.equal(doxHue("PASS+FILE", now), "graphite");
  assert.equal(doxHue("2026-11-14T12:00:00.000Z", now), "champagne");
  assert.equal(doxHue("2026-11-19T12:00:00.000Z", now), "graphite");
  assert.equal(doxSoon("MARKS", now), true);
  assert.equal(doxSoon("PASS", now), false);
  assert.equal(doxSoon("AB", now), true);
  assert.equal(doxHue("Marble", now), "ivory");
  assert.equal(doxLength("yes"), 3);
  assert.equal(doxEven("ab"), true);
  assert.equal(doxFirst("Paris"), true);
  assert.equal(doxSpace("needs review"), true);
  assert.equal(doxVowel("Amsterdam"), true);
  assert.equal(doxDigit("Room4"), true);
  assert.equal(doxLower("paris"), true);
  assert.equal(doxUpper("APPROVED"), true);
  assert.equal(doxUpper("SEALED"), false);
  assert.equal(doxUpper("CLEAR"), false);
  const marks: DoxRow[] = [
    { id: "1", label: "Ada", code: "PASS" },
    { id: "2", label: "Bea", code: "PASS" },
    { id: "3", label: "Cara", code: "Marble" },
  ];
  assert.equal(leadingSel(marks), "hall");
  assert.match(doxLanesCsv(marks), /hall,2/);
  assert.match(doxRowsCsv(marks, ["1"]), /Ada,PASS/);
  assert.equal(crmv4Text("tr", "wftTitle"), ROUND364_COPY.tr.wftTitle);
  assert.equal(crmv4Text("de", "doxTitle"), ROUND364_COPY.de.doxTitle);
  assert.equal(crmv4Text("ru", "vlAtriumKicker"), ROUND364_COPY.ru.vlAtriumKicker);
  assert.equal(crmv4Text("ar", "ydPodiumLead"), ROUND364_COPY.ar.ydPodiumLead);
  const keys = Object.keys(ROUND364_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND364_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-wolf/);
  assert.match(css, /\.c4-doxplate/);
  assert.match(css, /\.c4-wolf-column/);
  assert.match(css, /\.c4-doxplate-column/);
  assert.match(css, /\.c4-visit-atrium/);
  assert.match(css, /\.c4-kyc-podium/);
  assert.match(css, /\.c4-vl-atrium-mast/);
  assert.match(css, /\.c4-yd-podium-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round364.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /documentsStatus:/);
  assert.match(viewFile, /wolfCsv/);
  assert.match(viewFile, /doxRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestFinish/);
  assert.match(viewFile, /c4-doxplate-search/);
  assert.match(viewFile, /wolfTimeline/);
  assert.match(viewFile, /c4-wolf-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "wft"/);
  assert.match(app, /view === "dox"/);
  const desks = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round117.tsx"), "utf8");
  assert.match(desks, /c4-visit-atrium/);
  assert.match(desks, /c4-vl-atrium-mast/);
  assert.match(desks, /data-logo="mono"/);
  assert.match(desks, /vlAtriumKicker/);
  assert.match(desks, /vlAtriumLead/);
  assert.match(desks, /data-visit-atrium/);
  const visit = desks.slice(desks.indexOf("export function VisitLog"), desks.indexOf("export function DocumentStatuses"));
  assert.equal(visit.includes("amount"), false);
  assert.equal(visit.includes("price"), false);
  assert.match(desks, /c4-kyc-podium/);
  assert.match(desks, /c4-yd-podium-mast/);
  assert.match(desks, /ydPodiumKicker/);
  assert.match(desks, /ydPodiumLead/);
  assert.match(desks, /data-kyc-podium/);
  const porch = desks.slice(desks.indexOf("export function DocumentStatuses"));
  assert.equal(porch.includes("amount"), false);
  assert.equal(porch.includes("profit"), false);
  assert.match(porch, /statusText/);
  const namedKeys = `${viewFile}\n${desks}`.match(/"(wft|dox|vlAtrium|ydPodium)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND364_COPY.en[key as keyof typeof ROUND364_COPY.en], "string", key);
  console.log("crmv4 round364 tests passed");
}

main();
