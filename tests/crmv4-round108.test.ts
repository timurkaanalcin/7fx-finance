/**
 * Follow-up queue and ticket statuses.
 * Run: npx tsx tests/crmv4-round108.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND108_COPY } from "../src/lib/crmv4/copy-round108";
import { crmv4Text } from "../src/lib/crmv4/copy";
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
} from "../src/lib/crmv4/round108";

function main() {
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

  const copy = Object.keys(ROUND108_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND108_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "ffTitle"), "Follow-up queue");
  assert.equal(crmv4Text("tr", "tzTitle"), ROUND108_COPY.tr.tzTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-follow-queue/);
  assert.match(css, /\.c4-ticket-glance/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round108.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes('?? "OPEN"'), false);
  assert.match(view, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(view, /\/api\/admin\/tickets\?take=40/);
  assert.match(view, /data-follow-queue/);
  assert.match(view, /data-ticket-glance/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "followqueue"/);
  assert.match(app, /view === "ticketstatus"/);
  console.log("crmv4 round108 tests passed");
}

main();
