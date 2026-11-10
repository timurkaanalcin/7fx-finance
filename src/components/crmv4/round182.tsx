"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  TOKEN_KEY,
  TOKEN_REVIEW_KEY,
  CHIME_KEY,
  CHIME_VIEW_KEY,
  activeWatch,
  activeToken,
  activeTokenDepth,
  activeGlaze,
  activeBell,
  activeMark,
  activeReach,
  activeRinger,
  activeWeight,
  addChime,
  addChimeView,
  watchArg,
  watchBand,
  watchClashIds,
  watchGap,
  bulkTokenReview,
  bulkChimeFile,
  bulkChimeGlaze,
  bulkChimePin,
  tokenArg,
  tokenBand,
  tokenCopy,
  tokenDepth,
  tokenDepthArg,
  tokenRowsCsv,
  tokenShare,
  tokenState,
  tokenWords,
  tokensCsv,
  cycleBell,
  dotToken,
  dropChimeView,
  glazeArg,
  glazeCounts,
  glazeOf,
  editChime,
  editChimeNote,
  bellArg,
  bellOf,
  homeMark,
  lateChime,
  leadingToken,
  leadingTokenDepth,
  markArg,
  nextChime,
  oddTokenCount,
  plusToken,
  plusTokenCount,
  presentTokens,
  reachArg,
  readHiddenTokens,
  readReviewedTokens,
  readChimeViews,
  readChimes,
  resetChimes,
  setChimeFile,
  setChimeMute,
  setChimePin,
  ringerArg,
  ringerLoad,
  chimeCopy,
  chimeCounts,
  chimeGlazes,
  chimeBells,
  chimeMarks,
  chimeRingers,
  chimeShare,
  chimesCsv,
  soonChime,
  suggestGlaze,
  suggestReach,
  suggestRinger,
  toggleToken,
  toggleTokenReview,
  usedWatches,
  visibleTokenBands,
  visibleTokenCustomers,
  visibleChimes,
  weightArg,
  weightClashCount,
  weightClashIds,
  watchTimeline,
  clashWatchCount,
  type TokenRow,
  type TokenShape,
  type Chime,
  type ChimeGlaze,
  type ChimeBell,
  type ChimeTray,
  type ChimeView,
} from "@/lib/crmv4/round182";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  referralCodeUsed?: string | null;
};

type GlanceRow = TokenRow & { id: string };

const GLAZES = ["mist", "brass", "coal"] as const;
const BANDS = ["chip", "tag", "plaque", "banner"] as const;

function glazeName(v4: V4, dye: ChimeGlaze | string): string {
  if (dye === "mist") return v4("nchDyeMist");
  if (dye === "brass") return v4("nchDyeBrass");
  if (dye === "coal") return v4("nchDyeCoal");
  return v4("nchBlankDye");
}

function bellName(v4: V4, foil: ChimeBell): string {
  if (foil === "pearl") return v4("nchFoilPearl");
  if (foil === "copper") return v4("nchFoilCopper");
  if (foil === "ink") return v4("nchFoilInk");
  return v4("nchBlankFoil");
}

function bayName(v4: V4, name: string): string {
  if (name === "dawn") return v4("nchDawn");
  if (name === "day") return v4("nchDay");
  if (name === "dusk") return v4("nchDusk");
  if (name === "peak") return v4("nchPeak");
  if (name === "quiet") return v4("nchQuiet");
  if (/^[1-8]$/.test(name)) return name;
  return v4("nchBlankBay");
}

function weightName(v4: V4, weight: number | null): string {
  if (weight === 2) return v4("nchWeight2");
  if (weight === 4) return v4("nchWeight4");
  if (weight === 8) return v4("nchWeight8");
  return v4("nchBlankWeight");
}

function reachName(v4: V4, reach: number | null): string {
  if (reach === 3) return v4("nchReach3");
  if (reach === 9) return v4("nchReach9");
  if (reach === 15) return v4("nchReach15");
  return v4("nchBlankReach");
}

function bandName(v4: V4, name: string): string {
  if (name === "chip") return v4("rftChip");
  if (name === "tag") return v4("rftTag");
  if (name === "plaque") return v4("rftPlaque");
  if (name === "banner") return v4("rftBanner");
  if (name === "blank") return v4("rftClear");
  return v4("rftUnmarked");
}

function depthName(v4: V4, name: string): string {
  if (name === "bare") return v4("rftBare");
  if (name === "pair") return v4("rftPair");
  if (name === "pile") return v4("rftPile");
  if (name === "dash") return v4("rftDash");
  if (name === "tick") return v4("rftTick");
  if (name === "numeral") return v4("rftNumeral");
  return v4("rftUnmarked");
}

