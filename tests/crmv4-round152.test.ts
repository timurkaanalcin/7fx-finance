/**
 * Loom tickets and login bands.
 * Run: npx tsx tests/crmv4-round152.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND152_COPY } from "../src/lib/crmv4/copy-round152";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeCloth,
  activeDay,
  activeDigit,
  activeFit,
  activeParity,
  activeSeal,
  activeTempo,
  activeWeaver,
  addLoom,
  addLoomView,
  assignedLogin,
  bandShare,
  bandsCsv,
  bulkLoomFiled,
  bulkLoomPinned,
  clothArg,
  dayArg,
  dayGap,
  dayOf,
  dayPair,
  digitArg,
  digitOf,
  dropLoomView,
  editLoom,
  fitArg,
  fitOf,
  leadingDigit,
  leadingFit,
  loomClashIds,
  loomCloths,
  loomCopy,
  loomCounts,
  loomSeals,
  loomShare,
  loomTempos,
  loomText,
  loomTimeline,
  loomWeavers,
  loomsCsv,
  namedDigits,
  namedFits,
  namedParities,
  nextLoom,
  parityArg,
  parityOf,
  quarterCounts,
  quarterOf,
  readHiddenDigits,
  readLoomViews,
  readLooms,
  resetLooms,
  sealArg,
  sealMark,
  setLoomFiled,
  setLoomHeld,
  setLoomPinned,
  stepLoomTempo,
  tempoArg,
  tempoOf,
  toggleDigit,
  visibleDigits,
  visibleLoginCustomers,
  visibleLooms,
  weaverArg,
  weaverLabel,
  clothOf,
} from "../src/lib/crmv4/round152";

const FULL = "1".repeat(16);
const FULL_EVEN = `${"1".repeat(15)}8`;

function main() {
  assert.equal(loomText("  Call\nAda  "), "Call Ada");
  assert.equal(loomText("   "), "");
  assert.equal(loomText("x".repeat(120)).length, 64);
  assert.equal(weaverLabel("  North  "), "North");
  assert.equal(weaverLabel("   "), "");
  assert.equal(weaverLabel("y".repeat(40)).length, 14);
  assert.equal(sealMark("  VIP  "), "VIP");
  assert.equal(sealMark("   "), "");
  assert.equal(sealMark("z".repeat(30)).length, 8);
  assert.equal(dayOf(" 1 "), 1);
  assert.equal(dayOf(1), 1);
  assert.equal(dayOf("28"), 28);
  assert.equal(dayOf(28), 28);
  assert.equal(dayOf(""), null);
  assert.equal(dayOf("29"), null);
  assert.equal(dayOf("0"), null);
  assert.equal(dayOf(0), null);
  assert.equal(dayOf("01"), null);
  assert.equal(dayOf(-1), null);
  assert.equal(dayOf(1.5), null);
  assert.equal(clothOf(" SILK "), "silk");
  assert.equal(clothOf("linen"), "linen");
  assert.equal(clothOf("wool"), "wool");
  assert.equal(clothOf("velvet"), "velvet");
  assert.equal(clothOf(""), "blank");
  assert.equal(clothOf("pit"), "blank");
  assert.equal(tempoOf(" HUSH "), "hush");
  assert.equal(tempoOf("even"), "even");
  assert.equal(tempoOf("brisk"), "brisk");
  assert.equal(tempoOf(""), "blank");
  assert.equal(tempoOf("gold"), "blank");
  assert.equal(quarterOf(null), "blank");
  assert.equal(quarterOf(1), "opening");
  assert.equal(quarterOf(7), "opening");
  assert.equal(quarterOf(8), "rising");
  assert.equal(quarterOf(14), "rising");
  assert.equal(quarterOf(15), "settling");
  assert.equal(quarterOf(21), "settling");
  assert.equal(quarterOf(22), "closing");
  assert.equal(quarterOf(28), "closing");
  assert.equal(dayPair(null), "blank");
  assert.equal(dayPair(1), "odd");
  assert.equal(dayPair(2), "even");
  assert.equal(dayPair(8), "even");
  assert.equal(dayGap(8, 9), 1);
  assert.equal(dayGap(18, 9), -9);
  assert.equal(dayGap(8, 8), 0);
  assert.equal(dayGap(null, 9), null);
  assert.equal(dayGap(8, ""), null);
  assert.equal(dayGap(8, 29), null);
  assert.deepEqual(readLooms([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Call Ada", weaver: "  ", day: 29, cloth: "pit", seal: "  ", tempo: "gold", pinned: 1, filed: 1, held: 1, audit: "nope" }, "nope"]), [
    { id: "2", text: "Call Ada", weaver: "", day: null, cloth: "", seal: "", tempo: "", pinned: false, filed: false, held: false, audit: "" },
  ]);
  assert.equal(readLooms([{ id: "z", text: "One", day: 1 }])[0].day, 1);
  assert.equal(readLooms([{ id: "z", text: "One", day: "01" }])[0].day, null);
  const saved = addLoom([], { id: "a", text: "Call Ada", weaver: "Nia", day: 8, cloth: "silk", seal: "VIP", tempo: "hush" });
  assert.equal(saved[0].audit, "save");
  assert.equal(saved[0].day, 8);
  assert.equal(saved[0].cloth, "silk");
  assert.equal(saved[0].tempo, "hush");
  assert.equal(addLoom(saved, { id: "b", text: "Call Ada" }).length, 1);
  assert.equal(addLoom(saved, { id: "a", text: "Other" }).length, 1);
  assert.equal(addLoom(saved, { id: "b", text: "   " }).length, 1);
  const raised = stepLoomTempo(saved, "a", 1);
  assert.equal(raised[0].tempo, "even");
  assert.equal(raised[0].audit, "raise");
  assert.equal(stepLoomTempo(raised, "a", 1)[0].tempo, "brisk");
  assert.equal(stepLoomTempo([{ ...saved[0], tempo: "brisk" }], "a", 1)[0].tempo, "brisk");
  assert.equal(stepLoomTempo([{ ...saved[0], tempo: "" }], "a", -1)[0].tempo, "");
  const pinned = setLoomPinned(saved, "a", true);
  assert.equal(pinned[0].pinned, true);
  assert.equal(pinned[0].audit, "pin");
  assert.equal(setLoomPinned(pinned, "a", false)[0].audit, "unpin");
  const held = setLoomHeld(saved, "a", true);
  assert.equal(held[0].held, true);
  assert.equal(held[0].audit, "hold");
  const filed = setLoomFiled(saved, "a", true);
  assert.equal(filed[0].filed, true);
  assert.equal(filed[0].audit, "file");
  assert.equal(setLoomFiled(filed, "a", false)[0].audit, "reopen");
  const edited = editLoom(saved, "a", "Call Bea");
  assert.equal(edited[0].text, "Call Bea");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editLoom(saved, "a", "  ")[0].text, "Call Ada");
  const pair = addLoom(saved, { id: "b", text: "Later", day: 18, cloth: "velvet" });
  assert.equal(editLoom(pair, "b", "Call Ada")[0].text, "Later");
  const bulkPin = bulkLoomPinned(pair, ["b", ""], true);
  assert.equal(bulkPin[0].pinned, true);
  assert.equal(bulkPin[1].pinned, false);
  assert.equal(bulkLoomFiled(pair, ["a"], true)[1].filed, true);
  assert.deepEqual(resetLooms(), []);
  assert.equal(loomCopy("  Call Ada "), "Call Ada");
  assert.equal(loomCopy(" "), "");
  const shown = visibleLooms(pair, "open", "ada", null, null, null, null, null, null, false, false, 9);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].id, "a");
  assert.equal(visibleLooms(pair, "open", "nia", null, null, null, null, null, null, false, false, 9).length, 0);
  assert.equal(visibleLooms(held, "held", "", null, null, null, null, null, null, false, false, 9).length, 1);
  assert.equal(visibleLooms(filed, "open", "", null, null, null, null, null, null, false, false, 9).length, 0);
  assert.equal(visibleLooms(pair, "open", "", "Nia", "silk", "VIP", "hush", 8, null, false, false, 9).length, 1);
  assert.equal(visibleLooms(pair, "open", "", null, null, null, null, null, "rising", false, false, 9).length, 1);
  assert.equal(visibleLooms(pair, "open", "", null, null, null, null, null, "even", false, false, 9).length, 2);
  assert.equal(visibleLooms(raised, "open", "", null, null, null, null, null, null, true, false, 9).length, 0);
  assert.equal(visibleLooms(stepLoomTempo(raised, "a", 1), "open", "", null, null, null, null, null, null, true, false, 9).length, 1);
  assert.equal(visibleLooms(pair, "open", "", null, null, null, null, null, null, false, true, 9).length, 1);
  assert.deepEqual(loomTimeline(pair, "").map((card) => card.id), ["a", "b"]);
  assert.deepEqual(loomTimeline(addLoom(pair, { id: "c", text: "Blank" }), "").map((card) => card.day === null).at(-1), true);
  const counts = loomCounts(addLoom(pinned, { id: "b", text: "Later", day: 18 }), 9);
  assert.equal(counts.open, 2);
  assert.equal(counts.pinned, 1);
  assert.equal(counts.late, 1);
  assert.equal(loomShare(1, 4), 25);
  assert.equal(loomShare(0, 0), 0);
  assert.deepEqual(loomWeavers(saved), ["Nia"]);
  assert.deepEqual(loomSeals(saved), ["VIP"]);
  assert.deepEqual(loomCloths(pair), ["silk", "velvet"]);
  assert.deepEqual(loomTempos(saved), ["hush"]);
  assert.deepEqual(quarterCounts(pair), [0, 1, 1, 0]);
  assert.equal(activeWeaver("missing", ["Nia"]), "all");
  assert.equal(activeWeaver("blank", ["Nia"]), "blank");
  assert.equal(activeWeaver("Nia", ["Nia"]), "Nia");
  assert.equal(weaverArg("all"), null);
  assert.equal(weaverArg("blank"), "");
  assert.equal(weaverArg("Nia"), "Nia");
  assert.equal(activeCloth("missing", ["silk"]), "all");
  assert.equal(activeCloth("silk", ["silk"]), "silk");
  assert.equal(clothArg("blank"), "blank");
  assert.equal(clothArg("velvet"), "velvet");
  assert.equal(clothArg("pit"), null);
  assert.equal(activeSeal("missing", ["VIP"]), "all");
  assert.equal(activeSeal("VIP", ["VIP"]), "VIP");
  assert.equal(sealArg("blank"), "");
  assert.equal(sealArg("VIP"), "VIP");
  assert.equal(activeTempo("gone", ["hush"]), "all");
  assert.equal(activeTempo("brisk", ["brisk"]), "brisk");
  assert.equal(tempoArg("blank"), "blank");
  assert.equal(tempoArg("even"), "even");
  assert.equal(tempoArg("gold"), null);
  assert.equal(activeDay("missing"), "all");
  assert.equal(activeDay("blank"), "blank");
  assert.equal(activeDay("rising"), "rising");
  assert.equal(activeDay("1"), "1");
  assert.equal(activeDay("8"), "8");
  assert.equal(activeDay("28"), "28");
  assert.equal(activeDay("29"), "all");
  assert.equal(activeDay("0"), "all");
  assert.equal(activeDay("01"), "all");
  assert.deepEqual(dayArg("odd"), { exact: null, band: "odd" });
  assert.deepEqual(dayArg("1"), { exact: 1, band: null });
  assert.deepEqual(dayArg("8"), { exact: 8, band: null });
  assert.deepEqual(dayArg("nope"), { exact: null, band: null });
  const clash = addLoom(pair, { id: "c", text: "Same", day: 8, cloth: "silk" });
  assert.deepEqual(loomClashIds(clash, "a"), ["c"]);
  assert.deepEqual(loomClashIds(addLoom(saved, { id: "d", text: "Open cloth" }), "a"), []);
  assert.equal(nextLoom(pair, 9), "b");
  assert.equal(nextLoom(pair, 18), "b");
  assert.equal(nextLoom(pair, 19), "a");
  assert.equal(nextLoom(pair, ""), "");
  const csv = loomsCsv(saved, 9);
  assert.equal(csv.startsWith("note,weaver,day,cloth,seal,tempo,quarter,pinned,held,filed,gap,audit\n"), true);
  assert.equal(csv.includes("Nia"), true);
  assert.equal(csv.includes("amount"), false);
  const view = addLoomView([], { id: "v", name: "Rising", tray: "open", query: "ada", weaver: "Nia", cloth: "silk", seal: "VIP", tempo: "hush", day: "8" });
  assert.equal(view[0].day, "8");
  assert.equal(addLoomView(view, { id: "v2", name: "Rising", tray: "open", query: "", weaver: "all", cloth: "all", seal: "all", tempo: "all", day: "all" }).length, 1);
  assert.equal(dropLoomView(view, "v").length, 0);
  assert.equal(readLoomViews([{ id: "v", name: "  " }]).length, 0);

  assert.equal(assignedLogin(` ${FULL} `), FULL);
  assert.equal(assignedLogin(""), "");
  assert.equal(assignedLogin("x".repeat(40)).length, 16);
  assert.equal(assignedLogin({ accountLoginId: FULL }), FULL);
  assert.equal(assignedLogin({ accountLoginId: FULL, name: "Ada" }), "");
  assert.equal(assignedLogin({ accountLoginId: FULL, email: "a@b.c" }), "");
  assert.equal(assignedLogin({ accountLoginId: FULL, phone: "1" }), "");
  assert.equal(digitOf(FULL), "1");
  assert.equal(digitOf("42"), "4");
  assert.equal(digitOf("012"), "");
  assert.equal(digitOf(""), "");
  assert.equal(digitOf({ accountLoginId: FULL, name: "A" }), "");
  assert.equal(fitOf(FULL), "full");
  assert.equal(fitOf("42"), "short");
  assert.equal(fitOf("abc"), "other");
  assert.equal(fitOf(""), "");
  assert.equal(parityOf(FULL), "odd");
  assert.equal(parityOf("42"), "even");
  assert.equal(parityOf(""), "");
  const rows = [
    { label: "Ada", login: FULL },
    { label: "Wes", login: FULL_EVEN },
    { label: "Bea", login: "42" },
    { label: "Cid", login: "" },
    { label: "Blocked", login: { accountLoginId: "2".repeat(16), name: "x" } },
  ];
  assert.deepEqual(namedDigits(rows), ["1", "4"]);
  assert.deepEqual(namedFits(rows), ["full", "short"]);
  assert.deepEqual(namedParities(rows), ["odd", "even"]);
  assert.equal(leadingDigit(rows), "1");
  assert.equal(leadingFit(rows), "full");
  assert.equal(bandShare(1, 4), 25);
  assert.equal(bandShare(0, 0), 0);
  assert.deepEqual(readHiddenDigits(["1", "pirate", "4"], ["1"]), ["1"]);
  assert.deepEqual(toggleDigit(["1"], "1", ["1", "4"]), []);
  assert.deepEqual(toggleDigit([], "4", ["4"]), ["4"]);
  assert.deepEqual(visibleDigits(["1", "4"], ["1"], false), ["4"]);
  assert.deepEqual(visibleDigits(["1", "4"], ["1"], true), ["1"]);
  assert.equal(activeDigit("missing", ["1"]), "all");
  assert.equal(activeDigit("blank", ["1"]), "blank");
  assert.equal(activeDigit("1", ["1"]), "1");
  assert.equal(digitArg("all"), null);
  assert.equal(digitArg("blank"), "");
  assert.equal(digitArg("1"), "1");
  assert.equal(digitArg("0"), null);
  assert.equal(digitArg("nope"), null);
  assert.equal(activeFit("gone", ["full"]), "all");
  assert.equal(activeFit("full", ["full"]), "full");
  assert.equal(fitArg("blank"), "");
  assert.equal(fitArg("full"), "full");
  assert.equal(fitArg("nope"), null);
  assert.equal(activeParity("gone", ["odd"]), "all");
  assert.equal(activeParity("odd", ["odd"]), "odd");
  assert.equal(parityArg("blank"), "");
  assert.equal(parityArg("odd"), "odd");
  assert.equal(parityArg("nope"), null);
  const visible = visibleLoginCustomers(rows, "1", null, "full", "ada");
  assert.equal(visible.length, 1);
  assert.equal(visible[0].label, "Ada");
  assert.equal(visibleLoginCustomers(rows, "", null, null, "blocked").length, 1);
  assert.equal(visibleLoginCustomers(rows, null, null, null, "111").length, 0);
  assert.equal(visibleLoginCustomers(rows, "", null, null, "").length, 2);
  assert.equal(bandsCsv(rows).startsWith("kind,mark,count\n"), true);
  assert.equal(bandsCsv([]), "kind,mark,count");
  assert.equal(bandsCsv(rows).includes("amount"), false);
  assert.equal(bandsCsv(rows).includes(",1,"), true);

  const copy = Object.keys(ROUND152_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND152_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "lomTitle"), "Loom tickets");
  assert.equal(crmv4Text("tr", "bndTitle"), ROUND152_COPY.tr.bndTitle);
  assert.equal(crmv4Text("de", "lomWeaver"), ROUND152_COPY.de.lomWeaver);
  assert.equal(crmv4Text("ru", "bndUnmarked"), ROUND152_COPY.ru.bndUnmarked);
  assert.equal(crmv4Text("ar", "lomNotice"), ROUND152_COPY.ar.lomNotice);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-lom/);
  assert.match(css, /\.c4-bnd/);
  assert.match(css, /\.c4-pagehead-loom/);
  assert.match(css, /\.c4-rail-loom/);
  assert.match(css, /\.c4-pagehead-dispatch/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round152.tsx"), "utf8");
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
  assert.match(viewFile, /accountLoginId/);
  assert.match(viewFile, /loomsCsv/);
  assert.match(viewFile, /bandsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "l"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-loom/);
  assert.match(viewFile, /data-bands/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "loom"/);
  assert.match(app, /view === "bands"/);
  assert.match(app, /c4-pagehead-loom/);
  assert.match(app, /c4-rail-loom/);
  assert.match(app, /c4-pagehead-dispatch/);
  console.log("crmv4 round152 tests passed");
}

main();
