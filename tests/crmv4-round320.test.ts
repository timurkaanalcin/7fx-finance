/**
 * Fusee rules, snail plates, the ivory key lararium, and the graphite device tepidarium.
 * Run: TZ=UTC npx tsx tests/crmv4-round320.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND320_COPY } from "../src/lib/crmv4/copy-round320";
import {
  ROUND320_FEATURES,
  activeInk,
  activePiece,
  activeTooth,
  activeTurn,
  addFusee,
  briskFusee,
  dropFuseeView,
  fairSmith,
  fuseeBand,
  fuseeGap,
  fuseeInk,
  fuseeInner,
  fuseePiece,
  fuseeTooth,
  fuseeOuter,
  fuseeTurn,
  fuseeTimeline,
  fullTurn,
  houseInk,
  idleFusee,
  lateFusee,
  leadingSnail,
  moveFuseeFocus,
  overdueFusee,
  pairTurn,
  readFuseeViews,
  restingFusee,
  snailCapital,
  snailDigit,
  snailEven,
  snailFirst,
  snailHouse,
  snailHue,
  snailJoin,
  snailLane,
  snailLanesCsv,
  snailLength,
  snailLower,
  snailOpen,
  snailPath,
  snailRowsCsv,
  snailScroll,
  snailSpace,
  snailSpan,
  snailState,
  snailStub,
  snailTail,
  snailUpper,
  snailVowel,
  suggestInk,
  suggestPiece,
  suggestTooth,
  type Fusee,
  type SnailRow,
} from "../src/lib/crmv4/round320";

function rule(partial: Partial<Fusee> & { id: string; title: string }): Fusee {
  return {
    note: "",
    smith: "",
    piece: "",
    tooth: null,
    ink: "",
    turn: 2,
    tags: [],
    spun: false,
    clicked: false,
    boxed: false,
    starred: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND320_FEATURES.length, 25);
  assert.equal(ROUND320_FEATURES.includes("agent-snail"), true);
  assert.equal(ROUND320_FEATURES.includes("tooth-sla"), true);
  assert.equal(ROUND320_FEATURES.includes("fair-smith"), true);
  assert.equal(ROUND320_FEATURES.includes("locker"), true);
  assert.equal(ROUND320_FEATURES.includes("gilt-ink"), true);
  assert.equal(fuseePiece(" cone "), "cone");
  assert.equal(fuseePiece("brass"), "");
  assert.equal(fuseeTooth("2"), 2);
  assert.equal(fuseeTooth(5), 5);
  assert.equal(fuseeTooth(8), 8);
  assert.equal(fuseeTooth(11), 11);
  assert.equal(fuseeTooth("7"), null);
  assert.equal(fuseeTurn("2"), 2);
  assert.equal(fuseeTurn(6), 6);
  assert.equal(fuseeTurn("10"), 10);
  assert.equal(fuseeTurn("3"), null);
  assert.equal(fuseeInk("gilt"), "GILT");
  assert.equal(fuseeInk("ivory"), "IVORY");
  assert.equal(fuseeInk("graphite"), "GRAPHITE");
  assert.equal(fuseeInk("hot"), "");
  assert.equal(fuseeInner("cone"), true);
  assert.equal(fuseeInner("CHAIN"), true);
  assert.equal(fuseeInner("cam"), false);
  assert.equal(fuseeOuter("cam"), true);
  assert.equal(fuseeOuter("stop"), true);
  assert.equal(fuseeOuter("cone"), false);
  assert.equal(fuseeBand("cone"), "taper");
  assert.equal(fuseeBand("chain"), "link");
  assert.equal(fuseeBand("cam"), "drum");
  assert.equal(fuseeBand("stop"), "catch");
  assert.equal(fuseeBand(""), "");
  assert.equal(fuseeGap("cone", "stop"), 3);
  assert.equal(fuseeGap("cam", "nope"), null);
  assert.equal(houseInk("ivory"), true);
  assert.equal(houseInk("graphite"), true);
  assert.equal(houseInk("gilt"), false);
  assert.equal(pairTurn(6), true);
  assert.equal(pairTurn(2), false);
  assert.equal(fullTurn("10"), true);
  assert.equal(fullTurn(6), false);
  assert.equal(activePiece("inner"), "inner");
  assert.equal(activePiece("cam"), "cam");
  assert.equal(activePiece("gold"), "all");
  assert.equal(activeTooth("11"), "11");
  assert.equal(activeTooth("2"), "2");
  assert.equal(activeTooth("7"), "all");
  assert.equal(activeTurn("2"), "2");
  assert.equal(activeTurn("3"), "all");
  assert.equal(activeInk("graphite", ["GRAPHITE"]), "GRAPHITE");
  assert.equal(activeInk("hot", ["GRAPHITE"]), "all");
  assert.equal(moveFuseeFocus(0, 3, -1), 2);
  assert.equal(moveFuseeFocus(0, 0, 1), 0);

  const cards = [
    rule({ id: "a", title: "Ada", piece: "cam", turn: 2, smith: "Ned" }),
    rule({ id: "b", title: "Bea", piece: "cone", ink: "GRAPHITE", tooth: 11, turn: 10, smith: "Ned" }),
    rule({ id: "c", title: "Cara", piece: "stop", ink: "GRAPHITE", tooth: 5, smith: "Ida" }),
  ];
  assert.equal(overdueFusee(cards[0]), true);
  assert.equal(briskFusee(rule({ id: "g", title: "Gilt", ink: "IVORY", tooth: 11, turn: 10 })), true);
  assert.equal(briskFusee(cards[1]), false);
  assert.equal(restingFusee(cards[2]), true);
  assert.equal(idleFusee(rule({ id: "i", title: "Idle", tooth: 2, turn: 2 })), true);
  assert.equal(lateFusee(cards[1], "stop"), true);
  assert.equal(lateFusee(cards[1], "cone"), false);
  assert.equal(suggestInk([]), "IVORY");
  assert.equal(suggestInk(cards), "IVORY");
  assert.equal(suggestInk([rule({ id: "v", title: "Ivy", ink: "IVORY" })]), "GILT");
  assert.equal(suggestTooth([], 4), 2);
  assert.equal(suggestTooth([], 6), 5);
  assert.equal(suggestTooth([], 12), 8);
  assert.equal(suggestTooth([], 18), 11);
  assert.equal(suggestTooth(cards, 6), 2);
  assert.equal(suggestPiece(4), "cone");
  assert.equal(suggestPiece(14), "stop");
  assert.equal(fairSmith(cards, "Ida,Ned"), "Ida");
  const saved = addFusee([], { title: "Dora", piece: "cam", ink: "ivory", tooth: "5", turn: "6", tags: "q z r" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].ink, "IVORY");
  assert.equal(saved[0].tooth, 5);
  assert.equal(saved[0].turn, 6);
  assert.equal(saved[0].tags.join(""), "qz");
  assert.equal(addFusee(saved, { title: "Dora" }).length, 1);
  assert.equal(dropFuseeView([{ id: "v", name: "Morning", tray: "arbor", query: "", smith: "", ink: "all", piece: "all", tooth: "all", turn: "all" }], "v").length, 0);
  assert.equal(readFuseeViews([{ id: "v", name: "Morning", tray: "click" }])[0].tray, "click");

  assert.equal(snailHouse("MOZILLA"), true);
  assert.equal(snailHouse({ agent: true }), true);
  assert.equal(snailSpan({ agent: false }), true);
  assert.equal(snailHouse({ agent: "path" }), false);
  assert.equal(snailJoin("re-check"), true);
  assert.equal(snailSpan("needs review"), true);
  assert.equal(snailStub("US"), true);
  assert.equal(snailStub("NET"), true);
  assert.equal(snailScroll("VeryLongAgentName"), true);
  assert.equal(snailScroll("Netherlands"), false);
  assert.equal(snailLane("US"), "stub");
  assert.equal(snailLane("10.1.1.1"), "digit");
  assert.equal(snailLane("Amsterdam"), "vowel");
  assert.equal(snailLane("Paris"), "path");
  assert.equal(snailPath("Paris"), true);
  assert.equal(snailOpen(""), true);
  assert.equal(snailOpen({ agent: "" }), true);
  assert.equal(snailState({ name: "Ada" }), "");
  assert.equal(snailState({ agent: "Paris", balance: 1 }), "");
  assert.equal(snailHue("MOZILLA"), "champagne");
  assert.equal(snailHue("needs review"), "graphite");
  assert.equal(snailHue("Amsterdam"), "ivory");
  assert.equal(snailLength("hold"), 4);
  assert.equal(snailEven("hold"), true);
  assert.equal(snailFirst("Paris"), true);
  assert.equal(snailSpace("needs review"), true);
  assert.equal(snailVowel("Amsterdam"), true);
  assert.equal(snailDigit("Room4"), true);
  assert.equal(snailCapital("PARIS"), true);
  assert.equal(snailLower("paris"), true);
  assert.equal(snailUpper("MOZILLA"), true);
  assert.equal(snailUpper("NET"), false);
  assert.equal(snailTail("Room4"), true);
  const marks: SnailRow[] = [
    { id: "1", label: "Ada", code: "MOZILLA" },
    { id: "2", label: "Bea", code: "APPLE" },
    { id: "3", label: "Cara", code: "Paris" },
  ];
  assert.equal(leadingSnail(marks), "house");
  assert.match(snailLanesCsv(marks), /house,2/);
  assert.match(snailRowsCsv(marks, ["1"]), /Ada,MOZILLA/);
  assert.match(fuseeTimeline(cards).map((lane) => lane.tooth).join(","), /11|5/);
  assert.equal(crmv4Text("tr", "fseTitle"), ROUND320_COPY.tr.fseTitle);
  assert.equal(crmv4Text("de", "snlTitle"), ROUND320_COPY.de.snlTitle);
  assert.equal(crmv4Text("ru", "kcdLarariumKicker"), ROUND320_COPY.ru.kcdLarariumKicker);
  assert.equal(crmv4Text("ar", "dvcTepidariumLead"), ROUND320_COPY.ar.dvcTepidariumLead);
  const keys = Object.keys(ROUND320_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND320_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-fusee/);
  assert.match(css, /\.c4-snail/);
  assert.match(css, /\.c4-fusee-column/);
  assert.match(css, /\.c4-snail-column/);
  assert.match(css, /\.c4-key-lararium/);
  assert.match(css, /\.c4-device-tepidarium/);
  assert.match(css, /\.c4-key-lararium-mast/);
  assert.match(css, /\.c4-device-tepidarium-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round320.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /lastUserAgent/);
  assert.match(viewFile, /fuseeCsv/);
  assert.match(viewFile, /snailRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0&role=TRADER/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestInk/);
  assert.match(viewFile, /c4-snail-search/);
  assert.match(viewFile, /fuseeTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "fse"/);
  assert.match(app, /view === "snl"/);
  const host = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round140.tsx"), "utf8");
  assert.match(host, /c4-key-lararium/);
  assert.match(host, /c4-key-lararium-mast/);
  assert.match(host, /data-logo="mono"/);
  assert.match(host, /kcdLarariumKicker/);
  assert.match(host, /kcdLarariumLead/);
  assert.match(host, /data-key/);
  assert.equal(host.includes("amount"), false);
  assert.match(host, /c4-device-tepidarium/);
  assert.match(host, /c4-device-tepidarium-mast/);
  assert.match(host, /dvcTepidariumKicker/);
  assert.match(host, /dvcTepidariumLead/);
  assert.match(host, /data-device/);
  assert.equal(host.includes("currency"), false);
  assert.equal(host.includes("saleStatus"), false);
  const namedKeys = `${viewFile}\n${host}`.match(/"(fse|snl|kcdLararium|dvcTepidarium)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND320_COPY.en[key as keyof typeof ROUND320_COPY.en], "string", key);
  console.log("crmv4 round320 tests passed");
}

main();
