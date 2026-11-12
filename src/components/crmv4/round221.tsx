"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  BVS_DENSITY_KEY,
  BVS_KEY,
  BVS_VIEW_KEY,
  KPS_KEY,
  KPS_REVIEW_KEY,
  activeKeeperLane,
  activeKeeperTone,
  activeChime,
  activePace,
  activeGlaze,
  activeTread,
  activeKeeper,
  activeLift,
  addStep,
  addStepTag,
  addStepView,
  adjacentStepCount,
  catalogKeeper,
  catalogKeeperCount,
  clashTreadCount,
  sealOf,
  keeperCopy,
  keeperLane,
  keeperLaneArg,
  keeperLanes,
  keeperRowsCsv,
  keeperShare,
  keeperState,
  keeperStep,
  keeperTone,
  keeperToneArg,
  sealsCsv,
  cyclePace,
  densityOf,
  dropStepView,
  chimeArg,
  chimeClashCount,
  editStep,
  editStepNote,
  fairKeeper,
  rushLoad,
  paceArg,
  paceFocused,
  goldKeeperCount,
  holdFocused,
  houseGlaze,
  glazeArg,
  lateStep,
  lateShare,
  leadingKeeper,
  leadingKeeperTone,
  matchedSteps,
  moveFocus,
  nextStep,
  treadArg,
  treadGap,
  treadSpan,
  pairKeeperCount,
  peakTread,
  stepCopy,
  stepCounts,
  stepGlazes,
  stepLedger,
  stepKeepers,
  stepShare,
  stepsCsv,
  pinFocused,
  presentCities,
  quietHallCount,
  quietTread,
  readHiddenCities,
  readStepViews,
  readSteps,
  readReviewedCities,
  reminderSteps,
  resetSteps,
  keeperArg,
  setStepArchive,
  setStepHold,
  setStepPin,
  setStepLift,
  sharedSealCount,
  sharedGlazeCount,
  snoozeFocused,
  snoozeStep,
  sortSteps,
  suggestChime,
  suggestGlaze,
  suggestKeeper,
  toggleKeeper,
  toggleKeeperReview,
  usedTreads,
  visibleKeeperCustomers,
  visibleKeeperLanes,
  visibleSteps,
  liftArg,
  liftLoad,
  wideKeeper,
  wideKeeperCount,
  windowSteps,
  bulkKeeperReview,
  bulkStepArchive,
  bulkStepPace,
  bulkStepGlaze,
  bulkStepPin,
  bulkStepTag,
  busiestKeeper,
  type KeeperRow,
  type KeeperShape,
  type BelvedereStep,
  type StepDensity,
  type StepSort,
  type StepTray,
  type StepView,
} from "@/lib/crmv4/round221";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  assigneeName?: string | null;
};

type GlanceRow = KeeperRow & { id: string };

const GLAZES = ["ivory", "slate", "gold"] as const;
const PACES = ["still", "walk", "rush"] as const;
const LANES = ["hall", "wing", "porch"] as const;

function glazeLabel(v4: V4, glaze: string): string {
  if (glaze === "ivory" || glaze === "IVORY") return v4("bvsIvory");
  if (glaze === "slate" || glaze === "SLATE") return v4("bvsSlate");
  if (glaze === "gold" || glaze === "GOLD") return v4("bvsGold");
  return v4("bvsBlankGlaze");
}

function paceLabel(v4: V4, pace: string): string {
  if (pace === "still") return v4("bvsStill");
  if (pace === "walk") return v4("bvsWalk");
  if (pace === "rush") return v4("bvsRush");
  return v4("bvsBlankPace");
}

function chimeLabel(v4: V4, chime: number | null): string {
  if (chime === 15) return v4("bvsChime15");
  if (chime === 30) return v4("bvsChime30");
  if (chime === 45) return v4("bvsChime45");
  return v4("bvsBlankChime");
}

function laneLabel(v4: V4, name: string): string {
  if (name === "hall") return v4("kpsHall");
  if (name === "wing") return v4("kpsWing");
  if (name === "porch") return v4("kpsPorch");
  if (name === "blank") return v4("kpsClear");
  return v4("kpsUnmarked");
}

function toneLabel(v4: V4, name: string): string {
  if (name === "gold") return v4("kpsGold");
  if (name === "ink") return v4("kpsInk");
  if (name === "ivory") return v4("kpsIvory");
  if (name === "mist") return v4("kpsMist");
  return v4("kpsUnmarked");
}

