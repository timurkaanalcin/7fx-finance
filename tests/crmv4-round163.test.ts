/**
 * Wax follow-ups and follow-up lamps.
 * Run: npx tsx tests/crmv4-round163.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND163_COPY } from "../src/lib/crmv4/copy-round163";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeAge,
  activeBand,
  activeDay,
  activeHue,
  activeKeeper,
  activeMark,
  activePace,
  activeTag,
  activeWeekday,
  addWax,
  addWaxView,
  ageArg,
  ageOf,
  bandArg,
  bandOf,
  bulkWaxFiled,
  bulkWaxPinned,
  clashWaxCount,
  dayArg,
  dayOf,
  dropWaxView,
  editWax,
  followSpan,
  followStamp,
  halfOf,
  hueArg,
  hueOf,
  keeperArg,
  keeperLabel,
  keeperLoad,
  leadingBand,
  leadingDay,
  lampShare,
  lampsCsv,
  markArg,
  markOf,
  namedAges,
  namedBands,
  namedDays,
  nextWax,
  paceArg,
  paceOf,
  readHiddenDays,
  readWaxViews,
  readWaxes,
  resetWaxes,
  setWaxFiled,
  setWaxHeld,
  setWaxPinned,
  stepWaxPace,
  tagArg,
  toggleDay,
  visibleDays,
  visibleLampCustomers,
  visibleWaxes,
  watchOf,
  waxClashIds,
  waxCopy,
  waxCounts,
  waxGap,
  waxShare,
  waxTag,
  waxText,
  waxTimeline,
  waxesCsv,
  weekdayArg,
  weekdayOf,
} from "../src/lib/crmv4/round163";

const NOW = Date.parse("2026-11-10T12:00:00.000Z");

function main() {
  assert.equal(waxText("  Call\nAda  "), "Call Ada");
  assert.equal(waxText("   "), "");
  assert.equal(waxText("x".repeat(80)).length, 40);
  assert.equal(keeperLabel("  North  "), "North");
  assert.equal(keeperLabel("   "), "");
  assert.equal(keeperLabel("y".repeat(40)).length, 12);
  assert.equal(waxTag("  VIP  "), "VIP");
  assert.equal(waxTag("   "), "");
  assert.equal(waxTag("z".repeat(20)).length, 8);
  assert.equal(markOf(" 0 "), 0);
  assert.equal(markOf(0), 0);
  assert.equal(markOf("00"), 0);
  assert.equal(markOf("04"), 4);
  assert.equal(markOf("4"), 4);
  assert.equal(markOf(4), 4);
  assert.equal(markOf(""), null);
  assert.equal(markOf("05"), null);
  assert.equal(markOf("5"), null);
  assert.equal(markOf(5), null);
  assert.equal(markOf(-1), null);
  assert.equal(markOf(1.5), null);
  assert.equal(hueOf(" CHAMPAGNE "), "champagne");
  assert.equal(hueOf("graphite"), "graphite");
  assert.equal(hueOf("ivory"), "ivory");
  assert.equal(hueOf("soot"), "soot");
  assert.equal(hueOf(""), "blank");
  assert.equal(hueOf("gold"), "blank");
  assert.equal(paceOf(" STILL "), "still");
  assert.equal(paceOf("steady"), "steady");
  assert.equal(paceOf("swift"), "swift");
  assert.equal(paceOf(""), "blank");
  assert.equal(paceOf("gold"), "blank");
  assert.equal(watchOf(null), "blank");
  assert.equal(watchOf(0), "night");
  assert.equal(watchOf(1), "day");
  assert.equal(watchOf(2), "day");
  assert.equal(watchOf(3), "eve");
  assert.equal(watchOf(4), "eve");
  assert.equal(halfOf(null), "blank");
  assert.equal(halfOf(0), "early");
  assert.equal(halfOf(1), "early");
  assert.equal(halfOf(2), "late");
  assert.equal(halfOf(4), "late");
  assert.equal(waxGap(2, 4), 2);
  assert.equal(waxGap(4, 2), -2);
  assert.equal(waxGap(2, 2), 0);
  assert.equal(waxGap(null, 2), null);
  assert.equal(waxGap(2, ""), null);
  assert.equal(waxGap(2, 5), null);
  assert.deepEqual(readWaxes([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Call Ada", keeper: "  ", mark: 5, hue: "gold", tag: "  ", pace: "gold", pinned: 1, held: 1, filed: 1, audit: "nope" }, "nope"]), [
    { id: "2", text: "Call Ada", keeper: "", mark: null, hue: "", tag: "", pace: "", pinned: false, held: false, filed: false, audit: "" },
  ]);
  assert.equal(readWaxes([{ id: "z", text: "One", mark: 0 }])[0].mark, 0);
  assert.equal(readWaxes([{ id: "z", text: "One", mark: "04" }])[0].mark, 4);
  const saved = addWax([], { id: "a", text: "Call Ada", keeper: "Nia", mark: 2, hue: "champagne", tag: "VIP", pace: "still" });
  assert.equal(saved[0].audit, "save");
  assert.equal(saved[0].mark, 2);
  assert.equal(saved[0].hue, "champagne");
  assert.equal(saved[0].pace, "still");
  assert.equal(addWax(saved, { id: "b", text: "Call Ada" }).length, 1);
  assert.equal(addWax(saved, { id: "a", text: "Other" }).length, 1);
  assert.equal(addWax(saved, { id: "b", text: "   " }).length, 1);
  const full = Array.from({ length: 10 }, (_, index) => ({ id: `k${index}`, text: `Note ${index}`, keeper: "", mark: null, hue: "", tag: "", pace: "", pinned: false, held: false, filed: false, audit: "save" }));
  assert.equal(addWax(full, { id: "extra", text: "More" }).length, 10);
  assert.equal(addWax(full, { id: "extra", text: "More" })[0].id, "extra");
  assert.equal(stepWaxPace(saved, "a", 1)[0].pace, "steady");
  assert.equal(stepWaxPace(saved, "a", 1)[0].audit, "raise");
  assert.equal(stepWaxPace([{ ...saved[0], pace: "swift" }], "a", 1)[0].pace, "swift");
  assert.equal(stepWaxPace(saved, "a", -1)[0].pace, "");
  assert.equal(stepWaxPace(saved, "a", -1)[0].audit, "lower");
  assert.equal(setWaxPinned(saved, "a", true)[0].audit, "pin");
  assert.equal(setWaxPinned(saved, "a", false)[0].audit, "unpin");
  assert.equal(setWaxHeld(saved, "a", true)[0].audit, "hold");
  assert.equal(setWaxHeld(saved, "a", false)[0].audit, "release");
  assert.equal(setWaxFiled(saved, "a", true)[0].audit, "file");
  assert.equal(setWaxFiled(saved, "a", false)[0].audit, "unfile");
  assert.equal(editWax(saved, "a", "  Call back  ")[0].text, "Call back");
  assert.equal(editWax(saved, "a", "  Call back  ")[0].audit, "edit");
  assert.equal(editWax(saved, "a", "   ")[0].text, "Call Ada");
  const pair = addWax(saved, { id: "b", text: "Other" });
  assert.equal(editWax(pair, "b", "Call Ada").find((card) => card.id === "b")?.text, "Other");
  assert.equal(bulkWaxPinned(pair, ["a"], true).find((card) => card.id === "a")?.pinned, true);
  assert.equal(bulkWaxFiled(pair, ["b"], true).find((card) => card.id === "b")?.filed, true);
  assert.deepEqual(resetWaxes(), []);
  assert.equal(waxCopy("  Call Ada "), "Call Ada");
  assert.equal(waxCopy(" "), "");
  assert.equal(keeperLoad(saved, "Nia"), 1);
  assert.equal(keeperLoad(saved, "  "), 0);
  assert.equal(keeperLoad([{ ...saved[0], filed: true }], "Nia"), 0);
  const mixed = [
    { ...saved[0], id: "open", text: "Open", pace: "still", mark: 1, held: false, filed: false },
    { ...saved[0], id: "held", text: "Held", held: true, filed: false, pace: "steady", mark: 3 },
    { ...saved[0], id: "filed", text: "Filed", held: true, filed: true, pace: "swift", mark: 4 },
  ];
  assert.equal(visibleWaxes(mixed, "open", "", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleWaxes(mixed, "held", "", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleWaxes(mixed, "filed", "", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleWaxes(mixed, "open", "nope", null, null, null, null, null, null, false, false, "").length, 0);
  assert.equal(visibleWaxes(mixed, "open", "", "Nia", null, null, null, null, null, false, false, "")[0].id, "open");
  assert.equal(visibleWaxes(mixed, "filed", "", null, "champagne", "VIP", "swift", 4, null, false, false, "")[0].id, "filed");
  assert.equal(visibleWaxes(mixed, "open", "", null, null, null, null, null, "day", false, false, "")[0].id, "open");
  assert.equal(visibleWaxes(mixed, "held", "", null, null, null, null, null, "late", false, false, "")[0].id, "held");
  assert.equal(visibleWaxes(mixed, "filed", "", null, null, null, null, null, null, true, false, "")[0].id, "filed");
  assert.equal(waxCounts(mixed, 4).late, 1);
  assert.equal(waxCounts(mixed, 4).open, 1);
  assert.equal(waxShare(1, 4), 25);
  assert.equal(waxShare(0, 4), 0);
  assert.equal(waxShare(1, 0), 0);
  const line = waxTimeline(mixed, "");
  assert.deepEqual(line.map((card) => card.mark), [1, 3, 4]);
  assert.equal(activeKeeper("gone", ["Nia"]), "all");
  assert.equal(activeKeeper("blank", ["Nia"]), "blank");
  assert.equal(keeperArg("Nia"), "Nia");
  assert.equal(keeperArg("blank"), "");
  assert.equal(keeperArg("all"), null);
  assert.equal(activeHue("gone", ["champagne"]), "all");
  assert.equal(hueArg("champagne"), "champagne");
  assert.equal(hueArg("blank"), "blank");
  assert.equal(activeTag("gone", ["VIP"]), "all");
  assert.equal(tagArg("VIP"), "VIP");
  assert.equal(tagArg("blank"), "");
  assert.equal(activePace("gone", ["still"]), "all");
  assert.equal(paceArg("still"), "still");
  assert.equal(paceArg("blank"), "blank");
  assert.equal(activeMark("night"), "night");
  assert.equal(activeMark("early"), "early");
  assert.equal(activeMark("00"), "0");
  assert.equal(activeMark("05"), "all");
  assert.deepEqual(markArg("night"), { exact: null, watch: "night" });
  assert.deepEqual(markArg("0"), { exact: 0, watch: null });
  assert.deepEqual(markArg("all"), { exact: null, watch: null });
  const clash = addWax(saved, { id: "c", text: "Twin", hue: "champagne", keeper: "Nia" });
  assert.deepEqual(waxClashIds(clash, "a"), ["c"]);
  assert.equal(waxClashIds([{ ...saved[0], keeper: "" }], "a").length, 0);
  assert.equal(clashWaxCount(clash), 2);
  assert.equal(nextWax(mixed, 2), "open");
  assert.equal(nextWax(mixed, 0), "open");
  assert.equal(nextWax(mixed, 5), "");
  assert.equal(nextWax([{ ...mixed[0], mark: 4, pace: "steady" }], 2), "open");
  assert.equal(nextWax([{ ...mixed[2], filed: false, held: false }], 1), "");
  const csv = waxesCsv(saved, 4);
  assert.equal(csv.startsWith("note,keeper,mark,hue,tag,pace,watch,pinned,held,filed,gap,audit"), true);
  assert.equal(csv.includes("amount"), false);
  assert.equal(csv.includes(",2,"), true);
  const views = addWaxView([], { id: "v", name: "Night", tray: "open", query: "Ada", keeper: "Nia", hue: "champagne", tag: "VIP", pace: "still", mark: "night" });
  assert.equal(views[0].mark, "night");
  assert.equal(addWaxView(views, { id: "v2", name: "Night", tray: "open", query: "", keeper: "all", hue: "all", tag: "all", pace: "all", mark: "all" }).length, 1);
  assert.equal(dropWaxView(views, "v").length, 0);
  assert.equal(readWaxViews([{ id: "v", name: "Night", tray: "nope", mark: "05" }])[0].tray, "open");
  assert.equal(readWaxViews([{ id: "v", name: "Night", tray: "nope", mark: "05" }])[0].mark, "all");

  const dawn = "2026-11-08T02:00:00.000Z";
  const day = "2026-11-01T10:00:00.000Z";
  const dusk = "2026-10-01T20:00:00.000Z";
  assert.equal(bandOf(dawn), "morn");
  assert.equal(bandOf(day), "noon");
  assert.equal(bandOf(dusk), "eve");
  assert.equal(bandOf(""), "");
  assert.equal(bandOf("not-a-date"), "");
  assert.equal(bandOf({ name: "Ada", retentionFollowUpAt: dawn }), "");
  assert.equal(bandOf({ retentionFollowUpAt: dawn }), "morn");
  assert.equal(followStamp({ retentionFollowUpAt: dawn }), dawn);
  assert.equal(ageOf(dawn, NOW), "near");
  assert.equal(ageOf(day, NOW), "week");
  assert.equal(ageOf(dusk, NOW), "over");
  assert.equal(ageOf("2026-11-12T00:00:00.000Z", NOW), "near");
  assert.equal(ageOf("", NOW), "");
  assert.equal(followSpan(dawn, NOW), 2);
  assert.equal(followSpan("", NOW), null);
  assert.equal(weekdayOf(dawn), "sun");
  assert.equal(weekdayOf("2026-11-10T12:00:00.000Z"), "tue");
  assert.equal(weekdayOf(""), "");
  assert.equal(dayOf(dawn), "2026-11-08");
  assert.equal(dayOf(""), "");
  const rows = [
    { retentionFollowUpAt: dawn, label: "Ada North" },
    { retentionFollowUpAt: dawn, label: "Leo" },
    { retentionFollowUpAt: day, label: "Mina" },
    { retentionFollowUpAt: "", label: "Blank" },
  ];
  assert.equal(leadingDay(rows), "2026-11-08");
  assert.equal(leadingBand(rows), "morn");
  assert.deepEqual(namedBands(rows), ["morn", "noon"]);
  assert.ok(namedAges(rows, NOW).includes("near"));
  assert.ok(namedDays(rows).includes("2026-11-08"));
  assert.equal(lampShare(2, 4), 50);
  assert.equal(lampShare(0, 0), 0);
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
  assert.equal(activeBand("gone", ["morn"]), "all");
  assert.equal(bandArg("morn"), "morn");
  assert.equal(bandArg("blank"), "");
  assert.equal(activeAge("gone", ["near"]), "all");
  assert.equal(ageArg("near"), "near");
  assert.equal(ageArg("blank"), "");
  assert.equal(activeWeekday("gone", ["sun"]), "all");
  assert.equal(weekdayArg("sun"), "sun");
  assert.equal(weekdayArg("blank"), "");
  const shown = visibleLampCustomers(rows, "morn", null, null, null, "ada", NOW);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].label, "Ada North");
  assert.equal(visibleLampCustomers(rows, null, null, null, null, "2026", NOW).length, 0);
  const names = lampsCsv(rows, NOW);
  assert.equal(names.startsWith("kind,mark,count"), true);
  assert.equal(lampsCsv([], NOW), "kind,mark,count");
  assert.equal(names.includes("amount"), false);
  assert.equal(names.includes(",morn,"), true);
  assert.equal(names.includes(",2026-11-08,"), true);

  const copy = Object.keys(ROUND163_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND163_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "wxfTitle"), "Wax follow-ups");
  assert.equal(crmv4Text("tr", "flmTitle"), ROUND163_COPY.tr.flmTitle);
  assert.equal(crmv4Text("de", "wxfKeeper"), ROUND163_COPY.de.wxfKeeper);
  assert.equal(crmv4Text("ru", "flmUnmarked"), ROUND163_COPY.ru.flmUnmarked);
  assert.equal(crmv4Text("ar", "wxfNotice"), ROUND163_COPY.ar.wxfNotice);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-wxf/);
  assert.match(css, /\.c4-flm/);
  assert.match(css, /\.c4-logs-script/);
  assert.match(css, /\.c4-fresh-script/);
  assert.match(css, /\.c4-fresh-lacquer/);
  assert.match(css, /\.c4-pagehead-lacquer/);
  assert.match(css, /\.c4-support-lacquer/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round163.tsx"), "utf8");
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
  assert.equal(viewFile.includes("lastContactAt"), false);
  assert.match(viewFile, /retentionFollowUpAt/);
  assert.match(viewFile, /waxesCsv/);
  assert.match(viewFile, /lampsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "w"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-waxes/);
  assert.match(viewFile, /data-lamps/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "wax"/);
  assert.match(app, /view === "lamp"/);
  assert.match(app, /c4-pagehead-lacquer/);
  const fresh = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round4.tsx"), "utf8");
  assert.match(fresh, /c4-fresh-lacquer/);
  const support = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Support.tsx"), "utf8");
  assert.match(support, /c4-support-lacquer/);
  console.log("crmv4 round163 tests passed");
}

main();
