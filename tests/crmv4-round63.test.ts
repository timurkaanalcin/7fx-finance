/**
 * Rejected orders and vault labels.
 * Run: npx tsx tests/crmv4-round63.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND63_COPY } from "../src/lib/crmv4/copy-round63";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  addHint,
  exceptionRows,
  filterExceptions,
  looksSecret,
  readHints,
  removeHint,
  sortExceptions,
  toggleHintPin,
} from "../src/lib/crmv4/round63";

function main() {
  const orders = [
    { id: "a", symbol: "EURUSD", side: "BUY", status: "REJECTED", traderName: "Ada", createdAt: "2026-11-05T10:00:00Z", price: 1.1 },
    { id: "b", symbol: "XAUUSD", side: "SELL", status: "CANCELLED", traderName: "Bea", createdAt: "2026-11-05T11:00:00Z" },
    { id: "c", symbol: "USDTRY", side: "BUY", status: "FILLED", traderName: "Cem" },
    { id: "d", symbol: "GBPUSD", side: "BUY", status: "PENDING", traderName: "Den" },
  ];
  assert.deepEqual(exceptionRows(orders).map((row) => row.id), ["a", "b"]);
  assert.deepEqual(filterExceptions(orders, "REJECTED", "ada").map((row) => row.id), ["a"]);
  assert.equal(sortExceptions(exceptionRows(orders), ["b"])[0].id, "b");
  assert.equal(looksSecret("Morning desk"), false);
  assert.equal(looksSecret("password hunter"), true);
  assert.equal(looksSecret("aaaaaaaaaaaaaaaaaaaaaaaa"), true);
  const blank = addHint([], { id: "h1", label: "   ", login: "", at: "t" });
  assert.ok(blank);
  assert.equal(blank && blank.length, 0);
  assert.equal(addHint([], { id: "h1", label: "my password", login: "", at: "t" }), null);
  const hints = addHint([], { id: "h1", label: " CRM admin ", login: " Morning desk ", at: "2026-11-05T10:00:00Z" });
  assert.ok(hints);
  assert.equal(hints && hints[0].label, "CRM admin");
  assert.equal(hints && hints[0].login, "Morning desk");
  assert.equal(readHints([{ id: "x", label: "bearer abcdefghijklmnopqrstuvwxyz" }]).length, 0);
  const pinned = toggleHintPin(hints || [], "h1");
  assert.equal(pinned[0].pinned, true);
  assert.equal(removeHint(pinned, "h1").length, 0);

  const copy = Object.keys(ROUND63_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND63_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "rjTitle"), "Rejected orders");
  assert.equal(crmv4Text("tr", "vhSecret"), ROUND63_COPY.tr.vhSecret);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-reject-desk/);
  assert.match(css, /\.c4-vault-pad/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round63.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("type=\"password\""), false);
  assert.match(view, /data-reject-desk/);
  assert.match(view, /data-vault-pad/);
  assert.match(view, /data-confirm/);
  assert.match(view, /tab=orders/);
  assert.match(view, /autoComplete="off"/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "rejects"/);
  assert.match(app, /view === "vault"/);
  console.log("crmv4 round63 tests passed");
}

main();
