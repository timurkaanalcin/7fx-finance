/**
 * Registry cartouches and signup marks.
 * Run: TZ=UTC npx tsx tests/crmv4-round177.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND177_COPY } from "../src/lib/crmv4/copy-round177";
import {
  activeMark,
  activeRank,
  activeSpan,
  addCartouche,
  addCartoucheView,
  bulkCartoucheFace,
  bulkReview,
  cartoucheCode,
  cartouchesCsv,
  cycleHue,
  editCartouche,
  editCartoucheNote,
  hashMark,
  homeCode,
  lateCartouche,
  leadingMark,
  leadingMarkDepth,
  markBand,
  markDepth,
  markDigits,
  markRowsCsv,
  markState,
  markWords,
  marksCsv,
  nextCartouche,
  oddMarkCount,
  peakSlot,
  quietSlot,
  rankOf,
  readCartouches,
  readReviewed,
  slotGap,
  slotOf,
  soonCartouche,
  spanOf,
  suggestClerk,
  suggestFace,
  suggestSpan,
  toggleReview,
  usedSlots,
  visibleCartouches,
  visibleMarkCustomers,
} from "../src/lib/crmv4/round177";

function main() {
  assert.equal(cartoucheCode("  de "), "DE");
  assert.equal(cartoucheCode("tr"), "TR");
  assert.equal(cartoucheCode("   "), "");
  assert.equal(cartoucheCode("T"), "");
  assert.equal(cartoucheCode("TRX"), "");
  assert.equal(cartoucheCode("T1"), "");
  assert.equal(cartoucheCode("z".repeat(20)), "");

  assert.equal(slotOf("01"), 1);
  assert.equal(slotOf("06"), 6);
  assert.equal(slotOf("1"), 1);
  assert.equal(slotOf(6), 6);
  assert.equal(slotOf("00"), null);
  assert.equal(slotOf("07"), null);
  assert.equal(slotOf("7"), null);
  assert.equal(slotOf(""), null);
  assert.equal(slotOf("3.0"), null);
  assert.equal(rankOf("1"), 1);
  assert.equal(rankOf(4), 4);
  assert.equal(rankOf("0"), null);
  assert.equal(rankOf("3"), null);
  assert.equal(rankOf("01"), null);
  assert.equal(spanOf("6"), 6);
  assert.equal(spanOf(9), 9);
  assert.equal(spanOf("2"), null);
  assert.equal(spanOf("03"), null);
  assert.equal(spanOf(8), null);
  assert.equal(peakSlot(2), true);
  assert.equal(peakSlot(5), true);
  assert.equal(peakSlot(1), false);
  assert.equal(quietSlot(1), true);
  assert.equal(quietSlot(6), true);
  assert.equal(quietSlot(2), false);
  assert.equal(quietSlot(4), false);
  assert.equal(slotGap(5, 1), 2);
  assert.equal(slotGap(1, 5), -2);
  assert.equal(slotGap(2, 2), 0);
  assert.equal(slotGap(1, 4), 3);
  assert.equal(slotGap(4, 1), -3);
  assert.equal(slotGap(null, 2), null);
  assert.equal(slotGap(2, ""), null);
  assert.equal(slotGap(2, 7), null);

  const saved = addCartouche([], { id: "a", title: "Cartouche Ada", note: "glass scan", clerk: "Nia", slot: "06", face: "cut", code: "tr", hue: "mist", rank: "1", span: "3" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].slot, 6);
  assert.equal(saved[0].rank, 1);
  assert.equal(saved[0].span, 3);
  assert.equal(saved[0].code, "TR");
  assert.equal(saved[0].note, "glass scan");
  assert.equal(saved[0].audit, "save");
  assert.equal(homeCode(saved[0].code), true);
  assert.equal(soonCartouche(saved[0]), true);
  assert.equal(addCartouche(saved, { id: "b", title: "Cartouche Ada" }).length, 1);
  assert.equal(addCartouche(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(addCartouche(saved, { id: "c", title: "   " }).length, 1);
  const capped = Array.from({ length: 12 }, (_, index) => ({ id: `n${index}`, title: `Line ${index}` })).reduce((cards, card) => addCartouche(cards, card), [] as ReturnType<typeof addCartouche>);
  assert.equal(capped.length, 9);
  assert.equal(capped.some((card) => card.title === "Line 0"), false);
  assert.equal(capped[0].title, "Line 11");

  const cycled = cycleHue(saved, "a");
  assert.equal(cycled[0].hue, "sand");
  assert.equal(cycled[0].audit, "hue");
  assert.equal(cycleHue(cycled, "a")[0].hue, "pitch");
  assert.equal(cycleHue(cycleHue(cycled, "a"), "a")[0].hue, "mist");
  const blankHue = addCartouche([], { id: "z", title: "Blank hue" });
  assert.equal(cycleHue(blankHue, "z")[0].hue, "mist");

  const edited = editCartouche(saved, "a", "Cartouche Bea");
  assert.equal(edited[0].title, "Cartouche Bea");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editCartouche(edited, "a", "  ")[0].title, "Cartouche Bea");
  const noted = editCartoucheNote(edited, "a", "second look");
  assert.equal(noted[0].note, "second look");
  assert.equal(editCartoucheNote(noted, "a", "  ")[0].note, "second look");
  const pair = addCartouche(noted, { id: "b", title: "Keep" });
  assert.equal(editCartouche(pair, "a", "Keep").find((card) => card.id === "a")?.title, "Cartouche Bea");

  const open = addCartouche(addCartouche([], { id: "a", title: "Early", slot: "1", face: "cut", span: "6" }), { id: "b", title: "Later", slot: "5", face: "blind", hue: "pitch" });
  assert.equal(lateCartouche(open.find((card) => card.title === "Early") as (typeof open)[number], 4), true);
  assert.equal(lateCartouche(open.find((card) => card.title === "Early") as (typeof open)[number], 2), false);
  assert.equal(lateCartouche({ ...open[0], stamped: true }, 4), false);
  assert.equal(nextCartouche(open, 2), open.find((card) => card.title === "Early")?.id);
  assert.equal(nextCartouche(open, 1), open.find((card) => card.hue !== "pitch")?.id);
  assert.equal(suggestFace([]), "cut");
  assert.equal(suggestFace(open), "gilt");
  assert.equal(suggestClerk(addCartouche(open, { id: "c", title: "Quiet", clerk: "Ada", face: "gilt" })), "Ada");
  assert.equal(suggestSpan([]), 6);
  assert.equal(suggestSpan(open), 3);
  assert.equal(usedSlots(open), 2);
  assert.equal(bulkCartoucheFace(open, ["b"], "gilt").find((card) => card.id === "b")?.face, "gilt");
  assert.equal(bulkCartoucheFace(open, ["b"], "gilt").find((card) => card.id === "b")?.audit, "shift");
  const shown = visibleCartouches(open, "open", "early", null, null, null, null, null, null, null, null, false, false, false);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].title, "Early");
  const sheet = cartouchesCsv(saved, 2);
  assert.equal(sheet.startsWith("title,clerk,slot,face,code,hue,rank,span,band,pinned,stamped,filed,gap,late,soon,home,note,audit"), true);
  assert.equal(sheet.includes("amount"), false);
  assert.equal(sheet.includes("Cartouche Ada"), true);
  assert.equal(activeRank("4"), "4");
  assert.equal(activeRank("03"), "all");
  assert.equal(activeRank("3"), "all");
  assert.equal(activeSpan("03"), "all");
  assert.equal(activeSpan("6"), "6");
  assert.equal(activeSpan("9"), "9");
  const views = Array.from({ length: 7 }, (_, index) => ({
    id: `v${index}`,
    name: `View ${index}`,
    tray: "open" as const,
    query: "",
    clerk: "all",
    face: "all",
    code: "all",
    hue: "all",
    slot: "all",
    rank: "all",
    span: "all",
  })).reduce((list, view) => addCartoucheView(list, view), [] as ReturnType<typeof addCartoucheView>);
  assert.equal(views.length, 6);
  assert.equal(readCartouches(saved)[0].title, "Cartouche Ada");

  const rows = [
    { id: "ada", label: "Ada", note: "TR" },
    { id: "ann", label: "Ann", note: "United Kingdom" },
    { id: "bea", label: "Bea", note: "" },
    { id: "cy", label: "Cy", note: { registrationCountry: null } },
    { id: "dee", label: "Dee", note: { registrationCountry: "TR", saleStatus: "x" } },
    { id: "eve", label: "Eve", note: "TR #4" },
    { id: "usa", label: "Usa", note: "USA" },
  ];
  assert.equal(markState(rows[0].note), "set");
  assert.equal(markBand(rows[0].note), "iso");
  assert.equal(markDepth(rows[0].note), "plain");
  assert.equal(markDigits(rows[0].note), "");
  assert.equal(markWords(rows[0].note), 1);
  assert.equal(hashMark(rows[0].note), false);
  assert.equal(markBand(rows[1].note), "title");
  assert.equal(markDepth(rows[1].note), "pair");
  assert.equal(markWords(rows[1].note), 2);
  assert.equal(markBand("a".repeat(40)), "scroll");
  assert.equal(markDepth("a".repeat(40)), "plain");
  assert.equal(markState(""), "clear");
  assert.equal(markState({ registrationCountry: null }), "clear");
  assert.equal(markState({ registrationCountry: "TR", saleStatus: "x" }), "");
  assert.equal(markState(12), "");
  assert.equal(hashMark(rows[5].note), true);
  assert.equal(markDepth(rows[5].note), "cipher");
  assert.equal(markBand(rows[6].note), "name");
  assert.equal(oddMarkCount(rows), 2);
  assert.equal(leadingMark(rows), "name");
  assert.equal(leadingMarkDepth(rows), "plain");
  assert.equal(visibleMarkCustomers(rows, "iso", null, "", "all", [], "all").length, 1);
  assert.equal(visibleMarkCustomers(rows, null, null, "ann", "all", [], "hash").length, 0);
  assert.deepEqual(readReviewed(["ada", "gone"], ["ada"]), ["ada"]);
  assert.deepEqual(bulkReview(["ada"], ["ann"], ["ada", "ann"], true), ["ada", "ann"]);
  assert.equal(toggleReview(["ada"], "ada", ["ada", "ann"]).includes("ada"), false);
  const names = marksCsv(rows);
  assert.equal(names.startsWith("kind,mark,count"), true);
  assert.equal(marksCsv([]), "kind,mark,count\nshape,odd,0");
  assert.equal(names.includes("amount"), false);
  assert.equal(names.includes(",iso,"), true);
  const queue = markRowsCsv(rows, ["ada"]);
  assert.equal(queue.startsWith("name,band,depth,words,hash,reviewed"), true);
  assert.equal(queue.includes("amount"), false);
  assert.equal(queue.includes(",1"), true);
  assert.equal(activeMark("gone", ["iso"]), "all");

  const copy = Object.keys(ROUND177_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND177_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "crtTitle"), "Registry cartouches");
  assert.equal(crmv4Text("tr", "rgtTitle"), ROUND177_COPY.tr.rgtTitle);
  assert.equal(crmv4Text("de", "crtClerk"), ROUND177_COPY.de.crtClerk);
  assert.equal(crmv4Text("ru", "rgtUnmarked"), ROUND177_COPY.ru.rgtUnmarked);
  assert.equal(crmv4Text("ar", "crtNotice"), ROUND177_COPY.ar.crtNotice);
  assert.notEqual(ROUND177_COPY.tr.crtTitle, ROUND177_COPY.en.crtTitle);
  assert.notEqual(ROUND177_COPY.de.rgtTitle, ROUND177_COPY.en.rgtTitle);
  assert.notEqual(ROUND177_COPY.ru.crtSearch, ROUND177_COPY.en.crtSearch);
  assert.notEqual(ROUND177_COPY.ar.rgtSearch, ROUND177_COPY.en.rgtSearch);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-crt/);
  assert.match(css, /\.c4-rgt/);
  assert.match(css, /\.c4-mkt-folio/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round177.tsx"), "utf8");
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
  assert.match(viewFile, /registrationCountry/);
  assert.match(viewFile, /cartouchesCsv/);
  assert.match(viewFile, /marksCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-cartouches/);
  assert.match(viewFile, /data-marks/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestFace/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "crtch"/);
  assert.match(app, /view === "rgtry"/);
  const marketing = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Marketing.tsx"), "utf8");
  assert.match(marketing, /c4-mkt-folio/);
  console.log("crmv4 round177 tests passed");
}

main();
