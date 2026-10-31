/**
 * CRM v4 round 17 helpers.
 * Run: npx tsx tests/crmv4-round17.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  callCount,
  dayBucket,
  emailOk,
  filterFeed,
  formScore,
  lastContact,
  mergeFeed,
  missingFields,
  passwordHint,
  phoneShort,
  pinFirst,
  sameEntry,
  splitName,
} from "../src/lib/crmv4/round17";

function main() {
  const items = mergeFeed({
    notes: [{ id: "n1", body: "VIP", authorName: "Ada", createdAt: "2026-10-31T09:00:00Z" }],
    events: [{ id: "e1", kind: "SALE", path: "NEW", createdAt: "2026-10-30T09:00:00Z" }],
    calls: [{ id: "c1", at: "2026-10-31T10:00:00Z", outcome: "reached", minutes: 4, next: "2026-11-01", note: "local" }],
    money: [{ id: "m1", type: "DEPOSIT", amount: 100, currency: "USD", createdAt: "2026-10-29T09:00:00Z", comment: "" }],
  });
  assert.equal(items[0].kind, "call");
  assert.equal(items.length, 4);
  assert.equal(filterFeed(items, "money", "").length, 1);
  assert.equal(filterFeed(items, "", "vip").length, 1);
  assert.equal(dayBucket("2026-10-31T10:00:00Z", "2026-10-31"), "today");
  assert.equal(dayBucket("2026-10-29T09:00:00Z", "2026-10-31"), "earlier");
  assert.equal(callCount(items), 1);
  assert.equal(lastContact(items).startsWith("2026-10-31T10"), true);
  assert.equal(pinFirst(items, ["money-m1"])[0].id, "money-m1");
  assert.equal(emailOk("ada@x.com"), true);
  assert.equal(emailOk("ada"), false);
  assert.equal(emailOk(""), true);
  assert.equal(phoneShort("123"), true);
  assert.equal(phoneShort("+90 555 000 1122"), false);
  assert.deepEqual(missingFields({ name: "A", email: "", phone: "", country: "TR" }), ["email", "phone"]);
  assert.equal(formScore({ name: "A", email: "a@b.co", phone: "5550001", country: "TR" }), 100);
  assert.equal(sameEntry({ name: "A", email: "", phone: "", country: "" }, { name: "A", email: "", phone: "", country: "" }), true);
  assert.deepEqual(splitName("Ada Lovelace"), { first: "Ada", last: "Lovelace" });
  assert.equal(passwordHint("short"), "short");
  assert.equal(passwordHint("longenough"), "ok");
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-feed-luxe/);
  assert.match(css, /\.c4-entry-luxe/);
  assert.match(css, /max-height:\s*78dvh/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  console.log("crmv4 round17 tests passed");
}

main();
