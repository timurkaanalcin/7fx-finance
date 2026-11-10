"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  EMBER_KEY,
  STALL_KEY,
  STALL_VIEW_KEY,
  activeBand,
  activeDepth,
  activeInk,
  activePart,
  activePulse,
  activeRank,
  activeSinger,
  activeVerse,
  activeVoice,
  addStall,
  addStallView,
  bandArg,
  bandLines,
  bulkStallFile,
  bulkStallPin,
  bulkStallVoice,
  clashStallCount,
  cycleInk,
  depthArg,
  depthLines,
  dropStallView,
  editStall,
  editStallNote,
  emberBand,
  emberDepth,
  emberShare,
  emberState,
  embersCsv,
  inkArg,
  inkOf,
  lateStall,
  leadingBand,
  leadingDepth,
  nextStall,
  partArg,
  presentBands,
  pulseArg,
  rankArg,
  rankClashCount,
  rankClashIds,
  readHiddenBands,
  readStallViews,
  readStalls,
  resetStalls,
  setStallFiled,
  setStallPin,
  setStallVoice,
  singerArg,
  singerLoad,
  stallClashIds,
  stallCopy,
  stallCounts,
  stallInks,
  stallParts,
  stallShare,
  stallSingers,
  stallTimeline,
  stallVoices,
  stallsCsv,
  suggestSinger,
  suggestVoice,
  toggleBand,
  verseArg,
  verseBand,
  verseGap,
  visibleBands,
  visibleEmberCustomers,
  visibleStalls,
  voiceArg,
  voiceCounts,
  voiceOf,
  type EmberBand,
  type EmberDepth,
  type EmberRow,
  type Stall,
  type StallInk,
  type StallTray,
  type StallView,
  type StallVoice,
} from "@/lib/crmv4/round171";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  lastSeenAt?: string | null;
};

type GlanceRow = EmberRow & { id: string };

const VOICES = ["soprano", "alto", "tenor", "bass"] as const;
const BANDS = ["live", "day", "week", "quiet"] as const;

function voiceName(v4: V4, voice: StallVoice | string): string {
  if (voice === "soprano") return v4("chrVoiceSoprano");
  if (voice === "alto") return v4("chrVoiceAlto");
  if (voice === "tenor") return v4("chrVoiceTenor");
  if (voice === "bass") return v4("chrVoiceBass");
  return v4("chrBlankVoice");
}

function inkName(v4: V4, ink: StallInk): string {
  if (ink === "dry") return v4("chrDry");
  if (ink === "wet") return v4("chrWet");
  if (ink === "gloss") return v4("chrGloss");
  return v4("chrBlankInk");
}

function verseName(v4: V4, name: string): string {
  if (name === "low") return v4("chrLow");
  if (name === "mid") return v4("chrMid");
  if (name === "high") return v4("chrHigh");
  if (name === "end") return v4("chrEnd");
  if (name === "body") return v4("chrBody");
  if (/^(?:[1-9]|1[0-2])$/.test(name)) return name;
  return v4("chrBlankVerse");
}

function rankName(v4: V4, rank: number | null): string {
  if (rank === 1) return v4("chrRank1");
  if (rank === 2) return v4("chrRank2");
  if (rank === 3) return v4("chrRank3");
  if (rank === 4) return v4("chrRank4");
  return v4("chrBlankRank");
}

function pulseName(v4: V4, pulse: number | null): string {
  if (pulse === 2) return v4("chrPulse2");
  if (pulse === 3) return v4("chrPulse3");
  if (pulse === 4) return v4("chrPulse4");
  if (pulse === 6) return v4("chrPulse6");
  return v4("chrBlankPulse");
}

function bandName(v4: V4, name: string): string {
  if (name === "live") return v4("embLive");
  if (name === "day") return v4("embDay");
  if (name === "week") return v4("embWeek");
  if (name === "quiet") return v4("embQuiet");
  if (name === "blank") return v4("embClear");
  return v4("embUnmarked");
}

function depthName(v4: V4, name: string): string {
  if (name === "near") return v4("embNear");
  if (name === "mid") return v4("embMid");
  if (name === "far") return v4("embFar");
  return v4("embUnmarked");
}

