"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  ORDER_KEY,
  ORDER_VIEW_KEY,
  STEM_KEY,
  STEM_REVIEW_KEY,
  activeHost,
  activeInk,
  activeLane,
  activeMark,
  activePace,
  activeRank,
  activeSpan,
  activeStem,
  activeStemDepth,
  addOrder,
  addOrderView,
  atStem,
  atStemCount,
  bulkOrderClose,
  bulkOrderInk,
  bulkOrderPin,
  bulkStemReview,
  clashLaneCount,
  cyclePace,
  dropOrderView,
  editOrder,
  editOrderNote,
  evenStem,
  evenStemCount,
  fairHost,
  hashStem,
  hashStemCount,
  homeDesk,
  hostArg,
  inkArg,
  inkCounts,
  laneArg,
  laneGap,
  lateOrder,
  leadingStem,
  leadingStemDepth,
  markArg,
  nextOrder,
  orderCopy,
  orderCounts,
  orderHosts,
  orderMarks,
  orderPaces,
  orderShare,
  ordersCsv,
  paceArg,
  presentStems,
  rankArg,
  rankClashCount,
  readHiddenStems,
  readOrderViews,
  readOrders,
  readReviewedStems,
  resetOrders,
  setOrderClose,
  setOrderPause,
  setOrderPin,
  sharedStemCount,
  soonOrder,
  spanArg,
  stemArg,
  stemBand,
  stemCopy,
  stemDepth,
  stemDepthArg,
  stemRowsCsv,
  stemShare,
  stemState,
  stemWords,
  stemsCsv,
  suggestHost,
  suggestInk,
  suggestSpan,
  toggleStem,
  toggleStemReview,
  usedLanes,
  visibleOrders,
  visibleStemBands,
  visibleStemCustomers,
  orderTimeline,
  type MorningOrder,
  type OrderInk,
  type OrderPace,
  type OrderTray,
  type OrderView,
  type StemRow,
  type StemShape,
} from "@/lib/crmv4/round183";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  affiliateA?: string | null;
};

type GlanceRow = StemRow & { id: string };

const INKS = ["ivory", "graphite", "champagne"] as const;
const BANDS = ["pip", "slip", "card", "roll"] as const;

function inkName(v4: V4, ink: OrderInk | string): string {
  if (ink === "ivory") return v4("morIvory");
  if (ink === "graphite") return v4("morGraphite");
  if (ink === "champagne") return v4("morChampagne");
  return v4("morBlankInk");
}

function paceName(v4: V4, pace: OrderPace | string): string {
  if (pace === "calm") return v4("morPaceCalm");
  if (pace === "brisk") return v4("morPaceBrisk");
  if (pace === "urgent") return v4("morPaceUrgent");
  return v4("morBlankPace");
}

function laneName(v4: V4, name: string): string {
  if (name === "early") return v4("morEarly");
  if (name === "mid") return v4("morMid");
  if (name === "late") return v4("morLateBand");
  if (name === "peak") return v4("morPeak");
  if (name === "quiet") return v4("morQuiet");
  if (/^[1-6]$/.test(name)) return name;
  return v4("morBlankLane");
}

function rankName(v4: V4, rank: number | null): string {
  if (rank === 1) return v4("morRank1");
  if (rank === 3) return v4("morRank3");
  if (rank === 5) return v4("morRank5");
  return v4("morBlankRank");
}

function spanName(v4: V4, span: number | null): string {
  if (span === 15) return v4("morSpan15");
  if (span === 45) return v4("morSpan45");
  if (span === 90) return v4("morSpan90");
  return v4("morBlankSpan");
}

function bandName(v4: V4, name: string): string {
  if (name === "pip") return v4("aidPip");
  if (name === "slip") return v4("aidSlip");
  if (name === "card") return v4("aidCard");
  if (name === "roll") return v4("aidRoll");
  if (name === "blank") return v4("aidClear");
  return v4("aidUnmarked");
}

