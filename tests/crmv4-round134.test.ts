/**
 * Lamp cards and broker names.
 * Run: npx tsx tests/crmv4-round134.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND134_COPY } from "../src/lib/crmv4/copy-round134";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeBay,
  activeBroker,
  addLamp,
  addView,
  bayArg,
  bayLabel,
  brokerLines,
  brokerShare,
  brokerText,
  brokersCsv,
  bulkLampHeld,
  bulkLampLit,
  dropView,
  editLamp,
  lampBays,
  lampCopy,
  lampCounts,
  lampShare,
  lampTags,
  lampText,
  lampTimeline,
  lampsCsv,
  leadingBroker,
  namedBrokers,
  readHiddenBrokers,
  readLamps,
  readViews,
  resetLamps,
  setLampHeld,
  setLampKept,
  setLampLit,
  setLampReviewed,
  stampLabel,
  tagLabel,
  toggleBroker,
  toggleLampPin,
  visibleBrokerCustomers,
  visibleBrokers,
  visibleLamps,
} from "../src/lib/crmv4/round134";

function main() {
  assert.equal(lampText("  Night\ncall  "), "Night call");
  assert.equal(lampText("   "), "");
  assert.equal(lampText("x".repeat(140)).length, 100);
  assert.equal(bayLabel("  12  "), "12");
  assert.equal(bayLabel("   "), "");
  assert.equal(bayLabel("y".repeat(40)).length, 12);
  assert.equal(tagLabel("  VIP  "), "VIP");
  assert.equal(tagLabel("   "), "");
  assert.equal(tagLabel("z".repeat(40)).length, 16);
  assert.equal(stampLabel(" 09:10 "), "09:10");
  assert.equal(stampLabel("   "), "");
  assert.equal(stampLabel("t".repeat(20)).length, 8);
  assert.deepEqual(readLamps([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Light the bay", bay: "  ", tag: "  ", stamp: "  ", pinned: 1, lit: 1, audit: "nope" }, "nope"]), [
    { id: "2", text: "Light the bay", bay: "", tag: "", stamp: "", pinned: false, lit: false, held: false, reviewed: false, kept: false, audit: "" },
  ]);
  const saved = addLamp([], { id: "a", text: " Light the bay ", bay: " 4 ", tag: " Gold ", stamp: " 09:10 " });
  assert.deepEqual(saved, [{ id: "a", text: "Light the bay", bay: "4", tag: "Gold", stamp: "09:10", pinned: false, lit: false, held: false, reviewed: false, kept: false, audit: "save" }]);
  assert.equal(addLamp(saved, { id: "b", text: "  " }).length, 1);
  assert.equal(addLamp(saved, { id: "c", text: "Light the bay" }).length, 1);
  assert.equal(addLamp(saved, { id: "a", text: "Other card" }).length, 1);
  const pinned = toggleLampPin(saved, "a");
  assert.equal(pinned[0].pinned, true);
  assert.equal(pinned[0].audit, "pin");
  const lit = setLampLit(pinned, "a", true);
  assert.equal(lit[0].lit, true);
  assert.equal(lit[0].audit, "lit");
  const held = setLampHeld(lit, "a", true);
  assert.equal(held[0].held, true);
  assert.equal(held[0].audit, "hold");
  const reviewed = setLampReviewed(held, "a", true);
  assert.equal(reviewed[0].reviewed, true);
  assert.equal(reviewed[0].audit, "review");
  const kept = setLampKept(reviewed, "a", true);
  assert.equal(kept[0].kept, true);
  assert.equal(kept[0].audit, "keep");
  const cleared = setLampReviewed(setLampKept(kept, "a", false), "a", false);
  assert.equal(cleared[0].kept, false);
  assert.equal(cleared[0].reviewed, false);
  assert.equal(cleared[0].audit, "clear");
  assert.equal(editLamp(saved, "a", "  ")[0].text, "Light the bay");
  assert.equal(editLamp(saved, "a", "Light the bay")[0].audit, "save");
  const second = addLamp(saved, { id: "b", text: "Other card", bay: "5", tag: "Desk", stamp: "10:00" });
  assert.equal(editLamp(second, "b", "Light the bay").find((card) => card.id === "b")?.text, "Other card");
  const edited = editLamp(second, "b", " Reworded card ");
  assert.equal(edited.find((card) => card.id === "b")?.text, "Reworded card");
  assert.equal(edited.find((card) => card.id === "b")?.audit, "edit");
  assert.deepEqual(visibleLamps(pinned, "dark", "bay", null, "", false).map((card) => card.id), ["a"]);
  assert.deepEqual(visibleLamps(pinned, "dark", "4", null, "", false), []);
  assert.deepEqual(visibleLamps(pinned, "dark", "", "9", "", false), []);
  assert.deepEqual(visibleLamps(pinned, "dark", "", "4", "Gold", false).map((card) => card.id), ["a"]);
  assert.deepEqual(visibleLamps(pinned, "dark", "", "", "Desk", false), []);
  assert.deepEqual(visibleLamps(pinned, "dark", "", null, "", true).map((card) => card.id), ["a"]);
  assert.deepEqual(visibleLamps(lit, "dark", "", null, "", false), []);
  assert.deepEqual(visibleLamps(lit, "lit", "", null, "", false).map((card) => card.id), ["a"]);
  assert.deepEqual(visibleLamps(held, "lit", "", null, "", false), []);
  assert.deepEqual(visibleLamps(held, "held", "", null, "", false).map((card) => card.id), ["a"]);
  assert.deepEqual(visibleLamps(saved, "dark", "", null, "", false).map((card) => card.id), ["a"]);
  const bulkLit = bulkLampLit(second, ["b", "missing"], true);
  assert.equal(bulkLit.find((card) => card.id === "b")?.lit, true);
  assert.equal(bulkLit.find((card) => card.id === "a")?.lit, false);
  assert.equal(bulkLit.find((card) => card.id === "b")?.audit, "lit");
  const bulkHeld = bulkLampHeld(second, shownIds(second), true);
  assert.equal(bulkHeld.every((card) => card.held), true);
  assert.equal(lampCopy("  Light the bay "), "Light the bay");
  assert.equal(lampCopy("   "), "");
  assert.deepEqual(resetLamps(), []);
  const many = Array.from({ length: 40 }, (_, index) => ({ id: `n${index}`, text: `Card ${index}`, bay: index % 2 ? "A" : "", tag: index % 3 ? "Gold" : "" }));
  assert.equal(readLamps(many).length, 36);
  assert.equal(lampsCsv([{ id: "", text: "skip" }, { id: "a", text: 'Light "the" bay', bay: "Bay, 2", tag: "Gold", stamp: "09:10", pinned: true, lit: false, held: false, reviewed: true, kept: false, audit: "save" }]), 'text,bay,tag,stamp,pinned,lit,held,reviewed,kept,audit\n"Light ""the"" bay","Bay, 2",Gold,09:10,1,0,0,1,0,save');
  assert.equal(lampsCsv([]), "text,bay,tag,stamp,pinned,lit,held,reviewed,kept,audit");
  assert.equal(lampsCsv(saved).includes("amount"), false);
  assert.deepEqual(lampCounts(held), { dark: 0, lit: 0, held: 1, reviewed: 0, kept: 0, pinnedDark: 0 });
  assert.equal(lampCounts(pinned).pinnedDark, 1);
  assert.equal(lampShare(1, 4), 25);
  assert.equal(lampShare(0, 4), 0);
  assert.equal(lampShare(1, 0), 0);
  assert.deepEqual(lampBays(second), ["4", "5"]);
  assert.deepEqual(lampTags(second), ["Desk", "Gold"]);
  assert.deepEqual(lampTimeline(second, "").map((card) => card.stamp), ["09:10", "10:00"]);
  assert.deepEqual(lampTimeline([{ id: "a", text: "Late", bay: "", tag: "", stamp: "", pinned: false, lit: false, held: false, reviewed: false, kept: false, audit: "save" }, ...second], "card").map((card) => card.id), ["b"]);
  const blankStamp = addLamp([], { id: "z", text: "No stamp" });
  assert.deepEqual(lampTimeline([...blankStamp, ...saved], "").map((card) => card.id), ["a", "z"]);
  assert.equal(activeBay("missing", ["4"]), "all");
  assert.equal(activeBay("blank", ["4"]), "blank");
  assert.equal(activeBay(" 4 ", ["4"]), "4");
  assert.equal(bayArg("all"), null);
  assert.equal(bayArg("blank"), "");
  assert.equal(bayArg(" 4 "), "4");
  const views = addView([], { id: "v1", name: " Night ", tray: "lit", query: " bay ", bay: "4", tag: "Gold" });
  assert.deepEqual(views, [{ id: "v1", name: "Night", tray: "lit", query: "bay", bay: "4", tag: "Gold" }]);
  assert.equal(addView(views, { id: "v2", name: " ", tray: "dark", query: "", bay: "all", tag: "" }).length, 1);
  assert.equal(addView(views, { id: "v2", name: "Night", tray: "dark", query: "", bay: "all", tag: "" }).length, 1);
  assert.equal(dropView(views, "v1").length, 0);
  assert.equal(readViews([{ id: "v3", name: "Open", tray: "nope", bay: "blank", tag: "" }])[0].tray, "dark");
  assert.equal(readViews(Array.from({ length: 20 }, (_, index) => ({ id: `v${index}`, name: `View ${index}`, tray: "dark" }))).length, 12);

  assert.equal(brokerText(" ING "), "ING");
  assert.equal(brokerText({ brokerName: " SAXO " }), "SAXO");
  assert.equal(brokerText(""), "");
  assert.equal(brokerText(1 as never), "");
  assert.equal(brokerText({ saleStatus: "NEW" }), "");
  assert.equal(brokerText({ retentionStatus: "ACTIVE" }), "");
  assert.equal(brokerText({ potentialStatus: "HIGH" }), "");
  assert.equal(brokerText({ documentsStatus: "APPROVED" }), "");
  assert.equal(brokerText({ accountType: "VIP" }), "");
  assert.equal(brokerText({ role: "TRADER" }), "");
  assert.equal(brokerText({ timezone: "UTC" }), "");
  assert.equal(brokerText({ language: "en" }), "");
  assert.equal(brokerText({ validation: "VERIFIED" }), "");
  assert.equal(brokerText({ validationStatus: "VERIFIED" }), "");
  assert.equal(brokerText({ desk: "Istanbul" }), "");
  assert.equal(brokerText({ tradingGroup: "VIP-USD" }), "");
  assert.equal(brokerText({ tradingServer: "Web" }), "");
  const rows = [
    { id: "u1", label: "Ada", brokerName: "ING" },
    { id: "u2", label: "Bea", brokerName: { brokerName: "SAXO" } },
    { id: "u3", label: "Cid", brokerName: "ING" },
    { id: "u4", label: "Dot", brokerName: "" },
    { id: "u5", label: "Eve", brokerName: { saleStatus: "NEW" } as never },
  ];
  assert.deepEqual(brokerLines(rows), [
    { brokerName: "", count: 2 },
    { brokerName: "ING", count: 2 },
    { brokerName: "SAXO", count: 1 },
  ]);
  assert.deepEqual(namedBrokers(rows), ["ING", "SAXO"]);
  assert.equal(brokerShare(2, 5), 40);
  assert.equal(brokerShare(0, 5), 0);
  assert.equal(brokerShare(1, 0), 0);
  assert.equal(leadingBroker(rows), "ING");
  assert.equal(leadingBroker([{ brokerName: "" }]), "");
  assert.equal(leadingBroker([{ brokerName: "SAXO" }, { brokerName: "ING" }]), "ING");
  assert.deepEqual(visibleBrokerCustomers(rows, "ING", false, "ada").map((row) => row.id), ["u1"]);
  assert.deepEqual(visibleBrokerCustomers(rows, "", true, "").map((row) => row.id), ["u4", "u5"]);
  assert.deepEqual(visibleBrokerCustomers(rows, "ING", false, "100"), []);
  assert.deepEqual(readHiddenBrokers(["ING", "OLD", ""], ["ING", "SAXO"]), ["ING"]);
  assert.deepEqual(toggleBroker(["ING"], "OLD", ["ING"]), ["ING"]);
  assert.deepEqual(visibleBrokers(["ING", "SAXO"], ["SAXO"], false), ["ING"]);
  assert.equal(activeBroker("SAXO", ["ING"]), "");
  assert.equal(brokersCsv(rows), "broker,count\n,2\nING,2\nSAXO,1");
  assert.equal(brokersCsv([]), "broker,count");
  assert.equal(brokersCsv(rows).includes("amount"), false);
  assert.equal(brokerLines(rows).every((line) => !("amount" in line) && !("currency" in line)), true);

  const copy = Object.keys(ROUND134_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND134_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "lmpTitle"), "Lamp cards");
  assert.equal(crmv4Text("tr", "bknTitle"), ROUND134_COPY.tr.bknTitle);
  assert.equal(crmv4Text("de", "lmpBay"), ROUND134_COPY.de.lmpBay);
  assert.equal(crmv4Text("ru", "bknBlank"), ROUND134_COPY.ru.bknBlank);
  assert.equal(crmv4Text("ar", "lmpNotice"), ROUND134_COPY.ar.lmpNotice);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-lamp/);
  assert.match(css, /\.c4-broker/);
  assert.match(css, /\.c4-rail-folio/);
  assert.match(css, /\.c4-tabs-folio/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round134.tsx"), "utf8");
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
  assert.match(view, /brokerName/);
  assert.match(view, /lampsCsv/);
  assert.match(view, /brokersCsv/);
  assert.match(view, /Escape/);
  assert.match(view, /event\.key !== "\/"/);
  assert.match(view, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(view, /data-lamp/);
  assert.match(view, /data-broker/);
  assert.match(view, /data-logo="mono"/);
  assert.match(view, /customers/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "lamp"/);
  assert.match(app, /view === "broker"/);
  assert.match(app, /c4-rail-folio/);
  assert.match(app, /c4-tabs-folio/);
  assert.match(app, /data-logo="mono"/);
  console.log("crmv4 round134 tests passed");
}

function shownIds(cards: { id: string }[]): string[] {
  return cards.map((card) => card.id);
}

main();
