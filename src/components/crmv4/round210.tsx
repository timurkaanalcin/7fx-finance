"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  APS_DENSITY_KEY,
  APS_KEY,
  APS_VIEW_KEY,
  BRC_KEY,
  BRC_REVIEW_KEY,
  activeCloth,
  activeCrestBand,
  activeCrestTone,
  activeHush,
  activeKeeper,
  activeLamp,
  activePew,
  activeWait,
  addAlcove,
  addAlcoveTag,
  addAlcoveView,
  adjacentAlcoveCount,
  alcoveCloths,
  alcoveCopy,
  alcoveCounts,
  alcoveKeepers,
  alcoveShare,
  alcoveTimeline,
  alcovesCsv,
  bulkAlcoveClose,
  bulkAlcoveCloth,
  bulkAlcoveHush,
  bulkAlcovePin,
  bulkAlcoveTag,
  bulkCrestReview,
  busiestKeeper,
  callLoad,
  catalogCrest,
  catalogCrestCount,
  clashPewCount,
  clothArg,
  crestBand,
  crestBandArg,
  crestBands,
  crestCopy,
  crestOf,
  crestRowsCsv,
  crestShare,
  crestState,
  crestTone,
  crestToneArg,
  crestsCsv,
  cycleHush,
  densityOf,
  dropAlcoveView,
  editAlcove,
  editAlcoveNote,
  fairKeeper,
  giltCrestCount,
  giltFocused,
  giltLoad,
  houseCloth,
  hushArg,
  keeperArg,
  lampArg,
  lampClashCount,
  lateAlcove,
  lateShare,
  leadingCrest,
  leadingCrestTone,
  moveFocus,
  nextAlcove,
  pairKeeperCount,
  peakPew,
  pewArg,
  pewGap,
  pewSpan,
  pinFocused,
  presentCrests,
  quietHouseCount,
  quietPew,
  readAlcoveViews,
  readAlcoves,
  readHiddenCrests,
  readReviewedCrests,
  reminderAlcoves,
  resetAlcoves,
  setAlcoveClose,
  setAlcoveGilt,
  setAlcoveHold,
  setAlcovePin,
  sharedCrestCount,
  soonAlcove,
  sortAlcoves,
  sortMode,
  suggestCloth,
  suggestKeeper,
  suggestLamp,
  toggleCrest,
  toggleCrestReview,
  usedPews,
  visibleAlcoves,
  visibleCrestBands,
  visibleCrestCustomers,
  waitArg,
  wideCrestCount,
  windowAlcoves,
  type AlcoveDensity,
  type AlcoveSort,
  type AlcoveTray,
  type AlcoveView,
  type ApseAlcove,
  type CrestRow,
  type CrestShape,
} from "@/lib/crmv4/round210";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  lastBrowser?: string | null;
};

type GlanceRow = CrestRow & { id: string };

const CLOTHS = ["linen", "slate", "champagne"] as const;
const HUSHES = ["hush", "talk", "call"] as const;
const BANDS = ["bright", "ivory", "ember", "slate", "plain"] as const;

function clothLabel(v4: V4, cloth: string): string {
  if (cloth === "linen" || cloth === "LINEN") return v4("apsLinen");
  if (cloth === "slate" || cloth === "SLATE") return v4("apsSlate");
  if (cloth === "champagne" || cloth === "CHAMPAGNE") return v4("apsChampagne");
  return v4("apsBlankCloth");
}

function hushLabel(v4: V4, hush: string): string {
  if (hush === "hush") return v4("apsHushWord");
  if (hush === "talk") return v4("apsTalk");
  if (hush === "call") return v4("apsCall");
  return v4("apsBlankHush");
}

function lampLabel(v4: V4, lamp: number | null): string {
  if (lamp === 2) return v4("apsLamp2");
  if (lamp === 4) return v4("apsLamp4");
  if (lamp === 8) return v4("apsLamp8");
  return v4("apsBlankLamp");
}

function waitLabel(v4: V4, wait: number | null): string {
  if (wait === 15) return v4("apsWait15");
  if (wait === 30) return v4("apsWait30");
  if (wait === 60) return v4("apsWait60");
  return v4("apsBlankWait");
}

function bandLabel(v4: V4, name: string): string {
  if (name === "bright") return v4("brcBright");
  if (name === "ivory") return v4("brcIvory");
  if (name === "ember") return v4("brcEmber");
  if (name === "slate") return v4("brcSlate");
  if (name === "plain") return v4("brcPlain");
  if (name === "blank") return v4("brcClear");
  return v4("brcUnmarked");
}

