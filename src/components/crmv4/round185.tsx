"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  SPAN_KEY,
  SPAN_REVIEW_KEY,
  VOW_KEY,
  VOW_VIEW_KEY,
  activeCaller,
  activeLane,
  activePace,
  activeRank,
  activeRibbon,
  activeSeal,
  activeSpan,
  activeSpanBand,
  activeSpanParity,
  addVow,
  addVowView,
  bulkSpanReview,
  bulkVowClose,
  bulkVowPin,
  bulkVowRibbon,
  callerArg,
  catalogSpan,
  catalogSpanCount,
  clashLaneCount,
  cyclePace,
  dropVowView,
  editVow,
  editVowNote,
  evenSpan,
  evenSpanCount,
  fairCaller,
  homeSeal,
  laneArg,
  laneGap,
  lateVow,
  leadingSpan,
  leadingSpanParity,
  nextVow,
  paceArg,
  presentSpans,
  rankArg,
  rankClashCount,
  readHiddenSpans,
  readReviewedSpans,
  readVowViews,
  readVows,
  resetVows,
  ribbonArg,
  ribbonCounts,
  sealArg,
  setVowClose,
  setVowPark,
  setVowPin,
  sharedSpanCount,
  soonVow,
  spanArg,
  spanBand,
  spanBandArg,
  spanCopy,
  spanParity,
  spanParityArg,
  spanRowsCsv,
  spanShare,
  spanState,
  spansCsv,
  steepSpan,
  steepSpanCount,
  suggestCaller,
  suggestRibbon,
  suggestSpan,
  toggleSpan,
  toggleSpanReview,
  usedLanes,
  visibleSpanBands,
  visibleSpanCustomers,
  visibleVows,
  vowCallers,
  vowCopy,
  vowCounts,
  vowPaces,
  vowSeals,
  vowShare,
  vowTimeline,
  vowsCsv,
  type SpanRow,
  type SpanShape,
  type Vow,
  type VowPace,
  type VowRibbon,
  type VowTray,
  type VowView,
} from "@/lib/crmv4/round185";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  leverage?: number | null;
};

type GlanceRow = SpanRow & { id: string };

const RIBBONS = ["ivory", "graphite", "champagne", "ink"] as const;
const BANDS = ["soft", "book", "firm", "steep"] as const;

function ribbonName(v4: V4, ribbon: VowRibbon | string): string {
  if (ribbon === "ivory") return v4("vowIvory");
  if (ribbon === "graphite") return v4("vowGraphite");
  if (ribbon === "champagne") return v4("vowChampagne");
  if (ribbon === "ink") return v4("vowInk");
  return v4("vowBlankRibbon");
}

function paceName(v4: V4, pace: VowPace | string): string {
  if (pace === "calm") return v4("vowPaceCalm");
  if (pace === "steady") return v4("vowPaceSteady");
  if (pace === "brisk") return v4("vowPaceBrisk");
  return v4("vowBlankPace");
}

function laneName(v4: V4, name: string): string {
  if (name === "dawn") return v4("vowDawn");
  if (name === "day") return v4("vowDay");
  if (name === "dusk") return v4("vowDusk");
  if (name === "peak") return v4("vowPeak");
  if (name === "quiet") return v4("vowQuiet");
  if (/^[1-6]$/.test(name)) return name;
  return v4("vowBlankLane");
}

function rankName(v4: V4, rank: number | null): string {
  if (rank === 1) return v4("vowRank1");
  if (rank === 3) return v4("vowRank3");
  if (rank === 9) return v4("vowRank9");
  return v4("vowBlankRank");
}

function spanName(v4: V4, span: number | null): string {
  if (span === 5) return v4("vowSpan5");
  if (span === 15) return v4("vowSpan15");
  if (span === 45) return v4("vowSpan45");
  return v4("vowBlankSpan");
}

function bandName(v4: V4, name: string): string {
  if (name === "soft") return v4("spnSoft");
  if (name === "book") return v4("spnBook");
  if (name === "firm") return v4("spnFirm");
  if (name === "steep") return v4("spnSteep");
  if (name === "blank") return v4("spnClear");
  return v4("spnUnmarked");
}

