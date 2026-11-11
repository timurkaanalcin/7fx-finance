"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  ORC_DENSITY_KEY,
  ORC_KEY,
  ORC_VIEW_KEY,
  VSL_KEY,
  VSL_REVIEW_KEY,
  activeBell,
  activeCandle,
  activeNave,
  activeSealBand,
  activeSealTone,
  activeSpan,
  activeSpeaker,
  activeVoice,
  addCard,
  addCardView,
  adjacentCardCount,
  bellArg,
  bulkCardClose,
  bulkCardNave,
  bulkCardPin,
  bulkCardTag,
  bulkSealReview,
  busiestSpeaker,
  candleArg,
  candleClashCount,
  cardCopy,
  cardCounts,
  cardNaves,
  cardShare,
  cardSpeakers,
  cardTimeline,
  cardsCsv,
  catalogSeal,
  catalogSealCount,
  clashBellCount,
  cycleVoice,
  densityOf,
  dropCardView,
  editCard,
  editCardNote,
  fairSpeaker,
  houseNave,
  houseSealCount,
  lateCard,
  leadingSeal,
  leadingSealTone,
  moveFocus,
  naveArg,
  nextCard,
  peakBell,
  pinFocused,
  presentSeals,
  quietBell,
  readCardViews,
  readCards,
  readHiddenSeals,
  readReviewedSeals,
  reminderCards,
  resetCards,
  sealBand,
  sealBandArg,
  sealBands,
  sealCopy,
  sealOf,
  sealRowsCsv,
  sealShare,
  sealState,
  sealTone,
  sealToneArg,
  sealsCsv,
  setCardClose,
  setCardHold,
  setCardPause,
  setCardPin,
  sharedSealCount,
  soonCard,
  sortCards,
  sortMode,
  spanArg,
  speakerArg,
  suggestNave,
  suggestSpan,
  suggestSpeaker,
  toggleSeal,
  toggleSealReview,
  usedBells,
  visibleCards,
  visibleSealBands,
  visibleSealCustomers,
  voiceArg,
  wideSealCount,
  bellGap,
  type CardDensity,
  type CardSort,
  type CardTray,
  type CardView,
  type OratoryCard,
  type SealRow,
  type SealShape,
} from "@/lib/crmv4/round203";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  lastIp?: string | null;
};

type GlanceRow = SealRow & { id: string };

const NAVES = ["apse", "nave", "transept"] as const;
const BANDS = ["dot", "wide", "stem"] as const;

function naveLabel(v4: V4, nave: string): string {
  if (nave === "apse" || nave === "APSE") return v4("orcApse");
  if (nave === "nave" || nave === "NAVE") return v4("orcNave");
  if (nave === "transept" || nave === "TRANSEPT") return v4("orcTransept");
  return v4("orcBlankNave");
}

function voiceLabel(v4: V4, voice: string): string {
  if (voice === "murmur") return v4("orcMurmur");
  if (voice === "chant") return v4("orcChant");
  if (voice === "hush") return v4("orcHush");
  return v4("orcBlankVoice");
}

function candleLabel(v4: V4, candle: number | null): string {
  if (candle === 2) return v4("orcCandle2");
  if (candle === 4) return v4("orcCandle4");
  if (candle === 8) return v4("orcCandle8");
  return v4("orcBlankCandle");
}

function spanLabel(v4: V4, span: number | null): string {
  if (span === 15) return v4("orcSpan15");
  if (span === 30) return v4("orcSpan30");
  if (span === 45) return v4("orcSpan45");
  return v4("orcBlankSpan");
}

function bandLabel(v4: V4, name: string): string {
  if (name === "wide") return v4("vslWide");
  if (name === "dot") return v4("vslDot");
  if (name === "stem") return v4("vslStem");
  if (name === "blank") return v4("vslClear");
  return v4("vslUnmarked");
}

function toneLabel(v4: V4, name: string): string {
  if (name === "house") return v4("vslHouse");
  if (name === "script") return v4("vslScript");
  if (name === "road") return v4("vslRoad");
  return v4("vslUnmarked");
}

