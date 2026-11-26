/**
 * Pietra tesserae, follow calipers, the ivory campaign atelier, and the graphite retention kiln.
 * Run: TZ=UTC npx tsx tests/crmv4-round385.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND385_COPY } from "../src/lib/crmv4/copy-round385";
import { ROUND384_FEATURES } from "../src/lib/crmv4/round384";
import {
  ROUND385_FEATURES,
  activeCoat,
  activeGround,
  activeHour,
  activeStone,
  addTessera,
  addTesseraView,
  briskTessera,
  coatCount,
  dropTesseraView,
  fairHand,
  followBlank,
  followCopy,
  followDigit,
  followDue,
  followEven,
  followFar,
  followHold,
  followHue,
  followLane,
  followLanesCsv,
  followLate,
  followLength,
  followLetter,
  followMissed,
  followOpen,
  followRowsCsv,
  followSoon,
  followUpper,
  fullCoat,
  graphiteQuiet,
  idleTessera,
  lateTessera,
  leadingFollow,
  leadingFollowHue,
  midCoat,
  moveTesseraFocus,
  overdueTessera,
  readTesseraViews,
  reminderTesserae,
  restingTessera,
  stoneBand,
  stoneCool,
  stoneGap,
  stonePoint,
  stoneWarm,
  suggestStone,
  suggestTesseraGround,
  suggestTesseraHour,
  tesseraGround,
  tesseraHour,
  tesseraTimeline,
  type FollowRow,
  type Tessera,
} from "../src/lib/crmv4/round385";

function rule(partial: Partial<Tessera> & { id: string; title: string }): Tessera {
  return {
    note: "",
    hand: "",
    stone: "",
    hour: null,
    ground: "",
    coat: 1,
    tags: [],
    raised: false,
    trayed: false,
    vaulted: false,
    pinned: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND385_FEATURES.length, 25);
  assert.equal(new Set(ROUND385_FEATURES).size, 25);
  for (const feature of ROUND385_FEATURES) assert.equal((ROUND384_FEATURES as readonly string[]).includes(feature), false, feature);
  const libDir = path.join(__dirname, "../src/lib/crmv4");
  for (const feature of ROUND385_FEATURES) {
    const needle = `"${feature}"`;
    for (const file of fs.readdirSync(libDir)) {
      if (!file.endsWith(".ts") || file === "round385.ts") continue;
      const body = fs.readFileSync(path.join(libDir, file), "utf8");
      assert.equal(body.includes(needle), false, `${feature} in ${file}`);
    }
  }
  assert.equal(stonePoint(" jasper "), "jasper");
  assert.equal(stonePoint("brass"), "");
  assert.equal(tesseraHour("4"), 4);
  assert.equal(tesseraHour(8), 8);
  assert.equal(tesseraHour(12), 12);
  assert.equal(tesseraHour(16), 16);
  assert.equal(tesseraHour("5"), null);
  assert.equal(tesseraHour("7"), null);
  assert.equal(coatCount("1"), 1);
  assert.equal(coatCount(2), 2);
  assert.equal(coatCount("4"), 4);
  assert.equal(coatCount("3"), null);
  assert.equal(coatCount("7"), null);
  assert.equal(tesseraGround("ivory"), "IVORY");
  assert.equal(tesseraGround("graphite"), "GRAPHITE");
  assert.equal(tesseraGround("champagne"), "CHAMPAGNE");
  assert.equal(tesseraGround("gold"), "");
  assert.equal(stoneWarm("jasper"), true);
  assert.equal(stoneWarm("AGATE"), true);
  assert.equal(stoneWarm("onyx"), false);
  assert.equal(stoneCool("lapis"), true);
  assert.equal(stoneCool("onyx"), true);
  assert.equal(stoneCool("jasper"), false);
  assert.equal(stoneBand("jasper"), "first");
  assert.equal(stoneBand("agate"), "second");
  assert.equal(stoneBand("lapis"), "third");
  assert.equal(stoneBand("onyx"), "fourth");
  assert.equal(stoneGap("jasper", "onyx"), 3);
  assert.equal(graphiteQuiet("graphite"), true);
  assert.equal(graphiteQuiet("ivory"), false);
  assert.equal(graphiteQuiet("champagne"), false);
  assert.equal(midCoat(2), true);
  assert.equal(midCoat(1), false);
  assert.equal(fullCoat(4), true);
  assert.equal(fullCoat(2), false);
  assert.equal(activeStone("warm"), "warm");
  assert.equal(activeHour("4"), "4");
  assert.equal(activeHour("5"), "all");
  assert.equal(activeCoat("4"), "4");
  assert.equal(activeCoat("3"), "all");
  assert.equal(activeGround("graphite", ["GRAPHITE"]), "GRAPHITE");
  assert.equal(suggestStone(4), "jasper");
  assert.equal(suggestStone(8), "agate");
  assert.equal(suggestStone(14), "lapis");
  assert.equal(suggestStone(20), "onyx");
  assert.equal(suggestTesseraHour([], 1), 4);
  assert.equal(suggestTesseraHour([], 6), 8);
  assert.equal(suggestTesseraHour([], 12), 12);
  assert.equal(suggestTesseraHour([], 18), 16);
  assert.equal(suggestTesseraGround([]), "IVORY");
  assert.equal(moveTesseraFocus(0, 3, 1), 1);
  assert.equal(moveTesseraFocus(0, 3, -1), 2);

  const saved = addTessera([], { id: "g1", title: "Agate tile", hand: "Ada", stone: "agate", hour: 8, ground: "graphite", coat: 2, tags: "j a x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].ground, "GRAPHITE");
  assert.equal(saved[0].tags.join(""), "ja");
  assert.equal(saved[0].audit, "save");
  assert.equal(saved[0].coat, 2);
  assert.equal(addTessera(saved, { title: "Agate tile" }).length, 1);
  const onyx = rule({ id: "n1", title: "Onyx tile", stone: "onyx", coat: 1 });
  assert.equal(overdueTessera(onyx), true);
  assert.equal(reminderTesserae([onyx])[0], "Onyx tile");
  assert.equal(idleTessera(rule({ id: "i1", title: "Idle", hour: 4, coat: 1 })), true);
  assert.equal(briskTessera(rule({ id: "b1", title: "Brisk", ground: "CHAMPAGNE", hour: 16, coat: 4 })), true);
  assert.equal(restingTessera(rule({ id: "r1", title: "Rest", stone: "lapis", ground: "IVORY", hour: 8 })), true);
  assert.equal(lateTessera(rule({ id: "l1", title: "Late", stone: "jasper" }), "onyx"), true);
  assert.equal(lateTessera(rule({ id: "l2", title: "Held", stone: "jasper", raised: true }), "onyx"), false);
  assert.equal(fairHand([rule({ id: "a", title: "A", hand: "Ada" }), rule({ id: "b", title: "B", hand: "Bea", raised: true })], "Ada,Bea"), "Bea");
  const timeline = tesseraTimeline([rule({ id: "t", title: "Ten", hour: 4 })]);
  assert.equal(timeline[0].hour, 4);
  assert.equal(timeline[0].titles[0], "Ten");
  const views = readTesseraViews([{ id: "v1", name: "Lapis deck", rack: "vault", query: "tile", hand: "Ada", ground: "GRAPHITE", stone: "cool", hour: "16", coat: "4" }]);
  assert.equal(views[0].rack, "vault");
  assert.equal(views[0].stone, "cool");
  assert.equal(views[0].hour, "16");
  assert.equal(views[0].coat, "4");
  assert.equal(dropTesseraView(views, "v1").length, 0);
  assert.equal(addTesseraView(views, views[0]).length, 1);

  const now = Date.parse("2026-11-26T12:00:00Z");
  assert.equal(followLane("DUE", now), "due");
  assert.equal(followLane("NEXT", now), "soon");
  assert.equal(followLane("HOLD", now), "hold");
  assert.equal(followLane("LATE", now), "late");
  assert.equal(followLane("LOST", now), "missed");
  assert.equal(followLane("OPEN", now), "blank");
  assert.equal(followLane(true, now), "due");
  assert.equal(followLane(false, now), "blank");
  assert.equal(followLane("2026-11-26T08:00:00Z", now), "due");
  assert.equal(followLane("2026-11-28T08:00:00Z", now), "soon");
  assert.equal(followLane("2026-12-10T08:00:00Z", now), "far");
  assert.equal(followLane("2026-11-25T18:00:00Z", now), "late");
  assert.equal(followLane("2026-11-01T08:00:00Z", now), "missed");
  assert.equal(followLane("Apricot", now), "soon");
  assert.equal(followLane("12night", now), "late");
  assert.equal(followLane("COPPERPLATEXXX", now), "far");
  assert.equal(followLane({ retentionFollowUpAt: "DUE" }, now), "due");
  assert.equal(followLane({ name: "Ada" }, now), "");
  assert.equal(followLane({ retentionFollowUpAt: "DUE", amount: 1 }, now), "");
  assert.equal(followHue("DUE", now), "gilt");
  assert.equal(followHue("LATE", now), "ink");
  assert.equal(followHue("HOLD", now), "pearl");
  assert.equal(followDue("DUE", now), true);
  assert.equal(followSoon("NEXT", now), true);
  assert.equal(followFar("2026-12-10T08:00:00Z", now), true);
  assert.equal(followLate("LATE", now), true);
  assert.equal(followMissed("LOST", now), true);
  assert.equal(followHold("PAUSE", now), true);
  assert.equal(followBlank("NONE", now), true);
  assert.equal(followOpen(""), true);
  assert.equal(followLength("DUE"), 3);
  assert.equal(followEven("BOOK"), true);
  assert.equal(followDigit("12night"), true);
  assert.equal(followLetter("DUE"), true);
  assert.equal(followUpper("AUSTRALIA"), true);
  assert.equal(followUpper("DUE"), false);
  assert.equal(followCopy("DUE"), "DUE");
  const rows: FollowRow[] = [
    { id: "1", label: "Ada", code: "DUE" },
    { id: "2", label: "Bea", code: "HOLD" },
  ];
  assert.equal(leadingFollow(rows, now), "due");
  assert.equal(leadingFollowHue(rows, now), "gilt");
  assert.match(followLanesCsv(rows, now), /due,1/);
  assert.match(followRowsCsv(rows, ["1"], now), /Ada,DUE/);
  assert.match(followRowsCsv(rows, ["1"], now), /,1$/m);

  assert.equal(crmv4Text("en", "tsrTitle"), ROUND385_COPY.en.tsrTitle);
  assert.equal(crmv4Text("tr", "fclTitle"), ROUND385_COPY.tr.fclTitle);
  assert.equal(crmv4Text("de", "tsrHint"), ROUND385_COPY.de.tsrHint);
  assert.equal(crmv4Text("ru", "retentionKilnKicker"), ROUND385_COPY.ru.retentionKilnKicker);
  assert.equal(crmv4Text("ar", "campaignAtelierLead"), ROUND385_COPY.ar.campaignAtelierLead);
  const keys = Object.keys(ROUND385_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND385_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-tessera/);
  assert.match(css, /\.c4-followcal/);
  assert.match(css, /\.c4-tessera-column/);
  assert.match(css, /\.c4-followcal-column/);
  assert.match(css, /\.c4-campaign-atelier/);
  assert.match(css, /\.c4-retention-kiln/);
  assert.match(css, /\.c4-campaign-atelier-mast/);
  assert.match(css, /\.c4-retention-kiln-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round385.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /retentionFollowUpAt:/);
  assert.match(viewFile, /tesseraCsv/);
  assert.match(viewFile, /followRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-tesserae/);
  assert.match(viewFile, /data-follow/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestTesseraGround/);
  assert.match(viewFile, /c4-followcal-search/);
  assert.match(viewFile, /tesseraTimeline/);
  assert.match(viewFile, /c4-tessera-notices/);
  assert.match(viewFile, /from "@\/lib\/crmv4\/round385"/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "tsr"/);
  assert.match(app, /view === "flw"/);
  const desk = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round13.tsx"), "utf8");
  assert.match(desk, /c4-campaign-atelier/);
  assert.match(desk, /c4-campaign-atelier-mast/);
  assert.match(desk, /data-logo="mono"/);
  assert.match(desk, /campaignAtelierKicker/);
  assert.match(desk, /campaignAtelierLead/);
  assert.match(desk, /data-campaign-atelier/);
  assert.match(desk, /c4-retention-kiln/);
  assert.match(desk, /c4-retention-kiln-mast/);
  assert.match(desk, /retentionKilnKicker/);
  assert.match(desk, /retentionKilnLead/);
  assert.match(desk, /data-retention-kiln/);
  const namedKeys = `${viewFile}\n${desk}`.match(/"(tsr|fcl|campaignAtelier|retentionKiln)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND385_COPY.en[key as keyof typeof ROUND385_COPY.en], "string", key);
  console.log("crmv4 round385 tests passed");
}

main();
