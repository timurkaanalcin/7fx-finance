/**
 * CRM v4 round 36 helpers.
 * Run: npx tsx tests/crmv4-round36.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND36_COPY } from "../src/lib/crmv4/copy-round36";
import { filterLedger, sideSums, statusChoices, windowGap } from "../src/lib/crmv4/round36";
import { matchedWorkerId, staffCards, unassignedCount } from "../src/lib/crmv4/round35";

function main() {
  const rows = [
    { id: "1", side: "deposit" as const, amount: 10, currency: "USD", status: "PENDING", createdAt: "2026-10-01T00:00:00Z", method: { label: "Wire" } },
    { id: "2", side: "deposit" as const, amount: 5, currency: "TRY", status: "APPROVED", createdAt: "2026-10-20T00:00:00Z", method: "Card" },
    { id: "3", side: "withdrawal" as const, amount: 2, currency: "USD", status: "PENDING", createdAt: "2026-10-15T00:00:00Z" },
  ];
  const window = filterLedger(rows, { from: "2026-10-10", to: "2026-10-31", side: "all", status: "", q: "", newest: true });
  assert.deepEqual(window.map((row) => row.id), ["2", "3"]);
  const deposits = sideSums(window, "deposit");
  assert.equal(deposits.length, 1);
  assert.equal(deposits[0].currency, "TRY");
  assert.equal(deposits[0].amount, 5);
  const gap = windowGap(deposits, sideSums(window, "withdrawal"));
  assert.deepEqual(gap.map((row) => row.currency), ["TRY", "USD"]);
  assert.equal(gap.find((row) => row.currency === "USD")?.amount, -2);
  assert.equal(filterLedger(rows, { from: "", to: "", side: "deposit", status: "PENDING", q: "wire", newest: false })[0].id, "1");
  assert.deepEqual(statusChoices(rows), ["APPROVED", "PENDING"]);

  const cards = staffCards(
    [{ id: "w1", name: "Ada", desk: "HQ" }, { id: "w2", name: "Bo", desk: "HQ" }],
    [{ assigneeId: "w1", assigneeName: "Bo" }, { assigneeName: "  Ada  " }],
  );
  assert.equal(cards[0].assigned, 2);
  assert.equal(cards[1].assigned, 0);
  assert.equal(staffCards([{ id: "w", name: "Ada Lovelace", desk: "" }], [{ assigneeName: "Ada  Lovelace" }])[0].assigned, 1);
  assert.equal(unassignedCount([{ assigneeId: "missing", assigneeName: "Bo" }], [{ id: "w2", name: "Bo" }]), 0);
  assert.equal(matchedWorkerId({ assigneeId: "w1", assigneeName: "Bo" }, [{ id: "w1", name: "Ada" }]), "w1");

  const copy = Object.keys(ROUND36_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND36_COPY[locale]).sort(), copy);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  const sign = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/signin.css"), "utf8");
  assert.match(css, /\.c4-ledger-luxe/);
  assert.match(css, /\.c4-error-card/);
  assert.match(css, /\.c4-skel-card/);
  assert.match(sign, /\.c4-signin/);
  assert.match(sign, /#7a5e30/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  assert.equal(sign.includes("overflow-x: auto"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round36.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("PATCH"), false);
  const logout = fs.readFileSync(path.join(__dirname, "../src/app/api/auth/logout/route.ts"), "utf8");
  assert.match(logout, /desk === "crmv4"/);
  const login = fs.readFileSync(path.join(__dirname, "../src/components/auth/LoginForm.tsx"), "utf8");
  assert.match(login, /action="\/api\/auth\/login"/);
  console.log("crmv4 round36 tests passed");
}

main();
