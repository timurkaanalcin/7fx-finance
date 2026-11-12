"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  ACW_KEY,
  ACW_REVIEW_KEY,
  TRS_DENSITY_KEY,
  TRS_KEY,
  TRS_VIEW_KEY,
  activeBay,
  activeBell,
  activeCadence,
  activeSpan,
  activeSteward,
  activeWaferBand,
  activeWaferTone,
  activeWeave,
  addStall,
  addStallMark,
  addStallView,
  adjacentStallCount,
  bayArg,
  bayGap,
  bellArg,
  bulkStallCadence,
  bulkStallClose,
  bulkStallMark,
  bulkStallPin,
  bulkStallWeave,
  bulkWaferReview,
  busiestSteward,
  cadenceArg,
  catalogWafer,
  catalogWaferCount,
  clashBayCount,
  cycleCadence,
  densityOf,
  dropStallView,
  editStall,
  editStallNote,
  fairSteward,
  giltWaferCount,
  houseWeave,
  lateShare,
  lateStall,
  leadingWafer,
  leadingWaferTone,
  moveFocus,
  nextStall,
  pairStewardCount,
  peakBay,
  pinFocused,
  presentWafers,
  quietBay,
  quietHouseCount,
  readHiddenWafers,
  readReviewedWafers,
  readStallViews,
  readStalls,
  reminderStalls,
  resetStalls,
  setStallClose,
  setStallHold,
  setStallPin,
  setStallWax,
  sharedWaferCount,
  soonStall,
  sortMode,
  sortStalls,
  spanArg,
  spanClashCount,
  stallCopy,
  stallCounts,
  stallShare,
  stallStewards,
  stallTimeline,
  stallWeaves,
  stallsCsv,
  stewardArg,
  suggestSpan,
  suggestSteward,
  suggestWeave,
  toggleWafer,
  toggleWaferReview,
  usedBays,
  visibleStalls,
  visibleWaferBands,
  visibleWaferCustomers,
  visitLoad,
  waferBand,
  waferBandArg,
  waferBands,
  waferCopy,
  waferOf,
  waferRowsCsv,
  waferShare,
  waferState,
  waferTone,
  waferToneArg,
  wafersCsv,
  waxFocused,
  waxLoad,
  weaveArg,
  wideWaferCount,
  windowStalls,
  baySpan,
  type StallDensity,
  type StallSort,
  type StallTray,
  type StallView,
  type TranseptStall,
  type WaferRow,
  type WaferShape,
} from "@/lib/crmv4/round211";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  accountType?: string | null;
};

type GlanceRow = WaferRow & { id: string };

const WEAVES = ["ivory", "graphite", "gold"] as const;
const CADENCES = ["note", "ping", "visit"] as const;
const BANDS = ["house", "silver", "gilt", "demo", "plain"] as const;

function weaveLabel(v4: V4, weave: string): string {
  if (weave === "ivory" || weave === "IVORY") return v4("trsIvory");
  if (weave === "graphite" || weave === "GRAPHITE") return v4("trsGraphite");
  if (weave === "gold" || weave === "GOLD") return v4("trsGold");
  return v4("trsBlankWeave");
}

function cadenceLabel(v4: V4, cadence: string): string {
  if (cadence === "note") return v4("trsNoteWord");
  if (cadence === "ping") return v4("trsPing");
  if (cadence === "visit") return v4("trsVisit");
  return v4("trsBlankCadence");
}

function spanLabel(v4: V4, span: number | null): string {
  if (span === 1) return v4("trsSpan1");
  if (span === 3) return v4("trsSpan3");
  if (span === 5) return v4("trsSpan5");
  return v4("trsBlankSpan");
}

function bellLabel(v4: V4, bell: number | null): string {
  if (bell === 5) return v4("trsBell5");
  if (bell === 10) return v4("trsBell10");
  if (bell === 20) return v4("trsBell20");
  return v4("trsBlankBell");
}

function bandLabel(v4: V4, name: string): string {
  if (name === "house") return v4("acwHouse");
  if (name === "silver") return v4("acwSilver");
  if (name === "gilt") return v4("acwGilt");
  if (name === "demo") return v4("acwDemo");
  if (name === "plain") return v4("acwPlain");
  if (name === "blank") return v4("acwClear");
  return v4("acwUnmarked");
}

function waferToneLabel(v4: V4, name: string): string {
  if (name === "gilt") return v4("acwGilt");
  if (name === "ink") return v4("acwInk");
  if (name === "ivory") return v4("acwIvoryTone");
  if (name === "mist") return v4("acwMist");
  if (name === "plain") return v4("acwTonePlain");
  return v4("acwUnmarked");
}

