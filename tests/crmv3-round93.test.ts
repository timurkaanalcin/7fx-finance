/**
 * CRM v3 tag palette and ticket assignee glance.
 * Run: npx tsx tests/crmv3-round93.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { PL_AR, PL_DE, PL_EN, PL_RU, PL_TR } from "../src/lib/crmv3/copy-palette";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import {
  ASSIGN_KEY,
  PALETTE_KEY,
  activeAssignee,
  addTag,
  assignLines,
  assigneeText,
  namedAssignees,
  paletteColor,
  readHiddenAssignees,
  readTags,
  tagName,
  toggleAssignee,
  visibleAssignees,
  visibleTags,
  visibleTickets,
} from "../src/lib/crmv3/palette";

const ROOT = path.resolve(__dirname, "..");

function main() {
  assert.equal(PALETTE_KEY, "crmv3-tag-palette");
  assert.equal(ASSIGN_KEY, "crmv3-assignee-hide");
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

  const copy = Object.keys(PL_EN).sort();
  assert.deepEqual(Object.keys(PL_TR).sort(), copy);
  assert.deepEqual(Object.keys(PL_DE).sort(), copy);
  assert.deepEqual(Object.keys(PL_RU).sort(), copy);
  assert.deepEqual(Object.keys(PL_AR).sort(), copy);
  assert.notEqual(PL_TR.plTitle, PL_EN.plTitle);
  assert.notEqual(PL_DE.gnHint, PL_EN.gnHint);
  assert.notEqual(PL_RU.gnBlank, PL_EN.gnBlank);
  assert.notEqual(PL_AR.plUnknown, PL_EN.plUnknown);
  assert.equal(crmv3Text("en", "plTitle"), "Tag palette");
  assert.equal(crmv3Text("tr", "gnTitle"), PL_TR.gnTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-tag-palette", "de"), "Farbpalette");
  assert.equal(keyTitle("crmv3-assignee-hide", "tr"), "Atanan bakışı");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "tagpalette"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "assignee"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("tagpalette"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("assignee"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("tagpalette")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "work" && (group.ids as readonly string[]).includes("assignee")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-tag-palette/);
  assert.match(css, /\.c3-assignee-glance/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/palette.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.match(view, /\/api\/admin\/tickets\?take=40/);
  assert.match(view, /data-tag-palette/);
  assert.match(view, /data-assignee-glance/);
  assert.match(view, /PALETTE_KEY/);
  assert.match(view, /ASSIGN_KEY/);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "tagpalette"/);
  assert.match(app, /view === "assignee"/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round93 tests passed");
}

main();
