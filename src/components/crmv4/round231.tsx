"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  QIR_DENSITY_KEY,
  QIR_KEY,
  QIR_VIEW_KEY,
  RMG_KEY,
  RMG_REVIEW_KEY,
  activeBay,
  activeGait,
  activeInk,
  activeLeaf,
  activeMarginLane,
  activeMarginTone,
  activeQuireClerk,
  activeSpine,
  addQuire,
  addQuireTag,
  addQuireView,
  adjacentQuireCount,
  bayArg,
  bayGap,
  bayWidth,
  bulkMarginReview,
  bulkQuireArchive,
  bulkQuireGait,
  bulkQuireInk,
  bulkQuirePin,
  bulkQuireTag,
  busiestQuireClerk,
  clashBayCount,
  coolingQuire,
  coolingQuires,
  cycleGait,
  dropQuireView,
  editQuire,
  editQuireNote,
  fairQuireClerk,
  flareQuireLoad,
  gaitArg,
  gaitFocusedQuire,
  giltMarginCount,
  holdFocusedQuire,
  houseInk,
  inkArg,
  lateQuire,
  lateQuireShare,
  leafArg,
  leafClashCount,
  leadingMargin,
  leadingMarginTone,
  marginCopy,
  marginLane,
  marginLaneArg,
  marginLanes,
  marginMark,
  marginRowsCsv,
  marginShare,
  marginState,
  marginStep,
  marginTone,
  marginToneArg,
  marginsCsv,
  matchedQuires,
  moveQuireFocus,
  nextQuire,
  pairQuireCount,
  peakBay,
  pinFocusedQuire,
  porchCount,
  presentMarginLanes,
  quireClerkArg,
  quireClerks,
  quireCopy,
  quireCounts,
  quireDensity,
  quireIndex,
  quireInks,
  quireShare,
  quiresCsv,
  quietBay,
  quietHallQuires,
  readHiddenMargins,
  readQuireViews,
  readQuires,
  readReviewedMargins,
  reminderQuires,
  sealFocusedQuire,
  sealMarginCount,
  setQuireArchive,
  setQuireHold,
  setQuirePin,
  setQuireSeal,
  setQuireSpine,
  sharedInkCount,
  sharedMarginCount,
  snoozeFocusedQuire,
  snoozeQuire,
  sortQuires,
  spineArg,
  spineLoad,
  stampMarginCount,
  stitchedMargin,
  stitchedMarginCount,
  suggestInk,
  suggestLeaf,
  suggestQuireClerk,
  toggleMargin,
  toggleMarginReview,
  visibleMarginLanes,
  visibleMargins,
  visibleQuires,
  wideMargin,
  type MarginReview,
  type MarginRow,
  type MarginShape,
  type MarginValue,
  type QuireDensity,
  type QuireSort,
  type QuireTray,
  type QuireView,
  type ReportQuire,
} from "@/lib/crmv4/round231";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const INKS = ["graphite", "ivory", "champagne"] as const;
const GAITS = ["still", "walk", "flare"] as const;
const LEAVES = ["10", "20", "40"] as const;
const SPINES = ["3", "6", "9"] as const;
const BAYS = ["1", "2", "3", "4", "5", "6"] as const;

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "qirAuditSave",
  edit: "qirAuditEdit",
  note: "qirAuditNote",
  gait: "qirAuditGait",
  pin: "qirAuditPin",
  unpin: "qirAuditUnpin",
  hold: "qirAuditHold",
  resume: "qirAuditResume",
  archive: "qirAuditArchive",
  open: "qirAuditOpen",
  ink: "qirAuditInk",
  tag: "qirAuditTag",
  spine: "qirAuditSpine",
  leaf: "qirAuditLeaf",
  seal: "qirAuditSeal",
};

type TraderRow = { id?: string; name?: string | null; desk?: string | null; country?: string | null; documentsStatus?: string | null };
type TicketRow = { id?: string; customer?: string | null; kind?: string | null; status?: string | null };

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

function textField(raw: string | null | undefined): string {
  return typeof raw === "string" ? raw : "";
}

function inkLabel(v4: V4, ink: string): string {
  if (ink === "GRAPHITE" || ink === "graphite") return v4("qirGraphite");
  if (ink === "IVORY" || ink === "ivory") return v4("qirIvory");
  if (ink === "CHAMPAGNE" || ink === "champagne") return v4("qirChampagne");
  return v4("qirBlankInk");
}

function gaitLabel(v4: V4, gait: string): string {
  if (gait === "still") return v4("qirStill");
  if (gait === "walk") return v4("qirWalk");
  if (gait === "flare") return v4("qirFlare");
  return v4("qirBlankGait");
}

