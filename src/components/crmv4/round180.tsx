"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  BEARING_KEY,
  BEARING_VIEW_KEY,
  SEAL_KEY,
  SEAL_REVIEW_KEY,
  activeCipher,
  activeCord,
  activeGlaze,
  activeInk,
  activePilot,
  activeSeal,
  activeSealDepth,
  activeSpan,
  activeStation,
  addBearing,
  addBearingView,
  bearingCiphers,
  bearingCopy,
  bearingCounts,
  bearingGlazes,
  bearingInks,
  bearingPilots,
  bearingShare,
  bearingsCsv,
  bulkBearingFile,
  bulkBearingInk,
  bulkBearingPin,
  bulkSealReview,
  cipherArg,
  clashStationCount,
  cordArg,
  cycleGlaze,
  dropBearingView,
  editBearing,
  editBearingNote,
  glazeArg,
  glazeOf,
  homeCipher,
  inkArg,
  inkCounts,
  inkOf,
  lateBearing,
  leadingSeal,
  leadingSealDepth,
  nextBearing,
  oddSealCount,
  pilotArg,
  pilotLoad,
  plusSeal,
  presentSeals,
  readBearingViews,
  readBearings,
  readHiddenSeals,
  readReviewedSeals,
  resetBearings,
  sealArg,
  sealBand,
  sealCopy,
  sealDepth,
  sealDepthArg,
  sealRowsCsv,
  sealShare,
  sealState,
  sealWords,
  sealsCsv,
  setBearingFile,
  setBearingFix,
  setBearingPin,
  soonBearing,
  spanArg,
  spanClashCount,
  spanClashIds,
  stationArg,
  stationBand,
  stationClashIds,
  stationGap,
  stationTimeline,
  suggestCord,
  suggestInk,
  suggestPilot,
  toggleSeal,
  toggleSealReview,
  usedStations,
  visibleBearings,
  visibleSealBands,
  visibleSealCustomers,
  type Bearing,
  type BearingGlaze,
  type BearingInk,
  type BearingTray,
  type BearingView,
  type SealRow,
  type SealShape,
} from "@/lib/crmv4/round180";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
};

type GlanceRow = SealRow & { id: string };

const INKS = ["ink", "chalk", "gilt"] as const;
const BANDS = ["pip", "slip", "card", "roll"] as const;

function inkName(v4: V4, ink: BearingInk | string): string {
  if (ink === "ink") return v4("brgInkInk");
  if (ink === "chalk") return v4("brgInkChalk");
  if (ink === "gilt") return v4("brgInkGilt");
  return v4("brgBlankInk");
}

function glazeName(v4: V4, glaze: BearingGlaze): string {
  if (glaze === "pearl") return v4("brgGlazePearl");
  if (glaze === "brass") return v4("brgGlazeBrass");
  if (glaze === "slate") return v4("brgGlazeSlate");
  return v4("brgBlankGlaze");
}

function stationName(v4: V4, name: string): string {
  if (name === "dawn") return v4("brgDawn");
  if (name === "day") return v4("brgDay");
  if (name === "dusk") return v4("brgDusk");
  if (name === "peak") return v4("brgPeak");
  if (name === "quiet") return v4("brgQuiet");
  if (/^[1-8]$/.test(name)) return name;
  return v4("brgBlankStation");
}

function spanName(v4: V4, span: number | null): string {
  if (span === 2) return v4("brgSpan2");
  if (span === 4) return v4("brgSpan4");
  if (span === 8) return v4("brgSpan8");
  return v4("brgBlankSpan");
}

function cordName(v4: V4, cord: number | null): string {
  if (cord === 3) return v4("brgCord3");
  if (cord === 7) return v4("brgCord7");
  if (cord === 11) return v4("brgCord11");
  return v4("brgBlankCord");
}

function bandName(v4: V4, name: string): string {
  if (name === "pip") return v4("mlsPip");
  if (name === "slip") return v4("mlsSlip");
  if (name === "card") return v4("mlsCard");
  if (name === "roll") return v4("mlsRoll");
  if (name === "blank") return v4("mlsClear");
  return v4("mlsUnmarked");
}

function depthName(v4: V4, name: string): string {
  if (name === "plain") return v4("mlsPlain");
  if (name === "pair") return v4("mlsPair");
  if (name === "stack") return v4("mlsStack");
  if (name === "seam") return v4("mlsSeam");
  if (name === "rail") return v4("mlsRail");
  if (name === "figure") return v4("mlsFigure");
  return v4("mlsUnmarked");
}

