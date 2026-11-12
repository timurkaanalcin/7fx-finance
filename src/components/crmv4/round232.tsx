"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  DTY_DENSITY_KEY,
  DTY_KEY,
  DTY_VIEW_KEY,
  PCR_KEY,
  PCR_REVIEW_KEY,
  activeBay,
  activeGait,
  activeInk,
  activeLeaf,
  activeCrestLane,
  activeCrestTone,
  activeDutyClerk,
  activeSpine,
  addDuty,
  addDutyTag,
  addDutyView,
  adjacentDutyCount,
  bayArg,
  bayGap,
  bayWidth,
  bulkCrestReview,
  bulkDutyArchive,
  bulkDutyGait,
  bulkDutyInk,
  bulkDutyPin,
  bulkDutyTag,
  busiestDutyClerk,
  clashBayCount,
  coolingDuty,
  coolingDuties,
  cycleGait,
  dropDutyView,
  editDuty,
  editDutyNote,
  fairDutyClerk,
  flareDutyLoad,
  gaitArg,
  gaitFocusedDuty,
  giltCrestCount,
  holdFocusedDuty,
  houseInk,
  inkArg,
  lateDuty,
  lateDutyShare,
  leafArg,
  leafClashCount,
  leadingCrest,
  leadingCrestTone,
  crestCopy,
  crestLane,
  crestLaneArg,
  crestLanes,
  crestMark,
  crestRowsCsv,
  crestShare,
  crestState,
  crestStep,
  crestTone,
  crestToneArg,
  crestsCsv,
  matchedDuties,
  moveDutyFocus,
  nextDuty,
  pairDutyCount,
  peakBay,
  pinFocusedDuty,
  foyerCount,
  studioCount,
  galleryCount,
  presentCrestLanes,
  dutyClerkArg,
  dutyClerks,
  dutyCopy,
  dutyCounts,
  dutyDensity,
  dutyIndex,
  dutyInks,
  dutyShare,
  dutiesCsv,
  quietBay,
  quietHallDuties,
  readHiddenCrests,
  readDutyViews,
  readDuties,
  readReviewedCrests,
  reminderDuties,
  sealFocusedDuty,
  ribbonCrestCount,
  setDutyArchive,
  setDutyHold,
  setDutyPin,
  setDutySeal,
  setDutySpine,
  sharedInkCount,
  sharedCrestCount,
  snoozeFocusedDuty,
  snoozeDuty,
  sortDuties,
  spineArg,
  spineLoad,
  cipherCrestCount,
  stitchedCrest,
  stitchedCrestCount,
  suggestInk,
  suggestLeaf,
  suggestDutyClerk,
  toggleCrest,
  toggleCrestReview,
  visibleCrestLanes,
  visibleCrests,
  visibleDuties,
  wideCrest,
  type CrestReview,
  type CrestRow,
  type CrestShape,
  type CrestValue,
  type DutyDensity,
  type DutySort,
  type DutyTray,
  type DutyView,
  type ReportDuty,
} from "@/lib/crmv4/round232";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const INKS = ["graphite", "ivory", "champagne"] as const;
const GAITS = ["calm", "steady", "rush"] as const;
const LEAVES = ["15", "30", "60"] as const;
const SPINES = ["2", "4", "8"] as const;
const BAYS = ["1", "2", "3", "4", "5", "6"] as const;

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "dtyAuditSave",
  edit: "dtyAuditEdit",
  note: "dtyAuditNote",
  gait: "dtyAuditGait",
  pin: "dtyAuditPin",
  unpin: "dtyAuditUnpin",
  hold: "dtyAuditHold",
  resume: "dtyAuditResume",
  archive: "dtyAuditArchive",
  open: "dtyAuditOpen",
  ink: "dtyAuditInk",
  tag: "dtyAuditTag",
  spine: "dtyAuditSpine",
  leaf: "dtyAuditLeaf",
  seal: "dtyAuditSeal",
};

type PersonRow = { id?: string; name?: string | null; desk?: string | null; country?: string | null; role?: string | null };
type TicketRow = { id?: string; customer?: string | null; kind?: string | null; status?: string | null };

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

function inkLabel(v4: V4, ink: string): string {
  if (ink === "GRAPHITE" || ink === "graphite") return v4("dtyGraphite");
  if (ink === "IVORY" || ink === "ivory") return v4("dtyIvory");
  if (ink === "CHAMPAGNE" || ink === "champagne") return v4("dtyChampagne");
  return v4("dtyBlankInk");
}

function gaitLabel(v4: V4, gait: string): string {
  if (gait === "calm") return v4("dtyStill");
  if (gait === "steady") return v4("dtyWalk");
  if (gait === "rush") return v4("dtyFlare");
  return v4("dtyBlankGait");
}

