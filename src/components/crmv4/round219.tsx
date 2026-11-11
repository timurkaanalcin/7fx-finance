"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  STC_DENSITY_KEY,
  STC_KEY,
  STC_VIEW_KEY,
  GMK_KEY,
  GMK_REVIEW_KEY,
  activeMarkLane,
  activeMarkTone,
  activeWait,
  activePace,
  activeCloth,
  activeSeat,
  activeHost,
  activeRank,
  addCard,
  addCardTag,
  addSeatView,
  adjacentCardCount,
  bulkMarkReview,
  bulkCardArchive,
  bulkCardPace,
  bulkCardCloth,
  bulkCardPin,
  bulkCardTag,
  busiestHost,
  catalogMark,
  catalogMarkCount,
  clashSeatCount,
  markCopy,
  markLane,
  markLaneArg,
  markLanes,
  markOf,
  markRowsCsv,
  markShare,
  markState,
  markStep,
  markTone,
  markToneArg,
  marksCsv,
  cyclePace,
  densityOf,
  dropSeatView,
  waitArg,
  waitClashCount,
  editCard,
  editCardNote,
  fairHost,
  rushLoad,
  paceArg,
  paceFocused,
  giltMarkCount,
  holdFocused,
  houseCloth,
  clothArg,
  lateCard,
  lateShare,
  leadingMark,
  leadingMarkTone,
  matchedCards,
  moveFocus,
  nextCard,
  seatArg,
  seatGap,
  seatSpan,
  pairHostCount,
  peakSeat,
  cardCopy,
  cardCounts,
  cardCloths,
  cardLedger,
  cardHosts,
  cardShare,
  cardsCsv,
  pinFocused,
  presentMarks,
  quietSalonCount,
  quietSeat,
  readHiddenMarks,
  readSeatViews,
  readCards,
  readReviewedMarks,
  reminderCards,
  resetCards,
  hostArg,
  setCardArchive,
  setCardHold,
  setCardPin,
  setCardRank,
  sharedMarkCount,
  sharedClothCount,
  snoozeFocused,
  snoozeCard,
  sortCards,
  suggestWait,
  suggestCloth,
  suggestHost,
  toggleMark,
  toggleMarkReview,
  usedSeats,
  visibleMarkCustomers,
  visibleMarkLanes,
  visibleCards,
  rankArg,
  rankLoad,
  wideMark,
  wideMarkCount,
  windowCards,
  type MarkRow,
  type MarkShape,
  type SeatCard,
  type SeatDensity,
  type SeatSort,
  type SeatTray,
  type SeatView,
} from "@/lib/crmv4/round219";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  tradingGroup?: string | null;
};

type GlanceRow = MarkRow & { id: string };

const CLOTHS = ["slate", "ivory", "gilt"] as const;
const PACES = ["still", "walk", "rush"] as const;
const LANES = ["salon", "floor", "yard"] as const;

function clothLabel(v4: V4, cloth: string): string {
  if (cloth === "slate" || cloth === "SLATE") return v4("stcSlate");
  if (cloth === "ivory" || cloth === "IVORY") return v4("stcIvory");
  if (cloth === "gilt" || cloth === "GILT") return v4("stcGilt");
  return v4("stcBlankCloth");
}

function paceLabel(v4: V4, pace: string): string {
  if (pace === "still") return v4("stcStill");
  if (pace === "walk") return v4("stcWalk");
  if (pace === "rush") return v4("stcRush");
  return v4("stcBlankPace");
}

function waitLabel(v4: V4, wait: number | null): string {
  if (wait === 5) return v4("stcWait5");
  if (wait === 15) return v4("stcWait15");
  if (wait === 45) return v4("stcWait45");
  return v4("stcBlankWait");
}

function laneLabel(v4: V4, name: string): string {
  if (name === "salon") return v4("gmkSalon");
  if (name === "floor") return v4("gmkFloor");
  if (name === "yard") return v4("gmkYard");
  if (name === "blank") return v4("gmkClear");
  return v4("gmkUnmarked");
}

function toneLabel(v4: V4, name: string): string {
  if (name === "gilt") return v4("gmkGilt");
  if (name === "ink") return v4("gmkInk");
  if (name === "ivory") return v4("gmkIvory");
  if (name === "mist") return v4("gmkMist");
  return v4("gmkUnmarked");
}

function kindLabel(v4: V4, step: number): string {
  if (step === 1) return v4("gmkPlain");
  if (step === 2) return v4("gmkAlias");
  if (step === 3) return v4("gmkDeep");
  return v4("gmkClear");
}

