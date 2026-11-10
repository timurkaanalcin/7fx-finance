/**
 * Quire leaves and courtesy ranks.
 * Run: npx tsx tests/crmv4-round148.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND148_COPY } from "../src/lib/crmv4/copy-round148";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeDay,
  activeInitial,
  activeRank,
  activeRibbon,
  activeScribe,
  activeShelf,
  activeTitle,
  activeWeight,
  addQuire,
  addQuireView,
  bulkQuireFiled,
  bulkQuireStarred,
  courtesyCsv,
  courtesyShare,
  dayArg,
  dayBand,
  dayCount,
  dayCounts,
  dayGap,
  dayKind,
  dropQuireView,
  editQuire,
  initialArg,
  leadingRank,
  leadingTitle,
  namedInitials,
  namedRanks,
  namedTitles,
  nextQuire,
  quireClashIds,
  quireCopy,
  quireCounts,
  quireRibbons,
  quireScribes,
  quireShare,
  quireShelves,
  quireText,
  quireTimeline,
  quireWeights,
  quiresCsv,
  rankArg,
  rankLines,
  rankOf,
  readHiddenTitles,
  readQuireViews,
  readQuires,
  resetQuires,
  ribbonArg,
  ribbonMark,
  scribeArg,
  scribeLabel,
  setQuireFiled,
  setQuireFolded,
  setQuireStarred,
  shelfArg,
  shelfOf,
  stepQuireWeight,
  titleArg,
  titleLines,
  titleOf,
  toggleTitle,
  visibleCourtesyCustomers,
  visibleQuires,
  visibleTitles,
  weightArg,
  weightOf,
} from "../src/lib/crmv4/round148";

function main() {
  assert.equal(quireText("  Call\nAda  "), "Call Ada");
  assert.equal(quireText("   "), "");
  assert.equal(quireText("x".repeat(120)).length, 80);
  assert.equal(scribeLabel("  North  "), "North");
  assert.equal(scribeLabel("   "), "");
  assert.equal(scribeLabel("y".repeat(40)).length, 18);
  assert.equal(ribbonMark("  VIP  "), "VIP");
  assert.equal(ribbonMark("   "), "");
  assert.equal(ribbonMark("z".repeat(30)).length, 12);
  assert.equal(dayCount(" 1 "), 1);
  assert.equal(dayCount(1), 1);
  assert.equal(dayCount("01"), 1);
  assert.equal(dayCount("07"), 7);
  assert.equal(dayCount(7), 7);
  assert.equal(dayCount(""), null);
  assert.equal(dayCount("0"), null);
  assert.equal(dayCount(0), null);
  assert.equal(dayCount("8"), null);
  assert.equal(dayCount(8), null);
  assert.equal(dayCount(-1), null);
  assert.equal(dayCount(1.5), null);
  assert.equal(shelfOf(" DESK "), "desk");
  assert.equal(shelfOf("floor"), "floor");
  assert.equal(shelfOf("vault"), "vault");
  assert.equal(shelfOf(""), "blank");
  assert.equal(shelfOf("pit"), "blank");
  assert.equal(weightOf(" LIGHT "), "light");
  assert.equal(weightOf("steady"), "steady");
  assert.equal(weightOf("heavy"), "heavy");
  assert.equal(weightOf(""), "blank");
  assert.equal(weightOf("gold"), "blank");
  assert.equal(dayBand(null), "blank");
  assert.equal(dayBand(1), "early");
  assert.equal(dayBand(3), "early");
  assert.equal(dayBand(4), "late");
  assert.equal(dayBand(7), "late");
  assert.equal(dayKind(null), "blank");
  assert.equal(dayKind(1), "weekday");
  assert.equal(dayKind(5), "weekday");
  assert.equal(dayKind(6), "weekend");
  assert.equal(dayKind(7), "weekend");
  assert.equal(dayGap(1, 4), 3);
  assert.equal(dayGap(7, 1), -6);
  assert.equal(dayGap(2, 2), 0);
  assert.equal(dayGap(null, 3), null);
  assert.equal(dayGap(3, ""), null);
  assert.deepEqual(readQuires([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Call Ada", scribe: "  ", day: 8, shelf: "pit", ribbon: "  ", weight: "gold", starred: 1, filed: 1, folded: 1, audit: "nope" }, "nope"]), [
    { id: "2", text: "Call Ada", scribe: "", day: null, shelf: "", ribbon: "", weight: "", starred: false, filed: false, folded: false, audit: "" },
  ]);
  assert.equal(readQuires([{ id: "z", text: "One", day: 1 }])[0].day, 1);
  assert.equal(readQuires([{ id: "z", text: "One", day: 0 }])[0].day, null);
  const saved = addQuire([], { id: "a", text: "Call Ada", scribe: "Nia", day: 1, shelf: "desk", ribbon: "VIP", weight: "light" });
  assert.equal(saved[0].audit, "save");
  assert.equal(saved[0].day, 1);
  assert.equal(saved[0].shelf, "desk");
  assert.equal(saved[0].weight, "light");
  assert.equal(addQuire(saved, { id: "b", text: "Call Ada" }).length, 1);
  assert.equal(addQuire(saved, { id: "a", text: "Other" }).length, 1);
  assert.equal(addQuire(saved, { id: "b", text: "   " }).length, 1);
  const raised = stepQuireWeight(saved, "a", 1);
  assert.equal(raised[0].weight, "steady");
  assert.equal(raised[0].audit, "raise");
  assert.equal(stepQuireWeight(raised, "a", 1)[0].weight, "heavy");
  assert.equal(stepQuireWeight([{ ...saved[0], weight: "heavy" }], "a", 1)[0].weight, "heavy");
  assert.equal(stepQuireWeight([{ ...saved[0], weight: "" }], "a", -1)[0].weight, "");
  const starred = setQuireStarred(saved, "a", true);
  assert.equal(starred[0].starred, true);
  assert.equal(starred[0].audit, "star");
  assert.equal(setQuireStarred(starred, "a", false)[0].audit, "unstar");
  const folded = setQuireFolded(saved, "a", true);
  assert.equal(folded[0].folded, true);
  assert.equal(folded[0].audit, "fold");
  const filed = setQuireFiled(saved, "a", true);
  assert.equal(filed[0].filed, true);
  assert.equal(filed[0].audit, "file");
  assert.equal(setQuireFiled(filed, "a", false)[0].audit, "reopen");
  const edited = editQuire(saved, "a", "Call Bea");
  assert.equal(edited[0].text, "Call Bea");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editQuire(saved, "a", "  ")[0].text, "Call Ada");
  const pair = addQuire(saved, { id: "b", text: "Later", day: 7, shelf: "vault" });
  assert.equal(editQuire(pair, "b", "Call Ada")[0].text, "Later");
  const bulkStar = bulkQuireStarred(pair, ["b", ""], true);
  assert.equal(bulkStar[0].starred, true);
  assert.equal(bulkStar[1].starred, false);
  assert.equal(bulkQuireFiled(pair, ["a"], true)[1].filed, true);
  assert.deepEqual(resetQuires(), []);
  assert.equal(quireCopy("  Call Ada "), "Call Ada");
  assert.equal(quireCopy(" "), "");
  const shown = visibleQuires(pair, "open", "ada", null, null, null, null, null, null, false, false, 4);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].id, "a");
  assert.equal(visibleQuires(pair, "open", "nia", null, null, null, null, null, null, false, false, 4).length, 0);
  assert.equal(visibleQuires(folded, "folded", "", null, null, null, null, null, null, false, false, 4).length, 1);
  assert.equal(visibleQuires(filed, "open", "", null, null, null, null, null, null, false, false, 4).length, 0);
  assert.equal(visibleQuires(pair, "open", "", "Nia", "desk", "VIP", "light", 1, null, false, false, 4).length, 1);
  assert.equal(visibleQuires(pair, "open", "", null, null, null, null, null, "early", false, false, 4).length, 1);
  assert.equal(visibleQuires(pair, "open", "", null, null, null, null, null, "weekend", false, false, 4).length, 1);
  assert.equal(visibleQuires(raised, "open", "", null, null, null, null, null, null, true, false, 4).length, 0);
  assert.equal(visibleQuires(stepQuireWeight(raised, "a", 1), "open", "", null, null, null, null, null, null, true, false, 4).length, 1);
  assert.equal(visibleQuires(pair, "open", "", null, null, null, null, null, null, false, true, 4).length, 1);
  assert.deepEqual(quireTimeline(pair, "").map((card) => card.id), ["a", "b"]);
  assert.deepEqual(quireTimeline(addQuire(pair, { id: "c", text: "Blank" }), "").map((card) => card.day === null).at(-1), true);
  const counts = quireCounts(addQuire(starred, { id: "b", text: "Later", day: 2 }), 2);
  assert.equal(counts.open, 2);
  assert.equal(counts.starred, 1);
  assert.equal(counts.late, 1);
  assert.equal(quireShare(1, 4), 25);
  assert.equal(quireShare(0, 0), 0);
  assert.deepEqual(quireScribes(saved), ["Nia"]);
  assert.deepEqual(quireRibbons(saved), ["VIP"]);
  assert.deepEqual(quireShelves(pair), ["desk", "vault"]);
  assert.deepEqual(quireWeights(saved), ["light"]);
  assert.deepEqual(dayCounts(pair), [1, 0, 0, 0, 0, 0, 1]);
  assert.equal(activeScribe("missing", ["Nia"]), "all");
  assert.equal(activeScribe("blank", ["Nia"]), "blank");
  assert.equal(activeScribe("Nia", ["Nia"]), "Nia");
  assert.equal(scribeArg("all"), null);
  assert.equal(scribeArg("blank"), "");
  assert.equal(scribeArg("Nia"), "Nia");
  assert.equal(activeShelf("missing", ["desk"]), "all");
  assert.equal(activeShelf("desk", ["desk"]), "desk");
  assert.equal(shelfArg("blank"), "blank");
  assert.equal(shelfArg("floor"), "floor");
  assert.equal(shelfArg("nope"), null);
  assert.equal(activeRibbon("missing", ["VIP"]), "all");
  assert.equal(activeRibbon("VIP", ["VIP"]), "VIP");
  assert.equal(ribbonArg("blank"), "");
  assert.equal(ribbonArg("VIP"), "VIP");
  assert.equal(activeWeight("gone", ["light"]), "all");
  assert.equal(activeWeight("heavy", ["heavy"]), "heavy");
  assert.equal(weightArg("blank"), "blank");
  assert.equal(weightArg("steady"), "steady");
  assert.equal(weightArg("gold"), null);
  assert.equal(activeDay("missing"), "all");
  assert.equal(activeDay("blank"), "blank");
  assert.equal(activeDay("early"), "early");
  assert.equal(activeDay("01"), "1");
  assert.equal(activeDay("8"), "all");
  assert.deepEqual(dayArg("weekend"), { exact: null, band: "weekend" });
  assert.deepEqual(dayArg("3"), { exact: 3, band: null });
  assert.deepEqual(dayArg("nope"), { exact: null, band: null });
  const clash = addQuire(pair, { id: "c", text: "Same", day: 1, shelf: "desk" });
  assert.deepEqual(quireClashIds(clash, "a"), ["c"]);
  assert.deepEqual(quireClashIds(addQuire(saved, { id: "d", text: "Open shelf" }), "a"), []);
  assert.equal(nextQuire(pair, 4), "b");
  assert.equal(nextQuire(pair, 7), "b");
  assert.equal(nextQuire([{ ...pair[1], day: 2 }, { ...pair[0], day: 6 }], 7), pair[1].id);
  assert.equal(nextQuire(pair, 0), "");
  const csv = quiresCsv(saved, 4);
  assert.equal(csv.startsWith("note,scribe,day,shelf,ribbon,weight,band,starred,filed,folded,gap,audit\n"), true);
  assert.equal(csv.includes("Nia"), true);
  assert.equal(csv.includes("amount"), false);
  const view = addQuireView([], { id: "v", name: "Morning", tray: "open", query: "ada", scribe: "Nia", shelf: "desk", ribbon: "VIP", weight: "light", day: "1" });
  assert.equal(view[0].day, "1");
  assert.equal(addQuireView(view, { id: "v2", name: "Morning", tray: "open", query: "", scribe: "all", shelf: "all", ribbon: "all", weight: "all", day: "all" }).length, 1);
  assert.equal(dropQuireView(view, "v").length, 0);
  assert.equal(readQuireViews([{ id: "v", name: "  " }]).length, 0);

  assert.equal(titleOf(" owner_ceo "), "owner_ceo");
  assert.equal(titleOf("Sales Manager"), "sales_manager");
  assert.equal(titleOf("pirate"), "");
  assert.equal(titleOf(""), "");
  assert.equal(titleOf({ jobTitle: "analyst" }), "analyst");
  assert.equal(titleOf({ jobTitle: "analyst", name: "Ada" }), "");
  assert.equal(titleOf({ jobTitle: "analyst", email: "a@b.c" }), "");
  assert.equal(rankOf("owner_ceo"), "chair");
  assert.equal(rankOf("marketing_head"), "chair");
  assert.equal(rankOf("retention_manager"), "chair");
  assert.equal(rankOf("sales_mgr"), "desk");
  assert.equal(rankOf("project_manager"), "desk");
  assert.equal(rankOf("it_specialist"), "bench");
  assert.equal(rankOf("other"), "bench");
  assert.equal(rankOf("nope"), "");
  assert.equal(rankOf(true), "");
  const rows = [
    { label: "Wes", title: "owner_ceo" },
    { label: "Ada", title: "analyst" },
    { label: "Bea", title: "sales_manager" },
    { label: "Blocked", title: { jobTitle: "owner_ceo", name: "x" } },
  ];
  assert.equal(rankLines(rows).find((line) => line.rank === "chair")?.count, 1);
  assert.equal(rankLines(rows).find((line) => line.rank === "")?.count, 1);
  assert.deepEqual(namedRanks(rows), ["bench", "desk", "chair"]);
  assert.deepEqual(namedTitles(rows), ["analyst", "owner_ceo", "sales_manager"]);
  assert.equal(titleLines(rows)[0].title, "");
  assert.deepEqual(namedInitials(rows), ["a", "o", "s"]);
  assert.equal(leadingRank(rows), "bench");
  assert.equal(leadingTitle(rows), "analyst");
  assert.equal(courtesyShare(1, 4), 25);
  assert.equal(courtesyShare(0, 0), 0);
  assert.deepEqual(readHiddenTitles(["owner_ceo", "pirate", "analyst"], ["owner_ceo"]), ["owner_ceo"]);
  assert.deepEqual(toggleTitle(["owner_ceo"], "owner_ceo", ["owner_ceo", "analyst"]), []);
  assert.deepEqual(toggleTitle([], "analyst", ["analyst"]), ["analyst"]);
  assert.deepEqual(visibleTitles(["analyst", "owner_ceo"], ["analyst"], false), ["owner_ceo"]);
  assert.deepEqual(visibleTitles(["analyst", "owner_ceo"], ["analyst"], true), ["analyst"]);
  assert.equal(activeRank("missing", ["bench"]), "all");
  assert.equal(activeRank("blank", ["bench"]), "blank");
  assert.equal(activeRank("chair", ["chair"]), "chair");
  assert.equal(rankArg("all"), null);
  assert.equal(rankArg("blank"), "");
  assert.equal(rankArg("desk"), "desk");
  assert.equal(rankArg("nope"), null);
  assert.equal(activeTitle("gone", ["analyst"]), "all");
  assert.equal(activeTitle("analyst", ["analyst"]), "analyst");
  assert.equal(titleArg("all"), null);
  assert.equal(titleArg("analyst"), "analyst");
  assert.equal(titleArg("nope"), null);
  assert.equal(activeInitial("z", ["a"]), "all");
  assert.equal(activeInitial("a", ["a"]), "a");
  assert.equal(initialArg("all"), null);
  assert.equal(initialArg("o"), "o");
  assert.equal(initialArg("nope"), null);
  const visible = visibleCourtesyCustomers(rows, "chair", "owner_ceo", "o", "wes");
  assert.equal(visible.length, 1);
  assert.equal(visible[0].label, "Wes");
  assert.equal(visibleCourtesyCustomers(rows, "", null, null, "blocked").length, 1);
  assert.equal(visibleCourtesyCustomers(rows, null, null, null, "owner").length, 0);
  assert.equal(visibleCourtesyCustomers(rows, "bench", null, null, "").length, 1);
  assert.equal(courtesyCsv(rows).startsWith("kind,mark,count\n"), true);
  assert.equal(courtesyCsv([]), "kind,mark,count");
  assert.equal(courtesyCsv(rows).includes("amount"), false);
  assert.equal(courtesyCsv(rows).includes("owner_ceo"), true);

  const copy = Object.keys(ROUND148_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND148_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "qreTitle"), "Quire leaves");
  assert.equal(crmv4Text("tr", "ctsTitle"), ROUND148_COPY.tr.ctsTitle);
  assert.equal(crmv4Text("de", "qreScribe"), ROUND148_COPY.de.qreScribe);
  assert.equal(crmv4Text("ru", "ctsUnmarked"), ROUND148_COPY.ru.ctsUnmarked);
  assert.equal(crmv4Text("ar", "qreNotice"), ROUND148_COPY.ar.qreNotice);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-qre/);
  assert.match(css, /\.c4-cts/);
  assert.match(css, /\.c4-pagehead-quire/);
  assert.match(css, /\.c4-rail-quire/);
  assert.match(css, /\.c4-pagehead-vellum/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round148.tsx"), "utf8");
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
  assert.match(viewFile, /jobTitle/);
  assert.match(viewFile, /quiresCsv/);
  assert.match(viewFile, /courtesyCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "q"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-quire/);
  assert.match(viewFile, /data-courtesy/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "quire"/);
  assert.match(app, /view === "courtesy"/);
  assert.match(app, /c4-pagehead-quire/);
  assert.match(app, /c4-rail-quire/);
  assert.match(app, /c4-pagehead-vellum/);
  console.log("crmv4 round148 tests passed");
}

main();
