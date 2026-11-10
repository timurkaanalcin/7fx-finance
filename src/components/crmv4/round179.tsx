"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  FRAME_KEY,
  FRAME_VIEW_KEY,
  PLATE_KEY,
  PLATE_REVIEW_KEY,
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
} from "@/lib/crmv4/round179";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  deskId?: string | null;
};

type GlanceRow = SlipRow & { id: string };

const GRAINS = ["wool", "silk", "linen"] as const;
const BANDS = ["tick", "nick", "plate", "banner"] as const;

function grainName(v4: V4, grain: ChitGrain | string): string {
  if (grain === "wool") return v4("frmClothWool");
  if (grain === "silk") return v4("frmClothSilk");
  if (grain === "linen") return v4("frmClothLinen");
  return v4("frmBlankCloth");
}

function toneName(v4: V4, tone: ChitTone): string {
  if (tone === "mist") return v4("frmGlazeMist");
  if (tone === "honey") return v4("frmGlazeHoney");
  if (tone === "soot") return v4("frmGlazeSoot");
  return v4("frmBlankGlaze");
}

function bayName(v4: V4, name: string): string {
  if (name === "dawn") return v4("frmDawn");
  if (name === "noon") return v4("frmNoon");
  if (name === "dusk") return v4("frmDusk");
  if (name === "peak") return v4("frmPeak");
  if (name === "quiet") return v4("frmQuiet");
  if (/^[1-8]$/.test(name)) return name;
  return v4("frmBlankHook");
}

function weightName(v4: V4, weight: number | null): string {
  if (weight === 3) return v4("frmSpan3");
  if (weight === 6) return v4("frmSpan6");
  if (weight === 9) return v4("frmSpan9");
  return v4("frmBlankSpan");
}

function reachName(v4: V4, reach: number | null): string {
  if (reach === 5) return v4("frmCord5");
  if (reach === 9) return v4("frmCord9");
  if (reach === 12) return v4("frmCord12");
  return v4("frmBlankCord");
}

function bandName(v4: V4, name: string): string {
  if (name === "tick") return v4("dkpTick");
  if (name === "nick") return v4("dkpNick");
  if (name === "plate") return v4("dkpPlate");
  if (name === "banner") return v4("dkpBanner");
  if (name === "blank") return v4("dkpClear");
  return v4("dkpUnmarked");
}

function depthName(v4: V4, name: string): string {
  if (name === "plain") return v4("dkpPlain");
  if (name === "pair") return v4("dkpPair");
  if (name === "stack") return v4("dkpStack");
  if (name === "seam") return v4("dkpSeam");
  if (name === "rail") return v4("dkpRail");
  if (name === "figure") return v4("dkpFigure");
  return v4("dkpUnmarked");
}

