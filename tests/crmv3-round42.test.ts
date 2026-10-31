/**
 * CRM v3 round 42: selection bar and customer thread.
 * Run: npx tsx tests/crmv3-round42.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { PICK_AR, PICK_DE, PICK_EN, PICK_RU, PICK_TR } from "../src/lib/crmv3/copy-picks";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
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
} from "../src/lib/crmv3/picks";

const ROOT = path.resolve(__dirname, "..");

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

  const copy = Object.keys(PICK_EN).sort();
  assert.deepEqual(Object.keys(PICK_TR).sort(), copy);
  assert.deepEqual(Object.keys(PICK_DE).sort(), copy);
  assert.deepEqual(Object.keys(PICK_RU).sort(), copy);
  assert.deepEqual(Object.keys(PICK_AR).sort(), copy);
  assert.notEqual(PICK_TR.bkTitle, PICK_EN.bkTitle);
  assert.notEqual(PICK_DE.bkConfirm, PICK_EN.bkConfirm);
  assert.notEqual(PICK_RU.thTitle, PICK_EN.thTitle);
  assert.notEqual(PICK_AR.thDraft, PICK_EN.thDraft);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-list-picks", "en"), "Local picks");
  assert.equal(keyTitle("crmv3-list-picks", "ar").length > 0, true);

  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/picks.tsx"), "utf8");
  const listFn = view.slice(view.indexOf("function runList"), view.indexOf("function confirm"));
  assert.equal(listFn.includes("sendJson"), false);
  assert.match(view, /assigneeId: body\.assigneeId/);
  assert.match(view, /saleStatus: body\.saleStatus/);
  assert.match(view, /\/api\/admin\/chat/);
  assert.equal(view.includes("<form"), false);
  assert.equal(view.includes("markAdminRead"), false);
  assert.equal(view.includes("typing:"), false);
  assert.match(view, /setDraft\(item\.body\)/);
  assert.match(view, /PICK_KEY/);
  assert.match(view, /crmv3-inbox-canned/);
  const enter = view.slice(view.indexOf("onKeyDown"), view.indexOf("data-send"));
  assert.match(enter, /event\.key === "Enter"/);
  assert.equal(enter.includes("send("), false);
  const customers = fs.readFileSync(path.join(ROOT, "src/components/crmv3/views/Customers.tsx"), "utf8");
  assert.match(customers, /BulkDock/);
  assert.match(customers, /RecordThread/);
  assert.match(customers, /togglePage/);
  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-pick-dock/);
  assert.match(css, /\.c3-thread/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const lib = fs.readFileSync(path.join(ROOT, "src/lib/crmv3/picks.ts"), "utf8");
  assert.match(lib, /crmv3-list-picks/);
  assert.equal(lib.includes("crmv4"), false);
  const tree = fs.readdirSync(path.join(ROOT, "src/components/crmv3"), { recursive: true }) as string[];
  for (const file of tree) {
    if (!String(file).endsWith(".tsx") && !String(file).endsWith(".ts")) continue;
    const src = fs.readFileSync(path.join(ROOT, "src/components/crmv3", String(file)), "utf8");
    assert.equal(src.includes("crmv4"), false, String(file));
  }
  console.log("crmv3 round42 tests passed");
}

main();
