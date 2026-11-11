"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  AGS_KEY,
  AGS_REVIEW_KEY,
  VNB_DENSITY_KEY,
  VNB_KEY,
  VNB_VIEW_KEY,
  activeBay,
  activeCue,
  activeHour,
  activeLamp,
  activePorter,
  activeScriptBand,
  activeScriptTone,
  activeWait,
  addBench,
  addBenchView,
  adjacentBenchCount,
  bayArg,
  benchBays,
  benchCopy,
  benchCounts,
  benchPorters,
  benchShare,
  benchTimeline,
  benchesCsv,
  bulkBenchBay,
  bulkBenchClose,
  bulkBenchMark,
  bulkBenchPin,
  bulkScriptReview,
  busiestPorter,
  catalogScript,
  catalogScriptCount,
  clashHourCount,
  cueArg,
  cycleCue,
  densityOf,
  dropBenchView,
  editBench,
  editBenchNote,
  fairPorter,
  giltScriptCount,
  hourArg,
  hourGap,
  houseBay,
  lampArg,
  lampClashCount,
  lateBench,
  lateShare,
  leadingScript,
  leadingScriptTone,
  moveFocus,
  nextBench,
  peakHour,
  pinFocused,
  porterArg,
  presentScripts,
  quietHour,
  readBenchViews,
  readBenches,
  readHiddenScripts,
  readReviewedScripts,
  reminderBenches,
  resetBenches,
  scriptBand,
  scriptBandArg,
  scriptBands,
  scriptCopy,
  scriptOf,
  scriptRowsCsv,
  scriptShare,
  scriptState,
  scriptTone,
  scriptToneArg,
  scriptsCsv,
  setBenchClose,
  setBenchHold,
  setBenchPin,
  setBenchRest,
  sharedScriptCount,
  soonBench,
  sortBenches,
  sortMode,
  suggestBay,
  suggestPorter,
  suggestWait,
  toggleScript,
  toggleScriptReview,
  usedHours,
  visibleBenches,
  visibleScriptBands,
  visibleScriptCustomers,
  waitArg,
  wideScriptCount,
  windowBenches,
  type BenchDensity,
  type BenchSort,
  type BenchTray,
  type BenchView,
  type ScriptRow,
  type ScriptShape,
  type VestibuleBench,
} from "@/lib/crmv4/round204";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  lastUserAgent?: string | null;
};

type GlanceRow = ScriptRow & { id: string };

const BAYS = ["north", "south", "court"] as const;
const BANDS = ["palm", "kit", "web", "plain"] as const;

function bayLabel(v4: V4, bay: string): string {
  if (bay === "north" || bay === "NORTH") return v4("vnbNorth");
  if (bay === "south" || bay === "SOUTH") return v4("vnbSouth");
  if (bay === "court" || bay === "COURT") return v4("vnbCourt");
  return v4("vnbBlankBay");
}

function cueLabel(v4: V4, cue: string): string {
  if (cue === "seated") return v4("vnbSeated");
  if (cue === "called") return v4("vnbCalled");
  if (cue === "bowed") return v4("vnbBowed");
  return v4("vnbBlankCue");
}

function lampLabel(v4: V4, lamp: number | null): string {
  if (lamp === 1) return v4("vnbLamp1");
  if (lamp === 3) return v4("vnbLamp3");
  if (lamp === 9) return v4("vnbLamp9");
  return v4("vnbBlankLamp");
}

function waitLabel(v4: V4, wait: number | null): string {
  if (wait === 10) return v4("vnbWait10");
  if (wait === 20) return v4("vnbWait20");
  if (wait === 40) return v4("vnbWait40");
  return v4("vnbBlankWait");
}

function bandLabel(v4: V4, name: string): string {
  if (name === "palm") return v4("agsPalm");
  if (name === "kit") return v4("agsKit");
  if (name === "web") return v4("agsWeb");
  if (name === "plain") return v4("agsPlain");
  if (name === "blank") return v4("agsClear");
  return v4("agsUnmarked");
}

function toneLabel(v4: V4, name: string): string {
  if (name === "gilt") return v4("agsGilt");
  if (name === "ink") return v4("agsInk");
  if (name === "ivory") return v4("agsIvory");
  if (name === "plain") return v4("agsTonePlain");
  return v4("agsUnmarked");
}

