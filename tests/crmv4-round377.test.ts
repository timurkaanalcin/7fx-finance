/**
 * Vignette frames, document marks, the ivory document aumbry, and the graphite affiliate feretory.
 * Run: TZ=UTC npx tsx tests/crmv4-round377.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND377_COPY } from "../src/lib/crmv4/copy-round377";
import { ROUND376_FEATURES } from "../src/lib/crmv4/round376";
import {
  ROUND377_FEATURES,
  activeFilm,
  activeLayer,
  activeShift,
  activeSpan,
  addFrame,
  briskFrame,
  dropFrameView,
  dmkBare,
  dmkBench,
  dmkCourt,
  dmkDigit,
  dmkEven,
  dmkFirst,
  dmkHue,
  dmkLane,
  dmkLanesCsv,
  dmkLength,
  dmkLower,
  dmkOpen,
  dmkPair,
  dmkReturn,
  dmkRowsCsv,
  dmkScope,
  dmkShort,
  dmkShut,
  dmkSoon,
  dmkSpace,
  dmkSpan,
  dmkUpper,
  dmkVowel,
  dmkWait,
  fairFramer,
  frameBand,
  frameCool,
  frameFilm,
  frameGap,
  frameLayer,
  framePoint,
  frameSpan,
  frameTimeline,
  frameWarm,
  fullLayer,
  idleFrame,
  lateFrame,
  leadingDmk,
  leadingDmkHue,
  moveFrameFocus,
  overdueFrame,
  pairLayer,
  readFrameViews,
  reminderFrames,
  restingFrame,
  sootQuiet,
  suggestFilm,
  suggestShift,
  suggestSpan,
  type DmkRow,
  type Frame,
} from "../src/lib/crmv4/round377";

function rule(partial: Partial<Frame> & { id: string; title: string }): Frame {
  return {
    note: "",
    framer: "",
    shift: "",
    sla: null,
    film: "",
    layer: 2,
    tags: [],
    raised: false,
    clipped: false,
    drawn: false,
    starred: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND377_FEATURES.length, 25);
  assert.equal(new Set(ROUND377_FEATURES).size, 25);
  for (const feature of ROUND377_FEATURES) assert.equal((ROUND376_FEATURES as readonly string[]).includes(feature), false, feature);
  assert.equal(framePoint(" morning "), "morning");
  assert.equal(framePoint("brass"), "");
  assert.equal(frameSpan("15"), 15);
  assert.equal(frameSpan(30), 30);
  assert.equal(frameSpan(45), 45);
  assert.equal(frameSpan(60), 60);
  assert.equal(frameSpan("12"), null);
  assert.equal(frameSpan("4"), null);
  assert.equal(frameLayer("2"), 2);
  assert.equal(frameLayer(4), 4);
  assert.equal(frameLayer("8"), 8);
  assert.equal(frameLayer("3"), null);
  assert.equal(frameLayer("6"), null);
  assert.equal(frameFilm("brass"), "BRASS");
  assert.equal(frameFilm("paper"), "PAPER");
  assert.equal(frameFilm("soot"), "SOOT");
  assert.equal(frameFilm("gold"), "");
  assert.equal(frameWarm("morning"), true);
  assert.equal(frameWarm("AFTERNOON"), true);
  assert.equal(frameWarm("evening"), false);
  assert.equal(frameCool("evening"), true);
  assert.equal(frameCool("grave"), true);
  assert.equal(frameCool("morning"), false);
  assert.equal(frameBand("morning"), "first");
  assert.equal(frameBand("afternoon"), "second");
  assert.equal(frameBand("evening"), "third");
  assert.equal(frameBand("grave"), "fourth");
  assert.equal(frameGap("morning", "grave"), 3);
  assert.equal(sootQuiet("soot"), true);
  assert.equal(sootQuiet("paper"), false);
  assert.equal(sootQuiet("brass"), false);
  assert.equal(pairLayer(4), true);
  assert.equal(pairLayer(2), false);
  assert.equal(fullLayer(8), true);
  assert.equal(fullLayer(4), false);
  assert.equal(activeShift("warm"), "warm");
  assert.equal(activeSpan("15"), "15");
  assert.equal(activeSpan("4"), "all");
  assert.equal(activeLayer("8"), "8");
  assert.equal(activeLayer("3"), "all");
  assert.equal(activeFilm("brass", ["BRASS"]), "BRASS");
  assert.equal(suggestShift(4), "morning");
  assert.equal(suggestShift(10), "afternoon");
  assert.equal(suggestShift(14), "evening");
  assert.equal(suggestShift(20), "grave");
  assert.equal(suggestSpan([], 1), 15);
  assert.equal(suggestSpan([], 6), 30);
  assert.equal(suggestSpan([], 11), 30);
  assert.equal(suggestSpan([], 16), 45);
  assert.equal(suggestSpan([], 19), 60);
  assert.equal(suggestFilm([]), "PAPER");
  assert.equal(moveFrameFocus(0, 3, 1), 1);
  assert.equal(moveFrameFocus(0, 3, -1), 2);

  const saved = addFrame([], { id: "g1", title: "Morning frame", framer: "Ada", shift: "morning", sla: 15, film: "brass", layer: 2, tags: "a b x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].film, "BRASS");
  assert.equal(saved[0].tags.join(""), "ab");
  assert.equal(saved[0].audit, "save");
  assert.equal(addFrame(saved, { title: "Morning frame" }).length, 1);
  const grave = rule({ id: "n1", title: "Grave frame", shift: "grave", layer: 2 });
  assert.equal(overdueFrame(grave), true);
  assert.equal(reminderFrames([grave])[0], "Grave frame");
  assert.equal(idleFrame(rule({ id: "i1", title: "Idle", sla: 15, layer: 2 })), true);
  assert.equal(briskFrame(rule({ id: "b1", title: "Brisk", film: "BRASS", sla: 60, layer: 8 })), true);
  assert.equal(restingFrame(rule({ id: "r1", title: "Rest", shift: "grave", film: "PAPER", sla: 30 })), true);
  assert.equal(lateFrame(rule({ id: "l1", title: "Late", shift: "morning" }), "grave"), true);
  assert.equal(lateFrame(rule({ id: "l2", title: "Held", shift: "morning", raised: true }), "grave"), false);
  assert.equal(fairFramer([rule({ id: "a", title: "A", framer: "Ada" }), rule({ id: "b", title: "B", framer: "Bea", raised: true })], "Ada,Bea"), "Bea");
  const timeline = frameTimeline([rule({ id: "t", title: "Fifteen", sla: 15 })]);
  assert.equal(timeline[0].sla, 15);
  assert.equal(timeline[0].titles[0], "Fifteen");
  const views = readFrameViews([{ id: "v1", name: "Grave deck", tray: "drawer", query: "frame", framer: "Ada", film: "SOOT", shift: "cool", sla: "60", layer: "8" }]);
  assert.equal(views[0].tray, "drawer");
  assert.equal(views[0].shift, "cool");
  assert.equal(dropFrameView(views, "v1").length, 0);

  const now = Date.parse("2026-11-26T12:00:00Z");
  assert.equal(dmkLane("READY", now), "court");
  assert.equal(dmkLane("please review the file", now), "court");
  assert.equal(dmkLane(true, now), "court");
  assert.equal(dmkLane(false, now), "bare");
  assert.equal(dmkLane("PENDING", now), "bench");
  assert.equal(dmkLane("LATER", now), "wait");
  assert.equal(dmkLane("REJECTED", now), "return");
  assert.equal(dmkLane("BOTH", now), "pair");
  assert.equal(dmkLane("TR+DE", now), "pair");
  assert.equal(dmkLane("hidden lane", now), "shut");
  assert.equal(dmkLane("scope:tr", now), "scope");
  assert.equal(dmkLane("TRYS", now), "short");
  assert.equal(dmkLane("12night", now), "digit");
  assert.equal(dmkLane("AUSTRALIAXXX", now), "span");
  assert.equal(dmkLane("Italy", now), "openv");
  assert.equal(dmkLane("Spain", now), "bare");
  assert.equal(dmkLane("2026-11-26T08:00:00Z", now), "court");
  assert.equal(dmkLane("2026-11-25T08:00:00Z", now), "bench");
  assert.equal(dmkLane("2026-11-24T00:00:00Z", now), "wait");
  assert.equal(dmkLane("2026-11-01T08:00:00Z", now), "return");
  assert.equal(dmkLane({ documentsStatus: "APPROVED" }, now), "court");
  assert.equal(dmkLane({ name: "Ada" }, now), "");
  assert.equal(dmkLane({ documentsStatus: "READY", amount: 1 }, now), "");
  assert.equal(dmkHue("READY", now), "champagne");
  assert.equal(dmkHue("PENDING", now), "graphite");
  assert.equal(dmkHue("TRYS", now), "ivory");
  assert.equal(dmkCourt("READY", now), true);
  assert.equal(dmkBench("PENDING", now), true);
  assert.equal(dmkWait("LATER", now), true);
  assert.equal(dmkReturn("REJECTED", now), true);
  assert.equal(dmkShut("sealed", now), true);
  assert.equal(dmkPair("TR+DE", now), true);
  assert.equal(dmkScope("scope:tr", now), true);
  assert.equal(dmkShort("TRYS", now), true);
  assert.equal(dmkSpan("AUSTRALIAXXX", now), true);
  assert.equal(dmkBare("Spain", now), true);
  assert.equal(dmkOpen(""), true);
  assert.equal(dmkSoon("TRYS", now), true);
  assert.equal(dmkSoon("WESTX", now), false);
  assert.equal(dmkLength("TRYS"), 4);
  assert.equal(dmkEven("TR"), true);
  assert.equal(dmkDigit("12night"), true);
  assert.equal(dmkVowel("Italy"), true);
  assert.equal(dmkLower("spain"), true);
  assert.equal(dmkUpper("SPAIN"), true);
  assert.equal(dmkUpper("TR"), false);
  assert.equal(dmkFirst("Spain"), true);
  assert.equal(dmkSpace("new spain"), true);
  const rows: DmkRow[] = [
    { id: "1", label: "Ada", code: "READY" },
    { id: "2", label: "Bea", code: "TRYS" },
  ];
  assert.equal(leadingDmk(rows), "court");
  assert.equal(leadingDmkHue(rows), "champagne");
  assert.match(dmkLanesCsv(rows), /court,1/);
  assert.match(dmkRowsCsv(rows, ["1"]), /Ada,READY/);
  assert.match(dmkRowsCsv(rows, ["1"]), /,1$/m);

  assert.equal(crmv4Text("en", "vgnTitle"), ROUND377_COPY.en.vgnTitle);
  assert.equal(crmv4Text("tr", "dmkTitle"), ROUND377_COPY.tr.dmkTitle);
  assert.equal(crmv4Text("de", "vgnHint"), ROUND377_COPY.de.vgnHint);
  assert.equal(crmv4Text("ru", "dcAumbryKicker"), ROUND377_COPY.ru.dcAumbryKicker);
  assert.equal(crmv4Text("ar", "afFeretoryLead"), ROUND377_COPY.ar.afFeretoryLead);
  const keys = Object.keys(ROUND377_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND377_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-vignette/);
  assert.match(css, /\.c4-docmark/);
  assert.match(css, /\.c4-vignette-column/);
  assert.match(css, /\.c4-docmark-column/);
  assert.match(css, /\.c4-doc-aumbry/);
  assert.match(css, /\.c4-aff-feretory/);
  assert.match(css, /\.c4-doc-aumbry-mast/);
  assert.match(css, /\.c4-aff-feretory-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round377.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /documentsStatus:/);
  assert.match(viewFile, /frameCsv/);
  assert.match(viewFile, /dmkRowsCsv/);
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
  assert.match(viewFile, /suggestFilm/);
  assert.match(viewFile, /c4-docmark-search/);
  assert.match(viewFile, /frameTimeline/);
  assert.match(viewFile, /c4-vignette-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "vgn"/);
  assert.match(app, /view === "dmk"/);
  const docs = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round15.tsx"), "utf8");
  const aff = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round13.tsx"), "utf8");
  assert.match(docs, /c4-doc-aumbry/);
  assert.match(docs, /c4-doc-aumbry-mast/);
  assert.match(docs, /data-logo="mono"/);
  assert.match(docs, /dcAumbryKicker/);
  assert.match(docs, /dcAumbryLead/);
  assert.match(docs, /data-doc-aumbry/);
  assert.match(docs, /aria-required=\{false\}/);
  assert.match(aff, /c4-aff-feretory/);
  assert.match(aff, /c4-aff-feretory-mast/);
  assert.match(aff, /data-logo="mono"/);
  assert.match(aff, /afFeretoryKicker/);
  assert.match(aff, /afFeretoryLead/);
  assert.match(aff, /data-aff-feretory/);
  assert.match(aff, /aria-required=\{false\}/);
  const namedKeys = `${viewFile}\n${docs}\n${aff}`.match(/"(vgn|dmk|dcAumbry|afFeretory)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND377_COPY.en[key as keyof typeof ROUND377_COPY.en], "string", key);
  console.log("crmv4 round377 tests passed");
}

main();
