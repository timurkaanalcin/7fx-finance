"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  CNS_DENSITY_KEY,
  CNS_KEY,
  CNS_VIEW_KEY,
  RFB_KEY,
  RFB_REVIEW_KEY,
  activeBreath,
  activeDay,
  activeKeeper,
  activePause,
  activeRibbonBand,
  activeRibbonTone,
  activeRoom,
  activeWick,
  addSlip,
  addSlipTag,
  addSlipView,
  adjacentSlipCount,
  breathArg,
  bulkRibbonReview,
  bulkSlipClose,
  bulkSlipPin,
  bulkSlipRoom,
  bulkSlipTag,
  busiestKeeper,
  catalogRibbon,
  catalogRibbonCount,
  clashDayCount,
  cycleBreath,
  dayArg,
  dayGap,
  densityOf,
  dropSlipView,
  editSlip,
  editSlipNote,
  fairKeeper,
  giltRibbonCount,
  houseRoom,
  keeperArg,
  lateShare,
  lateSlip,
  leadingRibbon,
  leadingRibbonTone,
  moveFocus,
  nextSlip,
  pauseArg,
  peakDay,
  pinFocused,
  presentRibbons,
  quietDay,
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
  ribbonOf,
  ribbonRowsCsv,
  ribbonShare,
  ribbonState,
  ribbonTone,
  ribbonToneArg,
  ribbonsCsv,
  roomArg,
  setSlipClose,
  setSlipHold,
  setSlipHush,
  setSlipPin,
  sharedRibbonCount,
  slipCopy,
  slipCounts,
  slipKeepers,
  slipRooms,
  slipShare,
  slipTimeline,
  slipsCsv,
  soonSlip,
  sortMode,
  sortSlips,
  suggestKeeper,
  suggestPause,
  suggestRoom,
  toggleRibbon,
  toggleRibbonReview,
  usedDays,
  visibleRibbonBands,
  visibleRibbonCustomers,
  visibleSlips,
  wickArg,
  wickClashCount,
  wideRibbonCount,
  windowSlips,
  type ConservatorySlip,
  type RibbonRow,
  type RibbonShape,
  type SlipDensity,
  type SlipSort,
  type SlipTray,
  type SlipView,
} from "@/lib/crmv4/round205";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  referralCodeUsed?: string | null;
};

type GlanceRow = RibbonRow & { id: string };

const ROOMS = ["glass", "fern", "tile"] as const;
const BREATHS = ["still", "rising", "fading"] as const;
const BANDS = ["brief", "even", "long", "plain"] as const;

function roomLabel(v4: V4, room: string): string {
  if (room === "glass" || room === "GLASS") return v4("cnsGlass");
  if (room === "fern" || room === "FERN") return v4("cnsFern");
  if (room === "tile" || room === "TILE") return v4("cnsTile");
  return v4("cnsBlankRoom");
}

function breathLabel(v4: V4, breath: string): string {
  if (breath === "still") return v4("cnsStill");
  if (breath === "rising") return v4("cnsRising");
  if (breath === "fading") return v4("cnsFading");
  return v4("cnsBlankBreath");
}

function wickLabel(v4: V4, wick: number | null): string {
  if (wick === 2) return v4("cnsWick2");
  if (wick === 4) return v4("cnsWick4");
  if (wick === 8) return v4("cnsWick8");
  return v4("cnsBlankWick");
}

function pauseLabel(v4: V4, pause: number | null): string {
  if (pause === 15) return v4("cnsPause15");
  if (pause === 30) return v4("cnsPause30");
  if (pause === 60) return v4("cnsPause60");
  return v4("cnsBlankPause");
}

function bandLabel(v4: V4, name: string): string {
  if (name === "brief") return v4("rfbBrief");
  if (name === "even") return v4("rfbEven");
  if (name === "long") return v4("rfbLong");
  if (name === "plain") return v4("rfbPlain");
  if (name === "blank") return v4("rfbClear");
  return v4("rfbUnmarked");
}

function toneLabel(v4: V4, name: string): string {
  if (name === "gilt") return v4("rfbGilt");
  if (name === "ink") return v4("rfbInk");
  if (name === "ivory") return v4("rfbIvory");
  if (name === "plain") return v4("rfbTonePlain");
  return v4("rfbUnmarked");
}

