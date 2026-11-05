/**
 * CRM v3 status banner and document type glance.
 * Run: npx tsx tests/crmv3-round87.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { BN_AR, BN_DE, BN_EN, BN_RU, BN_TR } from "../src/lib/crmv3/copy-banner";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import {
  BANNER_KEY,
  TYPE_KEY,
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
} from "../src/lib/crmv3/banner";

const ROOT = path.resolve(__dirname, "..");

function main() {
  assert.equal(BANNER_KEY, "crmv3-status-banners");
  assert.equal(TYPE_KEY, "crmv3-doctype-hide");
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

  const copy = Object.keys(BN_EN).sort();
  assert.deepEqual(Object.keys(BN_TR).sort(), copy);
  assert.deepEqual(Object.keys(BN_DE).sort(), copy);
  assert.deepEqual(Object.keys(BN_RU).sort(), copy);
  assert.deepEqual(Object.keys(BN_AR).sort(), copy);
  assert.notEqual(BN_TR.bnTitle, BN_EN.bnTitle);
  assert.notEqual(BN_DE.dgHint, BN_EN.dgHint);
  assert.notEqual(BN_RU.dgBlank, BN_EN.dgBlank);
  assert.notEqual(BN_AR.bnEmpty, BN_EN.bnEmpty);
  assert.equal(crmv3Text("en", "bnTitle"), "Status banner");
  assert.equal(crmv3Text("tr", "dgTitle"), BN_TR.dgTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-status-banners", "de"), "Statusbanner");
  assert.equal(keyTitle("crmv3-doctype-hide", "tr"), "Tür bakışı");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "statusbanner"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "doctype"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("statusbanner"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("doctype"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("statusbanner")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "compliance" && (group.ids as readonly string[]).includes("doctype")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-status-banner/);
  assert.match(css, /\.c3-type-glance/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/banner.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.match(view, /\/api\/admin\/documents\?take=40/);
  assert.match(view, /data-status-banner/);
  assert.match(view, /data-type-glance/);
  assert.match(view, /BANNER_KEY/);
  assert.match(view, /TYPE_KEY/);
  assert.equal(view.includes("OTHER"), false);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "statusbanner"/);
  assert.match(app, /view === "doctype"/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round87 tests passed");
}

main();
