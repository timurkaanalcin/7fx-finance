/**
 * CRM v4 round 42 helpers.
 * Run: npx tsx tests/crmv4-round42.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND42_COPY } from "../src/lib/crmv4/copy-round42";
import {
  addPicks,
  assignBody,
  canSend,
  csvLine,
  listTarget,
  matchMessages,
  pageAllOn,
  readPicks,
  sideOf,
  stageBody,
  tally,
  toggleOne,
  togglePage,
} from "../src/lib/crmv4/round42";

function main() {
  assert.deepEqual(toggleOne(["a"], "a"), []);
  assert.deepEqual(toggleOne(["a"], "b"), ["a", "b"]);
  assert.equal(pageAllOn(["a", "b"], ["a", "b", "c"]), true);
  assert.equal(pageAllOn(["a"], []), false);
  assert.deepEqual(togglePage(["a", "b"], []), ["a", "b"]);
  assert.deepEqual(togglePage(["a"], ["a", "c"]), ["c"]);
  assert.deepEqual(assignBody("  "), null);
  assert.deepEqual(assignBody("w1"), { assigneeId: "w1" });
  assert.deepEqual(stageBody("NOPE"), null);
  assert.deepEqual(stageBody("CALLBACK"), { saleStatus: "CALLBACK" });
  assert.equal(listTarget("kept", "  "), "kept");
  assert.equal(listTarget("kept", "Desk"), "Desk");
  assert.deepEqual(readPicks({ a: ["1", "1", ""], b: "no" }), { a: ["1"] });
  assert.deepEqual(addPicks({ a: ["1"] }, "a", ["1", "2"]).a, ["1", "2"]);
  assert.deepEqual(addPicks({}, "", ["1"]), {});
  assert.deepEqual(tally([{ ok: true }, { ok: false }, { ok: true }]), { ok: 2, failed: 1 });
  const line = csvLine({ name: "Ada", email: "a@x", country: "TR", saleStatus: "NEW", balance: 10, currency: "TRY" });
  assert.deepEqual(line, ["Ada", "a@x", "TR", "NEW", "10", "TRY"]);
  assert.equal(line.join("").includes("USD"), false);
  assert.equal(sideOf({ automatic: true, workerId: "w" }), "auto");
  assert.equal(sideOf({ workerId: "w" }), "staff");
  assert.equal(sideOf({}), "customer");
  assert.equal(matchMessages([{ body: "Hello desk" }, { body: "Later" }], "desk").length, 1);
  assert.equal(canSend("  "), false);
  assert.equal(canSend("Hi"), true);

  const copy = Object.keys(ROUND42_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND42_COPY[locale]).sort(), copy);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-bulk-dock/);
  assert.match(css, /\.c4-record-thread/);
  assert.match(css, /#7a5e30/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round42.tsx"), "utf8");
  const listFn = view.slice(view.indexOf("function runList"), view.indexOf("function confirm"));
  assert.equal(listFn.includes("sendJson"), false);
  assert.match(view, /assigneeId: body\.assigneeId/);
  assert.match(view, /saleStatus: body\.saleStatus/);
  assert.match(view, /\/api\/admin\/chat/);
  assert.equal(view.includes("<form"), false);
  assert.equal(view.includes("markAdminRead"), false);
  assert.equal(view.includes("typing:"), false);
  assert.match(view, /setDraft\(item\.body\)/);
  const customers = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Customers.tsx"), "utf8");
  assert.match(customers, /BulkDock/);
  assert.match(customers, /RecordThread/);
  console.log("crmv4 round42 tests passed");
}

main();
