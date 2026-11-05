/**
 * Reminders and lead sources.
 * Run: npx tsx tests/crmv4-round92.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND92_COPY } from "../src/lib/crmv4/copy-round92";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeSource,
  addReminder,
  namedSources,
  readHiddenSources,
  readReminders,
  reminderText,
  sourceLines,
  sourceText,
  toggleSource,
  utcClock,
  visibleLeads,
  visibleReminders,
  visibleSources,
} from "../src/lib/crmv4/round92";

function main() {
  assert.equal(reminderText("  "), "");
  assert.equal(reminderText(" Call\nAda "), "Call Ada");
  assert.equal(utcClock(""), "");
  assert.equal(utcClock("14:30"), "14:30Z");
  assert.equal(utcClock("14:30Z"), "14:30Z");
  assert.equal(utcClock("25:00"), null);
  assert.equal(utcClock("2pm"), null);
  assert.equal(addReminder([], { id: "1", text: "   ", time: "", at: "t" }).length, 0);
  assert.equal(addReminder([], { id: "1", text: "Call Ada", time: "25:00", at: "t" }).length, 0);
  const saved = addReminder([], { id: "1", text: "Call Ada", time: "", at: "2026-11-05T10:00:00Z" });
  assert.equal(saved[0].time, "");
  const timed = addReminder(saved, { id: "2", text: "Call Ada", time: "14:30", at: "2026-11-05T11:00:00Z" });
  assert.equal(timed.length, 2);
  assert.equal(addReminder(timed, { id: "3", text: "Call Ada", time: "14:30", at: "t" }).length, 2);
  const pinned = timed.map((reminder) => (reminder.id === "1" ? { ...reminder, pinned: true } : reminder));
  assert.equal(visibleReminders(pinned, "", false)[0].id, "1");
  assert.equal(visibleReminders(pinned, "14:30", false)[0].id, "2");
  assert.equal(visibleReminders(pinned.map((reminder) => ({ ...reminder, hidden: reminder.id === "2" })), "", true)[0].time, "14:30Z");
  assert.deepEqual(readReminders([{ id: "9", text: "  ", time: "" }, { id: "1", text: "Call Ada", time: "99:00" }, { id: "2", text: "Call Ada", time: "" }]).map((reminder) => reminder.id), ["2"]);

  const rows = [
    { id: "a", label: "Ada", source: { campaign: " Spring ", affiliateA: "A1" } },
    { id: "b", label: "Bea", source: { campaign: "Spring" } },
    { id: "c", label: "Cid", source: { campaign: "", affiliateA: "Desk" } },
    { id: "d", label: "Dot", source: {} },
    { id: "e", label: "Eve", source: null },
  ];
  assert.equal(sourceText({ campaign: " Spring ", affiliateA: "A1" }), "Spring");
  assert.equal(sourceText({ campaign: "", affiliateA: "Desk" }), "Desk");
  assert.equal(sourceText({}), "");
  assert.deepEqual(sourceLines(rows), [
    { source: "", count: 2 },
    { source: "Desk", count: 1 },
    { source: "Spring", count: 2 },
  ]);
  assert.deepEqual(namedSources(rows), ["Desk", "Spring"]);
  assert.equal(namedSources([{ source: {} }]).includes("Direct"), false);
  assert.deepEqual(visibleLeads(rows, "Spring", false, "ada").map((row) => row.id), ["a"]);
  assert.deepEqual(visibleLeads(rows, "", true, "").map((row) => row.id), ["d", "e"]);
  assert.equal(visibleLeads(rows, "Desk", false, "").some((row) => row.id === "d"), false);
  assert.deepEqual(readHiddenSources(["Spring", "Invented", ""], ["Spring", "Desk"]), ["Spring"]);
  assert.deepEqual(toggleSource(["Spring"], "Desk", ["Spring", "Desk"]), ["Spring", "Desk"]);
  assert.deepEqual(visibleSources(["Spring", "Desk"], ["Desk"], false), ["Spring"]);
  assert.equal(activeSource("Desk", ["Spring"]), "");

  const copy = Object.keys(ROUND92_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND92_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "rmTitle"), "Reminder chips");
  assert.equal(crmv4Text("tr", "lsTitle"), ROUND92_COPY.tr.lsTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-reminder-chips/);
  assert.match(css, /\.c4-source-glance/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round92.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.match(view, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(view, /data-reminder-chips/);
  assert.match(view, /data-source-glance/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "reminders"/);
  assert.match(app, /view === "sourceglance"/);
  console.log("crmv4 round92 tests passed");
}

main();
