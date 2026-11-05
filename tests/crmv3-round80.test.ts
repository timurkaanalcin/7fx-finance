/**
 * CRM v3 bookmark bar and KYC glance.
 * Run: npx tsx tests/crmv3-round80.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  BAR_KEY,
  KYC_KEY,
  activeKind,
  addBookmark,
  otherLines,
  presentKinds,
  readBookmarks,
  readHiddenKinds,
  statusKind,
  statusSplit,
  toggleKind,
  visibleBookmarks,
  visibleKinds,
  visibleStatus,
} from "../src/lib/crmv3/bookmarks";
import { MARK_AR, MARK_DE, MARK_EN, MARK_RU, MARK_TR } from "../src/lib/crmv3/copy-marks";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";

const ROOT = path.resolve(__dirname, "..");

function main() {
  assert.equal(BAR_KEY, "crmv3-desk-bookmarks");
  assert.equal(KYC_KEY, "crmv3-kyc-hide");
  const allowed = CRM_V3_SECTIONS.map((item) => item.id);
  assert.equal(allowed.includes("kyc"), true);
  assert.equal(allowed.includes("customers"), true);
  assert.equal(addBookmark([], { id: "1", name: "   ", sectionId: "kyc", at: "t" }, allowed).length, 0);
  assert.equal(addBookmark([], { id: "1", name: "Desk", sectionId: "crmv4", at: "t" }, allowed).length, 0);
  assert.equal(addBookmark([], { id: "1", name: "Desk", sectionId: "", at: "t" }, allowed).length, 0);
  const saved = addBookmark([], { id: "1", name: " Morning KYC ", sectionId: "kyc", at: "2026-11-05T10:00:00Z" }, allowed);
  assert.equal(saved[0].name, "Morning KYC");
  assert.equal(saved[0].sectionId, "kyc");
  assert.equal(addBookmark(saved, { id: "1", name: "Again", sectionId: "customers", at: "t" }, allowed).length, 1);
  const later = addBookmark(saved, { id: "2", name: "People", sectionId: "customers", at: "2026-11-05T11:00:00Z" }, allowed);
  const pinned = later.map((item) => (item.id === "2" ? { ...item, pinned: true } : item));
  assert.equal(visibleBookmarks(pinned, "", false)[0].id, "2");
  assert.equal(visibleBookmarks(pinned, "zzz", false).length, 0);
  assert.equal(visibleBookmarks(pinned, "morning", false)[0].id, "1");
  assert.equal(visibleBookmarks(pinned.map((item) => ({ ...item, hidden: item.id === "1" })), "", true)[0].sectionId, "kyc");
  assert.deepEqual(readBookmarks([{ id: "9", name: "Gone", sectionId: "crmv4" }, { id: "3", name: "  ", sectionId: "kyc" }, { id: "1", name: "Morning KYC", sectionId: "kyc" }], allowed).map((item) => item.id), ["1"]);

  const rows = [
    { id: "a", label: "Ada", status: "PENDING" },
    { id: "b", label: "Bea", status: " approved " },
    { id: "c", label: "Cid", status: "NONE" },
    { id: "d", label: "Dot", status: "" },
    { id: "e", label: "Eve", status: "REJECTED" },
    { id: "f", label: "Fay", status: "pending" },
  ];
  assert.equal(statusKind("NONE"), "");
  assert.equal(statusKind(""), "");
  assert.equal(statusKind("REJECTED"), "");
  assert.deepEqual(statusSplit(rows), { pending: 2, approved: 1 });
  assert.deepEqual(otherLines(rows), [{ status: "NONE", count: 1 }, { status: "REJECTED", count: 1 }]);
  assert.deepEqual(presentKinds(rows), ["pending", "approved"]);
  assert.deepEqual(visibleStatus(rows, "pending", "ada").map((row) => row.id), ["a"]);
  assert.equal(visibleStatus(rows, "approved", "").some((row) => row.id === "c"), false);
  assert.deepEqual(readHiddenKinds(["pending", "rejected", "NONE"]), ["pending"]);
  assert.deepEqual(toggleKind(["pending"], "approved"), ["pending", "approved"]);
  assert.deepEqual(visibleKinds(["pending", "approved"], ["approved"], false), ["pending"]);
  assert.equal(activeKind("approved", ["pending"]), "");
  assert.equal(activeKind("PENDING", ["pending"]), "pending");

  const copy = Object.keys(MARK_EN).sort();
  assert.deepEqual(Object.keys(MARK_TR).sort(), copy);
  assert.deepEqual(Object.keys(MARK_DE).sort(), copy);
  assert.deepEqual(Object.keys(MARK_RU).sort(), copy);
  assert.deepEqual(Object.keys(MARK_AR).sort(), copy);
  assert.notEqual(MARK_TR.mbTitle, MARK_EN.mbTitle);
  assert.notEqual(MARK_DE.kgHint, MARK_EN.kgHint);
  assert.notEqual(MARK_RU.kgApproved, MARK_EN.kgApproved);
  assert.notEqual(MARK_AR.mbBlank, MARK_EN.mbBlank);
  assert.equal(crmv3Text("en", "mbTitle"), "Bookmark bar");
  assert.equal(crmv3Text("tr", "kgTitle"), MARK_TR.kgTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-desk-bookmarks", "de"), "Lesezeichenleiste");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "markbar"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "kycglance"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("markbar"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("kycglance"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("markbar")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "compliance" && (group.ids as readonly string[]).includes("kycglance")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-mark-bar/);
  assert.match(css, /\.c3-kyc-glance/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/marks.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("fetch("), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("status=PENDING"), false);
  assert.equal(view.includes("counts"), false);
  assert.equal(view.includes("/api/admin/documents?take=40"), true);
  assert.match(view, /CRM_V3_SECTIONS/);
  assert.match(view, /BAR_KEY/);
  assert.match(view, /data-mark-bar/);
  assert.match(view, /data-kyc-glance/);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "markbar"/);
  assert.match(app, /view === "kycglance"/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round80 tests passed");
}

main();
