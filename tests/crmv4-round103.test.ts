/**
 * Bookmarks and withdrawal statuses.
 * Run: npx tsx tests/crmv4-round103.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND103_COPY } from "../src/lib/crmv4/copy-round103";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeStatus,
  addBookmark,
  bookmarkLabel,
  namedStatuses,
  readBookmarks,
  readHiddenStatuses,
  sectionId,
  sectionPath,
  statusLines,
  statusText,
  toggleStatus,
  visibleBookmarks,
  visibleStatuses,
  visibleWithdrawals,
} from "../src/lib/crmv4/round103";

function main() {
  assert.equal(bookmarkLabel("  "), "");
  assert.equal(bookmarkLabel(" Desk\nnotes "), "Desk notes");
  assert.equal(bookmarkLabel("x".repeat(50)).length, 40);
  assert.equal(sectionId("customers/abc"), "");
  assert.equal(sectionId("javascript:alert(1)"), "");
  assert.equal(sectionId("nope"), "");
  assert.equal(sectionId("customers"), "customers");
  assert.equal(sectionPath("overview"), "");
  assert.equal(sectionPath("customers"), "customers");
  assert.equal(addBookmark([], { id: "1", label: "   ", section: "customers", at: "t" }).length, 0);
  assert.equal(addBookmark([], { id: "1", label: "Customers", section: "customers/abc", at: "t" }).length, 0);
  const saved = addBookmark([], { id: "1", label: "Customers", section: "customers", at: "2026-11-05T10:00:00Z" });
  assert.equal(addBookmark(saved, { id: "2", label: "Customers", section: "kyc", at: "t" }).length, 1);
  assert.equal(addBookmark(saved, { id: "2", label: "People", section: "customers", at: "t" }).length, 1);
  const later = addBookmark(saved, { id: "2", label: "KYC desk", section: "kyc", at: "2026-11-05T11:00:00Z" });
  const pinned = later.map((item) => (item.id === "1" ? { ...item, pinned: true } : item));
  assert.equal(visibleBookmarks(pinned, "", false)[0].id, "1");
  assert.equal(visibleBookmarks(pinned, "kyc", false)[0].section, "kyc");
  assert.deepEqual(readBookmarks([{ id: "9", label: "  ", section: "customers" }, { id: "1", label: "Customers", section: "nope" }, { id: "2", label: "Customers", section: "customers" }]).map((item) => item.id), ["2"]);

  const rows = [
    { id: "a", label: "Ada", status: " PENDING " },
    { id: "b", label: "Bea", status: "PENDING" },
    { id: "c", label: "Cid", status: "APPROVED" },
    { id: "d", label: "Dot", status: "" },
    { id: "e", label: "Eve", status: null },
  ];
  assert.equal(statusText(" PENDING "), "PENDING");
  assert.equal(statusText({ status: "REJECTED", method: "BANK" }), "REJECTED");
  assert.equal(statusText({ method: "BANK" }), "");
  assert.deepEqual(statusLines(rows), [
    { status: "", count: 2 },
    { status: "APPROVED", count: 1 },
    { status: "PENDING", count: 2 },
  ]);
  assert.deepEqual(namedStatuses(rows), ["APPROVED", "PENDING"]);
  assert.equal(namedStatuses([{ status: null }]).includes("PENDING"), false);
  assert.deepEqual(visibleWithdrawals(rows, "PENDING", false, "bea").map((row) => row.id), ["b"]);
  assert.deepEqual(visibleWithdrawals(rows, "", true, "").map((row) => row.id), ["d", "e"]);
  assert.deepEqual(readHiddenStatuses(["PENDING", "FILLED", ""], ["PENDING", "APPROVED"]), ["PENDING"]);
  assert.deepEqual(toggleStatus(["PENDING"], "FILLED", ["PENDING"]), ["PENDING"]);
  assert.deepEqual(visibleStatuses(["PENDING", "APPROVED"], ["APPROVED"], false), ["PENDING"]);
  assert.equal(activeStatus("APPROVED", ["PENDING"]), "");

  const copy = Object.keys(ROUND103_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND103_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "bqTitle"), "Bookmark board");
  assert.equal(crmv4Text("tr", "wxTitle"), ROUND103_COPY.tr.wxTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-bookmark-board/);
  assert.match(css, /\.c4-wd-glance/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round103.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes('?? "PENDING"'), false);
  assert.match(view, /\/api\/admin\/withdrawals\?take=40/);
  assert.match(view, /data-bookmark-board/);
  assert.match(view, /data-wd-glance/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "bookmarks"/);
  assert.match(app, /view === "wdglance"/);
  console.log("crmv4 round103 tests passed");
}

main();