function depthName(v4: V4, name: string): string {
  if (name === "plain") return v4("aidPlain");
  if (name === "stack") return v4("aidStack");
  if (name === "pile") return v4("aidPile");
  if (name === "seam") return v4("aidSeam");
  if (name === "rail") return v4("aidRail");
  if (name === "figure") return v4("aidFigure");
  return v4("aidUnmarked");
}

function auditName(v4: V4, audit: string): string {
  const key = {
    save: "morAuditSave",
    edit: "morAuditEdit",
    pace: "morAuditPace",
    pin: "morAuditPin",
    unpin: "morAuditUnpin",
    pause: "morAuditPause",
    resume: "morAuditResume",
    close: "morAuditClose",
    reopen: "morAuditOpen",
    ink: "morAuditInk",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, lane: number | null, desk: string): string {
  const gap = laneGap(lane, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("morPast")} ${gap}`;
  if (gap < 0) return `${v4("morAhead")} ${Math.abs(gap)}`;
  return v4("morDue");
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

export function MorningOrders({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<MorningOrder[]>([]);
  const [views, setViews] = useState<OrderView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [host, setHost] = useState("");
  const [lane, setLane] = useState("");
  const [ink, setInk] = useState("");
  const [mark, setMark] = useState("");
  const [pace, setPace] = useState("");
  const [rank, setRank] = useState("");
  const [span, setSpan] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<OrderTray>("open");
  const [hostFilter, setHostFilter] = useState("all");
  const [inkFilter, setInkFilter] = useState("all");
  const [markFilter, setMarkFilter] = useState("all");
  const [paceFilter, setPaceFilter] = useState("all");
  const [laneFilter, setLaneFilter] = useState("all");
  const [rankFilter, setRankFilter] = useState("all");
  const [spanFilter, setSpanFilter] = useState("all");
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [homeOnly, setHomeOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [desk, setDesk] = useState("");
  const [moveInk, setMoveInk] = useState("ivory");
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readOrders(readJson(ORDER_KEY, []));
    const saved = readOrderViews(readJson(ORDER_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(ORDER_KEY, next);
    writeJson(ORDER_VIEW_KEY, saved);
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
  function store(next: MorningOrder[]) {
    const saved = readOrders(next);
    setCards(saved);
    writeJson(ORDER_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((card) => card.id === id)));
  }
  const hosts = orderHosts(cards);
  const marks = orderMarks(cards);
  const paces = orderPaces(cards);
  const bars = inkCounts(cards);
  const hostOn = activeHost(hostFilter, hosts);
  const inkOn = activeInk(inkFilter, INKS);
  const markOn = activeMark(markFilter, marks);
  const paceOn = activePace(paceFilter, paces);
  const laneOn = activeLane(laneFilter);
  const rankOn = activeRank(rankFilter);
  const spanOn = activeSpan(spanFilter);
  const pickedLane = laneArg(laneOn);
  const shown = visibleOrders(
    cards,
    tray,
    query,
    hostArg(hostOn),
    inkArg(inkOn),
    markArg(markOn),
    paceArg(paceOn),
    pickedLane.exact,
    pickedLane.pick,
    rankArg(rankOn),
    spanArg(spanOn),
    urgentOnly,
    peakOnly,
    homeOnly,
  );
  const timeline = orderTimeline(cards, query);
  const counts = orderCounts(cards, desk);
  const clashes = clashLaneCount(cards);
  const ranks = rankClashCount(cards);
  const nextId = nextOrder(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const suggestedInk = suggestInk(cards);
  const suggestedHost = suggestHost(cards);
  const suggestedSpan = suggestSpan(cards);
  const fair = fairHost(cards, roster);
  const total = cards.length;
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  function clearDraft() {
    setTitle("");
    setNote("");
    setHost("");
    setLane("");
    setInk("");
    setMark("");
    setPace("");
    setRank("");
    setSpan("");
    setQuery("");
    setEditing("");
  }
  return (
    <section className="c4-mor" aria-label={v4("morTitle")} data-orders="1" data-role={role}>
      <header className="c4-mor-mast">
        <div>
          <p className="c4-mor-kicker">{v4("morSub")}</p>
          <h2 className="c4-title">{v4("morTitle")}</h2>
        </div>
        <p className="c4-mor-plate" data-logo="mono">{v4("morLogo")}</p>
      </header>
      <p className="c4-mor-rules">{v4("morHint")}</p>
      <p className="c4-meta">{v4("morLocal")}</p>
      <p className="c4-meta">{v4("morNew")} {v4("morSlash")} {v4("morEscape")}</p>
      {viewer && <p className="c4-mor-notice" data-viewer="1">{v4("morViewer")}</p>}
      {counts.peak > 0 && (
        <div className="c4-mor-bells">
          <p className="c4-mor-notice">{v4("morNotice")} · {counts.peak}</p>
          <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("morNoticeAll") : v4("morNoticePeak")}</button>
        </div>
      )}
      <dl className="c4-mor-kpi" aria-label={v4("morKpi")}>
        <div><dt>{v4("morWaiting")}</dt><dd>{counts.open}</dd></div>
        <div><dt>{v4("morPaused")}</dt><dd>{counts.paused}</dd></div>
        <div><dt>{v4("morClosed")}</dt><dd>{counts.closed}</dd></div>
        <div><dt>{v4("morPinned")}</dt><dd>{counts.pinned}</dd></div>
        <div><dt>{v4("morPeak")}</dt><dd>{counts.peak}</dd></div>
        <div><dt>{v4("morLate")}</dt><dd>{counts.late}</dd></div>
        <div><dt>{v4("morSoon")}</dt><dd>{counts.soon}</dd></div>
        <div><dt>{v4("morHomeShare")}</dt><dd>{orderShare(counts.home, total)}%</dd></div>
      </dl>
      <div className="c4-mor-chart" aria-label={v4("morInks")}>
        {bars.map((bar) => (
          <div key={bar.ink} className="c4-mor-col" data-on={inkOn === bar.ink ? "1" : "0"}>
            <span className="c4-mor-swatch" data-ink={bar.ink} />
            <div className="c4-mor-track" aria-hidden="true"><i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            <button type="button" className="c4-btn" onClick={() => setInkFilter(bar.ink)}>{inkName(v4, bar.ink)} · {bar.count}</button>
          </div>
        ))}
        {!bars.length && <p className="c4-empty-gold">{v4("morEmpty")}</p>}
      </div>
      <div className="c4-mor-suggest">
        <p>{v4("morSuggestInk")} · {inkName(v4, suggestedInk)}</p>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setInk(suggestedInk)}>{v4("morUseInk")}</button>
        <p>{v4("morSuggestHost")} · {suggestedHost || v4("morBlankHost")}</p>
        <button type="button" className="c4-btn" disabled={viewer || !suggestedHost} onClick={() => setHost(suggestedHost)}>{v4("morUseHost")}</button>
        <p>{v4("morSuggestSpan")} · {spanName(v4, suggestedSpan)}</p>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setSpan(String(suggestedSpan))}>{v4("morUseSpan")}</button>
        <p>{v4("morAssign")} · {fair || v4("morBlankHost")}</p>
        <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setHost(fair)}>{v4("morAssign")}</button>
      </div>
      <p className="c4-meta">{v4("morLaneUse")} · {usedLanes(cards)} · {clashes ? `${v4("morClash")} · ${clashes}` : v4("morClashNone")} · {ranks ? `${v4("morRankClash")} · ${ranks}` : v4("morRankClashNone")}</p>
      <p className="c4-meta">{v4("morNext")} · {nextCard ? nextCard.title : v4("morNextNone")}</p>
      <form className="c4-mor-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addOrder(cards, { id: `mor-${Date.now()}`, title, note, host, lane, ink, mark, pace, rank, span });
        if (next.length === cards.length && title.trim()) return;
        store(next);
        setTitle("");
        setNote("");
      }}>
        <label className="c4-lab"><span>{v4("morLine")}</span>
          <input ref={titleRef} className="c4-field" aria-label={v4("morLine")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab"><span>{v4("morNote")}</span>
          <input className="c4-field" aria-label={v4("morNote")} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("morHost")}</span>
          <input className="c4-field" aria-label={v4("morHost")} value={host} disabled={viewer} onChange={(event) => setHost(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("morLane")}</span>
          <input className="c4-field" aria-label={v4("morLane")} inputMode="numeric" value={lane} disabled={viewer} onChange={(event) => setLane(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("morInk")}</span>
          <select className="c4-field" aria-label={v4("morInk")} value={ink} disabled={viewer} onChange={(event) => setInk(event.target.value)}>
            <option value="">{v4("morBlankInk")}</option>
            {INKS.map((item) => <option key={item} value={item}>{inkName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("morMark")}</span>
          <input className="c4-field" aria-label={v4("morMark")} value={mark} disabled={viewer} onChange={(event) => setMark(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("morPace")}</span>
          <select className="c4-field" aria-label={v4("morPace")} value={pace} disabled={viewer} onChange={(event) => setPace(event.target.value)}>
            <option value="">{v4("morBlankPace")}</option>
            <option value="calm">{v4("morPaceCalm")}</option>
            <option value="brisk">{v4("morPaceBrisk")}</option>
            <option value="urgent">{v4("morPaceUrgent")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("morRank")}</span>
          <input className="c4-field" aria-label={v4("morRank")} inputMode="numeric" value={rank} disabled={viewer} onChange={(event) => setRank(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("morSpan")}</span>
          <input className="c4-field" aria-label={v4("morSpan")} inputMode="numeric" value={span} disabled={viewer} onChange={(event) => setSpan(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("morRoster")}</span>
          <input className="c4-field" aria-label={v4("morRoster")} value={roster} disabled={viewer} onChange={(event) => setRoster(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn c4-btn-hot" disabled={viewer}>{v4("morAdd")}</button>
      </form>
      <p className="c4-meta">{v4("morBlank")} {v4("morLaneBlank")}</p>
      <div className="c4-mor-filters">
        {(["open", "paused", "closed"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>
            {item === "open" ? v4("morWaiting") : item === "paused" ? v4("morPaused") : v4("morClosed")}
          </button>
        ))}
        <label className="c4-lab"><span>{v4("morSearch")}</span>
          <input ref={searchRef} className="c4-field" aria-label={v4("morSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab"><span>{v4("morDeskLane")}</span>
          <input className="c4-field" aria-label={v4("morDeskLane")} inputMode="numeric" value={desk} onChange={(event) => setDesk(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("morHosts")}</span>
          <select className="c4-field" aria-label={v4("morAllHosts")} value={hostOn} onChange={(event) => setHostFilter(event.target.value)}>
            <option value="all">{v4("morAllHosts")}</option>
            <option value="blank">{v4("morBlankHost")}</option>
            {hosts.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("morInks")}</span>
          <select className="c4-field" aria-label={v4("morAllInks")} value={inkOn} onChange={(event) => setInkFilter(event.target.value)}>
            <option value="all">{v4("morAllInks")}</option>
            <option value="blank">{v4("morBlankInk")}</option>
            {INKS.map((item) => <option key={item} value={item}>{inkName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("morMarks")}</span>
          <select className="c4-field" aria-label={v4("morAllMarks")} value={markOn} onChange={(event) => setMarkFilter(event.target.value)}>
            <option value="all">{v4("morAllMarks")}</option>
            <option value="blank">{v4("morBlankMark")}</option>
            {marks.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("morPaces")}</span>
          <select className="c4-field" aria-label={v4("morAllPaces")} value={paceOn} onChange={(event) => setPaceFilter(event.target.value)}>
            <option value="all">{v4("morAllPaces")}</option>
            <option value="blank">{v4("morBlankPace")}</option>
            {paces.map((item) => <option key={item} value={item}>{paceName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("morLanes")}</span>
          <select className="c4-field" aria-label={v4("morAllLanes")} value={laneOn} onChange={(event) => setLaneFilter(event.target.value)}>
            <option value="all">{v4("morAllLanes")}</option>
            {["blank", "early", "mid", "late", "peak", "quiet", "1", "2", "3", "4", "5", "6"].map((item) => <option key={item} value={item}>{laneName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("morRanks")}</span>
          <select className="c4-field" aria-label={v4("morAllRanks")} value={rankOn} onChange={(event) => setRankFilter(event.target.value)}>
            <option value="all">{v4("morAllRanks")}</option>
            <option value="blank">{v4("morBlankRank")}</option>
            <option value="1">{v4("morRank1")}</option>
            <option value="3">{v4("morRank3")}</option>
            <option value="5">{v4("morRank5")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("morSpans")}</span>
          <select className="c4-field" aria-label={v4("morAllSpans")} value={spanOn} onChange={(event) => setSpanFilter(event.target.value)}>
            <option value="all">{v4("morAllSpans")}</option>
            <option value="blank">{v4("morBlankSpan")}</option>
            <option value="15">{v4("morSpan15")}</option>
            <option value="45">{v4("morSpan45")}</option>
            <option value="90">{v4("morSpan90")}</option>
          </select>
        </label>
        <button type="button" className="c4-chip" data-on={urgentOnly ? "1" : "0"} onClick={() => setUrgentOnly((on) => !on)}>{v4("morUrgentOnly")}</button>
        <button type="button" className="c4-chip" data-on={homeOnly ? "1" : "0"} onClick={() => setHomeOnly((on) => !on)}>{homeOnly ? v4("morHomeOnly") : v4("morHomeAll")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard((item) => item === "cards" ? "timeline" : "cards")}>{board === "cards" ? v4("morTimeline") : v4("morCards")}</button>
      </div>
      <form className="c4-mor-views" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addOrderView(views, {
          id: `view-${Date.now()}`,
          name: viewName,
          tray,
          query,
          host: hostOn,
          ink: inkOn,
          mark: markOn,
          pace: paceOn,
          lane: laneOn,
          rank: rankOn,
          span: spanOn,
        });
        setViews(next);
        writeJson(ORDER_VIEW_KEY, next);
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("morViewName")}</span>
          <input className="c4-field" aria-label={v4("morViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("morSaveView")}</button>
        <ul aria-label={v4("morViews")}>
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => {
                setTray(view.tray);
                setQuery(view.query);
                setHostFilter(view.host);
                setInkFilter(view.ink);
                setMarkFilter(view.mark);
                setPaceFilter(view.pace);
                setLaneFilter(view.lane);
                setRankFilter(view.rank);
                setSpanFilter(view.span);
              }}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
                const next = dropOrderView(views, view.id);
                setViews(next);
                writeJson(ORDER_VIEW_KEY, next);
              }}>{v4("morDropView")}</button>
            </li>
          ))}
        </ul>
      </form>
      <div className="c4-row">
        <button type="button" className="c4-btn" onClick={() => setPicked(shown.map((card) => card.id))}>{v4("morPickAll")}</button>
        <button type="button" className="c4-btn" onClick={() => setPicked([])}>{v4("morPickNone")}</button>
        <span className="c4-meta">{v4("morPicked")} · {picked.length}</span>
        <select className="c4-field" aria-label={v4("morBulkInk")} value={moveInk} disabled={viewer} onChange={(event) => setMoveInk(event.target.value)}>
          {INKS.map((item) => <option key={item} value={item}>{inkName(v4, item)}</option>)}
        </select>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkOrderInk(cards, picked, moveInk))}>{v4("morBulkInk")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkOrderPin(cards, picked, true))}>{v4("morBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkOrderClose(cards, picked, true))}>{v4("morBulkClose")}</button>
        <button type="button" className="c4-btn" onClick={() => download("morning-orders.csv", ordersCsv(cards, desk))}>{v4("morCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetOrders())}>{v4("morReset")}</button>
      </div>
      {board === "timeline" ? (
        <ol className="c4-mor-timeline" aria-label={v4("morTimeline")}>
          {timeline.map((card) => <li key={card.id} data-lane={card.lane}>{card.lane} · {card.title}</li>)}
          {!timeline.length && <li className="c4-empty-gold">{v4("morEmpty")}</li>}
        </ol>
      ) : (
        <ul className="c4-mor-cards">
          {shown.map((card) => {
            const openEdit = editing === card.id;
            return (
              <li key={card.id} data-ink={card.ink || "blank"} data-pace={card.pace || "blank"} data-pinned={card.pinned ? "1" : "0"} data-late={lateOrder(card, desk) ? "1" : "0"} data-soon={soonOrder(card) ? "1" : "0"} data-home={homeDesk(card.mark) ? "1" : "0"}>
                <label className="c4-row">
                  <input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={(event) => setPicked((ids) => event.target.checked ? [...ids, card.id] : ids.filter((id) => id !== card.id))} />
                  {openEdit ? (
                    <input className="c4-field" aria-label={v4("morEdit")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                  ) : <strong>{card.title}</strong>}
                </label>
                <p className="c4-meta">{card.host || v4("morBlankHost")} · {card.lane ?? v4("morBlankLane")} · {inkName(v4, card.ink)} · {card.mark || v4("morBlankMark")} · {paceName(v4, card.pace)} · {rankName(v4, card.rank)} · {spanName(v4, card.span)}</p>
                {openEdit ? (
                  <input className="c4-field" aria-label={v4("morNote")} value={noteDraft} disabled={viewer} onChange={(event) => setNoteDraft(event.target.value)} />
                ) : card.note && <p>{card.note}</p>}
                <p className="c4-meta">{gapLabel(v4, card.lane, desk)} {auditName(v4, card.audit)}</p>
                <div className="c4-row">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOrderPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("morUnpin") : v4("morPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOrderPause(cards, card.id, !card.paused))}>{card.paused ? v4("morResume") : v4("morPause")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOrderClose(cards, card.id, !card.closed))}>{card.closed ? v4("morReopen") : v4("morClose")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cyclePace(cards, card.id))}>{v4("morPaceUp")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
                    if (openEdit) {
                      store(editOrderNote(editOrder(cards, card.id, draft), card.id, noteDraft));
                      setEditing("");
                      return;
                    }
                    setEditing(card.id);
                    setDraft(card.title);
                    setNoteDraft(card.note);
                  }}>{openEdit ? v4("morAdd") : v4("morEdit")}</button>
                  <button type="button" className="c4-btn" onClick={() => {
                    void navigator.clipboard?.writeText(orderCopy(card));
                    setCopied(card.id);
                  }}>{copied === card.id ? v4("morCopied") : v4("morCopy")}</button>
                </div>
              </li>
            );
          })}
          {!shown.length && <li className="c4-empty-gold">{v4("morEmpty")}</li>}
        </ul>
      )}
      <p className="c4-meta">{v4("morRules")}</p>
    </section>
  );
}

export function AffiliateStems({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [band, setBand] = useState("all");
  const [depth, setDepth] = useState("all");
  const [shape, setShape] = useState<StemShape>("all");
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
    note: { affiliateA: user.affiliateA ?? null },
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
    const present = presentStems(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenStems(readJson(STEM_KEY, []), present);
    const nextReviewed = readReviewedStems(readJson(STEM_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(STEM_KEY, nextHidden);
    writeJson(STEM_REVIEW_KEY, nextReviewed);
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
  const present = presentStems(rows);
  const bandOn = activeStem(band, present);
  const depthOn = activeStemDepth(depth);
  const bands = visibleStemBands(present, hidden, showHidden);
  const shown = visibleStemCustomers(rows, stemArg(bandOn), stemDepthArg(depthOn), query, review, reviewed, shape).filter((row) => {
    const state = stemState(row.note);
    if (state === "") return bandOn === "all" && !showHidden;
    const token = state === "set" ? stemBand(row.note) : "blank";
    return bands.includes(token);
  });
  const lead = leadingStem(rows);
  const leadDepth = leadingStemDepth(rows);
  const shared = sharedStemCount(rows);
  const setCount = rows.filter((row) => stemState(row.note) === "set").length;
  return (
    <section className="c4-aid" aria-label={v4("aidTitle")} data-stems="1" data-role={role}>
      <header className="c4-aid-mast">
        <div>
          <p className="c4-aid-kicker">{v4("aidSub")}</p>
          <h2 className="c4-title">{v4("aidTitle")}</h2>
        </div>
        <p className="c4-aid-plate" data-logo="mono">7FX</p>
      </header>
      <p className="c4-aid-rules">{v4("aidHint")}</p>
      <p className="c4-meta">{v4("aidKept")} {v4("aidEscape")}</p>
      {viewer && <p className="c4-aid-notice">{v4("aidViewer")}</p>}
      {data.error && <p className="c4-empty-gold">{v4("aidFailed")}</p>}
      {data.loading && <p className="c4-meta">{v4("aidLoading")}</p>}
      {!data.loading && !rows.length && <p className="c4-empty-gold">{v4("aidNone")}</p>}
      <dl className="c4-mor-kpi" aria-label={v4("aidSetNotice")}>
        <div><dt>{v4("aidCustomers")}</dt><dd>{rows.length}</dd></div>
        <div><dt>{v4("aidSetNotice")}</dt><dd>{setCount}</dd></div>
        <div><dt>{v4("aidShare")}</dt><dd>{stemShare(setCount, rows.length)}%</dd></div>
        <div><dt>{v4("aidShared")}</dt><dd>{shared}</dd></div>
        <div><dt>{v4("aidLeadBand")}</dt><dd>{lead ? bandName(v4, lead) : v4("aidUnmarked")}</dd></div>
        <div><dt>{v4("aidLeadDepth")}</dt><dd>{leadDepth ? depthName(v4, leadDepth) : v4("aidUnmarked")}</dd></div>
        <div><dt>{v4("aidHash")}</dt><dd>{hashStemCount(rows)}</dd></div>
        <div><dt>{v4("aidEven")}</dt><dd>{evenStemCount(rows)}</dd></div>
        <div><dt>{v4("aidAt")}</dt><dd>{atStemCount(rows)}</dd></div>
      </dl>
      <div className="c4-mor-chart" aria-label={v4("aidShapes")}>
        {BANDS.map((item) => {
          const count = rows.filter((row) => stemBand(row.note) === item).length;
          return (
            <div key={item} className="c4-mor-col" data-on={bandOn === item ? "1" : "0"}>
              <div className="c4-mor-track"><i style={{ height: `${stemShare(count, rows.length) || (count ? 8 : 0)}%` }} /></div>
              <button type="button" className="c4-btn" onClick={() => setBand(item)}>{bandName(v4, item)} · {count}</button>
            </div>
          );
        })}
      </div>
      <div className="c4-row">
        <label className="c4-lab"><span>{v4("aidSearch")}</span>
          <input ref={searchRef} className="c4-field" aria-label={v4("aidSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            setQuery("");
          }} />
        </label>
        <label className="c4-lab"><span>{v4("aidAllBands")}</span>
          <select className="c4-field" aria-label={v4("aidAllBands")} value={bandOn} onChange={(event) => setBand(event.target.value)}>
            <option value="all">{v4("aidAllBands")}</option>
            <option value="blank">{v4("aidClear")}</option>
            {present.filter((item) => item !== "blank").map((item) => <option key={item} value={item}>{bandName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("aidAllDepths")}</span>
          <select className="c4-field" aria-label={v4("aidAllDepths")} value={depthOn} onChange={(event) => setDepth(event.target.value)}>
            <option value="all">{v4("aidAllDepths")}</option>
            {["plain", "stack", "pile", "seam", "rail", "figure"].map((item) => <option key={item} value={item}>{depthName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("aidAllShapes")}</span>
          <select className="c4-field" aria-label={v4("aidAllShapes")} value={shape} onChange={(event) => setShape(event.target.value as StemShape)}>
            <option value="all">{v4("aidAllShapes")}</option>
            <option value="hash">{v4("aidHashOnly")}</option>
            <option value="even">{v4("aidEvenOnly")}</option>
            <option value="at">{v4("aidAtOnly")}</option>
          </select>
        </label>
        <button type="button" className="c4-chip" data-on={review === "open" ? "1" : "0"} onClick={() => setReview((item) => item === "open" ? "all" : "open")}>{v4("aidOpenMarks")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview((item) => item === "reviewed" ? "all" : "reviewed")}>{v4("aidReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("aidHidden") : v4("aidShow")}</button>
      </div>
      <ul className="c4-aid-bands" aria-label={v4("aidHide")}>
        {present.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" data-on={hidden.includes(item) ? "1" : "0"} disabled={viewer} onClick={() => {
              const next = toggleStem(hidden, item, present);
              setHidden(next);
              writeJson(STEM_KEY, next);
            }}>{hidden.includes(item) ? v4("aidShow") : v4("aidHide")} · {bandName(v4, item)}</button>
          </li>
        ))}
      </ul>
      <div className="c4-row">
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
          const next = bulkStemReview(reviewed, shown.map((row) => row.id), rows.map((row) => row.id), true);
          setReviewed(next);
          writeJson(STEM_REVIEW_KEY, next);
        }}>{v4("aidBulkReview")}</button>
        <button type="button" className="c4-btn" onClick={() => download("affiliate-stems.csv", stemsCsv(rows))}>{v4("aidCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("affiliate-stem-rows.csv", stemRowsCsv(shown, reviewed))}>{v4("aidRowCsv")}</button>
        <span className="c4-meta">{v4("aidShown")} · {shown.length}</span>
      </div>
      <ul className="c4-aid-rows" aria-label={v4("aidBoard")}>
        {shown.map((row) => {
          const code = stemCopy(row.note);
          const seen = reviewed.includes(row.id);
          const hashed = hashStem(row.note);
          const even = evenStem(row.note);
          const at = atStem(row.note);
          return (
            <li key={row.id} data-band={stemBand(row.note) || "blank"} data-reviewed={seen ? "1" : "0"} data-hash={hashed ? "1" : "0"} data-even={even ? "1" : "0"} data-at={at ? "1" : "0"}>
              <Link href={crmv4Href(base, `customers/${row.id}`)}>{row.label}</Link>
              <p className="c4-meta">{code || (stemState(row.note) === "clear" ? v4("aidClear") : v4("aidUnmarked"))} · {bandName(v4, stemBand(row.note) || (stemState(row.note) === "clear" ? "blank" : ""))} · {depthName(v4, stemDepth(row.note))} · {v4("aidParts")} {stemWords(row.note)}</p>
              <div className="c4-row">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
                  const next = toggleStemReview(reviewed, row.id, rows.map((item) => item.id));
                  setReviewed(next);
                  writeJson(STEM_REVIEW_KEY, next);
                }}>{seen ? v4("aidReviewed") : v4("aidReview")}</button>
                <button type="button" className="c4-btn" disabled={!code} onClick={() => {
                  void navigator.clipboard?.writeText(code);
                  setCopied(row.id);
                }}>{copied === row.id ? v4("aidCopied") : v4("aidCopy")}</button>
              </div>
            </li>
          );
        })}
        {!shown.length && <li className="c4-empty-gold">{v4("aidEmpty")}</li>}
      </ul>
      <p className="c4-meta">{v4("aidUnreviewed")} · {rows.filter((row) => !reviewed.includes(row.id)).length} · {v4("aidRules")}</p>
    </section>
  );
}
