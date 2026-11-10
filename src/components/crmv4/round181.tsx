"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  CODE_KEY,
  CODE_REVIEW_KEY,
  SLIP_KEY,
  SLIP_VIEW_KEY,
  activeBay,
  activeCode,
  activeCodeDepth,
  activeDye,
  activeFoil,
  activeMark,
  activeReach,
  activeSetter,
  activeWeight,
  addSlip,
  addSlipView,
  bayArg,
  bayBand,
  bayClashIds,
  bayGap,
  bulkCodeReview,
  bulkSlipBox,
  bulkSlipDye,
  bulkSlipPin,
  codeArg,
  codeBand,
  codeCopy,
  codeDepth,
  codeDepthArg,
  codeRowsCsv,
  codeShare,
  codeState,
  codeWords,
  codesCsv,
  cycleFoil,
  dotCode,
  dropSlipView,
  dyeArg,
  dyeCounts,
  dyeOf,
  editSlip,
  editSlipNote,
  foilArg,
  foilOf,
  homeMark,
  lateSlip,
  leadingCode,
  leadingCodeDepth,
  markArg,
  nextSlip,
  oddCodeCount,
  presentCodes,
  reachArg,
  readHiddenCodes,
  readReviewedCodes,
  readSlipViews,
  readSlips,
  resetSlips,
  setSlipBox,
  setSlipHold,
  setSlipPin,
  setterArg,
  setterLoad,
  slipCopy,
  slipCounts,
  slipDyes,
  slipFoils,
  slipMarks,
  slipSetters,
  slipShare,
  slipsCsv,
  soonSlip,
  suggestDye,
  suggestReach,
  suggestSetter,
  toggleCode,
  toggleCodeReview,
  usedBays,
  visibleCodeBands,
  visibleCodeCustomers,
  visibleSlips,
  weightArg,
  weightClashCount,
  weightClashIds,
  bayTimeline,
  clashBayCount,
  type CodeRow,
  type CodeShape,
  type Slip,
  type SlipDye,
  type SlipFoil,
  type SlipTray,
  type SlipView,
} from "@/lib/crmv4/round181";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  affiliateC?: string | null;
};

type GlanceRow = CodeRow & { id: string };

const DYES = ["soot", "ochre", "ivory"] as const;
const BANDS = ["pip", "slip", "card", "roll"] as const;

function dyeName(v4: V4, dye: SlipDye | string): string {
  if (dye === "soot") return v4("prsDyeSoot");
  if (dye === "ochre") return v4("prsDyeOchre");
  if (dye === "ivory") return v4("prsDyeIvory");
  return v4("prsBlankDye");
}

function foilName(v4: V4, foil: SlipFoil): string {
  if (foil === "gilt") return v4("prsFoilGilt");
  if (foil === "nickel") return v4("prsFoilNickel");
  if (foil === "umber") return v4("prsFoilUmber");
  return v4("prsBlankFoil");
}

function bayName(v4: V4, name: string): string {
  if (name === "dawn") return v4("prsDawn");
  if (name === "day") return v4("prsDay");
  if (name === "dusk") return v4("prsDusk");
  if (name === "peak") return v4("prsPeak");
  if (name === "quiet") return v4("prsQuiet");
  if (/^[1-6]$/.test(name)) return name;
  return v4("prsBlankBay");
}

function weightName(v4: V4, weight: number | null): string {
  if (weight === 1) return v4("prsWeight1");
  if (weight === 3) return v4("prsWeight3");
  if (weight === 5) return v4("prsWeight5");
  return v4("prsBlankWeight");
}

function reachName(v4: V4, reach: number | null): string {
  if (reach === 4) return v4("prsReach4");
  if (reach === 8) return v4("prsReach8");
  if (reach === 12) return v4("prsReach12");
  return v4("prsBlankReach");
}

function bandName(v4: V4, name: string): string {
  if (name === "pip") return v4("pcmPip");
  if (name === "slip") return v4("pcmSlip");
  if (name === "card") return v4("pcmCard");
  if (name === "roll") return v4("pcmRoll");
  if (name === "blank") return v4("pcmClear");
  return v4("pcmUnmarked");
}

function depthName(v4: V4, name: string): string {
  if (name === "plain") return v4("pcmPlain");
  if (name === "pair") return v4("pcmPair");
  if (name === "stack") return v4("pcmStack");
  if (name === "seam") return v4("pcmSeam");
  if (name === "rail") return v4("pcmRail");
  if (name === "figure") return v4("pcmFigure");
  return v4("pcmUnmarked");
}

