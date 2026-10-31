/**
 * CRM v4 round 41 helpers.
 * Run: npx tsx tests/crmv4-round41.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND41_COPY } from "../src/lib/crmv4/copy-round41";
import {
  boardStage,
  cardHit,
  countStages,
  hiddenCount,
  matchTopics,
  openTips,
  parseDensity,
  parseStageFilter,
  questionOpensSheet,
  saveStage,
  stageTotal,
  visibleStages,
} from "../src/lib/crmv4/round41";

function main() {
  assert.equal(boardStage(""), "NEW");
  assert.equal(boardStage("DEPOSITED"), "DEPOSITED");
  assert.equal(boardStage("INV_TRASH"), "OTHER");
  const counts = countStages(["NEW", "", "INV_TRASH", "DEPOSITED"]);
  assert.equal(stageTotal(counts), 4);
  assert.equal(counts.find((row) => row.stage === "NEW")?.count, 2);
  assert.equal(counts.find((row) => row.stage === "OTHER")?.count, 1);
  assert.deepEqual(visibleStages([]), visibleStages(["nope"]));
  assert.deepEqual(visibleStages(["NEW", "OTHER"]), ["NEW", "OTHER"]);
  assert.deepEqual(parseStageFilter(["NEW", "NEW", "nope"]), ["NEW"]);
  assert.equal(hiddenCount(["NEW", "CALLBACK"], ["NEW"]), 1);
  assert.equal(hiddenCount(["NEW", "CALLBACK"], []), 0);
  assert.equal(cardHit(" ada ", "Ada Lovelace", "ada@desk.test"), true);
  assert.equal(cardHit("missing", "Ada", "ada@desk.test"), false);
  assert.equal(saveStage("NEW", "CALLBACK")?.to, "CALLBACK");
  assert.equal(saveStage("NEW", "NEW"), null);
  assert.equal(saveStage("NEW", "OTHER"), null);
  assert.equal(saveStage("INV_TRASH", "NOT_INTERESTED")?.from, "INV_TRASH");
  assert.equal(parseDensity("compact"), "compact");
  assert.equal(parseDensity("wide"), "comfortable");
  assert.deepEqual(openTips(["confirm"]), ["board", "keys"]);
  const topics = matchTopics("board", [
    { title: "Pipeline", body: "The board counts loaded rows." },
    { title: "Money", body: "Currencies stay separate." },
  ]);
  assert.equal(topics.length, 1);
  assert.equal(matchTopics("", topics).length, 1);
  assert.equal(questionOpensSheet("?", false), true);
  assert.equal(questionOpensSheet("?", true), false);
  assert.equal(questionOpensSheet("k", false), false);

  const copy = Object.keys(ROUND41_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND41_COPY[locale]).sort(), copy);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-board-cols/);
  assert.match(css, /\.c4-help-drawer/);
  assert.match(css, /\.c4-sheet-keys/);
  assert.match(css, /#7a5e30/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round41.tsx"), "utf8");
  const drop = view.slice(view.indexOf("function dropOn"), view.indexOf("async function confirmMove"));
  assert.equal(drop.includes("onMove"), false);
  assert.match(view, /await onMove\(pending\.id, pending\.to\)/);
  assert.equal(view.includes("sendJson"), false);
  const customers = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Customers.tsx"), "utf8");
  assert.match(customers, /PipelineDesk/);
  assert.match(customers, /saleStatus: status/);
  const keys = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round1.tsx"), "utf8");
  assert.match(keys, /questionOpensSheet/);
  assert.match(keys, /onSheet/);
  console.log("crmv4 round41 tests passed");
}

main();
