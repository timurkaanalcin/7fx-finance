"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  GIVEN_KEY,
  PROOF_KEY,
  PROOF_VIEW_KEY,
  activeEnding,
  activeInitial,
  activeInk,
  activeLength,
  activeMark,
  activeReader,
  activeSheet,
  activeStock,
  addProof,
  addProofView,
  assignedGiven,
  bulkProofBound,
  bulkProofPinned,
  dropProofView,
  editProof,
  endingArg,
  endingLines,
  endingOf,
  gatheringCounts,
  gatheringOf,
  givenShare,
  givensCsv,
  inkArg,
  initialArg,
  initialLines,
  initialOf,
  leadingInitial,
  leadingLength,
  lengthArg,
  lengthLines,
  lengthOf,
  markArg,
  namedEndings,
  namedInitials,
  namedLengths,
  nextProof,
  proofClashIds,
  proofCopy,
  proofCounts,
  proofInks,
  proofMarks,
  proofReaders,
  proofShare,
  proofStocks,
  proofTimeline,
  proofsCsv,
  readHiddenInitials,
  readProofViews,
  readProofs,
  readerArg,
  resetProofs,
  setProofBound,
  setProofHeld,
  setProofPinned,
  sheetArg,
  sheetGap,
  sheetPair,
  stepProofInk,
  stockArg,
  toggleInitial,
  visibleGivenCustomers,
  visibleInitials,
  visibleProofs,
  type GivenRow,
  type ProofCard,
  type ProofInk,
  type ProofStock,
  type ProofTray,
  type ProofView,
} from "@/lib/crmv4/round154";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  firstName?: string | null;
};

type GlanceRow = GivenRow & { id: string };

const GATHERINGS = ["quire", "section", "signature", "volume"] as const;

function stockName(v4: V4, stock: ProofStock): string {
  if (stock === "rag") return v4("prfStockRag");
  if (stock === "laid") return v4("prfStockLaid");
  if (stock === "wove") return v4("prfStockWove");
  if (stock === "bond") return v4("prfStockBond");
  return v4("prfBlankStock");
}

function inkName(v4: V4, ink: ProofInk): string {
  if (ink === "pale") return v4("prfInkPale");
  if (ink === "set") return v4("prfInkSet");
  if (ink === "dry") return v4("prfInkDry");
  return v4("prfBlankInk");
}

function gatheringName(v4: V4, name: string): string {
  if (name === "quire") return v4("prfQuire");
  if (name === "section") return v4("prfSection");
  if (name === "signature") return v4("prfSignature");
  if (name === "volume") return v4("prfVolume");
  if (name === "odd") return v4("prfOdd");
  if (name === "even") return v4("prfEven");
  if (/^(?:0?[1-9]|[12]\d|3[0-6])$/.test(name)) return String(Number(name));
  return v4("prfBlankSheet");
}

function lengthName(v4: V4, name: string): string {
  if (name === "brief") return v4("gvnBrief");
  if (name === "settled") return v4("gvnSettled");
  if (name === "ample") return v4("gvnAmple");
  return v4("gvnUnmarked");
}

function endingName(v4: V4, name: string): string {
  if (name === "vowel") return v4("gvnVowel");
  if (name === "consonant") return v4("gvnConsonant");
  return v4("gvnUnmarked");
}

function auditName(v4: V4, audit: string): string {
  if (audit === "save") return v4("prfAuditSave");
  if (audit === "edit") return v4("prfAuditEdit");
  if (audit === "raise") return v4("prfAuditRaise");
  if (audit === "lower") return v4("prfAuditLower");
  if (audit === "pin") return v4("prfAuditPin");
  if (audit === "unpin") return v4("prfAuditUnpin");
  if (audit === "hold") return v4("prfAuditHold");
  if (audit === "release") return v4("prfAuditRelease");
  if (audit === "bind") return v4("prfAuditBind");
  if (audit === "unbind") return v4("prfAuditUnbind");
  return "";
}

function sheetLabel(sheet: number | null): string {
  return sheet === null ? "—" : String(sheet);
}

