"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  SDR_DENSITY_KEY,
  SDR_KEY,
  SDR_VIEW_KEY,
  ANT_KEY,
  ANT_REVIEW_KEY,
  activeShelf,
  activeSexton,
  activePace,
  activePigment,
  activeStay,
  activeAntiphonLane,
  activeAntiphonTone,
  activeWick,
  addDrawer,
  addDrawerTag,
  addDrawerView,
  adjacentDrawerCount,
  shelfArg,
  shelfGap,
  shelfWidth,
  bellCount,
  brightAntiphonCount,
  bulkDrawerArchive,
  bulkDrawerPace,
  bulkDrawerPigment,
  bulkDrawerPin,
  bulkDrawerTag,
  bulkAntiphonReview,
  busiestSexton,
  cipherCount,
  clashShelfCount,
  sextonArg,
  drawerSextons,
  drawerCopy,
  drawerCounts,
  drawerIndex,
  drawerPigments,
  drawerShare,
  drawersCsv,
  coolingDrawer,
  coolingDrawers,
  cyclePace,
  dropDrawerView,
  editDrawer,
  editDrawerNote,
  fairSexton,
  paceArg,
  paceFocusedDrawer,
  bossFocusedDrawer,
  holdFocusedDrawer,
  housePigment,
  pigmentArg,
  lateDrawer,
  lateDrawerShare,
  leadingAntiphon,
  leadingAntiphonTone,
  marginCount,
  matchedDrawers,
  moveDrawerFocus,
  nextDrawer,
  pairSextonCount,
  peakShelf,
  pinFocusedDrawer,
  presentAntiphonLanes,
  quietShelf,
  quietHallCount,
  readDrawerViews,
  readDrawers,
  readHiddenAntiphons,
  readReviewedAntiphons,
  reminderDrawers,
  resetDrawers,
  stayArg,
  stayLoad,
  antiphonCopy,
  antiphonLane,
  antiphonLaneArg,
  antiphonLanes,
  antiphonMark,
  antiphonRowsCsv,
  antiphonShare,
  antiphonState,
  antiphonStep,
  antiphonTone,
  antiphonToneArg,
  antiphonsCsv,
  rowDensity,
  flareLoad,
  setDrawerArchive,
  setDrawerBoss,
  setDrawerHold,
  setDrawerPin,
  setDrawerStay,
  sharedPigmentCount,
  sharedAntiphonCount,
  snoozeDrawer,
  snoozeFocusedDrawer,
  sortDrawers,
  wickArg,
  wickClashCount,
  stitchedAntiphon,
  stitchedAntiphonCount,
  suggestSexton,
  suggestPigment,
  suggestWick,
  toggleAntiphon,
  toggleAntiphonReview,
  usedShelves,
  visibleDrawers,
  visibleAntiphonLanes,
  visibleAntiphons,
  wideAntiphon,
  wideAntiphonCount,
  windowDrawers,
  type DrawerDensity,
  type SacristyDrawer,
  type DrawerSort,
  type DrawerTray,
  type DrawerView,
  type AntiphonReview,
  type AntiphonRow,
  type AntiphonShape,
  type AntiphonValue,
} from "@/lib/crmv4/round228";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type TicketRow = {
  id?: string;
  kind?: string | null;
  status?: string | null;
  customer?: string | null;
};

type DocRow = {
  id?: string;
  name?: string | null;
  docType?: string | null;
  status?: string | null;
  trader?: string | null;
};

type GlanceRow = AntiphonRow & { id: string };

const INKS = ["graphite", "ivory", "champagne"] as const;
const GAITS = ["still", "walk", "flare"] as const;
const LANES = ["margin", "bell", "quill", "cipher"] as const;

function pigmentLabel(v4: V4, pigment: string): string {
  if (pigment === "graphite" || pigment === "GRAPHITE") return v4("sdrGraphite");
  if (pigment === "ivory" || pigment === "IVORY") return v4("sdrIvory");
  if (pigment === "champagne" || pigment === "CHAMPAGNE") return v4("sdrChampagne");
  return v4("sdrBlankPigment");
}

function paceLabel(v4: V4, pace: string): string {
  if (pace === "still") return v4("sdrHush");
  if (pace === "walk") return v4("sdrStride");
  if (pace === "flare") return v4("sdrRush");
  return v4("sdrBlankPace");
}

function wickLabel(v4: V4, wick: number | null): string {
  if (wick === 5) return v4("sdrWick5");
  if (wick === 15) return v4("sdrWick15");
  if (wick === 45) return v4("sdrWick45");
  return v4("sdrBlankWick");
}

function laneLabel(v4: V4, name: string): string {
  if (name === "margin") return v4("antMargin");
  if (name === "bell") return v4("antBell");
  if (name === "quill") return v4("antQuill");
  if (name === "cipher") return v4("antCipher");
  if (name === "blank") return v4("antClear");
  return v4("antUnmarked");
}

function toneLabel(v4: V4, name: string): string {
  if (name === "bright") return v4("antBright");
  if (name === "even") return v4("antEven");
  if (name === "dim") return v4("antDim");
  if (name === "hush") return v4("antHush");
  if (name === "mist") return v4("antMist");
  return v4("antUnmarked");
}

