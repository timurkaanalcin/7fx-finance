/**
 * Duplicate groups and meeting bullets.
 * Run: npx tsx tests/crmv4-round68.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND68_COPY } from "../src/lib/crmv4/copy-round68";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  addBullet,
  clearCustomer,
  duplicateGroups,
  emailKey,
  phoneKey,
  toggleId,
  visibleBullets,
} from "../src/lib/crmv4/round68";

function main() {
  assert.equal(emailKey(" Ada@Desk.com "), "ada@desk.com");
  assert.equal(phoneKey("+90 555 0100"), "905550100");
  assert.equal(phoneKey("   "), "");
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

  const copy = Object.keys(ROUND68_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND68_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "dpTitle"), "Duplicate suspects");
  assert.equal(crmv4Text("tr", "mpTitle"), ROUND68_COPY.tr.mpTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-dupe-strip/);
  assert.match(css, /\.c4-prep-pad/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round68.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.match(view, /data-dupe-strip/);
  assert.match(view, /data-prep-pad/);
  assert.match(view, /data-confirm/);
  const prep = view.slice(view.indexOf("export function MeetingPrep"));
  assert.equal(prep.includes("fetch("), false);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "dupes"/);
  assert.match(app, /view === "prep"/);
  console.log("crmv4 round68 tests passed");
}

main();
