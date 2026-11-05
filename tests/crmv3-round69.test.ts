/**
 * CRM v3 referral source counts and the local win/loss log.
 * Run: npx tsx tests/crmv3-round69.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { MIX_AR, MIX_DE, MIX_EN, MIX_RU, MIX_TR } from "../src/lib/crmv3/copy-mix";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { LOG_KEY, PIN_KEY, addNote, mixCount, setArchived, sourceGroups, sourceValue, toggleId, toggleNotePin, visibleNotes } from "../src/lib/crmv3/mix";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";

const ROOT = path.resolve(__dirname, "..");

function main() {
  const people = [
    { id: "a", name: "Ada", email: "ada@desk.com", affiliateA: " Desk ", affiliateB: "", referralCodeUsed: "R1", campaign: "Spring" },
    { id: "b", name: "Bea", email: "bea@desk.com", affiliateA: "Desk", affiliateB: "Other", referralCodeUsed: "", campaign: "" },
    { id: "c", name: "Cem", email: "cem@desk.com", affiliateA: "", affiliateB: "", referralCodeUsed: "", campaign: "Spring" },
  ];
  assert.equal(PIN_KEY, "crmv3-referral-pins");
  assert.equal(LOG_KEY, "crmv3-winloss-log");
  assert.equal(sourceValue(people[0], "affiliateA"), "Desk");
  const groups = sourceGroups(people, "affiliateA", "", []);
  assert.equal(mixCount(groups), people.length);
  const desk = groups.find((group) => group.value === "Desk");
  const blank = groups.find((group) => group.value === "");
  assert.equal(desk?.count, 2);
  assert.equal(blank?.count, 1);
  assert.equal("amount" in (desk || {}), false);
  assert.equal(JSON.stringify(groups).includes("EUR"), false);
  assert.equal(JSON.stringify(groups).includes("TRY"), false);
  const campaign = sourceGroups(people, "campaign", "", []);
  assert.equal(campaign.find((group) => group.value === "Spring")?.count, 2);
  assert.equal(sourceGroups(people, "affiliateA", "cem", []).every((group) => group.value === ""), true);
  const pinned = toggleId([], desk?.id || "");
  assert.equal(sourceGroups(people, "affiliateA", "", pinned)[0].id, desk?.id);

  assert.equal(addNote([], { id: "n1", kind: "win", body: "   ", at: "t" }).length, 0);
  assert.equal(addNote([], { id: "n1", kind: "other", body: "Closed", at: "t" }).length, 0);
  const notes = addNote([], { id: "n1", kind: "loss", body: " Lead went quiet ", customerId: "", at: "2026-11-05T10:00:00Z" });
  assert.equal(notes[0].customerId, "");
  assert.equal(notes[0].kind, "loss");
  const linked = addNote(notes, { id: "n2", kind: "win", body: "File closed", customerId: "a", at: "2026-11-05T11:00:00Z" });
  assert.equal(visibleNotes(linked, "win", "ada", false, { a: "Ada" })[0].id, "n2");
  assert.equal(visibleNotes(linked, "loss", "", false, {}).length, 1);
  const archived = setArchived(linked, "n2", true);
  assert.equal(visibleNotes(archived, "", "", false, {}).some((note) => note.id === "n2"), false);
  assert.equal(visibleNotes(archived, "", "", true, {})[0].id, "n2");
  assert.equal(toggleNotePin(linked, "n1").some((note) => note.id === "n1" && note.pinned), true);

  const copy = Object.keys(MIX_EN).sort();
  assert.deepEqual(Object.keys(MIX_TR).sort(), copy);
  assert.deepEqual(Object.keys(MIX_DE).sort(), copy);
  assert.deepEqual(Object.keys(MIX_RU).sort(), copy);
  assert.deepEqual(Object.keys(MIX_AR).sort(), copy);
  assert.notEqual(MIX_TR.sxTitle, MIX_EN.sxTitle);
  assert.notEqual(MIX_DE.wnHint, MIX_EN.wnHint);
  assert.notEqual(MIX_RU.sxCampaign, MIX_EN.sxCampaign);
  assert.notEqual(MIX_AR.wnBlank, MIX_EN.wnBlank);
  assert.equal(crmv3Text("en", "sxTitle"), "Referral source mix");
  assert.equal(crmv3Text("tr", "wnTitle"), MIX_TR.wnTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-referral-pins", "de"), "Angeheftete Quellen");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "referrals"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "winloss"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("referrals"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("winloss"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "work" && (group.ids as readonly string[]).includes("referrals")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("winloss")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-source-mix/);
  assert.match(css, /\.c3-win-log/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/mix.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("balance"), false);
  assert.match(view, /data-source-mix/);
  assert.match(view, /data-win-log/);
  assert.match(view, /data-confirm/);
  const log = view.slice(view.indexOf("export function WinLog"));
  assert.equal(log.includes("fetch("), false);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "referrals"/);
  assert.match(app, /view === "winloss"/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round69 tests passed");
}

main();
