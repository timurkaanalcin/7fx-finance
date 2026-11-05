/**
 * Courier notes and IB countries.
 * Run: npx tsx tests/crmv4-round120.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND120_COPY } from "../src/lib/crmv4/copy-round120";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  COUNTRY_FIELDS,
  PARTNER_FIELDS,
  activeCountry,
  addNote,
  countryLines,
  countryText,
  namedCountries,
  noteText,
  partnerText,
  readHiddenCountries,
  readNotes,
  resetNotes,
  setNoteHidden,
  spotLabel,
  toggleCountry,
  toggleNotePin,
  visibleCountries,
  visibleNotes,
  visiblePartners,
} from "../src/lib/crmv4/round120";

function main() {
  assert.equal(noteText("  Drop\nA  "), "Drop A");
  assert.equal(noteText("   "), "");
  assert.equal(noteText("x".repeat(140)).length, 120);
  assert.equal(spotLabel("  Desk 2  "), "Desk 2");
  assert.equal(spotLabel("   "), "");
  assert.equal(spotLabel("y".repeat(50)).length, 40);
  assert.deepEqual(readNotes([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Dropped", spot: "  ", pinned: 1 }, "nope"]), [
    { id: "2", text: "Dropped", spot: "", pinned: false, hidden: false },
  ]);
  const saved = addNote([], { id: "a", text: " Front desk ", spot: " Locker 3 " });
  assert.deepEqual(saved, [{ id: "a", text: "Front desk", spot: "Locker 3", pinned: false, hidden: false }]);
  assert.equal(addNote(saved, { id: "b", text: "  " }).length, 1);
  assert.equal(addNote(saved, { id: "c", text: "Front desk" }).length, 1);
  assert.equal(addNote(saved, { id: "a", text: "Other drop" }).length, 1);
  const pinned = toggleNotePin(saved, "a");
  assert.equal(pinned[0].pinned, true);
  const hidden = setNoteHidden(pinned, "a", true);
  assert.equal(hidden[0].hidden, true);
  assert.deepEqual(visibleNotes(pinned, false, "front").map((note) => note.id), ["a"]);
  assert.deepEqual(visibleNotes(pinned, false, "locker"), []);
  assert.deepEqual(visibleNotes(hidden, false, ""), []);
  assert.deepEqual(visibleNotes(hidden, true, "").map((note) => note.id), ["a"]);
  assert.deepEqual(resetNotes(), []);
  const many = Array.from({ length: 41 }, (_, index) => ({ id: `n${index}`, text: `Note ${index}`, spot: "" }));
  assert.equal(readNotes(many).length, 40);

  assert.equal(partnerText({ affiliateA: "  WEB " }), "WEB");
  assert.equal(partnerText({ affiliateA: "  ", affiliateB: "DESK" }), "DESK");
  assert.equal(partnerText({ campaign: "ADS" } as never), "");
  assert.equal(partnerText(null), "");
  assert.equal(countryText(" TR "), "TR");
  assert.equal(countryText({ country: "  ", registrationCountry: " DE " }), "DE");
  assert.equal(countryText({ region: "Istanbul" } as never), "");
  assert.equal(countryText(1 as never), "");
  assert.equal(countryText({ country: 90 } as never), "");
  assert.deepEqual(COUNTRY_FIELDS.includes("region" as never), false);
  assert.deepEqual(PARTNER_FIELDS.includes("campaign" as never), false);
  const rows = [
    { id: "u1", label: "Ada", country: "TR" },
    { id: "u2", label: "Bea", country: { registrationCountry: "DE" } },
    { id: "u3", label: "Cid", country: "TR" },
    { id: "u4", label: "Dot", country: "" },
    { id: "u5", label: "Eve", country: { region: "Marmara" } as never },
  ];
  assert.deepEqual(countryLines(rows), [
    { country: "", count: 2 },
    { country: "DE", count: 1 },
    { country: "TR", count: 2 },
  ]);
  assert.deepEqual(namedCountries(rows), ["DE", "TR"]);
  assert.deepEqual(visiblePartners(rows, "TR", false, "ada").map((row) => row.id), ["u1"]);
  assert.deepEqual(visiblePartners(rows, "", true, "").map((row) => row.id), ["u4", "u5"]);
  assert.deepEqual(visiblePartners(rows, "TR", false, "100"), []);
  assert.deepEqual(readHiddenCountries(["TR", "NEW", ""], ["TR", "DE"]), ["TR"]);
  assert.deepEqual(toggleCountry(["TR"], "NEW", ["TR"]), ["TR"]);
  assert.deepEqual(visibleCountries(["TR", "DE"], ["DE"], false), ["TR"]);
  assert.equal(activeCountry("DE", ["TR"]), "");
  assert.equal(countryLines(rows).every((line) => !("amount" in line) && !("currency" in line)), true);

  const copy = Object.keys(ROUND120_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND120_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "crrTitle"), "Courier notes");
  assert.equal(crmv4Text("tr", "ibgTitle"), ROUND120_COPY.tr.ibgTitle);
  assert.equal(crmv4Text("de", "crrSpot"), ROUND120_COPY.de.crrSpot);
  assert.equal(crmv4Text("ru", "ibgBlank"), ROUND120_COPY.ru.ibgBlank);
  assert.equal(crmv4Text("ar", "ibgBoard"), ROUND120_COPY.ar.ibgBoard);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-courier/);
  assert.match(css, /\.c4-ib-ctry/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round120.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("fetch("), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes("currency"), false);
  assert.equal(view.includes("deposit"), false);
  assert.equal(view.includes("region"), false);
  assert.match(view, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(view, /data-courier/);
  assert.match(view, /data-ib-ctry/);
  assert.match(view, /data-logo="mono"/);
  assert.match(view, /ibpay/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "courier"/);
  assert.match(app, /view === "ibctry"/);
  console.log("crmv4 round120 tests passed");
}

main();
