/**
 * Playbill cards and invalid sources.
 * Run: npx tsx tests/crmv4-round144.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND144_COPY } from "../src/lib/crmv4/copy-round144";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  actArg,
  actBand,
  actCount,
  actGap,
  actThird,
  actThirdCounts,
  activeAct,
  activeCue,
  activeKind,
  activePlayer,
  activeSource,
  activeSourceMark,
  activeSpan,
  activeTone,
  activeWing,
  addPlaybill,
  addPlaybillView,
  bulkPlaybillDone,
  bulkPlaybillPinned,
  cueArg,
  dropPlaybillView,
  editPlaybill,
  kindArg,
  kindOf,
  leadingKind,
  leadingSource,
  leadingSourceMark,
  leadingSpan,
  namedKinds,
  namedSourceMarks,
  namedSources,
  namedSpans,
  nextPlaybill,
  playbillClashIds,
  playbillCopy,
  playbillCounts,
  playbillCues,
  playbillPlayers,
  playbillShare,
  playbillTimeline,
  playbillTones,
  playbillWings,
  playbillsCsv,
  playbillText,
  playerArg,
  playerLabel,
  cueTag,
  readHiddenSources,
  readPlaybillViews,
  readPlaybills,
  resetPlaybills,
  setPlaybillDone,
  setPlaybillHeld,
  setPlaybillPinned,
  sourceMarkArg,
  sourceMarkOf,
  sourceShare,
  sourceText,
  sourcesCsv,
  spanArg,
  spanLines,
  spanOf,
  stepPlaybillTone,
  toggleSource,
  toneArg,
  toneOf,
  visiblePlaybills,
  visibleSourceCustomers,
  visibleSources,
  wingArg,
  wingOf,
} from "../src/lib/crmv4/round144";

function main() {
  assert.equal(playbillText("  Call\nAda  "), "Call Ada");
  assert.equal(playbillText("   "), "");
  assert.equal(playbillText("x".repeat(120)).length, 80);
  assert.equal(playerLabel("  North  "), "North");
  assert.equal(playerLabel("   "), "");
  assert.equal(playerLabel("y".repeat(40)).length, 18);
  assert.equal(cueTag("  VIP  "), "VIP");
  assert.equal(cueTag("   "), "");
  assert.equal(cueTag("z".repeat(30)).length, 12);
  assert.equal(actCount(" 1 "), 1);
  assert.equal(actCount(1), 1);
  assert.equal(actCount(5), 5);
  assert.equal(actCount("3"), 3);
  assert.equal(actCount(""), null);
  assert.equal(actCount("0"), null);
  assert.equal(actCount(0), null);
  assert.equal(actCount("01"), null);
  assert.equal(actCount(6), null);
  assert.equal(wingOf(" PIT "), "pit");
  assert.equal(wingOf("box"), "box");
  assert.equal(wingOf("circle"), "circle");
  assert.equal(wingOf("gallery"), "gallery");
  assert.equal(wingOf(""), "blank");
  assert.equal(wingOf("up"), "blank");
  assert.equal(toneOf(" WARM "), "warm");
  assert.equal(toneOf("hush"), "hush");
  assert.equal(toneOf("bright"), "bright");
  assert.equal(toneOf(""), "blank");
  assert.equal(toneOf("loud"), "blank");
  assert.equal(actBand(null), "blank");
  assert.equal(actBand(1), "opening");
  assert.equal(actBand(2), "opening");
  assert.equal(actBand(3), "hinge");
  assert.equal(actBand(4), "finale");
  assert.equal(actBand(5), "finale");
  assert.equal(actThird(null), "blank");
  assert.equal(actThird(1), "i");
  assert.equal(actThird(2), "ii");
  assert.equal(actThird(3), "ii");
  assert.equal(actThird(4), "iii");
  assert.equal(actThird(5), "iii");
  assert.equal(actGap(1, 4), 3);
  assert.equal(actGap(4, 1), -3);
  assert.equal(actGap(2, 2), 0);
  assert.equal(actGap(null, 3), null);
  assert.equal(actGap(3, ""), null);
  assert.deepEqual(readPlaybills([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Call Ada", player: "  ", act: 0, wing: "up", cue: "  ", tone: "loud", pinned: 1, done: 1, held: 1, audit: "nope" }, "nope"]), [
    { id: "2", text: "Call Ada", player: "", act: null, wing: "", cue: "", tone: "", pinned: false, done: false, held: false, audit: "" },
  ]);
  assert.equal(readPlaybills([{ id: "z", text: "One", act: 1 }])[0].act, 1);
  const saved = addPlaybill([], { id: "a", text: "Call Ada", player: "Nia", act: 1, wing: "pit", cue: "VIP", tone: "warm" });
  assert.equal(saved[0].audit, "save");
  assert.equal(saved[0].act, 1);
  assert.equal(saved[0].wing, "pit");
  assert.equal(saved[0].tone, "warm");
  assert.equal(addPlaybill(saved, { id: "b", text: "Call Ada" }).length, 1);
  assert.equal(addPlaybill(saved, { id: "a", text: "Other" }).length, 1);
  assert.equal(addPlaybill(saved, { id: "b", text: "   " }).length, 1);
  const raised = stepPlaybillTone(saved, "a", 1);
  assert.equal(raised[0].tone, "bright");
  assert.equal(raised[0].audit, "raise");
  assert.equal(stepPlaybillTone(raised, "a", 1)[0].tone, "bright");
  assert.equal(stepPlaybillTone([{ ...saved[0], tone: "" }], "a", -1)[0].tone, "");
  const pinned = setPlaybillPinned(saved, "a", true);
  assert.equal(pinned[0].pinned, true);
  assert.equal(pinned[0].audit, "pin");
  assert.equal(setPlaybillPinned(pinned, "a", false)[0].audit, "unpin");
  const held = setPlaybillHeld(saved, "a", true);
  assert.equal(held[0].held, true);
  assert.equal(held[0].audit, "hold");
  assert.equal(setPlaybillHeld(held, "a", false)[0].audit, "release");
  const done = setPlaybillDone(saved, "a", true);
  assert.equal(done[0].done, true);
  assert.equal(done[0].audit, "done");
  assert.equal(setPlaybillDone(done, "a", false)[0].audit, "reopen");
  assert.equal(editPlaybill(saved, "a", "  ")[0].text, "Call Ada");
  assert.equal(editPlaybill(addPlaybill(saved, { id: "b", text: "Other" }), "a", "Other").find((card) => card.id === "a")?.text, "Call Ada");
  assert.equal(editPlaybill(saved, "a", "Ring Ada")[0].audit, "edit");
  const pair = addPlaybill(saved, { id: "b", text: "Ring", act: 3, wing: "pit" });
  assert.equal(bulkPlaybillPinned(pair, ["a", "b"], true).every((card) => card.pinned), true);
  assert.equal(bulkPlaybillDone(pair, ["b"], true).find((card) => card.id === "b")?.done, true);
  assert.deepEqual(resetPlaybills(), []);
  assert.equal(playbillCopy("  Call Ada "), "Call Ada");
  assert.equal(playbillCopy(" "), "");
  const open = visiblePlaybills(pair, "open", "call", null, null, null, null, null, null, false, false, "");
  assert.equal(open.length, 1);
  assert.equal(open[0].id, "a");
  assert.equal(visiblePlaybills(held, "held", "", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visiblePlaybills(done, "done", "", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visiblePlaybills(done, "open", "", null, null, null, null, null, null, false, false, "").length, 0);
  assert.equal(visiblePlaybills(pair, "open", "", "", null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visiblePlaybills(pair, "open", "", "Nia", "pit", "VIP", "warm", 1, null, false, false, "").length, 1);
  assert.equal(visiblePlaybills(pair, "open", "nia", null, null, null, null, null, null, false, false, "").length, 0);
  assert.equal(visiblePlaybills(raised, "open", "", null, null, null, null, null, null, true, false, "").length, 1);
  assert.equal(visiblePlaybills(saved, "open", "", null, null, null, null, null, null, true, false, "").length, 0);
  const late = visiblePlaybills(pair, "open", "", null, null, null, null, null, null, false, true, 2);
  assert.equal(late.length, 1);
  assert.equal(late[0].id, "a");
  assert.equal(visiblePlaybills(held, "open", "", null, null, null, null, null, null, false, true, 5).length, 0);
  assert.deepEqual(playbillTimeline(pair, "").map((card) => card.id), ["a", "b"]);
  assert.deepEqual(playbillTimeline(addPlaybill(pair, { id: "c", text: "Blank" }), "").map((card) => card.act === null).at(-1), true);
  const counts = playbillCounts(addPlaybill(pinned, { id: "b", text: "Later", act: 4 }), 2);
  assert.equal(counts.open, 2);
  assert.equal(counts.pinned, 1);
  assert.equal(counts.late, 1);
  assert.equal(playbillShare(1, 4), 25);
  assert.equal(playbillShare(0, 0), 0);
  assert.deepEqual(playbillPlayers(saved), ["Nia"]);
  assert.deepEqual(playbillCues(saved), ["VIP"]);
  assert.deepEqual(playbillWings(pair), ["pit"]);
  assert.deepEqual(playbillTones(saved), ["warm"]);
  assert.deepEqual(actThirdCounts(pair), [1, 1, 0]);
  assert.equal(activePlayer("gone", ["Nia"]), "all");
  assert.equal(activePlayer("blank", ["Nia"]), "blank");
  assert.equal(activePlayer("Nia", ["Nia"]), "Nia");
  assert.equal(playerArg("blank"), "");
  assert.equal(playerArg("all"), null);
  assert.equal(playerArg("Nia"), "Nia");
  assert.equal(activeWing("up", ["pit"]), "all");
  assert.equal(activeWing("pit", ["pit"]), "pit");
  assert.equal(wingArg("blank"), "blank");
  assert.equal(wingArg("pit"), "pit");
  assert.equal(wingArg("nope"), null);
  assert.equal(activeCue("gone", ["VIP"]), "all");
  assert.equal(activeCue("VIP", ["VIP"]), "VIP");
  assert.equal(cueArg("blank"), "");
  assert.equal(cueArg("VIP"), "VIP");
  assert.equal(activeTone("loud", ["warm"]), "all");
  assert.equal(activeTone("warm", ["warm"]), "warm");
  assert.equal(toneArg("blank"), "blank");
  assert.equal(toneArg("bright"), "bright");
  assert.equal(toneArg("nope"), null);
  assert.equal(activeAct("opening"), "opening");
  assert.equal(activeAct("iii"), "iii");
  assert.equal(activeAct("1"), "1");
  assert.equal(activeAct("0"), "all");
  assert.deepEqual(actArg("1"), { exact: 1, band: null });
  assert.deepEqual(actArg("opening"), { exact: null, band: "opening" });
  assert.deepEqual(actArg("ii"), { exact: null, band: "ii" });
  assert.deepEqual(actArg("all"), { exact: null, band: null });
  const clash = addPlaybill(pair, { id: "c", text: "Same", act: 1, wing: "pit" });
  assert.deepEqual(playbillClashIds(clash, "a"), ["c"]);
  assert.deepEqual(playbillClashIds(pair, "b"), []);
  assert.equal(nextPlaybill(pair, 1), "a");
  assert.equal(nextPlaybill(pair, 2), "b");
  assert.equal(nextPlaybill(pair, 4), "a");
  assert.equal(nextPlaybill(pair, ""), "");
  assert.equal(nextPlaybill(done, 1), "");
  const csv = playbillsCsv(saved, 4);
  assert.equal(csv.startsWith("note,player,act,wing,cue,tone,band,pinned,done,held,gap,audit\n"), true);
  assert.equal(csv.includes("1,pit,VIP,warm,opening"), true);
  assert.match(csv, /,3,save$/);
  const views = addPlaybillView([], { id: "v", name: "Morning", tray: "open", query: "ada", player: "Nia", wing: "pit", cue: "VIP", tone: "warm", act: "1" });
  assert.equal(views[0].act, "1");
  assert.equal(addPlaybillView(views, { id: "v2", name: "Morning", tray: "held", query: "", player: "all", wing: "all", cue: "all", tone: "all", act: "all" }).length, 1);
  assert.equal(readPlaybillViews([{ id: "v", name: "Desk", tray: "nope", act: "nope" }])[0].act, "all");
  assert.equal(dropPlaybillView(views, "v").length, 0);

  const rows = [
    { source: "MANUAL", label: "Ada" },
    { source: "AUTO", label: "Bea" },
    { source: "HANDWRITTEN", label: "Eve" },
    { source: "", label: "No" },
    { source: { leadInvalidSource: "SCRIPT", saleStatus: "x" }, label: "Blocked" },
    { source: { leadInvalidSource: "MANUAL" }, label: "Wes" },
  ];
  assert.equal(sourceText("  MANUAL  "), "MANUAL");
  assert.equal(sourceText({ leadInvalidSource: "MANUAL" }), "MANUAL");
  assert.equal(sourceText({ leadInvalidSource: "MANUAL", saleStatus: "x" }), "");
  assert.equal(sourceText({ leadInvalidSource: "MANUAL", leadInvalidReason: "INV_TRASH" }), "");
  assert.equal(sourceText({ leadInvalidReason: "INV_TRASH" }), "");
  assert.equal(kindOf("MANUAL"), "hand");
  assert.equal(kindOf("AUTO"), "clock");
  assert.equal(kindOf("SCRIPT"), "other");
  assert.equal(kindOf(""), "");
  assert.equal(spanOf("AUTO"), "brief");
  assert.equal(spanOf("MANUAL"), "full");
  assert.equal(spanOf("HANDWRITTEN"), "wide");
  assert.equal(spanOf(""), "");
  assert.equal(sourceMarkOf("AUTO"), "A");
  assert.equal(sourceMarkOf("MANUAL"), "M");
  assert.equal(sourceMarkOf("Île"), "#");
  assert.equal(sourceMarkOf(""), "");
  assert.equal(namedSources(rows).includes("MANUAL"), true);
  assert.equal(namedSources(rows).includes(""), false);
  assert.equal(leadingSource(rows), "MANUAL");
  assert.equal(leadingKind([{ source: "MANUAL" }, { source: "MANUAL" }, { source: "AUTO" }]), "hand");
  assert.equal(leadingSpan([{ source: "MANUAL" }, { source: "HANDWRITTEN" }]), "full");
  assert.equal(leadingSourceMark([{ source: "MANUAL" }, { source: "MANUAL" }, { source: "AUTO" }, { source: "" }]), "M");
  assert.equal(sourceShare(1, 4), 25);
  assert.equal(sourceShare(0, 4), 0);
  assert.deepEqual(readHiddenSources(["MANUAL", "gone", "MANUAL"], ["MANUAL", "AUTO"]), ["MANUAL"]);
  assert.deepEqual(toggleSource(["MANUAL"], "AUTO", ["MANUAL", "AUTO"]), ["MANUAL", "AUTO"]);
  assert.deepEqual(toggleSource(["MANUAL"], "MANUAL", ["MANUAL"]), []);
  assert.deepEqual(visibleSources(["MANUAL", "AUTO"], ["AUTO"], false), ["AUTO", "MANUAL"].sort((a, b) => a.localeCompare(b)).filter((item) => item !== "AUTO"));
  assert.deepEqual(visibleSources(["MANUAL", "AUTO"], ["AUTO"], true), ["AUTO"]);
  assert.equal(activeSource("AUTO", ["MANUAL"]), "");
  assert.equal(activeSource("MANUAL", ["MANUAL"]), "MANUAL");
  assert.equal(activeKind("missing", ["hand"]), "all");
  assert.equal(activeKind("blank", ["hand"]), "blank");
  assert.equal(activeKind("hand", ["hand"]), "hand");
  assert.equal(kindArg("all"), null);
  assert.equal(kindArg("blank"), "");
  assert.equal(kindArg("clock"), "clock");
  assert.equal(kindArg("nope"), null);
  assert.equal(activeSpan("missing", ["brief"]), "all");
  assert.equal(activeSpan("full", ["full"]), "full");
  assert.equal(spanArg("blank"), "");
  assert.equal(spanArg("wide"), "wide");
  assert.equal(spanArg("nope"), null);
  assert.equal(activeSourceMark("gone", ["M"]), "all");
  assert.equal(activeSourceMark("#", ["#"]), "#");
  assert.equal(activeSourceMark("#", ["M"]), "all");
  assert.equal(sourceMarkArg("all"), null);
  assert.equal(sourceMarkArg("blank"), "");
  assert.equal(sourceMarkArg("#"), "#");
  assert.equal(sourceMarkArg("m"), "M");
  const shown = visibleSourceCustomers(rows, "", false, "hand", "full", null, "wes");
  assert.equal(shown.length, 1);
  assert.equal(shown[0].label, "Wes");
  assert.equal(visibleSourceCustomers(rows, "", true, null, null, null, "blocked").length, 1);
  assert.equal(visibleSourceCustomers(rows, "MANUAL", false, null, null, null, "").length, 2);
  assert.equal(visibleSourceCustomers(rows, "", false, null, null, "H", "eve").length, 1);
  assert.equal(sourcesCsv(rows).startsWith("source,kind,span,letter,count\n"), true);
  assert.equal(sourcesCsv([]), "source,kind,span,letter,count");
  assert.equal(sourcesCsv(rows).includes("amount"), false);
  assert.equal(spanLines(rows).some((line) => line.span === "brief"), true);
  assert.equal(namedKinds(rows).includes("hand"), true);
  assert.equal(namedSpans(rows).includes("full"), true);
  assert.equal(namedSourceMarks(rows).includes("M"), true);

  const copy = Object.keys(ROUND144_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND144_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "plyTitle"), "Playbill cards");
  assert.equal(crmv4Text("tr", "ivsTitle"), ROUND144_COPY.tr.ivsTitle);
  assert.equal(crmv4Text("de", "plyPlayer"), ROUND144_COPY.de.plyPlayer);
  assert.equal(crmv4Text("ru", "ivsBlank"), ROUND144_COPY.ru.ivsBlank);
  assert.equal(crmv4Text("ar", "plyNotice"), ROUND144_COPY.ar.plyNotice);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-ply/);
  assert.match(css, /\.c4-ivs/);
  assert.match(css, /\.c4-pagehead-playbill/);
  assert.match(css, /\.c4-rail-playbill/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round144.tsx"), "utf8");
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
  assert.match(view, /leadInvalidSource/);
  assert.match(view, /playbillsCsv/);
  assert.match(view, /sourcesCsv/);
  assert.match(view, /Escape/);
  assert.match(view, /event\.key !== "\/"/);
  assert.match(view, /event\.key === "n"/);
  assert.match(view, /storedRole/);
  assert.match(view, /data-role/);
  assert.match(view, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(view, /data-playbill/);
  assert.match(view, /data-ivsource/);
  assert.match(view, /data-logo="mono"/);
  assert.match(view, /customers/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "playbill"/);
  assert.match(app, /view === "ivsource"/);
  assert.match(app, /c4-pagehead-playbill/);
  assert.match(app, /c4-rail-playbill/);
  assert.match(app, /c4-pagehead-ribbon/);
  assert.match(app, /c4-rail-ribbon/);
  console.log("crmv4 round144 tests passed");
}

main();
