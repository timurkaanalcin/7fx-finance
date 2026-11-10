/**
 * Index slips and mail halls.
 * Run: TZ=UTC npx tsx tests/crmv4-round188.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND188_COPY } from "../src/lib/crmv4/copy-round188";
import {
  activeLeaf,
  activeSpan,
  activeWait,
  addSlip,
  addSlipView,
  bulkSlipShelf,
  catalogHouse,
  catalogHouseCount,
  cyclePace,
  editSlip,
  editSlipNote,
  evenHouse,
  evenHouseCount,
  fairClerk,
  homeCipher,
  houseBand,
  houseRowsCsv,
  houseState,
  housesCsv,
  lateSlip,
  leafGap,
  leafOf,
  nextSlip,
  peakLeaf,
  quietLeaf,
  readSlips,
  sharedHouseCount,
  slipCipher,
  soonSlip,
  spanOf,
  suggestClerk,
  suggestShelf,
  suggestWait,
  usedLeaves,
  visibleHouseCustomers,
  visibleSlips,
  waitDays,
  wideHouse,
  wideHouseCount,
  slipsCsv,
} from "../src/lib/crmv4/round188";

function main() {
  assert.equal(slipCipher("  tr01 "), "TR01");
  assert.equal(slipCipher("de02"), "DE02");
  assert.equal(slipCipher("ae03"), "AE03");
  assert.equal(slipCipher("   "), "");
  assert.equal(slipCipher("TR1"), "");
  assert.equal(slipCipher("TR001"), "");
  assert.equal(leafOf("1"), 1);
  assert.equal(leafOf("28"), 28);
  assert.equal(leafOf("9"), 9);
  assert.equal(leafOf("01"), null);
  assert.equal(leafOf("0"), null);
  assert.equal(leafOf("29"), null);
  assert.equal(leafOf(""), null);
  assert.equal(spanOf("2"), 2);
  assert.equal(spanOf(4), 4);
  assert.equal(spanOf(8), 8);
  assert.equal(spanOf("0"), null);
  assert.equal(spanOf("1"), null);
  assert.equal(spanOf("02"), null);
  assert.equal(waitDays("1"), 1);
  assert.equal(waitDays(3), 3);
  assert.equal(waitDays(7), 7);
  assert.equal(waitDays("0"), null);
  assert.equal(waitDays("01"), null);
  assert.equal(waitDays("2"), null);
  assert.equal(peakLeaf(1), true);
  assert.equal(peakLeaf(15), true);
  assert.equal(peakLeaf(9), false);
  assert.equal(quietLeaf(7), true);
  assert.equal(quietLeaf(21), true);
  assert.equal(quietLeaf(1), false);
  assert.equal(quietLeaf(15), false);
  assert.equal(leafGap(28, 1), 1);
  assert.equal(leafGap(1, 28), -1);
  assert.equal(leafGap(1, 15), 14);
  assert.equal(leafGap(1, 16), -13);
  assert.equal(leafGap(null, 2), null);
  assert.equal(leafGap(2, ""), null);
  assert.equal(leafGap(2, 29), null);

  const saved = addSlip([], { id: "a", title: "Slip Ada", note: "oak page", clerk: "Nia", leaf: "9", shelf: "oak", cipher: "tr01", pace: "hush", span: "8", wait: "1" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].leaf, 9);
  assert.equal(saved[0].span, 8);
  assert.equal(saved[0].wait, 1);
  assert.equal(saved[0].cipher, "TR01");
  assert.equal(saved[0].note, "oak page");
  assert.equal(saved[0].audit, "save");
  assert.equal(homeCipher(saved[0].cipher), true);
  assert.equal(homeCipher("US"), false);
  assert.equal(homeCipher("TR1"), false);
  assert.equal(soonSlip(saved[0]), true);
  assert.equal(addSlip(saved, { id: "b", title: "Slip Ada" }).length, 1);
  assert.equal(addSlip(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(addSlip(saved, { id: "c", title: "   " }).length, 1);
  const capped = Array.from({ length: 12 }, (_, index) => ({ id: `n${index}`, title: `Line ${index}` })).reduce((cards, card) => addSlip(cards, card), [] as ReturnType<typeof addSlip>);
  assert.equal(capped.length, 9);
  assert.equal(capped.some((card) => card.title === "Line 0"), false);
  assert.equal(capped[0].title, "Line 11");

  const cycled = cyclePace(saved, "a");
  assert.equal(cycled[0].pace, "walk");
  assert.equal(cycled[0].audit, "pace");
  assert.equal(cyclePace(cycled, "a")[0].pace, "rush");
  assert.equal(cyclePace(cyclePace(cycled, "a"), "a")[0].pace, "hush");
  const blankPace = addSlip([], { id: "z", title: "Blank pace" });
  assert.equal(cyclePace(blankPace, "z")[0].pace, "hush");

  const edited = editSlip(saved, "a", "Slip Bea");
  assert.equal(edited[0].title, "Slip Bea");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editSlip(edited, "a", "  ")[0].title, "Slip Bea");
  const noted = editSlipNote(edited, "a", "second look");
  assert.equal(noted[0].note, "second look");
  assert.equal(editSlipNote(noted, "a", "  ")[0].note, "second look");
  const pair = addSlip(noted, { id: "b", title: "Slip" });
  assert.equal(editSlip(pair, "a", "Slip").find((card) => card.id === "a")?.title, "Slip Bea");

  const early = addSlip([], { id: "a", title: "Early", leaf: "1", shelf: "oak", wait: "1", clerk: "Nia", span: "8" });
  const mid = addSlip(early, { id: "m", title: "Mid", leaf: "10", shelf: "ink", wait: "7", clerk: "Ada", span: "2", pace: "hush" });
  const open = addSlip(mid, { id: "b", title: "Later", leaf: "20", pace: "rush" });
  assert.equal(lateSlip(open.find((card) => card.title === "Early") as (typeof open)[number], 6), true);
  assert.equal(lateSlip(open.find((card) => card.title === "Early") as (typeof open)[number], 5), false);
  const earlyCard = open.find((card) => card.title === "Early") as (typeof open)[number];
  assert.equal(lateSlip({ ...earlyCard, filed: true }, 6), false);
  assert.equal(nextSlip(open, 6), open.find((card) => card.title === "Mid")?.id);
  assert.equal(nextSlip(open, 22), open.find((card) => card.title === "Early")?.id);
  assert.equal(suggestShelf([]), "ink");
  assert.equal(suggestShelf(open), "gilt");
  assert.equal(suggestClerk(open), "Ada");
  assert.equal(suggestWait([]), 3);
  assert.equal(suggestWait(open), 3);
  assert.equal(fairClerk(open, "Nia, Bea"), "Bea");
  assert.equal(fairClerk(open, ""), "Ada");
  assert.equal(usedLeaves(open), 3);
  assert.equal(bulkSlipShelf(open, ["b"], "gilt").find((card) => card.id === "b")?.shelf, "gilt");
  assert.equal(activeLeaf("dawn"), "dawn");
  assert.equal(activeLeaf("29"), "all");
  assert.equal(activeSpan("8"), "8");
  assert.equal(activeWait("7"), "7");
  const shown = visibleSlips(open, "open", "mid", null, null, null, null, null, null, null, null, false, false, false);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].title, "Mid");
  const views = addSlipView([], { id: "v", name: "Dawn", tray: "open", query: "", clerk: "all", shelf: "all", cipher: "all", pace: "all", leaf: "dawn", span: "all", wait: "all" });
  assert.equal(views.length, 1);
  assert.equal(views[0].leaf, "dawn");
  const csv = slipsCsv(open, 6);
  assert.equal(csv.startsWith("title,clerk,leaf"), true);
  assert.equal(csv.includes("amount"), false);
  assert.equal(readSlips([{ id: "", title: "Nope" }]).length, 0);

  const gmail = "ada@gmail.com";
  const outlook = "bea@outlook.com";
  const hall = "cy@very-long-house.example";
  const icloud = "dot@icloud.com";
  assert.equal(houseBand(gmail), "post");
  assert.equal(houseBand(outlook), "lane");
  assert.equal(houseBand(hall), "hall");
  assert.equal(houseBand(icloud), "post");
  assert.equal(catalogHouse(gmail), true);
  assert.equal(catalogHouse(hall), false);
  assert.equal(wideHouse(hall), true);
  assert.equal(evenHouse(icloud), true);
  assert.equal(evenHouse(gmail), false);
  const rows = [
    { id: "ada", label: "Ada", note: { email: gmail } },
    { id: "bea", label: "Bea", note: { email: gmail } },
    { id: "cy", label: "Cy", note: { email: null } },
    { id: "dee", label: "Dee", note: { email: outlook, balance: 1 } },
    { id: "eve", label: "Eve", note: { email: hall } },
    { id: "fay", label: "Fay", note: { email: icloud } },
  ];
  assert.equal(houseState(gmail), "set");
  assert.equal(houseState({ email: null }), "clear");
  assert.equal(houseState({ email: outlook, balance: 1 }), "");
  assert.equal(houseState("not-an-email"), "");
  assert.equal(houseState(""), "clear");
  assert.equal(catalogHouseCount(rows), 3);
  assert.equal(wideHouseCount(rows), 1);
  assert.equal(evenHouseCount(rows), 1);
  assert.equal(sharedHouseCount(rows), 1);
  assert.equal(visibleHouseCustomers(rows, "post", null, "", "all", [], "all").length, 3);
  assert.equal(visibleHouseCustomers(rows, null, null, "gus", "all", [], "all").length, 0);
  const bands = housesCsv(rows);
  assert.equal(bands.startsWith("kind,mark,count"), true);
  assert.equal(bands.includes("amount"), false);
  assert.equal(bands.includes("catalog"), true);
  const queue = houseRowsCsv(rows, ["ada"]);
  assert.equal(queue.includes("Ada"), true);
  assert.equal(queue.split("\n")[1].endsWith(",1"), true);

  assert.equal(crmv4Text("en", "idxTitle"), ROUND188_COPY.en.idxTitle);
  assert.equal(crmv4Text("tr", "mhlTitle"), ROUND188_COPY.tr.mhlTitle);
  assert.equal(crmv4Text("de", "idxSearch"), ROUND188_COPY.de.idxSearch);
  assert.equal(crmv4Text("ru", "mhlHint"), ROUND188_COPY.ru.mhlHint);
  assert.equal(crmv4Text("ar", "idxNotice"), ROUND188_COPY.ar.idxNotice);
  assert.notEqual(ROUND188_COPY.tr.idxTitle, ROUND188_COPY.en.idxTitle);
  assert.notEqual(ROUND188_COPY.de.mhlTitle, ROUND188_COPY.en.mhlTitle);
  assert.notEqual(ROUND188_COPY.ru.idxSearch, ROUND188_COPY.en.idxSearch);
  assert.notEqual(ROUND188_COPY.ar.mhlSearch, ROUND188_COPY.en.mhlSearch);
  const keys = Object.keys(ROUND188_COPY.en);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND188_COPY[locale]), keys);
  }

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-idx/);
  assert.match(css, /\.c4-mhl/);
  assert.match(css, /\.c4-exec-salon/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round188.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.equal(viewFile.includes("saleStatus"), false);
  assert.equal(viewFile.includes("retentionStatus"), false);
  assert.equal(viewFile.includes("potentialStatus"), false);
  assert.equal(viewFile.includes("documentsStatus"), false);
  assert.equal(viewFile.includes("accountType"), false);
  assert.equal(viewFile.includes("validationStatus"), false);
  assert.equal(viewFile.includes("registrationDate"), false);
  assert.equal(viewFile.includes("birthDate"), false);
  assert.equal(viewFile.includes("lastContactAt"), false);
  assert.equal(viewFile.includes("assigneeId"), false);
  assert.match(viewFile, /email/);
  assert.match(viewFile, /slipsCsv/);
  assert.match(viewFile, /housesCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-slips/);
  assert.match(viewFile, /data-halls/);
  assert.match(viewFile, /data-catalog/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestShelf/);
  const overview = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Overview.tsx"), "utf8");
  assert.match(overview, /c4-exec-salon/);
  assert.match(overview, /data-logo="mono"/);
  assert.match(overview, /c4-exec-salon-mast/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "index"/);
  assert.match(app, /view === "mhall"/);
  assert.match(app, /IndexSlips/);
  assert.match(app, /MailHalls/);
  console.log("crmv4 round188 tests passed");
}

main();
