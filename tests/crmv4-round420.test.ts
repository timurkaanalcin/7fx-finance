/**
 * Gunwale courses, fairlead seen plates, the ivory method marlinspike, and the graphite asset turnbuckle.
 * Run: TZ=UTC npx tsx tests/crmv4-round420.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND420_COPY } from "../src/lib/crmv4/copy-round420";
import { ROUND418_FEATURES } from "../src/lib/crmv4/round418";
import {
  ROUND420_FEATURES,
  activeBed,
  activeDepth,
  activeHour,
  activeProfile,
  addGunwale,
  addGunwaleView,
  briskGunwale,
  depthCount,
  dropGunwaleView,
  fairHand,
  fullDepth,
  idleGunwale,
  ivoryQuiet,
  lateGunwale,
  leadingFairlead,
  leadingFairleadHue,
  midDepth,
  moveGunwaleFocus,
  overdueGunwale,
  fairleadBlank,
  fairleadCopy,
  fairleadDark,
  fairleadDigit,
  fairleadDim,
  fairleadEven,
  fairleadFade,
  fairleadFar,
  fairleadHue,
  fairleadLanesCsv,
  fairleadLength,
  fairleadLetter,
  fairleadLit,
  fairleadNear,
  fairleadOpen,
  fairleadRowsCsv,
  fairleadSlice,
  fairleadUpper,
  profileBand,
  profileCool,
  profileGap,
  profilePoint,
  profileWarm,
  readGunwaleViews,
  reminderGunwaleList,
  restingGunwale,
  gunwaleBed,
  gunwaleHour,
  gunwaleTimeline,
  suggestProfile,
  suggestGunwaleBed,
  suggestGunwaleHour,
  type Gunwale,
  type FairleadRow,
} from "../src/lib/crmv4/round420";

function course(partial: Partial<Gunwale> & { id: string; title: string }): Gunwale {
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
  assert.equal(ROUND420_FEATURES.length, 25);
  assert.equal(new Set(ROUND420_FEATURES).size, 25);
  for (const feature of ROUND420_FEATURES) assert.equal((ROUND418_FEATURES as readonly string[]).includes(feature), false, feature);
  const libDir = path.join(__dirname, "../src/lib/crmv4");
  for (const feature of ROUND420_FEATURES) {
    const needle = `"${feature}"`;
    for (const file of fs.readdirSync(libDir)) {
      if (!file.endsWith(".ts") || file === "round420.ts") continue;
      const body = fs.readFileSync(path.join(libDir, file), "utf8");
      assert.equal(body.includes(needle), false, `${feature} in ${file}`);
    }
  }

  assert.equal(profilePoint(" gunwale "), "gunwale");
  assert.equal(profilePoint("jasper"), "");
  assert.equal(gunwaleHour("3"), 3);
  assert.equal(gunwaleHour(6), 6);
  assert.equal(gunwaleHour(12), 12);
  assert.equal(gunwaleHour(24), 24);
  assert.equal(gunwaleHour("1"), null);
  assert.equal(gunwaleHour("4"), null);
  assert.equal(depthCount("1"), 1);
  assert.equal(depthCount(3), 3);
  assert.equal(depthCount("6"), 6);
  assert.equal(depthCount("2"), null);
  assert.equal(depthCount("4"), null);
  assert.equal(gunwaleBed("ivory"), "IVORY");
  assert.equal(gunwaleBed("graphite"), "GRAPHITE");
  assert.equal(gunwaleBed("gilt"), "GILT");
  assert.equal(gunwaleBed("gold"), "");
  assert.equal(profileWarm("gunwale"), true);
  assert.equal(profileWarm("BULWARK"), true);
  assert.equal(profileWarm("stanchion"), false);
  assert.equal(profileCool("stanchion"), true);
  assert.equal(profileCool("capstan"), true);
  assert.equal(profileCool("gunwale"), false);
  assert.equal(profileBand("gunwale"), "first");
  assert.equal(profileBand("bulwark"), "second");
  assert.equal(profileBand("stanchion"), "third");
  assert.equal(profileBand("capstan"), "fourth");
  assert.equal(profileGap("gunwale", "capstan"), 3);
  assert.equal(profileGap("capstan", "gunwale"), -3);
  assert.equal(profileGap("jasper", "gunwale"), null);
  assert.equal(ivoryQuiet("ivory"), true);
  assert.equal(ivoryQuiet("GRAPHITE"), false);
  assert.equal(midDepth(3), true);
  assert.equal(midDepth(1), false);
  assert.equal(fullDepth(6), true);
  assert.equal(fullDepth(3), false);
  assert.equal(activeProfile("warm"), "warm");
  assert.equal(activeProfile("cool"), "cool");
  assert.equal(activeProfile("capstan"), "capstan");
  assert.equal(activeProfile("nope"), "all");
  assert.equal(activeHour("12"), "12");
  assert.equal(activeHour("1"), "all");
  assert.equal(activeDepth("6"), "6");
  assert.equal(activeDepth("2"), "all");
  assert.equal(activeBed("ivory", ["IVORY", "GRAPHITE"]), "IVORY");
  assert.equal(activeBed("gilt", ["IVORY"]), "all");
  assert.equal(moveGunwaleFocus(0, 4, -1), 3);
  assert.equal(suggestProfile(1), "gunwale");
  assert.equal(suggestProfile(5), "bulwark");
  assert.equal(suggestProfile(10), "stanchion");
  assert.equal(suggestProfile(20), "capstan");
  assert.equal(suggestGunwaleHour([], 1), 3);
  assert.equal(suggestGunwaleHour([], 5), 6);
  assert.equal(suggestGunwaleHour([], 10), 12);
  assert.equal(suggestGunwaleHour([], 20), 24);
  const saved = [
    course({ id: "a", title: "Ada", hour: 24 }),
    course({ id: "b", title: "Bea", hour: 6 }),
    course({ id: "c", title: "Cid", hour: 12 }),
  ];
  assert.equal(suggestGunwaleHour(saved, 24), 3);
  assert.equal(suggestGunwaleBed([course({ id: "g", title: "Gilt", bed: "GILT" })]), "IVORY");
  assert.equal(fairHand([course({ id: "h", title: "Held", hand: "Nia" })], "Nia, Omar"), "Omar");

  const late = course({ id: "l", title: "Late", profile: "gunwale" });
  const overdue = course({ id: "o", title: "Over", profile: "capstan", depth: 1 });
  const idle = course({ id: "i", title: "Idle", hour: 3, depth: 1, bed: "" });
  const brisk = course({ id: "b2", title: "Brisk", bed: "IVORY", hour: 24, depth: 6 });
  const resting = course({ id: "r", title: "Rest", profile: "stanchion", bed: "GILT", hour: 6 });
  assert.equal(lateGunwale(late, "capstan"), true);
  assert.equal(lateGunwale(late, "gunwale"), false);
  assert.equal(overdueGunwale(overdue), true);
  assert.equal(overdueGunwale({ ...overdue, raised: true }), false);
  assert.equal(idleGunwale(idle), true);
  assert.equal(briskGunwale(brisk), true);
  assert.equal(restingGunwale(resting), true);
  assert.deepEqual(reminderGunwaleList([overdue, late]), ["Over"]);
  const added = addGunwale([], { title: "New course", profile: "bulwark", hour: 6, depth: 3, bed: "ivory", tags: "c v z" });
  assert.equal(added.length, 1);
  assert.equal(added[0].profile, "bulwark");
  assert.equal(added[0].hour, 6);
  assert.equal(added[0].depth, 3);
  assert.equal(added[0].bed, "IVORY");
  assert.deepEqual(added[0].tags, ["c", "v"]);
  assert.equal(addGunwale(added, { title: "New course" }).length, 1);
  const view = { id: "v", name: "Warm", rack: "base" as const, query: "", hand: "", bed: "", profile: "warm", hour: "", depth: "" };
  assert.equal(addGunwaleView([], view).length, 1);
  assert.equal(dropGunwaleView(addGunwaleView([], view), "v").length, 0);
  assert.equal(readGunwaleViews([{ ...view, name: "" }]).length, 0);
  const line = gunwaleTimeline([course({ id: "t", title: "Tide", hour: 6 })]);
  assert.equal(line[0].hour, 6);
  assert.deepEqual(line[0].titles, ["Tide"]);

  assert.equal(fairleadLit("NOW"), true);
  assert.equal(fairleadLit("OPEN"), true);
  assert.equal(fairleadLit("live"), true);
  assert.equal(fairleadLit("GOLD"), true);
  assert.equal(fairleadLit("ON"), true);
  assert.equal(fairleadHue("NOW"), "gilt");
  assert.equal(fairleadFar("A"), true);
  assert.equal(fairleadLit(true), true);
  assert.equal(fairleadLit(false), false);
  assert.equal(fairleadLit("AT-A"), true);
  assert.equal(fairleadNear("AT-ABCD"), true);
  assert.equal(fairleadNear("ABCD"), true);
  assert.equal(fairleadNear("AB"), false);
  assert.equal(fairleadFar("AB"), false);
  assert.equal(fairleadFade("A".repeat(14)), true);
  assert.equal(fairleadFade("AT-" + "A".repeat(11)), true);
  assert.equal(fairleadFade("A".repeat(8)), false);
  assert.equal(fairleadDim("STAY"), true);
  assert.equal(fairleadDim("SOFT"), true);
  assert.equal(fairleadDim("ABC"), true);
  assert.equal(fairleadDark("BAN"), true);
  assert.equal(fairleadDark(false), false);
  assert.equal(fairleadDark("DROP"), true);
  assert.equal(fairleadBlank("CLEAR"), true);
  assert.equal(fairleadBlank("NULL"), true);
  assert.equal(fairleadOpen(""), true);
  assert.equal(fairleadHue("BAN"), "ash");
  assert.equal(fairleadHue("STAY"), "pearl");
  assert.equal(fairleadLength("ABCD"), 4);
  assert.equal(fairleadEven("AB"), true);
  assert.equal(fairleadDigit("12night"), true);
  assert.equal(fairleadLetter("NOW"), true);
  assert.equal(fairleadUpper("ISTANBUL"), true);
  assert.equal(fairleadUpper("VIP"), false);
  assert.equal(fairleadLit("ABCDEFGH"), false);
  assert.equal(fairleadDim("ABCDEFGH"), true);
  assert.equal(fairleadCopy("NOW"), "NOW");
  assert.equal(fairleadLit({ balance: 1 }), false);
  assert.equal(fairleadLit({ defaultEmail: "NOW" }), true);
  assert.equal(fairleadLit(fairleadSlice({ defaultEmail: true, balance: 9 })), true);
  const rows: FairleadRow[] = [
    { id: "1", label: "Ada", code: "NOW" },
    { id: "2", label: "Bea", code: "QUEUE" },
  ];
  assert.equal(leadingFairlead(rows), "live");
  assert.equal(leadingFairleadHue(rows), "gilt");
  assert.match(fairleadLanesCsv(rows), /live,1/);
  assert.match(fairleadRowsCsv(rows, ["1"]), /Ada,NOW/);
  assert.match(fairleadRowsCsv(rows, ["1"]), /,1$/m);
  assert.match(fairleadRowsCsv(rows, ["1"]), /^name,mail,lane,hue,reviewed/m);

  assert.equal(crmv4Text("en", "gnwTitle"), ROUND420_COPY.en.gnwTitle);
  assert.equal(crmv4Text("tr", "frlTitle"), ROUND420_COPY.tr.frlTitle);
  assert.equal(crmv4Text("de", "gnwHint"), ROUND420_COPY.de.gnwHint);
  assert.equal(crmv4Text("ru", "mlnMarlinspikeKicker"), ROUND420_COPY.ru.mlnMarlinspikeKicker);
  assert.equal(crmv4Text("ar", "tbkTurnbuckleLead"), ROUND420_COPY.ar.tbkTurnbuckleLead);
  const keys = Object.keys(ROUND420_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND420_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-gnw420/);
  assert.match(css, /\.c4-frl420/);
  assert.match(css, /\.c4-gnw420-column/);
  assert.match(css, /\.c4-frl420-column/);
  assert.match(css, /\.c4-rate-marlinspike/);
  assert.match(css, /\.c4-lead-turnbuckle/);
  assert.match(css, /\.c4-rate-marlinspike-mast/);
  assert.match(css, /\.c4-lead-turnbuckle-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round420.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.equal(viewFile.includes("totpSecret"), false);
  assert.match(viewFile, /fairleadSlice/);
  assert.match(viewFile, /gunwaleCsv/);
  assert.match(viewFile, /fairleadRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/desks\?take=24/);
  assert.match(viewFile, /defaultEmail/);
  assert.match(viewFile, /data-gnw420/);
  assert.match(viewFile, /data-frl420/);
  assert.match(viewFile, /data-mail/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestGunwaleBed/);
  assert.match(viewFile, /c4-frl420-search/);
  assert.match(viewFile, /gunwaleTimeline/);
  assert.match(viewFile, /c4-gnw420-notices/);
  assert.match(viewFile, /from "@\/lib\/crmv4\/round420"/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "gnw"/);
  assert.match(app, /view === "frl"/);
  const ops = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Ops.tsx"), "utf8");
  assert.match(ops, /c4-rate-marlinspike/);
  assert.match(ops, /RateMarlinspikeHead/);
  assert.match(ops, /data-rate-marlinspike/);
  const settings = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Settings.tsx"), "utf8");
  assert.match(settings, /c4-lead-turnbuckle/);
  assert.match(settings, /LeadTurnbuckleHead/);
  assert.match(settings, /data-lead-turnbuckle/);
  assert.match(viewFile, /c4-rate-marlinspike-mast/);
  assert.match(viewFile, /c4-lead-turnbuckle-mast/);
  assert.match(viewFile, /mlnMarlinspikeKicker/);
  assert.match(viewFile, /mlnMarlinspikeLead/);
  assert.match(viewFile, /tbkTurnbuckleKicker/);
  assert.match(viewFile, /tbkTurnbuckleLead/);
  assert.match(viewFile, /data-logo="mono"/);
  const namedKeys = `${viewFile}\n${ops}\n${settings}`.match(/"(gnw|frl|mln|tbk)[A-Z][A-Za-z0-9]*"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND420_COPY.en[key as keyof typeof ROUND420_COPY.en], "string", key);
  console.log("crmv4 round420 tests passed");
}

main();
