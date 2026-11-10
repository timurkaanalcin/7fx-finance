"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  CARTOUCHE_KEY,
  CARTOUCHE_VIEW_KEY,
  MARK_KEY,
  MARK_REVIEW_KEY,
  activeClerk,
  activeCode,
  activeFace,
  activeHue,
  activeMark,
  activeMarkDepth,
  activeRank,
  activeSlot,
  activeSpan,
  addCartouche,
  addCartoucheView,
  bulkCartoucheFace,
  bulkCartoucheFile,
  bulkCartouchePin,
  bulkReview,
  cartoucheClerks,
  cartoucheCodes,
  cartoucheCopy,
  cartoucheCounts,
  cartoucheFaces,
  cartoucheHues,
  cartoucheShare,
  cartouchesCsv,
  clashSlotCount,
  clerkArg,
  clerkLoad,
  codeArg,
  cycleHue,
  dropCartoucheView,
  editCartouche,
  editCartoucheNote,
  faceArg,
  faceCounts,
  faceOf,
  homeCode,
  hueArg,
  hueOf,
  lateCartouche,
  leadingMark,
  leadingMarkDepth,
  markArg,
  markBand,
  markCopy,
  markDepth,
  markDepthArg,
  markRowsCsv,
  markShare,
  markState,
  markWords,
  marksCsv,
  nextCartouche,
  oddMarkCount,
  presentMarks,
  rankArg,
  rankClashCount,
  rankClashIds,
  readCartoucheViews,
  readCartouches,
  readHiddenMarks,
  readReviewed,
  resetCartouches,
  setCartoucheFiled,
  setCartouchePin,
  setCartoucheStamp,
  slotArg,
  slotBand,
  slotClashIds,
  slotGap,
  slotTimeline,
  soonCartouche,
  spanArg,
  suggestClerk,
  suggestFace,
  suggestSpan,
  toggleMark,
  toggleReview,
  usedSlots,
  visibleCartouches,
  visibleMarkBands,
  visibleMarkCustomers,
  type Cartouche,
  type CartoucheFace,
  type CartoucheHue,
  type CartoucheTray,
  type CartoucheView,
  type MarkRow,
  type MarkShape,
} from "@/lib/crmv4/round177";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  registrationCountry?: string | null;
};

type GlanceRow = MarkRow & { id: string };

const FACES = ["cut", "gilt", "blind"] as const;
const BANDS = ["iso", "name", "title", "scroll"] as const;

function faceName(v4: V4, face: CartoucheFace | string): string {
  if (face === "cut") return v4("crtFaceCut");
  if (face === "gilt") return v4("crtFaceGilt");
  if (face === "blind") return v4("crtFaceBlind");
  return v4("crtBlankFace");
}

function hueName(v4: V4, hue: CartoucheHue): string {
  if (hue === "mist") return v4("crtHueMist");
  if (hue === "sand") return v4("crtHueSand");
  if (hue === "pitch") return v4("crtHuePitch");
  return v4("crtBlankHue");
}

function slotName(v4: V4, name: string): string {
  if (name === "early") return v4("crtEarly");
  if (name === "mid") return v4("crtMid");
  if (name === "late") return v4("crtLate");
  if (name === "peak") return v4("crtPeak");
  if (name === "quiet") return v4("crtQuiet");
  if (/^[1-6]$/.test(name)) return name;
  return v4("crtBlankSlot");
}

function rankName(v4: V4, rank: number | null): string {
  if (rank === 1) return v4("crtRank1");
  if (rank === 2) return v4("crtRank2");
  if (rank === 4) return v4("crtRank4");
  return v4("crtBlankRank");
}

function spanName(v4: V4, span: number | null): string {
  if (span === 3) return v4("crtSpan3");
  if (span === 6) return v4("crtSpan6");
  if (span === 9) return v4("crtSpan9");
  return v4("crtBlankSpan");
}

function bandName(v4: V4, name: string): string {
  if (name === "iso") return v4("rgtIso");
  if (name === "name") return v4("rgtName");
  if (name === "title") return v4("rgtTitleBand");
  if (name === "scroll") return v4("rgtScroll");
  if (name === "blank") return v4("rgtClear");
  return v4("rgtUnmarked");
}

function depthName(v4: V4, name: string): string {
  if (name === "plain") return v4("rgtPlain");
  if (name === "pair") return v4("rgtPair");
  if (name === "stack") return v4("rgtStack");
  if (name === "cipher") return v4("rgtCipher");
  return v4("rgtUnmarked");
}

