/**
 * CRM v4 round 31 helpers.
 * Run: npx tsx tests/crmv4-round31.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND31_COPY } from "../src/lib/crmv4/copy-round31";
import { addList, countList, deleteList, emptyRules, initialsOf, listIsOpen, matchList, moveList, readLists, renameList } from "../src/lib/crmv4/round31";

function main() {
  const rules = { ...emptyRules(), country: "TR", ftd: "yes" as const };
  const rows = [
    { country: "TR", ftd: true, documentsStatus: "APPROVED", saleStatus: "NEW" },
    { country: "DE", ftd: true, documentsStatus: "NONE", saleStatus: "NEW" },
    { country: "TR", ftd: false, documentsStatus: "APPROVED", saleStatus: "NEW" },
  ];
  assert.equal(countList(rows, rules), 1);
  assert.equal(matchList(rows[0], emptyRules()), true);
  assert.equal(listIsOpen(emptyRules()), true);
  assert.equal(listIsOpen(rules), false);
  let lists = addList([], "  ", rules);
  assert.equal(lists.length, 0);
  lists = addList([], "Turkey first", rules);
  lists = addList(lists, "Open book", emptyRules());
  assert.equal(lists[0].name, "Turkey first");
  lists = renameList(lists, lists[0].id, "TR FTD");
  assert.equal(lists[0].name, "TR FTD");
  lists = moveList(lists, lists[0].id, 1);
  assert.equal(lists[0].name, "Open book");
  assert.equal(moveList(lists, lists[0].id, -1), lists);
  lists = deleteList(lists, lists[1].id);
  assert.equal(lists.length, 1);
  assert.equal(readLists([{ name: "Kept", rules: { ftd: "maybe", kyc: "APPROVED" } }])[0].rules.ftd, "");
  assert.equal(readLists("no").length, 0);
  assert.equal(initialsOf("Mehmet Yılmaz"), "MY");
  assert.equal(initialsOf(""), "—");
  const keys = Object.keys(ROUND31_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND31_COPY[locale]).sort(), keys);
  }
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-record-head/);
  assert.match(css, /position:\s*sticky/);
  assert.match(css, /--c4-accent-ink:\s*#7a5e30/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const lib = fs.readFileSync(path.join(__dirname, "../src/lib/crmv4/round31.ts"), "utf8");
  assert.match(lib, /crmv4-smart-lists/);
  const page = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round31.tsx"), "utf8");
  assert.match(page, /LIST_KEY/);
  assert.equal(page.includes("crmv4-customer-presets"), false);
  console.log("crmv4 round31 tests passed");
}

main();
