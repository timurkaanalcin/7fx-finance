"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  SMK_KEY,
  SMK_REVIEW_KEY,
  VCD_DENSITY_KEY,
  VCD_KEY,
  VCD_VIEW_KEY,
  activeCall,
  activeMarkLane,
  activeMarkTone,
  activePace,
  activeRank,
  activeSlot,
  activeTimber,
  activeVisitHost,
  addVisit,
  addVisitTag,
  addVisitView,
  adjacentVisitCount,
  bulkMarkReview,
  bulkVisitArchive,
  bulkVisitPace,
  bulkVisitPin,
  bulkVisitTag,
  bulkVisitTimber,
  busiestVisitHost,
  callArg,
  callClashCount,
  clashSlotCount,
  closedMarkCount,
  coolingVisit,
  coolingVisits,
  cyclePace,
  dropVisitView,
  editVisit,
  editVisitNote,
  fairVisitHost,
  freshMarkCount,
  glyphMarkCount,
  giltMarkCount,
  hallMarkCount,
  holdFocusedVisit,
  houseTimber,
  joinedMark,
  joinedMarkCount,
  keptMarkCount,
  lateVisit,
  lateVisitShare,
  leadingMark,
  leadingMarkTone,
  markCopy,
  markLane,
  markLaneArg,
  markLanes,
  markRowsCsv,
  markShare,
  markSigil,
  markState,
  markStep,
  markTone,
  markToneArg,
  marksCsv,
  matchedVisits,
  moveVisitFocus,
  nextVisit,
  paceArg,
  paceFocusedVisit,
  pairVisitCount,
  peakSlot,
  pinFocusedVisit,
  presentMarkLanes,
  quietHallVisits,
  quietSlot,
  rankArg,
  rankLoad,
  readHiddenMarks,
  readReviewedMarks,
  readVisitViews,
  readVisits,
  reminderVisits,
  returnMarkCount,
  rushVisitLoad,
  setVisitArchive,
  setVisitHold,
  setVisitPin,
  setVisitRank,
  setVisitSeal,
  sharedMarkCount,
  sharedTimberCount,
  slotArg,
  slotGap,
  slotWidth,
  snoozeFocusedVisit,
  snoozeVisit,
  sortVisits,
  suggestCall,
  suggestTimber,
  suggestVisitHost,
  timberArg,
  toggleMark,
  toggleMarkReview,
  visitCopy,
  visitCounts,
  visitDensity,
  visitHostArg,
  visitHosts,
  visitIndex,
  visitShare,
  visitTimbers,
  visitsCsv,
  visibleMarkLanes,
  visibleMarks,
  visibleVisits,
  waxFocusedVisit,
  wideMark,
  type MarkReview,
  type MarkRow,
  type MarkShape,
  type MarkValue,
  type VisitCard,
  type VisitDensity,
  type VisitSort,
  type VisitTray,
  type VisitView,
} from "@/lib/crmv4/round235";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const TIMBERS = ["oak", "ash", "walnut"] as const;
const PACES = ["hush", "stride", "rush"] as const;
const CALLS = ["4", "12", "36"] as const;
const RANKS = ["1", "4", "7"] as const;
const SLOTS = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "vcdAuditSave",
  edit: "vcdAuditEdit",
  note: "vcdAuditNote",
  pace: "vcdAuditPace",
  pin: "vcdAuditPin",
  unpin: "vcdAuditUnpin",
  hold: "vcdAuditHold",
  resume: "vcdAuditResume",
  archive: "vcdAuditArchive",
  open: "vcdAuditOpen",
  timber: "vcdAuditTimber",
  tag: "vcdAuditTag",
  rank: "vcdAuditRank",
  call: "vcdAuditCall",
  seal: "vcdAuditSeal",
};

type LeadRow = { id?: string; name?: string | null; saleStatus?: string | null; campaign?: string | null; affiliateA?: string | null };

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

function timberLabel(v4: V4, timber: string): string {
  if (timber === "OAK" || timber === "oak") return v4("vcdOak");
  if (timber === "ASH" || timber === "ash") return v4("vcdAsh");
  if (timber === "WALNUT" || timber === "walnut") return v4("vcdWalnut");
  return v4("vcdBlankTimber");
}

function paceLabel(v4: V4, pace: string): string {
  if (pace === "hush") return v4("vcdHush");
  if (pace === "stride") return v4("vcdStride");
  if (pace === "rush") return v4("vcdRush");
  return v4("vcdBlankPace");
}

