"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  RCT_DENSITY_KEY,
  RCT_KEY,
  RCT_VIEW_KEY,
  UNS_KEY,
  UNS_REVIEW_KEY,
  activeBell,
  activeCandle,
  activeCue,
  activeHall,
  activeSealBand,
  activeSealTone,
  activeSpan,
  activeUsher,
  addRecital,
  addRecitalView,
  barSealCount,
  bellArg,
  bellGap,
  bulkRecitalClose,
  bulkRecitalHall,
  bulkRecitalPin,
  bulkRecitalTag,
  bulkSealReview,
  busiestUsher,
  candleArg,
  candleClashCount,
  catalogSeal,
  catalogSealCount,
  clashBellCount,
  cueArg,
  cycleCue,
  densityOf,
  dropRecitalView,
  editRecital,
  editRecitalNote,
  fairUsher,
  hallArg,
  houseHall,
  lateRecital,
  leadingSeal,
  leadingSealTone,
  moveFocus,
  nextRecital,
  peakBell,
  pinFocused,
  plainSealCount,
  presentSeals,
  quietBell,
  readHiddenSeals,
  readRecitalViews,
  readRecitals,
  readReviewedSeals,
  recitalCopy,
  recitalCounts,
  recitalHalls,
  recitalShare,
  recitalTimeline,
  recitalUshers,
  recitalsCsv,
  reminderRecitals,
  resetRecitals,
  sealBand,
  sealBandArg,
  sealBands,
  sealCopy,
  sealOf,
  sealRowsCsv,
  sealShare,
  sealState,
  sealTone,
  sealToneArg,
  sealsCsv,
  setRecitalClose,
  setRecitalHold,
  setRecitalPin,
  setRecitalRest,
  sharedSealCount,
  soonRecital,
  sortMode,
  sortRecitals,
  spanArg,
  suggestHall,
  suggestSpan,
  suggestUsher,
  toggleSeal,
  toggleSealReview,
  usedBells,
  usherArg,
  visibleRecitals,
  visibleSealBands,
  visibleSealCustomers,
  type RecDensity,
  type RecHall,
  type RecSort,
  type RecTray,
  type RecView,
  type SalonRecital,
  type SealRow,
  type SealShape,
} from "@/lib/crmv4/round201";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  username?: string | null;
};

type GlanceRow = SealRow & { id: string };

const HALLS = ["gold", "ivory", "ink"] as const;
const BANDS = ["dot", "bar"] as const;

function hallLabel(v4: V4, hall: RecHall | string): string {
  if (hall === "gold" || hall === "GOLD") return v4("rctGold");
  if (hall === "ivory" || hall === "IVORY") return v4("rctIvory");
  if (hall === "ink" || hall === "INK") return v4("rctInk");
  return v4("rctBlankHall");
}

function cueLabel(v4: V4, cue: string): string {
  if (cue === "posted") return v4("rctPosted");
  if (cue === "called") return v4("rctCalled");
  if (cue === "bowed") return v4("rctBowed");
  return v4("rctBlankCue");
}

function candleLabel(v4: V4, candle: number | null): string {
  if (candle === 2) return v4("rctCandle2");
  if (candle === 4) return v4("rctCandle4");
  if (candle === 6) return v4("rctCandle6");
  return v4("rctBlankCandle");
}

function spanLabel(v4: V4, span: number | null): string {
  if (span === 15) return v4("rctSpan15");
  if (span === 30) return v4("rctSpan30");
  if (span === 45) return v4("rctSpan45");
  return v4("rctBlankSpan");
}

function bandLabel(v4: V4, name: string): string {
  if (name === "dot") return v4("unsDot");
  if (name === "bar") return v4("unsBar");
  if (name === "blank") return v4("unsClear");
  return v4("unsUnmarked");
}

function toneLabel(v4: V4, name: string): string {
  if (name === "cipher") return v4("unsCipher");
  if (name === "plain") return v4("unsPlain");
  return v4("unsUnmarked");
}

