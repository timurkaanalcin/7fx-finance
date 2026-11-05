/**
 * CRM v3 rejected orders and vault labels.
 * Run: npx tsx tests/crmv3-round63.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { REJECT_AR, REJECT_DE, REJECT_EN, REJECT_RU, REJECT_TR } from "../src/lib/crmv3/copy-rejects";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import {
  PIN_KEY,
  VAULT_KEY,
  addHint,
  exceptionRows,
  filterExceptions,
  looksSecret,
  readHints,
  removeHint,
  sortExceptions,
  toggleHintPin,
} from "../src/lib/crmv3/rejects";

const ROOT = path.resolve(__dirname, "..");

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
  assert.equal(PIN_KEY, "crmv3-reject-pins");
  assert.equal(VAULT_KEY, "crmv3-vault-hints");
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

  const copy = Object.keys(REJECT_EN).sort();
  assert.deepEqual(Object.keys(REJECT_TR).sort(), copy);
  assert.deepEqual(Object.keys(REJECT_DE).sort(), copy);
  assert.deepEqual(Object.keys(REJECT_RU).sort(), copy);
  assert.deepEqual(Object.keys(REJECT_AR).sort(), copy);
  assert.notEqual(REJECT_TR.rjTitle, REJECT_EN.rjTitle);
  assert.notEqual(REJECT_DE.vhHint, REJECT_EN.vhHint);
  assert.notEqual(REJECT_RU.rjView, REJECT_EN.rjView);
  assert.notEqual(REJECT_AR.vhSecret, REJECT_EN.vhSecret);
  assert.equal(crmv3Text("en", "rjTitle"), "Rejected orders");
  assert.equal(crmv3Text("tr", "vhSecret"), REJECT_TR.vhSecret);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-vault-hints", "tr"), "Kasa etiketleri");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "rejects"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "vault"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("rejects"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("vault"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "work" && (group.ids as readonly string[]).includes("rejects")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("vault")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-reject-desk/);
  assert.match(css, /\.c3-vault-pad/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/rejects.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("type=\"password\""), false);
  assert.match(view, /data-reject-desk/);
  assert.match(view, /data-vault-pad/);
  assert.match(view, /data-confirm/);
  assert.match(view, /tab=orders/);
  assert.match(view, /autoComplete="off"/);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "rejects"/);
  assert.match(app, /view === "vault"/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round63 tests passed");
}

main();
