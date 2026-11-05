/**
 * Quick links and ticket priorities.
 * Run: npx tsx tests/crmv4-round88.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND88_COPY } from "../src/lib/crmv4/copy-round88";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activePriority,
  addLink,
  httpUrl,
  linkName,
  namedPriorities,
  priorityLines,
  priorityText,
  readHiddenPriorities,
  readLinks,
  togglePriority,
  visibleLinks,
  visiblePriorities,
  visibleTickets,
} from "../src/lib/crmv4/round88";

function main() {
  assert.equal(linkName("  "), "");
  assert.equal(linkName(" Desk\nnotes "), "Desk notes");
  assert.equal(httpUrl(""), "");
  assert.equal(httpUrl("javascript:alert(1)"), "");
  assert.equal(httpUrl("/crmv4/support"), "");
  assert.equal(httpUrl("ftp://files.example/a"), "");
  assert.equal(httpUrl("https://example.com/desk"), "https://example.com/desk");
  assert.equal(addLink([], { id: "1", name: "", url: "https://example.com", at: "t" }).length, 0);
  assert.equal(addLink([], { id: "1", name: "Desk", url: "", at: "t" }).length, 0);
  assert.equal(addLink([], { id: "1", name: "Desk", url: "javascript:alert(1)", at: "t" }).length, 0);
  const saved = addLink([], { id: "1", name: "Desk notes", url: "https://example.com/desk", at: "2026-11-05T10:00:00Z" });
  assert.equal(saved[0].url, "https://example.com/desk");
  assert.equal(addLink(saved, { id: "2", name: "Again", url: "https://example.com/desk", at: "t" }).length, 1);
  const later = addLink(saved, { id: "2", name: "Rates", url: "http://rates.example/board", at: "2026-11-05T11:00:00Z" });
  const pinned = later.map((link) => (link.id === "1" ? { ...link, pinned: true } : link));
  assert.equal(visibleLinks(pinned, "", false)[0].id, "1");
  assert.equal(visibleLinks(pinned, "rates", false)[0].name, "Rates");
  assert.equal(visibleLinks(pinned.map((link) => ({ ...link, hidden: link.id === "2" })), "", true)[0].name, "Rates");
  assert.deepEqual(readLinks([{ id: "9", name: "", url: "https://example.com" }, { id: "1", name: "Desk", url: "https://example.com/a" }, { id: "3", name: "Other", url: "https://example.com/a" }]).map((link) => link.id), ["1"]);

  const rows = [
    { id: "a", label: "Ada", priority: " High " },
    { id: "b", label: "Bea", priority: "High" },
    { id: "c", label: "Cid", priority: 0 },
    { id: "d", label: "Dot", priority: null },
    { id: "e", label: "Eve" },
  ];
  assert.equal(priorityText(" High "), "High");
  assert.equal(priorityText(0), "0");
  assert.equal(priorityText(undefined), "");
  assert.equal(priorityText({ priority: "low" }), "low");
  assert.deepEqual(priorityLines(rows), [
    { priority: "", count: 2 },
    { priority: "0", count: 1 },
    { priority: "High", count: 2 },
  ]);
  assert.deepEqual(namedPriorities(rows), ["0", "High"]);
  assert.equal(namedPriorities([{ priority: undefined }]).includes("normal"), false);
  assert.deepEqual(visibleTickets(rows, "High", false, "ada").map((row) => row.id), ["a"]);
  assert.deepEqual(visibleTickets(rows, "", true, "").map((row) => row.id), ["d", "e"]);
  assert.equal(visibleTickets(rows, "High", false, "").some((row) => row.id === "d"), false);
  assert.deepEqual(readHiddenPriorities(["High", "Invented", ""], ["High", "0"]), ["High"]);
  assert.deepEqual(togglePriority(["High"], "0", ["High", "0"]), ["High", "0"]);
  assert.deepEqual(visiblePriorities(["High", "0"], ["0"], false), ["High"]);
  assert.equal(activePriority("0", ["High"]), "");

  const copy = Object.keys(ROUND88_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND88_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "qkTitle"), "Quick links");
  assert.equal(crmv4Text("tr", "pgTitle"), ROUND88_COPY.tr.pgTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-quick-links/);
  assert.match(css, /\.c4-priority-glance/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round88.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes("ticketPriority"), false);
  assert.match(view, /\/api\/admin\/tickets\?take=40/);
  assert.match(view, /data-quick-links/);
  assert.match(view, /data-priority-glance/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "quicklinks"/);
  assert.match(app, /view === "prioglance"/);
  console.log("crmv4 round88 tests passed");
}

main();
