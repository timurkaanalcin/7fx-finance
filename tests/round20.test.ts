/**
 * Round 20: English stays in the first load, other locales are chunks,
 * and the trade shell dynamic-imports the heavy panels.
 * Run: npx tsx tests/round20.test.ts
 */
import "./preload-dicts";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { translate } from "../src/lib/i18n/dictionaries";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function main() {
  const dicts = read("src/lib/i18n/dictionaries/index.ts");
  assert.equal(dicts.includes('from "./en"'), true);
  assert.equal(dicts.includes('from "./tr"'), false);
  assert.equal(dicts.includes('import("./tr")'), true);
  assert.equal(dicts.includes('import("./ru")'), true);
  assert.equal(dicts.includes('import("./de")'), true);
  assert.equal(dicts.includes('import("./ar")'), true);

  const crm = read("src/components/i18n/CrmI18n.tsx");
  assert.equal(crm.includes('from "@/lib/i18n/dictionaries/tr"'), true);
  assert.equal(crm.includes("installDict"), true);

  const shell = read("src/components/trading/TerminalShell.tsx");
  for (const panel of ["BottomPanels", "OrderTicket", "Watchlist", "DepositModal", "PriceAlerts"]) {
    // dynamic() may take a second argument (loading skeleton). The panel must not be a static import.
    assert.match(shell, new RegExp(`const ${panel} = dynamic\\(\\(\\) => import\\("\\./${panel}"\\)`), panel);
    assert.equal(shell.includes(`import ${panel} from`), false, panel);
  }
  assert.equal(shell.includes("setCalendarPartial"), true);

  assert.equal(translate("en", "term.cal.partial").includes("partial"), true);
  assert.equal(translate("en", "term.chart.liveQuote"), "Live Yahoo quote");
  assert.equal(translate("en", "term.blotter.showChart"), "Show chart");
  assert.ok(/[çğıöşüÇĞİÖŞÜıİ]/.test(translate("tr", "term.cal.partial")));
  assert.equal(translate("tr", "term.chart.timeframe"), "Zaman dilimi");

  const chat = read("src/app/api/admin/chat/route.ts");
  assert.equal(chat.includes("take: 400"), false);
  assert.equal(chat.includes("pagedThreads"), true);

  console.log("round20 tests passed");
}

main();
