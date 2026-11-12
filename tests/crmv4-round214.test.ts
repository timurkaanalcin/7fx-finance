/**
 * Crypt chests and residency seals.
 * Run: TZ=UTC npx tsx tests/crmv4-round214.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND214_COPY } from "../src/lib/crmv4/copy-round214";
import {
  activeBay,
  activeSeal,
  activeSpan,
  addChest,
  addChestMark,
  addChestView,
  adjacentChestCount,
  bayGap,
  bayOf,
  baySpan,
  busiestClerk,
  catalogSeal,
  catalogSealCount,
  clashBayCount,
  cycleSeal,
  densityOf,
  dustLoad,
  dustOf,
  fairClerk,
  giltSealCount,
  houseTimber,
  lateChest,
  lateShare,
  leadingSeal,
  leadingSealTone,
  lockLoad,
  moveFocus,
  nextChest,
  pairClerkCount,
  peakBay,
  quietBay,
  quietHouseCount,
  readChestViews,
  sealCopy,
  sealLane,
  sealOf,
  sealRowsCsv,
  sealState,
  sealTone,
  sealsCsv,
  setChestDust,
  sharedSealCount,
  sharedTimberCount,
  snoozeChest,
  soonChest,
  spanClashCount,
  spanOf,
  suggestClerk,
  suggestSpan,
  suggestTimber,
  timberOf,
  usedBays,
  visibleSealCustomers,
  wideSealCount,
  windowChests,
  chestsCsv,
} from "../src/lib/crmv4/round214";

function main() {
  assert.equal(timberOf("  ash "), "ASH");
  assert.equal(timberOf("oak"), "OAK");
  assert.equal(timberOf("yew"), "YEW");
  assert.equal(timberOf("   "), "");
  assert.equal(timberOf("pine"), "");
  assert.equal(bayOf("1"), 1);
  assert.equal(bayOf(6), 6);
  assert.equal(bayOf("6"), 6);
  assert.equal(bayOf("0"), null);
  assert.equal(bayOf(0), null);
  assert.equal(bayOf("7"), null);
  assert.equal(bayOf("06"), null);
  assert.equal(bayOf(""), null);
  assert.equal(bayOf(1.5), null);
  assert.equal(spanOf("6"), 6);
  assert.equal(spanOf(12), 12);
  assert.equal(spanOf("24"), 24);
  assert.equal(spanOf("4"), null);
  assert.equal(spanOf("06"), null);
  assert.equal(dustOf("0"), 0);
  assert.equal(dustOf(3), 3);
  assert.equal(dustOf("9"), 9);
  assert.equal(dustOf("2"), null);
  assert.equal(peakBay(2), true);
  assert.equal(peakBay(5), true);
  assert.equal(peakBay(4), false);
  assert.equal(quietBay(6), true);
  assert.equal(quietBay(1), false);
  assert.equal(bayGap(1, 6), 5);
  assert.equal(bayGap(6, 1), -5);
  assert.equal(bayGap(null, 3), null);
  assert.equal(bayGap(1, 0), null);
  assert.equal(houseTimber("ash"), true);
  assert.equal(houseTimber("YEW"), true);
  assert.equal(houseTimber("oak"), false);
  assert.equal(activeBay("peak"), "peak");
  assert.equal(activeBay("6"), "6");
  assert.equal(activeBay("9"), "all");
  assert.equal(activeSpan("12"), "12");
  assert.equal(activeSpan("4"), "all");
  assert.equal(activeSeal("lock", ["wax", "cord", "lock"]), "lock");
  assert.equal(activeSeal("nope", ["wax", "cord", "lock"]), "all");
  assert.equal(densityOf("low"), "low");
  assert.equal(densityOf("nope"), "tall");
  assert.equal(moveFocus(0, 3, 1), 1);
  assert.equal(moveFocus(0, 3, -1), 2);

  const first = addChest([], {
    id: "a",
    title: "  North file ",
    note: "quiet",
    clerk: "Ada",
    bay: "1",
    timber: "ash",
    seal: "wax",
    span: "12",
    marks: "g h i l z",
    dust: "3",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North file");
  assert.equal(first[0].timber, "ASH");
  assert.equal(first[0].bay, 1);
  assert.equal(first[0].span, 12);
  assert.deepEqual(first[0].marks, ["g", "h", "i", "l"]);
  assert.equal(first[0].dust, 3);
  assert.equal(first[0].audit, "save");
  assert.equal(addChest(first, { id: "a", title: "Other" }).length, 1);
  assert.equal(addChest(first, { id: "b", title: "North file" }).length, 1);
  assert.equal(addChest(first, { id: "c", title: "   " }).length, 1);
  const corded = cycleSeal(first, "a");
  assert.equal(corded[0].seal, "cord");
  assert.equal(cycleSeal(corded, "a")[0].seal, "lock");
  assert.equal(cycleSeal(cycleSeal(corded, "a"), "a")[0].seal, "wax");
  assert.equal(addChestMark(first, "a", "k").length, 1);
  assert.equal(addChestMark(first, "a", "k")[0].marks.length, 4);
  assert.equal(addChestMark(first, "a", "g")[0].marks.length, 4);
  assert.equal(setChestDust(first, "a", 0)[0].dust, 0);
  assert.equal(setChestDust(first, "a", 1)[0].dust, 3);
  const snoozed = snoozeChest([{ ...first[0], span: null }], "a");
  assert.equal(snoozed[0].span, 6);
  assert.equal(snoozeChest(snoozed, "a")[0].span, 12);
  assert.equal(snoozeChest(snoozeChest(snoozed, "a"), "a")[0].span, 24);
  assert.equal(suggestTimber([]), "OAK");
  assert.equal(suggestSpan([]), 12);
  assert.equal(suggestClerk([]), "");

  const desk = [
    { ...first[0], id: "late", title: "Late", bay: 1, timber: "ASH", seal: "wax", span: 12, dust: 0, clerk: "Ada" },
    { ...first[0], id: "due", title: "Due", bay: 4, timber: "OAK", seal: "lock", span: 6, dust: 0, clerk: "Bo" },
    { ...first[0], id: "near", title: "Near", bay: 3, timber: "ASH", seal: "cord", span: 24, dust: 0, clerk: "Ada" },
    { ...first[0], id: "quiet", title: "Quiet", bay: 6, timber: "YEW", seal: "wax", span: 12, dust: 0, clerk: "Cy" },
  ];
  assert.equal(lateChest(desk[0], 4), true);
  assert.equal(lateChest(desk[2], 4), false);
  assert.equal(soonChest(desk[1]), true);
  assert.equal(soonChest(desk[0]), false);
  assert.equal(lateShare(desk, 4) > 0, true);
  assert.equal(usedBays(desk), 4);
  assert.equal(clashBayCount(desk), 0);
  assert.equal(spanClashCount(desk), 2);
  assert.equal(adjacentChestCount(desk) >= 2, true);
  assert.equal(pairClerkCount(desk), 2);
  assert.equal(sharedTimberCount(desk), 2);
  assert.equal(dustLoad(desk), 0);
  assert.equal(quietHouseCount(desk), 1);
  assert.equal(lockLoad(desk), 1);
  assert.equal(baySpan(desk), 5);
  assert.equal(nextChest(desk, 4), "quiet");
  assert.equal(windowChests(desk, 4).some((row) => row.id === "due"), true);
  assert.equal(fairClerk(desk, "Ada, Bo"), "Bo");
  assert.equal(busiestClerk(desk), "Ada");
  const sheet = chestsCsv(desk, 6);
  assert.match(sheet, /title,clerk,bay/);
  assert.match(sheet, /Late,Ada,1,ASH/);
  const saved = addChestView([], {
    id: "v1",
    name: "Open ash",
    tray: "open",
    query: "",
    clerk: "all",
    timber: "ash",
    seal: "all",
    bay: "all",
    span: "all",
    dust: "all",
  });
  assert.equal(readChestViews(saved).length, 1);

  assert.equal(sealOf(true), "RES");
  assert.equal(sealOf(false), "VIS");
  assert.equal(sealOf("resident"), "RES");
  assert.equal(sealOf("visitor"), "VIS");
  assert.equal(sealOf(""), "");
  assert.equal(sealLane(true), "house");
  assert.equal(sealLane(false), "court");
  assert.equal(sealTone(true), "gilt");
  assert.equal(sealTone(false), "ivory");
  assert.equal(catalogSeal(true), true);
  assert.equal(catalogSeal(false), false);
  assert.equal(sealState({ language: "en", isResident: true }), "");
  assert.equal(sealState({ isResident: null }), "clear");
  assert.equal(sealState({ isResident: true }), "set");
  assert.equal(sealCopy(true), "resident");

  const rows = [
    { id: "1", label: "Ada", note: { isResident: true } },
    { id: "2", label: "Bo", note: { isResident: false } },
    { id: "3", label: "Cy", note: { isResident: true } },
    { id: "4", label: "Fay", note: { isResident: null } },
    { id: "5", label: "Ivo", note: { language: "en" } },
  ];
  assert.equal(catalogSealCount(rows), 2);
  assert.equal(wideSealCount(rows), 2);
  assert.equal(giltSealCount(rows), 2);
  assert.equal(sharedSealCount(rows), 2);
  assert.equal(leadingSeal(rows), "house");
  assert.equal(leadingSealTone(rows), "gilt");
  assert.equal(visibleSealCustomers(rows, "house", null, "ada", "all", [], "all").length, 1);
  const counts = sealsCsv(rows);
  assert.match(counts, /lane,house,2/);
  assert.match(counts, /catalog,catalog,2/);
  const rowSheet = sealRowsCsv(rows, ["1"]);
  assert.match(rowSheet, /Ada,RES,house,gilt,1,1,1/);
  assert.match(rowSheet, /Fay,,blank,,0,0,0/);

  const keys = Object.keys(ROUND214_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND214_COPY[locale]).sort(), keys);
    for (const key of keys) {
      assert.equal(typeof ROUND214_COPY[locale][key as keyof typeof ROUND214_COPY.en], "string");
      assert.ok(ROUND214_COPY[locale][key as keyof typeof ROUND214_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "crbTitle"), ROUND214_COPY.tr.crbTitle);
  assert.equal(crmv4Text("de", "rsdTitle"), ROUND214_COPY.de.rsdTitle);
  assert.equal(crmv4Text("ru", "crbSub"), ROUND214_COPY.ru.crbSub);
  assert.equal(crmv4Text("ar", "rsdSub"), ROUND214_COPY.ar.rsdSub);
  assert.equal(crmv4Text("en", "crbLogo"), "7FX");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-crb/);
  assert.match(css, /\.c4-rsd-index/);
  assert.match(css, /\.c4-support-crypt/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round214.tsx"), "utf8");
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
  assert.equal(viewFile.includes("validationStatus"), false);
  assert.equal(viewFile.includes("registrationDate"), false);
  assert.equal(viewFile.includes("birthDate"), false);
  assert.equal(viewFile.includes("lastContactAt"), false);
  assert.equal(viewFile.includes("assigneeId"), false);
  assert.equal(viewFile.includes("lastBrowser"), false);
  assert.match(viewFile, /isResident/);
  assert.match(viewFile, /chestsCsv/);
  assert.match(viewFile, /sealsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /event\.key === "s"/);
  assert.match(viewFile, /event\.key === "b"/);
  assert.match(viewFile, /event\.key === "h"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-chests/);
  assert.match(viewFile, /data-seals/);
  assert.match(viewFile, /data-catalog/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestTimber/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "crbx"/);
  assert.match(app, /view === "rsdl"/);
  assert.match(app, /CryptChests/);
  assert.match(app, /ResidencySeals/);
  const support = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Support.tsx"), "utf8");
  assert.match(support, /c4-support-crypt/);
  assert.match(support, /c4-support-crypt-index/);
  assert.match(support, /data-logo="mono"/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of used) assert.ok(key in ROUND214_COPY.en, key);
  console.log("crmv4 round214 tests passed");
}

main();
