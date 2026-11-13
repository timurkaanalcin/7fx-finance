"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  DLP_KEY,
  DLP_REVIEW_KEY,
  GHS_DENSITY_KEY,
  GHS_KEY,
  GHS_VIEW_KEY,
  GREEN_PLACES,
  addSlip,
  addSlipTag,
  addSlipView,
  benchFocused,
  bulkDialReview,
  bulkSlipBay,
  bulkSlipGale,
  bulkSlipPin,
  bulkSlipStore,
  bulkSlipTag,
  busiestKeeper,
  clashPlaceCount,
  climateFocused,
  cycleClimate,
  dialCopy,
  dialEcho,
  dialHue,
  dialLane,
  dialLanes,
  dialLanesCsv,
  dialLeap,
  dialNotch,
  dialPlus,
  dialRowsCsv,
  dialShare,
  dialSpoken,
  dialStamp,
  dialStep,
  dialWide,
  dropSlipView,
  editSlip,
  editSlipNote,
  fairKeeper,
  galeSlip,
  greenhouseDensity,
  houseHerb,
  idleSlip,
  idleSlips,
  laneDialCount,
  lateSlip,
  leadingDial,
  leadingDialHue,
  lengthenFocused,
  lengthenSpan,
  lowerFocused,
  lowerRank,
  moveSlipFocus,
  neighborSlipCount,
  overdueSlip,
  peakPlot,
  pinFocused,
  presentDialLanes,
  quietPlot,
  raiseFocused,
  raiseRank,
  readHiddenDials,
  readReviewedDials,
  readSlipViews,
  readSlips,
  reminderSlips,
  restingSlip,
  setSlipBench,
  setSlipHerb,
  setSlipPin,
  setSlipStar,
  setSlipStore,
  sharedDialCount,
  shortenFocused,
  shortenSpan,
  slipBars,
  slipCopy,
  slipCounts,
  slipCsv,
  slipKeepers,
  slipTimeline,
  sortSlips,
  starFocused,
  suggestHerb,
  suggestSpan,
  tagFocused,
  toggleDial,
  toggleDialReview,
  visibleDialLanes,
  visibleDials,
  visibleSlips,
  type DialReview,
  type DialRow,
  type DialShape,
  type DialValue,
  type GreenhouseDensity,
  type GreenhouseSlip,
  type GreenhouseSort,
  type GreenhouseTray,
  type GreenhouseView,
} from "@/lib/crmv4/round260";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const HERBS = ["mint", "sage", "bay"] as const;
const CLIMATES = ["dew", "sun", "gale"] as const;
const SPANS = ["5", "15", "45"] as const;
const RANKS = ["2", "4", "6", "8"] as const;

const PLACE_KEY: Record<string, CrmV4CopyKey> = {
  bed: "ghsBed",
  path: "ghsPath",
  glass: "ghsGlass",
  pot: "ghsPot",
  peak: "ghsPeakPlace",
  quiet: "ghsQuietPlace",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "ghsAuditSave",
  edit: "ghsAuditEdit",
  note: "ghsAuditNote",
  climate: "ghsAuditClimate",
  pin: "ghsAuditPin",
  unpin: "ghsAuditUnpin",
  bench: "ghsAuditBench",
  resume: "ghsAuditResume",
  store: "ghsAuditFile",
  open: "ghsAuditOpen",
  herb: "ghsAuditHerb",
  tag: "ghsAuditTag",
  rank: "ghsAuditRank",
  span: "ghsAuditSpan",
  short: "ghsAuditShort",
  flag: "ghsAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  brief: "dlpBrief",
  desk: "dlpDesk",
  hall: "dlpHall",
  long: "dlpLong",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "dlpIvory",
  graphite: "dlpGraphite",
  champagne: "dlpChampagne",
};

