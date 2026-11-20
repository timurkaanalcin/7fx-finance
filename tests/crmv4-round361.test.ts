/**
 * Cadrature rules, job title plates, the ivory dial pastas, and the graphite ticket thalamos.
 * Run: TZ=UTC npx tsx tests/crmv4-round361.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND361_COPY } from "../src/lib/crmv4/copy-round361";
import {
  ROUND361_FEATURES,
  activeFinish,
  activeMode,
  activeHour,
  activeHammer,
  addCadrature,
  briskCadrature,
  dropCadratureView,
  fairKeeper,
  jbtHome,
  jbtBrief,
  jbtCapital,
  jbtDigit,
  jbtEven,
  jbtFirst,
  jbtRoute,
  jbtHue,
  jbtJoin,
  jbtCitizen,
  jbtLane,
  jbtLanesCsv,
  jbtLength,
  jbtLower,
  jbtGuest,
  jbtAway,
  jbtOpen,
  jbtPlain,
  jbtLong,
  jbtRowsCsv,
  jbtSoon,
  jbtSpace,
  jbtState,
  jbtUpper,
  jbtVowel,
  jbtDesk,
  fullHammer,
  idleCadrature,
  lateCadrature,
  leadingSel,
  moveCadratureFocus,
  cadratureBand,
  cadratureHour,
  cadratureGap,
  cadratureInner,
  cadratureMode,
  cadratureOuter,
  cadratureHammer,
  cadratureFilm,
  cadratureTimeline,
  overdueCadrature,
  pairHammer,
  quietFinish,
  readCadratureViews,
  reminderCadratures,
  restingCadrature,
  suggestFinish,
  suggestMode,
  suggestHour,
  type JbtRow,
  type Cadrature,
} from "../src/lib/crmv4/round361";

function rule(partial: Partial<Cadrature> & { id: string; title: string }): Cadrature {
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
  assert.equal(ROUND361_FEATURES.length, 25);
  assert.equal(ROUND361_FEATURES.includes("job-title-plate"), true);
  assert.equal(ROUND361_FEATURES.includes("cadrature-pin-sla"), true);
  assert.equal(ROUND361_FEATURES.includes("fair-watchmaker"), true);
  assert.equal(ROUND361_FEATURES.includes("motion-archive"), true);
  assert.equal(ROUND361_FEATURES.includes("motion-reminders"), true);
  assert.equal(ROUND361_FEATURES.includes("cadrature-search"), true);
  assert.equal(ROUND361_FEATURES.includes("motion-timeline"), true);
  assert.equal(cadratureMode(" cannon "), "cannon");
  assert.equal(cadratureMode("brass"), "");
  assert.equal(cadratureHour("5"), 5);
  assert.equal(cadratureHour(10), 10);
  assert.equal(cadratureHour(15), 15);
  assert.equal(cadratureHour(30), 30);
  assert.equal(cadratureHour("6"), null);
  assert.equal(cadratureHour("12"), null);
  assert.equal(cadratureHammer("1"), 1);
  assert.equal(cadratureHammer(3), 3);
  assert.equal(cadratureHammer("6"), 6);
  assert.equal(cadratureHammer("2"), null);
  assert.equal(cadratureHammer("4"), null);
  assert.equal(cadratureFilm("gilt"), "GILT");
  assert.equal(cadratureFilm("ivory"), "IVORY");
  assert.equal(cadratureFilm("graphite"), "GRAPHITE");
  assert.equal(cadratureFilm("hot"), "");
  assert.equal(cadratureInner("cannon"), true);
  assert.equal(cadratureInner("MINUTE"), true);
  assert.equal(cadratureInner("hour"), false);
  assert.equal(cadratureOuter("hour"), true);
  assert.equal(cadratureOuter("date"), true);
  assert.equal(cadratureOuter("cannon"), false);
  assert.equal(cadratureBand("cannon"), "barrel");
  assert.equal(cadratureBand("minute"), "pinion");
  assert.equal(cadratureBand("hour"), "hand");
  assert.equal(cadratureBand("date"), "window");
  assert.equal(cadratureGap("cannon", "date"), 3);
  assert.equal(quietFinish("ivory"), true);
  assert.equal(quietFinish("gilt"), false);
  assert.equal(pairHammer(3), true);
  assert.equal(pairHammer(1), false);
  assert.equal(fullHammer(6), true);
  assert.equal(fullHammer(3), false);
  assert.equal(activeMode("inner"), "inner");
  assert.equal(activeHour("15"), "15");
  assert.equal(activeHour("7"), "all");
  assert.equal(activeHammer("6"), "6");
  assert.equal(activeHammer("5"), "all");
  assert.equal(activeFinish("gilt", ["GILT"]), "GILT");
  assert.equal(suggestMode(4), "cannon");
  assert.equal(suggestMode(10), "date");
  assert.equal(suggestHour([], 3), 5);
  assert.equal(suggestHour([], 8), 10);
  assert.equal(suggestHour([], 14), 15);
  assert.equal(suggestHour([], 20), 30);
  assert.equal(suggestFinish([]), "IVORY");
  assert.equal(moveCadratureFocus(0, 3, 1), 1);
  assert.equal(moveCadratureFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", piece: "cannon" });
  const due = rule({ id: "b", title: "Bea", piece: "hour", lock: 1 });
  const quiet = rule({ id: "c", title: "Cara", drop: 5, lock: 1 });
  const cell = rule({ id: "d", title: "Dora", film: "GILT", drop: 30, lock: 6 });
  const fax = rule({ id: "e", title: "Eve", piece: "date", film: "IVORY", drop: 10 });
  assert.equal(lateCadrature(late, "date"), true);
  assert.equal(lateCadrature(late, "cannon"), false);
  assert.equal(overdueCadrature(due), true);
  assert.equal(idleCadrature(quiet), true);
  assert.equal(briskCadrature(cell), true);
  assert.equal(restingCadrature(fax), true);
  assert.deepEqual(reminderCadratures([due, late]), ["Bea"]);
  assert.equal(fairKeeper([rule({ id: "1", title: "One", setter: "Ada" }), rule({ id: "2", title: "Two", setter: "Bea" }), rule({ id: "3", title: "Three", setter: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", drop: 15 }), rule({ id: "2", title: "East", drop: 10 })];
  assert.match(cadratureTimeline(cards).map((mail) => mail.drop).join(","), /15/);
  const saved = addCadrature([], { title: "Ada", piece: "minute", drop: "10", film: "gilt", lock: "3", tags: "c d x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].piece, "minute");
  assert.equal(saved[0].drop, 10);
  assert.equal(saved[0].lock, 3);
  assert.deepEqual(saved[0].tags, ["c", "d"]);
  assert.equal(addCadrature(saved, { title: "Ada" }).length, 1);
  assert.equal(addCadrature([], { title: "Eve" })[0].lock, 1);
  assert.equal(dropCadratureView([{ id: "v", name: "Morning", tray: "board", query: "", setter: "", film: "all", piece: "all", drop: "all", lock: "all" }], "v").length, 0);
  assert.equal(readCadratureViews([{ id: "v", name: "Morning", tray: "peg" }])[0].tray, "peg");

  const now = Date.parse("2026-11-20T12:00:00.000Z");
  assert.equal(jbtHome("LEAD", now), true);
  assert.equal(jbtHome("owner_ceo", now), true);
  assert.equal(jbtHome("2026-11-20T01:00:00.000Z", now), true);
  assert.equal(jbtAway("former seat", now), true);
  assert.equal(jbtGuest("2026-11-05T12:00:00.000Z", now), true);
  assert.equal(jbtCitizen("2025-01-01T00:00:00.000Z", now), true);
  assert.equal(jbtDesk("2026-11-16T12:00:00.000Z", now), true);
  assert.equal(jbtHome({ jobTitle: true }, now), true);
  assert.equal(jbtHome({ jobTitle: "2026-11-20T08:00:00.000Z" }, now), true);
  assert.equal(jbtPlain({ jobTitle: false }, now), true);
  assert.equal(jbtAway({ jobTitle: false }, now), false);
  assert.equal(jbtPlain({ jobTitle: "Marble" }, now), true);
  assert.equal(jbtHome({ jobTitle: "Marble" }, now), false);
  assert.equal(jbtBrief({ jobTitle: "BRIEFED" }, now), true);
  assert.equal(jbtJoin("SALES&DESK", now), true);
  assert.equal(jbtJoin("ANNA NOAH", now), false);
  assert.equal(jbtRoute("SALES:DESK", now), true);
  assert.equal(jbtRoute("SETHOLD", now), false);
  assert.equal(jbtBrief("MARKS", now), false);
  assert.equal(jbtBrief("LEAD", now), false);
  assert.equal(jbtLong("EighteenCharsLongX", now), true);
  assert.equal(jbtLong("20261120T073000ZZ", now), false);
  assert.equal(jbtLane("LEAD", now), "hall");
  assert.equal(jbtLane("sales_manager", now), "desk");
  assert.equal(jbtLane("retention_manager", now), "hold");
  assert.equal(jbtLane("analyst", now), "guest");
  assert.equal(jbtLane("marketer", now), "join");
  assert.equal(jbtLane("2026-11-16T12:00:00.000Z", now), "desk");
  assert.equal(jbtLane("2026-11-05T12:00:00.000Z", now), "hold");
  assert.equal(jbtLane("2025-01-01T00:00:00.000Z", now), "guest");
  assert.equal(jbtLane("Marble", now), "plain");
  assert.equal(jbtLane("20261120T073000Z", now), "stamp");
  assert.equal(jbtLane("Amsterdam", now), "vowel");
  assert.equal(jbtLane("former seat", now), "vacant");
  assert.equal(jbtLane("alpha/beta/gamma/delta", now), "route");
  assert.equal(jbtLane("chief of desk", now), "hall");
  assert.equal(jbtOpen(""), true);
  assert.equal(jbtOpen({ jobTitle: "" }), true);
  assert.equal(jbtState({ name: "Ada" }), "");
  assert.equal(jbtState({ jobTitle: "Paris", balance: 1 }), "");
  assert.equal(jbtHue("LEAD", now), "champagne");
  assert.equal(jbtHue("SALES&DESK", now), "graphite");
  assert.equal(jbtHue("2026-11-05T12:00:00.000Z", now), "champagne");
  assert.equal(jbtHue("2026-11-16T12:00:00.000Z", now), "graphite");
  assert.equal(jbtSoon("BRIEFED", now), true);
  assert.equal(jbtSoon("LEAD", now), false);
  assert.equal(jbtSoon("NINECHARS", now), true);
  assert.equal(jbtHue("Marble", now), "ivory");
  assert.equal(jbtLength("yes"), 3);
  assert.equal(jbtEven("ab"), true);
  assert.equal(jbtFirst("Paris"), true);
  assert.equal(jbtSpace("needs review"), true);
  assert.equal(jbtVowel("Amsterdam"), true);
  assert.equal(jbtDigit("Room4"), true);
  assert.equal(jbtCapital("PARIS"), true);
  assert.equal(jbtLower("paris"), true);
  assert.equal(jbtUpper("SEALEDXX"), true);
  assert.equal(jbtUpper("HOT"), false);
  assert.equal(jbtUpper("WARM"), false);
  const marks: JbtRow[] = [
    { id: "1", label: "Ada", code: "LEAD" },
    { id: "2", label: "Bea", code: "LEAD" },
    { id: "3", label: "Cara", code: "Marble" },
  ];
  assert.equal(leadingSel(marks), "hall");
  assert.match(jbtLanesCsv(marks), /hall,2/);
  assert.match(jbtRowsCsv(marks, ["1"]), /Ada,LEAD/);
  assert.equal(crmv4Text("tr", "cdrTitle"), ROUND361_COPY.tr.cdrTitle);
  assert.equal(crmv4Text("de", "jbtTitle"), ROUND361_COPY.de.jbtTitle);
  assert.equal(crmv4Text("ru", "qdPastasKicker"), ROUND361_COPY.ru.qdPastasKicker);
  assert.equal(crmv4Text("ar", "taThalamosLead"), ROUND361_COPY.ar.taThalamosLead);
  const keys = Object.keys(ROUND361_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND361_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-cadrature/);
  assert.match(css, /\.c4-jbtplate/);
  assert.match(css, /\.c4-cadrature-column/);
  assert.match(css, /\.c4-jbtplate-column/);
  assert.match(css, /\.c4-quick-pastas/);
  assert.match(css, /\.c4-ticket-thalamos/);
  assert.match(css, /\.c4-qd-pastas-mast/);
  assert.match(css, /\.c4-ta-thalamos-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round361.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /jobTitle:/);
  assert.match(viewFile, /cadratureCsv/);
  assert.match(viewFile, /jbtRowsCsv/);
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
  assert.match(viewFile, /c4-jbtplate-search/);
  assert.match(viewFile, /cadratureTimeline/);
  assert.match(viewFile, /c4-cadrature-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "cdr"/);
  assert.match(app, /view === "jbt"/);
  const tags = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round115.tsx"), "utf8");
  assert.match(tags, /c4-quick-pastas/);
  assert.match(tags, /c4-qd-pastas-mast/);
  assert.match(tags, /data-logo="mono"/);
  assert.match(tags, /qdPastasKicker/);
  assert.match(tags, /qdPastasLead/);
  assert.match(tags, /data-quick-pastas/);
  const gallery = tags.slice(tags.indexOf("export function QuickDial"), tags.indexOf("export function TicketAssignees"));
  assert.equal(gallery.includes("amount"), false);
  assert.equal(gallery.includes("price"), false);
  assert.match(tags, /c4-ticket-thalamos/);
  assert.match(tags, /c4-ta-thalamos-mast/);
  assert.match(tags, /taThalamosKicker/);
  assert.match(tags, /taThalamosLead/);
  assert.match(tags, /data-ticket-thalamos/);
  const porch = tags.slice(tags.indexOf("export function TicketAssignees"));
  assert.equal(porch.includes("amount"), false);
  assert.equal(porch.includes("profit"), false);
  assert.match(porch, /assigneeText/);
  const namedKeys = `${viewFile}\n${tags}`.match(/"(cdr|jbt|qdPastas|taThalamos)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND361_COPY.en[key as keyof typeof ROUND361_COPY.en], "string", key);
  console.log("crmv4 round361 tests passed");
}

main();
