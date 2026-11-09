/**
 * Watch slips and operating systems.
 * Run: npx tsx tests/crmv4-round139.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND139_COPY } from "../src/lib/crmv4/copy-round139";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeMinute,
  activeOsFamily,
  activeOsInitial,
  activeOwner,
  activeSystem,
  activeTone,
  activeWatchTag,
  addWatch,
  addWatchView,
  bulkWatchArmed,
  bulkWatchDone,
  dropWatchView,
  editWatch,
  leadingOs,
  leadingOsFamily,
  leadingOsInitial,
  minuteArg,
  minuteBand,
  minuteCount,
  minuteCounts,
  minuteDecade,
  minuteGap,
  namedOsFamilies,
  namedOsInitials,
  namedSystems,
  nextWatch,
  osFamilyArg,
  osFamilyLines,
  osFamilyOf,
  osInitialArg,
  osInitialLines,
  osInitialOf,
  osLines,
  osShare,
  osText,
  ownerArg,
  ownerLabel,
  readHiddenSystems,
  readWatchViews,
  readWatches,
  resetWatches,
  setWatchArmed,
  setWatchDone,
  setWatchHush,
  stepWatchRank,
  systemsCsv,
  toneArg,
  toneOf,
  toggleSystem,
  visibleOsCustomers,
  visibleSystems,
  visibleWatches,
  watchClashIds,
  watchCopy,
  watchCounts,
  watchOwners,
  watchShare,
  watchTag,
  watchTagArg,
  watchTags,
  watchText,
  watchTimeline,
  watchTones,
  watchesCsv,
} from "../src/lib/crmv4/round139";

function main() {
  assert.equal(watchText("  Call\nAda  "), "Call Ada");
  assert.equal(watchText("   "), "");
  assert.equal(watchText("x".repeat(120)).length, 80);
  assert.equal(ownerLabel("  North  "), "North");
  assert.equal(ownerLabel("   "), "");
  assert.equal(ownerLabel("y".repeat(40)).length, 18);
  assert.equal(watchTag("  VIP  "), "VIP");
  assert.equal(watchTag("   "), "");
  assert.equal(watchTag("z".repeat(30)).length, 14);
  assert.equal(minuteCount(" 4 "), 4);
  assert.equal(minuteCount(12), 12);
  assert.equal(minuteCount(60), 60);
  assert.equal(minuteCount(0), 0);
  assert.equal(minuteCount(61), 0);
  assert.equal(minuteCount(""), 0);
  assert.equal(minuteCount("02"), 0);
  assert.equal(toneOf(" FIRM "), "firm");
  assert.equal(toneOf("calm"), "calm");
  assert.equal(toneOf("urgent"), "urgent");
  assert.equal(toneOf(""), "blank");
  assert.equal(toneOf("loud"), "blank");
  assert.equal(minuteBand(0), "blank");
  assert.equal(minuteBand(1), "brief");
  assert.equal(minuteBand(15), "brief");
  assert.equal(minuteBand(16), "steady");
  assert.equal(minuteBand(40), "steady");
  assert.equal(minuteBand(41), "long");
  assert.equal(minuteBand(60), "long");
  assert.equal(minuteDecade(0), "blank");
  assert.equal(minuteDecade(1), "d1");
  assert.equal(minuteDecade(10), "d1");
  assert.equal(minuteDecade(11), "d2");
  assert.equal(minuteDecade(60), "d6");
  assert.equal(minuteGap(12, 30), 18);
  assert.equal(minuteGap(40, 12), -28);
  assert.equal(minuteGap(12, 12), 0);
  assert.equal(minuteGap(0, 12), null);
  assert.equal(minuteGap(12, ""), null);
  assert.deepEqual(readWatches([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Call Ada", owner: "  ", minute: 61, tone: "loud", tag: "  ", rank: 3, armed: 1, done: 1, hush: 1, audit: "nope" }, "nope"]), [
    { id: "2", text: "Call Ada", owner: "", minute: 0, tone: "", tag: "", rank: 0, armed: false, done: false, hush: false, audit: "" },
  ]);
  const saved = addWatch([], { id: "a", text: " Call Ada ", owner: " North ", minute: "12", tone: " Firm ", tag: " VIP " });
  assert.deepEqual(saved, [{ id: "a", text: "Call Ada", owner: "North", minute: 12, tone: "firm", tag: "VIP", rank: 0, armed: false, done: false, hush: false, audit: "save" }]);
  assert.equal(addWatch(saved, { id: "b", text: "  " }).length, 1);
  assert.equal(addWatch(saved, { id: "c", text: "Call Ada" }).length, 1);
  assert.equal(addWatch(saved, { id: "a", text: "Other note" }).length, 1);
  const raised = stepWatchRank(saved, "a", 1);
  assert.equal(raised[0].rank, 1);
  assert.equal(raised[0].audit, "raise");
  const first = stepWatchRank(raised, "a", 1);
  assert.equal(first[0].rank, 2);
  assert.equal(stepWatchRank(first, "a", 1)[0].audit, "raise");
  const lowered = stepWatchRank(first, "a", -1);
  assert.equal(lowered[0].rank, 1);
  assert.equal(lowered[0].audit, "lower");
  assert.equal(stepWatchRank([{ ...saved[0], rank: 0 }], "a", -1)[0].audit, "save");
  const armed = setWatchArmed(first, "a", true);
  assert.equal(armed[0].armed, true);
  assert.equal(armed[0].audit, "arm");
  const done = setWatchDone(armed, "a", true);
  assert.equal(done[0].done, true);
  assert.equal(done[0].audit, "done");
  const hush = setWatchHush(done, "a", true);
  assert.equal(hush[0].hush, true);
  assert.equal(hush[0].audit, "hush");
  const open = setWatchHush(setWatchDone(setWatchArmed(hush, "a", false), "a", false), "a", false);
  assert.equal(open[0].hush, false);
  assert.equal(open[0].done, false);
  assert.equal(open[0].armed, false);
  assert.equal(open[0].audit, "speak");
  assert.equal(editWatch(saved, "a", "  ")[0].text, "Call Ada");
  assert.equal(editWatch(saved, "a", "Call Ada")[0].audit, "save");
  const second = addWatch(saved, { id: "b", text: "Other note", owner: "South", minute: 48, tone: "urgent", tag: "Press" });
  assert.equal(editWatch(second, "b", "Call Ada").find((slip) => slip.id === "b")?.text, "Other note");
  const edited = editWatch(second, "b", " Reworded note ");
  assert.equal(edited.find((slip) => slip.id === "b")?.text, "Reworded note");
  assert.equal(edited.find((slip) => slip.id === "b")?.audit, "edit");
  assert.deepEqual(visibleWatches(saved, "open", "ada", null, null, null, null, null, false, false, "").map((slip) => slip.id), ["a"]);
  assert.deepEqual(visibleWatches(saved, "open", "North", null, null, null, null, null, false, false, ""), []);
  assert.deepEqual(visibleWatches(saved, "open", "VIP", null, null, null, null, null, false, false, ""), []);
  assert.deepEqual(visibleWatches(saved, "open", "", "", null, null, null, null, false, false, ""), []);
  assert.deepEqual(visibleWatches(saved, "open", "", "North", null, null, null, null, false, false, "").map((slip) => slip.id), ["a"]);
  assert.deepEqual(visibleWatches(saved, "open", "", null, "firm", null, null, null, false, false, "").map((slip) => slip.id), ["a"]);
  assert.deepEqual(visibleWatches(saved, "open", "", null, "calm", null, null, null, false, false, ""), []);
  assert.deepEqual(visibleWatches(saved, "open", "", null, null, "VIP", null, null, false, false, "").map((slip) => slip.id), ["a"]);
  assert.deepEqual(visibleWatches(saved, "open", "", null, null, "", null, null, false, false, ""), []);
  assert.deepEqual(visibleWatches(saved, "open", "", null, null, null, null, "brief", false, false, "").map((slip) => slip.id), ["a"]);
  assert.deepEqual(visibleWatches(saved, "open", "", null, null, null, null, "long", false, false, ""), []);
  assert.deepEqual(visibleWatches(saved, "open", "", null, null, null, null, "d2", false, false, "").map((slip) => slip.id), ["a"]);
  assert.deepEqual(visibleWatches(saved, "open", "", null, null, null, null, "d6", false, false, ""), []);
  assert.deepEqual(visibleWatches(saved, "open", "", null, null, null, 12, null, false, false, "").map((slip) => slip.id), ["a"]);
  assert.deepEqual(visibleWatches(saved, "open", "", null, null, null, 13, null, false, false, ""), []);
  assert.deepEqual(visibleWatches(saved, "open", "", null, null, null, null, "blank", false, false, ""), []);
  assert.deepEqual(visibleWatches(first, "open", "", null, null, null, null, null, true, false, "").map((slip) => slip.id), ["a"]);
  assert.deepEqual(visibleWatches(saved, "open", "", null, null, null, null, null, true, false, ""), []);
  assert.deepEqual(visibleWatches(armed, "open", "", null, null, null, null, null, false, false, ""), []);
  assert.deepEqual(visibleWatches(armed, "armed", "", null, null, null, null, null, false, false, "").map((slip) => slip.id), ["a"]);
  assert.deepEqual(visibleWatches(done, "armed", "", null, null, null, null, null, false, false, ""), []);
  assert.deepEqual(visibleWatches(done, "done", "", null, null, null, null, null, false, false, "").map((slip) => slip.id), ["a"]);
  const passed = addWatch(saved, { id: "l", text: "Passed note", minute: 4 });
  assert.deepEqual(visibleWatches(passed, "open", "", null, null, null, null, null, false, true, "12").map((slip) => slip.id), ["l"]);
  assert.deepEqual(visibleWatches(passed, "open", "", null, null, null, null, null, false, true, ""), []);
  const ranked = stepWatchRank(second, "b", 1);
  assert.deepEqual(visibleWatches(ranked, "open", "", null, null, null, null, null, false, false, "").map((slip) => slip.id), ["b", "a"]);
  const bulkArm = bulkWatchArmed(second, ["b", "missing"], true);
  assert.equal(bulkArm.find((slip) => slip.id === "b")?.armed, true);
  assert.equal(bulkArm.find((slip) => slip.id === "a")?.armed, false);
  assert.equal(bulkArm.find((slip) => slip.id === "b")?.audit, "arm");
  const bulkDone = bulkWatchDone(second, ["a", "b"], true);
  assert.equal(bulkDone.every((slip) => slip.done), true);
  assert.equal(watchCopy("  Call Ada "), "Call Ada");
  assert.equal(watchCopy("   "), "");
  assert.deepEqual(resetWatches(), []);
  const many = Array.from({ length: 40 }, (_, index) => ({ id: `n${index}`, text: `Note ${index}`, owner: index % 2 ? "A" : "", minute: index % 3 ? 12 : 0 }));
  assert.equal(readWatches(many).length, 36);
  assert.equal(watchesCsv([{ id: "a", text: 'Call "Ada"', owner: "Ada, North", minute: 12, tone: "firm", tag: "VIP", rank: 2, armed: true, done: false, hush: true, audit: "save" }], "30").startsWith("text,owner,minute,tone,tag,band,rank,armed,done,hush,gap,audit\n"), true);
  assert.match(watchesCsv(saved, "30"), /Call Ada,North,12,firm,VIP,brief,0,0,0,0,18,save/);
  assert.equal(watchesCsv([], "4"), "text,owner,minute,tone,tag,band,rank,armed,done,hush,gap,audit");
  assert.equal(watchesCsv(saved, "").includes(",,"), true);
  assert.equal(watchesCsv(saved, "4").includes("amount"), false);
  assert.deepEqual(watchCounts(done, "30"), { open: 0, armed: 0, done: 1, hush: 0, passed: 0 });
  assert.equal(watchCounts(first, "").open, 1);
  assert.equal(watchCounts(passed, "12").passed, 1);
  assert.equal(watchCounts(passed, "").passed, 0);
  assert.equal(watchShare(1, 4), 25);
  assert.equal(watchShare(0, 4), 0);
  assert.equal(watchShare(1, 0), 0);
  assert.deepEqual(watchOwners(second), ["North", "South"]);
  assert.deepEqual(watchTags(second), ["Press", "VIP"]);
  assert.deepEqual(watchTones(second), ["firm", "urgent"]);
  assert.deepEqual(minuteCounts(second), [0, 1, 0, 0, 1, 0]);
  assert.deepEqual(watchTimeline(second, "").map((slip) => slip.minute), [12, 48]);
  assert.deepEqual(watchTimeline([{ id: "z", text: "Open", owner: "", minute: 0, tone: "", tag: "", rank: 0, armed: false, done: false, hush: false, audit: "save" }, ...second], "note").map((slip) => slip.id), ["b"]);
  const blankMinute = addWatch([], { id: "z", text: "No minute" });
  assert.deepEqual(watchTimeline([...blankMinute, ...saved], "").map((slip) => slip.id), ["a", "z"]);
  assert.equal(activeOwner("missing", ["North"]), "all");
  assert.equal(activeOwner("blank", ["North"]), "blank");
  assert.equal(activeOwner("North", ["North"]), "North");
  assert.equal(ownerArg("all"), null);
  assert.equal(ownerArg("blank"), "");
  assert.equal(ownerArg("North"), "North");
  assert.equal(activeTone("missing", ["firm"]), "all");
  assert.equal(activeTone("blank", ["firm"]), "blank");
  assert.equal(activeTone("firm", ["firm"]), "firm");
  assert.equal(toneArg("all"), null);
  assert.equal(toneArg("blank"), "blank");
  assert.equal(toneArg("firm"), "firm");
  assert.equal(toneArg("loud"), null);
  assert.equal(activeWatchTag("missing", ["VIP"]), "all");
  assert.equal(activeWatchTag("blank", ["VIP"]), "blank");
  assert.equal(watchTagArg("blank"), "");
  assert.equal(watchTagArg("all"), null);
  assert.equal(activeMinute("nope"), "all");
  assert.equal(activeMinute("brief"), "brief");
  assert.equal(activeMinute("d2"), "d2");
  assert.equal(activeMinute("d7"), "all");
  assert.equal(activeMinute("12"), "12");
  assert.equal(activeMinute("61"), "all");
  assert.deepEqual(minuteArg("brief"), { exact: null, band: "brief" });
  assert.deepEqual(minuteArg("d6"), { exact: null, band: "d6" });
  assert.deepEqual(minuteArg("12"), { exact: 12, band: null });
  assert.deepEqual(minuteArg("all"), { exact: null, band: null });
  assert.deepEqual(watchClashIds(second, "a"), []);
  const clash = addWatch(second, { id: "c", text: "Same chair", owner: "North", minute: 12 });
  assert.deepEqual(watchClashIds(clash, "a"), ["c"]);
  assert.deepEqual(watchClashIds(addWatch(saved, { id: "d", text: "Loose", minute: 12 }), "a"), []);
  assert.equal(nextWatch(second, 12), "a");
  assert.equal(nextWatch(second, 20), "b");
  assert.equal(nextWatch(second, 50), "a");
  assert.equal(nextWatch(second, ""), "");
  assert.equal(nextWatch(done, 12), "");
  const views = addWatchView([], { id: "v", name: " Morning ", tray: "armed", query: " ada ", owner: "North", tone: "firm", tag: "VIP", minute: "brief" });
  assert.equal(views[0].name, "Morning");
  assert.equal(views[0].tray, "armed");
  assert.equal(views[0].minute, "brief");
  assert.equal(addWatchView(views, { id: "v2", name: "Morning", tray: "open", query: "", owner: "all", tone: "all", tag: "all", minute: "all" }).length, 1);
  assert.equal(addWatchView(views, { id: "v", name: "Other", tray: "open", query: "", owner: "all", tone: "all", tag: "all", minute: "all" }).length, 1);
  assert.deepEqual(readWatchViews([{ id: "v", name: "Morning", tray: "nope", owner: " ", tone: "loud", tag: " ", minute: "nope" }]), [
    { id: "v", name: "Morning", tray: "open", query: "", owner: "all", tone: "all", tag: "all", minute: "all" },
  ]);
  assert.equal(dropWatchView(views, "v").length, 0);
  assert.equal(readWatchViews(Array.from({ length: 20 }, (_, index) => ({ id: `v${index}`, name: `View ${index}`, tray: "open" }))).length, 12);

  assert.equal(osText("  Windows 11  "), "Windows 11");
  assert.equal(osText({ lastOs: " macOS " }), "macOS");
  assert.equal(osText({ lastOs: "Windows", lastBrowser: "Chrome" }), "");
  assert.equal(osText({ lastDevice: "Phone" }), "");
  assert.equal(osText({ lastCity: "Ada" }), "");
  assert.equal(osText({ language: "en" }), "");
  assert.equal(osText({ timezone: "UTC" }), "");
  assert.equal(osText(null), "");
  assert.equal(osFamilyOf("iOS 17"), "ios");
  assert.equal(osFamilyOf("iPadOS 17"), "ios");
  assert.equal(osFamilyOf("Mac OS X"), "macos");
  assert.equal(osFamilyOf("macOS"), "macos");
  assert.equal(osFamilyOf("Chrome OS"), "chromeos");
  assert.equal(osFamilyOf("CrOS"), "chromeos");
  assert.equal(osFamilyOf("Ubuntu"), "linux");
  assert.equal(osFamilyOf("Android 14"), "android");
  assert.equal(osFamilyOf("Windows 11"), "windows");
  assert.equal(osFamilyOf("Chrome"), "other");
  assert.equal(osFamilyOf(""), "");
  assert.equal(osInitialOf("windows 11"), "W");
  assert.equal(osInitialOf("3 Dock"), "#");
  assert.equal(osInitialOf(""), "");
  const rows = [
    { id: "u1", label: "Ada", lastOs: "Windows 11" },
    { id: "u2", label: "Bea", lastOs: "macOS" },
    { id: "u3", label: "Cara", lastOs: "Windows 11" },
    { id: "u4", label: "Dee", lastOs: "" },
    { id: "u5", label: "Eve", lastOs: "3 Dock" },
    { id: "u6", label: "Fay", lastOs: { lastBrowser: "Chrome" } as never },
  ];
  assert.deepEqual(osLines(rows).map((line) => [line.os, line.family, line.initial, line.count]), [
    ["", "", "", 2],
    ["3 Dock", "other", "#", 1],
    ["macOS", "macos", "M", 1],
    ["Windows 11", "windows", "W", 2],
  ]);
  assert.deepEqual(namedSystems(rows), ["3 Dock", "macOS", "Windows 11"]);
  assert.deepEqual(osFamilyLines(rows).map((line) => [line.family, line.count]), [
    ["", 2],
    ["windows", 2],
    ["macos", 1],
    ["other", 1],
  ]);
  assert.deepEqual(namedOsFamilies(rows), ["windows", "macos", "other"]);
  assert.deepEqual(osInitialLines(rows).map((line) => line.initial), ["", "M", "W", "#"]);
  assert.deepEqual(namedOsInitials(rows), ["M", "W", "#"]);
  assert.equal(osShare(1, 4), 25);
  assert.equal(osShare(0, 4), 0);
  assert.equal(leadingOs(rows), "Windows 11");
  assert.equal(leadingOs([{ lastOs: "macOS" }, { lastOs: "Windows 11" }]), "macOS");
  assert.equal(leadingOsFamily(rows), "windows");
  assert.equal(leadingOsFamily([{ lastOs: "" }]), "");
  assert.equal(leadingOsInitial(rows), "W");
  assert.equal(leadingOsInitial([{ lastOs: "" }]), "");
  assert.deepEqual(visibleOsCustomers(rows, "Windows 11", false, null, null, "ada").map((row) => row.id), ["u1"]);
  assert.deepEqual(visibleOsCustomers(rows, "", true, null, null, "").map((row) => row.id), ["u4", "u6"]);
  assert.deepEqual(visibleOsCustomers(rows, "", false, "windows", null, "").map((row) => row.id), ["u1", "u3"]);
  assert.deepEqual(visibleOsCustomers(rows, "", false, null, "W", "").map((row) => row.id), ["u1", "u3"]);
  assert.deepEqual(visibleOsCustomers(rows, "", false, null, "", "").map((row) => row.id), ["u4", "u6"]);
  assert.deepEqual(visibleOsCustomers(rows, "", false, null, "#", "").map((row) => row.id), ["u5"]);
  assert.deepEqual(visibleOsCustomers(rows, "Windows 11", false, null, null, "windows"), []);
  assert.deepEqual(readHiddenSystems(["Windows 11", "OLD", ""], ["Windows 11", "macOS"]), ["Windows 11"]);
  assert.deepEqual(toggleSystem(["Windows 11"], "OLD", ["Windows 11"]), ["Windows 11"]);
  assert.deepEqual(visibleSystems(["Windows 11", "macOS"], ["macOS"], false), ["Windows 11"]);
  assert.equal(activeSystem("macOS", ["Windows 11"]), "");
  assert.equal(activeOsFamily("missing", ["windows"]), "all");
  assert.equal(activeOsFamily("blank", ["windows"]), "blank");
  assert.equal(activeOsFamily("windows", ["windows"]), "windows");
  assert.equal(osFamilyArg("all"), null);
  assert.equal(osFamilyArg("blank"), "");
  assert.equal(osFamilyArg("ios"), "ios");
  assert.equal(osFamilyArg("nope"), null);
  assert.equal(activeOsInitial("missing", ["W"]), "all");
  assert.equal(activeOsInitial("blank", ["W"]), "blank");
  assert.equal(activeOsInitial("#", ["#"]), "#");
  assert.equal(activeOsInitial("#", ["W"]), "all");
  assert.equal(osInitialArg("all"), null);
  assert.equal(osInitialArg("blank"), "");
  assert.equal(osInitialArg("#"), "#");
  assert.equal(osInitialArg("w"), "W");
  assert.equal(systemsCsv(rows), "os,family,initial,count\n,,,2\n3 Dock,other,#,1\nmacOS,macos,M,1\nWindows 11,windows,W,2");
  assert.equal(systemsCsv([]), "os,family,initial,count");
  assert.equal(systemsCsv(rows).includes("amount"), false);
  assert.equal(osLines(rows).every((line) => !("amount" in line) && !("currency" in line)), true);

  const copy = Object.keys(ROUND139_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND139_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "wchTitle"), "Watch slips");
  assert.equal(crmv4Text("tr", "ostTitle"), ROUND139_COPY.tr.ostTitle);
  assert.equal(crmv4Text("de", "wchOwner"), ROUND139_COPY.de.wchOwner);
  assert.equal(crmv4Text("ru", "ostBlank"), ROUND139_COPY.ru.ostBlank);
  assert.equal(crmv4Text("ar", "wchNotice"), ROUND139_COPY.ar.wchNotice);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-watch/);
  assert.match(css, /\.c4-system/);
  assert.match(css, /\.c4-pagehead-salon/);
  assert.match(css, /\.c4-rail-salon/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round139.tsx"), "utf8");
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
  assert.match(view, /lastOs/);
  assert.match(view, /watchesCsv/);
  assert.match(view, /systemsCsv/);
  assert.match(view, /Escape/);
  assert.match(view, /event\.key !== "\/"/);
  assert.match(view, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(view, /data-watch/);
  assert.match(view, /data-system/);
  assert.match(view, /data-logo="mono"/);
  assert.match(view, /customers/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "watch"/);
  assert.match(app, /view === "systems"/);
  assert.match(app, /c4-pagehead-salon/);
  assert.match(app, /c4-rail-salon/);
  assert.match(app, /c4-pagehead-atelier/);
  console.log("crmv4 round139 tests passed");
}

main();