function auditLabel(v4: V4, audit: string): string {
  const key = {
    save: "cnsAuditSave",
    edit: "cnsAuditEdit",
    breath: "cnsAuditBreath",
    pin: "cnsAuditPin",
    unpin: "cnsAuditUnpin",
    hold: "cnsAuditHold",
    lift: "cnsAuditLift",
    close: "cnsAuditClose",
    open: "cnsAuditOpen",
    room: "cnsAuditRoom",
    tag: "cnsAuditTag",
    hush: "cnsAuditHush",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, day: number | null, desk: string): string {
  const gap = dayGap(day, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("cnsPast")} ${gap}`;
  if (gap < 0) return `${v4("cnsAhead")} ${Math.abs(gap)}`;
  return v4("cnsDue");
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

export function ConservatorySlips({ v4 }: { v4: V4 }) {
  const [slips, setSlips] = useState<ConservatorySlip[]>([]);
  const [views, setViews] = useState<SlipView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [keeper, setKeeper] = useState("");
  const [day, setDay] = useState("");
  const [room, setRoom] = useState("");
  const [breath, setBreath] = useState("");
  const [wick, setWick] = useState("");
  const [pauseValue, setPauseValue] = useState("");
  const [tag, setTag] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<SlipTray>("open");
  const [keeperFilter, setKeeperFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");
  const [breathFilter, setBreathFilter] = useState("all");
  const [dayFilter, setDayFilter] = useState("all");
  const [wickFilter, setWickFilter] = useState("all");
  const [pauseFilter, setPauseFilter] = useState("all");
  const [risingOnly, setRisingOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [awakeOnly, setAwakeOnly] = useState(false);
  const [board, setBoard] = useState<"program" | "timeline">("program");
  const [order, setOrder] = useState<SlipSort>("day");
  const [density, setDensity] = useState<SlipDensity>("roomy");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [deskDay, setDeskDay] = useState("");
  const [moveRoom, setMoveRoom] = useState("tile");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readSlips(readJson(CNS_KEY, []));
    const saved = readSlipViews(readJson(CNS_VIEW_KEY, []));
    setSlips(next);
    setViews(saved);
    setDensity(densityOf(readJson(CNS_DENSITY_KEY, "roomy")));
    writeJson(CNS_KEY, next);
    writeJson(CNS_VIEW_KEY, saved);
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: ConservatorySlip[]) {
    const saved = readSlips(next);
    setSlips(saved);
    writeJson(CNS_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((slip) => slip.id === id)));
  }
  function storeViews(next: SlipView[]) {
    const saved = readSlipViews(next);
    setViews(saved);
    writeJson(CNS_VIEW_KEY, saved);
  }
  function storeDensity(next: SlipDensity) {
    setDensity(next);
    writeJson(CNS_DENSITY_KEY, next);
  }
  const keepers = slipKeepers(slips);
  const rooms = slipRooms(slips);
  const bars = ROOMS.map((item) => ({ room: item.toUpperCase(), count: slips.filter((slip) => slip.room === item.toUpperCase()).length })).filter((row) => row.count > 0);
  const keeperOn = activeKeeper(keeperFilter, keepers);
  const roomOn = activeRoom(roomFilter, rooms);
  const breathOn = activeBreath(breathFilter, ["still", "rising", "fading"]);
  const dayOn = activeDay(dayFilter);
  const wickOn = activeWick(wickFilter);
  const pauseOn = activePause(pauseFilter);
  const pickedDay = dayArg(dayOn);
  const shown = sortSlips(visibleSlips(
    slips,
    tray,
    query,
    keeperArg(keeperOn),
    roomArg(roomOn),
    breathArg(breathOn),
    pickedDay.exact,
    pickedDay.pick,
    wickArg(wickOn),
    pauseArg(pauseOn),
    risingOnly,
    peakOnly,
    houseOnly,
    quietOnly,
    awakeOnly,
  ), order);
  const timeline = slipTimeline(slips, query);
  const counts = slipCounts(slips, deskDay);
  const clashes = clashDayCount(slips);
  const wicks = wickClashCount(slips);
  const neighbors = adjacentSlipCount(slips);
  const nextId = nextSlip(slips, deskDay);
  const nextRow = slips.find((slip) => slip.id === nextId);
  const suggestedRoom = suggestRoom(slips);
  const suggestedKeeper = suggestKeeper(slips);
  const suggestedPause = suggestPause(slips);
  const fair = fairKeeper(slips, roster);
  const busy = busiestKeeper(slips);
  const reminders = reminderSlips(slips, deskDay);
  const windowRows = windowSlips(slips, deskDay);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  pinRef.current = () => {
    if (viewer) return;
    const ids = (board === "timeline" ? timeline : shown).map((slip) => slip.id);
    store(pinFocused(slips, ids, focus));
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
    setKeeper("");
    setDay("");
    setRoom("");
    setBreath("");
    setWick("");
    setPauseValue("");
    setTag("");
    setQuery("");
    setEditing("");
  }
  function applyView(view: SlipView) {
    setTray(view.tray);
    setQuery(view.query);
    setKeeperFilter(view.keeper);
    setRoomFilter(view.room);
    setBreathFilter(view.breath);
    setDayFilter(view.day);
    setWickFilter(view.wick);
    setPauseFilter(view.pause);
  }
  const rows = board === "timeline" ? timeline : shown;
  return (
    <section className="c4-cns" aria-label={v4("cnsTitle")} data-slips="1" data-role={role} data-density={density}>
      <div className="c4-cns-sheet">
        <header className="c4-cns-mast">
          <p className="c4-cns-spine">{v4("cnsSpine")}</p>
          <div>
            <p className="c4-cns-kicker">{v4("cnsSub")}</p>
            <h2 className="c4-title">{v4("cnsTitle")}</h2>
          </div>
          <p className="c4-cns-plate" data-logo="mono">{v4("cnsLogo")}</p>
        </header>
        <div className="c4-cns-body">
          <p className="c4-cns-rules">{v4("cnsHint")}</p>
          <p className="c4-meta">{v4("cnsLocal")}</p>
          <p className="c4-meta">{v4("cnsNew")} {v4("cnsSlash")} {v4("cnsEscape")} {v4("cnsKeys")} {v4("cnsPinKey")} {v4("cnsBoardKey")}</p>
          {viewer && <p className="c4-cns-notice" data-viewer="1">{v4("cnsViewer")}</p>}
          {counts.peak > 0 && (
            <p className="c4-cns-notice" role="status">
              {v4("cnsNotice")} · {counts.peak}
              <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("cnsNoticeAll") : v4("cnsNoticePeak")}</button>
            </p>
          )}
          <ol className="c4-cns-ledger" aria-label={v4("cnsKpi")}>
            <li><span>{v4("cnsOpen")}</span><strong>{counts.open}</strong></li>
            <li><span>{v4("cnsHeld")}</span><strong>{counts.held}</strong></li>
            <li><span>{v4("cnsClosed")}</span><strong>{counts.closed}</strong></li>
            <li><span>{v4("cnsPinned")}</span><strong>{counts.pinned}</strong></li>
            <li><span>{v4("cnsPeak")}</span><strong>{counts.peak}</strong></li>
            <li><span>{v4("cnsLate")}</span><strong>{counts.late}</strong></li>
            <li><span>{v4("cnsSoon")}</span><strong>{counts.soon}</strong></li>
            <li><span>{v4("cnsHush")}</span><strong>{counts.hush}</strong></li>
            <li><span>{v4("cnsHouseShare")}</span><strong>{slipShare(counts.house, slips.length)}%</strong></li>
            <li><span>{v4("cnsLateShare")}</span><strong>{lateShare(slips, deskDay)}%</strong></li>
          </ol>
          <div className="c4-cns-rail" aria-label={v4("cnsRooms")}>
            {bars.map((bar) => (
              <div key={bar.room} className="c4-cns-meter" data-room={bar.room.toLowerCase()}>
                <button type="button" className="c4-btn" onClick={() => setRoomFilter(bar.room)}>{roomLabel(v4, bar.room)} · {bar.count}</button>
                <div className="c4-cns-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
              </div>
            ))}
            {!bars.length && <p className="c4-cns-empty">{v4("cnsEmpty")}</p>}
          </div>
          <div className="c4-cns-suggest">
            <p>{v4("cnsSuggestRoom")} · {roomLabel(v4, suggestedRoom)}</p>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setRoom(suggestedRoom.toLowerCase())}>{v4("cnsUseRoom")}</button>
            <p>{v4("cnsSuggestKeeper")} · {suggestedKeeper || v4("cnsBlankKeeper")}</p>
            <button type="button" className="c4-btn" disabled={viewer || !suggestedKeeper} onClick={() => setKeeper(suggestedKeeper)}>{v4("cnsUseKeeper")}</button>
            <p>{v4("cnsSuggestPause")} · {pauseLabel(v4, suggestedPause)}</p>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setPauseValue(String(suggestedPause))}>{v4("cnsUsePause")}</button>
            <p>{v4("cnsAssign")} · {fair || v4("cnsBlankKeeper")}</p>
            <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setKeeper(fair)}>{v4("cnsAssign")}</button>
          </div>
          <p className="c4-meta">{v4("cnsDays")} · {usedDays(slips)}</p>
          <p className="c4-meta">{clashes ? `${v4("cnsClash")} · ${clashes}` : v4("cnsClashNone")}</p>
          <p className="c4-meta">{wicks ? `${v4("cnsWickClash")} · ${wicks}` : v4("cnsWickClashNone")}</p>
          <p className="c4-meta">{neighbors ? `${v4("cnsAdjacent")} · ${neighbors}` : v4("cnsAdjacentNone")}</p>
          <p className="c4-meta">{nextRow ? `${v4("cnsNext")} · ${nextRow.title}` : v4("cnsNextNone")}</p>
          <p className="c4-meta">{busy ? `${v4("cnsBusiest")} · ${busy}` : v4("cnsBusiestNone")}</p>
          <div className="c4-cns-reminders" aria-label={v4("cnsReminders")}>
            {reminders.length ? reminders.map((slip) => <span key={slip.id}>{slip.title}</span>) : <span>{v4("cnsReminderNone")}</span>}
          </div>
          <div className="c4-cns-window" aria-label={v4("cnsWindow")}>
            {windowRows.length ? windowRows.map((slip) => <span key={slip.id}>{slip.title}</span>) : <span>{v4("cnsWindowNone")}</span>}
          </div>
          <label className="c4-lab">{v4("cnsSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("cnsSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <div className="c4-cns-filters" role="group" aria-label={v4("cnsSearch")}>
            {(["open", "held", "closed"] as const).map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("cnsOpenTray") : item === "held" ? v4("cnsHeldTray") : v4("cnsClosedTray")}</button>
            ))}
            <button type="button" className="c4-chip" data-on={keeperOn === "all" ? "1" : "0"} onClick={() => setKeeperFilter("all")}>{v4("cnsAll")}</button>
            <button type="button" className="c4-chip" data-on={keeperOn === "blank" ? "1" : "0"} onClick={() => setKeeperFilter("blank")}>{v4("cnsBlankKeeper")}</button>
            {keepers.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={keeperOn === name ? "1" : "0"} onClick={() => setKeeperFilter(name)}>{name}</button>
            ))}
            <button type="button" className="c4-chip" data-on={roomOn === "all" ? "1" : "0"} onClick={() => setRoomFilter("all")}>{v4("cnsRoom")}</button>
            <button type="button" className="c4-chip" data-on={roomOn === "blank" ? "1" : "0"} onClick={() => setRoomFilter("blank")}>{v4("cnsBlankRoom")}</button>
            {ROOMS.map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={roomOn === item.toUpperCase() ? "1" : "0"} onClick={() => setRoomFilter(item)}>{roomLabel(v4, item)}</button>
            ))}
            <button type="button" className="c4-chip" data-on={breathOn === "all" ? "1" : "0"} onClick={() => setBreathFilter("all")}>{v4("cnsBreath")}</button>
            {BREATHS.map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={breathOn === item ? "1" : "0"} onClick={() => setBreathFilter(item)}>{breathLabel(v4, item)}</button>
            ))}
            {["all", "blank", "early", "mid", "late", "peak", "quiet", "1", "7"].map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={dayOn === item ? "1" : "0"} onClick={() => setDayFilter(item)}>{item === "all" ? v4("cnsDay") : item === "blank" ? v4("cnsBlankDay") : item === "early" ? v4("cnsEarly") : item === "mid" ? v4("cnsMid") : item === "late" ? v4("cnsLateDay") : item === "peak" ? v4("cnsPeak") : item === "quiet" ? v4("cnsQuiet") : item}</button>
            ))}
            {["all", "blank", "2", "4", "8"].map((item) => (
              <button key={`w${item}`} type="button" className="c4-chip" data-on={wickOn === item ? "1" : "0"} onClick={() => setWickFilter(item)}>{item === "all" ? v4("cnsWick") : item === "blank" ? v4("cnsBlankWick") : wickLabel(v4, Number(item))}</button>
            ))}
            {["all", "blank", "15", "30", "60"].map((item) => (
              <button key={`p${item}`} type="button" className="c4-chip" data-on={pauseOn === item ? "1" : "0"} onClick={() => setPauseFilter(item)}>{item === "all" ? v4("cnsPause") : item === "blank" ? v4("cnsBlankPause") : pauseLabel(v4, Number(item))}</button>
            ))}
            <button type="button" className="c4-chip" data-on={risingOnly ? "1" : "0"} onClick={() => setRisingOnly((on) => !on)}>{v4("cnsRisingOnly")}</button>
            <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((on) => !on)}>{v4("cnsPeakOnly")}</button>
            <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((on) => !on)}>{v4("cnsHouseOnly")}</button>
            <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((on) => !on)}>{v4("cnsQuietOnly")}</button>
            <button type="button" className="c4-chip" data-on={awakeOnly ? "1" : "0"} onClick={() => setAwakeOnly((on) => !on)}>{v4("cnsAwakeOnly")}</button>
            <button type="button" className="c4-chip" data-on={order === "day" ? "1" : "0"} onClick={() => setOrder(sortMode("day"))}>{v4("cnsSortDay")}</button>
            <button type="button" className="c4-chip" data-on={order === "title" ? "1" : "0"} onClick={() => setOrder(sortMode("title"))}>{v4("cnsSortTitle")}</button>
            <button type="button" className="c4-chip" data-on={density === "roomy" ? "1" : "0"} onClick={() => storeDensity("roomy")}>{v4("cnsRoomy")}</button>
            <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity("tight")}>{v4("cnsTight")}</button>
            <button type="button" className="c4-chip" data-on={board === "program" ? "1" : "0"} onClick={() => setBoard("program")}>{v4("cnsProgram")}</button>
            <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard("timeline")}>{v4("cnsTimeline")}</button>
          </div>
          <form className="c4-cns-form" onSubmit={(event) => {
            event.preventDefault();
            if (viewer) return;
            store(addSlip(slips, { id: `cns-${Date.now()}`, title, note, keeper, day, room, breath, wick, pause: pauseValue, tags: tag }));
            clearDraft();
          }}>
            <label className="c4-lab">{v4("cnsLine")}<input ref={titleRef} className="c4-field" aria-label={v4("cnsLine")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
            <label className="c4-lab">{v4("cnsNote")}<input className="c4-field" aria-label={v4("cnsNote")} value={note} onChange={(event) => setNote(event.target.value)} /></label>
            <label className="c4-lab">{v4("cnsKeeper")}<input className="c4-field" aria-label={v4("cnsKeeper")} value={keeper} onChange={(event) => setKeeper(event.target.value)} /></label>
            <label className="c4-lab">{v4("cnsDay")}<input className="c4-field" aria-label={v4("cnsDay")} value={day} onChange={(event) => setDay(event.target.value)} /></label>
            <label className="c4-lab">{v4("cnsRoom")}<input className="c4-field" aria-label={v4("cnsRoom")} value={room} onChange={(event) => setRoom(event.target.value)} /></label>
            <label className="c4-lab">{v4("cnsBreath")}<input className="c4-field" aria-label={v4("cnsBreath")} value={breath} onChange={(event) => setBreath(event.target.value)} /></label>
            <label className="c4-lab">{v4("cnsWick")}<input className="c4-field" aria-label={v4("cnsWick")} value={wick} onChange={(event) => setWick(event.target.value)} /></label>
            <label className="c4-lab">{v4("cnsPause")}<input className="c4-field" aria-label={v4("cnsPause")} value={pauseValue} onChange={(event) => setPauseValue(event.target.value)} /></label>
            <label className="c4-lab">{v4("cnsTag")}<input className="c4-field" aria-label={v4("cnsTag")} value={tag} onChange={(event) => setTag(event.target.value)} /></label>
            <button type="submit" className="c4-btn" disabled={viewer}>{v4("cnsSave")}</button>
          </form>
          <label className="c4-lab">{v4("cnsDeskDay")}<input className="c4-field" aria-label={v4("cnsDeskDay")} value={deskDay} onChange={(event) => setDeskDay(event.target.value)} /></label>
          <label className="c4-lab">{v4("cnsRoster")}<input className="c4-field" aria-label={v4("cnsRoster")} value={roster} onChange={(event) => setRoster(event.target.value)} /></label>
          <div className="c4-cns-views">
            <label className="c4-lab">{v4("cnsViewName")}<input className="c4-field" aria-label={v4("cnsViewName")} value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
              const name = viewName.trim();
              if (!name) return;
              storeViews(addSlipView(views, { id: `view-${Date.now()}`, name, tray, query, keeper: keeperOn, room: roomOn, breath: breathOn, day: dayOn, wick: wickOn, pause: pauseOn }));
              setViewName("");
            }}>{v4("cnsSaveView")}</button>
            {views.map((view) => (
              <span key={view.id}>
                <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
                <button type="button" className="c4-btn" disabled={viewer} aria-label={v4("cnsDropView")} onClick={() => storeViews(dropSlipView(views, view.id))}>×</button>
              </span>
            ))}
          </div>
          <div className="c4-cns-bulk">
            <label className="c4-lab">{v4("cnsBulkRoom")}<input className="c4-field" aria-label={v4("cnsBulkRoom")} value={moveRoom} onChange={(event) => setMoveRoom(event.target.value)} /></label>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSlipRoom(slips, picked, moveRoom))}>{v4("cnsBulkRoom")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSlipPin(slips, picked, true))}>{v4("cnsBulkPin")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSlipClose(slips, picked, true))}>{v4("cnsBulkClose")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSlipTag(slips, picked, tag))}>{v4("cnsBulkTag")}</button>
            <button type="button" className="c4-btn" onClick={() => download("conservatory-slips.csv", slipsCsv(slips, deskDay))}>{v4("cnsCsv")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetSlips())}>{v4("cnsReset")}</button>
          </div>
          {!rows.length && <p className="c4-cns-empty">{v4("cnsEmpty")}</p>}
          <ol className={board === "timeline" ? "c4-cns-time" : "c4-cns-book"}>
            {rows.map((slip, index) => (
              <li key={slip.id} data-focus={index === moveFocus(focus, rows.length, 0) ? "1" : "0"} data-room={slip.room.toLowerCase() || "blank"} data-late={lateSlip(slip, deskDay) ? "1" : "0"} data-soon={soonSlip(slip) ? "1" : "0"} data-house={houseRoom(slip.room) ? "1" : "0"} data-peak={peakDay(slip.day) ? "1" : "0"} data-quiet={quietDay(slip.day) ? "1" : "0"}>
                <label className="c4-lab"><span className="c4-meta">{v4("cnsPick")}</span><input type="checkbox" aria-label={v4("cnsPick")} checked={picked.includes(slip.id)} onChange={() => setPicked((ids) => ids.includes(slip.id) ? ids.filter((id) => id !== slip.id) : [...ids, slip.id])} /></label>
                <div>
                  <strong>{slip.title}</strong>
                  <span className="c4-meta">{slip.keeper || v4("cnsBlankKeeper")} · {roomLabel(v4, slip.room)} · {breathLabel(v4, slip.breath)} · {wickLabel(v4, slip.wick)} · {pauseLabel(v4, slip.pause)} · {gapLabel(v4, slip.day, deskDay)}</span>
                  {slip.note && <span className="c4-meta">{slip.note}</span>}
                  {slip.tags.length > 0 && <span className="c4-meta">{slip.tags.join(" ")}</span>}
                  {slip.audit && <span className="c4-meta">{v4("cnsAudit")} · {auditLabel(v4, slip.audit)}</span>}
                  {editing === slip.id && (
                    <div className="c4-row">
                      <input className="c4-field" aria-label={v4("cnsLine")} value={draft} onChange={(event) => setDraft(event.target.value)} />
                      <input className="c4-field" aria-label={v4("cnsNote")} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} />
                      <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(editSlipNote(editSlip(slips, slip.id, draft), slip.id, noteDraft)); setEditing(""); }}>{v4("cnsApply")}</button>
                    </div>
                  )}
                  <div className="c4-row">
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipPin(slips, slip.id, !slip.pinned))}>{slip.pinned ? v4("cnsUnpin") : v4("cnsPin")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipHold(slips, slip.id, !slip.held))}>{slip.held ? v4("cnsLift") : v4("cnsHold")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleBreath(slips, slip.id))}>{v4("cnsBreath")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addSlipTag(slips, slip.id, tag))}>{v4("cnsTag")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipClose(slips, slip.id, !slip.closed))}>{slip.closed ? v4("cnsReopen") : v4("cnsClose")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipHush(slips, slip.id, slip.hush ? 0 : 5))}>{slip.hush ? v4("cnsHushOff") : v4("cnsHushOn")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(slip.id); setDraft(slip.title); setNoteDraft(slip.note); }}>{v4("cnsEdit")}</button>
                    <button type="button" className="c4-btn" onClick={() => { const line = slipCopy(slip, deskDay); void navigator.clipboard?.writeText(line); setCopied(slip.id); }}>{copied === slip.id ? v4("cnsCopied") : v4("cnsCopy")}</button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <p className="c4-cns-rules">{v4("cnsRules")}</p>
        </div>
      </div>
    </section>
  );
}

export function ReferralRibbons({ base, v4 }: { base: string; v4: V4 }) {
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
    note: { referralCodeUsed: user.referralCodeUsed ?? null },
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
    const present = presentRibbons(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenRibbons(readJson(RFB_KEY, []), present);
    const nextReviewed = readReviewedRibbons(readJson(RFB_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(RFB_KEY, nextHidden);
    writeJson(RFB_REVIEW_KEY, nextReviewed);
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
    writeJson(RFB_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedRibbons(next, ids);
    setReviewed(saved);
    writeJson(RFB_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-rfb" aria-label={v4("rfbTitle")} data-ribbons="1" data-role={role} data-catalog={catalog ? "1" : "0"}>
      <div className="c4-rfb-sheet">
        <header className="c4-rfb-mast">
          <div>
            <p className="c4-rfb-kicker">{v4("rfbSub")}</p>
            <h2 className="c4-title">{v4("rfbTitle")}</h2>
          </div>
          <p className="c4-rfb-plate" data-logo="mono">{v4("rfbLogo")}</p>
        </header>
        <p className="c4-rfb-rules">{v4("rfbHint")}</p>
        <p className="c4-meta">{v4("rfbKept")} {v4("rfbEscape")}</p>
        {viewer && <p className="c4-rfb-notice" data-viewer="1">{v4("rfbViewer")}</p>}
        {data.error && <p className="c4-rfb-empty" role="alert">{v4("rfbFailed")}</p>}
        {data.loading && <p className="c4-meta">{v4("rfbLoading")}</p>}
        {shared > 0 && <p className="c4-rfb-notice" role="status">{v4("rfbNotice")} · {shared}</p>}
        <ol className="c4-rfb-ledger" aria-label={v4("rfbKpi")}>
          <li><span>{v4("rfbSet")}</span><strong>{rows.filter((row) => ribbonState(row.note) === "set").length}</strong></li>
          <li><span>{v4("rfbCatalog")}</span><strong>{catalog}</strong></li>
          <li><span>{v4("rfbWide")}</span><strong>{wideRibbonCount(rows)}</strong></li>
          <li><span>{v4("rfbGiltCount")}</span><strong>{giltRibbonCount(rows)}</strong></li>
          <li><span>{v4("rfbShare")}</span><strong>{ribbonShare(catalog, rows.length)}%</strong></li>
          <li><span>{v4("rfbShared")}</span><strong>{shared}</strong></li>
        </ol>
        <div className="c4-rfb-rail" aria-label={v4("rfbBands")}>
          {bars.map((bar) => (
            <div key={bar.band} className="c4-rfb-meter">
              <button type="button" className="c4-btn" onClick={() => setBand(bar.band)}>{bandLabel(v4, bar.band)} · {bar.count}</button>
              <div className="c4-rfb-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            </div>
          ))}
          {!bars.length && <p className="c4-rfb-empty">{v4("rfbEmpty")}</p>}
        </div>
        <div className="c4-rfb-suggest">
          <p>{v4("rfbLeading")} · {lead ? bandLabel(v4, lead) : v4("rfbLeadingNone")}</p>
          <p>{v4("rfbToneLead")} · {toneLead ? toneLabel(v4, toneLead) : v4("rfbToneNone")}</p>
          <p>{shared ? `${v4("rfbShared")} · ${shared}` : v4("rfbSharedNone")}</p>
        </div>
        <label className="c4-lab">{v4("rfbSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("rfbSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <div className="c4-rfb-filters">
          <button type="button" className="c4-chip" data-on={bandOn === "all" ? "1" : "0"} onClick={() => setBand("all")}>{v4("rfbAll")}</button>
          <button type="button" className="c4-chip" data-on={bandOn === "blank" ? "1" : "0"} onClick={() => setBand("blank")}>{v4("rfbClear")}</button>
          {BANDS.map((item) => (
            <button key={item} type="button" className="c4-chip" data-on={bandOn === item ? "1" : "0"} onClick={() => setBand(item)}>{bandLabel(v4, item)}</button>
          ))}
          <button type="button" className="c4-chip" data-on={toneOn === "all" ? "1" : "0"} onClick={() => setTone("all")}>{v4("rfbTone")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "gilt" ? "1" : "0"} onClick={() => setTone("gilt")}>{v4("rfbGilt")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "ink" ? "1" : "0"} onClick={() => setTone("ink")}>{v4("rfbInk")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "ivory" ? "1" : "0"} onClick={() => setTone("ivory")}>{v4("rfbIvory")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "plain" ? "1" : "0"} onClick={() => setTone("plain")}>{v4("rfbTonePlain")}</button>
          {(["all", "catalog", "wide", "gilt"] as const).map((item) => (
            <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{item === "all" ? v4("rfbAllShapes") : item === "catalog" ? v4("rfbCatalog") : item === "wide" ? v4("rfbWide") : v4("rfbGilt")}</button>
          ))}
          <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} onClick={() => setReview("all")}>{v4("rfbAllReview")}</button>
          <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview("reviewed")}>{v4("rfbReviewed")}</button>
          <button type="button" className="c4-chip" data-on={review === "open" ? "1" : "0"} onClick={() => setReview("open")}>{v4("rfbOpenReview")}</button>
          <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("rfbShown") : v4("rfbHidden")}</button>
        </div>
        <div className="c4-rfb-bands">
          {present.map((item) => (
            <button key={item} type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleRibbon(hidden, item))}>
              {bandLabel(v4, item)} · {hidden.includes(item) ? v4("rfbShow") : v4("rfbHide")}
            </button>
          ))}
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkRibbonReview(reviewed, shown.map((row) => row.id), true))}>{v4("rfbBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkRibbonReview(reviewed, ids, false))}>{v4("rfbBulkClear")}</button>
          <button type="button" className="c4-btn" onClick={() => download("referral-ribbons.csv", ribbonsCsv(rows))}>{v4("rfbCsv")}</button>
          <button type="button" className="c4-btn" onClick={() => download("referral-ribbon-rows.csv", ribbonRowsCsv(rows, reviewed))}>{v4("rfbRowCsv")}</button>
          <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("rfbCustomers")}</Link>
        </div>
        {!shown.length && <p className="c4-rfb-empty">{v4("rfbEmpty")}</p>}
        <ul className="c4-rfb-index">
          {shown.map((row) => {
            const state = ribbonState(row.note);
            const mark = ribbonOf(row.note);
            return (
              <li key={row.id} data-state={state || "blank"} data-band={state === "set" ? ribbonBand(row.note) : "blank"} data-tone={ribbonTone(row.note) || "blank"} data-catalog={catalogRibbon(row.note) ? "1" : "0"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"}>
                <p className="c4-rfb-mark" data-logo="mono">{mark || "—"}</p>
                <div>
                  <strong>{row.label || row.id}</strong>
                  <span className="c4-meta">{bandLabel(v4, state === "set" ? ribbonBand(row.note) : state === "clear" ? "blank" : "")} · {toneLabel(v4, ribbonTone(row.note))}</span>
                  {catalogRibbon(row.note) && <span className="c4-meta">{v4("rfbCatalogMark")}</span>}
                  <div className="c4-row">
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleRibbonReview(reviewed, row.id))}>{v4("rfbReview")}</button>
                    <button type="button" className="c4-btn" onClick={() => { const line = ribbonCopy(row.note); void navigator.clipboard?.writeText(line); setCopied(row.id); }}>{copied === row.id ? v4("rfbCopied") : v4("rfbCopy")}</button>
                    <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{row.label || row.id}</Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="c4-rfb-rules">{v4("rfbRules")}</p>
      </div>
    </section>
  );
}
