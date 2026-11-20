/**
 * Retrograde rules, assignment plates, the ivory checklist pronaos, and the graphite priority prytaneion.
 * Run: TZ=UTC npx tsx tests/crmv4-round347.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND347_COPY } from "../src/lib/crmv4/copy-round347";
import {
  ROUND347_FEATURES,
  activeFinish,
  activeMode,
  activeHour,
  activeHammer,
  addRetrograde,
  briskRetrograde,
  dropRetrogradeView,
  fairKeeper,
  assignmentHome,
  assignmentBrief,
  assignmentCapital,
  assignmentDigit,
  assignmentEven,
  assignmentFirst,
  assignmentGap,
  assignmentHue,
  assignmentJoin,
  assignmentCitizen,
  assignmentLane,
  assignmentLanesCsv,
  assignmentLength,
  assignmentLower,
  assignmentGuest,
  assignmentAway,
  assignmentOpen,
  assignmentPlain,
  assignmentLong,
  assignmentRowsCsv,
  assignmentSoon,
  assignmentSpace,
  assignmentState,
  assignmentUpper,
  assignmentVowel,
  fullHammer,
  idleRetrograde,
  lateRetrograde,
  leadingAssignment,
  moveRetrogradeFocus,
  retrogradeBand,
  retrogradeHour,
  retrogradeGap,
  retrogradeInner,
  retrogradeMode,
  retrogradeOuter,
  retrogradeHammer,
  retrogradeFilm,
  retrogradeTimeline,
  overdueRetrograde,
  pairHammer,
  quietFinish,
  readRetrogradeViews,
  reminderRetrogrades,
  restingRetrograde,
  suggestFinish,
  suggestMode,
  suggestHour,
  type AssignmentRow,
  type Retrograde,
} from "../src/lib/crmv4/round347";

function rule(partial: Partial<Retrograde> & { id: string; title: string }): Retrograde {
  return {
    note: "",
    setter: "",
    piece: "",
    drop: null,
    film: "",
    lock: 5,
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
  assert.equal(ROUND347_FEATURES.length, 25);
  assert.equal(ROUND347_FEATURES.includes("assignment-plate"), true);
  assert.equal(ROUND347_FEATURES.includes("retrograde-pin-sla"), true);
  assert.equal(ROUND347_FEATURES.includes("fair-keeper"), true);
  assert.equal(ROUND347_FEATURES.includes("sector-archive"), true);
  assert.equal(ROUND347_FEATURES.includes("sector-reminders"), true);
  assert.equal(ROUND347_FEATURES.includes("retrograde-search"), true);
  assert.equal(ROUND347_FEATURES.includes("sector-timeline"), true);
  assert.equal(retrogradeMode(" sector "), "sector");
  assert.equal(retrogradeMode("brass"), "");
  assert.equal(retrogradeHour("3"), 3);
  assert.equal(retrogradeHour(9), 9);
  assert.equal(retrogradeHour(15), 15);
  assert.equal(retrogradeHour(21), 21);
  assert.equal(retrogradeHour("6"), null);
  assert.equal(retrogradeHour("2"), null);
  assert.equal(retrogradeHammer("2"), 2);
  assert.equal(retrogradeHammer(5), 5);
  assert.equal(retrogradeHammer("9"), 9);
  assert.equal(retrogradeHammer("1"), null);
  assert.equal(retrogradeHammer("4"), null);
  assert.equal(retrogradeFilm("gilt"), "GILT");
  assert.equal(retrogradeFilm("ivory"), "IVORY");
  assert.equal(retrogradeFilm("graphite"), "GRAPHITE");
  assert.equal(retrogradeFilm("hot"), "");
  assert.equal(retrogradeInner("sector"), true);
  assert.equal(retrogradeInner("ARC"), true);
  assert.equal(retrogradeInner("fan"), false);
  assert.equal(retrogradeOuter("fan"), true);
  assert.equal(retrogradeOuter("snail"), true);
  assert.equal(retrogradeOuter("sector"), false);
  assert.equal(retrogradeBand("sector"), "span");
  assert.equal(retrogradeBand("arc"), "bow");
  assert.equal(retrogradeBand("fan"), "leaf");
  assert.equal(retrogradeBand("snail"), "coil");
  assert.equal(retrogradeGap("sector", "snail"), 3);
  assert.equal(quietFinish("ivory"), true);
  assert.equal(quietFinish("gilt"), false);
  assert.equal(pairHammer(5), true);
  assert.equal(pairHammer(2), false);
  assert.equal(fullHammer(9), true);
  assert.equal(fullHammer(5), false);
  assert.equal(activeMode("inner"), "inner");
  assert.equal(activeHour("15"), "15");
  assert.equal(activeHour("4"), "all");
  assert.equal(activeHammer("9"), "9");
  assert.equal(activeHammer("1"), "all");
  assert.equal(activeFinish("gilt", ["GILT"]), "GILT");
  assert.equal(suggestMode(6), "sector");
  assert.equal(suggestMode(14), "snail");
  assert.equal(suggestHour([], 4), 3);
  assert.equal(suggestHour([], 8), 9);
  assert.equal(suggestHour([], 14), 15);
  assert.equal(suggestHour([], 20), 21);
  assert.equal(suggestFinish([]), "IVORY");
  assert.equal(moveRetrogradeFocus(0, 3, 1), 1);
  assert.equal(moveRetrogradeFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", piece: "sector" });
  const due = rule({ id: "b", title: "Bea", piece: "fan", lock: 2 });
  const quiet = rule({ id: "c", title: "Cara", drop: 3, lock: 2 });
  const cell = rule({ id: "d", title: "Dora", film: "GILT", drop: 21, lock: 9 });
  const fax = rule({ id: "e", title: "Eve", piece: "snail", film: "IVORY", drop: 9 });
  assert.equal(lateRetrograde(late, "snail"), true);
  assert.equal(lateRetrograde(late, "sector"), false);
  assert.equal(overdueRetrograde(due), true);
  assert.equal(idleRetrograde(quiet), true);
  assert.equal(briskRetrograde(cell), true);
  assert.equal(restingRetrograde(fax), true);
  assert.deepEqual(reminderRetrogrades([due, late]), ["Bea"]);
  assert.equal(fairKeeper([rule({ id: "1", title: "One", setter: "Ada" }), rule({ id: "2", title: "Two", setter: "Bea" }), rule({ id: "3", title: "Three", setter: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", drop: 15 }), rule({ id: "2", title: "East", drop: 9 })];
  assert.match(retrogradeTimeline(cards).map((mail) => mail.drop).join(","), /15/);
  const saved = addRetrograde([], { title: "Ada", piece: "arc", drop: "9", film: "gilt", lock: "5", tags: "r g x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].piece, "arc");
  assert.equal(saved[0].drop, 9);
  assert.equal(saved[0].lock, 5);
  assert.deepEqual(saved[0].tags, ["r", "g"]);
  assert.equal(addRetrograde(saved, { title: "Ada" }).length, 1);
  assert.equal(addRetrograde([], { title: "Eve" })[0].lock, 2);
  assert.equal(dropRetrogradeView([{ id: "v", name: "Morning", tray: "board", query: "", setter: "", film: "all", piece: "all", drop: "all", lock: "all" }], "v").length, 0);
  assert.equal(readRetrogradeViews([{ id: "v", name: "Morning", tray: "peg" }])[0].tray, "peg");

  const stamp = "2026-11-20T07:30:00.000Z";
  assert.equal(assignmentHome("lead"), true);
  assert.equal(assignmentHome("LEAD"), true);
  assert.equal(assignmentAway("DESK"), true);
  assert.equal(assignmentGuest("RETN"), true);
  assert.equal(assignmentCitizen("KEEP"), true);
  assert.equal(assignmentHome({ assigneeId: true }), true);
  assert.equal(assignmentPlain({ assigneeId: false }), true);
  assert.equal(assignmentAway({ assigneeId: false }), false);
  assert.equal(assignmentPlain({ assigneeId: "Letter" }), true);
  assert.equal(assignmentHome({ assigneeId: "Letter" }), false);
  assert.equal(assignmentBrief({ assigneeId: "20261120" }), true);
  assert.equal(assignmentJoin("LEAD&DESK"), true);
  assert.equal(assignmentJoin("ANNA NOAH"), false);
  assert.equal(assignmentGap("U,S"), true);
  assert.equal(assignmentGap("LIVEHOLD"), false);
  assert.equal(assignmentBrief("20261120"), true);
  assert.equal(assignmentBrief("LEAD"), false);
  assert.equal(assignmentLong("Abcdefghijklmnopqrst"), true);
  assert.equal(assignmentLong(stamp), false);
  assert.equal(assignmentLane("LEAD"), "lead");
  assert.equal(assignmentLane("Keep"), "keep");
  assert.equal(assignmentLane("Letter"), "plain");
  assert.equal(assignmentLane(stamp), "mark");
  assert.equal(assignmentLane("Amsterdam"), "vowel");
  assert.equal(assignmentOpen(""), true);
  assert.equal(assignmentOpen({ assigneeId: "" }), true);
  assert.equal(assignmentState({ name: "Ada" }), "");
  assert.equal(assignmentState({ assigneeId: "Paris", balance: 1 }), "");
  assert.equal(assignmentHue("LEAD"), "champagne");
  assert.equal(assignmentHue("LEAD&DESK"), "graphite");
  assert.equal(assignmentHue("RETN"), "champagne");
  assert.equal(assignmentSoon("ABCDEF"), true);
  assert.equal(assignmentSoon("LEAD"), false);
  assert.equal(assignmentSoon("Amsterdam"), false);
  assert.equal(assignmentHue("Letter"), "ivory");
  assert.equal(assignmentLength("yes"), 3);
  assert.equal(assignmentEven("ab"), true);
  assert.equal(assignmentFirst("Paris"), true);
  assert.equal(assignmentSpace("needs review"), true);
  assert.equal(assignmentVowel("Amsterdam"), true);
  assert.equal(assignmentDigit("Room4"), true);
  assert.equal(assignmentCapital("PARIS"), true);
  assert.equal(assignmentLower("paris"), true);
  assert.equal(assignmentUpper("LEONARD"), true);
  assert.equal(assignmentUpper("DESK"), false);
  assert.equal(assignmentUpper("LEAD"), false);
  const marks: AssignmentRow[] = [
    { id: "1", label: "Ada", code: "LEAD" },
    { id: "2", label: "Bea", code: "LEAD" },
    { id: "3", label: "Cara", code: "Madrid" },
  ];
  assert.equal(leadingAssignment(marks), "lead");
  assert.match(assignmentLanesCsv(marks), /lead,2/);
  assert.match(assignmentRowsCsv(marks, ["1"]), /Ada,LEAD/);
  assert.equal(crmv4Text("tr", "rtgTitle"), ROUND347_COPY.tr.rtgTitle);
  assert.equal(crmv4Text("de", "asgTitle"), ROUND347_COPY.de.asgTitle);
  assert.equal(crmv4Text("ru", "hkPronaosKicker"), ROUND347_COPY.ru.hkPronaosKicker);
  assert.equal(crmv4Text("ar", "zqPrytaneionLead"), ROUND347_COPY.ar.zqPrytaneionLead);
  const keys = Object.keys(ROUND347_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND347_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-retrograde/);
  assert.match(css, /\.c4-asgplate/);
  assert.match(css, /\.c4-retrograde-column/);
  assert.match(css, /\.c4-asgplate-column/);
  assert.match(css, /\.c4-check-pronaos/);
  assert.match(css, /\.c4-case-prytaneion/);
  assert.match(css, /\.c4-hk-pronaos-mast/);
  assert.match(css, /\.c4-zq-prytaneion-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round347.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /assigneeId:/);
  assert.match(viewFile, /retrogradeCsv/);
  assert.match(viewFile, /assignmentRowsCsv/);
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
  assert.match(viewFile, /c4-asgplate-search/);
  assert.match(viewFile, /retrogradeTimeline/);
  assert.match(viewFile, /c4-retrograde-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "rtg"/);
  assert.match(app, /view === "asg"/);
  const host = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round105.tsx"), "utf8");
  assert.match(host, /c4-check-pronaos/);
  assert.match(host, /c4-hk-pronaos-mast/);
  assert.match(host, /data-logo="mono"/);
  assert.match(host, /hkPronaosKicker/);
  assert.match(host, /hkPronaosLead/);
  assert.match(host, /data-check-polish/);
  assert.equal(host.includes("amount"), false);
  assert.match(host, /c4-case-prytaneion/);
  assert.match(host, /c4-zq-prytaneion-mast/);
  assert.match(host, /zqPrytaneionKicker/);
  assert.match(host, /zqPrytaneionLead/);
  assert.match(host, /data-case-priority/);
  assert.equal(host.includes("currency"), false);
  assert.equal(host.includes("profit"), false);
  const namedKeys = `${viewFile}\n${host}`.match(/"(rtg|asg|hkPronaos|zqPrytaneion)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND347_COPY.en[key as keyof typeof ROUND347_COPY.en], "string", key);
  console.log("crmv4 round347 tests passed");
}

main();