function laneLabel(v4: V4, lane: string): string {
  if (lane === "cipher") return v4("pcrCipher");
  if (lane === "ribbon") return v4("pcrRibbon");
  if (lane === "studio") return v4("pcrStudio");
  if (lane === "gallery") return v4("pcrGallery");
  if (lane === "foyer") return v4("pcrFoyer");
  if (lane === "blank") return v4("pcrClear");
  return v4("pcrUnmarked");
}

function toneLabel(v4: V4, tone: string): string {
  if (tone === "gilt") return v4("pcrGilt");
  if (tone === "linen") return v4("pcrLinen");
  if (tone === "pale") return v4("pcrPale");
  if (tone === "ash") return v4("pcrAsh");
  if (tone === "haze") return v4("pcrHaze");
  return v4("pcrUnmarked");
}

function gapLabel(v4: V4, bay: number | null, desk: string): string {
  const gap = bayGap(bay, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("dtyPast")} ${gap}`;
  if (gap < 0) return `${v4("dtyAhead")} ${Math.abs(gap)}`;
  return v4("dtyDue");
}

export function DutySlips({ base, v4 }: { base: string; v4: V4 }) {
  const [panels, setPanels] = useState<ReportDuty[]>([]);
  const [views, setViews] = useState<DutyView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [clerk, setClerk] = useState("");
  const [bay, setBay] = useState("");
  const [ink, setInk] = useState("");
  const [gait, setGait] = useState("");
  const [leafValue, setLeafValue] = useState("");
  const [spine, setSpine] = useState("");
  const [tag, setTag] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<DutyTray>("open");
  const [clerkFilter, setClerkFilter] = useState("all");
  const [inkFilter, setInkFilter] = useState("all");
  const [gaitFilter, setGaitFilter] = useState("all");
  const [bayFilter, setBayFilter] = useState("all");
  const [leafFilter, setLeafFilter] = useState("all");
  const [spineFilter, setSpineFilter] = useState("all");
  const [flareOnly, setFlareOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [restingOnly, setRestingOnly] = useState(false);
  const [board, setBoard] = useState<"hall" | "index">("hall");
  const [order, setOrder] = useState<DutySort>("bay");
  const [density, setDensity] = useState<DutyDensity>("airy");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [deskBay, setDeskBay] = useState("");
  const [moveInk, setMoveInk] = useState("champagne");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<() => void>(() => {});
  const leafRef = useRef<() => void>(() => {});
  const holdRef = useRef<() => void>(() => {});
  const gaitRef = useRef<() => void>(() => {});
  const sealRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readDuties(readJson(DTY_KEY, []));
    const saved = readDutyViews(readJson(DTY_VIEW_KEY, []));
    setPanels(next);
    setViews(saved);
    setDensity(dutyDensity(readJson(DTY_DENSITY_KEY, "airy")));
    writeJson(DTY_KEY, next);
    writeJson(DTY_VIEW_KEY, saved);
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: ReportDuty[]) {
    const saved = readDuties(next);
    setPanels(saved);
    writeJson(DTY_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((panel) => panel.id === id)));
  }
  function storeViews(next: DutyView[]) {
    const saved = readDutyViews(next);
    setViews(saved);
    writeJson(DTY_VIEW_KEY, saved);
  }
  function storeDensity(next: DutyDensity) {
    setDensity(next);
    writeJson(DTY_DENSITY_KEY, next);
  }
  const clerks = dutyClerks(panels);
  const inks = dutyInks(panels);
  const bars = INKS.map((item) => ({ ink: item.toUpperCase(), count: panels.filter((panel) => panel.ink === item.toUpperCase()).length })).filter((row) => row.count > 0);
  const clerkOn = activeDutyClerk(clerkFilter, clerks);
  const inkOn = activeInk(inkFilter, ["GRAPHITE", "IVORY", "CHAMPAGNE", ...inks]);
  const gaitOn = activeGait(gaitFilter, ["calm", "steady", "rush"]);
  const bayOn = activeBay(bayFilter);
  const leafOn = activeLeaf(leafFilter);
  const spineOn = activeSpine(spineFilter);
  const pickedBay = bayArg(bayOn);
  const shown = sortDuties(visibleDuties(
    panels,
    tray,
    query,
    dutyClerkArg(clerkOn),
    inkArg(inkOn),
    gaitArg(gaitOn),
    pickedBay.exact,
    pickedBay.pick,
    leafArg(leafOn),
    spineArg(spineOn),
    flareOnly,
    peakOnly,
    houseOnly,
    quietOnly,
    restingOnly,
  ), order);
  const book = dutyIndex(panels, query);
  const counts = dutyCounts(panels, deskBay);
  const share = lateDutyShare(panels, deskBay);
  const matched = matchedDuties(panels, deskBay);
  const clashes = clashBayCount(panels);
  const leaves = leafClashCount(panels);
  const neighbors = adjacentDutyCount(panels);
  const suggestedInk = suggestInk(panels);
  const suggestedName = suggestDutyClerk(panels);
  const suggestedLeaf = suggestLeaf(panels);
  const fair = fairDutyClerk(panels, roster);
  const busy = busiestDutyClerk(panels);
  const reminders = reminderDuties(panels, deskBay);
  const cooling = coolingDuties(panels);
  const nextTitle = nextDuty(panels, deskBay);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  pinRef.current = () => {
    if (!viewer) store(pinFocusedDuty(panels, shown.map((panel) => panel.id), focus));
  };
  leafRef.current = () => {
    if (!viewer) store(snoozeFocusedDuty(panels, shown.map((panel) => panel.id), focus));
  };
  holdRef.current = () => {
    if (!viewer) store(holdFocusedDuty(panels, shown.map((panel) => panel.id), focus));
  };
  gaitRef.current = () => {
    if (!viewer) store(gaitFocusedDuty(panels, shown.map((panel) => panel.id), focus));
  };
  sealRef.current = () => {
    if (!viewer) store(sealFocusedDuty(panels, shown.map((panel) => panel.id), focus));
  };
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setTitle("");
        setNote("");
        setClerk("");
        setBay("");
        setInk("");
        setGait("");
        setLeafValue("");
        setSpine("");
        setTag("");
        setQuery("");
        setEditing("");
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveDutyFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveDutyFocus(index, shown.length, -1));
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
      if (event.key === "b" || event.key === "B") {
        event.preventDefault();
        leafRef.current();
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        holdRef.current();
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        gaitRef.current();
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        sealRef.current();
        return;
      }
      if (event.key === "d" || event.key === "D") {
        event.preventDefault();
        setBoard((value) => (value === "hall" ? "index" : "hall"));
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown.length]);
  function saveDuty() {
    if (viewer) return;
    store(addDuty(panels, {
      id: `dty-${Date.now()}`,
      title,
      note,
      clerk,
      bay,
      ink,
      gait,
      leaf: leafValue,
      spine,
      tags: tag,
    }));
    setTitle("");
    setNote("");
    setTag("");
  }
  function applyView(view: DutyView) {
    setTray(view.tray);
    setQuery(view.query);
    setClerkFilter(view.clerk || "all");
    setInkFilter(view.ink || "all");
    setGaitFilter(view.gait || "all");
    setBayFilter(view.bay || "all");
    setLeafFilter(view.leaf || "all");
    setSpineFilter(view.spine || "all");
  }
  const focused = shown[focus];
  return (
    <section className="c4-dty" aria-label={v4("dtyTitle")} data-duties="1" data-role={role} data-board={board} data-density={density}>
      <header className="c4-dty-mast">
        <p className="c4-dty-seal" data-logo="mono">{v4("dtyLogo")}</p>
        <div>
          <p className="c4-dty-kicker">{v4("dtySub")}</p>
          <h2 className="c4-title">{v4("dtyTitle")}</h2>
        </div>
        <p className="c4-dty-links">
          <Link href={crmv4Href(base, "settings")}>{v4("dtySub")}</Link>
          <Link href={crmv4Href(base, "pcr")}>{v4("pcrTitle")}</Link>
        </p>
      </header>
      {viewer && <p className="c4-dty-note">{v4("dtyViewer")}</p>}
      <p className="c4-dty-rule">{v4("dtyHint")}</p>
      <ul className="c4-dty-kpis" aria-label={v4("dtyKpi")}>
        <li><span>{v4("dtyOpen")}</span><strong>{counts.open}</strong></li>
        <li><span>{v4("dtyHeld")}</span><strong>{counts.held}</strong></li>
        <li><span>{v4("dtyArchived")}</span><strong>{counts.archived}</strong></li>
        <li><span>{v4("dtyPinned")}</span><strong>{counts.pinned}</strong></li>
        <li><span>{v4("dtyPeak")}</span><strong>{counts.peak}</strong></li>
        <li><span>{v4("dtyLate")}</span><strong>{counts.late}</strong></li>
        <li><span>{v4("dtySame")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("dtyRaised")}</span><strong>{counts.spine}</strong></li>
        <li><span>{v4("dtyHouse")}</span><strong>{counts.house}</strong></li>
        <li><span>{v4("dtyWindow")}</span><strong>{counts.window}</strong></li>
        <li><span>{v4("dtyMatched")}</span><strong>{matched}</strong></li>
        <li><span>{v4("dtySeal")}</span><strong>{counts.seal}</strong></li>
        <li><span>{v4("dtyCooling")}</span><strong>{counts.cooling}</strong></li>
      </ul>
      <div className="c4-dty-bars" aria-label={v4("dtyInks")}>
        {bars.map((bar) => (
          <div key={bar.ink} className="c4-dty-bar" data-ink={bar.ink.toLowerCase()}>
            <span>{inkLabel(v4, bar.ink)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <p className="c4-dty-meta">
        {v4("dtyLateShare")} {share}% · {v4("dtySuggestInk")} {inkLabel(v4, suggestedInk)} · {v4("dtySuggestLeaf")} {suggestedLeaf} · {v4("dtySuggestClerk")} {suggestedName || v4("dtyBlankClerk")} · {v4("dtyAssign")} {fair || v4("dtyBlankClerk")} · {busy ? `${v4("dtyBusiest")} ${busy}` : v4("dtyBusiestNone")} · {clashes ? `${v4("dtyClash")} ${clashes}` : v4("dtyClashNone")} · {v4("dtyLeafClash")} {leaves} · {neighbors ? `${v4("dtyNeighbors")} ${neighbors}` : v4("dtyNeighborsNone")} · {v4("dtyLoad")} {spineLoad(panels)} · {v4("dtyPair")} {pairDutyCount(panels)} · {v4("dtyShared")} {sharedInkCount(panels)} · {v4("dtyQuietHall")} {quietHallDuties(panels)} · {v4("dtyFlare")} {flareDutyLoad(panels)} · {v4("dtyBayWidth")} {bayWidth(panels)} · {v4("dtyBays")} {new Set(panels.map((panel) => panel.bay).filter((item) => item !== null)).size} · {nextTitle ? `${v4("dtyNext")} ${nextTitle}` : v4("dtyNextNone")}
      </p>
      <div className="c4-dty-tools">
        <label className="c4-lab"><span>{v4("dtyTitleField")}</span><input ref={titleRef} className="c4-field" aria-label={v4("dtyTitleField")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("dtyNote")}</span><input className="c4-field" aria-label={v4("dtyNote")} aria-required={false} value={note} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("dtyClerk")}</span><input className="c4-field" aria-label={v4("dtyClerk")} aria-required={false} value={clerk} onChange={(event) => setClerk(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("dtyBay")}</span>
          <select className="c4-select" aria-label={v4("dtyBay")} value={bay} onChange={(event) => setBay(event.target.value)}>
            <option value="">{v4("dtyBlank")}</option>
            {BAYS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("dtyInk")}</span>
          <select className="c4-select" aria-label={v4("dtyInk")} value={ink} onChange={(event) => setInk(event.target.value)}>
            <option value="">{v4("dtyBlankInk")}</option>
            {INKS.map((item) => <option key={item} value={item}>{inkLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("dtyGait")}</span>
          <select className="c4-select" aria-label={v4("dtyGait")} value={gait} onChange={(event) => setGait(event.target.value)}>
            <option value="">{v4("dtyBlankGait")}</option>
            {GAITS.map((item) => <option key={item} value={item}>{gaitLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("dtyLeaf")}</span>
          <select className="c4-select" aria-label={v4("dtyLeaf")} value={leafValue} onChange={(event) => setLeafValue(event.target.value)}>
            <option value="">{v4("dtyBlankLeaf")}</option>
            {LEAVES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("dtySpine")}</span>
          <select className="c4-select" aria-label={v4("dtySpine")} value={spine} onChange={(event) => setSpine(event.target.value)}>
            <option value="">{v4("dtyResting")}</option>
            {SPINES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("dtyTag")}</span><input className="c4-field" aria-label={v4("dtyTag")} aria-required={false} value={tag} onChange={(event) => setTag(event.target.value)} /></label>
        <button type="button" className="c4-btn c4-btn-hot" disabled={viewer} onClick={saveDuty}>{v4("dtyAdd")}</button>
      </div>
      <div className="c4-dty-tools">
        <label className="c4-lab"><span>{v4("dtyDesk")}</span><input className="c4-field" aria-label={v4("dtyDesk")} aria-required={false} value={deskBay} onChange={(event) => setDeskBay(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("dtyRoster")}</span><input className="c4-field" aria-label={v4("dtyRoster")} aria-required={false} value={roster} onChange={(event) => setRoster(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("dtySearch")}</span><input ref={searchRef} className="c4-field c4-dty-search" aria-label={v4("dtySearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <button type="button" className="c4-btn" onClick={() => storeDensity(density === "airy" ? "tight" : "airy")}>{density === "airy" ? v4("dtyDensityTight") : v4("dtyDensityAiry")}</button>
        <button type="button" className="c4-btn" data-on={order === "bay" ? "1" : "0"} onClick={() => setOrder("bay")}>{v4("dtySortBay")}</button>
        <button type="button" className="c4-btn" data-on={order === "clerk" ? "1" : "0"} onClick={() => setOrder("clerk")}>{v4("dtySortClerk")}</button>
        <button type="button" className="c4-btn" data-on={board === "hall" ? "1" : "0"} onClick={() => setBoard("hall")}>{v4("dtyBoardHall")}</button>
        <button type="button" className="c4-btn" data-on={board === "index" ? "1" : "0"} onClick={() => setBoard("index")}>{v4("dtyBoardIndex")}</button>
        <button type="button" className="c4-btn" onClick={() => download("report-duties.csv", dutiesCsv(panels, deskBay))}>{v4("dtyCsv")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("dtyOpen")}>
        {(["open", "held", "archived"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("dtyOpen") : item === "held" ? v4("dtyHeld") : v4("dtyArchived")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={flareOnly ? "1" : "0"} onClick={() => setFlareOnly((value) => !value)}>{v4("dtyFlareOnly")}</button>
        <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((value) => !value)}>{v4("dtyPeakOnly")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((value) => !value)}>{v4("dtyQuietOnly")}</button>
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("dtyHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={restingOnly ? "1" : "0"} onClick={() => setRestingOnly((value) => !value)}>{v4("dtyRestingOnly")}</button>
      </div>
      <div className="c4-dty-tools">
        <label className="c4-lab"><span>{v4("dtyClerk")}</span>
          <select className="c4-select" aria-label={v4("dtyClerk")} value={clerkOn} onChange={(event) => setClerkFilter(event.target.value)}>
            <option value="all">{v4("dtyAll")}</option>
            <option value="blank">{v4("dtyBlankClerk")}</option>
            {clerks.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("dtyInk")}</span>
          <select className="c4-select" aria-label={v4("dtyInk")} value={inkOn} onChange={(event) => setInkFilter(event.target.value)}>
            <option value="all">{v4("dtyAll")}</option>
            <option value="blank">{v4("dtyBlankInk")}</option>
            {INKS.map((item) => <option key={item} value={item.toUpperCase()}>{inkLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("dtyGait")}</span>
          <select className="c4-select" aria-label={v4("dtyGait")} value={gaitOn} onChange={(event) => setGaitFilter(event.target.value)}>
            <option value="all">{v4("dtyAll")}</option>
            <option value="blank">{v4("dtyBlankGait")}</option>
            {GAITS.map((item) => <option key={item} value={item}>{gaitLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("dtyBay")}</span>
          <select className="c4-select" aria-label={v4("dtyBay")} value={bayOn} onChange={(event) => setBayFilter(event.target.value)}>
            <option value="all">{v4("dtyAll")}</option>
            <option value="blank">{v4("dtyBlank")}</option>
            <option value="early">{v4("dtyEarly")}</option>
            <option value="mid">{v4("dtyMid")}</option>
            <option value="late">{v4("dtyLate")}</option>
            <option value="peak">{v4("dtyPeak")}</option>
            <option value="quiet">{v4("dtyQuiet")}</option>
            {BAYS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("dtyLeaf")}</span>
          <select className="c4-select" aria-label={v4("dtyLeaf")} value={leafOn} onChange={(event) => setLeafFilter(event.target.value)}>
            <option value="all">{v4("dtyAll")}</option>
            <option value="blank">{v4("dtyBlankLeaf")}</option>
            {LEAVES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("dtySpine")}</span>
          <select className="c4-select" aria-label={v4("dtySpine")} value={spineOn} onChange={(event) => setSpineFilter(event.target.value)}>
            <option value="all">{v4("dtyAll")}</option>
            <option value="blank">{v4("dtyResting")}</option>
            {SPINES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>
      <div className="c4-dty-tools">
        <label className="c4-lab"><span>{v4("dtyView")}</span><input className="c4-field" aria-label={v4("dtyView")} aria-required={false} value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
          storeViews(addDutyView(views, { id: `view-${Date.now()}`, name: viewName, tray, query, clerk: clerkOn, ink: inkOn, gait: gaitOn, bay: bayOn, leaf: leafOn, spine: spineOn }));
          setViewName("");
        }}>{v4("dtyView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-dty-view">
            <button type="button" className="c4-chip" onClick={() => applyView(view)}>{v4("dtyApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropDutyView(views, view.id))}>{v4("dtyDropView")}</button>
          </span>
        ))}
      </div>
      <div className="c4-dty-tools">
        <label className="c4-lab"><span>{v4("dtyBulkInk")}</span>
          <select className="c4-select" aria-label={v4("dtyBulkInk")} value={moveInk} onChange={(event) => setMoveInk(event.target.value)}>
            {INKS.map((item) => <option key={item} value={item}>{inkLabel(v4, item)}</option>)}
          </select>
        </label>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkDutyInk(panels, picked, moveInk))}>{v4("dtyBulkInk")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkDutyPin(panels, picked, true))}>{v4("dtyBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkDutyArchive(panels, picked, true))}>{v4("dtyBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkDutyGait(panels, picked, "rush"))}>{v4("dtyBulkGait")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkDutyTag(panels, picked, "w"))}>{v4("dtyBulkTag")}</button>
      </div>
      <p className="c4-dty-keys">{v4("dtyKeys")} {v4("dtyEscape")} {v4("dtyBoardKey")} {v4("dtyGaitKey")} {v4("dtyHoldKey")} {v4("dtySealKey")} {v4("dtyPinKey")} {v4("dtyLeafKey")}</p>
      {!shown.length && board === "hall" && <p className="c4-dty-empty">{v4("dtyEmpty")}</p>}
      {board === "hall" ? (
        <ol className={`c4-dty-list ${density === "tight" ? "is-tight" : "is-airy"}`}>
          {shown.map((panel, index) => (
            <li key={panel.id} className="c4-dty-card" data-on={focus === index ? "1" : "0"} data-ink={panel.ink.toLowerCase() || "blank"} data-late={lateDuty(panel, deskBay) ? "1" : "0"} data-cooling={coolingDuty(panel) ? "1" : "0"} data-peak={peakBay(panel.bay) ? "1" : "0"} data-quiet={quietBay(panel.bay) ? "1" : "0"} data-house={houseInk(panel.ink) ? "1" : "0"}>
              <label className="c4-row">
                <input type="checkbox" checked={picked.includes(panel.id)} aria-label={panel.title} onChange={(event) => setPicked((ids) => event.target.checked ? [...ids, panel.id] : ids.filter((id) => id !== panel.id))} />
                <button type="button" className="c4-btn" data-on={focus === index ? "1" : "0"} onClick={() => setFocus(index)}>{v4("dtyFocus")}</button>
              </label>
              {editing === panel.id ? (
                <label className="c4-lab"><span>{v4("dtyEdit")}</span><input className="c4-field" aria-label={v4("dtyEdit")} value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={() => { if (!viewer) store(editDuty(panels, panel.id, draft)); setEditing(""); }} /></label>
              ) : (
                <h3 className="c4-title">{panel.title}</h3>
              )}
              <p>{panel.clerk || v4("dtyBlankClerk")} · {panel.bay ?? v4("dtyBlank")} · {inkLabel(v4, panel.ink)} · {gaitLabel(v4, panel.gait)} · {panel.leaf ?? v4("dtyBlankLeaf")} · {panel.spine} · {panel.tags.join(" ") || v4("dtyBlank")} · {gapLabel(v4, panel.bay, deskBay)} · {panel.audit ? v4(AUDIT_KEY[panel.audit] || "dtyAuditSave") : ""}</p>
              {editing === `${panel.id}-note` ? (
                <label className="c4-lab"><span>{v4("dtyEditNote")}</span><input className="c4-field" aria-label={v4("dtyEditNote")} aria-required={false} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} onBlur={() => { if (!viewer) store(editDutyNote(panels, panel.id, noteDraft)); setEditing(""); }} /></label>
              ) : <p>{panel.note}</p>}
              <div className="c4-row">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(panel.id); setDraft(panel.title); }}>{v4("dtyEdit")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(`${panel.id}-note`); setNoteDraft(panel.note); }}>{v4("dtyEditNote")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDutyPin(panels, panel.id, !panel.pinned))}>{panel.pinned ? v4("dtyUnpin") : v4("dtyPin")}</button>
                <button type="button" className="c4-btn" disabled={viewer || panel.archived} onClick={() => store(setDutyHold(panels, panel.id, !panel.held))}>{panel.held ? v4("dtyResume") : v4("dtyHold")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDutyArchive(panels, panel.id, !panel.archived))}>{panel.archived ? v4("dtyReopen") : v4("dtyArchive")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleGait(panels, panel.id))}>{v4("dtyGait")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDutySeal(panels, panel.id, !panel.seal))}>{panel.seal ? v4("dtyUnseal") : v4("dtySeal")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(snoozeDuty(panels, panel.id))}>{v4("dtySnooze")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDutySpine(panels, panel.id, panel.spine === 8 ? "2" : panel.spine === 4 ? "8" : "4"))}>{v4("dtySpine")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addDutyTag(panels, panel.id, "x"))}>{v4("dtyTag")}</button>
                <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(dutyCopy(panel, deskBay)); setCopied(panel.id); }}>{copied === panel.id ? v4("dtyCopied") : v4("dtyCopy")}</button>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <ol className="c4-dty-index">
          {!book.length && <li className="c4-dty-empty">{v4("dtyEmpty")}</li>}
          {book.map((panel) => <li key={panel.id}><span>{panel.bay}</span><strong>{panel.title}</strong><em>{panel.clerk || v4("dtyBlankClerk")}</em></li>)}
        </ol>
      )}
      <aside className="c4-dty-side" aria-label={v4("dtyReminders")}>
        <h3 className="c4-title">{v4("dtyReminders")}</h3>
        {!reminders.length && <p>{v4("dtyEmpty")}</p>}
        <ul>{reminders.map((panel) => <li key={panel.id}>{panel.title} · {lateDuty(panel, deskBay) ? v4("dtyLate") : v4("dtySame")}</li>)}</ul>
        <h3 className="c4-title">{v4("dtyCooling")}</h3>
        {!cooling.length && <p>{v4("dtyCoolingEmpty")}</p>}
        <ul>{cooling.map((panel) => <li key={panel.id}>{panel.title}</li>)}</ul>
        {focused && <p>{v4("dtyFocus")} {focused.title} · {dutyShare(counts.house, Math.max(1, counts.open))}%</p>}
      </aside>
    </section>
  );
}

function personNote(row: PersonRow): CrestValue {
  return {
    name: textField(row.name),
    language: textField(row.country),
    desk: textField(row.desk),
    role: textField(row.role),
  };
}

function ticketNote(row: TicketRow): CrestValue {
  return {
    name: textField(row.customer),
    language: "",
    desk: textField(row.kind),
    role: "",
  };
}

export function ProfileCrests({ base, v4 }: { base: string; v4: V4 }) {
  const traders = useJson<{ users?: PersonRow[] }>("/api/admin/users?view=table&take=40&meta=0");
  const tickets = useJson<{ tickets?: TicketRow[] }>("/api/admin/tickets?take=20");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("all");
  const [tone, setTone] = useState("all");
  const [review, setReview] = useState<CrestReview>("all");
  const [shape, setShape] = useState<CrestShape>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const reviewRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  const rows = useMemo<CrestRow[]>(() => {
    const people = (traders.data?.users || []).map((row, index) => ({
      id: row.id || `trader-${index}`,
      label: textField(row.name),
      note: personNote(row),
    }));
    const cases = (tickets.data?.tickets || []).map((row, index) => ({
      id: row.id ? `ticket-${row.id}` : `ticket-${index}`,
      label: textField(row.customer),
      note: ticketNote(row),
    }));
    return [...people, ...cases];
  }, [traders.data?.users, tickets.data?.tickets]);
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
    const present = presentCrestLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenCrests(readJson(PCR_KEY, []), present);
    const nextReviewed = readReviewedCrests(readJson(PCR_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(PCR_KEY, nextHidden);
    writeJson(PCR_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentCrestLanes(rows);
  const lanes = visibleCrestLanes(present, hidden, showHidden);
  const laneOn = activeCrestLane(lane, present);
  const toneOn = activeCrestTone(tone);
  const shown = visibleCrests(rows, crestLaneArg(laneOn), crestToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = crestState(row.note);
      const token = state === "set" ? crestLane(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return lanes.includes(token);
    });
  reviewRef.current = () => {
    const row = shown[focus];
    if (!row || viewer) return;
    const next = toggleCrestReview(reviewed, row.id);
    setReviewed(next);
    writeJson(PCR_REVIEW_KEY, next);
  };
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setQuery("");
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveDutyFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveDutyFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        reviewRef.current();
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown.length]);
  const lead = leadingCrest(rows);
  const toneLead = leadingCrestTone(rows);
  const shared = sharedCrestCount(rows);
  const stitched = stitchedCrestCount(rows);
  const bars = crestLanes(rows).filter((line) => line.lane);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  const known = rows.filter((row) => crestState(row.note) === "set").length;
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(PCR_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedCrests(next, ids);
    setReviewed(saved);
    writeJson(PCR_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-pcr" aria-label={v4("pcrTitle")} data-crests="1" data-traders={traders.data?.users?.length ? "1" : "0"} data-tickets={tickets.data?.tickets?.length ? "1" : "0"} data-role={role} data-keyed={stitched ? "1" : "0"}>
      <header className="c4-pcr-mast">
        <p className="c4-pcr-seal" data-logo="mono">{v4("pcrLogo")}</p>
        <div>
          <p className="c4-pcr-kicker">{v4("pcrSub")}</p>
          <h2 className="c4-title">{v4("pcrTitle")}</h2>
        </div>
        <ol className="c4-pcr-index" aria-label={v4("pcrTitle")}>
          <li data-tone="gold">{v4("pcrCipher")}</li>
          <li data-tone="ink">{v4("pcrRibbon")}</li>
          <li data-tone="ivory">{v4("pcrFoyer")}</li>
        </ol>
      </header>
      <p className="c4-pcr-links">
        <Link href={crmv4Href(base, "settings")}>{v4("dtySub")}</Link>
        <Link href={crmv4Href(base, "dty")}>{v4("dtyTitle")}</Link>
        <Link href={crmv4Href(base, "me")}>{v4("pcrSub")}</Link>
      </p>
      {viewer && <p className="c4-pcr-note">{v4("pcrViewer")}</p>}
      <p className="c4-pcr-rule">{v4("pcrHint")}</p>
      <ul className="c4-pcr-kpis" aria-label={v4("pcrRules")}>
        <li><span>{v4("pcrSet")}</span><strong>{known}</strong></li>
        <li><span>{v4("pcrClear")}</span><strong>{rows.filter((row) => crestState(row.note) === "clear").length}</strong></li>
        <li><span>{v4("pcrFoyer")}</span><strong>{foyerCount(rows)}</strong></li>
        <li><span>{v4("pcrStudio")}</span><strong>{studioCount(rows)}</strong></li>
        <li><span>{v4("pcrGallery")}</span><strong>{galleryCount(rows)}</strong></li>
        <li><span>{v4("pcrRibbon")}</span><strong>{ribbonCrestCount(rows)}</strong></li>
        <li><span>{v4("pcrCipher")}</span><strong>{cipherCrestCount(rows)}</strong></li>
        <li><span>{v4("pcrGilt")}</span><strong>{giltCrestCount(rows)}</strong></li>
        <li><span>{v4("pcrShare")}</span><strong>{crestShare(stitched, Math.max(1, known))}%</strong></li>
        <li><span>{v4("pcrShared")}</span><strong>{shared}</strong></li>
      </ul>
      <div className="c4-pcr-bars" aria-label={v4("pcrLead")}>
        {bars.map((bar) => (
          <div key={bar.lane} className="c4-pcr-bar" data-lane={bar.lane}>
            <span>{laneLabel(v4, bar.lane)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <p className="c4-pcr-meta">{lead ? `${v4("pcrLead")} ${laneLabel(v4, lead)}` : v4("pcrEmpty")} · {toneLead ? `${v4("pcrToneLead")} ${toneLabel(v4, toneLead)}` : v4("pcrUnmarked")} · {v4("pcrWide")} {rows.filter((row) => wideCrest(row.note)).length}</p>
      <label className="c4-lab"><span>{v4("pcrSearch")}</span><input ref={searchRef} className="c4-field c4-pcr-search" aria-label={v4("pcrSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <div className="c4-row" role="group" aria-label={v4("pcrAll")}>
        <button type="button" className="c4-chip" data-on={laneOn === "all" ? "1" : "0"} onClick={() => setLane("all")}>{v4("pcrAll")}</button>
        {present.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={laneOn === item ? "1" : "0"} onClick={() => setLane(item)}>{laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("pcrGilt")}>
        {(["all", "gilt", "linen", "pale", "ash", "haze"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={toneOn === item ? "1" : "0"} onClick={() => setTone(item)}>{item === "all" ? v4("pcrAll") : toneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("pcrShapeAll")}>
        {(["all", "clasp", "wide", "foyer", "cipher", "ribbon"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>
            {item === "all" ? v4("pcrShapeAll") : item === "clasp" ? v4("pcrShapeClasp") : item === "wide" ? v4("pcrShapeWide") : item === "foyer" ? v4("pcrShapeFoyer") : item === "cipher" ? v4("pcrShapeCipher") : v4("pcrShapeRibbon")}
          </button>
        ))}
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview("reviewed")}>{v4("pcrReviewed")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview("fresh")}>{v4("pcrFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} onClick={() => setReview("all")}>{v4("pcrAll")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("pcrShow")}</button>
      </div>
      <div className="c4-row">
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" data-on={hidden.includes(item) ? "1" : "0"} onClick={() => storeHidden(toggleCrest(hidden, item))}>{v4("pcrHide")} {laneLabel(v4, item)}</button>
        ))}
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkCrestReview(reviewed, shown.map((row) => row.id), true))}>{v4("pcrBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkCrestReview(reviewed, shown.map((row) => row.id), false))}>{v4("pcrBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("crest-lanes.csv", crestsCsv(rows))}>{v4("pcrCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("crest-rows.csv", crestRowsCsv(rows, reviewed))}>{v4("pcrRowCsv")}</button>
      </div>
      <p className="c4-pcr-keys">{v4("dtyKeys")} {v4("dtyEscape")}</p>
      {!shown.length && <p className="c4-pcr-empty">{traders.error || tickets.error ? v4("pcrUnmarked") : v4("pcrEmpty")}</p>}
      <ol className="c4-pcr-list">
        {shown.map((row, index) => (
          <li key={row.id} className="c4-pcr-card" data-on={focus === index ? "1" : "0"} data-lane={crestLane(row.note) || "blank"} data-tone={crestTone(row.note) || "blank"} data-stitch={stitchedCrest(row.note) ? "1" : "0"} data-wide={wideCrest(row.note) ? "1" : "0"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"}>
            <span className="c4-pcr-mark">{crestMark(row.note) || "—"}</span>
            <strong>{row.label || v4("pcrClear")}</strong>
            <span>{laneLabel(v4, crestState(row.note) === "clear" ? "blank" : crestLane(row.note))}</span>
            <span>{toneLabel(v4, crestTone(row.note))}</span>
            <span>{v4("pcrStep")} {crestStep(row.note)}</span>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleCrestReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("pcrReviewed") : v4("pcrReview")}</button>
            <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(crestCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("pcrCopied") : v4("pcrCopy")}</button>
          </li>
        ))}
      </ol>
    </section>
  );
}