function parityName(v4: V4, name: string): string {
  if (name === "even") return v4("spnEven");
  if (name === "odd") return v4("spnOdd");
  return v4("spnUnmarked");
}

function auditName(v4: V4, audit: string): string {
  const key = {
    save: "vowAuditSave",
    edit: "vowAuditEdit",
    pace: "vowAuditPace",
    pin: "vowAuditPin",
    unpin: "vowAuditUnpin",
    park: "vowAuditPark",
    release: "vowAuditRelease",
    close: "vowAuditClose",
    reopen: "vowAuditOpen",
    ribbon: "vowAuditRibbon",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, lane: number | null, desk: string): string {
  const gap = laneGap(lane, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("vowPast")} ${gap}`;
  if (gap < 0) return `${v4("vowAhead")} ${Math.abs(gap)}`;
  return v4("vowDue");
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
  const tagName = (event.target as HTMLElement | null)?.tagName;
  return tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";
}

export function CourtesyVows({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<Vow[]>([]);
  const [views, setViews] = useState<VowView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [caller, setCaller] = useState("");
  const [lane, setLane] = useState("");
  const [ribbon, setRibbon] = useState("");
  const [seal, setSeal] = useState("");
  const [pace, setPace] = useState("");
  const [rank, setRank] = useState("");
  const [span, setSpan] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<VowTray>("open");
  const [callerFilter, setCallerFilter] = useState("all");
  const [ribbonFilter, setRibbonFilter] = useState("all");
  const [sealFilter, setSealFilter] = useState("all");
  const [paceFilter, setPaceFilter] = useState("all");
  const [laneFilter, setLaneFilter] = useState("all");
  const [rankFilter, setRankFilter] = useState("all");
  const [spanFilter, setSpanFilter] = useState("all");
  const [briskOnly, setBriskOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [homeOnly, setHomeOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [desk, setDesk] = useState("");
  const [moveRibbon, setMoveRibbon] = useState("ivory");
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readVows(readJson(VOW_KEY, []));
    const saved = readVowViews(readJson(VOW_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(VOW_KEY, next);
    writeJson(VOW_VIEW_KEY, saved);
    setRole(storedRole());
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        titleRef.current?.focus();
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  function store(next: Vow[]) {
    const saved = readVows(next);
    setCards(saved);
    writeJson(VOW_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((card) => card.id === id)));
  }
  const callers = vowCallers(cards);
  const seals = vowSeals(cards);
  const paces = vowPaces(cards);
  const bars = ribbonCounts(cards);
  const callerOn = activeCaller(callerFilter, callers);
  const ribbonOn = activeRibbon(ribbonFilter, RIBBONS);
  const sealOn = activeSeal(sealFilter, seals);
  const paceOn = activePace(paceFilter, paces);
  const laneOn = activeLane(laneFilter);
  const rankOn = activeRank(rankFilter);
  const spanOn = activeSpan(spanFilter);
  const pickedLane = laneArg(laneOn);
  const shown = visibleVows(
    cards,
    tray,
    query,
    callerArg(callerOn),
    ribbonArg(ribbonOn),
    sealArg(sealOn),
    paceArg(paceOn),
    pickedLane.exact,
    pickedLane.pick,
    rankArg(rankOn),
    spanArg(spanOn),
    briskOnly,
    peakOnly,
    homeOnly,
  );
  const timeline = vowTimeline(cards, query);
  const counts = vowCounts(cards, desk);
  const clashes = clashLaneCount(cards);
  const ranks = rankClashCount(cards);
  const nextId = nextVow(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const suggestedRibbon = suggestRibbon(cards);
  const suggestedCaller = suggestCaller(cards);
  const suggestedSpan = suggestSpan(cards);
  const fair = fairCaller(cards, roster);
  const total = cards.length;
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  function clearDraft() {
    setTitle("");
    setNote("");
    setCaller("");
    setLane("");
    setRibbon("");
    setSeal("");
    setPace("");
    setRank("");
    setSpan("");
    setQuery("");
    setEditing("");
  }
  return (
    <section className="c4-vow" aria-label={v4("vowTitle")} data-vows="1" data-role={role}>
      <header className="c4-vow-mast">
        <div>
          <p className="c4-vow-kicker">{v4("vowSub")}</p>
          <h2 className="c4-title">{v4("vowTitle")}</h2>
        </div>
        <p className="c4-vow-plate" data-logo="mono">{v4("vowLogo")}</p>
      </header>
      <p className="c4-vow-rules">{v4("vowHint")}</p>
      <p className="c4-meta">{v4("vowLocal")}</p>
      <p className="c4-meta">{v4("vowNew")} {v4("vowSlash")} {v4("vowEscape")}</p>
      {viewer && <p className="c4-vow-notice" data-viewer="1">{v4("vowViewer")}</p>}
      {counts.peak > 0 && (
        <div className="c4-vow-bells">
          <p className="c4-vow-notice">{v4("vowNotice")} · {counts.peak}</p>
          <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("vowNoticeAll") : v4("vowNoticePeak")}</button>
        </div>
      )}
      <dl className="c4-vow-kpi" aria-label={v4("vowKpi")}>
        <div><dt>{v4("vowWaiting")}</dt><dd>{counts.open}</dd></div>
        <div><dt>{v4("vowParked")}</dt><dd>{counts.parked}</dd></div>
        <div><dt>{v4("vowClosed")}</dt><dd>{counts.closed}</dd></div>
        <div><dt>{v4("vowPinned")}</dt><dd>{counts.pinned}</dd></div>
        <div><dt>{v4("vowPeak")}</dt><dd>{counts.peak}</dd></div>
        <div><dt>{v4("vowLate")}</dt><dd>{counts.late}</dd></div>
        <div><dt>{v4("vowSoon")}</dt><dd>{counts.soon}</dd></div>
        <div><dt>{v4("vowHomeShare")}</dt><dd>{vowShare(counts.home, total)}%</dd></div>
      </dl>
      <div className="c4-vow-chart" aria-label={v4("vowRibbons")}>
        {bars.map((bar) => (
          <div key={bar.ribbon} className="c4-vow-col" data-on={ribbonOn === bar.ribbon ? "1" : "0"}>
            <span className="c4-vow-swatch" data-ribbon={bar.ribbon} />
            <div className="c4-vow-track" aria-hidden="true"><i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            <button type="button" className="c4-btn" onClick={() => setRibbonFilter(bar.ribbon)}>{ribbonName(v4, bar.ribbon)} · {bar.count}</button>
          </div>
        ))}
        {!bars.length && <p className="c4-empty-gold">{v4("vowEmpty")}</p>}
      </div>
      <div className="c4-vow-suggest">
        <p>{v4("vowSuggestRibbon")} · {ribbonName(v4, suggestedRibbon)}</p>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setRibbon(suggestedRibbon)}>{v4("vowUseRibbon")}</button>
        <p>{v4("vowSuggestCaller")} · {suggestedCaller || v4("vowBlankCaller")}</p>
        <button type="button" className="c4-btn" disabled={viewer || !suggestedCaller} onClick={() => setCaller(suggestedCaller)}>{v4("vowUseCaller")}</button>
        <p>{v4("vowSuggestSpan")} · {spanName(v4, suggestedSpan)}</p>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setSpan(String(suggestedSpan))}>{v4("vowUseSpan")}</button>
        <p>{v4("vowAssign")} · {fair || v4("vowBlankCaller")}</p>
        <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setCaller(fair)}>{v4("vowAssign")}</button>
      </div>
      <p className="c4-meta">{v4("vowLaneUse")} · {usedLanes(cards)} · {clashes ? `${v4("vowClash")} · ${clashes}` : v4("vowClashNone")} · {ranks ? `${v4("vowRankClash")} · ${ranks}` : v4("vowRankClashNone")}</p>
      <p className="c4-meta">{v4("vowNext")} · {nextCard ? nextCard.title : v4("vowNextNone")}</p>
      <form className="c4-vow-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addVow(cards, { id: `vow-${Date.now()}`, title, note, caller, lane, ribbon, seal, pace, rank, span });
        if (next.length === cards.length && title.trim()) return;
        store(next);
        setTitle("");
        setNote("");
      }}>
        <label className="c4-lab"><span>{v4("vowLine")}</span>
          <input ref={titleRef} className="c4-field" aria-label={v4("vowLine")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab"><span>{v4("vowNote")}</span>
          <input className="c4-field" aria-label={v4("vowNote")} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("vowCaller")}</span>
          <input className="c4-field" aria-label={v4("vowCaller")} value={caller} disabled={viewer} onChange={(event) => setCaller(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("vowLane")}</span>
          <input className="c4-field" aria-label={v4("vowLane")} inputMode="numeric" value={lane} disabled={viewer} onChange={(event) => setLane(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("vowRibbon")}</span>
          <select className="c4-field" aria-label={v4("vowRibbon")} value={ribbon} disabled={viewer} onChange={(event) => setRibbon(event.target.value)}>
            <option value="">{v4("vowBlankRibbon")}</option>
            {RIBBONS.map((item) => <option key={item} value={item}>{ribbonName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("vowSeal")}</span>
          <input className="c4-field" aria-label={v4("vowSeal")} value={seal} disabled={viewer} onChange={(event) => setSeal(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("vowPace")}</span>
          <select className="c4-field" aria-label={v4("vowPace")} value={pace} disabled={viewer} onChange={(event) => setPace(event.target.value)}>
            <option value="">{v4("vowBlankPace")}</option>
            <option value="calm">{v4("vowPaceCalm")}</option>
            <option value="steady">{v4("vowPaceSteady")}</option>
            <option value="brisk">{v4("vowPaceBrisk")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("vowRank")}</span>
          <input className="c4-field" aria-label={v4("vowRank")} inputMode="numeric" value={rank} disabled={viewer} onChange={(event) => setRank(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("vowSpan")}</span>
          <input className="c4-field" aria-label={v4("vowSpan")} inputMode="numeric" value={span} disabled={viewer} onChange={(event) => setSpan(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("vowRoster")}</span>
          <input className="c4-field" aria-label={v4("vowRoster")} value={roster} disabled={viewer} onChange={(event) => setRoster(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn c4-btn-hot" disabled={viewer}>{v4("vowAdd")}</button>
      </form>
      <p className="c4-meta">{v4("vowBlank")} {v4("vowLaneBlank")}</p>
      <div className="c4-vow-filters">
        {(["open", "parked", "closed"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>
            {item === "open" ? v4("vowWaiting") : item === "parked" ? v4("vowParked") : v4("vowClosed")}
          </button>
        ))}
        <label className="c4-lab"><span>{v4("vowSearch")}</span>
          <input ref={searchRef} className="c4-field" aria-label={v4("vowSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab"><span>{v4("vowDeskLane")}</span>
          <input className="c4-field" aria-label={v4("vowDeskLane")} inputMode="numeric" value={desk} onChange={(event) => setDesk(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("vowCallers")}</span>
          <select className="c4-field" aria-label={v4("vowAllCallers")} value={callerOn} onChange={(event) => setCallerFilter(event.target.value)}>
            <option value="all">{v4("vowAllCallers")}</option>
            <option value="blank">{v4("vowBlankCaller")}</option>
            {callers.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("vowRibbons")}</span>
          <select className="c4-field" aria-label={v4("vowAllRibbons")} value={ribbonOn} onChange={(event) => setRibbonFilter(event.target.value)}>
            <option value="all">{v4("vowAllRibbons")}</option>
            <option value="blank">{v4("vowBlankRibbon")}</option>
            {RIBBONS.map((item) => <option key={item} value={item}>{ribbonName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("vowSeals")}</span>
          <select className="c4-field" aria-label={v4("vowAllSeals")} value={sealOn} onChange={(event) => setSealFilter(event.target.value)}>
            <option value="all">{v4("vowAllSeals")}</option>
            <option value="blank">{v4("vowBlankSeal")}</option>
            {seals.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("vowPaces")}</span>
          <select className="c4-field" aria-label={v4("vowAllPaces")} value={paceOn} onChange={(event) => setPaceFilter(event.target.value)}>
            <option value="all">{v4("vowAllPaces")}</option>
            <option value="blank">{v4("vowBlankPace")}</option>
            {paces.map((item) => <option key={item} value={item}>{paceName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("vowLanes")}</span>
          <select className="c4-field" aria-label={v4("vowAllLanes")} value={laneOn} onChange={(event) => setLaneFilter(event.target.value)}>
            <option value="all">{v4("vowAllLanes")}</option>
            {["blank", "dawn", "day", "dusk", "peak", "quiet", "1", "2", "3", "4", "5", "6"].map((item) => <option key={item} value={item}>{laneName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("vowRanks")}</span>
          <select className="c4-field" aria-label={v4("vowAllRanks")} value={rankOn} onChange={(event) => setRankFilter(event.target.value)}>
            <option value="all">{v4("vowAllRanks")}</option>
            <option value="blank">{v4("vowBlankRank")}</option>
            <option value="1">{v4("vowRank1")}</option>
            <option value="3">{v4("vowRank3")}</option>
            <option value="9">{v4("vowRank9")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("vowSpans")}</span>
          <select className="c4-field" aria-label={v4("vowAllSpans")} value={spanOn} onChange={(event) => setSpanFilter(event.target.value)}>
            <option value="all">{v4("vowAllSpans")}</option>
            <option value="blank">{v4("vowBlankSpan")}</option>
            <option value="5">{v4("vowSpan5")}</option>
            <option value="15">{v4("vowSpan15")}</option>
            <option value="45">{v4("vowSpan45")}</option>
          </select>
        </label>
        <button type="button" className="c4-chip" data-on={briskOnly ? "1" : "0"} onClick={() => setBriskOnly((on) => !on)}>{v4("vowBriskOnly")}</button>
        <button type="button" className="c4-chip" data-on={homeOnly ? "1" : "0"} onClick={() => setHomeOnly((on) => !on)}>{homeOnly ? v4("vowHomeOnly") : v4("vowHomeAll")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard((item) => item === "cards" ? "timeline" : "cards")}>{board === "cards" ? v4("vowTimeline") : v4("vowCards")}</button>
      </div>
      <form className="c4-vow-views" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addVowView(views, {
          id: `view-${Date.now()}`,
          name: viewName,
          tray,
          query,
          caller: callerOn,
          ribbon: ribbonOn,
          seal: sealOn,
          pace: paceOn,
          lane: laneOn,
          rank: rankOn,
          span: spanOn,
        });
        setViews(next);
        writeJson(VOW_VIEW_KEY, next);
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("vowViewName")}</span>
          <input className="c4-field" aria-label={v4("vowViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("vowSaveView")}</button>
        <ul aria-label={v4("vowViews")}>
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => {
                setTray(view.tray);
                setQuery(view.query);
                setCallerFilter(view.caller);
                setRibbonFilter(view.ribbon);
                setSealFilter(view.seal);
                setPaceFilter(view.pace);
                setLaneFilter(view.lane);
                setRankFilter(view.rank);
                setSpanFilter(view.span);
              }}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
                const next = dropVowView(views, view.id);
                setViews(next);
                writeJson(VOW_VIEW_KEY, next);
              }}>{v4("vowDropView")}</button>
            </li>
          ))}
        </ul>
      </form>
      <div className="c4-row">
        <button type="button" className="c4-btn" onClick={() => setPicked(shown.map((card) => card.id))}>{v4("vowPickAll")}</button>
        <button type="button" className="c4-btn" onClick={() => setPicked([])}>{v4("vowPickNone")}</button>
        <span className="c4-meta">{v4("vowPicked")} · {picked.length}</span>
        <select className="c4-field" aria-label={v4("vowBulkRibbon")} value={moveRibbon} disabled={viewer} onChange={(event) => setMoveRibbon(event.target.value)}>
          {RIBBONS.map((item) => <option key={item} value={item}>{ribbonName(v4, item)}</option>)}
        </select>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkVowRibbon(cards, picked, moveRibbon))}>{v4("vowBulkRibbon")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkVowPin(cards, picked, true))}>{v4("vowBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkVowClose(cards, picked, true))}>{v4("vowBulkClose")}</button>
        <button type="button" className="c4-btn" onClick={() => download("courtesy-vows.csv", vowsCsv(cards, desk))}>{v4("vowCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetVows())}>{v4("vowReset")}</button>
      </div>
      {board === "timeline" ? (
        <ol className="c4-vow-timeline" aria-label={v4("vowTimeline")}>
          {timeline.map((card) => <li key={card.id} data-lane={card.lane}>{card.lane} · {card.title}</li>)}
          {!timeline.length && <li className="c4-empty-gold">{v4("vowEmpty")}</li>}
        </ol>
      ) : (
        <ul className="c4-vow-cards">
          {shown.map((card) => {
            const openEdit = editing === card.id;
            return (
              <li key={card.id} data-ribbon={card.ribbon || "blank"} data-pace={card.pace || "blank"} data-pinned={card.pinned ? "1" : "0"} data-late={lateVow(card, desk) ? "1" : "0"} data-soon={soonVow(card) ? "1" : "0"} data-home={homeSeal(card.seal) ? "1" : "0"}>
                <label className="c4-row">
                  <input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={(event) => setPicked((ids) => event.target.checked ? [...ids, card.id] : ids.filter((id) => id !== card.id))} />
                  {openEdit ? (
                    <input className="c4-field" aria-label={v4("vowEdit")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                  ) : <strong>{card.title}</strong>}
                </label>
                <p className="c4-meta">{card.caller || v4("vowBlankCaller")} · {card.lane ?? v4("vowBlankLane")} · {ribbonName(v4, card.ribbon)} · {card.seal || v4("vowBlankSeal")} · {paceName(v4, card.pace)} · {rankName(v4, card.rank)} · {spanName(v4, card.span)}</p>
                {openEdit ? (
                  <input className="c4-field" aria-label={v4("vowNote")} value={noteDraft} disabled={viewer} onChange={(event) => setNoteDraft(event.target.value)} />
                ) : card.note && <p>{card.note}</p>}
                <p className="c4-meta">{gapLabel(v4, card.lane, desk)} {auditName(v4, card.audit)}</p>
                <div className="c4-row">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setVowPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("vowUnpin") : v4("vowPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setVowPark(cards, card.id, !card.parked))}>{card.parked ? v4("vowRelease") : v4("vowPark")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setVowClose(cards, card.id, !card.closed))}>{card.closed ? v4("vowReopen") : v4("vowClose")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cyclePace(cards, card.id))}>{v4("vowPaceUp")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
                    if (openEdit) {
                      store(editVowNote(editVow(cards, card.id, draft), card.id, noteDraft));
                      setEditing("");
                      return;
                    }
                    setEditing(card.id);
                    setDraft(card.title);
                    setNoteDraft(card.note);
                  }}>{openEdit ? v4("vowAdd") : v4("vowEdit")}</button>
                  <button type="button" className="c4-btn" onClick={() => {
                    void navigator.clipboard?.writeText(vowCopy(card));
                    setCopied(card.id);
                  }}>{copied === card.id ? v4("vowCopied") : v4("vowCopy")}</button>
                </div>
              </li>
            );
          })}
          {!shown.length && <li className="c4-empty-gold">{v4("vowEmpty")}</li>}
        </ul>
      )}
      <p className="c4-meta">{v4("vowRules")}</p>
    </section>
  );
}

export function LeverageSpans({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [band, setBand] = useState("all");
  const [parity, setParity] = useState("all");
  const [shape, setShape] = useState<SpanShape>("all");
  const [review, setReview] = useState<"all" | "reviewed" | "open">("all");
  const [query, setQuery] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<GlanceRow[]>(() => (data.data?.users || []).map((user) => ({
    id: user.id,
    label: user.name || user.id,
    note: { leverage: user.leverage ?? null },
  })), [data.data?.users]);
  useEffect(() => {
    setRole(storedRole());
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  useEffect(() => {
    const present = presentSpans(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenSpans(readJson(SPAN_KEY, []), present);
    const nextReviewed = readReviewedSpans(readJson(SPAN_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(SPAN_KEY, nextHidden);
    writeJson(SPAN_REVIEW_KEY, nextReviewed);
  }, [rows]);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const present = presentSpans(rows);
  const bandOn = activeSpanBand(band, present);
  const parityOn = activeSpanParity(parity);
  const bands = visibleSpanBands(present, hidden, showHidden);
  const shown = visibleSpanCustomers(rows, spanBandArg(bandOn), spanParityArg(parityOn), query, review, reviewed, shape).filter((row) => {
    const state = spanState(row.note);
    if (state === "") return bandOn === "all" && !showHidden;
    const token = state === "set" ? spanBand(row.note) : "blank";
    return bands.includes(token);
  });
  const lead = leadingSpan(rows);
  const leadParity = leadingSpanParity(rows);
  const shared = sharedSpanCount(rows);
  const setCount = rows.filter((row) => spanState(row.note) === "set").length;
  return (
    <section className="c4-spn" aria-label={v4("spnTitle")} data-spans="1" data-role={role}>
      <header className="c4-spn-mast">
        <div>
          <p className="c4-spn-kicker">{v4("spnSub")}</p>
          <h2 className="c4-title">{v4("spnTitle")}</h2>
        </div>
        <p className="c4-spn-plate" data-logo="mono">7FX</p>
      </header>
      <p className="c4-spn-rules">{v4("spnHint")}</p>
      <p className="c4-meta">{v4("spnKept")} {v4("spnEscape")}</p>
      {viewer && <p className="c4-spn-notice">{v4("spnViewer")}</p>}
      {data.error && <p className="c4-empty-gold">{v4("spnFailed")}</p>}
      {data.loading && <p className="c4-meta">{v4("spnLoading")}</p>}
      {!data.loading && !rows.length && <p className="c4-empty-gold">{v4("spnNone")}</p>}
      <dl className="c4-vow-kpi" aria-label={v4("spnSetNotice")}>
        <div><dt>{v4("spnCustomers")}</dt><dd>{rows.length}</dd></div>
        <div><dt>{v4("spnSetNotice")}</dt><dd>{setCount}</dd></div>
        <div><dt>{v4("spnShare")}</dt><dd>{spanShare(setCount, rows.length)}%</dd></div>
        <div><dt>{v4("spnShared")}</dt><dd>{shared}</dd></div>
        <div><dt>{v4("spnLeadBand")}</dt><dd>{lead ? bandName(v4, lead) : v4("spnUnmarked")}</dd></div>
        <div><dt>{v4("spnLeadParity")}</dt><dd>{leadParity ? parityName(v4, leadParity) : v4("spnUnmarked")}</dd></div>
        <div><dt>{v4("spnCatalog")}</dt><dd>{catalogSpanCount(rows)}</dd></div>
        <div><dt>{v4("spnSteep")}</dt><dd>{steepSpanCount(rows)}</dd></div>
        <div><dt>{v4("spnEven")}</dt><dd>{evenSpanCount(rows)}</dd></div>
      </dl>
      <div className="c4-vow-chart" aria-label={v4("spnShapes")}>
        {BANDS.map((item) => {
          const count = rows.filter((row) => spanBand(row.note) === item).length;
          return (
            <div key={item} className="c4-vow-col" data-on={bandOn === item ? "1" : "0"}>
              <div className="c4-vow-track"><i style={{ height: `${spanShare(count, rows.length) || (count ? 8 : 0)}%` }} /></div>
              <button type="button" className="c4-btn" onClick={() => setBand(item)}>{bandName(v4, item)} · {count}</button>
            </div>
          );
        })}
      </div>
      <div className="c4-row">
        <label className="c4-lab"><span>{v4("spnSearch")}</span>
          <input ref={searchRef} className="c4-field" aria-label={v4("spnSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            setQuery("");
          }} />
        </label>
        <label className="c4-lab"><span>{v4("spnAllBands")}</span>
          <select className="c4-field" aria-label={v4("spnAllBands")} value={bandOn} onChange={(event) => setBand(event.target.value)}>
            <option value="all">{v4("spnAllBands")}</option>
            <option value="blank">{v4("spnClear")}</option>
            {present.filter((item) => item !== "blank").map((item) => <option key={item} value={item}>{bandName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("spnAllParities")}</span>
          <select className="c4-field" aria-label={v4("spnAllParities")} value={parityOn} onChange={(event) => setParity(event.target.value)}>
            <option value="all">{v4("spnAllParities")}</option>
            {["even", "odd"].map((item) => <option key={item} value={item}>{parityName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("spnAllShapes")}</span>
          <select className="c4-field" aria-label={v4("spnAllShapes")} value={shape} onChange={(event) => setShape(event.target.value as SpanShape)}>
            <option value="all">{v4("spnAllShapes")}</option>
            <option value="catalog">{v4("spnCatalogOnly")}</option>
            <option value="steep">{v4("spnSteepOnly")}</option>
            <option value="even">{v4("spnEvenOnly")}</option>
          </select>
        </label>
        <button type="button" className="c4-chip" data-on={review === "open" ? "1" : "0"} onClick={() => setReview((item) => item === "open" ? "all" : "open")}>{v4("spnOpenMarks")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview((item) => item === "reviewed" ? "all" : "reviewed")}>{v4("spnReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("spnHidden") : v4("spnShow")}</button>
      </div>
      <ul className="c4-spn-bands" aria-label={v4("spnHide")}>
        {present.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" data-on={hidden.includes(item) ? "1" : "0"} disabled={viewer} onClick={() => {
              const next = toggleSpan(hidden, item, present);
              setHidden(next);
              writeJson(SPAN_KEY, next);
            }}>{hidden.includes(item) ? v4("spnShow") : v4("spnHide")} · {bandName(v4, item)}</button>
          </li>
        ))}
      </ul>
      <div className="c4-row">
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
          const next = bulkSpanReview(reviewed, shown.map((row) => row.id), rows.map((row) => row.id), true);
          setReviewed(next);
          writeJson(SPAN_REVIEW_KEY, next);
        }}>{v4("spnBulkReview")}</button>
        <button type="button" className="c4-btn" onClick={() => download("leverage-spans.csv", spansCsv(rows))}>{v4("spnCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("leverage-span-rows.csv", spanRowsCsv(shown, reviewed))}>{v4("spnRowCsv")}</button>
        <span className="c4-meta">{v4("spnShown")} · {shown.length}</span>
      </div>
      <ul className="c4-spn-rows" aria-label={v4("spnBoard")}>
        {shown.map((row) => {
          const code = spanCopy(row.note);
          const seen = reviewed.includes(row.id);
          const catalog = catalogSpan(row.note);
          const steep = steepSpan(row.note);
          const even = evenSpan(row.note);
          return (
            <li key={row.id} data-band={spanBand(row.note) || "blank"} data-reviewed={seen ? "1" : "0"} data-catalog={catalog ? "1" : "0"} data-steep={steep ? "1" : "0"} data-even={even ? "1" : "0"}>
              <Link href={crmv4Href(base, `customers/${row.id}`)}>{row.label}</Link>
              <p className="c4-meta">{code || (spanState(row.note) === "clear" ? v4("spnClear") : v4("spnUnmarked"))} · {bandName(v4, spanBand(row.note) || (spanState(row.note) === "clear" ? "blank" : ""))} · {parityName(v4, spanParity(row.note))}</p>
              <div className="c4-row">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
                  const next = toggleSpanReview(reviewed, row.id, rows.map((item) => item.id));
                  setReviewed(next);
                  writeJson(SPAN_REVIEW_KEY, next);
                }}>{seen ? v4("spnReviewed") : v4("spnReview")}</button>
                <button type="button" className="c4-btn" disabled={!code} onClick={() => {
                  void navigator.clipboard?.writeText(code);
                  setCopied(row.id);
                }}>{copied === row.id ? v4("spnCopied") : v4("spnCopy")}</button>
              </div>
            </li>
          );
        })}
        {!shown.length && <li className="c4-empty-gold">{v4("spnEmpty")}</li>}
      </ul>
      <p className="c4-meta">{v4("spnUnreviewed")} · {rows.filter((row) => !reviewed.includes(row.id)).length} · {v4("spnRules")}</p>
    </section>
  );
}
