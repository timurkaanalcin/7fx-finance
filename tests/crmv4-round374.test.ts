/**
 * Champlevé wells, void stamps, the ivory agenda gynaeceum, and the graphite dense taberna.
 * Run: TZ=UTC npx tsx tests/crmv4-round374.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND374_COPY } from "../src/lib/crmv4/copy-round374";
import { ROUND373_FEATURES } from "../src/lib/crmv4/round373";
import {
  ROUND374_FEATURES,
  activeFinish,
  activeSeason,
  activeSla,
  activeDepth,
  addWell,
  briskWell,
  dropWellView,
  fairSetter,
  vodCourt,
  vodBench,
  vodShort,
  vodDigit,
  vodEven,
  vodFirst,
  vodScope,
  vodHue,
  vodPair,
  vodReturn,
  vodLane,
  vodLanesCsv,
  vodLength,
  vodLower,
  vodShut,
  vodWait,
  vodOpen,
  vodBare,
  vodSpan,
  vodRowsCsv,
  vodSoon,
  vodSpace,
  vodState,
  vodUpper,
  vodVowel,
  fullDepth,
  idleWell,
  lateWell,
  leadingVod,
  leadingVodHue,
  moveWellFocus,
  wellBand,
  wellSla,
  wellGap,
  wellWarm,
  wellSeason,
  wellCool,
  wellDepth,
  wellFinish,
  wellTimeline,
  overdueWell,
  pairDepth,
  quietInk,
  readWellViews,
  reminderWells,
  restingWell,
  suggestFinish,
  suggestSeason,
  suggestSla,
  type VodRow,
  type Well,
} from "../src/lib/crmv4/round374";

function rule(partial: Partial<Well> & { id: string; title: string }): Well {
  return {
    note: "",
    watcher: "",
    watch: "",
    sla: null,
    finish: "",
    bead: 3,
    tags: [],
    raised: false,
    pinned: false,
    vaulted: false,
    starred: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND374_FEATURES.length, 25);
  assert.equal(ROUND374_FEATURES.includes("void-stamps"), true);
  assert.equal(ROUND374_FEATURES.includes("well-minute-sla"), true);
  assert.equal(ROUND374_FEATURES.includes("fair-setter"), true);
  assert.equal(ROUND374_FEATURES.includes("well-coffer"), true);
  assert.equal(ROUND374_FEATURES.includes("well-reminders"), true);
  assert.equal(ROUND374_FEATURES.includes("champleve-search"), true);
  assert.equal(ROUND374_FEATURES.includes("well-timeline"), true);
  for (const feature of ROUND374_FEATURES) assert.equal((ROUND373_FEATURES as readonly string[]).includes(feature), false, feature);
  assert.equal(wellSeason(" spring "), "spring");
  assert.equal(wellSeason("brass"), "");
  assert.equal(wellSla("10"), 10);
  assert.equal(wellSla(20), 20);
  assert.equal(wellSla(40), 40);
  assert.equal(wellSla(80), 80);
  assert.equal(wellSla("15"), null);
  assert.equal(wellSla("4"), null);
  assert.equal(wellDepth("3"), 3);
  assert.equal(wellDepth(6), 6);
  assert.equal(wellDepth("9"), 9);
  assert.equal(wellDepth("2"), null);
  assert.equal(wellDepth("4"), null);
  assert.equal(wellFinish("gold"), "GOLD");
  assert.equal(wellFinish("ivory"), "IVORY");
  assert.equal(wellFinish("ink"), "INK");
  assert.equal(wellFinish("gilt"), "");
  assert.equal(wellWarm("spring"), true);
  assert.equal(wellWarm("SUMMER"), true);
  assert.equal(wellWarm("autumn"), false);
  assert.equal(wellCool("autumn"), true);
  assert.equal(wellCool("winter"), true);
  assert.equal(wellCool("spring"), false);
  assert.equal(wellBand("spring"), "morning");
  assert.equal(wellBand("summer"), "midday");
  assert.equal(wellBand("autumn"), "evening");
  assert.equal(wellBand("winter"), "late");
  assert.equal(wellGap("spring", "winter"), 3);
  assert.equal(quietInk("ink"), true);
  assert.equal(quietInk("ivory"), false);
  assert.equal(quietInk("gold"), false);
  assert.equal(pairDepth(6), true);
  assert.equal(pairDepth(3), false);
  assert.equal(fullDepth(9), true);
  assert.equal(fullDepth(6), false);
  assert.equal(activeSeason("inner"), "inner");
  assert.equal(activeSla("10"), "10");
  assert.equal(activeSla("4"), "all");
  assert.equal(activeDepth("9"), "9");
  assert.equal(activeDepth("2"), "all");
  assert.equal(activeFinish("gold", ["GOLD"]), "GOLD");
  assert.equal(suggestSeason(4), "spring");
  assert.equal(suggestSeason(10), "summer");
  assert.equal(suggestSeason(14), "autumn");
  assert.equal(suggestSeason(20), "winter");
  assert.equal(suggestSla([], 1), 10);
  assert.equal(suggestSla([], 5), 20);
  assert.equal(suggestSla([], 10), 40);
  assert.equal(suggestSla([], 18), 80);
  assert.equal(suggestFinish([]), "IVORY");
  assert.equal(moveWellFocus(0, 3, 1), 1);
  assert.equal(moveWellFocus(0, 3, -1), 2);

  const saved = addWell([], { id: "w1", title: "Spring well", watcher: "Ada", watch: "spring", sla: 10, finish: "gold", bead: 3, tags: "c h x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].finish, "GOLD");
  assert.equal(saved[0].tags.join(""), "ch");
  assert.equal(saved[0].audit, "save");
  assert.equal(addWell(saved, { title: "Spring well" }).length, 1);
  const winter = rule({ id: "n1", title: "Winter well", watch: "winter", bead: 3 });
  assert.equal(overdueWell(winter), true);
  assert.equal(reminderWells([winter])[0], "Winter well");
  assert.equal(idleWell(rule({ id: "i1", title: "Idle", sla: 10, bead: 3 })), true);
  assert.equal(briskWell(rule({ id: "b1", title: "Brisk", finish: "GOLD", sla: 80, bead: 9 })), true);
  assert.equal(restingWell(rule({ id: "r1", title: "Rest", watch: "winter", finish: "IVORY", sla: 20 })), true);
  assert.equal(lateWell(rule({ id: "l1", title: "Late", watch: "spring" }), "winter"), true);
  assert.equal(lateWell(rule({ id: "l2", title: "Held", watch: "spring", raised: true }), "winter"), false);
  assert.equal(fairSetter([rule({ id: "a", title: "A", watcher: "Ada" }), rule({ id: "b", title: "B", watcher: "Bea", raised: true })], "Ada,Bea"), "Bea");
  const timeline = wellTimeline([rule({ id: "t", title: "Ten", sla: 10 })]);
  assert.equal(timeline[0].sla, 10);
  assert.equal(timeline[0].titles[0], "Ten");
  const views = readWellViews([{ id: "v1", name: "Winter floor", tray: "vault", query: "well", watcher: "Ada", finish: "INK", watch: "outer", sla: "80", bead: "9" }]);
  assert.equal(views[0].tray, "vault");
  assert.equal(views[0].watch, "outer");
  assert.equal(dropWellView(views, "v1").length, 0);

  const now = Date.parse("2026-11-26T12:00:00Z");
  assert.equal(vodLane("LIVE", now), "court");
  assert.equal(vodLane("valid mark", now), "court");
  assert.equal(vodLane(true, now), "court");
  assert.equal(vodLane(false, now), "bare");
  assert.equal(vodLane("CALL", now), "bench");
  assert.equal(vodLane("LATER", now), "wait");
  assert.equal(vodLane("VOID", now), "return");
  assert.equal(vodLane("BOTH", now), "pair");
  assert.equal(vodLane("TR+DE", now), "pair");
  assert.equal(vodLane("quiet lane", now), "shut");
  assert.equal(vodLane("scope:tr", now), "scope");
  assert.equal(vodLane("TRI", now), "short");
  assert.equal(vodLane("12north", now), "digit");
  assert.equal(vodLane("AUSTRALIAA", now), "span");
  assert.equal(vodLane("Italy", now), "openv");
  assert.equal(vodLane("Spain", now), "bare");
  assert.equal(vodLane("2026-11-26T08:00:00Z", now), "court");
  assert.equal(vodLane("2026-11-25T08:00:00Z", now), "bench");
  assert.equal(vodLane("2026-11-20T08:00:00Z", now), "wait");
  assert.equal(vodLane("2026-11-01T08:00:00Z", now), "return");
  assert.equal(vodLane({ leadInvalidAt: "LIVE" }, now), "court");
  assert.equal(vodLane({ name: "Ada" }, now), "");
  assert.equal(vodLane({ leadInvalidAt: "LIVE", amount: 1 }, now), "");
  assert.equal(vodState(""), "clear");
  assert.equal(vodState("TRI"), "set");
  assert.equal(vodHue("LIVE", now), "champagne");
  assert.equal(vodHue("CALL", now), "graphite");
  assert.equal(vodHue("TRI", now), "ivory");
  assert.equal(vodCourt("LIVE", now), true);
  assert.equal(vodBench("CALL", now), true);
  assert.equal(vodWait("LATER", now), true);
  assert.equal(vodReturn("VOID", now), true);
  assert.equal(vodShut("hidden", now), true);
  assert.equal(vodPair("TR+DE", now), true);
  assert.equal(vodScope("scope:tr", now), true);
  assert.equal(vodShort("TRI", now), true);
  assert.equal(vodSpan("AUSTRALIAA", now), true);
  assert.equal(vodBare("Spain", now), true);
  assert.equal(vodOpen(""), true);
  assert.equal(vodSoon("TRI", now), true);
  assert.equal(vodSoon("SPAINX", now), true);
  assert.equal(vodLength("TRI"), 3);
  assert.equal(vodEven("TRI"), false);
  assert.equal(vodDigit("12north"), true);
  assert.equal(vodVowel("Italy"), true);
  assert.equal(vodLower("spain"), true);
  assert.equal(vodUpper("SPAINX"), true);
  assert.equal(vodUpper("TRI"), false);
  assert.equal(vodFirst("Spain"), true);
  assert.equal(vodSpace("new spain"), true);
  const rows: VodRow[] = [
    { id: "1", label: "Ada", code: "LIVE" },
    { id: "2", label: "Bea", code: "TRI" },
  ];
  assert.equal(leadingVod(rows), "court");
  assert.equal(leadingVodHue(rows), "champagne");
  assert.match(vodLanesCsv(rows), /court,1/);
  assert.match(vodRowsCsv(rows, ["1"]), /Ada,LIVE/);
  assert.match(vodRowsCsv(rows, ["1"]), /,1$/m);

  assert.equal(crmv4Text("en", "chvTitle"), ROUND374_COPY.en.chvTitle);
  assert.equal(crmv4Text("tr", "vodTitle"), ROUND374_COPY.tr.vodTitle);
  assert.equal(crmv4Text("de", "chvHint"), ROUND374_COPY.de.chvHint);
  assert.equal(crmv4Text("ru", "agGynaeceumKicker"), ROUND374_COPY.ru.agGynaeceumKicker);
  assert.equal(crmv4Text("ar", "dnTabernaLead"), ROUND374_COPY.ar.dnTabernaLead);
  const keys = Object.keys(ROUND374_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND374_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-champleve/);
  assert.match(css, /\.c4-vodplate/);
  assert.match(css, /\.c4-champleve-column/);
  assert.match(css, /\.c4-vodplate-column/);
  assert.match(css, /\.c4-agenda-gynaeceum/);
  assert.match(css, /\.c4-dense-taberna/);
  assert.match(css, /\.c4-agenda-gynaeceum-mast/);
  assert.match(css, /\.c4-dense-taberna-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round374.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /leadInvalidAt:/);
  assert.match(viewFile, /wellCsv/);
  assert.match(viewFile, /vodRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestFinish/);
  assert.match(viewFile, /c4-vodplate-search/);
  assert.match(viewFile, /wellTimeline/);
  assert.match(viewFile, /c4-champleve-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "chv"/);
  assert.match(app, /view === "vod"/);
  const agenda = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round33.tsx"), "utf8");
  const dense = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round51.tsx"), "utf8");
  assert.match(agenda, /c4-agenda-gynaeceum/);
  assert.match(agenda, /c4-agenda-gynaeceum-mast/);
  assert.match(agenda, /data-logo="mono"/);
  assert.match(agenda, /agGynaeceumKicker/);
  assert.match(agenda, /agGynaeceumLead/);
  assert.match(agenda, /data-agenda-gynaeceum/);
  assert.match(agenda, /aria-required=\{false\}/);
  assert.match(dense, /c4-dense-taberna/);
  assert.match(dense, /c4-dense-taberna-mast/);
  assert.match(dense, /data-logo="mono"/);
  assert.match(dense, /dnTabernaKicker/);
  assert.match(dense, /dnTabernaLead/);
  assert.match(dense, /data-dense-taberna/);
  assert.match(dense, /aria-required=\{false\}/);
  const namedKeys = `${viewFile}\n${agenda}\n${dense}`.match(/"(chv|vod|agGynaeceum|dnTaberna)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND374_COPY.en[key as keyof typeof ROUND374_COPY.en], "string", key);
  console.log("crmv4 round374 tests passed");
}

main();
