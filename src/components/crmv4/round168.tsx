"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  ORIEL_KEY,
  ORIEL_VIEW_KEY,
  TRIAL_KEY,
  activeBay,
  activeCase,
  activeHost,
  activeHour,
  activeOrielMark,
  activeSpan,
  activeTempo,
  activeTrial,
  activeWidth,
  addOriel,
  addOrielView,
  bayArg,
  bayOf,
  bulkOrielBay,
  bulkOrielDone,
  bulkOrielPin,
  caseArg,
  caseLines,
  caseOf,
  clashOrielCount,
  cycleOrielTempo,
  dropOrielView,
  editOriel,
  editOrielNote,
  hostArg,
  hostLoad,
  hourArg,
  orielGap,
  leadingCase,
  leadingTrial,
  namedCases,
  namedTrials,
  namedWidths,
  nextOriel,
  orielBays,
  orielClashIds,
  orielCopy,
  orielCounts,
  orielHosts,
  orielMarkArg,
  orielMarks,
  orielShare,
  orielTempos,
  orielTimeline,
  orielsCsv,
  presentTrials,
  readHiddenTrials,
  readOrielViews,
  readOriels,
  resetOriels,
  setOrielDone,
  setOrielHeld,
  setOrielPin,
  spanArg,
  spanClashCount,
  spanClashIds,
  suggestBay,
  tempoArg,
  tempoOf,
  toggleTrial,
  trialArg,
  trialLines,
  trialOf,
  trialsCsv,
  trlShare,
  visibleOriels,
  visibleTrialCustomers,
  visibleTrials,
  watchCounts,
  watchOf,
  widthArg,
  widthLines,
  widthOf,
  type CaseMark,
  type OrielBay,
  type OrielCard,
  type OrielTempo,
  type OrielTray,
  type OrielView,
  type TrialMark,
  type TrialRow,
  type WidthMark,
} from "@/lib/crmv4/round168";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  country?: string | null;
  isTest?: boolean | null;
};

type GlanceRow = TrialRow & { id: string };

const WATCHES = ["dawn", "noon", "eve"] as const;

function bayName(v4: V4, bay: OrielBay | string): string {
  if (bay === "garden") return v4("orlBayGarden");
  if (bay === "gallery") return v4("orlBayGallery");
  if (bay === "library") return v4("orlBayLibrary");
  if (bay === "terrace") return v4("orlBayTerrace");
  return v4("orlBlankBay");
}

function tempoName(v4: V4, tempo: OrielTempo): string {
  if (tempo === "hush") return v4("orlHush");
  if (tempo === "even") return v4("orlEven");
  if (tempo === "brisk") return v4("orlBrisk");
  return v4("orlBlankTempo");
}

function hourName(v4: V4, name: string): string {
  if (name === "dawn") return v4("orlDawn");
  if (name === "noon") return v4("orlNoon");
  if (name === "eve") return v4("orlEve");
  if (name === "quiet") return v4("orlQuiet");
  if (name === "day") return v4("orlDay");
  if (/^(?:[0-9]|1[0-9]|2[0-3])$/.test(name)) return name;
  return v4("orlBlankHour");
}

function spanName(v4: V4, span: number | null): string {
  if (span === 1) return v4("orlSpan1");
  if (span === 2) return v4("orlSpan2");
  if (span === 3) return v4("orlSpan3");
  if (span === 4) return v4("orlSpan4");
  return v4("orlBlankSpan");
}

function trialName(v4: V4, name: string): string {
  if (name === "trial") return v4("trlTrial");
  if (name === "live") return v4("trlLive");
  return v4("trlUnmarked");
}

function caseName(v4: V4, name: string): string {
  if (name === "upper") return v4("trlUpper");
  if (name === "lower") return v4("trlLower");
  if (name === "mixed") return v4("trlMixed");
  return v4("trlUnmarked");
}

function widthName(v4: V4, name: string): string {
  if (name === "code") return v4("trlCode");
  if (name === "name") return v4("trlName");
  return v4("trlUnmarked");
}

