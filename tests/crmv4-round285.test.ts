/**
 * Traverse pegs, note plates, and the task atelier.
 * Run: TZ=UTC npx tsx tests/crmv4-round285.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND285_COPY } from "../src/lib/crmv4/copy-round285";
import {
  ROUND285_FEATURES,
  activeCourse,
  activePeg,
  activeSpeed,
  activeThread,
  activeTravFinish,
  addTraverse,
  briskTraverse,
  courseBand,
  courseGap,
  courseOf,
  dipSpeed,
  dropTraverseView,
  fairHelmsman,
  houseThread,
  idleTraverse,
  lateTraverse,
  leadingNote,
  leeCourse,
  liftSpeed,
  moveTravFocus,
  noteCap,
  noteDigit,
  noteEcho,
  noteEven,
  noteGroups,
  noteHue,
  noteKnown,
  noteLane,
  noteLanesCsv,
  noteLeap,
  noteOdd,
  noteRowsCsv,
  noteSlash,
  noteSpace,
  noteState,
  noteStep,
  noteTail,
  noteTwin,
  noteWide,
  overdueTraverse,
  pairPeg,
  readTraverseViews,
  restingTraverse,
  squarePeg,
  suggestCourse,
  suggestSpeed,
  suggestTravFinish,
  travFinish,
  travThread,
  traversePeg,
  traverseSpeed,
  weatherCourse,
  type NoteRow,
  type TraversePeg,
} from "../src/lib/crmv4/round285";

function card(partial: Partial<TraversePeg> & { id: string; title: string }): TraversePeg {
  return {
    note: "",
    helm: "",
    course: "",
    speed: null,
    finish: "",
    thread: "",
    peg: 1,
    tags: [],
    logged: false,
    locked: false,
    stowed: false,
    flagged: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND285_FEATURES.length, 25);
  assert.equal(courseOf(" east "), "east");
  assert.equal(courseOf("paris"), "");
  assert.equal(traverseSpeed("2"), 2);
  assert.equal(traverseSpeed(4), 4);
  assert.equal(traverseSpeed("8"), 8);
  assert.equal(traverseSpeed("6"), null);
  assert.equal(traverseSpeed("16"), null);
  assert.equal(traversePeg("1"), 1);
  assert.equal(traversePeg(2), 2);
  assert.equal(traversePeg("4"), 4);
  assert.equal(traversePeg("3"), null);
  assert.equal(traversePeg("12"), null);
  assert.equal(travFinish("ivory"), "IVORY");
  assert.equal(travFinish("graphite"), "GRAPHITE");
  assert.equal(travFinish("champagne"), "CHAMPAGNE");
  assert.equal(travFinish("gilt"), "");
  assert.equal(travThread("hemp"), "hemp");
  assert.equal(travThread("silk"), "silk");
  assert.equal(travThread("brass"), "brass");
  assert.equal(travThread("pitch"), "");
  assert.equal(weatherCourse("north"), true);
  assert.equal(weatherCourse("EAST"), true);
  assert.equal(weatherCourse("south"), false);
  assert.equal(leeCourse("south"), true);
  assert.equal(leeCourse("west"), true);
  assert.equal(leeCourse("north"), false);
  assert.equal(courseBand("north"), "dawn");
  assert.equal(courseBand("east"), "noon");
  assert.equal(courseBand("south"), "dusk");
  assert.equal(courseBand("west"), "night");
  assert.equal(courseBand(""), "");
  assert.equal(courseGap("north", "east"), 1);
  assert.equal(courseGap("east", "north"), -1);
  assert.equal(courseGap("", "north"), null);
  assert.equal(houseThread("silk"), true);
  assert.equal(houseThread("BRASS"), true);
  assert.equal(houseThread("hemp"), false);
  assert.equal(pairPeg(2), true);
  assert.equal(pairPeg("2"), true);
  assert.equal(pairPeg(1), false);
  assert.equal(pairPeg(4), false);
  assert.equal(squarePeg(4), true);
  assert.equal(squarePeg(2), false);
  assert.equal(activeCourse("weather"), "weather");
  assert.equal(activeCourse("north"), "north");
  assert.equal(activeCourse("paris"), "all");
  assert.equal(activeSpeed("2"), "2");
  assert.equal(activeSpeed("6"), "all");
  assert.equal(activeThread("brass", ["hemp", "silk", "brass"]), "brass");
  assert.equal(activeThread("mist", ["hemp", "silk", "brass"]), "all");
  assert.equal(activePeg("2"), "2");
  assert.equal(activePeg("3"), "all");
  assert.equal(activeTravFinish("graphite"), "graphite");
  assert.equal(moveTravFocus(0, 4, 1), 1);
  assert.equal(moveTravFocus(0, 4, -1), 3);
  assert.equal(suggestTravFinish([]), "IVORY");
  assert.equal(suggestSpeed([], 5), 2);
  assert.equal(suggestSpeed([], 10), 4);
  assert.equal(suggestSpeed([], 20), 8);
  assert.equal(suggestCourse(8), "north");
  assert.equal(suggestCourse(11), "west");
  assert.equal(fairHelmsman([card({ id: "1", title: "North", helm: "Ada" })], "Ada,Bea"), "Bea");

  const saved = addTraverse([], { id: "1", title: "Lee", course: "south", speed: 2, thread: "brass", peg: 4, helm: "Ada" });
  assert.equal(saved[0].audit, "save");
  assert.equal(overdueTraverse(saved[0]), true);
  assert.equal(briskTraverse(saved[0]), false);
  assert.equal(liftSpeed(saved, "1")[0].speed, 4);
  assert.equal(dipSpeed([{ ...saved[0], speed: null }], "1")[0].speed, 8);
  const quiet = card({ id: "2", title: "Calm", course: "south", thread: "hemp", peg: 1 });
  assert.equal(idleTraverse(quiet), true);
  assert.equal(lateTraverse(card({ id: "4", title: "Late", course: "north", peg: 1 }), "west"), true);
  const rest = card({ id: "3", title: "Rest", course: "west", thread: "silk", speed: 8, peg: 2 });
  assert.equal(restingTraverse(rest), true);
  assert.equal(briskTraverse(card({ id: "5", title: "Keen", course: "north", thread: "brass", peg: 4 })), true);
  const views = readTraverseViews([{ id: "v1", name: "Morning", tray: "locker", course: "weather", speed: "2", peg: "2", thread: "brass", finish: "ivory" }]);
  assert.equal(views[0].tray, "locker");
  assert.equal(views[0].course, "weather");
  assert.equal(dropTraverseView(views, "v1").length, 0);

  assert.equal(noteLane("call back"), "house");
  assert.equal(noteLane("send file"), "house");
  assert.equal(noteLane("room 4"), "mark");
  assert.equal(noteLane("a/b plan"), "slash");
  assert.equal(noteLane("please send the file"), "court");
  assert.equal(noteLane("call back please"), "span");
  assert.equal(noteLane("FILE NOTE"), "seal");
  assert.equal(noteLane("please"), "open");
  assert.equal(noteLane("callbackpleasewaitnow"), "long");
  assert.equal(noteLane("Ada"), "short");
  assert.equal(noteLane("echo"), "desk");
  assert.equal(noteHue("call back"), "ivory");
  assert.equal(noteHue("send file"), "champagne");
  assert.equal(noteHue("quiet week"), "graphite");
  assert.equal(noteKnown("warm lead"), true);
  assert.equal(noteKnown("please"), false);
  assert.equal(noteGroups("please send file"), 3);
  assert.equal(noteGroups("call back"), 2);
  assert.equal(noteStep("please"), 6);
  assert.equal(noteLeap("please"), true);
  assert.equal(noteWide("callbackpleasewaitnow"), true);
  assert.equal(noteSlash("a/b plan"), true);
  assert.equal(noteSpace("call back"), true);
  assert.equal(noteDigit("room 4"), true);
  assert.equal(noteTwin("booklet"), true);
  assert.equal(noteEcho("Mississippi"), true);
  assert.equal(noteTail("call back"), true);
  assert.equal(noteTail("Rome"), false);
  assert.equal(noteCap("FILE NOTE"), true);
  assert.equal(noteCap("please"), false);
  assert.equal(noteEven("call back"), true);
  assert.equal(noteOdd("Ada"), true);
  assert.equal(noteState({ retentionNote: "call back", amount: 3 }), "");
  assert.equal(noteState(""), "clear");
  assert.equal(noteState({ city: "x" }), "");
  const rows: NoteRow[] = [
    { id: "1", label: "Ada", note: "call back" },
    { id: "2", label: "Bea", note: "Ada" },
  ];
  assert.equal(leadingNote(rows), "house");
  assert.match(noteLanesCsv(rows), /house,1/);
  assert.match(noteLanesCsv(rows), /short,1/);
  assert.match(noteRowsCsv(rows, ["1"]), /Ada,call back,CA,house,ivory/);

  const locales = ["en", "tr", "de", "ru", "ar"] as const;
  const keys = Object.keys(ROUND285_COPY.en).sort();
  for (const locale of locales) assert.deepEqual(Object.keys(ROUND285_COPY[locale]).sort(), keys);
  assert.equal(crmv4Text("tr", "trvTitle"), ROUND285_COPY.tr.trvTitle);
  assert.equal(crmv4Text("de", "nteTitle"), ROUND285_COPY.de.nteTitle);
  assert.equal(crmv4Text("ru", "trvSub"), ROUND285_COPY.ru.trvSub);
  assert.equal(crmv4Text("ar", "nteSub"), ROUND285_COPY.ar.nteSub);
  assert.equal(crmv4Text("en", "trvLogo"), "7FX");
  assert.equal(crmv4Text("en", "nteLogo"), "7FX");
  assert.equal(crmv4Text("en", "trvTitle"), "Traverse pegs");
  assert.equal(crmv4Text("en", "nteTitle"), "Note plates");
  assert.equal(crmv4Text("en", "tskAtelierKicker"), "Task atelier");
  assert.notEqual(ROUND285_COPY.tr.trvTitle, ROUND285_COPY.en.trvTitle);
  assert.notEqual(ROUND285_COPY.ar.nteTitle, ROUND285_COPY.en.nteTitle);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-traverse/);
  assert.match(css, /\.c4-noteplate-index/);
  assert.match(css, /\.c4-traverse-column/);
  assert.match(css, /\.c4-noteplate-column/);
  assert.match(css, /\.c4-task-atelier/);
  assert.match(css, /\.c4-task-atelier-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round285.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /retentionNote:/);
  assert.match(viewFile, /traverseCsv/);
  assert.match(viewFile, /noteRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "l"/);
  assert.match(viewFile, /event\.key === "g"/);
  assert.match(viewFile, /event\.key === "h"/);
  assert.match(viewFile, /event\.key === "w"/);
  assert.match(viewFile, /event\.key === "b"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /event\.key === "u"/);
  assert.match(viewFile, /event\.key === "y"/);
  assert.match(viewFile, /event\.key === "m"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0&role=TRADER/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestTravFinish/);
  assert.match(viewFile, /c4-noteplate-search/);
  assert.match(viewFile, /traverseTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "trv"/);
  assert.match(app, /view === "nte"/);
  const desk = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round14.tsx"), "utf8");
  assert.match(desk, /c4-task-atelier/);
  assert.match(desk, /c4-task-atelier-seal/);
  assert.match(desk, /c4-task-atelier-mast/);
  assert.match(desk, /c4-task-atelier-empty/);
  assert.match(desk, /data-logo="mono"/);
  assert.match(desk, /tskAtelierKicker/);
  assert.match(desk, /tskAtelierLead/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND285_COPY.en, key);
  const named = viewFile.match(/"(trv|nte)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of named) assert.ok(key in ROUND285_COPY.en, key);
  const atelier = desk.match(/v4\("(tskAtelier[a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || [];
  for (const key of atelier) assert.ok(key in ROUND285_COPY.en, key);
  console.log("crmv4 round285 tests passed");
}

main();
