/**
 * CRM v3 round 31: customer record header and named lists.
 * Run: npx tsx tests/crmv3-round31.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { LISTS_AR, LISTS_DE, LISTS_EN, LISTS_RU, LISTS_TR } from "../src/lib/crmv3/copy-lists";
import { addList, applyList, countList, deleteList, emptyRules, initialsOf, listIsOpen, matchList, moveList, readLists, renameList } from "../src/lib/crmv3/lists";

const ROOT = path.resolve(__dirname, "..");

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
  assert.equal(applyList(rows, lists, "missing").length, 3);
  assert.equal(applyList(rows, [{ id: "a", name: "TR", rules }], "a").length, 1);
  assert.equal(readLists([{ name: "Kept", rules: { ftd: "maybe", kyc: "APPROVED" } }])[0].rules.ftd, "");
  assert.equal(readLists("no").length, 0);
  assert.equal(initialsOf("Mehmet Yılmaz"), "MY");
  assert.equal(initialsOf(""), "—");

  const keys = Object.keys(LISTS_EN).sort();
  assert.deepEqual(Object.keys(LISTS_TR).sort(), keys);
  assert.deepEqual(Object.keys(LISTS_DE).sort(), keys);
  assert.deepEqual(Object.keys(LISTS_RU).sort(), keys);
  assert.deepEqual(Object.keys(LISTS_AR).sort(), keys);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-record-head/);
  assert.match(css, /position:\s*sticky/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const lib = fs.readFileSync(path.join(ROOT, "src/lib/crmv3/lists.ts"), "utf8");
  assert.match(lib, /crmv3-smart-lists/);
  assert.equal(lib.includes("crmv4"), false);
  const page = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/record.tsx"), "utf8");
  assert.match(page, /LIST_KEY/);
  assert.match(page, /recReadingHint/);
  assert.match(page, /sumsByCurrency/);
  const customers = fs.readFileSync(path.join(ROOT, "src/components/crmv3/views/Customers.tsx"), "utf8");
  assert.match(customers, /RecordHead/);
  assert.match(customers, /ListDesk/);
  assert.match(customers, /applyList/);
  const nav = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/nav.tsx"), "utf8");
  assert.match(nav, /SmartMenu/);
  const tree = fs.readdirSync(path.join(ROOT, "src/components/crmv3"), { recursive: true }) as string[];
  for (const file of tree) {
    if (!String(file).endsWith(".tsx") && !String(file).endsWith(".ts")) continue;
    const src = fs.readFileSync(path.join(ROOT, "src/components/crmv3", String(file)), "utf8");
    assert.equal(src.includes("crmv4"), false, String(file));
  }

  console.log("crmv3 round31 tests passed");
}

main();
