"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  NTP_KEY,
  NTP_REVIEW_KEY,
  RELIC_SEASONS,
  RLQ_DENSITY_KEY,
  RLQ_KEY,
  RLQ_VIEW_KEY,
  addSlip,
  addSlipTag,
  addSlipView,
  bulkPlateReview,
  bulkSlipFile,
  bulkSlipPin,
  bulkSlipRush,
  bulkSlipSilk,
  bulkSlipTag,
  busiestKeeper,
  clashSeasonCount,
  cycleCadence,
  dropSlipView,
  editSlip,
  editSlipNote,
  fairKeeper,
  houseFiber,
  huePlateCount,
  idleSlip,
  idleSlips,
  lanePlateCount,
  lateSlip,
  leadingPlate,
  leadingPlateHue,
  lengthenFocusedSlip,
  lengthenWindow,
  lowerFocusedSlip,
  lowerWarmth,
  moveSlipFocus,
  neighborSlipCount,
  overdueSlip,
  paceFocusedSlip,
  peakSeason,
  pinFocusedSlip,
  plateCopy,
  plateEcho,
  plateHue,
  plateLane,
  plateLanes,
  plateLanesCsv,
  plateLeap,
  plateNotch,
  plateRowsCsv,
  plateShare,
  plateSpoken,
  plateStamp,
  plateState,
  plateStep,
  plateWide,
  presentPlateLanes,
  quietSeason,
  raiseFocusedSlip,
  raiseWarmth,
  readHiddenPlates,
  readReviewedPlates,
  readSlipViews,
  readSlips,
  relicDensity,
  reminderSlips,
  restingSlip,
  rushSlip,
  setSlipFiber,
  setSlipFile,
  setSlipPin,
  setSlipStar,
  setSlipWait,
  sharedPlateCount,
  shortenFocusedSlip,
  shortenWindow,
  slipBars,
  slipCopy,
  slipCounts,
  slipCsv,
  slipKeepers,
  slipShare,
  slipTimeline,
  sortSlips,
  starFocusedSlip,
  suggestFiber,
  suggestWindow,
  tagFocusedSlip,
  togglePlate,
  togglePlateReview,
  visiblePlateLanes,
  visiblePlates,
  visibleSlips,
  waitFocusedSlip,
  type PlateReview,
  type PlateRow,
  type PlateShape,
  type PlateValue,
  type RelicDensity,
  type RelicSlip,
  type RelicSort,
  type RelicTray,
  type RelicView,
} from "@/lib/crmv4/round256";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FIBERS = ["linen", "wool", "silk"] as const;
const CADENCES = ["hush", "walk", "rush"] as const;
const WINDOWS = ["7", "14", "28"] as const;
const WARMTHS = ["2", "4", "6", "8"] as const;

const SEASON_KEY: Record<string, CrmV4CopyKey> = {
  frost: "rlqFrost",
  thaw: "rlqThaw",
  bloom: "rlqBloom",
  harvest: "rlqHarvest",
  peak: "rlqPeakSeason",
  quiet: "rlqQuietSeason",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "rlqAuditSave",
  edit: "rlqAuditEdit",
  note: "rlqAuditNote",
  cadence: "rlqAuditCadence",
  pin: "rlqAuditPin",
  unpin: "rlqAuditUnpin",
  hold: "rlqAuditWait",
  resume: "rlqAuditResume",
  shelve: "rlqAuditFile",
  open: "rlqAuditOpen",
  fiber: "rlqAuditFiber",
  tag: "rlqAuditTag",
  warmth: "rlqAuditWarmth",
  window: "rlqAuditWindow",
  short: "rlqAuditShort",
  flag: "rlqAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  winter: "ntpWinter",
  spring: "ntpSpring",
  summer: "ntpSummer",
  autumn: "ntpAutumn",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "ntpIvory",
  graphite: "ntpGraphite",
  champagne: "ntpChampagne",
};

type TraderRow = {
  id?: string;
  name?: string | null;
  birthDate?: string | null;
};

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

function textField(raw: unknown): string {
  return typeof raw === "string" ? raw : "";
}

function seasonLabel(v4: V4, season: string): string {
  const key = SEASON_KEY[season];
  return key ? v4(key) : v4("rlqBlank");
}

