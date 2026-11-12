"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  DNT_DENSITY_KEY,
  DNT_KEY,
  DNT_VIEW_KEY,
  VOUS_KEY,
  VOUS_REVIEW_KEY,
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
} from "@/lib/crmv4/round225";
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

const PIGMENTS = ["slate", "ivory", "honey"] as const;
const CADENCES = ["still", "walk", "rush"] as const;
const LANES = ["crown", "springer", "haunch"] as const;

function pigmentLabel(v4: V4, pigment: string): string {
  if (pigment === "slate" || pigment === "SLATE") return v4("dntSlate");
  if (pigment === "ivory" || pigment === "IVORY") return v4("dntIvory");
  if (pigment === "honey" || pigment === "HONEY") return v4("dntHoney");
  return v4("dntBlankFinish");
}

function cadenceLabel(v4: V4, cadence: string): string {
  if (cadence === "still") return v4("dntStill");
  if (cadence === "walk") return v4("dntWalk");
  if (cadence === "rush") return v4("dntRush");
  return v4("dntBlankTempo");
}

function bellLabel(v4: V4, bell: number | null): string {
  if (bell === 4) return v4("dntWick4");
  if (bell === 12) return v4("dntWick12");
  if (bell === 24) return v4("dntWick24");
  return v4("dntBlankWick");
}

function laneLabel(v4: V4, name: string): string {
  if (name === "crown") return v4("vousCrown");
  if (name === "springer") return v4("vousSpringer");
  if (name === "haunch") return v4("vousHaunch");
  if (name === "blank") return v4("vousClear");
  return v4("vousUnmarked");
}

function toneLabel(v4: V4, name: string): string {
  if (name === "dawn") return v4("vousDawn");
  if (name === "noon") return v4("vousNoon");
  if (name === "dusk") return v4("vousDusk");
  if (name === "hush") return v4("vousHush");
  if (name === "mist") return v4("vousMist");
  return v4("vousUnmarked");
}