function auditLabel(v4: V4, audit: string): string {
  const key = {
    save: "vnbAuditSave",
    edit: "vnbAuditEdit",
    cue: "vnbAuditCue",
    pin: "vnbAuditPin",
    unpin: "vnbAuditUnpin",
    hold: "vnbAuditHold",
    lift: "vnbAuditLift",
    close: "vnbAuditClose",
    open: "vnbAuditOpen",
    bay: "vnbAuditBay",
    mark: "vnbAuditMark",
    rest: "vnbAuditRest",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, hour: number | null, desk: string): string {
  const gap = hourGap(hour, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("vnbPast")} ${gap}`;
  if (gap < 0) return `${v4("vnbAhead")} ${Math.abs(gap)}`;
  return v4("vnbDue");
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

export function VestibuleBenches({ v4 }: { v4: V4 }) {
  const [benches, setBenches] = useState<VestibuleBench[]>([]);
  const [views, setViews] = useState<BenchView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [porter, setPorter] = useState("");
  const [hour, setHour] = useState("");
  const [bay, setBay] = useState("");
  const [cue, setCue] = useState("");
  const [lamp, setLamp] = useState("");
  const [waitValue, setWaitValue] = useState("");
  const [mark, setMark] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<BenchTray>("open");
  const [porterFilter, setPorterFilter] = useState("all");
  const [bayFilter, setBayFilter] = useState("all");
  const [cueFilter, setCueFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [lampFilter, setLampFilter] = useState("all");
  const [waitFilter, setWaitFilter] = useState("all");
  const [bowedOnly, setBowedOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [awakeOnly, setAwakeOnly] = useState(false);
  const [board, setBoard] = useState<"program" | "timeline">("program");
  const [order, setOrder] = useState<BenchSort>("hour");
  const [density, setDensity] = useState<BenchDensity>("roomy");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [deskHour, setDeskHour] = useState("");
  const [moveBay, setMoveBay] = useState("south");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readBenches(readJson(VNB_KEY, []));
    const saved = readBenchViews(readJson(VNB_VIEW_KEY, []));
    setBenches(next);
    setViews(saved);
    setDensity(densityOf(readJson(VNB_DENSITY_KEY, "roomy")));
    writeJson(VNB_KEY, next);
    writeJson(VNB_VIEW_KEY, saved);
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: VestibuleBench[]) {
    const saved = readBenches(next);
    setBenches(saved);
    writeJson(VNB_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((bench) => bench.id === id)));
  }
  function storeViews(next: BenchView[]) {
    const saved = readBenchViews(next);
    setViews(saved);
    writeJson(VNB_VIEW_KEY, saved);
  }
  function storeDensity(next: BenchDensity) {
    setDensity(next);
    writeJson(VNB_DENSITY_KEY, next);
  }
  const porters = benchPorters(benches);
  const bays = benchBays(benches);
  const bars = BAYS.map((item) => ({ bay: item.toUpperCase(), count: benches.filter((bench) => bench.bay === item.toUpperCase()).length })).filter((row) => row.count > 0);
  const porterOn = activePorter(porterFilter, porters);
  const bayOn = activeBay(bayFilter, bays);
  const cueOn = activeCue(cueFilter, ["seated", "called", "bowed"]);
  const hourOn = activeHour(hourFilter);
  const lampOn = activeLamp(lampFilter);
  const waitOn = activeWait(waitFilter);
  const pickedHour = hourArg(hourOn);
  const shown = sortBenches(visibleBenches(
    benches,
    tray,
    query,
    porterArg(porterOn),
    bayArg(bayOn),
    cueArg(cueOn),
    pickedHour.exact,
    pickedHour.pick,
    lampArg(lampOn),
    waitArg(waitOn),
    bowedOnly,
    peakOnly,
    houseOnly,
    quietOnly,
    awakeOnly,
  ), order);
  const timeline = benchTimeline(benches, query);
  const counts = benchCounts(benches, deskHour);
  const clashes = clashHourCount(benches);
  const lamps = lampClashCount(benches);
  const neighbors = adjacentBenchCount(benches);
  const nextId = nextBench(benches, deskHour);
  const nextRow = benches.find((bench) => bench.id === nextId);
  const suggestedBay = suggestBay(benches);
  const suggestedPorter = suggestPorter(benches);
  const suggestedWait = suggestWait(benches);
  const fair = fairPorter(benches, roster);
  const busy = busiestPorter(benches);
  const reminders = reminderBenches(benches, deskHour);
  const windowRows = windowBenches(benches, deskHour);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const focusAt = shown.length ? moveFocus(focus, shown.length, 0) : 0;
  pinRef.current = () => {
    if (viewer) return;
    const ids = (board === "timeline" ? timeline : shown).map((bench) => bench.id);
    store(pinFocused(benches, ids, focus));
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
      if (event.key === "b" || event.key === "B") {
        event.preventDefault();
        setBoard((current) => (current === "program" ? "timeline" : "program"));
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
    setPorter("");
    setHour("");
    setBay("");
    setCue("");
    setLamp("");
    setWaitValue("");
    setMark("");
    setQuery("");
    setEditing("");
  }
  function applyView(view: BenchView) {
    setTray(view.tray);
    setQuery(view.query);
    setPorterFilter(view.porter);
    setBayFilter(view.bay);
    setCueFilter(view.cue);
    setHourFilter(view.hour);
    setLampFilter(view.lamp);
    setWaitFilter(view.wait);
  }
  const rows = board === "timeline" ? timeline : shown;
  return (
    <section className="c4-vnb" aria-label={v4("vnbTitle")} data-benches="1" data-role={role} data-density={density}>
      <div className="c4-vnb-sheet">
        <header className="c4-vnb-mast">
          <p className="c4-vnb-spine">{v4("vnbSpine")}</p>
          <div>
            <p className="c4-vnb-kicker">{v4("vnbSub")}</p>
            <h2 className="c4-title">{v4("vnbTitle")}</h2>
          </div>
          <p className="c4-vnb-plate" data-logo="mono">{v4("vnbLogo")}</p>
        </header>
        <div className="c4-vnb-body">
          <p className="c4-vnb-rules">{v4("vnbHint")}</p>
          <p className="c4-meta">{v4("vnbLocal")}</p>
          <p className="c4-meta">{v4("vnbNew")} {v4("vnbSlash")} {v4("vnbEscape")} {v4("vnbKeys")} {v4("vnbPinKey")} {v4("vnbBoardKey")}</p>
          {viewer && <p className="c4-vnb-notice" data-viewer="1">{v4("vnbViewer")}</p>}
          {counts.peak > 0 && (
            <p className="c4-vnb-notice" role="status">
              {v4("vnbNotice")} · {counts.peak}
              <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("vnbNoticeAll") : v4("vnbNoticePeak")}</button>
            </p>
          )}
          <ol className="c4-vnb-ledger" aria-label={v4("vnbKpi")}>
            <li><span>{v4("vnbOpen")}</span><strong>{counts.open}</strong></li>
            <li><span>{v4("vnbHeld")}</span><strong>{counts.held}</strong></li>
            <li><span>{v4("vnbClosed")}</span><strong>{counts.closed}</strong></li>
            <li><span>{v4("vnbPinned")}</span><strong>{counts.pinned}</strong></li>
            <li><span>{v4("vnbPeak")}</span><strong>{counts.peak}</strong></li>
            <li><span>{v4("vnbLate")}</span><strong>{counts.late}</strong></li>
            <li><span>{v4("vnbSoon")}</span><strong>{counts.soon}</strong></li>
            <li><span>{v4("vnbRest")}</span><strong>{counts.rest}</strong></li>
            <li><span>{v4("vnbHouseShare")}</span><strong>{benchShare(counts.house, benches.length)}%</strong></li>
            <li><span>{v4("vnbLateShare")}</span><strong>{lateShare(benches, deskHour)}%</strong></li>
          </ol>
          <div className="c4-vnb-rail" aria-label={v4("vnbBays")}>
            {bars.map((bar) => (
              <div key={bar.bay} className="c4-vnb-meter" data-bay={bar.bay.toLowerCase()}>
                <button type="button" className="c4-btn" onClick={() => setBayFilter(bar.bay)}>{bayLabel(v4, bar.bay)} · {bar.count}</button>
                <div className="c4-vnb-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
              </div>
            ))}
            {!bars.length && <p className="c4-vnb-empty">{v4("vnbEmpty")}</p>}
          </div>
          <div className="c4-vnb-suggest">
            <p>{v4("vnbSuggestBay")} · {bayLabel(v4, suggestedBay)}</p>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setBay(suggestedBay.toLowerCase())}>{v4("vnbUseBay")}</button>
            <p>{v4("vnbSuggestPorter")} · {suggestedPorter || v4("vnbBlankPorter")}</p>
            <button type="button" className="c4-btn" disabled={viewer || !suggestedPorter} onClick={() => setPorter(suggestedPorter)}>{v4("vnbUsePorter")}</button>
            <p>{v4("vnbSuggestWait")} · {waitLabel(v4, suggestedWait)}</p>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setWaitValue(String(suggestedWait))}>{v4("vnbUseWait")}</button>
            <p>{v4("vnbAssign")} · {fair || v4("vnbBlankPorter")}</p>
            <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setPorter(fair)}>{v4("vnbAssign")}</button>
            <p>{v4("vnbHours")} · {usedHours(benches)}</p>
            <p>{clashes ? `${v4("vnbClash")} · ${clashes}` : v4("vnbClashNone")}</p>
            <p>{lamps ? `${v4("vnbLampClash")} · ${lamps}` : v4("vnbLampClashNone")}</p>
            <p>{neighbors ? `${v4("vnbAdjacent")} · ${neighbors}` : v4("vnbAdjacentNone")}</p>
            <p>{v4("vnbNext")} · {nextRow ? nextRow.title : v4("vnbNextNone")}</p>
            <p>{v4("vnbBusiest")} · {busy || v4("vnbBusiestNone")}</p>
            <p>{v4("vnbReminders")} · {reminders.length ? reminders.map((bench) => bench.title).join(", ") : v4("vnbReminderNone")}</p>
            <p>{v4("vnbWindow")} · {windowRows.length ? windowRows.map((bench) => bench.title).join(", ") : v4("vnbWindowNone")}</p>
          </div>
          <form className="c4-vnb-form" onSubmit={(event) => {
            event.preventDefault();
            if (viewer) return;
            const next = addBench(benches, {
              id: `b${Date.now().toString(36)}`,
              title,
              note,
              porter,
              hour,
              bay,
              cue,
              lamp,
              wait: waitValue,
              marks: mark,
              rest: "0",
            });
            const added = next[0];
            if (added && (added.title !== benches[0]?.title || next.length !== benches.length)) {
              store(next);
              clearDraft();
            }
          }}>
            <label className="c4-lab">{v4("vnbLine")}<input ref={titleRef} className="c4-field" aria-label={v4("vnbLine")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
            <label className="c4-lab">{v4("vnbNote")}<input className="c4-field" aria-label={v4("vnbNote")} value={note} onChange={(event) => setNote(event.target.value)} /></label>
            <label className="c4-lab">{v4("vnbPorter")}<input className="c4-field" aria-label={v4("vnbPorter")} value={porter} onChange={(event) => setPorter(event.target.value)} /></label>
            <label className="c4-lab">{v4("vnbHour")}<input className="c4-field" inputMode="numeric" aria-label={v4("vnbHour")} value={hour} onChange={(event) => setHour(event.target.value)} /></label>
            <label className="c4-lab">{v4("vnbBay")}
              <select className="c4-field" aria-label={v4("vnbBay")} value={bay} onChange={(event) => setBay(event.target.value)}>
                <option value="">{v4("vnbBlankBay")}</option>
                {BAYS.map((item) => <option key={item} value={item}>{bayLabel(v4, item)}</option>)}
              </select>
            </label>
            <label className="c4-lab">{v4("vnbCue")}
              <select className="c4-field" aria-label={v4("vnbCue")} value={cue} onChange={(event) => setCue(event.target.value)}>
                <option value="">{v4("vnbBlankCue")}</option>
                <option value="seated">{v4("vnbSeated")}</option>
                <option value="called">{v4("vnbCalled")}</option>
                <option value="bowed">{v4("vnbBowed")}</option>
              </select>
            </label>
            <label className="c4-lab">{v4("vnbLamp")}
              <select className="c4-field" aria-label={v4("vnbLamp")} value={lamp} onChange={(event) => setLamp(event.target.value)}>
                <option value="">{v4("vnbBlankLamp")}</option>
                <option value="1">{v4("vnbLamp1")}</option>
                <option value="3">{v4("vnbLamp3")}</option>
                <option value="9">{v4("vnbLamp9")}</option>
              </select>
            </label>
            <label className="c4-lab">{v4("vnbWait")}
              <select className="c4-field" aria-label={v4("vnbWait")} value={waitValue} onChange={(event) => setWaitValue(event.target.value)}>
                <option value="">{v4("vnbBlankWait")}</option>
                <option value="10">{v4("vnbWait10")}</option>
                <option value="20">{v4("vnbWait20")}</option>
                <option value="40">{v4("vnbWait40")}</option>
              </select>
            </label>
            <label className="c4-lab">{v4("vnbMark")}<input className="c4-field" maxLength={1} aria-label={v4("vnbMark")} value={mark} onChange={(event) => setMark(event.target.value)} /></label>
            <label className="c4-lab">{v4("vnbRoster")}<input className="c4-field" aria-label={v4("vnbRoster")} value={roster} onChange={(event) => setRoster(event.target.value)} /></label>
            <label className="c4-lab">{v4("vnbDeskHour")}<input className="c4-field" inputMode="numeric" aria-label={v4("vnbDeskHour")} value={deskHour} onChange={(event) => setDeskHour(event.target.value)} /></label>
            <button type="submit" className="c4-btn c4-btn-hot" disabled={viewer}>{v4("vnbAdd")}</button>
          </form>
          <div className="c4-vnb-views">
            <label className="c4-lab">{v4("vnbViews")}<input className="c4-field" aria-label={v4("vnbViews")} value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
              const next = addBenchView(views, { id: `v${Date.now().toString(36)}`, name: viewName, tray, query, porter: porterOn, bay: bayOn, cue: cueOn, hour: hourOn, lamp: lampOn, wait: waitOn });
              storeViews(next);
              if (next.length !== views.length) setViewName("");
            }}>{v4("vnbSaveView")}</button>
            {views.map((view) => (
              <span key={view.id}>
                <button type="button" className="c4-chip" onClick={() => applyView(view)}>{view.name}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropBenchView(views, view.id))}>{v4("vnbDropView")}</button>
              </span>
            ))}
          </div>
          <label className="c4-lab">{v4("vnbSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("vnbSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <div className="c4-vnb-filters" role="group" aria-label={v4("vnbSearch")}>
            {(["open", "held", "closed"] as const).map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("vnbOpen") : item === "held" ? v4("vnbHeld") : v4("vnbClosed")}</button>
            ))}
            <button type="button" className="c4-chip" data-on={porterOn === "all" ? "1" : "0"} onClick={() => setPorterFilter("all")}>{v4("vnbAll")}</button>
            <button type="button" className="c4-chip" data-on={porterOn === "blank" ? "1" : "0"} onClick={() => setPorterFilter("blank")}>{v4("vnbBlankPorter")}</button>
            {porters.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={porterOn === name ? "1" : "0"} onClick={() => setPorterFilter(name)}>{name}</button>
            ))}
            {["blank", "early", "mid", "late", "peak", "quiet"].map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={hourOn === item ? "1" : "0"} onClick={() => setHourFilter(item)}>
                {item === "blank" ? v4("vnbBlankHour") : item === "early" ? v4("vnbEarly") : item === "mid" ? v4("vnbMid") : item === "late" ? v4("vnbLateHour") : item === "peak" ? v4("vnbPeak") : v4("vnbQuiet")}
              </button>
            ))}
            <button type="button" className="c4-chip" data-on={bowedOnly ? "1" : "0"} onClick={() => setBowedOnly((on) => !on)}>{v4("vnbBowedOnly")}</button>
            <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((on) => !on)}>{v4("vnbHouseOnly")}</button>
            <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((on) => !on)}>{v4("vnbQuietOnly")}</button>
            <button type="button" className="c4-chip" data-on={awakeOnly ? "1" : "0"} onClick={() => setAwakeOnly((on) => !on)}>{v4("vnbAwake")}</button>
            <button type="button" className="c4-chip" data-on={board === "program" ? "1" : "0"} onClick={() => setBoard("program")}>{v4("vnbProgram")}</button>
            <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard("timeline")}>{v4("vnbTimeline")}</button>
            <button type="button" className="c4-chip" data-on={order === "hour" ? "1" : "0"} onClick={() => setOrder(sortMode("hour"))}>{v4("vnbSortHour")}</button>
            <button type="button" className="c4-chip" data-on={order === "title" ? "1" : "0"} onClick={() => setOrder(sortMode("title"))}>{v4("vnbSortTitle")}</button>
            <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "roomy" : "tight")}>{density === "tight" ? v4("vnbRoomy") : v4("vnbTight")}</button>
          </div>
          <div className="c4-vnb-bulk">
            <button type="button" className="c4-btn" onClick={() => setPicked(rows.map((bench) => bench.id))}>{v4("vnbPickAll")}</button>
            <button type="button" className="c4-btn" onClick={() => setPicked([])}>{v4("vnbPickNone")}</button>
            <span>{v4("vnbPicked")} · {picked.length}</span>
            <select className="c4-field" aria-label={v4("vnbBulkBay")} value={moveBay} onChange={(event) => setMoveBay(event.target.value)}>
              {BAYS.map((item) => <option key={item} value={item}>{bayLabel(v4, item)}</option>)}
            </select>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBenchBay(benches, picked, moveBay))}>{v4("vnbBulkBay")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBenchPin(benches, picked, true))}>{v4("vnbBulkPin")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBenchClose(benches, picked, true))}>{v4("vnbBulkClose")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBenchMark(benches, picked, mark || "1"))}>{v4("vnbBulkMark")}</button>
            <button type="button" className="c4-btn" onClick={() => download("vestibule-benches.csv", benchesCsv(benches, deskHour))}>{v4("vnbCsv")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetBenches())}>{v4("vnbReset")}</button>
          </div>
          {!rows.length && <p className="c4-vnb-empty">{v4("vnbEmpty")}</p>}
          <ol className={board === "timeline" ? "c4-vnb-time" : "c4-vnb-book"}>
            {rows.map((bench, index) => (
              <li key={bench.id} data-focus={index === focusAt ? "1" : "0"} data-late={lateBench(bench, deskHour) ? "1" : "0"} data-soon={soonBench(bench) ? "1" : "0"} data-house={houseBay(bench.bay) ? "1" : "0"} data-peak={peakHour(bench.hour) ? "1" : "0"} data-quiet={quietHour(bench.hour) ? "1" : "0"} data-bay={bench.bay.toLowerCase() || "blank"}>
                <p className="c4-vnb-stamp">{bench.hour ?? "—"}</p>
                <div>
                  <label className="c4-row">
                    <input type="checkbox" checked={picked.includes(bench.id)} aria-label={bench.title} onChange={(event) => setPicked((ids) => event.target.checked ? [...ids, bench.id] : ids.filter((id) => id !== bench.id))} />
                    <strong>{bench.title}</strong>
                  </label>
                  <p className="c4-meta">{bench.porter || v4("vnbBlankPorter")} · {bayLabel(v4, bench.bay)} · {cueLabel(v4, bench.cue)} · {lampLabel(v4, bench.lamp)} · {waitLabel(v4, bench.wait)}</p>
                  <p className="c4-meta">{bench.marks.length ? bench.marks.join(" ") : v4("vnbBlankMark")} · {gapLabel(v4, bench.hour, deskHour)} · {auditLabel(v4, bench.audit)}</p>
                  {bench.note && <p>{bench.note}</p>}
                  {editing === bench.id && (
                    <div className="c4-vnb-edit">
                      <input className="c4-field" aria-label={v4("vnbLine")} value={draft} onChange={(event) => setDraft(event.target.value)} />
                      <input className="c4-field" aria-label={v4("vnbNote")} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} />
                      <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(editBenchNote(editBench(benches, bench.id, draft), bench.id, noteDraft)); setEditing(""); }}>{v4("vnbEdit")}</button>
                    </div>
                  )}
                  <div className="c4-row">
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleCue(benches, bench.id))}>{v4("vnbCueUp")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBenchPin(benches, bench.id, !bench.pinned))}>{bench.pinned ? v4("vnbUnpin") : v4("vnbPin")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBenchHold(benches, bench.id, !bench.held))}>{bench.held ? v4("vnbLift") : v4("vnbHold")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBenchClose(benches, bench.id, !bench.closed))}>{bench.closed ? v4("vnbReopen") : v4("vnbClose")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBenchRest(benches, bench.id, bench.rest ? 0 : 10))}>{bench.rest ? v4("vnbRestOff") : v4("vnbRestOn")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(bench.id); setDraft(bench.title); setNoteDraft(bench.note); }}>{v4("vnbEdit")}</button>
                    <button type="button" className="c4-btn" onClick={() => { const line = benchCopy(bench, deskHour); void navigator.clipboard?.writeText(line); setCopied(bench.id); }}>{copied === bench.id ? v4("vnbCopied") : v4("vnbCopy")}</button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <p className="c4-vnb-rules">{v4("vnbRules")}</p>
        </div>
      </div>
    </section>
  );
}

export function AgentScripts({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [band, setBand] = useState("all");
  const [tone, setTone] = useState("all");
  const [shape, setShape] = useState<ScriptShape>("all");
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
    note: { lastUserAgent: user.lastUserAgent ?? null },
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
    const present = presentScripts(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenScripts(readJson(AGS_KEY, []), present);
    const nextReviewed = readReviewedScripts(readJson(AGS_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(AGS_KEY, nextHidden);
    writeJson(AGS_REVIEW_KEY, nextReviewed);
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
  const present = presentScripts(rows);
  const bands = visibleScriptBands(present, hidden, showHidden);
  const bandOn = activeScriptBand(band, present);
  const toneOn = activeScriptTone(tone);
  const shown = visibleScriptCustomers(rows, scriptBandArg(bandOn), scriptToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = scriptState(row.note);
      const token = state === "set" ? scriptBand(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return bands.includes(token);
    });
  const lead = leadingScript(rows);
  const toneLead = leadingScriptTone(rows);
  const shared = sharedScriptCount(rows);
  const catalog = catalogScriptCount(rows);
  const bars = scriptBands(rows).filter((line) => line.band);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(AGS_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedScripts(next, ids);
    setReviewed(saved);
    writeJson(AGS_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-ags" aria-label={v4("agsTitle")} data-scripts="1" data-role={role} data-catalog={catalog ? "1" : "0"}>
      <div className="c4-ags-sheet">
        <header className="c4-ags-mast">
          <div>
            <p className="c4-ags-kicker">{v4("agsSub")}</p>
            <h2 className="c4-title">{v4("agsTitle")}</h2>
          </div>
          <p className="c4-ags-plate" data-logo="mono">{v4("agsLogo")}</p>
        </header>
        <p className="c4-ags-rules">{v4("agsHint")}</p>
        <p className="c4-meta">{v4("agsKept")} {v4("agsEscape")}</p>
        {viewer && <p className="c4-ags-notice" data-viewer="1">{v4("agsViewer")}</p>}
        {data.error && <p className="c4-ags-empty" role="alert">{v4("agsFailed")}</p>}
        {data.loading && <p className="c4-meta">{v4("agsLoading")}</p>}
        {shared > 0 && <p className="c4-ags-notice" role="status">{v4("agsNotice")} · {shared}</p>}
        <ol className="c4-ags-ledger" aria-label={v4("agsKpi")}>
          <li><span>{v4("agsSet")}</span><strong>{rows.filter((row) => scriptState(row.note) === "set").length}</strong></li>
          <li><span>{v4("agsCatalog")}</span><strong>{catalog}</strong></li>
          <li><span>{v4("agsWideCount")}</span><strong>{wideScriptCount(rows)}</strong></li>
          <li><span>{v4("agsGiltCount")}</span><strong>{giltScriptCount(rows)}</strong></li>
          <li><span>{v4("agsShare")}</span><strong>{scriptShare(catalog, rows.length)}%</strong></li>
          <li><span>{v4("agsShared")}</span><strong>{shared}</strong></li>
        </ol>
        <div className="c4-ags-rail" aria-label={v4("agsBands")}>
          {bars.map((bar) => (
            <div key={bar.band} className="c4-ags-meter">
              <button type="button" className="c4-btn" onClick={() => setBand(bar.band)}>{bandLabel(v4, bar.band)} · {bar.count}</button>
              <div className="c4-ags-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            </div>
          ))}
          {!bars.length && <p className="c4-ags-empty">{v4("agsEmpty")}</p>}
        </div>
        <div className="c4-ags-suggest">
          <p>{v4("agsLeading")} · {lead ? bandLabel(v4, lead) : v4("agsLeadingNone")}</p>
          <p>{v4("agsToneLead")} · {toneLead ? toneLabel(v4, toneLead) : v4("agsToneNone")}</p>
          <p>{shared ? `${v4("agsShared")} · ${shared}` : v4("agsSharedNone")}</p>
        </div>
        <label className="c4-lab">{v4("agsSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("agsSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <div className="c4-ags-filters">
          <button type="button" className="c4-chip" data-on={bandOn === "all" ? "1" : "0"} onClick={() => setBand("all")}>{v4("agsAll")}</button>
          <button type="button" className="c4-chip" data-on={bandOn === "blank" ? "1" : "0"} onClick={() => setBand("blank")}>{v4("agsClear")}</button>
          {BANDS.map((item) => (
            <button key={item} type="button" className="c4-chip" data-on={bandOn === item ? "1" : "0"} onClick={() => setBand(item)}>{bandLabel(v4, item)}</button>
          ))}
          <button type="button" className="c4-chip" data-on={toneOn === "all" ? "1" : "0"} onClick={() => setTone("all")}>{v4("agsTone")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "gilt" ? "1" : "0"} onClick={() => setTone("gilt")}>{v4("agsGilt")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "ink" ? "1" : "0"} onClick={() => setTone("ink")}>{v4("agsInk")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "ivory" ? "1" : "0"} onClick={() => setTone("ivory")}>{v4("agsIvory")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "plain" ? "1" : "0"} onClick={() => setTone("plain")}>{v4("agsTonePlain")}</button>
          {(["all", "catalog", "wide", "gilt"] as const).map((item) => (
            <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{item === "all" ? v4("agsAllShapes") : item === "catalog" ? v4("agsCatalog") : item === "wide" ? v4("agsWide") : v4("agsGilt")}</button>
          ))}
          <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} onClick={() => setReview("all")}>{v4("agsAllReview")}</button>
          <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview("reviewed")}>{v4("agsReviewed")}</button>
          <button type="button" className="c4-chip" data-on={review === "open" ? "1" : "0"} onClick={() => setReview("open")}>{v4("agsOpenReview")}</button>
          <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("agsShown") : v4("agsHidden")}</button>
        </div>
        <div className="c4-ags-bands">
          {present.map((item) => (
            <button key={item} type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleScript(hidden, item))}>
              {bandLabel(v4, item)} · {hidden.includes(item) ? v4("agsShow") : v4("agsHide")}
            </button>
          ))}
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkScriptReview(reviewed, shown.map((row) => row.id), true))}>{v4("agsBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkScriptReview(reviewed, ids, false))}>{v4("agsBulkClear")}</button>
          <button type="button" className="c4-btn" onClick={() => download("agent-scripts.csv", scriptsCsv(rows))}>{v4("agsCsv")}</button>
          <button type="button" className="c4-btn" onClick={() => download("agent-script-rows.csv", scriptRowsCsv(rows, reviewed))}>{v4("agsRowCsv")}</button>
          <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("agsCustomers")}</Link>
        </div>
        {!shown.length && <p className="c4-ags-empty">{v4("agsEmpty")}</p>}
        <ul className="c4-ags-index">
          {shown.map((row) => {
            const state = scriptState(row.note);
            const mark = scriptOf(row.note);
            return (
              <li key={row.id} data-state={state || "blank"} data-band={state === "set" ? scriptBand(row.note) : "blank"} data-tone={scriptTone(row.note) || "blank"} data-catalog={catalogScript(row.note) ? "1" : "0"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"}>
                <p className="c4-ags-mark" data-logo="mono">{mark || "—"}</p>
                <div>
                  <strong>{row.label || row.id}</strong>
                  <span className="c4-meta">{bandLabel(v4, state === "set" ? scriptBand(row.note) : state === "clear" ? "blank" : "")} · {toneLabel(v4, scriptTone(row.note))}</span>
                  {catalogScript(row.note) && <span className="c4-meta">{v4("agsCatalogMark")}</span>}
                  <div className="c4-row">
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleScriptReview(reviewed, row.id))}>{v4("agsReview")}</button>
                    <button type="button" className="c4-btn" onClick={() => { const line = scriptCopy(row.note); void navigator.clipboard?.writeText(line); setCopied(row.id); }}>{copied === row.id ? v4("agsCopied") : v4("agsCopy")}</button>
                    <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{row.label || row.id}</Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="c4-ags-rules">{v4("agsRules")}</p>
      </div>
    </section>
  );
}
