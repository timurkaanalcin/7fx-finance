/**
 * Reading lamps and letter crests.
 * Run: TZ=UTC npx tsx tests/crmv4-round206.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND206_COPY } from "../src/lib/crmv4/copy-round206";
import {
  activeHour,
  activeSpan,
  activeWick,
  addLamp,
  addLampTag,
  alcoveOf,
  addLampView,
  adjacentLampCount,
  busiestReader,
  catalogLetter,
  catalogLetterCount,
  clashHourCount,
  cycleFlame,
  densityOf,
  editLamp,
  editLampNote,
  fairReader,
  giltLetterCount,
  hourGap,
  hourOf,
  houseAlcove,
  lateLamp,
  lampsCsv,
  lateShare,
  leadingLetter,
  leadingLetterTone,
  letterBand,
  letterOf,
  letterRowsCsv,
  letterState,
  letterTone,
  lettersCsv,
  moveFocus,
  nextLamp,
  peakHour,
  quietHour,
  readLampViews,
  setLampShade,
  shadeOf,
  sharedLetterCount,
  soonLamp,
  spanOf,
  suggestAlcove,
  suggestReader,
  suggestSpan,
  usedHours,
  visibleLamps,
  visibleLetterCustomers,
  wickClashCount,
  wickOf,
  wideLetterCount,
  windowLamps,
} from "../src/lib/crmv4/round206";

function main() {
  assert.equal(alcoveOf("  ink "), "INK");
  assert.equal(alcoveOf("ivory"), "IVORY");
  assert.equal(alcoveOf("graphite"), "GRAPHITE");
  assert.equal(alcoveOf("   "), "");
  assert.equal(alcoveOf("oak"), "");
  assert.equal(hourOf("1"), 1);
  assert.equal(hourOf(1), 1);
  assert.equal(hourOf(9), 9);
  assert.equal(hourOf("9"), 9);
  assert.equal(hourOf("0"), null);
  assert.equal(hourOf(0), null);
  assert.equal(hourOf("01"), null);
  assert.equal(hourOf("10"), null);
  assert.equal(hourOf("99"), null);
  assert.equal(hourOf(""), null);
  assert.equal(hourOf(1.5), null);
  assert.equal(wickOf("3"), 3);
  assert.equal(wickOf(6), 6);
  assert.equal(wickOf("9"), 9);
  assert.equal(wickOf("4"), null);
  assert.equal(wickOf("03"), null);
  assert.equal(spanOf("10"), 10);
  assert.equal(spanOf(25), 25);
  assert.equal(spanOf("50"), 50);
  assert.equal(spanOf("0"), null);
  assert.equal(spanOf("010"), null);
  assert.equal(shadeOf("0"), 0);
  assert.equal(shadeOf(4), 4);
  assert.equal(shadeOf("12"), 12);
  assert.equal(shadeOf("8"), null);
  assert.equal(peakHour(4), true);
  assert.equal(peakHour(5), true);
  assert.equal(peakHour(1), false);
  assert.equal(peakHour(6), false);
  assert.equal(quietHour(1), true);
  assert.equal(quietHour(9), true);
  assert.equal(quietHour(4), false);
  assert.equal(quietHour(5), false);
  assert.equal(hourGap(1, 9), 8);
  assert.equal(hourGap(9, 1), -8);
  assert.equal(hourGap(2, 5), 3);
  assert.equal(hourGap(5, 2), -3);
  assert.equal(hourGap(null, 5), null);
  assert.equal(hourGap(1, ""), null);
  assert.equal(hourGap(1, 0), null);
  assert.equal(activeHour("peak"), "peak");
  assert.equal(activeHour("1"), "1");
  assert.equal(activeHour("99"), "all");
  assert.equal(activeWick("9"), "9");
  assert.equal(activeWick("4"), "all");
  assert.equal(activeSpan("blank"), "blank");
  assert.equal(activeSpan("12"), "all");
  assert.equal(densityOf("tight"), "tight");
  assert.equal(densityOf("nope"), "roomy");
  assert.equal(moveFocus(0, 3, 1), 1);
  assert.equal(moveFocus(0, 3, -1), 2);
  assert.equal(moveFocus(2, 3, 1), 0);
  assert.equal(moveFocus(1, 0, 1), 0);

  const saved = addLamp([], { id: "a", title: "Ada lamp", note: "ink leaf", reader: "Nia", hour: "1", alcove: "ink", flame: "steady", wick: "9", span: "10", tags: "g, h, i, j, k", shade: "0" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].hour, 1);
  assert.equal(saved[0].wick, 9);
  assert.equal(saved[0].span, 10);
  assert.equal(saved[0].alcove, "INK");
  assert.equal(saved[0].note, "ink leaf");
  assert.deepEqual(saved[0].tags, ["g", "h", "i", "j"]);
  assert.equal(saved[0].audit, "save");
  assert.equal(houseAlcove(saved[0].alcove), true);
  assert.equal(houseAlcove("GRAPHITE"), false);
  assert.equal(soonLamp(saved[0]), true);
  assert.equal(lateLamp(saved[0], "4"), true);
  assert.equal(lateLamp(saved[0], "3"), false);
  assert.equal(lateLamp(saved[0], "1"), false);
  assert.equal(addLamp(saved, { id: "b", title: "Ada lamp" }).length, 1);
  assert.equal(addLamp(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(addLamp(saved, { id: "c", title: "   " }).length, 1);
  const capped = Array.from({ length: 10 }, (_, index) => ({ id: `n${index}`, title: `Line ${index}` })).reduce((lamps, lamp) => addLamp(lamps, lamp), [] as ReturnType<typeof addLamp>);
  assert.equal(capped.length, 8);
  assert.equal(capped.some((lamp) => lamp.title === "Line 0"), false);
  assert.equal(capped.some((lamp) => lamp.title === "Line 9"), true);

  const edited = editLamp(saved, "a", "Ada leaf");
  assert.equal(edited[0].title, "Ada leaf");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editLamp(edited, "a", "   ")[0].title, "Ada leaf");
  const noted = editLampNote(edited, "a", "ivory page");
  assert.equal(noted[0].note, "ivory page");
  const tagged = addLampTag(noted, "a", "k");
  assert.deepEqual(tagged[0].tags, ["g", "h", "i", "j"]);
  const flamed = cycleFlame(saved, "a");
  assert.equal(flamed[0].flame, "bright");
  assert.equal(flamed[0].audit, "flame");
  const shaded = setLampShade(saved, "a", 4);
  assert.equal(shaded[0].shade, 4);
  assert.equal(soonLamp(shaded[0]), false);
  assert.equal(lateLamp(shaded[0], "9"), false);

  const second = addLamp(saved, { id: "b", title: "Bea lamp", reader: "Nia", hour: "4", alcove: "ink", flame: "bright", wick: "9", span: "25" });
  const third = addLamp(second, { id: "c", title: "Cal lamp", reader: "Ian", hour: "7", alcove: "graphite", flame: "dim", wick: "3", span: "50", shade: "4" });
  const held = third.map((lamp) => lamp.id === "c" ? { ...lamp, held: true } : lamp);
  const open = visibleLamps(held, "open", "", null, null, null, null, null, null, null, false, false, false, false, false);
  assert.equal(open.length, 2);
  const found = visibleLamps(held, "open", "ink", null, null, null, null, null, null, null, false, false, false, false, false);
  assert.equal(found.length, 1);
  assert.equal(found[0].id, "a");
  const ink = visibleLamps(held, "open", "", null, "INK", null, null, null, null, null, false, false, false, false, false);
  assert.equal(ink.length, 2);
  const bright = visibleLamps(held, "open", "", null, null, null, null, null, null, null, true, false, false, false, false);
  assert.equal(bright.length, 1);
  assert.equal(bright[0].id, "b");
  const peak = visibleLamps(held, "open", "", null, null, null, null, "peak", null, null, false, false, false, false, false);
  assert.equal(peak.length, 1);
  assert.equal(peak[0].id, "b");
  const house = visibleLamps(held, "open", "", null, null, null, null, null, null, null, false, false, true, false, false);
  assert.deepEqual(house.map((lamp) => lamp.id).sort(), ["a", "b"]);
  const quiet = visibleLamps(third, "open", "", null, null, null, null, null, null, null, false, false, false, true, false);
  assert.equal(quiet.length, 1);
  assert.equal(quiet[0].id, "a");
  const awake = visibleLamps(third, "open", "", null, null, null, null, null, null, null, false, false, false, false, true);
  assert.equal(awake.some((lamp) => lamp.id === "c"), false);
  const countsHour = "6";
  assert.equal(lateLamp(saved[0], countsHour), true);
  assert.equal(lateShare(third, countsHour), 33);
  assert.equal(usedHours(third), 3);
  assert.equal(clashHourCount(second), 0);
  const clash = addLamp(second, { id: "d", title: "Dee lamp", hour: "4", alcove: "ink", wick: "9" });
  assert.equal(clashHourCount(clash), 2);
  assert.equal(wickClashCount(clash), 3);
  assert.equal(adjacentLampCount(second), 0);
  const neighbors = addLamp(saved, { id: "b", title: "Bea lamp", hour: "3", alcove: "ink" });
  assert.equal(adjacentLampCount(neighbors), 2);
  assert.equal(suggestAlcove([]), "GRAPHITE");
  const loaded = addLamp(addLamp([], { id: "g", title: "Graph lamp", alcove: "graphite" }), { id: "v", title: "Ivory lamp", alcove: "ivory" });
  assert.equal(suggestAlcove(loaded), "INK");
  assert.equal(suggestSpan([]), 25);
  assert.equal(suggestSpan(second), 50);
  assert.equal(suggestReader(second), "Nia");
  assert.equal(fairReader(second, "Ian, Nia"), "Ian");
  assert.equal(fairReader(second, ""), "Nia");
  assert.equal(busiestReader(second), "Nia");
  assert.equal(nextLamp(second, "2"), "b");
  assert.equal(nextLamp(second, "9"), "a");
  const windowRows = windowLamps(second, "2");
  assert.equal(windowRows.length, 2);
  const sheet = lampsCsv(saved, "4");
  assert.match(sheet, /Ada lamp,Nia,1,INK,steady,9,10,g h i j,0,0,0,0,3,1,1,1,0,ink leaf,save/);
  const views = addLampView([], { id: "v", name: "Peak ink", tray: "open", query: "ada", reader: "Nia", alcove: "ink", flame: "steady", hour: "peak", wick: "9", span: "10" });
  assert.equal(readLampViews(views)[0].alcove, "INK");
  assert.equal(addLampView(views, { id: "v2", name: "Peak ink", tray: "open", query: "", reader: "all", alcove: "all", flame: "all", hour: "all", wick: "all", span: "all" }).length, 1);

  const rows = [
    { id: "1", label: "Ada", note: { email: "ada@7fx.com" } },
    { id: "2", label: "Bea", note: { email: "bea@desk.net" } },
    { id: "3", label: "Cal", note: { email: "cal@house.org" } },
    { id: "4", label: "Dee", note: { email: "alexandra@mail.com" } },
    { id: "5", label: "Eve", note: { email: null } },
    { id: "6", label: "Fay", note: { email: "ada@7fx.com", balance: 1 } },
    { id: "7", label: "Gus", note: "ab" },
  ];
  assert.equal(letterOf(rows[0].note), "AF");
  assert.equal(letterBand(rows[0].note), "brief");
  assert.equal(letterTone(rows[0].note), "gilt");
  assert.equal(catalogLetter(rows[0].note), true);
  assert.equal(letterOf(rows[1].note), "BD");
  assert.equal(letterTone(rows[1].note), "ink");
  assert.equal(letterOf(rows[2].note), "CH");
  assert.equal(letterTone(rows[2].note), "ivory");
  assert.equal(letterOf(rows[3].note), "AM");
  assert.equal(letterBand(rows[3].note), "long");
  assert.equal(letterTone(rows[3].note), "gilt");
  assert.equal(letterOf("ab"), "AB");
  assert.equal(letterBand("ab"), "plain");
  assert.equal(letterTone("ab"), "plain");
  assert.equal(letterOf("a"), "A");
  assert.equal(letterOf("123"), "");
  assert.equal(letterState(rows[4].note), "clear");
  assert.equal(letterState(rows[5].note), "");
  assert.equal(letterState({}), "");
  assert.equal(catalogLetterCount(rows), 3);
  assert.equal(wideLetterCount(rows), 1);
  assert.equal(giltLetterCount(rows), 2);
  assert.equal(sharedLetterCount([{ id: "a", note: "ada@7fx.com" }, { id: "b", note: "nia@7fx.com" }]), 2);
  assert.equal(leadingLetter(rows), "brief");
  assert.equal(leadingLetterTone([{ id: "a", note: "ada@7fx.com" }, { id: "b", note: "bea@desk.net" }]), "gilt");
  const giltOnly = visibleLetterCustomers(rows, null, null, "", "all", [], "gilt");
  assert.equal(giltOnly.length, 2);
  const catalogOnly = visibleLetterCustomers(rows, "brief", null, "ada", "all", [], "catalog");
  assert.equal(catalogOnly.length, 1);
  assert.equal(catalogOnly[0].id, "1");
  const countSheet = lettersCsv(rows);
  assert.match(countSheet, /band,brief,3/);
  assert.match(countSheet, /catalog,catalog,3/);
  assert.match(countSheet, /wide,wide,1/);
  const rowSheet = letterRowsCsv(rows, ["1"]);
  assert.match(rowSheet, /Ada,AF,brief,gilt,1,0,1/);
  assert.match(rowSheet, /Eve,,blank,,0,0,0/);
  assert.match(rowSheet, /Fay,,,,0,0,0/);

  const keys = Object.keys(ROUND206_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND206_COPY[locale]).sort(), keys);
    for (const key of keys) {
      assert.equal(typeof ROUND206_COPY[locale][key as keyof typeof ROUND206_COPY.en], "string");
      assert.ok(ROUND206_COPY[locale][key as keyof typeof ROUND206_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "rdlTitle"), ROUND206_COPY.tr.rdlTitle);
  assert.equal(crmv4Text("de", "ltrTitle"), ROUND206_COPY.de.ltrTitle);
  assert.equal(crmv4Text("ru", "rdlSub"), ROUND206_COPY.ru.rdlSub);
  assert.equal(crmv4Text("ar", "ltrSub"), ROUND206_COPY.ar.ltrSub);
  assert.equal(crmv4Text("en", "rdlLogo"), "7FX");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-rdl/);
  assert.match(css, /\.c4-ltr-index/);
  assert.match(css, /\.c4-support-reading/);
  assert.match(css, /\.c4-pagehead-reading/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round206.tsx"), "utf8");
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
  assert.match(viewFile, /email/);
  assert.match(viewFile, /lampsCsv/);
  assert.match(viewFile, /lettersCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /event\.key === "s"/);
  assert.match(viewFile, /event\.key === "g"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-lamps/);
  assert.match(viewFile, /data-letters/);
  assert.match(viewFile, /data-catalog/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestAlcove/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "rdlm"/);
  assert.match(app, /view === "ltrc"/);
  assert.match(app, /ReadingLamps/);
  assert.match(app, /LetterCrests/);
  assert.match(app, /c4-pagehead-reading/);
  assert.match(app, /c4-rail-reading/);
  const support = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Support.tsx"), "utf8");
  assert.match(support, /c4-support-reading/);
  console.log("crmv4 round206 tests passed");
}

main();
