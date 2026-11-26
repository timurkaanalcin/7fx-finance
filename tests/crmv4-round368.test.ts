/**
 * Repoussé chase rules, affiliate B plates, the ivory checklist chalcidicum, and the graphite introducer temenos.
 * Run: TZ=UTC npx tsx tests/crmv4-round368.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND368_COPY } from "../src/lib/crmv4/copy-round368";
import { ROUND367_FEATURES } from "../src/lib/crmv4/round367";
import {
  ROUND368_FEATURES,
  activeFinish,
  activeMode,
  activeHour,
  activeHammer,
  addRepousse,
  briskRepousse,
  dropRepousseView,
  fairKeeper,
  afbHome,
  afbBrief,
  afbDigit,
  afbEven,
  afbFirst,
  afbRoute,
  afbHue,
  afbJoin,
  afbCitizen,
  afbLane,
  afbLanesCsv,
  afbLength,
  afbLower,
  afbGuest,
  afbAway,
  afbOpen,
  afbPlain,
  afbLong,
  afbRowsCsv,
  afbSoon,
  afbSpace,
  afbState,
  afbUpper,
  afbVowel,
  afbDesk,
  fullHammer,
  idleRepousse,
  lateRepousse,
  leadingSel,
  moveRepousseFocus,
  repousseBand,
  repousseHour,
  repousseGap,
  repousseInner,
  repousseMode,
  repousseOuter,
  repousseHammer,
  repousseFilm,
  repousseTimeline,
  overdueRepousse,
  pairHammer,
  quietFinish,
  readRepousseViews,
  reminderRepousseCards,
  restingRepousse,
  suggestFinish,
  suggestMode,
  suggestHour,
  type LisRow,
  type Repousse,
} from "../src/lib/crmv4/round368";

function rule(partial: Partial<Repousse> & { id: string; title: string }): Repousse {
  return {
    note: "",
    setter: "",
    piece: "",
    drop: null,
    film: "",
    lock: 3,
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
  assert.equal(ROUND368_FEATURES.length, 25);
  assert.equal(ROUND368_FEATURES.includes("affiliate-b-plate"), true);
  assert.equal(ROUND368_FEATURES.includes("repousse-pitch-sla"), true);
  assert.equal(ROUND368_FEATURES.includes("fair-chaser"), true);
  assert.equal(ROUND368_FEATURES.includes("chase-archive"), true);
  assert.equal(ROUND368_FEATURES.includes("chase-reminders"), true);
  assert.equal(ROUND368_FEATURES.includes("repousse-search"), true);
  assert.equal(ROUND368_FEATURES.includes("chase-timeline"), true);
  for (const feature of ROUND368_FEATURES) assert.equal(ROUND367_FEATURES.includes(feature), false, feature);
  assert.equal(repousseMode(" boss "), "boss");
  assert.equal(repousseMode("brass"), "");
  assert.equal(repousseHour("6"), 6);
  assert.equal(repousseHour(12), 12);
  assert.equal(repousseHour(18), 18);
  assert.equal(repousseHour(36), 36);
  assert.equal(repousseHour("7"), null);
  assert.equal(repousseHour("3"), null);
  assert.equal(repousseHammer("3"), 3);
  assert.equal(repousseHammer(6), 6);
  assert.equal(repousseHammer("9"), 9);
  assert.equal(repousseHammer("4"), null);
  assert.equal(repousseHammer("8"), null);
  assert.equal(repousseFilm("gilt"), "GILT");
  assert.equal(repousseFilm("ivory"), "IVORY");
  assert.equal(repousseFilm("graphite"), "GRAPHITE");
  assert.equal(repousseFilm("hot"), "");
  assert.equal(repousseInner("boss"), true);
  assert.equal(repousseInner("LOBE"), true);
  assert.equal(repousseInner("beak"), false);
  assert.equal(repousseOuter("scroll"), true);
  assert.equal(repousseOuter("rim"), true);
  assert.equal(repousseOuter("boss"), false);
  assert.equal(repousseBand("boss"), "relief");
  assert.equal(repousseBand("lobe"), "swell");
  assert.equal(repousseBand("scroll"), "border");
  assert.equal(repousseBand("rim"), "edge");
  assert.equal(repousseGap("boss", "rim"), 3);
  assert.equal(quietFinish("graphite"), true);
  assert.equal(quietFinish("ivory"), false);
  assert.equal(quietFinish("gilt"), false);
  assert.equal(pairHammer(6), true);
  assert.equal(pairHammer(3), false);
  assert.equal(fullHammer(9), true);
  assert.equal(fullHammer(6), false);
  assert.equal(activeMode("inner"), "inner");
  assert.equal(activeHour("6"), "6");
  assert.equal(activeHour("7"), "all");
  assert.equal(activeHammer("9"), "9");
  assert.equal(activeHammer("4"), "all");
  assert.equal(activeFinish("gilt", ["GILT"]), "GILT");
  assert.equal(suggestMode(4), "boss");
  assert.equal(suggestMode(10), "rim");
  assert.equal(suggestHour([], 3), 6);
  assert.equal(suggestHour([], 8), 12);
  assert.equal(suggestHour([], 14), 18);
  assert.equal(suggestHour([], 20), 36);
  assert.equal(suggestFinish([]), "IVORY");
  assert.equal(moveRepousseFocus(0, 3, 1), 1);
  assert.equal(moveRepousseFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", piece: "boss" });
  const due = rule({ id: "b", title: "Bea", piece: "scroll", lock: 3 });
  const quiet = rule({ id: "c", title: "Cara", drop: 6, lock: 3 });
  const cell = rule({ id: "d", title: "Dora", film: "GILT", drop: 36, lock: 9 });
  const fax = rule({ id: "e", title: "Eve", piece: "rim", film: "IVORY", drop: 12 });
  assert.equal(lateRepousse(late, "rim"), true);
  assert.equal(lateRepousse(late, "boss"), false);
  assert.equal(overdueRepousse(due), true);
  assert.equal(idleRepousse(quiet), true);
  assert.equal(briskRepousse(cell), true);
  assert.equal(restingRepousse(fax), true);
  assert.deepEqual(reminderRepousseCards([due, late]), ["Bea"]);
  assert.equal(fairKeeper([rule({ id: "1", title: "One", setter: "Ada" }), rule({ id: "2", title: "Two", setter: "Bea" }), rule({ id: "3", title: "Three", setter: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", drop: 12 }), rule({ id: "2", title: "East", drop: 6 })];
  assert.match(repousseTimeline(cards).map((mail) => mail.drop).join(","), /12/);
  const saved = addRepousse([], { title: "Ada", piece: "lobe", drop: "12", film: "gilt", lock: "6", tags: "r p x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].piece, "lobe");
  assert.equal(saved[0].drop, 12);
  assert.equal(saved[0].lock, 6);
  assert.deepEqual(saved[0].tags, ["r", "p"]);
  assert.equal(addRepousse(saved, { title: "Ada" }).length, 1);
  assert.equal(addRepousse([], { title: "Eve" })[0].lock, 3);
  assert.equal(dropRepousseView([{ id: "v", name: "Morning", tray: "board", query: "", setter: "", film: "all", piece: "all", drop: "all", lock: "all" }], "v").length, 0);
  assert.equal(readRepousseViews([{ id: "v", name: "Morning", tray: "peg" }])[0].tray, "peg");

  const now = Date.parse("2026-11-20T12:00:00.000Z");
  assert.equal(afbHome("PARTNER", now), true);
  assert.equal(afbHome("YES", now), true);
  assert.equal(afbDesk("WEB", now), true);
  assert.equal(afbHome("2026-11-20T01:00:00.000Z", now), true);
  assert.equal(afbAway("quiet book", now), true);
  assert.equal(afbGuest("2026-11-12T12:00:00.000Z", now), true);
  assert.equal(afbCitizen("2025-01-01T00:00:00.000Z", now), true);
  assert.equal(afbDesk("2026-11-18T12:00:00.000Z", now), true);
  assert.equal(afbHome({ affiliateB: true }, now), true);
  assert.equal(afbHome({ affiliateB: "2026-11-20T08:00:00.000Z" }, now), true);
  assert.equal(afbPlain({ affiliateB: false }, now), true);
  assert.equal(afbAway({ affiliateB: false }, now), false);
  assert.equal(afbPlain({ affiliateB: "Granite" }, now), true);
  assert.equal(afbHome({ affiliateB: "Granite" }, now), false);
  assert.equal(afbBrief({ affiliateB: "MARKSX" }, now), true);
  assert.equal(afbJoin("LIVE&BOOK", now), true);
  assert.equal(afbJoin("ANNA NOAH", now), false);
  assert.equal(afbRoute("SALE/EAST", now), true);
  assert.equal(afbRoute("SETHOLD", now), false);
  assert.equal(afbBrief("PARTNER", now), false);
  assert.equal(afbBrief("MARKSX", now), true);
  assert.equal(afbLong("GraphiteMarker", now), true);
  assert.equal(afbLong("ElevenChars", now), false);
  assert.equal(afbLane("PARTNER", now), "hall");
  assert.equal(afbLane("WEB", now), "desk");
  assert.equal(afbLane("WAIT", now), "hold");
  assert.equal(afbLane("LOST", now), "guest");
  assert.equal(afbLane("TWIN", now), "join");
  assert.equal(afbLane("2026-11-18T12:00:00.000Z", now), "desk");
  assert.equal(afbLane("2026-11-12T12:00:00.000Z", now), "hold");
  assert.equal(afbLane("2025-01-01T00:00:00.000Z", now), "guest");
  assert.equal(afbLane("Granite", now), "plain");
  assert.equal(afbLane("MARKSX", now), "brief");
  assert.equal(afbLane("20261120T073000Z", now), "stamp");
  assert.equal(afbLane("Amsterdam", now), "vowel");
  assert.equal(afbLane("quiet book", now), "vacant");
  assert.equal(afbLane("alpha/beta/gamma", now), "route");
  assert.equal(afbLane("partner desk", now), "hall");
  assert.equal(afbOpen(""), true);
  assert.equal(afbOpen({ affiliateB: "" }), true);
  assert.equal(afbState({ name: "Ada" }), "");
  assert.equal(afbState({ affiliateB: "Paris", balance: 1 }), "");
  assert.equal(afbHue("PARTNER", now), "champagne");
  assert.equal(afbHue("PARTNER&DESK", now), "champagne");
  assert.equal(afbHue("2026-11-12T12:00:00.000Z", now), "ivory");
  assert.equal(afbHue("2026-11-18T12:00:00.000Z", now), "graphite");
  assert.equal(afbSoon("MARKSX", now), true);
  assert.equal(afbSoon("PARTNER", now), false);
  assert.equal(afbSoon("ABCDEF", now), true);
  assert.equal(afbSoon("AB", now), false);
  assert.equal(afbHue("Granite", now), "ivory");
  assert.equal(afbLength("yes"), 3);
  assert.equal(afbEven("ab"), true);
  assert.equal(afbFirst("Paris"), true);
  assert.equal(afbSpace("needs review"), true);
  assert.equal(afbVowel("Amsterdam"), true);
  assert.equal(afbDigit("Room4"), true);
  assert.equal(afbLower("paris"), true);
  assert.equal(afbUpper("CHAMPAGNE"), true);
  assert.equal(afbUpper("APPROVED"), false);
  assert.equal(afbUpper("SEALED"), false);
  assert.equal(afbUpper("CLEAR"), false);
  const marks: LisRow[] = [
    { id: "1", label: "Ada", code: "PARTNER" },
    { id: "2", label: "Bea", code: "PARTNER" },
    { id: "3", label: "Cara", code: "Granite" },
  ];
  assert.equal(leadingSel(marks), "hall");
  assert.match(afbLanesCsv(marks), /hall,2/);
  assert.match(afbRowsCsv(marks, ["1"]), /Ada,PARTNER/);
  assert.equal(crmv4Text("tr", "rpsTitle"), ROUND368_COPY.tr.rpsTitle);
  assert.equal(crmv4Text("de", "afbTitle"), ROUND368_COPY.de.afbTitle);
  assert.equal(crmv4Text("ru", "chChalcidicumKicker"), ROUND368_COPY.ru.chChalcidicumKicker);
  assert.equal(crmv4Text("ar", "bxTemenosLead"), ROUND368_COPY.ar.bxTemenosLead);
  const keys = Object.keys(ROUND368_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND368_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-repousse/);
  assert.match(css, /\.c4-afbplate/);
  assert.match(css, /\.c4-repousse-column/);
  assert.match(css, /\.c4-afbplate-column/);
  assert.match(css, /\.c4-ch-chalcidicum/);
  assert.match(css, /\.c4-bx-temenos/);
  assert.match(css, /\.c4-ch-chalcidicum-mast/);
  assert.match(css, /\.c4-bx-temenos-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round368.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /affiliateB:/);
  assert.match(viewFile, /repousseCsv/);
  assert.match(viewFile, /afbRowsCsv/);
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
  assert.match(viewFile, /c4-afbplate-search/);
  assert.match(viewFile, /repousseTimeline/);
  assert.match(viewFile, /c4-repousse-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "rps"/);
  assert.match(app, /view === "afb"/);
  const checks = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round89.tsx"), "utf8");
  assert.match(checks, /c4-ch-chalcidicum/);
  assert.match(checks, /c4-ch-chalcidicum-mast/);
  assert.match(checks, /data-logo="mono"/);
  assert.match(checks, /chChalcidicumKicker/);
  assert.match(checks, /chChalcidicumLead/);
  assert.match(checks, /data-ch-chalcidicum/);
  const porch = checks.slice(checks.indexOf("export function DeskCheck"));
  assert.equal(porch.includes("amount"), false);
  assert.equal(porch.includes("price"), false);
  const introducers = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round100.tsx"), "utf8");
  assert.match(introducers, /c4-bx-temenos/);
  assert.match(introducers, /c4-bx-temenos-mast/);
  assert.match(introducers, /bxTemenosKicker/);
  assert.match(introducers, /bxTemenosLead/);
  assert.match(introducers, /data-bx-temenos/);
  const precinct = introducers.slice(introducers.indexOf("export function IbStatusGlance"));
  assert.equal(precinct.includes("amount"), false);
  assert.equal(precinct.includes("profit"), false);
  assert.match(precinct, /statusText/);
  const namedKeys = `${viewFile}\n${checks}\n${introducers}`.match(/"(rps|afb|chChalcidicum|bxTemenos)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND368_COPY.en[key as keyof typeof ROUND368_COPY.en], "string", key);
  console.log("crmv4 round368 tests passed");
}

main();
