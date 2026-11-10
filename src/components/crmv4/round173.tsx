"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  SLIP_KEY,
  SLIP_REVIEW_KEY,
  STOOL_KEY,
  STOOL_VIEW_KEY,
  activeAisle,
  activeHost,
  activePause,
  activeRank,
  activeSeat,
  activeShade,
  activeSlip,
  activeSlipDepth,
  activeTempo,
  addStool,
  addStoolView,
  aisleArg,
  bulkReview,
  bulkStoolFile,
  bulkStoolPin,
  bulkStoolTempo,
  clashSeatCount,
  cycleShade,
  dropStoolView,
  editStool,
  editStoolNote,
  hostArg,
  hostLoad,
  lateStool,
  leadingSlip,
  leadingSlipDepth,
  nextStool,
  pauseArg,
  presentSlips,
  rankArg,
  rankClashCount,
  rankClashIds,
  readHiddenSlips,
  readReviewed,
  readStoolViews,
  readStools,
  resetStools,
  seatArg,
  seatBand,
  seatClashIds,
  seatGap,
  seatTimeline,
  setStoolFiled,
  setStoolPin,
  setStoolSeat,
  shadeArg,
  shadeOf,
  slipArg,
  slipBand,
  slipBands,
  slipCopy,
  slipDepth,
  slipDepthArg,
  slipDepths,
  slipLength,
  slipRowsCsv,
  slipShare,
  slipState,
  slipsCsv,
  stoolAisles,
  stoolCopy,
  stoolCounts,
  stoolHosts,
  stoolShades,
  stoolShare,
  stoolTempos,
  stoolsCsv,
  suggestHost,
  suggestTempo,
  tempoArg,
  tempoCounts,
  tempoOf,
  toggleReview,
  toggleSlip,
  visibleSlipBands,
  visibleSlipCustomers,
  visibleStools,
  type SlipBand,
  type SlipDepth,
  type SlipRow,
  type Stool,
  type StoolShade,
  type StoolTempo,
  type StoolTray,
  type StoolView,
} from "@/lib/crmv4/round173";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  retentionNote?: string | null;
};

type GlanceRow = SlipRow & { id: string };

const TEMPOS = ["sit", "lean", "rise"] as const;
const BANDS = ["whisper", "line", "page", "folio"] as const;

function tempoName(v4: V4, tempo: StoolTempo | string): string {
  if (tempo === "sit") return v4("stlTempoSit");
  if (tempo === "lean") return v4("stlTempoLean");
  if (tempo === "rise") return v4("stlTempoRise");
  return v4("stlBlankTempo");
}

function shadeName(v4: V4, shade: StoolShade): string {
  if (shade === "mist") return v4("stlMist");
  if (shade === "leaf") return v4("stlLeaf");
  if (shade === "bloom") return v4("stlBloom");
  return v4("stlBlankShade");
}

function seatName(v4: V4, name: string): string {
  if (name === "near") return v4("stlNear");
  if (name === "mid") return v4("stlMid");
  if (name === "far") return v4("stlFar");
  if (name === "end") return v4("stlEnd");
  if (name === "body") return v4("stlBody");
  if (/^[1-6]$/.test(name)) return name;
  return v4("stlBlankSeat");
}

function rankName(v4: V4, rank: number | null): string {
  if (rank === 1) return v4("stlRank1");
  if (rank === 2) return v4("stlRank2");
  if (rank === 3) return v4("stlRank3");
  return v4("stlBlankRank");
}

function pauseName(v4: V4, pause: number | null): string {
  if (pause === 4) return v4("stlPause4");
  if (pause === 8) return v4("stlPause8");
  if (pause === 12) return v4("stlPause12");
  if (pause === 16) return v4("stlPause16");
  return v4("stlBlankPause");
}

function bandName(v4: V4, name: string): string {
  if (name === "whisper") return v4("rslWhisper");
  if (name === "line") return v4("rslLine");
  if (name === "page") return v4("rslPage");
  if (name === "folio") return v4("rslFolio");
  if (name === "blank") return v4("rslClear");
  return v4("rslUnmarked");
}

function depthName(v4: V4, name: string): string {
  if (name === "near") return v4("rslNear");
  if (name === "mid") return v4("rslMid");
  if (name === "far") return v4("rslFar");
  return v4("rslUnmarked");
}

