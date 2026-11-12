"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  OBV_DENSITY_KEY,
  OBV_KEY,
  OBV_VIEW_KEY,
  PSR_KEY,
  PSR_REVIEW_KEY,
  activeBay,
  activeGait,
  activeGlass,
  activePostureLane,
  activePostureTone,
  activeSpan,
  activeWatcher,
  activeWeight,
  addWatch,
  addWatchTag,
  addWatchView,
  adjacentWatchCount,
  bayArg,
  bayGap,
  bayWidth,
  bulkPostureReview,
  bulkWatchArchive,
  bulkWatchGait,
  bulkWatchGlass,
  bulkWatchPin,
  bulkWatchTag,
  busiestWatcher,
  cipherPostureCount,
  clashBayCount,
  coolingWatch,
  coolingWatches,
  cycleGait,
  dropWatchView,
  editWatch,
  editWatchNote,
  fairWatcher,
  gaitArg,
  gaitFocusedWatch,
  gatePostureCount,
  giltPostureCount,
  glassArg,
  hallPostureCount,
  holdFocusedWatch,
  houseGlass,
  joinedPosture,
  joinedPostureCount,
  lateWatch,
  lateWatchShare,
  leadingPosture,
  leadingPostureTone,
  matchedWatches,
  moveWatchFocus,
  nextWatch,
  pairWatchCount,
  peakBay,
  pinFocusedWatch,
  postureCopy,
  postureLane,
  postureLaneArg,
  postureLanes,
  postureRowsCsv,
  postureShare,
  postureSigil,
  postureState,
  postureStep,
  postureTone,
  postureToneArg,
  posturesCsv,
  presentPostureLanes,
  queuePostureCount,
  quietBay,
  quietHallWatches,
  readHiddenPostures,
  readReviewedPostures,
  readWatchViews,
  readWatches,
  reminderWatches,
  rushWatchLoad,
  sealFocusedWatch,
  sealPostureCount,
  setWatchArchive,
  setWatchHold,
  setWatchPin,
  setWatchSeal,
  setWatchWeight,
  sharedGlassCount,
  sharedPostureCount,
  snoozeFocusedWatch,
  snoozeWatch,
  sortWatches,
  spanArg,
  spanClashCount,
  suggestGlass,
  suggestSpan,
  suggestWatcher,
  togglePosture,
  togglePostureReview,
  vaultPostureCount,
  visiblePostureLanes,
  visiblePostures,
  visibleWatches,
  watchCopy,
  watchCounts,
  watchDensity,
  watchGlasses,
  watchIndex,
  watchShare,
  watchTimeline,
  watchWatchers,
  watcherArg,
  watchesCsv,
  weightArg,
  weightLoad,
  widePosture,
  type PostureReview,
  type PostureRow,
  type PostureShape,
  type PostureValue,
  type WatchCard,
  type WatchDensity,
  type WatchSort,
  type WatchTray,
  type WatchView,
} from "@/lib/crmv4/round237";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const GLASSES = ["flint", "crystal", "smoke"] as const;
const GAITS = ["still", "walk", "rush"] as const;
const SPANS = ["5", "15", "60"] as const;
const WEIGHTS = ["1", "4", "7"] as const;
const BAYS = ["1", "2", "3", "4", "5", "6", "7"] as const;

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "obvAuditSave",
  edit: "obvAuditEdit",
  note: "obvAuditNote",
  gait: "obvAuditGait",
  pin: "obvAuditPin",
  unpin: "obvAuditUnpin",
  hold: "obvAuditHold",
  resume: "obvAuditResume",
  archive: "obvAuditArchive",
  open: "obvAuditOpen",
  glass: "obvAuditGlass",
  tag: "obvAuditTag",
  weight: "obvAuditWeight",
  span: "obvAuditSpan",
  seal: "obvAuditSeal",
};

type TraderRow = { id?: string; name?: string | null; validationStatus?: string | null; accountType?: string | null };

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

function glassLabel(v4: V4, glass: string): string {
  if (glass === "FLINT" || glass === "flint") return v4("obvFlint");
  if (glass === "CRYSTAL" || glass === "crystal") return v4("obvCrystal");
  if (glass === "SMOKE" || glass === "smoke") return v4("obvSmoke");
  return v4("obvBlankGlass");
}

function gaitLabel(v4: V4, gait: string): string {
  if (gait === "still") return v4("obvStill");
  if (gait === "walk") return v4("obvWalk");
  if (gait === "rush") return v4("obvRush");
  return v4("obvBlankGait");
}

