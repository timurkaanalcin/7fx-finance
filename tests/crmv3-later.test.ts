/**
 * CRM v3 rounds 18–20: team math, risk watch, browser pack, and contrast.
 * Run: npx tsx tests/crmv3-later.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { buildBoard, callPace, fundedShare, progressTo } from "../src/lib/crmv3/perf";
import { importableKeys, keyCount, packKeys } from "../src/lib/crmv3/local-pack";
import { groupedNav } from "../src/lib/crmv3/local-pack";
import { largeDeposits, missingKyc, toggleColumn } from "../src/lib/crmv3/watch";

const ROOT = path.resolve(__dirname, "..");

function lin(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function contrast(fg: string, bg: string): number {
  const lum = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    const parts = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(lin);
    return 0.2126 * parts[0] + 0.7152 * parts[1] + 0.0722 * parts[2];
  };
  const hi = Math.max(lum(fg), lum(bg));
  const lo = Math.min(lum(fg), lum(bg));
  return (hi + 0.05) / (lo + 0.05);
}

function main() {
  const board = buildBoard({
    workers: [{ id: "a", name: "Ada" }],
    customers: [
      { id: "1", assigneeName: "Ada", ftd: true },
      { id: "2", assigneeName: "Ada", ftd: false },
      { id: "3", assigneeName: "Bo", ftd: true },
    ],
    calls: { "1": 2 },
    ticketNames: ["Ada"],
  });
  const ada = board.find((row) => row.name === "Ada");
  assert.equal(ada?.assigned, 2);
  assert.equal(ada?.funded, 1);
  assert.equal(ada?.calls, 2);
  assert.equal(ada?.tickets, 1);
  assert.equal(board.some((row) => row.name === "Bo"), true);
  assert.equal(fundedShare(ada!), 50);
  assert.equal(callPace(ada!), 1);
  assert.equal(progressTo(1, 4), 25);

  const pack = packKeys([["crmv3-pins", "[]"], ["theme", "dark"], ["crmv4-pins", "[]"]], "2026-10-31T00:00:00.000Z");
  assert.equal(pack.kind, "crmv3-local");
  assert.deepEqual(Object.keys(pack.keys), ["crmv3-pins"]);
  assert.equal(importableKeys({ kind: "crmv4-local", keys: { "crmv3-pins": "[]" } }), null);
  assert.deepEqual(importableKeys(pack), { "crmv3-pins": "[]" });
  assert.deepEqual(importableKeys({ kind: "crmv3-local", keys: { theme: "x", "crmv3-goal": 1 } }), {});
  assert.equal(keyCount(["crmv3-pins", "theme"]), 1);
  assert.deepEqual(groupedNav(["positions", "marketing", "logs", "control", "settings"]), {
    work: ["positions", "marketing"],
    records: ["logs", "control"],
    desk: ["settings"],
  });

  assert.equal(missingKyc([{ id: "1", documentsStatus: "PENDING" }]).length, 1);
  assert.equal(missingKyc([{ id: "1", documentsStatus: "APPROVED" }]).length, 0);
  assert.equal(largeDeposits([{ id: "d", amount: 1800, user: { id: "1", name: "Ada" } }], 1000).length, 1);
  assert.deepEqual(toggleColumn(["name", "amount"], "amount", ["name", "amount"]), ["name"]);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.ok(contrast("#b7b1a6", "#0e0e0c") >= 4.5);
  assert.ok(contrast("#5e584e", "#f4f1ea") >= 4.5);
  assert.match(css, /--c3-muted:\s*#b7b1a6/);
  assert.match(css, /--c3-muted:\s*#5e584e/);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /aria-current/);
  assert.match(app, /aria-expanded/);
  const kit = fs.readFileSync(path.join(ROOT, "src/components/crmv3/kit.tsx"), "utf8");
  assert.match(kit, /aria-busy="true"/);
  assert.match(kit, /role="alert"/);
  assert.match(kit, /role="status"/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);

  const v4 = fs.readFileSync(path.join(ROOT, "src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.equal(v4.includes("crmv3-"), false);

  console.log("crmv3 later tests passed");
}

main();