function crestToneLabel(v4: V4, name: string): string {
  if (name === "gilt") return v4("brcGilt");
  if (name === "ink") return v4("brcInk");
  if (name === "ivory") return v4("brcIvoryTone");
  if (name === "mist") return v4("brcMist");
  if (name === "plain") return v4("brcTonePlain");
  return v4("brcUnmarked");
}

function auditLabel(v4: V4, audit: string): string {
  const key = {
    save: "apsAuditSave",
    edit: "apsAuditEdit",
    hush: "apsAuditHush",
    pin: "apsAuditPin",
    unpin: "apsAuditUnpin",
    hold: "apsAuditHold",
    lift: "apsAuditLift",
    close: "apsAuditClose",
    open: "apsAuditOpen",
    cloth: "apsAuditCloth",
    tag: "apsAuditTag",
    gilt: "apsAuditGilt",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, pew: number | null, desk: string): string {
  const gap = pewGap(pew, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("apsPast")} ${gap}`;
  if (gap < 0) return `${v4("apsAhead")} ${Math.abs(gap)}`;
  return v4("apsDue");
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

export function ApseAlcoves({ v4 }: { v4: V4 }) {
  const [alcoves, setAlcoves] = useState<ApseAlcove[]>([]);
  const [views, setViews] = useState<AlcoveView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [keeper, setKeeper] = useState("");
  const [pew, setPew] = useState("");
  const [cloth, setCloth] = useState("");
  const [hush, setHush] = useState("");
  const [lamp, setLamp] = useState("");
  const [waitValue, setWaitValue] = useState("");
  const [tag, setTag] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<AlcoveTray>("open");
  const [keeperFilter, setKeeperFilter] = useState("all");
  const [clothFilter, setClothFilter] = useState("all");
  const [hushFilter, setHushFilter] = useState("all");
  const [pewFilter, setPewFilter] = useState("all");
  const [lampFilter, setLampFilter] = useState("all");
  const [waitFilter, setWaitFilter] = useState("all");
  const [callOnly, setCallOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [awakeOnly, setAwakeOnly] = useState(false);
  const [board, setBoard] = useState<"arcade" | "timeline">("arcade");
  const [order, setOrder] = useState<AlcoveSort>("pew");
  const [density, setDensity] = useState<AlcoveDensity>("roomy");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [deskPew, setDeskPew] = useState("");
  const [moveCloth, setMoveCloth] = useState("slate");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<() => void>(() => {});
  const giltRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readAlcoves(readJson(APS_KEY, []));
    const saved = readAlcoveViews(readJson(APS_VIEW_KEY, []));
    setAlcoves(next);
    setViews(saved);
    setDensity(densityOf(readJson(APS_DENSITY_KEY, "roomy")));
    writeJson(APS_KEY, next);
    writeJson(APS_VIEW_KEY, saved);
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: ApseAlcove[]) {
    const saved = readAlcoves(next);
    setAlcoves(saved);
    writeJson(APS_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((alcove) => alcove.id === id)));
  }
  function storeViews(next: AlcoveView[]) {
    const saved = readAlcoveViews(next);
    setViews(saved);
    writeJson(APS_VIEW_KEY, saved);
  }
  function storeDensity(next: AlcoveDensity) {
    setDensity(next);
    writeJson(APS_DENSITY_KEY, next);
  }
  const keepers = alcoveKeepers(alcoves);
  const cloths = alcoveCloths(alcoves);
  const bars = CLOTHS.map((item) => ({ cloth: item.toUpperCase(), count: alcoves.filter((alcove) => alcove.cloth === item.toUpperCase()).length })).filter((row) => row.count > 0);
  const keeperOn = activeKeeper(keeperFilter, keepers);
  const clothOn = activeCloth(clothFilter, cloths);
  const hushOn = activeHush(hushFilter, ["hush", "talk", "call"]);
  const pewOn = activePew(pewFilter);
  const lampOn = activeLamp(lampFilter);
  const waitOn = activeWait(waitFilter);
  const pickedPew = pewArg(pewOn);
  const shown = sortAlcoves(visibleAlcoves(
    alcoves,
    tray,
    query,
    keeperArg(keeperOn),
    clothArg(clothOn),
    hushArg(hushOn),
    pickedPew.exact,
    pickedPew.pick,
    lampArg(lampOn),
    waitArg(waitOn),
    callOnly,
    peakOnly,
    houseOnly,
    quietOnly,
    awakeOnly,
  ), order);
  const timeline = alcoveTimeline(alcoves, query);
  const counts = alcoveCounts(alcoves, deskPew);
  const clashes = clashPewCount(alcoves);
  const lamps = lampClashCount(alcoves);
  const neighbors = adjacentAlcoveCount(alcoves);
  const nextId = nextAlcove(alcoves, deskPew);
  const nextRow = alcoves.find((alcove) => alcove.id === nextId);
  const suggestedCloth = suggestCloth(alcoves);
  const suggestedKeeper = suggestKeeper(alcoves);
  const suggestedLamp = suggestLamp(alcoves);
  const fair = fairKeeper(alcoves, roster);
  const busy = busiestKeeper(alcoves);
  const reminders = reminderAlcoves(alcoves, deskPew);
  const windowRows = windowAlcoves(alcoves, deskPew);
  const share = lateShare(alcoves, deskPew);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  pinRef.current = () => {
    if (viewer) return;
    const ids = (board === "timeline" ? timeline : shown).map((alcove) => alcove.id);
    store(pinFocused(alcoves, ids, focus));
  };
  giltRef.current = () => {
    if (viewer) return;
    const ids = (board === "timeline" ? timeline : shown).map((alcove) => alcove.id);
    store(giltFocused(alcoves, ids, focus));
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
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        giltRef.current();
        return;
      }
      if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        setBoard((current) => (current === "arcade" ? "timeline" : "arcade"));
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
    setKeeper("");
    setPew("");
    setCloth("");
    setHush("");
    setLamp("");
    setWaitValue("");
    setTag("");
    setQuery("");
    setEditing("");
  }
  function applyView(view: AlcoveView) {
    setTray(view.tray);
    setQuery(view.query);
    setKeeperFilter(view.keeper);
    setClothFilter(view.cloth);
    setHushFilter(view.hush);
    setPewFilter(view.pew);
    setLampFilter(view.lamp);
    setWaitFilter(view.wait);
  }
  const rows = board === "timeline" ? timeline : shown;
  return (
    <section className="c4-aps" aria-label={v4("apsTitle")} data-alcoves="1" data-role={role} data-density={density}>
      <div className="c4-aps-sheet">
        <header className="c4-aps-mast">
          <p className="c4-aps-spine">{v4("apsSpine")}</p>
          <div>
            <p className="c4-aps-kicker">{v4("apsSub")}</p>
            <h2 className="c4-title">{v4("apsTitle")}</h2>
          </div>
          <p className="c4-aps-plate" data-logo="mono">{v4("apsLogo")}</p>
        </header>
        <div className="c4-aps-body">
          <p className="c4-aps-rules">{v4("apsHint")}</p>
          <p className="c4-meta">{v4("apsLocal")}</p>
          <p className="c4-meta">{v4("apsNew")} {v4("apsSlash")} {v4("apsEscape")} {v4("apsKeys")} {v4("apsPinKey")} {v4("apsGiltKey")} {v4("apsBoardKey")}</p>
          {viewer && <p className="c4-aps-notice" data-viewer="1">{v4("apsViewer")}</p>}
          {counts.peak > 0 && (
            <p className="c4-aps-notice" role="status">
              {v4("apsNotice")} · {counts.peak}
              <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("apsNoticeAll") : v4("apsNoticePeak")}</button>
            </p>
          )}
          {counts.late > 0 && (
            <p className="c4-aps-notice" role="status" data-late="1">{v4("apsLateNotice")} · {counts.late}</p>
          )}
          <ol className="c4-aps-ledger" aria-label={v4("apsKpi")}>
            <li><span>{v4("apsOpen")}</span><strong>{counts.open}</strong></li>
            <li><span>{v4("apsHeld")}</span><strong>{counts.held}</strong></li>
            <li><span>{v4("apsClosed")}</span><strong>{counts.closed}</strong></li>
            <li><span>{v4("apsPinned")}</span><strong>{counts.pinned}</strong></li>
            <li><span>{v4("apsPeak")}</span><strong>{counts.peak}</strong></li>
            <li><span>{v4("apsLate")}</span><strong>{counts.late}</strong></li>
            <li><span>{v4("apsSoon")}</span><strong>{counts.soon}</strong></li>
            <li><span>{v4("apsGilt")}</span><strong>{counts.gilt}</strong></li>
            <li><span>{v4("apsHouseShare")}</span><strong>{alcoveShare(counts.house, alcoves.length)}%</strong></li>
            <li><span>{v4("apsLateShare")}</span><strong>{share}%</strong></li>
          </ol>
          <div className="c4-aps-sla" aria-label={v4("apsLateShare")}>
            <span>{v4("apsLateShare")}</span>
            <div className="c4-aps-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></div>
          </div>
          <div className="c4-aps-rail" aria-label={v4("apsCloths")}>
            {bars.map((bar) => (
              <div key={bar.cloth} className="c4-aps-meter" data-cloth={bar.cloth.toLowerCase()}>
                <button type="button" className="c4-btn" onClick={() => setClothFilter(bar.cloth)}>{clothLabel(v4, bar.cloth)} · {bar.count}</button>
                <div className="c4-aps-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
              </div>
            ))}
            {!bars.length && <p className="c4-aps-empty">{v4("apsEmpty")}</p>}
          </div>
          <div className="c4-aps-suggest">
            <p>{v4("apsSuggestCloth")} · {clothLabel(v4, suggestedCloth)}</p>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setCloth(suggestedCloth.toLowerCase())}>{v4("apsUseCloth")}</button>
            <p>{v4("apsSuggestKeeper")} · {suggestedKeeper || v4("apsBlankKeeper")}</p>
            <button type="button" className="c4-btn" disabled={viewer || !suggestedKeeper} onClick={() => setKeeper(suggestedKeeper)}>{v4("apsUseKeeper")}</button>
            <p>{v4("apsSuggestLamp")} · {lampLabel(v4, suggestedLamp)}</p>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setLamp(String(suggestedLamp))}>{v4("apsUseLamp")}</button>
            <p>{v4("apsAssign")} · {fair || v4("apsBlankKeeper")}</p>
            <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setKeeper(fair)}>{v4("apsAssign")}</button>
          </div>
          <p className="c4-meta">{v4("apsPews")} · {usedPews(alcoves)}</p>
          <p className="c4-meta">{clashes ? `${v4("apsClash")} · ${clashes}` : v4("apsClashNone")}</p>
          <p className="c4-meta">{lamps ? `${v4("apsLampClash")} · ${lamps}` : v4("apsLampClashNone")}</p>
          <p className="c4-meta">{neighbors ? `${v4("apsAdjacent")} · ${neighbors}` : v4("apsAdjacentNone")}</p>
          <p className="c4-meta">{pairKeeperCount(alcoves) ? `${v4("apsPairs")} · ${pairKeeperCount(alcoves)}` : v4("apsPairsNone")}</p>
          <p className="c4-meta">{`${v4("apsGiltLoad")} · ${giltLoad(alcoves)}`}</p>
          <p className="c4-meta">{`${v4("apsQuietHouse")} · ${quietHouseCount(alcoves)}`}</p>
          <p className="c4-meta">{`${v4("apsCallLoad")} · ${callLoad(alcoves)}`}</p>
          <p className="c4-meta">{`${v4("apsPewSpan")} · ${pewSpan(alcoves)}`}</p>
          <p className="c4-meta">{nextRow ? `${v4("apsNext")} · ${nextRow.title}` : v4("apsNextNone")}</p>
          <p className="c4-meta">{busy ? `${v4("apsBusiest")} · ${busy}` : v4("apsBusiestNone")}</p>
          <div className="c4-aps-reminders" aria-label={v4("apsReminders")}>
            {reminders.length ? reminders.map((alcove) => <span key={alcove.id}>{alcove.title}</span>) : <span>{v4("apsReminderNone")}</span>}
          </div>
          <div className="c4-aps-window" aria-label={v4("apsWindow")}>
            {windowRows.length ? windowRows.map((alcove) => <span key={alcove.id}>{alcove.title}</span>) : <span>{v4("apsWindowNone")}</span>}
          </div>
          <label className="c4-lab">{v4("apsSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("apsSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <div className="c4-aps-filters" role="group" aria-label={v4("apsSearch")}>
            {(["open", "held", "closed"] as const).map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("apsOpenTray") : item === "held" ? v4("apsHeldTray") : v4("apsClosedTray")}</button>
            ))}
            <button type="button" className="c4-chip" data-on={keeperOn === "all" ? "1" : "0"} onClick={() => setKeeperFilter("all")}>{v4("apsAll")}</button>
            <button type="button" className="c4-chip" data-on={keeperOn === "blank" ? "1" : "0"} onClick={() => setKeeperFilter("blank")}>{v4("apsBlankKeeper")}</button>
            {keepers.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={keeperOn === name ? "1" : "0"} onClick={() => setKeeperFilter(name)}>{name}</button>
            ))}
            <button type="button" className="c4-chip" data-on={clothOn === "all" ? "1" : "0"} onClick={() => setClothFilter("all")}>{v4("apsCloth")}</button>
            <button type="button" className="c4-chip" data-on={clothOn === "blank" ? "1" : "0"} onClick={() => setClothFilter("blank")}>{v4("apsBlankCloth")}</button>
            {CLOTHS.map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={clothOn === item.toUpperCase() ? "1" : "0"} onClick={() => setClothFilter(item)}>{clothLabel(v4, item)}</button>
            ))}
            <button type="button" className="c4-chip" data-on={hushOn === "all" ? "1" : "0"} onClick={() => setHushFilter("all")}>{v4("apsHush")}</button>
            {HUSHES.map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={hushOn === item ? "1" : "0"} onClick={() => setHushFilter(item)}>{hushLabel(v4, item)}</button>
            ))}
            {["all", "blank", "early", "mid", "late", "peak", "quiet", "1", "6"].map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={pewOn === item ? "1" : "0"} onClick={() => setPewFilter(item)}>{item === "all" ? v4("apsPew") : item === "blank" ? v4("apsBlankPew") : item === "early" ? v4("apsEarly") : item === "mid" ? v4("apsMid") : item === "late" ? v4("apsLatePew") : item === "peak" ? v4("apsPeak") : item === "quiet" ? v4("apsQuiet") : item}</button>
            ))}
            {["all", "blank", "2", "4", "8"].map((item) => (
              <button key={`l${item}`} type="button" className="c4-chip" data-on={lampOn === item ? "1" : "0"} onClick={() => setLampFilter(item)}>{item === "all" ? v4("apsLamp") : item === "blank" ? v4("apsBlankLamp") : lampLabel(v4, Number(item))}</button>
            ))}
            {["all", "blank", "15", "30", "60"].map((item) => (
              <button key={`w${item}`} type="button" className="c4-chip" data-on={waitOn === item ? "1" : "0"} onClick={() => setWaitFilter(item)}>{item === "all" ? v4("apsWait") : item === "blank" ? v4("apsBlankWait") : waitLabel(v4, Number(item))}</button>
            ))}
            <button type="button" className="c4-chip" data-on={callOnly ? "1" : "0"} onClick={() => setCallOnly((on) => !on)}>{v4("apsCallOnly")}</button>
            <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((on) => !on)}>{v4("apsPeakOnly")}</button>
            <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((on) => !on)}>{v4("apsHouseOnly")}</button>
            <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((on) => !on)}>{v4("apsQuietOnly")}</button>
            <button type="button" className="c4-chip" data-on={awakeOnly ? "1" : "0"} onClick={() => setAwakeOnly((on) => !on)}>{v4("apsUngiltOnly")}</button>
            <button type="button" className="c4-chip" data-on={order === "pew" ? "1" : "0"} onClick={() => setOrder(sortMode("pew"))}>{v4("apsSortPew")}</button>
            <button type="button" className="c4-chip" data-on={order === "keeper" ? "1" : "0"} onClick={() => setOrder(sortMode("keeper"))}>{v4("apsSortKeeper")}</button>
            <button type="button" className="c4-chip" data-on={density === "roomy" ? "1" : "0"} onClick={() => storeDensity("roomy")}>{v4("apsRoomy")}</button>
            <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity("tight")}>{v4("apsTight")}</button>
            <button type="button" className="c4-chip" data-on={board === "arcade" ? "1" : "0"} onClick={() => setBoard("arcade")}>{v4("apsArcade")}</button>
            <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard("timeline")}>{v4("apsTimeline")}</button>
          </div>
          <form className="c4-aps-form" onSubmit={(event) => {
            event.preventDefault();
            if (viewer) return;
            store(addAlcove(alcoves, { id: `aps-${Date.now()}`, title, note, keeper, pew, cloth, hush, lamp, wait: waitValue, tags: tag }));
            clearDraft();
          }}>
            <label className="c4-lab">{v4("apsLine")}<input ref={titleRef} className="c4-field" aria-label={v4("apsLine")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
            <label className="c4-lab">{v4("apsNote")}<input className="c4-field" aria-label={v4("apsNote")} value={note} onChange={(event) => setNote(event.target.value)} /></label>
            <label className="c4-lab">{v4("apsKeeper")}<input className="c4-field" aria-label={v4("apsKeeper")} value={keeper} onChange={(event) => setKeeper(event.target.value)} /></label>
            <label className="c4-lab">{v4("apsPew")}<input className="c4-field" aria-label={v4("apsPew")} value={pew} onChange={(event) => setPew(event.target.value)} /></label>
            <label className="c4-lab">{v4("apsCloth")}<input className="c4-field" aria-label={v4("apsCloth")} value={cloth} onChange={(event) => setCloth(event.target.value)} /></label>
            <label className="c4-lab">{v4("apsHush")}<input className="c4-field" aria-label={v4("apsHush")} value={hush} onChange={(event) => setHush(event.target.value)} /></label>
            <label className="c4-lab">{v4("apsLamp")}<input className="c4-field" aria-label={v4("apsLamp")} value={lamp} onChange={(event) => setLamp(event.target.value)} /></label>
            <label className="c4-lab">{v4("apsWait")}<input className="c4-field" aria-label={v4("apsWait")} value={waitValue} onChange={(event) => setWaitValue(event.target.value)} /></label>
            <label className="c4-lab">{v4("apsTag")}<input className="c4-field" aria-label={v4("apsTag")} value={tag} onChange={(event) => setTag(event.target.value)} /></label>
            <button type="submit" className="c4-btn" disabled={viewer}>{v4("apsSave")}</button>
          </form>
          <label className="c4-lab">{v4("apsDeskPew")}<input className="c4-field" aria-label={v4("apsDeskPew")} value={deskPew} onChange={(event) => setDeskPew(event.target.value)} /></label>
          <label className="c4-lab">{v4("apsRoster")}<input className="c4-field" aria-label={v4("apsRoster")} value={roster} onChange={(event) => setRoster(event.target.value)} /></label>
          <div className="c4-aps-views">
            <label className="c4-lab">{v4("apsViewName")}<input className="c4-field" aria-label={v4("apsViewName")} value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
              const name = viewName.trim();
              if (!name) return;
              storeViews(addAlcoveView(views, { id: `view-${Date.now()}`, name, tray, query, keeper: keeperOn, cloth: clothOn, hush: hushOn, pew: pewOn, lamp: lampOn, wait: waitOn }));
              setViewName("");
            }}>{v4("apsSaveView")}</button>
            {views.map((view) => (
              <span key={view.id}>
                <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
                <button type="button" className="c4-btn" disabled={viewer} aria-label={v4("apsDropView")} onClick={() => storeViews(dropAlcoveView(views, view.id))}>×</button>
              </span>
            ))}
          </div>
          <div className="c4-aps-bulk">
            <label className="c4-lab">{v4("apsBulkCloth")}<input className="c4-field" aria-label={v4("apsBulkCloth")} value={moveCloth} onChange={(event) => setMoveCloth(event.target.value)} /></label>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkAlcoveCloth(alcoves, picked, moveCloth))}>{v4("apsBulkCloth")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkAlcovePin(alcoves, picked, true))}>{v4("apsBulkPin")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkAlcoveClose(alcoves, picked, true))}>{v4("apsBulkClose")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkAlcoveTag(alcoves, picked, tag))}>{v4("apsBulkTag")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkAlcoveHush(alcoves, picked, hush))}>{v4("apsBulkHush")}</button>
            <button type="button" className="c4-btn" onClick={() => download("apse-alcoves.csv", alcovesCsv(alcoves, deskPew))}>{v4("apsCsv")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetAlcoves())}>{v4("apsReset")}</button>
          </div>
          {!rows.length && <p className="c4-aps-empty">{v4("apsEmpty")}</p>}
          <ol className={board === "timeline" ? "c4-aps-time" : "c4-aps-book"}>
            {rows.map((alcove, index) => (
              <li key={alcove.id} data-focus={index === moveFocus(focus, rows.length, 0) ? "1" : "0"} data-cloth={alcove.cloth.toLowerCase() || "blank"} data-late={lateAlcove(alcove, deskPew) ? "1" : "0"} data-soon={soonAlcove(alcove) ? "1" : "0"} data-house={houseCloth(alcove.cloth) ? "1" : "0"} data-peak={peakPew(alcove.pew) ? "1" : "0"} data-quiet={quietPew(alcove.pew) ? "1" : "0"}>
                <label className="c4-lab"><span className="c4-meta">{v4("apsPick")}</span><input type="checkbox" aria-label={v4("apsPick")} checked={picked.includes(alcove.id)} onChange={() => setPicked((ids) => ids.includes(alcove.id) ? ids.filter((id) => id !== alcove.id) : [...ids, alcove.id])} /></label>
                <div>
                  <strong>{alcove.title}</strong>
                  <span className="c4-meta">{alcove.keeper || v4("apsBlankKeeper")} · {clothLabel(v4, alcove.cloth)} · {hushLabel(v4, alcove.hush)} · {lampLabel(v4, alcove.lamp)} · {waitLabel(v4, alcove.wait)} · {gapLabel(v4, alcove.pew, deskPew)}</span>
                  {alcove.note && <span className="c4-meta">{alcove.note}</span>}
                  {alcove.tags.length > 0 && <span className="c4-meta">{alcove.tags.join(" ")}</span>}
                  {alcove.audit && <span className="c4-meta">{v4("apsAudit")} · {auditLabel(v4, alcove.audit)}</span>}
                  {editing === alcove.id && (
                    <div className="c4-row">
                      <input className="c4-field" aria-label={v4("apsLine")} value={draft} onChange={(event) => setDraft(event.target.value)} />
                      <input className="c4-field" aria-label={v4("apsNote")} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} />
                      <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(editAlcoveNote(editAlcove(alcoves, alcove.id, draft), alcove.id, noteDraft)); setEditing(""); }}>{v4("apsApply")}</button>
                    </div>
                  )}
                  <div className="c4-row">
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setAlcovePin(alcoves, alcove.id, !alcove.pinned))}>{alcove.pinned ? v4("apsUnpin") : v4("apsPin")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setAlcoveHold(alcoves, alcove.id, !alcove.held))}>{alcove.held ? v4("apsLift") : v4("apsHold")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleHush(alcoves, alcove.id))}>{v4("apsHush")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addAlcoveTag(alcoves, alcove.id, tag))}>{v4("apsTag")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setAlcoveClose(alcoves, alcove.id, !alcove.closed))}>{alcove.closed ? v4("apsReopen") : v4("apsClose")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setAlcoveGilt(alcoves, alcove.id, alcove.gilt ? 0 : 2))}>{alcove.gilt ? v4("apsGiltOff") : v4("apsGiltOn")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(alcove.id); setDraft(alcove.title); setNoteDraft(alcove.note); }}>{v4("apsEdit")}</button>
                    <button type="button" className="c4-btn" onClick={() => { const line = alcoveCopy(alcove, deskPew); void navigator.clipboard?.writeText(line); setCopied(alcove.id); }}>{copied === alcove.id ? v4("apsCopied") : v4("apsCopy")}</button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <p className="c4-aps-rules">{v4("apsRules")}</p>
        </div>
      </div>
    </section>
  );
}

export function BrowserCrests({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [band, setBand] = useState("all");
  const [tone, setTone] = useState("all");
  const [shape, setShape] = useState<CrestShape>("all");
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
    note: { lastBrowser: user.lastBrowser ?? null },
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
    const present = presentCrests(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenCrests(readJson(BRC_KEY, []), present);
    const nextReviewed = readReviewedCrests(readJson(BRC_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(BRC_KEY, nextHidden);
    writeJson(BRC_REVIEW_KEY, nextReviewed);
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
  const present = presentCrests(rows);
  const bands = visibleCrestBands(present, hidden, showHidden);
  const bandOn = activeCrestBand(band, present);
  const toneOn = activeCrestTone(tone);
  const shown = visibleCrestCustomers(rows, crestBandArg(bandOn), crestToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = crestState(row.note);
      const token = state === "set" ? crestBand(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return bands.includes(token);
    });
  const lead = leadingCrest(rows);
  const toneLead = leadingCrestTone(rows);
  const shared = sharedCrestCount(rows);
  const catalog = catalogCrestCount(rows);
  const bars = crestBands(rows).filter((line) => line.band);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(BRC_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedCrests(next, ids);
    setReviewed(saved);
    writeJson(BRC_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-brc" aria-label={v4("brcTitle")} data-crests="1" data-role={role} data-catalog={catalog ? "1" : "0"}>
      <div className="c4-brc-sheet">
        <header className="c4-brc-mast">
          <div>
            <p className="c4-brc-kicker">{v4("brcSub")}</p>
            <h2 className="c4-title">{v4("brcTitle")}</h2>
          </div>
          <p className="c4-brc-plate" data-logo="mono">{v4("brcLogo")}</p>
        </header>
        <p className="c4-brc-rules">{v4("brcHint")}</p>
        <p className="c4-meta">{v4("brcKept")} {v4("brcEscape")}</p>
        {viewer && <p className="c4-brc-notice" data-viewer="1">{v4("brcViewer")}</p>}
        {data.error && <p className="c4-brc-empty" role="alert">{v4("brcFailed")}</p>}
        {data.loading && <p className="c4-meta">{v4("brcLoading")}</p>}
        {shared > 0 && <p className="c4-brc-notice" role="status">{v4("brcNotice")} · {shared}</p>}
        <ol className="c4-brc-ledger" aria-label={v4("brcKpi")}>
          <li><span>{v4("brcSet")}</span><strong>{rows.filter((row) => crestState(row.note) === "set").length}</strong></li>
          <li><span>{v4("brcCatalog")}</span><strong>{catalog}</strong></li>
          <li><span>{v4("brcWide")}</span><strong>{wideCrestCount(rows)}</strong></li>
          <li><span>{v4("brcGiltCount")}</span><strong>{giltCrestCount(rows)}</strong></li>
          <li><span>{v4("brcShare")}</span><strong>{crestShare(catalog, rows.length)}%</strong></li>
          <li><span>{v4("brcShared")}</span><strong>{shared}</strong></li>
        </ol>
        <div className="c4-brc-rail" aria-label={v4("brcBands")}>
          {bars.map((bar) => (
            <div key={bar.band} className="c4-brc-meter">
              <button type="button" className="c4-btn" onClick={() => setBand(bar.band)}>{bandLabel(v4, bar.band)} · {bar.count}</button>
              <div className="c4-brc-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            </div>
          ))}
          {!bars.length && <p className="c4-brc-empty">{v4("brcEmpty")}</p>}
        </div>
        <div className="c4-brc-suggest">
          <p>{v4("brcLeading")} · {lead ? bandLabel(v4, lead) : v4("brcLeadingNone")}</p>
          <p>{v4("brcToneLead")} · {toneLead ? crestToneLabel(v4, toneLead) : v4("brcToneNone")}</p>
          <p>{shared ? `${v4("brcShared")} · ${shared}` : v4("brcSharedNone")}</p>
        </div>
        <label className="c4-lab">{v4("brcSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("brcSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <div className="c4-brc-filters">
          <button type="button" className="c4-chip" data-on={bandOn === "all" ? "1" : "0"} onClick={() => setBand("all")}>{v4("brcAll")}</button>
          <button type="button" className="c4-chip" data-on={bandOn === "blank" ? "1" : "0"} onClick={() => setBand("blank")}>{v4("brcClear")}</button>
          {BANDS.map((item) => (
            <button key={item} type="button" className="c4-chip" data-on={bandOn === item ? "1" : "0"} onClick={() => setBand(item)}>{bandLabel(v4, item)}</button>
          ))}
          <button type="button" className="c4-chip" data-on={toneOn === "all" ? "1" : "0"} onClick={() => setTone("all")}>{v4("brcTone")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "gilt" ? "1" : "0"} onClick={() => setTone("gilt")}>{v4("brcGilt")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "ink" ? "1" : "0"} onClick={() => setTone("ink")}>{v4("brcInk")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "ivory" ? "1" : "0"} onClick={() => setTone("ivory")}>{v4("brcIvoryTone")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "mist" ? "1" : "0"} onClick={() => setTone("mist")}>{v4("brcMist")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "plain" ? "1" : "0"} onClick={() => setTone("plain")}>{v4("brcTonePlain")}</button>
          {(["all", "catalog", "wide", "gilt"] as const).map((item) => (
            <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{item === "all" ? v4("brcAllShapes") : item === "catalog" ? v4("brcCatalog") : item === "wide" ? v4("brcWide") : v4("brcGilt")}</button>
          ))}
          <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} onClick={() => setReview("all")}>{v4("brcAllReview")}</button>
          <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview("reviewed")}>{v4("brcReviewed")}</button>
          <button type="button" className="c4-chip" data-on={review === "open" ? "1" : "0"} onClick={() => setReview("open")}>{v4("brcOpenReview")}</button>
          <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("brcShown") : v4("brcHidden")}</button>
        </div>
        <div className="c4-brc-bands">
          {present.map((item) => (
            <button key={item} type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleCrest(hidden, item))}>
              {bandLabel(v4, item)} · {hidden.includes(item) ? v4("brcShow") : v4("brcHide")}
            </button>
          ))}
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkCrestReview(reviewed, shown.map((row) => row.id), true))}>{v4("brcBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkCrestReview(reviewed, ids, false))}>{v4("brcBulkClear")}</button>
          <button type="button" className="c4-btn" onClick={() => download("browser-crests.csv", crestsCsv(rows))}>{v4("brcCsv")}</button>
          <button type="button" className="c4-btn" onClick={() => download("browser-crest-rows.csv", crestRowsCsv(rows, reviewed))}>{v4("brcRowCsv")}</button>
          <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("brcCustomers")}</Link>
        </div>
        {!shown.length && <p className="c4-brc-empty">{v4("brcEmpty")}</p>}
        <ul className="c4-brc-index">
          {shown.map((row) => {
            const state = crestState(row.note);
            const mark = crestOf(row.note);
            return (
              <li key={row.id} data-state={state || "blank"} data-band={state === "set" ? crestBand(row.note) : "blank"} data-tone={crestTone(row.note) || "blank"} data-catalog={catalogCrest(row.note) ? "1" : "0"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"}>
                <p className="c4-brc-mark" data-logo="mono">{mark || "—"}</p>
                <div>
                  <strong>{row.label || row.id}</strong>
                  <span className="c4-meta">{bandLabel(v4, state === "set" ? crestBand(row.note) : state === "clear" ? "blank" : "")} · {crestToneLabel(v4, crestTone(row.note))}</span>
                  {catalogCrest(row.note) && <span className="c4-meta">{v4("brcCatalogMark")}</span>}
                  <div className="c4-row">
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleCrestReview(reviewed, row.id))}>{v4("brcReview")}</button>
                    <button type="button" className="c4-btn" onClick={() => { const line = crestCopy(row.note); void navigator.clipboard?.writeText(line); setCopied(row.id); }}>{copied === row.id ? v4("brcCopied") : v4("brcCopy")}</button>
                    <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{row.label || row.id}</Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="c4-brc-rules">{v4("brcRules")}</p>
      </div>
    </section>
  );
}
