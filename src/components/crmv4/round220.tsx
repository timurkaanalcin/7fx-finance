"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  LGS_DENSITY_KEY,
  LGS_KEY,
  LGS_VIEW_KEY,
  CTY_KEY,
  CTY_REVIEW_KEY,
  activeCityLane,
  activeCityTone,
  activeBell,
  activeTempo,
  activeWeave,
  activeBay,
  activeSteward,
  activeRank,
  addSlip,
  addSlipTag,
  addSlipView,
  adjacentSlipCount,
  catalogCity,
  catalogCityCount,
  clashBayCount,
  crestOf,
  cityCopy,
  cityLane,
  cityLaneArg,
  cityLanes,
  cityRowsCsv,
  cityShare,
  cityState,
  cityStep,
  cityTone,
  cityToneArg,
  crestsCsv,
  cycleTempo,
  densityOf,
  dropSlipView,
  bellArg,
  bellClashCount,
  editSlip,
  editSlipNote,
  fairSteward,
  flareLoad,
  tempoArg,
  tempoFocused,
  goldCityCount,
  holdFocused,
  houseWeave,
  weaveArg,
  lateSlip,
  lateShare,
  leadingCity,
  leadingCityTone,
  matchedSlips,
  moveFocus,
  nextSlip,
  bayArg,
  bayGap,
  baySpan,
  pairStewardCount,
  peakBay,
  slipCopy,
  slipCounts,
  slipWeaves,
  slipLedger,
  slipStewards,
  slipShare,
  slipsCsv,
  pinFocused,
  presentCities,
  quietCourtCount,
  quietBay,
  readHiddenCities,
  readSlipViews,
  readSlips,
  readReviewedCities,
  reminderSlips,
  resetSlips,
  stewardArg,
  setSlipArchive,
  setSlipHold,
  setSlipPin,
  setSlipRank,
  sharedCrestCount,
  sharedWeaveCount,
  snoozeFocused,
  snoozeSlip,
  sortSlips,
  suggestBell,
  suggestWeave,
  suggestSteward,
  toggleCity,
  toggleCityReview,
  usedBays,
  visibleCityCustomers,
  visibleCityLanes,
  visibleSlips,
  rankArg,
  rankLoad,
  wideCity,
  wideCityCount,
  windowSlips,
  bulkCityReview,
  bulkSlipArchive,
  bulkSlipTempo,
  bulkSlipWeave,
  bulkSlipPin,
  bulkSlipTag,
  busiestSteward,
  type CityRow,
  type CityShape,
  type LoggiaSlip,
  type SlipDensity,
  type SlipSort,
  type SlipTray,
  type SlipView,
} from "@/lib/crmv4/round220";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  lastCity?: string | null;
};

type GlanceRow = CityRow & { id: string };

const WEAVES = ["linen", "graphite", "champagne"] as const;
const TEMPOS = ["hush", "glide", "flare"] as const;
const LANES = ["court", "square", "boulevard"] as const;

function weaveLabel(v4: V4, weave: string): string {
  if (weave === "linen" || weave === "LINEN") return v4("lgsLinen");
  if (weave === "graphite" || weave === "GRAPHITE") return v4("lgsGraphite");
  if (weave === "champagne" || weave === "CHAMPAGNE") return v4("lgsChampagne");
  return v4("lgsBlankWeave");
}

function tempoLabel(v4: V4, tempo: string): string {
  if (tempo === "hush") return v4("lgsHush");
  if (tempo === "glide") return v4("lgsGlide");
  if (tempo === "flare") return v4("lgsFlare");
  return v4("lgsBlankTempo");
}

function bellLabel(v4: V4, bell: number | null): string {
  if (bell === 10) return v4("lgsBell10");
  if (bell === 20) return v4("lgsBell20");
  if (bell === 60) return v4("lgsBell60");
  return v4("lgsBlankBell");
}

function laneLabel(v4: V4, name: string): string {
  if (name === "court") return v4("ctyCourt");
  if (name === "square") return v4("ctySquare");
  if (name === "boulevard") return v4("ctyBoulevard");
  if (name === "blank") return v4("ctcrClear");
  return v4("ctcrUnmarked");
}

function toneLabel(v4: V4, name: string): string {
  if (name === "gold") return v4("ctyGold");
  if (name === "ink") return v4("ctyInk");
  if (name === "ivory") return v4("ctyIvory");
  if (name === "mist") return v4("ctyMist");
  return v4("ctcrUnmarked");
}

