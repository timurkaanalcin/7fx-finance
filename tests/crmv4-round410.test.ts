/**
 * Architrave courses, proscenium account-type plates, the ivory source impluvium, and the graphite status lararium.
 * Run: TZ=UTC npx tsx tests/crmv4-round410.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND410_COPY } from "../src/lib/crmv4/copy-round410";
import { ROUND409_FEATURES } from "../src/lib/crmv4/round409";
import {
  ROUND410_FEATURES,
  activeBed,
  activeDepth,
  activeHour,
  activeProfile,
  addArchitrave,
  addArchitraveView,
  briskArchitrave,
  depthCount,
  dropArchitraveView,
  fairHand,
  fullDepth,
  idleArchitrave,
  graphiteQuiet,
  lateArchitrave,
  leadingProscenium,
  leadingProsceniumHue,
  midDepth,
  moveArchitraveFocus,
  overdueArchitrave,
  prosceniumBlank,
  prosceniumCopy,
  prosceniumDark,
  prosceniumDigit,
  prosceniumDim,
  prosceniumEven,
  prosceniumFade,
  prosceniumFar,
  prosceniumHue,
  prosceniumLanesCsv,
  prosceniumLength,
  prosceniumLetter,
  prosceniumLit,
  prosceniumNear,
  prosceniumOpen,
  prosceniumRowsCsv,
  prosceniumSlice,
  prosceniumUpper,
  profileBand,
  profileCool,
  profileGap,
  profilePoint,
  profileWarm,
  readArchitraveViews,
  reminderArchitraveList,
  restingArchitrave,
  architraveBed,
  architraveHour,
  architraveTimeline,
  suggestProfile,
  suggestArchitraveBed,
  suggestArchitraveHour,
  type Architrave,
  type ProsceniumRow,
} from "../src/lib/crmv4/round410";

function course(partial: Partial<Architrave> & { id: string; title: string }): Architrave {
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
  assert.equal(ROUND410_FEATURES.length, 25);
  assert.equal(new Set(ROUND410_FEATURES).size, 25);
  for (const feature of ROUND410_FEATURES) assert.equal((ROUND409_FEATURES as readonly string[]).includes(feature), false, feature);
  const libDir = path.join(__dirname, "../src/lib/crmv4");
  for (const feature of ROUND410_FEATURES) {
    const needle = `"${feature}"`;
    for (const file of fs.readdirSync(libDir)) {
      if (!file.endsWith(".ts") || file === "round410.ts") continue;
      const body = fs.readFileSync(path.join(libDir, file), "utf8");
      assert.equal(body.includes(needle), false, `${feature} in ${file}`);
    }
  }

  assert.equal(profilePoint(" architrave "), "architrave");
  assert.equal(profilePoint("jasper"), "");
  assert.equal(architraveHour("2"), 2);
  assert.equal(architraveHour(7), 7);
  assert.equal(architraveHour(11), 11);
  assert.equal(architraveHour(18), 18);
  assert.equal(architraveHour("1"), null);
  assert.equal(architraveHour("4"), null);
  assert.equal(depthCount("4"), 4);
  assert.equal(depthCount(7), 7);
  assert.equal(depthCount("11"), 11);
  assert.equal(depthCount("1"), null);
  assert.equal(depthCount("3"), null);
  assert.equal(architraveBed("ivory"), "IVORY");
  assert.equal(architraveBed("graphite"), "GRAPHITE");
  assert.equal(architraveBed("gilt"), "GILT");
  assert.equal(architraveBed("gold"), "");
  assert.equal(profileWarm("architrave"), true);
  assert.equal(profileWarm("IMPLUVIUM"), true);
  assert.equal(profileWarm("lararium"), false);
  assert.equal(profileCool("lararium"), true);
  assert.equal(profileCool("squinch"), true);
  assert.equal(profileCool("architrave"), false);
  assert.equal(profileBand("architrave"), "first");
  assert.equal(profileBand("impluvium"), "second");
  assert.equal(profileBand("lararium"), "third");
  assert.equal(profileBand("squinch"), "fourth");
  assert.equal(profileGap("architrave", "squinch"), 3);
  assert.equal(profileGap("squinch", "architrave"), -3);
  assert.equal(profileGap("jasper", "architrave"), null);
  assert.equal(graphiteQuiet("graphite"), true);
  assert.equal(graphiteQuiet("IVORY"), false);
  assert.equal(midDepth(7), true);
  assert.equal(midDepth(4), false);
  assert.equal(fullDepth(11), true);
  assert.equal(fullDepth(7), false);
  assert.equal(activeProfile("warm"), "warm");
  assert.equal(activeProfile("cool"), "cool");
  assert.equal(activeProfile("squinch"), "squinch");
  assert.equal(activeProfile("nope"), "all");
  assert.equal(activeHour("11"), "11");
  assert.equal(activeHour("3"), "all");
  assert.equal(activeDepth("11"), "11");
  assert.equal(activeDepth("1"), "all");
  assert.equal(activeBed("ivory", ["IVORY", "GRAPHITE"]), "IVORY");
  assert.equal(activeBed("gilt", ["IVORY"]), "all");
  assert.equal(moveArchitraveFocus(0, 4, -1), 3);
  assert.equal(suggestProfile(1), "architrave");
  assert.equal(suggestProfile(2), "impluvium");
  assert.equal(suggestProfile(7), "lararium");
  assert.equal(suggestProfile(11), "squinch");
  assert.equal(suggestArchitraveHour([], 1), 2);
  assert.equal(suggestArchitraveHour([], 2), 7);
  assert.equal(suggestArchitraveHour([], 7), 11);
  assert.equal(suggestArchitraveHour([], 11), 18);
  const saved = [
    course({ id: "a", title: "Ada", hour: 18 }),
    course({ id: "b", title: "Bea", hour: 7 }),
    course({ id: "c", title: "Cid", hour: 11 }),
  ];
  assert.equal(suggestArchitraveHour(saved, 18), 2);
  assert.equal(suggestArchitraveBed([course({ id: "g", title: "Gilt", bed: "GILT" })]), "GRAPHITE");
  assert.equal(fairHand([course({ id: "h", title: "Held", hand: "Nia" })], "Nia, Omar"), "Omar");

  const late = course({ id: "l", title: "Late", profile: "architrave" });
  const overdue = course({ id: "o", title: "Over", profile: "squinch", depth: 4 });
  const idle = course({ id: "i", title: "Idle", hour: 2, depth: 4, bed: "" });
  const brisk = course({ id: "b2", title: "Brisk", bed: "GRAPHITE", hour: 18, depth: 11 });
  const resting = course({ id: "r", title: "Rest", profile: "lararium", bed: "IVORY", hour: 7 });
  assert.equal(lateArchitrave(late, "squinch"), true);
  assert.equal(lateArchitrave(late, "architrave"), false);
  assert.equal(overdueArchitrave(overdue), true);
  assert.equal(overdueArchitrave({ ...overdue, raised: true }), false);
  assert.equal(idleArchitrave(idle), true);
  assert.equal(briskArchitrave(brisk), true);
  assert.equal(restingArchitrave(resting), true);
  assert.deepEqual(reminderArchitraveList([overdue, late]), ["Over"]);
  const added = addArchitrave([], { title: "New course", profile: "impluvium", hour: 7, depth: 7, bed: "ivory", tags: "a r z" });
  assert.equal(added.length, 1);
  assert.equal(added[0].profile, "impluvium");
  assert.equal(added[0].hour, 7);
  assert.equal(added[0].depth, 7);
  assert.equal(added[0].bed, "IVORY");
  assert.deepEqual(added[0].tags, ["a", "r"]);
  assert.equal(addArchitrave(added, { title: "New course" }).length, 1);
  const view = { id: "v", name: "Warm", rack: "base" as const, query: "", hand: "", bed: "", profile: "warm", hour: "", depth: "" };
  assert.equal(addArchitraveView([], view).length, 1);
  assert.equal(dropArchitraveView(addArchitraveView([], view), "v").length, 0);
  assert.equal(readArchitraveViews([{ ...view, name: "" }]).length, 0);
  const line = architraveTimeline([course({ id: "t", title: "Tide", hour: 7 })]);
  assert.equal(line[0].hour, 7);
  assert.deepEqual(line[0].titles, ["Tide"]);

  assert.equal(prosceniumLit("STANDARD"), true);
  assert.equal(prosceniumLit(true), true);
  assert.equal(prosceniumLit(false), false);
  assert.equal(prosceniumLit("TYPE-AB"), false);
  assert.equal(prosceniumLit("TYPE-ABCDEFGHI"), false);
  assert.equal(prosceniumNear("WARM"), true);
  assert.equal(prosceniumNear("TYPE-AB"), true);
  assert.equal(prosceniumNear("AB"), false);
  assert.equal(prosceniumFar("A"), true);
  assert.equal(prosceniumFar("AB"), true);
  assert.equal(prosceniumFar("ABCD"), false);
  assert.equal(prosceniumFade("A".repeat(20)), true);
  assert.equal(prosceniumFade("TYPE-ABCDEFGHI"), true);
  assert.equal(prosceniumFade("A".repeat(8)), false);
  assert.equal(prosceniumDim("WAIT"), true);
  assert.equal(prosceniumDim("PAUSE"), true);
  assert.equal(prosceniumDark("OFF"), true);
  assert.equal(prosceniumDark(false), true);
  assert.equal(prosceniumDark("HALT"), true);
  assert.equal(prosceniumBlank("NONE"), true);
  assert.equal(prosceniumOpen(""), true);
  assert.equal(prosceniumHue("STANDARD"), "gilt");
  assert.equal(prosceniumHue("OFF"), "ash");
  assert.equal(prosceniumHue("WAIT"), "pearl");
  assert.equal(prosceniumLength("ABCD"), 4);
  assert.equal(prosceniumEven("AB"), true);
  assert.equal(prosceniumDigit("12night"), true);
  assert.equal(prosceniumLetter("READY"), true);
  assert.equal(prosceniumUpper("ISTANBUL"), true);
  assert.equal(prosceniumUpper("VIP"), false);
  assert.equal(prosceniumLit("ABCDEFGH"), false);
  assert.equal(prosceniumDim("ABCDEFGH"), true);
  assert.equal(prosceniumCopy("READY"), "READY");
  assert.equal(prosceniumLit({ balance: 1 }), false);
  assert.equal(prosceniumLit({ accountType: "STANDARD" }), true);
  assert.equal(prosceniumLit(prosceniumSlice({ accountType: true, balance: 9 })), true);
  const rows: ProsceniumRow[] = [
    { id: "1", label: "Ada", code: "STANDARD" },
    { id: "2", label: "Bea", code: "WAIT" },
  ];
  assert.equal(leadingProscenium(rows), "live");
  assert.equal(leadingProsceniumHue(rows), "gilt");
  assert.match(prosceniumLanesCsv(rows), /live,1/);
  assert.match(prosceniumRowsCsv(rows, ["1"]), /Ada,STANDARD/);
  assert.match(prosceniumRowsCsv(rows, ["1"]), /,1$/m);
  assert.match(prosceniumRowsCsv(rows, ["1"]), /^name,type,lane,hue,reviewed/m);

  assert.equal(crmv4Text("en", "atvTitle"), ROUND410_COPY.en.atvTitle);
  assert.equal(crmv4Text("tr", "pscTitle"), ROUND410_COPY.tr.pscTitle);
  assert.equal(crmv4Text("de", "atvHint"), ROUND410_COPY.de.atvHint);
  assert.equal(crmv4Text("ru", "srcImpluviumKicker"), ROUND410_COPY.ru.srcImpluviumKicker);
  assert.equal(crmv4Text("ar", "stwLarariumLead"), ROUND410_COPY.ar.stwLarariumLead);
  const keys = Object.keys(ROUND410_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND410_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-architrave/);
  assert.match(css, /\.c4-proscenium/);
  assert.match(css, /\.c4-architrave-column/);
  assert.match(css, /\.c4-proscenium-column/);
  assert.match(css, /\.c4-source-impluvium/);
  assert.match(css, /\.c4-status-lararium/);
  assert.match(css, /\.c4-source-impluvium-mast/);
  assert.match(css, /\.c4-status-lararium-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round410.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.equal(viewFile.includes("totpSecret"), false);
  assert.match(viewFile, /prosceniumSlice/);
  assert.match(viewFile, /architraveCsv/);
  assert.match(viewFile, /prosceniumRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-architrave/);
  assert.match(viewFile, /data-proscenium/);
  assert.match(viewFile, /data-type/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestArchitraveBed/);
  assert.match(viewFile, /c4-proscenium-search/);
  assert.match(viewFile, /architraveTimeline/);
  assert.match(viewFile, /c4-architrave-notices/);
  assert.match(viewFile, /from "@\/lib\/crmv4\/round410"/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "arc"/);
  assert.match(app, /view === "psc"/);
  const source = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round7.tsx"), "utf8");
  assert.match(source, /c4-source-impluvium/);
  assert.match(source, /c4-source-impluvium-mast/);
  assert.match(source, /data-logo="mono"/);
  assert.match(source, /srcImpluviumKicker/);
  assert.match(source, /srcImpluviumLead/);
  assert.match(source, /data-source-impluvium/);
  assert.match(source, /c4-status-lararium/);
  assert.match(source, /c4-status-lararium-mast/);
  assert.match(source, /stwLarariumKicker/);
  assert.match(source, /stwLarariumLead/);
  assert.match(source, /data-status-lararium/);
  const namedKeys = `${viewFile}\n${source}`.match(/"(atv|psc|srcImpluvium|stwLararium)[A-Z][A-Za-z0-9]*"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND410_COPY.en[key as keyof typeof ROUND410_COPY.en], "string", key);
  console.log("crmv4 round410 tests passed");
}

main();
