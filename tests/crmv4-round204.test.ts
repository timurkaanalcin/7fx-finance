/**
 * Vestibule benches and agent scripts.
 * Run: TZ=UTC npx tsx tests/crmv4-round204.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND204_COPY } from "../src/lib/crmv4/copy-round204";
import {
  activeBay,
  activeHour,
  activeLamp,
  activeWait,
  addBench,
  addBenchMark,
  addBenchView,
  adjacentBenchCount,
  bayOf,
  benchCounts,
  benchesCsv,
  busiestPorter,
  catalogScript,
  catalogScriptCount,
  clashHourCount,
  cycleCue,
  densityOf,
  editBench,
  editBenchNote,
  fairPorter,
  giltScriptCount,
  hourGap,
  hourOf,
  houseBay,
  lampClashCount,
  lampOf,
  lateBench,
  lateShare,
  leadingScript,
  leadingScriptTone,
  moveFocus,
  nextBench,
  peakHour,
  pinFocused,
  quietHour,
  readBenchViews,
  restOf,
  scriptBand,
  scriptCopy,
  scriptOf,
  scriptRowsCsv,
  scriptState,
  scriptTone,
  scriptsCsv,
  setBenchRest,
  sharedScriptCount,
  soonBench,
  suggestBay,
  suggestPorter,
  suggestWait,
  usedHours,
  visibleBenches,
  visibleScriptCustomers,
  waitOf,
  wideScriptCount,
  windowBenches,
} from "../src/lib/crmv4/round204";

function main() {
  assert.equal(bayOf("  north "), "NORTH");
  assert.equal(bayOf("court"), "COURT");
  assert.equal(bayOf("south"), "SOUTH");
  assert.equal(bayOf("   "), "");
  assert.equal(bayOf("oak"), "");
  assert.equal(hourOf("0"), 0);
  assert.equal(hourOf(0), 0);
  assert.equal(hourOf(11), 11);
  assert.equal(hourOf("11"), 11);
  assert.equal(hourOf("4"), 4);
  assert.equal(hourOf("00"), null);
  assert.equal(hourOf("01"), null);
  assert.equal(hourOf("12"), null);
  assert.equal(hourOf(""), null);
  assert.equal(hourOf(1.5), null);
  assert.equal(lampOf("1"), 1);
  assert.equal(lampOf(3), 3);
  assert.equal(lampOf("9"), 9);
  assert.equal(lampOf("2"), null);
  assert.equal(lampOf("01"), null);
  assert.equal(waitOf("10"), 10);
  assert.equal(waitOf(20), 20);
  assert.equal(waitOf("40"), 40);
  assert.equal(waitOf("0"), null);
  assert.equal(waitOf("010"), null);
  assert.equal(restOf("0"), 0);
  assert.equal(restOf(10), 10);
  assert.equal(restOf("20"), 20);
  assert.equal(restOf("5"), null);
  assert.equal(peakHour(4), true);
  assert.equal(peakHour(5), true);
  assert.equal(peakHour(0), false);
  assert.equal(peakHour(6), false);
  assert.equal(quietHour(0), true);
  assert.equal(quietHour(11), true);
  assert.equal(quietHour(4), false);
  assert.equal(quietHour(5), false);
  assert.equal(hourGap(0, 11), 11);
  assert.equal(hourGap(11, 0), -11);
  assert.equal(hourGap(2, 5), 3);
  assert.equal(hourGap(5, 2), -3);
  assert.equal(hourGap(null, 5), null);
  assert.equal(hourGap(0, ""), null);
  assert.equal(hourGap(0, 12), null);
  assert.equal(activeHour("peak"), "peak");
  assert.equal(activeHour("0"), "0");
  assert.equal(activeHour("99"), "all");
  assert.equal(activeLamp("9"), "9");
  assert.equal(activeLamp("2"), "all");
  assert.equal(activeWait("blank"), "blank");
  assert.equal(activeWait("15"), "all");
  assert.equal(activeBay("nope", ["NORTH"]), "all");
  assert.equal(densityOf("tight"), "tight");
  assert.equal(densityOf("nope"), "roomy");
  assert.equal(moveFocus(0, 3, 1), 1);
  assert.equal(moveFocus(0, 3, -1), 2);
  assert.equal(moveFocus(2, 3, 1), 0);
  assert.equal(moveFocus(1, 0, 1), 0);

  const saved = addBench([], { id: "a", title: "Ada bench", note: "oak leaf", porter: "Nia", hour: "0", bay: "north", cue: "seated", lamp: "9", wait: "10", marks: "1, 2, 3, 4", rest: "0" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].hour, 0);
  assert.equal(saved[0].lamp, 9);
  assert.equal(saved[0].wait, 10);
  assert.equal(saved[0].bay, "NORTH");
  assert.equal(saved[0].note, "oak leaf");
  assert.deepEqual(saved[0].marks, ["1", "2"]);
  assert.equal(saved[0].audit, "save");
  assert.equal(houseBay(saved[0].bay), true);
  assert.equal(houseBay("SOUTH"), false);
  assert.equal(soonBench(saved[0]), true);
  assert.equal(lateBench(saved[0], "3"), true);
  assert.equal(lateBench(saved[0], "2"), false);
  assert.equal(lateBench(saved[0], "1"), false);
  assert.equal(addBench(saved, { id: "b", title: "Ada bench" }).length, 1);
  assert.equal(addBench(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(addBench(saved, { id: "c", title: "   " }).length, 1);
  const capped = Array.from({ length: 8 }, (_, index) => ({ id: `n${index}`, title: `Line ${index}` })).reduce((benches, bench) => addBench(benches, bench), [] as ReturnType<typeof addBench>);
  assert.equal(capped.length, 6);
  assert.equal(capped.some((bench) => bench.title === "Line 0"), false);
  assert.equal(capped.some((bench) => bench.title === "Line 1"), false);
  assert.equal(capped[0].title, "Line 7");

  const cycled = cycleCue(saved, "a");
  assert.equal(cycled[0].cue, "called");
  assert.equal(cycled[0].audit, "cue");
  assert.equal(cycleCue(cycled, "a")[0].cue, "bowed");
  assert.equal(cycleCue(cycleCue(cycled, "a"), "a")[0].cue, "seated");
  const blankCue = addBench([], { id: "z", title: "Blank cue" });
  assert.equal(cycleCue(blankCue, "z")[0].cue, "seated");

  const edited = editBench(saved, "a", "Bea bench");
  assert.equal(edited[0].title, "Bea bench");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editBench(saved, "a", "   ")[0].title, "Ada bench");
  const noted = editBenchNote(saved, "a", "fresh leaf");
  assert.equal(noted[0].note, "fresh leaf");
  assert.equal(editBenchNote(saved, "a", "   ")[0].note, "oak leaf");
  const oneMark = addBench([], { id: "t", title: "Mark bench", marks: "1" });
  const marked = addBenchMark(oneMark, "t", "2");
  assert.deepEqual(marked[0].marks, ["1", "2"]);
  assert.equal(marked[0].audit, "mark");
  assert.equal(addBenchMark(marked, "t", "3")[0].marks.length, 2);
  assert.equal(addBenchMark(oneMark, "t", "gold")[0].marks.length, 1);

  const rested = setBenchRest(saved, "a", 10);
  assert.equal(rested[0].rest, 10);
  assert.equal(rested[0].audit, "rest");
  assert.equal(soonBench(rested[0]), false);
  assert.equal(lateBench(rested[0], "11"), false);
  assert.equal(setBenchRest(saved, "a", 5)[0].rest, 0);
  const pinned = pinFocused(saved, ["a"], 0);
  assert.equal(pinned[0].pinned, true);
  assert.equal(pinned[0].audit, "pin");
  assert.equal(pinFocused(pinned, ["a"], 0)[0].pinned, false);

  const second = addBench(saved, { id: "b", title: "Bea bench", porter: "Ada", hour: "11", bay: "south", cue: "seated", lamp: "9", wait: "20", marks: "1" });
  assert.equal(usedHours(second), 2);
  assert.equal(suggestBay([]), "SOUTH");
  assert.equal(suggestWait([]), 20);
  assert.equal(suggestWait(saved), 20);
  const twoMeasured = addBench(addBench([], { id: "m1", title: "Measured one", wait: "20" }), { id: "m2", title: "Measured two", wait: "20" });
  assert.equal(suggestWait(twoMeasured), 10);
  const splitBays = addBench(addBench([], { id: "n", title: "North bench", bay: "north" }), { id: "s", title: "South bench", bay: "south" });
  assert.equal(suggestBay(splitBays), "COURT");
  assert.equal(suggestPorter([]), "");
  assert.equal(fairPorter(second, "Bea, Ada"), "Bea");
  assert.equal(busiestPorter(second), "Ada");
  assert.equal(nextBench(second, ""), "");
  assert.equal(nextBench(second, "11"), "b");
  const bowed = cycleCue(cycleCue(second, "b"), "b");
  assert.equal(bowed.find((bench) => bench.id === "b")?.cue, "bowed");
  assert.equal(nextBench(bowed, "11"), "a");
  const resting = setBenchRest(second, "b", 20);
  assert.equal(nextBench(resting, "11"), "a");
  const shown = visibleBenches(second, "open", "bea", null, null, null, null, null, null, null, false, false, false, false, false);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].id, "b");
  const bowedOnly = visibleBenches(bowed, "open", "", null, null, null, null, null, null, null, true, false, false, false, false);
  assert.equal(bowedOnly.length, 1);
  assert.equal(bowedOnly[0].id, "b");
  assert.equal(clashHourCount(addBench(second, { id: "c", title: "Cara bench", hour: "0", bay: "north" })), 2);
  assert.equal(lampClashCount(second), 2);
  assert.equal(adjacentBenchCount(addBench(second, { id: "d", title: "Dora bench", hour: "2", bay: "north" })), 2);
  assert.equal(windowBenches(second, "11").some((bench) => bench.id === "b"), true);
  assert.equal(windowBenches(second, "11").some((bench) => bench.id === "a"), false);
  const counts = benchCounts(second, "11");
  assert.equal(counts.open, 2);
  assert.equal(counts.soon, 1);
  assert.equal(counts.late, 1);
  assert.equal(lateShare(second, "11"), 50);
  const csv = benchesCsv(second, "11");
  assert.match(csv, /Ada bench/);
  assert.match(csv, /oak leaf/);
  assert.match(csv, /window/);

  const views = addBenchView([], { id: "v1", name: "Morning", tray: "open", query: "ada", porter: "all", bay: "NORTH", cue: "seated", hour: "peak", lamp: "9", wait: "10" });
  assert.equal(views.length, 1);
  assert.equal(readBenchViews(views)[0].hour, "peak");
  assert.equal(addBenchView(views, { id: "v1", name: "Other", tray: "open", query: "", porter: "all", bay: "all", cue: "all", hour: "all", lamp: "all", wait: "all" }).length, 1);
  const fullViews = ["One", "Two", "Three", "Four", "Five"].reduce((rows, name, index) => addBenchView(rows, { id: `v${index}`, name, tray: "open", query: "", porter: "all", bay: "all", cue: "all", hour: "all", lamp: "all", wait: "all" }), [] as ReturnType<typeof addBenchView>);
  assert.equal(fullViews.length, 4);
  assert.equal(fullViews.some((view) => view.name === "One"), false);

  assert.equal(scriptOf("Chrome/120"), "C1");
  assert.equal(scriptBand("Chrome/120"), "kit");
  assert.equal(scriptTone("Chrome/120"), "gilt");
  assert.equal(scriptOf("Firefox/115"), "F1");
  assert.equal(scriptTone("Firefox/115"), "ink");
  assert.equal(scriptOf("Safari/605"), "S6");
  assert.equal(scriptTone("Safari/605"), "ivory");
  assert.equal(scriptOf("Edg/120"), "E1");
  assert.equal(scriptTone("Mozilla/5.0 Chrome/120 Edg/120"), "plain");
  assert.equal(scriptBand("Mozilla/5.0 (iPhone; CPU) Mobile/15E148"), "palm");
  assert.equal(scriptOf("Mozilla/5.0 (iPhone; CPU) Mobile/15E148"), "M1");
  assert.equal(scriptBand("Googlebot/2.1"), "web");
  assert.equal(scriptOf("Googlebot/2.1"), "G2");
  assert.equal(scriptOf("CRM Desk"), "CK");
  assert.equal(scriptBand("CRM Desk"), "plain");
  assert.equal(scriptTone("CRM Desk"), "plain");
  assert.equal(catalogScript("CRM Desk"), true);
  assert.equal(catalogScript("crm   desk"), true);
  assert.equal(scriptOf("7FX Shell"), "7L");
  assert.equal(catalogScript("7FX Shell"), true);
  assert.equal(scriptOf("Ivory Browser"), "IR");
  assert.equal(catalogScript("Ivory Browser"), true);
  assert.equal(catalogScript("Chrome/120"), false);
  assert.equal(scriptState({ lastUserAgent: null }), "clear");
  assert.equal(scriptState({ lastUserAgent: "" }), "clear");
  assert.equal(scriptState({ lastUserAgent: 4 }), "");
  assert.equal(scriptState({ lastUserAgent: "CRM Desk", balance: 1 }), "");
  assert.equal(scriptState({ name: "Ada" }), "");
  assert.equal(scriptState("CRM Desk"), "set");
  assert.equal(scriptCopy({ lastUserAgent: "  CRM Desk  " }), "CRM Desk");
  const wide = "A".repeat(41);
  assert.equal(wide.length > 40, true);
  assert.equal(scriptBand(wide), "plain");
  const rows = [
    { id: "1", label: "Ada", note: { lastUserAgent: "CRM Desk" } },
    { id: "2", label: "Bea", note: { lastUserAgent: "CRM Desk" } },
    { id: "3", label: "Cara", note: { lastUserAgent: "Chrome/120" } },
    { id: "4", label: "Dana", note: { lastUserAgent: wide } },
    { id: "5", label: "Eve", note: { lastUserAgent: null } },
  ];
  assert.equal(catalogScriptCount(rows), 2);
  assert.equal(giltScriptCount(rows), 1);
  assert.equal(wideScriptCount(rows), 1);
  assert.equal(sharedScriptCount(rows), 2);
  assert.equal(leadingScript(rows), "plain");
  assert.equal(leadingScriptTone([{ id: "a", note: "Chrome/1" }, { id: "b", note: "Firefox/1" }]), "gilt");
  const giltOnly = visibleScriptCustomers(rows, null, null, "", "all", [], "gilt");
  assert.equal(giltOnly.length, 1);
  assert.equal(giltOnly[0].id, "3");
  const catalogOnly = visibleScriptCustomers(rows, "plain", null, "ada", "all", [], "catalog");
  assert.equal(catalogOnly.length, 1);
  assert.equal(catalogOnly[0].id, "1");
  const sheet = scriptsCsv(rows);
  assert.match(sheet, /band,plain,3/);
  assert.match(sheet, /catalog,catalog,2/);
  const rowSheet = scriptRowsCsv(rows, ["1"]);
  assert.match(rowSheet, /Ada,CK,plain,plain,1,0,1/);
  assert.match(rowSheet, /Eve,,blank,,0,0,0/);

  const keys = Object.keys(ROUND204_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND204_COPY[locale]).sort(), keys);
    for (const key of keys) {
      assert.equal(typeof ROUND204_COPY[locale][key as keyof typeof ROUND204_COPY.en], "string");
      assert.ok(ROUND204_COPY[locale][key as keyof typeof ROUND204_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "vnbTitle"), ROUND204_COPY.tr.vnbTitle);
  assert.equal(crmv4Text("de", "agsTitle"), ROUND204_COPY.de.agsTitle);
  assert.equal(crmv4Text("ru", "vnbSub"), ROUND204_COPY.ru.vnbSub);
  assert.equal(crmv4Text("ar", "agsSub"), ROUND204_COPY.ar.agsSub);
  assert.equal(crmv4Text("en", "vnbLogo"), "7FX");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-vnb/);
  assert.match(css, /\.c4-ags-index/);
  assert.match(css, /\.c4-book-vestibule/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round204.tsx"), "utf8");
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
  assert.match(viewFile, /lastUserAgent/);
  assert.match(viewFile, /benchesCsv/);
  assert.match(viewFile, /scriptsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /event\.key === "b"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-benches/);
  assert.match(viewFile, /data-scripts/);
  assert.match(viewFile, /data-catalog/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestBay/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "vstb"/);
  assert.match(app, /view === "agsc"/);
  assert.match(app, /VestibuleBenches/);
  assert.match(app, /AgentScripts/);
  assert.match(app, /c4-pagehead-vestibule/);
  assert.match(app, /c4-rail-vestibule/);
  const positions = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Positions.tsx"), "utf8");
  assert.match(positions, /c4-book-vestibule/);
  console.log("crmv4 round204 tests passed");
}

main();
