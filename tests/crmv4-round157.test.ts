/**
 * Conservatory benches and country plates.
 * Run: npx tsx tests/crmv4-round157.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND157_COPY } from "../src/lib/crmv4/copy-round157";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeBench,
  activeBloom,
  activeFold,
  activeGardener,
  activeLight,
  activeRibbon,
  activeShelf,
  activeSpan,
  addBench,
  addBenchView,
  assignedPlate,
  benchArg,
  benchClashIds,
  benchCopy,
  benchCounts,
  benchGap,
  benchBlooms,
  benchGardeners,
  benchLights,
  benchOf,
  benchRibbons,
  benchShare,
  benchText,
  benchTimeline,
  benchesCsv,
  bloomArg,
  bloomOf,
  bulkBenchPinned,
  bulkBenchPressed,
  clashBenchCount,
  courtCounts,
  courtOf,
  dropBenchView,
  editBench,
  foldArg,
  foldOf,
  gardenerArg,
  gardenerLabel,
  leadingFold,
  leadingShelf,
  lightArg,
  lightOf,
  namedFolds,
  namedShelves,
  namedSpans,
  nextBench,
  plateShare,
  platesCsv,
  readBenchViews,
  readBenches,
  readHiddenShelves,
  resetBenches,
  ribbonArg,
  setBenchPinned,
  setBenchPressed,
  setBenchRested,
  shelfArg,
  shelfOf,
  spanArg,
  spanOf,
  stepBenchLight,
  toggleShelf,
  visibleBenches,
  visiblePlateCustomers,
  visibleShelves,
  wingOf,
  benchRibbon,
} from "../src/lib/crmv4/round157";

function main() {
  assert.equal(benchText("  Check\nAda  "), "Check Ada");
  assert.equal(benchText("   "), "");
  assert.equal(benchText("x".repeat(120)).length, 48);
  assert.equal(gardenerLabel("  North  "), "North");
  assert.equal(gardenerLabel("   "), "");
  assert.equal(gardenerLabel("y".repeat(40)).length, 16);
  assert.equal(benchRibbon("  VIP  "), "VIP");
  assert.equal(benchRibbon("   "), "");
  assert.equal(benchRibbon("z".repeat(30)).length, 10);
  assert.equal(benchOf(" 1 "), 1);
  assert.equal(benchOf(1), 1);
  assert.equal(benchOf("01"), 1);
  assert.equal(benchOf("09"), 9);
  assert.equal(benchOf("24"), 24);
  assert.equal(benchOf(24), 24);
  assert.equal(benchOf(""), null);
  assert.equal(benchOf("00"), null);
  assert.equal(benchOf(0), null);
  assert.equal(benchOf("25"), null);
  assert.equal(benchOf(25), null);
  assert.equal(benchOf(-1), null);
  assert.equal(benchOf(1.5), null);
  assert.equal(bloomOf(" ROSE "), "rose");
  assert.equal(bloomOf("lily"), "lily");
  assert.equal(bloomOf("fern"), "fern");
  assert.equal(bloomOf("moss"), "moss");
  assert.equal(bloomOf(""), "blank");
  assert.equal(bloomOf("gold"), "blank");
  assert.equal(lightOf(" SHADE "), "shade");
  assert.equal(lightOf("dappled"), "dappled");
  assert.equal(lightOf("sun"), "sun");
  assert.equal(lightOf(""), "blank");
  assert.equal(lightOf("gold"), "blank");
  assert.equal(courtOf(null), "blank");
  assert.equal(courtOf(1), "north");
  assert.equal(courtOf(6), "north");
  assert.equal(courtOf(7), "east");
  assert.equal(courtOf(12), "east");
  assert.equal(courtOf(13), "south");
  assert.equal(courtOf(18), "south");
  assert.equal(courtOf(19), "west");
  assert.equal(courtOf(24), "west");
  assert.equal(wingOf(null), "blank");
  assert.equal(wingOf(1), "near");
  assert.equal(wingOf(12), "near");
  assert.equal(wingOf(13), "far");
  assert.equal(wingOf(24), "far");
  assert.equal(benchGap(8, 9), 1);
  assert.equal(benchGap(12, 9), -3);
  assert.equal(benchGap(8, 8), 0);
  assert.equal(benchGap(null, 9), null);
  assert.equal(benchGap(8, ""), null);
  assert.equal(benchGap(8, 25), null);
  assert.deepEqual(readBenches([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Check Ada", gardener: "  ", bench: 0, bloom: "gold", ribbon: "  ", light: "gold", pinned: 1, rested: 1, pressed: 1, audit: "nope" }, "nope"]), [
    { id: "2", text: "Check Ada", gardener: "", bench: null, bloom: "", ribbon: "", light: "", pinned: false, rested: false, pressed: false, audit: "" },
  ]);
  assert.equal(readBenches([{ id: "z", text: "One", bench: 1 }])[0].bench, 1);
  assert.equal(readBenches([{ id: "z", text: "One", bench: "09" }])[0].bench, 9);
  const saved = addBench([], { id: "a", text: "Check Ada", gardener: "Nia", bench: 8, bloom: "rose", ribbon: "VIP", light: "shade" });
  assert.equal(saved[0].audit, "save");
  assert.equal(saved[0].bench, 8);
  assert.equal(saved[0].bloom, "rose");
  assert.equal(saved[0].light, "shade");
  assert.equal(addBench(saved, { id: "b", text: "Check Ada" }).length, 1);
  assert.equal(addBench(saved, { id: "a", text: "Other" }).length, 1);
  assert.equal(addBench(saved, { id: "b", text: "   " }).length, 1);
  const raised = stepBenchLight(saved, "a", 1);
  assert.equal(raised[0].light, "dappled");
  assert.equal(raised[0].audit, "raise");
  assert.equal(stepBenchLight(raised, "a", 1)[0].light, "sun");
  assert.equal(stepBenchLight([{ ...saved[0], light: "sun" }], "a", 1)[0].light, "sun");
  assert.equal(stepBenchLight([{ ...saved[0], light: "" }], "a", -1)[0].light, "");
  assert.equal(stepBenchLight([{ ...saved[0], light: "" }], "a", 1)[0].light, "shade");
  assert.equal(setBenchPinned(saved, "a", true)[0].audit, "pin");
  assert.equal(setBenchPinned(saved, "a", false)[0].audit, "unpin");
  assert.equal(setBenchRested(saved, "a", true)[0].rested, true);
  assert.equal(setBenchRested(saved, "a", true)[0].audit, "rest");
  assert.equal(setBenchPressed(saved, "a", true)[0].audit, "press");
  assert.equal(setBenchPressed(saved, "a", false)[0].audit, "unpress");
  assert.equal(editBench(saved, "a", "  ")[0].text, "Check Ada");
  assert.equal(editBench(saved, "a", "Check Bea")[0].audit, "edit");
  const pair = addBench(saved, { id: "b", text: "Check Bea" });
  assert.equal(editBench(pair, "b", "Check Ada")[0].text, "Check Bea");
  assert.equal(bulkBenchPinned(pair, ["a", "b"], true).every((card) => card.pinned), true);
  assert.equal(bulkBenchPressed(pair, ["missing"], true)[0].pressed, false);
  assert.equal(resetBenches().length, 0);
  assert.equal(benchCopy("  Check Ada "), "Check Ada");
  assert.equal(benchCopy(" "), "");
  const mixed = [
    { ...saved[0], id: "open", light: "shade", bench: 4, pinned: true },
    { ...saved[0], id: "held", text: "Held note", rested: true, light: "dappled", bench: 11 },
    { ...saved[0], id: "stowed", text: "Stowed note", pressed: true, rested: true, light: "sun", bench: 2 },
    { ...saved[0], id: "late", text: "Aaa late", light: "shade", bench: 1 },
    { ...saved[0], id: "slack", text: "Slack note", light: "dappled", bench: 1 },
  ];
  assert.equal(visibleBenches(mixed, "open", "late", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleBenches(mixed, "open", "nia", null, null, null, null, null, null, false, false, "").length, 0);
  assert.equal(visibleBenches(mixed, "rested", "", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleBenches(mixed, "pressed", "", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleBenches(mixed, "open", "", null, null, null, null, null, null, true, false, "").every((card) => card.light === "sun"), true);
  assert.equal(visibleBenches(mixed, "open", "", null, null, null, null, null, null, false, true, "8").every((card) => card.light === "shade"), true);
  assert.equal(visibleBenches(mixed, "open", "", null, "rose", null, null, null, null, false, false, "").length, 3);
  assert.equal(visibleBenches(mixed, "open", "", "Nia", "rose", "VIP", "shade", 4, null, false, false, "").length, 1);
  assert.equal(visibleBenches(mixed, "open", "", null, null, null, null, null, "north", false, false, "").length, 3);
  assert.equal(benchTimeline(mixed, "")[0].bench, 1);
  assert.equal(benchTimeline([{ ...saved[0], bench: null }], "").at(-1)?.bench, null);
  const counts = benchCounts(mixed, "8");
  assert.equal(counts.open, 3);
  assert.equal(counts.rested, 1);
  assert.equal(counts.pressed, 1);
  assert.equal(counts.pinned, 1);
  assert.equal(counts.late, 2);
  assert.equal(benchShare(1, 3), 33);
  assert.equal(benchShare(0, 0), 0);
  assert.deepEqual(benchGardeners(mixed), ["Nia"]);
  assert.deepEqual(benchRibbons(mixed), ["VIP"]);
  assert.deepEqual(benchBlooms(mixed), ["rose"]);
  assert.deepEqual(benchLights(mixed), ["shade", "dappled", "sun"]);
  assert.deepEqual(courtCounts(mixed), [4, 1, 0, 0]);
  assert.equal(activeGardener("gone", ["Nia"]), "all");
  assert.equal(activeGardener("blank", ["Nia"]), "blank");
  assert.equal(gardenerArg("blank"), "");
  assert.equal(gardenerArg("all"), null);
  assert.equal(activeBloom("gone", ["rose"]), "all");
  assert.equal(bloomArg("blank"), "blank");
  assert.equal(bloomArg("rose"), "rose");
  assert.equal(bloomArg("gold"), null);
  assert.equal(activeRibbon("gone", ["VIP"]), "all");
  assert.equal(ribbonArg("VIP"), "VIP");
  assert.equal(activeLight("gone", ["shade"]), "all");
  assert.equal(lightArg("shade"), "shade");
  assert.equal(lightArg("blank"), "blank");
  assert.equal(activeBench("north"), "north");
  assert.equal(activeBench("09"), "9");
  assert.equal(activeBench("00"), "all");
  assert.equal(activeBench("25"), "all");
  assert.equal(activeBench("pirate"), "all");
  assert.deepEqual(benchArg("1"), { exact: 1, band: null });
  assert.deepEqual(benchArg("east"), { exact: null, band: "east" });
  assert.deepEqual(benchArg("all"), { exact: null, band: null });
  assert.deepEqual(benchClashIds([
    { ...saved[0], id: "a", bench: 4, text: "Check Ada" },
    { ...saved[0], id: "b", bench: 9, text: "Check Bea" },
  ], "a"), ["b"]);
  assert.deepEqual(benchClashIds([{ ...saved[0], bloom: "", bench: 8 }], "a"), []);
  assert.deepEqual(benchClashIds([{ ...saved[0], ribbon: "" }], "a"), []);
  assert.equal(clashBenchCount([
    { ...saved[0], id: "a", text: "Check Ada" },
    { ...saved[0], id: "b", text: "Check Bea" },
  ]), 2);
  assert.equal(clashBenchCount([{ ...saved[0], ribbon: "" }]), 0);
  assert.equal(nextBench(mixed, "3"), "open");
  assert.equal(nextBench(mixed, "20"), "late");
  assert.equal(nextBench([{ ...saved[0], light: "sun", bench: 4 }], "1"), "");
  assert.equal(nextBench(mixed, ""), "");
  const csv = benchesCsv(saved, "9");
  assert.equal(csv.startsWith("note,gardener,bench,bloom,ribbon,light,court,pinned,rested,pressed,gap,audit\n"), true);
  assert.equal(csv.includes("Check Ada,Nia,8,rose,VIP,shade,east,0,0,0,1,save"), true);
  assert.equal(benchesCsv([], "").includes("note,gardener"), true);
  const view = addBenchView([], { id: "v", name: "North", tray: "open", query: "ada", gardener: "Nia", bloom: "rose", ribbon: "VIP", light: "shade", bench: "north" });
  assert.equal(view.length, 1);
  assert.equal(addBenchView(view, { ...view[0], id: "w" }).length, 1);
  assert.equal(readBenchViews([{ id: "v", name: "  " }]).length, 0);
  assert.equal(dropBenchView(view, "v").length, 0);
  const many = Array.from({ length: 14 }, (_, index) => ({ id: `k${index}`, text: `Note ${index}`, gardener: "", bench: null, bloom: "", ribbon: "", light: "", pinned: false, rested: false, pressed: false, audit: "save" }));
  assert.equal(readBenches(many).length, 12);
  const manyViews = Array.from({ length: 6 }, (_, index) => ({ id: `v${index}`, name: `View ${index}`, tray: "open" as const, query: "", gardener: "all", bloom: "all", ribbon: "all", light: "all", bench: "all" }));
  assert.equal(readBenchViews(manyViews).length, 4);

  assert.equal(assignedPlate(" France "), "France");
  assert.equal(assignedPlate(""), "");
  assert.equal(assignedPlate("x".repeat(80)).length, 48);
  assert.equal(assignedPlate({ lastCountryName: "Germany" }), "Germany");
  assert.equal(assignedPlate({ lastCountryName: "Germany", timezone: "Europe/Berlin" }), "");
  assert.equal(assignedPlate({ lastCountryName: "Germany", language: "de" }), "");
  assert.equal(assignedPlate({ lastCountryName: "Germany", country: "DE" }), "");
  assert.equal(assignedPlate({ lastCountryName: "Germany", name: "Ada" }), "");
  assert.equal(assignedPlate({ lastCountryName: "Germany", email: "a@b.c" }), "");
  assert.equal(assignedPlate({ lastCountryName: "Germany", phone: "1" }), "");
  assert.equal(assignedPlate({ lastCountryName: "Germany", desk: "North" }), "");
  assert.equal(assignedPlate({ lastCountryName: "Germany", address: "1 Road" }), "");
  assert.equal(assignedPlate({ lastCountryName: "Germany", city: "Berlin" }), "");
  assert.equal(assignedPlate({ lastCountryName: "Germany", firstName: "Ada" }), "");
  assert.equal(assignedPlate({ lastCountryName: "Germany", lastName: "North" }), "");
  assert.equal(shelfOf("France"), "alpha");
  assert.equal(shelfOf("Germany"), "beta");
  assert.equal(shelfOf("Norway"), "gamma");
  assert.equal(shelfOf("Turkey"), "delta");
  assert.equal(shelfOf("Österreich"), "other");
  assert.equal(shelfOf("4France"), "");
  assert.equal(shelfOf(""), "");
  assert.equal(spanOf("France"), "short");
  assert.equal(spanOf("Germany"), "mid");
  assert.equal(spanOf("United States"), "long");
  assert.equal(spanOf(""), "");
  assert.equal(spanOf("4abc"), "");
  assert.equal(foldOf("France"), "plain");
  assert.equal(foldOf("United States"), "joined");
  assert.equal(foldOf("Guinea-Bissau"), "joined");
  assert.equal(foldOf("United Arab Emirates"), "stacked");
  assert.equal(foldOf(""), "");
  const rows = [
    { lastCountryName: "France", label: "Ada North" },
    { lastCountryName: "Finland", label: "Bea South" },
    { lastCountryName: "Germany", label: "Ann West" },
    { lastCountryName: "United Arab Emirates", label: "Chris East" },
    { lastCountryName: "United States", label: "Uma" },
    { lastCountryName: "123land", label: "Mark" },
    { lastCountryName: "Norway", label: "West" },
    { lastCountryName: "Österreich", label: "Otto" },
    { lastCountryName: "4ada", label: "Mark" },
    { lastCountryName: "", label: "Blank" },
  ];
  assert.equal(leadingShelf(rows), "alpha");
  assert.equal(leadingFold(rows), "plain");
  assert.equal(plateShare(2, 6), 33);
  assert.equal(plateShare(0, 0), 0);
  assert.deepEqual(namedShelves(rows), ["alpha", "beta", "gamma", "delta", "other"]);
  assert.deepEqual(namedSpans(rows), ["short", "mid", "long"]);
  assert.deepEqual(namedFolds(rows), ["plain", "joined", "stacked"]);
  assert.equal(visiblePlateCustomers(rows, "alpha", null, null, "north").length, 1);
  assert.equal(visiblePlateCustomers(rows, null, "plain", "short", "").length, 2);
  assert.equal(visiblePlateCustomers([{ lastCountryName: "France", label: "North" }], null, null, null, "france").length, 0);
  assert.deepEqual(readHiddenShelves(["ALPHA", "alpha", "9", "mars"], ["alpha", "beta"]), ["alpha"]);
  assert.deepEqual(toggleShelf(["alpha"], "beta", ["alpha", "beta"]), ["alpha", "beta"]);
  assert.deepEqual(toggleShelf(["alpha"], "alpha", ["alpha", "beta"]), []);
  assert.deepEqual(toggleShelf([], "other", ["alpha", "other"]), ["other"]);
  assert.deepEqual(visibleShelves(["alpha", "beta"], ["alpha"], false), ["beta"]);
  assert.deepEqual(visibleShelves(["alpha", "beta"], ["alpha"], true), ["alpha"]);
  assert.equal(activeShelf("gone", ["alpha"]), "all");
  assert.equal(activeShelf("blank", ["alpha"]), "blank");
  assert.equal(shelfArg("alpha"), "alpha");
  assert.equal(shelfArg("blank"), "");
  assert.equal(shelfArg("all"), null);
  assert.equal(activeSpan("gone", ["short"]), "all");
  assert.equal(spanArg("short"), "short");
  assert.equal(spanArg("blank"), "");
  assert.equal(activeFold("gone", ["joined"]), "all");
  assert.equal(foldArg("stacked"), "stacked");
  assert.equal(foldArg("blank"), "");
  const names = platesCsv(rows);
  assert.equal(names.startsWith("kind,mark,count"), true);
  assert.equal(platesCsv([]), "kind,mark,count");
  assert.equal(names.includes("amount"), false);
  assert.equal(names.includes(",alpha,"), true);

  const copy = Object.keys(ROUND157_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND157_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "bnkTitle"), "Conservatory benches");
  assert.equal(crmv4Text("tr", "pltTitle"), ROUND157_COPY.tr.pltTitle);
  assert.equal(crmv4Text("de", "bnkGardener"), ROUND157_COPY.de.bnkGardener);
  assert.equal(crmv4Text("ru", "pltUnmarked"), ROUND157_COPY.ru.pltUnmarked);
  assert.equal(crmv4Text("ar", "bnkNotice"), ROUND157_COPY.ar.bnkNotice);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-bnk/);
  assert.match(css, /\.c4-plt/);
  assert.match(css, /\.c4-pagehead-bench/);
  assert.match(css, /\.c4-rail-bench/);
  assert.match(css, /\.c4-pagehead-quay/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round157.tsx"), "utf8");
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
  assert.match(viewFile, /lastCountryName/);
  assert.match(viewFile, /benchesCsv/);
  assert.match(viewFile, /platesCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-benches/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "bench"/);
  assert.match(app, /view === "plates"/);
  assert.match(app, /c4-pagehead-bench/);
  assert.match(app, /c4-rail-bench/);
  assert.match(app, /c4-pagehead-quay/);
  console.log("crmv4 round157 tests passed");
}

main();
