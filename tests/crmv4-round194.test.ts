/**
 * Courtesy cards and country seals.
 * Run: TZ=UTC npx tsx tests/crmv4-round194.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND194_COPY } from "../src/lib/crmv4/copy-round194";
import {
  activeHour,
  activeWeight,
  activeWindow,
  addCard,
  addCardTag,
  addCardView,
  bulkCardTone,
  busiestAgent,
  cardsCsv,
  catalogSeal,
  catalogSealCount,
  clashHourCount,
  cycleStage,
  densityOf,
  deskOf,
  editCard,
  editCardNote,
  fairAgent,
  hourGap,
  hourOf,
  houseDesk,
  lateCard,
  moveFocus,
  nextCard,
  peakHour,
  quietHour,
  readCards,
  reminderCards,
  sealBand,
  sealCopy,
  sealRowsCsv,
  sealState,
  sealTone,
  sealsCsv,
  setCardSnooze,
  sharedSealCount,
  softSealCount,
  soonCard,
  sortCards,
  suggestAgent,
  suggestTone,
  suggestWindow,
  usedHours,
  visibleCards,
  visibleSealCustomers,
  weightClashCount,
  weightOf,
  wideSealCount,
  windowOf,
  cardLine,
} from "../src/lib/crmv4/round194";

function main() {
  assert.equal(deskOf("  ny "), "NY");
  assert.equal(deskOf("ln"), "LN");
  assert.equal(deskOf("dx"), "DX");
  assert.equal(deskOf("   "), "");
  assert.equal(deskOf("N"), "");
  assert.equal(deskOf("NYC"), "");
  assert.equal(hourOf("0"), 0);
  assert.equal(hourOf(0), 0);
  assert.equal(hourOf("23"), 23);
  assert.equal(hourOf("9"), 9);
  assert.equal(hourOf("00"), null);
  assert.equal(hourOf("08"), null);
  assert.equal(hourOf("24"), null);
  assert.equal(hourOf(""), null);
  assert.equal(weightOf("1"), 1);
  assert.equal(weightOf(3), 3);
  assert.equal(weightOf("0"), null);
  assert.equal(weightOf("2"), null);
  assert.equal(weightOf("01"), null);
  assert.equal(windowOf("10"), 10);
  assert.equal(windowOf(20), 20);
  assert.equal(windowOf("0"), null);
  assert.equal(windowOf("010"), null);
  assert.equal(windowOf("15"), null);
  assert.equal(peakHour(9), true);
  assert.equal(peakHour(15), true);
  assert.equal(peakHour(2), false);
  assert.equal(quietHour(2), true);
  assert.equal(quietHour(4), true);
  assert.equal(quietHour(9), false);
  assert.equal(quietHour(15), false);
  assert.equal(hourGap(20, 0), 4);
  assert.equal(hourGap(0, 20), -4);
  assert.equal(hourGap(0, 8), 8);
  assert.equal(hourGap(8, 0), -8);
  assert.equal(hourGap(6, 18), 12);
  assert.equal(hourGap(18, 6), -12);
  assert.equal(hourGap(null, 2), null);
  assert.equal(hourGap(2, ""), null);
  assert.equal(hourGap(2, 24), null);
  assert.equal(activeHour("peak"), "peak");
  assert.equal(activeHour("99"), "all");
  assert.equal(activeWeight("3"), "3");
  assert.equal(activeWeight("2"), "all");
  assert.equal(activeWindow("blank"), "blank");
  assert.equal(activeWindow("15"), "all");
  assert.equal(densityOf("tight"), "tight");
  assert.equal(densityOf("nope"), "roomy");
  assert.equal(moveFocus(0, 3, 1), 1);
  assert.equal(moveFocus(0, 3, -1), 2);
  assert.equal(moveFocus(2, 3, 1), 0);
  assert.equal(moveFocus(1, 0, 1), 0);

  const saved = addCard([], { id: "a", title: "Ada card", note: "oak leaf", agent: "Nia", hour: "6", tone: "calm", desk: "ny", stage: "draft", weight: "5", window: "10", tags: "oak, vip", snooze: "0" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].hour, 6);
  assert.equal(saved[0].weight, 5);
  assert.equal(saved[0].window, 10);
  assert.equal(saved[0].desk, "NY");
  assert.equal(saved[0].note, "oak leaf");
  assert.deepEqual(saved[0].tags, ["oak", "vip"]);
  assert.equal(saved[0].audit, "save");
  assert.equal(houseDesk(saved[0].desk), true);
  assert.equal(houseDesk("IST"), false);
  assert.equal(soonCard(saved[0]), true);
  assert.equal(lateCard(saved[0], "12"), true);
  assert.equal(lateCard(saved[0], "10"), false);
  assert.equal(addCard(saved, { id: "b", title: "Ada card" }).length, 1);
  assert.equal(addCard(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(addCard(saved, { id: "c", title: "   " }).length, 1);
  const capped = Array.from({ length: 10 }, (_, index) => ({ id: `n${index}`, title: `Line ${index}` })).reduce((cards, card) => addCard(cards, card), [] as ReturnType<typeof addCard>);
  assert.equal(capped.length, 6);
  assert.equal(capped.some((card) => card.title === "Line 0"), false);
  assert.equal(capped[0].title, "Line 9");

  const cycled = cycleStage(saved, "a");
  assert.equal(cycled[0].stage, "ring");
  assert.equal(cycled[0].audit, "stage");
  assert.equal(cycleStage(cycled, "a")[0].stage, "done");
  assert.equal(cycleStage(cycleStage(cycled, "a"), "a")[0].stage, "draft");
  const blankStage = addCard([], { id: "z", title: "Blank stage" });
  assert.equal(cycleStage(blankStage, "z")[0].stage, "draft");

  const edited = editCard(saved, "a", "Bea card");
  assert.equal(edited[0].title, "Bea card");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editCard(saved, "a", "   ")[0].title, "Ada card");
  const noted = editCardNote(saved, "a", "fresh leaf");
  assert.equal(noted[0].note, "fresh leaf");
  assert.equal(editCardNote(saved, "a", "   ")[0].note, "oak leaf");
  const tagged = addCardTag(saved, "a", "gold");
  assert.equal(tagged[0].tags.length, 2);
  assert.equal(tagged[0].audit, "save");
  assert.equal(addCardTag(saved, "a", "gold").length, 1);
  assert.equal(addCardTag(tagged, "a", "extra")[0].tags.length, 2);

  const snoozed = setCardSnooze(saved, "a", 10);
  assert.equal(snoozed[0].snooze, 10);
  assert.equal(snoozed[0].audit, "snooze");
  assert.equal(soonCard(snoozed[0]), false);
  assert.equal(lateCard(snoozed[0], "16"), false);
  assert.equal(setCardSnooze(saved, "a", 45)[0].snooze, 0);

  const moved = bulkCardTone(saved, ["a"], "firm");
  assert.equal(moved[0].tone, "firm");
  assert.equal(moved[0].audit, "tone");
  assert.equal(bulkCardTone(saved, ["a"], "satin")[0].tone, "calm");

  const second = addCard(saved, { id: "b", title: "Bea card", agent: "Ada", hour: "12", tone: "calm", desk: "ln", stage: "ring", weight: "5", window: "20", tags: "oak" });
  assert.equal(usedHours(second), 2);
  assert.equal(suggestTone([]), "firm");
  assert.equal(suggestWindow([]), 20);
  assert.equal(suggestAgent([]), "");
  assert.equal(fairAgent(second, "Bea, Ada"), "Bea");
  assert.equal(busiestAgent(second), "Ada");
  assert.equal(nextCard(second, ""), "");
  assert.equal(nextCard(second, "10"), "b");
  const finished = cycleStage(second, "b");
  assert.equal(finished.find((card) => card.id === "b")?.stage, "done");
  assert.equal(nextCard(finished, "10"), "a");
  const resting = setCardSnooze(second, "b", 20);
  assert.equal(nextCard(resting, "10"), "a");
  const shown = visibleCards(second, "open", "bea", null, null, null, null, null, null, null, null, false, false, false, false, false);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].id, "b");
  const taggedSearch = visibleCards(second, "open", "oak", null, null, null, null, null, null, null, null, false, false, false, false, false);
  assert.equal(taggedSearch.length, 2);
  const house = visibleCards(second, "open", "", null, null, null, null, null, null, null, null, false, false, true, false, false);
  assert.equal(house.length, 2);
  assert.equal(clashHourCount(second), 0);
  const twin = addCard(second, { id: "c", title: "Cara card", agent: "Bea", hour: "6", tone: "calm", desk: "dx", stage: "draft", weight: "1", window: "40" });
  assert.equal(clashHourCount(twin), 2);
  const split = addCard(saved, { id: "b", title: "Warm card", agent: "Ada", hour: "6", tone: "warm", desk: "dx", stage: "draft", weight: "1", window: "40" });
  assert.equal(clashHourCount(split), 0);
  assert.equal(weightClashCount(second), 2);
  assert.equal(readCards([{ id: "q", title: "Kept", hour: "08" }])[0].hour, null);
  assert.equal(reminderCards(second, "12").some((card) => card.id === "a"), true);
  assert.equal(reminderCards(snoozed, "16").length, 0);
  assert.equal(sortCards(second, "title")[0].title, "Ada card");
  assert.equal(cardLine("  Ada card  "), "Ada card");

  const view = addCardView([], {
    id: "v1",
    name: "House peak",
    tray: "open",
    query: "ada",
    agent: "all",
    tone: "calm",
    desk: "ny",
    stage: "draft",
    hour: "peak",
    weight: "5",
    window: "10",
  });
  assert.equal(view.length, 1);
  assert.equal(view[0].hour, "peak");
  assert.equal(addCardView(view, { ...view[0], id: "v2", name: "House peak" }).length, 1);

  const csv = cardsCsv(second, "16");
  assert.equal(csv.startsWith("title,agent,hour,tone,desk,stage,weight,window,tags,snooze,pinned,held,closed,gap,late,soon,house,note,audit"), true);
  assert.equal(csv.includes("Ada card"), true);
  assert.equal(csv.includes("amount"), false);

  const rows = [
    { id: "1", label: "Ada", note: { country: "TR" } },
    { id: "2", label: "Bea", note: { country: "DE" } },
    { id: "3", label: "Gus", note: { country: "AE" } },
    { id: "4", label: "Noa", note: { country: "USA" } },
    { id: "5", label: "Paris", note: { country: "Paris" } },
    { id: "6", label: "Empty", note: { country: "" } },
    { id: "7", label: "Missing", note: {} },
    { id: "8", label: "Blocked", note: { country: "TR", balance: 1 } },
  ];
  assert.equal(sealCopy(rows[0].note), "TR");
  assert.equal(sealState(rows[0].note), "set");
  assert.equal(sealBand(rows[0].note), "pair");
  assert.equal(sealBand(rows[3].note), "trio");
  assert.equal(sealBand(rows[4].note), "span");
  assert.equal(sealTone(rows[0].note), "hard");
  assert.equal(sealTone(rows[1].note), "soft");
  assert.equal(sealState({ country: "Turkey" }), "");
  assert.equal(sealState(rows[5].note), "clear");
  assert.equal(sealState(rows[6].note), "");
  assert.equal(sealState(rows[7].note), "");
  assert.equal(sealState("Paris"), "set");
  assert.equal(catalogSeal(rows[0].note), true);
  assert.equal(catalogSeal(rows[4].note), false);
  assert.equal(catalogSealCount(rows), 3);
  assert.equal(wideSealCount(rows), 1);
  assert.equal(softSealCount(rows), 3);
  assert.equal(sharedSealCount(rows), 0);
  assert.equal(visibleSealCustomers(rows, "pair", null, "", "all", [], "all").length, 3);
  assert.equal(visibleSealCustomers(rows, null, null, "par", "all", [], "all").length, 1);
  const bands = sealsCsv(rows);
  assert.equal(bands.startsWith("kind,mark,count"), true);
  assert.equal(bands.includes("amount"), false);
  assert.equal(bands.includes("catalog"), true);
  const queue = sealRowsCsv(rows, ["1"]);
  assert.equal(queue.includes("Ada"), true);
  assert.equal(queue.split("\n")[1].endsWith(",1"), true);

  assert.equal(crmv4Text("en", "ccrTitle"), ROUND194_COPY.en.ccrTitle);
  assert.equal(crmv4Text("tr", "nslTitle"), ROUND194_COPY.tr.nslTitle);
  assert.equal(crmv4Text("de", "ccrSearch"), ROUND194_COPY.de.ccrSearch);
  assert.equal(crmv4Text("ru", "nslHint"), ROUND194_COPY.ru.nslHint);
  assert.equal(crmv4Text("ar", "ccrNotice"), ROUND194_COPY.ar.ccrNotice);
  assert.notEqual(ROUND194_COPY.tr.ccrTitle, ROUND194_COPY.en.ccrTitle);
  assert.notEqual(ROUND194_COPY.de.nslTitle, ROUND194_COPY.en.nslTitle);
  assert.notEqual(ROUND194_COPY.ru.ccrSearch, ROUND194_COPY.en.ccrSearch);
  assert.notEqual(ROUND194_COPY.ar.nslSearch, ROUND194_COPY.en.nslSearch);
  const keys = Object.keys(ROUND194_COPY.en);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND194_COPY[locale]), keys);
  }

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-ccr/);
  assert.match(css, /\.c4-nsl/);
  assert.match(css, /\.c4-agenda-gallery/);
  assert.match(css, /\.c4-daystrip-gallery/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round194.tsx"), "utf8");
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
  assert.match(viewFile, /country/);
  assert.match(viewFile, /cardsCsv/);
  assert.match(viewFile, /sealsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-courtesy/);
  assert.match(viewFile, /data-seals/);
  assert.match(viewFile, /data-catalog/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestTone/);
  const agenda = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round33.tsx"), "utf8");
  assert.match(agenda, /c4-agenda-gallery/);
  assert.match(agenda, /data-logo="mono"/);
  assert.match(agenda, /c4-agenda-gallery-mast/);
  assert.match(agenda, /c4-agenda-gallery-grid/);
  const strip = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round51.tsx"), "utf8");
  assert.match(strip, /c4-daystrip-gallery/);
  assert.match(strip, /data-logo="mono"/);
  assert.match(strip, /c4-daystrip-gallery-mast/);
  assert.match(strip, /c4-daystrip-gallery-row/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "crtsy"/);
  assert.match(app, /view === "nseal"/);
  assert.match(app, /CourtesyCards/);
  assert.match(app, /CountrySeals/);
  console.log("crmv4 round194 tests passed");
}

main();
