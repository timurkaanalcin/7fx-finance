"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  DVP_KEY,
  DVP_REVIEW_KEY,
  GLM_DENSITY_KEY,
  GLM_KEY,
  GLM_VIEW_KEY,
  activeCloth,
  activeGlaze,
  activeBay,
  activeDeviceBand,
  activeDeviceTone,
  activeSteward,
  activeStay,
  activeCord,
  addMount,
  addMountTag,
  addMountView,
  adjacentMountCount,
  clothArg,
  bulkMountCloth,
  bulkMountGlaze,
  bulkMountClose,
  bulkMountPin,
  bulkMountTag,
  bulkDeviceReview,
  busiestSteward,
  giltLoad,
  pairStewardCount,
  catalogDevice,
  catalogDeviceCount,
  clashBayCount,
  cycleGlaze,
  densityOf,
  dropMountView,
  editMount,
  editMountNote,
  fairSteward,
  glazeArg,
  giltDeviceCount,
  bayArg,
  bayGap,
  houseCloth,
  mountCloths,
  mountCopy,
  mountCounts,
  mountStewards,
  mountShare,
  mountTimeline,
  mountsCsv,
  lateMount,
  lateShare,
  leadingDevice,
  leadingDeviceTone,
  deviceBand,
  deviceBandArg,
  deviceBands,
  deviceCopy,
  deviceOf,
  deviceRowsCsv,
  deviceShare,
  deviceState,
  deviceTone,
  deviceToneArg,
  devicesCsv,
  moveFocus,
  nextMount,
  peakBay,
  pinFocused,
  presentDevices,
  quietBay,
  readHiddenDevices,
  readMountViews,
  readMounts,
  readReviewedDevices,
  stewardArg,
  reminderMounts,
  resetMounts,
  setMountClose,
  setMountHold,
  setMountPin,
  setMountGilt,
  giltFocused,
  sharedDeviceCount,
  soonMount,
  sortMounts,
  sortMode,
  stayArg,
  suggestCloth,
  suggestSteward,
  suggestStay,
  toggleDevice,
  toggleDeviceReview,
  usedBays,
  visibleMounts,
  visibleDeviceBands,
  visibleDeviceCustomers,
  cordArg,
  cordClashCount,
  wideDeviceCount,
  windowMounts,
  type MountDensity,
  type MountSort,
  type MountTray,
  type MountView,
  type DeviceRow,
  type DeviceShape,
  type GalleryMount,
} from "@/lib/crmv4/round207";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  lastDevice?: string | null;
};

type GlanceRow = DeviceRow & { id: string };

const CLOTHS = ["champagne", "ivory", "graphite"] as const;
const GLAZES = ["matte", "gloss", "satin"] as const;
const BANDS = ["palm", "pocket", "desk", "plain"] as const;

function clothLabel(v4: V4, cloth: string): string {
  if (cloth === "champagne" || cloth === "CHAMPAGNE") return v4("glmChampagne");
  if (cloth === "ivory" || cloth === "IVORY") return v4("glmIvory");
  if (cloth === "graphite" || cloth === "GRAPHITE") return v4("glmGraphite");
  return v4("glmBlankCloth");
}

function glazeLabel(v4: V4, glaze: string): string {
  if (glaze === "matte") return v4("glmMatte");
  if (glaze === "gloss") return v4("glmGloss");
  if (glaze === "satin") return v4("glmSatin");
  return v4("glmBlankGlaze");
}

function cordLabel(v4: V4, cord: number | null): string {
  if (cord === 2) return v4("glmCord2");
  if (cord === 5) return v4("glmCord5");
  if (cord === 8) return v4("glmCord8");
  return v4("glmBlankCord");
}

function stayLabel(v4: V4, stay: number | null): string {
  if (stay === 12) return v4("glmStay12");
  if (stay === 24) return v4("glmStay24");
  if (stay === 48) return v4("glmStay48");
  return v4("glmBlankStay");
}

function bandLabel(v4: V4, name: string): string {
  if (name === "palm") return v4("dvpPalm");
  if (name === "pocket") return v4("dvpPocket");
  if (name === "desk") return v4("dvpDesk");
  if (name === "plain") return v4("dvpPlain");
  if (name === "blank") return v4("dvpClear");
  return v4("dvpUnmarked");
}

function toneLabel(v4: V4, name: string): string {
  if (name === "gilt") return v4("dvpGilt");
  if (name === "ink") return v4("dvpInk");
  if (name === "ivory") return v4("dvpIvory");
  if (name === "plain") return v4("dvpTonePlain");
  return v4("dvpUnmarked");
}

