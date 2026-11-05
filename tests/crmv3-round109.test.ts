/**
 * Row density and introducer countries.
 * Run: npx tsx tests/crmv3-round109.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { RD_AR, RD_DE, RD_EN, RD_RU, RD_TR } from "../src/lib/crmv3/copy-rowdensity";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { keyTitle } from "../src/lib/crmv3/insights";
import { IB_COUNTRY_KEY, ROW_DENSITY_KEY } from "../src/lib/crmv3/rowdensity";
import { commissionRows } from "../src/lib/crmv3/introducer";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
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
} from "../src/lib/crmv3/rowdensity";

function main() {
  assert.equal(ROW_DENSITY_KEY, "crmv3-row-density");
  assert.equal(IB_COUNTRY_KEY, "crmv3-ib-country-hide");
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

  const copy = Object.keys(RD_EN).sort();
  for (const table of [RD_TR, RD_DE, RD_RU, RD_AR]) assert.deepEqual(Object.keys(table).sort(), copy);
  assert.equal(crmv3Text("en", "rdTitle"), "Row density");
  assert.equal(crmv3Text("tr", "icTitle"), RD_TR.icTitle);
  assert.equal(keyTitle("crmv3-row-density", "de"), "Zeilendichte");
  assert.equal(keyTitle("crmv3-ib-country-hide", "ar"), "بلد الوسيط");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "rowdensity"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "ibcountry"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("rowdensity"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("ibcountry"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("rowdensity")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "money" && (group.ids as readonly string[]).includes("ibcountry")), true);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-row-density/);
  assert.match(css, /\.c3-ib-country/);
  assert.match(css, /data-row-density="dense"/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv3/desk/rowdensity.tsx"), "utf8");
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
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "rowdensity"/);
  assert.match(app, /view === "ibcountry"/);
  assert.match(app, /data-row-density=/);
  console.log("crmv3 round109 tests passed");
}

main();
