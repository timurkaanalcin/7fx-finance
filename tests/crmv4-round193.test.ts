/**
 * Sitting books and city marks.
 * Run: TZ=UTC npx tsx tests/crmv4-round193.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND193_COPY } from "../src/lib/crmv4/copy-round193";
import {
  activeMinute,
  activeRank,
  activeSpan,
  addSitting,
  addSittingTag,
  addSittingView,
  bulkSittingCloth,
  busiestHost,
  catalogCity,
  catalogCityCount,
  citiesCsv,
  cityBand,
  cityCopy,
  cityRowsCsv,
  cityState,
  cityTone,
  clashMinuteCount,
  cycleStance,
  densityOf,
  editSitting,
  editSittingNote,
  fairHost,
  houseRoom,
  lateSitting,
  minuteGap,
  minuteOf,
  moveFocus,
  nextSitting,
  openCityCount,
  peakMinute,
  quietMinute,
  rankClashCount,
  rankOf,
  readSittings,
  reminderSittings,
  roomOf,
  setSittingPause,
  sharedCityCount,
  sitLine,
  soonSitting,
  sortSittings,
  spanOf,
  suggestCloth,
  suggestHost,
  suggestSpan,
  usedMinutes,
  visibleCityCustomers,
  visibleSittings,
  wideCityCount,
  sittingsCsv,
} from "../src/lib/crmv4/round193";

function main() {
  assert.equal(roomOf("  par "), "PAR");
  assert.equal(roomOf("lon"), "LON");
  assert.equal(roomOf("ber"), "BER");
  assert.equal(roomOf("   "), "");
  assert.equal(roomOf("PA"), "");
  assert.equal(roomOf("PAR1"), "");
  assert.equal(minuteOf("0"), 0);
  assert.equal(minuteOf(0), 0);
  assert.equal(minuteOf("59"), 59);
  assert.equal(minuteOf("30"), 30);
  assert.equal(minuteOf("00"), null);
  assert.equal(minuteOf("08"), null);
  assert.equal(minuteOf("60"), null);
  assert.equal(minuteOf(""), null);
  assert.equal(rankOf("2"), 2);
  assert.equal(rankOf(4), 4);
  assert.equal(rankOf("0"), null);
  assert.equal(rankOf("1"), null);
  assert.equal(rankOf("02"), null);
  assert.equal(spanOf("15"), 15);
  assert.equal(spanOf(30), 30);
  assert.equal(spanOf("0"), null);
  assert.equal(spanOf("015"), null);
  assert.equal(spanOf("45"), null);
  assert.equal(peakMinute(0), true);
  assert.equal(peakMinute(30), true);
  assert.equal(peakMinute(7), false);
  assert.equal(quietMinute(7), true);
  assert.equal(quietMinute(13), true);
  assert.equal(quietMinute(0), false);
  assert.equal(quietMinute(30), false);
  assert.equal(minuteGap(55, 0), 5);
  assert.equal(minuteGap(0, 55), -5);
  assert.equal(minuteGap(0, 20), 20);
  assert.equal(minuteGap(20, 0), -20);
  assert.equal(minuteGap(10, 40), 30);
  assert.equal(minuteGap(40, 10), -30);
  assert.equal(minuteGap(null, 2), null);
  assert.equal(minuteGap(2, ""), null);
  assert.equal(minuteGap(2, 60), null);
  assert.equal(activeMinute("peak"), "peak");
  assert.equal(activeMinute("99"), "all");
  assert.equal(activeRank("4"), "4");
  assert.equal(activeRank("1"), "all");
  assert.equal(activeSpan("blank"), "blank");
  assert.equal(activeSpan("45"), "all");
  assert.equal(densityOf("tight"), "tight");
  assert.equal(densityOf("nope"), "roomy");
  assert.equal(moveFocus(0, 3, 1), 1);
  assert.equal(moveFocus(0, 3, -1), 2);
  assert.equal(moveFocus(2, 3, 1), 0);
  assert.equal(moveFocus(1, 0, 1), 0);

  const saved = addSitting([], { id: "a", title: "Ada sitting", note: "oak leaf", host: "Nia", minute: "6", cloth: "linen", room: "par", stance: "wait", rank: "8", span: "15", tags: "oak, vip", pause: "0" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].minute, 6);
  assert.equal(saved[0].rank, 8);
  assert.equal(saved[0].span, 15);
  assert.equal(saved[0].room, "PAR");
  assert.equal(saved[0].note, "oak leaf");
  assert.deepEqual(saved[0].tags, ["oak", "vip"]);
  assert.equal(saved[0].audit, "save");
  assert.equal(houseRoom(saved[0].room), true);
  assert.equal(houseRoom("IST"), false);
  assert.equal(soonSitting(saved[0]), true);
  assert.equal(lateSitting(saved[0], "20"), true);
  assert.equal(lateSitting(saved[0], "12"), false);
  assert.equal(addSitting(saved, { id: "b", title: "Ada sitting" }).length, 1);
  assert.equal(addSitting(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(addSitting(saved, { id: "c", title: "   " }).length, 1);
  const capped = Array.from({ length: 10 }, (_, index) => ({ id: `n${index}`, title: `Line ${index}` })).reduce((cards, card) => addSitting(cards, card), [] as ReturnType<typeof addSitting>);
  assert.equal(capped.length, 8);
  assert.equal(capped.some((card) => card.title === "Line 0"), false);
  assert.equal(capped[0].title, "Line 9");

  const cycled = cycleStance(saved, "a");
  assert.equal(cycled[0].stance, "seat");
  assert.equal(cycled[0].audit, "stance");
  assert.equal(cycleStance(cycled, "a")[0].stance, "done");
  assert.equal(cycleStance(cycleStance(cycled, "a"), "a")[0].stance, "wait");
  const blankStance = addSitting([], { id: "z", title: "Blank stance" });
  assert.equal(cycleStance(blankStance, "z")[0].stance, "wait");

  const edited = editSitting(saved, "a", "Bea sitting");
  assert.equal(edited[0].title, "Bea sitting");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editSitting(saved, "a", "   ")[0].title, "Ada sitting");
  const noted = editSittingNote(saved, "a", "fresh leaf");
  assert.equal(noted[0].note, "fresh leaf");
  assert.equal(editSittingNote(saved, "a", "   ")[0].note, "oak leaf");
  const tagged = addSittingTag(saved, "a", "gold");
  assert.deepEqual(tagged[0].tags, ["oak", "vip", "gold"]);
  assert.equal(tagged[0].audit, "tag");
  assert.equal(addSittingTag(tagged, "a", "extra")[0].tags.length, 3);
  assert.equal(addSittingTag(saved, "a", "A1")[0].tags.length, 2);

  const paused = setSittingPause(saved, "a", 15);
  assert.equal(paused[0].pause, 15);
  assert.equal(paused[0].audit, "pause");
  assert.equal(soonSitting(paused[0]), false);
  assert.equal(lateSitting(paused[0], "40"), false);
  assert.equal(setSittingPause(saved, "a", 45)[0].pause, 0);

  const moved = bulkSittingCloth(saved, ["a"], "velvet");
  assert.equal(moved[0].cloth, "velvet");
  assert.equal(moved[0].audit, "cloth");
  assert.equal(bulkSittingCloth(saved, ["a"], "satin")[0].cloth, "linen");

  const second = addSitting(saved, { id: "b", title: "Bea sitting", host: "Ada", minute: "12", cloth: "linen", room: "lon", stance: "seat", rank: "8", span: "30", tags: "oak" });
  assert.equal(usedMinutes(second), 2);
  assert.equal(suggestCloth([]), "velvet");
  assert.equal(suggestSpan([]), 30);
  assert.equal(suggestHost([]), "");
  assert.equal(fairHost(second, "Bea, Ada"), "Bea");
  assert.equal(busiestHost(second), "Ada");
  assert.equal(nextSitting(second, ""), "");
  assert.equal(nextSitting(second, "10"), "b");
  const finished = cycleStance(second, "b");
  assert.equal(finished.find((card) => card.id === "b")?.stance, "done");
  assert.equal(nextSitting(finished, "10"), "a");
  const resting = setSittingPause(second, "b", 30);
  assert.equal(nextSitting(resting, "10"), "a");
  const shown = visibleSittings(second, "open", "bea", null, null, null, null, null, null, null, null, false, false, false, false, false);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].id, "b");
  const taggedSearch = visibleSittings(second, "open", "oak", null, null, null, null, null, null, null, null, false, false, false, false, false);
  assert.equal(taggedSearch.length, 2);
  const house = visibleSittings(second, "open", "", null, null, null, null, null, null, null, null, false, false, true, false, false);
  assert.equal(house.length, 2);
  assert.equal(clashMinuteCount(second), 0);
  const twin = addSitting(second, { id: "c", title: "Cara sitting", host: "Bea", minute: "6", cloth: "linen", room: "ber", stance: "wait", rank: "2", span: "60" });
  assert.equal(clashMinuteCount(twin), 2);
  const split = addSitting(saved, { id: "b", title: "Wool sitting", host: "Ada", minute: "6", cloth: "wool", room: "ber", stance: "wait", rank: "2", span: "60" });
  assert.equal(clashMinuteCount(split), 0);
  assert.equal(rankClashCount(second), 2);
  assert.equal(readSittings([{ id: "q", title: "Kept", minute: "08" }])[0].minute, null);
  assert.equal(reminderSittings(second, "20").some((card) => card.id === "a"), true);
  assert.equal(reminderSittings(paused, "40").length, 0);
  assert.equal(sortSittings(second, "title")[0].title, "Ada sitting");
  assert.equal(sitLine("  Ada sitting  "), "Ada sitting");

  const view = addSittingView([], {
    id: "v1",
    name: "House peak",
    tray: "open",
    query: "ada",
    host: "all",
    cloth: "linen",
    room: "par",
    stance: "wait",
    minute: "peak",
    rank: "8",
    span: "15",
  });
  assert.equal(view.length, 1);
  assert.equal(view[0].minute, "peak");
  assert.equal(addSittingView(view, { ...view[0], id: "v2", name: "House peak" }).length, 1);

  const csv = sittingsCsv(second, "40");
  assert.equal(csv.startsWith("title,host,minute,cloth,room,stance,rank,span,tags,pause,pinned,held,closed,gap,late,soon,house,note,audit"), true);
  assert.equal(csv.includes("Ada sitting"), true);
  assert.equal(csv.includes("amount"), false);

  const rows = [
    { id: "1", label: "Ada", note: { city: "Oslo" } },
    { id: "2", label: "Bea", note: { city: "Berlin" } },
    { id: "3", label: "Gus", note: { city: "London" } },
    { id: "4", label: "Noa", note: { city: "Amsterdam" } },
    { id: "5", label: "Shut", note: { city: "Lima" } },
    { id: "6", label: "Empty", note: { city: "" } },
    { id: "7", label: "Missing", note: {} },
    { id: "8", label: "Blocked", note: { city: "Oslo", balance: 1 } },
  ];
  assert.equal(cityCopy(rows[0].note), "OSLO");
  assert.equal(cityState(rows[0].note), "set");
  assert.equal(cityBand(rows[0].note), "lane");
  assert.equal(cityBand(rows[1].note), "town");
  assert.equal(cityTone(rows[0].note), "open");
  assert.equal(cityTone(rows[1].note), "shut");
  assert.equal(cityState(rows[3].note), "");
  assert.equal(cityState(rows[5].note), "clear");
  assert.equal(cityState(rows[6].note), "");
  assert.equal(cityState(rows[7].note), "");
  assert.equal(cityState("Paris"), "");
  assert.equal(catalogCity(rows[0].note), true);
  assert.equal(catalogCity(rows[4].note), false);
  assert.equal(catalogCityCount(rows), 3);
  assert.equal(wideCityCount(rows), 2);
  assert.equal(openCityCount(rows), 1);
  assert.equal(sharedCityCount(rows), 0);
  assert.equal(visibleCityCustomers(rows, "lane", null, "", "all", [], "all").length, 2);
  assert.equal(visibleCityCustomers(rows, null, null, "ber", "all", [], "all").length, 1);
  const bands = citiesCsv(rows);
  assert.equal(bands.startsWith("kind,mark,count"), true);
  assert.equal(bands.includes("amount"), false);
  assert.equal(bands.includes("catalog"), true);
  const queue = cityRowsCsv(rows, ["1"]);
  assert.equal(queue.includes("Ada"), true);
  assert.equal(queue.split("\n")[1].endsWith(",1"), true);

  assert.equal(crmv4Text("en", "stbTitle"), ROUND193_COPY.en.stbTitle);
  assert.equal(crmv4Text("tr", "cmkTitle"), ROUND193_COPY.tr.cmkTitle);
  assert.equal(crmv4Text("de", "stbSearch"), ROUND193_COPY.de.stbSearch);
  assert.equal(crmv4Text("ru", "cmkHint"), ROUND193_COPY.ru.cmkHint);
  assert.equal(crmv4Text("ar", "stbNotice"), ROUND193_COPY.ar.stbNotice);
  assert.notEqual(ROUND193_COPY.tr.stbTitle, ROUND193_COPY.en.stbTitle);
  assert.notEqual(ROUND193_COPY.de.cmkTitle, ROUND193_COPY.en.cmkTitle);
  assert.notEqual(ROUND193_COPY.ru.stbSearch, ROUND193_COPY.en.stbSearch);
  assert.notEqual(ROUND193_COPY.ar.cmkSearch, ROUND193_COPY.en.cmkSearch);
  const keys = Object.keys(ROUND193_COPY.en);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND193_COPY[locale]), keys);
  }

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-stb/);
  assert.match(css, /\.c4-cmk/);
  assert.match(css, /\.c4-inbox-gallery/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round193.tsx"), "utf8");
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
  assert.match(viewFile, /city/);
  assert.match(viewFile, /sittingsCsv/);
  assert.match(viewFile, /citiesCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-sittings/);
  assert.match(viewFile, /data-cities/);
  assert.match(viewFile, /data-catalog/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestCloth/);
  const inbox = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round29.tsx"), "utf8");
  assert.match(inbox, /c4-inbox-gallery/);
  assert.match(inbox, /data-logo="mono"/);
  assert.match(inbox, /c4-inbox-gallery-mast/);
  assert.match(inbox, /c4-inbox-gallery-split/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "sbook"/);
  assert.match(app, /view === "cmks"/);
  assert.match(app, /SittingBook/);
  assert.match(app, /CityMarks/);
  console.log("crmv4 round193 tests passed");
}

main();
