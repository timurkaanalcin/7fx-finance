/**
 * Oratory cards and visitor seals.
 * Run: TZ=UTC npx tsx tests/crmv4-round203.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND203_COPY } from "../src/lib/crmv4/copy-round203";
import {
  activeBell,
  activeCandle,
  activeSpan,
  addCard,
  addCardTag,
  addCardView,
  adjacentCardCount,
  bellGap,
  bellOf,
  busiestSpeaker,
  candleClashCount,
  candleOf,
  catalogSeal,
  catalogSealCount,
  clashBellCount,
  cycleVoice,
  densityOf,
  editCard,
  editCardNote,
  fairSpeaker,
  houseNave,
  houseSealCount,
  lateCard,
  moveFocus,
  naveOf,
  nextCard,
  pauseOf,
  peakBell,
  pinFocused,
  quietBell,
  sealBand,
  sealCopy,
  sealOf,
  sealRowsCsv,
  sealState,
  sealTone,
  sealsCsv,
  setCardPause,
  sharedSealCount,
  soonCard,
  spanOf,
  suggestNave,
  suggestSpan,
  suggestSpeaker,
  usedBells,
  visibleCards,
  visibleSealCustomers,
  wideSealCount,
  cardsCsv,
} from "../src/lib/crmv4/round203";

function main() {
  assert.equal(naveOf("  apse "), "APSE");
  assert.equal(naveOf("transept"), "TRANSEPT");
  assert.equal(naveOf("nave"), "NAVE");
  assert.equal(naveOf("   "), "");
  assert.equal(naveOf("oak"), "");
  assert.equal(bellOf("1"), 1);
  assert.equal(bellOf(6), 6);
  assert.equal(bellOf("4"), 4);
  assert.equal(bellOf("0"), null);
  assert.equal(bellOf("01"), null);
  assert.equal(bellOf("7"), null);
  assert.equal(bellOf("8"), null);
  assert.equal(bellOf(""), null);
  assert.equal(candleOf("2"), 2);
  assert.equal(candleOf(4), 4);
  assert.equal(candleOf("8"), 8);
  assert.equal(candleOf("1"), null);
  assert.equal(candleOf("02"), null);
  assert.equal(spanOf("15"), 15);
  assert.equal(spanOf(30), 30);
  assert.equal(spanOf("45"), 45);
  assert.equal(spanOf("0"), null);
  assert.equal(spanOf("015"), null);
  assert.equal(spanOf("10"), null);
  assert.equal(pauseOf("0"), 0);
  assert.equal(pauseOf(5), 5);
  assert.equal(pauseOf("15"), 15);
  assert.equal(pauseOf("10"), null);
  assert.equal(peakBell(2), true);
  assert.equal(peakBell(3), true);
  assert.equal(peakBell(1), false);
  assert.equal(peakBell(4), false);
  assert.equal(quietBell(1), true);
  assert.equal(quietBell(6), true);
  assert.equal(quietBell(2), false);
  assert.equal(quietBell(3), false);
  assert.equal(bellGap(1, 6), 5);
  assert.equal(bellGap(6, 1), -5);
  assert.equal(bellGap(2, 6), 4);
  assert.equal(bellGap(6, 2), -4);
  assert.equal(bellGap(null, 6), null);
  assert.equal(bellGap(1, ""), null);
  assert.equal(bellGap(1, 0), null);
  assert.equal(activeBell("peak"), "peak");
  assert.equal(activeBell("99"), "all");
  assert.equal(activeCandle("8"), "8");
  assert.equal(activeCandle("1"), "all");
  assert.equal(activeSpan("blank"), "blank");
  assert.equal(activeSpan("10"), "all");
  assert.equal(densityOf("tight"), "tight");
  assert.equal(densityOf("nope"), "roomy");
  assert.equal(moveFocus(0, 3, 1), 1);
  assert.equal(moveFocus(0, 3, -1), 2);
  assert.equal(moveFocus(2, 3, 1), 0);
  assert.equal(moveFocus(1, 0, 1), 0);

  const saved = addCard([], { id: "a", title: "Ada card", note: "oak leaf", speaker: "Nia", bell: "1", nave: "apse", voice: "murmur", candle: "8", span: "15", tags: "a, b, c, d, e", pause: "0" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].bell, 1);
  assert.equal(saved[0].candle, 8);
  assert.equal(saved[0].span, 15);
  assert.equal(saved[0].nave, "APSE");
  assert.equal(saved[0].note, "oak leaf");
  assert.deepEqual(saved[0].tags, ["a", "b", "c"]);
  assert.equal(saved[0].audit, "save");
  assert.equal(houseNave(saved[0].nave), true);
  assert.equal(houseNave("NAVE"), false);
  assert.equal(soonCard(saved[0]), true);
  assert.equal(lateCard(saved[0], "6"), true);
  assert.equal(lateCard(saved[0], "4"), false);
  assert.equal(lateCard(saved[0], "3"), false);
  assert.equal(addCard(saved, { id: "b", title: "Ada card" }).length, 1);
  assert.equal(addCard(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(addCard(saved, { id: "c", title: "   " }).length, 1);
  const capped = Array.from({ length: 9 }, (_, index) => ({ id: `n${index}`, title: `Line ${index}` })).reduce((cards, card) => addCard(cards, card), [] as ReturnType<typeof addCard>);
  assert.equal(capped.length, 7);
  assert.equal(capped.some((card) => card.title === "Line 0"), false);
  assert.equal(capped.some((card) => card.title === "Line 1"), false);
  assert.equal(capped[0].title, "Line 8");

  const cycled = cycleVoice(saved, "a");
  assert.equal(cycled[0].voice, "chant");
  assert.equal(cycled[0].audit, "voice");
  assert.equal(cycleVoice(cycled, "a")[0].voice, "hush");
  assert.equal(cycleVoice(cycleVoice(cycled, "a"), "a")[0].voice, "murmur");
  const blankVoice = addCard([], { id: "z", title: "Blank voice" });
  assert.equal(cycleVoice(blankVoice, "z")[0].voice, "murmur");

  const edited = editCard(saved, "a", "Bea card");
  assert.equal(edited[0].title, "Bea card");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editCard(saved, "a", "   ")[0].title, "Ada card");
  const noted = editCardNote(saved, "a", "fresh leaf");
  assert.equal(noted[0].note, "fresh leaf");
  assert.equal(editCardNote(saved, "a", "   ")[0].note, "oak leaf");
  const oneTag = addCard([], { id: "t", title: "Tag card", tags: "a" });
  const tagged = addCardTag(oneTag, "t", "b");
  assert.deepEqual(tagged[0].tags, ["a", "b"]);
  assert.equal(tagged[0].audit, "tag");
  assert.equal(addCardTag(addCardTag(tagged, "t", "c"), "t", "d")[0].tags.length, 3);
  assert.equal(addCardTag(oneTag, "t", "gold")[0].tags.length, 1);

  const paused = setCardPause(saved, "a", 5);
  assert.equal(paused[0].pause, 5);
  assert.equal(paused[0].audit, "pause");
  assert.equal(soonCard(paused[0]), false);
  assert.equal(lateCard(paused[0], "6"), false);
  assert.equal(setCardPause(saved, "a", 10)[0].pause, 0);
  const pinned = pinFocused(saved, ["a"], 0);
  assert.equal(pinned[0].pinned, true);
  assert.equal(pinned[0].audit, "pin");
  assert.equal(pinFocused(pinned, ["a"], 0)[0].pinned, false);

  const second = addCard(saved, { id: "b", title: "Bea card", speaker: "Ada", bell: "6", nave: "nave", voice: "murmur", candle: "8", span: "30", tags: "a" });
  assert.equal(usedBells(second), 2);
  assert.equal(suggestNave([]), "NAVE");
  assert.equal(suggestSpan([]), 30);
  assert.equal(suggestSpan(saved), 30);
  const twoMeasured = addCard(addCard([], { id: "m1", title: "Measured one", span: "30" }), { id: "m2", title: "Measured two", span: "30" });
  assert.equal(suggestSpan(twoMeasured), 15);
  const splitNaves = addCard(addCard([], { id: "n", title: "Apse card", nave: "apse" }), { id: "s", title: "Nave card", nave: "nave" });
  assert.equal(suggestNave(splitNaves), "TRANSEPT");
  assert.equal(suggestSpeaker([]), "");
  assert.equal(fairSpeaker(second, "Bea, Ada"), "Bea");
  assert.equal(busiestSpeaker(second), "Ada");
  assert.equal(nextCard(second, ""), "");
  assert.equal(nextCard(second, "6"), "b");
  const hushed = cycleVoice(cycleVoice(second, "b"), "b");
  assert.equal(hushed.find((card) => card.id === "b")?.voice, "hush");
  assert.equal(nextCard(hushed, "6"), "a");
  const resting = setCardPause(second, "b", 15);
  assert.equal(nextCard(resting, "6"), "a");
  const shown = visibleCards(second, "open", "bea", null, null, null, null, null, null, null, false, false, false, false, false);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].id, "b");
  const hushedOnly = visibleCards(hushed, "open", "", null, null, null, null, null, null, null, true, false, false, false, false);
  assert.equal(hushedOnly.length, 1);
  assert.equal(hushedOnly[0].id, "b");
  assert.equal(clashBellCount(addCard(second, { id: "c", title: "Same bell", bell: "6", nave: "nave" })), 2);
  assert.equal(candleClashCount(second), 2);
  assert.equal(adjacentCardCount(splitNaves), 0);
  const neighbors = addCard(addCard([], { id: "p", title: "Near one", bell: "2", nave: "apse" }), { id: "q", title: "Near two", bell: "3", nave: "apse" });
  assert.equal(adjacentCardCount(neighbors), 2);
  const csv = cardsCsv(saved, "6");
  assert.equal(csv.includes("Ada card"), true);
  assert.equal(csv.includes("amount"), false);
  const views = [{ id: "v", name: "Peak", tray: "open" as const, query: "", speaker: "all", nave: "all", voice: "all", bell: "peak", candle: "all", span: "all" }];
  assert.equal(addCardView(views, views[0]).length, 1);
  assert.equal(addCardView([], { ...views[0], id: "v2", name: "Quiet", bell: "quiet" }).length, 1);

  const rows = [
    { id: "1", label: "Ada", note: { lastIp: "10.0.0.1" } },
    { id: "2", label: "Bea", note: { lastIp: "8.8.8.8" } },
    { id: "3", label: "Cia", note: { lastIp: "2001:db8::1" } },
    { id: "4", label: "Leo", note: { lastIp: "127.0.0.1" } },
    { id: "5", label: "Nia", note: { lastIp: "192.168.0.1" } },
    { id: "6", label: "Otto", note: { lastIp: "" } },
    { id: "7", label: "Pia", note: {} },
    { id: "8", label: "Quin", note: { lastIp: "10.0.0.1", balance: 1 } },
    { id: "9", label: "Rae", note: { lastIp: "loopback" } },
  ];
  assert.equal(sealOf(rows[0].note), "11");
  assert.equal(sealOf(rows[1].note), "88");
  assert.equal(sealOf(rows[2].note), "21");
  assert.equal(sealOf(rows[8].note), "LK");
  assert.equal(sealOf(rows[7].note), "");
  assert.equal(sealBand(rows[0].note), "dot");
  assert.equal(sealBand(rows[2].note), "wide");
  assert.equal(sealBand(rows[8].note), "stem");
  assert.equal(sealTone(rows[0].note), "house");
  assert.equal(sealTone(rows[1].note), "road");
  assert.equal(sealTone(rows[2].note), "script");
  assert.equal(sealTone(rows[4].note), "house");
  assert.equal(sealState(rows[5].note), "clear");
  assert.equal(sealState(rows[6].note), "");
  assert.equal(sealState(rows[7].note), "");
  assert.equal(catalogSeal(rows[0].note), true);
  assert.equal(catalogSeal(rows[3].note), true);
  assert.equal(catalogSeal(rows[4].note), true);
  assert.equal(catalogSeal(rows[1].note), false);
  assert.equal(catalogSealCount(rows), 3);
  assert.equal(wideSealCount(rows), 1);
  assert.equal(houseSealCount(rows), 3);
  assert.equal(sharedSealCount(rows), 3);
  assert.equal(visibleSealCustomers(rows, "dot", null, "", "all", [], "all").length, 4);
  assert.equal(visibleSealCustomers(rows, null, null, "leo", "all", [], "all").length, 1);
  assert.equal(sealCopy(rows[7].note), "");
  const bands = sealsCsv(rows);
  assert.equal(bands.startsWith("kind,mark,count"), true);
  assert.equal(bands.includes("amount"), false);
  assert.equal(bands.includes("catalog"), true);
  const queue = sealRowsCsv(rows, ["1"]);
  assert.equal(queue.includes("Ada"), true);
  assert.equal(queue.split("\n")[1].endsWith(",1"), true);

  assert.equal(crmv4Text("en", "orcTitle"), ROUND203_COPY.en.orcTitle);
  assert.equal(crmv4Text("tr", "vslTitle"), ROUND203_COPY.tr.vslTitle);
  assert.equal(crmv4Text("de", "orcSearch"), ROUND203_COPY.de.orcSearch);
  assert.equal(crmv4Text("ru", "vslHint"), ROUND203_COPY.ru.vslHint);
  assert.equal(crmv4Text("ar", "orcNotice"), ROUND203_COPY.ar.orcNotice);
  assert.notEqual(ROUND203_COPY.tr.orcTitle, ROUND203_COPY.en.orcTitle);
  assert.notEqual(ROUND203_COPY.de.vslTitle, ROUND203_COPY.en.vslTitle);
  assert.notEqual(ROUND203_COPY.ru.orcSearch, ROUND203_COPY.en.orcSearch);
  assert.notEqual(ROUND203_COPY.ar.vslSearch, ROUND203_COPY.en.vslSearch);
  const keys = Object.keys(ROUND203_COPY.en);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND203_COPY[locale]), keys);
    for (const key of keys) {
      assert.equal(typeof ROUND203_COPY[locale][key as keyof typeof ROUND203_COPY.en], "string");
      assert.ok(ROUND203_COPY[locale][key as keyof typeof ROUND203_COPY.en]);
    }
  }

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-orc/);
  assert.match(css, /\.c4-vsl/);
  assert.match(css, /\.c4-orc-ledger/);
  assert.match(css, /\.c4-vsl-index/);
  assert.match(css, /\.c4-book-oratory/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round203.tsx"), "utf8");
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
  assert.match(viewFile, /lastIp/);
  assert.match(viewFile, /cardsCsv/);
  assert.match(viewFile, /sealsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-seals/);
  assert.match(viewFile, /data-catalog/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestNave/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "orcd"/);
  assert.match(app, /view === "vsip"/);
  assert.match(app, /OratoryCards/);
  assert.match(app, /VisitorSeals/);
  assert.match(app, /c4-pagehead-oratory/);
  assert.match(app, /c4-rail-oratory/);
  const positions = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Positions.tsx"), "utf8");
  assert.match(positions, /c4-book-oratory/);
  console.log("crmv4 round203 tests passed");
}

main();
