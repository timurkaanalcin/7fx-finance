/**
 * CRM v3 round 35: today's loaded work and the staff roster.
 * Run: npx tsx tests/crmv3-round35.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { TODAY_AR, TODAY_DE, TODAY_EN, TODAY_RU, TODAY_TR } from "../src/lib/crmv3/copy-today";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import { filterLoad, groupByDesk, kycOpen, overdueFollows, pendingCount, readLoad, staffCards, unassignedCount, unreadThreads } from "../src/lib/crmv3/today";

const ROOT = path.resolve(__dirname, "..");

function main() {
  assert.equal(pendingCount([{ status: "PENDING" }, { status: "APPROVED" }, {}]), 2);
  assert.equal(kycOpen([{ documentsStatus: "APPROVED" }, { documentsStatus: "NONE" }, {}]), 2);
  assert.equal(overdueFollows([{ retentionFollowUpAt: "2026-10-27T10:00:00Z" }, { retentionFollowUpAt: "2026-11-02T10:00:00Z" }], "2026-10-31"), 1);
  assert.equal(unreadThreads([{ messages: [{ workerId: null, automatic: false }], presence: { adminLastReadAt: "x" } }, { messages: [{ workerId: "s" }], presence: { adminLastReadAt: "x" } }]), 1);
  const cards = staffCards(
    [{ id: "a", name: "Ada", desk: "Istanbul" }, { id: "b", name: "Bo", desk: "" }],
    [{ assigneeName: "Ada" }, { assigneeName: "ada" }, { assigneeName: "Nobody" }],
  );
  assert.equal(cards[0].assigned, 2);
  assert.equal(cards[1].assigned, 0);
  assert.equal(unassignedCount([{ assigneeName: "Nobody" }, { assigneeName: "Ada" }], [{ name: "Ada" }]), 1);
  assert.equal(filterLoad(cards, "busy").length, 1);
  assert.equal(filterLoad(cards, "clear")[0].name, "Bo");
  assert.equal(groupByDesk(cards)[0].desk, "");
  assert.equal(readLoad("busy"), "busy");
  assert.equal(readLoad("clear"), "clear");
  assert.equal(readLoad("nope"), "all");
  assert.equal(readLoad(null), "all");

  const copy = Object.keys(TODAY_EN).sort();
  assert.deepEqual(Object.keys(TODAY_TR).sort(), copy);
  assert.deepEqual(Object.keys(TODAY_DE).sort(), copy);
  assert.deepEqual(Object.keys(TODAY_RU).sort(), copy);
  assert.deepEqual(Object.keys(TODAY_AR).sort(), copy);

  const ids = NAV_SECTIONS.flatMap((group) => [...group.ids]);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(ids.slice().sort(), CRM_V3_SECTIONS.map((item) => item.id).slice().sort());
  assert.equal(ids.includes("roster"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("roster"), true);
  const desk = NAV_SECTIONS.find((group) => group.id === "desk");
  assert.equal(desk?.ids.includes("roster"), true);

  const lib = fs.readFileSync(path.join(ROOT, "src/lib/crmv3/today.ts"), "utf8");
  assert.match(lib, /crmv3-staff-load/);
  assert.equal(lib.includes("crmv4"), false);
  const page = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/today.tsx"), "utf8");
  assert.match(page, /LOAD_KEY/);
  assert.match(page, /data-hero="1"/);
  assert.match(page, /data-staff="1"/);
  assert.match(page, /\/api\/admin\/deposits\?status=PENDING/);
  assert.match(page, /\/api\/admin\/withdrawals\?status=PENDING/);
  assert.equal(page.includes("view=table"), false);
  assert.equal(page.includes("crmv4"), false);
  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-today/);
  assert.match(css, /\.c3-staff/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "roster"/);
  assert.match(app, /TodayHero|DeskStaff/);
  const overview = fs.readFileSync(path.join(ROOT, "src/components/crmv3/views/Overview.tsx"), "utf8");
  assert.match(overview, /TodayHero/);
  const tree = fs.readdirSync(path.join(ROOT, "src/components/crmv3"), { recursive: true }) as string[];
  for (const file of tree) {
    if (!String(file).endsWith(".tsx") && !String(file).endsWith(".ts")) continue;
    const src = fs.readFileSync(path.join(ROOT, "src/components/crmv3", String(file)), "utf8");
    assert.equal(src.includes("crmv4"), false, String(file));
  }
  console.log("crmv3 round35 tests passed");
}

main();