type TraderRow = {
  id?: string;
  name?: string | null;
  phone?: string | null;
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

function placeLabel(v4: V4, place: string): string {
  const key = PLACE_KEY[place];
  return key ? v4(key) : v4("ghsBlank");
}

function herbLabel(v4: V4, herb: string): string {
  if (herb === "MINT") return v4("ghsMint");
  if (herb === "SAGE") return v4("ghsSage");
  if (herb === "BAY") return v4("ghsBay");
  return v4("ghsBlankHerb");
}

function climateLabel(v4: V4, climate: string): string {
  if (climate === "dew") return v4("ghsDew");
  if (climate === "sun") return v4("ghsSun");
  if (climate === "gale") return v4("ghsGale");
  return v4("ghsBlankClimate");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("dlpUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("dlpUnmarked");
}

export function GreenhouseSlips({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<GreenhouseSlip[]>([]);
  const [views, setViews] = useState<GreenhouseView[]>([]);
  const [density, setDensity] = useState<GreenhouseDensity>("airy");
  const [sort, setSort] = useState<GreenhouseSort>("place");
  const [tray, setTray] = useState<GreenhouseTray>("row");
  const [query, setQuery] = useState("");
  const [keeperFilter, setKeeperFilter] = useState("all");
  const [herbFilter, setHerbFilter] = useState("all");
  const [climateFilter, setClimateFilter] = useState("all");
  const [placeFilter, setPlaceFilter] = useState("all");
  const [spanFilter, setSpanFilter] = useState("all");
  const [rankFilter, setRankFilter] = useState("all");
  const [houseOnly, setHouseOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [desk, setDesk] = useState("path");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [keeper, setKeeper] = useState("");
  const [place, setPlace] = useState("");
  const [herb, setHerb] = useState("");
  const [climate, setClimate] = useState("");
  const [spanMin, setSpanMin] = useState("");
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
    setCards(readSlips(readJson(GHS_KEY, [])));
    setViews(readSlipViews(readJson(GHS_VIEW_KEY, [])));
    setDensity(greenhouseDensity(readJson(GHS_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  const shown = sortSlips(visibleSlips(cards, tray, query, keeperFilter, herbFilter, climateFilter, placeFilter, spanFilter, rankFilter, houseOnly, peakOnly, quietOnly), sort);
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
  const clock = new Date().getUTCHours();
  const suggested = suggestHerb(cards);
  const fair = fairKeeper(cards, keepers.join(", ") || "Ada, Bea");
  function store(next: GreenhouseSlip[]) {
    const saved = readSlips(next);
    setCards(saved);
    writeJson(GHS_KEY, saved);
  }
  function storeViews(next: GreenhouseView[]) {
    const saved = readSlipViews(next);
    setViews(saved);
    writeJson(GHS_VIEW_KEY, saved);
  }
  function storeDensity(next: GreenhouseDensity) {
    setDensity(next);
    writeJson(GHS_DENSITY_KEY, next);
  }
  function togglePick(id: string) {
    setPicked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }
  function applyView(view: GreenhouseView) {
    setTray(view.tray);
    setQuery(view.query);
    setKeeperFilter(view.keeper || "all");
    setHerbFilter(view.herb);
    setClimateFilter(view.climate);
    setPlaceFilter(view.place);
    setSpanFilter(view.span);
    setRankFilter(view.rank);
  }
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setKeeper("");
        setPlace("");
        setHerb("");
        setClimate("");
        setSpanMin("");
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
        if (!viewer) store(benchFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        if (!viewer) store(pinFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        if (!viewer) store(climateFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        if (!viewer) store(lengthenFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        if (!viewer) store(shortenFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        if (!viewer) store(tagFocused(cards, ids, focusAt, "p"));
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        if (!viewer) store(starFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        if (!viewer) store(raiseFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "y" || event.key === "Y") {
        event.preventDefault();
        if (!viewer) store(lowerFocused(cards, ids, focusAt));
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
    <section className="c4-ghs" aria-label={v4("ghsTitle")} data-cards="1" data-desk="greenhouse" data-role={role} data-density={density} data-board={board}>
      <header className="c4-ghs-mast">
        <p className="c4-ghs-seal" data-logo="mono">{v4("ghsLogo")}</p>
        <div>
          <p className="c4-ghs-kicker">{v4("ghsSub")}</p>
          <h2 className="c4-title">{v4("ghsTitle")}</h2>
        </div>
        <ol className="c4-ghs-index" aria-label={v4("ghsTitle")}>
          <li data-tone="gold">{v4("ghsChampagne")}</li>
          <li data-tone="ink">{v4("ghsGraphite")}</li>
          <li data-tone="ivory">{v4("ghsIvory")}</li>
        </ol>
      </header>
      <p className="c4-ghs-links">
        <Link href={crmv4Href(base, "dlp")}>{v4("ghsPlates")}</Link>
        <Link href={crmv4Href(base, "goals")}>{v4("ghsGoals")}</Link>
        <Link href={crmv4Href(base, "affiliates")}>{v4("ghsAffiliates")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("ghsCustomers")}</Link>
      </p>
      {viewer && <p className="c4-ghs-note">{v4("ghsViewer")}</p>}
      <p className="c4-ghs-lead">{v4("ghsKeys")}</p>
      <p className="c4-ghs-hint">{v4("ghsHint")}</p>
      <ul className="c4-ghs-kpis" aria-label={v4("ghsChart")}>
        <li><span>{v4("ghsOpen")}</span><strong>{counts.row}</strong></li>
        <li><span>{v4("ghsHeld")}</span><strong>{counts.bench}</strong></li>
        <li><span>{v4("ghsFile")}</span><strong>{counts.store}</strong></li>
        <li><span>{v4("ghsPinned")}</span><strong>{counts.pinned}</strong></li>
        <li><span>{v4("ghsPeak")}</span><strong>{counts.peak}</strong></li>
        <li><span>{v4("ghsQuiet")}</span><strong>{counts.quiet}</strong></li>
        <li><span>{v4("ghsSoon")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("ghsRank")}</span><strong>{counts.rank}</strong></li>
        <li><span>{v4("ghsHouse")}</span><strong>{counts.house}</strong></li>
        <li><span>{v4("ghsOverdue")}</span><strong>{counts.overdue}</strong></li>
      </ul>
      <div className="c4-ghs-chart" aria-label={v4("ghsBars")}>
        {bars.map((bar) => (
          <div key={bar.place} className="c4-ghs-bar" data-place={bar.place}>
            <i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <span>{placeLabel(v4, bar.place)}</span>
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <ol className="c4-ghs-time" aria-label={v4("ghsTimeline")}>
        {timeline.map((lane) => (
          <li key={lane.rank}><span>{lane.rank}</span><strong>{lane.titles.join(" · ")}</strong></li>
        ))}
      </ol>
      <div className="c4-ghs-tools">
        <label className="c4-lab">
          <span>{v4("ghsDesk")}</span>
          <select className="c4-select" aria-label={v4("ghsDesk")} value={desk} onChange={(event) => setDesk(event.target.value)}>
            {GREEN_PLACES.map((item) => <option key={item} value={item}>{placeLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("ghsSearch")}</span>
          <input ref={searchRef} className="c4-field c4-ghs-search" aria-label={v4("ghsSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        {(["row", "bench", "store"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "row" ? v4("ghsOpen") : item === "bench" ? v4("ghsHeld") : v4("ghsFile")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("ghsHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((value) => !value)}>{v4("ghsPeak")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((value) => !value)}>{v4("ghsQuiet")}</button>
        <button type="button" className="c4-chip" data-on={sort === "keeper" ? "1" : "0"} onClick={() => setSort((value) => value === "place" ? "keeper" : "place")}>{sort === "keeper" ? v4("ghsSortKeeper") : v4("ghsSortPlace")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "airy" ? "tight" : "airy")}>{density === "airy" ? v4("ghsAiry") : v4("ghsTight")}</button>
        <button type="button" className="c4-chip" onClick={() => setBoard((value) => value === "hall" ? "index" : "hall")}>{board === "hall" ? v4("ghsHall") : v4("ghsIndex")}</button>
      </div>
      <div className="c4-ghs-tools">
        <select className="c4-select" aria-label={v4("ghsKeeper")} value={keeperFilter} onChange={(event) => setKeeperFilter(event.target.value)}>
          <option value="all">{v4("ghsAll")}</option>
          {keepers.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("ghsHerb")} value={herbFilter} onChange={(event) => setHerbFilter(event.target.value)}>
          <option value="all">{v4("ghsAll")}</option>
          {HERBS.map((item) => <option key={item} value={item}>{herbLabel(v4, item.toUpperCase())}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("ghsClimate")} value={climateFilter} onChange={(event) => setClimateFilter(event.target.value)}>
          <option value="all">{v4("ghsAll")}</option>
          {CLIMATES.map((item) => <option key={item} value={item}>{climateLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("ghsDesk")} value={placeFilter} onChange={(event) => setPlaceFilter(event.target.value)}>
          <option value="all">{v4("ghsAll")}</option>
          <option value="peak">{v4("ghsPeakPlace")}</option>
          <option value="quiet">{v4("ghsQuietPlace")}</option>
          {GREEN_PLACES.map((item) => <option key={item} value={item}>{placeLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("ghsSpan")} value={spanFilter} onChange={(event) => setSpanFilter(event.target.value)}>
          <option value="all">{v4("ghsAll")}</option>
          {SPANS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("ghsRank")} value={rankFilter} onChange={(event) => setRankFilter(event.target.value)}>
          <option value="all">{v4("ghsAll")}</option>
          {RANKS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      <form className="c4-ghs-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addSlip(cards, { id: `ghs-${Date.now()}`, title, note, keeper, place, herb, climate, span: spanMin, rank, tags });
        if (next === cards || next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <label className="c4-lab"><span>{v4("ghsTitleField")}</span><input className="c4-field" aria-label={v4("ghsTitleField")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("ghsNote")}</span><input className="c4-field" aria-label={v4("ghsNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <p className="c4-ghs-meta">{v4("ghsNoteOptional")}</p>
        <label className="c4-lab"><span>{v4("ghsKeeper")}</span><input className="c4-field" aria-label={v4("ghsKeeper")} value={keeper} disabled={viewer} onChange={(event) => setKeeper(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("ghsDesk")}</span>
          <select className="c4-select" aria-label={v4("ghsBed")} value={place} disabled={viewer} onChange={(event) => setPlace(event.target.value)}>
            <option value="">{v4("ghsBlank")}</option>
            {GREEN_PLACES.map((item) => <option key={item} value={item}>{placeLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("ghsHerb")}</span>
          <select className="c4-select" aria-label={v4("ghsHerb")} value={herb} disabled={viewer} onChange={(event) => setHerb(event.target.value)}>
            <option value="">{v4("ghsBlankHerb")}</option>
            {HERBS.map((item) => <option key={item} value={item}>{herbLabel(v4, item.toUpperCase())}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("ghsClimate")}</span>
          <select className="c4-select" aria-label={v4("ghsClimate")} value={climate} disabled={viewer} onChange={(event) => setClimate(event.target.value)}>
            <option value="">{v4("ghsBlankClimate")}</option>
            {CLIMATES.map((item) => <option key={item} value={item}>{climateLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("ghsSpan")}</span>
          <select className="c4-select" aria-label={v4("ghsSpan")} value={spanMin} disabled={viewer} onChange={(event) => setSpanMin(event.target.value)}>
            <option value="">{v4("ghsBlankSpan")}</option>
            {SPANS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("ghsRank")}</span>
          <select className="c4-select" aria-label={v4("ghsRank")} value={rank} disabled={viewer} onChange={(event) => setRank(event.target.value)}>
            {RANKS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("ghsTags")}</span><input className="c4-field" aria-label={v4("ghsTags")} value={tags} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("ghsAdd")}</button>
      </form>
      <form className="c4-ghs-tools" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addSlipView(views, { id: `view-${Date.now()}`, name: viewName, tray, query, keeper: keeperFilter, herb: herbFilter, climate: climateFilter, place: placeFilter, span: spanFilter, rank: rankFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("ghsViewName")}</span><input className="c4-field" aria-label={v4("ghsViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("ghsSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-ghs-view">
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("ghsApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropSlipView(views, view.id))}>{v4("ghsDropView")}</button>
          </span>
        ))}
      </form>
      {picked.length > 0 && (
        <div className="c4-ghs-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSlipPin(cards, picked))}>{v4("ghsBulkPin")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSlipStore(cards, picked))}>{v4("ghsBulkFile")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSlipGale(cards, picked))}>{v4("ghsBulkGale")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSlipBay(cards, picked))}>{v4("ghsBulkBay")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSlipTag(cards, picked, "q"))}>{v4("ghsBulkTag")}</button>
        </div>
      )}
      <p className="c4-ghs-meta">{v4("ghsSuggest")} {herbLabel(v4, suggested)} · {v4("ghsFair")} {fair} · {v4("ghsBusy")} {busy || v4("ghsBlankKeeper")} · {v4("ghsNeighbors")} {neighborSlipCount(cards)} · {v4("ghsClash")} {clashPlaceCount(cards)} · {v4("ghsSpanHint")} {suggestSpan(cards, clock)}</p>
      {(reminders.length > 0 || idling.length > 0) && (
        <p className="c4-ghs-meta">{v4("ghsDue")} {reminders.map((card) => card.title).join(" · ")} · {v4("ghsIdle")} {idling.map((card) => card.title).join(" · ")}</p>
      )}
      {!shown.length && <p className="c4-ghs-empty">{v4("ghsEmpty")}</p>}
      <ol className="c4-ghs-board" data-density={density}>
        {shown.map((card, index) => (
          <li key={card.id} className="c4-ghs-card" data-on={index === focusAt ? "1" : "0"} data-pinned={card.pinned ? "1" : "0"} data-overdue={overdueSlip(card) ? "1" : "0"} data-peak={peakPlot(card.place) ? "1" : "0"} data-quiet={quietPlot(card.place) ? "1" : "0"} data-house={houseHerb(card.herb) ? "1" : "0"} data-gale={galeSlip(card) ? "1" : "0"} data-idle={idleSlip(card) ? "1" : "0"} data-resting={restingSlip(card) ? "1" : "0"} data-late={lateSlip(card, desk) ? "1" : "0"}>
            <label className="c4-ghs-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => togglePick(card.id)} /></label>
            <div>
              <input className="c4-field" aria-label={v4("ghsEdit")} value={card.title} disabled={viewer} onChange={(event) => store(editSlip(cards, card.id, event.target.value))} />
              <input className="c4-field" aria-label={v4("ghsEditNote")} aria-required={false} value={card.note} disabled={viewer} onChange={(event) => store(editSlipNote(cards, card.id, event.target.value))} />
              <p className="c4-ghs-meta">{card.keeper || v4("ghsBlankKeeper")} · {placeLabel(v4, card.place)} · {herbLabel(v4, card.herb)} · {climateLabel(v4, card.climate)} · {card.span ?? v4("ghsBlankSpan")} · {v4("ghsRank")} {card.rank} · {card.tags.join(" ") || v4("ghsTags")}</p>
              <p className="c4-ghs-sla" aria-label={v4("ghsSpan")}><i style={{ width: `${Math.round(((card.span ?? 0) / 45) * 100)}%` }} /></p>
              <p className="c4-ghs-meta">{placeLabel(v4, desk)} · {AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : v4("ghsAuditSave")}</p>
              <div className="c4-ghs-tools">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("ghsUnpin") : v4("ghsPin")}</button>
                <button type="button" className="c4-btn" disabled={viewer || card.stored} onClick={() => store(setSlipBench(cards, card.id, !card.benched))}>{card.benched ? v4("ghsResume") : v4("ghsHeld")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipStore(cards, card.id, !card.stored))}>{card.stored ? v4("ghsOpenAgain") : v4("ghsFile")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("ghsUnstar") : v4("ghsStar")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleClimate(cards, card.id))}>{v4("ghsTempo")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lengthenSpan(cards, card.id))}>{v4("ghsLengthen")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(shortenSpan(cards, card.id))}>{v4("ghsShorten")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseRank(cards, card.id))}>{v4("ghsRaise")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerRank(cards, card.id))}>{v4("ghsLower")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipHerb(cards, card.id, card.herb === "BAY" ? "mint" : "bay"))}>{v4("ghsHerb")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addSlipTag(cards, card.id, "r"))}>{v4("ghsTags")}</button>
                <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(slipCopy(card)); setCopied(card.id); }}>{copied === card.id ? v4("ghsCopied") : v4("ghsCopy")}</button>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <button type="button" className="c4-btn" onClick={() => download("greenhouse-slips.csv", slipCsv(shown, desk))}>{v4("ghsCsv")}</button>
    </section>
  );
}

export function DialPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: TraderRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [shape, setShape] = useState<DialShape>("all");
  const [review, setReview] = useState<DialReview>("all");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<DialRow[]>(() => (queue.data?.users || []).map((row, index) => ({
    id: row.id ? `trader-${row.id}` : `trader-${index}`,
    label: textField(row.name),
    note: { phone: textField(row.phone) } satisfies DialValue,
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
    const present = presentDialLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenDials(readJson(DLP_KEY, []), present);
    const nextReviewed = readReviewedDials(readJson(DLP_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(DLP_KEY, nextHidden);
    writeJson(DLP_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentDialLanes(rows);
  const lanes = visibleDialLanes(present, hidden, showHidden);
  const shown = visibleDials(rows, lane, hue, query, review, reviewed, shape).filter((row) => {
    const token = dialLane(row.note);
    if (!token) return true;
    return showHidden || !hidden.includes(token);
  });
  const focusAt = shown.length ? focus % shown.length : 0;
  const bars = dialLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingDial(rows);
  const leadHue = leadingDialHue(rows);
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
    writeJson(DLP_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(DLP_REVIEW_KEY, next);
  }
  return (
    <section className="c4-dlp" aria-label={v4("dlpTitle")} data-plates="1" data-traders={rows.length} data-role={role}>
      <header className="c4-dlp-mast">
        <p className="c4-dlp-seal" data-logo="mono">{v4("dlpLogo")}</p>
        <div>
          <p className="c4-dlp-kicker">{v4("dlpSub")}</p>
          <h2 className="c4-title">{v4("dlpTitle")}</h2>
        </div>
        <ol className="c4-dlp-index" aria-label={v4("dlpTitle")}>
          <li data-tone="gold">{v4("dlpChampagne")}</li>
          <li data-tone="ink">{v4("dlpGraphite")}</li>
          <li data-tone="ivory">{v4("dlpIvory")}</li>
        </ol>
      </header>
      <p className="c4-dlp-links">
        <Link href={crmv4Href(base, "ghs")}>{v4("dlpCards")}</Link>
        <Link href={crmv4Href(base, "goals")}>{v4("ghsGoals")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("ghsCustomers")}</Link>
      </p>
      <p className="c4-dlp-hint">{v4("dlpHint")}</p>
      {viewer && <p className="c4-dlp-note">{v4("dlpViewer")}</p>}
      {queue.loading && <p className="c4-dlp-meta">{v4("dlpEmpty")}</p>}
      {queue.error && <p className="c4-dlp-meta">{queue.error}</p>}
      <ul className="c4-dlp-kpis" aria-label={v4("dlpRules")}>
        <li><span>{v4("dlpLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("dlpUnmarked")}</strong></li>
        <li><span>{v4("dlpToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("dlpUnmarked")}</strong></li>
        <li><span>{v4("dlpShared")}</span><strong>{sharedDialCount(rows)}</strong></li>
        <li><span>{v4("dlpShare")}</span><strong>{dialShare(laneDialCount(rows, "brief"), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("dlpWide")}</span><strong>{rows.filter((row) => dialWide(row.note)).length}</strong></li>
        <li><span>{v4("dlpNotch")}</span><strong>{rows.filter((row) => dialNotch(row.note)).length}</strong></li>
        <li><span>{v4("dlpEcho")}</span><strong>{rows.filter((row) => dialEcho(row.note)).length}</strong></li>
        <li><span>{v4("dlpLeap")}</span><strong>{rows.filter((row) => dialLeap(row.note)).length}</strong></li>
        <li><span>{v4("dlpPlus")}</span><strong>{rows.filter((row) => dialPlus(row.note)).length}</strong></li>
        <li><span>{v4("dlpPair")}</span><strong>{rows.filter((row) => dialSpoken(row.note)).length}</strong></li>
      </ul>
      <div className="c4-dlp-chart" aria-label={v4("dlpRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-dlp-bar" data-on={lane === bar.lane ? "1" : "0"} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <span>{laneLabel(v4, bar.lane)}</span>
            <strong>{bar.count}</strong>
          </button>
        ))}
      </div>
      <div className="c4-dlp-tools">
        <input ref={searchRef} className="c4-field c4-dlp-search" aria-label={v4("dlpSearch")} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("dlpSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("dlpAll") : hueLabel(v4, item)}</button>
        ))}
        {(["all", "brief", "desk", "hall", "long", "wide", "notch", "leap", "plus", "pair"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>
            {item === "all" ? v4("dlpShapeAll") : item === "wide" ? v4("dlpShapeWide") : item === "notch" ? v4("dlpShapeNotch") : item === "leap" ? v4("dlpShapeLeap") : item === "plus" ? v4("dlpShapePlus") : item === "pair" ? v4("dlpShapePair") : laneLabel(v4, item)}
          </button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("dlpAll") : item === "reviewed" ? v4("dlpReviewed") : v4("dlpUnreviewed")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("dlpShow")}</button>
      </div>
      <ul className="c4-dlp-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleDial(hidden, item))}>{hidden.includes(item) ? v4("dlpShow") : v4("dlpHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-dlp-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkDialReview(reviewed, picked, true))}>{v4("dlpBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkDialReview(reviewed, picked, false))}>{v4("dlpBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-dlp-empty">{v4("dlpEmpty")}</p>}
      <ol className="c4-dlp-board">
        {shown.map((row, index) => {
          const seen = reviewed.includes(row.id);
          return (
            <li key={row.id} className="c4-dlp-card" data-on={index === focusAt ? "1" : "0"} data-lane={dialLane(row.note)} data-hue={dialHue(row.note)} data-reviewed={seen ? "1" : "0"}>
              <label className="c4-dlp-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label || row.id} onChange={() => setPicked((current) => current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id])} /></label>
              <div>
                <strong>{row.label || v4("dlpUnmarked")}</strong>
                <p className="c4-dlp-meta">{dialStamp(row.note)} · {laneLabel(v4, dialLane(row.note))} · {hueLabel(v4, dialHue(row.note))} · {v4("dlpStep")} {dialStep(row.note)}</p>
                <div className="c4-dlp-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleDialReview(reviewed, row.id))}>{seen ? v4("dlpReviewed") : v4("dlpReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(dialCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("dlpCopied") : v4("dlpCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="c4-dlp-tools">
        <button type="button" className="c4-btn" onClick={() => download("dial-lanes.csv", dialLanesCsv(rows))}>{v4("dlpCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("dial-rows.csv", dialRowsCsv(shown, reviewed))}>{v4("dlpRowCsv")}</button>
      </div>
    </section>
  );
}
