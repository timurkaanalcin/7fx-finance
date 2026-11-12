/**
 * Notice bells and ticket seals.
 * Run: TZ=UTC npx tsx tests/crmv4-round234.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND234_COPY } from "../src/lib/crmv4/copy-round234";
import {
  activeBay,
  activePace,
  activeMetal,
  activePull,
  activeWeight,
  addBell,
  addBellTag,
  addBellView,
  adjacentBellCount,
  bayBand,
  bayGap,
  bayOf,
  bellDensity,
  coolingBell,
  cyclePace,
  fairBellRinger,
  houseMetal,
  lateBell,
  metalOf,
  moveBellFocus,
  peakBay,
  pullOf,
  quietBay,
  readBellViews,
  sealLane,
  sealMark,
  sealRowsCsv,
  sealState,
  sealStep,
  sealTone,
  sealsCsv,
  bellsCsv,
  setBellWax,
  setBellWeight,
  sharedSealCount,
  snoozeBell,
  leadingSeal,
  stitchedSeal,
  suggestMetal,
  suggestPull,
  weightOf,
  wideSeal,
} from "../src/lib/crmv4/round234";

function main() {
  assert.equal(metalOf("  bronze "), "BRONZE");
  assert.equal(metalOf("pewter"), "PEWTER");
  assert.equal(metalOf("gilt"), "GILT");
  assert.equal(metalOf("slate"), "");
  assert.equal(bayOf("2"), 2);
  assert.equal(bayOf(8), 8);
  assert.equal(bayOf("0"), null);
  assert.equal(bayOf("9"), null);
  assert.equal(pullOf("3"), 3);
  assert.equal(pullOf(9), 9);
  assert.equal(pullOf("27"), 27);
  assert.equal(pullOf("12"), null);
  assert.equal(pullOf("6"), null);
  assert.equal(weightOf("2"), 2);
  assert.equal(weightOf(6), 6);
  assert.equal(weightOf("8"), 8);
  assert.equal(weightOf("1"), null);
  assert.equal(weightOf("4"), null);
  assert.equal(peakBay(2), true);
  assert.equal(peakBay(8), true);
  assert.equal(peakBay(1), false);
  assert.equal(quietBay(5), true);
  assert.equal(quietBay(4), false);
  assert.equal(bayBand(3), "early");
  assert.equal(bayBand(6), "mid");
  assert.equal(bayBand(8), "late");
  assert.equal(bayBand("0"), "blank");
  assert.equal(bayGap(1, 5), 4);
  assert.equal(bayGap(5, 1), -4);
  assert.equal(bayGap(null, 5), null);
  assert.equal(houseMetal("bronze"), true);
  assert.equal(houseMetal("PEWTER"), true);
  assert.equal(houseMetal("gilt"), false);
  assert.equal(activeBay("peak"), "peak");
  assert.equal(activeBay("8"), "8");
  assert.equal(activeBay("9"), "all");
  assert.equal(activePull("9"), "9");
  assert.equal(activePull("12"), "all");
  assert.equal(activePace("toll", ["hush", "toll", "peal"]), "toll");
  assert.equal(activePace("walk", ["hush", "toll", "peal"]), "all");
  assert.equal(activeWeight("6"), "6");
  assert.equal(activeWeight("1"), "all");
  assert.equal(activeMetal("pewter", ["PEWTER"]), "PEWTER");
  assert.equal(bellDensity("tight"), "tight");
  assert.equal(bellDensity("roomy"), "airy");
  assert.equal(moveBellFocus(0, 3, 1), 1);
  assert.equal(moveBellFocus(0, 3, -1), 2);
  assert.equal(suggestMetal([]), "PEWTER");
  assert.equal(suggestPull([]), 9);
  assert.equal(fairBellRinger([], "Ada, Bea"), "Ada");

  const first = addBell([], {
    id: "a",
    title: "  North bell ",
    note: "quiet",
    clerk: "Ada",
    bay: "2",
    ink: "pewter",
    gait: "hush",
    leaf: "3",
    tags: "m n o k q",
    spine: "6",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North bell");
  assert.equal(first[0].ink, "PEWTER");
  assert.equal(first[0].bay, 2);
  assert.equal(first[0].leaf, 3);
  assert.deepEqual(first[0].tags, ["m", "n", "o", "k"]);
  assert.equal(first[0].spine, 6);
  assert.equal(first[0].seal, false);
  assert.equal(first[0].audit, "save");
  assert.equal(addBell(first, { id: "b", title: "   " }).length, 1);
  const raised = setBellWeight(first, "a", "8");
  assert.equal(raised[0].spine, 8);
  assert.equal(raised[0].audit, "spine");
  const sealed = setBellWax(first, "a", true);
  assert.equal(sealed[0].seal, true);
  assert.equal(sealed[0].audit, "seal");
  const snoozed = snoozeBell(first, "a");
  assert.equal(snoozed[0].leaf, 27);
  const paced = cyclePace(first, "a");
  assert.equal(paced[0].gait, "toll");
  const tagged = addBellTag(first, "a", "m");
  assert.deepEqual(tagged[0].tags, ["m", "n", "o", "k"]);
  const views = addBellView([], {
    id: "v",
    name: "Peak",
    tray: "open",
    query: "",
    clerk: "all",
    ink: "all",
    gait: "all",
    bay: "peak",
    leaf: "all",
    spine: "all",
  });
  assert.equal(readBellViews(views).length, 1);
  const late = addBell(addBell([], { id: "a", title: "Late bay", bay: "1", spine: "2" }), { id: "b", title: "Near bay", bay: "2", spine: "2" });
  assert.equal(lateBell(late.find((panel) => panel.id === "a")!, 5), true);
  assert.equal(lateBell(late.find((panel) => panel.id === "b")!, 5), false);
  const cooling = addBell([], { id: "c", title: "Cooling bay", bay: "5", gait: "peal", spine: "2" });
  assert.equal(coolingBell(cooling[0]), true);
  assert.equal(coolingBell({ ...cooling[0], gait: "toll" }), false);
  assert.equal(coolingBell({ ...cooling[0], bay: 4 }), false);
  const far = addBell(addBell([], { id: "n1", title: "Far bay", bay: "1", spine: "2" }), { id: "n2", title: "Third bay", bay: "4", spine: "2" });
  assert.equal(adjacentBellCount(far), 2);
  const close = addBell(addBell([], { id: "n3", title: "Near bay two", bay: "1", spine: "2" }), { id: "n4", title: "Second bay", bay: "3", spine: "2" });
  assert.equal(adjacentBellCount(close), 0);

  assert.equal(sealState("hello"), "set");
  assert.equal(sealState({ customer: "  " }), "clear");
  assert.equal(sealState({ customer: "Ada", kind: "KYC", status: "OPEN", deposits: 4 }), "");
  assert.equal(sealMark({ customer: "North desk" }), "ND");
  assert.equal(sealMark({ customer: "One two three" }), "OT");
  assert.equal(sealLane({ customer: "Desk 4", kind: "CHAT", status: "PENDING" }), "cipher");
  assert.equal(sealLane({ customer: "Ada Lane", kind: "KYC", status: "OPEN" }), "ribbon");
  assert.equal(sealLane({ customer: "Ada Lane", kind: "CHAT", status: "OPEN" }), "thread");
  assert.equal(sealLane({ customer: "Ada Lane", kind: "CALL", status: "OPEN" }), "bell");
  assert.equal(sealLane({ customer: "Ada Lane", kind: "NOTE", status: "" }), "porch");
  assert.equal(sealTone({ customer: "Ada", status: "OPEN" }), "gilt");
  assert.equal(sealTone({ customer: "Ada", status: "PENDING" }), "pale");
  assert.equal(sealTone({ customer: "Ada", status: "RESOLVED" }), "linen");
  assert.equal(sealTone({ customer: "Ada", status: "CLOSED" }), "ash");
  assert.equal(sealTone({ customer: "Ada", status: "HOLD" }), "haze");
  assert.equal(stitchedSeal({ customer: "North&desk" }), true);
  assert.equal(stitchedSeal({ customer: "North+desk" }), false);
  assert.equal(wideSeal({ customer: "Ada" }), false);
  assert.equal(wideSeal({ customer: "North desk" }), false);
  assert.equal(wideSeal({ customer: "Longmailboxname" }), true);
  assert.equal(sealStep(""), 0);
  assert.equal(sealStep("Ada"), 1);
  assert.equal(sealStep("North desk"), 2);
  assert.equal(sealStep("One two three"), 3);
  const book = [
    { id: "1", label: "North desk", note: { customer: "North desk", kind: "NOTE", status: "" } },
    { id: "2", label: "Ada Lane", note: { customer: "Ada Lane", kind: "KYC", status: "OPEN" } },
    { id: "3", label: "Desk 4", note: { customer: "Desk 4", kind: "CHAT", status: "PENDING" } },
  ];
  assert.equal(leadingSeal(book), "ribbon");
  assert.equal(sharedSealCount(book), 0);
  const paired = [
    book[0],
    { id: "4", label: "North door", note: { customer: "North door", kind: "NOTE" } },
  ];
  assert.equal(sharedSealCount(paired), 2);
  assert.match(sealsCsv(book), /ribbon,1/);
  assert.match(sealRowsCsv(book, ["2"]), /Ada Lane,AL,ribbon,gilt,2,0,0,0,0,0,1,0,1/);
  assert.match(bellsCsv(first, 3), /North bell,Ada,2,PEWTER,hush,3,6,m n o k,0,0,0,0,1,0,0,1,0,0,0,quiet,save/);

  const keys = Object.keys(ROUND234_COPY.en);
  assert.ok(keys.length >= 120);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND234_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND234_COPY[locale][key as keyof typeof ROUND234_COPY.en], "string");
      assert.ok(ROUND234_COPY[locale][key as keyof typeof ROUND234_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "nblTitle"), ROUND234_COPY.tr.nblTitle);
  assert.equal(crmv4Text("de", "tslTitle"), ROUND234_COPY.de.tslTitle);
  assert.equal(crmv4Text("ru", "nblSub"), ROUND234_COPY.ru.nblSub);
  assert.equal(crmv4Text("ar", "tslSub"), ROUND234_COPY.ar.tslSub);
  assert.equal(crmv4Text("en", "nblLogo"), "7FX");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-nbl/);
  assert.match(css, /\.c4-tsl-index/);
  assert.match(css, /\.c4-notice-cloister/);
  assert.match(css, /\.c4-notice-cloister-card/);
  assert.match(css, /\.c4-notice-cloister-empty/);
  assert.match(css, /\.c4-notice-cloister-search/);
  assert.match(css, /\.c4-find-cloister/);
  assert.match(css, /\.c4-find-cloister-search/);
  assert.match(css, /\.c4-find-cloister-empty/);
  assert.match(css, /\.c4-ticket-cloister/);
  assert.match(css, /\.c4-ticket-cloister-empty/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round234.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /customer/);
  assert.match(viewFile, /kind/);
  assert.match(viewFile, /status/);
  assert.match(viewFile, /title/);
  assert.match(viewFile, /bellsCsv/);
  assert.match(viewFile, /sealsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "t"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "u"/);
  assert.match(viewFile, /event\.key === "b"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /event\.key === "h"/);
  assert.match(viewFile, /event\.key === "g"/);
  assert.match(viewFile, /event\.key === "d"/);
  assert.match(viewFile, /event\.key === "r"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/tickets\?take=24/);
  assert.match(viewFile, /\/api\/notifications\?take=24/);
  assert.match(viewFile, /data-bells/);
  assert.match(viewFile, /data-seals/);
  assert.match(viewFile, /data-keyed/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestMetal/);
  assert.match(viewFile, /c4-tsl-search/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "nbl"/);
  assert.match(app, /view === "tsl"/);
  assert.match(app, /NoticeBells/);
  assert.match(app, /TicketSeals/);
  const notices = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round52.tsx"), "utf8");
  assert.match(notices, /c4-notice-cloister/);
  assert.match(notices, /c4-notice-cloister-card/);
  assert.match(notices, /c4-notice-cloister-empty/);
  assert.match(notices, /c4-notice-cloister-search/);
  assert.match(notices, /data-desk="cloister"/);
  assert.match(notices, /data-logo="mono"/);
  assert.match(notices, /nbl/);
  assert.match(notices, /tsl/);
  const search = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round28.tsx"), "utf8");
  assert.match(search, /c4-find-cloister/);
  assert.match(search, /c4-find-cloister-search/);
  assert.match(search, /c4-find-cloister-empty/);
  assert.match(search, /data-desk="cloister"/);
  assert.match(search, /data-logo="mono"/);
  const tickets = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round45.tsx"), "utf8");
  assert.match(tickets, /c4-ticket-cloister/);
  assert.match(tickets, /c4-ticket-cloister-empty/);
  assert.match(tickets, /data-desk="cloister"/);
  assert.match(tickets, /data-logo="mono"/);
  assert.match(tickets, /nbl/);
  assert.match(tickets, /tsl/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND234_COPY.en, key);
  const audit = viewFile.match(/"(nblAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND234_COPY.en, key);
  console.log("crmv4 round234 tests passed");
}

main();