function laneLabel(v4: V4, lane: string): string {
  if (lane === "stamp") return v4("rmgStamp");
  if (lane === "seal") return v4("rmgSeal");
  if (lane === "atrium") return v4("rmgAtrium");
  if (lane === "nave") return v4("rmgNave");
  if (lane === "porch") return v4("rmgPorch");
  if (lane === "blank") return v4("rmgClear");
  return v4("rmgUnmarked");
}

function toneLabel(v4: V4, tone: string): string {
  if (tone === "gilt") return v4("rmgGilt");
  if (tone === "linen") return v4("rmgLinen");
  if (tone === "pale") return v4("rmgPale");
  if (tone === "ash") return v4("rmgAsh");
  if (tone === "haze") return v4("rmgHaze");
  return v4("rmgUnmarked");
}

function gapLabel(v4: V4, bay: number | null, desk: string): string {
  const gap = bayGap(bay, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("qirPast")} ${gap}`;
  if (gap < 0) return `${v4("qirAhead")} ${Math.abs(gap)}`;
  return v4("qirDue");
}

function atriumCount(rows: readonly MarginRow[]): number {
  return rows.filter((row) => marginLane(row.note) === "atrium").length;
}

function naveCount(rows: readonly MarginRow[]): number {
  return rows.filter((row) => marginLane(row.note) === "nave").length;
}

export function ReportQuires({ base, v4 }: { base: string; v4: V4 }) {
  const [panels, setPanels] = useState<ReportQuire[]>([]);
  const [views, setViews] = useState<QuireView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [clerk, setClerk] = useState("");
  const [bay, setBay] = useState("");
  const [ink, setInk] = useState("");
  const [gait, setGait] = useState("");
  const [leafValue, setLeafValue] = useState("");
  const [spine, setSpine] = useState("");
  const [tag, setTag] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<QuireTray>("open");
  const [clerkFilter, setClerkFilter] = useState("all");
  const [inkFilter, setInkFilter] = useState("all");
  const [gaitFilter, setGaitFilter] = useState("all");
  const [bayFilter, setBayFilter] = useState("all");
  const [leafFilter, setLeafFilter] = useState("all");
  const [spineFilter, setSpineFilter] = useState("all");
  const [flareOnly, setFlareOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [restingOnly, setRestingOnly] = useState(false);
  const [board, setBoard] = useState<"hall" | "index">("hall");
  const [order, setOrder] = useState<QuireSort>("bay");
  const [density, setDensity] = useState<QuireDensity>("airy");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [deskBay, setDeskBay] = useState("");
  const [moveInk, setMoveInk] = useState("champagne");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<() => void>(() => {});
  const leafRef = useRef<() => void>(() => {});
  const holdRef = useRef<() => void>(() => {});
  const gaitRef = useRef<() => void>(() => {});
  const sealRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readQuires(readJson(QIR_KEY, []));
    const saved = readQuireViews(readJson(QIR_VIEW_KEY, []));
    setPanels(next);
    setViews(saved);
    setDensity(quireDensity(readJson(QIR_DENSITY_KEY, "airy")));
    writeJson(QIR_KEY, next);
    writeJson(QIR_VIEW_KEY, saved);
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: ReportQuire[]) {
    const saved = readQuires(next);
    setPanels(saved);
    writeJson(QIR_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((panel) => panel.id === id)));
  }
  function storeViews(next: QuireView[]) {
    const saved = readQuireViews(next);
    setViews(saved);
    writeJson(QIR_VIEW_KEY, saved);
  }
  function storeDensity(next: QuireDensity) {
    setDensity(next);
    writeJson(QIR_DENSITY_KEY, next);
  }
  const clerks = quireClerks(panels);
  const inks = quireInks(panels);
  const bars = INKS.map((item) => ({ ink: item.toUpperCase(), count: panels.filter((panel) => panel.ink === item.toUpperCase()).length })).filter((row) => row.count > 0);
  const clerkOn = activeQuireClerk(clerkFilter, clerks);
  const inkOn = activeInk(inkFilter, ["GRAPHITE", "IVORY", "CHAMPAGNE", ...inks]);
  const gaitOn = activeGait(gaitFilter, ["still", "walk", "flare"]);
  const bayOn = activeBay(bayFilter);
  const leafOn = activeLeaf(leafFilter);
  const spineOn = activeSpine(spineFilter);
  const pickedBay = bayArg(bayOn);
  const shown = sortQuires(visibleQuires(
    panels,
    tray,
    query,
    quireClerkArg(clerkOn),
    inkArg(inkOn),
    gaitArg(gaitOn),
    pickedBay.exact,
    pickedBay.pick,
    leafArg(leafOn),
    spineArg(spineOn),
    flareOnly,
    peakOnly,
    houseOnly,
    quietOnly,
    restingOnly,
  ), order);
  const book = quireIndex(panels, query);
  const counts = quireCounts(panels, deskBay);
  const share = lateQuireShare(panels, deskBay);
  const matched = matchedQuires(panels, deskBay);
  const clashes = clashBayCount(panels);
  const leaves = leafClashCount(panels);
  const neighbors = adjacentQuireCount(panels);
  const suggestedInk = suggestInk(panels);
  const suggestedName = suggestQuireClerk(panels);
  const suggestedLeaf = suggestLeaf(panels);
  const fair = fairQuireClerk(panels, roster);
  const busy = busiestQuireClerk(panels);
  const reminders = reminderQuires(panels, deskBay);
  const cooling = coolingQuires(panels);
  const nextTitle = nextQuire(panels, deskBay);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  pinRef.current = () => {
    if (!viewer) store(pinFocusedQuire(panels, shown.map((panel) => panel.id), focus));
  };
  leafRef.current = () => {
    if (!viewer) store(snoozeFocusedQuire(panels, shown.map((panel) => panel.id), focus));
  };
  holdRef.current = () => {
    if (!viewer) store(holdFocusedQuire(panels, shown.map((panel) => panel.id), focus));
  };
  gaitRef.current = () => {
    if (!viewer) store(gaitFocusedQuire(panels, shown.map((panel) => panel.id), focus));
  };
  sealRef.current = () => {
    if (!viewer) store(sealFocusedQuire(panels, shown.map((panel) => panel.id), focus));
  };
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setTitle("");
        setNote("");
        setClerk("");
        setBay("");
        setInk("");
        setGait("");
        setLeafValue("");
        setSpine("");
        setTag("");
        setQuery("");
        setEditing("");
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveQuireFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveQuireFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        titleRef.current?.focus();
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        pinRef.current();
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        leafRef.current();
        return;
      }
      if (event.key === "y" || event.key === "Y") {
        event.preventDefault();
        holdRef.current();
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        gaitRef.current();
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        sealRef.current();
        return;
      }
      if (event.key === "d" || event.key === "D") {
        event.preventDefault();
        setBoard((value) => (value === "hall" ? "index" : "hall"));
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown.length]);
  function saveQuire() {
    if (viewer) return;
    store(addQuire(panels, {
      id: `qir-${Date.now()}`,
      title,
      note,
      clerk,
      bay,
      ink,
      gait,
      leaf: leafValue,
      spine,
      tags: tag,
    }));
    setTitle("");
    setNote("");
    setTag("");
  }
  function applyView(view: QuireView) {
    setTray(view.tray);
    setQuery(view.query);
    setClerkFilter(view.clerk || "all");
    setInkFilter(view.ink || "all");
    setGaitFilter(view.gait || "all");
    setBayFilter(view.bay || "all");
    setLeafFilter(view.leaf || "all");
    setSpineFilter(view.spine || "all");
  }
  const focused = shown[focus];
  return (
    <section className="c4-qir" aria-label={v4("qirTitle")} data-quires="1" data-role={role} data-board={board} data-density={density}>
      <header className="c4-qir-mast">
        <p className="c4-qir-seal" data-logo="mono">{v4("qirLogo")}</p>
        <div>
          <p className="c4-qir-kicker">{v4("qirSub")}</p>
          <h2 className="c4-title">{v4("qirTitle")}</h2>
        </div>
        <p className="c4-qir-links">
          <Link href={crmv4Href(base, "reports")}>{v4("qirSub")}</Link>
          <Link href={crmv4Href(base, "rmgn")}>{v4("rmgTitle")}</Link>
        </p>
      </header>
      {viewer && <p className="c4-qir-note">{v4("qirViewer")}</p>}
      <p className="c4-qir-rule">{v4("qirHint")}</p>
      <ul className="c4-qir-kpis" aria-label={v4("qirKpi")}>
        <li><span>{v4("qirOpen")}</span><strong>{counts.open}</strong></li>
        <li><span>{v4("qirHeld")}</span><strong>{counts.held}</strong></li>
        <li><span>{v4("qirArchived")}</span><strong>{counts.archived}</strong></li>
        <li><span>{v4("qirPinned")}</span><strong>{counts.pinned}</strong></li>
        <li><span>{v4("qirPeak")}</span><strong>{counts.peak}</strong></li>
        <li><span>{v4("qirLate")}</span><strong>{counts.late}</strong></li>
        <li><span>{v4("qirSame")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("qirRaised")}</span><strong>{counts.spine}</strong></li>
        <li><span>{v4("qirHouse")}</span><strong>{counts.house}</strong></li>
        <li><span>{v4("qirWindow")}</span><strong>{counts.window}</strong></li>
        <li><span>{v4("qirMatched")}</span><strong>{matched}</strong></li>
        <li><span>{v4("qirSeal")}</span><strong>{counts.seal}</strong></li>
        <li><span>{v4("qirCooling")}</span><strong>{counts.cooling}</strong></li>
      </ul>
      <div className="c4-qir-bars" aria-label={v4("qirInks")}>
        {bars.map((bar) => (
          <div key={bar.ink} className="c4-qir-bar" data-ink={bar.ink.toLowerCase()}>
            <span>{inkLabel(v4, bar.ink)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <p className="c4-qir-meta">
        {v4("qirLateShare")} {share}% · {v4("qirSuggestInk")} {inkLabel(v4, suggestedInk)} · {v4("qirSuggestLeaf")} {suggestedLeaf} · {v4("qirSuggestClerk")} {suggestedName || v4("qirBlankClerk")} · {v4("qirAssign")} {fair || v4("qirBlankClerk")} · {busy ? `${v4("qirBusiest")} ${busy}` : v4("qirBusiestNone")} · {clashes ? `${v4("qirClash")} ${clashes}` : v4("qirClashNone")} · {v4("qirLeafClash")} {leaves} · {neighbors ? `${v4("qirNeighbors")} ${neighbors}` : v4("qirNeighborsNone")} · {v4("qirLoad")} {spineLoad(panels)} · {v4("qirPair")} {pairQuireCount(panels)} · {v4("qirShared")} {sharedInkCount(panels)} · {v4("qirQuietHall")} {quietHallQuires(panels)} · {v4("qirFlare")} {flareQuireLoad(panels)} · {v4("qirBayWidth")} {bayWidth(panels)} · {v4("qirBays")} {new Set(panels.map((panel) => panel.bay).filter((item) => item !== null)).size} · {nextTitle ? `${v4("qirNext")} ${nextTitle}` : v4("qirNextNone")}
      </p>
      <div className="c4-qir-tools">
        <label className="c4-lab"><span>{v4("qirTitleField")}</span><input ref={titleRef} className="c4-field" aria-label={v4("qirTitleField")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("qirNote")}</span><input className="c4-field" aria-label={v4("qirNote")} aria-required={false} value={note} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("qirClerk")}</span><input className="c4-field" aria-label={v4("qirClerk")} aria-required={false} value={clerk} onChange={(event) => setClerk(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("qirBay")}</span>
          <select className="c4-select" aria-label={v4("qirBay")} value={bay} onChange={(event) => setBay(event.target.value)}>
            <option value="">{v4("qirBlank")}</option>
            {BAYS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("qirInk")}</span>
          <select className="c4-select" aria-label={v4("qirInk")} value={ink} onChange={(event) => setInk(event.target.value)}>
            <option value="">{v4("qirBlankInk")}</option>
            {INKS.map((item) => <option key={item} value={item}>{inkLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("qirGait")}</span>
          <select className="c4-select" aria-label={v4("qirGait")} value={gait} onChange={(event) => setGait(event.target.value)}>
            <option value="">{v4("qirBlankGait")}</option>
            {GAITS.map((item) => <option key={item} value={item}>{gaitLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("qirLeaf")}</span>
          <select className="c4-select" aria-label={v4("qirLeaf")} value={leafValue} onChange={(event) => setLeafValue(event.target.value)}>
            <option value="">{v4("qirBlankLeaf")}</option>
            {LEAVES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("qirSpine")}</span>
          <select className="c4-select" aria-label={v4("qirSpine")} value={spine} onChange={(event) => setSpine(event.target.value)}>
            <option value="">{v4("qirResting")}</option>
            {SPINES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("qirTag")}</span><input className="c4-field" aria-label={v4("qirTag")} aria-required={false} value={tag} onChange={(event) => setTag(event.target.value)} /></label>
        <button type="button" className="c4-btn c4-btn-hot" disabled={viewer} onClick={saveQuire}>{v4("qirAdd")}</button>
      </div>
      <div className="c4-qir-tools">
        <label className="c4-lab"><span>{v4("qirDesk")}</span><input className="c4-field" aria-label={v4("qirDesk")} aria-required={false} value={deskBay} onChange={(event) => setDeskBay(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("qirRoster")}</span><input className="c4-field" aria-label={v4("qirRoster")} aria-required={false} value={roster} onChange={(event) => setRoster(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("qirSearch")}</span><input ref={searchRef} className="c4-field c4-qir-search" aria-label={v4("qirSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <button type="button" className="c4-btn" onClick={() => storeDensity(density === "airy" ? "tight" : "airy")}>{density === "airy" ? v4("qirDensityTight") : v4("qirDensityAiry")}</button>
        <button type="button" className="c4-btn" data-on={order === "bay" ? "1" : "0"} onClick={() => setOrder("bay")}>{v4("qirSortBay")}</button>
        <button type="button" className="c4-btn" data-on={order === "clerk" ? "1" : "0"} onClick={() => setOrder("clerk")}>{v4("qirSortClerk")}</button>
        <button type="button" className="c4-btn" data-on={board === "hall" ? "1" : "0"} onClick={() => setBoard("hall")}>{v4("qirBoardHall")}</button>
        <button type="button" className="c4-btn" data-on={board === "index" ? "1" : "0"} onClick={() => setBoard("index")}>{v4("qirBoardIndex")}</button>
        <button type="button" className="c4-btn" onClick={() => download("report-quires.csv", quiresCsv(panels, deskBay))}>{v4("qirCsv")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("qirOpen")}>
        {(["open", "held", "archived"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("qirOpen") : item === "held" ? v4("qirHeld") : v4("qirArchived")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={flareOnly ? "1" : "0"} onClick={() => setFlareOnly((value) => !value)}>{v4("qirFlareOnly")}</button>
        <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((value) => !value)}>{v4("qirPeakOnly")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((value) => !value)}>{v4("qirQuietOnly")}</button>
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("qirHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={restingOnly ? "1" : "0"} onClick={() => setRestingOnly((value) => !value)}>{v4("qirRestingOnly")}</button>
      </div>
      <div className="c4-qir-tools">
        <label className="c4-lab"><span>{v4("qirClerk")}</span>
          <select className="c4-select" aria-label={v4("qirClerk")} value={clerkOn} onChange={(event) => setClerkFilter(event.target.value)}>
            <option value="all">{v4("qirAll")}</option>
            <option value="blank">{v4("qirBlankClerk")}</option>
            {clerks.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("qirInk")}</span>
          <select className="c4-select" aria-label={v4("qirInk")} value={inkOn} onChange={(event) => setInkFilter(event.target.value)}>
            <option value="all">{v4("qirAll")}</option>
            <option value="blank">{v4("qirBlankInk")}</option>
            {INKS.map((item) => <option key={item} value={item.toUpperCase()}>{inkLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("qirGait")}</span>
          <select className="c4-select" aria-label={v4("qirGait")} value={gaitOn} onChange={(event) => setGaitFilter(event.target.value)}>
            <option value="all">{v4("qirAll")}</option>
            <option value="blank">{v4("qirBlankGait")}</option>
            {GAITS.map((item) => <option key={item} value={item}>{gaitLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("qirBay")}</span>
          <select className="c4-select" aria-label={v4("qirBay")} value={bayOn} onChange={(event) => setBayFilter(event.target.value)}>
            <option value="all">{v4("qirAll")}</option>
            <option value="blank">{v4("qirBlank")}</option>
            <option value="early">{v4("qirEarly")}</option>
            <option value="mid">{v4("qirMid")}</option>
            <option value="late">{v4("qirLate")}</option>
            <option value="peak">{v4("qirPeak")}</option>
            <option value="quiet">{v4("qirQuiet")}</option>
            {BAYS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("qirLeaf")}</span>
          <select className="c4-select" aria-label={v4("qirLeaf")} value={leafOn} onChange={(event) => setLeafFilter(event.target.value)}>
            <option value="all">{v4("qirAll")}</option>
            <option value="blank">{v4("qirBlankLeaf")}</option>
            {LEAVES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("qirSpine")}</span>
          <select className="c4-select" aria-label={v4("qirSpine")} value={spineOn} onChange={(event) => setSpineFilter(event.target.value)}>
            <option value="all">{v4("qirAll")}</option>
            <option value="blank">{v4("qirResting")}</option>
            {SPINES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>
      <div className="c4-qir-tools">
        <label className="c4-lab"><span>{v4("qirView")}</span><input className="c4-field" aria-label={v4("qirView")} aria-required={false} value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
          storeViews(addQuireView(views, { id: `view-${Date.now()}`, name: viewName, tray, query, clerk: clerkOn, ink: inkOn, gait: gaitOn, bay: bayOn, leaf: leafOn, spine: spineOn }));
          setViewName("");
        }}>{v4("qirView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-qir-view">
            <button type="button" className="c4-chip" onClick={() => applyView(view)}>{v4("qirApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropQuireView(views, view.id))}>{v4("qirDropView")}</button>
          </span>
        ))}
      </div>
      <div className="c4-qir-tools">
        <label className="c4-lab"><span>{v4("qirBulkInk")}</span>
          <select className="c4-select" aria-label={v4("qirBulkInk")} value={moveInk} onChange={(event) => setMoveInk(event.target.value)}>
            {INKS.map((item) => <option key={item} value={item}>{inkLabel(v4, item)}</option>)}
          </select>
        </label>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkQuireInk(panels, picked, moveInk))}>{v4("qirBulkInk")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkQuirePin(panels, picked, true))}>{v4("qirBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkQuireArchive(panels, picked, true))}>{v4("qirBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkQuireGait(panels, picked, "flare"))}>{v4("qirBulkGait")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkQuireTag(panels, picked, "a"))}>{v4("qirBulkTag")}</button>
      </div>
      <p className="c4-qir-keys">{v4("qirKeys")} {v4("qirEscape")} {v4("qirBoardKey")} {v4("qirGaitKey")} {v4("qirHoldKey")} {v4("qirSealKey")} {v4("qirPinKey")} {v4("qirLeafKey")}</p>
      {!shown.length && board === "hall" && <p className="c4-qir-empty">{v4("qirEmpty")}</p>}
      {board === "hall" ? (
        <ol className={`c4-qir-list ${density === "tight" ? "is-tight" : "is-airy"}`}>
          {shown.map((panel, index) => (
            <li key={panel.id} className="c4-qir-card" data-on={focus === index ? "1" : "0"} data-ink={panel.ink.toLowerCase() || "blank"} data-late={lateQuire(panel, deskBay) ? "1" : "0"} data-cooling={coolingQuire(panel) ? "1" : "0"} data-peak={peakBay(panel.bay) ? "1" : "0"} data-quiet={quietBay(panel.bay) ? "1" : "0"} data-house={houseInk(panel.ink) ? "1" : "0"}>
              <label className="c4-row">
                <input type="checkbox" checked={picked.includes(panel.id)} aria-label={panel.title} onChange={(event) => setPicked((ids) => event.target.checked ? [...ids, panel.id] : ids.filter((id) => id !== panel.id))} />
                <button type="button" className="c4-btn" data-on={focus === index ? "1" : "0"} onClick={() => setFocus(index)}>{v4("qirFocus")}</button>
              </label>
              {editing === panel.id ? (
                <label className="c4-lab"><span>{v4("qirEdit")}</span><input className="c4-field" aria-label={v4("qirEdit")} value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={() => { if (!viewer) store(editQuire(panels, panel.id, draft)); setEditing(""); }} /></label>
              ) : (
                <h3 className="c4-title">{panel.title}</h3>
              )}
              <p>{panel.clerk || v4("qirBlankClerk")} · {panel.bay ?? v4("qirBlank")} · {inkLabel(v4, panel.ink)} · {gaitLabel(v4, panel.gait)} · {panel.leaf ?? v4("qirBlankLeaf")} · {panel.spine} · {panel.tags.join(" ") || v4("qirBlank")} · {gapLabel(v4, panel.bay, deskBay)} · {panel.audit ? v4(AUDIT_KEY[panel.audit] || "qirAuditSave") : ""}</p>
              {editing === `${panel.id}-note` ? (
                <label className="c4-lab"><span>{v4("qirEditNote")}</span><input className="c4-field" aria-label={v4("qirEditNote")} aria-required={false} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} onBlur={() => { if (!viewer) store(editQuireNote(panels, panel.id, noteDraft)); setEditing(""); }} /></label>
              ) : <p>{panel.note}</p>}
              <div className="c4-row">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(panel.id); setDraft(panel.title); }}>{v4("qirEdit")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(`${panel.id}-note`); setNoteDraft(panel.note); }}>{v4("qirEditNote")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setQuirePin(panels, panel.id, !panel.pinned))}>{panel.pinned ? v4("qirUnpin") : v4("qirPin")}</button>
                <button type="button" className="c4-btn" disabled={viewer || panel.archived} onClick={() => store(setQuireHold(panels, panel.id, !panel.held))}>{panel.held ? v4("qirResume") : v4("qirHold")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setQuireArchive(panels, panel.id, !panel.archived))}>{panel.archived ? v4("qirReopen") : v4("qirArchive")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleGait(panels, panel.id))}>{v4("qirGait")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setQuireSeal(panels, panel.id, !panel.seal))}>{panel.seal ? v4("qirUnseal") : v4("qirSeal")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(snoozeQuire(panels, panel.id))}>{v4("qirSnooze")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setQuireSpine(panels, panel.id, panel.spine === 9 ? "3" : panel.spine === 6 ? "9" : "6"))}>{v4("qirSpine")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addQuireTag(panels, panel.id, "b"))}>{v4("qirTag")}</button>
                <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(quireCopy(panel, deskBay)); setCopied(panel.id); }}>{copied === panel.id ? v4("qirCopied") : v4("qirCopy")}</button>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <ol className="c4-qir-index">
          {!book.length && <li className="c4-qir-empty">{v4("qirEmpty")}</li>}
          {book.map((panel) => <li key={panel.id}><span>{panel.bay}</span><strong>{panel.title}</strong><em>{panel.clerk || v4("qirBlankClerk")}</em></li>)}
        </ol>
      )}
      <aside className="c4-qir-side" aria-label={v4("qirReminders")}>
        <h3 className="c4-title">{v4("qirReminders")}</h3>
        {!reminders.length && <p>{v4("qirEmpty")}</p>}
        <ul>{reminders.map((panel) => <li key={panel.id}>{panel.title} · {lateQuire(panel, deskBay) ? v4("qirLate") : v4("qirSame")}</li>)}</ul>
        <h3 className="c4-title">{v4("qirCooling")}</h3>
        {!cooling.length && <p>{v4("qirCoolingEmpty")}</p>}
        <ul>{cooling.map((panel) => <li key={panel.id}>{panel.title}</li>)}</ul>
        {focused && <p>{v4("qirFocus")} {focused.title} · {quireShare(counts.house, Math.max(1, counts.open))}%</p>}
      </aside>
    </section>
  );
}

function traderNote(row: TraderRow): MarginValue {
  return {
    name: textField(row.name),
    desk: textField(row.desk),
    country: textField(row.country),
    papers: textField(row.documentsStatus).toUpperCase(),
  };
}

function ticketNote(row: TicketRow): MarginValue {
  const status = textField(row.status).toUpperCase();
  const papers = status === "APPROVED" || status === "PENDING" || status === "REJECTED" || status === "REVIEW" ? status : "";
  return {
    name: textField(row.customer),
    desk: textField(row.kind),
    country: "",
    papers,
  };
}

export function ReportMargins({ base, v4 }: { base: string; v4: V4 }) {
  const traders = useJson<{ users?: TraderRow[] }>("/api/admin/users?view=table&take=40&meta=0&role=TRADER");
  const tickets = useJson<{ tickets?: TicketRow[] }>("/api/admin/tickets?take=20");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("all");
  const [tone, setTone] = useState("all");
  const [review, setReview] = useState<MarginReview>("all");
  const [shape, setShape] = useState<MarginShape>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const reviewRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  const rows = useMemo<MarginRow[]>(() => {
    const people = (traders.data?.users || []).map((row, index) => ({
      id: row.id || `trader-${index}`,
      label: textField(row.name),
      note: traderNote(row),
    }));
    const cases = (tickets.data?.tickets || []).map((row, index) => ({
      id: row.id ? `ticket-${row.id}` : `ticket-${index}`,
      label: textField(row.customer),
      note: ticketNote(row),
    }));
    return [...people, ...cases];
  }, [traders.data?.users, tickets.data?.tickets]);
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
    const present = presentMarginLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenMargins(readJson(RMG_KEY, []), present);
    const nextReviewed = readReviewedMargins(readJson(RMG_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(RMG_KEY, nextHidden);
    writeJson(RMG_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentMarginLanes(rows);
  const lanes = visibleMarginLanes(present, hidden, showHidden);
  const laneOn = activeMarginLane(lane, present);
  const toneOn = activeMarginTone(tone);
  const shown = visibleMargins(rows, marginLaneArg(laneOn), marginToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = marginState(row.note);
      const token = state === "set" ? marginLane(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return lanes.includes(token);
    });
  reviewRef.current = () => {
    const row = shown[focus];
    if (!row || viewer) return;
    const next = toggleMarginReview(reviewed, row.id);
    setReviewed(next);
    writeJson(RMG_REVIEW_KEY, next);
  };
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setQuery("");
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveQuireFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveQuireFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        reviewRef.current();
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown.length]);
  const lead = leadingMargin(rows);
  const toneLead = leadingMarginTone(rows);
  const shared = sharedMarginCount(rows);
  const stitched = stitchedMarginCount(rows);
  const bars = marginLanes(rows).filter((line) => line.lane);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  const known = rows.filter((row) => marginState(row.note) === "set").length;
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(RMG_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedMargins(next, ids);
    setReviewed(saved);
    writeJson(RMG_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-rmg" aria-label={v4("rmgTitle")} data-margins="1" data-traders={traders.data?.users?.length ? "1" : "0"} data-tickets={tickets.data?.tickets?.length ? "1" : "0"} data-role={role} data-keyed={stitched ? "1" : "0"}>
      <header className="c4-rmg-mast">
        <p className="c4-rmg-seal" data-logo="mono">{v4("rmgLogo")}</p>
        <div>
          <p className="c4-rmg-kicker">{v4("rmgSub")}</p>
          <h2 className="c4-title">{v4("rmgTitle")}</h2>
        </div>
        <ol className="c4-rmg-index" aria-label={v4("rmgTitle")}>
          <li data-tone="gold">{v4("rmgStamp")}</li>
          <li data-tone="ink">{v4("rmgSeal")}</li>
          <li data-tone="ivory">{v4("rmgPorch")}</li>
        </ol>
      </header>
      <p className="c4-rmg-links">
        <Link href={crmv4Href(base, "reports")}>{v4("qirSub")}</Link>
        <Link href={crmv4Href(base, "qire")}>{v4("qirTitle")}</Link>
      </p>
      {viewer && <p className="c4-rmg-note">{v4("rmgViewer")}</p>}
      <p className="c4-rmg-rule">{v4("rmgHint")}</p>
      <ul className="c4-rmg-kpis" aria-label={v4("rmgRules")}>
        <li><span>{v4("rmgSet")}</span><strong>{known}</strong></li>
        <li><span>{v4("rmgClear")}</span><strong>{rows.filter((row) => marginState(row.note) === "clear").length}</strong></li>
        <li><span>{v4("rmgPorch")}</span><strong>{porchCount(rows)}</strong></li>
        <li><span>{v4("rmgAtrium")}</span><strong>{atriumCount(rows)}</strong></li>
        <li><span>{v4("rmgNave")}</span><strong>{naveCount(rows)}</strong></li>
        <li><span>{v4("rmgSeal")}</span><strong>{sealMarginCount(rows)}</strong></li>
        <li><span>{v4("rmgStamp")}</span><strong>{stampMarginCount(rows)}</strong></li>
        <li><span>{v4("rmgGilt")}</span><strong>{giltMarginCount(rows)}</strong></li>
        <li><span>{v4("rmgShare")}</span><strong>{marginShare(stitched, Math.max(1, known))}%</strong></li>
        <li><span>{v4("rmgShared")}</span><strong>{shared}</strong></li>
      </ul>
      <div className="c4-rmg-bars" aria-label={v4("rmgLead")}>
        {bars.map((bar) => (
          <div key={bar.lane} className="c4-rmg-bar" data-lane={bar.lane}>
            <span>{laneLabel(v4, bar.lane)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <p className="c4-rmg-meta">{lead ? `${v4("rmgLead")} ${laneLabel(v4, lead)}` : v4("rmgEmpty")} · {toneLead ? `${v4("rmgToneLead")} ${toneLabel(v4, toneLead)}` : v4("rmgUnmarked")} · {v4("rmgWide")} {rows.filter((row) => wideMargin(row.note)).length}</p>
      <label className="c4-lab"><span>{v4("rmgSearch")}</span><input ref={searchRef} className="c4-field c4-rmg-search" aria-label={v4("rmgSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <div className="c4-row" role="group" aria-label={v4("rmgAll")}>
        <button type="button" className="c4-chip" data-on={laneOn === "all" ? "1" : "0"} onClick={() => setLane("all")}>{v4("rmgAll")}</button>
        {present.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={laneOn === item ? "1" : "0"} onClick={() => setLane(item)}>{laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("rmgGilt")}>
        {(["all", "gilt", "linen", "pale", "ash", "haze"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={toneOn === item ? "1" : "0"} onClick={() => setTone(item)}>{item === "all" ? v4("rmgAll") : toneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("rmgShapeAll")}>
        {(["all", "stitch", "wide", "porch", "stamp", "seal"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>
            {item === "all" ? v4("rmgShapeAll") : item === "stitch" ? v4("rmgShapeStitch") : item === "wide" ? v4("rmgShapeWide") : item === "porch" ? v4("rmgShapePorch") : item === "stamp" ? v4("rmgShapeStamp") : v4("rmgShapeSeal")}
          </button>
        ))}
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview("reviewed")}>{v4("rmgReviewed")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview("fresh")}>{v4("rmgFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} onClick={() => setReview("all")}>{v4("rmgAll")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("rmgShow")}</button>
      </div>
      <div className="c4-row">
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" data-on={hidden.includes(item) ? "1" : "0"} onClick={() => storeHidden(toggleMargin(hidden, item))}>{v4("rmgHide")} {laneLabel(v4, item)}</button>
        ))}
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkMarginReview(reviewed, shown.map((row) => row.id), true))}>{v4("rmgBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkMarginReview(reviewed, shown.map((row) => row.id), false))}>{v4("rmgBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("margin-lanes.csv", marginsCsv(rows))}>{v4("rmgCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("margin-rows.csv", marginRowsCsv(rows, reviewed))}>{v4("rmgRowCsv")}</button>
      </div>
      <p className="c4-rmg-keys">{v4("qirKeys")} {v4("qirEscape")}</p>
      {!shown.length && <p className="c4-rmg-empty">{traders.error || tickets.error ? v4("rmgUnmarked") : v4("rmgEmpty")}</p>}
      <ol className="c4-rmg-list">
        {shown.map((row, index) => (
          <li key={row.id} className="c4-rmg-card" data-on={focus === index ? "1" : "0"} data-lane={marginLane(row.note) || "blank"} data-tone={marginTone(row.note) || "blank"} data-stitch={stitchedMargin(row.note) ? "1" : "0"} data-wide={wideMargin(row.note) ? "1" : "0"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"}>
            <span className="c4-rmg-mark">{marginMark(row.note) || "—"}</span>
            <strong>{row.label || v4("rmgClear")}</strong>
            <span>{laneLabel(v4, marginState(row.note) === "clear" ? "blank" : marginLane(row.note))}</span>
            <span>{toneLabel(v4, marginTone(row.note))}</span>
            <span>{v4("rmgStep")} {marginStep(row.note)}</span>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleMarginReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("rmgReviewed") : v4("rmgReview")}</button>
            <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(marginCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("rmgCopied") : v4("rmgCopy")}</button>
          </li>
        ))}
      </ol>
    </section>
  );
}
