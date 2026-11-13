"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  RGP_KEY,
  RGP_REVIEW_KEY,
  STL_DENSITY_KEY,
  STL_KEY,
  STL_VIEW_KEY,
  STILL_SHELVES,
  addStill,
  addStillTag,
  addStillView,
  boilStill,
  bulkRegionReview,
  bulkStillBoil,
  bulkStillHoney,
  bulkStillPin,
  bulkStillTag,
  bulkStillVault,
  busiestStillKeeper,
  clashShelfCount,
  cycleHeat,
  dropStillView,
  editStill,
  editStillNote,
  fairStillKeeper,
  heatFocused,
  holdStillFocused,
  houseDraught,
  idleStill,
  idleStills,
  laneRegionCount,
  lateStill,
  leadingRegion,
  leadingRegionHue,
  lengthenStill,
  lengthenStillFocused,
  lowerStill,
  lowerStillFocused,
  moveStillFocus,
  neighborStillCount,
  overdueStill,
  peakShelf,
  pinStillFocused,
  presentRegionLanes,
  quietShelf,
  raiseStill,
  raiseStillFocused,
  readHiddenRegions,
  readReviewedRegions,
  readStillViews,
  readStills,
  regionCopy,
  regionEcho,
  regionHue,
  regionLane,
  regionLanes,
  regionLanesCsv,
  regionLeap,
  regionMark,
  regionNotch,
  regionPair,
  regionPlus,
  regionRowsCsv,
  regionShare,
  regionStamp,
  regionStep,
  regionWide,
  reminderStills,
  restingStill,
  setStillDraught,
  setStillHold,
  setStillPin,
  setStillStar,
  setStillVault,
  sharedRegionCount,
  shortenStill,
  shortenStillFocused,
  sortStills,
  starStillFocused,
  stillBars,
  stillCopy,
  stillCounts,
  stillCsv,
  stillDensity,
  stillKeepers,
  stillTimeline,
  suggestDraught,
  suggestShelf,
  suggestStillSpan,
  tagStillFocused,
  toggleRegion,
  toggleRegionReview,
  visibleRegionLanes,
  visibleRegions,
  visibleStills,
  type RegionReview,
  type RegionRow,
  type RegionShape,
  type RegionValue,
  type StillDensity,
  type StillSlip,
  type StillSort,
  type StillTray,
  type StillView,
} from "@/lib/crmv4/round261";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const DRAUGHTS = ["rose", "clove", "honey"] as const;
const HEATS = ["cool", "warm", "boil"] as const;
const SPANS = ["10", "20", "40"] as const;
const RANKS = ["1", "3", "5", "7"] as const;

const SHELF_KEY: Record<string, CrmV4CopyKey> = {
  shelf: "srmShelf",
  bench: "srmBench",
  hearth: "srmHearth",
  cellar: "srmCellar",
  peak: "srmPeakShelf",
  quiet: "srmQuietShelf",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "srmAuditSave",
  edit: "srmAuditEdit",
  note: "srmAuditNote",
  heat: "srmAuditHeat",
  pin: "srmAuditPin",
  unpin: "srmAuditUnpin",
  hold: "srmAuditHold",
  resume: "srmAuditResume",
  vault: "srmAuditVault",
  open: "srmAuditOpen",
  draught: "srmAuditDraught",
  tag: "srmAuditTag",
  rank: "srmAuditRank",
  span: "srmAuditSpan",
  short: "srmAuditShort",
  flag: "srmAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  brief: "rgpBrief",
  desk: "rgpDesk",
  hall: "rgpHall",
  long: "rgpLong",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "rgpIvory",
  graphite: "rgpGraphite",
  champagne: "rgpChampagne",
};

