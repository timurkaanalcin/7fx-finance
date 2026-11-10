/**
 * Gilt assignments and first-deposit marks.
 * Run: npx tsx tests/crmv4-round164.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND164_COPY } from "../src/lib/crmv4/copy-round164";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeFtd,
  activeInitial,
  activeLane,
  activeMinute,
  activeOwner,
  activePace,
  activeSpan,
  activeTag,
  addGilt,
  addGiltView,
  bandOf,
  bulkGiltClosed,
  bulkGiltLane,
  bulkGiltPinned,
  clashGiltCount,
  dropGiltView,
  editGilt,
  fdmShare,
  ftdArg,
  ftdOf,
  ftdsCsv,
  giltCopy,
  giltCounts,
  giltGap,
  giltShare,
  giltText,
  giltsCsv,
  halfOf,
  initialArg,
  initialOf,
  laneArg,
  laneOf,
  leadingInitial,
  leadingMark,
  minuteArg,
  minuteOf,
  namedInitials,
  namedMarks,
  namedSpans,
  nextGilt,
  ownerArg,
  ownerLabel,
  ownerLoad,
  paceArg,
  paceOf,
  presentMarks,
  readGiltViews,
  readGilts,
  readHiddenMarks,
  resetGilts,
  setGiltClosed,
  setGiltParked,
  setGiltPinned,
  spanArg,
  spanOf,
  stepGiltPace,
  suggestLane,
  tagArg,
  toggleMark,
  visibleFtdCustomers,
  visibleGilts,
  visibleMarks,
  giltTag,
  giltTimeline,
} from "../src/lib/crmv4/round164";

function main() {
  assert.equal(giltText("  Call\nAda  "), "Call Ada");
  assert.equal(giltText("   "), "");
  assert.equal(giltText("x".repeat(80)).length, 40);
  assert.equal(ownerLabel("  North  "), "North");
  assert.equal(ownerLabel("   "), "");
  assert.equal(ownerLabel("y".repeat(40)).length, 12);
  assert.equal(giltTag("  VIP  "), "VIP");
  assert.equal(giltTag("   "), "");
  assert.equal(giltTag("z".repeat(20)).length, 8);
  assert.equal(minuteOf(" 0 "), 0);
  assert.equal(minuteOf(0), 0);
  assert.equal(minuteOf("00"), 0);
  assert.equal(minuteOf(15), 15);
  assert.equal(minuteOf("30"), 30);
  assert.equal(minuteOf("45"), 45);
  assert.equal(minuteOf(60), 60);
  assert.equal(minuteOf(""), null);
  assert.equal(minuteOf("015"), null);
  assert.equal(minuteOf(90), null);
  assert.equal(minuteOf("90"), null);
  assert.equal(minuteOf(15.5), null);
  assert.equal(minuteOf(-15), null);
  assert.equal(laneOf(" NORTH "), "north");
  assert.equal(laneOf("south"), "south");
  assert.equal(laneOf("east"), "east");
  assert.equal(laneOf("west"), "west");
  assert.equal(laneOf(""), "blank");
  assert.equal(laneOf("gold"), "blank");
  assert.equal(paceOf(" WAIT "), "wait");
  assert.equal(paceOf("work"), "work");
  assert.equal(paceOf("rush"), "rush");
  assert.equal(paceOf(""), "blank");
  assert.equal(paceOf("gold"), "blank");
  assert.equal(bandOf(null), "blank");
  assert.equal(bandOf(0), "dawn");
  assert.equal(bandOf(15), "morn");
  assert.equal(bandOf(30), "morn");
  assert.equal(bandOf(45), "dusk");
  assert.equal(bandOf(60), "dusk");
  assert.equal(halfOf(null), "blank");
  assert.equal(halfOf(0), "short");
  assert.equal(halfOf(15), "short");
  assert.equal(halfOf(30), "long");
  assert.equal(halfOf(60), "long");
  assert.equal(giltGap(15, 45), 30);
  assert.equal(giltGap(45, 15), -30);
  assert.equal(giltGap(15, 15), 0);
  assert.equal(giltGap(null, 15), null);
  assert.equal(giltGap(15, ""), null);
  assert.equal(giltGap(15, 90), null);
  assert.deepEqual(readGilts([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Call Ada", owner: "  ", minute: 90, lane: "gold", tag: "  ", pace: "gold", pinned: 1, parked: 1, closed: 1, audit: "nope" }, "nope"]), [
    { id: "2", text: "Call Ada", owner: "", minute: null, lane: "", tag: "", pace: "", pinned: false, parked: false, closed: false, audit: "" },
  ]);
  assert.equal(readGilts([{ id: "z", text: "One", minute: 0 }])[0].minute, 0);
  assert.equal(readGilts([{ id: "z", text: "One", minute: "00" }])[0].minute, 0);
  const saved = addGilt([], { id: "a", text: "Call Ada", owner: "Nia", minute: 15, lane: "north", tag: "VIP", pace: "wait" });
  assert.equal(saved[0].audit, "save");
  assert.equal(saved[0].minute, 15);
  assert.equal(saved[0].lane, "north");
  assert.equal(saved[0].pace, "wait");
  assert.equal(addGilt(saved, { id: "b", text: "Call Ada" }).length, 1);
  assert.equal(addGilt(saved, { id: "a", text: "Other" }).length, 1);
  assert.equal(addGilt(saved, { id: "b", text: "   " }).length, 1);
  const full = Array.from({ length: 10 }, (_, index) => ({ id: `k${index}`, text: `Note ${index}`, owner: "", minute: null, lane: "", tag: "", pace: "", pinned: false, parked: false, closed: false, audit: "save" }));
  assert.equal(addGilt(full, { id: "extra", text: "More" }).length, 10);
  assert.equal(addGilt(full, { id: "extra", text: "More" })[0].id, "extra");
  assert.equal(stepGiltPace(saved, "a", 1)[0].pace, "work");
  assert.equal(stepGiltPace(saved, "a", 1)[0].audit, "raise");
  assert.equal(stepGiltPace([{ ...saved[0], pace: "rush" }], "a", 1)[0].pace, "rush");
  assert.equal(stepGiltPace(saved, "a", -1)[0].pace, "");
  assert.equal(stepGiltPace(saved, "a", -1)[0].audit, "lower");
  assert.equal(setGiltPinned(saved, "a", true)[0].audit, "pin");
  assert.equal(setGiltPinned(saved, "a", false)[0].audit, "unpin");
  assert.equal(setGiltParked(saved, "a", true)[0].audit, "park");
  assert.equal(setGiltParked(saved, "a", false)[0].audit, "release");
  assert.equal(setGiltClosed(saved, "a", true)[0].audit, "close");
  assert.equal(setGiltClosed(saved, "a", false)[0].audit, "reopen");
  assert.equal(editGilt(saved, "a", "  Call back  ")[0].text, "Call back");
  assert.equal(editGilt(saved, "a", "  Call back  ")[0].audit, "edit");
  assert.equal(editGilt(saved, "a", "   ")[0].text, "Call Ada");
  const pair = addGilt(saved, { id: "b", text: "Other" });
  assert.equal(editGilt(pair, "b", "Call Ada").find((card) => card.id === "b")?.text, "Other");
  assert.equal(bulkGiltPinned(pair, ["a"], true).find((card) => card.id === "a")?.pinned, true);
  assert.equal(bulkGiltClosed(pair, ["b"], true).find((card) => card.id === "b")?.closed, true);
  assert.equal(bulkGiltLane(pair, ["a"], "south").find((card) => card.id === "a")?.lane, "south");
  assert.equal(bulkGiltLane(pair, ["a"], "south").find((card) => card.id === "a")?.audit, "lane");
  assert.equal(bulkGiltLane(pair, ["a"], "gold").find((card) => card.id === "a")?.lane, "north");
  assert.equal(bulkGiltLane([{ ...saved[0], lane: "south" }], ["a"], "south")[0].audit, "save");
  assert.deepEqual(resetGilts(), []);
  assert.equal(giltCopy("  Call Ada "), "Call Ada");
  assert.equal(giltCopy(" "), "");
  assert.equal(ownerLoad(saved, "Nia"), 1);
  assert.equal(ownerLoad(saved, "  "), 0);
  assert.equal(ownerLoad([{ ...saved[0], closed: true }], "Nia"), 0);
  const mixed = [
    { ...saved[0], id: "open", text: "Open", pace: "wait", minute: 15, parked: false, closed: false },
    { ...saved[0], id: "parked", text: "Parked", parked: true, closed: false, pace: "work", minute: 45 },
    { ...saved[0], id: "closed", text: "Closed", parked: true, closed: true, pace: "rush", minute: 60 },
  ];
  assert.equal(visibleGilts(mixed, "queue", "", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleGilts(mixed, "parked", "", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleGilts(mixed, "closed", "", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleGilts(mixed, "queue", "nope", null, null, null, null, null, null, false, false, "").length, 0);
  assert.equal(visibleGilts(mixed, "queue", "", "Nia", null, null, null, null, null, false, false, "")[0].id, "open");
  assert.equal(visibleGilts(mixed, "closed", "", null, "north", "VIP", "rush", 60, null, false, false, "")[0].id, "closed");
  assert.equal(visibleGilts(mixed, "queue", "", null, null, null, null, null, "morn", false, false, "")[0].id, "open");
  assert.equal(visibleGilts(mixed, "parked", "", null, null, null, null, null, "long", false, false, "")[0].id, "parked");
  assert.equal(visibleGilts(mixed, "closed", "", null, null, null, null, null, null, true, false, "")[0].id, "closed");
  assert.equal(giltCounts(mixed, 45).late, 1);
  assert.equal(giltCounts(mixed, 45).queue, 1);
  assert.equal(giltShare(1, 4), 25);
  assert.equal(giltShare(0, 4), 0);
  assert.equal(giltShare(1, 0), 0);
  const line = giltTimeline(mixed, "");
  assert.deepEqual(line.map((card) => card.minute), [15, 45, 60]);
  assert.equal(activeOwner("gone", ["Nia"]), "all");
  assert.equal(activeOwner("blank", ["Nia"]), "blank");
  assert.equal(ownerArg("Nia"), "Nia");
  assert.equal(ownerArg("blank"), "");
  assert.equal(ownerArg("all"), null);
  assert.equal(activeLane("gone", ["north"]), "all");
  assert.equal(laneArg("north"), "north");
  assert.equal(laneArg("blank"), "blank");
  assert.equal(activeTag("gone", ["VIP"]), "all");
  assert.equal(tagArg("VIP"), "VIP");
  assert.equal(tagArg("blank"), "");
  assert.equal(activePace("gone", ["wait"]), "all");
  assert.equal(paceArg("wait"), "wait");
  assert.equal(paceArg("blank"), "blank");
  assert.equal(activeMinute("gone"), "all");
  assert.equal(activeMinute("dawn"), "dawn");
  assert.equal(activeMinute("30"), "30");
  assert.deepEqual(minuteArg("morn"), { exact: null, pick: "morn" });
  assert.deepEqual(minuteArg("15"), { exact: 15, pick: null });
  assert.deepEqual(minuteArg("all"), { exact: null, pick: null });
  const clash = addGilt(saved, { id: "b", text: "Other", owner: "Nia", lane: "north" });
  assert.equal(clashGiltCount(clash), 2);
  assert.equal(clashGiltCount(saved), 0);
  assert.equal(nextGilt(mixed, 30), "open");
  assert.equal(nextGilt(mixed, ""), "");
  assert.equal(suggestLane([]), "north");
  assert.equal(suggestLane(addGilt(saved, { id: "c", text: "Second", lane: "north" })), "south");
  const csv = giltsCsv(saved, 45);
  assert.equal(csv.startsWith("note,owner,minute,lane,tag,pace,band,pinned,parked,closed,gap,audit"), true);
  assert.equal(csv.includes("amount"), false);
  assert.equal(csv.includes(",15,"), true);
  const views = addGiltView([], { id: "v", name: "Morning", tray: "queue", query: "Ada", owner: "Nia", lane: "north", tag: "VIP", pace: "wait", minute: "15" });
  assert.equal(views[0].minute, "15");
  assert.equal(addGiltView(views, { id: "v2", name: "Morning", tray: "queue", query: "", owner: "all", lane: "all", tag: "all", pace: "all", minute: "all" }).length, 1);
  assert.equal(dropGiltView(views, "v").length, 0);
  assert.equal(readGiltViews([{ id: "v", name: "  " }]).length, 0);
  assert.equal(ftdOf(true), "funded");
  assert.equal(ftdOf(false), "open");
  assert.equal(ftdOf(" YES "), "funded");
  assert.equal(ftdOf("no"), "open");
  assert.equal(ftdOf(""), "");
  assert.equal(ftdOf(null), "");
  assert.equal(ftdOf({ ftd: true }), "funded");
  assert.equal(ftdOf({ name: "Ada", ftd: true }), "");
  assert.equal(ftdOf({ retentionFollowUpAt: "2026-11-10T00:00:00.000Z", ftd: true }), "");
  assert.equal(initialOf(" ada "), "A");
  assert.equal(initialOf("7 Ada"), "");
  assert.equal(initialOf(""), "");
  assert.equal(spanOf("Ada"), "short");
  assert.equal(spanOf("North"), "mid");
  assert.equal(spanOf("Ada North"), "long");
  assert.equal(spanOf(""), "");
  const rows = [
    { ftd: true, label: "Ada North" },
    { ftd: true, label: "Amy" },
    { ftd: false, label: "Leo" },
    { ftd: "", label: "7 Blank" },
  ];
  assert.equal(leadingMark(rows), "funded");
  assert.equal(leadingInitial(rows), "A");
  assert.deepEqual(namedMarks(rows), ["funded", "open"]);
  assert.ok(namedInitials(rows).includes("A"));
  assert.ok(namedSpans(rows).includes("long"));
  assert.equal(fdmShare(2, 4), 50);
  assert.equal(fdmShare(0, 0), 0);
  assert.deepEqual(presentMarks(rows).includes("blank"), true);
  assert.deepEqual(readHiddenMarks(["nope", "funded", "funded"], ["funded", "open"]), ["funded"]);
  assert.deepEqual(toggleMark([], "funded", ["funded"]), ["funded"]);
  assert.deepEqual(toggleMark(["funded"], "funded", ["funded"]), []);
  assert.deepEqual(visibleMarks(["funded", "open"], ["funded"], false), ["open"]);
  assert.deepEqual(visibleMarks(["funded", "open"], ["funded"], true), ["funded"]);
  assert.equal(activeFtd("gone", ["funded"]), "all");
  assert.equal(activeFtd("blank", ["funded"]), "blank");
  assert.equal(ftdArg("funded"), "funded");
  assert.equal(ftdArg("blank"), "");
  assert.equal(ftdArg("all"), null);
  assert.equal(activeInitial("gone", ["A"]), "all");
  assert.equal(initialArg("A"), "A");
  assert.equal(initialArg("blank"), "");
  assert.equal(activeSpan("gone", ["short"]), "all");
  assert.equal(spanArg("short"), "short");
  assert.equal(spanArg("blank"), "");
  const shown = visibleFtdCustomers(rows, "funded", "A", null, "ada");
  assert.equal(shown.length, 1);
  assert.equal(shown[0].label, "Ada North");
  assert.equal(visibleFtdCustomers(rows, null, null, null, "funded").length, 0);
  const names = ftdsCsv(rows);
  assert.equal(names.startsWith("kind,mark,count"), true);
  assert.equal(ftdsCsv([]), "kind,mark,count");
  assert.equal(names.includes("amount"), false);
  assert.equal(names.includes(",funded,"), true);

  const copy = Object.keys(ROUND164_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND164_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "gltTitle"), "Gilt assignments");
  assert.equal(crmv4Text("tr", "fdmTitle"), ROUND164_COPY.tr.fdmTitle);
  assert.equal(crmv4Text("de", "gltOwner"), ROUND164_COPY.de.gltOwner);
  assert.equal(crmv4Text("ru", "fdmUnmarked"), ROUND164_COPY.ru.fdmUnmarked);
  assert.equal(crmv4Text("ar", "gltNotice"), ROUND164_COPY.ar.gltNotice);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-glt/);
  assert.match(css, /\.c4-fdm/);
  assert.match(css, /\.c4-logs-gilt/);
  assert.match(css, /\.c4-fresh-gilt/);
  assert.match(css, /\.c4-pagehead-gilt/);
  assert.match(css, /\.c4-support-gilt/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round164.tsx"), "utf8");
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
  assert.match(viewFile, /\bftd\b/);
  assert.match(viewFile, /giltsCsv/);
  assert.match(viewFile, /ftdsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "g"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-gilts/);
  assert.match(viewFile, /data-fdms/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestLane/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "gilt"/);
  assert.match(app, /view === "ftd"/);
  assert.match(app, /c4-pagehead-gilt/);
  const fresh = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round4.tsx"), "utf8");
  assert.match(fresh, /c4-fresh-gilt/);
  const support = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Support.tsx"), "utf8");
  assert.match(support, /c4-support-gilt/);
  const logs = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Logs.tsx"), "utf8");
  assert.match(logs, /c4-logs-gilt/);
  console.log("crmv4 round164 tests passed");
}

main();
