"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  CREST_KEY,
  CREST_REVIEW_KEY,
  REVIEW_KEY,
  REVIEW_VIEW_KEY,
  activeCloth,
  activeCrestBand,
  activeCrestVoice,
  activeFolio,
  activeMinute,
  activePages,
  activeReader,
  activeSpan,
  activeStage,
  addReview,
  addReviewView,
  bulkCrestReview,
  bulkReviewCloth,
  bulkReviewFile,
  bulkReviewPin,
  catalogCrest,
  catalogCrestCount,
  clashMinuteCount,
  clothArg,
  clothCounts,
  crestBand,
  crestBandArg,
  crestBands,
  crestCopy,
  crestRowsCsv,
  crestShare,
  crestState,
  crestVoice,
  crestVoiceArg,
  crestsCsv,
  cycleStage,
  dropReviewView,
  editReview,
  editReviewNote,
  fairReader,
  folioArg,
  houseFolio,
  lateReview,
  leadingCrest,
  leadingCrestVoice,
  minuteArg,
  minuteGap,
  nextReview,
  pageClashCount,
  pagesArg,
  presentCrests,
  readHiddenCrests,
  readReviewViews,
  readReviewedCrests,
  readReviews,
  resetReviews,
  reviewCopy,
  reviewCounts,
  reviewFolios,
  reviewReaders,
  reviewShare,
  reviewTimeline,
  reviewsCsv,
  setReviewFile,
  setReviewPark,
  setReviewPin,
  sharedCrestCount,
  soonReview,
  spanArg,
  stageArg,
  suggestCloth,
  suggestReader,
  suggestSpan,
  toggleCrest,
  toggleCrestReview,
  usedMinutes,
  visibleCrestBands,
  visibleCrestCustomers,
  visibleReviews,
  vowelCrestCount,
  wideCrestCount,
  readerArg,
  type CrestRow,
  type CrestShape,
  type Review,
  type ReviewCloth,
  type ReviewStage,
  type ReviewTray,
  type ReviewView,
} from "@/lib/crmv4/round191";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  campaign?: string | null;
};

type GlanceRow = CrestRow & { id: string };

const CLOTHS = ["linen", "graphite", "champagne", "ivory"] as const;
const BANDS = ["chip", "plaque", "shield"] as const;

function clothName(v4: V4, cloth: ReviewCloth | string): string {
  if (cloth === "linen") return v4("rvmLinen");
  if (cloth === "graphite") return v4("rvmGraphite");
  if (cloth === "champagne") return v4("rvmChampagne");
  if (cloth === "ivory") return v4("rvmIvory");
  return v4("rvmBlankCloth");
}

function stageName(v4: V4, stage: ReviewStage | string): string {
  if (stage === "draft") return v4("rvmDraft");
  if (stage === "read") return v4("rvmRead");
  if (stage === "seal") return v4("rvmSeal");
  return v4("rvmBlankStage");
}

function minuteName(v4: V4, name: string): string {
  if (name === "night") return v4("rvmNight");
  if (name === "day") return v4("rvmDay");
  if (name === "eve") return v4("rvmEve");
  if (name === "peak") return v4("rvmPeak");
  if (name === "quiet") return v4("rvmQuiet");
  if (/^(?:0|[1-9]|[1-5][0-9])$/.test(name)) return name;
  return v4("rvmBlankMinute");
}

function pagesName(v4: V4, pages: number | null): string {
  if (pages === 2) return v4("rvmPages2");
  if (pages === 6) return v4("rvmPages6");
  if (pages === 12) return v4("rvmPages12");
  return v4("rvmBlankPages");
}

function spanName(v4: V4, span: number | null): string {
  if (span === 2) return v4("rvmSpan2");
  if (span === 4) return v4("rvmSpan4");
  if (span === 9) return v4("rvmSpan9");
  return v4("rvmBlankSpan");
}

function bandName(v4: V4, name: string): string {
  if (name === "chip") return v4("nctChip");
  if (name === "plaque") return v4("nctPlaque");
  if (name === "shield") return v4("nctShield");
  if (name === "blank") return v4("nctClear");
  return v4("nctUnmarked");
}