function auditName(v4: V4, audit: string): string {
  const key = {
    save: "chrAuditSave",
    edit: "chrAuditEdit",
    ink: "chrAuditInk",
    pin: "chrAuditPin",
    unpin: "chrAuditUnpin",
    voice: "chrAuditVoice",
    hush: "chrAuditHush",
    file: "chrAuditFile",
    reopen: "chrAuditReopen",
    move: "chrAuditMove",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function verseLabel(verse: number | null): string {
  return verse === null ? "—" : String(verse);
}

function gapLabel(v4: V4, verse: number | null, desk: string): string {
  const gap = verseGap(verse, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("chrPast")} ${gap}`;
  if (gap < 0) return `${v4("chrAhead")} ${Math.abs(gap)}`;
  return v4("chrDue");
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

function sameCards(left: readonly Stall[], right: readonly Stall[]): boolean {
  return left.length === right.length && left.every((card, index) => card.id === right[index]?.id && card.title === right[index]?.title && card.note === right[index]?.note && card.audit === right[index]?.audit);
}

export function ChoirStalls({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<Stall[]>([]);
  const [views, setViews] = useState<StallView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [singer, setSinger] = useState("");
  const [verse, setVerse] = useState("");
  const [voice, setVoice] = useState("");
  const [part, setPart] = useState("");
  const [ink, setInk] = useState("");
  const [rank, setRank] = useState("");
  const [pulse, setPulse] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<StallTray>("open");
  const [singerFilter, setSingerFilter] = useState("all");
  const [voiceFilter, setVoiceFilter] = useState("all");
  const [partFilter, setPartFilter] = useState("all");
  const [inkFilter, setInkFilter] = useState("all");
  const [verseFilter, setVerseFilter] = useState("all");
  const [rankFilter, setRankFilter] = useState("all");
  const [pulseFilter, setPulseFilter] = useState("all");
  const [glossOnly, setGlossOnly] = useState(false);
  const [endOnly, setEndOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [desk, setDesk] = useState("");
  const [moveVoice, setMoveVoice] = useState("soprano");
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readStalls(readJson(STALL_KEY, []));
    const saved = readStallViews(readJson(STALL_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(STALL_KEY, next);
    writeJson(STALL_VIEW_KEY, saved);
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
  const singers = stallSingers(cards);
  const voices = stallVoices(cards);
  const parts = stallParts(cards);
  const inks = stallInks(cards);
  const bars = voiceCounts(cards);
  const singerOn = activeSinger(singerFilter, singers);
  const voiceOn = activeVoice(voiceFilter, VOICES);
  const partOn = activePart(partFilter, parts);
  const inkOn = activeInk(inkFilter, inks);
  const verseOn = activeVerse(verseFilter);
  const rankOn = activeRank(rankFilter);
  const pulseOn = activePulse(pulseFilter);
  const pickedVerse = verseArg(verseOn);
  const shown = visibleStalls(
    cards,
    tray,
    query,
    singerArg(singerOn),
    voiceArg(voiceOn),
    partArg(partOn),
    inkArg(inkOn),
    pickedVerse.exact,
    pickedVerse.pick,
    rankArg(rankOn),
    pulseArg(pulseOn),
    glossOnly,
    endOnly,
  );
  const timeline = stallTimeline(cards, query);
  const counts = stallCounts(cards, desk);
  const clashes = clashStallCount(cards);
  const rankClashes = rankClashCount(cards);
  const total = cards.length;
  const nextId = nextStall(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const widest = Math.max(1, ...bars);
  const pinned = cards.filter((card) => card.pinned);
  const load = singerLoad(cards, singer);
  const suggested = suggestVoice(cards);
  const lightSinger = suggestSinger(cards);
  const targets = picked.length ? picked : shown.map((card) => card.id);

  function store(next: Stall[]) {
    setCards(next);
    writeJson(STALL_KEY, next);
  }

  function storeViews(next: StallView[]) {
    setViews(next);
    writeJson(STALL_VIEW_KEY, next);
  }

  function clearDraft() {
    setTitle("");
    setNote("");
    setSinger("");
    setVerse("");
    setVoice("");
    setPart("");
    setInk("");
    setRank("");
    setPulse("");
  }

  function copyCard(card: Stall) {
    const body = stallCopy(card.title);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(card.id);
  }

  function applyView(view: StallView) {
    setTray(view.tray);
    setQuery(view.query);
    setSingerFilter(activeSinger(view.singer, stallSingers(cards)));
    setVoiceFilter(activeVoice(view.voice, VOICES));
    setPartFilter(activePart(view.part, stallParts(cards)));
    setInkFilter(activeInk(view.ink, stallInks(cards)));
    setVerseFilter(activeVerse(view.verse));
    setRankFilter(activeRank(view.rank));
    setPulseFilter(activePulse(view.pulse));
    setBoard("cards");
    setGlossOnly(false);
    setEndOnly(false);
  }

  function togglePick(id: string) {
    setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <section className="c4-chr" aria-label={v4("chrTitle")} data-stalls="1" data-role={role}>
      <header className="c4-chr-head">
        <p className="c4-chr-plate" data-logo="mono">{v4("chrLogo")}</p>
        <div>
          <p className="c4-chr-kicker">{v4("chrSub")}</p>
          <h2 className="c4-title">{v4("chrTitle")}</h2>
        </div>
        <p className="c4-chr-count">{shown.length}</p>
      </header>
      <details className="c4-chr-rules">
        <summary>{v4("chrRules")}</summary>
        <p className="c4-meta">{v4("chrHint")}</p>
        <p className="c4-meta">{v4("chrLocal")}</p>
        <p className="c4-meta">{v4("chrBlank")}</p>
        <p className="c4-meta">{v4("chrSingerBlank")}</p>
        <p className="c4-meta">{v4("chrVerseBlank")}</p>
        <p className="c4-meta">{v4("chrVoiceBlank")}</p>
        <p className="c4-meta">{v4("chrPartBlank")}</p>
        <p className="c4-meta">{v4("chrInkBlank")}</p>
        <p className="c4-meta">{v4("chrRankBlank")}</p>
        <p className="c4-meta">{v4("chrPulseBlank")}</p>
        <p className="c4-meta">{v4("chrNoteBlank")}</p>
        <p className="c4-meta">{v4("chrEscape")}</p>
        <p className="c4-meta">{v4("chrSlash")}</p>
        <p className="c4-meta">{v4("chrNew")}</p>
      </details>
      {viewer ? <p className="c4-chr-notice" role="status">{v4("chrViewer")}</p> : null}
      <p className="c4-chr-notice" role="status">
        <span>{v4("chrNotice")}</span>
        <span className="c4-chr-count">{counts.end}</span>
        <button type="button" className="c4-btn" aria-pressed={endOnly} onClick={() => { setEndOnly((value) => !value); setTray("open"); setBoard("cards"); }}>
          {endOnly ? v4("chrNoticeAll") : v4("chrNoticeEnd")}
        </button>
      </p>
      <p className="c4-chr-notice" role="status">
        <span>{v4("chrLate")}</span>
        <span className="c4-chr-count">{counts.late}</span>
      </p>
      <p className="c4-chr-notice" role="status">
        <span>{v4("chrClash")}</span>
        <span className="c4-chr-count">{clashes}</span>
      </p>
      <p className="c4-chr-notice" role="status">
        <span>{v4("chrRankClash")}</span>
        <span className="c4-chr-count">{rankClashes}</span>
      </p>
      <p className="c4-chr-suggest" role="status">
        <span>{v4("chrSuggest")}</span>
        <strong>{voiceName(v4, suggested)}</strong>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setVoice(suggested)}>{v4("chrUseVoice")}</button>
      </p>
      <p className="c4-chr-suggest" role="status">
        <span>{v4("chrSuggestSinger")}</span>
        <strong>{lightSinger || v4("chrBlankSinger")}</strong>
        <button type="button" className="c4-btn" disabled={viewer || !lightSinger} onClick={() => setSinger(lightSinger)}>{v4("chrUseSinger")}</button>
      </p>
      {pinned.length > 0 && (
        <ul className="c4-chr-pins" aria-label={v4("chrPinned")}>
          {pinned.map((card) => (
            <li key={card.id}>
              <button type="button" className="c4-chip" onClick={() => { setQuery(card.title); setBoard("cards"); }}>{card.title}</button>
            </li>
          ))}
        </ul>
      )}
      <section className="c4-chr-kpi" aria-label={v4("chrKpi")}>
        {(["open", "voiced", "filed", "pinned"] as const).map((key) => {
          const count = counts[key];
          const share = stallShare(count, total);
          const label = key === "open" ? v4("chrWaiting") : key === "voiced" ? v4("chrVoiced") : key === "filed" ? v4("chrFiled") : v4("chrPin");
          return (
            <p key={key} className="c4-chr-meter" data-tray={key}>
              <span>{label}</span>
              <strong>{count}</strong>
              <span>{v4("chrShare")} {share}%</span>
              <span className="c4-chr-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <section className="c4-chr-chart" aria-label={v4("chrChart")}>
        <p className="c4-chr-kicker">{v4("chrChart")}</p>
        {VOICES.map((name, index) => {
          const count = bars[index] || 0;
          const width = Math.max(8, Math.round((count / widest) * 100));
          return (
            <button key={name} type="button" className="c4-chr-col" data-on={voiceOn === name ? "1" : "0"} aria-pressed={voiceOn === name} onClick={() => setVoiceFilter(voiceOn === name ? "all" : name)}>
              <span>{voiceName(v4, name)}</span>
              <span className="c4-chr-bar" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
              <span>{count}</span>
            </button>
          );
        })}
      </section>
      <div className="c4-chr-split">
        <form className="c4-chr-form" onSubmit={(event) => {
          event.preventDefault();
          if (viewer) return;
          const next = addStall(cards, { id: `chr-${Date.now()}`, title, note, singer, verse, voice, part, ink, rank, pulse });
          if (sameCards(next, cards)) return;
          store(next);
          clearDraft();
        }}>
          <label className="c4-lab">
            <span>{v4("chrLine")}</span>
            <input ref={titleRef} className="c4-field" aria-label={v4("chrLine")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              event.preventDefault();
              clearDraft();
            }} />
          </label>
          <label className="c4-lab">
            <span>{v4("chrNote")}</span>
            <input className="c4-field" aria-label={v4("chrNote")} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} />
          </label>
          <label className="c4-lab">
            <span>{v4("chrSinger")}</span>
            <input className="c4-field" aria-label={v4("chrSinger")} value={singer} disabled={viewer} onChange={(event) => setSinger(event.target.value)} />
          </label>
          <p className="c4-meta" role="status">{v4("chrLoad")} {load}</p>
          <label className="c4-lab">
            <span>{v4("chrVerse")}</span>
            <input className="c4-field" inputMode="numeric" aria-label={v4("chrVerse")} value={verse} disabled={viewer} onChange={(event) => setVerse(event.target.value)} />
          </label>
          <label className="c4-lab">
            <span>{v4("chrVoice")}</span>
            <select className="c4-select" aria-label={v4("chrVoice")} value={voice} disabled={viewer} onChange={(event) => setVoice(event.target.value)}>
              <option value="">{v4("chrBlankVoice")}</option>
              <option value="soprano">{v4("chrVoiceSoprano")}</option>
              <option value="alto">{v4("chrVoiceAlto")}</option>
              <option value="tenor">{v4("chrVoiceTenor")}</option>
              <option value="bass">{v4("chrVoiceBass")}</option>
            </select>
          </label>
          <label className="c4-lab">
            <span>{v4("chrPart")}</span>
            <input className="c4-field" aria-label={v4("chrPart")} value={part} disabled={viewer} onChange={(event) => setPart(event.target.value)} />
          </label>
          <label className="c4-lab">
            <span>{v4("chrInk")}</span>
            <select className="c4-select" aria-label={v4("chrInk")} value={ink} disabled={viewer} onChange={(event) => setInk(event.target.value)}>
              <option value="">{v4("chrBlankInk")}</option>
              <option value="dry">{v4("chrDry")}</option>
              <option value="wet">{v4("chrWet")}</option>
              <option value="gloss">{v4("chrGloss")}</option>
            </select>
          </label>
          <label className="c4-lab">
            <span>{v4("chrRank")}</span>
            <select className="c4-select" aria-label={v4("chrRank")} value={rank} disabled={viewer} onChange={(event) => setRank(event.target.value)}>
              <option value="">{v4("chrBlankRank")}</option>
              <option value="1">{v4("chrRank1")}</option>
              <option value="2">{v4("chrRank2")}</option>
              <option value="3">{v4("chrRank3")}</option>
              <option value="4">{v4("chrRank4")}</option>
            </select>
          </label>
          <label className="c4-lab">
            <span>{v4("chrPulse")}</span>
            <select className="c4-select" aria-label={v4("chrPulse")} value={pulse} disabled={viewer} onChange={(event) => setPulse(event.target.value)}>
              <option value="">{v4("chrBlankPulse")}</option>
              <option value="2">{v4("chrPulse2")}</option>
              <option value="3">{v4("chrPulse3")}</option>
              <option value="4">{v4("chrPulse4")}</option>
              <option value="6">{v4("chrPulse6")}</option>
            </select>
          </label>
          <button type="submit" className="c4-btn" disabled={viewer}>{v4("chrAdd")}</button>
        </form>
        <div className="c4-chr-board">
          <div className="c4-row" role="group" aria-label={v4("chrTitle")}>
            <button type="button" className="c4-chip" data-on={tray === "open" ? "1" : "0"} aria-pressed={tray === "open"} onClick={() => setTray("open")}>{v4("chrWaiting")}</button>
            <button type="button" className="c4-chip" data-on={tray === "voiced" ? "1" : "0"} aria-pressed={tray === "voiced"} onClick={() => setTray("voiced")}>{v4("chrVoiced")}</button>
            <button type="button" className="c4-chip" data-on={tray === "filed" ? "1" : "0"} aria-pressed={tray === "filed"} onClick={() => setTray("filed")}>{v4("chrFiled")}</button>
            <button type="button" className="c4-chip" data-on={board === "cards" ? "1" : "0"} aria-pressed={board === "cards"} onClick={() => setBoard("cards")}>{v4("chrCards")}</button>
            <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard("timeline")}>{v4("chrTimeline")}</button>
            <button type="button" className="c4-chip" data-on={glossOnly ? "1" : "0"} aria-pressed={glossOnly} onClick={() => setGlossOnly((value) => !value)}>{v4("chrGlossOnly")}</button>
            <button type="button" className="c4-chip" data-on={endOnly ? "1" : "0"} aria-pressed={endOnly} onClick={() => { setEndOnly((value) => !value); setTray("open"); }}>{v4("chrEndOnly")}</button>
            <button type="button" className="c4-btn" onClick={() => download("choir-stalls.csv", stallsCsv(cards, desk))}>{v4("chrCsv")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setPicked(shown.map((card) => card.id))}>{v4("chrPickAll")}</button>
            <button type="button" className="c4-btn" onClick={() => setPicked([])}>{v4("chrPickNone")}</button>
            <span className="c4-chr-count">{v4("chrPicked")} {picked.length}</span>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkStallPin(cards, targets, true))}>{v4("chrBulkPin")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkStallFile(cards, targets, true))}>{v4("chrBulkFile")}</button>
            <label className="c4-lab">
              <span>{v4("chrBulkVoice")}</span>
              <select className="c4-select" aria-label={v4("chrBulkVoice")} value={moveVoice} disabled={viewer} onChange={(event) => setMoveVoice(event.target.value)}>
                <option value="soprano">{v4("chrVoiceSoprano")}</option>
                <option value="alto">{v4("chrVoiceAlto")}</option>
                <option value="tenor">{v4("chrVoiceTenor")}</option>
                <option value="bass">{v4("chrVoiceBass")}</option>
              </select>
            </label>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkStallVoice(cards, targets, moveVoice))}>{v4("chrBulkVoice")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(resetStalls()); setPicked([]); }}>{v4("chrReset")}</button>
          </div>
          <label className="c4-lab">
            <span>{v4("chrSearch")}</span>
            <input ref={searchRef} className="c4-field" aria-label={v4("chrSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              event.preventDefault();
              setQuery("");
            }} />
          </label>
          <label className="c4-lab">
            <span>{v4("chrDesk")}</span>
            <input className="c4-field" inputMode="numeric" aria-label={v4("chrDesk")} value={desk} onChange={(event) => setDesk(event.target.value)} />
          </label>
          <p className="c4-meta" role="status">
            {v4("chrNext")} {nextCard ? nextCard.title : v4("chrNextNone")}
          </p>
          <div className="c4-row" role="group" aria-label={v4("chrSingers")}>
            <button type="button" className="c4-chip" data-on={singerOn === "all" ? "1" : "0"} aria-pressed={singerOn === "all"} onClick={() => setSingerFilter("all")}>{v4("chrAllSingers")}</button>
            <button type="button" className="c4-chip" data-on={singerOn === "blank" ? "1" : "0"} aria-pressed={singerOn === "blank"} onClick={() => setSingerFilter("blank")}>{v4("chrBlankSinger")}</button>
            {singers.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={singerOn === name ? "1" : "0"} aria-pressed={singerOn === name} onClick={() => setSingerFilter(name)}>{name}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("chrVoices")}>
            <button type="button" className="c4-chip" data-on={voiceOn === "all" ? "1" : "0"} aria-pressed={voiceOn === "all"} onClick={() => setVoiceFilter("all")}>{v4("chrAllVoices")}</button>
            <button type="button" className="c4-chip" data-on={voiceOn === "blank" ? "1" : "0"} aria-pressed={voiceOn === "blank"} onClick={() => setVoiceFilter("blank")}>{v4("chrBlankVoice")}</button>
            {voices.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={voiceOn === name ? "1" : "0"} aria-pressed={voiceOn === name} onClick={() => setVoiceFilter(name)}>{voiceName(v4, name)}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("chrParts")}>
            <button type="button" className="c4-chip" data-on={partOn === "all" ? "1" : "0"} aria-pressed={partOn === "all"} onClick={() => setPartFilter("all")}>{v4("chrAllParts")}</button>
            <button type="button" className="c4-chip" data-on={partOn === "blank" ? "1" : "0"} aria-pressed={partOn === "blank"} onClick={() => setPartFilter("blank")}>{v4("chrBlankPart")}</button>
            {parts.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={partOn === name ? "1" : "0"} aria-pressed={partOn === name} onClick={() => setPartFilter(name)}>{name}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("chrInks")}>
            <button type="button" className="c4-chip" data-on={inkOn === "all" ? "1" : "0"} aria-pressed={inkOn === "all"} onClick={() => setInkFilter("all")}>{v4("chrAllInks")}</button>
            <button type="button" className="c4-chip" data-on={inkOn === "blank" ? "1" : "0"} aria-pressed={inkOn === "blank"} onClick={() => setInkFilter("blank")}>{v4("chrBlankInk")}</button>
            {inks.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={inkOn === name ? "1" : "0"} aria-pressed={inkOn === name} onClick={() => setInkFilter(name)}>{inkName(v4, name)}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("chrVerses")}>
            {(["all", "blank", "low", "mid", "high", "end", "body"] as const).map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={verseOn === name ? "1" : "0"} aria-pressed={verseOn === name} onClick={() => setVerseFilter(name)}>
                {name === "all" ? v4("chrAllVerses") : verseName(v4, name)}
              </button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("chrRanks")}>
            {(["all", "blank", "1", "2", "3", "4"] as const).map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={rankOn === name ? "1" : "0"} aria-pressed={rankOn === name} onClick={() => setRankFilter(name)}>
                {name === "all" ? v4("chrAllRanks") : name === "blank" ? v4("chrBlankRank") : rankName(v4, Number(name))}
              </button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("chrPulses")}>
            {(["all", "blank", "2", "3", "4", "6"] as const).map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={pulseOn === name ? "1" : "0"} aria-pressed={pulseOn === name} onClick={() => setPulseFilter(name)}>
                {name === "all" ? v4("chrAllPulses") : name === "blank" ? v4("chrBlankPulse") : pulseName(v4, Number(name))}
              </button>
            ))}
          </div>
          <form className="c4-row" onSubmit={(event) => {
            event.preventDefault();
            if (viewer) return;
            const next = addStallView(views, {
              id: `view-${Date.now()}`,
              name: viewName,
              tray,
              query,
              singer: singerOn,
              voice: voiceOn,
              part: partOn,
              ink: inkOn,
              verse: verseOn,
              rank: rankOn,
              pulse: pulseOn,
            });
            if (next.length === views.length) return;
            storeViews(next);
            setViewName("");
          }}>
            <label className="c4-lab">
              <span>{v4("chrViewName")}</span>
              <input className="c4-field" aria-label={v4("chrViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
            </label>
            <button type="submit" className="c4-btn" disabled={viewer}>{v4("chrSaveView")}</button>
          </form>
          <section aria-label={v4("chrViews")}>
            <p className="c4-chr-kicker">{v4("chrViews")}</p>
            {!views.length && <p className="c4-chr-empty">{v4("chrViewEmpty")}</p>}
            <ul className="c4-chr-views">
              {views.map((view) => (
                <li key={view.id}>
                  <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropStallView(views, view.id))}>{v4("chrDropView")}</button>
                </li>
              ))}
            </ul>
          </section>
          {board === "cards" && !shown.length && <p className="c4-chr-empty">{v4("chrEmpty")}</p>}
          {board === "cards" && (
            <ul className="c4-chr-rows">
              {shown.map((card) => {
                const clashesOn = stallClashIds(cards, card.id);
                const ranksOn = rankClashIds(cards, card.id);
                const gap = gapLabel(v4, card.verse, desk);
                const band = verseBand(card.verse);
                const editingCard = editing === card.id;
                const late = lateStall(card, desk);
                return (
                  <li key={card.id} data-ink={card.ink || "blank"} data-voice={card.voice || "blank"} data-band={band} data-late={late ? "1" : "0"}>
                    <span className="c4-chr-mark" aria-hidden="true">{verseLabel(card.verse)}</span>
                    <div>
                      <label className="c4-chr-pick">
                        <input type="checkbox" checked={picked.includes(card.id)} aria-label={v4("chrPick")} onChange={() => togglePick(card.id)} />
                        <span>{v4("chrPick")}</span>
                      </label>
                      {editingCard ? (
                        <form className="c4-row" onSubmit={(event) => {
                          event.preventDefault();
                          if (viewer) return;
                          const titled = editStall(cards, card.id, draft);
                          store(editStallNote(titled, card.id, noteDraft));
                          setEditing("");
                        }}>
                          <input className="c4-field" aria-label={v4("chrEdit")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                          <input className="c4-field" aria-label={v4("chrNote")} value={noteDraft} disabled={viewer} onChange={(event) => setNoteDraft(event.target.value)} />
                          <button type="submit" className="c4-btn" disabled={viewer}>{v4("chrSaveEdit")}</button>
                        </form>
                      ) : (
                        <>
                          <p>{card.title}</p>
                          {card.note ? <p className="c4-meta">{card.note}</p> : null}
                        </>
                      )}
                      <p className="c4-meta">
                        {card.singer || v4("chrBlankSinger")}
                        {" · "}
                        {verseLabel(card.verse)}
                        {" · "}
                        {voiceName(v4, voiceOf(card.voice))}
                        {" · "}
                        {card.part || v4("chrBlankPart")}
                        {" · "}
                        {inkName(v4, inkOf(card.ink))}
                        {" · "}
                        {rankName(v4, card.rank)}
                        {" · "}
                        {pulseName(v4, card.pulse)}
                        {band === "blank" ? "" : ` · ${verseName(v4, band)}`}
                        {gap ? ` · ${gap}` : ""}
                        {late ? ` · ${v4("chrLate")}` : ""}
                        {auditName(v4, card.audit) ? ` · ${v4("chrAudit")} ${auditName(v4, card.audit)}` : ""}
                        {" · "}
                        {clashesOn.length ? `${v4("chrClash")} ${clashesOn.length}` : v4("chrClashNone")}
                        {" · "}
                        {ranksOn.length ? `${v4("chrRankClash")} ${ranksOn.length}` : v4("chrRankClashNone")}
                      </p>
                    </div>
                    <div className="c4-row">
                      <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("chrCopied") : v4("chrCopy")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); setNoteDraft(card.note); }}>{v4("chrEdit")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleInk(cards, card.id))}>{v4("chrInkUp")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.pinned} onClick={() => store(setStallPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("chrUnpin") : v4("chrPin")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.voiced} onClick={() => store(setStallVoice(cards, card.id, !card.voiced))}>{card.voiced ? v4("chrHush") : v4("chrVoiceOn")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.filed} onClick={() => store(setStallFiled(cards, card.id, !card.filed))}>{card.filed ? v4("chrReopen") : v4("chrFile")}</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {board === "timeline" && (
            <ol className="c4-chr-time">
              {timeline.map((card) => (
                <li key={card.id} data-band={verseBand(card.verse)}>
                  <span className="c4-chr-clock">{verseLabel(card.verse)}</span>
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

export function EmberAges({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [now] = useState(() => new Date().toISOString());
  const [hiddenBands, setHiddenBands] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [depth, setDepth] = useState("all");
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = useMemo(() => (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || "").trim(),
      at: row.lastSeenAt,
    };
  }).filter((row): row is GlanceRow => Boolean(row)), [data.data?.users]);
  const bandsOn = bandLines(rows, now);
  const depths = depthLines(rows, now);
  const present = presentBands(rows, now);
  const presentKey = present.join("\n");
  const bandNames = present.filter((item) => item !== "blank");
  const depthNames = depths.map((line) => line.depth).filter(Boolean);
  const leadBand = leadingBand(rows, now);
  const leadDepth = leadingDepth(rows, now);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenBands(readJson(EMBER_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenBands(next);
    writeJson(EMBER_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleBands(present, hiddenBands, showHidden);
  const depthOn = activeDepth(depth, depthNames);
  const bandOn = selected ? activeBand(selected, bandNames) : "all";
  const shown = visibleEmberCustomers(
    rows,
    selected ? bandArg(bandOn === "all" && selected === "blank" ? "blank" : bandOn) : null,
    depthArg(depthOn),
    query,
    now,
  );
  const widest = Math.max(1, ...bandsOn.map((line) => line.count));
  const setCount = rows.filter((row) => emberState(row.at) === "set").length;

  function store(next: string[], clear: string) {
    setHiddenBands(next);
    writeJson(EMBER_KEY, next);
    if (clear && selected === clear) setSelected("");
  }

  return (
    <section className="c4-emb" aria-label={v4("embTitle")} data-embers="1">
      <header className="c4-emb-head">
        <div>
          <p className="c4-chr-kicker">{v4("embSub")}</p>
          <h2 className="c4-title">{v4("embTitle")}</h2>
        </div>
        <p className="c4-chr-count">{v4("embRows")} {rows.length}</p>
      </header>
      <details className="c4-chr-rules">
        <summary>{v4("embRules")}</summary>
        <p className="c4-meta">{v4("embHint")}</p>
        <p className="c4-meta">{v4("embLocal")}</p>
        <p className="c4-meta">{v4("embEscape")}</p>
      </details>
      <p className="c4-chr-notice" role="status">
        <span>{v4("embSetNotice")}</span>
        <span className="c4-chr-count">{setCount}</span>
      </p>
      {leadBand ? <p className="c4-emb-lead"><span>{v4("embLeadBand")}</span> {bandName(v4, leadBand)}</p> : null}
      {leadDepth ? <p className="c4-emb-lead"><span>{v4("embLeadDepth")}</span> {depthName(v4, leadDepth)}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("embBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("last-seen-embers.csv", embersCsv(rows, now))}>{v4("embCsv")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("embLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("embFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-chr-empty">{v4("embNone")}</p>}
      {bandsOn.length > 0 && (
        <section className="c4-emb-chart" aria-label={v4("embAllBands")}>
          {bandsOn.map((line) => {
            const share = emberShare(line.count, rows.length);
            const bar = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.band || "blank";
            return (
              <p key={name} className="c4-emb-col" data-band={name}>
                <span>{bandName(v4, line.band)}</span>
                <span className="c4-chr-track" aria-hidden="true"><i style={{ width: `${bar}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("embShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      <div className="c4-row" role="group" aria-label={v4("embShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("embShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("embHidden")}</button>
      </div>
      <div className="c4-emb-bands" role="group" aria-label={v4("embAllBands")}>
        <button type="button" className="c4-emb-band" data-on={!selected ? "1" : "0"} aria-pressed={!selected} onClick={() => setSelected("")}>
          <span>{v4("embAllBands")}</span>
          <span className="c4-chr-count">{rows.length}</span>
        </button>
        {chips.map((item) => {
          const count = rows.filter((row) => {
            const state = emberState(row.at);
            const token = state === "set" ? emberBand(row.at, now) : state === "clear" ? "blank" : "";
            return token === item;
          }).length;
          const share = emberShare(count, rows.length);
          return (
            <span key={item} className="c4-emb-pair">
              <button type="button" className="c4-emb-band" data-on={selected === item ? "1" : "0"} aria-pressed={selected === item} onClick={() => setSelected(selected === item ? "" : item)}>
                <span>{bandName(v4, item)}</span>
                <span className="c4-chr-count">{count}</span>
                <span>{v4("embShare")} {share}%</span>
              </button>
              <button type="button" className="c4-btn" onClick={() => store(toggleBand(hiddenBands, item, present), showHidden ? "" : item)}>{showHidden ? v4("embShow") : v4("embHide")}</button>
            </span>
          );
        })}
      </div>
      <div className="c4-row" role="group" aria-label={v4("embDepths")}>
        <button type="button" className="c4-chip" data-on={depthOn === "all" ? "1" : "0"} aria-pressed={depthOn === "all"} onClick={() => setDepth("all")}>{v4("embAllDepths")}</button>
        {depths.filter((line) => line.depth).map((line) => (
          <button key={line.depth} type="button" className="c4-chip" data-on={depthOn === line.depth ? "1" : "0"} aria-pressed={depthOn === line.depth} onClick={() => setDepth(depthOn === line.depth ? "all" : line.depth)}>
            {depthName(v4, line.depth)} {line.count}
          </button>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("embSearch")}</span>
        <input className="c4-field" aria-label={v4("embSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-chr-empty">{v4("embEmpty")}</p>}
      <ul className="c4-emb-rows">
        {shown.map((row) => {
          const state = emberState(row.at);
          const band = emberBand(row.at, now) as EmberBand;
          const depthMark = emberDepth(row.at, now) as EmberDepth;
          return (
            <li key={row.id} data-state={state || "blank"} data-band={band || "blank"} data-depth={depthMark || "blank"}>
              <span className="c4-emb-face" aria-hidden="true">{band ? band.slice(0, 1).toUpperCase() : "—"}</span>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">
                {state === "set" ? bandName(v4, band) : state === "clear" ? v4("embClear") : v4("embUnmarked")}
                {" · "}
                {depthName(v4, depthMark)}
              </p>
            </li>
          );
        })}
      </ul>
      <p className="c4-meta">{BANDS.map((name) => bandName(v4, name)).join(" · ")}</p>
    </section>
  );
}
