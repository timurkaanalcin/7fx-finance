"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  CLS_DENSITY_KEY,
  CLS_KEY,
  CLS_VIEW_KEY,
  SYO_KEY,
  SYO_REVIEW_KEY,
  activeCloth,
  activeCrestBand,
  activeCrestTone,
  activeSeat,
  activeStay,
  activeTone,
  activeUsher,
  activeCord,
  addStall,
  addStallTag,
  addStallView,
  adjacentStallCount,
  brightLoad,
  bulkCrestReview,
  bulkStallClose,
  bulkStallCloth,
  bulkStallPin,
  bulkStallTag,
  bulkStallTone,
  busiestUsher,
  catalogCrest,
  catalogCrestCount,
  clashSeatCount,
  clothArg,
  cordArg,
  cordClashCount,
  crestBand,
  crestBandArg,
  crestBands,
  crestCopy,
  crestOf,
  crestRowsCsv,
  crestShare,
  crestState,
  crestTone,
  crestToneArg,
  crestsCsv,
  cycleTone,
  densityOf,
  dropStallView,
  editStall,
  editStallNote,
  fairUsher,
  giltCrestCount,
  giltFocused,
  giltLoad,
  houseCloth,
  lateShare,
  lateStall,
  leadingCrest,
  leadingCrestTone,
  moveFocus,
  nextStall,
  pairUsherCount,
  peakSeat,
  pinFocused,
  presentCrests,
  quietHouseCount,
  quietSeat,
  readHiddenCrests,
  readReviewedCrests,
  readStallViews,
  readStalls,
  reminderStalls,
  resetStalls,
  seatArg,
  seatGap,
  seatSpan,
  setStallClose,
  setStallGilt,
  setStallHold,
  setStallPin,
  sharedCrestCount,
  soonStall,
  sortMode,
  sortStalls,
  stallCloths,
  stallCopy,
  stallCounts,
  stallShare,
  stallTimeline,
  stallUshers,
  stallsCsv,
  stayArg,
  suggestCloth,
  suggestStay,
  suggestUsher,
  toggleCrest,
  toggleCrestReview,
  toneArg,
  usedSeats,
  usherArg,
  visibleCrestBands,
  visibleCrestCustomers,
  visibleStalls,
  wideCrestCount,
  windowStalls,
  type CloisterStall,
  type CrestRow,
  type CrestShape,
  type StallDensity,
  type StallSort,
  type StallTray,
  type StallView,
} from "@/lib/crmv4/round208";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  lastOs?: string | null;
};

type GlanceRow = CrestRow & { id: string };

const CLOTHS = ["linen", "champagne", "slate"] as const;
const TONES = ["hush", "warm", "bright"] as const;
const BANDS = ["apple", "window", "linux", "plain"] as const;

function clothLabel(v4: V4, cloth: string): string {
  if (cloth === "linen" || cloth === "LINEN") return v4("clsLinen");
  if (cloth === "champagne" || cloth === "CHAMPAGNE") return v4("clsChampagne");
  if (cloth === "slate" || cloth === "SLATE") return v4("clsSlate");
  return v4("clsBlankCloth");
}

function toneLabel(v4: V4, tone: string): string {
  if (tone === "hush") return v4("clsHush");
  if (tone === "warm") return v4("clsWarm");
  if (tone === "bright") return v4("clsBright");
  return v4("clsBlankTone");
}

function cordLabel(v4: V4, cord: number | null): string {
  if (cord === 4) return v4("clsCord4");
  if (cord === 7) return v4("clsCord7");
  if (cord === 11) return v4("clsCord11");
  return v4("clsBlankCord");
}

function stayLabel(v4: V4, stay: number | null): string {
  if (stay === 15) return v4("clsStay15");
  if (stay === 30) return v4("clsStay30");
  if (stay === 60) return v4("clsStay60");
  return v4("clsBlankStay");
}

function bandLabel(v4: V4, name: string): string {
  if (name === "apple") return v4("syoApple");
  if (name === "window") return v4("syoWindow");
  if (name === "linux") return v4("syoLinux");
  if (name === "plain") return v4("syoPlain");
  if (name === "blank") return v4("syoClear");
  return v4("syoUnmarked");
}

function crestToneLabel(v4: V4, name: string): string {
  if (name === "gilt") return v4("syoGilt");
  if (name === "ink") return v4("syoInk");
  if (name === "ivory") return v4("syoIvory");
  if (name === "plain") return v4("syoTonePlain");
  return v4("syoUnmarked");
}

