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
  bulkSlipGlass,
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
} from "@/lib/crmv4/round257";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FIBERS = ["clay", "stone", "glass"] as const;
const CADENCES = ["still", "drift", "surge"] as const;
const WINDOWS = ["3", "9", "21"] as const;
const WARMTHS = ["1", "3", "5", "7"] as const;

const SEASON_KEY: Record<string, CrmV4CopyKey> = {
  ebb: "cstEbb",
  neap: "cstNeap",
  flood: "cstFlood",
  spring: "cstSpring",
  peak: "cstPeakSeason",
  quiet: "cstQuietSeason",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "cstAuditSave",
  edit: "cstAuditEdit",
  note: "cstAuditNote",
  cadence: "cstAuditCadence",
  pin: "cstAuditPin",
  unpin: "cstAuditUnpin",
  hold: "cstAuditWait",
  resume: "cstAuditResume",
  shelve: "cstAuditFile",
  open: "cstAuditOpen",
  fiber: "cstAuditFiber",
  tag: "cstAuditTag",
  warmth: "cstAuditWarmth",
  window: "cstAuditWindow",
  short: "cstAuditShort",
  flag: "cstAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  night: "jnpNight",
  morning: "jnpMorning",
  afternoon: "jnpAfternoon",
  evening: "jnpEvening",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "jnpIvory",
  graphite: "jnpGraphite",
  champagne: "jnpChampagne",
};

type TraderRow = {
  id?: string;
  name?: string | null;
  createdAt?: string | null;
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
  return key ? v4(key) : v4("cstBlank");
}

function fiberLabel(v4: V4, fiber: string): string {
  if (fiber === "CLAY" || fiber === "clay") return v4("cstClay");
  if (fiber === "STONE" || fiber === "stone") return v4("cstStone");
  if (fiber === "GLASS" || fiber === "glass") return v4("cstGlass");
  return v4("cstBlankFiber");
}

