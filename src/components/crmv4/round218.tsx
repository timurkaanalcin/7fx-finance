"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  FPN_DENSITY_KEY,
  FPN_KEY,
  FPN_VIEW_KEY,
  MCR_KEY,
  MCR_REVIEW_KEY,
  activeCrestLane,
  activeCrestTone,
  activeDrops,
  activeFlow,
  activeInk,
  activeNib,
  activeScribe,
  activeWeight,
  addPen,
  addPenTag,
  addPenView,
  adjacentPenCount,
  bulkCrestReview,
  bulkPenArchive,
  bulkPenFlow,
  bulkPenInk,
  bulkPenPin,
  bulkPenTag,
  busiestScribe,
  catalogCrest,
  catalogCrestCount,
  clashNibCount,
  crestCopy,
  crestLane,
  crestLaneArg,
  crestLanes,
  crestOf,
  crestRowsCsv,
  crestShare,
  crestState,
  crestStep,
  crestTone,
  crestToneArg,
  crestsCsv,
  cycleFlow,
  densityOf,
  dropPenView,
  dropsArg,
  dropsClashCount,
  editPen,
  editPenNote,
  fairScribe,
  floodLoad,
  flowArg,
  flowFocused,
  giltCrestCount,
  holdFocused,
  houseInk,
  inkArg,
  latePen,
  lateShare,
  leadingCrest,
  leadingCrestTone,
  matchedPens,
  moveFocus,
  nextPen,
  nibArg,
  nibGap,
  nibSpan,
  pairScribeCount,
  peakNib,
  penCopy,
  penCounts,
  penInks,
  penLedger,
  penScribes,
  penShare,
  pensCsv,
  pinFocused,
  presentCrests,
  quietLoftCount,
  quietNib,
  readHiddenCrests,
  readPenViews,
  readPens,
  readReviewedCrests,
  reminderPens,
  resetPens,
  scribeArg,
  setPenArchive,
  setPenHold,
  setPenPin,
  setPenWeight,
  sharedCrestCount,
  sharedInkCount,
  snoozeFocused,
  snoozePen,
  sortPens,
  suggestDrops,
  suggestInk,
  suggestScribe,
  toggleCrest,
  toggleCrestReview,
  usedNibs,
  visibleCrestCustomers,
  visibleCrestLanes,
  visiblePens,
  weightArg,
  weightLoad,
  wideCrest,
  wideCrestCount,
  windowPens,
  type CrestRow,
  type CrestShape,
  type FountainPen,
  type PenDensity,
  type PenSort,
  type PenTray,
  type PenView,
} from "@/lib/crmv4/round218";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
};

type GlanceRow = CrestRow & { id: string };

const INKS = ["graphite", "ivory", "champagne"] as const;
const FLOWS = ["dry", "wet", "flood"] as const;
const LANES = ["hearth", "court", "porch"] as const;

function inkLabel(v4: V4, ink: string): string {
  if (ink === "graphite" || ink === "GRAPHITE") return v4("fpnGraphite");
  if (ink === "ivory" || ink === "IVORY") return v4("fpnIvory");
  if (ink === "champagne" || ink === "CHAMPAGNE") return v4("fpnChampagne");
  return v4("fpnBlankInk");
}

function flowLabel(v4: V4, flow: string): string {
  if (flow === "dry") return v4("fpnDry");
  if (flow === "wet") return v4("fpnWet");
  if (flow === "flood") return v4("fpnFlood");
  return v4("fpnBlankFlow");
}

function dropsLabel(v4: V4, drops: number | null): string {
  if (drops === 3) return v4("fpnDrop3");
  if (drops === 6) return v4("fpnDrop6");
  if (drops === 9) return v4("fpnDrop9");
  return v4("fpnBlankDrops");
}

function laneLabel(v4: V4, name: string): string {
  if (name === "hearth") return v4("mcrHearth");
  if (name === "court") return v4("mcrCourt");
  if (name === "porch") return v4("mcrPorch");
  if (name === "blank") return v4("mcrClear");
  return v4("mcrUnmarked");
}

function toneLabel(v4: V4, name: string): string {
  if (name === "gilt") return v4("mcrGilt");
  if (name === "ink") return v4("mcrInk");
  if (name === "ivory") return v4("mcrIvory");
  if (name === "mist") return v4("mcrMist");
  return v4("mcrUnmarked");
}

function kindLabel(v4: V4, step: number): string {
  if (step === 1) return v4("mcrPlain");
  if (step === 2) return v4("mcrAlias");
  if (step === 3) return v4("mcrDeep");
  return v4("mcrClear");
}

