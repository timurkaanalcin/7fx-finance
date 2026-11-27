/**
 * Caryatid courses, telamon language plates, the ivory transaction sedilia, and the graphite book ciborium.
 * Run: TZ=UTC npx tsx tests/crmv4-round413.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND413_COPY } from "../src/lib/crmv4/copy-round413";
import { ROUND412_FEATURES } from "../src/lib/crmv4/round412";
import {
  ROUND413_FEATURES,
  activeBed,
  activeDepth,
  activeHour,
  activeProfile,
  addCaryatid,
  addCaryatidView,
  briskCaryatid,
  depthCount,
  dropCaryatidView,
  fairHand,
  fullDepth,
  idleCaryatid,
  graphiteQuiet,
  lateCaryatid,
  leadingTelamon,
  leadingTelamonHue,
  midDepth,
  moveCaryatidFocus,
  overdueCaryatid,
  telamonBlank,
  telamonCopy,
  telamonDark,
  telamonDigit,
  telamonDim,
  telamonEven,
  telamonFade,
  telamonFar,
  telamonHue,
  telamonLanesCsv,
  telamonLength,
  telamonLetter,
  telamonLit,
  telamonNear,
  telamonOpen,
  telamonRowsCsv,
  telamonSlice,
  telamonUpper,
  profileBand,
  profileCool,
  profileGap,
  profilePoint,
  profileWarm,
  readCaryatidViews,
  reminderCaryatidList,
  restingCaryatid,
  caryatidBed,
  caryatidHour,
  caryatidTimeline,
  suggestProfile,
  suggestCaryatidBed,
  suggestCaryatidHour,
  type Caryatid,
  type TelamonRow,
} from "../src/lib/crmv4/round413";

function course(partial: Partial<Caryatid> & { id: string; title: string }): Caryatid {
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
  assert.equal(ROUND413_FEATURES.length, 25);
  assert.equal(new Set(ROUND413_FEATURES).size, 25);
  for (const feature of ROUND413_FEATURES) assert.equal((ROUND412_FEATURES as readonly string[]).includes(feature), false, feature);
  const libDir = path.join(__dirname, "../src/lib/crmv4");
  for (const feature of ROUND413_FEATURES) {
    const needle = `"${feature}"`;
    for (const file of fs.readdirSync(libDir)) {
      if (!file.endsWith(".ts") || file === "round413.ts") continue;
      const body = fs.readFileSync(path.join(libDir, file), "utf8");
      assert.equal(body.includes(needle), false, `${feature} in ${file}`);
    }
  }

  assert.equal(profilePoint(" caryatid "), "caryatid");
  assert.equal(profilePoint("jasper"), "");
  assert.equal(caryatidHour("2"), 2);
  assert.equal(caryatidHour(7), 7);
  assert.equal(caryatidHour(11), 11);
  assert.equal(caryatidHour(18), 18);
  assert.equal(caryatidHour("1"), null);
  assert.equal(caryatidHour("4"), null);
  assert.equal(depthCount("4"), 4);
  assert.equal(depthCount(7), 7);
  assert.equal(depthCount("11"), 11);
  assert.equal(depthCount("1"), null);
  assert.equal(depthCount("3"), null);
  assert.equal(caryatidBed("ivory"), "IVORY");
  assert.equal(caryatidBed("graphite"), "GRAPHITE");
  assert.equal(caryatidBed("gilt"), "GILT");
  assert.equal(caryatidBed("gold"), "");
  assert.equal(profileWarm("caryatid"), true);
  assert.equal(profileWarm("BALDACHIN"), true);
  assert.equal(profileWarm("cathedra"), false);
  assert.equal(profileCool("cathedra"), true);
  assert.equal(profileCool("templon"), true);
  assert.equal(profileCool("caryatid"), false);
  assert.equal(profileBand("caryatid"), "first");
  assert.equal(profileBand("baldachin"), "second");
  assert.equal(profileBand("cathedra"), "third");
  assert.equal(profileBand("templon"), "fourth");
  assert.equal(profileGap("caryatid", "templon"), 3);
  assert.equal(profileGap("templon", "caryatid"), -3);
  assert.equal(profileGap("jasper", "caryatid"), null);
  assert.equal(graphiteQuiet("graphite"), true);
  assert.equal(graphiteQuiet("IVORY"), false);
  assert.equal(midDepth(7), true);
  assert.equal(midDepth(4), false);
  assert.equal(fullDepth(11), true);
  assert.equal(fullDepth(7), false);
  assert.equal(activeProfile("warm"), "warm");
  assert.equal(activeProfile("cool"), "cool");
  assert.equal(activeProfile("templon"), "templon");
  assert.equal(activeProfile("nope"), "all");
  assert.equal(activeHour("11"), "11");
  assert.equal(activeHour("3"), "all");
  assert.equal(activeDepth("11"), "11");
  assert.equal(activeDepth("1"), "all");
  assert.equal(activeBed("ivory", ["IVORY", "GRAPHITE"]), "IVORY");
  assert.equal(activeBed("gilt", ["IVORY"]), "all");
  assert.equal(moveCaryatidFocus(0, 4, -1), 3);
  assert.equal(suggestProfile(1), "caryatid");
  assert.equal(suggestProfile(2), "baldachin");
  assert.equal(suggestProfile(7), "cathedra");
  assert.equal(suggestProfile(11), "templon");
  assert.equal(suggestCaryatidHour([], 1), 2);
  assert.equal(suggestCaryatidHour([], 2), 7);
  assert.equal(suggestCaryatidHour([], 7), 11);
  assert.equal(suggestCaryatidHour([], 11), 18);
  const saved = [
    course({ id: "a", title: "Ada", hour: 18 }),
    course({ id: "b", title: "Bea", hour: 7 }),
    course({ id: "c", title: "Cid", hour: 11 }),
  ];
  assert.equal(suggestCaryatidHour(saved, 18), 2);
  assert.equal(suggestCaryatidBed([course({ id: "g", title: "Gilt", bed: "GILT" })]), "GRAPHITE");
  assert.equal(fairHand([course({ id: "h", title: "Held", hand: "Nia" })], "Nia, Omar"), "Omar");

  const late = course({ id: "l", title: "Late", profile: "caryatid" });
  const overdue = course({ id: "o", title: "Over", profile: "templon", depth: 4 });
  const idle = course({ id: "i", title: "Idle", hour: 2, depth: 4, bed: "" });
  const brisk = course({ id: "b2", title: "Brisk", bed: "GRAPHITE", hour: 18, depth: 11 });
  const resting = course({ id: "r", title: "Rest", profile: "cathedra", bed: "IVORY", hour: 7 });
  assert.equal(lateCaryatid(late, "templon"), true);
  assert.equal(lateCaryatid(late, "caryatid"), false);
  assert.equal(overdueCaryatid(overdue), true);
  assert.equal(overdueCaryatid({ ...overdue, raised: true }), false);
  assert.equal(idleCaryatid(idle), true);
  assert.equal(briskCaryatid(brisk), true);
  assert.equal(restingCaryatid(resting), true);
  assert.deepEqual(reminderCaryatidList([overdue, late]), ["Over"]);
  const added = addCaryatid([], { title: "New course", profile: "baldachin", hour: 7, depth: 7, bed: "ivory", tags: "m t z" });
  assert.equal(added.length, 1);
  assert.equal(added[0].profile, "baldachin");
  assert.equal(added[0].hour, 7);
  assert.equal(added[0].depth, 7);
  assert.equal(added[0].bed, "IVORY");
  assert.deepEqual(added[0].tags, ["m", "t"]);
  assert.equal(addCaryatid(added, { title: "New course" }).length, 1);
  const view = { id: "v", name: "Warm", rack: "base" as const, query: "", hand: "", bed: "", profile: "warm", hour: "", depth: "" };
  assert.equal(addCaryatidView([], view).length, 1);
  assert.equal(dropCaryatidView(addCaryatidView([], view), "v").length, 0);
  assert.equal(readCaryatidViews([{ ...view, name: "" }]).length, 0);
  const line = caryatidTimeline([course({ id: "t", title: "Tide", hour: 7 })]);
  assert.equal(line[0].hour, 7);
  assert.deepEqual(line[0].titles, ["Tide"]);

  assert.equal(telamonLit("en"), true);
  assert.equal(telamonLit("TR"), true);
  assert.equal(telamonLit("de"), true);
  assert.equal(telamonLit("ru"), true);
  assert.equal(telamonLit("AR"), true);
  assert.equal(telamonHue("en"), "gilt");
  assert.equal(telamonFar("AB"), true);
  assert.equal(telamonLit("VERIFIED"), true);
  assert.equal(telamonLit(true), true);
  assert.equal(telamonLit(false), false);
  assert.equal(telamonLit("LNG-AB"), false);
  assert.equal(telamonLit("LNG-ABCDEFGH"), false);
  assert.equal(telamonNear("HOT"), true);
  assert.equal(telamonNear("LNG-AB"), true);
  assert.equal(telamonNear("AB"), false);
  assert.equal(telamonFar("A"), true);
  assert.equal(telamonFar("AB"), true);
  assert.equal(telamonFar("ABCD"), false);
  assert.equal(telamonFade("A".repeat(18)), true);
  assert.equal(telamonFade("LNG-ABCDEFGH"), true);
  assert.equal(telamonFade("A".repeat(8)), false);
  assert.equal(telamonDim("WAIT"), true);
  assert.equal(telamonDim("PENDING"), true);
  assert.equal(telamonDark("OFF"), true);
  assert.equal(telamonDark(false), true);
  assert.equal(telamonDark("REJECTED"), true);
  assert.equal(telamonBlank("UNVERIFIED"), true);
  assert.equal(telamonBlank("NONE"), true);
  assert.equal(telamonOpen(""), true);
  assert.equal(telamonHue("VERIFIED"), "gilt");
  assert.equal(telamonHue("OFF"), "ash");
  assert.equal(telamonHue("WAIT"), "pearl");
  assert.equal(telamonLength("ABCD"), 4);
  assert.equal(telamonEven("AB"), true);
  assert.equal(telamonDigit("12night"), true);
  assert.equal(telamonLetter("READY"), true);
  assert.equal(telamonUpper("ISTANBUL"), true);
  assert.equal(telamonUpper("VIP"), false);
  assert.equal(telamonLit("ABCDEFGH"), false);
  assert.equal(telamonDim("ABCDEFGH"), true);
  assert.equal(telamonCopy("READY"), "READY");
  assert.equal(telamonLit({ balance: 1 }), false);
  assert.equal(telamonLit({ language: "VERIFIED" }), true);
  assert.equal(telamonLit(telamonSlice({ language: true, balance: 9 })), true);
  const rows: TelamonRow[] = [
    { id: "1", label: "Ada", code: "VERIFIED" },
    { id: "2", label: "Bea", code: "PENDING" },
  ];
  assert.equal(leadingTelamon(rows), "live");
  assert.equal(leadingTelamonHue(rows), "gilt");
  assert.match(telamonLanesCsv(rows), /live,1/);
  assert.match(telamonRowsCsv(rows, ["1"]), /Ada,VERIFIED/);
  assert.match(telamonRowsCsv(rows, ["1"]), /,1$/m);
  assert.match(telamonRowsCsv(rows, ["1"]), /^name,language,lane,hue,reviewed/m);

  assert.equal(crmv4Text("en", "cydTitle"), ROUND413_COPY.en.cydTitle);
  assert.equal(crmv4Text("tr", "tlmTitle"), ROUND413_COPY.tr.tlmTitle);
  assert.equal(crmv4Text("de", "cydHint"), ROUND413_COPY.de.cydHint);
  assert.equal(crmv4Text("ru", "txSediliaKicker"), ROUND413_COPY.ru.txSediliaKicker);
  assert.equal(crmv4Text("ar", "bkCiboriumLead"), ROUND413_COPY.ar.bkCiboriumLead);
  const keys = Object.keys(ROUND413_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND413_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-cyd413/);
  assert.match(css, /\.c4-tlm413/);
  assert.match(css, /\.c4-cyd413-column/);
  assert.match(css, /\.c4-tlm413-column/);
  assert.match(css, /\.c4-tx-sedilia/);
  assert.match(css, /\.c4-book-ciborium/);
  assert.match(css, /\.c4-tx-sedilia-mast/);
  assert.match(css, /\.c4-book-ciborium-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round413.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.equal(viewFile.includes("totpSecret"), false);
  assert.match(viewFile, /telamonSlice/);
  assert.match(viewFile, /caryatidCsv/);
  assert.match(viewFile, /telamonRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-cyd413/);
  assert.match(viewFile, /data-tlm413/);
  assert.match(viewFile, /data-language/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestCaryatidBed/);
  assert.match(viewFile, /c4-tlm413-search/);
  assert.match(viewFile, /caryatidTimeline/);
  assert.match(viewFile, /c4-cyd413-notices/);
  assert.match(viewFile, /from "@\/lib\/crmv4\/round413"/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "cyd"/);
  assert.match(app, /view === "tlm"/);
  const source = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round12.tsx"), "utf8");
  assert.match(source, /c4-tx-sedilia/);
  assert.match(source, /c4-tx-sedilia-mast/);
  assert.match(source, /data-logo="mono"/);
  assert.match(source, /txSediliaKicker/);
  assert.match(source, /txSediliaLead/);
  assert.match(source, /data-tx-sedilia/);
  assert.match(source, /c4-book-ciborium/);
  assert.match(source, /c4-book-ciborium-mast/);
  assert.match(source, /bkCiboriumKicker/);
  assert.match(source, /bkCiboriumLead/);
  assert.match(source, /data-book-ciborium/);
  const namedKeys = `${viewFile}\n${source}`.match(/"(cyd|tlm|txSedilia|bkCiborium)[A-Z][A-Za-z0-9]*"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND413_COPY.en[key as keyof typeof ROUND413_COPY.en], "string", key);
  console.log("crmv4 round413 tests passed");
}

main();