function auditName(v4: V4, audit: string): string {
  const key = {
    save: "prsAuditSave",
    edit: "prsAuditEdit",
    foil: "prsAuditFoil",
    pin: "prsAuditPin",
    unpin: "prsAuditUnpin",
    hold: "prsAuditHold",
    lift: "prsAuditLift",
    box: "prsAuditBox",
    unbox: "prsAuditUnbox",
    dye: "prsAuditDye",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function bayLabel(bay: number | null): string {
  return bay === null ? "—" : String(bay);
}

function gapLabel(v4: V4, bay: number | null, desk: string): string {
  const gap = bayGap(bay, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("prsPast")} ${gap}`;
  if (gap < 0) return `${v4("prsAhead")} ${Math.abs(gap)}`;
  return v4("prsDue");
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

export function PressSlips({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<Slip[]>([]);
  const [views, setViews] = useState<SlipView[]>([]);
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
  const [tray, setTray] = useState<SlipTray>("open");
  const [setterFilter, setSetterFilter] = useState("all");
  const [dyeFilter, setDyeFilter] = useState("all");
  const [markFilter, setMarkFilter] = useState("all");
  const [foilFilter, setFoilFilter] = useState("all");
  const [bayFilter, setBayFilter] = useState("all");
  const [weightFilter, setWeightFilter] = useState("all");
  const [reachFilter, setReachFilter] = useState("all");
  const [umberOnly, setUmberOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [homeOnly, setHomeOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [desk, setDesk] = useState("");
  const [moveDye, setMoveDye] = useState("soot");
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readSlips(readJson(SLIP_KEY, []));
    const saved = readSlipViews(readJson(SLIP_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(SLIP_KEY, next);
    writeJson(SLIP_VIEW_KEY, saved);
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
  const setters = slipSetters(cards);
  const dyes = slipDyes(cards);
  const marks = slipMarks(cards);
  const foils = slipFoils(cards);
  const bars = dyeCounts(cards);
  const setterOn = activeSetter(setterFilter, setters);
  const dyeOn = activeDye(dyeFilter, DYES);
  const markOn = activeMark(markFilter, marks);
  const foilOn = activeFoil(foilFilter, foils);
  const bayOn = activeBay(bayFilter);
  const weightOn = activeWeight(weightFilter);
  const reachOn = activeReach(reachFilter);
  const pickedBay = bayArg(bayOn);
  const shown = visibleSlips(
    cards,
    tray,
    query,
    setterArg(setterOn),
    dyeArg(dyeOn),
    markArg(markOn),
    foilArg(foilOn),
    pickedBay.exact,
    pickedBay.pick,
    weightArg(weightOn),
    reachArg(reachOn),
    umberOnly,
    peakOnly,
    homeOnly,
  );
  const timeline = bayTimeline(cards, query);
  const counts = slipCounts(cards, desk);
  const clashes = clashBayCount(cards);
  const weights = weightClashCount(cards);
  const bayUse = usedBays(cards);
  const total = cards.length;
  const nextId = nextSlip(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const widest = Math.max(1, ...bars);
  const pinned = cards.filter((card) => card.pinned);
  const load = setterLoad(cards, setter);
  const suggested = suggestDye(cards);
  const lightSetter = suggestSetter(cards);
  const quietReach = suggestReach(cards);
  const homeShare = slipShare(counts.home, total);
  const targets = picked.length ? picked : shown.map((card) => card.id);

  function store(next: Slip[]) {
    setCards(next);
    writeJson(SLIP_KEY, next);
  }

  function storeViews(next: SlipView[]) {
    setViews(next);
    writeJson(SLIP_VIEW_KEY, next);
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

  function copyCard(card: Slip) {
    const body = slipCopy(card.title);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(card.id);
  }

  function applyView(view: SlipView) {
    setTray(view.tray);
    setQuery(view.query);
    setSetterFilter(activeSetter(view.setter, slipSetters(cards)));
    setDyeFilter(activeDye(view.dye, DYES));
    setMarkFilter(activeMark(view.mark, slipMarks(cards)));
    setFoilFilter(activeFoil(view.foil, slipFoils(cards)));
    setBayFilter(activeBay(view.bay));
    setWeightFilter(activeWeight(view.weight));
    setReachFilter(activeReach(view.reach));
    setBoard("cards");
    setUmberOnly(false);
    setPeakOnly(false);
    setHomeOnly(false);
  }

  function togglePick(id: string) {
    setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <section className="c4-prs" aria-label={v4("prsTitle")} data-slips="1" data-role={role}>
      <header className="c4-prs-mast">
        <p className="c4-prs-plate" data-logo="mono">{v4("prsLogo")}</p>
        <div>
          <p className="c4-prs-kicker">{v4("prsSub")}</p>
          <h2 className="c4-title">{v4("prsTitle")}</h2>
        </div>
        <p className="c4-prs-count">{shown.length}</p>
      </header>
      <details className="c4-prs-rules">
        <summary>{v4("prsRules")}</summary>
        <p className="c4-meta">{v4("prsHint")}</p>
        <p className="c4-meta">{v4("prsLocal")}</p>
        <p className="c4-meta">{v4("prsBlank")}</p>
        <p className="c4-meta">{v4("prsSetterBlank")}</p>
        <p className="c4-meta">{v4("prsBayBlank")}</p>
        <p className="c4-meta">{v4("prsDyeBlank")}</p>
        <p className="c4-meta">{v4("prsMarkBlank")}</p>
        <p className="c4-meta">{v4("prsFoilBlank")}</p>
        <p className="c4-meta">{v4("prsWeightBlank")}</p>
        <p className="c4-meta">{v4("prsReachBlank")}</p>
        <p className="c4-meta">{v4("prsNoteBlank")}</p>
        <p className="c4-meta">{v4("prsEscape")}</p>
        <p className="c4-meta">{v4("prsSlash")}</p>
        <p className="c4-meta">{v4("prsNew")}</p>
      </details>
      {viewer ? <p className="c4-prs-notice" role="status">{v4("prsViewer")}</p> : null}
      <div className="c4-prs-bells" aria-label={v4("prsNotice")}>
        <p className="c4-prs-notice" role="status">
          <span>{v4("prsNotice")}</span>
          <span className="c4-prs-count">{counts.peak}</span>
          <button type="button" className="c4-btn" aria-pressed={peakOnly} onClick={() => { setPeakOnly((value) => !value); setTray("open"); }}>
            {peakOnly ? v4("prsNoticeAll") : v4("prsNoticePeak")}
          </button>
        </p>
        <p className="c4-prs-notice" role="status"><span>{v4("prsLate")}</span><span className="c4-prs-count">{counts.late}</span></p>
        <p className="c4-prs-notice" role="status"><span>{v4("prsSoon")}</span><span className="c4-prs-count">{counts.soon}</span></p>
        <p className="c4-prs-notice" role="status"><span>{v4("prsBayUse")}</span><span className="c4-prs-count">{bayUse}</span></p>
        <p className="c4-prs-notice" role="status"><span>{v4("prsClash")}</span><span className="c4-prs-count">{clashes}</span></p>
        <p className="c4-prs-notice" role="status"><span>{v4("prsWeightClash")}</span><span className="c4-prs-count">{weights}</span></p>
        <p className="c4-prs-notice" role="status">
          <span>{v4("prsHome")}</span>
          <span className="c4-prs-count">{counts.home}</span>
          <span>{v4("prsHomeShare")} {homeShare}%</span>
          <button type="button" className="c4-btn" aria-pressed={homeOnly} onClick={() => setHomeOnly((value) => !value)}>
            {homeOnly ? v4("prsHomeAll") : v4("prsHomeOnly")}
          </button>
        </p>
      </div>
      <p className="c4-prs-suggest" role="status">
        <span>{v4("prsSuggestDye")}</span> {dyeName(v4, suggested)}
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setDye(suggested)}>{v4("prsUseDye")}</button>
      </p>
      <p className="c4-prs-suggest" role="status">
        <span>{v4("prsSuggestSetter")}</span> {lightSetter || v4("prsBlankSetter")}
        <button type="button" className="c4-btn" disabled={viewer || !lightSetter} onClick={() => setSetter(lightSetter)}>{v4("prsUseSetter")}</button>
      </p>
      <p className="c4-prs-suggest" role="status">
        <span>{v4("prsSuggestReach")}</span> {reachName(v4, quietReach)}
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setReach(String(quietReach))}>{v4("prsUseReach")}</button>
      </p>
      {pinned.length > 0 && (
        <ul className="c4-prs-pins" aria-label={v4("prsPinned")}>
          {pinned.map((card) => (
            <li key={card.id}><span className="c4-prs-mark" aria-hidden="true">{bayLabel(card.bay)}</span> {card.title}</li>
          ))}
        </ul>
      )}
      <dl className="c4-prs-kpi" aria-label={v4("prsKpi")}>
        <div><dt>{v4("prsWaiting")}</dt><dd>{counts.open}</dd></div>
        <div><dt>{v4("prsHeld")}</dt><dd>{counts.held}</dd></div>
        <div><dt>{v4("prsBoxed")}</dt><dd>{counts.boxed}</dd></div>
        <div><dt>{v4("prsPin")}</dt><dd>{counts.pinned}</dd></div>
      </dl>
      <section className="c4-prs-chart" aria-label={v4("prsDyeChart")}>
        {DYES.map((name, index) => {
          const bar = Math.max(8, Math.round((bars[index] / widest) * 100));
          return (
            <p key={name} className="c4-prs-col" data-dye={name} data-on={dyeOn === name ? "1" : "0"}>
              <span className="c4-prs-swatch" data-dye={name} aria-hidden="true" />
              <span>{dyeName(v4, name)}</span>
              <span className="c4-prs-track" aria-hidden="true"><i style={{ height: `${bar}%` }} /></span>
              <span>{bars[index]}</span>
            </p>
          );
        })}
      </section>
      <div className="c4-prs-split">
        <form className="c4-prs-form" onSubmit={(event) => {
          event.preventDefault();
          if (viewer) return;
          const next = addSlip(cards, {
            id: `slip-${Date.now()}`,
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
            <span>{v4("prsLine")}</span>
            <input ref={titleRef} className="c4-field" aria-label={v4("prsLine")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              event.preventDefault();
              clearDraft();
              setQuery("");
            }} />
          </label>
          <label className="c4-lab">
            <span>{v4("prsNote")}</span>
            <input className="c4-field" aria-label={v4("prsNote")} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} />
          </label>
          <label className="c4-lab">
            <span>{v4("prsSetter")}</span>
            <input className="c4-field" aria-label={v4("prsSetter")} value={setter} disabled={viewer} onChange={(event) => setSetter(event.target.value)} />
          </label>
          <p className="c4-meta">{v4("prsOpenLoad")} {load}</p>
          <label className="c4-lab">
            <span>{v4("prsBay")}</span>
            <input className="c4-field" inputMode="numeric" aria-label={v4("prsBay")} value={bay} disabled={viewer} onChange={(event) => setBay(event.target.value)} />
          </label>
          <label className="c4-lab">
            <span>{v4("prsDye")}</span>
            <select className="c4-field" aria-label={v4("prsDye")} value={dye} disabled={viewer} onChange={(event) => setDye(event.target.value)}>
              <option value="">{v4("prsBlankDye")}</option>
              {DYES.map((name) => <option key={name} value={name}>{dyeName(v4, name)}</option>)}
            </select>
          </label>
          <label className="c4-lab">
            <span>{v4("prsMark")}</span>
            <input className="c4-field" aria-label={v4("prsMark")} value={mark} disabled={viewer} onChange={(event) => setMark(event.target.value)} />
          </label>
          <label className="c4-lab">
            <span>{v4("prsFoil")}</span>
            <select className="c4-field" aria-label={v4("prsFoil")} value={foil} disabled={viewer} onChange={(event) => setFoil(event.target.value)}>
              <option value="">{v4("prsBlankFoil")}</option>
              <option value="gilt">{v4("prsFoilGilt")}</option>
              <option value="nickel">{v4("prsFoilNickel")}</option>
              <option value="umber">{v4("prsFoilUmber")}</option>
            </select>
          </label>
          <label className="c4-lab">
            <span>{v4("prsWeight")}</span>
            <select className="c4-field" aria-label={v4("prsWeight")} value={weight} disabled={viewer} onChange={(event) => setWeight(event.target.value)}>
              <option value="">{v4("prsBlankWeight")}</option>
              <option value="1">{v4("prsWeight1")}</option>
              <option value="3">{v4("prsWeight3")}</option>
              <option value="5">{v4("prsWeight5")}</option>
            </select>
          </label>
          <label className="c4-lab">
            <span>{v4("prsReach")}</span>
            <select className="c4-field" aria-label={v4("prsReach")} value={reach} disabled={viewer} onChange={(event) => setReach(event.target.value)}>
              <option value="">{v4("prsBlankReach")}</option>
              <option value="4">{v4("prsReach4")}</option>
              <option value="8">{v4("prsReach8")}</option>
              <option value="12">{v4("prsReach12")}</option>
            </select>
          </label>
          <button type="submit" className="c4-btn" disabled={viewer}>{v4("prsAdd")}</button>
        </form>
        <div className="c4-prs-board">
          <label className="c4-lab">
            <span>{v4("prsSearch")}</span>
            <input ref={searchRef} className="c4-field" aria-label={v4("prsSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              event.preventDefault();
              setQuery("");
              clearDraft();
            }} />
          </label>
          <label className="c4-lab">
            <span>{v4("prsDeskBay")}</span>
            <input className="c4-field" inputMode="numeric" aria-label={v4("prsDeskBay")} value={desk} onChange={(event) => setDesk(event.target.value)} />
          </label>
          <p className="c4-meta">{v4("prsNext")} {nextCard ? nextCard.title : v4("prsNextNone")}</p>
          <div className="c4-row" role="group" aria-label={v4("prsCards")}>
            {(["open", "held", "boxed"] as const).map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={tray === name ? "1" : "0"} aria-pressed={tray === name} onClick={() => setTray(name)}>
                {name === "open" ? v4("prsWaiting") : name === "held" ? v4("prsHeld") : v4("prsBoxed")}
              </button>
            ))}
            <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("prsTimeline")}</button>
            <button type="button" className="c4-chip" aria-pressed={umberOnly} onClick={() => setUmberOnly((value) => !value)}>{v4("prsUmberOnly")}</button>
          </div>
          <div className="c4-row" role="group" aria-label={v4("prsSetters")}>
            <button type="button" className="c4-chip" data-on={setterOn === "all" ? "1" : "0"} onClick={() => setSetterFilter("all")}>{v4("prsAllSetters")}</button>
            <button type="button" className="c4-chip" data-on={setterOn === "blank" ? "1" : "0"} onClick={() => setSetterFilter("blank")}>{v4("prsBlankSetter")}</button>
            {setters.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={setterOn === name ? "1" : "0"} onClick={() => setSetterFilter(name)}>{name}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("prsDyes")}>
            <button type="button" className="c4-chip" data-on={dyeOn === "all" ? "1" : "0"} onClick={() => setDyeFilter("all")}>{v4("prsAllDyes")}</button>
            {dyes.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={dyeOn === name ? "1" : "0"} onClick={() => setDyeFilter(name)}>{dyeName(v4, name)}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("prsMarks")}>
            <button type="button" className="c4-chip" data-on={markOn === "all" ? "1" : "0"} onClick={() => setMarkFilter("all")}>{v4("prsAllMarks")}</button>
            {marks.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={markOn === name ? "1" : "0"} onClick={() => setMarkFilter(name)}>{name}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("prsFoils")}>
            <button type="button" className="c4-chip" data-on={foilOn === "all" ? "1" : "0"} onClick={() => setFoilFilter("all")}>{v4("prsAllFoils")}</button>
            {foils.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={foilOn === name ? "1" : "0"} onClick={() => setFoilFilter(name)}>{foilName(v4, name)}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("prsBays")}>
            <button type="button" className="c4-chip" data-on={bayOn === "all" ? "1" : "0"} onClick={() => setBayFilter("all")}>{v4("prsAllBays")}</button>
            {["dawn", "day", "dusk", "peak", "quiet", "1", "2", "3", "4", "5", "6"].map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={bayOn === name ? "1" : "0"} onClick={() => setBayFilter(bayOn === name ? "all" : name)}>{bayName(v4, name)}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("prsWeights")}>
            <button type="button" className="c4-chip" data-on={weightOn === "all" ? "1" : "0"} onClick={() => setWeightFilter("all")}>{v4("prsAllWeights")}</button>
            {["1", "3", "5"].map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={weightOn === name ? "1" : "0"} onClick={() => setWeightFilter(weightOn === name ? "all" : name)}>{weightName(v4, Number(name))}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("prsReaches")}>
            <button type="button" className="c4-chip" data-on={reachOn === "all" ? "1" : "0"} onClick={() => setReachFilter("all")}>{v4("prsAllReaches")}</button>
            {["4", "8", "12"].map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={reachOn === name ? "1" : "0"} onClick={() => setReachFilter(reachOn === name ? "all" : name)}>{reachName(v4, Number(name))}</button>
            ))}
          </div>
          <form className="c4-row" onSubmit={(event) => {
            event.preventDefault();
            if (viewer) return;
            const next = addSlipView(views, {
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
              <span>{v4("prsViewName")}</span>
              <input className="c4-field" aria-label={v4("prsViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
            </label>
            <button type="submit" className="c4-btn" disabled={viewer}>{v4("prsSaveView")}</button>
          </form>
          {views.length > 0 && (
            <ul className="c4-prs-views" aria-label={v4("prsViews")}>
              {views.map((view) => (
                <li key={view.id}>
                  <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropSlipView(views, view.id))}>{v4("prsDropView")}</button>
                </li>
              ))}
            </ul>
          )}
          <div className="c4-row">
            <button type="button" className="c4-btn" onClick={() => setPicked(shown.map((card) => card.id))}>{v4("prsPickAll")}</button>
            <button type="button" className="c4-btn" onClick={() => setPicked([])}>{v4("prsPickNone")}</button>
            <span className="c4-meta">{v4("prsPicked")} {picked.length}</span>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSlipPin(cards, targets, true))}>{v4("prsBulkPin")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSlipBox(cards, targets, true))}>{v4("prsBulkBox")}</button>
            <label className="c4-lab">
              <span>{v4("prsBulkDye")}</span>
              <select className="c4-field" aria-label={v4("prsBulkDye")} value={moveDye} disabled={viewer} onChange={(event) => setMoveDye(event.target.value)}>
                {DYES.map((name) => <option key={name} value={name}>{dyeName(v4, name)}</option>)}
              </select>
            </label>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSlipDye(cards, targets, moveDye))}>{v4("prsBulkDye")}</button>
            <button type="button" className="c4-btn" onClick={() => download("press-slips.csv", slipsCsv(cards, desk))}>{v4("prsCsv")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetSlips())}>{v4("prsReset")}</button>
          </div>
          {!shown.length && board === "cards" && <p className="c4-prs-empty">{v4("prsEmpty")}</p>}
          {board === "cards" && (
            <ul className="c4-prs-cards">
              {shown.map((card) => {
                const band = bayBand(card.bay);
                const gap = gapLabel(v4, card.bay, desk);
                const late = lateSlip(card, desk);
                const clashesOn = bayClashIds(cards, card.id);
                const weightsOn = weightClashIds(cards, card.id);
                return (
                  <li key={card.id} data-pinned={card.pinned ? "1" : "0"} data-foil={foilOf(card.foil)} data-dye={dyeOf(card.dye)}>
                    <label className="c4-prs-pick">
                      <input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => togglePick(card.id)} />
                      <span className="c4-prs-stub" aria-hidden="true">{bayLabel(card.bay)}</span>
                    </label>
                    <div>
                      {editing === card.id ? (
                        <form onSubmit={(event) => {
                          event.preventDefault();
                          if (viewer) return;
                          store(editSlipNote(editSlip(cards, card.id, draft), card.id, noteDraft));
                          setEditing("");
                        }}>
                          <input className="c4-field" aria-label={v4("prsLine")} value={draft} onChange={(event) => setDraft(event.target.value)} />
                          <input className="c4-field" aria-label={v4("prsNote")} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} />
                          <button type="submit" className="c4-btn" disabled={viewer}>{v4("prsEdit")}</button>
                        </form>
                      ) : (
                        <>
                          <p>{card.title}</p>
                          <p className="c4-meta">{card.note}</p>
                        </>
                      )}
                      <p className="c4-meta">
                        {card.setter || v4("prsBlankSetter")}
                        {" · "}
                        {dyeName(v4, card.dye)}
                        {" · "}
                        {card.mark || v4("prsBlankMark")}
                        {" · "}
                        {foilName(v4, foilOf(card.foil))}
                        {" · "}
                        {weightName(v4, card.weight)}
                        {" · "}
                        {reachName(v4, card.reach)}
                        {band === "blank" ? "" : ` · ${bayName(v4, band)}`}
                        {gap ? ` · ${gap}` : ""}
                        {late ? ` · ${v4("prsLate")}` : ""}
                        {soonSlip(card) ? ` · ${v4("prsSoon")}` : ""}
                        {homeMark(card.mark) ? ` · ${v4("prsHome")}` : ""}
                        {auditName(v4, card.audit) ? ` · ${v4("prsAudit")} ${auditName(v4, card.audit)}` : ""}
                        {" · "}
                        {clashesOn.length ? `${v4("prsClash")} ${clashesOn.length}` : v4("prsClashNone")}
                        {" · "}
                        {weightsOn.length ? `${v4("prsWeightClash")} ${weightsOn.length}` : v4("prsWeightClashNone")}
                      </p>
                    </div>
                    <div className="c4-row">
                      <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("prsCopied") : v4("prsCopy")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); setNoteDraft(card.note); }}>{v4("prsEdit")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleFoil(cards, card.id))}>{v4("prsFoilUp")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.pinned} onClick={() => store(setSlipPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("prsUnpin") : v4("prsPin")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.held} onClick={() => store(setSlipHold(cards, card.id, !card.held))}>{card.held ? v4("prsLift") : v4("prsHoldOn")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.boxed} onClick={() => store(setSlipBox(cards, card.id, !card.boxed))}>{card.boxed ? v4("prsUnbox") : v4("prsBox")}</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {board === "timeline" && (
            <ol className="c4-prs-time">
              {timeline.map((card) => (
                <li key={card.id}>
                  <span className="c4-prs-clock">{bayLabel(card.bay)}</span>
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

export function PartnerCodes({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenBands, setHiddenBands] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [depth, setDepth] = useState("all");
  const [showHidden, setShowHidden] = useState(false);
  const [review, setReview] = useState<"all" | "reviewed" | "open">("all");
  const [shape, setShape] = useState<CodeShape>("all");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState("");
  const rows = useMemo(() => (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || "").trim(),
      note: row.affiliateC,
    };
  }).filter((row): row is GlanceRow => Boolean(row)), [data.data]);
  const present = presentCodes(rows);
  const presentKey = present.join("\n");
  const presentIds = rows.map((row) => row.id);
  const idKey = presentIds.join("\n");
  const bandsOn = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of rows) {
      const state = codeState(row.note);
      if (state === "") continue;
      const band = state === "set" ? codeBand(row.note) : "";
      counts.set(band, (counts.get(band) || 0) + 1);
    }
    return ["", ...BANDS].map((band) => ({ band, count: counts.get(band) || 0 })).filter((line) => line.count);
  }, [rows]);
  const depthNames = ["plain", "pair", "stack", "seam", "rail", "figure"].filter((name) => rows.some((row) => codeDepth(row.note) === name));
  const bandNames = present.filter((band) => band !== "blank");
  const leadBand = leadingCode(rows);
  const leadDepth = leadingCodeDepth(rows);
  const odd = oddCodeCount(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const known = presentKey ? presentKey.split("\n") : [];
    const next = readHiddenCodes(readJson(CODE_KEY, []), known);
    setHiddenBands(next);
    writeJson(CODE_KEY, next);
  }, [loading, failed, presentKey]);
  useEffect(() => {
    if (loading || failed) return;
    const known = idKey ? idKey.split("\n") : [];
    const next = readReviewedCodes(readJson(CODE_REVIEW_KEY, []), known);
    setReviewed(next);
    writeJson(CODE_REVIEW_KEY, next);
  }, [loading, failed, idKey]);
  const chips = visibleCodeBands(present, hiddenBands, showHidden);
  const depthOn = activeCodeDepth(depth, depthNames);
  const bandOn = selected ? activeCode(selected, bandNames) : "all";
  const shown = visibleCodeCustomers(
    rows,
    selected ? codeArg(bandOn === "all" && selected === "blank" ? "blank" : bandOn) : null,
    codeDepthArg(depthOn),
    query,
    review,
    reviewed,
    shape,
  );
  const widest = Math.max(1, ...bandsOn.map((line) => line.count));
  const setCount = rows.filter((row) => codeState(row.note) === "set").length;
  const openCount = rows.filter((row) => !reviewed.includes(row.id)).length;

  function store(next: string[], clear: string) {
    setHiddenBands(next);
    writeJson(CODE_KEY, next);
    if (clear && selected === clear) setSelected("");
  }

  function storeReview(next: string[]) {
    setReviewed(next);
    writeJson(CODE_REVIEW_KEY, next);
  }

  function copyCode(row: GlanceRow) {
    const body = codeCopy(row.note);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(row.id);
  }

  return (
    <section className="c4-pcm" aria-label={v4("pcmTitle")} data-codes="1">
      <header className="c4-pcm-mast">
        <div>
          <p className="c4-prs-kicker">{v4("pcmSub")}</p>
          <h2 className="c4-title">{v4("pcmTitle")}</h2>
        </div>
        <p className="c4-prs-count">{v4("pcmRows")} {rows.length}</p>
      </header>
      <details className="c4-prs-rules">
        <summary>{v4("pcmRules")}</summary>
        <p className="c4-meta">{v4("pcmHint")}</p>
        <p className="c4-meta">{v4("pcmKept")}</p>
        <p className="c4-meta">{v4("pcmEscape")}</p>
      </details>
      <p className="c4-prs-notice" role="status">
        <span>{v4("pcmSetNotice")}</span>
        <span className="c4-prs-count">{setCount}</span>
      </p>
      <p className="c4-prs-notice" role="status">
        <span>{v4("pcmUnreviewed")}</span>
        <span className="c4-prs-count">{openCount}</span>
      </p>
      <p className="c4-prs-notice" role="status">
        <span>{v4("pcmOdd")}</span>
        <span className="c4-prs-count">{odd}</span>
        <button type="button" className="c4-btn" aria-pressed={shape === "odd"} onClick={() => setShape(shape === "odd" ? "all" : "odd")}>
          {shape === "odd" ? v4("pcmAllShapes") : v4("pcmOddOnly")}
        </button>
        <button type="button" className="c4-btn" aria-pressed={shape === "dot"} onClick={() => setShape(shape === "dot" ? "all" : "dot")}>{v4("pcmDot")}</button>
      </p>
      {leadBand ? <p className="c4-pcm-lead"><span>{v4("pcmLeadBand")}</span> {bandName(v4, leadBand)}</p> : null}
      {leadDepth ? <p className="c4-pcm-lead"><span>{v4("pcmLeadDepth")}</span> {depthName(v4, leadDepth)}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("pcmBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("partner-codes.csv", codesCsv(rows))}>{v4("pcmCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("partner-code-rows.csv", codeRowsCsv(rows, reviewed))}>{v4("pcmRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => storeReview(bulkCodeReview(reviewed, shown.map((row) => row.id), presentIds, true))}>{v4("pcmBulkReview")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("pcmLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("pcmFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-prs-empty">{v4("pcmNone")}</p>}
      {bandsOn.length > 0 && (
        <section className="c4-pcm-chart" aria-label={v4("pcmAllBands")}>
          {bandsOn.map((line) => {
            const share = codeShare(line.count, rows.length);
            const bar = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.band || "blank";
            return (
              <p key={name} className="c4-pcm-col" data-band={name}>
                <span>{bandName(v4, line.band)}</span>
                <span className="c4-prs-track" aria-hidden="true"><i style={{ width: `${bar}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("pcmShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      <div className="c4-row" role="group" aria-label={v4("pcmShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("pcmShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("pcmHidden")}</button>
      </div>
      <div className="c4-pcm-bands" role="group" aria-label={v4("pcmAllBands")}>
        <button type="button" className="c4-pcm-band" data-on={!selected ? "1" : "0"} aria-pressed={!selected} onClick={() => setSelected("")}>
          <span>{v4("pcmAllBands")}</span>
          <span className="c4-prs-count">{rows.length}</span>
        </button>
        {chips.map((item) => {
          const name = item || "blank";
          const count = bandsOn.find((line) => (line.band || "blank") === name)?.count || 0;
          return (
            <div key={name} className="c4-pcm-band" data-on={selected === name ? "1" : "0"}>
              <button type="button" aria-pressed={selected === name} onClick={() => setSelected(selected === name ? "" : name)}>
                <span>{bandName(v4, item)}</span>
                <span className="c4-prs-count">{count}</span>
              </button>
              <button type="button" className="c4-btn" onClick={() => store(toggleCode(hiddenBands, name, present), name)}>{showHidden ? v4("pcmShow") : v4("pcmHide")}</button>
            </div>
          );
        })}
      </div>
      <div className="c4-row" role="group" aria-label={v4("pcmDepths")}>
        <button type="button" className="c4-chip" data-on={depthOn === "all" ? "1" : "0"} aria-pressed={depthOn === "all"} onClick={() => setDepth("all")}>{v4("pcmAllDepths")}</button>
        {depthNames.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={depthOn === name ? "1" : "0"} aria-pressed={depthOn === name} onClick={() => setDepth(depthOn === name ? "all" : name)}>{depthName(v4, name)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("pcmShapes")}>
        <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} aria-pressed={review === "all"} onClick={() => setReview("all")}>{v4("pcmAllMarks")}</button>
        <button type="button" className="c4-chip" data-on={review === "open" ? "1" : "0"} aria-pressed={review === "open"} onClick={() => setReview("open")}>{v4("pcmOpenMarks")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} aria-pressed={review === "reviewed"} onClick={() => setReview("reviewed")}>{v4("pcmReviewed")}</button>
      </div>
      <label className="c4-lab">
        <span>{v4("pcmSearch")}</span>
        <input className="c4-field" aria-label={v4("pcmSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-prs-empty">{v4("pcmEmpty")}</p>}
      <ul className="c4-pcm-rows">
        {shown.map((row) => {
          const band = codeBand(row.note);
          const deep = codeDepth(row.note);
          const words = codeWords(row.note);
          const seen = reviewed.includes(row.id);
          const joined = dotCode(row.note);
          return (
            <li key={row.id} data-band={band || "blank"} data-reviewed={seen ? "1" : "0"} data-dot={joined ? "1" : "0"}>
              <div>
                <p>{row.label || row.id}</p>
                <p className="c4-meta">{bandName(v4, band || (codeState(row.note) === "clear" ? "blank" : ""))} · {depthName(v4, deep)} · {v4("pcmParts")} {words}</p>
              </div>
              <div className="c4-row">
                <button type="button" className="c4-btn" onClick={() => copyCode(row)}>{copied === row.id ? v4("pcmCopied") : v4("pcmCopy")}</button>
                <button type="button" className="c4-btn" aria-pressed={seen} onClick={() => storeReview(toggleCodeReview(reviewed, row.id, presentIds))}>{v4("pcmReview")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
