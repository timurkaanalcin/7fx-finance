/**
 * Marquetry tasks and trade gates.
 * Run: npx tsx tests/crmv4-round165.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND165_COPY } from "../src/lib/crmv4/copy-round165";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeDomain,
  activeGate,
  activeHost,
  activeHour,
  activeOwner,
  activeRoom,
  activeTag,
  activeWeight,
  addMarq,
  addMarqView,
  bandOf,
  bulkMarqDone,
  bulkMarqPinned,
  bulkMarqRoom,
  clashMarqCount,
  domainArg,
  domainOf,
  dropMarqView,
  editMarq,
  gateArg,
  gateOf,
  gatesCsv,
  hostArg,
  hostSpanOf,
  hourArg,
  hourOf,
  leadingDomain,
  leadingGate,
  marqCopy,
  marqCounts,
  marqGap,
  marqShare,
  marqTag,
  marqText,
  marqTimeline,
  marqsCsv,
  namedDomains,
  namedGates,
  namedHosts,
  nextMarq,
  ownerArg,
  ownerLabel,
  ownerLoad,
  presentGates,
  reachOf,
  readHiddenGates,
  readMarqViews,
  readMarqs,
  resetMarqs,
  roomArg,
  roomOf,
  setMarqDone,
  setMarqHeld,
  setMarqPinned,
  stepMarqWeight,
  suggestRoom,
  tagArg,
  tgnShare,
  toggleGate,
  visibleGateCustomers,
  visibleGates,
  visibleMarqs,
  weightArg,
  weightOf,
} from "../src/lib/crmv4/round165";

function main() {
  assert.equal(marqText("  Call\nAda  "), "Call Ada");
  assert.equal(marqText("   "), "");
  assert.equal(marqText("x".repeat(80)).length, 40);
  assert.equal(ownerLabel("  North  "), "North");
  assert.equal(ownerLabel("   "), "");
  assert.equal(ownerLabel("y".repeat(40)).length, 12);
  assert.equal(marqTag("  VIP  "), "VIP");
  assert.equal(marqTag("   "), "");
  assert.equal(marqTag("z".repeat(20)).length, 8);
  assert.equal(hourOf(" 1 "), 1);
  assert.equal(hourOf(1), 1);
  assert.equal(hourOf("01"), null);
  assert.equal(hourOf(2), 2);
  assert.equal(hourOf("4"), 4);
  assert.equal(hourOf("8"), 8);
  assert.equal(hourOf(16), 16);
  assert.equal(hourOf(""), null);
  assert.equal(hourOf(0), null);
  assert.equal(hourOf("0"), null);
  assert.equal(hourOf(3), null);
  assert.equal(hourOf("32"), null);
  assert.equal(hourOf(1.5), null);
  assert.equal(hourOf(-1), null);
  assert.equal(roomOf(" ATELIER "), "atelier");
  assert.equal(roomOf("salon"), "salon");
  assert.equal(roomOf("gallery"), "gallery");
  assert.equal(roomOf("vault"), "vault");
  assert.equal(roomOf(""), "blank");
  assert.equal(roomOf("gold"), "blank");
  assert.equal(weightOf(" LIGHT "), "light");
  assert.equal(weightOf("firm"), "firm");
  assert.equal(weightOf("heavy"), "heavy");
  assert.equal(weightOf(""), "blank");
  assert.equal(weightOf("gold"), "blank");
  assert.equal(bandOf(null), "blank");
  assert.equal(bandOf(1), "brief");
  assert.equal(bandOf(2), "half");
  assert.equal(bandOf(4), "half");
  assert.equal(bandOf(8), "full");
  assert.equal(bandOf(16), "full");
  assert.equal(reachOf(null), "blank");
  assert.equal(reachOf(1), "slim");
  assert.equal(reachOf(2), "slim");
  assert.equal(reachOf(4), "wide");
  assert.equal(reachOf(16), "wide");
  assert.equal(marqGap(2, 8), 6);
  assert.equal(marqGap(8, 2), -6);
  assert.equal(marqGap(2, 2), 0);
  assert.equal(marqGap(null, 2), null);
  assert.equal(marqGap(2, ""), null);
  assert.equal(marqGap(2, 32), null);
  assert.deepEqual(readMarqs([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Call Ada", owner: "  ", hour: 32, room: "gold", tag: "  ", weight: "gold", pinned: 1, held: 1, done: 1, audit: "nope" }, "nope"]), [
    { id: "2", text: "Call Ada", owner: "", hour: null, room: "", tag: "", weight: "", pinned: false, held: false, done: false, audit: "" },
  ]);
  assert.equal(readMarqs([{ id: "z", text: "One", hour: 1 }])[0].hour, 1);
  assert.equal(readMarqs([{ id: "z", text: "One", hour: "01" }])[0].hour, null);
  const saved = addMarq([], { id: "a", text: "Call Ada", owner: "Nia", hour: 2, room: "atelier", tag: "VIP", weight: "light" });
  assert.equal(saved[0].audit, "save");
  assert.equal(saved[0].hour, 2);
  assert.equal(saved[0].room, "atelier");
  assert.equal(saved[0].weight, "light");
  assert.equal(addMarq(saved, { id: "b", text: "Call Ada" }).length, 1);
  assert.equal(addMarq(saved, { id: "a", text: "Other" }).length, 1);
  assert.equal(addMarq(saved, { id: "b", text: "   " }).length, 1);
  const full = Array.from({ length: 10 }, (_, index) => ({ id: `k${index}`, text: `Note ${index}`, owner: "", hour: null, room: "", tag: "", weight: "", pinned: false, held: false, done: false, audit: "save" }));
  assert.equal(addMarq(full, { id: "extra", text: "More" }).length, 10);
  assert.equal(addMarq(full, { id: "extra", text: "More" })[0].id, "extra");
  assert.equal(stepMarqWeight(saved, "a", 1)[0].weight, "firm");
  assert.equal(stepMarqWeight(saved, "a", 1)[0].audit, "raise");
  assert.equal(stepMarqWeight([{ ...saved[0], weight: "heavy" }], "a", 1)[0].weight, "heavy");
  assert.equal(stepMarqWeight(saved, "a", -1)[0].weight, "");
  assert.equal(stepMarqWeight(saved, "a", -1)[0].audit, "lower");
  assert.equal(setMarqPinned(saved, "a", true)[0].audit, "pin");
  assert.equal(setMarqPinned(saved, "a", false)[0].audit, "unpin");
  assert.equal(setMarqHeld(saved, "a", true)[0].audit, "hold");
  assert.equal(setMarqHeld(saved, "a", false)[0].audit, "release");
  assert.equal(setMarqDone(saved, "a", true)[0].audit, "done");
  assert.equal(setMarqDone(saved, "a", false)[0].audit, "reopen");
  assert.equal(editMarq(saved, "a", "  Call back  ")[0].text, "Call back");
  assert.equal(editMarq(saved, "a", "  Call back  ")[0].audit, "edit");
  assert.equal(editMarq(saved, "a", "   ")[0].text, "Call Ada");
  const pair = addMarq(saved, { id: "b", text: "Other" });
  assert.equal(editMarq(pair, "b", "Call Ada").find((card) => card.id === "b")?.text, "Other");
  assert.equal(bulkMarqPinned(pair, ["a"], true).find((card) => card.id === "a")?.pinned, true);
  assert.equal(bulkMarqDone(pair, ["b"], true).find((card) => card.id === "b")?.done, true);
  assert.equal(bulkMarqRoom(pair, ["a"], "salon").find((card) => card.id === "a")?.room, "salon");
  assert.equal(bulkMarqRoom(pair, ["a"], "salon").find((card) => card.id === "a")?.audit, "room");
  assert.equal(bulkMarqRoom(pair, ["a"], "gold").find((card) => card.id === "a")?.room, "atelier");
  assert.equal(bulkMarqRoom([{ ...saved[0], room: "salon" }], ["a"], "salon")[0].audit, "save");
  assert.deepEqual(resetMarqs(), []);
  assert.equal(marqCopy("  Call Ada "), "Call Ada");
  assert.equal(marqCopy(" "), "");
  assert.equal(ownerLoad(saved, "Nia"), 1);
  assert.equal(ownerLoad(saved, "  "), 0);
  assert.equal(ownerLoad([{ ...saved[0], done: true }], "Nia"), 0);
  const mixed = [
    { ...saved[0], id: "open", text: "Open", weight: "light", hour: 2, held: false, done: false },
    { ...saved[0], id: "held", text: "Held", held: true, done: false, weight: "firm", hour: 8 },
    { ...saved[0], id: "done", text: "Done", held: true, done: true, weight: "heavy", hour: 16 },
  ];
  assert.equal(visibleMarqs(mixed, "open", "", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleMarqs(mixed, "held", "", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleMarqs(mixed, "done", "", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleMarqs(mixed, "open", "nope", null, null, null, null, null, null, false, false, "").length, 0);
  assert.equal(visibleMarqs(mixed, "open", "", "Nia", null, null, null, null, null, false, false, "")[0].id, "open");
  assert.equal(visibleMarqs(mixed, "done", "", null, "atelier", "VIP", "heavy", 16, null, false, false, "")[0].id, "done");
  assert.equal(visibleMarqs(mixed, "open", "", null, null, null, null, null, "half", false, false, "")[0].id, "open");
  assert.equal(visibleMarqs(mixed, "held", "", null, null, null, null, null, "wide", false, false, "")[0].id, "held");
  assert.equal(visibleMarqs(mixed, "done", "", null, null, null, null, null, null, true, false, "")[0].id, "done");
  assert.equal(marqCounts(mixed, 8).late, 1);
  assert.equal(marqCounts(mixed, 8).open, 1);
  assert.equal(marqShare(1, 4), 25);
  assert.equal(marqShare(0, 4), 0);
  assert.equal(marqShare(1, 0), 0);
  const line = marqTimeline(mixed, "");
  assert.deepEqual(line.map((card) => card.hour), [2, 8, 16]);
  assert.equal(activeOwner("gone", ["Nia"]), "all");
  assert.equal(activeOwner("blank", ["Nia"]), "blank");
  assert.equal(ownerArg("Nia"), "Nia");
  assert.equal(ownerArg("blank"), "");
  assert.equal(ownerArg("all"), null);
  assert.equal(activeRoom("gone", ["atelier"]), "all");
  assert.equal(roomArg("atelier"), "atelier");
  assert.equal(roomArg("blank"), "blank");
  assert.equal(activeTag("gone", ["VIP"]), "all");
  assert.equal(tagArg("VIP"), "VIP");
  assert.equal(tagArg("blank"), "");
  assert.equal(activeWeight("gone", ["light"]), "all");
  assert.equal(weightArg("light"), "light");
  assert.equal(weightArg("blank"), "blank");
  assert.equal(activeHour("gone"), "all");
  assert.equal(activeHour("brief"), "brief");
  assert.equal(activeHour("4"), "4");
  assert.deepEqual(hourArg("half"), { exact: null, pick: "half" });
  assert.deepEqual(hourArg("2"), { exact: 2, pick: null });
  assert.deepEqual(hourArg("all"), { exact: null, pick: null });
  const clash = addMarq(saved, { id: "b", text: "Other", owner: "Nia", room: "atelier" });
  assert.equal(clashMarqCount(clash), 2);
  assert.equal(clashMarqCount(saved), 0);
  assert.equal(nextMarq(mixed, 4), "open");
  assert.equal(nextMarq(mixed, ""), "");
  assert.equal(suggestRoom([]), "atelier");
  assert.equal(suggestRoom(addMarq(saved, { id: "c", text: "Second", room: "atelier" })), "salon");
  const csv = marqsCsv(saved, 8);
  assert.equal(csv.startsWith("note,owner,hour,room,tag,weight,band,pinned,held,done,gap,audit"), true);
  assert.equal(csv.includes("amount"), false);
  assert.equal(csv.includes(",2,"), true);
  const views = addMarqView([], { id: "v", name: "Morning", tray: "open", query: "Ada", owner: "Nia", room: "atelier", tag: "VIP", weight: "light", hour: "2" });
  assert.equal(views[0].hour, "2");
  assert.equal(addMarqView(views, { id: "v2", name: "Morning", tray: "open", query: "", owner: "all", room: "all", tag: "all", weight: "all", hour: "all" }).length, 1);
  assert.equal(dropMarqView(views, "v").length, 0);
  assert.equal(readMarqViews([{ id: "v", name: "  " }]).length, 0);
  assert.equal(gateOf(true), "enabled");
  assert.equal(gateOf(false), "locked");
  assert.equal(gateOf(" YES "), "enabled");
  assert.equal(gateOf("no"), "locked");
  assert.equal(gateOf(""), "");
  assert.equal(gateOf(null), "");
  assert.equal(gateOf({ tradingEnabled: true }), "enabled");
  assert.equal(gateOf({ name: "Ada", tradingEnabled: true }), "");
  assert.equal(gateOf({ ftd: true, tradingEnabled: true }), "");
  assert.equal(domainOf(" ada@example.com "), "E");
  assert.equal(domainOf("ada@7mail.com"), "");
  assert.equal(domainOf(""), "");
  assert.equal(hostSpanOf("a@ab.com"), "short");
  assert.equal(hostSpanOf("a@example.com"), "mid");
  assert.equal(hostSpanOf("a@international.example.com"), "long");
  assert.equal(hostSpanOf(""), "");
  const rows = [
    { gate: true, label: "Ada North", email: "ada@example.com" },
    { gate: true, label: "Amy", email: "amy@extra.com" },
    { gate: false, label: "Leo", email: "leo@ab.com" },
    { gate: "", label: "7 Blank", email: "" },
  ];
  assert.equal(leadingGate(rows), "enabled");
  assert.equal(leadingDomain(rows), "E");
  assert.deepEqual(namedGates(rows), ["enabled", "locked"]);
  assert.ok(namedDomains(rows).includes("E"));
  assert.ok(namedHosts(rows).includes("long") === false);
  assert.ok(namedHosts(rows).includes("mid"));
  assert.equal(tgnShare(2, 4), 50);
  assert.equal(tgnShare(0, 0), 0);
  assert.deepEqual(presentGates(rows).includes("blank"), true);
  assert.deepEqual(readHiddenGates(["nope", "enabled", "enabled"], ["enabled", "locked"]), ["enabled"]);
  assert.deepEqual(toggleGate([], "enabled", ["enabled"]), ["enabled"]);
  assert.deepEqual(toggleGate(["enabled"], "enabled", ["enabled"]), []);
  assert.deepEqual(visibleGates(["enabled", "locked"], ["enabled"], false), ["locked"]);
  assert.deepEqual(visibleGates(["enabled", "locked"], ["enabled"], true), ["enabled"]);
  assert.equal(activeGate("gone", ["enabled"]), "all");
  assert.equal(activeGate("blank", ["enabled"]), "blank");
  assert.equal(gateArg("enabled"), "enabled");
  assert.equal(gateArg("blank"), "");
  assert.equal(gateArg("all"), null);
  assert.equal(activeDomain("gone", ["E"]), "all");
  assert.equal(domainArg("E"), "E");
  assert.equal(domainArg("blank"), "");
  assert.equal(activeHost("gone", ["short"]), "all");
  assert.equal(hostArg("short"), "short");
  assert.equal(hostArg("blank"), "");
  const shown = visibleGateCustomers(rows, "enabled", "E", null, "ada");
  assert.equal(shown.length, 1);
  assert.equal(shown[0].label, "Ada North");
  assert.equal(visibleGateCustomers(rows, null, null, null, "enabled").length, 0);
  const names = gatesCsv(rows);
  assert.equal(names.startsWith("kind,gate,count"), true);
  assert.equal(gatesCsv([]), "kind,gate,count");
  assert.equal(names.includes("amount"), false);
  assert.equal(names.includes(",enabled,"), true);

  const copy = Object.keys(ROUND165_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND165_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "mrqTitle"), "Marquetry tasks");
  assert.equal(crmv4Text("tr", "tgnTitle"), ROUND165_COPY.tr.tgnTitle);
  assert.equal(crmv4Text("de", "mrqOwner"), ROUND165_COPY.de.mrqOwner);
  assert.equal(crmv4Text("ru", "tgnUnmarked"), ROUND165_COPY.ru.tgnUnmarked);
  assert.equal(crmv4Text("ar", "mrqNotice"), ROUND165_COPY.ar.mrqNotice);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-mrq/);
  assert.match(css, /\.c4-tgn/);
  assert.match(css, /\.c4-kpis-marq/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round165.tsx"), "utf8");
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
  assert.equal(viewFile.includes("lastContactAt"), false);
  assert.match(viewFile, /tradingEnabled/);
  assert.match(viewFile, /marqsCsv/);
  assert.match(viewFile, /gatesCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "m"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-marqs/);
  assert.match(viewFile, /data-gates/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestRoom/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "marq"/);
  assert.match(app, /view === "gate"/);
  const overview = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Overview.tsx"), "utf8");
  assert.match(overview, /c4-kpis-marq/);
  console.log("crmv4 round165 tests passed");
}

main();
