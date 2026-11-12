"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  DLG_KEY,
  DLG_REVIEW_KEY,
  RSL_DENSITY_KEY,
  RSL_KEY,
  RSL_VIEW_KEY,
  activeBell,
  activeDialectLane,
  activeDialectTone,
  activeTemper,
  activeRank,
  activeBench,
  activeGrain,
  activeSlipSteward,
  addSlip,
  addSlipTag,
  addSlipView,
  adjacentSlipCount,
  bulkDialectReview,
  bulkSlipArchive,
  bulkSlipTemper,
  bulkSlipPin,
  bulkSlipTag,
  bulkSlipGrain,
  busiestSlipSteward,
  bellArg,
  bellClashCount,
  clashBenchCount,
  scrollDialectCount,
  coolingSlip,
  coolingSlips,
  cycleTemper,
  dropSlipView,
  editSlip,
  editSlipNote,
  fairSlipSteward,
  guestDialectCount,
  glyphDialectCount,
  giltDialectCount,
  hallDialectCount,
  holdFocusedSlip,
  houseGrain,
  joinedDialect,
  joinedDialectCount,
  houseDialectCount,
  lateSlip,
  lateSlipShare,
  leadingDialect,
  leadingDialectTone,
  dialectCopy,
  dialectLane,
  dialectLaneArg,
  dialectLanes,
  dialectRowsCsv,
  dialectShare,
  dialectSigil,
  dialectState,
  dialectStep,
  dialectTone,
  dialectToneArg,
  dialectsCsv,
  matchedSlips,
  moveSlipFocus,
  nextSlip,
  temperArg,
  temperFocusedSlip,
  pairSlipCount,
  peakBench,
  pinFocusedSlip,
  presentDialectLanes,
  quietHallSlips,
  quietBench,
  rankArg,
  rankLoad,
  readHiddenDialects,
  readReviewedDialects,
  readSlipViews,
  readSlips,
  reminderSlips,
  deskDialectCount,
  hotSlipLoad,
  setSlipArchive,
  setSlipHold,
  setSlipPin,
  setSlipRank,
  setSlipWax,
  sharedDialectCount,
  sharedGrainCount,
  benchArg,
  benchGap,
  benchWidth,
  snoozeFocusedSlip,
  snoozeSlip,
  sortSlips,
  suggestBell,
  suggestGrain,
  suggestSlipSteward,
  grainArg,
  toggleDialect,
  toggleDialectReview,
  slipCopy,
  slipCounts,
  slipDensity,
  slipStewardArg,
  slipStewards,
  slipIndex,
  slipShare,
  slipGrains,
  slipsCsv,
  visibleDialectLanes,
  visibleDialects,
  visibleSlips,
  waxFocusedSlip,
  wideDialect,
  type DialectReview,
  type DialectRow,
  type DialectShape,
  type DialectValue,
  type SlipCard,
  type SlipDensity,
  type SlipSort,
  type SlipTray,
  type SlipView,
} from "@/lib/crmv4/round236";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const GRAINS = ["barley", "rye", "wheat"] as const;
const TEMPERS = ["cool", "even", "hot"] as const;
const BELLS = ["10", "20", "40"] as const;
const RANKS = ["0", "2", "5"] as const;
const BENCHES = ["1", "2", "3", "4", "5", "6"] as const;

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "rslAuditSave",
  edit: "rslAuditEdit",
  note: "rslAuditNote",
  temper: "rslAuditTemper",
  pin: "rslAuditPin",
  unpin: "rslAuditUnpin",
  hold: "rslAuditHold",
  resume: "rslAuditResume",
  archive: "rslAuditArchive",
  open: "rslAuditOpen",
  grain: "rslAuditGrain",
  tag: "rslAuditTag",
  rank: "rslAuditRank",
  bell: "rslAuditBell",
  wax: "rslAuditWax",
};

type TraderRow = { id?: string; name?: string | null; language?: string | null; country?: string | null };

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

function grainLabel(v4: V4, grain: string): string {
  if (grain === "BARLEY" || grain === "barley") return v4("rslBarley");
  if (grain === "RYE" || grain === "rye") return v4("rslRye");
  if (grain === "WHEAT" || grain === "wheat") return v4("rslWheat");
  return v4("rslBlankGrain");
}

function temperLabel(v4: V4, temper: string): string {
  if (temper === "cool") return v4("rslCool");
  if (temper === "even") return v4("rslEven");
  if (temper === "hot") return v4("rslHot");
  return v4("rslBlankTemper");
}

