/**
 * Stack slips and addresses.
 * Run: npx tsx tests/crmv4-round141.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND141_COPY } from "../src/lib/crmv4/copy-round141";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeAddress,
  activeAddressInitial,
  activeAddressKind,
  activeAisle,
  activeBay,
  activeReader,
  activeRibbon,
  addSlip,
  addSlipView,
  addressInitialArg,
  addressInitialOf,
  addressKindArg,
  addressKindLines,
  addressKindOf,
  addressShare,
  addressText,
  addressesCsv,
  aisleArg,
  bayArg,
  bayBand,
  bayCount,
  bayCounts,
  bayGap,
  bayGroup,
  bulkSlipLoaned,
  bulkSlipReturned,
  dropSlipView,
  editSlip,
  leadingAddress,
  leadingAddressInitial,
  leadingAddressKind,
  namedAddressInitials,
  namedAddressKinds,
  namedAddresses,
  nextSlip,
  readerArg,
  readerLabel,
  readHiddenAddresses,
  readSlipViews,
  readSlips,
  resetSlips,
  ribbonArg,
  ribbonTag,
  setSlipLoaned,
  setSlipReserved,
  setSlipReturned,
  shelfLabel,
  slipAisles,
  slipClashIds,
  slipCopy,
  slipCounts,
  slipReaders,
  slipRibbons,
  slipShare,
  slipText,
  slipTimeline,
  slipsCsv,
  stepSlipRank,
  toggleAddress,
  visibleAddressCustomers,
  visibleAddresses,
  visibleSlips,
  aisleOf,
} from "../src/lib/crmv4/round141";

function main() {
  assert.equal(slipText("  Call\nAda  "), "Call Ada");
  assert.equal(slipText("   "), "");
  assert.equal(slipText("x".repeat(120)).length, 80);
  assert.equal(readerLabel("  North  "), "North");
  assert.equal(readerLabel("   "), "");
  assert.equal(readerLabel("y".repeat(40)).length, 18);
  assert.equal(ribbonTag("  VIP  "), "VIP");
  assert.equal(ribbonTag("   "), "");
  assert.equal(ribbonTag("z".repeat(30)).length, 14);
  assert.equal(shelfLabel("  12A  "), "12A");
  assert.equal(shelfLabel("   "), "");
  assert.equal(shelfLabel("s".repeat(20)).length, 8);
  assert.equal(bayCount(" 4 "), 4);
  assert.equal(bayCount(12), 12);
  assert.equal(bayCount(1), 1);
  assert.equal(bayCount(0), 0);
  assert.equal(bayCount(13), 0);
  assert.equal(bayCount(""), 0);
  assert.equal(bayCount("02"), 0);
  assert.equal(aisleOf(" MAPLE "), "maple");
  assert.equal(aisleOf("oak"), "oak");
  assert.equal(aisleOf("walnut"), "walnut");
  assert.equal(aisleOf("ebony"), "ebony");
  assert.equal(aisleOf(""), "blank");
  assert.equal(aisleOf("up"), "blank");
  assert.equal(bayBand(0), "blank");
  assert.equal(bayBand(1), "low");
  assert.equal(bayBand(4), "low");
  assert.equal(bayBand(5), "mid");
  assert.equal(bayBand(8), "mid");
  assert.equal(bayBand(9), "high");
  assert.equal(bayBand(12), "high");
  assert.equal(bayGroup(0), "blank");
  assert.equal(bayGroup(1), "g1");
  assert.equal(bayGroup(3), "g1");
  assert.equal(bayGroup(4), "g2");
  assert.equal(bayGroup(12), "g4");
  assert.equal(bayGap(3, 8), 5);
  assert.equal(bayGap(8, 3), -5);
  assert.equal(bayGap(3, 3), 0);
  assert.equal(bayGap(0, 3), null);
  assert.equal(bayGap(3, ""), null);
  assert.deepEqual(readSlips([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Call Ada", reader: "  ", bay: 13, aisle: "up", shelf: "  ", ribbon: "  ", rank: 3, loaned: 1, returned: 1, reserved: 1, audit: "nope" }, "nope"]), [
    { id: "2", text: "Call Ada", reader: "", bay: 0, aisle: "", shelf: "", ribbon: "", rank: 0, loaned: false, returned: false, reserved: false, audit: "" },
  ]);
  const saved = addSlip([], { id: "a", text: " Call Ada ", reader: " North ", bay: "4", aisle: " Maple ", shelf: " 12A ", ribbon: " VIP " });
  assert.deepEqual(saved, [{ id: "a", text: "Call Ada", reader: "North", bay: 4, aisle: "maple", shelf: "12A", ribbon: "VIP", rank: 0, loaned: false, returned: false, reserved: false, audit: "save" }]);
  assert.equal(addSlip(saved, { id: "b", text: "  " }).length, 1);
  assert.equal(addSlip(saved, { id: "c", text: "Call Ada" }).length, 1);
  assert.equal(addSlip(saved, { id: "a", text: "Other note" }).length, 1);
  const raised = stepSlipRank(saved, "a", 1);
  assert.equal(raised[0].rank, 1);
  assert.equal(raised[0].audit, "raise");
  const first = stepSlipRank(raised, "a", 1);
  assert.equal(first[0].rank, 2);
  assert.equal(stepSlipRank(first, "a", 1)[0].audit, "raise");
  const lowered = stepSlipRank(first, "a", -1);
  assert.equal(lowered[0].rank, 1);
  assert.equal(lowered[0].audit, "lower");
  assert.equal(stepSlipRank([{ ...saved[0], rank: 0 }], "a", -1)[0].audit, "save");
  const loaned = setSlipLoaned(first, "a", true);
  assert.equal(loaned[0].loaned, true);
  assert.equal(loaned[0].audit, "loan");
  const returned = setSlipReturned(loaned, "a", true);
  assert.equal(returned[0].returned, true);
  assert.equal(returned[0].audit, "return");
  const reserved = setSlipReserved(returned, "a", true);
  assert.equal(reserved[0].reserved, true);
  assert.equal(reserved[0].audit, "reserve");
  const waiting = setSlipReserved(setSlipReturned(setSlipLoaned(reserved, "a", false), "a", false), "a", false);
  assert.equal(waiting[0].reserved, false);
  assert.equal(waiting[0].returned, false);
  assert.equal(waiting[0].loaned, false);
  assert.equal(waiting[0].audit, "release");
  assert.equal(editSlip(saved, "a", "  ")[0].text, "Call Ada");
  assert.equal(editSlip(saved, "a", "Call Ada")[0].audit, "save");
  const second = addSlip(saved, { id: "b", text: "Other note", reader: "South", bay: 11, aisle: "ebony", shelf: "9B", ribbon: "Press" });
  assert.equal(editSlip(second, "a", "Other note").find((slip) => slip.id === "a")?.text, "Call Ada");
  assert.equal(editSlip(second, "a", "Fresh note").find((slip) => slip.id === "a")?.text, "Fresh note");
  assert.equal(editSlip(second, "a", "Fresh note").find((slip) => slip.id === "a")?.audit, "edit");
  const bulk = bulkSlipLoaned(second, ["a"], true);
  assert.equal(bulk.find((slip) => slip.id === "a")?.loaned, true);
  assert.equal(bulk.find((slip) => slip.id === "b")?.loaned, false);
  const done = bulkSlipReturned(bulk, ["b"], true);
  assert.equal(done.find((slip) => slip.id === "b")?.returned, true);
  assert.deepEqual(resetSlips(), []);
  assert.equal(slipCopy("  Call Ada "), "Call Ada");
  assert.equal(slipCopy("   "), "");
  assert.equal(visibleSlips(second, "wait", "ada", null, null, null, null, null, false, false, "").map((slip) => slip.id).join(","), "a");
  assert.equal(visibleSlips(second, "wait", "south", null, null, null, null, null, false, false, "").length, 0);
  assert.equal(visibleSlips(loaned, "loan", "", null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleSlips(returned, "loan", "", null, null, null, null, null, false, false, "").length, 0);
  assert.equal(visibleSlips(returned, "back", "", null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleSlips(second, "wait", "", "North", null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleSlips(second, "wait", "", null, "ebony", null, null, null, false, false, "").length, 1);
  assert.equal(visibleSlips(second, "wait", "", null, null, null, 11, null, false, false, "").length, 1);
  assert.equal(visibleSlips(second, "wait", "", null, null, null, null, "high", false, false, "").length, 1);
  assert.equal(visibleSlips(first, "wait", "", null, null, null, null, null, true, false, "").length, 1);
  assert.equal(visibleSlips(saved, "wait", "", null, null, null, null, null, true, false, "").length, 0);
  const passed = addSlip([], { id: "p", text: "Late", bay: 2 });
  assert.equal(visibleSlips(passed, "wait", "", null, null, null, null, null, false, true, "6").length, 1);
  assert.equal(visibleSlips(passed, "wait", "", null, null, null, null, null, false, true, "").length, 0);
  assert.equal(slipsCsv([{ id: "a", text: 'Call "Ada"', reader: "Ada, North", bay: 4, aisle: "maple", shelf: "12A", ribbon: "VIP", rank: 2, loaned: true, returned: false, reserved: true, audit: "save" }], "8").startsWith("text,reader,bay,aisle,shelf,ribbon,band,rank,loaned,returned,reserved,gap,audit\n"), true);
  assert.match(slipsCsv(saved, "8"), /Call Ada,North,4,maple,12A,VIP,low,0,0,0,0,4,save/);
  assert.equal(slipsCsv([], "4"), "text,reader,bay,aisle,shelf,ribbon,band,rank,loaned,returned,reserved,gap,audit");
  assert.equal(slipsCsv(saved, "").includes(",,"), true);
  assert.equal(slipsCsv(saved, "4").includes("amount"), false);
  assert.deepEqual(slipCounts(returned, "8"), { wait: 0, loan: 0, back: 1, reserved: 0, passed: 0 });
  assert.equal(slipCounts(first, "").wait, 1);
  assert.equal(slipCounts(passed, "6").passed, 1);
  assert.equal(slipCounts(passed, "").passed, 0);
  assert.equal(slipShare(1, 4), 25);
  assert.equal(slipShare(0, 4), 0);
  assert.equal(slipShare(1, 0), 0);
  assert.deepEqual(slipReaders(second), ["North", "South"]);
  assert.deepEqual(slipRibbons(second), ["Press", "VIP"]);
  assert.deepEqual(slipAisles(second), ["maple", "ebony"]);
  assert.deepEqual(bayCounts(second), [0, 1, 0, 1]);
  assert.deepEqual(slipTimeline(second, "").map((slip) => slip.bay), [4, 11]);
  assert.deepEqual(slipTimeline([{ id: "z", text: "Open", reader: "", bay: 0, aisle: "", shelf: "", ribbon: "", rank: 0, loaned: false, returned: false, reserved: false, audit: "save" }, ...second], "note").map((slip) => slip.id), ["b"]);
  const blankBay = [{ id: "z", text: "Open", reader: "", bay: 0, aisle: "", shelf: "", ribbon: "", rank: 0, loaned: false, returned: false, reserved: false, audit: "save" }];
  assert.deepEqual(slipTimeline([...blankBay, ...saved], "").map((slip) => slip.id), ["a", "z"]);
  assert.equal(activeReader("missing", ["North"]), "all");
  assert.equal(activeReader("blank", ["North"]), "blank");
  assert.equal(readerArg("blank"), "");
  assert.equal(readerArg("all"), null);
  assert.equal(readerArg("North"), "North");
  assert.equal(activeAisle("missing", ["maple"]), "all");
  assert.equal(activeAisle("blank", ["maple"]), "blank");
  assert.equal(activeAisle("maple", ["maple"]), "maple");
  assert.equal(aisleArg("blank"), "blank");
  assert.equal(aisleArg("all"), null);
  assert.equal(aisleArg("maple"), "maple");
  assert.equal(aisleArg("up"), null);
  assert.equal(activeRibbon("missing", ["VIP"]), "all");
  assert.equal(activeRibbon("blank", ["VIP"]), "blank");
  assert.equal(ribbonArg("blank"), "");
  assert.equal(ribbonArg("all"), null);
  assert.equal(ribbonArg("VIP"), "VIP");
  assert.equal(activeBay("nope"), "all");
  assert.equal(activeBay("low"), "low");
  assert.equal(activeBay("g2"), "g2");
  assert.equal(activeBay("4"), "4");
  assert.equal(activeBay("13"), "all");
  assert.deepEqual(bayArg("all"), { exact: null, band: null });
  assert.deepEqual(bayArg("high"), { exact: null, band: "high" });
  assert.deepEqual(bayArg("g4"), { exact: null, band: "g4" });
  assert.deepEqual(bayArg("11"), { exact: 11, band: null });
  assert.deepEqual(slipClashIds(second, "a"), []);
  const clash = addSlip(saved, { id: "c", text: "Same shelf", reader: "Other", bay: 4, aisle: "maple", shelf: "12A" });
  assert.deepEqual(slipClashIds(clash, "a"), ["c"]);
  assert.deepEqual(slipClashIds([{ ...saved[0], shelf: "" }, { ...saved[0], id: "d", text: "Twin" }], "a"), []);
  assert.equal(nextSlip(second, 4), "a");
  assert.equal(nextSlip(second, 10), "b");
  assert.equal(nextSlip(second, 12), "a");
  assert.equal(nextSlip(loaned, 4), "");
  assert.equal(nextSlip(second, ""), "");
  const views = addSlipView([], { id: "v", name: " Morning ", tray: "loan", query: " ada ", reader: "North", aisle: "maple", ribbon: "VIP", bay: "4" });
  assert.equal(views[0].name, "Morning");
  assert.equal(views[0].tray, "loan");
  assert.equal(views[0].bay, "4");
  assert.equal(addSlipView(views, { id: "w", name: "Morning", tray: "wait", query: "", reader: "all", aisle: "all", ribbon: "all", bay: "all" }).length, 1);
  assert.equal(dropSlipView(views, "v").length, 0);
  assert.equal(readSlipViews([{ id: "v", name: "Morning", tray: "nope", bay: "nope" }])[0].tray, "wait");
  assert.equal(readSlipViews([{ id: "v", name: "Morning", tray: "nope", bay: "nope" }])[0].bay, "all");

  const rows = [
    { address: "12 Oak Street", label: "Ada" },
    { address: "12 Oak Street", label: "Ada Two" },
    { address: "PO Box 4", label: "Bea" },
    { address: "Apt 9", label: "Cio" },
    { address: "Maple House", label: "Dia" },
    { address: "", label: "Eve" },
    { address: null, label: "Fay" },
    { address: "Unit 3 Lane", label: "Gus" },
    { address: "Garden Court", label: "Hal" },
    { address: { address: "Oak Lane" }, label: "Ian" },
    { address: { address: "3 Dock Road", language: "en" }, label: "Jen" },
  ];
  assert.equal(addressText("  Oak Lane  "), "Oak Lane");
  assert.equal(addressText({ address: "12 Oak Street" }), "12 Oak Street");
  assert.equal(addressText({ address: "12 Oak Street", language: "en" }), "");
  assert.equal(addressText({ language: "en" }), "");
  assert.equal(addressText(null), "");
  assert.equal(addressText("x".repeat(80)).length, 48);
  assert.equal(addressKindOf("PO Box 4"), "box");
  assert.equal(addressKindOf("P.O. 9"), "box");
  assert.equal(addressKindOf("12 Box Street"), "box");
  assert.equal(addressKindOf("Apt 9"), "suite");
  assert.equal(addressKindOf("Suite 2, 4 Oak Street"), "suite");
  assert.equal(addressKindOf("Unit 3 Lane"), "suite");
  assert.equal(addressKindOf("12 Oak Street"), "street");
  assert.equal(addressKindOf("Oak Lane"), "street");
  assert.equal(addressKindOf("Maple House"), "other");
  assert.equal(addressKindOf(""), "");
  assert.equal(addressKindOf({ address: "Oak Lane", lastDevice: "phone" }), "");
  assert.equal(addressInitialOf("Oak Lane"), "O");
  assert.equal(addressInitialOf("12 Oak Street"), "#");
  assert.equal(addressInitialOf(""), "");
  assert.equal(namedAddresses(rows).includes("12 Oak Street"), true);
  assert.equal(namedAddresses(rows).includes(""), false);
  assert.deepEqual(namedAddressKinds(rows), ["street", "box", "suite", "other"]);
  assert.equal(leadingAddress(rows), "12 Oak Street");
  assert.equal(leadingAddressKind([{ address: "Apt 9" }, { address: "Suite 2" }]), "suite");
  assert.equal(leadingAddressInitial([{ address: "Oak Lane" }, { address: "PO Box 4" }, { address: "" }]), "O");
  assert.equal(addressShare(1, 4), 25);
  assert.equal(addressShare(0, 4), 0);
  assert.deepEqual(readHiddenAddresses(["12 Oak Street", "gone", "12 Oak Street"], ["12 Oak Street", "Oak Lane"]), ["12 Oak Street"]);
  assert.deepEqual(toggleAddress(["12 Oak Street"], "Oak Lane", ["12 Oak Street", "Oak Lane"]), ["12 Oak Street", "Oak Lane"]);
  assert.deepEqual(toggleAddress(["12 Oak Street"], "12 Oak Street", ["12 Oak Street"]), []);
  assert.deepEqual(visibleAddresses(["12 Oak Street", "Oak Lane"], ["Oak Lane"], false), ["12 Oak Street"]);
  assert.deepEqual(visibleAddresses(["12 Oak Street", "Oak Lane"], ["Oak Lane"], true), ["Oak Lane"]);
  assert.equal(activeAddress("Oak Lane", ["12 Oak Street"]), "");
  assert.equal(activeAddress("12 Oak Street", ["12 Oak Street"]), "12 Oak Street");
  assert.equal(activeAddressKind("missing", ["street"]), "all");
  assert.equal(activeAddressKind("blank", ["street"]), "blank");
  assert.equal(activeAddressKind("suite", ["suite"]), "suite");
  assert.equal(addressKindArg("all"), null);
  assert.equal(addressKindArg("blank"), "");
  assert.equal(addressKindArg("box"), "box");
  assert.equal(addressKindArg("nope"), null);
  assert.equal(activeAddressInitial("missing", ["O"]), "all");
  assert.equal(activeAddressInitial("blank", ["O"]), "blank");
  assert.equal(activeAddressInitial("#", ["#"]), "#");
  assert.equal(activeAddressInitial("#", ["O"]), "all");
  assert.equal(addressInitialArg("all"), null);
  assert.equal(addressInitialArg("blank"), "");
  assert.equal(addressInitialArg("#"), "#");
  assert.equal(addressInitialArg("o"), "O");
  const shown = visibleAddressCustomers(rows, "", false, "suite", null, "gus");
  assert.equal(shown.length, 1);
  assert.equal(shown[0].label, "Gus");
  assert.equal(visibleAddressCustomers(rows, "", true, null, null, "eve").length, 1);
  assert.equal(visibleAddressCustomers(rows, "Apt 9", false, null, null, "").length, 1);
  assert.equal(addressesCsv(rows).startsWith("address,kind,initial,count\n"), true);
  assert.equal(addressesCsv([]), "address,kind,initial,count");
  assert.equal(addressesCsv(rows).includes("amount"), false);
  assert.equal(addressKindLines(rows).some((line) => line.kind === "box"), true);
  assert.equal(namedAddressInitials(rows).includes("O"), true);

  const copy = Object.keys(ROUND141_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND141_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "slpTitle"), "Stack slips");
  assert.equal(crmv4Text("tr", "atlTitle"), ROUND141_COPY.tr.atlTitle);
  assert.equal(crmv4Text("de", "slpReader"), ROUND141_COPY.de.slpReader);
  assert.equal(crmv4Text("ru", "atlBlank"), ROUND141_COPY.ru.atlBlank);
  assert.equal(crmv4Text("ar", "slpNotice"), ROUND141_COPY.ar.slpNotice);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-stack/);
  assert.match(css, /\.c4-atlas/);
  assert.match(css, /\.c4-pagehead-library/);
  assert.match(css, /\.c4-rail-library/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round141.tsx"), "utf8");
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
  assert.match(view, /address/);
  assert.match(view, /slipsCsv/);
  assert.match(view, /addressesCsv/);
  assert.match(view, /Escape/);
  assert.match(view, /event\.key !== "\/"/);
  assert.match(view, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(view, /data-stack/);
  assert.match(view, /data-atlas/);
  assert.match(view, /data-logo="mono"/);
  assert.match(view, /customers/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "stacks"/);
  assert.match(app, /view === "atlas"/);
  assert.match(app, /c4-pagehead-library/);
  assert.match(app, /c4-rail-library/);
  assert.match(app, /c4-pagehead-salon/);
  console.log("crmv4 round141 tests passed");
}

main();