function laneLabel(v4: V4, lane: string): string {
  if (lane === "cipher") return v4("psrCipher");
  if (lane === "seal") return v4("psrSeal");
  if (lane === "queue") return v4("psrQueue");
  if (lane === "gate") return v4("psrGate");
  if (lane === "vault") return v4("psrVault");
  if (lane === "hall") return v4("psrHall");
  if (lane === "blank") return v4("psrClear");
  return v4("psrUnmarked");
}

function toneLabel(v4: V4, tone: string): string {
  if (tone === "gilt") return v4("psrGilt");
  if (tone === "pale") return v4("psrPale");
  if (tone === "linen") return v4("psrLinen");
  if (tone === "ash") return v4("psrAsh");
  if (tone === "haze") return v4("psrHaze");
  return v4("psrUnmarked");
}

function gapLabel(v4: V4, bay: number | null, desk: string): string {
  const gap = bayGap(bay, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("obvPast")} ${gap}`;
  if (gap < 0) return `${v4("obvAhead")} ${Math.abs(gap)}`;
  return v4("obvDue");
}

export function ObservatorySlips({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<WatchCard[]>([]);
  const [views, setViews] = useState<WatchView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [watcher, setWatcher] = useState("");
  const [bay, setBay] = useState("");
  const [glass, setGlass] = useState("");
  const [gait, setGait] = useState("");
  const [spanValue, setSpanValue] = useState("");
  const [weight, setWeight] = useState("");
  const [tag, setTag] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<WatchTray>("open");
  const [watcherFilter, setWatcherFilter] = useState("all");
  const [glassFilter, setGlassFilter] = useState("all");
  const [gaitFilter, setGaitFilter] = useState("all");
  const [bayFilter, setBayFilter] = useState("all");
  const [spanFilter, setSpanFilter] = useState("all");
  const [weightFilter, setWeightFilter] = useState("all");
  const [rushOnly, setRushOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [restingOnly, setRestingOnly] = useState(false);
  const [board, setBoard] = useState<"hall" | "index">("hall");
  const [order, setOrder] = useState<WatchSort>("bay");
  const [density, setDensity] = useState<WatchDensity>("airy");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [deskBay, setDeskBay] = useState("");
  const [moveGlass, setMoveGlass] = useState("crystal");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<() => void>(() => {});
  const spanRef = useRef<() => void>(() => {});
  const holdRef = useRef<() => void>(() => {});
  const gaitRef = useRef<() => void>(() => {});
  const sealRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readWatches(readJson(OBV_KEY, []));
    const saved = readWatchViews(readJson(OBV_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    setDensity(watchDensity(readJson(OBV_DENSITY_KEY, "airy")));
    writeJson(OBV_KEY, next);
    writeJson(OBV_VIEW_KEY, saved);
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: WatchCard[]) {
    const saved = readWatches(next);
    setCards(saved);
    writeJson(OBV_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((card) => card.id === id)));
  }
  function storeViews(next: WatchView[]) {
    const saved = readWatchViews(next);
    setViews(saved);
    writeJson(OBV_VIEW_KEY, saved);
  }
  function storeDensity(next: WatchDensity) {
    setDensity(next);
    writeJson(OBV_DENSITY_KEY, next);
  }
  const watchers = watchWatchers(cards);
  const glasses = watchGlasses(cards);
  const bars = GLASSES.map((item) => ({ glass: item.toUpperCase(), count: cards.filter((card) => card.glass === item.toUpperCase()).length })).filter((row) => row.count > 0);
  const watcherOn = activeWatcher(watcherFilter, watchers);
  const glassOn = activeGlass(glassFilter, ["FLINT", "CRYSTAL", "SMOKE", ...glasses]);
  const gaitOn = activeGait(gaitFilter, ["still", "walk", "rush"]);
  const bayOn = activeBay(bayFilter);
  const spanOn = activeSpan(spanFilter);
  const weightOn = activeWeight(weightFilter);
  const pickedBay = bayArg(bayOn);
  const shown = sortWatches(visibleWatches(
    cards,
    tray,
    query,
    watcherArg(watcherOn),
    glassArg(glassOn),
    gaitArg(gaitOn),
    pickedBay.exact,
    pickedBay.pick,
    spanArg(spanOn),
    weightArg(weightOn),
    rushOnly,
    peakOnly,
    houseOnly,
    quietOnly,
    restingOnly,
  ), order);
  const book = watchIndex(cards, query);
  const timeline = watchTimeline(cards);
  const counts = watchCounts(cards, deskBay);
  const share = lateWatchShare(cards, deskBay);
  const matched = matchedWatches(cards, deskBay);
  const clashes = clashBayCount(cards);
  const spans = spanClashCount(cards);
  const neighbors = adjacentWatchCount(cards);
  const suggestedGlass = suggestGlass(cards);
  const suggestedName = suggestWatcher(cards);
  const suggestedSpan = suggestSpan(cards);
  const fair = fairWatcher(cards, roster);
  const busy = busiestWatcher(cards);
  const reminders = reminderWatches(cards, deskBay);
  const cooling = coolingWatches(cards);
  const nextTitle = nextWatch(cards, deskBay);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  pinRef.current = () => {
    if (!viewer) store(pinFocusedWatch(cards, shown.map((card) => card.id), focus));
  };
  spanRef.current = () => {
    if (!viewer) store(snoozeFocusedWatch(cards, shown.map((card) => card.id), focus));
  };
  holdRef.current = () => {
    if (!viewer) store(holdFocusedWatch(cards, shown.map((card) => card.id), focus));
  };
  gaitRef.current = () => {
    if (!viewer) store(gaitFocusedWatch(cards, shown.map((card) => card.id), focus));
  };
  sealRef.current = () => {
    if (!viewer) store(sealFocusedWatch(cards, shown.map((card) => card.id), focus));
  };
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setTitle("");
        setNote("");
        setWatcher("");
        setBay("");
        setGlass("");
        setGait("");
        setSpanValue("");
        setWeight("");
        setTag("");
        setQuery("");
        setEditing("");
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveWatchFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveWatchFocus(index, shown.length, -1));
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
        gaitRef.current();
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
  function saveWatch() {
    if (viewer) return;
    store(addWatch(cards, {
      id: `obv-${Date.now()}`,
      title,
      note,
      watcher,
      bay,
      glass,
      gait,
      span: spanValue,
      weight,
      tags: tag,
    }));
    setTitle("");
    setNote("");
    setTag("");
  }
  function applyView(view: WatchView) {
    setTray(view.tray);
    setQuery(view.query);
    setWatcherFilter(view.watcher || "all");
    setGlassFilter(view.glass || "all");
    setGaitFilter(view.gait || "all");
    setBayFilter(view.bay || "all");
    setSpanFilter(view.span || "all");
    setWeightFilter(view.weight || "all");
  }
  const focused = shown[focus];
  return (
    <section className="c4-obv" aria-label={v4("obvTitle")} data-slips="1" data-desk="observatory" data-role={role} data-board={board} data-density={density}>
      <header className="c4-obv-mast">
        <p className="c4-obv-seal" data-logo="mono">{v4("obvLogo")}</p>
        <div>
          <p className="c4-obv-kicker">{v4("obvSub")}</p>
          <h2 className="c4-title">{v4("obvTitle")}</h2>
        </div>
        <p className="c4-obv-links">
          <Link href={crmv4Href(base, "risk")}>{v4("obvSub")}</Link>
          <Link href={crmv4Href(base, "psr")}>{v4("psrTitle")}</Link>
        </p>
      </header>
      {viewer && <p className="c4-obv-note">{v4("obvViewer")}</p>}
      <p className="c4-obv-rule">{v4("obvHint")}</p>
      <ul className="c4-obv-kpis" aria-label={v4("obvKpi")}>
        <li><span>{v4("obvOpen")}</span><strong>{counts.open}</strong></li>
        <li><span>{v4("obvHeld")}</span><strong>{counts.held}</strong></li>
        <li><span>{v4("obvArchived")}</span><strong>{counts.archived}</strong></li>
        <li><span>{v4("obvPinned")}</span><strong>{counts.pinned}</strong></li>
        <li><span>{v4("obvPeak")}</span><strong>{counts.peak}</strong></li>
        <li><span>{v4("obvLate")}</span><strong>{counts.late}</strong></li>
        <li><span>{v4("obvSame")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("obvRaised")}</span><strong>{counts.weight}</strong></li>
        <li><span>{v4("obvHouse")}</span><strong>{counts.house}</strong></li>
        <li><span>{v4("obvWindow")}</span><strong>{counts.window}</strong></li>
        <li><span>{v4("obvMatched")}</span><strong>{matched}</strong></li>
        <li><span>{v4("obvSeal")}</span><strong>{counts.seal}</strong></li>
        <li><span>{v4("obvCooling")}</span><strong>{counts.cooling}</strong></li>
      </ul>
      <div className="c4-obv-bars" aria-label={v4("obvGlasses")}>
        {bars.map((bar) => (
          <div key={bar.glass} className="c4-obv-bar" data-glass={bar.glass.toLowerCase()}>
            <span>{glassLabel(v4, bar.glass)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <p className="c4-obv-meta">
        {v4("obvLateShare")} {share}% · {v4("obvSuggestGlass")} {glassLabel(v4, suggestedGlass)} · {v4("obvSuggestSpan")} {suggestedSpan} · {v4("obvSuggestWatcher")} {suggestedName || v4("obvBlankWatcher")} · {v4("obvAssign")} {fair || v4("obvBlankWatcher")} · {busy ? `${v4("obvBusiest")} ${busy}` : v4("obvBusiestNone")} · {clashes ? `${v4("obvClash")} ${clashes}` : v4("obvClashNone")} · {v4("obvSpanClash")} {spans} · {neighbors ? `${v4("obvNeighbors")} ${neighbors}` : v4("obvNeighborsNone")} · {v4("obvLoad")} {weightLoad(cards)} · {v4("obvPair")} {pairWatchCount(cards)} · {v4("obvShared")} {sharedGlassCount(cards)} · {v4("obvQuietHall")} {quietHallWatches(cards)} · {v4("obvRush")} {rushWatchLoad(cards)} · {v4("obvBayWidth")} {bayWidth(cards)} · {v4("obvBays")} {new Set(cards.map((card) => card.bay).filter((item) => item !== null)).size} · {nextTitle ? `${v4("obvNext")} ${nextTitle}` : v4("obvNextNone")}
      </p>
      <div className="c4-obv-tools">
        <label className="c4-lab"><span>{v4("obvTitleField")}</span><input ref={titleRef} className="c4-field" aria-label={v4("obvTitleField")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("obvNote")}</span><input className="c4-field" aria-label={v4("obvNote")} aria-required={false} value={note} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("obvWatcher")}</span><input className="c4-field" aria-label={v4("obvWatcher")} aria-required={false} value={watcher} onChange={(event) => setWatcher(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("obvBay")}</span>
          <select className="c4-select" aria-label={v4("obvBay")} value={bay} onChange={(event) => setBay(event.target.value)}>
            <option value="">{v4("obvBlank")}</option>
            {BAYS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("obvGlass")}</span>
          <select className="c4-select" aria-label={v4("obvGlass")} value={glass} onChange={(event) => setGlass(event.target.value)}>
            <option value="">{v4("obvBlankGlass")}</option>
            {GLASSES.map((item) => <option key={item} value={item}>{glassLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("obvGait")}</span>
          <select className="c4-select" aria-label={v4("obvGait")} value={gait} onChange={(event) => setGait(event.target.value)}>
            <option value="">{v4("obvBlankGait")}</option>
            {GAITS.map((item) => <option key={item} value={item}>{gaitLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("obvSpan")}</span>
          <select className="c4-select" aria-label={v4("obvSpan")} value={spanValue} onChange={(event) => setSpanValue(event.target.value)}>
            <option value="">{v4("obvBlankSpan")}</option>
            {SPANS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("obvWeight")}</span>
          <select className="c4-select" aria-label={v4("obvWeight")} value={weight} onChange={(event) => setWeight(event.target.value)}>
            <option value="">{v4("obvResting")}</option>
            {WEIGHTS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("obvTag")}</span><input className="c4-field" aria-label={v4("obvTag")} aria-required={false} value={tag} onChange={(event) => setTag(event.target.value)} /></label>
        <button type="button" className="c4-btn c4-btn-hot" disabled={viewer} onClick={saveWatch}>{v4("obvAdd")}</button>
      </div>
      <div className="c4-obv-tools">
        <label className="c4-lab"><span>{v4("obvDesk")}</span><input className="c4-field" aria-label={v4("obvDesk")} aria-required={false} value={deskBay} onChange={(event) => setDeskBay(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("obvRoster")}</span><input className="c4-field" aria-label={v4("obvRoster")} aria-required={false} value={roster} onChange={(event) => setRoster(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("obvSearch")}</span><input ref={searchRef} className="c4-field c4-obv-search" aria-label={v4("obvSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <button type="button" className="c4-btn" onClick={() => storeDensity(density === "airy" ? "tight" : "airy")}>{density === "airy" ? v4("obvDensityTight") : v4("obvDensityAiry")}</button>
        <button type="button" className="c4-btn" data-on={order === "bay" ? "1" : "0"} onClick={() => setOrder("bay")}>{v4("obvSortBay")}</button>
        <button type="button" className="c4-btn" data-on={order === "watcher" ? "1" : "0"} onClick={() => setOrder("watcher")}>{v4("obvSortWatcher")}</button>
        <button type="button" className="c4-btn" data-on={board === "hall" ? "1" : "0"} onClick={() => setBoard("hall")}>{v4("obvBoardHall")}</button>
        <button type="button" className="c4-btn" data-on={board === "index" ? "1" : "0"} onClick={() => setBoard("index")}>{v4("obvBoardIndex")}</button>
        <button type="button" className="c4-btn" onClick={() => download("observatory-slips.csv", watchesCsv(cards, deskBay))}>{v4("obvCsv")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("obvOpen")}>
        {(["open", "held", "archived"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("obvOpen") : item === "held" ? v4("obvHeld") : v4("obvArchived")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={rushOnly ? "1" : "0"} onClick={() => setRushOnly((value) => !value)}>{v4("obvRushOnly")}</button>
        <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((value) => !value)}>{v4("obvPeakOnly")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((value) => !value)}>{v4("obvQuietOnly")}</button>
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("obvHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={restingOnly ? "1" : "0"} onClick={() => setRestingOnly((value) => !value)}>{v4("obvRestingOnly")}</button>
      </div>
      <div className="c4-obv-tools">
        <label className="c4-lab"><span>{v4("obvWatcher")}</span>
          <select className="c4-select" aria-label={v4("obvWatcher")} value={watcherOn} onChange={(event) => setWatcherFilter(event.target.value)}>
            <option value="all">{v4("obvAll")}</option>
            <option value="blank">{v4("obvBlankWatcher")}</option>
            {watchers.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("obvGlass")}</span>
          <select className="c4-select" aria-label={v4("obvGlass")} value={glassOn} onChange={(event) => setGlassFilter(event.target.value)}>
            <option value="all">{v4("obvAll")}</option>
            <option value="blank">{v4("obvBlankGlass")}</option>
            {GLASSES.map((item) => <option key={item} value={item.toUpperCase()}>{glassLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("obvGait")}</span>
          <select className="c4-select" aria-label={v4("obvGait")} value={gaitOn} onChange={(event) => setGaitFilter(event.target.value)}>
            <option value="all">{v4("obvAll")}</option>
            <option value="blank">{v4("obvBlankGait")}</option>
            {GAITS.map((item) => <option key={item} value={item}>{gaitLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("obvBay")}</span>
          <select className="c4-select" aria-label={v4("obvBay")} value={bayOn} onChange={(event) => setBayFilter(event.target.value)}>
            <option value="all">{v4("obvAll")}</option>
            <option value="blank">{v4("obvBlank")}</option>
            <option value="early">{v4("obvEarly")}</option>
            <option value="mid">{v4("obvMid")}</option>
            <option value="late">{v4("obvLate")}</option>
            <option value="peak">{v4("obvPeak")}</option>
            <option value="quiet">{v4("obvQuiet")}</option>
            {BAYS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("obvSpan")}</span>
          <select className="c4-select" aria-label={v4("obvSpan")} value={spanOn} onChange={(event) => setSpanFilter(event.target.value)}>
            <option value="all">{v4("obvAll")}</option>
            <option value="blank">{v4("obvBlankSpan")}</option>
            {SPANS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("obvWeight")}</span>
          <select className="c4-select" aria-label={v4("obvWeight")} value={weightOn} onChange={(event) => setWeightFilter(event.target.value)}>
            <option value="all">{v4("obvAll")}</option>
            <option value="blank">{v4("obvResting")}</option>
            {WEIGHTS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>
      <div className="c4-obv-tools">
        <label className="c4-lab"><span>{v4("obvView")}</span><input className="c4-field" aria-label={v4("obvView")} aria-required={false} value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
          storeViews(addWatchView(views, { id: `view-${Date.now()}`, name: viewName, tray, query, watcher: watcherOn, glass: glassOn, gait: gaitOn, bay: bayOn, span: spanOn, weight: weightOn }));
          setViewName("");
        }}>{v4("obvView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-obv-view">
            <button type="button" className="c4-chip" onClick={() => applyView(view)}>{v4("obvApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropWatchView(views, view.id))}>{v4("obvDropView")}</button>
          </span>
        ))}
      </div>
      <div className="c4-obv-tools">
        <label className="c4-lab"><span>{v4("obvBulkGlass")}</span>
          <select className="c4-select" aria-label={v4("obvBulkGlass")} value={moveGlass} onChange={(event) => setMoveGlass(event.target.value)}>
            {GLASSES.map((item) => <option key={item} value={item}>{glassLabel(v4, item)}</option>)}
          </select>
        </label>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkWatchGlass(cards, picked, moveGlass))}>{v4("obvBulkGlass")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkWatchPin(cards, picked, true))}>{v4("obvBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkWatchArchive(cards, picked, true))}>{v4("obvBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkWatchGait(cards, picked, "rush"))}>{v4("obvBulkGait")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkWatchTag(cards, picked, "a"))}>{v4("obvBulkTag")}</button>
      </div>
      <p className="c4-obv-keys">{v4("obvKeys")} {v4("obvEscape")} {v4("obvBoardKey")} {v4("obvGaitKey")} {v4("obvHoldKey")} {v4("obvSealKey")} {v4("obvPinKey")} {v4("obvSpanKey")}</p>
      {!shown.length && board === "hall" && <p className="c4-obv-empty">{v4("obvEmpty")}</p>}
      {board === "hall" ? (
        <ol className={`c4-obv-list ${density === "tight" ? "is-tight" : "is-airy"}`}>
          {shown.map((card, index) => (
            <li key={card.id} className="c4-obv-card" data-on={focus === index ? "1" : "0"} data-glass={card.glass.toLowerCase() || "blank"} data-late={lateWatch(card, deskBay) ? "1" : "0"} data-cooling={coolingWatch(card) ? "1" : "0"} data-peak={peakBay(card.bay) ? "1" : "0"} data-quiet={quietBay(card.bay) ? "1" : "0"} data-house={houseGlass(card.glass) ? "1" : "0"}>
              <label className="c4-row">
                <input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={(event) => setPicked((ids) => event.target.checked ? [...ids, card.id] : ids.filter((id) => id !== card.id))} />
                <button type="button" className="c4-btn" data-on={focus === index ? "1" : "0"} onClick={() => setFocus(index)}>{v4("obvFocus")}</button>
              </label>
              {editing === card.id ? (
                <label className="c4-lab"><span>{v4("obvEdit")}</span><input className="c4-field" aria-label={v4("obvEdit")} value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={() => { if (!viewer) store(editWatch(cards, card.id, draft)); setEditing(""); }} /></label>
              ) : (
                <h3 className="c4-title">{card.title}</h3>
              )}
              <p>{card.watcher || v4("obvBlankWatcher")} · {card.bay ?? v4("obvBlank")} · {glassLabel(v4, card.glass)} · {gaitLabel(v4, card.gait)} · {card.span ?? v4("obvBlankSpan")} · {card.weight} · {card.tags.join(" ") || v4("obvBlank")} · {gapLabel(v4, card.bay, deskBay)} · {card.audit ? v4(AUDIT_KEY[card.audit] || "obvAuditSave") : ""}</p>
              {editing === `${card.id}-note` ? (
                <label className="c4-lab"><span>{v4("obvEditNote")}</span><input className="c4-field" aria-label={v4("obvEditNote")} aria-required={false} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} onBlur={() => { if (!viewer) store(editWatchNote(cards, card.id, noteDraft)); setEditing(""); }} /></label>
              ) : <p>{card.note}</p>}
              <div className="c4-row">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("obvEdit")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(`${card.id}-note`); setNoteDraft(card.note); }}>{v4("obvEditNote")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setWatchPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("obvUnpin") : v4("obvPin")}</button>
                <button type="button" className="c4-btn" disabled={viewer || card.archived} onClick={() => store(setWatchHold(cards, card.id, !card.held))}>{card.held ? v4("obvResume") : v4("obvHold")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setWatchArchive(cards, card.id, !card.archived))}>{card.archived ? v4("obvReopen") : v4("obvArchive")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleGait(cards, card.id))}>{v4("obvGait")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setWatchSeal(cards, card.id, !card.seal))}>{card.seal ? v4("obvUnseal") : v4("obvSeal")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(snoozeWatch(cards, card.id))}>{v4("obvSnooze")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setWatchWeight(cards, card.id, card.weight === 7 ? "1" : card.weight === 4 ? "7" : "4"))}>{v4("obvWeight")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addWatchTag(cards, card.id, "a"))}>{v4("obvTag")}</button>
                <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(watchCopy(card, deskBay)); setCopied(card.id); }}>{copied === card.id ? v4("obvCopied") : v4("obvCopy")}</button>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <ol className="c4-obv-timeline">
          {!book.length && <li className="c4-obv-empty">{v4("obvEmpty")}</li>}
          {timeline.map((lane) => (
            <li key={lane.bay}><span>{lane.bay}</span><strong>{lane.titles.join(" · ")}</strong></li>
          ))}
        </ol>
      )}
      <aside className="c4-obv-side" aria-label={v4("obvReminders")}>
        <h3 className="c4-title">{v4("obvReminders")}</h3>
        {!reminders.length && <p>{v4("obvEmpty")}</p>}
        <ul>{reminders.map((card) => <li key={card.id}>{card.title} · {lateWatch(card, deskBay) ? v4("obvLate") : v4("obvSame")}</li>)}</ul>
        <h3 className="c4-title">{v4("obvCooling")}</h3>
        {!cooling.length && <p>{v4("obvCoolingEmpty")}</p>}
        <ul>{cooling.map((card) => <li key={card.id}>{card.title}</li>)}</ul>
        {focused && <p>{v4("obvFocus")} {focused.title} · {watchShare(counts.house, Math.max(1, counts.open))}%</p>}
      </aside>
    </section>
  );
}

function traderNote(row: TraderRow): PostureValue {
  return {
    name: textField(row.name),
    check: textField(row.validationStatus),
    tier: textField(row.accountType),
  };
}

export function PostureMarks({ base, v4 }: { base: string; v4: V4 }) {
  const leads = useJson<{ users?: TraderRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("all");
  const [tone, setTone] = useState("all");
  const [review, setReview] = useState<PostureReview>("all");
  const [shape, setShape] = useState<PostureShape>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const reviewRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  const rows = useMemo<PostureRow[]>(() => {
    return (leads.data?.users || []).map((row, index) => ({
      id: row.id ? `lead-${row.id}` : `lead-${index}`,
      label: textField(row.name),
      note: traderNote(row),
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
    const present = presentPostureLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenPostures(readJson(PSR_KEY, []), present);
    const nextReviewed = readReviewedPostures(readJson(PSR_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(PSR_KEY, nextHidden);
    writeJson(PSR_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentPostureLanes(rows);
  const lanes = visiblePostureLanes(present, hidden, showHidden);
  const laneOn = activePostureLane(lane, present);
  const toneOn = activePostureTone(tone);
  const shown = visiblePostures(rows, postureLaneArg(laneOn), postureToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = postureState(row.note);
      const token = state === "set" ? postureLane(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return lanes.includes(token);
    });
  reviewRef.current = () => {
    const row = shown[focus];
    if (!row || viewer) return;
    const next = togglePostureReview(reviewed, row.id);
    setReviewed(next);
    writeJson(PSR_REVIEW_KEY, next);
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
        setFocus((index) => moveWatchFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveWatchFocus(index, shown.length, -1));
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
  const lead = leadingPosture(rows);
  const toneLead = leadingPostureTone(rows);
  const shared = sharedPostureCount(rows);
  const joined = joinedPostureCount(rows);
  const bars = postureLanes(rows).filter((line) => line.lane);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  const known = rows.filter((row) => postureState(row.note) === "set").length;
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(PSR_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedPostures(next, ids);
    setReviewed(saved);
    writeJson(PSR_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-psr" aria-label={v4("psrTitle")} data-postures="1" data-desk="observatory" data-traders={leads.data?.users?.length ? "1" : "0"} data-role={role} data-keyed={joined ? "1" : "0"}>
      <header className="c4-psr-mast">
        <p className="c4-psr-seal" data-logo="mono">{v4("psrLogo")}</p>
        <div>
          <p className="c4-psr-kicker">{v4("psrSub")}</p>
          <h2 className="c4-title">{v4("psrTitle")}</h2>
        </div>
        <ol className="c4-psr-index" aria-label={v4("psrTitle")}>
          <li data-tone="gold">{v4("psrCipher")}</li>
          <li data-tone="ink">{v4("psrSeal")}</li>
          <li data-tone="wool">{v4("psrHall")}</li>
        </ol>
      </header>
      <p className="c4-psr-links">
        <Link href={crmv4Href(base, "risk")}>{v4("obvSub")}</Link>
        <Link href={crmv4Href(base, "obv")}>{v4("obvTitle")}</Link>
        <Link href={crmv4Href(base, "insights")}>{v4("psrSub")}</Link>
      </p>
      {viewer && <p className="c4-psr-note">{v4("psrViewer")}</p>}
      <p className="c4-psr-rule">{v4("psrHint")}</p>
      <ul className="c4-psr-kpis" aria-label={v4("psrRules")}>
        <li><span>{v4("psrSet")}</span><strong>{known}</strong></li>
        <li><span>{v4("psrClear")}</span><strong>{rows.filter((row) => postureState(row.note) === "clear").length}</strong></li>
        <li><span>{v4("psrHall")}</span><strong>{hallPostureCount(rows)}</strong></li>
        <li><span>{v4("psrQueue")}</span><strong>{queuePostureCount(rows)}</strong></li>
        <li><span>{v4("psrGate")}</span><strong>{gatePostureCount(rows)}</strong></li>
        <li><span>{v4("psrSeal")}</span><strong>{sealPostureCount(rows)}</strong></li>
        <li><span>{v4("psrVault")}</span><strong>{vaultPostureCount(rows)}</strong></li>
        <li><span>{v4("psrCipher")}</span><strong>{cipherPostureCount(rows)}</strong></li>
        <li><span>{v4("psrGilt")}</span><strong>{giltPostureCount(rows)}</strong></li>
        <li><span>{v4("psrShare")}</span><strong>{postureShare(joined, Math.max(1, known))}%</strong></li>
        <li><span>{v4("psrShared")}</span><strong>{shared}</strong></li>
      </ul>
      <div className="c4-psr-bars" aria-label={v4("psrLead")}>
        {bars.map((bar) => (
          <div key={bar.lane} className="c4-psr-bar" data-lane={bar.lane}>
            <span>{laneLabel(v4, bar.lane)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <p className="c4-psr-meta">{lead ? `${v4("psrLead")} ${laneLabel(v4, lead)}` : v4("psrEmpty")} · {toneLead ? `${v4("psrToneLead")} ${toneLabel(v4, toneLead)}` : v4("psrUnmarked")} · {v4("psrWide")} {rows.filter((row) => widePosture(row.note)).length}</p>
      <label className="c4-lab"><span>{v4("psrSearch")}</span><input ref={searchRef} className="c4-field c4-psr-search" aria-label={v4("psrSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <div className="c4-row" role="group" aria-label={v4("psrAll")}>
        <button type="button" className="c4-chip" data-on={laneOn === "all" ? "1" : "0"} onClick={() => setLane("all")}>{v4("psrAll")}</button>
        {present.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={laneOn === item ? "1" : "0"} onClick={() => setLane(item)}>{laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("psrGilt")}>
        {(["all", "gilt", "pale", "linen", "ash", "haze"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={toneOn === item ? "1" : "0"} onClick={() => setTone(item)}>{item === "all" ? v4("psrAll") : toneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("psrShapeAll")}>
        {(["all", "join", "wide", "hall", "cipher", "seal"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>
            {item === "all" ? v4("psrShapeAll") : item === "join" ? v4("psrShapeJoin") : item === "wide" ? v4("psrShapeWide") : item === "hall" ? v4("psrShapeHall") : item === "cipher" ? v4("psrShapeCipher") : v4("psrShapeSeal")}
          </button>
        ))}
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview("reviewed")}>{v4("psrReviewed")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview("fresh")}>{v4("psrUnreviewed")}</button>
        <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} onClick={() => setReview("all")}>{v4("psrAll")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("psrShow")}</button>
      </div>
      <div className="c4-row">
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" data-on={hidden.includes(item) ? "1" : "0"} onClick={() => storeHidden(togglePosture(hidden, item))}>{v4("psrHide")} {laneLabel(v4, item)}</button>
        ))}
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkPostureReview(reviewed, shown.map((row) => row.id), true))}>{v4("psrBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkPostureReview(reviewed, shown.map((row) => row.id), false))}>{v4("psrBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("posture-lanes.csv", posturesCsv(rows))}>{v4("psrCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("posture-rows.csv", postureRowsCsv(rows, reviewed))}>{v4("psrRowCsv")}</button>
      </div>
      <p className="c4-psr-keys">{v4("obvKeys")} {v4("obvEscape")}</p>
      {!shown.length && <p className="c4-psr-empty">{leads.error ? v4("psrUnmarked") : v4("psrEmpty")}</p>}
      <ol className="c4-psr-list">
        {shown.map((row, index) => (
          <li key={row.id} className="c4-psr-card" data-on={focus === index ? "1" : "0"} data-lane={postureLane(row.note) || "blank"} data-tone={postureTone(row.note) || "blank"} data-join={joinedPosture(row.note) ? "1" : "0"} data-wide={widePosture(row.note) ? "1" : "0"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"}>
            <span className="c4-psr-mark">{postureSigil(row.note) || "—"}</span>
            <strong>{row.label || v4("psrClear")}</strong>
            <span>{laneLabel(v4, postureState(row.note) === "clear" ? "blank" : postureLane(row.note))}</span>
            <span>{toneLabel(v4, postureTone(row.note))}</span>
            <span>{v4("psrStep")} {postureStep(row.note)}</span>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(togglePostureReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("psrReviewed") : v4("psrReview")}</button>
            <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(postureCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("psrCopied") : v4("psrCopy")}</button>
          </li>
        ))}
      </ol>
    </section>
  );
}
