/**
 * Dioptra sights, email plates, the ivory side cloister, and the graphite license court.
 * Run: TZ=UTC npx tsx tests/crmv4-round297.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND297_COPY } from "../src/lib/crmv4/copy-round297";
import {
  ROUND297_FEATURES,
  activeAltitude,
  activeBearing,
  activeFinish,
  activeVane,
  addDioptra,
  bearingGap,
  briskDioptra,
  dioptraBand,
  dioptraBearing,
  dioptraAltitude,
  dioptraFinish,
  dioptraVane,
  dropDioptraView,
  emailAlias,
  emailDomain,
  emailEven,
  emailFirst,
  emailHouse,
  emailHue,
  emailLane,
  emailLanesCsv,
  emailLength,
  emailMark,
  emailNest,
  emailPlus,
  emailRowsCsv,
  emailSoon,
  emailSpace,
  emailState,
  emailTail,
  emailVowel,
  fairDioptraSurveyor,
  fullVane,
  houseFinish,
  idleDioptra,
  innerBearing,
  lateDioptra,
  leadingEmail,
  liftAltitude,
  lowerAltitude,
  moveDioptraFocus,
  outerBearing,
  overdueDioptra,
  pairVane,
  readDioptraViews,
  restingDioptra,
  suggestAltitude,
  suggestBearing,
  suggestDioptraFinish,
  type Dioptra,
  type EmailRow,
} from "../src/lib/crmv4/round297";

function sight(partial: Partial<Dioptra> & { id: string; title: string }): Dioptra {
  return {
    note: "",
    surveyor: "",
    bearing: "",
    altitude: null,
    finish: "",
    vane: 1,
    tags: [],
    aligned: false,
    cased: false,
    vaulted: false,
    flagged: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND297_FEATURES.length, 25);
  assert.equal(ROUND297_FEATURES.includes("email"), true);
  assert.equal(ROUND297_FEATURES.includes("altitude"), true);
  assert.equal(ROUND297_FEATURES.includes("fair-surveyor"), true);
  assert.equal(dioptraBearing(" north "), "north");
  assert.equal(dioptraBearing("brass"), "");
  assert.equal(dioptraAltitude("15"), 15);
  assert.equal(dioptraAltitude(30), 30);
  assert.equal(dioptraAltitude("45"), 45);
  assert.equal(dioptraAltitude("60"), 60);
  assert.equal(dioptraAltitude("20"), null);
  assert.equal(dioptraVane("1"), 1);
  assert.equal(dioptraVane(3), 3);
  assert.equal(dioptraVane("5"), 5);
  assert.equal(dioptraVane("4"), null);
  assert.equal(dioptraFinish("chalk"), "CHALK");
  assert.equal(dioptraFinish("ink"), "INK");
  assert.equal(dioptraFinish("bronze"), "BRONZE");
  assert.equal(dioptraFinish("hot"), "");
  assert.equal(innerBearing("north"), true);
  assert.equal(innerBearing("EAST"), true);
  assert.equal(innerBearing("south"), false);
  assert.equal(outerBearing("west"), true);
  assert.equal(outerBearing("south"), true);
  assert.equal(outerBearing("north"), false);
  assert.equal(dioptraBand("north"), "pole");
  assert.equal(dioptraBand("east"), "dawn");
  assert.equal(dioptraBand("south"), "meridian");
  assert.equal(dioptraBand("west"), "dusk");
  assert.equal(dioptraBand(""), "");
  assert.equal(bearingGap("north", "west"), 3);
  assert.equal(bearingGap("south", "nope"), null);
  assert.equal(houseFinish("ink"), true);
  assert.equal(houseFinish("chalk"), false);
  assert.equal(pairVane(3), true);
  assert.equal(pairVane(1), false);
  assert.equal(fullVane("5"), true);
  assert.equal(fullVane(3), false);
  assert.equal(activeBearing("inner"), "inner");
  assert.equal(activeBearing("west"), "west");
  assert.equal(activeBearing("gold"), "all");
  assert.equal(activeAltitude("60"), "60");
  assert.equal(activeAltitude("20"), "all");
  assert.equal(activeVane("1"), "1");
  assert.equal(activeVane("4"), "all");
  assert.equal(activeFinish("bronze", ["BRONZE"]), "BRONZE");
  assert.equal(activeFinish("hot", ["BRONZE"]), "all");
  assert.equal(moveDioptraFocus(0, 3, -1), 2);
  assert.equal(moveDioptraFocus(0, 0, 1), 0);

  const cards = [
    sight({ id: "a", title: "Ada", bearing: "west", vane: 1, surveyor: "Ned" }),
    sight({ id: "b", title: "Bea", bearing: "north", finish: "BRONZE", altitude: 60, vane: 5, surveyor: "Ned" }),
    sight({ id: "c", title: "Cara", bearing: "south", finish: "CHALK", altitude: 30, surveyor: "Ida" }),
  ];
  assert.equal(overdueDioptra(cards[0]), true);
  assert.equal(briskDioptra(cards[1]), true);
  assert.equal(restingDioptra(sight({ id: "r", title: "Rest", bearing: "west", finish: "CHALK", altitude: 30 })), true);
  assert.equal(idleDioptra(sight({ id: "i", title: "Idle", altitude: 15, vane: 1 })), true);
  assert.equal(lateDioptra(cards[1], "west"), true);
  assert.equal(lateDioptra(cards[1], "north"), false);
  assert.equal(suggestDioptraFinish(cards), "CHALK");
  assert.equal(suggestDioptraFinish([...cards, sight({ id: "d", title: "Dora", finish: "BRONZE" })]), "BRONZE");
  assert.equal(suggestAltitude([], 7), 15);
  assert.equal(suggestAltitude([], 12), 30);
  assert.equal(suggestAltitude([], 16), 45);
  assert.equal(suggestAltitude([], 20), 60);
  assert.equal(suggestAltitude(cards, 8), 30);
  assert.equal(suggestAltitude([...cards, sight({ id: "e", title: "Eve", altitude: 60 })], 8), 60);
  assert.equal(suggestBearing(10), "north");
  assert.equal(suggestBearing(15), "west");
  assert.equal(fairDioptraSurveyor(cards, "Ned,Ida"), "Ida");
  const added = addDioptra(cards, { title: "Dora", bearing: "east", altitude: "30", vane: "3", tags: "n s t" });
  assert.equal(added.length, 4);
  assert.equal(added[3].audit, "save");
  assert.deepEqual(added[3].tags, ["n", "s"]);
  assert.equal(addDioptra(cards, { title: "Ada" }).length, 3);
  const lifted = liftAltitude(cards, "a");
  assert.equal(lifted[0].altitude, 15);
  assert.equal(lowerAltitude(lifted, "a")[0].altitude, 60);
  assert.equal(dropDioptraView([{ id: "v", name: "Desk", tray: "bench", query: "", surveyor: "", finish: "all", bearing: "all", altitude: "all", vane: "all" }], "v").length, 0);
  assert.equal(readDioptraViews([{ id: "", name: "x" }]).length, 0);

  assert.equal(emailLane("ab@x.co"), "spark");
  assert.equal(emailLane("ada+desk@firm.com"), "plus");
  assert.equal(emailLane("ada.nine@firm.com"), "alias");
  assert.equal(emailLane("desk1@firm.com"), "digit");
  assert.equal(emailLane("amina@gmail.com"), "house");
  assert.equal(emailLane("amina@mail.firm.com"), "nest");
  assert.equal(emailLane("amina@firm.com"), "work");
  assert.equal(emailLane(""), "");
  assert.equal(emailState(""), "clear");
  assert.equal(emailState({ city: "x" }), "");
  assert.equal(emailState({ email: "ada@firm.com", amount: 3 }), "");
  assert.equal(emailState({ email: "ada@firm.com" }), "set");
  assert.equal(emailHue("ab@x.co"), "champagne");
  assert.equal(emailHue("amina@firm.com"), "ivory");
  assert.equal(emailHue("desk1@firm.com"), "graphite");
  assert.equal(emailHue("ada.nine@firm.com"), "graphite");
  assert.equal(emailHue("amina@gmail.com"), "ivory");
  assert.equal(emailSoon("ab@x.co"), true);
  assert.equal(emailSoon("ada@firm.com"), false);
  assert.equal(emailLength("amina@firm.com"), 5);
  assert.equal(emailLength(""), null);
  assert.equal(emailEven("ab@x.co"), true);
  assert.equal(emailEven("amina@firm.com"), false);
  assert.equal(emailFirst("amina@firm.com"), true);
  assert.equal(emailFirst("1ada@firm.com"), false);
  assert.equal(emailTail("desk1@firm.com"), true);
  assert.equal(emailTail("amina@firm.com"), false);
  assert.equal(emailMark("Amina@firm.com"), true);
  assert.equal(emailMark("amina@firm.com"), false);
  assert.equal(emailSpace("ada bee@firm.com"), true);
  assert.equal(emailVowel("amina@firm.com"), true);
  assert.equal(emailVowel("desk@firm.com"), false);
  assert.equal(emailPlus("ada+desk@firm.com"), true);
  assert.equal(emailAlias("ada.nine@firm.com"), true);
  assert.equal(emailHouse("amina@gmail.com"), true);
  assert.equal(emailNest("amina@mail.firm.com"), true);
  assert.equal(emailDomain("amina@mail.firm.com"), "mail.firm.com");
  const rows: EmailRow[] = [
    { id: "1", label: "Ada", handle: "ab@x.co" },
    { id: "2", label: "Bea", handle: "amina@firm.com" },
  ];
  assert.equal(leadingEmail(rows), "spark");
  assert.match(emailLanesCsv(rows), /spark,1/);
  assert.match(emailLanesCsv(rows), /work,1/);
  assert.match(emailRowsCsv(rows, ["1"]), /Ada,ab@x.co/);

  const locales = ["en", "tr", "de", "ru", "ar"] as const;
  const keys = Object.keys(ROUND297_COPY.en).sort();
  for (const locale of locales) assert.deepEqual(Object.keys(ROUND297_COPY[locale]).sort(), keys);
  assert.equal(crmv4Text("tr", "dptTitle"), ROUND297_COPY.tr.dptTitle);
  assert.equal(crmv4Text("de", "emlTitle"), ROUND297_COPY.de.emlTitle);
  assert.equal(crmv4Text("ru", "dptSub"), ROUND297_COPY.ru.dptSub);
  assert.equal(crmv4Text("ar", "emlSub"), ROUND297_COPY.ar.emlSub);
  assert.equal(crmv4Text("en", "dptLogo"), "7FX");
  assert.equal(crmv4Text("en", "emlLogo"), "7FX");
  assert.equal(crmv4Text("en", "dptTitle"), "Dioptra sights");
  assert.equal(crmv4Text("en", "emlTitle"), "Email plates");
  assert.equal(crmv4Text("en", "sdCloisterKicker"), "Ivory side cloister");
  assert.equal(crmv4Text("en", "lcCourtKicker"), "Graphite license court");
  assert.notEqual(ROUND297_COPY.tr.dptTitle, ROUND297_COPY.en.dptTitle);
  assert.notEqual(ROUND297_COPY.ar.emlTitle, ROUND297_COPY.en.emlTitle);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-dioptra/);
  assert.match(css, /\.c4-email-index/);
  assert.match(css, /\.c4-dioptra-column/);
  assert.match(css, /\.c4-email-column/);
  assert.match(css, /\.c4-side-cloister/);
  assert.match(css, /\.c4-license-court-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round297.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /email:/);
  assert.match(viewFile, /dioptraCsv/);
  assert.match(viewFile, /emailRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0&role=TRADER/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestDioptraFinish/);
  assert.match(viewFile, /c4-email-search/);
  assert.match(viewFile, /dioptraTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "dpt"/);
  assert.match(app, /view === "eml"/);
  const side = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round81.tsx"), "utf8");
  assert.match(side, /c4-side-cloister/);
  assert.match(side, /c4-side-cloister-mast/);
  assert.match(side, /data-logo="mono"/);
  assert.match(side, /sdCloisterKicker/);
  assert.match(side, /sdCloisterLead/);
  assert.match(side, /data-side-glance/);
  assert.equal(side.includes("amount"), false);
  assert.equal(side.includes("profit"), false);
  const court = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round84.tsx"), "utf8");
  assert.match(court, /c4-license-court/);
  assert.match(court, /c4-license-court-mast/);
  assert.match(court, /lcCourtKicker/);
  assert.match(court, /lcCourtLead/);
  assert.match(court, /data-license-glance/);
  assert.equal(court.includes("amount"), false);
  assert.equal(court.includes("profit"), false);
  const named = `${viewFile}\n${side}\n${court}`.match(/"(dpt|eml|sdCloister|lcCourt)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of named) assert.equal(typeof ROUND297_COPY.en[key as keyof typeof ROUND297_COPY.en], "string", key);
  console.log("crmv4 round297 tests passed");
}

main();