function fiberLabel(v4: V4, fiber: string): string {
  if (fiber === "LINEN" || fiber === "linen") return v4("rlqLinen");
  if (fiber === "WOOL" || fiber === "wool") return v4("rlqWool");
  if (fiber === "SILK" || fiber === "silk") return v4("rlqSilk");
  return v4("rlqBlankFiber");
}

function cadenceLabel(v4: V4, cadence: string): string {
  if (cadence === "hush") return v4("rlqHush");
  if (cadence === "walk") return v4("rlqWalk");
  if (cadence === "rush") return v4("rlqRushPace");
  return v4("rlqBlankCadence");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("ntpUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("ntpUnmarked");
}

export function ReliquarySlips({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<RelicSlip[]>([]);
  const [views, setViews] = useState<RelicView[]>([]);
  const [density, setDensity] = useState<RelicDensity>("airy");
  const [sort, setSort] = useState<RelicSort>("season");
  const [tray, setTray] = useState<RelicTray>("open");
  const [query, setQuery] = useState("");
  const [keeperFilter, setKeeperFilter] = useState("all");
  const [fiberFilter, setFiberFilter] = useState("all");
  const [cadenceFilter, setCadenceFilter] = useState("all");
  const [seasonFilter, setSeasonFilter] = useState("all");
  const [windowFilter, setWindowFilter] = useState("all");
  const [warmthFilter, setWarmthFilter] = useState("all");
  const [houseOnly, setHouseOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [desk, setDesk] = useState("thaw");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [keeper, setKeeper] = useState("");
  const [season, setSeason] = useState("");
  const [fiber, setFiber] = useState("");
  const [cadence, setCadence] = useState("");
  const [windowDays, setWindowDays] = useState("");
  const [warmth, setWarmth] = useState("2");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [board, setBoard] = useState<"hall" | "index">("hall");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    setCards(readSlips(readJson(RLQ_KEY, [])));
    setViews(readSlipViews(readJson(RLQ_VIEW_KEY, [])));
    setDensity(relicDensity(readJson(RLQ_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  const shown = sortSlips(visibleSlips(cards, tray, query, keeperFilter, fiberFilter, cadenceFilter, seasonFilter, windowFilter, warmthFilter, houseOnly, peakOnly, quietOnly), sort);
  const focusAt = shown.length ? focus % shown.length : 0;
  const counts = slipCounts(cards, shown, desk);
  const timeline = slipTimeline(cards);
  const reminders = reminderSlips(cards);
  const idling = idleSlips(cards);
  const keepers = slipKeepers(cards);
  const bars = slipBars(cards);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = shown.map((card) => card.id);
  const busy = busiestKeeper(cards);
  const hour = new Date().getUTCHours();
  const suggested = suggestFiber(cards);
  const fair = fairKeeper(cards, keepers.join(", ") || "Ada, Bea");
  function store(next: RelicSlip[]) {
    const saved = readSlips(next);
    setCards(saved);
    writeJson(RLQ_KEY, saved);
  }
  function storeViews(next: RelicView[]) {
    const saved = readSlipViews(next);
    setViews(saved);
    writeJson(RLQ_VIEW_KEY, saved);
  }
  function storeDensity(next: RelicDensity) {
    setDensity(next);
    writeJson(RLQ_DENSITY_KEY, next);
  }
  function togglePick(id: string) {
    setPicked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }
  function applyView(view: RelicView) {
    setTray(view.tray);
    setQuery(view.query);
    setKeeperFilter(view.keeper || "all");
    setFiberFilter(view.fiber);
    setCadenceFilter(view.cadence);
    setSeasonFilter(view.season);
    setWindowFilter(view.window);
    setWarmthFilter(view.warmth);
  }
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setKeeper("");
        setSeason("");
        setFiber("");
        setCadence("");
        setWindowDays("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveSlipFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveSlipFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        if (!viewer) store(waitFocusedSlip(cards, ids, focusAt));
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        if (!viewer) store(pinFocusedSlip(cards, ids, focusAt));
        return;
      }
      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        if (!viewer) store(paceFocusedSlip(cards, ids, focusAt));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        if (!viewer) store(lengthenFocusedSlip(cards, ids, focusAt));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        if (!viewer) store(shortenFocusedSlip(cards, ids, focusAt));
        return;
      }
      if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        if (!viewer) store(tagFocusedSlip(cards, ids, focusAt, "a"));
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        if (!viewer) store(starFocusedSlip(cards, ids, focusAt));
        return;
      }
      if (event.key === "b" || event.key === "B") {
        event.preventDefault();
        if (!viewer) store(raiseFocusedSlip(cards, ids, focusAt));
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        if (!viewer) store(lowerFocusedSlip(cards, ids, focusAt));
        return;
      }
      if (event.key === "d" || event.key === "D") {
        event.preventDefault();
        setBoard((value) => value === "hall" ? "index" : "hall");
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown.length, viewer, cards, ids, focusAt]);
  return (
    <section className="c4-rlq" aria-label={v4("rlqTitle")} data-cards="1" data-desk="reliquary" data-role={role} data-density={density} data-board={board}>
      <header className="c4-rlq-mast">
        <p className="c4-rlq-seal" data-logo="mono">{v4("rlqLogo")}</p>
        <div>
          <p className="c4-rlq-kicker">{v4("rlqSub")}</p>
          <h2 className="c4-title">{v4("rlqTitle")}</h2>
        </div>
        <ol className="c4-rlq-index" aria-label={v4("rlqTitle")}>
          <li data-tone="gold">{v4("rlqChampagne")}</li>
          <li data-tone="ink">{v4("rlqGraphite")}</li>
          <li data-tone="ivory">{v4("rlqIvory")}</li>
        </ol>
      </header>
      <p className="c4-rlq-links">
        <Link href={crmv4Href(base, "ntp")}>{v4("rlqPlates")}</Link>
        <Link href={crmv4Href(base, "stale")}>{v4("rlqGlance")}</Link>
        <Link href={crmv4Href(base, "prep")}>{v4("rlqPrep")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("rlqCustomers")}</Link>
      </p>
      {viewer && <p className="c4-rlq-note">{v4("rlqViewer")}</p>}
      <p className="c4-rlq-lead">{v4("rlqKeys")}</p>
      <p className="c4-rlq-hint">{v4("rlqHint")}</p>
      <ul className="c4-rlq-kpis" aria-label={v4("rlqChart")}>
        <li><span>{v4("rlqOpen")}</span><strong>{counts.open}</strong></li>
        <li><span>{v4("rlqHeld")}</span><strong>{counts.held}</strong></li>
        <li><span>{v4("rlqFile")}</span><strong>{counts.shelved}</strong></li>
        <li><span>{v4("rlqPinned")}</span><strong>{counts.pinned}</strong></li>
        <li><span>{v4("rlqOverdue")}</span><strong>{counts.overdue}</strong></li>
        <li><span>{v4("rlqPeak")}</span><strong>{counts.peak}</strong></li>
        <li><span>{v4("rlqQuiet")}</span><strong>{counts.quiet}</strong></li>
        <li><span>{v4("rlqHouse")}</span><strong>{slipShare(counts.house, Math.max(1, counts.open))}%</strong></li>
        <li><span>{v4("rlqIdle")}</span><strong>{counts.idle}</strong></li>
        <li><span>{v4("rlqRush")}</span><strong>{counts.rush}</strong></li>
        <li><span>{v4("rlqResting")}</span><strong>{counts.resting}</strong></li>
        <li><span>{v4("rlqSoon")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("rlqMatched")}</span><strong>{counts.matched}</strong></li>
      </ul>
      <div className="c4-rlq-chart" aria-label={v4("rlqBars")}>
        {bars.map((bar) => (
          <div key={bar.season} className="c4-rlq-bar" data-season={bar.season}>
            <i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <span>{seasonLabel(v4, bar.season)}</span>
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <ol className="c4-rlq-time" aria-label={v4("rlqTimeline")}>
        {timeline.map((lane) => (
          <li key={lane.warmth}><span>{v4("rlqWarmth")} {lane.warmth}</span><em>{lane.titles.join(" · ")}</em></li>
        ))}
      </ol>
      <div className="c4-rlq-tools">
        <label className="c4-lab">
          <span>{v4("rlqDesk")}</span>
          <select className="c4-select" aria-label={v4("rlqDesk")} value={desk} onChange={(event) => setDesk(event.target.value)}>
            {RELIC_SEASONS.map((item) => <option key={item} value={item}>{seasonLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("rlqSearch")}</span>
          <input ref={searchRef} className="c4-field c4-rlq-search" aria-label={v4("rlqSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        {(["open", "held", "shelved"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("rlqOpen") : item === "held" ? v4("rlqHeld") : v4("rlqFile")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("rlqHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((value) => !value)}>{v4("rlqPeak")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((value) => !value)}>{v4("rlqQuiet")}</button>
        <button type="button" className="c4-chip" data-on={sort === "keeper" ? "1" : "0"} onClick={() => setSort((value) => value === "season" ? "keeper" : "season")}>{sort === "keeper" ? v4("rlqSortKeeper") : v4("rlqSortSeason")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "airy" ? "tight" : "airy")}>{density === "airy" ? v4("rlqAiry") : v4("rlqTight")}</button>
        <button type="button" className="c4-chip" onClick={() => setBoard((value) => value === "hall" ? "index" : "hall")}>{board === "hall" ? v4("rlqHall") : v4("rlqIndex")}</button>
      </div>
      <div className="c4-rlq-tools">
        <select className="c4-select" aria-label={v4("rlqKeeper")} value={keeperFilter} onChange={(event) => setKeeperFilter(event.target.value)}>
          <option value="all">{v4("rlqAll")}</option>
          {keepers.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("rlqFiber")} value={fiberFilter} onChange={(event) => setFiberFilter(event.target.value)}>
          <option value="all">{v4("rlqAll")}</option>
          {FIBERS.map((item) => <option key={item} value={item}>{fiberLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("rlqCadence")} value={cadenceFilter} onChange={(event) => setCadenceFilter(event.target.value)}>
          <option value="all">{v4("rlqAll")}</option>
          {CADENCES.map((item) => <option key={item} value={item}>{cadenceLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("rlqDesk")} value={seasonFilter} onChange={(event) => setSeasonFilter(event.target.value)}>
          <option value="all">{v4("rlqAll")}</option>
          <option value="peak">{v4("rlqPeakSeason")}</option>
          <option value="quiet">{v4("rlqQuietSeason")}</option>
          {RELIC_SEASONS.map((item) => <option key={item} value={item}>{seasonLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("rlqWindow")} value={windowFilter} onChange={(event) => setWindowFilter(event.target.value)}>
          <option value="all">{v4("rlqAll")}</option>
          {WINDOWS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("rlqWarmth")} value={warmthFilter} onChange={(event) => setWarmthFilter(event.target.value)}>
          <option value="all">{v4("rlqAll")}</option>
          {WARMTHS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      <form className="c4-rlq-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addSlip(cards, { id: `slip-${Date.now()}`, title, note, keeper: keeper || fair, season, window: windowDays || String(suggestWindow(cards, hour)), fiber: fiber || suggested.toLowerCase(), cadence, warmth, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <label className="c4-lab"><span>{v4("rlqTitleField")}</span><input className="c4-field" aria-label={v4("rlqTitleField")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("rlqNote")}</span><input className="c4-field" aria-label={v4("rlqNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <p className="c4-rlq-meta">{v4("rlqNoteOptional")}</p>
        <label className="c4-lab"><span>{v4("rlqKeeper")}</span><input className="c4-field" aria-label={v4("rlqKeeper")} value={keeper} disabled={viewer} onChange={(event) => setKeeper(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("rlqDesk")}</span>
          <select className="c4-select" aria-label={v4("rlqFrost")} value={season} disabled={viewer} onChange={(event) => setSeason(event.target.value)}>
            <option value="">{v4("rlqBlank")}</option>
            {RELIC_SEASONS.map((item) => <option key={item} value={item}>{seasonLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("rlqFiber")}</span>
          <select className="c4-select" aria-label={v4("rlqFiber")} value={fiber} disabled={viewer} onChange={(event) => setFiber(event.target.value)}>
            <option value="">{fiberLabel(v4, suggested)}</option>
            {FIBERS.map((item) => <option key={item} value={item}>{fiberLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("rlqCadence")}</span>
          <select className="c4-select" aria-label={v4("rlqCadence")} value={cadence} disabled={viewer} onChange={(event) => setCadence(event.target.value)}>
            <option value="">{v4("rlqBlankCadence")}</option>
            {CADENCES.map((item) => <option key={item} value={item}>{cadenceLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("rlqWindow")}</span>
          <select className="c4-select" aria-label={v4("rlqWindow")} value={windowDays} disabled={viewer} onChange={(event) => setWindowDays(event.target.value)}>
            <option value="">{suggestWindow(cards, hour)}</option>
            {WINDOWS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("rlqWarmth")}</span>
          <select className="c4-select" aria-label={v4("rlqWarmth")} value={warmth} disabled={viewer} onChange={(event) => setWarmth(event.target.value)}>
            {WARMTHS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("rlqTags")}</span><input className="c4-field" aria-label={v4("rlqTags")} value={tags} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("rlqAdd")}</button>
      </form>
      <form className="c4-rlq-tools" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        storeViews(addSlipView(views, { id: `view-${Date.now()}`, name: viewName, tray, query, keeper: keeperFilter, fiber: fiberFilter, cadence: cadenceFilter, season: seasonFilter, window: windowFilter, warmth: warmthFilter }));
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("rlqViewName")}</span><input className="c4-field" aria-label={v4("rlqViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("rlqSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-rlq-view">
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("rlqApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropSlipView(views, view.id))}>{v4("rlqDropView")}</button>
          </span>
        ))}
      </form>
      {picked.length > 0 && (
        <div className="c4-rlq-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSlipPin(cards, picked))}>{v4("rlqBulkPin")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSlipFile(cards, picked))}>{v4("rlqBulkFile")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSlipRush(cards, picked))}>{v4("rlqBulkRush")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSlipSilk(cards, picked))}>{v4("rlqBulkSilk")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSlipTag(cards, picked, "b"))}>{v4("rlqBulkTag")}</button>
        </div>
      )}
      <p className="c4-rlq-meta">{v4("rlqSuggest")} {fiberLabel(v4, suggested)} · {v4("rlqFair")} {fair} · {v4("rlqBusy")} {busy || v4("rlqBlankKeeper")} · {v4("rlqNeighbors")} {neighborSlipCount(cards)} · {v4("rlqClash")} {clashSeasonCount(cards)}</p>
      {(reminders.length > 0 || idling.length > 0) && (
        <p className="c4-rlq-meta">{v4("rlqDue")} {reminders.map((card) => card.title).join(" · ")} · {v4("rlqIdle")} {idling.map((card) => card.title).join(" · ")}</p>
      )}
      {!shown.length && <p className="c4-rlq-empty">{v4("rlqEmpty")}</p>}
      <ol className="c4-rlq-board" data-density={density}>
        {shown.map((card, index) => (
          <li key={card.id} className="c4-rlq-card" data-on={index === focusAt ? "1" : "0"} data-pinned={card.pinned ? "1" : "0"} data-overdue={overdueSlip(card) ? "1" : "0"} data-peak={peakSeason(card.season) ? "1" : "0"} data-quiet={quietSeason(card.season) ? "1" : "0"} data-house={houseFiber(card.fiber) ? "1" : "0"} data-rush={rushSlip(card) ? "1" : "0"} data-idle={idleSlip(card) ? "1" : "0"} data-resting={restingSlip(card) ? "1" : "0"} data-late={lateSlip(card, desk) ? "1" : "0"}>
            <label className="c4-rlq-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => togglePick(card.id)} /></label>
            <div>
              <input className="c4-field" aria-label={v4("rlqEdit")} value={card.title} disabled={viewer} onChange={(event) => store(editSlip(cards, card.id, event.target.value))} />
              <input className="c4-field" aria-label={v4("rlqEditNote")} aria-required={false} value={card.note} disabled={viewer} onChange={(event) => store(editSlipNote(cards, card.id, event.target.value))} />
              <p className="c4-rlq-meta">{card.keeper || v4("rlqBlankKeeper")} · {seasonLabel(v4, card.season)} · {fiberLabel(v4, card.fiber)} · {cadenceLabel(v4, card.cadence)} · {card.window ?? v4("rlqBlankWindow")} · {v4("rlqRank")} {card.warmth} · {card.tags.join(" ") || v4("rlqTags")}</p>
              <p className="c4-rlq-sla" aria-label={v4("rlqSpan")}><i style={{ width: `${Math.round(((card.window ?? 0) / 28) * 100)}%` }} /></p>
              <p className="c4-rlq-meta">{seasonLabel(v4, desk)} · {AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : v4("rlqAuditSave")}</p>
              <div className="c4-rlq-tools">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("rlqUnpin") : v4("rlqPin")}</button>
                <button type="button" className="c4-btn" disabled={viewer || card.shelved} onClick={() => store(setSlipWait(cards, card.id, !card.held))}>{card.held ? v4("rlqResume") : v4("rlqWait")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipFile(cards, card.id, !card.shelved))}>{card.shelved ? v4("rlqOpenAgain") : v4("rlqFile")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("rlqUnstar") : v4("rlqStar")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleCadence(cards, card.id))}>{v4("rlqTempo")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lengthenWindow(cards, card.id))}>{v4("rlqLengthen")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(shortenWindow(cards, card.id))}>{v4("rlqShorten")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseWarmth(cards, card.id))}>{v4("rlqRaise")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerWarmth(cards, card.id))}>{v4("rlqLower")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipFiber(cards, card.id, card.fiber === "SILK" ? "linen" : "silk"))}>{v4("rlqInk")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addSlipTag(cards, card.id, "c"))}>{v4("rlqTags")}</button>
                <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(slipCopy(card)); setCopied(card.id); }}>{copied === card.id ? v4("rlqCopied") : v4("rlqCopy")}</button>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <button type="button" className="c4-btn" onClick={() => download("reliquary-slips.csv", slipCsv(shown, desk))}>{v4("rlqCsv")}</button>
    </section>
  );
}

export function NatalPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: TraderRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [shape, setShape] = useState<PlateShape>("all");
  const [review, setReview] = useState<PlateReview>("all");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<PlateRow[]>(() => (queue.data?.users || []).map((row, index) => ({
    id: row.id ? `trader-${row.id}` : `trader-${index}`,
    label: textField(row.name),
    note: { birthDate: textField(row.birthDate) } satisfies PlateValue,
  })), [queue.data?.users]);
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
    const present = presentPlateLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenPlates(readJson(NTP_KEY, []), present);
    const nextReviewed = readReviewedPlates(readJson(NTP_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(NTP_KEY, nextHidden);
    writeJson(NTP_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentPlateLanes(rows);
  const lanes = visiblePlateLanes(present, hidden, showHidden);
  const shown = visiblePlates(rows, lane, hue, query, review, reviewed, shape).filter((row) => {
    const token = plateLane(row.note);
    if (!token) return true;
    return showHidden || !hidden.includes(token);
  });
  const focusAt = shown.length ? focus % shown.length : 0;
  const bars = plateLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingPlate(rows);
  const leadHue = leadingPlateHue(rows);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveSlipFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveSlipFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        setShowHidden((value) => !value);
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown, focusAt]);
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(NTP_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(NTP_REVIEW_KEY, next);
  }
  return (
    <section className="c4-ntp" aria-label={v4("ntpTitle")} data-plates="1" data-traders={rows.length} data-role={role}>
      <header className="c4-ntp-mast">
        <p className="c4-ntp-seal" data-logo="mono">{v4("ntpLogo")}</p>
        <div>
          <p className="c4-ntp-kicker">{v4("ntpSub")}</p>
          <h2 className="c4-title">{v4("ntpTitle")}</h2>
        </div>
        <ol className="c4-ntp-index" aria-label={v4("ntpTitle")}>
          <li data-tone="gold">{v4("ntpChampagne")}</li>
          <li data-tone="ink">{v4("ntpGraphite")}</li>
          <li data-tone="ivory">{v4("ntpIvory")}</li>
        </ol>
      </header>
      <p className="c4-ntp-links">
        <Link href={crmv4Href(base, "rlq")}>{v4("ntpCards")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("rlqCustomers")}</Link>
      </p>
      <p className="c4-ntp-hint">{v4("ntpHint")}</p>
      {viewer && <p className="c4-ntp-note">{v4("ntpViewer")}</p>}
      {queue.loading && <p className="c4-ntp-meta">{v4("ntpEmpty")}</p>}
      {queue.error && <p className="c4-ntp-meta">{queue.error}</p>}
      <ul className="c4-ntp-kpis" aria-label={v4("ntpRules")}>
        <li><span>{v4("ntpLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("ntpUnmarked")}</strong></li>
        <li><span>{v4("ntpToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("ntpUnmarked")}</strong></li>
        <li><span>{v4("ntpShared")}</span><strong>{sharedPlateCount(rows)}</strong></li>
        <li><span>{v4("ntpShare")}</span><strong>{plateShare(lanePlateCount(rows, "winter"), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("ntpWide")}</span><strong>{rows.filter((row) => plateWide(row.note)).length}</strong></li>
        <li><span>{v4("ntpNotch")}</span><strong>{rows.filter((row) => plateNotch(row.note)).length}</strong></li>
        <li><span>{v4("ntpEcho")}</span><strong>{rows.filter((row) => plateEcho(row.note)).length}</strong></li>
        <li><span>{v4("ntpLeap")}</span><strong>{rows.filter((row) => plateLeap(row.note)).length}</strong></li>
        <li><span>{v4("ntpWeekend")}</span><strong>{rows.filter((row) => plateSpoken(row.note)).length}</strong></li>
        <li><span>{v4("ntpIvory")}</span><strong>{huePlateCount(rows, "ivory")}</strong></li>
      </ul>
      <div className="c4-ntp-chart" aria-label={v4("ntpRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-ntp-bar" data-on={lane === bar.lane ? "1" : "0"} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <span>{laneLabel(v4, bar.lane)}</span>
            <strong>{bar.count}</strong>
          </button>
        ))}
      </div>
      <div className="c4-ntp-tools">
        <input ref={searchRef} className="c4-field c4-ntp-search" aria-label={v4("ntpSearch")} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("ntpSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("ntpAll") : hueLabel(v4, item)}</button>
        ))}
        {(["all", "winter", "spring", "summer", "autumn", "wide", "notch", "leap", "weekend"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{item === "all" ? v4("ntpShapeAll") : item === "wide" ? v4("ntpShapeWide") : item === "notch" ? v4("ntpShapeNotch") : item === "leap" ? v4("ntpShapeLeap") : item === "weekend" ? v4("ntpShapeWeekend") : laneLabel(v4, item)}</button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("ntpAll") : item === "reviewed" ? v4("ntpReviewed") : v4("ntpUnreviewed")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("ntpShow")}</button>
      </div>
      <ul className="c4-ntp-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(togglePlate(hidden, item))}>{hidden.includes(item) ? v4("ntpShow") : v4("ntpHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-ntp-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkPlateReview(reviewed, picked, true))}>{v4("ntpBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkPlateReview(reviewed, picked, false))}>{v4("ntpBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-ntp-empty">{v4("ntpEmpty")}</p>}
      <ol className="c4-ntp-board">
        {shown.map((row, index) => {
          const state = plateState(row.note);
          if (state === "") return null;
          return (
            <li key={row.id} className="c4-ntp-card" data-on={index === focusAt ? "1" : "0"} data-state={state} data-lane={plateLane(row.note)} data-hue={plateHue(row.note)} data-reviewed={reviewed.includes(row.id) ? "1" : "0"}>
              <label className="c4-ntp-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label} onChange={() => setPicked((current) => current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id])} /></label>
              <div>
                <strong>{row.label || v4("ntpUnmarked")}</strong>
                <p className="c4-ntp-meta">{plateStamp(row.note) || v4("ntpUnmarked")} · {laneLabel(v4, plateLane(row.note))} · {hueLabel(v4, plateHue(row.note))} · {v4("ntpStep")} {plateStep(row.note)}</p>
                <p className="c4-ntp-meta">{plateWide(row.note) ? v4("ntpWide") : ""} {plateNotch(row.note) ? v4("ntpNotch") : ""} {plateEcho(row.note) ? v4("ntpEcho") : ""} {plateLeap(row.note) ? v4("ntpLeap") : ""} {plateSpoken(row.note) ? v4("ntpWeekend") : ""}</p>
                <div className="c4-ntp-tools">
                  <button type="button" className="c4-btn" disabled={viewer || state !== "set"} onClick={() => storeReviewed(togglePlateReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("ntpReviewed") : v4("ntpReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(plateCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("ntpCopied") : v4("ntpCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="c4-ntp-tools">
        <button type="button" className="c4-btn" onClick={() => download("natal-lanes.csv", plateLanesCsv(rows))}>{v4("ntpCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("natal-rows.csv", plateRowsCsv(rows, reviewed))}>{v4("ntpRowCsv")}</button>
      </div>
    </section>
  );
}