function auditLabel(v4: V4, audit: string): string {
  const key = {
    save: "stcAuditSave",
    edit: "stcAuditEdit",
    pace: "stcAuditPace",
    pin: "stcAuditPin",
    unpin: "stcAuditUnpin",
    hold: "stcAuditHold",
    resume: "stcAuditResume",
    archive: "stcAuditArchive",
    open: "stcAuditOpen",
    cloth: "stcAuditCloth",
    tag: "stcAuditTag",
    rank: "stcAuditRank",
    wait: "stcAuditWait",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, seat: number | null, desk: string): string {
  const gap = seatGap(seat, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("stcPast")} ${gap}`;
  if (gap < 0) return `${v4("stcAhead")} ${Math.abs(gap)}`;
  return v4("stcDue");
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

export function SeatCards({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<SeatCard[]>([]);
  const [views, setViews] = useState<SeatView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [host, setHost] = useState("");
  const [seat, setSeat] = useState("");
  const [cloth, setCloth] = useState("");
  const [pace, setPace] = useState("");
  const [waitValue, setWaitValue] = useState("");
  const [tag, setTag] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<SeatTray>("open");
  const [hostFilter, setHostFilter] = useState("all");
  const [clothFilter, setClothFilter] = useState("all");
  const [paceFilter, setPaceFilter] = useState("all");
  const [seatFilter, setSeatFilter] = useState("all");
  const [waitFilter, setWaitFilter] = useState("all");
  const [rankFilter, setRankFilter] = useState("all");
  const [rushOnly, setRushOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [lightOnly, setLightOnly] = useState(false);
  const [board, setBoard] = useState<"tower" | "line">("tower");
  const [order, setOrder] = useState<SeatSort>("seat");
  const [density, setDensity] = useState<SeatDensity>("airy");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [deskSeat, setDeskSeat] = useState("");
  const [moveCloth, setMoveCloth] = useState("ivory");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<() => void>(() => {});
  const waitRef = useRef<() => void>(() => {});
  const holdRef = useRef<() => void>(() => {});
  const paceRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readCards(readJson(STC_KEY, []));
    const saved = readSeatViews(readJson(STC_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    setDensity(densityOf(readJson(STC_DENSITY_KEY, "airy")));
    writeJson(STC_KEY, next);
    writeJson(STC_VIEW_KEY, saved);
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: SeatCard[]) {
    const saved = readCards(next);
    setCards(saved);
    writeJson(STC_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((card) => card.id === id)));
  }
  function storeViews(next: SeatView[]) {
    const saved = readSeatViews(next);
    setViews(saved);
    writeJson(STC_VIEW_KEY, saved);
  }
  function storeDensity(next: SeatDensity) {
    setDensity(next);
    writeJson(STC_DENSITY_KEY, next);
  }
  const hosts = cardHosts(cards);
  const cloths = cardCloths(cards);
  const bars = CLOTHS.map((item) => ({ cloth: item.toUpperCase(), count: cards.filter((card) => card.cloth === item.toUpperCase()).length })).filter((row) => row.count > 0);
  const hostOn = activeHost(hostFilter, hosts);
  const clothOn = activeCloth(clothFilter, cloths);
  const paceOn = activePace(paceFilter, ["still", "walk", "rush"]);
  const seatOn = activeSeat(seatFilter);
  const waitOn = activeWait(waitFilter);
  const rankOn = activeRank(rankFilter);
  const pickedSeat = seatArg(seatOn);
  const shown = sortCards(visibleCards(
    cards,
    tray,
    query,
    hostArg(hostOn),
    clothArg(clothOn),
    paceArg(paceOn),
    pickedSeat.exact,
    pickedSeat.pick,
    waitArg(waitOn),
    rankArg(rankOn),
    rushOnly,
    peakOnly,
    houseOnly,
    quietOnly,
    lightOnly,
  ), order);
  const ledger = cardLedger(cards, query);
  const counts = cardCounts(cards, deskSeat);
  const clashes = clashSeatCount(cards);
  const wait = waitClashCount(cards);
  const neighbors = adjacentCardCount(cards);
  const nextId = nextCard(cards, deskSeat);
  const nextRow = cards.find((card) => card.id === nextId);
  const suggestedCloth = suggestCloth(cards);
  const suggestedHost = suggestHost(cards);
  const suggestedWait = suggestWait(cards);
  const fair = fairHost(cards, roster);
  const busy = busiestHost(cards);
  const reminders = reminderCards(cards, deskSeat);
  const windowRows = windowCards(cards, deskSeat);
  const share = lateShare(cards, deskSeat);
  const matched = matchedCards(cards, deskSeat);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  pinRef.current = () => {
    if (viewer) return;
    const ids = (board === "line" ? ledger : shown).map((card) => card.id);
    store(pinFocused(cards, ids, focus));
  };
  waitRef.current = () => {
    if (viewer) return;
    const ids = (board === "line" ? ledger : shown).map((card) => card.id);
    store(snoozeFocused(cards, ids, focus));
  };
  holdRef.current = () => {
    if (viewer) return;
    const ids = (board === "line" ? ledger : shown).map((card) => card.id);
    store(holdFocused(cards, ids, focus));
  };
  paceRef.current = () => {
    if (viewer) return;
    const ids = (board === "line" ? ledger : shown).map((card) => card.id);
    store(paceFocused(cards, ids, focus));
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
        waitRef.current();
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        holdRef.current();
        return;
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        paceRef.current();
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
    setHost("");
    setSeat("");
    setCloth("");
    setPace("");
    setWaitValue("");
    setTag("");
    setQuery("");
    setEditing("");
  }
  function applyView(view: SeatView) {
    setTray(view.tray);
    setQuery(view.query);
    setHostFilter(view.host);
    setClothFilter(view.cloth);
    setPaceFilter(view.pace);
    setSeatFilter(view.seat);
    setWaitFilter(view.wait);
    setRankFilter(view.rank);
  }
  const rows = board === "line" ? ledger : shown;
  return (
    <section className="c4-stc" aria-label={v4("stcTitle")} data-cards="1" data-role={role} data-density={density}>
      <div className="c4-stc-sheet">
        <header className="c4-stc-mast">
          <p className="c4-stc-spine">{v4("stcSpine")}</p>
          <div>
            <p className="c4-stc-kicker">{v4("stcSub")}</p>
            <h2 className="c4-title">{v4("stcTitle")}</h2>
          </div>
          <p className="c4-stc-plate" data-logo="mono">{v4("stcLogo")}</p>
        </header>
        <div className="c4-stc-body">
          <p className="c4-stc-rules">{v4("stcHint")}</p>
          <p className="c4-meta">{v4("stcLocal")}</p>
          <p className="c4-meta">{v4("stcNew")} {v4("stcSlash")} {v4("stcEscape")} {v4("stcKeys")} {v4("stcPinKey")} {v4("stcWaitKey")} {v4("stcHoldKey")} {v4("stcPaceKey")} {v4("stcBoardKey")}</p>
          {viewer && <p className="c4-stc-notice" data-viewer="1">{v4("stcViewer")}</p>}
          {counts.peak > 0 && (
            <p className="c4-stc-notice" role="status">
              {v4("stcNotice")} · {counts.peak}
              <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("stcNoticeAll") : v4("stcNoticePeak")}</button>
            </p>
          )}
          {counts.late > 0 && <p className="c4-stc-notice" role="status" data-late="1">{v4("stcLateNotice")} · {counts.late}</p>}
          <ol className="c4-stc-ledger" aria-label={v4("stcKpi")}>
            <li><span>{v4("stcOpen")}</span><strong>{counts.open}</strong></li>
            <li><span>{v4("stcHeld")}</span><strong>{counts.held}</strong></li>
            <li><span>{v4("stcArchived")}</span><strong>{counts.archived}</strong></li>
            <li><span>{v4("stcPinned")}</span><strong>{counts.pinned}</strong></li>
            <li><span>{v4("stcPeak")}</span><strong>{counts.peak}</strong></li>
            <li><span>{v4("stcLate")}</span><strong>{counts.late}</strong></li>
            <li><span>{v4("stcSoon")}</span><strong>{counts.soon}</strong></li>
            <li><span>{v4("stcRank")}</span><strong>{counts.rank}</strong></li>
            <li><span>{v4("stcMatched")}</span><strong>{matched}</strong></li>
            <li><span>{v4("stcHouseShare")}</span><strong>{cardShare(counts.house, counts.open)}%</strong></li>
          </ol>
          <div className="c4-stc-sla" aria-label={v4("stcLateShare")}>
            <span>{v4("stcLateShare")} · {share}%</span>
            <div className="c4-stc-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></div>
          </div>
          <div className="c4-stc-rail" aria-label={v4("stcCloths")}>
            {bars.map((bar) => (
              <div key={bar.cloth} className="c4-stc-meter" data-cloth={bar.cloth.toLowerCase()}>
                <button type="button" className="c4-btn" onClick={() => setClothFilter(bar.cloth)}>{clothLabel(v4, bar.cloth)} · {bar.count}</button>
                <div className="c4-stc-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
              </div>
            ))}
            {!bars.length && <p className="c4-stc-empty">{v4("stcEmpty")}</p>}
          </div>
          <div className="c4-stc-suggest">
            <p>{v4("stcSuggestCloth")} · {clothLabel(v4, suggestedCloth)}</p>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setCloth(suggestedCloth.toLowerCase())}>{v4("stcUseCloth")}</button>
            <p>{v4("stcSuggestHost")} · {suggestedHost || v4("stcBlankHost")}</p>
            <button type="button" className="c4-btn" disabled={viewer || !suggestedHost} onClick={() => setHost(suggestedHost)}>{v4("stcUseHost")}</button>
            <p>{v4("stcSuggestWait")} · {suggestedWait}</p>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setWaitValue(String(suggestedWait))}>{v4("stcUseWait")}</button>
            <p>{v4("stcAssign")} · {fair || v4("stcBlankHost")}</p>
            <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setHost(fair)}>{v4("stcAssign")}</button>
          </div>
          <p className="c4-meta">{v4("stcSeats")} · {usedSeats(cards)}</p>
          <p className="c4-meta">{clashes ? `${v4("stcClash")} · ${clashes}` : v4("stcClashNone")}</p>
          <p className="c4-meta">{wait ? `${v4("stcWaitClash")} · ${wait}` : v4("stcWaitClashNone")}</p>
          <p className="c4-meta">{neighbors ? `${v4("stcAdjacent")} · ${neighbors}` : v4("stcAdjacentNone")}</p>
          <p className="c4-meta">{pairHostCount(cards) ? `${v4("stcPairs")} · ${pairHostCount(cards)}` : v4("stcPairsNone")}</p>
          <p className="c4-meta">{sharedClothCount(cards) ? `${v4("stcSharedCloth")} · ${sharedClothCount(cards)}` : v4("stcSharedClothNone")}</p>
          <p className="c4-meta">{v4("stcRankLoad")} · {rankLoad(cards)}</p>
          <p className="c4-meta">{v4("stcQuietLoft")} · {quietSalonCount(cards)}</p>
          <p className="c4-meta">{v4("stcRushLoad")} · {rushLoad(cards)}</p>
          <p className="c4-meta">{v4("stcSeatSpan")} · {seatSpan(cards)}</p>
          <p className="c4-meta">{nextRow ? `${v4("stcNext")} · ${nextRow.title}` : v4("stcNextNone")}</p>
          <p className="c4-meta">{busy ? `${v4("stcBusiest")} · ${busy}` : v4("stcBusiestNone")}</p>
          <p className="c4-meta">{reminders.length ? `${v4("stcReminders")} · ${reminders.map((card) => card.title).join(", ")}` : v4("stcReminderNone")}</p>
          <p className="c4-meta">{windowRows.length ? `${v4("stcWindow")} · ${windowRows.map((card) => card.title).join(", ")}` : v4("stcWindowNone")}</p>
          <label className="c4-lab">{v4("stcSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("stcSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <div className="c4-stc-filters">
            <button type="button" className="c4-chip" data-on={tray === "open" ? "1" : "0"} onClick={() => setTray("open")}>{v4("stcOpenTray")}</button>
            <button type="button" className="c4-chip" data-on={tray === "held" ? "1" : "0"} onClick={() => setTray("held")}>{v4("stcHeldTray")}</button>
            <button type="button" className="c4-chip" data-on={tray === "archived" ? "1" : "0"} onClick={() => setTray("archived")}>{v4("stcArchivedTray")}</button>
            <button type="button" className="c4-chip" data-on={hostOn === "all" ? "1" : "0"} onClick={() => setHostFilter("all")}>{v4("stcAll")}</button>
            <button type="button" className="c4-chip" data-on={hostOn === "blank" ? "1" : "0"} onClick={() => setHostFilter("blank")}>{v4("stcBlankHost")}</button>
            {hosts.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={hostOn === name ? "1" : "0"} onClick={() => setHostFilter(name)}>{name}</button>
            ))}
            <button type="button" className="c4-chip" data-on={clothOn === "all" ? "1" : "0"} onClick={() => setClothFilter("all")}>{v4("stcCloth")}</button>
            {CLOTHS.map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={clothOn === item.toUpperCase() ? "1" : "0"} onClick={() => setClothFilter(item)}>{clothLabel(v4, item)}</button>
            ))}
            <button type="button" className="c4-chip" data-on={paceOn === "all" ? "1" : "0"} onClick={() => setPaceFilter("all")}>{v4("stcPace")}</button>
            {PACES.map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={paceOn === item ? "1" : "0"} onClick={() => setPaceFilter(item)}>{paceLabel(v4, item)}</button>
            ))}
            {["all", "blank", "early", "mid", "late", "peak", "quiet", "3", "6", "8"].map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={seatOn === item ? "1" : "0"} onClick={() => setSeatFilter(item)}>
                {item === "all" ? v4("stcSeat") : item === "blank" ? v4("stcBlankSeat") : item === "early" ? v4("stcEarly") : item === "mid" ? v4("stcMid") : item === "late" ? v4("stcLateSeat") : item === "peak" ? v4("stcPeak") : item === "quiet" ? v4("stcQuiet") : item}
              </button>
            ))}
            {["all", "blank", "5", "15", "45"].map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={waitOn === item ? "1" : "0"} onClick={() => setWaitFilter(item)}>{item === "all" ? v4("stcWait") : item === "blank" ? v4("stcBlankWait") : item}</button>
            ))}
            {["all", "blank", "0", "2", "4"].map((item) => (
              <button key={`w${item}`} type="button" className="c4-chip" data-on={rankOn === item ? "1" : "0"} onClick={() => setRankFilter(item)}>{item === "all" ? v4("stcRank") : item === "blank" ? v4("stcBlankRank") : item}</button>
            ))}
            <button type="button" className="c4-chip" data-on={rushOnly ? "1" : "0"} onClick={() => setRushOnly((on) => !on)}>{v4("stcRushOnly")}</button>
            <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((on) => !on)}>{v4("stcPeakOnly")}</button>
            <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((on) => !on)}>{v4("stcHouseOnly")}</button>
            <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((on) => !on)}>{v4("stcQuietOnly")}</button>
            <button type="button" className="c4-chip" data-on={lightOnly ? "1" : "0"} onClick={() => setLightOnly((on) => !on)}>{v4("stcLightOnly")}</button>
            <button type="button" className="c4-chip" data-on={order === "seat" ? "1" : "0"} onClick={() => setOrder("seat")}>{v4("stcSortSeat")}</button>
            <button type="button" className="c4-chip" data-on={order === "host" ? "1" : "0"} onClick={() => setOrder("host")}>{v4("stcSortHost")}</button>
            <button type="button" className="c4-chip" data-on={density === "airy" ? "1" : "0"} onClick={() => storeDensity("airy")}>{v4("stcAiry")}</button>
            <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity("tight")}>{v4("stcTight")}</button>
            <button type="button" className="c4-chip" data-on={board === "tower" ? "1" : "0"} onClick={() => setBoard("tower")}>{v4("stcTower")}</button>
            <button type="button" className="c4-chip" data-on={board === "line" ? "1" : "0"} onClick={() => setBoard("line")}>{v4("stcLine")}</button>
          </div>
          <form className="c4-stc-form" onSubmit={(event) => {
            event.preventDefault();
            if (viewer) return;
            store(addCard(cards, { id: `card-${Date.now()}`, title, note, host, seat, cloth, pace, wait: waitValue, tags: tag }));
            clearDraft();
          }}>
            <label className="c4-lab">{v4("stcCard")}<input ref={titleRef} className="c4-field" aria-label={v4("stcCard")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
            <label className="c4-lab">{v4("stcNote")}<input className="c4-field" aria-label={v4("stcNote")} value={note} onChange={(event) => setNote(event.target.value)} /></label>
            <label className="c4-lab">{v4("stcHost")}<input className="c4-field" aria-label={v4("stcHost")} value={host} onChange={(event) => setHost(event.target.value)} /></label>
            <label className="c4-lab">{v4("stcSeat")}<input className="c4-field" inputMode="numeric" aria-label={v4("stcSeat")} value={seat} onChange={(event) => setSeat(event.target.value)} /></label>
            <label className="c4-lab">{v4("stcCloth")}
              <select className="c4-field" aria-label={v4("stcCloth")} value={cloth} onChange={(event) => setCloth(event.target.value)}>
                <option value="">{v4("stcBlankCloth")}</option>
                {CLOTHS.map((item) => <option key={item} value={item}>{clothLabel(v4, item)}</option>)}
              </select>
            </label>
            <label className="c4-lab">{v4("stcPace")}
              <select className="c4-field" aria-label={v4("stcPace")} value={pace} onChange={(event) => setPace(event.target.value)}>
                <option value="">{v4("stcBlankPace")}</option>
                {PACES.map((item) => <option key={item} value={item}>{paceLabel(v4, item)}</option>)}
              </select>
            </label>
            <label className="c4-lab">{v4("stcWait")}<input className="c4-field" inputMode="numeric" aria-label={v4("stcWait")} value={waitValue} onChange={(event) => setWaitValue(event.target.value)} /></label>
            <label className="c4-lab">{v4("stcTag")}<input className="c4-field" aria-label={v4("stcTag")} value={tag} onChange={(event) => setTag(event.target.value)} /></label>
            <button type="submit" className="c4-btn" disabled={viewer}>{v4("stcSave")}</button>
          </form>
          <label className="c4-lab">{v4("stcDeskSeat")}<input className="c4-field" inputMode="numeric" aria-label={v4("stcDeskSeat")} value={deskSeat} onChange={(event) => setDeskSeat(event.target.value)} /></label>
          <label className="c4-lab">{v4("stcRoster")}<input className="c4-field" aria-label={v4("stcRoster")} value={roster} onChange={(event) => setRoster(event.target.value)} /></label>
          <form className="c4-stc-form" onSubmit={(event) => {
            event.preventDefault();
            if (viewer || !viewName.trim()) return;
            storeViews(addSeatView(views, {
              id: `view-${Date.now()}`,
              name: viewName,
              tray,
              query,
              host: hostOn,
              cloth: clothOn,
              pace: paceOn,
              seat: seatOn,
              wait: waitOn,
              rank: rankOn,
            }));
            setViewName("");
          }}>
            <label className="c4-lab">{v4("stcViewName")}<input className="c4-field" aria-label={v4("stcViewName")} value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
            <button type="submit" className="c4-btn" disabled={viewer}>{v4("stcSaveView")}</button>
          </form>
          <div className="c4-stc-views">
            {views.map((view) => (
              <p key={view.id}>
                <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropSeatView(views, view.id))}>{v4("stcDropView")}</button>
              </p>
            ))}
          </div>
          <div className="c4-stc-bulk">
            <label className="c4-lab">{v4("stcBulkCloth")}
              <select className="c4-field" aria-label={v4("stcBulkCloth")} value={moveCloth} onChange={(event) => setMoveCloth(event.target.value)}>
                {CLOTHS.map((item) => <option key={item} value={item}>{clothLabel(v4, item)}</option>)}
              </select>
            </label>
            <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCardCloth(cards, picked, moveCloth))}>{v4("stcBulkCloth")}</button>
            <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCardPin(cards, picked, true))}>{v4("stcBulkPin")}</button>
            <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCardArchive(cards, picked, true))}>{v4("stcBulkArchive")}</button>
            <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCardTag(cards, picked, "e"))}>{v4("stcBulkTag")}</button>
            <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCardPace(cards, picked, "walk"))}>{v4("stcBulkPace")}</button>
            <button type="button" className="c4-btn" onClick={() => download("seat-cards.csv", cardsCsv(cards, deskSeat))}>{v4("stcCsv")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetCards())}>{v4("stcReset")}</button>
          </div>
          {!rows.length && <p className="c4-stc-empty">{v4("stcEmpty")}</p>}
          <ol className="c4-stc-book">
            {rows.map((card, index) => (
              <li key={card.id} data-focus={focus === index ? "1" : "0"} data-late={lateCard(card, deskSeat) ? "1" : "0"} data-house={houseCloth(card.cloth) ? "1" : "0"} data-peak={peakSeat(card.seat) ? "1" : "0"} data-quiet={quietSeat(card.seat) ? "1" : "0"}>
                <label className="c4-lab">
                  <input type="checkbox" checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                  <span className="c4-meta">{index + 1}</span>
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (!viewer) store(editCard(editCardNote(cards, card.id, noteDraft), card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("stcCard")} value={draft} onChange={(event) => setDraft(event.target.value)} />
                      <input className="c4-field" aria-label={v4("stcNote")} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("stcEdit")}</button>
                    </form>
                  ) : (
                    <button type="button" className="c4-btn" onClick={() => { setFocus(index); setEditing(card.id); setDraft(card.title); setNoteDraft(card.note); }}>{card.title}</button>
                  )}
                  <p className="c4-meta">{card.host || v4("stcBlankHost")} · {card.seat ?? v4("stcBlankSeat")} · {clothLabel(v4, card.cloth)} · {paceLabel(v4, card.pace)} · {waitLabel(v4, card.wait)} · {gapLabel(v4, card.seat, deskSeat)}</p>
                  <p className="c4-meta">{card.note} {card.tags.join(" ")} {auditLabel(v4, card.audit)}</p>
                  <div className="c4-row">
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCardPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("stcUnpin") : v4("stcPin")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCardHold(cards, card.id, !card.held))}>{card.held ? v4("stcResume") : v4("stcHold")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCardArchive(cards, card.id, !card.archived))}>{card.archived ? v4("stcReopen") : v4("stcArchive")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cyclePace(cards, card.id))}>{paceLabel(v4, card.pace)}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(snoozeCard(cards, card.id))}>{v4("stcSnooze")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCardRank(cards, card.id, card.rank ? 0 : 2))}>{card.rank ? v4("stcRankOff") : v4("stcRankOn")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addCardTag(cards, card.id, "f"))}>{v4("stcTag")}</button>
                    <button type="button" className="c4-btn" onClick={() => { const line = cardCopy(card, deskSeat); void navigator.clipboard?.writeText(line); setCopied(card.id); }}>{copied === card.id ? v4("stcCopied") : v4("stcCopy")}</button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <p className="c4-stc-rules">{v4("stcRules")}</p>
        </div>
      </div>
    </section>
  );
}

export function GroupMarks({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("all");
  const [tone, setTone] = useState("all");
  const [shape, setShape] = useState<MarkShape>("all");
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
    note: { tradingGroup: user.tradingGroup ?? null },
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
    const present = presentMarks(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenMarks(readJson(GMK_KEY, []), present);
    const nextReviewed = readReviewedMarks(readJson(GMK_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(GMK_KEY, nextHidden);
    writeJson(GMK_REVIEW_KEY, nextReviewed);
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
  const present = presentMarks(rows);
  const lanes = visibleMarkLanes(present, hidden, showHidden);
  const laneOn = activeMarkLane(lane, present);
  const toneOn = activeMarkTone(tone);
  const shown = visibleMarkCustomers(rows, markLaneArg(laneOn), markToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = markState(row.note);
      const token = state === "set" ? markLane(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return lanes.includes(token);
    });
  const lead = leadingMark(rows);
  const toneLead = leadingMarkTone(rows);
  const shared = sharedMarkCount(rows);
  const catalog = catalogMarkCount(rows);
  const bars = markLanes(rows).filter((line) => line.lane);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(GMK_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedMarks(next, ids);
    setReviewed(saved);
    writeJson(GMK_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-gmk" aria-label={v4("gmkTitle")} data-marks="1" data-role={role} data-catalog={catalog ? "1" : "0"}>
      <div className="c4-gmk-sheet">
        <header className="c4-gmk-mast">
          <div>
            <p className="c4-gmk-kicker">{v4("gmkSub")}</p>
            <h2 className="c4-title">{v4("gmkTitle")}</h2>
          </div>
          <p className="c4-gmk-plate" data-logo="mono">{v4("gmkLogo")}</p>
        </header>
        <div className="c4-gmk-body">
          <p className="c4-gmk-rules">{v4("gmkHint")}</p>
          <p className="c4-meta">{v4("gmkKept")} {v4("gmkEscape")}</p>
          {viewer && <p className="c4-gmk-notice" data-viewer="1">{v4("gmkViewer")}</p>}
          {data.error && <p className="c4-gmk-empty" role="alert">{v4("gmkFailed")}</p>}
          {data.loading && <p className="c4-meta">{v4("gmkLoading")}</p>}
          {shared > 0 && <p className="c4-gmk-notice" role="status">{v4("gmkNotice")} · {shared}</p>}
          <ol className="c4-gmk-ledger" aria-label={v4("gmkKpi")}>
            <li><span>{v4("gmkSet")}</span><strong>{rows.filter((row) => markState(row.note) === "set").length}</strong></li>
            <li><span>{v4("gmkCatalog")}</span><strong>{catalog}</strong></li>
            <li><span>{v4("gmkWide")}</span><strong>{wideMarkCount(rows)}</strong></li>
            <li><span>{v4("gmkGiltCount")}</span><strong>{giltMarkCount(rows)}</strong></li>
            <li><span>{v4("gmkShare")}</span><strong>{markShare(catalog, rows.length)}%</strong></li>
            <li><span>{v4("gmkShared")}</span><strong>{shared}</strong></li>
          </ol>
          <div className="c4-gmk-rail" aria-label={v4("gmkLanes")}>
            {bars.map((bar) => (
              <div key={bar.lane} className="c4-gmk-meter" data-lane={bar.lane}>
                <button type="button" className="c4-btn" onClick={() => setLane(bar.lane)}>{laneLabel(v4, bar.lane)} · {bar.count}</button>
                <div className="c4-gmk-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
              </div>
            ))}
            {!bars.length && <p className="c4-gmk-empty">{v4("gmkEmpty")}</p>}
          </div>
          <div className="c4-gmk-suggest">
            <p>{v4("gmkLeading")} · {lead ? laneLabel(v4, lead) : v4("gmkLeadingNone")}</p>
            <p>{v4("gmkToneLead")} · {toneLead ? toneLabel(v4, toneLead) : v4("gmkToneNone")}</p>
            <p>{shared ? `${v4("gmkShared")} · ${shared}` : v4("gmkSharedNone")}</p>
          </div>
          <label className="c4-lab">{v4("gmkSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("gmkSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <div className="c4-gmk-filters">
            <button type="button" className="c4-chip" data-on={laneOn === "all" ? "1" : "0"} onClick={() => setLane("all")}>{v4("gmkAll")}</button>
            <button type="button" className="c4-chip" data-on={laneOn === "blank" ? "1" : "0"} onClick={() => setLane("blank")}>{v4("gmkClear")}</button>
            {LANES.map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={laneOn === item ? "1" : "0"} onClick={() => setLane(item)}>{laneLabel(v4, item)}</button>
            ))}
            <button type="button" className="c4-chip" data-on={toneOn === "all" ? "1" : "0"} onClick={() => setTone("all")}>{v4("gmkTone")}</button>
            <button type="button" className="c4-chip" data-on={toneOn === "gilt" ? "1" : "0"} onClick={() => setTone("gilt")}>{v4("gmkGilt")}</button>
            <button type="button" className="c4-chip" data-on={toneOn === "ink" ? "1" : "0"} onClick={() => setTone("ink")}>{v4("gmkInk")}</button>
            <button type="button" className="c4-chip" data-on={toneOn === "ivory" ? "1" : "0"} onClick={() => setTone("ivory")}>{v4("gmkIvory")}</button>
            <button type="button" className="c4-chip" data-on={toneOn === "mist" ? "1" : "0"} onClick={() => setTone("mist")}>{v4("gmkMist")}</button>
            {(["all", "catalog", "wide", "gilt"] as const).map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{item === "all" ? v4("gmkAllShapes") : item === "catalog" ? v4("gmkCatalog") : item === "wide" ? v4("gmkWide") : v4("gmkGilt")}</button>
            ))}
            <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} onClick={() => setReview("all")}>{v4("gmkAllReview")}</button>
            <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview("reviewed")}>{v4("gmkReviewed")}</button>
            <button type="button" className="c4-chip" data-on={review === "open" ? "1" : "0"} onClick={() => setReview("open")}>{v4("gmkOpenReview")}</button>
            <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("gmkShown") : v4("gmkHidden")}</button>
          </div>
          <div className="c4-gmk-bands">
            {present.map((item) => (
              <button key={item} type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleMark(hidden, item))}>
                {laneLabel(v4, item)} · {hidden.includes(item) ? v4("gmkShow") : v4("gmkHide")}
              </button>
            ))}
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkMarkReview(reviewed, shown.map((row) => row.id), true))}>{v4("gmkBulkReview")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkMarkReview(reviewed, ids, false))}>{v4("gmkBulkClear")}</button>
            <button type="button" className="c4-btn" onClick={() => download("group-marks.csv", marksCsv(rows))}>{v4("gmkCsv")}</button>
            <button type="button" className="c4-btn" onClick={() => download("group-mark-rows.csv", markRowsCsv(rows, reviewed))}>{v4("gmkRowCsv")}</button>
            <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("gmkCustomers")}</Link>
          </div>
          {!shown.length && <p className="c4-gmk-empty">{v4("gmkEmpty")}</p>}
          <ul className="c4-gmk-index">
            {shown.map((row) => {
              const state = markState(row.note);
              const mark = markOf(row.note);
              const step = markStep(row.note);
              const steps = [v4("gmkPlain"), v4("gmkAlias"), v4("gmkDeep")];
              return (
                <li key={row.id} data-state={state || "blank"} data-lane={state === "set" ? markLane(row.note) : "blank"} data-tone={markTone(row.note) || "blank"} data-catalog={catalogMark(row.note) ? "1" : "0"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"} data-step={step}>
                  <p className="c4-gmk-mark" data-logo="mono">{mark || "—"}</p>
                  <div>
                    <strong>{row.label || row.id}</strong>
                    <span className="c4-meta">{markCopy(row.note) || v4("gmkClear")} · {laneLabel(v4, state === "set" ? markLane(row.note) : state === "clear" ? "blank" : "")} · {toneLabel(v4, markTone(row.note))}</span>
                    <ol className="c4-gmk-time" aria-label={v4("gmkStep")}>
                      {steps.map((label, index) => (
                        <li key={label} data-on={step >= index + 1 ? "1" : "0"}>{label}</li>
                      ))}
                    </ol>
                    <span className="c4-meta">{kindLabel(v4, step)}</span>
                    {catalogMark(row.note) && <span className="c4-meta">{v4("gmkCatalogMark")}</span>}
                    {wideMark(row.note) && <span className="c4-meta">{v4("gmkWide")}</span>}
                    <div className="c4-row">
                      <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleMarkReview(reviewed, row.id))}>{v4("gmkReview")}</button>
                      <button type="button" className="c4-btn" onClick={() => { const line = markCopy(row.note); void navigator.clipboard?.writeText(line); setCopied(row.id); }}>{copied === row.id ? v4("gmkCopied") : v4("gmkCopy")}</button>
                      <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{row.label || row.id}</Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="c4-gmk-rules">{v4("gmkRules")}</p>
        </div>
      </div>
    </section>
  );
}
