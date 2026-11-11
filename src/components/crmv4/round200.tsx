"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  CRS_KEY,
  CRS_REVIEW_KEY,
  SIT_DENSITY_KEY,
  SIT_KEY,
  SIT_VIEW_KEY,
  activeCrestBand,
  activeCrestTone,
  activeHost,
  activeHour,
  activeLight,
  activeRoom,
  activeStage,
  activeStay,
  addSitting,
  addSittingView,
  bulkCrestReview,
  bulkSittingClose,
  bulkSittingPin,
  bulkSittingRoom,
  bulkSittingTag,
  busiestHost,
  catalogCrest,
  catalogCrestCount,
  clashHourCount,
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
  cycleStage,
  densityOf,
  dropSittingView,
  editSitting,
  editSittingNote,
  fairHost,
  giltCrestCount,
  hostArg,
  hourArg,
  hourGap,
  houseRoom,
  lateSitting,
  leadingCrest,
  leadingCrestTone,
  lightArg,
  lightClashCount,
  moveFocus,
  nextSitting,
  pairCrestCount,
  peakHour,
  presentCrests,
  quietHour,
  readHiddenCrests,
  readReviewedCrests,
  readSittingViews,
  readSittings,
  reminderSittings,
  resetSittings,
  roomArg,
  setSittingClose,
  setSittingHold,
  setSittingPause,
  setSittingPin,
  sharedCrestCount,
  sittingCopy,
  sittingCounts,
  sittingHosts,
  sittingRooms,
  sittingShare,
  sittingTimeline,
  sittingsCsv,
  soonSitting,
  sortMode,
  sortSittings,
  stageArg,
  stayArg,
  suggestHost,
  suggestRoom,
  suggestStay,
  toggleCrest,
  toggleCrestReview,
  usedHours,
  visibleCrestBands,
  visibleCrestCustomers,
  visibleSittings,
  type AtelierSitting,
  type CrestRow,
  type CrestShape,
  type SitDensity,
  type SitRoom,
  type SitSort,
  type SitStage,
  type SitTray,
  type SitView,
} from "@/lib/crmv4/round200";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
};

type GlanceRow = CrestRow & { id: string };

const ROOMS = ["ivory", "graphite", "champagne"] as const;
const BANDS = ["seed", "pair"] as const;

function roomLabel(v4: V4, room: SitRoom | string): string {
  if (room === "ivory" || room === "IVORY") return v4("sitIvory");
  if (room === "graphite" || room === "GRAPHITE") return v4("sitGraphite");
  if (room === "champagne" || room === "CHAMPAGNE") return v4("sitChampagne");
  return v4("sitBlankRoom");
}

function stageLabel(v4: V4, stage: SitStage | string): string {
  if (stage === "listed") return v4("sitListed");
  if (stage === "greeted") return v4("sitGreeted");
  if (stage === "seated") return v4("sitSeated");
  return v4("sitBlankStage");
}

function lightLabel(v4: V4, light: number | null): string {
  if (light === 1) return v4("sitLight1");
  if (light === 3) return v4("sitLight3");
  if (light === 5) return v4("sitLight5");
  return v4("sitBlankLight");
}

function stayLabel(v4: V4, stay: number | null): string {
  if (stay === 20) return v4("sitStay20");
  if (stay === 40) return v4("sitStay40");
  if (stay === 60) return v4("sitStay60");
  return v4("sitBlankStay");
}

function bandLabel(v4: V4, name: string): string {
  if (name === "seed") return v4("crsSeed");
  if (name === "pair") return v4("crsPair");
  if (name === "blank") return v4("crsClear");
  return v4("crsUnmarked");
}

function inkLabel(v4: V4, name: string): string {
  if (name === "gilt") return v4("crsGilt");
  if (name === "ink") return v4("crsInk");
  return v4("crsUnmarked");
}

