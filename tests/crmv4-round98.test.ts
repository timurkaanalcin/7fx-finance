/**
 * Recent jumps and ticket channels.
 * Run: npx tsx tests/crmv4-round98.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND98_COPY } from "../src/lib/crmv4/copy-round98";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
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
} from "../src/lib/crmv4/round98";

function main() {
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

  const copy = Object.keys(ROUND98_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND98_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "jvTitle"), "Recent jumps");
  assert.equal(crmv4Text("tr", "tcTitle"), ROUND98_COPY.tr.tcTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-recent-jumps/);
  assert.match(css, /\.c4-ticket-channel/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round98.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes("row.kind"), false);
  assert.match(view, /\/api\/admin\/tickets\?take=40/);
  assert.match(view, /data-recent-jumps/);
  assert.match(view, /data-ticket-channel/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "recentjumps"/);
  assert.match(app, /view === "ticketchannel"/);
  assert.match(app, /pushVisit/);
  console.log("crmv4 round98 tests passed");
}

main();
