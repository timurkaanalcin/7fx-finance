"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  LNW_DENSITY_KEY,
  LNW_KEY,
  LNW_VIEW_KEY,
  HMK_KEY,
  HMK_REVIEW_KEY,
  activeBay,
  activeGait,
  activeInk,
  activeLeaf,
  activeHourLane,
  activeHourTone,
  activeLintelClerk,
  activeSpine,
  addLintel,
  addLintelTag,
  addLintelView,
  adjacentLintelCount,
  bayArg,
  bayGap,
  bayWidth,
  bulkHourReview,
  bulkLintelArchive,
  bulkLintelGait,
  bulkLintelInk,
  bulkLintelPin,
  bulkLintelTag,
  busiestLintelClerk,
  clashBayCount,
  coolingLintel,
  coolingLintels,
  cycleGait,
  dropLintelView,
  editLintel,
  editLintelNote,
  fairLintelClerk,
  flareLintelLoad,
  gaitArg,
  gaitFocusedLintel,
  giltHourCount,
  holdFocusedLintel,
  houseInk,
  inkArg,
  lateLintel,
  lateLintelShare,
  leafArg,
  leafClashCount,
  leadingHour,
  leadingHourTone,
  hourCopy,
  hourLane,
  hourLaneArg,
  hourLanes,
  hourMark,
  hourRowsCsv,
  hourShare,
  hourState,
  hourStep,
  hourTone,
  hourToneArg,
  hoursCsv,
  matchedLintels,
  moveLintelFocus,
  nextLintel,
  pairLintelCount,
  peakBay,
  pinFocusedLintel,
  porchCount,
  choirCount,
  naveCount,
  presentHourLanes,
  lintelClerkArg,
  lintelClerks,
  lintelCopy,
  lintelCounts,
  lintelDensity,
  lintelIndex,
  lintelInks,
  lintelShare,
  lintelsCsv,
  quietBay,
  quietHallLintels,
  readHiddenHours,
  readLintelViews,
  readLintels,
  readReviewedHours,
  reminderLintels,
  sealFocusedLintel,
  flagHourCount,
  setLintelArchive,
  setLintelHold,
  setLintelPin,
  setLintelSeal,
  setLintelSpine,
  sharedInkCount,
  sharedHourCount,
  snoozeFocusedLintel,
  snoozeLintel,
  sortLintels,
  spineArg,
  spineLoad,
  digitHourCount,
  stitchedHour,
  stitchedHourCount,
  suggestInk,
  suggestLeaf,
  suggestLintelClerk,
  toggleHour,
  toggleHourReview,
  visibleHourLanes,
  visibleHours,
  visibleLintels,
  wideHour,
  type HourReview,
  type HourRow,
  type HourShape,
  type HourValue,
  type LintelDensity,
  type LintelSort,
  type LintelTray,
  type LintelView,
  type ReportLintel,
} from "@/lib/crmv4/round233";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const INKS = ["linen", "wool", "silk"] as const;
const GAITS = ["linger", "stride", "dart"] as const;
const LEAVES = ["12", "24", "48"] as const;
const SPINES = ["1", "5", "9"] as const;
const BAYS = ["1", "2", "3", "4", "5", "6", "7"] as const;

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "lnwAuditSave",
  edit: "lnwAuditEdit",
  note: "lnwAuditNote",
  gait: "lnwAuditGait",
  pin: "lnwAuditPin",
  unpin: "lnwAuditUnpin",
  hold: "lnwAuditHold",
  resume: "lnwAuditResume",
  archive: "lnwAuditArchive",
  open: "lnwAuditOpen",
  ink: "lnwAuditInk",
  tag: "lnwAuditTag",
  spine: "lnwAuditSpine",
  leaf: "lnwAuditLeaf",
  seal: "lnwAuditSeal",
};

type PersonRow = { id?: string; name?: string | null; email?: string | null; saleStatus?: string | null; country?: string | null; role?: string | null };
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
  if (ink === "LINEN" || ink === "linen") return v4("lnwLinen");
  if (ink === "WOOL" || ink === "wool") return v4("lnwWool");
  if (ink === "SILK" || ink === "silk") return v4("lnwSilk");
  return v4("lnwBlankInk");
}

function gaitLabel(v4: V4, gait: string): string {
  if (gait === "linger") return v4("lnwStill");
  if (gait === "stride") return v4("lnwWalk");
  if (gait === "dart") return v4("lnwFlare");
  return v4("lnwBlankGait");
}

