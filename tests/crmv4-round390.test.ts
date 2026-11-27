/**
 * Ogee scrolls, cavetto hollows, the graphite next-action narthex, and the ivory merge exedra.
 * Run: TZ=UTC npx tsx tests/crmv4-round390.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND390_COPY } from "../src/lib/crmv4/copy-round390";
import { ROUND389_FEATURES } from "../src/lib/crmv4/round389";
import {
  ROUND390_FEATURES,
  activeBed,
  activeDepth,
  activeHour,
  activeProfile,
  addOgee,
  addOgeeView,
  briskOgee,
  dropOgeeView,
  fairHand,
  fullDepth,
  hollowBlank,
  hollowCopy,
  hollowDark,
  hollowDigit,
  hollowDim,
  hollowEven,
  hollowFade,
  hollowFar,
  hollowHue,
  hollowLanesCsv,
  hollowLength,
  hollowLetter,
  hollowLit,
  hollowNear,
  hollowOpen,
  hollowRowsCsv,
  hollowUpper,
  idleOgee,
  lateOgee,
  leadingHollow,
  leadingHollowHue,
  linenQuiet,
  midDepth,
  moveOgeeFocus,
  ogeeBed,
  ogeeHour,
  ogeeTimeline,
  overdueOgee,
  profileBand,
  profileCool,
  profileGap,
  profilePoint,
  profileWarm,
  depthCount,
  readOgeeViews,
  reminderOgeeList,
  restingOgee,
  suggestOgeeBed,
  suggestOgeeHour,
  suggestProfile,
  type HollowRow,
  type Ogee,
} from "../src/lib/crmv4/round390";

function scroll(partial: Partial<Ogee> & { id: string; title: string }): Ogee {
  return {
    note: "",
    hand: "",
    profile: "",
    hour: null,
    bed: "",
    depth: 2,
    tags: [],
    raised: false,
    kilned: false,
    lofted: false,
    pinned: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND390_FEATURES.length, 25);
  assert.equal(new Set(ROUND390_FEATURES).size, 25);
  for (const feature of ROUND390_FEATURES) assert.equal((ROUND389_FEATURES as readonly string[]).includes(feature), false, feature);
  const libDir = path.join(__dirname, "../src/lib/crmv4");
  for (const feature of ROUND390_FEATURES) {
    const needle = `"${feature}"`;
    for (const file of fs.readdirSync(libDir)) {
      if (!file.endsWith(".ts") || file === "round390.ts") continue;
      const body = fs.readFileSync(path.join(libDir, file), "utf8");
      assert.equal(body.includes(needle), false, `${feature} in ${file}`);
    }
  }

  assert.equal(profilePoint(" torus "), "torus");
  assert.equal(profilePoint("jasper"), "");
  assert.equal(ogeeHour("2"), 2);
  assert.equal(ogeeHour(6), 6);
  assert.equal(ogeeHour(10), 10);
  assert.equal(ogeeHour(14), 14);
  assert.equal(ogeeHour("4"), null);
  assert.equal(ogeeHour("8"), null);
  assert.equal(depthCount("2"), 2);
  assert.equal(depthCount(4), 4);
  assert.equal(depthCount("8"), 8);
  assert.equal(depthCount("1"), null);
  assert.equal(depthCount("6"), null);
  assert.equal(ogeeBed("linen"), "LINEN");
  assert.equal(ogeeBed("slate"), "SLATE");
  assert.equal(ogeeBed("gilt"), "GILT");
  assert.equal(ogeeBed("gold"), "");
  assert.equal(profileWarm("ogee"), true);
  assert.equal(profileWarm("CYMA"), true);
  assert.equal(profileWarm("torus"), false);
  assert.equal(profileCool("scotia"), true);
  assert.equal(profileCool("torus"), true);
  assert.equal(profileCool("ogee"), false);
  assert.equal(profileBand("ogee"), "first");
  assert.equal(profileBand("cyma"), "second");
  assert.equal(profileBand("scotia"), "third");
  assert.equal(profileBand("torus"), "fourth");
  assert.equal(profileGap("ogee", "torus"), 3);
  assert.equal(profileGap("torus", "cyma"), -2);
  assert.equal(profileGap("gold", "torus"), null);
  assert.equal(linenQuiet("linen"), true);
  assert.equal(linenQuiet("gilt"), false);
  assert.equal(midDepth(4), true);
  assert.equal(midDepth(2), false);
  assert.equal(fullDepth(8), true);
  assert.equal(fullDepth(4), false);
  assert.equal(activeProfile("warm"), "warm");
  assert.equal(activeProfile("cool"), "cool");
  assert.equal(activeProfile("nope"), "all");
  assert.equal(activeHour(6), "6");
  assert.equal(activeHour(5), "all");
  assert.equal(activeBed("linen", ["LINEN", "SLATE", "GILT"]), "LINEN");
  assert.equal(activeDepth(8), "8");
  assert.equal(activeDepth(2), "2");
  assert.equal(activeDepth(3), "all");
  assert.equal(moveOgeeFocus(0, 4, -1), 3);
  assert.equal(suggestProfile(2), "ogee");
  assert.equal(suggestProfile(8), "cyma");
  assert.equal(suggestProfile(14), "scotia");
  assert.equal(suggestProfile(20), "torus");
  assert.equal(suggestOgeeHour([], 2), 2);
  assert.equal(suggestOgeeHour([], 8), 6);
  assert.equal(suggestOgeeHour([], 14), 10);
  assert.equal(suggestOgeeHour([], 20), 14);
  const bench = [
    scroll({ id: "a", title: "Ada", bed: "LINEN", profile: "ogee", hour: 2, hand: "Nia" }),
    scroll({ id: "b", title: "Bea", bed: "LINEN", profile: "torus", hour: 6, hand: "Nia" }),
  ];
  assert.equal(suggestOgeeBed(bench), "SLATE");
  assert.equal(suggestOgeeHour(bench, 2), 10);
  assert.equal(fairHand(bench, "Nia,Omar"), "Omar");

  const saved = addOgee([], { title: "  Corso  ", profile: "scotia", hour: 14, bed: "linen", depth: 8, tags: "r s r x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].profile, "scotia");
  assert.equal(saved[0].hour, 14);
  assert.equal(saved[0].bed, "LINEN");
  assert.equal(saved[0].depth, 8);
  assert.deepEqual(saved[0].tags, ["r", "s"]);
  assert.equal(saved[0].audit, "save");
  assert.equal(addOgee(saved, { title: "Corso" }).length, 1);

  const views = addOgeeView([], { id: "v1", name: "Quiet", rack: "bench", query: "", hand: "", bed: "linen", profile: "warm", hour: "2", depth: "4" });
  assert.equal(readOgeeViews(views)[0].bed, "LINEN");
  assert.equal(readOgeeViews(views)[0].profile, "warm");
  assert.equal(dropOgeeView(views, "v1").length, 0);

  const late = scroll({ id: "l", title: "Late", profile: "ogee" });
  const idle = scroll({ id: "i", title: "Idle", hour: 2 });
  const brisk = scroll({ id: "r", title: "Brisk", bed: "SLATE", hour: 14, depth: 8 });
  const rest = scroll({ id: "s", title: "Rest", profile: "scotia", bed: "LINEN", hour: 6 });
  const due = scroll({ id: "d", title: "Due", profile: "torus", depth: 2 });
  assert.equal(lateOgee(late, "torus"), true);
  assert.equal(lateOgee(late, "ogee"), false);
  assert.equal(idleOgee(idle), true);
  assert.equal(briskOgee(brisk), true);
  assert.equal(restingOgee(rest), true);
  assert.equal(overdueOgee(due), true);
  assert.deepEqual(reminderOgeeList([due, late]), ["Due"]);
  const timeline = ogeeTimeline([scroll({ id: "t", title: "Ten", hour: 6 })]);
  assert.equal(timeline[0].hour, 6);
  assert.deepEqual(timeline[0].titles, ["Ten"]);

  const now = Date.parse("2026-11-26T12:00:00Z");
  assert.equal(hollowLit("DESK", now), true);
  assert.equal(hollowLit(true, now), true);
  assert.equal(hollowNear("NEXT", now), true);
  assert.equal(hollowNear("2026-11-28T08:00:00Z", now), true);
  assert.equal(hollowFar("2026-11-30T08:00:00Z", now), true);
  assert.equal(hollowFade("OLD", now), true);
  assert.equal(hollowFade("2026-11-23T08:00:00Z", now), true);
  assert.equal(hollowDark("LOST", now), true);
  assert.equal(hollowDark(false, now), true);
  assert.equal(hollowDark("2026-11-20T08:00:00Z", now), true);
  assert.equal(hollowDim("PARK", now), true);
  assert.equal(hollowBlank("NONE", now), true);
  assert.equal(hollowOpen(""), true);
  assert.equal(hollowHue("DESK", now), "gilt");
  assert.equal(hollowHue("LOST", now), "ash");
  assert.equal(hollowHue("PARK", now), "pearl");
  assert.equal(hollowLength("DESK"), 4);
  assert.equal(hollowEven("DESK"), true);
  assert.equal(hollowDigit("12night"), true);
  assert.equal(hollowLetter("DESK"), true);
  assert.equal(hollowUpper("ISTANBUL"), true);
  assert.equal(hollowUpper("DESK"), false);
  assert.equal(hollowCopy("DESK"), "DESK");
  assert.equal(hollowLit({ balance: 1 }, now), false);
  const rows: HollowRow[] = [
    { id: "1", label: "Ada", code: "DESK" },
    { id: "2", label: "Bea", code: "PARK" },
  ];
  assert.equal(leadingHollow(rows, now), "due");
  assert.equal(leadingHollowHue(rows, now), "gilt");
  assert.match(hollowLanesCsv(rows, now), /due,1/);
  assert.match(hollowRowsCsv(rows, ["1"], now), /Ada,DESK/);
  assert.match(hollowRowsCsv(rows, ["1"], now), /,1$/m);

  assert.equal(crmv4Text("en", "ogeTitle"), ROUND390_COPY.en.ogeTitle);
  assert.equal(crmv4Text("tr", "cvtTitle"), ROUND390_COPY.tr.cvtTitle);
  assert.equal(crmv4Text("de", "ogeHint"), ROUND390_COPY.de.ogeHint);
  assert.equal(crmv4Text("ru", "nextNarthexKicker"), ROUND390_COPY.ru.nextNarthexKicker);
  assert.equal(crmv4Text("ar", "mergeExedraLead"), ROUND390_COPY.ar.mergeExedraLead);
  const keys = Object.keys(ROUND390_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND390_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-ogee/);
  assert.match(css, /\.c4-cavetto/);
  assert.match(css, /\.c4-ogee-column/);
  assert.match(css, /\.c4-cavetto-column/);
  assert.match(css, /\.c4-next-narthex/);
  assert.match(css, /\.c4-merge-exedra/);
  assert.match(css, /\.c4-next-narthex-mast/);
  assert.match(css, /\.c4-merge-exedra-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round390.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /row\.tradingGroup/);
  assert.match(viewFile, /ogeeCsv/);
  assert.match(viewFile, /hollowRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-ogee/);
  assert.match(viewFile, /data-cavetto/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestOgeeBed/);
  assert.match(viewFile, /c4-cavetto-search/);
  assert.match(viewFile, /ogeeTimeline/);
  assert.match(viewFile, /c4-ogee-notices/);
  assert.match(viewFile, /from "@\/lib\/crmv4\/round390"/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "oge"/);
  assert.match(app, /view === "cvt"/);
  const desk = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round4.tsx"), "utf8");
  assert.match(desk, /c4-next-narthex/);
  assert.match(desk, /c4-next-narthex-mast/);
  assert.match(desk, /data-logo="mono"/);
  assert.match(desk, /nextNarthexKicker/);
  assert.match(desk, /nextNarthexLead/);
  assert.match(desk, /data-next-narthex/);
  assert.match(desk, /c4-merge-exedra/);
  assert.match(desk, /c4-merge-exedra-mast/);
  assert.match(desk, /mergeExedraKicker/);
  assert.match(desk, /mergeExedraLead/);
  assert.match(desk, /data-merge-exedra/);
  const namedKeys = `${viewFile}\n${desk}`.match(/"(oge|cvt|nextNarthex|mergeExedra)[A-Z][A-Za-z0-9]*"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND390_COPY.en[key as keyof typeof ROUND390_COPY.en], "string", key);
  console.log("crmv4 round390 tests passed");
}

main();
