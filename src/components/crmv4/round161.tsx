"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  PROOF_KEY,
  PROOF_VIEW_KEY,
  RIBBON_KEY,
  activeCut,
  activeDocket,
  activeFolio,
  activeInk,
  activeReviewer,
  activeRibbon,
  activeSpan,
  activeWeave,
  activeWeight,
  addProof,
  addProofView,
  clashProofCount,
  cutArg,
  cutLines,
  cutOf,
  docketArg,
  dropProofView,
  editProof,
  folioArg,
  inkArg,
  inkOf,
  leadingRibbon,
  leadingSpan,
  namedCuts,
  namedRibbons,
  namedSpans,
  namedWeaves,
  nextProof,
  proofClashIds,
  proofCopy,
  proofCounts,
  proofDockets,
  proofGap,
  proofInks,
  proofReviewers,
  proofShare,
  proofWeights,
  proofsCsv,
  readHiddenRibbons,
  readProofViews,
  readProofs,
  resetProofs,
  reviewerArg,
  ribbonArg,
  ribbonName,
  ribbonShare,
  ribbonsCsv,
  setProofIssued,
  setProofPinned,
  setProofProofed,
  sheetCounts,
  sheetOf,
  sideOf,
  spanArg,
  spanLines,
  spanOf,
  stepProofWeight,
  toggleRibbon,
  visibleProofs,
  visibleRibbonCustomers,
  visibleRibbons,
  weaveArg,
  weaveLines,
  weaveOf,
  weightArg,
  weightOf,
  bulkProofIssued,
  bulkProofPinned,
  proofTimeline,
  type ProofCard,
  type ProofInk,
  type ProofTray,
  type ProofView,
  type ProofWeight,
  type RibbonCut,
  type RibbonRow,
  type RibbonSpan,
  type RibbonWeave,
} from "@/lib/crmv4/round161";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  affiliateB?: string | null;
};

type GlanceRow = RibbonRow & { id: string };

const SHEETS = ["cover", "leaf", "spine", "end"] as const;

function inkName(v4: V4, ink: ProofInk): string {
  if (ink === "carbon") return v4("prfInkCarbon");
  if (ink === "iron") return v4("prfInkIron");
  if (ink === "walnut") return v4("prfInkWalnut");
  if (ink === "soot") return v4("prfInkSoot");
  return v4("prfBlankInk");
}

function weightName(v4: V4, weight: ProofWeight): string {
  if (weight === "light") return v4("prfLight");
  if (weight === "firm") return v4("prfFirm");
  if (weight === "heavy") return v4("prfHeavy");
  return v4("prfBlankWeight");
}

function sheetName(v4: V4, name: string): string {
  if (name === "cover") return v4("prfCover");
  if (name === "leaf") return v4("prfLeaf");
  if (name === "spine") return v4("prfSpine");
  if (name === "end") return v4("prfEnd");
  if (name === "inner") return v4("prfInner");
  if (name === "outer") return v4("prfOuter");
  if (/^(?:0?[1-8])$/.test(name)) return String(Number(name));
  return v4("prfBlankFolio");
}

function spanName(v4: V4, name: string): string {
  if (name === "short") return v4("arbShort");
  if (name === "pair") return v4("arbPair");
  if (name === "chain") return v4("arbChain");
  return v4("arbUnmarked");
}

function cutName(v4: V4, name: string): string {
  if (name === "vowel") return v4("arbVowel");
  if (name === "consonant") return v4("arbConsonant");
  if (name === "other") return v4("arbOther");
  return v4("arbUnmarked");
}

function weaveName(v4: V4, name: string): string {
  if (name === "solo") return v4("arbSolo");
  if (name === "joined") return v4("arbJoined");
  if (name === "spaced") return v4("arbSpaced");
  return v4("arbUnmarked");
}

function auditName(v4: V4, audit: string): string {
  if (audit === "save") return v4("prfAuditSave");
  if (audit === "edit") return v4("prfAuditEdit");
  if (audit === "raise") return v4("prfAuditRaise");
  if (audit === "lower") return v4("prfAuditLower");
  if (audit === "pin") return v4("prfAuditPin");
  if (audit === "unpin") return v4("prfAuditUnpin");
  if (audit === "proof") return v4("prfAuditProof");
  if (audit === "lift") return v4("prfAuditLift");
  if (audit === "issue") return v4("prfAuditIssue");
  if (audit === "recall") return v4("prfAuditRecall");
  return "";
}