function auditLabel(v4: V4, audit: string): string {
  const key = {
    save: "bvsAuditSave",
    edit: "bvsAuditEdit",
    pace: "bvsAuditPace",
    pin: "bvsAuditPin",
    unpin: "bvsAuditUnpin",
    hold: "bvsAuditHold",
    resume: "bvsAuditResume",
    archive: "bvsAuditArchive",
    open: "bvsAuditOpen",
    glaze: "bvsAuditGlaze",
    tag: "bvsAuditTag",
    lift: "bvsAuditLift",
    chime: "bvsAuditChime",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, tread: number | null, desk: string): string {
  const gap = treadGap(tread, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("bvsPast")} ${gap}`;
  if (gap < 0) return `${v4("bvsAhead")} ${Math.abs(gap)}`;
  return v4("bvsDue");
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

export function BelvedereSteps({ v4 }: { v4: V4 }) {
  const [steps, setSteps] = useState<BelvedereStep[]>([]);
  const [views, setViews] = useState<StepView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [keeper, setKeeper] = useState("");
  const [tread, setTread] = useState("");
  const [glaze, setGlaze] = useState("");
  const [pace, setPace] = useState("");
  const [chimeValue, setChimeValue] = useState("");
  const [tag, setTag] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<StepTray>("open");
  const [keeperFilter, setKeeperFilter] = useState("all");
  const [glazeFilter, setGlazeFilter] = useState("all");
  const [paceFilter, setPaceFilter] = useState("all");
  const [treadFilter, setTreadFilter] = useState("all");
  const [chimeFilter, setChimeFilter] = useState("all");
  const [liftFilter, setLiftFilter] = useState("all");
  const [rushOnly, setRushOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [lightOnly, setLightOnly] = useState(false);
  const [board, setBoard] = useState<"tower" | "line">("tower");
  const [order, setOrder] = useState<StepSort>("tread");
  const [density, setDensity] = useState<StepDensity>("roomy");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [deskTread, setDeskTread] = useState("");
  const [moveGlaze, setMoveGlaze] = useState("ivory");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<() => void>(() => {});
  const chimeRef = useRef<() => void>(() => {});
  const holdRef = useRef<() => void>(() => {});
  const paceRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readSteps(readJson(BVS_KEY, []));
    const saved = readStepViews(readJson(BVS_VIEW_KEY, []));
    setSteps(next);
    setViews(saved);
    setDensity(densityOf(readJson(BVS_DENSITY_KEY, "roomy")));
    writeJson(BVS_KEY, next);
    writeJson(BVS_VIEW_KEY, saved);
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: BelvedereStep[]) {
    const saved = readSteps(next);
    setSteps(saved);
    writeJson(BVS_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((step) => step.id === id)));
  }
  function storeViews(next: StepView[]) {
    const saved = readStepViews(next);
    setViews(saved);
    writeJson(BVS_VIEW_KEY, saved);
  }
  function storeDensity(next: StepDensity) {
    setDensity(next);
    writeJson(BVS_DENSITY_KEY, next);
  }
  const keepers = stepKeepers(steps);
  const glazes = stepGlazes(steps);
  const bars = GLAZES.map((item) => ({ glaze: item.toUpperCase(), count: steps.filter((step) => step.glaze === item.toUpperCase()).length })).filter((row) => row.count > 0);
  const keeperOn = activeKeeper(keeperFilter, keepers);
  const glazeOn = activeGlaze(glazeFilter, glazes);
  const paceOn = activePace(paceFilter, ["still", "walk", "rush"]);
  const treadOn = activeTread(treadFilter);
  const chimeOn = activeChime(chimeFilter);
  const liftOn = activeLift(liftFilter);
  const pickedTread = treadArg(treadOn);
  const shown = sortSteps(visibleSteps(
    steps,
    tray,
    query,
    keeperArg(keeperOn),
    glazeArg(glazeOn),
    paceArg(paceOn),
    pickedTread.exact,
    pickedTread.pick,
    chimeArg(chimeOn),
    liftArg(liftOn),
    rushOnly,
    peakOnly,
    houseOnly,
    quietOnly,
    lightOnly,
  ), order);
  const ledger = stepLedger(steps, query);
  const counts = stepCounts(steps, deskTread);
  const share = lateShare(steps, deskTread);
  const matched = matchedSteps(steps, deskTread);
  const clashes = clashTreadCount(steps);
  const chimes = chimeClashCount(steps);
  const neighbors = adjacentStepCount(steps);
  const suggestedGlaze = suggestGlaze(steps);
  const suggestedKeeper = suggestKeeper(steps);
  const suggestedChime = suggestChime(steps);
  const fair = fairKeeper(steps, roster);
  const busy = busiestKeeper(steps);
  const reminders = reminderSteps(steps, deskTread);
  const windowRows = windowSteps(steps, deskTread);
  const nextId = nextStep(steps, deskTread);
  const nextRow = steps.find((step) => step.id === nextId);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  pinRef.current = () => {
    if (!viewer) store(pinFocused(steps, shown.map((step) => step.id), focus));
  };
  chimeRef.current = () => {
    if (!viewer) store(snoozeFocused(steps, shown.map((step) => step.id), focus));
  };
  holdRef.current = () => {
    if (!viewer) store(holdFocused(steps, shown.map((step) => step.id), focus));
  };
  paceRef.current = () => {
    if (!viewer) store(paceFocused(steps, shown.map((step) => step.id), focus));
  };
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setTitle("");
        setNote("");
        setKeeper("");
        setTread("");
        setGlaze("");
        setPace("");
        setChimeValue("");
        setTag("");
        setQuery("");
        setEditing("");
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
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
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        titleRef.current?.focus();
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        pinRef.current();
        return;
      }
      if (event.key === "b" || event.key === "B") {
        event.preventDefault();
        chimeRef.current();
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        holdRef.current();
        return;
      }
      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        paceRef.current();
        return;
      }
      if (event.key === "y" || event.key === "Y") {
        event.preventDefault();
        setBoard((current) => (current === "tower" ? "line" : "tower"));
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
    setTread("");
    setGlaze("");
    setPace("");
    setChimeValue("");
    setTag("");
    setQuery("");
    setEditing("");
  }
  function applyView(view: StepView) {
    setTray(view.tray);
    setQuery(view.query);
    setKeeperFilter(view.keeper);
    setGlazeFilter(view.glaze);
    setPaceFilter(view.pace);
    setTreadFilter(view.tread);
    setChimeFilter(view.chime);
    setLiftFilter(view.lift);
  }
  const rows = board === "line" ? ledger : shown;
  return (
    <section className="c4-bvs" aria-label={v4("bvsTitle")} data-steps="1" data-role={role} data-density={density}>
      <div className="c4-bvs-sheet">
        <header className="c4-bvs-mast">
          <p className="c4-bvs-spine">{v4("bvsSpine")}</p>
          <div>
            <p className="c4-bvs-kicker">{v4("bvsSub")}</p>
            <h2 className="c4-title">{v4("bvsTitle")}</h2>
          </div>
          <p className="c4-bvs-plate" data-logo="mono">{v4("bvsLogo")}</p>
        </header>
        <div className="c4-bvs-body">
          <p className="c4-bvs-rules">{v4("bvsHint")}</p>
          <p className="c4-meta">{v4("bvsLocal")}</p>
          <p className="c4-meta">{v4("bvsNew")} {v4("bvsSlash")} {v4("bvsEscape")} {v4("bvsKeys")} {v4("bvsPinKey")} {v4("bvsChimeKey")} {v4("bvsHoldKey")} {v4("bvsPaceKey")} {v4("bvsBoardKey")}</p>
          {viewer && <p className="c4-bvs-notice" data-viewer="1">{v4("bvsViewer")}</p>}
          {counts.peak > 0 && (
            <p className="c4-bvs-notice" role="status">
              {v4("bvsNotice")} · {counts.peak}
              <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("bvsNoticeAll") : v4("bvsNoticePeak")}</button>
            </p>
          )}
          {counts.late > 0 && <p className="c4-bvs-notice" role="status" data-late="1">{v4("bvsLateNotice")} · {counts.late}</p>}
          <ol className="c4-bvs-ledger" aria-label={v4("bvsKpi")}>
            <li><span>{v4("bvsOpen")}</span><strong>{counts.open}</strong></li>
            <li><span>{v4("bvsHeld")}</span><strong>{counts.held}</strong></li>
            <li><span>{v4("bvsArchived")}</span><strong>{counts.archived}</strong></li>
            <li><span>{v4("bvsPinned")}</span><strong>{counts.pinned}</strong></li>
            <li><span>{v4("bvsPeak")}</span><strong>{counts.peak}</strong></li>
            <li><span>{v4("bvsLate")}</span><strong>{counts.late}</strong></li>
            <li><span>{v4("bvsSoon")}</span><strong>{counts.soon}</strong></li>
            <li><span>{v4("bvsLift")}</span><strong>{counts.lift}</strong></li>
            <li><span>{v4("bvsMatched")}</span><strong>{matched}</strong></li>
            <li><span>{v4("bvsHouseShare")}</span><strong>{stepShare(counts.house, counts.open)}%</strong></li>
          </ol>
          <div className="c4-bvs-sla" aria-label={v4("bvsLateShare")}>
            <span>{v4("bvsLateShare")} · {share}%</span>
            <div className="c4-bvs-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></div>
          </div>
          <div className="c4-bvs-rail" aria-label={v4("bvsGlazes")}>
            {bars.map((bar) => (
              <div key={bar.glaze} className="c4-bvs-meter" data-glaze={bar.glaze.toLowerCase()}>
                <button type="button" className="c4-btn" onClick={() => setGlazeFilter(bar.glaze)}>{glazeLabel(v4, bar.glaze)} · {bar.count}</button>
                <div className="c4-bvs-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
              </div>
            ))}
            {!bars.length && <p className="c4-bvs-empty">{v4("bvsEmpty")}</p>}
          </div>
          <div className="c4-bvs-suggest">
            <p>{v4("bvsSuggestGlaze")} · {glazeLabel(v4, suggestedGlaze)}</p>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setGlaze(suggestedGlaze.toLowerCase())}>{v4("bvsUseGlaze")}</button>
            <p>{v4("bvsSuggestKeeper")} · {suggestedKeeper || v4("bvsBlankKeeper")}</p>
            <button type="button" className="c4-btn" disabled={viewer || !suggestedKeeper} onClick={() => setKeeper(suggestedKeeper)}>{v4("bvsUseKeeper")}</button>
            <p>{v4("bvsSuggestChime")} · {suggestedChime}</p>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setChimeValue(String(suggestedChime))}>{v4("bvsUseChime")}</button>
            <p>{v4("bvsAssign")} · {fair || v4("bvsBlankKeeper")}</p>
            <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setKeeper(fair)}>{v4("bvsAssign")}</button>
          </div>
          <p className="c4-meta">{v4("bvsTreads")} · {usedTreads(steps)}</p>
          <p className="c4-meta">{clashes ? `${v4("bvsClash")} · ${clashes}` : v4("bvsClashNone")}</p>
          <p className="c4-meta">{chimes ? `${v4("bvsChimeClash")} · ${chimes}` : v4("bvsChimeClashNone")}</p>
          <p className="c4-meta">{neighbors ? `${v4("bvsAdjacent")} · ${neighbors}` : v4("bvsAdjacentNone")}</p>
          <p className="c4-meta">{pairKeeperCount(steps) ? `${v4("bvsPairs")} · ${pairKeeperCount(steps)}` : v4("bvsPairsNone")}</p>
          <p className="c4-meta">{sharedGlazeCount(steps) ? `${v4("bvsSharedGlaze")} · ${sharedGlazeCount(steps)}` : v4("bvsSharedGlazeNone")}</p>
          <p className="c4-meta">{v4("bvsLiftLoad")} · {liftLoad(steps)}</p>
          <p className="c4-meta">{v4("bvsQuietHall")} · {quietHallCount(steps)}</p>
          <p className="c4-meta">{v4("bvsRushLoad")} · {rushLoad(steps)}</p>
          <p className="c4-meta">{v4("bvsTreadSpan")} · {treadSpan(steps)}</p>
          <p className="c4-meta">{nextRow ? `${v4("bvsNext")} · ${nextRow.title}` : v4("bvsNextNone")}</p>
          <p className="c4-meta">{busy ? `${v4("bvsBusiest")} · ${busy}` : v4("bvsBusiestNone")}</p>
          <p className="c4-meta">{reminders.length ? `${v4("bvsReminders")} · ${reminders.map((step) => step.title).join(", ")}` : v4("bvsReminderNone")}</p>
          <p className="c4-meta">{windowRows.length ? `${v4("bvsWindow")} · ${windowRows.map((step) => step.title).join(", ")}` : v4("bvsWindowNone")}</p>
          <label className="c4-lab">{v4("bvsSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("bvsSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <div className="c4-bvs-filters">
            <button type="button" className="c4-chip" data-on={tray === "open" ? "1" : "0"} onClick={() => setTray("open")}>{v4("bvsOpenTray")}</button>
            <button type="button" className="c4-chip" data-on={tray === "held" ? "1" : "0"} onClick={() => setTray("held")}>{v4("bvsHeldTray")}</button>
            <button type="button" className="c4-chip" data-on={tray === "archived" ? "1" : "0"} onClick={() => setTray("archived")}>{v4("bvsArchivedTray")}</button>
            <button type="button" className="c4-chip" data-on={keeperOn === "all" ? "1" : "0"} onClick={() => setKeeperFilter("all")}>{v4("bvsAll")}</button>
            <button type="button" className="c4-chip" data-on={keeperOn === "blank" ? "1" : "0"} onClick={() => setKeeperFilter("blank")}>{v4("bvsBlankKeeper")}</button>
            {keepers.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={keeperOn === name ? "1" : "0"} onClick={() => setKeeperFilter(name)}>{name}</button>
            ))}
            <button type="button" className="c4-chip" data-on={glazeOn === "all" ? "1" : "0"} onClick={() => setGlazeFilter("all")}>{v4("bvsGlaze")}</button>
            {GLAZES.map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={glazeOn === item.toUpperCase() ? "1" : "0"} onClick={() => setGlazeFilter(item)}>{glazeLabel(v4, item)}</button>
            ))}
            <button type="button" className="c4-chip" data-on={paceOn === "all" ? "1" : "0"} onClick={() => setPaceFilter("all")}>{v4("bvsPace")}</button>
            {PACES.map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={paceOn === item ? "1" : "0"} onClick={() => setPaceFilter(item)}>{paceLabel(v4, item)}</button>
            ))}
            {["all", "blank", "early", "mid", "late", "peak", "quiet", "3", "7", "8"].map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={treadOn === item ? "1" : "0"} onClick={() => setTreadFilter(item)}>
                {item === "all" ? v4("bvsTread") : item === "blank" ? v4("bvsBlankTread") : item === "early" ? v4("bvsEarly") : item === "mid" ? v4("bvsMid") : item === "late" ? v4("bvsLateTread") : item === "peak" ? v4("bvsPeak") : item === "quiet" ? v4("bvsQuiet") : item}
              </button>
            ))}
            {["all", "blank", "15", "30", "45"].map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={chimeOn === item ? "1" : "0"} onClick={() => setChimeFilter(item)}>{item === "all" ? v4("bvsChime") : item === "blank" ? v4("bvsBlankChime") : item}</button>
            ))}
            {["all", "blank", "1", "3", "5"].map((item) => (
              <button key={`w${item}`} type="button" className="c4-chip" data-on={liftOn === item ? "1" : "0"} onClick={() => setLiftFilter(item)}>{item === "all" ? v4("bvsLiftFilter") : item === "blank" ? v4("bvsBlankLift") : item}</button>
            ))}
            <button type="button" className="c4-chip" data-on={rushOnly ? "1" : "0"} onClick={() => setRushOnly((on) => !on)}>{v4("bvsRushOnly")}</button>
            <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((on) => !on)}>{v4("bvsPeakOnly")}</button>
            <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((on) => !on)}>{v4("bvsHouseOnly")}</button>
            <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((on) => !on)}>{v4("bvsQuietOnly")}</button>
            <button type="button" className="c4-chip" data-on={lightOnly ? "1" : "0"} onClick={() => setLightOnly((on) => !on)}>{v4("bvsLightOnly")}</button>
            <button type="button" className="c4-chip" data-on={order === "tread" ? "1" : "0"} onClick={() => setOrder("tread")}>{v4("bvsSortTread")}</button>
            <button type="button" className="c4-chip" data-on={order === "keeper" ? "1" : "0"} onClick={() => setOrder("keeper")}>{v4("bvsSortKeeper")}</button>
            <button type="button" className="c4-chip" data-on={density === "roomy" ? "1" : "0"} onClick={() => storeDensity("roomy")}>{v4("bvsRoomy")}</button>
            <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity("close")}>{v4("bvsClose")}</button>
            <button type="button" className="c4-chip" data-on={board === "tower" ? "1" : "0"} onClick={() => setBoard("tower")}>{v4("bvsTower")}</button>
            <button type="button" className="c4-chip" data-on={board === "line" ? "1" : "0"} onClick={() => setBoard("line")}>{v4("bvsLine")}</button>
          </div>
          <form className="c4-bvs-form" onSubmit={(event) => {
            event.preventDefault();
            if (viewer) return;
            store(addStep(steps, { id: `step-${Date.now()}`, title, note, keeper, tread, glaze, pace, chime: chimeValue, tags: tag }));
            clearDraft();
          }}>
            <label className="c4-lab">{v4("bvsStep")}<input ref={titleRef} className="c4-field" aria-label={v4("bvsStep")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
            <label className="c4-lab">{v4("bvsNote")}<input className="c4-field" aria-label={v4("bvsNote")} value={note} onChange={(event) => setNote(event.target.value)} /></label>
            <label className="c4-lab">{v4("bvsKeeper")}<input className="c4-field" aria-label={v4("bvsKeeper")} value={keeper} onChange={(event) => setKeeper(event.target.value)} /></label>
            <label className="c4-lab">{v4("bvsTread")}<input className="c4-field" inputMode="numeric" aria-label={v4("bvsTread")} value={tread} onChange={(event) => setTread(event.target.value)} /></label>
            <label className="c4-lab">{v4("bvsGlaze")}
              <select className="c4-field" aria-label={v4("bvsGlaze")} value={glaze} onChange={(event) => setGlaze(event.target.value)}>
                <option value="">{v4("bvsBlankGlaze")}</option>
                {GLAZES.map((item) => <option key={item} value={item}>{glazeLabel(v4, item)}</option>)}
              </select>
            </label>
            <label className="c4-lab">{v4("bvsPace")}
              <select className="c4-field" aria-label={v4("bvsPace")} value={pace} onChange={(event) => setPace(event.target.value)}>
                <option value="">{v4("bvsBlankPace")}</option>
                {PACES.map((item) => <option key={item} value={item}>{paceLabel(v4, item)}</option>)}
              </select>
            </label>
            <label className="c4-lab">{v4("bvsChime")}<input className="c4-field" inputMode="numeric" aria-label={v4("bvsChime")} value={chimeValue} onChange={(event) => setChimeValue(event.target.value)} /></label>
            <label className="c4-lab">{v4("bvsTag")}<input className="c4-field" aria-label={v4("bvsTag")} value={tag} onChange={(event) => setTag(event.target.value)} /></label>
            <button type="submit" className="c4-btn" disabled={viewer}>{v4("bvsSave")}</button>
          </form>
          <label className="c4-lab">{v4("bvsDeskTread")}<input className="c4-field" inputMode="numeric" aria-label={v4("bvsDeskTread")} value={deskTread} onChange={(event) => setDeskTread(event.target.value)} /></label>
          <label className="c4-lab">{v4("bvsRoster")}<input className="c4-field" aria-label={v4("bvsRoster")} value={roster} onChange={(event) => setRoster(event.target.value)} /></label>
          <form className="c4-bvs-form" onSubmit={(event) => {
            event.preventDefault();
            if (viewer || !viewName.trim()) return;
            storeViews(addStepView(views, {
              id: `view-${Date.now()}`,
              name: viewName,
              tray,
              query,
              keeper: keeperOn,
              glaze: glazeOn,
              pace: paceOn,
              tread: treadOn,
              chime: chimeOn,
              lift: liftOn,
            }));
            setViewName("");
          }}>
            <label className="c4-lab">{v4("bvsViewName")}<input className="c4-field" aria-label={v4("bvsViewName")} value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
            <button type="submit" className="c4-btn" disabled={viewer}>{v4("bvsSaveView")}</button>
          </form>
          <div className="c4-bvs-views">
            {views.map((view) => (
              <p key={view.id}>
                <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropStepView(views, view.id))}>{v4("bvsDropView")}</button>
              </p>
            ))}
          </div>
          <div className="c4-bvs-bulk">
            <label className="c4-lab">{v4("bvsBulkGlaze")}
              <select className="c4-field" aria-label={v4("bvsBulkGlaze")} value={moveGlaze} onChange={(event) => setMoveGlaze(event.target.value)}>
                {GLAZES.map((item) => <option key={item} value={item}>{glazeLabel(v4, item)}</option>)}
              </select>
            </label>
            <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkStepGlaze(steps, picked, moveGlaze))}>{v4("bvsBulkGlaze")}</button>
            <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkStepPin(steps, picked, true))}>{v4("bvsBulkPin")}</button>
            <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkStepArchive(steps, picked, true))}>{v4("bvsBulkArchive")}</button>
            <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkStepTag(steps, picked, "e"))}>{v4("bvsBulkTag")}</button>
            <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkStepPace(steps, picked, "walk"))}>{v4("bvsBulkPace")}</button>
            <button type="button" className="c4-btn" onClick={() => download("belvedere-steps.csv", stepsCsv(steps, deskTread))}>{v4("bvsCsv")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetSteps())}>{v4("bvsReset")}</button>
          </div>
          {!rows.length && <p className="c4-bvs-empty">{v4("bvsEmpty")}</p>}
          <ol className="c4-bvs-book">
            {rows.map((step, index) => (
              <li key={step.id} data-focus={focus === index ? "1" : "0"} data-late={lateStep(step, deskTread) ? "1" : "0"} data-house={houseGlaze(step.glaze) ? "1" : "0"} data-peak={peakTread(step.tread) ? "1" : "0"} data-quiet={quietTread(step.tread) ? "1" : "0"}>
                <label className="c4-lab">
                  <input type="checkbox" checked={picked.includes(step.id)} onChange={() => setPicked((ids) => ids.includes(step.id) ? ids.filter((id) => id !== step.id) : [...ids, step.id])} />
                  <span className="c4-meta">{index + 1}</span>
                </label>
                <div>
                  {editing === step.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (!viewer) store(editStep(editStepNote(steps, step.id, noteDraft), step.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("bvsStep")} value={draft} onChange={(event) => setDraft(event.target.value)} />
                      <input className="c4-field" aria-label={v4("bvsNote")} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("bvsEdit")}</button>
                    </form>
                  ) : (
                    <button type="button" className="c4-btn" onClick={() => { setFocus(index); setEditing(step.id); setDraft(step.title); setNoteDraft(step.note); }}>{step.title}</button>
                  )}
                  <p className="c4-meta">{step.keeper || v4("bvsBlankKeeper")} · {step.tread ?? v4("bvsBlankTread")} · {glazeLabel(v4, step.glaze)} · {paceLabel(v4, step.pace)} · {chimeLabel(v4, step.chime)} · {gapLabel(v4, step.tread, deskTread)}</p>
                  <p className="c4-meta">{step.note} {step.tags.join(" ")} {auditLabel(v4, step.audit)}</p>
                  <div className="c4-row">
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setStepPin(steps, step.id, !step.pinned))}>{step.pinned ? v4("bvsUnpin") : v4("bvsPin")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setStepHold(steps, step.id, !step.held))}>{step.held ? v4("bvsResume") : v4("bvsHold")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setStepArchive(steps, step.id, !step.archived))}>{step.archived ? v4("bvsReopen") : v4("bvsArchive")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cyclePace(steps, step.id))}>{paceLabel(v4, step.pace)}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(snoozeStep(steps, step.id))}>{v4("bvsSnooze")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setStepLift(steps, step.id, step.lift > 1 ? 1 : 3))}>{step.lift > 1 ? v4("bvsLiftOff") : v4("bvsLiftOn")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addStepTag(steps, step.id, "f"))}>{v4("bvsTag")}</button>
                    <button type="button" className="c4-btn" onClick={() => { const line = stepCopy(step, deskTread); void navigator.clipboard?.writeText(line); setCopied(step.id); }}>{copied === step.id ? v4("bvsCopied") : v4("bvsCopy")}</button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <p className="c4-bvs-rules">{v4("bvsRules")}</p>
        </div>
      </div>
    </section>
  );
}

export function KeeperSeals({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("all");
  const [tone, setTone] = useState("all");
  const [shape, setShape] = useState<KeeperShape>("all");
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
    note: { assigneeName: user.assigneeName ?? null },
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
    const present = presentCities(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenCities(readJson(KPS_KEY, []), present);
    const nextReviewed = readReviewedCities(readJson(KPS_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(KPS_KEY, nextHidden);
    writeJson(KPS_REVIEW_KEY, nextReviewed);
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
  const present = presentCities(rows);
  const lanes = visibleKeeperLanes(present, hidden, showHidden);
  const laneOn = activeKeeperLane(lane, present);
  const toneOn = activeKeeperTone(tone);
  const shown = visibleKeeperCustomers(rows, keeperLaneArg(laneOn), keeperToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = keeperState(row.note);
      const token = state === "set" ? keeperLane(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return lanes.includes(token);
    });
  const lead = leadingKeeper(rows);
  const toneLead = leadingKeeperTone(rows);
  const shared = sharedSealCount(rows);
  const catalog = catalogKeeperCount(rows);
  const bars = keeperLanes(rows).filter((line) => line.lane);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(KPS_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedCities(next, ids);
    setReviewed(saved);
    writeJson(KPS_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-kps" aria-label={v4("kpsTitle")} data-seals="1" data-role={role} data-catalog={catalog ? "1" : "0"}>
      <div className="c4-kps-sheet">
        <header className="c4-kps-mast">
          <div>
            <p className="c4-kps-kicker">{v4("kpsSub")}</p>
            <h2 className="c4-title">{v4("kpsTitle")}</h2>
          </div>
          <p className="c4-kps-plate" data-logo="mono">{v4("kpsLogo")}</p>
        </header>
        <div className="c4-kps-body">
          <p className="c4-kps-rules">{v4("kpsHint")}</p>
          <p className="c4-meta">{v4("kpsKept")} {v4("kpsEscape")}</p>
          {viewer && <p className="c4-kps-notice" data-viewer="1">{v4("kpsViewer")}</p>}
          {data.error && <p className="c4-kps-empty" role="alert">{v4("kpsFailed")}</p>}
          {data.loading && <p className="c4-meta">{v4("kpsLoading")}</p>}
          {shared > 0 && <p className="c4-kps-notice" role="status">{v4("kpsNotice")} · {shared}</p>}
          <ol className="c4-kps-ledger" aria-label={v4("kpsKpi")}>
            <li><span>{v4("kpsSet")}</span><strong>{rows.filter((row) => keeperState(row.note) === "set").length}</strong></li>
            <li><span>{v4("kpsCatalog")}</span><strong>{catalog}</strong></li>
            <li><span>{v4("kpsWide")}</span><strong>{wideKeeperCount(rows)}</strong></li>
            <li><span>{v4("kpsGoldCount")}</span><strong>{goldKeeperCount(rows)}</strong></li>
            <li><span>{v4("kpsShare")}</span><strong>{keeperShare(catalog, rows.length)}%</strong></li>
            <li><span>{v4("kpsShared")}</span><strong>{shared}</strong></li>
          </ol>
          <div className="c4-kps-rail" aria-label={v4("kpsLanes")}>
            {bars.map((bar) => (
              <div key={bar.lane} className="c4-kps-meter" data-lane={bar.lane}>
                <button type="button" className="c4-btn" onClick={() => setLane(bar.lane)}>{laneLabel(v4, bar.lane)} · {bar.count}</button>
                <div className="c4-kps-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
              </div>
            ))}
            {!bars.length && <p className="c4-kps-empty">{v4("kpsEmpty")}</p>}
          </div>
          <div className="c4-kps-suggest">
            <p>{v4("kpsLeading")} · {lead ? laneLabel(v4, lead) : v4("kpsLeadingNone")}</p>
            <p>{v4("kpsToneLead")} · {toneLead ? toneLabel(v4, toneLead) : v4("kpsToneNone")}</p>
            <p>{shared ? `${v4("kpsShared")} · ${shared}` : v4("kpsSharedNone")}</p>
          </div>
          <label className="c4-lab">{v4("kpsSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("kpsSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <div className="c4-kps-filters">
            <button type="button" className="c4-chip" data-on={laneOn === "all" ? "1" : "0"} onClick={() => setLane("all")}>{v4("kpsAll")}</button>
            <button type="button" className="c4-chip" data-on={laneOn === "blank" ? "1" : "0"} onClick={() => setLane("blank")}>{v4("kpsClear")}</button>
            {LANES.map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={laneOn === item ? "1" : "0"} onClick={() => setLane(item)}>{laneLabel(v4, item)}</button>
            ))}
            <button type="button" className="c4-chip" data-on={toneOn === "all" ? "1" : "0"} onClick={() => setTone("all")}>{v4("kpsTone")}</button>
            <button type="button" className="c4-chip" data-on={toneOn === "gold" ? "1" : "0"} onClick={() => setTone("gold")}>{v4("kpsGold")}</button>
            <button type="button" className="c4-chip" data-on={toneOn === "ink" ? "1" : "0"} onClick={() => setTone("ink")}>{v4("kpsInk")}</button>
            <button type="button" className="c4-chip" data-on={toneOn === "ivory" ? "1" : "0"} onClick={() => setTone("ivory")}>{v4("kpsIvory")}</button>
            <button type="button" className="c4-chip" data-on={toneOn === "mist" ? "1" : "0"} onClick={() => setTone("mist")}>{v4("kpsMist")}</button>
            {(["all", "catalog", "wide", "gold"] as const).map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{item === "all" ? v4("kpsAllShapes") : item === "catalog" ? v4("kpsCatalog") : item === "wide" ? v4("kpsWide") : v4("kpsGold")}</button>
            ))}
            <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} onClick={() => setReview("all")}>{v4("kpsAllReview")}</button>
            <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview("reviewed")}>{v4("kpsReviewed")}</button>
            <button type="button" className="c4-chip" data-on={review === "open" ? "1" : "0"} onClick={() => setReview("open")}>{v4("kpsOpenReview")}</button>
            <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("kpsShown") : v4("kpsHidden")}</button>
          </div>
          <div className="c4-kps-bands">
            {present.map((item) => (
              <button key={item} type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleKeeper(hidden, item))}>
                {laneLabel(v4, item)} · {hidden.includes(item) ? v4("kpsShow") : v4("kpsHide")}
              </button>
            ))}
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkKeeperReview(reviewed, shown.map((row) => row.id), true))}>{v4("kpsBulkReview")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkKeeperReview(reviewed, ids, false))}>{v4("kpsBulkClear")}</button>
            <button type="button" className="c4-btn" onClick={() => download("keeper-seals.csv", sealsCsv(rows))}>{v4("kpsCsv")}</button>
            <button type="button" className="c4-btn" onClick={() => download("keeper-seal-rows.csv", keeperRowsCsv(rows, reviewed))}>{v4("kpsRowCsv")}</button>
            <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("kpsCustomers")}</Link>
          </div>
          {!shown.length && <p className="c4-kps-empty">{v4("kpsEmpty")}</p>}
          <ul className="c4-kps-index">
            {shown.map((row) => {
              const state = keeperState(row.note);
              const seal = sealOf(row.note);
              const step = keeperStep(row.note);
              const steps = [v4("kpsPlain"), v4("kpsSpaced"), v4("kpsHyphen")];
              return (
                <li key={row.id} data-state={state || "blank"} data-lane={state === "set" ? keeperLane(row.note) : "blank"} data-tone={keeperTone(row.note) || "blank"} data-catalog={catalogKeeper(row.note) ? "1" : "0"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"} data-step={step}>
                  <p className="c4-kps-mark" data-logo="mono">{seal || "—"}</p>
                  <div>
                    <strong>{row.label || row.id}</strong>
                    <span className="c4-meta">{keeperCopy(row.note) || v4("kpsClear")} · {laneLabel(v4, state === "set" ? keeperLane(row.note) : state === "clear" ? "blank" : "")} · {toneLabel(v4, keeperTone(row.note))}</span>
                    <ol className="c4-kps-time" aria-label={v4("kpsStep")}>
                      {steps.map((label, index) => (
                        <li key={label} data-on={step >= index + 1 ? "1" : "0"}>{label}</li>
                      ))}
                    </ol>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleKeeperReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("kpsReviewed") : v4("kpsReview")}</button>
                    <button type="button" className="c4-btn" onClick={() => { const line = `${row.label || row.id} · ${seal} · ${keeperCopy(row.note)}`; void navigator.clipboard?.writeText(line); setCopied(row.id); }}>{copied === row.id ? v4("kpsCopied") : v4("kpsCopy")}</button>
                    {catalogKeeper(row.note) && <span className="c4-meta">{v4("kpsCatalogMark")}</span>}
                    {wideKeeper(row.note) && <span className="c4-meta">{v4("kpsWide")}</span>}
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="c4-kps-rules">{v4("kpsRules")}</p>
        </div>
      </div>
    </section>
  );
}