function laneLabel(v4: V4, lane: string): string {
  if (lane === "glyph") return v4("dlgGlyph");
  if (lane === "house") return v4("dlgHouse");
  if (lane === "desk") return v4("dlgDesk");
  if (lane === "guest") return v4("dlgGuest");
  if (lane === "scroll") return v4("dlgScroll");
  if (lane === "hall") return v4("dlgHall");
  if (lane === "blank") return v4("dlgClear");
  return v4("dlgUnmarked");
}

function toneLabel(v4: V4, tone: string): string {
  if (tone === "gilt") return v4("dlgGilt");
  if (tone === "pale") return v4("dlgPale");
  if (tone === "linen") return v4("dlgLinen");
  if (tone === "ash") return v4("dlgAsh");
  if (tone === "haze") return v4("dlgHaze");
  return v4("dlgUnmarked");
}

function gapLabel(v4: V4, bench: number | null, desk: string): string {
  const gap = benchGap(bench, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("rslPast")} ${gap}`;
  if (gap < 0) return `${v4("rslAhead")} ${Math.abs(gap)}`;
  return v4("rslDue");
}

export function RefectorySlips({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<SlipCard[]>([]);
  const [views, setViews] = useState<SlipView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [steward, setSteward] = useState("");
  const [bench, setBench] = useState("");
  const [grain, setGrain] = useState("");
  const [temper, setTemper] = useState("");
  const [bellValue, setBellValue] = useState("");
  const [rank, setRank] = useState("");
  const [tag, setTag] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<SlipTray>("open");
  const [stewardFilter, setStewardFilter] = useState("all");
  const [grainFilter, setGrainFilter] = useState("all");
  const [temperFilter, setTemperFilter] = useState("all");
  const [benchFilter, setBenchFilter] = useState("all");
  const [bellFilter, setBellFilter] = useState("all");
  const [rankFilter, setRankFilter] = useState("all");
  const [hotOnly, setHotOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [restingOnly, setRestingOnly] = useState(false);
  const [board, setBoard] = useState<"hall" | "index">("hall");
  const [order, setOrder] = useState<SlipSort>("bench");
  const [density, setDensity] = useState<SlipDensity>("airy");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [deskBench, setDeskBench] = useState("");
  const [moveGrain, setMoveGrain] = useState("wheat");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<() => void>(() => {});
  const bellRef = useRef<() => void>(() => {});
  const holdRef = useRef<() => void>(() => {});
  const temperRef = useRef<() => void>(() => {});
  const waxRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readSlips(readJson(RSL_KEY, []));
    const saved = readSlipViews(readJson(RSL_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    setDensity(slipDensity(readJson(RSL_DENSITY_KEY, "airy")));
    writeJson(RSL_KEY, next);
    writeJson(RSL_VIEW_KEY, saved);
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: SlipCard[]) {
    const saved = readSlips(next);
    setCards(saved);
    writeJson(RSL_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((card) => card.id === id)));
  }
  function storeViews(next: SlipView[]) {
    const saved = readSlipViews(next);
    setViews(saved);
    writeJson(RSL_VIEW_KEY, saved);
  }
  function storeDensity(next: SlipDensity) {
    setDensity(next);
    writeJson(RSL_DENSITY_KEY, next);
  }
  const stewards = slipStewards(cards);
  const grains = slipGrains(cards);
  const bars = GRAINS.map((item) => ({ grain: item.toUpperCase(), count: cards.filter((card) => card.grain === item.toUpperCase()).length })).filter((row) => row.count > 0);
  const stewardOn = activeSlipSteward(stewardFilter, stewards);
  const grainOn = activeGrain(grainFilter, ["BARLEY", "ASH", "WHEAT", ...grains]);
  const temperOn = activeTemper(temperFilter, ["cool", "even", "hot"]);
  const benchOn = activeBench(benchFilter);
  const bellOn = activeBell(bellFilter);
  const rankOn = activeRank(rankFilter);
  const pickedBench = benchArg(benchOn);
  const shown = sortSlips(visibleSlips(
    cards,
    tray,
    query,
    slipStewardArg(stewardOn),
    grainArg(grainOn),
    temperArg(temperOn),
    pickedBench.exact,
    pickedBench.pick,
    bellArg(bellOn),
    rankArg(rankOn),
    hotOnly,
    peakOnly,
    houseOnly,
    quietOnly,
    restingOnly,
  ), order);
  const book = slipIndex(cards, query);
  const counts = slipCounts(cards, deskBench);
  const share = lateSlipShare(cards, deskBench);
  const matched = matchedSlips(cards, deskBench);
  const clashes = clashBenchCount(cards);
  const bells = bellClashCount(cards);
  const neighbors = adjacentSlipCount(cards);
  const suggestedGrain = suggestGrain(cards);
  const suggestedName = suggestSlipSteward(cards);
  const suggestedBell = suggestBell(cards);
  const fair = fairSlipSteward(cards, roster);
  const busy = busiestSlipSteward(cards);
  const reminders = reminderSlips(cards, deskBench);
  const cooling = coolingSlips(cards);
  const nextTitle = nextSlip(cards, deskBench);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  pinRef.current = () => {
    if (!viewer) store(pinFocusedSlip(cards, shown.map((card) => card.id), focus));
  };
  bellRef.current = () => {
    if (!viewer) store(snoozeFocusedSlip(cards, shown.map((card) => card.id), focus));
  };
  holdRef.current = () => {
    if (!viewer) store(holdFocusedSlip(cards, shown.map((card) => card.id), focus));
  };
  temperRef.current = () => {
    if (!viewer) store(temperFocusedSlip(cards, shown.map((card) => card.id), focus));
  };
  waxRef.current = () => {
    if (!viewer) store(waxFocusedSlip(cards, shown.map((card) => card.id), focus));
  };
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setTitle("");
        setNote("");
        setSteward("");
        setBench("");
        setGrain("");
        setTemper("");
        setBellValue("");
        setRank("");
        setTag("");
        setQuery("");
        setEditing("");
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveSlipFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveSlipFocus(index, shown.length, -1));
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
        bellRef.current();
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        holdRef.current();
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        temperRef.current();
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        waxRef.current();
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
  function saveSlip() {
    if (viewer) return;
    store(addSlip(cards, {
      id: `rsl-${Date.now()}`,
      title,
      note,
      steward,
      bench,
      grain,
      temper,
      bell: bellValue,
      rank,
      tags: tag,
    }));
    setTitle("");
    setNote("");
    setTag("");
  }
  function applyView(view: SlipView) {
    setTray(view.tray);
    setQuery(view.query);
    setStewardFilter(view.steward || "all");
    setGrainFilter(view.grain || "all");
    setTemperFilter(view.temper || "all");
    setBenchFilter(view.bench || "all");
    setBellFilter(view.bell || "all");
    setRankFilter(view.rank || "all");
  }
  const focused = shown[focus];
  return (
    <section className="c4-rfs" aria-label={v4("rfsTitle")} data-slips="1" data-desk="refectory" data-role={role} data-board={board} data-density={density}>
      <header className="c4-rfs-mast">
        <p className="c4-rfs-seal" data-logo="mono">{v4("rslLogo")}</p>
        <div>
          <p className="c4-rfs-kicker">{v4("rfsSub")}</p>
          <h2 className="c4-title">{v4("rfsTitle")}</h2>
        </div>
        <p className="c4-rfs-links">
          <Link href={crmv4Href(base, "goals")}>{v4("rfsSub")}</Link>
          <Link href={crmv4Href(base, "dlg")}>{v4("dlgTitle")}</Link>
        </p>
      </header>
      {viewer && <p className="c4-rfs-note">{v4("rslViewer")}</p>}
      <p className="c4-rfs-rule">{v4("rfsHint")}</p>
      <ul className="c4-rfs-kpis" aria-label={v4("rslKpi")}>
        <li><span>{v4("rslOpen")}</span><strong>{counts.open}</strong></li>
        <li><span>{v4("rslHeld")}</span><strong>{counts.held}</strong></li>
        <li><span>{v4("rslArchived")}</span><strong>{counts.archived}</strong></li>
        <li><span>{v4("rslPinned")}</span><strong>{counts.pinned}</strong></li>
        <li><span>{v4("rslPeak")}</span><strong>{counts.peak}</strong></li>
        <li><span>{v4("rslLate")}</span><strong>{counts.late}</strong></li>
        <li><span>{v4("rslSame")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("rslRaised")}</span><strong>{counts.rank}</strong></li>
        <li><span>{v4("rslHouse")}</span><strong>{counts.house}</strong></li>
        <li><span>{v4("rslWindow")}</span><strong>{counts.window}</strong></li>
        <li><span>{v4("rslMatched")}</span><strong>{matched}</strong></li>
        <li><span>{v4("rslWax")}</span><strong>{counts.wax}</strong></li>
        <li><span>{v4("rslCooling")}</span><strong>{counts.cooling}</strong></li>
      </ul>
      <div className="c4-rfs-bars" aria-label={v4("rslGrains")}>
        {bars.map((bar) => (
          <div key={bar.grain} className="c4-rfs-bar" data-grain={bar.grain.toLowerCase()}>
            <span>{grainLabel(v4, bar.grain)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <p className="c4-rfs-meta">
        {v4("rslLateShare")} {share}% · {v4("rslSuggestGrain")} {grainLabel(v4, suggestedGrain)} · {v4("rslSuggestBell")} {suggestedBell} · {v4("rslSuggestSteward")} {suggestedName || v4("rslBlankSteward")} · {v4("rslAssign")} {fair || v4("rslBlankSteward")} · {busy ? `${v4("rslBusiest")} ${busy}` : v4("rslBusiestNone")} · {clashes ? `${v4("rslClash")} ${clashes}` : v4("rslClashNone")} · {v4("rslBellClash")} {bells} · {neighbors ? `${v4("rslNeighbors")} ${neighbors}` : v4("rslNeighborsNone")} · {v4("rslLoad")} {rankLoad(cards)} · {v4("rslPair")} {pairSlipCount(cards)} · {v4("rslShared")} {sharedGrainCount(cards)} · {v4("rslQuietHall")} {quietHallSlips(cards)} · {v4("rslHot")} {hotSlipLoad(cards)} · {v4("rslBenchWidth")} {benchWidth(cards)} · {v4("rslBenches")} {new Set(cards.map((card) => card.bench).filter((item) => item !== null)).size} · {nextTitle ? `${v4("rslNext")} ${nextTitle}` : v4("rslNextNone")}
      </p>
      <div className="c4-rfs-tools">
        <label className="c4-lab"><span>{v4("rslTitleField")}</span><input ref={titleRef} className="c4-field" aria-label={v4("rslTitleField")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("rslNote")}</span><input className="c4-field" aria-label={v4("rslNote")} aria-required={false} value={note} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("rslSteward")}</span><input className="c4-field" aria-label={v4("rslSteward")} aria-required={false} value={steward} onChange={(event) => setSteward(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("rslBench")}</span>
          <select className="c4-select" aria-label={v4("rslBench")} value={bench} onChange={(event) => setBench(event.target.value)}>
            <option value="">{v4("rslBlank")}</option>
            {BENCHES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("rslGrain")}</span>
          <select className="c4-select" aria-label={v4("rslGrain")} value={grain} onChange={(event) => setGrain(event.target.value)}>
            <option value="">{v4("rslBlankGrain")}</option>
            {GRAINS.map((item) => <option key={item} value={item}>{grainLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("rslTemper")}</span>
          <select className="c4-select" aria-label={v4("rslTemper")} value={temper} onChange={(event) => setTemper(event.target.value)}>
            <option value="">{v4("rslBlankTemper")}</option>
            {TEMPERS.map((item) => <option key={item} value={item}>{temperLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("rslBell")}</span>
          <select className="c4-select" aria-label={v4("rslBell")} value={bellValue} onChange={(event) => setBellValue(event.target.value)}>
            <option value="">{v4("rslBlankBell")}</option>
            {BELLS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("rslRank")}</span>
          <select className="c4-select" aria-label={v4("rslRank")} value={rank} onChange={(event) => setRank(event.target.value)}>
            <option value="">{v4("rslResting")}</option>
            {RANKS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("rslTag")}</span><input className="c4-field" aria-label={v4("rslTag")} aria-required={false} value={tag} onChange={(event) => setTag(event.target.value)} /></label>
        <button type="button" className="c4-btn c4-btn-hot" disabled={viewer} onClick={saveSlip}>{v4("rslAdd")}</button>
      </div>
      <div className="c4-rfs-tools">
        <label className="c4-lab"><span>{v4("rslDesk")}</span><input className="c4-field" aria-label={v4("rslDesk")} aria-required={false} value={deskBench} onChange={(event) => setDeskBench(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("rslRoster")}</span><input className="c4-field" aria-label={v4("rslRoster")} aria-required={false} value={roster} onChange={(event) => setRoster(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("rfsSearch")}</span><input ref={searchRef} className="c4-field c4-rfs-search" aria-label={v4("rfsSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <button type="button" className="c4-btn" onClick={() => storeDensity(density === "airy" ? "tight" : "airy")}>{density === "airy" ? v4("rslDensityTight") : v4("rslDensityAiry")}</button>
        <button type="button" className="c4-btn" data-on={order === "bench" ? "1" : "0"} onClick={() => setOrder("bench")}>{v4("rslSortBench")}</button>
        <button type="button" className="c4-btn" data-on={order === "steward" ? "1" : "0"} onClick={() => setOrder("steward")}>{v4("rslSortSteward")}</button>
        <button type="button" className="c4-btn" data-on={board === "hall" ? "1" : "0"} onClick={() => setBoard("hall")}>{v4("rslBoardHall")}</button>
        <button type="button" className="c4-btn" data-on={board === "index" ? "1" : "0"} onClick={() => setBoard("index")}>{v4("rslBoardIndex")}</button>
        <button type="button" className="c4-btn" onClick={() => download("slip-cards.csv", slipsCsv(cards, deskBench))}>{v4("rfsCsv")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("rslOpen")}>
        {(["open", "held", "archived"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("rslOpen") : item === "held" ? v4("rslHeld") : v4("rslArchived")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={hotOnly ? "1" : "0"} onClick={() => setHotOnly((value) => !value)}>{v4("rslHotOnly")}</button>
        <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((value) => !value)}>{v4("rslPeakOnly")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((value) => !value)}>{v4("rslQuietOnly")}</button>
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("rslHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={restingOnly ? "1" : "0"} onClick={() => setRestingOnly((value) => !value)}>{v4("rslRestingOnly")}</button>
      </div>
      <div className="c4-rfs-tools">
        <label className="c4-lab"><span>{v4("rslSteward")}</span>
          <select className="c4-select" aria-label={v4("rslSteward")} value={stewardOn} onChange={(event) => setStewardFilter(event.target.value)}>
            <option value="all">{v4("rslAll")}</option>
            <option value="blank">{v4("rslBlankSteward")}</option>
            {stewards.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("rslGrain")}</span>
          <select className="c4-select" aria-label={v4("rslGrain")} value={grainOn} onChange={(event) => setGrainFilter(event.target.value)}>
            <option value="all">{v4("rslAll")}</option>
            <option value="blank">{v4("rslBlankGrain")}</option>
            {GRAINS.map((item) => <option key={item} value={item.toUpperCase()}>{grainLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("rslTemper")}</span>
          <select className="c4-select" aria-label={v4("rslTemper")} value={temperOn} onChange={(event) => setTemperFilter(event.target.value)}>
            <option value="all">{v4("rslAll")}</option>
            <option value="blank">{v4("rslBlankTemper")}</option>
            {TEMPERS.map((item) => <option key={item} value={item}>{temperLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("rslBench")}</span>
          <select className="c4-select" aria-label={v4("rslBench")} value={benchOn} onChange={(event) => setBenchFilter(event.target.value)}>
            <option value="all">{v4("rslAll")}</option>
            <option value="blank">{v4("rslBlank")}</option>
            <option value="early">{v4("rslEarly")}</option>
            <option value="mid">{v4("rfsMid")}</option>
            <option value="late">{v4("rslLate")}</option>
            <option value="peak">{v4("rslPeak")}</option>
            <option value="quiet">{v4("rslQuiet")}</option>
            {BENCHES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("rslBell")}</span>
          <select className="c4-select" aria-label={v4("rslBell")} value={bellOn} onChange={(event) => setBellFilter(event.target.value)}>
            <option value="all">{v4("rslAll")}</option>
            <option value="blank">{v4("rslBlankBell")}</option>
            {BELLS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("rslRank")}</span>
          <select className="c4-select" aria-label={v4("rslRank")} value={rankOn} onChange={(event) => setRankFilter(event.target.value)}>
            <option value="all">{v4("rslAll")}</option>
            <option value="blank">{v4("rslResting")}</option>
            {RANKS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>
      <div className="c4-rfs-tools">
        <label className="c4-lab"><span>{v4("rslView")}</span><input className="c4-field" aria-label={v4("rslView")} aria-required={false} value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
          storeViews(addSlipView(views, { id: `view-${Date.now()}`, name: viewName, tray, query, steward: stewardOn, grain: grainOn, temper: temperOn, bench: benchOn, bell: bellOn, rank: rankOn }));
          setViewName("");
        }}>{v4("rslView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-rfs-view">
            <button type="button" className="c4-chip" onClick={() => applyView(view)}>{v4("rslApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropSlipView(views, view.id))}>{v4("rslDropView")}</button>
          </span>
        ))}
      </div>
      <div className="c4-rfs-tools">
        <label className="c4-lab"><span>{v4("rslBulkGrain")}</span>
          <select className="c4-select" aria-label={v4("rslBulkGrain")} value={moveGrain} onChange={(event) => setMoveGrain(event.target.value)}>
            {GRAINS.map((item) => <option key={item} value={item}>{grainLabel(v4, item)}</option>)}
          </select>
        </label>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSlipGrain(cards, picked, moveGrain))}>{v4("rslBulkGrain")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSlipPin(cards, picked, true))}>{v4("rslBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSlipArchive(cards, picked, true))}>{v4("rslBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSlipTemper(cards, picked, "hot"))}>{v4("rslBulkTemper")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSlipTag(cards, picked, "a"))}>{v4("rslBulkTag")}</button>
      </div>
      <p className="c4-rfs-keys">{v4("rslKeys")} {v4("rfsEscape")} {v4("rslBoardKey")} {v4("rslTemperKey")} {v4("rslHoldKey")} {v4("rslWaxKey")} {v4("rslPinKey")} {v4("rslBellKey")}</p>
      {!shown.length && board === "hall" && <p className="c4-rfs-empty">{v4("rfsEmpty")}</p>}
      {board === "hall" ? (
        <ol className={`c4-rfs-list ${density === "tight" ? "is-tight" : "is-airy"}`}>
          {shown.map((card, index) => (
            <li key={card.id} className="c4-rfs-card" data-on={focus === index ? "1" : "0"} data-grain={card.grain.toLowerCase() || "blank"} data-late={lateSlip(card, deskBench) ? "1" : "0"} data-cooling={coolingSlip(card) ? "1" : "0"} data-peak={peakBench(card.bench) ? "1" : "0"} data-quiet={quietBench(card.bench) ? "1" : "0"} data-house={houseGrain(card.grain) ? "1" : "0"}>
              <label className="c4-row">
                <input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={(event) => setPicked((ids) => event.target.checked ? [...ids, card.id] : ids.filter((id) => id !== card.id))} />
                <button type="button" className="c4-btn" data-on={focus === index ? "1" : "0"} onClick={() => setFocus(index)}>{v4("rslFocus")}</button>
              </label>
              {editing === card.id ? (
                <label className="c4-lab"><span>{v4("rslEdit")}</span><input className="c4-field" aria-label={v4("rslEdit")} value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={() => { if (!viewer) store(editSlip(cards, card.id, draft)); setEditing(""); }} /></label>
              ) : (
                <h3 className="c4-title">{card.title}</h3>
              )}
              <p>{card.steward || v4("rslBlankSteward")} · {card.bench ?? v4("rslBlank")} · {grainLabel(v4, card.grain)} · {temperLabel(v4, card.temper)} · {card.bell ?? v4("rslBlankBell")} · {card.rank} · {card.tags.join(" ") || v4("rslBlank")} · {gapLabel(v4, card.bench, deskBench)} · {card.audit ? v4(AUDIT_KEY[card.audit] || "rslAuditSave") : ""}</p>
              {editing === `${card.id}-note` ? (
                <label className="c4-lab"><span>{v4("rslEditNote")}</span><input className="c4-field" aria-label={v4("rslEditNote")} aria-required={false} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} onBlur={() => { if (!viewer) store(editSlipNote(cards, card.id, noteDraft)); setEditing(""); }} /></label>
              ) : <p>{card.note}</p>}
              <div className="c4-row">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("rslEdit")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(`${card.id}-note`); setNoteDraft(card.note); }}>{v4("rslEditNote")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("rslUnpin") : v4("rslPin")}</button>
                <button type="button" className="c4-btn" disabled={viewer || card.archived} onClick={() => store(setSlipHold(cards, card.id, !card.held))}>{card.held ? v4("rslResume") : v4("rslHold")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipArchive(cards, card.id, !card.archived))}>{card.archived ? v4("rslReopen") : v4("rslArchive")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleTemper(cards, card.id))}>{v4("rslTemper")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipWax(cards, card.id, !card.wax))}>{card.wax ? v4("rslUnwax") : v4("rslWax")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(snoozeSlip(cards, card.id))}>{v4("rslSnooze")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipRank(cards, card.id, card.rank === 5 ? "0" : card.rank === 2 ? "5" : "2"))}>{v4("rslRank")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addSlipTag(cards, card.id, "a"))}>{v4("rslTag")}</button>
                <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(slipCopy(card, deskBench)); setCopied(card.id); }}>{copied === card.id ? v4("rfsCopied") : v4("rfsCopy")}</button>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <ol className="c4-rfs-index">
          {!book.length && <li className="c4-rfs-empty">{v4("rfsEmpty")}</li>}
          {book.map((card) => <li key={card.id}><span>{card.bench}</span><strong>{card.title}</strong><em>{card.steward || v4("rslBlankSteward")}</em></li>)}
        </ol>
      )}
      <aside className="c4-rfs-side" aria-label={v4("rslReminders")}>
        <h3 className="c4-title">{v4("rslReminders")}</h3>
        {!reminders.length && <p>{v4("rfsEmpty")}</p>}
        <ul>{reminders.map((card) => <li key={card.id}>{card.title} · {lateSlip(card, deskBench) ? v4("rslLate") : v4("rslSame")}</li>)}</ul>
        <h3 className="c4-title">{v4("rslCooling")}</h3>
        {!cooling.length && <p>{v4("rslCoolingEmpty")}</p>}
        <ul>{cooling.map((card) => <li key={card.id}>{card.title}</li>)}</ul>
        {focused && <p>{v4("rslFocus")} {focused.title} · {slipShare(counts.house, Math.max(1, counts.open))}%</p>}
      </aside>
    </section>
  );
}

function traderNote(row: TraderRow): DialectValue {
  return {
    name: textField(row.name),
    tongue: textField(row.language),
    land: textField(row.country),
  };
}

export function DialectMarks({ base, v4 }: { base: string; v4: V4 }) {
  const leads = useJson<{ users?: TraderRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("all");
  const [tone, setTone] = useState("all");
  const [review, setReview] = useState<DialectReview>("all");
  const [shape, setShape] = useState<DialectShape>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const reviewRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  const rows = useMemo<DialectRow[]>(() => {
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
    const present = presentDialectLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenDialects(readJson(DLG_KEY, []), present);
    const nextReviewed = readReviewedDialects(readJson(DLG_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(DLG_KEY, nextHidden);
    writeJson(DLG_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentDialectLanes(rows);
  const lanes = visibleDialectLanes(present, hidden, showHidden);
  const laneOn = activeDialectLane(lane, present);
  const toneOn = activeDialectTone(tone);
  const shown = visibleDialects(rows, dialectLaneArg(laneOn), dialectToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = dialectState(row.note);
      const token = state === "set" ? dialectLane(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return lanes.includes(token);
    });
  reviewRef.current = () => {
    const row = shown[focus];
    if (!row || viewer) return;
    const next = toggleDialectReview(reviewed, row.id);
    setReviewed(next);
    writeJson(DLG_REVIEW_KEY, next);
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
        setFocus((index) => moveSlipFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveSlipFocus(index, shown.length, -1));
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
  const lead = leadingDialect(rows);
  const toneLead = leadingDialectTone(rows);
  const shared = sharedDialectCount(rows);
  const joined = joinedDialectCount(rows);
  const bars = dialectLanes(rows).filter((line) => line.lane);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  const known = rows.filter((row) => dialectState(row.note) === "set").length;
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(DLG_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedDialects(next, ids);
    setReviewed(saved);
    writeJson(DLG_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-dlg" aria-label={v4("dlgTitle")} data-dialects="1" data-desk="refectory" data-traders={leads.data?.users?.length ? "1" : "0"} data-role={role} data-keyed={joined ? "1" : "0"}>
      <header className="c4-dlg-mast">
        <p className="c4-dlg-seal" data-logo="mono">{v4("dlgLogo")}</p>
        <div>
          <p className="c4-dlg-kicker">{v4("dlgSub")}</p>
          <h2 className="c4-title">{v4("dlgTitle")}</h2>
        </div>
        <ol className="c4-dlg-index" aria-label={v4("dlgTitle")}>
          <li data-tone="gold">{v4("dlgGlyph")}</li>
          <li data-tone="ink">{v4("dlgHouse")}</li>
          <li data-tone="wool">{v4("dlgHall")}</li>
        </ol>
      </header>
      <p className="c4-dlg-links">
        <Link href={crmv4Href(base, "goals")}>{v4("rfsSub")}</Link>
        <Link href={crmv4Href(base, "rsl")}>{v4("rfsTitle")}</Link>
        <Link href={crmv4Href(base, "agenda")}>{v4("dlgSub")}</Link>
      </p>
      {viewer && <p className="c4-dlg-note">{v4("dlgViewer")}</p>}
      <p className="c4-dlg-rule">{v4("dlgHint")}</p>
      <ul className="c4-dlg-kpis" aria-label={v4("dlgRules")}>
        <li><span>{v4("dlgSet")}</span><strong>{known}</strong></li>
        <li><span>{v4("dlgClear")}</span><strong>{rows.filter((row) => dialectState(row.note) === "clear").length}</strong></li>
        <li><span>{v4("dlgHall")}</span><strong>{hallDialectCount(rows)}</strong></li>
        <li><span>{v4("dlgGuest")}</span><strong>{guestDialectCount(rows)}</strong></li>
        <li><span>{v4("dlgDesk")}</span><strong>{deskDialectCount(rows)}</strong></li>
        <li><span>{v4("dlgHouse")}</span><strong>{houseDialectCount(rows)}</strong></li>
        <li><span>{v4("dlgScroll")}</span><strong>{scrollDialectCount(rows)}</strong></li>
        <li><span>{v4("dlgGlyph")}</span><strong>{glyphDialectCount(rows)}</strong></li>
        <li><span>{v4("dlgGilt")}</span><strong>{giltDialectCount(rows)}</strong></li>
        <li><span>{v4("dlgShare")}</span><strong>{dialectShare(joined, Math.max(1, known))}%</strong></li>
        <li><span>{v4("dlgShared")}</span><strong>{shared}</strong></li>
      </ul>
      <div className="c4-dlg-bars" aria-label={v4("dlgLead")}>
        {bars.map((bar) => (
          <div key={bar.lane} className="c4-dlg-bar" data-lane={bar.lane}>
            <span>{laneLabel(v4, bar.lane)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <p className="c4-dlg-meta">{lead ? `${v4("dlgLead")} ${laneLabel(v4, lead)}` : v4("dlgEmpty")} · {toneLead ? `${v4("dlgToneLead")} ${toneLabel(v4, toneLead)}` : v4("dlgUnmarked")} · {v4("dlgWide")} {rows.filter((row) => wideDialect(row.note)).length}</p>
      <label className="c4-lab"><span>{v4("dlgSearch")}</span><input ref={searchRef} className="c4-field c4-dlg-search" aria-label={v4("dlgSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <div className="c4-row" role="group" aria-label={v4("dlgAll")}>
        <button type="button" className="c4-chip" data-on={laneOn === "all" ? "1" : "0"} onClick={() => setLane("all")}>{v4("dlgAll")}</button>
        {present.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={laneOn === item ? "1" : "0"} onClick={() => setLane(item)}>{laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("dlgGilt")}>
        {(["all", "gilt", "pale", "linen", "ash", "haze"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={toneOn === item ? "1" : "0"} onClick={() => setTone(item)}>{item === "all" ? v4("dlgAll") : toneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("dlgShapeAll")}>
        {(["all", "join", "wide", "hall", "glyph", "house"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>
            {item === "all" ? v4("dlgShapeAll") : item === "join" ? v4("dlgShapeJoin") : item === "wide" ? v4("dlgShapeWide") : item === "hall" ? v4("dlgShapeHall") : item === "glyph" ? v4("dlgShapeGlyph") : v4("dlgShapeHouse")}
          </button>
        ))}
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview("reviewed")}>{v4("dlgReviewed")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview("fresh")}>{v4("dlgUnreviewed")}</button>
        <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} onClick={() => setReview("all")}>{v4("dlgAll")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("dlgShow")}</button>
      </div>
      <div className="c4-row">
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" data-on={hidden.includes(item) ? "1" : "0"} onClick={() => storeHidden(toggleDialect(hidden, item))}>{v4("dlgHide")} {laneLabel(v4, item)}</button>
        ))}
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkDialectReview(reviewed, shown.map((row) => row.id), true))}>{v4("dlgBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkDialectReview(reviewed, shown.map((row) => row.id), false))}>{v4("dlgBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("tongue-lanes.csv", dialectsCsv(rows))}>{v4("dlgCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("tongue-rows.csv", dialectRowsCsv(rows, reviewed))}>{v4("dlgRowCsv")}</button>
      </div>
      <p className="c4-dlg-keys">{v4("rslKeys")} {v4("rfsEscape")}</p>
      {!shown.length && <p className="c4-dlg-empty">{leads.error ? v4("dlgUnmarked") : v4("dlgEmpty")}</p>}
      <ol className="c4-dlg-list">
        {shown.map((row, index) => (
          <li key={row.id} className="c4-dlg-card" data-on={focus === index ? "1" : "0"} data-lane={dialectLane(row.note) || "blank"} data-tone={dialectTone(row.note) || "blank"} data-join={joinedDialect(row.note) ? "1" : "0"} data-wide={wideDialect(row.note) ? "1" : "0"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"}>
            <span className="c4-dlg-dialect">{dialectSigil(row.note) || "—"}</span>
            <strong>{row.label || v4("dlgClear")}</strong>
            <span>{laneLabel(v4, dialectState(row.note) === "clear" ? "blank" : dialectLane(row.note))}</span>
            <span>{toneLabel(v4, dialectTone(row.note))}</span>
            <span>{v4("dlgStep")} {dialectStep(row.note)}</span>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleDialectReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("dlgReviewed") : v4("dlgReview")}</button>
            <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(dialectCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("dlgCopied") : v4("dlgCopy")}</button>
          </li>
        ))}
      </ol>
    </section>
  );
}
