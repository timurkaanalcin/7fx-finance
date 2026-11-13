"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  LARDER_STATIONS,
  LRD_DENSITY_KEY,
  LRD_KEY,
  LRD_VIEW_KEY,
  TTL_KEY,
  TTL_REVIEW_KEY,
  addLarder,
  addLarderTag,
  addLarderView,
  briskLarder,
  bulkLarderBrisk,
  bulkLarderPin,
  bulkLarderSeal,
  bulkLarderTag,
  bulkLarderWheat,
  bulkTitleReview,
  busiestLarderKeeper,
  clashStationCount,
  cyclePace,
  dropLarderView,
  editLarder,
  editLarderNote,
  fairLarderKeeper,
  houseGrain,
  idleLarder,
  idleLarders,
  laneTitleCount,
  larderBars,
  larderCopy,
  larderCounts,
  larderCsv,
  larderDensity,
  larderKeepers,
  larderTimeline,
  lateLarder,
  leadingTitle,
  leadingTitleHue,
  lengthenLarder,
  lengthenLarderFocused,
  lowerLarder,
  lowerLarderFocused,
  moveLarderFocus,
  neighborLarderCount,
  overdueLarder,
  paceFocused,
  pauseLarderFocused,
  peakStation,
  pinLarderFocused,
  presentTitleLanes,
  quietStation,
  raiseLarder,
  raiseLarderFocused,
  readHiddenTitles,
  readLarderViews,
  readLarders,
  readReviewedTitles,
  reminderLarders,
  restingLarder,
  setLarderGrain,
  setLarderPause,
  setLarderPin,
  setLarderSeal,
  setLarderStar,
  sharedTitleCount,
  shortenLarder,
  shortenLarderFocused,
  sortLarders,
  starLarderFocused,
  suggestGrain,
  suggestLarderWait,
  suggestStation,
  tagLarderFocused,
  titleCap,
  titleCopy,
  titleEcho,
  titleHue,
  titleKnown,
  titleLane,
  titleLanes,
  titleLanesCsv,
  titleLeap,
  titleNotch,
  titleRowsCsv,
  titleShare,
  titleSlash,
  titleStamp,
  titleStep,
  titleTail,
  titleTwin,
  titleWide,
  toggleTitle,
  toggleTitleReview,
  visibleLarders,
  visibleTitleLanes,
  visibleTitles,
  type LarderDensity,
  type LarderSlip,
  type LarderSort,
  type LarderTray,
  type LarderView,
  type TitleReview,
  type TitleRow,
  type TitleShape,
  type TitleValue,
} from "@/lib/crmv4/round262";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const GRAINS = ["oat", "rye", "wheat"] as const;
const PACES = ["slow", "even", "brisk"] as const;
const WAITS = ["12", "24", "36"] as const;
const RANKS = ["2", "4", "6", "8"] as const;

const STATION_KEY: Record<string, CrmV4CopyKey> = {
  bin: "lrdBin",
  crock: "lrdCrock",
  rack: "lrdRack",
  loft: "lrdLoft",
  peak: "lrdPeakStation",
  quiet: "lrdQuietStation",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "lrdAuditSave",
  edit: "lrdAuditEdit",
  note: "lrdAuditNote",
  pace: "lrdAuditPace",
  pin: "lrdAuditPin",
  unpin: "lrdAuditUnpin",
  pause: "lrdAuditPause",
  resume: "lrdAuditResume",
  seal: "lrdAuditSeal",
  open: "lrdAuditOpen",
  grain: "lrdAuditGrain",
  tag: "lrdAuditTag",
  rank: "lrdAuditRank",
  wait: "lrdAuditWait",
  short: "lrdAuditShort",
  flag: "lrdAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  chip: "ttlChip",
  pair: "ttlPair",
  post: "ttlPost",
  rail: "ttlRail",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "ttlIvory",
  graphite: "ttlGraphite",
  champagne: "ttlChampagne",
};

type TraderRow = {
  id?: string;
  name?: string | null;
  jobTitle?: string | null;
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
  return String(raw ?? "").replace(/[\r\n]+/g, " ").trim();
}

