/**
 * Orillon courses, crossette language plates, the ivory transaction sedilia, and the graphite book ciborium.
 * Run: TZ=UTC npx tsx tests/crmv4-round414.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND414_COPY } from "../src/lib/crmv4/copy-round414";
import { ROUND413_FEATURES } from "../src/lib/crmv4/round413";
import {
  ROUND414_FEATURES,
  activeBed,
  activeDepth,
  activeHour,
  activeProfile,
  addOrillon,
  addOrillonView,
  briskOrillon,
  depthCount,
  dropOrillonView,
  fairHand,
  fullDepth,
  idleOrillon,
  ivoryQuiet,
  lateOrillon,
  leadingCrossette,
  leadingCrossetteHue,
  midDepth,
  moveOrillonFocus,
  overdueOrillon,
  crossetteBlank,
  crossetteCopy,
  crossetteDark,
  crossetteDigit,
  crossetteDim,
  crossetteEven,
  crossetteFade,
  crossetteFar,
  crossetteHue,
  crossetteLanesCsv,
  crossetteLength,
  crossetteLetter,
  crossetteLit,
  crossetteNear,
  crossetteOpen,
  crossetteRowsCsv,
  crossetteSlice,
  crossetteUpper,
  profileBand,
  profileCool,
  profileGap,
  profilePoint,
  profileWarm,
  readOrillonViews,
  reminderOrillonList,
  restingOrillon,
  orillonBed,
  orillonHour,
  orillonTimeline,
  suggestProfile,
  suggestOrillonBed,
  suggestOrillonHour,
  type Orillon,
  type CrossetteRow,
} from "../src/lib/crmv4/round414";

function course(partial: Partial<Orillon> & { id: string; title: string }): Orillon {
  return {
    note: "",
    hand: "",
    profile: "",
    hour: null,
    bed: "",
    depth: 4,
    tags: [],
    raised: false,
    pressed: false,
    shelved: false,
    pinned: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND414_FEATURES.length, 25);
  assert.equal(new Set(ROUND414_FEATURES).size, 25);
  for (const feature of ROUND414_FEATURES) assert.equal((ROUND413_FEATURES as readonly string[]).includes(feature), false, feature);
  const libDir = path.join(__dirname, "../src/lib/crmv4");
  for (const feature of ROUND414_FEATURES) {
    const needle = `"${feature}"`;
    for (const file of fs.readdirSync(libDir)) {
      if (!file.endsWith(".ts") || file === "round414.ts") continue;
      const body = fs.readFileSync(path.join(libDir, file), "utf8");
      assert.equal(body.includes(needle), false, `${feature} in ${file}`);
    }
  }

  assert.equal(profilePoint(" orillon "), "orillon");
  assert.equal(profilePoint("jasper"), "");
  assert.equal(orillonHour("3"), 3);
  assert.equal(orillonHour(6), 6);
  assert.equal(orillonHour(12), 12);
  assert.equal(orillonHour(15), 15);
  assert.equal(orillonHour("2"), null);
  assert.equal(orillonHour("4"), null);
  assert.equal(depthCount("3"), 3);
  assert.equal(depthCount(6), 6);
  assert.equal(depthCount("9"), 9);
  assert.equal(depthCount("1"), null);
  assert.equal(depthCount("4"), null);
  assert.equal(orillonBed("ivory"), "IVORY");
  assert.equal(orillonBed("graphite"), "GRAPHITE");
  assert.equal(orillonBed("gilt"), "GILT");
  assert.equal(orillonBed("gold"), "");
  assert.equal(profileWarm("orillon"), true);
  assert.equal(profileWarm("CAPONIER"), true);
  assert.equal(profileWarm("tenaille"), false);
  assert.equal(profileCool("tenaille"), true);
  assert.equal(profileCool("bartizan"), true);
  assert.equal(profileCool("orillon"), false);
  assert.equal(profileBand("orillon"), "first");
  assert.equal(profileBand("caponier"), "second");
  assert.equal(profileBand("tenaille"), "third");
  assert.equal(profileBand("bartizan"), "fourth");
  assert.equal(profileGap("orillon", "bartizan"), 3);
  assert.equal(profileGap("bartizan", "orillon"), -3);
  assert.equal(profileGap("jasper", "orillon"), null);
  assert.equal(ivoryQuiet("ivory"), true);
  assert.equal(ivoryQuiet("GRAPHITE"), false);
  assert.equal(midDepth(6), true);
  assert.equal(midDepth(3), false);
  assert.equal(fullDepth(9), true);
  assert.equal(fullDepth(6), false);
  assert.equal(activeProfile("warm"), "warm");
  assert.equal(activeProfile("cool"), "cool");
  assert.equal(activeProfile("bartizan"), "bartizan");
  assert.equal(activeProfile("nope"), "all");
  assert.equal(activeHour("12"), "12");
  assert.equal(activeHour("2"), "all");
  assert.equal(activeDepth("9"), "9");
  assert.equal(activeDepth("1"), "all");
  assert.equal(activeBed("ivory", ["IVORY", "GRAPHITE"]), "IVORY");
  assert.equal(activeBed("gilt", ["IVORY"]), "all");
  assert.equal(moveOrillonFocus(0, 4, -1), 3);
  assert.equal(suggestProfile(1), "orillon");
  assert.equal(suggestProfile(3), "caponier");
  assert.equal(suggestProfile(6), "tenaille");
  assert.equal(suggestProfile(12), "bartizan");
  assert.equal(suggestOrillonHour([], 1), 3);
  assert.equal(suggestOrillonHour([], 3), 6);
  assert.equal(suggestOrillonHour([], 6), 12);
  assert.equal(suggestOrillonHour([], 12), 15);
  const saved = [
    course({ id: "a", title: "Ada", hour: 15 }),
    course({ id: "b", title: "Bea", hour: 6 }),
    course({ id: "c", title: "Cid", hour: 12 }),
  ];
  assert.equal(suggestOrillonHour(saved, 15), 3);
  assert.equal(suggestOrillonBed([course({ id: "g", title: "Gilt", bed: "GILT" })]), "IVORY");
  assert.equal(fairHand([course({ id: "h", title: "Held", hand: "Nia" })], "Nia, Omar"), "Omar");

  const late = course({ id: "l", title: "Late", profile: "orillon" });
  const overdue = course({ id: "o", title: "Over", profile: "bartizan", depth: 3 });
  const idle = course({ id: "i", title: "Idle", hour: 3, depth: 3, bed: "" });
  const brisk = course({ id: "b2", title: "Brisk", bed: "IVORY", hour: 15, depth: 9 });
  const resting = course({ id: "r", title: "Rest", profile: "tenaille", bed: "GRAPHITE", hour: 6 });
  assert.equal(lateOrillon(late, "bartizan"), true);
  assert.equal(lateOrillon(late, "orillon"), false);
  assert.equal(overdueOrillon(overdue), true);
  assert.equal(overdueOrillon({ ...overdue, raised: true }), false);
  assert.equal(idleOrillon(idle), true);
  assert.equal(briskOrillon(brisk), true);
  assert.equal(restingOrillon(resting), true);
  assert.deepEqual(reminderOrillonList([overdue, late]), ["Over"]);
  const added = addOrillon([], { title: "New course", profile: "caponier", hour: 6, depth: 6, bed: "ivory", tags: "o r z" });
  assert.equal(added.length, 1);
  assert.equal(added[0].profile, "caponier");
  assert.equal(added[0].hour, 6);
  assert.equal(added[0].depth, 6);
  assert.equal(added[0].bed, "IVORY");
  assert.deepEqual(added[0].tags, ["o", "r"]);
  assert.equal(addOrillon(added, { title: "New course" }).length, 1);
  const view = { id: "v", name: "Warm", rack: "base" as const, query: "", hand: "", bed: "", profile: "warm", hour: "", depth: "" };
  assert.equal(addOrillonView([], view).length, 1);
  assert.equal(dropOrillonView(addOrillonView([], view), "v").length, 0);
  assert.equal(readOrillonViews([{ ...view, name: "" }]).length, 0);
  const line = orillonTimeline([course({ id: "t", title: "Tide", hour: 6 })]);
  assert.equal(line[0].hour, 6);
  assert.deepEqual(line[0].titles, ["Tide"]);

  assert.equal(crossetteLit("APPROVED"), true);
  assert.equal(crossetteLit("COMPLETE"), true);
  assert.equal(crossetteLit("ready"), true);
  assert.equal(crossetteLit("FILED"), true);
  assert.equal(crossetteLit("YES"), true);
  assert.equal(crossetteHue("APPROVED"), "gilt");
  assert.equal(crossetteFar("A"), true);
  assert.equal(crossetteLit(true), true);
  assert.equal(crossetteLit(false), false);
  assert.equal(crossetteLit("DOC-AB"), true);
  assert.equal(crossetteNear("DOC-ABC"), true);
  assert.equal(crossetteNear("ABCD"), true);
  assert.equal(crossetteNear("AB"), false);
  assert.equal(crossetteFar("A"), true);
  assert.equal(crossetteFar("AB"), false);
  assert.equal(crossetteFade("A".repeat(16)), true);
  assert.equal(crossetteFade("DOC-" + "A".repeat(10)), true);
  assert.equal(crossetteFade("A".repeat(8)), false);
  assert.equal(crossetteDim("WAIT"), true);
  assert.equal(crossetteDim("MISSING"), true);
  assert.equal(crossetteDim("AB"), true);
  assert.equal(crossetteDark("OFF"), true);
  assert.equal(crossetteDark(false), false);
  assert.equal(crossetteDark("REJECTED"), true);
  assert.equal(crossetteBlank("UNFILED"), true);
  assert.equal(crossetteBlank("NONE"), true);
  assert.equal(crossetteOpen(""), true);
  assert.equal(crossetteHue("OFF"), "ash");
  assert.equal(crossetteHue("WAIT"), "pearl");
  assert.equal(crossetteLength("ABCD"), 4);
  assert.equal(crossetteEven("AB"), true);
  assert.equal(crossetteDigit("12night"), true);
  assert.equal(crossetteLetter("READY"), true);
  assert.equal(crossetteUpper("ISTANBUL"), true);
  assert.equal(crossetteUpper("VIP"), false);
  assert.equal(crossetteLit("ABCDEFGH"), false);
  assert.equal(crossetteDim("ABCDEFGH"), true);
  assert.equal(crossetteCopy("READY"), "READY");
  assert.equal(crossetteLit({ balance: 1 }), false);
  assert.equal(crossetteLit({ documentsStatus: "APPROVED" }), true);
  assert.equal(crossetteLit(crossetteSlice({ documentsStatus: true, balance: 9 })), true);
  const rows: CrossetteRow[] = [
    { id: "1", label: "Ada", code: "APPROVED" },
    { id: "2", label: "Bea", code: "PENDING" },
  ];
  assert.equal(leadingCrossette(rows), "live");
  assert.equal(leadingCrossetteHue(rows), "gilt");
  assert.match(crossetteLanesCsv(rows), /live,1/);
  assert.match(crossetteRowsCsv(rows, ["1"]), /Ada,APPROVED/);
  assert.match(crossetteRowsCsv(rows, ["1"]), /,1$/m);
  assert.match(crossetteRowsCsv(rows, ["1"]), /^name,documents,lane,hue,reviewed/m);

  assert.equal(crmv4Text("en", "ornTitle"), ROUND414_COPY.en.ornTitle);
  assert.equal(crmv4Text("tr", "xstTitle"), ROUND414_COPY.tr.xstTitle);
  assert.equal(crmv4Text("de", "ornHint"), ROUND414_COPY.de.ornHint);
  assert.equal(crmv4Text("ru", "tgGargoyleKicker"), ROUND414_COPY.ru.tgGargoyleKicker);
  assert.equal(crmv4Text("ar", "nwNewelLead"), ROUND414_COPY.ar.nwNewelLead);
  const keys = Object.keys(ROUND414_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND414_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-orl414/);
  assert.match(css, /\.c4-xst414/);
  assert.match(css, /\.c4-orl414-column/);
  assert.match(css, /\.c4-xst414-column/);
  assert.match(css, /\.c4-tag-gargoyle/);
  assert.match(css, /\.c4-call-newel/);
  assert.match(css, /\.c4-tag-gargoyle-mast/);
  assert.match(css, /\.c4-call-newel-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round414.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.equal(viewFile.includes("totpSecret"), false);
  assert.match(viewFile, /crossetteSlice/);
  assert.match(viewFile, /orillonCsv/);
  assert.match(viewFile, /crossetteRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-orl414/);
  assert.match(viewFile, /data-xst414/);
  assert.match(viewFile, /data-documents/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestOrillonBed/);
  assert.match(viewFile, /c4-xst414-search/);
  assert.match(viewFile, /orillonTimeline/);
  assert.match(viewFile, /c4-orl414-notices/);
  assert.match(viewFile, /from "@\/lib\/crmv4\/round414"/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "orl"/);
  assert.match(app, /view === "xst"/);
  const source = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round12.tsx"), "utf8");
  assert.match(source, /c4-tag-gargoyle/);
  assert.match(source, /c4-tag-gargoyle-mast/);
  assert.match(source, /data-logo="mono"/);
  assert.match(source, /tgGargoyleKicker/);
  assert.match(source, /tgGargoyleLead/);
  assert.match(source, /data-tag-gargoyle/);
  assert.match(source, /c4-call-newel/);
  assert.match(source, /c4-call-newel-mast/);
  assert.match(source, /nwNewelKicker/);
  assert.match(source, /nwNewelLead/);
  assert.match(source, /data-call-newel/);
  const namedKeys = `${viewFile}\n${source}`.match(/"(orn|xst|tgGargoyle|nwNewel)[A-Z][A-Za-z0-9]*"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND414_COPY.en[key as keyof typeof ROUND414_COPY.en], "string", key);
  console.log("crmv4 round414 tests passed");
}

main();
