/**
 * Choir stalls and last-seen embers.
 * Run: TZ=UTC npx tsx tests/crmv4-round171.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND171_COPY } from "../src/lib/crmv4/copy-round171";
import {
  activeBand,
  activeVerse,
  addStall,
  addStallView,
  bodyVerse,
  bulkStallVoice,
  cycleInk,
  editStall,
  editStallNote,
  emberBand,
  emberDepth,
  emberState,
  embersCsv,
  endVerse,
  lateStall,
  leadingBand,
  leadingDepth,
  nextStall,
  pulseOf,
  rankOf,
  readStalls,
  stallPart,
  stallsCsv,
  suggestSinger,
  suggestVoice,
  verseGap,
  verseOf,
  visibleEmberCustomers,
  visibleStalls,
} from "../src/lib/crmv4/round171";

const NOW = "2026-11-10T12:00:00.000Z";

function main() {
  assert.equal(stallPart("  KYC  "), "KYC");
  assert.equal(stallPart("   "), "");
  assert.equal(stallPart("z".repeat(20)).length, 4);

  assert.equal(verseOf("01"), 1);
  assert.equal(verseOf("09"), 9);
  assert.equal(verseOf("1"), 1);
  assert.equal(verseOf(12), 12);
  assert.equal(verseOf("00"), null);
  assert.equal(verseOf("13"), null);
  assert.equal(verseOf(""), null);
  assert.equal(verseOf("3.0"), null);
  assert.equal(rankOf("01"), 1);
  assert.equal(rankOf(4), 4);
  assert.equal(rankOf("0"), null);
  assert.equal(rankOf("5"), null);
  assert.equal(pulseOf("2"), 2);
  assert.equal(pulseOf(6), 6);
  assert.equal(pulseOf("1"), null);
  assert.equal(pulseOf("02"), null);
  assert.equal(endVerse(1), true);
  assert.equal(endVerse(12), true);
  assert.equal(endVerse(2), false);
  assert.equal(bodyVerse(2), true);
  assert.equal(bodyVerse(11), true);
  assert.equal(bodyVerse(1), false);
  assert.equal(bodyVerse(12), false);
  assert.equal(verseGap(11, 1), 2);
  assert.equal(verseGap(1, 11), -2);
  assert.equal(verseGap(2, 2), 0);
  assert.equal(verseGap(4, 10), 6);
  assert.equal(verseGap(10, 4), 6);
  assert.equal(verseGap(null, 2), null);
  assert.equal(verseGap(2, ""), null);
  assert.equal(verseGap(2, 13), null);

  const saved = addStall([], { id: "a", title: "Stall Ada", note: "lyric scan", singer: "Nia", verse: "09", voice: "soprano", part: "A1", ink: "dry", rank: "01", pulse: "2" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].verse, 9);
  assert.equal(saved[0].rank, 1);
  assert.equal(saved[0].pulse, 2);
  assert.equal(saved[0].note, "lyric scan");
  assert.equal(saved[0].audit, "save");
  assert.equal(addStall(saved, { id: "b", title: "Stall Ada" }).length, 1);
  assert.equal(addStall(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(addStall(saved, { id: "c", title: "   " }).length, 1);
  const capped = Array.from({ length: 10 }, (_, index) => ({ id: `n${index}`, title: `Line ${index}` })).reduce((cards, card) => addStall(cards, card), [] as ReturnType<typeof addStall>);
  assert.equal(capped.length, 8);
  assert.equal(capped.some((card) => card.title === "Line 0"), false);
  assert.equal(capped[0].title, "Line 9");

  const cycled = cycleInk(saved, "a");
  assert.equal(cycled[0].ink, "wet");
  assert.equal(cycled[0].audit, "ink");
  assert.equal(cycleInk(cycled, "a")[0].ink, "gloss");
  assert.equal(cycleInk(cycleInk(cycled, "a"), "a")[0].ink, "dry");
  const blankInk = addStall([], { id: "z", title: "Blank ink" });
  assert.equal(cycleInk(blankInk, "z")[0].ink, "dry");

  const edited = editStall(saved, "a", "Stall Bea");
  assert.equal(edited[0].title, "Stall Bea");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editStall(edited, "a", "  ")[0].title, "Stall Bea");
  const noted = editStallNote(edited, "a", "second look");
  assert.equal(noted[0].note, "second look");
  assert.equal(editStallNote(noted, "a", "  ")[0].note, "second look");
  const pair = addStall(noted, { id: "b", title: "Keep" });
  assert.equal(editStall(pair, "a", "Keep").find((card) => card.id === "a")?.title, "Stall Bea");

  const moved = bulkStallVoice(pair, ["a"], "alto");
  assert.equal(moved.find((card) => card.id === "a")?.voice, "alto");
  assert.equal(moved.find((card) => card.id === "a")?.audit, "move");
  assert.equal(bulkStallVoice(moved, ["a"], "alto").find((card) => card.id === "a")?.audit, "move");
  assert.equal(bulkStallVoice(moved, ["a"], "attic").find((card) => card.id === "a")?.voice, "alto");

  const mixed = [
    ...addStall([], { id: "live", title: "Live", note: "lyric scan", singer: "Nia", verse: 2, voice: "soprano", part: "A1", ink: "dry", rank: 1, pulse: 3 }),
  ];
  assert.equal(visibleStalls(mixed, "open", "lyric", null, null, null, null, null, null, null, null, false, false).length, 1);
  assert.equal(visibleStalls(mixed, "open", "a1", null, null, null, null, null, null, null, null, false, false).length, 1);
  assert.equal(visibleStalls(mixed, "open", "nia", null, null, null, null, null, null, null, null, false, false).length, 0);
  const voiced = mixed.map((card) => (card.id === "live" ? { ...card, voiced: true } : card));
  const filed = mixed.map((card) => ({ ...card, filed: true, voiced: true }));
  assert.equal(visibleStalls(mixed, "open", "", null, null, null, null, null, null, null, null, false, false).length, 1);
  assert.equal(visibleStalls(voiced, "voiced", "", null, null, null, null, null, null, null, null, false, false).length, 1);
  assert.equal(visibleStalls(voiced, "open", "", null, null, null, null, null, null, null, null, false, false).length, 0);
  assert.equal(visibleStalls(filed, "filed", "", null, null, null, null, null, null, null, null, false, false).length, 1);
  assert.equal(visibleStalls(filed, "voiced", "", null, null, null, null, null, null, null, null, false, false).length, 0);
  assert.equal(lateStall(mixed[0], 7), true);
  assert.equal(lateStall(mixed[0], 5), false);
  assert.equal(suggestVoice([]), "soprano");
  assert.equal(suggestVoice(mixed), "alto");
  assert.equal(suggestSinger([]), "");
  assert.equal(suggestSinger(mixed), "Nia");
  const loaded = addStall(mixed, { id: "bea", title: "Bea", singer: "Bea", verse: 3, voice: "alto", ink: "dry" });
  assert.equal(suggestSinger(loaded), "Bea");
  assert.equal(nextStall(mixed, 2), "live");
  assert.equal(nextStall(mixed.map((card) => ({ ...card, ink: "gloss" })), 2), "");
  assert.equal(nextStall(mixed, 9), "live");
  const csv = stallsCsv(mixed, 7);
  assert.equal(csv.startsWith("title,singer,verse,voice,part,ink,rank,pulse,band,pinned,voiced,filed,gap,late,note,audit"), true);
  assert.equal(csv.includes("amount"), false);
  assert.equal(csv.includes(",2,"), true);
  assert.equal(readStalls(mixed)[0].verse, 2);
  const views = addStallView([], { id: "v", name: "Morning", tray: "open", query: "ada", singer: "all", voice: "soprano", part: "all", ink: "all", verse: "low", rank: "1", pulse: "2" });
  assert.equal(views.length, 1);
  assert.equal(views[0].verse, "low");
  assert.equal(views[0].rank, "1");
  assert.equal(views[0].pulse, "2");
  assert.equal(activeVerse("13"), "all");
  assert.equal(activeVerse("09"), "9");
  assert.equal(activeVerse("low"), "low");
  const viewCap = Array.from({ length: 7 }, (_, index) => ({ id: `v${index}`, name: `View ${index}`, tray: "open" as const, query: "", singer: "all", voice: "all", part: "all", ink: "all", verse: "all", rank: "all", pulse: "all" })).reduce((rows, view) => addStallView(rows, view), [] as ReturnType<typeof addStallView>);
  assert.equal(viewCap.length, 5);

  assert.equal(emberState("2026-11-10T11:50:00.000Z"), "set");
  assert.equal(emberState(""), "clear");
  assert.equal(emberState("   "), "clear");
  assert.equal(emberState(null), "");
  assert.equal(emberState({ lastSeenAt: "2026-11-10T11:50:00.000Z" }), "set");
  assert.equal(emberState({ lastSeenAt: "" }), "clear");
  assert.equal(emberState({ name: "Ada", lastSeenAt: "2026-11-10T11:50:00.000Z" }), "");
  assert.equal(emberState({ loginBlockedAt: "2026-11-10T11:50:00.000Z" }), "");
  assert.equal(emberBand("2026-11-10T11:50:00.000Z", NOW), "live");
  assert.equal(emberDepth("2026-11-10T11:50:00.000Z", NOW), "near");
  assert.equal(emberBand("2026-11-10T11:30:00.000Z", NOW), "live");
  assert.equal(emberDepth("2026-11-10T11:30:00.000Z", NOW), "mid");
  assert.equal(emberBand("2026-11-10T11:05:00.000Z", NOW), "live");
  assert.equal(emberDepth("2026-11-10T11:05:00.000Z", NOW), "far");
  assert.equal(emberBand("2026-11-10T00:00:00.000Z", NOW), "day");
  assert.equal(emberDepth("2026-11-10T00:00:00.000Z", NOW), "mid");
  assert.equal(emberBand("2026-11-08T12:00:00.000Z", NOW), "week");
  assert.equal(emberDepth("2026-11-08T12:00:00.000Z", NOW), "mid");
  assert.equal(emberBand("2026-11-03T12:00:00.000Z", NOW), "quiet");
  assert.equal(emberBand("2026-11-10T12:05:00.000Z", NOW), "");
  assert.equal(emberBand("", NOW), "");
  const rows = [
    { at: "2026-11-10T11:50:00.000Z", label: "Ada" },
    { at: "", label: "Ann" },
    { at: null, label: "Beatrice" },
    { at: "2026-11-03T12:00:00.000Z", label: "Annabelle Marie" },
  ];
  assert.equal(leadingBand(rows, NOW), "live");
  assert.equal(leadingDepth(rows, NOW), "near");
  assert.equal(visibleEmberCustomers(rows, "blank", null, "", NOW).length, 1);
  assert.equal(visibleEmberCustomers(rows, "quiet", null, "", NOW).length, 1);
  assert.equal(visibleEmberCustomers(rows, null, null, "bea", NOW).length, 1);
  assert.equal(visibleEmberCustomers(rows, null, null, "2026", NOW).length, 0);
  const names = embersCsv(rows, NOW);
  assert.equal(names.startsWith("kind,mark,count"), true);
  assert.equal(embersCsv([], NOW), "kind,mark,count");
  assert.equal(names.includes("amount"), false);
  assert.equal(names.includes(",live,"), true);
  assert.equal(activeBand("gone", ["live"]), "all");

  const copy = Object.keys(ROUND171_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND171_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "chrTitle"), "Choir cards");
  assert.equal(crmv4Text("tr", "embTitle"), ROUND171_COPY.tr.embTitle);
  assert.equal(crmv4Text("de", "chrSinger"), ROUND171_COPY.de.chrSinger);
  assert.equal(crmv4Text("ru", "embUnmarked"), ROUND171_COPY.ru.embUnmarked);
  assert.equal(crmv4Text("ar", "chrNotice"), ROUND171_COPY.ar.chrNotice);
  assert.notEqual(ROUND171_COPY.tr.chrTitle, ROUND171_COPY.en.chrTitle);
  assert.notEqual(ROUND171_COPY.de.embTitle, ROUND171_COPY.en.embTitle);
  assert.notEqual(ROUND171_COPY.ru.chrSearch, ROUND171_COPY.en.chrSearch);
  assert.notEqual(ROUND171_COPY.ar.embSearch, ROUND171_COPY.en.embSearch);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-chr/);
  assert.match(css, /\.c4-emb/);
  assert.match(css, /\.c4-cust-choir/);
  assert.match(css, /\.c4-pagehead-choir/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round171.tsx"), "utf8");
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
  assert.match(viewFile, /lastSeenAt/);
  assert.match(viewFile, /stallsCsv/);
  assert.match(viewFile, /embersCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-stalls/);
  assert.match(viewFile, /data-embers/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestVoice/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "choir"/);
  assert.match(app, /view === "ember"/);
  const customers = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Customers.tsx"), "utf8");
  assert.match(customers, /c4-cust-choir/);
  console.log("crmv4 round171 tests passed");
}

main();
