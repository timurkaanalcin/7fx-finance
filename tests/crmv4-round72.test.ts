/**
 * Pending counts and route color tags.
 * Run: npx tsx tests/crmv4-round72.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND72_COPY } from "../src/lib/crmv4/copy-round72";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  PULSE_BOARDS,
  PULSE_LISTS,
  addTag,
  pendingCount,
  setTagHidden,
  toggleKind,
  visibleKinds,
  visibleTags,
} from "../src/lib/crmv4/round72";

function main() {
  const rows = [
    { id: "a", status: "PENDING", amount: 80, currency: "EUR" },
    { id: "b", status: "approved", amount: 10, currency: "USD" },
    { id: "", status: "PENDING", amount: 4, currency: "TRY" },
    { id: "c", status: " pending ", amount: 3, currency: "USD" },
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

  const copy = Object.keys(ROUND72_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND72_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "puTitle"), "Pending queue");
  assert.equal(crmv4Text("tr", "swTitle"), ROUND72_COPY.tr.swTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-pulse-strip/);
  assert.match(css, /\.c4-swatch-pad/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round72.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("/api/admin/pulse"), false);
  assert.equal(view.includes("amount"), false);
  assert.match(view, /PULSE_LISTS/);
  assert.match(view, /data-pulse-strip/);
  assert.match(view, /data-swatch-pad/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "pulse"/);
  assert.match(app, /view === "swatches"/);
  console.log("crmv4 round72 tests passed");
}

main();
