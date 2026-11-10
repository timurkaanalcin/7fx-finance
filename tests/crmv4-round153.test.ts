/**
 * Kiln slips and username handles.
 * Run: npx tsx tests/crmv4-round153.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND153_COPY } from "../src/lib/crmv4/copy-round153";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeGlaze,
  activeHeat,
  activeHour,
  activeLetter,
  activePotter,
  activeSpan,
  activeStamp,
  activeVoice,
  addKiln,
  addKilnView,
  assignedHandle,
  bulkKilnPinned,
  bulkKilnShelved,
  dropKilnView,
  editKiln,
  glazeArg,
  handleShare,
  handlesCsv,
  heatArg,
  heatOf,
  hourArg,
  hourGap,
  hourOf,
  hourPair,
  kilnClashIds,
  kilnCopy,
  kilnCounts,
  kilnGlazes,
  kilnHeats,
  kilnPotters,
  kilnShare,
  kilnStamps,
  kilnText,
  kilnTimeline,
  kilnsCsv,
  leadingLetter,
  leadingSpan,
  letterArg,
  letterOf,
  namedLetters,
  namedSpans,
  namedVoices,
  nextKiln,
  potterArg,
  potterLabel,
  readHiddenLetters,
  readKilnViews,
  readKilns,
  resetKilns,
  setKilnHeld,
  setKilnPinned,
  setKilnShelved,
  spanArg,
  spanOf,
  stampArg,
  stampMark,
  stepKilnHeat,
  toggleLetter,
  visibleHandleCustomers,
  visibleKilns,
  visibleLetters,
  voiceArg,
  voiceOf,
  watchCounts,
  watchOf,
  glazeOf,
} from "../src/lib/crmv4/round153";

function main() {
  assert.equal(kilnText("  Call\nAda  "), "Call Ada");
  assert.equal(kilnText("   "), "");
  assert.equal(kilnText("x".repeat(120)).length, 72);
  assert.equal(potterLabel("  North  "), "North");
  assert.equal(potterLabel("   "), "");
  assert.equal(potterLabel("y".repeat(40)).length, 16);
  assert.equal(stampMark("  VIP  "), "VIP");
  assert.equal(stampMark("   "), "");
  assert.equal(stampMark("z".repeat(30)).length, 10);
  assert.equal(hourOf(" 0 "), 0);
  assert.equal(hourOf(0), 0);
  assert.equal(hourOf("00"), 0);
  assert.equal(hourOf("07"), 7);
  assert.equal(hourOf("23"), 23);
  assert.equal(hourOf(23), 23);
  assert.equal(hourOf(""), null);
  assert.equal(hourOf("24"), null);
  assert.equal(hourOf(24), null);
  assert.equal(hourOf(-1), null);
  assert.equal(hourOf(1.5), null);
  assert.equal(glazeOf(" ASH "), "ash");
  assert.equal(glazeOf("salt"), "salt");
  assert.equal(glazeOf("celadon"), "celadon");
  assert.equal(glazeOf("tenmoku"), "tenmoku");
  assert.equal(glazeOf(""), "blank");
  assert.equal(glazeOf("pit"), "blank");
  assert.equal(heatOf(" BANKED "), "banked");
  assert.equal(heatOf("steady"), "steady");
  assert.equal(heatOf("fired"), "fired");
  assert.equal(heatOf(""), "blank");
  assert.equal(heatOf("gold"), "blank");
  assert.equal(watchOf(null), "blank");
  assert.equal(watchOf(0), "night");
  assert.equal(watchOf(5), "night");
  assert.equal(watchOf(6), "morning");
  assert.equal(watchOf(11), "morning");
  assert.equal(watchOf(12), "afternoon");
  assert.equal(watchOf(17), "afternoon");
  assert.equal(watchOf(18), "evening");
  assert.equal(watchOf(23), "evening");
  assert.equal(hourPair(null), "blank");
  assert.equal(hourPair(0), "even");
  assert.equal(hourPair(1), "odd");
  assert.equal(hourGap(8, 9), 1);
  assert.equal(hourGap(18, 9), -9);
  assert.equal(hourGap(8, 8), 0);
  assert.equal(hourGap(null, 9), null);
  assert.equal(hourGap(8, ""), null);
  assert.equal(hourGap(8, 24), null);
  assert.deepEqual(readKilns([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Call Ada", potter: "  ", hour: 24, glaze: "pit", stamp: "  ", heat: "gold", pinned: 1, shelved: 1, held: 1, audit: "nope" }, "nope"]), [
    { id: "2", text: "Call Ada", potter: "", hour: null, glaze: "", stamp: "", heat: "", pinned: false, shelved: false, held: false, audit: "" },
  ]);
  assert.equal(readKilns([{ id: "z", text: "One", hour: 0 }])[0].hour, 0);
  assert.equal(readKilns([{ id: "z", text: "One", hour: "07" }])[0].hour, 7);
  const saved = addKiln([], { id: "a", text: "Call Ada", potter: "Nia", hour: 8, glaze: "ash", stamp: "VIP", heat: "banked" });
  assert.equal(saved[0].audit, "save");
  assert.equal(saved[0].hour, 8);
  assert.equal(saved[0].glaze, "ash");
  assert.equal(saved[0].heat, "banked");
  assert.equal(addKiln(saved, { id: "b", text: "Call Ada" }).length, 1);
  assert.equal(addKiln(saved, { id: "a", text: "Other" }).length, 1);
  assert.equal(addKiln(saved, { id: "b", text: "   " }).length, 1);
  const raised = stepKilnHeat(saved, "a", 1);
  assert.equal(raised[0].heat, "steady");
  assert.equal(raised[0].audit, "raise");
  assert.equal(stepKilnHeat(raised, "a", 1)[0].heat, "fired");
  assert.equal(stepKilnHeat([{ ...saved[0], heat: "fired" }], "a", 1)[0].heat, "fired");
  assert.equal(stepKilnHeat([{ ...saved[0], heat: "" }], "a", -1)[0].heat, "");
  assert.equal(stepKilnHeat([{ ...saved[0], heat: "" }], "a", 1)[0].heat, "banked");
  assert.equal(setKilnPinned(saved, "a", true)[0].audit, "pin");
  assert.equal(setKilnPinned(saved, "a", false)[0].audit, "unpin");
  assert.equal(setKilnHeld(saved, "a", true)[0].held, true);
  assert.equal(setKilnShelved(saved, "a", true)[0].audit, "shelve");
  assert.equal(setKilnShelved(saved, "a", false)[0].audit, "unshelve");
  assert.equal(editKiln(saved, "a", "  ")[0].text, "Call Ada");
  assert.equal(editKiln(saved, "a", "Call Bea")[0].audit, "edit");
  const pair = addKiln(saved, { id: "b", text: "Call Bea" });
  assert.equal(editKiln(pair, "b", "Call Ada")[0].text, "Call Bea");
  assert.equal(bulkKilnPinned(pair, ["a", "b"], true).every((card) => card.pinned), true);
  assert.equal(bulkKilnShelved(pair, ["missing"], true)[0].shelved, false);
  assert.equal(resetKilns().length, 0);
  assert.equal(kilnCopy("  Call Ada "), "Call Ada");
  assert.equal(kilnCopy(" "), "");
  const mixed = [
    { ...saved[0], id: "open", heat: "banked", hour: 4, pinned: true },
    { ...saved[0], id: "held", text: "Held note", held: true, heat: "steady", hour: 9 },
    { ...saved[0], id: "shelf", text: "Shelf note", shelved: true, held: true, heat: "fired", hour: 2 },
    { ...saved[0], id: "late", text: "Late note", heat: "banked", hour: 1 },
    { ...saved[0], id: "steady", text: "Steady note", heat: "steady", hour: 1 },
  ];
  assert.equal(visibleKilns(mixed, "open", "late", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleKilns(mixed, "open", "nia", null, null, null, null, null, null, false, false, "").length, 0);
  assert.equal(visibleKilns(mixed, "held", "", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleKilns(mixed, "shelved", "", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleKilns(mixed, "open", "", null, null, null, null, null, null, true, false, "").every((card) => card.heat === "fired"), true);
  assert.equal(visibleKilns(mixed, "open", "", null, null, null, null, null, null, false, true, "8").every((card) => card.heat === "banked"), true);
  assert.equal(visibleKilns(mixed, "open", "", null, "ash", null, null, null, null, false, false, "").length, 3);
  assert.equal(visibleKilns(mixed, "open", "", "Nia", null, "VIP", "banked", 4, null, false, false, "").length, 1);
  assert.equal(visibleKilns(mixed, "open", "", null, null, null, null, null, "night", false, false, "").length, 3);
  assert.equal(kilnTimeline(mixed, "")[0].hour, 1);
  assert.equal(kilnTimeline([{ ...saved[0], hour: null }], "").at(-1)?.hour, null);
  const counts = kilnCounts(mixed, "8");
  assert.equal(counts.open, 3);
  assert.equal(counts.held, 1);
  assert.equal(counts.shelved, 1);
  assert.equal(counts.pinned, 1);
  assert.equal(counts.late, 2);
  assert.equal(kilnShare(1, 3), 33);
  assert.equal(kilnShare(0, 0), 0);
  assert.deepEqual(kilnPotters(mixed), ["Nia"]);
  assert.deepEqual(kilnStamps(mixed), ["VIP"]);
  assert.deepEqual(kilnGlazes(mixed), ["ash"]);
  assert.deepEqual(kilnHeats(mixed), ["banked", "steady", "fired"]);
  assert.deepEqual(watchCounts(mixed), [4, 1, 0, 0]);
  assert.equal(activePotter("gone", ["Nia"]), "all");
  assert.equal(activePotter("blank", ["Nia"]), "blank");
  assert.equal(potterArg("blank"), "");
  assert.equal(potterArg("all"), null);
  assert.equal(activeGlaze("gone", ["ash"]), "all");
  assert.equal(glazeArg("blank"), "blank");
  assert.equal(glazeArg("ash"), "ash");
  assert.equal(glazeArg("pit"), null);
  assert.equal(activeStamp("gone", ["VIP"]), "all");
  assert.equal(stampArg("VIP"), "VIP");
  assert.equal(activeHeat("gone", ["banked"]), "all");
  assert.equal(heatArg("banked"), "banked");
  assert.equal(heatArg("blank"), "blank");
  assert.equal(activeHour("night"), "night");
  assert.equal(activeHour("07"), "7");
  assert.equal(activeHour("24"), "all");
  assert.equal(activeHour("pirate"), "all");
  assert.deepEqual(hourArg("0"), { exact: 0, band: null });
  assert.deepEqual(hourArg("morning"), { exact: null, band: "morning" });
  assert.deepEqual(hourArg("all"), { exact: null, band: null });
  assert.deepEqual(kilnClashIds([
    { ...saved[0], id: "a", hour: 4, text: "Call Ada" },
    { ...saved[0], id: "b", hour: 4, text: "Call Bea" },
  ], "a"), ["b"]);
  assert.deepEqual(kilnClashIds([{ ...saved[0], glaze: "", hour: 8 }], "a"), []);
  assert.deepEqual(kilnClashIds([{ ...saved[0], hour: null }], "a"), []);
  assert.equal(nextKiln(mixed, "3"), "open");
  assert.equal(nextKiln(mixed, "20"), "late");
  assert.equal(nextKiln([{ ...saved[0], heat: "fired", hour: 4 }], "1"), "");
  assert.equal(nextKiln(mixed, ""), "");
  const csv = kilnsCsv(saved, "9");
  assert.equal(csv.startsWith("note,potter,hour,glaze,stamp,heat,watch,pinned,held,shelved,gap,audit\n"), true);
  assert.equal(csv.includes("Call Ada,Nia,8,ash,VIP,banked,morning,0,0,0,1,save"), true);
  assert.equal(kilnsCsv([], "").includes("note,potter"), true);
  const view = addKilnView([], { id: "v", name: "Morning", tray: "open", query: "ada", potter: "Nia", glaze: "ash", stamp: "VIP", heat: "banked", hour: "morning" });
  assert.equal(view.length, 1);
  assert.equal(addKilnView(view, { ...view[0], id: "w" }).length, 1);
  assert.equal(readKilnViews([{ id: "v", name: "  " }]).length, 0);
  assert.equal(dropKilnView(view, "v").length, 0);
  const many = Array.from({ length: 21 }, (_, index) => ({ id: `k${index}`, text: `Note ${index}`, potter: "", hour: null, glaze: "", stamp: "", heat: "", pinned: false, shelved: false, held: false, audit: "save" }));
  assert.equal(readKilns(many).length, 20);
  const manyViews = Array.from({ length: 7 }, (_, index) => ({ id: `v${index}`, name: `View ${index}`, tray: "open" as const, query: "", potter: "all", glaze: "all", stamp: "all", heat: "all", hour: "all" }));
  assert.equal(readKilnViews(manyViews).length, 6);

  assert.equal(assignedHandle(" ada "), "ada");
  assert.equal(assignedHandle(""), "");
  assert.equal(assignedHandle("x".repeat(40)).length, 24);
  assert.equal(assignedHandle({ username: "ada" }), "ada");
  assert.equal(assignedHandle({ username: "ada", name: "Ada" }), "");
  assert.equal(assignedHandle({ username: "ada", email: "a@b.c" }), "");
  assert.equal(assignedHandle({ username: "ada", phone: "1" }), "");
  assert.equal(letterOf("ada"), "A");
  assert.equal(letterOf("Bea"), "B");
  assert.equal(letterOf("4ada"), "");
  assert.equal(letterOf(""), "");
  assert.equal(spanOf("ab"), "tiny");
  assert.equal(spanOf("abcd"), "plain");
  assert.equal(spanOf("abcdefghi"), "wide");
  assert.equal(spanOf(""), "");
  assert.equal(voiceOf("Ada"), "vowel");
  assert.equal(voiceOf("Bea"), "consonant");
  assert.equal(voiceOf("4ada"), "");
  assert.equal(voiceOf(""), "");
  const rows = [
    { label: "Ada", handle: "ada" },
    { label: "Wes", handle: "weslongname" },
    { label: "Bea", handle: "be" },
    { label: "Cid", handle: "" },
    { label: "Blocked", handle: { username: "zed", name: "x" } },
  ];
  assert.deepEqual(namedLetters(rows), ["A", "B", "W"]);
  assert.deepEqual(namedSpans(rows), ["tiny", "wide"]);
  assert.deepEqual(namedVoices(rows), ["vowel", "consonant"]);
  assert.equal(leadingLetter(rows), "A");
  assert.equal(leadingSpan([{ label: "A", handle: "abcd" }, { label: "B", handle: "ab" }, { label: "C", handle: "xy" }]), "tiny");
  assert.equal(handleShare(1, 4), 25);
  assert.equal(handleShare(0, 0), 0);
  assert.deepEqual(readHiddenLetters(["a", "pirate", "B"], ["A", "B"]), ["A", "B"]);
  assert.deepEqual(toggleLetter(["A"], "A", ["A", "B"]), []);
  assert.deepEqual(toggleLetter([], "B", ["B"]), ["B"]);
  assert.deepEqual(visibleLetters(["A", "B"], ["A"], false), ["B"]);
  assert.deepEqual(visibleLetters(["A", "B"], ["A"], true), ["A"]);
  assert.equal(activeLetter("missing", ["A"]), "all");
  assert.equal(activeLetter("blank", ["A"]), "blank");
  assert.equal(activeLetter("a", ["A"]), "A");
  assert.equal(letterArg("all"), null);
  assert.equal(letterArg("blank"), "");
  assert.equal(letterArg("a"), "A");
  assert.equal(letterArg("4"), null);
  assert.equal(activeSpan("gone", ["tiny"]), "all");
  assert.equal(activeSpan("tiny", ["tiny"]), "tiny");
  assert.equal(spanArg("blank"), "");
  assert.equal(spanArg("plain"), "plain");
  assert.equal(spanArg("nope"), null);
  assert.equal(activeVoice("gone", ["vowel"]), "all");
  assert.equal(activeVoice("vowel", ["vowel"]), "vowel");
  assert.equal(voiceArg("blank"), "");
  assert.equal(voiceArg("consonant"), "consonant");
  assert.equal(voiceArg("nope"), null);
  const visible = visibleHandleCustomers(rows, "A", "vowel", "tiny", "ada");
  assert.equal(visible.length, 1);
  assert.equal(visible[0].label, "Ada");
  assert.equal(visibleHandleCustomers(rows, "", null, null, "blocked").length, 1);
  assert.equal(visibleHandleCustomers(rows, null, null, null, "ada").length, 1);
  assert.equal(visibleHandleCustomers(rows, null, null, null, "weslongname").length, 0);
  assert.equal(handlesCsv(rows).startsWith("kind,mark,count\n"), true);
  assert.equal(handlesCsv([]), "kind,mark,count");
  assert.equal(handlesCsv(rows).includes("amount"), false);
  assert.equal(handlesCsv(rows).includes(",A,"), true);

  const copy = Object.keys(ROUND153_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND153_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "klnTitle"), "Kiln slips");
  assert.equal(crmv4Text("tr", "hdlTitle"), ROUND153_COPY.tr.hdlTitle);
  assert.equal(crmv4Text("de", "klnPotter"), ROUND153_COPY.de.klnPotter);
  assert.equal(crmv4Text("ru", "hdlUnmarked"), ROUND153_COPY.ru.hdlUnmarked);
  assert.equal(crmv4Text("ar", "klnNotice"), ROUND153_COPY.ar.klnNotice);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-kln/);
  assert.match(css, /\.c4-hdl/);
  assert.match(css, /\.c4-pagehead-kiln/);
  assert.match(css, /\.c4-rail-kiln/);
  assert.match(css, /\.c4-pagehead-loom/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round153.tsx"), "utf8");
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
  assert.match(viewFile, /username/);
  assert.match(viewFile, /kilnsCsv/);
  assert.match(viewFile, /handlesCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "k"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-kiln/);
  assert.match(viewFile, /data-handles/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "kiln"/);
  assert.match(app, /view === "handles"/);
  assert.match(app, /c4-pagehead-kiln/);
  assert.match(app, /c4-rail-kiln/);
  assert.match(app, /c4-pagehead-loom/);
  console.log("crmv4 round153 tests passed");
}

main();
