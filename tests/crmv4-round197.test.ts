/**
 * Waitlist slots and follow stamps.
 * Run: TZ=UTC npx tsx tests/crmv4-round197.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND197_COPY } from "../src/lib/crmv4/copy-round197";
import {
  activeHour,
  activeRank,
  activeSpan,
  addSlot,
  addSlotTag,
  addSlotView,
  bulkSlotSeat,
  busiestHost,
  catalogStamp,
  catalogStampCount,
  clashHourCount,
  cyclePace,
  densityOf,
  duskHour,
  editSlot,
  editSlotNote,
  fairHost,
  firmStampCount,
  hourGap,
  hourOf,
  houseSeat,
  hushOf,
  lateSlot,
  moveFocus,
  nextSlot,
  peakHour,
  rankClashCount,
  rankOf,
  readSlots,
  reminderSlots,
  rowStampCount,
  seatOf,
  setSlotHush,
  sharedStampCount,
  slotLine,
  slotsCsv,
  soonSlot,
  sortSlots,
  spanOf,
  stampBand,
  stampCopy,
  stampRowsCsv,
  stampState,
  stampTone,
  stampsCsv,
  suggestHost,
  suggestSeat,
  suggestSpan,
  usedHours,
  visibleSlots,
  visibleStampCustomers,
} from "../src/lib/crmv4/round197";

function main() {
  assert.equal(seatOf("  one "), "ONE");
  assert.equal(seatOf("two"), "TWO");
  assert.equal(seatOf("arc"), "ARC");
  assert.equal(seatOf("   "), "");
  assert.equal(seatOf("ON"), "");
  assert.equal(seatOf("FOUR"), "");
  assert.equal(hourOf("1"), 1);
  assert.equal(hourOf(1), 1);
  assert.equal(hourOf("12"), 12);
  assert.equal(hourOf("6"), 6);
  assert.equal(hourOf("0"), null);
  assert.equal(hourOf("01"), null);
  assert.equal(hourOf("13"), null);
  assert.equal(hourOf(""), null);
  assert.equal(rankOf("1"), 1);
  assert.equal(rankOf(2), 2);
  assert.equal(rankOf("4"), 4);
  assert.equal(rankOf("3"), null);
  assert.equal(rankOf("01"), null);
  assert.equal(spanOf("15"), 15);
  assert.equal(spanOf(30), 30);
  assert.equal(spanOf("60"), 60);
  assert.equal(spanOf("0"), null);
  assert.equal(spanOf("015"), null);
  assert.equal(spanOf("45"), null);
  assert.equal(hushOf("0"), 0);
  assert.equal(hushOf(15), 15);
  assert.equal(hushOf("30"), 30);
  assert.equal(hushOf("10"), null);
  assert.equal(peakHour(2), true);
  assert.equal(peakHour(5), true);
  assert.equal(peakHour(8), true);
  assert.equal(peakHour(11), true);
  assert.equal(peakHour(1), false);
  assert.equal(duskHour(1), true);
  assert.equal(duskHour(12), true);
  assert.equal(duskHour(2), false);
  assert.equal(duskHour(11), false);
  assert.equal(hourGap(1, 12), -1);
  assert.equal(hourGap(12, 1), 1);
  assert.equal(hourGap(1, 7), 6);
  assert.equal(hourGap(7, 1), -6);
  assert.equal(hourGap(6, 12), 6);
  assert.equal(hourGap(null, 2), null);
  assert.equal(hourGap(2, ""), null);
  assert.equal(hourGap(2, 0), null);
  assert.equal(activeHour("peak"), "peak");
  assert.equal(activeHour("99"), "all");
  assert.equal(activeRank("2"), "2");
  assert.equal(activeRank("3"), "all");
  assert.equal(activeSpan("blank"), "blank");
  assert.equal(activeSpan("45"), "all");
  assert.equal(densityOf("tight"), "tight");
  assert.equal(densityOf("nope"), "roomy");
  assert.equal(moveFocus(0, 3, 1), 1);
  assert.equal(moveFocus(0, 3, -1), 2);
  assert.equal(moveFocus(2, 3, 1), 0);
  assert.equal(moveFocus(1, 0, 1), 0);

  const saved = addSlot([], { id: "a", title: "Ada slot", note: "oak leaf", host: "Nia", hour: "6", seat: "one", pace: "call", rank: "4", span: "15", tags: "oak, vip, gold", hush: "0" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].hour, 6);
  assert.equal(saved[0].rank, 4);
  assert.equal(saved[0].span, 15);
  assert.equal(saved[0].seat, "ONE");
  assert.equal(saved[0].note, "oak leaf");
  assert.deepEqual(saved[0].tags, ["oak", "vip", "gold"]);
  assert.equal(saved[0].audit, "save");
  assert.equal(houseSeat(saved[0].seat), true);
  assert.equal(houseSeat("IST"), false);
  assert.equal(soonSlot(saved[0]), true);
  assert.equal(lateSlot(saved[0], "12"), true);
  assert.equal(lateSlot(saved[0], "8"), false);
  assert.equal(addSlot(saved, { id: "b", title: "Ada slot" }).length, 1);
  assert.equal(addSlot(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(addSlot(saved, { id: "c", title: "   " }).length, 1);
  const capped = Array.from({ length: 12 }, (_, index) => ({ id: `n${index}`, title: `Line ${index}` })).reduce((slots, slot) => addSlot(slots, slot), [] as ReturnType<typeof addSlot>);
  assert.equal(capped.length, 8);
  assert.equal(capped.some((slot) => slot.title === "Line 0"), false);
  assert.equal(capped[0].title, "Line 11");

  const cycled = cyclePace(saved, "a");
  assert.equal(cycled[0].pace, "hold");
  assert.equal(cycled[0].audit, "pace");
  assert.equal(cyclePace(cycled, "a")[0].pace, "done");
  assert.equal(cyclePace(cyclePace(cycled, "a"), "a")[0].pace, "call");
  const blankPace = addSlot([], { id: "z", title: "Blank pace" });
  assert.equal(cyclePace(blankPace, "z")[0].pace, "call");

  const edited = editSlot(saved, "a", "Bea slot");
  assert.equal(edited[0].title, "Bea slot");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editSlot(saved, "a", "   ")[0].title, "Ada slot");
  const noted = editSlotNote(saved, "a", "fresh leaf");
  assert.equal(noted[0].note, "fresh leaf");
  assert.equal(editSlotNote(saved, "a", "   ")[0].note, "oak leaf");
  const oneTag = addSlot([], { id: "t", title: "Tag slot", tags: "oak" });
  const tagged = addSlotTag(oneTag, "t", "gold");
  assert.deepEqual(tagged[0].tags, ["oak", "gold"]);
  assert.equal(tagged[0].audit, "tag");
  assert.equal(addSlotTag(tagged, "t", "silk").length, 1);
  assert.equal(addSlotTag(addSlotTag(tagged, "t", "silk"), "t", "extra")[0].tags.length, 3);

  const hushed = setSlotHush(saved, "a", 15);
  assert.equal(hushed[0].hush, 15);
  assert.equal(hushed[0].audit, "hush");
  assert.equal(soonSlot(hushed[0]), false);
  assert.equal(lateSlot(hushed[0], "12"), false);
  assert.equal(setSlotHush(saved, "a", 10)[0].hush, 0);

  const moved = bulkSlotSeat(saved, ["a"], "arc");
  assert.equal(moved[0].seat, "ARC");
  assert.equal(moved[0].audit, "seat");
  assert.equal(bulkSlotSeat(saved, ["a"], "satin")[0].seat, "ONE");

  const second = addSlot(saved, { id: "b", title: "Bea slot", host: "Ada", hour: "8", seat: "two", pace: "hold", rank: "4", span: "30", tags: "oak" });
  assert.equal(usedHours(second), 2);
  assert.equal(suggestSeat([]), "ONE");
  assert.equal(suggestSpan([]), 30);
  assert.equal(suggestHost([]), "");
  assert.equal(fairHost(second, "Bea, Ada"), "Bea");
  assert.equal(busiestHost(second), "Ada");
  assert.equal(nextSlot(second, ""), "");
  assert.equal(nextSlot(second, "7"), "b");
  const finished = cyclePace(second, "b");
  assert.equal(finished.find((slot) => slot.id === "b")?.pace, "done");
  assert.equal(nextSlot(finished, "7"), "a");
  const resting = setSlotHush(second, "b", 30);
  assert.equal(nextSlot(resting, "7"), "a");
  const shown = visibleSlots(second, "open", "bea", null, null, null, null, null, null, null, false, false, false, false, false);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].id, "b");
  const taggedSearch = visibleSlots(second, "open", "oak", null, null, null, null, null, null, null, false, false, false, false, false);
  assert.equal(taggedSearch.length, 2);
  const house = visibleSlots(second, "open", "", null, null, null, null, null, null, null, false, false, true, false, false);
  assert.equal(house.length, 2);
  assert.equal(clashHourCount(second), 0);
  const twin = addSlot(second, { id: "c", title: "Cara slot", host: "Bea", hour: "6", seat: "one", pace: "call", rank: "1", span: "60" });
  assert.equal(clashHourCount(twin), 2);
  const split = addSlot(saved, { id: "b", title: "Warm slot", host: "Ada", hour: "6", seat: "two", pace: "call", rank: "1", span: "60" });
  assert.equal(clashHourCount(split), 0);
  assert.equal(rankClashCount(second), 2);
  assert.equal(readSlots([{ id: "q", title: "Kept", hour: "01" }])[0].hour, null);
  assert.equal(reminderSlots(second, "12").some((slot) => slot.id === "a"), true);
  assert.equal(reminderSlots(hushed, "12").length, 0);
  assert.equal(sortSlots(second, "title")[0].title, "Ada slot");
  assert.equal(slotLine("  Ada slot  "), "Ada slot");

  const mixed = addSlot(
    addSlot(
      addSlot(
        addSlot(addSlot([], { id: "o1", title: "One one", seat: "one" }), { id: "o2", title: "One two", seat: "one" }),
        { id: "t1", title: "Two one", seat: "two" },
      ),
      { id: "a1", title: "Arc one", seat: "arc" },
    ),
    { id: "x1", title: "Arc two", seat: "arc" },
  );
  assert.equal(suggestSeat(mixed), "TWO");

  const view = addSlotView([], {
    id: "v1",
    name: "House peak",
    tray: "open",
    query: "ada",
    host: "all",
    seat: "one",
    pace: "call",
    hour: "peak",
    rank: "4",
    span: "15",
  });
  assert.equal(view.length, 1);
  assert.equal(view[0].hour, "peak");
  assert.equal(addSlotView(view, { ...view[0], id: "v2", name: "House peak" }).length, 1);

  const csv = slotsCsv(second, "12");
  assert.equal(csv.startsWith("title,host,hour,seat,pace,rank,span,tags,hush,pinned,held,closed,gap,late,soon,house,note,audit"), true);
  assert.equal(csv.includes("Ada slot"), true);
  assert.equal(csv.includes("amount"), false);

  const rows = [
    { id: "1", label: "Ada", note: { retentionNote: "MEET" } },
    { id: "2", label: "Bea", note: { retentionNote: "ping" } },
    { id: "3", label: "Gus", note: { retentionNote: "HOLD" } },
    { id: "4", label: "Noa", note: { retentionNote: "Left word" } },
    { id: "5", label: "Paris", note: { retentionNote: "Please review the long note today now" } },
    { id: "6", label: "Empty", note: { retentionNote: "" } },
    { id: "7", label: "Missing", note: {} },
    { id: "8", label: "Blocked", note: { retentionNote: "MEET", balance: 1 } },
  ];
  assert.equal(stampCopy(rows[0].note), "MEET");
  assert.equal(stampState(rows[0].note), "set");
  assert.equal(stampBand(rows[0].note), "chip");
  assert.equal(stampBand(rows[3].note), "pair");
  assert.equal(stampBand(rows[4].note), "row");
  assert.equal(stampTone(rows[0].note), "firm");
  assert.equal(stampTone(rows[1].note), "soft");
  assert.equal(stampState({ retentionNote: "Paris" }), "set");
  assert.equal(stampState(rows[5].note), "clear");
  assert.equal(stampState(rows[6].note), "");
  assert.equal(stampState(rows[7].note), "");
  assert.equal(stampState("MEET"), "set");
  assert.equal(catalogStamp(rows[0].note), true);
  assert.equal(catalogStamp(rows[1].note), true);
  assert.equal(catalogStamp(rows[3].note), false);
  assert.equal(catalogStampCount(rows), 3);
  assert.equal(rowStampCount(rows), 1);
  assert.equal(firmStampCount(rows), 2);
  assert.equal(sharedStampCount(rows), 0);
  assert.equal(visibleStampCustomers(rows, "chip", null, "", "all", [], "all").length, 3);
  assert.equal(visibleStampCustomers(rows, null, null, "par", "all", [], "all").length, 1);
  const bands = stampsCsv(rows);
  assert.equal(bands.startsWith("kind,mark,count"), true);
  assert.equal(bands.includes("amount"), false);
  assert.equal(bands.includes("catalog"), true);
  const queue = stampRowsCsv(rows, ["1"]);
  assert.equal(queue.includes("Ada"), true);
  assert.equal(queue.split("\n")[1].endsWith(",1"), true);

  assert.equal(crmv4Text("en", "wslTitle"), ROUND197_COPY.en.wslTitle);
  assert.equal(crmv4Text("tr", "fstTitle"), ROUND197_COPY.tr.fstTitle);
  assert.equal(crmv4Text("de", "wslSearch"), ROUND197_COPY.de.wslSearch);
  assert.equal(crmv4Text("ru", "fstHint"), ROUND197_COPY.ru.fstHint);
  assert.equal(crmv4Text("ar", "wslNotice"), ROUND197_COPY.ar.wslNotice);
  assert.notEqual(ROUND197_COPY.tr.wslTitle, ROUND197_COPY.en.wslTitle);
  assert.notEqual(ROUND197_COPY.de.fstTitle, ROUND197_COPY.en.fstTitle);
  assert.notEqual(ROUND197_COPY.ru.wslSearch, ROUND197_COPY.en.wslSearch);
  assert.notEqual(ROUND197_COPY.ar.fstSearch, ROUND197_COPY.en.fstSearch);
  const keys = Object.keys(ROUND197_COPY.en);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND197_COPY[locale]), keys);
    for (const key of keys) {
      assert.equal(typeof ROUND197_COPY[locale][key as keyof typeof ROUND197_COPY.en], "string");
      assert.ok(ROUND197_COPY[locale][key as keyof typeof ROUND197_COPY.en]);
    }
  }

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-wsl/);
  assert.match(css, /\.c4-fst/);
  assert.match(css, /\.c4-pagehead-inlay/);
  assert.match(css, /\.c4-cust-inlay/);
  assert.match(css, /\.c4-rail-inlay/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round197.tsx"), "utf8");
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
  assert.match(viewFile, /retentionNote/);
  assert.match(viewFile, /slotsCsv/);
  assert.match(viewFile, /stampsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-waitlist/);
  assert.match(viewFile, /data-stamps/);
  assert.match(viewFile, /data-catalog/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestSeat/);
  const customers = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Customers.tsx"), "utf8");
  assert.match(customers, /c4-cust-inlay/);
  assert.match(customers, /c4-cust-inlay-mast/);
  assert.match(customers, /data-logo="mono"/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "wslt"/);
  assert.match(app, /view === "fstp"/);
  assert.match(app, /WaitlistSlots/);
  assert.match(app, /FollowStamps/);
  assert.match(app, /c4-pagehead-inlay/);
  assert.match(app, /c4-rail-inlay/);
  console.log("crmv4 round197 tests passed");
}

main();
