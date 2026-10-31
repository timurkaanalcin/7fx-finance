/**
 * CRM v3 round 41: sale-stage board, help drawer, shortcut sheet, tips.
 * Run: npx tsx tests/crmv3-round41.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { BOARD_AR, BOARD_DE, BOARD_EN, BOARD_RU, BOARD_TR } from "../src/lib/crmv3/copy-board";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
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
} from "../src/lib/crmv3/board";

const ROOT = path.resolve(__dirname, "..");

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

  const copy = Object.keys(BOARD_EN).sort();
  assert.deepEqual(Object.keys(BOARD_TR).sort(), copy);
  assert.deepEqual(Object.keys(BOARD_DE).sort(), copy);
  assert.deepEqual(Object.keys(BOARD_RU).sort(), copy);
  assert.deepEqual(Object.keys(BOARD_AR).sort(), copy);
  assert.notEqual(BOARD_TR.bdTitle, BOARD_EN.bdTitle);
  assert.notEqual(BOARD_DE.bdConfirm, BOARD_EN.bdConfirm);
  assert.notEqual(BOARD_RU.hdTitle, BOARD_EN.hdTitle);
  assert.notEqual(BOARD_AR.tpDismiss, BOARD_EN.tpDismiss);

  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-board-density", "en"), "Card density");
  assert.equal(keyTitle("crmv3-board-stages", "tr").length > 0, true);
  assert.equal(keyTitle("crmv3-board-tips", "ar").length > 0, true);

  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/board.tsx"), "utf8");
  const drop = view.slice(view.indexOf("function dropOn"), view.indexOf("async function confirmMove"));
  assert.equal(drop.includes("onMove"), false);
  assert.match(view, /await onMove\(pending\.id, pending\.to\)/);
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("crmv4"), false);
  assert.match(view, /crmv3-board-density/);
  assert.match(view, /crmv3-board-stages/);
  assert.match(view, /crmv3-board-tips/);
  assert.match(view, /data-help-drawer/);
  assert.match(view, /data-board/);
  const customers = fs.readFileSync(path.join(ROOT, "src/components/crmv3/views/Customers.tsx"), "utf8");
  assert.match(customers, /SaleBoard/);
  assert.match(customers, /saleStatus: status/);
  const keys = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/command.tsx"), "utf8");
  assert.match(keys, /questionOpensSheet/);
  assert.match(keys, /data-shortcuts/);
  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-sale-cols/);
  assert.match(css, /\.c3-help-drawer/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const lib = fs.readFileSync(path.join(ROOT, "src/lib/crmv3/board.ts"), "utf8");
  assert.equal(lib.includes("crmv4"), false);
  const tree = fs.readdirSync(path.join(ROOT, "src/components/crmv3"), { recursive: true }) as string[];
  for (const file of tree) {
    if (!String(file).endsWith(".tsx") && !String(file).endsWith(".ts")) continue;
    const src = fs.readFileSync(path.join(ROOT, "src/components/crmv3", String(file)), "utf8");
    assert.equal(src.includes("crmv4"), false, String(file));
  }
  console.log("crmv3 round41 tests passed");
}

main();
