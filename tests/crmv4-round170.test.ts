/**
 * Vestry chits and shutter times.
 * Run: TZ=UTC npx tsx tests/crmv4-round170.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND170_COPY } from "../src/lib/crmv4/copy-round170";
import {
  activeBell,
  activeWatch,
  addChit,
  addChitView,
  bellGap,
  bellOf,
  bodyBell,
  bulkChitAisle,
  chitMark,
  chitsCsv,
  cycleChime,
  edgeBell,
  editChit,
  editChitAside,
  lateChit,
  leadingPhase,
  leadingWatch,
  nextChit,
  pegOf,
  readChits,
  shutterPhase,
  shutterState,
  shutterWatch,
  shuttersCsv,
  spanOf,
  suggestAisle,
  suggestClerk,
  visibleChits,
  visibleShutterCustomers,
  watchOf,
} from "../src/lib/crmv4/round170";

function main() {
  assert.equal(chitMark("  KYC  "), "KYC");
  assert.equal(chitMark("   "), "");
  assert.equal(chitMark("z".repeat(20)).length, 3);

  assert.equal(bellOf("00"), 0);
  assert.equal(bellOf("09"), 9);
  assert.equal(bellOf("0"), 0);
  assert.equal(bellOf(23), 23);
  assert.equal(bellOf("24"), null);
  assert.equal(bellOf(""), null);
  assert.equal(bellOf("3.0"), null);
  assert.equal(pegOf("01"), 1);
  assert.equal(pegOf(3), 3);
  assert.equal(pegOf("0"), null);
  assert.equal(pegOf("4"), null);
  assert.equal(spanOf("15"), 15);
  assert.equal(spanOf(60), 60);
  assert.equal(spanOf("20"), null);
  assert.equal(spanOf("015"), null);
  assert.equal(watchOf(0), "night");
  assert.equal(watchOf(5), "night");
  assert.equal(watchOf(6), "morning");
  assert.equal(watchOf(11), "morning");
  assert.equal(watchOf(12), "afternoon");
  assert.equal(watchOf(17), "afternoon");
  assert.equal(watchOf(18), "evening");
  assert.equal(watchOf(23), "evening");
  assert.equal(watchOf(null), "blank");
  assert.equal(edgeBell(0), true);
  assert.equal(edgeBell(1), true);
  assert.equal(edgeBell(22), true);
  assert.equal(edgeBell(23), true);
  assert.equal(edgeBell(2), false);
  assert.equal(bodyBell(2), true);
  assert.equal(bodyBell(21), true);
  assert.equal(bodyBell(22), false);
  assert.equal(bodyBell(0), false);
  assert.equal(bellGap(22, 1), 3);
  assert.equal(bellGap(1, 22), -3);
  assert.equal(bellGap(2, 2), 0);
  assert.equal(bellGap(4, 16), 12);
  assert.equal(bellGap(16, 4), 12);
  assert.equal(bellGap(null, 2), null);
  assert.equal(bellGap(2, ""), null);
  assert.equal(bellGap(2, 24), null);

  const saved = addChit([], { id: "a", subject: "Chit Ada", aside: "passport scan", clerk: "Nia", bell: "09", aisle: "north", mark: "A1", chime: "hush", peg: "01", span: "15" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].bell, 9);
  assert.equal(saved[0].peg, 1);
  assert.equal(saved[0].span, 15);
  assert.equal(saved[0].aside, "passport scan");
  assert.equal(saved[0].audit, "save");
  assert.equal(addChit(saved, { id: "b", subject: "Chit Ada" }).length, 1);
  assert.equal(addChit(saved, { id: "a", subject: "Other" }).length, 1);
  assert.equal(addChit(saved, { id: "c", subject: "   " }).length, 1);
  const capped = Array.from({ length: 12 }, (_, index) => ({ id: `n${index}`, subject: `Line ${index}` })).reduce((cards, card) => addChit(cards, card), [] as ReturnType<typeof addChit>);
  assert.equal(capped.length, 10);

  const cycled = cycleChime(saved, "a");
  assert.equal(cycled[0].chime, "tone");
  assert.equal(cycled[0].audit, "chime");
  assert.equal(cycleChime(cycled, "a")[0].chime, "peal");
  assert.equal(cycleChime(cycleChime(cycled, "a"), "a")[0].chime, "hush");
  const blankChime = addChit([], { id: "z", subject: "Blank chime" });
  assert.equal(cycleChime(blankChime, "z")[0].chime, "hush");

  const edited = editChit(saved, "a", "Chit Bea");
  assert.equal(edited[0].subject, "Chit Bea");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editChit(edited, "a", "  ")[0].subject, "Chit Bea");
  const noted = editChitAside(edited, "a", "second look");
  assert.equal(noted[0].aside, "second look");
  assert.equal(editChitAside(noted, "a", "  ")[0].aside, "second look");
  const pair = addChit(noted, { id: "b", subject: "Keep" });
  assert.equal(editChit(pair, "a", "Keep").find((card) => card.id === "a")?.subject, "Chit Bea");

  const moved = bulkChitAisle(pair, ["a"], "south");
  assert.equal(moved.find((card) => card.id === "a")?.aisle, "south");
  assert.equal(moved.find((card) => card.id === "a")?.audit, "aisle");
  assert.equal(bulkChitAisle(moved, ["a"], "south").find((card) => card.id === "a")?.audit, "aisle");
  assert.equal(bulkChitAisle(moved, ["a"], "attic").find((card) => card.id === "a")?.aisle, "south");

  const mixed = [
    ...addChit([], { id: "live", subject: "Live", aside: "passport scan", clerk: "Nia", bell: 2, aisle: "north", mark: "A1", chime: "hush", peg: 1, span: 30 }),
  ];
  assert.equal(visibleChits(mixed, "open", "passport", null, null, null, null, null, null, null, null, false, false).length, 1);
  assert.equal(visibleChits(mixed, "open", "nia", null, null, null, null, null, null, null, null, false, false).length, 0);
  const seated = mixed.map((card) => (card.id === "live" ? { ...card, seated: true } : card));
  const filed = mixed.map((card) => ({ ...card, closed: true, seated: true }));
  assert.equal(visibleChits(mixed, "open", "", null, null, null, null, null, null, null, null, false, false).length, 1);
  assert.equal(visibleChits(seated, "seated", "", null, null, null, null, null, null, null, null, false, false).length, 1);
  assert.equal(visibleChits(seated, "open", "", null, null, null, null, null, null, null, null, false, false).length, 0);
  assert.equal(visibleChits(filed, "closed", "", null, null, null, null, null, null, null, null, false, false).length, 1);
  assert.equal(visibleChits(filed, "seated", "", null, null, null, null, null, null, null, null, false, false).length, 0);
  assert.equal(lateChit(mixed[0], 7), true);
  assert.equal(lateChit(mixed[0], 6), false);
  assert.equal(suggestAisle([]), "north");
  assert.equal(suggestAisle(mixed), "south");
  assert.equal(suggestClerk([]), "");
  assert.equal(suggestClerk(mixed), "Nia");
  const loaded = addChit(mixed, { id: "bea", subject: "Bea", clerk: "Bea", bell: 3, aisle: "south", chime: "hush" });
  assert.equal(suggestClerk(loaded), "Bea");
  assert.equal(nextChit(mixed, 2), "live");
  assert.equal(nextChit(mixed.map((card) => ({ ...card, chime: "peal" })), 2), "");
  assert.equal(nextChit(mixed, 9), "live");
  const csv = chitsCsv(mixed, 7);
  assert.equal(csv.startsWith("subject,clerk,bell,aisle,mark,chime,peg,span,watch,pinned,seated,closed,gap,late,aside,audit"), true);
  assert.equal(csv.includes("amount"), false);
  assert.equal(csv.includes(",2,"), true);
  assert.equal(readChits(mixed)[0].bell, 2);
  const views = addChitView([], { id: "v", name: "Morning", tray: "open", query: "ada", clerk: "all", aisle: "north", mark: "all", chime: "all", bell: "morning", peg: "1", span: "30" });
  assert.equal(views.length, 1);
  assert.equal(views[0].bell, "morning");
  assert.equal(views[0].peg, "1");
  assert.equal(views[0].span, "30");
  assert.equal(activeBell("24"), "all");
  assert.equal(activeBell("09"), "9");
  assert.equal(activeBell("night"), "night");

  assert.equal(shutterState("2026-11-10T14:05:00.000Z"), "set");
  assert.equal(shutterState(""), "clear");
  assert.equal(shutterState("   "), "clear");
  assert.equal(shutterState(null), "");
  assert.equal(shutterState({ loginBlockedAt: "2026-11-10T03:10:00.000Z" }), "set");
  assert.equal(shutterState({ loginBlockedAt: "" }), "clear");
  assert.equal(shutterState({ loginEnabled: false, loginBlockedAt: "2026-11-10T03:10:00.000Z" }), "");
  assert.equal(shutterState({ name: "Ada" }), "");
  assert.equal(shutterWatch("2026-11-10T03:10:00.000Z"), "night");
  assert.equal(shutterWatch("2026-11-10T06:00:00.000Z"), "morning");
  assert.equal(shutterWatch("2026-11-10T14:40:00.000Z"), "afternoon");
  assert.equal(shutterWatch("2026-11-10T18:20:00.000Z"), "evening");
  assert.equal(shutterWatch(""), "");
  assert.equal(shutterPhase("2026-11-10T03:10:00.000Z"), "early");
  assert.equal(shutterPhase("2026-11-10T14:20:00.000Z"), "middle");
  assert.equal(shutterPhase("2026-11-10T14:40:00.000Z"), "late");
  assert.equal(shutterPhase(""), "");
  const rows = [
    { at: "2026-11-10T03:10:00.000Z", label: "Ada" },
    { at: "", label: "Ann" },
    { at: null, label: "Beatrice" },
    { at: "2026-11-10T14:40:00.000Z", label: "Annabelle Marie" },
  ];
  assert.equal(leadingWatch(rows), "night");
  assert.equal(leadingPhase(rows), "early");
  assert.equal(visibleShutterCustomers(rows, "blank", null, "").length, 1);
  assert.equal(visibleShutterCustomers(rows, null, "late", "").length, 1);
  assert.equal(visibleShutterCustomers(rows, null, null, "bea").length, 1);
  assert.equal(visibleShutterCustomers(rows, null, null, "2026").length, 0);
  const names = shuttersCsv(rows);
  assert.equal(names.startsWith("kind,mark,count"), true);
  assert.equal(shuttersCsv([]), "kind,mark,count");
  assert.equal(names.includes("amount"), false);
  assert.equal(names.includes(",set,"), true);
  assert.equal(activeWatch("gone", ["night"]), "all");

  const copy = Object.keys(ROUND170_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND170_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "vstTitle"), "Vestry chits");
  assert.equal(crmv4Text("tr", "shtTitle"), ROUND170_COPY.tr.shtTitle);
  assert.equal(crmv4Text("de", "vstClerk"), ROUND170_COPY.de.vstClerk);
  assert.equal(crmv4Text("ru", "shtUnmarked"), ROUND170_COPY.ru.shtUnmarked);
  assert.equal(crmv4Text("ar", "vstNotice"), ROUND170_COPY.ar.vstNotice);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-vst/);
  assert.match(css, /\.c4-sht/);
  assert.match(css, /\.c4-cust-vestry/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round170.tsx"), "utf8");
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
  assert.match(viewFile, /loginBlockedAt/);
  assert.match(viewFile, /chitsCsv/);
  assert.match(viewFile, /shuttersCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "v"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-chits/);
  assert.match(viewFile, /data-shutters/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestAisle/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "vestry"/);
  assert.match(app, /view === "shutter"/);
  const customers = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Customers.tsx"), "utf8");
  assert.match(customers, /c4-cust-vestry/);
  console.log("crmv4 round170 tests passed");
}

main();