function auditLabel(v4: V4, audit: string): string {
  const key = {
    save: "glmAuditSave",
    edit: "glmAuditEdit",
    glaze: "glmAuditGlaze",
    pin: "glmAuditPin",
    unpin: "glmAuditUnpin",
    hold: "glmAuditHold",
    lift: "glmAuditLift",
    close: "glmAuditClose",
    open: "glmAuditOpen",
    cloth: "glmAuditCloth",
    tag: "glmAuditTag",
    gilt: "glmAuditGilt",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, bay: number | null, desk: string): string {
  const gap = bayGap(bay, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("glmPast")} ${gap}`;
  if (gap < 0) return `${v4("glmAhead")} ${Math.abs(gap)}`;
  return v4("glmDue");
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

export function GalleryMounts({ v4 }: { v4: V4 }) {
  const [lamps, setLamps] = useState<GalleryMount[]>([]);
  const [views, setViews] = useState<MountView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [steward, setSteward] = useState("");
  const [bay, setBay] = useState("");
  const [cloth, setCloth] = useState("");
  const [glaze, setGlaze] = useState("");
  const [cord, setCord] = useState("");
  const [stayValue, setStayValue] = useState("");
  const [tag, setTag] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<MountTray>("open");
  const [stewardFilter, setStewardFilter] = useState("all");
  const [clothFilter, setClothFilter] = useState("all");
  const [glazeFilter, setGlazeFilter] = useState("all");
  const [bayFilter, setBayFilter] = useState("all");
  const [cordFilter, setCordFilter] = useState("all");
  const [stayFilter, setStayFilter] = useState("all");
  const [glossOnly, setGlossOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [awakeOnly, setAwakeOnly] = useState(false);
  const [board, setBoard] = useState<"program" | "timeline">("program");
  const [order, setOrder] = useState<MountSort>("bay");
  const [density, setDensity] = useState<MountDensity>("roomy");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [deskBay, setDeskBay] = useState("");
  const [moveCloth, setMoveCloth] = useState("graphite");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<() => void>(() => {});
  const giltRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readMounts(readJson(GLM_KEY, []));
    const saved = readMountViews(readJson(GLM_VIEW_KEY, []));
    setLamps(next);
    setViews(saved);
    setDensity(densityOf(readJson(GLM_DENSITY_KEY, "roomy")));
    writeJson(GLM_KEY, next);
    writeJson(GLM_VIEW_KEY, saved);
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: GalleryMount[]) {
    const saved = readMounts(next);
    setLamps(saved);
    writeJson(GLM_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((lamp) => lamp.id === id)));
  }
  function storeViews(next: MountView[]) {
    const saved = readMountViews(next);
    setViews(saved);
    writeJson(GLM_VIEW_KEY, saved);
  }
  function storeDensity(next: MountDensity) {
    setDensity(next);
    writeJson(GLM_DENSITY_KEY, next);
  }
  const readers = mountStewards(lamps);
  const alcoves = mountCloths(lamps);
  const bars = CLOTHS.map((item) => ({ cloth: item.toUpperCase(), count: lamps.filter((lamp) => lamp.cloth === item.toUpperCase()).length })).filter((row) => row.count > 0);
  const readerOn = activeSteward(stewardFilter, readers);
  const alcoveOn = activeCloth(clothFilter, alcoves);
  const flameOn = activeGlaze(glazeFilter, ["matte", "gloss", "satin"]);
  const hourOn = activeBay(bayFilter);
  const wickOn = activeCord(cordFilter);
  const spanOn = activeStay(stayFilter);
  const pickedHour = bayArg(hourOn);
  const shown = sortMounts(visibleMounts(
    lamps,
    tray,
    query,
    stewardArg(readerOn),
    clothArg(alcoveOn),
    glazeArg(flameOn),
    pickedHour.exact,
    pickedHour.pick,
    cordArg(wickOn),
    stayArg(spanOn),
    glossOnly,
    peakOnly,
    houseOnly,
    quietOnly,
    awakeOnly,
  ), order);
  const timeline = mountTimeline(lamps, query);
  const counts = mountCounts(lamps, deskBay);
  const clashes = clashBayCount(lamps);
  const wicks = cordClashCount(lamps);
  const neighbors = adjacentMountCount(lamps);
  const nextId = nextMount(lamps, deskBay);
  const nextRow = lamps.find((lamp) => lamp.id === nextId);
  const suggestedAlcove = suggestCloth(lamps);
  const suggestedReader = suggestSteward(lamps);
  const suggestedSpan = suggestStay(lamps);
  const fair = fairSteward(lamps, roster);
  const busy = busiestSteward(lamps);
  const reminders = reminderMounts(lamps, deskBay);
  const windowRows = windowMounts(lamps, deskBay);
  const share = lateShare(lamps, deskBay);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  pinRef.current = () => {
    if (viewer) return;
    const ids = (board === "timeline" ? timeline : shown).map((lamp) => lamp.id);
    store(pinFocused(lamps, ids, focus));
  };
  giltRef.current = () => {
    if (viewer) return;
    const ids = (board === "timeline" ? timeline : shown).map((lamp) => lamp.id);
    store(giltFocused(lamps, ids, focus));
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
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        giltRef.current();
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
    setSteward("");
    setBay("");
    setCloth("");
    setGlaze("");
    setCord("");
    setStayValue("");
    setTag("");
    setQuery("");
    setEditing("");
  }
  function applyView(view: MountView) {
    setTray(view.tray);
    setQuery(view.query);
    setStewardFilter(view.steward);
    setClothFilter(view.cloth);
    setGlazeFilter(view.glaze);
    setBayFilter(view.bay);
    setCordFilter(view.cord);
    setStayFilter(view.stay);
  }
  const rows = board === "timeline" ? timeline : shown;
  return (
    <section className="c4-glm" aria-label={v4("glmTitle")} data-mounts="1" data-role={role} data-density={density}>
      <div className="c4-glm-sheet">
        <header className="c4-glm-mast">
          <p className="c4-glm-spine">{v4("glmSpine")}</p>
          <div>
            <p className="c4-glm-kicker">{v4("glmSub")}</p>
            <h2 className="c4-title">{v4("glmTitle")}</h2>
          </div>
          <p className="c4-glm-plate" data-logo="mono">{v4("glmLogo")}</p>
        </header>
        <div className="c4-glm-body">
          <p className="c4-glm-rules">{v4("glmHint")}</p>
          <p className="c4-meta">{v4("glmLocal")}</p>
          <p className="c4-meta">{v4("glmNew")} {v4("glmSlash")} {v4("glmEscape")} {v4("glmKeys")} {v4("glmPinKey")} {v4("glmShadeKey")} {v4("glmBoardKey")}</p>
          {viewer && <p className="c4-glm-notice" data-viewer="1">{v4("glmViewer")}</p>}
          {counts.peak > 0 && (
            <p className="c4-glm-notice" role="status">
              {v4("glmNotice")} · {counts.peak}
              <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("glmNoticeAll") : v4("glmNoticePeak")}</button>
            </p>
          )}
          {counts.late > 0 && (
            <p className="c4-glm-notice" role="status" data-late="1">
              {v4("glmLateNotice")} · {counts.late}
            </p>
          )}
          <ol className="c4-glm-ledger" aria-label={v4("glmKpi")}>
            <li><span>{v4("glmOpen")}</span><strong>{counts.open}</strong></li>
            <li><span>{v4("glmHeld")}</span><strong>{counts.held}</strong></li>
            <li><span>{v4("glmClosed")}</span><strong>{counts.closed}</strong></li>
            <li><span>{v4("glmPinned")}</span><strong>{counts.pinned}</strong></li>
            <li><span>{v4("glmPeak")}</span><strong>{counts.peak}</strong></li>
            <li><span>{v4("glmLate")}</span><strong>{counts.late}</strong></li>
            <li><span>{v4("glmSoon")}</span><strong>{counts.soon}</strong></li>
            <li><span>{v4("glmShade")}</span><strong>{counts.gilt}</strong></li>
            <li><span>{v4("glmHouseShare")}</span><strong>{mountShare(counts.house, lamps.length)}%</strong></li>
            <li><span>{v4("glmLateShare")}</span><strong>{share}%</strong></li>
          </ol>
          <div className="c4-glm-sla" aria-label={v4("glmLateShare")}>
            <span>{v4("glmLateShare")}</span>
            <div className="c4-glm-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></div>
          </div>
          <div className="c4-glm-rail" aria-label={v4("glmAlcoves")}>
            {bars.map((bar) => (
              <div key={bar.cloth} className="c4-glm-meter" data-cloth={bar.cloth.toLowerCase()}>
                <button type="button" className="c4-btn" onClick={() => setClothFilter(bar.cloth)}>{clothLabel(v4, bar.cloth)} · {bar.count}</button>
                <div className="c4-glm-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
              </div>
            ))}
            {!bars.length && <p className="c4-glm-empty">{v4("glmEmpty")}</p>}
          </div>
          <div className="c4-glm-suggest">
            <p>{v4("glmSuggestAlcove")} · {clothLabel(v4, suggestedAlcove)}</p>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setCloth(suggestedAlcove.toLowerCase())}>{v4("glmUseAlcove")}</button>
            <p>{v4("glmSuggestReader")} · {suggestedReader || v4("glmBlankReader")}</p>
            <button type="button" className="c4-btn" disabled={viewer || !suggestedReader} onClick={() => setSteward(suggestedReader)}>{v4("glmUseReader")}</button>
            <p>{v4("glmSuggestSpan")} · {stayLabel(v4, suggestedSpan)}</p>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setStayValue(String(suggestedSpan))}>{v4("glmUseSpan")}</button>
            <p>{v4("glmAssign")} · {fair || v4("glmBlankReader")}</p>
            <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setSteward(fair)}>{v4("glmAssign")}</button>
          </div>
          <p className="c4-meta">{v4("glmHours")} · {usedBays(lamps)}</p>
          <p className="c4-meta">{clashes ? `${v4("glmClash")} · ${clashes}` : v4("glmClashNone")}</p>
          <p className="c4-meta">{wicks ? `${v4("glmWickClash")} · ${wicks}` : v4("glmWickClashNone")}</p>
          <p className="c4-meta">{neighbors ? `${v4("glmAdjacent")} · ${neighbors}` : v4("glmAdjacentNone")}</p>
          <p className="c4-meta">{pairStewardCount(lamps) ? `${v4("glmPairs")} · ${pairStewardCount(lamps)}` : v4("glmPairsNone")}</p>
          <p className="c4-meta">{`${v4("glmGiltLoad")} · ${giltLoad(lamps)}`}</p>
          <p className="c4-meta">{nextRow ? `${v4("glmNext")} · ${nextRow.title}` : v4("glmNextNone")}</p>
          <p className="c4-meta">{busy ? `${v4("glmBusiest")} · ${busy}` : v4("glmBusiestNone")}</p>
          <div className="c4-glm-reminders" aria-label={v4("glmReminders")}>
            {reminders.length ? reminders.map((lamp) => <span key={lamp.id}>{lamp.title}</span>) : <span>{v4("glmReminderNone")}</span>}
          </div>
          <div className="c4-glm-window" aria-label={v4("glmWindow")}>
            {windowRows.length ? windowRows.map((lamp) => <span key={lamp.id}>{lamp.title}</span>) : <span>{v4("glmWindowNone")}</span>}
          </div>
          <label className="c4-lab">{v4("glmSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("glmSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <div className="c4-glm-filters" role="group" aria-label={v4("glmSearch")}>
            {(["open", "held", "closed"] as const).map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("glmOpenTray") : item === "held" ? v4("glmHeldTray") : v4("glmClosedTray")}</button>
            ))}
            <button type="button" className="c4-chip" data-on={readerOn === "all" ? "1" : "0"} onClick={() => setStewardFilter("all")}>{v4("glmAll")}</button>
            <button type="button" className="c4-chip" data-on={readerOn === "blank" ? "1" : "0"} onClick={() => setStewardFilter("blank")}>{v4("glmBlankReader")}</button>
            {readers.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={readerOn === name ? "1" : "0"} onClick={() => setStewardFilter(name)}>{name}</button>
            ))}
            <button type="button" className="c4-chip" data-on={alcoveOn === "all" ? "1" : "0"} onClick={() => setClothFilter("all")}>{v4("glmAlcove")}</button>
            <button type="button" className="c4-chip" data-on={alcoveOn === "blank" ? "1" : "0"} onClick={() => setClothFilter("blank")}>{v4("glmBlankAlcove")}</button>
            {CLOTHS.map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={alcoveOn === item.toUpperCase() ? "1" : "0"} onClick={() => setClothFilter(item)}>{clothLabel(v4, item)}</button>
            ))}
            <button type="button" className="c4-chip" data-on={flameOn === "all" ? "1" : "0"} onClick={() => setGlazeFilter("all")}>{v4("glmFlame")}</button>
            {GLAZES.map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={flameOn === item ? "1" : "0"} onClick={() => setGlazeFilter(item)}>{glazeLabel(v4, item)}</button>
            ))}
            {["all", "blank", "early", "mid", "late", "peak", "quiet", "2", "8"].map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={hourOn === item ? "1" : "0"} onClick={() => setBayFilter(item)}>{item === "all" ? v4("glmHour") : item === "blank" ? v4("glmBlankHour") : item === "early" ? v4("glmEarly") : item === "mid" ? v4("glmMid") : item === "late" ? v4("glmLateHour") : item === "peak" ? v4("glmPeak") : item === "quiet" ? v4("glmQuiet") : item}</button>
            ))}
            {["all", "blank", "2", "5", "8"].map((item) => (
              <button key={`w${item}`} type="button" className="c4-chip" data-on={wickOn === item ? "1" : "0"} onClick={() => setCordFilter(item)}>{item === "all" ? v4("glmWick") : item === "blank" ? v4("glmBlankWick") : cordLabel(v4, Number(item))}</button>
            ))}
            {["all", "blank", "12", "24", "48"].map((item) => (
              <button key={`s${item}`} type="button" className="c4-chip" data-on={spanOn === item ? "1" : "0"} onClick={() => setStayFilter(item)}>{item === "all" ? v4("glmSpan") : item === "blank" ? v4("glmBlankSpan") : stayLabel(v4, Number(item))}</button>
            ))}
            <button type="button" className="c4-chip" data-on={glossOnly ? "1" : "0"} onClick={() => setGlossOnly((on) => !on)}>{v4("glmBrightOnly")}</button>
            <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((on) => !on)}>{v4("glmPeakOnly")}</button>
            <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((on) => !on)}>{v4("glmHouseOnly")}</button>
            <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((on) => !on)}>{v4("glmQuietOnly")}</button>
            <button type="button" className="c4-chip" data-on={awakeOnly ? "1" : "0"} onClick={() => setAwakeOnly((on) => !on)}>{v4("glmAwakeOnly")}</button>
            <button type="button" className="c4-chip" data-on={order === "bay" ? "1" : "0"} onClick={() => setOrder(sortMode("bay"))}>{v4("glmSortHour")}</button>
            <button type="button" className="c4-chip" data-on={order === "steward" ? "1" : "0"} onClick={() => setOrder(sortMode("steward"))}>{v4("glmSortTitle")}</button>
            <button type="button" className="c4-chip" data-on={density === "roomy" ? "1" : "0"} onClick={() => storeDensity("roomy")}>{v4("glmRoomy")}</button>
            <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity("tight")}>{v4("glmTight")}</button>
            <button type="button" className="c4-chip" data-on={board === "program" ? "1" : "0"} onClick={() => setBoard("program")}>{v4("glmProgram")}</button>
            <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard("timeline")}>{v4("glmTimeline")}</button>
          </div>
          <form className="c4-glm-form" onSubmit={(event) => {
            event.preventDefault();
            if (viewer) return;
            store(addMount(lamps, { id: `glm-${Date.now()}`, title, note, steward, bay, cloth, glaze, cord, stay: stayValue, tags: tag }));
            clearDraft();
          }}>
            <label className="c4-lab">{v4("glmLine")}<input ref={titleRef} className="c4-field" aria-label={v4("glmLine")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
            <label className="c4-lab">{v4("glmNote")}<input className="c4-field" aria-label={v4("glmNote")} value={note} onChange={(event) => setNote(event.target.value)} /></label>
            <label className="c4-lab">{v4("glmReader")}<input className="c4-field" aria-label={v4("glmReader")} value={steward} onChange={(event) => setSteward(event.target.value)} /></label>
            <label className="c4-lab">{v4("glmHour")}<input className="c4-field" aria-label={v4("glmHour")} value={bay} onChange={(event) => setBay(event.target.value)} /></label>
            <label className="c4-lab">{v4("glmAlcove")}<input className="c4-field" aria-label={v4("glmAlcove")} value={cloth} onChange={(event) => setCloth(event.target.value)} /></label>
            <label className="c4-lab">{v4("glmFlame")}<input className="c4-field" aria-label={v4("glmFlame")} value={glaze} onChange={(event) => setGlaze(event.target.value)} /></label>
            <label className="c4-lab">{v4("glmWick")}<input className="c4-field" aria-label={v4("glmWick")} value={cord} onChange={(event) => setCord(event.target.value)} /></label>
            <label className="c4-lab">{v4("glmSpan")}<input className="c4-field" aria-label={v4("glmSpan")} value={stayValue} onChange={(event) => setStayValue(event.target.value)} /></label>
            <label className="c4-lab">{v4("glmTag")}<input className="c4-field" aria-label={v4("glmTag")} value={tag} onChange={(event) => setTag(event.target.value)} /></label>
            <button type="submit" className="c4-btn" disabled={viewer}>{v4("glmSave")}</button>
          </form>
          <label className="c4-lab">{v4("glmDeskHour")}<input className="c4-field" aria-label={v4("glmDeskHour")} value={deskBay} onChange={(event) => setDeskBay(event.target.value)} /></label>
          <label className="c4-lab">{v4("glmRoster")}<input className="c4-field" aria-label={v4("glmRoster")} value={roster} onChange={(event) => setRoster(event.target.value)} /></label>
          <div className="c4-glm-views">
            <label className="c4-lab">{v4("glmViewName")}<input className="c4-field" aria-label={v4("glmViewName")} value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
              const name = viewName.trim();
              if (!name) return;
              storeViews(addMountView(views, { id: `view-${Date.now()}`, name, tray, query, steward: readerOn, cloth: alcoveOn, glaze: flameOn, bay: hourOn, cord: wickOn, stay: spanOn }));
              setViewName("");
            }}>{v4("glmSaveView")}</button>
            {views.map((view) => (
              <span key={view.id}>
                <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
                <button type="button" className="c4-btn" disabled={viewer} aria-label={v4("glmDropView")} onClick={() => storeViews(dropMountView(views, view.id))}>×</button>
              </span>
            ))}
          </div>
          <div className="c4-glm-bulk">
            <label className="c4-lab">{v4("glmBulkAlcove")}<input className="c4-field" aria-label={v4("glmBulkAlcove")} value={moveCloth} onChange={(event) => setMoveCloth(event.target.value)} /></label>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkMountCloth(lamps, picked, moveCloth))}>{v4("glmBulkAlcove")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkMountPin(lamps, picked, true))}>{v4("glmBulkPin")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkMountClose(lamps, picked, true))}>{v4("glmBulkClose")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkMountTag(lamps, picked, tag))}>{v4("glmBulkTag")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkMountGlaze(lamps, picked, glaze))}>{v4("glmBulkGlaze")}</button>
            <button type="button" className="c4-btn" onClick={() => download("gallery-mounts.csv", mountsCsv(lamps, deskBay))}>{v4("glmCsv")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetMounts())}>{v4("glmReset")}</button>
          </div>
          {!rows.length && <p className="c4-glm-empty">{v4("glmEmpty")}</p>}
          <ol className={board === "timeline" ? "c4-glm-time" : "c4-glm-book"}>
            {rows.map((lamp, index) => (
              <li key={lamp.id} data-focus={index === moveFocus(focus, rows.length, 0) ? "1" : "0"} data-cloth={lamp.cloth.toLowerCase() || "blank"} data-late={lateMount(lamp, deskBay) ? "1" : "0"} data-soon={soonMount(lamp) ? "1" : "0"} data-house={houseCloth(lamp.cloth) ? "1" : "0"} data-peak={peakBay(lamp.bay) ? "1" : "0"} data-quiet={quietBay(lamp.bay) ? "1" : "0"}>
                <label className="c4-lab"><span className="c4-meta">{v4("glmPick")}</span><input type="checkbox" aria-label={v4("glmPick")} checked={picked.includes(lamp.id)} onChange={() => setPicked((ids) => ids.includes(lamp.id) ? ids.filter((id) => id !== lamp.id) : [...ids, lamp.id])} /></label>
                <div>
                  <strong>{lamp.title}</strong>
                  <span className="c4-meta">{lamp.steward || v4("glmBlankReader")} · {clothLabel(v4, lamp.cloth)} · {glazeLabel(v4, lamp.glaze)} · {cordLabel(v4, lamp.cord)} · {stayLabel(v4, lamp.stay)} · {gapLabel(v4, lamp.bay, deskBay)}</span>
                  {lamp.note && <span className="c4-meta">{lamp.note}</span>}
                  {lamp.tags.length > 0 && <span className="c4-meta">{lamp.tags.join(" ")}</span>}
                  {lamp.audit && <span className="c4-meta">{v4("glmAudit")} · {auditLabel(v4, lamp.audit)}</span>}
                  {editing === lamp.id && (
                    <div className="c4-row">
                      <input className="c4-field" aria-label={v4("glmLine")} value={draft} onChange={(event) => setDraft(event.target.value)} />
                      <input className="c4-field" aria-label={v4("glmNote")} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} />
                      <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(editMountNote(editMount(lamps, lamp.id, draft), lamp.id, noteDraft)); setEditing(""); }}>{v4("glmApply")}</button>
                    </div>
                  )}
                  <div className="c4-row">
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setMountPin(lamps, lamp.id, !lamp.pinned))}>{lamp.pinned ? v4("glmUnpin") : v4("glmPin")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setMountHold(lamps, lamp.id, !lamp.held))}>{lamp.held ? v4("glmLift") : v4("glmHold")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleGlaze(lamps, lamp.id))}>{v4("glmFlame")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addMountTag(lamps, lamp.id, tag))}>{v4("glmTag")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setMountClose(lamps, lamp.id, !lamp.closed))}>{lamp.closed ? v4("glmReopen") : v4("glmClose")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setMountGilt(lamps, lamp.id, lamp.gilt ? 0 : 3))}>{lamp.gilt ? v4("glmShadeOff") : v4("glmShadeOn")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(lamp.id); setDraft(lamp.title); setNoteDraft(lamp.note); }}>{v4("glmEdit")}</button>
                    <button type="button" className="c4-btn" onClick={() => { const line = mountCopy(lamp, deskBay); void navigator.clipboard?.writeText(line); setCopied(lamp.id); }}>{copied === lamp.id ? v4("glmCopied") : v4("glmCopy")}</button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <p className="c4-glm-rules">{v4("glmRules")}</p>
        </div>
      </div>
    </section>
  );
}

export function DevicePlates({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [band, setBand] = useState("all");
  const [tone, setTone] = useState("all");
  const [shape, setShape] = useState<DeviceShape>("all");
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
    note: { lastDevice: user.lastDevice ?? null },
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
    const present = presentDevices(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenDevices(readJson(DVP_KEY, []), present);
    const nextReviewed = readReviewedDevices(readJson(DVP_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(DVP_KEY, nextHidden);
    writeJson(DVP_REVIEW_KEY, nextReviewed);
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
  const present = presentDevices(rows);
  const bands = visibleDeviceBands(present, hidden, showHidden);
  const bandOn = activeDeviceBand(band, present);
  const toneOn = activeDeviceTone(tone);
  const shown = visibleDeviceCustomers(rows, deviceBandArg(bandOn), deviceToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = deviceState(row.note);
      const token = state === "set" ? deviceBand(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return bands.includes(token);
    });
  const lead = leadingDevice(rows);
  const toneLead = leadingDeviceTone(rows);
  const shared = sharedDeviceCount(rows);
  const catalog = catalogDeviceCount(rows);
  const bars = deviceBands(rows).filter((line) => line.band);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(DVP_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedDevices(next, ids);
    setReviewed(saved);
    writeJson(DVP_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-dvp" aria-label={v4("dvpTitle")} data-devices="1" data-role={role} data-catalog={catalog ? "1" : "0"}>
      <div className="c4-dvp-sheet">
        <header className="c4-dvp-mast">
          <div>
            <p className="c4-dvp-kicker">{v4("dvpSub")}</p>
            <h2 className="c4-title">{v4("dvpTitle")}</h2>
          </div>
          <p className="c4-dvp-plate" data-logo="mono">{v4("dvpLogo")}</p>
        </header>
        <p className="c4-dvp-rules">{v4("dvpHint")}</p>
        <p className="c4-meta">{v4("dvpKept")} {v4("dvpEscape")}</p>
        {viewer && <p className="c4-dvp-notice" data-viewer="1">{v4("dvpViewer")}</p>}
        {data.error && <p className="c4-dvp-empty" role="alert">{v4("dvpFailed")}</p>}
        {data.loading && <p className="c4-meta">{v4("dvpLoading")}</p>}
        {shared > 0 && <p className="c4-dvp-notice" role="status">{v4("dvpNotice")} · {shared}</p>}
        <ol className="c4-dvp-ledger" aria-label={v4("dvpKpi")}>
          <li><span>{v4("dvpSet")}</span><strong>{rows.filter((row) => deviceState(row.note) === "set").length}</strong></li>
          <li><span>{v4("dvpCatalog")}</span><strong>{catalog}</strong></li>
          <li><span>{v4("dvpWide")}</span><strong>{wideDeviceCount(rows)}</strong></li>
          <li><span>{v4("dvpGiltCount")}</span><strong>{giltDeviceCount(rows)}</strong></li>
          <li><span>{v4("dvpShare")}</span><strong>{deviceShare(catalog, rows.length)}%</strong></li>
          <li><span>{v4("dvpShared")}</span><strong>{shared}</strong></li>
        </ol>
        <div className="c4-dvp-rail" aria-label={v4("dvpBands")}>
          {bars.map((bar) => (
            <div key={bar.band} className="c4-dvp-meter">
              <button type="button" className="c4-btn" onClick={() => setBand(bar.band)}>{bandLabel(v4, bar.band)} · {bar.count}</button>
              <div className="c4-dvp-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            </div>
          ))}
          {!bars.length && <p className="c4-dvp-empty">{v4("dvpEmpty")}</p>}
        </div>
        <div className="c4-dvp-suggest">
          <p>{v4("dvpLeading")} · {lead ? bandLabel(v4, lead) : v4("dvpLeadingNone")}</p>
          <p>{v4("dvpToneLead")} · {toneLead ? toneLabel(v4, toneLead) : v4("dvpToneNone")}</p>
          <p>{shared ? `${v4("dvpShared")} · ${shared}` : v4("dvpSharedNone")}</p>
        </div>
        <label className="c4-lab">{v4("dvpSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("dvpSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <div className="c4-dvp-filters">
          <button type="button" className="c4-chip" data-on={bandOn === "all" ? "1" : "0"} onClick={() => setBand("all")}>{v4("dvpAll")}</button>
          <button type="button" className="c4-chip" data-on={bandOn === "blank" ? "1" : "0"} onClick={() => setBand("blank")}>{v4("dvpClear")}</button>
          {BANDS.map((item) => (
            <button key={item} type="button" className="c4-chip" data-on={bandOn === item ? "1" : "0"} onClick={() => setBand(item)}>{bandLabel(v4, item)}</button>
          ))}
          <button type="button" className="c4-chip" data-on={toneOn === "all" ? "1" : "0"} onClick={() => setTone("all")}>{v4("dvpTone")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "gilt" ? "1" : "0"} onClick={() => setTone("gilt")}>{v4("dvpGilt")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "ink" ? "1" : "0"} onClick={() => setTone("ink")}>{v4("dvpInk")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "ivory" ? "1" : "0"} onClick={() => setTone("ivory")}>{v4("dvpIvory")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "plain" ? "1" : "0"} onClick={() => setTone("plain")}>{v4("dvpTonePlain")}</button>
          {(["all", "catalog", "wide", "gilt"] as const).map((item) => (
            <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{item === "all" ? v4("dvpAllShapes") : item === "catalog" ? v4("dvpCatalog") : item === "wide" ? v4("dvpWide") : v4("dvpGilt")}</button>
          ))}
          <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} onClick={() => setReview("all")}>{v4("dvpAllReview")}</button>
          <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview("reviewed")}>{v4("dvpReviewed")}</button>
          <button type="button" className="c4-chip" data-on={review === "open" ? "1" : "0"} onClick={() => setReview("open")}>{v4("dvpOpenReview")}</button>
          <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("dvpShown") : v4("dvpHidden")}</button>
        </div>
        <div className="c4-dvp-bands">
          {present.map((item) => (
            <button key={item} type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleDevice(hidden, item))}>
              {bandLabel(v4, item)} · {hidden.includes(item) ? v4("dvpShow") : v4("dvpHide")}
            </button>
          ))}
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkDeviceReview(reviewed, shown.map((row) => row.id), true))}>{v4("dvpBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkDeviceReview(reviewed, ids, false))}>{v4("dvpBulkClear")}</button>
          <button type="button" className="c4-btn" onClick={() => download("device-plates.csv", devicesCsv(rows))}>{v4("dvpCsv")}</button>
          <button type="button" className="c4-btn" onClick={() => download("device-plate-rows.csv", deviceRowsCsv(rows, reviewed))}>{v4("dvpRowCsv")}</button>
          <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("dvpCustomers")}</Link>
        </div>
        {!shown.length && <p className="c4-dvp-empty">{v4("dvpEmpty")}</p>}
        <ul className="c4-dvp-index">
          {shown.map((row) => {
            const state = deviceState(row.note);
            const mark = deviceOf(row.note);
            return (
              <li key={row.id} data-state={state || "blank"} data-band={state === "set" ? deviceBand(row.note) : "blank"} data-tone={deviceTone(row.note) || "blank"} data-catalog={catalogDevice(row.note) ? "1" : "0"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"}>
                <p className="c4-dvp-mark" data-logo="mono">{mark || "—"}</p>
                <div>
                  <strong>{row.label || row.id}</strong>
                  <span className="c4-meta">{bandLabel(v4, state === "set" ? deviceBand(row.note) : state === "clear" ? "blank" : "")} · {toneLabel(v4, deviceTone(row.note))}</span>
                  {catalogDevice(row.note) && <span className="c4-meta">{v4("dvpCatalogMark")}</span>}
                  <div className="c4-row">
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleDeviceReview(reviewed, row.id))}>{v4("dvpReview")}</button>
                    <button type="button" className="c4-btn" onClick={() => { const line = deviceCopy(row.note); void navigator.clipboard?.writeText(line); setCopied(row.id); }}>{copied === row.id ? v4("dvpCopied") : v4("dvpCopy")}</button>
                    <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{row.label || row.id}</Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="c4-dvp-rules">{v4("dvpRules")}</p>
      </div>
    </section>
  );
}