function auditLabel(v4: V4, audit: string): string {
  const key = {
    save: "sdrAuditSave",
    edit: "sdrAuditEdit",
    note: "sdrAuditNote",
    pace: "sdrAuditPace",
    pin: "sdrAuditPin",
    unpin: "sdrAuditUnpin",
    hold: "sdrAuditHold",
    resume: "sdrAuditResume",
    archive: "sdrAuditArchive",
    open: "sdrAuditOpen",
    pigment: "sdrAuditPigment",
    tag: "sdrAuditTag",
    stay: "sdrAuditStay",
    wick: "sdrAuditWick",
    boss: "sdrAuditBoss",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, shelf: number | null, desk: string): string {
  const gap = shelfGap(shelf, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("sdrPast")} ${gap}`;
  if (gap < 0) return `${v4("sdrAhead")} ${Math.abs(gap)}`;
  return v4("sdrDue");
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

function textField(raw: string | null | undefined): string {
  return typeof raw === "string" ? raw : "";
}

export function SacristyDrawers({ v4 }: { v4: V4 }) {
  const [panels, setPanels] = useState<SacristyDrawer[]>([]);
  const [views, setViews] = useState<DrawerView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [sexton, setSexton] = useState("");
  const [shelf, setShelf] = useState("");
  const [pigment, setPigment] = useState("");
  const [pace, setPace] = useState("");
  const [wickValue, setWickValue] = useState("");
  const [stay, setStay] = useState("");
  const [tag, setTag] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<DrawerTray>("open");
  const [sextonFilter, setSextonFilter] = useState("all");
  const [pigmentFilter, setPigmentFilter] = useState("all");
  const [paceFilter, setPaceFilter] = useState("all");
  const [shelfFilter, setShelfFilter] = useState("all");
  const [wickFilter, setWickFilter] = useState("all");
  const [stayFilter, setStayFilter] = useState("all");
  const [flareOnly, setFlareOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [restingOnly, setRestingOnly] = useState(false);
  const [board, setBoard] = useState<"hall" | "index">("hall");
  const [order, setOrder] = useState<DrawerSort>("shelf");
  const [density, setDensity] = useState<DrawerDensity>("airy");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [deskShelf, setDeskShelf] = useState("");
  const [movePigment, setMovePigment] = useState("graphite");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<() => void>(() => {});
  const wickRef = useRef<() => void>(() => {});
  const holdRef = useRef<() => void>(() => {});
  const paceRef = useRef<() => void>(() => {});
  const bossRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readDrawers(readJson(SDR_KEY, []));
    const saved = readDrawerViews(readJson(SDR_VIEW_KEY, []));
    setPanels(next);
    setViews(saved);
    setDensity(rowDensity(readJson(SDR_DENSITY_KEY, "airy")));
    writeJson(SDR_KEY, next);
    writeJson(SDR_VIEW_KEY, saved);
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: SacristyDrawer[]) {
    const saved = readDrawers(next);
    setPanels(saved);
    writeJson(SDR_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((panel) => panel.id === id)));
  }
  function storeViews(next: DrawerView[]) {
    const saved = readDrawerViews(next);
    setViews(saved);
    writeJson(SDR_VIEW_KEY, saved);
  }
  function storeDensity(next: DrawerDensity) {
    setDensity(next);
    writeJson(SDR_DENSITY_KEY, next);
  }
  const sextons = drawerSextons(panels);
  const pigments = drawerPigments(panels);
  const bars = INKS.map((item) => ({ pigment: item.toUpperCase(), count: panels.filter((panel) => panel.pigment === item.toUpperCase()).length })).filter((row) => row.count > 0);
  const sextonOn = activeSexton(sextonFilter, sextons);
  const pigmentOn = activePigment(pigmentFilter, ["GRAPHITE", "IVORY", "CHAMPAGNE", ...pigments]);
  const paceOn = activePace(paceFilter, ["still", "walk", "flare"]);
  const shelfOn = activeShelf(shelfFilter);
  const wickOn = activeWick(wickFilter);
  const stayOn = activeStay(stayFilter);
  const pickedShelf = shelfArg(shelfOn);
  const shown = sortDrawers(visibleDrawers(
    panels,
    tray,
    query,
    sextonArg(sextonOn),
    pigmentArg(pigmentOn),
    paceArg(paceOn),
    pickedShelf.exact,
    pickedShelf.pick,
    wickArg(wickOn),
    stayArg(stayOn),
    flareOnly,
    peakOnly,
    houseOnly,
    quietOnly,
    restingOnly,
  ), order);
  const book = drawerIndex(panels, query);
  const counts = drawerCounts(panels, deskShelf);
  const share = lateDrawerShare(panels, deskShelf);
  const matched = matchedDrawers(panels, deskShelf);
  const clashes = clashShelfCount(panels);
  const wicks = wickClashCount(panels);
  const neighbors = adjacentDrawerCount(panels);
  const suggestedPigment = suggestPigment(panels);
  const suggestedName = suggestSexton(panels);
  const suggestedWick = suggestWick(panels);
  const fair = fairSexton(panels, roster);
  const busy = busiestSexton(panels);
  const reminders = reminderDrawers(panels, deskShelf);
  const cooling = coolingDrawers(panels);
  const windowRows = windowDrawers(panels, deskShelf);
  const nextTitle = nextDrawer(panels, deskShelf);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  pinRef.current = () => {
    if (!viewer) store(pinFocusedDrawer(panels, shown.map((panel) => panel.id), focus));
  };
  wickRef.current = () => {
    if (!viewer) store(snoozeFocusedDrawer(panels, shown.map((panel) => panel.id), focus));
  };
  holdRef.current = () => {
    if (!viewer) store(holdFocusedDrawer(panels, shown.map((panel) => panel.id), focus));
  };
  paceRef.current = () => {
    if (!viewer) store(paceFocusedDrawer(panels, shown.map((panel) => panel.id), focus));
  };
  bossRef.current = () => {
    if (!viewer) store(bossFocusedDrawer(panels, shown.map((panel) => panel.id), focus));
  };
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setTitle("");
        setNote("");
        setSexton("");
        setShelf("");
        setPigment("");
        setPace("");
        setWickValue("");
        setStay("");
        setTag("");
        setQuery("");
        setEditing("");
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveDrawerFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveDrawerFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        titleRef.current?.focus();
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        pinRef.current();
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        wickRef.current();
        return;
      }
      if (event.key === "y" || event.key === "Y") {
        event.preventDefault();
        holdRef.current();
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        paceRef.current();
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        bossRef.current();
        return;
      }
      if (event.key === "d" || event.key === "D") {
        event.preventDefault();
        setBoard((current) => (current === "hall" ? "index" : "hall"));
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
    setSexton("");
    setShelf("");
    setPigment("");
    setPace("");
    setWickValue("");
    setStay("");
    setTag("");
    setQuery("");
    setEditing("");
  }
  function applyView(view: DrawerView) {
    setTray(view.tray);
    setQuery(view.query);
    setSextonFilter(view.sexton);
    setPigmentFilter(view.pigment);
    setPaceFilter(view.pace);
    setShelfFilter(view.shelf);
    setWickFilter(view.wick);
    setStayFilter(view.stay);
  }
  const rows = board === "index" ? book : shown;
  const houseOpen = panels.filter((panel) => !panel.held && !panel.archived && housePigment(panel.pigment)).length;
  const openCount = Math.max(1, counts.open);
  return (
    <section className="c4-sdr" aria-label={v4("sdrTitle")} data-drawers="1" data-role={role} data-density={density}>
      <div className="c4-sdr-sheet">
        <header className="c4-sdr-mast">
          <p className="c4-sdr-plate" data-logo="mono">{v4("sdrLogo")}</p>
          <div>
            <p className="c4-sdr-kicker">{v4("sdrSub")}</p>
            <h2 className="c4-title">{v4("sdrTitle")}</h2>
          </div>
        </header>
        <p className="c4-sdr-time">{v4("sdrLocal")}</p>
        <p className="c4-sdr-rules">{v4("sdrHint")}</p>
        <p className="c4-meta">{v4("sdrNew")} {v4("sdrSlash")} {v4("sdrEscape")} {v4("sdrKeys")} {v4("sdrPinKey")} {v4("sdrWickKey")} {v4("sdrHoldKey")} {v4("sdrPaceKey")} {v4("sdrBossKey")} {v4("sdrBoardKey")}</p>
        {viewer && <p className="c4-sdr-notice" data-viewer="1">{v4("sdrViewer")}</p>}
        {counts.peak > 0 && (
          <p className="c4-sdr-notice" role="status">
            {v4("sdrNotice")} · {counts.peak}
            <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("sdrNoticeAll") : v4("sdrNoticePeak")}</button>
          </p>
        )}
        {counts.late > 0 && <p className="c4-sdr-notice" role="status">{v4("sdrLateNotice")} · {counts.late}</p>}
        <ol className="c4-sdr-kpis" aria-label={v4("sdrKpi")}>
          <li><span>{v4("sdrOpen")}</span><strong>{counts.open}</strong></li>
          <li><span>{v4("sdrHeld")}</span><strong>{counts.held}</strong></li>
          <li><span>{v4("sdrArchived")}</span><strong>{counts.archived}</strong></li>
          <li><span>{v4("sdrPinned")}</span><strong>{counts.pinned}</strong></li>
          <li><span>{v4("sdrPeak")}</span><strong>{counts.peak}</strong></li>
          <li><span>{v4("sdrLate")}</span><strong>{counts.late}</strong></li>
          <li><span>{v4("sdrSoon")}</span><strong>{counts.soon}</strong></li>
          <li><span>{v4("sdrStay")}</span><strong>{counts.stay}</strong></li>
          <li><span>{v4("sdrMatched")}</span><strong>{matched}</strong></li>
          <li><span>{v4("sdrBoss")}</span><strong>{counts.boss}</strong></li>
          <li><span>{v4("sdrCooling")}</span><strong>{counts.cooling}</strong></li>
        </ol>
        <div className="c4-sdr-meter" aria-label={v4("sdrLateShare")}>
          <span>{v4("sdrHouseShare")} {drawerShare(houseOpen, openCount)}%</span>
          <span>{v4("sdrLateShare")} {share}%</span>
          <i style={{ width: `${share}%` }} />
        </div>
        <ol className="c4-sdr-bars" aria-label={v4("sdrPigments")}>
          {bars.map((bar) => (
            <li key={bar.pigment}>
              <span>{pigmentLabel(v4, bar.pigment)}</span>
              <b style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
              <em>{bar.count}</em>
            </li>
          ))}
        </ol>
        {!panels.length && <p className="c4-sdr-empty">{v4("sdrEmpty")}</p>}
        <div className="c4-sdr-suggest">
          <p>{v4("sdrSuggestPigment")}: {pigmentLabel(v4, suggestedPigment)}</p>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => setPigment(suggestedPigment.toLowerCase())}>{v4("sdrUsePigment")}</button>
          <p>{suggestedName ? `${v4("sdrSuggestSexton")}: ${suggestedName}` : v4("sdrBlankSexton")}</p>
          <button type="button" className="c4-btn" disabled={viewer || !suggestedName} onClick={() => setSexton(suggestedName)}>{v4("sdrUseSexton")}</button>
          <p>{v4("sdrSuggestWick")}: {wickLabel(v4, suggestedWick)}</p>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => setWickValue(String(suggestedWick))}>{v4("sdrUseWick")}</button>
          <p>{v4("sdrAssign")}: {fair || v4("sdrBlankSexton")}</p>
          <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setSexton(fair)}>{v4("sdrUseSexton")}</button>
        </div>
        <ul className="c4-sdr-facts">
          <li>{v4("sdrShelves")}: {usedShelves(panels)}</li>
          <li>{clashes ? `${v4("sdrClash")} ${clashes}` : v4("sdrClashNone")}</li>
          <li>{wicks ? `${v4("sdrWickClash")} ${wicks}` : v4("sdrWickClashNone")}</li>
          <li>{neighbors ? `${v4("sdrAdjacent")} ${neighbors}` : v4("sdrAdjacentNone")}</li>
          <li>{pairSextonCount(panels) ? `${v4("sdrPairs")} ${pairSextonCount(panels)}` : v4("sdrPairsNone")}</li>
          <li>{sharedPigmentCount(panels) ? `${v4("sdrSharedPigment")} ${sharedPigmentCount(panels)}` : v4("sdrSharedPigmentNone")}</li>
          <li>{v4("sdrStayLoad")}: {stayLoad(panels)}</li>
          <li>{v4("sdrQuietHall")}: {quietHallCount(panels)}</li>
          <li>{v4("sdrRushLoad")}: {flareLoad(panels)}</li>
          <li>{v4("sdrShelfWidth")}: {shelfWidth(panels)}</li>
          <li>{nextTitle ? `${v4("sdrNext")}: ${nextTitle}` : v4("sdrNextNone")}</li>
          <li>{busy ? `${v4("sdrBusiest")}: ${busy}` : v4("sdrBusiestNone")}</li>
          <li>{v4("sdrWindow")}: {windowRows.length}</li>
        </ul>
        <section className="c4-sdr-reminders" aria-label={v4("sdrReminders")}>
          <h3>{v4("sdrReminders")}</h3>
          {!reminders.length && <p className="c4-sdr-empty">{v4("sdrReminderEmpty")}</p>}
          <ul>
            {reminders.map((panel) => (
              <li key={panel.id}>{panel.title} · {lateDrawer(panel, deskShelf) ? v4("sdrLate") : v4("sdrSoon")}</li>
            ))}
          </ul>
        </section>
        <section className="c4-sdr-cooling" aria-label={v4("sdrCooling")}>
          <h3>{v4("sdrCooling")}</h3>
          {!cooling.length && <p className="c4-sdr-empty">{v4("sdrCoolingEmpty")}</p>}
          <ul>
            {cooling.map((panel) => (
              <li key={panel.id}>{panel.title} · {panel.shelf}</li>
            ))}
          </ul>
        </section>
        <form className="c4-sdr-form" onSubmit={(event) => {
          event.preventDefault();
          if (viewer) return;
          store(addDrawer(panels, {
            id: `sdr-${Date.now()}`,
            title,
            note,
            sexton,
            shelf,
            pigment,
            pace,
            wick: wickValue,
            stay,
            tags: tag,
          }));
          clearDraft();
        }}>
          <input ref={titleRef} className="c4-field" aria-label={v4("sdrTitle")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} />
          <input className="c4-field" aria-label={v4("sdrNote")} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} />
          <input className="c4-field" aria-label={v4("sdrSexton")} value={sexton} disabled={viewer} onChange={(event) => setSexton(event.target.value)} />
          <input className="c4-field" aria-label={v4("sdrShelf")} inputMode="numeric" value={shelf} disabled={viewer} onChange={(event) => setShelf(event.target.value)} />
          <select className="c4-select" aria-label={v4("sdrPigment")} value={pigment} disabled={viewer} onChange={(event) => setPigment(event.target.value)}>
            <option value="">{v4("sdrBlankPigment")}</option>
            {INKS.map((item) => <option key={item} value={item}>{pigmentLabel(v4, item)}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("sdrPace")} value={pace} disabled={viewer} onChange={(event) => setPace(event.target.value)}>
            <option value="">{v4("sdrBlankPace")}</option>
            {GAITS.map((item) => <option key={item} value={item}>{paceLabel(v4, item)}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("sdrWick")} value={wickValue} disabled={viewer} onChange={(event) => setWickValue(event.target.value)}>
            <option value="">{v4("sdrBlankWick")}</option>
            <option value="5">{v4("sdrWick5")}</option>
            <option value="15">{v4("sdrWick15")}</option>
            <option value="45">{v4("sdrWick45")}</option>
          </select>
          <select className="c4-select" aria-label={v4("sdrStay")} value={stay} disabled={viewer} onChange={(event) => setStay(event.target.value)}>
            <option value="">{v4("sdrResting")}</option>
            <option value="2">2</option>
            <option value="4">4</option>
            <option value="8">8</option>
          </select>
          <input className="c4-field" aria-label={v4("sdrTag")} value={tag} disabled={viewer} onChange={(event) => setTag(event.target.value)} />
          <button type="submit" className="c4-btn c4-btn-hot" disabled={viewer}>{v4("sdrSave")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetDrawers())}>{v4("sdrReset")}</button>
        </form>
        <div className="c4-sdr-tools">
          <input ref={searchRef} className="c4-field" aria-label={v4("sdrSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
          <input className="c4-field" aria-label={v4("sdrDesk")} inputMode="numeric" value={deskShelf} onChange={(event) => setDeskShelf(event.target.value)} />
          <input className="c4-field" aria-label={v4("sdrRoster")} value={roster} disabled={viewer} onChange={(event) => setRoster(event.target.value)} />
          <select className="c4-select" aria-label={v4("sdrTrayOpen")} value={tray} onChange={(event) => setTray(event.target.value as DrawerTray)}>
            <option value="open">{v4("sdrTrayOpen")}</option>
            <option value="held">{v4("sdrTrayHeld")}</option>
            <option value="archived">{v4("sdrTrayArchived")}</option>
          </select>
          <select className="c4-select" aria-label={v4("sdrSexton")} value={sextonOn} onChange={(event) => setSextonFilter(event.target.value)}>
            <option value="all">{v4("sdrAll")}</option>
            <option value="blank">{v4("sdrBlank")}</option>
            {sextons.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("sdrPigment")} value={pigmentOn} onChange={(event) => setPigmentFilter(event.target.value)}>
            <option value="all">{v4("sdrAll")}</option>
            <option value="blank">{v4("sdrBlankPigment")}</option>
            {INKS.map((item) => <option key={item} value={item}>{pigmentLabel(v4, item)}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("sdrPace")} value={paceOn} onChange={(event) => setPaceFilter(event.target.value)}>
            <option value="all">{v4("sdrAll")}</option>
            <option value="blank">{v4("sdrBlankPace")}</option>
            {GAITS.map((item) => <option key={item} value={item}>{paceLabel(v4, item)}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("sdrShelf")} value={shelfOn} onChange={(event) => setShelfFilter(event.target.value)}>
            <option value="all">{v4("sdrAll")}</option>
            <option value="blank">{v4("sdrBlank")}</option>
            <option value="early">{v4("sdrEarly")}</option>
            <option value="mid">{v4("sdrMid")}</option>
            <option value="late">{v4("sdrLateBand")}</option>
            <option value="peak">{v4("sdrPeakPick")}</option>
            <option value="quiet">{v4("sdrQuiet")}</option>
            {["1", "2", "3", "4", "5", "6", "7"].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("sdrWick")} value={wickOn} onChange={(event) => setWickFilter(event.target.value)}>
            <option value="all">{v4("sdrAll")}</option>
            <option value="blank">{v4("sdrBlankWick")}</option>
            <option value="5">5</option>
            <option value="15">15</option>
            <option value="45">45</option>
          </select>
          <select className="c4-select" aria-label={v4("sdrStay")} value={stayOn} onChange={(event) => setStayFilter(event.target.value)}>
            <option value="all">{v4("sdrAll")}</option>
            <option value="blank">{v4("sdrResting")}</option>
            <option value="2">2</option>
            <option value="4">4</option>
            <option value="8">8</option>
          </select>
          <button type="button" className="c4-chip" data-on={flareOnly ? "1" : "0"} onClick={() => setFlareOnly((on) => !on)}>{v4("sdrRush")}</button>
          <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((on) => !on)}>{v4("sdrHouseShare")}</button>
          <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((on) => !on)}>{v4("sdrQuiet")}</button>
          <button type="button" className="c4-chip" data-on={restingOnly ? "1" : "0"} onClick={() => setRestingOnly((on) => !on)}>{v4("sdrResting")}</button>
          <button type="button" className="c4-chip" data-on={order === "sexton" ? "1" : "0"} onClick={() => setOrder((mode) => (mode === "shelf" ? "sexton" : "shelf"))}>{order === "sexton" ? v4("sdrSortSexton") : v4("sdrSortShelf")}</button>
          <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "airy" ? "tight" : "airy")}>{density === "tight" ? v4("sdrDensityTight") : v4("sdrDensityAiry")}</button>
          <button type="button" className="c4-chip" data-on={board === "index" ? "1" : "0"} onClick={() => setBoard((current) => (current === "hall" ? "index" : "hall"))}>{board === "index" ? v4("sdrBoardIndex") : v4("sdrBoardHall")}</button>
        </div>
        <form className="c4-sdr-views" onSubmit={(event) => {
          event.preventDefault();
          if (viewer) return;
          storeViews(addDrawerView(views, {
            id: `view-${Date.now()}`,
            name: viewName,
            tray,
            query,
            sexton: sextonOn,
            pigment: pigmentOn,
            pace: paceOn,
            shelf: shelfOn,
            wick: wickOn,
            stay: stayOn,
          }));
          setViewName("");
        }}>
          <input className="c4-field" aria-label={v4("sdrViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
          <button type="submit" className="c4-btn" disabled={viewer}>{v4("sdrSaveView")}</button>
          {views.map((view) => (
            <span key={view.id}>
              <button type="button" className="c4-chip" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropDrawerView(views, view.id))}>{v4("sdrDropView")}</button>
            </span>
          ))}
        </form>
        <div className="c4-sdr-bulk">
          <select className="c4-select" aria-label={v4("sdrBulkPigment")} value={movePigment} disabled={viewer} onChange={(event) => setMovePigment(event.target.value)}>
            {INKS.map((item) => <option key={item} value={item}>{pigmentLabel(v4, item)}</option>)}
          </select>
          <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkDrawerPigment(panels, picked, movePigment))}>{v4("sdrBulkPigment")}</button>
          <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkDrawerPin(panels, picked, true))}>{v4("sdrBulkPin")}</button>
          <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkDrawerArchive(panels, picked, true))}>{v4("sdrBulkArchive")}</button>
          <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkDrawerPace(panels, picked, "flare"))}>{v4("sdrBulkPace")}</button>
          <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkDrawerTag(panels, picked, "a"))}>{v4("sdrBulkTag")}</button>
          <button type="button" className="c4-btn" onClick={() => download("sacristy-drawers.csv", drawersCsv(panels, deskShelf))}>{v4("sdrCsv")}</button>
        </div>
        <ol className="c4-sdr-list" data-board={board}>
          {rows.map((panel, index) => {
            const on = index === focus && board === "hall";
            return (
              <li key={panel.id} data-focus={on ? "1" : "0"} data-boss={panel.boss ? "1" : "0"} data-peak={peakShelf(panel.shelf) ? "1" : "0"} data-quiet={quietShelf(panel.shelf) ? "1" : "0"} data-cooling={coolingDrawer(panel) ? "1" : "0"}>
                <label className="c4-row">
                  <input type="checkbox" checked={picked.includes(panel.id)} disabled={viewer} onChange={() => setPicked((ids) => ids.includes(panel.id) ? ids.filter((id) => id !== panel.id) : [...ids, panel.id])} />
                  {editing === panel.id ? (
                    <input className="c4-field" aria-label={v4("sdrEdit")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} onBlur={() => { if (!viewer) store(editDrawer(panels, panel.id, draft)); setEditing(""); }} />
                  ) : (
                    <button type="button" className="c4-sdr-title" onClick={() => { setFocus(index); setEditing(panel.id); setDraft(panel.title); setNoteDraft(panel.note); }}>{panel.title}</button>
                  )}
                </label>
                <input className="c4-field" aria-label={v4("sdrEditNote")} value={editing === `${panel.id}-note` ? noteDraft : panel.note} disabled={viewer} onFocus={() => { setEditing(`${panel.id}-note`); setNoteDraft(panel.note); }} onChange={(event) => setNoteDraft(event.target.value)} onBlur={() => { if (!viewer) store(editDrawerNote(panels, panel.id, noteDraft)); setEditing(""); }} />
                <span>{panel.sexton || v4("sdrBlankSexton")}</span>
                <span>{panel.shelf ?? v4("sdrBlank")}</span>
                <span>{pigmentLabel(v4, panel.pigment)}</span>
                <span>{paceLabel(v4, panel.pace)}</span>
                <span>{wickLabel(v4, panel.wick)}</span>
                <span>{panel.stay}</span>
                <span>{panel.tags.join(" ")}</span>
                <span>{gapLabel(v4, panel.shelf, deskShelf)}</span>
                <span>{auditLabel(v4, panel.audit)}</span>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDrawerPin(panels, panel.id, !panel.pinned))}>{panel.pinned ? v4("sdrUnpin") : v4("sdrPin")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(snoozeDrawer(panels, panel.id))}>{v4("sdrWick")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDrawerHold(panels, panel.id, !panel.held))}>{panel.held ? v4("sdrResume") : v4("sdrHold")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cyclePace(panels, panel.id))}>{v4("sdrPace")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDrawerBoss(panels, panel.id, !panel.boss))}>{panel.boss ? v4("sdrUnboss") : v4("sdrBoss")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDrawerArchive(panels, panel.id, !panel.archived))}>{panel.archived ? v4("sdrRestore") : v4("sdrArchive")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addDrawerTag(panels, panel.id, "b"))}>{v4("sdrTag")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDrawerStay(panels, panel.id, panel.stay === 8 ? "2" : panel.stay === 4 ? "8" : "4"))}>{v4("sdrStay")}</button>
                <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(drawerCopy(panel, deskShelf)); setCopied(panel.id); }}>{copied === panel.id ? v4("sdrCopied") : v4("sdrCopy")}</button>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

export function AntiphonMarks({ base, v4 }: { base: string; v4: V4 }) {
  const tickets = useJson<{ tickets?: TicketRow[] }>("/api/admin/tickets?take=40");
  const docs = useJson<{ documents?: DocRow[] }>("/api/admin/documents?status=PENDING&take=20");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("all");
  const [tone, setTone] = useState("all");
  const [review, setReview] = useState<AntiphonReview>("all");
  const [shape, setShape] = useState<AntiphonShape>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<GlanceRow[]>(() => {
    const ticketRows = (tickets.data?.tickets || []).map((row, index) => ({
      id: row.id || `ticket-${index}`,
      label: textField(row.customer),
      note: {
        customer: textField(row.customer),
        kind: textField(row.kind),
        status: textField(row.status),
      } satisfies AntiphonValue,
    }));
    const docRows = (docs.data?.documents || []).map((row, index) => ({
      id: row.id ? `doc-${row.id}` : `doc-${index}`,
      label: textField(row.trader) || textField(row.name) || textField(row.docType),
      note: {
        customer: textField(row.trader) || textField(row.name),
        kind: "KYC",
        status: textField(row.status),
      } satisfies AntiphonValue,
    }));
    return [...ticketRows, ...docRows];
  }, [tickets.data?.tickets, docs.data?.documents]);
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
    const present = presentAntiphonLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenAntiphons(readJson(ANT_KEY, []), present);
    const nextReviewed = readReviewedAntiphons(readJson(ANT_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(ANT_KEY, nextHidden);
    writeJson(ANT_REVIEW_KEY, nextReviewed);
  }, [rows]);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setQuery("");
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const present = presentAntiphonLanes(rows);
  const lanes = visibleAntiphonLanes(present, hidden, showHidden);
  const laneOn = activeAntiphonLane(lane, present);
  const toneOn = activeAntiphonTone(tone);
  const shown = visibleAntiphons(rows, antiphonLaneArg(laneOn), antiphonToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = antiphonState(row.note);
      const token = state === "set" ? antiphonLane(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return lanes.includes(token);
    });
  const lead = leadingAntiphon(rows);
  const toneLead = leadingAntiphonTone(rows);
  const shared = sharedAntiphonCount(rows);
  const stitched = stitchedAntiphonCount(rows);
  const bars = antiphonLanes(rows).filter((line) => line.lane);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  const known = rows.filter((row) => antiphonState(row.note) === "set").length;
  const failed = tickets.error || docs.error;
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(ANT_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedAntiphons(next, ids);
    setReviewed(saved);
    writeJson(ANT_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-ant" aria-label={v4("antTitle")} data-antiphons="1" data-docs={docs.data?.documents?.length ? "1" : "0"} data-role={role} data-keyed={stitched ? "1" : "0"}>
      <div className="c4-ant-sheet">
        <header className="c4-ant-mast">
          <p className="c4-ant-plate" data-logo="mono">{v4("antLogo")}</p>
          <div>
            <p className="c4-ant-kicker">{v4("antSub")}</p>
            <h2 className="c4-title">{v4("antTitle")}</h2>
          </div>
        </header>
        <p className="c4-ant-time">{v4("antKept")}</p>
        <div className="c4-ant-body">
          <p className="c4-ant-rules">{v4("antHint")}</p>
          <p className="c4-meta">{v4("antEscape")}</p>
          {viewer && <p className="c4-ant-notice" data-viewer="1">{v4("antViewer")}</p>}
          {failed && <p className="c4-ant-empty" role="alert">{v4("antFailed")}</p>}
          {(tickets.loading || docs.loading) && <p className="c4-meta">{v4("antLoading")}</p>}
          {!tickets.loading && !docs.loading && !rows.length && <p className="c4-ant-empty">{v4("antEmpty")}</p>}
          {shared > 0 && <p className="c4-ant-notice" role="status">{v4("antNotice")} · {shared}</p>}
          <ol className="c4-ant-ledger" aria-label={v4("antKpi")}>
            <li><span>{v4("antSet")}</span><strong>{known}</strong></li>
            <li><span>{v4("antClear")}</span><strong>{rows.filter((row) => antiphonState(row.note) === "clear").length}</strong></li>
            <li><span>{v4("antStitch")}</span><strong>{stitched}</strong></li>
            <li><span>{v4("antWide")}</span><strong>{wideAntiphonCount(rows)}</strong></li>
            <li><span>{v4("antBright")}</span><strong>{brightAntiphonCount(rows)}</strong></li>
            <li><span>{v4("antMargin")}</span><strong>{marginCount(rows)}</strong></li>
            <li><span>{v4("antCipher")}</span><strong>{cipherCount(rows)}</strong></li>
            <li><span>{v4("antBell")}</span><strong>{bellCount(rows)}</strong></li>
            <li><span>{v4("antQuill")}</span><strong>{rows.filter((row) => antiphonLane(row.note) === "quill").length}</strong></li>
            <li><span>{v4("antShare")}</span><strong>{antiphonShare(stitched, Math.max(1, known))}%</strong></li>
          </ol>
          <p className="c4-meta">{v4("antLead")}: {laneLabel(v4, lead)} · {v4("antToneLead")}: {toneLabel(v4, toneLead)}</p>
          <ol className="c4-ant-index" aria-label={v4("antKpi")}>
            {bars.map((bar) => (
              <li key={bar.lane} data-tone={bar.lane === "margin" ? "gold" : bar.lane === "bell" ? "ink" : "ivory"}>
                <span>{laneLabel(v4, bar.lane)}</span>
                <b style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
                <em>{bar.count}</em>
              </li>
            ))}
          </ol>
          <div className="c4-ant-tools">
            <input ref={searchRef} className="c4-field" aria-label={v4("antSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
            <select className="c4-select" aria-label={v4("antMargin")} value={laneOn} onChange={(event) => setLane(event.target.value)}>
              <option value="all">{v4("antAll")}</option>
              {present.map((name) => <option key={name} value={name}>{laneLabel(v4, name)}</option>)}
            </select>
            <select className="c4-select" aria-label={v4("antBright")} value={toneOn} onChange={(event) => setTone(event.target.value)}>
              <option value="all">{v4("antAll")}</option>
              <option value="bright">{v4("antBright")}</option>
              <option value="even">{v4("antEven")}</option>
              <option value="dim">{v4("antDim")}</option>
              <option value="hush">{v4("antHush")}</option>
              <option value="mist">{v4("antMist")}</option>
            </select>
            <select className="c4-select" aria-label={v4("antReviewed")} value={review} onChange={(event) => setReview(event.target.value as AntiphonReview)}>
              <option value="all">{v4("antAll")}</option>
              <option value="reviewed">{v4("antReviewed")}</option>
              <option value="fresh">{v4("antFresh")}</option>
            </select>
            <select className="c4-select" aria-label={v4("antShapeAll")} value={shape} onChange={(event) => setShape(event.target.value as AntiphonShape)}>
              <option value="all">{v4("antShapeAll")}</option>
              <option value="stitch">{v4("antShapeStitch")}</option>
              <option value="wide">{v4("antShapeWide")}</option>
              <option value="margin">{v4("antShapeMargin")}</option>
              <option value="cipher">{v4("antShapeCipher")}</option>
              <option value="quill">{v4("antQuill")}</option>
            </select>
            <button type="button" className="c4-btn" onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("antHide") : v4("antShow")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkAntiphonReview(reviewed, shown.map((row) => row.id), true))}>{v4("antBulkReview")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkAntiphonReview(reviewed, shown.map((row) => row.id), false))}>{v4("antBulkClear")}</button>
            <button type="button" className="c4-btn" onClick={() => download("antiphon-lanes.csv", antiphonsCsv(rows))}>{v4("antCsv")}</button>
            <button type="button" className="c4-btn" onClick={() => download("antiphon-rows.csv", antiphonRowsCsv(rows, reviewed))}>{v4("antRowCsv")}</button>
            <Link href={crmv4Href(base, "support")}>{v4("antLogs")}</Link>
          </div>
          <ul className="c4-ant-lanes">
            {LANES.map((name) => (
              <li key={name}>
                <button type="button" className="c4-chip" data-on={hidden.includes(name) ? "1" : "0"} disabled={viewer || !present.includes(name)} onClick={() => storeHidden(toggleAntiphon(hidden, name))}>{laneLabel(v4, name)}</button>
              </li>
            ))}
          </ul>
          <ol className="c4-ant-book">
            {shown.map((row) => (
              <li key={row.id} data-keyed={stitchedAntiphon(row.note) ? "1" : "0"} data-wide={wideAntiphon(row.note) ? "1" : "0"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"}>
                <Link href={crmv4Href(base, "support")}>{row.label}</Link>
                <span>{antiphonMark(row.note)}</span>
                <span>{laneLabel(v4, antiphonLane(row.note))}</span>
                <span>{toneLabel(v4, antiphonTone(row.note))}</span>
                <span>{v4("antStep")} {antiphonStep(row.note)}</span>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleAntiphonReview(reviewed, row.id))}>{v4("antReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(antiphonCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("antCopied") : v4("antCopy")}</button>
              </li>
            ))}
          </ol>
          <p className="c4-ant-rules">{v4("antRules")} · {v4("antStitchMark")}</p>
        </div>
      </div>
    </section>
  );
}