function folioLabel(folio: number | null): string {
  return folio === null ? "—" : String(folio);
}

function gapLabel(v4: V4, folio: number | null, desk: string): string {
  const gap = proofGap(folio, desk);
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

function marks(weight: string): number {
  if (weight === "heavy") return 3;
  if (weight === "firm") return 2;
  if (weight === "light") return 1;
  return 0;
}

export function DocumentProofs({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<ProofCard[]>([]);
  const [views, setViews] = useState<ProofView[]>([]);
  const [text, setText] = useState("");
  const [reviewer, setReviewer] = useState("");
  const [folio, setFolio] = useState("");
  const [ink, setInk] = useState("");
  const [docket, setDocket] = useState("");
  const [weight, setWeight] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<ProofTray>("open");
  const [reviewerFilter, setReviewerFilter] = useState("all");
  const [inkFilter, setInkFilter] = useState("all");
  const [docketFilter, setDocketFilter] = useState("all");
  const [weightFilter, setWeightFilter] = useState("all");
  const [folioFilter, setFolioFilter] = useState("all");
  const [heavyOnly, setHeavyOnly] = useState(false);
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
      if (event.key === "m" || event.key === "M") {
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
  const reviewers = proofReviewers(cards);
  const inks = proofInks(cards);
  const docketsOn = proofDockets(cards);
  const weights = proofWeights(cards);
  const bars = sheetCounts(cards);
  const reviewerOn = activeReviewer(reviewerFilter, reviewers);
  const inkOn = activeInk(inkFilter, inks);
  const docketOn = activeDocket(docketFilter, docketsOn);
  const weightOn = activeWeight(weightFilter, weights);
  const folioOn = activeFolio(folioFilter);
  const picked = folioArg(folioOn);
  const shown = visibleProofs(
    cards,
    tray,
    query,
    reviewerArg(reviewerOn),
    inkArg(inkOn),
    docketArg(docketOn),
    weightArg(weightOn),
    picked.exact,
    picked.sheet,
    heavyOnly,
    lateOnly,
    desk,
  );
  const timeline = proofTimeline(cards, query);
  const counts = proofCounts(cards, desk);
  const clashes = clashProofCount(cards);
  const total = cards.length;
  const nextId = nextProof(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const widest = Math.max(1, ...bars);
  const pinned = cards.filter((card) => card.pinned);

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
    setReviewer("");
    setFolio("");
    setInk("");
    setDocket("");
    setWeight("");
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
    setReviewerFilter(activeReviewer(view.reviewer, proofReviewers(cards)));
    setInkFilter(activeInk(view.ink, proofInks(cards)));
    setDocketFilter(activeDocket(view.docket, proofDockets(cards)));
    setWeightFilter(activeWeight(view.weight, proofWeights(cards)));
    setFolioFilter(activeFolio(view.folio));
    setBoard("cards");
    setHeavyOnly(false);
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
        <p className="c4-meta">{v4("prfReviewerBlank")}</p>
        <p className="c4-meta">{v4("prfFolioBlank")}</p>
        <p className="c4-meta">{v4("prfInkBlank")}</p>
        <p className="c4-meta">{v4("prfDocketBlank")}</p>
        <p className="c4-meta">{v4("prfWeightBlank")}</p>
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
      <p className="c4-prf-notice" role="status">
        <span>{v4("prfClashNotice")}</span>
        <span className="c4-prf-count">{clashes}</span>
      </p>
      {pinned.length > 0 && (
        <ul className="c4-prf-pins" aria-label={v4("prfPinned")}>
          {pinned.map((card) => (
            <li key={card.id}>
              <button type="button" className="c4-chip" onClick={() => { setQuery(card.text); setBoard("cards"); }}>{card.text}</button>
            </li>
          ))}
        </ul>
      )}
      <section className="c4-prf-kpi" aria-label={v4("prfKpi")}>
        {(["open", "proofed", "issued", "pinned"] as const).map((key) => {
          const count = counts[key];
          const share = proofShare(count, total);
          const label = key === "open" ? v4("prfOpen") : key === "proofed" ? v4("prfProofed") : key === "issued" ? v4("prfIssued") : v4("prfPinned");
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
        {SHEETS.map((name, index) => {
          const count = bars[index] || 0;
          const width = Math.max(8, Math.round((count / widest) * 100));
          return (
            <button key={name} type="button" className="c4-prf-col" data-on={folioOn === name ? "1" : "0"} aria-pressed={folioOn === name} onClick={() => setFolioFilter(folioOn === name ? "all" : name)}>
              <span>{sheetName(v4, name)}</span>
              <span className="c4-prf-bar" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
              <span>{count}</span>
            </button>
          );
        })}
      </section>
      <form className="c4-prf-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addProof(cards, { id: `prf-${Date.now()}`, text, reviewer, folio, ink, docket, weight });
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
          <span>{v4("prfReviewer")}</span>
          <input className="c4-field" aria-label={v4("prfReviewer")} value={reviewer} disabled={viewer} onChange={(event) => setReviewer(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("prfFolio")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("prfFolio")} value={folio} disabled={viewer} onChange={(event) => setFolio(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("prfInk")}</span>
          <select className="c4-select" aria-label={v4("prfInk")} value={ink} disabled={viewer} onChange={(event) => setInk(event.target.value)}>
            <option value="">{v4("prfBlankInk")}</option>
            <option value="carbon">{v4("prfInkCarbon")}</option>
            <option value="iron">{v4("prfInkIron")}</option>
            <option value="walnut">{v4("prfInkWalnut")}</option>
            <option value="soot">{v4("prfInkSoot")}</option>
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("prfDocket")}</span>
          <input className="c4-field" aria-label={v4("prfDocket")} value={docket} disabled={viewer} onChange={(event) => setDocket(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("prfWeight")}</span>
          <select className="c4-select" aria-label={v4("prfWeight")} value={weight} disabled={viewer} onChange={(event) => setWeight(event.target.value)}>
            <option value="">{v4("prfBlankWeight")}</option>
            <option value="light">{v4("prfLight")}</option>
            <option value="firm">{v4("prfFirm")}</option>
            <option value="heavy">{v4("prfHeavy")}</option>
          </select>
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("prfAdd")}</button>
      </form>
      <div className="c4-row" role="group" aria-label={v4("prfTitle")}>
        <button type="button" className="c4-chip" data-on={tray === "open" ? "1" : "0"} aria-pressed={tray === "open"} onClick={() => setTray("open")}>{v4("prfOpen")}</button>
        <button type="button" className="c4-chip" data-on={tray === "proofed" ? "1" : "0"} aria-pressed={tray === "proofed"} onClick={() => setTray("proofed")}>{v4("prfProofed")}</button>
        <button type="button" className="c4-chip" data-on={tray === "issued" ? "1" : "0"} aria-pressed={tray === "issued"} onClick={() => setTray("issued")}>{v4("prfIssued")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("prfTimeline")}</button>
        <button type="button" className="c4-chip" data-on={heavyOnly ? "1" : "0"} aria-pressed={heavyOnly} onClick={() => setHeavyOnly((value) => !value)}>{v4("prfHeavyOnly")}</button>
        <button type="button" className="c4-btn" onClick={() => download("press-proofs.csv", proofsCsv(cards, desk))}>{v4("prfCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkProofPinned(cards, shown.map((card) => card.id), true))}>{v4("prfBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkProofIssued(cards, shown.map((card) => card.id), true))}>{v4("prfBulkIssue")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(resetProofs()); setEditing(""); }}>{v4("prfReset")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("prfFolios")}>
        <button type="button" className="c4-chip" data-on={folioOn === "all" ? "1" : "0"} aria-pressed={folioOn === "all"} onClick={() => setFolioFilter("all")}>{v4("prfAllFolios")}</button>
        <button type="button" className="c4-chip" data-on={folioOn === "blank" ? "1" : "0"} aria-pressed={folioOn === "blank"} onClick={() => setFolioFilter("blank")}>{v4("prfBlankFolio")}</button>
        <button type="button" className="c4-chip" data-on={folioOn === "inner" ? "1" : "0"} aria-pressed={folioOn === "inner"} onClick={() => setFolioFilter("inner")}>{v4("prfInner")}</button>
        <button type="button" className="c4-chip" data-on={folioOn === "outer" ? "1" : "0"} aria-pressed={folioOn === "outer"} onClick={() => setFolioFilter("outer")}>{v4("prfOuter")}</button>
        {["1", "3", "5", "7"].map((slot) => (
          <button key={slot} type="button" className="c4-chip" data-on={folioOn === slot ? "1" : "0"} aria-pressed={folioOn === slot} onClick={() => setFolioFilter(folioOn === slot ? "all" : slot)}>{slot}</button>
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
          <span>{v4("prfReviewers")}</span>
          <select className="c4-select" aria-label={v4("prfReviewers")} value={reviewerOn} onChange={(event) => setReviewerFilter(event.target.value)}>
            <option value="all">{v4("prfAllReviewers")}</option>
            <option value="blank">{v4("prfBlankReviewer")}</option>
            {reviewers.map((item) => <option key={item} value={item}>{item}</option>)}
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
        <label className="c4-lab">
          <span>{v4("prfDockets")}</span>
          <select className="c4-select" aria-label={v4("prfDockets")} value={docketOn} onChange={(event) => setDocketFilter(event.target.value)}>
            <option value="all">{v4("prfAllDockets")}</option>
            <option value="blank">{v4("prfBlankDocket")}</option>
            {docketsOn.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("prfWeights")}</span>
          <select className="c4-select" aria-label={v4("prfWeights")} value={weightOn} onChange={(event) => setWeightFilter(event.target.value)}>
            <option value="all">{v4("prfAllWeights")}</option>
            <option value="blank">{v4("prfBlankWeight")}</option>
            {weights.map((item) => <option key={item} value={item}>{weightName(v4, item)}</option>)}
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
          reviewer: reviewerOn,
          ink: inkOn,
          docket: docketOn,
          weight: weightOn,
          folio: folioOn,
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
            const clashesOn = proofClashIds(cards, card.id);
            const gap = gapLabel(v4, card.folio, desk);
            const side = sideOf(card.folio);
            const editingCard = editing === card.id;
            return (
              <li key={card.id} data-weight={card.weight || "blank"} data-ink={card.ink || "blank"} data-sheet={sheetOf(card.folio)}>
                <span className="c4-prf-folio" aria-hidden="true">{folioLabel(card.folio)}</span>
                <span className="c4-prf-marks" aria-hidden="true">
                  {[0, 1, 2].map((index) => <i key={index} data-on={index < marks(card.weight) ? "1" : "0"} />)}
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
                    {card.reviewer || v4("prfBlankReviewer")}
                    {" · "}
                    {folioLabel(card.folio)}
                    {" · "}
                    {inkName(v4, inkOf(card.ink))}
                    {" · "}
                    {card.docket || v4("prfBlankDocket")}
                    {" · "}
                    {weightName(v4, weightOf(card.weight))}
                    {side === "blank" ? "" : ` · ${side === "inner" ? v4("prfInner") : v4("prfOuter")}`}
                    {gap ? ` · ${gap}` : ""}
                    {auditName(v4, card.audit) ? ` · ${v4("prfAudit")} ${auditName(v4, card.audit)}` : ""}
                    {" · "}
                    {clashesOn.length ? `${v4("prfClash")} ${clashesOn.length}` : v4("prfClashNone")}
                  </p>
                </div>
                <div className="c4-row">
                  <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("prfCopied") : v4("prfCopy")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.text); }}>{v4("prfEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepProofWeight(cards, card.id, 1))}>{v4("prfRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepProofWeight(cards, card.id, -1))}>{v4("prfLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.pinned} onClick={() => store(setProofPinned(cards, card.id, !card.pinned))}>{card.pinned ? v4("prfUnpin") : v4("prfPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.proofed} onClick={() => store(setProofProofed(cards, card.id, !card.proofed))}>{card.proofed ? v4("prfLift") : v4("prfProof")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.issued} onClick={() => store(setProofIssued(cards, card.id, !card.issued))}>{card.issued ? v4("prfRecall") : v4("prfIssue")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {board === "timeline" && (
        <ol className="c4-prf-time">
          {timeline.map((card) => (
            <li key={card.id} data-sheet={sheetOf(card.folio)}>
              <span className="c4-prf-clock">{folioLabel(card.folio)}</span>
              <p>{card.text}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function AffiliateRibbons({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenRibbons, setHiddenRibbons] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [span, setSpan] = useState("all");
  const [cut, setCut] = useState("all");
  const [weave, setWeave] = useState("all");
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = useMemo(() => (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || "").trim(),
      affiliateB: row.affiliateB,
    };
  }).filter((row): row is GlanceRow => Boolean(row)), [data.data?.users]);
  const spans = spanLines(rows);
  const cuts = cutLines(rows);
  const weaves = weaveLines(rows);
  const present = namedRibbons(rows);
  const presentKey = present.join("\n");
  const spanNames = namedSpans(rows);
  const cutNames = namedCuts(rows);
  const weaveNames = namedWeaves(rows);
  const leadRibbon = leadingRibbon(rows);
  const leadSpan = leadingSpan(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenRibbons(readJson(RIBBON_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenRibbons(next);
    writeJson(RIBBON_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleRibbons(present, hiddenRibbons, showHidden);
  const spanOn = activeSpan(span, spanNames);
  const cutOn = activeCut(cut, cutNames);
  const weaveOn = activeWeave(weave, weaveNames);
  const shown = visibleRibbonCustomers(
    rows,
    spanArg(spanOn),
    cutArg(cutOn),
    weaveArg(weaveOn),
    selected ? ribbonArg(activeRibbon(selected, chips)) : null,
    query,
  );
  const widest = Math.max(1, ...spans.map((line) => line.count));
  const blankSpan = spans.find((line) => !line.span)?.count || 0;

  function store(next: string[], clear: string) {
    setHiddenRibbons(next);
    writeJson(RIBBON_KEY, next);
    if (clear && activeRibbon(selected, [clear]) === clear) setSelected("");
  }

  return (
    <section className="c4-arb" aria-label={v4("arbTitle")} data-ribbons="1">
      <header className="c4-arb-head">
        <div>
          <p className="c4-prf-kicker">{v4("arbSub")}</p>
          <h2 className="c4-title">{v4("arbTitle")}</h2>
        </div>
        <p className="c4-prf-count">{v4("arbRows")} {rows.length}</p>
      </header>
      <details className="c4-prf-rules">
        <summary>{v4("arbRules")}</summary>
        <p className="c4-meta">{v4("arbHint")}</p>
        <p className="c4-meta">{v4("arbLocal")}</p>
        <p className="c4-meta">{v4("arbEscape")}</p>
      </details>
      {leadRibbon ? <p className="c4-arb-lead"><span>{v4("arbLeadRibbon")}</span> {leadRibbon}</p> : null}
      {leadSpan ? <p className="c4-arb-lead"><span>{v4("arbLeadSpan")}</span> {spanName(v4, leadSpan)}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("arbBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("affiliate-ribbons.csv", ribbonsCsv(rows))}>{v4("arbCsv")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("arbLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("arbFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-prf-empty">{v4("arbNone")}</p>}
      {spans.length > 0 && (
        <section className="c4-arb-chart" aria-label={v4("arbAllSpan")}>
          {spans.map((line) => {
            const share = ribbonShare(line.count, rows.length);
            const width = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.span || "blank";
            return (
              <p key={name} className="c4-arb-col" data-span={line.span || "blank"}>
                <span>{spanName(v4, line.span)}</span>
                <span className="c4-prf-track" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("arbShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      <div className="c4-arb-spans" role="group" aria-label={v4("arbAllSpan")}>
        <button type="button" className="c4-arb-span" data-on={spanOn === "all" ? "1" : "0"} aria-pressed={spanOn === "all"} onClick={() => { setSelected(""); setSpan("all"); }}>
          <span>{v4("arbAllSpan")}</span>
          <span className="c4-prf-count">{rows.length}</span>
        </button>
        {blankSpan > 0 && (
          <button type="button" className="c4-arb-span" data-on={span === "blank" ? "1" : "0"} aria-pressed={span === "blank"} onClick={() => { setSelected(""); setSpan(span === "blank" ? "all" : "blank"); }}>
            <span>{v4("arbUnmarked")}</span>
            <span className="c4-prf-count">{blankSpan}</span>
          </button>
        )}
        {spanNames.map((item) => {
          const count = spans.find((line) => line.span === item)?.count || 0;
          return (
            <button key={item} type="button" className="c4-arb-span" data-on={span === item ? "1" : "0"} aria-pressed={span === item} onClick={() => { setSelected(""); setSpan(span === item ? "all" : item); }}>
              <span>{spanName(v4, item)}</span>
              <span className="c4-prf-count">{count}</span>
              <span>{v4("arbShare")} {ribbonShare(count, rows.length)}%</span>
            </button>
          );
        })}
      </div>
      <div className="c4-row" role="group" aria-label={v4("arbCuts")}>
        <button type="button" className="c4-chip" data-on={cutOn === "all" ? "1" : "0"} aria-pressed={cutOn === "all"} onClick={() => setCut("all")}>{v4("arbAllCuts")}</button>
        {cuts.filter((line) => line.cut).map((line) => (
          <button key={line.cut} type="button" className="c4-chip" data-on={cutOn === line.cut ? "1" : "0"} aria-pressed={cutOn === line.cut} onClick={() => setCut(cutOn === line.cut ? "all" : line.cut)}>
            {cutName(v4, line.cut)} {line.count}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("arbWeaves")}>
        <button type="button" className="c4-chip" data-on={weaveOn === "all" ? "1" : "0"} aria-pressed={weaveOn === "all"} onClick={() => setWeave("all")}>{v4("arbWeaves")}</button>
        {weaves.filter((line) => line.weave).map((line) => (
          <button key={line.weave} type="button" className="c4-chip" data-on={weaveOn === line.weave ? "1" : "0"} aria-pressed={weaveOn === line.weave} onClick={() => setWeave(weaveOn === line.weave ? "all" : line.weave)}>
            {weaveName(v4, line.weave)} {line.count}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("arbShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("arbShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("arbHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("arbRibbons")}>
        <button type="button" className="c4-chip" data-on={!selected ? "1" : "0"} aria-pressed={!selected} onClick={() => setSelected("")}>{v4("arbAll")}</button>
        {chips.map((item) => {
          const count = rows.filter((row) => ribbonName(row.affiliateB) === item).length;
          const share = ribbonShare(count, rows.length);
          return (
            <span key={item} className="c4-arb-pair">
              <button type="button" className="c4-chip" data-on={selected === item ? "1" : "0"} aria-pressed={selected === item} onClick={() => { setSpan("all"); setSelected(selected === item ? "" : item); }}>{item}</button>
              <span className="c4-prf-count">{count}</span>
              <span className="c4-arb-share">{v4("arbShare")} {share}%</span>
              <span className="c4-prf-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
              <button type="button" className="c4-btn" onClick={() => store(toggleRibbon(hiddenRibbons, item, present), showHidden ? "" : item)}>{showHidden ? v4("arbShow") : v4("arbHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("arbSearch")}</span>
        <input className="c4-field" aria-label={v4("arbSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-prf-empty">{v4("arbEmpty")}</p>}
      <ul className="c4-arb-rows">
        {shown.map((row) => {
          const spanMark = spanOf(row.affiliateB) as RibbonSpan;
          const cutMark = cutOf(row.affiliateB) as RibbonCut;
          const weaveMark = weaveOf(row.affiliateB) as RibbonWeave;
          const ribbon = ribbonName(row.affiliateB);
          return (
            <li key={row.id} data-span={spanMark || "blank"} data-cut={cutMark || "blank"} data-weave={weaveMark || "blank"}>
              <span className="c4-arb-face" aria-hidden="true">{ribbon ? ribbon.slice(0, 1).toUpperCase() : "—"}</span>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">
                {ribbon || v4("arbUnmarked")}
                {" · "}
                {spanName(v4, spanMark)}
                {" · "}
                {cutName(v4, cutMark)}
                {" · "}
                {weaveName(v4, weaveMark)}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
