/**
 * Press proofs and affiliate ribbons.
 * Run: npx tsx tests/crmv4-round161.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND161_COPY } from "../src/lib/crmv4/copy-round161";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeCut,
  activeDocket,
  activeFolio,
  activeInk,
  activeReviewer,
  activeRibbon,
  activeSpan,
  activeWeave,
  activeWeight,
  addProof,
  addProofView,
  assignedRibbon,
  bulkProofIssued,
  bulkProofPinned,
  clashProofCount,
  cutArg,
  cutOf,
  docketArg,
  dropProofView,
  editProof,
  folioArg,
  folioOf,
  inkArg,
  inkOf,
  leadingRibbon,
  leadingSpan,
  namedCuts,
  namedRibbons,
  namedSpans,
  namedWeaves,
  nextProof,
  proofClashIds,
  proofCopy,
  proofCounts,
  proofDocket,
  proofDockets,
  proofGap,
  proofInks,
  proofReviewers,
  proofShare,
  proofText,
  proofWeights,
  proofsCsv,
  readHiddenRibbons,
  readProofViews,
  readProofs,
  resetProofs,
  reviewerArg,
  reviewerLabel,
  ribbonArg,
  ribbonShare,
  ribbonsCsv,
  setProofIssued,
  setProofPinned,
  setProofProofed,
  sheetCounts,
  sheetOf,
  sideOf,
  spanArg,
  spanOf,
  stepProofWeight,
  toggleRibbon,
  visibleProofs,
  visibleRibbonCustomers,
  visibleRibbons,
  weaveArg,
  weaveOf,
  weightArg,
  weightOf,
  proofTimeline,
} from "../src/lib/crmv4/round161";

function main() {
  assert.equal(proofText("  Check\nAda  "), "Check Ada");
  assert.equal(proofText("   "), "");
  assert.equal(proofText("x".repeat(120)).length, 56);
  assert.equal(reviewerLabel("  North  "), "North");
  assert.equal(reviewerLabel("   "), "");
  assert.equal(reviewerLabel("y".repeat(40)).length, 18);
  assert.equal(proofDocket("  VIP  "), "VIP");
  assert.equal(proofDocket("   "), "");
  assert.equal(proofDocket("z".repeat(30)).length, 8);
  assert.equal(folioOf(" 1 "), 1);
  assert.equal(folioOf(1), 1);
  assert.equal(folioOf("01"), 1);
  assert.equal(folioOf("08"), 8);
  assert.equal(folioOf("8"), 8);
  assert.equal(folioOf(8), 8);
  assert.equal(folioOf(""), null);
  assert.equal(folioOf("00"), null);
  assert.equal(folioOf("09"), null);
  assert.equal(folioOf(0), null);
  assert.equal(folioOf("9"), null);
  assert.equal(folioOf(9), null);
  assert.equal(folioOf(-1), null);
  assert.equal(folioOf(1.5), null);
  assert.equal(inkOf(" CARBON "), "carbon");
  assert.equal(inkOf("iron"), "iron");
  assert.equal(inkOf("walnut"), "walnut");
  assert.equal(inkOf("soot"), "soot");
  assert.equal(inkOf(""), "blank");
  assert.equal(inkOf("gold"), "blank");
  assert.equal(weightOf(" LIGHT "), "light");
  assert.equal(weightOf("firm"), "firm");
  assert.equal(weightOf("heavy"), "heavy");
  assert.equal(weightOf(""), "blank");
  assert.equal(weightOf("gold"), "blank");
  assert.equal(sheetOf(null), "blank");
  assert.equal(sheetOf(1), "cover");
  assert.equal(sheetOf(2), "cover");
  assert.equal(sheetOf(3), "leaf");
  assert.equal(sheetOf(4), "leaf");
  assert.equal(sheetOf(5), "spine");
  assert.equal(sheetOf(6), "spine");
  assert.equal(sheetOf(7), "end");
  assert.equal(sheetOf(8), "end");
  assert.equal(sideOf(null), "blank");
  assert.equal(sideOf(1), "inner");
  assert.equal(sideOf(4), "inner");
  assert.equal(sideOf(5), "outer");
  assert.equal(sideOf(8), "outer");
  assert.equal(proofGap(4, 6), 2);
  assert.equal(proofGap(6, 4), -2);
  assert.equal(proofGap(4, 4), 0);
  assert.equal(proofGap(null, 6), null);
  assert.equal(proofGap(4, ""), null);
  assert.equal(proofGap(4, 9), null);
  assert.deepEqual(readProofs([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Check Ada", reviewer: "  ", folio: 0, ink: "gold", docket: "  ", weight: "gold", pinned: 1, proofed: 1, issued: 1, audit: "nope" }, "nope"]), [
    { id: "2", text: "Check Ada", reviewer: "", folio: null, ink: "", docket: "", weight: "", pinned: false, proofed: false, issued: false, audit: "" },
  ]);
  assert.equal(readProofs([{ id: "z", text: "One", folio: 1 }])[0].folio, 1);
  assert.equal(readProofs([{ id: "z", text: "One", folio: "08" }])[0].folio, 8);
  const saved = addProof([], { id: "a", text: "Check Ada", reviewer: "Nia", folio: 4, ink: "carbon", docket: "VIP", weight: "light" });
  assert.equal(saved[0].audit, "save");
  assert.equal(saved[0].folio, 4);
  assert.equal(saved[0].ink, "carbon");
  assert.equal(saved[0].weight, "light");
  assert.equal(addProof(saved, { id: "b", text: "Check Ada" }).length, 1);
  assert.equal(addProof(saved, { id: "a", text: "Other" }).length, 1);
  assert.equal(addProof(saved, { id: "b", text: "   " }).length, 1);
  const raised = stepProofWeight(saved, "a", 1);
  assert.equal(raised[0].weight, "firm");
  assert.equal(raised[0].audit, "raise");
  assert.equal(stepProofWeight(raised, "a", 1)[0].weight, "heavy");
  assert.equal(stepProofWeight([{ ...saved[0], weight: "heavy" }], "a", 1)[0].weight, "heavy");
  assert.equal(stepProofWeight([{ ...saved[0], weight: "" }], "a", -1)[0].weight, "");
  assert.equal(stepProofWeight([{ ...saved[0], weight: "" }], "a", 1)[0].weight, "light");
  assert.equal(setProofPinned(saved, "a", true)[0].audit, "pin");
  assert.equal(setProofPinned(saved, "a", false)[0].audit, "unpin");
  assert.equal(setProofProofed(saved, "a", true)[0].proofed, true);
  assert.equal(setProofProofed(saved, "a", true)[0].audit, "proof");
  assert.equal(setProofIssued(saved, "a", true)[0].audit, "issue");
  assert.equal(setProofIssued(saved, "a", false)[0].audit, "recall");
  assert.equal(editProof(saved, "a", "  ")[0].text, "Check Ada");
  assert.equal(editProof(saved, "a", "Check Bea")[0].audit, "edit");
  const pair = addProof(saved, { id: "b", text: "Check Bea" });
  assert.equal(editProof(pair, "b", "Check Ada")[0].text, "Check Bea");
  assert.equal(bulkProofPinned(pair, ["a", "b"], true).every((card) => card.pinned), true);
  assert.equal(bulkProofIssued(pair, ["missing"], true)[0].issued, false);
  assert.equal(resetProofs().length, 0);
  assert.equal(proofCopy("  Check Ada "), "Check Ada");
  assert.equal(proofCopy(" "), "");
  const mixed = [
    { ...saved[0], id: "open", weight: "light", folio: 2, pinned: true },
    { ...saved[0], id: "held", text: "Held note", proofed: true, weight: "firm", folio: 6 },
    { ...saved[0], id: "stowed", text: "Stowed note", issued: true, proofed: true, weight: "heavy", folio: 1 },
    { ...saved[0], id: "late", text: "Aaa late", weight: "light", folio: 1 },
    { ...saved[0], id: "firm", text: "Firm note", weight: "firm", folio: 1 },
  ];
  assert.equal(visibleProofs(mixed, "open", "late", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleProofs(mixed, "open", "nia", null, null, null, null, null, null, false, false, "").length, 0);
  assert.equal(visibleProofs(mixed, "proofed", "", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleProofs(mixed, "issued", "", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleProofs(mixed, "open", "", null, null, null, null, null, null, true, false, "").length, 0);
  assert.equal(visibleProofs(mixed, "open", "", null, null, null, null, null, null, false, true, "6").every((card) => card.weight === "light"), true);
  assert.equal(visibleProofs(mixed, "open", "", null, null, null, null, null, null, false, true, "6").length, 2);
  assert.equal(visibleProofs(mixed, "open", "", null, "carbon", null, null, null, null, false, false, "").length, 3);
  assert.equal(visibleProofs(mixed, "open", "", "Nia", "carbon", "VIP", "light", 2, null, false, false, "").length, 1);
  assert.equal(visibleProofs(mixed, "open", "", null, null, null, null, null, "cover", false, false, "").length, 3);
  assert.equal(proofTimeline(mixed, "")[0].folio, 1);
  assert.equal(proofTimeline([{ ...saved[0], folio: null }], "").at(-1)?.folio, null);
  const counts = proofCounts(mixed, "6");
  assert.equal(counts.open, 3);
  assert.equal(counts.proofed, 1);
  assert.equal(counts.issued, 1);
  assert.equal(counts.pinned, 1);
  assert.equal(counts.late, 2);
  assert.equal(proofShare(1, 3), 33);
  assert.equal(proofShare(0, 0), 0);
  assert.deepEqual(proofReviewers(mixed), ["Nia"]);
  assert.deepEqual(proofDockets(mixed), ["VIP"]);
  assert.deepEqual(proofInks(mixed), ["carbon"]);
  assert.deepEqual(proofWeights(mixed), ["light", "firm", "heavy"]);
  assert.deepEqual(sheetCounts(mixed), [4, 0, 1, 0]);
  assert.equal(activeReviewer("gone", ["Nia"]), "all");
  assert.equal(activeReviewer("blank", ["Nia"]), "blank");
  assert.equal(reviewerArg("blank"), "");
  assert.equal(reviewerArg("all"), null);
  assert.equal(activeInk("gone", ["carbon"]), "all");
  assert.equal(inkArg("blank"), "blank");
  assert.equal(inkArg("carbon"), "carbon");
  assert.equal(inkArg("gold"), null);
  assert.equal(activeDocket("gone", ["VIP"]), "all");
  assert.equal(docketArg("VIP"), "VIP");
  assert.equal(activeWeight("gone", ["light"]), "all");
  assert.equal(weightArg("light"), "light");
  assert.equal(weightArg("blank"), "blank");
  assert.equal(activeFolio("cover"), "cover");
  assert.equal(activeFolio("08"), "8");
  assert.equal(activeFolio("00"), "all");
  assert.equal(activeFolio("09"), "all");
  assert.equal(activeFolio("pirate"), "all");
  assert.deepEqual(folioArg("1"), { exact: 1, sheet: null });
  assert.deepEqual(folioArg("leaf"), { exact: null, sheet: "leaf" });
  assert.deepEqual(folioArg("all"), { exact: null, sheet: null });
  assert.deepEqual(proofClashIds([
    { ...saved[0], id: "a", folio: 2, text: "Check Ada" },
    { ...saved[0], id: "b", folio: 6, text: "Check Bea" },
  ], "a"), ["b"]);
  assert.deepEqual(proofClashIds([{ ...saved[0], ink: "", folio: 4 }], "a"), []);
  assert.deepEqual(proofClashIds([{ ...saved[0], docket: "" }], "a"), []);
  assert.equal(clashProofCount([
    { ...saved[0], id: "a", text: "Check Ada" },
    { ...saved[0], id: "b", text: "Check Bea" },
  ]), 2);
  assert.equal(clashProofCount([{ ...saved[0], docket: "" }]), 0);
  assert.equal(nextProof(mixed, "2"), "open");
  assert.equal(nextProof(mixed, "8"), "late");
  assert.equal(nextProof([{ ...saved[0], weight: "heavy", folio: 3 }], "1"), "");
  assert.equal(nextProof(mixed, ""), "");
  const csv = proofsCsv(saved, "6");
  assert.equal(csv.startsWith("note,reviewer,folio,ink,docket,weight,sheet,pinned,proofed,issued,gap,audit\n"), true);
  assert.equal(csv.includes("Check Ada,Nia,4,carbon,VIP,light,leaf,0,0,0,2,save"), true);
  assert.equal(proofsCsv([], "").includes("note,reviewer"), true);
  const view = addProofView([], { id: "v", name: "Cover sheet", tray: "open", query: "ada", reviewer: "Nia", ink: "carbon", docket: "VIP", weight: "light", folio: "cover" });
  assert.equal(view.length, 1);
  assert.equal(addProofView(view, { ...view[0], id: "w" }).length, 1);
  assert.equal(readProofViews([{ id: "v", name: "  " }]).length, 0);
  assert.equal(dropProofView(view, "v").length, 0);
  const many = Array.from({ length: 12 }, (_, index) => ({ id: `k${index}`, text: `Note ${index}`, reviewer: "", folio: null, ink: "", docket: "", weight: "", pinned: false, proofed: false, issued: false, audit: "save" }));
  assert.equal(readProofs(many).length, 10);
  const manyViews = Array.from({ length: 7 }, (_, index) => ({ id: `v${index}`, name: `View ${index}`, tray: "open" as const, query: "", reviewer: "all", ink: "all", docket: "all", weight: "all", folio: "all" }));
  assert.equal(readProofViews(manyViews).length, 5);

  assert.equal(assignedRibbon("North"), "pair");
  assert.equal(assignedRibbon("ok"), "short");
  assert.equal(assignedRibbon("WinterBid"), "chain");
  assert.equal(assignedRibbon(""), "");
  assert.equal(assignedRibbon("x".repeat(80)), "chain");
  assert.equal(assignedRibbon({ affiliateB: "North" }), "pair");
  assert.equal(assignedRibbon({ affiliateB: "North", affiliateA: "A" }), "");
  assert.equal(assignedRibbon({ affiliateB: "North", affiliateC: "C" }), "");
  assert.equal(assignedRibbon({ affiliateB: "North", campaign: "Spring" }), "");
  assert.equal(assignedRibbon({ affiliateB: "North", lastLoginAt: "2026-01-01T00:00:00.000Z" }), "");
  assert.equal(assignedRibbon({ affiliateB: "North", lastSeenAt: "2026-01-01T00:00:00.000Z" }), "");
  assert.equal(assignedRibbon({ affiliateB: "North", timezone: "Europe/Berlin" }), "");
  assert.equal(assignedRibbon({ affiliateB: "North", language: "de" }), "");
  assert.equal(assignedRibbon({ affiliateB: "North", country: "DE" }), "");
  assert.equal(assignedRibbon({ affiliateB: "North", name: "Ada" }), "");
  assert.equal(assignedRibbon({ affiliateB: "North", email: "a@b.c" }), "");
  assert.equal(assignedRibbon({ affiliateB: "North", phone: "1" }), "");
  assert.equal(assignedRibbon({ affiliateB: "North", desk: "North" }), "");
  assert.equal(assignedRibbon({ affiliateB: "North", address: "1 Road" }), "");
  assert.equal(assignedRibbon({ affiliateB: "North", city: "Berlin" }), "");
  assert.equal(assignedRibbon({ affiliateB: "North", firstName: "Ada" }), "");
  assert.equal(assignedRibbon({ affiliateB: "North", lastName: "North" }), "");
  assert.equal(assignedRibbon({ affiliateB: "North", lastCountryName: "Germany" }), "");
  assert.equal(assignedRibbon({ affiliateB: "North", createdAt: "2026-01-01T00:00:00.000Z" }), "");
  assert.equal(assignedRibbon({ affiliateB: "North", username: "ada" }), "");
  assert.equal(assignedRibbon({ affiliateB: "North", accountLoginId: "1" }), "");
  assert.equal(assignedRibbon({ affiliateB: "North", retentionNote: "call" }), "");
  assert.equal(spanOf("ok"), "short");
  assert.equal(spanOf("North"), "pair");
  assert.equal(spanOf("WinterBid"), "chain");
  assert.equal(spanOf(""), "");
  assert.equal(cutOf("Ada"), "vowel");
  assert.equal(cutOf("North"), "consonant");
  assert.equal(cutOf("2026"), "other");
  assert.equal(cutOf("-vip"), "other");
  assert.equal(cutOf("Çağrı"), "consonant");
  assert.equal(cutOf("اصل"), "vowel");
  assert.equal(cutOf(""), "");
  assert.equal(weaveOf("North"), "solo");
  assert.equal(weaveOf("North Sale"), "spaced");
  assert.equal(weaveOf("VIP-1"), "spaced");
  assert.equal(weaveOf("north_bid"), "joined");
  assert.equal(weaveOf("a.b"), "joined");
  assert.equal(weaveOf("a/b"), "joined");
  assert.equal(weaveOf("a_b c"), "joined");
  assert.equal(weaveOf(""), "");
  const rows = [
    { affiliateB: "North", label: "Ada North" },
    { affiliateB: "North", label: "Bea South" },
    { affiliateB: "North", label: "Ann Extra" },
    { affiliateB: "ok", label: "Ann West" },
    { affiliateB: "Spring Sale", label: "Chris East" },
    { affiliateB: "2026", label: "Uma" },
    { affiliateB: "Ada", label: "Mark" },
    { affiliateB: "WinterBid", label: "West" },
    { affiliateB: "-vip", label: "Otto" },
    { affiliateB: "4ada", label: "Mark" },
    { affiliateB: "north_bid", label: "Jo" },
    { affiliateB: "", label: "Blank" },
  ];
  assert.equal(leadingRibbon(rows), "North");
  assert.equal(leadingSpan(rows), "pair");
  assert.equal(ribbonShare(2, 6), 33);
  assert.equal(ribbonShare(0, 0), 0);
  assert.deepEqual(namedSpans(rows), ["short", "pair", "chain"]);
  assert.deepEqual(namedCuts(rows), ["vowel", "consonant", "other"]);
  assert.deepEqual(namedWeaves(rows), ["solo", "joined", "spaced"]);
  assert.deepEqual(namedRibbons(rows).slice(0, 2), ["-vip", "2026"]);
  assert.equal(visibleRibbonCustomers(rows, "pair", null, null, null, "north").length, 1);
  assert.equal(visibleRibbonCustomers(rows, null, "consonant", "solo", null, "").length, 4);
  assert.equal(visibleRibbonCustomers(rows, null, null, null, "North", "").length, 3);
  assert.equal(visibleRibbonCustomers([{ affiliateB: "North", label: "North" }], null, null, null, null, "france").length, 0);
  assert.deepEqual(readHiddenRibbons(["North", "north", "9"], ["North", "ok"]), ["North"]);
  assert.deepEqual(toggleRibbon(["North"], "ok", ["North", "ok"]), ["North", "ok"]);
  assert.deepEqual(toggleRibbon(["North"], "North", ["North", "ok"]), []);
  assert.deepEqual(toggleRibbon([], "ok", ["North", "ok"]), ["ok"]);
  assert.deepEqual(visibleRibbons(["North", "ok"], ["North"], false), ["ok"]);
  assert.deepEqual(visibleRibbons(["North", "ok"], ["North"], true), ["North"]);
  assert.equal(activeRibbon("gone", ["North"]), "all");
  assert.equal(activeRibbon("blank", ["North"]), "blank");
  assert.equal(ribbonArg("North"), "North");
  assert.equal(ribbonArg("blank"), "");
  assert.equal(ribbonArg("all"), null);
  assert.equal(activeSpan("gone", ["short"]), "all");
  assert.equal(spanArg("short"), "short");
  assert.equal(spanArg("blank"), "");
  assert.equal(activeCut("gone", ["vowel"]), "all");
  assert.equal(cutArg("vowel"), "vowel");
  assert.equal(cutArg("blank"), "");
  assert.equal(activeWeave("gone", ["solo"]), "all");
  assert.equal(weaveArg("solo"), "solo");
  assert.equal(weaveArg("blank"), "");
  const names = ribbonsCsv(rows);
  assert.equal(names.startsWith("kind,mark,count"), true);
  assert.equal(ribbonsCsv([]), "kind,mark,count");
  assert.equal(names.includes("amount"), false);
  assert.equal(names.includes(",short,"), true);
  assert.equal(names.includes(",North,"), true);

  const copy = Object.keys(ROUND161_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND161_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "prfTitle"), "Press proofs");
  assert.equal(crmv4Text("tr", "arbTitle"), ROUND161_COPY.tr.arbTitle);
  assert.equal(crmv4Text("de", "prfReviewer"), ROUND161_COPY.de.prfReviewer);
  assert.equal(crmv4Text("ru", "arbUnmarked"), ROUND161_COPY.ru.arbUnmarked);
  assert.equal(crmv4Text("ar", "prfNotice"), ROUND161_COPY.ar.prfNotice);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-prf/);
  assert.match(css, /\.c4-arb/);
  assert.match(css, /\.c4-pagehead-inkwell/);
  assert.match(css, /\.c4-rail-inkwell/);
  assert.match(css, /\.c4-pagehead-hearth/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round161.tsx"), "utf8");
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
  assert.match(viewFile, /affiliateB/);
  assert.match(viewFile, /proofsCsv/);
  assert.match(viewFile, /ribbonsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "m"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-proofs/);
  assert.match(viewFile, /data-ribbons/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "proof"/);
  assert.match(app, /view === "ribbon"/);
  assert.match(app, /c4-pagehead-inkwell/);
  assert.match(app, /c4-rail-inkwell/);
  assert.match(app, /c4-pagehead-hearth/);
  const rail = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round30.tsx"), "utf8");
  assert.match(rail, /c4-rail-inkwell/);
  console.log("crmv4 round161 tests passed");
}

main();
