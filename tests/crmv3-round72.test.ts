/**
 * CRM v3 pending counts and route color tags.
 * Run: npx tsx tests/crmv3-round72.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { PULSE_AR, PULSE_DE, PULSE_EN, PULSE_RU, PULSE_TR } from "../src/lib/crmv3/copy-pulse";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import {
  HIDE_KEY,
  PULSE_BOARDS,
  PULSE_LISTS,
  SWATCH_KEY,
  addTag,
  pendingCount,
  setTagHidden,
  toggleKind,
  visibleKinds,
  visibleTags,
} from "../src/lib/crmv3/pulse";

const ROOT = path.resolve(__dirname, "..");

function main() {
  assert.equal(HIDE_KEY, "crmv3-pulse-hide");
  assert.equal(SWATCH_KEY, "crmv3-route-swatches");
  const rows = [
    { id: "a", status: "PENDING" },
    { id: "b", status: "approved" },
    { id: "", status: "PENDING" },
    { id: "c", status: " pending " },
  ];
  assert.equal(pendingCount(rows), 2);
  assert.equal(JSON.stringify({ count: pendingCount(rows) }).includes("EUR"), false);
  assert.equal(PULSE_LISTS.deposits, "/api/admin/deposits?take=40");
  assert.equal(PULSE_LISTS.withdrawals, "/api/admin/withdrawals?take=40");
  assert.equal(PULSE_LISTS.documents, "/api/admin/documents?take=40");
  assert.equal(PULSE_BOARDS.deposits, "depboard");
  assert.equal(PULSE_BOARDS.withdrawals, "payboard");
  assert.equal(PULSE_BOARDS.documents, "expiry");
  const hidden = toggleKind([], "deposits");
  assert.deepEqual(visibleKinds(hidden, false), ["withdrawals", "documents"]);
  assert.deepEqual(visibleKinds(hidden, true), ["deposits"]);
  assert.deepEqual(toggleKind(hidden, "nope"), ["deposits"]);

  assert.equal(addTag([], { id: "t1", label: "   ", color: "champagne", route: "depboard", at: "t" }).length, 0);
  assert.equal(addTag([], { id: "t1", label: "Morning", color: "gold", route: "depboard", at: "t" }).length, 0);
  assert.equal(addTag([], { id: "t1", label: "Morning", color: "champagne", route: "not-a-route", at: "t" }).length, 0);
  const tags = addTag([], { id: "t1", label: " Morning board ", color: "champagne", route: "depboard", at: "2026-11-05T10:00:00Z" });
  assert.equal(tags[0].label, "Morning board");
  assert.equal("amount" in tags[0], false);
  assert.equal(visibleTags(tags, "morning", false)[0].route, "depboard");
  const gone = setTagHidden(tags, "t1", true);
  assert.equal(visibleTags(gone, "", false).length, 0);
  assert.equal(visibleTags(gone, "", true)[0].id, "t1");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "depboard"), true);

  const copy = Object.keys(PULSE_EN).sort();
  assert.deepEqual(Object.keys(PULSE_TR).sort(), copy);
  assert.deepEqual(Object.keys(PULSE_DE).sort(), copy);
  assert.deepEqual(Object.keys(PULSE_RU).sort(), copy);
  assert.deepEqual(Object.keys(PULSE_AR).sort(), copy);
  assert.notEqual(PULSE_TR.puTitle, PULSE_EN.puTitle);
  assert.notEqual(PULSE_DE.swHint, PULSE_EN.swHint);
  assert.notEqual(PULSE_RU.puDeposits, PULSE_EN.puDeposits);
  assert.notEqual(PULSE_AR.swBlank, PULSE_EN.swBlank);
  assert.equal(crmv3Text("en", "puTitle"), "Pending queue");
  assert.equal(crmv3Text("tr", "swTitle"), PULSE_TR.swTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-route-swatches", "de"), "Routenfarben");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "pulse"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "swatches"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("pulse"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("swatches"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "money" && (group.ids as readonly string[]).includes("pulse")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("swatches")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-pulse-strip/);
  assert.match(css, /\.c3-swatch-pad/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/pulse.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("/api/admin/pulse"), false);
  assert.equal(view.includes("amount"), false);
  assert.match(view, /PULSE_LISTS/);
  assert.match(view, /data-pulse-strip/);
  assert.match(view, /data-swatch-pad/);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "pulse"/);
  assert.match(app, /view === "swatches"/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round72 tests passed");
}

main();
