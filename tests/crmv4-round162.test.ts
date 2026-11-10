/**
 * Quill reminders and contact seals.
 * Run: npx tsx tests/crmv4-round162.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND162_COPY } from "../src/lib/crmv4/copy-round162";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeAge,
  activeBand,
  activeBell,
  activeDay,
  activeHue,
  activeKeeper,
  activePace,
  activeTag,
  activeWeekday,
  addQuill,
  addQuillView,
  ageArg,
  ageOf,
  bandArg,
  bandOf,
  bellArg,
  bellOf,
  bulkQuillPinned,
  bulkQuillSent,
  clashQuillCount,
  contactStamp,
  dayArg,
  dayOf,
  dropQuillView,
  editQuill,
  halfOf,
  hueArg,
  hueOf,
  keeperArg,
  keeperLabel,
  leadingBand,
  leadingDay,
  namedAges,
  namedBands,
  namedDays,
  nextQuill,
  paceArg,
  paceOf,
  quillClashIds,
  quillCopy,
  quillCounts,
  quillGap,
  quillShare,
  quillTag,
  quillTimeline,
  quillText,
  quillsCsv,
  readHiddenDays,
  readQuillViews,
  readQuills,
  resetQuills,
  sealShare,
  sealsCsv,
  setQuillKept,
  setQuillPinned,
  setQuillSent,
  stepQuillPace,
  tagArg,
  toggleDay,
  visibleDays,
  visibleQuills,
  visibleSealCustomers,
  watchOf,
  weekdayArg,
  weekdayOf,
} from "../src/lib/crmv4/round162";

const NOW = Date.parse("2026-11-10T12:00:00.000Z");

function main() {
  assert.equal(quillText("  Call\nAda  "), "Call Ada");
  assert.equal(quillText("   "), "");
  assert.equal(quillText("x".repeat(80)).length, 48);
  assert.equal(keeperLabel("  North  "), "North");
  assert.equal(keeperLabel("   "), "");
  assert.equal(keeperLabel("y".repeat(40)).length, 14);
  assert.equal(quillTag("  VIP  "), "VIP");
  assert.equal(quillTag("   "), "");
  assert.equal(quillTag("z".repeat(20)).length, 6);
  assert.equal(bellOf(" 0 "), 0);
  assert.equal(bellOf(0), 0);
  assert.equal(bellOf("00"), 0);
  assert.equal(bellOf("05"), 5);
  assert.equal(bellOf("5"), 5);
  assert.equal(bellOf(5), 5);
  assert.equal(bellOf(""), null);
  assert.equal(bellOf("06"), null);
  assert.equal(bellOf("6"), null);
  assert.equal(bellOf(6), null);
  assert.equal(bellOf(-1), null);
  assert.equal(bellOf(1.5), null);
  assert.equal(hueOf(" AMBER "), "amber");
  assert.equal(hueOf("slate"), "slate");
  assert.equal(hueOf("ivory"), "ivory");
  assert.equal(hueOf("ink"), "ink");
  assert.equal(hueOf(""), "blank");
  assert.equal(hueOf("gold"), "blank");
  assert.equal(paceOf(" SLOW "), "slow");
  assert.equal(paceOf("even"), "even");
  assert.equal(paceOf("brisk"), "brisk");
  assert.equal(paceOf(""), "blank");
  assert.equal(paceOf("gold"), "blank");
  assert.equal(watchOf(null), "blank");
  assert.equal(watchOf(0), "night");
  assert.equal(watchOf(1), "night");
  assert.equal(watchOf(2), "day");
  assert.equal(watchOf(3), "day");
  assert.equal(watchOf(4), "eve");
  assert.equal(watchOf(5), "eve");
  assert.equal(halfOf(null), "blank");
  assert.equal(halfOf(0), "early");
  assert.equal(halfOf(2), "early");
  assert.equal(halfOf(3), "late");
  assert.equal(halfOf(5), "late");
  assert.equal(quillGap(2, 4), 2);
  assert.equal(quillGap(4, 2), -2);
  assert.equal(quillGap(2, 2), 0);
  assert.equal(quillGap(null, 2), null);
  assert.equal(quillGap(2, ""), null);
  assert.equal(quillGap(2, 6), null);
  assert.deepEqual(readQuills([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Call Ada", keeper: "  ", bell: 6, hue: "gold", tag: "  ", pace: "gold", pinned: 1, kept: 1, sent: 1, audit: "nope" }, "nope"]), [
    { id: "2", text: "Call Ada", keeper: "", bell: null, hue: "", tag: "", pace: "", pinned: false, kept: false, sent: false, audit: "" },
  ]);
  assert.equal(readQuills([{ id: "z", text: "One", bell: 0 }])[0].bell, 0);
  assert.equal(readQuills([{ id: "z", text: "One", bell: "05" }])[0].bell, 5);
  const saved = addQuill([], { id: "a", text: "Call Ada", keeper: "Nia", bell: 2, hue: "amber", tag: "VIP", pace: "slow" });
  assert.equal(saved[0].audit, "save");
  assert.equal(saved[0].bell, 2);
  assert.equal(saved[0].hue, "amber");
  assert.equal(saved[0].pace, "slow");
  assert.equal(addQuill(saved, { id: "b", text: "Call Ada" }).length, 1);
  assert.equal(addQuill(saved, { id: "a", text: "Other" }).length, 1);
  assert.equal(addQuill(saved, { id: "b", text: "   " }).length, 1);
  const full = Array.from({ length: 12 }, (_, index) => ({ id: `k${index}`, text: `Note ${index}`, keeper: "", bell: null, hue: "", tag: "", pace: "", pinned: false, kept: false, sent: false, audit: "save" }));
  assert.equal(addQuill(full, { id: "extra", text: "More" }).length, 12);
  assert.equal(stepQuillPace(saved, "a", 1)[0].pace, "even");
  assert.equal(stepQuillPace(saved, "a", 1)[0].audit, "raise");
  assert.equal(stepQuillPace([{ ...saved[0], pace: "brisk" }], "a", 1)[0].pace, "brisk");
  assert.equal(stepQuillPace(saved, "a", -1)[0].pace, "");
  assert.equal(stepQuillPace(saved, "a", -1)[0].audit, "lower");
  assert.equal(setQuillPinned(saved, "a", true)[0].audit, "pin");
  assert.equal(setQuillPinned(saved, "a", false)[0].audit, "unpin");
  assert.equal(setQuillKept(saved, "a", true)[0].audit, "keep");
  assert.equal(setQuillKept(saved, "a", false)[0].audit, "release");
  assert.equal(setQuillSent(saved, "a", true)[0].audit, "send");
  assert.equal(setQuillSent(saved, "a", false)[0].audit, "recall");
  assert.equal(editQuill(saved, "a", "  Call back  ")[0].text, "Call back");
  assert.equal(editQuill(saved, "a", "  Call back  ")[0].audit, "edit");
  assert.equal(editQuill(saved, "a", "   ")[0].text, "Call Ada");
  const pair = addQuill(saved, { id: "b", text: "Other" });
  assert.equal(editQuill(pair, "b", "Call Ada").find((card) => card.id === "b")?.text, "Other");
  assert.equal(bulkQuillPinned(pair, ["a"], true).find((card) => card.id === "a")?.pinned, true);
  assert.equal(bulkQuillSent(pair, ["b"], true).find((card) => card.id === "b")?.sent, true);
  assert.deepEqual(resetQuills(), []);
  assert.equal(quillCopy("  Call Ada "), "Call Ada");
  assert.equal(quillCopy(" "), "");
  const mixed = [
    { ...saved[0], id: "open", text: "Open", pace: "slow", bell: 1, kept: false, sent: false },
    { ...saved[0], id: "kept", text: "Kept", kept: true, sent: false, pace: "even", bell: 3 },
    { ...saved[0], id: "sent", text: "Sent", kept: true, sent: true, pace: "brisk", bell: 5 },
  ];
  assert.equal(visibleQuills(mixed, "open", "", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleQuills(mixed, "kept", "", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleQuills(mixed, "sent", "", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleQuills(mixed, "open", "nope", null, null, null, null, null, null, false, false, "").length, 0);
  assert.equal(visibleQuills(mixed, "open", "", "Nia", null, null, null, null, null, false, false, "")[0].id, "open");
  assert.equal(visibleQuills(mixed, "sent", "", null, "amber", "VIP", "brisk", 5, null, false, false, "")[0].id, "sent");
  assert.equal(visibleQuills(mixed, "open", "", null, null, null, null, null, "night", false, false, "")[0].id, "open");
  assert.equal(visibleQuills(mixed, "kept", "", null, null, null, null, null, "late", false, false, "")[0].id, "kept");
  assert.equal(visibleQuills(mixed, "sent", "", null, null, null, null, null, null, true, false, "")[0].id, "sent");
  assert.equal(quillCounts(mixed, 4).late, 1);
  assert.equal(quillCounts(mixed, 4).open, 1);
  assert.equal(quillShare(1, 4), 25);
  assert.equal(quillShare(0, 4), 0);
  assert.equal(quillShare(1, 0), 0);
  const line = quillTimeline(mixed, "");
  assert.deepEqual(line.map((card) => card.bell), [1, 3, 5]);
  assert.equal(activeKeeper("gone", ["Nia"]), "all");
  assert.equal(activeKeeper("blank", ["Nia"]), "blank");
  assert.equal(keeperArg("Nia"), "Nia");
  assert.equal(keeperArg("blank"), "");
  assert.equal(keeperArg("all"), null);
  assert.equal(activeHue("gone", ["amber"]), "all");
  assert.equal(hueArg("amber"), "amber");
  assert.equal(hueArg("blank"), "blank");
  assert.equal(activeTag("gone", ["VIP"]), "all");
  assert.equal(tagArg("VIP"), "VIP");
  assert.equal(tagArg("blank"), "");
  assert.equal(activePace("gone", ["slow"]), "all");
  assert.equal(paceArg("slow"), "slow");
  assert.equal(paceArg("blank"), "blank");
  assert.equal(activeBell("night"), "night");
  assert.equal(activeBell("early"), "early");
  assert.equal(activeBell("00"), "0");
  assert.equal(activeBell("06"), "all");
  assert.deepEqual(bellArg("night"), { exact: null, watch: "night" });
  assert.deepEqual(bellArg("0"), { exact: 0, watch: null });
  assert.deepEqual(bellArg("all"), { exact: null, watch: null });
  const clash = addQuill(saved, { id: "c", text: "Twin", hue: "amber", tag: "VIP" });
  assert.deepEqual(quillClashIds(clash, "a"), ["c"]);
  assert.equal(quillClashIds([{ ...saved[0], tag: "" }], "a").length, 0);
  assert.equal(clashQuillCount(clash), 2);
  assert.equal(nextQuill(mixed, 2), "open");
  assert.equal(nextQuill(mixed, 0), "open");
  assert.equal(nextQuill(mixed, 6), "");
  assert.equal(nextQuill([{ ...mixed[0], bell: 4, pace: "even" }], 2), "open");
  assert.equal(nextQuill([{ ...mixed[2], sent: false, kept: false }], 1), "");
  const csv = quillsCsv(saved, 4);
  assert.equal(csv.startsWith("note,keeper,bell,hue,tag,pace,watch,pinned,kept,sent,gap,audit"), true);
  assert.equal(csv.includes("amount"), false);
  assert.equal(csv.includes(",2,"), true);
  const views = addQuillView([], { id: "v", name: "Night", tray: "open", query: "Ada", keeper: "Nia", hue: "amber", tag: "VIP", pace: "slow", bell: "night" });
  assert.equal(views[0].bell, "night");
  assert.equal(addQuillView(views, { id: "v2", name: "Night", tray: "open", query: "", keeper: "all", hue: "all", tag: "all", pace: "all", bell: "all" }).length, 1);
  assert.equal(dropQuillView(views, "v").length, 0);
  assert.equal(readQuillViews([{ id: "v", name: "Night", tray: "nope", bell: "06" }])[0].tray, "open");
  assert.equal(readQuillViews([{ id: "v", name: "Night", tray: "nope", bell: "06" }])[0].bell, "all");

  const dawn = "2026-11-08T02:00:00.000Z";
  const day = "2026-11-01T10:00:00.000Z";
  const dusk = "2026-10-01T20:00:00.000Z";
  assert.equal(bandOf(dawn), "dawn");
  assert.equal(bandOf(day), "day");
  assert.equal(bandOf(dusk), "dusk");
  assert.equal(bandOf(""), "");
  assert.equal(bandOf("not-a-date"), "");
  assert.equal(bandOf({ name: "Ada", lastContactAt: dawn }), "");
  assert.equal(bandOf({ lastContactAt: dawn }), "dawn");
  assert.equal(contactStamp({ lastContactAt: dawn }), dawn);
  assert.equal(ageOf(dawn, NOW), "fresh");
  assert.equal(ageOf(day, NOW), "quiet");
  assert.equal(ageOf(dusk, NOW), "cold");
  assert.equal(ageOf("2026-11-12T00:00:00.000Z", NOW), "fresh");
  assert.equal(ageOf("", NOW), "");
  assert.equal(weekdayOf(dawn), "sun");
  assert.equal(weekdayOf("2026-11-10T12:00:00.000Z"), "tue");
  assert.equal(weekdayOf(""), "");
  assert.equal(dayOf(dawn), "2026-11-08");
  assert.equal(dayOf(""), "");
  const rows = [
    { lastContactAt: dawn, label: "Ada North" },
    { lastContactAt: dawn, label: "Leo" },
    { lastContactAt: day, label: "Mina" },
    { lastContactAt: "", label: "Blank" },
  ];
  assert.equal(leadingDay(rows), "2026-11-08");
  assert.equal(leadingBand(rows), "dawn");
  assert.deepEqual(namedBands(rows), ["dawn", "day"]);
  assert.ok(namedAges(rows, NOW).includes("fresh"));
  assert.ok(namedDays(rows).includes("2026-11-08"));
  assert.equal(sealShare(2, 4), 50);
  assert.equal(sealShare(0, 0), 0);
  assert.deepEqual(readHiddenDays(["nope", dawn, dawn], ["2026-11-08"]), ["2026-11-08"]);
  assert.deepEqual(toggleDay([], dawn, ["2026-11-08"]), ["2026-11-08"]);
  assert.deepEqual(toggleDay(["2026-11-08"], dawn, ["2026-11-08"]), []);
  assert.deepEqual(visibleDays(["2026-11-08", "2026-11-01"], ["2026-11-08"], false), ["2026-11-01"]);
  assert.deepEqual(visibleDays(["2026-11-08", "2026-11-01"], ["2026-11-08"], true), ["2026-11-08"]);
  assert.equal(activeDay("gone", ["2026-11-08"]), "all");
  assert.equal(activeDay("blank", ["2026-11-08"]), "blank");
  assert.equal(dayArg("2026-11-08"), "2026-11-08");
  assert.equal(dayArg("blank"), "");
  assert.equal(dayArg("all"), null);
  assert.equal(activeBand("gone", ["dawn"]), "all");
  assert.equal(bandArg("dawn"), "dawn");
  assert.equal(bandArg("blank"), "");
  assert.equal(activeAge("gone", ["fresh"]), "all");
  assert.equal(ageArg("fresh"), "fresh");
  assert.equal(ageArg("blank"), "");
  assert.equal(activeWeekday("gone", ["sun"]), "all");
  assert.equal(weekdayArg("sun"), "sun");
  assert.equal(weekdayArg("blank"), "");
  const shown = visibleSealCustomers(rows, "dawn", null, null, null, "ada", NOW);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].label, "Ada North");
  assert.equal(visibleSealCustomers(rows, null, null, null, null, "2026", NOW).length, 0);
  const names = sealsCsv(rows, NOW);
  assert.equal(names.startsWith("kind,mark,count"), true);
  assert.equal(sealsCsv([], NOW), "kind,mark,count");
  assert.equal(names.includes("amount"), false);
  assert.equal(names.includes(",dawn,"), true);
  assert.equal(names.includes(",2026-11-08,"), true);

  const copy = Object.keys(ROUND162_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND162_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "qllTitle"), "Quill reminders");
  assert.equal(crmv4Text("tr", "aslTitle"), ROUND162_COPY.tr.aslTitle);
  assert.equal(crmv4Text("de", "qllKeeper"), ROUND162_COPY.de.qllKeeper);
  assert.equal(crmv4Text("ru", "aslUnmarked"), ROUND162_COPY.ru.aslUnmarked);
  assert.equal(crmv4Text("ar", "qllNotice"), ROUND162_COPY.ar.qllNotice);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-qll/);
  assert.match(css, /\.c4-asl/);
  assert.match(css, /\.c4-logs-script/);
  assert.match(css, /\.c4-fresh-script/);
  assert.match(css, /\.c4-pagehead-inkwell/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round162.tsx"), "utf8");
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
  assert.match(viewFile, /lastContactAt/);
  assert.match(viewFile, /quillsCsv/);
  assert.match(viewFile, /sealsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "q"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-quills/);
  assert.match(viewFile, /data-seals/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "quill"/);
  assert.match(app, /view === "seal"/);
  assert.match(app, /c4-pagehead-inkwell/);
  const logs = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Logs.tsx"), "utf8");
  assert.match(logs, /c4-logs-script/);
  assert.match(logs, /c4-log-line/);
  const fresh = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round4.tsx"), "utf8");
  assert.match(fresh, /c4-fresh-crest/);
  assert.match(fresh, /c4-fresh-script/);
  console.log("crmv4 round162 tests passed");
}

main();
