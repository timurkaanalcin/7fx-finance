/**
 * Tapisserie weave rules, affiliate plates, the ivory withdrawal castellum, and the graphite deposit thesaurus.
 * Run: TZ=UTC npx tsx tests/crmv4-round367.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND367_COPY } from "../src/lib/crmv4/copy-round367";
import { ROUND366_FEATURES } from "../src/lib/crmv4/round366";
import {
  ROUND367_FEATURES,
  activeFinish,
  activeMode,
  activeHour,
  activeHammer,
  addTapisserie,
  briskTapisserie,
  dropTapisserieView,
  fairKeeper,
  afaHome,
  afaBrief,
  afaDigit,
  afaEven,
  afaFirst,
  afaRoute,
  afaHue,
  afaJoin,
  afaCitizen,
  afaLane,
  afaLanesCsv,
  afaLength,
  afaLower,
  afaGuest,
  afaAway,
  afaOpen,
  afaPlain,
  afaLong,
  afaRowsCsv,
  afaSoon,
  afaSpace,
  afaState,
  afaUpper,
  afaVowel,
  afaDesk,
  fullHammer,
  idleTapisserie,
  lateTapisserie,
  leadingSel,
  moveTapisserieFocus,
  tapisserieBand,
  tapisserieHour,
  tapisserieGap,
  tapisserieInner,
  tapisserieMode,
  tapisserieOuter,
  tapisserieHammer,
  tapisserieFilm,
  tapisserieTimeline,
  overdueTapisserie,
  pairHammer,
  quietFinish,
  readTapisserieViews,
  reminderTapisserieCards,
  restingTapisserie,
  suggestFinish,
  suggestMode,
  suggestHour,
  type LisRow,
  type Tapisserie,
} from "../src/lib/crmv4/round367";

function rule(partial: Partial<Tapisserie> & { id: string; title: string }): Tapisserie {
  return {
    note: "",
    setter: "",
    piece: "",
    drop: null,
    film: "",
    lock: 4,
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
  assert.equal(ROUND367_FEATURES.length, 25);
  assert.equal(ROUND367_FEATURES.includes("affiliate-a-plate"), true);
  assert.equal(ROUND367_FEATURES.includes("tapisserie-pitch-sla"), true);
  assert.equal(ROUND367_FEATURES.includes("fair-loom"), true);
  assert.equal(ROUND367_FEATURES.includes("fringe-archive"), true);
  assert.equal(ROUND367_FEATURES.includes("fringe-reminders"), true);
  assert.equal(ROUND367_FEATURES.includes("tapisserie-search"), true);
  assert.equal(ROUND367_FEATURES.includes("fringe-timeline"), true);
  for (const feature of ROUND367_FEATURES) assert.equal(ROUND366_FEATURES.includes(feature), false, feature);
  assert.equal(tapisserieMode(" warp "), "warp");
  assert.equal(tapisserieMode("brass"), "");
  assert.equal(tapisserieHour("5"), 5);
  assert.equal(tapisserieHour(10), 10);
  assert.equal(tapisserieHour(20), 20);
  assert.equal(tapisserieHour(40), 40);
  assert.equal(tapisserieHour("6"), null);
  assert.equal(tapisserieHour("3"), null);
  assert.equal(tapisserieHammer("4"), 4);
  assert.equal(tapisserieHammer(7), 7);
  assert.equal(tapisserieHammer("11"), 11);
  assert.equal(tapisserieHammer("3"), null);
  assert.equal(tapisserieHammer("9"), null);
  assert.equal(tapisserieFilm("gilt"), "GILT");
  assert.equal(tapisserieFilm("ivory"), "IVORY");
  assert.equal(tapisserieFilm("graphite"), "GRAPHITE");
  assert.equal(tapisserieFilm("hot"), "");
  assert.equal(tapisserieInner("warp"), true);
  assert.equal(tapisserieInner("WEFT"), true);
  assert.equal(tapisserieInner("beak"), false);
  assert.equal(tapisserieOuter("selvage"), true);
  assert.equal(tapisserieOuter("fringe"), true);
  assert.equal(tapisserieOuter("warp"), false);
  assert.equal(tapisserieBand("warp"), "reed");
  assert.equal(tapisserieBand("weft"), "shuttle");
  assert.equal(tapisserieBand("selvage"), "edge");
  assert.equal(tapisserieBand("fringe"), "tassel");
  assert.equal(tapisserieGap("warp", "fringe"), 3);
  assert.equal(quietFinish("graphite"), true);
  assert.equal(quietFinish("ivory"), false);
  assert.equal(quietFinish("gilt"), false);
  assert.equal(pairHammer(7), true);
  assert.equal(pairHammer(4), false);
  assert.equal(fullHammer(11), true);
  assert.equal(fullHammer(7), false);
  assert.equal(activeMode("inner"), "inner");
  assert.equal(activeHour("5"), "5");
  assert.equal(activeHour("7"), "all");
  assert.equal(activeHammer("11"), "11");
  assert.equal(activeHammer("3"), "all");
  assert.equal(activeFinish("gilt", ["GILT"]), "GILT");
  assert.equal(suggestMode(4), "warp");
  assert.equal(suggestMode(10), "fringe");
  assert.equal(suggestHour([], 3), 5);
  assert.equal(suggestHour([], 8), 10);
  assert.equal(suggestHour([], 14), 20);
  assert.equal(suggestHour([], 20), 40);
  assert.equal(suggestFinish([]), "IVORY");
  assert.equal(moveTapisserieFocus(0, 3, 1), 1);
  assert.equal(moveTapisserieFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", piece: "warp" });
  const due = rule({ id: "b", title: "Bea", piece: "selvage", lock: 4 });
  const quiet = rule({ id: "c", title: "Cara", drop: 5, lock: 4 });
  const cell = rule({ id: "d", title: "Dora", film: "GILT", drop: 40, lock: 11 });
  const fax = rule({ id: "e", title: "Eve", piece: "fringe", film: "IVORY", drop: 10 });
  assert.equal(lateTapisserie(late, "fringe"), true);
  assert.equal(lateTapisserie(late, "warp"), false);
  assert.equal(overdueTapisserie(due), true);
  assert.equal(idleTapisserie(quiet), true);
  assert.equal(briskTapisserie(cell), true);
  assert.equal(restingTapisserie(fax), true);
  assert.deepEqual(reminderTapisserieCards([due, late]), ["Bea"]);
  assert.equal(fairKeeper([rule({ id: "1", title: "One", setter: "Ada" }), rule({ id: "2", title: "Two", setter: "Bea" }), rule({ id: "3", title: "Three", setter: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", drop: 10 }), rule({ id: "2", title: "East", drop: 5 })];
  assert.match(tapisserieTimeline(cards).map((mail) => mail.drop).join(","), /10/);
  const saved = addTapisserie([], { title: "Ada", piece: "weft", drop: "10", film: "gilt", lock: "7", tags: "s t x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].piece, "weft");
  assert.equal(saved[0].drop, 10);
  assert.equal(saved[0].lock, 7);
  assert.deepEqual(saved[0].tags, ["s", "t"]);
  assert.equal(addTapisserie(saved, { title: "Ada" }).length, 1);
  assert.equal(addTapisserie([], { title: "Eve" })[0].lock, 4);
  assert.equal(dropTapisserieView([{ id: "v", name: "Morning", tray: "board", query: "", setter: "", film: "all", piece: "all", drop: "all", lock: "all" }], "v").length, 0);
  assert.equal(readTapisserieViews([{ id: "v", name: "Morning", tray: "peg" }])[0].tray, "peg");

  const now = Date.parse("2026-11-20T12:00:00.000Z");
  assert.equal(afaHome("DIRECT", now), true);
  assert.equal(afaHome("YES", now), true);
  assert.equal(afaDesk("IB", now), true);
  assert.equal(afaHome("2026-11-20T01:00:00.000Z", now), true);
  assert.equal(afaAway("silent book", now), true);
  assert.equal(afaGuest("2026-11-14T12:00:00.000Z", now), true);
  assert.equal(afaCitizen("2025-01-01T00:00:00.000Z", now), true);
  assert.equal(afaDesk("2026-11-19T12:00:00.000Z", now), true);
  assert.equal(afaHome({ affiliateA: true }, now), true);
  assert.equal(afaHome({ affiliateA: "2026-11-20T08:00:00.000Z" }, now), true);
  assert.equal(afaPlain({ affiliateA: false }, now), true);
  assert.equal(afaAway({ affiliateA: false }, now), false);
  assert.equal(afaPlain({ affiliateA: "Granite" }, now), true);
  assert.equal(afaHome({ affiliateA: "Granite" }, now), false);
  assert.equal(afaBrief({ affiliateA: "MARKS" }, now), true);
  assert.equal(afaJoin("LIVE+BOOK", now), true);
  assert.equal(afaJoin("ANNA NOAH", now), false);
  assert.equal(afaRoute("SALE:EAST", now), true);
  assert.equal(afaRoute("SETHOLD", now), false);
  assert.equal(afaBrief("DIRECT", now), false);
  assert.equal(afaBrief("MARKSX", now), false);
  assert.equal(afaLong("GraphiteMark", now), true);
  assert.equal(afaLong("ElevenChars", now), false);
  assert.equal(afaLane("DIRECT", now), "hall");
  assert.equal(afaLane("IB", now), "desk");
  assert.equal(afaLane("PAUSE", now), "hold");
  assert.equal(afaLane("DEAD", now), "guest");
  assert.equal(afaLane("PAIR", now), "join");
  assert.equal(afaLane("2026-11-19T12:00:00.000Z", now), "desk");
  assert.equal(afaLane("2026-11-14T12:00:00.000Z", now), "hold");
  assert.equal(afaLane("2025-01-01T00:00:00.000Z", now), "guest");
  assert.equal(afaLane("Granite", now), "plain");
  assert.equal(afaLane("MARKS", now), "brief");
  assert.equal(afaLane("20261120T073000Z", now), "stamp");
  assert.equal(afaLane("Amsterdam", now), "vowel");
  assert.equal(afaLane("silent book", now), "vacant");
  assert.equal(afaLane("alpha/beta/gamma", now), "route");
  assert.equal(afaLane("direct house", now), "hall");
  assert.equal(afaOpen(""), true);
  assert.equal(afaOpen({ affiliateA: "" }), true);
  assert.equal(afaState({ name: "Ada" }), "");
  assert.equal(afaState({ affiliateA: "Paris", balance: 1 }), "");
  assert.equal(afaHue("DIRECT", now), "champagne");
  assert.equal(afaHue("DIRECT+HOUSE", now), "champagne");
  assert.equal(afaHue("2026-11-14T12:00:00.000Z", now), "ivory");
  assert.equal(afaHue("2026-11-19T12:00:00.000Z", now), "graphite");
  assert.equal(afaSoon("MARKS", now), true);
  assert.equal(afaSoon("DIRECT", now), false);
  assert.equal(afaSoon("ABCDEF", now), true);
  assert.equal(afaSoon("AB", now), false);
  assert.equal(afaHue("Marble", now), "ivory");
  assert.equal(afaLength("yes"), 3);
  assert.equal(afaEven("ab"), true);
  assert.equal(afaFirst("Paris"), true);
  assert.equal(afaSpace("needs review"), true);
  assert.equal(afaVowel("Amsterdam"), true);
  assert.equal(afaDigit("Room4"), true);
  assert.equal(afaLower("paris"), true);
  assert.equal(afaUpper("APPROVED"), true);
  assert.equal(afaUpper("SEALED"), false);
  assert.equal(afaUpper("CLEAR"), false);
  const marks: LisRow[] = [
    { id: "1", label: "Ada", code: "DIRECT" },
    { id: "2", label: "Bea", code: "DIRECT" },
    { id: "3", label: "Cara", code: "Marble" },
  ];
  assert.equal(leadingSel(marks), "hall");
  assert.match(afaLanesCsv(marks), /hall,2/);
  assert.match(afaRowsCsv(marks, ["1"]), /Ada,DIRECT/);
  assert.equal(crmv4Text("tr", "tpsTitle"), ROUND367_COPY.tr.tpsTitle);
  assert.equal(crmv4Text("de", "afaTitle"), ROUND367_COPY.de.afaTitle);
  assert.equal(crmv4Text("ru", "wzCastellumKicker"), ROUND367_COPY.ru.wzCastellumKicker);
  assert.equal(crmv4Text("ar", "dzThesaurusLead"), ROUND367_COPY.ar.dzThesaurusLead);
  const keys = Object.keys(ROUND367_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND367_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-tapisserie/);
  assert.match(css, /\.c4-afaplate/);
  assert.match(css, /\.c4-tapisserie-column/);
  assert.match(css, /\.c4-afaplate-column/);
  assert.match(css, /\.c4-wd-castellum/);
  assert.match(css, /\.c4-dep-thesaurus/);
  assert.match(css, /\.c4-wz-castellum-mast/);
  assert.match(css, /\.c4-dz-thesaurus-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round367.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /affiliateA:/);
  assert.match(viewFile, /tapisserieCsv/);
  assert.match(viewFile, /afaRowsCsv/);
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
  assert.match(viewFile, /c4-afaplate-search/);
  assert.match(viewFile, /tapisserieTimeline/);
  assert.match(viewFile, /c4-tapisserie-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "tps"/);
  assert.match(app, /view === "afa"/);
  const withdrawals = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round95.tsx"), "utf8");
  assert.match(withdrawals, /c4-wd-castellum/);
  assert.match(withdrawals, /c4-wz-castellum-mast/);
  assert.match(withdrawals, /data-logo="mono"/);
  assert.match(withdrawals, /wzCastellumKicker/);
  assert.match(withdrawals, /wzCastellumLead/);
  assert.match(withdrawals, /data-wd-castellum/);
  const basin = withdrawals.slice(withdrawals.indexOf("export function WithdrawalGlance"));
  assert.equal(basin.includes("amount"), false);
  assert.equal(basin.includes("price"), false);
  const deposits = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round96.tsx"), "utf8");
  assert.match(deposits, /c4-dep-thesaurus/);
  assert.match(deposits, /c4-dz-thesaurus-mast/);
  assert.match(deposits, /dzThesaurusKicker/);
  assert.match(deposits, /dzThesaurusLead/);
  assert.match(deposits, /data-dep-thesaurus/);
  const chest = deposits.slice(deposits.indexOf("export function DepStatusGlance"));
  assert.equal(chest.includes("amount"), false);
  assert.equal(chest.includes("profit"), false);
  assert.match(chest, /statusText/);
  const namedKeys = `${viewFile}\n${withdrawals}\n${deposits}`.match(/"(tps|afa|wzCastellum|dzThesaurus)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND367_COPY.en[key as keyof typeof ROUND367_COPY.en], "string", key);
  console.log("crmv4 round367 tests passed");
}

main();
