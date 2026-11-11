"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  CHS_DENSITY_KEY,
  CHS_KEY,
  CHS_VIEW_KEY,
  PBR_KEY,
  PBR_REVIEW_KEY,
  activeBay,
  activeCaller,
  activeCloth,
  activeMark,
  activeMinutes,
  activeRibbonLane,
  activeRibbonTone,
  activeWeight,
  addSlip,
  addSlipTag,
  addSlipView,
  adjacentSlipCount,
  bayArg,
  bayGap,
  bulkRibbonReview,
  bulkSlipArchive,
  bulkSlipCloth,
  bulkSlipMark,
  bulkSlipPin,
  bulkSlipTag,
  busiestCaller,
  callerArg,
  catalogRibbon,
  catalogRibbonCount,
  clashBayCount,
  clothArg,
  cycleMark,
  densityOf,
  dropLoad,
  dropSlipView,
  editSlip,
  editSlipNote,
  fairCaller,
  giltRibbonCount,
  holdFocused,
  houseCloth,
  lateShare,
  lateSlip,
  leadingRibbon,
  leadingRibbonTone,
  markArg,
  markFocused,
  matchedSlips,
  minutesArg,
  minutesClashCount,
  moveFocus,
  nextSlip,
  pairCallerCount,
  peakBay,
  pinFocused,
  presentRibbons,
  quietBay,
  quietHouseCount,
  readHiddenRibbons,
  readReviewedRibbons,
  readSlipViews,
  readSlips,
  reminderSlips,
  resetSlips,
  ribbonCopy,
  ribbonLane,
  ribbonLaneArg,
  ribbonLanes,
  ribbonOf,
  ribbonRowsCsv,
  ribbonShare,
  ribbonState,
  ribbonStep,
  ribbonTone,
  ribbonToneArg,
  ribbonsCsv,
  setSlipArchive,
  setSlipHold,
  setSlipPin,
  setSlipWeight,
  sharedClothCount,
  sharedRibbonCount,
  baySpan,
  slipCallers,
  slipCloths,
  slipCopy,
  slipCounts,
  slipLedger,
  slipShare,
  slipsCsv,
  snoozeFocused,
  snoozeSlip,
  soonSlip,
  sortMode,
  sortSlips,
  suggestCaller,
  suggestCloth,
  suggestMinutes,
  toggleRibbon,
  toggleRibbonReview,
  usedBays,
  visibleRibbonCustomers,
  visibleRibbonLanes,
  visibleSlips,
  weightArg,
  weightLoad,
  wideRibbon,
  wideRibbonCount,
  windowSlips,
  type ChapterSlip,
  type RibbonRow,
  type RibbonShape,
  type SlipDensity,
  type SlipSort,
  type SlipTray,
  type SlipView,
} from "@/lib/crmv4/round216";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  affiliateB?: string | null;
};

type GlanceRow = RibbonRow & { id: string };

const CLOTHS = ["linen", "silk", "wool"] as const;
const MARKS = ["wait", "keep", "drop"] as const;
const LANES = ["west", "east", "court"] as const;

function clothLabel(v4: V4, cloth: string): string {
  if (cloth === "linen" || cloth === "LINEN") return v4("chsLinen");
  if (cloth === "silk" || cloth === "SILK") return v4("chsSilk");
  if (cloth === "wool" || cloth === "WOOL") return v4("chsWool");
  return v4("chsBlankCloth");
}

function markLabel(v4: V4, mark: string): string {
  if (mark === "wait") return v4("chsWait");
  if (mark === "keep") return v4("chsKeep");
  if (mark === "drop") return v4("chsDrop");
  return v4("chsBlankMark");
}

function minutesLabel(v4: V4, minutes: number | null): string {
  if (minutes === 15) return v4("chsMin15");
  if (minutes === 30) return v4("chsMin30");
  if (minutes === 60) return v4("chsMin60");
  return v4("chsBlankMinutes");
}

function laneLabel(v4: V4, name: string): string {
  if (name === "west") return v4("pbrWest");
  if (name === "east") return v4("pbrEast");
  if (name === "court") return v4("pbrCourt");
  if (name === "blank") return v4("pbrClear");
  return v4("pbrUnmarked");
}

function toneLabel(v4: V4, name: string): string {
  if (name === "gilt") return v4("pbrGilt");
  if (name === "ink") return v4("pbrInk");
  if (name === "ivory") return v4("pbrIvory");
  if (name === "mist") return v4("pbrMist");
  return v4("pbrUnmarked");
}

function kindLabel(v4: V4, step: number): string {
  if (step === 1) return v4("pbrDigits");
  if (step === 2) return v4("pbrLetters");
  if (step === 3) return v4("pbrMixed");
  return v4("pbrClear");
}

