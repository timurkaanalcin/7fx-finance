"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  ALV_DENSITY_KEY,
  ALV_KEY,
  ALV_VIEW_KEY,
  PSP_KEY,
  PSP_REVIEW_KEY,
  activeBay,
  activeCloth,
  activeSpan,
  activeStampLane,
  activeStampTone,
  activeSteward,
  activeTempo,
  activeWeight,
  addAlcove,
  addAlcoveTag,
  addAlcoveView,
  adjacentAlcoveCount,
  alcoveCloths,
  alcoveCopy,
  alcoveCounts,
  alcoveDensity,
  alcoveIndex,
  alcoveShare,
  alcoveStewards,
  alcoveTimeline,
  alcovesCsv,
  bayArg,
  bayGap,
  bayWidth,
  bulkAlcoveArchive,
  bulkAlcoveCloth,
  bulkAlcovePin,
  bulkAlcoveTag,
  bulkAlcoveTempo,
  bulkStampReview,
  busiestSteward,
  cipherStampCount,
  clashBayCount,
  clothArg,
  coolingAlcove,
  coolingAlcoves,
  cycleTempo,
  dropAlcoveView,
  editAlcove,
  editAlcoveNote,
  fairSteward,
  gateStampCount,
  giltStampCount,
  hallStampCount,
  holdFocusedAlcove,
  houseCloth,
  joinedStamp,
  joinedStampCount,
  lateAlcove,
  lateAlcoveShare,
  leadingStamp,
  leadingStampTone,
  matchedAlcoves,
  moveAlcoveFocus,
  nextAlcove,
  pairAlcoveCount,
  peakBay,
  pinFocusedAlcove,
  presentStampLanes,
  queueStampCount,
  quietBay,
  quietHallAlcoves,
  readAlcoveViews,
  readAlcoves,
  readHiddenStamps,
  readReviewedStamps,
  reminderAlcoves,
  rushAlcoveLoad,
  sealFocusedAlcove,
  setAlcoveArchive,
  setAlcoveHold,
  setAlcovePin,
  setAlcoveSeal,
  setAlcoveWeight,
  sharedClothCount,
  sharedStampCount,
  snoozeAlcove,
  snoozeFocusedAlcove,
  sortAlcoves,
  spanArg,
  spanClashCount,
  stampCopy,
  stampLane,
  stampLaneArg,
  stampLanes,
  stampMark,
  stampRowsCsv,
  stampShare,
  stampState,
  stampStep,
  stampTone,
  stampToneArg,
  stampsCsv,
  stewardArg,
  suggestCloth,
  suggestSpan,
  suggestSteward,
  tempoArg,
  tempoFocusedAlcove,
  toggleStamp,
  toggleStampReview,
  vaultStampCount,
  visibleAlcoves,
  visibleStampLanes,
  visibleStamps,
  waxStampCount,
  weightArg,
  weightLoad,
  wideStamp,
  type AlcoveCard,
  type AlcoveDensity,
  type AlcoveSort,
  type AlcoveTray,
  type AlcoveView,
  type StampReview,
  type StampRow,
  type StampShape,
  type StampValue,
} from "@/lib/crmv4/round239";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const CLOTHS = ["linen", "wool", "velvet"] as const;
const TEMPOS = ["still", "walk", "rush"] as const;
const SPANS = ["4", "12", "24"] as const;
const WEIGHTS = ["1", "3", "6"] as const;
const BAYS = ["1", "2", "3", "4", "5", "6"] as const;

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "alvAuditSave",
  edit: "alvAuditEdit",
  note: "alvAuditNote",
  tempo: "alvAuditTempo",
  pin: "alvAuditPin",
  unpin: "alvAuditUnpin",
  hold: "alvAuditHold",
  resume: "alvAuditResume",
  archive: "alvAuditArchive",
  open: "alvAuditOpen",
  cloth: "alvAuditCloth",
  tag: "alvAuditTag",
  weight: "alvAuditWeight",
  span: "alvAuditSpan",
  seal: "alvAuditSeal",
};

