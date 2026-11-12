"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  CLP_KEY,
  CLP_REVIEW_KEY,
  TRC_DENSITY_KEY,
  TRC_KEY,
  TRC_VIEW_KEY,
  activeColophonLane,
  activeColophonTone,
  activeGrade,
  activeHost,
  activePace,
  activeRank,
  activeSeat,
  activeSpan,
  addTerrace,
  addTerraceView,
  bulkColophonReview,
  bulkTerraceArchive,
  bulkTerraceGrade,
  bulkTerracePace,
  bulkTerracePin,
  bulkTerraceTag,
  busiestHost,
  cipherColophonCount,
  clashSeatCount,
  colophonCopy,
  colophonLane,
  colophonLaneArg,
  colophonLanes,
  colophonMark,
  colophonRowsCsv,
  colophonShare,
  colophonState,
  colophonStep,
  colophonTone,
  colophonToneArg,
  colophonsCsv,
  coldColophonCount,
  coolingTerrace,
  coolingTerraces,
  cyclePace,
  dropTerraceView,
  editTerrace,
  editTerraceNote,
  fairHost,
  giltColophonCount,
  gradeArg,
  hallColophonCount,
  holdFocusedTerrace,
  hostArg,
  houseGrade,
  inkColophonCount,
  joinedColophon,
  joinedColophonCount,
  lateTerrace,
  lateTerraceShare,
  leadingColophon,
  leadingColophonTone,
  lostColophonCount,
  matchedTerraces,
  moveTerraceFocus,
  neighborTerraceCount,
  nextTerrace,
  paceArg,
  paceFocusedTerrace,
  pairHostCount,
  peakSeat,
  pinFocusedTerrace,
  presentColophonLanes,
  quietSeat,
  rankArg,
  rankFocusedTerrace,
  rankLoad,
  readHiddenColophons,
  readReviewedColophons,
  readTerraceViews,
  readTerraces,
  reminderTerraces,
  sealFocusedTerrace,
  seatArg,
  seatBand,
  seatGap,
  setTerraceArchive,
  setTerraceHold,
  setTerracePin,
  setTerraceRank,
  setTerraceSeal,
  sharedColophonCount,
  snoozeFocusedTerrace,
  snoozeTerrace,
  sortTerraces,
  spanArg,
  spanClashCount,
  suggestGrade,
  suggestHost,
  suggestSpan,
  tagFocusedTerrace,
  terraceCopy,
  terraceCounts,
  terraceDensity,
  terraceGrades,
  terraceHosts,
  terraceShare,
  terraceSort,
  terraceTimeline,
  terracesCsv,
  toggleColophon,
  toggleColophonReview,
  visibleColophonLanes,
  visibleColophons,
  visibleTerraces,
  warmColophonCount,
  wideColophon,
  windowTerraces,
  type ColophonReview,
  type ColophonRow,
  type ColophonShape,
  type ColophonValue,
  type TerraceCard,
  type TerraceDensity,
  type TerraceSort,
  type TerraceTray,
  type TerraceView,
} from "@/lib/crmv4/round240";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const GRADES = ["ivory", "champagne", "graphite"] as const;
const PACES = ["linger", "stroll", "brisk"] as const;
const SPANS = ["3", "9", "15"] as const;
const RANKS = ["2", "5", "8"] as const;
const SEATS = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "trcAuditSave",
  edit: "trcAuditEdit",
  note: "trcAuditNote",
  pace: "trcAuditPace",
  pin: "trcAuditPin",
  unpin: "trcAuditUnpin",
  hold: "trcAuditHold",
  resume: "trcAuditResume",
  archive: "trcAuditArchive",
  open: "trcAuditOpen",
  grade: "trcAuditGrade",
  tag: "trcAuditTag",
  rank: "trcAuditRank",
  span: "trcAuditSpan",
  seal: "trcAuditSeal",
};

type TraderRow = {
  id?: string;
  name?: string | null;
  retentionStatus?: string | null;
  desk?: string | null;
};

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

function gradeLabel(v4: V4, grade: string): string {
  if (grade === "IVORY" || grade === "ivory") return v4("trcIvory");
  if (grade === "CHAMPAGNE" || grade === "champagne") return v4("trcChampagne");
  if (grade === "GRAPHITE" || grade === "graphite") return v4("trcGraphite");
  return v4("trcBlankGrade");
}

function paceLabel(v4: V4, pace: string): string {
  if (pace === "linger") return v4("trcLinger");
  if (pace === "stroll") return v4("trcStroll");
  if (pace === "brisk") return v4("trcBrisk");
  return v4("trcBlankPace");
}

