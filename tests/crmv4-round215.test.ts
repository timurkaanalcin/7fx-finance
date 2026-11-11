/**
 * Ink folios and document grades.
 * Run: TZ=UTC npx tsx tests/crmv4-round215.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND215_COPY } from "../src/lib/crmv4/copy-round215";
import {
  activeGrade,
  activeHours,
  activeShelf,
  addFolio,
  addFolioTick,
  addFolioView,
  adjacentFolioCount,
  catalogGrade,
  catalogGradeCount,
  cycleGrade,
  densityOf,
  fairReader,
  gradeLane,
  gradeOf,
  gradeRowsCsv,
  gradeState,
  gradeStep,
  gradeTone,
  gradesCsv,
  hoursOf,
  houseInk,
  inkOf,
  lateFolio,
  leadingGrade,
  moveFocus,
  peakShelf,
  quietShelf,
  readFolioViews,
  setFolioWeight,
  sharedGradeCount,
  shelfGap,
  shelfOf,
  snoozeFolio,
  suggestHours,
  suggestInk,
  wideGrade,
  weightOf,
  windowFolios,
  foliosCsv,
} from "../src/lib/crmv4/round215";

function main() {
  assert.equal(inkOf("  gall "), "GALL");
  assert.equal(inkOf("soot"), "SOOT");
  assert.equal(inkOf("gold"), "GOLD");
  assert.equal(inkOf("   "), "");
  assert.equal(inkOf("oak"), "");
  assert.equal(shelfOf("1"), 1);
  assert.equal(shelfOf(8), 8);
  assert.equal(shelfOf("8"), 8);
  assert.equal(shelfOf("0"), null);
  assert.equal(shelfOf(0), null);
  assert.equal(shelfOf("9"), null);
  assert.equal(shelfOf("08"), null);
  assert.equal(shelfOf(""), null);
  assert.equal(shelfOf(1.5), null);
  assert.equal(hoursOf("4"), 4);
  assert.equal(hoursOf(8), 8);
  assert.equal(hoursOf("16"), 16);
  assert.equal(hoursOf("6"), null);
  assert.equal(hoursOf("04"), null);
  assert.equal(weightOf("0"), 0);
  assert.equal(weightOf(2), 2);
  assert.equal(weightOf("5"), 5);
  assert.equal(weightOf("3"), null);
  assert.equal(peakShelf(3), true);
  assert.equal(peakShelf(7), true);
  assert.equal(peakShelf(4), false);
  assert.equal(quietShelf(8), true);
  assert.equal(quietShelf(1), false);
  assert.equal(shelfGap(1, 8), 7);
  assert.equal(shelfGap(8, 1), -7);
  assert.equal(shelfGap(null, 3), null);
  assert.equal(shelfGap(1, 0), null);
  assert.equal(houseInk("gall"), true);
  assert.equal(houseInk("GOLD"), true);
  assert.equal(houseInk("soot"), false);
  assert.equal(activeShelf("peak"), "peak");
  assert.equal(activeShelf("8"), "8");
  assert.equal(activeShelf("9"), "all");
  assert.equal(activeHours("8"), "8");
  assert.equal(activeHours("6"), "all");
  assert.equal(activeGrade("fail", ["hold", "pass", "fail"]), "fail");
  assert.equal(activeGrade("nope", ["hold", "pass", "fail"]), "all");
  assert.equal(densityOf("low"), "low");
  assert.equal(densityOf("nope"), "tall");
  assert.equal(moveFocus(0, 3, 1), 1);
  assert.equal(moveFocus(0, 3, -1), 2);
  assert.equal(suggestInk([]), "GALL");
  assert.equal(suggestHours([]), 8);

  const first = addFolio([], {
    id: "a",
    title: "  North proof ",
    note: "quiet",
    reader: "Ada",
    shelf: "1",
    ink: "gall",
    grade: "hold",
    hours: "4",
    ticks: "a b c d z",
    weight: "2",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North proof");
  assert.equal(first[0].ink, "GALL");
  assert.equal(first[0].shelf, 1);
  assert.equal(first[0].hours, 4);
  assert.deepEqual(first[0].ticks, ["a", "b", "c"]);
  assert.equal(first[0].weight, 2);
  assert.equal(first[0].audit, "save");
  assert.equal(addFolio(first, { id: "a", title: "Other" }).length, 1);
  assert.equal(addFolio(first, { id: "b", title: "North proof" }).length, 1);
  assert.equal(addFolio(first, { id: "c", title: "   " }).length, 1);
  const passed = cycleGrade([{ ...first[0], grade: "" }], "a");
  assert.equal(passed[0].grade, "hold");
  assert.equal(cycleGrade(passed, "a")[0].grade, "pass");
  assert.equal(cycleGrade(cycleGrade(passed, "a"), "a")[0].grade, "fail");
  assert.equal(cycleGrade(cycleGrade(cycleGrade(passed, "a"), "a"), "a")[0].grade, "hold");
  assert.equal(addFolioTick(first, "a", "d").length, 1);
  assert.equal(addFolioTick(first, "a", "d")[0].ticks.length, 3);
  assert.equal(addFolioTick(first, "a", "a")[0].ticks.length, 3);
  assert.equal(addFolioTick(first, "a", "g")[0].ticks.length, 3);
  assert.equal(setFolioWeight(first, "a", 0)[0].weight, 0);
  assert.equal(setFolioWeight(first, "a", 1)[0].weight, 2);
  const snoozed = snoozeFolio([{ ...first[0], hours: null }], "a");
  assert.equal(snoozed[0].hours, 4);
  assert.equal(snoozeFolio(snoozed, "a")[0].hours, 8);
  assert.equal(snoozeFolio(snoozeFolio(snoozed, "a"), "a")[0].hours, 16);
  assert.equal(snoozeFolio(snoozeFolio(snoozeFolio(snoozed, "a"), "a"), "a")[0].hours, 16);

  const open = [{ ...first[0], weight: 0, paused: false, filed: false }];
  assert.equal(lateFolio(open[0], 8), true);
  assert.equal(lateFolio({ ...open[0], shelf: 6 }, 8), false);
  assert.equal(lateFolio({ ...open[0], shelf: 5 }, 8), true);
  assert.equal(lateFolio({ ...open[0], weight: 5 }, 8), false);
  assert.equal(windowFolios([{ ...open[0], shelf: 6 }], 8).length, 1);
  assert.equal(windowFolios([{ ...open[0], shelf: 1 }], 8).length, 0);
  assert.equal(fairReader(open, "Bea, Ada"), "Bea");
  const pair = addFolio(addFolio([], { id: "p", title: "One", shelf: 1, ink: "gold" }), { id: "q", title: "Four", shelf: 4, ink: "gold" });
  assert.equal(adjacentFolioCount(pair), 2);

  const views = addFolioView([], {
    id: "v1",
    name: "Peak",
    tray: "open",
    query: "",
    reader: "all",
    ink: "GALL",
    grade: "hold",
    shelf: "peak",
    hours: "4",
    weight: "0",
  });
  assert.equal(readFolioViews(views)[0].shelf, "peak");
  assert.equal(readFolioViews(views)[0].ink, "GALL");

  const csv = foliosCsv(open, 8);
  assert.match(csv, /North proof/);
  assert.match(csv, /,1,/);

  assert.equal(gradeOf("APPROVED"), "APR");
  assert.equal(gradeLane("pending"), "queue");
  assert.equal(gradeTone("NONE"), "ivory");
  assert.equal(gradeTone("REJECTED"), "ink");
  assert.equal(gradeState(""), "clear");
  assert.equal(gradeState("MAYBE"), "");
  assert.equal(gradeState(null), "clear");
  assert.equal(gradeState({ documentsStatus: "APPROVED" }), "set");
  assert.equal(gradeState({ documentsStatus: "APPROVED", email: "a@b.c" }), "");
  assert.equal(catalogGrade("APPROVED"), true);
  assert.equal(catalogGrade("PENDING"), false);
  assert.equal(wideGrade("NONE"), false);
  assert.equal(wideGrade("PENDING"), true);
  assert.equal(wideGrade("APPROVED"), true);
  assert.equal(gradeStep("NONE"), 1);
  assert.equal(gradeStep("PENDING"), 2);
  assert.equal(gradeStep("REJECTED"), 3);
  assert.equal(gradeStep(""), 0);
  const people = [
    { id: "1", label: "Ada", note: "PENDING" },
    { id: "2", label: "Bea", note: "APPROVED" },
    { id: "3", label: "Cy", note: "APPROVED" },
  ];
  assert.equal(leadingGrade(people), "vault");
  assert.equal(sharedGradeCount(people), 2);
  assert.equal(catalogGradeCount(people), 2);
  assert.match(gradesCsv(people), /vault,2/);
  assert.match(gradeRowsCsv(people, ["2"]), /Bea,APR,vault,gold,3,1,1,1/);

  const keys = Object.keys(ROUND215_COPY.en);
  assert.ok(keys.length >= 120);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND215_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND215_COPY[locale][key as keyof typeof ROUND215_COPY.en], "string");
      assert.ok(ROUND215_COPY[locale][key as keyof typeof ROUND215_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "iflTitle"), ROUND215_COPY.tr.iflTitle);
  assert.equal(crmv4Text("de", "dgrTitle"), ROUND215_COPY.de.dgrTitle);
  assert.equal(crmv4Text("ru", "iflSub"), ROUND215_COPY.ru.iflSub);
  assert.equal(crmv4Text("ar", "dgrSub"), ROUND215_COPY.ar.dgrSub);
  assert.equal(crmv4Text("en", "iflLogo"), "7FX");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-ifl/);
  assert.match(css, /\.c4-dgr-index/);
  assert.match(css, /\.c4-kyc-scriptorium/);
  assert.match(css, /\.c4-dgr-time/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round215.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.equal(viewFile.includes("saleStatus"), false);
  assert.equal(viewFile.includes("retentionStatus"), false);
  assert.equal(viewFile.includes("potentialStatus"), false);
  assert.equal(viewFile.includes("validationStatus"), false);
  assert.equal(viewFile.includes("registrationDate"), false);
  assert.equal(viewFile.includes("birthDate"), false);
  assert.equal(viewFile.includes("lastContactAt"), false);
  assert.equal(viewFile.includes("assigneeId"), false);
  assert.equal(viewFile.includes("lastBrowser"), false);
  assert.equal(viewFile.includes("isResident"), false);
  assert.match(viewFile, /documentsStatus/);
  assert.match(viewFile, /foliosCsv/);
  assert.match(viewFile, /gradesCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /event\.key === "s"/);
  assert.match(viewFile, /event\.key === "g"/);
  assert.match(viewFile, /event\.key === "b"/);
  assert.match(viewFile, /event\.key === "h"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-folios/);
  assert.match(viewFile, /data-grades/);
  assert.match(viewFile, /data-catalog/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestInk/);
  assert.match(viewFile, /c4-dgr-time/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "iflo"/);
  assert.match(app, /view === "dgrd"/);
  assert.match(app, /InkFolios/);
  assert.match(app, /DocumentGrades/);
  const kyc = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round27.tsx"), "utf8");
  assert.match(kyc, /c4-kyc-scriptorium/);
  assert.match(kyc, /c4-kyc-scriptorium-index/);
  assert.match(kyc, /data-logo="mono"/);
  assert.match(kyc, /aria-required=\{false\}/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of used) assert.ok(key in ROUND215_COPY.en, key);
  console.log("crmv4 round215 tests passed");
}

main();
