/**
 * CRM v3 mute list and trade symbol glance.
 * Run: npx tsx tests/crmv3-round97.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { MU_AR, MU_DE, MU_EN, MU_RU, MU_TR } from "../src/lib/crmv3/copy-mute";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import {
  MUTE_KEY,
  SYMBOL_KEY,
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
} from "../src/lib/crmv3/mutelist";

const ROOT = path.resolve(__dirname, "..");

function main() {
  assert.equal(MUTE_KEY, "crmv3-mute-ids");
  assert.equal(SYMBOL_KEY, "crmv3-symbol-hide");
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

  const copy = Object.keys(MU_EN).sort();
  assert.deepEqual(Object.keys(MU_TR).sort(), copy);
  assert.deepEqual(Object.keys(MU_DE).sort(), copy);
  assert.deepEqual(Object.keys(MU_RU).sort(), copy);
  assert.deepEqual(Object.keys(MU_AR).sort(), copy);
  assert.notEqual(MU_TR.muTitle, MU_EN.muTitle);
  assert.notEqual(MU_DE.ymHint, MU_EN.ymHint);
  assert.notEqual(MU_RU.ymBlank, MU_EN.ymBlank);
  assert.notEqual(MU_AR.muHint, MU_EN.muHint);
  assert.equal(crmv3Text("en", "muTitle"), "Mute list");
  assert.equal(crmv3Text("tr", "ymTitle"), MU_TR.ymTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-mute-ids", "de"), "Stummliste");
  assert.equal(keyTitle("crmv3-symbol-hide", "tr"), "Sembol bakışı");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "mutelist"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "symbolglance"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("mutelist"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("symbolglance"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("mutelist")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "work" && (group.ids as readonly string[]).includes("symbolglance")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-mute-list/);
  assert.match(css, /\.c3-symbol-glance/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/mute.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes("price"), false);
  assert.match(view, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(view, /\/api\/admin\/positions\?tab=orders&take=40/);
  assert.match(view, /data-mute-list/);
  assert.match(view, /data-symbol-glance/);
  assert.match(view, /MUTE_KEY/);
  assert.match(view, /SYMBOL_KEY/);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "mutelist"/);
  assert.match(app, /view === "symbolglance"/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round97 tests passed");
}

main();
