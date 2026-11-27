/**
 * Spirketing courses, limber affiliate plates, the ivory call scupper, and the graphite quick deadeye.
 * Run: TZ=UTC npx tsx tests/crmv4-round417.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND417_COPY } from "../src/lib/crmv4/copy-round417";
import { ROUND416_FEATURES } from "../src/lib/crmv4/round416";
import {
  ROUND417_FEATURES,
  activeBed,
  activeDepth,
  activeHour,
  activeProfile,
  addSpirketing,
  addSpirketingView,
  briskSpirketing,
  depthCount,
  dropSpirketingView,
  fairHand,
  fullDepth,
  idleSpirketing,
  graphiteQuiet,
  lateSpirketing,
  leadingLimber,
  leadingLimberHue,
  midDepth,
  moveSpirketingFocus,
  overdueSpirketing,
  limberBlank,
  limberCopy,
  limberDark,
  limberDigit,
  limberDim,
  limberEven,
  limberFade,
  limberFar,
  limberHue,
  limberLanesCsv,
  limberLength,
  limberLetter,
  limberLit,
  limberNear,
  limberOpen,
  limberRowsCsv,
  limberSlice,
  limberUpper,
  profileBand,
  profileCool,
  profileGap,
  profilePoint,
  profileWarm,
  readSpirketingViews,
  reminderSpirketingList,
  restingSpirketing,
  spirketingBed,
  spirketingHour,
  spirketingTimeline,
  suggestProfile,
  suggestSpirketingBed,
  suggestSpirketingHour,
  type Spirketing,
  type LimberRow,
} from "../src/lib/crmv4/round417";

function course(partial: Partial<Spirketing> & { id: string; title: string }): Spirketing {
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
  assert.equal(ROUND417_FEATURES.length, 25);
  assert.equal(new Set(ROUND417_FEATURES).size, 25);
  for (const feature of ROUND417_FEATURES) assert.equal((ROUND416_FEATURES as readonly string[]).includes(feature), false, feature);
  const libDir = path.join(__dirname, "../src/lib/crmv4");
  for (const feature of ROUND417_FEATURES) {
    const needle = `"${feature}"`;
    for (const file of fs.readdirSync(libDir)) {
      if (!file.endsWith(".ts") || file === "round417.ts") continue;
      const body = fs.readFileSync(path.join(libDir, file), "utf8");
      assert.equal(body.includes(needle), false, `${feature} in ${file}`);
    }
  }

  assert.equal(profilePoint(" spirketing "), "spirketing");
  assert.equal(profilePoint("jasper"), "");
  assert.equal(spirketingHour("4"), 4);
  assert.equal(spirketingHour(8), 8);
  assert.equal(spirketingHour(16), 16);
  assert.equal(spirketingHour(32), 32);
  assert.equal(spirketingHour("1"), null);
  assert.equal(spirketingHour("3"), null);
  assert.equal(depthCount("2"), 2);
  assert.equal(depthCount(4), 4);
  assert.equal(depthCount("8"), 8);
  assert.equal(depthCount("1"), null);
  assert.equal(depthCount("3"), null);
  assert.equal(spirketingBed("ivory"), "IVORY");
  assert.equal(spirketingBed("graphite"), "GRAPHITE");
  assert.equal(spirketingBed("gilt"), "GILT");
  assert.equal(spirketingBed("gold"), "");
  assert.equal(profileWarm("spirketing"), true);
  assert.equal(profileWarm("DEADWOOD"), true);
  assert.equal(profileWarm("breastwork"), false);
  assert.equal(profileCool("breastwork"), true);
  assert.equal(profileCool("taffrail"), true);
  assert.equal(profileCool("spirketing"), false);
  assert.equal(profileBand("spirketing"), "first");
  assert.equal(profileBand("deadwood"), "second");
  assert.equal(profileBand("breastwork"), "third");
  assert.equal(profileBand("taffrail"), "fourth");
  assert.equal(profileGap("spirketing", "taffrail"), 3);
  assert.equal(profileGap("taffrail", "spirketing"), -3);
  assert.equal(profileGap("jasper", "spirketing"), null);
  assert.equal(graphiteQuiet("graphite"), true);
  assert.equal(graphiteQuiet("IVORY"), false);
  assert.equal(midDepth(4), true);
  assert.equal(midDepth(2), false);
  assert.equal(fullDepth(8), true);
  assert.equal(fullDepth(4), false);
  assert.equal(activeProfile("warm"), "warm");
  assert.equal(activeProfile("cool"), "cool");
  assert.equal(activeProfile("taffrail"), "taffrail");
  assert.equal(activeProfile("nope"), "all");
  assert.equal(activeHour("16"), "16");
  assert.equal(activeHour("1"), "all");
  assert.equal(activeDepth("8"), "8");
  assert.equal(activeDepth("1"), "all");
  assert.equal(activeBed("ivory", ["IVORY", "GRAPHITE"]), "IVORY");
  assert.equal(activeBed("gilt", ["IVORY"]), "all");
  assert.equal(moveSpirketingFocus(0, 4, -1), 3);
  assert.equal(suggestProfile(1), "spirketing");
  assert.equal(suggestProfile(5), "deadwood");
  assert.equal(suggestProfile(10), "breastwork");
  assert.equal(suggestProfile(20), "taffrail");
  assert.equal(suggestSpirketingHour([], 1), 4);
  assert.equal(suggestSpirketingHour([], 5), 8);
  assert.equal(suggestSpirketingHour([], 10), 16);
  assert.equal(suggestSpirketingHour([], 20), 32);
  const saved = [
    course({ id: "a", title: "Ada", hour: 32 }),
    course({ id: "b", title: "Bea", hour: 8 }),
    course({ id: "c", title: "Cid", hour: 16 }),
  ];
  assert.equal(suggestSpirketingHour(saved, 32), 4);
  assert.equal(suggestSpirketingBed([course({ id: "g", title: "Gilt", bed: "GILT" })]), "GRAPHITE");
  assert.equal(fairHand([course({ id: "h", title: "Held", hand: "Nia" })], "Nia, Omar"), "Omar");

  const late = course({ id: "l", title: "Late", profile: "spirketing" });
  const overdue = course({ id: "o", title: "Over", profile: "taffrail", depth: 2 });
  const idle = course({ id: "i", title: "Idle", hour: 4, depth: 2, bed: "" });
  const brisk = course({ id: "b2", title: "Brisk", bed: "GRAPHITE", hour: 32, depth: 8 });
  const resting = course({ id: "r", title: "Rest", profile: "breastwork", bed: "IVORY", hour: 8 });
  assert.equal(lateSpirketing(late, "taffrail"), true);
  assert.equal(lateSpirketing(late, "spirketing"), false);
  assert.equal(overdueSpirketing(overdue), true);
  assert.equal(overdueSpirketing({ ...overdue, raised: true }), false);
  assert.equal(idleSpirketing(idle), true);
  assert.equal(briskSpirketing(brisk), true);
  assert.equal(restingSpirketing(resting), true);
  assert.deepEqual(reminderSpirketingList([overdue, late]), ["Over"]);
  const added = addSpirketing([], { title: "New course", profile: "deadwood", hour: 8, depth: 4, bed: "ivory", tags: "s l z" });
  assert.equal(added.length, 1);
  assert.equal(added[0].profile, "deadwood");
  assert.equal(added[0].hour, 8);
  assert.equal(added[0].depth, 4);
  assert.equal(added[0].bed, "IVORY");
  assert.deepEqual(added[0].tags, ["s", "l"]);
  assert.equal(addSpirketing(added, { title: "New course" }).length, 1);
  const view = { id: "v", name: "Warm", rack: "base" as const, query: "", hand: "", bed: "", profile: "warm", hour: "", depth: "" };
  assert.equal(addSpirketingView([], view).length, 1);
  assert.equal(dropSpirketingView(addSpirketingView([], view), "v").length, 0);
  assert.equal(readSpirketingViews([{ ...view, name: "" }]).length, 0);
  const line = spirketingTimeline([course({ id: "t", title: "Tide", hour: 8 })]);
  assert.equal(line[0].hour, 8);
  assert.deepEqual(line[0].titles, ["Tide"]);

  assert.equal(limberLit("PAID"), true);
  assert.equal(limberLit("OPEN"), true);
  assert.equal(limberLit("live"), true);
  assert.equal(limberLit("GOLD"), true);
  assert.equal(limberLit("ON"), true);
  assert.equal(limberHue("PAID"), "gilt");
  assert.equal(limberFar("A"), true);
  assert.equal(limberLit(true), true);
  assert.equal(limberLit(false), false);
  assert.equal(limberLit("AFF-A"), true);
  assert.equal(limberNear("AFF-ABC"), true);
  assert.equal(limberNear("ABCD"), true);
  assert.equal(limberNear("AB"), false);
  assert.equal(limberFar("AB"), false);
  assert.equal(limberFade("A".repeat(14)), true);
  assert.equal(limberFade("AFF-" + "A".repeat(10)), true);
  assert.equal(limberFade("A".repeat(8)), false);
  assert.equal(limberDim("STAY"), true);
  assert.equal(limberDim("SOFT"), true);
  assert.equal(limberDim("ABC"), true);
  assert.equal(limberDark("BAN"), true);
  assert.equal(limberDark(false), false);
  assert.equal(limberDark("DROP"), true);
  assert.equal(limberBlank("CLEAR"), true);
  assert.equal(limberBlank("NULL"), true);
  assert.equal(limberOpen(""), true);
  assert.equal(limberHue("BAN"), "ash");
  assert.equal(limberHue("STAY"), "pearl");
  assert.equal(limberLength("ABCD"), 4);
  assert.equal(limberEven("AB"), true);
  assert.equal(limberDigit("12night"), true);
  assert.equal(limberLetter("PAID"), true);
  assert.equal(limberUpper("ISTANBUL"), true);
  assert.equal(limberUpper("VIP"), false);
  assert.equal(limberLit("ABCDEFGH"), false);
  assert.equal(limberDim("ABCDEFGH"), true);
  assert.equal(limberCopy("PAID"), "PAID");
  assert.equal(limberLit({ balance: 1 }), false);
  assert.equal(limberLit({ affiliateC: "PAID" }), true);
  assert.equal(limberLit(limberSlice({ affiliateC: true, balance: 9 })), true);
  const rows: LimberRow[] = [
    { id: "1", label: "Ada", code: "PAID" },
    { id: "2", label: "Bea", code: "QUEUE" },
  ];
  assert.equal(leadingLimber(rows), "live");
  assert.equal(leadingLimberHue(rows), "gilt");
  assert.match(limberLanesCsv(rows), /live,1/);
  assert.match(limberRowsCsv(rows, ["1"]), /Ada,PAID/);
  assert.match(limberRowsCsv(rows, ["1"]), /,1$/m);
  assert.match(limberRowsCsv(rows, ["1"]), /^name,affiliate,lane,hue,reviewed/m);

  assert.equal(crmv4Text("en", "spkTitle"), ROUND417_COPY.en.spkTitle);
  assert.equal(crmv4Text("tr", "lmbTitle"), ROUND417_COPY.tr.lmbTitle);
  assert.equal(crmv4Text("de", "spkHint"), ROUND417_COPY.de.spkHint);
  assert.equal(crmv4Text("ru", "scpScupperKicker"), ROUND417_COPY.ru.scpScupperKicker);
  assert.equal(crmv4Text("ar", "qdeDeadeyeLead"), ROUND417_COPY.ar.qdeDeadeyeLead);
  const keys = Object.keys(ROUND417_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND417_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-spk417/);
  assert.match(css, /\.c4-lmb417/);
  assert.match(css, /\.c4-spk417-column/);
  assert.match(css, /\.c4-lmb417-column/);
  assert.match(css, /\.c4-call-scupper/);
  assert.match(css, /\.c4-quick-deadeye/);
  assert.match(css, /\.c4-call-scupper-mast/);
  assert.match(css, /\.c4-quick-deadeye-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round417.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.equal(viewFile.includes("totpSecret"), false);
  assert.match(viewFile, /limberSlice/);
  assert.match(viewFile, /spirketingCsv/);
  assert.match(viewFile, /limberRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-spk417/);
  assert.match(viewFile, /data-lmb417/);
  assert.match(viewFile, /data-affiliate/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestSpirketingBed/);
  assert.match(viewFile, /c4-lmb417-search/);
  assert.match(viewFile, /spirketingTimeline/);
  assert.match(viewFile, /c4-spk417-notices/);
  assert.match(viewFile, /from "@\/lib\/crmv4\/round417"/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "spk"/);
  assert.match(app, /view === "lmb"/);
  const call = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round9.tsx"), "utf8");
  const quick = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round8.tsx"), "utf8");
  assert.match(call, /c4-call-scupper/);
  assert.match(call, /c4-call-scupper-mast/);
  assert.match(call, /data-logo="mono"/);
  assert.match(call, /scpScupperKicker/);
  assert.match(call, /scpScupperLead/);
  assert.match(call, /data-call-scupper/);
  assert.match(quick, /c4-quick-deadeye/);
  assert.match(quick, /c4-quick-deadeye-mast/);
  assert.match(quick, /qdeDeadeyeKicker/);
  assert.match(quick, /qdeDeadeyeLead/);
  assert.match(quick, /data-quick-deadeye/);
  const namedKeys = `${viewFile}\n${call}\n${quick}`.match(/"(spk|lmb|scp|qde)[A-Z][A-Za-z0-9]*"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND417_COPY.en[key as keyof typeof ROUND417_COPY.en], "string", key);
  console.log("crmv4 round417 tests passed");
}

main();
