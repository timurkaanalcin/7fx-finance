"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  KEEP_KEY,
  KEEP_VIEW_KEY,
  STAMP_KEY,
  STAMP_REVIEW_KEY,
  activeCloth,
  activeGrade,
  activeHour,
  activeKeeper,
  activeMark,
  activeStamp,
  activeStampDepth,
  activeTone,
  activeWait,
  addKeep,
  addKeepView,
  bulkKeepCloth,
  bulkKeepFile,
  bulkKeepPin,
  bulkStampReview,
  clashHourCount,
  clothArg,
  clothCounts,
  cycleTone,
  dropKeepView,
  editKeep,
  editKeepNote,
  fairKeeper,
  firstStamp,
  firstStampCount,
  gradeArg,
  gradeClashCount,
  homeDesk,
  hourArg,
  hourGap,
  keepCopy,
  keepCounts,
  keepKeepers,
  keepMarks,
  keepShare,
  keepTimeline,
  keepTones,
  keeperArg,
  keepsCsv,
  lateKeep,
  leadingStamp,
  leadingStampDepth,
  markArg,
  nextKeep,
  noonStamp,
  noonStampCount,
  presentStamps,
  readHiddenStamps,
  readKeepViews,
  readKeeps,
  readReviewedStamps,
  resetKeeps,
  setKeepFile,
  setKeepHold,
  setKeepPin,
  sharedStampCount,
  soonKeep,
  stampArg,
  stampBand,
  stampCopy,
  stampDepth,
  stampDepthArg,
  stampRowsCsv,
  stampShare,
  stampState,
  stampsCsv,
  suggestCloth,
  suggestKeeper,
  suggestWait,
  toggleStamp,
  toggleStampReview,
  toneArg,
  usedHours,
  visibleKeeps,
  visibleStampBands,
  visibleStampCustomers,
  waitArg,
  weekendStamp,
  weekendStampCount,
  type Keep,
  type KeepCloth,
  type KeepTone,
  type KeepTray,
  type KeepView,
  type StampRow,
  type StampShape,
} from "@/lib/crmv4/round184";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  leadInvalidAt?: string | null;
};

type GlanceRow = StampRow & { id: string };

const CLOTHS = ["ivory", "graphite", "champagne"] as const;
const BANDS = ["fresh", "week", "month", "old"] as const;

function clothName(v4: V4, cloth: KeepCloth | string): string {
  if (cloth === "ivory") return v4("kpvIvory");
  if (cloth === "graphite") return v4("kpvGraphite");
  if (cloth === "champagne") return v4("kpvChampagne");
  return v4("kpvBlankCloth");
}

function toneName(v4: V4, tone: KeepTone | string): string {
  if (tone === "hush") return v4("kpvToneHush");
  if (tone === "even") return v4("kpvToneEven");
  if (tone === "firm") return v4("kpvToneFirm");
  return v4("kpvBlankTone");
}

function hourName(v4: V4, name: string): string {
  if (name === "dawn") return v4("kpvDawn");
  if (name === "day") return v4("kpvDay");
  if (name === "dusk") return v4("kpvDusk");
  if (name === "peak") return v4("kpvPeak");
  if (name === "quiet") return v4("kpvQuiet");
  if (/^[1-8]$/.test(name)) return name;
  return v4("kpvBlankHour");
}

function gradeName(v4: V4, grade: number | null): string {
  if (grade === 2) return v4("kpvGrade2");
  if (grade === 4) return v4("kpvGrade4");
  if (grade === 8) return v4("kpvGrade8");
  return v4("kpvBlankGrade");
}

function waitName(v4: V4, wait: number | null): string {
  if (wait === 20) return v4("kpvWait20");
  if (wait === 40) return v4("kpvWait40");
  if (wait === 80) return v4("kpvWait80");
  return v4("kpvBlankWait");
}

function bandName(v4: V4, name: string): string {
  if (name === "fresh") return v4("stpFresh");
  if (name === "week") return v4("stpWeek");
  if (name === "month") return v4("stpMonth");
  if (name === "old") return v4("stpOld");
  if (name === "blank") return v4("stpClear");
  return v4("stpUnmarked");
}

