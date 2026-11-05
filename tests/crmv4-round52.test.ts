/**
 * Notice inbox and the customer tag board.
 * Run: npx tsx tests/crmv4-round52.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND52_COPY } from "../src/lib/crmv4/copy-round52";
import {
  attachTag,
  bodyPreview,
  currencyLabel,
  customerIdOf,
  detachTag,
  filterByTag,
  filterNotes,
  hiddenOnPage,
  kindKey,
  markShown,
  noteKinds,
  readIdList,
  readTagMap,
  sortNotes,
  storedRead,
  tagChips,
  toggleName,
  unreadCount,
} from "../src/lib/crmv4/round52";

const ID = "c1234567890abcdefghijklm";

function main() {
  const notes = [
    { id: "n1", kind: "chat", title: "Live support", body: `Ada (${ID}): hello`, href: `/izcrm/chat?user=${ID}`, readAt: null, createdAt: "2026-11-05T10:00:00Z" },
    { id: "n2", kind: "info", title: "Desk", body: "No person here", href: "/crmv4", readAt: "2026-11-05T09:00:00Z", createdAt: "2026-11-04T10:00:00Z" },
    { id: "n3", kind: "handoff", title: "Passed", body: "Waiting", href: `/crmv4/customers/${ID}`, createdAt: "2026-11-03T10:00:00Z" },
  ];
  assert.deepEqual(noteKinds(notes), ["chat", "handoff", "info"]);
  assert.equal(kindKey("chat"), "ibKindChat");
  assert.equal(kindKey("desk"), "");
  assert.equal(filterNotes(notes, "chat", "", false, []).length, 1);
  assert.equal(filterNotes(notes, "", "hello", false, []).length, 1);
  assert.equal(filterNotes(notes, "", "", true, ["n1"]).length, 2);
  assert.deepEqual(sortNotes(notes, true).map((row) => row.id), ["n1", "n2", "n3"]);
  assert.deepEqual(sortNotes(notes, false).map((row) => row.id), ["n3", "n2", "n1"]);
  const marked = markShown(["n2"], [{ id: "n1" }]);
  assert.deepEqual(marked, ["n2", "n1"]);
  assert.deepEqual(markShown(marked, [{ id: "n1" }]), marked);
  assert.equal(unreadCount(notes, marked), 1);
  assert.equal(customerIdOf(notes[0]), ID);
  assert.equal(customerIdOf(notes[2]), ID);
  assert.equal(customerIdOf(notes[1]), "");
  assert.equal(customerIdOf({ href: "/izcrm/chat?user=short" }), "");
  assert.equal(customerIdOf({ href: "javascript:alert(1)", body: "no" }), "");
  assert.equal(storedRead(notes[1]), true);
  assert.equal(storedRead(notes[0]), false);
  assert.equal(bodyPreview("  hello   there  ", 5), "hello");

  const local = readTagMap({ a: [" Gold ", "gold"], b: "nope", c: ["VIP"] });
  assert.deepEqual(local.a, ["Gold", "gold"]);
  const people = [
    { id: "a", name: "Ada", email: "ada@desk.test", currency: "TRY", tags: ["Gold"] },
    { id: "b", name: "Bea", email: "bea@desk.test", currency: "USD" },
    { id: "c", name: "Cy", account: { currency: "EUR" } },
  ];
  const withLocal = attachTag(local, "b", "VIP");
  assert.equal(withLocal.b.includes("VIP"), true);
  assert.equal(attachTag(withLocal, "b", "VIP"), withLocal);
  const chips = tagChips(people, withLocal, [], ["VIP"]);
  assert.equal(chips[0].name, "VIP");
  assert.equal(chips[0].pinned, true);
  assert.equal(chips.find((chip) => chip.name === "Gold")?.count, 1);
  const hidden = toggleName([], "Gold");
  assert.equal(tagChips(people, withLocal, hidden, ["VIP"]).some((chip) => chip.name === "Gold"), false);
  assert.deepEqual(hiddenOnPage(["Gold", "VIP"], hidden), ["Gold"]);
  assert.deepEqual(filterByTag(people, withLocal, "VIP", "").map((row) => row.id), ["b", "c"]);
  assert.deepEqual(filterByTag(people, withLocal, "VIP", "bea").map((row) => row.id), ["b"]);
  assert.equal(filterByTag(people, withLocal, "Missing", "").length, 0);
  assert.equal(currencyLabel(people[0]), "TRY");
  assert.equal(currencyLabel(people[2]), "EUR");
  assert.equal(detachTag(withLocal, "b", "VIP").b.includes("VIP"), false);
  assert.equal(detachTag(withLocal, "b", "nope"), withLocal);

  const copy = Object.keys(ROUND52_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND52_COPY[locale]).sort(), copy);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-notice-luxe/);
  assert.match(css, /\.c4-tags-luxe/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round52.tsx"), "utf8");
  const lib = fs.readFileSync(path.join(__dirname, "../src/lib/crmv4/round52.ts"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("PATCH"), false);
  assert.match(view, /data-notice-center/);
  assert.match(view, /data-tag-board/);
  assert.match(view, /storedRole/);
  assert.match(lib, /crmv4-inbox-local-read/);
  assert.match(lib, /crmv4-tags/);
  assert.match(view, /READ_KEY/);
  assert.match(view, /TAG_KEY/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "notices"/);
  assert.match(app, /view === "tags"/);
  assert.match(app, /NoticeCenter/);
  assert.match(app, /TagBoard/);
  console.log("crmv4 round52 tests passed");
}

main();