function voiceName(v4: V4, name: string): string {
  if (name === "vowel") return v4("nctVowel");
  if (name === "plain") return v4("nctPlain");
  return v4("nctUnmarked");
}

function auditName(v4: V4, audit: string): string {
  const key = {
    save: "rvmAuditSave",
    edit: "rvmAuditEdit",
    stage: "rvmAuditStage",
    pin: "rvmAuditPin",
    unpin: "rvmAuditUnpin",
    park: "rvmAuditPark",
    lift: "rvmAuditLift",
    file: "rvmAuditFile",
    reopen: "rvmAuditReopen",
    cloth: "rvmAuditCloth",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, minute: number | null, desk: string): string {
  const gap = minuteGap(minute, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("rvmPast")} ${gap}`;
  if (gap < 0) return `${v4("rvmAhead")} ${Math.abs(gap)}`;
  return v4("rvmDue");
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

export function ReviewMinutes({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<Review[]>([]);
  const [views, setViews] = useState<ReviewView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [reader, setReader] = useState("");
  const [minute, setMinute] = useState("");
  const [cloth, setCloth] = useState("");
  const [folio, setFolio] = useState("");
  const [stage, setStage] = useState("");
  const [pages, setPages] = useState("");
  const [span, setSpan] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<ReviewTray>("open");
  const [readerFilter, setReaderFilter] = useState("all");
  const [clothFilter, setClothFilter] = useState("all");
  const [folioFilter, setFolioFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [minuteFilter, setMinuteFilter] = useState("all");
  const [pagesFilter, setPagesFilter] = useState("all");
  const [spanFilter, setSpanFilter] = useState("all");
  const [draftOnly, setDraftOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [desk, setDesk] = useState("");
  const [moveCloth, setMoveCloth] = useState("champagne");
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readReviews(readJson(REVIEW_KEY, []));
    const saved = readReviewViews(readJson(REVIEW_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(REVIEW_KEY, next);
    writeJson(REVIEW_VIEW_KEY, saved);
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
  function store(next: Review[]) {
    const saved = readReviews(next);
    setCards(saved);
    writeJson(REVIEW_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((card) => card.id === id)));
  }
  function storeViews(next: ReviewView[]) {
    const saved = readReviewViews(next);
    setViews(saved);
    writeJson(REVIEW_VIEW_KEY, saved);
  }
  const readers = reviewReaders(cards);
  const folios = reviewFolios(cards);
  const bars = clothCounts(cards);
  const readerOn = activeReader(readerFilter, readers);
  const clothOn = activeCloth(clothFilter, CLOTHS);
  const folioOn = activeFolio(folioFilter, folios);
  const stageOn = activeStage(stageFilter, ["draft", "read", "seal"]);
  const minuteOn = activeMinute(minuteFilter);
  const pagesOn = activePages(pagesFilter);
  const spanOn = activeSpan(spanFilter);
  const pickedMinute = minuteArg(minuteOn);
  const shown = visibleReviews(
    cards,
    tray,
    query,
    readerArg(readerOn),
    clothArg(clothOn),
    folioArg(folioOn),
    stageArg(stageOn),
    pickedMinute.exact,
    pickedMinute.pick,
    pagesArg(pagesOn),
    spanArg(spanOn),
    draftOnly,
    peakOnly,
    houseOnly,
    quietOnly,
  );
  const timeline = reviewTimeline(cards, query);
  const counts = reviewCounts(cards, desk);
  const clashes = clashMinuteCount(cards);
  const pagesClash = pageClashCount(cards);
  const nextId = nextReview(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const suggestedCloth = suggestCloth(cards);
  const suggestedReader = suggestReader(cards);
  const suggestedSpan = suggestSpan(cards);
  const fair = fairReader(cards, roster);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  function clearDraft() {
    setTitle("");
    setNote("");
    setReader("");
    setMinute("");
    setCloth("");
    setFolio("");
    setStage("");
    setPages("");
    setSpan("");
    setQuery("");
    setEditing("");
  }
  return (
    <section className="c4-rvm" aria-label={v4("rvmTitle")} data-reviews="1" data-role={role}>
      <header className="c4-rvm-mast">
        <div>
          <p className="c4-rvm-kicker">{v4("rvmSub")}</p>
          <h2 className="c4-title">{v4("rvmTitle")}</h2>
        </div>
        <p className="c4-rvm-plate" data-logo="mono">{v4("rvmLogo")}</p>
      </header>
      <p className="c4-rvm-rules">{v4("rvmHint")}</p>
      <p className="c4-meta">{v4("rvmLocal")}</p>
      <p className="c4-meta">{v4("rvmNew")} {v4("rvmSlash")} {v4("rvmEscape")}</p>
      {viewer && <p className="c4-rvm-notice" data-viewer="1">{v4("rvmViewer")}</p>}
      {counts.peak > 0 && (
        <div className="c4-rvm-bells" role="status">
          <p className="c4-rvm-notice">{v4("rvmNotice")} · {counts.peak}</p>
          <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("rvmNoticeAll") : v4("rvmNoticePeak")}</button>
        </div>
      )}
      <dl className="c4-rvm-kpi" aria-label={v4("rvmKpi")}>
        <div><dt>{v4("rvmOpen")}</dt><dd>{counts.open}</dd></div>
        <div><dt>{v4("rvmParked")}</dt><dd>{counts.parked}</dd></div>
        <div><dt>{v4("rvmFiled")}</dt><dd>{counts.filed}</dd></div>
        <div><dt>{v4("rvmPinned")}</dt><dd>{counts.pinned}</dd></div>
        <div><dt>{v4("rvmPeak")}</dt><dd>{counts.peak}</dd></div>
        <div><dt>{v4("rvmLate")}</dt><dd>{counts.late}</dd></div>
        <div><dt>{v4("rvmSoon")}</dt><dd>{counts.soon}</dd></div>
        <div><dt>{v4("rvmHouseShare")}</dt><dd>{reviewShare(counts.house, cards.length)}%</dd></div>
      </dl>
      <div className="c4-rvm-chart" aria-label={v4("rvmCloths")}>
        {bars.map((bar) => (
          <div key={bar.cloth} className="c4-rvm-col" data-on={clothOn === bar.cloth ? "1" : "0"}>
            <span className="c4-rvm-swatch" data-cloth={bar.cloth} />
            <div className="c4-rvm-track" aria-hidden="true"><i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            <button type="button" className="c4-btn" onClick={() => setClothFilter(bar.cloth)}>{clothName(v4, bar.cloth)} · {bar.count}</button>
          </div>
        ))}
        {!bars.length && <p className="c4-empty-gold">{v4("rvmEmpty")}</p>}
      </div>
      <div className="c4-rvm-suggest">
        <p className="c4-meta">{v4("rvmSuggestCloth")} · {clothName(v4, suggestedCloth)}</p>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setCloth(suggestedCloth)}>{v4("rvmUseCloth")}</button>
        <p className="c4-meta">{v4("rvmSuggestReader")} · {suggestedReader || v4("rvmBlankReader")}</p>
        <button type="button" className="c4-btn" disabled={viewer || !suggestedReader} onClick={() => setReader(suggestedReader)}>{v4("rvmUseReader")}</button>
        <p className="c4-meta">{v4("rvmSuggestSpan")} · {spanName(v4, suggestedSpan)}</p>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setSpan(String(suggestedSpan))}>{v4("rvmUseSpan")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setReader(fair)}>{v4("rvmAssign")}</button>
      </div>
      <p className="c4-meta">{v4("rvmMinuteUse")} · {usedMinutes(cards)} · {clashes ? `${v4("rvmClash")} · ${clashes}` : v4("rvmClashNone")} · {pagesClash ? `${v4("rvmPageClash")} · ${pagesClash}` : v4("rvmPageClashNone")}</p>
      <p className="c4-meta">{v4("rvmNext")} · {nextCard ? nextCard.title : v4("rvmNextNone")}</p>
      <form className="c4-rvm-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        store(addReview(cards, { id: `rvm-${Date.now()}`, title, note, reader, minute, cloth, folio, stage, pages, span }));
        setTitle("");
        setNote("");
      }}>
        <label className="c4-lab"><span>{v4("rvmLine")}</span>
          <input ref={titleRef} className="c4-field" aria-label={v4("rvmLine")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab"><span>{v4("rvmNote")}</span>
          <input className="c4-field" aria-label={v4("rvmNote")} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("rvmReader")}</span>
          <input className="c4-field" aria-label={v4("rvmReader")} value={reader} disabled={viewer} onChange={(event) => setReader(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("rvmMinute")}</span>
          <input className="c4-field" aria-label={v4("rvmMinute")} inputMode="numeric" value={minute} disabled={viewer} onChange={(event) => setMinute(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("rvmCloth")}</span>
          <select className="c4-field" aria-label={v4("rvmCloth")} value={cloth} disabled={viewer} onChange={(event) => setCloth(event.target.value)}>
            <option value="">{v4("rvmBlankCloth")}</option>
            {CLOTHS.map((item) => <option key={item} value={item}>{clothName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("rvmFolio")}</span>
          <input className="c4-field" aria-label={v4("rvmFolio")} value={folio} disabled={viewer} onChange={(event) => setFolio(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("rvmStage")}</span>
          <select className="c4-field" aria-label={v4("rvmStage")} value={stage} disabled={viewer} onChange={(event) => setStage(event.target.value)}>
            <option value="">{v4("rvmBlankStage")}</option>
            <option value="draft">{v4("rvmDraft")}</option>
            <option value="read">{v4("rvmRead")}</option>
            <option value="seal">{v4("rvmSeal")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("rvmPages")}</span>
          <input className="c4-field" aria-label={v4("rvmPages")} inputMode="numeric" value={pages} disabled={viewer} onChange={(event) => setPages(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("rvmSpan")}</span>
          <input className="c4-field" aria-label={v4("rvmSpan")} inputMode="numeric" value={span} disabled={viewer} onChange={(event) => setSpan(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("rvmRoster")}</span>
          <input className="c4-field" aria-label={v4("rvmRoster")} value={roster} disabled={viewer} onChange={(event) => setRoster(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("rvmAdd")}</button>
        <p className="c4-meta">{v4("rvmBlank")} {v4("rvmMinuteBlank")}</p>
      </form>
      <div className="c4-rvm-filters">
        <label className="c4-lab"><span>{v4("rvmSearch")}</span>
          <input ref={searchRef} className="c4-field" aria-label={v4("rvmSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            setQuery("");
          }} />
        </label>
        <label className="c4-lab"><span>{v4("rvmDeskMinute")}</span>
          <input className="c4-field" aria-label={v4("rvmDeskMinute")} inputMode="numeric" value={desk} onChange={(event) => setDesk(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("rvmReaders")}</span>
          <select className="c4-field" aria-label={v4("rvmReaders")} value={readerOn} onChange={(event) => setReaderFilter(event.target.value)}>
            <option value="all">{v4("rvmAllReaders")}</option>
            <option value="blank">{v4("rvmBlankReader")}</option>
            {readers.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("rvmClothFilter")}</span>
          <select className="c4-field" aria-label={v4("rvmClothFilter")} value={clothOn} onChange={(event) => setClothFilter(event.target.value)}>
            <option value="all">{v4("rvmAllCloths")}</option>
            <option value="blank">{v4("rvmBlankCloth")}</option>
            {CLOTHS.map((item) => <option key={item} value={item}>{clothName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("rvmFolios")}</span>
          <select className="c4-field" aria-label={v4("rvmFolios")} value={folioOn} onChange={(event) => setFolioFilter(event.target.value)}>
            <option value="all">{v4("rvmAllFolios")}</option>
            <option value="blank">{v4("rvmBlankFolio")}</option>
            {folios.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("rvmStages")}</span>
          <select className="c4-field" aria-label={v4("rvmStages")} value={stageOn} onChange={(event) => setStageFilter(event.target.value)}>
            <option value="all">{v4("rvmAllStages")}</option>
            <option value="blank">{v4("rvmBlankStage")}</option>
            <option value="draft">{v4("rvmDraft")}</option>
            <option value="read">{v4("rvmRead")}</option>
            <option value="seal">{v4("rvmSeal")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("rvmMinutes")}</span>
          <select className="c4-field" aria-label={v4("rvmMinutes")} value={minuteOn} onChange={(event) => setMinuteFilter(event.target.value)}>
            <option value="all">{v4("rvmAllMinutes")}</option>
            {["blank", "night", "day", "eve", "peak", "quiet"].map((item) => <option key={item} value={item}>{minuteName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("rvmPagesFilter")}</span>
          <select className="c4-field" aria-label={v4("rvmPagesFilter")} value={pagesOn} onChange={(event) => setPagesFilter(event.target.value)}>
            <option value="all">{v4("rvmAllPages")}</option>
            <option value="blank">{v4("rvmBlankPages")}</option>
            <option value="2">{v4("rvmPages2")}</option>
            <option value="6">{v4("rvmPages6")}</option>
            <option value="12">{v4("rvmPages12")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("rvmSpans")}</span>
          <select className="c4-field" aria-label={v4("rvmSpans")} value={spanOn} onChange={(event) => setSpanFilter(event.target.value)}>
            <option value="all">{v4("rvmAllSpans")}</option>
            <option value="blank">{v4("rvmBlankSpan")}</option>
            <option value="2">{v4("rvmSpan2")}</option>
            <option value="4">{v4("rvmSpan4")}</option>
            <option value="9">{v4("rvmSpan9")}</option>
          </select>
        </label>
      </div>
      <div className="c4-row">
        {(["open", "parked", "filed"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} aria-pressed={tray === item} onClick={() => setTray(item)}>
            {item === "open" ? v4("rvmOpen") : item === "parked" ? v4("rvmParked") : v4("rvmFiled")}
          </button>
        ))}
        <button type="button" className="c4-chip" data-on={draftOnly ? "1" : "0"} aria-pressed={draftOnly} onClick={() => setDraftOnly((on) => !on)}>{v4("rvmDraftOnly")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} aria-pressed={quietOnly} onClick={() => setQuietOnly((on) => !on)}>{v4("rvmQuietOnly")}</button>
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} aria-pressed={houseOnly} onClick={() => setHouseOnly((on) => !on)}>{houseOnly ? v4("rvmHouseAll") : v4("rvmHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard((mode) => mode === "cards" ? "timeline" : "cards")}>{board === "cards" ? v4("rvmTimeline") : v4("rvmCards")}</button>
      </div>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        storeViews(addReviewView(views, {
          id: `view-${Date.now()}`,
          name: viewName,
          tray,
          query,
          reader: readerOn,
          cloth: clothOn,
          folio: folioOn,
          stage: stageOn,
          minute: minuteOn,
          pages: pagesOn,
          span: spanOn,
        }));
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("rvmViewName")}</span>
          <input className="c4-field" aria-label={v4("rvmViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("rvmSaveView")}</button>
      </form>
      {!!views.length && (
        <ul className="c4-rvm-views" aria-label={v4("rvmViews")}>
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => {
                setTray(view.tray);
                setQuery(view.query);
                setReaderFilter(view.reader);
                setClothFilter(view.cloth);
                setFolioFilter(view.folio);
                setStageFilter(view.stage);
                setMinuteFilter(view.minute);
                setPagesFilter(view.pages);
                setSpanFilter(view.span);
              }}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropReviewView(views, view.id))}>{v4("rvmDropView")}</button>
            </li>
          ))}
        </ul>
      )}
      <div className="c4-row">
        <button type="button" className="c4-btn" onClick={() => setPicked(shown.map((card) => card.id))}>{v4("rvmPickAll")}</button>
        <button type="button" className="c4-btn" onClick={() => setPicked([])}>{v4("rvmPickNone")}</button>
        <p className="c4-meta">{v4("rvmPicked")} · {picked.length}</p>
        <label className="c4-lab"><span>{v4("rvmBulkCloth")}</span>
          <select className="c4-field" aria-label={v4("rvmBulkCloth")} value={moveCloth} disabled={viewer} onChange={(event) => setMoveCloth(event.target.value)}>
            {CLOTHS.map((item) => <option key={item} value={item}>{clothName(v4, item)}</option>)}
          </select>
        </label>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkReviewCloth(cards, picked, moveCloth))}>{v4("rvmBulkCloth")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkReviewPin(cards, picked, true))}>{v4("rvmBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkReviewFile(cards, picked, true))}>{v4("rvmBulkFile")}</button>
        <button type="button" className="c4-btn" onClick={() => download("review-minutes.csv", reviewsCsv(cards, desk))}>{v4("rvmCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetReviews())}>{v4("rvmReset")}</button>
      </div>
      {board === "timeline" ? (
        <ol className="c4-rvm-timeline">
          {timeline.map((card) => (
            <li key={card.id}>
              <strong>{card.minute}</strong> {card.title}
              <span className="c4-meta"> {gapLabel(v4, card.minute, desk)}</span>
            </li>
          ))}
          {!timeline.length && <li className="c4-empty-gold">{v4("rvmEmpty")}</li>}
        </ol>
      ) : (
        <ul className="c4-rvm-cards">
          {shown.map((card) => {
            const openEdit = editing === card.id;
            const gap = gapLabel(v4, card.minute, desk);
            const late = lateReview(card, desk);
            const soon = soonReview(card);
            return (
              <li key={card.id} data-late={late ? "1" : "0"} data-soon={soon ? "1" : "0"} data-house={houseFolio(card.folio) ? "1" : "0"} data-cloth={card.cloth || "blank"}>
                <label className="c4-row">
                  <input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                  {openEdit ? (
                    <span className="c4-stack">
                      <input className="c4-field" aria-label={v4("rvmLine")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <input className="c4-field" aria-label={v4("rvmNote")} value={noteDraft} disabled={viewer} onChange={(event) => setNoteDraft(event.target.value)} />
                    </span>
                  ) : <strong>{card.title}</strong>}
                </label>
                <p className="c4-meta">{card.reader || v4("rvmBlankReader")} · {card.minute ?? v4("rvmBlankMinute")} · {clothName(v4, card.cloth)} · {card.folio || v4("rvmBlankFolio")} · {stageName(v4, card.stage)} · {pagesName(v4, card.pages)} · {spanName(v4, card.span)}</p>
                {card.note && !openEdit && <p>{card.note}</p>}
                <p className="c4-meta">{gap} {auditName(v4, card.audit)}</p>
                <div className="c4-row">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setReviewPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("rvmUnpin") : v4("rvmPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setReviewPark(cards, card.id, !card.parked))}>{card.parked ? v4("rvmLift") : v4("rvmPark")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setReviewFile(cards, card.id, !card.filed))}>{card.filed ? v4("rvmReopen") : v4("rvmFile")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleStage(cards, card.id))}>{v4("rvmStageUp")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
                    if (openEdit) {
                      store(editReviewNote(editReview(cards, card.id, draft), card.id, noteDraft));
                      setEditing("");
                      return;
                    }
                    setEditing(card.id);
                    setDraft(card.title);
                    setNoteDraft(card.note);
                  }}>{openEdit ? v4("rvmAdd") : v4("rvmEdit")}</button>
                  <button type="button" className="c4-btn" onClick={() => {
                    void navigator.clipboard?.writeText(reviewCopy(card));
                    setCopied(card.id);
                  }}>{copied === card.id ? v4("rvmCopied") : v4("rvmCopy")}</button>
                </div>
              </li>
            );
          })}
          {!shown.length && <li className="c4-empty-gold">{v4("rvmEmpty")}</li>}
        </ul>
      )}
      <p className="c4-meta">{v4("rvmRules")}</p>
    </section>
  );
}

export function NoticeCrests({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [band, setBand] = useState("all");
  const [voice, setVoice] = useState("all");
  const [shape, setShape] = useState<CrestShape>("all");
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
    note: { campaign: user.campaign ?? null },
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
    const present = presentCrests(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenCrests(readJson(CREST_KEY, []), present);
    const nextReviewed = readReviewedCrests(readJson(CREST_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(CREST_KEY, nextHidden);
    writeJson(CREST_REVIEW_KEY, nextReviewed);
  }, [rows]);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "n" || event.key === "N" || event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const present = presentCrests(rows);
  const bands = visibleCrestBands(present, hidden, showHidden);
  const bandOn = activeCrestBand(band, present);
  const voiceOn = activeCrestVoice(voice);
  const shown = visibleCrestCustomers(rows, crestBandArg(bandOn), crestVoiceArg(voiceOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = crestState(row.note);
      const token = state === "set" ? crestBand(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return bands.includes(token);
    });
  const lead = leadingCrest(rows);
  const voiceLead = leadingCrestVoice(rows);
  const shared = sharedCrestCount(rows);
  const catalog = catalogCrestCount(rows);
  const bars = crestBands(rows).filter((line) => line.band);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(CREST_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedCrests(next, ids);
    setReviewed(saved);
    writeJson(CREST_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-nct" aria-label={v4("nctTitle")} data-crests="1" data-role={role} data-catalog={catalog ? "1" : "0"}>
      <header className="c4-nct-mast">
        <div>
          <p className="c4-nct-kicker">{v4("nctSub")}</p>
          <h2 className="c4-title">{v4("nctTitle")}</h2>
        </div>
        <p className="c4-nct-plate" data-logo="mono">{v4("nctLogo")}</p>
      </header>
      <p className="c4-nct-rules">{v4("nctHint")}</p>
      <p className="c4-meta">{v4("nctKept")} {v4("nctEscape")}</p>
      {viewer && <p className="c4-nct-notice" data-viewer="1">{v4("nctViewer")}</p>}
      {data.error && <p className="c4-empty-gold" role="alert">{v4("nctFailed")}</p>}
      {data.loading && <p className="c4-meta">{v4("nctLoading")}</p>}
      {shared > 0 && <p className="c4-nct-notice" role="status">{v4("nctNotice")} · {shared}</p>}
      <dl className="c4-nct-kpi" aria-label={v4("nctKpi")}>
        <div><dt>{v4("nctSet")}</dt><dd>{rows.filter((row) => crestState(row.note) === "set").length}</dd></div>
        <div><dt>{v4("nctCatalog")}</dt><dd>{catalog}</dd></div>
        <div><dt>{v4("nctWide")}</dt><dd>{wideCrestCount(rows)}</dd></div>
        <div><dt>{v4("nctVowel")}</dt><dd>{vowelCrestCount(rows)}</dd></div>
        <div><dt>{v4("nctShare")}</dt><dd>{crestShare(catalog, rows.length)}%</dd></div>
        <div><dt>{v4("nctShared")}</dt><dd>{shared}</dd></div>
      </dl>
      <div className="c4-nct-chart" aria-label={v4("nctBands")}>
        {bars.map((bar) => (
          <div key={bar.band} className="c4-nct-col">
            <div className="c4-nct-track" aria-hidden="true"><i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            <button type="button" className="c4-btn" onClick={() => setBand(bar.band)}>{bandName(v4, bar.band)} · {bar.count}</button>
          </div>
        ))}
        {!bars.length && <p className="c4-empty-gold">{v4("nctEmpty")}</p>}
      </div>
      <p className="c4-meta">{lead ? `${v4("nctLeading")} · ${bandName(v4, lead)}` : v4("nctLeadingNone")} · {voiceLead ? `${v4("nctVoiceLead")} · ${voiceName(v4, voiceLead)}` : v4("nctVoiceNone")} · {shared ? `${v4("nctShared")} · ${shared}` : v4("nctSharedNone")}</p>
      <div className="c4-nct-filters">
        <label className="c4-lab"><span>{v4("nctSearch")}</span>
          <input ref={searchRef} className="c4-field" aria-label={v4("nctSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            setQuery("");
          }} />
        </label>
        <label className="c4-lab"><span>{v4("nctBands")}</span>
          <select className="c4-field" aria-label={v4("nctBands")} value={bandOn} onChange={(event) => setBand(event.target.value)}>
            <option value="all">{v4("nctAll")}</option>
            <option value="blank">{v4("nctClear")}</option>
            {BANDS.map((item) => <option key={item} value={item}>{bandName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("nctVoice")}</span>
          <select className="c4-field" aria-label={v4("nctVoice")} value={voiceOn} onChange={(event) => setVoice(event.target.value)}>
            <option value="all">{v4("nctAll")}</option>
            <option value="vowel">{v4("nctVowel")}</option>
            <option value="plain">{v4("nctPlain")}</option>
          </select>
        </label>
      </div>
      <div className="c4-row">
        {(["all", "catalog", "wide", "vowel"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} aria-pressed={shape === item} onClick={() => setShape(item)}>
            {item === "all" ? v4("nctAllShapes") : item === "catalog" ? v4("nctCatalog") : item === "wide" ? v4("nctWide") : v4("nctVowel")}
          </button>
        ))}
        {(["all", "reviewed", "open"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} aria-pressed={review === item} onClick={() => setReview(item)}>
            {item === "all" ? v4("nctAllReview") : item === "reviewed" ? v4("nctReviewed") : v4("nctOpenReview")}
          </button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("nctShown") : v4("nctHidden")}</button>
      </div>
      <ul className="c4-nct-bands" aria-label={v4("nctBands")}>
        {present.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleCrest(hidden, item, present))}>{bandName(v4, item)} · {hidden.includes(item) ? v4("nctShow") : v4("nctHide")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-row">
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkCrestReview(reviewed, shown.map((row) => row.id), ids, true))}>{v4("nctBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkCrestReview(reviewed, shown.map((row) => row.id), ids, false))}>{v4("nctBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("notice-crests.csv", crestsCsv(rows))}>{v4("nctCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("notice-crest-rows.csv", crestRowsCsv(shown, reviewed))}>{v4("nctRowCsv")}</button>
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("nctCustomers")}</Link>
      </div>
      <ul className="c4-nct-rows">
        {shown.map((row) => {
          const code = crestCopy(row.note);
          const marked = reviewed.includes(row.id);
          return (
            <li key={row.id} data-band={crestBand(row.note) || "blank"} data-voice={crestVoice(row.note) || "blank"} data-catalog={catalogCrest(row.note) ? "1" : "0"} data-reviewed={marked ? "1" : "0"}>
              <strong>{row.label}</strong>
              <p className="c4-meta">{code || v4("nctClear")} · {bandName(v4, crestBand(row.note) || (crestState(row.note) === "clear" ? "blank" : ""))} · {voiceName(v4, crestVoice(row.note))} {catalogCrest(row.note) ? `· ${v4("nctCatalogMark")}` : ""}</p>
              <div className="c4-row">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleCrestReview(reviewed, row.id, ids))}>{marked ? v4("nctReviewed") : v4("nctReview")}</button>
                <button type="button" className="c4-btn" disabled={!code} onClick={() => {
                  if (!code) return;
                  void navigator.clipboard?.writeText(code);
                  setCopied(row.id);
                }}>{copied === row.id ? v4("nctCopied") : v4("nctCopy")}</button>
              </div>
            </li>
          );
        })}
        {!data.loading && !shown.length && <li className="c4-empty-gold">{v4("nctEmpty")}</li>}
      </ul>
      <p className="c4-meta">{v4("nctRules")}</p>
    </section>
  );
}
