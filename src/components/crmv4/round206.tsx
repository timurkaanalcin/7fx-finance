"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  LTR_KEY,
  LTR_REVIEW_KEY,
  RDL_DENSITY_KEY,
  RDL_KEY,
  RDL_VIEW_KEY,
  activeAlcove,
  activeFlame,
  activeHour,
  activeLetterBand,
  activeLetterTone,
  activeReader,
  activeSpan,
  activeWick,
  addLamp,
  addLampTag,
  addLampView,
  adjacentLampCount,
  alcoveArg,
  bulkLampAlcove,
  bulkLampClose,
  bulkLampPin,
  bulkLampTag,
  bulkLetterReview,
  busiestReader,
  catalogLetter,
  catalogLetterCount,
  clashHourCount,
  cycleFlame,
  densityOf,
  dropLampView,
  editLamp,
  editLampNote,
  fairReader,
  flameArg,
  giltLetterCount,
  hourArg,
  hourGap,
  houseAlcove,
  lampAlcoves,
  lampCopy,
  lampCounts,
  lampReaders,
  lampShare,
  lampTimeline,
  lampsCsv,
  lateLamp,
  lateShare,
  leadingLetter,
  leadingLetterTone,
  letterBand,
  letterBandArg,
  letterBands,
  letterCopy,
  letterOf,
  letterRowsCsv,
  letterShare,
  letterState,
  letterTone,
  letterToneArg,
  lettersCsv,
  moveFocus,
  nextLamp,
  peakHour,
  pinFocused,
  presentLetters,
  quietHour,
  readHiddenLetters,
  readLampViews,
  readLamps,
  readReviewedLetters,
  readerArg,
  reminderLamps,
  resetLamps,
  setLampClose,
  setLampHold,
  setLampPin,
  setLampShade,
  shadeFocused,
  sharedLetterCount,
  soonLamp,
  sortLamps,
  sortMode,
  spanArg,
  suggestAlcove,
  suggestReader,
  suggestSpan,
  toggleLetter,
  toggleLetterReview,
  usedHours,
  visibleLamps,
  visibleLetterBands,
  visibleLetterCustomers,
  wickArg,
  wickClashCount,
  wideLetterCount,
  windowLamps,
  type LampDensity,
  type LampSort,
  type LampTray,
  type LampView,
  type LetterRow,
  type LetterShape,
  type ReadingLamp,
} from "@/lib/crmv4/round206";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
};

type GlanceRow = LetterRow & { id: string };

const ALCOVES = ["ink", "ivory", "graphite"] as const;
const FLAMES = ["steady", "bright", "dim"] as const;
const BANDS = ["brief", "even", "long", "plain"] as const;

function alcoveLabel(v4: V4, alcove: string): string {
  if (alcove === "ink" || alcove === "INK") return v4("rdlInk");
  if (alcove === "ivory" || alcove === "IVORY") return v4("rdlIvory");
  if (alcove === "graphite" || alcove === "GRAPHITE") return v4("rdlGraphite");
  return v4("rdlBlankAlcove");
}

function flameLabel(v4: V4, flame: string): string {
  if (flame === "steady") return v4("rdlSteady");
  if (flame === "bright") return v4("rdlBright");
  if (flame === "dim") return v4("rdlDim");
  return v4("rdlBlankFlame");
}

function wickLabel(v4: V4, wick: number | null): string {
  if (wick === 3) return v4("rdlWick3");
  if (wick === 6) return v4("rdlWick6");
  if (wick === 9) return v4("rdlWick9");
  return v4("rdlBlankWick");
}

function spanLabel(v4: V4, span: number | null): string {
  if (span === 10) return v4("rdlSpan10");
  if (span === 25) return v4("rdlSpan25");
  if (span === 50) return v4("rdlSpan50");
  return v4("rdlBlankSpan");
}

function bandLabel(v4: V4, name: string): string {
  if (name === "brief") return v4("ltrBrief");
  if (name === "even") return v4("ltrEven");
  if (name === "long") return v4("ltrLong");
  if (name === "plain") return v4("ltrPlain");
  if (name === "blank") return v4("ltrClear");
  return v4("ltrUnmarked");
}

function toneLabel(v4: V4, name: string): string {
  if (name === "gilt") return v4("ltrGilt");
  if (name === "ink") return v4("ltrInk");
  if (name === "ivory") return v4("ltrIvory");
  if (name === "plain") return v4("ltrTonePlain");
  return v4("ltrUnmarked");
}

