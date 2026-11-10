/**
 * Retention keeps and invalid-lead stamps.
 * Run: TZ=UTC npx tsx tests/crmv4-round184.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND184_COPY } from "../src/lib/crmv4/copy-round184";
import {
  activeGrade,
  activeHour,
  activeWait,
  addKeep,
  addKeepView,
  bulkKeepCloth,
  cycleTone,
  editKeep,
  editKeepNote,
  fairKeeper,
  firstStamp,
  firstStampCount,
  gradeOf,
  homeDesk,
  hourGap,
  hourOf,
  keepMark,
  keepsCsv,
  lateKeep,
  nextKeep,
  noonStamp,
  noonStampCount,
  peakHour,
  quietHour,
  readKeeps,
  sharedStampCount,
  soonKeep,
  stampAge,
  stampBand,
  stampDepth,
  stampRowsCsv,
  stampState,
  stampsCsv,
  suggestCloth,
  suggestKeeper,
  suggestWait,
  usedHours,
  visibleKeeps,
  visibleStampCustomers,
  waitOf,
  weekendStamp,
  weekendStampCount,
} from "../src/lib/crmv4/round184";

function main() {
  assert.equal(keepMark("  en "), "EN");
  assert.equal(keepMark("tr"), "TR");
  assert.equal(keepMark("ar"), "AR");
  assert.equal(keepMark("   "), "");
  assert.equal(keepMark("E"), "");
  assert.equal(keepMark("ENG"), "");
  assert.equal(hourOf("01"), 1);
  assert.equal(hourOf("08"), 8);
  assert.equal(hourOf("8"), 8);
  assert.equal(hourOf("00"), null);
  assert.equal(hourOf("09"), null);
  assert.equal(hourOf("9"), null);
  assert.equal(hourOf(""), null);
  assert.equal(hourOf("3.0"), null);
  assert.equal(gradeOf("2"), 2);
  assert.equal(gradeOf(4), 4);
  assert.equal(gradeOf(8), 8);
  assert.equal(gradeOf("0"), null);
  assert.equal(gradeOf("1"), null);
  assert.equal(gradeOf("02"), null);
  assert.equal(waitOf("20"), 20);
  assert.equal(waitOf(40), 40);
  assert.equal(waitOf(80), 80);
  assert.equal(waitOf("0"), null);
  assert.equal(waitOf("30"), null);
  assert.equal(waitOf("020"), null);
  assert.equal(peakHour(3), true);
  assert.equal(peakHour(7), true);
  assert.equal(peakHour(1), false);
  assert.equal(quietHour(1), true);
  assert.equal(quietHour(4), true);
  assert.equal(quietHour(8), true);
  assert.equal(quietHour(3), false);
  assert.equal(quietHour(7), false);
  assert.equal(hourGap(5, 1), -4);
  assert.equal(hourGap(1, 5), 4);
  assert.equal(hourGap(2, 2), 0);
  assert.equal(hourGap(1, 6), -3);
  assert.equal(hourGap(8, 1), 1);
  assert.equal(hourGap(null, 2), null);
  assert.equal(hourGap(2, ""), null);
  assert.equal(hourGap(2, 9), null);

  const saved = addKeep([], { id: "a", title: "Keep Ada", note: "ivory call", keeper: "Nia", hour: "08", cloth: "ivory", mark: "en", tone: "hush", grade: "8", wait: "20" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].hour, 8);
  assert.equal(saved[0].grade, 8);
  assert.equal(saved[0].wait, 20);
  assert.equal(saved[0].mark, "EN");
  assert.equal(saved[0].note, "ivory call");
  assert.equal(saved[0].audit, "save");
  assert.equal(homeDesk(saved[0].mark), true);
  assert.equal(homeDesk("DE"), false);
  assert.equal(homeDesk("US"), false);
  assert.equal(soonKeep(saved[0]), true);
  assert.equal(addKeep(saved, { id: "b", title: "Keep Ada" }).length, 1);
  assert.equal(addKeep(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(addKeep(saved, { id: "c", title: "   " }).length, 1);
  const capped = Array.from({ length: 11 }, (_, index) => ({ id: `n${index}`, title: `Line ${index}` })).reduce((cards, card) => addKeep(cards, card), [] as ReturnType<typeof addKeep>);
  assert.equal(capped.length, 9);
  assert.equal(capped.some((card) => card.title === "Line 0"), false);
  assert.equal(capped[0].title, "Line 10");

  const cycled = cycleTone(saved, "a");
  assert.equal(cycled[0].tone, "even");
  assert.equal(cycled[0].audit, "tone");
  assert.equal(cycleTone(cycled, "a")[0].tone, "firm");
  assert.equal(cycleTone(cycleTone(cycled, "a"), "a")[0].tone, "hush");
  const blankTone = addKeep([], { id: "z", title: "Blank tone" });
  assert.equal(cycleTone(blankTone, "z")[0].tone, "hush");

  const edited = editKeep(saved, "a", "Keep Bea");
  assert.equal(edited[0].title, "Keep Bea");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editKeep(edited, "a", "  ")[0].title, "Keep Bea");
  const noted = editKeepNote(edited, "a", "second look");
  assert.equal(noted[0].note, "second look");
  assert.equal(editKeepNote(noted, "a", "  ")[0].note, "second look");
  const pair = addKeep(noted, { id: "b", title: "Keep" });
  assert.equal(editKeep(pair, "a", "Keep").find((card) => card.id === "a")?.title, "Keep Bea");

  const early = addKeep([], { id: "a", title: "Early", hour: "1", cloth: "ivory", wait: "80", keeper: "Nia", grade: "8" });
  const mid = addKeep(early, { id: "m", title: "Mid", hour: "4", cloth: "graphite", wait: "40", keeper: "Ada", grade: "2", tone: "hush" });
  const open = addKeep(mid, { id: "b", title: "Later", hour: "6", tone: "firm" });
  assert.equal(lateKeep(open.find((card) => card.title === "Early") as (typeof open)[number], 4), true);
  assert.equal(lateKeep(open.find((card) => card.title === "Early") as (typeof open)[number], 3), false);
  const earlyCard = open.find((card) => card.title === "Early") as (typeof open)[number];
  assert.equal(lateKeep({ ...earlyCard, filed: true }, 4), false);
  assert.equal(nextKeep(open, 2), open.find((card) => card.title === "Mid")?.id);
  assert.equal(nextKeep(open, 5), open.find((card) => card.title === "Early")?.id);
  assert.equal(suggestCloth([]), "champagne");
  assert.equal(suggestCloth(open), "champagne");
  assert.equal(suggestKeeper(open), "Ada");
  assert.equal(suggestWait([]), 40);
  assert.equal(suggestWait(open), 20);
  assert.equal(fairKeeper(open, "Nia, Bea"), "Bea");
  assert.equal(fairKeeper(open, ""), "Ada");
  assert.equal(usedHours(open), 3);
  assert.equal(bulkKeepCloth(open, ["b"], "champagne").find((card) => card.id === "b")?.cloth, "champagne");
  assert.equal(bulkKeepCloth(open, ["b"], "champagne").find((card) => card.id === "b")?.audit, "cloth");
  const shown = visibleKeeps(open, "open", "ada", null, null, null, null, null, null, null, null, false, false, false);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].title, "Mid");
  const sheet = keepsCsv(saved, 2);
  assert.equal(sheet.startsWith("title,keeper,hour,cloth,mark,tone,grade,wait,band,pinned,held,filed,gap,late,soon,home,note,audit"), true);
  assert.equal(sheet.includes("amount"), false);
  assert.equal(sheet.includes("Keep Ada"), true);
  assert.equal(activeGrade("02"), "all");
  assert.equal(activeGrade("2"), "2");
  assert.equal(activeWait("020"), "all");
  assert.equal(activeWait("20"), "20");
  assert.equal(activeWait("80"), "80");
  assert.equal(activeHour("01"), "1");
  assert.equal(activeHour("09"), "all");
  const views = Array.from({ length: 7 }, (_, index) => ({
    id: `v${index}`,
    name: `View ${index}`,
    tray: "open" as const,
    query: "",
    keeper: "all",
    cloth: "all",
    mark: "all",
    tone: "all",
    hour: "all",
    grade: "all",
    wait: "all",
  })).reduce((list, view) => addKeepView(list, view), [] as ReturnType<typeof addKeepView>);
  assert.equal(views.length, 5);
  assert.equal(readKeeps(saved)[0].title, "Keep Ada");

  const noon = "2026-11-10T12:00:00.000Z";
  const sunday = "2026-11-01T08:00:00.000Z";
  const monthStart = "2026-10-01T22:00:00.000Z";
  const old = "2026-07-01T03:00:00.000Z";
  const rows = [
    { id: "ada", label: "Ada", note: noon },
    { id: "bea", label: "Bea", note: { leadInvalidAt: noon } },
    { id: "cy", label: "Cy", note: { leadInvalidAt: null } },
    { id: "dee", label: "Dee", note: { leadInvalidAt: sunday, email: "a@b.c" } },
    { id: "eve", label: "Eve", note: sunday },
    { id: "fay", label: "Fay", note: monthStart },
    { id: "gus", label: "Gus", note: old },
    { id: "nope", label: "Nope", note: "nope" },
    { id: "blank", label: "Blank", note: "" },
  ];
  assert.equal(stampState(noon), "set");
  assert.equal(stampState({ leadInvalidAt: null }), "clear");
  assert.equal(stampState({ leadInvalidAt: sunday, email: "a@b.c" }), "");
  assert.equal(stampState("nope"), "");
  assert.equal(stampState(""), "clear");
  assert.equal(stampState(3), "");
  assert.equal(stampAge(noon), 0);
  assert.equal(stampBand(noon), "fresh");
  assert.equal(stampDepth(noon), "day");
  assert.equal(noonStamp(noon), true);
  assert.equal(weekendStamp(noon), false);
  assert.equal(stampAge(sunday), 9);
  assert.equal(stampBand(sunday), "week");
  assert.equal(stampDepth(sunday), "dawn");
  assert.equal(weekendStamp(sunday), true);
  assert.equal(firstStamp(sunday), true);
  assert.equal(stampAge(monthStart), 40);
  assert.equal(stampBand(monthStart), "month");
  assert.equal(stampDepth(monthStart), "night");
  assert.equal(stampAge(old), 132);
  assert.equal(stampBand(old), "old");
  assert.equal(stampDepth("2026-11-10T18:00:00.000Z"), "dusk");
  assert.equal(stampDepth("2026-11-10"), "night");
  assert.equal(noonStamp("2026-11-10"), false);
  assert.equal(stampBand("2026-11-12T00:00:00.000Z"), "");
  assert.equal(weekendStampCount(rows), 1);
  assert.equal(firstStampCount(rows), 3);
  assert.equal(noonStampCount(rows), 2);
  assert.equal(sharedStampCount(rows), 1);
  assert.equal(visibleStampCustomers(rows, "fresh", null, "", "all", [], "all").length, 2);
  assert.equal(visibleStampCustomers(rows, null, null, "gus", "all", [], "all").length, 1);
  const bands = stampsCsv(rows);
  assert.equal(bands.startsWith("kind,mark,count"), true);
  assert.equal(bands.includes("amount"), false);
  assert.equal(bands.includes("weekend"), true);
  const queue = stampRowsCsv(rows, ["ada"]);
  assert.equal(queue.includes("Ada"), true);
  assert.equal(queue.split("\n")[1].endsWith(",1"), true);

  assert.equal(crmv4Text("en", "kpvTitle"), ROUND184_COPY.en.kpvTitle);
  assert.equal(crmv4Text("tr", "stpTitle"), ROUND184_COPY.tr.stpTitle);
  assert.equal(crmv4Text("de", "kpvSearch"), ROUND184_COPY.de.kpvSearch);
  assert.equal(crmv4Text("ru", "stpHint"), ROUND184_COPY.ru.stpHint);
  assert.equal(crmv4Text("ar", "kpvNotice"), ROUND184_COPY.ar.kpvNotice);
  assert.notEqual(ROUND184_COPY.tr.kpvTitle, ROUND184_COPY.en.kpvTitle);
  assert.notEqual(ROUND184_COPY.de.stpTitle, ROUND184_COPY.en.stpTitle);
  assert.notEqual(ROUND184_COPY.ru.kpvSearch, ROUND184_COPY.en.kpvSearch);
  assert.notEqual(ROUND184_COPY.ar.stpSearch, ROUND184_COPY.en.stpSearch);
  const keys = Object.keys(ROUND184_COPY.en);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND184_COPY[locale]), keys);
  }

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-kpv/);
  assert.match(css, /\.c4-stp/);
  assert.match(css, /\.c4-settings-atelier/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round184.tsx"), "utf8");
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
  assert.match(viewFile, /leadInvalidAt/);
  assert.match(viewFile, /keepsCsv/);
  assert.match(viewFile, /stampsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-keeps/);
  assert.match(viewFile, /data-stamps/);
  assert.match(viewFile, /data-weekend/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestCloth/);
  const settings = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Settings.tsx"), "utf8");
  assert.match(settings, /c4-settings-atelier/);
  assert.match(settings, /data-logo="mono"/);
  assert.match(settings, /c4-settings-mast/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "keeps"/);
  assert.match(app, /view === "istmp"/);
  assert.match(app, /RetentionKeeps/);
  assert.match(app, /InvalidStamps/);
  console.log("crmv4 round184 tests passed");
}

main();