function cadenceLabel(v4: V4, cadence: string): string {
  if (cadence === "still") return v4("cstStill");
  if (cadence === "drift") return v4("cstDrift");
  if (cadence === "surge") return v4("cstSurge");
  return v4("cstBlankCadence");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("jnpUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("jnpUnmarked");
}

export function CisternSlips({ base, v4 }: { base: string; v4: V4 }) {
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
  const [desk, setDesk] = useState("neap");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [keeper, setKeeper] = useState("");
  const [season, setSeason] = useState("");
  const [fiber, setFiber] = useState("");
  const [cadence, setCadence] = useState("");
  const [windowDays, setWindowDays] = useState("");
  const [warmth, setWarmth] = useState("1");
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
        if (!viewer) store(tagFocusedSlip(cards, ids, focusAt, "m"));
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
    <section className="c4-cst" aria-label={v4("cstTitle")} data-cards="1" data-desk="cistern" data-role={role} data-density={density} data-board={board}>
      <header className="c4-cst-mast">
        <p className="c4-cst-seal" data-logo="mono">{v4("cstLogo")}</p>
        <div>
          <p className="c4-cst-kicker">{v4("cstSub")}</p>
          <h2 className="c4-title">{v4("cstTitle")}</h2>
        </div>
        <ol className="c4-cst-index" aria-label={v4("cstTitle")}>
          <li data-tone="gold">{v4("cstChampagne")}</li>
          <li data-tone="ink">{v4("cstGraphite")}</li>
          <li data-tone="ivory">{v4("cstIvory")}</li>
        </ol>
      </header>
      <p className="c4-cst-links">
        <Link href={crmv4Href(base, "jnp")}>{v4("cstPlates")}</Link>
        <Link href={crmv4Href(base, "winlog")}>{v4("cstWin")}</Link>
        <Link href={crmv4Href(base, "scale")}>{v4("cstScale")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("cstCustomers")}</Link>
      </p>
      {viewer && <p className="c4-cst-note">{v4("cstViewer")}</p>}
      <p className="c4-cst-lead">{v4("cstKeys")}</p>
      <p className="c4-cst-hint">{v4("cstHint")}</p>
      <ul className="c4-cst-kpis" aria-label={v4("cstChart")}>
        <li><span>{v4("cstOpen")}</span><strong>{counts.open}</strong></li>
        <li><span>{v4("cstHeld")}</span><strong>{counts.held}</strong></li>
        <li><span>{v4("cstFile")}</span><strong>{counts.shelved}</strong></li>
        <li><span>{v4("cstPinned")}</span><strong>{counts.pinned}</strong></li>
        <li><span>{v4("cstOverdue")}</span><strong>{counts.overdue}</strong></li>
        <li><span>{v4("cstPeak")}</span><strong>{counts.peak}</strong></li>
        <li><span>{v4("cstQuiet")}</span><strong>{counts.quiet}</strong></li>
        <li><span>{v4("cstHouse")}</span><strong>{slipShare(counts.house, Math.max(1, counts.open))}%</strong></li>
        <li><span>{v4("cstIdle")}</span><strong>{counts.idle}</strong></li>
        <li><span>{v4("cstRush")}</span><strong>{counts.rush}</strong></li>
        <li><span>{v4("cstResting")}</span><strong>{counts.resting}</strong></li>
        <li><span>{v4("cstSoon")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("cstMatched")}</span><strong>{counts.matched}</strong></li>
      </ul>
      <div className="c4-cst-chart" aria-label={v4("cstBars")}>
        {bars.map((bar) => (
          <div key={bar.season} className="c4-cst-bar" data-season={bar.season}>
            <i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <span>{seasonLabel(v4, bar.season)}</span>
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <ol className="c4-cst-time" aria-label={v4("cstTimeline")}>
        {timeline.map((lane) => (
          <li key={lane.warmth}><span>{v4("cstWarmth")} {lane.warmth}</span><em>{lane.titles.join(" · ")}</em></li>
        ))}
      </ol>
      <div className="c4-cst-tools">
        <label className="c4-lab">
          <span>{v4("cstDesk")}</span>
          <select className="c4-select" aria-label={v4("cstDesk")} value={desk} onChange={(event) => setDesk(event.target.value)}>
            {RELIC_SEASONS.map((item) => <option key={item} value={item}>{seasonLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("cstSearch")}</span>
          <input ref={searchRef} className="c4-field c4-cst-search" aria-label={v4("cstSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        {(["open", "held", "shelved"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("cstOpen") : item === "held" ? v4("cstHeld") : v4("cstFile")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("cstHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((value) => !value)}>{v4("cstPeak")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((value) => !value)}>{v4("cstQuiet")}</button>
        <button type="button" className="c4-chip" data-on={sort === "keeper" ? "1" : "0"} onClick={() => setSort((value) => value === "season" ? "keeper" : "season")}>{sort === "keeper" ? v4("cstSortKeeper") : v4("cstSortSeason")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "airy" ? "tight" : "airy")}>{density === "airy" ? v4("cstAiry") : v4("cstTight")}</button>
        <button type="button" className="c4-chip" onClick={() => setBoard((value) => value === "hall" ? "index" : "hall")}>{board === "hall" ? v4("cstHall") : v4("cstIndex")}</button>
      </div>
      <div className="c4-cst-tools">
        <select className="c4-select" aria-label={v4("cstKeeper")} value={keeperFilter} onChange={(event) => setKeeperFilter(event.target.value)}>
          <option value="all">{v4("cstAll")}</option>
          {keepers.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("cstFiber")} value={fiberFilter} onChange={(event) => setFiberFilter(event.target.value)}>
          <option value="all">{v4("cstAll")}</option>
          {FIBERS.map((item) => <option key={item} value={item}>{fiberLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("cstCadence")} value={cadenceFilter} onChange={(event) => setCadenceFilter(event.target.value)}>
          <option value="all">{v4("cstAll")}</option>
          {CADENCES.map((item) => <option key={item} value={item}>{cadenceLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("cstDesk")} value={seasonFilter} onChange={(event) => setSeasonFilter(event.target.value)}>
          <option value="all">{v4("cstAll")}</option>
          <option value="peak">{v4("cstPeakSeason")}</option>
          <option value="quiet">{v4("cstQuietSeason")}</option>
          {RELIC_SEASONS.map((item) => <option key={item} value={item}>{seasonLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("cstWindow")} value={windowFilter} onChange={(event) => setWindowFilter(event.target.value)}>
          <option value="all">{v4("cstAll")}</option>
          {WINDOWS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("cstWarmth")} value={warmthFilter} onChange={(event) => setWarmthFilter(event.target.value)}>
          <option value="all">{v4("cstAll")}</option>
          {WARMTHS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      <form className="c4-cst-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addSlip(cards, { id: `slip-${Date.now()}`, title, note, keeper: keeper || fair, season, window: windowDays || String(suggestWindow(cards, hour)), fiber: fiber || suggested.toLowerCase(), cadence, warmth, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <label className="c4-lab"><span>{v4("cstTitleField")}</span><input className="c4-field" aria-label={v4("cstTitleField")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("cstNote")}</span><input className="c4-field" aria-label={v4("cstNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <p className="c4-cst-meta">{v4("cstNoteOptional")}</p>
        <label className="c4-lab"><span>{v4("cstKeeper")}</span><input className="c4-field" aria-label={v4("cstKeeper")} value={keeper} disabled={viewer} onChange={(event) => setKeeper(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("cstDesk")}</span>
          <select className="c4-select" aria-label={v4("cstEbb")} value={season} disabled={viewer} onChange={(event) => setSeason(event.target.value)}>
            <option value="">{v4("cstBlank")}</option>
            {RELIC_SEASONS.map((item) => <option key={item} value={item}>{seasonLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("cstFiber")}</span>
          <select className="c4-select" aria-label={v4("cstFiber")} value={fiber} disabled={viewer} onChange={(event) => setFiber(event.target.value)}>
            <option value="">{fiberLabel(v4, suggested)}</option>
            {FIBERS.map((item) => <option key={item} value={item}>{fiberLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("cstCadence")}</span>
          <select className="c4-select" aria-label={v4("cstCadence")} value={cadence} disabled={viewer} onChange={(event) => setCadence(event.target.value)}>
            <option value="">{v4("cstBlankCadence")}</option>
            {CADENCES.map((item) => <option key={item} value={item}>{cadenceLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("cstWindow")}</span>
          <select className="c4-select" aria-label={v4("cstWindow")} value={windowDays} disabled={viewer} onChange={(event) => setWindowDays(event.target.value)}>
            <option value="">{suggestWindow(cards, hour)}</option>
            {WINDOWS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("cstWarmth")}</span>
          <select className="c4-select" aria-label={v4("cstWarmth")} value={warmth} disabled={viewer} onChange={(event) => setWarmth(event.target.value)}>
            {WARMTHS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("cstTags")}</span><input className="c4-field" aria-label={v4("cstTags")} value={tags} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("cstAdd")}</button>
      </form>
      <form className="c4-cst-tools" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        storeViews(addSlipView(views, { id: `view-${Date.now()}`, name: viewName, tray, query, keeper: keeperFilter, fiber: fiberFilter, cadence: cadenceFilter, season: seasonFilter, window: windowFilter, warmth: warmthFilter }));
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("cstViewName")}</span><input className="c4-field" aria-label={v4("cstViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("cstSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-cst-view">
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("cstApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropSlipView(views, view.id))}>{v4("cstDropView")}</button>
          </span>
        ))}
      </form>
      {picked.length > 0 && (
        <div className="c4-cst-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSlipPin(cards, picked))}>{v4("cstBulkPin")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSlipFile(cards, picked))}>{v4("cstBulkFile")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSlipRush(cards, picked))}>{v4("cstBulkRush")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSlipGlass(cards, picked))}>{v4("cstBulkGlass")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSlipTag(cards, picked, "n"))}>{v4("cstBulkTag")}</button>
        </div>
      )}
      <p className="c4-cst-meta">{v4("cstSuggest")} {fiberLabel(v4, suggested)} · {v4("cstFair")} {fair} · {v4("cstBusy")} {busy || v4("cstBlankKeeper")} · {v4("cstNeighbors")} {neighborSlipCount(cards)} · {v4("cstClash")} {clashSeasonCount(cards)}</p>
      {(reminders.length > 0 || idling.length > 0) && (
        <p className="c4-cst-meta">{v4("cstDue")} {reminders.map((card) => card.title).join(" · ")} · {v4("cstIdle")} {idling.map((card) => card.title).join(" · ")}</p>
      )}
      {!shown.length && <p className="c4-cst-empty">{v4("cstEmpty")}</p>}
      <ol className="c4-cst-board" data-density={density}>
        {shown.map((card, index) => (
          <li key={card.id} className="c4-cst-card" data-on={index === focusAt ? "1" : "0"} data-pinned={card.pinned ? "1" : "0"} data-overdue={overdueSlip(card) ? "1" : "0"} data-peak={peakSeason(card.season) ? "1" : "0"} data-quiet={quietSeason(card.season) ? "1" : "0"} data-house={houseFiber(card.fiber) ? "1" : "0"} data-rush={rushSlip(card) ? "1" : "0"} data-idle={idleSlip(card) ? "1" : "0"} data-resting={restingSlip(card) ? "1" : "0"} data-late={lateSlip(card, desk) ? "1" : "0"}>
            <label className="c4-cst-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => togglePick(card.id)} /></label>
            <div>
              <input className="c4-field" aria-label={v4("cstEdit")} value={card.title} disabled={viewer} onChange={(event) => store(editSlip(cards, card.id, event.target.value))} />
              <input className="c4-field" aria-label={v4("cstEditNote")} aria-required={false} value={card.note} disabled={viewer} onChange={(event) => store(editSlipNote(cards, card.id, event.target.value))} />
              <p className="c4-cst-meta">{card.keeper || v4("cstBlankKeeper")} · {seasonLabel(v4, card.season)} · {fiberLabel(v4, card.fiber)} · {cadenceLabel(v4, card.cadence)} · {card.window ?? v4("cstBlankWindow")} · {v4("cstRank")} {card.warmth} · {card.tags.join(" ") || v4("cstTags")}</p>
              <p className="c4-cst-sla" aria-label={v4("cstSpan")}><i style={{ width: `${Math.round(((card.window ?? 0) / 21) * 100)}%` }} /></p>
              <p className="c4-cst-meta">{seasonLabel(v4, desk)} · {AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : v4("cstAuditSave")}</p>
              <div className="c4-cst-tools">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("cstUnpin") : v4("cstPin")}</button>
                <button type="button" className="c4-btn" disabled={viewer || card.shelved} onClick={() => store(setSlipWait(cards, card.id, !card.held))}>{card.held ? v4("cstResume") : v4("cstWait")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipFile(cards, card.id, !card.shelved))}>{card.shelved ? v4("cstOpenAgain") : v4("cstFile")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("cstUnstar") : v4("cstStar")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleCadence(cards, card.id))}>{v4("cstTempo")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lengthenWindow(cards, card.id))}>{v4("cstLengthen")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(shortenWindow(cards, card.id))}>{v4("cstShorten")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseWarmth(cards, card.id))}>{v4("cstRaise")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerWarmth(cards, card.id))}>{v4("cstLower")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipFiber(cards, card.id, card.fiber === "GLASS" ? "clay" : "glass"))}>{v4("cstInk")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addSlipTag(cards, card.id, "o"))}>{v4("cstTags")}</button>
                <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(slipCopy(card)); setCopied(card.id); }}>{copied === card.id ? v4("cstCopied") : v4("cstCopy")}</button>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <button type="button" className="c4-btn" onClick={() => download("cistern-slips.csv", slipCsv(shown, desk))}>{v4("cstCsv")}</button>
    </section>
  );
}

export function JoinPlates({ base, v4 }: { base: string; v4: V4 }) {
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
    note: { createdAt: textField(row.createdAt) } satisfies PlateValue,
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
    <section className="c4-jnp" aria-label={v4("jnpTitle")} data-plates="1" data-traders={rows.length} data-role={role}>
      <header className="c4-jnp-mast">
        <p className="c4-jnp-seal" data-logo="mono">{v4("jnpLogo")}</p>
        <div>
          <p className="c4-jnp-kicker">{v4("jnpSub")}</p>
          <h2 className="c4-title">{v4("jnpTitle")}</h2>
        </div>
        <ol className="c4-jnp-index" aria-label={v4("jnpTitle")}>
          <li data-tone="gold">{v4("jnpChampagne")}</li>
          <li data-tone="ink">{v4("jnpGraphite")}</li>
          <li data-tone="ivory">{v4("jnpIvory")}</li>
        </ol>
      </header>
      <p className="c4-jnp-links">
        <Link href={crmv4Href(base, "cst")}>{v4("jnpCards")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("cstCustomers")}</Link>
      </p>
      <p className="c4-jnp-hint">{v4("jnpHint")}</p>
      {viewer && <p className="c4-jnp-note">{v4("jnpViewer")}</p>}
      {queue.loading && <p className="c4-jnp-meta">{v4("jnpEmpty")}</p>}
      {queue.error && <p className="c4-jnp-meta">{queue.error}</p>}
      <ul className="c4-jnp-kpis" aria-label={v4("jnpRules")}>
        <li><span>{v4("jnpLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("jnpUnmarked")}</strong></li>
        <li><span>{v4("jnpToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("jnpUnmarked")}</strong></li>
        <li><span>{v4("jnpShared")}</span><strong>{sharedPlateCount(rows)}</strong></li>
        <li><span>{v4("jnpShare")}</span><strong>{plateShare(lanePlateCount(rows, "night"), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("jnpWide")}</span><strong>{rows.filter((row) => plateWide(row.note)).length}</strong></li>
        <li><span>{v4("jnpNotch")}</span><strong>{rows.filter((row) => plateNotch(row.note)).length}</strong></li>
        <li><span>{v4("jnpEcho")}</span><strong>{rows.filter((row) => plateEcho(row.note)).length}</strong></li>
        <li><span>{v4("jnpLeap")}</span><strong>{rows.filter((row) => plateLeap(row.note)).length}</strong></li>
        <li><span>{v4("jnpWeekend")}</span><strong>{rows.filter((row) => plateSpoken(row.note)).length}</strong></li>
        <li><span>{v4("jnpIvory")}</span><strong>{huePlateCount(rows, "ivory")}</strong></li>
      </ul>
      <div className="c4-jnp-chart" aria-label={v4("jnpRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-jnp-bar" data-on={lane === bar.lane ? "1" : "0"} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <span>{laneLabel(v4, bar.lane)}</span>
            <strong>{bar.count}</strong>
          </button>
        ))}
      </div>
      <div className="c4-jnp-tools">
        <input ref={searchRef} className="c4-field c4-jnp-search" aria-label={v4("jnpSearch")} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("jnpSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("jnpAll") : hueLabel(v4, item)}</button>
        ))}
        {(["all", "night", "morning", "afternoon", "evening", "wide", "notch", "leap", "weekend"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{item === "all" ? v4("jnpShapeAll") : item === "wide" ? v4("jnpShapeWide") : item === "notch" ? v4("jnpShapeNotch") : item === "leap" ? v4("jnpShapeLeap") : item === "weekend" ? v4("jnpShapeWeekend") : laneLabel(v4, item)}</button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("jnpAll") : item === "reviewed" ? v4("jnpReviewed") : v4("jnpUnreviewed")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("jnpShow")}</button>
      </div>
      <ul className="c4-jnp-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(togglePlate(hidden, item))}>{hidden.includes(item) ? v4("jnpShow") : v4("jnpHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-jnp-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkPlateReview(reviewed, picked, true))}>{v4("jnpBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkPlateReview(reviewed, picked, false))}>{v4("jnpBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-jnp-empty">{v4("jnpEmpty")}</p>}
      <ol className="c4-jnp-board">
        {shown.map((row, index) => {
          const state = plateState(row.note);
          if (state === "") return null;
          return (
            <li key={row.id} className="c4-jnp-card" data-on={index === focusAt ? "1" : "0"} data-state={state} data-lane={plateLane(row.note)} data-hue={plateHue(row.note)} data-reviewed={reviewed.includes(row.id) ? "1" : "0"}>
              <label className="c4-jnp-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label} onChange={() => setPicked((current) => current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id])} /></label>
              <div>
                <strong>{row.label || v4("jnpUnmarked")}</strong>
                <p className="c4-jnp-meta">{plateStamp(row.note) || v4("jnpUnmarked")} · {laneLabel(v4, plateLane(row.note))} · {hueLabel(v4, plateHue(row.note))} · {v4("jnpStep")} {plateStep(row.note)}</p>
                <p className="c4-jnp-meta">{plateWide(row.note) ? v4("jnpWide") : ""} {plateNotch(row.note) ? v4("jnpNotch") : ""} {plateEcho(row.note) ? v4("jnpEcho") : ""} {plateLeap(row.note) ? v4("jnpLeap") : ""} {plateSpoken(row.note) ? v4("jnpWeekend") : ""}</p>
                <div className="c4-jnp-tools">
                  <button type="button" className="c4-btn" disabled={viewer || state !== "set"} onClick={() => storeReviewed(togglePlateReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("jnpReviewed") : v4("jnpReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(plateCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("jnpCopied") : v4("jnpCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="c4-jnp-tools">
        <button type="button" className="c4-btn" onClick={() => download("join-lanes.csv", plateLanesCsv(rows))}>{v4("jnpCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("join-rows.csv", plateRowsCsv(rows, reviewed))}>{v4("jnpRowCsv")}</button>
      </div>
    </section>
  );
}
