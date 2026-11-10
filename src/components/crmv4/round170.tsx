"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  CHIT_KEY,
  CHIT_VIEW_KEY,
  SHUTTER_KEY,
  activeAisle,
  activeBell,
  activeChime,
  activeClerk,
  activeMark,
  activePeg,
  activePhase,
  activeSpan,
  activeWatch,
  addChit,
  addChitView,
  aisleArg,
  aisleOf,
  bellArg,
  bellGap,
  bulkChitAisle,
  bulkChitClose,
  bulkChitPin,
  chimeArg,
  chimeOf,
  chitAisles,
  chitChimes,
  chitClashIds,
  chitClerks,
  chitCopy,
  chitCounts,
  chitMarks,
  chitShare,
  chitTimeline,
  chitsCsv,
  clashChitCount,
  clerkArg,
  clerkLoad,
  cycleChime,
  dropChitView,
  editChit,
  editChitAside,
  lateChit,
  leadingPhase,
  leadingWatch,
  markArg,
  nextChit,
  pegArg,
  pegClashCount,
  pegClashIds,
  phaseArg,
  phaseLines,
  presentWatches,
  readChitViews,
  readChits,
  readHiddenWatches,
  resetChits,
  setChitClosed,
  setChitPin,
  setChitSeat,
  shutterPhase,
  shutterShare,
  shutterState,
  shutterWatch,
  shuttersCsv,
  spanArg,
  suggestAisle,
  suggestClerk,
  toggleWatch,
  visibleChits,
  visibleShutterCustomers,
  visibleWatches,
  watchArg,
  watchCounts,
  watchLines,
  watchOf,
  type Chit,
  type ChitAisle,
  type ChitChime,
  type ChitTray,
  type ChitView,
  type ShutterPhase,
  type ShutterRow,
  type ShutterWatch,
} from "@/lib/crmv4/round170";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  loginBlockedAt?: string | null;
};

type GlanceRow = ShutterRow & { id: string };

const WATCHES = ["night", "morning", "afternoon", "evening"] as const;

function aisleName(v4: V4, aisle: ChitAisle | string): string {
  if (aisle === "north") return v4("vstAisleNorth");
  if (aisle === "south") return v4("vstAisleSouth");
  if (aisle === "west") return v4("vstAisleWest");
  if (aisle === "east") return v4("vstAisleEast");
  return v4("vstBlankAisle");
}

function chimeName(v4: V4, chime: ChitChime): string {
  if (chime === "hush") return v4("vstHush");
  if (chime === "tone") return v4("vstTone");
  if (chime === "peal") return v4("vstPeal");
  return v4("vstBlankChime");
}

function watchName(v4: V4, name: string): string {
  if (name === "night") return v4("vstNight");
  if (name === "morning") return v4("vstMorning");
  if (name === "afternoon") return v4("vstAfternoon");
  if (name === "evening") return v4("vstEvening");
  if (name === "edge") return v4("vstEdge");
  if (name === "body") return v4("vstBody");
  if (/^(?:[0-9]|1[0-9]|2[0-3])$/.test(name)) return name;
  return v4("vstBlankBell");
}

function pegName(v4: V4, peg: number | null): string {
  if (peg === 1) return v4("vstPeg1");
  if (peg === 2) return v4("vstPeg2");
  if (peg === 3) return v4("vstPeg3");
  return v4("vstBlankPeg");
}

function spanName(v4: V4, span: number | null): string {
  if (span === 15) return v4("vstSpan15");
  if (span === 30) return v4("vstSpan30");
  if (span === 45) return v4("vstSpan45");
  if (span === 60) return v4("vstSpan60");
  return v4("vstBlankSpan");
}

function shutterWatchName(v4: V4, name: string): string {
  if (name === "night") return v4("shtNight");
  if (name === "morning") return v4("shtMorning");
  if (name === "afternoon") return v4("shtAfternoon");
  if (name === "evening") return v4("shtEvening");
  if (name === "blank") return v4("shtClear");
  return v4("shtUnmarked");
}

function phaseName(v4: V4, name: string): string {
  if (name === "early") return v4("shtEarly");
  if (name === "middle") return v4("shtMiddle");
  if (name === "late") return v4("shtLate");
  return v4("shtUnmarked");
}

