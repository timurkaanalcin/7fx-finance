"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  DGR_KEY,
  DGR_REVIEW_KEY,
  IFL_DENSITY_KEY,
  IFL_KEY,
  IFL_VIEW_KEY,
  activeGrade,
  activeGradeLane,
  activeGradeTone,
  activeHours,
  activeInk,
  activeReader,
  activeShelf,
  activeWeight,
  addFolio,
  addFolioTick,
  addFolioView,
  adjacentFolioCount,
  bulkFolioFile,
  bulkFolioGrade,
  bulkFolioInk,
  bulkFolioPin,
  bulkFolioTick,
  bulkGradeReview,
  busiestReader,
  catalogGrade,
  catalogGradeCount,
  clashShelfCount,
  cycleGrade,
  densityOf,
  dropFolioView,
  editFolio,
  editFolioNote,
  failLoad,
  fairReader,
  folioCopy,
  folioCounts,
  folioInks,
  folioLedger,
  folioReaders,
  folioShare,
  foliosCsv,
  goldGradeCount,
  wideGradeCount,
  gradeArg,
  gradeCopy,
  gradeFocused,
  gradeLane,
  gradeLaneArg,
  gradeLanes,
  gradeOf,
  gradeRowsCsv,
  gradeShare,
  gradeState,
  gradeStep,
  gradeTone,
  gradeToneArg,
  gradesCsv,
  hoursArg,
  hoursClashCount,
  houseInk,
  inkArg,
  lateFolio,
  lateShare,
  leadingGrade,
  leadingGradeTone,
  matchedFolios,
  moveFocus,
  nextFolio,
  pairReaderCount,
  pauseFocused,
  peakShelf,
  pinFocused,
  presentGrades,
  quietHouseCount,
  quietShelf,
  readFolioViews,
  readFolios,
  readHiddenGrades,
  readReviewedGrades,
  reminderFolios,
  resetFolios,
  setFolioFile,
  setFolioPause,
  setFolioPin,
  setFolioWeight,
  sharedGradeCount,
  sharedInkCount,
  shelfArg,
  shelfGap,
  shelfSpan,
  snoozeFocused,
  snoozeFolio,
  soonFolio,
  sortFolios,
  sortMode,
  suggestHours,
  suggestInk,
  suggestReader,
  toggleGrade,
  toggleGradeReview,
  usedShelves,
  visibleFolios,
  visibleGradeCustomers,
  visibleGradeLanes,
  weightArg,
  weightLoad,
  windowFolios,
  readerArg,
  type FolioDensity,
  type FolioSort,
  type FolioTray,
  type FolioView,
  type GradeRow,
  type GradeShape,
  type InkFolio,
} from "@/lib/crmv4/round215";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  documentsStatus?: string | null;
};

type GlanceRow = GradeRow & { id: string };

const INKS = ["soot", "gall", "gold"] as const;
const GRADES = ["hold", "pass", "fail"] as const;
const LANES = ["shelf", "queue", "vault", "return"] as const;

function inkLabel(v4: V4, ink: string): string {
  if (ink === "soot" || ink === "SOOT") return v4("iflSoot");
  if (ink === "gall" || ink === "GALL") return v4("iflGall");
  if (ink === "gold" || ink === "GOLD") return v4("iflGold");
  return v4("iflBlankInk");
}

function gradeLabel(v4: V4, grade: string): string {
  if (grade === "hold") return v4("iflHold");
  if (grade === "pass") return v4("iflPass");
  if (grade === "fail") return v4("iflFail");
  return v4("iflBlankGrade");
}

function hoursLabel(v4: V4, hours: number | null): string {
  if (hours === 4) return v4("iflHours4");
  if (hours === 8) return v4("iflHours8");
  if (hours === 16) return v4("iflHours16");
  return v4("iflBlankHours");
}

function laneLabel(v4: V4, name: string): string {
  if (name === "shelf") return v4("dgrShelf");
  if (name === "queue") return v4("dgrQueue");
  if (name === "vault") return v4("dgrVault");
  if (name === "return") return v4("dgrReturn");
  if (name === "blank") return v4("dgrClear");
  return v4("dgrUnmarked");
}

function toneLabel(v4: V4, name: string): string {
  if (name === "ivory") return v4("dgrIvory");
  if (name === "gilt") return v4("dgrGilt");
  if (name === "gold") return v4("dgrGold");
  if (name === "ink") return v4("dgrInk");
  return v4("dgrUnmarked");
}

function statusLabel(v4: V4, kind: string): string {
  if (kind === "none") return v4("dgrNone");
  if (kind === "wait") return v4("dgrWait");
  if (kind === "pass") return v4("dgrPass");
  if (kind === "back") return v4("dgrBack");
  if (kind === "") return v4("dgrClear");
  return v4("dgrUnmarked");
}

