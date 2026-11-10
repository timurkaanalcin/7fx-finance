"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  CHIT_KEY,
  CHIT_VIEW_KEY,
  SLIP_KEY,
  SLIP_REVIEW_KEY,
  activeBay,
  activeGrain,
  activeHand,
  activeMarkCode,
  activeReach,
  activeSlip,
  activeSlipDepth,
  activeTone,
  activeWeight,
  addChit,
  addChitView,
  ampSlip,
  bayArg,
  bayBand,
  bayClashIds,
  bayGap,
  bayTimeline,
  bulkChitBox,
  bulkChitGrain,
  bulkChitPin,
  bulkReview,
  chitCopy,
  chitCounts,
  chitGrains,
  chitHands,
  chitMarks,
  chitShare,
  chitTones,
  chitsCsv,
  clashBayCount,
  cycleTone,
  dropChitView,
  editChit,
  editChitNote,
  grainArg,
  grainCounts,
  grainOf,
  handArg,
  handLoad,
  homeMark,
  lateChit,
  leadingSlip,
  leadingSlipDepth,
  markCodeArg,
  nextChit,
  oddSlipCount,
  presentSlips,
  reachArg,
  readChitViews,
  readChits,
  readHiddenSlips,
  readReviewed,
  resetChits,
  setChitBoxed,
  setChitPin,
  setChitSeal,
  slipArg,
  slipBand,
  slipCopy,
  slipDepth,
  slipDepthArg,
  slipRowsCsv,
  slipShare,
  slipState,
  slipWords,
  slipsCsv,
  soonChit,
  suggestGrain,
  suggestHand,
  suggestReach,
  toggleReview,
  toggleSlip,
  toneArg,
  toneOf,
  usedBays,
  visibleChits,
  visibleSlipBands,
  visibleSlipCustomers,
  weightArg,
  weightClashCount,
  weightClashIds,
  type Chit,
  type ChitGrain,
  type ChitTone,
  type ChitTray,
  type ChitView,
  type SlipRow,
  type SlipShape,
} from "@/lib/crmv4/round178";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  city?: string | null;
};

type GlanceRow = SlipRow & { id: string };

const GRAINS = ["linen", "oak", "slate"] as const;
const BANDS = ["dot", "town", "city", "sprawl"] as const;

function grainName(v4: V4, grain: ChitGrain | string): string {
  if (grain === "linen") return v4("chtGrainLinen");
  if (grain === "oak") return v4("chtGrainOak");
  if (grain === "slate") return v4("chtGrainSlate");
  return v4("chtBlankGrain");
}

function toneName(v4: V4, tone: ChitTone): string {
  if (tone === "pearl") return v4("chtTonePearl");
  if (tone === "amber") return v4("chtToneAmber");
  if (tone === "ink") return v4("chtToneInk");
  return v4("chtBlankTone");
}

function bayName(v4: V4, name: string): string {
  if (name === "dawn") return v4("chtDawn");
  if (name === "noon") return v4("chtNoon");
  if (name === "dusk") return v4("chtDusk");
  if (name === "peak") return v4("chtPeak");
  if (name === "quiet") return v4("chtQuiet");
  if (/^[1-8]$/.test(name)) return name;
  return v4("chtBlankBay");
}

function weightName(v4: V4, weight: number | null): string {
  if (weight === 2) return v4("chtWeight2");
  if (weight === 5) return v4("chtWeight5");
  if (weight === 8) return v4("chtWeight8");
  return v4("chtBlankWeight");
}

function reachName(v4: V4, reach: number | null): string {
  if (reach === 4) return v4("chtReach4");
  if (reach === 7) return v4("chtReach7");
  if (reach === 10) return v4("chtReach10");
  return v4("chtBlankReach");
}

function bandName(v4: V4, name: string): string {
  if (name === "dot") return v4("cslDot");
  if (name === "town") return v4("cslTown");
  if (name === "city") return v4("cslCity");
  if (name === "sprawl") return v4("cslSprawl");
  if (name === "blank") return v4("cslClear");
  return v4("cslUnmarked");
}

function depthName(v4: V4, name: string): string {
  if (name === "plain") return v4("cslPlain");
  if (name === "pair") return v4("cslPair");
  if (name === "stack") return v4("cslStack");
  if (name === "joint") return v4("cslJoint");
  if (name === "cipher") return v4("cslCipher");
  return v4("cslUnmarked");
}

