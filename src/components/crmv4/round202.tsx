"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  GWK_DENSITY_KEY,
  GWK_KEY,
  GWK_VIEW_KEY,
  TZN_KEY,
  TZN_REVIEW_KEY,
  activeGuide,
  activeLamp,
  activeLength,
  activePace,
  activeStep,
  activeWing,
  activeZoneBand,
  activeZoneTone,
  addWalk,
  addWalkView,
  adjacentWalkCount,
  bulkWalkClose,
  bulkWalkPin,
  bulkWalkTag,
  bulkWalkWing,
  bulkZoneReview,
  busiestGuide,
  catalogZone,
  catalogZoneCount,
  clashStepCount,
  cyclePace,
  densityOf,
  dropWalkView,
  editWalk,
  editWalkNote,
  fairGuide,
  guideArg,
  homeZoneCount,
  houseWing,
  lampArg,
  lampClashCount,
  lateWalk,
  leadingZone,
  leadingZoneTone,
  lengthArg,
  moveFocus,
  nextWalk,
  paceArg,
  pairZoneCount,
  peakStep,
  pinFocused,
  presentZones,
  quietStep,
  readHiddenZones,
  readReviewedZones,
  readWalkViews,
  readWalks,
  reminderWalks,
  resetWalks,
  setWalkClose,
  setWalkHold,
  setWalkPin,
  setWalkRest,
  sharedZoneCount,
  soonWalk,
  sortMode,
  sortWalks,
  stepArg,
  stepGap,
  suggestGuide,
  suggestLength,
  suggestWing,
  toggleZone,
  toggleZoneReview,
  usedSteps,
  visibleWalks,
  visibleZoneBands,
  visibleZoneCustomers,
  walkCopy,
  walkCounts,
  walkGuides,
  walkShare,
  walkTimeline,
  walkWings,
  walksCsv,
  wingArg,
  zoneBand,
  zoneBandArg,
  zoneBands,
  zoneCopy,
  zoneOf,
  zoneRowsCsv,
  zoneShare,
  zoneState,
  zoneTone,
  zoneToneArg,
  zonesCsv,
  type GalleryWalk,
  type WalkDensity,
  type WalkSort,
  type WalkTray,
  type WalkView,
  type WalkWing,
  type ZoneRow,
  type ZoneShape,
} from "@/lib/crmv4/round202";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  timezone?: string | null;
};

type GlanceRow = ZoneRow & { id: string };

const WINGS = ["north", "south", "court"] as const;
const BANDS = ["stem", "pair"] as const;

function wingLabel(v4: V4, wing: WalkWing | string): string {
  if (wing === "north" || wing === "NORTH") return v4("gwkNorth");
  if (wing === "south" || wing === "SOUTH") return v4("gwkSouth");
  if (wing === "court" || wing === "COURT") return v4("gwkCourt");
  return v4("gwkBlankWing");
}

function paceLabel(v4: V4, pace: string): string {
  if (pace === "stroll") return v4("gwkStroll");
  if (pace === "pause") return v4("gwkPause");
  if (pace === "close") return v4("gwkClosePace");
  return v4("gwkBlankPace");
}

function lampLabel(v4: V4, lamp: number | null): string {
  if (lamp === 1) return v4("gwkLamp1");
  if (lamp === 3) return v4("gwkLamp3");
  if (lamp === 9) return v4("gwkLamp9");
  return v4("gwkBlankLamp");
}

function lengthLabel(v4: V4, length: number | null): string {
  if (length === 10) return v4("gwkLen10");
  if (length === 20) return v4("gwkLen20");
  if (length === 40) return v4("gwkLen40");
  return v4("gwkBlankLength");
}

function bandLabel(v4: V4, name: string): string {
  if (name === "stem") return v4("tznStem");
  if (name === "pair") return v4("tznPair");
  if (name === "blank") return v4("tznClear");
  return v4("tznUnmarked");
}

function toneLabel(v4: V4, name: string): string {
  if (name === "home") return v4("tznHome");
  if (name === "away") return v4("tznAway");
  return v4("tznUnmarked");
}