function auditLabel(v4: V4, audit: string): string {
  const key = {
    save: "clsAuditSave",
    edit: "clsAuditEdit",
    tone: "clsAuditTone",
    pin: "clsAuditPin",
    unpin: "clsAuditUnpin",
    hold: "clsAuditHold",
    lift: "clsAuditLift",
    close: "clsAuditClose",
    open: "clsAuditOpen",
    cloth: "clsAuditCloth",
    tag: "clsAuditTag",
    gilt: "clsAuditGilt",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, seat: number | null, desk: string): string {
  const gap = seatGap(seat, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("clsPast")} ${gap}`;
  if (gap < 0) return `${v4("clsAhead")} ${Math.abs(gap)}`;
  return v4("clsDue");
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

export function CloisterStalls({ v4 }: { v4: V4 }) {
  const [stalls, setStalls] = useState<CloisterStall[]>([]);
  const [views, setViews] = useState<StallView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [usher, setUsher] = useState("");
  const [seat, setSeat] = useState("");
  const [cloth, setCloth] = useState("");
  const [tone, setTone] = useState("");
  const [cord, setCord] = useState("");
  const [stayValue, setStayValue] = useState("");
  const [tag, setTag] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<StallTray>("open");
  const [usherFilter, setUsherFilter] = useState("all");
  const [clothFilter, setClothFilter] = useState("all");
  const [toneFilter, setToneFilter] = useState("all");
  const [seatFilter, setSeatFilter] = useState("all");
  const [cordFilter, setCordFilter] = useState("all");
  const [stayFilter, setStayFilter] = useState("all");
  const [brightOnly, setBrightOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [awakeOnly, setAwakeOnly] = useState(false);
  const [board, setBoard] = useState<"aisle" | "timeline">("aisle");
  const [order, setOrder] = useState<StallSort>("seat");
  const [density, setDensity] = useState<StallDensity>("roomy");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [deskSeat, setDeskSeat] = useState("");
  const [moveCloth, setMoveCloth] = useState("slate");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<() => void>(() => {});
  const giltRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readStalls(readJson(CLS_KEY, []));
    const saved = readStallViews(readJson(CLS_VIEW_KEY, []));
    setStalls(next);
    setViews(saved);
    setDensity(densityOf(readJson(CLS_DENSITY_KEY, "roomy")));
    writeJson(CLS_KEY, next);
    writeJson(CLS_VIEW_KEY, saved);
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: CloisterStall[]) {
    const saved = readStalls(next);
    setStalls(saved);
    writeJson(CLS_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((stall) => stall.id === id)));
  }
  function storeViews(next: StallView[]) {
    const saved = readStallViews(next);
    setViews(saved);
    writeJson(CLS_VIEW_KEY, saved);
  }
  function storeDensity(next: StallDensity) {
    setDensity(next);
    writeJson(CLS_DENSITY_KEY, next);
  }
  const ushers = stallUshers(stalls);
  const cloths = stallCloths(stalls);
  const bars = CLOTHS.map((item) => ({ cloth: item.toUpperCase(), count: stalls.filter((stall) => stall.cloth === item.toUpperCase()).length })).filter((row) => row.count > 0);
  const usherOn = activeUsher(usherFilter, ushers);
  const clothOn = activeCloth(clothFilter, cloths);
  const toneOn = activeTone(toneFilter, ["hush", "warm", "bright"]);
  const seatOn = activeSeat(seatFilter);
  const cordOn = activeCord(cordFilter);
  const stayOn = activeStay(stayFilter);
  const pickedSeat = seatArg(seatOn);
  const shown = sortStalls(visibleStalls(
    stalls,
    tray,
    query,
    usherArg(usherOn),
    clothArg(clothOn),
    toneArg(toneOn),
    pickedSeat.exact,
    pickedSeat.pick,
    cordArg(cordOn),
    stayArg(stayOn),
    brightOnly,
    peakOnly,
    houseOnly,
    quietOnly,
    awakeOnly,
  ), order);
  const timeline = stallTimeline(stalls, query);
  const counts = stallCounts(stalls, deskSeat);
  const clashes = clashSeatCount(stalls);
  const cords = cordClashCount(stalls);
  const neighbors = adjacentStallCount(stalls);
  const nextId = nextStall(stalls, deskSeat);
  const nextRow = stalls.find((stall) => stall.id === nextId);
  const suggestedCloth = suggestCloth(stalls);
  const suggestedUsher = suggestUsher(stalls);
  const suggestedStay = suggestStay(stalls);
  const fair = fairUsher(stalls, roster);
  const busy = busiestUsher(stalls);
  const reminders = reminderStalls(stalls, deskSeat);
  const windowRows = windowStalls(stalls, deskSeat);
  const share = lateShare(stalls, deskSeat);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  pinRef.current = () => {
    if (viewer) return;
    const ids = (board === "timeline" ? timeline : shown).map((stall) => stall.id);
    store(pinFocused(stalls, ids, focus));
  };
  giltRef.current = () => {
    if (viewer) return;
    const ids = (board === "timeline" ? timeline : shown).map((stall) => stall.id);
    store(giltFocused(stalls, ids, focus));
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
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        giltRef.current();
        return;
      }
      if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        setBoard((current) => (current === "aisle" ? "timeline" : "aisle"));
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
    setSeat("");
    setCloth("");
    setTone("");
    setCord("");
    setStayValue("");
    setTag("");
    setQuery("");
    setEditing("");
  }
  function applyView(view: StallView) {
    setTray(view.tray);
    setQuery(view.query);
    setUsherFilter(view.usher);
    setClothFilter(view.cloth);
    setToneFilter(view.tone);
    setSeatFilter(view.seat);
    setCordFilter(view.cord);
    setStayFilter(view.stay);
  }
  const rows = board === "timeline" ? timeline : shown;
  return (
    <section className="c4-cls" aria-label={v4("clsTitle")} data-stalls="1" data-role={role} data-density={density}>
      <div className="c4-cls-sheet">
        <header className="c4-cls-mast">
          <p className="c4-cls-spine">{v4("clsSpine")}</p>
          <div>
            <p className="c4-cls-kicker">{v4("clsSub")}</p>
            <h2 className="c4-title">{v4("clsTitle")}</h2>
          </div>
          <p className="c4-cls-plate" data-logo="mono">{v4("clsLogo")}</p>
        </header>
        <div className="c4-cls-body">
          <p className="c4-cls-rules">{v4("clsHint")}</p>
          <p className="c4-meta">{v4("clsLocal")}</p>
          <p className="c4-meta">{v4("clsNew")} {v4("clsSlash")} {v4("clsEscape")} {v4("clsKeys")} {v4("clsPinKey")} {v4("clsGiltKey")} {v4("clsBoardKey")}</p>
          {viewer && <p className="c4-cls-notice" data-viewer="1">{v4("clsViewer")}</p>}
          {counts.peak > 0 && (
            <p className="c4-cls-notice" role="status">
              {v4("clsNotice")} · {counts.peak}
              <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("clsNoticeAll") : v4("clsNoticePeak")}</button>
            </p>
          )}
          {counts.late > 0 && (
            <p className="c4-cls-notice" role="status" data-late="1">{v4("clsLateNotice")} · {counts.late}</p>
          )}
          <ol className="c4-cls-ledger" aria-label={v4("clsKpi")}>
            <li><span>{v4("clsOpen")}</span><strong>{counts.open}</strong></li>
            <li><span>{v4("clsHeld")}</span><strong>{counts.held}</strong></li>
            <li><span>{v4("clsClosed")}</span><strong>{counts.closed}</strong></li>
            <li><span>{v4("clsPinned")}</span><strong>{counts.pinned}</strong></li>
            <li><span>{v4("clsPeak")}</span><strong>{counts.peak}</strong></li>
            <li><span>{v4("clsLate")}</span><strong>{counts.late}</strong></li>
            <li><span>{v4("clsSoon")}</span><strong>{counts.soon}</strong></li>
            <li><span>{v4("clsGilt")}</span><strong>{counts.gilt}</strong></li>
            <li><span>{v4("clsHouseShare")}</span><strong>{stallShare(counts.house, stalls.length)}%</strong></li>
            <li><span>{v4("clsLateShare")}</span><strong>{share}%</strong></li>
          </ol>
          <div className="c4-cls-sla" aria-label={v4("clsLateShare")}>
            <span>{v4("clsLateShare")}</span>
            <div className="c4-cls-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></div>
          </div>
          <div className="c4-cls-rail" aria-label={v4("clsCloths")}>
            {bars.map((bar) => (
              <div key={bar.cloth} className="c4-cls-meter" data-cloth={bar.cloth.toLowerCase()}>
                <button type="button" className="c4-btn" onClick={() => setClothFilter(bar.cloth)}>{clothLabel(v4, bar.cloth)} · {bar.count}</button>
                <div className="c4-cls-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
              </div>
            ))}
            {!bars.length && <p className="c4-cls-empty">{v4("clsEmpty")}</p>}
          </div>
          <div className="c4-cls-suggest">
            <p>{v4("clsSuggestCloth")} · {clothLabel(v4, suggestedCloth)}</p>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setCloth(suggestedCloth.toLowerCase())}>{v4("clsUseCloth")}</button>
            <p>{v4("clsSuggestUsher")} · {suggestedUsher || v4("clsBlankUsher")}</p>
            <button type="button" className="c4-btn" disabled={viewer || !suggestedUsher} onClick={() => setUsher(suggestedUsher)}>{v4("clsUseUsher")}</button>
            <p>{v4("clsSuggestStay")} · {stayLabel(v4, suggestedStay)}</p>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setStayValue(String(suggestedStay))}>{v4("clsUseStay")}</button>
            <p>{v4("clsAssign")} · {fair || v4("clsBlankUsher")}</p>
            <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setUsher(fair)}>{v4("clsAssign")}</button>
          </div>
          <p className="c4-meta">{v4("clsSeats")} · {usedSeats(stalls)}</p>
          <p className="c4-meta">{clashes ? `${v4("clsClash")} · ${clashes}` : v4("clsClashNone")}</p>
          <p className="c4-meta">{cords ? `${v4("clsCordClash")} · ${cords}` : v4("clsCordClashNone")}</p>
          <p className="c4-meta">{neighbors ? `${v4("clsAdjacent")} · ${neighbors}` : v4("clsAdjacentNone")}</p>
          <p className="c4-meta">{pairUsherCount(stalls) ? `${v4("clsPairs")} · ${pairUsherCount(stalls)}` : v4("clsPairsNone")}</p>
          <p className="c4-meta">{`${v4("clsGiltLoad")} · ${giltLoad(stalls)}`}</p>
          <p className="c4-meta">{`${v4("clsQuietHouse")} · ${quietHouseCount(stalls)}`}</p>
          <p className="c4-meta">{`${v4("clsBrightLoad")} · ${brightLoad(stalls)}`}</p>
          <p className="c4-meta">{`${v4("clsSeatSpan")} · ${seatSpan(stalls)}`}</p>
          <p className="c4-meta">{nextRow ? `${v4("clsNext")} · ${nextRow.title}` : v4("clsNextNone")}</p>
          <p className="c4-meta">{busy ? `${v4("clsBusiest")} · ${busy}` : v4("clsBusiestNone")}</p>
          <div className="c4-cls-reminders" aria-label={v4("clsReminders")}>
            {reminders.length ? reminders.map((stall) => <span key={stall.id}>{stall.title}</span>) : <span>{v4("clsReminderNone")}</span>}
          </div>
          <div className="c4-cls-window" aria-label={v4("clsWindow")}>
            {windowRows.length ? windowRows.map((stall) => <span key={stall.id}>{stall.title}</span>) : <span>{v4("clsWindowNone")}</span>}
          </div>
          <label className="c4-lab">{v4("clsSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("clsSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <div className="c4-cls-filters" role="group" aria-label={v4("clsSearch")}>
            {(["open", "held", "closed"] as const).map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("clsOpenTray") : item === "held" ? v4("clsHeldTray") : v4("clsClosedTray")}</button>
            ))}
            <button type="button" className="c4-chip" data-on={usherOn === "all" ? "1" : "0"} onClick={() => setUsherFilter("all")}>{v4("clsAll")}</button>
            <button type="button" className="c4-chip" data-on={usherOn === "blank" ? "1" : "0"} onClick={() => setUsherFilter("blank")}>{v4("clsBlankUsher")}</button>
            {ushers.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={usherOn === name ? "1" : "0"} onClick={() => setUsherFilter(name)}>{name}</button>
            ))}
            <button type="button" className="c4-chip" data-on={clothOn === "all" ? "1" : "0"} onClick={() => setClothFilter("all")}>{v4("clsCloth")}</button>
            <button type="button" className="c4-chip" data-on={clothOn === "blank" ? "1" : "0"} onClick={() => setClothFilter("blank")}>{v4("clsBlankCloth")}</button>
            {CLOTHS.map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={clothOn === item.toUpperCase() ? "1" : "0"} onClick={() => setClothFilter(item)}>{clothLabel(v4, item)}</button>
            ))}
            <button type="button" className="c4-chip" data-on={toneOn === "all" ? "1" : "0"} onClick={() => setToneFilter("all")}>{v4("clsTone")}</button>
            {TONES.map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={toneOn === item ? "1" : "0"} onClick={() => setToneFilter(item)}>{toneLabel(v4, item)}</button>
            ))}
            {["all", "blank", "early", "mid", "late", "peak", "quiet", "1", "6"].map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={seatOn === item ? "1" : "0"} onClick={() => setSeatFilter(item)}>{item === "all" ? v4("clsSeat") : item === "blank" ? v4("clsBlankSeat") : item === "early" ? v4("clsEarly") : item === "mid" ? v4("clsMid") : item === "late" ? v4("clsLateSeat") : item === "peak" ? v4("clsPeak") : item === "quiet" ? v4("clsQuiet") : item}</button>
            ))}
            {["all", "blank", "4", "7", "11"].map((item) => (
              <button key={`c${item}`} type="button" className="c4-chip" data-on={cordOn === item ? "1" : "0"} onClick={() => setCordFilter(item)}>{item === "all" ? v4("clsCord") : item === "blank" ? v4("clsBlankCord") : cordLabel(v4, Number(item))}</button>
            ))}
            {["all", "blank", "15", "30", "60"].map((item) => (
              <button key={`s${item}`} type="button" className="c4-chip" data-on={stayOn === item ? "1" : "0"} onClick={() => setStayFilter(item)}>{item === "all" ? v4("clsStay") : item === "blank" ? v4("clsBlankStay") : stayLabel(v4, Number(item))}</button>
            ))}
            <button type="button" className="c4-chip" data-on={brightOnly ? "1" : "0"} onClick={() => setBrightOnly((on) => !on)}>{v4("clsBrightOnly")}</button>
            <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((on) => !on)}>{v4("clsPeakOnly")}</button>
            <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((on) => !on)}>{v4("clsHouseOnly")}</button>
            <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((on) => !on)}>{v4("clsQuietOnly")}</button>
            <button type="button" className="c4-chip" data-on={awakeOnly ? "1" : "0"} onClick={() => setAwakeOnly((on) => !on)}>{v4("clsUngiltOnly")}</button>
            <button type="button" className="c4-chip" data-on={order === "seat" ? "1" : "0"} onClick={() => setOrder(sortMode("seat"))}>{v4("clsSortSeat")}</button>
            <button type="button" className="c4-chip" data-on={order === "usher" ? "1" : "0"} onClick={() => setOrder(sortMode("usher"))}>{v4("clsSortUsher")}</button>
            <button type="button" className="c4-chip" data-on={density === "roomy" ? "1" : "0"} onClick={() => storeDensity("roomy")}>{v4("clsRoomy")}</button>
            <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity("tight")}>{v4("clsTight")}</button>
            <button type="button" className="c4-chip" data-on={board === "aisle" ? "1" : "0"} onClick={() => setBoard("aisle")}>{v4("clsAisle")}</button>
            <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard("timeline")}>{v4("clsTimeline")}</button>
          </div>
          <form className="c4-cls-form" onSubmit={(event) => {
            event.preventDefault();
            if (viewer) return;
            store(addStall(stalls, { id: `cls-${Date.now()}`, title, note, usher, seat, cloth, tone, cord, stay: stayValue, tags: tag }));
            clearDraft();
          }}>
            <label className="c4-lab">{v4("clsLine")}<input ref={titleRef} className="c4-field" aria-label={v4("clsLine")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
            <label className="c4-lab">{v4("clsNote")}<input className="c4-field" aria-label={v4("clsNote")} value={note} onChange={(event) => setNote(event.target.value)} /></label>
            <label className="c4-lab">{v4("clsUsher")}<input className="c4-field" aria-label={v4("clsUsher")} value={usher} onChange={(event) => setUsher(event.target.value)} /></label>
            <label className="c4-lab">{v4("clsSeat")}<input className="c4-field" aria-label={v4("clsSeat")} value={seat} onChange={(event) => setSeat(event.target.value)} /></label>
            <label className="c4-lab">{v4("clsCloth")}<input className="c4-field" aria-label={v4("clsCloth")} value={cloth} onChange={(event) => setCloth(event.target.value)} /></label>
            <label className="c4-lab">{v4("clsTone")}<input className="c4-field" aria-label={v4("clsTone")} value={tone} onChange={(event) => setTone(event.target.value)} /></label>
            <label className="c4-lab">{v4("clsCord")}<input className="c4-field" aria-label={v4("clsCord")} value={cord} onChange={(event) => setCord(event.target.value)} /></label>
            <label className="c4-lab">{v4("clsStay")}<input className="c4-field" aria-label={v4("clsStay")} value={stayValue} onChange={(event) => setStayValue(event.target.value)} /></label>
            <label className="c4-lab">{v4("clsTag")}<input className="c4-field" aria-label={v4("clsTag")} value={tag} onChange={(event) => setTag(event.target.value)} /></label>
            <button type="submit" className="c4-btn" disabled={viewer}>{v4("clsSave")}</button>
          </form>
          <label className="c4-lab">{v4("clsDeskSeat")}<input className="c4-field" aria-label={v4("clsDeskSeat")} value={deskSeat} onChange={(event) => setDeskSeat(event.target.value)} /></label>
          <label className="c4-lab">{v4("clsRoster")}<input className="c4-field" aria-label={v4("clsRoster")} value={roster} onChange={(event) => setRoster(event.target.value)} /></label>
          <div className="c4-cls-views">
            <label className="c4-lab">{v4("clsViewName")}<input className="c4-field" aria-label={v4("clsViewName")} value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
              const name = viewName.trim();
              if (!name) return;
              storeViews(addStallView(views, { id: `view-${Date.now()}`, name, tray, query, usher: usherOn, cloth: clothOn, tone: toneOn, seat: seatOn, cord: cordOn, stay: stayOn }));
              setViewName("");
            }}>{v4("clsSaveView")}</button>
            {views.map((view) => (
              <span key={view.id}>
                <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
                <button type="button" className="c4-btn" disabled={viewer} aria-label={v4("clsDropView")} onClick={() => storeViews(dropStallView(views, view.id))}>×</button>
              </span>
            ))}
          </div>
          <div className="c4-cls-bulk">
            <label className="c4-lab">{v4("clsBulkCloth")}<input className="c4-field" aria-label={v4("clsBulkCloth")} value={moveCloth} onChange={(event) => setMoveCloth(event.target.value)} /></label>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkStallCloth(stalls, picked, moveCloth))}>{v4("clsBulkCloth")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkStallPin(stalls, picked, true))}>{v4("clsBulkPin")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkStallClose(stalls, picked, true))}>{v4("clsBulkClose")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkStallTag(stalls, picked, tag))}>{v4("clsBulkTag")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkStallTone(stalls, picked, tone))}>{v4("clsBulkTone")}</button>
            <button type="button" className="c4-btn" onClick={() => download("cloister-stalls.csv", stallsCsv(stalls, deskSeat))}>{v4("clsCsv")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetStalls())}>{v4("clsReset")}</button>
          </div>
          {!rows.length && <p className="c4-cls-empty">{v4("clsEmpty")}</p>}
          <ol className={board === "timeline" ? "c4-cls-time" : "c4-cls-book"}>
            {rows.map((stall, index) => (
              <li key={stall.id} data-focus={index === moveFocus(focus, rows.length, 0) ? "1" : "0"} data-cloth={stall.cloth.toLowerCase() || "blank"} data-late={lateStall(stall, deskSeat) ? "1" : "0"} data-soon={soonStall(stall) ? "1" : "0"} data-house={houseCloth(stall.cloth) ? "1" : "0"} data-peak={peakSeat(stall.seat) ? "1" : "0"} data-quiet={quietSeat(stall.seat) ? "1" : "0"}>
                <label className="c4-lab"><span className="c4-meta">{v4("clsPick")}</span><input type="checkbox" aria-label={v4("clsPick")} checked={picked.includes(stall.id)} onChange={() => setPicked((ids) => ids.includes(stall.id) ? ids.filter((id) => id !== stall.id) : [...ids, stall.id])} /></label>
                <div>
                  <strong>{stall.title}</strong>
                  <span className="c4-meta">{stall.usher || v4("clsBlankUsher")} · {clothLabel(v4, stall.cloth)} · {toneLabel(v4, stall.tone)} · {cordLabel(v4, stall.cord)} · {stayLabel(v4, stall.stay)} · {gapLabel(v4, stall.seat, deskSeat)}</span>
                  {stall.note && <span className="c4-meta">{stall.note}</span>}
                  {stall.tags.length > 0 && <span className="c4-meta">{stall.tags.join(" ")}</span>}
                  {stall.audit && <span className="c4-meta">{v4("clsAudit")} · {auditLabel(v4, stall.audit)}</span>}
                  {editing === stall.id && (
                    <div className="c4-row">
                      <input className="c4-field" aria-label={v4("clsLine")} value={draft} onChange={(event) => setDraft(event.target.value)} />
                      <input className="c4-field" aria-label={v4("clsNote")} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} />
                      <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(editStallNote(editStall(stalls, stall.id, draft), stall.id, noteDraft)); setEditing(""); }}>{v4("clsApply")}</button>
                    </div>
                  )}
                  <div className="c4-row">
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setStallPin(stalls, stall.id, !stall.pinned))}>{stall.pinned ? v4("clsUnpin") : v4("clsPin")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setStallHold(stalls, stall.id, !stall.held))}>{stall.held ? v4("clsLift") : v4("clsHold")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleTone(stalls, stall.id))}>{v4("clsTone")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addStallTag(stalls, stall.id, tag))}>{v4("clsTag")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setStallClose(stalls, stall.id, !stall.closed))}>{stall.closed ? v4("clsReopen") : v4("clsClose")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setStallGilt(stalls, stall.id, stall.gilt ? 0 : 2))}>{stall.gilt ? v4("clsGiltOff") : v4("clsGiltOn")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(stall.id); setDraft(stall.title); setNoteDraft(stall.note); }}>{v4("clsEdit")}</button>
                    <button type="button" className="c4-btn" onClick={() => { const line = stallCopy(stall, deskSeat); void navigator.clipboard?.writeText(line); setCopied(stall.id); }}>{copied === stall.id ? v4("clsCopied") : v4("clsCopy")}</button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <p className="c4-cls-rules">{v4("clsRules")}</p>
        </div>
      </div>
    </section>
  );
}

export function SystemCrests({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [band, setBand] = useState("all");
  const [tone, setTone] = useState("all");
  const [shape, setShape] = useState<CrestShape>("all");
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
    note: { lastOs: user.lastOs ?? null },
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
    const present = presentCrests(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenCrests(readJson(SYO_KEY, []), present);
    const nextReviewed = readReviewedCrests(readJson(SYO_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(SYO_KEY, nextHidden);
    writeJson(SYO_REVIEW_KEY, nextReviewed);
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
  const present = presentCrests(rows);
  const bands = visibleCrestBands(present, hidden, showHidden);
  const bandOn = activeCrestBand(band, present);
  const toneOn = activeCrestTone(tone);
  const shown = visibleCrestCustomers(rows, crestBandArg(bandOn), crestToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = crestState(row.note);
      const token = state === "set" ? crestBand(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return bands.includes(token);
    });
  const lead = leadingCrest(rows);
  const toneLead = leadingCrestTone(rows);
  const shared = sharedCrestCount(rows);
  const catalog = catalogCrestCount(rows);
  const bars = crestBands(rows).filter((line) => line.band);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(SYO_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedCrests(next, ids);
    setReviewed(saved);
    writeJson(SYO_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-syo" aria-label={v4("syoTitle")} data-crests="1" data-role={role} data-catalog={catalog ? "1" : "0"}>
      <div className="c4-syo-sheet">
        <header className="c4-syo-mast">
          <div>
            <p className="c4-syo-kicker">{v4("syoSub")}</p>
            <h2 className="c4-title">{v4("syoTitle")}</h2>
          </div>
          <p className="c4-syo-plate" data-logo="mono">{v4("syoLogo")}</p>
        </header>
        <p className="c4-syo-rules">{v4("syoHint")}</p>
        <p className="c4-meta">{v4("syoKept")} {v4("syoEscape")}</p>
        {viewer && <p className="c4-syo-notice" data-viewer="1">{v4("syoViewer")}</p>}
        {data.error && <p className="c4-syo-empty" role="alert">{v4("syoFailed")}</p>}
        {data.loading && <p className="c4-meta">{v4("syoLoading")}</p>}
        {shared > 0 && <p className="c4-syo-notice" role="status">{v4("syoNotice")} · {shared}</p>}
        <ol className="c4-syo-ledger" aria-label={v4("syoKpi")}>
          <li><span>{v4("syoSet")}</span><strong>{rows.filter((row) => crestState(row.note) === "set").length}</strong></li>
          <li><span>{v4("syoCatalog")}</span><strong>{catalog}</strong></li>
          <li><span>{v4("syoWide")}</span><strong>{wideCrestCount(rows)}</strong></li>
          <li><span>{v4("syoGiltCount")}</span><strong>{giltCrestCount(rows)}</strong></li>
          <li><span>{v4("syoShare")}</span><strong>{crestShare(catalog, rows.length)}%</strong></li>
          <li><span>{v4("syoShared")}</span><strong>{shared}</strong></li>
        </ol>
        <div className="c4-syo-rail" aria-label={v4("syoBands")}>
          {bars.map((bar) => (
            <div key={bar.band} className="c4-syo-meter">
              <button type="button" className="c4-btn" onClick={() => setBand(bar.band)}>{bandLabel(v4, bar.band)} · {bar.count}</button>
              <div className="c4-syo-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            </div>
          ))}
          {!bars.length && <p className="c4-syo-empty">{v4("syoEmpty")}</p>}
        </div>
        <div className="c4-syo-suggest">
          <p>{v4("syoLeading")} · {lead ? bandLabel(v4, lead) : v4("syoLeadingNone")}</p>
          <p>{v4("syoToneLead")} · {toneLead ? crestToneLabel(v4, toneLead) : v4("syoToneNone")}</p>
          <p>{shared ? `${v4("syoShared")} · ${shared}` : v4("syoSharedNone")}</p>
        </div>
        <label className="c4-lab">{v4("syoSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("syoSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <div className="c4-syo-filters">
          <button type="button" className="c4-chip" data-on={bandOn === "all" ? "1" : "0"} onClick={() => setBand("all")}>{v4("syoAll")}</button>
          <button type="button" className="c4-chip" data-on={bandOn === "blank" ? "1" : "0"} onClick={() => setBand("blank")}>{v4("syoClear")}</button>
          {BANDS.map((item) => (
            <button key={item} type="button" className="c4-chip" data-on={bandOn === item ? "1" : "0"} onClick={() => setBand(item)}>{bandLabel(v4, item)}</button>
          ))}
          <button type="button" className="c4-chip" data-on={toneOn === "all" ? "1" : "0"} onClick={() => setTone("all")}>{v4("syoTone")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "gilt" ? "1" : "0"} onClick={() => setTone("gilt")}>{v4("syoGilt")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "ink" ? "1" : "0"} onClick={() => setTone("ink")}>{v4("syoInk")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "ivory" ? "1" : "0"} onClick={() => setTone("ivory")}>{v4("syoIvory")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "plain" ? "1" : "0"} onClick={() => setTone("plain")}>{v4("syoTonePlain")}</button>
          {(["all", "catalog", "wide", "gilt"] as const).map((item) => (
            <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{item === "all" ? v4("syoAllShapes") : item === "catalog" ? v4("syoCatalog") : item === "wide" ? v4("syoWide") : v4("syoGilt")}</button>
          ))}
          <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} onClick={() => setReview("all")}>{v4("syoAllReview")}</button>
          <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview("reviewed")}>{v4("syoReviewed")}</button>
          <button type="button" className="c4-chip" data-on={review === "open" ? "1" : "0"} onClick={() => setReview("open")}>{v4("syoOpenReview")}</button>
          <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("syoShown") : v4("syoHidden")}</button>
        </div>
        <div className="c4-syo-bands">
          {present.map((item) => (
            <button key={item} type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleCrest(hidden, item))}>
              {bandLabel(v4, item)} · {hidden.includes(item) ? v4("syoShow") : v4("syoHide")}
            </button>
          ))}
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkCrestReview(reviewed, shown.map((row) => row.id), true))}>{v4("syoBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkCrestReview(reviewed, ids, false))}>{v4("syoBulkClear")}</button>
          <button type="button" className="c4-btn" onClick={() => download("system-crests.csv", crestsCsv(rows))}>{v4("syoCsv")}</button>
          <button type="button" className="c4-btn" onClick={() => download("system-crest-rows.csv", crestRowsCsv(rows, reviewed))}>{v4("syoRowCsv")}</button>
          <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("syoCustomers")}</Link>
        </div>
        {!shown.length && <p className="c4-syo-empty">{v4("syoEmpty")}</p>}
        <ul className="c4-syo-index">
          {shown.map((row) => {
            const state = crestState(row.note);
            const mark = crestOf(row.note);
            return (
              <li key={row.id} data-state={state || "blank"} data-band={state === "set" ? crestBand(row.note) : "blank"} data-tone={crestTone(row.note) || "blank"} data-catalog={catalogCrest(row.note) ? "1" : "0"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"}>
                <p className="c4-syo-mark" data-logo="mono">{mark || "—"}</p>
                <div>
                  <strong>{row.label || row.id}</strong>
                  <span className="c4-meta">{bandLabel(v4, state === "set" ? crestBand(row.note) : state === "clear" ? "blank" : "")} · {crestToneLabel(v4, crestTone(row.note))}</span>
                  {catalogCrest(row.note) && <span className="c4-meta">{v4("syoCatalogMark")}</span>}
                  <div className="c4-row">
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleCrestReview(reviewed, row.id))}>{v4("syoReview")}</button>
                    <button type="button" className="c4-btn" onClick={() => { const line = crestCopy(row.note); void navigator.clipboard?.writeText(line); setCopied(row.id); }}>{copied === row.id ? v4("syoCopied") : v4("syoCopy")}</button>
                    <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{row.label || row.id}</Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="c4-syo-rules">{v4("syoRules")}</p>
      </div>
    </section>
  );
}
