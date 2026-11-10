"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  CLOAK_KEY,
  CLOAK_VIEW_KEY,
  LATCH_KEY,
  activeBearer,
  activeBell,
  activeLatch,
  activeMark,
  activeSpan,
  activeStamp,
  activeTone,
  activeWing,
  addCloak,
  addCloakView,
  bearerArg,
  bearerLoad,
  bellArg,
  cloakClashIds,
  cloakCopy,
  cloakCounts,
  cloakGap,
  cloakShare,
  cloakStamps,
  cloakTimeline,
  cloakTones,
  cloakWings,
  cloaksCsv,
  clashCloakCount,
  cycleCloakTone,
  dropCloakView,
  editCloak,
  latchArg,
  latchLines,
  latchOf,
  latchesCsv,
  leadingLatch,
  leadingSpan,
  ltcShare,
  markArg,
  markLines,
  namedLatches,
  namedMarks,
  namedSpans,
  spanLines,
  nextCloak,
  phoneMarkOf,
  phoneSpanOf,
  presentLatches,
  readCloakViews,
  readCloaks,
  readHiddenLatches,
  resetCloaks,
  setCloakFolded,
  setCloakQueued,
  setCloakStar,
  spanArg,
  stampArg,
  stampClashCount,
  stampClashIds,
  suggestWing,
  toneArg,
  toneOf,
  toggleLatch,
  visibleCloaks,
  visibleLatchCustomers,
  visibleLatches,
  watchCounts,
  watchOf,
  wingArg,
  wingOf,
  bulkCloakFold,
  bulkCloakStar,
  bulkCloakWing,
  cloakBearers,
  type CloakCard,
  type CloakTone,
  type CloakTray,
  type CloakView,
  type CloakWing,
  type LatchMark,
  type LatchRow,
  type PhoneMark,
  type PhoneSpan,
} from "@/lib/crmv4/round166";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  phone?: string | null;
  loginEnabled?: boolean | null;
};

type GlanceRow = LatchRow & { id: string };

const WATCHES = ["morning", "afternoon", "night"] as const;

function wingName(v4: V4, wing: CloakWing | string): string {
  if (wing === "north") return v4("clkWingNorth");
  if (wing === "east") return v4("clkWingEast");
  if (wing === "south") return v4("clkWingSouth");
  if (wing === "west") return v4("clkWingWest");
  return v4("clkBlankWing");
}

function toneName(v4: V4, tone: CloakTone): string {
  if (tone === "calm") return v4("clkCalm");
  if (tone === "keen") return v4("clkKeen");
  if (tone === "urgent") return v4("clkUrgent");
  return v4("clkBlankTone");
}

function watchName(v4: V4, name: string): string {
  if (name === "morning") return v4("clkMorning");
  if (name === "afternoon") return v4("clkAfternoon");
  if (name === "night") return v4("clkNight");
  if (name === "quiet") return v4("clkQuiet");
  if (name === "day") return v4("clkDay");
  if (/^(?:[0-9]|1[0-9]|2[0-3])$/.test(name)) return name;
  return v4("clkBlankBell");
}

function latchName(v4: V4, name: string): string {
  if (name === "open") return v4("ltcOpen");
  if (name === "shut") return v4("ltcShut");
  return v4("ltcUnmarked");
}

function spanName(v4: V4, name: string): string {
  if (name === "short") return v4("ltcShort");
  if (name === "mid") return v4("ltcMid");
  if (name === "long") return v4("ltcLong");
  return v4("ltcUnmarked");
}

function markName(v4: V4, name: string): string {
  if (name === "plus") return v4("ltcPlus");
  if (name === "local") return v4("ltcLocalPhone");
  return v4("ltcUnmarked");
}

