/**
 * Mute list and trade symbols.
 * Run: npx tsx tests/crmv4-round97.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND97_COPY } from "../src/lib/crmv4/copy-round97";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeSymbol,
  customerId,
  muteId,
  namedSymbols,
  readHiddenSymbols,
  readMuted,
  symbolLines,
  symbolText,
  toggleSymbol,
  unmuteId,
  visibleOrders,
  visiblePeople,
  visibleSymbols,
} from "../src/lib/crmv4/round97";

function main() {
  const people = [
    { id: "a", name: "Ada Lane", email: "ada@desk.test" },
    { id: "b", name: "Bea", email: "bea@desk.test" },
  ];
  assert.equal(customerId("  "), "");
  assert.deepEqual(readMuted(["a", "", "nope", "a"], ["a", "b"]), ["a"]);
  assert.deepEqual(muteId(["a"], "b", ["a", "b"]), ["b", "a"]);
  assert.deepEqual(muteId(["a"], "nope", ["a", "b"]), ["a"]);
  assert.deepEqual(muteId(["a"], "", ["a", "b"]), ["a"]);
  assert.deepEqual(unmuteId(["a", "b"], "a", ["a", "b"]), ["b"]);
  assert.deepEqual(unmuteId(["a"], "nope", ["a", "b"]), ["a"]);
  assert.deepEqual(visiblePeople(people, ["a"], "", false).map((row) => row.id), ["b"]);
  assert.deepEqual(visiblePeople(people, ["a"], "ada", true).map((row) => row.id), ["a"]);
  assert.deepEqual(visiblePeople(people, ["a"], "bea@", false).map((row) => row.id), ["b"]);

  const rows = [
    { id: "a", label: "EURUSD Ada", symbol: " EURUSD " },
    { id: "b", label: "EURUSD Bea", symbol: "EURUSD" },
    { id: "c", label: "GBPUSD Cid", symbol: { symbol: "GBPUSD" } },
    { id: "d", label: "Dot", symbol: null },
    { id: "e", label: "Eve" },
  ];
  assert.equal(symbolText(" EURUSD "), "EURUSD");
  assert.equal(symbolText({ symbol: "GBPUSD" }), "GBPUSD");
  assert.equal(symbolText(undefined), "");
  assert.deepEqual(symbolLines(rows), [
    { symbol: "", count: 2 },
    { symbol: "EURUSD", count: 2 },
    { symbol: "GBPUSD", count: 1 },
  ]);
  assert.deepEqual(namedSymbols(rows), ["EURUSD", "GBPUSD"]);
  assert.equal(namedSymbols([{ symbol: null }]).includes("XAUUSD"), false);
  assert.deepEqual(visibleOrders(rows, "EURUSD", false, "ada").map((row) => row.id), ["a"]);
  assert.deepEqual(visibleOrders(rows, "", true, "").map((row) => row.id), ["d", "e"]);
  assert.equal(visibleOrders(rows, "GBPUSD", false, "").some((row) => row.id === "d"), false);
  assert.deepEqual(readHiddenSymbols(["EURUSD", "Invented", ""], ["EURUSD", "GBPUSD"]), ["EURUSD"]);
  assert.deepEqual(toggleSymbol(["EURUSD"], "GBPUSD", ["EURUSD", "GBPUSD"]), ["EURUSD", "GBPUSD"]);
  assert.deepEqual(visibleSymbols(["EURUSD", "GBPUSD"], ["GBPUSD"], false), ["EURUSD"]);
  assert.equal(activeSymbol("GBPUSD", ["EURUSD"]), "");

  const copy = Object.keys(ROUND97_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND97_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "muTitle"), "Mute list");
  assert.equal(crmv4Text("tr", "ymTitle"), ROUND97_COPY.tr.ymTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-mute-list/);
  assert.match(css, /\.c4-symbol-glance/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round97.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes("price"), false);
  assert.match(view, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(view, /\/api\/admin\/positions\?tab=orders&take=40/);
  assert.match(view, /data-mute-list/);
  assert.match(view, /data-symbol-glance/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "mutelist"/);
  assert.match(app, /view === "symbolglance"/);
  console.log("crmv4 round97 tests passed");
}

main();