function auditName(v4: V4, audit: string): string {
  const key = {
    save: "orlAuditSave",
    edit: "orlAuditEdit",
    tempo: "orlAuditTempo",
    pin: "orlAuditPin",
    unpin: "orlAuditUnpin",
    hold: "orlAuditHold",
    release: "orlAuditRelease",
    done: "orlAuditDone",
    reopen: "orlAuditReopen",
    bay: "orlAuditBay",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function hourLabel(hour: number | null): string {
  return hour === null ? "—" : String(hour);
}

function gapLabel(v4: V4, hour: number | null, desk: string): string {
  const gap = orielGap(hour, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("orlPast")} ${gap}`;
  if (gap < 0) return `${v4("orlAhead")} ${Math.abs(gap)}`;
  return v4("orlDue");
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

function sameCards(left: readonly OrielCard[], right: readonly OrielCard[]): boolean {
  return left.length === right.length && left.every((card, index) => card.id === right[index]?.id && card.title === right[index]?.title && card.note === right[index]?.note && card.audit === right[index]?.audit);
}

export function OrielHours({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<OrielCard[]>([]);
  const [views, setViews] = useState<OrielView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [host, setHost] = useState("");
  const [hour, setHour] = useState("");
  const [bay, setBay] = useState("");
  const [mark, setMark] = useState("");
  const [tempo, setTempo] = useState("");
  const [span, setSpan] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<OrielTray>("open");
  const [hostFilter, setHostFilter] = useState("all");
  const [bayFilter, setBayFilter] = useState("all");
  const [markFilter, setMarkFilter] = useState("all");
  const [tempoFilter, setTempoFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [spanFilter, setSpanFilter] = useState("all");
  const [briskOnly, setBriskOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [desk, setDesk] = useState("");
  const [moveBay, setMoveBay] = useState("garden");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readOriels(readJson(ORIEL_KEY, []));
    const saved = readOrielViews(readJson(ORIEL_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(ORIEL_KEY, next);
    writeJson(ORIEL_VIEW_KEY, saved);
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
      if (event.key === "o" || event.key === "O") {
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
  const hosts = orielHosts(cards);
  const bays = orielBays(cards);
  const marks = orielMarks(cards);
  const tempos = orielTempos(cards);
  const bars = watchCounts(cards);
  const hostOn = activeHost(hostFilter, hosts);
  const bayOn = activeBay(bayFilter, bays);
  const markOn = activeOrielMark(markFilter, marks);
  const tempoOn = activeTempo(tempoFilter, tempos);
  const hourOn = activeHour(hourFilter);
  const spanOn = activeSpan(spanFilter);
  const picked = hourArg(hourOn);
  const shown = visibleOriels(
    cards,
    tray,
    query,
    hostArg(hostOn),
    bayArg(bayOn),
    orielMarkArg(markOn),
    tempoArg(tempoOn),
    picked.exact,
    picked.pick,
    spanArg(spanOn),
    briskOnly,
    quietOnly,
  );
  const timeline = orielTimeline(cards, query);
  const counts = orielCounts(cards);
  const clashes = clashOrielCount(cards);
  const spanClashes = spanClashCount(cards);
  const total = cards.length;
  const nextId = nextOriel(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const widest = Math.max(1, ...bars);
  const pinned = cards.filter((card) => card.pinned);
  const load = hostLoad(cards, host);
  const suggested = suggestBay(cards);

  function store(next: OrielCard[]) {
    setCards(next);
    writeJson(ORIEL_KEY, next);
  }

  function storeViews(next: OrielView[]) {
    setViews(next);
    writeJson(ORIEL_VIEW_KEY, next);
  }

  function clearDraft() {
    setTitle("");
    setNote("");
    setHost("");
    setHour("");
    setBay("");
    setMark("");
    setTempo("");
    setSpan("");
  }

  function copyCard(card: OrielCard) {
    const body = orielCopy(card.title);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(card.id);
  }

  function applyView(view: OrielView) {
    setTray(view.tray);
    setQuery(view.query);
    setHostFilter(activeHost(view.host, orielHosts(cards)));
    setBayFilter(activeBay(view.bay, orielBays(cards)));
    setMarkFilter(activeOrielMark(view.mark, orielMarks(cards)));
    setTempoFilter(activeTempo(view.tempo, orielTempos(cards)));
    setHourFilter(activeHour(view.hour));
    setSpanFilter(activeSpan(view.span));
    setBoard("cards");
    setBriskOnly(false);
    setQuietOnly(false);
  }

  return (
    <section className="c4-orl" aria-label={v4("orlTitle")} data-oriels="1" data-role={role}>
      <header className="c4-orl-head">
        <p className="c4-orl-plate" data-logo="mono">{v4("orlLogo")}</p>
        <div>
          <p className="c4-orl-kicker">{v4("orlSub")}</p>
          <h2 className="c4-title">{v4("orlTitle")}</h2>
        </div>
        <p className="c4-orl-count">{shown.length}</p>
      </header>
      <details className="c4-orl-rules">
        <summary>{v4("orlRules")}</summary>
        <p className="c4-meta">{v4("orlHint")}</p>
        <p className="c4-meta">{v4("orlLocal")}</p>
        <p className="c4-meta">{v4("orlBlank")}</p>
        <p className="c4-meta">{v4("orlHostBlank")}</p>
        <p className="c4-meta">{v4("orlHourBlank")}</p>
        <p className="c4-meta">{v4("orlBayBlank")}</p>
        <p className="c4-meta">{v4("orlMarkBlank")}</p>
        <p className="c4-meta">{v4("orlTempoBlank")}</p>
        <p className="c4-meta">{v4("orlSpanBlank")}</p>
        <p className="c4-meta">{v4("orlNoteBlank")}</p>
        <p className="c4-meta">{v4("orlEscape")}</p>
        <p className="c4-meta">{v4("orlSlash")}</p>
        <p className="c4-meta">{v4("orlNew")}</p>
      </details>
      {viewer ? <p className="c4-orl-notice" role="status">{v4("orlViewer")}</p> : null}
      <p className="c4-orl-notice" role="status">
        <span>{v4("orlNotice")}</span>
        <span className="c4-orl-count">{counts.quiet}</span>
        <button type="button" className="c4-btn" aria-pressed={quietOnly} onClick={() => { setQuietOnly((value) => !value); setTray("open"); setBoard("cards"); }}>
          {quietOnly ? v4("orlNoticeAll") : v4("orlNoticeQuiet")}
        </button>
      </p>
      <p className="c4-orl-notice" role="status">
        <span>{v4("orlClash")}</span>
        <span className="c4-orl-count">{clashes}</span>
      </p>
      <p className="c4-orl-notice" role="status">
        <span>{v4("orlSpanClash")}</span>
        <span className="c4-orl-count">{spanClashes}</span>
      </p>
      <p className="c4-orl-suggest" role="status">
        <span>{v4("orlSuggest")}</span>
        <strong>{bayName(v4, suggested)}</strong>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setBay(suggested)}>{v4("orlUseBay")}</button>
      </p>
      {pinned.length > 0 && (
        <ul className="c4-orl-pins" aria-label={v4("orlPinned")}>
          {pinned.map((card) => (
            <li key={card.id}>
              <button type="button" className="c4-chip" onClick={() => { setQuery(card.title); setBoard("cards"); }}>{card.title}</button>
            </li>
          ))}
        </ul>
      )}
      <section className="c4-orl-kpi" aria-label={v4("orlKpi")}>
        {(["open", "held", "done", "pinned"] as const).map((key) => {
          const count = counts[key];
          const share = orielShare(count, total);
          const label = key === "open" ? v4("orlOpen") : key === "held" ? v4("orlHeld") : key === "done" ? v4("orlFiled") : v4("orlPin");
          return (
            <p key={key} className="c4-orl-meter" data-tray={key}>
              <span>{label}</span>
              <strong>{count}</strong>
              <span>{v4("orlShare")} {share}%</span>
              <span className="c4-orl-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <section className="c4-orl-chart" aria-label={v4("orlChart")}>
        <p className="c4-orl-kicker">{v4("orlChart")}</p>
        {WATCHES.map((name, index) => {
          const count = bars[index] || 0;
          const width = Math.max(8, Math.round((count / widest) * 100));
          return (
            <button key={name} type="button" className="c4-orl-col" data-on={hourOn === name ? "1" : "0"} aria-pressed={hourOn === name} onClick={() => setHourFilter(hourOn === name ? "all" : name)}>
              <span>{hourName(v4, name)}</span>
              <span className="c4-orl-bar" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
              <span>{count}</span>
            </button>
          );
        })}
      </section>
      <form className="c4-orl-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addOriel(cards, { id: `orl-${Date.now()}`, title, note, host, hour, bay, mark, tempo, span });
        if (sameCards(next, cards)) return;
        store(next);
        clearDraft();
      }}>
        <label className="c4-lab">
          <span>{v4("orlLine")}</span>
          <input ref={titleRef} className="c4-field" aria-label={v4("orlLine")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab">
          <span>{v4("orlNote")}</span>
          <input className="c4-field" aria-label={v4("orlNote")} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("orlHost")}</span>
          <input className="c4-field" aria-label={v4("orlHost")} value={host} disabled={viewer} onChange={(event) => setHost(event.target.value)} />
        </label>
        <p className="c4-meta" role="status">{v4("orlLoad")} {load}</p>
        <label className="c4-lab">
          <span>{v4("orlHour")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("orlHour")} value={hour} disabled={viewer} onChange={(event) => setHour(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("orlBay")}</span>
          <select className="c4-select" aria-label={v4("orlBay")} value={bay} disabled={viewer} onChange={(event) => setBay(event.target.value)}>
            <option value="">{v4("orlBlankBay")}</option>
            <option value="garden">{v4("orlBayGarden")}</option>
            <option value="gallery">{v4("orlBayGallery")}</option>
            <option value="library">{v4("orlBayLibrary")}</option>
            <option value="terrace">{v4("orlBayTerrace")}</option>
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("orlMark")}</span>
          <input className="c4-field" aria-label={v4("orlMark")} value={mark} disabled={viewer} onChange={(event) => setMark(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("orlTempo")}</span>
          <select className="c4-select" aria-label={v4("orlTempo")} value={tempo} disabled={viewer} onChange={(event) => setTempo(event.target.value)}>
            <option value="">{v4("orlBlankTempo")}</option>
            <option value="hush">{v4("orlHush")}</option>
            <option value="even">{v4("orlEven")}</option>
            <option value="brisk">{v4("orlBrisk")}</option>
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("orlSpan")}</span>
          <select className="c4-select" aria-label={v4("orlSpan")} value={span} disabled={viewer} onChange={(event) => setSpan(event.target.value)}>
            <option value="">{v4("orlBlankSpan")}</option>
            <option value="1">{v4("orlSpan1")}</option>
            <option value="2">{v4("orlSpan2")}</option>
            <option value="3">{v4("orlSpan3")}</option>
            <option value="4">{v4("orlSpan4")}</option>
          </select>
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("orlAdd")}</button>
      </form>
      <div className="c4-row" role="group" aria-label={v4("orlTitle")}>
        <button type="button" className="c4-chip" data-on={tray === "open" ? "1" : "0"} aria-pressed={tray === "open"} onClick={() => setTray("open")}>{v4("orlOpen")}</button>
        <button type="button" className="c4-chip" data-on={tray === "held" ? "1" : "0"} aria-pressed={tray === "held"} onClick={() => setTray("held")}>{v4("orlHeld")}</button>
        <button type="button" className="c4-chip" data-on={tray === "done" ? "1" : "0"} aria-pressed={tray === "done"} onClick={() => setTray("done")}>{v4("orlFiled")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("orlTimeline")}</button>
        <button type="button" className="c4-chip" data-on={briskOnly ? "1" : "0"} aria-pressed={briskOnly} onClick={() => setBriskOnly((value) => !value)}>{v4("orlBriskOnly")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} aria-pressed={quietOnly} onClick={() => { setQuietOnly((value) => !value); setTray("open"); }}>{v4("orlQuietOnly")}</button>
        <button type="button" className="c4-btn" onClick={() => download("oriel-hours.csv", orielsCsv(cards, desk))}>{v4("orlCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkOrielPin(cards, shown.map((card) => card.id), true))}>{v4("orlBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkOrielDone(cards, shown.map((card) => card.id), true))}>{v4("orlBulkDone")}</button>
        <label className="c4-lab">
          <span>{v4("orlBulkBay")}</span>
          <select className="c4-select" aria-label={v4("orlBulkBay")} value={moveBay} disabled={viewer} onChange={(event) => setMoveBay(event.target.value)}>
            <option value="garden">{v4("orlBayGarden")}</option>
            <option value="gallery">{v4("orlBayGallery")}</option>
            <option value="library">{v4("orlBayLibrary")}</option>
            <option value="terrace">{v4("orlBayTerrace")}</option>
          </select>
        </label>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkOrielBay(cards, shown.map((card) => card.id), moveBay))}>{v4("orlBulkBay")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetOriels())}>{v4("orlReset")}</button>
      </div>
      <label className="c4-lab">
        <span>{v4("orlSearch")}</span>
        <input ref={searchRef} className="c4-field" aria-label={v4("orlSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      <label className="c4-lab">
        <span>{v4("orlDesk")}</span>
        <input className="c4-field" inputMode="numeric" aria-label={v4("orlDesk")} value={desk} onChange={(event) => setDesk(event.target.value)} />
      </label>
      <p className="c4-meta" role="status">
        {v4("orlNext")} {nextCard ? nextCard.title : v4("orlNextNone")}
      </p>
      <div className="c4-row" role="group" aria-label={v4("orlHosts")}>
        <button type="button" className="c4-chip" data-on={hostOn === "all" ? "1" : "0"} aria-pressed={hostOn === "all"} onClick={() => setHostFilter("all")}>{v4("orlAllHosts")}</button>
        <button type="button" className="c4-chip" data-on={hostOn === "blank" ? "1" : "0"} aria-pressed={hostOn === "blank"} onClick={() => setHostFilter("blank")}>{v4("orlBlankHost")}</button>
        {hosts.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={hostOn === name ? "1" : "0"} aria-pressed={hostOn === name} onClick={() => setHostFilter(name)}>{name}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("orlBays")}>
        <button type="button" className="c4-chip" data-on={bayOn === "all" ? "1" : "0"} aria-pressed={bayOn === "all"} onClick={() => setBayFilter("all")}>{v4("orlAllBays")}</button>
        <button type="button" className="c4-chip" data-on={bayOn === "blank" ? "1" : "0"} aria-pressed={bayOn === "blank"} onClick={() => setBayFilter("blank")}>{v4("orlBlankBay")}</button>
        {bays.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={bayOn === name ? "1" : "0"} aria-pressed={bayOn === name} onClick={() => setBayFilter(name)}>{bayName(v4, name)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("orlMarks")}>
        <button type="button" className="c4-chip" data-on={markOn === "all" ? "1" : "0"} aria-pressed={markOn === "all"} onClick={() => setMarkFilter("all")}>{v4("orlAllMarks")}</button>
        <button type="button" className="c4-chip" data-on={markOn === "blank" ? "1" : "0"} aria-pressed={markOn === "blank"} onClick={() => setMarkFilter("blank")}>{v4("orlBlankMark")}</button>
        {marks.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={markOn === name ? "1" : "0"} aria-pressed={markOn === name} onClick={() => setMarkFilter(name)}>{name}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("orlTempos")}>
        <button type="button" className="c4-chip" data-on={tempoOn === "all" ? "1" : "0"} aria-pressed={tempoOn === "all"} onClick={() => setTempoFilter("all")}>{v4("orlAllTempos")}</button>
        <button type="button" className="c4-chip" data-on={tempoOn === "blank" ? "1" : "0"} aria-pressed={tempoOn === "blank"} onClick={() => setTempoFilter("blank")}>{v4("orlBlankTempo")}</button>
        {tempos.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={tempoOn === name ? "1" : "0"} aria-pressed={tempoOn === name} onClick={() => setTempoFilter(name)}>{tempoName(v4, name)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("orlHours")}>
        {(["all", "blank", "dawn", "noon", "eve", "quiet", "day"] as const).map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={hourOn === name ? "1" : "0"} aria-pressed={hourOn === name} onClick={() => setHourFilter(name)}>
            {name === "all" ? v4("orlAllHours") : hourName(v4, name)}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("orlSpans")}>
        {(["all", "blank", "1", "2", "3", "4"] as const).map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={spanOn === name ? "1" : "0"} aria-pressed={spanOn === name} onClick={() => setSpanFilter(name)}>
            {name === "all" ? v4("orlAllSpans") : name === "blank" ? v4("orlBlankSpan") : spanName(v4, Number(name))}
          </button>
        ))}
      </div>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addOrielView(views, {
          id: `view-${Date.now()}`,
          name: viewName,
          tray,
          query,
          host: hostOn,
          bay: bayOn,
          mark: markOn,
          tempo: tempoOn,
          hour: hourOn,
          span: spanOn,
        });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab">
          <span>{v4("orlViewName")}</span>
          <input className="c4-field" aria-label={v4("orlViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("orlSaveView")}</button>
      </form>
      <section aria-label={v4("orlViews")}>
        <p className="c4-orl-kicker">{v4("orlViews")}</p>
        {!views.length && <p className="c4-orl-empty">{v4("orlViewEmpty")}</p>}
        <ul className="c4-orl-views">
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropOrielView(views, view.id))}>{v4("orlDropView")}</button>
            </li>
          ))}
        </ul>
      </section>
      {board === "cards" && !shown.length && <p className="c4-orl-empty">{v4("orlEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-orl-rows">
          {shown.map((card) => {
            const clashesOn = orielClashIds(cards, card.id);
            const spansOn = spanClashIds(cards, card.id);
            const gap = gapLabel(v4, card.hour, desk);
            const watch = watchOf(card.hour);
            const editingCard = editing === card.id;
            return (
              <li key={card.id} data-tempo={card.tempo || "blank"} data-bay={card.bay || "blank"} data-watch={watch}>
                <span className="c4-orl-mark" aria-hidden="true">{hourLabel(card.hour)}</span>
                <div>
                  {editingCard ? (
                    <form className="c4-row" onSubmit={(event) => {
                      event.preventDefault();
                      if (viewer) return;
                      const titled = editOriel(cards, card.id, draft);
                      store(editOrielNote(titled, card.id, noteDraft));
                      setEditing("");
                    }}>
                      <input className="c4-field" aria-label={v4("orlEdit")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <input className="c4-field" aria-label={v4("orlNote")} value={noteDraft} disabled={viewer} onChange={(event) => setNoteDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("orlSaveEdit")}</button>
                    </form>
                  ) : (
                    <>
                      <p>{card.title}</p>
                      {card.note ? <p className="c4-meta">{card.note}</p> : null}
                    </>
                  )}
                  <p className="c4-meta">
                    {card.host || v4("orlBlankHost")}
                    {" · "}
                    {hourLabel(card.hour)}
                    {" · "}
                    {bayName(v4, bayOf(card.bay))}
                    {" · "}
                    {card.mark || v4("orlBlankMark")}
                    {" · "}
                    {tempoName(v4, tempoOf(card.tempo))}
                    {" · "}
                    {spanName(v4, card.span)}
                    {watch === "blank" ? "" : ` · ${hourName(v4, watch)}`}
                    {gap ? ` · ${gap}` : ""}
                    {auditName(v4, card.audit) ? ` · ${v4("orlAudit")} ${auditName(v4, card.audit)}` : ""}
                    {" · "}
                    {clashesOn.length ? `${v4("orlClash")} ${clashesOn.length}` : v4("orlClashNone")}
                    {" · "}
                    {spansOn.length ? `${v4("orlSpanClash")} ${spansOn.length}` : v4("orlSpanClashNone")}
                  </p>
                </div>
                <div className="c4-row">
                  <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("orlCopied") : v4("orlCopy")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); setNoteDraft(card.note); }}>{v4("orlEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleOrielTempo(cards, card.id))}>{v4("orlTempoUp")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.pinned} onClick={() => store(setOrielPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("orlUnpin") : v4("orlPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.held} onClick={() => store(setOrielHeld(cards, card.id, !card.held))}>{card.held ? v4("orlRelease") : v4("orlHold")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.done} onClick={() => store(setOrielDone(cards, card.id, !card.done))}>{card.done ? v4("orlReopen") : v4("orlDone")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {board === "timeline" && (
        <ol className="c4-orl-time">
          {timeline.map((card) => (
            <li key={card.id} data-watch={watchOf(card.hour)}>
              <span className="c4-orl-clock">{hourLabel(card.hour)}</span>
              <p>{card.title}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function TrialLamps({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenTrials, setHiddenTrials] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [tone, setTone] = useState("all");
  const [width, setWidth] = useState("all");
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = useMemo(() => (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || "").trim(),
      country: row.country,
      trial: row.isTest,
    };
  }).filter((row): row is GlanceRow => Boolean(row)), [data.data?.users]);
  const trialsOn = trialLines(rows);
  const tones = caseLines(rows);
  const widths = widthLines(rows);
  const present = presentTrials(rows);
  const presentKey = present.join("\n");
  const trialNames = namedTrials(rows);
  const toneNames = namedCases(rows);
  const widthNames = namedWidths(rows);
  const leadTrial = leadingTrial(rows);
  const leadCase = leadingCase(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenTrials(readJson(TRIAL_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenTrials(next);
    writeJson(TRIAL_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleTrials(present, hiddenTrials, showHidden);
  const toneOn = activeCase(tone, toneNames);
  const widthOn = activeWidth(width, widthNames);
  const trialOn = selected ? activeTrial(selected, trialNames) : "all";
  const shown = visibleTrialCustomers(
    rows,
    selected ? trialArg(trialOn === "all" && selected === "blank" ? "blank" : trialOn) : null,
    caseArg(toneOn),
    widthArg(widthOn),
    query,
  );
  const widest = Math.max(1, ...trialsOn.map((line) => line.count));
  const trialCount = trialsOn.find((line) => line.trial === "trial")?.count || 0;

  function store(next: string[], clear: string) {
    setHiddenTrials(next);
    writeJson(TRIAL_KEY, next);
    if (clear && selected === clear) setSelected("");
  }

  return (
    <section className="c4-trl" aria-label={v4("trlTitle")} data-trials="1">
      <header className="c4-trl-head">
        <div>
          <p className="c4-orl-kicker">{v4("trlSub")}</p>
          <h2 className="c4-title">{v4("trlTitle")}</h2>
        </div>
        <p className="c4-orl-count">{v4("trlRows")} {rows.length}</p>
      </header>
      <details className="c4-orl-rules">
        <summary>{v4("trlRules")}</summary>
        <p className="c4-meta">{v4("trlHint")}</p>
        <p className="c4-meta">{v4("trlLocal")}</p>
        <p className="c4-meta">{v4("trlEscape")}</p>
      </details>
      <p className="c4-orl-notice" role="status">
        <span>{v4("trlTrialNotice")}</span>
        <span className="c4-orl-count">{trialCount}</span>
      </p>
      {leadTrial ? <p className="c4-trl-lead"><span>{v4("trlLeadTrial")}</span> {trialName(v4, leadTrial)}</p> : null}
      {leadCase ? <p className="c4-trl-lead"><span>{v4("trlLeadCase")}</span> {caseName(v4, leadCase)}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("trlBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("trial-lamps.csv", trialsCsv(rows))}>{v4("trlCsv")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("trlLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("trlFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-orl-empty">{v4("trlNone")}</p>}
      {trialsOn.length > 0 && (
        <section className="c4-trl-chart" aria-label={v4("trlAllTrials")}>
          {trialsOn.map((line) => {
            const share = trlShare(line.count, rows.length);
            const bar = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.trial || "blank";
            return (
              <p key={name} className="c4-trl-col" data-trial={name}>
                <span>{trialName(v4, line.trial)}</span>
                <span className="c4-orl-track" aria-hidden="true"><i style={{ width: `${bar}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("trlShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      <div className="c4-row" role="group" aria-label={v4("trlShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("trlShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("trlHidden")}</button>
      </div>
      <div className="c4-trl-bands" role="group" aria-label={v4("trlAllTrials")}>
        <button type="button" className="c4-trl-band" data-on={!selected ? "1" : "0"} aria-pressed={!selected} onClick={() => setSelected("")}>
          <span>{v4("trlAllTrials")}</span>
          <span className="c4-orl-count">{rows.length}</span>
        </button>
        {chips.map((item) => {
          const count = rows.filter((row) => (trialOf(row.trial) || "blank") === item).length;
          const share = trlShare(count, rows.length);
          return (
            <span key={item} className="c4-trl-pair">
              <button type="button" className="c4-trl-band" data-on={selected === item ? "1" : "0"} aria-pressed={selected === item} onClick={() => setSelected(selected === item ? "" : item)}>
                <span>{trialName(v4, item === "blank" ? "" : item)}</span>
                <span className="c4-orl-count">{count}</span>
                <span>{v4("trlShare")} {share}%</span>
              </button>
              <button type="button" className="c4-btn" onClick={() => store(toggleTrial(hiddenTrials, item, present), showHidden ? "" : item)}>{showHidden ? v4("trlShow") : v4("trlHide")}</button>
            </span>
          );
        })}
      </div>
      <div className="c4-row" role="group" aria-label={v4("trlCases")}>
        <button type="button" className="c4-chip" data-on={toneOn === "all" ? "1" : "0"} aria-pressed={toneOn === "all"} onClick={() => setTone("all")}>{v4("trlAllCases")}</button>
        {tones.filter((line) => line.tone).map((line) => (
          <button key={line.tone} type="button" className="c4-chip" data-on={toneOn === line.tone ? "1" : "0"} aria-pressed={toneOn === line.tone} onClick={() => setTone(toneOn === line.tone ? "all" : line.tone)}>
            {caseName(v4, line.tone)} {line.count}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("trlWidths")}>
        <button type="button" className="c4-chip" data-on={widthOn === "all" ? "1" : "0"} aria-pressed={widthOn === "all"} onClick={() => setWidth("all")}>{v4("trlAllWidths")}</button>
        {widths.filter((line) => line.width).map((line) => (
          <button key={line.width} type="button" className="c4-chip" data-on={widthOn === line.width ? "1" : "0"} aria-pressed={widthOn === line.width} onClick={() => setWidth(widthOn === line.width ? "all" : line.width)}>
            {widthName(v4, line.width)} {line.count}
          </button>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("trlSearch")}</span>
        <input className="c4-field" aria-label={v4("trlSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-orl-empty">{v4("trlEmpty")}</p>}
      <ul className="c4-trl-rows">
        {shown.map((row) => {
          const trial = trialOf(row.trial) as TrialMark;
          const toneMark = caseOf(row.country) as CaseMark;
          const widthMark = widthOf(row.country) as WidthMark;
          return (
            <li key={row.id} data-trial={trial || "blank"} data-case={toneMark || "blank"} data-width={widthMark || "blank"}>
              <span className="c4-trl-face" aria-hidden="true">{toneMark ? toneMark.slice(0, 1).toUpperCase() : "—"}</span>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">
                {trialName(v4, trial)}
                {" · "}
                {caseName(v4, toneMark)}
                {" · "}
                {widthName(v4, widthMark)}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