function auditName(v4: V4, audit: string): string {
  const key = {
    save: "frmAuditSave",
    edit: "frmAuditEdit",
    glaze: "frmAuditGlaze",
    pin: "frmAuditPin",
    unpin: "frmAuditUnpin",
    hang: "frmAuditHang",
    lift: "frmAuditLift",
    store: "frmAuditStore",
    restore: "frmAuditRestore",
    shift: "frmAuditShift",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function bayLabel(bay: number | null): string {
  return bay === null ? "—" : String(bay);
}

function gapLabel(v4: V4, bay: number | null, desk: string): string {
  const gap = bayGap(bay, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("frmPast")} ${gap}`;
  if (gap < 0) return `${v4("frmAhead")} ${Math.abs(gap)}`;
  return v4("frmDue");
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

export function SalonFrames({ v4 }: { v4: V4 }) {
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
  const [sootOnly, setSootOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [homeOnly, setHomeOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [desk, setDesk] = useState("");
  const [moveGrain, setMoveGrain] = useState("wool");
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readChits(readJson(FRAME_KEY, []));
    const saved = readChitViews(readJson(FRAME_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(FRAME_KEY, next);
    writeJson(FRAME_VIEW_KEY, saved);
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
    sootOnly,
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
    writeJson(FRAME_KEY, next);
  }

  function storeViews(next: ChitView[]) {
    setViews(next);
    writeJson(FRAME_VIEW_KEY, next);
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
    setSootOnly(false);
    setPeakOnly(false);
    setHomeOnly(false);
  }

  function togglePick(id: string) {
    setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <section className="c4-frm" aria-label={v4("frmTitle")} data-frames="1" data-role={role}>
      <header className="c4-frm-head">
        <p className="c4-frm-plate" data-logo="mono">{v4("frmLogo")}</p>
        <div>
          <p className="c4-frm-kicker">{v4("frmSub")}</p>
          <h2 className="c4-title">{v4("frmTitle")}</h2>
        </div>
        <p className="c4-frm-count">{shown.length}</p>
      </header>
      <details className="c4-frm-rules">
        <summary>{v4("frmRules")}</summary>
        <p className="c4-meta">{v4("frmHint")}</p>
        <p className="c4-meta">{v4("frmLocal")}</p>
        <p className="c4-meta">{v4("frmBlank")}</p>
        <p className="c4-meta">{v4("frmHangerBlank")}</p>
        <p className="c4-meta">{v4("frmHookBlank")}</p>
        <p className="c4-meta">{v4("frmClothBlank")}</p>
        <p className="c4-meta">{v4("frmCipherBlank")}</p>
        <p className="c4-meta">{v4("frmToneBlank")}</p>
        <p className="c4-meta">{v4("frmSpanBlank")}</p>
        <p className="c4-meta">{v4("frmCordBlank")}</p>
        <p className="c4-meta">{v4("frmNoteBlank")}</p>
        <p className="c4-meta">{v4("frmEscape")}</p>
        <p className="c4-meta">{v4("frmSlash")}</p>
        <p className="c4-meta">{v4("frmNew")}</p>
      </details>
      {viewer ? <p className="c4-frm-notice" role="status">{v4("frmViewer")}</p> : null}
      <p className="c4-frm-notice" role="status">
        <span>{v4("frmNotice")}</span>
        <span className="c4-frm-count">{counts.peak}</span>
        <button type="button" className="c4-btn" aria-pressed={peakOnly} onClick={() => { setPeakOnly((value) => !value); setTray("open"); }}>
          {peakOnly ? v4("frmNoticeAll") : v4("frmNoticePeak")}
        </button>
      </p>
      <p className="c4-frm-notice" role="status"><span>{v4("frmLate")}</span><span className="c4-frm-count">{counts.late}</span></p>
      <p className="c4-frm-notice" role="status"><span>{v4("frmSoon")}</span><span className="c4-frm-count">{counts.soon}</span></p>
      <p className="c4-frm-notice" role="status"><span>{v4("frmHookUse")}</span><span className="c4-frm-count">{bayUse}</span></p>
      <p className="c4-frm-notice" role="status"><span>{v4("frmClash")}</span><span className="c4-frm-count">{clashes}</span></p>
      <p className="c4-frm-notice" role="status"><span>{v4("frmSpanClash")}</span><span className="c4-frm-count">{weights}</span></p>
      <p className="c4-frm-notice" role="status">
        <span>{v4("frmHome")}</span>
        <span className="c4-frm-count">{counts.home}</span>
        <span>{v4("frmHomeShare")} {homeShare}%</span>
        <button type="button" className="c4-btn" aria-pressed={homeOnly} onClick={() => setHomeOnly((value) => !value)}>
          {homeOnly ? v4("frmHomeAll") : v4("frmHomeOnly")}
        </button>
      </p>
      <p className="c4-frm-suggest" role="status">
        <span>{v4("frmSuggestCloth")}</span> {grainName(v4, suggested)}
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setGrain(suggested)}>{v4("frmUseCloth")}</button>
      </p>
      <p className="c4-frm-suggest" role="status">
        <span>{v4("frmSuggestHanger")}</span> {lightHand || v4("frmBlankHanger")}
        <button type="button" className="c4-btn" disabled={viewer || !lightHand} onClick={() => setHand(lightHand)}>{v4("frmUseHanger")}</button>
      </p>
      <p className="c4-frm-suggest" role="status">
        <span>{v4("frmSuggestCord")}</span> {reachName(v4, quietReach)}
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setReach(String(quietReach))}>{v4("frmUseCord")}</button>
      </p>
      {pinned.length > 0 && (
        <ul className="c4-frm-pins" aria-label={v4("frmPinned")}>
          {pinned.map((card) => (
            <li key={card.id}><span className="c4-frm-mark" aria-hidden="true">{bayLabel(card.bay)}</span> {card.title}</li>
          ))}
        </ul>
      )}
      <section className="c4-frm-kpi" aria-label={v4("frmKpi")}>
        {(["open", "sealed", "boxed"] as const).map((key) => {
          const count = counts[key];
          const share = chitShare(count, total);
          const label = key === "open" ? v4("frmWaiting") : key === "sealed" ? v4("frmSealed") : v4("frmBoxed");
          return (
            <p key={key} className="c4-frm-meter" data-tray={key}>
              <span>{label}</span>
              <span className="c4-frm-count">{count}</span>
              <span>{v4("frmShare")} {share}%</span>
              <span className="c4-frm-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <section className="c4-frm-chart" aria-label={v4("frmClothChart")}>
        <p className="c4-frm-kicker">{v4("frmClothChart")}</p>
        {GRAINS.map((name, index) => {
          const count = bars[index] || 0;
          const bar = Math.max(8, Math.round((count / widest) * 100));
          return (
            <button key={name} type="button" className="c4-frm-col" data-on={grainOn === name ? "1" : "0"} aria-pressed={grainOn === name} onClick={() => setGrainFilter(grainOn === name ? "all" : name)}>
              <span>{grainName(v4, name)}</span>
              <span className="c4-frm-bar" aria-hidden="true"><i style={{ width: `${bar}%` }} /></span>
              <span>{count}</span>
            </button>
          );
        })}
      </section>
      <div className="c4-frm-split">
        <form className="c4-frm-form" onSubmit={(event) => {
          event.preventDefault();
          if (viewer) return;
          const next = addChit(cards, { id: `frm-${Date.now()}`, title, note, hand, bay, grain, mark, tone, weight, reach });
          if (sameCards(next, cards)) return;
          store(next);
          clearDraft();
        }}>
          <label className="c4-lab">
            <span>{v4("frmLine")}</span>
            <input ref={titleRef} className="c4-field" aria-label={v4("frmLine")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              event.preventDefault();
              clearDraft();
            }} />
          </label>
          <label className="c4-lab">
            <span>{v4("frmNote")}</span>
            <input className="c4-field" aria-label={v4("frmNote")} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} />
          </label>
          <label className="c4-lab">
            <span>{v4("frmHanger")}</span>
            <input className="c4-field" aria-label={v4("frmHanger")} value={hand} disabled={viewer} onChange={(event) => setHand(event.target.value)} />
          </label>
          <p className="c4-meta" role="status">{v4("frmOpenLoad")} {load}</p>
          <label className="c4-lab">
            <span>{v4("frmHook")}</span>
            <input className="c4-field" inputMode="numeric" aria-label={v4("frmHook")} value={bay} disabled={viewer} onChange={(event) => setBay(event.target.value)} />
          </label>
          <label className="c4-lab">
            <span>{v4("frmCloth")}</span>
            <select className="c4-select" aria-label={v4("frmCloth")} value={grain} disabled={viewer} onChange={(event) => setGrain(event.target.value)}>
              <option value="">{v4("frmBlankCloth")}</option>
              <option value="wool">{v4("frmClothWool")}</option>
              <option value="silk">{v4("frmClothSilk")}</option>
              <option value="linen">{v4("frmClothLinen")}</option>
            </select>
          </label>
          <label className="c4-lab">
            <span>{v4("frmCipher")}</span>
            <input className="c4-field" aria-label={v4("frmCipher")} value={mark} disabled={viewer} onChange={(event) => setMark(event.target.value)} />
          </label>
          <label className="c4-lab">
            <span>{v4("frmGlaze")}</span>
            <select className="c4-select" aria-label={v4("frmGlaze")} value={tone} disabled={viewer} onChange={(event) => setTone(event.target.value)}>
              <option value="">{v4("frmBlankGlaze")}</option>
              <option value="mist">{v4("frmGlazeMist")}</option>
              <option value="honey">{v4("frmGlazeHoney")}</option>
              <option value="soot">{v4("frmGlazeSoot")}</option>
            </select>
          </label>
          <label className="c4-lab">
            <span>{v4("frmSpan")}</span>
            <select className="c4-select" aria-label={v4("frmSpan")} value={weight} disabled={viewer} onChange={(event) => setWeight(event.target.value)}>
              <option value="">{v4("frmBlankSpan")}</option>
              <option value="3">{v4("frmSpan3")}</option>
              <option value="6">{v4("frmSpan6")}</option>
              <option value="9">{v4("frmSpan9")}</option>
            </select>
          </label>
          <label className="c4-lab">
            <span>{v4("frmCord")}</span>
            <select className="c4-select" aria-label={v4("frmCord")} value={reach} disabled={viewer} onChange={(event) => setReach(event.target.value)}>
              <option value="">{v4("frmBlankCord")}</option>
              <option value="5">{v4("frmCord5")}</option>
              <option value="9">{v4("frmCord9")}</option>
              <option value="12">{v4("frmCord12")}</option>
            </select>
          </label>
          <button type="submit" className="c4-btn c4-btn-hot" disabled={viewer}>{v4("frmAdd")}</button>
        </form>
        <div className="c4-frm-board">
          <div className="c4-row" role="tablist" aria-label={v4("frmCards")}>
            <button type="button" className="c4-chip" data-on={board === "cards" ? "1" : "0"} onClick={() => setBoard("cards")}>{v4("frmCards")}</button>
            <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard("timeline")}>{v4("frmTimeline")}</button>
            <button type="button" className="c4-chip" data-on={tray === "open" ? "1" : "0"} onClick={() => setTray("open")}>{v4("frmWaiting")}</button>
            <button type="button" className="c4-chip" data-on={tray === "sealed" ? "1" : "0"} onClick={() => setTray("sealed")}>{v4("frmSealed")}</button>
            <button type="button" className="c4-chip" data-on={tray === "boxed" ? "1" : "0"} onClick={() => setTray("boxed")}>{v4("frmBoxed")}</button>
            <button type="button" className="c4-chip" data-on={sootOnly ? "1" : "0"} aria-pressed={sootOnly} onClick={() => setSootOnly((value) => !value)}>{v4("frmSootOnly")}</button>
          </div>
          <label className="c4-lab">
            <span>{v4("frmSearch")}</span>
            <input ref={searchRef} className="c4-field" aria-label={v4("frmSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              event.preventDefault();
              setQuery("");
            }} />
          </label>
          <label className="c4-lab">
            <span>{v4("frmDeskHook")}</span>
            <input className="c4-field" inputMode="numeric" aria-label={v4("frmDeskHook")} value={desk} onChange={(event) => setDesk(event.target.value)} />
          </label>
          <p className="c4-meta" role="status">{v4("frmNext")} {nextCard ? nextCard.title : v4("frmNextNone")}</p>
          <div className="c4-row">
            <label className="c4-lab">
              <span>{v4("frmHangers")}</span>
              <select className="c4-select" aria-label={v4("frmHangers")} value={handOn} onChange={(event) => setHandFilter(event.target.value)}>
                <option value="all">{v4("frmAllHangers")}</option>
                <option value="blank">{v4("frmBlankHanger")}</option>
                {hands.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>
            <label className="c4-lab">
              <span>{v4("frmCloths")}</span>
              <select className="c4-select" aria-label={v4("frmCloths")} value={grainOn} onChange={(event) => setGrainFilter(event.target.value)}>
                <option value="all">{v4("frmAllCloths")}</option>
                <option value="blank">{v4("frmBlankCloth")}</option>
                {grains.map((name) => <option key={name} value={name}>{grainName(v4, name)}</option>)}
              </select>
            </label>
            <label className="c4-lab">
              <span>{v4("frmCiphers")}</span>
              <select className="c4-select" aria-label={v4("frmCiphers")} value={markOn} onChange={(event) => setMarkFilter(event.target.value)}>
                <option value="all">{v4("frmAllCiphers")}</option>
                <option value="blank">{v4("frmBlankCipher")}</option>
                {marks.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>
            <label className="c4-lab">
              <span>{v4("frmGlazes")}</span>
              <select className="c4-select" aria-label={v4("frmGlazes")} value={toneOn} onChange={(event) => setToneFilter(event.target.value)}>
                <option value="all">{v4("frmAllGlazes")}</option>
                <option value="blank">{v4("frmBlankGlaze")}</option>
                {tones.map((name) => <option key={name} value={name}>{toneName(v4, name)}</option>)}
              </select>
            </label>
          </div>
          <div className="c4-row" role="group" aria-label={v4("frmHooks")}>
            <button type="button" className="c4-chip" data-on={bayOn === "all" ? "1" : "0"} onClick={() => setBayFilter("all")}>{v4("frmAllHooks")}</button>
            {["blank", "dawn", "noon", "dusk", "peak", "quiet", "1", "2", "3", "4", "5", "6"].map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={bayOn === name ? "1" : "0"} onClick={() => setBayFilter(bayOn === name ? "all" : name)}>{bayName(v4, name)}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("frmSpans")}>
            <button type="button" className="c4-chip" data-on={weightOn === "all" ? "1" : "0"} onClick={() => setWeightFilter("all")}>{v4("frmAllSpans")}</button>
            {["blank", "3", "6", "9"].map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={weightOn === name ? "1" : "0"} onClick={() => setWeightFilter(weightOn === name ? "all" : name)}>{name === "blank" ? v4("frmBlankSpan") : weightName(v4, Number(name))}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("frmCords")}>
            <button type="button" className="c4-chip" data-on={reachOn === "all" ? "1" : "0"} onClick={() => setReachFilter("all")}>{v4("frmAllCords")}</button>
            {["blank", "5", "9", "12"].map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={reachOn === name ? "1" : "0"} onClick={() => setReachFilter(reachOn === name ? "all" : name)}>{name === "blank" ? v4("frmBlankCord") : reachName(v4, Number(name))}</button>
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
              <span>{v4("frmViews")}</span>
              <input className="c4-field" aria-label={v4("frmViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
            </label>
            <button type="submit" className="c4-btn" disabled={viewer}>{v4("frmSaveView")}</button>
          </form>
          <ul className="c4-frm-views" aria-label={v4("frmViews")}>
            {views.map((view) => (
              <li key={view.id}>
                <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropChitView(views, view.id))}>{v4("frmDropView")}</button>
              </li>
            ))}
          </ul>
          <div className="c4-row">
            <button type="button" className="c4-btn" onClick={() => download("salon-frames.csv", chitsCsv(cards, desk))}>{v4("frmCsv")}</button>
            <button type="button" className="c4-btn" onClick={() => setPicked(shown.map((card) => card.id))}>{v4("frmPickAll")}</button>
            <button type="button" className="c4-btn" onClick={() => setPicked([])}>{v4("frmPickNone")}</button>
            <span className="c4-meta">{v4("frmPicked")} {picked.length}</span>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkChitPin(cards, targets, true))}>{v4("frmBulkPin")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkChitBox(cards, targets, true))}>{v4("frmBulkBox")}</button>
            <label className="c4-lab">
              <span>{v4("frmBulkCloth")}</span>
              <select className="c4-select" aria-label={v4("frmBulkCloth")} value={moveGrain} disabled={viewer} onChange={(event) => setMoveGrain(event.target.value)}>
                <option value="wool">{v4("frmClothWool")}</option>
                <option value="silk">{v4("frmClothSilk")}</option>
                <option value="linen">{v4("frmClothLinen")}</option>
              </select>
            </label>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkChitGrain(cards, targets, moveGrain))}>{v4("frmBulkCloth")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(resetChits()); setPicked([]); }}>{v4("frmReset")}</button>
          </div>
          {!shown.length && board === "cards" && <p className="c4-frm-empty">{v4("frmEmpty")}</p>}
          {board === "cards" && (
            <ul className="c4-frm-cards">
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
                      <span className="c4-frm-mark" aria-hidden="true">{bayLabel(card.bay)}</span>
                    </label>
                    <div>
                      {openEdit ? (
                        <form onSubmit={(event) => {
                          event.preventDefault();
                          if (viewer) return;
                          store(editChitNote(editChit(cards, card.id, draft), card.id, noteDraft));
                          setEditing("");
                        }}>
                          <input className="c4-field" aria-label={v4("frmLine")} value={draft} onChange={(event) => setDraft(event.target.value)} />
                          <input className="c4-field" aria-label={v4("frmNote")} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} />
                          <button type="submit" className="c4-btn" disabled={viewer}>{v4("frmEdit")}</button>
                        </form>
                      ) : (
                        <>
                          <p>{card.title}</p>
                          <p className="c4-meta">{card.note}</p>
                        </>
                      )}
                      <p className="c4-meta">
                        {card.hand || v4("frmBlankHanger")}
                        {" · "}
                        {grainName(v4, card.grain)}
                        {" · "}
                        {card.mark || v4("frmBlankCipher")}
                        {" · "}
                        {toneName(v4, toneOf(card.tone))}
                        {" · "}
                        {weightName(v4, card.weight)}
                        {" · "}
                        {reachName(v4, card.reach)}
                        {band === "blank" ? "" : ` · ${bayName(v4, band)}`}
                        {gap ? ` · ${gap}` : ""}
                        {late ? ` · ${v4("frmLate")}` : ""}
                        {soonChit(card) ? ` · ${v4("frmSoon")}` : ""}
                        {homeMark(card.mark) ? ` · ${v4("frmHome")}` : ""}
                        {auditName(v4, card.audit) ? ` · ${v4("frmAudit")} ${auditName(v4, card.audit)}` : ""}
                        {" · "}
                        {clashesOn.length ? `${v4("frmClash")} ${clashesOn.length}` : v4("frmClashNone")}
                        {" · "}
                        {weightsOn.length ? `${v4("frmSpanClash")} ${weightsOn.length}` : v4("frmSpanClashNone")}
                      </p>
                    </div>
                    <div className="c4-row">
                      <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("frmCopied") : v4("frmCopy")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); setNoteDraft(card.note); }}>{v4("frmEdit")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleTone(cards, card.id))}>{v4("frmGlazeUp")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.pinned} onClick={() => store(setChitPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("frmUnpin") : v4("frmPin")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.sealed} onClick={() => store(setChitSeal(cards, card.id, !card.sealed))}>{card.sealed ? v4("frmBreak") : v4("frmSealOn")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.boxed} onClick={() => store(setChitBoxed(cards, card.id, !card.boxed))}>{card.boxed ? v4("frmUnbox") : v4("frmBox")}</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {board === "timeline" && (
            <ol className="c4-frm-time">
              {timeline.map((card) => (
                <li key={card.id}>
                  <span className="c4-frm-clock">{bayLabel(card.bay)}</span>
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

export function DeskPlates({ base, v4 }: { base: string; v4: V4 }) {
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
      note: row.deskId,
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
  const depthNames = ["plain", "pair", "stack", "seam", "rail", "figure"].filter((name) => rows.some((row) => slipDepth(row.note) === name));
  const bandNames = present.filter((band) => band !== "blank");
  const leadBand = leadingSlip(rows);
  const leadDepth = leadingSlipDepth(rows);
  const odd = oddSlipCount(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const known = presentKey ? presentKey.split("\n") : [];
    const next = readHiddenSlips(readJson(PLATE_KEY, []), known);
    setHiddenBands(next);
    writeJson(PLATE_KEY, next);
  }, [loading, failed, presentKey]);
  useEffect(() => {
    if (loading || failed) return;
    const known = idKey ? idKey.split("\n") : [];
    const next = readReviewed(readJson(PLATE_REVIEW_KEY, []), known);
    setReviewed(next);
    writeJson(PLATE_REVIEW_KEY, next);
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
    writeJson(PLATE_KEY, next);
    if (clear && selected === clear) setSelected("");
  }

  function storeReview(next: string[]) {
    setReviewed(next);
    writeJson(PLATE_REVIEW_KEY, next);
  }

  function copyCode(row: GlanceRow) {
    const body = slipCopy(row.note);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(row.id);
  }

  return (
    <section className="c4-dkp" aria-label={v4("dkpTitle")} data-plates="1">
      <header className="c4-dkp-head">
        <div>
          <p className="c4-frm-kicker">{v4("dkpSub")}</p>
          <h2 className="c4-title">{v4("dkpTitle")}</h2>
        </div>
        <p className="c4-frm-count">{v4("dkpRows")} {rows.length}</p>
      </header>
      <details className="c4-frm-rules">
        <summary>{v4("dkpRules")}</summary>
        <p className="c4-meta">{v4("dkpHint")}</p>
        <p className="c4-meta">{v4("dkpKept")}</p>
        <p className="c4-meta">{v4("dkpEscape")}</p>
      </details>
      <p className="c4-frm-notice" role="status">
        <span>{v4("dkpSetNotice")}</span>
        <span className="c4-frm-count">{setCount}</span>
      </p>
      <p className="c4-frm-notice" role="status">
        <span>{v4("dkpUnreviewed")}</span>
        <span className="c4-frm-count">{openCount}</span>
      </p>
      <p className="c4-frm-notice" role="status">
        <span>{v4("dkpOdd")}</span>
        <span className="c4-frm-count">{odd}</span>
        <button type="button" className="c4-btn" aria-pressed={shape === "odd"} onClick={() => setShape(shape === "odd" ? "all" : "odd")}>
          {shape === "odd" ? v4("dkpAllShapes") : v4("dkpOddOnly")}
        </button>
        <button type="button" className="c4-btn" aria-pressed={shape === "amp"} onClick={() => setShape(shape === "amp" ? "all" : "amp")}>{v4("dkpAmp")}</button>
      </p>
      {leadBand ? <p className="c4-dkp-lead"><span>{v4("dkpLeadBand")}</span> {bandName(v4, leadBand)}</p> : null}
      {leadDepth ? <p className="c4-dkp-lead"><span>{v4("dkpLeadDepth")}</span> {depthName(v4, leadDepth)}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("dkpBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("desk-plates.csv", slipsCsv(rows))}>{v4("dkpCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("desk-plate-rows.csv", slipRowsCsv(rows, reviewed))}>{v4("dkpRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => storeReview(bulkReview(reviewed, shown.map((row) => row.id), presentIds, true))}>{v4("dkpBulkReview")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("dkpLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("dkpFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-frm-empty">{v4("dkpNone")}</p>}
      {bandsOn.length > 0 && (
        <section className="c4-dkp-chart" aria-label={v4("dkpAllBands")}>
          {bandsOn.map((line) => {
            const share = slipShare(line.count, rows.length);
            const bar = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.band || "blank";
            return (
              <p key={name} className="c4-dkp-col" data-band={name}>
                <span>{bandName(v4, line.band)}</span>
                <span className="c4-frm-track" aria-hidden="true"><i style={{ width: `${bar}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("dkpShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      <div className="c4-row" role="group" aria-label={v4("dkpShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("dkpShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("dkpHidden")}</button>
      </div>
      <div className="c4-dkp-bands" role="group" aria-label={v4("dkpAllBands")}>
        <button type="button" className="c4-dkp-band" data-on={!selected ? "1" : "0"} aria-pressed={!selected} onClick={() => setSelected("")}>
          <span>{v4("dkpAllBands")}</span>
          <span className="c4-frm-count">{rows.length}</span>
        </button>
        {chips.map((item) => {
          const name = item || "blank";
          const count = bandsOn.find((line) => (line.band || "blank") === name)?.count || 0;
          return (
            <div key={name} className="c4-dkp-band" data-on={selected === name ? "1" : "0"}>
              <button type="button" aria-pressed={selected === name} onClick={() => setSelected(selected === name ? "" : name)}>
                <span>{bandName(v4, item)}</span>
                <span className="c4-frm-count">{count}</span>
              </button>
              <button type="button" className="c4-btn" onClick={() => store(toggleSlip(hiddenBands, name, present), name)}>{showHidden ? v4("dkpShow") : v4("dkpHide")}</button>
            </div>
          );
        })}
      </div>
      <div className="c4-row" role="group" aria-label={v4("dkpDepths")}>
        <button type="button" className="c4-chip" data-on={depthOn === "all" ? "1" : "0"} aria-pressed={depthOn === "all"} onClick={() => setDepth("all")}>{v4("dkpAllDepths")}</button>
        {depthNames.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={depthOn === name ? "1" : "0"} aria-pressed={depthOn === name} onClick={() => setDepth(depthOn === name ? "all" : name)}>{depthName(v4, name)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("dkpShapes")}>
        <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} aria-pressed={review === "all"} onClick={() => setReview("all")}>{v4("dkpAllMarks")}</button>
        <button type="button" className="c4-chip" data-on={review === "open" ? "1" : "0"} aria-pressed={review === "open"} onClick={() => setReview("open")}>{v4("dkpOpenMarks")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} aria-pressed={review === "reviewed"} onClick={() => setReview("reviewed")}>{v4("dkpReviewed")}</button>
      </div>
      <label className="c4-lab">
        <span>{v4("dkpSearch")}</span>
        <input className="c4-field" aria-label={v4("dkpSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-frm-empty">{v4("dkpEmpty")}</p>}
      <ul className="c4-dkp-rows">
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
                <p className="c4-meta">{bandName(v4, band || (slipState(row.note) === "clear" ? "blank" : ""))} · {depthName(v4, deep)} · {v4("dkpParts")} {words}</p>
              </div>
              <div className="c4-row">
                <button type="button" className="c4-btn" onClick={() => copyCode(row)}>{copied === row.id ? v4("dkpCopied") : v4("dkpCopy")}</button>
                <button type="button" className="c4-btn" aria-pressed={seen} onClick={() => storeReview(toggleReview(reviewed, row.id, presentIds))}>{v4("dkpReview")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
