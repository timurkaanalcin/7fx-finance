/**
 * Cue cards and regions.
 * Run: npx tsx tests/crmv4-round142.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND142_COPY } from "../src/lib/crmv4/copy-round142";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeCompass,
  activeMark,
  activeMinute,
  activeOwner,
  activeRegion,
  activeRegionInitial,
  activeSpan,
  activeTone,
  activeWing,
  addCue,
  addCueView,
  bulkCueDone,
  bulkCuePinned,
  compassArg,
  compassOf,
  cueClashIds,
  cueCopy,
  cueCounts,
  cueMarks,
  cueOwners,
  cueShare,
  cueText,
  cueTimeline,
  cueTones,
  cueWings,
  cuesCsv,
  dropCueView,
  editCue,
  leadingCompass,
  leadingRegion,
  leadingRegionInitial,
  leadingSpan,
  markArg,
  markTag,
  minuteArg,
  minuteBand,
  minuteCount,
  minuteGap,
  minuteQuarter,
  namedCompasses,
  namedRegionInitials,
  namedRegions,
  namedSpans,
  nextCue,
  ownerArg,
  ownerLabel,
  quarterCounts,
  readCueViews,
  readCues,
  readHiddenRegions,
  regionInitialArg,
  regionInitialOf,
  regionShare,
  regionText,
  regionsCsv,
  resetCues,
  setCueDone,
  setCueHeld,
  setCuePinned,
  spanArg,
  spanLines,
  spanOf,
  stepCueTone,
  toneArg,
  toneOf,
  toggleRegion,
  visibleCues,
  visibleRegionCustomers,
  visibleRegions,
  wingArg,
  wingOf,
} from "../src/lib/crmv4/round142";

function main() {
  assert.equal(cueText("  Call\nAda  "), "Call Ada");
  assert.equal(cueText("   "), "");
  assert.equal(cueText("x".repeat(120)).length, 72);
  assert.equal(ownerLabel("  North  "), "North");
  assert.equal(ownerLabel("   "), "");
  assert.equal(ownerLabel("y".repeat(40)).length, 16);
  assert.equal(markTag("  VIP  "), "VIP");
  assert.equal(markTag("   "), "");
  assert.equal(markTag("z".repeat(30)).length, 10);
  assert.equal(minuteCount(" 0 "), 0);
  assert.equal(minuteCount(0), 0);
  assert.equal(minuteCount(59), 59);
  assert.equal(minuteCount("7"), 7);
  assert.equal(minuteCount(""), null);
  assert.equal(minuteCount("00"), null);
  assert.equal(minuteCount(60), null);
  assert.equal(minuteCount(-1), null);
  assert.equal(wingOf(" NORTH "), "north");
  assert.equal(wingOf("south"), "south");
  assert.equal(wingOf("east"), "east");
  assert.equal(wingOf("west"), "west");
  assert.equal(wingOf(""), "blank");
  assert.equal(wingOf("up"), "blank");
  assert.equal(toneOf(" SHARP "), "sharp");
  assert.equal(toneOf("quiet"), "quiet");
  assert.equal(toneOf("warm"), "warm");
  assert.equal(toneOf(""), "blank");
  assert.equal(toneOf("loud"), "blank");
  assert.equal(minuteBand(null), "blank");
  assert.equal(minuteBand(0), "early");
  assert.equal(minuteBand(19), "early");
  assert.equal(minuteBand(20), "middle");
  assert.equal(minuteBand(39), "middle");
  assert.equal(minuteBand(40), "late");
  assert.equal(minuteBand(59), "late");
  assert.equal(minuteQuarter(null), "blank");
  assert.equal(minuteQuarter(0), "q1");
  assert.equal(minuteQuarter(14), "q1");
  assert.equal(minuteQuarter(15), "q2");
  assert.equal(minuteQuarter(29), "q2");
  assert.equal(minuteQuarter(30), "q3");
  assert.equal(minuteQuarter(44), "q3");
  assert.equal(minuteQuarter(45), "q4");
  assert.equal(minuteQuarter(59), "q4");
  assert.equal(minuteGap(3, 8), 5);
  assert.equal(minuteGap(8, 3), -5);
  assert.equal(minuteGap(0, 0), 0);
  assert.equal(minuteGap(null, 3), null);
  assert.equal(minuteGap(3, ""), null);
  assert.deepEqual(readCues([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Call Ada", owner: "  ", minute: 60, wing: "up", mark: "  ", tone: "loud", pinned: 1, done: 1, held: 1, audit: "nope" }, "nope"]), [
    { id: "2", text: "Call Ada", owner: "", minute: null, wing: "", mark: "", tone: "", pinned: false, done: false, held: false, audit: "" },
  ]);
  assert.equal(readCues([{ id: "z", text: "Zero", minute: 0 }])[0].minute, 0);
  const saved = addCue([], { id: "a", text: "Call Ada", owner: "Nia", minute: 0, wing: "north", mark: "VIP", tone: "warm" });
  assert.equal(saved[0].audit, "save");
  assert.equal(saved[0].minute, 0);
  assert.equal(saved[0].wing, "north");
  assert.equal(saved[0].tone, "warm");
  assert.equal(addCue(saved, { id: "b", text: "Call Ada" }).length, 1);
  assert.equal(addCue(saved, { id: "a", text: "Other" }).length, 1);
  assert.equal(addCue(saved, { id: "b", text: "   " }).length, 1);
  const raised = stepCueTone(saved, "a", 1);
  assert.equal(raised[0].tone, "sharp");
  assert.equal(raised[0].audit, "raise");
  assert.equal(stepCueTone(raised, "a", 1)[0].tone, "sharp");
  assert.equal(stepCueTone([{ ...saved[0], tone: "" }], "a", -1)[0].tone, "");
  const pinned = setCuePinned(saved, "a", true);
  assert.equal(pinned[0].pinned, true);
  assert.equal(pinned[0].audit, "pin");
  assert.equal(setCuePinned(pinned, "a", false)[0].audit, "unpin");
  const held = setCueHeld(saved, "a", true);
  assert.equal(held[0].held, true);
  assert.equal(held[0].audit, "hold");
  assert.equal(setCueHeld(held, "a", false)[0].audit, "release");
  const done = setCueDone(saved, "a", true);
  assert.equal(done[0].done, true);
  assert.equal(done[0].audit, "done");
  assert.equal(setCueDone(done, "a", false)[0].audit, "reopen");
  assert.equal(editCue(saved, "a", "  ")[0].text, "Call Ada");
  assert.equal(editCue(addCue(saved, { id: "b", text: "Other" }), "a", "Other").find((cue) => cue.id === "a")?.text, "Call Ada");
  assert.equal(editCue(saved, "a", "Ring Ada")[0].audit, "edit");
  const pair = addCue(saved, { id: "b", text: "Ring", minute: 10, wing: "north" });
  assert.equal(bulkCuePinned(pair, ["a", "b"], true).every((cue) => cue.pinned), true);
  assert.equal(bulkCueDone(pair, ["b"], true).find((cue) => cue.id === "b")?.done, true);
  assert.deepEqual(resetCues(), []);
  assert.equal(cueCopy("  Call Ada "), "Call Ada");
  assert.equal(cueCopy(" "), "");
  const open = visibleCues(pair, "open", "call", null, null, null, null, null, null, false, false, "");
  assert.equal(open.length, 1);
  assert.equal(open[0].id, "a");
  assert.equal(visibleCues(held, "held", "", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleCues(done, "done", "", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleCues(done, "open", "", null, null, null, null, null, null, false, false, "").length, 0);
  assert.equal(visibleCues(pair, "open", "", "", null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleCues(pair, "open", "", "Nia", "north", "VIP", "warm", 0, null, false, false, "").length, 1);
  assert.equal(visibleCues(pair, "open", "nia", null, null, null, null, null, null, false, false, "").length, 0);
  assert.equal(visibleCues(raised, "open", "", null, null, null, null, null, null, true, false, "").length, 1);
  assert.equal(visibleCues(saved, "open", "", null, null, null, null, null, null, true, false, "").length, 0);
  const late = visibleCues(pair, "open", "", null, null, null, null, null, null, false, true, 5);
  assert.equal(late.length, 1);
  assert.equal(late[0].id, "a");
  assert.equal(visibleCues(held, "open", "", null, null, null, null, null, null, false, true, 20).length, 0);
  assert.deepEqual(cueTimeline(pair, "").map((cue) => cue.id), ["a", "b"]);
  assert.deepEqual(cueTimeline(addCue(pair, { id: "c", text: "Blank" }), "").map((cue) => cue.minute === null).at(-1), true);
  const counts = cueCounts(addCue(pinned, { id: "b", text: "Later", minute: 40 }), 20);
  assert.equal(counts.open, 2);
  assert.equal(counts.pinned, 1);
  assert.equal(counts.late, 1);
  assert.equal(cueShare(1, 4), 25);
  assert.equal(cueShare(0, 0), 0);
  assert.deepEqual(cueOwners(saved), ["Nia"]);
  assert.deepEqual(cueMarks(saved), ["VIP"]);
  assert.deepEqual(cueWings(pair), ["north"]);
  assert.deepEqual(cueTones(saved), ["warm"]);
  assert.deepEqual(quarterCounts(pair), [2, 0, 0, 0]);
  assert.equal(activeOwner("gone", ["Nia"]), "all");
  assert.equal(activeOwner("blank", ["Nia"]), "blank");
  assert.equal(activeOwner("Nia", ["Nia"]), "Nia");
  assert.equal(ownerArg("blank"), "");
  assert.equal(ownerArg("all"), null);
  assert.equal(ownerArg("Nia"), "Nia");
  assert.equal(activeWing("up", ["north"]), "all");
  assert.equal(activeWing("north", ["north"]), "north");
  assert.equal(wingArg("blank"), "blank");
  assert.equal(wingArg("north"), "north");
  assert.equal(wingArg("nope"), null);
  assert.equal(activeMark("gone", ["VIP"]), "all");
  assert.equal(activeMark("VIP", ["VIP"]), "VIP");
  assert.equal(markArg("blank"), "");
  assert.equal(markArg("VIP"), "VIP");
  assert.equal(activeTone("loud", ["warm"]), "all");
  assert.equal(activeTone("warm", ["warm"]), "warm");
  assert.equal(toneArg("blank"), "blank");
  assert.equal(toneArg("sharp"), "sharp");
  assert.equal(toneArg("nope"), null);
  assert.equal(activeMinute("early"), "early");
  assert.equal(activeMinute("q4"), "q4");
  assert.equal(activeMinute("0"), "0");
  assert.equal(activeMinute("60"), "all");
  assert.deepEqual(minuteArg("0"), { exact: 0, band: null });
  assert.deepEqual(minuteArg("early"), { exact: null, band: "early" });
  assert.deepEqual(minuteArg("q2"), { exact: null, band: "q2" });
  assert.deepEqual(minuteArg("all"), { exact: null, band: null });
  const clash = addCue(pair, { id: "c", text: "Same", minute: 0, wing: "north" });
  assert.deepEqual(cueClashIds(clash, "a"), ["c"]);
  assert.deepEqual(cueClashIds(pair, "b"), []);
  assert.equal(nextCue(pair, 0), "a");
  assert.equal(nextCue(pair, 1), "b");
  assert.equal(nextCue(pair, 11), "a");
  assert.equal(nextCue(pair, ""), "");
  assert.equal(nextCue(done, 0), "");
  const csv = cuesCsv(saved, 15);
  assert.equal(csv.startsWith("text,owner,minute,wing,mark,tone,band,pinned,done,held,gap,audit\n"), true);
  assert.equal(csv.includes("0,north,VIP,warm,early"), true);
  assert.match(csv, /,15,save$/);
  const views = addCueView([], { id: "v", name: "Morning", tray: "open", query: "ada", owner: "Nia", wing: "north", mark: "VIP", tone: "warm", minute: "0" });
  assert.equal(views[0].minute, "0");
  assert.equal(addCueView(views, { id: "v2", name: "Morning", tray: "held", query: "", owner: "all", wing: "all", mark: "all", tone: "all", minute: "all" }).length, 1);
  assert.equal(readCueViews([{ id: "v", name: "Desk", tray: "nope", minute: "nope" }])[0].minute, "all");
  assert.equal(dropCueView(views, "v").length, 0);

  const rows = [
    { region: "Bavaria", label: "Ada" },
    { region: "North Rhine", label: "Bea" },
    { region: "North Rhine", label: "Gus" },
    { region: "Île-de-France", label: "Eve" },
    { region: "", label: "No" },
    { region: { lastRegion: "Central", lastCity: "Munich" }, label: "Blocked" },
    { region: { lastRegion: "West Bank" }, label: "Wes" },
  ];
  assert.equal(regionText("  Bavaria  "), "Bavaria");
  assert.equal(regionText({ lastRegion: "Bavaria" }), "Bavaria");
  assert.equal(regionText({ lastRegion: "Bavaria", address: "Lane" }), "");
  assert.equal(regionText({ lastRegion: "Bavaria", lastCity: "Munich" }), "");
  assert.equal(regionText({ lastCity: "Munich" }), "");
  assert.equal(compassOf("North Rhine"), "north");
  assert.equal(compassOf("South East"), "south");
  assert.equal(compassOf("East Bay"), "east");
  assert.equal(compassOf("West Bank"), "west");
  assert.equal(compassOf("Central"), "central");
  assert.equal(compassOf("Bavaria"), "other");
  assert.equal(compassOf(""), "");
  assert.equal(spanOf("Bavaria"), "short");
  assert.equal(spanOf("North Rhine"), "mid");
  assert.equal(spanOf("x".repeat(17)), "long");
  assert.equal(spanOf(""), "");
  assert.equal(regionInitialOf("Bavaria"), "B");
  assert.equal(regionInitialOf("Île-de-France"), "#");
  assert.equal(regionInitialOf(""), "");
  assert.equal(namedRegions(rows).includes("Bavaria"), true);
  assert.equal(namedRegions(rows).includes(""), false);
  assert.equal(leadingRegion(rows), "North Rhine");
  assert.equal(leadingCompass([{ region: "North" }, { region: "North" }, { region: "Bavaria" }]), "north");
  assert.equal(leadingSpan([{ region: "Bavaria" }, { region: "North Rhine" }]), "mid");
  assert.equal(leadingRegionInitial([{ region: "Oak" }, { region: "PO" }, { region: "" }]), "O");
  assert.equal(regionShare(1, 4), 25);
  assert.equal(regionShare(0, 4), 0);
  assert.deepEqual(readHiddenRegions(["Bavaria", "gone", "Bavaria"], ["Bavaria", "North Rhine"]), ["Bavaria"]);
  assert.deepEqual(toggleRegion(["Bavaria"], "North Rhine", ["Bavaria", "North Rhine"]), ["Bavaria", "North Rhine"]);
  assert.deepEqual(toggleRegion(["Bavaria"], "Bavaria", ["Bavaria"]), []);
  assert.deepEqual(visibleRegions(["Bavaria", "North Rhine"], ["North Rhine"], false), ["Bavaria"]);
  assert.deepEqual(visibleRegions(["Bavaria", "North Rhine"], ["North Rhine"], true), ["North Rhine"]);
  assert.equal(activeRegion("North Rhine", ["Bavaria"]), "");
  assert.equal(activeRegion("Bavaria", ["Bavaria"]), "Bavaria");
  assert.equal(activeCompass("missing", ["north"]), "all");
  assert.equal(activeCompass("blank", ["north"]), "blank");
  assert.equal(activeCompass("north", ["north"]), "north");
  assert.equal(compassArg("all"), null);
  assert.equal(compassArg("blank"), "");
  assert.equal(compassArg("west"), "west");
  assert.equal(compassArg("nope"), null);
  assert.equal(activeSpan("missing", ["short"]), "all");
  assert.equal(activeSpan("mid", ["mid"]), "mid");
  assert.equal(spanArg("blank"), "");
  assert.equal(spanArg("long"), "long");
  assert.equal(spanArg("nope"), null);
  assert.equal(activeRegionInitial("missing", ["B"]), "all");
  assert.equal(activeRegionInitial("#", ["#"]), "#");
  assert.equal(activeRegionInitial("#", ["B"]), "all");
  assert.equal(regionInitialArg("all"), null);
  assert.equal(regionInitialArg("blank"), "");
  assert.equal(regionInitialArg("#"), "#");
  assert.equal(regionInitialArg("b"), "B");
  const shown = visibleRegionCustomers(rows, "", false, "north", "mid", null, "gus");
  assert.equal(shown.length, 1);
  assert.equal(shown[0].label, "Gus");
  assert.equal(visibleRegionCustomers(rows, "", true, null, null, null, "blocked").length, 1);
  assert.equal(visibleRegionCustomers(rows, "Bavaria", false, null, null, null, "").length, 1);
  assert.equal(visibleRegionCustomers(rows, "", false, null, null, "#", "eve").length, 1);
  assert.equal(regionsCsv(rows).startsWith("region,compass,span,initial,count\n"), true);
  assert.equal(regionsCsv([]), "region,compass,span,initial,count");
  assert.equal(regionsCsv(rows).includes("amount"), false);
  assert.equal(spanLines(rows).some((line) => line.span === "short"), true);
  assert.equal(namedCompasses(rows).includes("north"), true);
  assert.equal(namedSpans(rows).includes("mid"), true);
  assert.equal(namedRegionInitials(rows).includes("#"), true);

  const copy = Object.keys(ROUND142_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND142_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "cueTitle"), "Cue cards");
  assert.equal(crmv4Text("tr", "rgnTitle"), ROUND142_COPY.tr.rgnTitle);
  assert.equal(crmv4Text("de", "cueOwner"), ROUND142_COPY.de.cueOwner);
  assert.equal(crmv4Text("ru", "rgnBlank"), ROUND142_COPY.ru.rgnBlank);
  assert.equal(crmv4Text("ar", "cueNotice"), ROUND142_COPY.ar.cueNotice);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-cue/);
  assert.match(css, /\.c4-region/);
  assert.match(css, /\.c4-pagehead-press/);
  assert.match(css, /\.c4-rail-press/);
  assert.match(css, /\.c4-pagehead-library/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round142.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("fetch("), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes("currency"), false);
  assert.equal(view.includes("balance"), false);
  assert.equal(view.includes("saleStatus"), false);
  assert.equal(view.includes("retentionStatus"), false);
  assert.equal(view.includes("potentialStatus"), false);
  assert.equal(view.includes("documentsStatus"), false);
  assert.equal(view.includes("accountType"), false);
  assert.equal(view.includes("validationStatus"), false);
  assert.match(view, /lastRegion/);
  assert.match(view, /cuesCsv/);
  assert.match(view, /regionsCsv/);
  assert.match(view, /Escape/);
  assert.match(view, /event\.key !== "\/"/);
  assert.match(view, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(view, /data-cue/);
  assert.match(view, /data-region/);
  assert.match(view, /data-logo="mono"/);
  assert.match(view, /customers/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "cues"/);
  assert.match(app, /view === "regions"/);
  assert.match(app, /c4-pagehead-press/);
  assert.match(app, /c4-rail-press/);
  assert.match(app, /c4-pagehead-library/);
  console.log("crmv4 round142 tests passed");
}

main();