function auditLabel(v4: V4, audit: string): string {
  const key = {
    save: "dntAuditSave",
    edit: "dntAuditEdit",
    note: "dntAuditNote",
    cadence: "dntAuditCadence",
    pin: "dntAuditPin",
    unpin: "dntAuditUnpin",
    hold: "dntAuditHold",
    resume: "dntAuditResume",
    archive: "dntAuditArchive",
    open: "dntAuditOpen",
    pigment: "dntAuditFinish",
    tag: "dntAuditTag",
    weight: "dntAuditGauge",
    bell: "dntAuditWick",
    proof: "dntAuditSeal",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, span: number | null, desk: string): string {
  const gap = spanGap(span, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("dntPast")} ${gap}`;
  if (gap < 0) return `${v4("dntAhead")} ${Math.abs(gap)}`;
  return v4("dntDue");
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

export function DentilTiles({ v4 }: { v4: V4 }) {
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
  const [movePigment, setMovePigment] = useState("slate");
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
    const next = readCards(readJson(DNT_KEY, []));
    const saved = readCardViews(readJson(DNT_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    setDensity(densityOf(readJson(DNT_DENSITY_KEY, "airy")));
    writeJson(DNT_KEY, next);
    writeJson(DNT_VIEW_KEY, saved);
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
    writeJson(DNT_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((card) => card.id === id)));
  }
  function storeViews(next: CardView[]) {
    const saved = readCardViews(next);
    setViews(saved);
    writeJson(DNT_VIEW_KEY, saved);
  }
  function storeDensity(next: CardDensity) {
    setDensity(next);
    writeJson(DNT_DENSITY_KEY, next);
  }
  const keepers = cardKeepers(cards);
  const pigments = cardPigments(cards);
  const bars = PIGMENTS.map((item) => ({ pigment: item.toUpperCase(), count: cards.filter((card) => card.pigment === item.toUpperCase()).length })).filter((row) => row.count > 0);
  const keeperOn = activeKeeper(keeperFilter, keepers);
  const pigmentOn = activePigment(pigmentFilter, ["SLATE", "IVORY", "HONEY", ...pigments]);
  const cadenceOn = activeCadence(cadenceFilter, ["still", "walk", "rush"]);
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
      if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        titleRef.current?.focus();
        return;
      }
      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        pinRef.current();
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        bellRef.current();
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        holdRef.current();
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        cadenceRef.current();
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        proofRef.current();
        return;
      }
      if (event.key === "g" || event.key === "G") {
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
    <section className="c4-dnt" aria-label={v4("dntTitle")} data-tiles="1" data-role={role} data-density={density}>
      <div className="c4-dnt-sheet">
        <header className="c4-dnt-mast">
          <p className="c4-dnt-plate" data-logo="mono">{v4("dntLogo")}</p>
          <div>
            <p className="c4-dnt-kicker">{v4("dntSub")}</p>
            <h2 className="c4-title">{v4("dntTitle")}</h2>
          </div>
        </header>
        <p className="c4-dnt-time">{v4("dntLocal")}</p>
        <p className="c4-dnt-rules">{v4("dntHint")}</p>
        <p className="c4-meta">{v4("dntNew")} {v4("dntSlash")} {v4("dntEscape")} {v4("dntKeys")} {v4("dntPinKey")} {v4("dntBellKey")} {v4("dntHoldKey")} {v4("dntCadenceKey")} {v4("dntProofKey")} {v4("dntBoardKey")}</p>
        {viewer && <p className="c4-dnt-notice" data-viewer="1">{v4("dntViewer")}</p>}
        {counts.peak > 0 && (
          <p className="c4-dnt-notice" role="status">
            {v4("dntNotice")} · {counts.peak}
            <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("dntNoticeAll") : v4("dntNoticePeak")}</button>
          </p>
        )}
        {counts.late > 0 && <p className="c4-dnt-notice" role="status">{v4("dntLateNotice")} · {counts.late}</p>}
        <ol className="c4-dnt-kpis" aria-label={v4("dntKpi")}>
          <li><span>{v4("dntOpen")}</span><strong>{counts.open}</strong></li>
          <li><span>{v4("dntHeld")}</span><strong>{counts.held}</strong></li>
          <li><span>{v4("dntArchived")}</span><strong>{counts.archived}</strong></li>
          <li><span>{v4("dntPinned")}</span><strong>{counts.pinned}</strong></li>
          <li><span>{v4("dntPeak")}</span><strong>{counts.peak}</strong></li>
          <li><span>{v4("dntLate")}</span><strong>{counts.late}</strong></li>
          <li><span>{v4("dntSoon")}</span><strong>{counts.soon}</strong></li>
          <li><span>{v4("dntWeight")}</span><strong>{counts.weight}</strong></li>
          <li><span>{v4("dntMatched")}</span><strong>{matched}</strong></li>
          <li><span>{v4("dntProof")}</span><strong>{counts.proof}</strong></li>
          <li><span>{v4("dntCooling")}</span><strong>{counts.cooling}</strong></li>
        </ol>
        <div className="c4-dnt-meter" aria-label={v4("dntLateShare")}>
          <span>{v4("dntHouseShare")} {cardShare(houseOpen, openCount)}%</span>
          <span>{v4("dntLateShare")} {share}%</span>
          <i style={{ width: `${share}%` }} />
        </div>
        <ol className="c4-dnt-bars" aria-label={v4("dntPigments")}>
          {bars.map((bar) => (
            <li key={bar.pigment}>
              <span>{pigmentLabel(v4, bar.pigment)}</span>
              <b style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
              <em>{bar.count}</em>
            </li>
          ))}
        </ol>
        {!cards.length && <p className="c4-dnt-empty">{v4("dntEmpty")}</p>}
        <div className="c4-dnt-suggest">
          <p>{v4("dntSuggestPigment")}: {pigmentLabel(v4, suggestedPigment)}</p>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => setPigment(suggestedPigment.toLowerCase())}>{v4("dntUsePigment")}</button>
          <p>{suggestedName ? `${v4("dntSuggestKeeper")}: ${suggestedName}` : v4("dntBlankKeeper")}</p>
          <button type="button" className="c4-btn" disabled={viewer || !suggestedName} onClick={() => setKeeper(suggestedName)}>{v4("dntUseKeeper")}</button>
          <p>{v4("dntSuggestBell")}: {bellLabel(v4, suggestedBell)}</p>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => setBellValue(String(suggestedBell))}>{v4("dntUseBell")}</button>
          <p>{v4("dntAssign")}: {fair || v4("dntBlankKeeper")}</p>
          <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setKeeper(fair)}>{v4("dntUseKeeper")}</button>
        </div>
        <ul className="c4-dnt-facts">
          <li>{v4("dntSpans")}: {usedSpans(cards)}</li>
          <li>{clashes ? `${v4("dntClash")} ${clashes}` : v4("dntClashNone")}</li>
          <li>{bells ? `${v4("dntBellClash")} ${bells}` : v4("dntBellClashNone")}</li>
          <li>{neighbors ? `${v4("dntAdjacent")} ${neighbors}` : v4("dntAdjacentNone")}</li>
          <li>{pairKeeperCount(cards) ? `${v4("dntPairs")} ${pairKeeperCount(cards)}` : v4("dntPairsNone")}</li>
          <li>{sharedPigmentCount(cards) ? `${v4("dntSharedPigment")} ${sharedPigmentCount(cards)}` : v4("dntSharedPigmentNone")}</li>
          <li>{v4("dntWeightLoad")}: {weightLoad(cards)}</li>
          <li>{v4("dntQuietGallery")}: {quietGalleryCount(cards)}</li>
          <li>{v4("dntSurgeLoad")}: {surgeLoad(cards)}</li>
          <li>{v4("dntSpanWidth")}: {spanWidth(cards)}</li>
          <li>{nextTitle ? `${v4("dntNext")}: ${nextTitle}` : v4("dntNextNone")}</li>
          <li>{busy ? `${v4("dntBusiest")}: ${busy}` : v4("dntBusiestNone")}</li>
          <li>{v4("dntWindow")}: {windowRows.length}</li>
        </ul>
        <section className="c4-dnt-reminders" aria-label={v4("dntReminders")}>
          <h3>{v4("dntReminders")}</h3>
          {!reminders.length && <p className="c4-dnt-empty">{v4("dntReminderEmpty")}</p>}
          <ul>
            {reminders.map((card) => (
              <li key={card.id}>{card.title} · {lateCard(card, deskSpan) ? v4("dntLate") : v4("dntSoon")}</li>
            ))}
          </ul>
        </section>
        <section className="c4-dnt-cooling" aria-label={v4("dntCooling")}>
          <h3>{v4("dntCooling")}</h3>
          {!cooling.length && <p className="c4-dnt-empty">{v4("dntCoolingEmpty")}</p>}
          <ul>
            {cooling.map((card) => (
              <li key={card.id}>{card.title} · {card.span}</li>
            ))}
          </ul>
        </section>
        <form className="c4-dnt-form" onSubmit={(event) => {
          event.preventDefault();
          if (viewer) return;
          store(addCard(cards, {
            id: `dnt-${Date.now()}`,
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
          <input ref={titleRef} className="c4-field" aria-label={v4("dntTitle")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} />
          <input className="c4-field" aria-label={v4("dntNote")} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} />
          <input className="c4-field" aria-label={v4("dntKeeper")} value={keeper} disabled={viewer} onChange={(event) => setKeeper(event.target.value)} />
          <input className="c4-field" aria-label={v4("dntSpan")} inputMode="numeric" value={span} disabled={viewer} onChange={(event) => setSpan(event.target.value)} />
          <select className="c4-select" aria-label={v4("dntPigment")} value={pigment} disabled={viewer} onChange={(event) => setPigment(event.target.value)}>
            <option value="">{v4("dntBlankPigment")}</option>
            {PIGMENTS.map((item) => <option key={item} value={item}>{pigmentLabel(v4, item)}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("dntCadence")} value={cadence} disabled={viewer} onChange={(event) => setCadence(event.target.value)}>
            <option value="">{v4("dntBlankCadence")}</option>
            {CADENCES.map((item) => <option key={item} value={item}>{cadenceLabel(v4, item)}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("dntBell")} value={bellValue} disabled={viewer} onChange={(event) => setBellValue(event.target.value)}>
            <option value="">{v4("dntBlankBell")}</option>
            <option value="4">{v4("dntWick4")}</option>
            <option value="12">{v4("dntWick12")}</option>
            <option value="24">{v4("dntWick24")}</option>
          </select>
          <select className="c4-select" aria-label={v4("dntWeight")} value={weight} disabled={viewer} onChange={(event) => setWeight(event.target.value)}>
            <option value="">{v4("dntResting")}</option>
            <option value="1">1</option>
            <option value="3">3</option>
            <option value="5">5</option>
          </select>
          <input className="c4-field" aria-label={v4("dntTag")} value={tag} disabled={viewer} onChange={(event) => setTag(event.target.value)} />
          <button type="submit" className="c4-btn c4-btn-hot" disabled={viewer}>{v4("dntSave")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetCards())}>{v4("dntReset")}</button>
        </form>
        <div className="c4-dnt-tools">
          <input ref={searchRef} className="c4-field" aria-label={v4("dntSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
          <input className="c4-field" aria-label={v4("dntDesk")} inputMode="numeric" value={deskSpan} onChange={(event) => setDeskSpan(event.target.value)} />
          <input className="c4-field" aria-label={v4("dntRoster")} value={roster} disabled={viewer} onChange={(event) => setRoster(event.target.value)} />
          <select className="c4-select" aria-label={v4("dntTrayOpen")} value={tray} onChange={(event) => setTray(event.target.value as CardTray)}>
            <option value="open">{v4("dntTrayOpen")}</option>
            <option value="held">{v4("dntTrayHeld")}</option>
            <option value="archived">{v4("dntTrayArchived")}</option>
          </select>
          <select className="c4-select" aria-label={v4("dntKeeper")} value={keeperOn} onChange={(event) => setKeeperFilter(event.target.value)}>
            <option value="all">{v4("dntAll")}</option>
            <option value="blank">{v4("dntBlank")}</option>
            {keepers.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("dntPigment")} value={pigmentOn} onChange={(event) => setPigmentFilter(event.target.value)}>
            <option value="all">{v4("dntAll")}</option>
            <option value="blank">{v4("dntBlankPigment")}</option>
            {PIGMENTS.map((item) => <option key={item} value={item}>{pigmentLabel(v4, item)}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("dntCadence")} value={cadenceOn} onChange={(event) => setCadenceFilter(event.target.value)}>
            <option value="all">{v4("dntAll")}</option>
            <option value="blank">{v4("dntBlankCadence")}</option>
            {CADENCES.map((item) => <option key={item} value={item}>{cadenceLabel(v4, item)}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("dntSpan")} value={spanOn} onChange={(event) => setSpanFilter(event.target.value)}>
            <option value="all">{v4("dntAll")}</option>
            <option value="blank">{v4("dntBlank")}</option>
            <option value="early">{v4("dntEarly")}</option>
            <option value="mid">{v4("dntMid")}</option>
            <option value="late">{v4("dntLateBand")}</option>
            <option value="peak">{v4("dntPeakPick")}</option>
            <option value="quiet">{v4("dntQuiet")}</option>
            {["1", "2", "3", "4", "5"].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("dntBell")} value={bellOn} onChange={(event) => setBellFilter(event.target.value)}>
            <option value="all">{v4("dntAll")}</option>
            <option value="blank">{v4("dntBlankBell")}</option>
            <option value="4">4</option>
            <option value="12">12</option>
            <option value="24">24</option>
          </select>
          <select className="c4-select" aria-label={v4("dntWeight")} value={weightOn} onChange={(event) => setWeightFilter(event.target.value)}>
            <option value="all">{v4("dntAll")}</option>
            <option value="blank">{v4("dntResting")}</option>
            <option value="1">1</option>
            <option value="3">3</option>
            <option value="5">5</option>
          </select>
          <button type="button" className="c4-chip" data-on={surgeOnly ? "1" : "0"} onClick={() => setSurgeOnly((on) => !on)}>{v4("dntRush")}</button>
          <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((on) => !on)}>{v4("dntHouseShare")}</button>
          <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((on) => !on)}>{v4("dntQuiet")}</button>
          <button type="button" className="c4-chip" data-on={restingOnly ? "1" : "0"} onClick={() => setRestingOnly((on) => !on)}>{v4("dntResting")}</button>
          <button type="button" className="c4-chip" data-on={order === "keeper" ? "1" : "0"} onClick={() => setOrder((mode) => (mode === "span" ? "keeper" : "span"))}>{order === "keeper" ? v4("dntSortKeeper") : v4("dntSortSpan")}</button>
          <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "airy" ? "tight" : "airy")}>{density === "tight" ? v4("dntDensityTight") : v4("dntDensityAiry")}</button>
          <button type="button" className="c4-chip" data-on={board === "ledger" ? "1" : "0"} onClick={() => setBoard((current) => (current === "gallery" ? "ledger" : "gallery"))}>{board === "ledger" ? v4("dntBoardLedger") : v4("dntBoardGallery")}</button>
        </div>
        <form className="c4-dnt-views" onSubmit={(event) => {
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
          <input className="c4-field" aria-label={v4("dntViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
          <button type="submit" className="c4-btn" disabled={viewer}>{v4("dntSaveView")}</button>
          {views.map((view) => (
            <span key={view.id}>
              <button type="button" className="c4-chip" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropCardView(views, view.id))}>{v4("dntDropView")}</button>
            </span>
          ))}
        </form>
        <div className="c4-dnt-bulk">
          <select className="c4-select" aria-label={v4("dntBulkPigment")} value={movePigment} disabled={viewer} onChange={(event) => setMovePigment(event.target.value)}>
            {PIGMENTS.map((item) => <option key={item} value={item}>{pigmentLabel(v4, item)}</option>)}
          </select>
          <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCardPigment(cards, picked, movePigment))}>{v4("dntBulkPigment")}</button>
          <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCardPin(cards, picked, true))}>{v4("dntBulkPin")}</button>
          <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCardArchive(cards, picked, true))}>{v4("dntBulkArchive")}</button>
          <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCardCadence(cards, picked, "rush"))}>{v4("dntBulkCadence")}</button>
          <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCardTag(cards, picked, "x"))}>{v4("dntBulkTag")}</button>
          <button type="button" className="c4-btn" onClick={() => download("dentil-tiles.csv", cardsCsv(cards, deskSpan))}>{v4("dntCsv")}</button>
        </div>
        <ol className="c4-dnt-list" data-board={board}>
          {rows.map((card, index) => {
            const on = index === focus && board === "gallery";
            return (
              <li key={card.id} data-focus={on ? "1" : "0"} data-proof={card.proof ? "1" : "0"} data-peak={peakSpan(card.span) ? "1" : "0"} data-quiet={quietSpan(card.span) ? "1" : "0"} data-cooling={coolingCard(card) ? "1" : "0"}>
                <label className="c4-row">
                  <input type="checkbox" checked={picked.includes(card.id)} disabled={viewer} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                  {editing === card.id ? (
                    <input className="c4-field" aria-label={v4("dntEdit")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} onBlur={() => { if (!viewer) store(editCard(cards, card.id, draft)); setEditing(""); }} />
                  ) : (
                    <button type="button" className="c4-dnt-title" onClick={() => { setFocus(index); setEditing(card.id); setDraft(card.title); setNoteDraft(card.note); }}>{card.title}</button>
                  )}
                </label>
                <input className="c4-field" aria-label={v4("dntEditNote")} value={editing === `${card.id}-note` ? noteDraft : card.note} disabled={viewer} onFocus={() => { setEditing(`${card.id}-note`); setNoteDraft(card.note); }} onChange={(event) => setNoteDraft(event.target.value)} onBlur={() => { if (!viewer) store(editCardNote(cards, card.id, noteDraft)); setEditing(""); }} />
                <span>{card.keeper || v4("dntBlankKeeper")}</span>
                <span>{card.span ?? v4("dntBlank")}</span>
                <span>{pigmentLabel(v4, card.pigment)}</span>
                <span>{cadenceLabel(v4, card.cadence)}</span>
                <span>{bellLabel(v4, card.bell)}</span>
                <span>{card.weight}</span>
                <span>{card.tags.join(" ")}</span>
                <span>{gapLabel(v4, card.span, deskSpan)}</span>
                <span>{auditLabel(v4, card.audit)}</span>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCardPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("dntUnpin") : v4("dntPin")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(snoozeCard(cards, card.id))}>{v4("dntBell")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCardHold(cards, card.id, !card.held))}>{card.held ? v4("dntResume") : v4("dntHold")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleCadence(cards, card.id))}>{v4("dntCadence")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCardProof(cards, card.id, !card.proof))}>{card.proof ? v4("dntUnproof") : v4("dntProof")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCardArchive(cards, card.id, !card.archived))}>{card.archived ? v4("dntRestore") : v4("dntArchive")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addCardTag(cards, card.id, "y"))}>{v4("dntTag")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCardWeight(cards, card.id, card.weight === 5 ? "1" : card.weight === 3 ? "5" : "3"))}>{v4("dntWeight")}</button>
                <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(cardCopy(card, deskSpan)); setCopied(card.id); }}>{copied === card.id ? v4("dntCopied") : v4("dntCopy")}</button>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

export function VoussoirMarks({ base, v4 }: { base: string; v4: V4 }) {
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
    const nextHidden = readHiddenLanes(readJson(VOUS_KEY, []), present);
    const nextReviewed = readReviewedQuoins(readJson(VOUS_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(VOUS_KEY, nextHidden);
    writeJson(VOUS_REVIEW_KEY, nextReviewed);
  }, [rows]);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setQuery("");
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "/") {
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
    writeJson(VOUS_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedQuoins(next, ids);
    setReviewed(saved);
    writeJson(VOUS_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-vous" aria-label={v4("vousTitle")} data-voussoirs="1" data-role={role} data-keyed={course ? "1" : "0"}>
      <div className="c4-vous-sheet">
        <header className="c4-vous-mast">
          <p className="c4-vous-plate" data-logo="mono">{v4("vousLogo")}</p>
          <div>
            <p className="c4-vous-kicker">{v4("vousSub")}</p>
            <h2 className="c4-title">{v4("vousTitle")}</h2>
          </div>
        </header>
        <p className="c4-vous-time">{v4("vousKept")}</p>
        <div className="c4-vous-body">
          <p className="c4-vous-rules">{v4("vousHint")}</p>
          <p className="c4-meta">{v4("vousEscape")}</p>
          {viewer && <p className="c4-vous-notice" data-viewer="1">{v4("vousViewer")}</p>}
          {data.error && <p className="c4-vous-empty" role="alert">{v4("vousFailed")}</p>}
          {data.loading && <p className="c4-meta">{v4("vousLoading")}</p>}
          {!data.loading && !rows.length && <p className="c4-vous-empty">{v4("vousEmpty")}</p>}
          {shared > 0 && <p className="c4-vous-notice" role="status">{v4("vousNotice")} · {shared}</p>}
          <ol className="c4-vous-ledger" aria-label={v4("vousKpi")}>
            <li><span>{v4("vousSet")}</span><strong>{known}</strong></li>
            <li><span>{v4("vousClear")}</span><strong>{rows.filter((row) => quoinState(row.note) === "clear").length}</strong></li>
            <li><span>{v4("vousCourse")}</span><strong>{course}</strong></li>
            <li><span>{v4("vousWide")}</span><strong>{wideQuoinCount(rows)}</strong></li>
            <li><span>{v4("vousDawn")}</span><strong>{stoneQuoinCount(rows)}</strong></li>
            <li><span>{v4("vousOpen")}</span><strong>{openQuoinCount(rows)}</strong></li>
            <li><span>{v4("vousShut")}</span><strong>{shutQuoinCount(rows)}</strong></li>
            <li><span>{v4("vousShare")}</span><strong>{quoinShare(course, Math.max(1, known))}%</strong></li>
          </ol>
          <p className="c4-meta">{v4("vousLead")}: {laneLabel(v4, lead)} · {v4("vousToneLead")}: {toneLabel(v4, toneLead)}</p>
          <ol className="c4-vous-index" aria-label={v4("vousKpi")}>
            {bars.map((bar) => (
              <li key={bar.lane} data-tone={bar.lane === "crown" ? "gold" : bar.lane === "springer" ? "ink" : "ivory"}>
                <span>{laneLabel(v4, bar.lane)}</span>
                <b style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
                <em>{bar.count}</em>
              </li>
            ))}
          </ol>
          <div className="c4-vous-tools">
            <input ref={searchRef} className="c4-field" aria-label={v4("vousSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
            <select className="c4-select" aria-label={v4("vousCrown")} value={laneOn} onChange={(event) => setLane(event.target.value)}>
              <option value="all">{v4("vousAll")}</option>
              {present.map((name) => <option key={name} value={name}>{laneLabel(v4, name)}</option>)}
            </select>
            <select className="c4-select" aria-label={v4("vousDawn")} value={toneOn} onChange={(event) => setTone(event.target.value)}>
              <option value="all">{v4("vousAll")}</option>
              <option value="dawn">{v4("vousDawn")}</option>
              <option value="noon">{v4("vousNoon")}</option>
              <option value="dusk">{v4("vousDusk")}</option>
              <option value="hush">{v4("vousHush")}</option>
              <option value="mist">{v4("vousMist")}</option>
            </select>
            <select className="c4-select" aria-label={v4("vousReviewed")} value={review} onChange={(event) => setReview(event.target.value as QuoinReview)}>
              <option value="all">{v4("vousAll")}</option>
              <option value="reviewed">{v4("vousReviewed")}</option>
              <option value="fresh">{v4("vousFresh")}</option>
            </select>
            <select className="c4-select" aria-label={v4("vousShapeAll")} value={shape} onChange={(event) => setShape(event.target.value as QuoinShape)}>
              <option value="all">{v4("vousShapeAll")}</option>
              <option value="course">{v4("vousShapeCourse")}</option>
              <option value="wide">{v4("vousShapeWide")}</option>
              <option value="open">{v4("vousShapeOpen")}</option>
              <option value="shut">{v4("vousShapeShut")}</option>
            </select>
            <button type="button" className="c4-btn" onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("vousHide") : v4("vousShow")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkQuoinReview(reviewed, shown.map((row) => row.id), true))}>{v4("vousBulkReview")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkQuoinReview(reviewed, shown.map((row) => row.id), false))}>{v4("vousBulkClear")}</button>
            <button type="button" className="c4-btn" onClick={() => download("voussoir-lanes.csv", quoinsCsv(rows))}>{v4("vousCsv")}</button>
            <button type="button" className="c4-btn" onClick={() => download("voussoir-rows.csv", quoinRowsCsv(rows, reviewed))}>{v4("vousRowCsv")}</button>
            <Link href={crmv4Href(base, "logs")}>{v4("vousLogs")}</Link>
          </div>
          <ul className="c4-vous-lanes">
            {LANES.map((name) => (
              <li key={name}>
                <button type="button" className="c4-chip" data-on={hidden.includes(name) ? "1" : "0"} disabled={viewer || !present.includes(name)} onClick={() => storeHidden(toggleQuoin(hidden, name))}>{laneLabel(v4, name)}</button>
              </li>
            ))}
          </ul>
          <ol className="c4-vous-book">
            {shown.map((row) => (
              <li key={row.id} data-keyed={coursedQuoin(row.note) ? "1" : "0"} data-wide={wideQuoin(row.note) ? "1" : "0"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"}>
                <Link href={crmv4Href(base, "logs")}>{row.label}</Link>
                <span>{markOf(row.note)}</span>
                <span>{laneLabel(v4, quoinLane(row.note))}</span>
                <span>{toneLabel(v4, quoinTone(row.note))}</span>
                <span>{v4("vousStep")} {quoinStep(row.note)}</span>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleQuoinReview(reviewed, row.id))}>{v4("vousReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(quoinCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("vousCopied") : v4("vousCopy")}</button>
              </li>
            ))}
          </ol>
          <p className="c4-vous-rules">{v4("vousRules")} · {v4("vousCourseMark")}</p>
        </div>
      </div>
    </section>
  );
}
