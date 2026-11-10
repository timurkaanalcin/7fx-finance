/**
 * Slate watches and assignee plates.
 * Run: TZ=UTC npx tsx tests/crmv4-round186.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND186_COPY } from "../src/lib/crmv4/copy-round186";
import {
  activeHour,
  activeWait,
  activeWeight,
  addSlate,
  addSlateView,
  bulkSlateTint,
  catalogOwner,
  catalogOwnerCount,
  cycleTempo,
  editSlate,
  editSlateNote,
  evenOwner,
  evenOwnerCount,
  fairOwner,
  homeMark,
  hourGap,
  hourOf,
  lateSlate,
  nextSlate,
  ownerBand,
  ownerRowsCsv,
  ownerState,
  ownersCsv,
  peakHour,
  quietHour,
  readSlates,
  sharedOwnerCount,
  slateMark,
  soonSlate,
  suggestOwner,
  suggestTint,
  suggestWait,
  usedHours,
  visibleOwnerCustomers,
  visibleSlates,
  slatesCsv,
  waitMinutes,
  weightOf,
  wideOwner,
  wideOwnerCount,
} from "../src/lib/crmv4/round186";

function main() {
  assert.equal(slateMark("  tr "), "TR");
  assert.equal(slateMark("de"), "DE");
  assert.equal(slateMark("ae"), "AE");
  assert.equal(slateMark("   "), "");
  assert.equal(slateMark("T"), "");
  assert.equal(slateMark("TUR"), "");
  assert.equal(hourOf("00"), 0);
  assert.equal(hourOf("09"), 9);
  assert.equal(hourOf("23"), 23);
  assert.equal(hourOf("24"), null);
  assert.equal(hourOf(""), null);
  assert.equal(hourOf("3.0"), null);
  assert.equal(weightOf("2"), 2);
  assert.equal(weightOf(4), 4);
  assert.equal(weightOf(8), 8);
  assert.equal(weightOf("0"), null);
  assert.equal(weightOf("1"), null);
  assert.equal(weightOf("02"), null);
  assert.equal(waitMinutes("10"), 10);
  assert.equal(waitMinutes(30), 30);
  assert.equal(waitMinutes(60), 60);
  assert.equal(waitMinutes("0"), null);
  assert.equal(waitMinutes("15"), null);
  assert.equal(waitMinutes("010"), null);
  assert.equal(peakHour(9), true);
  assert.equal(peakHour(16), true);
  assert.equal(peakHour(0), false);
  assert.equal(quietHour(0), true);
  assert.equal(quietHour(6), true);
  assert.equal(quietHour(22), true);
  assert.equal(quietHour(9), false);
  assert.equal(quietHour(16), false);
  assert.equal(hourGap(22, 2), 4);
  assert.equal(hourGap(2, 22), -4);
  assert.equal(hourGap(9, 9), 0);
  assert.equal(hourGap(0, 12), 12);
  assert.equal(hourGap(12, 0), -12);
  assert.equal(hourGap(23, 1), 2);
  assert.equal(hourGap(1, 23), -2);
  assert.equal(hourGap(null, 2), null);
  assert.equal(hourGap(2, ""), null);
  assert.equal(hourGap(2, 24), null);

  const saved = addSlate([], { id: "a", title: "Slate Ada", note: "ivory call", owner: "Nia", hour: "09", tint: "pearl", mark: "tr", tempo: "hush", weight: "8", wait: "10" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].hour, 9);
  assert.equal(saved[0].weight, 8);
  assert.equal(saved[0].wait, 10);
  assert.equal(saved[0].mark, "TR");
  assert.equal(saved[0].note, "ivory call");
  assert.equal(saved[0].audit, "save");
  assert.equal(homeMark(saved[0].mark), true);
  assert.equal(homeMark("US"), false);
  assert.equal(homeMark("NY"), false);
  assert.equal(soonSlate(saved[0]), true);
  assert.equal(addSlate(saved, { id: "b", title: "Slate Ada" }).length, 1);
  assert.equal(addSlate(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(addSlate(saved, { id: "c", title: "   " }).length, 1);
  const capped = Array.from({ length: 9 }, (_, index) => ({ id: `n${index}`, title: `Line ${index}` })).reduce((cards, card) => addSlate(cards, card), [] as ReturnType<typeof addSlate>);
  assert.equal(capped.length, 7);
  assert.equal(capped.some((card) => card.title === "Line 0"), false);
  assert.equal(capped[0].title, "Line 8");

  const cycled = cycleTempo(saved, "a");
  assert.equal(cycled[0].tempo, "walk");
  assert.equal(cycled[0].audit, "tempo");
  assert.equal(cycleTempo(cycled, "a")[0].tempo, "run");
  assert.equal(cycleTempo(cycleTempo(cycled, "a"), "a")[0].tempo, "hush");
  const blankTempo = addSlate([], { id: "z", title: "Blank tempo" });
  assert.equal(cycleTempo(blankTempo, "z")[0].tempo, "hush");

  const edited = editSlate(saved, "a", "Slate Bea");
  assert.equal(edited[0].title, "Slate Bea");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editSlate(edited, "a", "  ")[0].title, "Slate Bea");
  const noted = editSlateNote(edited, "a", "second look");
  assert.equal(noted[0].note, "second look");
  assert.equal(editSlateNote(noted, "a", "  ")[0].note, "second look");
  const pair = addSlate(noted, { id: "b", title: "Slate" });
  assert.equal(editSlate(pair, "a", "Slate").find((card) => card.id === "a")?.title, "Slate Bea");

  const early = addSlate([], { id: "a", title: "Early", hour: "0", tint: "pearl", wait: "60", owner: "Nia", weight: "8" });
  const mid = addSlate(early, { id: "m", title: "Mid", hour: "12", tint: "soot", wait: "30", owner: "Ada", weight: "2", tempo: "hush" });
  const open = addSlate(mid, { id: "b", title: "Later", hour: "16", tempo: "run" });
  assert.equal(lateSlate(open.find((card) => card.title === "Early") as (typeof open)[number], 6), true);
  assert.equal(lateSlate(open.find((card) => card.title === "Early") as (typeof open)[number], 4), false);
  const earlyCard = open.find((card) => card.title === "Early") as (typeof open)[number];
  assert.equal(lateSlate({ ...earlyCard, done: true }, 6), false);
  assert.equal(nextSlate(open, 10), open.find((card) => card.title === "Mid")?.id);
  assert.equal(nextSlate(open, 18), open.find((card) => card.title === "Early")?.id);
  assert.equal(suggestTint([]), "mist");
  assert.equal(suggestTint(open), "mist");
  assert.equal(suggestOwner(open), "Ada");
  assert.equal(suggestWait([]), 30);
  assert.equal(suggestWait(open), 10);
  assert.equal(fairOwner(open, "Nia, Bea"), "Bea");
  assert.equal(fairOwner(open, ""), "Ada");
  assert.equal(usedHours(open), 3);
  assert.equal(bulkSlateTint(open, ["b"], "gilt").find((card) => card.id === "b")?.tint, "gilt");
  assert.equal(bulkSlateTint(open, ["b"], "gilt").find((card) => card.id === "b")?.audit, "tint");
  const shown = visibleSlates(open, "open", "ada", null, null, null, null, null, null, null, null, false, false, false);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].title, "Mid");
  const sheet = slatesCsv(saved, 2);
  assert.equal(sheet.startsWith("title,owner,hour,tint,mark,tempo,weight,wait,band,pinned,held,done,gap,late,soon,home,note,audit"), true);
  assert.equal(sheet.includes("amount"), false);
  assert.equal(sheet.includes("Slate Ada"), true);
  assert.equal(activeWeight("02"), "all");
  assert.equal(activeWeight("2"), "2");
  assert.equal(activeWait("010"), "all");
  assert.equal(activeWait("10"), "10");
  assert.equal(activeWait("60"), "60");
  assert.equal(activeHour("00"), "0");
  assert.equal(activeHour("24"), "all");
  const views = Array.from({ length: 5 }, (_, index) => ({
    id: `v${index}`,
    name: `View ${index}`,
    tray: "open" as const,
    query: "",
    owner: "all",
    tint: "all",
    mark: "all",
    tempo: "all",
    hour: "all",
    weight: "all",
    wait: "all",
  })).reduce((list, view) => addSlateView(list, view), [] as ReturnType<typeof addSlateView>);
  assert.equal(views.length, 3);
  assert.equal(readSlates(saved)[0].title, "Slate Ada");

  const stub = "abcdefgh";
  const slip = "abcdefghijklm";
  const plate = "a".repeat(19);
  const wide = "b".repeat(32);
  const rows = [
    { id: "ada", label: "Ada", note: stub },
    { id: "bea", label: "Bea", note: { assigneeId: stub } },
    { id: "cy", label: "Cy", note: { assigneeId: null } },
    { id: "dee", label: "Dee", note: { assigneeId: stub, balance: 1 } },
    { id: "eve", label: "Eve", note: slip },
    { id: "fay", label: "Fay", note: plate },
    { id: "gus", label: "Gus", note: wide },
    { id: "nope", label: "Nope", note: "nope" },
    { id: "blank", label: "Blank", note: "" },
  ];
  assert.equal(ownerState(stub), "set");
  assert.equal(ownerState({ assigneeId: null }), "clear");
  assert.equal(ownerState({ assigneeId: stub, balance: 1 }), "");
  assert.equal(ownerState("nope"), "");
  assert.equal(ownerState(""), "clear");
  assert.equal(ownerState("abc"), "");
  assert.equal(ownerState("a".repeat(33)), "");
  assert.equal(ownerState("abcd-efgh"), "");
  assert.equal(ownerBand(stub), "stub");
  assert.equal(ownerBand(slip), "slip");
  assert.equal(ownerBand(plate), "plate");
  assert.equal(ownerBand(wide), "wide");
  assert.equal(catalogOwner(stub), true);
  assert.equal(catalogOwner(slip), false);
  assert.equal(wideOwner(wide), true);
  assert.equal(evenOwner(stub), true);
  assert.equal(catalogOwnerCount(rows), 3);
  assert.equal(wideOwnerCount(rows), 1);
  assert.equal(evenOwnerCount(rows), 3);
  assert.equal(sharedOwnerCount(rows), 1);
  assert.equal(visibleOwnerCustomers(rows, "stub", null, "", "all", [], "all").length, 2);
  assert.equal(visibleOwnerCustomers(rows, null, null, "gus", "all", [], "all").length, 1);
  const bands = ownersCsv(rows);
  assert.equal(bands.startsWith("kind,mark,count"), true);
  assert.equal(bands.includes("amount"), false);
  assert.equal(bands.includes("catalog"), true);
  const queue = ownerRowsCsv(rows, ["ada"]);
  assert.equal(queue.includes("Ada"), true);
  assert.equal(queue.split("\n")[1].endsWith(",1"), true);

  assert.equal(crmv4Text("en", "sltTitle"), ROUND186_COPY.en.sltTitle);
  assert.equal(crmv4Text("tr", "ownTitle"), ROUND186_COPY.tr.ownTitle);
  assert.equal(crmv4Text("de", "sltSearch"), ROUND186_COPY.de.sltSearch);
  assert.equal(crmv4Text("ru", "ownHint"), ROUND186_COPY.ru.ownHint);
  assert.equal(crmv4Text("ar", "sltNotice"), ROUND186_COPY.ar.sltNotice);
  assert.notEqual(ROUND186_COPY.tr.sltTitle, ROUND186_COPY.en.sltTitle);
  assert.notEqual(ROUND186_COPY.de.ownTitle, ROUND186_COPY.en.ownTitle);
  assert.notEqual(ROUND186_COPY.ru.sltSearch, ROUND186_COPY.en.sltSearch);
  assert.notEqual(ROUND186_COPY.ar.ownSearch, ROUND186_COPY.en.ownSearch);
  const keys = Object.keys(ROUND186_COPY.en);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND186_COPY[locale]), keys);
  }

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-slt/);
  assert.match(css, /\.c4-own/);
  assert.match(css, /\.c4-support-parlor/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round186.tsx"), "utf8");
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
  assert.match(viewFile, /assigneeId/);
  assert.match(viewFile, /slatesCsv/);
  assert.match(viewFile, /ownersCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-slates/);
  assert.match(viewFile, /data-owners/);
  assert.match(viewFile, /data-catalog/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestTint/);
  const support = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Support.tsx"), "utf8");
  assert.match(support, /c4-support-parlor/);
  assert.match(support, /data-logo="mono"/);
  assert.match(support, /c4-support-mast/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "slate"/);
  assert.match(app, /view === "ownr"/);
  assert.match(app, /SlateWatches/);
  assert.match(app, /OwnerPlates/);
  console.log("crmv4 round186 tests passed");
}

main();
