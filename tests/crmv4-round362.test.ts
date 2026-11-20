/**
 * Parachute rules, campaign plates, the ivory callback lararium, and the graphite priority triclinium.
 * Run: TZ=UTC npx tsx tests/crmv4-round362.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND362_COPY } from "../src/lib/crmv4/copy-round362";
import {
  ROUND362_FEATURES,
  activeFinish,
  activeMode,
  activeHour,
  activeHammer,
  addParachute,
  briskParachute,
  dropParachuteView,
  fairKeeper,
  cgnHome,
  cgnBrief,
  cgnCapital,
  cgnDigit,
  cgnEven,
  cgnFirst,
  cgnRoute,
  cgnHue,
  cgnJoin,
  cgnCitizen,
  cgnLane,
  cgnLanesCsv,
  cgnLength,
  cgnLower,
  cgnGuest,
  cgnAway,
  cgnOpen,
  cgnPlain,
  cgnLong,
  cgnRowsCsv,
  cgnSoon,
  cgnSpace,
  cgnState,
  cgnUpper,
  cgnVowel,
  cgnDesk,
  fullHammer,
  idleParachute,
  lateParachute,
  leadingSel,
  moveParachuteFocus,
  parachuteBand,
  parachuteHour,
  parachuteGap,
  parachuteInner,
  parachuteMode,
  parachuteOuter,
  parachuteHammer,
  parachuteFilm,
  parachuteTimeline,
  overdueParachute,
  pairHammer,
  quietFinish,
  readParachuteViews,
  reminderParachutes,
  restingParachute,
  suggestFinish,
  suggestMode,
  suggestHour,
  type CgnRow,
  type Parachute,
} from "../src/lib/crmv4/round362";

function rule(partial: Partial<Parachute> & { id: string; title: string }): Parachute {
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
  assert.equal(ROUND362_FEATURES.length, 25);
  assert.equal(ROUND362_FEATURES.includes("campaign-plate"), true);
  assert.equal(ROUND362_FEATURES.includes("parachute-pin-sla"), true);
  assert.equal(ROUND362_FEATURES.includes("fair-springer"), true);
  assert.equal(ROUND362_FEATURES.includes("shock-archive"), true);
  assert.equal(ROUND362_FEATURES.includes("shock-reminders"), true);
  assert.equal(ROUND362_FEATURES.includes("parachute-search"), true);
  assert.equal(ROUND362_FEATURES.includes("shock-timeline"), true);
  assert.equal(parachuteMode(" lyre "), "lyre");
  assert.equal(parachuteMode("brass"), "");
  assert.equal(parachuteHour("6"), 6);
  assert.equal(parachuteHour(12), 12);
  assert.equal(parachuteHour(24), 24);
  assert.equal(parachuteHour(48), 48);
  assert.equal(parachuteHour("5"), null);
  assert.equal(parachuteHour("10"), null);
  assert.equal(parachuteHammer("2"), 2);
  assert.equal(parachuteHammer(4), 4);
  assert.equal(parachuteHammer("8"), 8);
  assert.equal(parachuteHammer("1"), null);
  assert.equal(parachuteHammer("3"), null);
  assert.equal(parachuteFilm("gilt"), "GILT");
  assert.equal(parachuteFilm("ivory"), "IVORY");
  assert.equal(parachuteFilm("graphite"), "GRAPHITE");
  assert.equal(parachuteFilm("hot"), "");
  assert.equal(parachuteInner("lyre"), true);
  assert.equal(parachuteInner("STUD"), true);
  assert.equal(parachuteInner("spring"), false);
  assert.equal(parachuteOuter("spring"), true);
  assert.equal(parachuteOuter("jewel"), true);
  assert.equal(parachuteOuter("lyre"), false);
  assert.equal(parachuteBand("lyre"), "bow");
  assert.equal(parachuteBand("stud"), "post");
  assert.equal(parachuteBand("spring"), "coil");
  assert.equal(parachuteBand("jewel"), "seat");
  assert.equal(parachuteGap("lyre", "jewel"), 3);
  assert.equal(quietFinish("ivory"), true);
  assert.equal(quietFinish("gilt"), false);
  assert.equal(pairHammer(4), true);
  assert.equal(pairHammer(2), false);
  assert.equal(fullHammer(8), true);
  assert.equal(fullHammer(4), false);
  assert.equal(activeMode("inner"), "inner");
  assert.equal(activeHour("6"), "6");
  assert.equal(activeHour("7"), "all");
  assert.equal(activeHammer("8"), "8");
  assert.equal(activeHammer("5"), "all");
  assert.equal(activeFinish("gilt", ["GILT"]), "GILT");
  assert.equal(suggestMode(4), "lyre");
  assert.equal(suggestMode(10), "jewel");
  assert.equal(suggestHour([], 3), 6);
  assert.equal(suggestHour([], 8), 12);
  assert.equal(suggestHour([], 14), 24);
  assert.equal(suggestHour([], 20), 48);
  assert.equal(suggestFinish([]), "IVORY");
  assert.equal(moveParachuteFocus(0, 3, 1), 1);
  assert.equal(moveParachuteFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", piece: "lyre" });
  const due = rule({ id: "b", title: "Bea", piece: "spring", lock: 2 });
  const quiet = rule({ id: "c", title: "Cara", drop: 6, lock: 2 });
  const cell = rule({ id: "d", title: "Dora", film: "GILT", drop: 48, lock: 8 });
  const fax = rule({ id: "e", title: "Eve", piece: "jewel", film: "IVORY", drop: 12 });
  assert.equal(lateParachute(late, "jewel"), true);
  assert.equal(lateParachute(late, "lyre"), false);
  assert.equal(overdueParachute(due), true);
  assert.equal(idleParachute(quiet), true);
  assert.equal(briskParachute(cell), true);
  assert.equal(restingParachute(fax), true);
  assert.deepEqual(reminderParachutes([due, late]), ["Bea"]);
  assert.equal(fairKeeper([rule({ id: "1", title: "One", setter: "Ada" }), rule({ id: "2", title: "Two", setter: "Bea" }), rule({ id: "3", title: "Three", setter: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", drop: 12 }), rule({ id: "2", title: "East", drop: 6 })];
  assert.match(parachuteTimeline(cards).map((mail) => mail.drop).join(","), /12/);
  const saved = addParachute([], { title: "Ada", piece: "stud", drop: "12", film: "gilt", lock: "4", tags: "s j x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].piece, "stud");
  assert.equal(saved[0].drop, 12);
  assert.equal(saved[0].lock, 4);
  assert.deepEqual(saved[0].tags, ["s", "j"]);
  assert.equal(addParachute(saved, { title: "Ada" }).length, 1);
  assert.equal(addParachute([], { title: "Eve" })[0].lock, 2);
  assert.equal(dropParachuteView([{ id: "v", name: "Morning", tray: "board", query: "", setter: "", film: "all", piece: "all", drop: "all", lock: "all" }], "v").length, 0);
  assert.equal(readParachuteViews([{ id: "v", name: "Morning", tray: "peg" }])[0].tray, "peg");

  const now = Date.parse("2026-11-20T12:00:00.000Z");
  assert.equal(cgnHome("LIVE", now), true);
  assert.equal(cgnHome("organic", now), true);
  assert.equal(cgnHome("2026-11-20T01:00:00.000Z", now), true);
  assert.equal(cgnAway("paused seat", now), true);
  assert.equal(cgnGuest("2026-11-05T12:00:00.000Z", now), true);
  assert.equal(cgnCitizen("2025-01-01T00:00:00.000Z", now), true);
  assert.equal(cgnDesk("2026-11-16T12:00:00.000Z", now), true);
  assert.equal(cgnHome({ campaign: true }, now), true);
  assert.equal(cgnHome({ campaign: "2026-11-20T08:00:00.000Z" }, now), true);
  assert.equal(cgnPlain({ campaign: false }, now), true);
  assert.equal(cgnAway({ campaign: false }, now), false);
  assert.equal(cgnPlain({ campaign: "Granite" }, now), true);
  assert.equal(cgnHome({ campaign: "Granite" }, now), false);
  assert.equal(cgnBrief({ campaign: "EMAILS" }, now), true);
  assert.equal(cgnJoin("SALES&DESK", now), true);
  assert.equal(cgnJoin("ANNA NOAH", now), false);
  assert.equal(cgnRoute("SALES:DESK", now), true);
  assert.equal(cgnRoute("SETHOLD", now), false);
  assert.equal(cgnBrief("MARKS", now), false);
  assert.equal(cgnBrief("LIVE", now), false);
  assert.equal(cgnLong("CampaignsourcecodeXX", now), true);
  assert.equal(cgnLong("EighteenCharsLongX", now), false);
  assert.equal(cgnLane("LIVE", now), "hall");
  assert.equal(cgnLane("google_search", now), "desk");
  assert.equal(cgnLane("newsletter", now), "hold");
  assert.equal(cgnLane("facebook", now), "guest");
  assert.equal(cgnLane("partner", now), "join");
  assert.equal(cgnLane("2026-11-16T12:00:00.000Z", now), "desk");
  assert.equal(cgnLane("2026-11-05T12:00:00.000Z", now), "hold");
  assert.equal(cgnLane("2025-01-01T00:00:00.000Z", now), "guest");
  assert.equal(cgnLane("Granite", now), "plain");
  assert.equal(cgnLane("Marble", now), "brief");
  assert.equal(cgnLane("20261120T073000Z", now), "stamp");
  assert.equal(cgnLane("Amsterdam", now), "vowel");
  assert.equal(cgnLane("paused seat", now), "vacant");
  assert.equal(cgnLane("alpha/beta/gamma/delta", now), "route");
  assert.equal(cgnLane("house desk", now), "hall");
  assert.equal(cgnOpen(""), true);
  assert.equal(cgnOpen({ campaign: "" }), true);
  assert.equal(cgnState({ name: "Ada" }), "");
  assert.equal(cgnState({ campaign: "Paris", balance: 1 }), "");
  assert.equal(cgnHue("LIVE", now), "champagne");
  assert.equal(cgnHue("SALES&DESK", now), "graphite");
  assert.equal(cgnHue("2026-11-05T12:00:00.000Z", now), "champagne");
  assert.equal(cgnHue("2026-11-16T12:00:00.000Z", now), "graphite");
  assert.equal(cgnSoon("EMAILS", now), true);
  assert.equal(cgnSoon("LIVE", now), false);
  assert.equal(cgnSoon("EIGHTCHR", now), true);
  assert.equal(cgnHue("Marble", now), "ivory");
  assert.equal(cgnLength("yes"), 3);
  assert.equal(cgnEven("ab"), true);
  assert.equal(cgnFirst("Paris"), true);
  assert.equal(cgnSpace("needs review"), true);
  assert.equal(cgnVowel("Amsterdam"), true);
  assert.equal(cgnDigit("Room4"), true);
  assert.equal(cgnCapital("PARIS"), true);
  assert.equal(cgnLower("paris"), true);
  assert.equal(cgnUpper("SEALEDXX"), true);
  assert.equal(cgnUpper("HOT"), false);
  assert.equal(cgnUpper("WARM"), false);
  const marks: CgnRow[] = [
    { id: "1", label: "Ada", code: "LIVE" },
    { id: "2", label: "Bea", code: "LIVE" },
    { id: "3", label: "Cara", code: "Marble" },
  ];
  assert.equal(leadingSel(marks), "hall");
  assert.match(cgnLanesCsv(marks), /hall,2/);
  assert.match(cgnRowsCsv(marks, ["1"]), /Ada,LIVE/);
  assert.equal(crmv4Text("tr", "pchTitle"), ROUND362_COPY.tr.pchTitle);
  assert.equal(crmv4Text("de", "cgnTitle"), ROUND362_COPY.de.cgnTitle);
  assert.equal(crmv4Text("ru", "cbLarariumKicker"), ROUND362_COPY.ru.cbLarariumKicker);
  assert.equal(crmv4Text("ar", "zpTricliniumLead"), ROUND362_COPY.ar.zpTricliniumLead);
  const keys = Object.keys(ROUND362_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND362_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-parachute/);
  assert.match(css, /\.c4-cgnplate/);
  assert.match(css, /\.c4-parachute-column/);
  assert.match(css, /\.c4-cgnplate-column/);
  assert.match(css, /\.c4-callback-lararium/);
  assert.match(css, /\.c4-case-triclinium/);
  assert.match(css, /\.c4-cb-lararium-mast/);
  assert.match(css, /\.c4-zp-triclinium-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round362.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /campaign:/);
  assert.match(viewFile, /parachuteCsv/);
  assert.match(viewFile, /cgnRowsCsv/);
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
  assert.match(viewFile, /c4-cgnplate-search/);
  assert.match(viewFile, /parachuteTimeline/);
  assert.match(viewFile, /c4-parachute-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "pch"/);
  assert.match(app, /view === "cgn"/);
  const tags = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round116.tsx"), "utf8");
  assert.match(tags, /c4-callback-lararium/);
  assert.match(tags, /c4-cb-lararium-mast/);
  assert.match(tags, /data-logo="mono"/);
  assert.match(tags, /cbLarariumKicker/);
  assert.match(tags, /cbLarariumLead/);
  assert.match(tags, /data-callback-lararium/);
  const gallery = tags.slice(tags.indexOf("export function CallbackQueue"), tags.indexOf("export function CasePriorities"));
  assert.equal(gallery.includes("amount"), false);
  assert.equal(gallery.includes("price"), false);
  assert.match(tags, /c4-case-triclinium/);
  assert.match(tags, /c4-zp-triclinium-mast/);
  assert.match(tags, /zpTricliniumKicker/);
  assert.match(tags, /zpTricliniumLead/);
  assert.match(tags, /data-case-triclinium/);
  const porch = tags.slice(tags.indexOf("export function CasePriorities"));
  assert.equal(porch.includes("amount"), false);
  assert.equal(porch.includes("profit"), false);
  assert.match(porch, /priorityText/);
  const namedKeys = `${viewFile}\n${tags}`.match(/"(pch|cgn|cbLararium|zpTriclinium)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND362_COPY.en[key as keyof typeof ROUND362_COPY.en], "string", key);
  console.log("crmv4 round362 tests passed");
}

main();
