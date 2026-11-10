/**
 * Atelier passes and block notices.
 * Run: TZ=UTC npx tsx tests/crmv4-round169.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND169_COPY } from "../src/lib/crmv4/copy-round169";
import {
  activeLeaf,
  activePost,
  addPass,
  addPassView,
  bandOf,
  bodyLeaf,
  bulkPassRoom,
  cyclePassGrade,
  edgeLeaf,
  editPass,
  editPassNote,
  latePass,
  leafGap,
  leafOf,
  leadingClose,
  leadingPost,
  nextPass,
  noticeClose,
  noticeLength,
  noticePost,
  noticesCsv,
  passLine,
  passSeal,
  passesCsv,
  readPasses,
  suggestReader,
  suggestRoom,
  visibleNoticeCustomers,
  visiblePasses,
  weightOf,
} from "../src/lib/crmv4/round169";

function main() {
  assert.equal(passLine("  Pass\nAda  "), "Pass Ada");
  assert.equal(passLine("   "), "");
  assert.equal(passLine("x".repeat(80)).length, 40);
  assert.equal(passSeal("  KYC  "), "KYC");
  assert.equal(passSeal("   "), "");
  assert.equal(passSeal("z".repeat(20)).length, 3);

  assert.equal(leafOf("01"), 1);
  assert.equal(leafOf("09"), 9);
  assert.equal(leafOf("1"), 1);
  assert.equal(leafOf(12), 12);
  assert.equal(leafOf("00"), null);
  assert.equal(leafOf("0"), null);
  assert.equal(leafOf(13), null);
  assert.equal(leafOf(""), null);
  assert.equal(leafOf("3.0"), null);
  assert.equal(weightOf("01"), 1);
  assert.equal(weightOf(4), 4);
  assert.equal(weightOf("0"), null);
  assert.equal(weightOf("5"), null);
  assert.equal(bandOf(1), "opening");
  assert.equal(bandOf(4), "opening");
  assert.equal(bandOf(5), "middle");
  assert.equal(bandOf(8), "middle");
  assert.equal(bandOf(9), "closing");
  assert.equal(bandOf(12), "closing");
  assert.equal(bandOf(null), "blank");
  assert.equal(edgeLeaf(1), true);
  assert.equal(edgeLeaf(2), true);
  assert.equal(edgeLeaf(11), true);
  assert.equal(edgeLeaf(12), true);
  assert.equal(edgeLeaf(3), false);
  assert.equal(bodyLeaf(3), true);
  assert.equal(bodyLeaf(10), true);
  assert.equal(bodyLeaf(11), false);
  assert.equal(leafGap(11, 1), 2);
  assert.equal(leafGap(1, 11), -2);
  assert.equal(leafGap(2, 2), 0);
  assert.equal(leafGap(4, 10), 6);
  assert.equal(leafGap(4, 11), -5);
  assert.equal(leafGap(4, 12), -4);
  assert.equal(leafGap(null, 2), null);
  assert.equal(leafGap(2, ""), null);
  assert.equal(leafGap(2, 13), null);

  const saved = addPass([], { id: "a", title: "Pass Ada", note: "passport scan", reader: "Nia", leaf: "01", room: "alcove", seal: "A1", grade: "sketch", weight: "01" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].leaf, 1);
  assert.equal(saved[0].weight, 1);
  assert.equal(saved[0].note, "passport scan");
  assert.equal(saved[0].audit, "save");
  assert.equal(addPass(saved, { id: "b", title: "Pass Ada" }).length, 1);
  assert.equal(addPass(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(addPass(saved, { id: "c", title: "   " }).length, 1);
  const capped = Array.from({ length: 12 }, (_, index) => ({ id: `n${index}`, title: `Line ${index}` })).reduce((cards, card) => addPass(cards, card), [] as ReturnType<typeof addPass>);
  assert.equal(capped.length, 10);

  const cycled = cyclePassGrade(saved, "a");
  assert.equal(cycled[0].grade, "proof");
  assert.equal(cycled[0].audit, "grade");
  assert.equal(cyclePassGrade(cycled, "a")[0].grade, "press");
  assert.equal(cyclePassGrade(cyclePassGrade(cycled, "a"), "a")[0].grade, "sketch");
  const blankGrade = addPass([], { id: "z", title: "Blank grade" });
  assert.equal(cyclePassGrade(blankGrade, "z")[0].grade, "sketch");

  const edited = editPass(saved, "a", "Pass Bea");
  assert.equal(edited[0].title, "Pass Bea");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editPass(edited, "a", "  ")[0].title, "Pass Bea");
  const noted = editPassNote(edited, "a", "second look");
  assert.equal(noted[0].note, "second look");
  assert.equal(editPassNote(noted, "a", "  ")[0].note, "second look");
  const pair = addPass(noted, { id: "b", title: "Keep" });
  assert.equal(editPass(pair, "a", "Keep").find((card) => card.id === "a")?.title, "Pass Bea");

  const moved = bulkPassRoom(pair, ["a"], "nave");
  assert.equal(moved.find((card) => card.id === "a")?.room, "nave");
  assert.equal(moved.find((card) => card.id === "a")?.audit, "room");
  assert.equal(bulkPassRoom(moved, ["a"], "nave").find((card) => card.id === "a")?.audit, "room");
  assert.equal(bulkPassRoom(moved, ["a"], "attic").find((card) => card.id === "a")?.room, "nave");

  const mixed = [
    ...addPass([], { id: "live", title: "Live", note: "passport scan", reader: "Nia", leaf: 2, room: "alcove", seal: "A1", grade: "sketch", weight: 1 }),
  ];
  assert.equal(visiblePasses(mixed, "open", "passport", null, null, null, null, null, null, null, false, false).length, 1);
  assert.equal(visiblePasses(mixed, "open", "nia", null, null, null, null, null, null, null, false, false).length, 0);
  const held = mixed.map((card) => (card.id === "live" ? { ...card, held: true } : card));
  const filed = mixed.map((card) => ({ ...card, done: true, held: true }));
  assert.equal(visiblePasses(mixed, "open", "", null, null, null, null, null, null, null, false, false).length, 1);
  assert.equal(visiblePasses(held, "held", "", null, null, null, null, null, null, null, false, false).length, 1);
  assert.equal(visiblePasses(held, "open", "", null, null, null, null, null, null, null, false, false).length, 0);
  assert.equal(visiblePasses(filed, "done", "", null, null, null, null, null, null, null, false, false).length, 1);
  assert.equal(visiblePasses(filed, "held", "", null, null, null, null, null, null, null, false, false).length, 0);
  assert.equal(latePass(mixed[0], 6), true);
  assert.equal(latePass(mixed[0], 5), false);
  assert.equal(suggestRoom([]), "alcove");
  assert.equal(suggestRoom(mixed), "nave");
  assert.equal(suggestReader([]), "");
  assert.equal(suggestReader(mixed), "Nia");
  const loaded = addPass(mixed, { id: "bea", title: "Bea", reader: "Bea", leaf: 3, room: "nave", grade: "sketch" });
  assert.equal(suggestReader(loaded), "Bea");
  assert.equal(nextPass(mixed, 2), "live");
  assert.equal(nextPass(mixed.map((card) => ({ ...card, grade: "press" })), 2), "");
  assert.equal(nextPass(mixed, 9), "live");
  const csv = passesCsv(mixed, 6);
  assert.equal(csv.startsWith("title,reader,leaf,room,seal,grade,weight,band,pinned,held,done,gap,late,note,audit"), true);
  assert.equal(csv.includes("amount"), false);
  assert.equal(csv.includes(",1,"), true);
  assert.equal(readPasses(mixed)[0].leaf, 2);
  const views = addPassView([], { id: "v", name: "Opening", tray: "open", query: "ada", reader: "all", room: "alcove", seal: "all", grade: "all", leaf: "opening", weight: "1" });
  assert.equal(views.length, 1);
  assert.equal(views[0].leaf, "opening");
  assert.equal(views[0].weight, "1");
  assert.equal(activeLeaf("13"), "all");
  assert.equal(activeLeaf("01"), "1");
  assert.equal(activeLeaf("edge"), "edge");

  assert.equal(noticePost("Please wait."), "set");
  assert.equal(noticePost(""), "clear");
  assert.equal(noticePost("   "), "clear");
  assert.equal(noticePost(null), "");
  assert.equal(noticePost({ loginBlockedMessage: "Wait." }), "set");
  assert.equal(noticePost({ loginBlockedMessage: "" }), "clear");
  assert.equal(noticePost({ loginEnabled: false, loginBlockedMessage: "Wait." }), "");
  assert.equal(noticePost({ name: "Ada" }), "");
  assert.equal(noticeLength("short"), "slip");
  assert.equal(noticeLength("x".repeat(16)), "slip");
  assert.equal(noticeLength("x".repeat(17)), "card");
  assert.equal(noticeLength("x".repeat(49)), "sheet");
  assert.equal(noticeLength("x".repeat(200)), "sheet");
  assert.equal(noticeLength(""), "");
  assert.equal(noticeClose("Done."), "stop");
  assert.equal(noticeClose("Done!"), "stop");
  assert.equal(noticeClose("Ready?"), "ask");
  assert.equal(noticeClose("Hello"), "open");
  assert.equal(noticeClose("12"), "");
  assert.equal(noticeClose(""), "");
  const rows = [
    { notice: "Please wait.", label: "Ada" },
    { notice: "", label: "Ann" },
    { notice: null, label: "Beatrice" },
    { notice: `${"x".repeat(20)}?`, label: "Annabelle Marie" },
  ];
  assert.equal(leadingPost(rows), "set");
  assert.equal(leadingPost([{ notice: "A" }, { notice: "" }]), "set");
  assert.equal(leadingClose([{ notice: "Done." }, { notice: "Ready?" }]), "stop");
  assert.equal(leadingClose(rows), "stop");
  assert.equal(visibleNoticeCustomers(rows, "clear", null, null, "").length, 1);
  assert.equal(visibleNoticeCustomers(rows, null, "card", "ask", "").length, 1);
  assert.equal(visibleNoticeCustomers(rows, null, null, null, "bea").length, 1);
  assert.equal(visibleNoticeCustomers(rows, null, null, null, "wait").length, 0);
  const names = noticesCsv(rows);
  assert.equal(names.startsWith("kind,notice,count"), true);
  assert.equal(noticesCsv([]), "kind,notice,count");
  assert.equal(names.includes("amount"), false);
  assert.equal(names.includes(",set,"), true);
  assert.equal(activePost("gone", ["set"]), "all");

  const copy = Object.keys(ROUND169_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND169_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "atpTitle"), "Atelier passes");
  assert.equal(crmv4Text("tr", "nbmTitle"), ROUND169_COPY.tr.nbmTitle);
  assert.equal(crmv4Text("de", "atpReader"), ROUND169_COPY.de.atpReader);
  assert.equal(crmv4Text("ru", "nbmUnmarked"), ROUND169_COPY.ru.nbmUnmarked);
  assert.equal(crmv4Text("ar", "atpNotice"), ROUND169_COPY.ar.atpNotice);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-atp/);
  assert.match(css, /\.c4-nbm/);
  assert.match(css, /\.c4-cust-atelier/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round169.tsx"), "utf8");
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
  assert.match(viewFile, /loginBlockedMessage/);
  assert.match(viewFile, /passesCsv/);
  assert.match(viewFile, /noticesCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-passes/);
  assert.match(viewFile, /data-notices/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestRoom/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "atelier"/);
  assert.match(app, /view === "notice"/);
  const customers = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Customers.tsx"), "utf8");
  assert.match(customers, /c4-cust-atelier/);
  console.log("crmv4 round169 tests passed");
}

main();
