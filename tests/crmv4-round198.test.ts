/**
 * Handoff briefs and pledge marks.
 * Run: TZ=UTC npx tsx tests/crmv4-round198.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND198_COPY } from "../src/lib/crmv4/copy-round198";
import {
  activeHour,
  activeLength,
  activeWeight,
  addBrief,
  addBriefTag,
  addBriefView,
  briefShare,
  briefsCsv,
  bulkBriefLane,
  busiestAuthor,
  catalogPledge,
  catalogPledgeCount,
  clashHourCount,
  cycleStage,
  dawnHour,
  densityOf,
  editBrief,
  editBriefNote,
  fairAuthor,
  hourGap,
  hourOf,
  houseLane,
  laneOf,
  lateBrief,
  lengthOf,
  moveFocus,
  nextBrief,
  pagePledgeCount,
  pauseOf,
  peakHour,
  pledgeBand,
  pledgeCopy,
  pledgeRowsCsv,
  pledgeState,
  pledgeTone,
  pledgesCsv,
  setBriefPause,
  sharedPledgeCount,
  soonBrief,
  suggestAuthor,
  suggestLane,
  suggestLength,
  usedHours,
  visibleBriefs,
  visiblePledgeCustomers,
  warmPledgeCount,
  weightClashCount,
  weightOf,
} from "../src/lib/crmv4/round198";

function main() {
  assert.equal(laneOf("  ink "), "INK");
  assert.equal(laneOf("oak"), "OAK");
  assert.equal(laneOf("gilt"), "GILT");
  assert.equal(laneOf("   "), "");
  assert.equal(laneOf("IN"), "");
  assert.equal(laneOf("FOUR"), "");
  assert.equal(hourOf("1"), 1);
  assert.equal(hourOf(1), 1);
  assert.equal(hourOf("12"), 12);
  assert.equal(hourOf("6"), 6);
  assert.equal(hourOf("0"), null);
  assert.equal(hourOf("01"), null);
  assert.equal(hourOf("13"), null);
  assert.equal(hourOf(""), null);
  assert.equal(weightOf("1"), 1);
  assert.equal(weightOf(3), 3);
  assert.equal(weightOf("5"), 5);
  assert.equal(weightOf("2"), null);
  assert.equal(weightOf("01"), null);
  assert.equal(lengthOf("20"), 20);
  assert.equal(lengthOf(40), 40);
  assert.equal(lengthOf("80"), 80);
  assert.equal(lengthOf("0"), null);
  assert.equal(lengthOf("020"), null);
  assert.equal(lengthOf("60"), null);
  assert.equal(pauseOf("0"), 0);
  assert.equal(pauseOf(20), 20);
  assert.equal(pauseOf("40"), 40);
  assert.equal(pauseOf("10"), null);
  assert.equal(peakHour(3), true);
  assert.equal(peakHour(6), true);
  assert.equal(peakHour(9), true);
  assert.equal(peakHour(12), true);
  assert.equal(peakHour(1), false);
  assert.equal(dawnHour(2), true);
  assert.equal(dawnHour(7), true);
  assert.equal(dawnHour(3), false);
  assert.equal(dawnHour(12), false);
  assert.equal(hourGap(1, 12), -1);
  assert.equal(hourGap(12, 1), 1);
  assert.equal(hourGap(1, 7), 6);
  assert.equal(hourGap(7, 1), -6);
  assert.equal(hourGap(6, 12), 6);
  assert.equal(hourGap(null, 2), null);
  assert.equal(hourGap(2, ""), null);
  assert.equal(hourGap(2, 0), null);
  assert.equal(activeHour("peak"), "peak");
  assert.equal(activeHour("99"), "all");
  assert.equal(activeWeight("3"), "3");
  assert.equal(activeWeight("2"), "all");
  assert.equal(activeLength("blank"), "blank");
  assert.equal(activeLength("60"), "all");
  assert.equal(densityOf("tight"), "tight");
  assert.equal(densityOf("nope"), "roomy");
  assert.equal(moveFocus(0, 3, 1), 1);
  assert.equal(moveFocus(0, 3, -1), 2);
  assert.equal(moveFocus(2, 3, 1), 0);
  assert.equal(moveFocus(1, 0, 1), 0);

  const saved = addBrief([], { id: "a", title: "Ada brief", note: "oak leaf", author: "Nia", hour: "6", lane: "ink", stage: "draft", weight: "5", length: "20", tags: "oak, vip, gold", pause: "0" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].hour, 6);
  assert.equal(saved[0].weight, 5);
  assert.equal(saved[0].length, 20);
  assert.equal(saved[0].lane, "INK");
  assert.equal(saved[0].note, "oak leaf");
  assert.deepEqual(saved[0].tags, ["oak", "vip"]);
  assert.equal(saved[0].audit, "save");
  assert.equal(houseLane(saved[0].lane), true);
  assert.equal(houseLane("OAK"), false);
  assert.equal(soonBrief(saved[0]), true);
  assert.equal(lateBrief(saved[0], "12"), true);
  assert.equal(lateBrief(saved[0], "10"), false);
  assert.equal(addBrief(saved, { id: "b", title: "Ada brief" }).length, 1);
  assert.equal(addBrief(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(addBrief(saved, { id: "c", title: "   " }).length, 1);
  const capped = Array.from({ length: 8 }, (_, index) => ({ id: `n${index}`, title: `Line ${index}` })).reduce((briefs, brief) => addBrief(briefs, brief), [] as ReturnType<typeof addBrief>);
  assert.equal(capped.length, 6);
  assert.equal(capped.some((brief) => brief.title === "Line 0"), false);
  assert.equal(capped[0].title, "Line 7");

  const cycled = cycleStage(saved, "a");
  assert.equal(cycled[0].stage, "sent");
  assert.equal(cycled[0].audit, "stage");
  assert.equal(cycleStage(cycled, "a")[0].stage, "ack");
  assert.equal(cycleStage(cycleStage(cycled, "a"), "a")[0].stage, "draft");
  const blankStage = addBrief([], { id: "z", title: "Blank stage" });
  assert.equal(cycleStage(blankStage, "z")[0].stage, "draft");

  const edited = editBrief(saved, "a", "Bea brief");
  assert.equal(edited[0].title, "Bea brief");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editBrief(saved, "a", "   ")[0].title, "Ada brief");
  const noted = editBriefNote(saved, "a", "fresh leaf");
  assert.equal(noted[0].note, "fresh leaf");
  assert.equal(editBriefNote(saved, "a", "   ")[0].note, "oak leaf");
  const oneTag = addBrief([], { id: "t", title: "Tag brief", tags: "oak" });
  const tagged = addBriefTag(oneTag, "t", "gold");
  assert.deepEqual(tagged[0].tags, ["oak", "gold"]);
  assert.equal(tagged[0].audit, "tag");
  assert.equal(addBriefTag(tagged, "t", "silk")[0].tags.length, 2);

  const paused = setBriefPause(saved, "a", 20);
  assert.equal(paused[0].pause, 20);
  assert.equal(paused[0].audit, "pause");
  assert.equal(soonBrief(paused[0]), false);
  assert.equal(lateBrief(paused[0], "12"), false);
  assert.equal(setBriefPause(saved, "a", 10)[0].pause, 0);

  const moved = bulkBriefLane(saved, ["a"], "gilt");
  assert.equal(moved[0].lane, "GILT");
  assert.equal(moved[0].audit, "lane");
  assert.equal(bulkBriefLane(saved, ["a"], "satin")[0].lane, "INK");

  const second = addBrief(saved, { id: "b", title: "Bea brief", author: "Ada", hour: "8", lane: "oak", stage: "sent", weight: "5", length: "40", tags: "oak" });
  assert.equal(usedHours(second), 2);
  assert.equal(suggestLane([]), "INK");
  assert.equal(suggestLength([]), 40);
  assert.equal(suggestAuthor([]), "");
  assert.equal(fairAuthor(second, "Bea, Ada"), "Bea");
  assert.equal(busiestAuthor(second), "Ada");
  assert.equal(nextBrief(second, ""), "");
  assert.equal(nextBrief(second, "7"), "b");
  const finished = cycleStage(second, "b");
  assert.equal(finished.find((brief) => brief.id === "b")?.stage, "ack");
  assert.equal(nextBrief(finished, "7"), "a");
  const resting = setBriefPause(second, "b", 40);
  assert.equal(nextBrief(resting, "7"), "a");
  const shown = visibleBriefs(second, "open", "bea", null, null, null, null, null, null, null, false, false, false, false, false);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].id, "b");
  const taggedSearch = visibleBriefs(second, "open", "oak", null, null, null, null, null, null, null, false, false, false, false, false);
  assert.equal(taggedSearch.length, 2);
  const house = visibleBriefs(second, "open", "", null, null, null, null, null, null, null, false, false, true, false, false);
  assert.equal(house.length, 1);
  assert.equal(house[0].id, "a");
  const dawn = visibleBriefs(addBrief(second, { id: "d", title: "Dawn brief", hour: "2", lane: "gilt", length: "80" }), "open", "", null, null, null, null, null, null, null, false, false, false, true, false);
  assert.equal(dawn.length, 1);
  assert.equal(dawn[0].id, "d");
  assert.equal(clashHourCount(second), 0);
  const clashed = addBrief(second, { id: "c", title: "Same hour", hour: "6", lane: "ink", weight: "5" });
  assert.equal(clashHourCount(clashed), 2);
  assert.equal(weightClashCount(clashed) >= 2, true);
  assert.equal(briefShare(1, 2), 50);
  assert.equal(briefShare(0, 2), 0);
  const views = addBriefView([], { id: "v1", name: "Peak desk", tray: "open", query: "oak", author: "all", lane: "ink", stage: "draft", hour: "peak", weight: "5", length: "20" });
  assert.equal(views.length, 1);
  assert.equal(views[0].lane, "INK");
  assert.equal(addBriefView(views, { id: "v1", name: "Other", tray: "open", query: "", author: "all", lane: "all", stage: "all", hour: "all", weight: "all", length: "all" }).length, 1);
  const csv = briefsCsv(saved, "12");
  assert.equal(csv.includes("Ada brief"), true);
  assert.equal(csv.includes("INK"), true);
  assert.equal(csv.split("\n")[0].includes("late"), true);
  assert.equal(csv.includes("amount"), false);

  const rows = [
    { id: "1", label: "Ada", note: { retentionNote: "CALL" } },
    { id: "2", label: "Bea", note: { retentionNote: "MAIL" } },
    { id: "3", label: "Cara", note: { retentionNote: "VISIT" } },
    { id: "4", label: "Noa", note: { retentionNote: "Oak leaf" } },
    { id: "5", label: "Paris", note: { retentionNote: "Please review the long note today now" } },
    { id: "6", label: "Empty", note: { retentionNote: "" } },
    { id: "7", label: "Missing", note: {} },
    { id: "8", label: "Blocked", note: { retentionNote: "CALL", balance: 1 } },
  ];
  assert.equal(pledgeCopy(rows[0].note), "CALL");
  assert.equal(pledgeState(rows[0].note), "set");
  assert.equal(pledgeBand(rows[0].note), "dot");
  assert.equal(pledgeBand(rows[2].note), "line");
  assert.equal(pledgeBand(rows[4].note), "page");
  assert.equal(pledgeTone(rows[0].note), "cool");
  assert.equal(pledgeTone(rows[3].note), "warm");
  assert.equal(pledgeState({ retentionNote: "Paris" }), "set");
  assert.equal(pledgeState(rows[5].note), "clear");
  assert.equal(pledgeState(rows[6].note), "");
  assert.equal(pledgeState(rows[7].note), "");
  assert.equal(pledgeState("CALL"), "set");
  assert.equal(catalogPledge(rows[0].note), true);
  assert.equal(catalogPledge(rows[2].note), true);
  assert.equal(catalogPledge(rows[3].note), false);
  assert.equal(catalogPledgeCount(rows), 3);
  assert.equal(pagePledgeCount(rows), 1);
  assert.equal(warmPledgeCount(rows), 1);
  assert.equal(sharedPledgeCount(rows), 0);
  assert.equal(visiblePledgeCustomers(rows, "dot", null, "", "all", [], "all").length, 2);
  assert.equal(visiblePledgeCustomers(rows, null, null, "par", "all", [], "all").length, 1);
  const bands = pledgesCsv(rows);
  assert.equal(bands.startsWith("kind,mark,count"), true);
  assert.equal(bands.includes("amount"), false);
  assert.equal(bands.includes("catalog"), true);
  const queue = pledgeRowsCsv(rows, ["1"]);
  assert.equal(queue.includes("Ada"), true);
  assert.equal(queue.split("\n")[1].endsWith(",1"), true);

  assert.equal(crmv4Text("en", "hbfTitle"), ROUND198_COPY.en.hbfTitle);
  assert.equal(crmv4Text("tr", "pgmTitle"), ROUND198_COPY.tr.pgmTitle);
  assert.equal(crmv4Text("de", "hbfSearch"), ROUND198_COPY.de.hbfSearch);
  assert.equal(crmv4Text("ru", "pgmHint"), ROUND198_COPY.ru.pgmHint);
  assert.equal(crmv4Text("ar", "hbfNotice"), ROUND198_COPY.ar.hbfNotice);
  assert.notEqual(ROUND198_COPY.tr.hbfTitle, ROUND198_COPY.en.hbfTitle);
  assert.notEqual(ROUND198_COPY.de.pgmTitle, ROUND198_COPY.en.pgmTitle);
  assert.notEqual(ROUND198_COPY.ru.hbfSearch, ROUND198_COPY.en.hbfSearch);
  assert.notEqual(ROUND198_COPY.ar.pgmSearch, ROUND198_COPY.en.pgmSearch);
  const keys = Object.keys(ROUND198_COPY.en);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND198_COPY[locale]), keys);
    for (const key of keys) {
      assert.equal(typeof ROUND198_COPY[locale][key as keyof typeof ROUND198_COPY.en], "string");
      assert.ok(ROUND198_COPY[locale][key as keyof typeof ROUND198_COPY.en]);
    }
  }

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-hbf/);
  assert.match(css, /\.c4-pgm/);
  assert.match(css, /\.c4-support-atlas/);
  assert.match(css, /\.c4-pagehead-atlas/);
  assert.match(css, /\.c4-rail-atlas/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round198.tsx"), "utf8");
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
  assert.equal(viewFile.includes("assigneeId"), false);
  assert.match(viewFile, /retentionNote/);
  assert.match(viewFile, /briefsCsv/);
  assert.match(viewFile, /pledgesCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-handoff/);
  assert.match(viewFile, /data-pledges/);
  assert.match(viewFile, /data-catalog/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestLane/);
  const support = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Support.tsx"), "utf8");
  assert.match(support, /c4-support-atlas/);
  assert.match(support, /c4-support-atlas-mast/);
  assert.match(support, /data-logo="mono"/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "hbrf"/);
  assert.match(app, /view === "plgm"/);
  assert.match(app, /HandoffBriefs/);
  assert.match(app, /PledgeMarks/);
  assert.match(app, /c4-pagehead-atlas/);
  assert.match(app, /c4-rail-atlas/);
  console.log("crmv4 round198 tests passed");
}

main();
