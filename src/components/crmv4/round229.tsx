"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  AIN_DENSITY_KEY,
  AIN_KEY,
  AIN_VIEW_KEY,
  ESC_KEY,
  ESC_REVIEW_KEY,
  activeBay,
  activeUsher,
  activeGait,
  activeCloth,
  activeStay,
  activeEscutcheonLane,
  activeEscutcheonTone,
  activeLamp,
  addNiche,
  addNicheTag,
  addNicheView,
  adjacentNicheCount,
  bayArg,
  bayGap,
  bayWidth,
  bellCount,
  brightEscutcheonCount,
  bulkNicheArchive,
  bulkNicheGait,
  bulkNicheCloth,
  bulkNichePin,
  bulkNicheTag,
  bulkEscutcheonReview,
  busiestUsher,
  cipherCount,
  clashBayCount,
  usherArg,
  nicheUshers,
  nicheCopy,
  nicheCounts,
  nicheIndex,
  nicheCloths,
  nicheShare,
  nichesCsv,
  coolingNiche,
  coolingNiches,
  cycleGait,
  dropNicheView,
  editNiche,
  editNicheNote,
  fairUsher,
  gaitArg,
  gaitFocusedNiche,
  crestFocusedNiche,
  holdFocusedNiche,
  houseCloth,
  clothArg,
  lateNiche,
  lateNicheShare,
  leadingEscutcheon,
  leadingEscutcheonTone,
  marginCount,
  matchedNiches,
  moveNicheFocus,
  nextNiche,
  pairUsherCount,
  peakBay,
  pinFocusedNiche,
  presentEscutcheonLanes,
  quietBay,
  quietHallCount,
  readNicheViews,
  readNiches,
  readHiddenEscutcheons,
  readReviewedEscutcheons,
  reminderNiches,
  resetNiches,
  stayArg,
  stayLoad,
  escutcheonCopy,
  escutcheonLane,
  escutcheonLaneArg,
  escutcheonLanes,
  escutcheonMark,
  escutcheonRowsCsv,
  escutcheonShare,
  escutcheonState,
  escutcheonStep,
  escutcheonTone,
  escutcheonToneArg,
  escutcheonsCsv,
  rowDensity,
  flareLoad,
  setNicheArchive,
  setNicheCrest,
  setNicheHold,
  setNichePin,
  setNicheStay,
  sharedClothCount,
  sharedEscutcheonCount,
  snoozeNiche,
  snoozeFocusedNiche,
  sortNiches,
  lampArg,
  lampClashCount,
  stitchedEscutcheon,
  stitchedEscutcheonCount,
  suggestUsher,
  suggestCloth,
  suggestLamp,
  toggleEscutcheon,
  toggleEscutcheonReview,
  usedShelves,
  visibleNiches,
  visibleEscutcheonLanes,
  visibleEscutcheons,
  wideEscutcheon,
  wideEscutcheonCount,
  windowNiches,
  type NicheDensity,
  type AisleNiche,
  type NicheSort,
  type NicheTray,
  type NicheView,
  type EscutcheonReview,
  type EscutcheonRow,
  type EscutcheonShape,
  type EscutcheonValue,
} from "@/lib/crmv4/round229";
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

type GlanceRow = EscutcheonRow & { id: string };

const INKS = ["graphite", "ivory", "champagne"] as const;
const GAITS = ["still", "walk", "flare"] as const;
const LANES = ["margin", "bell", "quill", "cipher"] as const;

function clothLabel(v4: V4, cloth: string): string {
  if (cloth === "graphite" || cloth === "GRAPHITE") return v4("ainGraphite");
  if (cloth === "ivory" || cloth === "IVORY") return v4("ainIvory");
  if (cloth === "champagne" || cloth === "CHAMPAGNE") return v4("ainChampagne");
  return v4("ainBlankCloth");
}

function gaitLabel(v4: V4, gait: string): string {
  if (gait === "still") return v4("ainHush");
  if (gait === "walk") return v4("ainStride");
  if (gait === "flare") return v4("ainRush");
  return v4("ainBlankGait");
}

function lampLabel(v4: V4, lamp: number | null): string {
  if (lamp === 5) return v4("ainLamp5");
  if (lamp === 15) return v4("ainLamp15");
  if (lamp === 45) return v4("ainLamp45");
  return v4("ainBlankLamp");
}

function laneLabel(v4: V4, name: string): string {
  if (name === "margin") return v4("escMargin");
  if (name === "bell") return v4("escBell");
  if (name === "quill") return v4("escQuill");
  if (name === "cipher") return v4("escCipher");
  if (name === "blank") return v4("escClear");
  return v4("escUnmarked");
}

function toneLabel(v4: V4, name: string): string {
  if (name === "bright") return v4("escBright");
  if (name === "even") return v4("escEven");
  if (name === "dim") return v4("escDim");
  if (name === "hush") return v4("escHush");
  if (name === "mist") return v4("escMist");
  return v4("escUnmarked");
}

