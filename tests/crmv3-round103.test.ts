/**
 * CRM v3 bookmark board and withdrawal status glance.
 * Run: npx tsx tests/crmv3-round103.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { BQ_AR, BQ_DE, BQ_EN, BQ_RU, BQ_TR } from "../src/lib/crmv3/copy-bookmark";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import {
  BOOK_KEY,
  WD_GLANCE_KEY,
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
} from "../src/lib/crmv3/bookmarkboard";

const ROOT = path.resolve(__dirname, "..");

function main() {
  assert.equal(BOOK_KEY, "crmv3-bookmark-board");
  assert.equal(WD_GLANCE_KEY, "crmv3-wd-glance-hide");
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

  const copy = Object.keys(BQ_EN).sort();
  assert.deepEqual(Object.keys(BQ_TR).sort(), copy);
  assert.deepEqual(Object.keys(BQ_DE).sort(), copy);
  assert.deepEqual(Object.keys(BQ_RU).sort(), copy);
  assert.deepEqual(Object.keys(BQ_AR).sort(), copy);
  assert.notEqual(BQ_TR.bqTitle, BQ_EN.bqTitle);
  assert.notEqual(BQ_DE.wxHint, BQ_EN.wxHint);
  assert.notEqual(BQ_RU.wxBlank, BQ_EN.wxBlank);
  assert.notEqual(BQ_AR.bqBlank, BQ_EN.bqBlank);
  assert.equal(crmv3Text("en", "bqTitle"), "Bookmark board");
  assert.equal(crmv3Text("tr", "wxTitle"), BQ_TR.wxTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-bookmark-board", "de"), "Lesezeichenbrett");
  assert.equal(keyTitle("crmv3-wd-glance-hide", "tr"), "Çekim durumu");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "bookmarks"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "wdglance"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("bookmarks"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("wdglance"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("bookmarks")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "money" && (group.ids as readonly string[]).includes("wdglance")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-bookmark-board/);
  assert.match(css, /\.c3-wd-glance/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/bookmarkboard.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes("row.method"), false);
  assert.equal(view.includes('?? "PENDING"'), false);
  assert.match(view, /\/api\/admin\/withdrawals\?take=40/);
  assert.match(view, /data-bookmark-board/);
  assert.match(view, /data-wd-glance/);
  assert.match(view, /BOOK_KEY/);
  assert.match(view, /WD_GLANCE_KEY/);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "bookmarks"/);
  assert.match(app, /view === "wdglance"/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round103 tests passed");
}

main();
