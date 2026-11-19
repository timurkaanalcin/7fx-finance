/**
 * Clepsydra rules, portolan plates, the ivory place palaestra, and the graphite browser basilica.
 * Run: TZ=UTC npx tsx tests/crmv4-round318.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND318_COPY } from "../src/lib/crmv4/copy-round318";
import {
  ROUND318_FEATURES,
  activeBeat,
  activeDrop,
  activeInk,
  activeVessel,
  addClepsydra,
  briskClepsydra,
  clepsydraBand,
  clepsydraBeat,
  clepsydraDrop,
  clepsydraGap,
  clepsydraInk,
  clepsydraInner,
  clepsydraOuter,
  clepsydraTimeline,
  clepsydraVessel,
  dropClepsydraView,
  fairKeeper,
  fullBeat,
  houseInk,
  idleClepsydra,
  lateClepsydra,
  leadingPortolan,
  moveClepsydraFocus,
  overdueClepsydra,
  pairBeat,
  portolanBay,
  portolanBuoy,
  portolanCapital,
  portolanChannel,
  portolanCipher,
  portolanEven,
  portolanFirst,
  portolanHarbor,
  portolanHue,
  portolanLane,
  portolanLanesCsv,
  portolanLength,
  portolanLower,
  portolanMouth,
  portolanOcean,
  portolanOpen,
  portolanQuay,
  portolanRowsCsv,
  portolanSpace,
  portolanState,
  portolanTail,
  portolanUpper,
  readClepsydraViews,
  restingClepsydra,
  suggestDrop,
  suggestInk,
  suggestVessel,
  type Clepsydra,
  type PortolanRow,
} from "../src/lib/crmv4/round318";

function rule(partial: Partial<Clepsydra> & { id: string; title: string }): Clepsydra {
  return {
    note: "",
    keeper: "",
    vessel: "",
    drop: null,
    ink: "",
    beat: 2,
    tags: [],
    run: false,
    pegged: false,
    casketed: false,
    starred: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND318_FEATURES.length, 25);
  assert.equal(ROUND318_FEATURES.includes("referral-portolan"), true);
  assert.equal(ROUND318_FEATURES.includes("drop-sla"), true);
  assert.equal(ROUND318_FEATURES.includes("fair-keeper"), true);
  assert.equal(ROUND318_FEATURES.includes("casket"), true);
  assert.equal(ROUND318_FEATURES.includes("gilt-ink"), true);
  assert.equal(clepsydraVessel(" bowl "), "bowl");
  assert.equal(clepsydraVessel("brass"), "");
  assert.equal(clepsydraDrop("4"), 4);
  assert.equal(clepsydraDrop(8), 8);
  assert.equal(clepsydraDrop(12), 12);
  assert.equal(clepsydraDrop(24), 24);
  assert.equal(clepsydraDrop("7"), null);
  assert.equal(clepsydraBeat("2"), 2);
  assert.equal(clepsydraBeat(4), 4);
  assert.equal(clepsydraBeat("8"), 8);
  assert.equal(clepsydraBeat("6"), null);
  assert.equal(clepsydraInk("gilt"), "GILT");
  assert.equal(clepsydraInk("ivory"), "IVORY");
  assert.equal(clepsydraInk("graphite"), "GRAPHITE");
  assert.equal(clepsydraInk("hot"), "");
  assert.equal(clepsydraInner("bowl"), true);
  assert.equal(clepsydraInner("TUBE"), true);
  assert.equal(clepsydraInner("cistern"), false);
  assert.equal(clepsydraOuter("cistern"), true);
  assert.equal(clepsydraOuter("spout"), true);
  assert.equal(clepsydraOuter("bowl"), false);
  assert.equal(clepsydraBand("bowl"), "lip");
  assert.equal(clepsydraBand("tube"), "stem");
  assert.equal(clepsydraBand("cistern"), "well");
  assert.equal(clepsydraBand("spout"), "mouth");
  assert.equal(clepsydraBand(""), "");
  assert.equal(clepsydraGap("bowl", "spout"), 3);
  assert.equal(clepsydraGap("cistern", "nope"), null);
  assert.equal(houseInk("gilt"), true);
  assert.equal(houseInk("ivory"), false);
  assert.equal(pairBeat(4), true);
  assert.equal(pairBeat(2), false);
  assert.equal(fullBeat("8"), true);
  assert.equal(fullBeat(4), false);
  assert.equal(activeVessel("inner"), "inner");
  assert.equal(activeVessel("cistern"), "cistern");
  assert.equal(activeVessel("gold"), "all");
  assert.equal(activeDrop("24"), "24");
  assert.equal(activeDrop("4"), "4");
  assert.equal(activeDrop("7"), "all");
  assert.equal(activeBeat("2"), "2");
  assert.equal(activeBeat("3"), "all");
  assert.equal(activeInk("graphite", ["GRAPHITE"]), "GRAPHITE");
  assert.equal(activeInk("hot", ["GRAPHITE"]), "all");
  assert.equal(moveClepsydraFocus(0, 3, -1), 2);
  assert.equal(moveClepsydraFocus(0, 0, 1), 0);

  const cards = [
    rule({ id: "a", title: "Ada", vessel: "cistern", beat: 2, keeper: "Ned" }),
    rule({ id: "b", title: "Bea", vessel: "bowl", ink: "GRAPHITE", drop: 24, beat: 8, keeper: "Ned" }),
    rule({ id: "c", title: "Cara", vessel: "spout", ink: "IVORY", drop: 8, keeper: "Ida" }),
  ];
  assert.equal(overdueClepsydra(cards[0]), true);
  assert.equal(briskClepsydra(cards[1]), true);
  assert.equal(restingClepsydra(cards[2]), true);
  assert.equal(idleClepsydra(rule({ id: "i", title: "Idle", drop: 4, beat: 2 })), true);
  assert.equal(lateClepsydra(cards[1], "spout"), true);
  assert.equal(lateClepsydra(cards[1], "bowl"), false);
  assert.equal(suggestInk([]), "IVORY");
  assert.equal(suggestInk(cards), "GILT");
  assert.equal(suggestDrop([], 4), 4);
  assert.equal(suggestDrop([], 6), 8);
  assert.equal(suggestDrop([], 12), 12);
  assert.equal(suggestDrop([], 18), 24);
  assert.equal(suggestDrop(cards, 6), 12);
  assert.equal(suggestVessel(4), "bowl");
  assert.equal(suggestVessel(8), "spout");
  assert.equal(fairKeeper(cards, "Ida,Ned"), "Ida");
  const saved = addClepsydra([], { title: "Dora", vessel: "cistern", ink: "ivory", drop: "8", beat: "4", tags: "p q r" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].ink, "IVORY");
  assert.equal(saved[0].drop, 8);
  assert.equal(saved[0].beat, 4);
  assert.equal(saved[0].tags.join(""), "pq");
  assert.equal(addClepsydra(saved, { title: "Dora" }).length, 1);
  assert.equal(dropClepsydraView([{ id: "v", name: "Morning", tray: "basin", query: "", keeper: "", ink: "all", vessel: "all", drop: "all", beat: "all" }], "v").length, 0);
  assert.equal(readClepsydraViews([{ id: "v", name: "Morning", tray: "peg" }])[0].tray, "peg");

  assert.equal(portolanQuay("HOUSE"), true);
  assert.equal(portolanQuay({ referral: true }), true);
  assert.equal(portolanBay({ referral: false }), true);
  assert.equal(portolanQuay({ referral: "road" }), false);
  assert.equal(portolanChannel("re-check"), true);
  assert.equal(portolanBay("needs review"), true);
  assert.equal(portolanBuoy("US"), true);
  assert.equal(portolanBuoy("NET"), false);
  assert.equal(portolanOcean("Netherlands"), false);
  assert.equal(portolanOcean("LongReferral"), true);
  assert.equal(portolanLane("US"), "buoy");
  assert.equal(portolanLane("10.1.1.1"), "cipher");
  assert.equal(portolanLane("Amsterdam"), "mouth");
  assert.equal(portolanLane("Paris"), "harbor");
  assert.equal(portolanHarbor("Paris"), true);
  assert.equal(portolanOpen(""), true);
  assert.equal(portolanOpen({ referral: "" }), true);
  assert.equal(portolanState({ name: "Ada" }), "");
  assert.equal(portolanState({ referral: "Paris", balance: 1 }), "");
  assert.equal(portolanHue("HOUSE"), "champagne");
  assert.equal(portolanHue("needs review"), "graphite");
  assert.equal(portolanHue("Amsterdam"), "ivory");
  assert.equal(portolanLength("hold"), 4);
  assert.equal(portolanEven("hold"), true);
  assert.equal(portolanFirst("Paris"), true);
  assert.equal(portolanSpace("needs review"), true);
  assert.equal(portolanMouth("Amsterdam"), true);
  assert.equal(portolanCipher("Room4"), true);
  assert.equal(portolanCapital("PARIS"), true);
  assert.equal(portolanLower("paris"), true);
  assert.equal(portolanUpper("PARIS"), true);
  assert.equal(portolanUpper("NET"), false);
  assert.equal(portolanTail("Room4"), true);
  const marks: PortolanRow[] = [
    { id: "1", label: "Ada", code: "HOUSE" },
    { id: "2", label: "Bea", code: "DESK" },
    { id: "3", label: "Cara", code: "Paris" },
  ];
  assert.equal(leadingPortolan(marks), "quay");
  assert.match(portolanLanesCsv(marks), /quay,2/);
  assert.match(portolanRowsCsv(marks, ["1"]), /Ada,HOUSE/);
  assert.match(clepsydraTimeline(cards).map((lane) => lane.drop).join(","), /24|8/);
  assert.equal(crmv4Text("tr", "ckyTitle"), ROUND318_COPY.tr.ckyTitle);
  assert.equal(crmv4Text("de", "ptlTitle"), ROUND318_COPY.de.ptlTitle);
  assert.equal(crmv4Text("ru", "plcPalaestraKicker"), ROUND318_COPY.ru.plcPalaestraKicker);
  assert.equal(crmv4Text("ar", "brwBasilicaLead"), ROUND318_COPY.ar.brwBasilicaLead);
  const keys = Object.keys(ROUND318_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND318_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-clepsydra/);
  assert.match(css, /\.c4-portolan/);
  assert.match(css, /\.c4-clepsydra-column/);
  assert.match(css, /\.c4-portolan-column/);
  assert.match(css, /\.c4-place-palaestra/);
  assert.match(css, /\.c4-browser-basilica/);
  assert.match(css, /\.c4-place-palaestra-mast/);
  assert.match(css, /\.c4-browser-basilica-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round318.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /referralCodeUsed/);
  assert.match(viewFile, /clepsydraCsv/);
  assert.match(viewFile, /portolanRowsCsv/);
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
  assert.match(viewFile, /c4-portolan-search/);
  assert.match(viewFile, /clepsydraTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "cky"/);
  assert.match(app, /view === "ptl"/);
  const host = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round138.tsx"), "utf8");
  assert.match(host, /c4-place-palaestra/);
  assert.match(host, /c4-place-palaestra-mast/);
  assert.match(host, /data-logo="mono"/);
  assert.match(host, /plcPalaestraKicker/);
  assert.match(host, /plcPalaestraLead/);
  assert.match(host, /data-place/);
  assert.equal(host.includes("amount"), false);
  assert.match(host, /c4-browser-basilica/);
  assert.match(host, /c4-browser-basilica-mast/);
  assert.match(host, /brwBasilicaKicker/);
  assert.match(host, /brwBasilicaLead/);
  assert.match(host, /data-browser/);
  assert.equal(host.includes("currency"), false);
  assert.equal(host.includes("saleStatus"), false);
  const namedKeys = `${viewFile}\n${host}`.match(/"(cky|ptl|plcPalaestra|brwBasilica)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND318_COPY.en[key as keyof typeof ROUND318_COPY.en], "string", key);
  console.log("crmv4 round318 tests passed");
}

main();
