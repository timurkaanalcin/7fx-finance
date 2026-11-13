/**
 * Beacon slips and validation glyphs.
 * Run: TZ=UTC npx tsx tests/crmv4-round250.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND250_COPY } from "../src/lib/crmv4/copy-round250";
import {
  ROUND250_FEATURES,
  activeCircuit,
  activeFog,
  activeGlass,
  activeSpan,
  activeStep,
  addBeaconSlip,
  addBeaconView,
  beaconCsv,
  beaconTimeline,
  bulkBeaconPin,
  busiestKeeper,
  circuitBand,
  circuitGap,
  circuitOf,
  cycleFog,
  dropBeaconView,
  fairKeeper,
  fogOf,
  glassOf,
  glyphBound,
  glyphHue,
  glyphJoin,
  glyphLane,
  glyphLanesCsv,
  glyphNotch,
  glyphRowsCsv,
  glyphStamp,
  glyphState,
  glyphStep,
  glyphWide,
  houseGlass,
  idleSlip,
  lateSlip,
  leadingGlyph,
  lengthenSpan,
  lowerStep,
  moveBeaconFocus,
  neighborSlipCount,
  overdueSlip,
  peakCircuit,
  quietCircuit,
  raiseStep,
  readBeaconViews,
  restingSlip,
  rushSlip,
  shortenSpan,
  spanOf,
  stepOf,
  suggestGlass,
  suggestSpan,
} from "../src/lib/crmv4/round250";

function main() {
  assert.equal(ROUND250_FEATURES.length, 25);
  assert.equal(circuitOf(" reef "), "reef");
  assert.equal(circuitOf("paris"), "");
  assert.equal(spanOf("15"), 15);
  assert.equal(spanOf(30), 30);
  assert.equal(spanOf("45"), 45);
  assert.equal(spanOf("10"), null);
  assert.equal(stepOf("2"), 2);
  assert.equal(stepOf(4), 4);
  assert.equal(stepOf("6"), 6);
  assert.equal(stepOf("8"), 8);
  assert.equal(stepOf("1"), null);
  assert.equal(glassOf("clear"), "CLEAR");
  assert.equal(glassOf("amber"), "AMBER");
  assert.equal(glassOf("ruby"), "RUBY");
  assert.equal(glassOf("linen"), "");
  assert.equal(fogOf("still"), "still");
  assert.equal(fogOf("haze"), "haze");
  assert.equal(fogOf("squall"), "squall");
  assert.equal(fogOf("warm"), "");
  assert.equal(peakCircuit("lamp"), true);
  assert.equal(peakCircuit("HEAD"), true);
  assert.equal(peakCircuit("reef"), false);
  assert.equal(quietCircuit("spit"), true);
  assert.equal(quietCircuit("lamp"), false);
  assert.equal(circuitBand("lamp"), "early");
  assert.equal(circuitBand("bar"), "mid");
  assert.equal(circuitBand("head"), "late");
  assert.equal(circuitBand(""), "");
  assert.equal(circuitGap("reef", "bar"), 1);
  assert.equal(circuitGap("bar", "reef"), -1);
  assert.equal(circuitGap("", "reef"), null);
  assert.equal(houseGlass("clear"), true);
  assert.equal(houseGlass("AMBER"), true);
  assert.equal(houseGlass("ruby"), false);
  assert.equal(activeCircuit("peak"), "peak");
  assert.equal(activeCircuit("reef"), "reef");
  assert.equal(activeCircuit("paris"), "all");
  assert.equal(activeSpan("15"), "15");
  assert.equal(activeSpan("10"), "all");
  assert.equal(activeFog("squall", ["still", "haze", "squall"]), "squall");
  assert.equal(activeFog("loud", ["still", "haze", "squall"]), "all");
  assert.equal(activeStep("6"), "6");
  assert.equal(activeStep("1"), "all");
  assert.equal(activeGlass("amber"), "amber");
  assert.equal(activeGlass("silk"), "all");
  assert.equal(moveBeaconFocus(0, 3, 1), 1);
  assert.equal(moveBeaconFocus(0, 3, -1), 2);
  assert.equal(suggestGlass([]), "CLEAR");
  assert.equal(suggestSpan([], 4), 15);
  assert.equal(suggestSpan([], 12), 30);
  assert.equal(suggestSpan([], 19), 45);
  assert.equal(fairKeeper([], "Ada, Bea"), "Ada");

  const first = addBeaconSlip([], {
    id: "a",
    title: "  North light ",
    note: "",
    keeper: "Ada",
    circuit: "lamp",
    glass: "clear",
    fog: "still",
    span: 15,
    step: 2,
    tags: "a a b",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North light");
  assert.equal(first[0].note, "");
  assert.equal(first[0].glass, "CLEAR");
  assert.equal(first[0].tags.join(""), "ab");
  assert.equal(first[0].audit, "save");
  assert.equal(overdueSlip(first[0]), true);
  assert.equal(addBeaconSlip(first, { id: "a", title: "Other" }).length, 1);
  assert.equal(addBeaconSlip(first, { id: "b", title: "North light" }).length, 1);
  assert.equal(addBeaconSlip(first, { id: "b", title: "   " }).length, 1);

  const pinned = bulkBeaconPin(first, ["a"]);
  assert.equal(overdueSlip(pinned[0]), false);
  const quiet = addBeaconSlip(pinned, { id: "q", title: "Reef rest", keeper: "Bea", circuit: "reef", fog: "still", step: 2 });
  assert.equal(idleSlip(quiet[0]), true);
  assert.equal(lateSlip(quiet[0], "head"), true);
  const rushed = addBeaconSlip([], { id: "r", title: "Head rush", circuit: "head", fog: "squall", step: 6 });
  assert.equal(rushSlip(rushed[0]), true);
  const rested = addBeaconSlip([], { id: "s", title: "Cove rest", circuit: "cove", fog: "haze", span: 45 });
  assert.equal(restingSlip(rested[0]), true);
  assert.equal(lengthenSpan(rested, "s")[0].span, 45);
  assert.equal(lengthenSpan([{ ...rested[0], span: null }], "s")[0].span, 15);
  assert.equal(shortenSpan(first, "a")[0].span, 15);
  assert.equal(shortenSpan([{ ...first[0], span: null }], "a")[0].span, 45);
  assert.equal(cycleFog(first, "a")[0].fog, "haze");
  assert.equal(raiseStep(first, "a")[0].step, 4);
  assert.equal(lowerStep(first, "a")[0].step, 8);
  assert.equal(busiestKeeper(quiet), "Bea");
  assert.equal(neighborSlipCount(quiet) >= 0, true);
  assert.match(beaconCsv(first, "head"), /North light/);
  assert.match(beaconTimeline(first).map((lane) => lane.step).join(","), /2/);

  const views = addBeaconView([], { id: "v", name: "Peak", tray: "open", circuit: "peak", span: "15", glass: "clear", fog: "still", step: "2" });
  assert.equal(views[0].circuit, "peak");
  assert.equal(dropBeaconView(views, "v").length, 0);
  assert.equal(readBeaconViews([{ id: "v", name: "Peak", tray: "nope" }])[0].tray, "open");

  assert.equal(glyphState("PENDING"), "set");
  assert.equal(glyphStamp("PENDING"), "GP7");
  assert.equal(glyphLane("PENDING"), "plain");
  assert.equal(glyphHue("PENDING"), "clay");
  assert.equal(glyphStep("PENDING"), 6);
  assert.equal(glyphJoin("PENDING"), false);
  assert.equal(glyphJoin("APPROVED"), true);
  assert.equal(glyphBound("PENDING"), true);
  assert.equal(glyphWide("PENDING"), false);
  assert.equal(glyphLane("OK"), "vowel");
  assert.equal(glyphStamp("OK"), "KO2");
  assert.equal(glyphLane("NONE"), "brief");
  assert.equal(glyphLane("VIP"), "brief");
  assert.equal(glyphBound("VIP"), true);
  assert.equal(glyphHue("VIP"), "pearl");
  assert.equal(glyphLane("12"), "digit");
  assert.equal(glyphHue("12"), "mist");
  assert.equal(glyphLane("AA_OK"), "split");
  assert.equal(glyphNotch("AA_OK"), true);
  assert.equal(glyphLane("AABB"), "twin");
  assert.equal(glyphStamp("AABB"), "BA4");
  assert.equal(glyphJoin("AABB"), true);
  assert.equal(glyphWide("APPROVED"), true);
  assert.equal(glyphState("X"), "clear");
  assert.equal(glyphState({ validationStatus: "PENDING", balance: 1 }), "");
  assert.equal(glyphState({ code: "PENDING" }), "");

  const book = [
    { id: "1", label: "Ada", note: "AABB" },
    { id: "2", label: "Bea", note: "AABB" },
    { id: "3", label: "Cem", note: "PENDING" },
  ];
  assert.equal(leadingGlyph(book), "twin");
  assert.match(glyphLanesCsv(book), /twin,2/);
  assert.match(glyphRowsCsv(book, ["1"]), /AABB,BA4,twin,gilt,2,1,0,0,0,0,0,0,1,0,0,0,1/);
  assert.match(glyphRowsCsv(book, ["1"]), /PENDING,GP7,plain,clay,6,0,0,0,1,0,0,0,0,0,0,1,0/);

  const keys = Object.keys(ROUND250_COPY.en);
  assert.ok(keys.length >= 160);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND250_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND250_COPY[locale][key as keyof typeof ROUND250_COPY.en], "string");
      assert.ok(ROUND250_COPY[locale][key as keyof typeof ROUND250_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "bcnTitle"), ROUND250_COPY.tr.bcnTitle);
  assert.equal(crmv4Text("de", "vglTitle"), ROUND250_COPY.de.vglTitle);
  assert.equal(crmv4Text("ru", "bcnSub"), ROUND250_COPY.ru.bcnSub);
  assert.equal(crmv4Text("ar", "vglSub"), ROUND250_COPY.ar.vglSub);
  assert.equal(crmv4Text("en", "bcnLogo"), "7FX");
  assert.equal(crmv4Text("en", "bcnTitle"), "Beacon slips");
  assert.notEqual(ROUND250_COPY.tr.bcnTitle, ROUND250_COPY.en.bcnTitle);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-bcn/);
  assert.match(css, /\.c4-vgl-index/);
  assert.match(css, /\.c4-packet-salon/);
  assert.match(css, /\.c4-pulse-salon/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round250.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /validationStatus/);
  assert.match(viewFile, /beaconCsv/);
  assert.match(viewFile, /glyphRowsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "t"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "u"/);
  assert.match(viewFile, /event\.key === "s"/);
  assert.match(viewFile, /event\.key === "f"/);
  assert.match(viewFile, /event\.key === "h"/);
  assert.match(viewFile, /event\.key === "w"/);
  assert.match(viewFile, /event\.key === "d"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /event\.key === "b"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "m"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0&role=TRADER/);
  assert.match(viewFile, /data-passes/);
  assert.match(viewFile, /data-glyphs/);
  assert.match(viewFile, /data-traders/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestGlass/);
  assert.match(viewFile, /c4-vgl-search/);
  assert.match(viewFile, /beaconTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "bcn"/);
  assert.match(app, /view === "vgl"/);
  const packet = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round70.tsx"), "utf8");
  const pulse = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round72.tsx"), "utf8");
  assert.match(packet, /c4-packet-salon/);
  assert.match(packet, /data-logo="mono"/);
  assert.match(pulse, /c4-pulse-salon/);
  assert.match(pulse, /data-logo="mono"/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND250_COPY.en, key);
  const audit = viewFile.match(/"(bcnAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND250_COPY.en, key);
  const salon = `${packet}\n${pulse}`.match(/"((?:pk|pu)Salon[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of salon) assert.ok(key in ROUND250_COPY.en, key);
  console.log("crmv4 round250 tests passed");
}

main();
