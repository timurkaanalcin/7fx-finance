"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  BRD_DENSITY_KEY,
  BRD_KEY,
  BRD_VIEW_KEY,
  PNT_KEY,
  PNT_REVIEW_KEY,
  activeDye,
  activeLoom,
  activePace,
  activePennantLane,
  activePennantTone,
  activePly,
  activeThread,
  activeWeaver,
  addSwatch,
  addSwatchTag,
  addSwatchView,
  adjacentSwatchCount,
  brightPennantCount,
  bulkPennantReview,
  bulkSwatchArchive,
  bulkSwatchDye,
  bulkSwatchPace,
  bulkSwatchPin,
  bulkSwatchTag,
  busiestWeaver,
  clashLoomCount,
  clothDensity,
  coolingSwatch,
  coolingSwatches,
  cyclePace,
  dropSwatchView,
  dyeArg,
  editSwatch,
  editSwatchNote,
  fairWeaver,
  flareLoad,
  gonfalonCount,
  holdFocusedSwatch,
  houseDye,
  lateSwatch,
  lateSwatchShare,
  leadingPennant,
  leadingPennantTone,
  loomArg,
  loomGap,
  loomWidth,
  matchedSwatches,
  moveSwatchFocus,
  nextSwatch,
  oriflammeCount,
  paceArg,
  paceFocusedSwatch,
  pairWeaverCount,
  peakLoom,
  pennantCopy,
  pennantLane,
  pennantLaneArg,
  pennantLanes,
  pennantMark,
  pennantRowsCsv,
  pennantShare,
  pennantState,
  pennantStep,
  pennantTone,
  pennantToneArg,
  pennantsCsv,
  pinFocusedSwatch,
  plyArg,
  plyLoad,
  presentPennantLanes,
  quietLoom,
  quietSalonCount,
  readHiddenPennants,
  readReviewedPennants,
  readSwatchViews,
  readSwatches,
  reminderSwatches,
  resetSwatches,
  setSwatchArchive,
  setSwatchHold,
  setSwatchPin,
  setSwatchPly,
  setSwatchWax,
  sharedDyeCount,
  sharedPennantCount,
  snoozeFocusedSwatch,
  snoozeSwatch,
  sortSwatches,
  stitchedPennant,
  stitchedPennantCount,
  suggestDye,
  suggestThread,
  suggestWeaver,
  swatchBook,
  swatchCopy,
  swatchCounts,
  swatchDyes,
  swatchShare,
  swatchWeavers,
  swatchesCsv,
  threadArg,
  threadClashCount,
  togglePennant,
  togglePennantReview,
  usedLooms,
  visiblePennantLanes,
  visiblePennants,
  visibleSwatches,
  waxFocusedSwatch,
  weaverArg,
  widePennant,
  widePennantCount,
  windowSwatches,
  type BrocadeSwatch,
  type PennantReview,
  type PennantRow,
  type PennantShape,
  type PennantValue,
  type SwatchDensity,
  type SwatchSort,
  type SwatchTray,
  type SwatchView,
} from "@/lib/crmv4/round226";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type AffRow = {
  name?: string | null;
  leads?: number | null;
  valid?: number | null;
  invalid?: number | null;
};

type GlanceRow = PennantRow & { id: string };

const DYES = ["graphite", "ivory", "champagne"] as const;
const PACES = ["hush", "glide", "flare"] as const;
const LANES = ["oriflamme", "gonfalon", "pennant"] as const;

function dyeLabel(v4: V4, dye: string): string {
  if (dye === "graphite" || dye === "GRAPHITE") return v4("brdGraphite");
  if (dye === "ivory" || dye === "IVORY") return v4("brdIvory");
  if (dye === "champagne" || dye === "CHAMPAGNE") return v4("brdChampagne");
  return v4("brdBlankDye");
}

function paceLabel(v4: V4, pace: string): string {
  if (pace === "hush") return v4("brdHush");
  if (pace === "glide") return v4("brdGlide");
  if (pace === "flare") return v4("brdFlare");
  return v4("brdBlankPace");
}

function threadLabel(v4: V4, thread: number | null): string {
  if (thread === 6) return v4("brdThread6");
  if (thread === 18) return v4("brdThread18");
  if (thread === 36) return v4("brdThread36");
  return v4("brdBlankThread");
}

function laneLabel(v4: V4, name: string): string {
  if (name === "oriflamme") return v4("wmpOriflamme");
  if (name === "gonfalon") return v4("wmpGonfalon");
  if (name === "pennant") return v4("wmpPennant");
  if (name === "blank") return v4("wmpClear");
  return v4("wmpUnmarked");
}

function toneLabel(v4: V4, name: string): string {
  if (name === "bright") return v4("wmpBright");
  if (name === "even") return v4("wmpEven");
  if (name === "dim") return v4("wmpDim");
  if (name === "hush") return v4("wmpHush");
  if (name === "mist") return v4("wmpMist");
  return v4("wmpUnmarked");
}

