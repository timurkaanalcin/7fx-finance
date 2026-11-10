/**
 * Visit passes and broker plates.
 * Run: TZ=UTC npx tsx tests/crmv4-round195.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND195_COPY } from "../src/lib/crmv4/copy-round195";
import {
  activeMinute,
  activeRank,
  activeSpan,
  addPass,
  addPassTag,
  addPassView,
  brokerToken,
  bulkPassManner,
  busiestHost,
  catalogPlate,
  catalogPlateCount,
  clashMinuteCount,
  cyclePhase,
  densityOf,
  editPass,
  editPassNote,
  fairHost,
  houseWing,
  latePass,
  minuteGap,
  minuteOf,
  moveFocus,
  nextPass,
  passLine,
  passesCsv,
  peakMinute,
  plateBand,
  plateCopy,
  plateRowsCsv,
  plateState,
  plateTone,
  platesCsv,
  quietMinute,
  rankClashCount,
  rankOf,
  readPasses,
  reminderPasses,
  setPassPause,
  sharedPlateCount,
  softPlateCount,
  soonPass,
  sortPasses,
  spanOf,
  suggestHost,
  suggestManner,
  suggestSpan,
  usedMinutes,
  visiblePasses,
  visiblePlateCustomers,
  widePlateCount,
  wingOf,
} from "../src/lib/crmv4/round195";

function main() {
  assert.equal(wingOf("  pa "), "PA");
  assert.equal(wingOf("rm"), "RM");
  assert.equal(wingOf("lx"), "LX");
  assert.equal(wingOf("   "), "");
  assert.equal(wingOf("P"), "");
  assert.equal(wingOf("PAR"), "");
  assert.equal(minuteOf("0"), 0);
  assert.equal(minuteOf(0), 0);
  assert.equal(minuteOf("59"), 59);
  assert.equal(minuteOf("15"), 15);
  assert.equal(minuteOf("00"), null);
  assert.equal(minuteOf("08"), null);
  assert.equal(minuteOf("60"), null);
  assert.equal(minuteOf(""), null);
  assert.equal(rankOf("2"), 2);
  assert.equal(rankOf(4), 4);
  assert.equal(rankOf("8"), 8);
  assert.equal(rankOf("0"), null);
  assert.equal(rankOf("1"), null);
  assert.equal(rankOf("02"), null);
  assert.equal(spanOf("15"), 15);
  assert.equal(spanOf(30), 30);
  assert.equal(spanOf("0"), null);
  assert.equal(spanOf("015"), null);
  assert.equal(spanOf("20"), null);
  assert.equal(peakMinute(15), true);
  assert.equal(peakMinute(45), true);
  assert.equal(peakMinute(2), false);
  assert.equal(quietMinute(2), true);
  assert.equal(quietMinute(4), true);
  assert.equal(quietMinute(15), false);
  assert.equal(quietMinute(45), false);
  assert.equal(minuteGap(50, 0), 10);
  assert.equal(minuteGap(0, 50), -10);
  assert.equal(minuteGap(0, 20), 20);
  assert.equal(minuteGap(20, 0), -20);
  assert.equal(minuteGap(10, 40), 30);
  assert.equal(minuteGap(40, 10), -30);
  assert.equal(minuteGap(null, 2), null);
  assert.equal(minuteGap(2, ""), null);
  assert.equal(minuteGap(2, 60), null);
  assert.equal(activeMinute("peak"), "peak");
  assert.equal(activeMinute("99"), "all");
  assert.equal(activeRank("4"), "4");
  assert.equal(activeRank("1"), "all");
  assert.equal(activeSpan("blank"), "blank");
  assert.equal(activeSpan("20"), "all");
  assert.equal(densityOf("tight"), "tight");
  assert.equal(densityOf("nope"), "roomy");
  assert.equal(moveFocus(0, 3, 1), 1);
  assert.equal(moveFocus(0, 3, -1), 2);
  assert.equal(moveFocus(2, 3, 1), 0);
  assert.equal(moveFocus(1, 0, 1), 0);

  const saved = addPass([], { id: "a", title: "Ada pass", note: "oak leaf", host: "Nia", minute: "6", manner: "quiet", wing: "pa", phase: "wait", rank: "8", span: "15", tags: "oak, vip", pause: "0" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].minute, 6);
  assert.equal(saved[0].rank, 8);
  assert.equal(saved[0].span, 15);
  assert.equal(saved[0].wing, "PA");
  assert.equal(saved[0].note, "oak leaf");
  assert.deepEqual(saved[0].tags, ["oak", "vip"]);
  assert.equal(saved[0].audit, "save");
  assert.equal(houseWing(saved[0].wing), true);
  assert.equal(houseWing("IST"), false);
  assert.equal(soonPass(saved[0]), true);
  assert.equal(latePass(saved[0], "20"), true);
  assert.equal(latePass(saved[0], "10"), false);
  assert.equal(addPass(saved, { id: "b", title: "Ada pass" }).length, 1);
  assert.equal(addPass(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(addPass(saved, { id: "c", title: "   " }).length, 1);
  const capped = Array.from({ length: 10 }, (_, index) => ({ id: `n${index}`, title: `Line ${index}` })).reduce((passes, pass) => addPass(passes, pass), [] as ReturnType<typeof addPass>);
  assert.equal(capped.length, 6);
  assert.equal(capped.some((pass) => pass.title === "Line 0"), false);
  assert.equal(capped[0].title, "Line 9");

  const cycled = cyclePhase(saved, "a");
  assert.equal(cycled[0].phase, "seat");
  assert.equal(cycled[0].audit, "phase");
  assert.equal(cyclePhase(cycled, "a")[0].phase, "leave");
  assert.equal(cyclePhase(cyclePhase(cycled, "a"), "a")[0].phase, "wait");
  const blankPhase = addPass([], { id: "z", title: "Blank phase" });
  assert.equal(cyclePhase(blankPhase, "z")[0].phase, "wait");

  const edited = editPass(saved, "a", "Bea pass");
  assert.equal(edited[0].title, "Bea pass");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editPass(saved, "a", "   ")[0].title, "Ada pass");
  const noted = editPassNote(saved, "a", "fresh leaf");
  assert.equal(noted[0].note, "fresh leaf");
  assert.equal(editPassNote(saved, "a", "   ")[0].note, "oak leaf");
  const oneTag = addPass([], { id: "t", title: "Tag pass", tags: "oak" });
  const tagged = addPassTag(oneTag, "t", "gold");
  assert.deepEqual(tagged[0].tags, ["oak", "gold"]);
  assert.equal(tagged[0].audit, "tag");
  assert.equal(addPassTag(saved, "a", "gold")[0].tags.length, 2);
  assert.equal(addPassTag(tagged, "t", "extra")[0].tags.length, 2);

  const paused = setPassPause(saved, "a", 15);
  assert.equal(paused[0].pause, 15);
  assert.equal(paused[0].audit, "pause");
  assert.equal(soonPass(paused[0]), false);
  assert.equal(latePass(paused[0], "20"), false);
  assert.equal(setPassPause(saved, "a", 45)[0].pause, 0);

  const moved = bulkPassManner(saved, ["a"], "formal");
  assert.equal(moved[0].manner, "formal");
  assert.equal(moved[0].audit, "manner");
  assert.equal(bulkPassManner(saved, ["a"], "satin")[0].manner, "quiet");

  const second = addPass(saved, { id: "b", title: "Bea pass", host: "Ada", minute: "12", manner: "quiet", wing: "rm", phase: "seat", rank: "8", span: "30", tags: "oak" });
  assert.equal(usedMinutes(second), 2);
  assert.equal(suggestManner([]), "open");
  assert.equal(suggestSpan([]), 30);
  assert.equal(suggestHost([]), "");
  assert.equal(fairHost(second, "Bea, Ada"), "Bea");
  assert.equal(busiestHost(second), "Ada");
  assert.equal(nextPass(second, ""), "");
  assert.equal(nextPass(second, "10"), "b");
  const finished = cyclePhase(second, "b");
  assert.equal(finished.find((pass) => pass.id === "b")?.phase, "leave");
  assert.equal(nextPass(finished, "10"), "a");
  const resting = setPassPause(second, "b", 30);
  assert.equal(nextPass(resting, "10"), "a");
  const shown = visiblePasses(second, "open", "bea", null, null, null, null, null, null, null, null, false, false, false, false, false);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].id, "b");
  const taggedSearch = visiblePasses(second, "open", "oak", null, null, null, null, null, null, null, null, false, false, false, false, false);
  assert.equal(taggedSearch.length, 2);
  const house = visiblePasses(second, "open", "", null, null, null, null, null, null, null, null, false, false, true, false, false);
  assert.equal(house.length, 2);
  assert.equal(clashMinuteCount(second), 0);
  const twin = addPass(second, { id: "c", title: "Cara pass", host: "Bea", minute: "6", manner: "quiet", wing: "lx", phase: "wait", rank: "2", span: "45" });
  assert.equal(clashMinuteCount(twin), 2);
  const split = addPass(saved, { id: "b", title: "Warm pass", host: "Ada", minute: "6", manner: "bright", wing: "lx", phase: "wait", rank: "2", span: "45" });
  assert.equal(clashMinuteCount(split), 0);
  assert.equal(rankClashCount(second), 2);
  assert.equal(readPasses([{ id: "q", title: "Kept", minute: "08" }])[0].minute, null);
  assert.equal(reminderPasses(second, "20").some((pass) => pass.id === "a"), true);
  assert.equal(reminderPasses(paused, "20").length, 0);
  assert.equal(sortPasses(second, "title")[0].title, "Ada pass");
  assert.equal(passLine("  Ada pass  "), "Ada pass");

  const mixed = addPass(
    addPass(
      addPass(
        addPass(addPass([], { id: "o1", title: "Open one", manner: "open" }), { id: "o2", title: "Open two", manner: "open" }),
        { id: "q1", title: "Quiet one", manner: "quiet" },
      ),
      { id: "b1", title: "Bright one", manner: "bright" },
    ),
    { id: "f1", title: "Formal one", manner: "formal" },
  );
  assert.equal(suggestManner(mixed), "quiet");

  const view = addPassView([], {
    id: "v1",
    name: "House peak",
    tray: "open",
    query: "ada",
    host: "all",
    manner: "quiet",
    wing: "pa",
    phase: "wait",
    minute: "peak",
    rank: "8",
    span: "15",
  });
  assert.equal(view.length, 1);
  assert.equal(view[0].minute, "peak");
  assert.equal(addPassView(view, { ...view[0], id: "v2", name: "House peak" }).length, 1);

  const csv = passesCsv(second, "20");
  assert.equal(csv.startsWith("title,host,minute,manner,wing,phase,rank,span,tags,pause,pinned,held,closed,gap,late,soon,house,note,audit"), true);
  assert.equal(csv.includes("Ada pass"), true);
  assert.equal(csv.includes("amount"), false);

  const rows = [
    { id: "1", label: "Ada", note: { brokerName: "ACM" } },
    { id: "2", label: "Bea", note: { brokerName: "IBKR" } },
    { id: "3", label: "Gus", note: { brokerName: "SAXO" } },
    { id: "4", label: "Noa", note: { brokerName: "GOLD" } },
    { id: "5", label: "Paris", note: { brokerName: "GOLDMN" } },
    { id: "6", label: "Empty", note: { brokerName: "" } },
    { id: "7", label: "Missing", note: {} },
    { id: "8", label: "Blocked", note: { brokerName: "ACM", balance: 1 } },
  ];
  assert.equal(brokerToken("IB KR"), "IBKR");
  assert.equal(brokerToken("SA-XO"), "SAXO");
  assert.equal(plateCopy(rows[0].note), "ACM");
  assert.equal(plateState(rows[0].note), "set");
  assert.equal(plateBand(rows[0].note), "trio");
  assert.equal(plateBand(rows[1].note), "quad");
  assert.equal(plateBand(rows[4].note), "span");
  assert.equal(plateTone(rows[0].note), "hard");
  assert.equal(plateTone(rows[2].note), "soft");
  assert.equal(plateState({ brokerName: "Paris" }), "");
  assert.equal(plateState(rows[5].note), "clear");
  assert.equal(plateState(rows[6].note), "");
  assert.equal(plateState(rows[7].note), "");
  assert.equal(plateState("ACM"), "set");
  assert.equal(catalogPlate(rows[0].note), true);
  assert.equal(catalogPlate(rows[4].note), false);
  assert.equal(catalogPlateCount(rows), 3);
  assert.equal(widePlateCount(rows), 1);
  assert.equal(softPlateCount(rows), 1);
  assert.equal(sharedPlateCount(rows), 0);
  assert.equal(visiblePlateCustomers(rows, "trio", null, "", "all", [], "all").length, 1);
  assert.equal(visiblePlateCustomers(rows, null, null, "par", "all", [], "all").length, 1);
  const bands = platesCsv(rows);
  assert.equal(bands.startsWith("kind,mark,count"), true);
  assert.equal(bands.includes("amount"), false);
  assert.equal(bands.includes("catalog"), true);
  const queue = plateRowsCsv(rows, ["1"]);
  assert.equal(queue.includes("Ada"), true);
  assert.equal(queue.split("\n")[1].endsWith(",1"), true);

  assert.equal(crmv4Text("en", "vpsTitle"), ROUND195_COPY.en.vpsTitle);
  assert.equal(crmv4Text("tr", "bplTitle"), ROUND195_COPY.tr.bplTitle);
  assert.equal(crmv4Text("de", "vpsSearch"), ROUND195_COPY.de.vpsSearch);
  assert.equal(crmv4Text("ru", "bplHint"), ROUND195_COPY.ru.bplHint);
  assert.equal(crmv4Text("ar", "vpsNotice"), ROUND195_COPY.ar.vpsNotice);
  assert.notEqual(ROUND195_COPY.tr.vpsTitle, ROUND195_COPY.en.vpsTitle);
  assert.notEqual(ROUND195_COPY.de.bplTitle, ROUND195_COPY.en.bplTitle);
  assert.notEqual(ROUND195_COPY.ru.vpsSearch, ROUND195_COPY.en.vpsSearch);
  assert.notEqual(ROUND195_COPY.ar.bplSearch, ROUND195_COPY.en.bplSearch);
  const keys = Object.keys(ROUND195_COPY.en);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND195_COPY[locale]), keys);
  }

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-vps/);
  assert.match(css, /\.c4-bpl/);
  assert.match(css, /\.c4-risk-salon/);
  assert.match(css, /\.c4-dayline-salon/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round195.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.equal(viewFile.includes("saleStatus"), false);
  assert.equal(viewFile.includes("retentionStatus"), false);
  assert.equal(viewFile.includes("potentialStatus"), false);
  assert.equal(viewFile.includes("documentsStatus"), false);
  assert.equal(viewFile.includes("accountType"), false);
  assert.equal(viewFile.includes("validationStatus"), false);
  assert.equal(viewFile.includes("registrationDate"), false);
  assert.equal(viewFile.includes("birthDate"), false);
  assert.equal(viewFile.includes("lastContactAt"), false);
  assert.equal(viewFile.includes("assigneeId"), false);
  assert.match(viewFile, /brokerName/);
  assert.match(viewFile, /passesCsv/);
  assert.match(viewFile, /platesCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-visits/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-catalog/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestManner/);
  const risk = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round47.tsx"), "utf8");
  assert.match(risk, /c4-risk-salon/);
  assert.match(risk, /data-logo="mono"/);
  assert.match(risk, /c4-risk-salon-mast/);
  assert.match(risk, /c4-risk-salon-list/);
  assert.match(risk, /aria-required=\{false\}/);
  assert.match(risk, /c4-dayline-salon/);
  assert.match(risk, /c4-dayline-salon-mast/);
  assert.match(risk, /c4-dayline-salon-day/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "vpass"/);
  assert.match(app, /view === "bplt"/);
  assert.match(app, /VisitPasses/);
  assert.match(app, /BrokerPlates/);
  console.log("crmv4 round195 tests passed");
}

main();