function gapLabel(v4: V4, sheet: number | null, desk: string): string {
  const gap = sheetGap(sheet, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("prfPast")} ${gap}`;
  if (gap < 0) return `${v4("prfAhead")} ${Math.abs(gap)}`;
  return v4("prfDue");
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

function drops(ink: string): number {
  if (ink === "dry") return 3;
  if (ink === "set") return 2;
  if (ink === "pale") return 1;
  return 0;
}

export function PressProofs({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<ProofCard[]>([]);
  const [views, setViews] = useState<ProofView[]>([]);
  const [text, setText] = useState("");
  const [reader, setReader] = useState("");
  const [sheet, setSheet] = useState("");
  const [stock, setStock] = useState("");
  const [mark, setMark] = useState("");
  const [ink, setInk] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<ProofTray>("open");
  const [readerFilter, setReaderFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [markFilter, setMarkFilter] = useState("all");
  const [inkFilter, setInkFilter] = useState("all");
  const [sheetFilter, setSheetFilter] = useState("all");
  const [dryOnly, setDryOnly] = useState(false);
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
    const next = readProofs(readJson(PROOF_KEY, []));
    const saved = readProofViews(readJson(PROOF_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(PROOF_KEY, next);
    writeJson(PROOF_VIEW_KEY, saved);
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
      if (event.key === "p" || event.key === "P") {
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
  const readers = proofReaders(cards);
  const stocks = proofStocks(cards);
  const marks = proofMarks(cards);
  const inks = proofInks(cards);
  const bars = gatheringCounts(cards);
  const readerOn = activeReader(readerFilter, readers);
  const stockOn = activeStock(stockFilter, stocks);
  const markOn = activeMark(markFilter, marks);
  const inkOn = activeInk(inkFilter, inks);
  const sheetOn = activeSheet(sheetFilter);
  const picked = sheetArg(sheetOn);
  const shown = visibleProofs(
    cards,
    tray,
    query,
    readerArg(readerOn),
    stockArg(stockOn),
    markArg(markOn),
    inkArg(inkOn),
    picked.exact,
    picked.band,
    dryOnly,
    lateOnly,
    desk,
  );
  const timeline = proofTimeline(cards, query);
  const counts = proofCounts(cards, desk);
  const total = cards.length;
  const nextId = nextProof(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const widest = Math.max(1, ...bars);

  function store(next: ProofCard[]) {
    setCards(next);
    writeJson(PROOF_KEY, next);
  }

  function storeViews(next: ProofView[]) {
    setViews(next);
    writeJson(PROOF_VIEW_KEY, next);
  }

  function clearDraft() {
    setText("");
    setReader("");
    setSheet("");
    setStock("");
    setMark("");
    setInk("");
  }

  function copyCard(card: ProofCard) {
    const body = proofCopy(card.text);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(card.id);
  }

  function applyView(view: ProofView) {
    setTray(view.tray);
    setQuery(view.query);
    setReaderFilter(activeReader(view.reader, proofReaders(cards)));
    setStockFilter(activeStock(view.stock, proofStocks(cards)));
    setMarkFilter(activeMark(view.mark, proofMarks(cards)));
    setInkFilter(activeInk(view.ink, proofInks(cards)));
    setSheetFilter(activeSheet(view.sheet));
    setBoard("cards");
    setDryOnly(false);
    setLateOnly(false);
  }

  return (
    <section className="c4-prf" aria-label={v4("prfTitle")} data-proofs="1" data-role={role}>
      <header className="c4-prf-head">
        <p className="c4-prf-plate" data-logo="mono">{v4("prfLogo")}</p>
        <div>
          <p className="c4-prf-kicker">{v4("prfSub")}</p>
          <h2 className="c4-title">{v4("prfTitle")}</h2>
        </div>
        <p className="c4-prf-count">{shown.length}</p>
      </header>
      <details className="c4-prf-rules">
        <summary>{v4("prfRules")}</summary>
        <p className="c4-meta">{v4("prfHint")}</p>
        <p className="c4-meta">{v4("prfLocal")}</p>
        <p className="c4-meta">{v4("prfBlank")}</p>
        <p className="c4-meta">{v4("prfReaderBlank")}</p>
        <p className="c4-meta">{v4("prfSheetBlank")}</p>
        <p className="c4-meta">{v4("prfStockBlank")}</p>
        <p className="c4-meta">{v4("prfMarkBlank")}</p>
        <p className="c4-meta">{v4("prfInkBlank")}</p>
        <p className="c4-meta">{v4("prfEscape")}</p>
        <p className="c4-meta">{v4("prfSlash")}</p>
        <p className="c4-meta">{v4("prfNew")}</p>
      </details>
      {viewer ? <p className="c4-prf-notice" role="status">{v4("prfViewer")}</p> : null}
      <p className="c4-prf-notice" role="status">
        <span>{v4("prfNotice")}</span>
        <span className="c4-prf-count">{counts.late}</span>
        <button type="button" className="c4-btn" aria-pressed={lateOnly} onClick={() => { setLateOnly((value) => !value); setTray("open"); setBoard("cards"); }}>
          {lateOnly ? v4("prfNoticeAll") : v4("prfNoticeOpen")}
        </button>
      </p>
      <section className="c4-prf-kpi" aria-label={v4("prfKpi")}>
        {(["open", "held", "bound", "pinned"] as const).map((key) => {
          const count = counts[key];
          const share = proofShare(count, total);
          const label = key === "open" ? v4("prfOpen") : key === "held" ? v4("prfHeld") : key === "bound" ? v4("prfBound") : v4("prfPinned");
          return (
            <p key={key} className="c4-prf-meter" data-tray={key}>
              <span>{label}</span>
              <strong>{count}</strong>
              <span>{v4("prfShare")} {share}%</span>
              <span className="c4-prf-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <section className="c4-prf-chart" aria-label={v4("prfChart")}>
        <p className="c4-prf-kicker">{v4("prfChart")}</p>
        {GATHERINGS.map((name, index) => {
          const count = bars[index] || 0;
          const height = Math.max(8, Math.round((count / widest) * 100));
          return (
            <button key={name} type="button" className="c4-prf-col" data-on={sheetOn === name ? "1" : "0"} aria-pressed={sheetOn === name} onClick={() => setSheetFilter(sheetOn === name ? "all" : name)}>
              <span className="c4-prf-bar" aria-hidden="true"><i style={{ height: `${height}%` }} /></span>
              <span>{gatheringName(v4, name)}</span>
              <span>{count}</span>
            </button>
          );
        })}
      </section>
      <form className="c4-prf-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addProof(cards, { id: `prf-${Date.now()}`, text, reader, sheet, stock, mark, ink });
        if (next === cards || next.length === cards.length) return;
        store(next);
        clearDraft();
      }}>
        <label className="c4-lab">
          <span>{v4("prfText")}</span>
          <input ref={textRef} className="c4-field" aria-label={v4("prfText")} value={text} disabled={viewer} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab">
          <span>{v4("prfReader")}</span>
          <input className="c4-field" aria-label={v4("prfReader")} value={reader} disabled={viewer} onChange={(event) => setReader(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("prfSheet")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("prfSheet")} value={sheet} disabled={viewer} onChange={(event) => setSheet(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("prfStock")}</span>
          <select className="c4-select" aria-label={v4("prfStock")} value={stock} disabled={viewer} onChange={(event) => setStock(event.target.value)}>
            <option value="">{v4("prfBlankStock")}</option>
            <option value="rag">{v4("prfStockRag")}</option>
            <option value="laid">{v4("prfStockLaid")}</option>
            <option value="wove">{v4("prfStockWove")}</option>
            <option value="bond">{v4("prfStockBond")}</option>
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("prfMark")}</span>
          <input className="c4-field" aria-label={v4("prfMark")} value={mark} disabled={viewer} onChange={(event) => setMark(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("prfInk")}</span>
          <select className="c4-select" aria-label={v4("prfInk")} value={ink} disabled={viewer} onChange={(event) => setInk(event.target.value)}>
            <option value="">{v4("prfBlankInk")}</option>
            <option value="pale">{v4("prfInkPale")}</option>
            <option value="set">{v4("prfInkSet")}</option>
            <option value="dry">{v4("prfInkDry")}</option>
          </select>
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("prfAdd")}</button>
      </form>
      <div className="c4-row" role="group" aria-label={v4("prfTitle")}>
        <button type="button" className="c4-chip" data-on={tray === "open" ? "1" : "0"} aria-pressed={tray === "open"} onClick={() => setTray("open")}>{v4("prfOpen")}</button>
        <button type="button" className="c4-chip" data-on={tray === "held" ? "1" : "0"} aria-pressed={tray === "held"} onClick={() => setTray("held")}>{v4("prfHeld")}</button>
        <button type="button" className="c4-chip" data-on={tray === "bound" ? "1" : "0"} aria-pressed={tray === "bound"} onClick={() => setTray("bound")}>{v4("prfBound")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("prfTimeline")}</button>
        <button type="button" className="c4-chip" data-on={dryOnly ? "1" : "0"} aria-pressed={dryOnly} onClick={() => setDryOnly((value) => !value)}>{v4("prfDry")}</button>
        <button type="button" className="c4-btn" onClick={() => download("press-proofs.csv", proofsCsv(cards, desk))}>{v4("prfCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkProofPinned(cards, shown.map((card) => card.id), true))}>{v4("prfBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkProofBound(cards, shown.map((card) => card.id), true))}>{v4("prfBulkBind")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(resetProofs()); setEditing(""); }}>{v4("prfReset")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("prfSheets")}>
        <button type="button" className="c4-chip" data-on={sheetOn === "all" ? "1" : "0"} aria-pressed={sheetOn === "all"} onClick={() => setSheetFilter("all")}>{v4("prfAllSheets")}</button>
        <button type="button" className="c4-chip" data-on={sheetOn === "blank" ? "1" : "0"} aria-pressed={sheetOn === "blank"} onClick={() => setSheetFilter("blank")}>{v4("prfBlankSheet")}</button>
        <button type="button" className="c4-chip" data-on={sheetOn === "odd" ? "1" : "0"} aria-pressed={sheetOn === "odd"} onClick={() => setSheetFilter("odd")}>{v4("prfOdd")}</button>
        <button type="button" className="c4-chip" data-on={sheetOn === "even" ? "1" : "0"} aria-pressed={sheetOn === "even"} onClick={() => setSheetFilter("even")}>{v4("prfEven")}</button>
        {["1", "10", "19", "28"].map((slot) => (
          <button key={slot} type="button" className="c4-chip" data-on={sheetOn === slot ? "1" : "0"} aria-pressed={sheetOn === slot} onClick={() => setSheetFilter(sheetOn === slot ? "all" : slot)}>{slot}</button>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("prfSearch")}</span>
        <input ref={searchRef} className="c4-field" aria-label={v4("prfSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      <div className="c4-prf-next">
        <label className="c4-lab">
          <span>{v4("prfDesk")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("prfDesk")} value={desk} onChange={(event) => setDesk(event.target.value)} />
        </label>
        <p className="c4-meta">
          <span>{v4("prfNext")}</span>
          {" "}
          {nextCard ? nextCard.text : v4("prfNextEmpty")}
        </p>
      </div>
      <div className="c4-row">
        <label className="c4-lab">
          <span>{v4("prfReaders")}</span>
          <select className="c4-select" aria-label={v4("prfReaders")} value={readerOn} onChange={(event) => setReaderFilter(event.target.value)}>
            <option value="all">{v4("prfAllReaders")}</option>
            <option value="blank">{v4("prfBlankReader")}</option>
            {readers.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("prfStocks")}</span>
          <select className="c4-select" aria-label={v4("prfStocks")} value={stockOn} onChange={(event) => setStockFilter(event.target.value)}>
            <option value="all">{v4("prfAllStocks")}</option>
            <option value="blank">{v4("prfBlankStock")}</option>
            {stocks.map((item) => <option key={item} value={item}>{stockName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("prfMarks")}</span>
          <select className="c4-select" aria-label={v4("prfMarks")} value={markOn} onChange={(event) => setMarkFilter(event.target.value)}>
            <option value="all">{v4("prfAllMarks")}</option>
            <option value="blank">{v4("prfBlankMark")}</option>
            {marks.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("prfInks")}</span>
          <select className="c4-select" aria-label={v4("prfInks")} value={inkOn} onChange={(event) => setInkFilter(event.target.value)}>
            <option value="all">{v4("prfAllInks")}</option>
            <option value="blank">{v4("prfBlankInk")}</option>
            {inks.map((item) => <option key={item} value={item}>{inkName(v4, item)}</option>)}
          </select>
        </label>
      </div>
      <form className="c4-prf-view" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addProofView(views, {
          id: `view-${Date.now()}`,
          name: viewName,
          tray,
          query,
          reader: readerOn,
          stock: stockOn,
          mark: markOn,
          ink: inkOn,
          sheet: sheetOn,
        });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab">
          <span>{v4("prfViewName")}</span>
          <input className="c4-field" aria-label={v4("prfViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("prfSaveView")}</button>
      </form>
      <section aria-label={v4("prfViews")}>
        <p className="c4-prf-kicker">{v4("prfViews")}</p>
        {!views.length && <p className="c4-prf-empty">{v4("prfViewEmpty")}</p>}
        <ul className="c4-prf-views">
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropProofView(views, view.id))}>{v4("prfDropView")}</button>
            </li>
          ))}
        </ul>
      </section>
      {board === "cards" && !shown.length && <p className="c4-prf-empty">{v4("prfEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-prf-rows">
          {shown.map((card) => {
            const clashes = proofClashIds(cards, card.id);
            const gap = gapLabel(v4, card.sheet, desk);
            const pair = sheetPair(card.sheet);
            const editingCard = editing === card.id;
            return (
              <li key={card.id} data-ink={card.ink || "blank"} data-stock={card.stock || "blank"} data-gathering={gatheringOf(card.sheet)}>
                <span className="c4-prf-folio" aria-hidden="true">{sheetLabel(card.sheet)}</span>
                <span className="c4-prf-drops" aria-hidden="true">
                  {[0, 1, 2].map((index) => <i key={index} data-on={index < drops(card.ink) ? "1" : "0"} />)}
                </span>
                <div>
                  {editingCard ? (
                    <form className="c4-row" onSubmit={(event) => {
                      event.preventDefault();
                      if (viewer) return;
                      store(editProof(cards, card.id, draft));
                      setEditing("");
                    }}>
                      <input className="c4-field" aria-label={v4("prfEdit")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("prfSaveEdit")}</button>
                    </form>
                  ) : <p>{card.text}</p>}
                  <p className="c4-meta">
                    {card.reader || v4("prfBlankReader")}
                    {" · "}
                    {sheetLabel(card.sheet)}
                    {" · "}
                    {stockName(v4, stockOfCard(card.stock))}
                    {" · "}
                    {card.mark || v4("prfBlankMark")}
                    {" · "}
                    {inkName(v4, inkOfCard(card.ink))}
                    {pair === "blank" ? "" : ` · ${pair === "odd" ? v4("prfOdd") : v4("prfEven")}`}
                    {gap ? ` · ${gap}` : ""}
                    {auditName(v4, card.audit) ? ` · ${v4("prfAudit")} ${auditName(v4, card.audit)}` : ""}
                    {" · "}
                    {clashes.length ? `${v4("prfClash")} ${clashes.length}` : v4("prfClashNone")}
                  </p>
                </div>
                <div className="c4-row">
                  <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("prfCopied") : v4("prfCopy")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.text); }}>{v4("prfEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepProofInk(cards, card.id, 1))}>{v4("prfRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepProofInk(cards, card.id, -1))}>{v4("prfLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.pinned} onClick={() => store(setProofPinned(cards, card.id, !card.pinned))}>{card.pinned ? v4("prfUnpin") : v4("prfPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.held} onClick={() => store(setProofHeld(cards, card.id, !card.held))}>{card.held ? v4("prfRelease") : v4("prfHold")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.bound} onClick={() => store(setProofBound(cards, card.id, !card.bound))}>{card.bound ? v4("prfUnbind") : v4("prfBind")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {board === "timeline" && (
        <ol className="c4-prf-time">
          {timeline.map((card) => (
            <li key={card.id} data-gathering={gatheringOf(card.sheet)}>
              <span className="c4-prf-clock">{sheetLabel(card.sheet)}</span>
              <p>{card.text}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function stockOfCard(stock: string): ProofStock {
  if (stock === "rag" || stock === "laid" || stock === "wove" || stock === "bond") return stock;
  return "blank";
}

function inkOfCard(ink: string): ProofInk {
  if (ink === "pale" || ink === "set" || ink === "dry") return ink;
  return "blank";
}

export function GivenNames({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenInitials, setHiddenInitials] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [initial, setInitial] = useState("all");
  const [length, setLength] = useState("all");
  const [ending, setEnding] = useState("all");
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = useMemo(() => (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || "").trim(),
      given: row.firstName,
    };
  }).filter((row): row is GlanceRow => Boolean(row)), [data.data?.users]);
  const initials = initialLines(rows);
  const lengths = lengthLines(rows);
  const endings = endingLines(rows);
  const present = namedInitials(rows);
  const presentKey = present.join("\n");
  const initialNames = namedInitials(rows);
  const lengthNames = namedLengths(rows);
  const endingNames = namedEndings(rows);
  const blankInitial = initials.find((line) => !line.initial)?.count || 0;
  const leadInitial = leadingInitial(rows);
  const leadLength = leadingLength(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenInitials(readJson(GIVEN_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenInitials(next);
    writeJson(GIVEN_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleInitials(present, hiddenInitials, showHidden);
  const initialOn = activeInitial(selected || initial, selected ? chips : initialNames);
  const lengthOn = activeLength(length, lengthNames);
  const endingOn = activeEnding(ending, endingNames);
  const shown = visibleGivenCustomers(
    rows,
    selected ? initialArg(activeInitial(selected, chips)) : initialArg(activeInitial(initial, initialNames)),
    endingArg(endingOn),
    lengthArg(lengthOn),
    query,
  );
  const widest = Math.max(1, ...initials.map((line) => line.count));

  function store(next: string[], clear: string) {
    setHiddenInitials(next);
    writeJson(GIVEN_KEY, next);
    if (clear && activeInitial(selected, [clear]) === clear) setSelected("");
  }

  return (
    <section className="c4-gvn" aria-label={v4("gvnTitle")} data-given="1">
      <header className="c4-gvn-head">
        <div>
          <p className="c4-prf-kicker">{v4("gvnSub")}</p>
          <h2 className="c4-title">{v4("gvnTitle")}</h2>
        </div>
        <p className="c4-prf-count">{v4("gvnRows")} {rows.length}</p>
      </header>
      <details className="c4-prf-rules">
        <summary>{v4("gvnRules")}</summary>
        <p className="c4-meta">{v4("gvnHint")}</p>
        <p className="c4-meta">{v4("gvnLocal")}</p>
        <p className="c4-meta">{v4("gvnEscape")}</p>
      </details>
      {leadInitial ? <p className="c4-gvn-lead"><span>{v4("gvnLeadInitial")}</span> {leadInitial}</p> : null}
      {leadLength ? <p className="c4-gvn-lead"><span>{v4("gvnLeadLength")}</span> {lengthName(v4, leadLength)}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("gvnBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("given-names.csv", givensCsv(rows))}>{v4("gvnCsv")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("gvnLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("gvnFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-prf-empty">{v4("gvnNone")}</p>}
      {initials.length > 0 && (
        <section className="c4-gvn-chart" aria-label={v4("gvnAllInitial")}>
          {initials.map((line) => {
            const share = givenShare(line.count, rows.length);
            const width = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.initial || "blank";
            return (
              <p key={name} className="c4-gvn-col" data-length={line.initial ? "initial" : "blank"}>
                <span className="c4-gvn-mark">{line.initial || "—"}</span>
                <span>{line.initial || v4("gvnUnmarked")}</span>
                <span className="c4-prf-track" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("gvnShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      <div className="c4-gvn-initials" role="group" aria-label={v4("gvnAllInitial")}>
        <button type="button" className="c4-gvn-initial" data-on={!selected && initialOn === "all" ? "1" : "0"} aria-pressed={!selected && initialOn === "all"} onClick={() => { setSelected(""); setInitial("all"); }}>
          <span>{v4("gvnAllInitial")}</span>
          <span className="c4-prf-count">{rows.length}</span>
        </button>
        {blankInitial > 0 && (
          <button type="button" className="c4-gvn-initial" data-on={!selected && initial === "blank" ? "1" : "0"} aria-pressed={!selected && initial === "blank"} onClick={() => { setSelected(""); setInitial(initial === "blank" ? "all" : "blank"); }}>
            <span>{v4("gvnUnmarked")}</span>
            <span className="c4-prf-count">{blankInitial}</span>
          </button>
        )}
        {initialNames.map((item) => {
          const count = initials.find((line) => line.initial === item)?.count || 0;
          return (
            <button key={item} type="button" className="c4-gvn-initial" data-on={!selected && initial === item ? "1" : "0"} aria-pressed={!selected && initial === item} onClick={() => { setSelected(""); setInitial(initial === item ? "all" : item); }}>
              <span className="c4-gvn-mark">{item}</span>
              <span className="c4-prf-count">{count}</span>
              <span>{v4("gvnShare")} {givenShare(count, rows.length)}%</span>
            </button>
          );
        })}
      </div>
      <div className="c4-row" role="group" aria-label={v4("gvnLengths")}>
        <button type="button" className="c4-chip" data-on={lengthOn === "all" ? "1" : "0"} aria-pressed={lengthOn === "all"} onClick={() => setLength("all")}>{v4("gvnLengths")}</button>
        {lengths.filter((line) => line.length).map((line) => (
          <button key={line.length} type="button" className="c4-chip" data-on={lengthOn === line.length ? "1" : "0"} aria-pressed={lengthOn === line.length} onClick={() => setLength(lengthOn === line.length ? "all" : line.length)}>
            {lengthName(v4, line.length)} {line.count}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("gvnEndings")}>
        <button type="button" className="c4-chip" data-on={endingOn === "all" ? "1" : "0"} aria-pressed={endingOn === "all"} onClick={() => setEnding("all")}>{v4("gvnAllEndings")}</button>
        {endings.filter((line) => line.ending).map((line) => (
          <button key={line.ending} type="button" className="c4-chip" data-on={endingOn === line.ending ? "1" : "0"} aria-pressed={endingOn === line.ending} onClick={() => setEnding(endingOn === line.ending ? "all" : line.ending)}>
            {endingName(v4, line.ending)} {line.count}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("gvnShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("gvnShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("gvnHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("gvnInitials")}>
        <button type="button" className="c4-chip" data-on={!selected ? "1" : "0"} aria-pressed={!selected} onClick={() => setSelected("")}>{v4("gvnAll")}</button>
        {chips.map((item) => {
          const line = initials.find((row) => row.initial === item);
          const count = line?.count || 0;
          const share = givenShare(count, rows.length);
          return (
            <span key={item} className="c4-gvn-pair">
              <button type="button" className="c4-chip" data-on={selected === item ? "1" : "0"} aria-pressed={selected === item} onClick={() => { setInitial("all"); setSelected(selected === item ? "" : item); }}>{item}</button>
              <span className="c4-prf-count">{count}</span>
              <span className="c4-gvn-share">{v4("gvnShare")} {share}%</span>
              <span className="c4-prf-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
              <button type="button" className="c4-btn" onClick={() => store(toggleInitial(hiddenInitials, item, present), showHidden ? "" : item)}>{showHidden ? v4("gvnShow") : v4("gvnHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("gvnSearch")}</span>
        <input className="c4-field" aria-label={v4("gvnSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-prf-empty">{v4("gvnEmpty")}</p>}
      <ul className="c4-gvn-rows">
        {shown.map((row) => {
          const given = assignedGiven(row.given);
          const initialMark = initialOf(row.given);
          const lengthMark = lengthOf(row.given);
          const endingMark = endingOf(row.given);
          return (
            <li key={row.id} data-length={lengthMark || "blank"} data-ending={endingMark || "blank"}>
              <span className="c4-gvn-face" aria-hidden="true">{initialMark || "—"}</span>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">
                {given || v4("gvnUnmarked")}
                {" · "}
                {lengthName(v4, lengthMark)}
                {" · "}
                {endingName(v4, endingMark)}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
