"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  STEM_KEY,
  STEM_REVIEW_KEY,
  TRELLIS_KEY,
  TRELLIS_VIEW_KEY,
  activeBay,
  activeHeight,
  activeLean,
  activeSpan,
  activeStain,
  activeStem,
  activeStemDepth,
  activeWeave,
  activeWeaver,
  addTrellis,
  addTrellisView,
  bayArg,
  bulkReview,
  bulkTrellisPin,
  bulkTrellisStore,
  bulkTrellisWeave,
  clashHeightCount,
  cycleStain,
  dropTrellisView,
  editTrellis,
  editTrellisNote,
  heightArg,
  heightBand,
  heightClashIds,
  heightGap,
  heightTimeline,
  lateTrellis,
  leanArg,
  leanClashCount,
  leanClashIds,
  leadingStem,
  leadingStemDepth,
  nextTrellis,
  oddStemCount,
  presentStems,
  readHiddenStems,
  readReviewed,
  readTrellisViews,
  readTrellises,
  resetTrellises,
  setTrellisPin,
  setTrellisStored,
  setTrellisTrain,
  spanArg,
  stainArg,
  stainOf,
  stemArg,
  stemBand,
  stemCopy,
  stemDepth,
  stemDepthArg,
  stemDepths,
  stemDigits,
  stemRowsCsv,
  stemShare,
  stemState,
  stemsCsv,
  suggestSpan,
  suggestWeave,
  suggestWeaver,
  toggleReview,
  toggleStem,
  trellisBays,
  trellisCopy,
  trellisCounts,
  trellisShare,
  trellisStains,
  trellisWeavers,
  trellisWeaves,
  trellisesCsv,
  usedHeights,
  visibleStemBands,
  visibleStemCustomers,
  visibleTrellises,
  weaveArg,
  weaveCounts,
  weaveOf,
  weaverArg,
  weaverLoad,
  type StemRow,
  type StemShape,
  type Trellis,
  type TrellisStain,
  type TrellisTray,
  type TrellisView,
  type TrellisWeave,
} from "@/lib/crmv4/round175";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  phone?: string | null;
};

type GlanceRow = StemRow & { id: string };

const WEAVES = ["plain", "twist", "braid"] as const;
const BANDS = ["short", "local", "trunk", "long"] as const;

function weaveName(v4: V4, weave: TrellisWeave | string): string {
  if (weave === "plain") return v4("wtrWeavePlain");
  if (weave === "twist") return v4("wtrWeaveTwist");
  if (weave === "braid") return v4("wtrWeaveBraid");
  return v4("wtrBlankWeave");
}

function stainName(v4: V4, stain: TrellisStain): string {
  if (stain === "mist") return v4("wtrMist");
  if (stain === "honey") return v4("wtrHoney");
  if (stain === "ink") return v4("wtrInk");
  return v4("wtrBlankStain");
}

function heightName(v4: V4, name: string): string {
  if (name === "low") return v4("wtrLow");
  if (name === "mid") return v4("wtrMid");
  if (name === "high") return v4("wtrHigh");
  if (name === "tip") return v4("wtrTip");
  if (name === "cane") return v4("wtrCane");
  if (/^[1-8]$/.test(name)) return name;
  return v4("wtrBlankHeight");
}

function leanName(v4: V4, lean: number | null): string {
  if (lean === 1) return v4("wtrLean1");
  if (lean === 2) return v4("wtrLean2");
  if (lean === 3) return v4("wtrLean3");
  if (lean === 4) return v4("wtrLean4");
  return v4("wtrBlankLean");
}

function spanName(v4: V4, span: number | null): string {
  if (span === 4) return v4("wtrSpan4");
  if (span === 8) return v4("wtrSpan8");
  if (span === 16) return v4("wtrSpan16");
  if (span === 32) return v4("wtrSpan32");
  return v4("wtrBlankSpan");
}

function bandName(v4: V4, name: string): string {
  if (name === "short") return v4("pstShort");
  if (name === "local") return v4("pstLocal");
  if (name === "trunk") return v4("pstTrunk");
  if (name === "long") return v4("pstLong");
  if (name === "blank") return v4("pstClear");
  return v4("pstUnmarked");
}

function depthName(v4: V4, name: string): string {
  if (name === "near") return v4("pstNear");
  if (name === "mid") return v4("pstMid");
  if (name === "far") return v4("pstFar");
  return v4("pstUnmarked");
}

