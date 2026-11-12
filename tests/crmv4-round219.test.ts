/**
 * Seat cards and group marks.
 * Run: TZ=UTC npx tsx tests/crmv4-round219.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND219_COPY } from "../src/lib/crmv4/copy-round219";
import {
  activePace,
  activeSeat,
  activeWait,
  addCard,
  addCardTag,
  addSeatView,
  adjacentCardCount,
  catalogMark,
  catalogMarkCount,
  clothOf,
  cyclePace,
  densityOf,
  fairHost,
  houseCloth,
  lateCard,
  leadingMark,
  markLane,
  markOf,
  markRowsCsv,
  markState,
  markStep,
  markTone,
  marksCsv,
  moveFocus,
  peakSeat,
  quietSeat,
  rankOf,
  readSeatViews,
  seatGap,
  seatOf,
  setCardRank,
  sharedMarkCount,
  snoozeCard,
  suggestCloth,
  suggestWait,
  waitOf,
  wideMark,
  windowCards,
  cardsCsv,
} from "../src/lib/crmv4/round219";

function main() {
  assert.equal(clothOf("  ivory "), "IVORY");
  assert.equal(clothOf("slate"), "SLATE");
  assert.equal(clothOf("gilt"), "GILT");
  assert.equal(clothOf("   "), "");
  assert.equal(clothOf("oak"), "");
  assert.equal(seatOf("1"), 1);
  assert.equal(seatOf(8), 8);
  assert.equal(seatOf("8"), 8);
  assert.equal(seatOf("0"), null);
  assert.equal(seatOf(0), null);
  assert.equal(seatOf("9"), null);
  assert.equal(seatOf("08"), null);
  assert.equal(seatOf(""), null);
  assert.equal(seatOf(1.5), null);
  assert.equal(waitOf("5"), 5);
  assert.equal(waitOf(15), 15);
  assert.equal(waitOf("45"), 45);
  assert.equal(waitOf("9"), null);
  assert.equal(waitOf("05"), null);
  assert.equal(rankOf("0"), 0);
  assert.equal(rankOf(2), 2);
  assert.equal(rankOf("4"), 4);
  assert.equal(rankOf("1"), null);
  assert.equal(rankOf("3"), null);
  assert.equal(peakSeat(3), true);
  assert.equal(peakSeat(6), true);
  assert.equal(peakSeat(4), false);
  assert.equal(quietSeat(8), true);
  assert.equal(quietSeat(1), false);
  assert.equal(seatGap(1, 8), 7);
  assert.equal(seatGap(8, 1), -7);
  assert.equal(seatGap(null, 3), null);
  assert.equal(seatGap(1, 0), null);
  assert.equal(houseCloth("ivory"), true);
  assert.equal(houseCloth("GILT"), true);
  assert.equal(houseCloth("slate"), false);
  assert.equal(activeSeat("peak"), "peak");
  assert.equal(activeSeat("8"), "8");
  assert.equal(activeSeat("9"), "all");
  assert.equal(activeWait("15"), "15");
  assert.equal(activeWait("9"), "all");
  assert.equal(activePace("rush", ["still", "walk", "rush"]), "rush");
  assert.equal(activePace("nope", ["still", "walk", "rush"]), "all");
  assert.equal(densityOf("tight"), "tight");
  assert.equal(densityOf("nope"), "airy");
  assert.equal(moveFocus(0, 3, 1), 1);
  assert.equal(moveFocus(0, 3, -1), 2);
  assert.equal(suggestCloth([]), "SLATE");
  assert.equal(suggestWait([]), 15);

  const first = addCard([], {
    id: "a",
    title: "  North proof ",
    note: "quiet",
    host: "Ada",
    seat: "1",
    cloth: "ivory",
    pace: "still",
    wait: "5",
    tags: "e f g h z",
    rank: "2",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North proof");
  assert.equal(first[0].cloth, "IVORY");
  assert.equal(first[0].seat, 1);
  assert.equal(first[0].wait, 5);
  assert.deepEqual(first[0].tags, ["e", "f", "g"]);
  assert.equal(first[0].rank, 2);
  assert.equal(first[0].audit, "save");
  assert.equal(addCard(first, { id: "a", title: "Other" }).length, 1);
  assert.equal(addCard(first, { id: "b", title: "North proof" }).length, 1);
  assert.equal(addCard(first, { id: "c", title: "   " }).length, 1);
  const paced = cyclePace([{ ...first[0], pace: "" }], "a");
  assert.equal(paced[0].pace, "still");
  assert.equal(cyclePace(paced, "a")[0].pace, "walk");
  assert.equal(cyclePace(cyclePace(paced, "a"), "a")[0].pace, "rush");
  assert.equal(cyclePace(cyclePace(cyclePace(paced, "a"), "a"), "a")[0].pace, "still");
  assert.equal(addCardTag(first, "a", "h").length, 1);
  assert.equal(addCardTag(first, "a", "h")[0].tags.length, 3);
  assert.equal(addCardTag(first, "a", "e")[0].tags.length, 3);
  assert.equal(addCardTag(first, "a", "z")[0].tags.length, 3);
  assert.equal(setCardRank(first, "a", 0)[0].rank, 0);
  assert.equal(setCardRank(first, "a", 1)[0].rank, 2);
  const snoozed = snoozeCard([{ ...first[0], wait: null }], "a");
  assert.equal(snoozed[0].wait, 5);
  assert.equal(snoozeCard(snoozed, "a")[0].wait, 15);
  assert.equal(snoozeCard(snoozeCard(snoozed, "a"), "a")[0].wait, 45);
  assert.equal(snoozeCard(snoozeCard(snoozeCard(snoozed, "a"), "a"), "a")[0].wait, 45);

  const open = [{ ...first[0], rank: 0, held: false, archived: false }];
  assert.equal(lateCard(open[0], 8), true);
  assert.equal(lateCard({ ...open[0], seat: 6 }, 8), false);
  assert.equal(lateCard({ ...open[0], seat: 5 }, 8), true);
  assert.equal(lateCard({ ...open[0], rank: 2 }, 8), false);
  assert.equal(windowCards([{ ...open[0], seat: 6 }], 8).length, 1);
  assert.equal(windowCards([{ ...open[0], seat: 1 }], 8).length, 0);
  assert.equal(fairHost(open, "Bea, Ada"), "Bea");
  const pair = addCard(addCard([], { id: "p", title: "One", seat: 1, cloth: "ivory" }), { id: "q", title: "Four", seat: 4, cloth: "ivory" });
  assert.equal(adjacentCardCount(pair), 2);

  const views = addSeatView([], {
    id: "v1",
    name: "Peak",
    tray: "open",
    query: "",
    host: "all",
    cloth: "IVORY",
    pace: "still",
    seat: "peak",
    wait: "5",
    rank: "0",
  });
  assert.equal(readSeatViews(views)[0].seat, "peak");
  assert.equal(readSeatViews(views)[0].cloth, "IVORY");

  const csv = cardsCsv(open, 8);
  assert.match(csv, /North proof,Ada,1,IVORY/);
  assert.match(csv, /,7,/);

  assert.equal(markOf("  standard "), "STAN");
  assert.equal(markOf("vip"), "VIP");
  assert.equal(markLane("vip"), "salon");
  assert.equal(markLane("ivory desk"), "salon");
  assert.equal(markLane("7fx pro"), "salon");
  assert.equal(markLane("group2"), "floor");
  assert.equal(markLane("retail"), "yard");
  assert.equal(markLane("plain"), "yard");
  assert.equal(markLane(""), "");
  assert.equal(markTone("vip"), "gilt");
  assert.equal(markTone("gold-desk"), "gilt");
  assert.equal(markTone("verylongname"), "ivory");
  assert.equal(markTone("ab"), "mist");
  assert.equal(markTone("group2"), "ink");
  assert.equal(markState(""), "clear");
  assert.equal(markState(null), "clear");
  assert.equal(markState({ tradingGroup: "vip" }), "set");
  assert.equal(markState({ tradingGroup: "vip", email: "1" }), "");
  assert.equal(catalogMark("standard"), true);
  assert.equal(catalogMark("VIP"), true);
  assert.equal(catalogMark("desk"), true);
  assert.equal(catalogMark("retail"), false);
  assert.equal(wideMark("vip"), false);
  assert.equal(wideMark("gold-desk-extra"), true);
  assert.equal(markStep(""), 0);
  assert.equal(markStep("retail"), 1);
  assert.equal(markStep("gold-desk"), 2);
  assert.equal(markStep("group2"), 3);
  assert.equal(markStep("a-b2"), 3);
  const people = [
    { id: "1", label: "Ada", note: "retail" },
    { id: "2", label: "Bea", note: "vip" },
    { id: "3", label: "Cy", note: "gold-desk-extra" },
  ];
  assert.equal(leadingMark(people), "salon");
  assert.equal(sharedMarkCount([{ id: "1", label: "Ada", note: "standard" }, { id: "2", label: "Bea", note: "stanmore" }]), 2);
  assert.equal(catalogMarkCount(people), 1);
  assert.match(marksCsv(people), /salon,2/);
  assert.match(markRowsCsv(people, ["2"]), /Bea,VIP,salon,gilt,1,1,0,1/);

  const keys = Object.keys(ROUND219_COPY.en);
  assert.ok(keys.length >= 120);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND219_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND219_COPY[locale][key as keyof typeof ROUND219_COPY.en], "string");
      assert.ok(ROUND219_COPY[locale][key as keyof typeof ROUND219_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "stcTitle"), ROUND219_COPY.tr.stcTitle);
  assert.equal(crmv4Text("de", "gmkTitle"), ROUND219_COPY.de.gmkTitle);
  assert.equal(crmv4Text("ru", "stcSub"), ROUND219_COPY.ru.stcSub);
  assert.equal(crmv4Text("ar", "gmkSub"), ROUND219_COPY.ar.gmkSub);
  assert.equal(crmv4Text("en", "stcLogo"), "7FX");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-stc/);
  assert.match(css, /\.c4-gmk-index/);
  assert.match(css, /\.c4-cust-seat/);
  assert.match(css, /\.c4-gmk-time/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round219.tsx"), "utf8");
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
  assert.equal(viewFile.includes("validationStatus"), false);
  assert.equal(viewFile.includes("registrationDate"), false);
  assert.equal(viewFile.includes("birthDate"), false);
  assert.equal(viewFile.includes("lastContactAt"), false);
  assert.equal(viewFile.includes("assigneeId"), false);
  assert.equal(viewFile.includes("lastBrowser"), false);
  assert.equal(viewFile.includes("isResident"), false);
  assert.equal(viewFile.includes("phone"), false);
  assert.equal(viewFile.includes("email"), false);
  assert.match(viewFile, /tradingGroup/);
  assert.match(viewFile, /cardsCsv/);
  assert.match(viewFile, /marksCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /event\.key === "w"/);
  assert.match(viewFile, /event\.key === "r"/);
  assert.match(viewFile, /event\.key === "t"/);
  assert.match(viewFile, /event\.key === "h"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-marks/);
  assert.match(viewFile, /data-catalog/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestCloth/);
  assert.match(viewFile, /c4-gmk-time/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "stcd"/);
  assert.match(app, /view === "gmkp"/);
  assert.match(app, /SeatCards/);
  assert.match(app, /GroupMarks/);
  assert.match(app, /c4-pagehead-seat/);
  assert.match(app, /c4-rail-seat/);
  const customers = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Customers.tsx"), "utf8");
  assert.match(customers, /c4-cust-seat/);
  assert.match(customers, /c4-cust-seat-index/);
  assert.match(customers, /data-logo="mono"/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of used) assert.ok(key in ROUND219_COPY.en, key);
  console.log("crmv4 round219 tests passed");
}

main();