function auditLabel(v4: V4, audit: string): string {
  const key = {
    save: "sitAuditSave",
    edit: "sitAuditEdit",
    stage: "sitAuditStage",
    pin: "sitAuditPin",
    unpin: "sitAuditUnpin",
    hold: "sitAuditHold",
    lift: "sitAuditLift",
    close: "sitAuditClose",
    open: "sitAuditOpen",
    room: "sitAuditRoom",
    tag: "sitAuditTag",
    pause: "sitAuditPause",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, hour: number | null, desk: string): string {
  const gap = hourGap(hour, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("sitPast")} ${gap}`;
  if (gap < 0) return `${v4("sitAhead")} ${Math.abs(gap)}`;
  return v4("sitDue");
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

export function AtelierSittings({ v4 }: { v4: V4 }) {
  const [sittings, setSittings] = useState<AtelierSitting[]>([]);
  const [views, setViews] = useState<SitView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [host, setHost] = useState("");
  const [hour, setHour] = useState("");
  const [room, setRoom] = useState("");
  const [stage, setStage] = useState("");
  const [light, setLight] = useState("");
  const [stayValue, setStayValue] = useState("");
  const [tag, setTag] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<SitTray>("open");
  const [hostFilter, setHostFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [lightFilter, setLightFilter] = useState("all");
  const [stayFilter, setStayFilter] = useState("all");
  const [greetedOnly, setGreetedOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [awakeOnly, setAwakeOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [order, setOrder] = useState<SitSort>("hour");
  const [density, setDensity] = useState<SitDensity>("roomy");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [deskHour, setDeskHour] = useState("");
  const [moveRoom, setMoveRoom] = useState("graphite");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readSittings(readJson(SIT_KEY, []));
    const saved = readSittingViews(readJson(SIT_VIEW_KEY, []));
    setSittings(next);
    setViews(saved);
    setDensity(densityOf(readJson(SIT_DENSITY_KEY, "roomy")));
    writeJson(SIT_KEY, next);
    writeJson(SIT_VIEW_KEY, saved);
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: AtelierSitting[]) {
    const saved = readSittings(next);
    setSittings(saved);
    writeJson(SIT_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((sitting) => sitting.id === id)));
  }
  function storeViews(next: SitView[]) {
    const saved = readSittingViews(next);
    setViews(saved);
    writeJson(SIT_VIEW_KEY, saved);
  }
  function storeDensity(next: SitDensity) {
    setDensity(next);
    writeJson(SIT_DENSITY_KEY, next);
  }
  const hosts = sittingHosts(sittings);
  const rooms = sittingRooms(sittings);
  const bars = ROOMS.map((item) => ({ room: item.toUpperCase(), count: sittings.filter((sitting) => sitting.room === item.toUpperCase()).length })).filter((row) => row.count > 0);
  const hostOn = activeHost(hostFilter, hosts);
  const roomOn = activeRoom(roomFilter, rooms);
  const stageOn = activeStage(stageFilter, ["listed", "greeted", "seated"]);
  const hourOn = activeHour(hourFilter);
  const lightOn = activeLight(lightFilter);
  const stayOn = activeStay(stayFilter);
  const pickedHour = hourArg(hourOn);
  const shown = sortSittings(visibleSittings(
    sittings,
    tray,
    query,
    hostArg(hostOn),
    roomArg(roomOn),
    stageArg(stageOn),
    pickedHour.exact,
    pickedHour.pick,
    lightArg(lightOn),
    stayArg(stayOn),
    greetedOnly,
    peakOnly,
    houseOnly,
    quietOnly,
    awakeOnly,
  ), order);
  const timeline = sittingTimeline(sittings, query);
  const counts = sittingCounts(sittings, deskHour);
  const clashes = clashHourCount(sittings);
  const lights = lightClashCount(sittings);
  const nextId = nextSitting(sittings, deskHour);
  const nextRow = sittings.find((sitting) => sitting.id === nextId);
  const suggestedRoom = suggestRoom(sittings);
  const suggestedHost = suggestHost(sittings);
  const suggestedStay = suggestStay(sittings);
  const fair = fairHost(sittings, roster);
  const busy = busiestHost(sittings);
  const reminders = reminderSittings(sittings, deskHour);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const focusAt = shown.length ? moveFocus(focus, shown.length, 0) : 0;
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
    setHost("");
    setHour("");
    setRoom("");
    setStage("");
    setLight("");
    setStayValue("");
    setTag("");
    setQuery("");
    setEditing("");
  }
  function applyView(view: SitView) {
    setTray(view.tray);
    setQuery(view.query);
    setHostFilter(view.host);
    setRoomFilter(view.room);
    setStageFilter(view.stage);
    setHourFilter(view.hour);
    setLightFilter(view.light);
    setStayFilter(view.stay);
  }
  const rows = board === "timeline" ? timeline : shown;
  return (
    <section className="c4-sit" aria-label={v4("sitTitle")} data-sittings="1" data-role={role} data-density={density}>
      <header className="c4-sit-mast">
        <p className="c4-sit-spine">{v4("sitSpine")}</p>
        <div>
          <p className="c4-sit-kicker">{v4("sitSub")}</p>
          <h2 className="c4-title">{v4("sitTitle")}</h2>
        </div>
        <p className="c4-sit-plate" data-logo="mono">{v4("sitLogo")}</p>
      </header>
      <p className="c4-sit-rules">{v4("sitHint")}</p>
      <p className="c4-meta">{v4("sitLocal")}</p>
      <p className="c4-meta">{v4("sitNew")} {v4("sitSlash")} {v4("sitEscape")} {v4("sitKeys")}</p>
      {viewer && <p className="c4-sit-notice" data-viewer="1">{v4("sitViewer")}</p>}
      {counts.peak > 0 && (
        <p className="c4-sit-notice" role="status">
          {v4("sitNotice")} · {counts.peak}
          <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("sitNoticeAll") : v4("sitNoticePeak")}</button>
        </p>
      )}
      <ol className="c4-sit-ledger" aria-label={v4("sitKpi")}>
        <li><span>{v4("sitOpen")}</span><strong>{counts.open}</strong></li>
        <li><span>{v4("sitHeld")}</span><strong>{counts.held}</strong></li>
        <li><span>{v4("sitClosed")}</span><strong>{counts.closed}</strong></li>
        <li><span>{v4("sitPinned")}</span><strong>{counts.pinned}</strong></li>
        <li><span>{v4("sitPeak")}</span><strong>{counts.peak}</strong></li>
        <li><span>{v4("sitLate")}</span><strong>{counts.late}</strong></li>
        <li><span>{v4("sitSoon")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("sitPause")}</span><strong>{counts.pause}</strong></li>
        <li><span>{v4("sitHouseShare")}</span><strong>{sittingShare(counts.house, sittings.length)}%</strong></li>
      </ol>
      <div className="c4-sit-rail" aria-label={v4("sitRooms")}>
        {bars.map((bar) => (
          <div key={bar.room} className="c4-sit-meter" data-room={bar.room.toLowerCase()}>
            <button type="button" className="c4-btn" onClick={() => setRoomFilter(bar.room)}>{roomLabel(v4, bar.room)} · {bar.count}</button>
            <div className="c4-sit-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
          </div>
        ))}
        {!bars.length && <p className="c4-sit-empty">{v4("sitEmpty")}</p>}
      </div>
      <div className="c4-sit-suggest">
        <p>{v4("sitSuggestRoom")} · {roomLabel(v4, suggestedRoom)}</p>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setRoom(suggestedRoom.toLowerCase())}>{v4("sitUseRoom")}</button>
        <p>{v4("sitSuggestHost")} · {suggestedHost || v4("sitBlankHost")}</p>
        <button type="button" className="c4-btn" disabled={viewer || !suggestedHost} onClick={() => setHost(suggestedHost)}>{v4("sitUseHost")}</button>
        <p>{v4("sitSuggestStay")} · {stayLabel(v4, suggestedStay)}</p>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setStayValue(String(suggestedStay))}>{v4("sitUseStay")}</button>
        <p>{v4("sitAssign")} · {fair || v4("sitBlankHost")}</p>
        <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setHost(fair)}>{v4("sitAssign")}</button>
        <p>{v4("sitHours")} · {usedHours(sittings)}</p>
        <p>{clashes ? `${v4("sitClash")} · ${clashes}` : v4("sitClashNone")}</p>
        <p>{lights ? `${v4("sitLightClash")} · ${lights}` : v4("sitLightClashNone")}</p>
        <p>{v4("sitNext")} · {nextRow ? nextRow.title : v4("sitNextNone")}</p>
        <p>{v4("sitBusiest")} · {busy || v4("sitBusiestNone")}</p>
        <p>{v4("sitReminders")} · {reminders.length ? reminders.map((sitting) => sitting.title).join(", ") : v4("sitReminderNone")}</p>
      </div>
      <form className="c4-sit-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addSitting(sittings, {
          id: `s${Date.now().toString(36)}`,
          title,
          note,
          host,
          hour,
          room,
          stage,
          light,
          stay: stayValue,
          tags: tag,
          pause: "0",
        });
        const added = next[0];
        if (added && (added.title !== sittings[0]?.title || next.length !== sittings.length)) {
          store(next);
          clearDraft();
        }
      }}>
        <label className="c4-lab">{v4("sitLine")}<input ref={titleRef} className="c4-field" aria-label={v4("sitLine")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("sitNote")}<input className="c4-field" aria-label={v4("sitNote")} value={note} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("sitHost")}<input className="c4-field" aria-label={v4("sitHost")} value={host} onChange={(event) => setHost(event.target.value)} /></label>
        <label className="c4-lab">{v4("sitHour")}<input className="c4-field" inputMode="numeric" aria-label={v4("sitHour")} value={hour} onChange={(event) => setHour(event.target.value)} /></label>
        <label className="c4-lab">{v4("sitRoom")}
          <select className="c4-field" aria-label={v4("sitRoom")} value={room} onChange={(event) => setRoom(event.target.value)}>
            <option value="">{v4("sitBlankRoom")}</option>
            {ROOMS.map((item) => <option key={item} value={item}>{roomLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">{v4("sitStage")}
          <select className="c4-field" aria-label={v4("sitStage")} value={stage} onChange={(event) => setStage(event.target.value)}>
            <option value="">{v4("sitBlankStage")}</option>
            <option value="listed">{v4("sitListed")}</option>
            <option value="greeted">{v4("sitGreeted")}</option>
            <option value="seated">{v4("sitSeated")}</option>
          </select>
        </label>
        <label className="c4-lab">{v4("sitLight")}
          <select className="c4-field" aria-label={v4("sitLight")} value={light} onChange={(event) => setLight(event.target.value)}>
            <option value="">{v4("sitBlankLight")}</option>
            <option value="1">{v4("sitLight1")}</option>
            <option value="3">{v4("sitLight3")}</option>
            <option value="5">{v4("sitLight5")}</option>
          </select>
        </label>
        <label className="c4-lab">{v4("sitStay")}
          <select className="c4-field" aria-label={v4("sitStay")} value={stayValue} onChange={(event) => setStayValue(event.target.value)}>
            <option value="">{v4("sitBlankStay")}</option>
            <option value="20">{v4("sitStay20")}</option>
            <option value="40">{v4("sitStay40")}</option>
            <option value="60">{v4("sitStay60")}</option>
          </select>
        </label>
        <label className="c4-lab">{v4("sitTag")}<input className="c4-field" maxLength={1} aria-label={v4("sitTag")} value={tag} onChange={(event) => setTag(event.target.value)} /></label>
        <label className="c4-lab">{v4("sitRoster")}<input className="c4-field" aria-label={v4("sitRoster")} value={roster} onChange={(event) => setRoster(event.target.value)} /></label>
        <label className="c4-lab">{v4("sitDeskHour")}<input className="c4-field" inputMode="numeric" aria-label={v4("sitDeskHour")} value={deskHour} onChange={(event) => setDeskHour(event.target.value)} /></label>
        <button type="submit" className="c4-btn c4-btn-hot" disabled={viewer}>{v4("sitAdd")}</button>
      </form>
      <div className="c4-sit-views">
        <label className="c4-lab">{v4("sitViews")}<input className="c4-field" aria-label={v4("sitViews")} value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
          const next = addSittingView(views, { id: `v${Date.now().toString(36)}`, name: viewName, tray, query, host: hostOn, room: roomOn, stage: stageOn, hour: hourOn, light: lightOn, stay: stayOn });
          storeViews(next);
          if (next.length !== views.length) setViewName("");
        }}>{v4("sitSaveView")}</button>
        {views.map((view) => (
          <span key={view.id}>
            <button type="button" className="c4-chip" onClick={() => applyView(view)}>{view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropSittingView(views, view.id))}>{v4("sitDropView")}</button>
          </span>
        ))}
      </div>
      <label className="c4-lab">{v4("sitSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("sitSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <div className="c4-sit-filters" role="group" aria-label={v4("sitSearch")}>
        {(["open", "held", "closed"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("sitOpen") : item === "held" ? v4("sitHeld") : v4("sitClosed")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={hostOn === "all" ? "1" : "0"} onClick={() => setHostFilter("all")}>{v4("sitAll")}</button>
        <button type="button" className="c4-chip" data-on={hostOn === "blank" ? "1" : "0"} onClick={() => setHostFilter("blank")}>{v4("sitBlankHost")}</button>
        {hosts.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={hostOn === name ? "1" : "0"} onClick={() => setHostFilter(name)}>{name}</button>
        ))}
        {["blank", "early", "mid", "late", "peak", "quiet"].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hourOn === item ? "1" : "0"} onClick={() => setHourFilter(item)}>
            {item === "blank" ? v4("sitBlankHour") : item === "early" ? v4("sitEarly") : item === "mid" ? v4("sitMid") : item === "late" ? v4("sitLateHour") : item === "peak" ? v4("sitPeak") : v4("sitQuiet")}
          </button>
        ))}
        <button type="button" className="c4-chip" data-on={greetedOnly ? "1" : "0"} onClick={() => setGreetedOnly((on) => !on)}>{v4("sitGreetedOnly")}</button>
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((on) => !on)}>{v4("sitHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((on) => !on)}>{v4("sitQuietOnly")}</button>
        <button type="button" className="c4-chip" data-on={awakeOnly ? "1" : "0"} onClick={() => setAwakeOnly((on) => !on)}>{v4("sitAwake")}</button>
        <button type="button" className="c4-chip" data-on={board === "cards" ? "1" : "0"} onClick={() => setBoard("cards")}>{v4("sitCards")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard("timeline")}>{v4("sitTimeline")}</button>
        <button type="button" className="c4-chip" data-on={order === "hour" ? "1" : "0"} onClick={() => setOrder(sortMode("hour"))}>{v4("sitSortHour")}</button>
        <button type="button" className="c4-chip" data-on={order === "title" ? "1" : "0"} onClick={() => setOrder(sortMode("title"))}>{v4("sitSortTitle")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "roomy" : "tight")}>{density === "tight" ? v4("sitRoomy") : v4("sitTight")}</button>
      </div>
      <div className="c4-sit-bulk">
        <button type="button" className="c4-btn" onClick={() => setPicked(rows.map((sitting) => sitting.id))}>{v4("sitPickAll")}</button>
        <button type="button" className="c4-btn" onClick={() => setPicked([])}>{v4("sitPickNone")}</button>
        <span>{v4("sitPicked")} · {picked.length}</span>
        <select className="c4-field" aria-label={v4("sitBulkRoom")} value={moveRoom} onChange={(event) => setMoveRoom(event.target.value)}>
          {ROOMS.map((item) => <option key={item} value={item}>{roomLabel(v4, item)}</option>)}
        </select>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSittingRoom(sittings, picked, moveRoom))}>{v4("sitBulkRoom")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSittingPin(sittings, picked, true))}>{v4("sitBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSittingClose(sittings, picked, true))}>{v4("sitBulkClose")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSittingTag(sittings, picked, tag || "a"))}>{v4("sitBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("atelier-sittings.csv", sittingsCsv(sittings, deskHour))}>{v4("sitCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetSittings())}>{v4("sitReset")}</button>
      </div>
      {!rows.length && <p className="c4-sit-empty">{v4("sitEmpty")}</p>}
      <ol className={board === "timeline" ? "c4-sit-time" : "c4-sit-book"}>
        {rows.map((sitting, index) => (
          <li key={sitting.id} data-focus={index === focusAt ? "1" : "0"} data-late={lateSitting(sitting, deskHour) ? "1" : "0"} data-soon={soonSitting(sitting) ? "1" : "0"} data-house={houseRoom(sitting.room) ? "1" : "0"} data-peak={peakHour(sitting.hour) ? "1" : "0"} data-quiet={quietHour(sitting.hour) ? "1" : "0"} data-room={sitting.room.toLowerCase() || "blank"}>
            <p className="c4-sit-stamp">{sitting.hour ?? "—"}</p>
            <div>
              <label className="c4-row">
                <input type="checkbox" checked={picked.includes(sitting.id)} aria-label={sitting.title} onChange={(event) => setPicked((ids) => event.target.checked ? [...ids, sitting.id] : ids.filter((id) => id !== sitting.id))} />
                <strong>{sitting.title}</strong>
              </label>
              <p className="c4-meta">{sitting.host || v4("sitBlankHost")} · {roomLabel(v4, sitting.room)} · {stageLabel(v4, sitting.stage)} · {lightLabel(v4, sitting.light)} · {stayLabel(v4, sitting.stay)}</p>
              <p className="c4-meta">{sitting.tags.length ? sitting.tags.join(" ") : v4("sitBlankTag")} · {gapLabel(v4, sitting.hour, deskHour)} · {auditLabel(v4, sitting.audit)}</p>
              {sitting.note && <p>{sitting.note}</p>}
              {editing === sitting.id && (
                <div className="c4-sit-edit">
                  <input className="c4-field" aria-label={v4("sitLine")} value={draft} onChange={(event) => setDraft(event.target.value)} />
                  <input className="c4-field" aria-label={v4("sitNote")} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} />
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(editSittingNote(editSitting(sittings, sitting.id, draft), sitting.id, noteDraft)); setEditing(""); }}>{v4("sitEdit")}</button>
                </div>
              )}
              <div className="c4-row">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleStage(sittings, sitting.id))}>{v4("sitStageUp")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSittingPin(sittings, sitting.id, !sitting.pinned))}>{sitting.pinned ? v4("sitUnpin") : v4("sitPin")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSittingHold(sittings, sitting.id, !sitting.held))}>{sitting.held ? v4("sitLift") : v4("sitHold")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSittingClose(sittings, sitting.id, !sitting.closed))}>{sitting.closed ? v4("sitReopen") : v4("sitClose")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSittingPause(sittings, sitting.id, sitting.pause ? 0 : 20))}>{sitting.pause ? v4("sitPauseOff") : v4("sitPauseOn")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(sitting.id); setDraft(sitting.title); setNoteDraft(sitting.note); }}>{v4("sitEdit")}</button>
                <button type="button" className="c4-btn" onClick={() => { const line = sittingCopy(sitting, deskHour); void navigator.clipboard?.writeText(line); setCopied(sitting.id); }}>{copied === sitting.id ? v4("sitCopied") : v4("sitCopy")}</button>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <p className="c4-sit-rules">{v4("sitRules")}</p>
    </section>
  );
}

export function SurnameCrests({ base, v4 }: { base: string; v4: V4 }) {
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
    note: "name" in user ? { name: user.name ?? "" } : {},
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
    const nextHidden = readHiddenCrests(readJson(CRS_KEY, []), present);
    const nextReviewed = readReviewedCrests(readJson(CRS_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(CRS_KEY, nextHidden);
    writeJson(CRS_REVIEW_KEY, nextReviewed);
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
    writeJson(CRS_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedCrests(next, ids);
    setReviewed(saved);
    writeJson(CRS_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-crs" aria-label={v4("crsTitle")} data-crests="1" data-role={role} data-catalog={catalog ? "1" : "0"}>
      <header className="c4-crs-mast">
        <div>
          <p className="c4-crs-kicker">{v4("crsSub")}</p>
          <h2 className="c4-title">{v4("crsTitle")}</h2>
        </div>
        <p className="c4-crs-plate" data-logo="mono">{v4("crsLogo")}</p>
      </header>
      <p className="c4-crs-rules">{v4("crsHint")}</p>
      <p className="c4-meta">{v4("crsKept")} {v4("crsEscape")}</p>
      {viewer && <p className="c4-crs-notice" data-viewer="1">{v4("crsViewer")}</p>}
      {data.error && <p className="c4-crs-empty" role="alert">{v4("crsFailed")}</p>}
      {data.loading && <p className="c4-meta">{v4("crsLoading")}</p>}
      {shared > 0 && <p className="c4-crs-notice" role="status">{v4("crsNotice")} · {shared}</p>}
      <ol className="c4-crs-ledger" aria-label={v4("crsKpi")}>
        <li><span>{v4("crsSet")}</span><strong>{rows.filter((row) => crestState(row.note) === "set").length}</strong></li>
        <li><span>{v4("crsCatalog")}</span><strong>{catalog}</strong></li>
        <li><span>{v4("crsPairCount")}</span><strong>{pairCrestCount(rows)}</strong></li>
        <li><span>{v4("crsGiltCount")}</span><strong>{giltCrestCount(rows)}</strong></li>
        <li><span>{v4("crsShare")}</span><strong>{crestShare(catalog, rows.length)}%</strong></li>
        <li><span>{v4("crsShared")}</span><strong>{shared}</strong></li>
      </ol>
      <div className="c4-crs-rail" aria-label={v4("crsBands")}>
        {bars.map((bar) => (
          <div key={bar.band} className="c4-crs-meter">
            <button type="button" className="c4-btn" onClick={() => setBand(bar.band)}>{bandLabel(v4, bar.band)} · {bar.count}</button>
            <div className="c4-crs-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
          </div>
        ))}
        {!bars.length && <p className="c4-crs-empty">{v4("crsEmpty")}</p>}
      </div>
      <div className="c4-crs-suggest">
        <p>{v4("crsLeading")} · {lead ? bandLabel(v4, lead) : v4("crsLeadingNone")}</p>
        <p>{v4("crsToneLead")} · {toneLead ? inkLabel(v4, toneLead) : v4("crsToneNone")}</p>
        <p>{shared ? `${v4("crsShared")} · ${shared}` : v4("crsSharedNone")}</p>
      </div>
      <label className="c4-lab">{v4("crsSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("crsSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <div className="c4-crs-filters">
        <button type="button" className="c4-chip" data-on={bandOn === "all" ? "1" : "0"} onClick={() => setBand("all")}>{v4("crsAll")}</button>
        <button type="button" className="c4-chip" data-on={bandOn === "blank" ? "1" : "0"} onClick={() => setBand("blank")}>{v4("crsClear")}</button>
        {BANDS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={bandOn === item ? "1" : "0"} onClick={() => setBand(item)}>{bandLabel(v4, item)}</button>
        ))}
        <button type="button" className="c4-chip" data-on={toneOn === "all" ? "1" : "0"} onClick={() => setTone("all")}>{v4("crsTone")}</button>
        <button type="button" className="c4-chip" data-on={toneOn === "gilt" ? "1" : "0"} onClick={() => setTone("gilt")}>{v4("crsGilt")}</button>
        <button type="button" className="c4-chip" data-on={toneOn === "ink" ? "1" : "0"} onClick={() => setTone("ink")}>{v4("crsInk")}</button>
        {(["all", "catalog", "pair", "gilt"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{item === "all" ? v4("crsAllShapes") : item === "catalog" ? v4("crsCatalog") : item === "pair" ? v4("crsPair") : v4("crsGilt")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} onClick={() => setReview("all")}>{v4("crsAllReview")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview("reviewed")}>{v4("crsReviewed")}</button>
        <button type="button" className="c4-chip" data-on={review === "open" ? "1" : "0"} onClick={() => setReview("open")}>{v4("crsOpenReview")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("crsShown") : v4("crsHidden")}</button>
      </div>
      <div className="c4-crs-bands">
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleCrest(hidden, item))}>
            {bandLabel(v4, item)} · {hidden.includes(item) ? v4("crsShow") : v4("crsHide")}
          </button>
        ))}
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkCrestReview(reviewed, shown.map((row) => row.id), true))}>{v4("crsBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkCrestReview(reviewed, ids, false))}>{v4("crsBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("surname-crests.csv", crestsCsv(rows))}>{v4("crsCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("surname-crest-rows.csv", crestRowsCsv(rows, reviewed))}>{v4("crsRowCsv")}</button>
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("crsCustomers")}</Link>
      </div>
      {!shown.length && <p className="c4-crs-empty">{v4("crsEmpty")}</p>}
      <ul className="c4-crs-index">
        {shown.map((row) => {
          const state = crestState(row.note);
          const mark = crestOf(row.note);
          return (
            <li key={row.id} data-state={state || "blank"} data-band={state === "set" ? crestBand(row.note) : "blank"} data-tone={crestTone(row.note) || "blank"} data-catalog={catalogCrest(row.note) ? "1" : "0"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"}>
              <p className="c4-crs-mark" data-logo="mono">{mark || "—"}</p>
              <div>
                <strong>{row.label || row.id}</strong>
                <span className="c4-meta">{bandLabel(v4, state === "set" ? crestBand(row.note) : state === "clear" ? "blank" : "")} · {inkLabel(v4, crestTone(row.note))}</span>
                {catalogCrest(row.note) && <span className="c4-meta">{v4("crsCatalogMark")}</span>}
                <div className="c4-row">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleCrestReview(reviewed, row.id))}>{v4("crsReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { const line = crestCopy(row.note); void navigator.clipboard?.writeText(line); setCopied(row.id); }}>{copied === row.id ? v4("crsCopied") : v4("crsCopy")}</button>
                  <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{row.label || row.id}</Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="c4-crs-rules">{v4("crsRules")}</p>
    </section>
  );
}
