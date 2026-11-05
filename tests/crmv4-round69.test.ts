/**
 * Source counts and the local win/loss log.
 * Run: npx tsx tests/crmv4-round69.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND69_COPY } from "../src/lib/crmv4/copy-round69";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  addNote,
  mixCount,
  setArchived,
  sourceGroups,
  sourceValue,
  toggleId,
  toggleNotePin,
  visibleNotes,
} from "../src/lib/crmv4/round69";

function main() {
  const people = [
    { id: "a", name: "Ada", email: "ada@desk.com", affiliateA: " Desk ", affiliateB: "", referralCodeUsed: "R1", campaign: "Spring", balance: 40, currency: "EUR" },
    { id: "b", name: "Bea", email: "bea@desk.com", affiliateA: "Desk", affiliateB: "Other", referralCodeUsed: "", campaign: "", balance: 9, currency: "TRY" },
    { id: "c", name: "Cem", email: "cem@desk.com", affiliateA: "", affiliateB: "", referralCodeUsed: "", campaign: "Spring", balance: 3, currency: "USD" },
  ];
  assert.equal(sourceValue(people[0], "affiliateA"), "Desk");
  const rows = people as Parameters<typeof sourceGroups>[0];
  const groups = sourceGroups(rows, "affiliateA", "", []);
  assert.equal(mixCount(groups), people.length);
  const desk = groups.find((group) => group.value === "Desk");
  const blank = groups.find((group) => group.value === "");
  assert.equal(desk?.count, 2);
  assert.equal(blank?.count, 1);
  assert.equal("amount" in (desk || {}), false);
  assert.equal(JSON.stringify(groups).includes("EUR"), false);
  assert.equal(JSON.stringify(groups).includes("TRY"), false);
  const campaign = sourceGroups(rows, "campaign", "", []);
  assert.equal(campaign.find((group) => group.value === "Spring")?.count, 2);
  assert.equal(sourceGroups(rows, "affiliateA", "cem", []).every((group) => group.value === ""), true);
  const pinned = toggleId([], desk?.id || "");
  assert.equal(sourceGroups(rows, "affiliateA", "", pinned)[0].id, desk?.id);

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
  assert.equal(toggleNotePin(linked, "n1")[1].pinned || toggleNotePin(linked, "n1")[0].pinned, true);

  const copy = Object.keys(ROUND69_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND69_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "sxTitle"), "Referral source mix");
  assert.equal(crmv4Text("tr", "wnTitle"), ROUND69_COPY.tr.wnTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-source-mix/);
  assert.match(css, /\.c4-win-log/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round69.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("balance"), false);
  assert.match(view, /data-source-mix/);
  assert.match(view, /data-win-log/);
  assert.match(view, /data-confirm/);
  const log = view.slice(view.indexOf("export function WinLog"));
  assert.equal(log.includes("fetch("), false);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "sources"/);
  assert.match(app, /view === "winlog"/);
  console.log("crmv4 round69 tests passed");
}

main();
