"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  CAB_DENSITY_KEY,
  CAB_KEY,
  CAB_VIEW_KEY,
  WMK_KEY,
  WMK_REVIEW_KEY,
  activeShelf,
  activeClerk,
  activePace,
  activeWeave,
  activeRib,
  activeWatermarkLane,
  activeWatermarkTone,
  activeWick,
  addDrawer,
  addDrawerTag,
  addDrawerView,
  adjacentDrawerCount,
  shelfArg,
  shelfGap,
  shelfWidth,
  threadCount,
  giltWatermarkCount,
  bulkDrawerArchive,
  bulkDrawerPace,
  bulkDrawerWeave,
  bulkDrawerPin,
  bulkDrawerTag,
  bulkWatermarkReview,
  busiestClerk,
  stampCount,
  clashShelfCount,
  clerkArg,
  drawerClerks,
  drawerCopy,
  drawerCounts,
  drawerIndex,
  drawerWeaves,
  drawerShare,
  drawersCsv,
  coolingDrawer,
  coolingDrawers,
  cyclePace,
  dropDrawerView,
  editDrawer,
  editDrawerNote,
  fairClerk,
  paceArg,
  paceFocusedDrawer,
  sealFocusedDrawer,
  holdFocusedDrawer,
  houseWeave,
  weaveArg,
  lateDrawer,
  lateDrawerShare,
  leadingWatermark,
  leadingWatermarkTone,
  plainCount,
  matchedDrawers,
  moveDrawerFocus,
  nextDrawer,
  pairClerkCount,
  peakShelf,
  pinFocusedDrawer,
  presentWatermarkLanes,
  quietShelf,
  quietHallCount,
  readDrawerViews,
  readDrawers,
  readHiddenWatermarks,
  readReviewedWatermarks,
  reminderDrawers,
  resetDrawers,
  ribArg,
  ribLoad,
  watermarkCopy,
  watermarkLane,
  watermarkLaneArg,
  watermarkLanes,
  watermarkMark,
  watermarkRowsCsv,
  watermarkShare,
  watermarkState,
  watermarkStep,
  watermarkTone,
  watermarkToneArg,
  watermarksCsv,
  rowDensity,
  flareLoad,
  setDrawerArchive,
  setDrawerSeal,
  setDrawerHold,
  setDrawerPin,
  setDrawerRib,
  sharedWeaveCount,
  sharedWatermarkCount,
  snoozeDrawer,
  snoozeFocusedDrawer,
  sortDrawers,
  wickArg,
  wickClashCount,
  stitchedWatermark,
  stitchedWatermarkCount,
  suggestClerk,
  suggestWeave,
  suggestWick,
  toggleWatermark,
  toggleWatermarkReview,
  usedShelves,
  visibleDrawers,
  visibleWatermarkLanes,
  visibleWatermarks,
  wideWatermark,
  wideWatermarkCount,
  windowDrawers,
  type DrawerDensity,
  type CabinetDrawer,
  type DrawerSort,
  type DrawerTray,
  type DrawerView,
  type WatermarkReview,
  type WatermarkRow,
  type WatermarkShape,
  type WatermarkValue,
} from "@/lib/crmv4/round230";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type PartnerRow = {
  id?: string;
  name?: string | null;
  affiliateA?: string | null;
  documentsStatus?: string | null;
  accountType?: string | null;
};

type DocRow = {
  id?: string;
  name?: string | null;
  docType?: string | null;
  status?: string | null;
  trader?: string | null;
};

type GlanceRow = WatermarkRow & { id: string };

const WEAVES = ["graphite", "ivory", "champagne"] as const;
const PACES = ["still", "walk", "flare"] as const;
const LANES = ["plain", "thread", "ribbon", "fold", "stamp"] as const;

function weaveLabel(v4: V4, weave: string): string {
  if (weave === "graphite" || weave === "GRAPHITE") return v4("cabGraphite");
  if (weave === "ivory" || weave === "IVORY") return v4("cabIvory");
  if (weave === "champagne" || weave === "CHAMPAGNE") return v4("cabChampagne");
  return v4("cabBlankWeave");
}

function paceLabel(v4: V4, pace: string): string {
  if (pace === "still") return v4("cabHush");
  if (pace === "walk") return v4("cabStride");
  if (pace === "flare") return v4("cabRush");
  return v4("cabBlankPace");
}

function wickLabel(v4: V4, wick: number | null): string {
  if (wick === 5) return v4("cabWick5");
  if (wick === 15) return v4("cabWick15");
  if (wick === 45) return v4("cabWick45");
  return v4("cabBlankWick");
}

function laneLabel(v4: V4, name: string): string {
  if (name === "plain") return v4("wmkPlain");
  if (name === "thread") return v4("wmkThread");
  if (name === "ribbon") return v4("wmkRibbon");
  if (name === "fold") return v4("wmkFold");
  if (name === "stamp") return v4("wmkStamp");
  if (name === "blank") return v4("wmkClear");
  return v4("wmkUnmarked");
}

