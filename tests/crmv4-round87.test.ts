/**
 * Status banners and document types.
 * Run: npx tsx tests/crmv4-round87.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND87_COPY } from "../src/lib/crmv4/copy-round87";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeType,
  addBanner,
  namedTypes,
  oneLine,
  readBanners,
  readHiddenTypes,
  toggleType,
  typeLines,
  typeText,
  visibleBanners,
  visibleDocs,
  visibleTypes,
} from "../src/lib/crmv4/round87";

function main() {
  assert.equal(oneLine("  "), "");
  assert.equal(oneLine(" Desk\nquiet "), "Desk quiet");
  assert.equal(oneLine("x".repeat(90)).length, 80);
  assert.equal(addBanner([], { id: "1", text: "   ", at: "t" }).length, 0);
  const saved = addBanner([], { id: "1", text: "Desk quiet", at: "2026-11-05T10:00:00Z" });
  assert.equal(saved[0].text, "Desk quiet");
  assert.equal(addBanner(saved, { id: "2", text: "Desk quiet", at: "t" }).length, 1);
  const later = addBanner(saved, { id: "2", text: "On a call", at: "2026-11-05T11:00:00Z" });
  const pinned = later.map((banner) => (banner.id === "1" ? { ...banner, pinned: true } : banner));
  assert.equal(visibleBanners(pinned, "", false)[0].id, "1");
  assert.equal(visibleBanners(pinned, "call", false)[0].text, "On a call");
  assert.equal(visibleBanners(pinned.map((banner) => ({ ...banner, hidden: banner.id === "2" })), "", true)[0].text, "On a call");
  assert.deepEqual(readBanners([{ id: "9", text: "  " }, { id: "1", text: "Desk quiet" }, { id: "3", text: "Desk quiet" }]).map((banner) => banner.id), ["1"]);

  const rows = [
    { id: "a", label: "Ada", type: { docType: " ID " } },
    { id: "b", label: "Bea", type: { docType: "ID" } },
    { id: "c", label: "Cid", type: { docType: "", type: "PROOF" } },
    { id: "d", label: "Dot", type: null },
    { id: "e", label: "Eve", type: { docType: "  ", type: "  ", kind: "  " } },
  ];
  assert.equal(typeText({ docType: " ID " }), "ID");
  assert.equal(typeText({ docType: "", kind: "PROOF" }), "PROOF");
  assert.equal(typeText(null), "");
  assert.deepEqual(typeLines(rows), [
    { type: "", count: 2 },
    { type: "ID", count: 2 },
    { type: "PROOF", count: 1 },
  ]);
  assert.deepEqual(namedTypes(rows), ["ID", "PROOF"]);
  assert.deepEqual(visibleDocs(rows, "ID", false, "ada").map((row) => row.id), ["a"]);
  assert.deepEqual(visibleDocs(rows, "", true, "").map((row) => row.id), ["d", "e"]);
  assert.equal(visibleDocs(rows, "PROOF", false, "").some((row) => row.id === "d"), false);
  assert.deepEqual(readHiddenTypes(["ID", "Invented", ""], ["ID", "PROOF"]), ["ID"]);
  assert.deepEqual(toggleType(["ID"], "PROOF", ["ID", "PROOF"]), ["ID", "PROOF"]);
  assert.deepEqual(visibleTypes(["ID", "PROOF"], ["PROOF"], false), ["ID"]);
  assert.equal(activeType("PROOF", ["ID"]), "");

  const copy = Object.keys(ROUND87_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND87_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "bnTitle"), "Status banner");
  assert.equal(crmv4Text("tr", "dgTitle"), ROUND87_COPY.tr.dgTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-status-banner/);
  assert.match(css, /\.c4-type-glance/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round87.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.match(view, /\/api\/admin\/documents\?take=40/);
  assert.match(view, /data-status-banner/);
  assert.match(view, /data-type-glance/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "statusbanner"/);
  assert.match(app, /view === "doctype"/);
  console.log("crmv4 round87 tests passed");
}

main();
