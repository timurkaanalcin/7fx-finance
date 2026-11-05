/**
 * Quick dial and ticket assignees.
 * Run: npx tsx tests/crmv3-round115.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { QD_AR, QD_DE, QD_EN, QD_RU, QD_TR } from "../src/lib/crmv3/copy-quickdial";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { keyTitle } from "../src/lib/crmv3/insights";
import { ASSIGN_HIDE_KEY, DIAL_KEY } from "../src/lib/crmv3/quickdial";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
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
} from "../src/lib/crmv3/quickdial";

function main() {
  assert.equal(DIAL_KEY, "crmv3-quick-dial");
  assert.equal(ASSIGN_HIDE_KEY, "crmv3-ticket-assign-hide");
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

  const copy = Object.keys(QD_EN).sort();
  for (const table of [QD_TR, QD_DE, QD_RU, QD_AR]) assert.deepEqual(Object.keys(table).sort(), copy);
  assert.equal(crmv3Text("en", "qdTitle"), "Quick dial");
  assert.equal(crmv3Text("tr", "taTitle"), QD_TR.taTitle);
  assert.equal(keyTitle("crmv3-quick-dial", "de"), "Schnellwahl");
  assert.equal(keyTitle("crmv3-ticket-assign-hide", "ar"), "مكلّفو التذاكر");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "quickdial"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "ticketassign"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("quickdial"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("ticketassign"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("quickdial")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "work" && (group.ids as readonly string[]).includes("ticketassign")), true);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-quick-dial/);
  assert.match(css, /\.c3-ticket-assign/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv3/desk/quickdial.tsx"), "utf8");
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
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "quickdial"/);
  assert.match(app, /view === "ticketassign"/);
  console.log("crmv3 round115 tests passed");
}

main();
