/**
 * Layout lock and introducer statuses.
 * Run: npx tsx tests/crmv4-round100.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND100_COPY } from "../src/lib/crmv4/copy-round100";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { defaultLayout, readLayout } from "../src/lib/crmv4/round26";
import { commissionRows } from "../src/lib/crmv4/round61";
import {
  activeStatus,
  changeLayout,
  lockDesk,
  matchingPanels,
  movePanel,
  namedStatuses,
  readHiddenStatuses,
  readLock,
  shownLayout,
  statusLines,
  statusText,
  togglePanel,
  toggleStatus,
  unlockDesk,
  visibleIntroducers,
  visibleStatuses,
} from "../src/lib/crmv4/round100";

function main() {
  const base = defaultLayout();
  const moved = movePanel(base, "recent", -1);
  assert.equal(moved.order[moved.order.length - 1], "exposure");
  assert.equal(moved.order[moved.order.length - 2], "recent");
  assert.equal(movePanel(base, "nope", 1).order[0], base.order[0]);
  const hidden = togglePanel(base, "alerts");
  assert.equal(hidden.hidden.includes("alerts"), true);
  assert.equal(togglePanel(base, "nope").hidden.length, 0);
  const locked = lockDesk(moved);
  assert.equal(locked.locked, true);
  assert.deepEqual(changeLayout(locked, hidden).order, locked.order);
  assert.deepEqual(changeLayout(locked, hidden).hidden, locked.hidden);
  const open = unlockDesk(locked);
  assert.equal(open.locked, false);
  assert.deepEqual(open.order, locked.order);
  assert.equal(changeLayout(open, hidden).hidden.includes("alerts"), true);
  assert.deepEqual(shownLayout(locked, base).order, locked.order);
  assert.equal(readLock({ locked: true, order: ["alerts", "nope"], hidden: ["fx", "made-up"] }).order.includes("alerts"), true);
  assert.equal(readLock({ locked: true, order: ["alerts", "nope"], hidden: ["fx", "made-up"] }).order.includes("nope" as never), false);
  assert.equal(readLock({ locked: true, order: ["alerts"], hidden: ["made-up"] }).hidden.includes("fx"), false);
  assert.equal(matchingPanels(base, "recent", { recent: "Recent customers" })[0], "recent");
  const saved = readLayout({ order: ["recent", "alerts"], hidden: ["alerts"] });
  assert.deepEqual(shownLayout(readLock({ locked: false }), saved).hidden, ["alerts"]);

  const people = [
    { id: "u1", name: "Ada", affiliateA: "IB-1" },
    { id: "u2", name: "Bea" },
  ];
  const deposits = [
    { id: "d1", status: "PENDING", userId: "u1", currency: "USD", amount: 10 },
    { id: "d2", status: "PENDING", userId: "u1", currency: "EUR", amount: 4 },
    { id: "d3", status: "", userId: "u1", currency: "USD", amount: 1 },
    { id: "d4", status: "FILLED", userId: "u2", currency: "USD", amount: 9 },
  ];
  const rows = commissionRows(people, deposits).map((row) => ({ id: row.id, status: row.status, label: `${row.affiliate} ${row.name}` }));
  assert.deepEqual(rows.map((row) => row.id), ["d1", "d2", "d3"]);
  assert.equal(statusText({ status: null }), "");
  assert.equal(namedStatuses([{ status: null }]).includes("PENDING"), false);
  assert.deepEqual(statusLines(rows), [
    { status: "", count: 1 },
    { status: "PENDING", count: 2 },
  ]);
  assert.deepEqual(visibleIntroducers(rows, "PENDING", false, "ada").map((row) => row.id), ["d1", "d2"]);
  assert.deepEqual(visibleIntroducers(rows, "", true, "").map((row) => row.id), ["d3"]);
  assert.deepEqual(readHiddenStatuses(["PENDING", "APPROVED", ""], ["PENDING"]), ["PENDING"]);
  assert.deepEqual(toggleStatus(["PENDING"], "FILLED", ["PENDING"]), ["PENDING"]);
  assert.deepEqual(visibleStatuses(["PENDING"], ["PENDING"], false), []);
  assert.equal(activeStatus("PENDING", []), "");

  const copy = Object.keys(ROUND100_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND100_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "lxTitle"), "Layout lock");
  assert.equal(crmv4Text("tr", "bxTitle"), ROUND100_COPY.tr.bxTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-layout-lock/);
  assert.match(css, /\.c4-ib-status/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round100.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes('?? "PENDING"'), false);
  assert.match(view, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(view, /\/api\/admin\/deposits\?take=40/);
  assert.match(view, /data-layout-lock/);
  assert.match(view, /data-ib-status/);
  assert.match(view, /data-logo="mono"/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "layoutlock"/);
  assert.match(app, /view === "ibstatus"/);
  const overview = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Overview.tsx"), "utf8");
  assert.match(overview, /lock\.locked/);
  console.log("crmv4 round100 tests passed");
}

main();
