/**
 * Call windows and customer timezones.
 * Run: npx tsx tests/crmv4-round136.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND136_COPY } from "../src/lib/crmv4/copy-round136";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeBand,
  activeCallZone,
  activeTimezone,
  addCall,
  addCallView,
  bandArg,
  bandOf,
  bulkCallDone,
  bulkCallParked,
  callBands,
  callCopy,
  callCounts,
  callShare,
  callText,
  callTimeline,
  callZoneArg,
  callZones,
  callsCsv,
  clashIds,
  clockLabel,
  clockMinutes,
  dropCallView,
  editCall,
  leadingRegion,
  leadingTimezone,
  namedRegions,
  namedTimezones,
  nextCall,
  readCallViews,
  readCalls,
  readHiddenZones,
  regionLines,
  regionOf,
  resetCalls,
  setCallDone,
  setCallMute,
  setCallParked,
  spanMinutes,
  stepCallRank,
  timezoneText,
  toggleZone,
  visibleCalls,
  visibleTimezones,
  visibleZoneCustomers,
  windowsOverlap,
  zoneLabel,
  zoneLines,
  zoneShare,
  zonesCsv,
} from "../src/lib/crmv4/round136";

function main() {
  assert.equal(callText("  Call\nAda  "), "Call Ada");
  assert.equal(callText("   "), "");
  assert.equal(callText("x".repeat(140)).length, 96);
  assert.equal(zoneLabel("  EU  "), "EU");
  assert.equal(zoneLabel("   "), "");
  assert.equal(zoneLabel("y".repeat(40)).length, 16);
  assert.equal(clockLabel(" 09:10 "), "09:10");
  assert.equal(clockLabel("   "), "");
  assert.equal(clockLabel("t".repeat(20)).length, 5);
  assert.equal(clockMinutes("09:10"), 550);
  assert.equal(clockMinutes("9:10"), null);
  assert.equal(clockMinutes("25:00"), null);
  assert.equal(clockMinutes(""), null);
  assert.equal(spanMinutes("09:00", "10:30"), 90);
  assert.equal(spanMinutes("22:00", "02:00"), 240);
  assert.equal(spanMinutes("09:00", "09:00"), 0);
  assert.equal(spanMinutes("09:00", ""), null);
  assert.equal(bandOf("09:00", "10:00"), "morning");
  assert.equal(bandOf("13:00", "14:00"), "afternoon");
  assert.equal(bandOf("18:00", "19:00"), "evening");
  assert.equal(bandOf("22:00", "02:00"), "overnight");
  assert.equal(bandOf("", ""), "blank");
  assert.equal(bandOf("18:00", ""), "evening");
  assert.equal(windowsOverlap({ start: "09:00", end: "10:00" }, { start: "09:30", end: "11:00" }), true);
  assert.equal(windowsOverlap({ start: "09:00", end: "10:00" }, { start: "10:00", end: "11:00" }), false);
  assert.equal(windowsOverlap({ start: "22:00", end: "02:00" }, { start: "01:00", end: "03:00" }), true);
  assert.equal(windowsOverlap({ start: "22:00", end: "02:00" }, { start: "23:00", end: "23:30" }), true);
  assert.equal(windowsOverlap({ start: "22:00", end: "02:00" }, { start: "03:00", end: "04:00" }), false);
  assert.equal(windowsOverlap({ start: "10:00", end: "10:00" }, { start: "09:00", end: "11:00" }), false);
  assert.equal(windowsOverlap({ start: "", end: "11:00" }, { start: "09:00", end: "11:00" }), false);
  assert.deepEqual(readCalls([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Call Ada", zone: "  ", start: "  ", end: "  ", rank: 3, parked: 1, done: 1, mute: 1, audit: "nope" }, "nope"]), [
    { id: "2", text: "Call Ada", zone: "", start: "", end: "", rank: 0, parked: false, done: false, mute: false, audit: "" },
  ]);
  const saved = addCall([], { id: "a", text: " Call Ada ", zone: " EU ", start: " 09:00 ", end: " 10:30 " });
  assert.deepEqual(saved, [{ id: "a", text: "Call Ada", zone: "EU", start: "09:00", end: "10:30", rank: 0, parked: false, done: false, mute: false, audit: "save" }]);
  assert.equal(addCall(saved, { id: "b", text: "  " }).length, 1);
  assert.equal(addCall(saved, { id: "c", text: "Call Ada" }).length, 1);
  assert.equal(addCall(saved, { id: "a", text: "Other note" }).length, 1);
  const raised = stepCallRank(saved, "a", 1);
  assert.equal(raised[0].rank, 1);
  assert.equal(raised[0].audit, "raise");
  const first = stepCallRank(raised, "a", 1);
  assert.equal(first[0].rank, 2);
  assert.equal(stepCallRank(first, "a", 1)[0].audit, "raise");
  const lowered = stepCallRank(first, "a", -1);
  assert.equal(lowered[0].rank, 1);
  assert.equal(lowered[0].audit, "lower");
  assert.equal(stepCallRank([{ ...saved[0], rank: 0 }], "a", -1)[0].audit, "save");
  const parked = setCallParked(first, "a", true);
  assert.equal(parked[0].parked, true);
  assert.equal(parked[0].audit, "park");
  const done = setCallDone(parked, "a", true);
  assert.equal(done[0].done, true);
  assert.equal(done[0].audit, "done");
  const mute = setCallMute(done, "a", true);
  assert.equal(mute[0].mute, true);
  assert.equal(mute[0].audit, "mute");
  const open = setCallMute(setCallDone(setCallParked(mute, "a", false), "a", false), "a", false);
  assert.equal(open[0].mute, false);
  assert.equal(open[0].done, false);
  assert.equal(open[0].parked, false);
  assert.equal(open[0].audit, "unmute");
  assert.equal(editCall(saved, "a", "  ")[0].text, "Call Ada");
  assert.equal(editCall(saved, "a", "Call Ada")[0].audit, "save");
  const second = addCall(saved, { id: "b", text: "Other note", zone: "US", start: "15:00", end: "16:00" });
  assert.equal(editCall(second, "b", "Call Ada").find((slip) => slip.id === "b")?.text, "Other note");
  const edited = editCall(second, "b", " Reworded note ");
  assert.equal(edited.find((slip) => slip.id === "b")?.text, "Reworded note");
  assert.equal(edited.find((slip) => slip.id === "b")?.audit, "edit");
  assert.deepEqual(visibleCalls(saved, "open", "ada", null, null, false).map((slip) => slip.id), ["a"]);
  assert.deepEqual(visibleCalls(saved, "open", "EU", null, null, false), []);
  assert.deepEqual(visibleCalls(saved, "open", "", "", null, false), []);
  assert.deepEqual(visibleCalls(saved, "open", "", "EU", null, false).map((slip) => slip.id), ["a"]);
  assert.deepEqual(visibleCalls(saved, "open", "", null, "morning", false).map((slip) => slip.id), ["a"]);
  assert.deepEqual(visibleCalls(saved, "open", "", null, "evening", false), []);
  assert.deepEqual(visibleCalls(first, "open", "", null, null, true).map((slip) => slip.id), ["a"]);
  assert.deepEqual(visibleCalls(saved, "open", "", null, null, true), []);
  assert.deepEqual(visibleCalls(parked, "open", "", null, null, false), []);
  assert.deepEqual(visibleCalls(parked, "parked", "", null, null, false).map((slip) => slip.id), ["a"]);
  assert.deepEqual(visibleCalls(done, "parked", "", null, null, false), []);
  assert.deepEqual(visibleCalls(done, "done", "", null, null, false).map((slip) => slip.id), ["a"]);
  const ranked = stepCallRank(second, "b", 1);
  assert.deepEqual(visibleCalls(ranked, "open", "", null, null, false).map((slip) => slip.id), ["b", "a"]);
  const bulkPark = bulkCallParked(second, ["b", "missing"], true);
  assert.equal(bulkPark.find((slip) => slip.id === "b")?.parked, true);
  assert.equal(bulkPark.find((slip) => slip.id === "a")?.parked, false);
  assert.equal(bulkPark.find((slip) => slip.id === "b")?.audit, "park");
  const bulkDone = bulkCallDone(second, ["a", "b"], true);
  assert.equal(bulkDone.every((slip) => slip.done), true);
  assert.equal(callCopy("  Call Ada "), "Call Ada");
  assert.equal(callCopy("   "), "");
  assert.deepEqual(resetCalls(), []);
  const many = Array.from({ length: 40 }, (_, index) => ({ id: `n${index}`, text: `Note ${index}`, zone: index % 2 ? "A" : "", start: index % 3 ? "09:10" : "", end: "" }));
  assert.equal(readCalls(many).length, 36);
  assert.equal(callsCsv([{ id: "a", text: 'Call "Ada"', zone: "Zone, 2", start: "09:00", end: "10:30", rank: 2, parked: true, done: false, mute: true, audit: "save" }]).startsWith("text,zone,start,end,span,band,rank,parked,done,mute,audit\n"), true);
  assert.match(callsCsv(saved), /Call Ada,EU,09:00,10:30,90,morning,0,0,0,0,save/);
  assert.equal(callsCsv([]), "text,zone,start,end,span,band,rank,parked,done,mute,audit");
  assert.equal(callsCsv(saved).includes("amount"), false);
  assert.deepEqual(callCounts(done), { open: 0, parked: 0, done: 1, mute: 0, overnightOpen: 0 });
  assert.equal(callCounts(first).open, 1);
  const night = addCall(saved, { id: "n", text: "Night desk", start: "22:00", end: "02:00" });
  assert.equal(callCounts(night).overnightOpen, 1);
  assert.equal(callShare(1, 4), 25);
  assert.equal(callShare(0, 4), 0);
  assert.equal(callShare(1, 0), 0);
  assert.deepEqual(callZones(second), ["EU", "US"]);
  assert.deepEqual(callBands(night), ["morning", "overnight"]);
  assert.deepEqual(callTimeline(second, "").map((slip) => slip.start), ["09:00", "15:00"]);
  assert.deepEqual(callTimeline([{ id: "z", text: "Late", zone: "", start: "", end: "", rank: 0, parked: false, done: false, mute: false, audit: "save" }, ...second], "note").map((slip) => slip.id), ["b"]);
  const blankStart = addCall([], { id: "z", text: "No start" });
  assert.deepEqual(callTimeline([...blankStart, ...saved], "").map((slip) => slip.id), ["a", "z"]);
  assert.equal(activeCallZone("missing", ["EU"]), "all");
  assert.equal(activeCallZone("blank", ["EU"]), "blank");
  assert.equal(activeCallZone(" EU ", ["EU"]), "EU");
  assert.equal(callZoneArg("all"), null);
  assert.equal(callZoneArg("blank"), "");
  assert.equal(callZoneArg(" EU "), "EU");
  assert.equal(activeBand("missing", ["morning"]), "all");
  assert.equal(activeBand("blank", ["morning"]), "blank");
  assert.equal(activeBand("morning", ["morning"]), "morning");
  assert.equal(activeBand("evening", ["morning"]), "all");
  assert.equal(bandArg("all"), null);
  assert.equal(bandArg("blank"), "blank");
  assert.equal(bandArg("overnight"), "overnight");
  assert.equal(bandArg("nope"), null);
  const overlap = addCall(saved, { id: "c", text: "Overlap Ada", start: "09:30", end: "11:00" });
  assert.deepEqual(clashIds(overlap, "a"), ["c"]);
  assert.deepEqual(clashIds(overlap, "missing"), []);
  assert.deepEqual(clashIds(saved, "a"), []);
  const later = addCall(second, { id: "d", text: "Late call", start: "18:00", end: "19:00" });
  assert.equal(nextCall(later, "10:00"), "b");
  assert.equal(nextCall(later, "16:00"), "d");
  assert.equal(nextCall(later, "19:00"), "a");
  assert.equal(nextCall(later, "09:00"), "a");
  assert.equal(nextCall(later, ""), "");
  assert.equal(nextCall(parked, "09:00"), "");
  const views = addCallView([], { id: "v1", name: " Morning ", tray: "parked", query: " ada ", zone: "EU", band: "morning" });
  assert.deepEqual(views, [{ id: "v1", name: "Morning", tray: "parked", query: "ada", zone: "EU", band: "morning" }]);
  assert.equal(addCallView(views, { id: "v2", name: " ", tray: "open", query: "", zone: "all", band: "all" }).length, 1);
  assert.equal(addCallView(views, { id: "v2", name: "Morning", tray: "open", query: "", zone: "all", band: "all" }).length, 1);
  assert.equal(dropCallView(views, "v1").length, 0);
  assert.equal(readCallViews([{ id: "v3", name: "Open", tray: "nope", zone: "blank", band: "blank" }])[0].tray, "open");
  assert.equal(readCallViews([{ id: "v3", name: "Open", tray: "open", zone: "blank", band: "nope" }])[0].band, "all");
  assert.equal(readCallViews(Array.from({ length: 20 }, (_, index) => ({ id: `v${index}`, name: `View ${index}`, tray: "open" }))).length, 12);

  assert.equal(timezoneText(" Europe/Istanbul "), "Europe/Istanbul");
  assert.equal(timezoneText({ timezone: " UTC " }), "UTC");
  assert.equal(timezoneText(""), "");
  assert.equal(timezoneText(1 as never), "");
  assert.equal(timezoneText({ language: "en" }), "");
  assert.equal(timezoneText({ country: "TR" }), "");
  assert.equal(timezoneText({ registrationCountry: "TR" }), "");
  assert.equal(timezoneText({ desk: "Istanbul" }), "");
  assert.equal(timezoneText({ deskId: "d1" }), "");
  assert.equal(timezoneText({ campaign: "Spring" }), "");
  assert.equal(timezoneText({ tradingServer: "MT5" }), "");
  assert.equal(timezoneText({ tradingGroup: "VIP" }), "");
  assert.equal(timezoneText({ brokerName: "ING" }), "");
  assert.equal(timezoneText({ assigneeName: "Ada" }), "");
  assert.equal(timezoneText({ saleStatus: "NEW" }), "");
  assert.equal(timezoneText({ retentionStatus: "ACTIVE" }), "");
  assert.equal(timezoneText({ potentialStatus: "HIGH" }), "");
  assert.equal(timezoneText({ documentsStatus: "APPROVED" }), "");
  assert.equal(timezoneText({ accountType: "VIP" }), "");
  assert.equal(timezoneText({ role: "TRADER" }), "");
  assert.equal(timezoneText({ validation: "VERIFIED" }), "");
  assert.equal(timezoneText({ validationStatus: "VERIFIED" }), "");
  assert.equal(timezoneText({ referralCodeUsed: "INVITE" }), "");
  assert.equal(timezoneText({ timezone: "UTC", language: "en" }), "");
  assert.equal(regionOf("Europe/Istanbul"), "Europe");
  assert.equal(regionOf("America/New_York"), "America");
  assert.equal(regionOf("UTC"), "");
  assert.equal(regionOf(""), "");
  const rows = [
    { id: "u1", label: "Ada", timezone: "Europe/Istanbul" },
    { id: "u2", label: "Bea", timezone: { timezone: "America/New_York" } },
    { id: "u3", label: "Cid", timezone: "Europe/Istanbul" },
    { id: "u4", label: "Dot", timezone: "" },
    { id: "u5", label: "Eve", timezone: "UTC" },
    { id: "u6", label: "Fay", timezone: { language: "en" } as never },
  ];
  assert.deepEqual(zoneLines(rows), [
    { timezone: "", region: "", count: 2 },
    { timezone: "America/New_York", region: "America", count: 1 },
    { timezone: "Europe/Istanbul", region: "Europe", count: 2 },
    { timezone: "UTC", region: "", count: 1 },
  ]);
  assert.deepEqual(namedTimezones(rows), ["America/New_York", "Europe/Istanbul", "UTC"]);
  assert.deepEqual(regionLines(rows), [
    { region: "", count: 3 },
    { region: "America", count: 1 },
    { region: "Europe", count: 2 },
  ]);
  assert.deepEqual(namedRegions(rows), ["America", "Europe"]);
  assert.equal(zoneShare(2, 6), 33);
  assert.equal(zoneShare(0, 6), 0);
  assert.equal(zoneShare(1, 0), 0);
  assert.equal(leadingTimezone(rows), "Europe/Istanbul");
  assert.equal(leadingTimezone([{ timezone: "" }]), "");
  assert.equal(leadingTimezone([{ timezone: "UTC" }, { timezone: "Europe/Istanbul" }]), "Europe/Istanbul");
  assert.equal(leadingRegion(rows), "Europe");
  assert.equal(leadingRegion([{ timezone: "UTC" }]), "");
  assert.deepEqual(visibleZoneCustomers(rows, "Europe/Istanbul", false, null, "ada").map((row) => row.id), ["u1"]);
  assert.deepEqual(visibleZoneCustomers(rows, "", true, null, "").map((row) => row.id), ["u4", "u6"]);
  assert.deepEqual(visibleZoneCustomers(rows, "", false, "Europe", "").map((row) => row.id), ["u1", "u3"]);
  assert.deepEqual(visibleZoneCustomers(rows, "", false, "", "").map((row) => row.id), ["u4", "u5", "u6"]);
  assert.deepEqual(visibleZoneCustomers(rows, "Europe/Istanbul", false, null, "100"), []);
  assert.deepEqual(readHiddenZones(["Europe/Istanbul", "OLD", ""], ["Europe/Istanbul", "UTC"]), ["Europe/Istanbul"]);
  assert.deepEqual(toggleZone(["Europe/Istanbul"], "OLD", ["Europe/Istanbul"]), ["Europe/Istanbul"]);
  assert.deepEqual(visibleTimezones(["Europe/Istanbul", "UTC"], ["UTC"], false), ["Europe/Istanbul"]);
  assert.equal(activeTimezone("UTC", ["Europe/Istanbul"]), "");
  assert.equal(zonesCsv(rows), "zone,region,count\n,,2\nAmerica/New_York,America,1\nEurope/Istanbul,Europe,2\nUTC,,1");
  assert.equal(zonesCsv([]), "zone,region,count");
  assert.equal(zonesCsv(rows).includes("amount"), false);
  assert.equal(zoneLines(rows).every((line) => !("amount" in line) && !("currency" in line)), true);

  const copy = Object.keys(ROUND136_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND136_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "cwnTitle"), "Call windows");
  assert.equal(crmv4Text("tr", "zonTitle"), ROUND136_COPY.tr.zonTitle);
  assert.equal(crmv4Text("de", "cwnZone"), ROUND136_COPY.de.cwnZone);
  assert.equal(crmv4Text("ru", "zonBlank"), ROUND136_COPY.ru.zonBlank);
  assert.equal(crmv4Text("ar", "cwnNotice"), ROUND136_COPY.ar.cwnNotice);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-call/);
  assert.match(css, /\.c4-zone/);
  assert.match(css, /\.c4-pagehead-crest/);
  assert.match(css, /\.c4-crest-band/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round136.tsx"), "utf8");
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
  assert.match(view, /timezone/);
  assert.match(view, /callsCsv/);
  assert.match(view, /zonesCsv/);
  assert.match(view, /Escape/);
  assert.match(view, /event\.key !== "\/"/);
  assert.match(view, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(view, /data-call/);
  assert.match(view, /data-zone/);
  assert.match(view, /data-logo="mono"/);
  assert.match(view, /customers/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "callwin"/);
  assert.match(app, /view === "zones"/);
  assert.match(app, /c4-pagehead-crest/);
  assert.match(app, /c4-pagehead-folio/);
  const rail = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round30.tsx"), "utf8");
  assert.match(rail, /data-logo="mono"/);
  console.log("crmv4 round136 tests passed");
}

main();
