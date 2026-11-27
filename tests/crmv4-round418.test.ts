/**
 * Carvel courses, becket seen plates, the ivory sponsor thole, and the graphite import cleat.
 * Run: TZ=UTC npx tsx tests/crmv4-round418.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND418_COPY } from "../src/lib/crmv4/copy-round418";
import { ROUND417_FEATURES } from "../src/lib/crmv4/round417";
import {
  ROUND418_FEATURES,
  activeBed,
  activeDepth,
  activeHour,
  activeProfile,
  addCarvel,
  addCarvelView,
  briskCarvel,
  depthCount,
  dropCarvelView,
  fairHand,
  fullDepth,
  idleCarvel,
  ivoryQuiet,
  lateCarvel,
  leadingBecket,
  leadingBecketHue,
  midDepth,
  moveCarvelFocus,
  overdueCarvel,
  becketBlank,
  becketCopy,
  becketDark,
  becketDigit,
  becketDim,
  becketEven,
  becketFade,
  becketFar,
  becketHue,
  becketLanesCsv,
  becketLength,
  becketLetter,
  becketLit,
  becketNear,
  becketOpen,
  becketRowsCsv,
  becketSlice,
  becketUpper,
  profileBand,
  profileCool,
  profileGap,
  profilePoint,
  profileWarm,
  readCarvelViews,
  reminderCarvelList,
  restingCarvel,
  carvelBed,
  carvelHour,
  carvelTimeline,
  suggestProfile,
  suggestCarvelBed,
  suggestCarvelHour,
  type Carvel,
  type BecketRow,
} from "../src/lib/crmv4/round418";

function course(partial: Partial<Carvel> & { id: string; title: string }): Carvel {
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
  assert.equal(ROUND418_FEATURES.length, 25);
  assert.equal(new Set(ROUND418_FEATURES).size, 25);
  for (const feature of ROUND418_FEATURES) assert.equal((ROUND417_FEATURES as readonly string[]).includes(feature), false, feature);
  const libDir = path.join(__dirname, "../src/lib/crmv4");
  for (const feature of ROUND418_FEATURES) {
    const needle = `"${feature}"`;
    for (const file of fs.readdirSync(libDir)) {
      if (!file.endsWith(".ts") || file === "round418.ts") continue;
      const body = fs.readFileSync(path.join(libDir, file), "utf8");
      assert.equal(body.includes(needle), false, `${feature} in ${file}`);
    }
  }

  assert.equal(profilePoint(" carvel "), "carvel");
  assert.equal(profilePoint("jasper"), "");
  assert.equal(carvelHour("3"), 3);
  assert.equal(carvelHour(6), 6);
  assert.equal(carvelHour(12), 12);
  assert.equal(carvelHour(24), 24);
  assert.equal(carvelHour("1"), null);
  assert.equal(carvelHour("4"), null);
  assert.equal(depthCount("1"), 1);
  assert.equal(depthCount(3), 3);
  assert.equal(depthCount("6"), 6);
  assert.equal(depthCount("2"), null);
  assert.equal(depthCount("4"), null);
  assert.equal(carvelBed("ivory"), "IVORY");
  assert.equal(carvelBed("graphite"), "GRAPHITE");
  assert.equal(carvelBed("gilt"), "GILT");
  assert.equal(carvelBed("gold"), "");
  assert.equal(profileWarm("carvel"), true);
  assert.equal(profileWarm("CLINKER"), true);
  assert.equal(profileWarm("tumblehome"), false);
  assert.equal(profileCool("tumblehome"), true);
  assert.equal(profileCool("stemson"), true);
  assert.equal(profileCool("carvel"), false);
  assert.equal(profileBand("carvel"), "first");
  assert.equal(profileBand("clinker"), "second");
  assert.equal(profileBand("tumblehome"), "third");
  assert.equal(profileBand("stemson"), "fourth");
  assert.equal(profileGap("carvel", "stemson"), 3);
  assert.equal(profileGap("stemson", "carvel"), -3);
  assert.equal(profileGap("jasper", "carvel"), null);
  assert.equal(ivoryQuiet("ivory"), true);
  assert.equal(ivoryQuiet("GRAPHITE"), false);
  assert.equal(midDepth(3), true);
  assert.equal(midDepth(1), false);
  assert.equal(fullDepth(6), true);
  assert.equal(fullDepth(3), false);
  assert.equal(activeProfile("warm"), "warm");
  assert.equal(activeProfile("cool"), "cool");
  assert.equal(activeProfile("stemson"), "stemson");
  assert.equal(activeProfile("nope"), "all");
  assert.equal(activeHour("12"), "12");
  assert.equal(activeHour("1"), "all");
  assert.equal(activeDepth("6"), "6");
  assert.equal(activeDepth("2"), "all");
  assert.equal(activeBed("ivory", ["IVORY", "GRAPHITE"]), "IVORY");
  assert.equal(activeBed("gilt", ["IVORY"]), "all");
  assert.equal(moveCarvelFocus(0, 4, -1), 3);
  assert.equal(suggestProfile(1), "carvel");
  assert.equal(suggestProfile(5), "clinker");
  assert.equal(suggestProfile(10), "tumblehome");
  assert.equal(suggestProfile(20), "stemson");
  assert.equal(suggestCarvelHour([], 1), 3);
  assert.equal(suggestCarvelHour([], 5), 6);
  assert.equal(suggestCarvelHour([], 10), 12);
  assert.equal(suggestCarvelHour([], 20), 24);
  const saved = [
    course({ id: "a", title: "Ada", hour: 24 }),
    course({ id: "b", title: "Bea", hour: 6 }),
    course({ id: "c", title: "Cid", hour: 12 }),
  ];
  assert.equal(suggestCarvelHour(saved, 24), 3);
  assert.equal(suggestCarvelBed([course({ id: "g", title: "Gilt", bed: "GILT" })]), "IVORY");
  assert.equal(fairHand([course({ id: "h", title: "Held", hand: "Nia" })], "Nia, Omar"), "Omar");

  const late = course({ id: "l", title: "Late", profile: "carvel" });
  const overdue = course({ id: "o", title: "Over", profile: "stemson", depth: 1 });
  const idle = course({ id: "i", title: "Idle", hour: 3, depth: 1, bed: "" });
  const brisk = course({ id: "b2", title: "Brisk", bed: "IVORY", hour: 24, depth: 6 });
  const resting = course({ id: "r", title: "Rest", profile: "tumblehome", bed: "GILT", hour: 6 });
  assert.equal(lateCarvel(late, "stemson"), true);
  assert.equal(lateCarvel(late, "carvel"), false);
  assert.equal(overdueCarvel(overdue), true);
  assert.equal(overdueCarvel({ ...overdue, raised: true }), false);
  assert.equal(idleCarvel(idle), true);
  assert.equal(briskCarvel(brisk), true);
  assert.equal(restingCarvel(resting), true);
  assert.deepEqual(reminderCarvelList([overdue, late]), ["Over"]);
  const added = addCarvel([], { title: "New course", profile: "clinker", hour: 6, depth: 3, bed: "ivory", tags: "c v z" });
  assert.equal(added.length, 1);
  assert.equal(added[0].profile, "clinker");
  assert.equal(added[0].hour, 6);
  assert.equal(added[0].depth, 3);
  assert.equal(added[0].bed, "IVORY");
  assert.deepEqual(added[0].tags, ["c", "v"]);
  assert.equal(addCarvel(added, { title: "New course" }).length, 1);
  const view = { id: "v", name: "Warm", rack: "base" as const, query: "", hand: "", bed: "", profile: "warm", hour: "", depth: "" };
  assert.equal(addCarvelView([], view).length, 1);
  assert.equal(dropCarvelView(addCarvelView([], view), "v").length, 0);
  assert.equal(readCarvelViews([{ ...view, name: "" }]).length, 0);
  const line = carvelTimeline([course({ id: "t", title: "Tide", hour: 6 })]);
  assert.equal(line[0].hour, 6);
  assert.deepEqual(line[0].titles, ["Tide"]);

  assert.equal(becketLit("NOW"), true);
  assert.equal(becketLit("OPEN"), true);
  assert.equal(becketLit("live"), true);
  assert.equal(becketLit("GOLD"), true);
  assert.equal(becketLit("ON"), true);
  assert.equal(becketHue("NOW"), "gilt");
  assert.equal(becketFar("A"), true);
  assert.equal(becketLit(true), true);
  assert.equal(becketLit(false), false);
  assert.equal(becketLit("AT-A"), true);
  assert.equal(becketNear("AT-ABCD"), true);
  assert.equal(becketNear("ABCD"), true);
  assert.equal(becketNear("AB"), false);
  assert.equal(becketFar("AB"), false);
  assert.equal(becketFade("A".repeat(14)), true);
  assert.equal(becketFade("AT-" + "A".repeat(11)), true);
  assert.equal(becketFade("A".repeat(8)), false);
  assert.equal(becketDim("STAY"), true);
  assert.equal(becketDim("SOFT"), true);
  assert.equal(becketDim("ABC"), true);
  assert.equal(becketDark("BAN"), true);
  assert.equal(becketDark(false), false);
  assert.equal(becketDark("DROP"), true);
  assert.equal(becketBlank("CLEAR"), true);
  assert.equal(becketBlank("NULL"), true);
  assert.equal(becketOpen(""), true);
  assert.equal(becketHue("BAN"), "ash");
  assert.equal(becketHue("STAY"), "pearl");
  assert.equal(becketLength("ABCD"), 4);
  assert.equal(becketEven("AB"), true);
  assert.equal(becketDigit("12night"), true);
  assert.equal(becketLetter("NOW"), true);
  assert.equal(becketUpper("ISTANBUL"), true);
  assert.equal(becketUpper("VIP"), false);
  assert.equal(becketLit("ABCDEFGH"), false);
  assert.equal(becketDim("ABCDEFGH"), true);
  assert.equal(becketCopy("NOW"), "NOW");
  assert.equal(becketLit({ balance: 1 }), false);
  assert.equal(becketLit({ lastSeenAt: "NOW" }), true);
  assert.equal(becketLit(becketSlice({ lastSeenAt: true, balance: 9 })), true);
  const rows: BecketRow[] = [
    { id: "1", label: "Ada", code: "NOW" },
    { id: "2", label: "Bea", code: "QUEUE" },
  ];
  assert.equal(leadingBecket(rows), "live");
  assert.equal(leadingBecketHue(rows), "gilt");
  assert.match(becketLanesCsv(rows), /live,1/);
  assert.match(becketRowsCsv(rows, ["1"]), /Ada,NOW/);
  assert.match(becketRowsCsv(rows, ["1"]), /,1$/m);
  assert.match(becketRowsCsv(rows, ["1"]), /^name,seen,lane,hue,reviewed/m);

  assert.equal(crmv4Text("en", "crvTitle"), ROUND418_COPY.en.crvTitle);
  assert.equal(crmv4Text("tr", "bktTitle"), ROUND418_COPY.tr.bktTitle);
  assert.equal(crmv4Text("de", "crvHint"), ROUND418_COPY.de.crvHint);
  assert.equal(crmv4Text("ru", "thlTholeKicker"), ROUND418_COPY.ru.thlTholeKicker);
  assert.equal(crmv4Text("ar", "cltCleatLead"), ROUND418_COPY.ar.cltCleatLead);
  const keys = Object.keys(ROUND418_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND418_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-crv418/);
  assert.match(css, /\.c4-bkt418/);
  assert.match(css, /\.c4-crv418-column/);
  assert.match(css, /\.c4-bkt418-column/);
  assert.match(css, /\.c4-sponsor-thole/);
  assert.match(css, /\.c4-import-cleat/);
  assert.match(css, /\.c4-sponsor-thole-mast/);
  assert.match(css, /\.c4-import-cleat-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round418.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.equal(viewFile.includes("totpSecret"), false);
  assert.match(viewFile, /becketSlice/);
  assert.match(viewFile, /carvelCsv/);
  assert.match(viewFile, /becketRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-crv418/);
  assert.match(viewFile, /data-bkt418/);
  assert.match(viewFile, /data-seen/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestCarvelBed/);
  assert.match(viewFile, /c4-bkt418-search/);
  assert.match(viewFile, /carvelTimeline/);
  assert.match(viewFile, /c4-crv418-notices/);
  assert.match(viewFile, /from "@\/lib\/crmv4\/round418"/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "crv"/);
  assert.match(app, /view === "bkt"/);
  const ops = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Ops.tsx"), "utf8");
  assert.match(ops, /c4-sponsor-thole/);
  assert.match(ops, /SponsorTholeHead/);
  assert.match(ops, /data-sponsor-thole/);
  assert.match(ops, /c4-import-cleat/);
  assert.match(ops, /ImportCleatHead/);
  assert.match(ops, /data-import-cleat/);
  assert.match(viewFile, /c4-sponsor-thole-mast/);
  assert.match(viewFile, /c4-import-cleat-mast/);
  assert.match(viewFile, /thlTholeKicker/);
  assert.match(viewFile, /thlTholeLead/);
  assert.match(viewFile, /cltCleatKicker/);
  assert.match(viewFile, /cltCleatLead/);
  assert.match(viewFile, /data-logo="mono"/);
  const namedKeys = `${viewFile}\n${ops}`.match(/"(crv|bkt|thl|clt)[A-Z][A-Za-z0-9]*"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND418_COPY.en[key as keyof typeof ROUND418_COPY.en], "string", key);
  console.log("crmv4 round418 tests passed");
}

main();
