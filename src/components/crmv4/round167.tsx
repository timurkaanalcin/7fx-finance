"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  BOLT_KEY,
  NOOK_KEY,
  NOOK_VIEW_KEY,
  activeBolt,
  activeBooth,
  activeInk,
  activeNameMark,
  activeNookMark,
  activePage,
  activeReader,
  activeSpan,
  addNook,
  addNookView,
  bandCounts,
  bandOf,
  boltArg,
  boltLines,
  boltOf,
  boltsCsv,
  boothArg,
  clashNookCount,
  cycleNookInk,
  dropNookView,
  editNook,
  editNookNote,
  inkArg,
  leadingBolt,
  leadingSpan,
  markClashCount,
  markClashIds,
  markLines,
  nameMarkArg,
  nameMarkOf,
  nameSpanOf,
  namedBolts,
  namedMarks,
  namedSpans,
  nextNook,
  nookBooths,
  nookClashIds,
  nookCopy,
  nookCounts,
  nookGap,
  nookInks,
  nookMarks,
  nookMarkArg,
  nookReaders,
  nookShare,
  nookTimeline,
  nooksCsv,
  pageArg,
  presentBolts,
  readHiddenBolts,
  readNookViews,
  readNooks,
  readerArg,
  readerLoad,
  resetNooks,
  setNookDone,
  setNookHeld,
  setNookPin,
  spanArg,
  spanLines,
  suggestBooth,
  toggleBolt,
  visibleBoltCustomers,
  visibleBolts,
  visibleNooks,
  bltShare,
  boothOf,
  bulkNookBooth,
  bulkNookDone,
  bulkNookPin,
  inkOf,
  type BoltMark,
  type BoltRow,
  type NameMark,
  type NameSpan,
  type NookBooth,
  type NookCard,
  type NookInk,
  type NookTray,
  type NookView,
} from "@/lib/crmv4/round167";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  withdrawalsEnabled?: boolean | null;
};

type GlanceRow = BoltRow & { id: string };

const BANDS = ["front", "middle", "back"] as const;

function boothName(v4: V4, booth: NookBooth | string): string {
  if (booth === "red") return v4("nokBoothRed");
  if (booth === "blue") return v4("nokBoothBlue");
  if (booth === "green") return v4("nokBoothGreen");
  if (booth === "ivory") return v4("nokBoothIvory");
  return v4("nokBlankBooth");
}

function inkName(v4: V4, ink: NookInk): string {
  if (ink === "soft") return v4("nokSoft");
  if (ink === "firm") return v4("nokFirm");
  if (ink === "sharp") return v4("nokSharp");
  return v4("nokBlankInk");
}

function bandName(v4: V4, name: string): string {
  if (name === "front") return v4("nokFront");
  if (name === "middle") return v4("nokMiddle");
  if (name === "back") return v4("nokBack");
  if (name === "quiet") return v4("nokQuiet");
  if (name === "day") return v4("nokDay");
  if (/^(?:[1-9]|[1-3][0-9]|40)$/.test(name)) return name;
  return v4("nokBlankPage");
}

function boltName(v4: V4, name: string): string {
  if (name === "free") return v4("bltFree");
  if (name === "held") return v4("bltHeld");
  return v4("bltUnmarked");
}

function spanName(v4: V4, name: string): string {
  if (name === "short") return v4("bltShort");
  if (name === "mid") return v4("bltMid");
  if (name === "long") return v4("bltLong");
  return v4("bltUnmarked");
}

function wordName(v4: V4, name: string): string {
  if (name === "pair") return v4("bltPair");
  if (name === "solo") return v4("bltSolo");
  return v4("bltUnmarked");
}

