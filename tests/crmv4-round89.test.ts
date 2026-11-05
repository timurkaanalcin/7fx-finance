/**
 * Desk checklist and customer countries.
 * Run: npx tsx tests/crmv4-round89.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND89_COPY } from "../src/lib/crmv4/copy-round89";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeCountry,
  addItem,
  countryLines,
  countryText,
  itemText,
  moveItem,
  namedCountries,
  readHiddenCountries,
  readItems,
  setItemDone,
  toggleCountry,
  visibleCountries,
  visibleCustomers,
  visibleItems,
} from "../src/lib/crmv4/round89";

function main() {
  assert.equal(itemText("  "), "");
  assert.equal(itemText(" Call\nAda "), "Call Ada");
  assert.equal(addItem([], { id: "1", text: "   " }).length, 0);
  const first = addItem([], { id: "1", text: "Call Ada" });
  const second = addItem(first, { id: "2", text: "Send pack" });
  assert.equal(visibleItems(second, "", "open").map((item) => item.id).join(","), "1,2");
  const moved = moveItem(second, "2", -1);
  assert.equal(visibleItems(moved, "", "open")[0].id, "2");
  assert.equal(moveItem(moved, "2", -1).find((item) => item.id === "2")?.order, moved.find((item) => item.id === "2")?.order);
  const done = setItemDone(second, "1", true);
  assert.equal(visibleItems(done, "", "open").map((item) => item.id).join(","), "2");
  assert.equal(visibleItems(done, "", "done")[0].text, "Call Ada");
  const pinned = second.map((item) => (item.id === "2" ? { ...item, pinned: true } : item));
  assert.equal(visibleItems(pinned, "", "open")[0].id, "2");
  assert.equal(visibleItems(pinned, "ada", "open")[0].text, "Call Ada");
  assert.equal(visibleItems(pinned.map((item) => ({ ...item, hidden: item.id === "1" })), "", "hidden")[0].text, "Call Ada");
  assert.deepEqual(readItems([{ id: "9", text: "  " }, { id: "1", text: "Call Ada" }, { id: "1", text: "Again" }]).map((item) => item.text), ["Call Ada"]);

  const rows = [
    { id: "a", label: "Ada", country: { country: " TR " } },
    { id: "b", label: "Bea", country: { country: "TR" } },
    { id: "c", label: "Cid", country: { country: "", registrationCountry: "DE" } },
    { id: "d", label: "Dot", country: { country: "  ", registrationCountry: "", region: "EU" } },
    { id: "e", label: "Eve", country: null },
  ];
  assert.equal(countryText({ country: " TR " }), "TR");
  assert.equal(countryText({ country: "", registrationCountry: "DE" }), "DE");
  assert.equal(countryText({ country: "", region: "EU" }), "EU");
  assert.equal(countryText(null), "");
  assert.equal(countryText({ country: "TR", lastCountry: "US" } as { country: string }), "TR");
  assert.deepEqual(countryLines(rows), [
    { country: "", count: 1 },
    { country: "DE", count: 1 },
    { country: "EU", count: 1 },
    { country: "TR", count: 2 },
  ]);
  assert.deepEqual(namedCountries(rows), ["DE", "EU", "TR"]);
  assert.equal(namedCountries([{ country: null }]).length, 0);
  assert.deepEqual(visibleCustomers(rows, "TR", false, "ada").map((row) => row.id), ["a"]);
  assert.deepEqual(visibleCustomers(rows, "", true, "").map((row) => row.id), ["e"]);
  assert.equal(visibleCustomers(rows, "DE", false, "").some((row) => row.id === "e"), false);
  assert.deepEqual(readHiddenCountries(["TR", "Invented", ""], ["TR", "DE"]), ["TR"]);
  assert.deepEqual(toggleCountry(["TR"], "DE", ["TR", "DE"]), ["TR", "DE"]);
  assert.deepEqual(visibleCountries(["TR", "DE"], ["DE"], false), ["TR"]);
  assert.equal(activeCountry("DE", ["TR"]), "");

  const copy = Object.keys(ROUND89_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND89_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "chTitle"), "Checklist");
  assert.equal(crmv4Text("tr", "cyTitle"), ROUND89_COPY.tr.cyTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-desk-check/);
  assert.match(css, /\.c4-country-glance/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round89.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes("lastCountry"), false);
  assert.match(view, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(view, /data-desk-check/);
  assert.match(view, /data-country-glance/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "checklist"/);
  assert.match(app, /view === "countryglance"/);
  console.log("crmv4 round89 tests passed");
}

main();