function auditLabel(v4: V4, audit: string): string {
  const key = {
    save: "lgsAuditSave",
    edit: "lgsAuditEdit",
    tempo: "lgsAuditTempo",
    pin: "lgsAuditPin",
    unpin: "lgsAuditUnpin",
    hold: "lgsAuditHold",
    resume: "lgsAuditResume",
    archive: "lgsAuditArchive",
    open: "lgsAuditOpen",
    weave: "lgsAuditWeave",
    tag: "lgsAuditTag",
    rank: "lgsAuditRank",
    bell: "lgsAuditBell",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, bay: number | null, desk: string): string {
  const gap = bayGap(bay, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("lgsPast")} ${gap}`;
  if (gap < 0) return `${v4("lgsAhead")} ${Math.abs(gap)}`;
  return v4("lgsDue");
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

export function LoggiaSlips({ v4 }: { v4: V4 }) {
  const [slips, setSlips] = useState<LoggiaSlip[]>([]);
  const [views, setViews] = useState<SlipView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [steward, setSteward] = useState("");
  const [bay, setBay] = useState("");
  const [weave, setWeave] = useState("");
  const [tempo, setTempo] = useState("");
  const [bellValue, setBellValue] = useState("");
  const [tag, setTag] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<SlipTray>("open");
  const [stewardFilter, setStewardFilter] = useState("all");
  const [weaveFilter, setWeaveFilter] = useState("all");
  const [tempoFilter, setTempoFilter] = useState("all");
  const [bayFilter, setBayFilter] = useState("all");
  const [bellFilter, setBellFilter] = useState("all");
  const [rankFilter, setRankFilter] = useState("all");
  const [flareOnly, setFlareOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [lightOnly, setLightOnly] = useState(false);
  const [board, setBoard] = useState<"tower" | "line">("tower");
  const [order, setOrder] = useState<SlipSort>("bay");
  const [density, setDensity] = useState<SlipDensity>("roomy");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [deskBay, setDeskBay] = useState("");
  const [moveWeave, setMoveWeave] = useState("linen");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<() => void>(() => {});
  const bellRef = useRef<() => void>(() => {});
  const holdRef = useRef<() => void>(() => {});
  const tempoRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readSlips(readJson(LGS_KEY, []));
    const saved = readSlipViews(readJson(LGS_VIEW_KEY, []));
    setSlips(next);
    setViews(saved);
    setDensity(densityOf(readJson(LGS_DENSITY_KEY, "roomy")));
    writeJson(LGS_KEY, next);
    writeJson(LGS_VIEW_KEY, saved);
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: LoggiaSlip[]) {
    const saved = readSlips(next);
    setSlips(saved);
    writeJson(LGS_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((slip) => slip.id === id)));
  }
  function storeViews(next: SlipView[]) {
    const saved = readSlipViews(next);
    setViews(saved);
    writeJson(LGS_VIEW_KEY, saved);
  }
  function storeDensity(next: SlipDensity) {
    setDensity(next);
    writeJson(LGS_DENSITY_KEY, next);
  }
  const stewards = slipStewards(slips);
  const weaves = slipWeaves(slips);
  const bars = WEAVES.map((item) => ({ weave: item.toUpperCase(), count: slips.filter((slip) => slip.weave === item.toUpperCase()).length })).filter((row) => row.count > 0);
  const stewardOn = activeSteward(stewardFilter, stewards);
  const weaveOn = activeWeave(weaveFilter, weaves);
  const tempoOn = activeTempo(tempoFilter, ["hush", "glide", "flare"]);
  const bayOn = activeBay(bayFilter);
  const bellOn = activeBell(bellFilter);
  const rankOn = activeRank(rankFilter);
  const pickedBay = bayArg(bayOn);
  const shown = sortSlips(visibleSlips(
    slips,
    tray,
    query,
    stewardArg(stewardOn),
    weaveArg(weaveOn),
    tempoArg(tempoOn),
    pickedBay.exact,
    pickedBay.pick,
    bellArg(bellOn),
    rankArg(rankOn),
    flareOnly,
    peakOnly,
    houseOnly,
    quietOnly,
    lightOnly,
  ), order);
  const ledger = slipLedger(slips, query);
  const counts = slipCounts(slips, deskBay);
  const share = lateShare(slips, deskBay);
  const matched = matchedSlips(slips, deskBay);
  const clashes = clashBayCount(slips);
  const bells = bellClashCount(slips);
  const neighbors = adjacentSlipCount(slips);
  const suggestedWeave = suggestWeave(slips);
  const suggestedSteward = suggestSteward(slips);
  const suggestedBell = suggestBell(slips);
  const fair = fairSteward(slips, roster);
  const busy = busiestSteward(slips);
  const reminders = reminderSlips(slips, deskBay);
  const windowRows = windowSlips(slips, deskBay);
  const nextId = nextSlip(slips, deskBay);
  const nextRow = slips.find((slip) => slip.id === nextId);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  pinRef.current = () => {
    if (!viewer) store(pinFocused(slips, shown.map((slip) => slip.id), focus));
  };
  bellRef.current = () => {
    if (!viewer) store(snoozeFocused(slips, shown.map((slip) => slip.id), focus));
  };
  holdRef.current = () => {
    if (!viewer) store(holdFocused(slips, shown.map((slip) => slip.id), focus));
  };
  tempoRef.current = () => {
    if (!viewer) store(tempoFocused(slips, shown.map((slip) => slip.id), focus));
  };
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setTitle("");
        setNote("");
        setSteward("");
        setBay("");
        setWeave("");
        setTempo("");
        setBellValue("");
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
        bellRef.current();
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        holdRef.current();
        return;
      }
      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        tempoRef.current();
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
    setSteward("");
    setBay("");
    setWeave("");
    setTempo("");
    setBellValue("");
    setTag("");
    setQuery("");
    setEditing("");
  }
  function applyView(view: SlipView) {
    setTray(view.tray);
    setQuery(view.query);
    setStewardFilter(view.steward);
    setWeaveFilter(view.weave);
    setTempoFilter(view.tempo);
    setBayFilter(view.bay);
    setBellFilter(view.bell);
    setRankFilter(view.rank);
  }
  const rows = board === "line" ? ledger : shown;
  return (
    <section className="c4-lgs" aria-label={v4("lgsTitle")} data-slips="1" data-role={role} data-density={density}>
      <div className="c4-lgs-sheet">
        <header className="c4-lgs-mast">
          <p className="c4-lgs-spine">{v4("lgsSpine")}</p>
          <div>
            <p className="c4-lgs-kicker">{v4("lgsSub")}</p>
            <h2 className="c4-title">{v4("lgsTitle")}</h2>
          </div>
          <p className="c4-lgs-plate" data-logo="mono">{v4("lgsLogo")}</p>
        </header>
        <div className="c4-lgs-body">
          <p className="c4-lgs-rules">{v4("lgsHint")}</p>
          <p className="c4-meta">{v4("lgsLocal")}</p>
          <p className="c4-meta">{v4("lgsNew")} {v4("lgsSlash")} {v4("lgsEscape")} {v4("lgsKeys")} {v4("lgsPinKey")} {v4("lgsBellKey")} {v4("lgsHoldKey")} {v4("lgsTempoKey")} {v4("lgsBoardKey")}</p>
          {viewer && <p className="c4-lgs-notice" data-viewer="1">{v4("lgsViewer")}</p>}
          {counts.peak > 0 && (
            <p className="c4-lgs-notice" role="status">
              {v4("lgsNotice")} · {counts.peak}
              <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("lgsNoticeAll") : v4("lgsNoticePeak")}</button>
            </p>
          )}
          {counts.late > 0 && <p className="c4-lgs-notice" role="status" data-late="1">{v4("lgsLateNotice")} · {counts.late}</p>}
          <ol className="c4-lgs-ledger" aria-label={v4("lgsKpi")}>
            <li><span>{v4("lgsOpen")}</span><strong>{counts.open}</strong></li>
            <li><span>{v4("lgsHeld")}</span><strong>{counts.held}</strong></li>
            <li><span>{v4("lgsArchived")}</span><strong>{counts.archived}</strong></li>
            <li><span>{v4("lgsPinned")}</span><strong>{counts.pinned}</strong></li>
            <li><span>{v4("lgsPeak")}</span><strong>{counts.peak}</strong></li>
            <li><span>{v4("lgsLate")}</span><strong>{counts.late}</strong></li>
            <li><span>{v4("lgsSoon")}</span><strong>{counts.soon}</strong></li>
            <li><span>{v4("lgsRank")}</span><strong>{counts.rank}</strong></li>
            <li><span>{v4("lgsMatched")}</span><strong>{matched}</strong></li>
            <li><span>{v4("lgsHouseShare")}</span><strong>{slipShare(counts.house, counts.open)}%</strong></li>
          </ol>
          <div className="c4-lgs-sla" aria-label={v4("lgsLateShare")}>
            <span>{v4("lgsLateShare")} · {share}%</span>
            <div className="c4-lgs-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></div>
          </div>
          <div className="c4-lgs-rail" aria-label={v4("lgsWeaves")}>
            {bars.map((bar) => (
              <div key={bar.weave} className="c4-lgs-meter" data-weave={bar.weave.toLowerCase()}>
                <button type="button" className="c4-btn" onClick={() => setWeaveFilter(bar.weave)}>{weaveLabel(v4, bar.weave)} · {bar.count}</button>
                <div className="c4-lgs-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
              </div>
            ))}
            {!bars.length && <p className="c4-lgs-empty">{v4("lgsEmpty")}</p>}
          </div>
          <div className="c4-lgs-suggest">
            <p>{v4("lgsSuggestWeave")} · {weaveLabel(v4, suggestedWeave)}</p>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setWeave(suggestedWeave.toLowerCase())}>{v4("lgsUseWeave")}</button>
            <p>{v4("lgsSuggestSteward")} · {suggestedSteward || v4("lgsBlankSteward")}</p>
            <button type="button" className="c4-btn" disabled={viewer || !suggestedSteward} onClick={() => setSteward(suggestedSteward)}>{v4("lgsUseSteward")}</button>
            <p>{v4("lgsSuggestBell")} · {suggestedBell}</p>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setBellValue(String(suggestedBell))}>{v4("lgsUseBell")}</button>
            <p>{v4("lgsAssign")} · {fair || v4("lgsBlankSteward")}</p>
            <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setSteward(fair)}>{v4("lgsAssign")}</button>
          </div>
          <p className="c4-meta">{v4("lgsBays")} · {usedBays(slips)}</p>
          <p className="c4-meta">{clashes ? `${v4("lgsClash")} · ${clashes}` : v4("lgsClashNone")}</p>
          <p className="c4-meta">{bells ? `${v4("lgsBellClash")} · ${bells}` : v4("lgsBellClashNone")}</p>
          <p className="c4-meta">{neighbors ? `${v4("lgsAdjacent")} · ${neighbors}` : v4("lgsAdjacentNone")}</p>
          <p className="c4-meta">{pairStewardCount(slips) ? `${v4("lgsPairs")} · ${pairStewardCount(slips)}` : v4("lgsPairsNone")}</p>
          <p className="c4-meta">{sharedWeaveCount(slips) ? `${v4("lgsSharedWeave")} · ${sharedWeaveCount(slips)}` : v4("lgsSharedWeaveNone")}</p>
          <p className="c4-meta">{v4("lgsRankLoad")} · {rankLoad(slips)}</p>
          <p className="c4-meta">{v4("lgsQuietCourt")} · {quietCourtCount(slips)}</p>
          <p className="c4-meta">{v4("lgsFlareLoad")} · {flareLoad(slips)}</p>
          <p className="c4-meta">{v4("lgsBaySpan")} · {baySpan(slips)}</p>
          <p className="c4-meta">{nextRow ? `${v4("lgsNext")} · ${nextRow.title}` : v4("lgsNextNone")}</p>
          <p className="c4-meta">{busy ? `${v4("lgsBusiest")} · ${busy}` : v4("lgsBusiestNone")}</p>
          <p className="c4-meta">{reminders.length ? `${v4("lgsReminders")} · ${reminders.map((slip) => slip.title).join(", ")}` : v4("lgsReminderNone")}</p>
          <p className="c4-meta">{windowRows.length ? `${v4("lgsWindow")} · ${windowRows.map((slip) => slip.title).join(", ")}` : v4("lgsWindowNone")}</p>
          <label className="c4-lab">{v4("lgsSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("lgsSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <div className="c4-lgs-filters">
            <button type="button" className="c4-chip" data-on={tray === "open" ? "1" : "0"} onClick={() => setTray("open")}>{v4("lgsOpenTray")}</button>
            <button type="button" className="c4-chip" data-on={tray === "held" ? "1" : "0"} onClick={() => setTray("held")}>{v4("lgsHeldTray")}</button>
            <button type="button" className="c4-chip" data-on={tray === "archived" ? "1" : "0"} onClick={() => setTray("archived")}>{v4("lgsArchivedTray")}</button>
            <button type="button" className="c4-chip" data-on={stewardOn === "all" ? "1" : "0"} onClick={() => setStewardFilter("all")}>{v4("lgsAll")}</button>
            <button type="button" className="c4-chip" data-on={stewardOn === "blank" ? "1" : "0"} onClick={() => setStewardFilter("blank")}>{v4("lgsBlankSteward")}</button>
            {stewards.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={stewardOn === name ? "1" : "0"} onClick={() => setStewardFilter(name)}>{name}</button>
            ))}
            <button type="button" className="c4-chip" data-on={weaveOn === "all" ? "1" : "0"} onClick={() => setWeaveFilter("all")}>{v4("lgsWeave")}</button>
            {WEAVES.map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={weaveOn === item.toUpperCase() ? "1" : "0"} onClick={() => setWeaveFilter(item)}>{weaveLabel(v4, item)}</button>
            ))}
            <button type="button" className="c4-chip" data-on={tempoOn === "all" ? "1" : "0"} onClick={() => setTempoFilter("all")}>{v4("lgsTempo")}</button>
            {TEMPOS.map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={tempoOn === item ? "1" : "0"} onClick={() => setTempoFilter(item)}>{tempoLabel(v4, item)}</button>
            ))}
            {["all", "blank", "early", "mid", "late", "peak", "quiet", "2", "5", "6"].map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={bayOn === item ? "1" : "0"} onClick={() => setBayFilter(item)}>
                {item === "all" ? v4("lgsBay") : item === "blank" ? v4("lgsBlankBay") : item === "early" ? v4("lgsEarly") : item === "mid" ? v4("lgsMid") : item === "late" ? v4("lgsLateBay") : item === "peak" ? v4("lgsPeak") : item === "quiet" ? v4("lgsQuiet") : item}
              </button>
            ))}
            {["all", "blank", "10", "20", "60"].map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={bellOn === item ? "1" : "0"} onClick={() => setBellFilter(item)}>{item === "all" ? v4("lgsBell") : item === "blank" ? v4("lgsBlankBell") : item}</button>
            ))}
            {["all", "blank", "1", "3", "5"].map((item) => (
              <button key={`w${item}`} type="button" className="c4-chip" data-on={rankOn === item ? "1" : "0"} onClick={() => setRankFilter(item)}>{item === "all" ? v4("lgsRankFilter") : item === "blank" ? v4("lgsBlankRank") : item}</button>
            ))}
            <button type="button" className="c4-chip" data-on={flareOnly ? "1" : "0"} onClick={() => setFlareOnly((on) => !on)}>{v4("lgsFlareOnly")}</button>
            <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((on) => !on)}>{v4("lgsPeakOnly")}</button>
            <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((on) => !on)}>{v4("lgsHouseOnly")}</button>
            <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((on) => !on)}>{v4("lgsQuietOnly")}</button>
            <button type="button" className="c4-chip" data-on={lightOnly ? "1" : "0"} onClick={() => setLightOnly((on) => !on)}>{v4("lgsLightOnly")}</button>
            <button type="button" className="c4-chip" data-on={order === "bay" ? "1" : "0"} onClick={() => setOrder("bay")}>{v4("lgsSortBay")}</button>
            <button type="button" className="c4-chip" data-on={order === "steward" ? "1" : "0"} onClick={() => setOrder("steward")}>{v4("lgsSortSteward")}</button>
            <button type="button" className="c4-chip" data-on={density === "roomy" ? "1" : "0"} onClick={() => storeDensity("roomy")}>{v4("lgsRoomy")}</button>
            <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity("close")}>{v4("lgsClose")}</button>
            <button type="button" className="c4-chip" data-on={board === "tower" ? "1" : "0"} onClick={() => setBoard("tower")}>{v4("lgsTower")}</button>
            <button type="button" className="c4-chip" data-on={board === "line" ? "1" : "0"} onClick={() => setBoard("line")}>{v4("lgsLine")}</button>
          </div>
          <form className="c4-lgs-form" onSubmit={(event) => {
            event.preventDefault();
            if (viewer) return;
            store(addSlip(slips, { id: `slip-${Date.now()}`, title, note, steward, bay, weave, tempo, bell: bellValue, tags: tag }));
            clearDraft();
          }}>
            <label className="c4-lab">{v4("lgsSlip")}<input ref={titleRef} className="c4-field" aria-label={v4("lgsSlip")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
            <label className="c4-lab">{v4("lgsNote")}<input className="c4-field" aria-label={v4("lgsNote")} value={note} onChange={(event) => setNote(event.target.value)} /></label>
            <label className="c4-lab">{v4("lgsSteward")}<input className="c4-field" aria-label={v4("lgsSteward")} value={steward} onChange={(event) => setSteward(event.target.value)} /></label>
            <label className="c4-lab">{v4("lgsBay")}<input className="c4-field" inputMode="numeric" aria-label={v4("lgsBay")} value={bay} onChange={(event) => setBay(event.target.value)} /></label>
            <label className="c4-lab">{v4("lgsWeave")}
              <select className="c4-field" aria-label={v4("lgsWeave")} value={weave} onChange={(event) => setWeave(event.target.value)}>
                <option value="">{v4("lgsBlankWeave")}</option>
                {WEAVES.map((item) => <option key={item} value={item}>{weaveLabel(v4, item)}</option>)}
              </select>
            </label>
            <label className="c4-lab">{v4("lgsTempo")}
              <select className="c4-field" aria-label={v4("lgsTempo")} value={tempo} onChange={(event) => setTempo(event.target.value)}>
                <option value="">{v4("lgsBlankTempo")}</option>
                {TEMPOS.map((item) => <option key={item} value={item}>{tempoLabel(v4, item)}</option>)}
              </select>
            </label>
            <label className="c4-lab">{v4("lgsBell")}<input className="c4-field" inputMode="numeric" aria-label={v4("lgsBell")} value={bellValue} onChange={(event) => setBellValue(event.target.value)} /></label>
            <label className="c4-lab">{v4("lgsTag")}<input className="c4-field" aria-label={v4("lgsTag")} value={tag} onChange={(event) => setTag(event.target.value)} /></label>
            <button type="submit" className="c4-btn" disabled={viewer}>{v4("lgsSave")}</button>
          </form>
          <label className="c4-lab">{v4("lgsDeskBay")}<input className="c4-field" inputMode="numeric" aria-label={v4("lgsDeskBay")} value={deskBay} onChange={(event) => setDeskBay(event.target.value)} /></label>
          <label className="c4-lab">{v4("lgsRoster")}<input className="c4-field" aria-label={v4("lgsRoster")} value={roster} onChange={(event) => setRoster(event.target.value)} /></label>
          <form className="c4-lgs-form" onSubmit={(event) => {
            event.preventDefault();
            if (viewer || !viewName.trim()) return;
            storeViews(addSlipView(views, {
              id: `view-${Date.now()}`,
              name: viewName,
              tray,
              query,
              steward: stewardOn,
              weave: weaveOn,
              tempo: tempoOn,
              bay: bayOn,
              bell: bellOn,
              rank: rankOn,
            }));
            setViewName("");
          }}>
            <label className="c4-lab">{v4("lgsViewName")}<input className="c4-field" aria-label={v4("lgsViewName")} value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
            <button type="submit" className="c4-btn" disabled={viewer}>{v4("lgsSaveView")}</button>
          </form>
          <div className="c4-lgs-views">
            {views.map((view) => (
              <p key={view.id}>
                <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropSlipView(views, view.id))}>{v4("lgsDropView")}</button>
              </p>
            ))}
          </div>
          <div className="c4-lgs-bulk">
            <label className="c4-lab">{v4("lgsBulkWeave")}
              <select className="c4-field" aria-label={v4("lgsBulkWeave")} value={moveWeave} onChange={(event) => setMoveWeave(event.target.value)}>
                {WEAVES.map((item) => <option key={item} value={item}>{weaveLabel(v4, item)}</option>)}
              </select>
            </label>
            <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSlipWeave(slips, picked, moveWeave))}>{v4("lgsBulkWeave")}</button>
            <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSlipPin(slips, picked, true))}>{v4("lgsBulkPin")}</button>
            <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSlipArchive(slips, picked, true))}>{v4("lgsBulkArchive")}</button>
            <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSlipTag(slips, picked, "a"))}>{v4("lgsBulkTag")}</button>
            <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSlipTempo(slips, picked, "glide"))}>{v4("lgsBulkTempo")}</button>
            <button type="button" className="c4-btn" onClick={() => download("loggia-slips.csv", slipsCsv(slips, deskBay))}>{v4("lgsCsv")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetSlips())}>{v4("lgsReset")}</button>
          </div>
          {!rows.length && <p className="c4-lgs-empty">{v4("lgsEmpty")}</p>}
          <ol className="c4-lgs-book">
            {rows.map((slip, index) => (
              <li key={slip.id} data-focus={focus === index ? "1" : "0"} data-late={lateSlip(slip, deskBay) ? "1" : "0"} data-house={houseWeave(slip.weave) ? "1" : "0"} data-peak={peakBay(slip.bay) ? "1" : "0"} data-quiet={quietBay(slip.bay) ? "1" : "0"}>
                <label className="c4-lab">
                  <input type="checkbox" checked={picked.includes(slip.id)} onChange={() => setPicked((ids) => ids.includes(slip.id) ? ids.filter((id) => id !== slip.id) : [...ids, slip.id])} />
                  <span className="c4-meta">{index + 1}</span>
                </label>
                <div>
                  {editing === slip.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (!viewer) store(editSlip(editSlipNote(slips, slip.id, noteDraft), slip.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("lgsSlip")} value={draft} onChange={(event) => setDraft(event.target.value)} />
                      <input className="c4-field" aria-label={v4("lgsNote")} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("lgsEdit")}</button>
                    </form>
                  ) : (
                    <button type="button" className="c4-btn" onClick={() => { setFocus(index); setEditing(slip.id); setDraft(slip.title); setNoteDraft(slip.note); }}>{slip.title}</button>
                  )}
                  <p className="c4-meta">{slip.steward || v4("lgsBlankSteward")} · {slip.bay ?? v4("lgsBlankBay")} · {weaveLabel(v4, slip.weave)} · {tempoLabel(v4, slip.tempo)} · {bellLabel(v4, slip.bell)} · {gapLabel(v4, slip.bay, deskBay)}</p>
                  <p className="c4-meta">{slip.note} {slip.tags.join(" ")} {auditLabel(v4, slip.audit)}</p>
                  <div className="c4-row">
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipPin(slips, slip.id, !slip.pinned))}>{slip.pinned ? v4("lgsUnpin") : v4("lgsPin")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipHold(slips, slip.id, !slip.held))}>{slip.held ? v4("lgsResume") : v4("lgsHold")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipArchive(slips, slip.id, !slip.archived))}>{slip.archived ? v4("lgsReopen") : v4("lgsArchive")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleTempo(slips, slip.id))}>{tempoLabel(v4, slip.tempo)}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(snoozeSlip(slips, slip.id))}>{v4("lgsSnooze")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipRank(slips, slip.id, slip.rank > 1 ? 1 : 3))}>{slip.rank > 1 ? v4("lgsRankOff") : v4("lgsRankOn")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addSlipTag(slips, slip.id, "b"))}>{v4("lgsTag")}</button>
                    <button type="button" className="c4-btn" onClick={() => { const line = slipCopy(slip, deskBay); void navigator.clipboard?.writeText(line); setCopied(slip.id); }}>{copied === slip.id ? v4("lgsCopied") : v4("lgsCopy")}</button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <p className="c4-lgs-rules">{v4("lgsRules")}</p>
        </div>
      </div>
    </section>
  );
}

export function CityCrests({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("all");
  const [tone, setTone] = useState("all");
  const [shape, setShape] = useState<CityShape>("all");
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
    note: { lastCity: user.lastCity ?? null },
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
    const nextHidden = readHiddenCities(readJson(CTY_KEY, []), present);
    const nextReviewed = readReviewedCities(readJson(CTY_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(CTY_KEY, nextHidden);
    writeJson(CTY_REVIEW_KEY, nextReviewed);
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
  const lanes = visibleCityLanes(present, hidden, showHidden);
  const laneOn = activeCityLane(lane, present);
  const toneOn = activeCityTone(tone);
  const shown = visibleCityCustomers(rows, cityLaneArg(laneOn), cityToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = cityState(row.note);
      const token = state === "set" ? cityLane(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return lanes.includes(token);
    });
  const lead = leadingCity(rows);
  const toneLead = leadingCityTone(rows);
  const shared = sharedCrestCount(rows);
  const catalog = catalogCityCount(rows);
  const bars = cityLanes(rows).filter((line) => line.lane);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(CTY_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedCities(next, ids);
    setReviewed(saved);
    writeJson(CTY_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-cty" aria-label={v4("ctcrTitle")} data-crests="1" data-role={role} data-catalog={catalog ? "1" : "0"}>
      <div className="c4-cty-sheet">
        <header className="c4-cty-mast">
          <div>
            <p className="c4-cty-kicker">{v4("ctySub")}</p>
            <h2 className="c4-title">{v4("ctcrTitle")}</h2>
          </div>
          <p className="c4-cty-plate" data-logo="mono">{v4("ctyLogo")}</p>
        </header>
        <div className="c4-cty-body">
          <p className="c4-cty-rules">{v4("ctcrHint")}</p>
          <p className="c4-meta">{v4("ctyKept")} {v4("ctcrEscape")}</p>
          {viewer && <p className="c4-cty-notice" data-viewer="1">{v4("ctyViewer")}</p>}
          {data.error && <p className="c4-cty-empty" role="alert">{v4("ctcrFailed")}</p>}
          {data.loading && <p className="c4-meta">{v4("ctcrLoading")}</p>}
          {shared > 0 && <p className="c4-cty-notice" role="status">{v4("ctyNotice")} · {shared}</p>}
          <ol className="c4-cty-ledger" aria-label={v4("ctyKpi")}>
            <li><span>{v4("ctySet")}</span><strong>{rows.filter((row) => cityState(row.note) === "set").length}</strong></li>
            <li><span>{v4("ctyCatalog")}</span><strong>{catalog}</strong></li>
            <li><span>{v4("ctyWide")}</span><strong>{wideCityCount(rows)}</strong></li>
            <li><span>{v4("ctyGoldCount")}</span><strong>{goldCityCount(rows)}</strong></li>
            <li><span>{v4("ctcrShare")}</span><strong>{cityShare(catalog, rows.length)}%</strong></li>
            <li><span>{v4("ctyShared")}</span><strong>{shared}</strong></li>
          </ol>
          <div className="c4-cty-rail" aria-label={v4("ctyLanes")}>
            {bars.map((bar) => (
              <div key={bar.lane} className="c4-cty-meter" data-lane={bar.lane}>
                <button type="button" className="c4-btn" onClick={() => setLane(bar.lane)}>{laneLabel(v4, bar.lane)} · {bar.count}</button>
                <div className="c4-cty-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
              </div>
            ))}
            {!bars.length && <p className="c4-cty-empty">{v4("ctcrEmpty")}</p>}
          </div>
          <div className="c4-cty-suggest">
            <p>{v4("ctyLeading")} · {lead ? laneLabel(v4, lead) : v4("ctyLeadingNone")}</p>
            <p>{v4("ctyToneLead")} · {toneLead ? toneLabel(v4, toneLead) : v4("ctyToneNone")}</p>
            <p>{shared ? `${v4("ctyShared")} · ${shared}` : v4("ctySharedNone")}</p>
          </div>
          <label className="c4-lab">{v4("ctcrSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("ctcrSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <div className="c4-cty-filters">
            <button type="button" className="c4-chip" data-on={laneOn === "all" ? "1" : "0"} onClick={() => setLane("all")}>{v4("ctyAll")}</button>
            <button type="button" className="c4-chip" data-on={laneOn === "blank" ? "1" : "0"} onClick={() => setLane("blank")}>{v4("ctcrClear")}</button>
            {LANES.map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={laneOn === item ? "1" : "0"} onClick={() => setLane(item)}>{laneLabel(v4, item)}</button>
            ))}
            <button type="button" className="c4-chip" data-on={toneOn === "all" ? "1" : "0"} onClick={() => setTone("all")}>{v4("ctyTone")}</button>
            <button type="button" className="c4-chip" data-on={toneOn === "gold" ? "1" : "0"} onClick={() => setTone("gold")}>{v4("ctyGold")}</button>
            <button type="button" className="c4-chip" data-on={toneOn === "ink" ? "1" : "0"} onClick={() => setTone("ink")}>{v4("ctyInk")}</button>
            <button type="button" className="c4-chip" data-on={toneOn === "ivory" ? "1" : "0"} onClick={() => setTone("ivory")}>{v4("ctyIvory")}</button>
            <button type="button" className="c4-chip" data-on={toneOn === "mist" ? "1" : "0"} onClick={() => setTone("mist")}>{v4("ctyMist")}</button>
            {(["all", "catalog", "wide", "gold"] as const).map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{item === "all" ? v4("ctcrAllShapes") : item === "catalog" ? v4("ctyCatalog") : item === "wide" ? v4("ctyWide") : v4("ctyGold")}</button>
            ))}
            <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} onClick={() => setReview("all")}>{v4("ctyAllReview")}</button>
            <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview("reviewed")}>{v4("ctyReviewed")}</button>
            <button type="button" className="c4-chip" data-on={review === "open" ? "1" : "0"} onClick={() => setReview("open")}>{v4("ctyOpenReview")}</button>
            <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("ctcrShown") : v4("ctcrHidden")}</button>
          </div>
          <div className="c4-cty-bands">
            {present.map((item) => (
              <button key={item} type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleCity(hidden, item))}>
                {laneLabel(v4, item)} · {hidden.includes(item) ? v4("ctyShow") : v4("ctyHide")}
              </button>
            ))}
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkCityReview(reviewed, shown.map((row) => row.id), true))}>{v4("ctcrBulkReview")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkCityReview(reviewed, ids, false))}>{v4("ctyBulkClear")}</button>
            <button type="button" className="c4-btn" onClick={() => download("city-crests.csv", crestsCsv(rows))}>{v4("ctcrCsv")}</button>
            <button type="button" className="c4-btn" onClick={() => download("city-crest-rows.csv", cityRowsCsv(rows, reviewed))}>{v4("ctcrRowCsv")}</button>
            <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("ctyCustomers")}</Link>
          </div>
          {!shown.length && <p className="c4-cty-empty">{v4("ctcrEmpty")}</p>}
          <ul className="c4-cty-index">
            {shown.map((row) => {
              const state = cityState(row.note);
              const crest = crestOf(row.note);
              const step = cityStep(row.note);
              const steps = [v4("ctyPlain"), v4("ctySpaced"), v4("ctyHyphen")];
              return (
                <li key={row.id} data-state={state || "blank"} data-lane={state === "set" ? cityLane(row.note) : "blank"} data-tone={cityTone(row.note) || "blank"} data-catalog={catalogCity(row.note) ? "1" : "0"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"} data-step={step}>
                  <p className="c4-cty-mark" data-logo="mono">{crest || "—"}</p>
                  <div>
                    <strong>{row.label || row.id}</strong>
                    <span className="c4-meta">{cityCopy(row.note) || v4("ctcrClear")} · {laneLabel(v4, state === "set" ? cityLane(row.note) : state === "clear" ? "blank" : "")} · {toneLabel(v4, cityTone(row.note))}</span>
                    <ol className="c4-cty-time" aria-label={v4("ctyStep")}>
                      {steps.map((label, index) => (
                        <li key={label} data-on={step >= index + 1 ? "1" : "0"}>{label}</li>
                      ))}
                    </ol>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleCityReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("ctyReviewed") : v4("ctyReview")}</button>
                    <button type="button" className="c4-btn" onClick={() => { const line = `${row.label || row.id} · ${crest} · ${cityCopy(row.note)}`; void navigator.clipboard?.writeText(line); setCopied(row.id); }}>{copied === row.id ? v4("ctyCopied") : v4("ctcrCopy")}</button>
                    {catalogCity(row.note) && <span className="c4-meta">{v4("ctyCatalogMark")}</span>}
                    {wideCity(row.note) && <span className="c4-meta">{v4("ctyWide")}</span>}
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="c4-cty-rules">{v4("ctcrRules")}</p>
        </div>
      </div>
    </section>
  );
}
