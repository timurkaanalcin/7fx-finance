/**
 * Chapter slips and partner ribbons.
 * Run: TZ=UTC npx tsx tests/crmv4-round216.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND216_COPY } from "../src/lib/crmv4/copy-round216";
import {
  activeBay,
  activeMark,
  activeMinutes,
  addSlip,
  addSlipTag,
  addSlipView,
  adjacentSlipCount,
  bayGap,
  bayOf,
  catalogRibbon,
  catalogRibbonCount,
  clothOf,
  cycleMark,
  densityOf,
  fairCaller,
  houseCloth,
  lateSlip,
  leadingRibbon,
  minutesOf,
  moveFocus,
  peakBay,
  quietBay,
  readSlipViews,
  ribbonLane,
  ribbonOf,
  ribbonRowsCsv,
  ribbonState,
  ribbonStep,
  ribbonTone,
  ribbonsCsv,
  setSlipWeight,
  sharedRibbonCount,
  slipsCsv,
  snoozeSlip,
  suggestCloth,
  suggestMinutes,
  weightOf,
  wideRibbon,
  windowSlips,
} from "../src/lib/crmv4/round216";

function main() {
  assert.equal(clothOf("  silk "), "SILK");
  assert.equal(clothOf("linen"), "LINEN");
  assert.equal(clothOf("wool"), "WOOL");
  assert.equal(clothOf("   "), "");
  assert.equal(clothOf("oak"), "");
  assert.equal(bayOf("1"), 1);
  assert.equal(bayOf(6), 6);
  assert.equal(bayOf("6"), 6);
  assert.equal(bayOf("0"), null);
  assert.equal(bayOf(0), null);
  assert.equal(bayOf("7"), null);
  assert.equal(bayOf("06"), null);
  assert.equal(bayOf(""), null);
  assert.equal(bayOf(1.5), null);
  assert.equal(minutesOf("15"), 15);
  assert.equal(minutesOf(30), 30);
  assert.equal(minutesOf("60"), 60);
  assert.equal(minutesOf("45"), null);
  assert.equal(minutesOf("015"), null);
  assert.equal(weightOf("0"), 0);
  assert.equal(weightOf(1), 1);
  assert.equal(weightOf("3"), 3);
  assert.equal(weightOf("2"), null);
  assert.equal(peakBay(2), true);
  assert.equal(peakBay(5), true);
  assert.equal(peakBay(3), false);
  assert.equal(quietBay(6), true);
  assert.equal(quietBay(1), false);
  assert.equal(bayGap(1, 6), 5);
  assert.equal(bayGap(6, 1), -5);
  assert.equal(bayGap(null, 3), null);
  assert.equal(bayGap(1, 0), null);
  assert.equal(houseCloth("silk"), true);
  assert.equal(houseCloth("WOOL"), true);
  assert.equal(houseCloth("linen"), false);
  assert.equal(activeBay("peak"), "peak");
  assert.equal(activeBay("6"), "6");
  assert.equal(activeBay("9"), "all");
  assert.equal(activeMinutes("30"), "30");
  assert.equal(activeMinutes("45"), "all");
  assert.equal(activeMark("drop", ["wait", "keep", "drop"]), "drop");
  assert.equal(activeMark("nope", ["wait", "keep", "drop"]), "all");
  assert.equal(densityOf("low"), "low");
  assert.equal(densityOf("nope"), "tall");
  assert.equal(moveFocus(0, 3, 1), 1);
  assert.equal(moveFocus(0, 3, -1), 2);
  assert.equal(suggestCloth([]), "SILK");
  assert.equal(suggestMinutes([]), 30);

  const first = addSlip([], {
    id: "a",
    title: "  North proof ",
    note: "quiet",
    caller: "Ada",
    bay: "1",
    cloth: "silk",
    mark: "wait",
    minutes: "15",
    tags: "a b c d z",
    weight: "1",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North proof");
  assert.equal(first[0].cloth, "SILK");
  assert.equal(first[0].bay, 1);
  assert.equal(first[0].minutes, 15);
  assert.deepEqual(first[0].tags, ["a", "b"]);
  assert.equal(first[0].weight, 1);
  assert.equal(first[0].audit, "save");
  assert.equal(addSlip(first, { id: "a", title: "Other" }).length, 1);
  assert.equal(addSlip(first, { id: "b", title: "North proof" }).length, 1);
  assert.equal(addSlip(first, { id: "c", title: "   " }).length, 1);
  const kept = cycleMark([{ ...first[0], mark: "" }], "a");
  assert.equal(kept[0].mark, "wait");
  assert.equal(cycleMark(kept, "a")[0].mark, "keep");
  assert.equal(cycleMark(cycleMark(kept, "a"), "a")[0].mark, "drop");
  assert.equal(cycleMark(cycleMark(cycleMark(kept, "a"), "a"), "a")[0].mark, "wait");
  assert.equal(addSlipTag(first, "a", "c").length, 1);
  assert.equal(addSlipTag(first, "a", "c")[0].tags.length, 2);
  assert.equal(addSlipTag(first, "a", "a")[0].tags.length, 2);
  assert.equal(addSlipTag(first, "a", "e")[0].tags.length, 2);
  assert.equal(setSlipWeight(first, "a", 0)[0].weight, 0);
  assert.equal(setSlipWeight(first, "a", 2)[0].weight, 1);
  const snoozed = snoozeSlip([{ ...first[0], minutes: null }], "a");
  assert.equal(snoozed[0].minutes, 15);
  assert.equal(snoozeSlip(snoozed, "a")[0].minutes, 30);
  assert.equal(snoozeSlip(snoozeSlip(snoozed, "a"), "a")[0].minutes, 60);
  assert.equal(snoozeSlip(snoozeSlip(snoozeSlip(snoozed, "a"), "a"), "a")[0].minutes, 60);

  const open = [{ ...first[0], weight: 0, held: false, archived: false }];
  assert.equal(lateSlip(open[0], 6), true);
  assert.equal(lateSlip({ ...open[0], bay: 5 }, 6), false);
  assert.equal(lateSlip({ ...open[0], bay: 4 }, 6), true);
  assert.equal(lateSlip({ ...open[0], weight: 3 }, 6), false);
  assert.equal(windowSlips([{ ...open[0], bay: 5 }], 6).length, 1);
  assert.equal(windowSlips([{ ...open[0], bay: 1 }], 6).length, 0);
  assert.equal(fairCaller(open, "Bea, Ada"), "Bea");
  const pair = addSlip(addSlip([], { id: "p", title: "One", bay: 1, cloth: "wool" }), { id: "q", title: "Three", bay: 3, cloth: "wool" });
  assert.equal(adjacentSlipCount(pair), 2);

  const views = addSlipView([], {
    id: "v1",
    name: "Peak",
    tray: "open",
    query: "",
    caller: "all",
    cloth: "SILK",
    mark: "wait",
    bay: "peak",
    minutes: "15",
    weight: "0",
  });
  assert.equal(readSlipViews(views)[0].bay, "peak");
  assert.equal(readSlipViews(views)[0].cloth, "SILK");

  const csv = slipsCsv(open, 6);
  assert.match(csv, /North proof,Ada,1,SILK/);
  assert.match(csv, /,5,/);

  assert.equal(ribbonOf("B7"), "B7");
  assert.equal(ribbonOf("northwind"), "NO");
  assert.equal(ribbonLane("B7"), "west");
  assert.equal(ribbonLane("north"), "east");
  assert.equal(ribbonLane("21"), "court");
  assert.equal(ribbonTone("B7"), "gilt");
  assert.equal(ribbonTone("21"), "ivory");
  assert.equal(ribbonTone("HOUSE"), "mist");
  assert.equal(ribbonTone("A1"), "ink");
  assert.equal(ribbonState(""), "clear");
  assert.equal(ribbonState(null), "clear");
  assert.equal(ribbonState({ affiliateB: "B7" }), "set");
  assert.equal(ribbonState({ affiliateB: "B7", email: "a@b.c" }), "");
  assert.equal(catalogRibbon("B7"), true);
  assert.equal(catalogRibbon("b21"), true);
  assert.equal(catalogRibbon("B70"), false);
  assert.equal(wideRibbon("HOUSE"), false);
  assert.equal(wideRibbon("northwind"), true);
  assert.equal(ribbonStep(""), 0);
  assert.equal(ribbonStep("12"), 1);
  assert.equal(ribbonStep("HOUSE"), 2);
  assert.equal(ribbonStep("B7"), 3);
  const people = [
    { id: "1", label: "Ada", note: "B7" },
    { id: "2", label: "Bea", note: "B70" },
    { id: "3", label: "Cy", note: "northwind" },
  ];
  assert.equal(leadingRibbon(people), "west");
  assert.equal(sharedRibbonCount(people), 2);
  assert.equal(catalogRibbonCount(people), 1);
  assert.match(ribbonsCsv(people), /west,2/);
  assert.match(ribbonRowsCsv(people, ["2"]), /Bea,B7,west,gilt,3,0,0,1/);

  const keys = Object.keys(ROUND216_COPY.en);
  assert.ok(keys.length >= 120);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND216_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND216_COPY[locale][key as keyof typeof ROUND216_COPY.en], "string");
      assert.ok(ROUND216_COPY[locale][key as keyof typeof ROUND216_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "chsTitle"), ROUND216_COPY.tr.chsTitle);
  assert.equal(crmv4Text("de", "pbrTitle"), ROUND216_COPY.de.pbrTitle);
  assert.equal(crmv4Text("ru", "chsSub"), ROUND216_COPY.ru.chsSub);
  assert.equal(crmv4Text("ar", "pbrSub"), ROUND216_COPY.ar.pbrSub);
  assert.equal(crmv4Text("en", "chsLogo"), "7FX");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-chsl/);
  assert.match(css, /\.c4-pbr-index/);
  assert.match(css, /\.c4-access-chapter/);
  assert.match(css, /\.c4-pbr-time/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round216.tsx"), "utf8");
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
  assert.equal(viewFile.includes("isResident"), false);
  assert.match(viewFile, /affiliateB/);
  assert.match(viewFile, /slipsCsv/);
  assert.match(viewFile, /ribbonsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /event\.key === "m"/);
  assert.match(viewFile, /event\.key === "r"/);
  assert.match(viewFile, /event\.key === "b"/);
  assert.match(viewFile, /event\.key === "h"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-slips/);
  assert.match(viewFile, /data-ribbons/);
  assert.match(viewFile, /data-catalog/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestCloth/);
  assert.match(viewFile, /c4-pbr-time/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "chsl"/);
  assert.match(app, /view === "pbrb"/);
  assert.match(app, /ChapterSlips/);
  assert.match(app, /PartnerRibbons/);
  const access = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round46.tsx"), "utf8");
  assert.match(access, /c4-access-chapter/);
  assert.match(access, /c4-access-chapter-index/);
  assert.match(access, /data-logo="mono"/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of used) assert.ok(key in ROUND216_COPY.en, key);
  console.log("crmv4 round216 tests passed");
}

main();