function laneLabel(v4: V4, lane: string): string {
  if (lane === "digit") return v4("hmkDigit");
  if (lane === "flag") return v4("hmkFlag");
  if (lane === "choir") return v4("hmkChoir");
  if (lane === "nave") return v4("hmkNave");
  if (lane === "porch") return v4("hmkPorch");
  if (lane === "blank") return v4("hmkClear");
  return v4("hmkUnmarked");
}

function toneLabel(v4: V4, tone: string): string {
  if (tone === "gilt") return v4("hmkGilt");
  if (tone === "wool") return v4("hmkLinen");
  if (tone === "silk") return v4("hmkPale");
  if (tone === "ash") return v4("hmkAsh");
  if (tone === "haze") return v4("hmkHaze");
  return v4("hmkUnmarked");
}

function gapLabel(v4: V4, bay: number | null, desk: string): string {
  const gap = bayGap(bay, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("lnwPast")} ${gap}`;
  if (gap < 0) return `${v4("lnwAhead")} ${Math.abs(gap)}`;
  return v4("lnwDue");
}

export function LintelWatches({ base, v4 }: { base: string; v4: V4 }) {
  const [panels, setPanels] = useState<ReportLintel[]>([]);
  const [views, setViews] = useState<LintelView[]>([]);
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
  const [tray, setTray] = useState<LintelTray>("open");
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
  const [order, setOrder] = useState<LintelSort>("bay");
  const [density, setDensity] = useState<LintelDensity>("airy");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [deskBay, setDeskBay] = useState("");
  const [moveInk, setMoveInk] = useState("silk");
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
    const next = readLintels(readJson(LNW_KEY, []));
    const saved = readLintelViews(readJson(LNW_VIEW_KEY, []));
    setPanels(next);
    setViews(saved);
    setDensity(lintelDensity(readJson(LNW_DENSITY_KEY, "airy")));
    writeJson(LNW_KEY, next);
    writeJson(LNW_VIEW_KEY, saved);
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: ReportLintel[]) {
    const saved = readLintels(next);
    setPanels(saved);
    writeJson(LNW_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((panel) => panel.id === id)));
  }
  function storeViews(next: LintelView[]) {
    const saved = readLintelViews(next);
    setViews(saved);
    writeJson(LNW_VIEW_KEY, saved);
  }
  function storeDensity(next: LintelDensity) {
    setDensity(next);
    writeJson(LNW_DENSITY_KEY, next);
  }
  const clerks = lintelClerks(panels);
  const inks = lintelInks(panels);
  const bars = INKS.map((item) => ({ ink: item.toUpperCase(), count: panels.filter((panel) => panel.ink === item.toUpperCase()).length })).filter((row) => row.count > 0);
  const clerkOn = activeLintelClerk(clerkFilter, clerks);
  const inkOn = activeInk(inkFilter, ["LINEN", "WOOL", "SILK", ...inks]);
  const gaitOn = activeGait(gaitFilter, ["linger", "stride", "dart"]);
  const bayOn = activeBay(bayFilter);
  const leafOn = activeLeaf(leafFilter);
  const spineOn = activeSpine(spineFilter);
  const pickedBay = bayArg(bayOn);
  const shown = sortLintels(visibleLintels(
    panels,
    tray,
    query,
    lintelClerkArg(clerkOn),
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
  const book = lintelIndex(panels, query);
  const counts = lintelCounts(panels, deskBay);
  const share = lateLintelShare(panels, deskBay);
  const matched = matchedLintels(panels, deskBay);
  const clashes = clashBayCount(panels);
  const leaves = leafClashCount(panels);
  const neighbors = adjacentLintelCount(panels);
  const suggestedInk = suggestInk(panels);
  const suggestedName = suggestLintelClerk(panels);
  const suggestedLeaf = suggestLeaf(panels);
  const fair = fairLintelClerk(panels, roster);
  const busy = busiestLintelClerk(panels);
  const reminders = reminderLintels(panels, deskBay);
  const cooling = coolingLintels(panels);
  const nextTitle = nextLintel(panels, deskBay);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  pinRef.current = () => {
    if (!viewer) store(pinFocusedLintel(panels, shown.map((panel) => panel.id), focus));
  };
  leafRef.current = () => {
    if (!viewer) store(snoozeFocusedLintel(panels, shown.map((panel) => panel.id), focus));
  };
  holdRef.current = () => {
    if (!viewer) store(holdFocusedLintel(panels, shown.map((panel) => panel.id), focus));
  };
  gaitRef.current = () => {
    if (!viewer) store(gaitFocusedLintel(panels, shown.map((panel) => panel.id), focus));
  };
  sealRef.current = () => {
    if (!viewer) store(sealFocusedLintel(panels, shown.map((panel) => panel.id), focus));
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
        setFocus((index) => moveLintelFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveLintelFocus(index, shown.length, -1));
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
      if (event.key === "b" || event.key === "B") {
        event.preventDefault();
        leafRef.current();
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        holdRef.current();
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        gaitRef.current();
        return;
      }
      if (event.key === "g" || event.key === "G") {
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
  function saveLintel() {
    if (viewer) return;
    store(addLintel(panels, {
      id: `lnw-${Date.now()}`,
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
  function applyView(view: LintelView) {
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
    <section className="c4-lnw" aria-label={v4("lnwTitle")} data-watches="1" data-role={role} data-board={board} data-density={density}>
      <header className="c4-lnw-mast">
        <p className="c4-lnw-seal" data-logo="mono">{v4("lnwLogo")}</p>
        <div>
          <p className="c4-lnw-kicker">{v4("lnwSub")}</p>
          <h2 className="c4-title">{v4("lnwTitle")}</h2>
        </div>
        <p className="c4-lnw-links">
          <Link href={crmv4Href(base, "day")}>{v4("lnwSub")}</Link>
          <Link href={crmv4Href(base, "hmk")}>{v4("hmkTitle")}</Link>
        </p>
      </header>
      {viewer && <p className="c4-lnw-note">{v4("lnwViewer")}</p>}
      <p className="c4-lnw-rule">{v4("lnwHint")}</p>
      <ul className="c4-lnw-kpis" aria-label={v4("lnwKpi")}>
        <li><span>{v4("lnwOpen")}</span><strong>{counts.open}</strong></li>
        <li><span>{v4("lnwHeld")}</span><strong>{counts.held}</strong></li>
        <li><span>{v4("lnwArchived")}</span><strong>{counts.archived}</strong></li>
        <li><span>{v4("lnwPinned")}</span><strong>{counts.pinned}</strong></li>
        <li><span>{v4("lnwPeak")}</span><strong>{counts.peak}</strong></li>
        <li><span>{v4("lnwLate")}</span><strong>{counts.late}</strong></li>
        <li><span>{v4("lnwSame")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("lnwRaised")}</span><strong>{counts.spine}</strong></li>
        <li><span>{v4("lnwHouse")}</span><strong>{counts.house}</strong></li>
        <li><span>{v4("lnwWindow")}</span><strong>{counts.window}</strong></li>
        <li><span>{v4("lnwMatched")}</span><strong>{matched}</strong></li>
        <li><span>{v4("lnwSeal")}</span><strong>{counts.seal}</strong></li>
        <li><span>{v4("lnwCooling")}</span><strong>{counts.cooling}</strong></li>
      </ul>
      <div className="c4-lnw-bars" aria-label={v4("lnwInks")}>
        {bars.map((bar) => (
          <div key={bar.ink} className="c4-lnw-bar" data-ink={bar.ink.toLowerCase()}>
            <span>{inkLabel(v4, bar.ink)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <p className="c4-lnw-meta">
        {v4("lnwLateShare")} {share}% · {v4("lnwSuggestInk")} {inkLabel(v4, suggestedInk)} · {v4("lnwSuggestLeaf")} {suggestedLeaf} · {v4("lnwSuggestClerk")} {suggestedName || v4("lnwBlankClerk")} · {v4("lnwAssign")} {fair || v4("lnwBlankClerk")} · {busy ? `${v4("lnwBusiest")} ${busy}` : v4("lnwBusiestNone")} · {clashes ? `${v4("lnwClash")} ${clashes}` : v4("lnwClashNone")} · {v4("lnwLeafClash")} {leaves} · {neighbors ? `${v4("lnwNeighbors")} ${neighbors}` : v4("lnwNeighborsNone")} · {v4("lnwLoad")} {spineLoad(panels)} · {v4("lnwPair")} {pairLintelCount(panels)} · {v4("lnwShared")} {sharedInkCount(panels)} · {v4("lnwQuietHall")} {quietHallLintels(panels)} · {v4("lnwFlare")} {flareLintelLoad(panels)} · {v4("lnwBayWidth")} {bayWidth(panels)} · {v4("lnwBays")} {new Set(panels.map((panel) => panel.bay).filter((item) => item !== null)).size} · {nextTitle ? `${v4("lnwNext")} ${nextTitle}` : v4("lnwNextNone")}
      </p>
      <div className="c4-lnw-tools">
        <label className="c4-lab"><span>{v4("lnwTitleField")}</span><input ref={titleRef} className="c4-field" aria-label={v4("lnwTitleField")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("lnwNote")}</span><input className="c4-field" aria-label={v4("lnwNote")} aria-required={false} value={note} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("lnwClerk")}</span><input className="c4-field" aria-label={v4("lnwClerk")} aria-required={false} value={clerk} onChange={(event) => setClerk(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("lnwBay")}</span>
          <select className="c4-select" aria-label={v4("lnwBay")} value={bay} onChange={(event) => setBay(event.target.value)}>
            <option value="">{v4("lnwBlank")}</option>
            {BAYS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("lnwInk")}</span>
          <select className="c4-select" aria-label={v4("lnwInk")} value={ink} onChange={(event) => setInk(event.target.value)}>
            <option value="">{v4("lnwBlankInk")}</option>
            {INKS.map((item) => <option key={item} value={item}>{inkLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("lnwGait")}</span>
          <select className="c4-select" aria-label={v4("lnwGait")} value={gait} onChange={(event) => setGait(event.target.value)}>
            <option value="">{v4("lnwBlankGait")}</option>
            {GAITS.map((item) => <option key={item} value={item}>{gaitLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("lnwLeaf")}</span>
          <select className="c4-select" aria-label={v4("lnwLeaf")} value={leafValue} onChange={(event) => setLeafValue(event.target.value)}>
            <option value="">{v4("lnwBlankLeaf")}</option>
            {LEAVES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("lnwSpine")}</span>
          <select className="c4-select" aria-label={v4("lnwSpine")} value={spine} onChange={(event) => setSpine(event.target.value)}>
            <option value="">{v4("lnwResting")}</option>
            {SPINES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("lnwTag")}</span><input className="c4-field" aria-label={v4("lnwTag")} aria-required={false} value={tag} onChange={(event) => setTag(event.target.value)} /></label>
        <button type="button" className="c4-btn c4-btn-hot" disabled={viewer} onClick={saveLintel}>{v4("lnwAdd")}</button>
      </div>
      <div className="c4-lnw-tools">
        <label className="c4-lab"><span>{v4("lnwDesk")}</span><input className="c4-field" aria-label={v4("lnwDesk")} aria-required={false} value={deskBay} onChange={(event) => setDeskBay(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("lnwRoster")}</span><input className="c4-field" aria-label={v4("lnwRoster")} aria-required={false} value={roster} onChange={(event) => setRoster(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("lnwSearch")}</span><input ref={searchRef} className="c4-field c4-lnw-search" aria-label={v4("lnwSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <button type="button" className="c4-btn" onClick={() => storeDensity(density === "airy" ? "tight" : "airy")}>{density === "airy" ? v4("lnwDensityTight") : v4("lnwDensityAiry")}</button>
        <button type="button" className="c4-btn" data-on={order === "bay" ? "1" : "0"} onClick={() => setOrder("bay")}>{v4("lnwSortBay")}</button>
        <button type="button" className="c4-btn" data-on={order === "clerk" ? "1" : "0"} onClick={() => setOrder("clerk")}>{v4("lnwSortClerk")}</button>
        <button type="button" className="c4-btn" data-on={board === "hall" ? "1" : "0"} onClick={() => setBoard("hall")}>{v4("lnwBoardHall")}</button>
        <button type="button" className="c4-btn" data-on={board === "index" ? "1" : "0"} onClick={() => setBoard("index")}>{v4("lnwBoardIndex")}</button>
        <button type="button" className="c4-btn" onClick={() => download("report-lintels.csv", lintelsCsv(panels, deskBay))}>{v4("lnwCsv")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("lnwOpen")}>
        {(["open", "held", "archived"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("lnwOpen") : item === "held" ? v4("lnwHeld") : v4("lnwArchived")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={flareOnly ? "1" : "0"} onClick={() => setFlareOnly((value) => !value)}>{v4("lnwFlareOnly")}</button>
        <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((value) => !value)}>{v4("lnwPeakOnly")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((value) => !value)}>{v4("lnwQuietOnly")}</button>
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("lnwHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={restingOnly ? "1" : "0"} onClick={() => setRestingOnly((value) => !value)}>{v4("lnwRestingOnly")}</button>
      </div>
      <div className="c4-lnw-tools">
        <label className="c4-lab"><span>{v4("lnwClerk")}</span>
          <select className="c4-select" aria-label={v4("lnwClerk")} value={clerkOn} onChange={(event) => setClerkFilter(event.target.value)}>
            <option value="all">{v4("lnwAll")}</option>
            <option value="blank">{v4("lnwBlankClerk")}</option>
            {clerks.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("lnwInk")}</span>
          <select className="c4-select" aria-label={v4("lnwInk")} value={inkOn} onChange={(event) => setInkFilter(event.target.value)}>
            <option value="all">{v4("lnwAll")}</option>
            <option value="blank">{v4("lnwBlankInk")}</option>
            {INKS.map((item) => <option key={item} value={item.toUpperCase()}>{inkLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("lnwGait")}</span>
          <select className="c4-select" aria-label={v4("lnwGait")} value={gaitOn} onChange={(event) => setGaitFilter(event.target.value)}>
            <option value="all">{v4("lnwAll")}</option>
            <option value="blank">{v4("lnwBlankGait")}</option>
            {GAITS.map((item) => <option key={item} value={item}>{gaitLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("lnwBay")}</span>
          <select className="c4-select" aria-label={v4("lnwBay")} value={bayOn} onChange={(event) => setBayFilter(event.target.value)}>
            <option value="all">{v4("lnwAll")}</option>
            <option value="blank">{v4("lnwBlank")}</option>
            <option value="early">{v4("lnwEarly")}</option>
            <option value="mid">{v4("lnwMid")}</option>
            <option value="late">{v4("lnwLate")}</option>
            <option value="peak">{v4("lnwPeak")}</option>
            <option value="quiet">{v4("lnwQuiet")}</option>
            {BAYS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("lnwLeaf")}</span>
          <select className="c4-select" aria-label={v4("lnwLeaf")} value={leafOn} onChange={(event) => setLeafFilter(event.target.value)}>
            <option value="all">{v4("lnwAll")}</option>
            <option value="blank">{v4("lnwBlankLeaf")}</option>
            {LEAVES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("lnwSpine")}</span>
          <select className="c4-select" aria-label={v4("lnwSpine")} value={spineOn} onChange={(event) => setSpineFilter(event.target.value)}>
            <option value="all">{v4("lnwAll")}</option>
            <option value="blank">{v4("lnwResting")}</option>
            {SPINES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>
      <div className="c4-lnw-tools">
        <label className="c4-lab"><span>{v4("lnwView")}</span><input className="c4-field" aria-label={v4("lnwView")} aria-required={false} value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
          storeViews(addLintelView(views, { id: `view-${Date.now()}`, name: viewName, tray, query, clerk: clerkOn, ink: inkOn, gait: gaitOn, bay: bayOn, leaf: leafOn, spine: spineOn }));
          setViewName("");
        }}>{v4("lnwView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-lnw-view">
            <button type="button" className="c4-chip" onClick={() => applyView(view)}>{v4("lnwApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropLintelView(views, view.id))}>{v4("lnwDropView")}</button>
          </span>
        ))}
      </div>
      <div className="c4-lnw-tools">
        <label className="c4-lab"><span>{v4("lnwBulkInk")}</span>
          <select className="c4-select" aria-label={v4("lnwBulkInk")} value={moveInk} onChange={(event) => setMoveInk(event.target.value)}>
            {INKS.map((item) => <option key={item} value={item}>{inkLabel(v4, item)}</option>)}
          </select>
        </label>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkLintelInk(panels, picked, moveInk))}>{v4("lnwBulkInk")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkLintelPin(panels, picked, true))}>{v4("lnwBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkLintelArchive(panels, picked, true))}>{v4("lnwBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkLintelGait(panels, picked, "dart"))}>{v4("lnwBulkGait")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkLintelTag(panels, picked, "p"))}>{v4("lnwBulkTag")}</button>
      </div>
      <p className="c4-lnw-keys">{v4("lnwKeys")} {v4("lnwEscape")} {v4("lnwBoardKey")} {v4("lnwGaitKey")} {v4("lnwHoldKey")} {v4("lnwSealKey")} {v4("lnwPinKey")} {v4("lnwLeafKey")}</p>
      {!shown.length && board === "hall" && <p className="c4-lnw-empty">{v4("lnwEmpty")}</p>}
      {board === "hall" ? (
        <ol className={`c4-lnw-list ${density === "tight" ? "is-tight" : "is-airy"}`}>
          {shown.map((panel, index) => (
            <li key={panel.id} className="c4-lnw-card" data-on={focus === index ? "1" : "0"} data-ink={panel.ink.toLowerCase() || "blank"} data-late={lateLintel(panel, deskBay) ? "1" : "0"} data-cooling={coolingLintel(panel) ? "1" : "0"} data-peak={peakBay(panel.bay) ? "1" : "0"} data-quiet={quietBay(panel.bay) ? "1" : "0"} data-house={houseInk(panel.ink) ? "1" : "0"}>
              <label className="c4-row">
                <input type="checkbox" checked={picked.includes(panel.id)} aria-label={panel.title} onChange={(event) => setPicked((ids) => event.target.checked ? [...ids, panel.id] : ids.filter((id) => id !== panel.id))} />
                <button type="button" className="c4-btn" data-on={focus === index ? "1" : "0"} onClick={() => setFocus(index)}>{v4("lnwFocus")}</button>
              </label>
              {editing === panel.id ? (
                <label className="c4-lab"><span>{v4("lnwEdit")}</span><input className="c4-field" aria-label={v4("lnwEdit")} value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={() => { if (!viewer) store(editLintel(panels, panel.id, draft)); setEditing(""); }} /></label>
              ) : (
                <h3 className="c4-title">{panel.title}</h3>
              )}
              <p>{panel.clerk || v4("lnwBlankClerk")} · {panel.bay ?? v4("lnwBlank")} · {inkLabel(v4, panel.ink)} · {gaitLabel(v4, panel.gait)} · {panel.leaf ?? v4("lnwBlankLeaf")} · {panel.spine} · {panel.tags.join(" ") || v4("lnwBlank")} · {gapLabel(v4, panel.bay, deskBay)} · {panel.audit ? v4(AUDIT_KEY[panel.audit] || "lnwAuditSave") : ""}</p>
              {editing === `${panel.id}-note` ? (
                <label className="c4-lab"><span>{v4("lnwEditNote")}</span><input className="c4-field" aria-label={v4("lnwEditNote")} aria-required={false} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} onBlur={() => { if (!viewer) store(editLintelNote(panels, panel.id, noteDraft)); setEditing(""); }} /></label>
              ) : <p>{panel.note}</p>}
              <div className="c4-row">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(panel.id); setDraft(panel.title); }}>{v4("lnwEdit")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(`${panel.id}-note`); setNoteDraft(panel.note); }}>{v4("lnwEditNote")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLintelPin(panels, panel.id, !panel.pinned))}>{panel.pinned ? v4("lnwUnpin") : v4("lnwPin")}</button>
                <button type="button" className="c4-btn" disabled={viewer || panel.archived} onClick={() => store(setLintelHold(panels, panel.id, !panel.held))}>{panel.held ? v4("lnwResume") : v4("lnwHold")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLintelArchive(panels, panel.id, !panel.archived))}>{panel.archived ? v4("lnwReopen") : v4("lnwArchive")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleGait(panels, panel.id))}>{v4("lnwGait")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLintelSeal(panels, panel.id, !panel.seal))}>{panel.seal ? v4("lnwUnseal") : v4("lnwSeal")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(snoozeLintel(panels, panel.id))}>{v4("lnwSnooze")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLintelSpine(panels, panel.id, panel.spine === 9 ? "1" : panel.spine === 5 ? "9" : "5"))}>{v4("lnwSpine")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addLintelTag(panels, panel.id, "x"))}>{v4("lnwTag")}</button>
                <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(lintelCopy(panel, deskBay)); setCopied(panel.id); }}>{copied === panel.id ? v4("lnwCopied") : v4("lnwCopy")}</button>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <ol className="c4-lnw-index">
          {!book.length && <li className="c4-lnw-empty">{v4("lnwEmpty")}</li>}
          {book.map((panel) => <li key={panel.id}><span>{panel.bay}</span><strong>{panel.title}</strong><em>{panel.clerk || v4("lnwBlankClerk")}</em></li>)}
        </ol>
      )}
      <aside className="c4-lnw-side" aria-label={v4("lnwReminders")}>
        <h3 className="c4-title">{v4("lnwReminders")}</h3>
        {!reminders.length && <p>{v4("lnwEmpty")}</p>}
        <ul>{reminders.map((panel) => <li key={panel.id}>{panel.title} · {lateLintel(panel, deskBay) ? v4("lnwLate") : v4("lnwSame")}</li>)}</ul>
        <h3 className="c4-title">{v4("lnwCooling")}</h3>
        {!cooling.length && <p>{v4("lnwCoolingEmpty")}</p>}
        <ul>{cooling.map((panel) => <li key={panel.id}>{panel.title}</li>)}</ul>
        {focused && <p>{v4("lnwFocus")} {focused.title} · {lintelShare(counts.house, Math.max(1, counts.open))}%</p>}
      </aside>
    </section>
  );
}

function mailbox(raw: string): string {
  const text = raw.trim();
  const at = text.indexOf("@");
  return at > 0 ? text.slice(0, at) : text;
}

function personNote(row: PersonRow): HourValue {
  const mail = mailbox(textField(row.email));
  return {
    name: mail || textField(row.name),
    language: textField(row.country),
    desk: textField(row.saleStatus),
    role: textField(row.role),
  };
}

function ticketNote(row: TicketRow): HourValue {
  return {
    name: textField(row.customer),
    language: "",
    desk: textField(row.kind),
    role: "",
  };
}

export function HourMarks({ base, v4 }: { base: string; v4: V4 }) {
  const traders = useJson<{ users?: PersonRow[] }>("/api/admin/users?view=table&take=40&meta=0");
  const tickets = useJson<{ tickets?: TicketRow[] }>("/api/admin/tickets?take=20");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("all");
  const [tone, setTone] = useState("all");
  const [review, setReview] = useState<HourReview>("all");
  const [shape, setShape] = useState<HourShape>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const reviewRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  const rows = useMemo<HourRow[]>(() => {
    const people = (traders.data?.users || []).map((row, index) => ({
      id: row.id || `trader-${index}`,
      label: textField(row.name),
      note: personNote(row),
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
    const present = presentHourLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenHours(readJson(HMK_KEY, []), present);
    const nextReviewed = readReviewedHours(readJson(HMK_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(HMK_KEY, nextHidden);
    writeJson(HMK_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentHourLanes(rows);
  const lanes = visibleHourLanes(present, hidden, showHidden);
  const laneOn = activeHourLane(lane, present);
  const toneOn = activeHourTone(tone);
  const shown = visibleHours(rows, hourLaneArg(laneOn), hourToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = hourState(row.note);
      const token = state === "set" ? hourLane(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return lanes.includes(token);
    });
  reviewRef.current = () => {
    const row = shown[focus];
    if (!row || viewer) return;
    const next = toggleHourReview(reviewed, row.id);
    setReviewed(next);
    writeJson(HMK_REVIEW_KEY, next);
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
        setFocus((index) => moveLintelFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveLintelFocus(index, shown.length, -1));
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
  const lead = leadingHour(rows);
  const toneLead = leadingHourTone(rows);
  const shared = sharedHourCount(rows);
  const stitched = stitchedHourCount(rows);
  const bars = hourLanes(rows).filter((line) => line.lane);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  const known = rows.filter((row) => hourState(row.note) === "set").length;
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(HMK_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedHours(next, ids);
    setReviewed(saved);
    writeJson(HMK_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-hmk" aria-label={v4("hmkTitle")} data-hours="1" data-traders={traders.data?.users?.length ? "1" : "0"} data-tickets={tickets.data?.tickets?.length ? "1" : "0"} data-role={role} data-keyed={stitched ? "1" : "0"}>
      <header className="c4-hmk-mast">
        <p className="c4-hmk-seal" data-logo="mono">{v4("hmkLogo")}</p>
        <div>
          <p className="c4-hmk-kicker">{v4("hmkSub")}</p>
          <h2 className="c4-title">{v4("hmkTitle")}</h2>
        </div>
        <ol className="c4-hmk-index" aria-label={v4("hmkTitle")}>
          <li data-tone="gold">{v4("hmkDigit")}</li>
          <li data-tone="ink">{v4("hmkFlag")}</li>
          <li data-tone="wool">{v4("hmkPorch")}</li>
        </ol>
      </header>
      <p className="c4-hmk-links">
        <Link href={crmv4Href(base, "day")}>{v4("lnwSub")}</Link>
        <Link href={crmv4Href(base, "lnw")}>{v4("lnwTitle")}</Link>
        <Link href={crmv4Href(base, "prefs")}>{v4("hmkSub")}</Link>
      </p>
      {viewer && <p className="c4-hmk-note">{v4("hmkViewer")}</p>}
      <p className="c4-hmk-rule">{v4("hmkHint")}</p>
      <ul className="c4-hmk-kpis" aria-label={v4("hmkRules")}>
        <li><span>{v4("hmkSet")}</span><strong>{known}</strong></li>
        <li><span>{v4("hmkClear")}</span><strong>{rows.filter((row) => hourState(row.note) === "clear").length}</strong></li>
        <li><span>{v4("hmkPorch")}</span><strong>{porchCount(rows)}</strong></li>
        <li><span>{v4("hmkChoir")}</span><strong>{choirCount(rows)}</strong></li>
        <li><span>{v4("hmkNave")}</span><strong>{naveCount(rows)}</strong></li>
        <li><span>{v4("hmkFlag")}</span><strong>{flagHourCount(rows)}</strong></li>
        <li><span>{v4("hmkDigit")}</span><strong>{digitHourCount(rows)}</strong></li>
        <li><span>{v4("hmkGilt")}</span><strong>{giltHourCount(rows)}</strong></li>
        <li><span>{v4("hmkShare")}</span><strong>{hourShare(stitched, Math.max(1, known))}%</strong></li>
        <li><span>{v4("hmkShared")}</span><strong>{shared}</strong></li>
      </ul>
      <div className="c4-hmk-bars" aria-label={v4("hmkLead")}>
        {bars.map((bar) => (
          <div key={bar.lane} className="c4-hmk-bar" data-lane={bar.lane}>
            <span>{laneLabel(v4, bar.lane)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <p className="c4-hmk-meta">{lead ? `${v4("hmkLead")} ${laneLabel(v4, lead)}` : v4("hmkEmpty")} · {toneLead ? `${v4("hmkToneLead")} ${toneLabel(v4, toneLead)}` : v4("hmkUnmarked")} · {v4("hmkWide")} {rows.filter((row) => wideHour(row.note)).length}</p>
      <label className="c4-lab"><span>{v4("hmkSearch")}</span><input ref={searchRef} className="c4-field c4-hmk-search" aria-label={v4("hmkSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <div className="c4-row" role="group" aria-label={v4("hmkAll")}>
        <button type="button" className="c4-chip" data-on={laneOn === "all" ? "1" : "0"} onClick={() => setLane("all")}>{v4("hmkAll")}</button>
        {present.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={laneOn === item ? "1" : "0"} onClick={() => setLane(item)}>{laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("hmkGilt")}>
        {(["all", "gilt", "wool", "silk", "ash", "haze"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={toneOn === item ? "1" : "0"} onClick={() => setTone(item)}>{item === "all" ? v4("hmkAll") : toneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("hmkShapeAll")}>
        {(["all", "clasp", "wide", "porch", "digit", "flag"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>
            {item === "all" ? v4("hmkShapeAll") : item === "clasp" ? v4("hmkShapeClasp") : item === "wide" ? v4("hmkShapeWide") : item === "porch" ? v4("hmkShapePorch") : item === "digit" ? v4("hmkShapeDigit") : v4("hmkShapeFlag")}
          </button>
        ))}
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview("reviewed")}>{v4("hmkReviewed")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview("fresh")}>{v4("hmkFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} onClick={() => setReview("all")}>{v4("hmkAll")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("hmkShow")}</button>
      </div>
      <div className="c4-row">
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" data-on={hidden.includes(item) ? "1" : "0"} onClick={() => storeHidden(toggleHour(hidden, item))}>{v4("hmkHide")} {laneLabel(v4, item)}</button>
        ))}
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkHourReview(reviewed, shown.map((row) => row.id), true))}>{v4("hmkBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkHourReview(reviewed, shown.map((row) => row.id), false))}>{v4("hmkBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("hour-lanes.csv", hoursCsv(rows))}>{v4("hmkCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("hour-rows.csv", hourRowsCsv(rows, reviewed))}>{v4("hmkRowCsv")}</button>
      </div>
      <p className="c4-hmk-keys">{v4("lnwKeys")} {v4("lnwEscape")}</p>
      {!shown.length && <p className="c4-hmk-empty">{traders.error || tickets.error ? v4("hmkUnmarked") : v4("hmkEmpty")}</p>}
      <ol className="c4-hmk-list">
        {shown.map((row, index) => (
          <li key={row.id} className="c4-hmk-card" data-on={focus === index ? "1" : "0"} data-lane={hourLane(row.note) || "blank"} data-tone={hourTone(row.note) || "blank"} data-stitch={stitchedHour(row.note) ? "1" : "0"} data-wide={wideHour(row.note) ? "1" : "0"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"}>
            <span className="c4-hmk-mark">{hourMark(row.note) || "—"}</span>
            <strong>{row.label || v4("hmkClear")}</strong>
            <span>{laneLabel(v4, hourState(row.note) === "clear" ? "blank" : hourLane(row.note))}</span>
            <span>{toneLabel(v4, hourTone(row.note))}</span>
            <span>{v4("hmkStep")} {hourStep(row.note)}</span>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleHourReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("hmkReviewed") : v4("hmkReview")}</button>
            <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(hourCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("hmkCopied") : v4("hmkCopy")}</button>
          </li>
        ))}
      </ol>
    </section>
  );
}
