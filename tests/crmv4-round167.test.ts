/**
 * Reading nooks and withdrawal bolts.
 * Run: TZ=UTC npx tsx tests/crmv4-round167.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND167_COPY } from "../src/lib/crmv4/copy-round167";
import {
  activeBolt,
  activePage,
  addNook,
  addNookView,
  bandOf,
  boltOf,
  boltsCsv,
  bulkNookBooth,
  cycleNookInk,
  dayPage,
  editNook,
  editNookNote,
  leadingBolt,
  leadingSpan,
  nameMarkOf,
  nameSpanOf,
  nextNook,
  nookGap,
  nookLine,
  nookMark,
  nooksCsv,
  pageOf,
  quietPage,
  readNooks,
  suggestBooth,
  visibleBoltCustomers,
  visibleNooks,
} from "../src/lib/crmv4/round167";

function main() {
  assert.equal(nookLine("  Read\nAda  "), "Read Ada");
  assert.equal(nookLine("   "), "");
  assert.equal(nookLine("x".repeat(80)).length, 36);
  assert.equal(nookMark("  KYC  "), "KYC");
  assert.equal(nookMark("   "), "");
  assert.equal(nookMark("z".repeat(20)).length, 4);

  assert.equal(pageOf("08"), 8);
  assert.equal(pageOf("01"), 1);
  assert.equal(pageOf("8"), 8);
  assert.equal(pageOf(40), 40);
  assert.equal(pageOf("00"), null);
  assert.equal(pageOf("0"), null);
  assert.equal(pageOf("41"), null);
  assert.equal(pageOf(-1), null);
  assert.equal(pageOf(""), null);
  assert.equal(pageOf("3.0"), null);
  assert.equal(bandOf(1), "front");
  assert.equal(bandOf(10), "front");
  assert.equal(bandOf(11), "middle");
  assert.equal(bandOf(25), "middle");
  assert.equal(bandOf(26), "back");
  assert.equal(bandOf(40), "back");
  assert.equal(bandOf(null), "blank");
  assert.equal(quietPage(1), true);
  assert.equal(quietPage(3), true);
  assert.equal(quietPage(4), false);
  assert.equal(quietPage(38), true);
  assert.equal(quietPage(40), true);
  assert.equal(quietPage(26), false);
  assert.equal(dayPage(4), true);
  assert.equal(dayPage(37), true);
  assert.equal(dayPage(38), false);
  assert.equal(nookGap(2, 8), 6);
  assert.equal(nookGap(8, 2), -6);
  assert.equal(nookGap(2, 2), 0);
  assert.equal(nookGap(null, 2), null);
  assert.equal(nookGap(2, ""), null);
  assert.equal(nookGap(2, 0), null);
  assert.equal(nookGap(2, 41), null);

  const saved = addNook([], { id: "a", title: "Read Ada", aside: "passport scan", reader: "Nia", page: "08", booth: "red", mark: "A1", ink: "soft" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].page, 8);
  assert.equal(saved[0].aside, "passport scan");
  assert.equal(saved[0].audit, "save");
  assert.equal(addNook(saved, { id: "b", title: "Read Ada" }).length, 1);
  assert.equal(addNook(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(addNook(saved, { id: "c", title: "   " }).length, 1);
  const capped = Array.from({ length: 9 }, (_, index) => ({ id: `n${index}`, title: `Line ${index}` })).reduce((cards, card) => addNook(cards, card), [] as ReturnType<typeof addNook>);
  assert.equal(capped.length, 8);

  const cycled = cycleNookInk(saved, "a");
  assert.equal(cycled[0].ink, "firm");
  assert.equal(cycled[0].audit, "ink");
  assert.equal(cycleNookInk(cycled, "a")[0].ink, "sharp");
  assert.equal(cycleNookInk(cycleNookInk(cycled, "a"), "a")[0].ink, "soft");
  const blankInk = addNook([], { id: "z", title: "Blank ink" });
  assert.equal(cycleNookInk(blankInk, "z")[0].ink, "soft");

  const edited = editNook(saved, "a", "Read Bea");
  assert.equal(edited[0].title, "Read Bea");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editNook(edited, "a", "  ")[0].title, "Read Bea");
  const noted = editNookNote(edited, "a", "second look");
  assert.equal(noted[0].aside, "second look");
  assert.equal(editNookNote(noted, "a", "  ")[0].aside, "second look");
  const pair = addNook(noted, { id: "b", title: "Keep" });
  assert.equal(editNook(pair, "a", "Keep").find((card) => card.id === "a")?.title, "Read Bea");

  const moved = bulkNookBooth(pair, ["a"], "blue");
  assert.equal(moved.find((card) => card.id === "a")?.booth, "blue");
  assert.equal(moved.find((card) => card.id === "a")?.audit, "booth");
  assert.equal(bulkNookBooth(moved, ["a"], "blue").find((card) => card.id === "a")?.audit, "booth");
  assert.equal(bulkNookBooth(moved, ["a"], "attic").find((card) => card.id === "a")?.booth, "blue");

  const mixed = [
    ...addNook([], { id: "live", title: "Live", aside: "passport scan", reader: "Nia", page: 2, booth: "red", mark: "A1", ink: "soft" }),
  ];
  assert.equal(visibleNooks(mixed, "open", "passport", null, null, null, null, null, null, false, false).length, 1);
  assert.equal(visibleNooks(mixed, "open", "nia", null, null, null, null, null, null, false, false).length, 0);
  const held = mixed.map((card) => (card.id === "live" ? { ...card, held: true } : card));
  const filed = mixed.map((card) => ({ ...card, done: true, held: true }));
  assert.equal(visibleNooks(mixed, "open", "", null, null, null, null, null, null, false, false).length, 1);
  assert.equal(visibleNooks(held, "held", "", null, null, null, null, null, null, false, false).length, 1);
  assert.equal(visibleNooks(held, "open", "", null, null, null, null, null, null, false, false).length, 0);
  assert.equal(visibleNooks(filed, "done", "", null, null, null, null, null, null, false, false).length, 1);
  assert.equal(visibleNooks(filed, "held", "", null, null, null, null, null, null, false, false).length, 0);
  assert.equal(suggestBooth([]), "red");
  assert.equal(suggestBooth(mixed), "blue");
  assert.equal(nextNook(mixed, 2), "live");
  assert.equal(nextNook(mixed.map((card) => ({ ...card, ink: "sharp" })), 2), "");
  assert.equal(nextNook(mixed, 9), "live");
  const csv = nooksCsv(mixed, 8);
  assert.equal(csv.startsWith("title,reader,page,booth,mark,ink,band,pinned,held,done,gap,aside,audit"), true);
  assert.equal(csv.includes("amount"), false);
  assert.equal(readNooks(mixed)[0].page, 2);
  const views = addNookView([], { id: "v", name: "Front", tray: "open", query: "ada", reader: "all", booth: "red", mark: "all", ink: "all", page: "front" });
  assert.equal(views.length, 1);
  assert.equal(views[0].page, "front");
  assert.equal(activePage("41"), "all");
  assert.equal(activePage("08"), "8");

  assert.equal(boltOf(true), "free");
  assert.equal(boltOf(false), "held");
  assert.equal(boltOf("yes"), "free");
  assert.equal(boltOf("no"), "held");
  assert.equal(boltOf("free"), "free");
  assert.equal(boltOf("held"), "held");
  assert.equal(boltOf(null), "");
  assert.equal(boltOf({ withdrawalsEnabled: false }), "held");
  assert.equal(boltOf({ loginEnabled: true, withdrawalsEnabled: false }), "");
  assert.equal(boltOf({ tradingEnabled: false }), "");
  assert.equal(nameSpanOf("Ada"), "short");
  assert.equal(nameSpanOf("Beatrice"), "mid");
  assert.equal(nameSpanOf("Annabelle Marie"), "long");
  assert.equal(nameSpanOf("  "), "");
  assert.equal(nameMarkOf("Ada"), "solo");
  assert.equal(nameMarkOf("Ada Bea"), "pair");
  assert.equal(nameMarkOf(""), "");
  const rows = [
    { bolt: true, label: "Ada" },
    { bolt: true, label: "Ann" },
    { bolt: false, label: "Beatrice" },
    { bolt: null, label: "Annabelle Marie" },
  ];
  assert.equal(leadingBolt(rows), "free");
  assert.equal(leadingBolt([{ bolt: true }, { bolt: false }]), "free");
  assert.equal(leadingSpan([{ label: "Ada" }, { label: "Ann" }]), "short");
  assert.equal(leadingSpan(rows), "short");
  assert.equal(visibleBoltCustomers(rows, "held", null, null, "").length, 1);
  assert.equal(visibleBoltCustomers(rows, null, "mid", "solo", "").length, 1);
  assert.equal(visibleBoltCustomers(rows, null, null, null, "bea").length, 1);
  assert.equal(visibleBoltCustomers(rows, null, null, null, "555").length, 0);
  const names = boltsCsv(rows);
  assert.equal(names.startsWith("kind,bolt,count"), true);
  assert.equal(boltsCsv([]), "kind,bolt,count");
  assert.equal(names.includes("amount"), false);
  assert.equal(names.includes(",free,"), true);
  assert.equal(activeBolt("gone", ["free"]), "all");

  const copy = Object.keys(ROUND167_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND167_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "nokTitle"), "Reading nooks");
  assert.equal(crmv4Text("tr", "bltTitle"), ROUND167_COPY.tr.bltTitle);
  assert.equal(crmv4Text("de", "nokReader"), ROUND167_COPY.de.nokReader);
  assert.equal(crmv4Text("ru", "bltUnmarked"), ROUND167_COPY.ru.bltUnmarked);
  assert.equal(crmv4Text("ar", "nokNotice"), ROUND167_COPY.ar.nokNotice);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-nok/);
  assert.match(css, /\.c4-blt/);
  assert.match(css, /\.c4-cust-nook/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round167.tsx"), "utf8");
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
  assert.match(viewFile, /withdrawalsEnabled/);
  assert.match(viewFile, /nooksCsv/);
  assert.match(viewFile, /boltsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "r"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-nooks/);
  assert.match(viewFile, /data-bolts/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestBooth/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "nook"/);
  assert.match(app, /view === "bolt"/);
  const customers = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Customers.tsx"), "utf8");
  assert.match(customers, /c4-cust-nook/);
  console.log("crmv4 round167 tests passed");
}

main();