function auditLabel(v4: V4, audit: string): string {
  const key = {
    save: "orcAuditSave",
    edit: "orcAuditEdit",
    voice: "orcAuditVoice",
    pin: "orcAuditPin",
    unpin: "orcAuditUnpin",
    hold: "orcAuditHold",
    lift: "orcAuditLift",
    close: "orcAuditClose",
    open: "orcAuditOpen",
    nave: "orcAuditNave",
    tag: "orcAuditTag",
    pause: "orcAuditPause",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, bell: number | null, desk: string): string {
  const gap = bellGap(bell, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("orcPast")} ${gap}`;
  if (gap < 0) return `${v4("orcAhead")} ${Math.abs(gap)}`;
  return v4("orcDue");
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

export function OratoryCards({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<OratoryCard[]>([]);
  const [views, setViews] = useState<CardView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [speaker, setSpeaker] = useState("");
  const [bell, setBell] = useState("");
  const [nave, setNave] = useState("");
  const [voice, setVoice] = useState("");
  const [candle, setCandle] = useState("");
  const [spanValue, setSpanValue] = useState("");
  const [tag, setTag] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<CardTray>("open");
  const [speakerFilter, setSpeakerFilter] = useState("all");
  const [naveFilter, setNaveFilter] = useState("all");
  const [voiceFilter, setVoiceFilter] = useState("all");
  const [bellFilter, setBellFilter] = useState("all");
  const [candleFilter, setCandleFilter] = useState("all");
  const [spanFilter, setSpanFilter] = useState("all");
  const [hushOnly, setHushOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [awakeOnly, setAwakeOnly] = useState(false);
  const [board, setBoard] = useState<"program" | "timeline">("program");
  const [order, setOrder] = useState<CardSort>("bell");
  const [density, setDensity] = useState<CardDensity>("roomy");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [deskBell, setDeskBell] = useState("");
  const [moveNave, setMoveNave] = useState("nave");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readCards(readJson(ORC_KEY, []));
    const saved = readCardViews(readJson(ORC_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    setDensity(densityOf(readJson(ORC_DENSITY_KEY, "roomy")));
    writeJson(ORC_KEY, next);
    writeJson(ORC_VIEW_KEY, saved);
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: OratoryCard[]) {
    const saved = readCards(next);
    setCards(saved);
    writeJson(ORC_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((card) => card.id === id)));
  }
  function storeViews(next: CardView[]) {
    const saved = readCardViews(next);
    setViews(saved);
    writeJson(ORC_VIEW_KEY, saved);
  }
  function storeDensity(next: CardDensity) {
    setDensity(next);
    writeJson(ORC_DENSITY_KEY, next);
  }
  const speakers = cardSpeakers(cards);
  const naves = cardNaves(cards);
  const bars = NAVES.map((item) => ({ nave: item.toUpperCase(), count: cards.filter((card) => card.nave === item.toUpperCase()).length })).filter((row) => row.count > 0);
  const speakerOn = activeSpeaker(speakerFilter, speakers);
  const naveOn = activeNave(naveFilter, naves);
  const voiceOn = activeVoice(voiceFilter, ["murmur", "chant", "hush"]);
  const bellOn = activeBell(bellFilter);
  const candleOn = activeCandle(candleFilter);
  const spanOn = activeSpan(spanFilter);
  const pickedBell = bellArg(bellOn);
  const shown = sortCards(visibleCards(
    cards,
    tray,
    query,
    speakerArg(speakerOn),
    naveArg(naveOn),
    voiceArg(voiceOn),
    pickedBell.exact,
    pickedBell.pick,
    candleArg(candleOn),
    spanArg(spanOn),
    hushOnly,
    peakOnly,
    houseOnly,
    quietOnly,
    awakeOnly,
  ), order);
  const timeline = cardTimeline(cards, query);
  const counts = cardCounts(cards, deskBell);
  const clashes = clashBellCount(cards);
  const candles = candleClashCount(cards);
  const neighbors = adjacentCardCount(cards);
  const nextId = nextCard(cards, deskBell);
  const nextRow = cards.find((card) => card.id === nextId);
  const suggestedNave = suggestNave(cards);
  const suggestedSpeaker = suggestSpeaker(cards);
  const suggestedSpan = suggestSpan(cards);
  const fair = fairSpeaker(cards, roster);
  const busy = busiestSpeaker(cards);
  const reminders = reminderCards(cards, deskBell);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const focusAt = shown.length ? moveFocus(focus, shown.length, 0) : 0;
  pinRef.current = () => {
    if (viewer) return;
    const ids = (board === "timeline" ? timeline : shown).map((card) => card.id);
    store(pinFocused(cards, ids, focus));
  };
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        clearDraft();
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        titleRef.current?.focus();
        return;
      }
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
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        pinRef.current();
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
    setSpeaker("");
    setBell("");
    setNave("");
    setVoice("");
    setCandle("");
    setSpanValue("");
    setTag("");
    setQuery("");
    setEditing("");
  }
  function applyView(view: CardView) {
    setTray(view.tray);
    setQuery(view.query);
    setSpeakerFilter(view.speaker);
    setNaveFilter(view.nave);
    setVoiceFilter(view.voice);
    setBellFilter(view.bell);
    setCandleFilter(view.candle);
    setSpanFilter(view.span);
  }
  const rows = board === "timeline" ? timeline : shown;
  return (
    <section className="c4-orc" aria-label={v4("orcTitle")} data-cards="1" data-role={role} data-density={density}>
      <div className="c4-orc-sheet">
        <header className="c4-orc-mast">
          <p className="c4-orc-spine">{v4("orcSpine")}</p>
          <div>
            <p className="c4-orc-kicker">{v4("orcSub")}</p>
            <h2 className="c4-title">{v4("orcTitle")}</h2>
          </div>
          <p className="c4-orc-plate" data-logo="mono">{v4("orcLogo")}</p>
        </header>
        <div className="c4-orc-body">
          <p className="c4-orc-rules">{v4("orcHint")}</p>
          <p className="c4-meta">{v4("orcLocal")}</p>
          <p className="c4-meta">{v4("orcNew")} {v4("orcSlash")} {v4("orcEscape")} {v4("orcKeys")} {v4("orcPinKey")}</p>
          {viewer && <p className="c4-orc-notice" data-viewer="1">{v4("orcViewer")}</p>}
          {counts.peak > 0 && (
            <p className="c4-orc-notice" role="status">
              {v4("orcNotice")} · {counts.peak}
              <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("orcNoticeAll") : v4("orcNoticePeak")}</button>
            </p>
          )}
          <ol className="c4-orc-ledger" aria-label={v4("orcKpi")}>
            <li><span>{v4("orcOpen")}</span><strong>{counts.open}</strong></li>
            <li><span>{v4("orcHeld")}</span><strong>{counts.held}</strong></li>
            <li><span>{v4("orcClosed")}</span><strong>{counts.closed}</strong></li>
            <li><span>{v4("orcPinned")}</span><strong>{counts.pinned}</strong></li>
            <li><span>{v4("orcPeak")}</span><strong>{counts.peak}</strong></li>
            <li><span>{v4("orcLate")}</span><strong>{counts.late}</strong></li>
            <li><span>{v4("orcSoon")}</span><strong>{counts.soon}</strong></li>
            <li><span>{v4("orcRest")}</span><strong>{counts.rest}</strong></li>
            <li><span>{v4("orcHouseShare")}</span><strong>{cardShare(counts.house, cards.length)}%</strong></li>
          </ol>
          <div className="c4-orc-rail" aria-label={v4("orcNaves")}>
            {bars.map((bar) => (
              <div key={bar.nave} className="c4-orc-meter" data-nave={bar.nave.toLowerCase()}>
                <button type="button" className="c4-btn" onClick={() => setNaveFilter(bar.nave)}>{naveLabel(v4, bar.nave)} · {bar.count}</button>
                <div className="c4-orc-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
              </div>
            ))}
            {!bars.length && <p className="c4-orc-empty">{v4("orcEmpty")}</p>}
          </div>
          <div className="c4-orc-suggest">
            <p>{v4("orcSuggestNave")} · {naveLabel(v4, suggestedNave)}</p>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setNave(suggestedNave.toLowerCase())}>{v4("orcUseNave")}</button>
            <p>{v4("orcSuggestSpeaker")} · {suggestedSpeaker || v4("orcBlankSpeaker")}</p>
            <button type="button" className="c4-btn" disabled={viewer || !suggestedSpeaker} onClick={() => setSpeaker(suggestedSpeaker)}>{v4("orcUseSpeaker")}</button>
            <p>{v4("orcSuggestSpan")} · {spanLabel(v4, suggestedSpan)}</p>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setSpanValue(String(suggestedSpan))}>{v4("orcUseSpan")}</button>
            <p>{v4("orcAssign")} · {fair || v4("orcBlankSpeaker")}</p>
            <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setSpeaker(fair)}>{v4("orcAssign")}</button>
            <p>{v4("orcBells")} · {usedBells(cards)}</p>
            <p>{clashes ? `${v4("orcClash")} · ${clashes}` : v4("orcClashNone")}</p>
            <p>{candles ? `${v4("orcCandleClash")} · ${candles}` : v4("orcCandleClashNone")}</p>
            <p>{neighbors ? `${v4("orcAdjacent")} · ${neighbors}` : v4("orcAdjacentNone")}</p>
            <p>{v4("orcNext")} · {nextRow ? nextRow.title : v4("orcNextNone")}</p>
            <p>{v4("orcBusiest")} · {busy || v4("orcBusiestNone")}</p>
            <p>{v4("orcReminders")} · {reminders.length ? reminders.map((card) => card.title).join(", ") : v4("orcReminderNone")}</p>
          </div>
          <form className="c4-orc-form" onSubmit={(event) => {
            event.preventDefault();
            if (viewer) return;
            const next = addCard(cards, {
              id: `c${Date.now().toString(36)}`,
              title,
              note,
              speaker,
              bell,
              nave,
              voice,
              candle,
              span: spanValue,
              tags: tag,
              pause: "0",
            });
            const added = next[0];
            if (added && (added.title !== cards[0]?.title || next.length !== cards.length)) {
              store(next);
              clearDraft();
            }
          }}>
            <label className="c4-lab">{v4("orcLine")}<input ref={titleRef} className="c4-field" aria-label={v4("orcLine")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
            <label className="c4-lab">{v4("orcNote")}<input className="c4-field" aria-label={v4("orcNote")} value={note} onChange={(event) => setNote(event.target.value)} /></label>
            <label className="c4-lab">{v4("orcSpeaker")}<input className="c4-field" aria-label={v4("orcSpeaker")} value={speaker} onChange={(event) => setSpeaker(event.target.value)} /></label>
            <label className="c4-lab">{v4("orcBell")}<input className="c4-field" inputMode="numeric" aria-label={v4("orcBell")} value={bell} onChange={(event) => setBell(event.target.value)} /></label>
            <label className="c4-lab">{v4("orcNaveLabel")}
              <select className="c4-field" aria-label={v4("orcNaveLabel")} value={nave} onChange={(event) => setNave(event.target.value)}>
                <option value="">{v4("orcBlankNave")}</option>
                {NAVES.map((item) => <option key={item} value={item}>{naveLabel(v4, item)}</option>)}
              </select>
            </label>
            <label className="c4-lab">{v4("orcVoice")}
              <select className="c4-field" aria-label={v4("orcVoice")} value={voice} onChange={(event) => setVoice(event.target.value)}>
                <option value="">{v4("orcBlankVoice")}</option>
                <option value="murmur">{v4("orcMurmur")}</option>
                <option value="chant">{v4("orcChant")}</option>
                <option value="hush">{v4("orcHush")}</option>
              </select>
            </label>
            <label className="c4-lab">{v4("orcCandle")}
              <select className="c4-field" aria-label={v4("orcCandle")} value={candle} onChange={(event) => setCandle(event.target.value)}>
                <option value="">{v4("orcBlankCandle")}</option>
                <option value="2">{v4("orcCandle2")}</option>
                <option value="4">{v4("orcCandle4")}</option>
                <option value="8">{v4("orcCandle8")}</option>
              </select>
            </label>
            <label className="c4-lab">{v4("orcSpan")}
              <select className="c4-field" aria-label={v4("orcSpan")} value={spanValue} onChange={(event) => setSpanValue(event.target.value)}>
                <option value="">{v4("orcBlankSpan")}</option>
                <option value="15">{v4("orcSpan15")}</option>
                <option value="30">{v4("orcSpan30")}</option>
                <option value="45">{v4("orcSpan45")}</option>
              </select>
            </label>
            <label className="c4-lab">{v4("orcTag")}<input className="c4-field" maxLength={1} aria-label={v4("orcTag")} value={tag} onChange={(event) => setTag(event.target.value)} /></label>
            <label className="c4-lab">{v4("orcRoster")}<input className="c4-field" aria-label={v4("orcRoster")} value={roster} onChange={(event) => setRoster(event.target.value)} /></label>
            <label className="c4-lab">{v4("orcDeskBell")}<input className="c4-field" inputMode="numeric" aria-label={v4("orcDeskBell")} value={deskBell} onChange={(event) => setDeskBell(event.target.value)} /></label>
            <button type="submit" className="c4-btn c4-btn-hot" disabled={viewer}>{v4("orcAdd")}</button>
          </form>
          <div className="c4-orc-views">
            <label className="c4-lab">{v4("orcViews")}<input className="c4-field" aria-label={v4("orcViews")} value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
              const next = addCardView(views, { id: `v${Date.now().toString(36)}`, name: viewName, tray, query, speaker: speakerOn, nave: naveOn, voice: voiceOn, bell: bellOn, candle: candleOn, span: spanOn });
              storeViews(next);
              if (next.length !== views.length) setViewName("");
            }}>{v4("orcSaveView")}</button>
            {views.map((view) => (
              <span key={view.id}>
                <button type="button" className="c4-chip" onClick={() => applyView(view)}>{view.name}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropCardView(views, view.id))}>{v4("orcDropView")}</button>
              </span>
            ))}
          </div>
          <label className="c4-lab">{v4("orcSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("orcSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <div className="c4-orc-filters" role="group" aria-label={v4("orcSearch")}>
            {(["open", "held", "closed"] as const).map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("orcOpen") : item === "held" ? v4("orcHeld") : v4("orcClosed")}</button>
            ))}
            <button type="button" className="c4-chip" data-on={speakerOn === "all" ? "1" : "0"} onClick={() => setSpeakerFilter("all")}>{v4("orcAll")}</button>
            <button type="button" className="c4-chip" data-on={speakerOn === "blank" ? "1" : "0"} onClick={() => setSpeakerFilter("blank")}>{v4("orcBlankSpeaker")}</button>
            {speakers.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={speakerOn === name ? "1" : "0"} onClick={() => setSpeakerFilter(name)}>{name}</button>
            ))}
            {["blank", "early", "mid", "late", "peak", "quiet"].map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={bellOn === item ? "1" : "0"} onClick={() => setBellFilter(item)}>
                {item === "blank" ? v4("orcBlankBell") : item === "early" ? v4("orcEarly") : item === "mid" ? v4("orcMid") : item === "late" ? v4("orcLateBell") : item === "peak" ? v4("orcPeak") : v4("orcQuiet")}
              </button>
            ))}
            <button type="button" className="c4-chip" data-on={hushOnly ? "1" : "0"} onClick={() => setHushOnly((on) => !on)}>{v4("orcHushOnly")}</button>
            <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((on) => !on)}>{v4("orcHouseOnly")}</button>
            <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((on) => !on)}>{v4("orcQuietOnly")}</button>
            <button type="button" className="c4-chip" data-on={awakeOnly ? "1" : "0"} onClick={() => setAwakeOnly((on) => !on)}>{v4("orcAwake")}</button>
            <button type="button" className="c4-chip" data-on={board === "program" ? "1" : "0"} onClick={() => setBoard("program")}>{v4("orcProgram")}</button>
            <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard("timeline")}>{v4("orcTimeline")}</button>
            <button type="button" className="c4-chip" data-on={order === "bell" ? "1" : "0"} onClick={() => setOrder(sortMode("bell"))}>{v4("orcSortBell")}</button>
            <button type="button" className="c4-chip" data-on={order === "title" ? "1" : "0"} onClick={() => setOrder(sortMode("title"))}>{v4("orcSortTitle")}</button>
            <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "roomy" : "tight")}>{density === "tight" ? v4("orcRoomy") : v4("orcTight")}</button>
          </div>
          <div className="c4-orc-bulk">
            <button type="button" className="c4-btn" onClick={() => setPicked(rows.map((card) => card.id))}>{v4("orcPickAll")}</button>
            <button type="button" className="c4-btn" onClick={() => setPicked([])}>{v4("orcPickNone")}</button>
            <span>{v4("orcPicked")} · {picked.length}</span>
            <select className="c4-field" aria-label={v4("orcBulkNave")} value={moveNave} onChange={(event) => setMoveNave(event.target.value)}>
              {NAVES.map((item) => <option key={item} value={item}>{naveLabel(v4, item)}</option>)}
            </select>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkCardNave(cards, picked, moveNave))}>{v4("orcBulkNave")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkCardPin(cards, picked, true))}>{v4("orcBulkPin")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkCardClose(cards, picked, true))}>{v4("orcBulkClose")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkCardTag(cards, picked, tag || "a"))}>{v4("orcBulkTag")}</button>
            <button type="button" className="c4-btn" onClick={() => download("oratory-cards.csv", cardsCsv(cards, deskBell))}>{v4("orcCsv")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetCards())}>{v4("orcReset")}</button>
          </div>
          {!rows.length && <p className="c4-orc-empty">{v4("orcEmpty")}</p>}
          <ol className={board === "timeline" ? "c4-orc-time" : "c4-orc-book"}>
            {rows.map((card, index) => (
              <li key={card.id} data-focus={index === focusAt ? "1" : "0"} data-late={lateCard(card, deskBell) ? "1" : "0"} data-soon={soonCard(card) ? "1" : "0"} data-house={houseNave(card.nave) ? "1" : "0"} data-peak={peakBell(card.bell) ? "1" : "0"} data-quiet={quietBell(card.bell) ? "1" : "0"} data-nave={card.nave.toLowerCase() || "blank"}>
                <p className="c4-orc-stamp">{card.bell ?? "—"}</p>
                <div>
                  <label className="c4-row">
                    <input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={(event) => setPicked((ids) => event.target.checked ? [...ids, card.id] : ids.filter((id) => id !== card.id))} />
                    <strong>{card.title}</strong>
                  </label>
                  <p className="c4-meta">{card.speaker || v4("orcBlankSpeaker")} · {naveLabel(v4, card.nave)} · {voiceLabel(v4, card.voice)} · {candleLabel(v4, card.candle)} · {spanLabel(v4, card.span)}</p>
                  <p className="c4-meta">{card.tags.length ? card.tags.join(" ") : v4("orcBlankTag")} · {gapLabel(v4, card.bell, deskBell)} · {auditLabel(v4, card.audit)}</p>
                  {card.note && <p>{card.note}</p>}
                  {editing === card.id && (
                    <div className="c4-orc-edit">
                      <input className="c4-field" aria-label={v4("orcLine")} value={draft} onChange={(event) => setDraft(event.target.value)} />
                      <input className="c4-field" aria-label={v4("orcNote")} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} />
                      <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(editCardNote(editCard(cards, card.id, draft), card.id, noteDraft)); setEditing(""); }}>{v4("orcEdit")}</button>
                    </div>
                  )}
                  <div className="c4-row">
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleVoice(cards, card.id))}>{v4("orcVoiceUp")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCardPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("orcUnpin") : v4("orcPin")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCardHold(cards, card.id, !card.held))}>{card.held ? v4("orcLift") : v4("orcHold")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCardClose(cards, card.id, !card.closed))}>{card.closed ? v4("orcReopen") : v4("orcClose")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCardPause(cards, card.id, card.pause ? 0 : 5))}>{card.pause ? v4("orcPauseOff") : v4("orcPauseOn")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); setNoteDraft(card.note); }}>{v4("orcEdit")}</button>
                    <button type="button" className="c4-btn" onClick={() => { const line = cardCopy(card, deskBell); void navigator.clipboard?.writeText(line); setCopied(card.id); }}>{copied === card.id ? v4("orcCopied") : v4("orcCopy")}</button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <p className="c4-orc-rules">{v4("orcRules")}</p>
        </div>
      </div>
    </section>
  );
}

export function VisitorSeals({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [band, setBand] = useState("all");
  const [tone, setTone] = useState("all");
  const [shape, setShape] = useState<SealShape>("all");
  const [review, setReview] = useState<"all" | "reviewed" | "open">("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<GlanceRow[]>(() => (data.data?.users || []).map((user) => ({
    id: user.id,
    label: user.name || user.id,
    note: { lastIp: user.lastIp ?? null },
  })), [data.data?.users]);
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
    const present = presentSeals(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenSeals(readJson(VSL_KEY, []), present);
    const nextReviewed = readReviewedSeals(readJson(VSL_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(VSL_KEY, nextHidden);
    writeJson(VSL_REVIEW_KEY, nextReviewed);
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
  const present = presentSeals(rows);
  const bands = visibleSealBands(present, hidden, showHidden);
  const bandOn = activeSealBand(band, present);
  const toneOn = activeSealTone(tone);
  const shown = visibleSealCustomers(rows, sealBandArg(bandOn), sealToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = sealState(row.note);
      const token = state === "set" ? sealBand(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return bands.includes(token);
    });
  const lead = leadingSeal(rows);
  const toneLead = leadingSealTone(rows);
  const shared = sharedSealCount(rows);
  const catalog = catalogSealCount(rows);
  const bars = sealBands(rows).filter((line) => line.band);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(VSL_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedSeals(next, ids);
    setReviewed(saved);
    writeJson(VSL_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-vsl" aria-label={v4("vslTitle")} data-seals="1" data-role={role} data-catalog={catalog ? "1" : "0"}>
      <div className="c4-vsl-sheet">
        <header className="c4-vsl-mast">
          <div>
            <p className="c4-vsl-kicker">{v4("vslSub")}</p>
            <h2 className="c4-title">{v4("vslTitle")}</h2>
          </div>
          <p className="c4-vsl-plate" data-logo="mono">{v4("vslLogo")}</p>
        </header>
        <p className="c4-vsl-rules">{v4("vslHint")}</p>
        <p className="c4-meta">{v4("vslKept")} {v4("vslEscape")}</p>
        {viewer && <p className="c4-vsl-notice" data-viewer="1">{v4("vslViewer")}</p>}
        {data.error && <p className="c4-vsl-empty" role="alert">{v4("vslFailed")}</p>}
        {data.loading && <p className="c4-meta">{v4("vslLoading")}</p>}
        {shared > 0 && <p className="c4-vsl-notice" role="status">{v4("vslNotice")} · {shared}</p>}
        <ol className="c4-vsl-ledger" aria-label={v4("vslKpi")}>
          <li><span>{v4("vslSet")}</span><strong>{rows.filter((row) => sealState(row.note) === "set").length}</strong></li>
          <li><span>{v4("vslCatalog")}</span><strong>{catalog}</strong></li>
          <li><span>{v4("vslWideCount")}</span><strong>{wideSealCount(rows)}</strong></li>
          <li><span>{v4("vslHouseCount")}</span><strong>{houseSealCount(rows)}</strong></li>
          <li><span>{v4("vslShare")}</span><strong>{sealShare(catalog, rows.length)}%</strong></li>
          <li><span>{v4("vslShared")}</span><strong>{shared}</strong></li>
        </ol>
        <div className="c4-vsl-rail" aria-label={v4("vslBands")}>
          {bars.map((bar) => (
            <div key={bar.band} className="c4-vsl-meter">
              <button type="button" className="c4-btn" onClick={() => setBand(bar.band)}>{bandLabel(v4, bar.band)} · {bar.count}</button>
              <div className="c4-vsl-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            </div>
          ))}
          {!bars.length && <p className="c4-vsl-empty">{v4("vslEmpty")}</p>}
        </div>
        <div className="c4-vsl-suggest">
          <p>{v4("vslLeading")} · {lead ? bandLabel(v4, lead) : v4("vslLeadingNone")}</p>
          <p>{v4("vslToneLead")} · {toneLead ? toneLabel(v4, toneLead) : v4("vslToneNone")}</p>
          <p>{shared ? `${v4("vslShared")} · ${shared}` : v4("vslSharedNone")}</p>
        </div>
        <label className="c4-lab">{v4("vslSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("vslSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <div className="c4-vsl-filters">
          <button type="button" className="c4-chip" data-on={bandOn === "all" ? "1" : "0"} onClick={() => setBand("all")}>{v4("vslAll")}</button>
          <button type="button" className="c4-chip" data-on={bandOn === "blank" ? "1" : "0"} onClick={() => setBand("blank")}>{v4("vslClear")}</button>
          {BANDS.map((item) => (
            <button key={item} type="button" className="c4-chip" data-on={bandOn === item ? "1" : "0"} onClick={() => setBand(item)}>{bandLabel(v4, item)}</button>
          ))}
          <button type="button" className="c4-chip" data-on={toneOn === "all" ? "1" : "0"} onClick={() => setTone("all")}>{v4("vslTone")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "house" ? "1" : "0"} onClick={() => setTone("house")}>{v4("vslHouse")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "script" ? "1" : "0"} onClick={() => setTone("script")}>{v4("vslScript")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "road" ? "1" : "0"} onClick={() => setTone("road")}>{v4("vslRoad")}</button>
          {(["all", "catalog", "wide", "house"] as const).map((item) => (
            <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{item === "all" ? v4("vslAllShapes") : item === "catalog" ? v4("vslCatalog") : item === "wide" ? v4("vslWide") : v4("vslHouse")}</button>
          ))}
          <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} onClick={() => setReview("all")}>{v4("vslAllReview")}</button>
          <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview("reviewed")}>{v4("vslReviewed")}</button>
          <button type="button" className="c4-chip" data-on={review === "open" ? "1" : "0"} onClick={() => setReview("open")}>{v4("vslOpenReview")}</button>
          <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("vslShown") : v4("vslHidden")}</button>
        </div>
        <div className="c4-vsl-bands">
          {present.map((item) => (
            <button key={item} type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleSeal(hidden, item))}>
              {bandLabel(v4, item)} · {hidden.includes(item) ? v4("vslShow") : v4("vslHide")}
            </button>
          ))}
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkSealReview(reviewed, shown.map((row) => row.id), true))}>{v4("vslBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkSealReview(reviewed, ids, false))}>{v4("vslBulkClear")}</button>
          <button type="button" className="c4-btn" onClick={() => download("visitor-seals.csv", sealsCsv(rows))}>{v4("vslCsv")}</button>
          <button type="button" className="c4-btn" onClick={() => download("visitor-seal-rows.csv", sealRowsCsv(rows, reviewed))}>{v4("vslRowCsv")}</button>
          <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("vslCustomers")}</Link>
        </div>
        {!shown.length && <p className="c4-vsl-empty">{v4("vslEmpty")}</p>}
        <ul className="c4-vsl-index">
          {shown.map((row) => {
            const state = sealState(row.note);
            const mark = sealOf(row.note);
            return (
              <li key={row.id} data-state={state || "blank"} data-band={state === "set" ? sealBand(row.note) : "blank"} data-tone={sealTone(row.note) || "blank"} data-catalog={catalogSeal(row.note) ? "1" : "0"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"}>
                <p className="c4-vsl-mark" data-logo="mono">{mark || "—"}</p>
                <div>
                  <strong>{row.label || row.id}</strong>
                  <span className="c4-meta">{bandLabel(v4, state === "set" ? sealBand(row.note) : state === "clear" ? "blank" : "")} · {toneLabel(v4, sealTone(row.note))}</span>
                  {catalogSeal(row.note) && <span className="c4-meta">{v4("vslCatalogMark")}</span>}
                  <div className="c4-row">
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleSealReview(reviewed, row.id))}>{v4("vslReview")}</button>
                    <button type="button" className="c4-btn" onClick={() => { const line = sealCopy(row.note); void navigator.clipboard?.writeText(line); setCopied(row.id); }}>{copied === row.id ? v4("vslCopied") : v4("vslCopy")}</button>
                    <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{row.label || row.id}</Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="c4-vsl-rules">{v4("vslRules")}</p>
      </div>
    </section>
  );
}
