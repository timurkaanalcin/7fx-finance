/**
 * CRM v3 notice inbox and customer tag board.
 * Run: npx tsx tests/crmv3-round52.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { BOARD52_AR, BOARD52_DE, BOARD52_EN, BOARD52_RU, BOARD52_TR } from "../src/lib/crmv3/copy-board52";
import {
  HIDE_KEY,
  PIN_KEY,
  READ_KEY,
  TAG_KEY,
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
} from "../src/lib/crmv3/inbox-board";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";

const ROOT = path.resolve(__dirname, "..");
const ID = "c1234567890abcdefghijklm";

function main() {
  const notes = [
    { id: "n1", kind: "chat", title: "Live support", body: `Ada (${ID}): hello`, href: `/izcrm/chat?user=${ID}`, readAt: null, createdAt: "2026-11-05T10:00:00Z" },
    { id: "n2", kind: "info", title: "Desk", body: "No person here", href: "/crmv3", readAt: "2026-11-05T09:00:00Z", createdAt: "2026-11-04T10:00:00Z" },
    { id: "n3", kind: "handoff", title: "Passed", body: "Waiting", href: `/crmv3/customers/${ID}`, createdAt: "2026-11-03T10:00:00Z" },
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
  assert.equal(READ_KEY, "crmv3-inbox-local-read");
  assert.equal(TAG_KEY, "crmv3-tags");
  assert.equal(PIN_KEY, "crmv3-tag-board-pins");
  assert.equal(HIDE_KEY, "crmv3-tag-board-hidden");

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
  assert.equal(readIdList(["a", "a", ""]).length, 1);

  const copy = Object.keys(BOARD52_EN).sort();
  assert.deepEqual(Object.keys(BOARD52_TR).sort(), copy);
  assert.deepEqual(Object.keys(BOARD52_DE).sort(), copy);
  assert.deepEqual(Object.keys(BOARD52_RU).sort(), copy);
  assert.deepEqual(Object.keys(BOARD52_AR).sort(), copy);
  assert.notEqual(BOARD52_TR.ibTitle, BOARD52_EN.ibTitle);
  assert.notEqual(BOARD52_DE.tgHint, BOARD52_EN.tgHint);
  assert.notEqual(BOARD52_RU.tgViewer, BOARD52_EN.tgViewer);
  assert.notEqual(BOARD52_AR.ibEmpty, BOARD52_EN.ibEmpty);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-inbox-local-read", "tr"), "Bildirim okundu");
  assert.equal(keyTitle("crmv3-tag-board-pins", "de"), "Angeheftete Marken");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "notices"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "tags"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("notices"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("tags"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "work" && (group.ids as readonly string[]).includes("notices")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "work" && (group.ids as readonly string[]).includes("tags")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-notice-center/);
  assert.match(css, /\.c3-tag-board/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/inbox-board.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("PATCH"), false);
  assert.equal(view.includes("crmv4"), false);
  assert.match(view, /data-notice-center/);
  assert.match(view, /data-tag-board/);
  assert.match(view, /READ_KEY/);
  assert.match(view, /TAG_KEY/);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "notices"/);
  assert.match(app, /view === "tags"/);
  assert.match(app, /NoticeCenter/);
  assert.match(app, /TagBoard/);
  assert.match(app, /NoticeDesk/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round52 tests passed");
}

main();