function auditName(v4: V4, audit: string): string {
  const key = {
    save: "nokAuditSave",
    edit: "nokAuditEdit",
    ink: "nokAuditInk",
    pin: "nokAuditPin",
    unpin: "nokAuditUnpin",
    hold: "nokAuditHold",
    release: "nokAuditRelease",
    done: "nokAuditDone",
    reopen: "nokAuditReopen",
    booth: "nokAuditBooth",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function pageLabel(page: number | null): string {
  return page === null ? "—" : String(page);
}

function gapLabel(v4: V4, page: number | null, desk: string): string {
  const gap = nookGap(page, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("nokPast")} ${gap}`;
  if (gap < 0) return `${v4("nokAhead")} ${Math.abs(gap)}`;
  return v4("nokDue");
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

function sameCards(left: readonly NookCard[], right: readonly NookCard[]): boolean {
  return left.length === right.length && left.every((card, index) => card.id === right[index]?.id && card.title === right[index]?.title && card.aside === right[index]?.aside && card.audit === right[index]?.audit);
}

export function ReadingNooks({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<NookCard[]>([]);
  const [views, setViews] = useState<NookView[]>([]);
  const [title, setTitle] = useState("");
  const [aside, setAside] = useState("");
  const [reader, setReader] = useState("");
  const [page, setPage] = useState("");
  const [booth, setBooth] = useState("");
  const [mark, setMark] = useState("");
  const [ink, setInk] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<NookTray>("open");
  const [readerFilter, setReaderFilter] = useState("all");
  const [boothFilter, setBoothFilter] = useState("all");
  const [markFilter, setMarkFilter] = useState("all");
  const [inkFilter, setInkFilter] = useState("all");
  const [pageFilter, setPageFilter] = useState("all");
  const [sharpOnly, setSharpOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [desk, setDesk] = useState("");
  const [moveBooth, setMoveBooth] = useState("red");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readNooks(readJson(NOOK_KEY, []));
    const saved = readNookViews(readJson(NOOK_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(NOOK_KEY, next);
    writeJson(NOOK_VIEW_KEY, saved);
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
      if (event.key === "r" || event.key === "R") {
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
  const readers = nookReaders(cards);
  const booths = nookBooths(cards);
  const marks = nookMarks(cards);
  const inks = nookInks(cards);
  const bars = bandCounts(cards);
  const readerOn = activeReader(readerFilter, readers);
  const boothOn = activeBooth(boothFilter, booths);
  const markOn = activeNookMark(markFilter, marks);
  const inkOn = activeInk(inkFilter, inks);
  const pageOn = activePage(pageFilter);
  const picked = pageArg(pageOn);
  const shown = visibleNooks(
    cards,
    tray,
    query,
    readerArg(readerOn),
    boothArg(boothOn),
    nookMarkArg(markOn),
    inkArg(inkOn),
    picked.exact,
    picked.pick,
    sharpOnly,
    quietOnly,
  );
  const timeline = nookTimeline(cards, query);
  const counts = nookCounts(cards);
  const clashes = clashNookCount(cards);
  const markClashes = markClashCount(cards);
  const total = cards.length;
  const nextId = nextNook(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const widest = Math.max(1, ...bars);
  const pinned = cards.filter((card) => card.pinned);
  const load = readerLoad(cards, reader);
  const suggested = suggestBooth(cards);

  function store(next: NookCard[]) {
    setCards(next);
    writeJson(NOOK_KEY, next);
  }

  function storeViews(next: NookView[]) {
    setViews(next);
    writeJson(NOOK_VIEW_KEY, next);
  }

  function clearDraft() {
    setTitle("");
    setAside("");
    setReader("");
    setPage("");
    setBooth("");
    setMark("");
    setInk("");
  }

  function copyCard(card: NookCard) {
    const body = nookCopy(card.title);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(card.id);
  }

  function applyView(view: NookView) {
    setTray(view.tray);
    setQuery(view.query);
    setReaderFilter(activeReader(view.reader, nookReaders(cards)));
    setBoothFilter(activeBooth(view.booth, nookBooths(cards)));
    setMarkFilter(activeNookMark(view.mark, nookMarks(cards)));
    setInkFilter(activeInk(view.ink, nookInks(cards)));
    setPageFilter(activePage(view.page));
    setBoard("cards");
    setSharpOnly(false);
    setQuietOnly(false);
  }

  return (
    <section className="c4-nok" aria-label={v4("nokTitle")} data-nooks="1" data-role={role}>
      <header className="c4-nok-head">
        <p className="c4-nok-plate" data-logo="mono">{v4("nokLogo")}</p>
        <div>
          <p className="c4-nok-kicker">{v4("nokSub")}</p>
          <h2 className="c4-title">{v4("nokTitle")}</h2>
        </div>
        <p className="c4-nok-count">{shown.length}</p>
      </header>
      <details className="c4-nok-rules">
        <summary>{v4("nokRules")}</summary>
        <p className="c4-meta">{v4("nokHint")}</p>
        <p className="c4-meta">{v4("nokLocal")}</p>
        <p className="c4-meta">{v4("nokBlank")}</p>
        <p className="c4-meta">{v4("nokReaderBlank")}</p>
        <p className="c4-meta">{v4("nokPageBlank")}</p>
        <p className="c4-meta">{v4("nokBoothBlank")}</p>
        <p className="c4-meta">{v4("nokMarkBlank")}</p>
        <p className="c4-meta">{v4("nokInkBlank")}</p>
        <p className="c4-meta">{v4("nokAsideBlank")}</p>
        <p className="c4-meta">{v4("nokEscape")}</p>
        <p className="c4-meta">{v4("nokSlash")}</p>
        <p className="c4-meta">{v4("nokNew")}</p>
      </details>
      {viewer ? <p className="c4-nok-notice" role="status">{v4("nokViewer")}</p> : null}
      <p className="c4-nok-notice" role="status">
        <span>{v4("nokNotice")}</span>
        <span className="c4-nok-count">{counts.quiet}</span>
        <button type="button" className="c4-btn" aria-pressed={quietOnly} onClick={() => { setQuietOnly((value) => !value); setTray("open"); setBoard("cards"); }}>
          {quietOnly ? v4("nokNoticeAll") : v4("nokNoticeQuiet")}
        </button>
      </p>
      <p className="c4-nok-notice" role="status">
        <span>{v4("nokClash")}</span>
        <span className="c4-nok-count">{clashes}</span>
      </p>
      <p className="c4-nok-notice" role="status">
        <span>{v4("nokMarkClash")}</span>
        <span className="c4-nok-count">{markClashes}</span>
      </p>
      <p className="c4-nok-suggest" role="status">
        <span>{v4("nokSuggest")}</span>
        <strong>{boothName(v4, suggested)}</strong>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setBooth(suggested)}>{v4("nokUseBooth")}</button>
      </p>
      {pinned.length > 0 && (
        <ul className="c4-nok-pins" aria-label={v4("nokPinned")}>
          {pinned.map((card) => (
            <li key={card.id}>
              <button type="button" className="c4-chip" onClick={() => { setQuery(card.title); setBoard("cards"); }}>{card.title}</button>
            </li>
          ))}
        </ul>
      )}
      <section className="c4-nok-kpi" aria-label={v4("nokKpi")}>
        {(["open", "held", "done", "pinned"] as const).map((key) => {
          const count = counts[key];
          const share = nookShare(count, total);
          const label = key === "open" ? v4("nokOpen") : key === "held" ? v4("nokHeld") : key === "done" ? v4("nokFiled") : v4("nokPin");
          return (
            <p key={key} className="c4-nok-meter" data-tray={key}>
              <span>{label}</span>
              <strong>{count}</strong>
              <span>{v4("nokShare")} {share}%</span>
              <span className="c4-nok-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <section className="c4-nok-chart" aria-label={v4("nokChart")}>
        <p className="c4-nok-kicker">{v4("nokChart")}</p>
        {BANDS.map((name, index) => {
          const count = bars[index] || 0;
          const width = Math.max(8, Math.round((count / widest) * 100));
          return (
            <button key={name} type="button" className="c4-nok-col" data-on={pageOn === name ? "1" : "0"} aria-pressed={pageOn === name} onClick={() => setPageFilter(pageOn === name ? "all" : name)}>
              <span>{bandName(v4, name)}</span>
              <span className="c4-nok-bar" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
              <span>{count}</span>
            </button>
          );
        })}
      </section>
      <form className="c4-nok-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addNook(cards, { id: `nok-${Date.now()}`, title, aside, reader, page, booth, mark, ink });
        if (sameCards(next, cards)) return;
        store(next);
        clearDraft();
      }}>
        <label className="c4-lab">
          <span>{v4("nokLine")}</span>
          <input ref={titleRef} className="c4-field" aria-label={v4("nokLine")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab">
          <span>{v4("nokAside")}</span>
          <input className="c4-field" aria-label={v4("nokAside")} value={aside} disabled={viewer} onChange={(event) => setAside(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("nokReader")}</span>
          <input className="c4-field" aria-label={v4("nokReader")} value={reader} disabled={viewer} onChange={(event) => setReader(event.target.value)} />
        </label>
        <p className="c4-meta" role="status">{v4("nokLoad")} {load}</p>
        <label className="c4-lab">
          <span>{v4("nokPage")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("nokPage")} value={page} disabled={viewer} onChange={(event) => setPage(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("nokBooth")}</span>
          <select className="c4-select" aria-label={v4("nokBooth")} value={booth} disabled={viewer} onChange={(event) => setBooth(event.target.value)}>
            <option value="">{v4("nokBlankBooth")}</option>
            <option value="red">{v4("nokBoothRed")}</option>
            <option value="blue">{v4("nokBoothBlue")}</option>
            <option value="green">{v4("nokBoothGreen")}</option>
            <option value="ivory">{v4("nokBoothIvory")}</option>
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("nokMark")}</span>
          <input className="c4-field" aria-label={v4("nokMark")} value={mark} disabled={viewer} onChange={(event) => setMark(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("nokInk")}</span>
          <select className="c4-select" aria-label={v4("nokInk")} value={ink} disabled={viewer} onChange={(event) => setInk(event.target.value)}>
            <option value="">{v4("nokBlankInk")}</option>
            <option value="soft">{v4("nokSoft")}</option>
            <option value="firm">{v4("nokFirm")}</option>
            <option value="sharp">{v4("nokSharp")}</option>
          </select>
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("nokAdd")}</button>
      </form>
      <div className="c4-row" role="group" aria-label={v4("nokTitle")}>
        <button type="button" className="c4-chip" data-on={tray === "open" ? "1" : "0"} aria-pressed={tray === "open"} onClick={() => setTray("open")}>{v4("nokOpen")}</button>
        <button type="button" className="c4-chip" data-on={tray === "held" ? "1" : "0"} aria-pressed={tray === "held"} onClick={() => setTray("held")}>{v4("nokHeld")}</button>
        <button type="button" className="c4-chip" data-on={tray === "done" ? "1" : "0"} aria-pressed={tray === "done"} onClick={() => setTray("done")}>{v4("nokFiled")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("nokTimeline")}</button>
        <button type="button" className="c4-chip" data-on={sharpOnly ? "1" : "0"} aria-pressed={sharpOnly} onClick={() => setSharpOnly((value) => !value)}>{v4("nokSharpOnly")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} aria-pressed={quietOnly} onClick={() => { setQuietOnly((value) => !value); setTray("open"); }}>{v4("nokQuietOnly")}</button>
        <button type="button" className="c4-btn" onClick={() => download("reading-nooks.csv", nooksCsv(cards, desk))}>{v4("nokCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkNookPin(cards, shown.map((card) => card.id), true))}>{v4("nokBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkNookDone(cards, shown.map((card) => card.id), true))}>{v4("nokBulkDone")}</button>
        <label className="c4-lab">
          <span>{v4("nokBulkBooth")}</span>
          <select className="c4-select" aria-label={v4("nokBulkBooth")} value={moveBooth} disabled={viewer} onChange={(event) => setMoveBooth(event.target.value)}>
            <option value="red">{v4("nokBoothRed")}</option>
            <option value="blue">{v4("nokBoothBlue")}</option>
            <option value="green">{v4("nokBoothGreen")}</option>
            <option value="ivory">{v4("nokBoothIvory")}</option>
          </select>
        </label>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkNookBooth(cards, shown.map((card) => card.id), moveBooth))}>{v4("nokBulkBooth")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetNooks())}>{v4("nokReset")}</button>
      </div>
      <label className="c4-lab">
        <span>{v4("nokSearch")}</span>
        <input ref={searchRef} className="c4-field" aria-label={v4("nokSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      <label className="c4-lab">
        <span>{v4("nokDesk")}</span>
        <input className="c4-field" inputMode="numeric" aria-label={v4("nokDesk")} value={desk} onChange={(event) => setDesk(event.target.value)} />
      </label>
      <p className="c4-meta" role="status">
        {v4("nokNext")} {nextCard ? nextCard.title : v4("nokNextNone")}
      </p>
      <div className="c4-row" role="group" aria-label={v4("nokReaders")}>
        <button type="button" className="c4-chip" data-on={readerOn === "all" ? "1" : "0"} aria-pressed={readerOn === "all"} onClick={() => setReaderFilter("all")}>{v4("nokAllReaders")}</button>
        <button type="button" className="c4-chip" data-on={readerOn === "blank" ? "1" : "0"} aria-pressed={readerOn === "blank"} onClick={() => setReaderFilter("blank")}>{v4("nokBlankReader")}</button>
        {readers.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={readerOn === name ? "1" : "0"} aria-pressed={readerOn === name} onClick={() => setReaderFilter(name)}>{name}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("nokBooths")}>
        <button type="button" className="c4-chip" data-on={boothOn === "all" ? "1" : "0"} aria-pressed={boothOn === "all"} onClick={() => setBoothFilter("all")}>{v4("nokAllBooths")}</button>
        <button type="button" className="c4-chip" data-on={boothOn === "blank" ? "1" : "0"} aria-pressed={boothOn === "blank"} onClick={() => setBoothFilter("blank")}>{v4("nokBlankBooth")}</button>
        {booths.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={boothOn === name ? "1" : "0"} aria-pressed={boothOn === name} onClick={() => setBoothFilter(name)}>{boothName(v4, name)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("nokMarks")}>
        <button type="button" className="c4-chip" data-on={markOn === "all" ? "1" : "0"} aria-pressed={markOn === "all"} onClick={() => setMarkFilter("all")}>{v4("nokAllMarks")}</button>
        <button type="button" className="c4-chip" data-on={markOn === "blank" ? "1" : "0"} aria-pressed={markOn === "blank"} onClick={() => setMarkFilter("blank")}>{v4("nokBlankMark")}</button>
        {marks.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={markOn === name ? "1" : "0"} aria-pressed={markOn === name} onClick={() => setMarkFilter(name)}>{name}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("nokInks")}>
        <button type="button" className="c4-chip" data-on={inkOn === "all" ? "1" : "0"} aria-pressed={inkOn === "all"} onClick={() => setInkFilter("all")}>{v4("nokAllInks")}</button>
        <button type="button" className="c4-chip" data-on={inkOn === "blank" ? "1" : "0"} aria-pressed={inkOn === "blank"} onClick={() => setInkFilter("blank")}>{v4("nokBlankInk")}</button>
        {inks.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={inkOn === name ? "1" : "0"} aria-pressed={inkOn === name} onClick={() => setInkFilter(name)}>{inkName(v4, name)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("nokPages")}>
        {(["all", "blank", "front", "middle", "back", "quiet", "day"] as const).map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={pageOn === name ? "1" : "0"} aria-pressed={pageOn === name} onClick={() => setPageFilter(name)}>
            {name === "all" ? v4("nokAllPages") : bandName(v4, name)}
          </button>
        ))}
      </div>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addNookView(views, {
          id: `view-${Date.now()}`,
          name: viewName,
          tray,
          query,
          reader: readerOn,
          booth: boothOn,
          mark: markOn,
          ink: inkOn,
          page: pageOn,
        });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab">
          <span>{v4("nokViewName")}</span>
          <input className="c4-field" aria-label={v4("nokViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("nokSaveView")}</button>
      </form>
      <section aria-label={v4("nokViews")}>
        <p className="c4-nok-kicker">{v4("nokViews")}</p>
        {!views.length && <p className="c4-nok-empty">{v4("nokViewEmpty")}</p>}
        <ul className="c4-nok-views">
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropNookView(views, view.id))}>{v4("nokDropView")}</button>
            </li>
          ))}
        </ul>
      </section>
      {board === "cards" && !shown.length && <p className="c4-nok-empty">{v4("nokEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-nok-rows">
          {shown.map((card) => {
            const clashesOn = nookClashIds(cards, card.id);
            const marksOn = markClashIds(cards, card.id);
            const gap = gapLabel(v4, card.page, desk);
            const band = bandOf(card.page);
            const editingCard = editing === card.id;
            return (
              <li key={card.id} data-ink={card.ink || "blank"} data-booth={card.booth || "blank"} data-band={band}>
                <span className="c4-nok-mark" aria-hidden="true">{pageLabel(card.page)}</span>
                <div>
                  {editingCard ? (
                    <form className="c4-row" onSubmit={(event) => {
                      event.preventDefault();
                      if (viewer) return;
                      const titled = editNook(cards, card.id, draft);
                      store(editNookNote(titled, card.id, noteDraft));
                      setEditing("");
                    }}>
                      <input className="c4-field" aria-label={v4("nokEdit")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <input className="c4-field" aria-label={v4("nokAside")} value={noteDraft} disabled={viewer} onChange={(event) => setNoteDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("nokSaveEdit")}</button>
                    </form>
                  ) : (
                    <>
                      <p>{card.title}</p>
                      {card.aside ? <p className="c4-meta">{card.aside}</p> : null}
                    </>
                  )}
                  <p className="c4-meta">
                    {card.reader || v4("nokBlankReader")}
                    {" · "}
                    {pageLabel(card.page)}
                    {" · "}
                    {boothName(v4, boothOf(card.booth))}
                    {" · "}
                    {card.mark || v4("nokBlankMark")}
                    {" · "}
                    {inkName(v4, inkOf(card.ink))}
                    {band === "blank" ? "" : ` · ${bandName(v4, band)}`}
                    {gap ? ` · ${gap}` : ""}
                    {auditName(v4, card.audit) ? ` · ${v4("nokAudit")} ${auditName(v4, card.audit)}` : ""}
                    {" · "}
                    {clashesOn.length ? `${v4("nokClash")} ${clashesOn.length}` : v4("nokClashNone")}
                    {" · "}
                    {marksOn.length ? `${v4("nokMarkClash")} ${marksOn.length}` : v4("nokMarkClashNone")}
                  </p>
                </div>
                <div className="c4-row">
                  <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("nokCopied") : v4("nokCopy")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); setNoteDraft(card.aside); }}>{v4("nokEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleNookInk(cards, card.id))}>{v4("nokInkUp")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.pinned} onClick={() => store(setNookPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("nokUnpin") : v4("nokPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.held} onClick={() => store(setNookHeld(cards, card.id, !card.held))}>{card.held ? v4("nokRelease") : v4("nokHold")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.done} onClick={() => store(setNookDone(cards, card.id, !card.done))}>{card.done ? v4("nokReopen") : v4("nokDone")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {board === "timeline" && (
        <ol className="c4-nok-time">
          {timeline.map((card) => (
            <li key={card.id} data-band={bandOf(card.page)}>
              <span className="c4-nok-clock">{pageLabel(card.page)}</span>
              <p>{card.title}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function WithdrawalBolts({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenBolts, setHiddenBolts] = useState<string[]>([]);
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
      bolt: row.withdrawalsEnabled,
    };
  }).filter((row): row is GlanceRow => Boolean(row)), [data.data?.users]);
  const boltsOn = boltLines(rows);
  const spans = spanLines(rows);
  const marks = markLines(rows);
  const present = presentBolts(rows);
  const presentKey = present.join("\n");
  const boltNames = namedBolts(rows);
  const spanNames = namedSpans(rows);
  const markNames = namedMarks(rows);
  const leadBolt = leadingBolt(rows);
  const leadSpan = leadingSpan(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenBolts(readJson(BOLT_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenBolts(next);
    writeJson(BOLT_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleBolts(present, hiddenBolts, showHidden);
  const spanOn = activeSpan(span, spanNames);
  const markOn = activeNameMark(mark, markNames);
  const boltOn = selected ? activeBolt(selected, boltNames) : "all";
  const shown = visibleBoltCustomers(
    rows,
    selected ? boltArg(boltOn === "all" && selected === "blank" ? "blank" : boltOn) : null,
    spanArg(spanOn),
    nameMarkArg(markOn),
    query,
  );
  const widest = Math.max(1, ...boltsOn.map((line) => line.count));
  const heldCount = boltsOn.find((line) => line.bolt === "held")?.count || 0;

  function store(next: string[], clear: string) {
    setHiddenBolts(next);
    writeJson(BOLT_KEY, next);
    if (clear && selected === clear) setSelected("");
  }

  return (
    <section className="c4-blt" aria-label={v4("bltTitle")} data-bolts="1">
      <header className="c4-blt-head">
        <div>
          <p className="c4-nok-kicker">{v4("bltSub")}</p>
          <h2 className="c4-title">{v4("bltTitle")}</h2>
        </div>
        <p className="c4-nok-count">{v4("bltRows")} {rows.length}</p>
      </header>
      <details className="c4-nok-rules">
        <summary>{v4("bltRules")}</summary>
        <p className="c4-meta">{v4("bltHint")}</p>
        <p className="c4-meta">{v4("bltLocal")}</p>
        <p className="c4-meta">{v4("bltEscape")}</p>
      </details>
      <p className="c4-nok-notice" role="status">
        <span>{v4("bltHeldNotice")}</span>
        <span className="c4-nok-count">{heldCount}</span>
      </p>
      {leadBolt ? <p className="c4-blt-lead"><span>{v4("bltLeadBolt")}</span> {boltName(v4, leadBolt)}</p> : null}
      {leadSpan ? <p className="c4-blt-lead"><span>{v4("bltLeadSpan")}</span> {spanName(v4, leadSpan)}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("bltBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("withdrawal-bolts.csv", boltsCsv(rows))}>{v4("bltCsv")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("bltLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("bltFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-nok-empty">{v4("bltNone")}</p>}
      {boltsOn.length > 0 && (
        <section className="c4-blt-chart" aria-label={v4("bltAllBolts")}>
          {boltsOn.map((line) => {
            const share = bltShare(line.count, rows.length);
            const width = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.bolt || "blank";
            return (
              <p key={name} className="c4-blt-col" data-bolt={name}>
                <span>{boltName(v4, line.bolt)}</span>
                <span className="c4-nok-track" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("bltShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      <div className="c4-row" role="group" aria-label={v4("bltShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("bltShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("bltHidden")}</button>
      </div>
      <div className="c4-blt-bands" role="group" aria-label={v4("bltAllBolts")}>
        <button type="button" className="c4-blt-band" data-on={!selected ? "1" : "0"} aria-pressed={!selected} onClick={() => setSelected("")}>
          <span>{v4("bltAllBolts")}</span>
          <span className="c4-nok-count">{rows.length}</span>
        </button>
        {chips.map((item) => {
          const count = rows.filter((row) => (boltOf(row.bolt) || "blank") === item).length;
          const share = bltShare(count, rows.length);
          return (
            <span key={item} className="c4-blt-pair">
              <button type="button" className="c4-blt-band" data-on={selected === item ? "1" : "0"} aria-pressed={selected === item} onClick={() => setSelected(selected === item ? "" : item)}>
                <span>{boltName(v4, item === "blank" ? "" : item)}</span>
                <span className="c4-nok-count">{count}</span>
                <span>{v4("bltShare")} {share}%</span>
              </button>
              <button type="button" className="c4-btn" onClick={() => store(toggleBolt(hiddenBolts, item, present), showHidden ? "" : item)}>{showHidden ? v4("bltShow") : v4("bltHide")}</button>
            </span>
          );
        })}
      </div>
      <div className="c4-row" role="group" aria-label={v4("bltSpans")}>
        <button type="button" className="c4-chip" data-on={spanOn === "all" ? "1" : "0"} aria-pressed={spanOn === "all"} onClick={() => setSpan("all")}>{v4("bltAllSpans")}</button>
        {spans.filter((line) => line.span).map((line) => (
          <button key={line.span} type="button" className="c4-chip" data-on={spanOn === line.span ? "1" : "0"} aria-pressed={spanOn === line.span} onClick={() => setSpan(spanOn === line.span ? "all" : line.span)}>
            {spanName(v4, line.span)} {line.count}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("bltMarks")}>
        <button type="button" className="c4-chip" data-on={markOn === "all" ? "1" : "0"} aria-pressed={markOn === "all"} onClick={() => setMark("all")}>{v4("bltAllMarks")}</button>
        {marks.filter((line) => line.mark).map((line) => (
          <button key={line.mark} type="button" className="c4-chip" data-on={markOn === line.mark ? "1" : "0"} aria-pressed={markOn === line.mark} onClick={() => setMark(markOn === line.mark ? "all" : line.mark)}>
            {wordName(v4, line.mark)} {line.count}
          </button>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("bltSearch")}</span>
        <input className="c4-field" aria-label={v4("bltSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-nok-empty">{v4("bltEmpty")}</p>}
      <ul className="c4-blt-rows">
        {shown.map((row) => {
          const bolt = boltOf(row.bolt) as BoltMark;
          const length = nameSpanOf(row.label) as NameSpan;
          const words = nameMarkOf(row.label) as NameMark;
          return (
            <li key={row.id} data-bolt={bolt || "blank"} data-span={length || "blank"} data-mark={words || "blank"}>
              <span className="c4-blt-face" aria-hidden="true">{length ? length.slice(0, 1).toUpperCase() : "—"}</span>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">
                {boltName(v4, bolt)}
                {" · "}
                {spanName(v4, length)}
                {" · "}
                {wordName(v4, words)}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