function auditLabel(v4: V4, audit: string): string {
  const key = {
    save: "fpnAuditSave",
    edit: "fpnAuditEdit",
    flow: "fpnAuditFlow",
    pin: "fpnAuditPin",
    unpin: "fpnAuditUnpin",
    hold: "fpnAuditHold",
    resume: "fpnAuditResume",
    archive: "fpnAuditArchive",
    open: "fpnAuditOpen",
    ink: "fpnAuditInk",
    tag: "fpnAuditTag",
    weight: "fpnAuditWeight",
    drops: "fpnAuditDrops",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, nib: number | null, desk: string): string {
  const gap = nibGap(nib, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("fpnPast")} ${gap}`;
  if (gap < 0) return `${v4("fpnAhead")} ${Math.abs(gap)}`;
  return v4("fpnDue");
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

export function FountainPens({ v4 }: { v4: V4 }) {
  const [pens, setPens] = useState<FountainPen[]>([]);
  const [views, setViews] = useState<PenView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [scribe, setScribe] = useState("");
  const [nib, setNib] = useState("");
  const [ink, setInk] = useState("");
  const [flow, setFlow] = useState("");
  const [dropsValue, setDropsValue] = useState("");
  const [tag, setTag] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<PenTray>("open");
  const [scribeFilter, setScribeFilter] = useState("all");
  const [inkFilter, setInkFilter] = useState("all");
  const [flowFilter, setFlowFilter] = useState("all");
  const [nibFilter, setNibFilter] = useState("all");
  const [dropsFilter, setDropsFilter] = useState("all");
  const [weightFilter, setWeightFilter] = useState("all");
  const [floodOnly, setFloodOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [lightOnly, setLightOnly] = useState(false);
  const [board, setBoard] = useState<"tower" | "line">("tower");
  const [order, setOrder] = useState<PenSort>("nib");
  const [density, setDensity] = useState<PenDensity>("airy");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [deskNib, setDeskNib] = useState("");
  const [moveInk, setMoveInk] = useState("ivory");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<() => void>(() => {});
  const dropsRef = useRef<() => void>(() => {});
  const holdRef = useRef<() => void>(() => {});
  const flowRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readPens(readJson(FPN_KEY, []));
    const saved = readPenViews(readJson(FPN_VIEW_KEY, []));
    setPens(next);
    setViews(saved);
    setDensity(densityOf(readJson(FPN_DENSITY_KEY, "airy")));
    writeJson(FPN_KEY, next);
    writeJson(FPN_VIEW_KEY, saved);
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: FountainPen[]) {
    const saved = readPens(next);
    setPens(saved);
    writeJson(FPN_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((pen) => pen.id === id)));
  }
  function storeViews(next: PenView[]) {
    const saved = readPenViews(next);
    setViews(saved);
    writeJson(FPN_VIEW_KEY, saved);
  }
  function storeDensity(next: PenDensity) {
    setDensity(next);
    writeJson(FPN_DENSITY_KEY, next);
  }
  const scribes = penScribes(pens);
  const inks = penInks(pens);
  const bars = INKS.map((item) => ({ ink: item.toUpperCase(), count: pens.filter((pen) => pen.ink === item.toUpperCase()).length })).filter((row) => row.count > 0);
  const scribeOn = activeScribe(scribeFilter, scribes);
  const inkOn = activeInk(inkFilter, inks);
  const flowOn = activeFlow(flowFilter, ["dry", "wet", "flood"]);
  const nibOn = activeNib(nibFilter);
  const dropsOn = activeDrops(dropsFilter);
  const weightOn = activeWeight(weightFilter);
  const pickedNib = nibArg(nibOn);
  const shown = sortPens(visiblePens(
    pens,
    tray,
    query,
    scribeArg(scribeOn),
    inkArg(inkOn),
    flowArg(flowOn),
    pickedNib.exact,
    pickedNib.pick,
    dropsArg(dropsOn),
    weightArg(weightOn),
    floodOnly,
    peakOnly,
    houseOnly,
    quietOnly,
    lightOnly,
  ), order);
  const ledger = penLedger(pens, query);
  const counts = penCounts(pens, deskNib);
  const clashes = clashNibCount(pens);
  const drops = dropsClashCount(pens);
  const neighbors = adjacentPenCount(pens);
  const nextId = nextPen(pens, deskNib);
  const nextRow = pens.find((pen) => pen.id === nextId);
  const suggestedInk = suggestInk(pens);
  const suggestedScribe = suggestScribe(pens);
  const suggestedDrops = suggestDrops(pens);
  const fair = fairScribe(pens, roster);
  const busy = busiestScribe(pens);
  const reminders = reminderPens(pens, deskNib);
  const windowRows = windowPens(pens, deskNib);
  const share = lateShare(pens, deskNib);
  const matched = matchedPens(pens, deskNib);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  pinRef.current = () => {
    if (viewer) return;
    const ids = (board === "line" ? ledger : shown).map((pen) => pen.id);
    store(pinFocused(pens, ids, focus));
  };
  dropsRef.current = () => {
    if (viewer) return;
    const ids = (board === "line" ? ledger : shown).map((pen) => pen.id);
    store(snoozeFocused(pens, ids, focus));
  };
  holdRef.current = () => {
    if (viewer) return;
    const ids = (board === "line" ? ledger : shown).map((pen) => pen.id);
    store(holdFocused(pens, ids, focus));
  };
  flowRef.current = () => {
    if (viewer) return;
    const ids = (board === "line" ? ledger : shown).map((pen) => pen.id);
    store(flowFocused(pens, ids, focus));
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
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        dropsRef.current();
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        holdRef.current();
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        flowRef.current();
        return;
      }
      if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        setBoard((current) => (current === "tower" ? "line" : "tower"));
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
    setScribe("");
    setNib("");
    setInk("");
    setFlow("");
    setDropsValue("");
    setTag("");
    setQuery("");
    setEditing("");
  }
  function applyView(view: PenView) {
    setTray(view.tray);
    setQuery(view.query);
    setScribeFilter(view.scribe);
    setInkFilter(view.ink);
    setFlowFilter(view.flow);
    setNibFilter(view.nib);
    setDropsFilter(view.drops);
    setWeightFilter(view.weight);
  }
  const rows = board === "line" ? ledger : shown;
  return (
    <section className="c4-fpn" aria-label={v4("fpnTitle")} data-pens="1" data-role={role} data-density={density}>
      <div className="c4-fpn-sheet">
        <header className="c4-fpn-mast">
          <p className="c4-fpn-spine">{v4("fpnSpine")}</p>
          <div>
            <p className="c4-fpn-kicker">{v4("fpnSub")}</p>
            <h2 className="c4-title">{v4("fpnTitle")}</h2>
          </div>
          <p className="c4-fpn-plate" data-logo="mono">{v4("fpnLogo")}</p>
        </header>
        <div className="c4-fpn-body">
          <p className="c4-fpn-rules">{v4("fpnHint")}</p>
          <p className="c4-meta">{v4("fpnLocal")}</p>
          <p className="c4-meta">{v4("fpnNew")} {v4("fpnSlash")} {v4("fpnEscape")} {v4("fpnKeys")} {v4("fpnPinKey")} {v4("fpnDropsKey")} {v4("fpnHoldKey")} {v4("fpnFlowKey")} {v4("fpnBoardKey")}</p>
          {viewer && <p className="c4-fpn-notice" data-viewer="1">{v4("fpnViewer")}</p>}
          {counts.peak > 0 && (
            <p className="c4-fpn-notice" role="status">
              {v4("fpnNotice")} · {counts.peak}
              <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("fpnNoticeAll") : v4("fpnNoticePeak")}</button>
            </p>
          )}
          {counts.late > 0 && <p className="c4-fpn-notice" role="status" data-late="1">{v4("fpnLateNotice")} · {counts.late}</p>}
          <ol className="c4-fpn-ledger" aria-label={v4("fpnKpi")}>
            <li><span>{v4("fpnOpen")}</span><strong>{counts.open}</strong></li>
            <li><span>{v4("fpnHeld")}</span><strong>{counts.held}</strong></li>
            <li><span>{v4("fpnArchived")}</span><strong>{counts.archived}</strong></li>
            <li><span>{v4("fpnPinned")}</span><strong>{counts.pinned}</strong></li>
            <li><span>{v4("fpnPeak")}</span><strong>{counts.peak}</strong></li>
            <li><span>{v4("fpnLate")}</span><strong>{counts.late}</strong></li>
            <li><span>{v4("fpnSoon")}</span><strong>{counts.soon}</strong></li>
            <li><span>{v4("fpnWeight")}</span><strong>{counts.weight}</strong></li>
            <li><span>{v4("fpnMatched")}</span><strong>{matched}</strong></li>
            <li><span>{v4("fpnHouseShare")}</span><strong>{penShare(counts.house, counts.open)}%</strong></li>
          </ol>
          <div className="c4-fpn-sla" aria-label={v4("fpnLateShare")}>
            <span>{v4("fpnLateShare")} · {share}%</span>
            <div className="c4-fpn-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></div>
          </div>
          <div className="c4-fpn-rail" aria-label={v4("fpnInks")}>
            {bars.map((bar) => (
              <div key={bar.ink} className="c4-fpn-meter" data-ink={bar.ink.toLowerCase()}>
                <button type="button" className="c4-btn" onClick={() => setInkFilter(bar.ink)}>{inkLabel(v4, bar.ink)} · {bar.count}</button>
                <div className="c4-fpn-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
              </div>
            ))}
            {!bars.length && <p className="c4-fpn-empty">{v4("fpnEmpty")}</p>}
          </div>
          <div className="c4-fpn-suggest">
            <p>{v4("fpnSuggestInk")} · {inkLabel(v4, suggestedInk)}</p>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setInk(suggestedInk.toLowerCase())}>{v4("fpnUseInk")}</button>
            <p>{v4("fpnSuggestScribe")} · {suggestedScribe || v4("fpnBlankScribe")}</p>
            <button type="button" className="c4-btn" disabled={viewer || !suggestedScribe} onClick={() => setScribe(suggestedScribe)}>{v4("fpnUseScribe")}</button>
            <p>{v4("fpnSuggestDrops")} · {suggestedDrops}</p>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setDropsValue(String(suggestedDrops))}>{v4("fpnUseDrops")}</button>
            <p>{v4("fpnAssign")} · {fair || v4("fpnBlankScribe")}</p>
            <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setScribe(fair)}>{v4("fpnAssign")}</button>
          </div>
          <p className="c4-meta">{v4("fpnNibs")} · {usedNibs(pens)}</p>
          <p className="c4-meta">{clashes ? `${v4("fpnClash")} · ${clashes}` : v4("fpnClashNone")}</p>
          <p className="c4-meta">{drops ? `${v4("fpnDropsClash")} · ${drops}` : v4("fpnDropsClashNone")}</p>
          <p className="c4-meta">{neighbors ? `${v4("fpnAdjacent")} · ${neighbors}` : v4("fpnAdjacentNone")}</p>
          <p className="c4-meta">{pairScribeCount(pens) ? `${v4("fpnPairs")} · ${pairScribeCount(pens)}` : v4("fpnPairsNone")}</p>
          <p className="c4-meta">{sharedInkCount(pens) ? `${v4("fpnSharedInk")} · ${sharedInkCount(pens)}` : v4("fpnSharedInkNone")}</p>
          <p className="c4-meta">{v4("fpnWeightLoad")} · {weightLoad(pens)}</p>
          <p className="c4-meta">{v4("fpnQuietLoft")} · {quietLoftCount(pens)}</p>
          <p className="c4-meta">{v4("fpnFloodLoad")} · {floodLoad(pens)}</p>
          <p className="c4-meta">{v4("fpnNibSpan")} · {nibSpan(pens)}</p>
          <p className="c4-meta">{nextRow ? `${v4("fpnNext")} · ${nextRow.title}` : v4("fpnNextNone")}</p>
          <p className="c4-meta">{busy ? `${v4("fpnBusiest")} · ${busy}` : v4("fpnBusiestNone")}</p>
          <p className="c4-meta">{reminders.length ? `${v4("fpnReminders")} · ${reminders.map((pen) => pen.title).join(", ")}` : v4("fpnReminderNone")}</p>
          <p className="c4-meta">{windowRows.length ? `${v4("fpnWindow")} · ${windowRows.map((pen) => pen.title).join(", ")}` : v4("fpnWindowNone")}</p>
          <label className="c4-lab">{v4("fpnSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("fpnSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <div className="c4-fpn-filters">
            <button type="button" className="c4-chip" data-on={tray === "open" ? "1" : "0"} onClick={() => setTray("open")}>{v4("fpnOpenTray")}</button>
            <button type="button" className="c4-chip" data-on={tray === "held" ? "1" : "0"} onClick={() => setTray("held")}>{v4("fpnHeldTray")}</button>
            <button type="button" className="c4-chip" data-on={tray === "archived" ? "1" : "0"} onClick={() => setTray("archived")}>{v4("fpnArchivedTray")}</button>
            <button type="button" className="c4-chip" data-on={scribeOn === "all" ? "1" : "0"} onClick={() => setScribeFilter("all")}>{v4("fpnAll")}</button>
            <button type="button" className="c4-chip" data-on={scribeOn === "blank" ? "1" : "0"} onClick={() => setScribeFilter("blank")}>{v4("fpnBlankScribe")}</button>
            {scribes.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={scribeOn === name ? "1" : "0"} onClick={() => setScribeFilter(name)}>{name}</button>
            ))}
            <button type="button" className="c4-chip" data-on={inkOn === "all" ? "1" : "0"} onClick={() => setInkFilter("all")}>{v4("fpnInk")}</button>
            {INKS.map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={inkOn === item.toUpperCase() ? "1" : "0"} onClick={() => setInkFilter(item)}>{inkLabel(v4, item)}</button>
            ))}
            <button type="button" className="c4-chip" data-on={flowOn === "all" ? "1" : "0"} onClick={() => setFlowFilter("all")}>{v4("fpnFlow")}</button>
            {FLOWS.map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={flowOn === item ? "1" : "0"} onClick={() => setFlowFilter(item)}>{flowLabel(v4, item)}</button>
            ))}
            {["all", "blank", "early", "mid", "late", "peak", "quiet", "1", "2", "5", "9"].map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={nibOn === item ? "1" : "0"} onClick={() => setNibFilter(item)}>
                {item === "all" ? v4("fpnNib") : item === "blank" ? v4("fpnBlankNib") : item === "early" ? v4("fpnEarly") : item === "mid" ? v4("fpnMid") : item === "late" ? v4("fpnLateNib") : item === "peak" ? v4("fpnPeak") : item === "quiet" ? v4("fpnQuiet") : item}
              </button>
            ))}
            {["all", "blank", "3", "6", "9"].map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={dropsOn === item ? "1" : "0"} onClick={() => setDropsFilter(item)}>{item === "all" ? v4("fpnDrops") : item === "blank" ? v4("fpnBlankDrops") : item}</button>
            ))}
            {["all", "blank", "0", "3", "6"].map((item) => (
              <button key={`w${item}`} type="button" className="c4-chip" data-on={weightOn === item ? "1" : "0"} onClick={() => setWeightFilter(item)}>{item === "all" ? v4("fpnWeight") : item === "blank" ? v4("fpnBlankWeight") : item}</button>
            ))}
            <button type="button" className="c4-chip" data-on={floodOnly ? "1" : "0"} onClick={() => setFloodOnly((on) => !on)}>{v4("fpnFloodOnly")}</button>
            <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((on) => !on)}>{v4("fpnPeakOnly")}</button>
            <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((on) => !on)}>{v4("fpnHouseOnly")}</button>
            <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((on) => !on)}>{v4("fpnQuietOnly")}</button>
            <button type="button" className="c4-chip" data-on={lightOnly ? "1" : "0"} onClick={() => setLightOnly((on) => !on)}>{v4("fpnLightOnly")}</button>
            <button type="button" className="c4-chip" data-on={order === "nib" ? "1" : "0"} onClick={() => setOrder("nib")}>{v4("fpnSortNib")}</button>
            <button type="button" className="c4-chip" data-on={order === "scribe" ? "1" : "0"} onClick={() => setOrder("scribe")}>{v4("fpnSortScribe")}</button>
            <button type="button" className="c4-chip" data-on={density === "airy" ? "1" : "0"} onClick={() => storeDensity("airy")}>{v4("fpnAiry")}</button>
            <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity("tight")}>{v4("fpnTight")}</button>
            <button type="button" className="c4-chip" data-on={board === "tower" ? "1" : "0"} onClick={() => setBoard("tower")}>{v4("fpnTower")}</button>
            <button type="button" className="c4-chip" data-on={board === "line" ? "1" : "0"} onClick={() => setBoard("line")}>{v4("fpnLine")}</button>
          </div>
          <form className="c4-fpn-form" onSubmit={(event) => {
            event.preventDefault();
            if (viewer) return;
            store(addPen(pens, { id: `pen-${Date.now()}`, title, note, scribe, nib, ink, flow, drops: dropsValue, tags: tag }));
            clearDraft();
          }}>
            <label className="c4-lab">{v4("fpnPen")}<input ref={titleRef} className="c4-field" aria-label={v4("fpnPen")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
            <label className="c4-lab">{v4("fpnNote")}<input className="c4-field" aria-label={v4("fpnNote")} value={note} onChange={(event) => setNote(event.target.value)} /></label>
            <label className="c4-lab">{v4("fpnScribe")}<input className="c4-field" aria-label={v4("fpnScribe")} value={scribe} onChange={(event) => setScribe(event.target.value)} /></label>
            <label className="c4-lab">{v4("fpnNib")}<input className="c4-field" inputMode="numeric" aria-label={v4("fpnNib")} value={nib} onChange={(event) => setNib(event.target.value)} /></label>
            <label className="c4-lab">{v4("fpnInk")}
              <select className="c4-field" aria-label={v4("fpnInk")} value={ink} onChange={(event) => setInk(event.target.value)}>
                <option value="">{v4("fpnBlankInk")}</option>
                {INKS.map((item) => <option key={item} value={item}>{inkLabel(v4, item)}</option>)}
              </select>
            </label>
            <label className="c4-lab">{v4("fpnFlow")}
              <select className="c4-field" aria-label={v4("fpnFlow")} value={flow} onChange={(event) => setFlow(event.target.value)}>
                <option value="">{v4("fpnBlankFlow")}</option>
                {FLOWS.map((item) => <option key={item} value={item}>{flowLabel(v4, item)}</option>)}
              </select>
            </label>
            <label className="c4-lab">{v4("fpnDrops")}<input className="c4-field" inputMode="numeric" aria-label={v4("fpnDrops")} value={dropsValue} onChange={(event) => setDropsValue(event.target.value)} /></label>
            <label className="c4-lab">{v4("fpnTag")}<input className="c4-field" aria-label={v4("fpnTag")} value={tag} onChange={(event) => setTag(event.target.value)} /></label>
            <button type="submit" className="c4-btn" disabled={viewer}>{v4("fpnSave")}</button>
          </form>
          <label className="c4-lab">{v4("fpnDeskNib")}<input className="c4-field" inputMode="numeric" aria-label={v4("fpnDeskNib")} value={deskNib} onChange={(event) => setDeskNib(event.target.value)} /></label>
          <label className="c4-lab">{v4("fpnRoster")}<input className="c4-field" aria-label={v4("fpnRoster")} value={roster} onChange={(event) => setRoster(event.target.value)} /></label>
          <form className="c4-fpn-form" onSubmit={(event) => {
            event.preventDefault();
            if (viewer || !viewName.trim()) return;
            storeViews(addPenView(views, {
              id: `view-${Date.now()}`,
              name: viewName,
              tray,
              query,
              scribe: scribeOn,
              ink: inkOn,
              flow: flowOn,
              nib: nibOn,
              drops: dropsOn,
              weight: weightOn,
            }));
            setViewName("");
          }}>
            <label className="c4-lab">{v4("fpnViewName")}<input className="c4-field" aria-label={v4("fpnViewName")} value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
            <button type="submit" className="c4-btn" disabled={viewer}>{v4("fpnSaveView")}</button>
          </form>
          <div className="c4-fpn-views">
            {views.map((view) => (
              <p key={view.id}>
                <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropPenView(views, view.id))}>{v4("fpnDropView")}</button>
              </p>
            ))}
          </div>
          <div className="c4-fpn-bulk">
            <label className="c4-lab">{v4("fpnBulkInk")}
              <select className="c4-field" aria-label={v4("fpnBulkInk")} value={moveInk} onChange={(event) => setMoveInk(event.target.value)}>
                {INKS.map((item) => <option key={item} value={item}>{inkLabel(v4, item)}</option>)}
              </select>
            </label>
            <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkPenInk(pens, picked, moveInk))}>{v4("fpnBulkInk")}</button>
            <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkPenPin(pens, picked, true))}>{v4("fpnBulkPin")}</button>
            <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkPenArchive(pens, picked, true))}>{v4("fpnBulkArchive")}</button>
            <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkPenTag(pens, picked, "a"))}>{v4("fpnBulkTag")}</button>
            <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkPenFlow(pens, picked, "wet"))}>{v4("fpnBulkFlow")}</button>
            <button type="button" className="c4-btn" onClick={() => download("fountain-pens.csv", pensCsv(pens, deskNib))}>{v4("fpnCsv")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetPens())}>{v4("fpnReset")}</button>
          </div>
          {!rows.length && <p className="c4-fpn-empty">{v4("fpnEmpty")}</p>}
          <ol className="c4-fpn-book">
            {rows.map((pen, index) => (
              <li key={pen.id} data-focus={focus === index ? "1" : "0"} data-late={latePen(pen, deskNib) ? "1" : "0"} data-house={houseInk(pen.ink) ? "1" : "0"} data-peak={peakNib(pen.nib) ? "1" : "0"} data-quiet={quietNib(pen.nib) ? "1" : "0"}>
                <label className="c4-lab">
                  <input type="checkbox" checked={picked.includes(pen.id)} onChange={() => setPicked((ids) => ids.includes(pen.id) ? ids.filter((id) => id !== pen.id) : [...ids, pen.id])} />
                  <span className="c4-meta">{index + 1}</span>
                </label>
                <div>
                  {editing === pen.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (!viewer) store(editPen(editPenNote(pens, pen.id, noteDraft), pen.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("fpnPen")} value={draft} onChange={(event) => setDraft(event.target.value)} />
                      <input className="c4-field" aria-label={v4("fpnNote")} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("fpnEdit")}</button>
                    </form>
                  ) : (
                    <button type="button" className="c4-btn" onClick={() => { setFocus(index); setEditing(pen.id); setDraft(pen.title); setNoteDraft(pen.note); }}>{pen.title}</button>
                  )}
                  <p className="c4-meta">{pen.scribe || v4("fpnBlankScribe")} · {pen.nib ?? v4("fpnBlankNib")} · {inkLabel(v4, pen.ink)} · {flowLabel(v4, pen.flow)} · {dropsLabel(v4, pen.drops)} · {gapLabel(v4, pen.nib, deskNib)}</p>
                  <p className="c4-meta">{pen.note} {pen.tags.join(" ")} {auditLabel(v4, pen.audit)}</p>
                  <div className="c4-row">
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPenPin(pens, pen.id, !pen.pinned))}>{pen.pinned ? v4("fpnUnpin") : v4("fpnPin")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPenHold(pens, pen.id, !pen.held))}>{pen.held ? v4("fpnResume") : v4("fpnHold")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPenArchive(pens, pen.id, !pen.archived))}>{pen.archived ? v4("fpnReopen") : v4("fpnArchive")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleFlow(pens, pen.id))}>{flowLabel(v4, pen.flow)}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(snoozePen(pens, pen.id))}>{v4("fpnSnooze")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPenWeight(pens, pen.id, pen.weight ? 0 : 3))}>{pen.weight ? v4("fpnWeightOff") : v4("fpnWeightOn")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addPenTag(pens, pen.id, "b"))}>{v4("fpnTag")}</button>
                    <button type="button" className="c4-btn" onClick={() => { const line = penCopy(pen, deskNib); void navigator.clipboard?.writeText(line); setCopied(pen.id); }}>{copied === pen.id ? v4("fpnCopied") : v4("fpnCopy")}</button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <p className="c4-fpn-rules">{v4("fpnRules")}</p>
        </div>
      </div>
    </section>
  );
}

export function MailCrests({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("all");
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
    const present = presentCrests(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenCrests(readJson(MCR_KEY, []), present);
    const nextReviewed = readReviewedCrests(readJson(MCR_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(MCR_KEY, nextHidden);
    writeJson(MCR_REVIEW_KEY, nextReviewed);
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
  const lanes = visibleCrestLanes(present, hidden, showHidden);
  const laneOn = activeCrestLane(lane, present);
  const toneOn = activeCrestTone(tone);
  const shown = visibleCrestCustomers(rows, crestLaneArg(laneOn), crestToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = crestState(row.note);
      const token = state === "set" ? crestLane(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return lanes.includes(token);
    });
  const lead = leadingCrest(rows);
  const toneLead = leadingCrestTone(rows);
  const shared = sharedCrestCount(rows);
  const catalog = catalogCrestCount(rows);
  const bars = crestLanes(rows).filter((line) => line.lane);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(MCR_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedCrests(next, ids);
    setReviewed(saved);
    writeJson(MCR_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-mcr" aria-label={v4("mcrTitle")} data-crests="1" data-role={role} data-catalog={catalog ? "1" : "0"}>
      <div className="c4-mcr-sheet">
        <header className="c4-mcr-mast">
          <div>
            <p className="c4-mcr-kicker">{v4("mcrSub")}</p>
            <h2 className="c4-title">{v4("mcrTitle")}</h2>
          </div>
          <p className="c4-mcr-plate" data-logo="mono">{v4("mcrLogo")}</p>
        </header>
        <div className="c4-mcr-body">
          <p className="c4-mcr-rules">{v4("mcrHint")}</p>
          <p className="c4-meta">{v4("mcrKept")} {v4("mcrEscape")}</p>
          {viewer && <p className="c4-mcr-notice" data-viewer="1">{v4("mcrViewer")}</p>}
          {data.error && <p className="c4-mcr-empty" role="alert">{v4("mcrFailed")}</p>}
          {data.loading && <p className="c4-meta">{v4("mcrLoading")}</p>}
          {shared > 0 && <p className="c4-mcr-notice" role="status">{v4("mcrNotice")} · {shared}</p>}
          <ol className="c4-mcr-ledger" aria-label={v4("mcrKpi")}>
            <li><span>{v4("mcrSet")}</span><strong>{rows.filter((row) => crestState(row.note) === "set").length}</strong></li>
            <li><span>{v4("mcrCatalog")}</span><strong>{catalog}</strong></li>
            <li><span>{v4("mcrWide")}</span><strong>{wideCrestCount(rows)}</strong></li>
            <li><span>{v4("mcrGiltCount")}</span><strong>{giltCrestCount(rows)}</strong></li>
            <li><span>{v4("mcrShare")}</span><strong>{crestShare(catalog, rows.length)}%</strong></li>
            <li><span>{v4("mcrShared")}</span><strong>{shared}</strong></li>
          </ol>
          <div className="c4-mcr-rail" aria-label={v4("mcrLanes")}>
            {bars.map((bar) => (
              <div key={bar.lane} className="c4-mcr-meter" data-lane={bar.lane}>
                <button type="button" className="c4-btn" onClick={() => setLane(bar.lane)}>{laneLabel(v4, bar.lane)} · {bar.count}</button>
                <div className="c4-mcr-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
              </div>
            ))}
            {!bars.length && <p className="c4-mcr-empty">{v4("mcrEmpty")}</p>}
          </div>
          <div className="c4-mcr-suggest">
            <p>{v4("mcrLeading")} · {lead ? laneLabel(v4, lead) : v4("mcrLeadingNone")}</p>
            <p>{v4("mcrToneLead")} · {toneLead ? toneLabel(v4, toneLead) : v4("mcrToneNone")}</p>
            <p>{shared ? `${v4("mcrShared")} · ${shared}` : v4("mcrSharedNone")}</p>
          </div>
          <label className="c4-lab">{v4("mcrSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("mcrSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <div className="c4-mcr-filters">
            <button type="button" className="c4-chip" data-on={laneOn === "all" ? "1" : "0"} onClick={() => setLane("all")}>{v4("mcrAll")}</button>
            <button type="button" className="c4-chip" data-on={laneOn === "blank" ? "1" : "0"} onClick={() => setLane("blank")}>{v4("mcrClear")}</button>
            {LANES.map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={laneOn === item ? "1" : "0"} onClick={() => setLane(item)}>{laneLabel(v4, item)}</button>
            ))}
            <button type="button" className="c4-chip" data-on={toneOn === "all" ? "1" : "0"} onClick={() => setTone("all")}>{v4("mcrTone")}</button>
            <button type="button" className="c4-chip" data-on={toneOn === "gilt" ? "1" : "0"} onClick={() => setTone("gilt")}>{v4("mcrGilt")}</button>
            <button type="button" className="c4-chip" data-on={toneOn === "ink" ? "1" : "0"} onClick={() => setTone("ink")}>{v4("mcrInk")}</button>
            <button type="button" className="c4-chip" data-on={toneOn === "ivory" ? "1" : "0"} onClick={() => setTone("ivory")}>{v4("mcrIvory")}</button>
            <button type="button" className="c4-chip" data-on={toneOn === "mist" ? "1" : "0"} onClick={() => setTone("mist")}>{v4("mcrMist")}</button>
            {(["all", "catalog", "wide", "gilt"] as const).map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{item === "all" ? v4("mcrAllShapes") : item === "catalog" ? v4("mcrCatalog") : item === "wide" ? v4("mcrWide") : v4("mcrGilt")}</button>
            ))}
            <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} onClick={() => setReview("all")}>{v4("mcrAllReview")}</button>
            <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview("reviewed")}>{v4("mcrReviewed")}</button>
            <button type="button" className="c4-chip" data-on={review === "open" ? "1" : "0"} onClick={() => setReview("open")}>{v4("mcrOpenReview")}</button>
            <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("mcrShown") : v4("mcrHidden")}</button>
          </div>
          <div className="c4-mcr-bands">
            {present.map((item) => (
              <button key={item} type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleCrest(hidden, item))}>
                {laneLabel(v4, item)} · {hidden.includes(item) ? v4("mcrShow") : v4("mcrHide")}
              </button>
            ))}
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkCrestReview(reviewed, shown.map((row) => row.id), true))}>{v4("mcrBulkReview")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkCrestReview(reviewed, ids, false))}>{v4("mcrBulkClear")}</button>
            <button type="button" className="c4-btn" onClick={() => download("mail-crests.csv", crestsCsv(rows))}>{v4("mcrCsv")}</button>
            <button type="button" className="c4-btn" onClick={() => download("mail-crest-rows.csv", crestRowsCsv(rows, reviewed))}>{v4("mcrRowCsv")}</button>
            <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("mcrCustomers")}</Link>
          </div>
          {!shown.length && <p className="c4-mcr-empty">{v4("mcrEmpty")}</p>}
          <ul className="c4-mcr-index">
            {shown.map((row) => {
              const state = crestState(row.note);
              const mark = crestOf(row.note);
              const step = crestStep(row.note);
              const steps = [v4("mcrPlain"), v4("mcrAlias"), v4("mcrDeep")];
              return (
                <li key={row.id} data-state={state || "blank"} data-lane={state === "set" ? crestLane(row.note) : "blank"} data-tone={crestTone(row.note) || "blank"} data-catalog={catalogCrest(row.note) ? "1" : "0"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"} data-step={step}>
                  <p className="c4-mcr-mark" data-logo="mono">{mark || "—"}</p>
                  <div>
                    <strong>{row.label || row.id}</strong>
                    <span className="c4-meta">{crestCopy(row.note) || v4("mcrClear")} · {laneLabel(v4, state === "set" ? crestLane(row.note) : state === "clear" ? "blank" : "")} · {toneLabel(v4, crestTone(row.note))}</span>
                    <ol className="c4-mcr-time" aria-label={v4("mcrStep")}>
                      {steps.map((label, index) => (
                        <li key={label} data-on={step >= index + 1 ? "1" : "0"}>{label}</li>
                      ))}
                    </ol>
                    <span className="c4-meta">{kindLabel(v4, step)}</span>
                    {catalogCrest(row.note) && <span className="c4-meta">{v4("mcrCatalogMark")}</span>}
                    {wideCrest(row.note) && <span className="c4-meta">{v4("mcrWide")}</span>}
                    <div className="c4-row">
                      <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleCrestReview(reviewed, row.id))}>{v4("mcrReview")}</button>
                      <button type="button" className="c4-btn" onClick={() => { const line = crestCopy(row.note); void navigator.clipboard?.writeText(line); setCopied(row.id); }}>{copied === row.id ? v4("mcrCopied") : v4("mcrCopy")}</button>
                      <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{row.label || row.id}</Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="c4-mcr-rules">{v4("mcrRules")}</p>
        </div>
      </div>
    </section>
  );
}
