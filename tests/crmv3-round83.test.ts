/**
 * CRM v3 pinboard and IB glance.
 * Run: npx tsx tests/crmv3-round83.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { PIN_AR, PIN_DE, PIN_EN, PIN_RU, PIN_TR } from "../src/lib/crmv3/copy-pin";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { commissionRows } from "../src/lib/crmv3/introducer";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import {
  BOARD_KEY,
  IB_KEY,
  activeIb,
  addCard,
  ibKind,
  ibSplit,
  otherStatuses,
  presentIbs,
  readCards,
  readHiddenIbs,
  toggleIb,
  visibleCards,
  visibleIbs,
  visibleReferrals,
} from "../src/lib/crmv3/pinboard";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";

const ROOT = path.resolve(__dirname, "..");

function main() {
  assert.equal(BOARD_KEY, "crmv3-pinboard");
  assert.equal(IB_KEY, "crmv3-ib-hide");
  assert.equal(addCard([], { id: "1", text: "   ", at: "t" }).length, 0);
  const saved = addCard([], { id: "1", text: " Call the desk ", at: "2026-11-05T10:00:00Z" });
  assert.equal(saved[0].text, "Call the desk");
  assert.equal(addCard(saved, { id: "1", text: "Again", at: "t" }).length, 1);
  const later = addCard(saved, { id: "2", text: "Second card", at: "2026-11-05T11:00:00Z" });
  const pinned = later.map((card) => (card.id === "2" ? { ...card, pinned: true } : card));
  assert.equal(visibleCards(pinned, "", false)[0].id, "2");
  assert.equal(visibleCards(pinned, "desk", false)[0].id, "1");
  assert.equal(visibleCards(pinned, "zzz", false).length, 0);
  assert.equal(visibleCards(pinned.map((card) => ({ ...card, hidden: card.id === "1" })), "", true)[0].id, "1");
  assert.deepEqual(readCards([{ id: "9", text: "  " }, { id: "1", text: "Call the desk" }]).map((card) => card.id), ["1"]);

  const people = [{ id: "a", name: "Ada", affiliateA: "IB1" }, { id: "b", name: "Bea" }];
  const deposits = [
    { id: "d1", amount: 10, currency: "USD", status: "PENDING", userId: "a" },
    { id: "d2", amount: 20, currency: "EUR", status: "APPROVED", userId: "a" },
    { id: "d3", amount: 99, currency: "USD", status: "PENDING", userId: "b" },
    { id: "d4", amount: 5, currency: "TRY", status: "ACTIVE", userId: "a" },
    { id: "d5", amount: 1, currency: "USD", status: "", userId: "a" },
  ];
  const joined = commissionRows(people, deposits);
  assert.deepEqual(joined.map((row) => row.id), ["d1", "d2", "d4", "d5"]);
  const rows = joined.map((row) => ({ id: row.id, label: `${row.affiliate} ${row.name}`, status: row.status }));
  assert.equal(ibKind("APPROVED"), "");
  assert.equal(ibKind(""), "");
  assert.deepEqual(ibSplit(rows), { active: 1, pending: 1 });
  assert.deepEqual(otherStatuses(rows), [{ status: "APPROVED", count: 1 }]);
  assert.deepEqual(presentIbs(rows), ["active", "pending"]);
  assert.deepEqual(visibleReferrals(rows, "pending", "ada").map((row) => row.id), ["d1"]);
  assert.equal(visibleReferrals(rows, "active", "").some((row) => row.id === "d2"), false);
  assert.deepEqual(readHiddenIbs(["pending", "approved", ""]), ["pending"]);
  assert.deepEqual(toggleIb(["pending"], "active"), ["pending", "active"]);
  assert.deepEqual(visibleIbs(["active", "pending"], ["active"], false), ["pending"]);
  assert.equal(activeIb("active", ["pending"]), "");
  assert.equal(activeIb("PENDING", ["pending"]), "pending");
  const usd = joined.filter((row) => row.currency === "USD").reduce((sum, row) => sum + (row.amount || 0), 0);
  const eur = joined.filter((row) => row.currency === "EUR").reduce((sum, row) => sum + (row.amount || 0), 0);
  assert.equal(usd, 11);
  assert.equal(eur, 20);
  assert.notEqual(usd + eur, joined.reduce((sum, row) => sum + (row.amount || 0), 0) || usd);

  const copy = Object.keys(PIN_EN).sort();
  assert.deepEqual(Object.keys(PIN_TR).sort(), copy);
  assert.deepEqual(Object.keys(PIN_DE).sort(), copy);
  assert.deepEqual(Object.keys(PIN_RU).sort(), copy);
  assert.deepEqual(Object.keys(PIN_AR).sort(), copy);
  assert.notEqual(PIN_TR.pnTitle, PIN_EN.pnTitle);
  assert.notEqual(PIN_DE.igHint, PIN_EN.igHint);
  assert.notEqual(PIN_RU.igPending, PIN_EN.igPending);
  assert.notEqual(PIN_AR.pnBlank, PIN_EN.pnBlank);
  assert.equal(crmv3Text("en", "pnTitle"), "Pinboard");
  assert.equal(crmv3Text("tr", "igTitle"), PIN_TR.igTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-pinboard", "de"), "Pinnwand");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "pinboard"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "ibglance"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("pinboard"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("ibglance"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("pinboard")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "money" && (group.ids as readonly string[]).includes("ibglance")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-pin-board/);
  assert.match(css, /\.c3-ib-glance/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/pin.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("fetch("), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes("/api/admin/deposits?take=40"), true);
  assert.equal(view.includes("/api/admin/users?take=40&meta=0&role=TRADER"), true);
  assert.match(view, /BOARD_KEY/);
  assert.match(view, /data-pin-board/);
  assert.match(view, /data-ib-glance/);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "pinboard"/);
  assert.match(app, /view === "ibglance"/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round83 tests passed");
}

main();