type DocRow = {
  id?: string;
  name?: string | null;
  docType?: string | null;
  status?: string | null;
  trader?: string | null;
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

function clothLabel(v4: V4, cloth: string): string {
  if (cloth === "LINEN" || cloth === "linen") return v4("alvLinen");
  if (cloth === "WOOL" || cloth === "wool") return v4("alvWool");
  if (cloth === "VELVET" || cloth === "velvet") return v4("alvVelvet");
  return v4("alvBlankCloth");
}

function tempoLabel(v4: V4, tempo: string): string {
  if (tempo === "still") return v4("alvStill");
  if (tempo === "walk") return v4("alvWalk");
  if (tempo === "rush") return v4("alvRush");
  return v4("alvBlankTempo");
}

function laneLabel(v4: V4, lane: string): string {
  if (lane === "cipher") return v4("pspCipher");
  if (lane === "wax") return v4("pspWax");
  if (lane === "queue") return v4("pspQueue");
  if (lane === "gate") return v4("pspGate");
  if (lane === "vault") return v4("pspVault");
  if (lane === "hall") return v4("pspHall");
  if (lane === "blank") return v4("pspClear");
  return v4("pspUnmarked");
}

function toneLabel(v4: V4, tone: string): string {
  if (tone === "gilt") return v4("pspGilt");
  if (tone === "pale") return v4("pspPale");
  if (tone === "linen") return v4("pspLinen");
  if (tone === "ash") return v4("pspAsh");
  if (tone === "haze") return v4("pspHaze");
  return v4("pspUnmarked");
}

function gapLabel(v4: V4, bay: number | null, desk: string): string {
  const gap = bayGap(bay, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("alvPast")} ${gap}`;
  if (gap < 0) return `${v4("alvAhead")} ${Math.abs(gap)}`;
  return v4("alvDue");
}

export function AlcoveSlips({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<AlcoveCard[]>([]);
  const [views, setViews] = useState<AlcoveView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [steward, setSteward] = useState("");
  const [bay, setBay] = useState("");
  const [cloth, setCloth] = useState("");
  const [tempo, setTempo] = useState("");
  const [spanValue, setSpanValue] = useState("");
  const [weight, setWeight] = useState("");
  const [tag, setTag] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<AlcoveTray>("open");
  const [stewardFilter, setStewardFilter] = useState("all");
  const [clothFilter, setClothFilter] = useState("all");
  const [tempoFilter, setTempoFilter] = useState("all");
  const [bayFilter, setBayFilter] = useState("all");
  const [spanFilter, setSpanFilter] = useState("all");
  const [weightFilter, setWeightFilter] = useState("all");
  const [rushOnly, setRushOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [restingOnly, setRestingOnly] = useState(false);
  const [board, setBoard] = useState<"hall" | "index">("hall");
  const [order, setOrder] = useState<AlcoveSort>("bay");
  const [density, setDensity] = useState<AlcoveDensity>("airy");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [deskBay, setDeskBay] = useState("");
  const [moveCloth, setMoveCloth] = useState("velvet");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<() => void>(() => {});
  const spanRef = useRef<() => void>(() => {});
  const holdRef = useRef<() => void>(() => {});
  const tempoRef = useRef<() => void>(() => {});
  const sealRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readAlcoves(readJson(ALV_KEY, []));
    const saved = readAlcoveViews(readJson(ALV_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    setDensity(alcoveDensity(readJson(ALV_DENSITY_KEY, "airy")));
    writeJson(ALV_KEY, next);
    writeJson(ALV_VIEW_KEY, saved);
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: AlcoveCard[]) {
    const saved = readAlcoves(next);
    setCards(saved);
    writeJson(ALV_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((card) => card.id === id)));
  }
  function storeViews(next: AlcoveView[]) {
    const saved = readAlcoveViews(next);
    setViews(saved);
    writeJson(ALV_VIEW_KEY, saved);
  }
  function storeDensity(next: AlcoveDensity) {
    setDensity(next);
    writeJson(ALV_DENSITY_KEY, next);
  }
  const stewards = alcoveStewards(cards);
  const cloths = alcoveCloths(cards);
  const bars = CLOTHS.map((item) => ({ cloth: item.toUpperCase(), count: cards.filter((card) => card.cloth === item.toUpperCase()).length })).filter((row) => row.count > 0);
  const stewardOn = activeSteward(stewardFilter, stewards);
  const clothOn = activeCloth(clothFilter, ["LINEN", "WOOL", "VELVET", ...cloths]);
  const tempoOn = activeTempo(tempoFilter, ["still", "walk", "rush"]);
  const bayOn = activeBay(bayFilter);
  const spanOn = activeSpan(spanFilter);
  const weightOn = activeWeight(weightFilter);
  const pickedBay = bayArg(bayOn);
  const shown = sortAlcoves(visibleAlcoves(
    cards,
    tray,
    query,
    stewardArg(stewardOn),
    clothArg(clothOn),
    tempoArg(tempoOn),
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
  const book = alcoveIndex(cards, query);
  const timeline = alcoveTimeline(cards);
  const counts = alcoveCounts(cards, deskBay);
  const share = lateAlcoveShare(cards, deskBay);
  const matched = matchedAlcoves(cards, deskBay);
  const clashes = clashBayCount(cards);
  const spans = spanClashCount(cards);
  const neighbors = adjacentAlcoveCount(cards);
  const suggestedCloth = suggestCloth(cards);
  const suggestedName = suggestSteward(cards);
  const suggestedSpan = suggestSpan(cards);
  const fair = fairSteward(cards, roster);
  const busy = busiestSteward(cards);
  const reminders = reminderAlcoves(cards, deskBay);
  const cooling = coolingAlcoves(cards);
  const nextTitle = nextAlcove(cards, deskBay);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  pinRef.current = () => {
    if (!viewer) store(pinFocusedAlcove(cards, shown.map((card) => card.id), focus));
  };
  spanRef.current = () => {
    if (!viewer) store(snoozeFocusedAlcove(cards, shown.map((card) => card.id), focus));
  };
  holdRef.current = () => {
    if (!viewer) store(holdFocusedAlcove(cards, shown.map((card) => card.id), focus));
  };
  tempoRef.current = () => {
    if (!viewer) store(tempoFocusedAlcove(cards, shown.map((card) => card.id), focus));
  };
  sealRef.current = () => {
    if (!viewer) store(sealFocusedAlcove(cards, shown.map((card) => card.id), focus));
  };
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setTitle("");
        setNote("");
        setSteward("");
        setBay("");
        setCloth("");
        setTempo("");
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
        setFocus((index) => moveAlcoveFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveAlcoveFocus(index, shown.length, -1));
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
        tempoRef.current();
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
  function saveAlcove() {
    if (viewer) return;
    store(addAlcove(cards, {
      id: `alv-${Date.now()}`,
      title,
      note,
      steward,
      bay,
      cloth,
      tempo,
      span: spanValue,
      weight,
      tags: tag,
    }));
    setTitle("");
    setNote("");
    setTag("");
  }
  function applyView(view: AlcoveView) {
    setTray(view.tray);
    setQuery(view.query);
    setStewardFilter(view.steward || "all");
    setClothFilter(view.cloth || "all");
    setTempoFilter(view.tempo || "all");
    setBayFilter(view.bay || "all");
    setSpanFilter(view.span || "all");
    setWeightFilter(view.weight || "all");
  }
  const focused = shown[focus];
  return (
    <section className="c4-alv" aria-label={v4("alvTitle")} data-alcoves="1" data-desk="salon" data-role={role} data-board={board} data-density={density}>
      <header className="c4-alv-mast">
        <p className="c4-alv-seal" data-logo="mono">{v4("alvLogo")}</p>
        <div>
          <p className="c4-alv-kicker">{v4("alvSub")}</p>
          <h2 className="c4-title">{v4("alvTitle")}</h2>
        </div>
        <ol className="c4-alv-index" aria-label={v4("alvTitle")}>
          <li data-tone="gold">{v4("pspChampagne")}</li>
          <li data-tone="ink">{v4("pspGraphite")}</li>
          <li data-tone="wool">{v4("pspIvory")}</li>
        </ol>
        <p className="c4-alv-links">
          <Link href={crmv4Href(base, "digest")}>{v4("alvSub")}</Link>
          <Link href={crmv4Href(base, "psp")}>{v4("pspTitle")}</Link>
        </p>
      </header>
      {viewer && <p className="c4-alv-note">{v4("alvViewer")}</p>}
      <p className="c4-alv-rule">{v4("alvHint")}</p>
      <ul className="c4-alv-kpis" aria-label={v4("alvKpi")}>
        <li><span>{v4("alvOpen")}</span><strong>{counts.open}</strong></li>
        <li><span>{v4("alvHeld")}</span><strong>{counts.held}</strong></li>
        <li><span>{v4("alvArchived")}</span><strong>{counts.archived}</strong></li>
        <li><span>{v4("alvPinned")}</span><strong>{counts.pinned}</strong></li>
        <li><span>{v4("alvPeak")}</span><strong>{counts.peak}</strong></li>
        <li><span>{v4("alvLate")}</span><strong>{counts.late}</strong></li>
        <li><span>{v4("alvSame")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("alvRaised")}</span><strong>{counts.weight}</strong></li>
        <li><span>{v4("alvHouse")}</span><strong>{counts.house}</strong></li>
        <li><span>{v4("alvWindow")}</span><strong>{counts.window}</strong></li>
        <li><span>{v4("alvMatched")}</span><strong>{matched}</strong></li>
        <li><span>{v4("alvSeal")}</span><strong>{counts.seal}</strong></li>
        <li><span>{v4("alvCooling")}</span><strong>{counts.cooling}</strong></li>
      </ul>
      <div className="c4-alv-bars" aria-label={v4("alvCloths")}>
        {bars.map((bar) => (
          <div key={bar.cloth} className="c4-alv-bar" data-cloth={bar.cloth.toLowerCase()}>
            <span>{clothLabel(v4, bar.cloth)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <p className="c4-alv-meta">
        {v4("alvLateShare")} {share}% · {v4("alvSuggestCloth")} {clothLabel(v4, suggestedCloth)} · {v4("alvSuggestSpan")} {suggestedSpan} · {v4("alvSuggestSteward")} {suggestedName || v4("alvBlankSteward")} · {v4("alvAssign")} {fair || v4("alvBlankSteward")} · {busy ? `${v4("alvBusiest")} ${busy}` : v4("alvBusiestNone")} · {clashes ? `${v4("alvClash")} ${clashes}` : v4("alvClashNone")} · {v4("alvSpanClash")} {spans} · {neighbors ? `${v4("alvNeighbors")} ${neighbors}` : v4("alvNeighborsNone")} · {v4("alvLoad")} {weightLoad(cards)} · {v4("alvPair")} {pairAlcoveCount(cards)} · {v4("alvShared")} {sharedClothCount(cards)} · {v4("alvQuietHall")} {quietHallAlcoves(cards)} · {v4("alvRush")} {rushAlcoveLoad(cards)} · {v4("alvBayWidth")} {bayWidth(cards)} · {v4("alvBays")} {new Set(cards.map((card) => card.bay).filter((item) => item !== null)).size} · {nextTitle ? `${v4("alvNext")} ${nextTitle}` : v4("alvNextNone")}
      </p>
      <div className="c4-alv-tools">
        <label className="c4-lab"><span>{v4("alvTitleField")}</span><input ref={titleRef} className="c4-field" aria-label={v4("alvTitleField")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("alvNote")}</span><input className="c4-field" aria-label={v4("alvNote")} aria-required={false} value={note} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("alvSteward")}</span><input className="c4-field" aria-label={v4("alvSteward")} aria-required={false} value={steward} onChange={(event) => setSteward(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("alvDesk")}</span>
          <select className="c4-select" aria-label={v4("alvDesk")} value={bay} onChange={(event) => setBay(event.target.value)}>
            <option value="">{v4("alvBlank")}</option>
            {BAYS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("alvHouse")}</span>
          <select className="c4-select" aria-label={v4("alvHouse")} value={cloth} onChange={(event) => setCloth(event.target.value)}>
            <option value="">{v4("alvBlankCloth")}</option>
            {CLOTHS.map((item) => <option key={item} value={item}>{clothLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("alvTempo")}</span>
          <select className="c4-select" aria-label={v4("alvTempo")} value={tempo} onChange={(event) => setTempo(event.target.value)}>
            <option value="">{v4("alvBlankTempo")}</option>
            {TEMPOS.map((item) => <option key={item} value={item}>{tempoLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("alvSpan")}</span>
          <select className="c4-select" aria-label={v4("alvSpan")} value={spanValue} onChange={(event) => setSpanValue(event.target.value)}>
            <option value="">{v4("alvBlankSpan")}</option>
            {SPANS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("alvWeight")}</span>
          <select className="c4-select" aria-label={v4("alvWeight")} value={weight} onChange={(event) => setWeight(event.target.value)}>
            <option value="">{v4("alvResting")}</option>
            {WEIGHTS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("alvTag")}</span><input className="c4-field" aria-label={v4("alvTag")} aria-required={false} value={tag} onChange={(event) => setTag(event.target.value)} /></label>
        <button type="button" className="c4-btn c4-btn-hot" disabled={viewer} onClick={saveAlcove}>{v4("alvAdd")}</button>
      </div>
      <div className="c4-alv-tools">
        <label className="c4-lab"><span>{v4("alvDesk")}</span><input className="c4-field" aria-label={v4("alvDesk")} aria-required={false} value={deskBay} onChange={(event) => setDeskBay(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("alvRoster")}</span><input className="c4-field" aria-label={v4("alvRoster")} aria-required={false} value={roster} onChange={(event) => setRoster(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("alvSearch")}</span><input ref={searchRef} className="c4-field c4-alv-search" aria-label={v4("alvSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <button type="button" className="c4-btn" onClick={() => storeDensity(density === "airy" ? "tight" : "airy")}>{density === "airy" ? v4("alvDensityTight") : v4("alvDensityAiry")}</button>
        <button type="button" className="c4-btn" data-on={order === "bay" ? "1" : "0"} onClick={() => setOrder("bay")}>{v4("alvSortBay")}</button>
        <button type="button" className="c4-btn" data-on={order === "steward" ? "1" : "0"} onClick={() => setOrder("steward")}>{v4("alvSortSteward")}</button>
        <button type="button" className="c4-btn" data-on={board === "hall" ? "1" : "0"} onClick={() => setBoard("hall")}>{v4("alvBoardHall")}</button>
        <button type="button" className="c4-btn" data-on={board === "index" ? "1" : "0"} onClick={() => setBoard("index")}>{v4("alvBoardIndex")}</button>
        <button type="button" className="c4-btn" onClick={() => download("alcove-slips.csv", alcovesCsv(cards, deskBay))}>{v4("alvCsv")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("alvOpen")}>
        {(["open", "held", "archived"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("alvOpen") : item === "held" ? v4("alvHeld") : v4("alvArchived")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={rushOnly ? "1" : "0"} onClick={() => setRushOnly((value) => !value)}>{v4("alvRushOnly")}</button>
        <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((value) => !value)}>{v4("alvPeakOnly")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((value) => !value)}>{v4("alvQuietOnly")}</button>
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("alvHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={restingOnly ? "1" : "0"} onClick={() => setRestingOnly((value) => !value)}>{v4("alvRestingOnly")}</button>
      </div>
      <div className="c4-alv-tools">
        <label className="c4-lab"><span>{v4("alvSteward")}</span>
          <select className="c4-select" aria-label={v4("alvSteward")} value={stewardOn} onChange={(event) => setStewardFilter(event.target.value)}>
            <option value="all">{v4("alvAll")}</option>
            <option value="blank">{v4("alvBlankSteward")}</option>
            {stewards.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("alvHouse")}</span>
          <select className="c4-select" aria-label={v4("alvHouse")} value={clothOn} onChange={(event) => setClothFilter(event.target.value)}>
            <option value="all">{v4("alvAll")}</option>
            <option value="blank">{v4("alvBlankCloth")}</option>
            {CLOTHS.map((item) => <option key={item} value={item.toUpperCase()}>{clothLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("alvTempo")}</span>
          <select className="c4-select" aria-label={v4("alvTempo")} value={tempoOn} onChange={(event) => setTempoFilter(event.target.value)}>
            <option value="all">{v4("alvAll")}</option>
            <option value="blank">{v4("alvBlankTempo")}</option>
            {TEMPOS.map((item) => <option key={item} value={item}>{tempoLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("alvDesk")}</span>
          <select className="c4-select" aria-label={v4("alvDesk")} value={bayOn} onChange={(event) => setBayFilter(event.target.value)}>
            <option value="all">{v4("alvAll")}</option>
            <option value="blank">{v4("alvBlank")}</option>
            <option value="early">{v4("alvEarly")}</option>
            <option value="mid">{v4("alvMid")}</option>
            <option value="late">{v4("alvLate")}</option>
            <option value="peak">{v4("alvPeak")}</option>
            <option value="quiet">{v4("alvQuiet")}</option>
            {BAYS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("alvSpan")}</span>
          <select className="c4-select" aria-label={v4("alvSpan")} value={spanOn} onChange={(event) => setSpanFilter(event.target.value)}>
            <option value="all">{v4("alvAll")}</option>
            <option value="blank">{v4("alvBlankSpan")}</option>
            {SPANS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("alvWeight")}</span>
          <select className="c4-select" aria-label={v4("alvWeight")} value={weightOn} onChange={(event) => setWeightFilter(event.target.value)}>
            <option value="all">{v4("alvAll")}</option>
            <option value="blank">{v4("alvResting")}</option>
            {WEIGHTS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>
      <div className="c4-alv-tools">
        <label className="c4-lab"><span>{v4("alvView")}</span><input className="c4-field" aria-label={v4("alvView")} value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(addAlcoveView(views, { id: `view-${Date.now()}`, name: viewName, tray, query, steward: stewardOn, cloth: clothOn, tempo: tempoOn, bay: bayOn, span: spanOn, weight: weightOn }))}>{v4("alvSaveView")}</button>
        <label className="c4-lab"><span>{v4("alvHouse")}</span>
          <select className="c4-select" aria-label={v4("alvBulkCloth")} value={moveCloth} onChange={(event) => setMoveCloth(event.target.value)}>
            {CLOTHS.map((item) => <option key={item} value={item}>{clothLabel(v4, item)}</option>)}
          </select>
        </label>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkAlcoveCloth(cards, picked, moveCloth))}>{v4("alvBulkCloth")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkAlcovePin(cards, picked, true))}>{v4("alvBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkAlcoveArchive(cards, picked, true))}>{v4("alvBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkAlcoveTempo(cards, picked, "rush"))}>{v4("alvBulkTempo")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkAlcoveTag(cards, picked, "a"))}>{v4("alvBulkTag")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("alvView")}>
        {views.map((view) => (
          <span key={view.id} className="c4-chip">
            <button type="button" onClick={() => applyView(view)}>{v4("alvApply")} {view.name}</button>
            <button type="button" disabled={viewer} onClick={() => storeViews(dropAlcoveView(views, view.id))}>{v4("alvDropView")}</button>
          </span>
        ))}
      </div>
      <p className="c4-alv-keys">{v4("alvKeys")} {v4("alvEscape")} {v4("alvHoldKey")} {v4("alvSpanKey")} {v4("alvBoardKey")}</p>
      {board === "hall" ? (
        <ol className={`c4-alv-list${density === "tight" ? " is-tight" : ""}`}>
          {!shown.length && <li className="c4-alv-empty">{v4("alvEmpty")}</li>}
          {shown.map((card, index) => (
            <li key={card.id} className="c4-alv-card" data-on={focus === index ? "1" : "0"} data-late={lateAlcove(card, deskBay) ? "1" : "0"} data-cooling={coolingAlcove(card) ? "1" : "0"} data-house={houseCloth(card.cloth) ? "1" : "0"} data-peak={peakBay(card.bay) ? "1" : "0"} data-quiet={quietBay(card.bay) ? "1" : "0"}>
              <label className="c4-lab">
                <input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={(event) => setPicked((ids) => event.target.checked ? [...ids, card.id] : ids.filter((id) => id !== card.id))} />
                <button type="button" className="c4-btn" data-on={focus === index ? "1" : "0"} onClick={() => setFocus(index)}>{v4("alvFocus")}</button>
              </label>
              {editing === card.id ? (
                <label className="c4-lab"><span>{v4("alvEdit")}</span><input className="c4-field" aria-label={v4("alvEdit")} value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={() => { if (!viewer) store(editAlcove(cards, card.id, draft)); setEditing(""); }} /></label>
              ) : (
                <h3 className="c4-title">{card.title}</h3>
              )}
              <p>{card.steward || v4("alvBlankSteward")} · {card.bay ?? v4("alvBlank")} · {clothLabel(v4, card.cloth)} · {tempoLabel(v4, card.tempo)} · {card.span ?? v4("alvBlankSpan")} · {card.weight} · {card.tags.join(" ") || v4("alvBlank")} · {gapLabel(v4, card.bay, deskBay)} · {card.audit ? v4(AUDIT_KEY[card.audit] || "alvAuditSave") : ""}</p>
              {editing === `${card.id}-note` ? (
                <label className="c4-lab"><span>{v4("alvEditNote")}</span><input className="c4-field" aria-label={v4("alvEditNote")} aria-required={false} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} onBlur={() => { if (!viewer) store(editAlcoveNote(cards, card.id, noteDraft)); setEditing(""); }} /></label>
              ) : <p>{card.note}</p>}
              <div className="c4-row">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("alvEdit")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(`${card.id}-note`); setNoteDraft(card.note); }}>{v4("alvEditNote")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setAlcovePin(cards, card.id, !card.pinned))}>{card.pinned ? v4("alvUnpin") : v4("alvPin")}</button>
                <button type="button" className="c4-btn" disabled={viewer || card.archived} onClick={() => store(setAlcoveHold(cards, card.id, !card.held))}>{card.held ? v4("alvResume") : v4("alvHold")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setAlcoveArchive(cards, card.id, !card.archived))}>{card.archived ? v4("alvReopen") : v4("alvArchive")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleTempo(cards, card.id))}>{v4("alvTempo")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setAlcoveSeal(cards, card.id, !card.seal))}>{card.seal ? v4("alvUnseal") : v4("alvSeal")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(snoozeAlcove(cards, card.id))}>{v4("alvSnooze")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setAlcoveWeight(cards, card.id, card.weight === 6 ? "1" : card.weight === 3 ? "6" : "3"))}>{v4("alvWeight")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addAlcoveTag(cards, card.id, "a"))}>{v4("alvTag")}</button>
                <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(alcoveCopy(card, deskBay)); setCopied(card.id); }}>{copied === card.id ? v4("alvCopied") : v4("alvCopy")}</button>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <ol className="c4-alv-timeline">
          {!book.length && <li className="c4-alv-empty">{v4("alvEmpty")}</li>}
          {timeline.map((lane) => (
            <li key={lane.bay}><span>{lane.bay}</span><strong>{lane.titles.join(" · ")}</strong></li>
          ))}
        </ol>
      )}
      <aside className="c4-alv-side" aria-label={v4("alvReminders")}>
        <h3 className="c4-title">{v4("alvReminders")}</h3>
        {!reminders.length && <p>{v4("alvEmpty")}</p>}
        <ul>{reminders.map((card) => <li key={card.id}>{card.title} · {lateAlcove(card, deskBay) ? v4("alvLate") : v4("alvSame")}</li>)}</ul>
        <h3 className="c4-title">{v4("alvCooling")}</h3>
        {!cooling.length && <p>{v4("alvCoolingEmpty")}</p>}
        <ul>{cooling.map((card) => <li key={card.id}>{card.title}</li>)}</ul>
        {focused && <p>{v4("alvFocus")} {focused.title} · {alcoveShare(counts.house, Math.max(1, counts.open))}%</p>}
      </aside>
    </section>
  );
}

function stampNote(row: DocRow): StampValue {
  return {
    name: textField(row.trader) || textField(row.name),
    kind: textField(row.docType),
    state: textField(row.status),
  };
}

export function PassportStamps({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ documents?: DocRow[] }>("/api/admin/documents?take=24");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("all");
  const [tone, setTone] = useState("all");
  const [review, setReview] = useState<StampReview>("all");
  const [shape, setShape] = useState<StampShape>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const reviewRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  const rows = useMemo<StampRow[]>(() => {
    return (queue.data?.documents || []).map((row, index) => ({
      id: row.id ? `doc-${row.id}` : `doc-${index}`,
      label: textField(row.trader) || textField(row.name),
      note: stampNote(row),
    }));
  }, [queue.data?.documents]);
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
    const present = presentStampLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenStamps(readJson(PSP_KEY, []), present);
    const nextReviewed = readReviewedStamps(readJson(PSP_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(PSP_KEY, nextHidden);
    writeJson(PSP_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentStampLanes(rows);
  const lanes = visibleStampLanes(present, hidden, showHidden);
  const laneOn = activeStampLane(lane, present);
  const toneOn = activeStampTone(tone);
  const shown = visibleStamps(rows, stampLaneArg(laneOn), stampToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = stampState(row.note);
      const token = state === "set" ? stampLane(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return lanes.includes(token);
    });
  reviewRef.current = () => {
    const row = shown[focus];
    if (!row || viewer) return;
    const next = toggleStampReview(reviewed, row.id);
    setReviewed(next);
    writeJson(PSP_REVIEW_KEY, next);
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
        setFocus((index) => moveAlcoveFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveAlcoveFocus(index, shown.length, -1));
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
  const lead = leadingStamp(rows);
  const toneLead = leadingStampTone(rows);
  const shared = sharedStampCount(rows);
  const joined = joinedStampCount(rows);
  const bars = stampLanes(rows).filter((line) => line.lane);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  const known = rows.filter((row) => stampState(row.note) === "set").length;
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(PSP_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedStamps(next, ids);
    setReviewed(saved);
    writeJson(PSP_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-psp" aria-label={v4("pspTitle")} data-stamps="1" data-desk="salon" data-documents={queue.data?.documents?.length ? "1" : "0"} data-role={role} data-keyed={joined ? "1" : "0"}>
      <header className="c4-psp-mast">
        <p className="c4-psp-seal" data-logo="mono">{v4("pspLogo")}</p>
        <div>
          <p className="c4-psp-kicker">{v4("pspSub")}</p>
          <h2 className="c4-title">{v4("pspTitle")}</h2>
        </div>
        <ol className="c4-psp-index" aria-label={v4("pspTitle")}>
          <li data-tone="gold">{v4("pspWax")}</li>
          <li data-tone="ink">{v4("pspCipher")}</li>
          <li data-tone="wool">{v4("pspHall")}</li>
        </ol>
      </header>
      <p className="c4-psp-links">
        <Link href={crmv4Href(base, "kyc")}>{v4("pspSub")}</Link>
        <Link href={crmv4Href(base, "alv")}>{v4("alvTitle")}</Link>
        <Link href={crmv4Href(base, "glass")}>{v4("pspSalon")}</Link>
      </p>
      {viewer && <p className="c4-psp-note">{v4("pspViewer")}</p>}
      <p className="c4-psp-rule">{v4("pspHint")}</p>
      <ul className="c4-psp-kpis" aria-label={v4("pspRules")}>
        <li><span>{v4("pspSet")}</span><strong>{known}</strong></li>
        <li><span>{v4("pspClear")}</span><strong>{rows.filter((row) => stampState(row.note) === "clear").length}</strong></li>
        <li><span>{v4("pspHall")}</span><strong>{hallStampCount(rows)}</strong></li>
        <li><span>{v4("pspQueue")}</span><strong>{queueStampCount(rows)}</strong></li>
        <li><span>{v4("pspGate")}</span><strong>{gateStampCount(rows)}</strong></li>
        <li><span>{v4("pspWax")}</span><strong>{waxStampCount(rows)}</strong></li>
        <li><span>{v4("pspVault")}</span><strong>{vaultStampCount(rows)}</strong></li>
        <li><span>{v4("pspCipher")}</span><strong>{cipherStampCount(rows)}</strong></li>
        <li><span>{v4("pspGilt")}</span><strong>{giltStampCount(rows)}</strong></li>
        <li><span>{v4("pspShare")}</span><strong>{stampShare(joined, Math.max(1, known))}%</strong></li>
        <li><span>{v4("pspShared")}</span><strong>{shared}</strong></li>
      </ul>
      <div className="c4-psp-bars" aria-label={v4("pspLead")}>
        {bars.map((bar) => (
          <div key={bar.lane} className="c4-psp-bar" data-lane={bar.lane}>
            <span>{laneLabel(v4, bar.lane)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <p className="c4-psp-meta">{lead ? `${v4("pspLead")} ${laneLabel(v4, lead)}` : v4("pspEmpty")} · {toneLead ? `${v4("pspToneLead")} ${toneLabel(v4, toneLead)}` : v4("pspUnmarked")} · {v4("pspWide")} {rows.filter((row) => wideStamp(row.note)).length}</p>
      <label className="c4-lab"><span>{v4("pspSearch")}</span><input ref={searchRef} className="c4-field c4-psp-search" aria-label={v4("pspSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <div className="c4-row" role="group" aria-label={v4("pspAll")}>
        <button type="button" className="c4-chip" data-on={laneOn === "all" ? "1" : "0"} onClick={() => setLane("all")}>{v4("pspAll")}</button>
        {present.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={laneOn === item ? "1" : "0"} onClick={() => setLane(item)}>{laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("pspGilt")}>
        {(["all", "gilt", "pale", "linen", "ash", "haze"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={toneOn === item ? "1" : "0"} onClick={() => setTone(item)}>{item === "all" ? v4("pspAll") : toneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("pspShapeAll")}>
        {(["all", "join", "wide", "hall", "cipher", "wax"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>
            {item === "all" ? v4("pspShapeAll") : item === "join" ? v4("pspShapeJoin") : item === "wide" ? v4("pspShapeWide") : item === "hall" ? v4("pspShapeHall") : item === "cipher" ? v4("pspShapeCipher") : v4("pspShapeWax")}
          </button>
        ))}
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview("reviewed")}>{v4("pspReviewed")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview("fresh")}>{v4("pspUnreviewed")}</button>
        <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} onClick={() => setReview("all")}>{v4("pspAll")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("pspShow")}</button>
      </div>
      <div className="c4-row">
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" data-on={hidden.includes(item) ? "1" : "0"} onClick={() => storeHidden(toggleStamp(hidden, item))}>{v4("pspHide")} {laneLabel(v4, item)}</button>
        ))}
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkStampReview(reviewed, shown.map((row) => row.id), true))}>{v4("pspBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkStampReview(reviewed, shown.map((row) => row.id), false))}>{v4("pspBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("stamp-lanes.csv", stampsCsv(rows))}>{v4("pspCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("stamp-rows.csv", stampRowsCsv(rows, reviewed))}>{v4("pspRowCsv")}</button>
      </div>
      <p className="c4-psp-keys">{v4("alvKeys")} {v4("alvEscape")}</p>
      {!shown.length && <p className="c4-psp-empty">{queue.error ? v4("pspUnmarked") : v4("pspEmpty")}</p>}
      <ol className="c4-psp-list">
        {shown.map((row, index) => (
          <li key={row.id} className="c4-psp-card" data-on={focus === index ? "1" : "0"} data-lane={stampLane(row.note) || "blank"} data-tone={stampTone(row.note) || "blank"} data-join={joinedStamp(row.note) ? "1" : "0"} data-wide={wideStamp(row.note) ? "1" : "0"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"}>
            <span className="c4-psp-mark">{stampMark(row.note) || "—"}</span>
            <strong>{row.label || v4("pspClear")}</strong>
            <span>{laneLabel(v4, stampState(row.note) === "clear" ? "blank" : stampLane(row.note))}</span>
            <span>{toneLabel(v4, stampTone(row.note))}</span>
            <span>{v4("pspStep")} {stampStep(row.note)}</span>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleStampReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("pspReviewed") : v4("pspReview")}</button>
            <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(stampCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("pspCopied") : v4("pspCopy")}</button>
          </li>
        ))}
      </ol>
    </section>
  );
}
