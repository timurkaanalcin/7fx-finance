/**
 * SLA promises and calling codes.
 * Run: npx tsx tests/crmv4-round149.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND149_COPY } from "../src/lib/crmv4/copy-round149";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeAllowance,
  activeChannel,
  activeCode,
  activeDigit,
  activeOwner,
  activePace,
  activeRegion,
  activeTag,
  addPromise,
  addPromiseView,
  allowanceArg,
  allowanceBand,
  allowanceCounts,
  allowanceGap,
  allowanceHalf,
  allowanceOf,
  bulkPromiseClosed,
  bulkPromiseStarred,
  callingCsv,
  callingShare,
  channelArg,
  channelOf,
  codeArg,
  dialCode,
  dialDigit,
  dialRegion,
  digitArg,
  dropPromiseView,
  editPromise,
  elapsedOf,
  leadingCode,
  leadingRegion,
  namedCodes,
  namedDigits,
  namedRegions,
  nextPromise,
  ownerArg,
  ownerLabel,
  paceArg,
  paceOf,
  promiseChannels,
  promiseClashIds,
  promiseCopy,
  promiseCounts,
  promiseOwners,
  promisePaces,
  promiseShare,
  promiseTags,
  promiseText,
  promiseTimeline,
  promisesCsv,
  readHiddenCodes,
  readPromiseViews,
  readPromises,
  regionArg,
  resetPromises,
  setPromiseClosed,
  setPromiseStarred,
  setPromiseWaiting,
  stepPromisePace,
  tagArg,
  tagMark,
  toggleCode,
  visibleCallingCustomers,
  visibleCodes,
  visiblePromises,
} from "../src/lib/crmv4/round149";

function main() {
  assert.equal(promiseText("  Call\nAda  "), "Call Ada");
  assert.equal(promiseText("   "), "");
  assert.equal(promiseText("x".repeat(120)).length, 80);
  assert.equal(ownerLabel("  North  "), "North");
  assert.equal(ownerLabel("   "), "");
  assert.equal(ownerLabel("y".repeat(40)).length, 18);
  assert.equal(tagMark("  VIP  "), "VIP");
  assert.equal(tagMark("   "), "");
  assert.equal(tagMark("z".repeat(30)).length, 12);
  assert.equal(allowanceOf(" 15 "), 15);
  assert.equal(allowanceOf(15), 15);
  assert.equal(allowanceOf("30"), 30);
  assert.equal(allowanceOf(45), 45);
  assert.equal(allowanceOf("60"), 60);
  assert.equal(allowanceOf(90), 90);
  assert.equal(allowanceOf("120"), 120);
  assert.equal(allowanceOf(""), null);
  assert.equal(allowanceOf("0"), null);
  assert.equal(allowanceOf(0), null);
  assert.equal(allowanceOf("10"), null);
  assert.equal(allowanceOf(10), null);
  assert.equal(allowanceOf("015"), null);
  assert.equal(allowanceOf(180), null);
  assert.equal(elapsedOf(" 40 "), 40);
  assert.equal(elapsedOf(0), 0);
  assert.equal(elapsedOf("0"), 0);
  assert.equal(elapsedOf(180), 180);
  assert.equal(elapsedOf("180"), 180);
  assert.equal(elapsedOf(""), null);
  assert.equal(elapsedOf("040"), null);
  assert.equal(elapsedOf(181), null);
  assert.equal(elapsedOf(-1), null);
  assert.equal(elapsedOf(1.5), null);
  assert.equal(channelOf(" PHONE "), "phone");
  assert.equal(channelOf("mail"), "mail");
  assert.equal(channelOf("chat"), "chat");
  assert.equal(channelOf("visit"), "visit");
  assert.equal(channelOf(""), "blank");
  assert.equal(channelOf("fax"), "blank");
  assert.equal(paceOf(" CALM "), "calm");
  assert.equal(paceOf("due"), "due");
  assert.equal(paceOf("hot"), "hot");
  assert.equal(paceOf(""), "blank");
  assert.equal(paceOf("gold"), "blank");
  assert.equal(allowanceBand(null), "blank");
  assert.equal(allowanceBand(15), "short");
  assert.equal(allowanceBand(30), "short");
  assert.equal(allowanceBand(45), "mid");
  assert.equal(allowanceBand(60), "mid");
  assert.equal(allowanceBand(90), "long");
  assert.equal(allowanceBand(120), "long");
  assert.equal(allowanceHalf(null), "blank");
  assert.equal(allowanceHalf(15), "first");
  assert.equal(allowanceHalf(45), "first");
  assert.equal(allowanceHalf(60), "second");
  assert.equal(allowanceHalf(120), "second");
  assert.equal(allowanceGap(15, 40), 25);
  assert.equal(allowanceGap(120, 40), -80);
  assert.equal(allowanceGap(60, 60), 0);
  assert.equal(allowanceGap(null, 40), null);
  assert.equal(allowanceGap(15, ""), null);
  assert.equal(allowanceGap(15, 181), null);
  assert.deepEqual(readPromises([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Call Ada", owner: "  ", minutes: 10, channel: "fax", tag: "  ", pace: "gold", starred: 1, closed: 1, waiting: 1, audit: "nope" }, "nope"]), [
    { id: "2", text: "Call Ada", owner: "", minutes: null, channel: "", tag: "", pace: "", starred: false, closed: false, waiting: false, audit: "" },
  ]);
  assert.equal(readPromises([{ id: "z", text: "One", minutes: 15 }])[0].minutes, 15);
  assert.equal(readPromises([{ id: "z", text: "One", minutes: 0 }])[0].minutes, null);
  const saved = addPromise([], { id: "a", text: "Call Ada", owner: "Nia", minutes: 15, channel: "phone", tag: "VIP", pace: "calm" });
  assert.equal(saved[0].audit, "save");
  assert.equal(saved[0].minutes, 15);
  assert.equal(saved[0].channel, "phone");
  assert.equal(saved[0].pace, "calm");
  assert.equal(addPromise(saved, { id: "b", text: "Call Ada" }).length, 1);
  assert.equal(addPromise(saved, { id: "a", text: "Other" }).length, 1);
  assert.equal(addPromise(saved, { id: "b", text: "   " }).length, 1);
  const raised = stepPromisePace(saved, "a", 1);
  assert.equal(raised[0].pace, "due");
  assert.equal(raised[0].audit, "raise");
  assert.equal(stepPromisePace(raised, "a", 1)[0].pace, "hot");
  assert.equal(stepPromisePace([{ ...saved[0], pace: "hot" }], "a", 1)[0].pace, "hot");
  assert.equal(stepPromisePace([{ ...saved[0], pace: "" }], "a", -1)[0].pace, "");
  const starred = setPromiseStarred(saved, "a", true);
  assert.equal(starred[0].starred, true);
  assert.equal(starred[0].audit, "star");
  assert.equal(setPromiseStarred(starred, "a", false)[0].audit, "unstar");
  const waiting = setPromiseWaiting(saved, "a", true);
  assert.equal(waiting[0].waiting, true);
  assert.equal(waiting[0].audit, "wait");
  const closed = setPromiseClosed(saved, "a", true);
  assert.equal(closed[0].closed, true);
  assert.equal(closed[0].audit, "close");
  assert.equal(setPromiseClosed(closed, "a", false)[0].audit, "reopen");
  const edited = editPromise(saved, "a", "Call Bea");
  assert.equal(edited[0].text, "Call Bea");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editPromise(saved, "a", "  ")[0].text, "Call Ada");
  const pair = addPromise(saved, { id: "b", text: "Later", minutes: 120, channel: "visit" });
  assert.equal(editPromise(pair, "b", "Call Ada")[0].text, "Later");
  const bulkStar = bulkPromiseStarred(pair, ["b", ""], true);
  assert.equal(bulkStar[0].starred, true);
  assert.equal(bulkStar[1].starred, false);
  assert.equal(bulkPromiseClosed(pair, ["a"], true)[1].closed, true);
  assert.deepEqual(resetPromises(), []);
  assert.equal(promiseCopy("  Call Ada "), "Call Ada");
  assert.equal(promiseCopy(" "), "");
  const shown = visiblePromises(pair, "open", "ada", null, null, null, null, null, null, false, false, 40);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].id, "a");
  assert.equal(visiblePromises(pair, "open", "nia", null, null, null, null, null, null, false, false, 40).length, 0);
  assert.equal(visiblePromises(waiting, "waiting", "", null, null, null, null, null, null, false, false, 40).length, 1);
  assert.equal(visiblePromises(closed, "open", "", null, null, null, null, null, null, false, false, 40).length, 0);
  assert.equal(visiblePromises(pair, "open", "", "Nia", "phone", "VIP", "calm", 15, null, false, false, 40).length, 1);
  assert.equal(visiblePromises(pair, "open", "", null, null, null, null, null, "short", false, false, 40).length, 1);
  assert.equal(visiblePromises(pair, "open", "", null, null, null, null, null, "second", false, false, 40).length, 1);
  assert.equal(visiblePromises(raised, "open", "", null, null, null, null, null, null, true, false, 40).length, 0);
  assert.equal(visiblePromises(stepPromisePace(raised, "a", 1), "open", "", null, null, null, null, null, null, true, false, 40).length, 1);
  assert.equal(visiblePromises(pair, "open", "", null, null, null, null, null, null, false, true, 40).length, 1);
  assert.deepEqual(promiseTimeline(pair, "").map((card) => card.id), ["a", "b"]);
  assert.deepEqual(promiseTimeline(addPromise(pair, { id: "c", text: "Blank" }), "").map((card) => card.minutes === null).at(-1), true);
  const counts = promiseCounts(addPromise(starred, { id: "b", text: "Later", minutes: 120 }), 40);
  assert.equal(counts.open, 2);
  assert.equal(counts.starred, 1);
  assert.equal(counts.late, 1);
  assert.equal(promiseShare(1, 4), 25);
  assert.equal(promiseShare(0, 0), 0);
  assert.deepEqual(promiseOwners(saved), ["Nia"]);
  assert.deepEqual(promiseTags(saved), ["VIP"]);
  assert.deepEqual(promiseChannels(pair), ["phone", "visit"]);
  assert.deepEqual(promisePaces(saved), ["calm"]);
  assert.deepEqual(allowanceCounts(pair), [1, 0, 0, 0, 0, 1]);
  assert.equal(activeOwner("missing", ["Nia"]), "all");
  assert.equal(activeOwner("blank", ["Nia"]), "blank");
  assert.equal(activeOwner("Nia", ["Nia"]), "Nia");
  assert.equal(ownerArg("all"), null);
  assert.equal(ownerArg("blank"), "");
  assert.equal(ownerArg("Nia"), "Nia");
  assert.equal(activeChannel("missing", ["phone"]), "all");
  assert.equal(activeChannel("phone", ["phone"]), "phone");
  assert.equal(channelArg("blank"), "blank");
  assert.equal(channelArg("visit"), "visit");
  assert.equal(channelArg("fax"), null);
  assert.equal(activeTag("missing", ["VIP"]), "all");
  assert.equal(activeTag("VIP", ["VIP"]), "VIP");
  assert.equal(tagArg("blank"), "");
  assert.equal(tagArg("VIP"), "VIP");
  assert.equal(activePace("gone", ["calm"]), "all");
  assert.equal(activePace("hot", ["hot"]), "hot");
  assert.equal(paceArg("blank"), "blank");
  assert.equal(paceArg("due"), "due");
  assert.equal(paceArg("gold"), null);
  assert.equal(activeAllowance("missing"), "all");
  assert.equal(activeAllowance("blank"), "blank");
  assert.equal(activeAllowance("short"), "short");
  assert.equal(activeAllowance("15"), "15");
  assert.equal(activeAllowance("10"), "all");
  assert.deepEqual(allowanceArg("second"), { exact: null, band: "second" });
  assert.deepEqual(allowanceArg("30"), { exact: 30, band: null });
  assert.deepEqual(allowanceArg("nope"), { exact: null, band: null });
  const clash = addPromise(pair, { id: "c", text: "Same", minutes: 15, channel: "phone" });
  assert.deepEqual(promiseClashIds(clash, "a"), ["c"]);
  assert.deepEqual(promiseClashIds(addPromise(saved, { id: "d", text: "Open channel" }), "a"), []);
  assert.equal(nextPromise(pair, 40), "b");
  assert.equal(nextPromise(pair, 120), "b");
  assert.equal(nextPromise([{ ...pair[1], minutes: 30 }, { ...pair[0], minutes: 90 }], 120), pair[1].id);
  assert.equal(nextPromise(pair, ""), "");
  const csv = promisesCsv(saved, 40);
  assert.equal(csv.startsWith("note,owner,minutes,channel,tag,pace,band,starred,waiting,closed,gap,audit\n"), true);
  assert.equal(csv.includes("Nia"), true);
  assert.equal(csv.includes("amount"), false);
  const view = addPromiseView([], { id: "v", name: "Morning", tray: "open", query: "ada", owner: "Nia", channel: "phone", tag: "VIP", pace: "calm", minutes: "15" });
  assert.equal(view[0].minutes, "15");
  assert.equal(addPromiseView(view, { id: "v2", name: "Morning", tray: "open", query: "", owner: "all", channel: "all", tag: "all", pace: "all", minutes: "all" }).length, 1);
  assert.equal(dropPromiseView(view, "v").length, 0);
  assert.equal(readPromiseViews([{ id: "v", name: "  " }]).length, 0);

  assert.equal(dialRegion(" +90 532 "), "tr");
  assert.equal(dialRegion("0090 532"), "tr");
  assert.equal(dialRegion("+1 212"), "us");
  assert.equal(dialRegion("+44 20"), "uk");
  assert.equal(dialRegion("+49"), "de");
  assert.equal(dialRegion("+7 495"), "ru");
  assert.equal(dialRegion("+971 50"), "ae");
  assert.equal(dialRegion("+33"), "other");
  assert.equal(dialRegion("0532 111 22 33"), "local");
  assert.equal(dialRegion(""), "");
  assert.equal(dialRegion("nope"), "");
  assert.equal(dialRegion({ phone: "+90" }), "tr");
  assert.equal(dialRegion({ phone: "+90", name: "Ada" }), "");
  assert.equal(dialRegion({ phone: "+90", email: "a@b.c" }), "");
  assert.equal(dialCode("+90 532"), "90");
  assert.equal(dialCode("+33"), "33");
  assert.equal(dialCode("+358 40"), "358");
  assert.equal(dialCode("0532"), "");
  assert.equal(dialCode("+971"), "971");
  assert.equal(dialDigit("+90"), "9");
  assert.equal(dialDigit("+1"), "1");
  assert.equal(dialDigit("0532"), "");
  const rows = [
    { label: "Ada", phone: "+90 532" },
    { label: "Wes", phone: "+90 533" },
    { label: "Bea", phone: "+1 212" },
    { label: "Cid", phone: "0532" },
    { label: "Blocked", phone: { phone: "+90", name: "x" } },
  ];
  assert.equal(namedRegions(rows).includes("tr"), true);
  assert.equal(namedRegions(rows).includes("local"), true);
  assert.deepEqual(namedCodes(rows), ["1", "90"]);
  assert.deepEqual(namedDigits(rows), ["1", "9"]);
  assert.equal(leadingRegion(rows), "tr");
  assert.equal(leadingCode(rows), "90");
  assert.equal(callingShare(1, 4), 25);
  assert.equal(callingShare(0, 0), 0);
  assert.deepEqual(readHiddenCodes(["90", "pirate", "1"], ["90"]), ["90"]);
  assert.deepEqual(toggleCode(["90"], "90", ["90", "1"]), []);
  assert.deepEqual(toggleCode([], "1", ["1"]), ["1"]);
  assert.deepEqual(visibleCodes(["1", "90"], ["1"], false), ["90"]);
  assert.deepEqual(visibleCodes(["1", "90"], ["1"], true), ["1"]);
  assert.equal(activeRegion("missing", ["tr"]), "all");
  assert.equal(activeRegion("blank", ["tr"]), "blank");
  assert.equal(activeRegion("tr", ["tr"]), "tr");
  assert.equal(regionArg("all"), null);
  assert.equal(regionArg("blank"), "");
  assert.equal(regionArg("us"), "us");
  assert.equal(regionArg("nope"), null);
  assert.equal(activeCode("gone", ["90"]), "all");
  assert.equal(activeCode("90", ["90"]), "90");
  assert.equal(codeArg("all"), null);
  assert.equal(codeArg("blank"), "");
  assert.equal(codeArg("90"), "90");
  assert.equal(codeArg("nope"), null);
  assert.equal(activeDigit("z", ["9"]), "all");
  assert.equal(activeDigit("9", ["9"]), "9");
  assert.equal(digitArg("all"), null);
  assert.equal(digitArg("1"), "1");
  assert.equal(digitArg("nope"), null);
  const visible = visibleCallingCustomers(rows, "tr", "90", "9", "ada");
  assert.equal(visible.length, 1);
  assert.equal(visible[0].label, "Ada");
  assert.equal(visibleCallingCustomers(rows, "", null, null, "blocked").length, 1);
  assert.equal(visibleCallingCustomers(rows, null, null, null, "90").length, 0);
  assert.equal(visibleCallingCustomers(rows, "local", null, null, "").length, 1);
  assert.equal(callingCsv(rows).startsWith("kind,mark,count\n"), true);
  assert.equal(callingCsv([]), "kind,mark,count");
  assert.equal(callingCsv(rows).includes("amount"), false);
  assert.equal(callingCsv(rows).includes("90"), true);

  const copy = Object.keys(ROUND149_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND149_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "slaTitle"), "SLA promises");
  assert.equal(crmv4Text("tr", "clgTitle"), ROUND149_COPY.tr.clgTitle);
  assert.equal(crmv4Text("de", "slaOwner"), ROUND149_COPY.de.slaOwner);
  assert.equal(crmv4Text("ru", "clgUnmarked"), ROUND149_COPY.ru.clgUnmarked);
  assert.equal(crmv4Text("ar", "slaNotice"), ROUND149_COPY.ar.slaNotice);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-prm/);
  assert.match(css, /\.c4-clg/);
  assert.match(css, /\.c4-pagehead-promise/);
  assert.match(css, /\.c4-rail-promise/);
  assert.match(css, /\.c4-pagehead-quire/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round149.tsx"), "utf8");
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
  assert.match(viewFile, /phone/);
  assert.match(viewFile, /promisesCsv/);
  assert.match(viewFile, /callingCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-promise/);
  assert.match(viewFile, /data-calling/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "promise"/);
  assert.match(app, /view === "calling"/);
  assert.match(app, /c4-pagehead-promise/);
  assert.match(app, /c4-rail-promise/);
  assert.match(app, /c4-pagehead-quire/);
  console.log("crmv4 round149 tests passed");
}

main();
