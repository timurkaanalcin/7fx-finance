/**
 * Quay slips and timezone belts.
 * Run: npx tsx tests/crmv4-round156.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND156_COPY } from "../src/lib/crmv4/copy-round156";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeBelt,
  activeBerth,
  activeFold,
  activeMate,
  activePennant,
  activeSpan,
  activeTide,
  activeTimber,
  addQuay,
  addQuayView,
  assignedZone,
  beltArg,
  beltOf,
  berthArg,
  berthOf,
  bulkQuayPinned,
  bulkQuayStowed,
  dropQuayView,
  editQuay,
  foldArg,
  foldOf,
  leadingBelt,
  leadingFold,
  mateArg,
  mateLabel,
  namedBelts,
  namedFolds,
  namedSpans,
  nextQuay,
  pennantArg,
  zoneShare,
  quayClashIds,
  quayCopy,
  quayCounts,
  quayGap,
  quayMates,
  quayPennant,
  quayPennants,
  quayShare,
  quayText,
  quayTides,
  quayTimeline,
  quayTimbers,
  quaysCsv,
  readHiddenBelts,
  readQuayViews,
  readQuays,
  resetQuays,
  ringOf,
  setQuayHeld,
  setQuayPinned,
  setQuayStowed,
  spanArg,
  spanOf,
  stepQuayTide,
  tideArg,
  tideOf,
  timberArg,
  timberOf,
  toggleBelt,
  visibleBelts,
  visibleQuays,
  visibleZoneCustomers,
  watchCounts,
  watchOf,
  zonesCsv,
} from "../src/lib/crmv4/round156";

function main() {
  assert.equal(quayText("  Check\nAda  "), "Check Ada");
  assert.equal(quayText("   "), "");
  assert.equal(quayText("x".repeat(120)).length, 56);
  assert.equal(mateLabel("  North  "), "North");
  assert.equal(mateLabel("   "), "");
  assert.equal(mateLabel("y".repeat(40)).length, 14);
  assert.equal(quayPennant("  VIP  "), "VIP");
  assert.equal(quayPennant("   "), "");
  assert.equal(quayPennant("z".repeat(30)).length, 8);
  assert.equal(berthOf(" 1 "), 1);
  assert.equal(berthOf(1), 1);
  assert.equal(berthOf("01"), 1);
  assert.equal(berthOf("09"), 9);
  assert.equal(berthOf("36"), 36);
  assert.equal(berthOf(36), 36);
  assert.equal(berthOf(""), null);
  assert.equal(berthOf("00"), null);
  assert.equal(berthOf(0), null);
  assert.equal(berthOf("37"), null);
  assert.equal(berthOf(37), null);
  assert.equal(berthOf(-1), null);
  assert.equal(berthOf(1.5), null);
  assert.equal(timberOf(" OAK "), "oak");
  assert.equal(timberOf("teak"), "teak");
  assert.equal(timberOf("pine"), "pine");
  assert.equal(timberOf("ash"), "ash");
  assert.equal(timberOf(""), "blank");
  assert.equal(timberOf("gold"), "blank");
  assert.equal(tideOf(" EBB "), "ebb");
  assert.equal(tideOf("slack"), "slack");
  assert.equal(tideOf("flood"), "flood");
  assert.equal(tideOf(""), "blank");
  assert.equal(tideOf("gold"), "blank");
  assert.equal(watchOf(null), "blank");
  assert.equal(watchOf(1), "cove");
  assert.equal(watchOf(9), "cove");
  assert.equal(watchOf(10), "bay");
  assert.equal(watchOf(18), "bay");
  assert.equal(watchOf(19), "gulf");
  assert.equal(watchOf(27), "gulf");
  assert.equal(watchOf(28), "sea");
  assert.equal(watchOf(36), "sea");
  assert.equal(ringOf(null), "blank");
  assert.equal(ringOf(1), "inner");
  assert.equal(ringOf(18), "inner");
  assert.equal(ringOf(19), "outer");
  assert.equal(ringOf(36), "outer");
  assert.equal(quayGap(8, 9), 1);
  assert.equal(quayGap(18, 9), -9);
  assert.equal(quayGap(8, 8), 0);
  assert.equal(quayGap(null, 9), null);
  assert.equal(quayGap(8, ""), null);
  assert.equal(quayGap(8, 37), null);
  assert.deepEqual(readQuays([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Check Ada", mate: "  ", berth: 0, timber: "gold", pennant: "  ", tide: "gold", pinned: 1, held: 1, stowed: 1, audit: "nope" }, "nope"]), [
    { id: "2", text: "Check Ada", mate: "", berth: null, timber: "", pennant: "", tide: "", pinned: false, held: false, stowed: false, audit: "" },
  ]);
  assert.equal(readQuays([{ id: "z", text: "One", berth: 1 }])[0].berth, 1);
  assert.equal(readQuays([{ id: "z", text: "One", berth: "09" }])[0].berth, 9);
  const saved = addQuay([], { id: "a", text: "Check Ada", mate: "Nia", berth: 8, timber: "oak", pennant: "VIP", tide: "ebb" });
  assert.equal(saved[0].audit, "save");
  assert.equal(saved[0].berth, 8);
  assert.equal(saved[0].timber, "oak");
  assert.equal(saved[0].tide, "ebb");
  assert.equal(addQuay(saved, { id: "b", text: "Check Ada" }).length, 1);
  assert.equal(addQuay(saved, { id: "a", text: "Other" }).length, 1);
  assert.equal(addQuay(saved, { id: "b", text: "   " }).length, 1);
  const raised = stepQuayTide(saved, "a", 1);
  assert.equal(raised[0].tide, "slack");
  assert.equal(raised[0].audit, "raise");
  assert.equal(stepQuayTide(raised, "a", 1)[0].tide, "flood");
  assert.equal(stepQuayTide([{ ...saved[0], tide: "flood" }], "a", 1)[0].tide, "flood");
  assert.equal(stepQuayTide([{ ...saved[0], tide: "" }], "a", -1)[0].tide, "");
  assert.equal(stepQuayTide([{ ...saved[0], tide: "" }], "a", 1)[0].tide, "ebb");
  assert.equal(setQuayPinned(saved, "a", true)[0].audit, "pin");
  assert.equal(setQuayPinned(saved, "a", false)[0].audit, "unpin");
  assert.equal(setQuayHeld(saved, "a", true)[0].held, true);
  assert.equal(setQuayHeld(saved, "a", true)[0].audit, "hold");
  assert.equal(setQuayStowed(saved, "a", true)[0].audit, "stow");
  assert.equal(setQuayStowed(saved, "a", false)[0].audit, "unstow");
  assert.equal(editQuay(saved, "a", "  ")[0].text, "Check Ada");
  assert.equal(editQuay(saved, "a", "Check Bea")[0].audit, "edit");
  const pair = addQuay(saved, { id: "b", text: "Check Bea" });
  assert.equal(editQuay(pair, "b", "Check Ada")[0].text, "Check Bea");
  assert.equal(bulkQuayPinned(pair, ["a", "b"], true).every((card) => card.pinned), true);
  assert.equal(bulkQuayStowed(pair, ["missing"], true)[0].stowed, false);
  assert.equal(resetQuays().length, 0);
  assert.equal(quayCopy("  Check Ada "), "Check Ada");
  assert.equal(quayCopy(" "), "");
  const mixed = [
    { ...saved[0], id: "open", tide: "ebb", berth: 4, pinned: true },
    { ...saved[0], id: "held", text: "Held note", held: true, tide: "slack", berth: 11 },
    { ...saved[0], id: "stowed", text: "Stowed note", stowed: true, held: true, tide: "flood", berth: 2 },
    { ...saved[0], id: "late", text: "Aaa late", tide: "ebb", berth: 1 },
    { ...saved[0], id: "slack", text: "Slack note", tide: "slack", berth: 1 },
  ];
  assert.equal(visibleQuays(mixed, "open", "late", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleQuays(mixed, "open", "nia", null, null, null, null, null, null, false, false, "").length, 0);
  assert.equal(visibleQuays(mixed, "held", "", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleQuays(mixed, "stowed", "", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleQuays(mixed, "open", "", null, null, null, null, null, null, true, false, "").every((card) => card.tide === "flood"), true);
  assert.equal(visibleQuays(mixed, "open", "", null, null, null, null, null, null, false, true, "8").every((card) => card.tide === "ebb"), true);
  assert.equal(visibleQuays(mixed, "open", "", null, "oak", null, null, null, null, false, false, "").length, 3);
  assert.equal(visibleQuays(mixed, "open", "", "Nia", "oak", "VIP", "ebb", 4, null, false, false, "").length, 1);
  assert.equal(visibleQuays(mixed, "open", "", null, null, null, null, null, "cove", false, false, "").length, 3);
  assert.equal(quayTimeline(mixed, "")[0].berth, 1);
  assert.equal(quayTimeline([{ ...saved[0], berth: null }], "").at(-1)?.berth, null);
  const counts = quayCounts(mixed, "8");
  assert.equal(counts.open, 3);
  assert.equal(counts.held, 1);
  assert.equal(counts.stowed, 1);
  assert.equal(counts.pinned, 1);
  assert.equal(counts.late, 2);
  assert.equal(quayShare(1, 3), 33);
  assert.equal(quayShare(0, 0), 0);
  assert.deepEqual(quayMates(mixed), ["Nia"]);
  assert.deepEqual(quayPennants(mixed), ["VIP"]);
  assert.deepEqual(quayTimbers(mixed), ["oak"]);
  assert.deepEqual(quayTides(mixed), ["ebb", "slack", "flood"]);
  assert.deepEqual(watchCounts(mixed), [4, 1, 0, 0]);
  assert.equal(activeMate("gone", ["Nia"]), "all");
  assert.equal(activeMate("blank", ["Nia"]), "blank");
  assert.equal(mateArg("blank"), "");
  assert.equal(mateArg("all"), null);
  assert.equal(activeTimber("gone", ["oak"]), "all");
  assert.equal(timberArg("blank"), "blank");
  assert.equal(timberArg("oak"), "oak");
  assert.equal(timberArg("gold"), null);
  assert.equal(activePennant("gone", ["VIP"]), "all");
  assert.equal(pennantArg("VIP"), "VIP");
  assert.equal(activeTide("gone", ["ebb"]), "all");
  assert.equal(tideArg("ebb"), "ebb");
  assert.equal(tideArg("blank"), "blank");
  assert.equal(activeBerth("cove"), "cove");
  assert.equal(activeBerth("09"), "9");
  assert.equal(activeBerth("00"), "all");
  assert.equal(activeBerth("37"), "all");
  assert.equal(activeBerth("pirate"), "all");
  assert.deepEqual(berthArg("1"), { exact: 1, band: null });
  assert.deepEqual(berthArg("bay"), { exact: null, band: "bay" });
  assert.deepEqual(berthArg("all"), { exact: null, band: null });
  assert.deepEqual(quayClashIds([
    { ...saved[0], id: "a", berth: 4, text: "Check Ada" },
    { ...saved[0], id: "b", berth: 9, text: "Check Bea" },
  ], "a"), ["b"]);
  assert.deepEqual(quayClashIds([{ ...saved[0], timber: "", berth: 8 }], "a"), []);
  assert.deepEqual(quayClashIds([{ ...saved[0], pennant: "" }], "a"), []);
  assert.equal(nextQuay(mixed, "3"), "open");
  assert.equal(nextQuay(mixed, "30"), "late");
  assert.equal(nextQuay([{ ...saved[0], tide: "flood", berth: 4 }], "1"), "");
  assert.equal(nextQuay(mixed, ""), "");
  const csv = quaysCsv(saved, "9");
  assert.equal(csv.startsWith("note,mate,berth,timber,pennant,tide,watch,pinned,held,stowed,gap,audit\n"), true);
  assert.equal(csv.includes("Check Ada,Nia,8,oak,VIP,ebb,cove,0,0,0,1,save"), true);
  assert.equal(quaysCsv([], "").includes("note,mate"), true);
  const view = addQuayView([], { id: "v", name: "Cove", tray: "open", query: "ada", mate: "Nia", timber: "oak", pennant: "VIP", tide: "ebb", berth: "cove" });
  assert.equal(view.length, 1);
  assert.equal(addQuayView(view, { ...view[0], id: "w" }).length, 1);
  assert.equal(readQuayViews([{ id: "v", name: "  " }]).length, 0);
  assert.equal(dropQuayView(view, "v").length, 0);
  const many = Array.from({ length: 14 }, (_, index) => ({ id: `k${index}`, text: `Note ${index}`, mate: "", berth: null, timber: "", pennant: "", tide: "", pinned: false, held: false, stowed: false, audit: "save" }));
  assert.equal(readQuays(many).length, 12);
  const manyViews = Array.from({ length: 6 }, (_, index) => ({ id: `v${index}`, name: `View ${index}`, tray: "open" as const, query: "", mate: "all", timber: "all", pennant: "all", tide: "all", berth: "all" }));
  assert.equal(readQuayViews(manyViews).length, 4);

  assert.equal(assignedZone(" Europe/Istanbul "), "Europe/Istanbul");
  assert.equal(assignedZone(""), "");
  assert.equal(assignedZone("x".repeat(80)).length, 48);
  assert.equal(assignedZone({ timezone: "Asia/Tokyo" }), "Asia/Tokyo");
  assert.equal(assignedZone({ timezone: "Asia/Tokyo", language: "en" }), "");
  assert.equal(assignedZone({ timezone: "Asia/Tokyo", country: "JP" }), "");
  assert.equal(assignedZone({ timezone: "Asia/Tokyo", name: "Ada" }), "");
  assert.equal(assignedZone({ timezone: "Asia/Tokyo", email: "a@b.c" }), "");
  assert.equal(assignedZone({ timezone: "Asia/Tokyo", phone: "1" }), "");
  assert.equal(assignedZone({ timezone: "Asia/Tokyo", desk: "North" }), "");
  assert.equal(assignedZone({ timezone: "Asia/Tokyo", address: "1 Road" }), "");
  assert.equal(assignedZone({ timezone: "Asia/Tokyo", city: "Tokyo" }), "");
  assert.equal(assignedZone({ timezone: "Asia/Tokyo", firstName: "Ada" }), "");
  assert.equal(assignedZone({ timezone: "Asia/Tokyo", lastName: "North" }), "");
  assert.equal(beltOf("Europe/Istanbul"), "europe");
  assert.equal(beltOf("America/New_York"), "america");
  assert.equal(beltOf("Asia/Tokyo"), "asia");
  assert.equal(beltOf("Africa/Cairo"), "africa");
  assert.equal(beltOf("Pacific/Auckland"), "pacific");
  assert.equal(beltOf("Australia/Sydney"), "other");
  assert.equal(beltOf("UTC"), "other");
  assert.equal(beltOf("GMT"), "other");
  assert.equal(beltOf("Etc/UTC"), "other");
  assert.equal(beltOf("Istanbul"), "plain");
  assert.equal(beltOf("4Europe/Paris"), "");
  assert.equal(beltOf(""), "");
  assert.equal(spanOf("Asia/Tokyo"), "short");
  assert.equal(spanOf("Europe/Istanbul"), "mid");
  assert.equal(spanOf("America/Argentina/ComodRivadavia"), "long");
  assert.equal(spanOf(""), "");
  assert.equal(spanOf("4abc"), "");
  assert.equal(foldOf("Istanbul"), "plain");
  assert.equal(foldOf("Europe/Istanbul"), "split");
  assert.equal(foldOf("America/Argentina/Buenos_Aires"), "deep");
  assert.equal(foldOf(""), "");
  const rows = [
    { timezone: "Europe/Istanbul", label: "Ada North" },
    { timezone: "Europe/Paris", label: "Bea South" },
    { timezone: "Asia/Tokyo", label: "Ann West" },
    { timezone: "America/Argentina/ComodRivadavia", label: "Chris East" },
    { timezone: "UTC", label: "Mark" },
    { timezone: "Istanbul", label: "West" },
    { timezone: "4ada", label: "Mark" },
    { timezone: "", label: "Blank" },
  ];
  assert.equal(leadingBelt(rows), "europe");
  assert.equal(leadingFold(rows), "split");
  assert.equal(zoneShare(2, 6), 33);
  assert.equal(zoneShare(0, 0), 0);
  assert.deepEqual(namedBelts(rows), ["america", "asia", "europe", "other", "plain"]);
  assert.deepEqual(namedSpans(rows), ["short", "mid", "long"]);
  assert.deepEqual(namedFolds(rows), ["plain", "split", "deep"]);
  assert.equal(visibleZoneCustomers(rows, "europe", null, null, "north").length, 1);
  assert.equal(visibleZoneCustomers(rows, null, "split", "short", "").length, 2);
  assert.equal(visibleZoneCustomers([{ timezone: "Europe/Istanbul", label: "North" }], null, null, null, "istanbul").length, 0);
  assert.deepEqual(readHiddenBelts(["EUROPE", "europe", "9", "mars"], ["europe", "asia"]), ["europe"]);
  assert.deepEqual(toggleBelt(["europe"], "asia", ["europe", "asia"]), ["europe", "asia"]);
  assert.deepEqual(toggleBelt(["europe"], "europe", ["europe", "asia"]), []);
  assert.deepEqual(toggleBelt([], "other", ["europe", "other"]), ["other"]);
  assert.deepEqual(visibleBelts(["europe", "asia"], ["europe"], false), ["asia"]);
  assert.deepEqual(visibleBelts(["europe", "asia"], ["europe"], true), ["europe"]);
  assert.equal(activeBelt("gone", ["europe"]), "all");
  assert.equal(activeBelt("blank", ["europe"]), "blank");
  assert.equal(beltArg("europe"), "europe");
  assert.equal(beltArg("blank"), "");
  assert.equal(beltArg("all"), null);
  assert.equal(activeSpan("gone", ["short"]), "all");
  assert.equal(spanArg("short"), "short");
  assert.equal(spanArg("blank"), "");
  assert.equal(activeFold("gone", ["split"]), "all");
  assert.equal(foldArg("deep"), "deep");
  assert.equal(foldArg("blank"), "");
  const names = zonesCsv(rows);
  assert.equal(names.startsWith("kind,mark,count"), true);
  assert.equal(zonesCsv([]), "kind,mark,count");
  assert.equal(names.includes("amount"), false);
  assert.equal(names.includes(",europe,"), true);

  const copy = Object.keys(ROUND156_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND156_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "quyTitle"), "Quay slips");
  assert.equal(crmv4Text("tr", "zblTitle"), ROUND156_COPY.tr.zblTitle);
  assert.equal(crmv4Text("de", "quyMate"), ROUND156_COPY.de.quyMate);
  assert.equal(crmv4Text("ru", "zblUnmarked"), ROUND156_COPY.ru.zblUnmarked);
  assert.equal(crmv4Text("ar", "quyNotice"), ROUND156_COPY.ar.quyNotice);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-quy/);
  assert.match(css, /\.c4-zbl/);
  assert.match(css, /\.c4-pagehead-quay/);
  assert.match(css, /\.c4-rail-quay/);
  assert.match(css, /\.c4-pagehead-docket/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round156.tsx"), "utf8");
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
  assert.match(viewFile, /timezone/);
  assert.match(viewFile, /quaysCsv/);
  assert.match(viewFile, /zonesCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "q"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-quays/);
  assert.match(viewFile, /data-belts/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "quay"/);
  assert.match(app, /view === "belts"/);
  assert.match(app, /c4-pagehead-quay/);
  assert.match(app, /c4-rail-quay/);
  assert.match(app, /c4-pagehead-docket/);
  console.log("crmv4 round156 tests passed");
}

main();
