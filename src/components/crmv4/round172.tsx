"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  BAY_KEY,
  BAY_VIEW_KEY,
  STRIKE_KEY,
  activeBay,
  activeGuide,
  activeLamp,
  activePace,
  activeRest,
  activeStep,
  activeStrike,
  activeStrikeDepth,
  activeWing,
  addBay,
  addBayView,
  bayArg,
  bayBand,
  bayClashIds,
  bayCopy,
  bayCounts,
  bayGap,
  bayGuides,
  bayLamps,
  bayPaces,
  bayShare,
  bayTimeline,
  bayWings,
  baysCsv,
  bulkBayFile,
  bulkBayPace,
  bulkBayPin,
  clashBayCount,
  cycleLamp,
  dropBayView,
  editBay,
  editBayNote,
  guideArg,
  guideLoad,
  lampArg,
  lampOf,
  lateBay,
  leadingStrike,
  leadingStrikeDepth,
  nextBay,
  paceArg,
  paceCounts,
  paceOf,
  presentStrikes,
  readBayViews,
  readBays,
  readHiddenStrikes,
  resetBays,
  restArg,
  setBayFiled,
  setBayPin,
  setBayWalk,
  stepArg,
  stepClashCount,
  stepClashIds,
  strikeArg,
  strikeBand,
  strikeBands,
  strikeCount,
  strikeDepth,
  strikeDepthArg,
  strikeDepths,
  strikeShare,
  strikeState,
  strikesCsv,
  suggestGuide,
  suggestPace,
  toggleStrike,
  visibleBays,
  visibleStrikeBands,
  visibleStrikeCustomers,
  wingArg,
  type Bay,
  type BayLamp,
  type BayPace,
  type BayTray,
  type BayView,
  type StrikeBand,
  type StrikeDepth,
  type StrikeRow,
} from "@/lib/crmv4/round172";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  failedLoginCount?: number | null;
};

type GlanceRow = StrikeRow & { id: string };

const PACES = ["amble", "stride", "dash"] as const;
const BANDS = ["quiet", "spark", "heat", "blaze"] as const;

function paceName(v4: V4, pace: BayPace | string): string {
  if (pace === "amble") return v4("arcPaceAmble");
  if (pace === "stride") return v4("arcPaceStride");
  if (pace === "dash") return v4("arcPaceDash");
  return v4("arcBlankPace");
}

function lampName(v4: V4, lamp: BayLamp): string {
  if (lamp === "wick") return v4("arcWick");
  if (lamp === "glow") return v4("arcGlow");
  if (lamp === "flare") return v4("arcFlare");
  return v4("arcBlankLamp");
}

function bayName(v4: V4, name: string): string {
  if (name === "near") return v4("arcNear");
  if (name === "mid") return v4("arcMid");
  if (name === "far") return v4("arcFar");
  if (name === "end") return v4("arcEnd");
  if (name === "body") return v4("arcBody");
  if (/^[1-8]$/.test(name)) return name;
  return v4("arcBlankBay");
}

function stepName(v4: V4, step: number | null): string {
  if (step === 1) return v4("arcStep1");
  if (step === 2) return v4("arcStep2");
  if (step === 3) return v4("arcStep3");
  return v4("arcBlankStep");
}

function restName(v4: V4, rest: number | null): string {
  if (rest === 5) return v4("arcRest5");
  if (rest === 10) return v4("arcRest10");
  if (rest === 15) return v4("arcRest15");
  if (rest === 20) return v4("arcRest20");
  return v4("arcBlankRest");
}

function bandName(v4: V4, name: string): string {
  if (name === "quiet") return v4("stkQuiet");
  if (name === "spark") return v4("stkSpark");
  if (name === "heat") return v4("stkHeat");
  if (name === "blaze") return v4("stkBlaze");
  if (name === "blank") return v4("stkClear");
  return v4("stkUnmarked");
}

function depthName(v4: V4, name: string): string {
  if (name === "near") return v4("stkNear");
  if (name === "mid") return v4("stkMid");
  if (name === "far") return v4("stkFar");
  return v4("stkUnmarked");
}

