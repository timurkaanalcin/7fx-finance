/**
 * CRM v3 round 36: customer money history and assignee matching.
 * Run: npx tsx tests/crmv3-round36.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { LEDGER_AR, LEDGER_DE, LEDGER_EN, LEDGER_RU, LEDGER_TR } from "../src/lib/crmv3/copy-ledger";
import { filterLedger, sideSums, statusChoices, windowGap } from "../src/lib/crmv3/ledger";
import { matchedWorkerId, staffCards, unassignedCount } from "../src/lib/crmv3/today";

const ROOT = path.resolve(__dirname, "..");

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

  const copy = Object.keys(LEDGER_EN).sort();
  assert.deepEqual(Object.keys(LEDGER_TR).sort(), copy);
  assert.deepEqual(Object.keys(LEDGER_DE).sort(), copy);
  assert.deepEqual(Object.keys(LEDGER_RU).sort(), copy);
  assert.deepEqual(Object.keys(LEDGER_AR).sort(), copy);
  assert.equal("signTitle" in LEDGER_EN, false);

  const lib = fs.readFileSync(path.join(ROOT, "src/lib/crmv3/ledger.ts"), "utf8");
  assert.equal(lib.includes("crmv4"), false);
  const page = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/ledger.tsx"), "utf8");
  assert.match(page, /data-ledger="1"/);
  assert.match(page, /data-error="1"/);
  assert.match(page, /data-skel="1"/);
  assert.match(page, /view=tickets/);
  assert.equal(page.includes("sendJson"), false);
  assert.equal(page.includes("PATCH"), false);
  assert.equal(page.includes("crmv4"), false);
  const today = fs.readFileSync(path.join(ROOT, "src/lib/crmv3/today.ts"), "utf8");
  assert.match(today, /matchedWorkerId/);
  assert.match(today, /normAssignee/);
  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-ledger/);
  assert.match(css, /\.c3-error-card/);
  assert.match(css, /\.c3-skel-card/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const customers = fs.readFileSync(path.join(ROOT, "src/components/crmv3/views/Customers.tsx"), "utf8");
  assert.match(customers, /FinanceBook/);
  const login = fs.readFileSync(path.join(ROOT, "src/components/auth/LoginForm.tsx"), "utf8");
  assert.equal(login.includes("c3-signin"), false);
  assert.equal(login.includes("crmv3-signin"), false);
  const tree = fs.readdirSync(path.join(ROOT, "src/components/crmv3"), { recursive: true }) as string[];
  for (const file of tree) {
    if (!String(file).endsWith(".tsx") && !String(file).endsWith(".ts")) continue;
    const src = fs.readFileSync(path.join(ROOT, "src/components/crmv3", String(file)), "utf8");
    assert.equal(src.includes("crmv4"), false, String(file));
  }
  console.log("crmv3 round36 tests passed");
}

main();