function auditLabel(v4: V4, audit: string): string {
  const key = {
    save: "chsAuditSave",
    edit: "chsAuditEdit",
    mark: "chsAuditMark",
    pin: "chsAuditPin",
    unpin: "chsAuditUnpin",
    hold: "chsAuditHold",
    resume: "chsAuditResume",
    archive: "chsAuditArchive",
    open: "chsAuditOpen",
    cloth: "chsAuditCloth",
    tag: "chsAuditTag",
    weight: "chsAuditWeight",
    minutes: "chsAuditMinutes",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, bay: number | null, desk: string): string {
  const gap = bayGap(bay, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("chsPast")} ${gap}`;
  if (gap < 0) return `${v4("chsAhead")} ${Math.abs(gap)}`;
  return v4("chsDue");
}

function download(name: string, body: string) {
  const blob = new Blob([body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function typingTarget(event: KeyboardEvent): boolean {
  const node = event.target as HTMLElement | null;
  if (!node) return false;
  const tag = node.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || node.isContentEditable;
}

export function ChapterSlips({ v4 }: { v4: V4 }) {
  const [slips, setSlips] = useState<ChapterSlip[]>([]);
  const [views, setViews] = useState<SlipView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [caller, setCaller] = useState("");
  const [bay, setBay] = useState("");
  const [cloth, setCloth] = useState("");
  const [mark, setMark] = useState("");
  const [minutesValue, setMinutesValue] = useState("");
  const [tag, setTag] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<SlipTray>("open");
  const [callerFilter, setCallerFilter] = useState("all");
  const [clothFilter, setClothFilter] = useState("all");
  const [markFilter, setMarkFilter] = useState("all");
  const [bayFilter, setBayFilter] = useState("all");
  const [minutesFilter, setMinutesFilter] = useState("all");
  const [weightFilter, setWeightFilter] = useState("all");
  const [dropOnly, setDropOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [lightOnly, setLightOnly] = useState(false);
  const [board, setBoard] = useState<"gallery" | "ledger">("gallery");
  const [order, setOrder] = useState<SlipSort>("bay");
  const [density, setDensity] = useState<SlipDensity>("tall");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [deskBay, setDeskBay] = useState("");
  const [moveCloth, setMoveCloth] = useState("silk");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<() => void>(() => {});
  const minutesRef = useRef<() => void>(() => {});
  const holdRef = useRef<() => void>(() => {});
  const markRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readSlips(readJson(CHS_KEY, []));
    const saved = readSlipViews(readJson(CHS_VIEW_KEY, []));
    setSlips(next);
    setViews(saved);
    setDensity(densityOf(readJson(CHS_DENSITY_KEY, "tall")));
    writeJson(CHS_KEY, next);
    writeJson(CHS_VIEW_KEY, saved);
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: ChapterSlip[]) {
    const saved = readSlips(next);
    setSlips(saved);
    writeJson(CHS_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((slip) => slip.id === id)));
  }
  function storeViews(next: SlipView[]) {
    const saved = readSlipViews(next);
    setViews(saved);
    writeJson(CHS_VIEW_KEY, saved);
  }
  function storeDensity(next: SlipDensity) {
    setDensity(next);
    writeJson(CHS_DENSITY_KEY, next);
  }
  const callers = slipCallers(slips);
  const cloths = slipCloths(slips);
  const bars = CLOTHS.map((item) => ({ cloth: item.toUpperCase(), count: slips.filter((slip) => slip.cloth === item.toUpperCase()).length })).filter((row) => row.count > 0);
  const callerOn = activeCaller(callerFilter, callers);
  const clothOn = activeCloth(clothFilter, cloths);
  const markOn = activeMark(markFilter, ["wait", "keep", "drop"]);
  const bayOn = activeBay(bayFilter);
  const minutesOn = activeMinutes(minutesFilter);
  const weightOn = activeWeight(weightFilter);
  const pickedBay = bayArg(bayOn);
  const shown = sortSlips(visibleSlips(
    slips,
    tray,
    query,
    callerArg(callerOn),
    clothArg(clothOn),
    markArg(markOn),
    pickedBay.exact,
    pickedBay.pick,
    minutesArg(minutesOn),
    weightArg(weightOn),
    dropOnly,
    peakOnly,
    houseOnly,
    quietOnly,
    lightOnly,
  ), order);
  const ledger = slipLedger(slips, query);
  const counts = slipCounts(slips, deskBay);
  const clashes = clashBayCount(slips);
  const minutes = minutesClashCount(slips);
  const neighbors = adjacentSlipCount(slips);
  const nextId = nextSlip(slips, deskBay);
  const nextRow = slips.find((slip) => slip.id === nextId);
  const suggestedCloth = suggestCloth(slips);
  const suggestedCaller = suggestCaller(slips);
  const suggestedMinutes = suggestMinutes(slips);
  const fair = fairCaller(slips, roster);
  const busy = busiestCaller(slips);
  const reminders = reminderSlips(slips, deskBay);
  const windowRows = windowSlips(slips, deskBay);
  const share = lateShare(slips, deskBay);
  const matched = matchedSlips(slips, deskBay);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  pinRef.current = () => {
    if (viewer) return;
    const ids = (board === "ledger" ? ledger : shown).map((slip) => slip.id);
    store(pinFocused(slips, ids, focus));
  };
  minutesRef.current = () => {
    if (viewer) return;
    const ids = (board === "ledger" ? ledger : shown).map((slip) => slip.id);
    store(snoozeFocused(slips, ids, focus));
  };
  holdRef.current = () => {
    if (viewer) return;
    const ids = (board === "ledger" ? ledger : shown).map((slip) => slip.id);
    store(holdFocused(slips, ids, focus));
  };
  markRef.current = () => {
    if (viewer) return;
    const ids = (board === "ledger" ? ledger : shown).map((slip) => slip.id);
    store(markFocused(slips, ids, focus));
  };
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        clearDraft();
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        titleRef.current?.focus();
        return;
      }
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        pinRef.current();
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        minutesRef.current();
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        holdRef.current();
        return;
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        markRef.current();
        return;
      }
      if (event.key === "b" || event.key === "B") {
        event.preventDefault();
        setBoard((current) => (current === "gallery" ? "ledger" : "gallery"));
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown.length]);
  function clearDraft() {
    setTitle("");
    setNote("");
    setCaller("");
    setBay("");
    setCloth("");
    setMark("");
    setMinutesValue("");
    setTag("");
    setQuery("");
    setEditing("");
  }
  function applyView(view: SlipView) {
    setTray(view.tray);
    setQuery(view.query);
    setCallerFilter(view.caller);
    setClothFilter(view.cloth);
    setMarkFilter(view.mark);
    setBayFilter(view.bay);
    setMinutesFilter(view.minutes);
    setWeightFilter(view.weight);
  }
  const rows = board === "ledger" ? ledger : shown;
  return (
    <section className="c4-chsl" aria-label={v4("chsTitle")} data-slips="1" data-role={role} data-density={density}>
      <div className="c4-chsl-sheet">
        <header className="c4-chsl-mast">
          <p className="c4-chsl-spine">{v4("chsSpine")}</p>
          <div>
            <p className="c4-chsl-kicker">{v4("chsSub")}</p>
            <h2 className="c4-title">{v4("chsTitle")}</h2>
          </div>
          <p className="c4-chsl-plate" data-logo="mono">{v4("chsLogo")}</p>
        </header>
        <div className="c4-chsl-body">
          <p className="c4-chsl-rules">{v4("chsHint")}</p>
          <p className="c4-meta">{v4("chsLocal")}</p>
          <p className="c4-meta">{v4("chsNew")} {v4("chsSlash")} {v4("chsEscape")} {v4("chsKeys")} {v4("chsPinKey")} {v4("chsMinutesKey")} {v4("chsHoldKey")} {v4("chsMarkKey")} {v4("chsBoardKey")}</p>
          {viewer && <p className="c4-chsl-notice" data-viewer="1">{v4("chsViewer")}</p>}
          {counts.peak > 0 && (
            <p className="c4-chsl-notice" role="status">
              {v4("chsNotice")} · {counts.peak}
              <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("chsNoticeAll") : v4("chsNoticePeak")}</button>
            </p>
          )}
          {counts.late > 0 && <p className="c4-chsl-notice" role="status" data-late="1">{v4("chsLateNotice")} · {counts.late}</p>}
          <ol className="c4-chsl-ledger" aria-label={v4("chsKpi")}>
            <li><span>{v4("chsOpen")}</span><strong>{counts.open}</strong></li>
            <li><span>{v4("chsHeld")}</span><strong>{counts.held}</strong></li>
            <li><span>{v4("chsArchived")}</span><strong>{counts.archived}</strong></li>
            <li><span>{v4("chsPinned")}</span><strong>{counts.pinned}</strong></li>
            <li><span>{v4("chsPeak")}</span><strong>{counts.peak}</strong></li>
            <li><span>{v4("chsLate")}</span><strong>{counts.late}</strong></li>
            <li><span>{v4("chsSoon")}</span><strong>{counts.soon}</strong></li>
            <li><span>{v4("chsWeight")}</span><strong>{counts.weight}</strong></li>
            <li><span>{v4("chsMatched")}</span><strong>{matched}</strong></li>
            <li><span>{v4("chsHouseShare")}</span><strong>{slipShare(counts.house, slips.length)}%</strong></li>
            <li><span>{v4("chsLateShare")}</span><strong>{share}%</strong></li>
          </ol>
          <div className="c4-chsl-sla" aria-label={v4("chsLateShare")}>
            <span>{v4("chsLateShare")}</span>
            <div className="c4-chsl-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></div>
          </div>
          <div className="c4-chsl-rail" aria-label={v4("chsCloths")}>
            {bars.map((bar) => (
              <div key={bar.cloth} className="c4-chsl-meter" data-cloth={bar.cloth.toLowerCase()}>
                <button type="button" className="c4-btn" onClick={() => setClothFilter(bar.cloth)}>{clothLabel(v4, bar.cloth)} · {bar.count}</button>
                <div className="c4-chsl-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
              </div>
            ))}
            {!bars.length && <p className="c4-chsl-empty">{v4("chsEmpty")}</p>}
          </div>
          <div className="c4-chsl-suggest">
            <p>{v4("chsSuggestCloth")} · {clothLabel(v4, suggestedCloth)}</p>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setCloth(suggestedCloth.toLowerCase())}>{v4("chsUseCloth")}</button>
            <p>{v4("chsSuggestCaller")} · {suggestedCaller || v4("chsBlankCaller")}</p>
            <button type="button" className="c4-btn" disabled={viewer || !suggestedCaller} onClick={() => setCaller(suggestedCaller)}>{v4("chsUseCaller")}</button>
            <p>{v4("chsSuggestMinutes")} · {minutesLabel(v4, suggestedMinutes)}</p>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setMinutesValue(String(suggestedMinutes))}>{v4("chsUseMinutes")}</button>
            <p>{v4("chsAssign")} · {fair || v4("chsBlankCaller")}</p>
            <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setCaller(fair)}>{v4("chsAssign")}</button>
          </div>
          <p className="c4-meta">{v4("chsBays")} · {usedBays(slips)}</p>
          <p className="c4-meta">{clashes ? `${v4("chsClash")} · ${clashes}` : v4("chsClashNone")}</p>
          <p className="c4-meta">{minutes ? `${v4("chsMinutesClash")} · ${minutes}` : v4("chsMinutesClashNone")}</p>
          <p className="c4-meta">{neighbors ? `${v4("chsAdjacent")} · ${neighbors}` : v4("chsAdjacentNone")}</p>
          <p className="c4-meta">{pairCallerCount(slips) ? `${v4("chsPairs")} · ${pairCallerCount(slips)}` : v4("chsPairsNone")}</p>
          <p className="c4-meta">{sharedClothCount(slips) ? `${v4("chsSharedCloth")} · ${sharedClothCount(slips)}` : v4("chsSharedClothNone")}</p>
          <p className="c4-meta">{`${v4("chsWeightLoad")} · ${weightLoad(slips)}`}</p>
          <p className="c4-meta">{`${v4("chsQuietHouse")} · ${quietHouseCount(slips)}`}</p>
          <p className="c4-meta">{`${v4("chsDropLoad")} · ${dropLoad(slips)}`}</p>
          <p className="c4-meta">{`${v4("chsBaySpan")} · ${baySpan(slips)}`}</p>
          <p className="c4-meta">{nextRow ? `${v4("chsNext")} · ${nextRow.title}` : v4("chsNextNone")}</p>
          <p className="c4-meta">{busy ? `${v4("chsBusiest")} · ${busy}` : v4("chsBusiestNone")}</p>
          <div className="c4-chsl-reminders" aria-label={v4("chsReminders")}>
            {reminders.length ? reminders.map((slip) => <span key={slip.id}>{slip.title}</span>) : <span>{v4("chsReminderNone")}</span>}
          </div>
          <div className="c4-chsl-window" aria-label={v4("chsWindow")}>
            {windowRows.length ? windowRows.map((slip) => <span key={slip.id}>{slip.title}</span>) : <span>{v4("chsWindowNone")}</span>}
          </div>
          <label className="c4-lab">{v4("chsSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("chsSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <div className="c4-chsl-filters" role="group" aria-label={v4("chsSearch")}>
            {(["open", "held", "archived"] as const).map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("chsOpenTray") : item === "held" ? v4("chsHeldTray") : v4("chsArchivedTray")}</button>
            ))}
            <button type="button" className="c4-chip" data-on={callerOn === "all" ? "1" : "0"} onClick={() => setCallerFilter("all")}>{v4("chsAll")}</button>
            <button type="button" className="c4-chip" data-on={callerOn === "blank" ? "1" : "0"} onClick={() => setCallerFilter("blank")}>{v4("chsBlankCaller")}</button>
            {callers.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={callerOn === name ? "1" : "0"} onClick={() => setCallerFilter(name)}>{name}</button>
            ))}
            <button type="button" className="c4-chip" data-on={clothOn === "all" ? "1" : "0"} onClick={() => setClothFilter("all")}>{v4("chsCloth")}</button>
            <button type="button" className="c4-chip" data-on={clothOn === "blank" ? "1" : "0"} onClick={() => setClothFilter("blank")}>{v4("chsBlankCloth")}</button>
            {CLOTHS.map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={clothOn === item.toUpperCase() ? "1" : "0"} onClick={() => setClothFilter(item)}>{clothLabel(v4, item)}</button>
            ))}
            <button type="button" className="c4-chip" data-on={markOn === "all" ? "1" : "0"} onClick={() => setMarkFilter("all")}>{v4("chsMark")}</button>
            <button type="button" className="c4-chip" data-on={markOn === "blank" ? "1" : "0"} onClick={() => setMarkFilter("blank")}>{v4("chsBlankMark")}</button>
            {MARKS.map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={markOn === item ? "1" : "0"} onClick={() => setMarkFilter(item)}>{markLabel(v4, item)}</button>
            ))}
            {["all", "blank", "early", "mid", "late", "peak", "quiet", "1", "6"].map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={bayOn === item ? "1" : "0"} onClick={() => setBayFilter(item)}>{item === "all" ? v4("chsBay") : item === "blank" ? v4("chsBlankBay") : item === "early" ? v4("chsEarly") : item === "mid" ? v4("chsMid") : item === "late" ? v4("chsLateBay") : item === "peak" ? v4("chsPeak") : item === "quiet" ? v4("chsQuiet") : item}</button>
            ))}
            {["all", "blank", "15", "30", "60"].map((item) => (
              <button key={`m${item}`} type="button" className="c4-chip" data-on={minutesOn === item ? "1" : "0"} onClick={() => setMinutesFilter(item)}>{item === "all" ? v4("chsMinutes") : item === "blank" ? v4("chsBlankMinutes") : minutesLabel(v4, Number(item))}</button>
            ))}
            {["all", "blank", "0", "1", "3"].map((item) => (
              <button key={`w${item}`} type="button" className="c4-chip" data-on={weightOn === item ? "1" : "0"} onClick={() => setWeightFilter(item)}>{item === "all" ? v4("chsWeight") : item === "blank" ? v4("chsBlankWeight") : item}</button>
            ))}
            <button type="button" className="c4-chip" data-on={dropOnly ? "1" : "0"} onClick={() => setDropOnly((on) => !on)}>{v4("chsDropOnly")}</button>
            <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((on) => !on)}>{v4("chsPeakOnly")}</button>
            <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((on) => !on)}>{v4("chsHouseOnly")}</button>
            <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((on) => !on)}>{v4("chsQuietOnly")}</button>
            <button type="button" className="c4-chip" data-on={lightOnly ? "1" : "0"} onClick={() => setLightOnly((on) => !on)}>{v4("chsLightOnly")}</button>
            <button type="button" className="c4-chip" data-on={order === "bay" ? "1" : "0"} onClick={() => setOrder(sortMode("bay"))}>{v4("chsSortBay")}</button>
            <button type="button" className="c4-chip" data-on={order === "caller" ? "1" : "0"} onClick={() => setOrder(sortMode("caller"))}>{v4("chsSortCaller")}</button>
            <button type="button" className="c4-chip" data-on={density === "tall" ? "1" : "0"} onClick={() => storeDensity("tall")}>{v4("chsTall")}</button>
            <button type="button" className="c4-chip" data-on={density === "low" ? "1" : "0"} onClick={() => storeDensity("low")}>{v4("chsLow")}</button>
            <button type="button" className="c4-chip" data-on={board === "gallery" ? "1" : "0"} onClick={() => setBoard("gallery")}>{v4("chsGallery")}</button>
            <button type="button" className="c4-chip" data-on={board === "ledger" ? "1" : "0"} onClick={() => setBoard("ledger")}>{v4("chsLedger")}</button>
          </div>
          <form className="c4-chsl-form" onSubmit={(event) => {
            event.preventDefault();
            if (viewer) return;
            store(addSlip(slips, { id: `chs-${Date.now()}`, title, note, caller, bay, cloth, mark, minutes: minutesValue, tags: tag }));
            clearDraft();
          }}>
            <label className="c4-lab">{v4("chsLine")}<input ref={titleRef} className="c4-field" aria-label={v4("chsLine")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
            <label className="c4-lab">{v4("chsNote")}<input className="c4-field" aria-label={v4("chsNote")} value={note} onChange={(event) => setNote(event.target.value)} /></label>
            <label className="c4-lab">{v4("chsCaller")}<input className="c4-field" aria-label={v4("chsCaller")} value={caller} onChange={(event) => setCaller(event.target.value)} /></label>
            <label className="c4-lab">{v4("chsBay")}<input className="c4-field" aria-label={v4("chsBay")} value={bay} onChange={(event) => setBay(event.target.value)} /></label>
            <label className="c4-lab">{v4("chsCloth")}<input className="c4-field" aria-label={v4("chsCloth")} value={cloth} onChange={(event) => setCloth(event.target.value)} /></label>
            <label className="c4-lab">{v4("chsMark")}<input className="c4-field" aria-label={v4("chsMark")} value={mark} onChange={(event) => setMark(event.target.value)} /></label>
            <label className="c4-lab">{v4("chsMinutes")}<input className="c4-field" aria-label={v4("chsMinutes")} value={minutesValue} onChange={(event) => setMinutesValue(event.target.value)} /></label>
            <label className="c4-lab">{v4("chsTag")}<input className="c4-field" aria-label={v4("chsTag")} value={tag} onChange={(event) => setTag(event.target.value)} /></label>
            <button type="submit" className="c4-btn" disabled={viewer}>{v4("chsSave")}</button>
          </form>
          <label className="c4-lab">{v4("chsDeskBay")}<input className="c4-field" aria-label={v4("chsDeskBay")} value={deskBay} onChange={(event) => setDeskBay(event.target.value)} /></label>
          <label className="c4-lab">{v4("chsRoster")}<input className="c4-field" aria-label={v4("chsRoster")} value={roster} onChange={(event) => setRoster(event.target.value)} /></label>
          <div className="c4-chsl-views">
            <label className="c4-lab">{v4("chsViewName")}<input className="c4-field" aria-label={v4("chsViewName")} value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
              const name = viewName.trim();
              if (!name) return;
              storeViews(addSlipView(views, { id: `view-${Date.now()}`, name, tray, query, caller: callerOn, cloth: clothOn, mark: markOn, bay: bayOn, minutes: minutesOn, weight: weightOn }));
              setViewName("");
            }}>{v4("chsSaveView")}</button>
            {views.map((view) => (
              <span key={view.id}>
                <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
                <button type="button" className="c4-btn" disabled={viewer} aria-label={v4("chsDropView")} onClick={() => storeViews(dropSlipView(views, view.id))}>×</button>
              </span>
            ))}
          </div>
          <div className="c4-chsl-bulk">
            <label className="c4-lab">{v4("chsBulkCloth")}<input className="c4-field" aria-label={v4("chsBulkCloth")} value={moveCloth} onChange={(event) => setMoveCloth(event.target.value)} /></label>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSlipCloth(slips, picked, moveCloth))}>{v4("chsBulkCloth")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSlipPin(slips, picked, true))}>{v4("chsBulkPin")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSlipArchive(slips, picked, true))}>{v4("chsBulkArchive")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSlipTag(slips, picked, tag))}>{v4("chsBulkTag")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSlipMark(slips, picked, mark))}>{v4("chsBulkMark")}</button>
            <button type="button" className="c4-btn" onClick={() => download("chapter-slips.csv", slipsCsv(slips, deskBay))}>{v4("chsCsv")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetSlips())}>{v4("chsReset")}</button>
          </div>
          {!rows.length && <p className="c4-chsl-empty">{v4("chsEmpty")}</p>}
          <ol className={board === "ledger" ? "c4-chsl-time" : "c4-chsl-book"}>
            {rows.map((slip, index) => (
              <li key={slip.id} data-focus={focus === index ? "1" : "0"} data-late={lateSlip(slip, deskBay) ? "1" : "0"} data-soon={soonSlip(slip) ? "1" : "0"} data-peak={peakBay(slip.bay) ? "1" : "0"} data-quiet={quietBay(slip.bay) ? "1" : "0"} data-house={houseCloth(slip.cloth) ? "1" : "0"} data-pinned={slip.pinned ? "1" : "0"} data-weight={slip.weight ? "1" : "0"} data-mark={slip.mark || "blank"}>
                <label className="c4-check"><input type="checkbox" checked={picked.includes(slip.id)} onChange={() => setPicked((ids) => ids.includes(slip.id) ? ids.filter((id) => id !== slip.id) : [...ids, slip.id])} /><span>{slip.bay ?? "—"}</span></label>
                <div>
                  {editing === slip.id ? (
                    <div className="c4-row">
                      <input className="c4-field" aria-label={v4("chsLine")} value={draft} onChange={(event) => setDraft(event.target.value)} />
                      <input className="c4-field" aria-label={v4("chsNote")} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} />
                      <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(editSlipNote(editSlip(slips, slip.id, draft), slip.id, noteDraft)); setEditing(""); }}>{v4("chsSave")}</button>
                    </div>
                  ) : (
                    <>
                      <strong>{slip.title}</strong>
                      <span className="c4-meta">{slip.caller || v4("chsBlankCaller")} · {clothLabel(v4, slip.cloth)} · {markLabel(v4, slip.mark)} · {minutesLabel(v4, slip.minutes)} · {gapLabel(v4, slip.bay, deskBay)}</span>
                      {slip.note && <p>{slip.note}</p>}
                      {!!slip.tags.length && <p className="c4-meta">{slip.tags.join(" ")}</p>}
                      {slip.audit && <p className="c4-meta">{auditLabel(v4, slip.audit)}</p>}
                    </>
                  )}
                  <div className="c4-row">
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipPin(slips, slip.id, !slip.pinned))}>{slip.pinned ? v4("chsUnpin") : v4("chsPin")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipHold(slips, slip.id, !slip.held))}>{slip.held ? v4("chsResume") : v4("chsHold")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleMark(slips, slip.id))}>{v4("chsMark")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addSlipTag(slips, slip.id, tag))}>{v4("chsTag")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipArchive(slips, slip.id, !slip.archived))}>{slip.archived ? v4("chsReopen") : v4("chsArchive")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipWeight(slips, slip.id, slip.weight ? 0 : 1))}>{slip.weight ? v4("chsWeightOff") : v4("chsWeightOn")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(snoozeSlip(slips, slip.id))}>{v4("chsSnooze")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(slip.id); setDraft(slip.title); setNoteDraft(slip.note); }}>{v4("chsEdit")}</button>
                    <button type="button" className="c4-btn" onClick={() => { const line = slipCopy(slip, deskBay); void navigator.clipboard?.writeText(line); setCopied(slip.id); }}>{copied === slip.id ? v4("chsCopied") : v4("chsCopy")}</button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <p className="c4-chsl-rules">{v4("chsRules")}</p>
        </div>
      </div>
    </section>
  );
}

export function PartnerRibbons({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("all");
  const [tone, setTone] = useState("all");
  const [shape, setShape] = useState<RibbonShape>("all");
  const [review, setReview] = useState<"all" | "reviewed" | "open">("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<GlanceRow[]>(() => (data.data?.users || []).map((user) => ({
    id: user.id,
    label: user.name || user.id,
    note: { affiliateB: user.affiliateB ?? null },
  })), [data.data?.users]);
  useEffect(() => {
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  useEffect(() => {
    const present = presentRibbons(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenRibbons(readJson(PBR_KEY, []), present);
    const nextReviewed = readReviewedRibbons(readJson(PBR_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(PBR_KEY, nextHidden);
    writeJson(PBR_REVIEW_KEY, nextReviewed);
  }, [rows]);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setQuery("");
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "n" || event.key === "N" || event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const present = presentRibbons(rows);
  const lanes = visibleRibbonLanes(present, hidden, showHidden);
  const laneOn = activeRibbonLane(lane, present);
  const toneOn = activeRibbonTone(tone);
  const shown = visibleRibbonCustomers(rows, ribbonLaneArg(laneOn), ribbonToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = ribbonState(row.note);
      const token = state === "set" ? ribbonLane(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return lanes.includes(token);
    });
  const lead = leadingRibbon(rows);
  const toneLead = leadingRibbonTone(rows);
  const shared = sharedRibbonCount(rows);
  const catalog = catalogRibbonCount(rows);
  const bars = ribbonLanes(rows).filter((line) => line.lane);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(PBR_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedRibbons(next, ids);
    setReviewed(saved);
    writeJson(PBR_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-pbr" aria-label={v4("pbrTitle")} data-ribbons="1" data-role={role} data-catalog={catalog ? "1" : "0"}>
      <div className="c4-pbr-sheet">
        <header className="c4-pbr-mast">
          <div>
            <p className="c4-pbr-kicker">{v4("pbrSub")}</p>
            <h2 className="c4-title">{v4("pbrTitle")}</h2>
          </div>
          <p className="c4-pbr-plate" data-logo="mono">{v4("pbrLogo")}</p>
        </header>
        <div className="c4-pbr-body">
        <p className="c4-pbr-rules">{v4("pbrHint")}</p>
        <p className="c4-meta">{v4("pbrKept")} {v4("pbrEscape")}</p>
        {viewer && <p className="c4-pbr-notice" data-viewer="1">{v4("pbrViewer")}</p>}
        {data.error && <p className="c4-pbr-empty" role="alert">{v4("pbrFailed")}</p>}
        {data.loading && <p className="c4-meta">{v4("pbrLoading")}</p>}
        {shared > 0 && <p className="c4-pbr-notice" role="status">{v4("pbrNotice")} · {shared}</p>}
        <ol className="c4-pbr-ledger" aria-label={v4("pbrKpi")}>
          <li><span>{v4("pbrSet")}</span><strong>{rows.filter((row) => ribbonState(row.note) === "set").length}</strong></li>
          <li><span>{v4("pbrCatalog")}</span><strong>{catalog}</strong></li>
          <li><span>{v4("pbrWide")}</span><strong>{wideRibbonCount(rows)}</strong></li>
          <li><span>{v4("pbrGiltCount")}</span><strong>{giltRibbonCount(rows)}</strong></li>
          <li><span>{v4("pbrShare")}</span><strong>{ribbonShare(catalog, rows.length)}%</strong></li>
          <li><span>{v4("pbrShared")}</span><strong>{shared}</strong></li>
        </ol>
        <div className="c4-pbr-rail" aria-label={v4("pbrLanes")}>
          {bars.map((bar) => (
            <div key={bar.lane} className="c4-pbr-meter" data-lane={bar.lane}>
              <button type="button" className="c4-btn" onClick={() => setLane(bar.lane)}>{laneLabel(v4, bar.lane)} · {bar.count}</button>
              <div className="c4-pbr-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            </div>
          ))}
          {!bars.length && <p className="c4-pbr-empty">{v4("pbrEmpty")}</p>}
        </div>
        <div className="c4-pbr-suggest">
          <p>{v4("pbrLeading")} · {lead ? laneLabel(v4, lead) : v4("pbrLeadingNone")}</p>
          <p>{v4("pbrToneLead")} · {toneLead ? toneLabel(v4, toneLead) : v4("pbrToneNone")}</p>
          <p>{shared ? `${v4("pbrShared")} · ${shared}` : v4("pbrSharedNone")}</p>
        </div>
        <label className="c4-lab">{v4("pbrSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("pbrSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <div className="c4-pbr-filters">
          <button type="button" className="c4-chip" data-on={laneOn === "all" ? "1" : "0"} onClick={() => setLane("all")}>{v4("pbrAll")}</button>
          <button type="button" className="c4-chip" data-on={laneOn === "blank" ? "1" : "0"} onClick={() => setLane("blank")}>{v4("pbrClear")}</button>
          {LANES.map((item) => (
            <button key={item} type="button" className="c4-chip" data-on={laneOn === item ? "1" : "0"} onClick={() => setLane(item)}>{laneLabel(v4, item)}</button>
          ))}
          <button type="button" className="c4-chip" data-on={toneOn === "all" ? "1" : "0"} onClick={() => setTone("all")}>{v4("pbrTone")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "gilt" ? "1" : "0"} onClick={() => setTone("gilt")}>{v4("pbrGilt")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "ink" ? "1" : "0"} onClick={() => setTone("ink")}>{v4("pbrInk")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "ivory" ? "1" : "0"} onClick={() => setTone("ivory")}>{v4("pbrIvory")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "mist" ? "1" : "0"} onClick={() => setTone("mist")}>{v4("pbrMist")}</button>
          {(["all", "catalog", "wide", "gilt"] as const).map((item) => (
            <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{item === "all" ? v4("pbrAllShapes") : item === "catalog" ? v4("pbrCatalog") : item === "wide" ? v4("pbrWide") : v4("pbrGilt")}</button>
          ))}
          <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} onClick={() => setReview("all")}>{v4("pbrAllReview")}</button>
          <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview("reviewed")}>{v4("pbrReviewed")}</button>
          <button type="button" className="c4-chip" data-on={review === "open" ? "1" : "0"} onClick={() => setReview("open")}>{v4("pbrOpenReview")}</button>
          <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("pbrShown") : v4("pbrHidden")}</button>
        </div>
        <div className="c4-pbr-bands">
          {present.map((item) => (
            <button key={item} type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleRibbon(hidden, item))}>
              {laneLabel(v4, item)} · {hidden.includes(item) ? v4("pbrShow") : v4("pbrHide")}
            </button>
          ))}
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkRibbonReview(reviewed, shown.map((row) => row.id), true))}>{v4("pbrBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkRibbonReview(reviewed, ids, false))}>{v4("pbrBulkClear")}</button>
          <button type="button" className="c4-btn" onClick={() => download("partner-ribbons.csv", ribbonsCsv(rows))}>{v4("pbrCsv")}</button>
          <button type="button" className="c4-btn" onClick={() => download("partner-ribbon-rows.csv", ribbonRowsCsv(rows, reviewed))}>{v4("pbrRowCsv")}</button>
          <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("pbrCustomers")}</Link>
        </div>
        {!shown.length && <p className="c4-pbr-empty">{v4("pbrEmpty")}</p>}
        <ul className="c4-pbr-index">
          {shown.map((row) => {
            const state = ribbonState(row.note);
            const mark = ribbonOf(row.note);
            const step = ribbonStep(row.note);
            const steps = [v4("pbrDigits"), v4("pbrLetters"), v4("pbrMixed")];
            return (
              <li key={row.id} data-state={state || "blank"} data-lane={state === "set" ? ribbonLane(row.note) : "blank"} data-tone={ribbonTone(row.note) || "blank"} data-catalog={catalogRibbon(row.note) ? "1" : "0"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"} data-step={step}>
                <p className="c4-pbr-mark" data-logo="mono">{mark || "—"}</p>
                <div>
                  <strong>{row.label || row.id}</strong>
                  <span className="c4-meta">{ribbonCopy(row.note) || v4("pbrClear")} · {laneLabel(v4, state === "set" ? ribbonLane(row.note) : state === "clear" ? "blank" : "")} · {toneLabel(v4, ribbonTone(row.note))}</span>
                  <ol className="c4-pbr-time" aria-label={v4("pbrStep")}>
                    {steps.map((label, index) => (
                      <li key={label} data-on={step >= index + 1 ? "1" : "0"}>{label}</li>
                    ))}
                  </ol>
                  <span className="c4-meta">{kindLabel(v4, step)}</span>
                  {catalogRibbon(row.note) && <span className="c4-meta">{v4("pbrCatalogMark")}</span>}
                  {wideRibbon(row.note) && <span className="c4-meta">{v4("pbrWide")}</span>}
                  <div className="c4-row">
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleRibbonReview(reviewed, row.id))}>{v4("pbrReview")}</button>
                    <button type="button" className="c4-btn" onClick={() => { const line = ribbonCopy(row.note); void navigator.clipboard?.writeText(line); setCopied(row.id); }}>{copied === row.id ? v4("pbrCopied") : v4("pbrCopy")}</button>
                    <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{row.label || row.id}</Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="c4-pbr-rules">{v4("pbrRules")}</p>
        </div>
      </div>
    </section>
  );
}
