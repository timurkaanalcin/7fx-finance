/**
 * Gnomon staffs, tenure plates, the gilt rail, and the ivory call book.
 * Run: TZ=UTC npx tsx tests/crmv4-round287.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND287_COPY } from "../src/lib/crmv4/copy-round287";
import {
  ROUND287_FEATURES,
  activeHeight,
  activeMetal,
  activeShadow,
  activeStyle,
  addGnomon,
  briskGnomon,
  dipHeight,
  dropGnomonView,
  fairKeeper,
  firmStyle,
  fullShadow,
  gnomonBand,
  gnomonHeight,
  gnomonMetal,
  gnomonShadow,
  gnomonStyle,
  houseMetal,
  idleGnomon,
  lateGnomon,
  leadingTenure,
  liftHeight,
  moveGnomonFocus,
  overdueGnomon,
  pairShadow,
  readGnomonViews,
  restingGnomon,
  softStyle,
  styleGap,
  suggestGnomonMetal,
  suggestHeight,
  suggestStyle,
  tenureFresh,
  tenureGrove,
  tenureHue,
  tenureLane,
  tenureLanesCsv,
  tenureLeap,
  tenureLong,
  tenureMark,
  tenureMonth,
  tenureOdd,
  tenureQuiet,
  tenureRowsCsv,
  tenureSpace,
  tenureSpan,
  tenureState,
  tenureStep,
  tenureTail,
  tenureToday,
  tenureTwin,
  type Gnomon,
  type TenureRow,
} from "../src/lib/crmv4/round287";

const NOW = Date.parse("2026-11-13T12:00:00.000Z");

function staff(partial: Partial<Gnomon> & { id: string; title: string }): Gnomon {
  return {
    note: "",
    keeper: "",
    style: "",
    height: null,
    metal: "",
    shadow: 1,
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
  assert.equal(ROUND287_FEATURES.length, 25);
  assert.equal(gnomonStyle(" lawn "), "lawn");
  assert.equal(gnomonStyle("paris"), "");
  assert.equal(gnomonHeight("3"), 3);
  assert.equal(gnomonHeight(5), 5);
  assert.equal(gnomonHeight("9"), 9);
  assert.equal(gnomonHeight("4"), null);
  assert.equal(gnomonHeight("16"), null);
  assert.equal(gnomonShadow("1"), 1);
  assert.equal(gnomonShadow(2), 2);
  assert.equal(gnomonShadow("4"), 4);
  assert.equal(gnomonShadow("3"), null);
  assert.equal(gnomonMetal("ash"), "ASH");
  assert.equal(gnomonMetal("brass"), "BRASS");
  assert.equal(gnomonMetal("gilt"), "GILT");
  assert.equal(gnomonMetal("pitch"), "");
  assert.equal(firmStyle("lawn"), true);
  assert.equal(firmStyle("WALL"), true);
  assert.equal(firmStyle("roof"), false);
  assert.equal(softStyle("pier"), true);
  assert.equal(softStyle("roof"), true);
  assert.equal(softStyle("lawn"), false);
  assert.equal(gnomonBand("lawn"), "morning");
  assert.equal(gnomonBand("wall"), "midday");
  assert.equal(gnomonBand("roof"), "evening");
  assert.equal(gnomonBand("pier"), "night");
  assert.equal(gnomonBand(""), "");
  assert.equal(styleGap("lawn", "wall"), 1);
  assert.equal(styleGap("wall", "lawn"), -1);
  assert.equal(styleGap("", "lawn"), null);
  assert.equal(houseMetal("brass"), true);
  assert.equal(houseMetal("GILT"), true);
  assert.equal(houseMetal("ash"), false);
  assert.equal(pairShadow(2), true);
  assert.equal(pairShadow("2"), true);
  assert.equal(pairShadow(1), false);
  assert.equal(fullShadow(4), true);
  assert.equal(fullShadow(2), false);
  assert.equal(activeStyle("firm"), "firm");
  assert.equal(activeStyle("lawn"), "lawn");
  assert.equal(activeStyle("paris"), "all");
  assert.equal(activeHeight("5"), "5");
  assert.equal(activeHeight("4"), "all");
  assert.equal(activeMetal("gilt", ["ASH", "BRASS", "GILT"]), "GILT");
  assert.equal(activeMetal("mist", ["ASH", "BRASS", "GILT"]), "all");
  assert.equal(activeShadow("2"), "2");
  assert.equal(activeShadow("9"), "all");
  assert.equal(moveGnomonFocus(0, 4, 1), 1);
  assert.equal(moveGnomonFocus(0, 4, -1), 3);
  assert.equal(suggestGnomonMetal([]), "ASH");
  assert.equal(suggestHeight([], 5), 3);
  assert.equal(suggestHeight([], 10), 5);
  assert.equal(suggestHeight([], 20), 9);
  assert.equal(suggestStyle(8), "lawn");
  assert.equal(suggestStyle(12), "pier");
  assert.equal(fairKeeper([staff({ id: "1", title: "Lawn", keeper: "Ada" })], "Ada,Bea"), "Bea");

  const saved = addGnomon([], { id: "1", title: "Pier", style: "pier", height: 3, metal: "brass", shadow: 1, keeper: "Ada" });
  assert.equal(saved[0].audit, "save");
  assert.equal(overdueGnomon(saved[0]), true);
  assert.equal(briskGnomon(saved[0]), false);
  assert.equal(liftHeight(saved, "1")[0].height, 5);
  assert.equal(dipHeight([{ ...saved[0], height: null }], "1")[0].height, 9);
  const quiet = staff({ id: "2", title: "Calm", style: "pier", metal: "", height: 3, shadow: 1 });
  assert.equal(idleGnomon(quiet), true);
  assert.equal(lateGnomon(staff({ id: "4", title: "Late", style: "lawn", shadow: 1 }), "pier"), true);
  const rest = staff({ id: "3", title: "Rest", style: "pier", metal: "ASH", height: 5, shadow: 2 });
  assert.equal(restingGnomon(rest), true);
  assert.equal(briskGnomon(staff({ id: "5", title: "Keen", style: "lawn", metal: "GILT", height: 9, shadow: 4 })), true);
  const views = readGnomonViews([{ id: "v1", name: "Morning", tray: "closet", style: "firm", height: "5", shadow: "2", metal: "brass" }]);
  assert.equal(views[0].tray, "closet");
  assert.equal(views[0].style, "firm");
  assert.equal(views[0].metal, "BRASS");
  assert.equal(dropGnomonView(views, "v1").length, 0);

  assert.equal(tenureLane("2026-11-13T08:00:00.000Z", NOW), "fresh");
  assert.equal(tenureFresh("2026-11-13T08:00:00.000Z", NOW), true);
  assert.equal(tenureLane("2026-11-10T12:00:00.000Z", NOW), "sprout");
  assert.equal(tenureLane("2026-10-20T12:00:00.000Z", NOW), "sapling");
  assert.equal(tenureLane("2026-09-01T12:00:00.000Z", NOW), "timber");
  assert.equal(tenureLane("2026-07-01T12:00:00.000Z", NOW), "grove");
  assert.equal(tenureGrove("2026-07-01T12:00:00.000Z", NOW), true);
  assert.equal(tenureLane("", NOW), "");
  assert.equal(tenureQuiet(""), true);
  assert.equal(tenureQuiet({ createdAt: "2026-11-13T08:00:00.000Z" }), false);
  assert.equal(tenureHue("2026-11-13T08:00:00.000Z", NOW), "champagne");
  assert.equal(tenureHue("2026-07-01T12:00:00.000Z", NOW), "graphite");
  assert.equal(tenureHue("2026-11-10T12:00:00.000Z", NOW), "ivory");
  assert.equal(tenureToday("2026-11-13T08:00:00.000Z", NOW), true);
  assert.equal(tenureToday("2026-11-12T08:00:00.000Z", NOW), false);
  assert.equal(tenureMonth("2026-11-02T08:00:00.000Z", NOW), true);
  assert.equal(tenureMonth("2026-10-02T08:00:00.000Z", NOW), false);
  assert.equal(tenureOdd("2026-11-13T08:00:00.000Z", NOW), true);
  assert.equal(tenureOdd("2026-11-12T08:00:00.000Z", NOW), false);
  assert.equal(tenureStep("2026-11-13T08:00:00.000Z", NOW), 13);
  assert.equal(tenureStep("", NOW), 0);
  assert.equal(tenureLeap("2024-11-13T08:00:00.000Z", NOW), true);
  assert.equal(tenureLeap("2026-11-13T08:00:00.000Z", NOW), false);
  assert.equal(tenureSpan("2026-10-20T12:00:00.000Z", NOW), true);
  assert.equal(tenureSpan("2026-11-10T12:00:00.000Z", NOW), false);
  assert.equal(tenureLong("2026-09-01T12:00:00.000Z", NOW), true);
  assert.equal(tenureLong("2026-10-20T12:00:00.000Z", NOW), false);
  assert.equal(tenureTwin("2026-11-01T12:00:00.000Z", NOW), true);
  assert.equal(tenureTwin("2026-11-13T08:00:00.000Z", NOW), false);
  assert.equal(tenureTail("2026-11-13T08:00:00.000Z"), true);
  assert.equal(tenureTail("2026-11-13T08:00:00"), false);
  assert.equal(tenureMark("2026-11-13T08:00:00.000Z"), true);
  assert.equal(tenureSpace("2026-11-13 08:00:00Z"), true);
  assert.equal(tenureState({ createdAt: "2026-11-13T08:00:00.000Z", amount: 3 }, NOW), "");
  assert.equal(tenureState("", NOW), "clear");
  assert.equal(tenureState({ city: "x" }, NOW), "");
  const rows: TenureRow[] = [
    { id: "1", label: "Ada", opened: "2026-11-13T08:00:00.000Z" },
    { id: "2", label: "Bea", opened: "2026-11-10T12:00:00.000Z" },
  ];
  assert.equal(leadingTenure(rows, NOW), "fresh");
  assert.match(tenureLanesCsv(rows, NOW), /fresh,1/);
  assert.match(tenureLanesCsv(rows, NOW), /sprout,1/);
  assert.match(tenureRowsCsv(rows, ["1"], NOW), /Ada,2026-11-13T08:00:00.000Z/);

  const locales = ["en", "tr", "de", "ru", "ar"] as const;
  const keys = Object.keys(ROUND287_COPY.en).sort();
  for (const locale of locales) assert.deepEqual(Object.keys(ROUND287_COPY[locale]).sort(), keys);
  assert.equal(crmv4Text("tr", "gnsTitle"), ROUND287_COPY.tr.gnsTitle);
  assert.equal(crmv4Text("de", "tnrTitle"), ROUND287_COPY.de.tnrTitle);
  assert.equal(crmv4Text("ru", "gnsSub"), ROUND287_COPY.ru.gnsSub);
  assert.equal(crmv4Text("ar", "tnrSub"), ROUND287_COPY.ar.tnrSub);
  assert.equal(crmv4Text("en", "gnsLogo"), "7FX");
  assert.equal(crmv4Text("en", "tnrLogo"), "7FX");
  assert.equal(crmv4Text("en", "gnsTitle"), "Gnomon staffs");
  assert.equal(crmv4Text("en", "tnrTitle"), "Tenure plates");
  assert.equal(crmv4Text("en", "egGiltKicker"), "Gilt rail");
  assert.equal(crmv4Text("en", "ocIvoryKicker"), "Ivory call book");
  assert.notEqual(ROUND287_COPY.tr.gnsTitle, ROUND287_COPY.en.gnsTitle);
  assert.notEqual(ROUND287_COPY.ar.tnrTitle, ROUND287_COPY.en.tnrTitle);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-gnomon/);
  assert.match(css, /\.c4-tenure-index/);
  assert.match(css, /\.c4-gnomon-column/);
  assert.match(css, /\.c4-tenure-column/);
  assert.match(css, /\.c4-edge-gilt/);
  assert.match(css, /\.c4-outcome-ivory-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round287.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /createdAt:/);
  assert.match(viewFile, /gnomonCsv/);
  assert.match(viewFile, /tenureRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "l"/);
  assert.match(viewFile, /event\.key === "g"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /event\.key === "s"/);
  assert.match(viewFile, /event\.key === "d"/);
  assert.match(viewFile, /event\.key === "r"/);
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
  assert.match(viewFile, /suggestGnomonMetal/);
  assert.match(viewFile, /c4-tenure-search/);
  assert.match(viewFile, /gnomonTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "gns"/);
  assert.match(app, /view === "tnr"/);
  const desk = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round77.tsx"), "utf8");
  assert.match(desk, /c4-edge-gilt/);
  assert.match(desk, /c4-edge-gilt-seal/);
  assert.match(desk, /c4-edge-gilt-mast/);
  assert.match(desk, /c4-outcome-ivory/);
  assert.match(desk, /c4-outcome-ivory-mast/);
  assert.match(desk, /data-logo="mono"/);
  assert.match(desk, /egGiltKicker/);
  assert.match(desk, /egGiltLead/);
  assert.match(desk, /ocIvoryKicker/);
  assert.match(desk, /ocIvoryLead/);
  assert.match(desk, /aria-required=\{false\}/);
  assert.match(desk, /data-edge-strip/);
  assert.match(desk, /data-outcome-pad/);
  assert.equal(desk.includes("sendJson"), false);
  assert.equal(desk.includes("fetch("), false);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND287_COPY.en, key);
  const named = viewFile.match(/"(gns|tnr|egGilt|ocIvory)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of named) assert.ok(key in ROUND287_COPY.en, key);
  const gilt = desk.match(/v4\("((?:egGilt|ocIvory)[a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || [];
  for (const key of gilt) assert.ok(key in ROUND287_COPY.en, key);
  console.log("crmv4 round287 tests passed");
}

main();