function auditLabel(v4: V4, audit: string): string {
  const key = {
    save: "ainAuditSave",
    edit: "ainAuditEdit",
    note: "ainAuditNote",
    gait: "ainAuditGait",
    pin: "ainAuditPin",
    unpin: "ainAuditUnpin",
    hold: "ainAuditHold",
    resume: "ainAuditResume",
    archive: "ainAuditArchive",
    open: "ainAuditOpen",
    cloth: "ainAuditCloth",
    tag: "ainAuditTag",
    stay: "ainAuditStay",
    lamp: "ainAuditLamp",
    crest: "ainAuditCrest",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, bay: number | null, desk: string): string {
  const gap = bayGap(bay, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("ainPast")} ${gap}`;
  if (gap < 0) return `${v4("ainAhead")} ${Math.abs(gap)}`;
  return v4("ainDue");
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

export function AisleNiches({ v4 }: { v4: V4 }) {
  const [panels, setPanels] = useState<AisleNiche[]>([]);
  const [views, setViews] = useState<NicheView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [usher, setUsher] = useState("");
  const [bay, setBay] = useState("");
  const [cloth, setCloth] = useState("");
  const [gait, setGait] = useState("");
  const [lampValue, setLampValue] = useState("");
  const [stay, setStay] = useState("");
  const [tag, setTag] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<NicheTray>("open");
  const [usherFilter, setUsherFilter] = useState("all");
  const [clothFilter, setClothFilter] = useState("all");
  const [gaitFilter, setGaitFilter] = useState("all");
  const [bayFilter, setBayFilter] = useState("all");
  const [lampFilter, setLampFilter] = useState("all");
  const [stayFilter, setStayFilter] = useState("all");
  const [flareOnly, setFlareOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [restingOnly, setRestingOnly] = useState(false);
  const [board, setBoard] = useState<"hall" | "index">("hall");
  const [order, setOrder] = useState<NicheSort>("bay");
  const [density, setDensity] = useState<NicheDensity>("airy");
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
  const lampRef = useRef<() => void>(() => {});
  const holdRef = useRef<() => void>(() => {});
  const gaitRef = useRef<() => void>(() => {});
  const crestRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readNiches(readJson(AIN_KEY, []));
    const saved = readNicheViews(readJson(AIN_VIEW_KEY, []));
    setPanels(next);
    setViews(saved);
    setDensity(rowDensity(readJson(AIN_DENSITY_KEY, "airy")));
    writeJson(AIN_KEY, next);
    writeJson(AIN_VIEW_KEY, saved);
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: AisleNiche[]) {
    const saved = readNiches(next);
    setPanels(saved);
    writeJson(AIN_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((panel) => panel.id === id)));
  }
  function storeViews(next: NicheView[]) {
    const saved = readNicheViews(next);
    setViews(saved);
    writeJson(AIN_VIEW_KEY, saved);
  }
  function storeDensity(next: NicheDensity) {
    setDensity(next);
    writeJson(AIN_DENSITY_KEY, next);
  }
  const ushers = nicheUshers(panels);
  const cloths = nicheCloths(panels);
  const bars = INKS.map((item) => ({ cloth: item.toUpperCase(), count: panels.filter((panel) => panel.cloth === item.toUpperCase()).length })).filter((row) => row.count > 0);
  const usherOn = activeUsher(usherFilter, ushers);
  const clothOn = activeCloth(clothFilter, ["GRAPHITE", "IVORY", "CHAMPAGNE", ...cloths]);
  const gaitOn = activeGait(gaitFilter, ["still", "walk", "flare"]);
  const bayOn = activeBay(bayFilter);
  const lampOn = activeLamp(lampFilter);
  const stayOn = activeStay(stayFilter);
  const pickedBay = bayArg(bayOn);
  const shown = sortNiches(visibleNiches(
    panels,
    tray,
    query,
    usherArg(usherOn),
    clothArg(clothOn),
    gaitArg(gaitOn),
    pickedBay.exact,
    pickedBay.pick,
    lampArg(lampOn),
    stayArg(stayOn),
    flareOnly,
    peakOnly,
    houseOnly,
    quietOnly,
    restingOnly,
  ), order);
  const book = nicheIndex(panels, query);
  const counts = nicheCounts(panels, deskBay);
  const share = lateNicheShare(panels, deskBay);
  const matched = matchedNiches(panels, deskBay);
  const clashes = clashBayCount(panels);
  const lamps = lampClashCount(panels);
  const neighbors = adjacentNicheCount(panels);
  const suggestedCloth = suggestCloth(panels);
  const suggestedName = suggestUsher(panels);
  const suggestedLamp = suggestLamp(panels);
  const fair = fairUsher(panels, roster);
  const busy = busiestUsher(panels);
  const reminders = reminderNiches(panels, deskBay);
  const cooling = coolingNiches(panels);
  const windowRows = windowNiches(panels, deskBay);
  const nextTitle = nextNiche(panels, deskBay);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  pinRef.current = () => {
    if (!viewer) store(pinFocusedNiche(panels, shown.map((panel) => panel.id), focus));
  };
  lampRef.current = () => {
    if (!viewer) store(snoozeFocusedNiche(panels, shown.map((panel) => panel.id), focus));
  };
  holdRef.current = () => {
    if (!viewer) store(holdFocusedNiche(panels, shown.map((panel) => panel.id), focus));
  };
  gaitRef.current = () => {
    if (!viewer) store(gaitFocusedNiche(panels, shown.map((panel) => panel.id), focus));
  };
  crestRef.current = () => {
    if (!viewer) store(crestFocusedNiche(panels, shown.map((panel) => panel.id), focus));
  };
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setTitle("");
        setNote("");
        setUsher("");
        setBay("");
        setCloth("");
        setGait("");
        setLampValue("");
        setStay("");
        setTag("");
        setQuery("");
        setEditing("");
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveNicheFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveNicheFocus(index, shown.length, -1));
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
        lampRef.current();
        return;
      }
      if (event.key === "y" || event.key === "Y") {
        event.preventDefault();
        holdRef.current();
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        gaitRef.current();
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        crestRef.current();
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
    setUsher("");
    setBay("");
    setCloth("");
    setGait("");
    setLampValue("");
    setStay("");
    setTag("");
    setQuery("");
    setEditing("");
  }
  function applyView(view: NicheView) {
    setTray(view.tray);
    setQuery(view.query);
    setUsherFilter(view.usher);
    setClothFilter(view.cloth);
    setGaitFilter(view.gait);
    setBayFilter(view.bay);
    setLampFilter(view.lamp);
    setStayFilter(view.stay);
  }
  const rows = board === "index" ? book : shown;
  const houseOpen = panels.filter((panel) => !panel.held && !panel.archived && houseCloth(panel.cloth)).length;
  const openCount = Math.max(1, counts.open);
  return (
    <section className="c4-ain" aria-label={v4("ainTitle")} data-niches="1" data-role={role} data-density={density}>
      <div className="c4-ain-sheet">
        <header className="c4-ain-mast">
          <p className="c4-ain-plate" data-logo="mono">{v4("ainLogo")}</p>
          <div>
            <p className="c4-ain-kicker">{v4("ainSub")}</p>
            <h2 className="c4-title">{v4("ainTitle")}</h2>
          </div>
        </header>
        <p className="c4-ain-time">{v4("ainLocal")}</p>
        <p className="c4-ain-rules">{v4("ainHint")}</p>
        <p className="c4-meta">{v4("ainNew")} {v4("ainSlash")} {v4("ainEscape")} {v4("ainKeys")} {v4("ainPinKey")} {v4("ainLampKey")} {v4("ainHoldKey")} {v4("ainGaitKey")} {v4("ainCrestKey")} {v4("ainBoardKey")}</p>
        {viewer && <p className="c4-ain-notice" data-viewer="1">{v4("ainViewer")}</p>}
        {counts.peak > 0 && (
          <p className="c4-ain-notice" role="status">
            {v4("ainNotice")} · {counts.peak}
            <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("ainNoticeAll") : v4("ainNoticePeak")}</button>
          </p>
        )}
        {counts.late > 0 && <p className="c4-ain-notice" role="status">{v4("ainLateNotice")} · {counts.late}</p>}
        <ol className="c4-ain-kpis" aria-label={v4("ainKpi")}>
          <li><span>{v4("ainOpen")}</span><strong>{counts.open}</strong></li>
          <li><span>{v4("ainHeld")}</span><strong>{counts.held}</strong></li>
          <li><span>{v4("ainArchived")}</span><strong>{counts.archived}</strong></li>
          <li><span>{v4("ainPinned")}</span><strong>{counts.pinned}</strong></li>
          <li><span>{v4("ainPeak")}</span><strong>{counts.peak}</strong></li>
          <li><span>{v4("ainLate")}</span><strong>{counts.late}</strong></li>
          <li><span>{v4("ainSoon")}</span><strong>{counts.soon}</strong></li>
          <li><span>{v4("ainStay")}</span><strong>{counts.stay}</strong></li>
          <li><span>{v4("ainMatched")}</span><strong>{matched}</strong></li>
          <li><span>{v4("ainCrest")}</span><strong>{counts.crest}</strong></li>
          <li><span>{v4("ainCooling")}</span><strong>{counts.cooling}</strong></li>
        </ol>
        <div className="c4-ain-meter" aria-label={v4("ainLateShare")}>
          <span>{v4("ainHouseShare")} {nicheShare(houseOpen, openCount)}%</span>
          <span>{v4("ainLateShare")} {share}%</span>
          <i style={{ width: `${share}%` }} />
        </div>
        <ol className="c4-ain-bars" aria-label={v4("ainCloths")}>
          {bars.map((bar) => (
            <li key={bar.cloth}>
              <span>{clothLabel(v4, bar.cloth)}</span>
              <b style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
              <em>{bar.count}</em>
            </li>
          ))}
        </ol>
        {!panels.length && <p className="c4-ain-empty">{v4("ainEmpty")}</p>}
        <div className="c4-ain-suggest">
          <p>{v4("ainSuggestCloth")}: {clothLabel(v4, suggestedCloth)}</p>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => setCloth(suggestedCloth.toLowerCase())}>{v4("ainUseCloth")}</button>
          <p>{suggestedName ? `${v4("ainSuggestUsher")}: ${suggestedName}` : v4("ainBlankUsher")}</p>
          <button type="button" className="c4-btn" disabled={viewer || !suggestedName} onClick={() => setUsher(suggestedName)}>{v4("ainUseUsher")}</button>
          <p>{v4("ainSuggestLamp")}: {lampLabel(v4, suggestedLamp)}</p>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => setLampValue(String(suggestedLamp))}>{v4("ainUseLamp")}</button>
          <p>{v4("ainAssign")}: {fair || v4("ainBlankUsher")}</p>
          <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setUsher(fair)}>{v4("ainUseUsher")}</button>
        </div>
        <ul className="c4-ain-facts">
          <li>{v4("ainBays")}: {usedShelves(panels)}</li>
          <li>{clashes ? `${v4("ainClash")} ${clashes}` : v4("ainClashNone")}</li>
          <li>{lamps ? `${v4("ainLampClash")} ${lamps}` : v4("ainLampClashNone")}</li>
          <li>{neighbors ? `${v4("ainAdjacent")} ${neighbors}` : v4("ainAdjacentNone")}</li>
          <li>{pairUsherCount(panels) ? `${v4("ainPairs")} ${pairUsherCount(panels)}` : v4("ainPairsNone")}</li>
          <li>{sharedClothCount(panels) ? `${v4("ainSharedCloth")} ${sharedClothCount(panels)}` : v4("ainSharedClothNone")}</li>
          <li>{v4("ainStayLoad")}: {stayLoad(panels)}</li>
          <li>{v4("ainQuietHall")}: {quietHallCount(panels)}</li>
          <li>{v4("ainRushLoad")}: {flareLoad(panels)}</li>
          <li>{v4("ainBayWidth")}: {bayWidth(panels)}</li>
          <li>{nextTitle ? `${v4("ainNext")}: ${nextTitle}` : v4("ainNextNone")}</li>
          <li>{busy ? `${v4("ainBusiest")}: ${busy}` : v4("ainBusiestNone")}</li>
          <li>{v4("ainWindow")}: {windowRows.length}</li>
        </ul>
        <section className="c4-ain-reminders" aria-label={v4("ainReminders")}>
          <h3>{v4("ainReminders")}</h3>
          {!reminders.length && <p className="c4-ain-empty">{v4("ainReminderEmpty")}</p>}
          <ul>
            {reminders.map((panel) => (
              <li key={panel.id}>{panel.title} · {lateNiche(panel, deskBay) ? v4("ainLate") : v4("ainSoon")}</li>
            ))}
          </ul>
        </section>
        <section className="c4-ain-cooling" aria-label={v4("ainCooling")}>
          <h3>{v4("ainCooling")}</h3>
          {!cooling.length && <p className="c4-ain-empty">{v4("ainCoolingEmpty")}</p>}
          <ul>
            {cooling.map((panel) => (
              <li key={panel.id}>{panel.title} · {panel.bay}</li>
            ))}
          </ul>
        </section>
        <form className="c4-ain-form" onSubmit={(event) => {
          event.preventDefault();
          if (viewer) return;
          store(addNiche(panels, {
            id: `ain-${Date.now()}`,
            title,
            note,
            usher,
            bay,
            cloth,
            gait,
            lamp: lampValue,
            stay,
            tags: tag,
          }));
          clearDraft();
        }}>
          <input ref={titleRef} className="c4-field" aria-label={v4("ainTitle")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} />
          <input className="c4-field" aria-label={v4("ainNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} />
          <input className="c4-field" aria-label={v4("ainUsher")} value={usher} disabled={viewer} onChange={(event) => setUsher(event.target.value)} />
          <input className="c4-field" aria-label={v4("ainBay")} inputMode="numeric" value={bay} disabled={viewer} onChange={(event) => setBay(event.target.value)} />
          <select className="c4-select" aria-label={v4("ainCloth")} value={cloth} disabled={viewer} onChange={(event) => setCloth(event.target.value)}>
            <option value="">{v4("ainBlankCloth")}</option>
            {INKS.map((item) => <option key={item} value={item}>{clothLabel(v4, item)}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("ainGait")} value={gait} disabled={viewer} onChange={(event) => setGait(event.target.value)}>
            <option value="">{v4("ainBlankGait")}</option>
            {GAITS.map((item) => <option key={item} value={item}>{gaitLabel(v4, item)}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("ainLamp")} value={lampValue} disabled={viewer} onChange={(event) => setLampValue(event.target.value)}>
            <option value="">{v4("ainBlankLamp")}</option>
            <option value="5">{v4("ainLamp5")}</option>
            <option value="15">{v4("ainLamp15")}</option>
            <option value="45">{v4("ainLamp45")}</option>
          </select>
          <select className="c4-select" aria-label={v4("ainStay")} value={stay} disabled={viewer} onChange={(event) => setStay(event.target.value)}>
            <option value="">{v4("ainResting")}</option>
            <option value="2">2</option>
            <option value="4">4</option>
            <option value="8">8</option>
          </select>
          <input className="c4-field" aria-label={v4("ainTag")} value={tag} disabled={viewer} onChange={(event) => setTag(event.target.value)} />
          <button type="submit" className="c4-btn c4-btn-hot" disabled={viewer}>{v4("ainSave")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetNiches())}>{v4("ainReset")}</button>
        </form>
        <div className="c4-ain-tools">
          <input ref={searchRef} className="c4-field" aria-label={v4("ainSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
          <input className="c4-field" aria-label={v4("ainDesk")} inputMode="numeric" value={deskBay} onChange={(event) => setDeskBay(event.target.value)} />
          <input className="c4-field" aria-label={v4("ainRoster")} value={roster} disabled={viewer} onChange={(event) => setRoster(event.target.value)} />
          <select className="c4-select" aria-label={v4("ainTrayOpen")} value={tray} onChange={(event) => setTray(event.target.value as NicheTray)}>
            <option value="open">{v4("ainTrayOpen")}</option>
            <option value="held">{v4("ainTrayHeld")}</option>
            <option value="archived">{v4("ainTrayArchived")}</option>
          </select>
          <select className="c4-select" aria-label={v4("ainUsher")} value={usherOn} onChange={(event) => setUsherFilter(event.target.value)}>
            <option value="all">{v4("ainAll")}</option>
            <option value="blank">{v4("ainBlank")}</option>
            {ushers.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("ainCloth")} value={clothOn} onChange={(event) => setClothFilter(event.target.value)}>
            <option value="all">{v4("ainAll")}</option>
            <option value="blank">{v4("ainBlankCloth")}</option>
            {INKS.map((item) => <option key={item} value={item}>{clothLabel(v4, item)}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("ainGait")} value={gaitOn} onChange={(event) => setGaitFilter(event.target.value)}>
            <option value="all">{v4("ainAll")}</option>
            <option value="blank">{v4("ainBlankGait")}</option>
            {GAITS.map((item) => <option key={item} value={item}>{gaitLabel(v4, item)}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("ainBay")} value={bayOn} onChange={(event) => setBayFilter(event.target.value)}>
            <option value="all">{v4("ainAll")}</option>
            <option value="blank">{v4("ainBlank")}</option>
            <option value="early">{v4("ainEarly")}</option>
            <option value="mid">{v4("ainMid")}</option>
            <option value="late">{v4("ainLateBand")}</option>
            <option value="peak">{v4("ainPeakPick")}</option>
            <option value="quiet">{v4("ainQuiet")}</option>
            {["1", "2", "3", "4", "5", "6", "7"].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("ainLamp")} value={lampOn} onChange={(event) => setLampFilter(event.target.value)}>
            <option value="all">{v4("ainAll")}</option>
            <option value="blank">{v4("ainBlankLamp")}</option>
            <option value="5">5</option>
            <option value="15">15</option>
            <option value="45">45</option>
          </select>
          <select className="c4-select" aria-label={v4("ainStay")} value={stayOn} onChange={(event) => setStayFilter(event.target.value)}>
            <option value="all">{v4("ainAll")}</option>
            <option value="blank">{v4("ainResting")}</option>
            <option value="2">2</option>
            <option value="4">4</option>
            <option value="8">8</option>
          </select>
          <button type="button" className="c4-chip" data-on={flareOnly ? "1" : "0"} onClick={() => setFlareOnly((on) => !on)}>{v4("ainRush")}</button>
          <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((on) => !on)}>{v4("ainHouseShare")}</button>
          <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((on) => !on)}>{v4("ainQuiet")}</button>
          <button type="button" className="c4-chip" data-on={restingOnly ? "1" : "0"} onClick={() => setRestingOnly((on) => !on)}>{v4("ainResting")}</button>
          <button type="button" className="c4-chip" data-on={order === "usher" ? "1" : "0"} onClick={() => setOrder((mode) => (mode === "bay" ? "usher" : "bay"))}>{order === "usher" ? v4("ainSortUsher") : v4("ainSortBay")}</button>
          <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "airy" ? "tight" : "airy")}>{density === "tight" ? v4("ainDensityTight") : v4("ainDensityAiry")}</button>
          <button type="button" className="c4-chip" data-on={board === "index" ? "1" : "0"} onClick={() => setBoard((current) => (current === "hall" ? "index" : "hall"))}>{board === "index" ? v4("ainBoardIndex") : v4("ainBoardHall")}</button>
        </div>
        <form className="c4-ain-views" onSubmit={(event) => {
          event.preventDefault();
          if (viewer) return;
          storeViews(addNicheView(views, {
            id: `view-${Date.now()}`,
            name: viewName,
            tray,
            query,
            usher: usherOn,
            cloth: clothOn,
            gait: gaitOn,
            bay: bayOn,
            lamp: lampOn,
            stay: stayOn,
          }));
          setViewName("");
        }}>
          <input className="c4-field" aria-label={v4("ainViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
          <button type="submit" className="c4-btn" disabled={viewer}>{v4("ainSaveView")}</button>
          {views.map((view) => (
            <span key={view.id}>
              <button type="button" className="c4-chip" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropNicheView(views, view.id))}>{v4("ainDropView")}</button>
            </span>
          ))}
        </form>
        <div className="c4-ain-bulk">
          <select className="c4-select" aria-label={v4("ainBulkCloth")} value={moveCloth} disabled={viewer} onChange={(event) => setMoveCloth(event.target.value)}>
            {INKS.map((item) => <option key={item} value={item}>{clothLabel(v4, item)}</option>)}
          </select>
          <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkNicheCloth(panels, picked, moveCloth))}>{v4("ainBulkCloth")}</button>
          <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkNichePin(panels, picked, true))}>{v4("ainBulkPin")}</button>
          <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkNicheArchive(panels, picked, true))}>{v4("ainBulkArchive")}</button>
          <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkNicheGait(panels, picked, "flare"))}>{v4("ainBulkGait")}</button>
          <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkNicheTag(panels, picked, "a"))}>{v4("ainBulkTag")}</button>
          <button type="button" className="c4-btn" onClick={() => download("aisle-niches.csv", nichesCsv(panels, deskBay))}>{v4("ainCsv")}</button>
        </div>
        <ol className="c4-ain-list" data-board={board}>
          {rows.map((panel, index) => {
            const on = index === focus && board === "hall";
            return (
              <li key={panel.id} data-focus={on ? "1" : "0"} data-crest={panel.crest ? "1" : "0"} data-peak={peakBay(panel.bay) ? "1" : "0"} data-quiet={quietBay(panel.bay) ? "1" : "0"} data-cooling={coolingNiche(panel) ? "1" : "0"}>
                <label className="c4-row">
                  <input type="checkbox" checked={picked.includes(panel.id)} disabled={viewer} onChange={() => setPicked((ids) => ids.includes(panel.id) ? ids.filter((id) => id !== panel.id) : [...ids, panel.id])} />
                  {editing === panel.id ? (
                    <input className="c4-field" aria-label={v4("ainEdit")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} onBlur={() => { if (!viewer) store(editNiche(panels, panel.id, draft)); setEditing(""); }} />
                  ) : (
                    <button type="button" className="c4-ain-title" onClick={() => { setFocus(index); setEditing(panel.id); setDraft(panel.title); setNoteDraft(panel.note); }}>{panel.title}</button>
                  )}
                </label>
                <input className="c4-field" aria-label={v4("ainEditNote")} value={editing === `${panel.id}-note` ? noteDraft : panel.note} disabled={viewer} onFocus={() => { setEditing(`${panel.id}-note`); setNoteDraft(panel.note); }} onChange={(event) => setNoteDraft(event.target.value)} onBlur={() => { if (!viewer) store(editNicheNote(panels, panel.id, noteDraft)); setEditing(""); }} />
                <span>{panel.usher || v4("ainBlankUsher")}</span>
                <span>{panel.bay ?? v4("ainBlank")}</span>
                <span>{clothLabel(v4, panel.cloth)}</span>
                <span>{gaitLabel(v4, panel.gait)}</span>
                <span>{lampLabel(v4, panel.lamp)}</span>
                <span>{panel.stay}</span>
                <span>{panel.tags.join(" ")}</span>
                <span>{gapLabel(v4, panel.bay, deskBay)}</span>
                <span>{auditLabel(v4, panel.audit)}</span>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setNichePin(panels, panel.id, !panel.pinned))}>{panel.pinned ? v4("ainUnpin") : v4("ainPin")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(snoozeNiche(panels, panel.id))}>{v4("ainLamp")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setNicheHold(panels, panel.id, !panel.held))}>{panel.held ? v4("ainResume") : v4("ainHold")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleGait(panels, panel.id))}>{v4("ainGait")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setNicheCrest(panels, panel.id, !panel.crest))}>{panel.crest ? v4("ainUncrest") : v4("ainCrest")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setNicheArchive(panels, panel.id, !panel.archived))}>{panel.archived ? v4("ainRestore") : v4("ainArchive")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addNicheTag(panels, panel.id, "b"))}>{v4("ainTag")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setNicheStay(panels, panel.id, panel.stay === 8 ? "2" : panel.stay === 4 ? "8" : "4"))}>{v4("ainStay")}</button>
                <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(nicheCopy(panel, deskBay)); setCopied(panel.id); }}>{copied === panel.id ? v4("ainCopied") : v4("ainCopy")}</button>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function partnerNote(row: PartnerRow): EscutcheonValue {
  const named = textField(row.affiliateA) || textField(row.name);
  const documents = textField(row.documentsStatus).toUpperCase();
  const account = textField(row.accountType).toUpperCase();
  let kind = "WITHDRAW";
  let status = "";
  if (!textField(row.affiliateA)) {
    kind = "MARGIN";
    status = documents === "REJECTED" || documents === "PENDING" || documents === "APPROVED" ? documents : "APPROVED";
  } else if (documents === "PENDING" || documents === "REJECTED") {
    kind = "KYC";
    status = documents;
  } else if (account === "IB" || account === "PARTNER") {
    kind = "DEPOSIT";
    status = "APPROVED";
  } else if (documents === "APPROVED") {
    status = "APPROVED";
  }
  return { customer: named, kind, status };
}

export function EscutcheonMarks({ base, v4 }: { base: string; v4: V4 }) {
  const partners = useJson<{ users?: PartnerRow[] }>("/api/admin/users?view=table&take=40&meta=0&role=TRADER");
  const docs = useJson<{ documents?: DocRow[] }>("/api/admin/documents?status=PENDING&take=20");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("all");
  const [tone, setTone] = useState("all");
  const [review, setReview] = useState<EscutcheonReview>("all");
  const [shape, setShape] = useState<EscutcheonShape>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<GlanceRow[]>(() => {
    const partnerRows = (partners.data?.users || []).map((row, index) => ({
      id: row.id || `partner-${index}`,
      label: textField(row.affiliateA) || textField(row.name),
      note: partnerNote(row),
    }));
    const docRows = (docs.data?.documents || []).map((row, index) => ({
      id: row.id ? `doc-${row.id}` : `doc-${index}`,
      label: textField(row.trader) || textField(row.name) || textField(row.docType),
      note: {
        customer: textField(row.trader) || textField(row.name),
        kind: "KYC",
        status: textField(row.status),
      } satisfies EscutcheonValue,
    }));
    return [...partnerRows, ...docRows];
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
    const present = presentEscutcheonLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenEscutcheons(readJson(ESC_KEY, []), present);
    const nextReviewed = readReviewedEscutcheons(readJson(ESC_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(ESC_KEY, nextHidden);
    writeJson(ESC_REVIEW_KEY, nextReviewed);
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
  const present = presentEscutcheonLanes(rows);
  const lanes = visibleEscutcheonLanes(present, hidden, showHidden);
  const laneOn = activeEscutcheonLane(lane, present);
  const toneOn = activeEscutcheonTone(tone);
  const shown = visibleEscutcheons(rows, escutcheonLaneArg(laneOn), escutcheonToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = escutcheonState(row.note);
      const token = state === "set" ? escutcheonLane(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return lanes.includes(token);
    });
  const lead = leadingEscutcheon(rows);
  const toneLead = leadingEscutcheonTone(rows);
  const shared = sharedEscutcheonCount(rows);
  const stitched = stitchedEscutcheonCount(rows);
  const bars = escutcheonLanes(rows).filter((line) => line.lane);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  const known = rows.filter((row) => escutcheonState(row.note) === "set").length;
  const failed = partners.error || docs.error;
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(ESC_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedEscutcheons(next, ids);
    setReviewed(saved);
    writeJson(ESC_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-esc" aria-label={v4("escTitle")} data-escutcheons="1" data-partners={partners.data?.users?.length ? "1" : "0"} data-docs={docs.data?.documents?.length ? "1" : "0"} data-role={role} data-keyed={stitched ? "1" : "0"}>
      <div className="c4-esc-sheet">
        <header className="c4-esc-mast">
          <p className="c4-esc-plate" data-logo="mono">{v4("escLogo")}</p>
          <div>
            <p className="c4-esc-kicker">{v4("escSub")}</p>
            <h2 className="c4-title">{v4("escTitle")}</h2>
          </div>
        </header>
        <p className="c4-esc-time">{v4("escKept")}</p>
        <div className="c4-esc-body">
          <p className="c4-esc-rules">{v4("escHint")}</p>
          <p className="c4-meta">{v4("escEscape")}</p>
          {viewer && <p className="c4-esc-notice" data-viewer="1">{v4("escViewer")}</p>}
          {failed && <p className="c4-esc-empty" role="alert">{v4("escFailed")}</p>}
          {(partners.loading || docs.loading) && <p className="c4-meta">{v4("escLoading")}</p>}
          {!partners.loading && !docs.loading && !rows.length && <p className="c4-esc-empty">{v4("escEmpty")}</p>}
          {shared > 0 && <p className="c4-esc-notice" role="status">{v4("escNotice")} · {shared}</p>}
          <ol className="c4-esc-counts" aria-label={v4("escKpi")}>
            <li><span>{v4("escSet")}</span><strong>{known}</strong></li>
            <li><span>{v4("escClear")}</span><strong>{rows.filter((row) => escutcheonState(row.note) === "clear").length}</strong></li>
            <li><span>{v4("escStitch")}</span><strong>{stitched}</strong></li>
            <li><span>{v4("escWide")}</span><strong>{wideEscutcheonCount(rows)}</strong></li>
            <li><span>{v4("escBright")}</span><strong>{brightEscutcheonCount(rows)}</strong></li>
            <li><span>{v4("escMargin")}</span><strong>{marginCount(rows)}</strong></li>
            <li><span>{v4("escCipher")}</span><strong>{cipherCount(rows)}</strong></li>
            <li><span>{v4("escBell")}</span><strong>{bellCount(rows)}</strong></li>
            <li><span>{v4("escQuill")}</span><strong>{rows.filter((row) => escutcheonLane(row.note) === "quill").length}</strong></li>
            <li><span>{v4("escShare")}</span><strong>{escutcheonShare(stitched, Math.max(1, known))}%</strong></li>
          </ol>
          <p className="c4-meta">{v4("escLead")}: {laneLabel(v4, lead)} · {v4("escToneLead")}: {toneLabel(v4, toneLead)}</p>
          <ol className="c4-esc-index" aria-label={v4("escKpi")}>
            {bars.map((bar) => (
              <li key={bar.lane} data-tone={bar.lane === "margin" ? "gold" : bar.lane === "bell" ? "ink" : "ivory"}>
                <span>{laneLabel(v4, bar.lane)}</span>
                <b style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
                <em>{bar.count}</em>
              </li>
            ))}
          </ol>
          <div className="c4-esc-tools">
            <input ref={searchRef} className="c4-field" aria-label={v4("escSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
            <select className="c4-select" aria-label={v4("escMargin")} value={laneOn} onChange={(event) => setLane(event.target.value)}>
              <option value="all">{v4("escAll")}</option>
              {present.map((name) => <option key={name} value={name}>{laneLabel(v4, name)}</option>)}
            </select>
            <select className="c4-select" aria-label={v4("escBright")} value={toneOn} onChange={(event) => setTone(event.target.value)}>
              <option value="all">{v4("escAll")}</option>
              <option value="bright">{v4("escBright")}</option>
              <option value="even">{v4("escEven")}</option>
              <option value="dim">{v4("escDim")}</option>
              <option value="hush">{v4("escHush")}</option>
              <option value="mist">{v4("escMist")}</option>
            </select>
            <select className="c4-select" aria-label={v4("escReviewed")} value={review} onChange={(event) => setReview(event.target.value as EscutcheonReview)}>
              <option value="all">{v4("escAll")}</option>
              <option value="reviewed">{v4("escReviewed")}</option>
              <option value="fresh">{v4("escFresh")}</option>
            </select>
            <select className="c4-select" aria-label={v4("escShapeAll")} value={shape} onChange={(event) => setShape(event.target.value as EscutcheonShape)}>
              <option value="all">{v4("escShapeAll")}</option>
              <option value="stitch">{v4("escShapeStitch")}</option>
              <option value="wide">{v4("escShapeWide")}</option>
              <option value="margin">{v4("escShapeMargin")}</option>
              <option value="cipher">{v4("escShapeCipher")}</option>
              <option value="quill">{v4("escQuill")}</option>
            </select>
            <button type="button" className="c4-btn" onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("escHide") : v4("escShow")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkEscutcheonReview(reviewed, shown.map((row) => row.id), true))}>{v4("escBulkReview")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkEscutcheonReview(reviewed, shown.map((row) => row.id), false))}>{v4("escBulkClear")}</button>
            <button type="button" className="c4-btn" onClick={() => download("escutcheon-lanes.csv", escutcheonsCsv(rows))}>{v4("escCsv")}</button>
            <button type="button" className="c4-btn" onClick={() => download("escutcheon-rows.csv", escutcheonRowsCsv(rows, reviewed))}>{v4("escRowCsv")}</button>
            <Link href={crmv4Href(base, "affiliates")}>{v4("escLogs")}</Link>
          </div>
          <ul className="c4-esc-lanes">
            {LANES.map((name) => (
              <li key={name}>
                <button type="button" className="c4-chip" data-on={hidden.includes(name) ? "1" : "0"} disabled={viewer || !present.includes(name)} onClick={() => storeHidden(toggleEscutcheon(hidden, name))}>{laneLabel(v4, name)}</button>
              </li>
            ))}
          </ul>
          <ol className="c4-esc-book">
            {shown.map((row) => (
              <li key={row.id} data-keyed={stitchedEscutcheon(row.note) ? "1" : "0"} data-wide={wideEscutcheon(row.note) ? "1" : "0"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"}>
                <Link href={crmv4Href(base, "affiliates")}>{row.label}</Link>
                <span>{escutcheonMark(row.note)}</span>
                <span>{laneLabel(v4, escutcheonLane(row.note))}</span>
                <span>{toneLabel(v4, escutcheonTone(row.note))}</span>
                <span>{v4("escStep")} {escutcheonStep(row.note)}</span>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleEscutcheonReview(reviewed, row.id))}>{v4("escReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(escutcheonCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("escCopied") : v4("escCopy")}</button>
              </li>
            ))}
          </ol>
          <p className="c4-esc-rules">{v4("escRules")} · {v4("escStitchMark")}</p>
        </div>
      </div>
    </section>
  );
}
