/**
 * Folio slips and natal months.
 * Run: npx tsx tests/crmv4-round146.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND146_COPY } from "../src/lib/crmv4/copy-round146";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeBand,
  activeDay,
  activeDecade,
  activeFinish,
  activeGeneration,
  activeKeeper,
  activeMonth,
  activeSeason,
  activeSeal,
  activeWing,
  addFolio,
  addFolioView,
  bandArg,
  bandLines,
  bandOf,
  bulkFolioDone,
  bulkFolioPinned,
  dayArg,
  dayBand,
  dayCount,
  dayGap,
  dayQuarter,
  dayQuarterCounts,
  decadeArg,
  decadeLines,
  decadeOf,
  dropFolioView,
  editFolio,
  finishArg,
  finishOf,
  folioClashIds,
  folioCopy,
  folioCounts,
  folioFinishes,
  folioKeepers,
  folioSeals,
  folioShare,
  folioTimeline,
  folioWings,
  foliosCsv,
  folioText,
  generationArg,
  generationLines,
  generationOf,
  keeperArg,
  keeperLabel,
  leadingBand,
  leadingDecade,
  leadingGeneration,
  leadingMonth,
  leadingSeason,
  namedBands,
  namedDecades,
  namedGenerations,
  namedMonths,
  namedSeasons,
  natalLines,
  natalShare,
  natalText,
  natalsCsv,
  nextFolio,
  readFolioViews,
  readFolios,
  readHiddenMonths,
  resetFolios,
  sealArg,
  sealTag,
  seasonArg,
  seasonLines,
  seasonOf,
  setFolioDone,
  setFolioHeld,
  setFolioPinned,
  stepFolioFinish,
  toggleMonth,
  visibleFolios,
  visibleMonths,
  visibleNatalCustomers,
  wingArg,
  wingOf,
} from "../src/lib/crmv4/round146";

const AS_OF = "2026-11-09";

function main() {
  assert.equal(folioText("  Call\nAda  "), "Call Ada");
  assert.equal(folioText("   "), "");
  assert.equal(folioText("x".repeat(120)).length, 96);
  assert.equal(keeperLabel("  North  "), "North");
  assert.equal(keeperLabel("   "), "");
  assert.equal(keeperLabel("y".repeat(40)).length, 20);
  assert.equal(sealTag("  VIP  "), "VIP");
  assert.equal(sealTag("   "), "");
  assert.equal(sealTag("z".repeat(30)).length, 14);
  assert.equal(dayCount(" 1 "), 1);
  assert.equal(dayCount(1), 1);
  assert.equal(dayCount(31), 31);
  assert.equal(dayCount("31"), 31);
  assert.equal(dayCount(""), null);
  assert.equal(dayCount("0"), null);
  assert.equal(dayCount(0), null);
  assert.equal(dayCount("01"), null);
  assert.equal(dayCount(32), null);
  assert.equal(wingOf(" DESK "), "desk");
  assert.equal(wingOf("floor"), "floor");
  assert.equal(wingOf("line"), "line");
  assert.equal(wingOf("field"), "field");
  assert.equal(wingOf(""), "blank");
  assert.equal(wingOf("pit"), "blank");
  assert.equal(finishOf(" CHAMPAGNE "), "champagne");
  assert.equal(finishOf("ivory"), "ivory");
  assert.equal(finishOf("ink"), "ink");
  assert.equal(finishOf(""), "blank");
  assert.equal(finishOf("gold"), "blank");
  assert.equal(dayBand(null), "blank");
  assert.equal(dayBand(1), "opening");
  assert.equal(dayBand(10), "opening");
  assert.equal(dayBand(11), "hinge");
  assert.equal(dayBand(20), "hinge");
  assert.equal(dayBand(21), "close");
  assert.equal(dayBand(31), "close");
  assert.equal(dayQuarter(null), "blank");
  assert.equal(dayQuarter(1), "q1");
  assert.equal(dayQuarter(7), "q1");
  assert.equal(dayQuarter(8), "q2");
  assert.equal(dayQuarter(14), "q2");
  assert.equal(dayQuarter(15), "q3");
  assert.equal(dayQuarter(21), "q3");
  assert.equal(dayQuarter(22), "q4");
  assert.equal(dayQuarter(31), "q4");
  assert.equal(dayGap(1, 4), 3);
  assert.equal(dayGap(31, 1), -30);
  assert.equal(dayGap(2, 2), 0);
  assert.equal(dayGap(null, 3), null);
  assert.equal(dayGap(3, ""), null);
  assert.deepEqual(readFolios([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Call Ada", keeper: "  ", day: 0, wing: "pit", seal: "  ", finish: "gold", pinned: 1, done: 1, held: 1, audit: "nope" }, "nope"]), [
    { id: "2", text: "Call Ada", keeper: "", day: null, wing: "", seal: "", finish: "", pinned: false, done: false, held: false, audit: "" },
  ]);
  assert.equal(readFolios([{ id: "z", text: "One", day: 31 }])[0].day, 31);
  const saved = addFolio([], { id: "a", text: "Call Ada", keeper: "Nia", day: 1, wing: "desk", seal: "VIP", finish: "ivory" });
  assert.equal(saved[0].audit, "save");
  assert.equal(saved[0].day, 1);
  assert.equal(saved[0].wing, "desk");
  assert.equal(saved[0].finish, "ivory");
  assert.equal(addFolio(saved, { id: "b", text: "Call Ada" }).length, 1);
  assert.equal(addFolio(saved, { id: "a", text: "Other" }).length, 1);
  assert.equal(addFolio(saved, { id: "b", text: "   " }).length, 1);
  const raised = stepFolioFinish(saved, "a", 1);
  assert.equal(raised[0].finish, "ink");
  assert.equal(raised[0].audit, "raise");
  assert.equal(stepFolioFinish(raised, "a", 1)[0].finish, "champagne");
  assert.equal(stepFolioFinish([{ ...saved[0], finish: "champagne" }], "a", 1)[0].finish, "champagne");
  assert.equal(stepFolioFinish([{ ...saved[0], finish: "" }], "a", -1)[0].finish, "");
  const pinned = setFolioPinned(saved, "a", true);
  assert.equal(pinned[0].pinned, true);
  assert.equal(pinned[0].audit, "pin");
  assert.equal(setFolioPinned(pinned, "a", false)[0].audit, "unpin");
  const held = setFolioHeld(saved, "a", true);
  assert.equal(held[0].held, true);
  assert.equal(held[0].audit, "hold");
  const done = setFolioDone(saved, "a", true);
  assert.equal(done[0].done, true);
  assert.equal(done[0].audit, "done");
  assert.equal(setFolioDone(done, "a", false)[0].audit, "reopen");
  const edited = editFolio(saved, "a", "Call Bea");
  assert.equal(edited[0].text, "Call Bea");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editFolio(saved, "a", "  ")[0].text, "Call Ada");
  const pair = addFolio(saved, { id: "b", text: "Later", day: 28, wing: "field" });
  assert.equal(editFolio(pair, "b", "Call Ada")[0].text, "Later");
  const bulkPin = bulkFolioPinned(pair, ["b", ""], true);
  assert.equal(bulkPin[0].pinned, true);
  assert.equal(bulkPin[1].pinned, false);
  assert.equal(bulkFolioDone(pair, ["a"], true)[1].done, true);
  assert.deepEqual(resetFolios(), []);
  assert.equal(folioCopy("  Call Ada "), "Call Ada");
  assert.equal(folioCopy(" "), "");
  const shown = visibleFolios(pair, "open", "ada", null, null, null, null, null, null, false, false, 4);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].id, "a");
  assert.equal(visibleFolios(pair, "open", "nia", null, null, null, null, null, null, false, false, 4).length, 0);
  assert.equal(visibleFolios(held, "held", "", null, null, null, null, null, null, false, false, 4).length, 1);
  assert.equal(visibleFolios(done, "open", "", null, null, null, null, null, null, false, false, 4).length, 0);
  assert.equal(visibleFolios(pair, "open", "", "Nia", "desk", "VIP", "ivory", 1, null, false, false, 4).length, 1);
  assert.equal(visibleFolios(pair, "open", "", null, null, null, null, null, "opening", false, false, 4).length, 1);
  assert.equal(visibleFolios(pair, "open", "", null, null, null, null, null, "q4", false, false, 4).length, 1);
  assert.equal(visibleFolios(raised, "open", "", null, null, null, null, null, null, true, false, 4).length, 0);
  assert.equal(visibleFolios(stepFolioFinish(raised, "a", 1), "open", "", null, null, null, null, null, null, true, false, 4).length, 1);
  assert.equal(visibleFolios(pair, "open", "", null, null, null, null, null, null, false, true, 4).length, 1);
  assert.deepEqual(folioTimeline(pair, "").map((card) => card.id), ["a", "b"]);
  assert.deepEqual(folioTimeline(addFolio(pair, { id: "c", text: "Blank" }), "").map((card) => card.day === null).at(-1), true);
  const counts = folioCounts(addFolio(pinned, { id: "b", text: "Later", day: 4 }), 2);
  assert.equal(counts.open, 2);
  assert.equal(counts.pinned, 1);
  assert.equal(counts.late, 1);
  assert.equal(folioShare(1, 4), 25);
  assert.equal(folioShare(0, 0), 0);
  assert.deepEqual(folioKeepers(saved), ["Nia"]);
  assert.deepEqual(folioSeals(saved), ["VIP"]);
  assert.deepEqual(folioWings(pair), ["desk", "field"]);
  assert.deepEqual(folioFinishes(saved), ["ivory"]);
  assert.deepEqual(dayQuarterCounts(pair), [1, 0, 0, 1]);
  assert.equal(activeKeeper("missing", ["Nia"]), "all");
  assert.equal(activeKeeper("blank", ["Nia"]), "blank");
  assert.equal(activeKeeper("Nia", ["Nia"]), "Nia");
  assert.equal(keeperArg("all"), null);
  assert.equal(keeperArg("blank"), "");
  assert.equal(keeperArg("Nia"), "Nia");
  assert.equal(activeWing("missing", ["desk"]), "all");
  assert.equal(activeWing("desk", ["desk"]), "desk");
  assert.equal(wingArg("blank"), "blank");
  assert.equal(wingArg("field"), "field");
  assert.equal(wingArg("nope"), null);
  assert.equal(activeSeal("gone", ["VIP"]), "all");
  assert.equal(activeSeal("VIP", ["VIP"]), "VIP");
  assert.equal(sealArg("blank"), "");
  assert.equal(sealArg("VIP"), "VIP");
  assert.equal(activeFinish("gone", ["ivory"]), "all");
  assert.equal(activeFinish("ink", ["ink"]), "ink");
  assert.equal(finishArg("blank"), "blank");
  assert.equal(finishArg("champagne"), "champagne");
  assert.equal(finishArg("gold"), null);
  assert.equal(activeDay("nope"), "all");
  assert.equal(activeDay("q2"), "q2");
  assert.equal(activeDay("31"), "31");
  assert.equal(activeDay("01"), "all");
  assert.deepEqual(dayArg("opening"), { exact: null, band: "opening" });
  assert.deepEqual(dayArg("8"), { exact: 8, band: null });
  assert.deepEqual(dayArg("all"), { exact: null, band: null });
  const clash = addFolio(pair, { id: "c", text: "Same", day: 1, wing: "desk" });
  assert.deepEqual(folioClashIds(clash, "a"), ["c"]);
  assert.deepEqual(folioClashIds(pair, "b"), []);
  assert.equal(nextFolio(pair, 20), "b");
  assert.equal(nextFolio(pair, 30), "a");
  assert.equal(nextFolio(pair, ""), "");
  const csv = foliosCsv(saved, 4);
  assert.equal(csv.startsWith("note,keeper,day,wing,seal,finish,band,pinned,done,held,gap,audit\n"), true);
  assert.equal(csv.includes("Call Ada"), true);
  assert.equal(csv.includes("amount"), false);
  assert.equal(foliosCsv([], 1), "note,keeper,day,wing,seal,finish,band,pinned,done,held,gap,audit");
  const views = addFolioView([], { id: "v", name: "Morning", tray: "open", query: "ada", keeper: "Nia", wing: "desk", seal: "VIP", finish: "ivory", day: "opening" });
  assert.equal(views[0].day, "opening");
  assert.equal(addFolioView(views, { id: "w", name: "Morning", tray: "open", query: "", keeper: "all", wing: "all", seal: "all", finish: "all", day: "all" }).length, 1);
  assert.equal(dropFolioView(views, "v").length, 0);
  assert.equal(readFolioViews([{ id: "v", name: "  ", tray: "held" }]).length, 0);
  assert.equal(readFolioViews(views)[0].tray, "open");

  assert.equal(natalText("1990-03-15"), "1990-03");
  assert.equal(natalText("1990-03"), "1990-03");
  assert.equal(natalText("1990"), "");
  assert.equal(natalText(1990), "");
  assert.equal(natalText(""), "");
  assert.equal(natalText("1899-01-01"), "");
  assert.equal(natalText("2027-01-01"), "");
  assert.equal(natalText("1990-02-31"), "");
  assert.equal(natalText("1990-13-01"), "");
  assert.equal(natalText({ birthDate: "1990-03-15" }), "1990-03");
  assert.equal(natalText({ registrationDate: "1990-03-15" }), "");
  assert.equal(natalText({ createdAt: "1990-03-15" }), "");
  assert.equal(natalText({ lastSeenAt: "1990-03-15" }), "");
  assert.equal(natalText({ lastLoginAt: "1990-03-15" }), "");
  assert.equal(natalText({ lastContactAt: "1990-03-15" }), "");
  assert.equal(natalText({ birthDate: "1990-03-15", registrationDate: "2024-01-01" }), "");
  assert.equal(natalText(new Date("1990-03-15T00:00:00.000Z")), "1990-03");
  assert.equal(bandOf("1990-03-01", AS_OF), bandOf("1990-03-28", AS_OF));
  assert.equal(bandOf("1990-03-15", AS_OF), "settled");
  assert.equal(bandOf("2000-12-01", AS_OF), "young");
  assert.equal(bandOf("1970-01-01", AS_OF), "senior");
  assert.equal(bandOf("2026-12-01", AS_OF), "");
  assert.equal(bandOf("1996-06-01", AS_OF), "settled");
  assert.equal(bandOf("1996-12-01", AS_OF), "young");
  assert.equal(bandOf(""), "");
  assert.equal(seasonOf("1990-03-15"), "spring");
  assert.equal(seasonOf("1990-12-01"), "winter");
  assert.equal(seasonOf("1990-08-01"), "summer");
  assert.equal(seasonOf("1990-10-01"), "autumn");
  assert.equal(seasonOf("1990"), "");
  assert.equal(decadeOf("1994-01-01"), "90s");
  assert.equal(decadeOf("2004-01-01"), "00s");
  assert.equal(decadeOf("2014-01-01"), "10s");
  assert.equal(decadeOf(""), "");
  assert.equal(generationOf("1945-01-01"), "silent");
  assert.equal(generationOf("1946-01-01"), "boom");
  assert.equal(generationOf("1964-01-01"), "boom");
  assert.equal(generationOf("1965-01-01"), "genx");
  assert.equal(generationOf("1980-01-01"), "genx");
  assert.equal(generationOf("1981-01-01"), "millennial");
  assert.equal(generationOf("1996-01-01"), "millennial");
  assert.equal(generationOf("1997-01-01"), "genz");
  assert.equal(generationOf(""), "");
  const rows = [
    { born: "2016-01-02", label: "Ada" },
    { born: "1990-03-15", label: "Bea" },
    { born: "1940-06-01", label: "Wes" },
    { born: "", label: "No date" },
    { born: { registrationDate: "1990-03-15" }, label: "Blocked" },
  ];
  assert.equal(natalLines(rows, AS_OF).find((line) => !line.mark)?.count, 2);
  assert.equal(natalLines(rows, AS_OF).find((line) => line.mark === "1990-03")?.season, "spring");
  assert.equal(natalLines(rows, AS_OF).find((line) => line.mark === "1990-03")?.generation, "millennial");
  assert.equal(natalLines(rows, AS_OF).find((line) => line.mark === "1940-06")?.band, "senior");
  assert.deepEqual(namedMonths(rows), ["1940-06", "1990-03", "2016-01"]);
  assert.equal(leadingMonth(rows), "1940-06");
  assert.equal(leadingBand(rows, AS_OF), "senior");
  assert.equal(leadingSeason(rows), "spring");
  assert.equal(leadingGeneration(rows), "genz");
  assert.equal(natalShare(2, 5), 40);
  assert.equal(natalShare(0, 0), 0);
  assert.deepEqual(readHiddenMonths(["1990-03", "nope", "1940-06"], ["1990-03"]), ["1990-03"]);
  assert.deepEqual(toggleMonth(["1990-03"], "1990-03", ["1990-03", "1940-06"]), []);
  assert.deepEqual(toggleMonth([], "1940-06", ["1990-03", "1940-06"]), ["1940-06"]);
  assert.deepEqual(visibleMonths(["1990-03", "1940-06"], ["1940-06"], false), ["1990-03"]);
  assert.deepEqual(visibleMonths(["1990-03", "1940-06"], ["1940-06"], true), ["1940-06"]);
  assert.equal(activeMonth("1940-06", ["1990-03"]), "");
  assert.equal(activeMonth("1990-03", ["1990-03"]), "1990-03");
  assert.equal(activeBand("missing", ["young"]), "all");
  assert.equal(activeBand("blank", ["young"]), "blank");
  assert.equal(activeBand("settled", ["settled"]), "settled");
  assert.equal(bandArg("all"), null);
  assert.equal(bandArg("blank"), "");
  assert.equal(bandArg("senior"), "senior");
  assert.equal(bandArg("nope"), null);
  assert.equal(activeSeason("gone", ["winter"]), "all");
  assert.equal(activeSeason("summer", ["summer"]), "summer");
  assert.equal(seasonArg("blank"), "");
  assert.equal(seasonArg("autumn"), "autumn");
  assert.equal(seasonArg("nope"), null);
  assert.equal(activeDecade("gone", ["90s"]), "all");
  assert.equal(activeDecade("90s", ["90s"]), "90s");
  assert.equal(decadeArg("all"), null);
  assert.equal(decadeArg("blank"), "");
  assert.equal(decadeArg("10s"), "10s");
  assert.equal(decadeArg("nope"), null);
  assert.equal(activeGeneration("gone", ["genz"]), "all");
  assert.equal(activeGeneration("millennial", ["millennial"]), "millennial");
  assert.equal(generationArg("blank"), "");
  assert.equal(generationArg("genx"), "genx");
  assert.equal(generationArg("nope"), null);
  const visible = visibleNatalCustomers(rows, "", false, "senior", "summer", "40s", "silent", "wes", AS_OF);
  assert.equal(visible.length, 1);
  assert.equal(visible[0].label, "Wes");
  assert.equal(visibleNatalCustomers(rows, "", true, null, null, null, null, "blocked", AS_OF).length, 1);
  assert.equal(visibleNatalCustomers(rows, "1990-03", false, null, null, null, null, "", AS_OF).length, 1);
  assert.equal(visibleNatalCustomers(rows, "", false, null, "spring", null, null, "", AS_OF).length, 1);
  assert.equal(natalsCsv(rows, AS_OF).startsWith("mark,month,season,decade,generation,band,count\n"), true);
  assert.equal(natalsCsv([]), "mark,month,season,decade,generation,band,count");
  assert.equal(natalsCsv(rows, AS_OF).includes("amount"), false);
  assert.equal(seasonLines(rows).some((line) => line.season === "spring"), true);
  assert.equal(namedBands(rows, AS_OF).includes("senior"), true);
  assert.equal(namedSeasons(rows).includes("winter"), true);
  assert.equal(namedDecades(rows).includes("90s"), true);
  assert.equal(namedGenerations(rows).includes("silent"), true);
  assert.equal(generationLines(rows).some((line) => line.generation === "millennial"), true);
  assert.equal(decadeLines(rows).some((line) => line.decade === "10s"), true);
  assert.equal(bandLines(rows, AS_OF).some((line) => line.band === "young"), true);
  assert.equal(leadingDecade(rows), "10s");

  const copy = Object.keys(ROUND146_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND146_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "folTitle"), "Folio slips");
  assert.equal(crmv4Text("tr", "ntlTitle"), ROUND146_COPY.tr.ntlTitle);
  assert.equal(crmv4Text("de", "folKeeper"), ROUND146_COPY.de.folKeeper);
  assert.equal(crmv4Text("ru", "ntlBlank"), ROUND146_COPY.ru.ntlBlank);
  assert.equal(crmv4Text("ar", "folNotice"), ROUND146_COPY.ar.folNotice);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-fol/);
  assert.match(css, /\.c4-ntl/);
  assert.match(css, /\.c4-pagehead-slip/);
  assert.match(css, /\.c4-rail-slip/);
  assert.match(css, /\.c4-pagehead-interlude/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round146.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("fetch("), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes("currency"), false);
  assert.equal(view.includes("balance"), false);
  assert.equal(view.includes("saleStatus"), false);
  assert.equal(view.includes("retentionStatus"), false);
  assert.equal(view.includes("potentialStatus"), false);
  assert.equal(view.includes("documentsStatus"), false);
  assert.equal(view.includes("accountType"), false);
  assert.equal(view.includes("validationStatus"), false);
  assert.equal(view.includes("registrationDate"), false);
  assert.match(view, /birthDate/);
  assert.match(view, /foliosCsv/);
  assert.match(view, /natalsCsv/);
  assert.match(view, /Escape/);
  assert.match(view, /event\.key !== "\/"/);
  assert.match(view, /event\.key === "a"/);
  assert.match(view, /storedRole/);
  assert.match(view, /data-role/);
  assert.match(view, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(view, /data-folio/);
  assert.match(view, /data-natal/);
  assert.match(view, /data-logo="mono"/);
  assert.match(view, /customers/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "folio"/);
  assert.match(app, /view === "natal"/);
  assert.match(app, /c4-pagehead-slip/);
  assert.match(app, /c4-rail-slip/);
  assert.match(app, /c4-pagehead-interlude/);
  assert.match(app, /c4-rail-interlude/);
  console.log("crmv4 round146 tests passed");
}

main();
