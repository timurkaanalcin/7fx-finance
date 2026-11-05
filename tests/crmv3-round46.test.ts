/**
 * CRM v3 withdrawal review queue and staff permission overview.
 * Run: npx tsx tests/crmv3-round46.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { approvalBody } from "../src/lib/crmv2/payload";
import { PAY_AR, PAY_DE, PAY_EN, PAY_RU, PAY_TR } from "../src/lib/crmv3/copy-payout";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import {
  ACCESS_KEY,
  PAYOUT_KEY,
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
} from "../src/lib/crmv3/payout";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";

const ROOT = path.resolve(__dirname, "..");

function main() {
  assert.equal(payoutQuery("PENDING", 0), "/api/admin/withdrawals?take=40&status=PENDING");
  assert.equal(payoutQuery("", 40), "/api/admin/withdrawals?take=40&status=ALL&skip=40");
  assert.equal(PAYOUT_KEY, "crmv3-payout-views");
  assert.equal(ACCESS_KEY, "crmv3-access-views");
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

  const copy = Object.keys(PAY_EN).sort();
  assert.deepEqual(Object.keys(PAY_TR).sort(), copy);
  assert.deepEqual(Object.keys(PAY_DE).sort(), copy);
  assert.deepEqual(Object.keys(PAY_RU).sort(), copy);
  assert.deepEqual(Object.keys(PAY_AR).sort(), copy);
  assert.notEqual(PAY_TR.pqTitle, PAY_EN.pqTitle);
  assert.notEqual(PAY_DE.axTitle, PAY_EN.axTitle);
  assert.notEqual(PAY_RU.ntTitle, PAY_EN.ntTitle);
  assert.notEqual(PAY_AR.pqMinHint, PAY_EN.pqMinHint);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-payout-views", "en"), "Withdrawal views");
  assert.equal(keyTitle("crmv3-access-views", "ar"), "عروض الصلاحيات");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "payout"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "access"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("payout"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("access"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "money" && (group.ids as readonly string[]).includes("payout")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("access")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-payout/);
  assert.match(css, /\.c3-access/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/payout.tsx"), "utf8");
  assert.match(view, /approvalBody/);
  assert.match(view, /data-confirm/);
  assert.match(view, /aria-required=\{false\}/);
  assert.match(view, /\/api\/notifications/);
  assert.equal(view.includes("crmv4"), false);
  const access = view.slice(view.indexOf("export function AccessDesk"));
  assert.equal(access.includes("/api/admin/workers\", \"POST\""), false);
  assert.equal(access.includes("/api/admin/workers\", \"PATCH\""), false);
  assert.equal(access.includes("approvalBody"), false);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "payout"/);
  assert.match(app, /view === "access"/);
  const lib = fs.readFileSync(path.join(ROOT, "src/lib/crmv3/payout.ts"), "utf8");
  assert.equal(lib.includes("crmv4"), false);
  console.log("crmv3 round46 tests passed");
}

main();