function auditLabel(v4: V4, audit: string): string {
  const key = {
    save: "trsAuditSave",
    edit: "trsAuditEdit",
    cadence: "trsAuditCadence",
    pin: "trsAuditPin",
    unpin: "trsAuditUnpin",
    hold: "trsAuditHold",
    lift: "trsAuditLift",
    close: "trsAuditClose",
    open: "trsAuditOpen",
    weave: "trsAuditWeave",
    mark: "trsAuditMark",
    wax: "trsAuditWax",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, bay: number | null, desk: string): string {
  const gap = bayGap(bay, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("trsPast")} ${gap}`;
  if (gap < 0) return `${v4("trsAhead")} ${Math.abs(gap)}`;
  return v4("trsDue");
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

export function TranseptStalls({ v4 }: { v4: V4 }) {
  const [stalls, setStalls] = useState<TranseptStall[]>([]);
  const [views, setViews] = useState<StallView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [steward, setSteward] = useState("");
  const [bay, setBay] = useState("");
  const [weave, setWeave] = useState("");
  const [cadence, setCadence] = useState("");
  const [span, setSpan] = useState("");
  const [bellValue, setBellValue] = useState("");
  const [mark, setMark] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<StallTray>("open");
  const [stewardFilter, setStewardFilter] = useState("all");
  const [weaveFilter, setWeaveFilter] = useState("all");
  const [cadenceFilter, setCadenceFilter] = useState("all");
  const [bayFilter, setBayFilter] = useState("all");
  const [spanFilter, setSpanFilter] = useState("all");
  const [bellFilter, setBellFilter] = useState("all");
  const [visitOnly, setVisitOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [unwaxOnly, setUnwaxOnly] = useState(false);
  const [board, setBoard] = useState<"arcade" | "timeline">("arcade");
  const [order, setOrder] = useState<StallSort>("bay");
  const [density, setDensity] = useState<StallDensity>("roomy");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [deskBay, setDeskBay] = useState("");
  const [moveWeave, setMoveWeave] = useState("graphite");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<() => void>(() => {});
  const waxRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readStalls(readJson(TRS_KEY, []));
    const saved = readStallViews(readJson(TRS_VIEW_KEY, []));
    setStalls(next);
    setViews(saved);
    setDensity(densityOf(readJson(TRS_DENSITY_KEY, "roomy")));
    writeJson(TRS_KEY, next);
    writeJson(TRS_VIEW_KEY, saved);
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: TranseptStall[]) {
    const saved = readStalls(next);
    setStalls(saved);
    writeJson(TRS_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((stall) => stall.id === id)));
  }
  function storeViews(next: StallView[]) {
    const saved = readStallViews(next);
    setViews(saved);
    writeJson(TRS_VIEW_KEY, saved);
  }
  function storeDensity(next: StallDensity) {
    setDensity(next);
    writeJson(TRS_DENSITY_KEY, next);
  }
  const stewards = stallStewards(stalls);
  const weaves = stallWeaves(stalls);
  const bars = WEAVES.map((item) => ({ weave: item.toUpperCase(), count: stalls.filter((stall) => stall.weave === item.toUpperCase()).length })).filter((row) => row.count > 0);
  const stewardOn = activeSteward(stewardFilter, stewards);
  const weaveOn = activeWeave(weaveFilter, weaves);
  const cadenceOn = activeCadence(cadenceFilter, ["note", "ping", "visit"]);
  const bayOn = activeBay(bayFilter);
  const spanOn = activeSpan(spanFilter);
  const bellOn = activeBell(bellFilter);
  const pickedBay = bayArg(bayOn);
  const shown = sortStalls(visibleStalls(
    stalls,
    tray,
    query,
    stewardArg(stewardOn),
    weaveArg(weaveOn),
    cadenceArg(cadenceOn),
    pickedBay.exact,
    pickedBay.pick,
    spanArg(spanOn),
    bellArg(bellOn),
    visitOnly,
    peakOnly,
    houseOnly,
    quietOnly,
    unwaxOnly,
  ), order);
  const timeline = stallTimeline(stalls, query);
  const counts = stallCounts(stalls, deskBay);
  const clashes = clashBayCount(stalls);
  const spans = spanClashCount(stalls);
  const neighbors = adjacentStallCount(stalls);
  const nextId = nextStall(stalls, deskBay);
  const nextRow = stalls.find((stall) => stall.id === nextId);
  const suggestedWeave = suggestWeave(stalls);
  const suggestedSteward = suggestSteward(stalls);
  const suggestedSpan = suggestSpan(stalls);
  const fair = fairSteward(stalls, roster);
  const busy = busiestSteward(stalls);
  const reminders = reminderStalls(stalls, deskBay);
  const windowRows = windowStalls(stalls, deskBay);
  const share = lateShare(stalls, deskBay);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  pinRef.current = () => {
    if (viewer) return;
    const ids = (board === "timeline" ? timeline : shown).map((stall) => stall.id);
    store(pinFocused(stalls, ids, focus));
  };
  waxRef.current = () => {
    if (viewer) return;
    const ids = (board === "timeline" ? timeline : shown).map((stall) => stall.id);
    store(waxFocused(stalls, ids, focus));
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
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        waxRef.current();
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
    setSteward("");
    setBay("");
    setWeave("");
    setCadence("");
    setSpan("");
    setBellValue("");
    setMark("");
    setQuery("");
    setEditing("");
  }
  function applyView(view: StallView) {
    setTray(view.tray);
    setQuery(view.query);
    setStewardFilter(view.steward);
    setWeaveFilter(view.weave);
    setCadenceFilter(view.cadence);
    setBayFilter(view.bay);
    setSpanFilter(view.span);
    setBellFilter(view.bell);
  }
  const rows = board === "timeline" ? timeline : shown;
  return (
    <section className="c4-trs" aria-label={v4("trsTitle")} data-stalls="1" data-role={role} data-density={density}>
      <div className="c4-trs-sheet">
        <header className="c4-trs-mast">
          <p className="c4-trs-spine">{v4("trsSpine")}</p>
          <div>
            <p className="c4-trs-kicker">{v4("trsSub")}</p>
            <h2 className="c4-title">{v4("trsTitle")}</h2>
          </div>
          <p className="c4-trs-plate" data-logo="mono">{v4("trsLogo")}</p>
        </header>
        <div className="c4-trs-body">
          <p className="c4-trs-rules">{v4("trsHint")}</p>
          <p className="c4-meta">{v4("trsLocal")}</p>
          <p className="c4-meta">{v4("trsNew")} {v4("trsSlash")} {v4("trsEscape")} {v4("trsKeys")} {v4("trsPinKey")} {v4("trsWaxKey")} {v4("trsBoardKey")}</p>
          {viewer && <p className="c4-trs-notice" data-viewer="1">{v4("trsViewer")}</p>}
          {counts.peak > 0 && (
            <p className="c4-trs-notice" role="status">
              {v4("trsNotice")} · {counts.peak}
              <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("trsNoticeAll") : v4("trsNoticePeak")}</button>
            </p>
          )}
          {counts.late > 0 && <p className="c4-trs-notice" role="status" data-late="1">{v4("trsLateNotice")} · {counts.late}</p>}
          <ol className="c4-trs-ledger" aria-label={v4("trsKpi")}>
            <li><span>{v4("trsOpen")}</span><strong>{counts.open}</strong></li>
            <li><span>{v4("trsHeld")}</span><strong>{counts.held}</strong></li>
            <li><span>{v4("trsClosed")}</span><strong>{counts.closed}</strong></li>
            <li><span>{v4("trsPinned")}</span><strong>{counts.pinned}</strong></li>
            <li><span>{v4("trsPeak")}</span><strong>{counts.peak}</strong></li>
            <li><span>{v4("trsLate")}</span><strong>{counts.late}</strong></li>
            <li><span>{v4("trsSoon")}</span><strong>{counts.soon}</strong></li>
            <li><span>{v4("trsWax")}</span><strong>{counts.wax}</strong></li>
            <li><span>{v4("trsHouseShare")}</span><strong>{stallShare(counts.house, stalls.length)}%</strong></li>
            <li><span>{v4("trsLateShare")}</span><strong>{share}%</strong></li>
          </ol>
          <div className="c4-trs-sla" aria-label={v4("trsLateShare")}>
            <span>{v4("trsLateShare")}</span>
            <div className="c4-trs-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></div>
          </div>
          <div className="c4-trs-rail" aria-label={v4("trsWeaves")}>
            {bars.map((bar) => (
              <div key={bar.weave} className="c4-trs-meter" data-weave={bar.weave.toLowerCase()}>
                <button type="button" className="c4-btn" onClick={() => setWeaveFilter(bar.weave)}>{weaveLabel(v4, bar.weave)} · {bar.count}</button>
                <div className="c4-trs-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
              </div>
            ))}
            {!bars.length && <p className="c4-trs-empty">{v4("trsEmpty")}</p>}
          </div>
          <div className="c4-trs-suggest">
            <p>{v4("trsSuggestWeave")} · {weaveLabel(v4, suggestedWeave)}</p>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setWeave(suggestedWeave.toLowerCase())}>{v4("trsUseWeave")}</button>
            <p>{v4("trsSuggestSteward")} · {suggestedSteward || v4("trsBlankSteward")}</p>
            <button type="button" className="c4-btn" disabled={viewer || !suggestedSteward} onClick={() => setSteward(suggestedSteward)}>{v4("trsUseSteward")}</button>
            <p>{v4("trsSuggestSpan")} · {spanLabel(v4, suggestedSpan)}</p>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setSpan(String(suggestedSpan))}>{v4("trsUseSpan")}</button>
            <p>{v4("trsAssign")} · {fair || v4("trsBlankSteward")}</p>
            <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setSteward(fair)}>{v4("trsAssign")}</button>
          </div>
          <p className="c4-meta">{v4("trsBays")} · {usedBays(stalls)}</p>
          <p className="c4-meta">{clashes ? `${v4("trsClash")} · ${clashes}` : v4("trsClashNone")}</p>
          <p className="c4-meta">{spans ? `${v4("trsSpanClash")} · ${spans}` : v4("trsSpanClashNone")}</p>
          <p className="c4-meta">{neighbors ? `${v4("trsAdjacent")} · ${neighbors}` : v4("trsAdjacentNone")}</p>
          <p className="c4-meta">{pairStewardCount(stalls) ? `${v4("trsPairs")} · ${pairStewardCount(stalls)}` : v4("trsPairsNone")}</p>
          <p className="c4-meta">{`${v4("trsWaxLoad")} · ${waxLoad(stalls)}`}</p>
          <p className="c4-meta">{`${v4("trsQuietHouse")} · ${quietHouseCount(stalls)}`}</p>
          <p className="c4-meta">{`${v4("trsVisitLoad")} · ${visitLoad(stalls)}`}</p>
          <p className="c4-meta">{`${v4("trsBaySpan")} · ${baySpan(stalls)}`}</p>
          <p className="c4-meta">{nextRow ? `${v4("trsNext")} · ${nextRow.title}` : v4("trsNextNone")}</p>
          <p className="c4-meta">{busy ? `${v4("trsBusiest")} · ${busy}` : v4("trsBusiestNone")}</p>
          <div className="c4-trs-reminders" aria-label={v4("trsReminders")}>
            {reminders.length ? reminders.map((stall) => <span key={stall.id}>{stall.title}</span>) : <span>{v4("trsReminderNone")}</span>}
          </div>
          <div className="c4-trs-window" aria-label={v4("trsWindow")}>
            {windowRows.length ? windowRows.map((stall) => <span key={stall.id}>{stall.title}</span>) : <span>{v4("trsWindowNone")}</span>}
          </div>
          <label className="c4-lab">{v4("trsSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("trsSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <div className="c4-trs-filters" role="group" aria-label={v4("trsSearch")}>
            {(["open", "held", "closed"] as const).map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("trsOpenTray") : item === "held" ? v4("trsHeldTray") : v4("trsClosedTray")}</button>
            ))}
            <button type="button" className="c4-chip" data-on={stewardOn === "all" ? "1" : "0"} onClick={() => setStewardFilter("all")}>{v4("trsAll")}</button>
            <button type="button" className="c4-chip" data-on={stewardOn === "blank" ? "1" : "0"} onClick={() => setStewardFilter("blank")}>{v4("trsBlankSteward")}</button>
            {stewards.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={stewardOn === name ? "1" : "0"} onClick={() => setStewardFilter(name)}>{name}</button>
            ))}
            <button type="button" className="c4-chip" data-on={weaveOn === "all" ? "1" : "0"} onClick={() => setWeaveFilter("all")}>{v4("trsWeave")}</button>
            <button type="button" className="c4-chip" data-on={weaveOn === "blank" ? "1" : "0"} onClick={() => setWeaveFilter("blank")}>{v4("trsBlankWeave")}</button>
            {WEAVES.map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={weaveOn === item.toUpperCase() ? "1" : "0"} onClick={() => setWeaveFilter(item)}>{weaveLabel(v4, item)}</button>
            ))}
            <button type="button" className="c4-chip" data-on={cadenceOn === "all" ? "1" : "0"} onClick={() => setCadenceFilter("all")}>{v4("trsCadence")}</button>
            {CADENCES.map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={cadenceOn === item ? "1" : "0"} onClick={() => setCadenceFilter(item)}>{cadenceLabel(v4, item)}</button>
            ))}
            {["all", "blank", "early", "mid", "late", "peak", "quiet", "1", "8"].map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={bayOn === item ? "1" : "0"} onClick={() => setBayFilter(item)}>{item === "all" ? v4("trsBay") : item === "blank" ? v4("trsBlankBay") : item === "early" ? v4("trsEarly") : item === "mid" ? v4("trsMid") : item === "late" ? v4("trsLateBay") : item === "peak" ? v4("trsPeak") : item === "quiet" ? v4("trsQuiet") : item}</button>
            ))}
            {["all", "blank", "1", "3", "5"].map((item) => (
              <button key={`s${item}`} type="button" className="c4-chip" data-on={spanOn === item ? "1" : "0"} onClick={() => setSpanFilter(item)}>{item === "all" ? v4("trsSpan") : item === "blank" ? v4("trsBlankSpan") : spanLabel(v4, Number(item))}</button>
            ))}
            {["all", "blank", "5", "10", "20"].map((item) => (
              <button key={`b${item}`} type="button" className="c4-chip" data-on={bellOn === item ? "1" : "0"} onClick={() => setBellFilter(item)}>{item === "all" ? v4("trsBell") : item === "blank" ? v4("trsBlankBell") : bellLabel(v4, Number(item))}</button>
            ))}
            <button type="button" className="c4-chip" data-on={visitOnly ? "1" : "0"} onClick={() => setVisitOnly((on) => !on)}>{v4("trsVisitOnly")}</button>
            <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((on) => !on)}>{v4("trsPeakOnly")}</button>
            <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((on) => !on)}>{v4("trsHouseOnly")}</button>
            <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((on) => !on)}>{v4("trsQuietOnly")}</button>
            <button type="button" className="c4-chip" data-on={unwaxOnly ? "1" : "0"} onClick={() => setUnwaxOnly((on) => !on)}>{v4("trsUnwaxOnly")}</button>
            <button type="button" className="c4-chip" data-on={order === "bay" ? "1" : "0"} onClick={() => setOrder(sortMode("bay"))}>{v4("trsSortBay")}</button>
            <button type="button" className="c4-chip" data-on={order === "steward" ? "1" : "0"} onClick={() => setOrder(sortMode("steward"))}>{v4("trsSortSteward")}</button>
            <button type="button" className="c4-chip" data-on={density === "roomy" ? "1" : "0"} onClick={() => storeDensity("roomy")}>{v4("trsRoomy")}</button>
            <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity("tight")}>{v4("trsTight")}</button>
            <button type="button" className="c4-chip" data-on={board === "arcade" ? "1" : "0"} onClick={() => setBoard("arcade")}>{v4("trsArcade")}</button>
            <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard("timeline")}>{v4("trsTimeline")}</button>
          </div>
          <form className="c4-trs-form" onSubmit={(event) => {
            event.preventDefault();
            if (viewer) return;
            store(addStall(stalls, { id: `trs-${Date.now()}`, title, note, steward, bay, weave, cadence, span, bell: bellValue, marks: mark }));
            clearDraft();
          }}>
            <label className="c4-lab">{v4("trsLine")}<input ref={titleRef} className="c4-field" aria-label={v4("trsLine")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
            <label className="c4-lab">{v4("trsNote")}<input className="c4-field" aria-label={v4("trsNote")} value={note} onChange={(event) => setNote(event.target.value)} /></label>
            <label className="c4-lab">{v4("trsSteward")}<input className="c4-field" aria-label={v4("trsSteward")} value={steward} onChange={(event) => setSteward(event.target.value)} /></label>
            <label className="c4-lab">{v4("trsBay")}<input className="c4-field" aria-label={v4("trsBay")} value={bay} onChange={(event) => setBay(event.target.value)} /></label>
            <label className="c4-lab">{v4("trsWeave")}<input className="c4-field" aria-label={v4("trsWeave")} value={weave} onChange={(event) => setWeave(event.target.value)} /></label>
            <label className="c4-lab">{v4("trsCadence")}<input className="c4-field" aria-label={v4("trsCadence")} value={cadence} onChange={(event) => setCadence(event.target.value)} /></label>
            <label className="c4-lab">{v4("trsSpan")}<input className="c4-field" aria-label={v4("trsSpan")} value={span} onChange={(event) => setSpan(event.target.value)} /></label>
            <label className="c4-lab">{v4("trsBell")}<input className="c4-field" aria-label={v4("trsBell")} value={bellValue} onChange={(event) => setBellValue(event.target.value)} /></label>
            <label className="c4-lab">{v4("trsMark")}<input className="c4-field" aria-label={v4("trsMark")} value={mark} onChange={(event) => setMark(event.target.value)} /></label>
            <button type="submit" className="c4-btn" disabled={viewer}>{v4("trsSave")}</button>
          </form>
          <label className="c4-lab">{v4("trsDeskBay")}<input className="c4-field" aria-label={v4("trsDeskBay")} value={deskBay} onChange={(event) => setDeskBay(event.target.value)} /></label>
          <label className="c4-lab">{v4("trsRoster")}<input className="c4-field" aria-label={v4("trsRoster")} value={roster} onChange={(event) => setRoster(event.target.value)} /></label>
          <div className="c4-trs-views">
            <label className="c4-lab">{v4("trsViewName")}<input className="c4-field" aria-label={v4("trsViewName")} value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
              const name = viewName.trim();
              if (!name) return;
              storeViews(addStallView(views, { id: `view-${Date.now()}`, name, tray, query, steward: stewardOn, weave: weaveOn, cadence: cadenceOn, bay: bayOn, span: spanOn, bell: bellOn }));
              setViewName("");
            }}>{v4("trsSaveView")}</button>
            {views.map((view) => (
              <span key={view.id}>
                <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
                <button type="button" className="c4-btn" disabled={viewer} aria-label={v4("trsDropView")} onClick={() => storeViews(dropStallView(views, view.id))}>×</button>
              </span>
            ))}
          </div>
          <div className="c4-trs-bulk">
            <label className="c4-lab">{v4("trsBulkWeave")}<input className="c4-field" aria-label={v4("trsBulkWeave")} value={moveWeave} onChange={(event) => setMoveWeave(event.target.value)} /></label>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkStallWeave(stalls, picked, moveWeave))}>{v4("trsBulkWeave")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkStallPin(stalls, picked, true))}>{v4("trsBulkPin")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkStallClose(stalls, picked, true))}>{v4("trsBulkClose")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkStallMark(stalls, picked, mark))}>{v4("trsBulkMark")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkStallCadence(stalls, picked, cadence))}>{v4("trsBulkCadence")}</button>
            <button type="button" className="c4-btn" onClick={() => download("transept-stalls.csv", stallsCsv(stalls, deskBay))}>{v4("trsCsv")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetStalls())}>{v4("trsReset")}</button>
          </div>
          {!rows.length && <p className="c4-trs-empty">{v4("trsEmpty")}</p>}
          <ol className={board === "timeline" ? "c4-trs-time" : "c4-trs-book"}>
            {rows.map((stall, index) => (
              <li key={stall.id} data-focus={focus === index ? "1" : "0"} data-late={lateStall(stall, deskBay) ? "1" : "0"} data-soon={soonStall(stall) ? "1" : "0"} data-peak={peakBay(stall.bay) ? "1" : "0"} data-quiet={quietBay(stall.bay) ? "1" : "0"} data-house={houseWeave(stall.weave) ? "1" : "0"} data-pinned={stall.pinned ? "1" : "0"} data-wax={stall.wax ? "1" : "0"}>
                <label className="c4-check"><input type="checkbox" checked={picked.includes(stall.id)} onChange={() => setPicked((ids) => ids.includes(stall.id) ? ids.filter((id) => id !== stall.id) : [...ids, stall.id])} /><span>{stall.bay ?? "—"}</span></label>
                <div>
                  {editing === stall.id ? (
                    <div className="c4-row">
                      <input className="c4-field" aria-label={v4("trsLine")} value={draft} onChange={(event) => setDraft(event.target.value)} />
                      <input className="c4-field" aria-label={v4("trsNote")} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} />
                      <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(editStallNote(editStall(stalls, stall.id, draft), stall.id, noteDraft)); setEditing(""); }}>{v4("trsSave")}</button>
                    </div>
                  ) : (
                    <>
                      <strong>{stall.title}</strong>
                      <span className="c4-meta">{stall.steward || v4("trsBlankSteward")} · {weaveLabel(v4, stall.weave)} · {cadenceLabel(v4, stall.cadence)} · {spanLabel(v4, stall.span)} · {bellLabel(v4, stall.bell)} · {gapLabel(v4, stall.bay, deskBay)}</span>
                      {stall.note && <p>{stall.note}</p>}
                      {!!stall.marks.length && <p className="c4-meta">{stall.marks.join(" ")}</p>}
                      {stall.audit && <p className="c4-meta">{auditLabel(v4, stall.audit)}</p>}
                    </>
                  )}
                  <div className="c4-row">
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setStallPin(stalls, stall.id, !stall.pinned))}>{stall.pinned ? v4("trsUnpin") : v4("trsPin")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setStallHold(stalls, stall.id, !stall.held))}>{stall.held ? v4("trsLift") : v4("trsHold")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleCadence(stalls, stall.id))}>{v4("trsCadence")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addStallMark(stalls, stall.id, mark))}>{v4("trsMark")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setStallClose(stalls, stall.id, !stall.closed))}>{stall.closed ? v4("trsReopen") : v4("trsClose")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setStallWax(stalls, stall.id, stall.wax ? 0 : 1))}>{stall.wax ? v4("trsWaxOff") : v4("trsWaxOn")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(stall.id); setDraft(stall.title); setNoteDraft(stall.note); }}>{v4("trsEdit")}</button>
                    <button type="button" className="c4-btn" onClick={() => { const line = stallCopy(stall, deskBay); void navigator.clipboard?.writeText(line); setCopied(stall.id); }}>{copied === stall.id ? v4("trsCopied") : v4("trsCopy")}</button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <p className="c4-trs-rules">{v4("trsRules")}</p>
        </div>
      </div>
    </section>
  );
}

export function AccountWafers({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [band, setBand] = useState("all");
  const [tone, setTone] = useState("all");
  const [shape, setShape] = useState<WaferShape>("all");
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
    note: { accountType: user.accountType ?? null },
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
    const present = presentWafers(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenWafers(readJson(ACW_KEY, []), present);
    const nextReviewed = readReviewedWafers(readJson(ACW_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(ACW_KEY, nextHidden);
    writeJson(ACW_REVIEW_KEY, nextReviewed);
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
  const present = presentWafers(rows);
  const bands = visibleWaferBands(present, hidden, showHidden);
  const bandOn = activeWaferBand(band, present);
  const toneOn = activeWaferTone(tone);
  const shown = visibleWaferCustomers(rows, waferBandArg(bandOn), waferToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = waferState(row.note);
      const token = state === "set" ? waferBand(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return bands.includes(token);
    });
  const lead = leadingWafer(rows);
  const toneLead = leadingWaferTone(rows);
  const shared = sharedWaferCount(rows);
  const catalog = catalogWaferCount(rows);
  const bars = waferBands(rows).filter((line) => line.band);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(ACW_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedWafers(next, ids);
    setReviewed(saved);
    writeJson(ACW_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-acw" aria-label={v4("acwTitle")} data-wafers="1" data-role={role} data-catalog={catalog ? "1" : "0"}>
      <div className="c4-acw-sheet">
        <header className="c4-acw-mast">
          <div>
            <p className="c4-acw-kicker">{v4("acwSub")}</p>
            <h2 className="c4-title">{v4("acwTitle")}</h2>
          </div>
          <p className="c4-acw-plate" data-logo="mono">{v4("acwLogo")}</p>
        </header>
        <p className="c4-acw-rules">{v4("acwHint")}</p>
        <p className="c4-meta">{v4("acwKept")} {v4("acwEscape")}</p>
        {viewer && <p className="c4-acw-notice" data-viewer="1">{v4("acwViewer")}</p>}
        {data.error && <p className="c4-acw-empty" role="alert">{v4("acwFailed")}</p>}
        {data.loading && <p className="c4-meta">{v4("acwLoading")}</p>}
        {shared > 0 && <p className="c4-acw-notice" role="status">{v4("acwNotice")} · {shared}</p>}
        <ol className="c4-acw-ledger" aria-label={v4("acwKpi")}>
          <li><span>{v4("acwSet")}</span><strong>{rows.filter((row) => waferState(row.note) === "set").length}</strong></li>
          <li><span>{v4("acwCatalog")}</span><strong>{catalog}</strong></li>
          <li><span>{v4("acwWide")}</span><strong>{wideWaferCount(rows)}</strong></li>
          <li><span>{v4("acwGiltCount")}</span><strong>{giltWaferCount(rows)}</strong></li>
          <li><span>{v4("acwShare")}</span><strong>{waferShare(catalog, rows.length)}%</strong></li>
          <li><span>{v4("acwShared")}</span><strong>{shared}</strong></li>
        </ol>
        <div className="c4-acw-rail" aria-label={v4("acwBands")}>
          {bars.map((bar) => (
            <div key={bar.band} className="c4-acw-meter">
              <button type="button" className="c4-btn" onClick={() => setBand(bar.band)}>{bandLabel(v4, bar.band)} · {bar.count}</button>
              <div className="c4-acw-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            </div>
          ))}
          {!bars.length && <p className="c4-acw-empty">{v4("acwEmpty")}</p>}
        </div>
        <div className="c4-acw-suggest">
          <p>{v4("acwLeading")} · {lead ? bandLabel(v4, lead) : v4("acwLeadingNone")}</p>
          <p>{v4("acwToneLead")} · {toneLead ? waferToneLabel(v4, toneLead) : v4("acwToneNone")}</p>
          <p>{shared ? `${v4("acwShared")} · ${shared}` : v4("acwSharedNone")}</p>
        </div>
        <label className="c4-lab">{v4("acwSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("acwSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <div className="c4-acw-filters">
          <button type="button" className="c4-chip" data-on={bandOn === "all" ? "1" : "0"} onClick={() => setBand("all")}>{v4("acwAll")}</button>
          <button type="button" className="c4-chip" data-on={bandOn === "blank" ? "1" : "0"} onClick={() => setBand("blank")}>{v4("acwClear")}</button>
          {BANDS.map((item) => (
            <button key={item} type="button" className="c4-chip" data-on={bandOn === item ? "1" : "0"} onClick={() => setBand(item)}>{bandLabel(v4, item)}</button>
          ))}
          <button type="button" className="c4-chip" data-on={toneOn === "all" ? "1" : "0"} onClick={() => setTone("all")}>{v4("acwTone")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "gilt" ? "1" : "0"} onClick={() => setTone("gilt")}>{v4("acwGilt")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "ink" ? "1" : "0"} onClick={() => setTone("ink")}>{v4("acwInk")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "ivory" ? "1" : "0"} onClick={() => setTone("ivory")}>{v4("acwIvoryTone")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "mist" ? "1" : "0"} onClick={() => setTone("mist")}>{v4("acwMist")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "plain" ? "1" : "0"} onClick={() => setTone("plain")}>{v4("acwTonePlain")}</button>
          {(["all", "catalog", "wide", "gilt"] as const).map((item) => (
            <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{item === "all" ? v4("acwAllShapes") : item === "catalog" ? v4("acwCatalog") : item === "wide" ? v4("acwWide") : v4("acwGilt")}</button>
          ))}
          <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} onClick={() => setReview("all")}>{v4("acwAllReview")}</button>
          <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview("reviewed")}>{v4("acwReviewed")}</button>
          <button type="button" className="c4-chip" data-on={review === "open" ? "1" : "0"} onClick={() => setReview("open")}>{v4("acwOpenReview")}</button>
          <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("acwShown") : v4("acwHidden")}</button>
        </div>
        <div className="c4-acw-bands">
          {present.map((item) => (
            <button key={item} type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleWafer(hidden, item))}>
              {bandLabel(v4, item)} · {hidden.includes(item) ? v4("acwShow") : v4("acwHide")}
            </button>
          ))}
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkWaferReview(reviewed, shown.map((row) => row.id), true))}>{v4("acwBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkWaferReview(reviewed, ids, false))}>{v4("acwBulkClear")}</button>
          <button type="button" className="c4-btn" onClick={() => download("account-wafers.csv", wafersCsv(rows))}>{v4("acwCsv")}</button>
          <button type="button" className="c4-btn" onClick={() => download("account-wafer-rows.csv", waferRowsCsv(rows, reviewed))}>{v4("acwRowCsv")}</button>
          <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("acwCustomers")}</Link>
        </div>
        {!shown.length && <p className="c4-acw-empty">{v4("acwEmpty")}</p>}
        <ul className="c4-acw-index">
          {shown.map((row) => {
            const state = waferState(row.note);
            const mark = waferOf(row.note);
            return (
              <li key={row.id} data-state={state || "blank"} data-band={state === "set" ? waferBand(row.note) : "blank"} data-tone={waferTone(row.note) || "blank"} data-catalog={catalogWafer(row.note) ? "1" : "0"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"}>
                <p className="c4-acw-mark" data-logo="mono">{mark || "—"}</p>
                <div>
                  <strong>{row.label || row.id}</strong>
                  <span className="c4-meta">{bandLabel(v4, state === "set" ? waferBand(row.note) : state === "clear" ? "blank" : "")} · {waferToneLabel(v4, waferTone(row.note))}</span>
                  {catalogWafer(row.note) && <span className="c4-meta">{v4("acwCatalogMark")}</span>}
                  <div className="c4-row">
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleWaferReview(reviewed, row.id))}>{v4("acwReview")}</button>
                    <button type="button" className="c4-btn" onClick={() => { const line = waferCopy(row.note); void navigator.clipboard?.writeText(line); setCopied(row.id); }}>{copied === row.id ? v4("acwCopied") : v4("acwCopy")}</button>
                    <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{row.label || row.id}</Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="c4-acw-rules">{v4("acwRules")}</p>
      </div>
    </section>
  );
}
