/**
 * Krepis courses, imbrex desk plates, the ivory rate rail, and the graphite statement folio.
 * Run: TZ=UTC npx tsx tests/crmv4-round408.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND408_COPY } from "../src/lib/crmv4/copy-round408";
import { ROUND407_FEATURES } from "../src/lib/crmv4/round407";
import {
  ROUND408_FEATURES,
  activeBed,
  activeDepth,
  activeHour,
  activeProfile,
  addKrepis,
  addKrepisView,
  briskKrepis,
  depthCount,
  dropKrepisView,
  fairHand,
  fullDepth,
  idleKrepis,
  graphiteQuiet,
  lateKrepis,
  leadingImbrex,
  leadingImbrexHue,
  midDepth,
  moveKrepisFocus,
  overdueKrepis,
  imbrexBlank,
  imbrexCopy,
  imbrexDark,
  imbrexDigit,
  imbrexDim,
  imbrexEven,
  imbrexFade,
  imbrexFar,
  imbrexHue,
  imbrexLanesCsv,
  imbrexLength,
  imbrexLetter,
  imbrexLit,
  imbrexNear,
  imbrexOpen,
  imbrexRowsCsv,
  imbrexSlice,
  imbrexUpper,
  profileBand,
  profileCool,
  profileGap,
  profilePoint,
  profileWarm,
  readKrepisViews,
  reminderKrepisList,
  restingKrepis,
  krepisBed,
  krepisHour,
  krepisTimeline,
  suggestProfile,
  suggestKrepisBed,
  suggestKrepisHour,
  type Krepis,
  type ImbrexRow,
} from "../src/lib/crmv4/round408";

function course(partial: Partial<Krepis> & { id: string; title: string }): Krepis {
  return {
    note: "",
    hand: "",
    profile: "",
    hour: null,
    bed: "",
    depth: 2,
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
  assert.equal(ROUND408_FEATURES.length, 25);
  assert.equal(new Set(ROUND408_FEATURES).size, 25);
  for (const feature of ROUND408_FEATURES) assert.equal((ROUND407_FEATURES as readonly string[]).includes(feature), false, feature);
  const libDir = path.join(__dirname, "../src/lib/crmv4");
  for (const feature of ROUND408_FEATURES) {
    const needle = `"${feature}"`;
    for (const file of fs.readdirSync(libDir)) {
      if (!file.endsWith(".ts") || file === "round408.ts") continue;
      const body = fs.readFileSync(path.join(libDir, file), "utf8");
      assert.equal(body.includes(needle), false, `${feature} in ${file}`);
    }
  }

  assert.equal(profilePoint(" krepis "), "krepis");
  assert.equal(profilePoint("jasper"), "");
  assert.equal(krepisHour("4"), 4);
  assert.equal(krepisHour(8), 8);
  assert.equal(krepisHour(12), 12);
  assert.equal(krepisHour(20), 20);
  assert.equal(krepisHour("1"), null);
  assert.equal(krepisHour("2"), null);
  assert.equal(depthCount("2"), 2);
  assert.equal(depthCount(6), 6);
  assert.equal(depthCount("10"), 10);
  assert.equal(depthCount("1"), null);
  assert.equal(depthCount("3"), null);
  assert.equal(krepisBed("ivory"), "IVORY");
  assert.equal(krepisBed("graphite"), "GRAPHITE");
  assert.equal(krepisBed("gilt"), "GILT");
  assert.equal(krepisBed("gold"), "");
  assert.equal(profileWarm("krepis"), true);
  assert.equal(profileWarm("TEGULA"), true);
  assert.equal(profileWarm("campana"), false);
  assert.equal(profileCool("campana"), true);
  assert.equal(profileCool("oculus"), true);
  assert.equal(profileCool("krepis"), false);
  assert.equal(profileBand("krepis"), "first");
  assert.equal(profileBand("tegula"), "second");
  assert.equal(profileBand("campana"), "third");
  assert.equal(profileBand("oculus"), "fourth");
  assert.equal(profileGap("krepis", "oculus"), 3);
  assert.equal(profileGap("oculus", "krepis"), -3);
  assert.equal(profileGap("jasper", "krepis"), null);
  assert.equal(graphiteQuiet("graphite"), true);
  assert.equal(graphiteQuiet("IVORY"), false);
  assert.equal(midDepth(6), true);
  assert.equal(midDepth(2), false);
  assert.equal(fullDepth(10), true);
  assert.equal(fullDepth(6), false);
  assert.equal(activeProfile("warm"), "warm");
  assert.equal(activeProfile("cool"), "cool");
  assert.equal(activeProfile("oculus"), "oculus");
  assert.equal(activeProfile("nope"), "all");
  assert.equal(activeHour("12"), "12");
  assert.equal(activeHour("2"), "all");
  assert.equal(activeDepth("10"), "10");
  assert.equal(activeDepth("1"), "all");
  assert.equal(activeBed("ivory", ["IVORY", "GRAPHITE"]), "IVORY");
  assert.equal(activeBed("gilt", ["IVORY"]), "all");
  assert.equal(moveKrepisFocus(0, 4, -1), 3);
  assert.equal(suggestProfile(1), "krepis");
  assert.equal(suggestProfile(4), "tegula");
  assert.equal(suggestProfile(8), "campana");
  assert.equal(suggestProfile(14), "oculus");
  assert.equal(suggestKrepisHour([], 1), 4);
  assert.equal(suggestKrepisHour([], 4), 8);
  assert.equal(suggestKrepisHour([], 8), 12);
  assert.equal(suggestKrepisHour([], 14), 20);
  const saved = [
    course({ id: "a", title: "Ada", hour: 20 }),
    course({ id: "b", title: "Bea", hour: 8 }),
    course({ id: "c", title: "Cid", hour: 12 }),
  ];
  assert.equal(suggestKrepisHour(saved, 20), 4);
  assert.equal(suggestKrepisBed([course({ id: "g", title: "Gilt", bed: "GILT" })]), "GRAPHITE");
  assert.equal(fairHand([course({ id: "h", title: "Held", hand: "Nia" })], "Nia, Omar"), "Omar");

  const late = course({ id: "l", title: "Late", profile: "krepis" });
  const overdue = course({ id: "o", title: "Over", profile: "oculus", depth: 2 });
  const idle = course({ id: "i", title: "Idle", hour: 4, depth: 2, bed: "" });
  const brisk = course({ id: "b2", title: "Brisk", bed: "GRAPHITE", hour: 20, depth: 10 });
  const resting = course({ id: "r", title: "Rest", profile: "campana", bed: "IVORY", hour: 8 });
  assert.equal(lateKrepis(late, "oculus"), true);
  assert.equal(lateKrepis(late, "krepis"), false);
  assert.equal(overdueKrepis(overdue), true);
  assert.equal(overdueKrepis({ ...overdue, raised: true }), false);
  assert.equal(idleKrepis(idle), true);
  assert.equal(briskKrepis(brisk), true);
  assert.equal(restingKrepis(resting), true);
  assert.deepEqual(reminderKrepisList([overdue, late]), ["Over"]);
  const added = addKrepis([], { title: "New course", profile: "tegula", hour: 8, depth: 6, bed: "ivory", tags: "k p z" });
  assert.equal(added.length, 1);
  assert.equal(added[0].profile, "tegula");
  assert.equal(added[0].hour, 8);
  assert.equal(added[0].depth, 6);
  assert.equal(added[0].bed, "IVORY");
  assert.deepEqual(added[0].tags, ["k", "p"]);
  assert.equal(addKrepis(added, { title: "New course" }).length, 1);
  const view = { id: "v", name: "Warm", rack: "base" as const, query: "", hand: "", bed: "", profile: "warm", hour: "", depth: "" };
  assert.equal(addKrepisView([], view).length, 1);
  assert.equal(dropKrepisView(addKrepisView([], view), "v").length, 0);
  assert.equal(readKrepisViews([{ ...view, name: "" }]).length, 0);
  const line = krepisTimeline([course({ id: "t", title: "Tide", hour: 8 })]);
  assert.equal(line[0].hour, 8);
  assert.deepEqual(line[0].titles, ["Tide"]);

  assert.equal(imbrexLit("OPEN"), true);
  assert.equal(imbrexLit(true), true);
  assert.equal(imbrexLit(false), false);
  assert.equal(imbrexLit("NAME-A"), true);
  assert.equal(imbrexLit("NAME-ABCDEF"), false);
  assert.equal(imbrexLit("READY"), false);
  assert.equal(imbrexNear("ABCD"), true);
  assert.equal(imbrexNear("NAME-ABC"), true);
  assert.equal(imbrexNear("ABC"), false);
  assert.equal(imbrexFar("A"), true);
  assert.equal(imbrexFar("AB"), true);
  assert.equal(imbrexFar("ABC"), false);
  assert.equal(imbrexFade("A".repeat(16)), true);
  assert.equal(imbrexFade("NAME-ABCDEF"), true);
  assert.equal(imbrexFade("A".repeat(8)), false);
  assert.equal(imbrexDim("WAIT"), true);
  assert.equal(imbrexDim("REST"), true);
  assert.equal(imbrexDark("STOP"), true);
  assert.equal(imbrexDark(false), true);
  assert.equal(imbrexBlank("NONE"), true);
  assert.equal(imbrexOpen(""), true);
  assert.equal(imbrexHue("OPEN"), "gilt");
  assert.equal(imbrexHue("STOP"), "ash");
  assert.equal(imbrexHue("WAIT"), "pearl");
  assert.equal(imbrexLength("ABCD"), 4);
  assert.equal(imbrexEven("AB"), true);
  assert.equal(imbrexDigit("12night"), true);
  assert.equal(imbrexLetter("READY"), true);
  assert.equal(imbrexUpper("ISTANBUL"), true);
  assert.equal(imbrexUpper("OPEN"), false);
  assert.equal(imbrexLit("ABCDEFGH"), false);
  assert.equal(imbrexDim("ABCDEFGH"), true);
  assert.equal(imbrexCopy("READY"), "READY");
  assert.equal(imbrexLit({ balance: 1 }), false);
  assert.equal(imbrexLit({ lastName: "OPEN" }), true);
  assert.equal(imbrexLit(imbrexSlice({ lastName: true, balance: 9 })), true);
  const rows: ImbrexRow[] = [
    { id: "1", label: "Ada", code: "OPEN" },
    { id: "2", label: "Bea", code: "WAIT" },
  ];
  assert.equal(leadingImbrex(rows), "live");
  assert.equal(leadingImbrexHue(rows), "gilt");
  assert.match(imbrexLanesCsv(rows), /live,1/);
  assert.match(imbrexRowsCsv(rows, ["1"]), /Ada,OPEN/);
  assert.match(imbrexRowsCsv(rows, ["1"]), /,1$/m);
  assert.match(imbrexRowsCsv(rows, ["1"]), /^name,mark,lane,hue,reviewed/m);

    assert.equal(crmv4Text("en", "krpTitle"), ROUND408_COPY.en.krpTitle);
  assert.equal(crmv4Text("tr", "imbTitle"), ROUND408_COPY.tr.imbTitle);
  assert.equal(crmv4Text("de", "krpHint"), ROUND408_COPY.de.krpHint);
  assert.equal(crmv4Text("ru", "localTegulaKicker"), ROUND408_COPY.ru.localTegulaKicker);
  assert.equal(crmv4Text("ar", "quickDosseretLead"), ROUND408_COPY.ar.quickDosseretLead);
  const keys = Object.keys(ROUND408_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND408_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-krepis/);
  assert.match(css, /\.c4-imbrex/);
  assert.match(css, /\.c4-krepis-column/);
  assert.match(css, /\.c4-imbrex-column/);
  assert.match(css, /\.c4-local-tegula/);
  assert.match(css, /\.c4-quick-dosseret/);
  assert.match(css, /\.c4-local-tegula-mast/);
  assert.match(css, /\.c4-quick-dosseret-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round408.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.equal(viewFile.includes("totpSecret"), false);
  assert.match(viewFile, /imbrexSlice/);
  assert.match(viewFile, /krepisCsv/);
  assert.match(viewFile, /imbrexRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-krepis/);
  assert.match(viewFile, /data-imbrex/);
  assert.match(viewFile, /data-surname/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestKrepisBed/);
  assert.match(viewFile, /c4-imbrex-search/);
  assert.match(viewFile, /krepisTimeline/);
  assert.match(viewFile, /c4-krepis-notices/);
  assert.match(viewFile, /from "@\/lib\/crmv4\/round408"/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "krp"/);
  assert.match(app, /view === "imb"/);
  const local = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round20.tsx"), "utf8");
  const quick = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round22.tsx"), "utf8");
  assert.match(local, /c4-local-tegula/);
  assert.match(local, /c4-local-tegula-mast/);
  assert.match(local, /data-logo="mono"/);
  assert.match(local, /localTegulaKicker/);
  assert.match(local, /localTegulaLead/);
  assert.match(local, /data-local-tegula/);
  assert.match(quick, /c4-quick-dosseret/);
  assert.match(quick, /c4-quick-dosseret-mast/);
  assert.match(quick, /data-logo="mono"/);
  assert.match(quick, /quickDosseretKicker/);
  assert.match(quick, /quickDosseretLead/);
  assert.match(quick, /data-quick-dosseret/);
  const namedKeys = `${viewFile}\n${local}\n${quick}`.match(/"(krp|imb|localTegula|quickDosseret)[A-Z][A-Za-z0-9]*"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND408_COPY.en[key as keyof typeof ROUND408_COPY.en], "string", key);
  console.log("crmv4 round408 tests passed");
}

main();