function auditName(v4: V4, audit: string): string {
  const key = {
    save: "arcAuditSave",
    edit: "arcAuditEdit",
    lamp: "arcAuditLamp",
    pin: "arcAuditPin",
    unpin: "arcAuditUnpin",
    walk: "arcAuditWalk",
    pause: "arcAuditPause",
    file: "arcAuditFile",
    reopen: "arcAuditReopen",
    move: "arcAuditMove",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function bayLabel(bay: number | null): string {
  return bay === null ? "—" : String(bay);
}

function gapLabel(v4: V4, bay: number | null, desk: string): string {
  const gap = bayGap(bay, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("arcPast")} ${gap}`;
  if (gap < 0) return `${v4("arcAhead")} ${Math.abs(gap)}`;
  return v4("arcDue");
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

function sameCards(left: readonly Bay[], right: readonly Bay[]): boolean {
  return left.length === right.length && left.every((card, index) => card.id === right[index]?.id && card.title === right[index]?.title && card.note === right[index]?.note && card.audit === right[index]?.audit);
}

export function ArcadeBays({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<Bay[]>([]);
  const [views, setViews] = useState<BayView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [guide, setGuide] = useState("");
  const [bay, setBay] = useState("");
  const [pace, setPace] = useState("");
  const [wing, setWing] = useState("");
  const [lamp, setLamp] = useState("");
  const [step, setStep] = useState("");
  const [rest, setRest] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<BayTray>("open");
  const [guideFilter, setGuideFilter] = useState("all");
  const [paceFilter, setPaceFilter] = useState("all");
  const [wingFilter, setWingFilter] = useState("all");
  const [lampFilter, setLampFilter] = useState("all");
  const [bayFilter, setBayFilter] = useState("all");
  const [stepFilter, setStepFilter] = useState("all");
  const [restFilter, setRestFilter] = useState("all");
  const [flareOnly, setFlareOnly] = useState(false);
  const [endOnly, setEndOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [desk, setDesk] = useState("");
  const [movePace, setMovePace] = useState("amble");
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readBays(readJson(BAY_KEY, []));
    const saved = readBayViews(readJson(BAY_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(BAY_KEY, next);
    writeJson(BAY_VIEW_KEY, saved);
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
  const guides = bayGuides(cards);
  const paces = bayPaces(cards);
  const wings = bayWings(cards);
  const lamps = bayLamps(cards);
  const bars = paceCounts(cards);
  const guideOn = activeGuide(guideFilter, guides);
  const paceOn = activePace(paceFilter, PACES);
  const wingOn = activeWing(wingFilter, wings);
  const lampOn = activeLamp(lampFilter, lamps);
  const bayOn = activeBay(bayFilter);
  const stepOn = activeStep(stepFilter);
  const restOn = activeRest(restFilter);
  const pickedBay = bayArg(bayOn);
  const shown = visibleBays(
    cards,
    tray,
    query,
    guideArg(guideOn),
    paceArg(paceOn),
    wingArg(wingOn),
    lampArg(lampOn),
    pickedBay.exact,
    pickedBay.pick,
    stepArg(stepOn),
    restArg(restOn),
    flareOnly,
    endOnly,
  );
  const timeline = bayTimeline(cards, query);
  const counts = bayCounts(cards, desk);
  const clashes = clashBayCount(cards);
  const stepClashes = stepClashCount(cards);
  const total = cards.length;
  const nextId = nextBay(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const widest = Math.max(1, ...bars);
  const pinned = cards.filter((card) => card.pinned);
  const load = guideLoad(cards, guide);
  const suggested = suggestPace(cards);
  const lightGuide = suggestGuide(cards);
  const targets = picked.length ? picked : shown.map((card) => card.id);

  function store(next: Bay[]) {
    setCards(next);
    writeJson(BAY_KEY, next);
  }

  function storeViews(next: BayView[]) {
    setViews(next);
    writeJson(BAY_VIEW_KEY, next);
  }

  function clearDraft() {
    setTitle("");
    setNote("");
    setGuide("");
    setBay("");
    setPace("");
    setWing("");
    setLamp("");
    setStep("");
    setRest("");
  }

  function copyCard(card: Bay) {
    const body = bayCopy(card.title);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(card.id);
  }

  function applyView(view: BayView) {
    setTray(view.tray);
    setQuery(view.query);
    setGuideFilter(activeGuide(view.guide, bayGuides(cards)));
    setPaceFilter(activePace(view.pace, PACES));
    setWingFilter(activeWing(view.wing, bayWings(cards)));
    setLampFilter(activeLamp(view.lamp, bayLamps(cards)));
    setBayFilter(activeBay(view.bay));
    setStepFilter(activeStep(view.step));
    setRestFilter(activeRest(view.rest));
    setBoard("cards");
    setFlareOnly(false);
    setEndOnly(false);
  }

  function togglePick(id: string) {
    setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <section className="c4-arc" aria-label={v4("arcTitle")} data-bays="1" data-role={role}>
      <header className="c4-arc-head">
        <p className="c4-arc-plate" data-logo="mono">{v4("arcLogo")}</p>
        <div>
          <p className="c4-arc-kicker">{v4("arcSub")}</p>
          <h2 className="c4-title">{v4("arcTitle")}</h2>
        </div>
        <p className="c4-arc-count">{shown.length}</p>
      </header>
      <details className="c4-arc-rules">
        <summary>{v4("arcRules")}</summary>
        <p className="c4-meta">{v4("arcHint")}</p>
        <p className="c4-meta">{v4("arcLocal")}</p>
        <p className="c4-meta">{v4("arcBlank")}</p>
        <p className="c4-meta">{v4("arcGuideBlank")}</p>
        <p className="c4-meta">{v4("arcBayBlank")}</p>
        <p className="c4-meta">{v4("arcPaceBlank")}</p>
        <p className="c4-meta">{v4("arcWingBlank")}</p>
        <p className="c4-meta">{v4("arcLampBlank")}</p>
        <p className="c4-meta">{v4("arcStepBlank")}</p>
        <p className="c4-meta">{v4("arcRestBlank")}</p>
        <p className="c4-meta">{v4("arcNoteBlank")}</p>
        <p className="c4-meta">{v4("arcEscape")}</p>
        <p className="c4-meta">{v4("arcSlash")}</p>
        <p className="c4-meta">{v4("arcNew")}</p>
      </details>
      {viewer ? <p className="c4-arc-notice" role="status">{v4("arcViewer")}</p> : null}
      <p className="c4-arc-notice" role="status">
        <span>{v4("arcNotice")}</span>
        <span className="c4-arc-count">{counts.end}</span>
        <button type="button" className="c4-btn" aria-pressed={endOnly} onClick={() => { setEndOnly((value) => !value); setTray("open"); setBoard("cards"); }}>
          {endOnly ? v4("arcNoticeAll") : v4("arcNoticeEnd")}
        </button>
      </p>
      <p className="c4-arc-notice" role="status">
        <span>{v4("arcLate")}</span>
        <span className="c4-arc-count">{counts.late}</span>
      </p>
      <p className="c4-arc-notice" role="status">
        <span>{v4("arcClash")}</span>
        <span className="c4-arc-count">{clashes}</span>
      </p>
      <p className="c4-arc-notice" role="status">
        <span>{v4("arcStepClash")}</span>
        <span className="c4-arc-count">{stepClashes}</span>
      </p>
      <p className="c4-arc-suggest" role="status">
        <span>{v4("arcSuggest")}</span>
        <strong>{paceName(v4, suggested)}</strong>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setPace(suggested)}>{v4("arcUsePace")}</button>
      </p>
      <p className="c4-arc-suggest" role="status">
        <span>{v4("arcSuggestGuide")}</span>
        <strong>{lightGuide || v4("arcBlankGuide")}</strong>
        <button type="button" className="c4-btn" disabled={viewer || !lightGuide} onClick={() => setGuide(lightGuide)}>{v4("arcUseGuide")}</button>
      </p>
      {pinned.length > 0 && (
        <ul className="c4-arc-pins" aria-label={v4("arcPinned")}>
          {pinned.map((card) => (
            <li key={card.id}>
              <button type="button" className="c4-chip" onClick={() => { setQuery(card.title); setBoard("cards"); }}>{card.title}</button>
            </li>
          ))}
        </ul>
      )}
      <section className="c4-arc-kpi" aria-label={v4("arcKpi")}>
        {(["open", "walked", "filed", "pinned"] as const).map((key) => {
          const count = counts[key];
          const share = bayShare(count, total);
          const label = key === "open" ? v4("arcWaiting") : key === "walked" ? v4("arcWalked") : key === "filed" ? v4("arcFiled") : v4("arcPin");
          return (
            <p key={key} className="c4-arc-meter" data-tray={key}>
              <span>{label}</span>
              <strong>{count}</strong>
              <span>{v4("arcShare")} {share}%</span>
              <span className="c4-arc-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <section className="c4-arc-chart" aria-label={v4("arcChart")}>
        <p className="c4-arc-kicker">{v4("arcChart")}</p>
        {PACES.map((name, index) => {
          const count = bars[index] || 0;
          const width = Math.max(8, Math.round((count / widest) * 100));
          return (
            <button key={name} type="button" className="c4-arc-col" data-on={paceOn === name ? "1" : "0"} aria-pressed={paceOn === name} onClick={() => setPaceFilter(paceOn === name ? "all" : name)}>
              <span>{paceName(v4, name)}</span>
              <span className="c4-arc-bar" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
              <span>{count}</span>
            </button>
          );
        })}
      </section>
      <div className="c4-arc-split">
        <form className="c4-arc-form" onSubmit={(event) => {
          event.preventDefault();
          if (viewer) return;
          const next = addBay(cards, { id: `arc-${Date.now()}`, title, note, guide, bay, pace, wing, lamp, step, rest });
          if (sameCards(next, cards)) return;
          store(next);
          clearDraft();
        }}>
          <label className="c4-lab">
            <span>{v4("arcLine")}</span>
            <input ref={titleRef} className="c4-field" aria-label={v4("arcLine")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              event.preventDefault();
              clearDraft();
            }} />
          </label>
          <label className="c4-lab">
            <span>{v4("arcNote")}</span>
            <input className="c4-field" aria-label={v4("arcNote")} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} />
          </label>
          <label className="c4-lab">
            <span>{v4("arcGuide")}</span>
            <input className="c4-field" aria-label={v4("arcGuide")} value={guide} disabled={viewer} onChange={(event) => setGuide(event.target.value)} />
          </label>
          <p className="c4-meta" role="status">{v4("arcLoad")} {load}</p>
          <label className="c4-lab">
            <span>{v4("arcBay")}</span>
            <input className="c4-field" inputMode="numeric" aria-label={v4("arcBay")} value={bay} disabled={viewer} onChange={(event) => setBay(event.target.value)} />
          </label>
          <label className="c4-lab">
            <span>{v4("arcPace")}</span>
            <select className="c4-select" aria-label={v4("arcPace")} value={pace} disabled={viewer} onChange={(event) => setPace(event.target.value)}>
              <option value="">{v4("arcBlankPace")}</option>
              <option value="amble">{v4("arcPaceAmble")}</option>
              <option value="stride">{v4("arcPaceStride")}</option>
              <option value="dash">{v4("arcPaceDash")}</option>
            </select>
          </label>
          <label className="c4-lab">
            <span>{v4("arcWing")}</span>
            <input className="c4-field" aria-label={v4("arcWing")} value={wing} disabled={viewer} onChange={(event) => setWing(event.target.value)} />
          </label>
          <label className="c4-lab">
            <span>{v4("arcLamp")}</span>
            <select className="c4-select" aria-label={v4("arcLamp")} value={lamp} disabled={viewer} onChange={(event) => setLamp(event.target.value)}>
              <option value="">{v4("arcBlankLamp")}</option>
              <option value="wick">{v4("arcWick")}</option>
              <option value="glow">{v4("arcGlow")}</option>
              <option value="flare">{v4("arcFlare")}</option>
            </select>
          </label>
          <label className="c4-lab">
            <span>{v4("arcStep")}</span>
            <select className="c4-select" aria-label={v4("arcStep")} value={step} disabled={viewer} onChange={(event) => setStep(event.target.value)}>
              <option value="">{v4("arcBlankStep")}</option>
              <option value="1">{v4("arcStep1")}</option>
              <option value="2">{v4("arcStep2")}</option>
              <option value="3">{v4("arcStep3")}</option>
            </select>
          </label>
          <label className="c4-lab">
            <span>{v4("arcRest")}</span>
            <select className="c4-select" aria-label={v4("arcRest")} value={rest} disabled={viewer} onChange={(event) => setRest(event.target.value)}>
              <option value="">{v4("arcBlankRest")}</option>
              <option value="5">{v4("arcRest5")}</option>
              <option value="10">{v4("arcRest10")}</option>
              <option value="15">{v4("arcRest15")}</option>
              <option value="20">{v4("arcRest20")}</option>
            </select>
          </label>
          <button type="submit" className="c4-btn" disabled={viewer}>{v4("arcAdd")}</button>
        </form>
        <div className="c4-arc-board">
          <div className="c4-row" role="group" aria-label={v4("arcTitle")}>
            <button type="button" className="c4-chip" data-on={tray === "open" ? "1" : "0"} aria-pressed={tray === "open"} onClick={() => setTray("open")}>{v4("arcWaiting")}</button>
            <button type="button" className="c4-chip" data-on={tray === "walked" ? "1" : "0"} aria-pressed={tray === "walked"} onClick={() => setTray("walked")}>{v4("arcWalked")}</button>
            <button type="button" className="c4-chip" data-on={tray === "filed" ? "1" : "0"} aria-pressed={tray === "filed"} onClick={() => setTray("filed")}>{v4("arcFiled")}</button>
            <button type="button" className="c4-chip" data-on={board === "cards" ? "1" : "0"} aria-pressed={board === "cards"} onClick={() => setBoard("cards")}>{v4("arcCards")}</button>
            <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard("timeline")}>{v4("arcTimeline")}</button>
            <button type="button" className="c4-chip" data-on={flareOnly ? "1" : "0"} aria-pressed={flareOnly} onClick={() => setFlareOnly((value) => !value)}>{v4("arcFlareOnly")}</button>
            <button type="button" className="c4-chip" data-on={endOnly ? "1" : "0"} aria-pressed={endOnly} onClick={() => { setEndOnly((value) => !value); setTray("open"); }}>{v4("arcEndOnly")}</button>
            <button type="button" className="c4-btn" onClick={() => download("arcade-bays.csv", baysCsv(cards, desk))}>{v4("arcCsv")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setPicked(shown.map((card) => card.id))}>{v4("arcPickAll")}</button>
            <button type="button" className="c4-btn" onClick={() => setPicked([])}>{v4("arcPickNone")}</button>
            <span className="c4-arc-count">{v4("arcPicked")} {picked.length}</span>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBayPin(cards, targets, true))}>{v4("arcBulkPin")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBayFile(cards, targets, true))}>{v4("arcBulkFile")}</button>
            <label className="c4-lab">
              <span>{v4("arcBulkPace")}</span>
              <select className="c4-select" aria-label={v4("arcBulkPace")} value={movePace} disabled={viewer} onChange={(event) => setMovePace(event.target.value)}>
                <option value="amble">{v4("arcPaceAmble")}</option>
                <option value="stride">{v4("arcPaceStride")}</option>
                <option value="dash">{v4("arcPaceDash")}</option>
              </select>
            </label>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBayPace(cards, targets, movePace))}>{v4("arcBulkPace")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(resetBays()); setPicked([]); }}>{v4("arcReset")}</button>
          </div>
          <label className="c4-lab">
            <span>{v4("arcSearch")}</span>
            <input ref={searchRef} className="c4-field" aria-label={v4("arcSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              event.preventDefault();
              setQuery("");
            }} />
          </label>
          <label className="c4-lab">
            <span>{v4("arcDesk")}</span>
            <input className="c4-field" inputMode="numeric" aria-label={v4("arcDesk")} value={desk} onChange={(event) => setDesk(event.target.value)} />
          </label>
          <p className="c4-meta" role="status">
            {v4("arcNext")} {nextCard ? nextCard.title : v4("arcNextNone")}
          </p>
          <div className="c4-row" role="group" aria-label={v4("arcGuides")}>
            <button type="button" className="c4-chip" data-on={guideOn === "all" ? "1" : "0"} aria-pressed={guideOn === "all"} onClick={() => setGuideFilter("all")}>{v4("arcAllGuides")}</button>
            <button type="button" className="c4-chip" data-on={guideOn === "blank" ? "1" : "0"} aria-pressed={guideOn === "blank"} onClick={() => setGuideFilter("blank")}>{v4("arcBlankGuide")}</button>
            {guides.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={guideOn === name ? "1" : "0"} aria-pressed={guideOn === name} onClick={() => setGuideFilter(name)}>{name}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("arcPaces")}>
            <button type="button" className="c4-chip" data-on={paceOn === "all" ? "1" : "0"} aria-pressed={paceOn === "all"} onClick={() => setPaceFilter("all")}>{v4("arcAllPaces")}</button>
            <button type="button" className="c4-chip" data-on={paceOn === "blank" ? "1" : "0"} aria-pressed={paceOn === "blank"} onClick={() => setPaceFilter("blank")}>{v4("arcBlankPace")}</button>
            {paces.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={paceOn === name ? "1" : "0"} aria-pressed={paceOn === name} onClick={() => setPaceFilter(name)}>{paceName(v4, name)}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("arcWings")}>
            <button type="button" className="c4-chip" data-on={wingOn === "all" ? "1" : "0"} aria-pressed={wingOn === "all"} onClick={() => setWingFilter("all")}>{v4("arcAllWings")}</button>
            <button type="button" className="c4-chip" data-on={wingOn === "blank" ? "1" : "0"} aria-pressed={wingOn === "blank"} onClick={() => setWingFilter("blank")}>{v4("arcBlankWing")}</button>
            {wings.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={wingOn === name ? "1" : "0"} aria-pressed={wingOn === name} onClick={() => setWingFilter(name)}>{name}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("arcLamps")}>
            <button type="button" className="c4-chip" data-on={lampOn === "all" ? "1" : "0"} aria-pressed={lampOn === "all"} onClick={() => setLampFilter("all")}>{v4("arcAllLamps")}</button>
            <button type="button" className="c4-chip" data-on={lampOn === "blank" ? "1" : "0"} aria-pressed={lampOn === "blank"} onClick={() => setLampFilter("blank")}>{v4("arcBlankLamp")}</button>
            {lamps.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={lampOn === name ? "1" : "0"} aria-pressed={lampOn === name} onClick={() => setLampFilter(name)}>{lampName(v4, name)}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("arcBays")}>
            {(["all", "blank", "near", "mid", "far", "end", "body"] as const).map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={bayOn === name ? "1" : "0"} aria-pressed={bayOn === name} onClick={() => setBayFilter(name)}>
                {name === "all" ? v4("arcAllBays") : bayName(v4, name)}
              </button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("arcSteps")}>
            {(["all", "blank", "1", "2", "3"] as const).map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={stepOn === name ? "1" : "0"} aria-pressed={stepOn === name} onClick={() => setStepFilter(name)}>
                {name === "all" ? v4("arcAllSteps") : name === "blank" ? v4("arcBlankStep") : stepName(v4, Number(name))}
              </button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("arcRests")}>
            {(["all", "blank", "5", "10", "15", "20"] as const).map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={restOn === name ? "1" : "0"} aria-pressed={restOn === name} onClick={() => setRestFilter(name)}>
                {name === "all" ? v4("arcAllRests") : name === "blank" ? v4("arcBlankRest") : restName(v4, Number(name))}
              </button>
            ))}
          </div>
          <form className="c4-row" onSubmit={(event) => {
            event.preventDefault();
            if (viewer) return;
            const next = addBayView(views, {
              id: `view-${Date.now()}`,
              name: viewName,
              tray,
              query,
              guide: guideOn,
              pace: paceOn,
              wing: wingOn,
              lamp: lampOn,
              bay: bayOn,
              step: stepOn,
              rest: restOn,
            });
            if (next.length === views.length) return;
            storeViews(next);
            setViewName("");
          }}>
            <label className="c4-lab">
              <span>{v4("arcViewName")}</span>
              <input className="c4-field" aria-label={v4("arcViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
            </label>
            <button type="submit" className="c4-btn" disabled={viewer}>{v4("arcSaveView")}</button>
          </form>
          <section aria-label={v4("arcViews")}>
            <p className="c4-arc-kicker">{v4("arcViews")}</p>
            {!views.length && <p className="c4-arc-empty">{v4("arcViewEmpty")}</p>}
            <ul className="c4-arc-views">
              {views.map((view) => (
                <li key={view.id}>
                  <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropBayView(views, view.id))}>{v4("arcDropView")}</button>
                </li>
              ))}
            </ul>
          </section>
          {board === "cards" && !shown.length && <p className="c4-arc-empty">{v4("arcEmpty")}</p>}
          {board === "cards" && (
            <ul className="c4-arc-rows">
              {shown.map((card) => {
                const clashesOn = bayClashIds(cards, card.id);
                const stepsOn = stepClashIds(cards, card.id);
                const gap = gapLabel(v4, card.bay, desk);
                const band = bayBand(card.bay);
                const editingCard = editing === card.id;
                const late = lateBay(card, desk);
                return (
                  <li key={card.id} data-lamp={card.lamp || "blank"} data-pace={card.pace || "blank"} data-late={late ? "1" : "0"}>
                    <span className="c4-arc-mark" aria-hidden="true">{bayLabel(card.bay)}</span>
                    <div>
                      <label className="c4-arc-pick">
                        <input type="checkbox" checked={picked.includes(card.id)} aria-label={v4("arcPick")} onChange={() => togglePick(card.id)} />
                        <span>{v4("arcPick")}</span>
                      </label>
                      {editingCard ? (
                        <form className="c4-row" onSubmit={(event) => {
                          event.preventDefault();
                          if (viewer) return;
                          const titled = editBay(cards, card.id, draft);
                          store(editBayNote(titled, card.id, noteDraft));
                          setEditing("");
                        }}>
                          <input className="c4-field" aria-label={v4("arcEdit")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                          <input className="c4-field" aria-label={v4("arcNote")} value={noteDraft} disabled={viewer} onChange={(event) => setNoteDraft(event.target.value)} />
                          <button type="submit" className="c4-btn" disabled={viewer}>{v4("arcSaveEdit")}</button>
                        </form>
                      ) : (
                        <>
                          <p>{card.title}</p>
                          {card.note ? <p className="c4-meta">{card.note}</p> : null}
                        </>
                      )}
                      <p className="c4-meta">
                        {card.guide || v4("arcBlankGuide")}
                        {" · "}
                        {bayLabel(card.bay)}
                        {" · "}
                        {paceName(v4, paceOf(card.pace))}
                        {" · "}
                        {card.wing || v4("arcBlankWing")}
                        {" · "}
                        {lampName(v4, lampOf(card.lamp))}
                        {" · "}
                        {stepName(v4, card.step)}
                        {" · "}
                        {restName(v4, card.rest)}
                        {band === "blank" ? "" : ` · ${bayName(v4, band)}`}
                        {gap ? ` · ${gap}` : ""}
                        {late ? ` · ${v4("arcLate")}` : ""}
                        {auditName(v4, card.audit) ? ` · ${v4("arcAudit")} ${auditName(v4, card.audit)}` : ""}
                        {" · "}
                        {clashesOn.length ? `${v4("arcClash")} ${clashesOn.length}` : v4("arcClashNone")}
                        {" · "}
                        {stepsOn.length ? `${v4("arcStepClash")} ${stepsOn.length}` : v4("arcStepClashNone")}
                      </p>
                    </div>
                    <div className="c4-row">
                      <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("arcCopied") : v4("arcCopy")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); setNoteDraft(card.note); }}>{v4("arcEdit")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleLamp(cards, card.id))}>{v4("arcLampUp")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.pinned} onClick={() => store(setBayPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("arcUnpin") : v4("arcPin")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.walked} onClick={() => store(setBayWalk(cards, card.id, !card.walked))}>{card.walked ? v4("arcPause") : v4("arcWalkOn")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.filed} onClick={() => store(setBayFiled(cards, card.id, !card.filed))}>{card.filed ? v4("arcReopen") : v4("arcFile")}</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {board === "timeline" && (
            <ol className="c4-arc-time">
              {timeline.map((card) => (
                <li key={card.id}>
                  <span className="c4-arc-clock">{bayLabel(card.bay)}</span>
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

export function FailedStrikes({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
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
      count: row.failedLoginCount,
    };
  }).filter((row): row is GlanceRow => Boolean(row)), [data.data?.users]);
  const bandsOn = strikeBands(rows);
  const depths = strikeDepths(rows);
  const present = presentStrikes(rows);
  const presentKey = present.join("\n");
  const bandNames = present.filter((item) => item !== "blank");
  const depthNames = depths.map((line) => line.depth).filter(Boolean);
  const leadBand = leadingStrike(rows);
  const leadDepth = leadingStrikeDepth(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenStrikes(readJson(STRIKE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenBands(next);
    writeJson(STRIKE_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleStrikeBands(present, hiddenBands, showHidden);
  const depthOn = activeStrikeDepth(depth, depthNames);
  const bandOn = selected ? activeStrike(selected, bandNames) : "all";
  const shown = visibleStrikeCustomers(
    rows,
    selected ? strikeArg(bandOn === "all" && selected === "blank" ? "blank" : bandOn) : null,
    strikeDepthArg(depthOn),
    query,
  );
  const widest = Math.max(1, ...bandsOn.map((line) => line.count));
  const setCount = rows.filter((row) => strikeState(row.count) === "set").length;

  function store(next: string[], clear: string) {
    setHiddenBands(next);
    writeJson(STRIKE_KEY, next);
    if (clear && selected === clear) setSelected("");
  }

  return (
    <section className="c4-stk" aria-label={v4("stkTitle")} data-strikes="1">
      <header className="c4-stk-head">
        <div>
          <p className="c4-arc-kicker">{v4("stkSub")}</p>
          <h2 className="c4-title">{v4("stkTitle")}</h2>
        </div>
        <p className="c4-arc-count">{v4("stkRows")} {rows.length}</p>
      </header>
      <details className="c4-arc-rules">
        <summary>{v4("stkRules")}</summary>
        <p className="c4-meta">{v4("stkHint")}</p>
        <p className="c4-meta">{v4("stkLocal")}</p>
        <p className="c4-meta">{v4("stkEscape")}</p>
      </details>
      <p className="c4-arc-notice" role="status">
        <span>{v4("stkSetNotice")}</span>
        <span className="c4-arc-count">{setCount}</span>
      </p>
      {leadBand ? <p className="c4-stk-lead"><span>{v4("stkLeadBand")}</span> {bandName(v4, leadBand)}</p> : null}
      {leadDepth ? <p className="c4-stk-lead"><span>{v4("stkLeadDepth")}</span> {depthName(v4, leadDepth)}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("stkBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("failed-login-strikes.csv", strikesCsv(rows))}>{v4("stkCsv")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("stkLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("stkFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-arc-empty">{v4("stkNone")}</p>}
      {bandsOn.length > 0 && (
        <section className="c4-stk-chart" aria-label={v4("stkAllBands")}>
          {bandsOn.map((line) => {
            const share = strikeShare(line.count, rows.length);
            const bar = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.band || "blank";
            return (
              <p key={name} className="c4-stk-col" data-band={name}>
                <span>{bandName(v4, line.band)}</span>
                <span className="c4-arc-track" aria-hidden="true"><i style={{ width: `${bar}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("stkShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      <div className="c4-row" role="group" aria-label={v4("stkShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("stkShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("stkHidden")}</button>
      </div>
      <div className="c4-stk-bands" role="group" aria-label={v4("stkAllBands")}>
        <button type="button" className="c4-stk-band" data-on={!selected ? "1" : "0"} aria-pressed={!selected} onClick={() => setSelected("")}>
          <span>{v4("stkAllBands")}</span>
          <span className="c4-arc-count">{rows.length}</span>
        </button>
        {chips.map((item) => {
          const count = rows.filter((row) => {
            const state = strikeState(row.count);
            const token = state === "set" ? strikeBand(row.count) : state === "clear" ? "blank" : "";
            return token === item;
          }).length;
          const share = strikeShare(count, rows.length);
          return (
            <span key={item} className="c4-stk-pair">
              <button type="button" className="c4-stk-band" data-on={selected === item ? "1" : "0"} aria-pressed={selected === item} onClick={() => setSelected(selected === item ? "" : item)}>
                <span>{bandName(v4, item)}</span>
                <span className="c4-arc-count">{count}</span>
                <span>{v4("stkShare")} {share}%</span>
              </button>
              <button type="button" className="c4-btn" onClick={() => store(toggleStrike(hiddenBands, item, present), showHidden ? "" : item)}>{showHidden ? v4("stkShow") : v4("stkHide")}</button>
            </span>
          );
        })}
      </div>
      <div className="c4-row" role="group" aria-label={v4("stkDepths")}>
        <button type="button" className="c4-chip" data-on={depthOn === "all" ? "1" : "0"} aria-pressed={depthOn === "all"} onClick={() => setDepth("all")}>{v4("stkAllDepths")}</button>
        {depths.filter((line) => line.depth).map((line) => (
          <button key={line.depth} type="button" className="c4-chip" data-on={depthOn === line.depth ? "1" : "0"} aria-pressed={depthOn === line.depth} onClick={() => setDepth(depthOn === line.depth ? "all" : line.depth)}>
            {depthName(v4, line.depth)} {line.count}
          </button>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("stkSearch")}</span>
        <input className="c4-field" aria-label={v4("stkSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-arc-empty">{v4("stkEmpty")}</p>}
      <ul className="c4-stk-rows">
        {shown.map((row) => {
          const state = strikeState(row.count);
          const band = strikeBand(row.count) as StrikeBand;
          const depthMark = strikeDepth(row.count) as StrikeDepth;
          const count = strikeCount(row.count);
          return (
            <li key={row.id} data-state={state || "blank"} data-band={band || "blank"} data-depth={depthMark || "blank"}>
              <span className="c4-stk-face" aria-hidden="true">{count === null ? "—" : String(count)}</span>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">
                {state === "set" ? bandName(v4, band) : state === "clear" ? v4("stkClear") : v4("stkUnmarked")}
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