function auditName(v4: V4, audit: string): string {
  const key = {
    save: "brgAuditSave",
    edit: "brgAuditEdit",
    glaze: "brgAuditGlaze",
    pin: "brgAuditPin",
    unpin: "brgAuditUnpin",
    fix: "brgAuditFix",
    lift: "brgAuditLift",
    file: "brgAuditFile",
    restore: "brgAuditRestore",
    shift: "brgAuditShift",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function stationLabel(station: number | null): string {
  return station === null ? "—" : String(station);
}

function gapLabel(v4: V4, station: number | null, desk: string): string {
  const gap = stationGap(station, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("brgPast")} ${gap}`;
  if (gap < 0) return `${v4("brgAhead")} ${Math.abs(gap)}`;
  return v4("brgDue");
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

function sameCards(left: readonly Bearing[], right: readonly Bearing[]): boolean {
  return left.length === right.length && left.every((card, index) => card.id === right[index]?.id && card.title === right[index]?.title && card.note === right[index]?.note && card.audit === right[index]?.audit);
}

export function MapBearings({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<Bearing[]>([]);
  const [views, setViews] = useState<BearingView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [pilot, setPilot] = useState("");
  const [station, setStation] = useState("");
  const [ink, setInk] = useState("");
  const [cipher, setCipher] = useState("");
  const [glaze, setGlaze] = useState("");
  const [span, setSpan] = useState("");
  const [cord, setCord] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<BearingTray>("open");
  const [pilotFilter, setPilotFilter] = useState("all");
  const [inkFilter, setInkFilter] = useState("all");
  const [cipherFilter, setCipherFilter] = useState("all");
  const [glazeFilter, setGlazeFilter] = useState("all");
  const [stationFilter, setStationFilter] = useState("all");
  const [spanFilter, setSpanFilter] = useState("all");
  const [cordFilter, setCordFilter] = useState("all");
  const [slateOnly, setSlateOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [homeOnly, setHomeOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [desk, setDesk] = useState("");
  const [moveInk, setMoveInk] = useState("ink");
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readBearings(readJson(BEARING_KEY, []));
    const saved = readBearingViews(readJson(BEARING_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(BEARING_KEY, next);
    writeJson(BEARING_VIEW_KEY, saved);
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
  const pilots = bearingPilots(cards);
  const inks = bearingInks(cards);
  const ciphers = bearingCiphers(cards);
  const glazes = bearingGlazes(cards);
  const bars = inkCounts(cards);
  const pilotOn = activePilot(pilotFilter, pilots);
  const inkOn = activeInk(inkFilter, INKS);
  const cipherOn = activeCipher(cipherFilter, ciphers);
  const glazeOn = activeGlaze(glazeFilter, glazes);
  const stationOn = activeStation(stationFilter);
  const spanOn = activeSpan(spanFilter);
  const cordOn = activeCord(cordFilter);
  const pickedStation = stationArg(stationOn);
  const shown = visibleBearings(
    cards,
    tray,
    query,
    pilotArg(pilotOn),
    inkArg(inkOn),
    cipherArg(cipherOn),
    glazeArg(glazeOn),
    pickedStation.exact,
    pickedStation.pick,
    spanArg(spanOn),
    cordArg(cordOn),
    slateOnly,
    peakOnly,
    homeOnly,
  );
  const timeline = stationTimeline(cards, query);
  const counts = bearingCounts(cards, desk);
  const clashes = clashStationCount(cards);
  const spans = spanClashCount(cards);
  const stationUse = usedStations(cards);
  const total = cards.length;
  const nextId = nextBearing(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const widest = Math.max(1, ...bars);
  const pinned = cards.filter((card) => card.pinned);
  const load = pilotLoad(cards, pilot);
  const suggested = suggestInk(cards);
  const lightPilot = suggestPilot(cards);
  const quietCord = suggestCord(cards);
  const homeShare = bearingShare(counts.home, total);
  const targets = picked.length ? picked : shown.map((card) => card.id);

  function store(next: Bearing[]) {
    setCards(next);
    writeJson(BEARING_KEY, next);
  }

  function storeViews(next: BearingView[]) {
    setViews(next);
    writeJson(BEARING_VIEW_KEY, next);
  }

  function clearDraft() {
    setTitle("");
    setNote("");
    setPilot("");
    setStation("");
    setInk("");
    setCipher("");
    setGlaze("");
    setSpan("");
    setCord("");
  }

  function copyCard(card: Bearing) {
    const body = bearingCopy(card.title);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(card.id);
  }

  function applyView(view: BearingView) {
    setTray(view.tray);
    setQuery(view.query);
    setPilotFilter(activePilot(view.pilot, bearingPilots(cards)));
    setInkFilter(activeInk(view.ink, INKS));
    setCipherFilter(activeCipher(view.cipher, bearingCiphers(cards)));
    setGlazeFilter(activeGlaze(view.glaze, bearingGlazes(cards)));
    setStationFilter(activeStation(view.station));
    setSpanFilter(activeSpan(view.span));
    setCordFilter(activeCord(view.cord));
    setBoard("cards");
    setSlateOnly(false);
    setPeakOnly(false);
    setHomeOnly(false);
  }

  function togglePick(id: string) {
    setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <section className="c4-brg" aria-label={v4("brgTitle")} data-bearings="1" data-role={role}>
      <header className="c4-brg-head">
        <p className="c4-brg-plate" data-logo="mono">{v4("brgLogo")}</p>
        <div>
          <p className="c4-brg-kicker">{v4("brgSub")}</p>
          <h2 className="c4-title">{v4("brgTitle")}</h2>
        </div>
        <p className="c4-brg-count">{shown.length}</p>
      </header>
      <details className="c4-brg-rules">
        <summary>{v4("brgRules")}</summary>
        <p className="c4-meta">{v4("brgHint")}</p>
        <p className="c4-meta">{v4("brgLocal")}</p>
        <p className="c4-meta">{v4("brgBlank")}</p>
        <p className="c4-meta">{v4("brgPilotBlank")}</p>
        <p className="c4-meta">{v4("brgStationBlank")}</p>
        <p className="c4-meta">{v4("brgInkBlank")}</p>
        <p className="c4-meta">{v4("brgCipherBlank")}</p>
        <p className="c4-meta">{v4("brgToneBlank")}</p>
        <p className="c4-meta">{v4("brgSpanBlank")}</p>
        <p className="c4-meta">{v4("brgCordBlank")}</p>
        <p className="c4-meta">{v4("brgNoteBlank")}</p>
        <p className="c4-meta">{v4("brgEscape")}</p>
        <p className="c4-meta">{v4("brgSlash")}</p>
        <p className="c4-meta">{v4("brgNew")}</p>
      </details>
      {viewer ? <p className="c4-brg-notice" role="status">{v4("brgViewer")}</p> : null}
      <p className="c4-brg-notice" role="status">
        <span>{v4("brgNotice")}</span>
        <span className="c4-brg-count">{counts.peak}</span>
        <button type="button" className="c4-btn" aria-pressed={peakOnly} onClick={() => { setPeakOnly((value) => !value); setTray("open"); }}>
          {peakOnly ? v4("brgNoticeAll") : v4("brgNoticePeak")}
        </button>
      </p>
      <p className="c4-brg-notice" role="status"><span>{v4("brgLate")}</span><span className="c4-brg-count">{counts.late}</span></p>
      <p className="c4-brg-notice" role="status"><span>{v4("brgSoon")}</span><span className="c4-brg-count">{counts.soon}</span></p>
      <p className="c4-brg-notice" role="status"><span>{v4("brgStationUse")}</span><span className="c4-brg-count">{stationUse}</span></p>
      <p className="c4-brg-notice" role="status"><span>{v4("brgClash")}</span><span className="c4-brg-count">{clashes}</span></p>
      <p className="c4-brg-notice" role="status"><span>{v4("brgSpanClash")}</span><span className="c4-brg-count">{spans}</span></p>
      <p className="c4-brg-notice" role="status">
        <span>{v4("brgHome")}</span>
        <span className="c4-brg-count">{counts.home}</span>
        <span>{v4("brgHomeShare")} {homeShare}%</span>
        <button type="button" className="c4-btn" aria-pressed={homeOnly} onClick={() => setHomeOnly((value) => !value)}>
          {homeOnly ? v4("brgHomeAll") : v4("brgHomeOnly")}
        </button>
      </p>
      <p className="c4-brg-suggest" role="status">
        <span>{v4("brgSuggestInk")}</span> {inkName(v4, suggested)}
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setInk(suggested)}>{v4("brgUseInk")}</button>
      </p>
      <p className="c4-brg-suggest" role="status">
        <span>{v4("brgSuggestPilot")}</span> {lightPilot || v4("brgBlankPilot")}
        <button type="button" className="c4-btn" disabled={viewer || !lightPilot} onClick={() => setPilot(lightPilot)}>{v4("brgUsePilot")}</button>
      </p>
      <p className="c4-brg-suggest" role="status">
        <span>{v4("brgSuggestCord")}</span> {cordName(v4, quietCord)}
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setCord(String(quietCord))}>{v4("brgUseCord")}</button>
      </p>
      {pinned.length > 0 && (
        <ul className="c4-brg-pins" aria-label={v4("brgPinned")}>
          {pinned.map((card) => (
            <li key={card.id}><span className="c4-brg-mark" aria-hidden="true">{stationLabel(card.station)}</span> {card.title}</li>
          ))}
        </ul>
      )}
      <section className="c4-brg-kpi" aria-label={v4("brgKpi")}>
        {(["open", "fixed", "filed"] as const).map((key) => {
          const count = counts[key];
          const share = bearingShare(count, total);
          const label = key === "open" ? v4("brgWaiting") : key === "fixed" ? v4("brgFixed") : v4("brgFiled");
          return (
            <p key={key} className="c4-brg-meter" data-tray={key}>
              <span>{label}</span>
              <span className="c4-brg-count">{count}</span>
              <span>{v4("brgShare")} {share}%</span>
              <span className="c4-brg-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <section className="c4-brg-chart" aria-label={v4("brgInkChart")}>
        <p className="c4-brg-kicker">{v4("brgInkChart")}</p>
        {INKS.map((name, index) => {
          const count = bars[index] || 0;
          const bar = Math.max(8, Math.round((count / widest) * 100));
          return (
            <button key={name} type="button" className="c4-brg-col" data-on={inkOn === name ? "1" : "0"} aria-pressed={inkOn === name} onClick={() => setInkFilter(inkOn === name ? "all" : name)}>
              <span>{inkName(v4, name)}</span>
              <span className="c4-brg-bar" aria-hidden="true"><i style={{ width: `${bar}%` }} /></span>
              <span>{count}</span>
            </button>
          );
        })}
      </section>
      <div className="c4-brg-split">
        <form className="c4-brg-form" onSubmit={(event) => {
          event.preventDefault();
          if (viewer) return;
          const next = addBearing(cards, { id: `brg-${Date.now()}`, title, note, pilot, station, ink, cipher, glaze, span, cord });
          if (sameCards(next, cards)) return;
          store(next);
          clearDraft();
        }}>
          <label className="c4-lab">
            <span>{v4("brgLine")}</span>
            <input ref={titleRef} className="c4-field" aria-label={v4("brgLine")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              event.preventDefault();
              clearDraft();
            }} />
          </label>
          <label className="c4-lab">
            <span>{v4("brgNote")}</span>
            <input className="c4-field" aria-label={v4("brgNote")} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} />
          </label>
          <label className="c4-lab">
            <span>{v4("brgPilot")}</span>
            <input className="c4-field" aria-label={v4("brgPilot")} value={pilot} disabled={viewer} onChange={(event) => setPilot(event.target.value)} />
          </label>
          <p className="c4-meta" role="status">{v4("brgOpenLoad")} {load}</p>
          <label className="c4-lab">
            <span>{v4("brgStation")}</span>
            <input className="c4-field" inputMode="numeric" aria-label={v4("brgStation")} value={station} disabled={viewer} onChange={(event) => setStation(event.target.value)} />
          </label>
          <label className="c4-lab">
            <span>{v4("brgInk")}</span>
            <select className="c4-select" aria-label={v4("brgInk")} value={ink} disabled={viewer} onChange={(event) => setInk(event.target.value)}>
              <option value="">{v4("brgBlankInk")}</option>
              <option value="ink">{v4("brgInkInk")}</option>
              <option value="chalk">{v4("brgInkChalk")}</option>
              <option value="gilt">{v4("brgInkGilt")}</option>
            </select>
          </label>
          <label className="c4-lab">
            <span>{v4("brgCipher")}</span>
            <input className="c4-field" aria-label={v4("brgCipher")} value={cipher} disabled={viewer} onChange={(event) => setCipher(event.target.value)} />
          </label>
          <label className="c4-lab">
            <span>{v4("brgGlaze")}</span>
            <select className="c4-select" aria-label={v4("brgGlaze")} value={glaze} disabled={viewer} onChange={(event) => setGlaze(event.target.value)}>
              <option value="">{v4("brgBlankGlaze")}</option>
              <option value="pearl">{v4("brgGlazePearl")}</option>
              <option value="brass">{v4("brgGlazeBrass")}</option>
              <option value="slate">{v4("brgGlazeSlate")}</option>
            </select>
          </label>
          <label className="c4-lab">
            <span>{v4("brgSpan")}</span>
            <select className="c4-select" aria-label={v4("brgSpan")} value={span} disabled={viewer} onChange={(event) => setSpan(event.target.value)}>
              <option value="">{v4("brgBlankSpan")}</option>
              <option value="2">{v4("brgSpan2")}</option>
              <option value="4">{v4("brgSpan4")}</option>
              <option value="8">{v4("brgSpan8")}</option>
            </select>
          </label>
          <label className="c4-lab">
            <span>{v4("brgCord")}</span>
            <select className="c4-select" aria-label={v4("brgCord")} value={cord} disabled={viewer} onChange={(event) => setCord(event.target.value)}>
              <option value="">{v4("brgBlankCord")}</option>
              <option value="3">{v4("brgCord3")}</option>
              <option value="7">{v4("brgCord7")}</option>
              <option value="11">{v4("brgCord11")}</option>
            </select>
          </label>
          <button type="submit" className="c4-btn c4-btn-hot" disabled={viewer}>{v4("brgAdd")}</button>
        </form>
        <div className="c4-brg-board">
          <div className="c4-row" role="tablist" aria-label={v4("brgCards")}>
            <button type="button" className="c4-chip" data-on={board === "cards" ? "1" : "0"} onClick={() => setBoard("cards")}>{v4("brgCards")}</button>
            <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard("timeline")}>{v4("brgTimeline")}</button>
            <button type="button" className="c4-chip" data-on={tray === "open" ? "1" : "0"} onClick={() => setTray("open")}>{v4("brgWaiting")}</button>
            <button type="button" className="c4-chip" data-on={tray === "fixed" ? "1" : "0"} onClick={() => setTray("fixed")}>{v4("brgFixed")}</button>
            <button type="button" className="c4-chip" data-on={tray === "filed" ? "1" : "0"} onClick={() => setTray("filed")}>{v4("brgFiled")}</button>
            <button type="button" className="c4-chip" data-on={slateOnly ? "1" : "0"} aria-pressed={slateOnly} onClick={() => setSlateOnly((value) => !value)}>{v4("brgSlateOnly")}</button>
          </div>
          <label className="c4-lab">
            <span>{v4("brgSearch")}</span>
            <input ref={searchRef} className="c4-field" aria-label={v4("brgSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              event.preventDefault();
              setQuery("");
            }} />
          </label>
          <label className="c4-lab">
            <span>{v4("brgDeskStation")}</span>
            <input className="c4-field" inputMode="numeric" aria-label={v4("brgDeskStation")} value={desk} onChange={(event) => setDesk(event.target.value)} />
          </label>
          <p className="c4-meta" role="status">{v4("brgNext")} {nextCard ? nextCard.title : v4("brgNextNone")}</p>
          <div className="c4-row">
            <label className="c4-lab">
              <span>{v4("brgPilots")}</span>
              <select className="c4-select" aria-label={v4("brgPilots")} value={pilotOn} onChange={(event) => setPilotFilter(event.target.value)}>
                <option value="all">{v4("brgAllPilots")}</option>
                <option value="blank">{v4("brgBlankPilot")}</option>
                {pilots.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>
            <label className="c4-lab">
              <span>{v4("brgInks")}</span>
              <select className="c4-select" aria-label={v4("brgInks")} value={inkOn} onChange={(event) => setInkFilter(event.target.value)}>
                <option value="all">{v4("brgAllInks")}</option>
                <option value="blank">{v4("brgBlankInk")}</option>
                {inks.map((name) => <option key={name} value={name}>{inkName(v4, name)}</option>)}
              </select>
            </label>
            <label className="c4-lab">
              <span>{v4("brgCiphers")}</span>
              <select className="c4-select" aria-label={v4("brgCiphers")} value={cipherOn} onChange={(event) => setCipherFilter(event.target.value)}>
                <option value="all">{v4("brgAllCiphers")}</option>
                <option value="blank">{v4("brgBlankCipher")}</option>
                {ciphers.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>
            <label className="c4-lab">
              <span>{v4("brgGlazes")}</span>
              <select className="c4-select" aria-label={v4("brgGlazes")} value={glazeOn} onChange={(event) => setGlazeFilter(event.target.value)}>
                <option value="all">{v4("brgAllGlazes")}</option>
                <option value="blank">{v4("brgBlankGlaze")}</option>
                {glazes.map((name) => <option key={name} value={name}>{glazeName(v4, name)}</option>)}
              </select>
            </label>
          </div>
          <div className="c4-row" role="group" aria-label={v4("brgStations")}>
            <button type="button" className="c4-chip" data-on={stationOn === "all" ? "1" : "0"} onClick={() => setStationFilter("all")}>{v4("brgAllStations")}</button>
            {["blank", "dawn", "day", "dusk", "peak", "quiet", "1", "2", "3", "4", "5", "6", "7", "8"].map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={stationOn === name ? "1" : "0"} onClick={() => setStationFilter(stationOn === name ? "all" : name)}>{stationName(v4, name)}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("brgSpans")}>
            <button type="button" className="c4-chip" data-on={spanOn === "all" ? "1" : "0"} onClick={() => setSpanFilter("all")}>{v4("brgAllSpans")}</button>
            {["blank", "2", "4", "8"].map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={spanOn === name ? "1" : "0"} onClick={() => setSpanFilter(spanOn === name ? "all" : name)}>{name === "blank" ? v4("brgBlankSpan") : spanName(v4, Number(name))}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("brgCords")}>
            <button type="button" className="c4-chip" data-on={cordOn === "all" ? "1" : "0"} onClick={() => setCordFilter("all")}>{v4("brgAllCords")}</button>
            {["blank", "3", "7", "11"].map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={cordOn === name ? "1" : "0"} onClick={() => setCordFilter(cordOn === name ? "all" : name)}>{name === "blank" ? v4("brgBlankCord") : cordName(v4, Number(name))}</button>
            ))}
          </div>
          <form className="c4-row" onSubmit={(event) => {
            event.preventDefault();
            if (viewer) return;
            const next = addBearingView(views, {
              id: `view-${Date.now()}`,
              name: viewName,
              tray,
              query,
              pilot: pilotOn,
              ink: inkOn,
              cipher: cipherOn,
              glaze: glazeOn,
              station: stationOn,
              span: spanOn,
              cord: cordOn,
            });
            if (next.length === views.length) return;
            storeViews(next);
            setViewName("");
          }}>
            <label className="c4-lab">
              <span>{v4("brgViews")}</span>
              <input className="c4-field" aria-label={v4("brgViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
            </label>
            <button type="submit" className="c4-btn" disabled={viewer}>{v4("brgSaveView")}</button>
          </form>
          <ul className="c4-brg-views" aria-label={v4("brgViews")}>
            {views.map((view) => (
              <li key={view.id}>
                <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropBearingView(views, view.id))}>{v4("brgDropView")}</button>
              </li>
            ))}
          </ul>
          <div className="c4-row">
            <button type="button" className="c4-btn" onClick={() => download("map-bearings.csv", bearingsCsv(cards, desk))}>{v4("brgCsv")}</button>
            <button type="button" className="c4-btn" onClick={() => setPicked(shown.map((card) => card.id))}>{v4("brgPickAll")}</button>
            <button type="button" className="c4-btn" onClick={() => setPicked([])}>{v4("brgPickNone")}</button>
            <span className="c4-meta">{v4("brgPicked")} {picked.length}</span>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBearingPin(cards, targets, true))}>{v4("brgBulkPin")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBearingFile(cards, targets, true))}>{v4("brgBulkFile")}</button>
            <label className="c4-lab">
              <span>{v4("brgBulkInk")}</span>
              <select className="c4-select" aria-label={v4("brgBulkInk")} value={moveInk} disabled={viewer} onChange={(event) => setMoveInk(event.target.value)}>
                <option value="ink">{v4("brgInkInk")}</option>
                <option value="chalk">{v4("brgInkChalk")}</option>
                <option value="gilt">{v4("brgInkGilt")}</option>
              </select>
            </label>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBearingInk(cards, targets, moveInk))}>{v4("brgBulkInk")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(resetBearings()); setPicked([]); }}>{v4("brgReset")}</button>
          </div>
          {!shown.length && board === "cards" && <p className="c4-brg-empty">{v4("brgEmpty")}</p>}
          {board === "cards" && (
            <ul className="c4-brg-cards">
              {shown.map((card) => {
                const band = stationBand(card.station);
                const gap = gapLabel(v4, card.station, desk);
                const late = lateBearing(card, desk);
                const clashesOn = stationClashIds(cards, card.id);
                const spansOn = spanClashIds(cards, card.id);
                const openEdit = editing === card.id;
                return (
                  <li key={card.id} data-ink={inkOf(card.ink)} data-glaze={glazeOf(card.glaze)} data-pinned={card.pinned ? "1" : "0"}>
                    <label className="c4-row">
                      <input type="checkbox" checked={picked.includes(card.id)} onChange={() => togglePick(card.id)} aria-label={card.title} />
                      <span className="c4-brg-mark" aria-hidden="true">{stationLabel(card.station)}</span>
                    </label>
                    <div>
                      {openEdit ? (
                        <form onSubmit={(event) => {
                          event.preventDefault();
                          if (viewer) return;
                          store(editBearingNote(editBearing(cards, card.id, draft), card.id, noteDraft));
                          setEditing("");
                        }}>
                          <input className="c4-field" aria-label={v4("brgLine")} value={draft} onChange={(event) => setDraft(event.target.value)} />
                          <input className="c4-field" aria-label={v4("brgNote")} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} />
                          <button type="submit" className="c4-btn" disabled={viewer}>{v4("brgEdit")}</button>
                        </form>
                      ) : (
                        <>
                          <p>{card.title}</p>
                          <p className="c4-meta">{card.note}</p>
                        </>
                      )}
                      <p className="c4-meta">
                        {card.pilot || v4("brgBlankPilot")}
                        {" · "}
                        {inkName(v4, card.ink)}
                        {" · "}
                        {card.cipher || v4("brgBlankCipher")}
                        {" · "}
                        {glazeName(v4, glazeOf(card.glaze))}
                        {" · "}
                        {spanName(v4, card.span)}
                        {" · "}
                        {cordName(v4, card.cord)}
                        {band === "blank" ? "" : ` · ${stationName(v4, band)}`}
                        {gap ? ` · ${gap}` : ""}
                        {late ? ` · ${v4("brgLate")}` : ""}
                        {soonBearing(card) ? ` · ${v4("brgSoon")}` : ""}
                        {homeCipher(card.cipher) ? ` · ${v4("brgHome")}` : ""}
                        {auditName(v4, card.audit) ? ` · ${v4("brgAudit")} ${auditName(v4, card.audit)}` : ""}
                        {" · "}
                        {clashesOn.length ? `${v4("brgClash")} ${clashesOn.length}` : v4("brgClashNone")}
                        {" · "}
                        {spansOn.length ? `${v4("brgSpanClash")} ${spansOn.length}` : v4("brgSpanClashNone")}
                      </p>
                    </div>
                    <div className="c4-row">
                      <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("brgCopied") : v4("brgCopy")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); setNoteDraft(card.note); }}>{v4("brgEdit")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleGlaze(cards, card.id))}>{v4("brgGlazeUp")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.pinned} onClick={() => store(setBearingPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("brgUnpin") : v4("brgPin")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.fixed} onClick={() => store(setBearingFix(cards, card.id, !card.fixed))}>{card.fixed ? v4("brgLift") : v4("brgFixOn")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.filed} onClick={() => store(setBearingFile(cards, card.id, !card.filed))}>{card.filed ? v4("brgUnfile") : v4("brgFile")}</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {board === "timeline" && (
            <ol className="c4-brg-time">
              {timeline.map((card) => (
                <li key={card.id}>
                  <span className="c4-brg-clock">{stationLabel(card.station)}</span>
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

export function MailSeals({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenBands, setHiddenBands] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [depth, setDepth] = useState("all");
  const [showHidden, setShowHidden] = useState(false);
  const [review, setReview] = useState<"all" | "reviewed" | "open">("all");
  const [shape, setShape] = useState<SealShape>("all");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState("");
  const rows = useMemo(() => (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || "").trim(),
      note: row.email,
    };
  }).filter((row): row is GlanceRow => Boolean(row)), [data.data]);
  const present = presentSeals(rows);
  const presentKey = present.join("\n");
  const presentIds = rows.map((row) => row.id);
  const idKey = presentIds.join("\n");
  const bandsOn = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of rows) {
      const state = sealState(row.note);
      if (state === "") continue;
      const band = state === "set" ? sealBand(row.note) : "";
      counts.set(band, (counts.get(band) || 0) + 1);
    }
    return ["", ...BANDS].map((band) => ({ band, count: counts.get(band) || 0 })).filter((line) => line.count);
  }, [rows]);
  const depthNames = ["plain", "pair", "stack", "seam", "rail", "figure"].filter((name) => rows.some((row) => sealDepth(row.note) === name));
  const bandNames = present.filter((band) => band !== "blank");
  const leadBand = leadingSeal(rows);
  const leadDepth = leadingSealDepth(rows);
  const odd = oddSealCount(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const known = presentKey ? presentKey.split("\n") : [];
    const next = readHiddenSeals(readJson(SEAL_KEY, []), known);
    setHiddenBands(next);
    writeJson(SEAL_KEY, next);
  }, [loading, failed, presentKey]);
  useEffect(() => {
    if (loading || failed) return;
    const known = idKey ? idKey.split("\n") : [];
    const next = readReviewedSeals(readJson(SEAL_REVIEW_KEY, []), known);
    setReviewed(next);
    writeJson(SEAL_REVIEW_KEY, next);
  }, [loading, failed, idKey]);
  const chips = visibleSealBands(present, hiddenBands, showHidden);
  const depthOn = activeSealDepth(depth, depthNames);
  const bandOn = selected ? activeSeal(selected, bandNames) : "all";
  const shown = visibleSealCustomers(
    rows,
    selected ? sealArg(bandOn === "all" && selected === "blank" ? "blank" : bandOn) : null,
    sealDepthArg(depthOn),
    query,
    review,
    reviewed,
    shape,
  );
  const widest = Math.max(1, ...bandsOn.map((line) => line.count));
  const setCount = rows.filter((row) => sealState(row.note) === "set").length;
  const openCount = rows.filter((row) => !reviewed.includes(row.id)).length;

  function store(next: string[], clear: string) {
    setHiddenBands(next);
    writeJson(SEAL_KEY, next);
    if (clear && selected === clear) setSelected("");
  }

  function storeReview(next: string[]) {
    setReviewed(next);
    writeJson(SEAL_REVIEW_KEY, next);
  }

  function copyCode(row: GlanceRow) {
    const body = sealCopy(row.note);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(row.id);
  }

  return (
    <section className="c4-mls" aria-label={v4("mlsTitle")} data-seals="1">
      <header className="c4-mls-head">
        <div>
          <p className="c4-brg-kicker">{v4("mlsSub")}</p>
          <h2 className="c4-title">{v4("mlsTitle")}</h2>
        </div>
        <p className="c4-brg-count">{v4("mlsRows")} {rows.length}</p>
      </header>
      <details className="c4-brg-rules">
        <summary>{v4("mlsRules")}</summary>
        <p className="c4-meta">{v4("mlsHint")}</p>
        <p className="c4-meta">{v4("mlsKept")}</p>
        <p className="c4-meta">{v4("mlsEscape")}</p>
      </details>
      <p className="c4-brg-notice" role="status">
        <span>{v4("mlsSetNotice")}</span>
        <span className="c4-brg-count">{setCount}</span>
      </p>
      <p className="c4-brg-notice" role="status">
        <span>{v4("mlsUnreviewed")}</span>
        <span className="c4-brg-count">{openCount}</span>
      </p>
      <p className="c4-brg-notice" role="status">
        <span>{v4("mlsOdd")}</span>
        <span className="c4-brg-count">{odd}</span>
        <button type="button" className="c4-btn" aria-pressed={shape === "odd"} onClick={() => setShape(shape === "odd" ? "all" : "odd")}>
          {shape === "odd" ? v4("mlsAllShapes") : v4("mlsOddOnly")}
        </button>
        <button type="button" className="c4-btn" aria-pressed={shape === "plus"} onClick={() => setShape(shape === "plus" ? "all" : "plus")}>{v4("mlsPlus")}</button>
      </p>
      {leadBand ? <p className="c4-mls-lead"><span>{v4("mlsLeadBand")}</span> {bandName(v4, leadBand)}</p> : null}
      {leadDepth ? <p className="c4-mls-lead"><span>{v4("mlsLeadDepth")}</span> {depthName(v4, leadDepth)}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("mlsBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("mail-seals.csv", sealsCsv(rows))}>{v4("mlsCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("mail-seal-rows.csv", sealRowsCsv(rows, reviewed))}>{v4("mlsRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => storeReview(bulkSealReview(reviewed, shown.map((row) => row.id), presentIds, true))}>{v4("mlsBulkReview")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("mlsLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("mlsFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-brg-empty">{v4("mlsNone")}</p>}
      {bandsOn.length > 0 && (
        <section className="c4-mls-chart" aria-label={v4("mlsAllBands")}>
          {bandsOn.map((line) => {
            const share = sealShare(line.count, rows.length);
            const bar = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.band || "blank";
            return (
              <p key={name} className="c4-mls-col" data-band={name}>
                <span>{bandName(v4, line.band)}</span>
                <span className="c4-brg-track" aria-hidden="true"><i style={{ width: `${bar}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("mlsShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      <div className="c4-row" role="group" aria-label={v4("mlsShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("mlsShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("mlsHidden")}</button>
      </div>
      <div className="c4-mls-bands" role="group" aria-label={v4("mlsAllBands")}>
        <button type="button" className="c4-mls-band" data-on={!selected ? "1" : "0"} aria-pressed={!selected} onClick={() => setSelected("")}>
          <span>{v4("mlsAllBands")}</span>
          <span className="c4-brg-count">{rows.length}</span>
        </button>
        {chips.map((item) => {
          const name = item || "blank";
          const count = bandsOn.find((line) => (line.band || "blank") === name)?.count || 0;
          return (
            <div key={name} className="c4-mls-band" data-on={selected === name ? "1" : "0"}>
              <button type="button" aria-pressed={selected === name} onClick={() => setSelected(selected === name ? "" : name)}>
                <span>{bandName(v4, item)}</span>
                <span className="c4-brg-count">{count}</span>
              </button>
              <button type="button" className="c4-btn" onClick={() => store(toggleSeal(hiddenBands, name, present), name)}>{showHidden ? v4("mlsShow") : v4("mlsHide")}</button>
            </div>
          );
        })}
      </div>
      <div className="c4-row" role="group" aria-label={v4("mlsDepths")}>
        <button type="button" className="c4-chip" data-on={depthOn === "all" ? "1" : "0"} aria-pressed={depthOn === "all"} onClick={() => setDepth("all")}>{v4("mlsAllDepths")}</button>
        {depthNames.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={depthOn === name ? "1" : "0"} aria-pressed={depthOn === name} onClick={() => setDepth(depthOn === name ? "all" : name)}>{depthName(v4, name)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("mlsShapes")}>
        <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} aria-pressed={review === "all"} onClick={() => setReview("all")}>{v4("mlsAllMarks")}</button>
        <button type="button" className="c4-chip" data-on={review === "open" ? "1" : "0"} aria-pressed={review === "open"} onClick={() => setReview("open")}>{v4("mlsOpenMarks")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} aria-pressed={review === "reviewed"} onClick={() => setReview("reviewed")}>{v4("mlsReviewed")}</button>
      </div>
      <label className="c4-lab">
        <span>{v4("mlsSearch")}</span>
        <input className="c4-field" aria-label={v4("mlsSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-brg-empty">{v4("mlsEmpty")}</p>}
      <ul className="c4-mls-rows">
        {shown.map((row) => {
          const band = sealBand(row.note);
          const deep = sealDepth(row.note);
          const words = sealWords(row.note);
          const seen = reviewed.includes(row.id);
          const joined = plusSeal(row.note);
          return (
            <li key={row.id} data-band={band || "blank"} data-reviewed={seen ? "1" : "0"} data-plus={joined ? "1" : "0"}>
              <div>
                <p>{row.label || row.id}</p>
                <p className="c4-meta">{bandName(v4, band || (sealState(row.note) === "clear" ? "blank" : ""))} · {depthName(v4, deep)} · {v4("mlsParts")} {words}</p>
              </div>
              <div className="c4-row">
                <button type="button" className="c4-btn" onClick={() => copyCode(row)}>{copied === row.id ? v4("mlsCopied") : v4("mlsCopy")}</button>
                <button type="button" className="c4-btn" aria-pressed={seen} onClick={() => storeReview(toggleSealReview(reviewed, row.id, presentIds))}>{v4("mlsReview")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