function auditLabel(v4: V4, audit: string): string {
  const key = {
    save: "iflAuditSave",
    edit: "iflAuditEdit",
    grade: "iflAuditGrade",
    pin: "iflAuditPin",
    unpin: "iflAuditUnpin",
    pause: "iflAuditPause",
    resume: "iflAuditResume",
    file: "iflAuditFile",
    open: "iflAuditOpen",
    ink: "iflAuditInk",
    tick: "iflAuditTick",
    weight: "iflAuditWeight",
    hours: "iflAuditHours",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, shelf: number | null, desk: string): string {
  const gap = shelfGap(shelf, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("iflPast")} ${gap}`;
  if (gap < 0) return `${v4("iflAhead")} ${Math.abs(gap)}`;
  return v4("iflDue");
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

export function InkFolios({ v4 }: { v4: V4 }) {
  const [folios, setFolios] = useState<InkFolio[]>([]);
  const [views, setViews] = useState<FolioView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [reader, setReader] = useState("");
  const [shelf, setShelf] = useState("");
  const [ink, setInk] = useState("");
  const [grade, setGrade] = useState("");
  const [hoursValue, setHoursValue] = useState("");
  const [tick, setTick] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<FolioTray>("open");
  const [readerFilter, setReaderFilter] = useState("all");
  const [inkFilter, setInkFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [shelfFilter, setShelfFilter] = useState("all");
  const [hoursFilter, setHoursFilter] = useState("all");
  const [weightFilter, setWeightFilter] = useState("all");
  const [failOnly, setFailOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [lightOnly, setLightOnly] = useState(false);
  const [board, setBoard] = useState<"gallery" | "ledger">("gallery");
  const [order, setOrder] = useState<FolioSort>("shelf");
  const [density, setDensity] = useState<FolioDensity>("tall");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [deskShelf, setDeskShelf] = useState("");
  const [moveInk, setMoveInk] = useState("gall");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<() => void>(() => {});
  const hoursRef = useRef<() => void>(() => {});
  const pauseRef = useRef<() => void>(() => {});
  const gradeRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readFolios(readJson(IFL_KEY, []));
    const saved = readFolioViews(readJson(IFL_VIEW_KEY, []));
    setFolios(next);
    setViews(saved);
    setDensity(densityOf(readJson(IFL_DENSITY_KEY, "tall")));
    writeJson(IFL_KEY, next);
    writeJson(IFL_VIEW_KEY, saved);
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: InkFolio[]) {
    const saved = readFolios(next);
    setFolios(saved);
    writeJson(IFL_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((folio) => folio.id === id)));
  }
  function storeViews(next: FolioView[]) {
    const saved = readFolioViews(next);
    setViews(saved);
    writeJson(IFL_VIEW_KEY, saved);
  }
  function storeDensity(next: FolioDensity) {
    setDensity(next);
    writeJson(IFL_DENSITY_KEY, next);
  }
  const readers = folioReaders(folios);
  const inks = folioInks(folios);
  const bars = INKS.map((item) => ({ ink: item.toUpperCase(), count: folios.filter((folio) => folio.ink === item.toUpperCase()).length })).filter((row) => row.count > 0);
  const readerOn = activeReader(readerFilter, readers);
  const inkOn = activeInk(inkFilter, inks);
  const gradeOn = activeGrade(gradeFilter, ["hold", "pass", "fail"]);
  const shelfOn = activeShelf(shelfFilter);
  const hoursOn = activeHours(hoursFilter);
  const weightOn = activeWeight(weightFilter);
  const pickedShelf = shelfArg(shelfOn);
  const shown = sortFolios(visibleFolios(
    folios,
    tray,
    query,
    readerArg(readerOn),
    inkArg(inkOn),
    gradeArg(gradeOn),
    pickedShelf.exact,
    pickedShelf.pick,
    hoursArg(hoursOn),
    weightArg(weightOn),
    failOnly,
    peakOnly,
    houseOnly,
    quietOnly,
    lightOnly,
  ), order);
  const ledger = folioLedger(folios, query);
  const counts = folioCounts(folios, deskShelf);
  const clashes = clashShelfCount(folios);
  const hours = hoursClashCount(folios);
  const neighbors = adjacentFolioCount(folios);
  const nextId = nextFolio(folios, deskShelf);
  const nextRow = folios.find((folio) => folio.id === nextId);
  const suggestedInk = suggestInk(folios);
  const suggestedReader = suggestReader(folios);
  const suggestedHours = suggestHours(folios);
  const fair = fairReader(folios, roster);
  const busy = busiestReader(folios);
  const reminders = reminderFolios(folios, deskShelf);
  const windowRows = windowFolios(folios, deskShelf);
  const share = lateShare(folios, deskShelf);
  const matched = matchedFolios(folios, deskShelf);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  pinRef.current = () => {
    if (viewer) return;
    const ids = (board === "ledger" ? ledger : shown).map((folio) => folio.id);
    store(pinFocused(folios, ids, focus));
  };
  hoursRef.current = () => {
    if (viewer) return;
    const ids = (board === "ledger" ? ledger : shown).map((folio) => folio.id);
    store(snoozeFocused(folios, ids, focus));
  };
  pauseRef.current = () => {
    if (viewer) return;
    const ids = (board === "ledger" ? ledger : shown).map((folio) => folio.id);
    store(pauseFocused(folios, ids, focus));
  };
  gradeRef.current = () => {
    if (viewer) return;
    const ids = (board === "ledger" ? ledger : shown).map((folio) => folio.id);
    store(gradeFocused(folios, ids, focus));
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
        hoursRef.current();
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        pauseRef.current();
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        gradeRef.current();
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
    setReader("");
    setShelf("");
    setInk("");
    setGrade("");
    setHoursValue("");
    setTick("");
    setQuery("");
    setEditing("");
  }
  function applyView(view: FolioView) {
    setTray(view.tray);
    setQuery(view.query);
    setReaderFilter(view.reader);
    setInkFilter(view.ink);
    setGradeFilter(view.grade);
    setShelfFilter(view.shelf);
    setHoursFilter(view.hours);
    setWeightFilter(view.weight);
  }
  const rows = board === "ledger" ? ledger : shown;
  return (
    <section className="c4-ifl" aria-label={v4("iflTitle")} data-folios="1" data-role={role} data-density={density}>
      <div className="c4-ifl-sheet">
        <header className="c4-ifl-mast">
          <p className="c4-ifl-spine">{v4("iflSpine")}</p>
          <div>
            <p className="c4-ifl-kicker">{v4("iflSub")}</p>
            <h2 className="c4-title">{v4("iflTitle")}</h2>
          </div>
          <p className="c4-ifl-plate" data-logo="mono">{v4("iflLogo")}</p>
        </header>
        <div className="c4-ifl-body">
          <p className="c4-ifl-rules">{v4("iflHint")}</p>
          <p className="c4-meta">{v4("iflLocal")}</p>
          <p className="c4-meta">{v4("iflNew")} {v4("iflSlash")} {v4("iflEscape")} {v4("iflKeys")} {v4("iflPinKey")} {v4("iflHoursKey")} {v4("iflPauseKey")} {v4("iflGradeKey")} {v4("iflBoardKey")}</p>
          {viewer && <p className="c4-ifl-notice" data-viewer="1">{v4("iflViewer")}</p>}
          {counts.peak > 0 && (
            <p className="c4-ifl-notice" role="status">
              {v4("iflNotice")} · {counts.peak}
              <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("iflNoticeAll") : v4("iflNoticePeak")}</button>
            </p>
          )}
          {counts.late > 0 && <p className="c4-ifl-notice" role="status" data-late="1">{v4("iflLateNotice")} · {counts.late}</p>}
          <ol className="c4-ifl-ledger" aria-label={v4("iflKpi")}>
            <li><span>{v4("iflOpen")}</span><strong>{counts.open}</strong></li>
            <li><span>{v4("iflPaused")}</span><strong>{counts.paused}</strong></li>
            <li><span>{v4("iflFiled")}</span><strong>{counts.filed}</strong></li>
            <li><span>{v4("iflPinned")}</span><strong>{counts.pinned}</strong></li>
            <li><span>{v4("iflPeak")}</span><strong>{counts.peak}</strong></li>
            <li><span>{v4("iflLate")}</span><strong>{counts.late}</strong></li>
            <li><span>{v4("iflSoon")}</span><strong>{counts.soon}</strong></li>
            <li><span>{v4("iflWeight")}</span><strong>{counts.weight}</strong></li>
            <li><span>{v4("iflMatched")}</span><strong>{matched}</strong></li>
            <li><span>{v4("iflHouseShare")}</span><strong>{folioShare(counts.house, folios.length)}%</strong></li>
            <li><span>{v4("iflLateShare")}</span><strong>{share}%</strong></li>
          </ol>
          <div className="c4-ifl-sla" aria-label={v4("iflLateShare")}>
            <span>{v4("iflLateShare")}</span>
            <div className="c4-ifl-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></div>
          </div>
          <div className="c4-ifl-rail" aria-label={v4("iflInks")}>
            {bars.map((bar) => (
              <div key={bar.ink} className="c4-ifl-meter" data-ink={bar.ink.toLowerCase()}>
                <button type="button" className="c4-btn" onClick={() => setInkFilter(bar.ink)}>{inkLabel(v4, bar.ink)} · {bar.count}</button>
                <div className="c4-ifl-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
              </div>
            ))}
            {!bars.length && <p className="c4-ifl-empty">{v4("iflEmpty")}</p>}
          </div>
          <div className="c4-ifl-suggest">
            <p>{v4("iflSuggestInk")} · {inkLabel(v4, suggestedInk)}</p>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setInk(suggestedInk.toLowerCase())}>{v4("iflUseInk")}</button>
            <p>{v4("iflSuggestReader")} · {suggestedReader || v4("iflBlankReader")}</p>
            <button type="button" className="c4-btn" disabled={viewer || !suggestedReader} onClick={() => setReader(suggestedReader)}>{v4("iflUseReader")}</button>
            <p>{v4("iflSuggestHours")} · {hoursLabel(v4, suggestedHours)}</p>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setHoursValue(String(suggestedHours))}>{v4("iflUseHours")}</button>
            <p>{v4("iflAssign")} · {fair || v4("iflBlankReader")}</p>
            <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setReader(fair)}>{v4("iflAssign")}</button>
          </div>
          <p className="c4-meta">{v4("iflShelves")} · {usedShelves(folios)}</p>
          <p className="c4-meta">{clashes ? `${v4("iflClash")} · ${clashes}` : v4("iflClashNone")}</p>
          <p className="c4-meta">{hours ? `${v4("iflHoursClash")} · ${hours}` : v4("iflHoursClashNone")}</p>
          <p className="c4-meta">{neighbors ? `${v4("iflAdjacent")} · ${neighbors}` : v4("iflAdjacentNone")}</p>
          <p className="c4-meta">{pairReaderCount(folios) ? `${v4("iflPairs")} · ${pairReaderCount(folios)}` : v4("iflPairsNone")}</p>
          <p className="c4-meta">{sharedInkCount(folios) ? `${v4("iflSharedInk")} · ${sharedInkCount(folios)}` : v4("iflSharedInkNone")}</p>
          <p className="c4-meta">{`${v4("iflWeightLoad")} · ${weightLoad(folios)}`}</p>
          <p className="c4-meta">{`${v4("iflQuietHouse")} · ${quietHouseCount(folios)}`}</p>
          <p className="c4-meta">{`${v4("iflFailLoad")} · ${failLoad(folios)}`}</p>
          <p className="c4-meta">{`${v4("iflShelfSpan")} · ${shelfSpan(folios)}`}</p>
          <p className="c4-meta">{nextRow ? `${v4("iflNext")} · ${nextRow.title}` : v4("iflNextNone")}</p>
          <p className="c4-meta">{busy ? `${v4("iflBusiest")} · ${busy}` : v4("iflBusiestNone")}</p>
          <div className="c4-ifl-reminders" aria-label={v4("iflReminders")}>
            {reminders.length ? reminders.map((folio) => <span key={folio.id}>{folio.title}</span>) : <span>{v4("iflReminderNone")}</span>}
          </div>
          <div className="c4-ifl-window" aria-label={v4("iflWindow")}>
            {windowRows.length ? windowRows.map((folio) => <span key={folio.id}>{folio.title}</span>) : <span>{v4("iflWindowNone")}</span>}
          </div>
          <label className="c4-lab">{v4("iflSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("iflSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <div className="c4-ifl-filters" role="group" aria-label={v4("iflSearch")}>
            {(["open", "paused", "filed"] as const).map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("iflOpenTray") : item === "paused" ? v4("iflPausedTray") : v4("iflFiledTray")}</button>
            ))}
            <button type="button" className="c4-chip" data-on={readerOn === "all" ? "1" : "0"} onClick={() => setReaderFilter("all")}>{v4("iflAll")}</button>
            <button type="button" className="c4-chip" data-on={readerOn === "blank" ? "1" : "0"} onClick={() => setReaderFilter("blank")}>{v4("iflBlankReader")}</button>
            {readers.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={readerOn === name ? "1" : "0"} onClick={() => setReaderFilter(name)}>{name}</button>
            ))}
            <button type="button" className="c4-chip" data-on={inkOn === "all" ? "1" : "0"} onClick={() => setInkFilter("all")}>{v4("iflInk")}</button>
            <button type="button" className="c4-chip" data-on={inkOn === "blank" ? "1" : "0"} onClick={() => setInkFilter("blank")}>{v4("iflBlankInk")}</button>
            {INKS.map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={inkOn === item.toUpperCase() ? "1" : "0"} onClick={() => setInkFilter(item)}>{inkLabel(v4, item)}</button>
            ))}
            <button type="button" className="c4-chip" data-on={gradeOn === "all" ? "1" : "0"} onClick={() => setGradeFilter("all")}>{v4("iflGrade")}</button>
            <button type="button" className="c4-chip" data-on={gradeOn === "blank" ? "1" : "0"} onClick={() => setGradeFilter("blank")}>{v4("iflBlankGrade")}</button>
            {GRADES.map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={gradeOn === item ? "1" : "0"} onClick={() => setGradeFilter(item)}>{gradeLabel(v4, item)}</button>
            ))}
            {["all", "blank", "early", "mid", "late", "peak", "quiet", "1", "8"].map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={shelfOn === item ? "1" : "0"} onClick={() => setShelfFilter(item)}>{item === "all" ? v4("iflShelf") : item === "blank" ? v4("iflBlankShelf") : item === "early" ? v4("iflEarly") : item === "mid" ? v4("iflMid") : item === "late" ? v4("iflLateShelf") : item === "peak" ? v4("iflPeak") : item === "quiet" ? v4("iflQuiet") : item}</button>
            ))}
            {["all", "blank", "4", "8", "16"].map((item) => (
              <button key={`h${item}`} type="button" className="c4-chip" data-on={hoursOn === item ? "1" : "0"} onClick={() => setHoursFilter(item)}>{item === "all" ? v4("iflHours") : item === "blank" ? v4("iflBlankHours") : hoursLabel(v4, Number(item))}</button>
            ))}
            {["all", "blank", "0", "2", "5"].map((item) => (
              <button key={`w${item}`} type="button" className="c4-chip" data-on={weightOn === item ? "1" : "0"} onClick={() => setWeightFilter(item)}>{item === "all" ? v4("iflWeight") : item === "blank" ? v4("iflBlankWeight") : item}</button>
            ))}
            <button type="button" className="c4-chip" data-on={failOnly ? "1" : "0"} onClick={() => setFailOnly((on) => !on)}>{v4("iflFailOnly")}</button>
            <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((on) => !on)}>{v4("iflPeakOnly")}</button>
            <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((on) => !on)}>{v4("iflHouseOnly")}</button>
            <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((on) => !on)}>{v4("iflQuietOnly")}</button>
            <button type="button" className="c4-chip" data-on={lightOnly ? "1" : "0"} onClick={() => setLightOnly((on) => !on)}>{v4("iflLightOnly")}</button>
            <button type="button" className="c4-chip" data-on={order === "shelf" ? "1" : "0"} onClick={() => setOrder(sortMode("shelf"))}>{v4("iflSortShelf")}</button>
            <button type="button" className="c4-chip" data-on={order === "reader" ? "1" : "0"} onClick={() => setOrder(sortMode("reader"))}>{v4("iflSortReader")}</button>
            <button type="button" className="c4-chip" data-on={density === "tall" ? "1" : "0"} onClick={() => storeDensity("tall")}>{v4("iflTall")}</button>
            <button type="button" className="c4-chip" data-on={density === "low" ? "1" : "0"} onClick={() => storeDensity("low")}>{v4("iflLow")}</button>
            <button type="button" className="c4-chip" data-on={board === "gallery" ? "1" : "0"} onClick={() => setBoard("gallery")}>{v4("iflGallery")}</button>
            <button type="button" className="c4-chip" data-on={board === "ledger" ? "1" : "0"} onClick={() => setBoard("ledger")}>{v4("iflLedger")}</button>
          </div>
          <form className="c4-ifl-form" onSubmit={(event) => {
            event.preventDefault();
            if (viewer) return;
            store(addFolio(folios, { id: `ifl-${Date.now()}`, title, note, reader, shelf, ink, grade, hours: hoursValue, ticks: tick }));
            clearDraft();
          }}>
            <label className="c4-lab">{v4("iflLine")}<input ref={titleRef} className="c4-field" aria-label={v4("iflLine")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
            <label className="c4-lab">{v4("iflNote")}<input className="c4-field" aria-label={v4("iflNote")} value={note} onChange={(event) => setNote(event.target.value)} /></label>
            <label className="c4-lab">{v4("iflReader")}<input className="c4-field" aria-label={v4("iflReader")} value={reader} onChange={(event) => setReader(event.target.value)} /></label>
            <label className="c4-lab">{v4("iflShelf")}<input className="c4-field" aria-label={v4("iflShelf")} value={shelf} onChange={(event) => setShelf(event.target.value)} /></label>
            <label className="c4-lab">{v4("iflInk")}<input className="c4-field" aria-label={v4("iflInk")} value={ink} onChange={(event) => setInk(event.target.value)} /></label>
            <label className="c4-lab">{v4("iflGrade")}<input className="c4-field" aria-label={v4("iflGrade")} value={grade} onChange={(event) => setGrade(event.target.value)} /></label>
            <label className="c4-lab">{v4("iflHours")}<input className="c4-field" aria-label={v4("iflHours")} value={hoursValue} onChange={(event) => setHoursValue(event.target.value)} /></label>
            <label className="c4-lab">{v4("iflTick")}<input className="c4-field" aria-label={v4("iflTick")} value={tick} onChange={(event) => setTick(event.target.value)} /></label>
            <button type="submit" className="c4-btn" disabled={viewer}>{v4("iflSave")}</button>
          </form>
          <label className="c4-lab">{v4("iflDeskShelf")}<input className="c4-field" aria-label={v4("iflDeskShelf")} value={deskShelf} onChange={(event) => setDeskShelf(event.target.value)} /></label>
          <label className="c4-lab">{v4("iflRoster")}<input className="c4-field" aria-label={v4("iflRoster")} value={roster} onChange={(event) => setRoster(event.target.value)} /></label>
          <div className="c4-ifl-views">
            <label className="c4-lab">{v4("iflViewName")}<input className="c4-field" aria-label={v4("iflViewName")} value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
              const name = viewName.trim();
              if (!name) return;
              storeViews(addFolioView(views, { id: `view-${Date.now()}`, name, tray, query, reader: readerOn, ink: inkOn, grade: gradeOn, shelf: shelfOn, hours: hoursOn, weight: weightOn }));
              setViewName("");
            }}>{v4("iflSaveView")}</button>
            {views.map((view) => (
              <span key={view.id}>
                <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
                <button type="button" className="c4-btn" disabled={viewer} aria-label={v4("iflDropView")} onClick={() => storeViews(dropFolioView(views, view.id))}>×</button>
              </span>
            ))}
          </div>
          <div className="c4-ifl-bulk">
            <label className="c4-lab">{v4("iflBulkInk")}<input className="c4-field" aria-label={v4("iflBulkInk")} value={moveInk} onChange={(event) => setMoveInk(event.target.value)} /></label>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkFolioInk(folios, picked, moveInk))}>{v4("iflBulkInk")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkFolioPin(folios, picked, true))}>{v4("iflBulkPin")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkFolioFile(folios, picked, true))}>{v4("iflBulkFile")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkFolioTick(folios, picked, tick))}>{v4("iflBulkTick")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkFolioGrade(folios, picked, grade))}>{v4("iflBulkGrade")}</button>
            <button type="button" className="c4-btn" onClick={() => download("ink-folios.csv", foliosCsv(folios, deskShelf))}>{v4("iflCsv")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetFolios())}>{v4("iflReset")}</button>
          </div>
          {!rows.length && <p className="c4-ifl-empty">{v4("iflEmpty")}</p>}
          <ol className={board === "ledger" ? "c4-ifl-time" : "c4-ifl-book"}>
            {rows.map((folio, index) => (
              <li key={folio.id} data-focus={focus === index ? "1" : "0"} data-late={lateFolio(folio, deskShelf) ? "1" : "0"} data-soon={soonFolio(folio) ? "1" : "0"} data-peak={peakShelf(folio.shelf) ? "1" : "0"} data-quiet={quietShelf(folio.shelf) ? "1" : "0"} data-house={houseInk(folio.ink) ? "1" : "0"} data-pinned={folio.pinned ? "1" : "0"} data-weight={folio.weight ? "1" : "0"} data-grade={folio.grade || "blank"}>
                <label className="c4-check"><input type="checkbox" checked={picked.includes(folio.id)} onChange={() => setPicked((ids) => ids.includes(folio.id) ? ids.filter((id) => id !== folio.id) : [...ids, folio.id])} /><span>{folio.shelf ?? "—"}</span></label>
                <div>
                  {editing === folio.id ? (
                    <div className="c4-row">
                      <input className="c4-field" aria-label={v4("iflLine")} value={draft} onChange={(event) => setDraft(event.target.value)} />
                      <input className="c4-field" aria-label={v4("iflNote")} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} />
                      <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(editFolioNote(editFolio(folios, folio.id, draft), folio.id, noteDraft)); setEditing(""); }}>{v4("iflSave")}</button>
                    </div>
                  ) : (
                    <>
                      <strong>{folio.title}</strong>
                      <span className="c4-meta">{folio.reader || v4("iflBlankReader")} · {inkLabel(v4, folio.ink)} · {gradeLabel(v4, folio.grade)} · {hoursLabel(v4, folio.hours)} · {gapLabel(v4, folio.shelf, deskShelf)}</span>
                      {folio.note && <p>{folio.note}</p>}
                      {!!folio.ticks.length && <p className="c4-meta">{folio.ticks.join(" ")}</p>}
                      {folio.audit && <p className="c4-meta">{auditLabel(v4, folio.audit)}</p>}
                    </>
                  )}
                  <div className="c4-row">
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFolioPin(folios, folio.id, !folio.pinned))}>{folio.pinned ? v4("iflUnpin") : v4("iflPin")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFolioPause(folios, folio.id, !folio.paused))}>{folio.paused ? v4("iflResume") : v4("iflPause")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleGrade(folios, folio.id))}>{v4("iflGrade")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addFolioTick(folios, folio.id, tick))}>{v4("iflTick")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFolioFile(folios, folio.id, !folio.filed))}>{folio.filed ? v4("iflReopen") : v4("iflFile")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFolioWeight(folios, folio.id, folio.weight ? 0 : 2))}>{folio.weight ? v4("iflWeightOff") : v4("iflWeightOn")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(snoozeFolio(folios, folio.id))}>{v4("iflSnooze")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(folio.id); setDraft(folio.title); setNoteDraft(folio.note); }}>{v4("iflEdit")}</button>
                    <button type="button" className="c4-btn" onClick={() => { const line = folioCopy(folio, deskShelf); void navigator.clipboard?.writeText(line); setCopied(folio.id); }}>{copied === folio.id ? v4("iflCopied") : v4("iflCopy")}</button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <p className="c4-ifl-rules">{v4("iflRules")}</p>
        </div>
      </div>
    </section>
  );
}

export function DocumentGrades({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("all");
  const [tone, setTone] = useState("all");
  const [shape, setShape] = useState<GradeShape>("all");
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
    note: { documentsStatus: user.documentsStatus ?? null },
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
    const present = presentGrades(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenGrades(readJson(DGR_KEY, []), present);
    const nextReviewed = readReviewedGrades(readJson(DGR_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(DGR_KEY, nextHidden);
    writeJson(DGR_REVIEW_KEY, nextReviewed);
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
  const present = presentGrades(rows);
  const lanes = visibleGradeLanes(present, hidden, showHidden);
  const laneOn = activeGradeLane(lane, present);
  const toneOn = activeGradeTone(tone);
  const shown = visibleGradeCustomers(rows, gradeLaneArg(laneOn), gradeToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = gradeState(row.note);
      const token = state === "set" ? gradeLane(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return lanes.includes(token);
    });
  const lead = leadingGrade(rows);
  const toneLead = leadingGradeTone(rows);
  const shared = sharedGradeCount(rows);
  const catalog = catalogGradeCount(rows);
  const bars = gradeLanes(rows).filter((line) => line.lane);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(DGR_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedGrades(next, ids);
    setReviewed(saved);
    writeJson(DGR_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-dgr" aria-label={v4("dgrTitle")} data-grades="1" data-role={role} data-catalog={catalog ? "1" : "0"}>
      <div className="c4-dgr-sheet">
        <header className="c4-dgr-mast">
          <div>
            <p className="c4-dgr-kicker">{v4("dgrSub")}</p>
            <h2 className="c4-title">{v4("dgrTitle")}</h2>
          </div>
          <p className="c4-dgr-plate" data-logo="mono">{v4("dgrLogo")}</p>
        </header>
        <div className="c4-dgr-body">
        <p className="c4-dgr-rules">{v4("dgrHint")}</p>
        <p className="c4-meta">{v4("dgrKept")} {v4("dgrEscape")}</p>
        {viewer && <p className="c4-dgr-notice" data-viewer="1">{v4("dgrViewer")}</p>}
        {data.error && <p className="c4-dgr-empty" role="alert">{v4("dgrFailed")}</p>}
        {data.loading && <p className="c4-meta">{v4("dgrLoading")}</p>}
        {shared > 0 && <p className="c4-dgr-notice" role="status">{v4("dgrNotice")} · {shared}</p>}
        <ol className="c4-dgr-ledger" aria-label={v4("dgrKpi")}>
          <li><span>{v4("dgrSet")}</span><strong>{rows.filter((row) => gradeState(row.note) === "set").length}</strong></li>
          <li><span>{v4("dgrCatalog")}</span><strong>{catalog}</strong></li>
          <li><span>{v4("dgrWide")}</span><strong>{wideGradeCount(rows)}</strong></li>
          <li><span>{v4("dgrGoldCount")}</span><strong>{goldGradeCount(rows)}</strong></li>
          <li><span>{v4("dgrShare")}</span><strong>{gradeShare(catalog, rows.length)}%</strong></li>
          <li><span>{v4("dgrShared")}</span><strong>{shared}</strong></li>
        </ol>
        <div className="c4-dgr-rail" aria-label={v4("dgrLanes")}>
          {bars.map((bar) => (
            <div key={bar.lane} className="c4-dgr-meter" data-lane={bar.lane}>
              <button type="button" className="c4-btn" onClick={() => setLane(bar.lane)}>{laneLabel(v4, bar.lane)} · {bar.count}</button>
              <div className="c4-dgr-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            </div>
          ))}
          {!bars.length && <p className="c4-dgr-empty">{v4("dgrEmpty")}</p>}
        </div>
        <div className="c4-dgr-suggest">
          <p>{v4("dgrLeading")} · {lead ? laneLabel(v4, lead) : v4("dgrLeadingNone")}</p>
          <p>{v4("dgrToneLead")} · {toneLead ? toneLabel(v4, toneLead) : v4("dgrToneNone")}</p>
          <p>{shared ? `${v4("dgrShared")} · ${shared}` : v4("dgrSharedNone")}</p>
        </div>
        <label className="c4-lab">{v4("dgrSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("dgrSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <div className="c4-dgr-filters">
          <button type="button" className="c4-chip" data-on={laneOn === "all" ? "1" : "0"} onClick={() => setLane("all")}>{v4("dgrAll")}</button>
          <button type="button" className="c4-chip" data-on={laneOn === "blank" ? "1" : "0"} onClick={() => setLane("blank")}>{v4("dgrClear")}</button>
          {LANES.map((item) => (
            <button key={item} type="button" className="c4-chip" data-on={laneOn === item ? "1" : "0"} onClick={() => setLane(item)}>{laneLabel(v4, item)}</button>
          ))}
          <button type="button" className="c4-chip" data-on={toneOn === "all" ? "1" : "0"} onClick={() => setTone("all")}>{v4("dgrTone")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "ivory" ? "1" : "0"} onClick={() => setTone("ivory")}>{v4("dgrIvory")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "gilt" ? "1" : "0"} onClick={() => setTone("gilt")}>{v4("dgrGilt")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "gold" ? "1" : "0"} onClick={() => setTone("gold")}>{v4("dgrGold")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "ink" ? "1" : "0"} onClick={() => setTone("ink")}>{v4("dgrInk")}</button>
          {(["all", "catalog", "wide", "gold"] as const).map((item) => (
            <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{item === "all" ? v4("dgrAllShapes") : item === "catalog" ? v4("dgrCatalog") : item === "wide" ? v4("dgrWide") : v4("dgrGold")}</button>
          ))}
          <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} onClick={() => setReview("all")}>{v4("dgrAllReview")}</button>
          <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview("reviewed")}>{v4("dgrReviewed")}</button>
          <button type="button" className="c4-chip" data-on={review === "open" ? "1" : "0"} onClick={() => setReview("open")}>{v4("dgrOpenReview")}</button>
          <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("dgrShown") : v4("dgrHidden")}</button>
        </div>
        <div className="c4-dgr-bands">
          {present.map((item) => (
            <button key={item} type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleGrade(hidden, item))}>
              {laneLabel(v4, item)} · {hidden.includes(item) ? v4("dgrShow") : v4("dgrHide")}
            </button>
          ))}
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkGradeReview(reviewed, shown.map((row) => row.id), true))}>{v4("dgrBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkGradeReview(reviewed, ids, false))}>{v4("dgrBulkClear")}</button>
          <button type="button" className="c4-btn" onClick={() => download("document-grades.csv", gradesCsv(rows))}>{v4("dgrCsv")}</button>
          <button type="button" className="c4-btn" onClick={() => download("document-grade-rows.csv", gradeRowsCsv(rows, reviewed))}>{v4("dgrRowCsv")}</button>
          <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("dgrCustomers")}</Link>
        </div>
        {!shown.length && <p className="c4-dgr-empty">{v4("dgrEmpty")}</p>}
        <ul className="c4-dgr-index">
          {shown.map((row) => {
            const state = gradeState(row.note);
            const mark = gradeOf(row.note);
            const step = gradeStep(row.note);
            const kind = gradeCopy(row.note);
            const steps = [v4("dgrNone"), v4("dgrWait"), kind === "back" ? v4("dgrBack") : v4("dgrPass")];
            return (
              <li key={row.id} data-state={state || "blank"} data-lane={state === "set" ? gradeLane(row.note) : "blank"} data-tone={gradeTone(row.note) || "blank"} data-catalog={catalogGrade(row.note) ? "1" : "0"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"} data-step={step}>
                <p className="c4-dgr-mark" data-logo="mono">{mark || "—"}</p>
                <div>
                  <strong>{row.label || row.id}</strong>
                  <span className="c4-meta">{statusLabel(v4, kind)} · {laneLabel(v4, state === "set" ? gradeLane(row.note) : state === "clear" ? "blank" : "")} · {toneLabel(v4, gradeTone(row.note))}</span>
                  <ol className="c4-dgr-time" aria-label={v4("dgrStep")}>
                    {steps.map((label, index) => (
                      <li key={label} data-on={step >= index + 1 ? "1" : "0"} data-back={kind === "back" && index === 2 ? "1" : "0"}>{label}</li>
                    ))}
                  </ol>
                  {catalogGrade(row.note) && <span className="c4-meta">{v4("dgrCatalogMark")}</span>}
                  <div className="c4-row">
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleGradeReview(reviewed, row.id))}>{v4("dgrReview")}</button>
                    <button type="button" className="c4-btn" onClick={() => { const line = gradeCopy(row.note); void navigator.clipboard?.writeText(line); setCopied(row.id); }}>{copied === row.id ? v4("dgrCopied") : v4("dgrCopy")}</button>
                    <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{row.label || row.id}</Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="c4-dgr-rules">{v4("dgrRules")}</p>
        </div>
      </div>
    </section>
  );
}
