/**
 * Lodestone needles, contact plates, the slate watch, and the vellum gauge.
 * Run: TZ=UTC npx tsx tests/crmv4-round288.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND288_COPY } from "../src/lib/crmv4/copy-round288";
import {
  ROUND288_FEATURES,
  activeDip,
  activeNeedle,
  activeStone,
  activeBed,
  addLodestone,
  bedGap,
  briskLodestone,
  contactCold,
  contactDeep,
  contactEven,
  contactGap,
  contactHue,
  contactLane,
  contactLanesCsv,
  contactLeap,
  contactMark,
  contactQuarter,
  contactQuiet,
  contactRowsCsv,
  contactSpace,
  contactState,
  contactStep,
  contactTail,
  contactToday,
  contactTwin,
  contactWarm,
  dropLodestoneView,
  fairBearer,
  firmBed,
  fullDip,
  houseStone,
  idleLodestone,
  lateLodestone,
  leadingContact,
  liftNeedle,
  lodestoneBand,
  lodestoneBed,
  lodestoneDip,
  lodestoneNeedle,
  lodestoneStone,
  lowerNeedle,
  moveLodestoneFocus,
  overdueLodestone,
  pairDip,
  readLodestoneViews,
  restingLodestone,
  softBed,
  suggestBed,
  suggestLodestoneStone,
  suggestNeedle,
  type ContactRow,
  type Lodestone,
} from "../src/lib/crmv4/round288";

const NOW = Date.parse("2026-11-13T12:00:00.000Z");

function needle(partial: Partial<Lodestone> & { id: string; title: string }): Lodestone {
  return {
    note: "",
    bearer: "",
    bed: "",
    needle: null,
    stone: "",
    dip: 1,
    tags: [],
    logged: false,
    locked: false,
    stowed: false,
    flagged: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND288_FEATURES.length, 25);
  assert.equal(lodestoneBed(" oak "), "oak");
  assert.equal(lodestoneBed("paris"), "");
  assert.equal(lodestoneNeedle("2"), 2);
  assert.equal(lodestoneNeedle(4), 4);
  assert.equal(lodestoneNeedle("6"), 6);
  assert.equal(lodestoneNeedle("3"), null);
  assert.equal(lodestoneNeedle("8"), null);
  assert.equal(lodestoneDip("1"), 1);
  assert.equal(lodestoneDip(3), 3);
  assert.equal(lodestoneDip("5"), 5);
  assert.equal(lodestoneDip("2"), null);
  assert.equal(lodestoneStone("iron"), "IRON");
  assert.equal(lodestoneStone("steel"), "STEEL");
  assert.equal(lodestoneStone("gilt"), "GILT");
  assert.equal(lodestoneStone("pitch"), "");
  assert.equal(firmBed("oak"), true);
  assert.equal(firmBed("SLATE"), true);
  assert.equal(firmBed("sand"), false);
  assert.equal(softBed("moss"), true);
  assert.equal(softBed("sand"), true);
  assert.equal(softBed("oak"), false);
  assert.equal(lodestoneBand("oak"), "north");
  assert.equal(lodestoneBand("slate"), "east");
  assert.equal(lodestoneBand("sand"), "south");
  assert.equal(lodestoneBand("moss"), "west");
  assert.equal(lodestoneBand(""), "");
  assert.equal(bedGap("oak", "slate"), 1);
  assert.equal(bedGap("slate", "oak"), -1);
  assert.equal(bedGap("", "oak"), null);
  assert.equal(houseStone("steel"), true);
  assert.equal(houseStone("GILT"), true);
  assert.equal(houseStone("iron"), false);
  assert.equal(pairDip(3), true);
  assert.equal(pairDip("3"), true);
  assert.equal(pairDip(1), false);
  assert.equal(fullDip(5), true);
  assert.equal(fullDip(3), false);
  assert.equal(activeBed("firm"), "firm");
  assert.equal(activeBed("oak"), "oak");
  assert.equal(activeBed("paris"), "all");
  assert.equal(activeNeedle("4"), "4");
  assert.equal(activeNeedle("3"), "all");
  assert.equal(activeStone("gilt", ["IRON", "STEEL", "GILT"]), "GILT");
  assert.equal(activeStone("mist", ["IRON", "STEEL", "GILT"]), "all");
  assert.equal(activeDip("3"), "3");
  assert.equal(activeDip("9"), "all");
  assert.equal(moveLodestoneFocus(0, 4, 1), 1);
  assert.equal(moveLodestoneFocus(0, 4, -1), 3);
  assert.equal(suggestLodestoneStone([]), "IRON");
  assert.equal(suggestNeedle([], 5), 2);
  assert.equal(suggestNeedle([], 10), 4);
  assert.equal(suggestNeedle([], 20), 6);
  assert.equal(suggestBed(8), "oak");
  assert.equal(suggestBed(12), "moss");
  assert.equal(fairBearer([needle({ id: "1", title: "Oak", bearer: "Ada" })], "Ada,Bea"), "Bea");

  const saved = addLodestone([], { id: "1", title: "Moss", bed: "moss", needle: 2, stone: "steel", dip: 1, bearer: "Ada" });
  assert.equal(saved[0].audit, "save");
  assert.equal(overdueLodestone(saved[0]), true);
  assert.equal(briskLodestone(saved[0]), false);
  assert.equal(liftNeedle(saved, "1")[0].needle, 4);
  assert.equal(lowerNeedle([{ ...saved[0], needle: null }], "1")[0].needle, 6);
  const quiet = needle({ id: "2", title: "Calm", bed: "moss", stone: "", needle: 2, dip: 1 });
  assert.equal(idleLodestone(quiet), true);
  assert.equal(lateLodestone(needle({ id: "4", title: "Late", bed: "oak", dip: 1 }), "moss"), true);
  const rest = needle({ id: "3", title: "Rest", bed: "moss", stone: "IRON", needle: 4, dip: 3 });
  assert.equal(restingLodestone(rest), true);
  assert.equal(briskLodestone(needle({ id: "5", title: "Keen", bed: "oak", stone: "GILT", needle: 6, dip: 5 })), true);
  const views = readLodestoneViews([{ id: "v1", name: "North", tray: "cabinet", bed: "firm", needle: "4", dip: "3", stone: "steel" }]);
  assert.equal(views[0].tray, "cabinet");
  assert.equal(views[0].bed, "firm");
  assert.equal(views[0].stone, "STEEL");
  assert.equal(dropLodestoneView(views, "v1").length, 0);

  assert.equal(contactLane("2026-11-13T11:00:00.000Z", NOW), "warm");
  assert.equal(contactWarm("2026-11-13T11:00:00.000Z", NOW), true);
  assert.equal(contactLane("2026-11-10T12:00:00.000Z", NOW), "week");
  assert.equal(contactLane("2026-10-20T12:00:00.000Z", NOW), "month");
  assert.equal(contactLane("2026-09-01T12:00:00.000Z", NOW), "season");
  assert.equal(contactLane("2026-06-01T12:00:00.000Z", NOW), "cold");
  assert.equal(contactCold("2026-06-01T12:00:00.000Z", NOW), true);
  assert.equal(contactLane("", NOW), "");
  assert.equal(contactQuiet(""), true);
  assert.equal(contactQuiet({ lastContactAt: "2026-11-13T11:00:00.000Z" }), false);
  assert.equal(contactHue("2026-11-13T11:00:00.000Z", NOW), "champagne");
  assert.equal(contactHue("2026-06-01T12:00:00.000Z", NOW), "graphite");
  assert.equal(contactHue("2026-11-10T12:00:00.000Z", NOW), "ivory");
  assert.equal(contactToday("2026-11-13T11:00:00.000Z", NOW), true);
  assert.equal(contactToday("2026-11-12T11:00:00.000Z", NOW), false);
  assert.equal(contactQuarter("2026-10-20T12:00:00.000Z", NOW), true);
  assert.equal(contactQuarter("2026-08-01T12:00:00.000Z", NOW), false);
  assert.equal(contactEven("2026-11-12T11:00:00.000Z", NOW), true);
  assert.equal(contactEven("2026-11-13T11:00:00.000Z", NOW), false);
  assert.equal(contactStep("2026-11-13T11:00:00.000Z", NOW), 11);
  assert.equal(contactStep("", NOW), 0);
  assert.equal(contactLeap("2024-11-13T11:00:00.000Z", NOW), true);
  assert.equal(contactLeap("2026-11-13T11:00:00.000Z", NOW), false);
  assert.equal(contactGap("2026-10-20T12:00:00.000Z", NOW), true);
  assert.equal(contactGap("2026-11-10T12:00:00.000Z", NOW), false);
  assert.equal(contactDeep("2026-09-01T12:00:00.000Z", NOW), true);
  assert.equal(contactDeep("2026-10-20T12:00:00.000Z", NOW), false);
  assert.equal(contactTwin("2026-11-05T12:00:00.000Z", NOW), true);
  assert.equal(contactTwin("2026-11-13T11:00:00.000Z", NOW), false);
  assert.equal(contactTail("2026-11-13T11:00:00.000Z"), true);
  assert.equal(contactTail("2026-11-13T11:00:00"), false);
  assert.equal(contactMark("2026-11-13T11:00:00.000Z"), true);
  assert.equal(contactSpace("2026-11-13 11:00:00Z"), true);
  assert.equal(contactState({ lastContactAt: "2026-11-13T11:00:00.000Z", amount: 3 }, NOW), "");
  assert.equal(contactState("", NOW), "clear");
  assert.equal(contactState({ city: "x" }, NOW), "");
  const rows: ContactRow[] = [
    { id: "1", label: "Ada", touched: "2026-11-13T11:00:00.000Z" },
    { id: "2", label: "Bea", touched: "2026-11-10T12:00:00.000Z" },
  ];
  assert.equal(leadingContact(rows, NOW), "warm");
  assert.match(contactLanesCsv(rows, NOW), /warm,1/);
  assert.match(contactLanesCsv(rows, NOW), /week,1/);
  assert.match(contactRowsCsv(rows, ["1"], NOW), /Ada,2026-11-13T11:00:00.000Z/);

  const locales = ["en", "tr", "de", "ru", "ar"] as const;
  const keys = Object.keys(ROUND288_COPY.en).sort();
  for (const locale of locales) assert.deepEqual(Object.keys(ROUND288_COPY[locale]).sort(), keys);
  assert.equal(crmv4Text("tr", "ldnTitle"), ROUND288_COPY.tr.ldnTitle);
  assert.equal(crmv4Text("de", "ctcTitle"), ROUND288_COPY.de.ctcTitle);
  assert.equal(crmv4Text("ru", "ldnSub"), ROUND288_COPY.ru.ldnSub);
  assert.equal(crmv4Text("ar", "ctcSub"), ROUND288_COPY.ar.ctcSub);
  assert.equal(crmv4Text("en", "ldnLogo"), "7FX");
  assert.equal(crmv4Text("en", "ctcLogo"), "7FX");
  assert.equal(crmv4Text("en", "ldnTitle"), "Lodestone needles");
  assert.equal(crmv4Text("en", "ctcTitle"), "Recall plates");
  assert.equal(crmv4Text("en", "rwSlateKicker"), "Slate watch");
  assert.equal(crmv4Text("en", "mdVellumKicker"), "Vellum gauge");
  assert.notEqual(ROUND288_COPY.tr.ldnTitle, ROUND288_COPY.en.ldnTitle);
  assert.notEqual(ROUND288_COPY.ar.ctcTitle, ROUND288_COPY.en.ctcTitle);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-lodestone/);
  assert.match(css, /\.c4-contact-index/);
  assert.match(css, /\.c4-lodestone-column/);
  assert.match(css, /\.c4-contact-column/);
  assert.match(css, /\.c4-slate-watch/);
  assert.match(css, /\.c4-vellum-gauge-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round288.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /lastContactAt:/);
  assert.match(viewFile, /lodestoneCsv/);
  assert.match(viewFile, /contactRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "l"/);
  assert.match(viewFile, /event\.key === "g"/);
  assert.match(viewFile, /event\.key === "v"/);
  assert.match(viewFile, /event\.key === "s"/);
  assert.match(viewFile, /event\.key === "f"/);
  assert.match(viewFile, /event\.key === "q"/);
  assert.match(viewFile, /event\.key === "u"/);
  assert.match(viewFile, /event\.key === "y"/);
  assert.match(viewFile, /event\.key === "m"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0&role=TRADER/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestLodestoneStone/);
  assert.match(viewFile, /c4-contact-search/);
  assert.match(viewFile, /lodestoneTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "ldn"/);
  assert.match(app, /view === "ctc"/);
  const desk = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round78.tsx"), "utf8");
  assert.match(desk, /c4-slate-watch/);
  assert.match(desk, /c4-slate-watch-seal/);
  assert.match(desk, /c4-slate-watch-mast/);
  assert.match(desk, /c4-vellum-gauge/);
  assert.match(desk, /c4-vellum-gauge-mast/);
  assert.match(desk, /data-logo="mono"/);
  assert.match(desk, /rwSlateKicker/);
  assert.match(desk, /rwSlateLead/);
  assert.match(desk, /mdVellumKicker/);
  assert.match(desk, /mdVellumLead/);
  assert.match(desk, /aria-required=\{false\}/);
  assert.match(desk, /data-risk-watch/);
  assert.match(desk, /data-mail-density/);
  assert.equal(desk.includes("sendJson"), false);
  assert.equal(desk.includes("setInterval"), false);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND288_COPY.en, key);
  const named = viewFile.match(/"(ldn|ctc|rwSlate|mdVellum)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of named) assert.ok(key in ROUND288_COPY.en, key);
  const slate = desk.match(/v4\("((?:rwSlate|mdVellum)[a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || [];
  for (const key of slate) assert.ok(key in ROUND288_COPY.en, key);
  console.log("crmv4 round288 tests passed");
}

main();