function auditName(v4: V4, audit: string): string {
  const key = {
    save: "nchAuditSave",
    edit: "nchAuditEdit",
    foil: "nchAuditFoil",
    pin: "nchAuditPin",
    unpin: "nchAuditUnpin",
    hold: "nchAuditHold",
    lift: "nchAuditLift",
    box: "nchAuditBox",
    unbox: "nchAuditUnbox",
    dye: "nchAuditDye",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function bayLabel(bay: number | null): string {
  return bay === null ? "—" : String(bay);
}

function gapLabel(v4: V4, bay: number | null, desk: string): string {
  const gap = watchGap(bay, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("nchPast")} ${gap}`;
  if (gap < 0) return `${v4("nchAhead")} ${Math.abs(gap)}`;
  return v4("nchDue");
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

export function NightChimes({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<Chime[]>([]);
  const [views, setViews] = useState<ChimeView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [setter, setSetter] = useState("");
  const [bay, setBay] = useState("");
  const [dye, setDye] = useState("");
  const [mark, setMark] = useState("");
  const [foil, setFoil] = useState("");
  const [weight, setWeight] = useState("");
  const [reach, setReach] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<ChimeTray>("open");
  const [setterFilter, setSetterFilter] = useState("all");
  const [dyeFilter, setDyeFilter] = useState("all");
  const [markFilter, setMarkFilter] = useState("all");
  const [foilFilter, setFoilFilter] = useState("all");
  const [bayFilter, setBayFilter] = useState("all");
  const [weightFilter, setWeightFilter] = useState("all");
  const [reachFilter, setReachFilter] = useState("all");
  const [inkOnly, setInkOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [homeOnly, setHomeOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [desk, setDesk] = useState("");
  const [moveDye, setMoveDye] = useState("mist");
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readChimes(readJson(CHIME_KEY, []));
    const saved = readChimeViews(readJson(CHIME_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(CHIME_KEY, next);
    writeJson(CHIME_VIEW_KEY, saved);
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
  const setters = chimeRingers(cards);
  const dyes = chimeGlazes(cards);
  const marks = chimeMarks(cards);
  const foils = chimeBells(cards);
  const bars = glazeCounts(cards);
  const setterOn = activeRinger(setterFilter, setters);
  const dyeOn = activeGlaze(dyeFilter, GLAZES);
  const markOn = activeMark(markFilter, marks);
  const foilOn = activeBell(foilFilter, foils);
  const bayOn = activeWatch(bayFilter);
  const weightOn = activeWeight(weightFilter);
  const reachOn = activeReach(reachFilter);
  const pickedBay = watchArg(bayOn);
  const shown = visibleChimes(
    cards,
    tray,
    query,
    ringerArg(setterOn),
    glazeArg(dyeOn),
    markArg(markOn),
    bellArg(foilOn),
    pickedBay.exact,
    pickedBay.pick,
    weightArg(weightOn),
    reachArg(reachOn),
    inkOnly,
    peakOnly,
    homeOnly,
  );
  const timeline = watchTimeline(cards, query);
  const counts = chimeCounts(cards, desk);
  const clashes = clashWatchCount(cards);
  const weights = weightClashCount(cards);
  const bayUse = usedWatches(cards);
  const total = cards.length;
  const nextId = nextChime(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const widest = Math.max(1, ...bars);
  const pinned = cards.filter((card) => card.pinned);
  const load = ringerLoad(cards, setter);
  const suggested = suggestGlaze(cards);
  const lightSetter = suggestRinger(cards);
  const quietReach = suggestReach(cards);
  const homeShare = chimeShare(counts.home, total);
  const targets = picked.length ? picked : shown.map((card) => card.id);

  function store(next: Chime[]) {
    setCards(next);
    writeJson(CHIME_KEY, next);
  }

  function storeViews(next: ChimeView[]) {
    setViews(next);
    writeJson(CHIME_VIEW_KEY, next);
  }

  function clearDraft() {
    setTitle("");
    setNote("");
    setSetter("");
    setBay("");
    setDye("");
    setMark("");
    setFoil("");
    setWeight("");
    setReach("");
  }

  function copyCard(card: Chime) {
    const body = chimeCopy(card.title);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(card.id);
  }

  function applyView(view: ChimeView) {
    setTray(view.tray);
    setQuery(view.query);
    setSetterFilter(activeRinger(view.setter, chimeRingers(cards)));
    setDyeFilter(activeGlaze(view.dye, GLAZES));
    setMarkFilter(activeMark(view.mark, chimeMarks(cards)));
    setFoilFilter(activeBell(view.foil, chimeBells(cards)));
    setBayFilter(activeWatch(view.bay));
    setWeightFilter(activeWeight(view.weight));
    setReachFilter(activeReach(view.reach));
    setBoard("cards");
    setInkOnly(false);
    setPeakOnly(false);
    setHomeOnly(false);
  }

  function togglePick(id: string) {
    setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <section className="c4-nch" aria-label={v4("nchTitle")} data-chimes="1" data-role={role}>
      <header className="c4-nch-mast">
        <p className="c4-nch-plate" data-logo="mono">{v4("nchLogo")}</p>
        <div>
          <p className="c4-nch-kicker">{v4("nchSub")}</p>
          <h2 className="c4-title">{v4("nchTitle")}</h2>
        </div>
        <p className="c4-nch-count">{shown.length}</p>
      </header>
      <details className="c4-nch-rules">
        <summary>{v4("nchRules")}</summary>
        <p className="c4-meta">{v4("nchHint")}</p>
        <p className="c4-meta">{v4("nchLocal")}</p>
        <p className="c4-meta">{v4("nchBlank")}</p>
        <p className="c4-meta">{v4("nchSetterBlank")}</p>
        <p className="c4-meta">{v4("nchBayBlank")}</p>
        <p className="c4-meta">{v4("nchDyeBlank")}</p>
        <p className="c4-meta">{v4("nchMarkBlank")}</p>
        <p className="c4-meta">{v4("nchFoilBlank")}</p>
        <p className="c4-meta">{v4("nchWeightBlank")}</p>
        <p className="c4-meta">{v4("nchReachBlank")}</p>
        <p className="c4-meta">{v4("nchNoteBlank")}</p>
        <p className="c4-meta">{v4("nchEscape")}</p>
        <p className="c4-meta">{v4("nchSlash")}</p>
        <p className="c4-meta">{v4("nchNew")}</p>
      </details>
      {viewer ? <p className="c4-nch-notice" role="status">{v4("nchViewer")}</p> : null}
      <div className="c4-nch-bells" aria-label={v4("nchNotice")}>
        <p className="c4-nch-notice" role="status">
          <span>{v4("nchNotice")}</span>
          <span className="c4-nch-count">{counts.peak}</span>
          <button type="button" className="c4-btn" aria-pressed={peakOnly} onClick={() => { setPeakOnly((value) => !value); setTray("open"); }}>
            {peakOnly ? v4("nchNoticeAll") : v4("nchNoticePeak")}
          </button>
        </p>
        <p className="c4-nch-notice" role="status"><span>{v4("nchLate")}</span><span className="c4-nch-count">{counts.late}</span></p>
        <p className="c4-nch-notice" role="status"><span>{v4("nchSoon")}</span><span className="c4-nch-count">{counts.soon}</span></p>
        <p className="c4-nch-notice" role="status"><span>{v4("nchBayUse")}</span><span className="c4-nch-count">{bayUse}</span></p>
        <p className="c4-nch-notice" role="status"><span>{v4("nchClash")}</span><span className="c4-nch-count">{clashes}</span></p>
        <p className="c4-nch-notice" role="status"><span>{v4("nchWeightClash")}</span><span className="c4-nch-count">{weights}</span></p>
        <p className="c4-nch-notice" role="status">
          <span>{v4("nchHome")}</span>
          <span className="c4-nch-count">{counts.home}</span>
          <span>{v4("nchHomeShare")} {homeShare}%</span>
          <button type="button" className="c4-btn" aria-pressed={homeOnly} onClick={() => setHomeOnly((value) => !value)}>
            {homeOnly ? v4("nchHomeAll") : v4("nchHomeOnly")}
          </button>
        </p>
      </div>
      <p className="c4-nch-suggest" role="status">
        <span>{v4("nchSuggestDye")}</span> {glazeName(v4, suggested)}
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setDye(suggested)}>{v4("nchUseDye")}</button>
      </p>
      <p className="c4-nch-suggest" role="status">
        <span>{v4("nchSuggestSetter")}</span> {lightSetter || v4("nchBlankSetter")}
        <button type="button" className="c4-btn" disabled={viewer || !lightSetter} onClick={() => setSetter(lightSetter)}>{v4("nchUseSetter")}</button>
      </p>
      <p className="c4-nch-suggest" role="status">
        <span>{v4("nchSuggestReach")}</span> {reachName(v4, quietReach)}
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setReach(String(quietReach))}>{v4("nchUseReach")}</button>
      </p>
      {pinned.length > 0 && (
        <ul className="c4-nch-pins" aria-label={v4("nchPinned")}>
          {pinned.map((card) => (
            <li key={card.id}><span className="c4-nch-mark" aria-hidden="true">{bayLabel(card.bay)}</span> {card.title}</li>
          ))}
        </ul>
      )}
      <dl className="c4-nch-kpi" aria-label={v4("nchKpi")}>
        <div><dt>{v4("nchWaiting")}</dt><dd>{counts.open}</dd></div>
        <div><dt>{v4("nchHeld")}</dt><dd>{counts.muted}</dd></div>
        <div><dt>{v4("nchBoxed")}</dt><dd>{counts.filed}</dd></div>
        <div><dt>{v4("nchPin")}</dt><dd>{counts.pinned}</dd></div>
      </dl>
      <section className="c4-nch-chart" aria-label={v4("nchDyeChart")}>
        {GLAZES.map((name, index) => {
          const bar = Math.max(8, Math.round((bars[index] / widest) * 100));
          return (
            <p key={name} className="c4-nch-col" data-dye={name} data-on={dyeOn === name ? "1" : "0"}>
              <span className="c4-nch-swatch" data-dye={name} aria-hidden="true" />
              <span>{glazeName(v4, name)}</span>
              <span className="c4-nch-track" aria-hidden="true"><i style={{ height: `${bar}%` }} /></span>
              <span>{bars[index]}</span>
            </p>
          );
        })}
      </section>
      <div className="c4-nch-split">
        <form className="c4-nch-form" onSubmit={(event) => {
          event.preventDefault();
          if (viewer) return;
          const next = addChime(cards, {
            id: `chime-${Date.now()}`,
            title,
            note,
            setter,
            bay,
            dye,
            mark,
            foil,
            weight,
            reach,
          });
          if (next !== cards && next[0]?.title === title.trim()) clearDraft();
          store(next);
        }}>
          <label className="c4-lab">
            <span>{v4("nchLine")}</span>
            <input ref={titleRef} className="c4-field" aria-label={v4("nchLine")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              event.preventDefault();
              clearDraft();
              setQuery("");
            }} />
          </label>
          <label className="c4-lab">
            <span>{v4("nchNote")}</span>
            <input className="c4-field" aria-label={v4("nchNote")} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} />
          </label>
          <label className="c4-lab">
            <span>{v4("nchSetter")}</span>
            <input className="c4-field" aria-label={v4("nchSetter")} value={setter} disabled={viewer} onChange={(event) => setSetter(event.target.value)} />
          </label>
          <p className="c4-meta">{v4("nchOpenLoad")} {load}</p>
          <label className="c4-lab">
            <span>{v4("nchBay")}</span>
            <input className="c4-field" inputMode="numeric" aria-label={v4("nchBay")} value={bay} disabled={viewer} onChange={(event) => setBay(event.target.value)} />
          </label>
          <label className="c4-lab">
            <span>{v4("nchDye")}</span>
            <select className="c4-field" aria-label={v4("nchDye")} value={dye} disabled={viewer} onChange={(event) => setDye(event.target.value)}>
              <option value="">{v4("nchBlankDye")}</option>
              {GLAZES.map((name) => <option key={name} value={name}>{glazeName(v4, name)}</option>)}
            </select>
          </label>
          <label className="c4-lab">
            <span>{v4("nchMark")}</span>
            <input className="c4-field" aria-label={v4("nchMark")} value={mark} disabled={viewer} onChange={(event) => setMark(event.target.value)} />
          </label>
          <label className="c4-lab">
            <span>{v4("nchFoil")}</span>
            <select className="c4-field" aria-label={v4("nchFoil")} value={foil} disabled={viewer} onChange={(event) => setFoil(event.target.value)}>
              <option value="">{v4("nchBlankFoil")}</option>
              <option value="pearl">{v4("nchFoilPearl")}</option>
              <option value="copper">{v4("nchFoilCopper")}</option>
              <option value="ink">{v4("nchFoilInk")}</option>
            </select>
          </label>
          <label className="c4-lab">
            <span>{v4("nchWeight")}</span>
            <select className="c4-field" aria-label={v4("nchWeight")} value={weight} disabled={viewer} onChange={(event) => setWeight(event.target.value)}>
              <option value="">{v4("nchBlankWeight")}</option>
              <option value="2">{v4("nchWeight2")}</option>
              <option value="4">{v4("nchWeight4")}</option>
              <option value="8">{v4("nchWeight8")}</option>
            </select>
          </label>
          <label className="c4-lab">
            <span>{v4("nchReach")}</span>
            <select className="c4-field" aria-label={v4("nchReach")} value={reach} disabled={viewer} onChange={(event) => setReach(event.target.value)}>
              <option value="">{v4("nchBlankReach")}</option>
              <option value="3">{v4("nchReach3")}</option>
              <option value="9">{v4("nchReach9")}</option>
              <option value="15">{v4("nchReach15")}</option>
            </select>
          </label>
          <button type="submit" className="c4-btn" disabled={viewer}>{v4("nchAdd")}</button>
        </form>
        <div className="c4-nch-board">
          <label className="c4-lab">
            <span>{v4("nchSearch")}</span>
            <input ref={searchRef} className="c4-field" aria-label={v4("nchSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              event.preventDefault();
              setQuery("");
              clearDraft();
            }} />
          </label>
          <label className="c4-lab">
            <span>{v4("nchDeskBay")}</span>
            <input className="c4-field" inputMode="numeric" aria-label={v4("nchDeskBay")} value={desk} onChange={(event) => setDesk(event.target.value)} />
          </label>
          <p className="c4-meta">{v4("nchNext")} {nextCard ? nextCard.title : v4("nchNextNone")}</p>
          <div className="c4-row" role="group" aria-label={v4("nchCards")}>
            {(["open", "muted", "filed"] as const).map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={tray === name ? "1" : "0"} aria-pressed={tray === name} onClick={() => setTray(name)}>
                {name === "open" ? v4("nchWaiting") : name === "muted" ? v4("nchHeld") : v4("nchBoxed")}
              </button>
            ))}
            <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("nchTimeline")}</button>
            <button type="button" className="c4-chip" aria-pressed={inkOnly} onClick={() => setInkOnly((value) => !value)}>{v4("nchInkOnly")}</button>
          </div>
          <div className="c4-row" role="group" aria-label={v4("nchSetters")}>
            <button type="button" className="c4-chip" data-on={setterOn === "all" ? "1" : "0"} onClick={() => setSetterFilter("all")}>{v4("nchAllSetters")}</button>
            <button type="button" className="c4-chip" data-on={setterOn === "blank" ? "1" : "0"} onClick={() => setSetterFilter("blank")}>{v4("nchBlankSetter")}</button>
            {setters.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={setterOn === name ? "1" : "0"} onClick={() => setSetterFilter(name)}>{name}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("nchDyes")}>
            <button type="button" className="c4-chip" data-on={dyeOn === "all" ? "1" : "0"} onClick={() => setDyeFilter("all")}>{v4("nchAllDyes")}</button>
            {dyes.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={dyeOn === name ? "1" : "0"} onClick={() => setDyeFilter(name)}>{glazeName(v4, name)}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("nchMarks")}>
            <button type="button" className="c4-chip" data-on={markOn === "all" ? "1" : "0"} onClick={() => setMarkFilter("all")}>{v4("nchAllMarks")}</button>
            {marks.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={markOn === name ? "1" : "0"} onClick={() => setMarkFilter(name)}>{name}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("nchFoils")}>
            <button type="button" className="c4-chip" data-on={foilOn === "all" ? "1" : "0"} onClick={() => setFoilFilter("all")}>{v4("nchAllFoils")}</button>
            {foils.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={foilOn === name ? "1" : "0"} onClick={() => setFoilFilter(name)}>{bellName(v4, name)}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("nchBays")}>
            <button type="button" className="c4-chip" data-on={bayOn === "all" ? "1" : "0"} onClick={() => setBayFilter("all")}>{v4("nchAllBays")}</button>
            {["dawn", "day", "dusk", "peak", "quiet", "1", "2", "3", "4", "5", "6", "7", "8"].map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={bayOn === name ? "1" : "0"} onClick={() => setBayFilter(bayOn === name ? "all" : name)}>{bayName(v4, name)}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("nchWeights")}>
            <button type="button" className="c4-chip" data-on={weightOn === "all" ? "1" : "0"} onClick={() => setWeightFilter("all")}>{v4("nchAllWeights")}</button>
            {["2", "4", "8"].map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={weightOn === name ? "1" : "0"} onClick={() => setWeightFilter(weightOn === name ? "all" : name)}>{weightName(v4, Number(name))}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("nchReaches")}>
            <button type="button" className="c4-chip" data-on={reachOn === "all" ? "1" : "0"} onClick={() => setReachFilter("all")}>{v4("nchAllReaches")}</button>
            {["3", "9", "15"].map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={reachOn === name ? "1" : "0"} onClick={() => setReachFilter(reachOn === name ? "all" : name)}>{reachName(v4, Number(name))}</button>
            ))}
          </div>
          <form className="c4-row" onSubmit={(event) => {
            event.preventDefault();
            if (viewer) return;
            const next = addChimeView(views, {
              id: `view-${Date.now()}`,
              name: viewName,
              tray,
              query,
              setter: setterOn,
              dye: dyeOn,
              mark: markOn,
              foil: foilOn,
              bay: bayOn,
              weight: weightOn,
              reach: reachOn,
            });
            if (next !== views) setViewName("");
            storeViews(next);
          }}>
            <label className="c4-lab">
              <span>{v4("nchViewName")}</span>
              <input className="c4-field" aria-label={v4("nchViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
            </label>
            <button type="submit" className="c4-btn" disabled={viewer}>{v4("nchSaveView")}</button>
          </form>
          {views.length > 0 && (
            <ul className="c4-nch-views" aria-label={v4("nchViews")}>
              {views.map((view) => (
                <li key={view.id}>
                  <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropChimeView(views, view.id))}>{v4("nchDropView")}</button>
                </li>
              ))}
            </ul>
          )}
          <div className="c4-row">
            <button type="button" className="c4-btn" onClick={() => setPicked(shown.map((card) => card.id))}>{v4("nchPickAll")}</button>
            <button type="button" className="c4-btn" onClick={() => setPicked([])}>{v4("nchPickNone")}</button>
            <span className="c4-meta">{v4("nchPicked")} {picked.length}</span>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkChimePin(cards, targets, true))}>{v4("nchBulkPin")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkChimeFile(cards, targets, true))}>{v4("nchBulkBox")}</button>
            <label className="c4-lab">
              <span>{v4("nchBulkDye")}</span>
              <select className="c4-field" aria-label={v4("nchBulkDye")} value={moveDye} disabled={viewer} onChange={(event) => setMoveDye(event.target.value)}>
                {GLAZES.map((name) => <option key={name} value={name}>{glazeName(v4, name)}</option>)}
              </select>
            </label>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkChimeGlaze(cards, targets, moveDye))}>{v4("nchBulkDye")}</button>
            <button type="button" className="c4-btn" onClick={() => download("night-chimes.csv", chimesCsv(cards, desk))}>{v4("nchCsv")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetChimes())}>{v4("nchReset")}</button>
          </div>
          {!shown.length && board === "cards" && <p className="c4-nch-empty">{v4("nchEmpty")}</p>}
          {board === "cards" && (
            <ul className="c4-nch-cards">
              {shown.map((card) => {
                const band = watchBand(card.bay);
                const gap = gapLabel(v4, card.bay, desk);
                const late = lateChime(card, desk);
                const clashesOn = watchClashIds(cards, card.id);
                const weightsOn = weightClashIds(cards, card.id);
                return (
                  <li key={card.id} data-pinned={card.pinned ? "1" : "0"} data-foil={bellOf(card.foil)} data-dye={glazeOf(card.dye)}>
                    <label className="c4-nch-pick">
                      <input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => togglePick(card.id)} />
                      <span className="c4-nch-stub" aria-hidden="true">{bayLabel(card.bay)}</span>
                    </label>
                    <div>
                      {editing === card.id ? (
                        <form onSubmit={(event) => {
                          event.preventDefault();
                          if (viewer) return;
                          store(editChimeNote(editChime(cards, card.id, draft), card.id, noteDraft));
                          setEditing("");
                        }}>
                          <input className="c4-field" aria-label={v4("nchLine")} value={draft} onChange={(event) => setDraft(event.target.value)} />
                          <input className="c4-field" aria-label={v4("nchNote")} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} />
                          <button type="submit" className="c4-btn" disabled={viewer}>{v4("nchEdit")}</button>
                        </form>
                      ) : (
                        <>
                          <p>{card.title}</p>
                          <p className="c4-meta">{card.note}</p>
                        </>
                      )}
                      <p className="c4-meta">
                        {card.setter || v4("nchBlankSetter")}
                        {" · "}
                        {glazeName(v4, card.dye)}
                        {" · "}
                        {card.mark || v4("nchBlankMark")}
                        {" · "}
                        {bellName(v4, bellOf(card.foil))}
                        {" · "}
                        {weightName(v4, card.weight)}
                        {" · "}
                        {reachName(v4, card.reach)}
                        {band === "blank" ? "" : ` · ${bayName(v4, band)}`}
                        {gap ? ` · ${gap}` : ""}
                        {late ? ` · ${v4("nchLate")}` : ""}
                        {soonChime(card) ? ` · ${v4("nchSoon")}` : ""}
                        {homeMark(card.mark) ? ` · ${v4("nchHome")}` : ""}
                        {auditName(v4, card.audit) ? ` · ${v4("nchAudit")} ${auditName(v4, card.audit)}` : ""}
                        {" · "}
                        {clashesOn.length ? `${v4("nchClash")} ${clashesOn.length}` : v4("nchClashNone")}
                        {" · "}
                        {weightsOn.length ? `${v4("nchWeightClash")} ${weightsOn.length}` : v4("nchWeightClashNone")}
                      </p>
                    </div>
                    <div className="c4-row">
                      <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("nchCopied") : v4("nchCopy")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); setNoteDraft(card.note); }}>{v4("nchEdit")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleBell(cards, card.id))}>{v4("nchFoilUp")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.pinned} onClick={() => store(setChimePin(cards, card.id, !card.pinned))}>{card.pinned ? v4("nchUnpin") : v4("nchPin")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.muted} onClick={() => store(setChimeMute(cards, card.id, !card.muted))}>{card.muted ? v4("nchLift") : v4("nchHoldOn")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.filed} onClick={() => store(setChimeFile(cards, card.id, !card.filed))}>{card.filed ? v4("nchUnbox") : v4("nchBox")}</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {board === "timeline" && (
            <ol className="c4-nch-time">
              {timeline.map((card) => (
                <li key={card.id}>
                  <span className="c4-nch-clock">{bayLabel(card.bay)}</span>
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

export function ReferralTokens({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenBands, setHiddenBands] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [depth, setDepth] = useState("all");
  const [showHidden, setShowHidden] = useState(false);
  const [review, setReview] = useState<"all" | "reviewed" | "open">("all");
  const [shape, setShape] = useState<TokenShape>("all");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState("");
  const rows = useMemo(() => (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || "").trim(),
      note: row.referralCodeUsed,
    };
  }).filter((row): row is GlanceRow => Boolean(row)), [data.data]);
  const present = presentTokens(rows);
  const presentKey = present.join("\n");
  const presentIds = rows.map((row) => row.id);
  const idKey = presentIds.join("\n");
  const bandsOn = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of rows) {
      const state = tokenState(row.note);
      if (state === "") continue;
      const band = state === "set" ? tokenBand(row.note) : "";
      counts.set(band, (counts.get(band) || 0) + 1);
    }
    return ["", ...BANDS].map((band) => ({ band, count: counts.get(band) || 0 })).filter((line) => line.count);
  }, [rows]);
  const depthNames = ["bare", "pair", "pile", "dash", "tick", "numeral"].filter((name) => rows.some((row) => tokenDepth(row.note) === name));
  const bandNames = present.filter((band) => band !== "blank");
  const leadBand = leadingToken(rows);
  const leadDepth = leadingTokenDepth(rows);
  const odd = oddTokenCount(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const known = presentKey ? presentKey.split("\n") : [];
    const next = readHiddenTokens(readJson(TOKEN_KEY, []), known);
    setHiddenBands(next);
    writeJson(TOKEN_KEY, next);
  }, [loading, failed, presentKey]);
  useEffect(() => {
    if (loading || failed) return;
    const known = idKey ? idKey.split("\n") : [];
    const next = readReviewedTokens(readJson(TOKEN_REVIEW_KEY, []), known);
    setReviewed(next);
    writeJson(TOKEN_REVIEW_KEY, next);
  }, [loading, failed, idKey]);
  const chips = visibleTokenBands(present, hiddenBands, showHidden);
  const depthOn = activeTokenDepth(depth, depthNames);
  const bandOn = selected ? activeToken(selected, bandNames) : "all";
  const shown = visibleTokenCustomers(
    rows,
    selected ? tokenArg(bandOn === "all" && selected === "blank" ? "blank" : bandOn) : null,
    tokenDepthArg(depthOn),
    query,
    review,
    reviewed,
    shape,
  );
  const widest = Math.max(1, ...bandsOn.map((line) => line.count));
  const setCount = rows.filter((row) => tokenState(row.note) === "set").length;
  const openCount = rows.filter((row) => !reviewed.includes(row.id)).length;

  function store(next: string[], clear: string) {
    setHiddenBands(next);
    writeJson(TOKEN_KEY, next);
    if (clear && selected === clear) setSelected("");
  }

  function storeReview(next: string[]) {
    setReviewed(next);
    writeJson(TOKEN_REVIEW_KEY, next);
  }

  function copyCode(row: GlanceRow) {
    const body = tokenCopy(row.note);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(row.id);
  }

  return (
    <section className="c4-rft" aria-label={v4("rftTitle")} data-tokens="1">
      <header className="c4-rft-mast">
        <div>
          <p className="c4-nch-kicker">{v4("rftSub")}</p>
          <h2 className="c4-title">{v4("rftTitle")}</h2>
        </div>
        <p className="c4-nch-count">{v4("rftRows")} {rows.length}</p>
      </header>
      <details className="c4-nch-rules">
        <summary>{v4("rftRules")}</summary>
        <p className="c4-meta">{v4("rftHint")}</p>
        <p className="c4-meta">{v4("rftKept")}</p>
        <p className="c4-meta">{v4("rftEscape")}</p>
      </details>
      <p className="c4-nch-notice" role="status">
        <span>{v4("rftSetNotice")}</span>
        <span className="c4-nch-count">{setCount}</span>
      </p>
      <p className="c4-nch-notice" role="status">
        <span>{v4("rftUnreviewed")}</span>
        <span className="c4-nch-count">{openCount}</span>
      </p>
      <p className="c4-nch-notice" role="status">
        <span>{v4("rftOdd")}</span>
        <span className="c4-nch-count">{odd}</span>
        <span>{v4("rftPlus")}</span>
        <span className="c4-nch-count">{plusTokenCount(rows)}</span>
        <button type="button" className="c4-btn" aria-pressed={shape === "odd"} onClick={() => setShape(shape === "odd" ? "all" : "odd")}>
          {shape === "odd" ? v4("rftAllShapes") : v4("rftOddOnly")}
        </button>
        <button type="button" className="c4-btn" aria-pressed={shape === "dot"} onClick={() => setShape(shape === "dot" ? "all" : "dot")}>{v4("rftDot")}</button>
        <button type="button" className="c4-btn" aria-pressed={shape === "plus"} onClick={() => setShape(shape === "plus" ? "all" : "plus")}>{shape === "plus" ? v4("rftAllShapes") : v4("rftPlusOnly")}</button>
      </p>
      {leadBand ? <p className="c4-rft-lead"><span>{v4("rftLeadBand")}</span> {bandName(v4, leadBand)}</p> : null}
      {leadDepth ? <p className="c4-rft-lead"><span>{v4("rftLeadDepth")}</span> {depthName(v4, leadDepth)}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("rftBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("referral-tokens.csv", tokensCsv(rows))}>{v4("rftCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("referral-token-rows.csv", tokenRowsCsv(rows, reviewed))}>{v4("rftRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => storeReview(bulkTokenReview(reviewed, shown.map((row) => row.id), presentIds, true))}>{v4("rftBulkReview")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("rftLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("rftFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-nch-empty">{v4("rftNone")}</p>}
      {bandsOn.length > 0 && (
        <section className="c4-rft-chart" aria-label={v4("rftAllBands")}>
          {bandsOn.map((line) => {
            const share = tokenShare(line.count, rows.length);
            const bar = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.band || "blank";
            return (
              <p key={name} className="c4-rft-col" data-band={name}>
                <span>{bandName(v4, line.band)}</span>
                <span className="c4-nch-track" aria-hidden="true"><i style={{ width: `${bar}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("rftShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      <div className="c4-row" role="group" aria-label={v4("rftShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("rftShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("rftHidden")}</button>
      </div>
      <div className="c4-rft-bands" role="group" aria-label={v4("rftAllBands")}>
        <button type="button" className="c4-rft-band" data-on={!selected ? "1" : "0"} aria-pressed={!selected} onClick={() => setSelected("")}>
          <span>{v4("rftAllBands")}</span>
          <span className="c4-nch-count">{rows.length}</span>
        </button>
        {chips.map((item) => {
          const name = item || "blank";
          const count = bandsOn.find((line) => (line.band || "blank") === name)?.count || 0;
          return (
            <div key={name} className="c4-rft-band" data-on={selected === name ? "1" : "0"}>
              <button type="button" aria-pressed={selected === name} onClick={() => setSelected(selected === name ? "" : name)}>
                <span>{bandName(v4, item)}</span>
                <span className="c4-nch-count">{count}</span>
              </button>
              <button type="button" className="c4-btn" onClick={() => store(toggleToken(hiddenBands, name, present), name)}>{showHidden ? v4("rftShow") : v4("rftHide")}</button>
            </div>
          );
        })}
      </div>
      <div className="c4-row" role="group" aria-label={v4("rftDepths")}>
        <button type="button" className="c4-chip" data-on={depthOn === "all" ? "1" : "0"} aria-pressed={depthOn === "all"} onClick={() => setDepth("all")}>{v4("rftAllDepths")}</button>
        {depthNames.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={depthOn === name ? "1" : "0"} aria-pressed={depthOn === name} onClick={() => setDepth(depthOn === name ? "all" : name)}>{depthName(v4, name)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("rftShapes")}>
        <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} aria-pressed={review === "all"} onClick={() => setReview("all")}>{v4("rftAllMarks")}</button>
        <button type="button" className="c4-chip" data-on={review === "open" ? "1" : "0"} aria-pressed={review === "open"} onClick={() => setReview("open")}>{v4("rftOpenMarks")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} aria-pressed={review === "reviewed"} onClick={() => setReview("reviewed")}>{v4("rftReviewed")}</button>
      </div>
      <label className="c4-lab">
        <span>{v4("rftSearch")}</span>
        <input className="c4-field" aria-label={v4("rftSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-nch-empty">{v4("rftEmpty")}</p>}
      <ul className="c4-rft-rows">
        {shown.map((row) => {
          const band = tokenBand(row.note);
          const deep = tokenDepth(row.note);
          const words = tokenWords(row.note);
          const seen = reviewed.includes(row.id);
          const joined = dotToken(row.note);
          const plus = plusToken(row.note);
          return (
            <li key={row.id} data-band={band || "blank"} data-reviewed={seen ? "1" : "0"} data-dot={joined ? "1" : "0"} data-plus={plus ? "1" : "0"}>
              <div>
                <p>{row.label || row.id}</p>
                <p className="c4-meta">{bandName(v4, band || (tokenState(row.note) === "clear" ? "blank" : ""))} · {depthName(v4, deep)} · {v4("rftParts")} {words}{plus ? " · +" : ""}</p>
              </div>
              <div className="c4-row">
                <button type="button" className="c4-btn" onClick={() => copyCode(row)}>{copied === row.id ? v4("rftCopied") : v4("rftCopy")}</button>
                <button type="button" className="c4-btn" aria-pressed={seen} onClick={() => storeReview(toggleTokenReview(reviewed, row.id, presentIds))}>{v4("rftReview")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