function auditName(v4: V4, audit: string): string {
  const key = {
    save: "stlAuditSave",
    edit: "stlAuditEdit",
    shade: "stlAuditShade",
    pin: "stlAuditPin",
    unpin: "stlAuditUnpin",
    seat: "stlAuditSeat",
    stand: "stlAuditStand",
    file: "stlAuditFile",
    reopen: "stlAuditReopen",
    move: "stlAuditMove",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function seatLabel(seat: number | null): string {
  return seat === null ? "—" : String(seat);
}

function gapLabel(v4: V4, seat: number | null, desk: string): string {
  const gap = seatGap(seat, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("stlPast")} ${gap}`;
  if (gap < 0) return `${v4("stlAhead")} ${Math.abs(gap)}`;
  return v4("stlDue");
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

function sameCards(left: readonly Stool[], right: readonly Stool[]): boolean {
  return left.length === right.length && left.every((card, index) => card.id === right[index]?.id && card.title === right[index]?.title && card.note === right[index]?.note && card.audit === right[index]?.audit);
}

export function GlasshouseStools({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<Stool[]>([]);
  const [views, setViews] = useState<StoolView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [host, setHost] = useState("");
  const [seat, setSeat] = useState("");
  const [tempo, setTempo] = useState("");
  const [aisle, setAisle] = useState("");
  const [shade, setShade] = useState("");
  const [rank, setRank] = useState("");
  const [pause, setPause] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<StoolTray>("open");
  const [hostFilter, setHostFilter] = useState("all");
  const [tempoFilter, setTempoFilter] = useState("all");
  const [aisleFilter, setAisleFilter] = useState("all");
  const [shadeFilter, setShadeFilter] = useState("all");
  const [seatFilter, setSeatFilter] = useState("all");
  const [rankFilter, setRankFilter] = useState("all");
  const [pauseFilter, setPauseFilter] = useState("all");
  const [bloomOnly, setBloomOnly] = useState(false);
  const [endOnly, setEndOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [desk, setDesk] = useState("");
  const [moveTempo, setMoveTempo] = useState("sit");
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readStools(readJson(STOOL_KEY, []));
    const saved = readStoolViews(readJson(STOOL_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(STOOL_KEY, next);
    writeJson(STOOL_VIEW_KEY, saved);
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
  const hosts = stoolHosts(cards);
  const tempos = stoolTempos(cards);
  const aisles = stoolAisles(cards);
  const shades = stoolShades(cards);
  const bars = tempoCounts(cards);
  const hostOn = activeHost(hostFilter, hosts);
  const tempoOn = activeTempo(tempoFilter, TEMPOS);
  const aisleOn = activeAisle(aisleFilter, aisles);
  const shadeOn = activeShade(shadeFilter, shades);
  const seatOn = activeSeat(seatFilter);
  const rankOn = activeRank(rankFilter);
  const pauseOn = activePause(pauseFilter);
  const pickedSeat = seatArg(seatOn);
  const shown = visibleStools(
    cards,
    tray,
    query,
    hostArg(hostOn),
    tempoArg(tempoOn),
    aisleArg(aisleOn),
    shadeArg(shadeOn),
    pickedSeat.exact,
    pickedSeat.pick,
    rankArg(rankOn),
    pauseArg(pauseOn),
    bloomOnly,
    endOnly,
  );
  const timeline = seatTimeline(cards, query);
  const counts = stoolCounts(cards, desk);
  const clashes = clashSeatCount(cards);
  const rankClashes = rankClashCount(cards);
  const total = cards.length;
  const nextId = nextStool(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const widest = Math.max(1, ...bars);
  const pinned = cards.filter((card) => card.pinned);
  const load = hostLoad(cards, host);
  const suggested = suggestTempo(cards);
  const lightHost = suggestHost(cards);
  const targets = picked.length ? picked : shown.map((card) => card.id);

  function store(next: Stool[]) {
    setCards(next);
    writeJson(STOOL_KEY, next);
  }

  function storeViews(next: StoolView[]) {
    setViews(next);
    writeJson(STOOL_VIEW_KEY, next);
  }

  function clearDraft() {
    setTitle("");
    setNote("");
    setHost("");
    setSeat("");
    setTempo("");
    setAisle("");
    setShade("");
    setRank("");
    setPause("");
  }

  function copyCard(card: Stool) {
    const body = stoolCopy(card.title);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(card.id);
  }

  function applyView(view: StoolView) {
    setTray(view.tray);
    setQuery(view.query);
    setHostFilter(activeHost(view.host, stoolHosts(cards)));
    setTempoFilter(activeTempo(view.tempo, TEMPOS));
    setAisleFilter(activeAisle(view.aisle, stoolAisles(cards)));
    setShadeFilter(activeShade(view.shade, stoolShades(cards)));
    setSeatFilter(activeSeat(view.seat));
    setRankFilter(activeRank(view.rank));
    setPauseFilter(activePause(view.pause));
    setBoard("cards");
    setBloomOnly(false);
    setEndOnly(false);
  }

  function togglePick(id: string) {
    setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <section className="c4-stl" aria-label={v4("stlTitle")} data-stools="1" data-role={role}>
      <header className="c4-stl-head">
        <p className="c4-stl-plate" data-logo="mono">{v4("stlLogo")}</p>
        <div>
          <p className="c4-stl-kicker">{v4("stlSub")}</p>
          <h2 className="c4-title">{v4("stlTitle")}</h2>
        </div>
        <p className="c4-stl-count">{shown.length}</p>
      </header>
      <details className="c4-stl-rules">
        <summary>{v4("stlRules")}</summary>
        <p className="c4-meta">{v4("stlHint")}</p>
        <p className="c4-meta">{v4("stlLocal")}</p>
        <p className="c4-meta">{v4("stlBlank")}</p>
        <p className="c4-meta">{v4("stlHostBlank")}</p>
        <p className="c4-meta">{v4("stlSeatBlank")}</p>
        <p className="c4-meta">{v4("stlTempoBlank")}</p>
        <p className="c4-meta">{v4("stlAisleBlank")}</p>
        <p className="c4-meta">{v4("stlShadeBlank")}</p>
        <p className="c4-meta">{v4("stlRankBlank")}</p>
        <p className="c4-meta">{v4("stlPauseBlank")}</p>
        <p className="c4-meta">{v4("stlNoteBlank")}</p>
        <p className="c4-meta">{v4("stlEscape")}</p>
        <p className="c4-meta">{v4("stlSlash")}</p>
        <p className="c4-meta">{v4("stlNew")}</p>
      </details>
      {viewer ? <p className="c4-stl-notice" role="status">{v4("stlViewer")}</p> : null}
      <p className="c4-stl-notice" role="status">
        <span>{v4("stlNotice")}</span>
        <span className="c4-stl-count">{counts.end}</span>
        <button type="button" className="c4-btn" aria-pressed={endOnly} onClick={() => { setEndOnly((value) => !value); setTray("open"); setBoard("cards"); }}>
          {endOnly ? v4("stlNoticeAll") : v4("stlNoticeEnd")}
        </button>
      </p>
      <p className="c4-stl-notice" role="status">
        <span>{v4("stlLate")}</span>
        <span className="c4-stl-count">{counts.late}</span>
      </p>
      <p className="c4-stl-notice" role="status">
        <span>{v4("stlClash")}</span>
        <span className="c4-stl-count">{clashes}</span>
      </p>
      <p className="c4-stl-notice" role="status">
        <span>{v4("stlRankClash")}</span>
        <span className="c4-stl-count">{rankClashes}</span>
      </p>
      <p className="c4-stl-suggest" role="status">
        <span>{v4("stlSuggest")}</span>
        <strong>{tempoName(v4, suggested)}</strong>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setTempo(suggested)}>{v4("stlUseTempo")}</button>
      </p>
      <p className="c4-stl-suggest" role="status">
        <span>{v4("stlSuggestHost")}</span>
        <strong>{lightHost || v4("stlBlankHost")}</strong>
        <button type="button" className="c4-btn" disabled={viewer || !lightHost} onClick={() => setHost(lightHost)}>{v4("stlUseHost")}</button>
      </p>
      {pinned.length > 0 && (
        <ul className="c4-stl-pins" aria-label={v4("stlPinned")}>
          {pinned.map((card) => (
            <li key={card.id}>
              <button type="button" className="c4-chip" onClick={() => { setQuery(card.title); setBoard("cards"); }}>{card.title}</button>
            </li>
          ))}
        </ul>
      )}
      <section className="c4-stl-kpi" aria-label={v4("stlKpi")}>
        {(["open", "seated", "filed", "pinned"] as const).map((key) => {
          const count = counts[key];
          const share = stoolShare(count, total);
          const label = key === "open" ? v4("stlWaiting") : key === "seated" ? v4("stlSeated") : key === "filed" ? v4("stlFiled") : v4("stlPin");
          return (
            <p key={key} className="c4-stl-meter" data-tray={key}>
              <span>{label}</span>
              <strong>{count}</strong>
              <span>{v4("stlShare")} {share}%</span>
              <span className="c4-stl-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <section className="c4-stl-chart" aria-label={v4("stlChart")}>
        <p className="c4-stl-kicker">{v4("stlChart")}</p>
        {TEMPOS.map((name, index) => {
          const count = bars[index] || 0;
          const width = Math.max(8, Math.round((count / widest) * 100));
          return (
            <button key={name} type="button" className="c4-stl-col" data-on={tempoOn === name ? "1" : "0"} aria-pressed={tempoOn === name} onClick={() => setTempoFilter(tempoOn === name ? "all" : name)}>
              <span>{tempoName(v4, name)}</span>
              <span className="c4-stl-bar" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
              <span>{count}</span>
            </button>
          );
        })}
      </section>
      <div className="c4-stl-split">
        <form className="c4-stl-form" onSubmit={(event) => {
          event.preventDefault();
          if (viewer) return;
          const next = addStool(cards, { id: `stl-${Date.now()}`, title, note, host, seat, tempo, aisle, shade, rank, pause });
          if (sameCards(next, cards)) return;
          store(next);
          clearDraft();
        }}>
          <label className="c4-lab">
            <span>{v4("stlLine")}</span>
            <input ref={titleRef} className="c4-field" aria-label={v4("stlLine")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              event.preventDefault();
              clearDraft();
            }} />
          </label>
          <label className="c4-lab">
            <span>{v4("stlNote")}</span>
            <input className="c4-field" aria-label={v4("stlNote")} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} />
          </label>
          <label className="c4-lab">
            <span>{v4("stlHost")}</span>
            <input className="c4-field" aria-label={v4("stlHost")} value={host} disabled={viewer} onChange={(event) => setHost(event.target.value)} />
          </label>
          <p className="c4-meta" role="status">{v4("stlLoad")} {load}</p>
          <label className="c4-lab">
            <span>{v4("stlSeat")}</span>
            <input className="c4-field" inputMode="numeric" aria-label={v4("stlSeat")} value={seat} disabled={viewer} onChange={(event) => setSeat(event.target.value)} />
          </label>
          <label className="c4-lab">
            <span>{v4("stlTempo")}</span>
            <select className="c4-select" aria-label={v4("stlTempo")} value={tempo} disabled={viewer} onChange={(event) => setTempo(event.target.value)}>
              <option value="">{v4("stlBlankTempo")}</option>
              <option value="sit">{v4("stlTempoSit")}</option>
              <option value="lean">{v4("stlTempoLean")}</option>
              <option value="rise">{v4("stlTempoRise")}</option>
            </select>
          </label>
          <label className="c4-lab">
            <span>{v4("stlAisle")}</span>
            <input className="c4-field" aria-label={v4("stlAisle")} value={aisle} disabled={viewer} onChange={(event) => setAisle(event.target.value)} />
          </label>
          <label className="c4-lab">
            <span>{v4("stlShade")}</span>
            <select className="c4-select" aria-label={v4("stlShade")} value={shade} disabled={viewer} onChange={(event) => setShade(event.target.value)}>
              <option value="">{v4("stlBlankShade")}</option>
              <option value="mist">{v4("stlMist")}</option>
              <option value="leaf">{v4("stlLeaf")}</option>
              <option value="bloom">{v4("stlBloom")}</option>
            </select>
          </label>
          <label className="c4-lab">
            <span>{v4("stlRank")}</span>
            <select className="c4-select" aria-label={v4("stlRank")} value={rank} disabled={viewer} onChange={(event) => setRank(event.target.value)}>
              <option value="">{v4("stlBlankRank")}</option>
              <option value="1">{v4("stlRank1")}</option>
              <option value="2">{v4("stlRank2")}</option>
              <option value="3">{v4("stlRank3")}</option>
            </select>
          </label>
          <label className="c4-lab">
            <span>{v4("stlPause")}</span>
            <select className="c4-select" aria-label={v4("stlPause")} value={pause} disabled={viewer} onChange={(event) => setPause(event.target.value)}>
              <option value="">{v4("stlBlankPause")}</option>
              <option value="4">{v4("stlPause4")}</option>
              <option value="8">{v4("stlPause8")}</option>
              <option value="12">{v4("stlPause12")}</option>
              <option value="16">{v4("stlPause16")}</option>
            </select>
          </label>
          <button type="submit" className="c4-btn" disabled={viewer}>{v4("stlAdd")}</button>
        </form>
        <div className="c4-stl-board">
          <div className="c4-row" role="group" aria-label={v4("stlTitle")}>
            <button type="button" className="c4-chip" data-on={tray === "open" ? "1" : "0"} aria-pressed={tray === "open"} onClick={() => setTray("open")}>{v4("stlWaiting")}</button>
            <button type="button" className="c4-chip" data-on={tray === "seated" ? "1" : "0"} aria-pressed={tray === "seated"} onClick={() => setTray("seated")}>{v4("stlSeated")}</button>
            <button type="button" className="c4-chip" data-on={tray === "filed" ? "1" : "0"} aria-pressed={tray === "filed"} onClick={() => setTray("filed")}>{v4("stlFiled")}</button>
            <button type="button" className="c4-chip" data-on={board === "cards" ? "1" : "0"} aria-pressed={board === "cards"} onClick={() => setBoard("cards")}>{v4("stlCards")}</button>
            <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard("timeline")}>{v4("stlTimeline")}</button>
            <button type="button" className="c4-chip" data-on={bloomOnly ? "1" : "0"} aria-pressed={bloomOnly} onClick={() => setBloomOnly((value) => !value)}>{v4("stlBloomOnly")}</button>
            <button type="button" className="c4-chip" data-on={endOnly ? "1" : "0"} aria-pressed={endOnly} onClick={() => { setEndOnly((value) => !value); setTray("open"); }}>{v4("stlEndOnly")}</button>
            <button type="button" className="c4-btn" onClick={() => download("glasshouse-stools.csv", stoolsCsv(cards, desk))}>{v4("stlCsv")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setPicked(shown.map((card) => card.id))}>{v4("stlPickAll")}</button>
            <button type="button" className="c4-btn" onClick={() => setPicked([])}>{v4("stlPickNone")}</button>
            <span className="c4-stl-count">{v4("stlPicked")} {picked.length}</span>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkStoolPin(cards, targets, true))}>{v4("stlBulkPin")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkStoolFile(cards, targets, true))}>{v4("stlBulkFile")}</button>
            <label className="c4-lab">
              <span>{v4("stlBulkTempo")}</span>
              <select className="c4-select" aria-label={v4("stlBulkTempo")} value={moveTempo} disabled={viewer} onChange={(event) => setMoveTempo(event.target.value)}>
                <option value="sit">{v4("stlTempoSit")}</option>
                <option value="lean">{v4("stlTempoLean")}</option>
                <option value="rise">{v4("stlTempoRise")}</option>
              </select>
            </label>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkStoolTempo(cards, targets, moveTempo))}>{v4("stlBulkTempo")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(resetStools()); setPicked([]); }}>{v4("stlReset")}</button>
          </div>
          <label className="c4-lab">
            <span>{v4("stlSearch")}</span>
            <input ref={searchRef} className="c4-field" aria-label={v4("stlSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              event.preventDefault();
              setQuery("");
            }} />
          </label>
          <label className="c4-lab">
            <span>{v4("stlDesk")}</span>
            <input className="c4-field" inputMode="numeric" aria-label={v4("stlDesk")} value={desk} onChange={(event) => setDesk(event.target.value)} />
          </label>
          <p className="c4-meta" role="status">
            {v4("stlNext")} {nextCard ? nextCard.title : v4("stlNextNone")}
          </p>
          <div className="c4-row" role="group" aria-label={v4("stlHosts")}>
            <button type="button" className="c4-chip" data-on={hostOn === "all" ? "1" : "0"} aria-pressed={hostOn === "all"} onClick={() => setHostFilter("all")}>{v4("stlAllHosts")}</button>
            <button type="button" className="c4-chip" data-on={hostOn === "blank" ? "1" : "0"} aria-pressed={hostOn === "blank"} onClick={() => setHostFilter("blank")}>{v4("stlBlankHost")}</button>
            {hosts.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={hostOn === name ? "1" : "0"} aria-pressed={hostOn === name} onClick={() => setHostFilter(name)}>{name}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("stlTempos")}>
            <button type="button" className="c4-chip" data-on={tempoOn === "all" ? "1" : "0"} aria-pressed={tempoOn === "all"} onClick={() => setTempoFilter("all")}>{v4("stlAllTempos")}</button>
            <button type="button" className="c4-chip" data-on={tempoOn === "blank" ? "1" : "0"} aria-pressed={tempoOn === "blank"} onClick={() => setTempoFilter("blank")}>{v4("stlBlankTempo")}</button>
            {tempos.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={tempoOn === name ? "1" : "0"} aria-pressed={tempoOn === name} onClick={() => setTempoFilter(name)}>{tempoName(v4, name)}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("stlAisles")}>
            <button type="button" className="c4-chip" data-on={aisleOn === "all" ? "1" : "0"} aria-pressed={aisleOn === "all"} onClick={() => setAisleFilter("all")}>{v4("stlAllAisles")}</button>
            <button type="button" className="c4-chip" data-on={aisleOn === "blank" ? "1" : "0"} aria-pressed={aisleOn === "blank"} onClick={() => setAisleFilter("blank")}>{v4("stlBlankAisle")}</button>
            {aisles.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={aisleOn === name ? "1" : "0"} aria-pressed={aisleOn === name} onClick={() => setAisleFilter(name)}>{name}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("stlShades")}>
            <button type="button" className="c4-chip" data-on={shadeOn === "all" ? "1" : "0"} aria-pressed={shadeOn === "all"} onClick={() => setShadeFilter("all")}>{v4("stlAllShades")}</button>
            <button type="button" className="c4-chip" data-on={shadeOn === "blank" ? "1" : "0"} aria-pressed={shadeOn === "blank"} onClick={() => setShadeFilter("blank")}>{v4("stlBlankShade")}</button>
            {shades.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={shadeOn === name ? "1" : "0"} aria-pressed={shadeOn === name} onClick={() => setShadeFilter(name)}>{shadeName(v4, name)}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("stlSeats")}>
            {(["all", "blank", "near", "mid", "far", "end", "body"] as const).map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={seatOn === name ? "1" : "0"} aria-pressed={seatOn === name} onClick={() => setSeatFilter(name)}>
                {name === "all" ? v4("stlAllSeats") : seatName(v4, name)}
              </button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("stlRanks")}>
            {(["all", "blank", "1", "2", "3"] as const).map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={rankOn === name ? "1" : "0"} aria-pressed={rankOn === name} onClick={() => setRankFilter(name)}>
                {name === "all" ? v4("stlAllRanks") : name === "blank" ? v4("stlBlankRank") : rankName(v4, Number(name))}
              </button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("stlPauses")}>
            {(["all", "blank", "4", "8", "12", "16"] as const).map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={pauseOn === name ? "1" : "0"} aria-pressed={pauseOn === name} onClick={() => setPauseFilter(name)}>
                {name === "all" ? v4("stlAllPauses") : name === "blank" ? v4("stlBlankPause") : pauseName(v4, Number(name))}
              </button>
            ))}
          </div>
          <form className="c4-row" onSubmit={(event) => {
            event.preventDefault();
            if (viewer) return;
            const next = addStoolView(views, {
              id: `view-${Date.now()}`,
              name: viewName,
              tray,
              query,
              host: hostOn,
              tempo: tempoOn,
              aisle: aisleOn,
              shade: shadeOn,
              seat: seatOn,
              rank: rankOn,
              pause: pauseOn,
            });
            if (next.length === views.length) return;
            storeViews(next);
            setViewName("");
          }}>
            <label className="c4-lab">
              <span>{v4("stlViewName")}</span>
              <input className="c4-field" aria-label={v4("stlViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
            </label>
            <button type="submit" className="c4-btn" disabled={viewer}>{v4("stlSaveView")}</button>
          </form>
          <section aria-label={v4("stlViews")}>
            <p className="c4-stl-kicker">{v4("stlViews")}</p>
            {!views.length && <p className="c4-stl-empty">{v4("stlViewEmpty")}</p>}
            <ul className="c4-stl-views">
              {views.map((view) => (
                <li key={view.id}>
                  <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropStoolView(views, view.id))}>{v4("stlDropView")}</button>
                </li>
              ))}
            </ul>
          </section>
          {board === "cards" && !shown.length && <p className="c4-stl-empty">{v4("stlEmpty")}</p>}
          {board === "cards" && (
            <ul className="c4-stl-rows">
              {shown.map((card) => {
                const clashesOn = seatClashIds(cards, card.id);
                const ranksOn = rankClashIds(cards, card.id);
                const gap = gapLabel(v4, card.seat, desk);
                const band = seatBand(card.seat);
                const editingCard = editing === card.id;
                const late = lateStool(card, desk);
                return (
                  <li key={card.id} data-shade={card.shade || "blank"} data-tempo={card.tempo || "blank"} data-late={late ? "1" : "0"}>
                    <span className="c4-stl-mark" aria-hidden="true">{seatLabel(card.seat)}</span>
                    <div>
                      <label className="c4-stl-pick">
                        <input type="checkbox" checked={picked.includes(card.id)} aria-label={v4("stlPick")} onChange={() => togglePick(card.id)} />
                        <span>{v4("stlPick")}</span>
                      </label>
                      {editingCard ? (
                        <form className="c4-row" onSubmit={(event) => {
                          event.preventDefault();
                          if (viewer) return;
                          const titled = editStool(cards, card.id, draft);
                          store(editStoolNote(titled, card.id, noteDraft));
                          setEditing("");
                        }}>
                          <input className="c4-field" aria-label={v4("stlEdit")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                          <input className="c4-field" aria-label={v4("stlNote")} value={noteDraft} disabled={viewer} onChange={(event) => setNoteDraft(event.target.value)} />
                          <button type="submit" className="c4-btn" disabled={viewer}>{v4("stlSaveEdit")}</button>
                        </form>
                      ) : (
                        <>
                          <p>{card.title}</p>
                          {card.note ? <p className="c4-meta">{card.note}</p> : null}
                        </>
                      )}
                      <p className="c4-meta">
                        {card.host || v4("stlBlankHost")}
                        {" · "}
                        {seatLabel(card.seat)}
                        {" · "}
                        {tempoName(v4, tempoOf(card.tempo))}
                        {" · "}
                        {card.aisle || v4("stlBlankAisle")}
                        {" · "}
                        {shadeName(v4, shadeOf(card.shade))}
                        {" · "}
                        {rankName(v4, card.rank)}
                        {" · "}
                        {pauseName(v4, card.pause)}
                        {band === "blank" ? "" : ` · ${seatName(v4, band)}`}
                        {gap ? ` · ${gap}` : ""}
                        {late ? ` · ${v4("stlLate")}` : ""}
                        {auditName(v4, card.audit) ? ` · ${v4("stlAudit")} ${auditName(v4, card.audit)}` : ""}
                        {" · "}
                        {clashesOn.length ? `${v4("stlClash")} ${clashesOn.length}` : v4("stlClashNone")}
                        {" · "}
                        {ranksOn.length ? `${v4("stlRankClash")} ${ranksOn.length}` : v4("stlRankClashNone")}
                      </p>
                    </div>
                    <div className="c4-row">
                      <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("stlCopied") : v4("stlCopy")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); setNoteDraft(card.note); }}>{v4("stlEdit")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleShade(cards, card.id))}>{v4("stlShadeUp")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.pinned} onClick={() => store(setStoolPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("stlUnpin") : v4("stlPin")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.seated} onClick={() => store(setStoolSeat(cards, card.id, !card.seated))}>{card.seated ? v4("stlStand") : v4("stlSeatOn")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.filed} onClick={() => store(setStoolFiled(cards, card.id, !card.filed))}>{card.filed ? v4("stlReopen") : v4("stlFile")}</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {board === "timeline" && (
            <ol className="c4-stl-time">
              {timeline.map((card) => (
                <li key={card.id}>
                  <span className="c4-stl-clock">{seatLabel(card.seat)}</span>
                  <p>{card.title}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}

export function RetentionSlips({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenBands, setHiddenBands] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [depth, setDepth] = useState("all");
  const [showHidden, setShowHidden] = useState(false);
  const [review, setReview] = useState<"all" | "reviewed" | "open">("all");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState("");
  const rows = useMemo(() => (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || "").trim(),
      note: row.retentionNote,
    };
  }).filter((row): row is GlanceRow => Boolean(row)), [data.data?.users]);
  const bandsOn = slipBands(rows);
  const depths = slipDepths(rows);
  const present = presentSlips(rows);
  const presentKey = present.join("\n");
  const presentIds = rows.map((row) => row.id);
  const idKey = presentIds.join("\n");
  const bandNames = present.filter((item) => item !== "blank");
  const depthNames = depths.map((line) => line.depth).filter(Boolean);
  const leadBand = leadingSlip(rows);
  const leadDepth = leadingSlipDepth(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const known = presentKey ? presentKey.split("\n") : [];
    const next = readHiddenSlips(readJson(SLIP_KEY, []), known);
    setHiddenBands(next);
    writeJson(SLIP_KEY, next);
  }, [loading, failed, presentKey]);
  useEffect(() => {
    if (loading || failed) return;
    const known = idKey ? idKey.split("\n") : [];
    const next = readReviewed(readJson(SLIP_REVIEW_KEY, []), known);
    setReviewed(next);
    writeJson(SLIP_REVIEW_KEY, next);
  }, [loading, failed, idKey]);
  const chips = visibleSlipBands(present, hiddenBands, showHidden);
  const depthOn = activeSlipDepth(depth, depthNames);
  const bandOn = selected ? activeSlip(selected, bandNames) : "all";
  const shown = visibleSlipCustomers(
    rows,
    selected ? slipArg(bandOn === "all" && selected === "blank" ? "blank" : bandOn) : null,
    slipDepthArg(depthOn),
    query,
    review,
    reviewed,
  );
  const widest = Math.max(1, ...bandsOn.map((line) => line.count));
  const setCount = rows.filter((row) => slipState(row.note) === "set").length;
  const openCount = rows.filter((row) => !reviewed.includes(row.id)).length;

  function store(next: string[], clear: string) {
    setHiddenBands(next);
    writeJson(SLIP_KEY, next);
    if (clear && selected === clear) setSelected("");
  }

  function storeReview(next: string[]) {
    setReviewed(next);
    writeJson(SLIP_REVIEW_KEY, next);
  }

  function copyNote(row: GlanceRow) {
    const body = slipCopy(row.note);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(row.id);
  }

  return (
    <section className="c4-rsl" aria-label={v4("rslTitle")} data-slips="1">
      <header className="c4-rsl-head">
        <div>
          <p className="c4-stl-kicker">{v4("rslSub")}</p>
          <h2 className="c4-title">{v4("rslTitle")}</h2>
        </div>
        <p className="c4-stl-count">{v4("rslRows")} {rows.length}</p>
      </header>
      <details className="c4-stl-rules">
        <summary>{v4("rslRules")}</summary>
        <p className="c4-meta">{v4("rslHint")}</p>
        <p className="c4-meta">{v4("rslLocal")}</p>
        <p className="c4-meta">{v4("rslEscape")}</p>
      </details>
      <p className="c4-stl-notice" role="status">
        <span>{v4("rslSetNotice")}</span>
        <span className="c4-stl-count">{setCount}</span>
      </p>
      <p className="c4-stl-notice" role="status">
        <span>{v4("rslUnreviewed")}</span>
        <span className="c4-stl-count">{openCount}</span>
      </p>
      {leadBand ? <p className="c4-rsl-lead"><span>{v4("rslLeadBand")}</span> {bandName(v4, leadBand)}</p> : null}
      {leadDepth ? <p className="c4-rsl-lead"><span>{v4("rslLeadDepth")}</span> {depthName(v4, leadDepth)}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("rslBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("retention-slips.csv", slipsCsv(rows))}>{v4("rslCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("retention-slip-rows.csv", slipRowsCsv(rows, reviewed))}>{v4("rslRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => storeReview(bulkReview(reviewed, shown.map((row) => row.id), presentIds, true))}>{v4("rslBulkReview")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("rslLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("rslFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-stl-empty">{v4("rslNone")}</p>}
      {bandsOn.length > 0 && (
        <section className="c4-rsl-chart" aria-label={v4("rslAllBands")}>
          {bandsOn.map((line) => {
            const share = slipShare(line.count, rows.length);
            const bar = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.band || "blank";
            return (
              <p key={name} className="c4-rsl-col" data-band={name}>
                <span>{bandName(v4, line.band)}</span>
                <span className="c4-stl-track" aria-hidden="true"><i style={{ width: `${bar}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("rslShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      <div className="c4-row" role="group" aria-label={v4("rslShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("rslShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("rslHidden")}</button>
      </div>
      <div className="c4-rsl-bands" role="group" aria-label={v4("rslAllBands")}>
        <button type="button" className="c4-rsl-band" data-on={!selected ? "1" : "0"} aria-pressed={!selected} onClick={() => setSelected("")}>
          <span>{v4("rslAllBands")}</span>
          <span className="c4-stl-count">{rows.length}</span>
        </button>
        {chips.map((item) => {
          const count = rows.filter((row) => {
            const state = slipState(row.note);
            const token = state === "set" ? slipBand(row.note) : state === "clear" ? "blank" : "";
            return token === item;
          }).length;
          const share = slipShare(count, rows.length);
          return (
            <span key={item} className="c4-rsl-pair">
              <button type="button" className="c4-rsl-band" data-on={selected === item ? "1" : "0"} aria-pressed={selected === item} onClick={() => setSelected(selected === item ? "" : item)}>
                <span>{bandName(v4, item)}</span>
                <span className="c4-stl-count">{count}</span>
                <span>{v4("rslShare")} {share}%</span>
              </button>
              <button type="button" className="c4-btn" onClick={() => store(toggleSlip(hiddenBands, item, present), showHidden ? "" : item)}>{showHidden ? v4("rslShow") : v4("rslHide")}</button>
            </span>
          );
        })}
      </div>
      <div className="c4-row" role="group" aria-label={v4("rslDepths")}>
        <button type="button" className="c4-chip" data-on={depthOn === "all" ? "1" : "0"} aria-pressed={depthOn === "all"} onClick={() => setDepth("all")}>{v4("rslAllDepths")}</button>
        {depths.filter((line) => line.depth).map((line) => (
          <button key={line.depth} type="button" className="c4-chip" data-on={depthOn === line.depth ? "1" : "0"} aria-pressed={depthOn === line.depth} onClick={() => setDepth(depthOn === line.depth ? "all" : line.depth)}>
            {depthName(v4, line.depth)} {line.count}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("rslReview")}>
        <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} aria-pressed={review === "all"} onClick={() => setReview("all")}>{v4("rslAllNotes")}</button>
        <button type="button" className="c4-chip" data-on={review === "open" ? "1" : "0"} aria-pressed={review === "open"} onClick={() => setReview("open")}>{v4("rslOpenNotes")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} aria-pressed={review === "reviewed"} onClick={() => setReview("reviewed")}>{v4("rslReviewed")}</button>
      </div>
      <label className="c4-lab">
        <span>{v4("rslSearch")}</span>
        <input className="c4-field" aria-label={v4("rslSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-stl-empty">{v4("rslEmpty")}</p>}
      <ul className="c4-rsl-rows">
        {shown.map((row) => {
          const state = slipState(row.note);
          const band = slipBand(row.note) as SlipBand;
          const depthMark = slipDepth(row.note) as SlipDepth;
          const length = slipLength(row.note);
          const done = reviewed.includes(row.id);
          return (
            <li key={row.id} data-state={state || "blank"} data-band={band || "blank"} data-depth={depthMark || "blank"} data-reviewed={done ? "1" : "0"}>
              <span className="c4-rsl-face" aria-hidden="true">{length === null ? "—" : String(length)}</span>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">
                {state === "set" ? bandName(v4, band) : state === "clear" ? v4("rslClear") : v4("rslUnmarked")}
                {" · "}
                {depthName(v4, depthMark)}
                {length === null ? "" : ` · ${v4("rslLength")} ${length}`}
              </p>
              <div className="c4-row">
                <button type="button" className="c4-btn" onClick={() => copyNote(row)}>{copied === row.id ? v4("rslCopied") : v4("rslCopy")}</button>
                <button type="button" className="c4-btn" aria-pressed={done} onClick={() => storeReview(toggleReview(reviewed, row.id, presentIds))}>{done ? v4("rslReviewed") : v4("rslReview")}</button>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="c4-meta">{BANDS.map((name) => bandName(v4, name)).join(" · ")}</p>
    </section>
  );
}
