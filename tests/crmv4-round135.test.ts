/**
 * Host cards and trading servers.
 * Run: npx tsx tests/crmv4-round135.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND135_COPY } from "../src/lib/crmv4/copy-round135";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeHour,
  activeServer,
  activeWing,
  addHost,
  addView,
  bulkHostFolded,
  bulkHostPassed,
  dropView,
  editHost,
  hostCopy,
  hostCounts,
  hostHours,
  hostShare,
  hostText,
  hostTimeline,
  hostWings,
  hostsCsv,
  hourArg,
  hourLabel,
  leadingServer,
  namedServers,
  readHiddenServers,
  readHosts,
  readViews,
  resetHosts,
  serverLines,
  serverShare,
  serverText,
  serversCsv,
  setHostFolded,
  setHostPassed,
  setHostQuiet,
  stepHostRank,
  toggleServer,
  visibleHosts,
  visibleServerCustomers,
  visibleServers,
  wingArg,
  wingLabel,
} from "../src/lib/crmv4/round135";

function main() {
  assert.equal(hostText("  Door\nnote  "), "Door note");
  assert.equal(hostText("   "), "");
  assert.equal(hostText("x".repeat(140)).length, 96);
  assert.equal(wingLabel("  East  "), "East");
  assert.equal(wingLabel("   "), "");
  assert.equal(wingLabel("y".repeat(40)).length, 14);
  assert.equal(hourLabel(" 09:10 "), "09:10");
  assert.equal(hourLabel("   "), "");
  assert.equal(hourLabel("t".repeat(20)).length, 5);
  assert.deepEqual(readHosts([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Meet at the door", wing: "  ", hour: "  ", rank: 3, folded: 1, passed: 1, quiet: 1, audit: "nope" }, "nope"]), [
    { id: "2", text: "Meet at the door", wing: "", hour: "", rank: 0, folded: false, passed: false, quiet: false, audit: "" },
  ]);
  const saved = addHost([], { id: "a", text: " Meet at the door ", wing: " East ", hour: " 09:10 " });
  assert.deepEqual(saved, [{ id: "a", text: "Meet at the door", wing: "East", hour: "09:10", rank: 0, folded: false, passed: false, quiet: false, audit: "save" }]);
  assert.equal(addHost(saved, { id: "b", text: "  " }).length, 1);
  assert.equal(addHost(saved, { id: "c", text: "Meet at the door" }).length, 1);
  assert.equal(addHost(saved, { id: "a", text: "Other card" }).length, 1);
  const raised = stepHostRank(saved, "a", 1);
  assert.equal(raised[0].rank, 1);
  assert.equal(raised[0].audit, "raise");
  const first = stepHostRank(raised, "a", 1);
  assert.equal(first[0].rank, 2);
  assert.equal(stepHostRank(first, "a", 1)[0].audit, "raise");
  const lowered = stepHostRank(first, "a", -1);
  assert.equal(lowered[0].rank, 1);
  assert.equal(lowered[0].audit, "lower");
  assert.equal(stepHostRank([{ ...saved[0], rank: 0 }], "a", -1)[0].audit, "save");
  const folded = setHostFolded(first, "a", true);
  assert.equal(folded[0].folded, true);
  assert.equal(folded[0].audit, "fold");
  const passed = setHostPassed(folded, "a", true);
  assert.equal(passed[0].passed, true);
  assert.equal(passed[0].audit, "pass");
  const quiet = setHostQuiet(passed, "a", true);
  assert.equal(quiet[0].quiet, true);
  assert.equal(quiet[0].audit, "quiet");
  const aloud = setHostQuiet(setHostPassed(setHostFolded(quiet, "a", false), "a", false), "a", false);
  assert.equal(aloud[0].quiet, false);
  assert.equal(aloud[0].passed, false);
  assert.equal(aloud[0].folded, false);
  assert.equal(aloud[0].audit, "aloud");
  assert.equal(editHost(saved, "a", "  ")[0].text, "Meet at the door");
  assert.equal(editHost(saved, "a", "Meet at the door")[0].audit, "save");
  const second = addHost(saved, { id: "b", text: "Other card", wing: "West", hour: "10:00" });
  assert.equal(editHost(second, "b", "Meet at the door").find((card) => card.id === "b")?.text, "Other card");
  const edited = editHost(second, "b", " Reworded card ");
  assert.equal(edited.find((card) => card.id === "b")?.text, "Reworded card");
  assert.equal(edited.find((card) => card.id === "b")?.audit, "edit");
  assert.deepEqual(visibleHosts(saved, "open", "door", null, null, false).map((card) => card.id), ["a"]);
  assert.deepEqual(visibleHosts(saved, "open", "East", null, null, false), []);
  assert.deepEqual(visibleHosts(saved, "open", "", "", null, false), []);
  assert.deepEqual(visibleHosts(saved, "open", "", "East", null, false).map((card) => card.id), ["a"]);
  assert.deepEqual(visibleHosts(saved, "open", "", null, "09:10", false).map((card) => card.id), ["a"]);
  assert.deepEqual(visibleHosts(saved, "open", "", null, "10:00", false), []);
  assert.deepEqual(visibleHosts(first, "open", "", null, null, true).map((card) => card.id), ["a"]);
  assert.deepEqual(visibleHosts(saved, "open", "", null, null, true), []);
  assert.deepEqual(visibleHosts(folded, "open", "", null, null, false), []);
  assert.deepEqual(visibleHosts(folded, "folded", "", null, null, false).map((card) => card.id), ["a"]);
  assert.deepEqual(visibleHosts(passed, "folded", "", null, null, false), []);
  assert.deepEqual(visibleHosts(passed, "passed", "", null, null, false).map((card) => card.id), ["a"]);
  const ranked = stepHostRank(second, "b", 1);
  assert.deepEqual(visibleHosts(ranked, "open", "", null, null, false).map((card) => card.id), ["b", "a"]);
  const bulkFold = bulkHostFolded(second, ["b", "missing"], true);
  assert.equal(bulkFold.find((card) => card.id === "b")?.folded, true);
  assert.equal(bulkFold.find((card) => card.id === "a")?.folded, false);
  assert.equal(bulkFold.find((card) => card.id === "b")?.audit, "fold");
  const bulkPass = bulkHostPassed(second, shownIds(second), true);
  assert.equal(bulkPass.every((card) => card.passed), true);
  assert.equal(hostCopy("  Meet at the door "), "Meet at the door");
  assert.equal(hostCopy("   "), "");
  assert.deepEqual(resetHosts(), []);
  const many = Array.from({ length: 40 }, (_, index) => ({ id: `n${index}`, text: `Card ${index}`, wing: index % 2 ? "A" : "", hour: index % 3 ? "09:10" : "" }));
  assert.equal(readHosts(many).length, 36);
  assert.equal(hostsCsv([{ id: "", text: "skip" }, { id: "a", text: 'Meet "the" door', wing: "Wing, 2", hour: "09:10", rank: 2, folded: true, passed: false, quiet: true, audit: "save" }]), 'text,wing,hour,rank,folded,passed,quiet,audit\n"Meet ""the"" door","Wing, 2",09:10,2,1,0,1,save');
  assert.equal(hostsCsv([]), "text,wing,hour,rank,folded,passed,quiet,audit");
  assert.equal(hostsCsv(saved).includes("amount"), false);
  assert.deepEqual(hostCounts(passed), { open: 0, folded: 0, passed: 1, quiet: 0, firstOpen: 0 });
  assert.equal(hostCounts(first).firstOpen, 1);
  assert.equal(hostShare(1, 4), 25);
  assert.equal(hostShare(0, 4), 0);
  assert.equal(hostShare(1, 0), 0);
  assert.deepEqual(hostWings(second), ["East", "West"]);
  assert.deepEqual(hostHours(second), ["09:10", "10:00"]);
  assert.deepEqual(hostTimeline(second, "").map((card) => card.hour), ["09:10", "10:00"]);
  assert.deepEqual(hostTimeline([{ id: "a", text: "Late", wing: "", hour: "", rank: 0, folded: false, passed: false, quiet: false, audit: "save" }, ...second], "card").map((card) => card.id), ["b"]);
  const blankHour = addHost([], { id: "z", text: "No hour" });
  assert.deepEqual(hostTimeline([...blankHour, ...saved], "").map((card) => card.id), ["a", "z"]);
  assert.equal(activeWing("missing", ["East"]), "all");
  assert.equal(activeWing("blank", ["East"]), "blank");
  assert.equal(activeWing(" East ", ["East"]), "East");
  assert.equal(wingArg("all"), null);
  assert.equal(wingArg("blank"), "");
  assert.equal(wingArg(" East "), "East");
  assert.equal(activeHour("missing", ["09:10"]), "all");
  assert.equal(activeHour("blank", ["09:10"]), "blank");
  assert.equal(activeHour(" 09:10 ", ["09:10"]), "09:10");
  assert.equal(hourArg("all"), null);
  assert.equal(hourArg("blank"), "");
  assert.equal(hourArg(" 09:10 "), "09:10");
  const views = addView([], { id: "v1", name: " Morning ", tray: "folded", query: " door ", wing: "East", hour: "09:10" });
  assert.deepEqual(views, [{ id: "v1", name: "Morning", tray: "folded", query: "door", wing: "East", hour: "09:10" }]);
  assert.equal(addView(views, { id: "v2", name: " ", tray: "open", query: "", wing: "all", hour: "all" }).length, 1);
  assert.equal(addView(views, { id: "v2", name: "Morning", tray: "open", query: "", wing: "all", hour: "all" }).length, 1);
  assert.equal(dropView(views, "v1").length, 0);
  assert.equal(readViews([{ id: "v3", name: "Open", tray: "nope", wing: "blank", hour: "blank" }])[0].tray, "open");
  assert.equal(readViews([{ id: "v3", name: "Open", tray: "open", wing: "blank", hour: "blank" }])[0].hour, "blank");
  assert.equal(readViews(Array.from({ length: 20 }, (_, index) => ({ id: `v${index}`, name: `View ${index}`, tray: "open" }))).length, 12);

  assert.equal(serverText(" Live "), "Live");
  assert.equal(serverText({ tradingServer: " MT5 " }), "MT5");
  assert.equal(serverText(""), "");
  assert.equal(serverText(1 as never), "");
  assert.equal(serverText({ tradingGroup: "VIP-USD" }), "");
  assert.equal(serverText({ desk: "Istanbul" }), "");
  assert.equal(serverText({ deskId: "d1" }), "");
  assert.equal(serverText({ brokerName: "ING" }), "");
  assert.equal(serverText({ campaign: "Spring" }), "");
  assert.equal(serverText({ assigneeName: "Ada" }), "");
  assert.equal(serverText({ saleStatus: "NEW" }), "");
  assert.equal(serverText({ retentionStatus: "ACTIVE" }), "");
  assert.equal(serverText({ potentialStatus: "HIGH" }), "");
  assert.equal(serverText({ documentsStatus: "APPROVED" }), "");
  assert.equal(serverText({ accountType: "VIP" }), "");
  assert.equal(serverText({ role: "TRADER" }), "");
  assert.equal(serverText({ timezone: "UTC" }), "");
  assert.equal(serverText({ language: "en" }), "");
  assert.equal(serverText({ validation: "VERIFIED" }), "");
  assert.equal(serverText({ validationStatus: "VERIFIED" }), "");
  assert.equal(serverText({ referralCodeUsed: "INVITE" }), "");
  assert.equal(serverText({ tradingServer: "MT5", desk: "Istanbul" }), "");
  const rows = [
    { id: "u1", label: "Ada", tradingServer: "Live" },
    { id: "u2", label: "Bea", tradingServer: { tradingServer: "MT5" } },
    { id: "u3", label: "Cid", tradingServer: "Live" },
    { id: "u4", label: "Dot", tradingServer: "" },
    { id: "u5", label: "Eve", tradingServer: { saleStatus: "NEW" } as never },
  ];
  assert.deepEqual(serverLines(rows), [
    { tradingServer: "", count: 2 },
    { tradingServer: "Live", count: 2 },
    { tradingServer: "MT5", count: 1 },
  ]);
  assert.deepEqual(namedServers(rows), ["Live", "MT5"]);
  assert.equal(serverShare(2, 5), 40);
  assert.equal(serverShare(0, 5), 0);
  assert.equal(serverShare(1, 0), 0);
  assert.equal(leadingServer(rows), "Live");
  assert.equal(leadingServer([{ tradingServer: "" }]), "");
  assert.equal(leadingServer([{ tradingServer: "MT5" }, { tradingServer: "Live" }]), "Live");
  assert.deepEqual(visibleServerCustomers(rows, "Live", false, "ada").map((row) => row.id), ["u1"]);
  assert.deepEqual(visibleServerCustomers(rows, "", true, "").map((row) => row.id), ["u4", "u5"]);
  assert.deepEqual(visibleServerCustomers(rows, "Live", false, "100"), []);
  assert.deepEqual(readHiddenServers(["Live", "OLD", ""], ["Live", "MT5"]), ["Live"]);
  assert.deepEqual(toggleServer(["Live"], "OLD", ["Live"]), ["Live"]);
  assert.deepEqual(visibleServers(["Live", "MT5"], ["MT5"], false), ["Live"]);
  assert.equal(activeServer("MT5", ["Live"]), "");
  assert.equal(serversCsv(rows), "server,count\n,2\nLive,2\nMT5,1");
  assert.equal(serversCsv([]), "server,count");
  assert.equal(serversCsv(rows).includes("amount"), false);
  assert.equal(serverLines(rows).every((line) => !("amount" in line) && !("currency" in line)), true);

  const copy = Object.keys(ROUND135_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND135_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "hstTitle"), "Host cards");
  assert.equal(crmv4Text("tr", "tsvTitle"), ROUND135_COPY.tr.tsvTitle);
  assert.equal(crmv4Text("de", "hstWing"), ROUND135_COPY.de.hstWing);
  assert.equal(crmv4Text("ru", "tsvBlank"), ROUND135_COPY.ru.tsvBlank);
  assert.equal(crmv4Text("ar", "hstNotice"), ROUND135_COPY.ar.hstNotice);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-host/);
  assert.match(css, /\.c4-server/);
  assert.match(css, /\.c4-rail-atelier/);
  assert.match(css, /\.c4-menu-atelier/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round135.tsx"), "utf8");
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
  assert.match(view, /tradingServer/);
  assert.match(view, /hostsCsv/);
  assert.match(view, /serversCsv/);
  assert.match(view, /Escape/);
  assert.match(view, /event\.key !== "\/"/);
  assert.match(view, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(view, /data-host/);
  assert.match(view, /data-server/);
  assert.match(view, /data-logo="mono"/);
  assert.match(view, /customers/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "host"/);
  assert.match(app, /view === "server"/);
  const rail = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round30.tsx"), "utf8");
  assert.match(rail, /c4-rail-atelier/);
  assert.match(rail, /c4-menu-atelier/);
  assert.match(rail, /data-logo="mono"/);
  console.log("crmv4 round135 tests passed");
}

function shownIds(cards: { id: string }[]): string[] {
  return cards.map((card) => card.id);
}

main();