function auditName(v4: V4, audit: string): string {
  const key = {
    save: "clkAuditSave",
    edit: "clkAuditEdit",
    tone: "clkAuditTone",
    star: "clkAuditStar",
    unstar: "clkAuditUnstar",
    queue: "clkAuditQueue",
    release: "clkAuditRelease",
    fold: "clkAuditFold",
    unfold: "clkAuditUnfold",
    wing: "clkAuditWing",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function bellLabel(bell: number | null): string {
  return bell === null ? "—" : String(bell);
}

function gapLabel(v4: V4, bell: number | null, desk: string): string {
  const gap = cloakGap(bell, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("clkPast")} ${gap}`;
  if (gap < 0) return `${v4("clkAhead")} ${Math.abs(gap)}`;
  return v4("clkDue");
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

function sameCards(left: readonly CloakCard[], right: readonly CloakCard[]): boolean {
  return left.length === right.length && left.every((card, index) => card.id === right[index]?.id && card.line === right[index]?.line && card.audit === right[index]?.audit);
}

export function CloakroomPasses({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<CloakCard[]>([]);
  const [views, setViews] = useState<CloakView[]>([]);
  const [line, setLine] = useState("");
  const [bearer, setBearer] = useState("");
  const [bell, setBell] = useState("");
  const [wing, setWing] = useState("");
  const [stamp, setStamp] = useState("");
  const [tone, setTone] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<CloakTray>("live");
  const [bearerFilter, setBearerFilter] = useState("all");
  const [wingFilter, setWingFilter] = useState("all");
  const [stampFilter, setStampFilter] = useState("all");
  const [toneFilter, setToneFilter] = useState("all");
  const [bellFilter, setBellFilter] = useState("all");
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [nightOnly, setNightOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [desk, setDesk] = useState("");
  const [moveWing, setMoveWing] = useState("north");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const lineRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readCloaks(readJson(CLOAK_KEY, []));
    const saved = readCloakViews(readJson(CLOAK_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(CLOAK_KEY, next);
    writeJson(CLOAK_VIEW_KEY, saved);
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
      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        lineRef.current?.focus();
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const bearers = cloakBearers(cards);
  const wings = cloakWings(cards);
  const stamps = cloakStamps(cards);
  const tones = cloakTones(cards);
  const bars = watchCounts(cards);
  const bearerOn = activeBearer(bearerFilter, bearers);
  const wingOn = activeWing(wingFilter, wings);
  const stampOn = activeStamp(stampFilter, stamps);
  const toneOn = activeTone(toneFilter, tones);
  const bellOn = activeBell(bellFilter);
  const picked = bellArg(bellOn);
  const shown = visibleCloaks(
    cards,
    tray,
    query,
    bearerArg(bearerOn),
    wingArg(wingOn),
    stampArg(stampOn),
    toneArg(toneOn),
    picked.exact,
    picked.pick,
    urgentOnly,
    nightOnly,
  );
  const timeline = cloakTimeline(cards, query);
  const counts = cloakCounts(cards);
  const clashes = clashCloakCount(cards);
  const stampClashes = stampClashCount(cards);
  const total = cards.length;
  const nextId = nextCloak(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const widest = Math.max(1, ...bars);
  const starred = cards.filter((card) => card.starred);
  const load = bearerLoad(cards, bearer);
  const suggested = suggestWing(cards);

  function store(next: CloakCard[]) {
    setCards(next);
    writeJson(CLOAK_KEY, next);
  }

  function storeViews(next: CloakView[]) {
    setViews(next);
    writeJson(CLOAK_VIEW_KEY, next);
  }

  function clearDraft() {
    setLine("");
    setBearer("");
    setBell("");
    setWing("");
    setStamp("");
    setTone("");
  }

  function copyCard(card: CloakCard) {
    const body = cloakCopy(card.line);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(card.id);
  }

  function applyView(view: CloakView) {
    setTray(view.tray);
    setQuery(view.query);
    setBearerFilter(activeBearer(view.bearer, cloakBearers(cards)));
    setWingFilter(activeWing(view.wing, cloakWings(cards)));
    setStampFilter(activeStamp(view.stamp, cloakStamps(cards)));
    setToneFilter(activeTone(view.tone, cloakTones(cards)));
    setBellFilter(activeBell(view.bell));
    setBoard("cards");
    setUrgentOnly(false);
    setNightOnly(false);
  }

  return (
    <section className="c4-clk" aria-label={v4("clkTitle")} data-cloaks="1" data-role={role}>
      <header className="c4-clk-head">
        <p className="c4-clk-plate" data-logo="mono">{v4("clkLogo")}</p>
        <div>
          <p className="c4-clk-kicker">{v4("clkSub")}</p>
          <h2 className="c4-title">{v4("clkTitle")}</h2>
        </div>
        <p className="c4-clk-count">{shown.length}</p>
      </header>
      <details className="c4-clk-rules">
        <summary>{v4("clkRules")}</summary>
        <p className="c4-meta">{v4("clkHint")}</p>
        <p className="c4-meta">{v4("clkLocal")}</p>
        <p className="c4-meta">{v4("clkBlank")}</p>
        <p className="c4-meta">{v4("clkBearerBlank")}</p>
        <p className="c4-meta">{v4("clkBellBlank")}</p>
        <p className="c4-meta">{v4("clkWingBlank")}</p>
        <p className="c4-meta">{v4("clkStampBlank")}</p>
        <p className="c4-meta">{v4("clkToneBlank")}</p>
        <p className="c4-meta">{v4("clkEscape")}</p>
        <p className="c4-meta">{v4("clkSlash")}</p>
        <p className="c4-meta">{v4("clkNew")}</p>
      </details>
      {viewer ? <p className="c4-clk-notice" role="status">{v4("clkViewer")}</p> : null}
      <p className="c4-clk-notice" role="status">
        <span>{v4("clkNotice")}</span>
        <span className="c4-clk-count">{counts.night}</span>
        <button type="button" className="c4-btn" aria-pressed={nightOnly} onClick={() => { setNightOnly((value) => !value); setTray("live"); setBoard("cards"); }}>
          {nightOnly ? v4("clkNoticeAll") : v4("clkNoticeNight")}
        </button>
      </p>
      <p className="c4-clk-notice" role="status">
        <span>{v4("clkClash")}</span>
        <span className="c4-clk-count">{clashes}</span>
      </p>
      <p className="c4-clk-notice" role="status">
        <span>{v4("clkStampClash")}</span>
        <span className="c4-clk-count">{stampClashes}</span>
      </p>
      <p className="c4-clk-suggest" role="status">
        <span>{v4("clkSuggest")}</span>
        <strong>{wingName(v4, suggested)}</strong>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setWing(suggested)}>{v4("clkUseWing")}</button>
      </p>
      {starred.length > 0 && (
        <ul className="c4-clk-pins" aria-label={v4("clkPinned")}>
          {starred.map((card) => (
            <li key={card.id}>
              <button type="button" className="c4-chip" onClick={() => { setQuery(card.line); setBoard("cards"); }}>{card.line}</button>
            </li>
          ))}
        </ul>
      )}
      <section className="c4-clk-kpi" aria-label={v4("clkKpi")}>
        {(["live", "queued", "folded", "starred"] as const).map((key) => {
          const count = counts[key];
          const share = cloakShare(count, total);
          const label = key === "live" ? v4("clkLive") : key === "queued" ? v4("clkQueued") : key === "folded" ? v4("clkFolded") : v4("clkStar");
          return (
            <p key={key} className="c4-clk-meter" data-tray={key}>
              <span>{label}</span>
              <strong>{count}</strong>
              <span>{v4("clkShare")} {share}%</span>
              <span className="c4-clk-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <section className="c4-clk-chart" aria-label={v4("clkChart")}>
        <p className="c4-clk-kicker">{v4("clkChart")}</p>
        {WATCHES.map((name, index) => {
          const count = bars[index] || 0;
          const width = Math.max(8, Math.round((count / widest) * 100));
          return (
            <button key={name} type="button" className="c4-clk-col" data-on={bellOn === name ? "1" : "0"} aria-pressed={bellOn === name} onClick={() => setBellFilter(bellOn === name ? "all" : name)}>
              <span>{watchName(v4, name)}</span>
              <span className="c4-clk-bar" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
              <span>{count}</span>
            </button>
          );
        })}
      </section>
      <form className="c4-clk-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addCloak(cards, { id: `clk-${Date.now()}`, line, bearer, bell, wing, stamp, tone });
        if (sameCards(next, cards)) return;
        store(next);
        clearDraft();
      }}>
        <label className="c4-lab">
          <span>{v4("clkLine")}</span>
          <input ref={lineRef} className="c4-field" aria-label={v4("clkLine")} value={line} disabled={viewer} onChange={(event) => setLine(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab">
          <span>{v4("clkBearer")}</span>
          <input className="c4-field" aria-label={v4("clkBearer")} value={bearer} disabled={viewer} onChange={(event) => setBearer(event.target.value)} />
        </label>
        <p className="c4-meta" role="status">{v4("clkLoad")} {load}</p>
        <label className="c4-lab">
          <span>{v4("clkBell")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("clkBell")} value={bell} disabled={viewer} onChange={(event) => setBell(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("clkWing")}</span>
          <select className="c4-select" aria-label={v4("clkWing")} value={wing} disabled={viewer} onChange={(event) => setWing(event.target.value)}>
            <option value="">{v4("clkBlankWing")}</option>
            <option value="north">{v4("clkWingNorth")}</option>
            <option value="east">{v4("clkWingEast")}</option>
            <option value="south">{v4("clkWingSouth")}</option>
            <option value="west">{v4("clkWingWest")}</option>
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("clkStamp")}</span>
          <input className="c4-field" aria-label={v4("clkStamp")} value={stamp} disabled={viewer} onChange={(event) => setStamp(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("clkTone")}</span>
          <select className="c4-select" aria-label={v4("clkTone")} value={tone} disabled={viewer} onChange={(event) => setTone(event.target.value)}>
            <option value="">{v4("clkBlankTone")}</option>
            <option value="calm">{v4("clkCalm")}</option>
            <option value="keen">{v4("clkKeen")}</option>
            <option value="urgent">{v4("clkUrgent")}</option>
          </select>
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("clkAdd")}</button>
      </form>
      <div className="c4-row" role="group" aria-label={v4("clkTitle")}>
        <button type="button" className="c4-chip" data-on={tray === "live" ? "1" : "0"} aria-pressed={tray === "live"} onClick={() => setTray("live")}>{v4("clkLive")}</button>
        <button type="button" className="c4-chip" data-on={tray === "queued" ? "1" : "0"} aria-pressed={tray === "queued"} onClick={() => setTray("queued")}>{v4("clkQueued")}</button>
        <button type="button" className="c4-chip" data-on={tray === "folded" ? "1" : "0"} aria-pressed={tray === "folded"} onClick={() => setTray("folded")}>{v4("clkFolded")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("clkTimeline")}</button>
        <button type="button" className="c4-chip" data-on={urgentOnly ? "1" : "0"} aria-pressed={urgentOnly} onClick={() => setUrgentOnly((value) => !value)}>{v4("clkUrgentOnly")}</button>
        <button type="button" className="c4-chip" data-on={nightOnly ? "1" : "0"} aria-pressed={nightOnly} onClick={() => { setNightOnly((value) => !value); setTray("live"); }}>{v4("clkNightOnly")}</button>
        <button type="button" className="c4-btn" onClick={() => download("cloakroom-passes.csv", cloaksCsv(cards, desk))}>{v4("clkCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkCloakStar(cards, shown.map((card) => card.id), true))}>{v4("clkBulkStar")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkCloakFold(cards, shown.map((card) => card.id), true))}>{v4("clkBulkFold")}</button>
        <label className="c4-lab">
          <span>{v4("clkBulkWing")}</span>
          <select className="c4-select" aria-label={v4("clkBulkWing")} value={moveWing} disabled={viewer} onChange={(event) => setMoveWing(event.target.value)}>
            <option value="north">{v4("clkWingNorth")}</option>
            <option value="east">{v4("clkWingEast")}</option>
            <option value="south">{v4("clkWingSouth")}</option>
            <option value="west">{v4("clkWingWest")}</option>
          </select>
        </label>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkCloakWing(cards, shown.map((card) => card.id), moveWing))}>{v4("clkBulkWing")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetCloaks())}>{v4("clkReset")}</button>
      </div>
      <label className="c4-lab">
        <span>{v4("clkSearch")}</span>
        <input ref={searchRef} className="c4-field" aria-label={v4("clkSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      <label className="c4-lab">
        <span>{v4("clkDesk")}</span>
        <input className="c4-field" inputMode="numeric" aria-label={v4("clkDesk")} value={desk} onChange={(event) => setDesk(event.target.value)} />
      </label>
      <p className="c4-meta" role="status">
        {v4("clkNext")} {nextCard ? nextCard.line : v4("clkNextNone")}
      </p>
      <div className="c4-row" role="group" aria-label={v4("clkBearers")}>
        <button type="button" className="c4-chip" data-on={bearerOn === "all" ? "1" : "0"} aria-pressed={bearerOn === "all"} onClick={() => setBearerFilter("all")}>{v4("clkAllBearers")}</button>
        <button type="button" className="c4-chip" data-on={bearerOn === "blank" ? "1" : "0"} aria-pressed={bearerOn === "blank"} onClick={() => setBearerFilter("blank")}>{v4("clkBlankBearer")}</button>
        {bearers.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={bearerOn === name ? "1" : "0"} aria-pressed={bearerOn === name} onClick={() => setBearerFilter(name)}>{name}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("clkWings")}>
        <button type="button" className="c4-chip" data-on={wingOn === "all" ? "1" : "0"} aria-pressed={wingOn === "all"} onClick={() => setWingFilter("all")}>{v4("clkAllWings")}</button>
        <button type="button" className="c4-chip" data-on={wingOn === "blank" ? "1" : "0"} aria-pressed={wingOn === "blank"} onClick={() => setWingFilter("blank")}>{v4("clkBlankWing")}</button>
        {wings.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={wingOn === name ? "1" : "0"} aria-pressed={wingOn === name} onClick={() => setWingFilter(name)}>{wingName(v4, name)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("clkStamps")}>
        <button type="button" className="c4-chip" data-on={stampOn === "all" ? "1" : "0"} aria-pressed={stampOn === "all"} onClick={() => setStampFilter("all")}>{v4("clkAllStamps")}</button>
        <button type="button" className="c4-chip" data-on={stampOn === "blank" ? "1" : "0"} aria-pressed={stampOn === "blank"} onClick={() => setStampFilter("blank")}>{v4("clkBlankStamp")}</button>
        {stamps.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={stampOn === name ? "1" : "0"} aria-pressed={stampOn === name} onClick={() => setStampFilter(name)}>{name}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("clkTones")}>
        <button type="button" className="c4-chip" data-on={toneOn === "all" ? "1" : "0"} aria-pressed={toneOn === "all"} onClick={() => setToneFilter("all")}>{v4("clkAllTones")}</button>
        <button type="button" className="c4-chip" data-on={toneOn === "blank" ? "1" : "0"} aria-pressed={toneOn === "blank"} onClick={() => setToneFilter("blank")}>{v4("clkBlankTone")}</button>
        {tones.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={toneOn === name ? "1" : "0"} aria-pressed={toneOn === name} onClick={() => setToneFilter(name)}>{toneName(v4, name)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("clkBells")}>
        {(["all", "blank", "morning", "afternoon", "night", "quiet", "day"] as const).map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={bellOn === name ? "1" : "0"} aria-pressed={bellOn === name} onClick={() => setBellFilter(name)}>
            {name === "all" ? v4("clkAllBells") : watchName(v4, name)}
          </button>
        ))}
      </div>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addCloakView(views, {
          id: `view-${Date.now()}`,
          name: viewName,
          tray,
          query,
          bearer: bearerOn,
          wing: wingOn,
          stamp: stampOn,
          tone: toneOn,
          bell: bellOn,
        });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab">
          <span>{v4("clkViewName")}</span>
          <input className="c4-field" aria-label={v4("clkViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("clkSaveView")}</button>
      </form>
      <section aria-label={v4("clkViews")}>
        <p className="c4-clk-kicker">{v4("clkViews")}</p>
        {!views.length && <p className="c4-clk-empty">{v4("clkViewEmpty")}</p>}
        <ul className="c4-clk-views">
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropCloakView(views, view.id))}>{v4("clkDropView")}</button>
            </li>
          ))}
        </ul>
      </section>
      {board === "cards" && !shown.length && <p className="c4-clk-empty">{v4("clkEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-clk-rows">
          {shown.map((card) => {
            const clashesOn = cloakClashIds(cards, card.id);
            const stampsOn = stampClashIds(cards, card.id);
            const gap = gapLabel(v4, card.bell, desk);
            const watch = watchOf(card.bell);
            const editingCard = editing === card.id;
            return (
              <li key={card.id} data-tone={card.tone || "blank"} data-wing={card.wing || "blank"} data-watch={watch}>
                <span className="c4-clk-mark" aria-hidden="true">{bellLabel(card.bell)}</span>
                <div>
                  {editingCard ? (
                    <form className="c4-row" onSubmit={(event) => {
                      event.preventDefault();
                      if (viewer) return;
                      store(editCloak(cards, card.id, draft));
                      setEditing("");
                    }}>
                      <input className="c4-field" aria-label={v4("clkEdit")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("clkSaveEdit")}</button>
                    </form>
                  ) : <p>{card.line}</p>}
                  <p className="c4-meta">
                    {card.bearer || v4("clkBlankBearer")}
                    {" · "}
                    {bellLabel(card.bell)}
                    {" · "}
                    {wingName(v4, wingOf(card.wing))}
                    {" · "}
                    {card.stamp || v4("clkBlankStamp")}
                    {" · "}
                    {toneName(v4, toneOf(card.tone))}
                    {watch === "blank" ? "" : ` · ${watchName(v4, watch)}`}
                    {gap ? ` · ${gap}` : ""}
                    {auditName(v4, card.audit) ? ` · ${v4("clkAudit")} ${auditName(v4, card.audit)}` : ""}
                    {" · "}
                    {clashesOn.length ? `${v4("clkClash")} ${clashesOn.length}` : v4("clkClashNone")}
                    {" · "}
                    {stampsOn.length ? `${v4("clkStampClash")} ${stampsOn.length}` : v4("clkStampClashNone")}
                  </p>
                </div>
                <div className="c4-row">
                  <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("clkCopied") : v4("clkCopy")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.line); }}>{v4("clkEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleCloakTone(cards, card.id))}>{v4("clkToneUp")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.starred} onClick={() => store(setCloakStar(cards, card.id, !card.starred))}>{card.starred ? v4("clkUnstar") : v4("clkStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.queued} onClick={() => store(setCloakQueued(cards, card.id, !card.queued))}>{card.queued ? v4("clkRelease") : v4("clkQueue")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.folded} onClick={() => store(setCloakFolded(cards, card.id, !card.folded))}>{card.folded ? v4("clkUnfold") : v4("clkFold")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {board === "timeline" && (
        <ol className="c4-clk-time">
          {timeline.map((card) => (
            <li key={card.id} data-watch={watchOf(card.bell)}>
              <span className="c4-clk-clock">{bellLabel(card.bell)}</span>
              <p>{card.line}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function LoginLatches({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenLatches, setHiddenLatches] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [span, setSpan] = useState("all");
  const [mark, setMark] = useState("all");
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = useMemo(() => (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || "").trim(),
      phone: row.phone,
      latch: row.loginEnabled,
    };
  }).filter((row): row is GlanceRow => Boolean(row)), [data.data?.users]);
  const latchesOn = latchLines(rows);
  const spans = spanLines(rows);
  const marks = markLines(rows);
  const present = presentLatches(rows);
  const presentKey = present.join("\n");
  const latchNames = namedLatches(rows);
  const spanNames = namedSpans(rows);
  const markNames = namedMarks(rows);
  const leadLatch = leadingLatch(rows);
  const leadSpan = leadingSpan(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenLatches(readJson(LATCH_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenLatches(next);
    writeJson(LATCH_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleLatches(present, hiddenLatches, showHidden);
  const spanOn = activeSpan(span, spanNames);
  const markOn = activeMark(mark, markNames);
  const latchOn = selected ? activeLatch(selected, latchNames) : "all";
  const shown = visibleLatchCustomers(
    rows,
    selected ? latchArg(latchOn === "all" && selected === "blank" ? "blank" : latchOn) : null,
    spanArg(spanOn),
    markArg(markOn),
    query,
  );
  const widest = Math.max(1, ...latchesOn.map((line) => line.count));
  const shutCount = latchesOn.find((line) => line.latch === "shut")?.count || 0;

  function store(next: string[], clear: string) {
    setHiddenLatches(next);
    writeJson(LATCH_KEY, next);
    if (clear && selected === clear) setSelected("");
  }

  return (
    <section className="c4-ltc" aria-label={v4("ltcTitle")} data-latches="1">
      <header className="c4-ltc-head">
        <div>
          <p className="c4-clk-kicker">{v4("ltcSub")}</p>
          <h2 className="c4-title">{v4("ltcTitle")}</h2>
        </div>
        <p className="c4-clk-count">{v4("ltcRows")} {rows.length}</p>
      </header>
      <details className="c4-clk-rules">
        <summary>{v4("ltcRules")}</summary>
        <p className="c4-meta">{v4("ltcHint")}</p>
        <p className="c4-meta">{v4("ltcLocal")}</p>
        <p className="c4-meta">{v4("ltcEscape")}</p>
      </details>
      <p className="c4-clk-notice" role="status">
        <span>{v4("ltcShutNotice")}</span>
        <span className="c4-clk-count">{shutCount}</span>
      </p>
      {leadLatch ? <p className="c4-ltc-lead"><span>{v4("ltcLeadLatch")}</span> {latchName(v4, leadLatch)}</p> : null}
      {leadSpan ? <p className="c4-ltc-lead"><span>{v4("ltcLeadSpan")}</span> {spanName(v4, leadSpan)}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("ltcBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("login-latches.csv", latchesCsv(rows))}>{v4("ltcCsv")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("ltcLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("ltcFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-clk-empty">{v4("ltcNone")}</p>}
      {latchesOn.length > 0 && (
        <section className="c4-ltc-chart" aria-label={v4("ltcAllLatches")}>
          {latchesOn.map((line) => {
            const share = ltcShare(line.count, rows.length);
            const width = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.latch || "blank";
            return (
              <p key={name} className="c4-ltc-col" data-latch={name}>
                <span>{latchName(v4, line.latch)}</span>
                <span className="c4-clk-track" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("ltcShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      <div className="c4-row" role="group" aria-label={v4("ltcShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("ltcShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("ltcHidden")}</button>
      </div>
      <div className="c4-ltc-bands" role="group" aria-label={v4("ltcAllLatches")}>
        <button type="button" className="c4-ltc-band" data-on={!selected ? "1" : "0"} aria-pressed={!selected} onClick={() => setSelected("")}>
          <span>{v4("ltcAllLatches")}</span>
          <span className="c4-clk-count">{rows.length}</span>
        </button>
        {chips.map((item) => {
          const count = rows.filter((row) => (latchOf(row.latch) || "blank") === item).length;
          const share = ltcShare(count, rows.length);
          return (
            <span key={item} className="c4-ltc-pair">
              <button type="button" className="c4-ltc-band" data-on={selected === item ? "1" : "0"} aria-pressed={selected === item} onClick={() => setSelected(selected === item ? "" : item)}>
                <span>{latchName(v4, item === "blank" ? "" : item)}</span>
                <span className="c4-clk-count">{count}</span>
                <span>{v4("ltcShare")} {share}%</span>
              </button>
              <button type="button" className="c4-btn" onClick={() => store(toggleLatch(hiddenLatches, item, present), showHidden ? "" : item)}>{showHidden ? v4("ltcShow") : v4("ltcHide")}</button>
            </span>
          );
        })}
      </div>
      <div className="c4-row" role="group" aria-label={v4("ltcSpans")}>
        <button type="button" className="c4-chip" data-on={spanOn === "all" ? "1" : "0"} aria-pressed={spanOn === "all"} onClick={() => setSpan("all")}>{v4("ltcAllSpans")}</button>
        {spans.filter((line) => line.span).map((line) => (
          <button key={line.span} type="button" className="c4-chip" data-on={spanOn === line.span ? "1" : "0"} aria-pressed={spanOn === line.span} onClick={() => setSpan(spanOn === line.span ? "all" : line.span)}>
            {spanName(v4, line.span)} {line.count}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("ltcMarks")}>
        <button type="button" className="c4-chip" data-on={markOn === "all" ? "1" : "0"} aria-pressed={markOn === "all"} onClick={() => setMark("all")}>{v4("ltcAllMarks")}</button>
        {marks.filter((line) => line.mark).map((line) => (
          <button key={line.mark} type="button" className="c4-chip" data-on={markOn === line.mark ? "1" : "0"} aria-pressed={markOn === line.mark} onClick={() => setMark(markOn === line.mark ? "all" : line.mark)}>
            {markName(v4, line.mark)} {line.count}
          </button>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("ltcSearch")}</span>
        <input className="c4-field" aria-label={v4("ltcSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-clk-empty">{v4("ltcEmpty")}</p>}
      <ul className="c4-ltc-rows">
        {shown.map((row) => {
          const latch = latchOf(row.latch) as LatchMark;
          const length = phoneSpanOf(row.phone) as PhoneSpan;
          const phone = phoneMarkOf(row.phone) as PhoneMark;
          return (
            <li key={row.id} data-latch={latch || "blank"} data-span={length || "blank"} data-mark={phone || "blank"}>
              <span className="c4-ltc-face" aria-hidden="true">{length ? length.slice(0, 1).toUpperCase() : "—"}</span>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">
                {latchName(v4, latch)}
                {" · "}
                {spanName(v4, length)}
                {" · "}
                {markName(v4, phone)}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
