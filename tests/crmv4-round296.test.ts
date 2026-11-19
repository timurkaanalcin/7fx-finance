/**
 * Triquetrum rules, username plates, the ivory pad gallery, and the graphite order colonnade.
 * Run: TZ=UTC npx tsx tests/crmv4-round296.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND296_COPY } from "../src/lib/crmv4/copy-round296";
import {
  ROUND296_FEATURES,
  activeInk,
  activeNotch,
  activePeg,
  activeSpan,
  addTriquetrum,
  briskTriquetrum,
  dropTriquetrumView,
  fairRuleSighter,
  fullPeg,
  houseInk,
  idleTriquetrum,
  innerSpan,
  lateTriquetrum,
  leadingUsername,
  liftNotch,
  lowerNotch,
  moveTriquetrumFocus,
  outerSpan,
  overdueTriquetrum,
  pairPeg,
  readTriquetrumViews,
  restingTriquetrum,
  spanGap,
  suggestNotch,
  suggestSpan,
  suggestTriquetrumInk,
  triquetrumBand,
  triquetrumInk,
  triquetrumNotch,
  triquetrumPeg,
  triquetrumSpan,
  usernameEven,
  usernameFirst,
  usernameHue,
  usernameLane,
  usernameLanesCsv,
  usernameLength,
  usernameMark,
  usernameRowsCsv,
  usernameSoon,
  usernameSpace,
  usernameState,
  usernameTail,
  usernameVowel,
  type Triquetrum,
  type UsernameRow,
} from "../src/lib/crmv4/round296";

function rule(partial: Partial<Triquetrum> & { id: string; title: string }): Triquetrum {
  return {
    note: "",
    sighter: "",
    span: "",
    notch: null,
    ink: "",
    peg: 2,
    tags: [],
    sighted: false,
    sleeved: false,
    coffered: false,
    flagged: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND296_FEATURES.length, 25);
  assert.equal(ROUND296_FEATURES.includes("username"), true);
  assert.equal(ROUND296_FEATURES.includes("notch"), true);
  assert.equal(ROUND296_FEATURES.includes("fair-sighter"), true);
  assert.equal(triquetrumSpan(" base "), "base");
  assert.equal(triquetrumSpan("brass"), "");
  assert.equal(triquetrumNotch("6"), 6);
  assert.equal(triquetrumNotch(12), 12);
  assert.equal(triquetrumNotch("24"), 24);
  assert.equal(triquetrumNotch("20"), null);
  assert.equal(triquetrumPeg("2"), 2);
  assert.equal(triquetrumPeg(6), 6);
  assert.equal(triquetrumPeg("9"), 9);
  assert.equal(triquetrumPeg("4"), null);
  assert.equal(triquetrumInk("dry"), "DRY");
  assert.equal(triquetrumInk("wash"), "WASH");
  assert.equal(triquetrumInk("gilt"), "GILT");
  assert.equal(triquetrumInk("hot"), "");
  assert.equal(innerSpan("base"), true);
  assert.equal(innerSpan("JOINT"), true);
  assert.equal(innerSpan("sight"), false);
  assert.equal(outerSpan("crown"), true);
  assert.equal(outerSpan("sight"), true);
  assert.equal(outerSpan("base"), false);
  assert.equal(triquetrumBand("base"), "plinth");
  assert.equal(triquetrumBand("joint"), "hinge");
  assert.equal(triquetrumBand("sight"), "vane");
  assert.equal(triquetrumBand("crown"), "apex");
  assert.equal(triquetrumBand(""), "");
  assert.equal(spanGap("base", "crown"), 3);
  assert.equal(spanGap("sight", "nope"), null);
  assert.equal(houseInk("wash"), true);
  assert.equal(houseInk("dry"), false);
  assert.equal(pairPeg(6), true);
  assert.equal(pairPeg(2), false);
  assert.equal(fullPeg("9"), true);
  assert.equal(fullPeg(6), false);
  assert.equal(activeSpan("inner"), "inner");
  assert.equal(activeSpan("crown"), "crown");
  assert.equal(activeSpan("gold"), "all");
  assert.equal(activeNotch("24"), "24");
  assert.equal(activeNotch("20"), "all");
  assert.equal(activePeg("2"), "2");
  assert.equal(activePeg("3"), "all");
  assert.equal(activeInk("gilt", ["GILT"]), "GILT");
  assert.equal(activeInk("hot", ["GILT"]), "all");
  assert.equal(moveTriquetrumFocus(0, 3, -1), 2);
  assert.equal(moveTriquetrumFocus(0, 0, 1), 0);

  const cards = [
    rule({ id: "a", title: "Ada", span: "crown", peg: 2, sighter: "Ned" }),
    rule({ id: "b", title: "Bea", span: "base", ink: "GILT", notch: 24, peg: 9, sighter: "Ned" }),
    rule({ id: "c", title: "Cara", span: "sight", ink: "DRY", notch: 12, sighter: "Ida" }),
  ];
  assert.equal(overdueTriquetrum(cards[0]), true);
  assert.equal(briskTriquetrum(cards[1]), true);
  assert.equal(restingTriquetrum(rule({ id: "r", title: "Rest", span: "crown", ink: "DRY", notch: 12 })), true);
  assert.equal(idleTriquetrum(rule({ id: "i", title: "Idle", notch: 6, peg: 2 })), true);
  assert.equal(lateTriquetrum(cards[1], "crown"), true);
  assert.equal(lateTriquetrum(cards[1], "base"), false);
  assert.equal(suggestTriquetrumInk(cards), "DRY");
  assert.equal(suggestTriquetrumInk([...cards, rule({ id: "d", title: "Dora", ink: "GILT" })]), "GILT");
  assert.equal(suggestNotch([], 8), 6);
  assert.equal(suggestNotch([], 12), 12);
  assert.equal(suggestNotch([], 20), 24);
  assert.equal(suggestNotch(cards, 8), 12);
  assert.equal(suggestNotch([...cards, rule({ id: "e", title: "Eve", notch: 24 })], 8), 24);
  assert.equal(suggestSpan(10), "base");
  assert.equal(suggestSpan(15), "crown");
  assert.equal(fairRuleSighter(cards, "Ned,Ida"), "Ida");
  const added = addTriquetrum(cards, { title: "Dora", span: "joint", notch: "12", peg: "6", tags: "a b c" });
  assert.equal(added.length, 4);
  assert.equal(added[3].audit, "save");
  assert.deepEqual(added[3].tags, ["a", "b"]);
  assert.equal(addTriquetrum(cards, { title: "Ada" }).length, 3);
  const lifted = liftNotch(cards, "a");
  assert.equal(lifted[0].notch, 6);
  assert.equal(lowerNotch(lifted, "a")[0].notch, 24);
  assert.equal(dropTriquetrumView([{ id: "v", name: "Desk", tray: "rule", query: "", sighter: "", ink: "all", span: "all", notch: "all", peg: "all" }], "v").length, 0);
  assert.equal(readTriquetrumViews([{ id: "", name: "x" }]).length, 0);

  assert.equal(usernameLane("ab"), "glyph");
  assert.equal(usernameLane("amina"), "stem");
  assert.equal(usernameLane("deskuser1"), "knot");
  assert.equal(usernameLane("ada_nine"), "braid");
  assert.equal(usernameLane("superlongnamex"), "scroll");
  assert.equal(usernameLane("longlettered"), "plain");
  assert.equal(usernameLane(""), "");
  assert.equal(usernameState(""), "clear");
  assert.equal(usernameState({ city: "x" }), "");
  assert.equal(usernameState({ username: "ada", amount: 3 }), "");
  assert.equal(usernameState({ username: "ada" }), "set");
  assert.equal(usernameHue("ab"), "champagne");
  assert.equal(usernameHue("amina"), "ivory");
  assert.equal(usernameHue("deskuser1"), "champagne");
  assert.equal(usernameHue("ada_nine"), "graphite");
  assert.equal(usernameHue("longlettered"), "ivory");
  assert.equal(usernameSoon("ab"), true);
  assert.equal(usernameSoon("ada"), false);
  assert.equal(usernameLength("amina"), 5);
  assert.equal(usernameLength(""), null);
  assert.equal(usernameEven("ab"), true);
  assert.equal(usernameEven("amina"), false);
  assert.equal(usernameFirst("amina"), true);
  assert.equal(usernameFirst("1ada"), false);
  assert.equal(usernameTail("deskuser1"), true);
  assert.equal(usernameTail("amina"), false);
  assert.equal(usernameMark("Amina"), true);
  assert.equal(usernameMark("amina"), false);
  assert.equal(usernameSpace("ada bee"), true);
  assert.equal(usernameVowel("amina"), true);
  assert.equal(usernameVowel("desk"), false);
  const rows: UsernameRow[] = [
    { id: "1", label: "Ada", handle: "ab" },
    { id: "2", label: "Bea", handle: "superlongnamex" },
  ];
  assert.equal(leadingUsername(rows), "glyph");
  assert.match(usernameLanesCsv(rows), /glyph,1/);
  assert.match(usernameLanesCsv(rows), /scroll,1/);
  assert.match(usernameRowsCsv(rows, ["1"]), /Ada,ab/);

  const locales = ["en", "tr", "de", "ru", "ar"] as const;
  const keys = Object.keys(ROUND296_COPY.en).sort();
  for (const locale of locales) assert.deepEqual(Object.keys(ROUND296_COPY[locale]).sort(), keys);
  assert.equal(crmv4Text("tr", "tqtTitle"), ROUND296_COPY.tr.tqtTitle);
  assert.equal(crmv4Text("de", "unpTitle"), ROUND296_COPY.de.unpTitle);
  assert.equal(crmv4Text("ru", "tqtSub"), ROUND296_COPY.ru.tqtSub);
  assert.equal(crmv4Text("ar", "unpSub"), ROUND296_COPY.ar.unpSub);
  assert.equal(crmv4Text("en", "tqtLogo"), "7FX");
  assert.equal(crmv4Text("en", "unpLogo"), "7FX");
  assert.equal(crmv4Text("en", "tqtTitle"), "Triquetrum rules");
  assert.equal(crmv4Text("en", "unpTitle"), "Username plates");
  assert.equal(crmv4Text("en", "npGalleryKicker"), "Ivory pad gallery");
  assert.equal(crmv4Text("en", "ogColonnadeKicker"), "Graphite order colonnade");
  assert.notEqual(ROUND296_COPY.tr.tqtTitle, ROUND296_COPY.en.tqtTitle);
  assert.notEqual(ROUND296_COPY.ar.unpTitle, ROUND296_COPY.en.unpTitle);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-triquetrum/);
  assert.match(css, /\.c4-username-index/);
  assert.match(css, /\.c4-triquetrum-column/);
  assert.match(css, /\.c4-username-column/);
  assert.match(css, /\.c4-pad-gallery/);
  assert.match(css, /\.c4-order-colonnade-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round296.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /username:/);
  assert.match(viewFile, /triquetrumCsv/);
  assert.match(viewFile, /usernameRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0&role=TRADER/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestTriquetrumInk/);
  assert.match(viewFile, /c4-username-search/);
  assert.match(viewFile, /triquetrumTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "tqt"/);
  assert.match(app, /view === "unp"/);
  const court = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round90.tsx"), "utf8");
  assert.match(court, /c4-pad-gallery/);
  assert.match(court, /c4-pad-gallery-mast/);
  assert.match(court, /data-logo="mono"/);
  assert.match(court, /npGalleryKicker/);
  assert.match(court, /npGalleryLead/);
  assert.match(court, /data-scratch-pads/);
  assert.equal(court.includes("amount"), false);
  assert.equal(court.includes("price"), false);
  assert.equal(court.includes("profit"), false);
  assert.match(court, /c4-order-colonnade/);
  assert.match(court, /c4-order-colonnade-mast/);
  assert.match(court, /ogColonnadeKicker/);
  assert.match(court, /ogColonnadeLead/);
  assert.match(court, /data-order-glance/);
  const named = `${viewFile}\n${court}`.match(/"(tqt|unp|npGallery|ogColonnade)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of named) assert.equal(typeof ROUND296_COPY.en[key as keyof typeof ROUND296_COPY.en], "string", key);
  console.log("crmv4 round296 tests passed");
}

main();