function stationLabel(v4: V4, station: string): string {
  const key = STATION_KEY[station];
  return key ? v4(key) : v4("lrdBlank");
}

function grainLabel(v4: V4, grain: string): string {
  if (grain === "OAT") return v4("lrdOat");
  if (grain === "RYE") return v4("lrdRye");
  if (grain === "WHEAT") return v4("lrdWheat");
  return v4("lrdBlankGrain");
}

function paceLabel(v4: V4, pace: string): string {
  if (pace === "slow") return v4("lrdSlow");
  if (pace === "even") return v4("lrdEven");
  if (pace === "brisk") return v4("lrdBrisk");
  return v4("lrdBlankPace");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("ttlUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("ttlUnmarked");
}

export function LarderSlips({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<LarderSlip[]>([]);
  const [views, setViews] = useState<LarderView[]>([]);
  const [density, setDensity] = useState<LarderDensity>("roomy");
  const [sort, setSort] = useState<LarderSort>("station");
  const [tray, setTray] = useState<LarderTray>("open");
  const [query, setQuery] = useState("");
  const [keeperFilter, setKeeperFilter] = useState("all");
  const [grainFilter, setGrainFilter] = useState("all");
  const [paceFilter, setPaceFilter] = useState("all");
  const [stationFilter, setStationFilter] = useState("all");
  const [waitFilter, setWaitFilter] = useState("all");
  const [rankFilter, setRankFilter] = useState("all");
  const [houseOnly, setHouseOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [desk, setDesk] = useState("rack");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [keeper, setKeeper] = useState("");
  const [station, setStation] = useState("");
  const [grain, setGrain] = useState("");
  const [pace, setPace] = useState("");
  const [waitMin, setWaitMin] = useState("");
  const [rank, setRank] = useState("2");
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
    setCards(readLarders(readJson(LRD_KEY, [])));
    setViews(readLarderViews(readJson(LRD_VIEW_KEY, [])));
    setDensity(larderDensity(readJson(LRD_DENSITY_KEY, "roomy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  const shown = sortLarders(visibleLarders(cards, tray, query, keeperFilter, grainFilter, paceFilter, stationFilter, waitFilter, rankFilter, houseOnly, peakOnly, quietOnly), sort);
  const focusAt = shown.length ? focus % shown.length : 0;
  const counts = larderCounts(cards, shown, desk);
  const timeline = larderTimeline(cards);
  const reminders = reminderLarders(cards);
  const idling = idleLarders(cards);
  const keepers = larderKeepers(cards);
  const bars = larderBars(cards);
  const ribbon = Math.max(1, bars.reduce((sum, bar) => sum + bar.count, 0));
  const ids = shown.map((card) => card.id);
  const busy = busiestLarderKeeper(cards);
  const clock = new Date().getUTCHours();
  const suggested = suggestGrain(cards);
  const fair = fairLarderKeeper(cards, keepers.join(", ") || "Ada, Bea");
  const stationHint = suggestStation(clock);
  function store(next: LarderSlip[]) {
    const saved = readLarders(next);
    setCards(saved);
    writeJson(LRD_KEY, saved);
  }
  function storeViews(next: LarderView[]) {
    const saved = readLarderViews(next);
    setViews(saved);
    writeJson(LRD_VIEW_KEY, saved);
  }
  function storeDensity(next: LarderDensity) {
    setDensity(next);
    writeJson(LRD_DENSITY_KEY, next);
  }
  function togglePick(id: string) {
    setPicked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }
  function applyView(view: LarderView) {
    setTray(view.tray);
    setQuery(view.query);
    setKeeperFilter(view.keeper || "all");
    setGrainFilter(view.grain);
    setPaceFilter(view.pace);
    setStationFilter(view.station);
    setWaitFilter(view.wait);
    setRankFilter(view.rank);
  }
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setKeeper("");
        setStation("");
        setGrain("");
        setPace("");
        setWaitMin("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveLarderFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveLarderFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        if (!viewer) store(pauseLarderFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        if (!viewer) store(pinLarderFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        if (!viewer) store(paceFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        if (!viewer) store(lengthenLarderFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        if (!viewer) store(shortenLarderFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        if (!viewer) store(tagLarderFocused(cards, ids, focusAt, "x"));
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        if (!viewer) store(starLarderFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        if (!viewer) store(raiseLarderFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "y" || event.key === "Y") {
        event.preventDefault();
        if (!viewer) store(lowerLarderFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "b" || event.key === "B") {
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
    <section className="c4-lrd" aria-label={v4("lrdTitle")} data-cards="1" data-desk="larder" data-role={role} data-density={density} data-board={board}>
      <header className="c4-lrd-mast">
        <div className="c4-lrd-mast-copy">
          <p className="c4-lrd-kicker">{v4("lrdSub")}</p>
          <h2 className="c4-title">{v4("lrdTitle")}</h2>
        </div>
        <i className="c4-lrd-rule" aria-hidden="true" />
        <p className="c4-lrd-seal" data-logo="mono">{v4("lrdLogo")}</p>
      </header>
      <p className="c4-lrd-links">
        <Link href={crmv4Href(base, "ttl")}>{v4("lrdPlates")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("lrdCustomers")}</Link>
        <Link href={crmv4Href(base, "support")}>{v4("lrdSupport")}</Link>
      </p>
      {viewer && <p className="c4-lrd-note">{v4("lrdViewer")}</p>}
      <p className="c4-lrd-lead">{v4("lrdKeys")}</p>
      <p className="c4-lrd-hint">{v4("lrdHint")}</p>
      <p className="c4-lrd-notice" role="status">{v4("lrdNotice")} {counts.overdue}</p>
      <ol className="c4-lrd-ledger" aria-label={v4("lrdChart")}>
        <li><span>{v4("lrdOpen")}</span><strong>{counts.open}</strong></li>
        <li><span>{v4("lrdPause")}</span><strong>{counts.pause}</strong></li>
        <li><span>{v4("lrdSealed")}</span><strong>{counts.seal}</strong></li>
        <li><span>{v4("lrdPinned")}</span><strong>{counts.pinned}</strong></li>
        <li><span>{v4("lrdPeak")}</span><strong>{counts.peak}</strong></li>
        <li><span>{v4("lrdQuiet")}</span><strong>{counts.quiet}</strong></li>
        <li><span>{v4("lrdSoon")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("lrdOverdue")}</span><strong>{counts.overdue}</strong></li>
      </ol>
      <ol className="c4-lrd-bars" aria-label={v4("lrdBars")}>
        {bars.map((bar) => (
          <li key={bar.station} data-station={bar.station}>
            <span>{stationLabel(v4, bar.station)}</span>
            <i style={{ width: `${Math.round((bar.count / ribbon) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </li>
        ))}
      </ol>
      <ol className="c4-lrd-time" aria-label={v4("lrdTimeline")}>
        {timeline.map((lane) => (
          <li key={lane.rank}><span>{lane.rank}</span><strong>{lane.titles.join(" · ")}</strong></li>
        ))}
      </ol>
      <div className="c4-lrd-tools">
        <label className="c4-lab">
          <span>{v4("lrdDesk")}</span>
          <select className="c4-select" aria-label={v4("lrdDesk")} value={desk} onChange={(event) => setDesk(event.target.value)}>
            {LARDER_STATIONS.map((item) => <option key={item} value={item}>{stationLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("lrdSearch")}</span>
          <input ref={searchRef} className="c4-field c4-lrd-search" aria-label={v4("lrdSearch")} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("lrdSearch")} />
        </label>
        {(["open", "pause", "seal"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("lrdOpen") : item === "pause" ? v4("lrdPause") : v4("lrdSealed")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("lrdHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((value) => !value)}>{v4("lrdPeak")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((value) => !value)}>{v4("lrdQuiet")}</button>
        <button type="button" className="c4-chip" data-on={sort === "keeper" ? "1" : "0"} onClick={() => setSort((value) => value === "station" ? "keeper" : "station")}>{sort === "keeper" ? v4("lrdSortKeeper") : v4("lrdSortStation")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "roomy" ? "close" : "roomy")}>{density === "roomy" ? v4("lrdRoomy") : v4("lrdClose")}</button>
        <button type="button" className="c4-chip" onClick={() => setBoard((value) => value === "hall" ? "index" : "hall")}>{board === "hall" ? v4("lrdHall") : v4("lrdIndex")}</button>
      </div>
      <div className="c4-lrd-tools">
        <select className="c4-select" aria-label={v4("lrdKeeper")} value={keeperFilter} onChange={(event) => setKeeperFilter(event.target.value)}>
          <option value="all">{v4("lrdAll")}</option>
          {keepers.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("lrdGrain")} value={grainFilter} onChange={(event) => setGrainFilter(event.target.value)}>
          <option value="all">{v4("lrdAll")}</option>
          {GRAINS.map((item) => <option key={item} value={item}>{grainLabel(v4, item.toUpperCase())}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("lrdPace")} value={paceFilter} onChange={(event) => setPaceFilter(event.target.value)}>
          <option value="all">{v4("lrdAll")}</option>
          {PACES.map((item) => <option key={item} value={item}>{paceLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("lrdStation")} value={stationFilter} onChange={(event) => setStationFilter(event.target.value)}>
          <option value="all">{v4("lrdAll")}</option>
          <option value="peak">{v4("lrdPeakStation")}</option>
          <option value="quiet">{v4("lrdQuietStation")}</option>
          {LARDER_STATIONS.map((item) => <option key={item} value={item}>{stationLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("lrdWait")} value={waitFilter} onChange={(event) => setWaitFilter(event.target.value)}>
          <option value="all">{v4("lrdAll")}</option>
          {WAITS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("lrdRank")} value={rankFilter} onChange={(event) => setRankFilter(event.target.value)}>
          <option value="all">{v4("lrdAll")}</option>
          {RANKS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      <form className="c4-lrd-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addLarder(cards, { id: `lrd-${Date.now()}`, title, note, keeper, station, grain, pace, wait: waitMin, rank, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <label className="c4-lab"><span>{v4("lrdTitleField")}</span><input className="c4-field" aria-label={v4("lrdTitleField")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("lrdNote")}</span><input className="c4-field" aria-label={v4("lrdNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <p className="c4-lrd-meta">{v4("lrdNoteOptional")}</p>
        <label className="c4-lab"><span>{v4("lrdKeeper")}</span><input className="c4-field" aria-label={v4("lrdKeeper")} value={keeper} disabled={viewer} onChange={(event) => setKeeper(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("lrdStation")}</span>
          <select className="c4-select" aria-label={v4("lrdStation")} value={station} disabled={viewer} onChange={(event) => setStation(event.target.value)}>
            <option value="">{v4("lrdBlank")}</option>
            {LARDER_STATIONS.map((item) => <option key={item} value={item}>{stationLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("lrdGrain")}</span>
          <select className="c4-select" aria-label={v4("lrdGrain")} value={grain} disabled={viewer} onChange={(event) => setGrain(event.target.value)}>
            <option value="">{v4("lrdBlankGrain")}</option>
            {GRAINS.map((item) => <option key={item} value={item}>{grainLabel(v4, item.toUpperCase())}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("lrdPace")}</span>
          <select className="c4-select" aria-label={v4("lrdPace")} value={pace} disabled={viewer} onChange={(event) => setPace(event.target.value)}>
            <option value="">{v4("lrdBlankPace")}</option>
            {PACES.map((item) => <option key={item} value={item}>{paceLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("lrdWait")}</span>
          <select className="c4-select" aria-label={v4("lrdWait")} value={waitMin} disabled={viewer} onChange={(event) => setWaitMin(event.target.value)}>
            <option value="">{v4("lrdBlankWait")}</option>
            {WAITS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("lrdRank")}</span>
          <select className="c4-select" aria-label={v4("lrdRank")} value={rank} disabled={viewer} onChange={(event) => setRank(event.target.value)}>
            {RANKS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("lrdTags")}</span><input className="c4-field" aria-label={v4("lrdTags")} value={tags} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("lrdAdd")}</button>
      </form>
      <form className="c4-lrd-tools" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addLarderView(views, { id: `view-${Date.now()}`, name: viewName, tray, query, keeper: keeperFilter, grain: grainFilter, pace: paceFilter, station: stationFilter, wait: waitFilter, rank: rankFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("lrdViewName")}</span><input className="c4-field" aria-label={v4("lrdViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("lrdSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-lrd-view">
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("lrdApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropLarderView(views, view.id))}>{v4("lrdDropView")}</button>
          </span>
        ))}
      </form>
      {picked.length > 0 && (
        <div className="c4-lrd-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkLarderPin(cards, picked))}>{v4("lrdBulkPin")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkLarderSeal(cards, picked))}>{v4("lrdBulkSeal")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkLarderBrisk(cards, picked))}>{v4("lrdBulkBrisk")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkLarderWheat(cards, picked))}>{v4("lrdBulkWheat")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkLarderTag(cards, picked, "y"))}>{v4("lrdBulkTag")}</button>
        </div>
      )}
      <p className="c4-lrd-meta">{v4("lrdSuggest")} {grainLabel(v4, suggested)} · {v4("lrdFair")} {fair} · {v4("lrdBusy")} {busy || v4("lrdBlankKeeper")} · {v4("lrdNeighbors")} {neighborLarderCount(cards)} · {v4("lrdClash")} {clashStationCount(cards)} · {v4("lrdWaitHint")} {suggestLarderWait(cards, clock)} · {v4("lrdStationHint")} {stationLabel(v4, stationHint)}</p>
      {(reminders.length > 0 || idling.length > 0) && (
        <p className="c4-lrd-meta">{v4("lrdDue")} {reminders.map((card) => card.title).join(" · ")} · {v4("lrdIdle")} {idling.map((card) => card.title).join(" · ")}</p>
      )}
      {!shown.length && <p className="c4-lrd-empty">{v4("lrdEmpty")}</p>}
      <ol className="c4-lrd-board" data-density={density}>
        {shown.map((card, index) => {
          const dial = Math.round(((card.wait ?? 0) / 36) * 100);
          return (
            <li key={card.id} className="c4-lrd-jar" data-on={index === focusAt ? "1" : "0"} data-pinned={card.pinned ? "1" : "0"} data-overdue={overdueLarder(card) ? "1" : "0"} data-peak={peakStation(card.station) ? "1" : "0"} data-quiet={quietStation(card.station) ? "1" : "0"} data-house={houseGrain(card.grain) ? "1" : "0"} data-brisk={briskLarder(card) ? "1" : "0"} data-idle={idleLarder(card) ? "1" : "0"} data-resting={restingLarder(card) ? "1" : "0"} data-late={lateLarder(card, desk) ? "1" : "0"}>
              <div className="c4-lrd-monogram" aria-hidden="true">{(card.title[0] || "·").toUpperCase()}</div>
              <label className="c4-lrd-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => togglePick(card.id)} /></label>
              <div>
                <input className="c4-field" aria-label={v4("lrdEdit")} value={card.title} disabled={viewer} onChange={(event) => store(editLarder(cards, card.id, event.target.value))} />
                <input className="c4-field" aria-label={v4("lrdEditNote")} aria-required={false} value={card.note} disabled={viewer} onChange={(event) => store(editLarderNote(cards, card.id, event.target.value))} />
                <p className="c4-lrd-meta">{card.keeper || v4("lrdBlankKeeper")} · {stationLabel(v4, card.station)} · {grainLabel(v4, card.grain)} · {paceLabel(v4, card.pace)} · {card.wait ?? v4("lrdBlankWait")} · {v4("lrdRank")} {card.rank} · {card.tags.join(" ") || v4("lrdTags")}</p>
                <p className="c4-lrd-dial" aria-label={v4("lrdWait")} style={{ background: `conic-gradient(#c6a15b ${dial}%, #efe6d6 ${dial}% 100%)` }} />
                <p className="c4-lrd-meta">{stationLabel(v4, desk)} · {AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : v4("lrdAuditSave")}</p>
                <div className="c4-lrd-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLarderPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("lrdUnpin") : v4("lrdPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer || card.sealed} onClick={() => store(setLarderPause(cards, card.id, !card.paused))}>{card.paused ? v4("lrdResume") : v4("lrdPause")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLarderSeal(cards, card.id, !card.sealed))}>{card.sealed ? v4("lrdOpenAgain") : v4("lrdSealed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLarderStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("lrdUnstar") : v4("lrdStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cyclePace(cards, card.id))}>{v4("lrdTempo")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lengthenLarder(cards, card.id))}>{v4("lrdLengthen")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(shortenLarder(cards, card.id))}>{v4("lrdShorten")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseLarder(cards, card.id))}>{v4("lrdRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerLarder(cards, card.id))}>{v4("lrdLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLarderGrain(cards, card.id, card.grain === "WHEAT" ? "oat" : "wheat"))}>{v4("lrdGrain")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addLarderTag(cards, card.id, "z"))}>{v4("lrdTags")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(larderCopy(card)); setCopied(card.id); }}>{copied === card.id ? v4("lrdCopied") : v4("lrdCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <button type="button" className="c4-btn" onClick={() => download("larder-slips.csv", larderCsv(shown, desk))}>{v4("lrdCsv")}</button>
    </section>
  );
}

export function TitlePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: TraderRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [shape, setShape] = useState<TitleShape>("all");
  const [review, setReview] = useState<TitleReview>("all");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<TitleRow[]>(() => (queue.data?.users || []).map((row, index) => ({
    id: row.id ? `trader-${row.id}` : `trader-${index}`,
    label: textField(row.name),
    note: { jobTitle: textField(row.jobTitle) } satisfies TitleValue,
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
    const present = presentTitleLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenTitles(readJson(TTL_KEY, []), present);
    const nextReviewed = readReviewedTitles(readJson(TTL_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(TTL_KEY, nextHidden);
    writeJson(TTL_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentTitleLanes(rows);
  const lanes = visibleTitleLanes(present, hidden, showHidden);
  const shown = visibleTitles(rows, lane, hue, query, review, reviewed, shape).filter((row) => {
    const token = titleLane(row.note);
    if (!token) return true;
    return showHidden || !hidden.includes(token);
  });
  const focusAt = shown.length ? focus % shown.length : 0;
  const bars = titleLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingTitle(rows);
  const leadHue = leadingTitleHue(rows);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveLarderFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveLarderFocus(index, shown.length, -1));
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
    writeJson(TTL_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(TTL_REVIEW_KEY, next);
  }
  return (
    <section className="c4-ttl" aria-label={v4("ttlTitle")} data-plates="1" data-traders={rows.length} data-role={role}>
      <header className="c4-ttl-mast">
        <p className="c4-ttl-seal" data-logo="mono">{v4("ttlLogo")}</p>
        <div>
          <p className="c4-ttl-kicker">{v4("ttlSub")}</p>
          <h2 className="c4-title">{v4("ttlTitle")}</h2>
        </div>
      </header>
      <ol className="c4-ttl-index" aria-label={v4("ttlTitle")}>
        <li data-tone="gold">{v4("ttlChampagne")}</li>
        <li data-tone="ink">{v4("ttlGraphite")}</li>
        <li data-tone="ivory">{v4("ttlIvory")}</li>
      </ol>
      <p className="c4-ttl-links">
        <Link href={crmv4Href(base, "lrd")}>{v4("ttlCards")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("lrdCustomers")}</Link>
        <Link href={crmv4Href(base, "support")}>{v4("lrdSupport")}</Link>
      </p>
      <p className="c4-ttl-hint">{v4("ttlHint")}</p>
      {viewer && <p className="c4-ttl-note">{v4("ttlViewer")}</p>}
      {queue.loading && <p className="c4-ttl-meta">{v4("ttlEmpty")}</p>}
      {queue.error && <p className="c4-ttl-meta">{queue.error}</p>}
      <ul className="c4-ttl-kpis" aria-label={v4("ttlRules")}>
        <li><span>{v4("ttlLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("ttlUnmarked")}</strong></li>
        <li><span>{v4("ttlToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("ttlUnmarked")}</strong></li>
        <li><span>{v4("ttlShared")}</span><strong>{sharedTitleCount(rows)}</strong></li>
        <li><span>{v4("ttlShare")}</span><strong>{titleShare(laneTitleCount(rows, "chip"), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("ttlKnown")}</span><strong>{rows.filter((row) => titleKnown(row.note)).length}</strong></li>
        <li><span>{v4("ttlTwin")}</span><strong>{rows.filter((row) => titleTwin(row.note)).length}</strong></li>
        <li><span>{v4("ttlSlash")}</span><strong>{rows.filter((row) => titleSlash(row.note)).length}</strong></li>
        <li><span>{v4("ttlEcho")}</span><strong>{rows.filter((row) => titleEcho(row.note)).length}</strong></li>
      </ul>
      <div className="c4-ttl-chart" aria-label={v4("ttlRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-ttl-bar" data-on={lane === bar.lane ? "1" : "0"} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
            <span>{laneLabel(v4, bar.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-ttl-tools">
        <input ref={searchRef} className="c4-field c4-ttl-search" aria-label={v4("ttlSearch")} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("ttlSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("ttlAll") : hueLabel(v4, item)}</button>
        ))}
        {(["all", "chip", "pair", "post", "rail", "wide", "notch", "leap", "slash", "twin", "known", "echo"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>
            {item === "all" ? v4("ttlShapeAll") : item === "wide" ? v4("ttlShapeWide") : item === "notch" ? v4("ttlShapeNotch") : item === "leap" ? v4("ttlShapeLeap") : item === "slash" ? v4("ttlShapeSlash") : item === "twin" ? v4("ttlShapeTwin") : item === "known" ? v4("ttlShapeKnown") : item === "echo" ? v4("ttlShapeEcho") : laneLabel(v4, item)}
          </button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("ttlAll") : item === "reviewed" ? v4("ttlReviewed") : v4("ttlUnreviewed")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("ttlShow")}</button>
      </div>
      <ul className="c4-ttl-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleTitle(hidden, item))}>{hidden.includes(item) ? v4("ttlShow") : v4("ttlHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-ttl-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkTitleReview(reviewed, picked, true))}>{v4("ttlBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkTitleReview(reviewed, picked, false))}>{v4("ttlBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-ttl-empty">{v4("ttlEmpty")}</p>}
      <ol className="c4-ttl-board">
        {shown.map((row, index) => {
          const seen = reviewed.includes(row.id);
          return (
            <li key={row.id} className="c4-ttl-card" data-on={index === focusAt ? "1" : "0"} data-lane={titleLane(row.note)} data-hue={titleHue(row.note)} data-reviewed={seen ? "1" : "0"} data-known={titleKnown(row.note) ? "1" : "0"}>
              <p className="c4-ttl-stamp">{titleStamp(row.note) || "·"}</p>
              <label className="c4-ttl-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label || row.id} onChange={() => setPicked((current) => current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id])} /></label>
              <div>
                <strong>{row.label || v4("ttlUnmarked")}</strong>
                <p className="c4-ttl-meta">{laneLabel(v4, titleLane(row.note))} · {hueLabel(v4, titleHue(row.note))} · {v4("ttlStep")} {titleStep(row.note)}{titleCap(row.note) ? ` · ${v4("ttlCap")}` : ""}{titleTail(row.note) ? ` · ${v4("ttlTail")}` : ""}{titleWide(row.note) ? ` · ${v4("ttlWide")}` : ""}{titleNotch(row.note) ? ` · ${v4("ttlNotch")}` : ""}{titleLeap(row.note) ? ` · ${v4("ttlLeap")}` : ""}</p>
                <div className="c4-ttl-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleTitleReview(reviewed, row.id))}>{seen ? v4("ttlReviewed") : v4("ttlReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(titleCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("ttlCopied") : v4("ttlCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="c4-ttl-tools">
        <button type="button" className="c4-btn" onClick={() => download("title-lanes.csv", titleLanesCsv(rows))}>{v4("ttlCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("title-rows.csv", titleRowsCsv(shown, reviewed))}>{v4("ttlRowCsv")}</button>
      </div>
    </section>
  );
}
