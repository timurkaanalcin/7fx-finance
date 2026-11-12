/**
 * Fountain pens and mail crests.
 * Run: TZ=UTC npx tsx tests/crmv4-round218.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND218_COPY } from "../src/lib/crmv4/copy-round218";
import {
  activeDrops,
  activeFlow,
  activeNib,
  addPen,
  addPenTag,
  addPenView,
  adjacentPenCount,
  catalogCrest,
  catalogCrestCount,
  crestLane,
  crestOf,
  crestRowsCsv,
  crestState,
  crestStep,
  crestTone,
  crestsCsv,
  cycleFlow,
  densityOf,
  dropsOf,
  fairScribe,
  houseInk,
  inkOf,
  latePen,
  leadingCrest,
  moveFocus,
  nibGap,
  nibOf,
  peakNib,
  quietNib,
  readPenViews,
  setPenWeight,
  sharedCrestCount,
  snoozePen,
  suggestDrops,
  suggestInk,
  weightOf,
  wideCrest,
  windowPens,
  pensCsv,
} from "../src/lib/crmv4/round218";

function main() {
  assert.equal(inkOf("  ivory "), "IVORY");
  assert.equal(inkOf("graphite"), "GRAPHITE");
  assert.equal(inkOf("champagne"), "CHAMPAGNE");
  assert.equal(inkOf("   "), "");
  assert.equal(inkOf("oak"), "");
  assert.equal(nibOf("1"), 1);
  assert.equal(nibOf(9), 9);
  assert.equal(nibOf("9"), 9);
  assert.equal(nibOf("0"), null);
  assert.equal(nibOf(0), null);
  assert.equal(nibOf("10"), null);
  assert.equal(nibOf("09"), null);
  assert.equal(nibOf(""), null);
  assert.equal(nibOf(1.5), null);
  assert.equal(dropsOf("3"), 3);
  assert.equal(dropsOf(6), 6);
  assert.equal(dropsOf("9"), 9);
  assert.equal(dropsOf("2"), null);
  assert.equal(dropsOf("03"), null);
  assert.equal(weightOf("0"), 0);
  assert.equal(weightOf(3), 3);
  assert.equal(weightOf("6"), 6);
  assert.equal(weightOf("1"), null);
  assert.equal(peakNib(2), true);
  assert.equal(peakNib(5), true);
  assert.equal(peakNib(4), false);
  assert.equal(quietNib(9), true);
  assert.equal(quietNib(1), false);
  assert.equal(nibGap(1, 9), 8);
  assert.equal(nibGap(9, 1), -8);
  assert.equal(nibGap(null, 3), null);
  assert.equal(nibGap(1, 0), null);
  assert.equal(houseInk("ivory"), true);
  assert.equal(houseInk("CHAMPAGNE"), true);
  assert.equal(houseInk("graphite"), false);
  assert.equal(activeNib("peak"), "peak");
  assert.equal(activeNib("9"), "9");
  assert.equal(activeNib("10"), "all");
  assert.equal(activeDrops("6"), "6");
  assert.equal(activeDrops("2"), "all");
  assert.equal(activeFlow("flood", ["dry", "wet", "flood"]), "flood");
  assert.equal(activeFlow("nope", ["dry", "wet", "flood"]), "all");
  assert.equal(densityOf("tight"), "tight");
  assert.equal(densityOf("nope"), "airy");
  assert.equal(moveFocus(0, 3, 1), 1);
  assert.equal(moveFocus(0, 3, -1), 2);
  assert.equal(suggestInk([]), "IVORY");
  assert.equal(suggestDrops([]), 6);

  const first = addPen([], {
    id: "a",
    title: "  North proof ",
    note: "quiet",
    scribe: "Ada",
    nib: "1",
    ink: "ivory",
    flow: "dry",
    drops: "3",
    tags: "a b c d z",
    weight: "3",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North proof");
  assert.equal(first[0].ink, "IVORY");
  assert.equal(first[0].nib, 1);
  assert.equal(first[0].drops, 3);
  assert.deepEqual(first[0].tags, ["a", "b", "c"]);
  assert.equal(first[0].weight, 3);
  assert.equal(first[0].audit, "save");
  assert.equal(addPen(first, { id: "a", title: "Other" }).length, 1);
  assert.equal(addPen(first, { id: "b", title: "North proof" }).length, 1);
  assert.equal(addPen(first, { id: "c", title: "   " }).length, 1);
  const flowed = cycleFlow([{ ...first[0], flow: "" }], "a");
  assert.equal(flowed[0].flow, "dry");
  assert.equal(cycleFlow(flowed, "a")[0].flow, "wet");
  assert.equal(cycleFlow(cycleFlow(flowed, "a"), "a")[0].flow, "flood");
  assert.equal(cycleFlow(cycleFlow(cycleFlow(flowed, "a"), "a"), "a")[0].flow, "dry");
  assert.equal(addPenTag(first, "a", "d").length, 1);
  assert.equal(addPenTag(first, "a", "d")[0].tags.length, 3);
  assert.equal(addPenTag(first, "a", "a")[0].tags.length, 3);
  assert.equal(addPenTag(first, "a", "z")[0].tags.length, 3);
  assert.equal(setPenWeight(first, "a", 0)[0].weight, 0);
  assert.equal(setPenWeight(first, "a", 1)[0].weight, 3);
  const snoozed = snoozePen([{ ...first[0], drops: null }], "a");
  assert.equal(snoozed[0].drops, 3);
  assert.equal(snoozePen(snoozed, "a")[0].drops, 6);
  assert.equal(snoozePen(snoozePen(snoozed, "a"), "a")[0].drops, 9);
  assert.equal(snoozePen(snoozePen(snoozePen(snoozed, "a"), "a"), "a")[0].drops, 9);

  const open = [{ ...first[0], weight: 0, held: false, archived: false }];
  assert.equal(latePen(open[0], 9), true);
  assert.equal(latePen({ ...open[0], nib: 8 }, 9), false);
  assert.equal(latePen({ ...open[0], nib: 7 }, 9), true);
  assert.equal(latePen({ ...open[0], weight: 3 }, 9), false);
  assert.equal(windowPens([{ ...open[0], nib: 8 }], 9).length, 1);
  assert.equal(windowPens([{ ...open[0], nib: 1 }], 9).length, 0);
  assert.equal(fairScribe(open, "Bea, Ada"), "Bea");
  const pair = addPen(addPen([], { id: "p", title: "One", nib: 1, ink: "ivory" }), { id: "q", title: "Five", nib: 5, ink: "ivory" });
  assert.equal(adjacentPenCount(pair), 2);

  const views = addPenView([], {
    id: "v1",
    name: "Peak",
    tray: "open",
    query: "",
    scribe: "all",
    ink: "IVORY",
    flow: "dry",
    nib: "peak",
    drops: "3",
    weight: "0",
  });
  assert.equal(readPenViews(views)[0].nib, "peak");
  assert.equal(readPenViews(views)[0].ink, "IVORY");

  const csv = pensCsv(open, 9);
  assert.match(csv, /North proof,Ada,1,IVORY/);
  assert.match(csv, /,8,/);

  assert.equal(crestOf("desk@7fx.com"), "7FX.");
  assert.equal(crestOf("pen@loft.io"), "LOFT");
  assert.equal(crestLane("desk@7fx.com"), "hearth");
  assert.equal(crestLane("ivory@desk.tr"), "hearth");
  assert.equal(crestLane("hello+desk@court.net"), "court");
  assert.equal(crestLane("plain"), "porch");
  assert.equal(crestLane("a@b"), "porch");
  assert.equal(crestTone("desk@7fx.com"), "gilt");
  assert.equal(crestTone("ivory@desk.tr"), "ivory");
  assert.equal(crestTone("a@b.c"), "mist");
  assert.equal(crestTone("user1@shop.org"), "ink");
  assert.equal(crestState(""), "clear");
  assert.equal(crestState(null), "clear");
  assert.equal(crestState({ email: "desk@7fx.com" }), "set");
  assert.equal(crestState({ email: "desk@7fx.com", phone: "1" }), "");
  assert.equal(catalogCrest("desk@7fx.com"), true);
  assert.equal(catalogCrest("a@b.c"), true);
  assert.equal(catalogCrest("pen@loft.io"), true);
  assert.equal(catalogCrest("ada@7fx.com"), false);
  assert.equal(wideCrest("desk@7fx.com"), false);
  assert.equal(wideCrest("hello+desk@court.net"), true);
  assert.equal(crestStep(""), 0);
  assert.equal(crestStep("desk@7fx.com"), 1);
  assert.equal(crestStep("hello+desk@court.net"), 2);
  assert.equal(crestStep("a@b.co.uk"), 3);
  const people = [
    { id: "1", label: "Ada", note: "ada@7fx.com" },
    { id: "2", label: "Bea", note: "desk@7fx.com" },
    { id: "3", label: "Cy", note: "hello+desk@court.net" },
  ];
  assert.equal(leadingCrest(people), "hearth");
  assert.equal(sharedCrestCount(people), 2);
  assert.equal(catalogCrestCount(people), 1);
  assert.match(crestsCsv(people), /hearth,2/);
  assert.match(crestRowsCsv(people, ["2"]), /Bea,7FX\.,hearth,gilt,1,1,0,1/);

  const keys = Object.keys(ROUND218_COPY.en);
  assert.ok(keys.length >= 120);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND218_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND218_COPY[locale][key as keyof typeof ROUND218_COPY.en], "string");
      assert.ok(ROUND218_COPY[locale][key as keyof typeof ROUND218_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "fpnTitle"), ROUND218_COPY.tr.fpnTitle);
  assert.equal(crmv4Text("de", "mcrTitle"), ROUND218_COPY.de.mcrTitle);
  assert.equal(crmv4Text("ru", "fpnSub"), ROUND218_COPY.ru.fpnSub);
  assert.equal(crmv4Text("ar", "mcrSub"), ROUND218_COPY.ar.mcrSub);
  assert.equal(crmv4Text("en", "fpnLogo"), "7FX");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-fpn/);
  assert.match(css, /\.c4-mcr-index/);
  assert.match(css, /\.c4-goals-gallery/);
  assert.match(css, /\.c4-mcr-time/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round218.tsx"), "utf8");
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
  assert.equal(viewFile.includes("phone"), false);
  assert.match(viewFile, /email/);
  assert.match(viewFile, /pensCsv/);
  assert.match(viewFile, /crestsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /event\.key === "l"/);
  assert.match(viewFile, /event\.key === "s"/);
  assert.match(viewFile, /event\.key === "t"/);
  assert.match(viewFile, /event\.key === "h"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-pens/);
  assert.match(viewFile, /data-crests/);
  assert.match(viewFile, /data-catalog/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestInk/);
  assert.match(viewFile, /c4-mcr-time/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "fpen"/);
  assert.match(app, /view === "mcrs"/);
  assert.match(app, /FountainPens/);
  assert.match(app, /MailCrests/);
  const goals = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round25.tsx"), "utf8");
  assert.match(goals, /c4-goals-gallery/);
  assert.match(goals, /c4-goals-gallery-index/);
  assert.match(goals, /data-logo="mono"/);
  assert.match(goals, /c4-goals-night/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of used) assert.ok(key in ROUND218_COPY.en, key);
  console.log("crmv4 round218 tests passed");
}

main();
