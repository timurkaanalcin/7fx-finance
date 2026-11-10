"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  HOOK_KEY,
  HOOK_VIEW_KEY,
  LANE_KEY,
  LANE_REVIEW_KEY,
  activeBay,
  activeCloth,
  activeGrade,
  activePause,
  activeReviewer,
  activeSeal,
  activeTempo,
  activeTongueBand,
  activeTongueParity,
  addHook,
  addHookView,
  bayArg,
  bayGap,
  bulkHookCloth,
  bulkHookDone,
  bulkHookPin,
  bulkTongueReview,
  catalogTongue,
  catalogTongueCount,
  clashBayCount,
  clothArg,
  clothCounts,
  cycleTempo,
  dropHookView,
  editHook,
  editHookNote,
  evenTongue,
  evenTongueCount,
  fairReviewer,
  gradeArg,
  gradeClashCount,
  homeSeal,
  hookCopy,
  hookCounts,
  hookReviewers,
  hookSeals,
  hookShare,
  hookTempos,
  hookTimeline,
  hooksCsv,
  lateHook,
  nextHook,
  pauseArg,
  presentTongues,
  readHiddenTongues,
  readHookViews,
  readHooks,
  readReviewedTongues,
  resetHooks,
  reviewerArg,
  sealArg,
  setHookDone,
  setHookHold,
  setHookPin,
  sharedTongueCount,
  soonHook,
  suggestCloth,
  suggestPause,
  suggestReviewer,
  tempoArg,
  toggleTongue,
  toggleTongueReview,
  tongueBand,
  tongueBandArg,
  tongueCopy,
  tongueParity,
  tongueParityArg,
  tongueRowsCsv,
  tongueShare,
  tongueState,
  tonguesCsv,
  usedBays,
  visibleHooks,
  visibleTongueBands,
  visibleTongueCustomers,
  wideTongue,
  wideTongueCount,
  leadingTongue,
  leadingTongueParity,
  type Hook,
  type HookCloth,
  type HookTempo,
  type HookTray,
  type HookView,
  type LaneRow,
  type LaneShape,
} from "@/lib/crmv4/round189";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  language?: string | null;
};

type GlanceRow = LaneRow & { id: string };

const CLOTHS = ["ivory", "graphite", "champagne", "ink"] as const;
const BANDS = ["root", "slip", "card", "roll"] as const;

function clothName(v4: V4, cloth: HookCloth | string): string {
  if (cloth === "ivory") return v4("ghkIvory");
  if (cloth === "graphite") return v4("ghkGraphite");
  if (cloth === "champagne") return v4("ghkChampagne");
  if (cloth === "ink") return v4("ghkInk");
  return v4("ghkBlankCloth");
}

function tempoName(v4: V4, tempo: HookTempo | string): string {
  if (tempo === "calm") return v4("ghkTempoCalm");
  if (tempo === "steady") return v4("ghkTempoSteady");
  if (tempo === "swift") return v4("ghkTempoSwift");
  return v4("ghkBlankTempo");
}

function bayName(v4: V4, name: string): string {
  if (name === "first") return v4("ghkFirst");
  if (name === "mid") return v4("ghkMid");
  if (name === "last") return v4("ghkLast");
  if (name === "peak") return v4("ghkPeak");
  if (name === "quiet") return v4("ghkQuiet");
  if (/^(?:[1-9]|1[0-2])$/.test(name)) return name;
  return v4("ghkBlankBay");
}

function gradeName(v4: V4, grade: number | null): string {
  if (grade === 1) return v4("ghkGrade1");
  if (grade === 2) return v4("ghkGrade2");
  if (grade === 3) return v4("ghkGrade3");
  return v4("ghkBlankGrade");
}

function pauseName(v4: V4, pause: number | null): string {
  if (pause === 2) return v4("ghkPause2");
  if (pause === 5) return v4("ghkPause5");
  if (pause === 10) return v4("ghkPause10");
  return v4("ghkBlankPause");
}

function bandName(v4: V4, name: string): string {
  if (name === "root") return v4("llnRoot");
  if (name === "slip") return v4("llnSlip");
  if (name === "card") return v4("llnCard");
  if (name === "roll") return v4("llnRoll");
  if (name === "blank") return v4("llnClear");
  return v4("llnUnmarked");
}

