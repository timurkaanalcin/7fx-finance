/**
 * Key cards and devices.
 * Run: npx tsx tests/crmv4-round140.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND140_COPY } from "../src/lib/crmv4/copy-round140";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeDevice,
  activeDeviceClass,
  activeDeviceInitial,
  activeFloor,
  activeGuest,
  activeKeyTag,
  activeWing,
  addKey,
  addKeyView,
  bulkKeyIssued,
  bulkKeyReturned,
  deviceClassArg,
  deviceClassLines,
  deviceClassOf,
  deviceInitialArg,
  deviceInitialOf,
  deviceLines,
  deviceShare,
  deviceText,
  devicesCsv,
  dropKeyView,
  editKey,
  floorArg,
  floorBand,
  floorCount,
  floorCounts,
  floorGap,
  floorGroup,
  guestArg,
  guestLabel,
  keyClashIds,
  keyCopy,
  keyCounts,
  keyGuests,
  keyShare,
  keyTag,
  keyTagArg,
  keyTags,
  keyText,
  keyTimeline,
  keyWings,
  keysCsv,
  leadingDevice,
  leadingDeviceClass,
  leadingDeviceInitial,
  namedDeviceClasses,
  namedDeviceInitials,
  namedDevices,
  nextKey,
  readHiddenDevices,
  readKeyViews,
  readKeys,
  resetKeys,
  setKeyIssued,
  setKeyReturned,
  setKeySpare,
  stepKeyRank,
  suiteLabel,
  toggleDevice,
  visibleDeviceCustomers,
  visibleDevices,
  visibleKeys,
  wingArg,
  wingOf,
} from "../src/lib/crmv4/round140";

function main() {
  assert.equal(keyText("  Call\nAda  "), "Call Ada");
  assert.equal(keyText("   "), "");
  assert.equal(keyText("x".repeat(120)).length, 80);
  assert.equal(guestLabel("  North  "), "North");
  assert.equal(guestLabel("   "), "");
  assert.equal(guestLabel("y".repeat(40)).length, 18);
  assert.equal(keyTag("  VIP  "), "VIP");
  assert.equal(keyTag("   "), "");
  assert.equal(keyTag("z".repeat(30)).length, 14);
  assert.equal(suiteLabel("  12A  "), "12A");
  assert.equal(suiteLabel("   "), "");
  assert.equal(suiteLabel("s".repeat(20)).length, 8);
  assert.equal(floorCount(" 4 "), 4);
  assert.equal(floorCount(12), 12);
  assert.equal(floorCount(1), 1);
  assert.equal(floorCount(0), 0);
  assert.equal(floorCount(13), 0);
  assert.equal(floorCount(""), 0);
  assert.equal(floorCount("02"), 0);
  assert.equal(wingOf(" EAST "), "east");
  assert.equal(wingOf("north"), "north");
  assert.equal(wingOf("south"), "south");
  assert.equal(wingOf("west"), "west");
  assert.equal(wingOf(""), "blank");
  assert.equal(wingOf("up"), "blank");
  assert.equal(floorBand(0), "blank");
  assert.equal(floorBand(1), "low");
  assert.equal(floorBand(4), "low");
  assert.equal(floorBand(5), "mid");
  assert.equal(floorBand(8), "mid");
  assert.equal(floorBand(9), "high");
  assert.equal(floorBand(12), "high");
  assert.equal(floorGroup(0), "blank");
  assert.equal(floorGroup(1), "g1");
  assert.equal(floorGroup(3), "g1");
  assert.equal(floorGroup(4), "g2");
  assert.equal(floorGroup(12), "g4");
  assert.equal(floorGap(3, 8), 5);
  assert.equal(floorGap(8, 3), -5);
  assert.equal(floorGap(3, 3), 0);
  assert.equal(floorGap(0, 3), null);
  assert.equal(floorGap(3, ""), null);
  assert.deepEqual(readKeys([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Call Ada", guest: "  ", floor: 13, wing: "up", suite: "  ", tag: "  ", rank: 3, issued: 1, returned: 1, spare: 1, audit: "nope" }, "nope"]), [
    { id: "2", text: "Call Ada", guest: "", floor: 0, wing: "", suite: "", tag: "", rank: 0, issued: false, returned: false, spare: false, audit: "" },
  ]);
  const saved = addKey([], { id: "a", text: " Call Ada ", guest: " North ", floor: "4", wing: " East ", suite: " 12A ", tag: " VIP " });
  assert.deepEqual(saved, [{ id: "a", text: "Call Ada", guest: "North", floor: 4, wing: "east", suite: "12A", tag: "VIP", rank: 0, issued: false, returned: false, spare: false, audit: "save" }]);
  assert.equal(addKey(saved, { id: "b", text: "  " }).length, 1);
  assert.equal(addKey(saved, { id: "c", text: "Call Ada" }).length, 1);
  assert.equal(addKey(saved, { id: "a", text: "Other note" }).length, 1);
  const raised = stepKeyRank(saved, "a", 1);
  assert.equal(raised[0].rank, 1);
  assert.equal(raised[0].audit, "raise");
  const first = stepKeyRank(raised, "a", 1);
  assert.equal(first[0].rank, 2);
  assert.equal(stepKeyRank(first, "a", 1)[0].audit, "raise");
  const lowered = stepKeyRank(first, "a", -1);
  assert.equal(lowered[0].rank, 1);
  assert.equal(lowered[0].audit, "lower");
  assert.equal(stepKeyRank([{ ...saved[0], rank: 0 }], "a", -1)[0].audit, "save");
  const issued = setKeyIssued(first, "a", true);
  assert.equal(issued[0].issued, true);
  assert.equal(issued[0].audit, "issue");
  const returned = setKeyReturned(issued, "a", true);
  assert.equal(returned[0].returned, true);
  assert.equal(returned[0].audit, "return");
  const spare = setKeySpare(returned, "a", true);
  assert.equal(spare[0].spare, true);
  assert.equal(spare[0].audit, "spare");
  const cut = setKeySpare(setKeyReturned(setKeyIssued(spare, "a", false), "a", false), "a", false);
  assert.equal(cut[0].spare, false);
  assert.equal(cut[0].returned, false);
  assert.equal(cut[0].issued, false);
  assert.equal(cut[0].audit, "pair");
  assert.equal(editKey(saved, "a", "  ")[0].text, "Call Ada");
  assert.equal(editKey(saved, "a", "Call Ada")[0].audit, "save");
  const second = addKey(saved, { id: "b", text: "Other note", guest: "South", floor: 11, wing: "west", suite: "9B", tag: "Press" });
  assert.equal(editKey(second, "a", "Other note").find((card) => card.id === "a")?.text, "Call Ada");
  assert.equal(editKey(second, "a", "Fresh note").find((card) => card.id === "a")?.text, "Fresh note");
  assert.equal(editKey(second, "a", "Fresh note").find((card) => card.id === "a")?.audit, "edit");
  const bulk = bulkKeyIssued(second, ["a"], true);
  assert.equal(bulk.find((card) => card.id === "a")?.issued, true);
  assert.equal(bulk.find((card) => card.id === "b")?.issued, false);
  const done = bulkKeyReturned(bulk, ["b"], true);
  assert.equal(done.find((card) => card.id === "b")?.returned, true);
  assert.deepEqual(resetKeys(), []);
  assert.equal(keyCopy("  Call Ada "), "Call Ada");
  assert.equal(keyCopy("   "), "");
  assert.equal(visibleKeys(second, "cut", "ada", null, null, null, null, null, false, false, "").map((card) => card.id).join(","), "a");
  assert.equal(visibleKeys(second, "cut", "south", null, null, null, null, null, false, false, "").length, 0);
  assert.equal(visibleKeys(issued, "issued", "", null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleKeys(returned, "issued", "", null, null, null, null, null, false, false, "").length, 0);
  assert.equal(visibleKeys(returned, "returned", "", null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleKeys(second, "cut", "", "North", null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleKeys(second, "cut", "", null, "west", null, null, null, false, false, "").length, 1);
  assert.equal(visibleKeys(second, "cut", "", null, null, null, 11, null, false, false, "").length, 1);
  assert.equal(visibleKeys(second, "cut", "", null, null, null, null, "high", false, false, "").length, 1);
  assert.equal(visibleKeys(first, "cut", "", null, null, null, null, null, true, false, "").length, 1);
  assert.equal(visibleKeys(saved, "cut", "", null, null, null, null, null, true, false, "").length, 0);
  const passed = addKey([], { id: "p", text: "Late", floor: 2 });
  assert.equal(visibleKeys(passed, "cut", "", null, null, null, null, null, false, true, "6").length, 1);
  assert.equal(visibleKeys(passed, "cut", "", null, null, null, null, null, false, true, "").length, 0);
  assert.equal(keysCsv([{ id: "a", text: 'Call "Ada"', guest: "Ada, North", floor: 4, wing: "east", suite: "12A", tag: "VIP", rank: 2, issued: true, returned: false, spare: true, audit: "save" }], "8").startsWith("text,guest,floor,wing,suite,tag,band,rank,issued,returned,spare,gap,audit\n"), true);
  assert.match(keysCsv(saved, "8"), /Call Ada,North,4,east,12A,VIP,low,0,0,0,0,4,save/);
  assert.equal(keysCsv([], "4"), "text,guest,floor,wing,suite,tag,band,rank,issued,returned,spare,gap,audit");
  assert.equal(keysCsv(saved, "").includes(",,"), true);
  assert.equal(keysCsv(saved, "4").includes("amount"), false);
  assert.deepEqual(keyCounts(returned, "8"), { cut: 0, issued: 0, returned: 1, spare: 0, passed: 0 });
  assert.equal(keyCounts(first, "").cut, 1);
  assert.equal(keyCounts(passed, "6").passed, 1);
  assert.equal(keyCounts(passed, "").passed, 0);
  assert.equal(keyShare(1, 4), 25);
  assert.equal(keyShare(0, 4), 0);
  assert.equal(keyShare(1, 0), 0);
  assert.deepEqual(keyGuests(second), ["North", "South"]);
  assert.deepEqual(keyTags(second), ["Press", "VIP"]);
  assert.deepEqual(keyWings(second), ["east", "west"]);
  assert.deepEqual(floorCounts(second), [0, 1, 0, 1]);
  assert.deepEqual(keyTimeline(second, "").map((card) => card.floor), [4, 11]);
  assert.deepEqual(keyTimeline([{ id: "z", text: "Open", guest: "", floor: 0, wing: "", suite: "", tag: "", rank: 0, issued: false, returned: false, spare: false, audit: "save" }, ...second], "note").map((card) => card.id), ["b"]);
  const blankFloor = [{ id: "z", text: "Open", guest: "", floor: 0, wing: "", suite: "", tag: "", rank: 0, issued: false, returned: false, spare: false, audit: "save" }];
  assert.deepEqual(keyTimeline([...blankFloor, ...saved], "").map((card) => card.id), ["a", "z"]);
  assert.equal(activeGuest("missing", ["North"]), "all");
  assert.equal(activeGuest("blank", ["North"]), "blank");
  assert.equal(guestArg("blank"), "");
  assert.equal(guestArg("all"), null);
  assert.equal(guestArg("North"), "North");
  assert.equal(activeWing("missing", ["east"]), "all");
  assert.equal(activeWing("blank", ["east"]), "blank");
  assert.equal(activeWing("east", ["east"]), "east");
  assert.equal(wingArg("blank"), "blank");
  assert.equal(wingArg("all"), null);
  assert.equal(wingArg("east"), "east");
  assert.equal(wingArg("up"), null);
  assert.equal(activeKeyTag("missing", ["VIP"]), "all");
  assert.equal(activeKeyTag("blank", ["VIP"]), "blank");
  assert.equal(keyTagArg("blank"), "");
  assert.equal(keyTagArg("all"), null);
  assert.equal(keyTagArg("VIP"), "VIP");
  assert.equal(activeFloor("nope"), "all");
  assert.equal(activeFloor("low"), "low");
  assert.equal(activeFloor("g2"), "g2");
  assert.equal(activeFloor("4"), "4");
  assert.equal(activeFloor("13"), "all");
  assert.deepEqual(floorArg("all"), { exact: null, band: null });
  assert.deepEqual(floorArg("high"), { exact: null, band: "high" });
  assert.deepEqual(floorArg("g4"), { exact: null, band: "g4" });
  assert.deepEqual(floorArg("11"), { exact: 11, band: null });
  assert.deepEqual(keyClashIds(second, "a"), []);
  const clash = addKey(saved, { id: "c", text: "Same suite", guest: "Other", floor: 4, wing: "east", suite: "12A" });
  assert.deepEqual(keyClashIds(clash, "a"), ["c"]);
  assert.deepEqual(keyClashIds([{ ...saved[0], suite: "" }, { ...saved[0], id: "d", text: "Twin" }], "a"), []);
  assert.equal(nextKey(second, 4), "a");
  assert.equal(nextKey(second, 10), "b");
  assert.equal(nextKey(second, 12), "a");
  assert.equal(nextKey(issued, 4), "");
  assert.equal(nextKey(second, ""), "");
  const views = addKeyView([], { id: "v", name: " Morning ", tray: "issued", query: " ada ", guest: "North", wing: "east", tag: "VIP", floor: "4" });
  assert.equal(views[0].name, "Morning");
  assert.equal(views[0].tray, "issued");
  assert.equal(views[0].floor, "4");
  assert.equal(addKeyView(views, { id: "w", name: "Morning", tray: "cut", query: "", guest: "all", wing: "all", tag: "all", floor: "all" }).length, 1);
  assert.equal(dropKeyView(views, "v").length, 0);
  assert.equal(readKeyViews([{ id: "v", name: "Morning", tray: "nope", floor: "nope" }])[0].tray, "cut");
  assert.equal(readKeyViews([{ id: "v", name: "Morning", tray: "nope", floor: "nope" }])[0].floor, "all");

  const rows = [
    { lastDevice: "mobile", label: "Ada" },
    { lastDevice: "mobile", label: "Ada Two" },
    { lastDevice: "iPhone", label: "Bea" },
    { lastDevice: "iPad", label: "Cio" },
    { lastDevice: "desktop", label: "Dia" },
    { lastDevice: "", label: "Eve" },
    { lastDevice: null, label: "Fay" },
    { lastDevice: "bot", label: "Gus" },
    { lastDevice: "unknown", label: "Hal" },
    { lastDevice: { lastDevice: "tablet", lastOs: "iPadOS" }, label: "Ian" },
    { lastDevice: { lastDevice: "Windows Phone" }, label: "Jen" },
  ];
  assert.equal(deviceText("  mobile  "), "mobile");
  assert.equal(deviceText({ lastDevice: "desktop" }), "desktop");
  assert.equal(deviceText({ lastDevice: "desktop", lastBrowser: "Chrome" }), "");
  assert.equal(deviceText({ lastOs: "Windows" }), "");
  assert.equal(deviceText(null), "");
  assert.equal(deviceClassOf("iPad"), "tablet");
  assert.equal(deviceClassOf("tablet"), "tablet");
  assert.equal(deviceClassOf("iPhone"), "mobile");
  assert.equal(deviceClassOf("mobile"), "mobile");
  assert.equal(deviceClassOf("Windows Phone"), "mobile");
  assert.equal(deviceClassOf("desktop"), "desktop");
  assert.equal(deviceClassOf("Macintosh"), "desktop");
  assert.equal(deviceClassOf("bot"), "bot");
  assert.equal(deviceClassOf("crawler"), "bot");
  assert.equal(deviceClassOf("unknown"), "other");
  assert.equal(deviceClassOf(""), "");
  assert.equal(deviceClassOf({ lastDevice: "mobile", lastCity: "Ada" }), "");
  assert.equal(deviceInitialOf("mobile"), "M");
  assert.equal(deviceInitialOf("3 Dock"), "#");
  assert.equal(deviceInitialOf(""), "");
  assert.equal(namedDevices(rows).includes("mobile"), true);
  assert.equal(namedDevices(rows).includes(""), false);
  assert.deepEqual(namedDeviceClasses(rows), ["mobile", "tablet", "desktop", "bot", "other"]);
  assert.equal(leadingDevice(rows), "mobile");
  assert.equal(leadingDeviceClass([{ lastDevice: "iPad" }, { lastDevice: "tablet" }]), "tablet");
  assert.equal(leadingDeviceInitial([{ lastDevice: "desktop" }, { lastDevice: "bot" }, { lastDevice: "" }]), "B");
  assert.equal(deviceShare(1, 4), 25);
  assert.equal(deviceShare(0, 4), 0);
  assert.deepEqual(readHiddenDevices(["mobile", "gone", "mobile"], ["mobile", "desktop"]), ["mobile"]);
  assert.deepEqual(toggleDevice(["mobile"], "desktop", ["mobile", "desktop"]), ["mobile", "desktop"]);
  assert.deepEqual(toggleDevice(["mobile"], "mobile", ["mobile"]), []);
  assert.deepEqual(visibleDevices(["mobile", "desktop"], ["desktop"], false), ["mobile"]);
  assert.deepEqual(visibleDevices(["mobile", "desktop"], ["desktop"], true), ["desktop"]);
  assert.equal(activeDevice("desktop", ["mobile"]), "");
  assert.equal(activeDevice("mobile", ["mobile"]), "mobile");
  assert.equal(activeDeviceClass("missing", ["mobile"]), "all");
  assert.equal(activeDeviceClass("blank", ["mobile"]), "blank");
  assert.equal(activeDeviceClass("tablet", ["tablet"]), "tablet");
  assert.equal(deviceClassArg("all"), null);
  assert.equal(deviceClassArg("blank"), "");
  assert.equal(deviceClassArg("bot"), "bot");
  assert.equal(deviceClassArg("nope"), null);
  assert.equal(activeDeviceInitial("missing", ["W"]), "all");
  assert.equal(activeDeviceInitial("blank", ["M"]), "blank");
  assert.equal(activeDeviceInitial("#", ["#"]), "#");
  assert.equal(activeDeviceInitial("#", ["M"]), "all");
  assert.equal(deviceInitialArg("all"), null);
  assert.equal(deviceInitialArg("blank"), "");
  assert.equal(deviceInitialArg("#"), "#");
  assert.equal(deviceInitialArg("m"), "M");
  const shown = visibleDeviceCustomers(rows, "", false, "mobile", null, "jen");
  assert.equal(shown.length, 1);
  assert.equal(shown[0].label, "Jen");
  assert.equal(visibleDeviceCustomers(rows, "", true, null, null, "eve").length, 1);
  assert.equal(visibleDeviceCustomers(rows, "iPad", false, null, null, "").length, 1);
  assert.equal(devicesCsv(rows).startsWith("device,class,initial,count\n"), true);
  assert.equal(devicesCsv([]), "device,class,initial,count");
  assert.equal(devicesCsv(rows).includes("amount"), false);
  assert.equal(deviceLines(rows).every((line) => !("amount" in line) && !("currency" in line)), true);
  assert.equal(deviceClassLines(rows).some((line) => line.className === "tablet"), true);
  assert.equal(namedDeviceInitials(rows).includes("M"), true);

  const copy = Object.keys(ROUND140_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND140_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "kcdTitle"), "Key cards");
  assert.equal(crmv4Text("tr", "dvcTitle"), ROUND140_COPY.tr.dvcTitle);
  assert.equal(crmv4Text("de", "kcdGuest"), ROUND140_COPY.de.kcdGuest);
  assert.equal(crmv4Text("ru", "dvcBlank"), ROUND140_COPY.ru.dvcBlank);
  assert.equal(crmv4Text("ar", "kcdNotice"), ROUND140_COPY.ar.kcdNotice);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-key/);
  assert.match(css, /\.c4-device/);
  assert.match(css, /\.c4-pagehead-gallery/);
  assert.match(css, /\.c4-rail-gallery/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round140.tsx"), "utf8");
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
  assert.match(view, /lastDevice/);
  assert.match(view, /keysCsv/);
  assert.match(view, /devicesCsv/);
  assert.match(view, /Escape/);
  assert.match(view, /event\.key !== "\/"/);
  assert.match(view, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(view, /data-key/);
  assert.match(view, /data-device/);
  assert.match(view, /data-logo="mono"/);
  assert.match(view, /customers/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "keys"/);
  assert.match(app, /view === "devices"/);
  assert.match(app, /c4-pagehead-gallery/);
  assert.match(app, /c4-rail-gallery/);
  assert.match(app, /c4-pagehead-salon/);
  console.log("crmv4 round140 tests passed");
}

main();
