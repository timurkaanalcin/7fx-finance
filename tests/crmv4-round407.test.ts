/**
 * Intrados courses, extrados desk plates, the ivory rate rail, and the graphite statement folio.
 * Run: TZ=UTC npx tsx tests/crmv4-round407.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND407_COPY } from "../src/lib/crmv4/copy-round407";
import { ROUND406_FEATURES } from "../src/lib/crmv4/round406";
import {
  ROUND407_FEATURES,
  activeBed,
  activeDepth,
  activeHour,
  activeProfile,
  addIntrados,
  addIntradosView,
  briskIntrados,
  depthCount,
  dropIntradosView,
  fairHand,
  fullDepth,
  idleIntrados,
  graphiteQuiet,
  lateIntrados,
  leadingExtrados,
  leadingExtradosHue,
  midDepth,
  moveIntradosFocus,
  overdueIntrados,
  extradosBlank,
  extradosCopy,
  extradosDark,
  extradosDigit,
  extradosDim,
  extradosEven,
  extradosFade,
  extradosFar,
  extradosHue,
  extradosLanesCsv,
  extradosLength,
  extradosLetter,
  extradosLit,
  extradosNear,
  extradosOpen,
  extradosRowsCsv,
  extradosSlice,
  extradosUpper,
  profileBand,
  profileCool,
  profileGap,
  profilePoint,
  profileWarm,
  readIntradosViews,
  reminderIntradosList,
  restingIntrados,
  intradosBed,
  intradosHour,
  intradosTimeline,
  suggestProfile,
  suggestIntradosBed,
  suggestIntradosHour,
  type Intrados,
  type ExtradosRow,
} from "../src/lib/crmv4/round407";

function course(partial: Partial<Intrados> & { id: string; title: string }): Intrados {
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
  assert.equal(ROUND407_FEATURES.length, 25);
  assert.equal(new Set(ROUND407_FEATURES).size, 25);
  for (const feature of ROUND407_FEATURES) assert.equal((ROUND406_FEATURES as readonly string[]).includes(feature), false, feature);
  const libDir = path.join(__dirname, "../src/lib/crmv4");
  for (const feature of ROUND407_FEATURES) {
    const needle = `"${feature}"`;
    for (const file of fs.readdirSync(libDir)) {
      if (!file.endsWith(".ts") || file === "round407.ts") continue;
      const body = fs.readFileSync(path.join(libDir, file), "utf8");
      assert.equal(body.includes(needle), false, `${feature} in ${file}`);
    }
  }

  assert.equal(profilePoint(" intrados "), "intrados");
  assert.equal(profilePoint("jasper"), "");
  assert.equal(intradosHour("1"), 1);
  assert.equal(intradosHour(3), 3);
  assert.equal(intradosHour(6), 6);
  assert.equal(intradosHour(12), 12);
  assert.equal(intradosHour("2"), null);
  assert.equal(intradosHour("4"), null);
  assert.equal(depthCount("1"), 1);
  assert.equal(depthCount(3), 3);
  assert.equal(depthCount("5"), 5);
  assert.equal(depthCount("2"), null);
  assert.equal(depthCount("4"), null);
  assert.equal(intradosBed("ivory"), "IVORY");
  assert.equal(intradosBed("graphite"), "GRAPHITE");
  assert.equal(intradosBed("gilt"), "GILT");
  assert.equal(intradosBed("gold"), "");
  assert.equal(profileWarm("intrados"), true);
  assert.equal(profileWarm("SOFFIT"), true);
  assert.equal(profileWarm("haunch"), false);
  assert.equal(profileCool("haunch"), true);
  assert.equal(profileCool("springer"), true);
  assert.equal(profileCool("intrados"), false);
  assert.equal(profileBand("intrados"), "first");
  assert.equal(profileBand("soffit"), "second");
  assert.equal(profileBand("haunch"), "third");
  assert.equal(profileBand("springer"), "fourth");
  assert.equal(profileGap("intrados", "springer"), 3);
  assert.equal(profileGap("springer", "intrados"), -3);
  assert.equal(profileGap("jasper", "intrados"), null);
  assert.equal(graphiteQuiet("graphite"), true);
  assert.equal(graphiteQuiet("IVORY"), false);
  assert.equal(midDepth(3), true);
  assert.equal(midDepth(1), false);
  assert.equal(fullDepth(5), true);
  assert.equal(fullDepth(3), false);
  assert.equal(activeProfile("warm"), "warm");
  assert.equal(activeProfile("cool"), "cool");
  assert.equal(activeProfile("springer"), "springer");
  assert.equal(activeProfile("nope"), "all");
  assert.equal(activeHour("12"), "12");
  assert.equal(activeHour("2"), "all");
  assert.equal(activeDepth("5"), "5");
  assert.equal(activeDepth("2"), "all");
  assert.equal(activeBed("ivory", ["IVORY", "GRAPHITE"]), "IVORY");
  assert.equal(activeBed("gilt", ["IVORY"]), "all");
  assert.equal(moveIntradosFocus(0, 4, -1), 3);
  assert.equal(suggestProfile(1), "intrados");
  assert.equal(suggestProfile(4), "soffit");
  assert.equal(suggestProfile(8), "haunch");
  assert.equal(suggestProfile(14), "springer");
  assert.equal(suggestIntradosHour([], 1), 1);
  assert.equal(suggestIntradosHour([], 4), 3);
  assert.equal(suggestIntradosHour([], 8), 6);
  assert.equal(suggestIntradosHour([], 14), 12);
  const saved = [
    course({ id: "a", title: "Ada", hour: 12 }),
    course({ id: "b", title: "Bea", hour: 3 }),
    course({ id: "c", title: "Cid", hour: 6 }),
  ];
  assert.equal(suggestIntradosHour(saved, 20), 1);
  assert.equal(suggestIntradosBed([course({ id: "g", title: "Gilt", bed: "GILT" })]), "GRAPHITE");
  assert.equal(fairHand([course({ id: "h", title: "Held", hand: "Nia" })], "Nia, Omar"), "Omar");

  const late = course({ id: "l", title: "Late", profile: "intrados" });
  const overdue = course({ id: "o", title: "Over", profile: "springer", depth: 1 });
  const idle = course({ id: "i", title: "Idle", hour: 1, depth: 1, bed: "" });
  const brisk = course({ id: "b2", title: "Brisk", bed: "GRAPHITE", hour: 12, depth: 5 });
  const resting = course({ id: "r", title: "Rest", profile: "haunch", bed: "IVORY", hour: 3 });
  assert.equal(lateIntrados(late, "springer"), true);
  assert.equal(lateIntrados(late, "intrados"), false);
  assert.equal(overdueIntrados(overdue), true);
  assert.equal(overdueIntrados({ ...overdue, raised: true }), false);
  assert.equal(idleIntrados(idle), true);
  assert.equal(briskIntrados(brisk), true);
  assert.equal(restingIntrados(resting), true);
  assert.deepEqual(reminderIntradosList([overdue, late]), ["Over"]);
  const added = addIntrados([], { title: "New course", profile: "soffit", hour: 3, depth: 3, bed: "ivory", tags: "i x z" });
  assert.equal(added.length, 1);
  assert.equal(added[0].profile, "soffit");
  assert.equal(added[0].hour, 3);
  assert.equal(added[0].depth, 3);
  assert.equal(added[0].bed, "IVORY");
  assert.deepEqual(added[0].tags, ["i", "x"]);
  assert.equal(addIntrados(added, { title: "New course" }).length, 1);
  const view = { id: "v", name: "Warm", rack: "base" as const, query: "", hand: "", bed: "", profile: "warm", hour: "", depth: "" };
  assert.equal(addIntradosView([], view).length, 1);
  assert.equal(dropIntradosView(addIntradosView([], view), "v").length, 0);
  assert.equal(readIntradosViews([{ ...view, name: "" }]).length, 0);
  const line = intradosTimeline([course({ id: "t", title: "Tide", hour: 3 })]);
  assert.equal(line[0].hour, 3);
  assert.deepEqual(line[0].titles, ["Tide"]);

  assert.equal(extradosLit("DESK-HQ"), true);
  assert.equal(extradosLit(true), true);
  assert.equal(extradosLit(false), false);
  assert.equal(extradosLit("DESK-A"), true);
  assert.equal(extradosLit("DESK-IST-A"), false);
  assert.equal(extradosLit("OPEN"), false);
  assert.equal(extradosNear("ABC"), true);
  assert.equal(extradosNear("DESK-EU-1"), true);
  assert.equal(extradosNear("ABCD"), false);
  assert.equal(extradosFar("A"), true);
  assert.equal(extradosFar("AB"), false);
  assert.equal(extradosFade("A".repeat(14)), true);
  assert.equal(extradosFade("DESK-IST-A"), true);
  assert.equal(extradosFade("A".repeat(8)), false);
  assert.equal(extradosDim("HOLD"), true);
  assert.equal(extradosDim("WAIT"), true);
  assert.equal(extradosDark("CLOSED"), true);
  assert.equal(extradosDark(false), true);
  assert.equal(extradosBlank("NONE"), true);
  assert.equal(extradosOpen(""), true);
  assert.equal(extradosHue("DESK-HQ"), "gilt");
  assert.equal(extradosHue("CLOSED"), "ash");
  assert.equal(extradosHue("HOLD"), "pearl");
  assert.equal(extradosLength("ABCD"), 4);
  assert.equal(extradosEven("AB"), true);
  assert.equal(extradosDigit("12night"), true);
  assert.equal(extradosLetter("READY"), true);
  assert.equal(extradosUpper("ISTANBUL"), true);
  assert.equal(extradosUpper("OPEN"), false);
  assert.equal(extradosLit("ABCDEFGH"), false);
  assert.equal(extradosDim("ABCDEFGH"), true);
  assert.equal(extradosCopy("READY"), "READY");
  assert.equal(extradosLit({ balance: 1 }), false);
  assert.equal(extradosLit({ deskId: "DESK-HQ" }), true);
  assert.equal(extradosLit(extradosSlice({ deskId: true, balance: 9 })), true);
  const rows: ExtradosRow[] = [
    { id: "1", label: "Ada", code: "DESK-HQ" },
    { id: "2", label: "Bea", code: "HOLD" },
  ];
  assert.equal(leadingExtrados(rows), "live");
  assert.equal(leadingExtradosHue(rows), "gilt");
  assert.match(extradosLanesCsv(rows), /live,1/);
  assert.match(extradosRowsCsv(rows, ["1"]), /Ada,DESK-HQ/);
  assert.match(extradosRowsCsv(rows, ["1"]), /,1$/m);
  assert.match(extradosRowsCsv(rows, ["1"]), /^name,mark,lane,hue,reviewed/m);

  assert.equal(crmv4Text("en", "itrTitle"), ROUND407_COPY.en.itrTitle);
  assert.equal(crmv4Text("tr", "exdTitle"), ROUND407_COPY.tr.exdTitle);
  assert.equal(crmv4Text("de", "itrHint"), ROUND407_COPY.de.itrHint);
  assert.equal(crmv4Text("ru", "fxArchKicker"), ROUND407_COPY.ru.fxArchKicker);
  assert.equal(crmv4Text("ar", "statementArchLead"), ROUND407_COPY.ar.statementArchLead);
  const keys = Object.keys(ROUND407_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND407_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-intrados/);
  assert.match(css, /\.c4-extrados/);
  assert.match(css, /\.c4-intrados-column/);
  assert.match(css, /\.c4-extrados-column/);
  assert.match(css, /\.c4-fx-arch/);
  assert.match(css, /\.c4-statement-arch/);
  assert.match(css, /\.c4-fx-arch-mast/);
  assert.match(css, /\.c4-statement-arch-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round407.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.equal(viewFile.includes("totpSecret"), false);
  assert.match(viewFile, /extradosSlice/);
  assert.match(viewFile, /intradosCsv/);
  assert.match(viewFile, /extradosRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-intrados/);
  assert.match(viewFile, /data-extrados/);
  assert.match(viewFile, /data-desk/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestIntradosBed/);
  assert.match(viewFile, /c4-extrados-search/);
  assert.match(viewFile, /intradosTimeline/);
  assert.match(viewFile, /c4-intrados-notices/);
  assert.match(viewFile, /from "@\/lib\/crmv4\/round407"/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "itr"/);
  assert.match(app, /view === "exd"/);
  const fx = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round22.tsx"), "utf8");
  const statement = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round21.tsx"), "utf8");
  assert.match(fx, /c4-fx-arch/);
  assert.match(fx, /c4-fx-arch-mast/);
  assert.match(fx, /data-logo="mono"/);
  assert.match(fx, /fxArchKicker/);
  assert.match(fx, /fxArchLead/);
  assert.match(fx, /data-fx-arch/);
  assert.match(statement, /c4-statement-arch/);
  assert.match(statement, /c4-statement-arch-mast/);
  assert.match(statement, /data-logo="mono"/);
  assert.match(statement, /statementArchKicker/);
  assert.match(statement, /statementArchLead/);
  assert.match(statement, /data-statement-arch/);
  const namedKeys = `${viewFile}\n${fx}\n${statement}`.match(/"(itr|exd|fxArch|statementArch)[A-Z][A-Za-z0-9]*"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND407_COPY.en[key as keyof typeof ROUND407_COPY.en], "string", key);
  console.log("crmv4 round407 tests passed");
}

main();
