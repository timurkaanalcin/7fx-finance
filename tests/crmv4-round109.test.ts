/**
 * Row density and introducer countries.
 * Run: npx tsx tests/crmv4-round109.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND109_COPY } from "../src/lib/crmv4/copy-round109";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { commissionRows } from "../src/lib/crmv4/round61";
import {
  activeCountry,
  activeDensity,
  countryLines,
  countryText,
  namedCountries,
  readHiddenCountries,
  resetDensity,
  rowDensity,
  toggleCountry,
  visibleCountries,
  visibleIntroducers,
} from "../src/lib/crmv4/round109";

function main() {
  assert.equal(rowDensity("dense"), "dense");
  assert.equal(rowDensity("compact"), "compact");
  assert.equal(rowDensity("comfortable"), "comfortable");
  assert.equal(rowDensity("huge"), "");
  assert.equal(rowDensity("  "), "");
  assert.equal(activeDensity("huge"), "comfortable");
  assert.equal(resetDensity(), "comfortable");

  const people = [
    { id: "u1", name: "Ada", affiliateA: "IB-1", country: " TR ", registrationCountry: "AE" },
    { id: "u2", name: "Bea", affiliateA: "IB-2", country: "", registrationCountry: "RU" },
    { id: "u3", name: "Cid", affiliateA: "IB-3", country: "", registrationCountry: "", region: "Gulf" },
    { id: "u4", name: "Dot", affiliateA: "IB-4" },
    { id: "u5", name: "Eve" },
  ];
  const deposits = [
    { id: "d1", status: "PENDING", userId: "u1" },
    { id: "d2", status: "PENDING", userId: "u2" },
    { id: "d3", status: "PENDING", userId: "u3" },
    { id: "d4", status: "PENDING", userId: "u4" },
    { id: "d5", status: "PENDING", userId: "u5" },
  ];
  const loaded = commissionRows(people, deposits);
  assert.deepEqual(loaded.map((row) => row.id), ["d1", "d2", "d3", "d4"]);
  const byId = new Map(people.map((row) => [row.id, row]));
  const rows = loaded.map((row) => ({
    id: row.id,
    label: `${row.affiliate} ${row.name}`,
    country: byId.get(row.userId),
  }));
  assert.equal(countryText({ country: " TR ", registrationCountry: "AE" }), "TR");
  assert.equal(countryText({ country: "", registrationCountry: "RU" }), "RU");
  assert.equal(countryText({ country: "", registrationCountry: "", region: "Gulf" }), "Gulf");
  assert.equal(countryText({ lastCountry: "US" } as never), "");
  assert.deepEqual(countryLines(rows), [
    { country: "", count: 1 },
    { country: "Gulf", count: 1 },
    { country: "RU", count: 1 },
    { country: "TR", count: 1 },
  ]);
  assert.deepEqual(namedCountries(rows), ["Gulf", "RU", "TR"]);
  assert.equal(namedCountries([{ country: null }]).includes("US"), false);
  assert.deepEqual(visibleIntroducers(rows, "TR", false, "ada").map((row) => row.id), ["d1"]);
  assert.deepEqual(visibleIntroducers(rows, "", true, "").map((row) => row.id), ["d4"]);
  assert.deepEqual(readHiddenCountries(["TR", "US", ""], ["TR", "RU"]), ["TR"]);
  assert.deepEqual(toggleCountry(["TR"], "US", ["TR"]), ["TR"]);
  assert.deepEqual(visibleCountries(["TR", "RU"], ["RU"], false), ["TR"]);
  assert.equal(activeCountry("RU", ["TR"]), "");

  const copy = Object.keys(ROUND109_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND109_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "rdTitle"), "Row density");
  assert.equal(crmv4Text("tr", "icTitle"), ROUND109_COPY.tr.icTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-row-density/);
  assert.match(css, /\.c4-ib-country/);
  assert.match(css, /data-row-density="dense"/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round109.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes("lastCountry"), false);
  assert.equal(view.includes('?? "TR"'), false);
  assert.match(view, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(view, /\/api\/admin\/deposits\?take=40/);
  assert.match(view, /data-row-density-desk/);
  assert.match(view, /data-ib-country/);
  assert.match(view, /data-logo="mono"/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "rowdensity"/);
  assert.match(app, /view === "ibcountry"/);
  assert.match(app, /data-row-density=/);
  console.log("crmv4 round109 tests passed");
}

main();