type TraderRow = {
  id?: string;
  name?: string | null;
  lastRegion?: string | null;
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

function shelfLabel(v4: V4, shelf: string): string {
  const key = SHELF_KEY[shelf];
  return key ? v4(key) : v4("srmBlank");
}

function draughtLabel(v4: V4, draught: string): string {
  if (draught === "ROSE") return v4("srmRose");
  if (draught === "CLOVE") return v4("srmClove");
  if (draught === "HONEY") return v4("srmHoney");
  return v4("srmBlankDraught");
}

function heatLabel(v4: V4, heat: string): string {
  if (heat === "cool") return v4("srmCool");
  if (heat === "warm") return v4("srmWarm");
  if (heat === "boil") return v4("srmBoil");
  return v4("srmBlankHeat");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("rgpUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("rgpUnmarked");
}

export function StillroomSlips({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<StillSlip[]>([]);
  const [views, setViews] = useState<StillView[]>([]);
  const [density, setDensity] = useState<StillDensity>("airy");
  const [sort, setSort] = useState<StillSort>("shelf");
  const [tray, setTray] = useState<StillTray>("open");
  const [query, setQuery] = useState("");
  const [keeperFilter, setKeeperFilter] = useState("all");
  const [draughtFilter, setDraughtFilter] = useState("all");
  const [heatFilter, setHeatFilter] = useState("all");
  const [shelfFilter, setShelfFilter] = useState("all");
  const [spanFilter, setSpanFilter] = useState("all");
  const [rankFilter, setRankFilter] = useState("all");
  const [houseOnly, setHouseOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [desk, setDesk] = useState("hearth");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [keeper, setKeeper] = useState("");
  const [shelf, setShelf] = useState("");
  const [draught, setDraught] = useState("");
  const [heat, setHeat] = useState("");
  const [spanMin, setSpanMin] = useState("");
  const [rank, setRank] = useState("1");
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
    setCards(readStills(readJson(STL_KEY, [])));
    setViews(readStillViews(readJson(STL_VIEW_KEY, [])));
    setDensity(stillDensity(readJson(STL_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  const shown = sortStills(visibleStills(cards, tray, query, keeperFilter, draughtFilter, heatFilter, shelfFilter, spanFilter, rankFilter, houseOnly, peakOnly, quietOnly), sort);
  const focusAt = shown.length ? focus % shown.length : 0;
  const counts = stillCounts(cards, shown, desk);
  const timeline = stillTimeline(cards);
  const reminders = reminderStills(cards);
  const idling = idleStills(cards);
  const keepers = stillKeepers(cards);
  const bars = stillBars(cards);
  const ribbon = Math.max(1, bars.reduce((sum, bar) => sum + bar.count, 0));
  const ids = shown.map((card) => card.id);
  const busy = busiestStillKeeper(cards);
  const clock = new Date().getUTCHours();
  const suggested = suggestDraught(cards);
  const fair = fairStillKeeper(cards, keepers.join(", ") || "Ada, Bea");
  const shelfHint = suggestShelf(clock);
  function store(next: StillSlip[]) {
    const saved = readStills(next);
    setCards(saved);
    writeJson(STL_KEY, saved);
  }
  function storeViews(next: StillView[]) {
    const saved = readStillViews(next);
    setViews(saved);
    writeJson(STL_VIEW_KEY, saved);
  }
  function storeDensity(next: StillDensity) {
    setDensity(next);
    writeJson(STL_DENSITY_KEY, next);
  }
  function togglePick(id: string) {
    setPicked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }
  function applyView(view: StillView) {
    setTray(view.tray);
    setQuery(view.query);
    setKeeperFilter(view.keeper || "all");
    setDraughtFilter(view.draught);
    setHeatFilter(view.heat);
    setShelfFilter(view.shelf);
    setSpanFilter(view.span);
    setRankFilter(view.rank);
  }
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setKeeper("");
        setShelf("");
        setDraught("");
        setHeat("");
        setSpanMin("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveStillFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveStillFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        if (!viewer) store(holdStillFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        if (!viewer) store(pinStillFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        if (!viewer) store(heatFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        if (!viewer) store(lengthenStillFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        if (!viewer) store(shortenStillFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        if (!viewer) store(tagStillFocused(cards, ids, focusAt, "a"));
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        if (!viewer) store(starStillFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        if (!viewer) store(raiseStillFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "y" || event.key === "Y") {
        event.preventDefault();
        if (!viewer) store(lowerStillFocused(cards, ids, focusAt));
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
    <section className="c4-srm" aria-label={v4("srmTitle")} data-cards="1" data-desk="stillroom" data-role={role} data-density={density} data-board={board}>
      <header className="c4-srm-mast">
        <p className="c4-srm-seal" data-logo="mono">{v4("srmLogo")}</p>
        <div>
          <p className="c4-srm-kicker">{v4("srmSub")}</p>
          <h2 className="c4-title">{v4("srmTitle")}</h2>
        </div>
        <ol className="c4-srm-index" aria-label={v4("srmTitle")}>
          <li data-tone="gold">{v4("srmChampagne")}</li>
          <li data-tone="ink">{v4("srmGraphite")}</li>
          <li data-tone="ivory">{v4("srmIvory")}</li>
        </ol>
      </header>
      <p className="c4-srm-links">
        <Link href={crmv4Href(base, "rgp")}>{v4("srmPlates")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("srmCustomers")}</Link>
        <Link href={crmv4Href(base, "support")}>{v4("srmSupport")}</Link>
      </p>
      {viewer && <p className="c4-srm-note">{v4("srmViewer")}</p>}
      <p className="c4-srm-lead">{v4("srmKeys")}</p>
      <p className="c4-srm-hint">{v4("srmHint")}</p>
      <p className="c4-srm-notice" role="status">{v4("srmNotice")} {counts.overdue}</p>
      <ul className="c4-srm-kpis" aria-label={v4("srmChart")}>
        <li><span>{v4("srmOpen")}</span><strong>{counts.open}</strong></li>
        <li><span>{v4("srmHeld")}</span><strong>{counts.hold}</strong></li>
        <li><span>{v4("srmVault")}</span><strong>{counts.vault}</strong></li>
        <li><span>{v4("srmPinned")}</span><strong>{counts.pinned}</strong></li>
        <li><span>{v4("srmPeak")}</span><strong>{counts.peak}</strong></li>
        <li><span>{v4("srmQuiet")}</span><strong>{counts.quiet}</strong></li>
        <li><span>{v4("srmSoon")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("srmRank")}</span><strong>{counts.rank}</strong></li>
        <li><span>{v4("srmHouse")}</span><strong>{counts.house}</strong></li>
        <li><span>{v4("srmOverdue")}</span><strong>{counts.overdue}</strong></li>
      </ul>
      <div className="c4-srm-ribbon" aria-label={v4("srmBars")}>
        {bars.map((bar) => (
          <i key={bar.shelf} data-shelf={bar.shelf} style={{ flexGrow: Math.max(bar.count, 0.35) }} />
        ))}
      </div>
      <ol className="c4-srm-legend">
        {bars.map((bar) => (
          <li key={bar.shelf} data-shelf={bar.shelf}><span>{shelfLabel(v4, bar.shelf)}</span><strong>{bar.count}</strong><em>{Math.round((bar.count / ribbon) * 100)}%</em></li>
        ))}
      </ol>
      <ol className="c4-srm-time" aria-label={v4("srmTimeline")}>
        {timeline.map((lane) => (
          <li key={lane.rank}><span>{lane.rank}</span><strong>{lane.titles.join(" · ")}</strong></li>
        ))}
      </ol>
      <div className="c4-srm-tools">
        <label className="c4-lab">
          <span>{v4("srmDesk")}</span>
          <select className="c4-select" aria-label={v4("srmDesk")} value={desk} onChange={(event) => setDesk(event.target.value)}>
            {STILL_SHELVES.map((item) => <option key={item} value={item}>{shelfLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("srmSearch")}</span>
          <input ref={searchRef} className="c4-field c4-srm-search" aria-label={v4("srmSearch")} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("srmSearch")} />
        </label>
        {(["open", "hold", "vault"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("srmOpen") : item === "hold" ? v4("srmHeld") : v4("srmVault")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("srmHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((value) => !value)}>{v4("srmPeak")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((value) => !value)}>{v4("srmQuiet")}</button>
        <button type="button" className="c4-chip" data-on={sort === "keeper" ? "1" : "0"} onClick={() => setSort((value) => value === "shelf" ? "keeper" : "shelf")}>{sort === "keeper" ? v4("srmSortKeeper") : v4("srmSortShelf")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "airy" ? "tight" : "airy")}>{density === "airy" ? v4("srmAiry") : v4("srmTight")}</button>
        <button type="button" className="c4-chip" onClick={() => setBoard((value) => value === "hall" ? "index" : "hall")}>{board === "hall" ? v4("srmHall") : v4("srmIndex")}</button>
      </div>
      <div className="c4-srm-tools">
        <select className="c4-select" aria-label={v4("srmKeeper")} value={keeperFilter} onChange={(event) => setKeeperFilter(event.target.value)}>
          <option value="all">{v4("srmAll")}</option>
          {keepers.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("srmDraught")} value={draughtFilter} onChange={(event) => setDraughtFilter(event.target.value)}>
          <option value="all">{v4("srmAll")}</option>
          {DRAUGHTS.map((item) => <option key={item} value={item}>{draughtLabel(v4, item.toUpperCase())}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("srmHeat")} value={heatFilter} onChange={(event) => setHeatFilter(event.target.value)}>
          <option value="all">{v4("srmAll")}</option>
          {HEATS.map((item) => <option key={item} value={item}>{heatLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("srmDesk")} value={shelfFilter} onChange={(event) => setShelfFilter(event.target.value)}>
          <option value="all">{v4("srmAll")}</option>
          <option value="peak">{v4("srmPeakShelf")}</option>
          <option value="quiet">{v4("srmQuietShelf")}</option>
          {STILL_SHELVES.map((item) => <option key={item} value={item}>{shelfLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("srmSpan")} value={spanFilter} onChange={(event) => setSpanFilter(event.target.value)}>
          <option value="all">{v4("srmAll")}</option>
          {SPANS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("srmRank")} value={rankFilter} onChange={(event) => setRankFilter(event.target.value)}>
          <option value="all">{v4("srmAll")}</option>
          {RANKS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      <form className="c4-srm-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addStill(cards, { id: `srm-${Date.now()}`, title, note, keeper, shelf, draught, heat, span: spanMin, rank, tags });
        if (next === cards || next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <label className="c4-lab"><span>{v4("srmTitleField")}</span><input className="c4-field" aria-label={v4("srmTitleField")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("srmNote")}</span><input className="c4-field" aria-label={v4("srmNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <p className="c4-srm-meta">{v4("srmNoteOptional")}</p>
        <label className="c4-lab"><span>{v4("srmKeeper")}</span><input className="c4-field" aria-label={v4("srmKeeper")} value={keeper} disabled={viewer} onChange={(event) => setKeeper(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("srmDesk")}</span>
          <select className="c4-select" aria-label={v4("srmShelf")} value={shelf} disabled={viewer} onChange={(event) => setShelf(event.target.value)}>
            <option value="">{v4("srmBlank")}</option>
            {STILL_SHELVES.map((item) => <option key={item} value={item}>{shelfLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("srmDraught")}</span>
          <select className="c4-select" aria-label={v4("srmDraught")} value={draught} disabled={viewer} onChange={(event) => setDraught(event.target.value)}>
            <option value="">{v4("srmBlankDraught")}</option>
            {DRAUGHTS.map((item) => <option key={item} value={item}>{draughtLabel(v4, item.toUpperCase())}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("srmHeat")}</span>
          <select className="c4-select" aria-label={v4("srmHeat")} value={heat} disabled={viewer} onChange={(event) => setHeat(event.target.value)}>
            <option value="">{v4("srmBlankHeat")}</option>
            {HEATS.map((item) => <option key={item} value={item}>{heatLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("srmSpan")}</span>
          <select className="c4-select" aria-label={v4("srmSpan")} value={spanMin} disabled={viewer} onChange={(event) => setSpanMin(event.target.value)}>
            <option value="">{v4("srmBlankSpan")}</option>
            {SPANS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("srmRank")}</span>
          <select className="c4-select" aria-label={v4("srmRank")} value={rank} disabled={viewer} onChange={(event) => setRank(event.target.value)}>
            {RANKS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("srmTags")}</span><input className="c4-field" aria-label={v4("srmTags")} value={tags} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("srmAdd")}</button>
      </form>
      <form className="c4-srm-tools" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addStillView(views, { id: `view-${Date.now()}`, name: viewName, tray, query, keeper: keeperFilter, draught: draughtFilter, heat: heatFilter, shelf: shelfFilter, span: spanFilter, rank: rankFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("srmViewName")}</span><input className="c4-field" aria-label={v4("srmViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("srmSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-srm-view">
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("srmApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropStillView(views, view.id))}>{v4("srmDropView")}</button>
          </span>
        ))}
      </form>
      {picked.length > 0 && (
        <div className="c4-srm-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkStillPin(cards, picked))}>{v4("srmBulkPin")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkStillVault(cards, picked))}>{v4("srmBulkVault")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkStillBoil(cards, picked))}>{v4("srmBulkBoil")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkStillHoney(cards, picked))}>{v4("srmBulkHoney")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkStillTag(cards, picked, "b"))}>{v4("srmBulkTag")}</button>
        </div>
      )}
      <p className="c4-srm-meta">{v4("srmSuggest")} {draughtLabel(v4, suggested)} · {v4("srmFair")} {fair} · {v4("srmBusy")} {busy || v4("srmBlankKeeper")} · {v4("srmNeighbors")} {neighborStillCount(cards)} · {v4("srmClash")} {clashShelfCount(cards)} · {v4("srmSpanHint")} {suggestStillSpan(cards, clock)} · {v4("srmShelfHint")} {shelfLabel(v4, shelfHint)}</p>
      {(reminders.length > 0 || idling.length > 0) && (
        <p className="c4-srm-meta">{v4("srmDue")} {reminders.map((card) => card.title).join(" · ")} · {v4("srmIdle")} {idling.map((card) => card.title).join(" · ")}</p>
      )}
      {!shown.length && <p className="c4-srm-empty">{v4("srmEmpty")}</p>}
      <ol className="c4-srm-board" data-density={density}>
        {shown.map((card, index) => (
          <li key={card.id} className="c4-srm-card" data-on={index === focusAt ? "1" : "0"} data-pinned={card.pinned ? "1" : "0"} data-overdue={overdueStill(card) ? "1" : "0"} data-peak={peakShelf(card.shelf) ? "1" : "0"} data-quiet={quietShelf(card.shelf) ? "1" : "0"} data-house={houseDraught(card.draught) ? "1" : "0"} data-boil={boilStill(card) ? "1" : "0"} data-idle={idleStill(card) ? "1" : "0"} data-resting={restingStill(card) ? "1" : "0"} data-late={lateStill(card, desk) ? "1" : "0"}>
            <i className="c4-srm-spine" aria-hidden="true" />
            <label className="c4-srm-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => togglePick(card.id)} /></label>
            <div>
              <input className="c4-field" aria-label={v4("srmEdit")} value={card.title} disabled={viewer} onChange={(event) => store(editStill(cards, card.id, event.target.value))} />
              <input className="c4-field" aria-label={v4("srmEditNote")} aria-required={false} value={card.note} disabled={viewer} onChange={(event) => store(editStillNote(cards, card.id, event.target.value))} />
              <p className="c4-srm-meta">{card.keeper || v4("srmBlankKeeper")} · {shelfLabel(v4, card.shelf)} · {draughtLabel(v4, card.draught)} · {heatLabel(v4, card.heat)} · {card.span ?? v4("srmBlankSpan")} · {v4("srmRank")} {card.rank} · {card.tags.join(" ") || v4("srmTags")}</p>
              <p className="c4-srm-sla" aria-label={v4("srmSpan")}><i style={{ width: `${Math.round(((card.span ?? 0) / 40) * 100)}%` }} /></p>
              <p className="c4-srm-meta">{shelfLabel(v4, desk)} · {AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : v4("srmAuditSave")}</p>
              <div className="c4-srm-tools">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setStillPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("srmUnpin") : v4("srmPin")}</button>
                <button type="button" className="c4-btn" disabled={viewer || card.vaulted} onClick={() => store(setStillHold(cards, card.id, !card.held))}>{card.held ? v4("srmResume") : v4("srmHeld")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setStillVault(cards, card.id, !card.vaulted))}>{card.vaulted ? v4("srmOpenAgain") : v4("srmVault")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setStillStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("srmUnstar") : v4("srmStar")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleHeat(cards, card.id))}>{v4("srmTempo")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lengthenStill(cards, card.id))}>{v4("srmLengthen")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(shortenStill(cards, card.id))}>{v4("srmShorten")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseStill(cards, card.id))}>{v4("srmRaise")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerStill(cards, card.id))}>{v4("srmLower")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setStillDraught(cards, card.id, card.draught === "HONEY" ? "rose" : "honey"))}>{v4("srmDraught")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addStillTag(cards, card.id, "c"))}>{v4("srmTags")}</button>
                <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(stillCopy(card)); setCopied(card.id); }}>{copied === card.id ? v4("srmCopied") : v4("srmCopy")}</button>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <button type="button" className="c4-btn" onClick={() => download("stillroom-slips.csv", stillCsv(shown, desk))}>{v4("srmCsv")}</button>
    </section>
  );
}

export function RegionPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: TraderRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [shape, setShape] = useState<RegionShape>("all");
  const [review, setReview] = useState<RegionReview>("all");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<RegionRow[]>(() => (queue.data?.users || []).map((row, index) => ({
    id: row.id ? `trader-${row.id}` : `trader-${index}`,
    label: textField(row.name),
    note: { lastRegion: textField(row.lastRegion) } satisfies RegionValue,
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
    const present = presentRegionLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenRegions(readJson(RGP_KEY, []), present);
    const nextReviewed = readReviewedRegions(readJson(RGP_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(RGP_KEY, nextHidden);
    writeJson(RGP_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentRegionLanes(rows);
  const lanes = visibleRegionLanes(present, hidden, showHidden);
  const shown = visibleRegions(rows, lane, hue, query, review, reviewed, shape).filter((row) => {
    const token = regionLane(row.note);
    if (!token) return true;
    return showHidden || !hidden.includes(token);
  });
  const focusAt = shown.length ? focus % shown.length : 0;
  const bars = regionLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingRegion(rows);
  const leadHue = leadingRegionHue(rows);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveStillFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveStillFocus(index, shown.length, -1));
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
    writeJson(RGP_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(RGP_REVIEW_KEY, next);
  }
  return (
    <section className="c4-rgp" aria-label={v4("rgpTitle")} data-plates="1" data-traders={rows.length} data-role={role}>
      <header className="c4-rgp-mast">
        <p className="c4-rgp-seal" data-logo="mono">{v4("rgpLogo")}</p>
        <div>
          <p className="c4-rgp-kicker">{v4("rgpSub")}</p>
          <h2 className="c4-title">{v4("rgpTitle")}</h2>
        </div>
        <ol className="c4-rgp-index" aria-label={v4("rgpTitle")}>
          <li data-tone="gold">{v4("rgpChampagne")}</li>
          <li data-tone="ink">{v4("rgpGraphite")}</li>
          <li data-tone="ivory">{v4("rgpIvory")}</li>
        </ol>
      </header>
      <p className="c4-rgp-links">
        <Link href={crmv4Href(base, "srm")}>{v4("rgpCards")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("srmCustomers")}</Link>
        <Link href={crmv4Href(base, "support")}>{v4("srmSupport")}</Link>
      </p>
      <p className="c4-rgp-hint">{v4("rgpHint")}</p>
      {viewer && <p className="c4-rgp-note">{v4("rgpViewer")}</p>}
      {queue.loading && <p className="c4-rgp-meta">{v4("rgpEmpty")}</p>}
      {queue.error && <p className="c4-rgp-meta">{queue.error}</p>}
      <ul className="c4-rgp-kpis" aria-label={v4("rgpRules")}>
        <li><span>{v4("rgpLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("rgpUnmarked")}</strong></li>
        <li><span>{v4("rgpToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("rgpUnmarked")}</strong></li>
        <li><span>{v4("rgpShared")}</span><strong>{sharedRegionCount(rows)}</strong></li>
        <li><span>{v4("rgpShare")}</span><strong>{regionShare(laneRegionCount(rows, "brief"), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("rgpWide")}</span><strong>{rows.filter((row) => regionWide(row.note)).length}</strong></li>
        <li><span>{v4("rgpNotch")}</span><strong>{rows.filter((row) => regionNotch(row.note)).length}</strong></li>
        <li><span>{v4("rgpEcho")}</span><strong>{rows.filter((row) => regionEcho(row.note)).length}</strong></li>
        <li><span>{v4("rgpLeap")}</span><strong>{rows.filter((row) => regionLeap(row.note)).length}</strong></li>
        <li><span>{v4("rgpPlus")}</span><strong>{rows.filter((row) => regionPlus(row.note)).length}</strong></li>
        <li><span>{v4("rgpPair")}</span><strong>{rows.filter((row) => regionPair(row.note)).length}</strong></li>
        <li><span>{v4("rgpMark")}</span><strong>{rows.filter((row) => regionMark(row.note)).length}</strong></li>
      </ul>
      <div className="c4-rgp-chart" aria-label={v4("rgpRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-rgp-bar" data-on={lane === bar.lane ? "1" : "0"} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <span>{laneLabel(v4, bar.lane)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </button>
        ))}
      </div>
      <div className="c4-rgp-tools">
        <input ref={searchRef} className="c4-field c4-rgp-search" aria-label={v4("rgpSearch")} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("rgpSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("rgpAll") : hueLabel(v4, item)}</button>
        ))}
        {(["all", "brief", "desk", "hall", "long", "wide", "notch", "leap", "plus", "pair", "mark"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>
            {item === "all" ? v4("rgpShapeAll") : item === "wide" ? v4("rgpShapeWide") : item === "notch" ? v4("rgpShapeNotch") : item === "leap" ? v4("rgpShapeLeap") : item === "plus" ? v4("rgpShapePlus") : item === "pair" ? v4("rgpShapePair") : item === "mark" ? v4("rgpShapeMark") : laneLabel(v4, item)}
          </button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("rgpAll") : item === "reviewed" ? v4("rgpReviewed") : v4("rgpUnreviewed")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("rgpShow")}</button>
      </div>
      <ul className="c4-rgp-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleRegion(hidden, item))}>{hidden.includes(item) ? v4("rgpShow") : v4("rgpHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-rgp-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkRegionReview(reviewed, picked, true))}>{v4("rgpBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkRegionReview(reviewed, picked, false))}>{v4("rgpBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-rgp-empty">{v4("rgpEmpty")}</p>}
      <ol className="c4-rgp-board">
        {shown.map((row, index) => {
          const seen = reviewed.includes(row.id);
          return (
            <li key={row.id} className="c4-rgp-card" data-on={index === focusAt ? "1" : "0"} data-lane={regionLane(row.note)} data-hue={regionHue(row.note)} data-reviewed={seen ? "1" : "0"}>
              <label className="c4-rgp-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label || row.id} onChange={() => setPicked((current) => current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id])} /></label>
              <div>
                <strong>{row.label || v4("rgpUnmarked")}</strong>
                <p className="c4-rgp-meta">{regionStamp(row.note)} · {laneLabel(v4, regionLane(row.note))} · {hueLabel(v4, regionHue(row.note))} · {v4("rgpStep")} {regionStep(row.note)}</p>
                <div className="c4-rgp-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleRegionReview(reviewed, row.id))}>{seen ? v4("rgpReviewed") : v4("rgpReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(regionCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("rgpCopied") : v4("rgpCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="c4-rgp-tools">
        <button type="button" className="c4-btn" onClick={() => download("region-lanes.csv", regionLanesCsv(rows))}>{v4("rgpCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("region-rows.csv", regionRowsCsv(shown, reviewed))}>{v4("rgpRowCsv")}</button>
      </div>
    </section>
  );
}
