/**
 * CRM v3 focus customer and order type glance.
 * Run: npx tsx tests/crmv3-round102.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FC_AR, FC_DE, FC_EN, FC_RU, FC_TR } from "../src/lib/crmv3/copy-focuscustomer";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import {
  FOCUS_CUSTOMER_KEY,
  ORDER_TYPE_KEY,
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
} from "../src/lib/crmv3/focuscustomer";

const ROOT = path.resolve(__dirname, "..");

function main() {
  assert.equal(FOCUS_CUSTOMER_KEY, "crmv3-focus-customer");
  assert.equal(ORDER_TYPE_KEY, "crmv3-order-type-hide");
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

  const copy = Object.keys(FC_EN).sort();
  assert.deepEqual(Object.keys(FC_TR).sort(), copy);
  assert.deepEqual(Object.keys(FC_DE).sort(), copy);
  assert.deepEqual(Object.keys(FC_RU).sort(), copy);
  assert.deepEqual(Object.keys(FC_AR).sort(), copy);
  assert.notEqual(FC_TR.fcTitle, FC_EN.fcTitle);
  assert.notEqual(FC_DE.oyHint, FC_EN.oyHint);
  assert.notEqual(FC_RU.oyBlank, FC_EN.oyBlank);
  assert.notEqual(FC_AR.fcMissing, FC_EN.fcMissing);
  assert.equal(crmv3Text("en", "fcTitle"), "Focus customer");
  assert.equal(crmv3Text("tr", "oyTitle"), FC_TR.oyTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-focus-customer", "de"), "Fokus-Kunde");
  assert.equal(keyTitle("crmv3-order-type-hide", "tr"), "Emir türü");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "focuscustomer"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "ordertype"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("focuscustomer"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("ordertype"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("focuscustomer")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "work" && (group.ids as readonly string[]).includes("ordertype")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-focus-customer/);
  assert.match(css, /\.c3-order-type/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/focuscustomer.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes("price"), false);
  assert.equal(view.includes("row.side"), false);
  assert.equal(view.includes("row.status"), false);
  assert.equal(view.includes('?? "MARKET"'), false);
  assert.match(view, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(view, /\/api\/admin\/positions\?tab=orders&take=40/);
  assert.match(view, /data-focus-customer/);
  assert.match(view, /data-order-type/);
  assert.match(view, /FOCUS_CUSTOMER_KEY/);
  assert.match(view, /ORDER_TYPE_KEY/);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "focuscustomer"/);
  assert.match(app, /view === "ordertype"/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round102 tests passed");
}

main();
