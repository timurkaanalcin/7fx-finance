/**
 * Loom slips and invite plates.
 * Run: TZ=UTC npx tsx tests/crmv4-round265.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND265_COPY } from "../src/lib/crmv4/copy-round265";
import {
  ROUND265_FEATURES,
  activeLoomRank,
  activeLoomWait,
  activeFrame,
  activeDye,
  activeShuttle,
  addLoom,
  addLoomView,
  briskLoom,
  bulkLoomPin,
  busiestLoomWeaver,
  loomCsv,
  loomRank,
  loomTimeline,
  loomWait,
  frameBand,
  frameGap,
  frameOf,
  cycleShuttle,
  dropLoomView,
  fairLoomWeaver,
  dyeOf,
  houseDye,
  idleLoom,
  lateLoom,
  leadingInvite,
  lengthenLoom,
  lowerLoom,
  moveLoomFocus,
  neighborLoomCount,
  overdueLoom,
  peakFrame,
  shuttleOf,
  quietFrame,
  raiseLoom,
  readLoomViews,
  restingLoom,
  shortenLoom,
  inviteCap,
  inviteEcho,
  inviteHue,
  inviteKnown,
  inviteLane,
  inviteLanesCsv,
  inviteLeap,
  inviteNotch,
  inviteRowsCsv,
  inviteSlash,
  inviteStamp,
  inviteState,
  inviteStep,
  inviteTail,
  inviteTwin,
  inviteWide,
  suggestLoomWait,
  suggestFrame,
  suggestDye,
} from "../src/lib/crmv4/round265";

function main() {
  assert.equal(ROUND265_FEATURES.length, 25);
  assert.equal(frameOf(" reed "), "reed");
  assert.equal(frameOf("paris"), "");
  assert.equal(loomWait("10"), 10);
  assert.equal(loomWait(20), 20);
  assert.equal(loomWait("40"), 40);
  assert.equal(loomWait("12"), null);
  assert.equal(loomRank("2"), 2);
  assert.equal(loomRank(4), 4);
  assert.equal(loomRank("6"), 6);
  assert.equal(loomRank("8"), 8);
  assert.equal(loomRank("1"), null);
  assert.equal(loomRank("3"), null);
  assert.equal(dyeOf("flax"), "FLAX");
  assert.equal(dyeOf("wool"), "WOOL");
  assert.equal(dyeOf("silk"), "SILK");
  assert.equal(dyeOf("oat"), "");
  assert.equal(shuttleOf("draw"), "draw");
  assert.equal(shuttleOf("beat"), "beat");
  assert.equal(shuttleOf("rest"), "rest");
  assert.equal(shuttleOf("brisk"), "");
  assert.equal(peakFrame("warp"), true);
  assert.equal(peakFrame("REED"), true);
  assert.equal(peakFrame("weft"), false);
  assert.equal(quietFrame("weft"), true);
  assert.equal(quietFrame("beam"), true);
  assert.equal(quietFrame("warp"), false);
  assert.equal(frameBand("warp"), "early");
  assert.equal(frameBand("weft"), "early");
  assert.equal(frameBand("reed"), "mid");
  assert.equal(frameBand("beam"), "late");
  assert.equal(frameBand(""), "");
  assert.equal(frameGap("warp", "weft"), 1);
  assert.equal(frameGap("weft", "warp"), -1);
  assert.equal(frameGap("", "warp"), null);
  assert.equal(houseDye("flax"), true);
  assert.equal(houseDye("SILK"), true);
  assert.equal(houseDye("wool"), false);
  assert.equal(activeFrame("peak"), "peak");
  assert.equal(activeFrame("warp"), "warp");
  assert.equal(activeFrame("paris"), "all");
  assert.equal(activeLoomWait("20"), "20");
  assert.equal(activeLoomWait("9"), "all");
  assert.equal(activeShuttle("beat", ["draw", "beat", "rest"]), "beat");
  assert.equal(activeShuttle("gale", ["draw", "beat", "rest"]), "all");
  assert.equal(activeLoomRank("4"), "4");
  assert.equal(activeLoomRank("1"), "all");
  assert.equal(activeDye("wool"), "wool");
  assert.equal(activeDye("mint"), "all");
  assert.equal(moveLoomFocus(0, 3, 1), 1);
  assert.equal(moveLoomFocus(0, 3, -1), 2);
  assert.equal(suggestDye([]), "FLAX");
  assert.equal(suggestLoomWait([], 4), 10);
  assert.equal(suggestLoomWait([], 8), 20);
  assert.equal(suggestLoomWait([], 16), 40);
  assert.equal(suggestFrame(4), "warp");
  assert.equal(suggestFrame(12), "reed");
  assert.equal(fairLoomWeaver([], "Ada, Bea"), "Ada");

  const first = addLoom([], {
    id: "a",
    title: "  North vault ",
    note: "",
    weaver: "Ada",
    frame: "warp",
    dye: "flax",
    shuttle: "draw",
    wait: 10,
    rank: 2,
    tags: "a a b",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North vault");
  assert.equal(first[0].note, "");
  assert.equal(first[0].dye, "FLAX");
  assert.equal(first[0].tags.join(""), "ab");
  assert.equal(first[0].audit, "save");
  assert.equal(overdueLoom(first[0]), true);
  assert.equal(addLoom(first, { id: "a", title: "Other" }).length, 1);
  assert.equal(addLoom(first, { id: "b", title: "North vault" }).length, 1);
  assert.equal(addLoom(first, { id: "b", title: "   " }).length, 1);

  const pinned = bulkLoomPin(first, ["a"]);
  assert.equal(overdueLoom(pinned[0]), false);
  assert.equal(fairLoomWeaver(pinned, "Ada, Bea"), "Ada");
  const quiet = addLoom(pinned, { id: "q", title: "Weft rest", weaver: "Bea", frame: "weft", shuttle: "draw", rank: 1 });
  assert.equal(idleLoom(quiet[0]), true);
  assert.equal(lateLoom(quiet[0], "warp"), false);
  assert.equal(lateLoom(quiet[0], "reed"), false);
  const behind = addLoom([], { id: "z", title: "Weft late", frame: "weft", rank: 1 });
  assert.equal(lateLoom(behind[0], "beam"), true);
  assert.equal(lateLoom({ ...behind[0], rank: 3 }, "beam"), false);
  const rushed = addLoom([], { id: "r", title: "Warp spark", frame: "warp", shuttle: "beat", rank: 8 });
  assert.equal(briskLoom(rushed[0]), true);
  const rested = addLoom([], { id: "s", title: "Beam cask", frame: "beam", shuttle: "rest", wait: 40 });
  assert.equal(restingLoom(rested[0]), true);
  assert.equal(lengthenLoom(rested, "s")[0].wait, 40);
  assert.equal(lengthenLoom([{ ...rested[0], wait: null }], "s")[0].wait, 10);
  assert.equal(lengthenLoom(first, "a")[0].wait, 20);
  assert.equal(shortenLoom(first, "a")[0].wait, 10);
  assert.equal(shortenLoom([{ ...first[0], wait: null }], "a")[0].wait, 40);
  assert.equal(cycleShuttle(first, "a")[0].shuttle, "beat");
  assert.equal(raiseLoom(first, "a")[0].rank, 4);
  assert.equal(lowerLoom(first, "a")[0].rank, 2);
  assert.equal(lowerLoom([{ ...first[0], rank: 8 }], "a")[0].rank, 6);
  assert.equal(busiestLoomWeaver(quiet), "Bea");
  assert.equal(neighborLoomCount(quiet) >= 0, true);
  assert.match(loomCsv(first, "beam"), /North vault/);
  assert.match(loomTimeline(first).map((lane) => lane.rank).join(","), /2/);

  const greenBook = addLoom(addLoom([], { id: "y1", title: "Wool one", dye: "wool", frame: "weft" }), { id: "y2", title: "Wool two", dye: "wool", frame: "warp" });
  assert.equal(suggestDye(greenBook), "WOOL");
  assert.equal(suggestLoomWait(rested, 4), 40);

  const views = addLoomView([], { id: "v", name: "Peak", tray: "open", frame: "peak", wait: "10", dye: "flax", shuttle: "draw", rank: "2" });
  assert.equal(views[0].frame, "peak");
  assert.equal(dropLoomView(views, "v").length, 0);
  assert.equal(readLoomViews([{ id: "v", name: "Peak", tray: "nope" }])[0].tray, "open");

  assert.equal(inviteState("INVITE"), "set");
  assert.equal(inviteLane("INVITE"), "seal");
  assert.equal(inviteStamp("INVITE"), "INV");
  assert.equal(inviteHue("INVITE"), "champagne");
  assert.equal(inviteStep("INVITE"), 6);
  assert.equal(inviteLeap("INVITE"), false);
  assert.equal(inviteKnown("INVITE"), true);
  assert.equal(inviteTail("INVITE"), true);
  assert.equal(inviteLane("GUEST"), "card");
  assert.equal(inviteStamp("GUEST"), "GUE");
  assert.equal(inviteHue("GUEST"), "graphite");
  assert.equal(inviteTail("GUEST"), false);
  assert.equal(inviteKnown("guest"), true);
  assert.equal(inviteLeap("GUEST"), true);
  assert.equal(inviteLane("STAFF"), "mark");
  assert.equal(inviteStamp("STAFF"), "STA");
  assert.equal(inviteHue("STAFF"), "ivory");
  assert.equal(inviteKnown("STAFF"), false);
  assert.equal(inviteLeap("STAFF"), true);
  assert.equal(inviteLeap("INVITEX"), false);
  assert.equal(inviteNotch("PRE-SET"), true);
  assert.equal(inviteLane("PRE-SET"), "seam");
  assert.equal(inviteHue("PRE-SET"), "champagne");
  assert.equal(inviteSlash("A/B"), true);
  assert.equal(inviteLane("A/B"), "seam");
  assert.equal(inviteWide("PRE_SET"), true);
  assert.equal(inviteTwin("BOOK"), true);
  assert.equal(inviteEcho("RADAR"), true);
  assert.equal(inviteCap("Invite"), true);
  assert.equal(inviteCap("invite"), false);
  assert.equal(inviteLane("invite"), "seal");
  assert.equal(inviteState("12"), "clear");
  assert.equal(inviteState(""), "clear");
  assert.equal(inviteState({ referralCodeUsed: "INVITE", balance: 1 }), "");
  assert.equal(inviteState({ title: "INVITE" }), "");
  assert.equal(inviteLane({ code: "GUEST" }), "card");

  const book = [
    { id: "1", label: "Ada", note: "INVITE" },
    { id: "2", label: "Bea", note: "GUEST" },
    { id: "3", label: "Cem", note: "STAFF" },
  ];
  assert.equal(leadingInvite(book), "seal");
  assert.match(inviteLanesCsv(book), /seal,1/);
  assert.match(inviteRowsCsv(book, ["1"]), /INVITE,INV,seal,champagne/);
  assert.match(inviteRowsCsv(book, ["1"]), /GUEST,GUE,card,graphite/);
  assert.match(inviteRowsCsv(book, ["1"]), /STAFF,STA,mark,ivory/);

  const keys = Object.keys(ROUND265_COPY.en);
  assert.ok(keys.length >= 150);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND265_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND265_COPY[locale][key as keyof typeof ROUND265_COPY.en], "string");
      assert.ok(ROUND265_COPY[locale][key as keyof typeof ROUND265_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "lomTitle"), ROUND265_COPY.tr.lomTitle);
  assert.equal(crmv4Text("de", "ivtTitle"), ROUND265_COPY.de.ivtTitle);
  assert.equal(crmv4Text("ru", "lomSub"), ROUND265_COPY.ru.lomSub);
  assert.equal(crmv4Text("ar", "ivtSub"), ROUND265_COPY.ar.ivtSub);
  assert.equal(crmv4Text("en", "lomLogo"), "7FX");
  assert.equal(crmv4Text("en", "lomTitle"), "Loom spools");
  assert.notEqual(ROUND265_COPY.tr.lomTitle, ROUND265_COPY.en.lomTitle);
  assert.equal(crmv4Text("en", "lrdTitle"), "Larder slips");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-loom/);
  assert.match(css, /\.c4-invite-index/);
  assert.match(css, /\.c4-loom-ledger/);
  assert.match(css, /\.c4-invite-bar/);
  assert.match(css, /\.c4-exec-loom/);
  assert.match(css, /\.c4-book-loom/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round265.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /referralCodeUsed/);
  assert.match(viewFile, /loomCsv/);
  assert.match(viewFile, /inviteRowsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "r"/);
  assert.match(viewFile, /event\.key === "l"/);
  assert.match(viewFile, /event\.key === "g"/);
  assert.match(viewFile, /event\.key === "h"/);
  assert.match(viewFile, /event\.key === "w"/);
  assert.match(viewFile, /event\.key === "b"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /event\.key === "u"/);
  assert.match(viewFile, /event\.key === "y"/);
  assert.match(viewFile, /event\.key === "m"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0&role=TRADER/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-traders/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestDye/);
  assert.match(viewFile, /c4-invite-search/);
  assert.match(viewFile, /loomTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "lom"/);
  assert.match(app, /view === "ivt"/);
  const overview = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Overview.tsx"), "utf8");
  const positions = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Positions.tsx"), "utf8");
  assert.match(overview, /c4-exec-loom/);
  assert.match(positions, /c4-book-loom/);
  assert.match(overview, /lomOvrLead/);
  assert.match(positions, /lomPosLead/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND265_COPY.en, key);
  const audit = viewFile.match(/"(lomAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND265_COPY.en, key);
  console.log("crmv4 round265 tests passed");
}

main();