function auditName(v4: V4, audit: string): string {
  const key = {
    save: "wtrAuditSave",
    edit: "wtrAuditEdit",
    stain: "wtrAuditStain",
    pin: "wtrAuditPin",
    unpin: "wtrAuditUnpin",
    train: "wtrAuditTrain",
    release: "wtrAuditRelease",
    store: "wtrAuditStore",
    restore: "wtrAuditRestore",
    shift: "wtrAuditShift",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function heightLabel(height: number | null): string {
  return height === null ? "—" : String(height);
}

function gapLabel(v4: V4, height: number | null, desk: string): string {
  const gap = heightGap(height, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("wtrPast")} ${gap}`;
  if (gap < 0) return `${v4("wtrAhead")} ${Math.abs(gap)}`;
  return v4("wtrDue");
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

function sameCards(left: readonly Trellis[], right: readonly Trellis[]): boolean {
  return left.length === right.length && left.every((card, index) => card.id === right[index]?.id && card.title === right[index]?.title && card.note === right[index]?.note && card.audit === right[index]?.audit);
}

export function WinterTrellises({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<Trellis[]>([]);
  const [views, setViews] = useState<TrellisView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [weaver, setWeaver] = useState("");
  const [height, setHeight] = useState("");
  const [weave, setWeave] = useState("");
  const [bay, setBay] = useState("");
  const [stain, setStain] = useState("");
  const [lean, setLean] = useState("");
  const [span, setSpan] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<TrellisTray>("open");
  const [weaverFilter, setWeaverFilter] = useState("all");
  const [weaveFilter, setWeaveFilter] = useState("all");
  const [bayFilter, setBayFilter] = useState("all");
  const [stainFilter, setStainFilter] = useState("all");
  const [heightFilter, setHeightFilter] = useState("all");
  const [leanFilter, setLeanFilter] = useState("all");
  const [spanFilter, setSpanFilter] = useState("all");
  const [inkOnly, setInkOnly] = useState(false);
  const [tipOnly, setTipOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [desk, setDesk] = useState("");
  const [moveWeave, setMoveWeave] = useState("plain");
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readTrellises(readJson(TRELLIS_KEY, []));
    const saved = readTrellisViews(readJson(TRELLIS_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(TRELLIS_KEY, next);
    writeJson(TRELLIS_VIEW_KEY, saved);
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
  const weavers = trellisWeavers(cards);
  const weaves = trellisWeaves(cards);
  const bays = trellisBays(cards);
  const stains = trellisStains(cards);
  const bars = weaveCounts(cards);
  const weaverOn = activeWeaver(weaverFilter, weavers);
  const weaveOn = activeWeave(weaveFilter, WEAVES);
  const bayOn = activeBay(bayFilter, bays);
  const stainOn = activeStain(stainFilter, stains);
  const heightOn = activeHeight(heightFilter);
  const leanOn = activeLean(leanFilter);
  const spanOn = activeSpan(spanFilter);
  const pickedHeight = heightArg(heightOn);
  const shown = visibleTrellises(
    cards,
    tray,
    query,
    weaverArg(weaverOn),
    weaveArg(weaveOn),
    bayArg(bayOn),
    stainArg(stainOn),
    pickedHeight.exact,
    pickedHeight.pick,
    leanArg(leanOn),
    spanArg(spanOn),
    inkOnly,
    tipOnly,
  );
  const timeline = heightTimeline(cards, query);
  const counts = trellisCounts(cards, desk);
  const clashes = clashHeightCount(cards);
  const leans = leanClashCount(cards);
  const spanUse = usedHeights(cards);
  const total = cards.length;
  const nextId = nextTrellis(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const widest = Math.max(1, ...bars);
  const pinned = cards.filter((card) => card.pinned);
  const load = weaverLoad(cards, weaver);
  const suggested = suggestWeave(cards);
  const lightWeaver = suggestWeaver(cards);
  const quietSpan = suggestSpan(cards);
  const targets = picked.length ? picked : shown.map((card) => card.id);

  function store(next: Trellis[]) {
    setCards(next);
    writeJson(TRELLIS_KEY, next);
  }

  function storeViews(next: TrellisView[]) {
    setViews(next);
    writeJson(TRELLIS_VIEW_KEY, next);
  }

  function clearDraft() {
    setTitle("");
    setNote("");
    setWeaver("");
    setHeight("");
    setWeave("");
    setBay("");
    setStain("");
    setLean("");
    setSpan("");
  }

  function copyCard(card: Trellis) {
    const body = trellisCopy(card.title);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(card.id);
  }

  function applyView(view: TrellisView) {
    setTray(view.tray);
    setQuery(view.query);
    setWeaverFilter(activeWeaver(view.weaver, trellisWeavers(cards)));
    setWeaveFilter(activeWeave(view.weave, WEAVES));
    setBayFilter(activeBay(view.bay, trellisBays(cards)));
    setStainFilter(activeStain(view.stain, trellisStains(cards)));
    setHeightFilter(activeHeight(view.height));
    setLeanFilter(activeLean(view.lean));
    setSpanFilter(activeSpan(view.span));
    setBoard("cards");
    setInkOnly(false);
    setTipOnly(false);
  }

  function togglePick(id: string) {
    setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <section className="c4-wtr" aria-label={v4("wtrTitle")} data-trellises="1" data-role={role}>
      <header className="c4-wtr-head">
        <p className="c4-wtr-plate" data-logo="mono">{v4("wtrLogo")}</p>
        <div>
          <p className="c4-wtr-kicker">{v4("wtrSub")}</p>
          <h2 className="c4-title">{v4("wtrTitle")}</h2>
        </div>
        <p className="c4-wtr-count">{shown.length}</p>
      </header>
      <details className="c4-wtr-rules">
        <summary>{v4("wtrRules")}</summary>
        <p className="c4-meta">{v4("wtrHint")}</p>
        <p className="c4-meta">{v4("wtrLocal")}</p>
        <p className="c4-meta">{v4("wtrBlank")}</p>
        <p className="c4-meta">{v4("wtrWeaverBlank")}</p>
        <p className="c4-meta">{v4("wtrHeightBlank")}</p>
        <p className="c4-meta">{v4("wtrWeaveBlank")}</p>
        <p className="c4-meta">{v4("wtrBayBlank")}</p>
        <p className="c4-meta">{v4("wtrStainBlank")}</p>
        <p className="c4-meta">{v4("wtrLeanBlank")}</p>
        <p className="c4-meta">{v4("wtrSpanBlank")}</p>
        <p className="c4-meta">{v4("wtrNoteBlank")}</p>
        <p className="c4-meta">{v4("wtrEscape")}</p>
        <p className="c4-meta">{v4("wtrSlash")}</p>
        <p className="c4-meta">{v4("wtrNew")}</p>
      </details>
      {viewer ? <p className="c4-wtr-notice" role="status">{v4("wtrViewer")}</p> : null}
      <p className="c4-wtr-notice" role="status">
        <span>{v4("wtrNotice")}</span>
        <span className="c4-wtr-count">{counts.tip}</span>
        <button type="button" className="c4-btn" aria-pressed={tipOnly} onClick={() => { setTipOnly((value) => !value); setTray("open"); }}>
          {tipOnly ? v4("wtrNoticeAll") : v4("wtrNoticeTip")}
        </button>
      </p>
      <p className="c4-wtr-notice" role="status">
        <span>{v4("wtrLate")}</span>
        <span className="c4-wtr-count">{counts.late}</span>
      </p>
      <p className="c4-wtr-notice" role="status">
        <span>{v4("wtrSoon")}</span>
        <span className="c4-wtr-count">{counts.soon}</span>
      </p>
      <p className="c4-wtr-notice" role="status">
        <span>{v4("wtrSpanUse")}</span>
        <span className="c4-wtr-count">{spanUse}</span>
      </p>
      <p className="c4-wtr-notice" role="status">
        <span>{v4("wtrClash")}</span>
        <span className="c4-wtr-count">{clashes}</span>
      </p>
      <p className="c4-wtr-notice" role="status">
        <span>{v4("wtrLeanClash")}</span>
        <span className="c4-wtr-count">{leans}</span>
      </p>
      <p className="c4-wtr-suggest" role="status">
        <span>{v4("wtrSuggest")}</span> {weaveName(v4, suggested)}
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setWeave(suggested)}>{v4("wtrUseWeave")}</button>
      </p>
      <p className="c4-wtr-suggest" role="status">
        <span>{v4("wtrSuggestWeaver")}</span> {lightWeaver || v4("wtrBlankWeaver")}
        <button type="button" className="c4-btn" disabled={viewer || !lightWeaver} onClick={() => setWeaver(lightWeaver)}>{v4("wtrUseWeaver")}</button>
      </p>
      <p className="c4-wtr-suggest" role="status">
        <span>{v4("wtrSuggestSpan")}</span> {spanName(v4, quietSpan)}
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setSpan(String(quietSpan))}>{v4("wtrUseSpan")}</button>
      </p>
      {pinned.length > 0 && (
        <ul className="c4-wtr-pins" aria-label={v4("wtrPinned")}>
          {pinned.map((card) => (
            <li key={card.id}><span className="c4-wtr-mark" aria-hidden="true">{heightLabel(card.height)}</span> {card.title}</li>
          ))}
        </ul>
      )}
      <section className="c4-wtr-kpi" aria-label={v4("wtrKpi")}>
        {(["open", "trained", "stored"] as const).map((key) => {
          const count = counts[key];
          const share = trellisShare(count, total);
          const label = key === "open" ? v4("wtrWaiting") : key === "trained" ? v4("wtrTrained") : v4("wtrStored");
          return (
            <p key={key} className="c4-wtr-meter" data-tray={key}>
              <span>{label}</span>
              <span className="c4-wtr-count">{count}</span>
              <span>{v4("wtrShare")} {share}%</span>
              <span className="c4-wtr-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <section className="c4-wtr-chart" aria-label={v4("wtrChart")}>
        <p className="c4-wtr-kicker">{v4("wtrChart")}</p>
        {WEAVES.map((name, index) => {
          const count = bars[index] || 0;
          const width = Math.max(8, Math.round((count / widest) * 100));
          return (
            <button key={name} type="button" className="c4-wtr-col" data-on={weaveOn === name ? "1" : "0"} aria-pressed={weaveOn === name} onClick={() => setWeaveFilter(weaveOn === name ? "all" : name)}>
              <span>{weaveName(v4, name)}</span>
              <span className="c4-wtr-bar" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
              <span>{count}</span>
            </button>
          );
        })}
      </section>
      <div className="c4-wtr-split">
        <form className="c4-wtr-form" onSubmit={(event) => {
          event.preventDefault();
          if (viewer) return;
          const next = addTrellis(cards, { id: `wtr-${Date.now()}`, title, note, weaver, height, weave, bay, stain, lean, span });
          if (sameCards(next, cards)) return;
          store(next);
          clearDraft();
        }}>
          <label className="c4-lab">
            <span>{v4("wtrLine")}</span>
            <input ref={titleRef} className="c4-field" aria-label={v4("wtrLine")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              event.preventDefault();
              clearDraft();
            }} />
          </label>
          <label className="c4-lab">
            <span>{v4("wtrNote")}</span>
            <input className="c4-field" aria-label={v4("wtrNote")} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} />
          </label>
          <label className="c4-lab">
            <span>{v4("wtrWeaver")}</span>
            <input className="c4-field" aria-label={v4("wtrWeaver")} value={weaver} disabled={viewer} onChange={(event) => setWeaver(event.target.value)} />
          </label>
          <p className="c4-meta" role="status">{v4("wtrLoad")} {load}</p>
          <label className="c4-lab">
            <span>{v4("wtrHeight")}</span>
            <input className="c4-field" inputMode="numeric" aria-label={v4("wtrHeight")} value={height} disabled={viewer} onChange={(event) => setHeight(event.target.value)} />
          </label>
          <label className="c4-lab">
            <span>{v4("wtrWeave")}</span>
            <select className="c4-select" aria-label={v4("wtrWeave")} value={weave} disabled={viewer} onChange={(event) => setWeave(event.target.value)}>
              <option value="">{v4("wtrBlankWeave")}</option>
              <option value="plain">{v4("wtrWeavePlain")}</option>
              <option value="twist">{v4("wtrWeaveTwist")}</option>
              <option value="braid">{v4("wtrWeaveBraid")}</option>
            </select>
          </label>
          <label className="c4-lab">
            <span>{v4("wtrBay")}</span>
            <input className="c4-field" aria-label={v4("wtrBay")} value={bay} disabled={viewer} onChange={(event) => setBay(event.target.value)} />
          </label>
          <label className="c4-lab">
            <span>{v4("wtrStain")}</span>
            <select className="c4-select" aria-label={v4("wtrStain")} value={stain} disabled={viewer} onChange={(event) => setStain(event.target.value)}>
              <option value="">{v4("wtrBlankStain")}</option>
              <option value="mist">{v4("wtrMist")}</option>
              <option value="honey">{v4("wtrHoney")}</option>
              <option value="ink">{v4("wtrInk")}</option>
            </select>
          </label>
          <label className="c4-lab">
            <span>{v4("wtrLean")}</span>
            <select className="c4-select" aria-label={v4("wtrLean")} value={lean} disabled={viewer} onChange={(event) => setLean(event.target.value)}>
              <option value="">{v4("wtrBlankLean")}</option>
              <option value="1">{v4("wtrLean1")}</option>
              <option value="2">{v4("wtrLean2")}</option>
              <option value="3">{v4("wtrLean3")}</option>
              <option value="4">{v4("wtrLean4")}</option>
            </select>
          </label>
          <label className="c4-lab">
            <span>{v4("wtrSpan")}</span>
            <select className="c4-select" aria-label={v4("wtrSpan")} value={span} disabled={viewer} onChange={(event) => setSpan(event.target.value)}>
              <option value="">{v4("wtrBlankSpan")}</option>
              <option value="4">{v4("wtrSpan4")}</option>
              <option value="8">{v4("wtrSpan8")}</option>
              <option value="16">{v4("wtrSpan16")}</option>
              <option value="32">{v4("wtrSpan32")}</option>
            </select>
          </label>
          <button type="submit" className="c4-btn" disabled={viewer}>{v4("wtrAdd")}</button>
        </form>
        <div className="c4-wtr-board">
          <div className="c4-row" role="group" aria-label={v4("wtrTitle")}>
            <button type="button" className="c4-chip" data-on={tray === "open" ? "1" : "0"} aria-pressed={tray === "open"} onClick={() => setTray("open")}>{v4("wtrWaiting")}</button>
            <button type="button" className="c4-chip" data-on={tray === "trained" ? "1" : "0"} aria-pressed={tray === "trained"} onClick={() => setTray("trained")}>{v4("wtrTrained")}</button>
            <button type="button" className="c4-chip" data-on={tray === "stored" ? "1" : "0"} aria-pressed={tray === "stored"} onClick={() => setTray("stored")}>{v4("wtrStored")}</button>
            <button type="button" className="c4-chip" data-on={board === "cards" ? "1" : "0"} aria-pressed={board === "cards"} onClick={() => setBoard("cards")}>{v4("wtrCards")}</button>
            <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard("timeline")}>{v4("wtrTimeline")}</button>
            <button type="button" className="c4-chip" data-on={inkOnly ? "1" : "0"} aria-pressed={inkOnly} onClick={() => setInkOnly((value) => !value)}>{v4("wtrInkOnly")}</button>
            <button type="button" className="c4-chip" data-on={tipOnly ? "1" : "0"} aria-pressed={tipOnly} onClick={() => { setTipOnly((value) => !value); setTray("open"); }}>{v4("wtrTipOnly")}</button>
            <button type="button" className="c4-btn" onClick={() => download("winter-trellises.csv", trellisesCsv(cards, desk))}>{v4("wtrCsv")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setPicked(shown.map((card) => card.id))}>{v4("wtrPickAll")}</button>
            <button type="button" className="c4-btn" onClick={() => setPicked([])}>{v4("wtrPickNone")}</button>
            <span className="c4-wtr-count">{v4("wtrPicked")} {picked.length}</span>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkTrellisPin(cards, targets, true))}>{v4("wtrBulkPin")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkTrellisStore(cards, targets, true))}>{v4("wtrBulkStore")}</button>
            <label className="c4-lab">
              <span>{v4("wtrBulkWeave")}</span>
              <select className="c4-select" aria-label={v4("wtrBulkWeave")} value={moveWeave} disabled={viewer} onChange={(event) => setMoveWeave(event.target.value)}>
                <option value="plain">{v4("wtrWeavePlain")}</option>
                <option value="twist">{v4("wtrWeaveTwist")}</option>
                <option value="braid">{v4("wtrWeaveBraid")}</option>
              </select>
            </label>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkTrellisWeave(cards, targets, moveWeave))}>{v4("wtrBulkWeave")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(resetTrellises()); setPicked([]); }}>{v4("wtrReset")}</button>
          </div>
          <label className="c4-lab">
            <span>{v4("wtrSearch")}</span>
            <input ref={searchRef} className="c4-field" aria-label={v4("wtrSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              event.preventDefault();
              setQuery("");
            }} />
          </label>
          <label className="c4-lab">
            <span>{v4("wtrDesk")}</span>
            <input className="c4-field" inputMode="numeric" aria-label={v4("wtrDesk")} value={desk} onChange={(event) => setDesk(event.target.value)} />
          </label>
          <p className="c4-meta" role="status">
            {v4("wtrNext")} {nextCard ? nextCard.title : v4("wtrNextNone")}
          </p>
          <div className="c4-row" role="group" aria-label={v4("wtrWeavers")}>
            <button type="button" className="c4-chip" data-on={weaverOn === "all" ? "1" : "0"} aria-pressed={weaverOn === "all"} onClick={() => setWeaverFilter("all")}>{v4("wtrAllWeavers")}</button>
            <button type="button" className="c4-chip" data-on={weaverOn === "blank" ? "1" : "0"} aria-pressed={weaverOn === "blank"} onClick={() => setWeaverFilter("blank")}>{v4("wtrBlankWeaver")}</button>
            {weavers.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={weaverOn === name ? "1" : "0"} aria-pressed={weaverOn === name} onClick={() => setWeaverFilter(name)}>{name}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("wtrWeaves")}>
            <button type="button" className="c4-chip" data-on={weaveOn === "all" ? "1" : "0"} aria-pressed={weaveOn === "all"} onClick={() => setWeaveFilter("all")}>{v4("wtrAllWeaves")}</button>
            <button type="button" className="c4-chip" data-on={weaveOn === "blank" ? "1" : "0"} aria-pressed={weaveOn === "blank"} onClick={() => setWeaveFilter("blank")}>{v4("wtrBlankWeave")}</button>
            {weaves.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={weaveOn === name ? "1" : "0"} aria-pressed={weaveOn === name} onClick={() => setWeaveFilter(name)}>{weaveName(v4, name)}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("wtrBays")}>
            <button type="button" className="c4-chip" data-on={bayOn === "all" ? "1" : "0"} aria-pressed={bayOn === "all"} onClick={() => setBayFilter("all")}>{v4("wtrAllBays")}</button>
            <button type="button" className="c4-chip" data-on={bayOn === "blank" ? "1" : "0"} aria-pressed={bayOn === "blank"} onClick={() => setBayFilter("blank")}>{v4("wtrBlankBay")}</button>
            {bays.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={bayOn === name ? "1" : "0"} aria-pressed={bayOn === name} onClick={() => setBayFilter(name)}>{name}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("wtrStains")}>
            <button type="button" className="c4-chip" data-on={stainOn === "all" ? "1" : "0"} aria-pressed={stainOn === "all"} onClick={() => setStainFilter("all")}>{v4("wtrAllStains")}</button>
            <button type="button" className="c4-chip" data-on={stainOn === "blank" ? "1" : "0"} aria-pressed={stainOn === "blank"} onClick={() => setStainFilter("blank")}>{v4("wtrBlankStain")}</button>
            {stains.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={stainOn === name ? "1" : "0"} aria-pressed={stainOn === name} onClick={() => setStainFilter(name)}>{stainName(v4, name)}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("wtrHeights")}>
            {(["all", "blank", "low", "mid", "high", "tip", "cane"] as const).map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={heightOn === name ? "1" : "0"} aria-pressed={heightOn === name} onClick={() => setHeightFilter(name)}>
                {name === "all" ? v4("wtrAllHeights") : heightName(v4, name)}
              </button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("wtrLeans")}>
            {(["all", "blank", "1", "2", "3", "4"] as const).map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={leanOn === name ? "1" : "0"} aria-pressed={leanOn === name} onClick={() => setLeanFilter(name)}>
                {name === "all" ? v4("wtrAllLeans") : name === "blank" ? v4("wtrBlankLean") : leanName(v4, Number(name))}
              </button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("wtrSpans")}>
            {(["all", "blank", "4", "8", "16", "32"] as const).map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={spanOn === name ? "1" : "0"} aria-pressed={spanOn === name} onClick={() => setSpanFilter(name)}>
                {name === "all" ? v4("wtrAllSpans") : name === "blank" ? v4("wtrBlankSpan") : spanName(v4, Number(name))}
              </button>
            ))}
          </div>
          <form className="c4-row" onSubmit={(event) => {
            event.preventDefault();
            if (viewer) return;
            const next = addTrellisView(views, {
              id: `view-${Date.now()}`,
              name: viewName,
              tray,
              query,
              weaver: weaverOn,
              weave: weaveOn,
              bay: bayOn,
              stain: stainOn,
              height: heightOn,
              lean: leanOn,
              span: spanOn,
            });
            if (next.length === views.length) return;
            storeViews(next);
            setViewName("");
          }}>
            <label className="c4-lab">
              <span>{v4("wtrViewName")}</span>
              <input className="c4-field" aria-label={v4("wtrViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
            </label>
            <button type="submit" className="c4-btn" disabled={viewer}>{v4("wtrSaveView")}</button>
          </form>
          <section aria-label={v4("wtrViews")}>
            <p className="c4-wtr-kicker">{v4("wtrViews")}</p>
            {!views.length && <p className="c4-wtr-empty">{v4("wtrViewEmpty")}</p>}
            <ul className="c4-wtr-views">
              {views.map((view) => (
                <li key={view.id}>
                  <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropTrellisView(views, view.id))}>{v4("wtrDropView")}</button>
                </li>
              ))}
            </ul>
          </section>
          {board === "cards" && !shown.length && <p className="c4-wtr-empty">{v4("wtrEmpty")}</p>}
          {board === "cards" && (
            <ul className="c4-wtr-rows">
              {shown.map((card) => {
                const clashesOn = heightClashIds(cards, card.id);
                const leansOn = leanClashIds(cards, card.id);
                const gap = gapLabel(v4, card.height, desk);
                const band = heightBand(card.height);
                const editingCard = editing === card.id;
                const late = lateTrellis(card, desk);
                return (
                  <li key={card.id} data-stain={card.stain || "blank"} data-weave={card.weave || "blank"} data-late={late ? "1" : "0"}>
                    <span className="c4-wtr-mark" aria-hidden="true">{heightLabel(card.height)}</span>
                    <div>
                      <label className="c4-wtr-pick">
                        <input type="checkbox" checked={picked.includes(card.id)} aria-label={v4("wtrPick")} onChange={() => togglePick(card.id)} />
                        <span>{v4("wtrPick")}</span>
                      </label>
                      {editingCard ? (
                        <form className="c4-row" onSubmit={(event) => {
                          event.preventDefault();
                          if (viewer) return;
                          const titled = editTrellis(cards, card.id, draft);
                          store(editTrellisNote(titled, card.id, noteDraft));
                          setEditing("");
                        }}>
                          <input className="c4-field" aria-label={v4("wtrEdit")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                          <input className="c4-field" aria-label={v4("wtrNote")} value={noteDraft} disabled={viewer} onChange={(event) => setNoteDraft(event.target.value)} />
                          <button type="submit" className="c4-btn" disabled={viewer}>{v4("wtrSaveEdit")}</button>
                        </form>
                      ) : (
                        <>
                          <p>{card.title}</p>
                          {card.note ? <p className="c4-meta">{card.note}</p> : null}
                        </>
                      )}
                      <p className="c4-meta">
                        {card.weaver || v4("wtrBlankWeaver")}
                        {" · "}
                        {heightLabel(card.height)}
                        {" · "}
                        {weaveName(v4, weaveOf(card.weave))}
                        {" · "}
                        {card.bay || v4("wtrBlankBay")}
                        {" · "}
                        {stainName(v4, stainOf(card.stain))}
                        {" · "}
                        {leanName(v4, card.lean)}
                        {" · "}
                        {spanName(v4, card.span)}
                        {band === "blank" ? "" : ` · ${heightName(v4, band)}`}
                        {gap ? ` · ${gap}` : ""}
                        {late ? ` · ${v4("wtrLate")}` : ""}
                        {card.span === 4 && !card.trained && !card.stored ? ` · ${v4("wtrSoon")}` : ""}
                        {auditName(v4, card.audit) ? ` · ${v4("wtrAudit")} ${auditName(v4, card.audit)}` : ""}
                        {" · "}
                        {clashesOn.length ? `${v4("wtrClash")} ${clashesOn.length}` : v4("wtrClashNone")}
                        {" · "}
                        {leansOn.length ? `${v4("wtrLeanClash")} ${leansOn.length}` : v4("wtrLeanClashNone")}
                      </p>
                    </div>
                    <div className="c4-row">
                      <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("wtrCopied") : v4("wtrCopy")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); setNoteDraft(card.note); }}>{v4("wtrEdit")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleStain(cards, card.id))}>{v4("wtrStainUp")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.pinned} onClick={() => store(setTrellisPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("wtrUnpin") : v4("wtrPin")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.trained} onClick={() => store(setTrellisTrain(cards, card.id, !card.trained))}>{card.trained ? v4("wtrRelease") : v4("wtrTrainOn")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.stored} onClick={() => store(setTrellisStored(cards, card.id, !card.stored))}>{card.stored ? v4("wtrRestore") : v4("wtrStore")}</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {board === "timeline" && (
            <ol className="c4-wtr-time">
              {timeline.map((card) => (
                <li key={card.id}>
                  <span className="c4-wtr-clock">{heightLabel(card.height)}</span>
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

export function PhoneStems({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenBands, setHiddenBands] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [depth, setDepth] = useState("all");
  const [showHidden, setShowHidden] = useState(false);
  const [review, setReview] = useState<"all" | "reviewed" | "open">("all");
  const [shape, setShape] = useState<StemShape>("all");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState("");
  const rows = useMemo(() => (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || "").trim(),
      note: row.phone,
    };
  }).filter((row): row is GlanceRow => Boolean(row)), [data.data]);
  const present = presentStems(rows);
  const presentKey = present.join("\n");
  const presentIds = rows.map((row) => row.id);
  const idKey = presentIds.join("\n");
  const bandsOn = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of rows) {
      const state = stemState(row.note);
      if (state === "") continue;
      const band = state === "set" ? stemBand(row.note) : "";
      counts.set(band, (counts.get(band) || 0) + 1);
    }
    return ["", ...BANDS].map((band) => ({ band, count: counts.get(band) || 0 })).filter((line) => line.count);
  }, [rows]);
  const depthNames = stemDepths(rows).map((line) => line.depth).filter(Boolean);
  const bandNames = present.filter((band) => band !== "blank");
  const leadBand = leadingStem(rows);
  const leadDepth = leadingStemDepth(rows);
  const odd = oddStemCount(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const known = presentKey ? presentKey.split("\n") : [];
    const next = readHiddenStems(readJson(STEM_KEY, []), known);
    setHiddenBands(next);
    writeJson(STEM_KEY, next);
  }, [loading, failed, presentKey]);
  useEffect(() => {
    if (loading || failed) return;
    const known = idKey ? idKey.split("\n") : [];
    const next = readReviewed(readJson(STEM_REVIEW_KEY, []), known);
    setReviewed(next);
    writeJson(STEM_REVIEW_KEY, next);
  }, [loading, failed, idKey]);
  const chips = visibleStemBands(present, hiddenBands, showHidden);
  const depthOn = activeStemDepth(depth, depthNames);
  const bandOn = selected ? activeStem(selected, bandNames) : "all";
  const shown = visibleStemCustomers(
    rows,
    selected ? stemArg(bandOn === "all" && selected === "blank" ? "blank" : bandOn) : null,
    stemDepthArg(depthOn),
    query,
    review,
    reviewed,
    shape,
  );
  const widest = Math.max(1, ...bandsOn.map((line) => line.count));
  const setCount = rows.filter((row) => stemState(row.note) === "set").length;
  const openCount = rows.filter((row) => !reviewed.includes(row.id)).length;

  function store(next: string[], clear: string) {
    setHiddenBands(next);
    writeJson(STEM_KEY, next);
    if (clear && selected === clear) setSelected("");
  }

  function storeReview(next: string[]) {
    setReviewed(next);
    writeJson(STEM_REVIEW_KEY, next);
  }

  function copyCode(row: GlanceRow) {
    const body = stemCopy(row.note);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(row.id);
  }

  return (
    <section className="c4-pst" aria-label={v4("pstTitle")} data-stems="1">
      <header className="c4-pst-head">
        <div>
          <p className="c4-wtr-kicker">{v4("pstSub")}</p>
          <h2 className="c4-title">{v4("pstTitle")}</h2>
        </div>
        <p className="c4-wtr-count">{v4("pstRows")} {rows.length}</p>
      </header>
      <details className="c4-wtr-rules">
        <summary>{v4("pstRules")}</summary>
        <p className="c4-meta">{v4("pstHint")}</p>
        <p className="c4-meta">{v4("pstKept")}</p>
        <p className="c4-meta">{v4("pstEscape")}</p>
      </details>
      <p className="c4-wtr-notice" role="status">
        <span>{v4("pstSetNotice")}</span>
        <span className="c4-wtr-count">{setCount}</span>
      </p>
      <p className="c4-wtr-notice" role="status">
        <span>{v4("pstUnreviewed")}</span>
        <span className="c4-wtr-count">{openCount}</span>
      </p>
      <p className="c4-wtr-notice" role="status">
        <span>{v4("pstOdd")}</span>
        <span className="c4-wtr-count">{odd}</span>
        <button type="button" className="c4-btn" aria-pressed={shape === "odd"} onClick={() => setShape(shape === "odd" ? "all" : "odd")}>
          {shape === "odd" ? v4("pstAllShapes") : v4("pstOddOnly")}
        </button>
        <button type="button" className="c4-btn" aria-pressed={shape === "plus"} onClick={() => setShape(shape === "plus" ? "all" : "plus")}>{v4("pstPlus")}</button>
      </p>
      {leadBand ? <p className="c4-pst-lead"><span>{v4("pstLeadBand")}</span> {bandName(v4, leadBand)}</p> : null}
      {leadDepth ? <p className="c4-pst-lead"><span>{v4("pstLeadDepth")}</span> {depthName(v4, leadDepth)}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("pstBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("phone-stems.csv", stemsCsv(rows))}>{v4("pstCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("phone-stem-rows.csv", stemRowsCsv(rows, reviewed))}>{v4("pstRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => storeReview(bulkReview(reviewed, shown.map((row) => row.id), presentIds, true))}>{v4("pstBulkReview")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("pstLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("pstFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-wtr-empty">{v4("pstNone")}</p>}
      {bandsOn.length > 0 && (
        <section className="c4-pst-chart" aria-label={v4("pstAllBands")}>
          {bandsOn.map((line) => {
            const share = stemShare(line.count, rows.length);
            const bar = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.band || "blank";
            return (
              <p key={name} className="c4-pst-col" data-band={name}>
                <span>{bandName(v4, line.band)}</span>
                <span className="c4-wtr-track" aria-hidden="true"><i style={{ width: `${bar}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("pstShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      <div className="c4-row" role="group" aria-label={v4("pstShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("pstShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("pstHidden")}</button>
      </div>
      <div className="c4-pst-bands" role="group" aria-label={v4("pstAllBands")}>
        <button type="button" className="c4-pst-band" data-on={!selected ? "1" : "0"} aria-pressed={!selected} onClick={() => setSelected("")}>
          <span>{v4("pstAllBands")}</span>
          <span className="c4-wtr-count">{rows.length}</span>
        </button>
        {chips.map((item) => {
          const name = item || "blank";
          const count = bandsOn.find((line) => (line.band || "blank") === name)?.count || 0;
          return (
            <div key={name} className="c4-pst-band" data-on={selected === name ? "1" : "0"}>
              <button type="button" aria-pressed={selected === name} onClick={() => setSelected(selected === name ? "" : name)}>
                <span>{bandName(v4, item)}</span>
                <span className="c4-wtr-count">{count}</span>
              </button>
              <button type="button" className="c4-btn" onClick={() => store(toggleStem(hiddenBands, name, present), name)}>{showHidden ? v4("pstShow") : v4("pstHide")}</button>
            </div>
          );
        })}
      </div>
      <div className="c4-row" role="group" aria-label={v4("pstDepths")}>
        <button type="button" className="c4-chip" data-on={depthOn === "all" ? "1" : "0"} aria-pressed={depthOn === "all"} onClick={() => setDepth("all")}>{v4("pstAllDepths")}</button>
        {depthNames.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={depthOn === name ? "1" : "0"} aria-pressed={depthOn === name} onClick={() => setDepth(depthOn === name ? "all" : name)}>{depthName(v4, name)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("pstShapes")}>
        <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} aria-pressed={review === "all"} onClick={() => setReview("all")}>{v4("pstAllMarks")}</button>
        <button type="button" className="c4-chip" data-on={review === "open" ? "1" : "0"} aria-pressed={review === "open"} onClick={() => setReview("open")}>{v4("pstOpenMarks")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} aria-pressed={review === "reviewed"} onClick={() => setReview("reviewed")}>{v4("pstReviewed")}</button>
      </div>
      <label className="c4-lab">
        <span>{v4("pstSearch")}</span>
        <input className="c4-field" aria-label={v4("pstSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-wtr-empty">{v4("pstEmpty")}</p>}
      <ul className="c4-pst-rows">
        {shown.map((row) => {
          const band = stemBand(row.note);
          const deep = stemDepth(row.note);
          const digits = stemDigits(row.note);
          const seen = reviewed.includes(row.id);
          return (
            <li key={row.id} data-band={band || "blank"} data-reviewed={seen ? "1" : "0"}>
              <div>
                <p>{row.label || row.id}</p>
                <p className="c4-meta">{bandName(v4, band || (stemState(row.note) === "clear" ? "blank" : ""))} · {depthName(v4, deep)} · {v4("pstDigits")} {digits.length}</p>
              </div>
              <div className="c4-row">
                <button type="button" className="c4-btn" onClick={() => copyCode(row)}>{copied === row.id ? v4("pstCopied") : v4("pstCopy")}</button>
                <button type="button" className="c4-btn" aria-pressed={seen} onClick={() => storeReview(toggleReview(reviewed, row.id, presentIds))}>{v4("pstReview")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
