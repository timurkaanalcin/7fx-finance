/**
 * Granulation nests, keeper grant plates, the ivory activity diaconicon, and the graphite message solea.
 * Run: TZ=UTC npx tsx tests/crmv4-round372.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND372_COPY } from "../src/lib/crmv4/copy-round372";
import { ROUND371_FEATURES } from "../src/lib/crmv4/round371";
import {
  ROUND372_FEATURES,
  activeFinish,
  activeMode,
  activeHour,
  activeHammer,
  addGranule,
  briskGranule,
  dropGranuleView,
  fairKeeper,
  kprHome,
  kprDesk,
  kprBrief,
  kprDigit,
  kprEven,
  kprFirst,
  kprRoute,
  kprHue,
  kprJoin,
  kprCitizen,
  kprLane,
  kprLanesCsv,
  kprLength,
  kprLower,
  kprGuest,
  kprAway,
  kprOpen,
  kprPlain,
  kprLong,
  kprRowsCsv,
  kprSoon,
  kprSpace,
  kprState,
  kprUpper,
  kprVowel,
  fullHammer,
  idleGranule,
  lateGranule,
  leadingSel,
  moveGranuleFocus,
  granuleBand,
  granuleHour,
  granuleGap,
  granuleInner,
  granuleMode,
  granuleOuter,
  granuleHammer,
  granuleFilm,
  granuleTimeline,
  overdueGranule,
  pairHammer,
  quietFinish,
  readGranuleViews,
  reminderGranuleCards,
  restingGranule,
  suggestFinish,
  suggestMode,
  suggestHour,
  type KprRow,
  type Granule,
} from "../src/lib/crmv4/round372";

function rule(partial: Partial<Granule> & { id: string; title: string }): Granule {
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
  assert.equal(ROUND372_FEATURES.length, 25);
  assert.equal(ROUND372_FEATURES.includes("keeper-grant-plate"), true);
  assert.equal(ROUND372_FEATURES.includes("nest-heat-sla"), true);
  assert.equal(ROUND372_FEATURES.includes("fair-granulator"), true);
  assert.equal(ROUND372_FEATURES.includes("nest-archive"), true);
  assert.equal(ROUND372_FEATURES.includes("nest-reminders"), true);
  assert.equal(ROUND372_FEATURES.includes("granulation-search"), true);
  assert.equal(ROUND372_FEATURES.includes("nest-timeline"), true);
  for (const feature of ROUND372_FEATURES) assert.equal((ROUND371_FEATURES as readonly string[]).includes(feature), false, feature);
  assert.equal(granuleMode(" seed "), "seed");
  assert.equal(granuleMode("brass"), "");
  assert.equal(granuleHour("3"), 3);
  assert.equal(granuleHour(6), 6);
  assert.equal(granuleHour(12), 12);
  assert.equal(granuleHour(24), 24);
  assert.equal(granuleHour("4"), null);
  assert.equal(granuleHour("8"), null);
  assert.equal(granuleHammer("3"), 3);
  assert.equal(granuleHammer(6), 6);
  assert.equal(granuleHammer("9"), 9);
  assert.equal(granuleHammer("2"), null);
  assert.equal(granuleHammer("4"), null);
  assert.equal(granuleFilm("bloom"), "BLOOM");
  assert.equal(granuleFilm("pearl"), "PEARL");
  assert.equal(granuleFilm("soot"), "SOOT");
  assert.equal(granuleFilm("glaze"), "");
  assert.equal(granuleInner("seed"), true);
  assert.equal(granuleInner("RING"), true);
  assert.equal(granuleInner("field"), false);
  assert.equal(granuleOuter("field"), true);
  assert.equal(granuleOuter("rim"), true);
  assert.equal(granuleOuter("seed"), false);
  assert.equal(granuleBand("seed"), "kernel");
  assert.equal(granuleBand("ring"), "hoop");
  assert.equal(granuleBand("field"), "meadow");
  assert.equal(granuleBand("rim"), "brim");
  assert.equal(granuleGap("seed", "rim"), 3);
  assert.equal(quietFinish("soot"), true);
  assert.equal(quietFinish("pearl"), false);
  assert.equal(quietFinish("bloom"), false);
  assert.equal(pairHammer(6), true);
  assert.equal(pairHammer(3), false);
  assert.equal(fullHammer(9), true);
  assert.equal(fullHammer(6), false);
  assert.equal(activeMode("inner"), "inner");
  assert.equal(activeHour("3"), "3");
  assert.equal(activeHour("4"), "all");
  assert.equal(activeHammer("9"), "9");
  assert.equal(activeHammer("2"), "all");
  assert.equal(activeFinish("bloom", ["BLOOM"]), "BLOOM");
  assert.equal(suggestMode(4), "seed");
  assert.equal(suggestMode(12), "field");
  assert.equal(suggestHour([], 1), 3);
  assert.equal(suggestHour([], 3), 6);
  assert.equal(suggestHour([], 7), 12);
  assert.equal(suggestHour([], 15), 24);
  assert.equal(suggestFinish([]), "PEARL");
  assert.equal(moveGranuleFocus(0, 3, 1), 1);
  assert.equal(moveGranuleFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", piece: "seed" });
  const due = rule({ id: "b", title: "Bea", piece: "field", lock: 3 });
  const quiet = rule({ id: "c", title: "Cara", drop: 3, lock: 3 });
  const cell = rule({ id: "d", title: "Dora", film: "BLOOM", drop: 24, lock: 9 });
  const fax = rule({ id: "e", title: "Eve", piece: "rim", film: "PEARL", drop: 6 });
  assert.equal(lateGranule(late, "rim"), true);
  assert.equal(lateGranule(late, "seed"), false);
  assert.equal(overdueGranule(due), true);
  assert.equal(idleGranule(quiet), true);
  assert.equal(briskGranule(cell), true);
  assert.equal(restingGranule(fax), true);
  assert.deepEqual(reminderGranuleCards([due, late]), ["Bea"]);
  assert.equal(fairKeeper([rule({ id: "1", title: "One", setter: "Ada" }), rule({ id: "2", title: "Two", setter: "Bea" }), rule({ id: "3", title: "Three", setter: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", drop: 6 }), rule({ id: "2", title: "East", drop: 3 })];
  assert.match(granuleTimeline(cards).map((mail) => mail.drop).join(","), /6/);
  const saved = addGranule([], { title: "Ada", piece: "ring", drop: "6", film: "bloom", lock: "6", tags: "g n x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].piece, "ring");
  assert.equal(saved[0].drop, 6);
  assert.equal(saved[0].lock, 6);
  assert.deepEqual(saved[0].tags, ["g", "n"]);
  assert.equal(addGranule(saved, { title: "Ada" }).length, 1);
  assert.equal(addGranule([], { title: "Eve" })[0].lock, 3);
  assert.equal(dropGranuleView([{ id: "v", name: "Morning", tray: "board", query: "", setter: "", film: "all", piece: "all", drop: "all", lock: "all" }], "v").length, 0);
  assert.equal(readGranuleViews([{ id: "v", name: "Morning", tray: "peg" }])[0].tray, "peg");

  const now = Date.parse("2026-11-20T12:00:00.000Z");
  assert.equal(kprHome("VALID", now), true);
  assert.equal(kprHome("YES", now), true);
  assert.equal(kprDesk("CHECK", now), true);
  assert.equal(kprHome("2026-11-20T01:00:00.000Z", now), true);
  assert.equal(kprAway("quiet book", now), true);
  assert.equal(kprGuest("NEW", now), true);
  assert.equal(kprCitizen("FAIL", now), true);
  assert.equal(kprDesk("2026-11-19T18:00:00.000Z", now), true);
  assert.equal(kprHome({ canManageUsers: true }, now), true);
  assert.equal(kprHome({ canManageUsers: "2026-11-20T08:00:00.000Z" }, now), true);
  assert.equal(kprPlain({ canManageUsers: false }, now), true);
  assert.equal(kprAway({ canManageUsers: false }, now), false);
  assert.equal(kprPlain({ canManageUsers: "Granite" }, now), true);
  assert.equal(kprHome({ canManageUsers: "Granite" }, now), false);
  assert.equal(kprBrief({ canManageUsers: "NOTE" }, now), true);
  assert.equal(kprJoin("LIVE&BOOK", now), true);
  assert.equal(kprJoin("ANNA NOAH", now), false);
  assert.equal(kprRoute("SALE/EAST", now), true);
  assert.equal(kprRoute("SETHOLD", now), false);
  assert.equal(kprBrief("ADDRESS", now), false);
  assert.equal(kprBrief("NOTE", now), true);
  assert.equal(kprLong("GraphiteXYZ", now), true);
  assert.equal(kprLong("GraphiteX", now), false);
  assert.equal(kprLong("GraphiteXY", now), true);
  assert.equal(kprLane("VALID", now), "hall");
  assert.equal(kprLane("CHECK", now), "desk");
  assert.equal(kprLane("NEW", now), "hold");
  assert.equal(kprLane("FAIL", now), "guest");
  assert.equal(kprLane("PAIR", now), "join");
  assert.equal(kprLane("2026-11-19T12:00:00.000Z", now), "desk");
  assert.equal(kprLane("2026-11-15T12:00:00.000Z", now), "hold");
  assert.equal(kprLane("2026-11-12T12:00:00.000Z", now), "hold");
  assert.equal(kprLane("2026-11-10T12:00:00.000Z", now), "guest");
  assert.equal(kprLane("Granite", now), "plain");
  assert.equal(kprLane("NOTE", now), "brief");
  assert.equal(kprLane("4ROOM", now), "stamp");
  assert.equal(kprLane("Amsterdam", now), "vowel");
  assert.equal(kprLane("quiet book", now), "vacant");
  assert.equal(kprLane("alpha/beta/gamma", now), "route");
  assert.equal(kprLane("clear file", now), "hall");
  assert.equal(kprOpen(""), true);
  assert.equal(kprOpen({ canManageUsers: "" }), true);
  assert.equal(kprState({ name: "Ada" }), "");
  assert.equal(kprState({ canManageUsers: "HOT", balance: 1 }), "");
  assert.equal(kprHue("VALID", now), "champagne");
  assert.equal(kprHue("PAIR&FILE", now), "champagne");
  assert.equal(kprHue("NEW", now), "ivory");
  assert.equal(kprHue("CHECK", now), "graphite");
  assert.equal(kprSoon("NOTE", now), true);
  assert.equal(kprSoon("VALID", now), false);
  assert.equal(kprSoon("ABCDEF", now), true);
  assert.equal(kprSoon("AB", now), false);
  assert.equal(kprHue("Granite", now), "ivory");
  assert.equal(kprLength("yes"), 3);
  assert.equal(kprEven("ab"), true);
  assert.equal(kprFirst("Paris"), true);
  assert.equal(kprSpace("needs review"), true);
  assert.equal(kprVowel("Amsterdam"), true);
  assert.equal(kprDigit("Room4"), true);
  assert.equal(kprLower("paris"), true);
  assert.equal(kprUpper("ADDRESS"), true);
  assert.equal(kprUpper("ID"), false);
  assert.equal(kprUpper("CLEAR"), false);
  const marks: KprRow[] = [
    { id: "1", label: "Ada", code: "VALID" },
    { id: "2", label: "Bea", code: "VALID" },
    { id: "3", label: "Cara", code: "Granite" },
  ];
  assert.equal(leadingSel(marks), "hall");
  assert.match(kprLanesCsv(marks), /hall,2/);
  assert.match(kprRowsCsv(marks, ["1"]), /Ada,VALID/);
  assert.equal(crmv4Text("tr", "grnTitle"), ROUND372_COPY.tr.grnTitle);
  assert.equal(crmv4Text("de", "kprTitle"), ROUND372_COPY.de.kprTitle);
  assert.equal(crmv4Text("ru", "fdDiaconiconKicker"), ROUND372_COPY.ru.fdDiaconiconKicker);
  assert.equal(crmv4Text("ar", "thSoleaLead"), ROUND372_COPY.ar.thSoleaLead);
  const keys = Object.keys(ROUND372_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND372_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-granule/);
  assert.match(css, /\.c4-kprplate/);
  assert.match(css, /\.c4-granule-column/);
  assert.match(css, /\.c4-kprplate-column/);
  assert.match(css, /\.c4-fd-diaconicon/);
  assert.match(css, /\.c4-th-solea/);
  assert.match(css, /\.c4-fd-diaconicon-mast/);
  assert.match(css, /\.c4-th-solea-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round372.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /canManageUsers:/);
  assert.match(viewFile, /granuleCsv/);
  assert.match(viewFile, /kprRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestFinish/);
  assert.match(viewFile, /c4-kprplate-search/);
  assert.match(viewFile, /granuleTimeline/);
  assert.match(viewFile, /c4-granule-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "grn"/);
  assert.match(app, /view === "kpr"/);
  const feed = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round17.tsx"), "utf8");
  const thread = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round42.tsx"), "utf8");
  assert.match(feed, /c4-fd-diaconicon/);
  assert.match(feed, /c4-fd-diaconicon-mast/);
  assert.match(feed, /data-logo="mono"/);
  assert.match(feed, /fdDiaconiconKicker/);
  assert.match(feed, /fdDiaconiconLead/);
  assert.match(feed, /data-fd-diaconicon/);
  assert.match(feed, /aria-required=\{false\}/);
  assert.match(thread, /c4-th-solea/);
  assert.match(thread, /c4-th-solea-mast/);
  assert.match(thread, /data-logo="mono"/);
  assert.match(thread, /thSoleaKicker/);
  assert.match(thread, /thSoleaLead/);
  assert.match(thread, /data-th-solea/);
  assert.match(thread, /aria-required=\{false\}/);
  const namedKeys = `${viewFile}\n${feed}\n${thread}`.match(/"(grn|kpr|fdDiaconicon|thSolea)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND372_COPY.en[key as keyof typeof ROUND372_COPY.en], "string", key);
  console.log("crmv4 round372 tests passed");
}

main();