function toneLabel(v4: V4, name: string): string {
  if (name === "gilt") return v4("wmkGilt");
  if (name === "linen") return v4("wmkLinen");
  if (name === "pale") return v4("wmkPale");
  if (name === "ash") return v4("wmkAsh");
  if (name === "haze") return v4("wmkHaze");
  return v4("wmkUnmarked");
}

function auditLabel(v4: V4, audit: string): string {
  const key = {
    save: "cabAuditSave",
    edit: "cabAuditEdit",
    note: "cabAuditNote",
    pace: "cabAuditPace",
    pin: "cabAuditPin",
    unpin: "cabAuditUnpin",
    hold: "cabAuditHold",
    resume: "cabAuditResume",
    archive: "cabAuditArchive",
    open: "cabAuditOpen",
    weave: "cabAuditWeave",
    tag: "cabAuditTag",
    rib: "cabAuditRib",
    wick: "cabAuditWick",
    seal: "cabAuditSeal",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, shelf: number | null, desk: string): string {
  const gap = shelfGap(shelf, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("cabPast")} ${gap}`;
  if (gap < 0) return `${v4("cabAhead")} ${Math.abs(gap)}`;
  return v4("cabDue");
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

export function CabinetDrawers({ v4 }: { v4: V4 }) {
  const [panels, setPanels] = useState<CabinetDrawer[]>([]);
  const [views, setViews] = useState<DrawerView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [clerk, setClerk] = useState("");
  const [shelf, setShelf] = useState("");
  const [weave, setWeave] = useState("");
  const [pace, setPace] = useState("");
  const [wickValue, setWickValue] = useState("");
  const [rib, setRib] = useState("");
  const [tag, setTag] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<DrawerTray>("open");
  const [clerkFilter, setClerkFilter] = useState("all");
  const [weaveFilter, setWeaveFilter] = useState("all");
  const [paceFilter, setPaceFilter] = useState("all");
  const [shelfFilter, setShelfFilter] = useState("all");
  const [wickFilter, setWickFilter] = useState("all");
  const [ribFilter, setRibFilter] = useState("all");
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
  const [moveWeave, setMoveWeave] = useState("graphite");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<() => void>(() => {});
  const wickRef = useRef<() => void>(() => {});
  const holdRef = useRef<() => void>(() => {});
  const paceRef = useRef<() => void>(() => {});
  const sealRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readDrawers(readJson(CAB_KEY, []));
    const saved = readDrawerViews(readJson(CAB_VIEW_KEY, []));
    setPanels(next);
    setViews(saved);
    setDensity(rowDensity(readJson(CAB_DENSITY_KEY, "airy")));
    writeJson(CAB_KEY, next);
    writeJson(CAB_VIEW_KEY, saved);
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: CabinetDrawer[]) {
    const saved = readDrawers(next);
    setPanels(saved);
    writeJson(CAB_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((panel) => panel.id === id)));
  }
  function storeViews(next: DrawerView[]) {
    const saved = readDrawerViews(next);
    setViews(saved);
    writeJson(CAB_VIEW_KEY, saved);
  }
  function storeDensity(next: DrawerDensity) {
    setDensity(next);
    writeJson(CAB_DENSITY_KEY, next);
  }
  const clerks = drawerClerks(panels);
  const weaves = drawerWeaves(panels);
  const bars = WEAVES.map((item) => ({ weave: item.toUpperCase(), count: panels.filter((panel) => panel.weave === item.toUpperCase()).length })).filter((row) => row.count > 0);
  const clerkOn = activeClerk(clerkFilter, clerks);
  const weaveOn = activeWeave(weaveFilter, ["GRAPHITE", "IVORY", "CHAMPAGNE", ...weaves]);
  const paceOn = activePace(paceFilter, ["still", "walk", "flare"]);
  const shelfOn = activeShelf(shelfFilter);
  const wickOn = activeWick(wickFilter);
  const ribOn = activeRib(ribFilter);
  const pickedShelf = shelfArg(shelfOn);
  const shown = sortDrawers(visibleDrawers(
    panels,
    tray,
    query,
    clerkArg(clerkOn),
    weaveArg(weaveOn),
    paceArg(paceOn),
    pickedShelf.exact,
    pickedShelf.pick,
    wickArg(wickOn),
    ribArg(ribOn),
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
  const suggestedWeave = suggestWeave(panels);
  const suggestedName = suggestClerk(panels);
  const suggestedWick = suggestWick(panels);
  const fair = fairClerk(panels, roster);
  const busy = busiestClerk(panels);
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
  sealRef.current = () => {
    if (!viewer) store(sealFocusedDrawer(panels, shown.map((panel) => panel.id), focus));
  };
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setTitle("");
        setNote("");
        setClerk("");
        setShelf("");
        setWeave("");
        setPace("");
        setWickValue("");
        setRib("");
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
        sealRef.current();
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
    setClerk("");
    setShelf("");
    setWeave("");
    setPace("");
    setWickValue("");
    setRib("");
    setTag("");
    setQuery("");
    setEditing("");
  }
  function applyView(view: DrawerView) {
    setTray(view.tray);
    setQuery(view.query);
    setClerkFilter(view.clerk);
    setWeaveFilter(view.weave);
    setPaceFilter(view.pace);
    setShelfFilter(view.shelf);
    setWickFilter(view.wick);
    setRibFilter(view.rib);
  }
  const rows = board === "index" ? book : shown;
  const houseOpen = panels.filter((panel) => !panel.held && !panel.archived && houseWeave(panel.weave)).length;
  const openCount = Math.max(1, counts.open);
  return (
    <section className="c4-cab" aria-label={v4("cabTitle")} data-drawers="1" data-role={role} data-density={density}>
      <div className="c4-cab-sheet">
        <header className="c4-cab-mast">
          <p className="c4-cab-plate" data-logo="mono">{v4("cabLogo")}</p>
          <div>
            <p className="c4-cab-kicker">{v4("cabSub")}</p>
            <h2 className="c4-title">{v4("cabTitle")}</h2>
          </div>
        </header>
        <p className="c4-cab-time">{v4("cabLocal")}</p>
        <p className="c4-cab-rules">{v4("cabHint")}</p>
        <p className="c4-meta">{v4("cabNew")} {v4("cabSlash")} {v4("cabEscape")} {v4("cabKeys")} {v4("cabPinKey")} {v4("cabWickKey")} {v4("cabHoldKey")} {v4("cabPaceKey")} {v4("cabSealKey")} {v4("cabBoardKey")}</p>
        {viewer && <p className="c4-cab-notice" data-viewer="1">{v4("cabViewer")}</p>}
        {counts.peak > 0 && (
          <p className="c4-cab-notice" role="status">
            {v4("cabNotice")} · {counts.peak}
            <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("cabNoticeAll") : v4("cabNoticePeak")}</button>
          </p>
        )}
        {counts.late > 0 && <p className="c4-cab-notice" role="status">{v4("cabLateNotice")} · {counts.late}</p>}
        <ol className="c4-cab-kpis" aria-label={v4("cabKpi")}>
          <li><span>{v4("cabOpen")}</span><strong>{counts.open}</strong></li>
          <li><span>{v4("cabHeld")}</span><strong>{counts.held}</strong></li>
          <li><span>{v4("cabArchived")}</span><strong>{counts.archived}</strong></li>
          <li><span>{v4("cabPinned")}</span><strong>{counts.pinned}</strong></li>
          <li><span>{v4("cabPeak")}</span><strong>{counts.peak}</strong></li>
          <li><span>{v4("cabLate")}</span><strong>{counts.late}</strong></li>
          <li><span>{v4("cabSoon")}</span><strong>{counts.soon}</strong></li>
          <li><span>{v4("cabRib")}</span><strong>{counts.rib}</strong></li>
          <li><span>{v4("cabMatched")}</span><strong>{matched}</strong></li>
          <li><span>{v4("cabSeal")}</span><strong>{counts.seal}</strong></li>
          <li><span>{v4("cabCooling")}</span><strong>{counts.cooling}</strong></li>
        </ol>
        <div className="c4-cab-meter" aria-label={v4("cabLateShare")}>
          <span>{v4("cabHouseShare")} {drawerShare(houseOpen, openCount)}%</span>
          <span>{v4("cabLateShare")} {share}%</span>
          <i style={{ width: `${share}%` }} />
        </div>
        <ol className="c4-cab-bars" aria-label={v4("cabWeaves")}>
          {bars.map((bar) => (
            <li key={bar.weave}>
              <span>{weaveLabel(v4, bar.weave)}</span>
              <b style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
              <em>{bar.count}</em>
            </li>
          ))}
        </ol>
        {!panels.length && <p className="c4-cab-empty">{v4("cabEmpty")}</p>}
        <div className="c4-cab-suggest">
          <p>{v4("cabSuggestWeave")}: {weaveLabel(v4, suggestedWeave)}</p>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => setWeave(suggestedWeave.toLowerCase())}>{v4("cabUseWeave")}</button>
          <p>{suggestedName ? `${v4("cabSuggestClerk")}: ${suggestedName}` : v4("cabBlankClerk")}</p>
          <button type="button" className="c4-btn" disabled={viewer || !suggestedName} onClick={() => setClerk(suggestedName)}>{v4("cabUseClerk")}</button>
          <p>{v4("cabSuggestWick")}: {wickLabel(v4, suggestedWick)}</p>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => setWickValue(String(suggestedWick))}>{v4("cabUseWick")}</button>
          <p>{v4("cabAssign")}: {fair || v4("cabBlankClerk")}</p>
          <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setClerk(fair)}>{v4("cabUseClerk")}</button>
        </div>
        <ul className="c4-cab-facts">
          <li>{v4("cabShelves")}: {usedShelves(panels)}</li>
          <li>{clashes ? `${v4("cabClash")} ${clashes}` : v4("cabClashNone")}</li>
          <li>{wicks ? `${v4("cabWickClash")} ${wicks}` : v4("cabWickClashNone")}</li>
          <li>{neighbors ? `${v4("cabAdjacent")} ${neighbors}` : v4("cabAdjacentNone")}</li>
          <li>{pairClerkCount(panels) ? `${v4("cabPairs")} ${pairClerkCount(panels)}` : v4("cabPairsNone")}</li>
          <li>{sharedWeaveCount(panels) ? `${v4("cabSharedWeave")} ${sharedWeaveCount(panels)}` : v4("cabSharedWeaveNone")}</li>
          <li>{v4("cabRibLoad")}: {ribLoad(panels)}</li>
          <li>{v4("cabQuietHall")}: {quietHallCount(panels)}</li>
          <li>{v4("cabRushLoad")}: {flareLoad(panels)}</li>
          <li>{v4("cabShelfWidth")}: {shelfWidth(panels)}</li>
          <li>{nextTitle ? `${v4("cabNext")}: ${nextTitle}` : v4("cabNextNone")}</li>
          <li>{busy ? `${v4("cabBusiest")}: ${busy}` : v4("cabBusiestNone")}</li>
          <li>{v4("cabWindow")}: {windowRows.length}</li>
        </ul>
        <section className="c4-cab-reminders" aria-label={v4("cabReminders")}>
          <h3>{v4("cabReminders")}</h3>
          {!reminders.length && <p className="c4-cab-empty">{v4("cabReminderEmpty")}</p>}
          <ul>
            {reminders.map((panel) => (
              <li key={panel.id}>{panel.title} · {lateDrawer(panel, deskShelf) ? v4("cabLate") : v4("cabSoon")}</li>
            ))}
          </ul>
        </section>
        <section className="c4-cab-cooling" aria-label={v4("cabCooling")}>
          <h3>{v4("cabCooling")}</h3>
          {!cooling.length && <p className="c4-cab-empty">{v4("cabCoolingEmpty")}</p>}
          <ul>
            {cooling.map((panel) => (
              <li key={panel.id}>{panel.title} · {panel.shelf}</li>
            ))}
          </ul>
        </section>
        <form className="c4-cab-form" onSubmit={(event) => {
          event.preventDefault();
          if (viewer) return;
          store(addDrawer(panels, {
            id: `cab-${Date.now()}`,
            title,
            note,
            clerk,
            shelf,
            weave,
            pace,
            wick: wickValue,
            rib,
            tags: tag,
          }));
          clearDraft();
        }}>
          <input ref={titleRef} className="c4-field" aria-label={v4("cabTitle")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} />
          <input className="c4-field" aria-label={v4("cabNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} />
          <input className="c4-field" aria-label={v4("cabClerk")} value={clerk} disabled={viewer} onChange={(event) => setClerk(event.target.value)} />
          <input className="c4-field" aria-label={v4("cabShelf")} inputMode="numeric" value={shelf} disabled={viewer} onChange={(event) => setShelf(event.target.value)} />
          <select className="c4-select" aria-label={v4("cabWeave")} value={weave} disabled={viewer} onChange={(event) => setWeave(event.target.value)}>
            <option value="">{v4("cabBlankWeave")}</option>
            {WEAVES.map((item) => <option key={item} value={item}>{weaveLabel(v4, item)}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("cabPace")} value={pace} disabled={viewer} onChange={(event) => setPace(event.target.value)}>
            <option value="">{v4("cabBlankPace")}</option>
            {PACES.map((item) => <option key={item} value={item}>{paceLabel(v4, item)}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("cabWick")} value={wickValue} disabled={viewer} onChange={(event) => setWickValue(event.target.value)}>
            <option value="">{v4("cabBlankWick")}</option>
            <option value="5">{v4("cabWick5")}</option>
            <option value="15">{v4("cabWick15")}</option>
            <option value="45">{v4("cabWick45")}</option>
          </select>
          <select className="c4-select" aria-label={v4("cabRib")} value={rib} disabled={viewer} onChange={(event) => setRib(event.target.value)}>
            <option value="">{v4("cabResting")}</option>
            <option value="2">2</option>
            <option value="4">4</option>
            <option value="8">8</option>
          </select>
          <input className="c4-field" aria-label={v4("cabTag")} value={tag} disabled={viewer} onChange={(event) => setTag(event.target.value)} />
          <button type="submit" className="c4-btn c4-btn-hot" disabled={viewer}>{v4("cabSave")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetDrawers())}>{v4("cabReset")}</button>
        </form>
        <div className="c4-cab-tools">
          <input ref={searchRef} className="c4-field" aria-label={v4("cabSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
          <input className="c4-field" aria-label={v4("cabDesk")} inputMode="numeric" value={deskShelf} onChange={(event) => setDeskShelf(event.target.value)} />
          <input className="c4-field" aria-label={v4("cabRoster")} value={roster} disabled={viewer} onChange={(event) => setRoster(event.target.value)} />
          <select className="c4-select" aria-label={v4("cabTrayOpen")} value={tray} onChange={(event) => setTray(event.target.value as DrawerTray)}>
            <option value="open">{v4("cabTrayOpen")}</option>
            <option value="held">{v4("cabTrayHeld")}</option>
            <option value="archived">{v4("cabTrayArchived")}</option>
          </select>
          <select className="c4-select" aria-label={v4("cabClerk")} value={clerkOn} onChange={(event) => setClerkFilter(event.target.value)}>
            <option value="all">{v4("cabAll")}</option>
            <option value="blank">{v4("cabBlank")}</option>
            {clerks.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("cabWeave")} value={weaveOn} onChange={(event) => setWeaveFilter(event.target.value)}>
            <option value="all">{v4("cabAll")}</option>
            <option value="blank">{v4("cabBlankWeave")}</option>
            {WEAVES.map((item) => <option key={item} value={item}>{weaveLabel(v4, item)}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("cabPace")} value={paceOn} onChange={(event) => setPaceFilter(event.target.value)}>
            <option value="all">{v4("cabAll")}</option>
            <option value="blank">{v4("cabBlankPace")}</option>
            {PACES.map((item) => <option key={item} value={item}>{paceLabel(v4, item)}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("cabShelf")} value={shelfOn} onChange={(event) => setShelfFilter(event.target.value)}>
            <option value="all">{v4("cabAll")}</option>
            <option value="blank">{v4("cabBlank")}</option>
            <option value="early">{v4("cabEarly")}</option>
            <option value="mid">{v4("cabMid")}</option>
            <option value="late">{v4("cabLateBand")}</option>
            <option value="peak">{v4("cabPeakPick")}</option>
            <option value="quiet">{v4("cabQuiet")}</option>
            {["1", "2", "3", "4", "5", "6", "7"].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("cabWick")} value={wickOn} onChange={(event) => setWickFilter(event.target.value)}>
            <option value="all">{v4("cabAll")}</option>
            <option value="blank">{v4("cabBlankWick")}</option>
            <option value="5">5</option>
            <option value="15">15</option>
            <option value="45">45</option>
          </select>
          <select className="c4-select" aria-label={v4("cabRib")} value={ribOn} onChange={(event) => setRibFilter(event.target.value)}>
            <option value="all">{v4("cabAll")}</option>
            <option value="blank">{v4("cabResting")}</option>
            <option value="2">2</option>
            <option value="4">4</option>
            <option value="8">8</option>
          </select>
          <button type="button" className="c4-chip" data-on={flareOnly ? "1" : "0"} onClick={() => setFlareOnly((on) => !on)}>{v4("cabRush")}</button>
          <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((on) => !on)}>{v4("cabHouseShare")}</button>
          <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((on) => !on)}>{v4("cabQuiet")}</button>
          <button type="button" className="c4-chip" data-on={restingOnly ? "1" : "0"} onClick={() => setRestingOnly((on) => !on)}>{v4("cabResting")}</button>
          <button type="button" className="c4-chip" data-on={order === "clerk" ? "1" : "0"} onClick={() => setOrder((mode) => (mode === "shelf" ? "clerk" : "shelf"))}>{order === "clerk" ? v4("cabSortClerk") : v4("cabSortShelf")}</button>
          <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "airy" ? "tight" : "airy")}>{density === "tight" ? v4("cabDensityTight") : v4("cabDensityAiry")}</button>
          <button type="button" className="c4-chip" data-on={board === "index" ? "1" : "0"} onClick={() => setBoard((current) => (current === "hall" ? "index" : "hall"))}>{board === "index" ? v4("cabBoardIndex") : v4("cabBoardHall")}</button>
        </div>
        <form className="c4-cab-views" onSubmit={(event) => {
          event.preventDefault();
          if (viewer) return;
          storeViews(addDrawerView(views, {
            id: `view-${Date.now()}`,
            name: viewName,
            tray,
            query,
            clerk: clerkOn,
            weave: weaveOn,
            pace: paceOn,
            shelf: shelfOn,
            wick: wickOn,
            rib: ribOn,
          }));
          setViewName("");
        }}>
          <input className="c4-field" aria-label={v4("cabViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
          <button type="submit" className="c4-btn" disabled={viewer}>{v4("cabSaveView")}</button>
          {views.map((view) => (
            <span key={view.id}>
              <button type="button" className="c4-chip" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropDrawerView(views, view.id))}>{v4("cabDropView")}</button>
            </span>
          ))}
        </form>
        <div className="c4-cab-bulk">
          <select className="c4-select" aria-label={v4("cabBulkWeave")} value={moveWeave} disabled={viewer} onChange={(event) => setMoveWeave(event.target.value)}>
            {WEAVES.map((item) => <option key={item} value={item}>{weaveLabel(v4, item)}</option>)}
          </select>
          <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkDrawerWeave(panels, picked, moveWeave))}>{v4("cabBulkWeave")}</button>
          <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkDrawerPin(panels, picked, true))}>{v4("cabBulkPin")}</button>
          <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkDrawerArchive(panels, picked, true))}>{v4("cabBulkArchive")}</button>
          <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkDrawerPace(panels, picked, "flare"))}>{v4("cabBulkPace")}</button>
          <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkDrawerTag(panels, picked, "a"))}>{v4("cabBulkTag")}</button>
          <button type="button" className="c4-btn" onClick={() => download("cabinet-drawers.csv", drawersCsv(panels, deskShelf))}>{v4("cabCsv")}</button>
        </div>
        <ol className="c4-cab-list" data-board={board}>
          {rows.map((panel, index) => {
            const on = index === focus && board === "hall";
            return (
              <li key={panel.id} data-focus={on ? "1" : "0"} data-seal={panel.seal ? "1" : "0"} data-peak={peakShelf(panel.shelf) ? "1" : "0"} data-quiet={quietShelf(panel.shelf) ? "1" : "0"} data-cooling={coolingDrawer(panel) ? "1" : "0"}>
                <label className="c4-row">
                  <input type="checkbox" checked={picked.includes(panel.id)} disabled={viewer} onChange={() => setPicked((ids) => ids.includes(panel.id) ? ids.filter((id) => id !== panel.id) : [...ids, panel.id])} />
                  {editing === panel.id ? (
                    <input className="c4-field" aria-label={v4("cabEdit")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} onBlur={() => { if (!viewer) store(editDrawer(panels, panel.id, draft)); setEditing(""); }} />
                  ) : (
                    <button type="button" className="c4-cab-title" onClick={() => { setFocus(index); setEditing(panel.id); setDraft(panel.title); setNoteDraft(panel.note); }}>{panel.title}</button>
                  )}
                </label>
                <input className="c4-field" aria-label={v4("cabEditNote")} value={editing === `${panel.id}-note` ? noteDraft : panel.note} disabled={viewer} onFocus={() => { setEditing(`${panel.id}-note`); setNoteDraft(panel.note); }} onChange={(event) => setNoteDraft(event.target.value)} onBlur={() => { if (!viewer) store(editDrawerNote(panels, panel.id, noteDraft)); setEditing(""); }} />
                <span>{panel.clerk || v4("cabBlankClerk")}</span>
                <span>{panel.shelf ?? v4("cabBlank")}</span>
                <span>{weaveLabel(v4, panel.weave)}</span>
                <span>{paceLabel(v4, panel.pace)}</span>
                <span>{wickLabel(v4, panel.wick)}</span>
                <span>{panel.rib}</span>
                <span>{panel.tags.join(" ")}</span>
                <span>{gapLabel(v4, panel.shelf, deskShelf)}</span>
                <span>{auditLabel(v4, panel.audit)}</span>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDrawerPin(panels, panel.id, !panel.pinned))}>{panel.pinned ? v4("cabUnpin") : v4("cabPin")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(snoozeDrawer(panels, panel.id))}>{v4("cabWick")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDrawerHold(panels, panel.id, !panel.held))}>{panel.held ? v4("cabResume") : v4("cabHold")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cyclePace(panels, panel.id))}>{v4("cabPace")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDrawerSeal(panels, panel.id, !panel.seal))}>{panel.seal ? v4("cabUnseal") : v4("cabSeal")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDrawerArchive(panels, panel.id, !panel.archived))}>{panel.archived ? v4("cabRestore") : v4("cabArchive")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addDrawerTag(panels, panel.id, "b"))}>{v4("cabTag")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDrawerRib(panels, panel.id, panel.rib === 8 ? "2" : panel.rib === 4 ? "8" : "4"))}>{v4("cabRib")}</button>
                <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(drawerCopy(panel, deskShelf)); setCopied(panel.id); }}>{copied === panel.id ? v4("cabCopied") : v4("cabCopy")}</button>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function documentNote(row: DocRow): WatermarkValue {
  const customer = textField(row.trader) || textField(row.name) || textField(row.docType);
  const type = textField(row.docType).toUpperCase();
  const status = textField(row.status).toUpperCase();
  let kind = "KYC";
  if (type.includes("DEPOSIT") || type.includes("RECEIPT")) kind = "DEPOSIT";
  else if (type.includes("WITHDRAW") || type.includes("BANK")) kind = "WITHDRAW";
  else if (type.includes("MARGIN") || type.includes("PROOF") || type.includes("ADDRESS")) kind = "MARGIN";
  const known = status === "REJECTED" || status === "PENDING" || status === "APPROVED" ? status : "";
  return { customer, kind, status: known };
}

export function WatermarkMarks({ base, v4 }: { base: string; v4: V4 }) {
  const partners = useJson<{ users?: PartnerRow[] }>("/api/admin/users?view=table&take=40&meta=0&role=TRADER");
  const docs = useJson<{ documents?: DocRow[] }>("/api/admin/documents?status=PENDING&take=20");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("all");
  const [tone, setTone] = useState("all");
  const [review, setReview] = useState<WatermarkReview>("all");
  const [shape, setShape] = useState<WatermarkShape>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<GlanceRow[]>(() => {
    const docRows = (docs.data?.documents || []).map((row, index) => ({
      id: row.id ? `doc-${row.id}` : `doc-${index}`,
      label: textField(row.trader) || textField(row.name) || textField(row.docType),
      note: documentNote(row),
    }));
    const userRows = (partners.data?.users || []).map((row, index) => ({
      id: row.id || `person-${index}`,
      label: textField(row.name) || textField(row.affiliateA),
      note: {
        customer: textField(row.name) || textField(row.affiliateA),
        kind: "KYC",
        status: textField(row.documentsStatus),
      } satisfies WatermarkValue,
    }));
    return [...docRows, ...userRows];
  }, [partners.data?.users, docs.data?.documents]);
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
    const present = presentWatermarkLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenWatermarks(readJson(WMK_KEY, []), present);
    const nextReviewed = readReviewedWatermarks(readJson(WMK_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(WMK_KEY, nextHidden);
    writeJson(WMK_REVIEW_KEY, nextReviewed);
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
  const present = presentWatermarkLanes(rows);
  const lanes = visibleWatermarkLanes(present, hidden, showHidden);
  const laneOn = activeWatermarkLane(lane, present);
  const toneOn = activeWatermarkTone(tone);
  const shown = visibleWatermarks(rows, watermarkLaneArg(laneOn), watermarkToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = watermarkState(row.note);
      const token = state === "set" ? watermarkLane(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return lanes.includes(token);
    });
  const lead = leadingWatermark(rows);
  const toneLead = leadingWatermarkTone(rows);
  const shared = sharedWatermarkCount(rows);
  const stitched = stitchedWatermarkCount(rows);
  const bars = watermarkLanes(rows).filter((line) => line.lane);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  const known = rows.filter((row) => watermarkState(row.note) === "set").length;
  const failed = partners.error || docs.error;
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(WMK_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedWatermarks(next, ids);
    setReviewed(saved);
    writeJson(WMK_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-wmk" aria-label={v4("wmkTitle")} data-watermarks="1" data-partners={partners.data?.users?.length ? "1" : "0"} data-docs={docs.data?.documents?.length ? "1" : "0"} data-role={role} data-keyed={stitched ? "1" : "0"}>
      <div className="c4-wmk-sheet">
        <header className="c4-wmk-mast">
          <p className="c4-wmk-plate" data-logo="mono">{v4("wmkLogo")}</p>
          <div>
            <p className="c4-wmk-kicker">{v4("wmkSub")}</p>
            <h2 className="c4-title">{v4("wmkTitle")}</h2>
          </div>
        </header>
        <p className="c4-wmk-time">{v4("wmkKept")}</p>
        <div className="c4-wmk-body">
          <p className="c4-wmk-rules">{v4("wmkHint")}</p>
          <p className="c4-meta">{v4("wmkEscape")}</p>
          {viewer && <p className="c4-wmk-notice" data-viewer="1">{v4("wmkViewer")}</p>}
          {failed && <p className="c4-wmk-empty" role="alert">{v4("wmkFailed")}</p>}
          {(partners.loading || docs.loading) && <p className="c4-meta">{v4("wmkLoading")}</p>}
          {!partners.loading && !docs.loading && !rows.length && <p className="c4-wmk-empty">{v4("wmkEmpty")}</p>}
          {shared > 0 && <p className="c4-wmk-notice" role="status">{v4("wmkNotice")} · {shared}</p>}
          <ol className="c4-wmk-counts" aria-label={v4("wmkKpi")}>
            <li><span>{v4("wmkSet")}</span><strong>{known}</strong></li>
            <li><span>{v4("wmkClear")}</span><strong>{rows.filter((row) => watermarkState(row.note) === "clear").length}</strong></li>
            <li><span>{v4("wmkStitch")}</span><strong>{stitched}</strong></li>
            <li><span>{v4("wmkWide")}</span><strong>{wideWatermarkCount(rows)}</strong></li>
            <li><span>{v4("wmkGilt")}</span><strong>{giltWatermarkCount(rows)}</strong></li>
            <li><span>{v4("wmkPlain")}</span><strong>{plainCount(rows)}</strong></li>
            <li><span>{v4("wmkStamp")}</span><strong>{stampCount(rows)}</strong></li>
            <li><span>{v4("wmkThread")}</span><strong>{threadCount(rows)}</strong></li>
            <li><span>{v4("wmkRibbon")}</span><strong>{rows.filter((row) => watermarkLane(row.note) === "ribbon").length}</strong></li>
            <li><span>{v4("wmkShare")}</span><strong>{watermarkShare(stitched, Math.max(1, known))}%</strong></li>
          </ol>
          <p className="c4-meta">{v4("wmkLead")}: {laneLabel(v4, lead)} · {v4("wmkToneLead")}: {toneLabel(v4, toneLead)}</p>
          <ol className="c4-wmk-index" aria-label={v4("wmkKpi")}>
            {bars.map((bar) => (
              <li key={bar.lane} data-tone={bar.lane === "plain" ? "gold" : bar.lane === "thread" ? "ink" : bar.lane === "ribbon" ? "ivory" : "mist"}>
                <span>{laneLabel(v4, bar.lane)}</span>
                <b style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
                <em>{bar.count}</em>
              </li>
            ))}
          </ol>
          <div className="c4-wmk-tools">
            <input ref={searchRef} className="c4-field" aria-label={v4("wmkSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
            <select className="c4-select" aria-label={v4("wmkPlain")} value={laneOn} onChange={(event) => setLane(event.target.value)}>
              <option value="all">{v4("wmkAll")}</option>
              {present.map((name) => <option key={name} value={name}>{laneLabel(v4, name)}</option>)}
            </select>
            <select className="c4-select" aria-label={v4("wmkGilt")} value={toneOn} onChange={(event) => setTone(event.target.value)}>
              <option value="all">{v4("wmkAll")}</option>
              <option value="gilt">{v4("wmkGilt")}</option>
              <option value="linen">{v4("wmkLinen")}</option>
              <option value="pale">{v4("wmkPale")}</option>
              <option value="ash">{v4("wmkAsh")}</option>
              <option value="haze">{v4("wmkHaze")}</option>
            </select>
            <select className="c4-select" aria-label={v4("wmkReviewed")} value={review} onChange={(event) => setReview(event.target.value as WatermarkReview)}>
              <option value="all">{v4("wmkAll")}</option>
              <option value="reviewed">{v4("wmkReviewed")}</option>
              <option value="fresh">{v4("wmkFresh")}</option>
            </select>
            <select className="c4-select" aria-label={v4("wmkShapeAll")} value={shape} onChange={(event) => setShape(event.target.value as WatermarkShape)}>
              <option value="all">{v4("wmkShapeAll")}</option>
              <option value="stitch">{v4("wmkShapeStitch")}</option>
              <option value="wide">{v4("wmkShapeWide")}</option>
              <option value="plain">{v4("wmkShapePlain")}</option>
              <option value="stamp">{v4("wmkShapeStamp")}</option>
              <option value="ribbon">{v4("wmkRibbon")}</option>
            </select>
            <button type="button" className="c4-btn" onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("wmkHide") : v4("wmkShow")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkWatermarkReview(reviewed, shown.map((row) => row.id), true))}>{v4("wmkBulkReview")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkWatermarkReview(reviewed, shown.map((row) => row.id), false))}>{v4("wmkBulkClear")}</button>
            <button type="button" className="c4-btn" onClick={() => download("watermark-lanes.csv", watermarksCsv(rows))}>{v4("wmkCsv")}</button>
            <button type="button" className="c4-btn" onClick={() => download("watermark-rows.csv", watermarkRowsCsv(rows, reviewed))}>{v4("wmkRowCsv")}</button>
            <Link href={crmv4Href(base, "gallery")}>{v4("wmkLogs")}</Link>
          </div>
          <ul className="c4-wmk-lanes">
            {LANES.map((name) => (
              <li key={name}>
                <button type="button" className="c4-chip" data-on={hidden.includes(name) ? "1" : "0"} disabled={viewer || !present.includes(name)} onClick={() => storeHidden(toggleWatermark(hidden, name))}>{laneLabel(v4, name)}</button>
              </li>
            ))}
          </ul>
          <ol className="c4-wmk-book">
            {shown.map((row) => (
              <li key={row.id} data-keyed={stitchedWatermark(row.note) ? "1" : "0"} data-wide={wideWatermark(row.note) ? "1" : "0"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"}>
                <Link href={crmv4Href(base, "gallery")}>{row.label}</Link>
                <span>{watermarkMark(row.note)}</span>
                <span>{laneLabel(v4, watermarkLane(row.note))}</span>
                <span>{toneLabel(v4, watermarkTone(row.note))}</span>
                <span>{v4("wmkStep")} {watermarkStep(row.note)}</span>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleWatermarkReview(reviewed, row.id))}>{v4("wmkReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(watermarkCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("wmkCopied") : v4("wmkCopy")}</button>
              </li>
            ))}
          </ol>
          <p className="c4-wmk-rules">{v4("wmkRules")} · {v4("wmkStitchMark")}</p>
        </div>
      </div>
    </section>
  );
}
