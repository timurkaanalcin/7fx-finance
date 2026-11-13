/**
 * Bindery stitches and campaign cloths.
 * Run: npx tsx tests/crmv4-round160.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND160_COPY } from "../src/lib/crmv4/copy-round160";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeBinder,
  activeCloth,
  activeFold,
  activeGlyph,
  activeLength,
  activeStitch,
  activeTension,
  activeThread,
  activeTicket,
  addStitch,
  addStitchView,
  assignedCloth,
  bandCounts,
  bandOf,
  binderArg,
  bulkStitchBound,
  bulkStitchPinned,
  clashStitchCount,
  clothArg,
  clothShare,
  clothsCsv,
  dropStitchView,
  editStitch,
  foldArg,
  foldOf,
  glyphArg,
  glyphOf,
  leadingCloth,
  leadingLength,
  lengthArg,
  lengthOf,
  namedCloths,
  namedFolds,
  namedGlyphs,
  namedLengths,
  nextStitch,
  reachOf,
  readHiddenCloths,
  readStitchViews,
  readStitches,
  resetStitches,
  setStitchBasted,
  setStitchBound,
  setStitchPinned,
  stepStitchTension,
  stitchArg,
  stitchBinders,
  stitchClashIds,
  stitchCopy,
  stitchCounts,
  stitchGap,
  stitchShare,
  stitchTensions,
  stitchText,
  stitchTicket,
  stitchThreads,
  stitchTickets,
  stitchTimeline,
  stitchesCsv,
  tensionArg,
  tensionOf,
  threadArg,
  threadOf,
  ticketArg,
  toggleCloth,
  visibleClothCustomers,
  visibleCloths,
  visibleStitches,
  binderLabel,
  stitchOf,
} from "../src/lib/crmv4/round160";

function main() {
  assert.equal(stitchText("  Check\nAda  "), "Check Ada");
  assert.equal(stitchText("   "), "");
  assert.equal(stitchText("x".repeat(120)).length, 48);
  assert.equal(binderLabel("  North  "), "North");
  assert.equal(binderLabel("   "), "");
  assert.equal(binderLabel("y".repeat(40)).length, 16);
  assert.equal(stitchTicket("  VIP  "), "VIP");
  assert.equal(stitchTicket("   "), "");
  assert.equal(stitchTicket("z".repeat(30)).length, 10);
  assert.equal(stitchOf(" 1 "), 1);
  assert.equal(stitchOf(1), 1);
  assert.equal(stitchOf("01"), 1);
  assert.equal(stitchOf("09"), 9);
  assert.equal(stitchOf("12"), 12);
  assert.equal(stitchOf(12), 12);
  assert.equal(stitchOf(""), null);
  assert.equal(stitchOf("00"), null);
  assert.equal(stitchOf(0), null);
  assert.equal(stitchOf("13"), null);
  assert.equal(stitchOf(13), null);
  assert.equal(stitchOf(-1), null);
  assert.equal(stitchOf(1.5), null);
  assert.equal(threadOf(" SILK "), "silk");
  assert.equal(threadOf("linen"), "linen");
  assert.equal(threadOf("cotton"), "cotton");
  assert.equal(threadOf("wool"), "wool");
  assert.equal(threadOf(""), "blank");
  assert.equal(threadOf("gold"), "blank");
  assert.equal(tensionOf(" SLACK "), "slack");
  assert.equal(tensionOf("even"), "even");
  assert.equal(tensionOf("taut"), "taut");
  assert.equal(tensionOf(""), "blank");
  assert.equal(tensionOf("gold"), "blank");
  assert.equal(bandOf(null), "blank");
  assert.equal(bandOf(1), "hem");
  assert.equal(bandOf(3), "hem");
  assert.equal(bandOf(4), "seam");
  assert.equal(bandOf(6), "seam");
  assert.equal(bandOf(7), "panel");
  assert.equal(bandOf(9), "panel");
  assert.equal(bandOf(10), "cuff");
  assert.equal(bandOf(12), "cuff");
  assert.equal(reachOf(null), "blank");
  assert.equal(reachOf(1), "near");
  assert.equal(reachOf(6), "near");
  assert.equal(reachOf(7), "far");
  assert.equal(reachOf(12), "far");
  assert.equal(stitchGap(6, 8), 2);
  assert.equal(stitchGap(10, 8), -2);
  assert.equal(stitchGap(6, 6), 0);
  assert.equal(stitchGap(null, 8), null);
  assert.equal(stitchGap(6, ""), null);
  assert.equal(stitchGap(6, 13), null);
  assert.deepEqual(readStitches([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Check Ada", binder: "  ", stitch: 0, thread: "gold", ticket: "  ", tension: "gold", pinned: 1, basted: 1, bound: 1, audit: "nope" }, "nope"]), [
    { id: "2", text: "Check Ada", binder: "", stitch: null, thread: "", ticket: "", tension: "", pinned: false, basted: false, bound: false, audit: "" },
  ]);
  assert.equal(readStitches([{ id: "z", text: "One", stitch: 1 }])[0].stitch, 1);
  assert.equal(readStitches([{ id: "z", text: "One", stitch: "09" }])[0].stitch, 9);
  const saved = addStitch([], { id: "a", text: "Check Ada", binder: "Nia", stitch: 6, thread: "silk", ticket: "VIP", tension: "slack" });
  assert.equal(saved[0].audit, "save");
  assert.equal(saved[0].stitch, 6);
  assert.equal(saved[0].thread, "silk");
  assert.equal(saved[0].tension, "slack");
  assert.equal(addStitch(saved, { id: "b", text: "Check Ada" }).length, 1);
  assert.equal(addStitch(saved, { id: "a", text: "Other" }).length, 1);
  assert.equal(addStitch(saved, { id: "b", text: "   " }).length, 1);
  const raised = stepStitchTension(saved, "a", 1);
  assert.equal(raised[0].tension, "even");
  assert.equal(raised[0].audit, "raise");
  assert.equal(stepStitchTension(raised, "a", 1)[0].tension, "taut");
  assert.equal(stepStitchTension([{ ...saved[0], tension: "taut" }], "a", 1)[0].tension, "taut");
  assert.equal(stepStitchTension([{ ...saved[0], tension: "" }], "a", -1)[0].tension, "");
  assert.equal(stepStitchTension([{ ...saved[0], tension: "" }], "a", 1)[0].tension, "slack");
  assert.equal(setStitchPinned(saved, "a", true)[0].audit, "pin");
  assert.equal(setStitchPinned(saved, "a", false)[0].audit, "unpin");
  assert.equal(setStitchBasted(saved, "a", true)[0].basted, true);
  assert.equal(setStitchBasted(saved, "a", true)[0].audit, "baste");
  assert.equal(setStitchBound(saved, "a", true)[0].audit, "bind");
  assert.equal(setStitchBound(saved, "a", false)[0].audit, "unbind");
  assert.equal(editStitch(saved, "a", "  ")[0].text, "Check Ada");
  assert.equal(editStitch(saved, "a", "Check Bea")[0].audit, "edit");
  const pair = addStitch(saved, { id: "b", text: "Check Bea" });
  assert.equal(editStitch(pair, "b", "Check Ada")[0].text, "Check Bea");
  assert.equal(bulkStitchPinned(pair, ["a", "b"], true).every((card) => card.pinned), true);
  assert.equal(bulkStitchBound(pair, ["missing"], true)[0].bound, false);
  assert.equal(resetStitches().length, 0);
  assert.equal(stitchCopy("  Check Ada "), "Check Ada");
  assert.equal(stitchCopy(" "), "");
  const mixed = [
    { ...saved[0], id: "open", tension: "slack", stitch: 3, pinned: true },
    { ...saved[0], id: "held", text: "Held note", basted: true, tension: "even", stitch: 8 },
    { ...saved[0], id: "stowed", text: "Stowed note", bound: true, basted: true, tension: "taut", stitch: 2 },
    { ...saved[0], id: "late", text: "Aaa late", tension: "slack", stitch: 1 },
    { ...saved[0], id: "slack", text: "Slack note", tension: "even", stitch: 1 },
  ];
  assert.equal(visibleStitches(mixed, "open", "late", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleStitches(mixed, "open", "nia", null, null, null, null, null, null, false, false, "").length, 0);
  assert.equal(visibleStitches(mixed, "basted", "", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleStitches(mixed, "bound", "", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleStitches(mixed, "open", "", null, null, null, null, null, null, true, false, "").length, 0);
  assert.equal(visibleStitches(mixed, "open", "", null, null, null, null, null, null, false, true, "8").every((card) => card.tension === "slack"), true);
  assert.equal(visibleStitches(mixed, "open", "", null, null, null, null, null, null, false, true, "8").length, 2);
  assert.equal(visibleStitches(mixed, "open", "", null, "silk", null, null, null, null, false, false, "").length, 3);
  assert.equal(visibleStitches(mixed, "open", "", "Nia", "silk", "VIP", "slack", 3, null, false, false, "").length, 1);
  assert.equal(visibleStitches(mixed, "open", "", null, null, null, null, null, "hem", false, false, "").length, 3);
  assert.equal(stitchTimeline(mixed, "")[0].stitch, 1);
  assert.equal(stitchTimeline([{ ...saved[0], stitch: null }], "").at(-1)?.stitch, null);
  const counts = stitchCounts(mixed, "8");
  assert.equal(counts.open, 3);
  assert.equal(counts.basted, 1);
  assert.equal(counts.bound, 1);
  assert.equal(counts.pinned, 1);
  assert.equal(counts.late, 2);
  assert.equal(stitchShare(1, 3), 33);
  assert.equal(stitchShare(0, 0), 0);
  assert.deepEqual(stitchBinders(mixed), ["Nia"]);
  assert.deepEqual(stitchTickets(mixed), ["VIP"]);
  assert.deepEqual(stitchThreads(mixed), ["silk"]);
  assert.deepEqual(stitchTensions(mixed), ["slack", "even", "taut"]);
  assert.deepEqual(bandCounts(mixed), [4, 0, 1, 0]);
  assert.equal(activeBinder("gone", ["Nia"]), "all");
  assert.equal(activeBinder("blank", ["Nia"]), "blank");
  assert.equal(binderArg("blank"), "");
  assert.equal(binderArg("all"), null);
  assert.equal(activeThread("gone", ["silk"]), "all");
  assert.equal(threadArg("blank"), "blank");
  assert.equal(threadArg("silk"), "silk");
  assert.equal(threadArg("gold"), null);
  assert.equal(activeTicket("gone", ["VIP"]), "all");
  assert.equal(ticketArg("VIP"), "VIP");
  assert.equal(activeTension("gone", ["slack"]), "all");
  assert.equal(tensionArg("slack"), "slack");
  assert.equal(tensionArg("blank"), "blank");
  assert.equal(activeStitch("hem"), "hem");
  assert.equal(activeStitch("09"), "9");
  assert.equal(activeStitch("00"), "all");
  assert.equal(activeStitch("13"), "all");
  assert.equal(activeStitch("pirate"), "all");
  assert.deepEqual(stitchArg("1"), { exact: 1, band: null });
  assert.deepEqual(stitchArg("seam"), { exact: null, band: "seam" });
  assert.deepEqual(stitchArg("all"), { exact: null, band: null });
  assert.deepEqual(stitchClashIds([
    { ...saved[0], id: "a", stitch: 3, text: "Check Ada" },
    { ...saved[0], id: "b", stitch: 8, text: "Check Bea" },
  ], "a"), ["b"]);
  assert.deepEqual(stitchClashIds([{ ...saved[0], thread: "", stitch: 6 }], "a"), []);
  assert.deepEqual(stitchClashIds([{ ...saved[0], ticket: "" }], "a"), []);
  assert.equal(clashStitchCount([
    { ...saved[0], id: "a", text: "Check Ada" },
    { ...saved[0], id: "b", text: "Check Bea" },
  ]), 2);
  assert.equal(clashStitchCount([{ ...saved[0], ticket: "" }]), 0);
  assert.equal(nextStitch(mixed, "2"), "open");
  assert.equal(nextStitch(mixed, "12"), "late");
  assert.equal(nextStitch([{ ...saved[0], tension: "taut", stitch: 4 }], "1"), "");
  assert.equal(nextStitch(mixed, ""), "");
  const csv = stitchesCsv(saved, "8");
  assert.equal(csv.startsWith("note,binder,stitch,thread,ticket,tension,band,pinned,basted,bound,gap,audit\n"), true);
  assert.equal(csv.includes("Check Ada,Nia,6,silk,VIP,slack,seam,0,0,0,2,save"), true);
  assert.equal(stitchesCsv([], "").includes("note,binder"), true);
  const view = addStitchView([], { id: "v", name: "Hem band", tray: "open", query: "ada", binder: "Nia", thread: "silk", ticket: "VIP", tension: "slack", stitch: "hem" });
  assert.equal(view.length, 1);
  assert.equal(addStitchView(view, { ...view[0], id: "w" }).length, 1);
  assert.equal(readStitchViews([{ id: "v", name: "  " }]).length, 0);
  assert.equal(dropStitchView(view, "v").length, 0);
  const many = Array.from({ length: 14 }, (_, index) => ({ id: `k${index}`, text: `Note ${index}`, binder: "", stitch: null, thread: "", ticket: "", tension: "", pinned: false, basted: false, bound: false, audit: "save" }));
  assert.equal(readStitches(many).length, 12);
  const manyViews = Array.from({ length: 6 }, (_, index) => ({ id: `v${index}`, name: `View ${index}`, tray: "open" as const, query: "", binder: "all", thread: "all", ticket: "all", tension: "all", stitch: "all" }));
  assert.equal(readStitchViews(manyViews).length, 4);

  assert.equal(assignedCloth("Spring"), "name");
  assert.equal(assignedCloth("ok"), "brief");
  assert.equal(assignedCloth("WinterCampaign"), "long");
  assert.equal(assignedCloth(""), "");
  assert.equal(assignedCloth("x".repeat(80)), "long");
  assert.equal(assignedCloth({ campaign: "Spring" }), "name");
  assert.equal(assignedCloth({ campaign: "Spring", lastLoginAt: "2026-01-01T00:00:00.000Z" }), "");
  assert.equal(assignedCloth({ campaign: "Spring", lastSeenAt: "2026-01-01T00:00:00.000Z" }), "");
  assert.equal(assignedCloth({ campaign: "Spring", timezone: "Europe/Berlin" }), "");
  assert.equal(assignedCloth({ campaign: "Spring", language: "de" }), "");
  assert.equal(assignedCloth({ campaign: "Spring", country: "DE" }), "");
  assert.equal(assignedCloth({ campaign: "Spring", name: "Ada" }), "");
  assert.equal(assignedCloth({ campaign: "Spring", email: "a@b.c" }), "");
  assert.equal(assignedCloth({ campaign: "Spring", phone: "1" }), "");
  assert.equal(assignedCloth({ campaign: "Spring", desk: "North" }), "");
  assert.equal(assignedCloth({ campaign: "Spring", address: "1 Road" }), "");
  assert.equal(assignedCloth({ campaign: "Spring", city: "Berlin" }), "");
  assert.equal(assignedCloth({ campaign: "Spring", firstName: "Ada" }), "");
  assert.equal(assignedCloth({ campaign: "Spring", lastName: "North" }), "");
  assert.equal(assignedCloth({ campaign: "Spring", lastCountryName: "Germany" }), "");
  assert.equal(assignedCloth({ campaign: "Spring", createdAt: "2026-01-01T00:00:00.000Z" }), "");
  assert.equal(lengthOf("ok"), "brief");
  assert.equal(lengthOf("Spring"), "name");
  assert.equal(lengthOf("WinterCampaign"), "long");
  assert.equal(lengthOf(""), "");
  assert.equal(glyphOf("Spring"), "letter");
  assert.equal(glyphOf("2026"), "digit");
  assert.equal(glyphOf("-vip"), "mark");
  assert.equal(glyphOf("Çağrı"), "letter");
  assert.equal(glyphOf(""), "");
  assert.equal(foldOf("Spring"), "plain");
  assert.equal(foldOf("Spring Sale"), "split");
  assert.equal(foldOf("VIP-1"), "coded");
  assert.equal(foldOf("-vip"), "split");
  assert.equal(foldOf(""), "");
  const rows = [
    { campaign: "Spring", label: "Ada North" },
    { campaign: "Spring", label: "Bea South" },
    { campaign: "Spring", label: "Ann Extra" },
    { campaign: "ok", label: "Ann West" },
    { campaign: "Spring Sale", label: "Chris East" },
    { campaign: "2026", label: "Uma" },
    { campaign: "not", label: "Mark" },
    { campaign: "WinterCampaign", label: "West" },
    { campaign: "-vip", label: "Otto" },
    { campaign: "4ada", label: "Mark" },
    { campaign: "", label: "Blank" },
  ];
  assert.equal(leadingCloth(rows), "Spring");
  assert.equal(leadingLength(rows), "brief");
  assert.equal(clothShare(2, 6), 33);
  assert.equal(clothShare(0, 0), 0);
  assert.deepEqual(namedLengths(rows), ["brief", "name", "long"]);
  assert.deepEqual(namedGlyphs(rows), ["letter", "digit", "mark"]);
  assert.deepEqual(namedFolds(rows), ["plain", "split", "coded"]);
  assert.deepEqual(namedCloths(rows).slice(0, 2), ["-vip", "2026"]);
  assert.equal(visibleClothCustomers(rows, "name", null, null, null, "north").length, 1);
  assert.equal(visibleClothCustomers(rows, null, "letter", "plain", null, "").length, 6);
  assert.equal(visibleClothCustomers(rows, null, null, null, "Spring", "").length, 3);
  assert.equal(visibleClothCustomers([{ campaign: "Spring", label: "North" }], null, null, null, null, "france").length, 0);
  assert.deepEqual(readHiddenCloths(["Spring", "spring", "9"], ["Spring", "ok"]), ["Spring"]);
  assert.deepEqual(toggleCloth(["Spring"], "ok", ["Spring", "ok"]), ["Spring", "ok"]);
  assert.deepEqual(toggleCloth(["Spring"], "Spring", ["Spring", "ok"]), []);
  assert.deepEqual(toggleCloth([], "ok", ["Spring", "ok"]), ["ok"]);
  assert.deepEqual(visibleCloths(["Spring", "ok"], ["Spring"], false), ["ok"]);
  assert.deepEqual(visibleCloths(["Spring", "ok"], ["Spring"], true), ["Spring"]);
  assert.equal(activeCloth("gone", ["Spring"]), "all");
  assert.equal(activeCloth("blank", ["Spring"]), "blank");
  assert.equal(clothArg("Spring"), "Spring");
  assert.equal(clothArg("blank"), "");
  assert.equal(clothArg("all"), null);
  assert.equal(activeLength("gone", ["brief"]), "all");
  assert.equal(lengthArg("brief"), "brief");
  assert.equal(lengthArg("blank"), "");
  assert.equal(activeGlyph("gone", ["letter"]), "all");
  assert.equal(glyphArg("letter"), "letter");
  assert.equal(glyphArg("blank"), "");
  assert.equal(activeFold("gone", ["plain"]), "all");
  assert.equal(foldArg("plain"), "plain");
  assert.equal(foldArg("blank"), "");
  const names = clothsCsv(rows);
  assert.equal(names.startsWith("kind,mark,count"), true);
  assert.equal(clothsCsv([]), "kind,mark,count");
  assert.equal(names.includes("amount"), false);
  assert.equal(names.includes(",brief,"), true);
  assert.equal(names.includes(",Spring,"), true);

  const copy = Object.keys(ROUND160_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND160_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "bstTitle"), "Backstaff sights");
  assert.equal(crmv4Text("tr", "cclTitle"), ROUND160_COPY.tr.cclTitle);
  assert.equal(crmv4Text("de", "bstBinder"), ROUND160_COPY.de.bstBinder);
  assert.equal(crmv4Text("ru", "cclUnmarked"), ROUND160_COPY.ru.cclUnmarked);
  assert.equal(crmv4Text("ar", "bstNotice"), "متأخر على السطح المفتوح");
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-bst/);
  assert.match(css, /\.c4-ccl/);
  assert.match(css, /\.c4-foot-cellar/);
  assert.match(css, /\.c4-tabs-cellar/);
  assert.match(css, /\.c4-pagehead-hearth/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round160.tsx"), "utf8");
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
  assert.match(viewFile, /campaign/);
  assert.match(viewFile, /stitchesCsv/);
  assert.match(viewFile, /clothsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "b"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-stitches/);
  assert.match(viewFile, /data-cloths/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "stitch"/);
  assert.match(app, /view === "cloth"/);
  assert.match(app, /c4-tabs-cellar/);
  assert.match(app, /c4-pagehead-hearth/);
  assert.match(app, /c4-rail-hearth/);
  const foot = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round18.tsx"), "utf8");
  assert.match(foot, /c4-foot-cellar/);
  console.log("crmv4 round160 tests passed");
}

main();