function parityName(v4: V4, name: string): string {
  if (name === "even") return v4("llnEven");
  if (name === "odd") return v4("llnOdd");
  return v4("llnUnmarked");
}

function auditName(v4: V4, audit: string): string {
  const key = {
    save: "ghkAuditSave",
    edit: "ghkAuditEdit",
    tempo: "ghkAuditTempo",
    pin: "ghkAuditPin",
    unpin: "ghkAuditUnpin",
    hold: "ghkAuditHold",
    lift: "ghkAuditLift",
    done: "ghkAuditDone",
    reopen: "ghkAuditReopen",
    cloth: "ghkAuditCloth",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, bay: number | null, desk: string): string {
  const gap = bayGap(bay, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("ghkPast")} ${gap}`;
  if (gap < 0) return `${v4("ghkAhead")} ${Math.abs(gap)}`;
  return v4("ghkDue");
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

export function GalleryHooks({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<Hook[]>([]);
  const [views, setViews] = useState<HookView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [reviewer, setReviewer] = useState("");
  const [bay, setBay] = useState("");
  const [cloth, setCloth] = useState("");
  const [seal, setSeal] = useState("");
  const [tempo, setTempo] = useState("");
  const [grade, setGrade] = useState("");
  const [pause, setPause] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<HookTray>("open");
  const [reviewerFilter, setReviewerFilter] = useState("all");
  const [clothFilter, setClothFilter] = useState("all");
  const [sealFilter, setSealFilter] = useState("all");
  const [tempoFilter, setTempoFilter] = useState("all");
  const [bayFilter, setBayFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [pauseFilter, setPauseFilter] = useState("all");
  const [calmOnly, setCalmOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [homeOnly, setHomeOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [desk, setDesk] = useState("");
  const [moveCloth, setMoveCloth] = useState("ivory");
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readHooks(readJson(HOOK_KEY, []));
    const saved = readHookViews(readJson(HOOK_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(HOOK_KEY, next);
    writeJson(HOOK_VIEW_KEY, saved);
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
  function store(next: Hook[]) {
    const saved = readHooks(next);
    setCards(saved);
    writeJson(HOOK_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((card) => card.id === id)));
  }
  const reviewers = hookReviewers(cards);
  const seals = hookSeals(cards);
  const tempos = hookTempos(cards);
  const bars = clothCounts(cards);
  const reviewerOn = activeReviewer(reviewerFilter, reviewers);
  const clothOn = activeCloth(clothFilter, CLOTHS);
  const sealOn = activeSeal(sealFilter, seals);
  const tempoOn = activeTempo(tempoFilter, tempos);
  const bayOn = activeBay(bayFilter);
  const gradeOn = activeGrade(gradeFilter);
  const pauseOn = activePause(pauseFilter);
  const pickedBay = bayArg(bayOn);
  const shown = visibleHooks(
    cards,
    tray,
    query,
    reviewerArg(reviewerOn),
    clothArg(clothOn),
    sealArg(sealOn),
    tempoArg(tempoOn),
    pickedBay.exact,
    pickedBay.pick,
    gradeArg(gradeOn),
    pauseArg(pauseOn),
    calmOnly,
    peakOnly,
    homeOnly,
  );
  const timeline = hookTimeline(cards, query);
  const counts = hookCounts(cards, desk);
  const clashes = clashBayCount(cards);
  const grades = gradeClashCount(cards);
  const nextId = nextHook(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const suggestedCloth = suggestCloth(cards);
  const suggestedReviewer = suggestReviewer(cards);
  const suggestedPause = suggestPause(cards);
  const fair = fairReviewer(cards, roster);
  const total = cards.length;
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  function clearDraft() {
    setTitle("");
    setNote("");
    setReviewer("");
    setBay("");
    setCloth("");
    setSeal("");
    setTempo("");
    setGrade("");
    setPause("");
    setQuery("");
    setEditing("");
  }
  return (
    <section className="c4-ghk" aria-label={v4("ghkTitle")} data-hooks="1" data-role={role}>
      <header className="c4-ghk-mast">
        <div>
          <p className="c4-ghk-kicker">{v4("ghkSub")}</p>
          <h2 className="c4-title">{v4("ghkTitle")}</h2>
        </div>
        <p className="c4-ghk-plate" data-logo="mono">{v4("ghkLogo")}</p>
      </header>
      <p className="c4-ghk-rules">{v4("ghkHint")}</p>
      <p className="c4-meta">{v4("ghkLocal")}</p>
      <p className="c4-meta">{v4("ghkNew")} {v4("ghkSlash")} {v4("ghkEscape")}</p>
      {viewer && <p className="c4-ghk-notice" data-viewer="1">{v4("ghkViewer")}</p>}
      {counts.peak > 0 && (
        <div className="c4-ghk-bells">
          <p className="c4-ghk-notice">{v4("ghkNotice")} · {counts.peak}</p>
          <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("ghkNoticeAll") : v4("ghkNoticePeak")}</button>
        </div>
      )}
      <dl className="c4-ghk-kpi" aria-label={v4("ghkKpi")}>
        <div><dt>{v4("ghkOpen")}</dt><dd>{counts.open}</dd></div>
        <div><dt>{v4("ghkHeld")}</dt><dd>{counts.held}</dd></div>
        <div><dt>{v4("ghkDone")}</dt><dd>{counts.done}</dd></div>
        <div><dt>{v4("ghkPinned")}</dt><dd>{counts.pinned}</dd></div>
        <div><dt>{v4("ghkPeak")}</dt><dd>{counts.peak}</dd></div>
        <div><dt>{v4("ghkLate")}</dt><dd>{counts.late}</dd></div>
        <div><dt>{v4("ghkSoon")}</dt><dd>{counts.soon}</dd></div>
        <div><dt>{v4("ghkHomeShare")}</dt><dd>{hookShare(counts.home, total)}%</dd></div>
      </dl>
      <div className="c4-ghk-chart" aria-label={v4("ghkCloths")}>
        {bars.map((bar) => (
          <div key={bar.cloth} className="c4-ghk-col" data-on={clothOn === bar.cloth ? "1" : "0"}>
            <span className="c4-ghk-swatch" data-cloth={bar.cloth} />
            <div className="c4-ghk-track" aria-hidden="true"><i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            <button type="button" className="c4-btn" onClick={() => setClothFilter(bar.cloth)}>{clothName(v4, bar.cloth)} · {bar.count}</button>
          </div>
        ))}
        {!bars.length && <p className="c4-empty-gold">{v4("ghkEmpty")}</p>}
      </div>
      <div className="c4-ghk-suggest">
        <p>{v4("ghkSuggestCloth")} · {clothName(v4, suggestedCloth)}</p>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setCloth(suggestedCloth)}>{v4("ghkUseCloth")}</button>
        <p>{v4("ghkSuggestReviewer")} · {suggestedReviewer || v4("ghkBlankReviewer")}</p>
        <button type="button" className="c4-btn" disabled={viewer || !suggestedReviewer} onClick={() => setReviewer(suggestedReviewer)}>{v4("ghkUseReviewer")}</button>
        <p>{v4("ghkSuggestPause")} · {pauseName(v4, suggestedPause)}</p>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setPause(String(suggestedPause))}>{v4("ghkUsePause")}</button>
        <p>{v4("ghkAssign")} · {fair || v4("ghkBlankReviewer")}</p>
        <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setReviewer(fair)}>{v4("ghkAssign")}</button>
      </div>
      <p className="c4-meta">{v4("ghkBayUse")} · {usedBays(cards)} · {clashes ? `${v4("ghkClash")} · ${clashes}` : v4("ghkClashNone")} · {grades ? `${v4("ghkGradeClash")} · ${grades}` : v4("ghkGradeClashNone")}</p>
      <p className="c4-meta">{v4("ghkNext")} · {nextCard ? nextCard.title : v4("ghkNextNone")}</p>
      <form className="c4-ghk-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addHook(cards, { id: `ghk-${Date.now()}`, title, note, reviewer, bay, cloth, seal, tempo, grade, pause });
        if (next.length === cards.length && title.trim()) return;
        store(next);
        setTitle("");
        setNote("");
      }}>
        <label className="c4-lab"><span>{v4("ghkLine")}</span>
          <input ref={titleRef} className="c4-field" aria-label={v4("ghkLine")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab"><span>{v4("ghkNote")}</span>
          <input className="c4-field" aria-label={v4("ghkNote")} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("ghkReviewer")}</span>
          <input className="c4-field" aria-label={v4("ghkReviewer")} value={reviewer} disabled={viewer} onChange={(event) => setReviewer(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("ghkBay")}</span>
          <input className="c4-field" aria-label={v4("ghkBay")} inputMode="numeric" value={bay} disabled={viewer} onChange={(event) => setBay(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("ghkCloth")}</span>
          <select className="c4-field" aria-label={v4("ghkCloth")} value={cloth} disabled={viewer} onChange={(event) => setCloth(event.target.value)}>
            <option value="">{v4("ghkBlankCloth")}</option>
            {CLOTHS.map((item) => <option key={item} value={item}>{clothName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("ghkSeal")}</span>
          <input className="c4-field" aria-label={v4("ghkSeal")} value={seal} disabled={viewer} onChange={(event) => setSeal(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("ghkTempo")}</span>
          <select className="c4-field" aria-label={v4("ghkTempo")} value={tempo} disabled={viewer} onChange={(event) => setTempo(event.target.value)}>
            <option value="">{v4("ghkBlankTempo")}</option>
            <option value="calm">{v4("ghkTempoCalm")}</option>
            <option value="steady">{v4("ghkTempoSteady")}</option>
            <option value="swift">{v4("ghkTempoSwift")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("ghkGrade")}</span>
          <input className="c4-field" aria-label={v4("ghkGrade")} inputMode="numeric" value={grade} disabled={viewer} onChange={(event) => setGrade(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("ghkPause")}</span>
          <input className="c4-field" aria-label={v4("ghkPause")} inputMode="numeric" value={pause} disabled={viewer} onChange={(event) => setPause(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("ghkRoster")}</span>
          <input className="c4-field" aria-label={v4("ghkRoster")} value={roster} disabled={viewer} onChange={(event) => setRoster(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn c4-btn-hot" disabled={viewer}>{v4("ghkAdd")}</button>
      </form>
      <p className="c4-meta">{v4("ghkBlank")} {v4("ghkBayBlank")}</p>
      <div className="c4-ghk-filters">
        {(["open", "held", "done"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>
            {item === "open" ? v4("ghkOpen") : item === "held" ? v4("ghkHeld") : v4("ghkDone")}
          </button>
        ))}
        <label className="c4-lab"><span>{v4("ghkSearch")}</span>
          <input ref={searchRef} className="c4-field" aria-label={v4("ghkSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab"><span>{v4("ghkDeskBay")}</span>
          <input className="c4-field" aria-label={v4("ghkDeskBay")} inputMode="numeric" value={desk} onChange={(event) => setDesk(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("ghkReviewers")}</span>
          <select className="c4-field" aria-label={v4("ghkAllReviewers")} value={reviewerOn} onChange={(event) => setReviewerFilter(event.target.value)}>
            <option value="all">{v4("ghkAllReviewers")}</option>
            <option value="blank">{v4("ghkBlankReviewer")}</option>
            {reviewers.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("ghkCloths")}</span>
          <select className="c4-field" aria-label={v4("ghkCloths")} value={clothOn} onChange={(event) => setClothFilter(event.target.value)}>
            <option value="all">{v4("ghkCloths")}</option>
            <option value="blank">{v4("ghkBlankCloth")}</option>
            {CLOTHS.map((item) => <option key={item} value={item}>{clothName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("ghkSeals")}</span>
          <select className="c4-field" aria-label={v4("ghkAllSeals")} value={sealOn} onChange={(event) => setSealFilter(event.target.value)}>
            <option value="all">{v4("ghkAllSeals")}</option>
            <option value="blank">{v4("ghkBlankSeal")}</option>
            {seals.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("ghkTempos")}</span>
          <select className="c4-field" aria-label={v4("ghkAllTempos")} value={tempoOn} onChange={(event) => setTempoFilter(event.target.value)}>
            <option value="all">{v4("ghkAllTempos")}</option>
            <option value="blank">{v4("ghkBlankTempo")}</option>
            {tempos.map((item) => <option key={item} value={item}>{tempoName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("ghkBays")}</span>
          <select className="c4-field" aria-label={v4("ghkAllBays")} value={bayOn} onChange={(event) => setBayFilter(event.target.value)}>
            <option value="all">{v4("ghkAllBays")}</option>
            {["blank", "first", "mid", "last", "peak", "quiet", "1", "6", "9", "12"].map((item) => <option key={item} value={item}>{bayName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("ghkGrades")}</span>
          <select className="c4-field" aria-label={v4("ghkAllGrades")} value={gradeOn} onChange={(event) => setGradeFilter(event.target.value)}>
            <option value="all">{v4("ghkAllGrades")}</option>
            <option value="blank">{v4("ghkBlankGrade")}</option>
            <option value="1">{v4("ghkGrade1")}</option>
            <option value="2">{v4("ghkGrade2")}</option>
            <option value="3">{v4("ghkGrade3")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("ghkPauses")}</span>
          <select className="c4-field" aria-label={v4("ghkAllPauses")} value={pauseOn} onChange={(event) => setPauseFilter(event.target.value)}>
            <option value="all">{v4("ghkAllPauses")}</option>
            <option value="blank">{v4("ghkBlankPause")}</option>
            <option value="2">{v4("ghkPause2")}</option>
            <option value="5">{v4("ghkPause5")}</option>
            <option value="10">{v4("ghkPause10")}</option>
          </select>
        </label>
        <button type="button" className="c4-chip" data-on={calmOnly ? "1" : "0"} onClick={() => setCalmOnly((on) => !on)}>{v4("ghkCalmOnly")}</button>
        <button type="button" className="c4-chip" data-on={homeOnly ? "1" : "0"} onClick={() => setHomeOnly((on) => !on)}>{homeOnly ? v4("ghkHomeOnly") : v4("ghkHomeAll")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard((item) => item === "cards" ? "timeline" : "cards")}>{board === "cards" ? v4("ghkTimeline") : v4("ghkCards")}</button>
      </div>
      <form className="c4-ghk-views" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addHookView(views, {
          id: `view-${Date.now()}`,
          name: viewName,
          tray,
          query,
          reviewer: reviewerOn,
          cloth: clothOn,
          seal: sealOn,
          tempo: tempoOn,
          bay: bayOn,
          grade: gradeOn,
          pause: pauseOn,
        });
        setViews(next);
        writeJson(HOOK_VIEW_KEY, next);
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("ghkViewName")}</span>
          <input className="c4-field" aria-label={v4("ghkViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("ghkSaveView")}</button>
        <ul aria-label={v4("ghkViews")}>
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => {
                setTray(view.tray);
                setQuery(view.query);
                setReviewerFilter(view.reviewer);
                setClothFilter(view.cloth);
                setSealFilter(view.seal);
                setTempoFilter(view.tempo);
                setBayFilter(view.bay);
                setGradeFilter(view.grade);
                setPauseFilter(view.pause);
              }}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
                const next = dropHookView(views, view.id);
                setViews(next);
                writeJson(HOOK_VIEW_KEY, next);
              }}>{v4("ghkDropView")}</button>
            </li>
          ))}
        </ul>
      </form>
      <div className="c4-row">
        <button type="button" className="c4-btn" onClick={() => setPicked(shown.map((card) => card.id))}>{v4("ghkPickAll")}</button>
        <button type="button" className="c4-btn" onClick={() => setPicked([])}>{v4("ghkPickNone")}</button>
        <span className="c4-meta">{v4("ghkPicked")} · {picked.length}</span>
        <select className="c4-field" aria-label={v4("ghkBulkCloth")} value={moveCloth} disabled={viewer} onChange={(event) => setMoveCloth(event.target.value)}>
          {CLOTHS.map((item) => <option key={item} value={item}>{clothName(v4, item)}</option>)}
        </select>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkHookCloth(cards, picked, moveCloth))}>{v4("ghkBulkCloth")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkHookPin(cards, picked, true))}>{v4("ghkBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkHookDone(cards, picked, true))}>{v4("ghkBulkDone")}</button>
        <button type="button" className="c4-btn" onClick={() => download("gallery-hooks.csv", hooksCsv(cards, desk))}>{v4("ghkCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetHooks())}>{v4("ghkReset")}</button>
      </div>
      {board === "timeline" ? (
        <ol className="c4-ghk-timeline" aria-label={v4("ghkTimeline")}>
          {timeline.map((card) => <li key={card.id} data-bay={card.bay}>{card.bay} · {card.title}</li>)}
          {!timeline.length && <li className="c4-empty-gold">{v4("ghkEmpty")}</li>}
        </ol>
      ) : (
        <ul className="c4-ghk-cards">
          {shown.map((card) => {
            const openEdit = editing === card.id;
            return (
              <li key={card.id} data-cloth={card.cloth || "blank"} data-tempo={card.tempo || "blank"} data-pinned={card.pinned ? "1" : "0"} data-late={lateHook(card, desk) ? "1" : "0"} data-soon={soonHook(card) ? "1" : "0"} data-home={homeSeal(card.seal) ? "1" : "0"}>
                <label className="c4-row">
                  <input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={(event) => setPicked((ids) => event.target.checked ? [...ids, card.id] : ids.filter((id) => id !== card.id))} />
                  {openEdit ? (
                    <input className="c4-field" aria-label={v4("ghkEdit")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                  ) : <strong>{card.title}</strong>}
                </label>
                <p className="c4-meta">{card.reviewer || v4("ghkBlankReviewer")} · {card.bay ?? v4("ghkBlankBay")} · {clothName(v4, card.cloth)} · {card.seal || v4("ghkBlankSeal")} · {tempoName(v4, card.tempo)} · {gradeName(v4, card.grade)} · {pauseName(v4, card.pause)}</p>
                {openEdit ? (
                  <input className="c4-field" aria-label={v4("ghkNote")} value={noteDraft} disabled={viewer} onChange={(event) => setNoteDraft(event.target.value)} />
                ) : card.note && <p>{card.note}</p>}
                <p className="c4-meta">{gapLabel(v4, card.bay, desk)} {auditName(v4, card.audit)}</p>
                <div className="c4-row">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setHookPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("ghkUnpin") : v4("ghkPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setHookHold(cards, card.id, !card.held))}>{card.held ? v4("ghkLift") : v4("ghkHold")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setHookDone(cards, card.id, !card.done))}>{card.done ? v4("ghkReopen") : v4("ghkFile")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleTempo(cards, card.id))}>{v4("ghkTempoUp")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
                    if (openEdit) {
                      store(editHookNote(editHook(cards, card.id, draft), card.id, noteDraft));
                      setEditing("");
                      return;
                    }
                    setEditing(card.id);
                    setDraft(card.title);
                    setNoteDraft(card.note);
                  }}>{openEdit ? v4("ghkAdd") : v4("ghkEdit")}</button>
                  <button type="button" className="c4-btn" onClick={() => {
                    void navigator.clipboard?.writeText(hookCopy(card));
                    setCopied(card.id);
                  }}>{copied === card.id ? v4("ghkCopied") : v4("ghkCopy")}</button>
                </div>
              </li>
            );
          })}
          {!shown.length && <li className="c4-empty-gold">{v4("ghkEmpty")}</li>}
        </ul>
      )}
      <p className="c4-meta">{v4("ghkRules")}</p>
    </section>
  );
}

export function LanguageLanes({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [band, setBand] = useState("all");
  const [parity, setParity] = useState("all");
  const [shape, setShape] = useState<LaneShape>("all");
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
    note: { language: user.language ?? null },
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
    const present = presentTongues(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenTongues(readJson(LANE_KEY, []), present);
    const nextReviewed = readReviewedTongues(readJson(LANE_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(LANE_KEY, nextHidden);
    writeJson(LANE_REVIEW_KEY, nextReviewed);
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
  const present = presentTongues(rows);
  const bandOn = activeTongueBand(band, present);
  const parityOn = activeTongueParity(parity);
  const bands = visibleTongueBands(present, hidden, showHidden);
  const shown = visibleTongueCustomers(rows, tongueBandArg(bandOn), tongueParityArg(parityOn), query, review, reviewed, shape).filter((row) => {
    const state = tongueState(row.note);
    if (state === "") return bandOn === "all" && !showHidden;
    const token = state === "set" ? tongueBand(row.note) : "blank";
    return bands.includes(token);
  });
  const lead = leadingTongue(rows);
  const leadParity = leadingTongueParity(rows);
  const shared = sharedTongueCount(rows);
  const setCount = rows.filter((row) => tongueState(row.note) === "set").length;
  return (
    <section className="c4-lng" aria-label={v4("llnTitle")} data-lanes="1" data-role={role}>
      <header className="c4-lng-mast">
        <div>
          <p className="c4-lng-kicker">{v4("llnSub")}</p>
          <h2 className="c4-title">{v4("llnTitle")}</h2>
        </div>
        <p className="c4-lng-plate" data-logo="mono">{v4("llnLogo")}</p>
      </header>
      <p className="c4-lng-rules">{v4("llnHint")}</p>
      <p className="c4-meta">{v4("llnKept")} {v4("llnEscape")}</p>
      {viewer && <p className="c4-lng-notice">{v4("llnViewer")}</p>}
      {data.error && <p className="c4-empty-gold">{v4("llnFailed")}</p>}
      {data.loading && <p className="c4-meta">{v4("llnLoading")}</p>}
      {!data.loading && !rows.length && <p className="c4-empty-gold">{v4("llnNone")}</p>}
      <dl className="c4-ghk-kpi" aria-label={v4("llnSetNotice")}>
        <div><dt>{v4("llnCustomers")}</dt><dd>{rows.length}</dd></div>
        <div><dt>{v4("llnSetNotice")}</dt><dd>{setCount}</dd></div>
        <div><dt>{v4("llnShare")}</dt><dd>{tongueShare(setCount, rows.length)}%</dd></div>
        <div><dt>{v4("llnShared")}</dt><dd>{shared}</dd></div>
        <div><dt>{v4("llnLeadBand")}</dt><dd>{lead ? bandName(v4, lead) : v4("llnUnmarked")}</dd></div>
        <div><dt>{v4("llnLeadParity")}</dt><dd>{leadParity ? parityName(v4, leadParity) : v4("llnUnmarked")}</dd></div>
        <div><dt>{v4("llnCatalog")}</dt><dd>{catalogTongueCount(rows)}</dd></div>
        <div><dt>{v4("llnWide")}</dt><dd>{wideTongueCount(rows)}</dd></div>
        <div><dt>{v4("llnEven")}</dt><dd>{evenTongueCount(rows)}</dd></div>
      </dl>
      <div className="c4-ghk-chart" aria-label={v4("llnShapes")}>
        {BANDS.map((item) => {
          const count = rows.filter((row) => tongueBand(row.note) === item).length;
          return (
            <div key={item} className="c4-ghk-col" data-on={bandOn === item ? "1" : "0"}>
              <div className="c4-ghk-track"><i style={{ height: `${tongueShare(count, rows.length) || (count ? 8 : 0)}%` }} /></div>
              <button type="button" className="c4-btn" onClick={() => setBand(item)}>{bandName(v4, item)} · {count}</button>
            </div>
          );
        })}
      </div>
      <div className="c4-row">
        <label className="c4-lab"><span>{v4("llnSearch")}</span>
          <input ref={searchRef} className="c4-field" aria-label={v4("llnSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            setQuery("");
          }} />
        </label>
        <label className="c4-lab"><span>{v4("llnAllBands")}</span>
          <select className="c4-field" aria-label={v4("llnAllBands")} value={bandOn} onChange={(event) => setBand(event.target.value)}>
            <option value="all">{v4("llnAllBands")}</option>
            <option value="blank">{v4("llnClear")}</option>
            {present.filter((item) => item !== "blank").map((item) => <option key={item} value={item}>{bandName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("llnAllParities")}</span>
          <select className="c4-field" aria-label={v4("llnAllParities")} value={parityOn} onChange={(event) => setParity(event.target.value)}>
            <option value="all">{v4("llnAllParities")}</option>
            {["even", "odd"].map((item) => <option key={item} value={item}>{parityName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("llnAllShapes")}</span>
          <select className="c4-field" aria-label={v4("llnAllShapes")} value={shape} onChange={(event) => setShape(event.target.value as LaneShape)}>
            <option value="all">{v4("llnAllShapes")}</option>
            <option value="catalog">{v4("llnCatalogOnly")}</option>
            <option value="wide">{v4("llnWideOnly")}</option>
            <option value="even">{v4("llnEvenOnly")}</option>
          </select>
        </label>
        <button type="button" className="c4-chip" data-on={review === "open" ? "1" : "0"} onClick={() => setReview((item) => item === "open" ? "all" : "open")}>{v4("llnOpenMarks")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview((item) => item === "reviewed" ? "all" : "reviewed")}>{v4("llnReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("llnHidden") : v4("llnShow")}</button>
      </div>
      <ul className="c4-lng-bands" aria-label={v4("llnHide")}>
        {present.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" data-on={hidden.includes(item) ? "1" : "0"} disabled={viewer} onClick={() => {
              const next = toggleTongue(hidden, item, present);
              setHidden(next);
              writeJson(LANE_KEY, next);
            }}>{hidden.includes(item) ? v4("llnShow") : v4("llnHide")} · {bandName(v4, item)}</button>
          </li>
        ))}
      </ul>
      <div className="c4-row">
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
          const next = bulkTongueReview(reviewed, shown.map((row) => row.id), rows.map((row) => row.id), true);
          setReviewed(next);
          writeJson(LANE_REVIEW_KEY, next);
        }}>{v4("llnBulkReview")}</button>
        <button type="button" className="c4-btn" onClick={() => download("language-lanes.csv", tonguesCsv(rows))}>{v4("llnCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("language-lane-rows.csv", tongueRowsCsv(shown, reviewed))}>{v4("llnRowCsv")}</button>
        <span className="c4-meta">{v4("llnShown")} · {shown.length}</span>
      </div>
      <ul className="c4-lng-rows" aria-label={v4("llnBoard")}>
        {shown.map((row) => {
          const code = tongueCopy(row.note);
          const seen = reviewed.includes(row.id);
          const catalog = catalogTongue(row.note);
          const wide = wideTongue(row.note);
          const even = evenTongue(row.note);
          return (
            <li key={row.id} data-band={tongueBand(row.note) || "blank"} data-reviewed={seen ? "1" : "0"} data-catalog={catalog ? "1" : "0"} data-wide={wide ? "1" : "0"} data-even={even ? "1" : "0"}>
              <Link href={crmv4Href(base, `customers/${row.id}`)}>{row.label}</Link>
              <p className="c4-meta">{code || (tongueState(row.note) === "clear" ? v4("llnClear") : v4("llnUnmarked"))} · {bandName(v4, tongueBand(row.note) || (tongueState(row.note) === "clear" ? "blank" : ""))} · {parityName(v4, tongueParity(row.note))}</p>
              <div className="c4-row">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
                  const next = toggleTongueReview(reviewed, row.id, rows.map((item) => item.id));
                  setReviewed(next);
                  writeJson(LANE_REVIEW_KEY, next);
                }}>{seen ? v4("llnReviewed") : v4("llnReview")}</button>
                <button type="button" className="c4-btn" disabled={!code} onClick={() => {
                  void navigator.clipboard?.writeText(code);
                  setCopied(row.id);
                }}>{copied === row.id ? v4("llnCopied") : v4("llnCopy")}</button>
              </div>
            </li>
          );
        })}
        {!shown.length && <li className="c4-empty-gold">{v4("llnEmpty")}</li>}
      </ul>
      <p className="c4-meta">{v4("llnUnreviewed")} · {rows.filter((row) => !reviewed.includes(row.id)).length} · {v4("llnRules")}</p>
    </section>
  );
}
