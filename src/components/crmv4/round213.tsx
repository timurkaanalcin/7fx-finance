"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  ADR_KEY,
  ADR_REVIEW_KEY,
  NXC_DENSITY_KEY,
  NXC_KEY,
  NXC_VIEW_KEY,
  activeDrip,
  activeHour,
  activeKeeper,
  activePlateLane,
  activePlateTone,
  activeTone,
  activeWax,
  activeWick,
  addCandle,
  addCandleMark,
  addCandleView,
  adjacentCandleCount,
  bulkCandleClose,
  bulkCandleMark,
  bulkCandlePin,
  bulkCandleTone,
  bulkCandleWax,
  bulkPlateReview,
  busiestKeeper,
  candleCopy,
  candleCounts,
  candleKeepers,
  candleLedger,
  candleShare,
  candleWaxes,
  candlesCsv,
  catalogPlate,
  catalogPlateCount,
  clashHourCount,
  cycleTone,
  densityOf,
  dripArg,
  dripLoad,
  dropCandleView,
  editCandle,
  editCandleNote,
  fairKeeper,
  giltPlateCount,
  holdFocused,
  hourArg,
  hourGap,
  hourSpan,
  houseWax,
  keeperArg,
  lateCandle,
  lateShare,
  leadingPlate,
  leadingPlateTone,
  matchedCandles,
  moveFocus,
  nextCandle,
  pairKeeperCount,
  peakHour,
  pinFocused,
  plateCopy,
  plateLane,
  plateLaneArg,
  plateLanes,
  plateOf,
  plateRowsCsv,
  plateShare,
  plateState,
  plateTone,
  plateToneArg,
  platesCsv,
  presentPlates,
  quietHour,
  quietHouseCount,
  readCandleViews,
  readCandles,
  readHiddenPlates,
  readReviewedPlates,
  reminderCandles,
  resetCandles,
  setCandleClose,
  setCandleDrip,
  setCandleHold,
  setCandlePin,
  sharedPlateCount,
  sharedWaxCount,
  snoozeCandle,
  snoozeFocused,
  soonCandle,
  sortCandles,
  sortMode,
  strikeLoad,
  suggestKeeper,
  suggestWax,
  suggestWick,
  togglePlate,
  togglePlateReview,
  toneArg,
  usedHours,
  visibleCandles,
  visiblePlateCustomers,
  visiblePlateLanes,
  waxArg,
  wickArg,
  wickClashCount,
  widePlateCount,
  windowCandles,
  type CandleDensity,
  type CandleSort,
  type CandleTray,
  type CandleView,
  type NarthexCandle,
  type PlateRow,
  type PlateShape,
} from "@/lib/crmv4/round213";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  address?: string | null;
};

type GlanceRow = PlateRow & { id: string };

const WAXES = ["tallow", "bees", "gilt"] as const;
const TONES = ["hush", "ring", "strike"] as const;
const LANES = ["west", "center", "east"] as const;

function waxLabel(v4: V4, wax: string): string {
  if (wax === "tallow" || wax === "TALLOW") return v4("nxcTallow");
  if (wax === "bees" || wax === "BEES") return v4("nxcBees");
  if (wax === "gilt" || wax === "GILT") return v4("nxcGilt");
  return v4("nxcBlankWax");
}

function toneLabel(v4: V4, tone: string): string {
  if (tone === "hush") return v4("nxcHush");
  if (tone === "ring") return v4("nxcRing");
  if (tone === "strike") return v4("nxcStrike");
  return v4("nxcBlankTone");
}

function wickLabel(v4: V4, wick: number | null): string {
  if (wick === 4) return v4("nxcWick4");
  if (wick === 8) return v4("nxcWick8");
  if (wick === 16) return v4("nxcWick16");
  return v4("nxcBlankWick");
}

function laneLabel(v4: V4, name: string): string {
  if (name === "west") return v4("adrWest");
  if (name === "center") return v4("adrCenter");
  if (name === "east") return v4("adrEast");
  if (name === "blank") return v4("adrClear");
  return v4("adrUnmarked");
}

function plateToneLabel(v4: V4, name: string): string {
  if (name === "gilt") return v4("adrGilt");
  if (name === "ink") return v4("adrInk");
  if (name === "ivory") return v4("adrIvory");
  if (name === "mist") return v4("adrMist");
  if (name === "plain") return v4("adrPlain");
  return v4("adrUnmarked");
}