function depthName(v4: V4, name: string): string {
  if (name === "dawn") return v4("stpDawn");
  if (name === "day") return v4("stpDay");
  if (name === "dusk") return v4("stpDusk");
  if (name === "night") return v4("stpNight");
  return v4("stpUnmarked");
}

function auditName(v4: V4, audit: string): string {
  const key = {
    save: "kpvAuditSave",
    edit: "kpvAuditEdit",
    tone: "kpvAuditTone",
    pin: "kpvAuditPin",
    unpin: "kpvAuditUnpin",
    hold: "kpvAuditHold",
    release: "kpvAuditRelease",
    file: "kpvAuditFile",
    unfile: "kpvAuditOpen",
    cloth: "kpvAuditCloth",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, hour: number | null, desk: string): string {
  const gap = hourGap(hour, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("kpvPast")} ${gap}`;
  if (gap < 0) return `${v4("kpvAhead")} ${Math.abs(gap)}`;
  return v4("kpvDue");
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

export function RetentionKeeps({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<Keep[]>([]);
  const [views, setViews] = useState<KeepView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [keeper, setKeeper] = useState("");
  const [hour, setHour] = useState("");
  const [cloth, setCloth] = useState("");
  const [mark, setMark] = useState("");
  const [tone, setTone] = useState("");
  const [grade, setGrade] = useState("");
  const [wait, setWait] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<KeepTray>("open");
  const [keeperFilter, setKeeperFilter] = useState("all");
  const [clothFilter, setClothFilter] = useState("all");
  const [markFilter, setMarkFilter] = useState("all");
  const [toneFilter, setToneFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [waitFilter, setWaitFilter] = useState("all");
  const [firmOnly, setFirmOnly] = useState(false);
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
    const next = readKeeps(readJson(KEEP_KEY, []));
    const saved = readKeepViews(readJson(KEEP_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(KEEP_KEY, next);
    writeJson(KEEP_VIEW_KEY, saved);
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
  function store(next: Keep[]) {
    const saved = readKeeps(next);
    setCards(saved);
    writeJson(KEEP_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((card) => card.id === id)));
  }
  const keepers = keepKeepers(cards);
  const marks = keepMarks(cards);
  const tones = keepTones(cards);
  const bars = clothCounts(cards);
  const keeperOn = activeKeeper(keeperFilter, keepers);
  const clothOn = activeCloth(clothFilter, CLOTHS);
  const markOn = activeMark(markFilter, marks);
  const toneOn = activeTone(toneFilter, tones);
  const hourOn = activeHour(hourFilter);
  const gradeOn = activeGrade(gradeFilter);
  const waitOn = activeWait(waitFilter);
  const pickedHour = hourArg(hourOn);
  const shown = visibleKeeps(
    cards,
    tray,
    query,
    keeperArg(keeperOn),
    clothArg(clothOn),
    markArg(markOn),
    toneArg(toneOn),
    pickedHour.exact,
    pickedHour.pick,
    gradeArg(gradeOn),
    waitArg(waitOn),
    firmOnly,
    peakOnly,
    homeOnly,
  );
  const timeline = keepTimeline(cards, query);
  const counts = keepCounts(cards, desk);
  const clashes = clashHourCount(cards);
  const grades = gradeClashCount(cards);
  const nextId = nextKeep(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const suggestedCloth = suggestCloth(cards);
  const suggestedKeeper = suggestKeeper(cards);
  const suggestedWait = suggestWait(cards);
  const fair = fairKeeper(cards, roster);
  const total = cards.length;
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  function clearDraft() {
    setTitle("");
    setNote("");
    setKeeper("");
    setHour("");
    setCloth("");
    setMark("");
    setTone("");
    setGrade("");
    setWait("");
    setQuery("");
    setEditing("");
  }
  return (
    <section className="c4-kpv" aria-label={v4("kpvTitle")} data-keeps="1" data-role={role}>
      <header className="c4-kpv-mast">
        <div>
          <p className="c4-kpv-kicker">{v4("kpvSub")}</p>
          <h2 className="c4-title">{v4("kpvTitle")}</h2>
        </div>
        <p className="c4-kpv-plate" data-logo="mono">{v4("kpvLogo")}</p>
      </header>
      <p className="c4-kpv-rules">{v4("kpvHint")}</p>
      <p className="c4-meta">{v4("kpvLocal")}</p>
      <p className="c4-meta">{v4("kpvNew")} {v4("kpvSlash")} {v4("kpvEscape")}</p>
      {viewer && <p className="c4-kpv-notice" data-viewer="1">{v4("kpvViewer")}</p>}
      {counts.peak > 0 && (
        <div className="c4-kpv-bells">
          <p className="c4-kpv-notice">{v4("kpvNotice")} · {counts.peak}</p>
          <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("kpvNoticeAll") : v4("kpvNoticePeak")}</button>
        </div>
      )}
      <dl className="c4-kpv-kpi" aria-label={v4("kpvKpi")}>
        <div><dt>{v4("kpvWaiting")}</dt><dd>{counts.open}</dd></div>
        <div><dt>{v4("kpvHeld")}</dt><dd>{counts.held}</dd></div>
        <div><dt>{v4("kpvFiled")}</dt><dd>{counts.filed}</dd></div>
        <div><dt>{v4("kpvPinned")}</dt><dd>{counts.pinned}</dd></div>
        <div><dt>{v4("kpvPeak")}</dt><dd>{counts.peak}</dd></div>
        <div><dt>{v4("kpvLate")}</dt><dd>{counts.late}</dd></div>
        <div><dt>{v4("kpvSoon")}</dt><dd>{counts.soon}</dd></div>
        <div><dt>{v4("kpvHomeShare")}</dt><dd>{keepShare(counts.home, total)}%</dd></div>
      </dl>
      <div className="c4-kpv-chart" aria-label={v4("kpvCloths")}>
        {bars.map((bar) => (
          <div key={bar.cloth} className="c4-kpv-col" data-on={clothOn === bar.cloth ? "1" : "0"}>
            <span className="c4-kpv-swatch" data-cloth={bar.cloth} />
            <div className="c4-kpv-track" aria-hidden="true"><i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            <button type="button" className="c4-btn" onClick={() => setClothFilter(bar.cloth)}>{clothName(v4, bar.cloth)} · {bar.count}</button>
          </div>
        ))}
        {!bars.length && <p className="c4-empty-gold">{v4("kpvEmpty")}</p>}
      </div>
      <div className="c4-kpv-suggest">
        <p>{v4("kpvSuggestCloth")} · {clothName(v4, suggestedCloth)}</p>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setCloth(suggestedCloth)}>{v4("kpvUseCloth")}</button>
        <p>{v4("kpvSuggestKeeper")} · {suggestedKeeper || v4("kpvBlankKeeper")}</p>
        <button type="button" className="c4-btn" disabled={viewer || !suggestedKeeper} onClick={() => setKeeper(suggestedKeeper)}>{v4("kpvUseKeeper")}</button>
        <p>{v4("kpvSuggestWait")} · {waitName(v4, suggestedWait)}</p>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setWait(String(suggestedWait))}>{v4("kpvUseWait")}</button>
        <p>{v4("kpvAssign")} · {fair || v4("kpvBlankKeeper")}</p>
        <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setKeeper(fair)}>{v4("kpvAssign")}</button>
      </div>
      <p className="c4-meta">{v4("kpvHourUse")} · {usedHours(cards)} · {clashes ? `${v4("kpvClash")} · ${clashes}` : v4("kpvClashNone")} · {grades ? `${v4("kpvGradeClash")} · ${grades}` : v4("kpvGradeClashNone")}</p>
      <p className="c4-meta">{v4("kpvNext")} · {nextCard ? nextCard.title : v4("kpvNextNone")}</p>
      <form className="c4-kpv-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addKeep(cards, { id: `kpv-${Date.now()}`, title, note, keeper, hour, cloth, mark, tone, grade, wait });
        if (next.length === cards.length && title.trim()) return;
        store(next);
        setTitle("");
        setNote("");
      }}>
        <label className="c4-lab"><span>{v4("kpvLine")}</span>
          <input ref={titleRef} className="c4-field" aria-label={v4("kpvLine")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab"><span>{v4("kpvNote")}</span>
          <input className="c4-field" aria-label={v4("kpvNote")} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("kpvKeeper")}</span>
          <input className="c4-field" aria-label={v4("kpvKeeper")} value={keeper} disabled={viewer} onChange={(event) => setKeeper(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("kpvHour")}</span>
          <input className="c4-field" aria-label={v4("kpvHour")} inputMode="numeric" value={hour} disabled={viewer} onChange={(event) => setHour(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("kpvCloth")}</span>
          <select className="c4-field" aria-label={v4("kpvCloth")} value={cloth} disabled={viewer} onChange={(event) => setCloth(event.target.value)}>
            <option value="">{v4("kpvBlankCloth")}</option>
            {CLOTHS.map((item) => <option key={item} value={item}>{clothName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("kpvMark")}</span>
          <input className="c4-field" aria-label={v4("kpvMark")} value={mark} disabled={viewer} onChange={(event) => setMark(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("kpvTone")}</span>
          <select className="c4-field" aria-label={v4("kpvTone")} value={tone} disabled={viewer} onChange={(event) => setTone(event.target.value)}>
            <option value="">{v4("kpvBlankTone")}</option>
            <option value="hush">{v4("kpvToneHush")}</option>
            <option value="even">{v4("kpvToneEven")}</option>
            <option value="firm">{v4("kpvToneFirm")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("kpvGrade")}</span>
          <input className="c4-field" aria-label={v4("kpvGrade")} inputMode="numeric" value={grade} disabled={viewer} onChange={(event) => setGrade(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("kpvWait")}</span>
          <input className="c4-field" aria-label={v4("kpvWait")} inputMode="numeric" value={wait} disabled={viewer} onChange={(event) => setWait(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("kpvRoster")}</span>
          <input className="c4-field" aria-label={v4("kpvRoster")} value={roster} disabled={viewer} onChange={(event) => setRoster(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn c4-btn-hot" disabled={viewer}>{v4("kpvAdd")}</button>
      </form>
      <p className="c4-meta">{v4("kpvBlank")} {v4("kpvHourBlank")}</p>
      <div className="c4-kpv-filters">
        {(["open", "held", "filed"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>
            {item === "open" ? v4("kpvWaiting") : item === "held" ? v4("kpvHeld") : v4("kpvFiled")}
          </button>
        ))}
        <label className="c4-lab"><span>{v4("kpvSearch")}</span>
          <input ref={searchRef} className="c4-field" aria-label={v4("kpvSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab"><span>{v4("kpvDeskHour")}</span>
          <input className="c4-field" aria-label={v4("kpvDeskHour")} inputMode="numeric" value={desk} onChange={(event) => setDesk(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("kpvKeepers")}</span>
          <select className="c4-field" aria-label={v4("kpvAllKeepers")} value={keeperOn} onChange={(event) => setKeeperFilter(event.target.value)}>
            <option value="all">{v4("kpvAllKeepers")}</option>
            <option value="blank">{v4("kpvBlankKeeper")}</option>
            {keepers.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("kpvCloths")}</span>
          <select className="c4-field" aria-label={v4("kpvAllCloths")} value={clothOn} onChange={(event) => setClothFilter(event.target.value)}>
            <option value="all">{v4("kpvAllCloths")}</option>
            <option value="blank">{v4("kpvBlankCloth")}</option>
            {CLOTHS.map((item) => <option key={item} value={item}>{clothName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("kpvMarks")}</span>
          <select className="c4-field" aria-label={v4("kpvAllMarks")} value={markOn} onChange={(event) => setMarkFilter(event.target.value)}>
            <option value="all">{v4("kpvAllMarks")}</option>
            <option value="blank">{v4("kpvBlankMark")}</option>
            {marks.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("kpvTones")}</span>
          <select className="c4-field" aria-label={v4("kpvAllTones")} value={toneOn} onChange={(event) => setToneFilter(event.target.value)}>
            <option value="all">{v4("kpvAllTones")}</option>
            <option value="blank">{v4("kpvBlankTone")}</option>
            {tones.map((item) => <option key={item} value={item}>{toneName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("kpvHours")}</span>
          <select className="c4-field" aria-label={v4("kpvAllHours")} value={hourOn} onChange={(event) => setHourFilter(event.target.value)}>
            <option value="all">{v4("kpvAllHours")}</option>
            {["blank", "dawn", "day", "dusk", "peak", "quiet", "1", "2", "3", "4", "5", "6", "7", "8"].map((item) => <option key={item} value={item}>{hourName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("kpvGrades")}</span>
          <select className="c4-field" aria-label={v4("kpvAllGrades")} value={gradeOn} onChange={(event) => setGradeFilter(event.target.value)}>
            <option value="all">{v4("kpvAllGrades")}</option>
            <option value="blank">{v4("kpvBlankGrade")}</option>
            <option value="2">{v4("kpvGrade2")}</option>
            <option value="4">{v4("kpvGrade4")}</option>
            <option value="8">{v4("kpvGrade8")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("kpvWaits")}</span>
          <select className="c4-field" aria-label={v4("kpvAllWaits")} value={waitOn} onChange={(event) => setWaitFilter(event.target.value)}>
            <option value="all">{v4("kpvAllWaits")}</option>
            <option value="blank">{v4("kpvBlankWait")}</option>
            <option value="20">{v4("kpvWait20")}</option>
            <option value="40">{v4("kpvWait40")}</option>
            <option value="80">{v4("kpvWait80")}</option>
          </select>
        </label>
        <button type="button" className="c4-chip" data-on={firmOnly ? "1" : "0"} onClick={() => setFirmOnly((on) => !on)}>{v4("kpvFirmOnly")}</button>
        <button type="button" className="c4-chip" data-on={homeOnly ? "1" : "0"} onClick={() => setHomeOnly((on) => !on)}>{homeOnly ? v4("kpvHomeOnly") : v4("kpvHomeAll")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard((item) => item === "cards" ? "timeline" : "cards")}>{board === "cards" ? v4("kpvTimeline") : v4("kpvCards")}</button>
      </div>
      <form className="c4-kpv-views" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addKeepView(views, {
          id: `view-${Date.now()}`,
          name: viewName,
          tray,
          query,
          keeper: keeperOn,
          cloth: clothOn,
          mark: markOn,
          tone: toneOn,
          hour: hourOn,
          grade: gradeOn,
          wait: waitOn,
        });
        setViews(next);
        writeJson(KEEP_VIEW_KEY, next);
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("kpvViewName")}</span>
          <input className="c4-field" aria-label={v4("kpvViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("kpvSaveView")}</button>
        <ul aria-label={v4("kpvViews")}>
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => {
                setTray(view.tray);
                setQuery(view.query);
                setKeeperFilter(view.keeper);
                setClothFilter(view.cloth);
                setMarkFilter(view.mark);
                setToneFilter(view.tone);
                setHourFilter(view.hour);
                setGradeFilter(view.grade);
                setWaitFilter(view.wait);
              }}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
                const next = dropKeepView(views, view.id);
                setViews(next);
                writeJson(KEEP_VIEW_KEY, next);
              }}>{v4("kpvDropView")}</button>
            </li>
          ))}
        </ul>
      </form>
      <div className="c4-row">
        <button type="button" className="c4-btn" onClick={() => setPicked(shown.map((card) => card.id))}>{v4("kpvPickAll")}</button>
        <button type="button" className="c4-btn" onClick={() => setPicked([])}>{v4("kpvPickNone")}</button>
        <span className="c4-meta">{v4("kpvPicked")} · {picked.length}</span>
        <select className="c4-field" aria-label={v4("kpvBulkCloth")} value={moveCloth} disabled={viewer} onChange={(event) => setMoveCloth(event.target.value)}>
          {CLOTHS.map((item) => <option key={item} value={item}>{clothName(v4, item)}</option>)}
        </select>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkKeepCloth(cards, picked, moveCloth))}>{v4("kpvBulkCloth")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkKeepPin(cards, picked, true))}>{v4("kpvBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkKeepFile(cards, picked, true))}>{v4("kpvBulkFile")}</button>
        <button type="button" className="c4-btn" onClick={() => download("retention-keeps.csv", keepsCsv(cards, desk))}>{v4("kpvCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetKeeps())}>{v4("kpvReset")}</button>
      </div>
      {board === "timeline" ? (
        <ol className="c4-kpv-timeline" aria-label={v4("kpvTimeline")}>
          {timeline.map((card) => <li key={card.id} data-hour={card.hour}>{card.hour} · {card.title}</li>)}
          {!timeline.length && <li className="c4-empty-gold">{v4("kpvEmpty")}</li>}
        </ol>
      ) : (
        <ul className="c4-kpv-cards">
          {shown.map((card) => {
            const openEdit = editing === card.id;
            return (
              <li key={card.id} data-cloth={card.cloth || "blank"} data-tone={card.tone || "blank"} data-pinned={card.pinned ? "1" : "0"} data-late={lateKeep(card, desk) ? "1" : "0"} data-soon={soonKeep(card) ? "1" : "0"} data-home={homeDesk(card.mark) ? "1" : "0"}>
                <label className="c4-row">
                  <input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={(event) => setPicked((ids) => event.target.checked ? [...ids, card.id] : ids.filter((id) => id !== card.id))} />
                  {openEdit ? (
                    <input className="c4-field" aria-label={v4("kpvEdit")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                  ) : <strong>{card.title}</strong>}
                </label>
                <p className="c4-meta">{card.keeper || v4("kpvBlankKeeper")} · {card.hour ?? v4("kpvBlankHour")} · {clothName(v4, card.cloth)} · {card.mark || v4("kpvBlankMark")} · {toneName(v4, card.tone)} · {gradeName(v4, card.grade)} · {waitName(v4, card.wait)}</p>
                {openEdit ? (
                  <input className="c4-field" aria-label={v4("kpvNote")} value={noteDraft} disabled={viewer} onChange={(event) => setNoteDraft(event.target.value)} />
                ) : card.note && <p>{card.note}</p>}
                <p className="c4-meta">{gapLabel(v4, card.hour, desk)} {auditName(v4, card.audit)}</p>
                <div className="c4-row">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setKeepPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("kpvUnpin") : v4("kpvPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setKeepHold(cards, card.id, !card.held))}>{card.held ? v4("kpvRelease") : v4("kpvHold")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setKeepFile(cards, card.id, !card.filed))}>{card.filed ? v4("kpvReopen") : v4("kpvFile")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleTone(cards, card.id))}>{v4("kpvToneUp")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
                    if (openEdit) {
                      store(editKeepNote(editKeep(cards, card.id, draft), card.id, noteDraft));
                      setEditing("");
                      return;
                    }
                    setEditing(card.id);
                    setDraft(card.title);
                    setNoteDraft(card.note);
                  }}>{openEdit ? v4("kpvAdd") : v4("kpvEdit")}</button>
                  <button type="button" className="c4-btn" onClick={() => {
                    void navigator.clipboard?.writeText(keepCopy(card));
                    setCopied(card.id);
                  }}>{copied === card.id ? v4("kpvCopied") : v4("kpvCopy")}</button>
                </div>
              </li>
            );
          })}
          {!shown.length && <li className="c4-empty-gold">{v4("kpvEmpty")}</li>}
        </ul>
      )}
      <p className="c4-meta">{v4("kpvRules")}</p>
    </section>
  );
}

export function InvalidStamps({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [band, setBand] = useState("all");
  const [depth, setDepth] = useState("all");
  const [shape, setShape] = useState<StampShape>("all");
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
    note: { leadInvalidAt: user.leadInvalidAt ?? null },
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
    const present = presentStamps(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenStamps(readJson(STAMP_KEY, []), present);
    const nextReviewed = readReviewedStamps(readJson(STAMP_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(STAMP_KEY, nextHidden);
    writeJson(STAMP_REVIEW_KEY, nextReviewed);
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
  const present = presentStamps(rows);
  const bandOn = activeStamp(band, present);
  const depthOn = activeStampDepth(depth);
  const bands = visibleStampBands(present, hidden, showHidden);
  const shown = visibleStampCustomers(rows, stampArg(bandOn), stampDepthArg(depthOn), query, review, reviewed, shape).filter((row) => {
    const state = stampState(row.note);
    if (state === "") return bandOn === "all" && !showHidden;
    const token = state === "set" ? stampBand(row.note) : "blank";
    return bands.includes(token);
  });
  const lead = leadingStamp(rows);
  const leadDepth = leadingStampDepth(rows);
  const shared = sharedStampCount(rows);
  const setCount = rows.filter((row) => stampState(row.note) === "set").length;
  return (
    <section className="c4-stp" aria-label={v4("stpTitle")} data-stamps="1" data-role={role}>
      <header className="c4-stp-mast">
        <div>
          <p className="c4-stp-kicker">{v4("stpSub")}</p>
          <h2 className="c4-title">{v4("stpTitle")}</h2>
        </div>
        <p className="c4-stp-plate" data-logo="mono">7FX</p>
      </header>
      <p className="c4-stp-rules">{v4("stpHint")}</p>
      <p className="c4-meta">{v4("stpKept")} {v4("stpEscape")}</p>
      {viewer && <p className="c4-stp-notice">{v4("stpViewer")}</p>}
      {data.error && <p className="c4-empty-gold">{v4("stpFailed")}</p>}
      {data.loading && <p className="c4-meta">{v4("stpLoading")}</p>}
      {!data.loading && !rows.length && <p className="c4-empty-gold">{v4("stpNone")}</p>}
      <dl className="c4-kpv-kpi" aria-label={v4("stpSetNotice")}>
        <div><dt>{v4("stpCustomers")}</dt><dd>{rows.length}</dd></div>
        <div><dt>{v4("stpSetNotice")}</dt><dd>{setCount}</dd></div>
        <div><dt>{v4("stpShare")}</dt><dd>{stampShare(setCount, rows.length)}%</dd></div>
        <div><dt>{v4("stpShared")}</dt><dd>{shared}</dd></div>
        <div><dt>{v4("stpLeadBand")}</dt><dd>{lead ? bandName(v4, lead) : v4("stpUnmarked")}</dd></div>
        <div><dt>{v4("stpLeadDepth")}</dt><dd>{leadDepth ? depthName(v4, leadDepth) : v4("stpUnmarked")}</dd></div>
        <div><dt>{v4("stpWeekend")}</dt><dd>{weekendStampCount(rows)}</dd></div>
        <div><dt>{v4("stpFirst")}</dt><dd>{firstStampCount(rows)}</dd></div>
        <div><dt>{v4("stpNoon")}</dt><dd>{noonStampCount(rows)}</dd></div>
      </dl>
      <div className="c4-kpv-chart" aria-label={v4("stpShapes")}>
        {BANDS.map((item) => {
          const count = rows.filter((row) => stampBand(row.note) === item).length;
          return (
            <div key={item} className="c4-kpv-col" data-on={bandOn === item ? "1" : "0"}>
              <div className="c4-kpv-track"><i style={{ height: `${stampShare(count, rows.length) || (count ? 8 : 0)}%` }} /></div>
              <button type="button" className="c4-btn" onClick={() => setBand(item)}>{bandName(v4, item)} · {count}</button>
            </div>
          );
        })}
      </div>
      <div className="c4-row">
        <label className="c4-lab"><span>{v4("stpSearch")}</span>
          <input ref={searchRef} className="c4-field" aria-label={v4("stpSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            setQuery("");
          }} />
        </label>
        <label className="c4-lab"><span>{v4("stpAllBands")}</span>
          <select className="c4-field" aria-label={v4("stpAllBands")} value={bandOn} onChange={(event) => setBand(event.target.value)}>
            <option value="all">{v4("stpAllBands")}</option>
            <option value="blank">{v4("stpClear")}</option>
            {present.filter((item) => item !== "blank").map((item) => <option key={item} value={item}>{bandName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("stpAllDepths")}</span>
          <select className="c4-field" aria-label={v4("stpAllDepths")} value={depthOn} onChange={(event) => setDepth(event.target.value)}>
            <option value="all">{v4("stpAllDepths")}</option>
            {["dawn", "day", "dusk", "night"].map((item) => <option key={item} value={item}>{depthName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("stpAllShapes")}</span>
          <select className="c4-field" aria-label={v4("stpAllShapes")} value={shape} onChange={(event) => setShape(event.target.value as StampShape)}>
            <option value="all">{v4("stpAllShapes")}</option>
            <option value="weekend">{v4("stpWeekendOnly")}</option>
            <option value="first">{v4("stpFirstOnly")}</option>
            <option value="noon">{v4("stpNoonOnly")}</option>
          </select>
        </label>
        <button type="button" className="c4-chip" data-on={review === "open" ? "1" : "0"} onClick={() => setReview((item) => item === "open" ? "all" : "open")}>{v4("stpOpenMarks")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview((item) => item === "reviewed" ? "all" : "reviewed")}>{v4("stpReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("stpHidden") : v4("stpShow")}</button>
      </div>
      <ul className="c4-stp-bands" aria-label={v4("stpHide")}>
        {present.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" data-on={hidden.includes(item) ? "1" : "0"} disabled={viewer} onClick={() => {
              const next = toggleStamp(hidden, item, present);
              setHidden(next);
              writeJson(STAMP_KEY, next);
            }}>{hidden.includes(item) ? v4("stpShow") : v4("stpHide")} · {bandName(v4, item)}</button>
          </li>
        ))}
      </ul>
      <div className="c4-row">
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
          const next = bulkStampReview(reviewed, shown.map((row) => row.id), rows.map((row) => row.id), true);
          setReviewed(next);
          writeJson(STAMP_REVIEW_KEY, next);
        }}>{v4("stpBulkReview")}</button>
        <button type="button" className="c4-btn" onClick={() => download("invalid-stamps.csv", stampsCsv(rows))}>{v4("stpCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("invalid-stamp-rows.csv", stampRowsCsv(shown, reviewed))}>{v4("stpRowCsv")}</button>
        <span className="c4-meta">{v4("stpShown")} · {shown.length}</span>
      </div>
      <ul className="c4-stp-rows" aria-label={v4("stpBoard")}>
        {shown.map((row) => {
          const code = stampCopy(row.note);
          const seen = reviewed.includes(row.id);
          const weekend = weekendStamp(row.note);
          const first = firstStamp(row.note);
          const noon = noonStamp(row.note);
          return (
            <li key={row.id} data-band={stampBand(row.note) || "blank"} data-reviewed={seen ? "1" : "0"} data-weekend={weekend ? "1" : "0"} data-first={first ? "1" : "0"} data-noon={noon ? "1" : "0"}>
              <Link href={crmv4Href(base, `customers/${row.id}`)}>{row.label}</Link>
              <p className="c4-meta">{code || (stampState(row.note) === "clear" ? v4("stpClear") : v4("stpUnmarked"))} · {bandName(v4, stampBand(row.note) || (stampState(row.note) === "clear" ? "blank" : ""))} · {depthName(v4, stampDepth(row.note))}</p>
              <div className="c4-row">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
                  const next = toggleStampReview(reviewed, row.id, rows.map((item) => item.id));
                  setReviewed(next);
                  writeJson(STAMP_REVIEW_KEY, next);
                }}>{seen ? v4("stpReviewed") : v4("stpReview")}</button>
                <button type="button" className="c4-btn" disabled={!code} onClick={() => {
                  void navigator.clipboard?.writeText(code);
                  setCopied(row.id);
                }}>{copied === row.id ? v4("stpCopied") : v4("stpCopy")}</button>
              </div>
            </li>
          );
        })}
        {!shown.length && <li className="c4-empty-gold">{v4("stpEmpty")}</li>}
      </ul>
      <p className="c4-meta">{v4("stpUnreviewed")} · {rows.filter((row) => !reviewed.includes(row.id)).length} · {v4("stpRules")}</p>
    </section>
  );
}
