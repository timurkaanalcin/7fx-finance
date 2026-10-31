/**
 * CRM v3 round 34: dense customer list, notes, and local tasks.
 * Run: npx tsx tests/crmv3-round34.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { TABLE_AR, TABLE_DE, TABLE_EN, TABLE_RU, TABLE_TR } from "../src/lib/crmv3/copy-table";
import { addTask, deleteTask, insertMention, mentionOpen, mentionQuery, paintMentions, readCols, readTasks, setDense, toggleCol, togglePinList, toggleTask } from "../src/lib/crmv3/table";

const ROOT = path.resolve(__dirname, "..");

function main() {
  const pref = readCols({ columns: ["customer", "nope"], dense: false });
  assert.deepEqual(pref.columns, ["customer"]);
  assert.equal(toggleCol(pref, "country").columns.includes("country"), true);
  assert.deepEqual(toggleCol({ columns: ["balance"], dense: false }, "balance").columns, ["balance"]);
  assert.equal(setDense(pref, true).dense, true);
  let tasks = addTask({}, "c1", "  ");
  assert.equal(Object.keys(tasks).length, 0);
  tasks = addTask({}, "c1", "Call back");
  const id = tasks.c1[0].id;
  tasks = toggleTask(tasks, "c1", id);
  assert.equal(tasks.c1[0].done, true);
  tasks = deleteTask(tasks, "c1", id);
  assert.equal("c1" in tasks, false);
  assert.equal(readTasks({ c1: [{ text: "Keep", done: 1 }] }).c1[0].done, false);
  assert.deepEqual(togglePinList(["a"], "b"), ["b", "a"]);
  assert.deepEqual(togglePinList(["a", "b"], "a"), ["b"]);
  assert.equal(mentionOpen("hello @ad"), true);
  assert.equal(mentionQuery("hello @ad"), "ad");
  assert.equal(insertMention("hello @ad", "Ada"), "hello @Ada ");
  const parts = paintMentions("See @Ada today", ["Ada"]);
  assert.equal(parts.some((part) => part.mention && part.text === "@Ada"), true);
  const copy = Object.keys(TABLE_EN).sort();
  assert.deepEqual(Object.keys(TABLE_TR).sort(), copy);
  assert.deepEqual(Object.keys(TABLE_DE).sort(), copy);
  assert.deepEqual(Object.keys(TABLE_RU).sort(), copy);
  assert.deepEqual(Object.keys(TABLE_AR).sort(), copy);
  const lib = fs.readFileSync(path.join(ROOT, "src/lib/crmv3/table.ts"), "utf8");
  assert.match(lib, /crmv3-columns/);
  assert.match(lib, /crmv3-tasks/);
  assert.match(lib, /crmv3-note-pins/);
  assert.equal(lib.includes("crmv4"), false);
  const page = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/table.tsx"), "utf8");
  assert.match(page, /COL_KEY/);
  assert.match(page, /TASK_KEY/);
  assert.match(page, /addNote/);
  assert.equal(page.includes("crmv4-customer-columns"), false);
  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-lux-desk thead th/);
  assert.match(css, /position:\s*sticky/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const customers = fs.readFileSync(path.join(ROOT, "src/components/crmv3/views/Customers.tsx"), "utf8");
  assert.match(customers, /DenseList/);
  assert.match(customers, /NoteStudio/);
  const tree = fs.readdirSync(path.join(ROOT, "src/components/crmv3"), { recursive: true }) as string[];
  for (const file of tree) {
    if (!String(file).endsWith(".tsx") && !String(file).endsWith(".ts")) continue;
    const src = fs.readFileSync(path.join(ROOT, "src/components/crmv3", String(file)), "utf8");
    assert.equal(src.includes("crmv4"), false, String(file));
  }
  console.log("crmv3 round34 tests passed");
}

main();