function laneLabel(v4: V4, lane: string): string {
  if (lane === "glyph") return v4("smkGlyph");
  if (lane === "kept") return v4("smkKept");
  if (lane === "return") return v4("smkReturn");
  if (lane === "fresh") return v4("smkFresh");
  if (lane === "closed") return v4("smkClosed");
  if (lane === "hall") return v4("smkHall");
  if (lane === "blank") return v4("smkClear");
  return v4("smkUnmarked");
}

function toneLabel(v4: V4, tone: string): string {
  if (tone === "gilt") return v4("smkGilt");
  if (tone === "pale") return v4("smkPale");
  if (tone === "linen") return v4("smkLinen");
  if (tone === "ash") return v4("smkAsh");
  if (tone === "haze") return v4("smkHaze");
  return v4("smkUnmarked");
}

function gapLabel(v4: V4, slot: number | null, desk: string): string {
  const gap = slotGap(slot, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("vcdPast")} ${gap}`;
  if (gap < 0) return `${v4("vcdAhead")} ${Math.abs(gap)}`;
  return v4("vcdDue");
}

export function VisitCards({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<VisitCard[]>([]);
  const [views, setViews] = useState<VisitView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [host, setHost] = useState("");
  const [slot, setSlot] = useState("");
  const [timber, setTimber] = useState("");
  const [pace, setPace] = useState("");
  const [callValue, setCallValue] = useState("");
  const [rank, setRank] = useState("");
  const [tag, setTag] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<VisitTray>("open");
  const [hostFilter, setHostFilter] = useState("all");
  const [timberFilter, setTimberFilter] = useState("all");
  const [paceFilter, setPaceFilter] = useState("all");
  const [slotFilter, setSlotFilter] = useState("all");
  const [callFilter, setCallFilter] = useState("all");
  const [rankFilter, setRankFilter] = useState("all");
  const [rushOnly, setRushOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [restingOnly, setRestingOnly] = useState(false);
  const [board, setBoard] = useState<"hall" | "index">("hall");
  const [order, setOrder] = useState<VisitSort>("slot");
  const [density, setDensity] = useState<VisitDensity>("airy");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [deskSlot, setDeskSlot] = useState("");
  const [moveTimber, setMoveTimber] = useState("walnut");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<() => void>(() => {});
  const callRef = useRef<() => void>(() => {});
  const holdRef = useRef<() => void>(() => {});
  const paceRef = useRef<() => void>(() => {});
  const sealRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readVisits(readJson(VCD_KEY, []));
    const saved = readVisitViews(readJson(VCD_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    setDensity(visitDensity(readJson(VCD_DENSITY_KEY, "airy")));
    writeJson(VCD_KEY, next);
    writeJson(VCD_VIEW_KEY, saved);
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: VisitCard[]) {
    const saved = readVisits(next);
    setCards(saved);
    writeJson(VCD_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((card) => card.id === id)));
  }
  function storeViews(next: VisitView[]) {
    const saved = readVisitViews(next);
    setViews(saved);
    writeJson(VCD_VIEW_KEY, saved);
  }
  function storeDensity(next: VisitDensity) {
    setDensity(next);
    writeJson(VCD_DENSITY_KEY, next);
  }
  const hosts = visitHosts(cards);
  const timbers = visitTimbers(cards);
  const bars = TIMBERS.map((item) => ({ timber: item.toUpperCase(), count: cards.filter((card) => card.timber === item.toUpperCase()).length })).filter((row) => row.count > 0);
  const hostOn = activeVisitHost(hostFilter, hosts);
  const timberOn = activeTimber(timberFilter, ["OAK", "ASH", "WALNUT", ...timbers]);
  const paceOn = activePace(paceFilter, ["hush", "stride", "rush"]);
  const slotOn = activeSlot(slotFilter);
  const callOn = activeCall(callFilter);
  const rankOn = activeRank(rankFilter);
  const pickedSlot = slotArg(slotOn);
  const shown = sortVisits(visibleVisits(
    cards,
    tray,
    query,
    visitHostArg(hostOn),
    timberArg(timberOn),
    paceArg(paceOn),
    pickedSlot.exact,
    pickedSlot.pick,
    callArg(callOn),
    rankArg(rankOn),
    rushOnly,
    peakOnly,
    houseOnly,
    quietOnly,
    restingOnly,
  ), order);
  const book = visitIndex(cards, query);
  const counts = visitCounts(cards, deskSlot);
  const share = lateVisitShare(cards, deskSlot);
  const matched = matchedVisits(cards, deskSlot);
  const clashes = clashSlotCount(cards);
  const calls = callClashCount(cards);
  const neighbors = adjacentVisitCount(cards);
  const suggestedTimber = suggestTimber(cards);
  const suggestedName = suggestVisitHost(cards);
  const suggestedCall = suggestCall(cards);
  const fair = fairVisitHost(cards, roster);
  const busy = busiestVisitHost(cards);
  const reminders = reminderVisits(cards, deskSlot);
  const cooling = coolingVisits(cards);
  const nextTitle = nextVisit(cards, deskSlot);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  pinRef.current = () => {
    if (!viewer) store(pinFocusedVisit(cards, shown.map((card) => card.id), focus));
  };
  callRef.current = () => {
    if (!viewer) store(snoozeFocusedVisit(cards, shown.map((card) => card.id), focus));
  };
  holdRef.current = () => {
    if (!viewer) store(holdFocusedVisit(cards, shown.map((card) => card.id), focus));
  };
  paceRef.current = () => {
    if (!viewer) store(paceFocusedVisit(cards, shown.map((card) => card.id), focus));
  };
  sealRef.current = () => {
    if (!viewer) store(waxFocusedVisit(cards, shown.map((card) => card.id), focus));
  };
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setTitle("");
        setNote("");
        setHost("");
        setSlot("");
        setTimber("");
        setPace("");
        setCallValue("");
        setRank("");
        setTag("");
        setQuery("");
        setEditing("");
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveVisitFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveVisitFocus(index, shown.length, -1));
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
        callRef.current();
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        holdRef.current();
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        paceRef.current();
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
  function saveVisit() {
    if (viewer) return;
    store(addVisit(cards, {
      id: `vcd-${Date.now()}`,
      title,
      note,
      host,
      slot,
      timber,
      pace,
      call: callValue,
      rank,
      tags: tag,
    }));
    setTitle("");
    setNote("");
    setTag("");
  }
  function applyView(view: VisitView) {
    setTray(view.tray);
    setQuery(view.query);
    setHostFilter(view.host || "all");
    setTimberFilter(view.timber || "all");
    setPaceFilter(view.pace || "all");
    setSlotFilter(view.slot || "all");
    setCallFilter(view.call || "all");
    setRankFilter(view.rank || "all");
  }
  const focused = shown[focus];
  return (
    <section className="c4-vcd" aria-label={v4("vcdTitle")} data-visits="1" data-desk="chapter" data-role={role} data-board={board} data-density={density}>
      <header className="c4-vcd-mast">
        <p className="c4-vcd-seal" data-logo="mono">{v4("vcdLogo")}</p>
        <div>
          <p className="c4-vcd-kicker">{v4("vcdSub")}</p>
          <h2 className="c4-title">{v4("vcdTitle")}</h2>
        </div>
        <p className="c4-vcd-links">
          <Link href={crmv4Href(base, "leads")}>{v4("vcdSub")}</Link>
          <Link href={crmv4Href(base, "smk")}>{v4("smkTitle")}</Link>
        </p>
      </header>
      {viewer && <p className="c4-vcd-note">{v4("vcdViewer")}</p>}
      <p className="c4-vcd-rule">{v4("vcdHint")}</p>
      <ul className="c4-vcd-kpis" aria-label={v4("vcdKpi")}>
        <li><span>{v4("vcdOpen")}</span><strong>{counts.open}</strong></li>
        <li><span>{v4("vcdHeld")}</span><strong>{counts.held}</strong></li>
        <li><span>{v4("vcdArchived")}</span><strong>{counts.archived}</strong></li>
        <li><span>{v4("vcdPinned")}</span><strong>{counts.pinned}</strong></li>
        <li><span>{v4("vcdPeak")}</span><strong>{counts.peak}</strong></li>
        <li><span>{v4("vcdLate")}</span><strong>{counts.late}</strong></li>
        <li><span>{v4("vcdSame")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("vcdRaised")}</span><strong>{counts.rank}</strong></li>
        <li><span>{v4("vcdHouse")}</span><strong>{counts.house}</strong></li>
        <li><span>{v4("vcdWindow")}</span><strong>{counts.window}</strong></li>
        <li><span>{v4("vcdMatched")}</span><strong>{matched}</strong></li>
        <li><span>{v4("vcdSeal")}</span><strong>{counts.seal}</strong></li>
        <li><span>{v4("vcdCooling")}</span><strong>{counts.cooling}</strong></li>
      </ul>
      <div className="c4-vcd-bars" aria-label={v4("vcdTimbers")}>
        {bars.map((bar) => (
          <div key={bar.timber} className="c4-vcd-bar" data-timber={bar.timber.toLowerCase()}>
            <span>{timberLabel(v4, bar.timber)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <p className="c4-vcd-meta">
        {v4("vcdLateShare")} {share}% · {v4("vcdSuggestTimber")} {timberLabel(v4, suggestedTimber)} · {v4("vcdSuggestCall")} {suggestedCall} · {v4("vcdSuggestHost")} {suggestedName || v4("vcdBlankHost")} · {v4("vcdAssign")} {fair || v4("vcdBlankHost")} · {busy ? `${v4("vcdBusiest")} ${busy}` : v4("vcdBusiestNone")} · {clashes ? `${v4("vcdClash")} ${clashes}` : v4("vcdClashNone")} · {v4("vcdCallClash")} {calls} · {neighbors ? `${v4("vcdNeighbors")} ${neighbors}` : v4("vcdNeighborsNone")} · {v4("vcdLoad")} {rankLoad(cards)} · {v4("vcdPair")} {pairVisitCount(cards)} · {v4("vcdShared")} {sharedTimberCount(cards)} · {v4("vcdQuietHall")} {quietHallVisits(cards)} · {v4("vcdRush")} {rushVisitLoad(cards)} · {v4("vcdSlotWidth")} {slotWidth(cards)} · {v4("vcdSlots")} {new Set(cards.map((card) => card.slot).filter((item) => item !== null)).size} · {nextTitle ? `${v4("vcdNext")} ${nextTitle}` : v4("vcdNextNone")}
      </p>
      <div className="c4-vcd-tools">
        <label className="c4-lab"><span>{v4("vcdTitleField")}</span><input ref={titleRef} className="c4-field" aria-label={v4("vcdTitleField")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("vcdNote")}</span><input className="c4-field" aria-label={v4("vcdNote")} aria-required={false} value={note} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("vcdHost")}</span><input className="c4-field" aria-label={v4("vcdHost")} aria-required={false} value={host} onChange={(event) => setHost(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("vcdSlot")}</span>
          <select className="c4-select" aria-label={v4("vcdSlot")} value={slot} onChange={(event) => setSlot(event.target.value)}>
            <option value="">{v4("vcdBlank")}</option>
            {SLOTS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("vcdTimber")}</span>
          <select className="c4-select" aria-label={v4("vcdTimber")} value={timber} onChange={(event) => setTimber(event.target.value)}>
            <option value="">{v4("vcdBlankTimber")}</option>
            {TIMBERS.map((item) => <option key={item} value={item}>{timberLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("vcdPace")}</span>
          <select className="c4-select" aria-label={v4("vcdPace")} value={pace} onChange={(event) => setPace(event.target.value)}>
            <option value="">{v4("vcdBlankPace")}</option>
            {PACES.map((item) => <option key={item} value={item}>{paceLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("vcdCall")}</span>
          <select className="c4-select" aria-label={v4("vcdCall")} value={callValue} onChange={(event) => setCallValue(event.target.value)}>
            <option value="">{v4("vcdBlankCall")}</option>
            {CALLS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("vcdRank")}</span>
          <select className="c4-select" aria-label={v4("vcdRank")} value={rank} onChange={(event) => setRank(event.target.value)}>
            <option value="">{v4("vcdResting")}</option>
            {RANKS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("vcdTag")}</span><input className="c4-field" aria-label={v4("vcdTag")} aria-required={false} value={tag} onChange={(event) => setTag(event.target.value)} /></label>
        <button type="button" className="c4-btn c4-btn-hot" disabled={viewer} onClick={saveVisit}>{v4("vcdAdd")}</button>
      </div>
      <div className="c4-vcd-tools">
        <label className="c4-lab"><span>{v4("vcdDesk")}</span><input className="c4-field" aria-label={v4("vcdDesk")} aria-required={false} value={deskSlot} onChange={(event) => setDeskSlot(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("vcdRoster")}</span><input className="c4-field" aria-label={v4("vcdRoster")} aria-required={false} value={roster} onChange={(event) => setRoster(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("vcdSearch")}</span><input ref={searchRef} className="c4-field c4-vcd-search" aria-label={v4("vcdSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <button type="button" className="c4-btn" onClick={() => storeDensity(density === "airy" ? "tight" : "airy")}>{density === "airy" ? v4("vcdDensityTight") : v4("vcdDensityAiry")}</button>
        <button type="button" className="c4-btn" data-on={order === "slot" ? "1" : "0"} onClick={() => setOrder("slot")}>{v4("vcdSortSlot")}</button>
        <button type="button" className="c4-btn" data-on={order === "host" ? "1" : "0"} onClick={() => setOrder("host")}>{v4("vcdSortHost")}</button>
        <button type="button" className="c4-btn" data-on={board === "hall" ? "1" : "0"} onClick={() => setBoard("hall")}>{v4("vcdBoardHall")}</button>
        <button type="button" className="c4-btn" data-on={board === "index" ? "1" : "0"} onClick={() => setBoard("index")}>{v4("vcdBoardIndex")}</button>
        <button type="button" className="c4-btn" onClick={() => download("visit-cards.csv", visitsCsv(cards, deskSlot))}>{v4("vcdCsv")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("vcdOpen")}>
        {(["open", "held", "archived"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("vcdOpen") : item === "held" ? v4("vcdHeld") : v4("vcdArchived")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={rushOnly ? "1" : "0"} onClick={() => setRushOnly((value) => !value)}>{v4("vcdRushOnly")}</button>
        <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((value) => !value)}>{v4("vcdPeakOnly")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((value) => !value)}>{v4("vcdQuietOnly")}</button>
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("vcdHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={restingOnly ? "1" : "0"} onClick={() => setRestingOnly((value) => !value)}>{v4("vcdRestingOnly")}</button>
      </div>
      <div className="c4-vcd-tools">
        <label className="c4-lab"><span>{v4("vcdHost")}</span>
          <select className="c4-select" aria-label={v4("vcdHost")} value={hostOn} onChange={(event) => setHostFilter(event.target.value)}>
            <option value="all">{v4("vcdAll")}</option>
            <option value="blank">{v4("vcdBlankHost")}</option>
            {hosts.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("vcdTimber")}</span>
          <select className="c4-select" aria-label={v4("vcdTimber")} value={timberOn} onChange={(event) => setTimberFilter(event.target.value)}>
            <option value="all">{v4("vcdAll")}</option>
            <option value="blank">{v4("vcdBlankTimber")}</option>
            {TIMBERS.map((item) => <option key={item} value={item.toUpperCase()}>{timberLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("vcdPace")}</span>
          <select className="c4-select" aria-label={v4("vcdPace")} value={paceOn} onChange={(event) => setPaceFilter(event.target.value)}>
            <option value="all">{v4("vcdAll")}</option>
            <option value="blank">{v4("vcdBlankPace")}</option>
            {PACES.map((item) => <option key={item} value={item}>{paceLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("vcdSlot")}</span>
          <select className="c4-select" aria-label={v4("vcdSlot")} value={slotOn} onChange={(event) => setSlotFilter(event.target.value)}>
            <option value="all">{v4("vcdAll")}</option>
            <option value="blank">{v4("vcdBlank")}</option>
            <option value="early">{v4("vcdEarly")}</option>
            <option value="mid">{v4("vcdMid")}</option>
            <option value="late">{v4("vcdLate")}</option>
            <option value="peak">{v4("vcdPeak")}</option>
            <option value="quiet">{v4("vcdQuiet")}</option>
            {SLOTS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("vcdCall")}</span>
          <select className="c4-select" aria-label={v4("vcdCall")} value={callOn} onChange={(event) => setCallFilter(event.target.value)}>
            <option value="all">{v4("vcdAll")}</option>
            <option value="blank">{v4("vcdBlankCall")}</option>
            {CALLS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("vcdRank")}</span>
          <select className="c4-select" aria-label={v4("vcdRank")} value={rankOn} onChange={(event) => setRankFilter(event.target.value)}>
            <option value="all">{v4("vcdAll")}</option>
            <option value="blank">{v4("vcdResting")}</option>
            {RANKS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>
      <div className="c4-vcd-tools">
        <label className="c4-lab"><span>{v4("vcdView")}</span><input className="c4-field" aria-label={v4("vcdView")} aria-required={false} value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
          storeViews(addVisitView(views, { id: `view-${Date.now()}`, name: viewName, tray, query, host: hostOn, timber: timberOn, pace: paceOn, slot: slotOn, call: callOn, rank: rankOn }));
          setViewName("");
        }}>{v4("vcdView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-vcd-view">
            <button type="button" className="c4-chip" onClick={() => applyView(view)}>{v4("vcdApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropVisitView(views, view.id))}>{v4("vcdDropView")}</button>
          </span>
        ))}
      </div>
      <div className="c4-vcd-tools">
        <label className="c4-lab"><span>{v4("vcdBulkTimber")}</span>
          <select className="c4-select" aria-label={v4("vcdBulkTimber")} value={moveTimber} onChange={(event) => setMoveTimber(event.target.value)}>
            {TIMBERS.map((item) => <option key={item} value={item}>{timberLabel(v4, item)}</option>)}
          </select>
        </label>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkVisitTimber(cards, picked, moveTimber))}>{v4("vcdBulkTimber")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkVisitPin(cards, picked, true))}>{v4("vcdBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkVisitArchive(cards, picked, true))}>{v4("vcdBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkVisitPace(cards, picked, "rush"))}>{v4("vcdBulkPace")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkVisitTag(cards, picked, "a"))}>{v4("vcdBulkTag")}</button>
      </div>
      <p className="c4-vcd-keys">{v4("vcdKeys")} {v4("vcdEscape")} {v4("vcdBoardKey")} {v4("vcdPaceKey")} {v4("vcdHoldKey")} {v4("vcdSealKey")} {v4("vcdPinKey")} {v4("vcdCallKey")}</p>
      {!shown.length && board === "hall" && <p className="c4-vcd-empty">{v4("vcdEmpty")}</p>}
      {board === "hall" ? (
        <ol className={`c4-vcd-list ${density === "tight" ? "is-tight" : "is-airy"}`}>
          {shown.map((card, index) => (
            <li key={card.id} className="c4-vcd-card" data-on={focus === index ? "1" : "0"} data-timber={card.timber.toLowerCase() || "blank"} data-late={lateVisit(card, deskSlot) ? "1" : "0"} data-cooling={coolingVisit(card) ? "1" : "0"} data-peak={peakSlot(card.slot) ? "1" : "0"} data-quiet={quietSlot(card.slot) ? "1" : "0"} data-house={houseTimber(card.timber) ? "1" : "0"}>
              <label className="c4-row">
                <input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={(event) => setPicked((ids) => event.target.checked ? [...ids, card.id] : ids.filter((id) => id !== card.id))} />
                <button type="button" className="c4-btn" data-on={focus === index ? "1" : "0"} onClick={() => setFocus(index)}>{v4("vcdFocus")}</button>
              </label>
              {editing === card.id ? (
                <label className="c4-lab"><span>{v4("vcdEdit")}</span><input className="c4-field" aria-label={v4("vcdEdit")} value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={() => { if (!viewer) store(editVisit(cards, card.id, draft)); setEditing(""); }} /></label>
              ) : (
                <h3 className="c4-title">{card.title}</h3>
              )}
              <p>{card.host || v4("vcdBlankHost")} · {card.slot ?? v4("vcdBlank")} · {timberLabel(v4, card.timber)} · {paceLabel(v4, card.pace)} · {card.call ?? v4("vcdBlankCall")} · {card.rank} · {card.tags.join(" ") || v4("vcdBlank")} · {gapLabel(v4, card.slot, deskSlot)} · {card.audit ? v4(AUDIT_KEY[card.audit] || "vcdAuditSave") : ""}</p>
              {editing === `${card.id}-note` ? (
                <label className="c4-lab"><span>{v4("vcdEditNote")}</span><input className="c4-field" aria-label={v4("vcdEditNote")} aria-required={false} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} onBlur={() => { if (!viewer) store(editVisitNote(cards, card.id, noteDraft)); setEditing(""); }} /></label>
              ) : <p>{card.note}</p>}
              <div className="c4-row">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("vcdEdit")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(`${card.id}-note`); setNoteDraft(card.note); }}>{v4("vcdEditNote")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setVisitPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("vcdUnpin") : v4("vcdPin")}</button>
                <button type="button" className="c4-btn" disabled={viewer || card.archived} onClick={() => store(setVisitHold(cards, card.id, !card.held))}>{card.held ? v4("vcdResume") : v4("vcdHold")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setVisitArchive(cards, card.id, !card.archived))}>{card.archived ? v4("vcdReopen") : v4("vcdArchive")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cyclePace(cards, card.id))}>{v4("vcdPace")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setVisitSeal(cards, card.id, !card.seal))}>{card.seal ? v4("vcdUnseal") : v4("vcdSeal")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(snoozeVisit(cards, card.id))}>{v4("vcdSnooze")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setVisitRank(cards, card.id, card.rank === 7 ? "1" : card.rank === 4 ? "7" : "4"))}>{v4("vcdRank")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addVisitTag(cards, card.id, "a"))}>{v4("vcdTag")}</button>
                <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(visitCopy(card, deskSlot)); setCopied(card.id); }}>{copied === card.id ? v4("vcdCopied") : v4("vcdCopy")}</button>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <ol className="c4-vcd-index">
          {!book.length && <li className="c4-vcd-empty">{v4("vcdEmpty")}</li>}
          {book.map((card) => <li key={card.id}><span>{card.slot}</span><strong>{card.title}</strong><em>{card.host || v4("vcdBlankHost")}</em></li>)}
        </ol>
      )}
      <aside className="c4-vcd-side" aria-label={v4("vcdReminders")}>
        <h3 className="c4-title">{v4("vcdReminders")}</h3>
        {!reminders.length && <p>{v4("vcdEmpty")}</p>}
        <ul>{reminders.map((card) => <li key={card.id}>{card.title} · {lateVisit(card, deskSlot) ? v4("vcdLate") : v4("vcdSame")}</li>)}</ul>
        <h3 className="c4-title">{v4("vcdCooling")}</h3>
        {!cooling.length && <p>{v4("vcdCoolingEmpty")}</p>}
        <ul>{cooling.map((card) => <li key={card.id}>{card.title}</li>)}</ul>
        {focused && <p>{v4("vcdFocus")} {focused.title} · {visitShare(counts.house, Math.max(1, counts.open))}%</p>}
      </aside>
    </section>
  );
}

function leadNote(row: LeadRow): MarkValue {
  const campaign = textField(row.campaign);
  const partner = textField(row.affiliateA);
  return {
    name: textField(row.name),
    stage: textField(row.saleStatus),
    source: campaign || partner,
  };
}

export function StageMarks({ base, v4 }: { base: string; v4: V4 }) {
  const leads = useJson<{ users?: LeadRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("all");
  const [tone, setTone] = useState("all");
  const [review, setReview] = useState<MarkReview>("all");
  const [shape, setShape] = useState<MarkShape>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const reviewRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  const rows = useMemo<MarkRow[]>(() => {
    return (leads.data?.users || []).map((row, index) => ({
      id: row.id ? `lead-${row.id}` : `lead-${index}`,
      label: textField(row.name),
      note: leadNote(row),
    }));
  }, [leads.data?.users]);
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
    const present = presentMarkLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenMarks(readJson(SMK_KEY, []), present);
    const nextReviewed = readReviewedMarks(readJson(SMK_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(SMK_KEY, nextHidden);
    writeJson(SMK_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentMarkLanes(rows);
  const lanes = visibleMarkLanes(present, hidden, showHidden);
  const laneOn = activeMarkLane(lane, present);
  const toneOn = activeMarkTone(tone);
  const shown = visibleMarks(rows, markLaneArg(laneOn), markToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = markState(row.note);
      const token = state === "set" ? markLane(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return lanes.includes(token);
    });
  reviewRef.current = () => {
    const row = shown[focus];
    if (!row || viewer) return;
    const next = toggleMarkReview(reviewed, row.id);
    setReviewed(next);
    writeJson(SMK_REVIEW_KEY, next);
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
        setFocus((index) => moveVisitFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveVisitFocus(index, shown.length, -1));
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
  const lead = leadingMark(rows);
  const toneLead = leadingMarkTone(rows);
  const shared = sharedMarkCount(rows);
  const joined = joinedMarkCount(rows);
  const bars = markLanes(rows).filter((line) => line.lane);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  const known = rows.filter((row) => markState(row.note) === "set").length;
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(SMK_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedMarks(next, ids);
    setReviewed(saved);
    writeJson(SMK_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-smk" aria-label={v4("smkTitle")} data-marks="1" data-desk="chapter" data-leads={leads.data?.users?.length ? "1" : "0"} data-role={role} data-keyed={joined ? "1" : "0"}>
      <header className="c4-smk-mast">
        <p className="c4-smk-seal" data-logo="mono">{v4("smkLogo")}</p>
        <div>
          <p className="c4-smk-kicker">{v4("smkSub")}</p>
          <h2 className="c4-title">{v4("smkTitle")}</h2>
        </div>
        <ol className="c4-smk-index" aria-label={v4("smkTitle")}>
          <li data-tone="gold">{v4("smkGlyph")}</li>
          <li data-tone="ink">{v4("smkKept")}</li>
          <li data-tone="wool">{v4("smkHall")}</li>
        </ol>
      </header>
      <p className="c4-smk-links">
        <Link href={crmv4Href(base, "leads")}>{v4("vcdSub")}</Link>
        <Link href={crmv4Href(base, "vcd")}>{v4("vcdTitle")}</Link>
        <Link href={crmv4Href(base, "health")}>{v4("smkSub")}</Link>
      </p>
      {viewer && <p className="c4-smk-note">{v4("smkViewer")}</p>}
      <p className="c4-smk-rule">{v4("smkHint")}</p>
      <ul className="c4-smk-kpis" aria-label={v4("smkRules")}>
        <li><span>{v4("smkSet")}</span><strong>{known}</strong></li>
        <li><span>{v4("smkClear")}</span><strong>{rows.filter((row) => markState(row.note) === "clear").length}</strong></li>
        <li><span>{v4("smkHall")}</span><strong>{hallMarkCount(rows)}</strong></li>
        <li><span>{v4("smkFresh")}</span><strong>{freshMarkCount(rows)}</strong></li>
        <li><span>{v4("smkReturn")}</span><strong>{returnMarkCount(rows)}</strong></li>
        <li><span>{v4("smkKept")}</span><strong>{keptMarkCount(rows)}</strong></li>
        <li><span>{v4("smkClosed")}</span><strong>{closedMarkCount(rows)}</strong></li>
        <li><span>{v4("smkGlyph")}</span><strong>{glyphMarkCount(rows)}</strong></li>
        <li><span>{v4("smkGilt")}</span><strong>{giltMarkCount(rows)}</strong></li>
        <li><span>{v4("smkShare")}</span><strong>{markShare(joined, Math.max(1, known))}%</strong></li>
        <li><span>{v4("smkShared")}</span><strong>{shared}</strong></li>
      </ul>
      <div className="c4-smk-bars" aria-label={v4("smkLead")}>
        {bars.map((bar) => (
          <div key={bar.lane} className="c4-smk-bar" data-lane={bar.lane}>
            <span>{laneLabel(v4, bar.lane)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <p className="c4-smk-meta">{lead ? `${v4("smkLead")} ${laneLabel(v4, lead)}` : v4("smkEmpty")} · {toneLead ? `${v4("smkToneLead")} ${toneLabel(v4, toneLead)}` : v4("smkUnmarked")} · {v4("smkWide")} {rows.filter((row) => wideMark(row.note)).length}</p>
      <label className="c4-lab"><span>{v4("smkSearch")}</span><input ref={searchRef} className="c4-field c4-smk-search" aria-label={v4("smkSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <div className="c4-row" role="group" aria-label={v4("smkAll")}>
        <button type="button" className="c4-chip" data-on={laneOn === "all" ? "1" : "0"} onClick={() => setLane("all")}>{v4("smkAll")}</button>
        {present.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={laneOn === item ? "1" : "0"} onClick={() => setLane(item)}>{laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("smkGilt")}>
        {(["all", "gilt", "pale", "linen", "ash", "haze"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={toneOn === item ? "1" : "0"} onClick={() => setTone(item)}>{item === "all" ? v4("smkAll") : toneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("smkShapeAll")}>
        {(["all", "join", "wide", "hall", "glyph", "kept"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>
            {item === "all" ? v4("smkShapeAll") : item === "join" ? v4("smkShapeJoin") : item === "wide" ? v4("smkShapeWide") : item === "hall" ? v4("smkShapeHall") : item === "glyph" ? v4("smkShapeGlyph") : v4("smkShapeKept")}
          </button>
        ))}
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview("reviewed")}>{v4("smkReviewed")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview("fresh")}>{v4("smkFreshFilter")}</button>
        <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} onClick={() => setReview("all")}>{v4("smkAll")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("smkShow")}</button>
      </div>
      <div className="c4-row">
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" data-on={hidden.includes(item) ? "1" : "0"} onClick={() => storeHidden(toggleMark(hidden, item))}>{v4("smkHide")} {laneLabel(v4, item)}</button>
        ))}
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkMarkReview(reviewed, shown.map((row) => row.id), true))}>{v4("smkBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkMarkReview(reviewed, shown.map((row) => row.id), false))}>{v4("smkBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("stage-lanes.csv", marksCsv(rows))}>{v4("smkCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("stage-rows.csv", markRowsCsv(rows, reviewed))}>{v4("smkRowCsv")}</button>
      </div>
      <p className="c4-smk-keys">{v4("vcdKeys")} {v4("vcdEscape")}</p>
      {!shown.length && <p className="c4-smk-empty">{leads.error ? v4("smkUnmarked") : v4("smkEmpty")}</p>}
      <ol className="c4-smk-list">
        {shown.map((row, index) => (
          <li key={row.id} className="c4-smk-card" data-on={focus === index ? "1" : "0"} data-lane={markLane(row.note) || "blank"} data-tone={markTone(row.note) || "blank"} data-join={joinedMark(row.note) ? "1" : "0"} data-wide={wideMark(row.note) ? "1" : "0"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"}>
            <span className="c4-smk-mark">{markSigil(row.note) || "—"}</span>
            <strong>{row.label || v4("smkClear")}</strong>
            <span>{laneLabel(v4, markState(row.note) === "clear" ? "blank" : markLane(row.note))}</span>
            <span>{toneLabel(v4, markTone(row.note))}</span>
            <span>{v4("smkStep")} {markStep(row.note)}</span>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleMarkReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("smkReviewed") : v4("smkReview")}</button>
            <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(markCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("smkCopied") : v4("smkCopy")}</button>
          </li>
        ))}
      </ol>
    </section>
  );
}
