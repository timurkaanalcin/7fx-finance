/**
 * Aviary perches and presence watches.
 * Run: npx tsx tests/crmv4-round158.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND158_COPY } from "../src/lib/crmv4/copy-round158";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeBand,
  activeFold,
  activeKeeper,
  activePerch,
  activePlumage,
  activeShelf,
  activeSong,
  activeSpan,
  addPerch,
  addPerchView,
  assignedWatch,
  bandArg,
  bulkPerchCaged,
  bulkPerchPinned,
  clashPerchCount,
  dropPerchView,
  editPerch,
  foldArg,
  foldOf,
  keeperArg,
  keeperLabel,
  leadingFold,
  leadingShelf,
  loftCounts,
  loftOf,
  namedFolds,
  namedShelves,
  namedSpans,
  nextPerch,
  perchArg,
  perchBand,
  perchBands,
  perchClashIds,
  perchCopy,
  perchCounts,
  perchGap,
  perchKeepers,
  perchOf,
  perchPlumages,
  perchShare,
  perchSongs,
  perchText,
  perchTimeline,
  perchesCsv,
  plumageArg,
  plumageOf,
  quietOf,
  readHiddenShelves,
  readPerchViews,
  readPerches,
  resetPerches,
  setPerchCaged,
  setPerchPinned,
  setPerchRoosted,
  shelfArg,
  shelfOf,
  songArg,
  songOf,
  spanArg,
  spanOf,
  stepPerchSong,
  toggleShelf,
  visiblePerches,
  visibleShelves,
  visibleWatchCustomers,
  watchShare,
  watchesCsv,
  wingOf,
} from "../src/lib/crmv4/round158";

function main() {
  assert.equal(perchText("  Check\nAda  "), "Check Ada");
  assert.equal(perchText("   "), "");
  assert.equal(perchText("x".repeat(120)).length, 48);
  assert.equal(keeperLabel("  North  "), "North");
  assert.equal(keeperLabel("   "), "");
  assert.equal(keeperLabel("y".repeat(40)).length, 16);
  assert.equal(perchBand("  VIP  "), "VIP");
  assert.equal(perchBand("   "), "");
  assert.equal(perchBand("z".repeat(30)).length, 10);
  assert.equal(perchOf(" 1 "), 1);
  assert.equal(perchOf(1), 1);
  assert.equal(perchOf("01"), 1);
  assert.equal(perchOf("09"), 9);
  assert.equal(perchOf("18"), 18);
  assert.equal(perchOf(18), 18);
  assert.equal(perchOf(""), null);
  assert.equal(perchOf("00"), null);
  assert.equal(perchOf(0), null);
  assert.equal(perchOf("19"), null);
  assert.equal(perchOf(19), null);
  assert.equal(perchOf(-1), null);
  assert.equal(perchOf(1.5), null);
  assert.equal(plumageOf(" DOVE "), "dove");
  assert.equal(plumageOf("crow"), "crow");
  assert.equal(plumageOf("jay"), "jay");
  assert.equal(plumageOf("wren"), "wren");
  assert.equal(plumageOf(""), "blank");
  assert.equal(plumageOf("gold"), "blank");
  assert.equal(songOf(" HUSH "), "hush");
  assert.equal(songOf("call"), "call");
  assert.equal(songOf("chorus"), "chorus");
  assert.equal(songOf(""), "blank");
  assert.equal(songOf("gold"), "blank");
  assert.equal(loftOf(null), "blank");
  assert.equal(loftOf(1), "low");
  assert.equal(loftOf(6), "low");
  assert.equal(loftOf(7), "mid");
  assert.equal(loftOf(12), "mid");
  assert.equal(loftOf(13), "high");
  assert.equal(loftOf(18), "high");
  assert.equal(wingOf(null), "blank");
  assert.equal(wingOf(1), "near");
  assert.equal(wingOf(9), "near");
  assert.equal(wingOf(10), "far");
  assert.equal(wingOf(18), "far");
  assert.equal(perchGap(8, 9), 1);
  assert.equal(perchGap(12, 9), -3);
  assert.equal(perchGap(8, 8), 0);
  assert.equal(perchGap(null, 9), null);
  assert.equal(perchGap(8, ""), null);
  assert.equal(perchGap(8, 19), null);
  assert.deepEqual(readPerches([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Check Ada", keeper: "  ", perch: 0, plumage: "gold", band: "  ", song: "gold", pinned: 1, roosted: 1, caged: 1, audit: "nope" }, "nope"]), [
    { id: "2", text: "Check Ada", keeper: "", perch: null, plumage: "", band: "", song: "", pinned: false, roosted: false, caged: false, audit: "" },
  ]);
  assert.equal(readPerches([{ id: "z", text: "One", perch: 1 }])[0].perch, 1);
  assert.equal(readPerches([{ id: "z", text: "One", perch: "09" }])[0].perch, 9);
  const saved = addPerch([], { id: "a", text: "Check Ada", keeper: "Nia", perch: 8, plumage: "dove", band: "VIP", song: "hush" });
  assert.equal(saved[0].audit, "save");
  assert.equal(saved[0].perch, 8);
  assert.equal(saved[0].plumage, "dove");
  assert.equal(saved[0].song, "hush");
  assert.equal(addPerch(saved, { id: "b", text: "Check Ada" }).length, 1);
  assert.equal(addPerch(saved, { id: "a", text: "Other" }).length, 1);
  assert.equal(addPerch(saved, { id: "b", text: "   " }).length, 1);
  const raised = stepPerchSong(saved, "a", 1);
  assert.equal(raised[0].song, "call");
  assert.equal(raised[0].audit, "raise");
  assert.equal(stepPerchSong(raised, "a", 1)[0].song, "chorus");
  assert.equal(stepPerchSong([{ ...saved[0], song: "chorus" }], "a", 1)[0].song, "chorus");
  assert.equal(stepPerchSong([{ ...saved[0], song: "" }], "a", -1)[0].song, "");
  assert.equal(stepPerchSong([{ ...saved[0], song: "" }], "a", 1)[0].song, "hush");
  assert.equal(setPerchPinned(saved, "a", true)[0].audit, "pin");
  assert.equal(setPerchPinned(saved, "a", false)[0].audit, "unpin");
  assert.equal(setPerchRoosted(saved, "a", true)[0].roosted, true);
  assert.equal(setPerchRoosted(saved, "a", true)[0].audit, "roost");
  assert.equal(setPerchCaged(saved, "a", true)[0].audit, "cage");
  assert.equal(setPerchCaged(saved, "a", false)[0].audit, "uncage");
  assert.equal(editPerch(saved, "a", "  ")[0].text, "Check Ada");
  assert.equal(editPerch(saved, "a", "Check Bea")[0].audit, "edit");
  const pair = addPerch(saved, { id: "b", text: "Check Bea" });
  assert.equal(editPerch(pair, "b", "Check Ada")[0].text, "Check Bea");
  assert.equal(bulkPerchPinned(pair, ["a", "b"], true).every((card) => card.pinned), true);
  assert.equal(bulkPerchCaged(pair, ["missing"], true)[0].caged, false);
  assert.equal(resetPerches().length, 0);
  assert.equal(perchCopy("  Check Ada "), "Check Ada");
  assert.equal(perchCopy(" "), "");
  const mixed = [
    { ...saved[0], id: "open", song: "hush", perch: 4, pinned: true },
    { ...saved[0], id: "held", text: "Held note", roosted: true, song: "call", perch: 11 },
    { ...saved[0], id: "stowed", text: "Stowed note", caged: true, roosted: true, song: "chorus", perch: 2 },
    { ...saved[0], id: "late", text: "Aaa late", song: "hush", perch: 1 },
    { ...saved[0], id: "slack", text: "Slack note", song: "call", perch: 1 },
  ];
  assert.equal(visiblePerches(mixed, "open", "late", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visiblePerches(mixed, "open", "nia", null, null, null, null, null, null, false, false, "").length, 0);
  assert.equal(visiblePerches(mixed, "roosted", "", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visiblePerches(mixed, "caged", "", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visiblePerches(mixed, "open", "", null, null, null, null, null, null, true, false, "").every((card) => card.song === "chorus"), true);
  assert.equal(visiblePerches(mixed, "open", "", null, null, null, null, null, null, false, true, "8").every((card) => card.song === "hush"), true);
  assert.equal(visiblePerches(mixed, "open", "", null, "dove", null, null, null, null, false, false, "").length, 3);
  assert.equal(visiblePerches(mixed, "open", "", "Nia", "dove", "VIP", "hush", 4, null, false, false, "").length, 1);
  assert.equal(visiblePerches(mixed, "open", "", null, null, null, null, null, "low", false, false, "").length, 3);
  assert.equal(perchTimeline(mixed, "")[0].perch, 1);
  assert.equal(perchTimeline([{ ...saved[0], perch: null }], "").at(-1)?.perch, null);
  const counts = perchCounts(mixed, "8");
  assert.equal(counts.open, 3);
  assert.equal(counts.roosted, 1);
  assert.equal(counts.caged, 1);
  assert.equal(counts.pinned, 1);
  assert.equal(counts.late, 2);
  assert.equal(perchShare(1, 3), 33);
  assert.equal(perchShare(0, 0), 0);
  assert.deepEqual(perchKeepers(mixed), ["Nia"]);
  assert.deepEqual(perchBands(mixed), ["VIP"]);
  assert.deepEqual(perchPlumages(mixed), ["dove"]);
  assert.deepEqual(perchSongs(mixed), ["hush", "call", "chorus"]);
  assert.deepEqual(loftCounts(mixed), [4, 1, 0]);
  assert.equal(activeKeeper("gone", ["Nia"]), "all");
  assert.equal(activeKeeper("blank", ["Nia"]), "blank");
  assert.equal(keeperArg("blank"), "");
  assert.equal(keeperArg("all"), null);
  assert.equal(activePlumage("gone", ["dove"]), "all");
  assert.equal(plumageArg("blank"), "blank");
  assert.equal(plumageArg("dove"), "dove");
  assert.equal(plumageArg("gold"), null);
  assert.equal(activeBand("gone", ["VIP"]), "all");
  assert.equal(bandArg("VIP"), "VIP");
  assert.equal(activeSong("gone", ["hush"]), "all");
  assert.equal(songArg("hush"), "hush");
  assert.equal(songArg("blank"), "blank");
  assert.equal(activePerch("low"), "low");
  assert.equal(activePerch("09"), "9");
  assert.equal(activePerch("00"), "all");
  assert.equal(activePerch("19"), "all");
  assert.equal(activePerch("pirate"), "all");
  assert.deepEqual(perchArg("1"), { exact: 1, band: null });
  assert.deepEqual(perchArg("mid"), { exact: null, band: "mid" });
  assert.deepEqual(perchArg("all"), { exact: null, band: null });
  assert.deepEqual(perchClashIds([
    { ...saved[0], id: "a", perch: 4, text: "Check Ada" },
    { ...saved[0], id: "b", perch: 9, text: "Check Bea" },
  ], "a"), ["b"]);
  assert.deepEqual(perchClashIds([{ ...saved[0], plumage: "", perch: 8 }], "a"), []);
  assert.deepEqual(perchClashIds([{ ...saved[0], band: "" }], "a"), []);
  assert.equal(clashPerchCount([
    { ...saved[0], id: "a", text: "Check Ada" },
    { ...saved[0], id: "b", text: "Check Bea" },
  ]), 2);
  assert.equal(clashPerchCount([{ ...saved[0], band: "" }]), 0);
  assert.equal(nextPerch(mixed, "3"), "open");
  assert.equal(nextPerch(mixed, "16"), "late");
  assert.equal(nextPerch([{ ...saved[0], song: "chorus", perch: 4 }], "1"), "");
  assert.equal(nextPerch(mixed, ""), "");
  const csv = perchesCsv(saved, "9");
  assert.equal(csv.startsWith("note,keeper,perch,plumage,band,song,loft,pinned,roosted,caged,gap,audit\n"), true);
  assert.equal(csv.includes("Check Ada,Nia,8,dove,VIP,hush,mid,0,0,0,1,save"), true);
  assert.equal(perchesCsv([], "").includes("note,keeper"), true);
  const view = addPerchView([], { id: "v", name: "Low loft", tray: "open", query: "ada", keeper: "Nia", plumage: "dove", band: "VIP", song: "hush", perch: "low" });
  assert.equal(view.length, 1);
  assert.equal(addPerchView(view, { ...view[0], id: "w" }).length, 1);
  assert.equal(readPerchViews([{ id: "v", name: "  " }]).length, 0);
  assert.equal(dropPerchView(view, "v").length, 0);
  const many = Array.from({ length: 14 }, (_, index) => ({ id: `k${index}`, text: `Note ${index}`, keeper: "", perch: null, plumage: "", band: "", song: "", pinned: false, roosted: false, caged: false, audit: "save" }));
  assert.equal(readPerches(many).length, 12);
  const manyViews = Array.from({ length: 6 }, (_, index) => ({ id: `v${index}`, name: `View ${index}`, tray: "open" as const, query: "", keeper: "all", plumage: "all", band: "all", song: "all", perch: "all" }));
  assert.equal(readPerchViews(manyViews).length, 4);

  assert.equal(assignedWatch(" 2026-11-09T14:30:00.000Z "), "14");
  assert.equal(assignedWatch(""), "");
  assert.equal(assignedWatch("x".repeat(80)), "");
  assert.equal(assignedWatch({ lastSeenAt: "2026-11-10T03:05:00.000Z" }), "03");
  assert.equal(assignedWatch({ lastSeenAt: "2026-11-10T03:05:00.000Z", timezone: "Europe/Berlin" }), "");
  assert.equal(assignedWatch({ lastSeenAt: "2026-11-10T03:05:00.000Z", language: "de" }), "");
  assert.equal(assignedWatch({ lastSeenAt: "2026-11-10T03:05:00.000Z", country: "DE" }), "");
  assert.equal(assignedWatch({ lastSeenAt: "2026-11-10T03:05:00.000Z", name: "Ada" }), "");
  assert.equal(assignedWatch({ lastSeenAt: "2026-11-10T03:05:00.000Z", email: "a@b.c" }), "");
  assert.equal(assignedWatch({ lastSeenAt: "2026-11-10T03:05:00.000Z", phone: "1" }), "");
  assert.equal(assignedWatch({ lastSeenAt: "2026-11-10T03:05:00.000Z", desk: "North" }), "");
  assert.equal(assignedWatch({ lastSeenAt: "2026-11-10T03:05:00.000Z", address: "1 Road" }), "");
  assert.equal(assignedWatch({ lastSeenAt: "2026-11-10T03:05:00.000Z", city: "Berlin" }), "");
  assert.equal(assignedWatch({ lastSeenAt: "2026-11-10T03:05:00.000Z", firstName: "Ada" }), "");
  assert.equal(assignedWatch({ lastSeenAt: "2026-11-10T03:05:00.000Z", lastName: "North" }), "");
  assert.equal(assignedWatch({ lastSeenAt: "2026-11-10T03:05:00.000Z", lastCountryName: "Germany" }), "");
  assert.equal(shelfOf("2026-11-09T14:30:00.000Z"), "afternoon");
  assert.equal(shelfOf("2026-11-10T03:00:00.000Z"), "night");
  assert.equal(shelfOf("2026-11-15T08:00:00.000Z"), "morning");
  assert.equal(shelfOf("2026-11-12T20:15:00.000Z"), "evening");
  assert.equal(shelfOf("4France"), "");
  assert.equal(shelfOf(""), "");
  assert.equal(spanOf("2026-11-10T03:00:00.000Z"), "short");
  assert.equal(spanOf("2026-11-15T08:00:00.000Z"), "mid");
  assert.equal(spanOf("2026-11-12T20:15:00.000Z"), "long");
  assert.equal(spanOf(""), "");
  assert.equal(spanOf("4abc"), "");
  assert.equal(foldOf("2026-11-09T14:30:00.000Z"), "early");
  assert.equal(foldOf("2026-11-12T20:15:00.000Z"), "late");
  assert.equal(foldOf("2026-11-15T08:00:00.000Z"), "rest");
  assert.equal(foldOf(""), "");
  assert.equal(quietOf("2026-11-10T03:00:00.000Z"), "quiet");
  assert.equal(quietOf("2026-11-09T14:30:00.000Z"), "day");
  assert.equal(quietOf("2026-11-12T22:15:00.000Z"), "quiet");
  assert.equal(quietOf(""), "");
  const rows = [
    { lastSeenAt: "2026-11-09T14:30:00.000Z", label: "Ada North" },
    { lastSeenAt: "2026-11-09T15:00:00.000Z", label: "Bea South" },
    { lastSeenAt: "2026-11-09T16:10:00.000Z", label: "Ann Extra" },
    { lastSeenAt: "2026-11-10T03:00:00.000Z", label: "Ann West" },
    { lastSeenAt: "2026-11-12T20:15:00.000Z", label: "Chris East" },
    { lastSeenAt: "2026-11-12T21:00:00.000Z", label: "Uma" },
    { lastSeenAt: "not-a-date", label: "Mark" },
    { lastSeenAt: "2026-11-15T08:00:00.000Z", label: "West" },
    { lastSeenAt: "2026-11-11T09:00:00.000Z", label: "Otto" },
    { lastSeenAt: "4ada", label: "Mark" },
    { lastSeenAt: "", label: "Blank" },
  ];
  assert.equal(leadingShelf(rows), "afternoon");
  assert.equal(leadingFold(rows), "early");
  assert.equal(watchShare(2, 6), 33);
  assert.equal(watchShare(0, 0), 0);
  assert.deepEqual(namedShelves(rows), ["night", "morning", "afternoon", "evening"]);
  assert.deepEqual(namedSpans(rows), ["short", "mid", "long"]);
  assert.deepEqual(namedFolds(rows), ["early", "late", "rest"]);
  assert.equal(visibleWatchCustomers(rows, "afternoon", null, null, "north").length, 1);
  assert.equal(visibleWatchCustomers(rows, null, "early", "short", "").length, 1);
  assert.equal(visibleWatchCustomers([{ lastSeenAt: "2026-11-09T14:30:00.000Z", label: "North" }], null, null, null, "france").length, 0);
  assert.deepEqual(readHiddenShelves(["NIGHT", "night", "9", "mars"], ["night", "morning"]), ["night"]);
  assert.deepEqual(toggleShelf(["night"], "morning", ["night", "morning"]), ["night", "morning"]);
  assert.deepEqual(toggleShelf(["night"], "night", ["night", "morning"]), []);
  assert.deepEqual(toggleShelf([], "evening", ["night", "evening"]), ["evening"]);
  assert.deepEqual(visibleShelves(["night", "morning"], ["night"], false), ["morning"]);
  assert.deepEqual(visibleShelves(["night", "morning"], ["night"], true), ["night"]);
  assert.equal(activeShelf("gone", ["night"]), "all");
  assert.equal(activeShelf("blank", ["night"]), "blank");
  assert.equal(shelfArg("afternoon"), "afternoon");
  assert.equal(shelfArg("blank"), "");
  assert.equal(shelfArg("all"), null);
  assert.equal(activeSpan("gone", ["short"]), "all");
  assert.equal(spanArg("short"), "short");
  assert.equal(spanArg("blank"), "");
  assert.equal(activeFold("gone", ["late"]), "all");
  assert.equal(foldArg("late"), "late");
  assert.equal(foldArg("blank"), "");
  const names = watchesCsv(rows);
  assert.equal(names.startsWith("kind,mark,count"), true);
  assert.equal(watchesCsv([]), "kind,mark,count");
  assert.equal(names.includes("amount"), false);
  assert.equal(names.includes(",afternoon,"), true);
  assert.equal(names.includes(",quiet,"), true);

  const copy = Object.keys(ROUND158_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND158_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "avpTitle"), "Aviary perches");
  assert.equal(crmv4Text("tr", "pswTitle"), ROUND158_COPY.tr.pswTitle);
  assert.equal(crmv4Text("de", "avpKeeper"), ROUND158_COPY.de.avpKeeper);
  assert.equal(crmv4Text("ru", "pswUnmarked"), ROUND158_COPY.ru.pswUnmarked);
  assert.equal(crmv4Text("ar", "avpNotice"), ROUND158_COPY.ar.avpNotice);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-avp/);
  assert.match(css, /\.c4-psw/);
  assert.match(css, /\.c4-pagehead-perch/);
  assert.match(css, /\.c4-rail-perch/);
  assert.match(css, /\.c4-pagehead-bench/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round158.tsx"), "utf8");
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
  assert.match(viewFile, /lastSeenAt/);
  assert.match(viewFile, /perchesCsv/);
  assert.match(viewFile, /watchesCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-perches/);
  assert.match(viewFile, /data-watches/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "perch"/);
  assert.match(app, /view === "presence"/);
  assert.match(app, /c4-pagehead-perch/);
  assert.match(app, /c4-rail-perch/);
  assert.match(app, /c4-pagehead-bench/);
  console.log("crmv4 round158 tests passed");
}

main();
