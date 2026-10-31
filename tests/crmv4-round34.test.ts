/**
 * CRM v4 round 34 helpers.
 * Run: npx tsx tests/crmv4-round34.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND34_COPY } from "../src/lib/crmv4/copy-round34";
import { addTask, deleteTask, insertMention, mentionOpen, mentionQuery, paintMentions, readCols, readTasks, setDense, toggleCol, toggleTask } from "../src/lib/crmv4/round34";

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
  assert.equal(mentionOpen("hello @ad"), true);
  assert.equal(mentionQuery("hello @ad"), "ad");
  assert.equal(insertMention("hello @ad", "Ada"), "hello @Ada ");
  const parts = paintMentions("See @Ada today", ["Ada"]);
  assert.equal(parts.some((part) => part.mention && part.text === "@Ada"), true);
  const copy = Object.keys(ROUND34_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND34_COPY[locale]).sort(), copy);
  const lib = fs.readFileSync(path.join(__dirname, "../src/lib/crmv4/round34.ts"), "utf8");
  assert.match(lib, /crmv4-columns/);
  assert.match(lib, /crmv4-tasks/);
  const page = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round34.tsx"), "utf8");
  assert.match(page, /COL_KEY/);
  assert.match(page, /TASK_KEY/);
  assert.equal(page.includes("crmv4-customer-columns"), false);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-lux-desk thead th/);
  assert.match(css, /position:\s*sticky/);
  assert.match(css, /#7a5e30/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  console.log("crmv4 round34 tests passed");
}

main();
