/**
 * Vellum slips and household marks.
 * Run: npx tsx tests/crmv4-round147.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND147_COPY } from "../src/lib/crmv4/copy-round147";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeBearer,
  activeDomain,
  activeHouse,
  activeHour,
  activeLane,
  activeStamp,
  activeStay,
  activeTone,
  addVellum,
  addVellumView,
  bearerArg,
  bulkVellumDone,
  bulkVellumPinned,
  domainArg,
  domainLines,
  dropVellumView,
  editVellum,
  hourArg,
  hourCount,
  hourGap,
  hourHalf,
  hourWatch,
  houseArg,
  houseLines,
  houseShare,
  housesCsv,
  laneArg,
  laneOf,
  leadingDomain,
  leadingHouse,
  leadingStay,
  mailDomain,
  mailHouse,
  namedDomains,
  namedHouses,
  namedStays,
  nextVellum,
  readHiddenDomains,
  readVellumViews,
  readVellums,
  resetVellums,
  setVellumDone,
  setVellumHeld,
  setVellumPinned,
  stampArg,
  stampTag,
  stayArg,
  stayLines,
  stayOf,
  stepVellumTone,
  toggleDomain,
  toneArg,
  toneOf,
  vellumBearers,
  vellumClashIds,
  vellumCopy,
  vellumCounts,
  vellumLanes,
  vellumShare,
  vellumStamps,
  vellumTimeline,
  vellumTones,
  vellumsCsv,
  vellumText,
  visibleDomains,
  visibleHouseCustomers,
  visibleVellums,
  watchCounts,
  bearerLabel,
} from "../src/lib/crmv4/round147";

function main() {
  assert.equal(vellumText("  Call\nAda  "), "Call Ada");
  assert.equal(vellumText("   "), "");
  assert.equal(vellumText("x".repeat(120)).length, 96);
  assert.equal(bearerLabel("  North  "), "North");
  assert.equal(bearerLabel("   "), "");
  assert.equal(bearerLabel("y".repeat(40)).length, 20);
  assert.equal(stampTag("  VIP  "), "VIP");
  assert.equal(stampTag("   "), "");
  assert.equal(stampTag("z".repeat(30)).length, 14);
  assert.equal(hourCount(" 0 "), 0);
  assert.equal(hourCount(0), 0);
  assert.equal(hourCount("00"), 0);
  assert.equal(hourCount("08"), 8);
  assert.equal(hourCount(23), 23);
  assert.equal(hourCount("23"), 23);
  assert.equal(hourCount(""), null);
  assert.equal(hourCount("24"), null);
  assert.equal(hourCount(24), null);
  assert.equal(hourCount(-1), null);
  assert.equal(hourCount(1.5), null);
  assert.equal(laneOf(" SALE "), "sale");
  assert.equal(laneOf("retain"), "retain");
  assert.equal(laneOf("kyc"), "kyc");
  assert.equal(laneOf("support"), "support");
  assert.equal(laneOf(""), "blank");
  assert.equal(laneOf("pit"), "blank");
  assert.equal(toneOf(" FIRM "), "firm");
  assert.equal(toneOf("quiet"), "quiet");
  assert.equal(toneOf("warm"), "warm");
  assert.equal(toneOf(""), "blank");
  assert.equal(toneOf("gold"), "blank");
  assert.equal(hourWatch(null), "blank");
  assert.equal(hourWatch(0), "night");
  assert.equal(hourWatch(5), "night");
  assert.equal(hourWatch(6), "morning");
  assert.equal(hourWatch(11), "morning");
  assert.equal(hourWatch(12), "afternoon");
  assert.equal(hourWatch(17), "afternoon");
  assert.equal(hourWatch(18), "evening");
  assert.equal(hourWatch(23), "evening");
  assert.equal(hourHalf(null), "blank");
  assert.equal(hourHalf(0), "am");
  assert.equal(hourHalf(11), "am");
  assert.equal(hourHalf(12), "pm");
  assert.equal(hourHalf(23), "pm");
  assert.equal(hourGap(1, 4), 3);
  assert.equal(hourGap(23, 1), -22);
  assert.equal(hourGap(2, 2), 0);
  assert.equal(hourGap(null, 3), null);
  assert.equal(hourGap(3, ""), null);
  assert.deepEqual(readVellums([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Call Ada", bearer: "  ", hour: 24, lane: "pit", stamp: "  ", tone: "gold", pinned: 1, done: 1, held: 1, audit: "nope" }, "nope"]), [
    { id: "2", text: "Call Ada", bearer: "", hour: null, lane: "", stamp: "", tone: "", pinned: false, done: false, held: false, audit: "" },
  ]);
  assert.equal(readVellums([{ id: "z", text: "One", hour: 0 }])[0].hour, 0);
  const saved = addVellum([], { id: "a", text: "Call Ada", bearer: "Nia", hour: 0, lane: "sale", stamp: "VIP", tone: "quiet" });
  assert.equal(saved[0].audit, "save");
  assert.equal(saved[0].hour, 0);
  assert.equal(saved[0].lane, "sale");
  assert.equal(saved[0].tone, "quiet");
  assert.equal(addVellum(saved, { id: "b", text: "Call Ada" }).length, 1);
  assert.equal(addVellum(saved, { id: "a", text: "Other" }).length, 1);
  assert.equal(addVellum(saved, { id: "b", text: "   " }).length, 1);
  const raised = stepVellumTone(saved, "a", 1);
  assert.equal(raised[0].tone, "warm");
  assert.equal(raised[0].audit, "raise");
  assert.equal(stepVellumTone(raised, "a", 1)[0].tone, "firm");
  assert.equal(stepVellumTone([{ ...saved[0], tone: "firm" }], "a", 1)[0].tone, "firm");
  assert.equal(stepVellumTone([{ ...saved[0], tone: "" }], "a", -1)[0].tone, "");
  const pinned = setVellumPinned(saved, "a", true);
  assert.equal(pinned[0].pinned, true);
  assert.equal(pinned[0].audit, "pin");
  assert.equal(setVellumPinned(pinned, "a", false)[0].audit, "unpin");
  const held = setVellumHeld(saved, "a", true);
  assert.equal(held[0].held, true);
  assert.equal(held[0].audit, "hold");
  const done = setVellumDone(saved, "a", true);
  assert.equal(done[0].done, true);
  assert.equal(done[0].audit, "done");
  assert.equal(setVellumDone(done, "a", false)[0].audit, "reopen");
  const edited = editVellum(saved, "a", "Call Bea");
  assert.equal(edited[0].text, "Call Bea");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editVellum(saved, "a", "  ")[0].text, "Call Ada");
  const pair = addVellum(saved, { id: "b", text: "Later", hour: 22, lane: "support" });
  assert.equal(editVellum(pair, "b", "Call Ada")[0].text, "Later");
  const bulkPin = bulkVellumPinned(pair, ["b", ""], true);
  assert.equal(bulkPin[0].pinned, true);
  assert.equal(bulkPin[1].pinned, false);
  assert.equal(bulkVellumDone(pair, ["a"], true)[1].done, true);
  assert.deepEqual(resetVellums(), []);
  assert.equal(vellumCopy("  Call Ada "), "Call Ada");
  assert.equal(vellumCopy(" "), "");
  const shown = visibleVellums(pair, "open", "ada", null, null, null, null, null, null, false, false, 4);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].id, "a");
  assert.equal(visibleVellums(pair, "open", "nia", null, null, null, null, null, null, false, false, 4).length, 0);
  assert.equal(visibleVellums(held, "held", "", null, null, null, null, null, null, false, false, 4).length, 1);
  assert.equal(visibleVellums(done, "open", "", null, null, null, null, null, null, false, false, 4).length, 0);
  assert.equal(visibleVellums(pair, "open", "", "Nia", "sale", "VIP", "quiet", 0, null, false, false, 4).length, 1);
  assert.equal(visibleVellums(pair, "open", "", null, null, null, null, null, "night", false, false, 4).length, 1);
  assert.equal(visibleVellums(pair, "open", "", null, null, null, null, null, "pm", false, false, 4).length, 1);
  assert.equal(visibleVellums(raised, "open", "", null, null, null, null, null, null, true, false, 4).length, 0);
  assert.equal(visibleVellums(stepVellumTone(raised, "a", 1), "open", "", null, null, null, null, null, null, true, false, 4).length, 1);
  assert.equal(visibleVellums(pair, "open", "", null, null, null, null, null, null, false, true, 4).length, 1);
  assert.deepEqual(vellumTimeline(pair, "").map((card) => card.id), ["a", "b"]);
  assert.deepEqual(vellumTimeline(addVellum(pair, { id: "c", text: "Blank" }), "").map((card) => card.hour === null).at(-1), true);
  const counts = vellumCounts(addVellum(pinned, { id: "b", text: "Later", hour: 6 }), 4);
  assert.equal(counts.open, 2);
  assert.equal(counts.pinned, 1);
  assert.equal(counts.late, 1);
  assert.equal(vellumShare(1, 4), 25);
  assert.equal(vellumShare(0, 0), 0);
  assert.deepEqual(vellumBearers(saved), ["Nia"]);
  assert.deepEqual(vellumStamps(saved), ["VIP"]);
  assert.deepEqual(vellumLanes(pair), ["sale", "support"]);
  assert.deepEqual(vellumTones(saved), ["quiet"]);
  assert.deepEqual(watchCounts(pair), [1, 0, 0, 1]);
  assert.equal(activeBearer("missing", ["Nia"]), "all");
  assert.equal(activeBearer("blank", ["Nia"]), "blank");
  assert.equal(activeBearer("Nia", ["Nia"]), "Nia");
  assert.equal(bearerArg("all"), null);
  assert.equal(bearerArg("blank"), "");
  assert.equal(bearerArg("Nia"), "Nia");
  assert.equal(activeLane("missing", ["sale"]), "all");
  assert.equal(activeLane("sale", ["sale"]), "sale");
  assert.equal(laneArg("blank"), "blank");
  assert.equal(laneArg("support"), "support");
  assert.equal(laneArg("nope"), null);
  assert.equal(activeStamp("gone", ["VIP"]), "all");
  assert.equal(activeStamp("VIP", ["VIP"]), "VIP");
  assert.equal(stampArg("blank"), "");
  assert.equal(stampArg("VIP"), "VIP");
  assert.equal(activeTone("gone", ["quiet"]), "all");
  assert.equal(activeTone("warm", ["warm"]), "warm");
  assert.equal(toneArg("blank"), "blank");
  assert.equal(toneArg("firm"), "firm");
  assert.equal(toneArg("gold"), null);
  assert.equal(activeHour("nope"), "all");
  assert.equal(activeHour("am"), "am");
  assert.equal(activeHour("08"), "8");
  assert.equal(activeHour("24"), "all");
  assert.deepEqual(hourArg("night"), { exact: null, band: "night" });
  assert.deepEqual(hourArg("8"), { exact: 8, band: null });
  assert.deepEqual(hourArg("all"), { exact: null, band: null });
  const clash = addVellum(pair, { id: "c", text: "Same", hour: 0, lane: "sale" });
  assert.deepEqual(vellumClashIds(clash, "a"), ["c"]);
  assert.deepEqual(vellumClashIds(pair, "b"), []);
  assert.equal(nextVellum(pair, 10), "b");
  assert.equal(nextVellum(pair, 23), "a");
  assert.equal(nextVellum(pair, ""), "");
  const csv = vellumsCsv(saved, 4);
  assert.equal(csv.startsWith("note,bearer,hour,lane,stamp,tone,watch,pinned,done,held,gap,audit\n"), true);
  assert.equal(csv.includes("Call Ada"), true);
  assert.equal(csv.includes("amount"), false);
  assert.equal(vellumsCsv([], 1), "note,bearer,hour,lane,stamp,tone,watch,pinned,done,held,gap,audit");
  const views = addVellumView([], { id: "v", name: "Morning", tray: "open", query: "ada", bearer: "Nia", lane: "sale", stamp: "VIP", tone: "quiet", hour: "night" });
  assert.equal(views[0].hour, "night");
  assert.equal(addVellumView(views, { id: "w", name: "Morning", tray: "open", query: "", bearer: "all", lane: "all", stamp: "all", tone: "all", hour: "all" }).length, 1);
  assert.equal(dropVellumView(views, "v").length, 0);
  assert.equal(readVellumViews([{ id: "v", name: "  ", tray: "held" }]).length, 0);
  assert.equal(readVellumViews(views)[0].tray, "open");

  assert.equal(stayOf(true), "resident");
  assert.equal(stayOf(false), "visitor");
  assert.equal(stayOf(null), "");
  assert.equal(stayOf(""), "");
  assert.equal(stayOf(" yes "), "resident");
  assert.equal(stayOf("NO"), "visitor");
  assert.equal(stayOf(1), "resident");
  assert.equal(stayOf(0), "visitor");
  assert.equal(stayOf("maybe"), "");
  assert.equal(stayOf({ isResident: true }), "resident");
  assert.equal(stayOf({ isResident: false }), "visitor");
  assert.equal(stayOf({ isResident: true, country: "TR" }), "");
  assert.equal(stayOf({ country: "TR" }), "");
  assert.equal(stayOf({ address: "Lane" }), "");
  assert.equal(stayOf({ registrationCountry: "TR" }), "");
  assert.equal(stayOf({ timezone: "Europe/Istanbul" }), "");
  assert.equal(mailDomain(" ada@Gmail.com "), "gmail.com");
  assert.equal(mailHouse(" ada@Gmail.com "), "public");
  assert.equal(mailDomain("ada@7fx.com"), "7fx.com");
  assert.equal(mailHouse("ada@7fx.com"), "house");
  assert.equal(mailDomain("Ada"), "");
  assert.equal(mailHouse("Ada"), "");
  assert.equal(mailDomain("+905551112233"), "");
  assert.equal(mailDomain("ada@"), "");
  assert.equal(mailDomain("ada@b"), "");
  assert.equal(mailHouse("ada@outlook.com"), "public");
  assert.equal(mailHouse("ada@proton.me"), "public");
  assert.equal(mailDomain({ email: "a@yahoo.co.uk" }), "yahoo.co.uk");
  assert.equal(mailDomain({ email: "a@yahoo.com", name: "Ada" }), "");
  assert.equal(mailDomain({ phone: "+1" }), "");
  const rows = [
    { stay: true, mail: "ada@gmail.com", label: "Ada" },
    { stay: false, mail: "bea@7fx.com", label: "Bea" },
    { stay: true, mail: "wes@gmail.com", label: "Wes" },
    { stay: null, mail: "", label: "No mark" },
    { stay: { country: "TR" }, mail: { name: "Blocked" }, label: "Blocked" },
  ];
  assert.equal(stayLines(rows).find((line) => !line.stay)?.count, 2);
  assert.equal(stayLines(rows).find((line) => line.stay === "resident")?.count, 2);
  assert.equal(houseLines(rows).find((line) => line.house === "public")?.count, 2);
  assert.equal(houseLines(rows).find((line) => line.house === "house")?.count, 1);
  assert.equal(domainLines(rows).find((line) => line.domain === "gmail.com")?.house, "public");
  assert.deepEqual(namedStays(rows), ["resident", "visitor"]);
  assert.deepEqual(namedHouses(rows), ["public", "house"]);
  assert.deepEqual(namedDomains(rows), ["7fx.com", "gmail.com"]);
  assert.equal(leadingStay(rows), "resident");
  assert.equal(leadingHouse(rows), "public");
  assert.equal(leadingDomain(rows), "gmail.com");
  assert.equal(houseShare(2, 5), 40);
  assert.equal(houseShare(0, 0), 0);
  assert.deepEqual(readHiddenDomains(["gmail.com", "nope", "7fx.com"], ["gmail.com"]), ["gmail.com"]);
  assert.deepEqual(toggleDomain(["gmail.com"], "gmail.com", ["gmail.com", "7fx.com"]), []);
  assert.deepEqual(toggleDomain([], "7fx.com", ["gmail.com", "7fx.com"]), ["7fx.com"]);
  assert.deepEqual(visibleDomains(["gmail.com", "7fx.com"], ["7fx.com"], false), ["gmail.com"]);
  assert.deepEqual(visibleDomains(["gmail.com", "7fx.com"], ["7fx.com"], true), ["7fx.com"]);
  assert.equal(activeStay("missing", ["resident"]), "all");
  assert.equal(activeStay("blank", ["resident"]), "blank");
  assert.equal(activeStay("resident", ["resident"]), "resident");
  assert.equal(stayArg("all"), null);
  assert.equal(stayArg("blank"), "");
  assert.equal(stayArg("visitor"), "visitor");
  assert.equal(stayArg("nope"), null);
  assert.equal(activeHouse("gone", ["public"]), "all");
  assert.equal(activeHouse("house", ["house"]), "house");
  assert.equal(houseArg("blank"), "");
  assert.equal(houseArg("public"), "public");
  assert.equal(houseArg("nope"), null);
  assert.equal(activeDomain("gone.com", ["gmail.com"]), "all");
  assert.equal(activeDomain("gmail.com", ["gmail.com"]), "gmail.com");
  assert.equal(domainArg("all"), null);
  assert.equal(domainArg("gmail.com"), "gmail.com");
  assert.equal(domainArg("nope"), null);
  const visible = visibleHouseCustomers(rows, "resident", "public", "gmail.com", "wes");
  assert.equal(visible.length, 1);
  assert.equal(visible[0].label, "Wes");
  assert.equal(visibleHouseCustomers(rows, "", null, null, "blocked").length, 1);
  assert.equal(visibleHouseCustomers(rows, null, null, null, "gmail").length, 0);
  assert.equal(visibleHouseCustomers(rows, "visitor", null, null, "").length, 1);
  assert.equal(housesCsv(rows).startsWith("kind,mark,count\n"), true);
  assert.equal(housesCsv([]), "kind,mark,count");
  assert.equal(housesCsv(rows).includes("amount"), false);
  assert.equal(housesCsv(rows).includes("gmail.com"), true);

  const copy = Object.keys(ROUND147_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND147_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "vlmTitle"), "Vellum slips");
  assert.equal(crmv4Text("tr", "hhdTitle"), ROUND147_COPY.tr.hhdTitle);
  assert.equal(crmv4Text("de", "vlmBearer"), ROUND147_COPY.de.vlmBearer);
  assert.equal(crmv4Text("ru", "hhdUnmarked"), ROUND147_COPY.ru.hhdUnmarked);
  assert.equal(crmv4Text("ar", "vlmNotice"), ROUND147_COPY.ar.vlmNotice);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-vlm/);
  assert.match(css, /\.c4-hhd/);
  assert.match(css, /\.c4-pagehead-vellum/);
  assert.match(css, /\.c4-rail-vellum/);
  assert.match(css, /\.c4-pagehead-slip/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round147.tsx"), "utf8");
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
  assert.equal(view.includes("registrationDate"), false);
  assert.equal(view.includes("birthDate"), false);
  assert.match(view, /isResident/);
  assert.match(view, /email/);
  assert.match(view, /vellumsCsv/);
  assert.match(view, /housesCsv/);
  assert.match(view, /Escape/);
  assert.match(view, /event\.key !== "\/"/);
  assert.match(view, /event\.key === "a"/);
  assert.match(view, /storedRole/);
  assert.match(view, /data-role/);
  assert.match(view, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(view, /data-vellum/);
  assert.match(view, /data-house/);
  assert.match(view, /data-logo="mono"/);
  assert.match(view, /customers/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "vellum"/);
  assert.match(app, /view === "house"/);
  assert.match(app, /c4-pagehead-vellum/);
  assert.match(app, /c4-rail-vellum/);
  assert.match(app, /c4-pagehead-slip/);
  console.log("crmv4 round147 tests passed");
}

main();
