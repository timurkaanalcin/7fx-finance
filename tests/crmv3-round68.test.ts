/**
 * CRM v3 duplicate groups and meeting bullets.
 * Run: npx tsx tests/crmv3-round68.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DUPE_AR, DUPE_DE, DUPE_EN, DUPE_RU, DUPE_TR } from "../src/lib/crmv3/copy-dupes";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import {
  DISMISS_KEY,
  PREP_KEY,
  addBullet,
  clearCustomer,
  duplicateGroups,
  emailKey,
  phoneKey,
  toggleId,
  visibleBullets,
} from "../src/lib/crmv3/dupes";

const ROOT = path.resolve(__dirname, "..");

function main() {
  assert.equal(emailKey(" Ada@Desk.com "), "ada@desk.com");
  assert.equal(phoneKey("+90 555 0100"), "905550100");
  assert.equal(phoneKey("   "), "");
  assert.equal(DISMISS_KEY, "crmv3-dupe-dismiss");
  assert.equal(PREP_KEY, "crmv3-meeting-prep");
  const people = [
    { id: "a", name: "Ada", email: "ada@desk.com", phone: "+90 555", balance: 10, currency: "EUR" },
    { id: "b", name: "Bea", email: "ADA@desk.com", phone: "", balance: 4, currency: "TRY" },
    { id: "c", name: "Cem", email: "cem@desk.com", phone: "90 555", balance: 3, currency: "" },
    { id: "d", name: "Den", email: "", phone: "", balance: 9, currency: "USD" },
  ];
  const groups = duplicateGroups(people, "", [], false);
  const email = groups.find((group) => group.kind === "email");
  const phone = groups.find((group) => group.kind === "phone");
  assert.equal(email?.people.length, 2);
  assert.equal(email?.lines.find((line) => line.currency === "EUR")?.amount, 10);
  assert.equal(email?.lines.find((line) => line.currency === "TRY")?.amount, 4);
  assert.equal(phone?.people.map((person) => person.id).join(","), "a,c");
  assert.equal(phone?.lines.find((line) => line.currency === "")?.amount, 3);
  assert.equal(groups.some((group) => group.people.some((person) => person.id === "d" && group.people.length > 1 && !person.email && !person.phone)), false);
  assert.equal(duplicateGroups(people, "bea", [], false).length, 0);
  const dismissed = toggleId([], email?.id || "");
  assert.equal(duplicateGroups(people, "", dismissed, false).some((group) => group.kind === "email"), false);
  assert.equal(duplicateGroups(people, "", dismissed, true)[0].kind, "email");

  assert.equal(addBullet([], { id: "b1", customerId: "a", body: "   ", at: "t" }).length, 0);
  assert.equal(addBullet([], { id: "b1", customerId: "", body: "Hello", at: "t" }).length, 0);
  const bullets = addBullet([], { id: "b1", customerId: "a", body: " Ask about the file ", at: "2026-11-05T10:00:00Z" });
  assert.equal(visibleBullets(bullets, "b", "").length, 0);
  assert.equal(visibleBullets(bullets, "a", "file")[0].body, "Ask about the file");
  assert.equal(clearCustomer(bullets, "a").length, 0);

  const copy = Object.keys(DUPE_EN).sort();
  assert.deepEqual(Object.keys(DUPE_TR).sort(), copy);
  assert.deepEqual(Object.keys(DUPE_DE).sort(), copy);
  assert.deepEqual(Object.keys(DUPE_RU).sort(), copy);
  assert.deepEqual(Object.keys(DUPE_AR).sort(), copy);
  assert.notEqual(DUPE_TR.dpTitle, DUPE_EN.dpTitle);
  assert.notEqual(DUPE_DE.mpHint, DUPE_EN.mpHint);
  assert.notEqual(DUPE_RU.dpPhone, DUPE_EN.dpPhone);
  assert.notEqual(DUPE_AR.mpBlank, DUPE_EN.mpBlank);
  assert.equal(crmv3Text("en", "dpTitle"), "Duplicate suspects");
  assert.equal(crmv3Text("tr", "mpTitle"), DUPE_TR.mpTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-dupe-dismiss", "tr"), "Gizlenen eşleşmeler");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "dupes"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "prep"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("dupes"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("prep"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "work" && (group.ids as readonly string[]).includes("dupes")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("prep")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-dupe-strip/);
  assert.match(css, /\.c3-prep-pad/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/dupes.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.equal(view.includes("sendJson"), false);
  assert.match(view, /data-dupe-strip/);
  assert.match(view, /data-prep-pad/);
  assert.match(view, /data-confirm/);
  const prep = view.slice(view.indexOf("export function MeetingPrep"));
  assert.equal(prep.includes("fetch("), false);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "dupes"/);
  assert.match(app, /view === "prep"/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round68 tests passed");
}

main();