function auditName(v4: V4, audit: string): string {
  const key = {
    save: "vstAuditSave",
    edit: "vstAuditEdit",
    chime: "vstAuditChime",
    pin: "vstAuditPin",
    unpin: "vstAuditUnpin",
    seat: "vstAuditSeat",
    rise: "vstAuditRise",
    close: "vstAuditClose",
    reopen: "vstAuditReopen",
    aisle: "vstAuditAisle",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function bellLabel(bell: number | null): string {
  return bell === null ? "—" : String(bell);
}

function gapLabel(v4: V4, bell: number | null, desk: string): string {
  const gap = bellGap(bell, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("vstPast")} ${gap}`;
  if (gap < 0) return `${v4("vstAhead")} ${Math.abs(gap)}`;
  return v4("vstDue");
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

function sameCards(left: readonly Chit[], right: readonly Chit[]): boolean {
  return left.length === right.length && left.every((card, index) => card.id === right[index]?.id && card.subject === right[index]?.subject && card.aside === right[index]?.aside && card.audit === right[index]?.audit);
}

export function VestryChits({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<Chit[]>([]);
  const [views, setViews] = useState<ChitView[]>([]);
  const [subject, setSubject] = useState("");
  const [aside, setAside] = useState("");
  const [clerk, setClerk] = useState("");
  const [bell, setBell] = useState("");
  const [aisle, setAisle] = useState("");
  const [mark, setMark] = useState("");
  const [chime, setChime] = useState("");
  const [peg, setPeg] = useState("");
  const [span, setSpan] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<ChitTray>("open");
  const [clerkFilter, setClerkFilter] = useState("all");
  const [aisleFilter, setAisleFilter] = useState("all");
  const [markFilter, setMarkFilter] = useState("all");
  const [chimeFilter, setChimeFilter] = useState("all");
  const [bellFilter, setBellFilter] = useState("all");
  const [pegFilter, setPegFilter] = useState("all");
  const [spanFilter, setSpanFilter] = useState("all");
  const [pealOnly, setPealOnly] = useState(false);
  const [edgeOnly, setEdgeOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [asideDraft, setAsideDraft] = useState("");
  const [desk, setDesk] = useState("");
  const [moveAisle, setMoveAisle] = useState("north");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readChits(readJson(CHIT_KEY, []));
    const saved = readChitViews(readJson(CHIT_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(CHIT_KEY, next);
    writeJson(CHIT_VIEW_KEY, saved);
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
      if (event.key === "v" || event.key === "V") {
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
  const clerks = chitClerks(cards);
  const aisles = chitAisles(cards);
  const marks = chitMarks(cards);
  const chimes = chitChimes(cards);
  const bars = watchCounts(cards);
  const clerkOn = activeClerk(clerkFilter, clerks);
  const aisleOn = activeAisle(aisleFilter, aisles);
  const markOn = activeMark(markFilter, marks);
  const chimeOn = activeChime(chimeFilter, chimes);
  const bellOn = activeBell(bellFilter);
  const pegOn = activePeg(pegFilter);
  const spanOn = activeSpan(spanFilter);
  const picked = bellArg(bellOn);
  const shown = visibleChits(
    cards,
    tray,
    query,
    clerkArg(clerkOn),
    aisleArg(aisleOn),
    markArg(markOn),
    chimeArg(chimeOn),
    picked.exact,
    picked.pick,
    pegArg(pegOn),
    spanArg(spanOn),
    pealOnly,
    edgeOnly,
  );
  const timeline = chitTimeline(cards, query);
  const counts = chitCounts(cards, desk);
  const clashes = clashChitCount(cards);
  const pegClashes = pegClashCount(cards);
  const total = cards.length;
  const nextId = nextChit(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const widest = Math.max(1, ...bars);
  const pinned = cards.filter((card) => card.pinned);
  const load = clerkLoad(cards, clerk);
  const suggested = suggestAisle(cards);
  const lightClerk = suggestClerk(cards);

  function store(next: Chit[]) {
    setCards(next);
    writeJson(CHIT_KEY, next);
  }

  function storeViews(next: ChitView[]) {
    setViews(next);
    writeJson(CHIT_VIEW_KEY, next);
  }

  function clearDraft() {
    setSubject("");
    setAside("");
    setClerk("");
    setBell("");
    setAisle("");
    setMark("");
    setChime("");
    setPeg("");
    setSpan("");
  }

  function copyCard(card: Chit) {
    const body = chitCopy(card.subject);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(card.id);
  }

  function applyView(view: ChitView) {
    setTray(view.tray);
    setQuery(view.query);
    setClerkFilter(activeClerk(view.clerk, chitClerks(cards)));
    setAisleFilter(activeAisle(view.aisle, chitAisles(cards)));
    setMarkFilter(activeMark(view.mark, chitMarks(cards)));
    setChimeFilter(activeChime(view.chime, chitChimes(cards)));
    setBellFilter(activeBell(view.bell));
    setPegFilter(activePeg(view.peg));
    setSpanFilter(activeSpan(view.span));
    setBoard("cards");
    setPealOnly(false);
    setEdgeOnly(false);
  }

  return (
    <section className="c4-vst" aria-label={v4("vstTitle")} data-chits="1" data-role={role}>
      <header className="c4-vst-head">
        <p className="c4-vst-plate" data-logo="mono">{v4("vstLogo")}</p>
        <div>
          <p className="c4-vst-kicker">{v4("vstSub")}</p>
          <h2 className="c4-title">{v4("vstTitle")}</h2>
        </div>
        <p className="c4-vst-count">{shown.length}</p>
      </header>
      <details className="c4-vst-rules">
        <summary>{v4("vstRules")}</summary>
        <p className="c4-meta">{v4("vstHint")}</p>
        <p className="c4-meta">{v4("vstLocal")}</p>
        <p className="c4-meta">{v4("vstBlank")}</p>
        <p className="c4-meta">{v4("vstClerkBlank")}</p>
        <p className="c4-meta">{v4("vstBellBlank")}</p>
        <p className="c4-meta">{v4("vstAisleBlank")}</p>
        <p className="c4-meta">{v4("vstMarkBlank")}</p>
        <p className="c4-meta">{v4("vstChimeBlank")}</p>
        <p className="c4-meta">{v4("vstPegBlank")}</p>
        <p className="c4-meta">{v4("vstSpanBlank")}</p>
        <p className="c4-meta">{v4("vstAsideBlank")}</p>
        <p className="c4-meta">{v4("vstEscape")}</p>
        <p className="c4-meta">{v4("vstSlash")}</p>
        <p className="c4-meta">{v4("vstNew")}</p>
      </details>
      {viewer ? <p className="c4-vst-notice" role="status">{v4("vstViewer")}</p> : null}
      <p className="c4-vst-notice" role="status">
        <span>{v4("vstNotice")}</span>
        <span className="c4-vst-count">{counts.edge}</span>
        <button type="button" className="c4-btn" aria-pressed={edgeOnly} onClick={() => { setEdgeOnly((value) => !value); setTray("open"); setBoard("cards"); }}>
          {edgeOnly ? v4("vstNoticeAll") : v4("vstNoticeEdge")}
        </button>
      </p>
      <p className="c4-vst-notice" role="status">
        <span>{v4("vstLate")}</span>
        <span className="c4-vst-count">{counts.late}</span>
      </p>
      <p className="c4-vst-notice" role="status">
        <span>{v4("vstClash")}</span>
        <span className="c4-vst-count">{clashes}</span>
      </p>
      <p className="c4-vst-notice" role="status">
        <span>{v4("vstPegClash")}</span>
        <span className="c4-vst-count">{pegClashes}</span>
      </p>
      <p className="c4-vst-suggest" role="status">
        <span>{v4("vstSuggest")}</span>
        <strong>{aisleName(v4, suggested)}</strong>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setAisle(suggested)}>{v4("vstUseAisle")}</button>
      </p>
      <p className="c4-vst-suggest" role="status">
        <span>{v4("vstSuggestClerk")}</span>
        <strong>{lightClerk || v4("vstBlankClerk")}</strong>
        <button type="button" className="c4-btn" disabled={viewer || !lightClerk} onClick={() => setClerk(lightClerk)}>{v4("vstUseClerk")}</button>
      </p>
      {pinned.length > 0 && (
        <ul className="c4-vst-pins" aria-label={v4("vstPinned")}>
          {pinned.map((card) => (
            <li key={card.id}>
              <button type="button" className="c4-chip" onClick={() => { setQuery(card.subject); setBoard("cards"); }}>{card.subject}</button>
            </li>
          ))}
        </ul>
      )}
      <section className="c4-vst-kpi" aria-label={v4("vstKpi")}>
        {(["open", "seated", "closed", "pinned"] as const).map((key) => {
          const count = counts[key];
          const share = chitShare(count, total);
          const label = key === "open" ? v4("vstWaiting") : key === "seated" ? v4("vstSeated") : key === "closed" ? v4("vstFiled") : v4("vstPin");
          return (
            <p key={key} className="c4-vst-meter" data-tray={key}>
              <span>{label}</span>
              <strong>{count}</strong>
              <span>{v4("vstShare")} {share}%</span>
              <span className="c4-vst-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <section className="c4-vst-chart" aria-label={v4("vstChart")}>
        <p className="c4-vst-kicker">{v4("vstChart")}</p>
        {WATCHES.map((name, index) => {
          const count = bars[index] || 0;
          const width = Math.max(8, Math.round((count / widest) * 100));
          return (
            <button key={name} type="button" className="c4-vst-col" data-on={bellOn === name ? "1" : "0"} aria-pressed={bellOn === name} onClick={() => setBellFilter(bellOn === name ? "all" : name)}>
              <span>{watchName(v4, name)}</span>
              <span className="c4-vst-bar" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
              <span>{count}</span>
            </button>
          );
        })}
      </section>
      <form className="c4-vst-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addChit(cards, { id: `vst-${Date.now()}`, subject, aside, clerk, bell, aisle, mark, chime, peg, span });
        if (sameCards(next, cards)) return;
        store(next);
        clearDraft();
      }}>
        <label className="c4-lab">
          <span>{v4("vstLine")}</span>
          <input ref={titleRef} className="c4-field" aria-label={v4("vstLine")} value={subject} disabled={viewer} onChange={(event) => setSubject(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab">
          <span>{v4("vstAside")}</span>
          <input className="c4-field" aria-label={v4("vstAside")} value={aside} disabled={viewer} onChange={(event) => setAside(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("vstClerk")}</span>
          <input className="c4-field" aria-label={v4("vstClerk")} value={clerk} disabled={viewer} onChange={(event) => setClerk(event.target.value)} />
        </label>
        <p className="c4-meta" role="status">{v4("vstLoad")} {load}</p>
        <label className="c4-lab">
          <span>{v4("vstBell")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("vstBell")} value={bell} disabled={viewer} onChange={(event) => setBell(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("vstAisle")}</span>
          <select className="c4-select" aria-label={v4("vstAisle")} value={aisle} disabled={viewer} onChange={(event) => setAisle(event.target.value)}>
            <option value="">{v4("vstBlankAisle")}</option>
            <option value="north">{v4("vstAisleNorth")}</option>
            <option value="south">{v4("vstAisleSouth")}</option>
            <option value="west">{v4("vstAisleWest")}</option>
            <option value="east">{v4("vstAisleEast")}</option>
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("vstMark")}</span>
          <input className="c4-field" aria-label={v4("vstMark")} value={mark} disabled={viewer} onChange={(event) => setMark(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("vstChime")}</span>
          <select className="c4-select" aria-label={v4("vstChime")} value={chime} disabled={viewer} onChange={(event) => setChime(event.target.value)}>
            <option value="">{v4("vstBlankChime")}</option>
            <option value="hush">{v4("vstHush")}</option>
            <option value="tone">{v4("vstTone")}</option>
            <option value="peal">{v4("vstPeal")}</option>
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("vstPeg")}</span>
          <select className="c4-select" aria-label={v4("vstPeg")} value={peg} disabled={viewer} onChange={(event) => setPeg(event.target.value)}>
            <option value="">{v4("vstBlankPeg")}</option>
            <option value="1">{v4("vstPeg1")}</option>
            <option value="2">{v4("vstPeg2")}</option>
            <option value="3">{v4("vstPeg3")}</option>
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("vstSpan")}</span>
          <select className="c4-select" aria-label={v4("vstSpan")} value={span} disabled={viewer} onChange={(event) => setSpan(event.target.value)}>
            <option value="">{v4("vstBlankSpan")}</option>
            <option value="15">{v4("vstSpan15")}</option>
            <option value="30">{v4("vstSpan30")}</option>
            <option value="45">{v4("vstSpan45")}</option>
            <option value="60">{v4("vstSpan60")}</option>
          </select>
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("vstAdd")}</button>
      </form>
      <div className="c4-row" role="group" aria-label={v4("vstTitle")}>
        <button type="button" className="c4-chip" data-on={tray === "open" ? "1" : "0"} aria-pressed={tray === "open"} onClick={() => setTray("open")}>{v4("vstWaiting")}</button>
        <button type="button" className="c4-chip" data-on={tray === "seated" ? "1" : "0"} aria-pressed={tray === "seated"} onClick={() => setTray("seated")}>{v4("vstSeated")}</button>
        <button type="button" className="c4-chip" data-on={tray === "closed" ? "1" : "0"} aria-pressed={tray === "closed"} onClick={() => setTray("closed")}>{v4("vstFiled")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("vstTimeline")}</button>
        <button type="button" className="c4-chip" data-on={pealOnly ? "1" : "0"} aria-pressed={pealOnly} onClick={() => setPealOnly((value) => !value)}>{v4("vstPealOnly")}</button>
        <button type="button" className="c4-chip" data-on={edgeOnly ? "1" : "0"} aria-pressed={edgeOnly} onClick={() => { setEdgeOnly((value) => !value); setTray("open"); }}>{v4("vstEdgeOnly")}</button>
        <button type="button" className="c4-btn" onClick={() => download("vestry-chits.csv", chitsCsv(cards, desk))}>{v4("vstCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkChitPin(cards, shown.map((card) => card.id), true))}>{v4("vstBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkChitClose(cards, shown.map((card) => card.id), true))}>{v4("vstBulkClose")}</button>
        <label className="c4-lab">
          <span>{v4("vstBulkAisle")}</span>
          <select className="c4-select" aria-label={v4("vstBulkAisle")} value={moveAisle} disabled={viewer} onChange={(event) => setMoveAisle(event.target.value)}>
            <option value="north">{v4("vstAisleNorth")}</option>
            <option value="south">{v4("vstAisleSouth")}</option>
            <option value="west">{v4("vstAisleWest")}</option>
            <option value="east">{v4("vstAisleEast")}</option>
          </select>
        </label>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkChitAisle(cards, shown.map((card) => card.id), moveAisle))}>{v4("vstBulkAisle")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetChits())}>{v4("vstReset")}</button>
      </div>
      <label className="c4-lab">
        <span>{v4("vstSearch")}</span>
        <input ref={searchRef} className="c4-field" aria-label={v4("vstSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      <label className="c4-lab">
        <span>{v4("vstDesk")}</span>
        <input className="c4-field" inputMode="numeric" aria-label={v4("vstDesk")} value={desk} onChange={(event) => setDesk(event.target.value)} />
      </label>
      <p className="c4-meta" role="status">
        {v4("vstNext")} {nextCard ? nextCard.subject : v4("vstNextNone")}
      </p>
      <div className="c4-row" role="group" aria-label={v4("vstClerks")}>
        <button type="button" className="c4-chip" data-on={clerkOn === "all" ? "1" : "0"} aria-pressed={clerkOn === "all"} onClick={() => setClerkFilter("all")}>{v4("vstAllClerks")}</button>
        <button type="button" className="c4-chip" data-on={clerkOn === "blank" ? "1" : "0"} aria-pressed={clerkOn === "blank"} onClick={() => setClerkFilter("blank")}>{v4("vstBlankClerk")}</button>
        {clerks.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={clerkOn === name ? "1" : "0"} aria-pressed={clerkOn === name} onClick={() => setClerkFilter(name)}>{name}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("vstAisles")}>
        <button type="button" className="c4-chip" data-on={aisleOn === "all" ? "1" : "0"} aria-pressed={aisleOn === "all"} onClick={() => setAisleFilter("all")}>{v4("vstAllAisles")}</button>
        <button type="button" className="c4-chip" data-on={aisleOn === "blank" ? "1" : "0"} aria-pressed={aisleOn === "blank"} onClick={() => setAisleFilter("blank")}>{v4("vstBlankAisle")}</button>
        {aisles.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={aisleOn === name ? "1" : "0"} aria-pressed={aisleOn === name} onClick={() => setAisleFilter(name)}>{aisleName(v4, name)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("vstMarks")}>
        <button type="button" className="c4-chip" data-on={markOn === "all" ? "1" : "0"} aria-pressed={markOn === "all"} onClick={() => setMarkFilter("all")}>{v4("vstAllMarks")}</button>
        <button type="button" className="c4-chip" data-on={markOn === "blank" ? "1" : "0"} aria-pressed={markOn === "blank"} onClick={() => setMarkFilter("blank")}>{v4("vstBlankMark")}</button>
        {marks.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={markOn === name ? "1" : "0"} aria-pressed={markOn === name} onClick={() => setMarkFilter(name)}>{name}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("vstChimes")}>
        <button type="button" className="c4-chip" data-on={chimeOn === "all" ? "1" : "0"} aria-pressed={chimeOn === "all"} onClick={() => setChimeFilter("all")}>{v4("vstAllChimes")}</button>
        <button type="button" className="c4-chip" data-on={chimeOn === "blank" ? "1" : "0"} aria-pressed={chimeOn === "blank"} onClick={() => setChimeFilter("blank")}>{v4("vstBlankChime")}</button>
        {chimes.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={chimeOn === name ? "1" : "0"} aria-pressed={chimeOn === name} onClick={() => setChimeFilter(name)}>{chimeName(v4, name)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("vstBells")}>
        {(["all", "blank", "night", "morning", "afternoon", "evening", "edge", "body"] as const).map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={bellOn === name ? "1" : "0"} aria-pressed={bellOn === name} onClick={() => setBellFilter(name)}>
            {name === "all" ? v4("vstAllBells") : watchName(v4, name)}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("vstPegs")}>
        {(["all", "blank", "1", "2", "3"] as const).map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={pegOn === name ? "1" : "0"} aria-pressed={pegOn === name} onClick={() => setPegFilter(name)}>
            {name === "all" ? v4("vstAllPegs") : name === "blank" ? v4("vstBlankPeg") : pegName(v4, Number(name))}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("vstSpans")}>
        {(["all", "blank", "15", "30", "45", "60"] as const).map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={spanOn === name ? "1" : "0"} aria-pressed={spanOn === name} onClick={() => setSpanFilter(name)}>
            {name === "all" ? v4("vstAllSpans") : name === "blank" ? v4("vstBlankSpan") : spanName(v4, Number(name))}
          </button>
        ))}
      </div>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addChitView(views, {
          id: `view-${Date.now()}`,
          name: viewName,
          tray,
          query,
          clerk: clerkOn,
          aisle: aisleOn,
          mark: markOn,
          chime: chimeOn,
          bell: bellOn,
          peg: pegOn,
          span: spanOn,
        });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab">
          <span>{v4("vstViewName")}</span>
          <input className="c4-field" aria-label={v4("vstViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("vstSaveView")}</button>
      </form>
      <section aria-label={v4("vstViews")}>
        <p className="c4-vst-kicker">{v4("vstViews")}</p>
        {!views.length && <p className="c4-vst-empty">{v4("vstViewEmpty")}</p>}
        <ul className="c4-vst-views">
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropChitView(views, view.id))}>{v4("vstDropView")}</button>
            </li>
          ))}
        </ul>
      </section>
      {board === "cards" && !shown.length && <p className="c4-vst-empty">{v4("vstEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-vst-rows">
          {shown.map((card) => {
            const clashesOn = chitClashIds(cards, card.id);
            const pegsOn = pegClashIds(cards, card.id);
            const gap = gapLabel(v4, card.bell, desk);
            const watch = watchOf(card.bell);
            const editingCard = editing === card.id;
            const late = lateChit(card, desk);
            return (
              <li key={card.id} data-chime={card.chime || "blank"} data-aisle={card.aisle || "blank"} data-watch={watch} data-late={late ? "1" : "0"}>
                <span className="c4-vst-mark" aria-hidden="true">{bellLabel(card.bell)}</span>
                <div>
                  {editingCard ? (
                    <form className="c4-row" onSubmit={(event) => {
                      event.preventDefault();
                      if (viewer) return;
                      const titled = editChit(cards, card.id, draft);
                      store(editChitAside(titled, card.id, asideDraft));
                      setEditing("");
                    }}>
                      <input className="c4-field" aria-label={v4("vstEdit")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <input className="c4-field" aria-label={v4("vstAside")} value={asideDraft} disabled={viewer} onChange={(event) => setAsideDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("vstSaveEdit")}</button>
                    </form>
                  ) : (
                    <>
                      <p>{card.subject}</p>
                      {card.aside ? <p className="c4-meta">{card.aside}</p> : null}
                    </>
                  )}
                  <p className="c4-meta">
                    {card.clerk || v4("vstBlankClerk")}
                    {" · "}
                    {bellLabel(card.bell)}
                    {" · "}
                    {aisleName(v4, aisleOf(card.aisle))}
                    {" · "}
                    {card.mark || v4("vstBlankMark")}
                    {" · "}
                    {chimeName(v4, chimeOf(card.chime))}
                    {" · "}
                    {pegName(v4, card.peg)}
                    {" · "}
                    {spanName(v4, card.span)}
                    {watch === "blank" ? "" : ` · ${watchName(v4, watch)}`}
                    {gap ? ` · ${gap}` : ""}
                    {late ? ` · ${v4("vstLate")}` : ""}
                    {auditName(v4, card.audit) ? ` · ${v4("vstAudit")} ${auditName(v4, card.audit)}` : ""}
                    {" · "}
                    {clashesOn.length ? `${v4("vstClash")} ${clashesOn.length}` : v4("vstClashNone")}
                    {" · "}
                    {pegsOn.length ? `${v4("vstPegClash")} ${pegsOn.length}` : v4("vstPegClashNone")}
                  </p>
                </div>
                <div className="c4-row">
                  <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("vstCopied") : v4("vstCopy")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.subject); setAsideDraft(card.aside); }}>{v4("vstEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleChime(cards, card.id))}>{v4("vstChimeUp")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.pinned} onClick={() => store(setChitPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("vstUnpin") : v4("vstPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.seated} onClick={() => store(setChitSeat(cards, card.id, !card.seated))}>{card.seated ? v4("vstRise") : v4("vstSeat")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.closed} onClick={() => store(setChitClosed(cards, card.id, !card.closed))}>{card.closed ? v4("vstReopen") : v4("vstClose")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {board === "timeline" && (
        <ol className="c4-vst-time">
          {timeline.map((card) => (
            <li key={card.id} data-watch={watchOf(card.bell)}>
              <span className="c4-vst-clock">{bellLabel(card.bell)}</span>
              <p>{card.subject}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function ShutterTimes({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenWatches, setHiddenWatches] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [phase, setPhase] = useState("all");
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = useMemo(() => (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || "").trim(),
      at: row.loginBlockedAt,
    };
  }).filter((row): row is GlanceRow => Boolean(row)), [data.data?.users]);
  const watchesOn = watchLines(rows);
  const phases = phaseLines(rows);
  const present = presentWatches(rows);
  const presentKey = present.join("\n");
  const watchNames = present.filter((item) => item !== "blank");
  const phaseNames = phases.map((line) => line.phase).filter(Boolean);
  const leadWatch = leadingWatch(rows);
  const leadPhase = leadingPhase(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenWatches(readJson(SHUTTER_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenWatches(next);
    writeJson(SHUTTER_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleWatches(present, hiddenWatches, showHidden);
  const phaseOn = activePhase(phase, phaseNames);
  const watchOn = selected ? activeWatch(selected, watchNames) : "all";
  const shown = visibleShutterCustomers(
    rows,
    selected ? watchArg(watchOn === "all" && selected === "blank" ? "blank" : watchOn) : null,
    phaseArg(phaseOn),
    query,
  );
  const widest = Math.max(1, ...watchesOn.map((line) => line.count));
  const setCount = rows.filter((row) => shutterState(row.at) === "set").length;

  function store(next: string[], clear: string) {
    setHiddenWatches(next);
    writeJson(SHUTTER_KEY, next);
    if (clear && selected === clear) setSelected("");
  }

  return (
    <section className="c4-sht" aria-label={v4("shtTitle")} data-shutters="1">
      <header className="c4-sht-head">
        <div>
          <p className="c4-vst-kicker">{v4("shtSub")}</p>
          <h2 className="c4-title">{v4("shtTitle")}</h2>
        </div>
        <p className="c4-vst-count">{v4("shtRows")} {rows.length}</p>
      </header>
      <details className="c4-vst-rules">
        <summary>{v4("shtRules")}</summary>
        <p className="c4-meta">{v4("shtHint")}</p>
        <p className="c4-meta">{v4("shtLocal")}</p>
        <p className="c4-meta">{v4("shtEscape")}</p>
      </details>
      <p className="c4-vst-notice" role="status">
        <span>{v4("shtSetNotice")}</span>
        <span className="c4-vst-count">{setCount}</span>
      </p>
      {leadWatch ? <p className="c4-sht-lead"><span>{v4("shtLeadWatch")}</span> {shutterWatchName(v4, leadWatch)}</p> : null}
      {leadPhase ? <p className="c4-sht-lead"><span>{v4("shtLeadPhase")}</span> {phaseName(v4, leadPhase)}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("shtBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("shutter-times.csv", shuttersCsv(rows))}>{v4("shtCsv")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("shtLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("shtFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-vst-empty">{v4("shtNone")}</p>}
      {watchesOn.length > 0 && (
        <section className="c4-sht-chart" aria-label={v4("shtAllWatches")}>
          {watchesOn.map((line) => {
            const share = shutterShare(line.count, rows.length);
            const bar = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.watch || "blank";
            return (
              <p key={name} className="c4-sht-col" data-watch={name}>
                <span>{shutterWatchName(v4, line.watch)}</span>
                <span className="c4-vst-track" aria-hidden="true"><i style={{ width: `${bar}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("shtShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      <div className="c4-row" role="group" aria-label={v4("shtShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("shtShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("shtHidden")}</button>
      </div>
      <div className="c4-sht-bands" role="group" aria-label={v4("shtAllWatches")}>
        <button type="button" className="c4-sht-band" data-on={!selected ? "1" : "0"} aria-pressed={!selected} onClick={() => setSelected("")}>
          <span>{v4("shtAllWatches")}</span>
          <span className="c4-vst-count">{rows.length}</span>
        </button>
        {chips.map((item) => {
          const count = rows.filter((row) => {
            const state = shutterState(row.at);
            const token = state === "set" ? shutterWatch(row.at) : state === "clear" ? "blank" : "";
            return token === item;
          }).length;
          const share = shutterShare(count, rows.length);
          return (
            <span key={item} className="c4-sht-pair">
              <button type="button" className="c4-sht-band" data-on={selected === item ? "1" : "0"} aria-pressed={selected === item} onClick={() => setSelected(selected === item ? "" : item)}>
                <span>{shutterWatchName(v4, item)}</span>
                <span className="c4-vst-count">{count}</span>
                <span>{v4("shtShare")} {share}%</span>
              </button>
              <button type="button" className="c4-btn" onClick={() => store(toggleWatch(hiddenWatches, item, present), showHidden ? "" : item)}>{showHidden ? v4("shtShow") : v4("shtHide")}</button>
            </span>
          );
        })}
      </div>
      <div className="c4-row" role="group" aria-label={v4("shtPhases")}>
        <button type="button" className="c4-chip" data-on={phaseOn === "all" ? "1" : "0"} aria-pressed={phaseOn === "all"} onClick={() => setPhase("all")}>{v4("shtAllPhases")}</button>
        {phases.filter((line) => line.phase).map((line) => (
          <button key={line.phase} type="button" className="c4-chip" data-on={phaseOn === line.phase ? "1" : "0"} aria-pressed={phaseOn === line.phase} onClick={() => setPhase(phaseOn === line.phase ? "all" : line.phase)}>
            {phaseName(v4, line.phase)} {line.count}
          </button>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("shtSearch")}</span>
        <input className="c4-field" aria-label={v4("shtSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-vst-empty">{v4("shtEmpty")}</p>}
      <ul className="c4-sht-rows">
        {shown.map((row) => {
          const state = shutterState(row.at);
          const watch = shutterWatch(row.at) as ShutterWatch;
          const phaseMark = shutterPhase(row.at) as ShutterPhase;
          return (
            <li key={row.id} data-state={state || "blank"} data-watch={watch || "blank"} data-phase={phaseMark || "blank"}>
              <span className="c4-sht-face" aria-hidden="true">{watch ? watch.slice(0, 1).toUpperCase() : "—"}</span>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">
                {state === "set" ? shutterWatchName(v4, watch) : state === "clear" ? v4("shtClear") : v4("shtUnmarked")}
                {" · "}
                {phaseName(v4, phaseMark)}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
