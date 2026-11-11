"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  LNR_KEY,
  LNR_REVIEW_KEY,
  NVB_DENSITY_KEY,
  NVB_KEY,
  NVB_VIEW_KEY,
  activeBay,
  activeKeeper,
  activeRibbonBand,
  activeRibbonTone,
  activeSpan,
  activeVoice,
  activeWatch,
  activeWeave,
  addBench,
  addBenchTag,
  addBenchView,
  adjacentBenchCount,
  bayArg,
  bayGap,
  baySpan,
  benchCopy,
  benchCounts,
  benchKeepers,
  benchShare,
  benchTimeline,
  benchWeaves,
  benchesCsv,
  bulkBenchClose,
  bulkBenchPin,
  bulkBenchTag,
  bulkBenchVoice,
  bulkBenchWeave,
  bulkRibbonReview,
  busiestKeeper,
  catalogRibbon,
  catalogRibbonCount,
  clashBayCount,
  cycleVoice,
  densityOf,
  dropBenchView,
  editBench,
  editBenchNote,
  fairKeeper,
  fullLoad,
  giltFocused,
  giltLoad,
  giltRibbonCount,
  houseWeave,
  keeperArg,
  lateBench,
  lateShare,
  leadingRibbon,
  leadingRibbonTone,
  moveFocus,
  nextBench,
  pairKeeperCount,
  peakBay,
  pinFocused,
  presentRibbons,
  quietBay,
  quietHouseCount,
  readBenchViews,
  readBenches,
  readHiddenRibbons,
  readReviewedRibbons,
  reminderBenches,
  resetBenches,
  ribbonBand,
  ribbonBandArg,
  ribbonBands,
  ribbonCopy,
  ribbonOf,
  ribbonRowsCsv,
  ribbonShare,
  ribbonState,
  ribbonTone,
  ribbonToneArg,
  ribbonsCsv,
  setBenchClose,
  setBenchGilt,
  setBenchHold,
  setBenchPin,
  sharedRibbonCount,
  soonBench,
  sortBenches,
  sortMode,
  spanArg,
  spanClashCount,
  suggestKeeper,
  suggestWatch,
  suggestWeave,
  toggleRibbon,
  toggleRibbonReview,
  usedBays,
  visibleBenches,
  visibleRibbonBands,
  visibleRibbonCustomers,
  voiceArg,
  watchArg,
  weaveArg,
  wideRibbonCount,
  windowBenches,
  type BenchDensity,
  type BenchSort,
  type BenchTray,
  type BenchView,
  type NaveBench,
  type RibbonRow,
  type RibbonShape,
} from "@/lib/crmv4/round209";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  language?: string | null;
};

type GlanceRow = RibbonRow & { id: string };

const WEAVES = ["ivory", "graphite", "gold"] as const;
const VOICES = ["soft", "even", "full"] as const;
const BANDS = ["latin", "turkic", "cyrillic", "arabic", "plain"] as const;

function weaveLabel(v4: V4, weave: string): string {
  if (weave === "ivory" || weave === "IVORY") return v4("nvbIvory");
  if (weave === "graphite" || weave === "GRAPHITE") return v4("nvbGraphite");
  if (weave === "gold" || weave === "GOLD") return v4("nvbGold");
  return v4("nvbBlankWeave");
}

function voiceLabel(v4: V4, voice: string): string {
  if (voice === "soft") return v4("nvbSoft");
  if (voice === "even") return v4("nvbEven");
  if (voice === "full") return v4("nvbFull");
  return v4("nvbBlankVoice");
}

function spanLabel(v4: V4, span: number | null): string {
  if (span === 5) return v4("nvbSpan5");
  if (span === 10) return v4("nvbSpan10");
  if (span === 20) return v4("nvbSpan20");
  return v4("nvbBlankSpan");
}

function watchLabel(v4: V4, watch: number | null): string {
  if (watch === 20) return v4("nvbWatch20");
  if (watch === 45) return v4("nvbWatch45");
  if (watch === 90) return v4("nvbWatch90");
  return v4("nvbBlankWatch");
}

function bandLabel(v4: V4, name: string): string {
  if (name === "latin") return v4("lnrLatin");
  if (name === "turkic") return v4("lnrTurkic");
  if (name === "cyrillic") return v4("lnrCyrillic");
  if (name === "arabic") return v4("lnrArabic");
  if (name === "plain") return v4("lnrPlain");
  if (name === "blank") return v4("lnrClear");
  return v4("lnrUnmarked");
}

function ribbonToneLabel(v4: V4, name: string): string {
  if (name === "gilt") return v4("lnrGilt");
  if (name === "ink") return v4("lnrInk");
  if (name === "ivory") return v4("lnrIvory");
  if (name === "mist") return v4("lnrMist");
  if (name === "plain") return v4("lnrTonePlain");
  return v4("lnrUnmarked");
}

