/**
 * Niche cards and email crests.
 * Run: TZ=UTC npx tsx tests/crmv4-round247.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND247_COPY } from "../src/lib/crmv4/copy-round247";
import {
  activeAisle,
  activeLeaf,
  activePace,
  activeWait,
  activeWax,
  addNicheCard,
  addNicheView,
  aisleBand,
  aisleGap,
  aisleOf,
  crestBound,
  crestHue,
  crestJoin,
  crestLane,
  crestLanesCsv,
  crestNotch,
  crestRowsCsv,
  crestStamp,
  crestState,
  crestStep,
  crestWide,
  cyclePace,
  fairKeeper,
  houseWax,
  idleCard,
  lateCard,
  leadingCrest,
  leafOf,
  lengthenNicheWait,
  lowerLeaf,
  moveNicheFocus,
  neighborCardCount,
  nicheCsv,
  nicheTimeline,
  paceOf,
  peakAisle,
  quietAisle,
  raiseLeaf,
  readNicheViews,
  setCardCord,
  setCardLeaf,
  shortenNicheWait,
  suggestWait,
  suggestWax,
  waitOf,
  waxOf,
} from "../src/lib/crmv4/round247";

function main() {
  assert.equal(aisleOf(" Nave "), "nave");
  assert.equal(aisleOf("paris"), "");
  assert.equal(waitOf("20"), 20);
  assert.equal(waitOf(40), 40);
  assert.equal(waitOf("60"), 60);
  assert.equal(waitOf("15"), null);
  assert.equal(leafOf("3"), 3);
  assert.equal(leafOf(5), 5);
  assert.equal(leafOf("7"), 7);
  assert.equal(leafOf("9"), 9);
  assert.equal(leafOf("2"), null);
  assert.equal(waxOf("bees"), "BEES");
  assert.equal(waxOf("resin"), "RESIN");
  assert.equal(waxOf("ash"), "ASH");
  assert.equal(waxOf("silk"), "");
  assert.equal(paceOf("slow"), "slow");
  assert.equal(paceOf("even"), "even");
  assert.equal(paceOf("brisk"), "brisk");
  assert.equal(paceOf("three"), "");
  assert.equal(peakAisle("porch"), true);
  assert.equal(peakAisle("LOFT"), true);
  assert.equal(peakAisle("nave"), false);
  assert.equal(quietAisle("crypt"), true);
  assert.equal(quietAisle("porch"), false);
  assert.equal(aisleBand("porch"), "early");
  assert.equal(aisleBand("aisle"), "mid");
  assert.equal(aisleBand("crypt"), "late");
  assert.equal(aisleBand(""), "");
  assert.equal(aisleGap("nave", "aisle"), 1);
  assert.equal(aisleGap("aisle", "nave"), -1);
  assert.equal(aisleGap("", "nave"), null);
  assert.equal(houseWax("bees"), true);
  assert.equal(houseWax("ASH"), true);
  assert.equal(houseWax("resin"), false);
  assert.equal(activeAisle("peak"), "peak");
  assert.equal(activeAisle("nave"), "nave");
  assert.equal(activeAisle("paris"), "all");
  assert.equal(activeWait("20"), "20");
  assert.equal(activeWait("15"), "all");
  assert.equal(activePace("even", ["slow", "even", "brisk"]), "even");
  assert.equal(activePace("hush", ["slow", "even", "brisk"]), "all");
  assert.equal(activeLeaf("5"), "5");
  assert.equal(activeLeaf("4"), "all");
  assert.equal(activeWax("resin"), "resin");
  assert.equal(activeWax("silk"), "all");
  assert.equal(moveNicheFocus(0, 3, 1), 1);
  assert.equal(moveNicheFocus(0, 3, -1), 2);
  assert.equal(suggestWax([]), "BEES");
  assert.equal(suggestWait([], 4), 20);
  assert.equal(suggestWait([], 12), 40);
  assert.equal(suggestWait([], 19), 60);
  assert.equal(fairKeeper([], "Ada, Bea"), "Ada");

  const first = addNicheCard([], {
    id: "a",
    title: "  North niche ",
    note: "quiet",
    keeper: "Ada",
    aisle: "nave",
    wax: "bees",
    pace: "even",
    wait: "20",
    leaf: "5",
    tags: "a b",
  });
  assert.equal(first[0].title, "North niche");
  assert.equal(first[0].wax, "BEES");
  assert.equal(first[0].wait, 20);
  assert.equal(first[0].leaf, 5);
  assert.deepEqual(first[0].tags, ["a", "b"]);
  assert.equal(lateCard(first[0], "aisle"), true);
  assert.equal(idleCard(first[0]), false);
  const paced = cyclePace(first, "a");
  assert.equal(paced[0].pace, "brisk");
  const raised = raiseLeaf(first, "a");
  assert.equal(raised[0].leaf, 7);
  const lowered = lowerLeaf(raised, "a");
  assert.equal(lowered[0].leaf, 5);
  const longer = lengthenNicheWait(first, "a");
  assert.equal(longer[0].wait, 40);
  const shorter = shortenNicheWait(longer, "a");
  assert.equal(shorter[0].wait, 20);
  const cord = setCardCord(first, "a", true);
  assert.equal(cord[0].cord, true);
  assert.equal(setCardLeaf(first, "a", 2)[0].leaf, 5);
  assert.equal(nicheTimeline(first).map((lane) => lane.leaf).join(","), "5");
  assert.match(nicheCsv(first, "aisle"), /North niche,Ada,nave,BEES,even,20,5,a b,0,0,0,0,1,1,0,0,0,1,early,0,0,0,save,quiet/);
  const views = addNicheView([], {
    id: "v",
    name: " Peak ",
    tray: "open",
    query: "north",
    keeper: "Ada",
    wax: "bees",
    pace: "even",
    aisle: "peak",
    wait: "20",
    leaf: "5",
  });
  assert.equal(readNicheViews(views)[0].aisle, "peak");
  assert.equal(neighborCardCount(first), 0);

  assert.equal(crestState("ada@7fx.com"), "set");
  assert.equal(crestState("  "), "clear");
  assert.equal(crestState("12345"), "clear");
  assert.equal(crestState({ email: "ada@7fx.com", balance: 4 }), "");
  assert.equal(crestStamp("ada.north@7fx.com"), "AD9");
  assert.equal(crestStamp("northdesk@7fx.com"), "NO9");
  assert.equal(crestLane("ada+desk@7fx.com"), "plus");
  assert.equal(crestLane("ada1@7fx.com"), "digit");
  assert.equal(crestLane("ada-north@7fx.com"), "dash");
  assert.equal(crestLane("ada.north@7fx.com"), "dot");
  assert.equal(crestLane("ada@7fx.com"), "short");
  assert.equal(crestLane("northdesk@7fx.com"), "firm");
  assert.equal(crestLane("verylonglocal@mail.example.co.uk"), "long");
  assert.equal(crestLane("plainname@mail.example.co.uk"), "plain");
  assert.equal(crestHue("ada@example.com"), "slate");
  assert.equal(crestHue("ada@7fx.com"), "mist");
  assert.equal(crestHue("ada@quartz.io"), "soot");
  assert.equal(crestBound("ada@7fx.com"), true);
  assert.equal(crestBound("ada@7fx.io"), true);
  assert.equal(crestBound("ada@7fx.de"), true);
  assert.equal(crestBound("ada@7fx.org"), false);
  assert.equal(crestWide("northdeskx@7fx.com"), true);
  assert.equal(crestWide("ada@7fx.com"), false);
  assert.equal(crestNotch("ada-north@7fx.com"), true);
  assert.equal(crestNotch("ada@7fx.com"), false);
  assert.equal(crestJoin("ada+desk@7fx.com"), true);
  assert.equal(crestJoin("ada@7fx.com"), false);
  assert.equal(crestStep("ada.north@7fx.com"), 6);
  assert.equal(crestStep(""), 0);

  const book = [
    { id: "1", label: "Ada", note: "ada.north@7fx.com" },
    { id: "2", label: "Bea", note: "ada.north@7fx.com" },
    { id: "3", label: "Cem", note: "northdesk@7fx.com" },
  ];
  assert.equal(leadingCrest(book), "dot");
  assert.match(crestLanesCsv(book), /dot,2/);
  assert.match(crestRowsCsv(book, ["1"]), /ada\.north@7fx\.com,AD9,dot,mist,6,0,0,0,1,0,0,0,1,0,0,0,0,1/);

  const keys = Object.keys(ROUND247_COPY.en);
  assert.ok(keys.length >= 120);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND247_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND247_COPY[locale][key as keyof typeof ROUND247_COPY.en], "string");
      assert.ok(ROUND247_COPY[locale][key as keyof typeof ROUND247_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "nchTitle"), ROUND247_COPY.tr.nchTitle);
  assert.equal(crmv4Text("de", "emcTitle"), ROUND247_COPY.de.emcTitle);
  assert.equal(crmv4Text("ru", "nchSub"), ROUND247_COPY.ru.nchSub);
  assert.equal(crmv4Text("ar", "emcSub"), ROUND247_COPY.ar.emcSub);
  assert.equal(crmv4Text("en", "nchLogo"), "7FX");
  assert.equal(crmv4Text("en", "nchTitle"), "Niche cards");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-nch/);
  assert.match(css, /\.c4-emc-index/);
  assert.match(css, /\.c4-dupe-salon/);
  assert.match(css, /\.c4-source-salon/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round247.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /email/);
  assert.match(viewFile, /title/);
  assert.match(viewFile, /nicheCsv/);
  assert.match(viewFile, /crestRowsCsv/);
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
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-crests/);
  assert.match(viewFile, /data-traders/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestWax/);
  assert.match(viewFile, /c4-emc-search/);
  assert.match(viewFile, /nicheTimeline/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "nch"/);
  assert.match(app, /view === "emc"/);
  assert.match(app, /NicheCards/);
  assert.match(app, /EmailCrests/);
  const dupes = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round68.tsx"), "utf8");
  assert.match(dupes, /c4-dupe-salon/);
  assert.match(dupes, /data-logo="mono"/);
  const sources = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round69.tsx"), "utf8");
  assert.match(sources, /c4-source-salon/);
  assert.match(sources, /data-logo="mono"/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND247_COPY.en, key);
  const audit = viewFile.match(/"(nchAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND247_COPY.en, key);
  console.log("crmv4 round247 tests passed");
}

main();
