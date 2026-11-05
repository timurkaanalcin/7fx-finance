/**
 * CRM v3 reminder chips and lead source glance.
 * Run: npx tsx tests/crmv3-round92.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { RM_AR, RM_DE, RM_EN, RM_RU, RM_TR } from "../src/lib/crmv3/copy-remind";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import {
  REMIND_KEY,
  SOURCE_KEY,
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
} from "../src/lib/crmv3/remind";

const ROOT = path.resolve(__dirname, "..");

function main() {
  assert.equal(REMIND_KEY, "crmv3-reminders");
  assert.equal(SOURCE_KEY, "crmv3-lead-source-hide");
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

  const copy = Object.keys(RM_EN).sort();
  assert.deepEqual(Object.keys(RM_TR).sort(), copy);
  assert.deepEqual(Object.keys(RM_DE).sort(), copy);
  assert.deepEqual(Object.keys(RM_RU).sort(), copy);
  assert.deepEqual(Object.keys(RM_AR).sort(), copy);
  assert.notEqual(RM_TR.rmTitle, RM_EN.rmTitle);
  assert.notEqual(RM_DE.lsHint, RM_EN.lsHint);
  assert.notEqual(RM_RU.lsBlank, RM_EN.lsBlank);
  assert.notEqual(RM_AR.rmClock, RM_EN.rmClock);
  assert.equal(crmv3Text("en", "rmTitle"), "Reminder chips");
  assert.equal(crmv3Text("tr", "lsTitle"), RM_TR.lsTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-reminders", "de"), "Erinnerungschips");
  assert.equal(keyTitle("crmv3-lead-source-hide", "tr"), "Kaynak bakışı");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "reminders"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "sourceglance"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("reminders"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("sourceglance"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("reminders")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "work" && (group.ids as readonly string[]).includes("sourceglance")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-reminder-chips/);
  assert.match(css, /\.c3-source-glance/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/remind.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.match(view, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(view, /data-reminder-chips/);
  assert.match(view, /data-source-glance/);
  assert.match(view, /REMIND_KEY/);
  assert.match(view, /SOURCE_KEY/);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "reminders"/);
  assert.match(app, /view === "sourceglance"/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round92 tests passed");
}

main();