function auditLabel(v4: V4, audit: string): string {
  const key = {
    save: "nxcAuditSave",
    edit: "nxcAuditEdit",
    tone: "nxcAuditTone",
    pin: "nxcAuditPin",
    unpin: "nxcAuditUnpin",
    hold: "nxcAuditHold",
    lift: "nxcAuditLift",
    close: "nxcAuditClose",
    open: "nxcAuditOpen",
    wax: "nxcAuditWax",
    mark: "nxcAuditMark",
    drip: "nxcAuditDrip",
    wick: "nxcAuditWick",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, hour: number | null, desk: string): string {
  const gap = hourGap(hour, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("nxcPast")} ${gap}`;
  if (gap < 0) return `${v4("nxcAhead")} ${Math.abs(gap)}`;
  return v4("nxcDue");
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

export function NarthexCandles({ v4 }: { v4: V4 }) {
  const [candles, setCandles] = useState<NarthexCandle[]>([]);
  const [views, setViews] = useState<CandleView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [keeper, setKeeper] = useState("");
  const [hour, setHour] = useState("");
  const [wax, setWax] = useState("");
  const [tone, setTone] = useState("");
  const [wickValue, setWickValue] = useState("");
  const [mark, setMark] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<CandleTray>("open");
  const [keeperFilter, setKeeperFilter] = useState("all");
  const [waxFilter, setWaxFilter] = useState("all");
  const [toneFilter, setToneFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [wickFilter, setWickFilter] = useState("all");
  const [dripFilter, setDripFilter] = useState("all");
  const [strikeOnly, setStrikeOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [dryOnly, setDryOnly] = useState(false);
  const [board, setBoard] = useState<"gallery" | "ledger">("gallery");
  const [order, setOrder] = useState<CandleSort>("hour");
  const [density, setDensity] = useState<CandleDensity>("tall");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [deskHour, setDeskHour] = useState("");
  const [moveWax, setMoveWax] = useState("tallow");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<() => void>(() => {});
  const wickRef = useRef<() => void>(() => {});
  const holdRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readCandles(readJson(NXC_KEY, []));
    const saved = readCandleViews(readJson(NXC_VIEW_KEY, []));
    setCandles(next);
    setViews(saved);
    setDensity(densityOf(readJson(NXC_DENSITY_KEY, "tall")));
    writeJson(NXC_KEY, next);
    writeJson(NXC_VIEW_KEY, saved);
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: NarthexCandle[]) {
    const saved = readCandles(next);
    setCandles(saved);
    writeJson(NXC_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((candle) => candle.id === id)));
  }
  function storeViews(next: CandleView[]) {
    const saved = readCandleViews(next);
    setViews(saved);
    writeJson(NXC_VIEW_KEY, saved);
  }
  function storeDensity(next: CandleDensity) {
    setDensity(next);
    writeJson(NXC_DENSITY_KEY, next);
  }
  const keepers = candleKeepers(candles);
  const waxes = candleWaxes(candles);
  const bars = WAXES.map((item) => ({ wax: item.toUpperCase(), count: candles.filter((candle) => candle.wax === item.toUpperCase()).length })).filter((row) => row.count > 0);
  const keeperOn = activeKeeper(keeperFilter, keepers);
  const waxOn = activeWax(waxFilter, waxes);
  const toneOn = activeTone(toneFilter, ["hush", "ring", "strike"]);
  const hourOn = activeHour(hourFilter);
  const wickOn = activeWick(wickFilter);
  const dripOn = activeDrip(dripFilter);
  const pickedHour = hourArg(hourOn);
  const shown = sortCandles(visibleCandles(
    candles,
    tray,
    query,
    keeperArg(keeperOn),
    waxArg(waxOn),
    toneArg(toneOn),
    pickedHour.exact,
    pickedHour.pick,
    wickArg(wickOn),
    dripArg(dripOn),
    strikeOnly,
    peakOnly,
    houseOnly,
    quietOnly,
    dryOnly,
  ), order);
  const ledger = candleLedger(candles, query);
  const counts = candleCounts(candles, deskHour);
  const clashes = clashHourCount(candles);
  const wicks = wickClashCount(candles);
  const neighbors = adjacentCandleCount(candles);
  const nextId = nextCandle(candles, deskHour);
  const nextRow = candles.find((candle) => candle.id === nextId);
  const suggestedWax = suggestWax(candles);
  const suggestedKeeper = suggestKeeper(candles);
  const suggestedWick = suggestWick(candles);
  const fair = fairKeeper(candles, roster);
  const busy = busiestKeeper(candles);
  const reminders = reminderCandles(candles, deskHour);
  const windowRows = windowCandles(candles, deskHour);
  const share = lateShare(candles, deskHour);
  const matched = matchedCandles(candles, deskHour);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  pinRef.current = () => {
    if (viewer) return;
    const ids = (board === "ledger" ? ledger : shown).map((candle) => candle.id);
    store(pinFocused(candles, ids, focus));
  };
  wickRef.current = () => {
    if (viewer) return;
    const ids = (board === "ledger" ? ledger : shown).map((candle) => candle.id);
    store(snoozeFocused(candles, ids, focus));
  };
  holdRef.current = () => {
    if (viewer) return;
    const ids = (board === "ledger" ? ledger : shown).map((candle) => candle.id);
    store(holdFocused(candles, ids, focus));
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
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        wickRef.current();
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        holdRef.current();
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
    setKeeper("");
    setHour("");
    setWax("");
    setTone("");
    setWickValue("");
    setMark("");
    setQuery("");
    setEditing("");
  }
  function applyView(view: CandleView) {
    setTray(view.tray);
    setQuery(view.query);
    setKeeperFilter(view.keeper);
    setWaxFilter(view.wax);
    setToneFilter(view.tone);
    setHourFilter(view.hour);
    setWickFilter(view.wick);
    setDripFilter(view.drip);
  }
  const rows = board === "ledger" ? ledger : shown;
  return (
    <section className="c4-nxc" aria-label={v4("nxcTitle")} data-candles="1" data-role={role} data-density={density}>
      <div className="c4-nxc-sheet">
        <header className="c4-nxc-mast">
          <p className="c4-nxc-spine">{v4("nxcSpine")}</p>
          <div>
            <p className="c4-nxc-kicker">{v4("nxcSub")}</p>
            <h2 className="c4-title">{v4("nxcTitle")}</h2>
          </div>
          <p className="c4-nxc-plate" data-logo="mono">{v4("nxcLogo")}</p>
        </header>
        <div className="c4-nxc-body">
          <p className="c4-nxc-rules">{v4("nxcHint")}</p>
          <p className="c4-meta">{v4("nxcLocal")}</p>
          <p className="c4-meta">{v4("nxcNew")} {v4("nxcSlash")} {v4("nxcEscape")} {v4("nxcKeys")} {v4("nxcPinKey")} {v4("nxcWickKey")} {v4("nxcHoldKey")} {v4("nxcBoardKey")}</p>
          {viewer && <p className="c4-nxc-notice" data-viewer="1">{v4("nxcViewer")}</p>}
          {counts.peak > 0 && (
            <p className="c4-nxc-notice" role="status">
              {v4("nxcNotice")} · {counts.peak}
              <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("nxcNoticeAll") : v4("nxcNoticePeak")}</button>
            </p>
          )}
          {counts.late > 0 && <p className="c4-nxc-notice" role="status" data-late="1">{v4("nxcLateNotice")} · {counts.late}</p>}
          <ol className="c4-nxc-ledger" aria-label={v4("nxcKpi")}>
            <li><span>{v4("nxcOpen")}</span><strong>{counts.open}</strong></li>
            <li><span>{v4("nxcHeld")}</span><strong>{counts.held}</strong></li>
            <li><span>{v4("nxcClosed")}</span><strong>{counts.closed}</strong></li>
            <li><span>{v4("nxcPinned")}</span><strong>{counts.pinned}</strong></li>
            <li><span>{v4("nxcPeak")}</span><strong>{counts.peak}</strong></li>
            <li><span>{v4("nxcLate")}</span><strong>{counts.late}</strong></li>
            <li><span>{v4("nxcSoon")}</span><strong>{counts.soon}</strong></li>
            <li><span>{v4("nxcDrip")}</span><strong>{counts.drip}</strong></li>
            <li><span>{v4("nxcMatched")}</span><strong>{matched}</strong></li>
            <li><span>{v4("nxcHouseShare")}</span><strong>{candleShare(counts.house, candles.length)}%</strong></li>
            <li><span>{v4("nxcLateShare")}</span><strong>{share}%</strong></li>
          </ol>
          <div className="c4-nxc-sla" aria-label={v4("nxcLateShare")}>
            <span>{v4("nxcLateShare")}</span>
            <div className="c4-nxc-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></div>
          </div>
          <div className="c4-nxc-rail" aria-label={v4("nxcWaxes")}>
            {bars.map((bar) => (
              <div key={bar.wax} className="c4-nxc-meter" data-wax={bar.wax.toLowerCase()}>
                <button type="button" className="c4-btn" onClick={() => setWaxFilter(bar.wax)}>{waxLabel(v4, bar.wax)} · {bar.count}</button>
                <div className="c4-nxc-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
              </div>
            ))}
            {!bars.length && <p className="c4-nxc-empty">{v4("nxcEmpty")}</p>}
          </div>
          <div className="c4-nxc-suggest">
            <p>{v4("nxcSuggestWax")} · {waxLabel(v4, suggestedWax)}</p>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setWax(suggestedWax.toLowerCase())}>{v4("nxcUseWax")}</button>
            <p>{v4("nxcSuggestKeeper")} · {suggestedKeeper || v4("nxcBlankKeeper")}</p>
            <button type="button" className="c4-btn" disabled={viewer || !suggestedKeeper} onClick={() => setKeeper(suggestedKeeper)}>{v4("nxcUseKeeper")}</button>
            <p>{v4("nxcSuggestWick")} · {wickLabel(v4, suggestedWick)}</p>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setWickValue(String(suggestedWick))}>{v4("nxcUseWick")}</button>
            <p>{v4("nxcAssign")} · {fair || v4("nxcBlankKeeper")}</p>
            <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setKeeper(fair)}>{v4("nxcAssign")}</button>
          </div>
          <p className="c4-meta">{v4("nxcHours")} · {usedHours(candles)}</p>
          <p className="c4-meta">{clashes ? `${v4("nxcClash")} · ${clashes}` : v4("nxcClashNone")}</p>
          <p className="c4-meta">{wicks ? `${v4("nxcWickClash")} · ${wicks}` : v4("nxcWickClashNone")}</p>
          <p className="c4-meta">{neighbors ? `${v4("nxcAdjacent")} · ${neighbors}` : v4("nxcAdjacentNone")}</p>
          <p className="c4-meta">{pairKeeperCount(candles) ? `${v4("nxcPairs")} · ${pairKeeperCount(candles)}` : v4("nxcPairsNone")}</p>
          <p className="c4-meta">{sharedWaxCount(candles) ? `${v4("nxcSharedWax")} · ${sharedWaxCount(candles)}` : v4("nxcSharedWaxNone")}</p>
          <p className="c4-meta">{`${v4("nxcDripLoad")} · ${dripLoad(candles)}`}</p>
          <p className="c4-meta">{`${v4("nxcQuietHouse")} · ${quietHouseCount(candles)}`}</p>
          <p className="c4-meta">{`${v4("nxcStrikeLoad")} · ${strikeLoad(candles)}`}</p>
          <p className="c4-meta">{`${v4("nxcHourSpan")} · ${hourSpan(candles)}`}</p>
          <p className="c4-meta">{nextRow ? `${v4("nxcNext")} · ${nextRow.title}` : v4("nxcNextNone")}</p>
          <p className="c4-meta">{busy ? `${v4("nxcBusiest")} · ${busy}` : v4("nxcBusiestNone")}</p>
          <div className="c4-nxc-reminders" aria-label={v4("nxcReminders")}>
            {reminders.length ? reminders.map((candle) => <span key={candle.id}>{candle.title}</span>) : <span>{v4("nxcReminderNone")}</span>}
          </div>
          <div className="c4-nxc-window" aria-label={v4("nxcWindow")}>
            {windowRows.length ? windowRows.map((candle) => <span key={candle.id}>{candle.title}</span>) : <span>{v4("nxcWindowNone")}</span>}
          </div>
          <label className="c4-lab">{v4("nxcSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("nxcSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <div className="c4-nxc-filters" role="group" aria-label={v4("nxcSearch")}>
            {(["open", "held", "closed"] as const).map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("nxcOpenTray") : item === "held" ? v4("nxcHeldTray") : v4("nxcClosedTray")}</button>
            ))}
            <button type="button" className="c4-chip" data-on={keeperOn === "all" ? "1" : "0"} onClick={() => setKeeperFilter("all")}>{v4("nxcAll")}</button>
            <button type="button" className="c4-chip" data-on={keeperOn === "blank" ? "1" : "0"} onClick={() => setKeeperFilter("blank")}>{v4("nxcBlankKeeper")}</button>
            {keepers.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={keeperOn === name ? "1" : "0"} onClick={() => setKeeperFilter(name)}>{name}</button>
            ))}
            <button type="button" className="c4-chip" data-on={waxOn === "all" ? "1" : "0"} onClick={() => setWaxFilter("all")}>{v4("nxcWax")}</button>
            <button type="button" className="c4-chip" data-on={waxOn === "blank" ? "1" : "0"} onClick={() => setWaxFilter("blank")}>{v4("nxcBlankWax")}</button>
            {WAXES.map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={waxOn === item.toUpperCase() ? "1" : "0"} onClick={() => setWaxFilter(item)}>{waxLabel(v4, item)}</button>
            ))}
            <button type="button" className="c4-chip" data-on={toneOn === "all" ? "1" : "0"} onClick={() => setToneFilter("all")}>{v4("nxcTone")}</button>
            {TONES.map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={toneOn === item ? "1" : "0"} onClick={() => setToneFilter(item)}>{toneLabel(v4, item)}</button>
            ))}
            {["all", "blank", "early", "mid", "late", "peak", "quiet", "1", "8"].map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={hourOn === item ? "1" : "0"} onClick={() => setHourFilter(item)}>{item === "all" ? v4("nxcHour") : item === "blank" ? v4("nxcBlankHour") : item === "early" ? v4("nxcEarly") : item === "mid" ? v4("nxcMid") : item === "late" ? v4("nxcLateHour") : item === "peak" ? v4("nxcPeak") : item === "quiet" ? v4("nxcQuiet") : item}</button>
            ))}
            {["all", "blank", "4", "8", "16"].map((item) => (
              <button key={`w${item}`} type="button" className="c4-chip" data-on={wickOn === item ? "1" : "0"} onClick={() => setWickFilter(item)}>{item === "all" ? v4("nxcWick") : item === "blank" ? v4("nxcBlankWick") : wickLabel(v4, Number(item))}</button>
            ))}
            {["all", "blank", "0", "2", "6"].map((item) => (
              <button key={`d${item}`} type="button" className="c4-chip" data-on={dripOn === item ? "1" : "0"} onClick={() => setDripFilter(item)}>{item === "all" ? v4("nxcDrip") : item === "blank" ? v4("nxcBlankDrip") : item}</button>
            ))}
            <button type="button" className="c4-chip" data-on={strikeOnly ? "1" : "0"} onClick={() => setStrikeOnly((on) => !on)}>{v4("nxcStrikeOnly")}</button>
            <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((on) => !on)}>{v4("nxcPeakOnly")}</button>
            <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((on) => !on)}>{v4("nxcHouseOnly")}</button>
            <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((on) => !on)}>{v4("nxcQuietOnly")}</button>
            <button type="button" className="c4-chip" data-on={dryOnly ? "1" : "0"} onClick={() => setDryOnly((on) => !on)}>{v4("nxcDryOnly")}</button>
            <button type="button" className="c4-chip" data-on={order === "hour" ? "1" : "0"} onClick={() => setOrder(sortMode("hour"))}>{v4("nxcSortHour")}</button>
            <button type="button" className="c4-chip" data-on={order === "keeper" ? "1" : "0"} onClick={() => setOrder(sortMode("keeper"))}>{v4("nxcSortKeeper")}</button>
            <button type="button" className="c4-chip" data-on={density === "tall" ? "1" : "0"} onClick={() => storeDensity("tall")}>{v4("nxcTall")}</button>
            <button type="button" className="c4-chip" data-on={density === "low" ? "1" : "0"} onClick={() => storeDensity("low")}>{v4("nxcLow")}</button>
            <button type="button" className="c4-chip" data-on={board === "gallery" ? "1" : "0"} onClick={() => setBoard("gallery")}>{v4("nxcGallery")}</button>
            <button type="button" className="c4-chip" data-on={board === "ledger" ? "1" : "0"} onClick={() => setBoard("ledger")}>{v4("nxcLedger")}</button>
          </div>
          <form className="c4-nxc-form" onSubmit={(event) => {
            event.preventDefault();
            if (viewer) return;
            store(addCandle(candles, { id: `nxc-${Date.now()}`, title, note, keeper, hour, wax, tone, wick: wickValue, marks: mark }));
            clearDraft();
          }}>
            <label className="c4-lab">{v4("nxcLine")}<input ref={titleRef} className="c4-field" aria-label={v4("nxcLine")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
            <label className="c4-lab">{v4("nxcNote")}<input className="c4-field" aria-label={v4("nxcNote")} value={note} onChange={(event) => setNote(event.target.value)} /></label>
            <label className="c4-lab">{v4("nxcKeeper")}<input className="c4-field" aria-label={v4("nxcKeeper")} value={keeper} onChange={(event) => setKeeper(event.target.value)} /></label>
            <label className="c4-lab">{v4("nxcHour")}<input className="c4-field" aria-label={v4("nxcHour")} value={hour} onChange={(event) => setHour(event.target.value)} /></label>
            <label className="c4-lab">{v4("nxcWax")}<input className="c4-field" aria-label={v4("nxcWax")} value={wax} onChange={(event) => setWax(event.target.value)} /></label>
            <label className="c4-lab">{v4("nxcTone")}<input className="c4-field" aria-label={v4("nxcTone")} value={tone} onChange={(event) => setTone(event.target.value)} /></label>
            <label className="c4-lab">{v4("nxcWick")}<input className="c4-field" aria-label={v4("nxcWick")} value={wickValue} onChange={(event) => setWickValue(event.target.value)} /></label>
            <label className="c4-lab">{v4("nxcMark")}<input className="c4-field" aria-label={v4("nxcMark")} value={mark} onChange={(event) => setMark(event.target.value)} /></label>
            <button type="submit" className="c4-btn" disabled={viewer}>{v4("nxcSave")}</button>
          </form>
          <label className="c4-lab">{v4("nxcDeskHour")}<input className="c4-field" aria-label={v4("nxcDeskHour")} value={deskHour} onChange={(event) => setDeskHour(event.target.value)} /></label>
          <label className="c4-lab">{v4("nxcRoster")}<input className="c4-field" aria-label={v4("nxcRoster")} value={roster} onChange={(event) => setRoster(event.target.value)} /></label>
          <div className="c4-nxc-views">
            <label className="c4-lab">{v4("nxcViewName")}<input className="c4-field" aria-label={v4("nxcViewName")} value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
              const name = viewName.trim();
              if (!name) return;
              storeViews(addCandleView(views, { id: `view-${Date.now()}`, name, tray, query, keeper: keeperOn, wax: waxOn, tone: toneOn, hour: hourOn, wick: wickOn, drip: dripOn }));
              setViewName("");
            }}>{v4("nxcSaveView")}</button>
            {views.map((view) => (
              <span key={view.id}>
                <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
                <button type="button" className="c4-btn" disabled={viewer} aria-label={v4("nxcDropView")} onClick={() => storeViews(dropCandleView(views, view.id))}>×</button>
              </span>
            ))}
          </div>
          <div className="c4-nxc-bulk">
            <label className="c4-lab">{v4("nxcBulkWax")}<input className="c4-field" aria-label={v4("nxcBulkWax")} value={moveWax} onChange={(event) => setMoveWax(event.target.value)} /></label>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkCandleWax(candles, picked, moveWax))}>{v4("nxcBulkWax")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkCandlePin(candles, picked, true))}>{v4("nxcBulkPin")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkCandleClose(candles, picked, true))}>{v4("nxcBulkClose")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkCandleMark(candles, picked, mark))}>{v4("nxcBulkMark")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkCandleTone(candles, picked, tone))}>{v4("nxcBulkTone")}</button>
            <button type="button" className="c4-btn" onClick={() => download("narthex-candles.csv", candlesCsv(candles, deskHour))}>{v4("nxcCsv")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetCandles())}>{v4("nxcReset")}</button>
          </div>
          {!rows.length && <p className="c4-nxc-empty">{v4("nxcEmpty")}</p>}
          <ol className={board === "ledger" ? "c4-nxc-time" : "c4-nxc-book"}>
            {rows.map((candle, index) => (
              <li key={candle.id} data-focus={focus === index ? "1" : "0"} data-late={lateCandle(candle, deskHour) ? "1" : "0"} data-soon={soonCandle(candle) ? "1" : "0"} data-peak={peakHour(candle.hour) ? "1" : "0"} data-quiet={quietHour(candle.hour) ? "1" : "0"} data-house={houseWax(candle.wax) ? "1" : "0"} data-pinned={candle.pinned ? "1" : "0"} data-drip={candle.drip ? "1" : "0"}>
                <label className="c4-check"><input type="checkbox" checked={picked.includes(candle.id)} onChange={() => setPicked((ids) => ids.includes(candle.id) ? ids.filter((id) => id !== candle.id) : [...ids, candle.id])} /><span>{candle.hour ?? "—"}</span></label>
                <div>
                  {editing === candle.id ? (
                    <div className="c4-row">
                      <input className="c4-field" aria-label={v4("nxcLine")} value={draft} onChange={(event) => setDraft(event.target.value)} />
                      <input className="c4-field" aria-label={v4("nxcNote")} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} />
                      <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(editCandleNote(editCandle(candles, candle.id, draft), candle.id, noteDraft)); setEditing(""); }}>{v4("nxcSave")}</button>
                    </div>
                  ) : (
                    <>
                      <strong>{candle.title}</strong>
                      <span className="c4-meta">{candle.keeper || v4("nxcBlankKeeper")} · {waxLabel(v4, candle.wax)} · {toneLabel(v4, candle.tone)} · {wickLabel(v4, candle.wick)} · {gapLabel(v4, candle.hour, deskHour)}</span>
                      {candle.note && <p>{candle.note}</p>}
                      {!!candle.marks.length && <p className="c4-meta">{candle.marks.join(" ")}</p>}
                      {candle.audit && <p className="c4-meta">{auditLabel(v4, candle.audit)}</p>}
                    </>
                  )}
                  <div className="c4-row">
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCandlePin(candles, candle.id, !candle.pinned))}>{candle.pinned ? v4("nxcUnpin") : v4("nxcPin")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCandleHold(candles, candle.id, !candle.held))}>{candle.held ? v4("nxcLift") : v4("nxcHold")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleTone(candles, candle.id))}>{v4("nxcTone")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addCandleMark(candles, candle.id, mark))}>{v4("nxcMark")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCandleClose(candles, candle.id, !candle.closed))}>{candle.closed ? v4("nxcReopen") : v4("nxcClose")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCandleDrip(candles, candle.id, candle.drip ? 0 : 2))}>{candle.drip ? v4("nxcDripOff") : v4("nxcDripOn")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(snoozeCandle(candles, candle.id))}>{v4("nxcSnooze")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(candle.id); setDraft(candle.title); setNoteDraft(candle.note); }}>{v4("nxcEdit")}</button>
                    <button type="button" className="c4-btn" onClick={() => { const line = candleCopy(candle, deskHour); void navigator.clipboard?.writeText(line); setCopied(candle.id); }}>{copied === candle.id ? v4("nxcCopied") : v4("nxcCopy")}</button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <p className="c4-nxc-rules">{v4("nxcRules")}</p>
        </div>
      </div>
    </section>
  );
}

export function AddressPlates({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("all");
  const [tone, setTone] = useState("all");
  const [shape, setShape] = useState<PlateShape>("all");
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
    note: { address: user.address ?? null },
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
    const present = presentPlates(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenPlates(readJson(ADR_KEY, []), present);
    const nextReviewed = readReviewedPlates(readJson(ADR_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(ADR_KEY, nextHidden);
    writeJson(ADR_REVIEW_KEY, nextReviewed);
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
  const present = presentPlates(rows);
  const lanes = visiblePlateLanes(present, hidden, showHidden);
  const laneOn = activePlateLane(lane, present);
  const toneOn = activePlateTone(tone);
  const shown = visiblePlateCustomers(rows, plateLaneArg(laneOn), plateToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = plateState(row.note);
      const token = state === "set" ? plateLane(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return lanes.includes(token);
    });
  const lead = leadingPlate(rows);
  const toneLead = leadingPlateTone(rows);
  const shared = sharedPlateCount(rows);
  const catalog = catalogPlateCount(rows);
  const bars = plateLanes(rows).filter((line) => line.lane);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(ADR_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedPlates(next, ids);
    setReviewed(saved);
    writeJson(ADR_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-adr" aria-label={v4("adrTitle")} data-plates="1" data-role={role} data-catalog={catalog ? "1" : "0"}>
      <div className="c4-adr-sheet">
        <header className="c4-adr-mast">
          <div>
            <p className="c4-adr-kicker">{v4("adrSub")}</p>
            <h2 className="c4-title">{v4("adrTitle")}</h2>
          </div>
          <p className="c4-adr-plate" data-logo="mono">{v4("adrLogo")}</p>
        </header>
        <p className="c4-adr-rules">{v4("adrHint")}</p>
        <p className="c4-meta">{v4("adrKept")} {v4("adrEscape")}</p>
        {viewer && <p className="c4-adr-notice" data-viewer="1">{v4("adrViewer")}</p>}
        {data.error && <p className="c4-adr-empty" role="alert">{v4("adrFailed")}</p>}
        {data.loading && <p className="c4-meta">{v4("adrLoading")}</p>}
        {shared > 0 && <p className="c4-adr-notice" role="status">{v4("adrNotice")} · {shared}</p>}
        <ol className="c4-adr-ledger" aria-label={v4("adrKpi")}>
          <li><span>{v4("adrSet")}</span><strong>{rows.filter((row) => plateState(row.note) === "set").length}</strong></li>
          <li><span>{v4("adrCatalog")}</span><strong>{catalog}</strong></li>
          <li><span>{v4("adrWide")}</span><strong>{widePlateCount(rows)}</strong></li>
          <li><span>{v4("adrGiltCount")}</span><strong>{giltPlateCount(rows)}</strong></li>
          <li><span>{v4("adrShare")}</span><strong>{plateShare(catalog, rows.length)}%</strong></li>
          <li><span>{v4("adrShared")}</span><strong>{shared}</strong></li>
        </ol>
        <div className="c4-adr-rail" aria-label={v4("adrLanes")}>
          {bars.map((bar) => (
            <div key={bar.lane} className="c4-adr-meter">
              <button type="button" className="c4-btn" onClick={() => setLane(bar.lane)}>{laneLabel(v4, bar.lane)} · {bar.count}</button>
              <div className="c4-adr-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            </div>
          ))}
          {!bars.length && <p className="c4-adr-empty">{v4("adrEmpty")}</p>}
        </div>
        <div className="c4-adr-suggest">
          <p>{v4("adrLeading")} · {lead ? laneLabel(v4, lead) : v4("adrLeadingNone")}</p>
          <p>{v4("adrToneLead")} · {toneLead ? plateToneLabel(v4, toneLead) : v4("adrToneNone")}</p>
          <p>{shared ? `${v4("adrShared")} · ${shared}` : v4("adrSharedNone")}</p>
        </div>
        <label className="c4-lab">{v4("adrSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("adrSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <div className="c4-adr-filters">
          <button type="button" className="c4-chip" data-on={laneOn === "all" ? "1" : "0"} onClick={() => setLane("all")}>{v4("adrAll")}</button>
          <button type="button" className="c4-chip" data-on={laneOn === "blank" ? "1" : "0"} onClick={() => setLane("blank")}>{v4("adrClear")}</button>
          {LANES.map((item) => (
            <button key={item} type="button" className="c4-chip" data-on={laneOn === item ? "1" : "0"} onClick={() => setLane(item)}>{laneLabel(v4, item)}</button>
          ))}
          <button type="button" className="c4-chip" data-on={toneOn === "all" ? "1" : "0"} onClick={() => setTone("all")}>{v4("adrTone")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "gilt" ? "1" : "0"} onClick={() => setTone("gilt")}>{v4("adrGilt")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "ink" ? "1" : "0"} onClick={() => setTone("ink")}>{v4("adrInk")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "ivory" ? "1" : "0"} onClick={() => setTone("ivory")}>{v4("adrIvory")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "mist" ? "1" : "0"} onClick={() => setTone("mist")}>{v4("adrMist")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "plain" ? "1" : "0"} onClick={() => setTone("plain")}>{v4("adrPlain")}</button>
          {(["all", "catalog", "wide", "gilt"] as const).map((item) => (
            <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{item === "all" ? v4("adrAllShapes") : item === "catalog" ? v4("adrCatalog") : item === "wide" ? v4("adrWide") : v4("adrGilt")}</button>
          ))}
          <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} onClick={() => setReview("all")}>{v4("adrAllReview")}</button>
          <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview("reviewed")}>{v4("adrReviewed")}</button>
          <button type="button" className="c4-chip" data-on={review === "open" ? "1" : "0"} onClick={() => setReview("open")}>{v4("adrOpenReview")}</button>
          <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("adrShown") : v4("adrHidden")}</button>
        </div>
        <div className="c4-adr-bands">
          {present.map((item) => (
            <button key={item} type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(togglePlate(hidden, item))}>
              {laneLabel(v4, item)} · {hidden.includes(item) ? v4("adrShow") : v4("adrHide")}
            </button>
          ))}
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkPlateReview(reviewed, shown.map((row) => row.id), true))}>{v4("adrBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkPlateReview(reviewed, ids, false))}>{v4("adrBulkClear")}</button>
          <button type="button" className="c4-btn" onClick={() => download("address-plates.csv", platesCsv(rows))}>{v4("adrCsv")}</button>
          <button type="button" className="c4-btn" onClick={() => download("address-plate-rows.csv", plateRowsCsv(rows, reviewed))}>{v4("adrRowCsv")}</button>
          <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("adrCustomers")}</Link>
        </div>
        {!shown.length && <p className="c4-adr-empty">{v4("adrEmpty")}</p>}
        <ul className="c4-adr-index">
          {shown.map((row) => {
            const state = plateState(row.note);
            const mark = plateOf(row.note);
            return (
              <li key={row.id} data-state={state || "blank"} data-lane={state === "set" ? plateLane(row.note) : "blank"} data-tone={plateTone(row.note) || "blank"} data-catalog={catalogPlate(row.note) ? "1" : "0"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"}>
                <p className="c4-adr-mark" data-logo="mono">{mark || "—"}</p>
                <div>
                  <strong>{row.label || row.id}</strong>
                  <span className="c4-meta">{laneLabel(v4, state === "set" ? plateLane(row.note) : state === "clear" ? "blank" : "")} · {plateToneLabel(v4, plateTone(row.note))}</span>
                  {catalogPlate(row.note) && <span className="c4-meta">{v4("adrCatalogMark")}</span>}
                  <div className="c4-row">
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(togglePlateReview(reviewed, row.id))}>{v4("adrReview")}</button>
                    <button type="button" className="c4-btn" onClick={() => { const line = plateCopy(row.note); void navigator.clipboard?.writeText(line); setCopied(row.id); }}>{copied === row.id ? v4("adrCopied") : v4("adrCopy")}</button>
                    <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{row.label || row.id}</Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="c4-adr-rules">{v4("adrRules")}</p>
      </div>
    </section>
  );
}
