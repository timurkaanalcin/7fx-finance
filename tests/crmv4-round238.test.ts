/**
 * Berth slips and badge marks.
 * Run: TZ=UTC npx tsx tests/crmv4-round238.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND238_COPY } from "../src/lib/crmv4/copy-round238";
import {
  activeHook,
  activePace,
  activeRank,
  activeSpan,
  addBerth,
  addBerthTag,
  addBerthView,
  adjacentBerthCount,
  badgeLane,
  badgeRowsCsv,
  badgeSigil,
  badgeState,
  badgeStep,
  badgeTone,
  badgesCsv,
  berthTimeline,
  berthsCsv,
  coolingBerth,
  cordOf,
  cyclePace,
  fairClerk,
  hookBand,
  hookGap,
  hookOf,
  houseCord,
  joinedBadge,
  lateBerth,
  leadingBadge,
  moveBerthFocus,
  peakHook,
  quietHook,
  rankOf,
  readBerthViews,
  setBerthRank,
  setBerthSeal,
  sharedBadgeCount,
  snoozeBerth,
  spanOf,
  suggestCord,
  suggestSpan,
  wideBadge,
} from "../src/lib/crmv4/round238";

function main() {
  assert.equal(cordOf("  silk "), "SILK");
  assert.equal(cordOf("hemp"), "HEMP");
  assert.equal(cordOf("wire"), "WIRE");
  assert.equal(cordOf("oak"), "");
  assert.equal(hookOf("2"), 2);
  assert.equal(hookOf(8), 8);
  assert.equal(hookOf("0"), null);
  assert.equal(hookOf("9"), null);
  assert.equal(spanOf("10"), 10);
  assert.equal(spanOf(30), 30);
  assert.equal(spanOf("90"), 90);
  assert.equal(spanOf("15"), null);
  assert.equal(rankOf("2"), 2);
  assert.equal(rankOf(5), 5);
  assert.equal(rankOf("8"), 8);
  assert.equal(rankOf("1"), null);
  assert.equal(peakHook(3), true);
  assert.equal(peakHook(8), true);
  assert.equal(peakHook(2), false);
  assert.equal(quietHook(1), true);
  assert.equal(quietHook(8), false);
  assert.equal(hookBand(2), "early");
  assert.equal(hookBand(3), "early");
  assert.equal(hookBand(4), "mid");
  assert.equal(hookBand(6), "late");
  assert.equal(hookBand(8), "late");
  assert.equal(hookGap(1, 5), 4);
  assert.equal(hookGap(5, 1), -4);
  assert.equal(hookGap(null, 4), null);
  assert.equal(houseCord("wire"), true);
  assert.equal(houseCord("HEMP"), true);
  assert.equal(houseCord("silk"), false);
  assert.equal(activeHook("peak"), "peak");
  assert.equal(activeHook("8"), "8");
  assert.equal(activeHook("9"), "all");
  assert.equal(activeSpan("90"), "90");
  assert.equal(activeSpan("15"), "all");
  assert.equal(activePace("march", ["hush", "march", "sprint"]), "march");
  assert.equal(activePace("hush", ["hush", "march", "sprint"]), "hush");
  assert.equal(activeRank("5"), "5");
  assert.equal(activeRank("1"), "all");
  assert.equal(moveBerthFocus(0, 3, 1), 1);
  assert.equal(moveBerthFocus(0, 3, -1), 2);
  assert.equal(suggestCord([]), "WIRE");
  assert.equal(suggestSpan([]), 30);
  assert.equal(fairClerk([], "Ada, Bea"), "Ada");

  const first = addBerth([], {
    id: "a",
    title: "  North berth ",
    note: "quiet",
    clerk: "Ada",
    hook: "2",
    cord: "silk",
    pace: "hush",
    span: "10",
    tags: "e f g h i",
    rank: "5",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North berth");
  assert.equal(first[0].cord, "SILK");
  assert.equal(first[0].hook, 2);
  assert.equal(first[0].span, 10);
  assert.deepEqual(first[0].tags, ["e", "f", "g", "h"]);
  assert.equal(first[0].rank, 5);
  assert.equal(first[0].seal, false);
  assert.equal(first[0].audit, "save");
  assert.equal(addBerth(first, { id: "b", title: "   " }).length, 1);
  const raised = setBerthRank(first, "a", "8");
  assert.equal(raised[0].rank, 8);
  assert.equal(raised[0].audit, "rank");
  const sealed = setBerthSeal(first, "a", true);
  assert.equal(sealed[0].seal, true);
  assert.equal(sealed[0].audit, "seal");
  const snoozed = snoozeBerth(first, "a");
  assert.equal(snoozed[0].span, 30);
  assert.equal(snoozeBerth(snoozed, "a")[0].span, 90);
  assert.equal(snoozeBerth(snoozeBerth(snoozed, "a"), "a")[0].span, 90);
  const paced = cyclePace(first, "a");
  assert.equal(paced[0].pace, "march");
  const tagged = addBerthTag(first, "a", "e");
  assert.deepEqual(tagged[0].tags, ["e", "f", "g", "h"]);
  const views = addBerthView([], {
    id: "v",
    name: "Peak",
    tray: "open",
    query: "",
    clerk: "all",
    cord: "all",
    pace: "all",
    hook: "peak",
    span: "all",
    rank: "all",
  });
  assert.equal(readBerthViews(views).length, 1);
  const late = addBerth(addBerth([], { id: "a", title: "Late hook", hook: "1", rank: "2" }), { id: "b", title: "Near hook", hook: "4", rank: "2" });
  assert.equal(lateBerth(late.find((card) => card.id === "a")!, 5), true);
  assert.equal(lateBerth(late.find((card) => card.id === "b")!, 5), false);
  const cooling = addBerth([], { id: "c", title: "Cooling hook", hook: "1", pace: "sprint", rank: "2" });
  assert.equal(coolingBerth(cooling[0]), true);
  assert.equal(coolingBerth({ ...cooling[0], pace: "march" }), false);
  assert.equal(coolingBerth({ ...cooling[0], hook: 8 }), false);
  const far = addBerth(addBerth([], { id: "n1", title: "Far hook", hook: "1", rank: "2" }), { id: "n2", title: "Fifth hook", hook: "5", rank: "2" });
  assert.equal(adjacentBerthCount(far), 2);
  const close = addBerth(addBerth([], { id: "n3", title: "Near hook two", hook: "1", rank: "2" }), { id: "n4", title: "Third hook", hook: "3", rank: "2" });
  assert.equal(adjacentBerthCount(close), 0);
  assert.equal(berthTimeline(far).map((lane) => lane.hook).join(","), "1,5");

  assert.equal(badgeState("hello"), "set");
  assert.equal(badgeState({ name: "  " }), "clear");
  assert.equal(badgeState({ name: "Ada", check: "APPROVED", tier: "WIRE", deposits: 4 }), "");
  assert.equal(badgeSigil({ name: "North desk" }), "ND");
  assert.equal(badgeSigil({ name: "One two three" }), "OTT");
  assert.equal(badgeLane({ name: "Desk 4", check: "APPROVED" }), "cipher");
  assert.equal(badgeLane({ name: "Ada Lane", check: "APPROVED" }), "seal");
  assert.equal(badgeLane({ name: "Ada Lane", check: "PENDING" }), "queue");
  assert.equal(badgeLane({ name: "Ada Lane", check: "REJECTED" }), "gate");
  assert.equal(badgeLane({ name: "Ada Lane", check: "HOLD" }), "vault");
  assert.equal(badgeLane({ name: "Ada Lane", check: "" }), "hall");
  assert.equal(badgeTone({ name: "Ada", tier: "WIRE" }), "gilt");
  assert.equal(badgeTone({ name: "Ada", tier: "BANK" }), "gilt");
  assert.equal(badgeTone({ name: "Ada", tier: "CARD" }), "linen");
  assert.equal(badgeTone({ name: "Ada", tier: "CRYPTO" }), "pale");
  assert.equal(badgeTone({ name: "Ada", tier: "WALLET" }), "pale");
  assert.equal(badgeTone({ name: "Ada", tier: "DEMO" }), "ash");
  assert.equal(badgeTone({ name: "Ada", tier: "" }), "haze");
  assert.equal(joinedBadge({ name: "North&desk" }), true);
  assert.equal(joinedBadge({ name: "North+desk" }), false);
  assert.equal(wideBadge({ name: "Ada Lane" }), false);
  assert.equal(wideBadge({ name: "North windowed" }), true);
  assert.equal(badgeStep(""), 0);
  assert.equal(badgeStep("Ada"), 1);
  assert.equal(badgeStep("North desk"), 2);
  assert.equal(badgeStep("One two three"), 3);
  const book = [
    { id: "1", label: "North window", note: { name: "North window", check: "", tier: "" } },
    { id: "2", label: "Ada Lane", note: { name: "Ada Lane", check: "APPROVED", tier: "WIRE" } },
    { id: "3", label: "Desk four", note: { name: "Desk 4", check: "PENDING", tier: "DEMO" } },
  ];
  assert.equal(leadingBadge(book), "seal");
  assert.equal(sharedBadgeCount(book), 0);
  const paired = [
    book[0],
    { id: "4", label: "North wind", note: { name: "North wind", check: "" } },
  ];
  assert.equal(sharedBadgeCount(paired), 2);
  assert.match(badgesCsv(book), /cipher,1/);
  assert.match(badgeRowsCsv(book, ["2"]), /Ada Lane,AL,seal,gilt,2,0,0,0,0,0,1,0,0,1/);
  assert.match(berthsCsv(first, 5), /North berth,Ada,2,SILK,hush,10,5,e f g h,0,0,0,0,3,0,0,0,0,0,0,quiet,save/);

  const keys = Object.keys(ROUND238_COPY.en);
  assert.ok(keys.length >= 120);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND238_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND238_COPY[locale][key as keyof typeof ROUND238_COPY.en], "string");
      assert.ok(ROUND238_COPY[locale][key as keyof typeof ROUND238_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "brtTitle"), ROUND238_COPY.tr.brtTitle);
  assert.equal(crmv4Text("de", "bdgTitle"), ROUND238_COPY.de.bdgTitle);
  assert.equal(crmv4Text("ru", "brtSub"), ROUND238_COPY.ru.brtSub);
  assert.equal(crmv4Text("ar", "bdgSub"), ROUND238_COPY.ar.bdgSub);
  assert.equal(crmv4Text("en", "brtLogo"), "7FX");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-brt/);
  assert.match(css, /\.c4-bdg-index/);
  assert.match(css, /\.c4-vault-quay/);
  assert.match(css, /\.c4-heat-quay/);
  assert.match(css, /\.c4-heat-quay-search/);
  assert.match(css, /\.c4-vault-quay-index/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round238.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /status/);
  assert.match(viewFile, /method/);
  assert.match(viewFile, /title/);
  assert.match(viewFile, /berthsCsv/);
  assert.match(viewFile, /badgesCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "t"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "u"/);
  assert.match(viewFile, /event\.key === "s"/);
  assert.match(viewFile, /event\.key === "g"/);
  assert.match(viewFile, /event\.key === "h"/);
  assert.match(viewFile, /event\.key === "w"/);
  assert.match(viewFile, /event\.key === "d"/);
  assert.match(viewFile, /event\.key === "r"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/withdrawals\?take=24/);
  assert.match(viewFile, /data-slips/);
  assert.match(viewFile, /data-badges/);
  assert.match(viewFile, /data-queues/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestCord/);
  assert.match(viewFile, /c4-bdg-search/);
  assert.match(viewFile, /berthTimeline/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "brt"/);
  assert.match(app, /view === "bdg"/);
  assert.match(app, /BerthSlips/);
  assert.match(app, /BadgeMarks/);
  const vault = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round63.tsx"), "utf8");
  assert.match(vault, /c4-vault-quay/);
  assert.match(vault, /c4-vault-quay-index/);
  assert.match(vault, /c4-vault-quay-links/);
  assert.match(vault, /data-desk="quay"/);
  assert.match(vault, /data-logo="mono"/);
  const heat = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round64.tsx"), "utf8");
  assert.match(heat, /c4-heat-quay/);
  assert.match(heat, /c4-heat-quay-mast/);
  assert.match(heat, /c4-heat-quay-search/);
  assert.match(heat, /data-desk="quay"/);
  assert.match(heat, /data-logo="mono"/);
  assert.match(heat, /brt/);
  assert.match(heat, /bdg/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND238_COPY.en, key);
  const audit = viewFile.match(/"(brtAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND238_COPY.en, key);
  const vaultUsed = new Set(vault.match(/v4\("(brt|bdg)[a-zA-Z0-9]+"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(vaultUsed)) assert.ok(key in ROUND238_COPY.en, key);
  const heatUsed = new Set(heat.match(/v4\("(brt|bdg)[a-zA-Z0-9]+"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(heatUsed)) assert.ok(key in ROUND238_COPY.en, key);
  console.log("crmv4 round238 tests passed");
}

main();
