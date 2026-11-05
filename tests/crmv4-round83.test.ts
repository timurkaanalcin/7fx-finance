/**
 * Pinboard and IB glance.
 * Run: npx tsx tests/crmv4-round83.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND83_COPY } from "../src/lib/crmv4/copy-round83";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { commissionRows } from "../src/lib/crmv4/round61";
import {
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
} from "../src/lib/crmv4/round83";

function main() {
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

  const copy = Object.keys(ROUND83_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND83_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "pnTitle"), "Pinboard");
  assert.equal(crmv4Text("tr", "igTitle"), ROUND83_COPY.tr.igTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-pin-board/);
  assert.match(css, /\.c4-ib-glance/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round83.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes("/api/admin/deposits?take=40"), true);
  assert.equal(view.includes("/api/admin/users?take=40&meta=0&role=TRADER"), true);
  assert.match(view, /data-pin-board/);
  assert.match(view, /data-ib-glance/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "pinboard"/);
  assert.match(app, /view === "ibglance"/);
  console.log("crmv4 round83 tests passed");
}

main();
