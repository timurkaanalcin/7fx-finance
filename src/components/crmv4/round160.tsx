"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  CLOTH_KEY,
  STITCH_KEY,
  STITCH_VIEW_KEY,
  activeBinder,
  activeCloth,
  activeFold,
  activeGlyph,
  activeLength,
  activeStitch,
  activeTension,
  activeThread,
  activeTicket,
  addStitch,
  addStitchView,
  bandCounts,
  bandOf,
  binderArg,
  bulkStitchBound,
  bulkStitchPinned,
  clashStitchCount,
  clothArg,
  clothName,
  clothShare,
  clothsCsv,
  dropStitchView,
  editStitch,
  foldArg,
  foldLines,
  foldOf,
  glyphArg,
  glyphLines,
  glyphOf,
  leadingCloth,
  leadingLength,
  lengthArg,
  lengthLines,
  lengthOf,
  namedCloths,
  namedFolds,
  namedGlyphs,
  namedLengths,
  nextStitch,
  reachOf,
  readHiddenCloths,
  readStitchViews,
  readStitches,
  resetStitches,
  setStitchBasted,
  setStitchBound,
  setStitchPinned,
  stepStitchTension,
  stitchArg,
  stitchBinders,
  stitchClashIds,
  stitchCopy,
  stitchCounts,
  stitchGap,
  stitchShare,
  stitchTensions,
  stitchThreads,
  stitchTickets,
  stitchTimeline,
  stitchesCsv,
  tensionArg,
  tensionOf,
  threadArg,
  threadOf,
  ticketArg,
  toggleCloth,
  visibleClothCustomers,
  visibleCloths,
  visibleStitches,
  type ClothFold,
  type ClothGlyph,
  type ClothLength,
  type ClothRow,
  type StitchCard,
  type StitchTension,
  type StitchThread,
  type StitchTray,
  type StitchView,
} from "@/lib/crmv4/round160";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  campaign?: string | null;
};

type GlanceRow = ClothRow & { id: string };

const BANDS = ["hem", "seam", "panel", "cuff"] as const;

function threadName(v4: V4, thread: StitchThread): string {
  if (thread === "silk") return v4("bstThreadSilk");
  if (thread === "linen") return v4("bstThreadLinen");
  if (thread === "cotton") return v4("bstThreadCotton");
  if (thread === "wool") return v4("bstThreadWool");
  return v4("bstBlankThread");
}

function tensionName(v4: V4, tension: StitchTension): string {
  if (tension === "slack") return v4("bstSlack");
  if (tension === "even") return v4("bstEven");
  if (tension === "taut") return v4("bstTaut");
  return v4("bstBlankTension");
}

function bandName(v4: V4, name: string): string {
  if (name === "hem") return v4("bstHem");
  if (name === "seam") return v4("bstSeam");
  if (name === "panel") return v4("bstPanel");
  if (name === "cuff") return v4("bstCuff");
  if (name === "near") return v4("bstNear");
  if (name === "far") return v4("bstFar");
  if (/^(?:0?[1-9]|1[0-2])$/.test(name)) return String(Number(name));
  return v4("bstBlankStitch");
}

function lengthName(v4: V4, name: string): string {
  if (name === "brief") return v4("cclBrief");
  if (name === "name") return v4("cclName");
  if (name === "long") return v4("cclLong");
  return v4("cclUnmarked");
}

function glyphName(v4: V4, name: string): string {
  if (name === "letter") return v4("cclLetter");
  if (name === "digit") return v4("cclDigit");
  if (name === "mark") return v4("cclMark");
  return v4("cclUnmarked");
}

function foldName(v4: V4, name: string): string {
  if (name === "plain") return v4("cclPlain");
  if (name === "split") return v4("cclSplit");
  if (name === "coded") return v4("cclCoded");
  return v4("cclUnmarked");
}

function auditName(v4: V4, audit: string): string {
  if (audit === "save") return v4("bstAuditSave");
  if (audit === "edit") return v4("bstAuditEdit");
  if (audit === "raise") return v4("bstAuditRaise");
  if (audit === "lower") return v4("bstAuditLower");
  if (audit === "pin") return v4("bstAuditPin");
  if (audit === "unpin") return v4("bstAuditUnpin");
  if (audit === "baste") return v4("bstAuditBaste");
  if (audit === "free") return v4("bstAuditFree");
  if (audit === "bind") return v4("bstAuditBind");
  if (audit === "unbind") return v4("bstAuditUnbind");
  return "";
}

