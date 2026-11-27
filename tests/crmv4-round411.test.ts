/**
 * Peristasis courses, pendentive validation plates, the ivory commission pelta, and the graphite import clipeus.
 * Run: TZ=UTC npx tsx tests/crmv4-round411.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND411_COPY } from "../src/lib/crmv4/copy-round411";
import { ROUND410_FEATURES } from "../src/lib/crmv4/round410";
import {
  ROUND411_FEATURES,
  activeBed,
  activeDepth,
  activeHour,
  activeProfile,
  addPeristasis,
  addPeristasisView,
  briskPeristasis,
  depthCount,
  dropPeristasisView,
  fairHand,
  fullDepth,
  idlePeristasis,
  graphiteQuiet,
  latePeristasis,
  leadingPendentive,
  leadingPendentiveHue,
  midDepth,
  movePeristasisFocus,
  overduePeristasis,
  pendentiveBlank,
  pendentiveCopy,
  pendentiveDark,
  pendentiveDigit,
  pendentiveDim,
  pendentiveEven,
  pendentiveFade,
  pendentiveFar,
  pendentiveHue,
  pendentiveLanesCsv,
  pendentiveLength,
  pendentiveLetter,
  pendentiveLit,
  pendentiveNear,
  pendentiveOpen,
  pendentiveRowsCsv,
  pendentiveSlice,
  pendentiveUpper,
  profileBand,
  profileCool,
  profileGap,
  profilePoint,
  profileWarm,
  readPeristasisViews,
  reminderPeristasisList,
  restingPeristasis,
  peristasisBed,
  peristasisHour,
  peristasisTimeline,
  suggestProfile,
  suggestPeristasisBed,
  suggestPeristasisHour,
  type Peristasis,
  type PendentiveRow,
} from "../src/lib/crmv4/round411";

function course(partial: Partial<Peristasis> & { id: string; title: string }): Peristasis {
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
  assert.equal(ROUND411_FEATURES.length, 25);
  assert.equal(new Set(ROUND411_FEATURES).size, 25);
  for (const feature of ROUND411_FEATURES) assert.equal((ROUND410_FEATURES as readonly string[]).includes(feature), false, feature);
  const libDir = path.join(__dirname, "../src/lib/crmv4");
  for (const feature of ROUND411_FEATURES) {
    const needle = `"${feature}"`;
    for (const file of fs.readdirSync(libDir)) {
      if (!file.endsWith(".ts") || file === "round411.ts") continue;
      const body = fs.readFileSync(path.join(libDir, file), "utf8");
      assert.equal(body.includes(needle), false, `${feature} in ${file}`);
    }
  }

  assert.equal(profilePoint(" peristasis "), "peristasis");
  assert.equal(profilePoint("jasper"), "");
  assert.equal(peristasisHour("2"), 2);
  assert.equal(peristasisHour(7), 7);
  assert.equal(peristasisHour(11), 11);
  assert.equal(peristasisHour(18), 18);
  assert.equal(peristasisHour("1"), null);
  assert.equal(peristasisHour("4"), null);
  assert.equal(depthCount("4"), 4);
  assert.equal(depthCount(7), 7);
  assert.equal(depthCount("11"), 11);
  assert.equal(depthCount("1"), null);
  assert.equal(depthCount("3"), null);
  assert.equal(peristasisBed("ivory"), "IVORY");
  assert.equal(peristasisBed("graphite"), "GRAPHITE");
  assert.equal(peristasisBed("gilt"), "GILT");
  assert.equal(peristasisBed("gold"), "");
  assert.equal(profileWarm("peristasis"), true);
  assert.equal(profileWarm("SURBASE"), true);
  assert.equal(profileWarm("femur"), false);
  assert.equal(profileCool("femur"), true);
  assert.equal(profileCool("mascaron"), true);
  assert.equal(profileCool("peristasis"), false);
  assert.equal(profileBand("peristasis"), "first");
  assert.equal(profileBand("surbase"), "second");
  assert.equal(profileBand("femur"), "third");
  assert.equal(profileBand("mascaron"), "fourth");
  assert.equal(profileGap("peristasis", "mascaron"), 3);
  assert.equal(profileGap("mascaron", "peristasis"), -3);
  assert.equal(profileGap("jasper", "peristasis"), null);
  assert.equal(graphiteQuiet("graphite"), true);
  assert.equal(graphiteQuiet("IVORY"), false);
  assert.equal(midDepth(7), true);
  assert.equal(midDepth(4), false);
  assert.equal(fullDepth(11), true);
  assert.equal(fullDepth(7), false);
  assert.equal(activeProfile("warm"), "warm");
  assert.equal(activeProfile("cool"), "cool");
  assert.equal(activeProfile("mascaron"), "mascaron");
  assert.equal(activeProfile("nope"), "all");
  assert.equal(activeHour("11"), "11");
  assert.equal(activeHour("3"), "all");
  assert.equal(activeDepth("11"), "11");
  assert.equal(activeDepth("1"), "all");
  assert.equal(activeBed("ivory", ["IVORY", "GRAPHITE"]), "IVORY");
  assert.equal(activeBed("gilt", ["IVORY"]), "all");
  assert.equal(movePeristasisFocus(0, 4, -1), 3);
  assert.equal(suggestProfile(1), "peristasis");
  assert.equal(suggestProfile(2), "surbase");
  assert.equal(suggestProfile(7), "femur");
  assert.equal(suggestProfile(11), "mascaron");
  assert.equal(suggestPeristasisHour([], 1), 2);
  assert.equal(suggestPeristasisHour([], 2), 7);
  assert.equal(suggestPeristasisHour([], 7), 11);
  assert.equal(suggestPeristasisHour([], 11), 18);
  const saved = [
    course({ id: "a", title: "Ada", hour: 18 }),
    course({ id: "b", title: "Bea", hour: 7 }),
    course({ id: "c", title: "Cid", hour: 11 }),
  ];
  assert.equal(suggestPeristasisHour(saved, 18), 2);
  assert.equal(suggestPeristasisBed([course({ id: "g", title: "Gilt", bed: "GILT" })]), "GRAPHITE");
  assert.equal(fairHand([course({ id: "h", title: "Held", hand: "Nia" })], "Nia, Omar"), "Omar");

  const late = course({ id: "l", title: "Late", profile: "peristasis" });
  const overdue = course({ id: "o", title: "Over", profile: "mascaron", depth: 4 });
  const idle = course({ id: "i", title: "Idle", hour: 2, depth: 4, bed: "" });
  const brisk = course({ id: "b2", title: "Brisk", bed: "GRAPHITE", hour: 18, depth: 11 });
  const resting = course({ id: "r", title: "Rest", profile: "femur", bed: "IVORY", hour: 7 });
  assert.equal(latePeristasis(late, "mascaron"), true);
  assert.equal(latePeristasis(late, "peristasis"), false);
  assert.equal(overduePeristasis(overdue), true);
  assert.equal(overduePeristasis({ ...overdue, raised: true }), false);
  assert.equal(idlePeristasis(idle), true);
  assert.equal(briskPeristasis(brisk), true);
  assert.equal(restingPeristasis(resting), true);
  assert.deepEqual(reminderPeristasisList([overdue, late]), ["Over"]);
  const added = addPeristasis([], { title: "New course", profile: "surbase", hour: 7, depth: 7, bed: "ivory", tags: "a r z" });
  assert.equal(added.length, 1);
  assert.equal(added[0].profile, "surbase");
  assert.equal(added[0].hour, 7);
  assert.equal(added[0].depth, 7);
  assert.equal(added[0].bed, "IVORY");
  assert.deepEqual(added[0].tags, ["a", "r"]);
  assert.equal(addPeristasis(added, { title: "New course" }).length, 1);
  const view = { id: "v", name: "Warm", rack: "base" as const, query: "", hand: "", bed: "", profile: "warm", hour: "", depth: "" };
  assert.equal(addPeristasisView([], view).length, 1);
  assert.equal(dropPeristasisView(addPeristasisView([], view), "v").length, 0);
  assert.equal(readPeristasisViews([{ ...view, name: "" }]).length, 0);
  const line = peristasisTimeline([course({ id: "t", title: "Tide", hour: 7 })]);
  assert.equal(line[0].hour, 7);
  assert.deepEqual(line[0].titles, ["Tide"]);

  assert.equal(pendentiveLit("VERIFIED"), true);
  assert.equal(pendentiveLit(true), true);
  assert.equal(pendentiveLit(false), false);
  assert.equal(pendentiveLit("VAL-AB"), false);
  assert.equal(pendentiveLit("VAL-ABCDEFGH"), false);
  assert.equal(pendentiveNear("HOT"), true);
  assert.equal(pendentiveNear("VAL-AB"), true);
  assert.equal(pendentiveNear("AB"), false);
  assert.equal(pendentiveFar("A"), true);
  assert.equal(pendentiveFar("AB"), true);
  assert.equal(pendentiveFar("ABCD"), false);
  assert.equal(pendentiveFade("A".repeat(18)), true);
  assert.equal(pendentiveFade("VAL-ABCDEFGH"), true);
  assert.equal(pendentiveFade("A".repeat(8)), false);
  assert.equal(pendentiveDim("WAIT"), true);
  assert.equal(pendentiveDim("PENDING"), true);
  assert.equal(pendentiveDark("OFF"), true);
  assert.equal(pendentiveDark(false), true);
  assert.equal(pendentiveDark("REJECTED"), true);
  assert.equal(pendentiveBlank("UNVERIFIED"), true);
  assert.equal(pendentiveBlank("NONE"), true);
  assert.equal(pendentiveOpen(""), true);
  assert.equal(pendentiveHue("VERIFIED"), "gilt");
  assert.equal(pendentiveHue("OFF"), "ash");
  assert.equal(pendentiveHue("WAIT"), "pearl");
  assert.equal(pendentiveLength("ABCD"), 4);
  assert.equal(pendentiveEven("AB"), true);
  assert.equal(pendentiveDigit("12night"), true);
  assert.equal(pendentiveLetter("READY"), true);
  assert.equal(pendentiveUpper("ISTANBUL"), true);
  assert.equal(pendentiveUpper("VIP"), false);
  assert.equal(pendentiveLit("ABCDEFGH"), false);
  assert.equal(pendentiveDim("ABCDEFGH"), true);
  assert.equal(pendentiveCopy("READY"), "READY");
  assert.equal(pendentiveLit({ balance: 1 }), false);
  assert.equal(pendentiveLit({ validationStatus: "VERIFIED" }), true);
  assert.equal(pendentiveLit(pendentiveSlice({ validationStatus: true, balance: 9 })), true);
  const rows: PendentiveRow[] = [
    { id: "1", label: "Ada", code: "VERIFIED" },
    { id: "2", label: "Bea", code: "PENDING" },
  ];
  assert.equal(leadingPendentive(rows), "live");
  assert.equal(leadingPendentiveHue(rows), "gilt");
  assert.match(pendentiveLanesCsv(rows), /live,1/);
  assert.match(pendentiveRowsCsv(rows, ["1"]), /Ada,VERIFIED/);
  assert.match(pendentiveRowsCsv(rows, ["1"]), /,1$/m);
  assert.match(pendentiveRowsCsv(rows, ["1"]), /^name,validation,lane,hue,reviewed/m);

  assert.equal(crmv4Text("en", "psiTitle"), ROUND411_COPY.en.psiTitle);
  assert.equal(crmv4Text("tr", "pdnTitle"), ROUND411_COPY.tr.pdnTitle);
  assert.equal(crmv4Text("de", "psiHint"), ROUND411_COPY.de.psiHint);
  assert.equal(crmv4Text("ru", "comPeltaKicker"), ROUND411_COPY.ru.comPeltaKicker);
  assert.equal(crmv4Text("ar", "impClipeusLead"), ROUND411_COPY.ar.impClipeusLead);
  const keys = Object.keys(ROUND411_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND411_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-peristasis/);
  assert.match(css, /\.c4-pendentive/);
  assert.match(css, /\.c4-peristasis-column/);
  assert.match(css, /\.c4-pendentive-column/);
  assert.match(css, /\.c4-commission-pelta/);
  assert.match(css, /\.c4-import-clipeus/);
  assert.match(css, /\.c4-commission-pelta-mast/);
  assert.match(css, /\.c4-import-clipeus-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round411.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.equal(viewFile.includes("totpSecret"), false);
  assert.match(viewFile, /pendentiveSlice/);
  assert.match(viewFile, /peristasisCsv/);
  assert.match(viewFile, /pendentiveRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-peristasis/);
  assert.match(viewFile, /data-pendentive/);
  assert.match(viewFile, /data-validation/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestPeristasisBed/);
  assert.match(viewFile, /c4-pendentive-search/);
  assert.match(viewFile, /peristasisTimeline/);
  assert.match(viewFile, /c4-peristasis-notices/);
  assert.match(viewFile, /from "@\/lib\/crmv4\/round411"/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "prs"/);
  assert.match(app, /view === "pdv"/);
  const source = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round7.tsx"), "utf8");
  assert.match(source, /c4-commission-pelta/);
  assert.match(source, /c4-commission-pelta-mast/);
  assert.match(source, /data-logo="mono"/);
  assert.match(source, /comPeltaKicker/);
  assert.match(source, /comPeltaLead/);
  assert.match(source, /data-commission-pelta/);
  assert.match(source, /c4-import-clipeus/);
  assert.match(source, /c4-import-clipeus-mast/);
  assert.match(source, /impClipeusKicker/);
  assert.match(source, /impClipeusLead/);
  assert.match(source, /data-import-clipeus/);
  const namedKeys = `${viewFile}\n${source}`.match(/"(psi|pdn|comPelta|impClipeus)[A-Z][A-Za-z0-9]*"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND411_COPY.en[key as keyof typeof ROUND411_COPY.en], "string", key);
  console.log("crmv4 round411 tests passed");
}

main();
