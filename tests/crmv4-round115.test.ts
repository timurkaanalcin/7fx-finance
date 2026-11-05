/**
 * Quick dial and ticket assignees.
 * Run: npx tsx tests/crmv4-round115.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND115_COPY } from "../src/lib/crmv4/copy-round115";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeAssignee,
  addDial,
  assignLines,
  assigneeText,
  dialLabel,
  namedAssignees,
  phoneText,
  readDials,
  readHiddenAssignees,
  resetDials,
  setDialHidden,
  toggleAssignee,
  toggleDialPin,
  visibleAssignees,
  visibleDials,
  visibleTickets,
} from "../src/lib/crmv4/round115";

function main() {
  assert.equal(dialLabel("  Desk\nline  "), "Desk line");
  assert.equal(dialLabel("   "), "");
  assert.equal(dialLabel("x".repeat(90)).length, 80);
  assert.equal(phoneText("  214  "), "214");
  assert.equal(phoneText("   "), "");
  assert.deepEqual(readDials([{ id: "", label: "Ada" }, { id: "1", label: "  " }, { id: "2", label: "Desk", phone: "  ", pinned: 1 }]), [
    { id: "2", label: "Desk", phone: "", pinned: false, hidden: false },
  ]);
  const saved = addDial([], { id: "a", label: " Desk ", phone: " 214 " });
  assert.deepEqual(saved, [{ id: "a", label: "Desk", phone: "214", pinned: false, hidden: false }]);
  assert.equal(addDial(saved, { id: "b", label: "  " }).length, 1);
  assert.equal(addDial(saved, { id: "c", label: "Desk", phone: "214" }).length, 1);
  const pinned = toggleDialPin(saved, "a");
  assert.equal(pinned[0].pinned, true);
  const hidden = setDialHidden(pinned, "a", true);
  assert.equal(hidden[0].hidden, true);
  assert.deepEqual(visibleDials(pinned, false, "214").map((dial) => dial.id), ["a"]);
  assert.deepEqual(visibleDials(hidden, false, ""), []);
  assert.deepEqual(resetDials(), []);

  assert.equal(assigneeText({ assigneeName: " Ada ", assignee: "Bea" }), "Ada");
  assert.equal(assigneeText({ assigneeName: "", assignee: { name: " Bea " } }), "Bea");
  assert.equal(assigneeText({ assigneeName: "", owner: " Cid " }), "Cid");
  assert.equal(assigneeText({ customer: "Dot" } as never), "");
  assert.equal(assigneeText(""), "");
  assert.equal(assigneeText(4 as never), "");
  const rows = [
    { id: "t1", label: "Ada", assignee: { assigneeName: "Nia" } },
    { id: "t2", label: "Bea", assignee: { assignee: "Omar" } },
    { id: "t3", label: "Cid", assignee: "Nia" },
    { id: "t4", label: "Dot", assignee: { customer: "Dot" } },
    { id: "t5", label: "Eve", assignee: "" },
  ];
  assert.deepEqual(assignLines(rows), [
    { assignee: "", count: 2 },
    { assignee: "Nia", count: 2 },
    { assignee: "Omar", count: 1 },
  ]);
  assert.deepEqual(namedAssignees(rows), ["Nia", "Omar"]);
  assert.deepEqual(visibleTickets(rows, "Nia", false, "ada").map((row) => row.id), ["t1"]);
  assert.deepEqual(visibleTickets(rows, "", true, "").map((row) => row.id), ["t4", "t5"]);
  assert.deepEqual(readHiddenAssignees(["Nia", "Zoe", ""], ["Nia", "Omar"]), ["Nia"]);
  assert.deepEqual(toggleAssignee(["Nia"], "Zoe", ["Nia"]), ["Nia"]);
  assert.deepEqual(visibleAssignees(["Nia", "Omar"], ["Omar"], false), ["Nia"]);
  assert.equal(activeAssignee("Omar", ["Nia"]), "");

  const copy = Object.keys(ROUND115_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND115_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "qdTitle"), "Quick dial");
  assert.equal(crmv4Text("tr", "taTitle"), ROUND115_COPY.tr.taTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-quick-dial/);
  assert.match(css, /\.c4-ticket-assign/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round115.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("fetch("), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes("tel:"), false);
  assert.match(view, /\/api\/admin\/tickets\?take=40/);
  assert.match(view, /data-quick-dial/);
  assert.match(view, /data-ticket-assign/);
  assert.match(view, /data-logo="mono"/);
  assert.match(view, /support/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "quickdial"/);
  assert.match(app, /view === "ticketassign"/);
  console.log("crmv4 round115 tests passed");
}

main();
