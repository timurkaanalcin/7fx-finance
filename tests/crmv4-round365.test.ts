/**
 * Maltese cross rules, server plates, the ivory locker pylon, and the graphite symbol clerestory.
 * Run: TZ=UTC npx tsx tests/crmv4-round365.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND365_COPY } from "../src/lib/crmv4/copy-round365";
import {
  ROUND365_FEATURES,
  activeFinish,
  activeMode,
  activeHour,
  activeHammer,
  addMaltese,
  briskMaltese,
  dropMalteseView,
  fairKeeper,
  srvHome,
  srvBrief,
  srvDigit,
  srvEven,
  srvFirst,
  srvRoute,
  srvHue,
  srvJoin,
  srvCitizen,
  srvLane,
  srvLanesCsv,
  srvLength,
  srvLower,
  srvGuest,
  srvAway,
  srvOpen,
  srvPlain,
  srvLong,
  srvRowsCsv,
  srvSoon,
  srvSpace,
  srvState,
  srvUpper,
  srvVowel,
  srvDesk,
  fullHammer,
  idleMaltese,
  lateMaltese,
  leadingSel,
  moveMalteseFocus,
  malteseBand,
  malteseHour,
  malteseGap,
  malteseInner,
  malteseMode,
  malteseOuter,
  malteseHammer,
  malteseFilm,
  malteseTimeline,
  overdueMaltese,
  pairHammer,
  quietFinish,
  readMalteseViews,
  reminderMalteseCards,
  restingMaltese,
  suggestFinish,
  suggestMode,
  suggestHour,
  type SrvRow,
  type Maltese,
} from "../src/lib/crmv4/round365";

function rule(partial: Partial<Maltese> & { id: string; title: string }): Maltese {
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
  assert.equal(ROUND365_FEATURES.length, 25);
  assert.equal(ROUND365_FEATURES.includes("server-plate"), true);
  assert.equal(ROUND365_FEATURES.includes("maltese-stop-sla"), true);
  assert.equal(ROUND365_FEATURES.includes("fair-stopwork"), true);
  assert.equal(ROUND365_FEATURES.includes("cross-archive"), true);
  assert.equal(ROUND365_FEATURES.includes("cross-reminders"), true);
  assert.equal(ROUND365_FEATURES.includes("maltese-search"), true);
  assert.equal(ROUND365_FEATURES.includes("cross-timeline"), true);
  assert.equal(malteseMode(" cross "), "cross");
  assert.equal(malteseMode("brass"), "");
  assert.equal(malteseHour("4"), 4);
  assert.equal(malteseHour(8), 8);
  assert.equal(malteseHour(16), 16);
  assert.equal(malteseHour(32), 32);
  assert.equal(malteseHour("6"), null);
  assert.equal(malteseHour("12"), null);
  assert.equal(malteseHammer("2"), 2);
  assert.equal(malteseHammer(5), 5);
  assert.equal(malteseHammer("7"), 7);
  assert.equal(malteseHammer("3"), null);
  assert.equal(malteseHammer("4"), null);
  assert.equal(malteseFilm("gilt"), "GILT");
  assert.equal(malteseFilm("ivory"), "IVORY");
  assert.equal(malteseFilm("graphite"), "GRAPHITE");
  assert.equal(malteseFilm("hot"), "");
  assert.equal(malteseInner("cross"), true);
  assert.equal(malteseInner("FINGER"), true);
  assert.equal(malteseInner("beak"), false);
  assert.equal(malteseOuter("beak"), true);
  assert.equal(malteseOuter("arbor"), true);
  assert.equal(malteseOuter("cross"), false);
  assert.equal(malteseBand("cross"), "arm");
  assert.equal(malteseBand("finger"), "peg");
  assert.equal(malteseBand("beak"), "nose");
  assert.equal(malteseBand("arbor"), "shaft");
  assert.equal(malteseGap("cross", "arbor"), 3);
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
  assert.equal(suggestMode(4), "cross");
  assert.equal(suggestMode(10), "arbor");
  assert.equal(suggestHour([], 3), 4);
  assert.equal(suggestHour([], 8), 8);
  assert.equal(suggestHour([], 14), 16);
  assert.equal(suggestHour([], 20), 32);
  assert.equal(suggestFinish([]), "GRAPHITE");
  assert.equal(moveMalteseFocus(0, 3, 1), 1);
  assert.equal(moveMalteseFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", piece: "cross" });
  const due = rule({ id: "b", title: "Bea", piece: "beak", lock: 2 });
  const quiet = rule({ id: "c", title: "Cara", drop: 4, lock: 2 });
  const cell = rule({ id: "d", title: "Dora", film: "GILT", drop: 32, lock: 7 });
  const fax = rule({ id: "e", title: "Eve", piece: "arbor", film: "GRAPHITE", drop: 8 });
  assert.equal(lateMaltese(late, "arbor"), true);
  assert.equal(lateMaltese(late, "cross"), false);
  assert.equal(overdueMaltese(due), true);
  assert.equal(idleMaltese(quiet), true);
  assert.equal(briskMaltese(cell), true);
  assert.equal(restingMaltese(fax), true);
  assert.deepEqual(reminderMalteseCards([due, late]), ["Bea"]);
  assert.equal(fairKeeper([rule({ id: "1", title: "One", setter: "Ada" }), rule({ id: "2", title: "Two", setter: "Bea" }), rule({ id: "3", title: "Three", setter: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", drop: 8 }), rule({ id: "2", title: "East", drop: 4 })];
  assert.match(malteseTimeline(cards).map((mail) => mail.drop).join(","), /8/);
  const saved = addMaltese([], { title: "Ada", piece: "finger", drop: "8", film: "gilt", lock: "5", tags: "k n x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].piece, "finger");
  assert.equal(saved[0].drop, 8);
  assert.equal(saved[0].lock, 5);
  assert.deepEqual(saved[0].tags, ["k", "n"]);
  assert.equal(addMaltese(saved, { title: "Ada" }).length, 1);
  assert.equal(addMaltese([], { title: "Eve" })[0].lock, 2);
  assert.equal(dropMalteseView([{ id: "v", name: "Morning", tray: "board", query: "", setter: "", film: "all", piece: "all", drop: "all", lock: "all" }], "v").length, 0);
  assert.equal(readMalteseViews([{ id: "v", name: "Morning", tray: "peg" }])[0].tray, "peg");

  const now = Date.parse("2026-11-20T12:00:00.000Z");
  assert.equal(srvHome("LIVE", now), true);
  assert.equal(srvHome("YES", now), true);
  assert.equal(srvDesk("STAGING", now), true);
  assert.equal(srvHome("2026-11-20T01:00:00.000Z", now), true);
  assert.equal(srvAway("sunset book", now), true);
  assert.equal(srvGuest("2026-11-14T12:00:00.000Z", now), true);
  assert.equal(srvCitizen("2025-01-01T00:00:00.000Z", now), true);
  assert.equal(srvDesk("2026-11-19T12:00:00.000Z", now), true);
  assert.equal(srvHome({ tradingServer: true }, now), true);
  assert.equal(srvHome({ tradingServer: "2026-11-20T08:00:00.000Z" }, now), true);
  assert.equal(srvPlain({ tradingServer: false }, now), true);
  assert.equal(srvAway({ tradingServer: false }, now), false);
  assert.equal(srvPlain({ tradingServer: "Granite" }, now), true);
  assert.equal(srvHome({ tradingServer: "Granite" }, now), false);
  assert.equal(srvBrief({ tradingServer: "MARKS" }, now), true);
  assert.equal(srvJoin("LIVE+BOOK", now), true);
  assert.equal(srvJoin("ANNA NOAH", now), false);
  assert.equal(srvRoute("SALE:EAST", now), true);
  assert.equal(srvRoute("SETHOLD", now), false);
  assert.equal(srvBrief("MARK", now), false);
  assert.equal(srvBrief("LIVE", now), false);
  assert.equal(srvLong("TwelveCharsX", now), true);
  assert.equal(srvLong("ElevenCharX", now), false);
  assert.equal(srvLane("LIVE", now), "hall");
  assert.equal(srvLane("STAGING", now), "desk");
  assert.equal(srvLane("HOLD", now), "hold");
  assert.equal(srvLane("RETIRED", now), "guest");
  assert.equal(srvLane("PAIR", now), "join");
  assert.equal(srvLane("2026-11-19T12:00:00.000Z", now), "desk");
  assert.equal(srvLane("2026-11-14T12:00:00.000Z", now), "hold");
  assert.equal(srvLane("2025-01-01T00:00:00.000Z", now), "guest");
  assert.equal(srvLane("Granite", now), "plain");
  assert.equal(srvLane("MARKS", now), "brief");
  assert.equal(srvLane("20261120T073000Z", now), "stamp");
  assert.equal(srvLane("Amsterdam", now), "vowel");
  assert.equal(srvLane("sunset book", now), "vacant");
  assert.equal(srvLane("alpha/beta/gamma", now), "route");
  assert.equal(srvLane("live book", now), "hall");
  assert.equal(srvOpen(""), true);
  assert.equal(srvOpen({ tradingServer: "" }), true);
  assert.equal(srvState({ name: "Ada" }), "");
  assert.equal(srvState({ tradingServer: "Paris", balance: 1 }), "");
  assert.equal(srvHue("LIVE", now), "champagne");
  assert.equal(srvHue("LIVE+BOOK", now), "graphite");
  assert.equal(srvHue("2026-11-14T12:00:00.000Z", now), "champagne");
  assert.equal(srvHue("2026-11-19T12:00:00.000Z", now), "graphite");
  assert.equal(srvSoon("MARKS", now), true);
  assert.equal(srvSoon("LIVE", now), false);
  assert.equal(srvSoon("AB", now), true);
  assert.equal(srvHue("Marble", now), "ivory");
  assert.equal(srvLength("yes"), 3);
  assert.equal(srvEven("ab"), true);
  assert.equal(srvFirst("Paris"), true);
  assert.equal(srvSpace("needs review"), true);
  assert.equal(srvVowel("Amsterdam"), true);
  assert.equal(srvDigit("Room4"), true);
  assert.equal(srvLower("paris"), true);
  assert.equal(srvUpper("APPROVED"), true);
  assert.equal(srvUpper("SEALED"), false);
  assert.equal(srvUpper("CLEAR"), false);
  const marks: SrvRow[] = [
    { id: "1", label: "Ada", code: "LIVE" },
    { id: "2", label: "Bea", code: "LIVE" },
    { id: "3", label: "Cara", code: "Marble" },
  ];
  assert.equal(leadingSel(marks), "hall");
  assert.match(srvLanesCsv(marks), /hall,2/);
  assert.match(srvRowsCsv(marks, ["1"]), /Ada,LIVE/);
  assert.equal(crmv4Text("tr", "mlxTitle"), ROUND365_COPY.tr.mlxTitle);
  assert.equal(crmv4Text("de", "srvTitle"), ROUND365_COPY.de.srvTitle);
  assert.equal(crmv4Text("ru", "lokPylonKicker"), ROUND365_COPY.ru.lokPylonKicker);
  assert.equal(crmv4Text("ar", "tsyClerestoryLead"), ROUND365_COPY.ar.tsyClerestoryLead);
  const keys = Object.keys(ROUND365_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND365_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-maltese/);
  assert.match(css, /\.c4-srvplate/);
  assert.match(css, /\.c4-maltese-column/);
  assert.match(css, /\.c4-srvplate-column/);
  assert.match(css, /\.c4-locker-pylon/);
  assert.match(css, /\.c4-symbol-clerestory/);
  assert.match(css, /\.c4-lok-pylon-mast/);
  assert.match(css, /\.c4-tsy-clerestory-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round365.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /tradingServer:/);
  assert.match(viewFile, /malteseCsv/);
  assert.match(viewFile, /srvRowsCsv/);
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
  assert.match(viewFile, /c4-srvplate-search/);
  assert.match(viewFile, /malteseTimeline/);
  assert.match(viewFile, /c4-maltese-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "mlx"/);
  assert.match(app, /view === "srv"/);
  const desks = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round119.tsx"), "utf8");
  assert.match(desks, /c4-locker-pylon/);
  assert.match(desks, /c4-lok-pylon-mast/);
  assert.match(desks, /data-logo="mono"/);
  assert.match(desks, /lokPylonKicker/);
  assert.match(desks, /lokPylonLead/);
  assert.match(desks, /data-locker-pylon/);
  const visit = desks.slice(desks.indexOf("export function LockerNotes"), desks.indexOf("export function TradeSymbols"));
  assert.equal(visit.includes("amount"), false);
  assert.equal(visit.includes("price"), false);
  assert.match(desks, /c4-symbol-clerestory/);
  assert.match(desks, /c4-tsy-clerestory-mast/);
  assert.match(desks, /tsyClerestoryKicker/);
  assert.match(desks, /tsyClerestoryLead/);
  assert.match(desks, /data-symbol-clerestory/);
  const porch = desks.slice(desks.indexOf("export function TradeSymbols"));
  assert.equal(porch.includes("amount"), false);
  assert.equal(porch.includes("profit"), false);
  assert.match(porch, /symbolText/);
  const namedKeys = `${viewFile}\n${desks}`.match(/"(mlx|srv|lokPylon|tsyClerestory)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND365_COPY.en[key as keyof typeof ROUND365_COPY.en], "string", key);
  console.log("crmv4 round365 tests passed");
}

main();
