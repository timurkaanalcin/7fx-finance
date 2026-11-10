/**
 * Hearth relays and login lanterns.
 * Run: npx tsx tests/crmv4-round159.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND159_COPY } from "../src/lib/crmv4/copy-round159";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeFlame,
  activeGlass,
  activeMark,
  activeMoon,
  activeRung,
  activeSeason,
  activeSteward,
  activeWick,
  addRelay,
  addRelayView,
  assignedLantern,
  bedCounts,
  bedOf,
  bulkRelayPinned,
  bulkRelaySealed,
  clashRelayCount,
  dropRelayView,
  editRelay,
  flameArg,
  flameOf,
  glassArg,
  glassOf,
  lanternShare,
  lanternsCsv,
  leadingMoon,
  leadingSeason,
  markArg,
  moonArg,
  moonOf,
  namedGlasses,
  namedMoons,
  namedSeasons,
  nextRelay,
  reachOf,
  readHiddenSeasons,
  readRelayViews,
  readRelays,
  relayClashIds,
  relayCopy,
  relayCounts,
  relayFlames,
  relayGap,
  relayMark,
  relayMarks,
  relayShare,
  relayStewards,
  relayText,
  relayTimeline,
  relayWicks,
  relaysCsv,
  resetRelays,
  rungArg,
  rungOf,
  seasonArg,
  seasonOf,
  setRelayBanked,
  setRelayPinned,
  setRelaySealed,
  stepRelayFlame,
  stewardArg,
  stewardLabel,
  toggleSeason,
  visibleLanternCustomers,
  visibleRelays,
  visibleSeasons,
  watchOf,
  wickArg,
  wickOf,
} from "../src/lib/crmv4/round159";

function main() {
  assert.equal(relayText("  Check\nAda  "), "Check Ada");
  assert.equal(relayText("   "), "");
  assert.equal(relayText("x".repeat(120)).length, 48);
  assert.equal(stewardLabel("  North  "), "North");
  assert.equal(stewardLabel("   "), "");
  assert.equal(stewardLabel("y".repeat(40)).length, 16);
  assert.equal(relayMark("  VIP  "), "VIP");
  assert.equal(relayMark("   "), "");
  assert.equal(relayMark("z".repeat(30)).length, 10);
  assert.equal(rungOf(" 1 "), 1);
  assert.equal(rungOf(1), 1);
  assert.equal(rungOf("01"), 1);
  assert.equal(rungOf("09"), 9);
  assert.equal(rungOf("16"), 16);
  assert.equal(rungOf(16), 16);
  assert.equal(rungOf(""), null);
  assert.equal(rungOf("00"), null);
  assert.equal(rungOf(0), null);
  assert.equal(rungOf("17"), null);
  assert.equal(rungOf(17), null);
  assert.equal(rungOf(-1), null);
  assert.equal(rungOf(1.5), null);
  assert.equal(wickOf(" FLAX "), "flax");
  assert.equal(wickOf("bees"), "bees");
  assert.equal(wickOf("tallow"), "tallow");
  assert.equal(wickOf("rush"), "rush");
  assert.equal(wickOf(""), "blank");
  assert.equal(wickOf("gold"), "blank");
  assert.equal(flameOf(" EMBER "), "ember");
  assert.equal(flameOf("glow"), "glow");
  assert.equal(flameOf("blaze"), "blaze");
  assert.equal(flameOf(""), "blank");
  assert.equal(flameOf("gold"), "blank");
  assert.equal(bedOf(null), "blank");
  assert.equal(bedOf(1), "coal");
  assert.equal(bedOf(4), "coal");
  assert.equal(bedOf(5), "hearth");
  assert.equal(bedOf(8), "hearth");
  assert.equal(bedOf(9), "stack");
  assert.equal(bedOf(12), "stack");
  assert.equal(bedOf(13), "crown");
  assert.equal(bedOf(16), "crown");
  assert.equal(reachOf(null), "blank");
  assert.equal(reachOf(1), "close");
  assert.equal(reachOf(8), "close");
  assert.equal(reachOf(9), "wide");
  assert.equal(reachOf(16), "wide");
  assert.equal(relayGap(8, 9), 1);
  assert.equal(relayGap(12, 9), -3);
  assert.equal(relayGap(8, 8), 0);
  assert.equal(relayGap(null, 9), null);
  assert.equal(relayGap(8, ""), null);
  assert.equal(relayGap(8, 17), null);
  assert.deepEqual(readRelays([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Check Ada", steward: "  ", rung: 0, wick: "gold", mark: "  ", flame: "gold", pinned: 1, banked: 1, sealed: 1, audit: "nope" }, "nope"]), [
    { id: "2", text: "Check Ada", steward: "", rung: null, wick: "", mark: "", flame: "", pinned: false, banked: false, sealed: false, audit: "" },
  ]);
  assert.equal(readRelays([{ id: "z", text: "One", rung: 1 }])[0].rung, 1);
  assert.equal(readRelays([{ id: "z", text: "One", rung: "09" }])[0].rung, 9);
  const saved = addRelay([], { id: "a", text: "Check Ada", steward: "Nia", rung: 8, wick: "flax", mark: "VIP", flame: "ember" });
  assert.equal(saved[0].audit, "save");
  assert.equal(saved[0].rung, 8);
  assert.equal(saved[0].wick, "flax");
  assert.equal(saved[0].flame, "ember");
  assert.equal(addRelay(saved, { id: "b", text: "Check Ada" }).length, 1);
  assert.equal(addRelay(saved, { id: "a", text: "Other" }).length, 1);
  assert.equal(addRelay(saved, { id: "b", text: "   " }).length, 1);
  const raised = stepRelayFlame(saved, "a", 1);
  assert.equal(raised[0].flame, "glow");
  assert.equal(raised[0].audit, "raise");
  assert.equal(stepRelayFlame(raised, "a", 1)[0].flame, "blaze");
  assert.equal(stepRelayFlame([{ ...saved[0], flame: "blaze" }], "a", 1)[0].flame, "blaze");
  assert.equal(stepRelayFlame([{ ...saved[0], flame: "" }], "a", -1)[0].flame, "");
  assert.equal(stepRelayFlame([{ ...saved[0], flame: "" }], "a", 1)[0].flame, "ember");
  assert.equal(setRelayPinned(saved, "a", true)[0].audit, "pin");
  assert.equal(setRelayPinned(saved, "a", false)[0].audit, "unpin");
  assert.equal(setRelayBanked(saved, "a", true)[0].banked, true);
  assert.equal(setRelayBanked(saved, "a", true)[0].audit, "bank");
  assert.equal(setRelaySealed(saved, "a", true)[0].audit, "seal");
  assert.equal(setRelaySealed(saved, "a", false)[0].audit, "unseal");
  assert.equal(editRelay(saved, "a", "  ")[0].text, "Check Ada");
  assert.equal(editRelay(saved, "a", "Check Bea")[0].audit, "edit");
  const pair = addRelay(saved, { id: "b", text: "Check Bea" });
  assert.equal(editRelay(pair, "b", "Check Ada")[0].text, "Check Bea");
  assert.equal(bulkRelayPinned(pair, ["a", "b"], true).every((card) => card.pinned), true);
  assert.equal(bulkRelaySealed(pair, ["missing"], true)[0].sealed, false);
  assert.equal(resetRelays().length, 0);
  assert.equal(relayCopy("  Check Ada "), "Check Ada");
  assert.equal(relayCopy(" "), "");
  const mixed = [
    { ...saved[0], id: "open", flame: "ember", rung: 4, pinned: true },
    { ...saved[0], id: "held", text: "Held note", banked: true, flame: "glow", rung: 11 },
    { ...saved[0], id: "stowed", text: "Stowed note", sealed: true, banked: true, flame: "blaze", rung: 2 },
    { ...saved[0], id: "late", text: "Aaa late", flame: "ember", rung: 1 },
    { ...saved[0], id: "slack", text: "Slack note", flame: "glow", rung: 1 },
  ];
  assert.equal(visibleRelays(mixed, "open", "late", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleRelays(mixed, "open", "nia", null, null, null, null, null, null, false, false, "").length, 0);
  assert.equal(visibleRelays(mixed, "banked", "", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleRelays(mixed, "sealed", "", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleRelays(mixed, "open", "", null, null, null, null, null, null, true, false, "").length, 0);
  assert.equal(visibleRelays(mixed, "open", "", null, null, null, null, null, null, false, true, "8").every((card) => card.flame === "ember"), true);
  assert.equal(visibleRelays(mixed, "open", "", null, null, null, null, null, null, false, true, "8").length, 2);
  assert.equal(visibleRelays(mixed, "open", "", null, "flax", null, null, null, null, false, false, "").length, 3);
  assert.equal(visibleRelays(mixed, "open", "", "Nia", "flax", "VIP", "ember", 4, null, false, false, "").length, 1);
  assert.equal(visibleRelays(mixed, "open", "", null, null, null, null, null, "coal", false, false, "").length, 3);
  assert.equal(relayTimeline(mixed, "")[0].rung, 1);
  assert.equal(relayTimeline([{ ...saved[0], rung: null }], "").at(-1)?.rung, null);
  const counts = relayCounts(mixed, "8");
  assert.equal(counts.open, 3);
  assert.equal(counts.banked, 1);
  assert.equal(counts.sealed, 1);
  assert.equal(counts.pinned, 1);
  assert.equal(counts.late, 2);
  assert.equal(relayShare(1, 3), 33);
  assert.equal(relayShare(0, 0), 0);
  assert.deepEqual(relayStewards(mixed), ["Nia"]);
  assert.deepEqual(relayMarks(mixed), ["VIP"]);
  assert.deepEqual(relayWicks(mixed), ["flax"]);
  assert.deepEqual(relayFlames(mixed), ["ember", "glow", "blaze"]);
  assert.deepEqual(bedCounts(mixed), [4, 0, 1, 0]);
  assert.equal(activeSteward("gone", ["Nia"]), "all");
  assert.equal(activeSteward("blank", ["Nia"]), "blank");
  assert.equal(stewardArg("blank"), "");
  assert.equal(stewardArg("all"), null);
  assert.equal(activeWick("gone", ["flax"]), "all");
  assert.equal(wickArg("blank"), "blank");
  assert.equal(wickArg("flax"), "flax");
  assert.equal(wickArg("gold"), null);
  assert.equal(activeMark("gone", ["VIP"]), "all");
  assert.equal(markArg("VIP"), "VIP");
  assert.equal(activeFlame("gone", ["ember"]), "all");
  assert.equal(flameArg("ember"), "ember");
  assert.equal(flameArg("blank"), "blank");
  assert.equal(activeRung("coal"), "coal");
  assert.equal(activeRung("09"), "9");
  assert.equal(activeRung("00"), "all");
  assert.equal(activeRung("17"), "all");
  assert.equal(activeRung("pirate"), "all");
  assert.deepEqual(rungArg("1"), { exact: 1, band: null });
  assert.deepEqual(rungArg("hearth"), { exact: null, band: "hearth" });
  assert.deepEqual(rungArg("all"), { exact: null, band: null });
  assert.deepEqual(relayClashIds([
    { ...saved[0], id: "a", rung: 4, text: "Check Ada" },
    { ...saved[0], id: "b", rung: 9, text: "Check Bea" },
  ], "a"), ["b"]);
  assert.deepEqual(relayClashIds([{ ...saved[0], wick: "", rung: 8 }], "a"), []);
  assert.deepEqual(relayClashIds([{ ...saved[0], mark: "" }], "a"), []);
  assert.equal(clashRelayCount([
    { ...saved[0], id: "a", text: "Check Ada" },
    { ...saved[0], id: "b", text: "Check Bea" },
  ]), 2);
  assert.equal(clashRelayCount([{ ...saved[0], mark: "" }]), 0);
  assert.equal(nextRelay(mixed, "3"), "open");
  assert.equal(nextRelay(mixed, "16"), "late");
  assert.equal(nextRelay([{ ...saved[0], flame: "blaze", rung: 4 }], "1"), "");
  assert.equal(nextRelay(mixed, ""), "");
  const csv = relaysCsv(saved, "9");
  assert.equal(csv.startsWith("note,steward,rung,wick,mark,flame,bed,pinned,banked,sealed,gap,audit\n"), true);
  assert.equal(csv.includes("Check Ada,Nia,8,flax,VIP,ember,hearth,0,0,0,1,save"), true);
  assert.equal(relaysCsv([], "").includes("note,steward"), true);
  const view = addRelayView([], { id: "v", name: "Coal bed", tray: "open", query: "ada", steward: "Nia", wick: "flax", mark: "VIP", flame: "ember", rung: "coal" });
  assert.equal(view.length, 1);
  assert.equal(addRelayView(view, { ...view[0], id: "w" }).length, 1);
  assert.equal(readRelayViews([{ id: "v", name: "  " }]).length, 0);
  assert.equal(dropRelayView(view, "v").length, 0);
  const many = Array.from({ length: 14 }, (_, index) => ({ id: `k${index}`, text: `Note ${index}`, steward: "", rung: null, wick: "", mark: "", flame: "", pinned: false, banked: false, sealed: false, audit: "save" }));
  assert.equal(readRelays(many).length, 12);
  const manyViews = Array.from({ length: 6 }, (_, index) => ({ id: `v${index}`, name: `View ${index}`, tray: "open" as const, query: "", steward: "all", wick: "all", mark: "all", flame: "all", rung: "all" }));
  assert.equal(readRelayViews(manyViews).length, 4);

  assert.equal(assignedLantern(" 2026-11-09T14:30:00.000Z "), "harvest");
  assert.equal(assignedLantern("2026-01-10T03:00:00.000Z"), "frost");
  assert.equal(assignedLantern("2026-04-12T20:15:00.000Z"), "bloom");
  assert.equal(assignedLantern("2026-07-12T21:00:00.000Z"), "heat");
  assert.equal(assignedLantern(""), "");
  assert.equal(assignedLantern("x".repeat(80)), "");
  assert.equal(assignedLantern({ lastLoginAt: "2026-11-10T03:05:00.000Z" }), "harvest");
  assert.equal(assignedLantern({ lastLoginAt: "2026-11-10T03:05:00.000Z", lastSeenAt: "2026-01-01T00:00:00.000Z" }), "");
  assert.equal(assignedLantern({ lastLoginAt: "2026-11-10T03:05:00.000Z", timezone: "Europe/Berlin" }), "");
  assert.equal(assignedLantern({ lastLoginAt: "2026-11-10T03:05:00.000Z", language: "de" }), "");
  assert.equal(assignedLantern({ lastLoginAt: "2026-11-10T03:05:00.000Z", country: "DE" }), "");
  assert.equal(assignedLantern({ lastLoginAt: "2026-11-10T03:05:00.000Z", name: "Ada" }), "");
  assert.equal(assignedLantern({ lastLoginAt: "2026-11-10T03:05:00.000Z", email: "a@b.c" }), "");
  assert.equal(assignedLantern({ lastLoginAt: "2026-11-10T03:05:00.000Z", phone: "1" }), "");
  assert.equal(assignedLantern({ lastLoginAt: "2026-11-10T03:05:00.000Z", desk: "North" }), "");
  assert.equal(assignedLantern({ lastLoginAt: "2026-11-10T03:05:00.000Z", address: "1 Road" }), "");
  assert.equal(assignedLantern({ lastLoginAt: "2026-11-10T03:05:00.000Z", city: "Berlin" }), "");
  assert.equal(assignedLantern({ lastLoginAt: "2026-11-10T03:05:00.000Z", firstName: "Ada" }), "");
  assert.equal(assignedLantern({ lastLoginAt: "2026-11-10T03:05:00.000Z", lastName: "North" }), "");
  assert.equal(assignedLantern({ lastLoginAt: "2026-11-10T03:05:00.000Z", lastCountryName: "Germany" }), "");
  assert.equal(assignedLantern({ lastLoginAt: "2026-11-10T03:05:00.000Z", createdAt: "2026-01-01T00:00:00.000Z" }), "");
  assert.equal(seasonOf("2026-11-09T14:30:00.000Z"), "harvest");
  assert.equal(seasonOf("2026-12-06T09:00:00.000Z"), "frost");
  assert.equal(seasonOf("2026-03-04T04:00:00.000Z"), "bloom");
  assert.equal(seasonOf("2026-08-16T11:00:00.000Z"), "heat");
  assert.equal(seasonOf(""), "");
  assert.equal(moonOf("2026-11-09T14:30:00.000Z"), "new");
  assert.equal(moonOf("2026-04-12T20:15:00.000Z"), "full");
  assert.equal(moonOf("2026-09-25T18:00:00.000Z"), "old");
  assert.equal(moonOf(""), "");
  assert.equal(glassOf("2026-01-10T03:00:00.000Z"), "brief");
  assert.equal(glassOf("2026-03-11T09:00:00.000Z"), "steady");
  assert.equal(glassOf("2026-04-12T20:15:00.000Z"), "late");
  assert.equal(glassOf(""), "");
  assert.equal(watchOf("2026-11-09T14:30:00.000Z"), "desk");
  assert.equal(watchOf("2026-11-15T08:00:00.000Z"), "rest");
  assert.equal(watchOf("2026-01-10T03:00:00.000Z"), "rest");
  assert.equal(watchOf(""), "");
  const rows = [
    { lastLoginAt: "2026-11-09T14:30:00.000Z", label: "Ada North" },
    { lastLoginAt: "2026-11-09T15:00:00.000Z", label: "Bea South" },
    { lastLoginAt: "2026-11-09T16:10:00.000Z", label: "Ann Extra" },
    { lastLoginAt: "2026-01-10T03:00:00.000Z", label: "Ann West" },
    { lastLoginAt: "2026-04-12T20:15:00.000Z", label: "Chris East" },
    { lastLoginAt: "2026-07-12T21:00:00.000Z", label: "Uma" },
    { lastLoginAt: "not-a-date", label: "Mark" },
    { lastLoginAt: "2026-08-15T08:00:00.000Z", label: "West" },
    { lastLoginAt: "2026-03-11T09:00:00.000Z", label: "Otto" },
    { lastLoginAt: "4ada", label: "Mark" },
    { lastLoginAt: "", label: "Blank" },
  ];
  assert.equal(leadingSeason(rows), "harvest");
  assert.equal(leadingMoon(rows), "new");
  assert.equal(lanternShare(2, 6), 33);
  assert.equal(lanternShare(0, 0), 0);
  assert.deepEqual(namedSeasons(rows), ["frost", "bloom", "heat", "harvest"]);
  assert.deepEqual(namedMoons(rows), ["new", "full"]);
  assert.deepEqual(namedGlasses(rows), ["brief", "steady", "late"]);
  assert.equal(visibleLanternCustomers(rows, "harvest", null, null, "north").length, 1);
  assert.equal(visibleLanternCustomers(rows, null, "new", "brief", "").length, 1);
  assert.equal(visibleLanternCustomers([{ lastLoginAt: "2026-11-09T14:30:00.000Z", label: "North" }], null, null, null, "france").length, 0);
  assert.deepEqual(readHiddenSeasons(["FROST", "frost", "9", "mars"], ["frost", "bloom"]), ["frost"]);
  assert.deepEqual(toggleSeason(["frost"], "bloom", ["frost", "bloom"]), ["frost", "bloom"]);
  assert.deepEqual(toggleSeason(["frost"], "frost", ["frost", "bloom"]), []);
  assert.deepEqual(toggleSeason([], "heat", ["frost", "heat"]), ["heat"]);
  assert.deepEqual(visibleSeasons(["frost", "bloom"], ["frost"], false), ["bloom"]);
  assert.deepEqual(visibleSeasons(["frost", "bloom"], ["frost"], true), ["frost"]);
  assert.equal(activeSeason("gone", ["frost"]), "all");
  assert.equal(activeSeason("blank", ["frost"]), "blank");
  assert.equal(seasonArg("harvest"), "harvest");
  assert.equal(seasonArg("blank"), "");
  assert.equal(seasonArg("all"), null);
  assert.equal(activeMoon("gone", ["new"]), "all");
  assert.equal(moonArg("new"), "new");
  assert.equal(moonArg("blank"), "");
  assert.equal(activeGlass("gone", ["brief"]), "all");
  assert.equal(glassArg("brief"), "brief");
  assert.equal(glassArg("blank"), "");
  const names = lanternsCsv(rows);
  assert.equal(names.startsWith("kind,mark,count"), true);
  assert.equal(lanternsCsv([]), "kind,mark,count");
  assert.equal(names.includes("amount"), false);
  assert.equal(names.includes(",harvest,"), true);
  assert.equal(names.includes(",desk,"), true);

  const copy = Object.keys(ROUND159_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND159_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "hrlTitle"), "Hearth relays");
  assert.equal(crmv4Text("tr", "ltnTitle"), ROUND159_COPY.tr.ltnTitle);
  assert.equal(crmv4Text("de", "hrlSteward"), ROUND159_COPY.de.hrlSteward);
  assert.equal(crmv4Text("ru", "ltnUnmarked"), ROUND159_COPY.ru.ltnUnmarked);
  assert.equal(crmv4Text("ar", "hrlNotice"), ROUND159_COPY.ar.hrlNotice);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-hrl/);
  assert.match(css, /\.c4-ltn/);
  assert.match(css, /\.c4-pagehead-hearth/);
  assert.match(css, /\.c4-rail-hearth/);
  assert.match(css, /\.c4-pagehead-perch/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round159.tsx"), "utf8");
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
  assert.match(viewFile, /lastLoginAt/);
  assert.match(viewFile, /relaysCsv/);
  assert.match(viewFile, /lanternsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "r"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-relays/);
  assert.match(viewFile, /data-lanterns/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "hearth"/);
  assert.match(app, /view === "lantern"/);
  assert.match(app, /c4-pagehead-hearth/);
  assert.match(app, /c4-rail-hearth/);
  assert.match(app, /c4-pagehead-perch/);
  console.log("crmv4 round159 tests passed");
}

main();
