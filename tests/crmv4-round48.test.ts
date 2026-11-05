/**
 * Deposit review queue and segment cards.
 * Run: npx tsx tests/crmv4-round48.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { approvalBody } from "../src/lib/crmv2/payload";
import { ROUND48_COPY } from "../src/lib/crmv4/copy-round48";
import {
  ageHours,
  dropFundView,
  filterFunds,
  fundQuery,
  minApplies,
  orderCards,
  pendingSums,
  readFundViews,
  samePerson,
  saveFundView,
  segmentCards,
  togglePin,
} from "../src/lib/crmv4/round48";

function main() {
  assert.equal(fundQuery("PENDING", 0), "/api/admin/deposits?take=40&status=PENDING");
  assert.equal(fundQuery("", 40), "/api/admin/deposits?take=40&status=ALL&skip=40");
  const now = Date.parse("2026-11-05T12:00:00Z");
  assert.equal(ageHours("2026-11-05T00:00:00Z", now), 12);
  assert.equal(ageHours("", now), null);
  assert.equal(minApplies("", 10), false);
  assert.equal(minApplies("TRY", 10), true);

  const rows = [
    { id: "a", amount: 10, currency: "TRY", status: "PENDING", method: "BANK", createdAt: "2026-11-05T01:00:00Z", user: { id: "u1", name: "Ada", email: "ada@desk.test" } },
    { id: "b", amount: 4, currency: "USD", status: "PENDING", method: "CRYPTO", createdAt: "2026-11-04T01:00:00Z", user: { id: "u2", name: "Bea", email: "bea@desk.test" } },
    { id: "c", amount: 80, currency: "TRY", status: "APPROVED", method: "BANK", createdAt: null, user: { id: "u1", name: "Ada", email: "ada@desk.test" } },
  ];
  const sums = pendingSums(rows);
  assert.equal(sums.find((row) => row.currency === "TRY")?.amount, 10);
  assert.equal(sums.find((row) => row.currency === "USD")?.amount, 4);
  assert.equal(sums.some((row) => row.amount === 14), false);
  assert.equal(sums.some((row) => row.amount === 90), false);
  const filtered = filterFunds(rows, { text: "ada", currency: "TRY", method: "BANK", min: 20, sort: "new" });
  assert.deepEqual(filtered.map((row) => row.id), ["c"]);
  const open = filterFunds(rows, { text: "", currency: "", method: "", min: 20, sort: "new" });
  assert.equal(open.length, 3);
  assert.equal(open[open.length - 1].id, "c");
  const beside = samePerson(
    [{ id: "w1", amount: 3, currency: "EUR", userId: "u1" }, { id: "w2", amount: 9, currency: "TRY", userId: "u2" }],
    "u1",
  );
  assert.deepEqual(beside.map((row) => row.id), ["w1"]);
  assert.equal(beside[0].amount !== 10, true);

  const views = saveFundView(readFundViews([{ name: "Open TRY", status: "PENDING", currency: "try", method: "", min: 10, sort: "old" }]), {
    id: "2", name: " ", status: "", currency: "", method: "", min: null, sort: "new", text: "",
  });
  assert.equal(views.length, 1);
  assert.equal(views[0].currency, "TRY");
  assert.equal(dropFundView(views, views[0].id).length, 0);
  const blank = approvalBody("d1", "approve", "  ");
  assert.equal("approvalReason" in blank, false);
  assert.equal("sourceUserId" in blank, false);

  const people = [
    { id: "1", name: "Ada", country: "TR", saleStatus: "NEW", documentsStatus: "PENDING", currency: "TRY" },
    { id: "2", name: "Bea", country: "TR", saleStatus: "WON", documentsStatus: "APPROVED", currency: "USD" },
    { id: "3", name: "Cem", country: "", saleStatus: "NEW", documentsStatus: "PENDING", currency: "TRY" },
  ];
  const countries = segmentCards(people, "country");
  assert.equal(countries.find((card) => card.label === "TR")?.count, 2);
  assert.equal(countries.reduce((sum, card) => sum + card.count, 0), 3);
  const currencies = segmentCards(people, "currency");
  assert.equal(currencies.find((card) => card.label === "TRY")?.count, 2);
  assert.equal(currencies.some((card) => card.count === 14), false);
  const pinned = orderCards(countries, togglePin([], "country:"));
  assert.equal(pinned[0].label, "");
  assert.equal(togglePin(["country:TR"], "country:TR").includes("country:TR"), false);

  const copy = Object.keys(ROUND48_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND48_COPY[locale]).sort(), copy);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-fund-desk/);
  assert.match(css, /\.c4-seg-board/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round48.tsx"), "utf8");
  assert.match(view, /approvalBody/);
  assert.match(view, /data-confirm/);
  assert.match(view, /aria-required=\{false\}/);
  const board = view.slice(view.indexOf("export function SegmentBoard"));
  assert.equal(board.includes("sendJson"), false);
  assert.equal(board.includes("fetch("), false);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "funding"/);
  const marketing = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Marketing.tsx"), "utf8");
  assert.match(marketing, /SegmentBoard/);
  console.log("crmv4 round48 tests passed");
}

main();
