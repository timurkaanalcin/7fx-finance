/**
 * Volvelle leaves, login plates, the parchment call folio, and the bookmark rail.
 * Run: TZ=UTC npx tsx tests/crmv4-round289.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND289_COPY } from "../src/lib/crmv4/copy-round289";
import {
  ROUND289_FEATURES,
  activePointer,
  activeRadius,
  activeInk,
  activeDisk,
  addVolvelle,
  diskGap,
  loginDormant,
  loginDeep,
  loginEven,
  loginGap,
  loginHue,
  loginLane,
  loginLanesCsv,
  loginLeap,
  loginMark,
  loginQuarter,
  loginQuiet,
  loginRowsCsv,
  loginSpace,
  loginState,
  loginStep,
  loginTail,
  loginToday,
  loginTwin,
  loginFresh,
  dropVolvelleView,
  fairKeeper,
  firmDisk,
  fullPointer,
  houseInk,
  idleVolvelle,
  lateVolvelle,
  leadingLogin,
  liftRadius,
  lowerRadius,
  moveVolvelleFocus,
  overdueVolvelle,
  pairPointer,
  readVolvelleViews,
  restingVolvelle,
  briskVolvelle,
  softDisk,
  suggestDisk,
  volvelleBand,
  volvelleDisk,
  volvelleInk,
  volvellePointer,
  volvelleRadius,
  suggestVolvelleInk,
  suggestRadius,
  type LoginRow,
  type Volvelle,
} from "../src/lib/crmv4/round289";

const NOW = Date.parse("2026-11-13T12:00:00.000Z");

function leaf(partial: Partial<Volvelle> & { id: string; title: string }): Volvelle {
  return {
    note: "",
    keeper: "",
    disk: "",
    radius: null,
    ink: "",
    pointer: 1,
    tags: [],
    logged: false,
    locked: false,
    stowed: false,
    flagged: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND289_FEATURES.length, 25);
  assert.equal(ROUND289_FEATURES.includes("login"), true);
  assert.equal(ROUND289_FEATURES.includes("radius"), true);
  assert.equal(ROUND289_FEATURES.includes("fair-keeper"), true);
  assert.equal(volvelleDisk(" linen "), "linen");
  assert.equal(volvelleDisk("paris"), "");
  assert.equal(volvelleRadius("3"), 3);
  assert.equal(volvelleRadius(6), 6);
  assert.equal(volvelleRadius("9"), 9);
  assert.equal(volvelleRadius("2"), null);
  assert.equal(volvelleRadius("4"), null);
  assert.equal(volvellePointer("1"), 1);
  assert.equal(volvellePointer(2), 2);
  assert.equal(volvellePointer("4"), 4);
  assert.equal(volvellePointer("3"), null);
  assert.equal(volvellePointer("5"), null);
  assert.equal(volvelleInk("soot"), "SOOT");
  assert.equal(volvelleInk("gall"), "GALL");
  assert.equal(volvelleInk("gold"), "GOLD");
  assert.equal(volvelleInk("pitch"), "");
  assert.equal(firmDisk("linen"), true);
  assert.equal(firmDisk("PARCHMENT"), true);
  assert.equal(firmDisk("board"), false);
  assert.equal(softDisk("horn"), true);
  assert.equal(softDisk("board"), true);
  assert.equal(softDisk("linen"), false);
  assert.equal(volvelleBand("linen"), "dawn");
  assert.equal(volvelleBand("parchment"), "noon");
  assert.equal(volvelleBand("board"), "dusk");
  assert.equal(volvelleBand("horn"), "night");
  assert.equal(volvelleBand(""), "");
  assert.equal(diskGap("linen", "parchment"), 1);
  assert.equal(diskGap("parchment", "linen"), -1);
  assert.equal(diskGap("", "linen"), null);
  assert.equal(houseInk("gall"), true);
  assert.equal(houseInk("GOLD"), true);
  assert.equal(houseInk("soot"), false);
  assert.equal(pairPointer(2), true);
  assert.equal(pairPointer("2"), true);
  assert.equal(pairPointer(1), false);
  assert.equal(fullPointer(4), true);
  assert.equal(fullPointer(2), false);
  assert.equal(activeDisk("firm"), "firm");
  assert.equal(activeDisk("linen"), "linen");
  assert.equal(activeDisk("paris"), "all");
  assert.equal(activeRadius("6"), "6");
  assert.equal(activeRadius("4"), "all");
  assert.equal(activeInk("gold", ["SOOT", "GALL", "GOLD"]), "GOLD");
  assert.equal(activeInk("mist", ["SOOT", "GALL", "GOLD"]), "all");
  assert.equal(activePointer("2"), "2");
  assert.equal(activePointer("3"), "all");
  assert.equal(moveVolvelleFocus(0, 4, 1), 1);
  assert.equal(moveVolvelleFocus(0, 4, -1), 3);
  assert.equal(suggestVolvelleInk([]), "SOOT");
  assert.equal(suggestRadius([], 5), 3);
  assert.equal(suggestRadius([], 10), 6);
  assert.equal(suggestRadius([], 20), 9);
  assert.equal(suggestDisk(8), "linen");
  assert.equal(suggestDisk(12), "horn");
  assert.equal(fairKeeper([leaf({ id: "1", title: "Linen", keeper: "Ada" })], "Ada,Bea"), "Bea");

  const saved = addVolvelle([], { id: "1", title: "Horn", disk: "horn", radius: 3, ink: "gall", pointer: 1, keeper: "Ada" });
  assert.equal(saved[0].audit, "save");
  assert.equal(overdueVolvelle(saved[0]), true);
  assert.equal(briskVolvelle(saved[0]), false);
  assert.equal(liftRadius(saved, "1")[0].radius, 6);
  assert.equal(lowerRadius([{ ...saved[0], radius: null }], "1")[0].radius, 9);
  const quiet = leaf({ id: "2", title: "Calm", disk: "horn", ink: "", radius: 3, pointer: 1 });
  assert.equal(idleVolvelle(quiet), true);
  assert.equal(lateVolvelle(leaf({ id: "4", title: "Late", disk: "linen", pointer: 1 }), "horn"), true);
  const rest = leaf({ id: "3", title: "Rest", disk: "horn", ink: "SOOT", radius: 6, pointer: 2 });
  assert.equal(restingVolvelle(rest), true);
  assert.equal(briskVolvelle(leaf({ id: "5", title: "Keen", disk: "linen", ink: "GOLD", radius: 9, pointer: 4 })), true);
  const views = readVolvelleViews([{ id: "v1", name: "Dawn", tray: "drawer", disk: "firm", radius: "6", pointer: "2", ink: "gall" }]);
  assert.equal(views[0].tray, "drawer");
  assert.equal(views[0].disk, "firm");
  assert.equal(views[0].ink, "GALL");
  assert.equal(dropVolvelleView(views, "v1").length, 0);

  assert.equal(loginLane("2026-11-13T11:00:00.000Z", NOW), "fresh");
  assert.equal(loginFresh("2026-11-13T11:00:00.000Z", NOW), true);
  assert.equal(loginLane("2026-11-10T12:00:00.000Z", NOW), "week");
  assert.equal(loginLane("2026-10-20T12:00:00.000Z", NOW), "month");
  assert.equal(loginLane("2026-09-01T12:00:00.000Z", NOW), "season");
  assert.equal(loginLane("2026-06-01T12:00:00.000Z", NOW), "dormant");
  assert.equal(loginDormant("2026-06-01T12:00:00.000Z", NOW), true);
  assert.equal(loginLane("", NOW), "");
  assert.equal(loginQuiet(""), true);
  assert.equal(loginQuiet({ lastLoginAt: "2026-11-13T11:00:00.000Z" }), false);
  assert.equal(loginHue("2026-11-13T11:00:00.000Z", NOW), "champagne");
  assert.equal(loginHue("2026-06-01T12:00:00.000Z", NOW), "graphite");
  assert.equal(loginHue("2026-11-10T12:00:00.000Z", NOW), "ivory");
  assert.equal(loginToday("2026-11-13T11:00:00.000Z", NOW), true);
  assert.equal(loginToday("2026-11-12T11:00:00.000Z", NOW), false);
  assert.equal(loginQuarter("2026-10-20T12:00:00.000Z", NOW), true);
  assert.equal(loginQuarter("2026-08-01T12:00:00.000Z", NOW), false);
  assert.equal(loginEven("2026-11-12T11:00:00.000Z", NOW), true);
  assert.equal(loginEven("2026-11-13T11:00:00.000Z", NOW), false);
  assert.equal(loginStep("2026-11-13T11:00:00.000Z", NOW), 11);
  assert.equal(loginStep("", NOW), 0);
  assert.equal(loginLeap("2024-11-13T11:00:00.000Z", NOW), true);
  assert.equal(loginLeap("2026-11-13T11:00:00.000Z", NOW), false);
  assert.equal(loginGap("2026-10-20T12:00:00.000Z", NOW), true);
  assert.equal(loginGap("2026-11-10T12:00:00.000Z", NOW), false);
  assert.equal(loginDeep("2026-09-01T12:00:00.000Z", NOW), true);
  assert.equal(loginDeep("2026-10-20T12:00:00.000Z", NOW), false);
  assert.equal(loginTwin("2026-11-07T12:00:00.000Z", NOW), true);
  assert.equal(loginTwin("2026-11-13T11:00:00.000Z", NOW), false);
  assert.equal(loginTail("2026-11-13T11:00:00.000Z"), true);
  assert.equal(loginTail("2026-11-13T11:00:00"), false);
  assert.equal(loginMark("2026-11-13T11:00:00.000Z"), true);
  assert.equal(loginSpace("2026-11-13 11:00:00Z"), true);
  assert.equal(loginState({ lastLoginAt: "2026-11-13T11:00:00.000Z", amount: 3 }, NOW), "");
  assert.equal(loginState("", NOW), "clear");
  assert.equal(loginState({ city: "x" }, NOW), "");
  const rows: LoginRow[] = [
    { id: "1", label: "Ada", signed: "2026-11-13T11:00:00.000Z" },
    { id: "2", label: "Bea", signed: "2026-11-10T12:00:00.000Z" },
  ];
  assert.equal(leadingLogin(rows, NOW), "fresh");
  assert.match(loginLanesCsv(rows, NOW), /fresh,1/);
  assert.match(loginLanesCsv(rows, NOW), /week,1/);
  assert.match(loginRowsCsv(rows, ["1"], NOW), /Ada,2026-11-13T11:00:00.000Z/);

  const locales = ["en", "tr", "de", "ru", "ar"] as const;
  const keys = Object.keys(ROUND289_COPY.en).sort();
  for (const locale of locales) assert.deepEqual(Object.keys(ROUND289_COPY[locale]).sort(), keys);
  assert.equal(crmv4Text("tr", "vlvTitle"), ROUND289_COPY.tr.vlvTitle);
  assert.equal(crmv4Text("de", "lgnTitle"), ROUND289_COPY.de.lgnTitle);
  assert.equal(crmv4Text("ru", "vlvSub"), ROUND289_COPY.ru.vlvSub);
  assert.equal(crmv4Text("ar", "lgnSub"), ROUND289_COPY.ar.lgnSub);
  assert.equal(crmv4Text("en", "vlvLogo"), "7FX");
  assert.equal(crmv4Text("en", "lgnLogo"), "7FX");
  assert.equal(crmv4Text("en", "vlvTitle"), "Volvelle leaves");
  assert.equal(crmv4Text("en", "lgnTitle"), "Login plates");
  assert.equal(crmv4Text("en", "cpFolioKicker"), "Parchment folio");
  assert.equal(crmv4Text("en", "mbRailKicker"), "Bookmark rail");
  assert.notEqual(ROUND289_COPY.tr.vlvTitle, ROUND289_COPY.en.vlvTitle);
  assert.notEqual(ROUND289_COPY.ar.lgnTitle, ROUND289_COPY.en.lgnTitle);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-volvelle/);
  assert.match(css, /\.c4-login-index/);
  assert.match(css, /\.c4-volvelle-column/);
  assert.match(css, /\.c4-login-column/);
  assert.match(css, /\.c4-call-folio/);
  assert.match(css, /\.c4-bookmark-rail-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round289.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /lastLoginAt:/);
  assert.match(viewFile, /volvelleCsv/);
  assert.match(viewFile, /loginRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0&role=TRADER/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestVolvelleInk/);
  assert.match(viewFile, /c4-login-search/);
  assert.match(viewFile, /volvelleTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "vlv"/);
  assert.match(app, /view === "lgn"/);
  const folio = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round79.tsx"), "utf8");
  const rail = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round80.tsx"), "utf8");
  assert.match(folio, /c4-call-folio/);
  assert.match(folio, /c4-call-folio-mast/);
  assert.match(folio, /data-logo="mono"/);
  assert.match(folio, /cpFolioKicker/);
  assert.match(folio, /cpFolioLead/);
  assert.match(folio, /data-call-pack/);
  assert.match(rail, /c4-bookmark-rail/);
  assert.match(rail, /c4-bookmark-rail-mast/);
  assert.match(rail, /mbRailKicker/);
  assert.match(rail, /mbRailLead/);
  assert.match(rail, /data-mark-bar/);
  assert.equal(rail.includes("counts"), false);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND289_COPY.en, key);
  const named = viewFile.match(/"(vlv|lgn|cpFolio|mbRail)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of named) assert.ok(key in ROUND289_COPY.en, key);
  console.log("crmv4 round289 tests passed");
}

main();
