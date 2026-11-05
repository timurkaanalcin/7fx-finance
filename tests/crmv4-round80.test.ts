/**
 * Bookmark bar and KYC glance.
 * Run: npx tsx tests/crmv4-round80.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND80_COPY } from "../src/lib/crmv4/copy-round80";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
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
} from "../src/lib/crmv4/round80";

function main() {
  const allowed = ["kyc", "customers", "overview"];
  assert.equal(addBookmark([], { id: "1", name: "   ", sectionId: "kyc", at: "t" }, allowed).length, 0);
  assert.equal(addBookmark([], { id: "1", name: "Desk", sectionId: "crmv2", at: "t" }, allowed).length, 0);
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
  assert.deepEqual(readBookmarks([{ id: "9", name: "Gone", sectionId: "crmv3" }, { id: "3", name: "  ", sectionId: "kyc" }, { id: "1", name: "Morning KYC", sectionId: "kyc" }], allowed).map((item) => item.id), ["1"]);

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

  const copy = Object.keys(ROUND80_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND80_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "mbTitle"), "Bookmark bar");
  assert.equal(crmv4Text("tr", "kgTitle"), ROUND80_COPY.tr.kgTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-mark-bar/);
  assert.match(css, /\.c4-kyc-glance/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round80.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("status=PENDING"), false);
  assert.equal(view.includes("/api/admin/documents?take=40"), true);
  assert.equal(view.includes("counts"), false);
  assert.match(view, /data-mark-bar/);
  assert.match(view, /data-kyc-glance/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "markbar"/);
  assert.match(app, /view === "kycglance"/);
  console.log("crmv4 round80 tests passed");
}

main();
