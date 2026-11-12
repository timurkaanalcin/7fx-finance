"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  FRZ_DENSITY_KEY,
  FRZ_KEY,
  FRZ_VIEW_KEY,
  QMK_KEY,
  QMK_REVIEW_KEY,
  activeBell,
  activeCadence,
  activeKeeper,
  activePigment,
  activeQuoinLane,
  activeQuoinTone,
  activeSpan,
  activeWeight,
  addCard,
  addCardTag,
  addCardView,
  adjacentCardCount,
  bellArg,
  bellClashCount,
  bulkCardArchive,
  bulkCardCadence,
  bulkCardPigment,
  bulkCardPin,
  bulkCardTag,
  bulkQuoinReview,
  busiestKeeper,
  cadenceArg,
  cadenceFocused,
  cardCopy,
  cardCounts,
  cardKeepers,
  cardLedger,
  cardPigments,
  cardShare,
  cardsCsv,
  clashSpanCount,
  coolingCard,
  coolingCards,
  coursedQuoin,
  coursedQuoinCount,
  cycleCadence,
  densityOf,
  dropCardView,
  editCard,
  editCardNote,
  fairKeeper,
  holdFocused,
  housePigment,
  keeperArg,
  lateCard,
  lateShare,
  leadingQuoin,
  leadingQuoinTone,
  markOf,
  matchedCards,
  moveFocus,
  nextCard,
  pairKeeperCount,
  peakSpan,
  pigmentArg,
  pinFocused,
  presentLanes,
  proofFocused,
  quietGalleryCount,
  quietSpan,
  quoinCopy,
  quoinLane,
  quoinLaneArg,
  quoinLanes,
  quoinRowsCsv,
  quoinShare,
  quoinState,
  quoinStep,
  quoinTone,
  quoinToneArg,
  quoinsCsv,
  readCardViews,
  readCards,
  readHiddenLanes,
  readReviewedQuoins,
  reminderCards,
  resetCards,
  setCardArchive,
  setCardHold,
  setCardPin,
  setCardProof,
  setCardWeight,
  sharedMarkCount,
  sharedPigmentCount,
  shutQuoinCount,
  snoozeCard,
  snoozeFocused,
  sortCards,
  spanArg,
  spanGap,
  spanWidth,
  stoneQuoinCount,
  suggestBell,
  suggestKeeper,
  suggestPigment,
  surgeLoad,
  toggleQuoin,
  toggleQuoinReview,
  usedSpans,
  visibleCards,
  visibleQuoinLanes,
  visibleQuoins,
  weightArg,
  weightLoad,
  wideQuoin,
  wideQuoinCount,
  windowCards,
  openQuoinCount,
  type CardDensity,
  type CardSort,
  type CardTray,
  type CardView,
  type FriezeCard,
  type QuoinReview,
  type QuoinRow,
  type QuoinShape,
  type QuoinValue,
} from "@/lib/crmv4/round224";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type LogRow = {
  id: string;
  type?: string | null;
  title?: string | null;
  createdAt?: string | null;
};

type GlanceRow = QuoinRow & { id: string };

const PIGMENTS = ["graphite", "ivory", "champagne"] as const;
const CADENCES = ["hush", "pulse", "surge"] as const;
const LANES = ["quoin", "ashlar", "rubble"] as const;

function pigmentLabel(v4: V4, pigment: string): string {
  if (pigment === "graphite" || pigment === "GRAPHITE") return v4("frzGraphite");
  if (pigment === "ivory" || pigment === "IVORY") return v4("frzIvory");
  if (pigment === "champagne" || pigment === "CHAMPAGNE") return v4("frzChampagne");
  return v4("frzBlankPigment");
}

function cadenceLabel(v4: V4, cadence: string): string {
  if (cadence === "hush") return v4("frzHush");
  if (cadence === "pulse") return v4("frzPulse");
  if (cadence === "surge") return v4("frzSurge");
  return v4("frzBlankCadence");
}

function bellLabel(v4: V4, bell: number | null): string {
  if (bell === 6) return v4("frzBell6");
  if (bell === 18) return v4("frzBell18");
  if (bell === 36) return v4("frzBell36");
  return v4("frzBlankBell");
}

function laneLabel(v4: V4, name: string): string {
  if (name === "quoin") return v4("qmkQuoin");
  if (name === "ashlar") return v4("qmkAshlar");
  if (name === "rubble") return v4("qmkRubble");
  if (name === "blank") return v4("qmkClear");
  return v4("qmkUnmarked");
}

function toneLabel(v4: V4, name: string): string {
  if (name === "stone") return v4("qmkStone");
  if (name === "course") return v4("qmkCourse");
  if (name === "settle") return v4("qmkSettle");
  if (name === "hush") return v4("qmkHush");
  if (name === "mist") return v4("qmkMist");
  return v4("qmkUnmarked");
}