function auditLabel(v4: V4, audit: string): string {
  const key = {
    save: "brdAuditSave",
    edit: "brdAuditEdit",
    note: "brdAuditNote",
    pace: "brdAuditPace",
    pin: "brdAuditPin",
    unpin: "brdAuditUnpin",
    hold: "brdAuditHold",
    resume: "brdAuditResume",
    archive: "brdAuditArchive",
    open: "brdAuditOpen",
    dye: "brdAuditDye",
    tag: "brdAuditTag",
    ply: "brdAuditPly",
    thread: "brdAuditThread",
    wax: "brdAuditWax",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, loom: number | null, desk: string): string {
  const gap = loomGap(loom, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("brdPast")} ${gap}`;
  if (gap < 0) return `${v4("brdAhead")} ${Math.abs(gap)}`;
  return v4("brdDue");
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

function countField(raw: number | null | undefined): number | undefined {
  return typeof raw === "number" ? raw : undefined;
}

export function BrocadeSwatches({ v4 }: { v4: V4 }) {
  const [swatches, setSwatches] = useState<BrocadeSwatch[]>([]);
  const [views, setViews] = useState<SwatchView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [weaver, setWeaver] = useState("");
  const [loom, setLoom] = useState("");
  const [dye, setDye] = useState("");
  const [pace, setPace] = useState("");
  const [threadValue, setThreadValue] = useState("");
  const [ply, setPly] = useState("");
  const [tag, setTag] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<SwatchTray>("open");
  const [weaverFilter, setWeaverFilter] = useState("all");
  const [dyeFilter, setDyeFilter] = useState("all");
  const [paceFilter, setPaceFilter] = useState("all");
  const [loomFilter, setLoomFilter] = useState("all");
  const [threadFilter, setThreadFilter] = useState("all");
  const [plyFilter, setPlyFilter] = useState("all");
  const [flareOnly, setFlareOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [restingOnly, setRestingOnly] = useState(false);
  const [board, setBoard] = useState<"salon" | "book">("salon");
  const [order, setOrder] = useState<SwatchSort>("loom");
  const [density, setDensity] = useState<SwatchDensity>("airy");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [deskLoom, setDeskLoom] = useState("");
  const [moveDye, setMoveDye] = useState("graphite");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<() => void>(() => {});
  const threadRef = useRef<() => void>(() => {});
  const holdRef = useRef<() => void>(() => {});
  const paceRef = useRef<() => void>(() => {});
  const waxRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readSwatches(readJson(BRD_KEY, []));
    const saved = readSwatchViews(readJson(BRD_VIEW_KEY, []));
    setSwatches(next);
    setViews(saved);
    setDensity(clothDensity(readJson(BRD_DENSITY_KEY, "airy")));
    writeJson(BRD_KEY, next);
    writeJson(BRD_VIEW_KEY, saved);
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: BrocadeSwatch[]) {
    const saved = readSwatches(next);
    setSwatches(saved);
    writeJson(BRD_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((swatch) => swatch.id === id)));
  }
  function storeViews(next: SwatchView[]) {
    const saved = readSwatchViews(next);
    setViews(saved);
    writeJson(BRD_VIEW_KEY, saved);
  }
  function storeDensity(next: SwatchDensity) {
    setDensity(next);
    writeJson(BRD_DENSITY_KEY, next);
  }
  const weavers = swatchWeavers(swatches);
  const dyes = swatchDyes(swatches);
  const bars = DYES.map((item) => ({ dye: item.toUpperCase(), count: swatches.filter((swatch) => swatch.dye === item.toUpperCase()).length })).filter((row) => row.count > 0);
  const weaverOn = activeWeaver(weaverFilter, weavers);
  const dyeOn = activeDye(dyeFilter, ["GRAPHITE", "IVORY", "CHAMPAGNE", ...dyes]);
  const paceOn = activePace(paceFilter, ["hush", "glide", "flare"]);
  const loomOn = activeLoom(loomFilter);
  const threadOn = activeThread(threadFilter);
  const plyOn = activePly(plyFilter);
  const pickedLoom = loomArg(loomOn);
  const shown = sortSwatches(visibleSwatches(
    swatches,
    tray,
    query,
    weaverArg(weaverOn),
    dyeArg(dyeOn),
    paceArg(paceOn),
    pickedLoom.exact,
    pickedLoom.pick,
    threadArg(threadOn),
    plyArg(plyOn),
    flareOnly,
    peakOnly,
    houseOnly,
    quietOnly,
    restingOnly,
  ), order);
  const book = swatchBook(swatches, query);
  const counts = swatchCounts(swatches, deskLoom);
  const share = lateSwatchShare(swatches, deskLoom);
  const matched = matchedSwatches(swatches, deskLoom);
  const clashes = clashLoomCount(swatches);
  const threads = threadClashCount(swatches);
  const neighbors = adjacentSwatchCount(swatches);
  const suggestedDye = suggestDye(swatches);
  const suggestedName = suggestWeaver(swatches);
  const suggestedThread = suggestThread(swatches);
  const fair = fairWeaver(swatches, roster);
  const busy = busiestWeaver(swatches);
  const reminders = reminderSwatches(swatches, deskLoom);
  const cooling = coolingSwatches(swatches);
  const windowRows = windowSwatches(swatches, deskLoom);
  const nextTitle = nextSwatch(swatches, deskLoom);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  pinRef.current = () => {
    if (!viewer) store(pinFocusedSwatch(swatches, shown.map((swatch) => swatch.id), focus));
  };
  threadRef.current = () => {
    if (!viewer) store(snoozeFocusedSwatch(swatches, shown.map((swatch) => swatch.id), focus));
  };
  holdRef.current = () => {
    if (!viewer) store(holdFocusedSwatch(swatches, shown.map((swatch) => swatch.id), focus));
  };
  paceRef.current = () => {
    if (!viewer) store(paceFocusedSwatch(swatches, shown.map((swatch) => swatch.id), focus));
  };
  waxRef.current = () => {
    if (!viewer) store(waxFocusedSwatch(swatches, shown.map((swatch) => swatch.id), focus));
  };
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setTitle("");
        setNote("");
        setWeaver("");
        setLoom("");
        setDye("");
        setPace("");
        setThreadValue("");
        setPly("");
        setTag("");
        setQuery("");
        setEditing("");
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveSwatchFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveSwatchFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        titleRef.current?.focus();
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        pinRef.current();
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        threadRef.current();
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        holdRef.current();
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        paceRef.current();
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        waxRef.current();
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        setBoard((current) => (current === "salon" ? "book" : "salon"));
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
    setWeaver("");
    setLoom("");
    setDye("");
    setPace("");
    setThreadValue("");
    setPly("");
    setTag("");
    setQuery("");
    setEditing("");
  }
  function applyView(view: SwatchView) {
    setTray(view.tray);
    setQuery(view.query);
    setWeaverFilter(view.weaver);
    setDyeFilter(view.dye);
    setPaceFilter(view.pace);
    setLoomFilter(view.loom);
    setThreadFilter(view.thread);
    setPlyFilter(view.ply);
  }
  const rows = board === "book" ? book : shown;
  const houseOpen = swatches.filter((swatch) => !swatch.held && !swatch.archived && houseDye(swatch.dye)).length;
  const openCount = Math.max(1, counts.open);
  return (
    <section className="c4-brd" aria-label={v4("brdTitle")} data-swatches="1" data-role={role} data-density={density}>
      <div className="c4-brd-sheet">
        <header className="c4-brd-mast">
          <p className="c4-brd-plate" data-logo="mono">{v4("brdLogo")}</p>
          <div>
            <p className="c4-brd-kicker">{v4("brdSub")}</p>
            <h2 className="c4-title">{v4("brdTitle")}</h2>
          </div>
        </header>
        <p className="c4-brd-time">{v4("brdLocal")}</p>
        <p className="c4-brd-rules">{v4("brdHint")}</p>
        <p className="c4-meta">{v4("brdNew")} {v4("brdSlash")} {v4("brdEscape")} {v4("brdKeys")} {v4("brdPinKey")} {v4("brdThreadKey")} {v4("brdHoldKey")} {v4("brdPaceKey")} {v4("brdWaxKey")} {v4("brdBoardKey")}</p>
        {viewer && <p className="c4-brd-notice" data-viewer="1">{v4("brdViewer")}</p>}
        {counts.peak > 0 && (
          <p className="c4-brd-notice" role="status">
            {v4("brdNotice")} · {counts.peak}
            <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("brdNoticeAll") : v4("brdNoticePeak")}</button>
          </p>
        )}
        {counts.late > 0 && <p className="c4-brd-notice" role="status">{v4("brdLateNotice")} · {counts.late}</p>}
        <ol className="c4-brd-kpis" aria-label={v4("brdKpi")}>
          <li><span>{v4("brdOpen")}</span><strong>{counts.open}</strong></li>
          <li><span>{v4("brdHeld")}</span><strong>{counts.held}</strong></li>
          <li><span>{v4("brdArchived")}</span><strong>{counts.archived}</strong></li>
          <li><span>{v4("brdPinned")}</span><strong>{counts.pinned}</strong></li>
          <li><span>{v4("brdPeak")}</span><strong>{counts.peak}</strong></li>
          <li><span>{v4("brdLate")}</span><strong>{counts.late}</strong></li>
          <li><span>{v4("brdSoon")}</span><strong>{counts.soon}</strong></li>
          <li><span>{v4("brdPly")}</span><strong>{counts.ply}</strong></li>
          <li><span>{v4("brdMatched")}</span><strong>{matched}</strong></li>
          <li><span>{v4("brdWax")}</span><strong>{counts.wax}</strong></li>
          <li><span>{v4("brdCooling")}</span><strong>{counts.cooling}</strong></li>
        </ol>
        <div className="c4-brd-meter" aria-label={v4("brdLateShare")}>
          <span>{v4("brdHouseShare")} {swatchShare(houseOpen, openCount)}%</span>
          <span>{v4("brdLateShare")} {share}%</span>
          <i style={{ width: `${share}%` }} />
        </div>
        <ol className="c4-brd-bars" aria-label={v4("brdDyes")}>
          {bars.map((bar) => (
            <li key={bar.dye}>
              <span>{dyeLabel(v4, bar.dye)}</span>
              <b style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
              <em>{bar.count}</em>
            </li>
          ))}
        </ol>
        {!swatches.length && <p className="c4-brd-empty">{v4("brdEmpty")}</p>}
        <div className="c4-brd-suggest">
          <p>{v4("brdSuggestDye")}: {dyeLabel(v4, suggestedDye)}</p>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => setDye(suggestedDye.toLowerCase())}>{v4("brdUseDye")}</button>
          <p>{suggestedName ? `${v4("brdSuggestWeaver")}: ${suggestedName}` : v4("brdBlankWeaver")}</p>
          <button type="button" className="c4-btn" disabled={viewer || !suggestedName} onClick={() => setWeaver(suggestedName)}>{v4("brdUseWeaver")}</button>
          <p>{v4("brdSuggestThread")}: {threadLabel(v4, suggestedThread)}</p>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => setThreadValue(String(suggestedThread))}>{v4("brdUseThread")}</button>
          <p>{v4("brdAssign")}: {fair || v4("brdBlankWeaver")}</p>
          <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setWeaver(fair)}>{v4("brdUseWeaver")}</button>
        </div>
        <ul className="c4-brd-facts">
          <li>{v4("brdLooms")}: {usedLooms(swatches)}</li>
          <li>{clashes ? `${v4("brdClash")} ${clashes}` : v4("brdClashNone")}</li>
          <li>{threads ? `${v4("brdThreadClash")} ${threads}` : v4("brdThreadClashNone")}</li>
          <li>{neighbors ? `${v4("brdAdjacent")} ${neighbors}` : v4("brdAdjacentNone")}</li>
          <li>{pairWeaverCount(swatches) ? `${v4("brdPairs")} ${pairWeaverCount(swatches)}` : v4("brdPairsNone")}</li>
          <li>{sharedDyeCount(swatches) ? `${v4("brdSharedDye")} ${sharedDyeCount(swatches)}` : v4("brdSharedDyeNone")}</li>
          <li>{v4("brdPlyLoad")}: {plyLoad(swatches)}</li>
          <li>{v4("brdQuietSalon")}: {quietSalonCount(swatches)}</li>
          <li>{v4("brdFlareLoad")}: {flareLoad(swatches)}</li>
          <li>{v4("brdLoomWidth")}: {loomWidth(swatches)}</li>
          <li>{nextTitle ? `${v4("brdNext")}: ${nextTitle}` : v4("brdNextNone")}</li>
          <li>{busy ? `${v4("brdBusiest")}: ${busy}` : v4("brdBusiestNone")}</li>
          <li>{v4("brdWindow")}: {windowRows.length}</li>
        </ul>
        <section className="c4-brd-reminders" aria-label={v4("brdReminders")}>
          <h3>{v4("brdReminders")}</h3>
          {!reminders.length && <p className="c4-brd-empty">{v4("brdReminderEmpty")}</p>}
          <ul>
            {reminders.map((swatch) => (
              <li key={swatch.id}>{swatch.title} · {lateSwatch(swatch, deskLoom) ? v4("brdLate") : v4("brdSoon")}</li>
            ))}
          </ul>
        </section>
        <section className="c4-brd-cooling" aria-label={v4("brdCooling")}>
          <h3>{v4("brdCooling")}</h3>
          {!cooling.length && <p className="c4-brd-empty">{v4("brdCoolingEmpty")}</p>}
          <ul>
            {cooling.map((swatch) => (
              <li key={swatch.id}>{swatch.title} · {swatch.loom}</li>
            ))}
          </ul>
        </section>
        <form className="c4-brd-form" onSubmit={(event) => {
          event.preventDefault();
          if (viewer) return;
          store(addSwatch(swatches, {
            id: `brd-${Date.now()}`,
            title,
            note,
            weaver,
            loom,
            dye,
            pace,
            thread: threadValue,
            ply,
            tags: tag,
          }));
          clearDraft();
        }}>
          <input ref={titleRef} className="c4-field" aria-label={v4("brdTitle")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} />
          <input className="c4-field" aria-label={v4("brdNote")} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} />
          <input className="c4-field" aria-label={v4("brdWeaver")} value={weaver} disabled={viewer} onChange={(event) => setWeaver(event.target.value)} />
          <input className="c4-field" aria-label={v4("brdLoom")} inputMode="numeric" value={loom} disabled={viewer} onChange={(event) => setLoom(event.target.value)} />
          <select className="c4-select" aria-label={v4("brdDye")} value={dye} disabled={viewer} onChange={(event) => setDye(event.target.value)}>
            <option value="">{v4("brdBlankDye")}</option>
            {DYES.map((item) => <option key={item} value={item}>{dyeLabel(v4, item)}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("brdPace")} value={pace} disabled={viewer} onChange={(event) => setPace(event.target.value)}>
            <option value="">{v4("brdBlankPace")}</option>
            {PACES.map((item) => <option key={item} value={item}>{paceLabel(v4, item)}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("brdThread")} value={threadValue} disabled={viewer} onChange={(event) => setThreadValue(event.target.value)}>
            <option value="">{v4("brdBlankThread")}</option>
            <option value="6">{v4("brdThread6")}</option>
            <option value="18">{v4("brdThread18")}</option>
            <option value="36">{v4("brdThread36")}</option>
          </select>
          <select className="c4-select" aria-label={v4("brdPly")} value={ply} disabled={viewer} onChange={(event) => setPly(event.target.value)}>
            <option value="">{v4("brdResting")}</option>
            <option value="2">2</option>
            <option value="4">4</option>
            <option value="6">6</option>
          </select>
          <input className="c4-field" aria-label={v4("brdTag")} value={tag} disabled={viewer} onChange={(event) => setTag(event.target.value)} />
          <button type="submit" className="c4-btn c4-btn-hot" disabled={viewer}>{v4("brdSave")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetSwatches())}>{v4("brdReset")}</button>
        </form>
        <div className="c4-brd-tools">
          <input ref={searchRef} className="c4-field" aria-label={v4("brdSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
          <input className="c4-field" aria-label={v4("brdDesk")} inputMode="numeric" value={deskLoom} onChange={(event) => setDeskLoom(event.target.value)} />
          <input className="c4-field" aria-label={v4("brdRoster")} value={roster} disabled={viewer} onChange={(event) => setRoster(event.target.value)} />
          <select className="c4-select" aria-label={v4("brdTrayOpen")} value={tray} onChange={(event) => setTray(event.target.value as SwatchTray)}>
            <option value="open">{v4("brdTrayOpen")}</option>
            <option value="held">{v4("brdTrayHeld")}</option>
            <option value="archived">{v4("brdTrayArchived")}</option>
          </select>
          <select className="c4-select" aria-label={v4("brdWeaver")} value={weaverOn} onChange={(event) => setWeaverFilter(event.target.value)}>
            <option value="all">{v4("brdAll")}</option>
            <option value="blank">{v4("brdBlank")}</option>
            {weavers.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("brdDye")} value={dyeOn} onChange={(event) => setDyeFilter(event.target.value)}>
            <option value="all">{v4("brdAll")}</option>
            <option value="blank">{v4("brdBlankDye")}</option>
            {DYES.map((item) => <option key={item} value={item}>{dyeLabel(v4, item)}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("brdPace")} value={paceOn} onChange={(event) => setPaceFilter(event.target.value)}>
            <option value="all">{v4("brdAll")}</option>
            <option value="blank">{v4("brdBlankPace")}</option>
            {PACES.map((item) => <option key={item} value={item}>{paceLabel(v4, item)}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("brdLoom")} value={loomOn} onChange={(event) => setLoomFilter(event.target.value)}>
            <option value="all">{v4("brdAll")}</option>
            <option value="blank">{v4("brdBlank")}</option>
            <option value="early">{v4("brdEarly")}</option>
            <option value="mid">{v4("brdMid")}</option>
            <option value="late">{v4("brdLateBand")}</option>
            <option value="peak">{v4("brdPeakPick")}</option>
            <option value="quiet">{v4("brdQuiet")}</option>
            {["1", "2", "3", "4", "5", "6"].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("brdThread")} value={threadOn} onChange={(event) => setThreadFilter(event.target.value)}>
            <option value="all">{v4("brdAll")}</option>
            <option value="blank">{v4("brdBlankThread")}</option>
            <option value="6">6</option>
            <option value="18">18</option>
            <option value="36">36</option>
          </select>
          <select className="c4-select" aria-label={v4("brdPly")} value={plyOn} onChange={(event) => setPlyFilter(event.target.value)}>
            <option value="all">{v4("brdAll")}</option>
            <option value="blank">{v4("brdResting")}</option>
            <option value="2">2</option>
            <option value="4">4</option>
            <option value="6">6</option>
          </select>
          <button type="button" className="c4-chip" data-on={flareOnly ? "1" : "0"} onClick={() => setFlareOnly((on) => !on)}>{v4("brdFlare")}</button>
          <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((on) => !on)}>{v4("brdHouseShare")}</button>
          <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((on) => !on)}>{v4("brdQuiet")}</button>
          <button type="button" className="c4-chip" data-on={restingOnly ? "1" : "0"} onClick={() => setRestingOnly((on) => !on)}>{v4("brdResting")}</button>
          <button type="button" className="c4-chip" data-on={order === "weaver" ? "1" : "0"} onClick={() => setOrder((mode) => (mode === "loom" ? "weaver" : "loom"))}>{order === "weaver" ? v4("brdSortWeaver") : v4("brdSortLoom")}</button>
          <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "airy" ? "tight" : "airy")}>{density === "tight" ? v4("brdDensityTight") : v4("brdDensityAiry")}</button>
          <button type="button" className="c4-chip" data-on={board === "book" ? "1" : "0"} onClick={() => setBoard((current) => (current === "salon" ? "book" : "salon"))}>{board === "book" ? v4("brdBoardBook") : v4("brdBoardSalon")}</button>
        </div>
        <form className="c4-brd-views" onSubmit={(event) => {
          event.preventDefault();
          if (viewer) return;
          storeViews(addSwatchView(views, {
            id: `view-${Date.now()}`,
            name: viewName,
            tray,
            query,
            weaver: weaverOn,
            dye: dyeOn,
            pace: paceOn,
            loom: loomOn,
            thread: threadOn,
            ply: plyOn,
          }));
          setViewName("");
        }}>
          <input className="c4-field" aria-label={v4("brdViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
          <button type="submit" className="c4-btn" disabled={viewer}>{v4("brdSaveView")}</button>
          {views.map((view) => (
            <span key={view.id}>
              <button type="button" className="c4-chip" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropSwatchView(views, view.id))}>{v4("brdDropView")}</button>
            </span>
          ))}
        </form>
        <div className="c4-brd-bulk">
          <select className="c4-select" aria-label={v4("brdBulkDye")} value={moveDye} disabled={viewer} onChange={(event) => setMoveDye(event.target.value)}>
            {DYES.map((item) => <option key={item} value={item}>{dyeLabel(v4, item)}</option>)}
          </select>
          <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSwatchDye(swatches, picked, moveDye))}>{v4("brdBulkDye")}</button>
          <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSwatchPin(swatches, picked, true))}>{v4("brdBulkPin")}</button>
          <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSwatchArchive(swatches, picked, true))}>{v4("brdBulkArchive")}</button>
          <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSwatchPace(swatches, picked, "flare"))}>{v4("brdBulkPace")}</button>
          <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSwatchTag(swatches, picked, "a"))}>{v4("brdBulkTag")}</button>
          <button type="button" className="c4-btn" onClick={() => download("brocade-swatches.csv", swatchesCsv(swatches, deskLoom))}>{v4("brdCsv")}</button>
        </div>
        <ol className="c4-brd-list" data-board={board}>
          {rows.map((swatch, index) => {
            const on = index === focus && board === "salon";
            return (
              <li key={swatch.id} data-focus={on ? "1" : "0"} data-wax={swatch.wax ? "1" : "0"} data-peak={peakLoom(swatch.loom) ? "1" : "0"} data-quiet={quietLoom(swatch.loom) ? "1" : "0"} data-cooling={coolingSwatch(swatch) ? "1" : "0"}>
                <label className="c4-row">
                  <input type="checkbox" checked={picked.includes(swatch.id)} disabled={viewer} onChange={() => setPicked((ids) => ids.includes(swatch.id) ? ids.filter((id) => id !== swatch.id) : [...ids, swatch.id])} />
                  {editing === swatch.id ? (
                    <input className="c4-field" aria-label={v4("brdEdit")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} onBlur={() => { if (!viewer) store(editSwatch(swatches, swatch.id, draft)); setEditing(""); }} />
                  ) : (
                    <button type="button" className="c4-brd-title" onClick={() => { setFocus(index); setEditing(swatch.id); setDraft(swatch.title); setNoteDraft(swatch.note); }}>{swatch.title}</button>
                  )}
                </label>
                <input className="c4-field" aria-label={v4("brdEditNote")} value={editing === `${swatch.id}-note` ? noteDraft : swatch.note} disabled={viewer} onFocus={() => { setEditing(`${swatch.id}-note`); setNoteDraft(swatch.note); }} onChange={(event) => setNoteDraft(event.target.value)} onBlur={() => { if (!viewer) store(editSwatchNote(swatches, swatch.id, noteDraft)); setEditing(""); }} />
                <span>{swatch.weaver || v4("brdBlankWeaver")}</span>
                <span>{swatch.loom ?? v4("brdBlank")}</span>
                <span>{dyeLabel(v4, swatch.dye)}</span>
                <span>{paceLabel(v4, swatch.pace)}</span>
                <span>{threadLabel(v4, swatch.thread)}</span>
                <span>{swatch.ply}</span>
                <span>{swatch.tags.join(" ")}</span>
                <span>{gapLabel(v4, swatch.loom, deskLoom)}</span>
                <span>{auditLabel(v4, swatch.audit)}</span>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSwatchPin(swatches, swatch.id, !swatch.pinned))}>{swatch.pinned ? v4("brdUnpin") : v4("brdPin")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(snoozeSwatch(swatches, swatch.id))}>{v4("brdThread")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSwatchHold(swatches, swatch.id, !swatch.held))}>{swatch.held ? v4("brdResume") : v4("brdHold")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cyclePace(swatches, swatch.id))}>{v4("brdPace")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSwatchWax(swatches, swatch.id, !swatch.wax))}>{swatch.wax ? v4("brdUnwax") : v4("brdWax")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSwatchArchive(swatches, swatch.id, !swatch.archived))}>{swatch.archived ? v4("brdRestore") : v4("brdArchive")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addSwatchTag(swatches, swatch.id, "b"))}>{v4("brdTag")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSwatchPly(swatches, swatch.id, swatch.ply === 6 ? "2" : swatch.ply === 4 ? "6" : "4"))}>{v4("brdPly")}</button>
                <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(swatchCopy(swatch, deskLoom)); setCopied(swatch.id); }}>{copied === swatch.id ? v4("brdCopied") : v4("brdCopy")}</button>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

export function PennantMarks({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ rows?: AffRow[] }>("/api/admin/analytics/affiliates?period=month");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("all");
  const [tone, setTone] = useState("all");
  const [review, setReview] = useState<PennantReview>("all");
  const [shape, setShape] = useState<PennantShape>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<GlanceRow[]>(() => (data.data?.rows || []).map((row, index) => ({
    id: row.name || `aff-${index}`,
    label: row.name || row.name || "",
    note: {
      name: row.name || "",
      leads: countField(row.leads),
      valid: countField(row.valid),
      invalid: countField(row.invalid),
    } satisfies PennantValue,
  })), [data.data?.rows]);
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
    const present = presentPennantLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenPennants(readJson(PNT_KEY, []), present);
    const nextReviewed = readReviewedPennants(readJson(PNT_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(PNT_KEY, nextHidden);
    writeJson(PNT_REVIEW_KEY, nextReviewed);
  }, [rows]);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setQuery("");
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const present = presentPennantLanes(rows);
  const lanes = visiblePennantLanes(present, hidden, showHidden);
  const laneOn = activePennantLane(lane, present);
  const toneOn = activePennantTone(tone);
  const shown = visiblePennants(rows, pennantLaneArg(laneOn), pennantToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = pennantState(row.note);
      const token = state === "set" ? pennantLane(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return lanes.includes(token);
    });
  const lead = leadingPennant(rows);
  const toneLead = leadingPennantTone(rows);
  const shared = sharedPennantCount(rows);
  const stitched = stitchedPennantCount(rows);
  const bars = pennantLanes(rows).filter((line) => line.lane);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  const known = rows.filter((row) => pennantState(row.note) === "set").length;
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(PNT_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedPennants(next, ids);
    setReviewed(saved);
    writeJson(PNT_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-pnt" aria-label={v4("wmpTitle")} data-pennants="1" data-role={role} data-keyed={stitched ? "1" : "0"}>
      <div className="c4-pnt-sheet">
        <header className="c4-pnt-mast">
          <p className="c4-pnt-plate" data-logo="mono">{v4("wmpLogo")}</p>
          <div>
            <p className="c4-pnt-kicker">{v4("wmpSub")}</p>
            <h2 className="c4-title">{v4("wmpTitle")}</h2>
          </div>
        </header>
        <p className="c4-pnt-time">{v4("wmpKept")}</p>
        <div className="c4-pnt-body">
          <p className="c4-pnt-rules">{v4("wmpHint")}</p>
          <p className="c4-meta">{v4("wmpEscape")}</p>
          {viewer && <p className="c4-pnt-notice" data-viewer="1">{v4("wmpViewer")}</p>}
          {data.error && <p className="c4-pnt-empty" role="alert">{v4("wmpFailed")}</p>}
          {data.loading && <p className="c4-meta">{v4("wmpLoading")}</p>}
          {!data.loading && !rows.length && <p className="c4-pnt-empty">{v4("wmpEmpty")}</p>}
          {shared > 0 && <p className="c4-pnt-notice" role="status">{v4("wmpNotice")} · {shared}</p>}
          <ol className="c4-pnt-ledger" aria-label={v4("wmpKpi")}>
            <li><span>{v4("wmpSet")}</span><strong>{known}</strong></li>
            <li><span>{v4("wmpClear")}</span><strong>{rows.filter((row) => pennantState(row.note) === "clear").length}</strong></li>
            <li><span>{v4("wmpStitch")}</span><strong>{stitched}</strong></li>
            <li><span>{v4("wmpWide")}</span><strong>{widePennantCount(rows)}</strong></li>
            <li><span>{v4("wmpBright")}</span><strong>{brightPennantCount(rows)}</strong></li>
            <li><span>{v4("wmpOriflamme")}</span><strong>{oriflammeCount(rows)}</strong></li>
            <li><span>{v4("wmpGonfalon")}</span><strong>{gonfalonCount(rows)}</strong></li>
            <li><span>{v4("wmpShare")}</span><strong>{pennantShare(stitched, Math.max(1, known))}%</strong></li>
          </ol>
          <p className="c4-meta">{v4("wmpLead")}: {laneLabel(v4, lead)} · {v4("wmpToneLead")}: {toneLabel(v4, toneLead)}</p>
          <ol className="c4-pnt-index" aria-label={v4("wmpKpi")}>
            {bars.map((bar) => (
              <li key={bar.lane} data-tone={bar.lane === "oriflamme" ? "gold" : bar.lane === "pennant" ? "ink" : "ivory"}>
                <span>{laneLabel(v4, bar.lane)}</span>
                <b style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
                <em>{bar.count}</em>
              </li>
            ))}
          </ol>
          <div className="c4-pnt-tools">
            <input ref={searchRef} className="c4-field" aria-label={v4("wmpSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
            <select className="c4-select" aria-label={v4("wmpOriflamme")} value={laneOn} onChange={(event) => setLane(event.target.value)}>
              <option value="all">{v4("wmpAll")}</option>
              {present.map((name) => <option key={name} value={name}>{laneLabel(v4, name)}</option>)}
            </select>
            <select className="c4-select" aria-label={v4("wmpBright")} value={toneOn} onChange={(event) => setTone(event.target.value)}>
              <option value="all">{v4("wmpAll")}</option>
              <option value="bright">{v4("wmpBright")}</option>
              <option value="even">{v4("wmpEven")}</option>
              <option value="dim">{v4("wmpDim")}</option>
              <option value="hush">{v4("wmpHush")}</option>
              <option value="mist">{v4("wmpMist")}</option>
            </select>
            <select className="c4-select" aria-label={v4("wmpReviewed")} value={review} onChange={(event) => setReview(event.target.value as PennantReview)}>
              <option value="all">{v4("wmpAll")}</option>
              <option value="reviewed">{v4("wmpReviewed")}</option>
              <option value="fresh">{v4("wmpFresh")}</option>
            </select>
            <select className="c4-select" aria-label={v4("wmpShapeAll")} value={shape} onChange={(event) => setShape(event.target.value as PennantShape)}>
              <option value="all">{v4("wmpShapeAll")}</option>
              <option value="stitch">{v4("wmpShapeStitch")}</option>
              <option value="wide">{v4("wmpShapeWide")}</option>
              <option value="oriflamme">{v4("wmpShapeOriflamme")}</option>
              <option value="gonfalon">{v4("wmpShapeGonfalon")}</option>
            </select>
            <button type="button" className="c4-btn" onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("wmpHide") : v4("wmpShow")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkPennantReview(reviewed, shown.map((row) => row.id), true))}>{v4("wmpBulkReview")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkPennantReview(reviewed, shown.map((row) => row.id), false))}>{v4("wmpBulkClear")}</button>
            <button type="button" className="c4-btn" onClick={() => download("pennant-lanes.csv", pennantsCsv(rows))}>{v4("wmpCsv")}</button>
            <button type="button" className="c4-btn" onClick={() => download("pennant-rows.csv", pennantRowsCsv(rows, reviewed))}>{v4("wmpRowCsv")}</button>
            <Link href={crmv4Href(base, "marketing")}>{v4("wmpMarketing")}</Link>
          </div>
          <ul className="c4-pnt-lanes">
            {LANES.map((name) => (
              <li key={name}>
                <button type="button" className="c4-chip" data-on={hidden.includes(name) ? "1" : "0"} disabled={viewer || !present.includes(name)} onClick={() => storeHidden(togglePennant(hidden, name))}>{laneLabel(v4, name)}</button>
              </li>
            ))}
          </ul>
          <ol className="c4-pnt-book">
            {shown.map((row) => (
              <li key={row.id} data-keyed={stitchedPennant(row.note) ? "1" : "0"} data-wide={widePennant(row.note) ? "1" : "0"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"}>
                <Link href={crmv4Href(base, "marketing")}>{row.label}</Link>
                <span>{pennantMark(row.note)}</span>
                <span>{laneLabel(v4, pennantLane(row.note))}</span>
                <span>{toneLabel(v4, pennantTone(row.note))}</span>
                <span>{v4("wmpStep")} {pennantStep(row.note)}</span>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(togglePennantReview(reviewed, row.id))}>{v4("wmpReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(pennantCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("wmpCopied") : v4("wmpCopy")}</button>
              </li>
            ))}
          </ol>
          <p className="c4-pnt-rules">{v4("wmpRules")} · {v4("wmpStitchMark")}</p>
        </div>
      </div>
    </section>
  );
}
