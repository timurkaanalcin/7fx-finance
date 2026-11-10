"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  ESL_DENSITY_KEY,
  ESL_KEY,
  ESL_VIEW_KEY,
  RIBBON_KEY,
  RIBBON_REVIEW_KEY,
  activeBay,
  activeBell,
  activeCloth,
  activeGuide,
  activeLength,
  activeRibbonBand,
  activeRibbonTone,
  activeStep,
  activeWeight,
  addSlip,
  addSlipTag,
  addSlipView,
  bayArg,
  bellArg,
  bulkRibbonReview,
  bulkSlipClose,
  bulkSlipCloth,
  bulkSlipPin,
  bulkSlipTag,
  busiestGuide,
  catalogRibbon,
  catalogRibbonCount,
  chimeBell,
  clashBellCount,
  clothArg,
  cycleStep,
  densityOf,
  dropSlipView,
  editSlip,
  editSlipNote,
  fairGuide,
  guideArg,
  houseBay,
  lateSlip,
  leadingRibbon,
  leadingRibbonTone,
  lengthArg,
  moveFocus,
  nextSlip,
  presentRibbons,
  readHiddenRibbons,
  readReviewedRibbons,
  readSlipViews,
  readSlips,
  reminderSlips,
  resetSlips,
  ribbonBand,
  ribbonBandArg,
  ribbonBands,
  ribbonCopy,
  ribbonRowsCsv,
  ribbonShare,
  ribbonState,
  ribbonTone,
  ribbonToneArg,
  ribbonsCsv,
  scrollRibbonCount,
  setSlipClose,
  setSlipHold,
  setSlipPin,
  setSlipQuiet,
  sharedRibbonCount,
  slipBays,
  slipCopy,
  slipCounts,
  slipGuides,
  slipShare,
  slipTimeline,
  slipsCsv,
  softRibbonCount,
  soonSlip,
  sortMode,
  sortSlips,
  stepArg,
  suggestCloth,
  suggestGuide,
  suggestLength,
  toggleRibbon,
  toggleRibbonReview,
  usedBells,
  visibleRibbonBands,
  visibleRibbonCustomers,
  visibleSlips,
  weightArg,
  weightClashCount,
  bellGap,
  type EslCloth,
  type EslDensity,
  type EslSort,
  type EslStep,
  type EslTray,
  type EslView,
  type EscortSlip,
  type RibbonRow,
  type RibbonShape,
} from "@/lib/crmv4/round196";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  retentionNote?: string | null;
};

type GlanceRow = RibbonRow & { id: string };

const CLOTHS = ["linen", "silk", "wool", "velvet"] as const;
const BANDS = ["brief", "page", "scroll"] as const;

function clothLabel(v4: V4, cloth: EslCloth | string): string {
  if (cloth === "linen") return v4("eslLinen");
  if (cloth === "silk") return v4("eslSilk");
  if (cloth === "wool") return v4("eslWool");
  if (cloth === "velvet") return v4("eslVelvet");
  return v4("eslBlankCloth");
}

function stepLabel(v4: V4, step: EslStep | string): string {
  if (step === "knock") return v4("eslKnock");
  if (step === "walk") return v4("eslWalk");
  if (step === "rest") return v4("eslRest");
  return v4("eslBlankStep");
}

function weightLabel(v4: V4, weight: number | null): string {
  if (weight === 1) return v4("eslWeight1");
  if (weight === 3) return v4("eslWeight3");
  if (weight === 5) return v4("eslWeight5");
  return v4("eslBlankWeight");
}

function lengthLabel(v4: V4, length: number | null): string {
  if (length === 10) return v4("eslLength10");
  if (length === 20) return v4("eslLength20");
  if (length === 40) return v4("eslLength40");
  return v4("eslBlankLength");
}

function bandLabel(v4: V4, name: string): string {
  if (name === "brief") return v4("nrbBrief");
  if (name === "page") return v4("nrbPage");
  if (name === "scroll") return v4("nrbScroll");
  if (name === "blank") return v4("nrbClear");
  return v4("nrbUnmarked");
}

function toneLabel(v4: V4, name: string): string {
  if (name === "soft") return v4("nrbSoft");
  if (name === "hard") return v4("nrbHard");
  return v4("nrbUnmarked");
}

