/**
 * CRM v3 recent jumps and ticket channel glance.
 * Run: npx tsx tests/crmv3-round98.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { JV_AR, JV_DE, JV_EN, JV_RU, JV_TR } from "../src/lib/crmv3/copy-jumps";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import {
  CHANNEL_KEY,
  JUMP_KEY,
  activeChannel,
  channelLines,
  channelText,
  clearVisits,
  namedChannels,
  pushVisit,
  readHiddenChannels,
  readVisits,
  sectionId,
  sectionPath,
  toggleChannel,
  visibleChannels,
  visibleTickets,
} from "../src/lib/crmv3/jumps";

const ROOT = path.resolve(__dirname, "..");

function main() {
  assert.equal(JUMP_KEY, "crmv3-recent-jumps");
  assert.equal(CHANNEL_KEY, "crmv3-ticket-channel-hide");
  assert.equal(sectionId("customers"), "customers");
  assert.equal(sectionId("nope"), "");
  assert.equal(sectionId("customers/abc"), "");
  assert.equal(sectionPath("customers"), "customers");
  assert.equal(sectionPath("overview"), "");
  const first = pushVisit([], "customers", "2026-11-05T10:00:00Z");
  assert.equal(first[0].section, "customers");
  assert.equal(pushVisit(first, "nope", "2026-11-05T11:00:00Z").length, 1);
  const second = pushVisit(first, "kyc", "2026-11-05T11:00:00Z");
  assert.deepEqual(second.map((visit) => visit.section), ["kyc", "customers"]);
  const again = pushVisit(second, "customers", "2026-11-05T12:00:00Z");
  assert.deepEqual(again.map((visit) => visit.section), ["customers", "kyc"]);
  assert.equal(again[0].at, "2026-11-05T12:00:00Z");
  assert.deepEqual(clearVisits(), []);
  assert.deepEqual(readVisits([{ section: "nope", at: "t" }, { section: "kyc", at: "t" }, { section: "kyc", at: "later" }]).map((visit) => visit.section), ["kyc"]);

  const rows = [
    { id: "a", label: "Ada", channel: { method: " Wire ", kind: "DEPOSIT" } },
    { id: "b", label: "Bea", channel: { method: "Wire", kind: "DEPOSIT" } },
    { id: "c", label: "Cid", channel: { method: { label: "Card" }, kind: "DEPOSIT" } },
    { id: "d", label: "Dot", channel: { kind: "WITHDRAW", customer: "Dot" } },
    { id: "e", label: "Eve", channel: null },
  ];
  assert.equal(channelText({ method: " Wire ", kind: "DEPOSIT" }), "Wire");
  assert.equal(channelText({ method: { label: "Card" } }), "Card");
  assert.equal(channelText({ kind: "WITHDRAW", customer: "Dot" }), "");
  assert.equal(channelText(null), "");
  assert.deepEqual(channelLines(rows), [
    { channel: "", count: 2 },
    { channel: "Card", count: 1 },
    { channel: "Wire", count: 2 },
  ]);
  assert.deepEqual(namedChannels(rows), ["Card", "Wire"]);
  assert.equal(namedChannels([{ channel: { kind: "DEPOSIT" } }]).includes("DEPOSIT"), false);
  assert.deepEqual(visibleTickets(rows, "Wire", false, "ada").map((row) => row.id), ["a"]);
  assert.deepEqual(visibleTickets(rows, "", true, "").map((row) => row.id), ["d", "e"]);
  assert.equal(visibleTickets(rows, "Card", false, "").some((row) => row.id === "d"), false);
  assert.deepEqual(readHiddenChannels(["Wire", "Invented", ""], ["Wire", "Card"]), ["Wire"]);
  assert.deepEqual(toggleChannel(["Wire"], "Card", ["Wire", "Card"]), ["Wire", "Card"]);
  assert.deepEqual(visibleChannels(["Wire", "Card"], ["Card"], false), ["Wire"]);
  assert.equal(activeChannel("Card", ["Wire"]), "");

  const copy = Object.keys(JV_EN).sort();
  assert.deepEqual(Object.keys(JV_TR).sort(), copy);
  assert.deepEqual(Object.keys(JV_DE).sort(), copy);
  assert.deepEqual(Object.keys(JV_RU).sort(), copy);
  assert.deepEqual(Object.keys(JV_AR).sort(), copy);
  assert.notEqual(JV_TR.jvTitle, JV_EN.jvTitle);
  assert.notEqual(JV_DE.tcHint, JV_EN.tcHint);
  assert.notEqual(JV_RU.tcBlank, JV_EN.tcBlank);
  assert.notEqual(JV_AR.jvUnknown, JV_EN.jvUnknown);
  assert.equal(crmv3Text("en", "jvTitle"), "Recent jumps");
  assert.equal(crmv3Text("tr", "tcTitle"), JV_TR.tcTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-recent-jumps", "de"), "Letzte Sprünge");
  assert.equal(keyTitle("crmv3-ticket-channel-hide", "tr"), "Kanal bakışı");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "recentjumps"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "ticketchannel"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("recentjumps"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("ticketchannel"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("recentjumps")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "work" && (group.ids as readonly string[]).includes("ticketchannel")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-recent-jumps/);
  assert.match(css, /\.c3-ticket-channel/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/jumps.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes("row.kind"), false);
  assert.match(view, /\/api\/admin\/tickets\?take=40/);
  assert.match(view, /data-recent-jumps/);
  assert.match(view, /data-ticket-channel/);
  assert.match(view, /JUMP_KEY/);
  assert.match(view, /CHANNEL_KEY/);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "recentjumps"/);
  assert.match(app, /view === "ticketchannel"/);
  assert.match(app, /pushVisit/);
  assert.match(app, /crmv3:recent-jumps/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round98 tests passed");
}

main();
