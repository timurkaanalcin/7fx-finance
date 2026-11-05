/**
 * CRM v3 layout lock and IB status glance.
 * Run: npx tsx tests/crmv3-round100.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { LX_AR, LX_DE, LX_EN, LX_RU, LX_TR } from "../src/lib/crmv3/copy-lock";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { defaultLayout, readLayout } from "../src/lib/crmv3/line";
import { commissionRows } from "../src/lib/crmv3/introducer";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import {
  IB_STATUS_KEY,
  LOCK_KEY,
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
} from "../src/lib/crmv3/desklock";

const ROOT = path.resolve(__dirname, "..");

function main() {
  assert.equal(LOCK_KEY, "crmv3-layout-lock");
  assert.equal(IB_STATUS_KEY, "crmv3-ib-status-hide");
  const base = defaultLayout();
  const moved = movePanel(base, "team", -1);
  assert.equal(moved.order[moved.order.length - 1], "watch");
  assert.equal(moved.order[moved.order.length - 2], "team");
  assert.equal(movePanel(base, "nope", 1).order[0], base.order[0]);
  const hidden = togglePanel(base, "rules");
  assert.equal(hidden.hidden.includes("rules"), true);
  assert.equal(togglePanel(base, "nope").hidden.length, 0);
  const locked = lockDesk(moved);
  assert.equal(locked.locked, true);
  assert.deepEqual(changeLayout(locked, hidden).order, locked.order);
  assert.deepEqual(changeLayout(locked, hidden).hidden, locked.hidden);
  const open = unlockDesk(locked);
  assert.equal(open.locked, false);
  assert.deepEqual(open.order, locked.order);
  assert.equal(changeLayout(open, hidden).hidden.includes("rules"), true);
  assert.deepEqual(shownLayout(locked, base).order, locked.order);
  assert.equal(readLock({ locked: true, order: ["rules", "nope"], hidden: ["fx", "made-up"] }).order.includes("rules"), true);
  assert.equal(readLock({ locked: true, order: ["rules", "nope"], hidden: ["fx", "made-up"] }).order.includes("nope" as never), false);
  assert.equal(readLock({ locked: true, order: ["rules"], hidden: ["made-up"] }).hidden.includes("fx"), false);
  assert.equal(matchingPanels(base, "team", { team: "Team board" })[0], "team");
  const saved = readLayout({ order: ["team", "rules"], hidden: ["rules"] });
  assert.deepEqual(shownLayout(readLock({ locked: false }), saved).hidden, ["rules"]);

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

  const copy = Object.keys(LX_EN).sort();
  assert.deepEqual(Object.keys(LX_TR).sort(), copy);
  assert.deepEqual(Object.keys(LX_DE).sort(), copy);
  assert.deepEqual(Object.keys(LX_RU).sort(), copy);
  assert.deepEqual(Object.keys(LX_AR).sort(), copy);
  assert.notEqual(LX_TR.lxTitle, LX_EN.lxTitle);
  assert.notEqual(LX_DE.bxHint, LX_EN.bxHint);
  assert.notEqual(LX_RU.bxBlank, LX_EN.bxBlank);
  assert.notEqual(LX_AR.lxFrozen, LX_EN.lxFrozen);
  assert.equal(crmv3Text("en", "lxTitle"), "Layout lock");
  assert.equal(crmv3Text("tr", "bxTitle"), LX_TR.bxTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-layout-lock", "de"), "Layout-Sperre");
  assert.equal(keyTitle("crmv3-ib-status-hide", "tr"), "IB durumu");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "layoutlock"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "ibstatus"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("layoutlock"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("ibstatus"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("layoutlock")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "money" && (group.ids as readonly string[]).includes("ibstatus")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-layout-lock/);
  assert.match(css, /\.c3-ib-status/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/desklock.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes('?? "PENDING"'), false);
  assert.match(view, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(view, /\/api\/admin\/deposits\?take=40/);
  assert.match(view, /data-layout-lock/);
  assert.match(view, /data-ib-status/);
  assert.match(view, /data-logo="mono"/);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "layoutlock"/);
  assert.match(app, /view === "ibstatus"/);
  const overview = fs.readFileSync(path.join(ROOT, "src/components/crmv3/views/Overview.tsx"), "utf8");
  assert.match(overview, /lock\.locked/);
  const arrange = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/line.tsx"), "utf8");
  assert.match(arrange, /disabled=\{locked/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round100 tests passed");
}

main();