function stitchLabel(stitch: number | null): string {
  return stitch === null ? "—" : String(stitch);
}

function gapLabel(v4: V4, stitch: number | null, desk: string): string {
  const gap = stitchGap(stitch, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("bstPast")} ${gap}`;
  if (gap < 0) return `${v4("bstAhead")} ${Math.abs(gap)}`;
  return v4("bstDue");
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

function marks(tension: string): number {
  if (tension === "taut") return 3;
  if (tension === "even") return 2;
  if (tension === "slack") return 1;
  return 0;
}

export function BinderyStitches({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<StitchCard[]>([]);
  const [views, setViews] = useState<StitchView[]>([]);
  const [text, setText] = useState("");
  const [binder, setBinder] = useState("");
  const [stitch, setStitch] = useState("");
  const [thread, setThread] = useState("");
  const [ticket, setTicket] = useState("");
  const [tension, setTension] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<StitchTray>("open");
  const [binderFilter, setBinderFilter] = useState("all");
  const [threadFilter, setThreadFilter] = useState("all");
  const [ticketFilter, setTicketFilter] = useState("all");
  const [tensionFilter, setTensionFilter] = useState("all");
  const [stitchFilter, setStitchFilter] = useState("all");
  const [tautOnly, setTautOnly] = useState(false);
  const [lateOnly, setLateOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [desk, setDesk] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readStitches(readJson(STITCH_KEY, []));
    const saved = readStitchViews(readJson(STITCH_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(STITCH_KEY, next);
    writeJson(STITCH_VIEW_KEY, saved);
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
      if (event.key === "b" || event.key === "B") {
        event.preventDefault();
        textRef.current?.focus();
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const binders = stitchBinders(cards);
  const threads = stitchThreads(cards);
  const ticketsOn = stitchTickets(cards);
  const tensions = stitchTensions(cards);
  const bars = bandCounts(cards);
  const binderOn = activeBinder(binderFilter, binders);
  const threadOn = activeThread(threadFilter, threads);
  const ticketOn = activeTicket(ticketFilter, ticketsOn);
  const tensionOn = activeTension(tensionFilter, tensions);
  const stitchOn = activeStitch(stitchFilter);
  const picked = stitchArg(stitchOn);
  const shown = visibleStitches(
    cards,
    tray,
    query,
    binderArg(binderOn),
    threadArg(threadOn),
    ticketArg(ticketOn),
    tensionArg(tensionOn),
    picked.exact,
    picked.band,
    tautOnly,
    lateOnly,
    desk,
  );
  const timeline = stitchTimeline(cards, query);
  const counts = stitchCounts(cards, desk);
  const clashes = clashStitchCount(cards);
  const total = cards.length;
  const nextId = nextStitch(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const widest = Math.max(1, ...bars);
  const pinned = cards.filter((card) => card.pinned);

  function store(next: StitchCard[]) {
    setCards(next);
    writeJson(STITCH_KEY, next);
  }

  function storeViews(next: StitchView[]) {
    setViews(next);
    writeJson(STITCH_VIEW_KEY, next);
  }

  function clearDraft() {
    setText("");
    setBinder("");
    setStitch("");
    setThread("");
    setTicket("");
    setTension("");
  }

  function copyCard(card: StitchCard) {
    const body = stitchCopy(card.text);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(card.id);
  }

  function applyView(view: StitchView) {
    setTray(view.tray);
    setQuery(view.query);
    setBinderFilter(activeBinder(view.binder, stitchBinders(cards)));
    setThreadFilter(activeThread(view.thread, stitchThreads(cards)));
    setTicketFilter(activeTicket(view.ticket, stitchTickets(cards)));
    setTensionFilter(activeTension(view.tension, stitchTensions(cards)));
    setStitchFilter(activeStitch(view.stitch));
    setBoard("cards");
    setTautOnly(false);
    setLateOnly(false);
  }

  return (
    <section className="c4-bst" aria-label={v4("bstTitle")} data-stitches="1" data-role={role}>
      <header className="c4-bst-head">
        <p className="c4-bst-plate" data-logo="mono">{v4("bstLogo")}</p>
        <div>
          <p className="c4-bst-kicker">{v4("bstSub")}</p>
          <h2 className="c4-title">{v4("bstTitle")}</h2>
        </div>
        <p className="c4-bst-count">{shown.length}</p>
      </header>
      <details className="c4-bst-rules">
        <summary>{v4("bstRules")}</summary>
        <p className="c4-meta">{v4("bstHint")}</p>
        <p className="c4-meta">{v4("bstLocal")}</p>
        <p className="c4-meta">{v4("bstBlank")}</p>
        <p className="c4-meta">{v4("bstBinderBlank")}</p>
        <p className="c4-meta">{v4("bstStitchBlank")}</p>
        <p className="c4-meta">{v4("bstThreadBlank")}</p>
        <p className="c4-meta">{v4("bstTicketBlank")}</p>
        <p className="c4-meta">{v4("bstTensionBlank")}</p>
        <p className="c4-meta">{v4("bstEscape")}</p>
        <p className="c4-meta">{v4("bstSlash")}</p>
        <p className="c4-meta">{v4("bstNew")}</p>
      </details>
      {viewer ? <p className="c4-bst-notice" role="status">{v4("bstViewer")}</p> : null}
      <p className="c4-bst-notice" role="status">
        <span>{v4("bstNotice")}</span>
        <span className="c4-bst-count">{counts.late}</span>
        <button type="button" className="c4-btn" aria-pressed={lateOnly} onClick={() => { setLateOnly((value) => !value); setTray("open"); setBoard("cards"); }}>
          {lateOnly ? v4("bstNoticeAll") : v4("bstNoticeOpen")}
        </button>
      </p>
      <p className="c4-bst-notice" role="status">
        <span>{v4("bstClashNotice")}</span>
        <span className="c4-bst-count">{clashes}</span>
      </p>
      {pinned.length > 0 && (
        <ul className="c4-bst-pins" aria-label={v4("bstPinned")}>
          {pinned.map((card) => (
            <li key={card.id}>
              <button type="button" className="c4-chip" onClick={() => { setQuery(card.text); setBoard("cards"); }}>{card.text}</button>
            </li>
          ))}
        </ul>
      )}
      <section className="c4-bst-kpi" aria-label={v4("bstKpi")}>
        {(["open", "basted", "bound", "pinned"] as const).map((key) => {
          const count = counts[key];
          const share = stitchShare(count, total);
          const label = key === "open" ? v4("bstOpen") : key === "basted" ? v4("bstBasted") : key === "bound" ? v4("bstBound") : v4("bstPinned");
          return (
            <p key={key} className="c4-bst-meter" data-tray={key}>
              <span>{label}</span>
              <strong>{count}</strong>
              <span>{v4("bstShare")} {share}%</span>
              <span className="c4-bst-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <section className="c4-bst-chart" aria-label={v4("bstChart")}>
        <p className="c4-bst-kicker">{v4("bstChart")}</p>
        {BANDS.map((name, index) => {
          const count = bars[index] || 0;
          const width = Math.max(8, Math.round((count / widest) * 100));
          return (
            <button key={name} type="button" className="c4-bst-col" data-on={stitchOn === name ? "1" : "0"} aria-pressed={stitchOn === name} onClick={() => setStitchFilter(stitchOn === name ? "all" : name)}>
              <span>{bandName(v4, name)}</span>
              <span className="c4-bst-bar" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
              <span>{count}</span>
            </button>
          );
        })}
      </section>
      <form className="c4-bst-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addStitch(cards, { id: `bst-${Date.now()}`, text, binder, stitch, thread, ticket, tension });
        if (next === cards || next.length === cards.length) return;
        store(next);
        clearDraft();
      }}>
        <label className="c4-lab">
          <span>{v4("bstText")}</span>
          <input ref={textRef} className="c4-field" aria-label={v4("bstText")} value={text} disabled={viewer} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab">
          <span>{v4("bstBinder")}</span>
          <input className="c4-field" aria-label={v4("bstBinder")} value={binder} disabled={viewer} onChange={(event) => setBinder(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("bstStitch")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("bstStitch")} value={stitch} disabled={viewer} onChange={(event) => setStitch(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("bstThread")}</span>
          <select className="c4-select" aria-label={v4("bstThread")} value={thread} disabled={viewer} onChange={(event) => setThread(event.target.value)}>
            <option value="">{v4("bstBlankThread")}</option>
            <option value="silk">{v4("bstThreadSilk")}</option>
            <option value="linen">{v4("bstThreadLinen")}</option>
            <option value="cotton">{v4("bstThreadCotton")}</option>
            <option value="wool">{v4("bstThreadWool")}</option>
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("bstTicket")}</span>
          <input className="c4-field" aria-label={v4("bstTicket")} value={ticket} disabled={viewer} onChange={(event) => setTicket(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("bstTension")}</span>
          <select className="c4-select" aria-label={v4("bstTension")} value={tension} disabled={viewer} onChange={(event) => setTension(event.target.value)}>
            <option value="">{v4("bstBlankTension")}</option>
            <option value="slack">{v4("bstSlack")}</option>
            <option value="even">{v4("bstEven")}</option>
            <option value="taut">{v4("bstTaut")}</option>
          </select>
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("bstAdd")}</button>
      </form>
      <div className="c4-row" role="group" aria-label={v4("bstTitle")}>
        <button type="button" className="c4-chip" data-on={tray === "open" ? "1" : "0"} aria-pressed={tray === "open"} onClick={() => setTray("open")}>{v4("bstOpen")}</button>
        <button type="button" className="c4-chip" data-on={tray === "basted" ? "1" : "0"} aria-pressed={tray === "basted"} onClick={() => setTray("basted")}>{v4("bstBasted")}</button>
        <button type="button" className="c4-chip" data-on={tray === "bound" ? "1" : "0"} aria-pressed={tray === "bound"} onClick={() => setTray("bound")}>{v4("bstBound")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("bstTimeline")}</button>
        <button type="button" className="c4-chip" data-on={tautOnly ? "1" : "0"} aria-pressed={tautOnly} onClick={() => setTautOnly((value) => !value)}>{v4("bstTautOnly")}</button>
        <button type="button" className="c4-btn" onClick={() => download("bindery-stitches.csv", stitchesCsv(cards, desk))}>{v4("bstCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkStitchPinned(cards, shown.map((card) => card.id), true))}>{v4("bstBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkStitchBound(cards, shown.map((card) => card.id), true))}>{v4("bstBulkBind")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(resetStitches()); setEditing(""); }}>{v4("bstReset")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("bstStitches")}>
        <button type="button" className="c4-chip" data-on={stitchOn === "all" ? "1" : "0"} aria-pressed={stitchOn === "all"} onClick={() => setStitchFilter("all")}>{v4("bstAllStitches")}</button>
        <button type="button" className="c4-chip" data-on={stitchOn === "blank" ? "1" : "0"} aria-pressed={stitchOn === "blank"} onClick={() => setStitchFilter("blank")}>{v4("bstBlankStitch")}</button>
        <button type="button" className="c4-chip" data-on={stitchOn === "near" ? "1" : "0"} aria-pressed={stitchOn === "near"} onClick={() => setStitchFilter("near")}>{v4("bstNear")}</button>
        <button type="button" className="c4-chip" data-on={stitchOn === "far" ? "1" : "0"} aria-pressed={stitchOn === "far"} onClick={() => setStitchFilter("far")}>{v4("bstFar")}</button>
        {["1", "4", "7", "10"].map((slot) => (
          <button key={slot} type="button" className="c4-chip" data-on={stitchOn === slot ? "1" : "0"} aria-pressed={stitchOn === slot} onClick={() => setStitchFilter(stitchOn === slot ? "all" : slot)}>{slot}</button>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("bstSearch")}</span>
        <input ref={searchRef} className="c4-field" aria-label={v4("bstSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      <div className="c4-bst-next">
        <label className="c4-lab">
          <span>{v4("bstDesk")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("bstDesk")} value={desk} onChange={(event) => setDesk(event.target.value)} />
        </label>
        <p className="c4-meta">
          <span>{v4("bstNext")}</span>
          {" "}
          {nextCard ? nextCard.text : v4("bstNextEmpty")}
        </p>
      </div>
      <div className="c4-row">
        <label className="c4-lab">
          <span>{v4("bstBinders")}</span>
          <select className="c4-select" aria-label={v4("bstBinders")} value={binderOn} onChange={(event) => setBinderFilter(event.target.value)}>
            <option value="all">{v4("bstAllBinders")}</option>
            <option value="blank">{v4("bstBlankBinder")}</option>
            {binders.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("bstThreads")}</span>
          <select className="c4-select" aria-label={v4("bstThreads")} value={threadOn} onChange={(event) => setThreadFilter(event.target.value)}>
            <option value="all">{v4("bstAllThreads")}</option>
            <option value="blank">{v4("bstBlankThread")}</option>
            {threads.map((item) => <option key={item} value={item}>{threadName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("bstTickets")}</span>
          <select className="c4-select" aria-label={v4("bstTickets")} value={ticketOn} onChange={(event) => setTicketFilter(event.target.value)}>
            <option value="all">{v4("bstAllTickets")}</option>
            <option value="blank">{v4("bstBlankTicket")}</option>
            {ticketsOn.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("bstTensions")}</span>
          <select className="c4-select" aria-label={v4("bstTensions")} value={tensionOn} onChange={(event) => setTensionFilter(event.target.value)}>
            <option value="all">{v4("bstAllTensions")}</option>
            <option value="blank">{v4("bstBlankTension")}</option>
            {tensions.map((item) => <option key={item} value={item}>{tensionName(v4, item)}</option>)}
          </select>
        </label>
      </div>
      <form className="c4-bst-view" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addStitchView(views, {
          id: `view-${Date.now()}`,
          name: viewName,
          tray,
          query,
          binder: binderOn,
          thread: threadOn,
          ticket: ticketOn,
          tension: tensionOn,
          stitch: stitchOn,
        });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab">
          <span>{v4("bstViewName")}</span>
          <input className="c4-field" aria-label={v4("bstViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("bstSaveView")}</button>
      </form>
      <section aria-label={v4("bstViews")}>
        <p className="c4-bst-kicker">{v4("bstViews")}</p>
        {!views.length && <p className="c4-bst-empty">{v4("bstViewEmpty")}</p>}
        <ul className="c4-bst-views">
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropStitchView(views, view.id))}>{v4("bstDropView")}</button>
            </li>
          ))}
        </ul>
      </section>
      {board === "cards" && !shown.length && <p className="c4-bst-empty">{v4("bstEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-bst-rows">
          {shown.map((card) => {
            const clashesOn = stitchClashIds(cards, card.id);
            const gap = gapLabel(v4, card.stitch, desk);
            const reach = reachOf(card.stitch);
            const editingCard = editing === card.id;
            return (
              <li key={card.id} data-tension={card.tension || "blank"} data-thread={card.thread || "blank"} data-band={bandOf(card.stitch)}>
                <span className="c4-bst-folio" aria-hidden="true">{stitchLabel(card.stitch)}</span>
                <span className="c4-bst-marks" aria-hidden="true">
                  {[0, 1, 2].map((index) => <i key={index} data-on={index < marks(card.tension) ? "1" : "0"} />)}
                </span>
                <div>
                  {editingCard ? (
                    <form className="c4-row" onSubmit={(event) => {
                      event.preventDefault();
                      if (viewer) return;
                      store(editStitch(cards, card.id, draft));
                      setEditing("");
                    }}>
                      <input className="c4-field" aria-label={v4("bstEdit")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("bstSaveEdit")}</button>
                    </form>
                  ) : <p>{card.text}</p>}
                  <p className="c4-meta">
                    {card.binder || v4("bstBlankBinder")}
                    {" · "}
                    {stitchLabel(card.stitch)}
                    {" · "}
                    {threadName(v4, threadOf(card.thread))}
                    {" · "}
                    {card.ticket || v4("bstBlankTicket")}
                    {" · "}
                    {tensionName(v4, tensionOf(card.tension))}
                    {reach === "blank" ? "" : ` · ${reach === "near" ? v4("bstNear") : v4("bstFar")}`}
                    {gap ? ` · ${gap}` : ""}
                    {auditName(v4, card.audit) ? ` · ${v4("bstAudit")} ${auditName(v4, card.audit)}` : ""}
                    {" · "}
                    {clashesOn.length ? `${v4("bstClash")} ${clashesOn.length}` : v4("bstClashNone")}
                  </p>
                </div>
                <div className="c4-row">
                  <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("bstCopied") : v4("bstCopy")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.text); }}>{v4("bstEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepStitchTension(cards, card.id, 1))}>{v4("bstRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepStitchTension(cards, card.id, -1))}>{v4("bstLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.pinned} onClick={() => store(setStitchPinned(cards, card.id, !card.pinned))}>{card.pinned ? v4("bstUnpin") : v4("bstPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.basted} onClick={() => store(setStitchBasted(cards, card.id, !card.basted))}>{card.basted ? v4("bstFree") : v4("bstBaste")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.bound} onClick={() => store(setStitchBound(cards, card.id, !card.bound))}>{card.bound ? v4("bstUnbind") : v4("bstBind")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {board === "timeline" && (
        <ol className="c4-bst-time">
          {timeline.map((card) => (
            <li key={card.id} data-band={bandOf(card.stitch)}>
              <span className="c4-bst-clock">{stitchLabel(card.stitch)}</span>
              <p>{card.text}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function CampaignCloths({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenCloths, setHiddenCloths] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [length, setLength] = useState("all");
  const [glyph, setGlyph] = useState("all");
  const [fold, setFold] = useState("all");
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = useMemo(() => (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || "").trim(),
      campaign: row.campaign,
    };
  }).filter((row): row is GlanceRow => Boolean(row)), [data.data?.users]);
  const lengths = lengthLines(rows);
  const glyphs = glyphLines(rows);
  const folds = foldLines(rows);
  const present = namedCloths(rows);
  const presentKey = present.join("\n");
  const lengthNames = namedLengths(rows);
  const glyphNames = namedGlyphs(rows);
  const foldNames = namedFolds(rows);
  const blankLength = lengths.find((line) => !line.length)?.count || 0;
  const leadCloth = leadingCloth(rows);
  const leadLength = leadingLength(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenCloths(readJson(CLOTH_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenCloths(next);
    writeJson(CLOTH_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleCloths(present, hiddenCloths, showHidden);
  const lengthOn = activeLength(length, lengthNames);
  const glyphOn = activeGlyph(glyph, glyphNames);
  const foldOn = activeFold(fold, foldNames);
  const shown = visibleClothCustomers(
    rows,
    lengthArg(lengthOn),
    glyphArg(glyphOn),
    foldArg(foldOn),
    selected ? clothArg(activeCloth(selected, chips)) : null,
    query,
  );
  const widest = Math.max(1, ...lengths.map((line) => line.count));

  function store(next: string[], clear: string) {
    setHiddenCloths(next);
    writeJson(CLOTH_KEY, next);
    if (clear && activeCloth(selected, [clear]) === clear) setSelected("");
  }

  return (
    <section className="c4-ccl" aria-label={v4("cclTitle")} data-cloths="1">
      <header className="c4-ccl-head">
        <div>
          <p className="c4-bst-kicker">{v4("cclSub")}</p>
          <h2 className="c4-title">{v4("cclTitle")}</h2>
        </div>
        <p className="c4-bst-count">{v4("cclRows")} {rows.length}</p>
      </header>
      <details className="c4-bst-rules">
        <summary>{v4("cclRules")}</summary>
        <p className="c4-meta">{v4("cclHint")}</p>
        <p className="c4-meta">{v4("cclLocal")}</p>
        <p className="c4-meta">{v4("cclEscape")}</p>
      </details>
      {leadCloth ? <p className="c4-ccl-lead"><span>{v4("cclLeadCloth")}</span> {leadCloth}</p> : null}
      {leadLength ? <p className="c4-ccl-lead"><span>{v4("cclLeadLength")}</span> {lengthName(v4, leadLength)}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("cclBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("campaign-cloths.csv", clothsCsv(rows))}>{v4("cclCsv")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("cclLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("cclFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-bst-empty">{v4("cclNone")}</p>}
      {lengths.length > 0 && (
        <section className="c4-ccl-chart" aria-label={v4("cclAllLength")}>
          {lengths.map((line) => {
            const share = clothShare(line.count, rows.length);
            const width = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.length || "blank";
            return (
              <p key={name} className="c4-ccl-col" data-length={line.length || "blank"}>
                <span>{lengthName(v4, line.length)}</span>
                <span className="c4-bst-track" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("cclShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      <div className="c4-ccl-lengths" role="group" aria-label={v4("cclAllLength")}>
        <button type="button" className="c4-ccl-length" data-on={lengthOn === "all" ? "1" : "0"} aria-pressed={lengthOn === "all"} onClick={() => { setSelected(""); setLength("all"); }}>
          <span>{v4("cclAllLength")}</span>
          <span className="c4-bst-count">{rows.length}</span>
        </button>
        {blankLength > 0 && (
          <button type="button" className="c4-ccl-length" data-on={length === "blank" ? "1" : "0"} aria-pressed={length === "blank"} onClick={() => { setSelected(""); setLength(length === "blank" ? "all" : "blank"); }}>
            <span>{v4("cclUnmarked")}</span>
            <span className="c4-bst-count">{blankLength}</span>
          </button>
        )}
        {lengthNames.map((item) => {
          const count = lengths.find((line) => line.length === item)?.count || 0;
          return (
            <button key={item} type="button" className="c4-ccl-length" data-on={length === item ? "1" : "0"} aria-pressed={length === item} onClick={() => { setSelected(""); setLength(length === item ? "all" : item); }}>
              <span>{lengthName(v4, item)}</span>
              <span className="c4-bst-count">{count}</span>
              <span>{v4("cclShare")} {clothShare(count, rows.length)}%</span>
            </button>
          );
        })}
      </div>
      <div className="c4-row" role="group" aria-label={v4("cclGlyphs")}>
        <button type="button" className="c4-chip" data-on={glyphOn === "all" ? "1" : "0"} aria-pressed={glyphOn === "all"} onClick={() => setGlyph("all")}>{v4("cclAllGlyphs")}</button>
        {glyphs.filter((line) => line.glyph).map((line) => (
          <button key={line.glyph} type="button" className="c4-chip" data-on={glyphOn === line.glyph ? "1" : "0"} aria-pressed={glyphOn === line.glyph} onClick={() => setGlyph(glyphOn === line.glyph ? "all" : line.glyph)}>
            {glyphName(v4, line.glyph)} {line.count}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("cclFolds")}>
        <button type="button" className="c4-chip" data-on={foldOn === "all" ? "1" : "0"} aria-pressed={foldOn === "all"} onClick={() => setFold("all")}>{v4("cclFolds")}</button>
        {folds.filter((line) => line.fold).map((line) => (
          <button key={line.fold} type="button" className="c4-chip" data-on={foldOn === line.fold ? "1" : "0"} aria-pressed={foldOn === line.fold} onClick={() => setFold(foldOn === line.fold ? "all" : line.fold)}>
            {foldName(v4, line.fold)} {line.count}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("cclShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("cclShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("cclHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("cclCloths")}>
        <button type="button" className="c4-chip" data-on={!selected ? "1" : "0"} aria-pressed={!selected} onClick={() => setSelected("")}>{v4("cclAll")}</button>
        {chips.map((item) => {
          const line = clothsOf(rows, item);
          const count = line;
          const share = clothShare(count, rows.length);
          return (
            <span key={item} className="c4-ccl-pair">
              <button type="button" className="c4-chip" data-on={selected === item ? "1" : "0"} aria-pressed={selected === item} onClick={() => { setLength("all"); setSelected(selected === item ? "" : item); }}>{item}</button>
              <span className="c4-bst-count">{count}</span>
              <span className="c4-ccl-share">{v4("cclShare")} {share}%</span>
              <span className="c4-bst-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
              <button type="button" className="c4-btn" onClick={() => store(toggleCloth(hiddenCloths, item, present), showHidden ? "" : item)}>{showHidden ? v4("cclShow") : v4("cclHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("cclSearch")}</span>
        <input className="c4-field" aria-label={v4("cclSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-bst-empty">{v4("cclEmpty")}</p>}
      <ul className="c4-ccl-rows">
        {shown.map((row) => {
          const lengthMark = lengthOf(row.campaign) as ClothLength;
          const glyphMark = glyphOf(row.campaign) as ClothGlyph;
          const foldMark = foldOf(row.campaign) as ClothFold;
          const cloth = clothName(row.campaign);
          return (
            <li key={row.id} data-length={lengthMark || "blank"} data-glyph={glyphMark || "blank"} data-fold={foldMark || "blank"}>
              <span className="c4-ccl-face" aria-hidden="true">{cloth ? cloth.slice(0, 1).toUpperCase() : "—"}</span>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">
                {cloth || v4("cclUnmarked")}
                {" · "}
                {lengthName(v4, lengthMark)}
                {" · "}
                {glyphName(v4, glyphMark)}
                {" · "}
                {foldName(v4, foldMark)}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function clothsOf(rows: readonly ClothRow[], cloth: string): number {
  return rows.filter((row) => clothName(row.campaign) === cloth).length;
}
