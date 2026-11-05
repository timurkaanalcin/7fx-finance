/**
 * Tag palette and ticket assignees.
 * Run: npx tsx tests/crmv4-round93.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND93_COPY } from "../src/lib/crmv4/copy-round93";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeAssignee,
  addTag,
  assigneeText,
  assignLines,
  namedAssignees,
  paletteColor,
  readHiddenAssignees,
  readTags,
  tagName,
  toggleAssignee,
  visibleAssignees,
  visibleTags,
  visibleTickets,
} from "../src/lib/crmv4/round93";

function main() {
  assert.equal(tagName("  "), "");
  assert.equal(tagName(" Desk\ntag "), "Desk tag");
  assert.equal(tagName("x".repeat(50)).length, 40);
  assert.equal(paletteColor(" Champagne "), "champagne");
  assert.equal(paletteColor("red"), "");
  assert.equal(paletteColor("#ff0000"), "");
  assert.equal(addTag([], { id: "1", name: "", color: "ivory", at: "t" }).length, 0);
  assert.equal(addTag([], { id: "1", name: "Desk", color: "purple", at: "t" }).length, 0);
  const saved = addTag([], { id: "1", name: "Desk tag", color: "champagne", at: "2026-11-05T10:00:00Z" });
  assert.equal(saved[0].color, "champagne");
  assert.equal(addTag(saved, { id: "2", name: "Desk tag", color: "ink", at: "t" }).length, 1);
  const later = addTag(saved, { id: "2", name: "Night", color: "ink", at: "2026-11-05T11:00:00Z" });
  const pinned = later.map((tag) => (tag.id === "1" ? { ...tag, pinned: true } : tag));
  assert.equal(visibleTags(pinned, "", false)[0].id, "1");
  assert.equal(visibleTags(pinned, "night", false)[0].name, "Night");
  assert.equal(visibleTags(pinned.map((tag) => ({ ...tag, hidden: tag.id === "2" })), "", true)[0].color, "ink");
  assert.deepEqual(readTags([{ id: "9", name: "", color: "ivory" }, { id: "1", name: "Desk", color: "nope" }, { id: "2", name: "Desk", color: "moss" }]).map((tag) => tag.id), ["2"]);

  const rows = [
    { id: "a", label: "Ada", assignee: { assigneeName: " Mina ", customer: "Ada" } },
    { id: "b", label: "Bea", assignee: { assignee: { name: "Mina" }, customer: "Bea" } },
    { id: "c", label: "Cid", assignee: { owner: { email: "owen@desk.test" } } },
    { id: "d", label: "Dot", assignee: { customer: "Dot" } },
    { id: "e", label: "Eve", assignee: null },
  ];
  assert.equal(assigneeText({ assigneeName: " Mina ", customer: "Ada" }), "Mina");
  assert.equal(assigneeText({ assignee: { name: "Mina" } }), "Mina");
  assert.equal(assigneeText({ customer: "Dot" }), "");
  assert.equal(assigneeText(null), "");
  assert.deepEqual(assignLines(rows), [
    { assignee: "", count: 2 },
    { assignee: "Mina", count: 2 },
    { assignee: "owen@desk.test", count: 1 },
  ]);
  assert.deepEqual(namedAssignees(rows), ["Mina", "owen@desk.test"]);
  assert.equal(namedAssignees([{ assignee: { customer: "Dot" } }]).includes("Unassigned"), false);
  assert.deepEqual(visibleTickets(rows, "Mina", false, "ada").map((row) => row.id), ["a"]);
  assert.deepEqual(visibleTickets(rows, "", true, "").map((row) => row.id), ["d", "e"]);
  assert.equal(visibleTickets(rows, "Mina", false, "").some((row) => row.id === "d"), false);
  assert.deepEqual(readHiddenAssignees(["Mina", "Invented", ""], ["Mina", "owen@desk.test"]), ["Mina"]);
  assert.deepEqual(toggleAssignee(["Mina"], "owen@desk.test", ["Mina", "owen@desk.test"]), ["Mina", "owen@desk.test"]);
  assert.deepEqual(visibleAssignees(["Mina", "owen@desk.test"], ["owen@desk.test"], false), ["Mina"]);
  assert.equal(activeAssignee("owen@desk.test", ["Mina"]), "");

  const copy = Object.keys(ROUND93_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND93_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "plTitle"), "Tag palette");
  assert.equal(crmv4Text("tr", "gnTitle"), ROUND93_COPY.tr.gnTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-tag-palette/);
  assert.match(css, /\.c4-assignee-glance/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round93.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.match(view, /\/api\/admin\/tickets\?take=40/);
  assert.match(view, /data-tag-palette/);
  assert.match(view, /data-assignee-glance/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "tagpalette"/);
  assert.match(app, /view === "assignee"/);
  console.log("crmv4 round93 tests passed");
}

main();
