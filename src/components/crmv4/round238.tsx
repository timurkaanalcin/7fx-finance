"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  BRT_DENSITY_KEY,
  BRT_KEY,
  BRT_VIEW_KEY,
  BDG_KEY,
  BDG_REVIEW_KEY,
  activeHook,
  activePace,
  activeCord,
  activeBadgeLane,
  activeBadgeTone,
  activeSpan,
  activeClerk,
  activeRank,
  addBerth,
  addBerthTag,
  addBerthView,
  adjacentBerthCount,
  hookArg,
  hookGap,
  hookWidth,
  bulkBadgeReview,
  bulkBerthArchive,
  bulkBerthPace,
  bulkBerthCord,
  bulkBerthPin,
  bulkBerthTag,
  busiestClerk,
  cipherBadgeCount,
  clashHookCount,
  coolingBerth,
  coolingBerths,
  cyclePace,
  dropBerthView,
  editBerth,
  editBerthNote,
  fairClerk,
  paceArg,
  paceFocusedBerth,
  gateBadgeCount,
  giltBadgeCount,
  cordArg,
  hallBadgeCount,
  holdFocusedBerth,
  houseCord,
  joinedBadge,
  joinedBadgeCount,
  lateBerth,
  lateBerthShare,
  leadingBadge,
  leadingBadgeTone,
  matchedBerths,
  moveBerthFocus,
  nextBerth,
  pairBerthCount,
  peakHook,
  pinFocusedBerth,
  badgeCopy,
  badgeLane,
  badgeLaneArg,
  badgeLanes,
  badgeRowsCsv,
  badgeShare,
  badgeSigil,
  badgeState,
  badgeStep,
  badgeTone,
  badgeToneArg,
  badgesCsv,
  presentBadgeLanes,
  queueBadgeCount,
  quietHook,
  quietHallBerths,
  readHiddenBadges,
  readReviewedBadges,
  readBerthViews,
  readBerths,
  reminderBerths,
  sprintBerthLoad,
  sealFocusedBerth,
  sealBadgeCount,
  setBerthArchive,
  setBerthHold,
  setBerthPin,
  setBerthSeal,
  setBerthRank,
  sharedCordCount,
  sharedBadgeCount,
  snoozeFocusedBerth,
  snoozeBerth,
  sortBerths,
  spanArg,
  spanClashCount,
  suggestCord,
  suggestSpan,
  suggestClerk,
  toggleBadge,
  toggleBadgeReview,
  vaultBadgeCount,
  visibleBadgeLanes,
  visibleBadges,
  visibleBerths,
  berthCopy,
  berthCounts,
  berthDensity,
  berthCords,
  berthIndex,
  berthShare,
  berthTimeline,
  berthClerks,
  clerkArg,
  berthsCsv,
  rankArg,
  rankLoad,
  wideBadge,
  type BadgeReview,
  type BadgeRow,
  type BadgeShape,
  type BadgeValue,
  type BerthCard,
  type BerthDensity,
  type BerthSort,
  type BerthTray,
  type BerthView,
} from "@/lib/crmv4/round238";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const GLASSES = ["hemp", "silk", "wire"] as const;
const GAITS = ["hush", "march", "sprint"] as const;
const SPANS = ["10", "30", "90"] as const;
const WEIGHTS = ["2", "5", "8"] as const;
const BAYS = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "brtAuditSave",
  edit: "brtAuditEdit",
  note: "brtAuditNote",
  pace: "brtAuditPace",
  pin: "brtAuditPin",
  unpin: "brtAuditUnpin",
  hold: "brtAuditHold",
  resume: "brtAuditResume",
  archive: "brtAuditArchive",
  open: "brtAuditOpen",
  cord: "brtAuditCord",
  tag: "brtAuditTag",
  rank: "brtAuditRank",
  span: "brtAuditSpan",
  seal: "brtAuditSeal",
};

type SlipRow = { id?: string; status?: string | null; method?: { label?: string | null } | string | null; user?: { id?: string | null; name?: string | null } | null };

