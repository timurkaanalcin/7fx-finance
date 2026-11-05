/**
 * Follow-up queue and ticket statuses.
 * Run: npx tsx tests/crmv3-round108.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FF_AR, FF_DE, FF_EN, FF_RU, FF_TR } from "../src/lib/crmv3/copy-followqueue";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { keyTitle } from "../src/lib/crmv3/insights";
import { FOLLOW_KEY, TICKET_STATUS_KEY } from "../src/lib/crmv3/followqueue";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import {
  activeStatus,
  addFollow,
  clearFollow,
  clearFollows,
  moveFollow,
  namedStatuses,
  noteText,
  readFollows,
  readHiddenStatuses,
  setFollowDone,
  statusLines,
  statusText,
  toggleStatus,
  visibleFollows,
  visibleStatuses,
  visibleTickets,
} from "../src/lib/crmv3/followqueue";

function main() {
  assert.equal(FOLLOW_KEY, "crmv3-follow-queue");
  assert.equal(TICKET_STATUS_KEY, "crmv3-ticket-status-hide");
  const present = ["ada", "bea"];
  assert.equal(noteText("  "), "");
  assert.equal(noteText(" Call\nlater "), "Call later");
  assert.equal(noteText("x".repeat(90)).length, 80);
  assert.equal(addFollow([], { id: "  ", note: "x" }, present).length, 0);
  assert.equal(addFollow([], { id: "nope", note: "x" }, present).length, 0);
  const ada = addFollow([], { id: "ada", note: "Call later" }, present);
  const both = addFollow(ada, { id: "bea", note: "   " }, present);
  assert.equal(addFollow(both, { id: "ada", note: "again" }, present).length, 2);
  assert.equal(both.find((item) => item.id === "bea")?.note, "");
  const moved = moveFollow(both, "bea", -1, present);
  assert.equal(moved.find((item) => item.id === "bea")?.order, 1);
  assert.equal(moved.find((item) => item.id === "ada")?.order, 2);
  assert.equal(moveFollow(both, "ada", -1, present).find((item) => item.id === "ada")?.order, 1);
  const done = setFollowDone(both, "ada", true, present);
  assert.equal(done.find((item) => item.id === "ada")?.done, true);
  assert.equal(setFollowDone(done, "ada", false, present).find((item) => item.id === "ada")?.done, false);
  assert.deepEqual(clearFollow(both, "ada", present).map((item) => item.id), ["bea"]);
  assert.deepEqual(clearFollows(), []);
  assert.deepEqual(readFollows([{ id: "nope", note: "x" }, { id: "ada", note: "  " }, { id: "ada", note: "again" }], present).map((item) => item.id), ["ada"]);
  const people = [
    { id: "ada", name: "Ada Lane", email: "ada@desk.test" },
    { id: "bea", name: "Bea", email: "bea@desk.test" },
  ];
  assert.deepEqual(visibleFollows(people, both, "later", false).map((row) => row.id), ["ada"]);
  assert.deepEqual(visibleFollows(people, done, "", true).map((row) => row.id), ["ada"]);

  const rows = [
    { id: "a", label: "Ada", status: " PENDING " },
    { id: "b", label: "Bea", status: "PENDING" },
    { id: "c", label: "Cid", status: "OPEN" },
    { id: "d", label: "Dot", status: "", kind: "DEPOSIT" },
    { id: "e", label: "Eve", status: null },
  ];
  assert.equal(statusText(" PENDING "), "PENDING");
  assert.equal(statusText({ status: "OPEN", kind: "DEPOSIT" }), "OPEN");
  assert.equal(statusText({ kind: "DEPOSIT" }), "");
  assert.deepEqual(statusLines(rows), [
    { status: "", count: 2 },
    { status: "OPEN", count: 1 },
    { status: "PENDING", count: 2 },
  ]);
  assert.deepEqual(namedStatuses(rows), ["OPEN", "PENDING"]);
  assert.equal(namedStatuses([{ status: null }]).includes("OPEN"), false);
  assert.deepEqual(visibleTickets(rows, "PENDING", false, "bea").map((row) => row.id), ["b"]);
  assert.deepEqual(visibleTickets(rows, "", true, "").map((row) => row.id), ["d", "e"]);
  assert.deepEqual(readHiddenStatuses(["PENDING", "WAITING", ""], ["PENDING", "OPEN"]), ["PENDING"]);
  assert.deepEqual(toggleStatus(["PENDING"], "WAITING", ["PENDING"]), ["PENDING"]);
  assert.deepEqual(visibleStatuses(["OPEN", "PENDING"], ["OPEN"], false), ["PENDING"]);
  assert.equal(activeStatus("OPEN", ["PENDING"]), "");

  const copy = Object.keys(FF_EN).sort();
  for (const table of [FF_TR, FF_DE, FF_RU, FF_AR]) assert.deepEqual(Object.keys(table).sort(), copy);
  assert.equal(crmv3Text("en", "ffTitle"), "Follow-up queue");
  assert.equal(crmv3Text("tr", "tzTitle"), FF_TR.tzTitle);
  assert.equal(keyTitle("crmv3-follow-queue", "de"), "Nachfass-Warteschlange");
  assert.equal(keyTitle("crmv3-ticket-status-hide", "ar"), "حالة التذكرة");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "followqueue"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "ticketstatus"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("followqueue"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("ticketstatus"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("followqueue")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "work" && (group.ids as readonly string[]).includes("ticketstatus")), true);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-follow-queue/);
  assert.match(css, /\.c3-ticket-glance/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv3/desk/followqueue.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes('?? "OPEN"'), false);
  assert.match(view, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(view, /\/api\/admin\/tickets\?take=40/);
  assert.match(view, /data-follow-queue/);
  assert.match(view, /data-ticket-glance/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "followqueue"/);
  assert.match(app, /view === "ticketstatus"/);
  console.log("crmv3 round108 tests passed");
}

main();
