/**
 * Interlude cards and registration vintages.
 * Run: npx tsx tests/crmv4-round145.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND145_COPY } from "../src/lib/crmv4/copy-round145";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeDecade,
  activeHost,
  activeHour,
  activeKind,
  activeMark,
  activeRoom,
  activeSeason,
  activeShade,
  activeSpan,
  activeYear,
  addInterlude,
  addInterludeView,
  bulkInterludeDone,
  bulkInterludePinned,
  decadeArg,
  decadeOf,
  dropInterludeView,
  editInterlude,
  hostArg,
  hostLabel,
  hourArg,
  hourBand,
  hourCount,
  hourGap,
  hourWatch,
  hourWatchCounts,
  interludeClashIds,
  interludeCopy,
  interludeCounts,
  interludeHosts,
  interludeMarks,
  interludeRooms,
  interludeShades,
  interludeShare,
  interludeTimeline,
  interludesCsv,
  interludeText,
  kindArg,
  kindOf,
  leadingDecade,
  leadingKind,
  leadingSeason,
  leadingSpan,
  leadingYear,
  markArg,
  markTag,
  namedDecades,
  namedKinds,
  namedSeasons,
  namedSpans,
  namedYears,
  nextInterlude,
  readHiddenYears,
  readInterludeViews,
  readInterludes,
  resetInterludes,
  roomArg,
  roomOf,
  seasonArg,
  seasonLines,
  seasonOf,
  setInterludeDone,
  setInterludeHeld,
  setInterludePinned,
  shadeArg,
  shadeOf,
  spanArg,
  spanLines,
  spanOf,
  stepInterludeShade,
  toggleYear,
  vintageShare,
  vintageText,
  vintagesCsv,
  visibleInterludes,
  visibleVintageCustomers,
  visibleYears,
} from "../src/lib/crmv4/round145";

function main() {
  assert.equal(interludeText("  Call\nAda  "), "Call Ada");
  assert.equal(interludeText("   "), "");
  assert.equal(interludeText("x".repeat(120)).length, 80);
  assert.equal(hostLabel("  North  "), "North");
  assert.equal(hostLabel("   "), "");
  assert.equal(hostLabel("y".repeat(40)).length, 18);
  assert.equal(markTag("  VIP  "), "VIP");
  assert.equal(markTag("   "), "");
  assert.equal(markTag("z".repeat(30)).length, 12);
  assert.equal(hourCount(" 1 "), 1);
  assert.equal(hourCount(1), 1);
  assert.equal(hourCount(12), 12);
  assert.equal(hourCount("12"), 12);
  assert.equal(hourCount(""), null);
  assert.equal(hourCount("0"), null);
  assert.equal(hourCount(0), null);
  assert.equal(hourCount("01"), null);
  assert.equal(hourCount(13), null);
  assert.equal(roomOf(" FOYER "), "foyer");
  assert.equal(roomOf("salon"), "salon");
  assert.equal(roomOf("library"), "library");
  assert.equal(roomOf("garden"), "garden");
  assert.equal(roomOf(""), "blank");
  assert.equal(roomOf("pit"), "blank");
  assert.equal(shadeOf(" GOLD "), "gold");
  assert.equal(shadeOf("ivory"), "ivory");
  assert.equal(shadeOf("graphite"), "graphite");
  assert.equal(shadeOf(""), "blank");
  assert.equal(shadeOf("warm"), "blank");
  assert.equal(hourBand(null), "blank");
  assert.equal(hourBand(1), "dawn");
  assert.equal(hourBand(4), "dawn");
  assert.equal(hourBand(5), "noon");
  assert.equal(hourBand(8), "noon");
  assert.equal(hourBand(9), "dusk");
  assert.equal(hourBand(12), "dusk");
  assert.equal(hourWatch(null), "blank");
  assert.equal(hourWatch(1), "i");
  assert.equal(hourWatch(4), "ii");
  assert.equal(hourWatch(7), "iii");
  assert.equal(hourWatch(10), "iv");
  assert.equal(hourWatch(12), "iv");
  assert.equal(hourGap(1, 4), 3);
  assert.equal(hourGap(12, 1), -11);
  assert.equal(hourGap(2, 2), 0);
  assert.equal(hourGap(null, 3), null);
  assert.equal(hourGap(3, ""), null);
  assert.deepEqual(readInterludes([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Call Ada", host: "  ", hour: 0, room: "pit", mark: "  ", shade: "warm", pinned: 1, done: 1, held: 1, audit: "nope" }, "nope"]), [
    { id: "2", text: "Call Ada", host: "", hour: null, room: "", mark: "", shade: "", pinned: false, done: false, held: false, audit: "" },
  ]);
  assert.equal(readInterludes([{ id: "z", text: "One", hour: 12 }])[0].hour, 12);
  const saved = addInterlude([], { id: "a", text: "Call Ada", host: "Nia", hour: 1, room: "foyer", mark: "VIP", shade: "ivory" });
  assert.equal(saved[0].audit, "save");
  assert.equal(saved[0].hour, 1);
  assert.equal(saved[0].room, "foyer");
  assert.equal(saved[0].shade, "ivory");
  assert.equal(addInterlude(saved, { id: "b", text: "Call Ada" }).length, 1);
  assert.equal(addInterlude(saved, { id: "a", text: "Other" }).length, 1);
  assert.equal(addInterlude(saved, { id: "b", text: "   " }).length, 1);
  const raised = stepInterludeShade(saved, "a", 1);
  assert.equal(raised[0].shade, "graphite");
  assert.equal(raised[0].audit, "raise");
  assert.equal(stepInterludeShade(raised, "a", 1)[0].shade, "gold");
  assert.equal(stepInterludeShade([{ ...saved[0], shade: "gold" }], "a", 1)[0].shade, "gold");
  assert.equal(stepInterludeShade([{ ...saved[0], shade: "" }], "a", -1)[0].shade, "");
  const pinned = setInterludePinned(saved, "a", true);
  assert.equal(pinned[0].pinned, true);
  assert.equal(pinned[0].audit, "pin");
  assert.equal(setInterludePinned(pinned, "a", false)[0].audit, "unpin");
  const held = setInterludeHeld(saved, "a", true);
  assert.equal(held[0].held, true);
  assert.equal(held[0].audit, "hold");
  const done = setInterludeDone(saved, "a", true);
  assert.equal(done[0].done, true);
  assert.equal(done[0].audit, "done");
  assert.equal(setInterludeDone(done, "a", false)[0].audit, "reopen");
  const edited = editInterlude(saved, "a", "Call Bea");
  assert.equal(edited[0].text, "Call Bea");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editInterlude(saved, "a", "  ")[0].text, "Call Ada");
  const pair = addInterlude(saved, { id: "b", text: "Later", hour: 11, room: "garden" });
  assert.equal(editInterlude(pair, "b", "Call Ada")[0].text, "Later");
  const bulkPin = bulkInterludePinned(pair, ["b", ""], true);
  assert.equal(bulkPin[0].pinned, true);
  assert.equal(bulkPin[1].pinned, false);
  assert.equal(bulkInterludeDone(pair, ["a"], true)[1].done, true);
  assert.deepEqual(resetInterludes(), []);
  assert.equal(interludeCopy("  Call Ada "), "Call Ada");
  assert.equal(interludeCopy(" "), "");
  const shown = visibleInterludes(pair, "open", "ada", null, null, null, null, null, null, false, false, 4);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].id, "a");
  assert.equal(visibleInterludes(pair, "open", "nia", null, null, null, null, null, null, false, false, 4).length, 0);
  assert.equal(visibleInterludes(held, "held", "", null, null, null, null, null, null, false, false, 4).length, 1);
  assert.equal(visibleInterludes(done, "open", "", null, null, null, null, null, null, false, false, 4).length, 0);
  assert.equal(visibleInterludes(pair, "open", "", "Nia", "foyer", "VIP", "ivory", 1, null, false, false, 4).length, 1);
  assert.equal(visibleInterludes(pair, "open", "", null, null, null, null, null, "dawn", false, false, 4).length, 1);
  assert.equal(visibleInterludes(pair, "open", "", null, null, null, null, null, "iv", false, false, 4).length, 1);
  assert.equal(visibleInterludes(raised, "open", "", null, null, null, null, null, null, true, false, 4).length, 0);
  assert.equal(visibleInterludes(stepInterludeShade(raised, "a", 1), "open", "", null, null, null, null, null, null, true, false, 4).length, 1);
  assert.equal(visibleInterludes(pair, "open", "", null, null, null, null, null, null, false, true, 4).length, 1);
  assert.deepEqual(interludeTimeline(pair, "").map((card) => card.id), ["a", "b"]);
  assert.deepEqual(interludeTimeline(addInterlude(pair, { id: "c", text: "Blank" }), "").map((card) => card.hour === null).at(-1), true);
  const counts = interludeCounts(addInterlude(pinned, { id: "b", text: "Later", hour: 4 }), 2);
  assert.equal(counts.open, 2);
  assert.equal(counts.pinned, 1);
  assert.equal(counts.late, 1);
  assert.equal(interludeShare(1, 4), 25);
  assert.equal(interludeShare(0, 0), 0);
  assert.deepEqual(interludeHosts(saved), ["Nia"]);
  assert.deepEqual(interludeMarks(saved), ["VIP"]);
  assert.deepEqual(interludeRooms(pair), ["foyer", "garden"]);
  assert.deepEqual(interludeShades(saved), ["ivory"]);
  assert.deepEqual(hourWatchCounts(pair), [1, 0, 0, 1]);
  assert.equal(activeHost("gone", ["Nia"]), "all");
  assert.equal(activeHost("blank", ["Nia"]), "blank");
  assert.equal(hostArg("blank"), "");
  assert.equal(hostArg("all"), null);
  assert.equal(activeRoom("pit", ["foyer"]), "all");
  assert.equal(activeRoom("foyer", ["foyer"]), "foyer");
  assert.equal(roomArg("blank"), "blank");
  assert.equal(roomArg("nope"), null);
  assert.equal(activeMark("gone", ["VIP"]), "all");
  assert.equal(markArg("VIP"), "VIP");
  assert.equal(activeShade("warm", ["ivory"]), "all");
  assert.equal(activeShade("gold", ["gold"]), "gold");
  assert.equal(shadeArg("blank"), "blank");
  assert.equal(shadeArg("gold"), "gold");
  assert.equal(activeHour("13"), "all");
  assert.equal(activeHour("dawn"), "dawn");
  assert.equal(activeHour("iv"), "iv");
  assert.equal(activeHour("12"), "12");
  assert.deepEqual(hourArg("noon"), { exact: null, band: "noon" });
  assert.deepEqual(hourArg("12"), { exact: 12, band: null });
  assert.deepEqual(hourArg("nope"), { exact: null, band: null });
  const clash = addInterlude(pair, { id: "c", text: "Same", hour: 1, room: "foyer" });
  assert.deepEqual(interludeClashIds(clash, "a"), ["c"]);
  assert.deepEqual(interludeClashIds(pair, "b"), []);
  assert.equal(nextInterlude(pair, 2), "b");
  assert.equal(nextInterlude(pair, 12), "a");
  assert.equal(nextInterlude(pair, ""), "");
  const csv = interludesCsv(saved, 4);
  assert.equal(csv.split("\n")[0], "note,host,hour,room,mark,shade,band,pinned,done,held,gap,audit");
  assert.equal(csv.includes("amount"), false);
  assert.equal(csv.includes("foyer"), true);
  const views = addInterludeView([], { id: "v", name: "Dawn", tray: "open", query: "ada", host: "Nia", room: "foyer", mark: "VIP", shade: "ivory", hour: "dawn" });
  assert.equal(views[0].hour, "dawn");
  assert.equal(addInterludeView(views, { id: "v2", name: "Dawn", tray: "open", query: "", host: "all", room: "all", mark: "all", shade: "all", hour: "all" }).length, 1);
  assert.equal(dropInterludeView(views, "v").length, 0);
  assert.equal(readInterludeViews([{ id: "v", name: "  ", hour: "nope" }]).length, 0);

  assert.equal(vintageText("2024-06-01"), "2024");
  assert.equal(vintageText(" 2019-02-28T00:00:00.000Z "), "2019");
  assert.equal(vintageText(2016), "2016");
  assert.equal(vintageText(""), "");
  assert.equal(vintageText("2019-13-01"), "");
  assert.equal(vintageText("2019-02-31"), "");
  assert.equal(vintageText("1969-01-01"), "");
  assert.equal(vintageText("2100"), "");
  assert.equal(vintageText({ registrationDate: "2020-03-02", phone: "1" }), "");
  assert.equal(vintageText({ registrationDate: "2020-03-02", createdAt: "1999-01-01" }), "");
  assert.equal(vintageText({ registrationDate: "2021-11-02" }), "2021");
  assert.equal(kindOf("2016-01-01"), "founding");
  assert.equal(kindOf("2018-01-01"), "house");
  assert.equal(kindOf("2022-12-01"), "house");
  assert.equal(kindOf("2023-01-01"), "fresh");
  assert.equal(kindOf(""), "");
  assert.equal(spanOf("2019-01-01"), "early");
  assert.equal(spanOf("2020-01-01"), "mid");
  assert.equal(spanOf("2023-06-01"), "mid");
  assert.equal(spanOf("2024-01-01"), "late");
  assert.equal(seasonOf("2024"), "");
  assert.equal(seasonOf("2016-01-15"), "winter");
  assert.equal(seasonOf("2016-12-15"), "winter");
  assert.equal(seasonOf("2019-04-01"), "spring");
  assert.equal(seasonOf("2020-07-01"), "summer");
  assert.equal(seasonOf("2021-10-01"), "autumn");
  assert.equal(decadeOf("1998-01-01"), "90s");
  assert.equal(decadeOf("2005-01-01"), "00s");
  assert.equal(decadeOf("2019-01-01"), "10s");
  assert.equal(decadeOf("2024-01-01"), "20s");
  assert.equal(decadeOf(""), "");
  const rows = [
    { year: "2024-06-01", label: "Ada" },
    { year: "2024-01-02", label: "Bea" },
    { year: "2016-01-15", label: "Wes" },
    { year: "", label: "No year" },
    { year: { registrationDate: "2019-04-01", phone: "9" }, label: "Blocked" },
  ];
  assert.deepEqual(namedYears(rows), ["2016", "2024"]);
  assert.equal(leadingYear(rows), "2024");
  assert.equal(leadingKind(rows), "fresh");
  assert.equal(leadingSpan(rows), "late");
  assert.equal(leadingSeason(rows), "winter");
  assert.equal(leadingDecade(rows), "20s");
  assert.equal(vintageShare(2, 5), 40);
  assert.equal(vintageShare(0, 0), 0);
  assert.deepEqual(readHiddenYears(["2024", "nope", "2016"], ["2024"]), ["2024"]);
  assert.deepEqual(toggleYear(["2024"], "2024", ["2024", "2016"]), []);
  assert.deepEqual(toggleYear([], "2016", ["2024", "2016"]), ["2016"]);
  assert.deepEqual(visibleYears(["2024", "2016"], ["2016"], false), ["2024"]);
  assert.deepEqual(visibleYears(["2024", "2016"], ["2016"], true), ["2016"]);
  assert.equal(activeYear("2016", ["2024"]), "");
  assert.equal(activeYear("2024", ["2024"]), "2024");
  assert.equal(activeKind("missing", ["fresh"]), "all");
  assert.equal(activeKind("blank", ["fresh"]), "blank");
  assert.equal(activeKind("house", ["house"]), "house");
  assert.equal(kindArg("all"), null);
  assert.equal(kindArg("blank"), "");
  assert.equal(kindArg("founding"), "founding");
  assert.equal(kindArg("nope"), null);
  assert.equal(activeSpan("missing", ["early"]), "all");
  assert.equal(activeSpan("late", ["late"]), "late");
  assert.equal(spanArg("blank"), "");
  assert.equal(spanArg("mid"), "mid");
  assert.equal(spanArg("nope"), null);
  assert.equal(activeSeason("gone", ["winter"]), "all");
  assert.equal(activeSeason("summer", ["summer"]), "summer");
  assert.equal(seasonArg("blank"), "");
  assert.equal(seasonArg("autumn"), "autumn");
  assert.equal(seasonArg("nope"), null);
  assert.equal(activeDecade("gone", ["20s"]), "all");
  assert.equal(activeDecade("20s", ["20s"]), "20s");
  assert.equal(decadeArg("all"), null);
  assert.equal(decadeArg("blank"), "");
  assert.equal(decadeArg("10s"), "10s");
  assert.equal(decadeArg("nope"), null);
  const visible = visibleVintageCustomers(rows, "", false, "founding", "early", "winter", "10s", "wes");
  assert.equal(visible.length, 1);
  assert.equal(visible[0].label, "Wes");
  assert.equal(visibleVintageCustomers(rows, "", true, null, null, null, null, "blocked").length, 1);
  assert.equal(visibleVintageCustomers(rows, "2024", false, null, null, null, null, "").length, 2);
  assert.equal(visibleVintageCustomers(rows, "", false, null, null, "spring", null, "").length, 0);
  assert.equal(vintagesCsv(rows).startsWith("year,kind,span,decade,count\n"), true);
  assert.equal(vintagesCsv([]), "year,kind,span,decade,count");
  assert.equal(vintagesCsv(rows).includes("amount"), false);
  assert.equal(spanLines(rows).some((line) => line.span === "early"), true);
  assert.equal(namedKinds(rows).includes("founding"), true);
  assert.equal(namedSpans(rows).includes("late"), true);
  assert.equal(namedSeasons(rows).includes("summer"), true);
  assert.equal(namedDecades(rows).includes("20s"), true);
  assert.equal(seasonLines(rows).some((line) => line.season === "winter"), true);

  const copy = Object.keys(ROUND145_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND145_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "itlTitle"), "Interlude cards");
  assert.equal(crmv4Text("tr", "vntTitle"), ROUND145_COPY.tr.vntTitle);
  assert.equal(crmv4Text("de", "itlHost"), ROUND145_COPY.de.itlHost);
  assert.equal(crmv4Text("ru", "vntBlank"), ROUND145_COPY.ru.vntBlank);
  assert.equal(crmv4Text("ar", "itlNotice"), ROUND145_COPY.ar.itlNotice);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-itl/);
  assert.match(css, /\.c4-vnt/);
  assert.match(css, /\.c4-pagehead-interlude/);
  assert.match(css, /\.c4-rail-interlude/);
  assert.match(css, /\.c4-pagehead-playbill/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round145.tsx"), "utf8");
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
  assert.match(view, /registrationDate/);
  assert.match(view, /interludesCsv/);
  assert.match(view, /vintagesCsv/);
  assert.match(view, /Escape/);
  assert.match(view, /event\.key !== "\/"/);
  assert.match(view, /event\.key === "i"/);
  assert.match(view, /storedRole/);
  assert.match(view, /data-role/);
  assert.match(view, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(view, /data-interlude/);
  assert.match(view, /data-vintage/);
  assert.match(view, /data-logo="mono"/);
  assert.match(view, /customers/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "interlude"/);
  assert.match(app, /view === "vintage"/);
  assert.match(app, /c4-pagehead-interlude/);
  assert.match(app, /c4-rail-interlude/);
  assert.match(app, /c4-pagehead-playbill/);
  assert.match(app, /c4-rail-playbill/);
  console.log("crmv4 round145 tests passed");
}

main();