function auditLabel(v4: V4, audit: string): string {
  const key = {
    save: "frzAuditSave",
    edit: "frzAuditEdit",
    note: "frzAuditNote",
    cadence: "frzAuditCadence",
    pin: "frzAuditPin",
    unpin: "frzAuditUnpin",
    hold: "frzAuditHold",
    resume: "frzAuditResume",
    archive: "frzAuditArchive",
    open: "frzAuditOpen",
    pigment: "frzAuditPigment",
    tag: "frzAuditTag",
    weight: "frzAuditWeight",
    bell: "frzAuditBell",
    proof: "frzAuditProof",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, span: number | null, desk: string): string {
  const gap = spanGap(span, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("frzPast")} ${gap}`;
  if (gap < 0) return `${v4("frzAhead")} ${Math.abs(gap)}`;
  return v4("frzDue");
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
  const node = event.target as HTMLElement | null;
  if (!node) return false;
  const tag = node.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || node.isContentEditable;
}

export function FriezeCards({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<FriezeCard[]>([]);
  const [views, setViews] = useState<CardView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [keeper, setKeeper] = useState("");
  const [span, setSpan] = useState("");
  const [pigment, setPigment] = useState("");
  const [cadence, setCadence] = useState("");
  const [bellValue, setBellValue] = useState("");
  const [weight, setWeight] = useState("");
  const [tag, setTag] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<CardTray>("open");
  const [keeperFilter, setKeeperFilter] = useState("all");
  const [pigmentFilter, setPigmentFilter] = useState("all");
  const [cadenceFilter, setCadenceFilter] = useState("all");
  const [spanFilter, setSpanFilter] = useState("all");
  const [bellFilter, setBellFilter] = useState("all");
  const [weightFilter, setWeightFilter] = useState("all");
  const [surgeOnly, setSurgeOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [restingOnly, setRestingOnly] = useState(false);
  const [board, setBoard] = useState<"gallery" | "ledger">("gallery");
  const [order, setOrder] = useState<CardSort>("span");
  const [density, setDensity] = useState<CardDensity>("airy");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [deskSpan, setDeskSpan] = useState("");
  const [movePigment, setMovePigment] = useState("graphite");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<() => void>(() => {});
  const bellRef = useRef<() => void>(() => {});
  const holdRef = useRef<() => void>(() => {});
  const cadenceRef = useRef<() => void>(() => {});
  const proofRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readCards(readJson(FRZ_KEY, []));
    const saved = readCardViews(readJson(FRZ_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    setDensity(densityOf(readJson(FRZ_DENSITY_KEY, "airy")));
    writeJson(FRZ_KEY, next);
    writeJson(FRZ_VIEW_KEY, saved);
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: FriezeCard[]) {
    const saved = readCards(next);
    setCards(saved);
    writeJson(FRZ_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((card) => card.id === id)));
  }
  function storeViews(next: CardView[]) {
    const saved = readCardViews(next);
    setViews(saved);
    writeJson(FRZ_VIEW_KEY, saved);
  }
  function storeDensity(next: CardDensity) {
    setDensity(next);
    writeJson(FRZ_DENSITY_KEY, next);
  }
  const keepers = cardKeepers(cards);
  const pigments = cardPigments(cards);
  const bars = PIGMENTS.map((item) => ({ pigment: item.toUpperCase(), count: cards.filter((card) => card.pigment === item.toUpperCase()).length })).filter((row) => row.count > 0);
  const keeperOn = activeKeeper(keeperFilter, keepers);
  const pigmentOn = activePigment(pigmentFilter, ["GRAPHITE", "IVORY", "CHAMPAGNE", ...pigments]);
  const cadenceOn = activeCadence(cadenceFilter, ["hush", "pulse", "surge"]);
  const spanOn = activeSpan(spanFilter);
  const bellOn = activeBell(bellFilter);
  const weightOn = activeWeight(weightFilter);
  const pickedSpan = spanArg(spanOn);
  const shown = sortCards(visibleCards(
    cards,
    tray,
    query,
    keeperArg(keeperOn),
    pigmentArg(pigmentOn),
    cadenceArg(cadenceOn),
    pickedSpan.exact,
    pickedSpan.pick,
    bellArg(bellOn),
    weightArg(weightOn),
    surgeOnly,
    peakOnly,
    houseOnly,
    quietOnly,
    restingOnly,
  ), order);
  const ledger = cardLedger(cards, query);
  const counts = cardCounts(cards, deskSpan);
  const share = lateShare(cards, deskSpan);
  const matched = matchedCards(cards, deskSpan);
  const clashes = clashSpanCount(cards);
  const bells = bellClashCount(cards);
  const neighbors = adjacentCardCount(cards);
  const suggestedPigment = suggestPigment(cards);
  const suggestedName = suggestKeeper(cards);
  const suggestedBell = suggestBell(cards);
  const fair = fairKeeper(cards, roster);
  const busy = busiestKeeper(cards);
  const reminders = reminderCards(cards, deskSpan);
  const cooling = coolingCards(cards);
  const windowRows = windowCards(cards, deskSpan);
  const nextTitle = nextCard(cards, deskSpan);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  pinRef.current = () => {
    if (!viewer) store(pinFocused(cards, shown.map((card) => card.id), focus));
  };
  bellRef.current = () => {
    if (!viewer) store(snoozeFocused(cards, shown.map((card) => card.id), focus));
  };
  holdRef.current = () => {
    if (!viewer) store(holdFocused(cards, shown.map((card) => card.id), focus));
  };
  cadenceRef.current = () => {
    if (!viewer) store(cadenceFocused(cards, shown.map((card) => card.id), focus));
  };
  proofRef.current = () => {
    if (!viewer) store(proofFocused(cards, shown.map((card) => card.id), focus));
  };
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setTitle("");
        setNote("");
        setKeeper("");
        setSpan("");
        setPigment("");
        setCadence("");
        setBellValue("");
        setWeight("");
        setTag("");
        setQuery("");
        setEditing("");
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        titleRef.current?.focus();
        return;
      }
      if (event.key === "p" || event.key === "P") {
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
      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        cadenceRef.current();
        return;
      }
      if (event.key === "o" || event.key === "O") {
        event.preventDefault();
        proofRef.current();
        return;
      }
      if (event.key === "y" || event.key === "Y") {
        event.preventDefault();
        setBoard((current) => (current === "gallery" ? "ledger" : "gallery"));
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown.length]);
  function clearDraft() {
    setTitle("");
    setNote("");
    setKeeper("");
    setSpan("");
    setPigment("");
    setCadence("");
    setBellValue("");
    setWeight("");
    setTag("");
    setQuery("");
    setEditing("");
  }
  function applyView(view: CardView) {
    setTray(view.tray);
    setQuery(view.query);
    setKeeperFilter(view.keeper);
    setPigmentFilter(view.pigment);
    setCadenceFilter(view.cadence);
    setSpanFilter(view.span);
    setBellFilter(view.bell);
    setWeightFilter(view.weight);
  }
  const rows = board === "ledger" ? ledger : shown;
  const houseOpen = cards.filter((card) => !card.held && !card.archived && housePigment(card.pigment)).length;
  const openCount = Math.max(1, counts.open);
  return (
    <section className="c4-frz" aria-label={v4("frzTitle")} data-cards="1" data-role={role} data-density={density}>
      <div className="c4-frz-sheet">
        <header className="c4-frz-mast">
          <p className="c4-frz-plate" data-logo="mono">{v4("frzLogo")}</p>
          <div>
            <p className="c4-frz-kicker">{v4("frzSub")}</p>
            <h2 className="c4-title">{v4("frzTitle")}</h2>
          </div>
        </header>
        <p className="c4-frz-time">{v4("frzLocal")}</p>
        <p className="c4-frz-rules">{v4("frzHint")}</p>
        <p className="c4-meta">{v4("frzNew")} {v4("frzSlash")} {v4("frzEscape")} {v4("frzKeys")} {v4("frzPinKey")} {v4("frzBellKey")} {v4("frzHoldKey")} {v4("frzCadenceKey")} {v4("frzProofKey")} {v4("frzBoardKey")}</p>
        {viewer && <p className="c4-frz-notice" data-viewer="1">{v4("frzViewer")}</p>}
        {counts.peak > 0 && (
          <p className="c4-frz-notice" role="status">
            {v4("frzNotice")} · {counts.peak}
            <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("frzNoticeAll") : v4("frzNoticePeak")}</button>
          </p>
        )}
        {counts.late > 0 && <p className="c4-frz-notice" role="status">{v4("frzLateNotice")} · {counts.late}</p>}
        <ol className="c4-frz-kpis" aria-label={v4("frzKpi")}>
          <li><span>{v4("frzOpen")}</span><strong>{counts.open}</strong></li>
          <li><span>{v4("frzHeld")}</span><strong>{counts.held}</strong></li>
          <li><span>{v4("frzArchived")}</span><strong>{counts.archived}</strong></li>
          <li><span>{v4("frzPinned")}</span><strong>{counts.pinned}</strong></li>
          <li><span>{v4("frzPeak")}</span><strong>{counts.peak}</strong></li>
          <li><span>{v4("frzLate")}</span><strong>{counts.late}</strong></li>
          <li><span>{v4("frzSoon")}</span><strong>{counts.soon}</strong></li>
          <li><span>{v4("frzWeight")}</span><strong>{counts.weight}</strong></li>
          <li><span>{v4("frzMatched")}</span><strong>{matched}</strong></li>
          <li><span>{v4("frzProof")}</span><strong>{counts.proof}</strong></li>
          <li><span>{v4("frzCooling")}</span><strong>{counts.cooling}</strong></li>
        </ol>
        <div className="c4-frz-meter" aria-label={v4("frzLateShare")}>
          <span>{v4("frzHouseShare")} {cardShare(houseOpen, openCount)}%</span>
          <span>{v4("frzLateShare")} {share}%</span>
          <i style={{ width: `${share}%` }} />
        </div>
        <ol className="c4-frz-bars" aria-label={v4("frzPigments")}>
          {bars.map((bar) => (
            <li key={bar.pigment}>
              <span>{pigmentLabel(v4, bar.pigment)}</span>
              <b style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
              <em>{bar.count}</em>
            </li>
          ))}
        </ol>
        {!cards.length && <p className="c4-frz-empty">{v4("frzEmpty")}</p>}
        <div className="c4-frz-suggest">
          <p>{v4("frzSuggestPigment")}: {pigmentLabel(v4, suggestedPigment)}</p>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => setPigment(suggestedPigment.toLowerCase())}>{v4("frzUsePigment")}</button>
          <p>{suggestedName ? `${v4("frzSuggestKeeper")}: ${suggestedName}` : v4("frzBlankKeeper")}</p>
          <button type="button" className="c4-btn" disabled={viewer || !suggestedName} onClick={() => setKeeper(suggestedName)}>{v4("frzUseKeeper")}</button>
          <p>{v4("frzSuggestBell")}: {bellLabel(v4, suggestedBell)}</p>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => setBellValue(String(suggestedBell))}>{v4("frzUseBell")}</button>
          <p>{v4("frzAssign")}: {fair || v4("frzBlankKeeper")}</p>
          <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setKeeper(fair)}>{v4("frzUseKeeper")}</button>
        </div>
        <ul className="c4-frz-facts">
          <li>{v4("frzSpans")}: {usedSpans(cards)}</li>
          <li>{clashes ? `${v4("frzClash")} ${clashes}` : v4("frzClashNone")}</li>
          <li>{bells ? `${v4("frzBellClash")} ${bells}` : v4("frzBellClashNone")}</li>
          <li>{neighbors ? `${v4("frzAdjacent")} ${neighbors}` : v4("frzAdjacentNone")}</li>
          <li>{pairKeeperCount(cards) ? `${v4("frzPairs")} ${pairKeeperCount(cards)}` : v4("frzPairsNone")}</li>
          <li>{sharedPigmentCount(cards) ? `${v4("frzSharedPigment")} ${sharedPigmentCount(cards)}` : v4("frzSharedPigmentNone")}</li>
          <li>{v4("frzWeightLoad")}: {weightLoad(cards)}</li>
          <li>{v4("frzQuietGallery")}: {quietGalleryCount(cards)}</li>
          <li>{v4("frzSurgeLoad")}: {surgeLoad(cards)}</li>
          <li>{v4("frzSpanWidth")}: {spanWidth(cards)}</li>
          <li>{nextTitle ? `${v4("frzNext")}: ${nextTitle}` : v4("frzNextNone")}</li>
          <li>{busy ? `${v4("frzBusiest")}: ${busy}` : v4("frzBusiestNone")}</li>
          <li>{v4("frzWindow")}: {windowRows.length}</li>
        </ul>
        <section className="c4-frz-reminders" aria-label={v4("frzReminders")}>
          <h3>{v4("frzReminders")}</h3>
          {!reminders.length && <p className="c4-frz-empty">{v4("frzReminderEmpty")}</p>}
          <ul>
            {reminders.map((card) => (
              <li key={card.id}>{card.title} · {lateCard(card, deskSpan) ? v4("frzLate") : v4("frzSoon")}</li>
            ))}
          </ul>
        </section>
        <section className="c4-frz-cooling" aria-label={v4("frzCooling")}>
          <h3>{v4("frzCooling")}</h3>
          {!cooling.length && <p className="c4-frz-empty">{v4("frzCoolingEmpty")}</p>}
          <ul>
            {cooling.map((card) => (
              <li key={card.id}>{card.title} · {card.span}</li>
            ))}
          </ul>
        </section>
        <form className="c4-frz-form" onSubmit={(event) => {
          event.preventDefault();
          if (viewer) return;
          store(addCard(cards, {
            id: `frz-${Date.now()}`,
            title,
            note,
            keeper,
            span,
            pigment,
            cadence,
            bell: bellValue,
            weight,
            tags: tag,
          }));
          clearDraft();
        }}>
          <input ref={titleRef} className="c4-field" aria-label={v4("frzTitle")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} />
          <input className="c4-field" aria-label={v4("frzNote")} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} />
          <input className="c4-field" aria-label={v4("frzKeeper")} value={keeper} disabled={viewer} onChange={(event) => setKeeper(event.target.value)} />
          <input className="c4-field" aria-label={v4("frzSpan")} inputMode="numeric" value={span} disabled={viewer} onChange={(event) => setSpan(event.target.value)} />
          <select className="c4-select" aria-label={v4("frzPigment")} value={pigment} disabled={viewer} onChange={(event) => setPigment(event.target.value)}>
            <option value="">{v4("frzBlankPigment")}</option>
            {PIGMENTS.map((item) => <option key={item} value={item}>{pigmentLabel(v4, item)}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("frzCadence")} value={cadence} disabled={viewer} onChange={(event) => setCadence(event.target.value)}>
            <option value="">{v4("frzBlankCadence")}</option>
            {CADENCES.map((item) => <option key={item} value={item}>{cadenceLabel(v4, item)}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("frzBell")} value={bellValue} disabled={viewer} onChange={(event) => setBellValue(event.target.value)}>
            <option value="">{v4("frzBlankBell")}</option>
            <option value="6">{v4("frzBell6")}</option>
            <option value="18">{v4("frzBell18")}</option>
            <option value="36">{v4("frzBell36")}</option>
          </select>
          <select className="c4-select" aria-label={v4("frzWeight")} value={weight} disabled={viewer} onChange={(event) => setWeight(event.target.value)}>
            <option value="">{v4("frzResting")}</option>
            <option value="2">2</option>
            <option value="4">4</option>
            <option value="8">8</option>
          </select>
          <input className="c4-field" aria-label={v4("frzTag")} value={tag} disabled={viewer} onChange={(event) => setTag(event.target.value)} />
          <button type="submit" className="c4-btn c4-btn-hot" disabled={viewer}>{v4("frzSave")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetCards())}>{v4("frzReset")}</button>
        </form>
        <div className="c4-frz-tools">
          <input ref={searchRef} className="c4-field" aria-label={v4("frzSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
          <input className="c4-field" aria-label={v4("frzDesk")} inputMode="numeric" value={deskSpan} onChange={(event) => setDeskSpan(event.target.value)} />
          <input className="c4-field" aria-label={v4("frzRoster")} value={roster} disabled={viewer} onChange={(event) => setRoster(event.target.value)} />
          <select className="c4-select" aria-label={v4("frzTrayOpen")} value={tray} onChange={(event) => setTray(event.target.value as CardTray)}>
            <option value="open">{v4("frzTrayOpen")}</option>
            <option value="held">{v4("frzTrayHeld")}</option>
            <option value="archived">{v4("frzTrayArchived")}</option>
          </select>
          <select className="c4-select" aria-label={v4("frzKeeper")} value={keeperOn} onChange={(event) => setKeeperFilter(event.target.value)}>
            <option value="all">{v4("frzAll")}</option>
            <option value="blank">{v4("frzBlank")}</option>
            {keepers.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("frzPigment")} value={pigmentOn} onChange={(event) => setPigmentFilter(event.target.value)}>
            <option value="all">{v4("frzAll")}</option>
            <option value="blank">{v4("frzBlankPigment")}</option>
            {PIGMENTS.map((item) => <option key={item} value={item}>{pigmentLabel(v4, item)}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("frzCadence")} value={cadenceOn} onChange={(event) => setCadenceFilter(event.target.value)}>
            <option value="all">{v4("frzAll")}</option>
            <option value="blank">{v4("frzBlankCadence")}</option>
            {CADENCES.map((item) => <option key={item} value={item}>{cadenceLabel(v4, item)}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("frzSpan")} value={spanOn} onChange={(event) => setSpanFilter(event.target.value)}>
            <option value="all">{v4("frzAll")}</option>
            <option value="blank">{v4("frzBlank")}</option>
            <option value="early">{v4("frzEarly")}</option>
            <option value="mid">{v4("frzMid")}</option>
            <option value="late">{v4("frzLateBand")}</option>
            <option value="peak">{v4("frzPeakPick")}</option>
            <option value="quiet">{v4("frzQuiet")}</option>
            {["1", "2", "3", "4", "5", "6", "7"].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("frzBell")} value={bellOn} onChange={(event) => setBellFilter(event.target.value)}>
            <option value="all">{v4("frzAll")}</option>
            <option value="blank">{v4("frzBlankBell")}</option>
            <option value="6">6</option>
            <option value="18">18</option>
            <option value="36">36</option>
          </select>
          <select className="c4-select" aria-label={v4("frzWeight")} value={weightOn} onChange={(event) => setWeightFilter(event.target.value)}>
            <option value="all">{v4("frzAll")}</option>
            <option value="blank">{v4("frzResting")}</option>
            <option value="2">2</option>
            <option value="4">4</option>
            <option value="8">8</option>
          </select>
          <button type="button" className="c4-chip" data-on={surgeOnly ? "1" : "0"} onClick={() => setSurgeOnly((on) => !on)}>{v4("frzSurge")}</button>
          <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((on) => !on)}>{v4("frzHouseShare")}</button>
          <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((on) => !on)}>{v4("frzQuiet")}</button>
          <button type="button" className="c4-chip" data-on={restingOnly ? "1" : "0"} onClick={() => setRestingOnly((on) => !on)}>{v4("frzResting")}</button>
          <button type="button" className="c4-chip" data-on={order === "keeper" ? "1" : "0"} onClick={() => setOrder((mode) => (mode === "span" ? "keeper" : "span"))}>{order === "keeper" ? v4("frzSortKeeper") : v4("frzSortSpan")}</button>
          <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "airy" ? "tight" : "airy")}>{density === "tight" ? v4("frzDensityTight") : v4("frzDensityAiry")}</button>
          <button type="button" className="c4-chip" data-on={board === "ledger" ? "1" : "0"} onClick={() => setBoard((current) => (current === "gallery" ? "ledger" : "gallery"))}>{board === "ledger" ? v4("frzBoardLedger") : v4("frzBoardGallery")}</button>
        </div>
        <form className="c4-frz-views" onSubmit={(event) => {
          event.preventDefault();
          if (viewer) return;
          storeViews(addCardView(views, {
            id: `view-${Date.now()}`,
            name: viewName,
            tray,
            query,
            keeper: keeperOn,
            pigment: pigmentOn,
            cadence: cadenceOn,
            span: spanOn,
            bell: bellOn,
            weight: weightOn,
          }));
          setViewName("");
        }}>
          <input className="c4-field" aria-label={v4("frzViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
          <button type="submit" className="c4-btn" disabled={viewer}>{v4("frzSaveView")}</button>
          {views.map((view) => (
            <span key={view.id}>
              <button type="button" className="c4-chip" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropCardView(views, view.id))}>{v4("frzDropView")}</button>
            </span>
          ))}
        </form>
        <div className="c4-frz-bulk">
          <select className="c4-select" aria-label={v4("frzBulkPigment")} value={movePigment} disabled={viewer} onChange={(event) => setMovePigment(event.target.value)}>
            {PIGMENTS.map((item) => <option key={item} value={item}>{pigmentLabel(v4, item)}</option>)}
          </select>
          <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCardPigment(cards, picked, movePigment))}>{v4("frzBulkPigment")}</button>
          <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCardPin(cards, picked, true))}>{v4("frzBulkPin")}</button>
          <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCardArchive(cards, picked, true))}>{v4("frzBulkArchive")}</button>
          <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCardCadence(cards, picked, "surge"))}>{v4("frzBulkCadence")}</button>
          <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCardTag(cards, picked, "a"))}>{v4("frzBulkTag")}</button>
          <button type="button" className="c4-btn" onClick={() => download("frieze-cards.csv", cardsCsv(cards, deskSpan))}>{v4("frzCsv")}</button>
        </div>
        <ol className="c4-frz-list" data-board={board}>
          {rows.map((card, index) => {
            const on = index === focus && board === "gallery";
            return (
              <li key={card.id} data-focus={on ? "1" : "0"} data-proof={card.proof ? "1" : "0"} data-peak={peakSpan(card.span) ? "1" : "0"} data-quiet={quietSpan(card.span) ? "1" : "0"} data-cooling={coolingCard(card) ? "1" : "0"}>
                <label className="c4-row">
                  <input type="checkbox" checked={picked.includes(card.id)} disabled={viewer} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                  {editing === card.id ? (
                    <input className="c4-field" aria-label={v4("frzEdit")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} onBlur={() => { if (!viewer) store(editCard(cards, card.id, draft)); setEditing(""); }} />
                  ) : (
                    <button type="button" className="c4-frz-title" onClick={() => { setFocus(index); setEditing(card.id); setDraft(card.title); setNoteDraft(card.note); }}>{card.title}</button>
                  )}
                </label>
                <input className="c4-field" aria-label={v4("frzEditNote")} value={editing === `${card.id}-note` ? noteDraft : card.note} disabled={viewer} onFocus={() => { setEditing(`${card.id}-note`); setNoteDraft(card.note); }} onChange={(event) => setNoteDraft(event.target.value)} onBlur={() => { if (!viewer) store(editCardNote(cards, card.id, noteDraft)); setEditing(""); }} />
                <span>{card.keeper || v4("frzBlankKeeper")}</span>
                <span>{card.span ?? v4("frzBlank")}</span>
                <span>{pigmentLabel(v4, card.pigment)}</span>
                <span>{cadenceLabel(v4, card.cadence)}</span>
                <span>{bellLabel(v4, card.bell)}</span>
                <span>{card.weight}</span>
                <span>{card.tags.join(" ")}</span>
                <span>{gapLabel(v4, card.span, deskSpan)}</span>
                <span>{auditLabel(v4, card.audit)}</span>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCardPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("frzUnpin") : v4("frzPin")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(snoozeCard(cards, card.id))}>{v4("frzBell")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCardHold(cards, card.id, !card.held))}>{card.held ? v4("frzResume") : v4("frzHold")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleCadence(cards, card.id))}>{v4("frzCadence")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCardProof(cards, card.id, !card.proof))}>{card.proof ? v4("frzUnproof") : v4("frzProof")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCardArchive(cards, card.id, !card.archived))}>{card.archived ? v4("frzRestore") : v4("frzArchive")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addCardTag(cards, card.id, "b"))}>{v4("frzTag")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCardWeight(cards, card.id, card.weight === 8 ? "2" : card.weight === 4 ? "8" : "4"))}>{v4("frzWeight")}</button>
                <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(cardCopy(card, deskSpan)); setCopied(card.id); }}>{copied === card.id ? v4("frzCopied") : v4("frzCopy")}</button>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

export function QuoinMarks({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ communications?: LogRow[] }>("/api/admin/communications?take=40");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("all");
  const [tone, setTone] = useState("all");
  const [review, setReview] = useState<QuoinReview>("all");
  const [shape, setShape] = useState<QuoinShape>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<GlanceRow[]>(() => (data.data?.communications || []).map((row) => ({
    id: row.id,
    label: row.title || row.type || row.id,
    note: { type: row.type || "", title: row.title || "", createdAt: row.createdAt || "" } satisfies QuoinValue,
  })), [data.data?.communications]);
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
    const present = presentLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenLanes(readJson(QMK_KEY, []), present);
    const nextReviewed = readReviewedQuoins(readJson(QMK_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(QMK_KEY, nextHidden);
    writeJson(QMK_REVIEW_KEY, nextReviewed);
  }, [rows]);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setQuery("");
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "n" || event.key === "N" || event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const present = presentLanes(rows);
  const lanes = visibleQuoinLanes(present, hidden, showHidden);
  const laneOn = activeQuoinLane(lane, present);
  const toneOn = activeQuoinTone(tone);
  const shown = visibleQuoins(rows, quoinLaneArg(laneOn), quoinToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = quoinState(row.note);
      const token = state === "set" ? quoinLane(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return lanes.includes(token);
    });
  const lead = leadingQuoin(rows);
  const toneLead = leadingQuoinTone(rows);
  const shared = sharedMarkCount(rows);
  const course = coursedQuoinCount(rows);
  const bars = quoinLanes(rows).filter((line) => line.lane);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  const known = rows.filter((row) => quoinState(row.note) === "set").length;
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(QMK_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedQuoins(next, ids);
    setReviewed(saved);
    writeJson(QMK_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-qmk" aria-label={v4("qmkTitle")} data-quoins="1" data-role={role} data-course={course ? "1" : "0"}>
      <div className="c4-qmk-sheet">
        <header className="c4-qmk-mast">
          <p className="c4-qmk-plate" data-logo="mono">{v4("qmkLogo")}</p>
          <div>
            <p className="c4-qmk-kicker">{v4("qmkSub")}</p>
            <h2 className="c4-title">{v4("qmkTitle")}</h2>
          </div>
        </header>
        <p className="c4-qmk-time">{v4("qmkKept")}</p>
        <div className="c4-qmk-body">
          <p className="c4-qmk-rules">{v4("qmkHint")}</p>
          <p className="c4-meta">{v4("qmkEscape")}</p>
          {viewer && <p className="c4-qmk-notice" data-viewer="1">{v4("qmkViewer")}</p>}
          {data.error && <p className="c4-qmk-empty" role="alert">{v4("qmkFailed")}</p>}
          {data.loading && <p className="c4-meta">{v4("qmkLoading")}</p>}
          {!data.loading && !rows.length && <p className="c4-qmk-empty">{v4("qmkEmpty")}</p>}
          {shared > 0 && <p className="c4-qmk-notice" role="status">{v4("qmkNotice")} · {shared}</p>}
          <ol className="c4-qmk-ledger" aria-label={v4("qmkKpi")}>
            <li><span>{v4("qmkSet")}</span><strong>{known}</strong></li>
            <li><span>{v4("qmkClear")}</span><strong>{rows.filter((row) => quoinState(row.note) === "clear").length}</strong></li>
            <li><span>{v4("qmkCourse")}</span><strong>{course}</strong></li>
            <li><span>{v4("qmkWide")}</span><strong>{wideQuoinCount(rows)}</strong></li>
            <li><span>{v4("qmkStone")}</span><strong>{stoneQuoinCount(rows)}</strong></li>
            <li><span>{v4("qmkOpen")}</span><strong>{openQuoinCount(rows)}</strong></li>
            <li><span>{v4("qmkShut")}</span><strong>{shutQuoinCount(rows)}</strong></li>
            <li><span>{v4("qmkShare")}</span><strong>{quoinShare(course, Math.max(1, known))}%</strong></li>
          </ol>
          <p className="c4-meta">{v4("qmkLead")}: {laneLabel(v4, lead)} · {v4("qmkToneLead")}: {toneLabel(v4, toneLead)}</p>
          <ol className="c4-qmk-index" aria-label={v4("qmkKpi")}>
            {bars.map((bar) => (
              <li key={bar.lane} data-tone={bar.lane === "ashlar" ? "gold" : bar.lane === "quoin" ? "ink" : "ivory"}>
                <span>{laneLabel(v4, bar.lane)}</span>
                <b style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
                <em>{bar.count}</em>
              </li>
            ))}
          </ol>
          <div className="c4-qmk-tools">
            <input ref={searchRef} className="c4-field" aria-label={v4("qmkSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
            <select className="c4-select" aria-label={v4("qmkQuoin")} value={laneOn} onChange={(event) => setLane(event.target.value)}>
              <option value="all">{v4("qmkAll")}</option>
              {present.map((name) => <option key={name} value={name}>{laneLabel(v4, name)}</option>)}
            </select>
            <select className="c4-select" aria-label={v4("qmkStone")} value={toneOn} onChange={(event) => setTone(event.target.value)}>
              <option value="all">{v4("qmkAll")}</option>
              <option value="stone">{v4("qmkStone")}</option>
              <option value="course">{v4("qmkCourse")}</option>
              <option value="settle">{v4("qmkSettle")}</option>
              <option value="hush">{v4("qmkHush")}</option>
              <option value="mist">{v4("qmkMist")}</option>
            </select>
            <select className="c4-select" aria-label={v4("qmkReviewed")} value={review} onChange={(event) => setReview(event.target.value as QuoinReview)}>
              <option value="all">{v4("qmkAll")}</option>
              <option value="reviewed">{v4("qmkReviewed")}</option>
              <option value="fresh">{v4("qmkFresh")}</option>
            </select>
            <select className="c4-select" aria-label={v4("qmkShapeAll")} value={shape} onChange={(event) => setShape(event.target.value as QuoinShape)}>
              <option value="all">{v4("qmkShapeAll")}</option>
              <option value="course">{v4("qmkShapeCourse")}</option>
              <option value="wide">{v4("qmkShapeWide")}</option>
              <option value="open">{v4("qmkShapeOpen")}</option>
              <option value="shut">{v4("qmkShapeShut")}</option>
            </select>
            <button type="button" className="c4-btn" onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("qmkHide") : v4("qmkShow")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkQuoinReview(reviewed, shown.map((row) => row.id), true))}>{v4("qmkBulkReview")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkQuoinReview(reviewed, shown.map((row) => row.id), false))}>{v4("qmkBulkClear")}</button>
            <button type="button" className="c4-btn" onClick={() => download("quoin-marks.csv", quoinsCsv(rows))}>{v4("qmkCsv")}</button>
            <button type="button" className="c4-btn" onClick={() => download("quoin-rows.csv", quoinRowsCsv(rows, reviewed))}>{v4("qmkRowCsv")}</button>
            <Link href={crmv4Href(base, "logs")}>{v4("qmkLogs")}</Link>
          </div>
          <ul className="c4-qmk-lanes">
            {LANES.map((name) => (
              <li key={name}>
                <button type="button" className="c4-chip" data-on={hidden.includes(name) ? "1" : "0"} disabled={viewer || !present.includes(name)} onClick={() => storeHidden(toggleQuoin(hidden, name))}>{laneLabel(v4, name)}</button>
              </li>
            ))}
          </ul>
          <ol className="c4-qmk-book">
            {shown.map((row) => (
              <li key={row.id} data-course={coursedQuoin(row.note) ? "1" : "0"} data-wide={wideQuoin(row.note) ? "1" : "0"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"}>
                <Link href={crmv4Href(base, "logs")}>{row.label}</Link>
                <span>{markOf(row.note)}</span>
                <span>{laneLabel(v4, quoinLane(row.note))}</span>
                <span>{toneLabel(v4, quoinTone(row.note))}</span>
                <span>{v4("qmkStep")} {quoinStep(row.note)}</span>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleQuoinReview(reviewed, row.id))}>{v4("qmkReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(quoinCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("qmkCopied") : v4("qmkCopy")}</button>
              </li>
            ))}
          </ol>
          <p className="c4-qmk-rules">{v4("qmkRules")} · {v4("qmkCourseMark")}</p>
        </div>
      </div>
    </section>
  );
}
