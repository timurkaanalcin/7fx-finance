/**
 * Withdrawal review queue and staff permission overview.
 * Run: npx tsx tests/crmv4-round46.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { approvalBody } from "../src/lib/crmv2/payload";
import { ROUND46_COPY } from "../src/lib/crmv4/copy-round46";
import {
  accessLevel,
  ageHours,
  appendRows,
  dropView,
  filterPayouts,
  filterStaff,
  flagCount,
  listMove,
  minApplies,
  payoutCsv,
  payoutQuery,
  payoutSums,
  permCounts,
  readAccessViews,
  readPayoutViews,
  renameView,
  saveAccessView,
  savePayoutView,
  staffCsv,
  unreadNotes,
} from "../src/lib/crmv4/round46";

function main() {
  assert.equal(payoutQuery("PENDING", 0), "/api/admin/withdrawals?take=40&status=PENDING");
  assert.equal(payoutQuery("", 40), "/api/admin/withdrawals?take=40&status=ALL&skip=40");
  const now = Date.parse("2026-11-05T12:00:00Z");
  assert.equal(ageHours("2026-11-05T00:00:00Z", now), 12);
  assert.equal(ageHours("", now), null);
  assert.equal(ageHours(null, now), null);
  assert.equal(minApplies("", 10), false);
  assert.equal(minApplies("TRY", null), false);
  assert.equal(minApplies("TRY", 10), true);

  const rows = [
    { id: "a", amount: 10, currency: "TRY", status: "PENDING", method: "BANK", createdAt: "2026-11-05T01:00:00Z", user: { name: "Ada", email: "ada@desk.test" } },
    { id: "b", amount: 5, currency: "USD", status: "PENDING", method: "CRYPTO", createdAt: "2026-11-04T01:00:00Z", user: { name: "Bea", email: "bea@desk.test" } },
    { id: "c", amount: 80, currency: "TRY", status: "APPROVED", method: "BANK", createdAt: null, user: { name: "Ada", email: "ada@desk.test" } },
  ];
  const tryOnly = filterPayouts(rows, { text: "ada", currency: "TRY", method: "BANK", min: 20, sort: "new" });
  assert.deepEqual(tryOnly.map((row) => row.id), ["c"]);
  const mixed = filterPayouts(rows, { text: "", currency: "", method: "", min: 20, sort: "new" });
  assert.equal(mixed.length, 3);
  assert.equal(mixed[mixed.length - 1].id, "c");
  const oldest = filterPayouts(rows, { text: "", currency: "", method: "", min: null, sort: "old" });
  assert.equal(oldest[0].id, "b");
  assert.equal(oldest[oldest.length - 1].id, "c");
  const sums = payoutSums(rows);
  assert.equal(sums.find((row) => row.currency === "TRY")?.amount, 90);
  assert.equal(sums.find((row) => row.currency === "USD")?.amount, 5);
  assert.equal(sums.some((row) => row.amount === 95), false);
  const csv = payoutCsv(rows);
  assert.equal(csv[0][2], "10");
  assert.equal(csv[0][3], "TRY");
  assert.equal(csv.some((line) => line.join(",").includes("95")), false);

  const views = savePayoutView(readPayoutViews([{ name: "Open TRY", status: "PENDING", currency: "try", method: "", min: 10, sort: "old" }]), {
    id: "2",
    name: "  ",
    status: "",
    currency: "",
    method: "",
    min: null,
    sort: "new",
    text: "",
  });
  assert.equal(views.length, 1);
  assert.equal(views[0].currency, "TRY");
  assert.equal(views[0].sort, "old");
  assert.equal(readPayoutViews("no").length, 0);
  const renamed = renameView(views, views[0].id, "Cash");
  assert.equal(renamed[0].name, "Cash");
  assert.equal(renameView(views, views[0].id, " ").length, 1);
  assert.equal(renameView(views, views[0].id, " ")[0].name, views[0].name);
  assert.equal(dropView(renamed, renamed[0].id).length, 0);
  assert.equal(appendRows([{ id: "a" }], [{ id: "a" }, { id: "b" }]).length, 2);
  assert.equal(listMove(0, 3, -1), 0);
  assert.equal(listMove(2, 3, 1), 2);

  const blank = approvalBody("w1", "approve", "   ");
  assert.equal("approvalReason" in blank, false);
  const kept = approvalBody("w1", "reject", "desk");
  assert.equal(kept.approvalReason, "desk");

  const staff = [
    { id: "1", name: "Ada", email: "ada@desk.test", jobTitle: "analyst", desk: "North", active: true, canManageUsers: true, canApproveDeposits: false, canEditRates: true, canManageMethods: false, canAdjustBalance: false },
    { id: "2", name: "Bea", email: "bea@desk.test", jobTitle: "owner_ceo", desk: "South", active: false, canManageUsers: true, canApproveDeposits: true, canEditRates: true, canManageMethods: true, canAdjustBalance: true },
  ];
  assert.equal(flagCount(staff[0]), 2);
  assert.equal(accessLevel(0), "none");
  assert.equal(accessLevel(2), "limited");
  assert.equal(accessLevel(4), "desk");
  assert.equal(accessLevel(5), "full");
  assert.equal(filterStaff(staff, { text: "north", title: "", flag: "", active: "" })[0].id, "1");
  assert.equal(filterStaff(staff, { text: "", title: "analyst", flag: "canEditRates", active: "on" }).length, 1);
  assert.equal(filterStaff(staff, { text: "", title: "", flag: "canAdjustBalance", active: "" })[0].id, "2");
  assert.equal(permCounts(staff).canManageUsers, 2);
  assert.equal(permCounts(staff).canAdjustBalance, 1);
  const sheet = staffCsv(staff);
  assert.equal(sheet[0][5], "limited");
  assert.equal(sheet[1][5], "full");
  assert.equal(sheet[0].includes("95"), false);
  const accessViews = saveAccessView(readAccessViews([{ name: "Rates", title: "analyst", flag: "canEditRates", active: "on", text: "" }]), {
    id: "x",
    name: "",
    text: "",
    title: "",
    flag: "",
    active: "",
  });
  assert.equal(accessViews.length, 1);
  assert.equal(accessViews[0].flag, "canEditRates");
  assert.equal(readAccessViews([{ name: "Bad", flag: "canDeleteLedger" }])[0].flag, "");
  const notes = unreadNotes([{ id: "n1", readAt: null }, { id: "n2", readAt: "2026-11-01T00:00:00Z" }], true);
  assert.equal(notes.length, 1);
  assert.equal(unreadNotes(notes, false).length, 1);

  const copy = Object.keys(ROUND46_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND46_COPY[locale]).sort(), copy);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-payout-desk/);
  assert.match(css, /\.c4-access-desk/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round46.tsx"), "utf8");
  assert.match(view, /approvalBody/);
  assert.match(view, /data-confirm/);
  assert.match(view, /aria-required=\{false\}/);
  assert.match(view, /\/api\/notifications/);
  const access = view.slice(view.indexOf("export function AccessDesk"));
  assert.equal(access.includes("/api/admin/workers\", \"POST\""), false);
  assert.equal(access.includes("/api/admin/workers\", \"PATCH\""), false);
  assert.equal(access.includes("approvalBody"), false);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "payout"/);
  assert.match(app, /view === "access"/);
  console.log("crmv4 round46 tests passed");
}

main();