function auditName(v4: V4, audit: string): string {
  const key = {
    save: "chtAuditSave",
    edit: "chtAuditEdit",
    tone: "chtAuditTone",
    pin: "chtAuditPin",
    unpin: "chtAuditUnpin",
    seal: "chtAuditSeal",
    break: "chtAuditBreak",
    box: "chtAuditBox",
    unbox: "chtAuditUnbox",
    shift: "chtAuditShift",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function bayLabel(bay: number | null): string {
  return bay === null ? "—" : String(bay);
}

function gapLabel(v4: V4, bay: number | null, desk: string): string {
  const gap = bayGap(bay, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("chtPast")} ${gap}`;
  if (gap < 0) return `${v4("chtAhead")} ${Math.abs(gap)}`;
  return v4("chtDue");
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
  return left.length === right.length && left.every((card, index) => card.id === right[index]?.id && card.title === right[index]?.title && card.note === right[index]?.note && card.audit === right[index]?.audit);
}

export function AtelierChits({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<Chit[]>([]);
  const [views, setViews] = useState<ChitView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [hand, setHand] = useState("");
  const [bay, setBay] = useState("");
  const [grain, setGrain] = useState("");
  const [mark, setMark] = useState("");
  const [tone, setTone] = useState("");
  const [weight, setWeight] = useState("");
  const [reach, setReach] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<ChitTray>("open");
  const [handFilter, setHandFilter] = useState("all");
  const [grainFilter, setGrainFilter] = useState("all");
  const [markFilter, setMarkFilter] = useState("all");
  const [toneFilter, setToneFilter] = useState("all");
  const [bayFilter, setBayFilter] = useState("all");
  const [weightFilter, setWeightFilter] = useState("all");
  const [reachFilter, setReachFilter] = useState("all");
  const [inkOnly, setInkOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [homeOnly, setHomeOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [desk, setDesk] = useState("");
  const [moveGrain, setMoveGrain] = useState("linen");
  const [picked, setPicked] = useState<string[]>([]);
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
  const hands = chitHands(cards);
  const grains = chitGrains(cards);
  const marks = chitMarks(cards);
  const tones = chitTones(cards);
  const bars = grainCounts(cards);
  const handOn = activeHand(handFilter, hands);
  const grainOn = activeGrain(grainFilter, GRAINS);
  const markOn = activeMarkCode(markFilter, marks);
  const toneOn = activeTone(toneFilter, tones);
  const bayOn = activeBay(bayFilter);
  const weightOn = activeWeight(weightFilter);
  const reachOn = activeReach(reachFilter);
  const pickedBay = bayArg(bayOn);
  const shown = visibleChits(
    cards,
    tray,
    query,
    handArg(handOn),
    grainArg(grainOn),
    markCodeArg(markOn),
    toneArg(toneOn),
    pickedBay.exact,
    pickedBay.pick,
    weightArg(weightOn),
    reachArg(reachOn),
    inkOnly,
    peakOnly,
    homeOnly,
  );
  const timeline = bayTimeline(cards, query);
  const counts = chitCounts(cards, desk);
  const clashes = clashBayCount(cards);
  const weights = weightClashCount(cards);
  const bayUse = usedBays(cards);
  const total = cards.length;
  const nextId = nextChit(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const widest = Math.max(1, ...bars);
  const pinned = cards.filter((card) => card.pinned);
  const load = handLoad(cards, hand);
  const suggested = suggestGrain(cards);
  const lightHand = suggestHand(cards);
  const quietReach = suggestReach(cards);
  const homeShare = chitShare(counts.home, total);
  const targets = picked.length ? picked : shown.map((card) => card.id);

  function store(next: Chit[]) {
    setCards(next);
    writeJson(CHIT_KEY, next);
  }

  function storeViews(next: ChitView[]) {
    setViews(next);
    writeJson(CHIT_VIEW_KEY, next);
  }

  function clearDraft() {
    setTitle("");
    setNote("");
    setHand("");
    setBay("");
    setGrain("");
    setMark("");
    setTone("");
    setWeight("");
    setReach("");
  }

  function copyCard(card: Chit) {
    const body = chitCopy(card.title);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(card.id);
  }

  function applyView(view: ChitView) {
    setTray(view.tray);
    setQuery(view.query);
    setHandFilter(activeHand(view.hand, chitHands(cards)));
    setGrainFilter(activeGrain(view.grain, GRAINS));
    setMarkFilter(activeMarkCode(view.mark, chitMarks(cards)));
    setToneFilter(activeTone(view.tone, chitTones(cards)));
    setBayFilter(activeBay(view.bay));
    setWeightFilter(activeWeight(view.weight));
    setReachFilter(activeReach(view.reach));
    setBoard("cards");
    setInkOnly(false);
    setPeakOnly(false);
    setHomeOnly(false);
  }

  function togglePick(id: string) {
    setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <section className="c4-cht" aria-label={v4("chtTitle")} data-chits="1" data-role={role}>
      <header className="c4-cht-head">
        <p className="c4-cht-plate" data-logo="mono">{v4("chtLogo")}</p>
        <div>
          <p className="c4-cht-kicker">{v4("chtSub")}</p>
          <h2 className="c4-title">{v4("chtTitle")}</h2>
        </div>
        <p className="c4-cht-count">{shown.length}</p>
      </header>
      <details className="c4-cht-rules">
        <summary>{v4("chtRules")}</summary>
        <p className="c4-meta">{v4("chtHint")}</p>
        <p className="c4-meta">{v4("chtLocal")}</p>
        <p className="c4-meta">{v4("chtBlank")}</p>
        <p className="c4-meta">{v4("chtHandBlank")}</p>
        <p className="c4-meta">{v4("chtBayBlank")}</p>
        <p className="c4-meta">{v4("chtGrainBlank")}</p>
        <p className="c4-meta">{v4("chtMarkBlank")}</p>
        <p className="c4-meta">{v4("chtToneBlank")}</p>
        <p className="c4-meta">{v4("chtWeightBlank")}</p>
        <p className="c4-meta">{v4("chtReachBlank")}</p>
        <p className="c4-meta">{v4("chtNoteBlank")}</p>
        <p className="c4-meta">{v4("chtEscape")}</p>
        <p className="c4-meta">{v4("chtSlash")}</p>
        <p className="c4-meta">{v4("chtNew")}</p>
      </details>
      {viewer ? <p className="c4-cht-notice" role="status">{v4("chtViewer")}</p> : null}
      <p className="c4-cht-notice" role="status">
        <span>{v4("chtNotice")}</span>
        <span className="c4-cht-count">{counts.peak}</span>
        <button type="button" className="c4-btn" aria-pressed={peakOnly} onClick={() => { setPeakOnly((value) => !value); setTray("open"); }}>
          {peakOnly ? v4("chtNoticeAll") : v4("chtNoticePeak")}
        </button>
      </p>
      <p className="c4-cht-notice" role="status"><span>{v4("chtLate")}</span><span className="c4-cht-count">{counts.late}</span></p>
      <p className="c4-cht-notice" role="status"><span>{v4("chtSoon")}</span><span className="c4-cht-count">{counts.soon}</span></p>
      <p className="c4-cht-notice" role="status"><span>{v4("chtBayUse")}</span><span className="c4-cht-count">{bayUse}</span></p>
      <p className="c4-cht-notice" role="status"><span>{v4("chtClash")}</span><span className="c4-cht-count">{clashes}</span></p>
      <p className="c4-cht-notice" role="status"><span>{v4("chtWeightClash")}</span><span className="c4-cht-count">{weights}</span></p>
      <p className="c4-cht-notice" role="status">
        <span>{v4("chtHome")}</span>
        <span className="c4-cht-count">{counts.home}</span>
        <span>{v4("chtHomeShare")} {homeShare}%</span>
        <button type="button" className="c4-btn" aria-pressed={homeOnly} onClick={() => setHomeOnly((value) => !value)}>
          {homeOnly ? v4("chtHomeAll") : v4("chtHomeOnly")}
        </button>
      </p>
      <p className="c4-cht-suggest" role="status">
        <span>{v4("chtSuggest")}</span> {grainName(v4, suggested)}
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setGrain(suggested)}>{v4("chtUseGrain")}</button>
      </p>
      <p className="c4-cht-suggest" role="status">
        <span>{v4("chtSuggestHand")}</span> {lightHand || v4("chtBlankHand")}
        <button type="button" className="c4-btn" disabled={viewer || !lightHand} onClick={() => setHand(lightHand)}>{v4("chtUseHand")}</button>
      </p>
      <p className="c4-cht-suggest" role="status">
        <span>{v4("chtSuggestReach")}</span> {reachName(v4, quietReach)}
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setReach(String(quietReach))}>{v4("chtUseReach")}</button>
      </p>
      {pinned.length > 0 && (
        <ul className="c4-cht-pins" aria-label={v4("chtPinned")}>
          {pinned.map((card) => (
            <li key={card.id}><span className="c4-cht-mark" aria-hidden="true">{bayLabel(card.bay)}</span> {card.title}</li>
          ))}
        </ul>
      )}
      <section className="c4-cht-kpi" aria-label={v4("chtKpi")}>
        {(["open", "sealed", "boxed"] as const).map((key) => {
          const count = counts[key];
          const share = chitShare(count, total);
          const label = key === "open" ? v4("chtWaiting") : key === "sealed" ? v4("chtSealed") : v4("chtBoxed");
          return (
            <p key={key} className="c4-cht-meter" data-tray={key}>
              <span>{label}</span>
              <span className="c4-cht-count">{count}</span>
              <span>{v4("chtShare")} {share}%</span>
              <span className="c4-cht-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <section className="c4-cht-chart" aria-label={v4("chtChart")}>
        <p className="c4-cht-kicker">{v4("chtChart")}</p>
        {GRAINS.map((name, index) => {
          const count = bars[index] || 0;
          const bar = Math.max(8, Math.round((count / widest) * 100));
          return (
            <button key={name} type="button" className="c4-cht-col" data-on={grainOn === name ? "1" : "0"} aria-pressed={grainOn === name} onClick={() => setGrainFilter(grainOn === name ? "all" : name)}>
              <span>{grainName(v4, name)}</span>
              <span className="c4-cht-bar" aria-hidden="true"><i style={{ width: `${bar}%` }} /></span>
              <span>{count}</span>
            </button>
          );
        })}
      </section>
      <div className="c4-cht-split">
        <form className="c4-cht-form" onSubmit={(event) => {
          event.preventDefault();
          if (viewer) return;
          const next = addChit(cards, { id: `cht-${Date.now()}`, title, note, hand, bay, grain, mark, tone, weight, reach });
          if (sameCards(next, cards)) return;
          store(next);
          clearDraft();
        }}>
          <label className="c4-lab">
            <span>{v4("chtLine")}</span>
            <input ref={titleRef} className="c4-field" aria-label={v4("chtLine")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              event.preventDefault();
              clearDraft();
            }} />
          </label>
          <label className="c4-lab">
            <span>{v4("chtNote")}</span>
            <input className="c4-field" aria-label={v4("chtNote")} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} />
          </label>
          <label className="c4-lab">
            <span>{v4("chtHand")}</span>
            <input className="c4-field" aria-label={v4("chtHand")} value={hand} disabled={viewer} onChange={(event) => setHand(event.target.value)} />
          </label>
          <p className="c4-meta" role="status">{v4("chtLoad")} {load}</p>
          <label className="c4-lab">
            <span>{v4("chtBay")}</span>
            <input className="c4-field" inputMode="numeric" aria-label={v4("chtBay")} value={bay} disabled={viewer} onChange={(event) => setBay(event.target.value)} />
          </label>
          <label className="c4-lab">
            <span>{v4("chtGrain")}</span>
            <select className="c4-select" aria-label={v4("chtGrain")} value={grain} disabled={viewer} onChange={(event) => setGrain(event.target.value)}>
              <option value="">{v4("chtBlankGrain")}</option>
              <option value="linen">{v4("chtGrainLinen")}</option>
              <option value="oak">{v4("chtGrainOak")}</option>
              <option value="slate">{v4("chtGrainSlate")}</option>
            </select>
          </label>
          <label className="c4-lab">
            <span>{v4("chtMark")}</span>
            <input className="c4-field" aria-label={v4("chtMark")} value={mark} disabled={viewer} onChange={(event) => setMark(event.target.value)} />
          </label>
          <label className="c4-lab">
            <span>{v4("chtTone")}</span>
            <select className="c4-select" aria-label={v4("chtTone")} value={tone} disabled={viewer} onChange={(event) => setTone(event.target.value)}>
              <option value="">{v4("chtBlankTone")}</option>
              <option value="pearl">{v4("chtTonePearl")}</option>
              <option value="amber">{v4("chtToneAmber")}</option>
              <option value="ink">{v4("chtToneInk")}</option>
            </select>
          </label>
          <label className="c4-lab">
            <span>{v4("chtWeight")}</span>
            <select className="c4-select" aria-label={v4("chtWeight")} value={weight} disabled={viewer} onChange={(event) => setWeight(event.target.value)}>
              <option value="">{v4("chtBlankWeight")}</option>
              <option value="2">{v4("chtWeight2")}</option>
              <option value="5">{v4("chtWeight5")}</option>
              <option value="8">{v4("chtWeight8")}</option>
            </select>
          </label>
          <label className="c4-lab">
            <span>{v4("chtReach")}</span>
            <select className="c4-select" aria-label={v4("chtReach")} value={reach} disabled={viewer} onChange={(event) => setReach(event.target.value)}>
              <option value="">{v4("chtBlankReach")}</option>
              <option value="4">{v4("chtReach4")}</option>
              <option value="7">{v4("chtReach7")}</option>
              <option value="10">{v4("chtReach10")}</option>
            </select>
          </label>
          <button type="submit" className="c4-btn c4-btn-hot" disabled={viewer}>{v4("chtAdd")}</button>
        </form>
        <div className="c4-cht-board">
          <div className="c4-row" role="tablist" aria-label={v4("chtCards")}>
            <button type="button" className="c4-chip" data-on={board === "cards" ? "1" : "0"} onClick={() => setBoard("cards")}>{v4("chtCards")}</button>
            <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard("timeline")}>{v4("chtTimeline")}</button>
            <button type="button" className="c4-chip" data-on={tray === "open" ? "1" : "0"} onClick={() => setTray("open")}>{v4("chtWaiting")}</button>
            <button type="button" className="c4-chip" data-on={tray === "sealed" ? "1" : "0"} onClick={() => setTray("sealed")}>{v4("chtSealed")}</button>
            <button type="button" className="c4-chip" data-on={tray === "boxed" ? "1" : "0"} onClick={() => setTray("boxed")}>{v4("chtBoxed")}</button>
            <button type="button" className="c4-chip" data-on={inkOnly ? "1" : "0"} aria-pressed={inkOnly} onClick={() => setInkOnly((value) => !value)}>{v4("chtInkOnly")}</button>
          </div>
          <label className="c4-lab">
            <span>{v4("chtSearch")}</span>
            <input ref={searchRef} className="c4-field" aria-label={v4("chtSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              event.preventDefault();
              setQuery("");
            }} />
          </label>
          <label className="c4-lab">
            <span>{v4("chtDesk")}</span>
            <input className="c4-field" inputMode="numeric" aria-label={v4("chtDesk")} value={desk} onChange={(event) => setDesk(event.target.value)} />
          </label>
          <p className="c4-meta" role="status">{v4("chtNext")} {nextCard ? nextCard.title : v4("chtNextNone")}</p>
          <div className="c4-row">
            <label className="c4-lab">
              <span>{v4("chtHands")}</span>
              <select className="c4-select" aria-label={v4("chtHands")} value={handOn} onChange={(event) => setHandFilter(event.target.value)}>
                <option value="all">{v4("chtAllHands")}</option>
                <option value="blank">{v4("chtBlankHand")}</option>
                {hands.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>
            <label className="c4-lab">
              <span>{v4("chtGrains")}</span>
              <select className="c4-select" aria-label={v4("chtGrains")} value={grainOn} onChange={(event) => setGrainFilter(event.target.value)}>
                <option value="all">{v4("chtAllGrains")}</option>
                <option value="blank">{v4("chtBlankGrain")}</option>
                {grains.map((name) => <option key={name} value={name}>{grainName(v4, name)}</option>)}
              </select>
            </label>
            <label className="c4-lab">
              <span>{v4("chtMarks")}</span>
              <select className="c4-select" aria-label={v4("chtMarks")} value={markOn} onChange={(event) => setMarkFilter(event.target.value)}>
                <option value="all">{v4("chtAllMarks")}</option>
                <option value="blank">{v4("chtBlankMark")}</option>
                {marks.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>
            <label className="c4-lab">
              <span>{v4("chtTones")}</span>
              <select className="c4-select" aria-label={v4("chtTones")} value={toneOn} onChange={(event) => setToneFilter(event.target.value)}>
                <option value="all">{v4("chtAllTones")}</option>
                <option value="blank">{v4("chtBlankTone")}</option>
                {tones.map((name) => <option key={name} value={name}>{toneName(v4, name)}</option>)}
              </select>
            </label>
          </div>
          <div className="c4-row" role="group" aria-label={v4("chtBays")}>
            <button type="button" className="c4-chip" data-on={bayOn === "all" ? "1" : "0"} onClick={() => setBayFilter("all")}>{v4("chtAllBays")}</button>
            {["blank", "dawn", "noon", "dusk", "peak", "quiet", "1", "2", "3", "4", "5", "6", "7", "8"].map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={bayOn === name ? "1" : "0"} onClick={() => setBayFilter(bayOn === name ? "all" : name)}>{bayName(v4, name)}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("chtWeights")}>
            <button type="button" className="c4-chip" data-on={weightOn === "all" ? "1" : "0"} onClick={() => setWeightFilter("all")}>{v4("chtAllWeights")}</button>
            {["blank", "2", "5", "8"].map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={weightOn === name ? "1" : "0"} onClick={() => setWeightFilter(weightOn === name ? "all" : name)}>{name === "blank" ? v4("chtBlankWeight") : weightName(v4, Number(name))}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("chtReaches")}>
            <button type="button" className="c4-chip" data-on={reachOn === "all" ? "1" : "0"} onClick={() => setReachFilter("all")}>{v4("chtAllReaches")}</button>
            {["blank", "4", "7", "10"].map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={reachOn === name ? "1" : "0"} onClick={() => setReachFilter(reachOn === name ? "all" : name)}>{name === "blank" ? v4("chtBlankReach") : reachName(v4, Number(name))}</button>
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
              hand: handOn,
              grain: grainOn,
              mark: markOn,
              tone: toneOn,
              bay: bayOn,
              weight: weightOn,
              reach: reachOn,
            });
            if (next.length === views.length) return;
            storeViews(next);
            setViewName("");
          }}>
            <label className="c4-lab">
              <span>{v4("chtViews")}</span>
              <input className="c4-field" aria-label={v4("chtViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
            </label>
            <button type="submit" className="c4-btn" disabled={viewer}>{v4("chtSaveView")}</button>
          </form>
          <ul className="c4-cht-views" aria-label={v4("chtViews")}>
            {views.map((view) => (
              <li key={view.id}>
                <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropChitView(views, view.id))}>{v4("chtDropView")}</button>
              </li>
            ))}
          </ul>
          <div className="c4-row">
            <button type="button" className="c4-btn" onClick={() => download("atelier-chits.csv", chitsCsv(cards, desk))}>{v4("chtCsv")}</button>
            <button type="button" className="c4-btn" onClick={() => setPicked(shown.map((card) => card.id))}>{v4("chtPickAll")}</button>
            <button type="button" className="c4-btn" onClick={() => setPicked([])}>{v4("chtPickNone")}</button>
            <span className="c4-meta">{v4("chtPicked")} {picked.length}</span>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkChitPin(cards, targets, true))}>{v4("chtBulkPin")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkChitBox(cards, targets, true))}>{v4("chtBulkBox")}</button>
            <label className="c4-lab">
              <span>{v4("chtBulkGrain")}</span>
              <select className="c4-select" aria-label={v4("chtBulkGrain")} value={moveGrain} disabled={viewer} onChange={(event) => setMoveGrain(event.target.value)}>
                <option value="linen">{v4("chtGrainLinen")}</option>
                <option value="oak">{v4("chtGrainOak")}</option>
                <option value="slate">{v4("chtGrainSlate")}</option>
              </select>
            </label>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkChitGrain(cards, targets, moveGrain))}>{v4("chtBulkGrain")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(resetChits()); setPicked([]); }}>{v4("chtReset")}</button>
          </div>
          {!shown.length && board === "cards" && <p className="c4-cht-empty">{v4("chtEmpty")}</p>}
          {board === "cards" && (
            <ul className="c4-cht-cards">
              {shown.map((card) => {
                const band = bayBand(card.bay);
                const gap = gapLabel(v4, card.bay, desk);
                const late = lateChit(card, desk);
                const clashesOn = bayClashIds(cards, card.id);
                const weightsOn = weightClashIds(cards, card.id);
                const openEdit = editing === card.id;
                return (
                  <li key={card.id} data-grain={grainOf(card.grain)} data-tone={toneOf(card.tone)} data-pinned={card.pinned ? "1" : "0"}>
                    <label className="c4-row">
                      <input type="checkbox" checked={picked.includes(card.id)} onChange={() => togglePick(card.id)} aria-label={card.title} />
                      <span className="c4-cht-mark" aria-hidden="true">{bayLabel(card.bay)}</span>
                    </label>
                    <div>
                      {openEdit ? (
                        <form onSubmit={(event) => {
                          event.preventDefault();
                          if (viewer) return;
                          store(editChitNote(editChit(cards, card.id, draft), card.id, noteDraft));
                          setEditing("");
                        }}>
                          <input className="c4-field" aria-label={v4("chtLine")} value={draft} onChange={(event) => setDraft(event.target.value)} />
                          <input className="c4-field" aria-label={v4("chtNote")} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} />
                          <button type="submit" className="c4-btn" disabled={viewer}>{v4("chtEdit")}</button>
                        </form>
                      ) : (
                        <>
                          <p>{card.title}</p>
                          <p className="c4-meta">{card.note}</p>
                        </>
                      )}
                      <p className="c4-meta">
                        {card.hand || v4("chtBlankHand")}
                        {" · "}
                        {grainName(v4, card.grain)}
                        {" · "}
                        {card.mark || v4("chtBlankMark")}
                        {" · "}
                        {toneName(v4, toneOf(card.tone))}
                        {" · "}
                        {weightName(v4, card.weight)}
                        {" · "}
                        {reachName(v4, card.reach)}
                        {band === "blank" ? "" : ` · ${bayName(v4, band)}`}
                        {gap ? ` · ${gap}` : ""}
                        {late ? ` · ${v4("chtLate")}` : ""}
                        {soonChit(card) ? ` · ${v4("chtSoon")}` : ""}
                        {homeMark(card.mark) ? ` · ${v4("chtHome")}` : ""}
                        {auditName(v4, card.audit) ? ` · ${v4("chtAudit")} ${auditName(v4, card.audit)}` : ""}
                        {" · "}
                        {clashesOn.length ? `${v4("chtClash")} ${clashesOn.length}` : v4("chtClashNone")}
                        {" · "}
                        {weightsOn.length ? `${v4("chtWeightClash")} ${weightsOn.length}` : v4("chtWeightClashNone")}
                      </p>
                    </div>
                    <div className="c4-row">
                      <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("chtCopied") : v4("chtCopy")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); setNoteDraft(card.note); }}>{v4("chtEdit")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleTone(cards, card.id))}>{v4("chtToneUp")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.pinned} onClick={() => store(setChitPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("chtUnpin") : v4("chtPin")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.sealed} onClick={() => store(setChitSeal(cards, card.id, !card.sealed))}>{card.sealed ? v4("chtBreak") : v4("chtSealOn")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.boxed} onClick={() => store(setChitBoxed(cards, card.id, !card.boxed))}>{card.boxed ? v4("chtUnbox") : v4("chtBox")}</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {board === "timeline" && (
            <ol className="c4-cht-time">
              {timeline.map((card) => (
                <li key={card.id}>
                  <span className="c4-cht-clock">{bayLabel(card.bay)}</span>
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

export function CitySlips({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenBands, setHiddenBands] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [depth, setDepth] = useState("all");
  const [showHidden, setShowHidden] = useState(false);
  const [review, setReview] = useState<"all" | "reviewed" | "open">("all");
  const [shape, setShape] = useState<SlipShape>("all");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState("");
  const rows = useMemo(() => (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || "").trim(),
      note: row.city,
    };
  }).filter((row): row is GlanceRow => Boolean(row)), [data.data]);
  const present = presentSlips(rows);
  const presentKey = present.join("\n");
  const presentIds = rows.map((row) => row.id);
  const idKey = presentIds.join("\n");
  const bandsOn = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of rows) {
      const state = slipState(row.note);
      if (state === "") continue;
      const band = state === "set" ? slipBand(row.note) : "";
      counts.set(band, (counts.get(band) || 0) + 1);
    }
    return ["", ...BANDS].map((band) => ({ band, count: counts.get(band) || 0 })).filter((line) => line.count);
  }, [rows]);
  const depthNames = ["plain", "pair", "stack", "joint", "cipher"].filter((name) => rows.some((row) => slipDepth(row.note) === name));
  const bandNames = present.filter((band) => band !== "blank");
  const leadBand = leadingSlip(rows);
  const leadDepth = leadingSlipDepth(rows);
  const odd = oddSlipCount(rows);
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
    shape,
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

  function copyCode(row: GlanceRow) {
    const body = slipCopy(row.note);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(row.id);
  }

  return (
    <section className="c4-csl" aria-label={v4("cslTitle")} data-slips="1">
      <header className="c4-csl-head">
        <div>
          <p className="c4-cht-kicker">{v4("cslSub")}</p>
          <h2 className="c4-title">{v4("cslTitle")}</h2>
        </div>
        <p className="c4-cht-count">{v4("cslRows")} {rows.length}</p>
      </header>
      <details className="c4-cht-rules">
        <summary>{v4("cslRules")}</summary>
        <p className="c4-meta">{v4("cslHint")}</p>
        <p className="c4-meta">{v4("cslKept")}</p>
        <p className="c4-meta">{v4("cslEscape")}</p>
      </details>
      <p className="c4-cht-notice" role="status">
        <span>{v4("cslSetNotice")}</span>
        <span className="c4-cht-count">{setCount}</span>
      </p>
      <p className="c4-cht-notice" role="status">
        <span>{v4("cslUnreviewed")}</span>
        <span className="c4-cht-count">{openCount}</span>
      </p>
      <p className="c4-cht-notice" role="status">
        <span>{v4("cslOdd")}</span>
        <span className="c4-cht-count">{odd}</span>
        <button type="button" className="c4-btn" aria-pressed={shape === "odd"} onClick={() => setShape(shape === "odd" ? "all" : "odd")}>
          {shape === "odd" ? v4("cslAllShapes") : v4("cslOddOnly")}
        </button>
        <button type="button" className="c4-btn" aria-pressed={shape === "amp"} onClick={() => setShape(shape === "amp" ? "all" : "amp")}>{v4("cslAmp")}</button>
      </p>
      {leadBand ? <p className="c4-csl-lead"><span>{v4("cslLeadBand")}</span> {bandName(v4, leadBand)}</p> : null}
      {leadDepth ? <p className="c4-csl-lead"><span>{v4("cslLeadDepth")}</span> {depthName(v4, leadDepth)}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("cslBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("city-slips.csv", slipsCsv(rows))}>{v4("cslCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("city-slip-rows.csv", slipRowsCsv(rows, reviewed))}>{v4("cslRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => storeReview(bulkReview(reviewed, shown.map((row) => row.id), presentIds, true))}>{v4("cslBulkReview")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("cslLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("cslFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-cht-empty">{v4("cslNone")}</p>}
      {bandsOn.length > 0 && (
        <section className="c4-csl-chart" aria-label={v4("cslAllBands")}>
          {bandsOn.map((line) => {
            const share = slipShare(line.count, rows.length);
            const bar = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.band || "blank";
            return (
              <p key={name} className="c4-csl-col" data-band={name}>
                <span>{bandName(v4, line.band)}</span>
                <span className="c4-cht-track" aria-hidden="true"><i style={{ width: `${bar}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("cslShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      <div className="c4-row" role="group" aria-label={v4("cslShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("cslShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("cslHidden")}</button>
      </div>
      <div className="c4-csl-bands" role="group" aria-label={v4("cslAllBands")}>
        <button type="button" className="c4-csl-band" data-on={!selected ? "1" : "0"} aria-pressed={!selected} onClick={() => setSelected("")}>
          <span>{v4("cslAllBands")}</span>
          <span className="c4-cht-count">{rows.length}</span>
        </button>
        {chips.map((item) => {
          const name = item || "blank";
          const count = bandsOn.find((line) => (line.band || "blank") === name)?.count || 0;
          return (
            <div key={name} className="c4-csl-band" data-on={selected === name ? "1" : "0"}>
              <button type="button" aria-pressed={selected === name} onClick={() => setSelected(selected === name ? "" : name)}>
                <span>{bandName(v4, item)}</span>
                <span className="c4-cht-count">{count}</span>
              </button>
              <button type="button" className="c4-btn" onClick={() => store(toggleSlip(hiddenBands, name, present), name)}>{showHidden ? v4("cslShow") : v4("cslHide")}</button>
            </div>
          );
        })}
      </div>
      <div className="c4-row" role="group" aria-label={v4("cslDepths")}>
        <button type="button" className="c4-chip" data-on={depthOn === "all" ? "1" : "0"} aria-pressed={depthOn === "all"} onClick={() => setDepth("all")}>{v4("cslAllDepths")}</button>
        {depthNames.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={depthOn === name ? "1" : "0"} aria-pressed={depthOn === name} onClick={() => setDepth(depthOn === name ? "all" : name)}>{depthName(v4, name)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("cslShapes")}>
        <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} aria-pressed={review === "all"} onClick={() => setReview("all")}>{v4("cslAllMarks")}</button>
        <button type="button" className="c4-chip" data-on={review === "open" ? "1" : "0"} aria-pressed={review === "open"} onClick={() => setReview("open")}>{v4("cslOpenMarks")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} aria-pressed={review === "reviewed"} onClick={() => setReview("reviewed")}>{v4("cslReviewed")}</button>
      </div>
      <label className="c4-lab">
        <span>{v4("cslSearch")}</span>
        <input className="c4-field" aria-label={v4("cslSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-cht-empty">{v4("cslEmpty")}</p>}
      <ul className="c4-csl-rows">
        {shown.map((row) => {
          const band = slipBand(row.note);
          const deep = slipDepth(row.note);
          const words = slipWords(row.note);
          const seen = reviewed.includes(row.id);
          const joined = ampSlip(row.note);
          return (
            <li key={row.id} data-band={band || "blank"} data-reviewed={seen ? "1" : "0"} data-amp={joined ? "1" : "0"}>
              <div>
                <p>{row.label || row.id}</p>
                <p className="c4-meta">{bandName(v4, band || (slipState(row.note) === "clear" ? "blank" : ""))} · {depthName(v4, deep)} · {v4("cslParts")} {words}</p>
              </div>
              <div className="c4-row">
                <button type="button" className="c4-btn" onClick={() => copyCode(row)}>{copied === row.id ? v4("cslCopied") : v4("cslCopy")}</button>
                <button type="button" className="c4-btn" aria-pressed={seen} onClick={() => storeReview(toggleReview(reviewed, row.id, presentIds))}>{v4("cslReview")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
