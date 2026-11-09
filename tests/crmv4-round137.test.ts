/**
 * Arrival cards and last cities.
 * Run: npx tsx tests/crmv4-round137.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND137_COPY } from "../src/lib/crmv4/copy-round137";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeArrivalBand,
  activeCity,
  activeDoor,
  activeInitial,
  activeParty,
  activeTag,
  addArrival,
  addArrivalView,
  arrivalBandArg,
  arrivalBands,
  arrivalClashIds,
  arrivalCopy,
  arrivalCounts,
  arrivalDoors,
  arrivalShare,
  arrivalTags,
  arrivalText,
  arrivalTimeline,
  arrivalsCsv,
  bandOf,
  bulkArrivalGreeted,
  bulkArrivalHeld,
  citiesCsv,
  cityLines,
  cityShare,
  cityText,
  clockLabel,
  clockMinutes,
  doorArg,
  doorLabel,
  dropArrivalView,
  editArrival,
  initialArg,
  initialLines,
  initialOf,
  leadingCity,
  leadingInitial,
  namedCities,
  namedInitials,
  nextArrival,
  partyArg,
  partyCount,
  readArrivalViews,
  readArrivals,
  readHiddenCities,
  resetArrivals,
  setArrivalGreeted,
  setArrivalHeld,
  setArrivalHush,
  stepArrivalRank,
  tagArg,
  tagLabel,
  toggleCity,
  visibleArrivals,
  visibleCities,
  visibleCityCustomers,
  waitMinutes,
} from "../src/lib/crmv4/round137";

function main() {
  assert.equal(arrivalText("  Meet\nAda  "), "Meet Ada");
  assert.equal(arrivalText("   "), "");
  assert.equal(arrivalText("x".repeat(140)).length, 96);
  assert.equal(doorLabel("  North  "), "North");
  assert.equal(doorLabel("   "), "");
  assert.equal(doorLabel("y".repeat(40)).length, 16);
  assert.equal(tagLabel("  VIP  "), "VIP");
  assert.equal(tagLabel("   "), "");
  assert.equal(tagLabel("z".repeat(30)).length, 12);
  assert.equal(clockLabel(" 09:10 "), "09:10");
  assert.equal(clockLabel("   "), "");
  assert.equal(clockLabel("t".repeat(20)).length, 5);
  assert.equal(partyCount(" 4 "), 4);
  assert.equal(partyCount(8), 8);
  assert.equal(partyCount(0), 0);
  assert.equal(partyCount(9), 0);
  assert.equal(partyCount(""), 0);
  assert.equal(partyCount("02"), 0);
  assert.equal(clockMinutes("09:10"), 550);
  assert.equal(clockMinutes("9:10"), null);
  assert.equal(clockMinutes("25:00"), null);
  assert.equal(clockMinutes(""), null);
  assert.equal(bandOf("09:00"), "morning");
  assert.equal(bandOf("13:00"), "afternoon");
  assert.equal(bandOf("18:00"), "evening");
  assert.equal(bandOf(""), "blank");
  assert.equal(bandOf("99:99"), "blank");
  assert.equal(waitMinutes("09:00", "09:20"), 20);
  assert.equal(waitMinutes("10:00", "09:40"), -20);
  assert.equal(waitMinutes("09:00", "09:00"), 0);
  assert.equal(waitMinutes("09:00", ""), null);
  assert.equal(waitMinutes("", "09:00"), null);
  assert.deepEqual(readArrivals([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Meet Ada", door: "  ", clock: "  ", party: 9, tag: "  ", rank: 3, held: 1, greeted: 1, hush: 1, audit: "nope" }, "nope"]), [
    { id: "2", text: "Meet Ada", door: "", clock: "", party: 0, tag: "", rank: 0, held: false, greeted: false, hush: false, audit: "" },
  ]);
  const saved = addArrival([], { id: "a", text: " Meet Ada ", door: " North ", clock: " 09:00 ", party: "2", tag: " VIP " });
  assert.deepEqual(saved, [{ id: "a", text: "Meet Ada", door: "North", clock: "09:00", party: 2, tag: "VIP", rank: 0, held: false, greeted: false, hush: false, audit: "save" }]);
  assert.equal(addArrival(saved, { id: "b", text: "  " }).length, 1);
  assert.equal(addArrival(saved, { id: "c", text: "Meet Ada" }).length, 1);
  assert.equal(addArrival(saved, { id: "a", text: "Other note" }).length, 1);
  const raised = stepArrivalRank(saved, "a", 1);
  assert.equal(raised[0].rank, 1);
  assert.equal(raised[0].audit, "raise");
  const first = stepArrivalRank(raised, "a", 1);
  assert.equal(first[0].rank, 2);
  assert.equal(stepArrivalRank(first, "a", 1)[0].audit, "raise");
  const lowered = stepArrivalRank(first, "a", -1);
  assert.equal(lowered[0].rank, 1);
  assert.equal(lowered[0].audit, "lower");
  assert.equal(stepArrivalRank([{ ...saved[0], rank: 0 }], "a", -1)[0].audit, "save");
  const held = setArrivalHeld(first, "a", true);
  assert.equal(held[0].held, true);
  assert.equal(held[0].audit, "hold");
  const greeted = setArrivalGreeted(held, "a", true);
  assert.equal(greeted[0].greeted, true);
  assert.equal(greeted[0].audit, "greet");
  const hush = setArrivalHush(greeted, "a", true);
  assert.equal(hush[0].hush, true);
  assert.equal(hush[0].audit, "hush");
  const open = setArrivalHush(setArrivalGreeted(setArrivalHeld(hush, "a", false), "a", false), "a", false);
  assert.equal(open[0].hush, false);
  assert.equal(open[0].greeted, false);
  assert.equal(open[0].held, false);
  assert.equal(open[0].audit, "speak");
  assert.equal(editArrival(saved, "a", "  ")[0].text, "Meet Ada");
  assert.equal(editArrival(saved, "a", "Meet Ada")[0].audit, "save");
  const second = addArrival(saved, { id: "b", text: "Other note", door: "South", clock: "15:00", party: 1, tag: "Press" });
  assert.equal(editArrival(second, "b", "Meet Ada").find((card) => card.id === "b")?.text, "Other note");
  const edited = editArrival(second, "b", " Reworded note ");
  assert.equal(edited.find((card) => card.id === "b")?.text, "Reworded note");
  assert.equal(edited.find((card) => card.id === "b")?.audit, "edit");
  assert.deepEqual(visibleArrivals(saved, "waiting", "ada", null, null, null, null, false, false, "").map((card) => card.id), ["a"]);
  assert.deepEqual(visibleArrivals(saved, "waiting", "North", null, null, null, null, false, false, ""), []);
  assert.deepEqual(visibleArrivals(saved, "waiting", "VIP", null, null, null, null, false, false, ""), []);
  assert.deepEqual(visibleArrivals(saved, "waiting", "", "", null, null, null, false, false, ""), []);
  assert.deepEqual(visibleArrivals(saved, "waiting", "", "North", null, null, null, false, false, "").map((card) => card.id), ["a"]);
  assert.deepEqual(visibleArrivals(saved, "waiting", "", null, "morning", null, null, false, false, "").map((card) => card.id), ["a"]);
  assert.deepEqual(visibleArrivals(saved, "waiting", "", null, "evening", null, null, false, false, ""), []);
  assert.deepEqual(visibleArrivals(saved, "waiting", "", null, null, "VIP", null, false, false, "").map((card) => card.id), ["a"]);
  assert.deepEqual(visibleArrivals(saved, "waiting", "", null, null, "", null, false, false, ""), []);
  assert.deepEqual(visibleArrivals(saved, "waiting", "", null, null, null, "solo", false, false, ""), []);
  assert.deepEqual(visibleArrivals(second, "waiting", "", null, null, null, "solo", false, false, "").map((card) => card.id), ["b"]);
  const crowd = addArrival(saved, { id: "c", text: "Crowd note", party: 5 });
  assert.deepEqual(visibleArrivals(crowd, "waiting", "", null, null, null, "crowd", false, false, "").map((card) => card.id), ["c"]);
  assert.deepEqual(visibleArrivals(crowd, "waiting", "", null, null, null, "blank", false, false, ""), []);
  assert.deepEqual(visibleArrivals(first, "waiting", "", null, null, null, null, true, false, "").map((card) => card.id), ["a"]);
  assert.deepEqual(visibleArrivals(saved, "waiting", "", null, null, null, null, true, false, ""), []);
  assert.deepEqual(visibleArrivals(held, "waiting", "", null, null, null, null, false, false, ""), []);
  assert.deepEqual(visibleArrivals(held, "held", "", null, null, null, null, false, false, "").map((card) => card.id), ["a"]);
  assert.deepEqual(visibleArrivals(greeted, "held", "", null, null, null, null, false, false, ""), []);
  assert.deepEqual(visibleArrivals(greeted, "greeted", "", null, null, null, null, false, false, "").map((card) => card.id), ["a"]);
  const late = addArrival(saved, { id: "l", text: "Late note", clock: "08:00" });
  assert.deepEqual(visibleArrivals(late, "waiting", "", null, null, null, null, false, true, "09:00").map((card) => card.id), ["l"]);
  assert.deepEqual(visibleArrivals(late, "waiting", "", null, null, null, null, false, true, ""), []);
  const ranked = stepArrivalRank(second, "b", 1);
  assert.deepEqual(visibleArrivals(ranked, "waiting", "", null, null, null, null, false, false, "").map((card) => card.id), ["b", "a"]);
  const bulkHold = bulkArrivalHeld(second, ["b", "missing"], true);
  assert.equal(bulkHold.find((card) => card.id === "b")?.held, true);
  assert.equal(bulkHold.find((card) => card.id === "a")?.held, false);
  assert.equal(bulkHold.find((card) => card.id === "b")?.audit, "hold");
  const bulkGreet = bulkArrivalGreeted(second, ["a", "b"], true);
  assert.equal(bulkGreet.every((card) => card.greeted), true);
  assert.equal(arrivalCopy("  Meet Ada "), "Meet Ada");
  assert.equal(arrivalCopy("   "), "");
  assert.deepEqual(resetArrivals(), []);
  const many = Array.from({ length: 40 }, (_, index) => ({ id: `n${index}`, text: `Note ${index}`, door: index % 2 ? "A" : "", clock: index % 3 ? "09:10" : "" }));
  assert.equal(readArrivals(many).length, 36);
  assert.equal(arrivalsCsv([{ id: "a", text: 'Meet "Ada"', door: "Door, 2", clock: "09:00", party: 2, tag: "VIP", rank: 2, held: true, greeted: false, hush: true, audit: "save" }], "09:20").startsWith("text,door,clock,party,tag,band,rank,held,greeted,hush,wait,audit\n"), true);
  assert.match(arrivalsCsv(saved, "09:20"), /Meet Ada,North,09:00,2,VIP,morning,0,0,0,0,20,save/);
  assert.equal(arrivalsCsv([], "09:00"), "text,door,clock,party,tag,band,rank,held,greeted,hush,wait,audit");
  assert.equal(arrivalsCsv(saved, "").includes(",,"), true);
  assert.equal(arrivalsCsv(saved, "09:00").includes("amount"), false);
  assert.deepEqual(arrivalCounts(greeted, "09:00"), { waiting: 0, held: 0, greeted: 1, hush: 0, late: 0 });
  assert.equal(arrivalCounts(first, "").waiting, 1);
  assert.equal(arrivalCounts(late, "09:00").late, 1);
  assert.equal(arrivalCounts(late, "").late, 0);
  assert.equal(arrivalShare(1, 4), 25);
  assert.equal(arrivalShare(0, 4), 0);
  assert.equal(arrivalShare(1, 0), 0);
  assert.deepEqual(arrivalDoors(second), ["North", "South"]);
  assert.deepEqual(arrivalTags(second), ["Press", "VIP"]);
  assert.deepEqual(arrivalBands(late), ["morning"]);
  assert.deepEqual(arrivalTimeline(second, "").map((card) => card.clock), ["09:00", "15:00"]);
  assert.deepEqual(arrivalTimeline([{ id: "z", text: "Late", door: "", clock: "", party: 0, tag: "", rank: 0, held: false, greeted: false, hush: false, audit: "save" }, ...second], "note").map((card) => card.id), ["b"]);
  const blankClock = addArrival([], { id: "z", text: "No clock" });
  assert.deepEqual(arrivalTimeline([...blankClock, ...saved], "").map((card) => card.id), ["a", "z"]);
  assert.equal(activeDoor("missing", ["North"]), "all");
  assert.equal(activeDoor("blank", ["North"]), "blank");
  assert.equal(activeDoor(" North ", ["North"]), "North");
  assert.equal(doorArg("all"), null);
  assert.equal(doorArg("blank"), "");
  assert.equal(doorArg(" North "), "North");
  assert.equal(activeTag("missing", ["VIP"]), "all");
  assert.equal(activeTag("blank", ["VIP"]), "blank");
  assert.equal(activeTag(" VIP ", ["VIP"]), "VIP");
  assert.equal(tagArg("all"), null);
  assert.equal(tagArg("blank"), "");
  assert.equal(tagArg(" VIP "), "VIP");
  assert.equal(activeArrivalBand("missing", ["morning"]), "all");
  assert.equal(activeArrivalBand("blank", ["morning"]), "blank");
  assert.equal(activeArrivalBand("morning", ["morning"]), "morning");
  assert.equal(activeArrivalBand("evening", ["morning"]), "all");
  assert.equal(arrivalBandArg("all"), null);
  assert.equal(arrivalBandArg("blank"), "blank");
  assert.equal(arrivalBandArg("morning"), "morning");
  assert.equal(arrivalBandArg("overnight"), null);
  assert.equal(activeParty("solo"), "solo");
  assert.equal(activeParty("nope"), "all");
  assert.equal(partyArg("crowd"), "crowd");
  assert.equal(partyArg("all"), null);
  const overlap = addArrival(saved, { id: "c", text: "Same door", door: "North", clock: "09:00" });
  assert.deepEqual(arrivalClashIds(overlap, "a"), ["c"]);
  assert.deepEqual(arrivalClashIds(overlap, "missing"), []);
  assert.deepEqual(arrivalClashIds(saved, "a"), []);
  assert.deepEqual(arrivalClashIds(addArrival([], { id: "d", text: "Open door", clock: "09:00" }), "d"), []);
  const later = addArrival(second, { id: "d", text: "Late call", clock: "18:00" });
  assert.equal(nextArrival(later, "10:00"), "b");
  assert.equal(nextArrival(later, "16:00"), "d");
  assert.equal(nextArrival(later, "19:00"), "a");
  assert.equal(nextArrival(later, "09:00"), "a");
  assert.equal(nextArrival(later, ""), "");
  assert.equal(nextArrival(held, "09:00"), "");
  const views = addArrivalView([], { id: "v1", name: " Morning ", tray: "held", query: " ada ", door: "North", band: "morning", tag: "VIP", party: "solo" });
  assert.deepEqual(views, [{ id: "v1", name: "Morning", tray: "held", query: "ada", door: "North", band: "morning", tag: "VIP", party: "solo" }]);
  assert.equal(addArrivalView(views, { id: "v2", name: " ", tray: "waiting", query: "", door: "all", band: "all", tag: "all", party: "all" }).length, 1);
  assert.equal(addArrivalView(views, { id: "v2", name: "Morning", tray: "waiting", query: "", door: "all", band: "all", tag: "all", party: "all" }).length, 1);
  assert.equal(dropArrivalView(views, "v1").length, 0);
  assert.equal(readArrivalViews([{ id: "v3", name: "Open", tray: "nope", door: "blank", band: "blank", tag: "blank", party: "nope" }])[0].tray, "waiting");
  assert.equal(readArrivalViews([{ id: "v3", name: "Open", tray: "waiting", door: "blank", band: "nope", tag: "blank", party: "crowd" }])[0].band, "all");
  assert.equal(readArrivalViews([{ id: "v3", name: "Open", tray: "waiting", party: "crowd" }])[0].party, "crowd");
  assert.equal(readArrivalViews(Array.from({ length: 20 }, (_, index) => ({ id: `v${index}`, name: `View ${index}`, tray: "waiting" }))).length, 12);

  assert.equal(cityText(" Istanbul "), "Istanbul");
  assert.equal(cityText({ lastCity: " Paris " }), "Paris");
  assert.equal(cityText(""), "");
  assert.equal(cityText(1 as never), "");
  assert.equal(cityText({ language: "en" }), "");
  assert.equal(cityText({ country: "TR" }), "");
  assert.equal(cityText({ registrationCountry: "TR" }), "");
  assert.equal(cityText({ timezone: "UTC" }), "");
  assert.equal(cityText({ lastCountry: "TR" }), "");
  assert.equal(cityText({ lastCountryName: "Turkey" }), "");
  assert.equal(cityText({ lastRegion: "Marmara" }), "");
  assert.equal(cityText({ lastDevice: "mobile" }), "");
  assert.equal(cityText({ lastBrowser: "Safari" }), "");
  assert.equal(cityText({ lastOs: "iOS" }), "");
  assert.equal(cityText({ desk: "Istanbul" }), "");
  assert.equal(cityText({ deskId: "d1" }), "");
  assert.equal(cityText({ campaign: "Spring" }), "");
  assert.equal(cityText({ phone: "+90" }), "");
  assert.equal(cityText({ tradingServer: "MT5" }), "");
  assert.equal(cityText({ tradingGroup: "VIP" }), "");
  assert.equal(cityText({ brokerName: "ING" }), "");
  assert.equal(cityText({ assigneeName: "Ada" }), "");
  assert.equal(cityText({ saleStatus: "NEW" }), "");
  assert.equal(cityText({ retentionStatus: "ACTIVE" }), "");
  assert.equal(cityText({ potentialStatus: "HIGH" }), "");
  assert.equal(cityText({ documentsStatus: "APPROVED" }), "");
  assert.equal(cityText({ accountType: "VIP" }), "");
  assert.equal(cityText({ role: "TRADER" }), "");
  assert.equal(cityText({ validation: "VERIFIED" }), "");
  assert.equal(cityText({ validationStatus: "VERIFIED" }), "");
  assert.equal(cityText({ referralCodeUsed: "INVITE" }), "");
  assert.equal(cityText({ city: "Istanbul" }), "");
  assert.equal(cityText({ lastCity: "Istanbul", timezone: "UTC" }), "");
  assert.equal(initialOf("istanbul"), "I");
  assert.equal(initialOf("3 Dock"), "#");
  assert.equal(initialOf(""), "");
  assert.equal(initialOf({ lastCity: "ankara" }), "A");
  const rows = [
    { id: "u1", label: "Ada", lastCity: "Istanbul" },
    { id: "u2", label: "Bea", lastCity: { lastCity: "Paris" } },
    { id: "u3", label: "Cid", lastCity: "Istanbul" },
    { id: "u4", label: "Dot", lastCity: "" },
    { id: "u5", label: "Eve", lastCity: "3 Dock" },
    { id: "u6", label: "Fay", lastCity: { timezone: "UTC" } as never },
  ];
  assert.deepEqual(cityLines(rows), [
    { city: "", initial: "", count: 2 },
    { city: "3 Dock", initial: "#", count: 1 },
    { city: "Istanbul", initial: "I", count: 2 },
    { city: "Paris", initial: "P", count: 1 },
  ]);
  assert.deepEqual(namedCities(rows), ["3 Dock", "Istanbul", "Paris"]);
  assert.deepEqual(initialLines(rows), [
    { initial: "", count: 2 },
    { initial: "I", count: 2 },
    { initial: "P", count: 1 },
    { initial: "#", count: 1 },
  ]);
  assert.deepEqual(namedInitials(rows), ["I", "P", "#"]);
  assert.equal(cityShare(2, 6), 33);
  assert.equal(cityShare(0, 6), 0);
  assert.equal(cityShare(1, 0), 0);
  assert.equal(leadingCity(rows), "Istanbul");
  assert.equal(leadingCity([{ lastCity: "" }]), "");
  assert.equal(leadingCity([{ lastCity: "Paris" }, { lastCity: "Ankara" }]), "Ankara");
  assert.equal(leadingInitial(rows), "I");
  assert.equal(leadingInitial([{ lastCity: "" }]), "");
  assert.deepEqual(visibleCityCustomers(rows, "Istanbul", false, null, "ada").map((row) => row.id), ["u1"]);
  assert.deepEqual(visibleCityCustomers(rows, "", true, null, "").map((row) => row.id), ["u4", "u6"]);
  assert.deepEqual(visibleCityCustomers(rows, "", false, "I", "").map((row) => row.id), ["u1", "u3"]);
  assert.deepEqual(visibleCityCustomers(rows, "", false, "", "").map((row) => row.id), ["u4", "u6"]);
  assert.deepEqual(visibleCityCustomers(rows, "", false, "#", "").map((row) => row.id), ["u5"]);
  assert.deepEqual(visibleCityCustomers(rows, "Istanbul", false, null, "istanbul"), []);
  assert.deepEqual(readHiddenCities(["Istanbul", "OLD", ""], ["Istanbul", "Paris"]), ["Istanbul"]);
  assert.deepEqual(toggleCity(["Istanbul"], "OLD", ["Istanbul"]), ["Istanbul"]);
  assert.deepEqual(visibleCities(["Istanbul", "Paris"], ["Paris"], false), ["Istanbul"]);
  assert.equal(activeCity("Paris", ["Istanbul"]), "");
  assert.equal(activeInitial("missing", ["I"]), "all");
  assert.equal(activeInitial("blank", ["I"]), "blank");
  assert.equal(activeInitial("#", ["#"]), "#");
  assert.equal(activeInitial("#", ["I"]), "all");
  assert.equal(initialArg("all"), null);
  assert.equal(initialArg("blank"), "");
  assert.equal(initialArg("#"), "#");
  assert.equal(initialArg("i"), "I");
  assert.equal(citiesCsv(rows), "city,initial,count\n,,2\n3 Dock,#,1\nIstanbul,I,2\nParis,P,1");
  assert.equal(citiesCsv([]), "city,initial,count");
  assert.equal(citiesCsv(rows).includes("amount"), false);
  assert.equal(cityLines(rows).every((line) => !("amount" in line) && !("currency" in line)), true);

  const copy = Object.keys(ROUND137_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND137_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "arrTitle"), "Arrival cards");
  assert.equal(crmv4Text("tr", "citTitle"), ROUND137_COPY.tr.citTitle);
  assert.equal(crmv4Text("de", "arrDoor"), ROUND137_COPY.de.arrDoor);
  assert.equal(crmv4Text("ru", "citBlank"), ROUND137_COPY.ru.citBlank);
  assert.equal(crmv4Text("ar", "arrNotice"), ROUND137_COPY.ar.arrNotice);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-arrival/);
  assert.match(css, /\.c4-city/);
  assert.match(css, /\.c4-foot-crest/);
  assert.match(css, /\.c4-fresh-crest/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round137.tsx"), "utf8");
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
  assert.match(view, /lastCity/);
  assert.match(view, /arrivalsCsv/);
  assert.match(view, /citiesCsv/);
  assert.match(view, /Escape/);
  assert.match(view, /event\.key !== "\/"/);
  assert.match(view, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(view, /data-arrival/);
  assert.match(view, /data-city/);
  assert.match(view, /data-logo="mono"/);
  assert.match(view, /customers/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "arrival"/);
  assert.match(app, /view === "cities"/);
  assert.match(app, /c4-pagehead-crest/);
  const fresh = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round4.tsx"), "utf8");
  assert.match(fresh, /c4-fresh-crest/);
  const foot = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round18.tsx"), "utf8");
  assert.match(foot, /c4-foot-crest/);
  assert.match(foot, /data-logo="mono"/);
  const rail = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round30.tsx"), "utf8");
  assert.match(rail, /data-logo="mono"/);
  console.log("crmv4 round137 tests passed");
}

main();
