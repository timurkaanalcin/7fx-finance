/**
 * Metope courses, triglyph username plates, the ivory watch acroterion, and the graphite exposure antefix.
 * Run: TZ=UTC npx tsx tests/crmv4-round412.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND412_COPY } from "../src/lib/crmv4/copy-round412";
import { ROUND411_FEATURES } from "../src/lib/crmv4/round411";
import {
  ROUND412_FEATURES,
  activeBed,
  activeDepth,
  activeHour,
  activeProfile,
  addMetope,
  addMetopeView,
  briskMetope,
  depthCount,
  dropMetopeView,
  fairHand,
  fullDepth,
  idleMetope,
  graphiteQuiet,
  lateMetope,
  leadingTriglyph,
  leadingTriglyphHue,
  midDepth,
  moveMetopeFocus,
  overdueMetope,
  triglyphBlank,
  triglyphCopy,
  triglyphDark,
  triglyphDigit,
  triglyphDim,
  triglyphEven,
  triglyphFade,
  triglyphFar,
  triglyphHue,
  triglyphLanesCsv,
  triglyphLength,
  triglyphLetter,
  triglyphLit,
  triglyphNear,
  triglyphOpen,
  triglyphRowsCsv,
  triglyphSlice,
  triglyphUpper,
  profileBand,
  profileCool,
  profileGap,
  profilePoint,
  profileWarm,
  readMetopeViews,
  reminderMetopeList,
  restingMetope,
  metopeBed,
  metopeHour,
  metopeTimeline,
  suggestProfile,
  suggestMetopeBed,
  suggestMetopeHour,
  type Metope,
  type TriglyphRow,
} from "../src/lib/crmv4/round412";

function course(partial: Partial<Metope> & { id: string; title: string }): Metope {
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
  assert.equal(ROUND412_FEATURES.length, 25);
  assert.equal(new Set(ROUND412_FEATURES).size, 25);
  for (const feature of ROUND412_FEATURES) assert.equal((ROUND411_FEATURES as readonly string[]).includes(feature), false, feature);
  const libDir = path.join(__dirname, "../src/lib/crmv4");
  for (const feature of ROUND412_FEATURES) {
    const needle = `"${feature}"`;
    for (const file of fs.readdirSync(libDir)) {
      if (!file.endsWith(".ts") || file === "round412.ts") continue;
      const body = fs.readFileSync(path.join(libDir, file), "utf8");
      assert.equal(body.includes(needle), false, `${feature} in ${file}`);
    }
  }

  assert.equal(profilePoint(" metope "), "metope");
  assert.equal(profilePoint("jasper"), "");
  assert.equal(metopeHour("2"), 2);
  assert.equal(metopeHour(7), 7);
  assert.equal(metopeHour(11), 11);
  assert.equal(metopeHour(18), 18);
  assert.equal(metopeHour("1"), null);
  assert.equal(metopeHour("4"), null);
  assert.equal(depthCount("4"), 4);
  assert.equal(depthCount(7), 7);
  assert.equal(depthCount("11"), 11);
  assert.equal(depthCount("1"), null);
  assert.equal(depthCount("3"), null);
  assert.equal(metopeBed("ivory"), "IVORY");
  assert.equal(metopeBed("graphite"), "GRAPHITE");
  assert.equal(metopeBed("gilt"), "GILT");
  assert.equal(metopeBed("gold"), "");
  assert.equal(profileWarm("metope"), true);
  assert.equal(profileWarm("GUTTA"), true);
  assert.equal(profileWarm("regula"), false);
  assert.equal(profileCool("regula"), true);
  assert.equal(profileCool("mutule"), true);
  assert.equal(profileCool("metope"), false);
  assert.equal(profileBand("metope"), "first");
  assert.equal(profileBand("gutta"), "second");
  assert.equal(profileBand("regula"), "third");
  assert.equal(profileBand("mutule"), "fourth");
  assert.equal(profileGap("metope", "mutule"), 3);
  assert.equal(profileGap("mutule", "metope"), -3);
  assert.equal(profileGap("jasper", "metope"), null);
  assert.equal(graphiteQuiet("graphite"), true);
  assert.equal(graphiteQuiet("IVORY"), false);
  assert.equal(midDepth(7), true);
  assert.equal(midDepth(4), false);
  assert.equal(fullDepth(11), true);
  assert.equal(fullDepth(7), false);
  assert.equal(activeProfile("warm"), "warm");
  assert.equal(activeProfile("cool"), "cool");
  assert.equal(activeProfile("mutule"), "mutule");
  assert.equal(activeProfile("nope"), "all");
  assert.equal(activeHour("11"), "11");
  assert.equal(activeHour("3"), "all");
  assert.equal(activeDepth("11"), "11");
  assert.equal(activeDepth("1"), "all");
  assert.equal(activeBed("ivory", ["IVORY", "GRAPHITE"]), "IVORY");
  assert.equal(activeBed("gilt", ["IVORY"]), "all");
  assert.equal(moveMetopeFocus(0, 4, -1), 3);
  assert.equal(suggestProfile(1), "metope");
  assert.equal(suggestProfile(2), "gutta");
  assert.equal(suggestProfile(7), "regula");
  assert.equal(suggestProfile(11), "mutule");
  assert.equal(suggestMetopeHour([], 1), 2);
  assert.equal(suggestMetopeHour([], 2), 7);
  assert.equal(suggestMetopeHour([], 7), 11);
  assert.equal(suggestMetopeHour([], 11), 18);
  const saved = [
    course({ id: "a", title: "Ada", hour: 18 }),
    course({ id: "b", title: "Bea", hour: 7 }),
    course({ id: "c", title: "Cid", hour: 11 }),
  ];
  assert.equal(suggestMetopeHour(saved, 18), 2);
  assert.equal(suggestMetopeBed([course({ id: "g", title: "Gilt", bed: "GILT" })]), "GRAPHITE");
  assert.equal(fairHand([course({ id: "h", title: "Held", hand: "Nia" })], "Nia, Omar"), "Omar");

  const late = course({ id: "l", title: "Late", profile: "metope" });
  const overdue = course({ id: "o", title: "Over", profile: "mutule", depth: 4 });
  const idle = course({ id: "i", title: "Idle", hour: 2, depth: 4, bed: "" });
  const brisk = course({ id: "b2", title: "Brisk", bed: "GRAPHITE", hour: 18, depth: 11 });
  const resting = course({ id: "r", title: "Rest", profile: "regula", bed: "IVORY", hour: 7 });
  assert.equal(lateMetope(late, "mutule"), true);
  assert.equal(lateMetope(late, "metope"), false);
  assert.equal(overdueMetope(overdue), true);
  assert.equal(overdueMetope({ ...overdue, raised: true }), false);
  assert.equal(idleMetope(idle), true);
  assert.equal(briskMetope(brisk), true);
  assert.equal(restingMetope(resting), true);
  assert.deepEqual(reminderMetopeList([overdue, late]), ["Over"]);
  const added = addMetope([], { title: "New course", profile: "gutta", hour: 7, depth: 7, bed: "ivory", tags: "m t z" });
  assert.equal(added.length, 1);
  assert.equal(added[0].profile, "gutta");
  assert.equal(added[0].hour, 7);
  assert.equal(added[0].depth, 7);
  assert.equal(added[0].bed, "IVORY");
  assert.deepEqual(added[0].tags, ["m", "t"]);
  assert.equal(addMetope(added, { title: "New course" }).length, 1);
  const view = { id: "v", name: "Warm", rack: "base" as const, query: "", hand: "", bed: "", profile: "warm", hour: "", depth: "" };
  assert.equal(addMetopeView([], view).length, 1);
  assert.equal(dropMetopeView(addMetopeView([], view), "v").length, 0);
  assert.equal(readMetopeViews([{ ...view, name: "" }]).length, 0);
  const line = metopeTimeline([course({ id: "t", title: "Tide", hour: 7 })]);
  assert.equal(line[0].hour, 7);
  assert.deepEqual(line[0].titles, ["Tide"]);

  assert.equal(triglyphLit("VERIFIED"), true);
  assert.equal(triglyphLit(true), true);
  assert.equal(triglyphLit(false), false);
  assert.equal(triglyphLit("USR-AB"), false);
  assert.equal(triglyphLit("USR-ABCDEFGH"), false);
  assert.equal(triglyphNear("HOT"), true);
  assert.equal(triglyphNear("USR-AB"), true);
  assert.equal(triglyphNear("AB"), false);
  assert.equal(triglyphFar("A"), true);
  assert.equal(triglyphFar("AB"), true);
  assert.equal(triglyphFar("ABCD"), false);
  assert.equal(triglyphFade("A".repeat(18)), true);
  assert.equal(triglyphFade("USR-ABCDEFGH"), true);
  assert.equal(triglyphFade("A".repeat(8)), false);
  assert.equal(triglyphDim("WAIT"), true);
  assert.equal(triglyphDim("PENDING"), true);
  assert.equal(triglyphDark("OFF"), true);
  assert.equal(triglyphDark(false), true);
  assert.equal(triglyphDark("REJECTED"), true);
  assert.equal(triglyphBlank("UNVERIFIED"), true);
  assert.equal(triglyphBlank("NONE"), true);
  assert.equal(triglyphOpen(""), true);
  assert.equal(triglyphHue("VERIFIED"), "gilt");
  assert.equal(triglyphHue("OFF"), "ash");
  assert.equal(triglyphHue("WAIT"), "pearl");
  assert.equal(triglyphLength("ABCD"), 4);
  assert.equal(triglyphEven("AB"), true);
  assert.equal(triglyphDigit("12night"), true);
  assert.equal(triglyphLetter("READY"), true);
  assert.equal(triglyphUpper("ISTANBUL"), true);
  assert.equal(triglyphUpper("VIP"), false);
  assert.equal(triglyphLit("ABCDEFGH"), false);
  assert.equal(triglyphDim("ABCDEFGH"), true);
  assert.equal(triglyphCopy("READY"), "READY");
  assert.equal(triglyphLit({ balance: 1 }), false);
  assert.equal(triglyphLit({ username: "VERIFIED" }), true);
  assert.equal(triglyphLit(triglyphSlice({ username: true, balance: 9 })), true);
  const rows: TriglyphRow[] = [
    { id: "1", label: "Ada", code: "VERIFIED" },
    { id: "2", label: "Bea", code: "PENDING" },
  ];
  assert.equal(leadingTriglyph(rows), "live");
  assert.equal(leadingTriglyphHue(rows), "gilt");
  assert.match(triglyphLanesCsv(rows), /live,1/);
  assert.match(triglyphRowsCsv(rows, ["1"]), /Ada,VERIFIED/);
  assert.match(triglyphRowsCsv(rows, ["1"]), /,1$/m);
  assert.match(triglyphRowsCsv(rows, ["1"]), /^name,username,lane,hue,reviewed/m);

  assert.equal(crmv4Text("en", "mteTitle"), ROUND412_COPY.en.mteTitle);
  assert.equal(crmv4Text("tr", "trgTitle"), ROUND412_COPY.tr.trgTitle);
  assert.equal(crmv4Text("de", "mteHint"), ROUND412_COPY.de.mteHint);
  assert.equal(crmv4Text("ru", "wacAcroKicker"), ROUND412_COPY.ru.wacAcroKicker);
  assert.equal(crmv4Text("ar", "eanAnteLead"), ROUND412_COPY.ar.eanAnteLead);
  const keys = Object.keys(ROUND412_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND412_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-mte412/);
  assert.match(css, /\.c4-trg412/);
  assert.match(css, /\.c4-mte412-column/);
  assert.match(css, /\.c4-trg412-column/);
  assert.match(css, /\.c4-watch-acroterion/);
  assert.match(css, /\.c4-exposure-antefix/);
  assert.match(css, /\.c4-watch-acroterion-mast/);
  assert.match(css, /\.c4-exposure-antefix-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round412.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.equal(viewFile.includes("totpSecret"), false);
  assert.match(viewFile, /triglyphSlice/);
  assert.match(viewFile, /metopeCsv/);
  assert.match(viewFile, /triglyphRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-mte412/);
  assert.match(viewFile, /data-trg412/);
  assert.match(viewFile, /data-username/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestMetopeBed/);
  assert.match(viewFile, /c4-trg412-search/);
  assert.match(viewFile, /metopeTimeline/);
  assert.match(viewFile, /c4-mte412-notices/);
  assert.match(viewFile, /from "@\/lib\/crmv4\/round412"/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "mte"/);
  assert.match(app, /view === "trg"/);
  const source = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round8.tsx"), "utf8");
  assert.match(source, /c4-watch-acroterion/);
  assert.match(source, /c4-watch-acroterion-mast/);
  assert.match(source, /data-logo="mono"/);
  assert.match(source, /wacAcroKicker/);
  assert.match(source, /wacAcroLead/);
  assert.match(source, /data-watch-acroterion/);
  assert.match(source, /c4-exposure-antefix/);
  assert.match(source, /c4-exposure-antefix-mast/);
  assert.match(source, /eanAnteKicker/);
  assert.match(source, /eanAnteLead/);
  assert.match(source, /data-exposure-antefix/);
  const namedKeys = `${viewFile}\n${source}`.match(/"(mte|trg|wacAcro|eanAnte)[A-Z][A-Za-z0-9]*"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND412_COPY.en[key as keyof typeof ROUND412_COPY.en], "string", key);
  console.log("crmv4 round412 tests passed");
}

main();
