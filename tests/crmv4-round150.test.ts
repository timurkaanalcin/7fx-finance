/**
 * Shift briefings and spoken languages.
 * Run: npx tsx tests/crmv4-round150.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND150_COPY } from "../src/lib/crmv4/copy-round150";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeLetter,
  activeQuarter,
  activeRibbon,
  activeRoom,
  activeScript,
  activeSteward,
  activeTone,
  activeTongue,
  addBriefing,
  addBriefingView,
  briefingClashIds,
  briefingCopy,
  briefingCounts,
  briefingRibbons,
  briefingRooms,
  briefingShare,
  briefingStewards,
  briefingText,
  briefingTimeline,
  briefingTones,
  briefingsCsv,
  bulkBriefingPinned,
  bulkBriefingSealed,
  dropBriefingView,
  editBriefing,
  leadingScript,
  leadingTongue,
  letterArg,
  letterOf,
  lexiconCsv,
  lexiconShare,
  namedLetters,
  namedScripts,
  namedTongues,
  nextBriefing,
  quarterArg,
  quarterBand,
  quarterCounts,
  quarterGap,
  quarterOf,
  quarterPair,
  readBriefingViews,
  readBriefings,
  readHiddenTongues,
  resetBriefings,
  ribbonArg,
  ribbonMark,
  roomArg,
  roomOf,
  scriptArg,
  scriptOf,
  setBriefingParked,
  setBriefingPinned,
  setBriefingSealed,
  spokenTongue,
  spentOf,
  stepBriefingTone,
  stewardArg,
  stewardLabel,
  toneArg,
  toneOf,
  tongueArg,
  toggleTongue,
  visibleBriefings,
  visibleLexiconCustomers,
  visibleTongues,
} from "../src/lib/crmv4/round150";

function main() {
  assert.equal(briefingText("  Call\nAda  "), "Call Ada");
  assert.equal(briefingText("   "), "");
  assert.equal(briefingText("x".repeat(120)).length, 72);
  assert.equal(stewardLabel("  North  "), "North");
  assert.equal(stewardLabel("   "), "");
  assert.equal(stewardLabel("y".repeat(40)).length, 16);
  assert.equal(ribbonMark("  VIP  "), "VIP");
  assert.equal(ribbonMark("   "), "");
  assert.equal(ribbonMark("z".repeat(30)).length, 10);
  assert.equal(quarterOf(" 1 "), 1);
  assert.equal(quarterOf(1), 1);
  assert.equal(quarterOf("4"), 4);
  assert.equal(quarterOf(4), 4);
  assert.equal(quarterOf(""), null);
  assert.equal(quarterOf("0"), null);
  assert.equal(quarterOf(0), null);
  assert.equal(quarterOf("5"), null);
  assert.equal(quarterOf(5), null);
  assert.equal(quarterOf("01"), null);
  assert.equal(spentOf(" 40 "), 40);
  assert.equal(spentOf(0), 0);
  assert.equal(spentOf("0"), 0);
  assert.equal(spentOf(240), 240);
  assert.equal(spentOf("240"), 240);
  assert.equal(spentOf(""), null);
  assert.equal(spentOf("040"), null);
  assert.equal(spentOf(241), null);
  assert.equal(spentOf(-1), null);
  assert.equal(spentOf(1.5), null);
  assert.equal(roomOf(" SALON "), "salon");
  assert.equal(roomOf("desk"), "desk");
  assert.equal(roomOf("floor"), "floor");
  assert.equal(roomOf("line"), "line");
  assert.equal(roomOf(""), "blank");
  assert.equal(roomOf("pit"), "blank");
  assert.equal(toneOf(" HUSH "), "hush");
  assert.equal(toneOf("even"), "even");
  assert.equal(toneOf("sharp"), "sharp");
  assert.equal(toneOf(""), "blank");
  assert.equal(toneOf("gold"), "blank");
  assert.equal(quarterBand(null), "blank");
  assert.equal(quarterBand(1), "early");
  assert.equal(quarterBand(2), "early");
  assert.equal(quarterBand(3), "late");
  assert.equal(quarterBand(4), "late");
  assert.equal(quarterPair(null), "blank");
  assert.equal(quarterPair(1), "odd");
  assert.equal(quarterPair(2), "even");
  assert.equal(quarterPair(3), "odd");
  assert.equal(quarterPair(4), "even");
  assert.equal(quarterGap(1, 40), 25);
  assert.equal(quarterGap(4, 40), -20);
  assert.equal(quarterGap(2, 30), 0);
  assert.equal(quarterGap(null, 40), null);
  assert.equal(quarterGap(1, ""), null);
  assert.equal(quarterGap(1, 241), null);
  assert.deepEqual(readBriefings([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Call Ada", steward: "  ", quarter: 5, room: "pit", ribbon: "  ", tone: "gold", pinned: 1, sealed: 1, parked: 1, audit: "nope" }, "nope"]), [
    { id: "2", text: "Call Ada", steward: "", quarter: null, room: "", ribbon: "", tone: "", pinned: false, sealed: false, parked: false, audit: "" },
  ]);
  assert.equal(readBriefings([{ id: "z", text: "One", quarter: 1 }])[0].quarter, 1);
  assert.equal(readBriefings([{ id: "z", text: "One", quarter: 0 }])[0].quarter, null);
  const saved = addBriefing([], { id: "a", text: "Call Ada", steward: "Nia", quarter: 1, room: "salon", ribbon: "VIP", tone: "hush" });
  assert.equal(saved[0].audit, "save");
  assert.equal(saved[0].quarter, 1);
  assert.equal(saved[0].room, "salon");
  assert.equal(saved[0].tone, "hush");
  assert.equal(addBriefing(saved, { id: "b", text: "Call Ada" }).length, 1);
  assert.equal(addBriefing(saved, { id: "a", text: "Other" }).length, 1);
  assert.equal(addBriefing(saved, { id: "b", text: "   " }).length, 1);
  const raised = stepBriefingTone(saved, "a", 1);
  assert.equal(raised[0].tone, "even");
  assert.equal(raised[0].audit, "raise");
  assert.equal(stepBriefingTone(raised, "a", 1)[0].tone, "sharp");
  assert.equal(stepBriefingTone([{ ...saved[0], tone: "sharp" }], "a", 1)[0].tone, "sharp");
  assert.equal(stepBriefingTone([{ ...saved[0], tone: "" }], "a", -1)[0].tone, "");
  const pinned = setBriefingPinned(saved, "a", true);
  assert.equal(pinned[0].pinned, true);
  assert.equal(pinned[0].audit, "pin");
  assert.equal(setBriefingPinned(pinned, "a", false)[0].audit, "unpin");
  const parked = setBriefingParked(saved, "a", true);
  assert.equal(parked[0].parked, true);
  assert.equal(parked[0].audit, "park");
  const sealed = setBriefingSealed(saved, "a", true);
  assert.equal(sealed[0].sealed, true);
  assert.equal(sealed[0].audit, "seal");
  assert.equal(setBriefingSealed(sealed, "a", false)[0].audit, "reopen");
  const edited = editBriefing(saved, "a", "Call Bea");
  assert.equal(edited[0].text, "Call Bea");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editBriefing(saved, "a", "  ")[0].text, "Call Ada");
  const pair = addBriefing(saved, { id: "b", text: "Later", quarter: 4, room: "line" });
  assert.equal(editBriefing(pair, "b", "Call Ada")[0].text, "Later");
  const bulkPin = bulkBriefingPinned(pair, ["b", ""], true);
  assert.equal(bulkPin[0].pinned, true);
  assert.equal(bulkPin[1].pinned, false);
  assert.equal(bulkBriefingSealed(pair, ["a"], true)[1].sealed, true);
  assert.deepEqual(resetBriefings(), []);
  assert.equal(briefingCopy("  Call Ada "), "Call Ada");
  assert.equal(briefingCopy(" "), "");
  const shown = visibleBriefings(pair, "open", "ada", null, null, null, null, null, null, false, false, 40);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].id, "a");
  assert.equal(visibleBriefings(pair, "open", "nia", null, null, null, null, null, null, false, false, 40).length, 0);
  assert.equal(visibleBriefings(parked, "parked", "", null, null, null, null, null, null, false, false, 40).length, 1);
  assert.equal(visibleBriefings(sealed, "open", "", null, null, null, null, null, null, false, false, 40).length, 0);
  assert.equal(visibleBriefings(pair, "open", "", "Nia", "salon", "VIP", "hush", 1, null, false, false, 40).length, 1);
  assert.equal(visibleBriefings(pair, "open", "", null, null, null, null, null, "early", false, false, 40).length, 1);
  assert.equal(visibleBriefings(pair, "open", "", null, null, null, null, null, "even", false, false, 40).length, 1);
  assert.equal(visibleBriefings(raised, "open", "", null, null, null, null, null, null, true, false, 40).length, 0);
  assert.equal(visibleBriefings(stepBriefingTone(raised, "a", 1), "open", "", null, null, null, null, null, null, true, false, 40).length, 1);
  assert.equal(visibleBriefings(pair, "open", "", null, null, null, null, null, null, false, true, 40).length, 1);
  assert.deepEqual(briefingTimeline(pair, "").map((card) => card.id), ["a", "b"]);
  assert.deepEqual(briefingTimeline(addBriefing(pair, { id: "c", text: "Blank" }), "").map((card) => card.quarter === null).at(-1), true);
  const counts = briefingCounts(addBriefing(pinned, { id: "b", text: "Later", quarter: 4 }), 40);
  assert.equal(counts.open, 2);
  assert.equal(counts.pinned, 1);
  assert.equal(counts.late, 1);
  assert.equal(briefingShare(1, 4), 25);
  assert.equal(briefingShare(0, 0), 0);
  assert.deepEqual(briefingStewards(saved), ["Nia"]);
  assert.deepEqual(briefingRibbons(saved), ["VIP"]);
  assert.deepEqual(briefingRooms(pair), ["salon", "line"]);
  assert.deepEqual(briefingTones(saved), ["hush"]);
  assert.deepEqual(quarterCounts(pair), [1, 0, 0, 1]);
  assert.equal(activeSteward("missing", ["Nia"]), "all");
  assert.equal(activeSteward("blank", ["Nia"]), "blank");
  assert.equal(activeSteward("Nia", ["Nia"]), "Nia");
  assert.equal(stewardArg("all"), null);
  assert.equal(stewardArg("blank"), "");
  assert.equal(stewardArg("Nia"), "Nia");
  assert.equal(activeRoom("missing", ["salon"]), "all");
  assert.equal(activeRoom("salon", ["salon"]), "salon");
  assert.equal(roomArg("blank"), "blank");
  assert.equal(roomArg("line"), "line");
  assert.equal(roomArg("pit"), null);
  assert.equal(activeRibbon("missing", ["VIP"]), "all");
  assert.equal(activeRibbon("VIP", ["VIP"]), "VIP");
  assert.equal(ribbonArg("blank"), "");
  assert.equal(ribbonArg("VIP"), "VIP");
  assert.equal(activeTone("gone", ["hush"]), "all");
  assert.equal(activeTone("sharp", ["sharp"]), "sharp");
  assert.equal(toneArg("blank"), "blank");
  assert.equal(toneArg("even"), "even");
  assert.equal(toneArg("gold"), null);
  assert.equal(activeQuarter("missing"), "all");
  assert.equal(activeQuarter("blank"), "blank");
  assert.equal(activeQuarter("early"), "early");
  assert.equal(activeQuarter("1"), "1");
  assert.equal(activeQuarter("5"), "all");
  assert.deepEqual(quarterArg("odd"), { exact: null, band: "odd" });
  assert.deepEqual(quarterArg("2"), { exact: 2, band: null });
  assert.deepEqual(quarterArg("nope"), { exact: null, band: null });
  const clash = addBriefing(pair, { id: "c", text: "Same", quarter: 1, room: "salon" });
  assert.deepEqual(briefingClashIds(clash, "a"), ["c"]);
  assert.deepEqual(briefingClashIds(addBriefing(saved, { id: "d", text: "Open room" }), "a"), []);
  assert.equal(nextBriefing(pair, 40), "b");
  assert.equal(nextBriefing(pair, 60), "b");
  assert.equal(nextBriefing(pair, 61), "a");
  assert.equal(nextBriefing(pair, ""), "");
  const csv = briefingsCsv(saved, 40);
  assert.equal(csv.startsWith("note,steward,quarter,room,ribbon,tone,band,pinned,parked,sealed,gap,audit\n"), true);
  assert.equal(csv.includes("Nia"), true);
  assert.equal(csv.includes("amount"), false);
  const view = addBriefingView([], { id: "v", name: "Morning", tray: "open", query: "ada", steward: "Nia", room: "salon", ribbon: "VIP", tone: "hush", quarter: "1" });
  assert.equal(view[0].quarter, "1");
  assert.equal(addBriefingView(view, { id: "v2", name: "Morning", tray: "open", query: "", steward: "all", room: "all", ribbon: "all", tone: "all", quarter: "all" }).length, 1);
  assert.equal(dropBriefingView(view, "v").length, 0);
  assert.equal(readBriefingViews([{ id: "v", name: "  " }]).length, 0);

  assert.equal(spokenTongue(" Turkish "), "tr");
  assert.equal(spokenTongue("tr-TR"), "tr");
  assert.equal(spokenTongue("en_US"), "en");
  assert.equal(spokenTongue(" DE-at "), "de");
  assert.equal(spokenTongue("русский"), "ru");
  assert.equal(spokenTongue("العربية"), "ar");
  assert.equal(spokenTongue("Français"), "fr");
  assert.equal(spokenTongue("es"), "other");
  assert.equal(spokenTongue(""), "");
  assert.equal(spokenTongue("123"), "");
  assert.equal(spokenTongue("nope"), "other");
  assert.equal(spokenTongue({ language: "de" }), "de");
  assert.equal(spokenTongue({ language: "de", name: "Ada" }), "");
  assert.equal(spokenTongue({ language: "de", email: "a@b.c" }), "");
  assert.equal(scriptOf("en"), "latin");
  assert.equal(scriptOf("ru"), "cyrillic");
  assert.equal(scriptOf("ar"), "arabic");
  assert.equal(scriptOf("es"), "other");
  assert.equal(scriptOf(""), "");
  assert.equal(letterOf("en"), "e");
  assert.equal(letterOf("other"), "o");
  assert.equal(letterOf(""), "");
  const rows = [
    { label: "Ada", language: "tr" },
    { label: "Wes", language: "tr-TR" },
    { label: "Bea", language: "en" },
    { label: "Cid", language: "" },
    { label: "Blocked", language: { language: "de", name: "x" } },
  ];
  assert.equal(namedTongues(rows).includes("tr"), true);
  assert.equal(namedTongues(rows).includes("en"), true);
  assert.deepEqual(namedScripts(rows), ["latin"]);
  assert.deepEqual(namedLetters(rows), ["e", "t"]);
  assert.equal(leadingTongue(rows), "tr");
  assert.equal(leadingScript(rows), "latin");
  assert.equal(lexiconShare(1, 4), 25);
  assert.equal(lexiconShare(0, 0), 0);
  assert.deepEqual(readHiddenTongues(["tr", "pirate", "en"], ["tr"]), ["tr"]);
  assert.deepEqual(toggleTongue(["tr"], "tr", ["tr", "en"]), []);
  assert.deepEqual(toggleTongue([], "en", ["en"]), ["en"]);
  assert.deepEqual(visibleTongues(["en", "tr"], ["en"], false), ["tr"]);
  assert.deepEqual(visibleTongues(["en", "tr"], ["en"], true), ["en"]);
  assert.equal(activeTongue("missing", ["tr"]), "all");
  assert.equal(activeTongue("blank", ["tr"]), "blank");
  assert.equal(activeTongue("tr", ["tr"]), "tr");
  assert.equal(tongueArg("all"), null);
  assert.equal(tongueArg("blank"), "");
  assert.equal(tongueArg("en"), "en");
  assert.equal(tongueArg("nope"), null);
  assert.equal(activeScript("gone", ["latin"]), "all");
  assert.equal(activeScript("latin", ["latin"]), "latin");
  assert.equal(scriptArg("blank"), "");
  assert.equal(scriptArg("latin"), "latin");
  assert.equal(scriptArg("nope"), null);
  assert.equal(activeLetter("z", ["e"]), "all");
  assert.equal(activeLetter("e", ["e"]), "e");
  assert.equal(letterArg("all"), null);
  assert.equal(letterArg("e"), "e");
  assert.equal(letterArg("nope"), null);
  const visible = visibleLexiconCustomers(rows, "tr", null, "t", "ada");
  assert.equal(visible.length, 1);
  assert.equal(visible[0].label, "Ada");
  assert.equal(visibleLexiconCustomers(rows, "", null, null, "blocked").length, 1);
  assert.equal(visibleLexiconCustomers(rows, null, null, null, "tr").length, 0);
  assert.equal(visibleLexiconCustomers(rows, "", null, null, "").length, 2);
  assert.equal(lexiconCsv(rows).startsWith("kind,mark,count\n"), true);
  assert.equal(lexiconCsv([]), "kind,mark,count");
  assert.equal(lexiconCsv(rows).includes("amount"), false);
  assert.equal(lexiconCsv(rows).includes("tr"), true);

  const copy = Object.keys(ROUND150_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND150_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "brfTitle"), "Shift briefings");
  assert.equal(crmv4Text("tr", "lexTitle"), ROUND150_COPY.tr.lexTitle);
  assert.equal(crmv4Text("de", "brfSteward"), ROUND150_COPY.de.brfSteward);
  assert.equal(crmv4Text("ru", "lexUnmarked"), ROUND150_COPY.ru.lexUnmarked);
  assert.equal(crmv4Text("ar", "brfNotice"), ROUND150_COPY.ar.brfNotice);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-brf/);
  assert.match(css, /\.c4-lex/);
  assert.match(css, /\.c4-pagehead-briefing/);
  assert.match(css, /\.c4-rail-briefing/);
  assert.match(css, /\.c4-pagehead-promise/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round150.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.equal(viewFile.includes("saleStatus"), false);
  assert.equal(viewFile.includes("retentionStatus"), false);
  assert.equal(viewFile.includes("potentialStatus"), false);
  assert.equal(viewFile.includes("documentsStatus"), false);
  assert.equal(viewFile.includes("accountType"), false);
  assert.equal(viewFile.includes("validationStatus"), false);
  assert.equal(viewFile.includes("registrationDate"), false);
  assert.equal(viewFile.includes("birthDate"), false);
  assert.match(viewFile, /language/);
  assert.match(viewFile, /briefingsCsv/);
  assert.match(viewFile, /lexiconCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "b"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-briefing/);
  assert.match(viewFile, /data-lexicon/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "briefing"/);
  assert.match(app, /view === "lexicon"/);
  assert.match(app, /c4-pagehead-briefing/);
  assert.match(app, /c4-rail-briefing/);
  assert.match(app, /c4-pagehead-promise/);
  console.log("crmv4 round150 tests passed");
}

main();
