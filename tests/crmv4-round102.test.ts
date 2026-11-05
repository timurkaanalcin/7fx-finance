/**
 * Focused customer and order types.
 * Run: npx tsx tests/crmv4-round102.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND102_COPY } from "../src/lib/crmv4/copy-round102";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeType,
  clearFocus,
  namedTypes,
  orderType,
  readFocus,
  readHiddenTypes,
  setFocus,
  toggleType,
  typeLines,
  visibleOrders,
  visiblePeople,
  visibleTypes,
} from "../src/lib/crmv4/round102";

function main() {
  const present = ["ada", "bea"];
  assert.equal(readFocus("  ", present), "");
  assert.equal(readFocus("missing", present), "");
  assert.equal(readFocus("ada", present), "ada");
  assert.equal(setFocus("ada", "missing", present), "ada");
  assert.equal(setFocus("ada", "  ", present), "ada");
  assert.equal(setFocus("ada", "bea", present), "bea");
  assert.equal(clearFocus(), "");
  const people = [
    { id: "ada", name: "Ada Lane", email: "ada@desk.test" },
    { id: "bea", name: "Bea", email: "bea@desk.test" },
    { id: "", name: "Blank" },
  ];
  assert.deepEqual(visiblePeople(people, "lane").map((row) => row.id), ["ada"]);
  assert.equal(visiblePeople(people, "zzz").length, 0);

  const rows = [
    { id: "a", label: "EURUSD", type: " LIMIT " },
    { id: "b", label: "GBPUSD", type: "LIMIT" },
    { id: "c", label: "XAUUSD", type: "MARKET" },
    { id: "d", label: "USDJPY", type: "" },
    { id: "e", label: "EURGBP", type: null },
  ];
  assert.equal(orderType(" LIMIT "), "LIMIT");
  assert.equal(orderType({ type: "STOP", side: "BUY" }), "STOP");
  assert.equal(orderType({ side: "BUY" }), "");
  assert.equal(orderType({ status: "PENDING" }), "");
  assert.deepEqual(typeLines(rows), [
    { type: "", count: 2 },
    { type: "LIMIT", count: 2 },
    { type: "MARKET", count: 1 },
  ]);
  assert.deepEqual(namedTypes(rows), ["LIMIT", "MARKET"]);
  assert.equal(namedTypes([{ type: null }]).includes("MARKET"), false);
  assert.deepEqual(visibleOrders(rows, "LIMIT", false, "gbp").map((row) => row.id), ["b"]);
  assert.deepEqual(visibleOrders(rows, "", true, "").map((row) => row.id), ["d", "e"]);
  assert.deepEqual(readHiddenTypes(["LIMIT", "STOP", ""], ["LIMIT", "MARKET"]), ["LIMIT"]);
  assert.deepEqual(toggleType(["LIMIT"], "STOP", ["LIMIT"]), ["LIMIT"]);
  assert.deepEqual(visibleTypes(["LIMIT", "MARKET"], ["MARKET"], false), ["LIMIT"]);
  assert.equal(activeType("MARKET", ["LIMIT"]), "");

  const copy = Object.keys(ROUND102_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND102_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "fcTitle"), "Focus customer");
  assert.equal(crmv4Text("tr", "oyTitle"), ROUND102_COPY.tr.oyTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-focus-customer/);
  assert.match(css, /\.c4-order-type/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round102.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes("price"), false);
  assert.equal(view.includes('?? "MARKET"'), false);
  assert.match(view, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(view, /\/api\/admin\/positions\?tab=orders&take=40/);
  assert.match(view, /data-focus-customer/);
  assert.match(view, /data-order-type/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "focuscustomer"/);
  assert.match(app, /view === "ordertype"/);
  console.log("crmv4 round102 tests passed");
}

main();
