"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  QUAY_KEY,
  QUAY_VIEW_KEY,
  ZONE_KEY,
  activeBelt,
  activeBerth,
  activeFold,
  activeMate,
  activePennant,
  activeSpan,
  activeTide,
  activeTimber,
  addQuay,
  addQuayView,
  assignedZone,
  beltArg,
  beltLines,
  beltOf,
  berthArg,
  bulkQuayPinned,
  bulkQuayStowed,
  dropQuayView,
  editQuay,
  foldArg,
  foldLines,
  foldOf,
  leadingBelt,
  leadingFold,
  mateArg,
  namedBelts,
  namedFolds,
  namedSpans,
  nextQuay,
  pennantArg,
  quayClashIds,
  quayCopy,
  quayCounts,
  quayGap,
  quayMates,
  quayPennants,
  quayShare,
  quayTides,
  quayTimeline,
  quayTimbers,
  quaysCsv,
  readHiddenBelts,
  readQuayViews,
  readQuays,
  resetQuays,
  ringOf,
  setQuayHeld,
  setQuayPinned,
  setQuayStowed,
  spanArg,
  spanLines,
  spanOf,
  stepQuayTide,
  tideArg,
  timberArg,
  toggleBelt,
  visibleBelts,
  visibleQuays,
  visibleZoneCustomers,
  watchCounts,
  watchOf,
  zonesCsv,
  type QuayCard,
  type QuayTide,
  type QuayTimber,
  type QuayTray,
  type QuayView,
  type ZoneRow,
} from "@/lib/crmv4/round156";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  timezone?: string | null;
};

type GlanceRow = ZoneRow & { id: string };

const WATCHES = ["cove", "bay", "gulf", "sea"] as const;

function timberName(v4: V4, timber: QuayTimber): string {
  if (timber === "oak") return v4("quyTimberOak");
  if (timber === "teak") return v4("quyTimberTeak");
  if (timber === "pine") return v4("quyTimberPine");
  if (timber === "ash") return v4("quyTimberAsh");
  return v4("quyBlankTimber");
}

function tideName(v4: V4, tide: QuayTide): string {
  if (tide === "ebb") return v4("quyTideEbb");
  if (tide === "slack") return v4("quyTideSlack");
  if (tide === "flood") return v4("quyTideFlood");
  return v4("quyBlankTide");
}

function watchName(v4: V4, name: string): string {
  if (name === "cove") return v4("quyCove");
  if (name === "bay") return v4("quyBay");
  if (name === "gulf") return v4("quyGulf");
  if (name === "sea") return v4("quySea");
  if (name === "inner") return v4("quyInner");
  if (name === "outer") return v4("quyOuter");
  if (/^(?:0?[1-9]|[12]\d|3[0-6])$/.test(name)) return String(Number(name));
  return v4("quyBlankBerth");
}

function beltName(v4: V4, name: string): string {
  if (name === "africa") return v4("zblAfrica");
  if (name === "america") return v4("zblAmerica");
  if (name === "asia") return v4("zblAsia");
  if (name === "europe") return v4("zblEurope");
  if (name === "pacific") return v4("zblPacific");
  if (name === "other") return v4("zblOther");
  if (name === "plain") return v4("zblPlain");
  return v4("zblUnmarked");
}

function spanName(v4: V4, name: string): string {
  if (name === "short") return v4("zblShort");
  if (name === "mid") return v4("zblMid");
  if (name === "long") return v4("zblLong");
  return v4("zblUnmarked");
}

function foldName(v4: V4, name: string): string {
  if (name === "plain") return v4("zblFoldPlain");
  if (name === "split") return v4("zblFoldSplit");
  if (name === "deep") return v4("zblFoldDeep");
  return v4("zblUnmarked");
}

function auditName(v4: V4, audit: string): string {
  if (audit === "save") return v4("quyAuditSave");
  if (audit === "edit") return v4("quyAuditEdit");
  if (audit === "raise") return v4("quyAuditRaise");
  if (audit === "lower") return v4("quyAuditLower");
  if (audit === "pin") return v4("quyAuditPin");
  if (audit === "unpin") return v4("quyAuditUnpin");
  if (audit === "hold") return v4("quyAuditHold");
  if (audit === "release") return v4("quyAuditRelease");
  if (audit === "stow") return v4("quyAuditStow");
  if (audit === "unstow") return v4("quyAuditUnstow");
  return "";
}