function auditName(v4: V4, audit: string): string {
  const key = {
    save: "crtAuditSave",
    edit: "crtAuditEdit",
    hue: "crtAuditHue",
    pin: "crtAuditPin",
    unpin: "crtAuditUnpin",
    stamp: "crtAuditStamp",
    lift: "crtAuditLift",
    file: "crtAuditFile",
    restore: "crtAuditRestore",
    shift: "crtAuditShift",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function slotLabel(slot: number | null): string {
  return slot === null ? "—" : String(slot);
}

function gapLabel(v4: V4, slot: number | null, desk: string): string {
  const gap = slotGap(slot, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("crtPast")} ${gap}`;
  if (gap < 0) return `${v4("crtAhead")} ${Math.abs(gap)}`;
  return v4("crtDue");
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

function sameCards(left: readonly Cartouche[], right: readonly Cartouche[]): boolean {
  return left.length === right.length && left.every((card, index) => card.id === right[index]?.id && card.title === right[index]?.title && card.note === right[index]?.note && card.audit === right[index]?.audit);
}

export function RegistryCartouches({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<Cartouche[]>([]);
  const [views, setViews] = useState<CartoucheView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [clerk, setClerk] = useState("");
  const [slot, setSlot] = useState("");
  const [face, setFace] = useState("");
  const [code, setCode] = useState("");
  const [hue, setHue] = useState("");
  const [rank, setRank] = useState("");
  const [span, setSpan] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<CartoucheTray>("open");
  const [clerkFilter, setClerkFilter] = useState("all");
  const [faceFilter, setFaceFilter] = useState("all");
  const [codeFilter, setCodeFilter] = useState("all");
  const [hueFilter, setHueFilter] = useState("all");
  const [slotFilter, setSlotFilter] = useState("all");
  const [rankFilter, setRankFilter] = useState("all");
  const [spanFilter, setSpanFilter] = useState("all");
  const [pitchOnly, setPitchOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [homeOnly, setHomeOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [desk, setDesk] = useState("");
  const [moveFace, setMoveFace] = useState("cut");
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readCartouches(readJson(CARTOUCHE_KEY, []));
    const saved = readCartoucheViews(readJson(CARTOUCHE_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(CARTOUCHE_KEY, next);
    writeJson(CARTOUCHE_VIEW_KEY, saved);
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
  const clerks = cartoucheClerks(cards);
  const faces = cartoucheFaces(cards);
  const codes = cartoucheCodes(cards);
  const hues = cartoucheHues(cards);
  const bars = faceCounts(cards);
  const clerkOn = activeClerk(clerkFilter, clerks);
  const faceOn = activeFace(faceFilter, FACES);
  const codeOn = activeCode(codeFilter, codes);
  const hueOn = activeHue(hueFilter, hues);
  const slotOn = activeSlot(slotFilter);
  const rankOn = activeRank(rankFilter);
  const spanOn = activeSpan(spanFilter);
  const pickedSlot = slotArg(slotOn);
  const shown = visibleCartouches(
    cards,
    tray,
    query,
    clerkArg(clerkOn),
    faceArg(faceOn),
    codeArg(codeOn),
    hueArg(hueOn),
    pickedSlot.exact,
    pickedSlot.pick,
    rankArg(rankOn),
    spanArg(spanOn),
    pitchOnly,
    peakOnly,
    homeOnly,
  );
  const timeline = slotTimeline(cards, query);
  const counts = cartoucheCounts(cards, desk);
  const clashes = clashSlotCount(cards);
  const ranks = rankClashCount(cards);
  const slotUse = usedSlots(cards);
  const total = cards.length;
  const nextId = nextCartouche(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const widest = Math.max(1, ...bars);
  const pinned = cards.filter((card) => card.pinned);
  const load = clerkLoad(cards, clerk);
  const suggested = suggestFace(cards);
  const lightClerk = suggestClerk(cards);
  const quietSpan = suggestSpan(cards);
  const homeShare = cartoucheShare(counts.home, total);
  const targets = picked.length ? picked : shown.map((card) => card.id);

  function store(next: Cartouche[]) {
    setCards(next);
    writeJson(CARTOUCHE_KEY, next);
  }

  function storeViews(next: CartoucheView[]) {
    setViews(next);
    writeJson(CARTOUCHE_VIEW_KEY, next);
  }

  function clearDraft() {
    setTitle("");
    setNote("");
    setClerk("");
    setSlot("");
    setFace("");
    setCode("");
    setHue("");
    setRank("");
    setSpan("");
  }

  function copyCard(card: Cartouche) {
    const body = cartoucheCopy(card.title);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(card.id);
  }

  function applyView(view: CartoucheView) {
    setTray(view.tray);
    setQuery(view.query);
    setClerkFilter(activeClerk(view.clerk, cartoucheClerks(cards)));
    setFaceFilter(activeFace(view.face, FACES));
    setCodeFilter(activeCode(view.code, cartoucheCodes(cards)));
    setHueFilter(activeHue(view.hue, cartoucheHues(cards)));
    setSlotFilter(activeSlot(view.slot));
    setRankFilter(activeRank(view.rank));
    setSpanFilter(activeSpan(view.span));
    setBoard("cards");
    setPitchOnly(false);
    setPeakOnly(false);
    setHomeOnly(false);
  }

  function togglePick(id: string) {
    setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <section className="c4-crt" aria-label={v4("crtTitle")} data-cartouches="1" data-role={role}>
      <header className="c4-crt-head">
        <p className="c4-crt-plate" data-logo="mono">{v4("crtLogo")}</p>
        <div>
          <p className="c4-crt-kicker">{v4("crtSub")}</p>
          <h2 className="c4-title">{v4("crtTitle")}</h2>
        </div>
        <p className="c4-crt-count">{shown.length}</p>
      </header>
      <details className="c4-crt-rules">
        <summary>{v4("crtRules")}</summary>
        <p className="c4-meta">{v4("crtHint")}</p>
        <p className="c4-meta">{v4("crtLocal")}</p>
        <p className="c4-meta">{v4("crtBlank")}</p>
        <p className="c4-meta">{v4("crtClerkBlank")}</p>
        <p className="c4-meta">{v4("crtSlotBlank")}</p>
        <p className="c4-meta">{v4("crtFaceBlank")}</p>
        <p className="c4-meta">{v4("crtCodeBlank")}</p>
        <p className="c4-meta">{v4("crtHueBlank")}</p>
        <p className="c4-meta">{v4("crtRankBlank")}</p>
        <p className="c4-meta">{v4("crtSpanBlank")}</p>
        <p className="c4-meta">{v4("crtNoteBlank")}</p>
        <p className="c4-meta">{v4("crtEscape")}</p>
        <p className="c4-meta">{v4("crtSlash")}</p>
        <p className="c4-meta">{v4("crtNew")}</p>
      </details>
      {viewer ? <p className="c4-crt-notice" role="status">{v4("crtViewer")}</p> : null}
      <p className="c4-crt-notice" role="status">
        <span>{v4("crtNotice")}</span>
        <span className="c4-crt-count">{counts.peak}</span>
        <button type="button" className="c4-btn" aria-pressed={peakOnly} onClick={() => { setPeakOnly((value) => !value); setTray("open"); }}>
          {peakOnly ? v4("crtNoticeAll") : v4("crtNoticePeak")}
        </button>
      </p>
      <p className="c4-crt-notice" role="status"><span>{v4("crtLate")}</span><span className="c4-crt-count">{counts.late}</span></p>
      <p className="c4-crt-notice" role="status"><span>{v4("crtSoon")}</span><span className="c4-crt-count">{counts.soon}</span></p>
      <p className="c4-crt-notice" role="status"><span>{v4("crtSlotUse")}</span><span className="c4-crt-count">{slotUse}</span></p>
      <p className="c4-crt-notice" role="status"><span>{v4("crtClash")}</span><span className="c4-crt-count">{clashes}</span></p>
      <p className="c4-crt-notice" role="status"><span>{v4("crtRankClash")}</span><span className="c4-crt-count">{ranks}</span></p>
      <p className="c4-crt-notice" role="status">
        <span>{v4("crtHome")}</span>
        <span className="c4-crt-count">{counts.home}</span>
        <span>{v4("crtHomeShare")} {homeShare}%</span>
        <button type="button" className="c4-btn" aria-pressed={homeOnly} onClick={() => setHomeOnly((value) => !value)}>
          {homeOnly ? v4("crtHomeAll") : v4("crtHomeOnly")}
        </button>
      </p>
      <p className="c4-crt-suggest" role="status">
        <span>{v4("crtSuggest")}</span> {faceName(v4, suggested)}
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setFace(suggested)}>{v4("crtUseFace")}</button>
      </p>
      <p className="c4-crt-suggest" role="status">
        <span>{v4("crtSuggestClerk")}</span> {lightClerk || v4("crtBlankClerk")}
        <button type="button" className="c4-btn" disabled={viewer || !lightClerk} onClick={() => setClerk(lightClerk)}>{v4("crtUseClerk")}</button>
      </p>
      <p className="c4-crt-suggest" role="status">
        <span>{v4("crtSuggestSpan")}</span> {spanName(v4, quietSpan)}
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setSpan(String(quietSpan))}>{v4("crtUseSpan")}</button>
      </p>
      {pinned.length > 0 && (
        <ul className="c4-crt-pins" aria-label={v4("crtPinned")}>
          {pinned.map((card) => (
            <li key={card.id}><span className="c4-crt-mark" aria-hidden="true">{slotLabel(card.slot)}</span> {card.title}</li>
          ))}
        </ul>
      )}
      <section className="c4-crt-kpi" aria-label={v4("crtKpi")}>
        {(["open", "stamped", "filed"] as const).map((key) => {
          const count = counts[key];
          const share = cartoucheShare(count, total);
          const label = key === "open" ? v4("crtWaiting") : key === "stamped" ? v4("crtStamped") : v4("crtFiled");
          return (
            <p key={key} className="c4-crt-meter" data-tray={key}>
              <span>{label}</span>
              <span className="c4-crt-count">{count}</span>
              <span>{v4("crtShare")} {share}%</span>
              <span className="c4-crt-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <section className="c4-crt-chart" aria-label={v4("crtChart")}>
        <p className="c4-crt-kicker">{v4("crtChart")}</p>
        {FACES.map((name, index) => {
          const count = bars[index] || 0;
          const bar = Math.max(8, Math.round((count / widest) * 100));
          return (
            <button key={name} type="button" className="c4-crt-col" data-on={faceOn === name ? "1" : "0"} aria-pressed={faceOn === name} onClick={() => setFaceFilter(faceOn === name ? "all" : name)}>
              <span>{faceName(v4, name)}</span>
              <span className="c4-crt-bar" aria-hidden="true"><i style={{ width: `${bar}%` }} /></span>
              <span>{count}</span>
            </button>
          );
        })}
      </section>
      <div className="c4-crt-split">
        <form className="c4-crt-form" onSubmit={(event) => {
          event.preventDefault();
          if (viewer) return;
          const next = addCartouche(cards, { id: `crt-${Date.now()}`, title, note, clerk, slot, face, code, hue, rank, span });
          if (sameCards(next, cards)) return;
          store(next);
          clearDraft();
        }}>
          <label className="c4-lab">
            <span>{v4("crtLine")}</span>
            <input ref={titleRef} className="c4-field" aria-label={v4("crtLine")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              event.preventDefault();
              clearDraft();
            }} />
          </label>
          <label className="c4-lab">
            <span>{v4("crtNote")}</span>
            <input className="c4-field" aria-label={v4("crtNote")} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} />
          </label>
          <label className="c4-lab">
            <span>{v4("crtClerk")}</span>
            <input className="c4-field" aria-label={v4("crtClerk")} value={clerk} disabled={viewer} onChange={(event) => setClerk(event.target.value)} />
          </label>
          <p className="c4-meta" role="status">{v4("crtLoad")} {load}</p>
          <label className="c4-lab">
            <span>{v4("crtSlot")}</span>
            <input className="c4-field" inputMode="numeric" aria-label={v4("crtSlot")} value={slot} disabled={viewer} onChange={(event) => setSlot(event.target.value)} />
          </label>
          <label className="c4-lab">
            <span>{v4("crtFace")}</span>
            <select className="c4-select" aria-label={v4("crtFace")} value={face} disabled={viewer} onChange={(event) => setFace(event.target.value)}>
              <option value="">{v4("crtBlankFace")}</option>
              <option value="cut">{v4("crtFaceCut")}</option>
              <option value="gilt">{v4("crtFaceGilt")}</option>
              <option value="blind">{v4("crtFaceBlind")}</option>
            </select>
          </label>
          <label className="c4-lab">
            <span>{v4("crtCode")}</span>
            <input className="c4-field" aria-label={v4("crtCode")} value={code} disabled={viewer} onChange={(event) => setCode(event.target.value)} />
          </label>
          <label className="c4-lab">
            <span>{v4("crtHue")}</span>
            <select className="c4-select" aria-label={v4("crtHue")} value={hue} disabled={viewer} onChange={(event) => setHue(event.target.value)}>
              <option value="">{v4("crtBlankHue")}</option>
              <option value="mist">{v4("crtHueMist")}</option>
              <option value="sand">{v4("crtHueSand")}</option>
              <option value="pitch">{v4("crtHuePitch")}</option>
            </select>
          </label>
          <label className="c4-lab">
            <span>{v4("crtRank")}</span>
            <select className="c4-select" aria-label={v4("crtRank")} value={rank} disabled={viewer} onChange={(event) => setRank(event.target.value)}>
              <option value="">{v4("crtBlankRank")}</option>
              <option value="1">{v4("crtRank1")}</option>
              <option value="2">{v4("crtRank2")}</option>
              <option value="4">{v4("crtRank4")}</option>
            </select>
          </label>
          <label className="c4-lab">
            <span>{v4("crtSpan")}</span>
            <select className="c4-select" aria-label={v4("crtSpan")} value={span} disabled={viewer} onChange={(event) => setSpan(event.target.value)}>
              <option value="">{v4("crtBlankSpan")}</option>
              <option value="3">{v4("crtSpan3")}</option>
              <option value="6">{v4("crtSpan6")}</option>
              <option value="9">{v4("crtSpan9")}</option>
            </select>
          </label>
          <button type="submit" className="c4-btn c4-btn-hot" disabled={viewer}>{v4("crtAdd")}</button>
        </form>
        <div className="c4-crt-board">
          <div className="c4-row" role="tablist" aria-label={v4("crtCards")}>
            <button type="button" className="c4-chip" data-on={board === "cards" ? "1" : "0"} onClick={() => setBoard("cards")}>{v4("crtCards")}</button>
            <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard("timeline")}>{v4("crtTimeline")}</button>
            <button type="button" className="c4-chip" data-on={tray === "open" ? "1" : "0"} onClick={() => setTray("open")}>{v4("crtWaiting")}</button>
            <button type="button" className="c4-chip" data-on={tray === "stamped" ? "1" : "0"} onClick={() => setTray("stamped")}>{v4("crtStamped")}</button>
            <button type="button" className="c4-chip" data-on={tray === "filed" ? "1" : "0"} onClick={() => setTray("filed")}>{v4("crtFiled")}</button>
            <button type="button" className="c4-chip" data-on={pitchOnly ? "1" : "0"} aria-pressed={pitchOnly} onClick={() => setPitchOnly((value) => !value)}>{v4("crtPitchOnly")}</button>
          </div>
          <label className="c4-lab">
            <span>{v4("crtSearch")}</span>
            <input ref={searchRef} className="c4-field" aria-label={v4("crtSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              event.preventDefault();
              setQuery("");
            }} />
          </label>
          <label className="c4-lab">
            <span>{v4("crtDesk")}</span>
            <input className="c4-field" inputMode="numeric" aria-label={v4("crtDesk")} value={desk} onChange={(event) => setDesk(event.target.value)} />
          </label>
          <p className="c4-meta" role="status">{v4("crtNext")} {nextCard ? nextCard.title : v4("crtNextNone")}</p>
          <div className="c4-row">
            <label className="c4-lab">
              <span>{v4("crtClerks")}</span>
              <select className="c4-select" aria-label={v4("crtClerks")} value={clerkOn} onChange={(event) => setClerkFilter(event.target.value)}>
                <option value="all">{v4("crtAllClerks")}</option>
                <option value="blank">{v4("crtBlankClerk")}</option>
                {clerks.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>
            <label className="c4-lab">
              <span>{v4("crtFaces")}</span>
              <select className="c4-select" aria-label={v4("crtFaces")} value={faceOn} onChange={(event) => setFaceFilter(event.target.value)}>
                <option value="all">{v4("crtAllFaces")}</option>
                <option value="blank">{v4("crtBlankFace")}</option>
                {faces.map((name) => <option key={name} value={name}>{faceName(v4, name)}</option>)}
              </select>
            </label>
            <label className="c4-lab">
              <span>{v4("crtCodes")}</span>
              <select className="c4-select" aria-label={v4("crtCodes")} value={codeOn} onChange={(event) => setCodeFilter(event.target.value)}>
                <option value="all">{v4("crtAllCodes")}</option>
                <option value="blank">{v4("crtBlankCode")}</option>
                {codes.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>
            <label className="c4-lab">
              <span>{v4("crtHues")}</span>
              <select className="c4-select" aria-label={v4("crtHues")} value={hueOn} onChange={(event) => setHueFilter(event.target.value)}>
                <option value="all">{v4("crtAllHues")}</option>
                <option value="blank">{v4("crtBlankHue")}</option>
                {hues.map((name) => <option key={name} value={name}>{hueName(v4, name)}</option>)}
              </select>
            </label>
          </div>
          <div className="c4-row" role="group" aria-label={v4("crtSlots")}>
            <button type="button" className="c4-chip" data-on={slotOn === "all" ? "1" : "0"} onClick={() => setSlotFilter("all")}>{v4("crtAllSlots")}</button>
            {["blank", "early", "mid", "late", "peak", "quiet", "1", "2", "3", "4", "5", "6"].map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={slotOn === name ? "1" : "0"} onClick={() => setSlotFilter(slotOn === name ? "all" : name)}>{slotName(v4, name)}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("crtRanks")}>
            <button type="button" className="c4-chip" data-on={rankOn === "all" ? "1" : "0"} onClick={() => setRankFilter("all")}>{v4("crtAllRanks")}</button>
            {["blank", "1", "2", "4"].map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={rankOn === name ? "1" : "0"} onClick={() => setRankFilter(rankOn === name ? "all" : name)}>{name === "blank" ? v4("crtBlankRank") : rankName(v4, Number(name))}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("crtSpans")}>
            <button type="button" className="c4-chip" data-on={spanOn === "all" ? "1" : "0"} onClick={() => setSpanFilter("all")}>{v4("crtAllSpans")}</button>
            {["blank", "3", "6", "9"].map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={spanOn === name ? "1" : "0"} onClick={() => setSpanFilter(spanOn === name ? "all" : name)}>{name === "blank" ? v4("crtBlankSpan") : spanName(v4, Number(name))}</button>
            ))}
          </div>
          <form className="c4-row" onSubmit={(event) => {
            event.preventDefault();
            if (viewer) return;
            const next = addCartoucheView(views, {
              id: `view-${Date.now()}`,
              name: viewName,
              tray,
              query,
              clerk: clerkOn,
              face: faceOn,
              code: codeOn,
              hue: hueOn,
              slot: slotOn,
              rank: rankOn,
              span: spanOn,
            });
            if (next.length === views.length) return;
            storeViews(next);
            setViewName("");
          }}>
            <label className="c4-lab">
              <span>{v4("crtViews")}</span>
              <input className="c4-field" aria-label={v4("crtViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
            </label>
            <button type="submit" className="c4-btn" disabled={viewer}>{v4("crtSaveView")}</button>
          </form>
          <ul className="c4-crt-views" aria-label={v4("crtViews")}>
            {views.map((view) => (
              <li key={view.id}>
                <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropCartoucheView(views, view.id))}>{v4("crtDropView")}</button>
              </li>
            ))}
          </ul>
          <div className="c4-row">
            <button type="button" className="c4-btn" onClick={() => download("registry-cartouches.csv", cartouchesCsv(cards, desk))}>{v4("crtCsv")}</button>
            <button type="button" className="c4-btn" onClick={() => setPicked(shown.map((card) => card.id))}>{v4("crtPickAll")}</button>
            <button type="button" className="c4-btn" onClick={() => setPicked([])}>{v4("crtPickNone")}</button>
            <span className="c4-meta">{v4("crtPicked")} {picked.length}</span>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkCartouchePin(cards, targets, true))}>{v4("crtBulkPin")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkCartoucheFile(cards, targets, true))}>{v4("crtBulkFile")}</button>
            <label className="c4-lab">
              <span>{v4("crtBulkFace")}</span>
              <select className="c4-select" aria-label={v4("crtBulkFace")} value={moveFace} disabled={viewer} onChange={(event) => setMoveFace(event.target.value)}>
                <option value="cut">{v4("crtFaceCut")}</option>
                <option value="gilt">{v4("crtFaceGilt")}</option>
                <option value="blind">{v4("crtFaceBlind")}</option>
              </select>
            </label>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkCartoucheFace(cards, targets, moveFace))}>{v4("crtBulkFace")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(resetCartouches()); setPicked([]); }}>{v4("crtReset")}</button>
          </div>
          {!shown.length && board === "cards" && <p className="c4-crt-empty">{v4("crtEmpty")}</p>}
          {board === "cards" && (
            <ul className="c4-crt-cards">
              {shown.map((card) => {
                const band = slotBand(card.slot);
                const gap = gapLabel(v4, card.slot, desk);
                const late = lateCartouche(card, desk);
                const clashesOn = slotClashIds(cards, card.id);
                const ranksOn = rankClashIds(cards, card.id);
                const openEdit = editing === card.id;
                return (
                  <li key={card.id} data-face={faceOf(card.face)} data-hue={hueOf(card.hue)} data-pinned={card.pinned ? "1" : "0"}>
                    <label className="c4-row">
                      <input type="checkbox" checked={picked.includes(card.id)} onChange={() => togglePick(card.id)} aria-label={card.title} />
                      <span className="c4-crt-mark" aria-hidden="true">{slotLabel(card.slot)}</span>
                    </label>
                    <div>
                      {openEdit ? (
                        <form onSubmit={(event) => {
                          event.preventDefault();
                          if (viewer) return;
                          store(editCartoucheNote(editCartouche(cards, card.id, draft), card.id, noteDraft));
                          setEditing("");
                        }}>
                          <input className="c4-field" aria-label={v4("crtLine")} value={draft} onChange={(event) => setDraft(event.target.value)} />
                          <input className="c4-field" aria-label={v4("crtNote")} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} />
                          <button type="submit" className="c4-btn" disabled={viewer}>{v4("crtEdit")}</button>
                        </form>
                      ) : (
                        <>
                          <p>{card.title}</p>
                          <p className="c4-meta">{card.note}</p>
                        </>
                      )}
                      <p className="c4-meta">
                        {card.clerk || v4("crtBlankClerk")}
                        {" · "}
                        {faceName(v4, card.face)}
                        {" · "}
                        {card.code || v4("crtBlankCode")}
                        {" · "}
                        {hueName(v4, hueOf(card.hue))}
                        {" · "}
                        {rankName(v4, card.rank)}
                        {" · "}
                        {spanName(v4, card.span)}
                        {band === "blank" ? "" : ` · ${slotName(v4, band)}`}
                        {gap ? ` · ${gap}` : ""}
                        {late ? ` · ${v4("crtLate")}` : ""}
                        {soonCartouche(card) ? ` · ${v4("crtSoon")}` : ""}
                        {homeCode(card.code) ? ` · ${v4("crtHome")}` : ""}
                        {auditName(v4, card.audit) ? ` · ${v4("crtAudit")} ${auditName(v4, card.audit)}` : ""}
                        {" · "}
                        {clashesOn.length ? `${v4("crtClash")} ${clashesOn.length}` : v4("crtClashNone")}
                        {" · "}
                        {ranksOn.length ? `${v4("crtRankClash")} ${ranksOn.length}` : v4("crtRankClashNone")}
                      </p>
                    </div>
                    <div className="c4-row">
                      <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("crtCopied") : v4("crtCopy")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); setNoteDraft(card.note); }}>{v4("crtEdit")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleHue(cards, card.id))}>{v4("crtHueUp")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.pinned} onClick={() => store(setCartouchePin(cards, card.id, !card.pinned))}>{card.pinned ? v4("crtUnpin") : v4("crtPin")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.stamped} onClick={() => store(setCartoucheStamp(cards, card.id, !card.stamped))}>{card.stamped ? v4("crtLift") : v4("crtStampOn")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.filed} onClick={() => store(setCartoucheFiled(cards, card.id, !card.filed))}>{card.filed ? v4("crtRestore") : v4("crtFile")}</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {board === "timeline" && (
            <ol className="c4-crt-time">
              {timeline.map((card) => (
                <li key={card.id}>
                  <span className="c4-crt-clock">{slotLabel(card.slot)}</span>
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

export function RegistryMarks({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenBands, setHiddenBands] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [depth, setDepth] = useState("all");
  const [showHidden, setShowHidden] = useState(false);
  const [review, setReview] = useState<"all" | "reviewed" | "open">("all");
  const [shape, setShape] = useState<MarkShape>("all");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState("");
  const rows = useMemo(() => (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || "").trim(),
      note: row.registrationCountry,
    };
  }).filter((row): row is GlanceRow => Boolean(row)), [data.data]);
  const present = presentMarks(rows);
  const presentKey = present.join("\n");
  const presentIds = rows.map((row) => row.id);
  const idKey = presentIds.join("\n");
  const bandsOn = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of rows) {
      const state = markState(row.note);
      if (state === "") continue;
      const band = state === "set" ? markBand(row.note) : "";
      counts.set(band, (counts.get(band) || 0) + 1);
    }
    return ["", ...BANDS].map((band) => ({ band, count: counts.get(band) || 0 })).filter((line) => line.count);
  }, [rows]);
  const depthNames = ["plain", "pair", "stack", "cipher"].filter((name) => rows.some((row) => markDepth(row.note) === name));
  const bandNames = present.filter((band) => band !== "blank");
  const leadBand = leadingMark(rows);
  const leadDepth = leadingMarkDepth(rows);
  const odd = oddMarkCount(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const known = presentKey ? presentKey.split("\n") : [];
    const next = readHiddenMarks(readJson(MARK_KEY, []), known);
    setHiddenBands(next);
    writeJson(MARK_KEY, next);
  }, [loading, failed, presentKey]);
  useEffect(() => {
    if (loading || failed) return;
    const known = idKey ? idKey.split("\n") : [];
    const next = readReviewed(readJson(MARK_REVIEW_KEY, []), known);
    setReviewed(next);
    writeJson(MARK_REVIEW_KEY, next);
  }, [loading, failed, idKey]);
  const chips = visibleMarkBands(present, hiddenBands, showHidden);
  const depthOn = activeMarkDepth(depth, depthNames);
  const bandOn = selected ? activeMark(selected, bandNames) : "all";
  const shown = visibleMarkCustomers(
    rows,
    selected ? markArg(bandOn === "all" && selected === "blank" ? "blank" : bandOn) : null,
    markDepthArg(depthOn),
    query,
    review,
    reviewed,
    shape,
  );
  const widest = Math.max(1, ...bandsOn.map((line) => line.count));
  const setCount = rows.filter((row) => markState(row.note) === "set").length;
  const openCount = rows.filter((row) => !reviewed.includes(row.id)).length;

  function store(next: string[], clear: string) {
    setHiddenBands(next);
    writeJson(MARK_KEY, next);
    if (clear && selected === clear) setSelected("");
  }

  function storeReview(next: string[]) {
    setReviewed(next);
    writeJson(MARK_REVIEW_KEY, next);
  }

  function copyCode(row: GlanceRow) {
    const body = markCopy(row.note);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(row.id);
  }

  return (
    <section className="c4-rgt" aria-label={v4("rgtTitle")} data-marks="1">
      <header className="c4-rgt-head">
        <div>
          <p className="c4-crt-kicker">{v4("rgtSub")}</p>
          <h2 className="c4-title">{v4("rgtTitle")}</h2>
        </div>
        <p className="c4-crt-count">{v4("rgtRows")} {rows.length}</p>
      </header>
      <details className="c4-crt-rules">
        <summary>{v4("rgtRules")}</summary>
        <p className="c4-meta">{v4("rgtHint")}</p>
        <p className="c4-meta">{v4("rgtKept")}</p>
        <p className="c4-meta">{v4("rgtEscape")}</p>
      </details>
      <p className="c4-crt-notice" role="status">
        <span>{v4("rgtSetNotice")}</span>
        <span className="c4-crt-count">{setCount}</span>
      </p>
      <p className="c4-crt-notice" role="status">
        <span>{v4("rgtUnreviewed")}</span>
        <span className="c4-crt-count">{openCount}</span>
      </p>
      <p className="c4-crt-notice" role="status">
        <span>{v4("rgtOdd")}</span>
        <span className="c4-crt-count">{odd}</span>
        <button type="button" className="c4-btn" aria-pressed={shape === "odd"} onClick={() => setShape(shape === "odd" ? "all" : "odd")}>
          {shape === "odd" ? v4("rgtAllShapes") : v4("rgtOddOnly")}
        </button>
        <button type="button" className="c4-btn" aria-pressed={shape === "hash"} onClick={() => setShape(shape === "hash" ? "all" : "hash")}>{v4("rgtHash")}</button>
      </p>
      {leadBand ? <p className="c4-rgt-lead"><span>{v4("rgtLeadBand")}</span> {bandName(v4, leadBand)}</p> : null}
      {leadDepth ? <p className="c4-rgt-lead"><span>{v4("rgtLeadDepth")}</span> {depthName(v4, leadDepth)}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("rgtBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("registry-marks.csv", marksCsv(rows))}>{v4("rgtCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("registry-mark-rows.csv", markRowsCsv(rows, reviewed))}>{v4("rgtRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => storeReview(bulkReview(reviewed, shown.map((row) => row.id), presentIds, true))}>{v4("rgtBulkReview")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("rgtLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("rgtFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-crt-empty">{v4("rgtNone")}</p>}
      {bandsOn.length > 0 && (
        <section className="c4-rgt-chart" aria-label={v4("rgtAllBands")}>
          {bandsOn.map((line) => {
            const share = markShare(line.count, rows.length);
            const bar = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.band || "blank";
            return (
              <p key={name} className="c4-rgt-col" data-band={name}>
                <span>{bandName(v4, line.band)}</span>
                <span className="c4-crt-track" aria-hidden="true"><i style={{ width: `${bar}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("rgtShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      <div className="c4-row" role="group" aria-label={v4("rgtShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("rgtShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("rgtHidden")}</button>
      </div>
      <div className="c4-rgt-bands" role="group" aria-label={v4("rgtAllBands")}>
        <button type="button" className="c4-rgt-band" data-on={!selected ? "1" : "0"} aria-pressed={!selected} onClick={() => setSelected("")}>
          <span>{v4("rgtAllBands")}</span>
          <span className="c4-crt-count">{rows.length}</span>
        </button>
        {chips.map((item) => {
          const name = item || "blank";
          const count = bandsOn.find((line) => (line.band || "blank") === name)?.count || 0;
          return (
            <div key={name} className="c4-rgt-band" data-on={selected === name ? "1" : "0"}>
              <button type="button" aria-pressed={selected === name} onClick={() => setSelected(selected === name ? "" : name)}>
                <span>{bandName(v4, item)}</span>
                <span className="c4-crt-count">{count}</span>
              </button>
              <button type="button" className="c4-btn" onClick={() => store(toggleMark(hiddenBands, name, present), name)}>{showHidden ? v4("rgtShow") : v4("rgtHide")}</button>
            </div>
          );
        })}
      </div>
      <div className="c4-row" role="group" aria-label={v4("rgtDepths")}>
        <button type="button" className="c4-chip" data-on={depthOn === "all" ? "1" : "0"} aria-pressed={depthOn === "all"} onClick={() => setDepth("all")}>{v4("rgtAllDepths")}</button>
        {depthNames.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={depthOn === name ? "1" : "0"} aria-pressed={depthOn === name} onClick={() => setDepth(depthOn === name ? "all" : name)}>{depthName(v4, name)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("rgtShapes")}>
        <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} aria-pressed={review === "all"} onClick={() => setReview("all")}>{v4("rgtAllMarks")}</button>
        <button type="button" className="c4-chip" data-on={review === "open" ? "1" : "0"} aria-pressed={review === "open"} onClick={() => setReview("open")}>{v4("rgtOpenMarks")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} aria-pressed={review === "reviewed"} onClick={() => setReview("reviewed")}>{v4("rgtReviewed")}</button>
      </div>
      <label className="c4-lab">
        <span>{v4("rgtSearch")}</span>
        <input className="c4-field" aria-label={v4("rgtSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-crt-empty">{v4("rgtEmpty")}</p>}
      <ul className="c4-rgt-rows">
        {shown.map((row) => {
          const band = markBand(row.note);
          const deep = markDepth(row.note);
          const words = markWords(row.note);
          const seen = reviewed.includes(row.id);
          return (
            <li key={row.id} data-band={band || "blank"} data-reviewed={seen ? "1" : "0"}>
              <div>
                <p>{row.label || row.id}</p>
                <p className="c4-meta">{bandName(v4, band || (markState(row.note) === "clear" ? "blank" : ""))} · {depthName(v4, deep)} · {v4("rgtParts")} {words}</p>
              </div>
              <div className="c4-row">
                <button type="button" className="c4-btn" onClick={() => copyCode(row)}>{copied === row.id ? v4("rgtCopied") : v4("rgtCopy")}</button>
                <button type="button" className="c4-btn" aria-pressed={seen} onClick={() => storeReview(toggleReview(reviewed, row.id, presentIds))}>{v4("rgtReview")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
