"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  CFF_DENSITY_KEY,
  CFF_KEY,
  CFF_VIEW_KEY,
  RST_KEY,
  RST_REVIEW_KEY,
  activeBay,
  activeClerk,
  activeGait,
  activeInk,
  activeRib,
  activeRosetteLane,
  activeRosetteTone,
  activeSpan,
  addCoffer,
  addCofferTag,
  addCofferView,
  adjacentCofferCount,
  bayArg,
  bayGap,
  bayWidth,
  bellCount,
  brightRosetteCount,
  bulkCofferArchive,
  bulkCofferGait,
  bulkCofferInk,
  bulkCofferPin,
  bulkCofferTag,
  bulkRosetteReview,
  busiestClerk,
  cipherCount,
  clashBayCount,
  clerkArg,
  cofferClerks,
  cofferCopy,
  cofferCounts,
  cofferIndex,
  cofferInks,
  cofferShare,
  coffersCsv,
  coolingCoffer,
  coolingCoffers,
  cycleGait,
  dropCofferView,
  editCoffer,
  editCofferNote,
  fairClerk,
  gaitArg,
  gaitFocusedCoffer,
  giltFocusedCoffer,
  holdFocusedCoffer,
  houseInk,
  inkArg,
  lateCoffer,
  lateCofferShare,
  leadingRosette,
  leadingRosetteTone,
  marginCount,
  matchedCoffers,
  moveCofferFocus,
  nextCoffer,
  pairClerkCount,
  peakBay,
  pinFocusedCoffer,
  presentRosetteLanes,
  quietBay,
  quietHallCount,
  readCofferViews,
  readCoffers,
  readHiddenRosettes,
  readReviewedRosettes,
  reminderCoffers,
  resetCoffers,
  ribArg,
  ribLoad,
  rosetteCopy,
  rosetteLane,
  rosetteLaneArg,
  rosetteLanes,
  rosetteMark,
  rosetteRowsCsv,
  rosetteShare,
  rosetteState,
  rosetteStep,
  rosetteTone,
  rosetteToneArg,
  rosettesCsv,
  rowDensity,
  rushLoad,
  setCofferArchive,
  setCofferGilt,
  setCofferHold,
  setCofferPin,
  setCofferRib,
  sharedInkCount,
  sharedRosetteCount,
  snoozeCoffer,
  snoozeFocusedCoffer,
  sortCoffers,
  spanArg,
  spanClashCount,
  stitchedRosette,
  stitchedRosetteCount,
  suggestClerk,
  suggestInk,
  suggestSpan,
  toggleRosette,
  toggleRosetteReview,
  usedBays,
  visibleCoffers,
  visibleRosetteLanes,
  visibleRosettes,
  wideRosette,
  wideRosetteCount,
  windowCoffers,
  type CofferDensity,
  type CofferPanel,
  type CofferSort,
  type CofferTray,
  type CofferView,
  type RosetteReview,
  type RosetteRow,
  type RosetteShape,
  type RosetteValue,
} from "@/lib/crmv4/round227";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type CommRow = {
  id?: string;
  type?: string | null;
  title?: string | null;
  trader?: string | null;
  workerName?: string | null;
};

type GlanceRow = RosetteRow & { id: string };

const INKS = ["graphite", "ivory", "champagne"] as const;
const GAITS = ["hush", "stride", "rush"] as const;
const LANES = ["margin", "bell", "quill", "cipher"] as const;

function inkLabel(v4: V4, ink: string): string {
  if (ink === "graphite" || ink === "GRAPHITE") return v4("cffGraphite");
  if (ink === "ivory" || ink === "IVORY") return v4("cffIvory");
  if (ink === "champagne" || ink === "CHAMPAGNE") return v4("cffChampagne");
  return v4("cffBlankInk");
}

function gaitLabel(v4: V4, gait: string): string {
  if (gait === "hush") return v4("cffHush");
  if (gait === "stride") return v4("cffStride");
  if (gait === "rush") return v4("cffRush");
  return v4("cffBlankGait");
}

function spanLabel(v4: V4, span: number | null): string {
  if (span === 4) return v4("cffSpan4");
  if (span === 12) return v4("cffSpan12");
  if (span === 24) return v4("cffSpan24");
  return v4("cffBlankSpan");
}

function laneLabel(v4: V4, name: string): string {
  if (name === "margin") return v4("rstMargin");
  if (name === "bell") return v4("rstBell");
  if (name === "quill") return v4("rstQuill");
  if (name === "cipher") return v4("rstCipher");
  if (name === "blank") return v4("rstClear");
  return v4("rstUnmarked");
}

function toneLabel(v4: V4, name: string): string {
  if (name === "bright") return v4("rstBright");
  if (name === "even") return v4("rstEven");
  if (name === "dim") return v4("rstDim");
  if (name === "hush") return v4("rstHush");
  if (name === "mist") return v4("rstMist");
  return v4("rstUnmarked");
}

