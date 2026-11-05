/**
 * Contact labels and balance zero counts.
 * Run: npx tsx tests/crmv4-round91.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND91_COPY } from "../src/lib/crmv4/copy-round91";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeKind,
  addContact,
  amountKind,
  contactLabel,
  kindLines,
  loadedAmount,
  loadedCurrency,
  namedKinds,
  readContacts,
  readHiddenKinds,
  toggleKind,
  visibleBalances,
  visibleContacts,
  visibleKinds,
} from "../src/lib/crmv4/round91";

function main() {
  assert.equal(contactLabel("  "), "");
  assert.equal(contactLabel(" Ada\ndesk "), "Ada desk");
  assert.equal(contactLabel("x".repeat(50)).length, 40);
  assert.equal(addContact([], { id: "1", label: "   ", at: "t" }).length, 0);
  const saved = addContact([], { id: "1", label: "Ada desk", at: "2026-11-05T10:00:00Z" });
  assert.equal(addContact(saved, { id: "2", label: "Ada desk", at: "t" }).length, 1);
  const later = addContact(saved, { id: "2", label: "Night line", at: "2026-11-05T11:00:00Z" });
  const pinned = later.map((contact) => (contact.id === "1" ? { ...contact, pinned: true } : contact));
  assert.equal(visibleContacts(pinned, "", false)[0].id, "1");
  assert.equal(visibleContacts(pinned, "night", false)[0].label, "Night line");
  assert.equal(visibleContacts(pinned.map((contact) => ({ ...contact, hidden: contact.id === "2" })), "", true)[0].label, "Night line");
  assert.deepEqual(readContacts([{ id: "9", label: "  " }, { id: "1", label: "Ada desk" }, { id: "3", label: "Ada desk" }]).map((contact) => contact.id), ["1"]);

  assert.equal(loadedAmount({ balance: null, account: { balance: 12 } }), 12);
  assert.equal(loadedAmount({ balance: 0 }), 0);
  assert.equal(loadedAmount({ balance: "nope", account: { balance: 4 } }), null);
  assert.equal(loadedAmount({}), null);
  assert.equal(amountKind(null), "");
  assert.equal(amountKind(0), "zero");
  assert.equal(amountKind(-2), "nonzero");
  assert.equal(loadedCurrency({ currency: "usd" }), "USD");
  assert.equal(loadedCurrency({ currency: "", account: { currency: "eur" } }), "EUR");
  assert.equal(loadedCurrency({}), "");
  const rows = [
    { id: "a", label: "Ada", balance: 0, currency: "USD" },
    { id: "b", label: "Bea", balance: 0, currency: "EUR" },
    { id: "c", label: "Cid", balance: 15, currency: "USD" },
    { id: "d", label: "Dot", balance: null },
    { id: "e", label: "Eve" },
  ];
  assert.deepEqual(kindLines(rows), [
    { kind: "", count: 2 },
    { kind: "nonzero", count: 1 },
    { kind: "zero", count: 2 },
  ]);
  assert.deepEqual(namedKinds(rows), ["nonzero", "zero"]);
  assert.equal(namedKinds([{ balance: null }]).length, 0);
  assert.deepEqual(visibleBalances(rows, "zero", false, "ada").map((row) => row.id), ["a"]);
  assert.deepEqual(visibleBalances(rows, "", true, "").map((row) => row.id), ["d", "e"]);
  assert.equal(visibleBalances(rows, "nonzero", false, "").some((row) => row.id === "a"), false);
  assert.deepEqual(readHiddenKinds(["zero", "invented", ""], ["zero", "nonzero"]), ["zero"]);
  assert.deepEqual(toggleKind(["zero"], "nonzero", ["zero", "nonzero"]), ["zero", "nonzero"]);
  assert.deepEqual(visibleKinds(["zero", "nonzero"], ["nonzero"], false), ["zero"]);
  assert.equal(activeKind("nonzero", ["zero"]), "");

  const copy = Object.keys(ROUND91_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND91_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "ctTitle"), "Contact chips");
  assert.equal(crmv4Text("tr", "bzTitle"), ROUND91_COPY.tr.bzTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-contact-chips/);
  assert.match(css, /\.c4-zero-glance/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round91.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("?? 0"), false);
  assert.equal(view.includes('?? "USD"'), false);
  assert.equal(view.includes("singleTotal"), false);
  assert.match(view, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(view, /data-contact-chips/);
  assert.match(view, /data-zero-glance/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "contacts"/);
  assert.match(app, /view === "zeroglance"/);
  console.log("crmv4 round91 tests passed");
}

main();