function laneLabel(v4: V4, lane: string): string {
  if (lane === "hall") return v4("clpHall");
  if (lane === "ink") return v4("clpInk");
  if (lane === "warm") return v4("clpWarm");
  if (lane === "cold") return v4("clpCold");
  if (lane === "lost") return v4("clpLost");
  if (lane === "cipher") return v4("clpCipher");
  return v4("clpUnmarked");
}

function toneLabel(v4: V4, tone: string): string {
  if (tone === "gilt") return v4("clpGilt");
  if (tone === "linen") return v4("clpLinen");
  if (tone === "pale") return v4("clpPale");
  if (tone === "ash") return v4("clpAsh");
  if (tone === "haze") return v4("clpHaze");
  return v4("clpUnmarked");
}

function bandLabel(v4: V4, band: string): string {
  if (band === "early") return v4("trcEarly");
  if (band === "mid") return v4("trcMid");
  if (band === "late") return v4("trcLate");
  return v4("trcBlank");
}

export function TerraceCards({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<TerraceCard[]>([]);
  const [views, setViews] = useState<TerraceView[]>([]);
  const [density, setDensity] = useState<TerraceDensity>("airy");
  const [sort, setSort] = useState<TerraceSort>("seat");
  const [tray, setTray] = useState<TerraceTray>("open");
  const [query, setQuery] = useState("");
  const [hostFilter, setHostFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [paceFilter, setPaceFilter] = useState("all");
  const [seatFilter, setSeatFilter] = useState("all");
  const [spanFilter, setSpanFilter] = useState("all");
  const [rankFilter, setRankFilter] = useState("all");
  const [houseOnly, setHouseOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [restingOnly, setRestingOnly] = useState(false);
  const [briskOnly, setBriskOnly] = useState(false);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [host, setHost] = useState("");
  const [seat, setSeat] = useState("");
  const [grade, setGrade] = useState("");
  const [pace, setPace] = useState("");
  const [spanValue, setSpanValue] = useState("");
  const [rank, setRank] = useState("2");
  const [tag, setTag] = useState("");
  const [viewName, setViewName] = useState("");
  const [roster, setRoster] = useState("Ada, Bea, Cam");
  const [desk, setDesk] = useState("4");
  const [board, setBoard] = useState<"hall" | "index">("hall");
  const [focus, setFocus] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<() => void>(() => {});
  const spanRef = useRef<() => void>(() => {});
  const holdRef = useRef<() => void>(() => {});
  const paceRef = useRef<() => void>(() => {});
  const sealRef = useRef<() => void>(() => {});
  const rankRef = useRef<() => void>(() => {});
  const tagRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  const hosts = terraceHosts(cards);
  const hostOn = activeHost(hostFilter, hosts);
  const gradeOn = activeGrade(gradeFilter);
  const paceOn = activePace(paceFilter, ["all", "blank", ...PACES]);
  const seatOn = activeSeat(seatFilter);
  const spanOn = activeSpan(spanFilter);
  const rankOn = activeRank(rankFilter);
  const shown = useMemo(() => sortTerraces(visibleTerraces(
    cards,
    tray,
    query,
    hostArg(hostOn),
    gradeArg(gradeOn),
    paceArg(paceOn),
    seatArg(seatOn),
    spanArg(spanOn),
    rankArg(rankOn),
    houseOnly,
    peakOnly,
    quietOnly,
    restingOnly,
    briskOnly,
  ), sort), [cards, tray, query, hostOn, gradeOn, paceOn, seatOn, spanOn, rankOn, houseOnly, peakOnly, quietOnly, restingOnly, briskOnly, sort]);
  const counts = terraceCounts(cards, desk);
  const reminders = reminderTerraces(cards, desk);
  const cooling = coolingTerraces(cards);
  const timeline = terraceTimeline(cards);
  const suggestedGrade = suggestGrade(cards);
  const suggestedSpan = suggestSpan(cards, desk);
  const suggestedHost = suggestHost(cards, roster);
  const busyHost = busiestHost(cards);
  const focusAt = shown.length ? focus % shown.length : 0;

  function store(next: TerraceCard[]) {
    const saved = readTerraces(next);
    setCards(saved);
    writeJson(TRC_KEY, saved);
  }
  function storeViews(next: TerraceView[]) {
    const saved = readTerraceViews(next);
    setViews(saved);
    writeJson(TRC_VIEW_KEY, saved);
  }
  function storeDensity(next: TerraceDensity) {
    setDensity(next);
    writeJson(TRC_DENSITY_KEY, next);
  }

  useEffect(() => {
    setCards(readTerraces(readJson(TRC_KEY, [])));
    setViews(readTerraceViews(readJson(TRC_VIEW_KEY, [])));
    setDensity(terraceDensity(readJson(TRC_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  useEffect(() => {
    pinRef.current = () => {
      if (viewer) return;
      store(pinFocusedTerrace(cards, shown.map((card) => card.id), focusAt));
    };
    spanRef.current = () => {
      if (viewer) return;
      store(snoozeFocusedTerrace(cards, shown.map((card) => card.id), focusAt));
    };
    holdRef.current = () => {
      if (viewer) return;
      store(holdFocusedTerrace(cards, shown.map((card) => card.id), focusAt));
    };
    paceRef.current = () => {
      if (viewer) return;
      store(paceFocusedTerrace(cards, shown.map((card) => card.id), focusAt));
    };
    sealRef.current = () => {
      if (viewer) return;
      store(sealFocusedTerrace(cards, shown.map((card) => card.id), focusAt));
    };
    rankRef.current = () => {
      if (viewer) return;
      store(rankFocusedTerrace(cards, shown.map((card) => card.id), focusAt));
    };
    tagRef.current = () => {
      if (viewer) return;
      store(tagFocusedTerrace(cards, shown.map((card) => card.id), focusAt));
    };
  });

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event) && event.key !== "Escape") return;
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setTag("");
        return;
      }
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveTerraceFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveTerraceFocus(index, shown.length, -1));
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
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        rankRef.current();
        return;
      }
      if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        tagRef.current();
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

  function saveTerrace() {
    if (viewer) return;
    store(addTerrace(cards, { id: `trc-${Date.now()}`, title, note, host, seat, grade, pace, span: spanValue, rank, tags: tag }));
    setTitle("");
    setNote("");
    setTag("");
  }
  function applyView(view: TerraceView) {
    setTray(view.tray);
    setQuery(view.query);
    setHostFilter(view.host || "all");
    setGradeFilter(view.grade || "all");
    setPaceFilter(view.pace || "all");
    setSeatFilter(view.seat || "all");
    setSpanFilter(view.span || "all");
    setRankFilter(view.rank || "all");
  }
  function togglePick(id: string) {
    setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }
  async function copyCard(card: TerraceCard) {
    const body = terraceCopy(card);
    try { await navigator.clipboard.writeText(body); } catch { /* the desk still shows copied */ }
    setCopied(card.id);
  }
  const focused = shown[focusAt];
  const grades = terraceGrades(cards);
  const maxGrade = Math.max(1, ...GRADES.map((item) => cards.filter((card) => card.grade === item.toUpperCase()).length));

  return (
    <section className="c4-trc" aria-label={v4("trcTitle")} data-terraces="1" data-desk="gallery" data-role={role} data-board={board} data-density={density}>
      <header className="c4-trc-mast">
        <p className="c4-trc-seal" data-logo="mono">{v4("trcLogo")}</p>
        <div>
          <p className="c4-trc-kicker">{v4("trcSub")}</p>
          <h2 className="c4-title">{v4("trcTitle")}</h2>
        </div>
        <ol className="c4-trc-index" aria-label={v4("trcGrades")}>
          <li data-tone="ivory">{v4("trcIvory")}</li>
          <li data-tone="gold">{v4("trcChampagne")}</li>
          <li data-tone="ink">{v4("trcGraphite")}</li>
        </ol>
      </header>
      <p className="c4-trc-links">
        <Link href={crmv4Href(base, "clp")}>{v4("clpTitle")}</Link>
        <Link href={crmv4Href(base, "cases")}>{v4("cqTitle")}</Link>
        <Link href={crmv4Href(base, "shortcuts")}>{v4("scTitle")}</Link>
      </p>
      {viewer && <p className="c4-trc-note">{v4("trcViewer")}</p>}
      <p className="c4-trc-rule">{v4("trcHint")}</p>
      <ul className="c4-trc-kpis" aria-label={v4("trcKpi")}>
        <li><span>{v4("trcOpen")}</span><strong>{counts.open}</strong></li>
        <li><span>{v4("trcHeld")}</span><strong>{counts.held}</strong></li>
        <li><span>{v4("trcArchived")}</span><strong>{counts.archived}</strong></li>
        <li><span>{v4("trcPinned")}</span><strong>{counts.pinned}</strong></li>
        <li><span>{v4("trcPeak")}</span><strong>{counts.peak}</strong></li>
        <li><span>{v4("trcLate")}</span><strong>{counts.late}</strong></li>
        <li><span>{v4("trcSame")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("trcLoad")}</span><strong>{rankLoad(cards)}</strong></li>
        <li><span>{v4("trcHouse")}</span><strong>{counts.house}</strong></li>
        <li><span>{v4("trcWindow")}</span><strong>{windowTerraces(cards, desk).length}</strong></li>
        <li><span>{v4("trcMatched")}</span><strong>{matchedTerraces(cards, desk)}</strong></li>
        <li><span>{v4("trcSeal")}</span><strong>{counts.seal}</strong></li>
        <li><span>{v4("trcCooling")}</span><strong>{counts.cooling}</strong></li>
        <li><span>{v4("trcLateShare")}</span><strong>{lateTerraceShare(cards, desk)}%</strong></li>
        <li><span>{v4("trcShared")}</span><strong>{pairHostCount(cards)}</strong></li>
      </ul>
      <div className="c4-trc-bars" aria-label={v4("trcGrades")}>
        {GRADES.map((item) => {
          const count = cards.filter((card) => card.grade === item.toUpperCase()).length;
          return (
            <div key={item} className="c4-trc-bar" data-grade={item}>
              <span>{gradeLabel(v4, item)}</span>
              <i style={{ width: `${Math.round((count / maxGrade) * 100)}%` }} />
              <strong>{count}</strong>
            </div>
          );
        })}
      </div>
      <p className="c4-trc-meta">
        {v4("trcSuggestGrade")} {gradeLabel(v4, suggestedGrade)} · {v4("trcSuggestSpan")} {suggestedSpan} · {v4("trcSuggestHost")} {suggestedHost || v4("trcBlankHost")} · {busyHost ? `${v4("trcBusiest")} ${busyHost}` : v4("trcBusiestNone")} · {v4("trcNeighbors")} {neighborTerraceCount(cards) || v4("trcNeighborsNone")} · {clashSeatCount(cards) ? `${v4("trcClash")} ${clashSeatCount(cards)}` : v4("trcClashNone")} · {v4("trcSpanClash")} {spanClashCount(cards)} · {v4("trcSeats")} {timeline.length} · {grades.length ? v4("trcGrades") : v4("trcBlankGrade")}
      </p>
      <div className="c4-trc-tools">
        <label className="c4-lab"><span>{v4("trcSearch")}</span><input ref={searchRef} className="c4-field c4-trc-search" aria-label={v4("trcSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("trcDesk")}</span>
          <select className="c4-select" aria-label={v4("trcDesk")} value={desk} onChange={(event) => setDesk(event.target.value)}>
            {SEATS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("trcRoster")}</span><input className="c4-field" aria-label={v4("trcRoster")} value={roster} onChange={(event) => setRoster(event.target.value)} /></label>
        <button type="button" className="c4-btn" onClick={() => storeDensity(density === "airy" ? "tight" : "airy")}>{density === "airy" ? v4("trcDensityTight") : v4("trcDensityAiry")}</button>
        <button type="button" className="c4-btn" onClick={() => setSort(terraceSort(sort === "seat" ? "host" : "seat"))}>{sort === "seat" ? v4("trcSortHost") : v4("trcSortSeat")}</button>
        <button type="button" className="c4-btn" onClick={() => download("terrace-cards.csv", terracesCsv(cards, desk))}>{v4("trcCsv")}</button>
      </div>
      <div className="c4-trc-tools" role="group" aria-label={v4("trcAll")}>
        {(["open", "held", "archived"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} aria-pressed={tray === item} onClick={() => setTray(item)}>{item === "open" ? v4("trcOpen") : item === "held" ? v4("trcHeld") : v4("trcArchived")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} aria-pressed={houseOnly} onClick={() => setHouseOnly((value) => !value)}>{v4("trcHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} aria-pressed={peakOnly} onClick={() => setPeakOnly((value) => !value)}>{v4("trcPeakOnly")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} aria-pressed={quietOnly} onClick={() => setQuietOnly((value) => !value)}>{v4("trcQuietOnly")}</button>
        <button type="button" className="c4-chip" data-on={restingOnly ? "1" : "0"} aria-pressed={restingOnly} onClick={() => setRestingOnly((value) => !value)}>{v4("trcRestingOnly")}</button>
        <button type="button" className="c4-chip" data-on={briskOnly ? "1" : "0"} aria-pressed={briskOnly} onClick={() => setBriskOnly((value) => !value)}>{v4("trcBriskOnly")}</button>
      </div>
      <div className="c4-trc-tools">
        <label className="c4-lab"><span>{v4("trcHost")}</span>
          <select className="c4-select" aria-label={v4("trcHost")} value={hostOn} onChange={(event) => setHostFilter(event.target.value)}>
            <option value="all">{v4("trcAll")}</option>
            <option value="blank">{v4("trcBlankHost")}</option>
            {hosts.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("trcGrades")}</span>
          <select className="c4-select" aria-label={v4("trcGrades")} value={gradeOn} onChange={(event) => setGradeFilter(event.target.value)}>
            <option value="all">{v4("trcAll")}</option>
            <option value="blank">{v4("trcBlankGrade")}</option>
            {GRADES.map((item) => <option key={item} value={item}>{gradeLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("trcPace")}</span>
          <select className="c4-select" aria-label={v4("trcPace")} value={paceOn} onChange={(event) => setPaceFilter(event.target.value)}>
            <option value="all">{v4("trcAll")}</option>
            <option value="blank">{v4("trcBlankPace")}</option>
            {PACES.map((item) => <option key={item} value={item}>{paceLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("trcDesk")}</span>
          <select className="c4-select" aria-label={v4("trcSeatWidth")} value={seatOn} onChange={(event) => setSeatFilter(event.target.value)}>
            <option value="all">{v4("trcAll")}</option>
            <option value="blank">{v4("trcBlank")}</option>
            <option value="early">{v4("trcEarly")}</option>
            <option value="mid">{v4("trcMid")}</option>
            <option value="late">{v4("trcLate")}</option>
            <option value="peak">{v4("trcPeak")}</option>
            <option value="quiet">{v4("trcQuiet")}</option>
            {SEATS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("trcSpan")}</span>
          <select className="c4-select" aria-label={v4("trcSpan")} value={spanOn} onChange={(event) => setSpanFilter(event.target.value)}>
            <option value="all">{v4("trcAll")}</option>
            <option value="blank">{v4("trcBlankSpan")}</option>
            {SPANS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("trcRank")}</span>
          <select className="c4-select" aria-label={v4("trcRank")} value={rankOn} onChange={(event) => setRankFilter(event.target.value)}>
            <option value="all">{v4("trcAll")}</option>
            {RANKS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>
      <form className="c4-trc-form" onSubmit={(event) => { event.preventDefault(); saveTerrace(); }}>
        <label className="c4-lab"><span>{v4("trcTitleField")}</span><input ref={titleRef} className="c4-field" aria-label={v4("trcTitleField")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("trcNote")}</span><input className="c4-field" aria-label={v4("trcNote")} value={note} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("trcHost")}</span><input className="c4-field" aria-label={v4("trcSuggestHost")} value={host} onChange={(event) => setHost(event.target.value)} placeholder={suggestedHost} /></label>
        <label className="c4-lab"><span>{v4("trcDesk")}</span>
          <select className="c4-select" aria-label={v4("trcDue")} value={seat} onChange={(event) => setSeat(event.target.value)}>
            <option value="">{v4("trcBlank")}</option>
            {SEATS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("trcGrades")}</span>
          <select className="c4-select" aria-label={v4("trcSuggestGrade")} value={grade} onChange={(event) => setGrade(event.target.value)}>
            <option value="">{v4("trcBlankGrade")}</option>
            {GRADES.map((item) => <option key={item} value={item}>{gradeLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("trcPace")}</span>
          <select className="c4-select" aria-label={v4("trcPace")} value={pace} onChange={(event) => setPace(event.target.value)}>
            <option value="">{v4("trcBlankPace")}</option>
            {PACES.map((item) => <option key={item} value={item}>{paceLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("trcSpan")}</span>
          <select className="c4-select" aria-label={v4("trcSuggestSpan")} value={spanValue} onChange={(event) => setSpanValue(event.target.value)}>
            <option value="">{v4("trcBlankSpan")}</option>
            {SPANS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("trcRank")}</span>
          <select className="c4-select" aria-label={v4("trcRank")} value={rank} onChange={(event) => setRank(event.target.value)}>
            {RANKS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("trcTag")}</span><input className="c4-field" aria-label={v4("trcTag")} value={tag} onChange={(event) => setTag(event.target.value)} /></label>
        <button type="submit" className="c4-btn c4-btn-hot" disabled={viewer}>{v4("trcAdd")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setHost(fairHost(cards, roster))}>{v4("trcAssign")}</button>
      </form>
      <p className="c4-trc-meta">{v4("trcKeys")} {v4("trcHoldKey")} {v4("trcSpanKey")} {v4("trcBoardKey")} {v4("trcEscape")}</p>
      <div className="c4-trc-tools">
        <label className="c4-lab"><span>{v4("trcView")}</span><input className="c4-field" aria-label={v4("trcView")} value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="button" className="c4-btn" disabled={viewer || !viewName.trim()} onClick={() => { storeViews(addTerraceView(views, { id: `view-${Date.now()}`, name: viewName, tray, query, host: hostOn, grade: gradeOn, pace: paceOn, seat: seatOn, span: spanOn, rank: rankOn })); setViewName(""); }}>{v4("trcSaveView")}</button>
        <span className="c4-trc-meta">{v4("trcSelected")} {picked.length}</span>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTerraceArchive(cards, picked, true))}>{v4("trcBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTerracePace(cards, picked, "brisk"))}>{v4("trcBulkPace")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTerracePin(cards, picked, true))}>{v4("trcBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTerraceTag(cards, picked, "w"))}>{v4("trcBulkTag")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTerraceGrade(cards, picked, "champagne"))}>{v4("trcBulkGrade")}</button>
      </div>
      <ul className="c4-trc-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-chip" onClick={() => applyView(view)}>{v4("trcApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropTerraceView(views, view.id))}>{v4("trcDropView")}</button>
          </li>
        ))}
      </ul>
      {board === "hall" ? (
        <ol className="c4-trc-board">
          {!shown.length && <li className="c4-trc-empty">{v4("trcEmpty")}</li>}
          {shown.map((card, index) => {
            const gap = seatGap(card.seat, desk);
            return (
              <li key={card.id} className="c4-trc-card" data-on={index === focusAt ? "1" : "0"} data-pinned={card.pinned ? "1" : "0"} data-seal={card.seal ? "1" : "0"} data-grade={card.grade || "blank"} data-late={lateTerrace(card, desk) ? "1" : "0"}>
                <label className="c4-lab"><span>{v4("trcSelect")}</span><input type="checkbox" aria-label={v4("trcSelect")} checked={picked.includes(card.id)} onChange={() => togglePick(card.id)} /></label>
                <input className="c4-field" aria-label={v4("trcEdit")} value={card.title} disabled={viewer} onChange={(event) => { if (!viewer) store(editTerrace(cards, card.id, event.target.value)); }} />
                <input className="c4-field" aria-label={v4("trcEditNote")} value={card.note} disabled={viewer} onChange={(event) => { if (!viewer) store(editTerraceNote(cards, card.id, event.target.value)); }} />
                <p className="c4-trc-meta">{card.host || v4("trcBlankHost")} · {card.seat ?? v4("trcBlank")} · {gradeLabel(v4, card.grade)} · {paceLabel(v4, card.pace)} · {card.span ?? v4("trcBlankSpan")} · {v4("trcRank")} {card.rank} · {card.tags.join(" ") || v4("trcBlank")} · {bandLabel(v4, seatBand(card.seat))}{peakSeat(card.seat) ? ` · ${v4("trcPeak")}` : ""}{quietSeat(card.seat) ? ` · ${v4("trcQuiet")}` : ""}{houseGrade(card.grade) ? ` · ${v4("trcHouse")}` : ""}{coolingTerrace(card) ? ` · ${v4("trcCooling")}` : ""}</p>
                <p className="c4-trc-meta">{gap === null ? v4("trcBlank") : gap > 0 ? `${v4("trcPast")} ${gap}` : gap < 0 ? `${v4("trcAhead")} ${Math.abs(gap)}` : v4("trcDue")} · {AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : v4("trcBlank")} · {nextTerrace(cards, card.id) ? `${v4("trcNext")} ${nextTerrace(cards, card.id)?.title}` : v4("trcNextNone")}</p>
                <div className="c4-trc-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cyclePace(cards, card.id))}>{v4("trcPace")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTerracePin(cards, card.id, !card.pinned))}>{card.pinned ? v4("trcUnpin") : v4("trcPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer || card.archived} onClick={() => store(setTerraceHold(cards, card.id, !card.held))}>{card.held ? v4("trcResume") : v4("trcHold")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTerraceArchive(cards, card.id, !card.archived))}>{card.archived ? v4("trcReopen") : v4("trcArchive")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTerraceSeal(cards, card.id, !card.seal))}>{card.seal ? v4("trcUnseal") : v4("trcSeal")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(snoozeTerrace(cards, card.id))}>{v4("trcSnooze")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTerraceRank(cards, card.id, card.rank === 8 ? "2" : card.rank === 5 ? "8" : "5"))}>{v4("trcRaised")}</button>
                  <button type="button" className="c4-btn" onClick={() => void copyCard(card)}>{copied === card.id ? v4("trcCopied") : v4("trcCopy")}</button>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <ol className="c4-trc-timeline">
          {!timeline.length && <li className="c4-trc-empty">{v4("trcEmpty")}</li>}
          {timeline.map((lane) => <li key={lane.seat}><span>{lane.seat}</span><strong>{lane.titles.join(" · ")}</strong></li>)}
        </ol>
      )}
      <aside className="c4-trc-side" aria-label={v4("trcReminders")}>
        <h3 className="c4-title">{v4("trcReminders")}</h3>
        {!reminders.length && <p>{v4("trcEmpty")}</p>}
        <ul>{reminders.map((card) => <li key={card.id}>{card.title} · {lateTerrace(card, desk) ? v4("trcLate") : v4("trcSame")}</li>)}</ul>
        <h3 className="c4-title">{v4("trcCooling")}</h3>
        {!cooling.length && <p>{v4("trcCoolingEmpty")}</p>}
        <ul>{cooling.map((card) => <li key={card.id}>{card.title}</li>)}</ul>
        {focused && <p>{v4("trcFocus")} {focused.title} · {terraceShare(counts.house, Math.max(1, counts.open))}%</p>}
      </aside>
    </section>
  );
}

function colophonNote(row: TraderRow): ColophonValue {
  return { name: textField(row.name), ink: textField(row.retentionStatus), press: textField(row.desk) };
}

export function ColophonMarks({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: TraderRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("all");
  const [tone, setTone] = useState("all");
  const [review, setReview] = useState<ColophonReview>("all");
  const [shape, setShape] = useState<ColophonShape>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const reviewRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  const rows = useMemo<ColophonRow[]>(() => (queue.data?.users || []).map((row, index) => ({
    id: row.id ? `trader-${row.id}` : `trader-${index}`,
    label: textField(row.name),
    note: colophonNote(row),
  })), [queue.data?.users]);
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
    const present = presentColophonLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenColophons(readJson(CLP_KEY, []), present);
    const nextReviewed = readReviewedColophons(readJson(CLP_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(CLP_KEY, nextHidden);
    writeJson(CLP_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentColophonLanes(rows);
  const lanes = visibleColophonLanes(present, hidden, showHidden);
  const laneOn = activeColophonLane(lane, present);
  const toneOn = activeColophonTone(tone);
  const shown = visibleColophons(rows, colophonLaneArg(laneOn), colophonToneArg(toneOn), query, review, reviewed, shape).filter((row) => {
    const token = colophonLane(row.note) || (colophonState(row.note) === "clear" ? "blank" : "");
    if (!token || token === "blank") return true;
    return showHidden || !hidden.includes(token);
  });
  const focusAt = shown.length ? focus % shown.length : 0;
  useEffect(() => {
    reviewRef.current = () => {
      if (viewer) return;
      const row = shown[focusAt];
      if (!row) return;
      const next = toggleColophonReview(reviewed, row.id);
      setReviewed(next);
      writeJson(CLP_REVIEW_KEY, next);
    };
  });
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveTerraceFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveTerraceFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        reviewRef.current();
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        const order: ColophonShape[] = ["all", "join", "wide", "hall", "cipher", "ink"];
        setShape((value) => order[(order.indexOf(value) + 1) % order.length]);
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown.length]);
  const lead = leadingColophon(rows);
  const toneLead = leadingColophonTone(rows);
  const shared = sharedColophonCount(rows);
  const joined = joinedColophonCount(rows);
  const bars = colophonLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = shown.map((row) => row.id);
  const known = rows.filter((row) => colophonState(row.note) === "set").length;
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(CLP_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedColophons(next, rows.map((row) => row.id));
    setReviewed(saved);
    writeJson(CLP_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-clp" aria-label={v4("clpTitle")} data-colophons="1" data-desk="gallery" data-traders={queue.data?.users?.length ? "1" : "0"} data-role={role} data-keyed={joined ? "1" : "0"}>
      <header className="c4-clp-mast">
        <p className="c4-clp-seal" data-logo="mono">{v4("clpLogo")}</p>
        <div>
          <p className="c4-clp-kicker">{v4("clpSub")}</p>
          <h2 className="c4-title">{v4("clpTitle")}</h2>
        </div>
        <ol className="c4-clp-index" aria-label={v4("clpTitle")}>
          <li data-tone="gold">{v4("clpChampagne")}</li>
          <li data-tone="ink">{v4("clpGraphite")}</li>
          <li data-tone="ivory">{v4("clpIvory")}</li>
        </ol>
      </header>
      <p className="c4-clp-links">
        <Link href={crmv4Href(base, "trc")}>{v4("trcTitle")}</Link>
        <Link href={crmv4Href(base, "cases")}>{v4("cqTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("clpSub")}</Link>
      </p>
      {viewer && <p className="c4-clp-note">{v4("clpViewer")}</p>}
      <p className="c4-clp-rule">{v4("clpHint")}</p>
      <ul className="c4-clp-kpis" aria-label={v4("clpRules")}>
        <li><span>{v4("clpSet")}</span><strong>{known}</strong></li>
        <li><span>{v4("clpClear")}</span><strong>{rows.filter((row) => colophonState(row.note) === "clear").length}</strong></li>
        <li><span>{v4("clpHall")}</span><strong>{hallColophonCount(rows)}</strong></li>
        <li><span>{v4("clpInk")}</span><strong>{inkColophonCount(rows)}</strong></li>
        <li><span>{v4("clpWarm")}</span><strong>{warmColophonCount(rows)}</strong></li>
        <li><span>{v4("clpCold")}</span><strong>{coldColophonCount(rows)}</strong></li>
        <li><span>{v4("clpLost")}</span><strong>{lostColophonCount(rows)}</strong></li>
        <li><span>{v4("clpCipher")}</span><strong>{cipherColophonCount(rows)}</strong></li>
        <li><span>{v4("clpGilt")}</span><strong>{giltColophonCount(rows)}</strong></li>
        <li><span>{v4("clpShare")}</span><strong>{colophonShare(joined, Math.max(1, known))}%</strong></li>
        <li><span>{v4("clpShared")}</span><strong>{shared}</strong></li>
      </ul>
      <div className="c4-clp-bars" aria-label={v4("clpLead")}>
        {bars.map((bar) => (
          <div key={bar.lane} className="c4-clp-bar" data-lane={bar.lane}>
            <span>{laneLabel(v4, bar.lane)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <p className="c4-clp-meta">{lead ? `${v4("clpLead")} ${laneLabel(v4, lead)}` : v4("clpEmpty")} · {toneLead ? `${v4("clpToneLead")} ${toneLabel(v4, toneLead)}` : v4("clpUnmarked")} · {v4("clpWide")} {rows.filter((row) => wideColophon(row.note)).length}</p>
      <div className="c4-clp-tools">
        <label className="c4-lab"><span>{v4("clpSearch")}</span><input ref={searchRef} className="c4-field c4-clp-search" aria-label={v4("clpSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <button type="button" className="c4-btn" onClick={() => download("colophon-lanes.csv", colophonsCsv(rows))}>{v4("clpCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("colophon-rows.csv", colophonRowsCsv(rows, reviewed))}>{v4("clpRowCsv")}</button>
        <button type="button" className="c4-btn" aria-pressed={showHidden} onClick={() => setShowHidden((value) => !value)}>{v4("clpShow")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkColophonReview(reviewed, ids, true))}>{v4("clpBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkColophonReview(reviewed, ids, false))}>{v4("clpBulkClear")}</button>
      </div>
      <div className="c4-clp-tools" role="group" aria-label={v4("clpAll")}>
        <button type="button" className="c4-chip" data-on={laneOn === "all" ? "1" : "0"} onClick={() => setLane("all")}>{v4("clpAll")}</button>
        {lanes.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={laneOn === item ? "1" : "0"} onClick={() => setLane(item)}>{laneLabel(v4, item)}</button>
        ))}
        {(["gilt", "linen", "pale", "ash", "haze"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={toneOn === item ? "1" : "0"} onClick={() => setTone(toneOn === item ? "all" : item)}>{toneLabel(v4, item)}</button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("clpAll") : item === "reviewed" ? v4("clpReviewed") : v4("clpUnreviewed")}</button>
        ))}
        {(["all", "join", "wide", "hall", "cipher", "ink"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{item === "all" ? v4("clpShapeAll") : item === "join" ? v4("clpShapeJoin") : item === "wide" ? v4("clpShapeWide") : item === "hall" ? v4("clpShapeHall") : item === "cipher" ? v4("clpShapeCipher") : v4("clpShapeInk")}</button>
        ))}
      </div>
      {!shown.length && <p className="c4-clp-empty">{v4("clpEmpty")}</p>}
      <ol className="c4-clp-board">
        {shown.map((row, index) => {
          const current = colophonLane(row.note);
          const toneName = colophonTone(row.note);
          return (
            <li key={row.id} className="c4-clp-card" data-on={index === focusAt ? "1" : "0"} data-lane={current || "blank"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"} data-wide={wideColophon(row.note) ? "1" : "0"} data-join={joinedColophon(row.note) ? "1" : "0"}>
              <strong>{row.label || v4("clpClear")}</strong>
              <p className="c4-clp-meta">{v4("clpMark")} {colophonMark(row.note) || v4("clpUnmarked")} · {laneLabel(v4, current)} · {toneLabel(v4, toneName)} · {v4("clpStep")} {colophonStep(row.note)} · {v4("clpStatus")} · {v4("clpDesk")}</p>
              <div className="c4-clp-tools">
                <button type="button" className="c4-btn" disabled={viewer || !current} onClick={() => storeHidden(toggleColophon(hidden, current))}>{hidden.includes(current) ? v4("clpShow") : v4("clpHide")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleColophonReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("clpReviewed") : v4("clpReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const body = colophonCopy(row.note); void navigator.clipboard.writeText(body).catch(() => undefined); setCopied(row.id); }}>{copied === row.id ? v4("clpCopied") : v4("clpCopy")}</button>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
