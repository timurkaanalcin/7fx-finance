/**
 * CRM v3 VIP watch and the handoff packet.
 * Run: npx tsx tests/crmv3-round70.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { VIP_AR, VIP_DE, VIP_EN, VIP_RU, VIP_TR } from "../src/lib/crmv3/copy-vip";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import {
  PACKET_KEY,
  PIN_KEY,
  RULE_KEY,
  canExport,
  chosenItems,
  currencyLines,
  openItems,
  packetCsv,
  readRule,
  togglePacketId,
  watchPeople,
  withNote,
} from "../src/lib/crmv3/vip";

const ROOT = path.resolve(__dirname, "..");
const NOW = Date.parse("2026-11-05T12:00:00Z");

function main() {
  assert.equal(RULE_KEY, "crmv3-vip-rule");
  assert.equal(PIN_KEY, "crmv3-vip-pins");
  assert.equal(PACKET_KEY, "crmv3-handoff-packet");
  const people = [
    { id: "a", name: "Ada", email: "ada@desk.com", balance: 80, currency: "USD", lastLoginAt: "2026-11-04T12:00:00Z", lastContactAt: null },
    { id: "b", name: "Bea", email: "bea@desk.com", balance: 200, currency: "EUR", lastLoginAt: "2026-10-01T12:00:00Z", lastContactAt: "2026-11-05T11:00:00Z" },
    { id: "c", name: "Cem", email: "cem@desk.com", balance: 10, currency: "USD", lastLoginAt: null, lastContactAt: null },
    { id: "d", name: "Den", email: "den@desk.com", balance: 90, currency: "", lastLoginAt: "2026-11-05T11:00:00Z", lastContactAt: null },
  ];
  const usd = watchPeople(people, { field: "balance", amount: 40, currency: "USD" }, "", [], NOW);
  assert.deepEqual(usd.map((person) => person.id), ["a"]);
  assert.equal(usd.some((person) => person.currency === "EUR"), false);
  const lines = currencyLines(usd);
  assert.equal(lines.length, 1);
  assert.equal(lines[0].currency, "USD");
  assert.equal(lines[0].amount, 80);
  const mixed = watchPeople(people, { field: "lastLogin", amount: 2, currency: "" }, "", [], NOW);
  const mixedLines = currencyLines(mixed);
  assert.equal(mixed.some((person) => person.id === "b"), false);
  assert.equal(mixed.some((person) => person.id === "c"), false);
  assert.equal(mixedLines.find((line) => line.currency === "USD")?.amount, 80);
  assert.equal(mixedLines.find((line) => line.currency === "")?.amount, 90);
  assert.equal(mixedLines.some((line) => line.currency === "EUR"), false);
  assert.equal(watchPeople(people, { field: "balance", amount: 1, currency: "" }, "", [], NOW).length, 0);
  assert.equal(watchPeople(people, { field: "lastContact", amount: 1, currency: "" }, "", [], NOW).map((person) => person.id).join(","), "b");
  assert.equal(watchPeople(people, readRule({ field: "balance", amount: -5, currency: "usd" }), "ada", [], NOW)[0].id, "a");
  const pinned = watchPeople(people, { field: "lastLogin", amount: 2, currency: "" }, "", ["d"], NOW);
  assert.equal(pinned[0].id, "d");

  const bag = {
    "crmv3-case-pins": ["case-1"],
    "crmv3-winloss-log": [{ id: "n1", kind: "win", body: "File closed", pinned: true, archived: false }],
    "crmv3-meeting-prep": [{ id: "b1", body: "Ask", pinned: false, customerId: "a" }],
  };
  const items = openItems(bag);
  assert.equal(items.some((item) => item.id === "cases:pin:case-1"), true);
  assert.equal(items.some((item) => item.label === "File closed"), true);
  assert.equal(items.some((item) => item.label === "Ask"), false);
  const packet = withNote(togglePacketId({ ids: [], note: "" }, "cases:pin:case-1"), "   ");
  assert.equal(packet.note, "");
  assert.equal(canExport(chosenItems(items, packet), packet.note), true);
  assert.equal(canExport([], "   "), false);
  const noted = withNote(packet, " Call Mehmet ");
  const csv = packetCsv(chosenItems(items, noted), noted.note);
  assert.match(csv, /^source,kind,label/);
  assert.match(csv, /note,note,Call Mehmet/);
  assert.match(csv, /cases,pin,case-1/);
  assert.equal(csv.includes("EUR"), false);

  const copy = Object.keys(VIP_EN).sort();
  assert.deepEqual(Object.keys(VIP_TR).sort(), copy);
  assert.deepEqual(Object.keys(VIP_DE).sort(), copy);
  assert.deepEqual(Object.keys(VIP_RU).sort(), copy);
  assert.deepEqual(Object.keys(VIP_AR).sort(), copy);
  assert.notEqual(VIP_TR.vwTitle, VIP_EN.vwTitle);
  assert.notEqual(VIP_DE.pkHint, VIP_EN.pkHint);
  assert.notEqual(VIP_RU.vwBalance, VIP_EN.vwBalance);
  assert.notEqual(VIP_AR.pkBlank, VIP_EN.pkBlank);
  assert.equal(crmv3Text("en", "vwTitle"), "VIP watch");
  assert.equal(crmv3Text("tr", "pkTitle"), VIP_TR.pkTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-handoff-packet", "de"), "Übergabepaket");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "vip"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "packet"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("vip"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("packet"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "work" && (group.ids as readonly string[]).includes("vip")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("packet")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-vip-strip/);
  assert.match(css, /\.c3-packet-pad/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/vip.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("auditExport"), false);
  assert.equal(view.includes("fetch("), false);
  assert.match(view, /data-vip-strip/);
  assert.match(view, /data-packet-pad/);
  assert.match(view, /data-packet-export/);
  assert.match(view, /data-confirm/);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "vip"/);
  assert.match(app, /view === "packet"/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round70 tests passed");
}

main();