function methodLabel(method: SlipRow["method"]): string {
  if (typeof method === "string") return method;
  if (method && typeof method === "object" && typeof method.label === "string") return method.label;
  return "";
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

function textField(raw: string | null | undefined): string {
  return typeof raw === "string" ? raw : "";
}

function cordLabel(v4: V4, cord: string): string {
  if (cord === "HEMP" || cord === "hemp") return v4("brtHemp");
  if (cord === "SILK" || cord === "silk") return v4("brtSilk");
  if (cord === "WIRE" || cord === "wire") return v4("brtWire");
  return v4("brtBlankCord");
}

function paceLabel(v4: V4, pace: string): string {
  if (pace === "hush") return v4("brtHush");
  if (pace === "march") return v4("brtMarch");
  if (pace === "sprint") return v4("brtSprint");
  return v4("brtBlankPace");
}

function laneLabel(v4: V4, lane: string): string {
  if (lane === "cipher") return v4("bdgCipher");
  if (lane === "seal") return v4("bdgSeal");
  if (lane === "queue") return v4("bdgQueue");
  if (lane === "gate") return v4("bdgGate");
  if (lane === "vault") return v4("bdgVault");
  if (lane === "hall") return v4("bdgHall");
  if (lane === "blank") return v4("bdgClear");
  return v4("bdgUnmarked");
}

function toneLabel(v4: V4, tone: string): string {
  if (tone === "gilt") return v4("bdgGilt");
  if (tone === "pale") return v4("bdgPale");
  if (tone === "linen") return v4("bdgLinen");
  if (tone === "ash") return v4("bdgAsh");
  if (tone === "haze") return v4("bdgHaze");
  return v4("bdgUnmarked");
}

function gapLabel(v4: V4, hook: number | null, desk: string): string {
  const gap = hookGap(hook, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("brtPast")} ${gap}`;
  if (gap < 0) return `${v4("brtAhead")} ${Math.abs(gap)}`;
  return v4("brtDue");
}

export function BerthSlips({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<BerthCard[]>([]);
  const [views, setViews] = useState<BerthView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [clerk, setClerk] = useState("");
  const [hook, setHook] = useState("");
  const [cord, setCord] = useState("");
  const [pace, setPace] = useState("");
  const [spanValue, setSpanValue] = useState("");
  const [rank, setRank] = useState("");
  const [tag, setTag] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<BerthTray>("open");
  const [clerkFilter, setClerkFilter] = useState("all");
  const [cordFilter, setCordFilter] = useState("all");
  const [paceFilter, setPaceFilter] = useState("all");
  const [hookFilter, setHookFilter] = useState("all");
  const [spanFilter, setSpanFilter] = useState("all");
  const [rankFilter, setRankFilter] = useState("all");
  const [sprintOnly, setSprintOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [restingOnly, setRestingOnly] = useState(false);
  const [board, setBoard] = useState<"hall" | "index">("hall");
  const [order, setOrder] = useState<BerthSort>("hook");
  const [density, setDensity] = useState<BerthDensity>("airy");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [deskHook, setDeskHook] = useState("");
  const [moveCord, setMoveCord] = useState("wire");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<() => void>(() => {});
  const spanRef = useRef<() => void>(() => {});
  const holdRef = useRef<() => void>(() => {});
  const paceRef = useRef<() => void>(() => {});
  const sealRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readBerths(readJson(BRT_KEY, []));
    const saved = readBerthViews(readJson(BRT_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    setDensity(berthDensity(readJson(BRT_DENSITY_KEY, "airy")));
    writeJson(BRT_KEY, next);
    writeJson(BRT_VIEW_KEY, saved);
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: BerthCard[]) {
    const saved = readBerths(next);
    setCards(saved);
    writeJson(BRT_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((card) => card.id === id)));
  }
  function storeViews(next: BerthView[]) {
    const saved = readBerthViews(next);
    setViews(saved);
    writeJson(BRT_VIEW_KEY, saved);
  }
  function storeDensity(next: BerthDensity) {
    setDensity(next);
    writeJson(BRT_DENSITY_KEY, next);
  }
  const clerks = berthClerks(cards);
  const cords = berthCords(cards);
  const bars = GLASSES.map((item) => ({ cord: item.toUpperCase(), count: cards.filter((card) => card.cord === item.toUpperCase()).length })).filter((row) => row.count > 0);
  const clerkOn = activeClerk(clerkFilter, clerks);
  const cordOn = activeCord(cordFilter, ["HEMP", "SILK", "WIRE", ...cords]);
  const paceOn = activePace(paceFilter, ["hush", "march", "sprint"]);
  const hookOn = activeHook(hookFilter);
  const spanOn = activeSpan(spanFilter);
  const rankOn = activeRank(rankFilter);
  const pickedHook = hookArg(hookOn);
  const shown = sortBerths(visibleBerths(
    cards,
    tray,
    query,
    clerkArg(clerkOn),
    cordArg(cordOn),
    paceArg(paceOn),
    pickedHook.exact,
    pickedHook.pick,
    spanArg(spanOn),
    rankArg(rankOn),
    sprintOnly,
    peakOnly,
    houseOnly,
    quietOnly,
    restingOnly,
  ), order);
  const book = berthIndex(cards, query);
  const timeline = berthTimeline(cards);
  const counts = berthCounts(cards, deskHook);
  const share = lateBerthShare(cards, deskHook);
  const matched = matchedBerths(cards, deskHook);
  const clashes = clashHookCount(cards);
  const spans = spanClashCount(cards);
  const neighbors = adjacentBerthCount(cards);
  const suggestedCord = suggestCord(cards);
  const suggestedName = suggestClerk(cards);
  const suggestedSpan = suggestSpan(cards);
  const fair = fairClerk(cards, roster);
  const busy = busiestClerk(cards);
  const reminders = reminderBerths(cards, deskHook);
  const cooling = coolingBerths(cards);
  const nextTitle = nextBerth(cards, deskHook);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  pinRef.current = () => {
    if (!viewer) store(pinFocusedBerth(cards, shown.map((card) => card.id), focus));
  };
  spanRef.current = () => {
    if (!viewer) store(snoozeFocusedBerth(cards, shown.map((card) => card.id), focus));
  };
  holdRef.current = () => {
    if (!viewer) store(holdFocusedBerth(cards, shown.map((card) => card.id), focus));
  };
  paceRef.current = () => {
    if (!viewer) store(paceFocusedBerth(cards, shown.map((card) => card.id), focus));
  };
  sealRef.current = () => {
    if (!viewer) store(sealFocusedBerth(cards, shown.map((card) => card.id), focus));
  };
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setTitle("");
        setNote("");
        setClerk("");
        setHook("");
        setCord("");
        setPace("");
        setSpanValue("");
        setRank("");
        setTag("");
        setQuery("");
        setEditing("");
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveBerthFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveBerthFocus(index, shown.length, -1));
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
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        spanRef.current();
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        holdRef.current();
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        paceRef.current();
        return;
      }
      if (event.key === "w" || event.key === "W") {
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
  function saveBerth() {
    if (viewer) return;
    store(addBerth(cards, {
      id: `brt-${Date.now()}`,
      title,
      note,
      clerk,
      hook,
      cord,
      pace,
      span: spanValue,
      rank,
      tags: tag,
    }));
    setTitle("");
    setNote("");
    setTag("");
  }
  function applyView(view: BerthView) {
    setTray(view.tray);
    setQuery(view.query);
    setClerkFilter(view.clerk || "all");
    setCordFilter(view.cord || "all");
    setPaceFilter(view.pace || "all");
    setHookFilter(view.hook || "all");
    setSpanFilter(view.span || "all");
    setRankFilter(view.rank || "all");
  }
  const focused = shown[focus];
  return (
    <section className="c4-brt" aria-label={v4("brtTitle")} data-slips="1" data-desk="quay" data-role={role} data-board={board} data-density={density}>
      <header className="c4-brt-mast">
        <p className="c4-brt-seal" data-logo="mono">{v4("brtLogo")}</p>
        <div>
          <p className="c4-brt-kicker">{v4("brtSub")}</p>
          <h2 className="c4-title">{v4("brtTitle")}</h2>
        </div>
        <p className="c4-brt-links">
          <Link href={crmv4Href(base, "withdraw")}>{v4("brtSub")}</Link>
          <Link href={crmv4Href(base, "bdg")}>{v4("bdgTitle")}</Link>
        </p>
      </header>
      {viewer && <p className="c4-brt-note">{v4("brtViewer")}</p>}
      <p className="c4-brt-rule">{v4("brtHint")}</p>
      <ul className="c4-brt-kpis" aria-label={v4("brtKpi")}>
        <li><span>{v4("brtOpen")}</span><strong>{counts.open}</strong></li>
        <li><span>{v4("brtHeld")}</span><strong>{counts.held}</strong></li>
        <li><span>{v4("brtArchived")}</span><strong>{counts.archived}</strong></li>
        <li><span>{v4("brtPinned")}</span><strong>{counts.pinned}</strong></li>
        <li><span>{v4("brtPeak")}</span><strong>{counts.peak}</strong></li>
        <li><span>{v4("brtLate")}</span><strong>{counts.late}</strong></li>
        <li><span>{v4("brtSame")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("brtRaised")}</span><strong>{counts.rank}</strong></li>
        <li><span>{v4("brtHouse")}</span><strong>{counts.house}</strong></li>
        <li><span>{v4("brtWindow")}</span><strong>{counts.window}</strong></li>
        <li><span>{v4("brtMatched")}</span><strong>{matched}</strong></li>
        <li><span>{v4("brtSeal")}</span><strong>{counts.seal}</strong></li>
        <li><span>{v4("brtCooling")}</span><strong>{counts.cooling}</strong></li>
      </ul>
      <div className="c4-brt-bars" aria-label={v4("brtCords")}>
        {bars.map((bar) => (
          <div key={bar.cord} className="c4-brt-bar" data-cord={bar.cord.toLowerCase()}>
            <span>{cordLabel(v4, bar.cord)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <p className="c4-brt-meta">
        {v4("brtLateShare")} {share}% · {v4("brtSuggestCord")} {cordLabel(v4, suggestedCord)} · {v4("brtSuggestSpan")} {suggestedSpan} · {v4("brtSuggestClerk")} {suggestedName || v4("brtBlankClerk")} · {v4("brtAssign")} {fair || v4("brtBlankClerk")} · {busy ? `${v4("brtBusiest")} ${busy}` : v4("brtBusiestNone")} · {clashes ? `${v4("brtClash")} ${clashes}` : v4("brtClashNone")} · {v4("brtSpanClash")} {spans} · {neighbors ? `${v4("brtNeighbors")} ${neighbors}` : v4("brtNeighborsNone")} · {v4("brtLoad")} {rankLoad(cards)} · {v4("brtPair")} {pairBerthCount(cards)} · {v4("brtShared")} {sharedCordCount(cards)} · {v4("brtQuietHall")} {quietHallBerths(cards)} · {v4("brtSprint")} {sprintBerthLoad(cards)} · {v4("brtHookWidth")} {hookWidth(cards)} · {v4("brtHooks")} {new Set(cards.map((card) => card.hook).filter((item) => item !== null)).size} · {nextTitle ? `${v4("brtNext")} ${nextTitle}` : v4("brtNextNone")}
      </p>
      <div className="c4-brt-tools">
        <label className="c4-lab"><span>{v4("brtTitleField")}</span><input ref={titleRef} className="c4-field" aria-label={v4("brtTitleField")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("brtNote")}</span><input className="c4-field" aria-label={v4("brtNote")} aria-required={false} value={note} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("brtClerk")}</span><input className="c4-field" aria-label={v4("brtClerk")} aria-required={false} value={clerk} onChange={(event) => setClerk(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("brtHook")}</span>
          <select className="c4-select" aria-label={v4("brtHook")} value={hook} onChange={(event) => setHook(event.target.value)}>
            <option value="">{v4("brtBlank")}</option>
            {BAYS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("brtCord")}</span>
          <select className="c4-select" aria-label={v4("brtCord")} value={cord} onChange={(event) => setCord(event.target.value)}>
            <option value="">{v4("brtBlankCord")}</option>
            {GLASSES.map((item) => <option key={item} value={item}>{cordLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("brtPace")}</span>
          <select className="c4-select" aria-label={v4("brtPace")} value={pace} onChange={(event) => setPace(event.target.value)}>
            <option value="">{v4("brtBlankPace")}</option>
            {GAITS.map((item) => <option key={item} value={item}>{paceLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("brtSpan")}</span>
          <select className="c4-select" aria-label={v4("brtSpan")} value={spanValue} onChange={(event) => setSpanValue(event.target.value)}>
            <option value="">{v4("brtBlankSpan")}</option>
            {SPANS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("brtRank")}</span>
          <select className="c4-select" aria-label={v4("brtRank")} value={rank} onChange={(event) => setRank(event.target.value)}>
            <option value="">{v4("brtResting")}</option>
            {WEIGHTS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("brtTag")}</span><input className="c4-field" aria-label={v4("brtTag")} aria-required={false} value={tag} onChange={(event) => setTag(event.target.value)} /></label>
        <button type="button" className="c4-btn c4-btn-hot" disabled={viewer} onClick={saveBerth}>{v4("brtAdd")}</button>
      </div>
      <div className="c4-brt-tools">
        <label className="c4-lab"><span>{v4("brtDesk")}</span><input className="c4-field" aria-label={v4("brtDesk")} aria-required={false} value={deskHook} onChange={(event) => setDeskHook(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("brtRoster")}</span><input className="c4-field" aria-label={v4("brtRoster")} aria-required={false} value={roster} onChange={(event) => setRoster(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("brtSearch")}</span><input ref={searchRef} className="c4-field c4-brt-search" aria-label={v4("brtSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <button type="button" className="c4-btn" onClick={() => storeDensity(density === "airy" ? "tight" : "airy")}>{density === "airy" ? v4("brtDensityTight") : v4("brtDensityAiry")}</button>
        <button type="button" className="c4-btn" data-on={order === "hook" ? "1" : "0"} onClick={() => setOrder("hook")}>{v4("brtSortHook")}</button>
        <button type="button" className="c4-btn" data-on={order === "clerk" ? "1" : "0"} onClick={() => setOrder("clerk")}>{v4("brtSortClerk")}</button>
        <button type="button" className="c4-btn" data-on={board === "hall" ? "1" : "0"} onClick={() => setBoard("hall")}>{v4("brtBoardHall")}</button>
        <button type="button" className="c4-btn" data-on={board === "index" ? "1" : "0"} onClick={() => setBoard("index")}>{v4("brtBoardIndex")}</button>
        <button type="button" className="c4-btn" onClick={() => download("berth-slips.csv", berthsCsv(cards, deskHook))}>{v4("brtCsv")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("brtOpen")}>
        {(["open", "held", "archived"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("brtOpen") : item === "held" ? v4("brtHeld") : v4("brtArchived")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sprintOnly ? "1" : "0"} onClick={() => setSprintOnly((value) => !value)}>{v4("brtSprintOnly")}</button>
        <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((value) => !value)}>{v4("brtPeakOnly")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((value) => !value)}>{v4("brtQuietOnly")}</button>
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("brtHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={restingOnly ? "1" : "0"} onClick={() => setRestingOnly((value) => !value)}>{v4("brtRestingOnly")}</button>
      </div>
      <div className="c4-brt-tools">
        <label className="c4-lab"><span>{v4("brtClerk")}</span>
          <select className="c4-select" aria-label={v4("brtClerk")} value={clerkOn} onChange={(event) => setClerkFilter(event.target.value)}>
            <option value="all">{v4("brtAll")}</option>
            <option value="blank">{v4("brtBlankClerk")}</option>
            {clerks.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("brtCord")}</span>
          <select className="c4-select" aria-label={v4("brtCord")} value={cordOn} onChange={(event) => setCordFilter(event.target.value)}>
            <option value="all">{v4("brtAll")}</option>
            <option value="blank">{v4("brtBlankCord")}</option>
            {GLASSES.map((item) => <option key={item} value={item.toUpperCase()}>{cordLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("brtPace")}</span>
          <select className="c4-select" aria-label={v4("brtPace")} value={paceOn} onChange={(event) => setPaceFilter(event.target.value)}>
            <option value="all">{v4("brtAll")}</option>
            <option value="blank">{v4("brtBlankPace")}</option>
            {GAITS.map((item) => <option key={item} value={item}>{paceLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("brtHook")}</span>
          <select className="c4-select" aria-label={v4("brtHook")} value={hookOn} onChange={(event) => setHookFilter(event.target.value)}>
            <option value="all">{v4("brtAll")}</option>
            <option value="blank">{v4("brtBlank")}</option>
            <option value="early">{v4("brtEarly")}</option>
            <option value="mid">{v4("brtMid")}</option>
            <option value="late">{v4("brtLate")}</option>
            <option value="peak">{v4("brtPeak")}</option>
            <option value="quiet">{v4("brtQuiet")}</option>
            {BAYS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("brtSpan")}</span>
          <select className="c4-select" aria-label={v4("brtSpan")} value={spanOn} onChange={(event) => setSpanFilter(event.target.value)}>
            <option value="all">{v4("brtAll")}</option>
            <option value="blank">{v4("brtBlankSpan")}</option>
            {SPANS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("brtRank")}</span>
          <select className="c4-select" aria-label={v4("brtRank")} value={rankOn} onChange={(event) => setRankFilter(event.target.value)}>
            <option value="all">{v4("brtAll")}</option>
            <option value="blank">{v4("brtResting")}</option>
            {WEIGHTS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>
      <div className="c4-brt-tools">
        <label className="c4-lab"><span>{v4("brtView")}</span><input className="c4-field" aria-label={v4("brtView")} aria-required={false} value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
          storeViews(addBerthView(views, { id: `view-${Date.now()}`, name: viewName, tray, query, clerk: clerkOn, cord: cordOn, pace: paceOn, hook: hookOn, span: spanOn, rank: rankOn }));
          setViewName("");
        }}>{v4("brtView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-brt-view">
            <button type="button" className="c4-chip" onClick={() => applyView(view)}>{v4("brtApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropBerthView(views, view.id))}>{v4("brtDropView")}</button>
          </span>
        ))}
      </div>
      <div className="c4-brt-tools">
        <label className="c4-lab"><span>{v4("brtBulkCord")}</span>
          <select className="c4-select" aria-label={v4("brtBulkCord")} value={moveCord} onChange={(event) => setMoveCord(event.target.value)}>
            {GLASSES.map((item) => <option key={item} value={item}>{cordLabel(v4, item)}</option>)}
          </select>
        </label>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkBerthCord(cards, picked, moveCord))}>{v4("brtBulkCord")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkBerthPin(cards, picked, true))}>{v4("brtBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkBerthArchive(cards, picked, true))}>{v4("brtBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkBerthPace(cards, picked, "sprint"))}>{v4("brtBulkPace")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkBerthTag(cards, picked, "e"))}>{v4("brtBulkTag")}</button>
      </div>
      <p className="c4-brt-keys">{v4("brtKeys")} {v4("brtEscape")} {v4("brtBoardKey")} {v4("brtPaceKey")} {v4("brtHoldKey")} {v4("brtSealKey")} {v4("brtPinKey")} {v4("brtSpanKey")}</p>
      {!shown.length && board === "hall" && <p className="c4-brt-empty">{v4("brtEmpty")}</p>}
      {board === "hall" ? (
        <ol className={`c4-brt-list ${density === "tight" ? "is-tight" : "is-airy"}`}>
          {shown.map((card, index) => (
            <li key={card.id} className="c4-brt-card" data-on={focus === index ? "1" : "0"} data-cord={card.cord.toLowerCase() || "blank"} data-late={lateBerth(card, deskHook) ? "1" : "0"} data-cooling={coolingBerth(card) ? "1" : "0"} data-peak={peakHook(card.hook) ? "1" : "0"} data-quiet={quietHook(card.hook) ? "1" : "0"} data-house={houseCord(card.cord) ? "1" : "0"}>
              <label className="c4-row">
                <input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={(event) => setPicked((ids) => event.target.checked ? [...ids, card.id] : ids.filter((id) => id !== card.id))} />
                <button type="button" className="c4-btn" data-on={focus === index ? "1" : "0"} onClick={() => setFocus(index)}>{v4("brtFocus")}</button>
              </label>
              {editing === card.id ? (
                <label className="c4-lab"><span>{v4("brtEdit")}</span><input className="c4-field" aria-label={v4("brtEdit")} value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={() => { if (!viewer) store(editBerth(cards, card.id, draft)); setEditing(""); }} /></label>
              ) : (
                <h3 className="c4-title">{card.title}</h3>
              )}
              <p>{card.clerk || v4("brtBlankClerk")} · {card.hook ?? v4("brtBlank")} · {cordLabel(v4, card.cord)} · {paceLabel(v4, card.pace)} · {card.span ?? v4("brtBlankSpan")} · {card.rank} · {card.tags.join(" ") || v4("brtBlank")} · {gapLabel(v4, card.hook, deskHook)} · {card.audit ? v4(AUDIT_KEY[card.audit] || "brtAuditSave") : ""}</p>
              {editing === `${card.id}-note` ? (
                <label className="c4-lab"><span>{v4("brtEditNote")}</span><input className="c4-field" aria-label={v4("brtEditNote")} aria-required={false} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} onBlur={() => { if (!viewer) store(editBerthNote(cards, card.id, noteDraft)); setEditing(""); }} /></label>
              ) : <p>{card.note}</p>}
              <div className="c4-row">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("brtEdit")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(`${card.id}-note`); setNoteDraft(card.note); }}>{v4("brtEditNote")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBerthPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("brtUnpin") : v4("brtPin")}</button>
                <button type="button" className="c4-btn" disabled={viewer || card.archived} onClick={() => store(setBerthHold(cards, card.id, !card.held))}>{card.held ? v4("brtResume") : v4("brtHold")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBerthArchive(cards, card.id, !card.archived))}>{card.archived ? v4("brtReopen") : v4("brtArchive")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cyclePace(cards, card.id))}>{v4("brtPace")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBerthSeal(cards, card.id, !card.seal))}>{card.seal ? v4("brtUnseal") : v4("brtSeal")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(snoozeBerth(cards, card.id))}>{v4("brtSnooze")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBerthRank(cards, card.id, card.rank === 8 ? "2" : card.rank === 5 ? "8" : "5"))}>{v4("brtRank")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addBerthTag(cards, card.id, "a"))}>{v4("brtTag")}</button>
                <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(berthCopy(card, deskHook)); setCopied(card.id); }}>{copied === card.id ? v4("brtCopied") : v4("brtCopy")}</button>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <ol className="c4-brt-timeline">
          {!book.length && <li className="c4-brt-empty">{v4("brtEmpty")}</li>}
          {timeline.map((lane) => (
            <li key={lane.hook}><span>{lane.hook}</span><strong>{lane.titles.join(" · ")}</strong></li>
          ))}
        </ol>
      )}
      <aside className="c4-brt-side" aria-label={v4("brtReminders")}>
        <h3 className="c4-title">{v4("brtReminders")}</h3>
        {!reminders.length && <p>{v4("brtEmpty")}</p>}
        <ul>{reminders.map((card) => <li key={card.id}>{card.title} · {lateBerth(card, deskHook) ? v4("brtLate") : v4("brtSame")}</li>)}</ul>
        <h3 className="c4-title">{v4("brtCooling")}</h3>
        {!cooling.length && <p>{v4("brtCoolingEmpty")}</p>}
        <ul>{cooling.map((card) => <li key={card.id}>{card.title}</li>)}</ul>
        {focused && <p>{v4("brtFocus")} {focused.title} · {berthShare(counts.house, Math.max(1, counts.open))}%</p>}
      </aside>
    </section>
  );
}

function slipNote(row: SlipRow): BadgeValue {
  return {
    name: textField(row.user?.name),
    check: textField(row.status),
    tier: methodLabel(row.method),
  };
}

export function BadgeMarks({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ requests?: SlipRow[] }>("/api/admin/withdrawals?take=24");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("all");
  const [tone, setTone] = useState("all");
  const [review, setReview] = useState<BadgeReview>("all");
  const [shape, setShape] = useState<BadgeShape>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const reviewRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  const rows = useMemo<BadgeRow[]>(() => {
    return (queue.data?.requests || []).map((row, index) => ({
      id: row.id ? `slip-${row.id}` : `slip-${index}`,
      label: textField(row.user?.name),
      note: slipNote(row),
    }));
  }, [queue.data?.requests]);
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
    const present = presentBadgeLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenBadges(readJson(BDG_KEY, []), present);
    const nextReviewed = readReviewedBadges(readJson(BDG_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(BDG_KEY, nextHidden);
    writeJson(BDG_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentBadgeLanes(rows);
  const lanes = visibleBadgeLanes(present, hidden, showHidden);
  const laneOn = activeBadgeLane(lane, present);
  const toneOn = activeBadgeTone(tone);
  const shown = visibleBadges(rows, badgeLaneArg(laneOn), badgeToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = badgeState(row.note);
      const token = state === "set" ? badgeLane(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return lanes.includes(token);
    });
  reviewRef.current = () => {
    const row = shown[focus];
    if (!row || viewer) return;
    const next = toggleBadgeReview(reviewed, row.id);
    setReviewed(next);
    writeJson(BDG_REVIEW_KEY, next);
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
        setFocus((index) => moveBerthFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveBerthFocus(index, shown.length, -1));
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
  const lead = leadingBadge(rows);
  const toneLead = leadingBadgeTone(rows);
  const shared = sharedBadgeCount(rows);
  const joined = joinedBadgeCount(rows);
  const bars = badgeLanes(rows).filter((line) => line.lane);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  const known = rows.filter((row) => badgeState(row.note) === "set").length;
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(BDG_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedBadges(next, ids);
    setReviewed(saved);
    writeJson(BDG_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-bdg" aria-label={v4("bdgTitle")} data-badges="1" data-desk="quay" data-queues={queue.data?.requests?.length ? "1" : "0"} data-role={role} data-keyed={joined ? "1" : "0"}>
      <header className="c4-bdg-mast">
        <p className="c4-bdg-seal" data-logo="mono">{v4("bdgLogo")}</p>
        <div>
          <p className="c4-bdg-kicker">{v4("bdgSub")}</p>
          <h2 className="c4-title">{v4("bdgTitle")}</h2>
        </div>
        <ol className="c4-bdg-index" aria-label={v4("bdgTitle")}>
          <li data-tone="gold">{v4("bdgCipher")}</li>
          <li data-tone="ink">{v4("bdgSeal")}</li>
          <li data-tone="wool">{v4("bdgHall")}</li>
        </ol>
      </header>
      <p className="c4-bdg-links">
        <Link href={crmv4Href(base, "withdraw")}>{v4("brtSub")}</Link>
        <Link href={crmv4Href(base, "brt")}>{v4("brtTitle")}</Link>
        <Link href={crmv4Href(base, "heatmap")}>{v4("bdgSub")}</Link>
      </p>
      {viewer && <p className="c4-bdg-note">{v4("bdgViewer")}</p>}
      <p className="c4-bdg-rule">{v4("bdgHint")}</p>
      <ul className="c4-bdg-kpis" aria-label={v4("bdgRules")}>
        <li><span>{v4("bdgSet")}</span><strong>{known}</strong></li>
        <li><span>{v4("bdgClear")}</span><strong>{rows.filter((row) => badgeState(row.note) === "clear").length}</strong></li>
        <li><span>{v4("bdgHall")}</span><strong>{hallBadgeCount(rows)}</strong></li>
        <li><span>{v4("bdgQueue")}</span><strong>{queueBadgeCount(rows)}</strong></li>
        <li><span>{v4("bdgGate")}</span><strong>{gateBadgeCount(rows)}</strong></li>
        <li><span>{v4("bdgSeal")}</span><strong>{sealBadgeCount(rows)}</strong></li>
        <li><span>{v4("bdgVault")}</span><strong>{vaultBadgeCount(rows)}</strong></li>
        <li><span>{v4("bdgCipher")}</span><strong>{cipherBadgeCount(rows)}</strong></li>
        <li><span>{v4("bdgGilt")}</span><strong>{giltBadgeCount(rows)}</strong></li>
        <li><span>{v4("bdgShare")}</span><strong>{badgeShare(joined, Math.max(1, known))}%</strong></li>
        <li><span>{v4("bdgShared")}</span><strong>{shared}</strong></li>
      </ul>
      <div className="c4-bdg-bars" aria-label={v4("bdgLead")}>
        {bars.map((bar) => (
          <div key={bar.lane} className="c4-bdg-bar" data-lane={bar.lane}>
            <span>{laneLabel(v4, bar.lane)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <p className="c4-bdg-meta">{lead ? `${v4("bdgLead")} ${laneLabel(v4, lead)}` : v4("bdgEmpty")} · {toneLead ? `${v4("bdgToneLead")} ${toneLabel(v4, toneLead)}` : v4("bdgUnmarked")} · {v4("bdgWide")} {rows.filter((row) => wideBadge(row.note)).length}</p>
      <label className="c4-lab"><span>{v4("bdgSearch")}</span><input ref={searchRef} className="c4-field c4-bdg-search" aria-label={v4("bdgSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <div className="c4-row" role="group" aria-label={v4("bdgAll")}>
        <button type="button" className="c4-chip" data-on={laneOn === "all" ? "1" : "0"} onClick={() => setLane("all")}>{v4("bdgAll")}</button>
        {present.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={laneOn === item ? "1" : "0"} onClick={() => setLane(item)}>{laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("bdgGilt")}>
        {(["all", "gilt", "pale", "linen", "ash", "haze"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={toneOn === item ? "1" : "0"} onClick={() => setTone(item)}>{item === "all" ? v4("bdgAll") : toneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("bdgShapeAll")}>
        {(["all", "join", "wide", "hall", "cipher", "seal"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>
            {item === "all" ? v4("bdgShapeAll") : item === "join" ? v4("bdgShapeJoin") : item === "wide" ? v4("bdgShapeWide") : item === "hall" ? v4("bdgShapeHall") : item === "cipher" ? v4("bdgShapeCipher") : v4("bdgShapeSeal")}
          </button>
        ))}
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview("reviewed")}>{v4("bdgReviewed")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview("fresh")}>{v4("bdgUnreviewed")}</button>
        <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} onClick={() => setReview("all")}>{v4("bdgAll")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("bdgShow")}</button>
      </div>
      <div className="c4-row">
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" data-on={hidden.includes(item) ? "1" : "0"} onClick={() => storeHidden(toggleBadge(hidden, item))}>{v4("bdgHide")} {laneLabel(v4, item)}</button>
        ))}
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkBadgeReview(reviewed, shown.map((row) => row.id), true))}>{v4("bdgBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkBadgeReview(reviewed, shown.map((row) => row.id), false))}>{v4("bdgBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("badge-lanes.csv", badgesCsv(rows))}>{v4("bdgCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("badge-rows.csv", badgeRowsCsv(rows, reviewed))}>{v4("bdgRowCsv")}</button>
      </div>
      <p className="c4-bdg-keys">{v4("brtKeys")} {v4("brtEscape")}</p>
      {!shown.length && <p className="c4-bdg-empty">{queue.error ? v4("bdgUnmarked") : v4("bdgEmpty")}</p>}
      <ol className="c4-bdg-list">
        {shown.map((row, index) => (
          <li key={row.id} className="c4-bdg-card" data-on={focus === index ? "1" : "0"} data-lane={badgeLane(row.note) || "blank"} data-tone={badgeTone(row.note) || "blank"} data-join={joinedBadge(row.note) ? "1" : "0"} data-wide={wideBadge(row.note) ? "1" : "0"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"}>
            <span className="c4-bdg-mark">{badgeSigil(row.note) || "—"}</span>
            <strong>{row.label || v4("bdgClear")}</strong>
            <span>{laneLabel(v4, badgeState(row.note) === "clear" ? "blank" : badgeLane(row.note))}</span>
            <span>{toneLabel(v4, badgeTone(row.note))}</span>
            <span>{v4("bdgStep")} {badgeStep(row.note)}</span>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleBadgeReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("bdgReviewed") : v4("bdgReview")}</button>
            <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(badgeCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("bdgCopied") : v4("bdgCopy")}</button>
          </li>
        ))}
      </ol>
    </section>
  );
}