function berthLabel(berth: number | null): string {
  return berth === null ? "—" : String(berth);
}

function gapLabel(v4: V4, berth: number | null, desk: string): string {
  const gap = quayGap(berth, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("quyPast")} ${gap}`;
  if (gap < 0) return `${v4("quyAhead")} ${Math.abs(gap)}`;
  return v4("quyDue");
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

function marks(tide: string): number {
  if (tide === "flood") return 3;
  if (tide === "slack") return 2;
  if (tide === "ebb") return 1;
  return 0;
}

export function QuaySlips({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<QuayCard[]>([]);
  const [views, setViews] = useState<QuayView[]>([]);
  const [text, setText] = useState("");
  const [mate, setMate] = useState("");
  const [berth, setBerth] = useState("");
  const [timber, setTimber] = useState("");
  const [pennant, setPennant] = useState("");
  const [tide, setTide] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<QuayTray>("open");
  const [mateFilter, setMateFilter] = useState("all");
  const [timberFilter, setTimberFilter] = useState("all");
  const [pennantFilter, setPennantFilter] = useState("all");
  const [tideFilter, setTideFilter] = useState("all");
  const [berthFilter, setBerthFilter] = useState("all");
  const [floodOnly, setFloodOnly] = useState(false);
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
    const next = readQuays(readJson(QUAY_KEY, []));
    const saved = readQuayViews(readJson(QUAY_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(QUAY_KEY, next);
    writeJson(QUAY_VIEW_KEY, saved);
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
      if (event.key === "q" || event.key === "Q") {
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
  const mates = quayMates(cards);
  const timbers = quayTimbers(cards);
  const pennants = quayPennants(cards);
  const tides = quayTides(cards);
  const bars = watchCounts(cards);
  const mateOn = activeMate(mateFilter, mates);
  const timberOn = activeTimber(timberFilter, timbers);
  const pennantOn = activePennant(pennantFilter, pennants);
  const tideOn = activeTide(tideFilter, tides);
  const berthOn = activeBerth(berthFilter);
  const picked = berthArg(berthOn);
  const shown = visibleQuays(
    cards,
    tray,
    query,
    mateArg(mateOn),
    timberArg(timberOn),
    pennantArg(pennantOn),
    tideArg(tideOn),
    picked.exact,
    picked.band,
    floodOnly,
    lateOnly,
    desk,
  );
  const timeline = quayTimeline(cards, query);
  const counts = quayCounts(cards, desk);
  const total = cards.length;
  const nextId = nextQuay(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const widest = Math.max(1, ...bars);

  function store(next: QuayCard[]) {
    setCards(next);
    writeJson(QUAY_KEY, next);
  }

  function storeViews(next: QuayView[]) {
    setViews(next);
    writeJson(QUAY_VIEW_KEY, next);
  }

  function clearDraft() {
    setText("");
    setMate("");
    setBerth("");
    setTimber("");
    setPennant("");
    setTide("");
  }

  function copyCard(card: QuayCard) {
    const body = quayCopy(card.text);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(card.id);
  }

  function applyView(view: QuayView) {
    setTray(view.tray);
    setQuery(view.query);
    setMateFilter(activeMate(view.mate, quayMates(cards)));
    setTimberFilter(activeTimber(view.timber, quayTimbers(cards)));
    setPennantFilter(activePennant(view.pennant, quayPennants(cards)));
    setTideFilter(activeTide(view.tide, quayTides(cards)));
    setBerthFilter(activeBerth(view.berth));
    setBoard("cards");
    setFloodOnly(false);
    setLateOnly(false);
  }

  return (
    <section className="c4-quy" aria-label={v4("quyTitle")} data-quays="1" data-role={role}>
      <header className="c4-quy-head">
        <p className="c4-quy-plate" data-logo="mono">{v4("quyLogo")}</p>
        <div>
          <p className="c4-quy-kicker">{v4("quySub")}</p>
          <h2 className="c4-title">{v4("quyTitle")}</h2>
        </div>
        <p className="c4-quy-count">{shown.length}</p>
      </header>
      <details className="c4-quy-rules">
        <summary>{v4("quyRules")}</summary>
        <p className="c4-meta">{v4("quyHint")}</p>
        <p className="c4-meta">{v4("quyLocal")}</p>
        <p className="c4-meta">{v4("quyBlank")}</p>
        <p className="c4-meta">{v4("quyMateBlank")}</p>
        <p className="c4-meta">{v4("quyBerthBlank")}</p>
        <p className="c4-meta">{v4("quyTimberBlank")}</p>
        <p className="c4-meta">{v4("quyPennantBlank")}</p>
        <p className="c4-meta">{v4("quyTideBlank")}</p>
        <p className="c4-meta">{v4("quyEscape")}</p>
        <p className="c4-meta">{v4("quySlash")}</p>
        <p className="c4-meta">{v4("quyNew")}</p>
      </details>
      {viewer ? <p className="c4-quy-notice" role="status">{v4("quyViewer")}</p> : null}
      <p className="c4-quy-notice" role="status">
        <span>{v4("quyNotice")}</span>
        <span className="c4-quy-count">{counts.late}</span>
        <button type="button" className="c4-btn" aria-pressed={lateOnly} onClick={() => { setLateOnly((value) => !value); setTray("open"); setBoard("cards"); }}>
          {lateOnly ? v4("quyNoticeAll") : v4("quyNoticeOpen")}
        </button>
      </p>
      <section className="c4-quy-kpi" aria-label={v4("quyKpi")}>
        {(["open", "held", "stowed", "pinned"] as const).map((key) => {
          const count = counts[key];
          const share = quayShare(count, total);
          const label = key === "open" ? v4("quyOpen") : key === "held" ? v4("quyHeld") : key === "stowed" ? v4("quyStowed") : v4("quyPinned");
          return (
            <p key={key} className="c4-quy-meter" data-tray={key}>
              <span>{label}</span>
              <strong>{count}</strong>
              <span>{v4("quyShare")} {share}%</span>
              <span className="c4-quy-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <section className="c4-quy-chart" aria-label={v4("quyChart")}>
        <p className="c4-quy-kicker">{v4("quyChart")}</p>
        {WATCHES.map((name, index) => {
          const count = bars[index] || 0;
          const width = Math.max(8, Math.round((count / widest) * 100));
          return (
            <button key={name} type="button" className="c4-quy-col" data-on={berthOn === name ? "1" : "0"} aria-pressed={berthOn === name} onClick={() => setBerthFilter(berthOn === name ? "all" : name)}>
              <span>{watchName(v4, name)}</span>
              <span className="c4-quy-bar" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
              <span>{count}</span>
            </button>
          );
        })}
      </section>
      <form className="c4-quy-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addQuay(cards, { id: `quy-${Date.now()}`, text, mate, berth, timber, pennant, tide });
        if (next === cards || next.length === cards.length) return;
        store(next);
        clearDraft();
      }}>
        <label className="c4-lab">
          <span>{v4("quyText")}</span>
          <input ref={textRef} className="c4-field" aria-label={v4("quyText")} value={text} disabled={viewer} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab">
          <span>{v4("quyMate")}</span>
          <input className="c4-field" aria-label={v4("quyMate")} value={mate} disabled={viewer} onChange={(event) => setMate(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("quyBerth")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("quyBerth")} value={berth} disabled={viewer} onChange={(event) => setBerth(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("quyTimber")}</span>
          <select className="c4-select" aria-label={v4("quyTimber")} value={timber} disabled={viewer} onChange={(event) => setTimber(event.target.value)}>
            <option value="">{v4("quyBlankTimber")}</option>
            <option value="oak">{v4("quyTimberOak")}</option>
            <option value="teak">{v4("quyTimberTeak")}</option>
            <option value="pine">{v4("quyTimberPine")}</option>
            <option value="ash">{v4("quyTimberAsh")}</option>
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("quyPennant")}</span>
          <input className="c4-field" aria-label={v4("quyPennant")} value={pennant} disabled={viewer} onChange={(event) => setPennant(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("quyTide")}</span>
          <select className="c4-select" aria-label={v4("quyTide")} value={tide} disabled={viewer} onChange={(event) => setTide(event.target.value)}>
            <option value="">{v4("quyBlankTide")}</option>
            <option value="ebb">{v4("quyTideEbb")}</option>
            <option value="slack">{v4("quyTideSlack")}</option>
            <option value="flood">{v4("quyTideFlood")}</option>
          </select>
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("quyAdd")}</button>
      </form>
      <div className="c4-row" role="group" aria-label={v4("quyTitle")}>
        <button type="button" className="c4-chip" data-on={tray === "open" ? "1" : "0"} aria-pressed={tray === "open"} onClick={() => setTray("open")}>{v4("quyOpen")}</button>
        <button type="button" className="c4-chip" data-on={tray === "held" ? "1" : "0"} aria-pressed={tray === "held"} onClick={() => setTray("held")}>{v4("quyHeld")}</button>
        <button type="button" className="c4-chip" data-on={tray === "stowed" ? "1" : "0"} aria-pressed={tray === "stowed"} onClick={() => setTray("stowed")}>{v4("quyStowed")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("quyTimeline")}</button>
        <button type="button" className="c4-chip" data-on={floodOnly ? "1" : "0"} aria-pressed={floodOnly} onClick={() => setFloodOnly((value) => !value)}>{v4("quyFlood")}</button>
        <button type="button" className="c4-btn" onClick={() => download("quay-slips.csv", quaysCsv(cards, desk))}>{v4("quyCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkQuayPinned(cards, shown.map((card) => card.id), true))}>{v4("quyBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkQuayStowed(cards, shown.map((card) => card.id), true))}>{v4("quyBulkStow")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(resetQuays()); setEditing(""); }}>{v4("quyReset")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("quyBerths")}>
        <button type="button" className="c4-chip" data-on={berthOn === "all" ? "1" : "0"} aria-pressed={berthOn === "all"} onClick={() => setBerthFilter("all")}>{v4("quyAllBerths")}</button>
        <button type="button" className="c4-chip" data-on={berthOn === "blank" ? "1" : "0"} aria-pressed={berthOn === "blank"} onClick={() => setBerthFilter("blank")}>{v4("quyBlankBerth")}</button>
        <button type="button" className="c4-chip" data-on={berthOn === "inner" ? "1" : "0"} aria-pressed={berthOn === "inner"} onClick={() => setBerthFilter("inner")}>{v4("quyInner")}</button>
        <button type="button" className="c4-chip" data-on={berthOn === "outer" ? "1" : "0"} aria-pressed={berthOn === "outer"} onClick={() => setBerthFilter("outer")}>{v4("quyOuter")}</button>
        {["1", "10", "19", "28"].map((slot) => (
          <button key={slot} type="button" className="c4-chip" data-on={berthOn === slot ? "1" : "0"} aria-pressed={berthOn === slot} onClick={() => setBerthFilter(berthOn === slot ? "all" : slot)}>{slot}</button>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("quySearch")}</span>
        <input ref={searchRef} className="c4-field" aria-label={v4("quySearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      <div className="c4-quy-next">
        <label className="c4-lab">
          <span>{v4("quyDesk")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("quyDesk")} value={desk} onChange={(event) => setDesk(event.target.value)} />
        </label>
        <p className="c4-meta">
          <span>{v4("quyNext")}</span>
          {" "}
          {nextCard ? nextCard.text : v4("quyNextEmpty")}
        </p>
      </div>
      <div className="c4-row">
        <label className="c4-lab">
          <span>{v4("quyMates")}</span>
          <select className="c4-select" aria-label={v4("quyMates")} value={mateOn} onChange={(event) => setMateFilter(event.target.value)}>
            <option value="all">{v4("quyAllMates")}</option>
            <option value="blank">{v4("quyBlankMate")}</option>
            {mates.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("quyTimbers")}</span>
          <select className="c4-select" aria-label={v4("quyTimbers")} value={timberOn} onChange={(event) => setTimberFilter(event.target.value)}>
            <option value="all">{v4("quyAllTimbers")}</option>
            <option value="blank">{v4("quyBlankTimber")}</option>
            {timbers.map((item) => <option key={item} value={item}>{timberName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("quyPennants")}</span>
          <select className="c4-select" aria-label={v4("quyPennants")} value={pennantOn} onChange={(event) => setPennantFilter(event.target.value)}>
            <option value="all">{v4("quyAllPennants")}</option>
            <option value="blank">{v4("quyBlankPennant")}</option>
            {pennants.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("quyTides")}</span>
          <select className="c4-select" aria-label={v4("quyTides")} value={tideOn} onChange={(event) => setTideFilter(event.target.value)}>
            <option value="all">{v4("quyAllTides")}</option>
            <option value="blank">{v4("quyBlankTide")}</option>
            {tides.map((item) => <option key={item} value={item}>{tideName(v4, item)}</option>)}
          </select>
        </label>
      </div>
      <form className="c4-quy-view" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addQuayView(views, {
          id: `view-${Date.now()}`,
          name: viewName,
          tray,
          query,
          mate: mateOn,
          timber: timberOn,
          pennant: pennantOn,
          tide: tideOn,
          berth: berthOn,
        });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab">
          <span>{v4("quyViewName")}</span>
          <input className="c4-field" aria-label={v4("quyViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("quySaveView")}</button>
      </form>
      <section aria-label={v4("quyViews")}>
        <p className="c4-quy-kicker">{v4("quyViews")}</p>
        {!views.length && <p className="c4-quy-empty">{v4("quyViewEmpty")}</p>}
        <ul className="c4-quy-views">
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropQuayView(views, view.id))}>{v4("quyDropView")}</button>
            </li>
          ))}
        </ul>
      </section>
      {board === "cards" && !shown.length && <p className="c4-quy-empty">{v4("quyEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-quy-rows">
          {shown.map((card) => {
            const clashes = quayClashIds(cards, card.id);
            const gap = gapLabel(v4, card.berth, desk);
            const ring = ringOf(card.berth);
            const editingCard = editing === card.id;
            return (
              <li key={card.id} data-tide={card.tide || "blank"} data-timber={card.timber || "blank"} data-watch={watchOf(card.berth)}>
                <span className="c4-quy-folio" aria-hidden="true">{berthLabel(card.berth)}</span>
                <span className="c4-quy-marks" aria-hidden="true">
                  {[0, 1, 2].map((index) => <i key={index} data-on={index < marks(card.tide) ? "1" : "0"} />)}
                </span>
                <div>
                  {editingCard ? (
                    <form className="c4-row" onSubmit={(event) => {
                      event.preventDefault();
                      if (viewer) return;
                      store(editQuay(cards, card.id, draft));
                      setEditing("");
                    }}>
                      <input className="c4-field" aria-label={v4("quyEdit")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("quySaveEdit")}</button>
                    </form>
                  ) : <p>{card.text}</p>}
                  <p className="c4-meta">
                    {card.mate || v4("quyBlankMate")}
                    {" · "}
                    {berthLabel(card.berth)}
                    {" · "}
                    {timberName(v4, timberOfCard(card.timber))}
                    {" · "}
                    {card.pennant || v4("quyBlankPennant")}
                    {" · "}
                    {tideName(v4, tideOfCard(card.tide))}
                    {ring === "blank" ? "" : ` · ${ring === "inner" ? v4("quyInner") : v4("quyOuter")}`}
                    {gap ? ` · ${gap}` : ""}
                    {auditName(v4, card.audit) ? ` · ${v4("quyAudit")} ${auditName(v4, card.audit)}` : ""}
                    {" · "}
                    {clashes.length ? `${v4("quyClash")} ${clashes.length}` : v4("quyClashNone")}
                  </p>
                </div>
                <div className="c4-row">
                  <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("quyCopied") : v4("quyCopy")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.text); }}>{v4("quyEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepQuayTide(cards, card.id, 1))}>{v4("quyRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepQuayTide(cards, card.id, -1))}>{v4("quyLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.pinned} onClick={() => store(setQuayPinned(cards, card.id, !card.pinned))}>{card.pinned ? v4("quyUnpin") : v4("quyPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.held} onClick={() => store(setQuayHeld(cards, card.id, !card.held))}>{card.held ? v4("quyRelease") : v4("quyHold")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.stowed} onClick={() => store(setQuayStowed(cards, card.id, !card.stowed))}>{card.stowed ? v4("quyUnstow") : v4("quyStow")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {board === "timeline" && (
        <ol className="c4-quy-time">
          {timeline.map((card) => (
            <li key={card.id} data-watch={watchOf(card.berth)}>
              <span className="c4-quy-clock">{berthLabel(card.berth)}</span>
              <p>{card.text}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function timberOfCard(timber: string): QuayTimber {
  if (timber === "oak" || timber === "teak" || timber === "pine" || timber === "ash") return timber;
  return "blank";
}

function tideOfCard(tide: string): QuayTide {
  if (tide === "ebb" || tide === "slack" || tide === "flood") return tide;
  return "blank";
}

export function TimezoneBelts({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenBelts, setHiddenBelts] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [belt, setBelt] = useState("all");
  const [span, setSpan] = useState("all");
  const [fold, setFold] = useState("all");
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = useMemo(() => (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || "").trim(),
      timezone: row.timezone,
    };
  }).filter((row): row is GlanceRow => Boolean(row)), [data.data?.users]);
  const belts = beltLines(rows);
  const spans = spanLines(rows);
  const folds = foldLines(rows);
  const present = namedBelts(rows);
  const presentKey = present.join("\n");
  const beltNames = namedBelts(rows);
  const spanNames = namedSpans(rows);
  const foldNames = namedFolds(rows);
  const blankBelt = belts.find((line) => !line.belt)?.count || 0;
  const leadBelt = leadingBelt(rows);
  const leadFold = leadingFold(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenBelts(readJson(ZONE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenBelts(next);
    writeJson(ZONE_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleBelts(present, hiddenBelts, showHidden);
  const beltOn = activeBelt(selected || belt, selected ? chips : beltNames);
  const spanOn = activeSpan(span, spanNames);
  const foldOn = activeFold(fold, foldNames);
  const shown = visibleZoneCustomers(
    rows,
    selected ? beltArg(activeBelt(selected, chips)) : beltArg(activeBelt(belt, beltNames)),
    foldArg(foldOn),
    spanArg(spanOn),
    query,
  );
  const widest = Math.max(1, ...belts.map((line) => line.count));

  function store(next: string[], clear: string) {
    setHiddenBelts(next);
    writeJson(ZONE_KEY, next);
    if (clear && activeBelt(selected, [clear]) === clear) setSelected("");
  }

  return (
    <section className="c4-zbl" aria-label={v4("zblTitle")} data-belts="1">
      <header className="c4-zbl-head">
        <div>
          <p className="c4-quy-kicker">{v4("zblSub")}</p>
          <h2 className="c4-title">{v4("zblTitle")}</h2>
        </div>
        <p className="c4-quy-count">{v4("zblRows")} {rows.length}</p>
      </header>
      <details className="c4-quy-rules">
        <summary>{v4("zblRules")}</summary>
        <p className="c4-meta">{v4("zblHint")}</p>
        <p className="c4-meta">{v4("zblLocal")}</p>
        <p className="c4-meta">{v4("zblEscape")}</p>
      </details>
      {leadBelt ? <p className="c4-zbl-lead"><span>{v4("zblLeadBelt")}</span> {beltName(v4, leadBelt)}</p> : null}
      {leadFold ? <p className="c4-zbl-lead"><span>{v4("zblLeadFold")}</span> {foldName(v4, leadFold)}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("zblBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("timezone-belts.csv", zonesCsv(rows))}>{v4("zblCsv")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("zblLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("zblFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-quy-empty">{v4("zblNone")}</p>}
      {belts.length > 0 && (
        <section className="c4-zbl-chart" aria-label={v4("zblAllBelt")}>
          {belts.map((line) => {
            const share = quayShare(line.count, rows.length);
            const width = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.belt || "blank";
            return (
              <p key={name} className="c4-zbl-col" data-belt={line.belt || "blank"}>
                <span>{beltName(v4, line.belt)}</span>
                <span className="c4-quy-track" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("zblShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      <div className="c4-zbl-belts" role="group" aria-label={v4("zblAllBelt")}>
        <button type="button" className="c4-zbl-belt" data-on={!selected && beltOn === "all" ? "1" : "0"} aria-pressed={!selected && beltOn === "all"} onClick={() => { setSelected(""); setBelt("all"); }}>
          <span>{v4("zblAllBelt")}</span>
          <span className="c4-quy-count">{rows.length}</span>
        </button>
        {blankBelt > 0 && (
          <button type="button" className="c4-zbl-belt" data-on={!selected && belt === "blank" ? "1" : "0"} aria-pressed={!selected && belt === "blank"} onClick={() => { setSelected(""); setBelt(belt === "blank" ? "all" : "blank"); }}>
            <span>{v4("zblUnmarked")}</span>
            <span className="c4-quy-count">{blankBelt}</span>
          </button>
        )}
        {beltNames.map((item) => {
          const count = belts.find((line) => line.belt === item)?.count || 0;
          return (
            <button key={item} type="button" className="c4-zbl-belt" data-on={!selected && belt === item ? "1" : "0"} aria-pressed={!selected && belt === item} onClick={() => { setSelected(""); setBelt(belt === item ? "all" : item); }}>
              <span>{beltName(v4, item)}</span>
              <span className="c4-quy-count">{count}</span>
              <span>{v4("zblShare")} {quayShare(count, rows.length)}%</span>
            </button>
          );
        })}
      </div>
      <div className="c4-row" role="group" aria-label={v4("zblSpans")}>
        <button type="button" className="c4-chip" data-on={spanOn === "all" ? "1" : "0"} aria-pressed={spanOn === "all"} onClick={() => setSpan("all")}>{v4("zblSpans")}</button>
        {spans.filter((line) => line.span).map((line) => (
          <button key={line.span} type="button" className="c4-chip" data-on={spanOn === line.span ? "1" : "0"} aria-pressed={spanOn === line.span} onClick={() => setSpan(spanOn === line.span ? "all" : line.span)}>
            {spanName(v4, line.span)} {line.count}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("zblFolds")}>
        <button type="button" className="c4-chip" data-on={foldOn === "all" ? "1" : "0"} aria-pressed={foldOn === "all"} onClick={() => setFold("all")}>{v4("zblAllFolds")}</button>
        {folds.filter((line) => line.fold).map((line) => (
          <button key={line.fold} type="button" className="c4-chip" data-on={foldOn === line.fold ? "1" : "0"} aria-pressed={foldOn === line.fold} onClick={() => setFold(foldOn === line.fold ? "all" : line.fold)}>
            {foldName(v4, line.fold)} {line.count}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("zblShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("zblShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("zblHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("zblBelts")}>
        <button type="button" className="c4-chip" data-on={!selected ? "1" : "0"} aria-pressed={!selected} onClick={() => setSelected("")}>{v4("zblAll")}</button>
        {chips.map((item) => {
          const line = belts.find((row) => row.belt === item);
          const count = line?.count || 0;
          const share = quayShare(count, rows.length);
          return (
            <span key={item} className="c4-zbl-pair">
              <button type="button" className="c4-chip" data-on={selected === item ? "1" : "0"} aria-pressed={selected === item} onClick={() => { setBelt("all"); setSelected(selected === item ? "" : item); }}>{beltName(v4, item)}</button>
              <span className="c4-quy-count">{count}</span>
              <span className="c4-zbl-share">{v4("zblShare")} {share}%</span>
              <span className="c4-quy-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
              <button type="button" className="c4-btn" onClick={() => store(toggleBelt(hiddenBelts, item, present), showHidden ? "" : item)}>{showHidden ? v4("zblShow") : v4("zblHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("zblSearch")}</span>
        <input className="c4-field" aria-label={v4("zblSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-quy-empty">{v4("zblEmpty")}</p>}
      <ul className="c4-zbl-rows">
        {shown.map((row) => {
          const zone = assignedZone(row.timezone);
          const beltMark = beltOf(row.timezone);
          const spanMark = spanOf(row.timezone);
          const foldMark = foldOf(row.timezone);
          return (
            <li key={row.id} data-belt={beltMark || "blank"} data-fold={foldMark || "blank"} data-span={spanMark || "blank"}>
              <span className="c4-zbl-face" aria-hidden="true">{beltMark ? beltName(v4, beltMark).slice(0, 1) : "—"}</span>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">
                {zone || v4("zblUnmarked")}
                {" · "}
                {beltName(v4, beltMark)}
                {" · "}
                {spanName(v4, spanMark)}
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