function auditLabel(v4: V4, audit: string): string {
  const key = {
    save: "rdlAuditSave",
    edit: "rdlAuditEdit",
    flame: "rdlAuditFlame",
    pin: "rdlAuditPin",
    unpin: "rdlAuditUnpin",
    hold: "rdlAuditHold",
    lift: "rdlAuditLift",
    close: "rdlAuditClose",
    open: "rdlAuditOpen",
    alcove: "rdlAuditAlcove",
    tag: "rdlAuditTag",
    shade: "rdlAuditShade",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, hour: number | null, desk: string): string {
  const gap = hourGap(hour, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("rdlPast")} ${gap}`;
  if (gap < 0) return `${v4("rdlAhead")} ${Math.abs(gap)}`;
  return v4("rdlDue");
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

export function ReadingLamps({ v4 }: { v4: V4 }) {
  const [lamps, setLamps] = useState<ReadingLamp[]>([]);
  const [views, setViews] = useState<LampView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [reader, setReader] = useState("");
  const [hour, setHour] = useState("");
  const [alcove, setAlcove] = useState("");
  const [flame, setFlame] = useState("");
  const [wick, setWick] = useState("");
  const [spanValue, setSpanValue] = useState("");
  const [tag, setTag] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<LampTray>("open");
  const [readerFilter, setReaderFilter] = useState("all");
  const [alcoveFilter, setAlcoveFilter] = useState("all");
  const [flameFilter, setFlameFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [wickFilter, setWickFilter] = useState("all");
  const [spanFilter, setSpanFilter] = useState("all");
  const [brightOnly, setBrightOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [awakeOnly, setAwakeOnly] = useState(false);
  const [board, setBoard] = useState<"program" | "timeline">("program");
  const [order, setOrder] = useState<LampSort>("hour");
  const [density, setDensity] = useState<LampDensity>("roomy");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [deskHour, setDeskHour] = useState("");
  const [moveAlcove, setMoveAlcove] = useState("graphite");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<() => void>(() => {});
  const shadeRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readLamps(readJson(RDL_KEY, []));
    const saved = readLampViews(readJson(RDL_VIEW_KEY, []));
    setLamps(next);
    setViews(saved);
    setDensity(densityOf(readJson(RDL_DENSITY_KEY, "roomy")));
    writeJson(RDL_KEY, next);
    writeJson(RDL_VIEW_KEY, saved);
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: ReadingLamp[]) {
    const saved = readLamps(next);
    setLamps(saved);
    writeJson(RDL_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((lamp) => lamp.id === id)));
  }
  function storeViews(next: LampView[]) {
    const saved = readLampViews(next);
    setViews(saved);
    writeJson(RDL_VIEW_KEY, saved);
  }
  function storeDensity(next: LampDensity) {
    setDensity(next);
    writeJson(RDL_DENSITY_KEY, next);
  }
  const readers = lampReaders(lamps);
  const alcoves = lampAlcoves(lamps);
  const bars = ALCOVES.map((item) => ({ alcove: item.toUpperCase(), count: lamps.filter((lamp) => lamp.alcove === item.toUpperCase()).length })).filter((row) => row.count > 0);
  const readerOn = activeReader(readerFilter, readers);
  const alcoveOn = activeAlcove(alcoveFilter, alcoves);
  const flameOn = activeFlame(flameFilter, ["steady", "bright", "dim"]);
  const hourOn = activeHour(hourFilter);
  const wickOn = activeWick(wickFilter);
  const spanOn = activeSpan(spanFilter);
  const pickedHour = hourArg(hourOn);
  const shown = sortLamps(visibleLamps(
    lamps,
    tray,
    query,
    readerArg(readerOn),
    alcoveArg(alcoveOn),
    flameArg(flameOn),
    pickedHour.exact,
    pickedHour.pick,
    wickArg(wickOn),
    spanArg(spanOn),
    brightOnly,
    peakOnly,
    houseOnly,
    quietOnly,
    awakeOnly,
  ), order);
  const timeline = lampTimeline(lamps, query);
  const counts = lampCounts(lamps, deskHour);
  const clashes = clashHourCount(lamps);
  const wicks = wickClashCount(lamps);
  const neighbors = adjacentLampCount(lamps);
  const nextId = nextLamp(lamps, deskHour);
  const nextRow = lamps.find((lamp) => lamp.id === nextId);
  const suggestedAlcove = suggestAlcove(lamps);
  const suggestedReader = suggestReader(lamps);
  const suggestedSpan = suggestSpan(lamps);
  const fair = fairReader(lamps, roster);
  const busy = busiestReader(lamps);
  const reminders = reminderLamps(lamps, deskHour);
  const windowRows = windowLamps(lamps, deskHour);
  const share = lateShare(lamps, deskHour);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  pinRef.current = () => {
    if (viewer) return;
    const ids = (board === "timeline" ? timeline : shown).map((lamp) => lamp.id);
    store(pinFocused(lamps, ids, focus));
  };
  shadeRef.current = () => {
    if (viewer) return;
    const ids = (board === "timeline" ? timeline : shown).map((lamp) => lamp.id);
    store(shadeFocused(lamps, ids, focus));
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
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        shadeRef.current();
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        setBoard((current) => (current === "program" ? "timeline" : "program"));
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
    setReader("");
    setHour("");
    setAlcove("");
    setFlame("");
    setWick("");
    setSpanValue("");
    setTag("");
    setQuery("");
    setEditing("");
  }
  function applyView(view: LampView) {
    setTray(view.tray);
    setQuery(view.query);
    setReaderFilter(view.reader);
    setAlcoveFilter(view.alcove);
    setFlameFilter(view.flame);
    setHourFilter(view.hour);
    setWickFilter(view.wick);
    setSpanFilter(view.span);
  }
  const rows = board === "timeline" ? timeline : shown;
  return (
    <section className="c4-rdl" aria-label={v4("rdlTitle")} data-lamps="1" data-role={role} data-density={density}>
      <div className="c4-rdl-sheet">
        <header className="c4-rdl-mast">
          <p className="c4-rdl-spine">{v4("rdlSpine")}</p>
          <div>
            <p className="c4-rdl-kicker">{v4("rdlSub")}</p>
            <h2 className="c4-title">{v4("rdlTitle")}</h2>
          </div>
          <p className="c4-rdl-plate" data-logo="mono">{v4("rdlLogo")}</p>
        </header>
        <div className="c4-rdl-body">
          <p className="c4-rdl-rules">{v4("rdlHint")}</p>
          <p className="c4-meta">{v4("rdlLocal")}</p>
          <p className="c4-meta">{v4("rdlNew")} {v4("rdlSlash")} {v4("rdlEscape")} {v4("rdlKeys")} {v4("rdlPinKey")} {v4("rdlShadeKey")} {v4("rdlBoardKey")}</p>
          {viewer && <p className="c4-rdl-notice" data-viewer="1">{v4("rdlViewer")}</p>}
          {counts.peak > 0 && (
            <p className="c4-rdl-notice" role="status">
              {v4("rdlNotice")} · {counts.peak}
              <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("rdlNoticeAll") : v4("rdlNoticePeak")}</button>
            </p>
          )}
          {counts.late > 0 && (
            <p className="c4-rdl-notice" role="status" data-late="1">
              {v4("rdlLateNotice")} · {counts.late}
            </p>
          )}
          <ol className="c4-rdl-ledger" aria-label={v4("rdlKpi")}>
            <li><span>{v4("rdlOpen")}</span><strong>{counts.open}</strong></li>
            <li><span>{v4("rdlHeld")}</span><strong>{counts.held}</strong></li>
            <li><span>{v4("rdlClosed")}</span><strong>{counts.closed}</strong></li>
            <li><span>{v4("rdlPinned")}</span><strong>{counts.pinned}</strong></li>
            <li><span>{v4("rdlPeak")}</span><strong>{counts.peak}</strong></li>
            <li><span>{v4("rdlLate")}</span><strong>{counts.late}</strong></li>
            <li><span>{v4("rdlSoon")}</span><strong>{counts.soon}</strong></li>
            <li><span>{v4("rdlShade")}</span><strong>{counts.shade}</strong></li>
            <li><span>{v4("rdlHouseShare")}</span><strong>{lampShare(counts.house, lamps.length)}%</strong></li>
            <li><span>{v4("rdlLateShare")}</span><strong>{share}%</strong></li>
          </ol>
          <div className="c4-rdl-sla" aria-label={v4("rdlLateShare")}>
            <span>{v4("rdlLateShare")}</span>
            <div className="c4-rdl-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></div>
          </div>
          <div className="c4-rdl-rail" aria-label={v4("rdlAlcoves")}>
            {bars.map((bar) => (
              <div key={bar.alcove} className="c4-rdl-meter" data-alcove={bar.alcove.toLowerCase()}>
                <button type="button" className="c4-btn" onClick={() => setAlcoveFilter(bar.alcove)}>{alcoveLabel(v4, bar.alcove)} · {bar.count}</button>
                <div className="c4-rdl-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
              </div>
            ))}
            {!bars.length && <p className="c4-rdl-empty">{v4("rdlEmpty")}</p>}
          </div>
          <div className="c4-rdl-suggest">
            <p>{v4("rdlSuggestAlcove")} · {alcoveLabel(v4, suggestedAlcove)}</p>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setAlcove(suggestedAlcove.toLowerCase())}>{v4("rdlUseAlcove")}</button>
            <p>{v4("rdlSuggestReader")} · {suggestedReader || v4("rdlBlankReader")}</p>
            <button type="button" className="c4-btn" disabled={viewer || !suggestedReader} onClick={() => setReader(suggestedReader)}>{v4("rdlUseReader")}</button>
            <p>{v4("rdlSuggestSpan")} · {spanLabel(v4, suggestedSpan)}</p>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setSpanValue(String(suggestedSpan))}>{v4("rdlUseSpan")}</button>
            <p>{v4("rdlAssign")} · {fair || v4("rdlBlankReader")}</p>
            <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setReader(fair)}>{v4("rdlAssign")}</button>
          </div>
          <p className="c4-meta">{v4("rdlHours")} · {usedHours(lamps)}</p>
          <p className="c4-meta">{clashes ? `${v4("rdlClash")} · ${clashes}` : v4("rdlClashNone")}</p>
          <p className="c4-meta">{wicks ? `${v4("rdlWickClash")} · ${wicks}` : v4("rdlWickClashNone")}</p>
          <p className="c4-meta">{neighbors ? `${v4("rdlAdjacent")} · ${neighbors}` : v4("rdlAdjacentNone")}</p>
          <p className="c4-meta">{nextRow ? `${v4("rdlNext")} · ${nextRow.title}` : v4("rdlNextNone")}</p>
          <p className="c4-meta">{busy ? `${v4("rdlBusiest")} · ${busy}` : v4("rdlBusiestNone")}</p>
          <div className="c4-rdl-reminders" aria-label={v4("rdlReminders")}>
            {reminders.length ? reminders.map((lamp) => <span key={lamp.id}>{lamp.title}</span>) : <span>{v4("rdlReminderNone")}</span>}
          </div>
          <div className="c4-rdl-window" aria-label={v4("rdlWindow")}>
            {windowRows.length ? windowRows.map((lamp) => <span key={lamp.id}>{lamp.title}</span>) : <span>{v4("rdlWindowNone")}</span>}
          </div>
          <label className="c4-lab">{v4("rdlSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("rdlSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <div className="c4-rdl-filters" role="group" aria-label={v4("rdlSearch")}>
            {(["open", "held", "closed"] as const).map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("rdlOpenTray") : item === "held" ? v4("rdlHeldTray") : v4("rdlClosedTray")}</button>
            ))}
            <button type="button" className="c4-chip" data-on={readerOn === "all" ? "1" : "0"} onClick={() => setReaderFilter("all")}>{v4("rdlAll")}</button>
            <button type="button" className="c4-chip" data-on={readerOn === "blank" ? "1" : "0"} onClick={() => setReaderFilter("blank")}>{v4("rdlBlankReader")}</button>
            {readers.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={readerOn === name ? "1" : "0"} onClick={() => setReaderFilter(name)}>{name}</button>
            ))}
            <button type="button" className="c4-chip" data-on={alcoveOn === "all" ? "1" : "0"} onClick={() => setAlcoveFilter("all")}>{v4("rdlAlcove")}</button>
            <button type="button" className="c4-chip" data-on={alcoveOn === "blank" ? "1" : "0"} onClick={() => setAlcoveFilter("blank")}>{v4("rdlBlankAlcove")}</button>
            {ALCOVES.map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={alcoveOn === item.toUpperCase() ? "1" : "0"} onClick={() => setAlcoveFilter(item)}>{alcoveLabel(v4, item)}</button>
            ))}
            <button type="button" className="c4-chip" data-on={flameOn === "all" ? "1" : "0"} onClick={() => setFlameFilter("all")}>{v4("rdlFlame")}</button>
            {FLAMES.map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={flameOn === item ? "1" : "0"} onClick={() => setFlameFilter(item)}>{flameLabel(v4, item)}</button>
            ))}
            {["all", "blank", "early", "mid", "late", "peak", "quiet", "1", "9"].map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={hourOn === item ? "1" : "0"} onClick={() => setHourFilter(item)}>{item === "all" ? v4("rdlHour") : item === "blank" ? v4("rdlBlankHour") : item === "early" ? v4("rdlEarly") : item === "mid" ? v4("rdlMid") : item === "late" ? v4("rdlLateHour") : item === "peak" ? v4("rdlPeak") : item === "quiet" ? v4("rdlQuiet") : item}</button>
            ))}
            {["all", "blank", "3", "6", "9"].map((item) => (
              <button key={`w${item}`} type="button" className="c4-chip" data-on={wickOn === item ? "1" : "0"} onClick={() => setWickFilter(item)}>{item === "all" ? v4("rdlWick") : item === "blank" ? v4("rdlBlankWick") : wickLabel(v4, Number(item))}</button>
            ))}
            {["all", "blank", "10", "25", "50"].map((item) => (
              <button key={`s${item}`} type="button" className="c4-chip" data-on={spanOn === item ? "1" : "0"} onClick={() => setSpanFilter(item)}>{item === "all" ? v4("rdlSpan") : item === "blank" ? v4("rdlBlankSpan") : spanLabel(v4, Number(item))}</button>
            ))}
            <button type="button" className="c4-chip" data-on={brightOnly ? "1" : "0"} onClick={() => setBrightOnly((on) => !on)}>{v4("rdlBrightOnly")}</button>
            <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((on) => !on)}>{v4("rdlPeakOnly")}</button>
            <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((on) => !on)}>{v4("rdlHouseOnly")}</button>
            <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((on) => !on)}>{v4("rdlQuietOnly")}</button>
            <button type="button" className="c4-chip" data-on={awakeOnly ? "1" : "0"} onClick={() => setAwakeOnly((on) => !on)}>{v4("rdlAwakeOnly")}</button>
            <button type="button" className="c4-chip" data-on={order === "hour" ? "1" : "0"} onClick={() => setOrder(sortMode("hour"))}>{v4("rdlSortHour")}</button>
            <button type="button" className="c4-chip" data-on={order === "title" ? "1" : "0"} onClick={() => setOrder(sortMode("title"))}>{v4("rdlSortTitle")}</button>
            <button type="button" className="c4-chip" data-on={density === "roomy" ? "1" : "0"} onClick={() => storeDensity("roomy")}>{v4("rdlRoomy")}</button>
            <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity("tight")}>{v4("rdlTight")}</button>
            <button type="button" className="c4-chip" data-on={board === "program" ? "1" : "0"} onClick={() => setBoard("program")}>{v4("rdlProgram")}</button>
            <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard("timeline")}>{v4("rdlTimeline")}</button>
          </div>
          <form className="c4-rdl-form" onSubmit={(event) => {
            event.preventDefault();
            if (viewer) return;
            store(addLamp(lamps, { id: `rdl-${Date.now()}`, title, note, reader, hour, alcove, flame, wick, span: spanValue, tags: tag }));
            clearDraft();
          }}>
            <label className="c4-lab">{v4("rdlLine")}<input ref={titleRef} className="c4-field" aria-label={v4("rdlLine")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
            <label className="c4-lab">{v4("rdlNote")}<input className="c4-field" aria-label={v4("rdlNote")} value={note} onChange={(event) => setNote(event.target.value)} /></label>
            <label className="c4-lab">{v4("rdlReader")}<input className="c4-field" aria-label={v4("rdlReader")} value={reader} onChange={(event) => setReader(event.target.value)} /></label>
            <label className="c4-lab">{v4("rdlHour")}<input className="c4-field" aria-label={v4("rdlHour")} value={hour} onChange={(event) => setHour(event.target.value)} /></label>
            <label className="c4-lab">{v4("rdlAlcove")}<input className="c4-field" aria-label={v4("rdlAlcove")} value={alcove} onChange={(event) => setAlcove(event.target.value)} /></label>
            <label className="c4-lab">{v4("rdlFlame")}<input className="c4-field" aria-label={v4("rdlFlame")} value={flame} onChange={(event) => setFlame(event.target.value)} /></label>
            <label className="c4-lab">{v4("rdlWick")}<input className="c4-field" aria-label={v4("rdlWick")} value={wick} onChange={(event) => setWick(event.target.value)} /></label>
            <label className="c4-lab">{v4("rdlSpan")}<input className="c4-field" aria-label={v4("rdlSpan")} value={spanValue} onChange={(event) => setSpanValue(event.target.value)} /></label>
            <label className="c4-lab">{v4("rdlTag")}<input className="c4-field" aria-label={v4("rdlTag")} value={tag} onChange={(event) => setTag(event.target.value)} /></label>
            <button type="submit" className="c4-btn" disabled={viewer}>{v4("rdlSave")}</button>
          </form>
          <label className="c4-lab">{v4("rdlDeskHour")}<input className="c4-field" aria-label={v4("rdlDeskHour")} value={deskHour} onChange={(event) => setDeskHour(event.target.value)} /></label>
          <label className="c4-lab">{v4("rdlRoster")}<input className="c4-field" aria-label={v4("rdlRoster")} value={roster} onChange={(event) => setRoster(event.target.value)} /></label>
          <div className="c4-rdl-views">
            <label className="c4-lab">{v4("rdlViewName")}<input className="c4-field" aria-label={v4("rdlViewName")} value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
              const name = viewName.trim();
              if (!name) return;
              storeViews(addLampView(views, { id: `view-${Date.now()}`, name, tray, query, reader: readerOn, alcove: alcoveOn, flame: flameOn, hour: hourOn, wick: wickOn, span: spanOn }));
              setViewName("");
            }}>{v4("rdlSaveView")}</button>
            {views.map((view) => (
              <span key={view.id}>
                <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
                <button type="button" className="c4-btn" disabled={viewer} aria-label={v4("rdlDropView")} onClick={() => storeViews(dropLampView(views, view.id))}>×</button>
              </span>
            ))}
          </div>
          <div className="c4-rdl-bulk">
            <label className="c4-lab">{v4("rdlBulkAlcove")}<input className="c4-field" aria-label={v4("rdlBulkAlcove")} value={moveAlcove} onChange={(event) => setMoveAlcove(event.target.value)} /></label>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkLampAlcove(lamps, picked, moveAlcove))}>{v4("rdlBulkAlcove")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkLampPin(lamps, picked, true))}>{v4("rdlBulkPin")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkLampClose(lamps, picked, true))}>{v4("rdlBulkClose")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkLampTag(lamps, picked, tag))}>{v4("rdlBulkTag")}</button>
            <button type="button" className="c4-btn" onClick={() => download("reading-lamps.csv", lampsCsv(lamps, deskHour))}>{v4("rdlCsv")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetLamps())}>{v4("rdlReset")}</button>
          </div>
          {!rows.length && <p className="c4-rdl-empty">{v4("rdlEmpty")}</p>}
          <ol className={board === "timeline" ? "c4-rdl-time" : "c4-rdl-book"}>
            {rows.map((lamp, index) => (
              <li key={lamp.id} data-focus={index === moveFocus(focus, rows.length, 0) ? "1" : "0"} data-alcove={lamp.alcove.toLowerCase() || "blank"} data-late={lateLamp(lamp, deskHour) ? "1" : "0"} data-soon={soonLamp(lamp) ? "1" : "0"} data-house={houseAlcove(lamp.alcove) ? "1" : "0"} data-peak={peakHour(lamp.hour) ? "1" : "0"} data-quiet={quietHour(lamp.hour) ? "1" : "0"}>
                <label className="c4-lab"><span className="c4-meta">{v4("rdlPick")}</span><input type="checkbox" aria-label={v4("rdlPick")} checked={picked.includes(lamp.id)} onChange={() => setPicked((ids) => ids.includes(lamp.id) ? ids.filter((id) => id !== lamp.id) : [...ids, lamp.id])} /></label>
                <div>
                  <strong>{lamp.title}</strong>
                  <span className="c4-meta">{lamp.reader || v4("rdlBlankReader")} · {alcoveLabel(v4, lamp.alcove)} · {flameLabel(v4, lamp.flame)} · {wickLabel(v4, lamp.wick)} · {spanLabel(v4, lamp.span)} · {gapLabel(v4, lamp.hour, deskHour)}</span>
                  {lamp.note && <span className="c4-meta">{lamp.note}</span>}
                  {lamp.tags.length > 0 && <span className="c4-meta">{lamp.tags.join(" ")}</span>}
                  {lamp.audit && <span className="c4-meta">{v4("rdlAudit")} · {auditLabel(v4, lamp.audit)}</span>}
                  {editing === lamp.id && (
                    <div className="c4-row">
                      <input className="c4-field" aria-label={v4("rdlLine")} value={draft} onChange={(event) => setDraft(event.target.value)} />
                      <input className="c4-field" aria-label={v4("rdlNote")} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} />
                      <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(editLampNote(editLamp(lamps, lamp.id, draft), lamp.id, noteDraft)); setEditing(""); }}>{v4("rdlApply")}</button>
                    </div>
                  )}
                  <div className="c4-row">
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLampPin(lamps, lamp.id, !lamp.pinned))}>{lamp.pinned ? v4("rdlUnpin") : v4("rdlPin")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLampHold(lamps, lamp.id, !lamp.held))}>{lamp.held ? v4("rdlLift") : v4("rdlHold")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleFlame(lamps, lamp.id))}>{v4("rdlFlame")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addLampTag(lamps, lamp.id, tag))}>{v4("rdlTag")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLampClose(lamps, lamp.id, !lamp.closed))}>{lamp.closed ? v4("rdlReopen") : v4("rdlClose")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLampShade(lamps, lamp.id, lamp.shade ? 0 : 4))}>{lamp.shade ? v4("rdlShadeOff") : v4("rdlShadeOn")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(lamp.id); setDraft(lamp.title); setNoteDraft(lamp.note); }}>{v4("rdlEdit")}</button>
                    <button type="button" className="c4-btn" onClick={() => { const line = lampCopy(lamp, deskHour); void navigator.clipboard?.writeText(line); setCopied(lamp.id); }}>{copied === lamp.id ? v4("rdlCopied") : v4("rdlCopy")}</button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <p className="c4-rdl-rules">{v4("rdlRules")}</p>
        </div>
      </div>
    </section>
  );
}

export function LetterCrests({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [band, setBand] = useState("all");
  const [tone, setTone] = useState("all");
  const [shape, setShape] = useState<LetterShape>("all");
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
    note: { email: user.email ?? null },
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
    const present = presentLetters(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenLetters(readJson(LTR_KEY, []), present);
    const nextReviewed = readReviewedLetters(readJson(LTR_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(LTR_KEY, nextHidden);
    writeJson(LTR_REVIEW_KEY, nextReviewed);
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
  const present = presentLetters(rows);
  const bands = visibleLetterBands(present, hidden, showHidden);
  const bandOn = activeLetterBand(band, present);
  const toneOn = activeLetterTone(tone);
  const shown = visibleLetterCustomers(rows, letterBandArg(bandOn), letterToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = letterState(row.note);
      const token = state === "set" ? letterBand(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return bands.includes(token);
    });
  const lead = leadingLetter(rows);
  const toneLead = leadingLetterTone(rows);
  const shared = sharedLetterCount(rows);
  const catalog = catalogLetterCount(rows);
  const bars = letterBands(rows).filter((line) => line.band);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(LTR_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedLetters(next, ids);
    setReviewed(saved);
    writeJson(LTR_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-ltr" aria-label={v4("ltrTitle")} data-letters="1" data-role={role} data-catalog={catalog ? "1" : "0"}>
      <div className="c4-ltr-sheet">
        <header className="c4-ltr-mast">
          <div>
            <p className="c4-ltr-kicker">{v4("ltrSub")}</p>
            <h2 className="c4-title">{v4("ltrTitle")}</h2>
          </div>
          <p className="c4-ltr-plate" data-logo="mono">{v4("ltrLogo")}</p>
        </header>
        <p className="c4-ltr-rules">{v4("ltrHint")}</p>
        <p className="c4-meta">{v4("ltrKept")} {v4("ltrEscape")}</p>
        {viewer && <p className="c4-ltr-notice" data-viewer="1">{v4("ltrViewer")}</p>}
        {data.error && <p className="c4-ltr-empty" role="alert">{v4("ltrFailed")}</p>}
        {data.loading && <p className="c4-meta">{v4("ltrLoading")}</p>}
        {shared > 0 && <p className="c4-ltr-notice" role="status">{v4("ltrNotice")} · {shared}</p>}
        <ol className="c4-ltr-ledger" aria-label={v4("ltrKpi")}>
          <li><span>{v4("ltrSet")}</span><strong>{rows.filter((row) => letterState(row.note) === "set").length}</strong></li>
          <li><span>{v4("ltrCatalog")}</span><strong>{catalog}</strong></li>
          <li><span>{v4("ltrWide")}</span><strong>{wideLetterCount(rows)}</strong></li>
          <li><span>{v4("ltrGiltCount")}</span><strong>{giltLetterCount(rows)}</strong></li>
          <li><span>{v4("ltrShare")}</span><strong>{letterShare(catalog, rows.length)}%</strong></li>
          <li><span>{v4("ltrShared")}</span><strong>{shared}</strong></li>
        </ol>
        <div className="c4-ltr-rail" aria-label={v4("ltrBands")}>
          {bars.map((bar) => (
            <div key={bar.band} className="c4-ltr-meter">
              <button type="button" className="c4-btn" onClick={() => setBand(bar.band)}>{bandLabel(v4, bar.band)} · {bar.count}</button>
              <div className="c4-ltr-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            </div>
          ))}
          {!bars.length && <p className="c4-ltr-empty">{v4("ltrEmpty")}</p>}
        </div>
        <div className="c4-ltr-suggest">
          <p>{v4("ltrLeading")} · {lead ? bandLabel(v4, lead) : v4("ltrLeadingNone")}</p>
          <p>{v4("ltrToneLead")} · {toneLead ? toneLabel(v4, toneLead) : v4("ltrToneNone")}</p>
          <p>{shared ? `${v4("ltrShared")} · ${shared}` : v4("ltrSharedNone")}</p>
        </div>
        <label className="c4-lab">{v4("ltrSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("ltrSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <div className="c4-ltr-filters">
          <button type="button" className="c4-chip" data-on={bandOn === "all" ? "1" : "0"} onClick={() => setBand("all")}>{v4("ltrAll")}</button>
          <button type="button" className="c4-chip" data-on={bandOn === "blank" ? "1" : "0"} onClick={() => setBand("blank")}>{v4("ltrClear")}</button>
          {BANDS.map((item) => (
            <button key={item} type="button" className="c4-chip" data-on={bandOn === item ? "1" : "0"} onClick={() => setBand(item)}>{bandLabel(v4, item)}</button>
          ))}
          <button type="button" className="c4-chip" data-on={toneOn === "all" ? "1" : "0"} onClick={() => setTone("all")}>{v4("ltrTone")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "gilt" ? "1" : "0"} onClick={() => setTone("gilt")}>{v4("ltrGilt")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "ink" ? "1" : "0"} onClick={() => setTone("ink")}>{v4("ltrInk")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "ivory" ? "1" : "0"} onClick={() => setTone("ivory")}>{v4("ltrIvory")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "plain" ? "1" : "0"} onClick={() => setTone("plain")}>{v4("ltrTonePlain")}</button>
          {(["all", "catalog", "wide", "gilt"] as const).map((item) => (
            <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{item === "all" ? v4("ltrAllShapes") : item === "catalog" ? v4("ltrCatalog") : item === "wide" ? v4("ltrWide") : v4("ltrGilt")}</button>
          ))}
          <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} onClick={() => setReview("all")}>{v4("ltrAllReview")}</button>
          <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview("reviewed")}>{v4("ltrReviewed")}</button>
          <button type="button" className="c4-chip" data-on={review === "open" ? "1" : "0"} onClick={() => setReview("open")}>{v4("ltrOpenReview")}</button>
          <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("ltrShown") : v4("ltrHidden")}</button>
        </div>
        <div className="c4-ltr-bands">
          {present.map((item) => (
            <button key={item} type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleLetter(hidden, item))}>
              {bandLabel(v4, item)} · {hidden.includes(item) ? v4("ltrShow") : v4("ltrHide")}
            </button>
          ))}
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkLetterReview(reviewed, shown.map((row) => row.id), true))}>{v4("ltrBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkLetterReview(reviewed, ids, false))}>{v4("ltrBulkClear")}</button>
          <button type="button" className="c4-btn" onClick={() => download("letter-crests.csv", lettersCsv(rows))}>{v4("ltrCsv")}</button>
          <button type="button" className="c4-btn" onClick={() => download("letter-crest-rows.csv", letterRowsCsv(rows, reviewed))}>{v4("ltrRowCsv")}</button>
          <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("ltrCustomers")}</Link>
        </div>
        {!shown.length && <p className="c4-ltr-empty">{v4("ltrEmpty")}</p>}
        <ul className="c4-ltr-index">
          {shown.map((row) => {
            const state = letterState(row.note);
            const mark = letterOf(row.note);
            return (
              <li key={row.id} data-state={state || "blank"} data-band={state === "set" ? letterBand(row.note) : "blank"} data-tone={letterTone(row.note) || "blank"} data-catalog={catalogLetter(row.note) ? "1" : "0"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"}>
                <p className="c4-ltr-mark" data-logo="mono">{mark || "—"}</p>
                <div>
                  <strong>{row.label || row.id}</strong>
                  <span className="c4-meta">{bandLabel(v4, state === "set" ? letterBand(row.note) : state === "clear" ? "blank" : "")} · {toneLabel(v4, letterTone(row.note))}</span>
                  {catalogLetter(row.note) && <span className="c4-meta">{v4("ltrCatalogMark")}</span>}
                  <div className="c4-row">
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleLetterReview(reviewed, row.id))}>{v4("ltrReview")}</button>
                    <button type="button" className="c4-btn" onClick={() => { const line = letterCopy(row.note); void navigator.clipboard?.writeText(line); setCopied(row.id); }}>{copied === row.id ? v4("ltrCopied") : v4("ltrCopy")}</button>
                    <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{row.label || row.id}</Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="c4-ltr-rules">{v4("ltrRules")}</p>
      </div>
    </section>
  );
}