function auditLabel(v4: V4, audit: string): string {
  const key = {
    save: "cffAuditSave",
    edit: "cffAuditEdit",
    note: "cffAuditNote",
    gait: "cffAuditGait",
    pin: "cffAuditPin",
    unpin: "cffAuditUnpin",
    hold: "cffAuditHold",
    resume: "cffAuditResume",
    archive: "cffAuditArchive",
    open: "cffAuditOpen",
    ink: "cffAuditInk",
    tag: "cffAuditTag",
    rib: "cffAuditRib",
    span: "cffAuditSpan",
    gilt: "cffAuditGilt",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, bay: number | null, desk: string): string {
  const gap = bayGap(bay, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("cffPast")} ${gap}`;
  if (gap < 0) return `${v4("cffAhead")} ${Math.abs(gap)}`;
  return v4("cffDue");
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

export function CofferPanels({ v4 }: { v4: V4 }) {
  const [panels, setPanels] = useState<CofferPanel[]>([]);
  const [views, setViews] = useState<CofferView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [clerk, setClerk] = useState("");
  const [bay, setBay] = useState("");
  const [ink, setInk] = useState("");
  const [gait, setGait] = useState("");
  const [spanValue, setSpanValue] = useState("");
  const [rib, setRib] = useState("");
  const [tag, setTag] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<CofferTray>("open");
  const [clerkFilter, setClerkFilter] = useState("all");
  const [inkFilter, setInkFilter] = useState("all");
  const [gaitFilter, setGaitFilter] = useState("all");
  const [bayFilter, setBayFilter] = useState("all");
  const [spanFilter, setSpanFilter] = useState("all");
  const [ribFilter, setRibFilter] = useState("all");
  const [rushOnly, setRushOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [restingOnly, setRestingOnly] = useState(false);
  const [board, setBoard] = useState<"hall" | "index">("hall");
  const [order, setOrder] = useState<CofferSort>("bay");
  const [density, setDensity] = useState<CofferDensity>("airy");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [deskBay, setDeskBay] = useState("");
  const [moveInk, setMoveInk] = useState("graphite");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<() => void>(() => {});
  const spanRef = useRef<() => void>(() => {});
  const holdRef = useRef<() => void>(() => {});
  const gaitRef = useRef<() => void>(() => {});
  const giltRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readCoffers(readJson(CFF_KEY, []));
    const saved = readCofferViews(readJson(CFF_VIEW_KEY, []));
    setPanels(next);
    setViews(saved);
    setDensity(rowDensity(readJson(CFF_DENSITY_KEY, "airy")));
    writeJson(CFF_KEY, next);
    writeJson(CFF_VIEW_KEY, saved);
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: CofferPanel[]) {
    const saved = readCoffers(next);
    setPanels(saved);
    writeJson(CFF_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((panel) => panel.id === id)));
  }
  function storeViews(next: CofferView[]) {
    const saved = readCofferViews(next);
    setViews(saved);
    writeJson(CFF_VIEW_KEY, saved);
  }
  function storeDensity(next: CofferDensity) {
    setDensity(next);
    writeJson(CFF_DENSITY_KEY, next);
  }
  const clerks = cofferClerks(panels);
  const inks = cofferInks(panels);
  const bars = INKS.map((item) => ({ ink: item.toUpperCase(), count: panels.filter((panel) => panel.ink === item.toUpperCase()).length })).filter((row) => row.count > 0);
  const clerkOn = activeClerk(clerkFilter, clerks);
  const inkOn = activeInk(inkFilter, ["GRAPHITE", "IVORY", "CHAMPAGNE", ...inks]);
  const gaitOn = activeGait(gaitFilter, ["hush", "stride", "rush"]);
  const bayOn = activeBay(bayFilter);
  const spanOn = activeSpan(spanFilter);
  const ribOn = activeRib(ribFilter);
  const pickedBay = bayArg(bayOn);
  const shown = sortCoffers(visibleCoffers(
    panels,
    tray,
    query,
    clerkArg(clerkOn),
    inkArg(inkOn),
    gaitArg(gaitOn),
    pickedBay.exact,
    pickedBay.pick,
    spanArg(spanOn),
    ribArg(ribOn),
    rushOnly,
    peakOnly,
    houseOnly,
    quietOnly,
    restingOnly,
  ), order);
  const book = cofferIndex(panels, query);
  const counts = cofferCounts(panels, deskBay);
  const share = lateCofferShare(panels, deskBay);
  const matched = matchedCoffers(panels, deskBay);
  const clashes = clashBayCount(panels);
  const spans = spanClashCount(panels);
  const neighbors = adjacentCofferCount(panels);
  const suggestedInk = suggestInk(panels);
  const suggestedName = suggestClerk(panels);
  const suggestedSpan = suggestSpan(panels);
  const fair = fairClerk(panels, roster);
  const busy = busiestClerk(panels);
  const reminders = reminderCoffers(panels, deskBay);
  const cooling = coolingCoffers(panels);
  const windowRows = windowCoffers(panels, deskBay);
  const nextTitle = nextCoffer(panels, deskBay);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  pinRef.current = () => {
    if (!viewer) store(pinFocusedCoffer(panels, shown.map((panel) => panel.id), focus));
  };
  spanRef.current = () => {
    if (!viewer) store(snoozeFocusedCoffer(panels, shown.map((panel) => panel.id), focus));
  };
  holdRef.current = () => {
    if (!viewer) store(holdFocusedCoffer(panels, shown.map((panel) => panel.id), focus));
  };
  gaitRef.current = () => {
    if (!viewer) store(gaitFocusedCoffer(panels, shown.map((panel) => panel.id), focus));
  };
  giltRef.current = () => {
    if (!viewer) store(giltFocusedCoffer(panels, shown.map((panel) => panel.id), focus));
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
        setSpanValue("");
        setRib("");
        setTag("");
        setQuery("");
        setEditing("");
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveCofferFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveCofferFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        titleRef.current?.focus();
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        pinRef.current();
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        spanRef.current();
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        holdRef.current();
        return;
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        gaitRef.current();
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        giltRef.current();
        return;
      }
      if (event.key === "b" || event.key === "B") {
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
    setBay("");
    setInk("");
    setGait("");
    setSpanValue("");
    setRib("");
    setTag("");
    setQuery("");
    setEditing("");
  }
  function applyView(view: CofferView) {
    setTray(view.tray);
    setQuery(view.query);
    setClerkFilter(view.clerk);
    setInkFilter(view.ink);
    setGaitFilter(view.gait);
    setBayFilter(view.bay);
    setSpanFilter(view.span);
    setRibFilter(view.rib);
  }
  const rows = board === "index" ? book : shown;
  const houseOpen = panels.filter((panel) => !panel.held && !panel.archived && houseInk(panel.ink)).length;
  const openCount = Math.max(1, counts.open);
  return (
    <section className="c4-cff" aria-label={v4("cffTitle")} data-coffers="1" data-role={role} data-density={density}>
      <div className="c4-cff-sheet">
        <header className="c4-cff-mast">
          <p className="c4-cff-plate" data-logo="mono">{v4("cffLogo")}</p>
          <div>
            <p className="c4-cff-kicker">{v4("cffSub")}</p>
            <h2 className="c4-title">{v4("cffTitle")}</h2>
          </div>
        </header>
        <p className="c4-cff-time">{v4("cffLocal")}</p>
        <p className="c4-cff-rules">{v4("cffHint")}</p>
        <p className="c4-meta">{v4("cffNew")} {v4("cffSlash")} {v4("cffEscape")} {v4("cffKeys")} {v4("cffPinKey")} {v4("cffSpanKey")} {v4("cffHoldKey")} {v4("cffGaitKey")} {v4("cffGiltKey")} {v4("cffBoardKey")}</p>
        {viewer && <p className="c4-cff-notice" data-viewer="1">{v4("cffViewer")}</p>}
        {counts.peak > 0 && (
          <p className="c4-cff-notice" role="status">
            {v4("cffNotice")} · {counts.peak}
            <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("cffNoticeAll") : v4("cffNoticePeak")}</button>
          </p>
        )}
        {counts.late > 0 && <p className="c4-cff-notice" role="status">{v4("cffLateNotice")} · {counts.late}</p>}
        <ol className="c4-cff-kpis" aria-label={v4("cffKpi")}>
          <li><span>{v4("cffOpen")}</span><strong>{counts.open}</strong></li>
          <li><span>{v4("cffHeld")}</span><strong>{counts.held}</strong></li>
          <li><span>{v4("cffArchived")}</span><strong>{counts.archived}</strong></li>
          <li><span>{v4("cffPinned")}</span><strong>{counts.pinned}</strong></li>
          <li><span>{v4("cffPeak")}</span><strong>{counts.peak}</strong></li>
          <li><span>{v4("cffLate")}</span><strong>{counts.late}</strong></li>
          <li><span>{v4("cffSoon")}</span><strong>{counts.soon}</strong></li>
          <li><span>{v4("cffRib")}</span><strong>{counts.rib}</strong></li>
          <li><span>{v4("cffMatched")}</span><strong>{matched}</strong></li>
          <li><span>{v4("cffGilt")}</span><strong>{counts.gilt}</strong></li>
          <li><span>{v4("cffCooling")}</span><strong>{counts.cooling}</strong></li>
        </ol>
        <div className="c4-cff-meter" aria-label={v4("cffLateShare")}>
          <span>{v4("cffHouseShare")} {cofferShare(houseOpen, openCount)}%</span>
          <span>{v4("cffLateShare")} {share}%</span>
          <i style={{ width: `${share}%` }} />
        </div>
        <ol className="c4-cff-bars" aria-label={v4("cffInks")}>
          {bars.map((bar) => (
            <li key={bar.ink}>
              <span>{inkLabel(v4, bar.ink)}</span>
              <b style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
              <em>{bar.count}</em>
            </li>
          ))}
        </ol>
        {!panels.length && <p className="c4-cff-empty">{v4("cffEmpty")}</p>}
        <div className="c4-cff-suggest">
          <p>{v4("cffSuggestInk")}: {inkLabel(v4, suggestedInk)}</p>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => setInk(suggestedInk.toLowerCase())}>{v4("cffUseInk")}</button>
          <p>{suggestedName ? `${v4("cffSuggestClerk")}: ${suggestedName}` : v4("cffBlankClerk")}</p>
          <button type="button" className="c4-btn" disabled={viewer || !suggestedName} onClick={() => setClerk(suggestedName)}>{v4("cffUseClerk")}</button>
          <p>{v4("cffSuggestSpan")}: {spanLabel(v4, suggestedSpan)}</p>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => setSpanValue(String(suggestedSpan))}>{v4("cffUseSpan")}</button>
          <p>{v4("cffAssign")}: {fair || v4("cffBlankClerk")}</p>
          <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setClerk(fair)}>{v4("cffUseClerk")}</button>
        </div>
        <ul className="c4-cff-facts">
          <li>{v4("cffBays")}: {usedBays(panels)}</li>
          <li>{clashes ? `${v4("cffClash")} ${clashes}` : v4("cffClashNone")}</li>
          <li>{spans ? `${v4("cffSpanClash")} ${spans}` : v4("cffSpanClashNone")}</li>
          <li>{neighbors ? `${v4("cffAdjacent")} ${neighbors}` : v4("cffAdjacentNone")}</li>
          <li>{pairClerkCount(panels) ? `${v4("cffPairs")} ${pairClerkCount(panels)}` : v4("cffPairsNone")}</li>
          <li>{sharedInkCount(panels) ? `${v4("cffSharedInk")} ${sharedInkCount(panels)}` : v4("cffSharedInkNone")}</li>
          <li>{v4("cffRibLoad")}: {ribLoad(panels)}</li>
          <li>{v4("cffQuietHall")}: {quietHallCount(panels)}</li>
          <li>{v4("cffRushLoad")}: {rushLoad(panels)}</li>
          <li>{v4("cffBayWidth")}: {bayWidth(panels)}</li>
          <li>{nextTitle ? `${v4("cffNext")}: ${nextTitle}` : v4("cffNextNone")}</li>
          <li>{busy ? `${v4("cffBusiest")}: ${busy}` : v4("cffBusiestNone")}</li>
          <li>{v4("cffWindow")}: {windowRows.length}</li>
        </ul>
        <section className="c4-cff-reminders" aria-label={v4("cffReminders")}>
          <h3>{v4("cffReminders")}</h3>
          {!reminders.length && <p className="c4-cff-empty">{v4("cffReminderEmpty")}</p>}
          <ul>
            {reminders.map((panel) => (
              <li key={panel.id}>{panel.title} · {lateCoffer(panel, deskBay) ? v4("cffLate") : v4("cffSoon")}</li>
            ))}
          </ul>
        </section>
        <section className="c4-cff-cooling" aria-label={v4("cffCooling")}>
          <h3>{v4("cffCooling")}</h3>
          {!cooling.length && <p className="c4-cff-empty">{v4("cffCoolingEmpty")}</p>}
          <ul>
            {cooling.map((panel) => (
              <li key={panel.id}>{panel.title} · {panel.bay}</li>
            ))}
          </ul>
        </section>
        <form className="c4-cff-form" onSubmit={(event) => {
          event.preventDefault();
          if (viewer) return;
          store(addCoffer(panels, {
            id: `cff-${Date.now()}`,
            title,
            note,
            clerk,
            bay,
            ink,
            gait,
            span: spanValue,
            rib,
            tags: tag,
          }));
          clearDraft();
        }}>
          <input ref={titleRef} className="c4-field" aria-label={v4("cffTitle")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} />
          <input className="c4-field" aria-label={v4("cffNote")} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} />
          <input className="c4-field" aria-label={v4("cffClerk")} value={clerk} disabled={viewer} onChange={(event) => setClerk(event.target.value)} />
          <input className="c4-field" aria-label={v4("cffBay")} inputMode="numeric" value={bay} disabled={viewer} onChange={(event) => setBay(event.target.value)} />
          <select className="c4-select" aria-label={v4("cffInk")} value={ink} disabled={viewer} onChange={(event) => setInk(event.target.value)}>
            <option value="">{v4("cffBlankInk")}</option>
            {INKS.map((item) => <option key={item} value={item}>{inkLabel(v4, item)}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("cffGait")} value={gait} disabled={viewer} onChange={(event) => setGait(event.target.value)}>
            <option value="">{v4("cffBlankGait")}</option>
            {GAITS.map((item) => <option key={item} value={item}>{gaitLabel(v4, item)}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("cffSpan")} value={spanValue} disabled={viewer} onChange={(event) => setSpanValue(event.target.value)}>
            <option value="">{v4("cffBlankSpan")}</option>
            <option value="4">{v4("cffSpan4")}</option>
            <option value="12">{v4("cffSpan12")}</option>
            <option value="24">{v4("cffSpan24")}</option>
          </select>
          <select className="c4-select" aria-label={v4("cffRib")} value={rib} disabled={viewer} onChange={(event) => setRib(event.target.value)}>
            <option value="">{v4("cffResting")}</option>
            <option value="1">1</option>
            <option value="3">3</option>
            <option value="5">5</option>
          </select>
          <input className="c4-field" aria-label={v4("cffTag")} value={tag} disabled={viewer} onChange={(event) => setTag(event.target.value)} />
          <button type="submit" className="c4-btn c4-btn-hot" disabled={viewer}>{v4("cffSave")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetCoffers())}>{v4("cffReset")}</button>
        </form>
        <div className="c4-cff-tools">
          <input ref={searchRef} className="c4-field" aria-label={v4("cffSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
          <input className="c4-field" aria-label={v4("cffDesk")} inputMode="numeric" value={deskBay} onChange={(event) => setDeskBay(event.target.value)} />
          <input className="c4-field" aria-label={v4("cffRoster")} value={roster} disabled={viewer} onChange={(event) => setRoster(event.target.value)} />
          <select className="c4-select" aria-label={v4("cffTrayOpen")} value={tray} onChange={(event) => setTray(event.target.value as CofferTray)}>
            <option value="open">{v4("cffTrayOpen")}</option>
            <option value="held">{v4("cffTrayHeld")}</option>
            <option value="archived">{v4("cffTrayArchived")}</option>
          </select>
          <select className="c4-select" aria-label={v4("cffClerk")} value={clerkOn} onChange={(event) => setClerkFilter(event.target.value)}>
            <option value="all">{v4("cffAll")}</option>
            <option value="blank">{v4("cffBlank")}</option>
            {clerks.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("cffInk")} value={inkOn} onChange={(event) => setInkFilter(event.target.value)}>
            <option value="all">{v4("cffAll")}</option>
            <option value="blank">{v4("cffBlankInk")}</option>
            {INKS.map((item) => <option key={item} value={item}>{inkLabel(v4, item)}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("cffGait")} value={gaitOn} onChange={(event) => setGaitFilter(event.target.value)}>
            <option value="all">{v4("cffAll")}</option>
            <option value="blank">{v4("cffBlankGait")}</option>
            {GAITS.map((item) => <option key={item} value={item}>{gaitLabel(v4, item)}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("cffBay")} value={bayOn} onChange={(event) => setBayFilter(event.target.value)}>
            <option value="all">{v4("cffAll")}</option>
            <option value="blank">{v4("cffBlank")}</option>
            <option value="early">{v4("cffEarly")}</option>
            <option value="mid">{v4("cffMid")}</option>
            <option value="late">{v4("cffLateBand")}</option>
            <option value="peak">{v4("cffPeakPick")}</option>
            <option value="quiet">{v4("cffQuiet")}</option>
            {["1", "2", "3", "4", "5", "6", "7", "8"].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("cffSpan")} value={spanOn} onChange={(event) => setSpanFilter(event.target.value)}>
            <option value="all">{v4("cffAll")}</option>
            <option value="blank">{v4("cffBlankSpan")}</option>
            <option value="4">4</option>
            <option value="12">12</option>
            <option value="24">24</option>
          </select>
          <select className="c4-select" aria-label={v4("cffRib")} value={ribOn} onChange={(event) => setRibFilter(event.target.value)}>
            <option value="all">{v4("cffAll")}</option>
            <option value="blank">{v4("cffResting")}</option>
            <option value="1">1</option>
            <option value="3">3</option>
            <option value="5">5</option>
          </select>
          <button type="button" className="c4-chip" data-on={rushOnly ? "1" : "0"} onClick={() => setRushOnly((on) => !on)}>{v4("cffRush")}</button>
          <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((on) => !on)}>{v4("cffHouseShare")}</button>
          <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((on) => !on)}>{v4("cffQuiet")}</button>
          <button type="button" className="c4-chip" data-on={restingOnly ? "1" : "0"} onClick={() => setRestingOnly((on) => !on)}>{v4("cffResting")}</button>
          <button type="button" className="c4-chip" data-on={order === "clerk" ? "1" : "0"} onClick={() => setOrder((mode) => (mode === "bay" ? "clerk" : "bay"))}>{order === "clerk" ? v4("cffSortClerk") : v4("cffSortBay")}</button>
          <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "airy" ? "tight" : "airy")}>{density === "tight" ? v4("cffDensityTight") : v4("cffDensityAiry")}</button>
          <button type="button" className="c4-chip" data-on={board === "index" ? "1" : "0"} onClick={() => setBoard((current) => (current === "hall" ? "index" : "hall"))}>{board === "index" ? v4("cffBoardIndex") : v4("cffBoardHall")}</button>
        </div>
        <form className="c4-cff-views" onSubmit={(event) => {
          event.preventDefault();
          if (viewer) return;
          storeViews(addCofferView(views, {
            id: `view-${Date.now()}`,
            name: viewName,
            tray,
            query,
            clerk: clerkOn,
            ink: inkOn,
            gait: gaitOn,
            bay: bayOn,
            span: spanOn,
            rib: ribOn,
          }));
          setViewName("");
        }}>
          <input className="c4-field" aria-label={v4("cffViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
          <button type="submit" className="c4-btn" disabled={viewer}>{v4("cffSaveView")}</button>
          {views.map((view) => (
            <span key={view.id}>
              <button type="button" className="c4-chip" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropCofferView(views, view.id))}>{v4("cffDropView")}</button>
            </span>
          ))}
        </form>
        <div className="c4-cff-bulk">
          <select className="c4-select" aria-label={v4("cffBulkInk")} value={moveInk} disabled={viewer} onChange={(event) => setMoveInk(event.target.value)}>
            {INKS.map((item) => <option key={item} value={item}>{inkLabel(v4, item)}</option>)}
          </select>
          <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCofferInk(panels, picked, moveInk))}>{v4("cffBulkInk")}</button>
          <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCofferPin(panels, picked, true))}>{v4("cffBulkPin")}</button>
          <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCofferArchive(panels, picked, true))}>{v4("cffBulkArchive")}</button>
          <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCofferGait(panels, picked, "rush"))}>{v4("cffBulkGait")}</button>
          <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCofferTag(panels, picked, "d"))}>{v4("cffBulkTag")}</button>
          <button type="button" className="c4-btn" onClick={() => download("coffer-panels.csv", coffersCsv(panels, deskBay))}>{v4("cffCsv")}</button>
        </div>
        <ol className="c4-cff-list" data-board={board}>
          {rows.map((panel, index) => {
            const on = index === focus && board === "hall";
            return (
              <li key={panel.id} data-focus={on ? "1" : "0"} data-gilt={panel.gilt ? "1" : "0"} data-peak={peakBay(panel.bay) ? "1" : "0"} data-quiet={quietBay(panel.bay) ? "1" : "0"} data-cooling={coolingCoffer(panel) ? "1" : "0"}>
                <label className="c4-row">
                  <input type="checkbox" checked={picked.includes(panel.id)} disabled={viewer} onChange={() => setPicked((ids) => ids.includes(panel.id) ? ids.filter((id) => id !== panel.id) : [...ids, panel.id])} />
                  {editing === panel.id ? (
                    <input className="c4-field" aria-label={v4("cffEdit")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} onBlur={() => { if (!viewer) store(editCoffer(panels, panel.id, draft)); setEditing(""); }} />
                  ) : (
                    <button type="button" className="c4-cff-title" onClick={() => { setFocus(index); setEditing(panel.id); setDraft(panel.title); setNoteDraft(panel.note); }}>{panel.title}</button>
                  )}
                </label>
                <input className="c4-field" aria-label={v4("cffEditNote")} value={editing === `${panel.id}-note` ? noteDraft : panel.note} disabled={viewer} onFocus={() => { setEditing(`${panel.id}-note`); setNoteDraft(panel.note); }} onChange={(event) => setNoteDraft(event.target.value)} onBlur={() => { if (!viewer) store(editCofferNote(panels, panel.id, noteDraft)); setEditing(""); }} />
                <span>{panel.clerk || v4("cffBlankClerk")}</span>
                <span>{panel.bay ?? v4("cffBlank")}</span>
                <span>{inkLabel(v4, panel.ink)}</span>
                <span>{gaitLabel(v4, panel.gait)}</span>
                <span>{spanLabel(v4, panel.span)}</span>
                <span>{panel.rib}</span>
                <span>{panel.tags.join(" ")}</span>
                <span>{gapLabel(v4, panel.bay, deskBay)}</span>
                <span>{auditLabel(v4, panel.audit)}</span>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCofferPin(panels, panel.id, !panel.pinned))}>{panel.pinned ? v4("cffUnpin") : v4("cffPin")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(snoozeCoffer(panels, panel.id))}>{v4("cffSpan")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCofferHold(panels, panel.id, !panel.held))}>{panel.held ? v4("cffResume") : v4("cffHold")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleGait(panels, panel.id))}>{v4("cffGait")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCofferGilt(panels, panel.id, !panel.gilt))}>{panel.gilt ? v4("cffUngilt") : v4("cffGilt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCofferArchive(panels, panel.id, !panel.archived))}>{panel.archived ? v4("cffRestore") : v4("cffArchive")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addCofferTag(panels, panel.id, "e"))}>{v4("cffTag")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCofferRib(panels, panel.id, panel.rib === 5 ? "1" : panel.rib === 3 ? "5" : "3"))}>{v4("cffRib")}</button>
                <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(cofferCopy(panel, deskBay)); setCopied(panel.id); }}>{copied === panel.id ? v4("cffCopied") : v4("cffCopy")}</button>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

export function RosetteMarks({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ communications?: CommRow[] }>("/api/admin/communications?take=40");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("all");
  const [tone, setTone] = useState("all");
  const [review, setReview] = useState<RosetteReview>("all");
  const [shape, setShape] = useState<RosetteShape>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<GlanceRow[]>(() => (data.data?.communications || []).map((row, index) => ({
    id: row.id || `log-${index}`,
    label: textField(row.trader) || textField(row.title),
    note: {
      trader: textField(row.trader),
      type: textField(row.type),
      worker: textField(row.workerName),
      title: textField(row.title),
    } satisfies RosetteValue,
  })), [data.data?.communications]);
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
    const present = presentRosetteLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenRosettes(readJson(RST_KEY, []), present);
    const nextReviewed = readReviewedRosettes(readJson(RST_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(RST_KEY, nextHidden);
    writeJson(RST_REVIEW_KEY, nextReviewed);
  }, [rows]);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setQuery("");
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const present = presentRosetteLanes(rows);
  const lanes = visibleRosetteLanes(present, hidden, showHidden);
  const laneOn = activeRosetteLane(lane, present);
  const toneOn = activeRosetteTone(tone);
  const shown = visibleRosettes(rows, rosetteLaneArg(laneOn), rosetteToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = rosetteState(row.note);
      const token = state === "set" ? rosetteLane(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return lanes.includes(token);
    });
  const lead = leadingRosette(rows);
  const toneLead = leadingRosetteTone(rows);
  const shared = sharedRosetteCount(rows);
  const stitched = stitchedRosetteCount(rows);
  const bars = rosetteLanes(rows).filter((line) => line.lane);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  const known = rows.filter((row) => rosetteState(row.note) === "set").length;
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(RST_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedRosettes(next, ids);
    setReviewed(saved);
    writeJson(RST_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-rst" aria-label={v4("rstTitle")} data-rosettes="1" data-role={role} data-keyed={stitched ? "1" : "0"}>
      <div className="c4-rst-sheet">
        <header className="c4-rst-mast">
          <p className="c4-rst-plate" data-logo="mono">{v4("rstLogo")}</p>
          <div>
            <p className="c4-rst-kicker">{v4("rstSub")}</p>
            <h2 className="c4-title">{v4("rstTitle")}</h2>
          </div>
        </header>
        <p className="c4-rst-time">{v4("rstKept")}</p>
        <div className="c4-rst-body">
          <p className="c4-rst-rules">{v4("rstHint")}</p>
          <p className="c4-meta">{v4("rstEscape")}</p>
          {viewer && <p className="c4-rst-notice" data-viewer="1">{v4("rstViewer")}</p>}
          {data.error && <p className="c4-rst-empty" role="alert">{v4("rstFailed")}</p>}
          {data.loading && <p className="c4-meta">{v4("rstLoading")}</p>}
          {!data.loading && !rows.length && <p className="c4-rst-empty">{v4("rstEmpty")}</p>}
          {shared > 0 && <p className="c4-rst-notice" role="status">{v4("rstNotice")} · {shared}</p>}
          <ol className="c4-rst-ledger" aria-label={v4("rstKpi")}>
            <li><span>{v4("rstSet")}</span><strong>{known}</strong></li>
            <li><span>{v4("rstClear")}</span><strong>{rows.filter((row) => rosetteState(row.note) === "clear").length}</strong></li>
            <li><span>{v4("rstStitch")}</span><strong>{stitched}</strong></li>
            <li><span>{v4("rstWide")}</span><strong>{wideRosetteCount(rows)}</strong></li>
            <li><span>{v4("rstBright")}</span><strong>{brightRosetteCount(rows)}</strong></li>
            <li><span>{v4("rstMargin")}</span><strong>{marginCount(rows)}</strong></li>
            <li><span>{v4("rstCipher")}</span><strong>{cipherCount(rows)}</strong></li>
            <li><span>{v4("rstBell")}</span><strong>{bellCount(rows)}</strong></li>
            <li><span>{v4("rstShare")}</span><strong>{rosetteShare(stitched, Math.max(1, known))}%</strong></li>
          </ol>
          <p className="c4-meta">{v4("rstLead")}: {laneLabel(v4, lead)} · {v4("rstToneLead")}: {toneLabel(v4, toneLead)}</p>
          <ol className="c4-rst-index" aria-label={v4("rstKpi")}>
            {bars.map((bar) => (
              <li key={bar.lane} data-tone={bar.lane === "margin" ? "gold" : bar.lane === "bell" ? "ink" : "ivory"}>
                <span>{laneLabel(v4, bar.lane)}</span>
                <b style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
                <em>{bar.count}</em>
              </li>
            ))}
          </ol>
          <div className="c4-rst-tools">
            <input ref={searchRef} className="c4-field" aria-label={v4("rstSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
            <select className="c4-select" aria-label={v4("rstMargin")} value={laneOn} onChange={(event) => setLane(event.target.value)}>
              <option value="all">{v4("rstAll")}</option>
              {present.map((name) => <option key={name} value={name}>{laneLabel(v4, name)}</option>)}
            </select>
            <select className="c4-select" aria-label={v4("rstBright")} value={toneOn} onChange={(event) => setTone(event.target.value)}>
              <option value="all">{v4("rstAll")}</option>
              <option value="bright">{v4("rstBright")}</option>
              <option value="even">{v4("rstEven")}</option>
              <option value="dim">{v4("rstDim")}</option>
              <option value="hush">{v4("rstHush")}</option>
              <option value="mist">{v4("rstMist")}</option>
            </select>
            <select className="c4-select" aria-label={v4("rstReviewed")} value={review} onChange={(event) => setReview(event.target.value as RosetteReview)}>
              <option value="all">{v4("rstAll")}</option>
              <option value="reviewed">{v4("rstReviewed")}</option>
              <option value="fresh">{v4("rstFresh")}</option>
            </select>
            <select className="c4-select" aria-label={v4("rstShapeAll")} value={shape} onChange={(event) => setShape(event.target.value as RosetteShape)}>
              <option value="all">{v4("rstShapeAll")}</option>
              <option value="stitch">{v4("rstShapeStitch")}</option>
              <option value="wide">{v4("rstShapeWide")}</option>
              <option value="margin">{v4("rstShapeMargin")}</option>
              <option value="cipher">{v4("rstShapeCipher")}</option>
            </select>
            <button type="button" className="c4-btn" onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("rstHide") : v4("rstShow")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkRosetteReview(reviewed, shown.map((row) => row.id), true))}>{v4("rstBulkReview")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkRosetteReview(reviewed, shown.map((row) => row.id), false))}>{v4("rstBulkClear")}</button>
            <button type="button" className="c4-btn" onClick={() => download("rosette-lanes.csv", rosettesCsv(rows))}>{v4("rstCsv")}</button>
            <button type="button" className="c4-btn" onClick={() => download("rosette-rows.csv", rosetteRowsCsv(rows, reviewed))}>{v4("rstRowCsv")}</button>
            <Link href={crmv4Href(base, "logs")}>{v4("rstLogs")}</Link>
          </div>
          <ul className="c4-rst-lanes">
            {LANES.map((name) => (
              <li key={name}>
                <button type="button" className="c4-chip" data-on={hidden.includes(name) ? "1" : "0"} disabled={viewer || !present.includes(name)} onClick={() => storeHidden(toggleRosette(hidden, name))}>{laneLabel(v4, name)}</button>
              </li>
            ))}
          </ul>
          <ol className="c4-rst-book">
            {shown.map((row) => (
              <li key={row.id} data-keyed={stitchedRosette(row.note) ? "1" : "0"} data-wide={wideRosette(row.note) ? "1" : "0"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"}>
                <Link href={crmv4Href(base, "logs")}>{row.label}</Link>
                <span>{rosetteMark(row.note)}</span>
                <span>{laneLabel(v4, rosetteLane(row.note))}</span>
                <span>{toneLabel(v4, rosetteTone(row.note))}</span>
                <span>{v4("rstStep")} {rosetteStep(row.note)}</span>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleRosetteReview(reviewed, row.id))}>{v4("rstReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(rosetteCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("rstCopied") : v4("rstCopy")}</button>
              </li>
            ))}
          </ol>
          <p className="c4-rst-rules">{v4("rstRules")} · {v4("rstStitchMark")}</p>
        </div>
      </div>
    </section>
  );
}