function auditLabel(v4: V4, audit: string): string {
  const key = {
    save: "gwkAuditSave",
    edit: "gwkAuditEdit",
    pace: "gwkAuditPace",
    pin: "gwkAuditPin",
    unpin: "gwkAuditUnpin",
    hold: "gwkAuditHold",
    lift: "gwkAuditLift",
    close: "gwkAuditClose",
    open: "gwkAuditOpen",
    wing: "gwkAuditWing",
    tag: "gwkAuditTag",
    rest: "gwkAuditRest",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, step: number | null, desk: string): string {
  const gap = stepGap(step, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("gwkPast")} ${gap}`;
  if (gap < 0) return `${v4("gwkAhead")} ${Math.abs(gap)}`;
  return v4("gwkDue");
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
  const node = event.target as HTMLElement | null;
  if (!node) return false;
  const tag = node.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || node.isContentEditable;
}

export function GalleryWalks({ v4 }: { v4: V4 }) {
  const [walks, setWalks] = useState<GalleryWalk[]>([]);
  const [views, setViews] = useState<WalkView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [guide, setGuide] = useState("");
  const [step, setStep] = useState("");
  const [wing, setWing] = useState("");
  const [pace, setPace] = useState("");
  const [lamp, setLamp] = useState("");
  const [lengthValue, setLengthValue] = useState("");
  const [tag, setTag] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<WalkTray>("open");
  const [guideFilter, setGuideFilter] = useState("all");
  const [wingFilter, setWingFilter] = useState("all");
  const [paceFilter, setPaceFilter] = useState("all");
  const [stepFilter, setStepFilter] = useState("all");
  const [lampFilter, setLampFilter] = useState("all");
  const [lengthFilter, setLengthFilter] = useState("all");
  const [pauseOnly, setPauseOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [awakeOnly, setAwakeOnly] = useState(false);
  const [board, setBoard] = useState<"program" | "timeline">("program");
  const [order, setOrder] = useState<WalkSort>("step");
  const [density, setDensity] = useState<WalkDensity>("roomy");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [deskStep, setDeskStep] = useState("");
  const [moveWing, setMoveWing] = useState("south");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readWalks(readJson(GWK_KEY, []));
    const saved = readWalkViews(readJson(GWK_VIEW_KEY, []));
    setWalks(next);
    setViews(saved);
    setDensity(densityOf(readJson(GWK_DENSITY_KEY, "roomy")));
    writeJson(GWK_KEY, next);
    writeJson(GWK_VIEW_KEY, saved);
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: GalleryWalk[]) {
    const saved = readWalks(next);
    setWalks(saved);
    writeJson(GWK_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((walk) => walk.id === id)));
  }
  function storeViews(next: WalkView[]) {
    const saved = readWalkViews(next);
    setViews(saved);
    writeJson(GWK_VIEW_KEY, saved);
  }
  function storeDensity(next: WalkDensity) {
    setDensity(next);
    writeJson(GWK_DENSITY_KEY, next);
  }
  const guides = walkGuides(walks);
  const wings = walkWings(walks);
  const bars = WINGS.map((item) => ({ wing: item.toUpperCase(), count: walks.filter((walk) => walk.wing === item.toUpperCase()).length })).filter((row) => row.count > 0);
  const guideOn = activeGuide(guideFilter, guides);
  const wingOn = activeWing(wingFilter, wings);
  const paceOn = activePace(paceFilter, ["stroll", "pause", "close"]);
  const stepOn = activeStep(stepFilter);
  const lampOn = activeLamp(lampFilter);
  const lengthOn = activeLength(lengthFilter);
  const pickedStep = stepArg(stepOn);
  const shown = sortWalks(visibleWalks(
    walks,
    tray,
    query,
    guideArg(guideOn),
    wingArg(wingOn),
    paceArg(paceOn),
    pickedStep.exact,
    pickedStep.pick,
    lampArg(lampOn),
    lengthArg(lengthOn),
    pauseOnly,
    peakOnly,
    houseOnly,
    quietOnly,
    awakeOnly,
  ), order);
  const timeline = walkTimeline(walks, query);
  const counts = walkCounts(walks, deskStep);
  const clashes = clashStepCount(walks);
  const lamps = lampClashCount(walks);
  const neighbors = adjacentWalkCount(walks);
  const nextId = nextWalk(walks, deskStep);
  const nextRow = walks.find((walk) => walk.id === nextId);
  const suggestedWing = suggestWing(walks);
  const suggestedGuide = suggestGuide(walks);
  const suggestedLength = suggestLength(walks);
  const fair = fairGuide(walks, roster);
  const busy = busiestGuide(walks);
  const reminders = reminderWalks(walks, deskStep);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const focusAt = shown.length ? moveFocus(focus, shown.length, 0) : 0;
  pinRef.current = () => {
    if (viewer) return;
    const ids = (board === "timeline" ? timeline : shown).map((walk) => walk.id);
    store(pinFocused(walks, ids, focus));
  };
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        clearDraft();
        return;
      }
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
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        pinRef.current();
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
    setStep("");
    setWing("");
    setPace("");
    setLamp("");
    setLengthValue("");
    setTag("");
    setQuery("");
    setEditing("");
  }
  function applyView(view: WalkView) {
    setTray(view.tray);
    setQuery(view.query);
    setGuideFilter(view.guide);
    setWingFilter(view.wing);
    setPaceFilter(view.pace);
    setStepFilter(view.step);
    setLampFilter(view.lamp);
    setLengthFilter(view.length);
  }
  const rows = board === "timeline" ? timeline : shown;
  return (
    <section className="c4-gwk" aria-label={v4("gwkTitle")} data-walks="1" data-role={role} data-density={density}>
      <div className="c4-gwk-sheet">
        <header className="c4-gwk-mast">
          <p className="c4-gwk-spine">{v4("gwkSpine")}</p>
          <div>
            <p className="c4-gwk-kicker">{v4("gwkSub")}</p>
            <h2 className="c4-title">{v4("gwkTitle")}</h2>
          </div>
          <p className="c4-gwk-plate" data-logo="mono">{v4("gwkLogo")}</p>
        </header>
        <div className="c4-gwk-body">
          <p className="c4-gwk-rules">{v4("gwkHint")}</p>
          <p className="c4-meta">{v4("gwkLocal")}</p>
          <p className="c4-meta">{v4("gwkNew")} {v4("gwkSlash")} {v4("gwkEscape")} {v4("gwkKeys")} {v4("gwkPinKey")}</p>
          {viewer && <p className="c4-gwk-notice" data-viewer="1">{v4("gwkViewer")}</p>}
          {counts.peak > 0 && (
            <p className="c4-gwk-notice" role="status">
              {v4("gwkNotice")} · {counts.peak}
              <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("gwkNoticeAll") : v4("gwkNoticePeak")}</button>
            </p>
          )}
          <ol className="c4-gwk-ledger" aria-label={v4("gwkKpi")}>
            <li><span>{v4("gwkOpen")}</span><strong>{counts.open}</strong></li>
            <li><span>{v4("gwkHeld")}</span><strong>{counts.held}</strong></li>
            <li><span>{v4("gwkClosed")}</span><strong>{counts.closed}</strong></li>
            <li><span>{v4("gwkPinned")}</span><strong>{counts.pinned}</strong></li>
            <li><span>{v4("gwkPeak")}</span><strong>{counts.peak}</strong></li>
            <li><span>{v4("gwkLate")}</span><strong>{counts.late}</strong></li>
            <li><span>{v4("gwkSoon")}</span><strong>{counts.soon}</strong></li>
            <li><span>{v4("gwkRest")}</span><strong>{counts.rest}</strong></li>
            <li><span>{v4("gwkHouseShare")}</span><strong>{walkShare(counts.house, walks.length)}%</strong></li>
          </ol>
          <div className="c4-gwk-rail" aria-label={v4("gwkWings")}>
            {bars.map((bar) => (
              <div key={bar.wing} className="c4-gwk-meter" data-wing={bar.wing.toLowerCase()}>
                <button type="button" className="c4-btn" onClick={() => setWingFilter(bar.wing)}>{wingLabel(v4, bar.wing)} · {bar.count}</button>
                <div className="c4-gwk-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
              </div>
            ))}
            {!bars.length && <p className="c4-gwk-empty">{v4("gwkEmpty")}</p>}
          </div>
          <div className="c4-gwk-suggest">
            <p>{v4("gwkSuggestWing")} · {wingLabel(v4, suggestedWing)}</p>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setWing(suggestedWing.toLowerCase())}>{v4("gwkUseWing")}</button>
            <p>{v4("gwkSuggestGuide")} · {suggestedGuide || v4("gwkBlankGuide")}</p>
            <button type="button" className="c4-btn" disabled={viewer || !suggestedGuide} onClick={() => setGuide(suggestedGuide)}>{v4("gwkUseGuide")}</button>
            <p>{v4("gwkSuggestLength")} · {lengthLabel(v4, suggestedLength)}</p>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setLengthValue(String(suggestedLength))}>{v4("gwkUseLength")}</button>
            <p>{v4("gwkAssign")} · {fair || v4("gwkBlankGuide")}</p>
            <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setGuide(fair)}>{v4("gwkAssign")}</button>
            <p>{v4("gwkSteps")} · {usedSteps(walks)}</p>
            <p>{clashes ? `${v4("gwkClash")} · ${clashes}` : v4("gwkClashNone")}</p>
            <p>{lamps ? `${v4("gwkLampClash")} · ${lamps}` : v4("gwkLampClashNone")}</p>
            <p>{neighbors ? `${v4("gwkAdjacent")} · ${neighbors}` : v4("gwkAdjacentNone")}</p>
            <p>{v4("gwkNext")} · {nextRow ? nextRow.title : v4("gwkNextNone")}</p>
            <p>{v4("gwkBusiest")} · {busy || v4("gwkBusiestNone")}</p>
            <p>{v4("gwkReminders")} · {reminders.length ? reminders.map((walk) => walk.title).join(", ") : v4("gwkReminderNone")}</p>
          </div>
          <form className="c4-gwk-form" onSubmit={(event) => {
            event.preventDefault();
            if (viewer) return;
            const next = addWalk(walks, {
              id: `w${Date.now().toString(36)}`,
              title,
              note,
              guide,
              step,
              wing,
              pace,
              lamp,
              length: lengthValue,
              tags: tag,
              rest: "0",
            });
            const added = next[0];
            if (added && (added.title !== walks[0]?.title || next.length !== walks.length)) {
              store(next);
              clearDraft();
            }
          }}>
            <label className="c4-lab">{v4("gwkLine")}<input ref={titleRef} className="c4-field" aria-label={v4("gwkLine")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
            <label className="c4-lab">{v4("gwkNote")}<input className="c4-field" aria-label={v4("gwkNote")} value={note} onChange={(event) => setNote(event.target.value)} /></label>
            <label className="c4-lab">{v4("gwkGuide")}<input className="c4-field" aria-label={v4("gwkGuide")} value={guide} onChange={(event) => setGuide(event.target.value)} /></label>
            <label className="c4-lab">{v4("gwkStep")}<input className="c4-field" inputMode="numeric" aria-label={v4("gwkStep")} value={step} onChange={(event) => setStep(event.target.value)} /></label>
            <label className="c4-lab">{v4("gwkWing")}
              <select className="c4-field" aria-label={v4("gwkWing")} value={wing} onChange={(event) => setWing(event.target.value)}>
                <option value="">{v4("gwkBlankWing")}</option>
                {WINGS.map((item) => <option key={item} value={item}>{wingLabel(v4, item)}</option>)}
              </select>
            </label>
            <label className="c4-lab">{v4("gwkPace")}
              <select className="c4-field" aria-label={v4("gwkPace")} value={pace} onChange={(event) => setPace(event.target.value)}>
                <option value="">{v4("gwkBlankPace")}</option>
                <option value="stroll">{v4("gwkStroll")}</option>
                <option value="pause">{v4("gwkPause")}</option>
                <option value="close">{v4("gwkClosePace")}</option>
              </select>
            </label>
            <label className="c4-lab">{v4("gwkLamp")}
              <select className="c4-field" aria-label={v4("gwkLamp")} value={lamp} onChange={(event) => setLamp(event.target.value)}>
                <option value="">{v4("gwkBlankLamp")}</option>
                <option value="1">{v4("gwkLamp1")}</option>
                <option value="3">{v4("gwkLamp3")}</option>
                <option value="9">{v4("gwkLamp9")}</option>
              </select>
            </label>
            <label className="c4-lab">{v4("gwkLength")}
              <select className="c4-field" aria-label={v4("gwkLength")} value={lengthValue} onChange={(event) => setLengthValue(event.target.value)}>
                <option value="">{v4("gwkBlankLength")}</option>
                <option value="10">{v4("gwkLen10")}</option>
                <option value="20">{v4("gwkLen20")}</option>
                <option value="40">{v4("gwkLen40")}</option>
              </select>
            </label>
            <label className="c4-lab">{v4("gwkTag")}<input className="c4-field" maxLength={1} aria-label={v4("gwkTag")} value={tag} onChange={(event) => setTag(event.target.value)} /></label>
            <label className="c4-lab">{v4("gwkRoster")}<input className="c4-field" aria-label={v4("gwkRoster")} value={roster} onChange={(event) => setRoster(event.target.value)} /></label>
            <label className="c4-lab">{v4("gwkDeskStep")}<input className="c4-field" inputMode="numeric" aria-label={v4("gwkDeskStep")} value={deskStep} onChange={(event) => setDeskStep(event.target.value)} /></label>
            <button type="submit" className="c4-btn c4-btn-hot" disabled={viewer}>{v4("gwkAdd")}</button>
          </form>
          <div className="c4-gwk-views">
            <label className="c4-lab">{v4("gwkViews")}<input className="c4-field" aria-label={v4("gwkViews")} value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
              const next = addWalkView(views, { id: `v${Date.now().toString(36)}`, name: viewName, tray, query, guide: guideOn, wing: wingOn, pace: paceOn, step: stepOn, lamp: lampOn, length: lengthOn });
              storeViews(next);
              if (next.length !== views.length) setViewName("");
            }}>{v4("gwkSaveView")}</button>
            {views.map((view) => (
              <span key={view.id}>
                <button type="button" className="c4-chip" onClick={() => applyView(view)}>{view.name}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropWalkView(views, view.id))}>{v4("gwkDropView")}</button>
              </span>
            ))}
          </div>
          <label className="c4-lab">{v4("gwkSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("gwkSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <div className="c4-gwk-filters" role="group" aria-label={v4("gwkSearch")}>
            {(["open", "held", "closed"] as const).map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("gwkOpen") : item === "held" ? v4("gwkHeld") : v4("gwkClosed")}</button>
            ))}
            <button type="button" className="c4-chip" data-on={guideOn === "all" ? "1" : "0"} onClick={() => setGuideFilter("all")}>{v4("gwkAll")}</button>
            <button type="button" className="c4-chip" data-on={guideOn === "blank" ? "1" : "0"} onClick={() => setGuideFilter("blank")}>{v4("gwkBlankGuide")}</button>
            {guides.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={guideOn === name ? "1" : "0"} onClick={() => setGuideFilter(name)}>{name}</button>
            ))}
            {["blank", "early", "mid", "late", "peak", "quiet"].map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={stepOn === item ? "1" : "0"} onClick={() => setStepFilter(item)}>
                {item === "blank" ? v4("gwkBlankStep") : item === "early" ? v4("gwkEarly") : item === "mid" ? v4("gwkMid") : item === "late" ? v4("gwkLateStep") : item === "peak" ? v4("gwkPeak") : v4("gwkQuiet")}
              </button>
            ))}
            <button type="button" className="c4-chip" data-on={pauseOnly ? "1" : "0"} onClick={() => setPauseOnly((on) => !on)}>{v4("gwkPauseOnly")}</button>
            <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((on) => !on)}>{v4("gwkHouseOnly")}</button>
            <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((on) => !on)}>{v4("gwkQuietOnly")}</button>
            <button type="button" className="c4-chip" data-on={awakeOnly ? "1" : "0"} onClick={() => setAwakeOnly((on) => !on)}>{v4("gwkAwake")}</button>
            <button type="button" className="c4-chip" data-on={board === "program" ? "1" : "0"} onClick={() => setBoard("program")}>{v4("gwkProgram")}</button>
            <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard("timeline")}>{v4("gwkTimeline")}</button>
            <button type="button" className="c4-chip" data-on={order === "step" ? "1" : "0"} onClick={() => setOrder(sortMode("step"))}>{v4("gwkSortStep")}</button>
            <button type="button" className="c4-chip" data-on={order === "title" ? "1" : "0"} onClick={() => setOrder(sortMode("title"))}>{v4("gwkSortTitle")}</button>
            <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "roomy" : "tight")}>{density === "tight" ? v4("gwkRoomy") : v4("gwkTight")}</button>
          </div>
          <div className="c4-gwk-bulk">
            <button type="button" className="c4-btn" onClick={() => setPicked(rows.map((walk) => walk.id))}>{v4("gwkPickAll")}</button>
            <button type="button" className="c4-btn" onClick={() => setPicked([])}>{v4("gwkPickNone")}</button>
            <span>{v4("gwkPicked")} · {picked.length}</span>
            <select className="c4-field" aria-label={v4("gwkBulkWing")} value={moveWing} onChange={(event) => setMoveWing(event.target.value)}>
              {WINGS.map((item) => <option key={item} value={item}>{wingLabel(v4, item)}</option>)}
            </select>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkWalkWing(walks, picked, moveWing))}>{v4("gwkBulkWing")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkWalkPin(walks, picked, true))}>{v4("gwkBulkPin")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkWalkClose(walks, picked, true))}>{v4("gwkBulkClose")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkWalkTag(walks, picked, tag || "a"))}>{v4("gwkBulkTag")}</button>
            <button type="button" className="c4-btn" onClick={() => download("gallery-walks.csv", walksCsv(walks, deskStep))}>{v4("gwkCsv")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetWalks())}>{v4("gwkReset")}</button>
          </div>
          {!rows.length && <p className="c4-gwk-empty">{v4("gwkEmpty")}</p>}
          <ol className={board === "timeline" ? "c4-gwk-time" : "c4-gwk-book"}>
            {rows.map((walk, index) => (
              <li key={walk.id} data-focus={index === focusAt ? "1" : "0"} data-late={lateWalk(walk, deskStep) ? "1" : "0"} data-soon={soonWalk(walk) ? "1" : "0"} data-house={houseWing(walk.wing) ? "1" : "0"} data-peak={peakStep(walk.step) ? "1" : "0"} data-quiet={quietStep(walk.step) ? "1" : "0"} data-wing={walk.wing.toLowerCase() || "blank"}>
                <p className="c4-gwk-stamp">{walk.step ?? "—"}</p>
                <div>
                  <label className="c4-row">
                    <input type="checkbox" checked={picked.includes(walk.id)} aria-label={walk.title} onChange={(event) => setPicked((ids) => event.target.checked ? [...ids, walk.id] : ids.filter((id) => id !== walk.id))} />
                    <strong>{walk.title}</strong>
                  </label>
                  <p className="c4-meta">{walk.guide || v4("gwkBlankGuide")} · {wingLabel(v4, walk.wing)} · {paceLabel(v4, walk.pace)} · {lampLabel(v4, walk.lamp)} · {lengthLabel(v4, walk.length)}</p>
                  <p className="c4-meta">{walk.tags.length ? walk.tags.join(" ") : v4("gwkBlankTag")} · {gapLabel(v4, walk.step, deskStep)} · {auditLabel(v4, walk.audit)}</p>
                  {walk.note && <p>{walk.note}</p>}
                  {editing === walk.id && (
                    <div className="c4-gwk-edit">
                      <input className="c4-field" aria-label={v4("gwkLine")} value={draft} onChange={(event) => setDraft(event.target.value)} />
                      <input className="c4-field" aria-label={v4("gwkNote")} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} />
                      <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(editWalkNote(editWalk(walks, walk.id, draft), walk.id, noteDraft)); setEditing(""); }}>{v4("gwkEdit")}</button>
                    </div>
                  )}
                  <div className="c4-row">
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cyclePace(walks, walk.id))}>{v4("gwkPaceUp")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setWalkPin(walks, walk.id, !walk.pinned))}>{walk.pinned ? v4("gwkUnpin") : v4("gwkPin")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setWalkHold(walks, walk.id, !walk.held))}>{walk.held ? v4("gwkLift") : v4("gwkHold")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setWalkClose(walks, walk.id, !walk.closed))}>{walk.closed ? v4("gwkReopen") : v4("gwkClose")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setWalkRest(walks, walk.id, walk.rest ? 0 : 10))}>{walk.rest ? v4("gwkRestOff") : v4("gwkRestOn")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(walk.id); setDraft(walk.title); setNoteDraft(walk.note); }}>{v4("gwkEdit")}</button>
                    <button type="button" className="c4-btn" onClick={() => { const line = walkCopy(walk, deskStep); void navigator.clipboard?.writeText(line); setCopied(walk.id); }}>{copied === walk.id ? v4("gwkCopied") : v4("gwkCopy")}</button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <p className="c4-gwk-rules">{v4("gwkRules")}</p>
        </div>
      </div>
    </section>
  );
}

export function TimezoneOffsets({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [band, setBand] = useState("all");
  const [tone, setTone] = useState("all");
  const [shape, setShape] = useState<ZoneShape>("all");
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
    note: { timezone: user.timezone ?? null },
  })), [data.data?.users]);
  useEffect(() => {
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  useEffect(() => {
    const present = presentZones(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenZones(readJson(TZN_KEY, []), present);
    const nextReviewed = readReviewedZones(readJson(TZN_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(TZN_KEY, nextHidden);
    writeJson(TZN_REVIEW_KEY, nextReviewed);
  }, [rows]);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setQuery("");
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "n" || event.key === "N" || event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const present = presentZones(rows);
  const bands = visibleZoneBands(present, hidden, showHidden);
  const bandOn = activeZoneBand(band, present);
  const toneOn = activeZoneTone(tone);
  const shown = visibleZoneCustomers(rows, zoneBandArg(bandOn), zoneToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = zoneState(row.note);
      const token = state === "set" ? zoneBand(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return bands.includes(token);
    });
  const lead = leadingZone(rows);
  const toneLead = leadingZoneTone(rows);
  const shared = sharedZoneCount(rows);
  const catalog = catalogZoneCount(rows);
  const bars = zoneBands(rows).filter((line) => line.band);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(TZN_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedZones(next, ids);
    setReviewed(saved);
    writeJson(TZN_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-tzn" aria-label={v4("tznTitle")} data-zones="1" data-role={role} data-catalog={catalog ? "1" : "0"}>
      <div className="c4-tzn-sheet">
        <header className="c4-tzn-mast">
          <div>
            <p className="c4-tzn-kicker">{v4("tznSub")}</p>
            <h2 className="c4-title">{v4("tznTitle")}</h2>
          </div>
          <p className="c4-tzn-plate" data-logo="mono">{v4("tznLogo")}</p>
        </header>
        <p className="c4-tzn-rules">{v4("tznHint")}</p>
        <p className="c4-meta">{v4("tznKept")} {v4("tznEscape")}</p>
        {viewer && <p className="c4-tzn-notice" data-viewer="1">{v4("tznViewer")}</p>}
        {data.error && <p className="c4-tzn-empty" role="alert">{v4("tznFailed")}</p>}
        {data.loading && <p className="c4-meta">{v4("tznLoading")}</p>}
        {shared > 0 && <p className="c4-tzn-notice" role="status">{v4("tznNotice")} · {shared}</p>}
        <ol className="c4-tzn-ledger" aria-label={v4("tznKpi")}>
          <li><span>{v4("tznSet")}</span><strong>{rows.filter((row) => zoneState(row.note) === "set").length}</strong></li>
          <li><span>{v4("tznCatalog")}</span><strong>{catalog}</strong></li>
          <li><span>{v4("tznPairCount")}</span><strong>{pairZoneCount(rows)}</strong></li>
          <li><span>{v4("tznHomeCount")}</span><strong>{homeZoneCount(rows)}</strong></li>
          <li><span>{v4("tznShare")}</span><strong>{zoneShare(catalog, rows.length)}%</strong></li>
          <li><span>{v4("tznShared")}</span><strong>{shared}</strong></li>
        </ol>
        <div className="c4-tzn-rail" aria-label={v4("tznBands")}>
          {bars.map((bar) => (
            <div key={bar.band} className="c4-tzn-meter">
              <button type="button" className="c4-btn" onClick={() => setBand(bar.band)}>{bandLabel(v4, bar.band)} · {bar.count}</button>
              <div className="c4-tzn-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            </div>
          ))}
          {!bars.length && <p className="c4-tzn-empty">{v4("tznEmpty")}</p>}
        </div>
        <div className="c4-tzn-suggest">
          <p>{v4("tznLeading")} · {lead ? bandLabel(v4, lead) : v4("tznLeadingNone")}</p>
          <p>{v4("tznToneLead")} · {toneLead ? toneLabel(v4, toneLead) : v4("tznToneNone")}</p>
          <p>{shared ? `${v4("tznShared")} · ${shared}` : v4("tznSharedNone")}</p>
        </div>
        <label className="c4-lab">{v4("tznSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("tznSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <div className="c4-tzn-filters">
          <button type="button" className="c4-chip" data-on={bandOn === "all" ? "1" : "0"} onClick={() => setBand("all")}>{v4("tznAll")}</button>
          <button type="button" className="c4-chip" data-on={bandOn === "blank" ? "1" : "0"} onClick={() => setBand("blank")}>{v4("tznClear")}</button>
          {BANDS.map((item) => (
            <button key={item} type="button" className="c4-chip" data-on={bandOn === item ? "1" : "0"} onClick={() => setBand(item)}>{bandLabel(v4, item)}</button>
          ))}
          <button type="button" className="c4-chip" data-on={toneOn === "all" ? "1" : "0"} onClick={() => setTone("all")}>{v4("tznTone")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "home" ? "1" : "0"} onClick={() => setTone("home")}>{v4("tznHome")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "away" ? "1" : "0"} onClick={() => setTone("away")}>{v4("tznAway")}</button>
          {(["all", "catalog", "pair", "home"] as const).map((item) => (
            <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{item === "all" ? v4("tznAllShapes") : item === "catalog" ? v4("tznCatalog") : item === "pair" ? v4("tznPair") : v4("tznHome")}</button>
          ))}
          <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} onClick={() => setReview("all")}>{v4("tznAllReview")}</button>
          <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview("reviewed")}>{v4("tznReviewed")}</button>
          <button type="button" className="c4-chip" data-on={review === "open" ? "1" : "0"} onClick={() => setReview("open")}>{v4("tznOpenReview")}</button>
          <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("tznShown") : v4("tznHidden")}</button>
        </div>
        <div className="c4-tzn-bands">
          {present.map((item) => (
            <button key={item} type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleZone(hidden, item))}>
              {bandLabel(v4, item)} · {hidden.includes(item) ? v4("tznShow") : v4("tznHide")}
            </button>
          ))}
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkZoneReview(reviewed, shown.map((row) => row.id), true))}>{v4("tznBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkZoneReview(reviewed, ids, false))}>{v4("tznBulkClear")}</button>
          <button type="button" className="c4-btn" onClick={() => download("timezone-offsets.csv", zonesCsv(rows))}>{v4("tznCsv")}</button>
          <button type="button" className="c4-btn" onClick={() => download("timezone-offset-rows.csv", zoneRowsCsv(rows, reviewed))}>{v4("tznRowCsv")}</button>
          <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("tznCustomers")}</Link>
        </div>
        {!shown.length && <p className="c4-tzn-empty">{v4("tznEmpty")}</p>}
        <ul className="c4-tzn-index">
          {shown.map((row) => {
            const state = zoneState(row.note);
            const mark = zoneOf(row.note);
            return (
              <li key={row.id} data-state={state || "blank"} data-band={state === "set" ? zoneBand(row.note) : "blank"} data-tone={zoneTone(row.note) || "blank"} data-catalog={catalogZone(row.note) ? "1" : "0"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"}>
                <p className="c4-tzn-mark" data-logo="mono">{mark || "—"}</p>
                <div>
                  <strong>{row.label || row.id}</strong>
                  <span className="c4-meta">{bandLabel(v4, state === "set" ? zoneBand(row.note) : state === "clear" ? "blank" : "")} · {toneLabel(v4, zoneTone(row.note))}</span>
                  {catalogZone(row.note) && <span className="c4-meta">{v4("tznCatalogMark")}</span>}
                  <div className="c4-row">
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleZoneReview(reviewed, row.id))}>{v4("tznReview")}</button>
                    <button type="button" className="c4-btn" onClick={() => { const line = zoneCopy(row.note); void navigator.clipboard?.writeText(line); setCopied(row.id); }}>{copied === row.id ? v4("tznCopied") : v4("tznCopy")}</button>
                    <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{row.label || row.id}</Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="c4-tzn-rules">{v4("tznRules")}</p>
      </div>
    </section>
  );
}