function auditLabel(v4: V4, audit: string): string {
  const key = {
    save: "eslAuditSave",
    edit: "eslAuditEdit",
    step: "eslAuditStep",
    pin: "eslAuditPin",
    unpin: "eslAuditUnpin",
    hold: "eslAuditHold",
    lift: "eslAuditLift",
    close: "eslAuditClose",
    reopen: "eslAuditReopen",
    cloth: "eslAuditCloth",
    tag: "eslAuditTag",
    quiet: "eslAuditQuiet",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, bell: number | null, desk: string): string {
  const gap = bellGap(bell, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("eslPast")} ${gap}`;
  if (gap < 0) return `${v4("eslAhead")} ${Math.abs(gap)}`;
  return v4("eslDue");
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

export function EscortSlips({ v4 }: { v4: V4 }) {
  const [slips, setSlips] = useState<EscortSlip[]>([]);
  const [views, setViews] = useState<EslView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [guide, setGuide] = useState("");
  const [bell, setBell] = useState("");
  const [cloth, setCloth] = useState("");
  const [bay, setBay] = useState("");
  const [step, setStep] = useState("");
  const [weight, setWeight] = useState("");
  const [lengthValue, setLengthValue] = useState("");
  const [tag, setTag] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<EslTray>("open");
  const [guideFilter, setGuideFilter] = useState("all");
  const [clothFilter, setClothFilter] = useState("all");
  const [bayFilter, setBayFilter] = useState("all");
  const [stepFilter, setStepFilter] = useState("all");
  const [bellFilter, setBellFilter] = useState("all");
  const [weightFilter, setWeightFilter] = useState("all");
  const [lengthFilter, setLengthFilter] = useState("all");
  const [walkingOnly, setWalkingOnly] = useState(false);
  const [chimeOnly, setChimeOnly] = useState(false);
  const [hushOnly, setHushOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [awakeOnly, setAwakeOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [order, setOrder] = useState<EslSort>("bell");
  const [density, setDensity] = useState<EslDensity>("roomy");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [deskBell, setDeskBell] = useState("");
  const [moveCloth, setMoveCloth] = useState("linen");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readSlips(readJson(ESL_KEY, []));
    const saved = readSlipViews(readJson(ESL_VIEW_KEY, []));
    setSlips(next);
    setViews(saved);
    setDensity(densityOf(readJson(ESL_DENSITY_KEY, "roomy")));
    writeJson(ESL_KEY, next);
    writeJson(ESL_VIEW_KEY, saved);
    setRole(storedRole());
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: EscortSlip[]) {
    const saved = readSlips(next);
    setSlips(saved);
    writeJson(ESL_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((slip) => slip.id === id)));
  }
  function storeViews(next: EslView[]) {
    const saved = readSlipViews(next);
    setViews(saved);
    writeJson(ESL_VIEW_KEY, saved);
  }
  function storeDensity(next: EslDensity) {
    setDensity(next);
    writeJson(ESL_DENSITY_KEY, next);
  }
  const guides = slipGuides(slips);
  const bays = slipBays(slips);
  const bars = CLOTHS.map((item) => ({ cloth: item, count: slips.filter((slip) => slip.cloth === item).length })).filter((row) => row.count > 0);
  const guideOn = activeGuide(guideFilter, guides);
  const clothOn = activeCloth(clothFilter, CLOTHS);
  const bayOn = activeBay(bayFilter, bays);
  const stepOn = activeStep(stepFilter, ["knock", "walk", "rest"]);
  const bellOn = activeBell(bellFilter);
  const weightOn = activeWeight(weightFilter);
  const lengthOn = activeLength(lengthFilter);
  const pickedBell = bellArg(bellOn);
  const shown = sortSlips(visibleSlips(
    slips,
    tray,
    query,
    guideArg(guideOn),
    clothArg(clothOn),
    bayArg(bayOn),
    stepArg(stepOn),
    pickedBell.exact,
    pickedBell.pick,
    weightArg(weightOn),
    lengthArg(lengthOn),
    walkingOnly,
    chimeOnly,
    houseOnly,
    hushOnly,
    awakeOnly,
  ), order);
  const timeline = slipTimeline(slips, query);
  const counts = slipCounts(slips, deskBell);
  const clashes = clashBellCount(slips);
  const weights = weightClashCount(slips);
  const nextId = nextSlip(slips, deskBell);
  const nextRow = slips.find((slip) => slip.id === nextId);
  const suggestedCloth = suggestCloth(slips);
  const suggestedGuide = suggestGuide(slips);
  const suggestedLength = suggestLength(slips);
  const fair = fairGuide(slips, roster);
  const busy = busiestGuide(slips);
  const reminders = reminderSlips(slips, deskBell);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const focusAt = shown.length ? moveFocus(focus, shown.length, 0) : 0;
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        titleRef.current?.focus();
        return;
      }
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveFocus(index, shown.length, -1));
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown.length]);
  function clearDraft() {
    setTitle("");
    setNote("");
    setGuide("");
    setBell("");
    setCloth("");
    setBay("");
    setStep("");
    setWeight("");
    setLengthValue("");
    setTag("");
    setQuery("");
    setEditing("");
  }
  return (
    <section className="c4-esl" aria-label={v4("eslTitle")} data-escorts="1" data-role={role} data-density={density}>
      <header className="c4-esl-mast">
        <div>
          <p className="c4-esl-kicker">{v4("eslSub")}</p>
          <h2 className="c4-title">{v4("eslTitle")}</h2>
        </div>
        <p className="c4-esl-plate" data-logo="mono">{v4("eslLogo")}</p>
      </header>
      <p className="c4-esl-rules">{v4("eslHint")}</p>
      <p className="c4-meta">{v4("eslLocal")}</p>
      <p className="c4-meta">{v4("eslNew")} {v4("eslSlash")} {v4("eslEscape")} {v4("eslKeys")}</p>
      {viewer && <p className="c4-esl-notice" data-viewer="1">{v4("eslViewer")}</p>}
      {counts.chime > 0 && (
        <p className="c4-esl-notice" role="status">
          {v4("eslNotice")} · {counts.chime}
          <button type="button" className="c4-btn" onClick={() => setChimeOnly((on) => !on)}>{chimeOnly ? v4("eslNoticeAll") : v4("eslNoticeChime")}</button>
        </p>
      )}
      <dl className="c4-esl-kpi" aria-label={v4("eslKpi")}>
        <div><dt>{v4("eslOpen")}</dt><dd>{counts.open}</dd></div>
        <div><dt>{v4("eslHeld")}</dt><dd>{counts.held}</dd></div>
        <div><dt>{v4("eslClosed")}</dt><dd>{counts.closed}</dd></div>
        <div><dt>{v4("eslPinned")}</dt><dd>{counts.pinned}</dd></div>
        <div><dt>{v4("eslChime")}</dt><dd>{counts.chime}</dd></div>
        <div><dt>{v4("eslLate")}</dt><dd>{counts.late}</dd></div>
        <div><dt>{v4("eslSoon")}</dt><dd>{counts.soon}</dd></div>
        <div><dt>{v4("eslQuiet")}</dt><dd>{counts.quiet}</dd></div>
        <div><dt>{v4("eslHouseShare")}</dt><dd>{slipShare(counts.house, slips.length)}%</dd></div>
      </dl>
      <div className="c4-esl-chart" aria-label={v4("eslCloths")}>
        {bars.map((bar) => (
          <div key={bar.cloth} className="c4-esl-col">
            <div className="c4-esl-track" aria-hidden="true"><i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            <button type="button" className="c4-btn" onClick={() => setClothFilter(bar.cloth)}>{clothLabel(v4, bar.cloth)} · {bar.count}</button>
          </div>
        ))}
        {!bars.length && <p className="c4-empty-gold">{v4("eslEmpty")}</p>}
      </div>
      <p className="c4-meta">{v4("eslSuggestCloth")} · {clothLabel(v4, suggestedCloth)} · {v4("eslSuggestGuide")} · {suggestedGuide || v4("eslBlankGuide")} · {v4("eslSuggestLength")} · {lengthLabel(v4, suggestedLength)}</p>
      <p className="c4-meta">{v4("eslBellUse")} · {usedBells(slips)} · {clashes ? `${v4("eslClash")} · ${clashes}` : v4("eslClashNone")} · {weights ? `${v4("eslWeightClash")} · ${weights}` : v4("eslWeightClashNone")}</p>
      <p className="c4-meta">{nextRow ? `${v4("eslNext")} · ${nextRow.title}` : v4("eslNextNone")} · {busy ? `${v4("eslBusiest")} · ${busy}` : v4("eslBusiestNone")} · {reminders.length ? `${v4("eslReminders")} · ${reminders.length}` : v4("eslReminderNone")}</p>
      <form className="c4-esl-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        store(addSlip(slips, {
          id: `s${Date.now().toString(36)}`,
          title,
          note,
          guide,
          bell,
          cloth,
          bay,
          step,
          weight,
          length: lengthValue,
          tags: tag,
        }));
        setTitle("");
        setNote("");
      }}>
        <label className="c4-lab"><span>{v4("eslLine")}</span>
          <input ref={titleRef} className="c4-field" aria-label={v4("eslLine")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("eslNote")}</span>
          <input className="c4-field" aria-label={v4("eslNote")} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("eslGuide")}</span>
          <input className="c4-field" aria-label={v4("eslGuide")} value={guide} disabled={viewer} onChange={(event) => setGuide(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("eslBell")}</span>
          <input className="c4-field" aria-label={v4("eslBell")} value={bell} disabled={viewer} onChange={(event) => setBell(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("eslCloth")}</span>
          <select className="c4-field" aria-label={v4("eslCloth")} value={cloth} disabled={viewer} onChange={(event) => setCloth(event.target.value)}>
            <option value="">{v4("eslBlankCloth")}</option>
            {CLOTHS.map((item) => <option key={item} value={item}>{clothLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("eslBay")}</span>
          <input className="c4-field" aria-label={v4("eslBay")} value={bay} disabled={viewer} onChange={(event) => setBay(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("eslStep")}</span>
          <select className="c4-field" aria-label={v4("eslStep")} value={step} disabled={viewer} onChange={(event) => setStep(event.target.value)}>
            <option value="">{v4("eslBlankStep")}</option>
            <option value="knock">{v4("eslKnock")}</option>
            <option value="walk">{v4("eslWalk")}</option>
            <option value="rest">{v4("eslRest")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("eslWeight")}</span>
          <input className="c4-field" aria-label={v4("eslWeight")} value={weight} disabled={viewer} onChange={(event) => setWeight(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("eslLength")}</span>
          <input className="c4-field" aria-label={v4("eslLength")} value={lengthValue} disabled={viewer} onChange={(event) => setLengthValue(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("eslTag")}</span>
          <input className="c4-field" aria-label={v4("eslTag")} value={tag} disabled={viewer} onChange={(event) => setTag(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("eslRoster")}</span>
          <input className="c4-field" aria-label={v4("eslRoster")} value={roster} disabled={viewer} onChange={(event) => setRoster(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("eslAdd")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setCloth(suggestedCloth)}>{v4("eslUseCloth")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !suggestedGuide} onClick={() => setGuide(suggestedGuide)}>{v4("eslUseGuide")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setLengthValue(String(suggestedLength))}>{v4("eslUseLength")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setGuide(fair)}>{v4("eslAssign")}</button>
      </form>
      <div className="c4-esl-filters">
        <label className="c4-lab"><span>{v4("eslSearch")}</span>
          <input ref={searchRef} className="c4-field" aria-label={v4("eslSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab"><span>{v4("eslBell")}</span>
          <input className="c4-field" aria-label={v4("eslDeskBell")} value={deskBell} onChange={(event) => setDeskBell(event.target.value)} />
        </label>
      </div>
      <div className="c4-row">
        {(["open", "held", "closed"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} aria-pressed={tray === item} onClick={() => setTray(item)}>
            {item === "open" ? v4("eslOpen") : item === "held" ? v4("eslHeld") : v4("eslClosed")}
          </button>
        ))}
        <button type="button" className="c4-chip" data-on={walkingOnly ? "1" : "0"} aria-pressed={walkingOnly} onClick={() => setWalkingOnly((on) => !on)}>{v4("eslWalking")}</button>
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} aria-pressed={houseOnly} onClick={() => setHouseOnly((on) => !on)}>{v4("eslHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={hushOnly ? "1" : "0"} aria-pressed={hushOnly} onClick={() => setHushOnly((on) => !on)}>{v4("eslHushOnly")}</button>
        <button type="button" className="c4-chip" data-on={awakeOnly ? "1" : "0"} aria-pressed={awakeOnly} onClick={() => setAwakeOnly((on) => !on)}>{v4("eslAwake")}</button>
        <button type="button" className="c4-chip" data-on={board === "cards" ? "1" : "0"} aria-pressed={board === "cards"} onClick={() => setBoard("cards")}>{v4("eslCards")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard("timeline")}>{v4("eslTimeline")}</button>
        <button type="button" className="c4-chip" data-on={order === "bell" ? "1" : "0"} aria-pressed={order === "bell"} onClick={() => setOrder(sortMode(order === "bell" ? "title" : "bell"))}>{order === "bell" ? v4("eslSortBell") : v4("eslSortTitle")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} aria-pressed={density === "tight"} onClick={() => storeDensity(densityOf(density === "tight" ? "roomy" : "tight"))}>{density === "tight" ? v4("eslTight") : v4("eslRoomy")}</button>
      </div>
      <div className="c4-esl-filters">
        <label className="c4-lab"><span>{v4("eslGuide")}</span>
          <select className="c4-field" aria-label={v4("eslGuide")} value={guideOn} onChange={(event) => setGuideFilter(event.target.value)}>
            <option value="all">{v4("eslAll")}</option>
            <option value="blank">{v4("eslBlankGuide")}</option>
            {guides.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("eslCloth")}</span>
          <select className="c4-field" aria-label={v4("eslCloth")} value={clothOn} onChange={(event) => setClothFilter(event.target.value)}>
            <option value="all">{v4("eslAll")}</option>
            <option value="blank">{v4("eslBlankCloth")}</option>
            {CLOTHS.map((item) => <option key={item} value={item}>{clothLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("eslBay")}</span>
          <select className="c4-field" aria-label={v4("eslBay")} value={bayOn} onChange={(event) => setBayFilter(event.target.value)}>
            <option value="all">{v4("eslAll")}</option>
            <option value="blank">{v4("eslBlankBay")}</option>
            {bays.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("eslStep")}</span>
          <select className="c4-field" aria-label={v4("eslStep")} value={stepOn} onChange={(event) => setStepFilter(event.target.value)}>
            <option value="all">{v4("eslAll")}</option>
            <option value="blank">{v4("eslBlankStep")}</option>
            <option value="knock">{v4("eslKnock")}</option>
            <option value="walk">{v4("eslWalk")}</option>
            <option value="rest">{v4("eslRest")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("eslBell")}</span>
          <select className="c4-field" aria-label={v4("eslBell")} value={bellOn} onChange={(event) => setBellFilter(event.target.value)}>
            <option value="all">{v4("eslAll")}</option>
            <option value="blank">{v4("eslBlankBell")}</option>
            <option value="morning">{v4("eslMorning")}</option>
            <option value="noon">{v4("eslNoon")}</option>
            <option value="evening">{v4("eslEvening")}</option>
            <option value="chime">{v4("eslChime")}</option>
            <option value="hush">{v4("eslHush")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("eslWeight")}</span>
          <select className="c4-field" aria-label={v4("eslWeight")} value={weightOn} onChange={(event) => setWeightFilter(event.target.value)}>
            <option value="all">{v4("eslAll")}</option>
            <option value="blank">{v4("eslBlankWeight")}</option>
            <option value="1">{v4("eslWeight1")}</option>
            <option value="3">{v4("eslWeight3")}</option>
            <option value="5">{v4("eslWeight5")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("eslLength")}</span>
          <select className="c4-field" aria-label={v4("eslLength")} value={lengthOn} onChange={(event) => setLengthFilter(event.target.value)}>
            <option value="all">{v4("eslAll")}</option>
            <option value="blank">{v4("eslBlankLength")}</option>
            <option value="10">{v4("eslLength10")}</option>
            <option value="20">{v4("eslLength20")}</option>
            <option value="40">{v4("eslLength40")}</option>
          </select>
        </label>
      </div>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        if (viewer || !viewName.trim()) return;
        storeViews(addSlipView(views, {
          id: `v${Date.now().toString(36)}`,
          name: viewName,
          tray,
          query,
          guide: guideOn,
          cloth: clothOn,
          bay: bayOn,
          step: stepOn,
          bell: bellOn,
          weight: weightOn,
          length: lengthOn,
        }));
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("eslViews")}</span>
          <input className="c4-field" aria-label={v4("eslViews")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("eslSaveView")}</button>
      </form>
      {!!views.length && (
        <ul className="c4-esl-views">
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => {
                setTray(view.tray);
                setQuery(view.query);
                setGuideFilter(view.guide);
                setClothFilter(view.cloth);
                setBayFilter(view.bay);
                setStepFilter(view.step);
                setBellFilter(view.bell);
                setWeightFilter(view.weight);
                setLengthFilter(view.length);
              }}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropSlipView(views, view.id))}>{v4("eslDropView")}</button>
            </li>
          ))}
        </ul>
      )}
      <div className="c4-row">
        <button type="button" className="c4-btn" onClick={() => setPicked(shown.map((slip) => slip.id))}>{v4("eslPickAll")}</button>
        <button type="button" className="c4-btn" onClick={() => setPicked([])}>{v4("eslPickNone")}</button>
        <p className="c4-meta">{v4("eslPicked")} · {picked.length}</p>
        <label className="c4-lab"><span>{v4("eslBulkCloth")}</span>
          <select className="c4-field" aria-label={v4("eslBulkCloth")} value={moveCloth} disabled={viewer} onChange={(event) => setMoveCloth(event.target.value)}>
            {CLOTHS.map((item) => <option key={item} value={item}>{clothLabel(v4, item)}</option>)}
          </select>
        </label>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSlipCloth(slips, picked, moveCloth))}>{v4("eslBulkCloth")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSlipPin(slips, picked, true))}>{v4("eslBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSlipClose(slips, picked, true))}>{v4("eslBulkClose")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length || !tag} onClick={() => store(bulkSlipTag(slips, picked, tag))}>{v4("eslBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("escort-slips.csv", slipsCsv(slips, deskBell))}>{v4("eslCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetSlips())}>{v4("eslReset")}</button>
      </div>
      {board === "timeline" ? (
        <ol className="c4-esl-timeline">
          {timeline.map((slip) => (
            <li key={slip.id}>
              <strong>{slip.bell}</strong> {slip.title}
              <span className="c4-meta"> {gapLabel(v4, slip.bell, deskBell)}</span>
            </li>
          ))}
          {!timeline.length && <li className="c4-empty-gold">{v4("eslEmpty")}</li>}
        </ol>
      ) : (
        <ul className="c4-esl-cards">
          {shown.map((slip, index) => {
            const openEdit = editing === slip.id;
            const gap = gapLabel(v4, slip.bell, deskBell);
            const late = lateSlip(slip, deskBell);
            const soon = soonSlip(slip);
            return (
              <li key={slip.id} data-late={late ? "1" : "0"} data-soon={soon ? "1" : "0"} data-house={houseBay(slip.bay) ? "1" : "0"} data-cloth={slip.cloth || "blank"} data-chime={chimeBell(slip.bell) ? "1" : "0"} data-focus={index === focusAt ? "1" : "0"} tabIndex={index === focusAt ? 0 : -1}>
                <label className="c4-row">
                  <input type="checkbox" checked={picked.includes(slip.id)} aria-label={slip.title} onChange={() => setPicked((ids) => ids.includes(slip.id) ? ids.filter((id) => id !== slip.id) : [...ids, slip.id])} />
                  {openEdit ? (
                    <span className="c4-stack">
                      <input className="c4-field" aria-label={v4("eslLine")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <input className="c4-field" aria-label={v4("eslNote")} value={noteDraft} disabled={viewer} onChange={(event) => setNoteDraft(event.target.value)} />
                    </span>
                  ) : (
                    <span><strong>{slip.title}</strong> <span className="c4-meta">{slip.note}</span></span>
                  )}
                </label>
                <p className="c4-meta">{slip.guide || v4("eslBlankGuide")} · {slip.bell ?? v4("eslBlankBell")} · {clothLabel(v4, slip.cloth)} · {slip.bay || v4("eslBlankBay")} · {stepLabel(v4, slip.step)} · {weightLabel(v4, slip.weight)} · {lengthLabel(v4, slip.length)} · {slip.tags.join(" ") || v4("eslBlankTag")} · {gap} {auditLabel(v4, slip.audit)}</p>
                <div className="c4-row">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipPin(slips, slip.id, !slip.pinned))}>{slip.pinned ? v4("eslUnpin") : v4("eslPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipHold(slips, slip.id, !slip.held))}>{slip.held ? v4("eslLift") : v4("eslHold")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipClose(slips, slip.id, !slip.closed))}>{slip.closed ? v4("eslReopen") : v4("eslClose")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleStep(slips, slip.id))}>{v4("eslStepUp")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipQuiet(slips, slip.id, slip.quiet === 0 ? 10 : slip.quiet === 10 ? 20 : 0))}>{slip.quiet ? `${v4("eslQuietOn")} ${slip.quiet}` : v4("eslQuietOff")}</button>
                  <button type="button" className="c4-btn" disabled={viewer || !tag} onClick={() => store(addSlipTag(slips, slip.id, tag))}>{v4("eslTag")}</button>
                  {openEdit ? (
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
                      store(editSlipNote(editSlip(slips, slip.id, draft), slip.id, noteDraft));
                      setEditing("");
                    }}>{v4("eslEdit")}</button>
                  ) : (
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
                      setEditing(slip.id);
                      setDraft(slip.title);
                      setNoteDraft(slip.note);
                    }}>{v4("eslEdit")}</button>
                  )}
                  <button type="button" className="c4-btn" onClick={() => {
                    void navigator.clipboard?.writeText(slipCopy(slip, deskBell));
                    setCopied(slip.id);
                  }}>{copied === slip.id ? v4("eslCopied") : v4("eslCopy")}</button>
                </div>
              </li>
            );
          })}
          {!shown.length && <li className="c4-empty-gold">{v4("eslEmpty")}</li>}
        </ul>
      )}
      <p className="c4-meta">{v4("eslRules")}</p>
    </section>
  );
}

export function NoteRibbons({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [band, setBand] = useState("all");
  const [tone, setTone] = useState("all");
  const [shape, setShape] = useState<RibbonShape>("all");
  const [review, setReview] = useState<"all" | "reviewed" | "open">("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<GlanceRow[]>(() => (data.data?.users || []).map((user) => ({
    id: user.id,
    label: user.name || user.id,
    note: { retentionNote: user.retentionNote ?? null },
  })), [data.data?.users]);
  useEffect(() => {
    setRole(storedRole());
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  useEffect(() => {
    const present = presentRibbons(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenRibbons(readJson(RIBBON_KEY, []), present);
    const nextReviewed = readReviewedRibbons(readJson(RIBBON_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(RIBBON_KEY, nextHidden);
    writeJson(RIBBON_REVIEW_KEY, nextReviewed);
  }, [rows]);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "n" || event.key === "N" || event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const present = presentRibbons(rows);
  const bands = visibleRibbonBands(present, hidden, showHidden);
  const bandOn = activeRibbonBand(band, present);
  const toneOn = activeRibbonTone(tone);
  const shown = visibleRibbonCustomers(rows, ribbonBandArg(bandOn), ribbonToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = ribbonState(row.note);
      const token = state === "set" ? ribbonBand(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return bands.includes(token);
    });
  const lead = leadingRibbon(rows);
  const toneLead = leadingRibbonTone(rows);
  const shared = sharedRibbonCount(rows);
  const catalog = catalogRibbonCount(rows);
  const bars = ribbonBands(rows).filter((line) => line.band);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(RIBBON_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedRibbons(next, ids);
    setReviewed(saved);
    writeJson(RIBBON_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-nrb" aria-label={v4("nrbTitle")} data-ribbons="1" data-role={role} data-catalog={catalog ? "1" : "0"}>
      <header className="c4-nrb-mast">
        <div>
          <p className="c4-nrb-kicker">{v4("nrbSub")}</p>
          <h2 className="c4-title">{v4("nrbTitle")}</h2>
        </div>
        <p className="c4-nrb-plate" data-logo="mono">{v4("nrbLogo")}</p>
      </header>
      <p className="c4-nrb-rules">{v4("nrbHint")}</p>
      <p className="c4-meta">{v4("nrbKept")} {v4("nrbEscape")}</p>
      {viewer && <p className="c4-nrb-notice" data-viewer="1">{v4("nrbViewer")}</p>}
      {data.error && <p className="c4-empty-gold" role="alert">{v4("nrbFailed")}</p>}
      {data.loading && <p className="c4-meta">{v4("nrbLoading")}</p>}
      {shared > 0 && <p className="c4-nrb-notice" role="status">{v4("nrbNotice")} · {shared}</p>}
      <dl className="c4-nrb-kpi" aria-label={v4("nrbKpi")}>
        <div><dt>{v4("nrbSet")}</dt><dd>{rows.filter((row) => ribbonState(row.note) === "set").length}</dd></div>
        <div><dt>{v4("nrbCatalog")}</dt><dd>{catalog}</dd></div>
        <div><dt>{v4("nrbScrollCount")}</dt><dd>{scrollRibbonCount(rows)}</dd></div>
        <div><dt>{v4("nrbSoftCount")}</dt><dd>{softRibbonCount(rows)}</dd></div>
        <div><dt>{v4("nrbShare")}</dt><dd>{ribbonShare(catalog, rows.length)}%</dd></div>
        <div><dt>{v4("nrbShared")}</dt><dd>{shared}</dd></div>
      </dl>
      <div className="c4-nrb-chart" aria-label={v4("nrbBands")}>
        {bars.map((bar) => (
          <div key={bar.band} className="c4-nrb-col">
            <div className="c4-nrb-track" aria-hidden="true"><i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            <button type="button" className="c4-btn" onClick={() => setBand(bar.band)}>{bandLabel(v4, bar.band)} · {bar.count}</button>
          </div>
        ))}
        {!bars.length && <p className="c4-empty-gold">{v4("nrbEmpty")}</p>}
      </div>
      <p className="c4-meta">{lead ? `${v4("nrbLeading")} · ${bandLabel(v4, lead)}` : v4("nrbLeadingNone")} · {toneLead ? `${v4("nrbToneLead")} · ${toneLabel(v4, toneLead)}` : v4("nrbToneNone")} · {shared ? `${v4("nrbShared")} · ${shared}` : v4("nrbSharedNone")}</p>
      <div className="c4-nrb-filters">
        <label className="c4-lab"><span>{v4("nrbSearch")}</span>
          <input ref={searchRef} className="c4-field" aria-label={v4("nrbSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            setQuery("");
          }} />
        </label>
        <label className="c4-lab"><span>{v4("nrbBands")}</span>
          <select className="c4-field" aria-label={v4("nrbBands")} value={bandOn} onChange={(event) => setBand(event.target.value)}>
            <option value="all">{v4("nrbAll")}</option>
            <option value="blank">{v4("nrbClear")}</option>
            {BANDS.map((item) => <option key={item} value={item}>{bandLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("nrbTone")}</span>
          <select className="c4-field" aria-label={v4("nrbTone")} value={toneOn} onChange={(event) => setTone(event.target.value)}>
            <option value="all">{v4("nrbAll")}</option>
            <option value="soft">{v4("nrbSoft")}</option>
            <option value="hard">{v4("nrbHard")}</option>
          </select>
        </label>
      </div>
      <div className="c4-row">
        {(["all", "catalog", "scroll", "soft"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} aria-pressed={shape === item} onClick={() => setShape(item)}>
            {item === "all" ? v4("nrbAllShapes") : item === "catalog" ? v4("nrbCatalog") : item === "scroll" ? v4("nrbScroll") : v4("nrbSoft")}
          </button>
        ))}
        {(["all", "reviewed", "open"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} aria-pressed={review === item} onClick={() => setReview(item)}>
            {item === "all" ? v4("nrbAllReview") : item === "reviewed" ? v4("nrbReviewed") : v4("nrbOpenReview")}
          </button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("nrbShown") : v4("nrbHidden")}</button>
      </div>
      <ul className="c4-nrb-bands" aria-label={v4("nrbBands")}>
        {present.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleRibbon(hidden, item, present))}>{bandLabel(v4, item)} · {hidden.includes(item) ? v4("nrbShow") : v4("nrbHide")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-row">
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkRibbonReview(reviewed, shown.flatMap((row) => (row.id ? [row.id] : [])), ids, true))}>{v4("nrbBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkRibbonReview(reviewed, shown.flatMap((row) => (row.id ? [row.id] : [])), ids, false))}>{v4("nrbBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("note-ribbons.csv", ribbonsCsv(rows))}>{v4("nrbCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("note-ribbon-rows.csv", ribbonRowsCsv(shown, reviewed))}>{v4("nrbRowCsv")}</button>
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("nrbCustomers")}</Link>
      </div>
      <ul className="c4-nrb-rows">
        {shown.map((row) => {
          const code = ribbonCopy(row.note);
          const marked = reviewed.includes(row.id);
          return (
            <li key={row.id || row.label} data-band={ribbonBand(row.note) || "blank"} data-tone={ribbonTone(row.note) || "blank"} data-catalog={catalogRibbon(row.note) ? "1" : "0"} data-reviewed={marked ? "1" : "0"}>
              <strong>{row.label}</strong>
              <p className="c4-meta">{code || v4("nrbClear")} · {bandLabel(v4, ribbonBand(row.note) || (ribbonState(row.note) === "clear" ? "blank" : ""))} · {toneLabel(v4, ribbonTone(row.note))} {catalogRibbon(row.note) ? `· ${v4("nrbCatalogMark")}` : ""}</p>
              <div className="c4-row">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleRibbonReview(reviewed, row.id, ids))}>{marked ? v4("nrbReviewed") : v4("nrbReview")}</button>
                <button type="button" className="c4-btn" disabled={!code} onClick={() => {
                  if (!code) return;
                  void navigator.clipboard?.writeText(code);
                  setCopied(row.id);
                }}>{copied === row.id ? v4("nrbCopied") : v4("nrbCopy")}</button>
              </div>
            </li>
          );
        })}
        {!data.loading && !shown.length && <li className="c4-empty-gold">{v4("nrbEmpty")}</li>}
      </ul>
      <p className="c4-meta">{v4("nrbRules")}</p>
    </section>
  );
}