function auditLabel(v4: V4, audit: string): string {
  const key = {
    save: "nvbAuditSave",
    edit: "nvbAuditEdit",
    voice: "nvbAuditVoice",
    pin: "nvbAuditPin",
    unpin: "nvbAuditUnpin",
    hold: "nvbAuditHold",
    lift: "nvbAuditLift",
    close: "nvbAuditClose",
    open: "nvbAuditOpen",
    weave: "nvbAuditWeave",
    tag: "nvbAuditTag",
    gilt: "nvbAuditGilt",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, bay: number | null, desk: string): string {
  const gap = bayGap(bay, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("nvbPast")} ${gap}`;
  if (gap < 0) return `${v4("nvbAhead")} ${Math.abs(gap)}`;
  return v4("nvbDue");
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

export function NaveBenches({ v4 }: { v4: V4 }) {
  const [benches, setBenches] = useState<NaveBench[]>([]);
  const [views, setViews] = useState<BenchView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [keeper, setKeeper] = useState("");
  const [bay, setBay] = useState("");
  const [weave, setWeave] = useState("");
  const [voice, setVoice] = useState("");
  const [span, setSpan] = useState("");
  const [watchValue, setWatchValue] = useState("");
  const [tag, setTag] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<BenchTray>("open");
  const [keeperFilter, setKeeperFilter] = useState("all");
  const [weaveFilter, setWeaveFilter] = useState("all");
  const [voiceFilter, setVoiceFilter] = useState("all");
  const [bayFilter, setBayFilter] = useState("all");
  const [spanFilter, setSpanFilter] = useState("all");
  const [watchFilter, setWatchFilter] = useState("all");
  const [fullOnly, setFullOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [awakeOnly, setAwakeOnly] = useState(false);
  const [board, setBoard] = useState<"aisle" | "timeline">("aisle");
  const [order, setOrder] = useState<BenchSort>("bay");
  const [density, setDensity] = useState<BenchDensity>("roomy");
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
  const giltRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readBenches(readJson(NVB_KEY, []));
    const saved = readBenchViews(readJson(NVB_VIEW_KEY, []));
    setBenches(next);
    setViews(saved);
    setDensity(densityOf(readJson(NVB_DENSITY_KEY, "roomy")));
    writeJson(NVB_KEY, next);
    writeJson(NVB_VIEW_KEY, saved);
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: NaveBench[]) {
    const saved = readBenches(next);
    setBenches(saved);
    writeJson(NVB_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((bench) => bench.id === id)));
  }
  function storeViews(next: BenchView[]) {
    const saved = readBenchViews(next);
    setViews(saved);
    writeJson(NVB_VIEW_KEY, saved);
  }
  function storeDensity(next: BenchDensity) {
    setDensity(next);
    writeJson(NVB_DENSITY_KEY, next);
  }
  const keepers = benchKeepers(benches);
  const weaves = benchWeaves(benches);
  const bars = WEAVES.map((item) => ({ weave: item.toUpperCase(), count: benches.filter((bench) => bench.weave === item.toUpperCase()).length })).filter((row) => row.count > 0);
  const keeperOn = activeKeeper(keeperFilter, keepers);
  const weaveOn = activeWeave(weaveFilter, weaves);
  const voiceOn = activeVoice(voiceFilter, ["soft", "even", "full"]);
  const bayOn = activeBay(bayFilter);
  const spanOn = activeSpan(spanFilter);
  const watchOn = activeWatch(watchFilter);
  const pickedBay = bayArg(bayOn);
  const shown = sortBenches(visibleBenches(
    benches,
    tray,
    query,
    keeperArg(keeperOn),
    weaveArg(weaveOn),
    voiceArg(voiceOn),
    pickedBay.exact,
    pickedBay.pick,
    spanArg(spanOn),
    watchArg(watchOn),
    fullOnly,
    peakOnly,
    houseOnly,
    quietOnly,
    awakeOnly,
  ), order);
  const timeline = benchTimeline(benches, query);
  const counts = benchCounts(benches, deskBay);
  const clashes = clashBayCount(benches);
  const spans = spanClashCount(benches);
  const neighbors = adjacentBenchCount(benches);
  const nextId = nextBench(benches, deskBay);
  const nextRow = benches.find((bench) => bench.id === nextId);
  const suggestedWeave = suggestWeave(benches);
  const suggestedKeeper = suggestKeeper(benches);
  const suggestedWatch = suggestWatch(benches);
  const fair = fairKeeper(benches, roster);
  const busy = busiestKeeper(benches);
  const reminders = reminderBenches(benches, deskBay);
  const windowRows = windowBenches(benches, deskBay);
  const share = lateShare(benches, deskBay);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  pinRef.current = () => {
    if (viewer) return;
    const ids = (board === "timeline" ? timeline : shown).map((bench) => bench.id);
    store(pinFocused(benches, ids, focus));
  };
  giltRef.current = () => {
    if (viewer) return;
    const ids = (board === "timeline" ? timeline : shown).map((bench) => bench.id);
    store(giltFocused(benches, ids, focus));
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
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        giltRef.current();
        return;
      }
      if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        setBoard((current) => (current === "aisle" ? "timeline" : "aisle"));
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
    setBay("");
    setWeave("");
    setVoice("");
    setSpan("");
    setWatchValue("");
    setTag("");
    setQuery("");
    setEditing("");
  }
  function applyView(view: BenchView) {
    setTray(view.tray);
    setQuery(view.query);
    setKeeperFilter(view.keeper);
    setWeaveFilter(view.weave);
    setVoiceFilter(view.voice);
    setBayFilter(view.bay);
    setSpanFilter(view.span);
    setWatchFilter(view.watch);
  }
  const rows = board === "timeline" ? timeline : shown;
  return (
    <section className="c4-nvb" aria-label={v4("nvbTitle")} data-benches="1" data-role={role} data-density={density}>
      <div className="c4-nvb-sheet">
        <header className="c4-nvb-mast">
          <p className="c4-nvb-spine">{v4("nvbSpine")}</p>
          <div>
            <p className="c4-nvb-kicker">{v4("nvbSub")}</p>
            <h2 className="c4-title">{v4("nvbTitle")}</h2>
          </div>
          <p className="c4-nvb-plate" data-logo="mono">{v4("nvbLogo")}</p>
        </header>
        <div className="c4-nvb-body">
          <p className="c4-nvb-rules">{v4("nvbHint")}</p>
          <p className="c4-meta">{v4("nvbLocal")}</p>
          <p className="c4-meta">{v4("nvbNew")} {v4("nvbSlash")} {v4("nvbEscape")} {v4("nvbKeys")} {v4("nvbPinKey")} {v4("nvbGiltKey")} {v4("nvbBoardKey")}</p>
          {viewer && <p className="c4-nvb-notice" data-viewer="1">{v4("nvbViewer")}</p>}
          {counts.peak > 0 && (
            <p className="c4-nvb-notice" role="status">
              {v4("nvbNotice")} · {counts.peak}
              <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("nvbNoticeAll") : v4("nvbNoticePeak")}</button>
            </p>
          )}
          {counts.late > 0 && (
            <p className="c4-nvb-notice" role="status" data-late="1">{v4("nvbLateNotice")} · {counts.late}</p>
          )}
          <ol className="c4-nvb-ledger" aria-label={v4("nvbKpi")}>
            <li><span>{v4("nvbOpen")}</span><strong>{counts.open}</strong></li>
            <li><span>{v4("nvbHeld")}</span><strong>{counts.held}</strong></li>
            <li><span>{v4("nvbClosed")}</span><strong>{counts.closed}</strong></li>
            <li><span>{v4("nvbPinned")}</span><strong>{counts.pinned}</strong></li>
            <li><span>{v4("nvbPeak")}</span><strong>{counts.peak}</strong></li>
            <li><span>{v4("nvbLate")}</span><strong>{counts.late}</strong></li>
            <li><span>{v4("nvbSoon")}</span><strong>{counts.soon}</strong></li>
            <li><span>{v4("nvbGilt")}</span><strong>{counts.gilt}</strong></li>
            <li><span>{v4("nvbHouseShare")}</span><strong>{benchShare(counts.house, benches.length)}%</strong></li>
            <li><span>{v4("nvbLateShare")}</span><strong>{share}%</strong></li>
          </ol>
          <div className="c4-nvb-sla" aria-label={v4("nvbLateShare")}>
            <span>{v4("nvbLateShare")}</span>
            <div className="c4-nvb-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></div>
          </div>
          <div className="c4-nvb-rail" aria-label={v4("nvbWeaves")}>
            {bars.map((bar) => (
              <div key={bar.weave} className="c4-nvb-meter" data-weave={bar.weave.toLowerCase()}>
                <button type="button" className="c4-btn" onClick={() => setWeaveFilter(bar.weave)}>{weaveLabel(v4, bar.weave)} · {bar.count}</button>
                <div className="c4-nvb-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
              </div>
            ))}
            {!bars.length && <p className="c4-nvb-empty">{v4("nvbEmpty")}</p>}
          </div>
          <div className="c4-nvb-suggest">
            <p>{v4("nvbSuggestWeave")} · {weaveLabel(v4, suggestedWeave)}</p>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setWeave(suggestedWeave.toLowerCase())}>{v4("nvbUseWeave")}</button>
            <p>{v4("nvbSuggestKeeper")} · {suggestedKeeper || v4("nvbBlankKeeper")}</p>
            <button type="button" className="c4-btn" disabled={viewer || !suggestedKeeper} onClick={() => setKeeper(suggestedKeeper)}>{v4("nvbUseKeeper")}</button>
            <p>{v4("nvbSuggestWatch")} · {watchLabel(v4, suggestedWatch)}</p>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setWatchValue(String(suggestedWatch))}>{v4("nvbUseWatch")}</button>
            <p>{v4("nvbAssign")} · {fair || v4("nvbBlankKeeper")}</p>
            <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setKeeper(fair)}>{v4("nvbAssign")}</button>
          </div>
          <p className="c4-meta">{v4("nvbBays")} · {usedBays(benches)}</p>
          <p className="c4-meta">{clashes ? `${v4("nvbClash")} · ${clashes}` : v4("nvbClashNone")}</p>
          <p className="c4-meta">{spans ? `${v4("nvbSpanClash")} · ${spans}` : v4("nvbSpanClashNone")}</p>
          <p className="c4-meta">{neighbors ? `${v4("nvbAdjacent")} · ${neighbors}` : v4("nvbAdjacentNone")}</p>
          <p className="c4-meta">{pairKeeperCount(benches) ? `${v4("nvbPairs")} · ${pairKeeperCount(benches)}` : v4("nvbPairsNone")}</p>
          <p className="c4-meta">{`${v4("nvbGiltLoad")} · ${giltLoad(benches)}`}</p>
          <p className="c4-meta">{`${v4("nvbQuietHouse")} · ${quietHouseCount(benches)}`}</p>
          <p className="c4-meta">{`${v4("nvbFullLoad")} · ${fullLoad(benches)}`}</p>
          <p className="c4-meta">{`${v4("nvbBaySpan")} · ${baySpan(benches)}`}</p>
          <p className="c4-meta">{nextRow ? `${v4("nvbNext")} · ${nextRow.title}` : v4("nvbNextNone")}</p>
          <p className="c4-meta">{busy ? `${v4("nvbBusiest")} · ${busy}` : v4("nvbBusiestNone")}</p>
          <div className="c4-nvb-reminders" aria-label={v4("nvbReminders")}>
            {reminders.length ? reminders.map((bench) => <span key={bench.id}>{bench.title}</span>) : <span>{v4("nvbReminderNone")}</span>}
          </div>
          <div className="c4-nvb-window" aria-label={v4("nvbWindow")}>
            {windowRows.length ? windowRows.map((bench) => <span key={bench.id}>{bench.title}</span>) : <span>{v4("nvbWindowNone")}</span>}
          </div>
          <label className="c4-lab">{v4("nvbSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("nvbSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <div className="c4-nvb-filters" role="group" aria-label={v4("nvbSearch")}>
            {(["open", "held", "closed"] as const).map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("nvbOpenTray") : item === "held" ? v4("nvbHeldTray") : v4("nvbClosedTray")}</button>
            ))}
            <button type="button" className="c4-chip" data-on={keeperOn === "all" ? "1" : "0"} onClick={() => setKeeperFilter("all")}>{v4("nvbAll")}</button>
            <button type="button" className="c4-chip" data-on={keeperOn === "blank" ? "1" : "0"} onClick={() => setKeeperFilter("blank")}>{v4("nvbBlankKeeper")}</button>
            {keepers.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={keeperOn === name ? "1" : "0"} onClick={() => setKeeperFilter(name)}>{name}</button>
            ))}
            <button type="button" className="c4-chip" data-on={weaveOn === "all" ? "1" : "0"} onClick={() => setWeaveFilter("all")}>{v4("nvbWeave")}</button>
            <button type="button" className="c4-chip" data-on={weaveOn === "blank" ? "1" : "0"} onClick={() => setWeaveFilter("blank")}>{v4("nvbBlankWeave")}</button>
            {WEAVES.map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={weaveOn === item.toUpperCase() ? "1" : "0"} onClick={() => setWeaveFilter(item)}>{weaveLabel(v4, item)}</button>
            ))}
            <button type="button" className="c4-chip" data-on={voiceOn === "all" ? "1" : "0"} onClick={() => setVoiceFilter("all")}>{v4("nvbVoice")}</button>
            {VOICES.map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={voiceOn === item ? "1" : "0"} onClick={() => setVoiceFilter(item)}>{voiceLabel(v4, item)}</button>
            ))}
            {["all", "blank", "early", "mid", "late", "peak", "quiet", "1", "8"].map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={bayOn === item ? "1" : "0"} onClick={() => setBayFilter(item)}>{item === "all" ? v4("nvbBay") : item === "blank" ? v4("nvbBlankBay") : item === "early" ? v4("nvbEarly") : item === "mid" ? v4("nvbMid") : item === "late" ? v4("nvbLateBay") : item === "peak" ? v4("nvbPeak") : item === "quiet" ? v4("nvbQuiet") : item}</button>
            ))}
            {["all", "blank", "5", "10", "20"].map((item) => (
              <button key={`s${item}`} type="button" className="c4-chip" data-on={spanOn === item ? "1" : "0"} onClick={() => setSpanFilter(item)}>{item === "all" ? v4("nvbSpan") : item === "blank" ? v4("nvbBlankSpan") : spanLabel(v4, Number(item))}</button>
            ))}
            {["all", "blank", "20", "45", "90"].map((item) => (
              <button key={`w${item}`} type="button" className="c4-chip" data-on={watchOn === item ? "1" : "0"} onClick={() => setWatchFilter(item)}>{item === "all" ? v4("nvbWatch") : item === "blank" ? v4("nvbBlankWatch") : watchLabel(v4, Number(item))}</button>
            ))}
            <button type="button" className="c4-chip" data-on={fullOnly ? "1" : "0"} onClick={() => setFullOnly((on) => !on)}>{v4("nvbFullOnly")}</button>
            <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((on) => !on)}>{v4("nvbPeakOnly")}</button>
            <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((on) => !on)}>{v4("nvbHouseOnly")}</button>
            <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((on) => !on)}>{v4("nvbQuietOnly")}</button>
            <button type="button" className="c4-chip" data-on={awakeOnly ? "1" : "0"} onClick={() => setAwakeOnly((on) => !on)}>{v4("nvbUngiltOnly")}</button>
            <button type="button" className="c4-chip" data-on={order === "bay" ? "1" : "0"} onClick={() => setOrder(sortMode("bay"))}>{v4("nvbSortBay")}</button>
            <button type="button" className="c4-chip" data-on={order === "keeper" ? "1" : "0"} onClick={() => setOrder(sortMode("keeper"))}>{v4("nvbSortKeeper")}</button>
            <button type="button" className="c4-chip" data-on={density === "roomy" ? "1" : "0"} onClick={() => storeDensity("roomy")}>{v4("nvbRoomy")}</button>
            <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity("tight")}>{v4("nvbTight")}</button>
            <button type="button" className="c4-chip" data-on={board === "aisle" ? "1" : "0"} onClick={() => setBoard("aisle")}>{v4("nvbAisle")}</button>
            <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard("timeline")}>{v4("nvbTimeline")}</button>
          </div>
          <form className="c4-nvb-form" onSubmit={(event) => {
            event.preventDefault();
            if (viewer) return;
            store(addBench(benches, { id: `nvb-${Date.now()}`, title, note, keeper, bay, weave, voice, span, watch: watchValue, tags: tag }));
            clearDraft();
          }}>
            <label className="c4-lab">{v4("nvbLine")}<input ref={titleRef} className="c4-field" aria-label={v4("nvbLine")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
            <label className="c4-lab">{v4("nvbNote")}<input className="c4-field" aria-label={v4("nvbNote")} value={note} onChange={(event) => setNote(event.target.value)} /></label>
            <label className="c4-lab">{v4("nvbKeeper")}<input className="c4-field" aria-label={v4("nvbKeeper")} value={keeper} onChange={(event) => setKeeper(event.target.value)} /></label>
            <label className="c4-lab">{v4("nvbBay")}<input className="c4-field" aria-label={v4("nvbBay")} value={bay} onChange={(event) => setBay(event.target.value)} /></label>
            <label className="c4-lab">{v4("nvbWeave")}<input className="c4-field" aria-label={v4("nvbWeave")} value={weave} onChange={(event) => setWeave(event.target.value)} /></label>
            <label className="c4-lab">{v4("nvbVoice")}<input className="c4-field" aria-label={v4("nvbVoice")} value={voice} onChange={(event) => setVoice(event.target.value)} /></label>
            <label className="c4-lab">{v4("nvbSpan")}<input className="c4-field" aria-label={v4("nvbSpan")} value={span} onChange={(event) => setSpan(event.target.value)} /></label>
            <label className="c4-lab">{v4("nvbWatch")}<input className="c4-field" aria-label={v4("nvbWatch")} value={watchValue} onChange={(event) => setWatchValue(event.target.value)} /></label>
            <label className="c4-lab">{v4("nvbTag")}<input className="c4-field" aria-label={v4("nvbTag")} value={tag} onChange={(event) => setTag(event.target.value)} /></label>
            <button type="submit" className="c4-btn" disabled={viewer}>{v4("nvbSave")}</button>
          </form>
          <label className="c4-lab">{v4("nvbDeskBay")}<input className="c4-field" aria-label={v4("nvbDeskBay")} value={deskBay} onChange={(event) => setDeskBay(event.target.value)} /></label>
          <label className="c4-lab">{v4("nvbRoster")}<input className="c4-field" aria-label={v4("nvbRoster")} value={roster} onChange={(event) => setRoster(event.target.value)} /></label>
          <div className="c4-nvb-views">
            <label className="c4-lab">{v4("nvbViewName")}<input className="c4-field" aria-label={v4("nvbViewName")} value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
              const name = viewName.trim();
              if (!name) return;
              storeViews(addBenchView(views, { id: `view-${Date.now()}`, name, tray, query, keeper: keeperOn, weave: weaveOn, voice: voiceOn, bay: bayOn, span: spanOn, watch: watchOn }));
              setViewName("");
            }}>{v4("nvbSaveView")}</button>
            {views.map((view) => (
              <span key={view.id}>
                <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
                <button type="button" className="c4-btn" disabled={viewer} aria-label={v4("nvbDropView")} onClick={() => storeViews(dropBenchView(views, view.id))}>×</button>
              </span>
            ))}
          </div>
          <div className="c4-nvb-bulk">
            <label className="c4-lab">{v4("nvbBulkWeave")}<input className="c4-field" aria-label={v4("nvbBulkWeave")} value={moveWeave} onChange={(event) => setMoveWeave(event.target.value)} /></label>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBenchWeave(benches, picked, moveWeave))}>{v4("nvbBulkWeave")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBenchPin(benches, picked, true))}>{v4("nvbBulkPin")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBenchClose(benches, picked, true))}>{v4("nvbBulkClose")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBenchTag(benches, picked, tag))}>{v4("nvbBulkTag")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBenchVoice(benches, picked, voice))}>{v4("nvbBulkVoice")}</button>
            <button type="button" className="c4-btn" onClick={() => download("nave-benches.csv", benchesCsv(benches, deskBay))}>{v4("nvbCsv")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetBenches())}>{v4("nvbReset")}</button>
          </div>
          {!rows.length && <p className="c4-nvb-empty">{v4("nvbEmpty")}</p>}
          <ol className={board === "timeline" ? "c4-nvb-time" : "c4-nvb-book"}>
            {rows.map((bench, index) => (
              <li key={bench.id} data-focus={index === moveFocus(focus, rows.length, 0) ? "1" : "0"} data-weave={bench.weave.toLowerCase() || "blank"} data-late={lateBench(bench, deskBay) ? "1" : "0"} data-soon={soonBench(bench) ? "1" : "0"} data-house={houseWeave(bench.weave) ? "1" : "0"} data-peak={peakBay(bench.bay) ? "1" : "0"} data-quiet={quietBay(bench.bay) ? "1" : "0"}>
                <label className="c4-lab"><span className="c4-meta">{v4("nvbPick")}</span><input type="checkbox" aria-label={v4("nvbPick")} checked={picked.includes(bench.id)} onChange={() => setPicked((ids) => ids.includes(bench.id) ? ids.filter((id) => id !== bench.id) : [...ids, bench.id])} /></label>
                <div>
                  <strong>{bench.title}</strong>
                  <span className="c4-meta">{bench.keeper || v4("nvbBlankKeeper")} · {weaveLabel(v4, bench.weave)} · {voiceLabel(v4, bench.voice)} · {spanLabel(v4, bench.span)} · {watchLabel(v4, bench.watch)} · {gapLabel(v4, bench.bay, deskBay)}</span>
                  {bench.note && <span className="c4-meta">{bench.note}</span>}
                  {bench.tags.length > 0 && <span className="c4-meta">{bench.tags.join(" ")}</span>}
                  {bench.audit && <span className="c4-meta">{v4("nvbAudit")} · {auditLabel(v4, bench.audit)}</span>}
                  {editing === bench.id && (
                    <div className="c4-row">
                      <input className="c4-field" aria-label={v4("nvbLine")} value={draft} onChange={(event) => setDraft(event.target.value)} />
                      <input className="c4-field" aria-label={v4("nvbNote")} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} />
                      <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(editBenchNote(editBench(benches, bench.id, draft), bench.id, noteDraft)); setEditing(""); }}>{v4("nvbApply")}</button>
                    </div>
                  )}
                  <div className="c4-row">
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBenchPin(benches, bench.id, !bench.pinned))}>{bench.pinned ? v4("nvbUnpin") : v4("nvbPin")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBenchHold(benches, bench.id, !bench.held))}>{bench.held ? v4("nvbLift") : v4("nvbHold")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleVoice(benches, bench.id))}>{v4("nvbVoice")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addBenchTag(benches, bench.id, tag))}>{v4("nvbTag")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBenchClose(benches, bench.id, !bench.closed))}>{bench.closed ? v4("nvbReopen") : v4("nvbClose")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBenchGilt(benches, bench.id, bench.gilt ? 0 : 1))}>{bench.gilt ? v4("nvbGiltOff") : v4("nvbGiltOn")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(bench.id); setDraft(bench.title); setNoteDraft(bench.note); }}>{v4("nvbEdit")}</button>
                    <button type="button" className="c4-btn" onClick={() => { const line = benchCopy(bench, deskBay); void navigator.clipboard?.writeText(line); setCopied(bench.id); }}>{copied === bench.id ? v4("nvbCopied") : v4("nvbCopy")}</button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <p className="c4-nvb-rules">{v4("nvbRules")}</p>
        </div>
      </div>
    </section>
  );
}

export function LanguageRibbons({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [band, setBand] = useState("all");
  const [tone, setTone] = useState("all");
  const [shape, setShape] = useState<RibbonShape>("all");
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
    note: { language: user.language ?? null },
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
    const present = presentRibbons(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenRibbons(readJson(LNR_KEY, []), present);
    const nextReviewed = readReviewedRibbons(readJson(LNR_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(LNR_KEY, nextHidden);
    writeJson(LNR_REVIEW_KEY, nextReviewed);
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
  const present = presentRibbons(rows);
  const bands = visibleRibbonBands(present, hidden, showHidden);
  const bandOn = activeRibbonBand(band, present);
  const toneOn = activeRibbonTone(tone);
  const shown = visibleRibbonCustomers(rows, ribbonBandArg(bandOn), ribbonToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = ribbonState(row.note);
      const token = state === "set" ? ribbonBand(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return bands.includes(token);
    });
  const lead = leadingRibbon(rows);
  const toneLead = leadingRibbonTone(rows);
  const shared = sharedRibbonCount(rows);
  const catalog = catalogRibbonCount(rows);
  const bars = ribbonBands(rows).filter((line) => line.band);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(LNR_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedRibbons(next, ids);
    setReviewed(saved);
    writeJson(LNR_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-lnr" aria-label={v4("lnrTitle")} data-ribbons="1" data-role={role} data-catalog={catalog ? "1" : "0"}>
      <div className="c4-lnr-sheet">
        <header className="c4-lnr-mast">
          <div>
            <p className="c4-lnr-kicker">{v4("lnrSub")}</p>
            <h2 className="c4-title">{v4("lnrTitle")}</h2>
          </div>
          <p className="c4-lnr-plate" data-logo="mono">{v4("lnrLogo")}</p>
        </header>
        <p className="c4-lnr-rules">{v4("lnrHint")}</p>
        <p className="c4-meta">{v4("lnrKept")} {v4("lnrEscape")}</p>
        {viewer && <p className="c4-lnr-notice" data-viewer="1">{v4("lnrViewer")}</p>}
        {data.error && <p className="c4-lnr-empty" role="alert">{v4("lnrFailed")}</p>}
        {data.loading && <p className="c4-meta">{v4("lnrLoading")}</p>}
        {shared > 0 && <p className="c4-lnr-notice" role="status">{v4("lnrNotice")} · {shared}</p>}
        <ol className="c4-lnr-ledger" aria-label={v4("lnrKpi")}>
          <li><span>{v4("lnrSet")}</span><strong>{rows.filter((row) => ribbonState(row.note) === "set").length}</strong></li>
          <li><span>{v4("lnrCatalog")}</span><strong>{catalog}</strong></li>
          <li><span>{v4("lnrWide")}</span><strong>{wideRibbonCount(rows)}</strong></li>
          <li><span>{v4("lnrGiltCount")}</span><strong>{giltRibbonCount(rows)}</strong></li>
          <li><span>{v4("lnrShare")}</span><strong>{ribbonShare(catalog, rows.length)}%</strong></li>
          <li><span>{v4("lnrShared")}</span><strong>{shared}</strong></li>
        </ol>
        <div className="c4-lnr-rail" aria-label={v4("lnrBands")}>
          {bars.map((bar) => (
            <div key={bar.band} className="c4-lnr-meter">
              <button type="button" className="c4-btn" onClick={() => setBand(bar.band)}>{bandLabel(v4, bar.band)} · {bar.count}</button>
              <div className="c4-lnr-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            </div>
          ))}
          {!bars.length && <p className="c4-lnr-empty">{v4("lnrEmpty")}</p>}
        </div>
        <div className="c4-lnr-suggest">
          <p>{v4("lnrLeading")} · {lead ? bandLabel(v4, lead) : v4("lnrLeadingNone")}</p>
          <p>{v4("lnrToneLead")} · {toneLead ? ribbonToneLabel(v4, toneLead) : v4("lnrToneNone")}</p>
          <p>{shared ? `${v4("lnrShared")} · ${shared}` : v4("lnrSharedNone")}</p>
        </div>
        <label className="c4-lab">{v4("lnrSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("lnrSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <div className="c4-lnr-filters">
          <button type="button" className="c4-chip" data-on={bandOn === "all" ? "1" : "0"} onClick={() => setBand("all")}>{v4("lnrAll")}</button>
          <button type="button" className="c4-chip" data-on={bandOn === "blank" ? "1" : "0"} onClick={() => setBand("blank")}>{v4("lnrClear")}</button>
          {BANDS.map((item) => (
            <button key={item} type="button" className="c4-chip" data-on={bandOn === item ? "1" : "0"} onClick={() => setBand(item)}>{bandLabel(v4, item)}</button>
          ))}
          <button type="button" className="c4-chip" data-on={toneOn === "all" ? "1" : "0"} onClick={() => setTone("all")}>{v4("lnrTone")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "gilt" ? "1" : "0"} onClick={() => setTone("gilt")}>{v4("lnrGilt")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "ink" ? "1" : "0"} onClick={() => setTone("ink")}>{v4("lnrInk")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "ivory" ? "1" : "0"} onClick={() => setTone("ivory")}>{v4("lnrIvory")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "mist" ? "1" : "0"} onClick={() => setTone("mist")}>{v4("lnrMist")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "plain" ? "1" : "0"} onClick={() => setTone("plain")}>{v4("lnrTonePlain")}</button>
          {(["all", "catalog", "wide", "gilt"] as const).map((item) => (
            <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{item === "all" ? v4("lnrAllShapes") : item === "catalog" ? v4("lnrCatalog") : item === "wide" ? v4("lnrWide") : v4("lnrGilt")}</button>
          ))}
          <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} onClick={() => setReview("all")}>{v4("lnrAllReview")}</button>
          <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview("reviewed")}>{v4("lnrReviewed")}</button>
          <button type="button" className="c4-chip" data-on={review === "open" ? "1" : "0"} onClick={() => setReview("open")}>{v4("lnrOpenReview")}</button>
          <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("lnrShown") : v4("lnrHidden")}</button>
        </div>
        <div className="c4-lnr-bands">
          {present.map((item) => (
            <button key={item} type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleRibbon(hidden, item))}>
              {bandLabel(v4, item)} · {hidden.includes(item) ? v4("lnrShow") : v4("lnrHide")}
            </button>
          ))}
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkRibbonReview(reviewed, shown.map((row) => row.id), true))}>{v4("lnrBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkRibbonReview(reviewed, ids, false))}>{v4("lnrBulkClear")}</button>
          <button type="button" className="c4-btn" onClick={() => download("language-ribbons.csv", ribbonsCsv(rows))}>{v4("lnrCsv")}</button>
          <button type="button" className="c4-btn" onClick={() => download("language-ribbon-rows.csv", ribbonRowsCsv(rows, reviewed))}>{v4("lnrRowCsv")}</button>
          <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("lnrCustomers")}</Link>
        </div>
        {!shown.length && <p className="c4-lnr-empty">{v4("lnrEmpty")}</p>}
        <ul className="c4-lnr-index">
          {shown.map((row) => {
            const state = ribbonState(row.note);
            const mark = ribbonOf(row.note);
            return (
              <li key={row.id} data-state={state || "blank"} data-band={state === "set" ? ribbonBand(row.note) : "blank"} data-tone={ribbonTone(row.note) || "blank"} data-catalog={catalogRibbon(row.note) ? "1" : "0"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"}>
                <p className="c4-lnr-mark" data-logo="mono">{mark || "—"}</p>
                <div>
                  <strong>{row.label || row.id}</strong>
                  <span className="c4-meta">{bandLabel(v4, state === "set" ? ribbonBand(row.note) : state === "clear" ? "blank" : "")} · {ribbonToneLabel(v4, ribbonTone(row.note))}</span>
                  {catalogRibbon(row.note) && <span className="c4-meta">{v4("lnrCatalogMark")}</span>}
                  <div className="c4-row">
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleRibbonReview(reviewed, row.id))}>{v4("lnrReview")}</button>
                    <button type="button" className="c4-btn" onClick={() => { const line = ribbonCopy(row.note); void navigator.clipboard?.writeText(line); setCopied(row.id); }}>{copied === row.id ? v4("lnrCopied") : v4("lnrCopy")}</button>
                    <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{row.label || row.id}</Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="c4-lnr-rules">{v4("lnrRules")}</p>
      </div>
    </section>
  );
}
