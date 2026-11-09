/**
 * Place cards and last browsers.
 * Run: npx tsx tests/crmv4-round138.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND138_COPY } from "../src/lib/crmv4/copy-round138";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeBrowser,
  activeCourse,
  activeFamily,
  activeInitial,
  activeSeat,
  activeTable,
  activeTag,
  addPlace,
  addPlaceView,
  browserLines,
  browserShare,
  browserText,
  browsersCsv,
  bulkPlaceCleared,
  bulkPlaceSeated,
  courseArg,
  courseOf,
  dropPlaceView,
  editPlace,
  familyArg,
  familyLines,
  familyOf,
  initialArg,
  initialLines,
  initialOf,
  leadingBrowser,
  leadingFamily,
  leadingInitial,
  namedBrowsers,
  namedFamilies,
  namedInitials,
  nextPlace,
  placeClashIds,
  placeCopy,
  placeCounts,
  placeCourses,
  placeShare,
  placeTables,
  placeTags,
  placeText,
  placeTimeline,
  placesCsv,
  readHiddenBrowsers,
  readPlaceViews,
  readPlaces,
  resetPlaces,
  seatArg,
  seatBand,
  seatCount,
  seatCounts,
  seatGap,
  setPlaceCleared,
  setPlaceHush,
  setPlaceSeated,
  stepPlaceRank,
  tableArg,
  tableLabel,
  tagArg,
  tagLabel,
  toggleBrowser,
  visibleBrowserCustomers,
  visibleBrowsers,
  visiblePlaces,
} from "../src/lib/crmv4/round138";

function main() {
  assert.equal(placeText("  Meet\nAda  "), "Meet Ada");
  assert.equal(placeText("   "), "");
  assert.equal(placeText("x".repeat(140)).length, 96);
  assert.equal(tableLabel("  North  "), "North");
  assert.equal(tableLabel("   "), "");
  assert.equal(tableLabel("y".repeat(40)).length, 16);
  assert.equal(tagLabel("  VIP  "), "VIP");
  assert.equal(tagLabel("   "), "");
  assert.equal(tagLabel("z".repeat(30)).length, 12);
  assert.equal(seatCount(" 4 "), 4);
  assert.equal(seatCount(12), 12);
  assert.equal(seatCount(0), 0);
  assert.equal(seatCount(13), 0);
  assert.equal(seatCount(""), 0);
  assert.equal(seatCount("02"), 0);
  assert.equal(courseOf(" FIRST "), "first");
  assert.equal(courseOf("main"), "main");
  assert.equal(courseOf("last"), "last");
  assert.equal(courseOf(""), "blank");
  assert.equal(courseOf("supper"), "blank");
  assert.equal(seatBand(0), "blank");
  assert.equal(seatBand(1), "near");
  assert.equal(seatBand(4), "near");
  assert.equal(seatBand(5), "far");
  assert.equal(seatBand(12), "far");
  assert.equal(seatGap(3, 6), 3);
  assert.equal(seatGap(8, 4), -4);
  assert.equal(seatGap(4, 4), 0);
  assert.equal(seatGap(0, 4), null);
  assert.equal(seatGap(4, ""), null);
  assert.deepEqual(readPlaces([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Meet Ada", table: "  ", seat: 13, course: "supper", tag: "  ", rank: 3, seated: 1, cleared: 1, hush: 1, audit: "nope" }, "nope"]), [
    { id: "2", text: "Meet Ada", table: "", seat: 0, course: "", tag: "", rank: 0, seated: false, cleared: false, hush: false, audit: "" },
  ]);
  const saved = addPlace([], { id: "a", text: " Meet Ada ", table: " North ", seat: "2", course: " First ", tag: " VIP " });
  assert.deepEqual(saved, [{ id: "a", text: "Meet Ada", table: "North", seat: 2, course: "first", tag: "VIP", rank: 0, seated: false, cleared: false, hush: false, audit: "save" }]);
  assert.equal(addPlace(saved, { id: "b", text: "  " }).length, 1);
  assert.equal(addPlace(saved, { id: "c", text: "Meet Ada" }).length, 1);
  assert.equal(addPlace(saved, { id: "a", text: "Other note" }).length, 1);
  const raised = stepPlaceRank(saved, "a", 1);
  assert.equal(raised[0].rank, 1);
  assert.equal(raised[0].audit, "raise");
  const first = stepPlaceRank(raised, "a", 1);
  assert.equal(first[0].rank, 2);
  assert.equal(stepPlaceRank(first, "a", 1)[0].audit, "raise");
  const lowered = stepPlaceRank(first, "a", -1);
  assert.equal(lowered[0].rank, 1);
  assert.equal(lowered[0].audit, "lower");
  assert.equal(stepPlaceRank([{ ...saved[0], rank: 0 }], "a", -1)[0].audit, "save");
  const seated = setPlaceSeated(first, "a", true);
  assert.equal(seated[0].seated, true);
  assert.equal(seated[0].audit, "seat");
  const cleared = setPlaceCleared(seated, "a", true);
  assert.equal(cleared[0].cleared, true);
  assert.equal(cleared[0].audit, "clear");
  const hush = setPlaceHush(cleared, "a", true);
  assert.equal(hush[0].hush, true);
  assert.equal(hush[0].audit, "hush");
  const open = setPlaceHush(setPlaceCleared(setPlaceSeated(hush, "a", false), "a", false), "a", false);
  assert.equal(open[0].hush, false);
  assert.equal(open[0].cleared, false);
  assert.equal(open[0].seated, false);
  assert.equal(open[0].audit, "speak");
  assert.equal(editPlace(saved, "a", "  ")[0].text, "Meet Ada");
  assert.equal(editPlace(saved, "a", "Meet Ada")[0].audit, "save");
  const second = addPlace(saved, { id: "b", text: "Other note", table: "South", seat: 8, course: "main", tag: "Press" });
  assert.equal(editPlace(second, "b", "Meet Ada").find((card) => card.id === "b")?.text, "Other note");
  const edited = editPlace(second, "b", " Reworded note ");
  assert.equal(edited.find((card) => card.id === "b")?.text, "Reworded note");
  assert.equal(edited.find((card) => card.id === "b")?.audit, "edit");
  assert.deepEqual(visiblePlaces(saved, "waiting", "ada", null, null, null, null, null, false, false, "").map((card) => card.id), ["a"]);
  assert.deepEqual(visiblePlaces(saved, "waiting", "North", null, null, null, null, null, false, false, ""), []);
  assert.deepEqual(visiblePlaces(saved, "waiting", "VIP", null, null, null, null, null, false, false, ""), []);
  assert.deepEqual(visiblePlaces(saved, "waiting", "", "", null, null, null, null, false, false, ""), []);
  assert.deepEqual(visiblePlaces(saved, "waiting", "", "North", null, null, null, null, false, false, "").map((card) => card.id), ["a"]);
  assert.deepEqual(visiblePlaces(saved, "waiting", "", null, "first", null, null, null, false, false, "").map((card) => card.id), ["a"]);
  assert.deepEqual(visiblePlaces(saved, "waiting", "", null, "last", null, null, null, false, false, ""), []);
  assert.deepEqual(visiblePlaces(saved, "waiting", "", null, null, "VIP", null, null, false, false, "").map((card) => card.id), ["a"]);
  assert.deepEqual(visiblePlaces(saved, "waiting", "", null, null, "", null, null, false, false, ""), []);
  assert.deepEqual(visiblePlaces(saved, "waiting", "", null, null, null, null, "near", false, false, "").map((card) => card.id), ["a"]);
  assert.deepEqual(visiblePlaces(saved, "waiting", "", null, null, null, null, "far", false, false, ""), []);
  assert.deepEqual(visiblePlaces(saved, "waiting", "", null, null, null, 2, null, false, false, "").map((card) => card.id), ["a"]);
  assert.deepEqual(visiblePlaces(saved, "waiting", "", null, null, null, 3, null, false, false, ""), []);
  assert.deepEqual(visiblePlaces(saved, "waiting", "", null, null, null, null, "blank", false, false, ""), []);
  assert.deepEqual(visiblePlaces(first, "waiting", "", null, null, null, null, null, true, false, "").map((card) => card.id), ["a"]);
  assert.deepEqual(visiblePlaces(saved, "waiting", "", null, null, null, null, null, true, false, ""), []);
  assert.deepEqual(visiblePlaces(seated, "waiting", "", null, null, null, null, null, false, false, ""), []);
  assert.deepEqual(visiblePlaces(seated, "seated", "", null, null, null, null, null, false, false, "").map((card) => card.id), ["a"]);
  assert.deepEqual(visiblePlaces(cleared, "seated", "", null, null, null, null, null, false, false, ""), []);
  assert.deepEqual(visiblePlaces(cleared, "cleared", "", null, null, null, null, null, false, false, "").map((card) => card.id), ["a"]);
  const passed = addPlace(saved, { id: "l", text: "Passed note", seat: 1 });
  assert.deepEqual(visiblePlaces(passed, "waiting", "", null, null, null, null, null, false, true, "2").map((card) => card.id), ["l"]);
  assert.deepEqual(visiblePlaces(passed, "waiting", "", null, null, null, null, null, false, true, ""), []);
  const ranked = stepPlaceRank(second, "b", 1);
  assert.deepEqual(visiblePlaces(ranked, "waiting", "", null, null, null, null, null, false, false, "").map((card) => card.id), ["b", "a"]);
  const bulkSeat = bulkPlaceSeated(second, ["b", "missing"], true);
  assert.equal(bulkSeat.find((card) => card.id === "b")?.seated, true);
  assert.equal(bulkSeat.find((card) => card.id === "a")?.seated, false);
  assert.equal(bulkSeat.find((card) => card.id === "b")?.audit, "seat");
  const bulkClear = bulkPlaceCleared(second, ["a", "b"], true);
  assert.equal(bulkClear.every((card) => card.cleared), true);
  assert.equal(placeCopy("  Meet Ada "), "Meet Ada");
  assert.equal(placeCopy("   "), "");
  assert.deepEqual(resetPlaces(), []);
  const many = Array.from({ length: 40 }, (_, index) => ({ id: `n${index}`, text: `Note ${index}`, table: index % 2 ? "A" : "", seat: index % 3 ? 2 : 0 }));
  assert.equal(readPlaces(many).length, 36);
  assert.equal(placesCsv([{ id: "a", text: 'Meet "Ada"', table: "Table, 2", seat: 2, course: "first", tag: "VIP", rank: 2, seated: true, cleared: false, hush: true, audit: "save" }], "6").startsWith("text,table,seat,course,tag,band,rank,seated,cleared,hush,gap,audit\n"), true);
  assert.match(placesCsv(saved, "6"), /Meet Ada,North,2,first,VIP,near,0,0,0,0,4,save/);
  assert.equal(placesCsv([], "4"), "text,table,seat,course,tag,band,rank,seated,cleared,hush,gap,audit");
  assert.equal(placesCsv(saved, "").includes(",,"), true);
  assert.equal(placesCsv(saved, "4").includes("amount"), false);
  assert.deepEqual(placeCounts(cleared, "4"), { waiting: 0, seated: 0, cleared: 1, hush: 0, passed: 0 });
  assert.equal(placeCounts(first, "").waiting, 1);
  assert.equal(placeCounts(passed, "2").passed, 1);
  assert.equal(placeCounts(passed, "").passed, 0);
  assert.equal(placeShare(1, 4), 25);
  assert.equal(placeShare(0, 4), 0);
  assert.equal(placeShare(1, 0), 0);
  assert.deepEqual(placeTables(second), ["North", "South"]);
  assert.deepEqual(placeTags(second), ["Press", "VIP"]);
  assert.deepEqual(placeCourses(second), ["first", "main"]);
  assert.deepEqual(seatCounts(second).slice(0, 8), [0, 1, 0, 0, 0, 0, 0, 1]);
  assert.deepEqual(placeTimeline(second, "").map((card) => card.seat), [2, 8]);
  assert.deepEqual(placeTimeline([{ id: "z", text: "Open", table: "", seat: 0, course: "", tag: "", rank: 0, seated: false, cleared: false, hush: false, audit: "save" }, ...second], "note").map((card) => card.id), ["b"]);
  const blankSeat = addPlace([], { id: "z", text: "No seat" });
  assert.deepEqual(placeTimeline([...blankSeat, ...saved], "").map((card) => card.id), ["a", "z"]);
  assert.equal(activeTable("missing", ["North"]), "all");
  assert.equal(activeTable("blank", ["North"]), "blank");
  assert.equal(activeTable(" North ", ["North"]), "North");
  assert.equal(tableArg("all"), null);
  assert.equal(tableArg("blank"), "");
  assert.equal(tableArg(" North "), "North");
  assert.equal(activeCourse("missing", ["first"]), "all");
  assert.equal(activeCourse("blank", ["first"]), "blank");
  assert.equal(activeCourse("FIRST", ["first"]), "first");
  assert.equal(activeCourse("last", ["first"]), "all");
  assert.equal(courseArg("all"), null);
  assert.equal(courseArg("blank"), "blank");
  assert.equal(courseArg("main"), "main");
  assert.equal(courseArg("supper"), null);
  assert.equal(activeTag("missing", ["VIP"]), "all");
  assert.equal(activeTag("blank", ["VIP"]), "blank");
  assert.equal(activeTag(" VIP ", ["VIP"]), "VIP");
  assert.equal(tagArg("all"), null);
  assert.equal(tagArg("blank"), "");
  assert.equal(tagArg(" VIP "), "VIP");
  assert.equal(activeSeat("near"), "near");
  assert.equal(activeSeat("nope"), "all");
  assert.equal(activeSeat("8"), "8");
  assert.equal(activeSeat("13"), "all");
  assert.deepEqual(seatArg("far"), { exact: null, band: "far" });
  assert.deepEqual(seatArg("3"), { exact: 3, band: null });
  assert.deepEqual(seatArg("all"), { exact: null, band: null });
  const overlap = addPlace(saved, { id: "c", text: "Same table", table: "North", seat: 2 });
  assert.deepEqual(placeClashIds(overlap, "a"), ["c"]);
  assert.deepEqual(placeClashIds(overlap, "missing"), []);
  assert.deepEqual(placeClashIds(saved, "a"), []);
  assert.deepEqual(placeClashIds(addPlace([], { id: "d", text: "Open table", seat: 2 }), "d"), []);
  const later = addPlace(second, { id: "d", text: "Late seat", seat: 11 });
  assert.equal(nextPlace(later, "4"), "b");
  assert.equal(nextPlace(later, "9"), "d");
  assert.equal(nextPlace(later, "12"), "a");
  assert.equal(nextPlace(later, "2"), "a");
  assert.equal(nextPlace(later, ""), "");
  assert.equal(nextPlace(seated, "2"), "");
  const views = addPlaceView([], { id: "v1", name: " Near ", tray: "seated", query: " ada ", table: "North", course: "first", tag: "VIP", seat: "near" });
  assert.deepEqual(views, [{ id: "v1", name: "Near", tray: "seated", query: "ada", table: "North", course: "first", tag: "VIP", seat: "near" }]);
  assert.equal(addPlaceView(views, { id: "v2", name: " ", tray: "waiting", query: "", table: "all", course: "all", tag: "all", seat: "all" }).length, 1);
  assert.equal(addPlaceView(views, { id: "v2", name: "Near", tray: "waiting", query: "", table: "all", course: "all", tag: "all", seat: "all" }).length, 1);
  assert.equal(dropPlaceView(views, "v1").length, 0);
  assert.equal(readPlaceViews([{ id: "v3", name: "Open", tray: "nope", table: "blank", course: "blank", tag: "blank", seat: "nope" }])[0].tray, "waiting");
  assert.equal(readPlaceViews([{ id: "v3", name: "Open", tray: "waiting", table: "blank", course: "nope", tag: "blank", seat: "8" }])[0].course, "all");
  assert.equal(readPlaceViews([{ id: "v3", name: "Open", tray: "waiting", seat: "8" }])[0].seat, "8");
  assert.equal(readPlaceViews(Array.from({ length: 20 }, (_, index) => ({ id: `v${index}`, name: `View ${index}`, tray: "waiting" }))).length, 12);

  assert.equal(browserText(" Chrome "), "Chrome");
  assert.equal(browserText({ lastBrowser: " Safari " }), "Safari");
  assert.equal(browserText(""), "");
  assert.equal(browserText(1 as never), "");
  assert.equal(browserText({ language: "en" }), "");
  assert.equal(browserText({ country: "TR" }), "");
  assert.equal(browserText({ registrationCountry: "TR" }), "");
  assert.equal(browserText({ timezone: "UTC" }), "");
  assert.equal(browserText({ lastCountry: "TR" }), "");
  assert.equal(browserText({ lastCountryName: "Turkey" }), "");
  assert.equal(browserText({ lastRegion: "Marmara" }), "");
  assert.equal(browserText({ lastDevice: "mobile" }), "");
  assert.equal(browserText({ lastOs: "iOS" }), "");
  assert.equal(browserText({ lastCity: "Istanbul" }), "");
  assert.equal(browserText({ lastIp: "1.1.1.1" }), "");
  assert.equal(browserText({ desk: "Istanbul" }), "");
  assert.equal(browserText({ deskId: "d1" }), "");
  assert.equal(browserText({ campaign: "Spring" }), "");
  assert.equal(browserText({ phone: "+90" }), "");
  assert.equal(browserText({ tradingServer: "MT5" }), "");
  assert.equal(browserText({ tradingGroup: "VIP" }), "");
  assert.equal(browserText({ brokerName: "ING" }), "");
  assert.equal(browserText({ assigneeName: "Ada" }), "");
  assert.equal(browserText({ saleStatus: "NEW" }), "");
  assert.equal(browserText({ retentionStatus: "ACTIVE" }), "");
  assert.equal(browserText({ potentialStatus: "HIGH" }), "");
  assert.equal(browserText({ documentsStatus: "APPROVED" }), "");
  assert.equal(browserText({ accountType: "VIP" }), "");
  assert.equal(browserText({ role: "TRADER" }), "");
  assert.equal(browserText({ validation: "VERIFIED" }), "");
  assert.equal(browserText({ validationStatus: "VERIFIED" }), "");
  assert.equal(browserText({ referralCodeUsed: "INVITE" }), "");
  assert.equal(browserText({ city: "Istanbul" }), "");
  assert.equal(browserText({ lastBrowser: "Chrome", lastOs: "iOS" }), "");
  assert.equal(familyOf("Chrome"), "chrome");
  assert.equal(familyOf("Microsoft Edge"), "edge");
  assert.equal(familyOf("Safari"), "safari");
  assert.equal(familyOf("Firefox"), "firefox");
  assert.equal(familyOf("Samsung Internet"), "other");
  assert.equal(familyOf(""), "");
  assert.equal(familyOf({ lastOs: "iOS" }), "");
  assert.equal(initialOf("chrome"), "C");
  assert.equal(initialOf("3 Dock"), "#");
  assert.equal(initialOf(""), "");
  assert.equal(initialOf({ lastBrowser: "safari" }), "S");
  const rows = [
    { id: "u1", label: "Ada", lastBrowser: "Chrome" },
    { id: "u2", label: "Bea", lastBrowser: { lastBrowser: "Safari" } },
    { id: "u3", label: "Cid", lastBrowser: "Chrome" },
    { id: "u4", label: "Dot", lastBrowser: "" },
    { id: "u5", label: "Eve", lastBrowser: "3 Dock" },
    { id: "u6", label: "Fay", lastBrowser: { lastOs: "iOS" } as never },
  ];
  assert.deepEqual(browserLines(rows), [
    { browser: "", family: "", initial: "", count: 2 },
    { browser: "3 Dock", family: "other", initial: "#", count: 1 },
    { browser: "Chrome", family: "chrome", initial: "C", count: 2 },
    { browser: "Safari", family: "safari", initial: "S", count: 1 },
  ]);
  assert.deepEqual(namedBrowsers(rows), ["3 Dock", "Chrome", "Safari"]);
  assert.deepEqual(familyLines(rows), [
    { family: "", count: 2 },
    { family: "chrome", count: 2 },
    { family: "safari", count: 1 },
    { family: "other", count: 1 },
  ]);
  assert.deepEqual(namedFamilies(rows), ["chrome", "safari", "other"]);
  assert.deepEqual(initialLines(rows), [
    { initial: "", count: 2 },
    { initial: "C", count: 2 },
    { initial: "S", count: 1 },
    { initial: "#", count: 1 },
  ]);
  assert.deepEqual(namedInitials(rows), ["C", "S", "#"]);
  assert.equal(browserShare(2, 6), 33);
  assert.equal(browserShare(0, 6), 0);
  assert.equal(browserShare(1, 0), 0);
  assert.equal(leadingBrowser(rows), "Chrome");
  assert.equal(leadingBrowser([{ lastBrowser: "" }]), "");
  assert.equal(leadingBrowser([{ lastBrowser: "Safari" }, { lastBrowser: "Chrome" }]), "Chrome");
  assert.equal(leadingFamily(rows), "chrome");
  assert.equal(leadingFamily([{ lastBrowser: "" }]), "");
  assert.equal(leadingInitial(rows), "C");
  assert.equal(leadingInitial([{ lastBrowser: "" }]), "");
  assert.deepEqual(visibleBrowserCustomers(rows, "Chrome", false, null, null, "ada").map((row) => row.id), ["u1"]);
  assert.deepEqual(visibleBrowserCustomers(rows, "", true, null, null, "").map((row) => row.id), ["u4", "u6"]);
  assert.deepEqual(visibleBrowserCustomers(rows, "", false, "chrome", null, "").map((row) => row.id), ["u1", "u3"]);
  assert.deepEqual(visibleBrowserCustomers(rows, "", false, null, "C", "").map((row) => row.id), ["u1", "u3"]);
  assert.deepEqual(visibleBrowserCustomers(rows, "", false, null, "", "").map((row) => row.id), ["u4", "u6"]);
  assert.deepEqual(visibleBrowserCustomers(rows, "", false, null, "#", "").map((row) => row.id), ["u5"]);
  assert.deepEqual(visibleBrowserCustomers(rows, "Chrome", false, null, null, "chrome"), []);
  assert.deepEqual(readHiddenBrowsers(["Chrome", "OLD", ""], ["Chrome", "Safari"]), ["Chrome"]);
  assert.deepEqual(toggleBrowser(["Chrome"], "OLD", ["Chrome"]), ["Chrome"]);
  assert.deepEqual(visibleBrowsers(["Chrome", "Safari"], ["Safari"], false), ["Chrome"]);
  assert.equal(activeBrowser("Safari", ["Chrome"]), "");
  assert.equal(activeFamily("missing", ["chrome"]), "all");
  assert.equal(activeFamily("blank", ["chrome"]), "blank");
  assert.equal(activeFamily("chrome", ["chrome"]), "chrome");
  assert.equal(familyArg("all"), null);
  assert.equal(familyArg("blank"), "");
  assert.equal(familyArg("edge"), "edge");
  assert.equal(familyArg("nope"), null);
  assert.equal(activeInitial("missing", ["C"]), "all");
  assert.equal(activeInitial("blank", ["C"]), "blank");
  assert.equal(activeInitial("#", ["#"]), "#");
  assert.equal(activeInitial("#", ["C"]), "all");
  assert.equal(initialArg("all"), null);
  assert.equal(initialArg("blank"), "");
  assert.equal(initialArg("#"), "#");
  assert.equal(initialArg("c"), "C");
  assert.equal(browsersCsv(rows), "browser,family,initial,count\n,,,2\n3 Dock,other,#,1\nChrome,chrome,C,2\nSafari,safari,S,1");
  assert.equal(browsersCsv([]), "browser,family,initial,count");
  assert.equal(browsersCsv(rows).includes("amount"), false);
  assert.equal(browserLines(rows).every((line) => !("amount" in line) && !("currency" in line)), true);

  const copy = Object.keys(ROUND138_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND138_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "plcTitle"), "Place cards");
  assert.equal(crmv4Text("tr", "brwTitle"), ROUND138_COPY.tr.brwTitle);
  assert.equal(crmv4Text("de", "plcTable"), ROUND138_COPY.de.plcTable);
  assert.equal(crmv4Text("ru", "brwBlank"), ROUND138_COPY.ru.brwBlank);
  assert.equal(crmv4Text("ar", "plcNotice"), ROUND138_COPY.ar.plcNotice);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-place/);
  assert.match(css, /\.c4-browser/);
  assert.match(css, /\.c4-pagehead-atelier/);
  assert.match(css, /\.c4-rail-crest/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round138.tsx"), "utf8");
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
  assert.match(view, /lastBrowser/);
  assert.match(view, /placesCsv/);
  assert.match(view, /browsersCsv/);
  assert.match(view, /Escape/);
  assert.match(view, /event\.key !== "\/"/);
  assert.match(view, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(view, /data-place/);
  assert.match(view, /data-browser/);
  assert.match(view, /data-logo="mono"/);
  assert.match(view, /customers/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "place"/);
  assert.match(app, /view === "browsers"/);
  assert.match(app, /c4-pagehead-atelier/);
  assert.match(app, /c4-rail-crest/);
  assert.match(app, /c4-pagehead-crest/);
  console.log("crmv4 round138 tests passed");
}

main();