function auditLabel(v4: V4, audit: string): string {
  const key = {
    save: "rctAuditSave",
    edit: "rctAuditEdit",
    cue: "rctAuditCue",
    pin: "rctAuditPin",
    unpin: "rctAuditUnpin",
    hold: "rctAuditHold",
    lift: "rctAuditLift",
    close: "rctAuditClose",
    open: "rctAuditOpen",
    hall: "rctAuditHall",
    tag: "rctAuditTag",
    rest: "rctAuditRest",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, bell: number | null, desk: string): string {
  const gap = bellGap(bell, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("rctPast")} ${gap}`;
  if (gap < 0) return `${v4("rctAhead")} ${Math.abs(gap)}`;
  return v4("rctDue");
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

export function SalonRecitals({ v4 }: { v4: V4 }) {
  const [recitals, setRecitals] = useState<SalonRecital[]>([]);
  const [views, setViews] = useState<RecView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [usher, setUsher] = useState("");
  const [bell, setBell] = useState("");
  const [hall, setHall] = useState("");
  const [cue, setCue] = useState("");
  const [candle, setCandle] = useState("");
  const [spanValue, setSpanValue] = useState("");
  const [tag, setTag] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<RecTray>("open");
  const [usherFilter, setUsherFilter] = useState("all");
  const [hallFilter, setHallFilter] = useState("all");
  const [cueFilter, setCueFilter] = useState("all");
  const [bellFilter, setBellFilter] = useState("all");
  const [candleFilter, setCandleFilter] = useState("all");
  const [spanFilter, setSpanFilter] = useState("all");
  const [calledOnly, setCalledOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [awakeOnly, setAwakeOnly] = useState(false);
  const [board, setBoard] = useState<"program" | "timeline">("program");
  const [order, setOrder] = useState<RecSort>("bell");
  const [density, setDensity] = useState<RecDensity>("roomy");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [deskBell, setDeskBell] = useState("");
  const [moveHall, setMoveHall] = useState("ink");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readRecitals(readJson(RCT_KEY, []));
    const saved = readRecitalViews(readJson(RCT_VIEW_KEY, []));
    setRecitals(next);
    setViews(saved);
    setDensity(densityOf(readJson(RCT_DENSITY_KEY, "roomy")));
    writeJson(RCT_KEY, next);
    writeJson(RCT_VIEW_KEY, saved);
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: SalonRecital[]) {
    const saved = readRecitals(next);
    setRecitals(saved);
    writeJson(RCT_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((recital) => recital.id === id)));
  }
  function storeViews(next: RecView[]) {
    const saved = readRecitalViews(next);
    setViews(saved);
    writeJson(RCT_VIEW_KEY, saved);
  }
  function storeDensity(next: RecDensity) {
    setDensity(next);
    writeJson(RCT_DENSITY_KEY, next);
  }
  const ushers = recitalUshers(recitals);
  const halls = recitalHalls(recitals);
  const bars = HALLS.map((item) => ({ hall: item.toUpperCase(), count: recitals.filter((recital) => recital.hall === item.toUpperCase()).length })).filter((row) => row.count > 0);
  const usherOn = activeUsher(usherFilter, ushers);
  const hallOn = activeHall(hallFilter, halls);
  const cueOn = activeCue(cueFilter, ["posted", "called", "bowed"]);
  const bellOn = activeBell(bellFilter);
  const candleOn = activeCandle(candleFilter);
  const spanOn = activeSpan(spanFilter);
  const pickedBell = bellArg(bellOn);
  const shown = sortRecitals(visibleRecitals(
    recitals,
    tray,
    query,
    usherArg(usherOn),
    hallArg(hallOn),
    cueArg(cueOn),
    pickedBell.exact,
    pickedBell.pick,
    candleArg(candleOn),
    spanArg(spanOn),
    calledOnly,
    peakOnly,
    houseOnly,
    quietOnly,
    awakeOnly,
  ), order);
  const timeline = recitalTimeline(recitals, query);
  const counts = recitalCounts(recitals, deskBell);
  const clashes = clashBellCount(recitals);
  const candles = candleClashCount(recitals);
  const nextId = nextRecital(recitals, deskBell);
  const nextRow = recitals.find((recital) => recital.id === nextId);
  const suggestedHall = suggestHall(recitals);
  const suggestedUsher = suggestUsher(recitals);
  const suggestedSpan = suggestSpan(recitals);
  const fair = fairUsher(recitals, roster);
  const busy = busiestUsher(recitals);
  const reminders = reminderRecitals(recitals, deskBell);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const focusAt = shown.length ? moveFocus(focus, shown.length, 0) : 0;
  pinRef.current = () => {
    if (viewer) return;
    const ids = (board === "timeline" ? timeline : shown).map((recital) => recital.id);
    store(pinFocused(recitals, ids, focus));
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
    setUsher("");
    setBell("");
    setHall("");
    setCue("");
    setCandle("");
    setSpanValue("");
    setTag("");
    setQuery("");
    setEditing("");
  }
  function applyView(view: RecView) {
    setTray(view.tray);
    setQuery(view.query);
    setUsherFilter(view.usher);
    setHallFilter(view.hall);
    setCueFilter(view.cue);
    setBellFilter(view.bell);
    setCandleFilter(view.candle);
    setSpanFilter(view.span);
  }
  const rows = board === "timeline" ? timeline : shown;
  return (
    <section className="c4-rct" aria-label={v4("rctTitle")} data-recitals="1" data-role={role} data-density={density}>
      <div className="c4-rct-sheet">
        <header className="c4-rct-mast">
          <p className="c4-rct-spine">{v4("rctSpine")}</p>
          <div>
            <p className="c4-rct-kicker">{v4("rctSub")}</p>
            <h2 className="c4-title">{v4("rctTitle")}</h2>
          </div>
          <p className="c4-rct-plate" data-logo="mono">{v4("rctLogo")}</p>
        </header>
        <p className="c4-rct-rules">{v4("rctHint")}</p>
        <p className="c4-meta">{v4("rctLocal")}</p>
        <p className="c4-meta">{v4("rctNew")} {v4("rctSlash")} {v4("rctEscape")} {v4("rctKeys")} {v4("rctPinKey")}</p>
        {viewer && <p className="c4-rct-notice" data-viewer="1">{v4("rctViewer")}</p>}
        {counts.peak > 0 && (
          <p className="c4-rct-notice" role="status">
            {v4("rctNotice")} · {counts.peak}
            <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("rctNoticeAll") : v4("rctNoticePeak")}</button>
          </p>
        )}
        <ol className="c4-rct-ledger" aria-label={v4("rctKpi")}>
          <li><span>{v4("rctOpen")}</span><strong>{counts.open}</strong></li>
          <li><span>{v4("rctHeld")}</span><strong>{counts.held}</strong></li>
          <li><span>{v4("rctClosed")}</span><strong>{counts.closed}</strong></li>
          <li><span>{v4("rctPinned")}</span><strong>{counts.pinned}</strong></li>
          <li><span>{v4("rctPeak")}</span><strong>{counts.peak}</strong></li>
          <li><span>{v4("rctLate")}</span><strong>{counts.late}</strong></li>
          <li><span>{v4("rctSoon")}</span><strong>{counts.soon}</strong></li>
          <li><span>{v4("rctRest")}</span><strong>{counts.rest}</strong></li>
          <li><span>{v4("rctHouseShare")}</span><strong>{recitalShare(counts.house, recitals.length)}%</strong></li>
        </ol>
        <div className="c4-rct-rail" aria-label={v4("rctHalls")}>
          {bars.map((bar) => (
            <div key={bar.hall} className="c4-rct-meter" data-hall={bar.hall.toLowerCase()}>
              <button type="button" className="c4-btn" onClick={() => setHallFilter(bar.hall)}>{hallLabel(v4, bar.hall)} · {bar.count}</button>
              <div className="c4-rct-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            </div>
          ))}
          {!bars.length && <p className="c4-rct-empty">{v4("rctEmpty")}</p>}
        </div>
        <div className="c4-rct-suggest">
          <p>{v4("rctSuggestHall")} · {hallLabel(v4, suggestedHall)}</p>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => setHall(suggestedHall.toLowerCase())}>{v4("rctUseHall")}</button>
          <p>{v4("rctSuggestUsher")} · {suggestedUsher || v4("rctBlankUsher")}</p>
          <button type="button" className="c4-btn" disabled={viewer || !suggestedUsher} onClick={() => setUsher(suggestedUsher)}>{v4("rctUseUsher")}</button>
          <p>{v4("rctSuggestSpan")} · {spanLabel(v4, suggestedSpan)}</p>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => setSpanValue(String(suggestedSpan))}>{v4("rctUseSpan")}</button>
          <p>{v4("rctAssign")} · {fair || v4("rctBlankUsher")}</p>
          <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setUsher(fair)}>{v4("rctAssign")}</button>
          <p>{v4("rctBells")} · {usedBells(recitals)}</p>
          <p>{clashes ? `${v4("rctClash")} · ${clashes}` : v4("rctClashNone")}</p>
          <p>{candles ? `${v4("rctCandleClash")} · ${candles}` : v4("rctCandleClashNone")}</p>
          <p>{v4("rctNext")} · {nextRow ? nextRow.title : v4("rctNextNone")}</p>
          <p>{v4("rctBusiest")} · {busy || v4("rctBusiestNone")}</p>
          <p>{v4("rctReminders")} · {reminders.length ? reminders.map((recital) => recital.title).join(", ") : v4("rctReminderNone")}</p>
        </div>
        <form className="c4-rct-form" onSubmit={(event) => {
          event.preventDefault();
          if (viewer) return;
          const next = addRecital(recitals, {
            id: `r${Date.now().toString(36)}`,
            title,
            note,
            usher,
            bell,
            hall,
            cue,
            candle,
            span: spanValue,
            tags: tag,
            rest: "0",
          });
          const added = next[0];
          if (added && (added.title !== recitals[0]?.title || next.length !== recitals.length)) {
            store(next);
            clearDraft();
          }
        }}>
          <label className="c4-lab">{v4("rctLine")}<input ref={titleRef} className="c4-field" aria-label={v4("rctLine")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
          <label className="c4-lab">{v4("rctNote")}<input className="c4-field" aria-label={v4("rctNote")} value={note} onChange={(event) => setNote(event.target.value)} /></label>
          <label className="c4-lab">{v4("rctUsher")}<input className="c4-field" aria-label={v4("rctUsher")} value={usher} onChange={(event) => setUsher(event.target.value)} /></label>
          <label className="c4-lab">{v4("rctBell")}<input className="c4-field" inputMode="numeric" aria-label={v4("rctBell")} value={bell} onChange={(event) => setBell(event.target.value)} /></label>
          <label className="c4-lab">{v4("rctHall")}
            <select className="c4-field" aria-label={v4("rctHall")} value={hall} onChange={(event) => setHall(event.target.value)}>
              <option value="">{v4("rctBlankHall")}</option>
              {HALLS.map((item) => <option key={item} value={item}>{hallLabel(v4, item)}</option>)}
            </select>
          </label>
          <label className="c4-lab">{v4("rctCue")}
            <select className="c4-field" aria-label={v4("rctCue")} value={cue} onChange={(event) => setCue(event.target.value)}>
              <option value="">{v4("rctBlankCue")}</option>
              <option value="posted">{v4("rctPosted")}</option>
              <option value="called">{v4("rctCalled")}</option>
              <option value="bowed">{v4("rctBowed")}</option>
            </select>
          </label>
          <label className="c4-lab">{v4("rctCandle")}
            <select className="c4-field" aria-label={v4("rctCandle")} value={candle} onChange={(event) => setCandle(event.target.value)}>
              <option value="">{v4("rctBlankCandle")}</option>
              <option value="2">{v4("rctCandle2")}</option>
              <option value="4">{v4("rctCandle4")}</option>
              <option value="6">{v4("rctCandle6")}</option>
            </select>
          </label>
          <label className="c4-lab">{v4("rctSpan")}
            <select className="c4-field" aria-label={v4("rctSpan")} value={spanValue} onChange={(event) => setSpanValue(event.target.value)}>
              <option value="">{v4("rctBlankSpan")}</option>
              <option value="15">{v4("rctSpan15")}</option>
              <option value="30">{v4("rctSpan30")}</option>
              <option value="45">{v4("rctSpan45")}</option>
            </select>
          </label>
          <label className="c4-lab">{v4("rctTag")}<input className="c4-field" maxLength={1} aria-label={v4("rctTag")} value={tag} onChange={(event) => setTag(event.target.value)} /></label>
          <label className="c4-lab">{v4("rctRoster")}<input className="c4-field" aria-label={v4("rctRoster")} value={roster} onChange={(event) => setRoster(event.target.value)} /></label>
          <label className="c4-lab">{v4("rctDeskBell")}<input className="c4-field" inputMode="numeric" aria-label={v4("rctDeskBell")} value={deskBell} onChange={(event) => setDeskBell(event.target.value)} /></label>
          <button type="submit" className="c4-btn c4-btn-hot" disabled={viewer}>{v4("rctAdd")}</button>
        </form>
        <div className="c4-rct-views">
          <label className="c4-lab">{v4("rctViews")}<input className="c4-field" aria-label={v4("rctViews")} value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
            const next = addRecitalView(views, { id: `v${Date.now().toString(36)}`, name: viewName, tray, query, usher: usherOn, hall: hallOn, cue: cueOn, bell: bellOn, candle: candleOn, span: spanOn });
            storeViews(next);
            if (next.length !== views.length) setViewName("");
          }}>{v4("rctSaveView")}</button>
          {views.map((view) => (
            <span key={view.id}>
              <button type="button" className="c4-chip" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropRecitalView(views, view.id))}>{v4("rctDropView")}</button>
            </span>
          ))}
        </div>
        <label className="c4-lab">{v4("rctSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("rctSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <div className="c4-rct-filters" role="group" aria-label={v4("rctSearch")}>
          {(["open", "held", "closed"] as const).map((item) => (
            <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("rctOpen") : item === "held" ? v4("rctHeld") : v4("rctClosed")}</button>
          ))}
          <button type="button" className="c4-chip" data-on={usherOn === "all" ? "1" : "0"} onClick={() => setUsherFilter("all")}>{v4("rctAll")}</button>
          <button type="button" className="c4-chip" data-on={usherOn === "blank" ? "1" : "0"} onClick={() => setUsherFilter("blank")}>{v4("rctBlankUsher")}</button>
          {ushers.map((name) => (
            <button key={name} type="button" className="c4-chip" data-on={usherOn === name ? "1" : "0"} onClick={() => setUsherFilter(name)}>{name}</button>
          ))}
          {["blank", "early", "mid", "late", "peak", "quiet"].map((item) => (
            <button key={item} type="button" className="c4-chip" data-on={bellOn === item ? "1" : "0"} onClick={() => setBellFilter(item)}>
              {item === "blank" ? v4("rctBlankBell") : item === "early" ? v4("rctEarly") : item === "mid" ? v4("rctMid") : item === "late" ? v4("rctLateBell") : item === "peak" ? v4("rctPeak") : v4("rctQuiet")}
            </button>
          ))}
          <button type="button" className="c4-chip" data-on={calledOnly ? "1" : "0"} onClick={() => setCalledOnly((on) => !on)}>{v4("rctCalledOnly")}</button>
          <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((on) => !on)}>{v4("rctHouseOnly")}</button>
          <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((on) => !on)}>{v4("rctQuietOnly")}</button>
          <button type="button" className="c4-chip" data-on={awakeOnly ? "1" : "0"} onClick={() => setAwakeOnly((on) => !on)}>{v4("rctAwake")}</button>
          <button type="button" className="c4-chip" data-on={board === "program" ? "1" : "0"} onClick={() => setBoard("program")}>{v4("rctProgram")}</button>
          <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard("timeline")}>{v4("rctTimeline")}</button>
          <button type="button" className="c4-chip" data-on={order === "bell" ? "1" : "0"} onClick={() => setOrder(sortMode("bell"))}>{v4("rctSortBell")}</button>
          <button type="button" className="c4-chip" data-on={order === "title" ? "1" : "0"} onClick={() => setOrder(sortMode("title"))}>{v4("rctSortTitle")}</button>
          <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "roomy" : "tight")}>{density === "tight" ? v4("rctRoomy") : v4("rctTight")}</button>
        </div>
        <div className="c4-rct-bulk">
          <button type="button" className="c4-btn" onClick={() => setPicked(rows.map((recital) => recital.id))}>{v4("rctPickAll")}</button>
          <button type="button" className="c4-btn" onClick={() => setPicked([])}>{v4("rctPickNone")}</button>
          <span>{v4("rctPicked")} · {picked.length}</span>
          <select className="c4-field" aria-label={v4("rctBulkHall")} value={moveHall} onChange={(event) => setMoveHall(event.target.value)}>
            {HALLS.map((item) => <option key={item} value={item}>{hallLabel(v4, item)}</option>)}
          </select>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkRecitalHall(recitals, picked, moveHall))}>{v4("rctBulkHall")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkRecitalPin(recitals, picked, true))}>{v4("rctBulkPin")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkRecitalClose(recitals, picked, true))}>{v4("rctBulkClose")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkRecitalTag(recitals, picked, tag || "a"))}>{v4("rctBulkTag")}</button>
          <button type="button" className="c4-btn" onClick={() => download("salon-recitals.csv", recitalsCsv(recitals, deskBell))}>{v4("rctCsv")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetRecitals())}>{v4("rctReset")}</button>
        </div>
        {!rows.length && <p className="c4-rct-empty">{v4("rctEmpty")}</p>}
        <ol className={board === "timeline" ? "c4-rct-time" : "c4-rct-book"}>
          {rows.map((recital, index) => (
            <li key={recital.id} data-focus={index === focusAt ? "1" : "0"} data-late={lateRecital(recital, deskBell) ? "1" : "0"} data-soon={soonRecital(recital) ? "1" : "0"} data-house={houseHall(recital.hall) ? "1" : "0"} data-peak={peakBell(recital.bell) ? "1" : "0"} data-quiet={quietBell(recital.bell) ? "1" : "0"} data-hall={recital.hall.toLowerCase() || "blank"}>
              <p className="c4-rct-stamp">{recital.bell ?? "—"}</p>
              <div>
                <label className="c4-row">
                  <input type="checkbox" checked={picked.includes(recital.id)} aria-label={recital.title} onChange={(event) => setPicked((ids) => event.target.checked ? [...ids, recital.id] : ids.filter((id) => id !== recital.id))} />
                  <strong>{recital.title}</strong>
                </label>
                <p className="c4-meta">{recital.usher || v4("rctBlankUsher")} · {hallLabel(v4, recital.hall)} · {cueLabel(v4, recital.cue)} · {candleLabel(v4, recital.candle)} · {spanLabel(v4, recital.span)}</p>
                <p className="c4-meta">{recital.tags.length ? recital.tags.join(" ") : v4("rctBlankTag")} · {gapLabel(v4, recital.bell, deskBell)} · {auditLabel(v4, recital.audit)}</p>
                {recital.note && <p>{recital.note}</p>}
                {editing === recital.id && (
                  <div className="c4-rct-edit">
                    <input className="c4-field" aria-label={v4("rctLine")} value={draft} onChange={(event) => setDraft(event.target.value)} />
                    <input className="c4-field" aria-label={v4("rctNote")} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} />
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(editRecitalNote(editRecital(recitals, recital.id, draft), recital.id, noteDraft)); setEditing(""); }}>{v4("rctEdit")}</button>
                  </div>
                )}
                <div className="c4-row">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleCue(recitals, recital.id))}>{v4("rctCueUp")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRecitalPin(recitals, recital.id, !recital.pinned))}>{recital.pinned ? v4("rctUnpin") : v4("rctPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRecitalHold(recitals, recital.id, !recital.held))}>{recital.held ? v4("rctLift") : v4("rctHold")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRecitalClose(recitals, recital.id, !recital.closed))}>{recital.closed ? v4("rctReopen") : v4("rctClose")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRecitalRest(recitals, recital.id, recital.rest ? 0 : 15))}>{recital.rest ? v4("rctRestOff") : v4("rctRestOn")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(recital.id); setDraft(recital.title); setNoteDraft(recital.note); }}>{v4("rctEdit")}</button>
                  <button type="button" className="c4-btn" onClick={() => { const line = recitalCopy(recital, deskBell); void navigator.clipboard?.writeText(line); setCopied(recital.id); }}>{copied === recital.id ? v4("rctCopied") : v4("rctCopy")}</button>
                </div>
              </div>
            </li>
          ))}
        </ol>
        <p className="c4-rct-rules">{v4("rctRules")}</p>
      </div>
    </section>
  );
}

export function UsernameSeals({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [band, setBand] = useState("all");
  const [tone, setTone] = useState("all");
  const [shape, setShape] = useState<SealShape>("all");
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
    note: { username: user.username ?? null },
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
    const present = presentSeals(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenSeals(readJson(UNS_KEY, []), present);
    const nextReviewed = readReviewedSeals(readJson(UNS_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(UNS_KEY, nextHidden);
    writeJson(UNS_REVIEW_KEY, nextReviewed);
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
  const present = presentSeals(rows);
  const bands = visibleSealBands(present, hidden, showHidden);
  const bandOn = activeSealBand(band, present);
  const toneOn = activeSealTone(tone);
  const shown = visibleSealCustomers(rows, sealBandArg(bandOn), sealToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = sealState(row.note);
      const token = state === "set" ? sealBand(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return bands.includes(token);
    });
  const lead = leadingSeal(rows);
  const toneLead = leadingSealTone(rows);
  const shared = sharedSealCount(rows);
  const catalog = catalogSealCount(rows);
  const bars = sealBands(rows).filter((line) => line.band);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(UNS_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedSeals(next, ids);
    setReviewed(saved);
    writeJson(UNS_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-uns" aria-label={v4("unsTitle")} data-seals="1" data-role={role} data-catalog={catalog ? "1" : "0"}>
      <div className="c4-uns-sheet">
        <header className="c4-uns-mast">
          <div>
            <p className="c4-uns-kicker">{v4("unsSub")}</p>
            <h2 className="c4-title">{v4("unsTitle")}</h2>
          </div>
          <p className="c4-uns-plate" data-logo="mono">{v4("unsLogo")}</p>
        </header>
        <p className="c4-uns-rules">{v4("unsHint")}</p>
        <p className="c4-meta">{v4("unsKept")} {v4("unsEscape")}</p>
        {viewer && <p className="c4-uns-notice" data-viewer="1">{v4("unsViewer")}</p>}
        {data.error && <p className="c4-uns-empty" role="alert">{v4("unsFailed")}</p>}
        {data.loading && <p className="c4-meta">{v4("unsLoading")}</p>}
        {shared > 0 && <p className="c4-uns-notice" role="status">{v4("unsNotice")} · {shared}</p>}
        <ol className="c4-uns-ledger" aria-label={v4("unsKpi")}>
          <li><span>{v4("unsSet")}</span><strong>{rows.filter((row) => sealState(row.note) === "set").length}</strong></li>
          <li><span>{v4("unsCatalog")}</span><strong>{catalog}</strong></li>
          <li><span>{v4("unsBarCount")}</span><strong>{barSealCount(rows)}</strong></li>
          <li><span>{v4("unsPlainCount")}</span><strong>{plainSealCount(rows)}</strong></li>
          <li><span>{v4("unsShare")}</span><strong>{sealShare(catalog, rows.length)}%</strong></li>
          <li><span>{v4("unsShared")}</span><strong>{shared}</strong></li>
        </ol>
        <div className="c4-uns-rail" aria-label={v4("unsBands")}>
          {bars.map((bar) => (
            <div key={bar.band} className="c4-uns-meter">
              <button type="button" className="c4-btn" onClick={() => setBand(bar.band)}>{bandLabel(v4, bar.band)} · {bar.count}</button>
              <div className="c4-uns-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            </div>
          ))}
          {!bars.length && <p className="c4-uns-empty">{v4("unsEmpty")}</p>}
        </div>
        <div className="c4-uns-suggest">
          <p>{v4("unsLeading")} · {lead ? bandLabel(v4, lead) : v4("unsLeadingNone")}</p>
          <p>{v4("unsToneLead")} · {toneLead ? toneLabel(v4, toneLead) : v4("unsToneNone")}</p>
          <p>{shared ? `${v4("unsShared")} · ${shared}` : v4("unsSharedNone")}</p>
        </div>
        <label className="c4-lab">{v4("unsSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("unsSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <div className="c4-uns-filters">
          <button type="button" className="c4-chip" data-on={bandOn === "all" ? "1" : "0"} onClick={() => setBand("all")}>{v4("unsAll")}</button>
          <button type="button" className="c4-chip" data-on={bandOn === "blank" ? "1" : "0"} onClick={() => setBand("blank")}>{v4("unsClear")}</button>
          {BANDS.map((item) => (
            <button key={item} type="button" className="c4-chip" data-on={bandOn === item ? "1" : "0"} onClick={() => setBand(item)}>{bandLabel(v4, item)}</button>
          ))}
          <button type="button" className="c4-chip" data-on={toneOn === "all" ? "1" : "0"} onClick={() => setTone("all")}>{v4("unsTone")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "cipher" ? "1" : "0"} onClick={() => setTone("cipher")}>{v4("unsCipher")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "plain" ? "1" : "0"} onClick={() => setTone("plain")}>{v4("unsPlain")}</button>
          {(["all", "catalog", "bar", "plain"] as const).map((item) => (
            <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{item === "all" ? v4("unsAllShapes") : item === "catalog" ? v4("unsCatalog") : item === "bar" ? v4("unsBar") : v4("unsPlain")}</button>
          ))}
          <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} onClick={() => setReview("all")}>{v4("unsAllReview")}</button>
          <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview("reviewed")}>{v4("unsReviewed")}</button>
          <button type="button" className="c4-chip" data-on={review === "open" ? "1" : "0"} onClick={() => setReview("open")}>{v4("unsOpenReview")}</button>
          <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("unsShown") : v4("unsHidden")}</button>
        </div>
        <div className="c4-uns-bands">
          {present.map((item) => (
            <button key={item} type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleSeal(hidden, item))}>
              {bandLabel(v4, item)} · {hidden.includes(item) ? v4("unsShow") : v4("unsHide")}
            </button>
          ))}
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkSealReview(reviewed, shown.map((row) => row.id), true))}>{v4("unsBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkSealReview(reviewed, ids, false))}>{v4("unsBulkClear")}</button>
          <button type="button" className="c4-btn" onClick={() => download("username-seals.csv", sealsCsv(rows))}>{v4("unsCsv")}</button>
          <button type="button" className="c4-btn" onClick={() => download("username-seal-rows.csv", sealRowsCsv(rows, reviewed))}>{v4("unsRowCsv")}</button>
          <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("unsCustomers")}</Link>
        </div>
        {!shown.length && <p className="c4-uns-empty">{v4("unsEmpty")}</p>}
        <ul className="c4-uns-index">
          {shown.map((row) => {
            const state = sealState(row.note);
            const mark = sealOf(row.note);
            return (
              <li key={row.id} data-state={state || "blank"} data-band={state === "set" ? sealBand(row.note) : "blank"} data-tone={sealTone(row.note) || "blank"} data-catalog={catalogSeal(row.note) ? "1" : "0"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"}>
                <p className="c4-uns-mark" data-logo="mono">{mark || "—"}</p>
                <div>
                  <strong>{row.label || row.id}</strong>
                  <span className="c4-meta">{bandLabel(v4, state === "set" ? sealBand(row.note) : state === "clear" ? "blank" : "")} · {toneLabel(v4, sealTone(row.note))}</span>
                  {catalogSeal(row.note) && <span className="c4-meta">{v4("unsCatalogMark")}</span>}
                  <div className="c4-row">
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleSealReview(reviewed, row.id))}>{v4("unsReview")}</button>
                    <button type="button" className="c4-btn" onClick={() => { const line = sealCopy(row.note); void navigator.clipboard?.writeText(line); setCopied(row.id); }}>{copied === row.id ? v4("unsCopied") : v4("unsCopy")}</button>
                    <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{row.label || row.id}</Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="c4-uns-rules">{v4("unsRules")}</p>
      </div>
    </section>
  );
}
