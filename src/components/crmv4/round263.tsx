"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  BTY_DENSITY_KEY,
  BTY_KEY,
  BTY_VIEW_KEY,
  BUTTERY_CELLARS,
  PRV_KEY,
  PRV_REVIEW_KEY,
  addButtery,
  addButteryTag,
  addButteryView,
  briskButtery,
  bulkButteryAmber,
  bulkButteryPin,
  bulkButterySeal,
  bulkButterySpark,
  bulkButteryTag,
  bulkSourceReview,
  busiestButterySteward,
  butteryBars,
  butteryCopy,
  butteryCounts,
  butteryCsv,
  butteryDensity,
  butteryStewards,
  butteryTimeline,
  clashCellarCount,
  cyclePour,
  dropButteryView,
  editButtery,
  editButteryNote,
  fairButterySteward,
  houseGlass,
  idleButtery,
  idleButteries,
  laneSourceCount,
  lateButtery,
  leadingSource,
  leadingSourceHue,
  lengthenButtery,
  lengthenButteryFocused,
  lowerButtery,
  lowerButteryFocused,
  moveButteryFocus,
  neighborButteryCount,
  overdueButtery,
  pauseButteryFocused,
  peakCellar,
  pinButteryFocused,
  pourFocused,
  presentSourceLanes,
  quietCellar,
  raiseButtery,
  raiseButteryFocused,
  readButteries,
  readButteryViews,
  readHiddenSources,
  readReviewedSources,
  reminderButteries,
  restingButtery,
  setButteryGlass,
  setButteryPause,
  setButteryPin,
  setButterySeal,
  setButteryStar,
  sharedSourceCount,
  shortenButtery,
  shortenButteryFocused,
  sortButteries,
  sourceCopy,
  sourceEcho,
  sourceHue,
  sourceKnown,
  sourceCap,
  sourceLane,
  sourceLanes,
  sourceLanesCsv,
  sourceLeap,
  sourceNotch,
  sourceRowsCsv,
  sourceShare,
  sourceSlash,
  sourceStamp,
  sourceStep,
  sourceTail,
  sourceTwin,
  sourceWide,
  starButteryFocused,
  suggestButteryWait,
  suggestCellar,
  suggestGlass,
  tagButteryFocused,
  toggleSource,
  toggleSourceReview,
  visibleButteries,
  visibleSourceLanes,
  visibleSources,
  type ButteryDensity,
  type ButterySlip,
  type ButterySort,
  type ButteryTray,
  type ButteryView,
  type SourceReview,
  type SourceRow,
  type SourceShape,
  type SourceValue,
} from "@/lib/crmv4/round263";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const GLASSES = ["flint", "green", "amber"] as const;
const POURS = ["still", "spark", "cask"] as const;
const WAITS = ["15", "30", "45"] as const;
const RANKS = ["1", "3", "5", "7"] as const;

const CELLAR_KEY: Record<string, CrmV4CopyKey> = {
  vault: "btyVault",
  bin: "btyBin",
  rack: "btyRack",
  cave: "btyCave",
  peak: "btyPeakCellar",
  quiet: "btyQuietCellar",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "btyAuditSave",
  edit: "btyAuditEdit",
  note: "btyAuditNote",
  pour: "btyAuditPour",
  pin: "btyAuditPin",
  unpin: "btyAuditUnpin",
  pause: "btyAuditPause",
  resume: "btyAuditResume",
  seal: "btyAuditSeal",
  open: "btyAuditOpen",
  glass: "btyAuditGlass",
  tag: "btyAuditTag",
  rank: "btyAuditRank",
  wait: "btyAuditWait",
  short: "btyAuditShort",
  flag: "btyAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  hand: "prvHand",
  clock: "prvClock",
  mark: "prvMark",
  join: "prvJoin",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "prvIvory",
  graphite: "prvGraphite",
  champagne: "prvChampagne",
};

type TraderRow = {
  id?: string;
  name?: string | null;
  leadInvalidSource?: string | null;
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

function cellarLabel(v4: V4, cellar: string): string {
  const key = CELLAR_KEY[cellar];
  return key ? v4(key) : v4("btyBlank");
}

function glassLabel(v4: V4, glass: string): string {
  if (glass === "FLINT") return v4("btyFlint");
  if (glass === "GREEN") return v4("btyGreen");
  if (glass === "AMBER") return v4("btyAmber");
  return v4("btyBlankGlass");
}

function pourLabel(v4: V4, pour: string): string {
  if (pour === "still") return v4("btyStill");
  if (pour === "spark") return v4("btySpark");
  if (pour === "cask") return v4("btyCask");
  return v4("btyBlankPour");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("prvUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("prvUnmarked");
}

export function ButterySlips({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<ButterySlip[]>([]);
  const [views, setViews] = useState<ButteryView[]>([]);
  const [density, setDensity] = useState<ButteryDensity>("roomy");
  const [sort, setSort] = useState<ButterySort>("cellar");
  const [tray, setTray] = useState<ButteryTray>("open");
  const [query, setQuery] = useState("");
  const [stewardFilter, setStewardFilter] = useState("all");
  const [glassFilter, setGlassFilter] = useState("all");
  const [pourFilter, setPourFilter] = useState("all");
  const [cellarFilter, setCellarFilter] = useState("all");
  const [waitFilter, setWaitFilter] = useState("all");
  const [rankFilter, setRankFilter] = useState("all");
  const [houseOnly, setHouseOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [desk, setDesk] = useState("rack");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [steward, setSteward] = useState("");
  const [cellar, setCellar] = useState("");
  const [glass, setGlass] = useState("");
  const [pour, setPour] = useState("");
  const [waitMin, setWaitMin] = useState("");
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
    setCards(readButteries(readJson(BTY_KEY, [])));
    setViews(readButteryViews(readJson(BTY_VIEW_KEY, [])));
    setDensity(butteryDensity(readJson(BTY_DENSITY_KEY, "roomy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  const shown = sortButteries(visibleButteries(cards, tray, query, stewardFilter, glassFilter, pourFilter, cellarFilter, waitFilter, rankFilter, houseOnly, peakOnly, quietOnly), sort);
  const focusAt = shown.length ? focus % shown.length : 0;
  const counts = butteryCounts(cards, shown, desk);
  const timeline = butteryTimeline(cards);
  const reminders = reminderButteries(cards);
  const idling = idleButteries(cards);
  const stewards = butteryStewards(cards);
  const bars = butteryBars(cards);
  const ribbon = Math.max(1, bars.reduce((sum, bar) => sum + bar.count, 0));
  const ids = shown.map((card) => card.id);
  const busy = busiestButterySteward(cards);
  const clock = new Date().getUTCHours();
  const suggested = suggestGlass(cards);
  const fair = fairButterySteward(cards, stewards.join(", ") || "Ada, Bea");
  const cellarHint = suggestCellar(clock);
  function store(next: ButterySlip[]) {
    const saved = readButteries(next);
    setCards(saved);
    writeJson(BTY_KEY, saved);
  }
  function storeViews(next: ButteryView[]) {
    const saved = readButteryViews(next);
    setViews(saved);
    writeJson(BTY_VIEW_KEY, saved);
  }
  function storeDensity(next: ButteryDensity) {
    setDensity(next);
    writeJson(BTY_DENSITY_KEY, next);
  }
  function togglePick(id: string) {
    setPicked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }
  function applyView(view: ButteryView) {
    setTray(view.tray);
    setQuery(view.query);
    setStewardFilter(view.steward || "all");
    setGlassFilter(view.glass);
    setPourFilter(view.pour);
    setCellarFilter(view.cellar);
    setWaitFilter(view.wait);
    setRankFilter(view.rank);
  }
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setSteward("");
        setCellar("");
        setGlass("");
        setPour("");
        setWaitMin("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveButteryFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveButteryFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        if (!viewer) store(pauseButteryFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        if (!viewer) store(pinButteryFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        if (!viewer) store(pourFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        if (!viewer) store(lengthenButteryFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        if (!viewer) store(shortenButteryFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        if (!viewer) store(tagButteryFocused(cards, ids, focusAt, "a"));
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        if (!viewer) store(starButteryFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        if (!viewer) store(raiseButteryFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "y" || event.key === "Y") {
        event.preventDefault();
        if (!viewer) store(lowerButteryFocused(cards, ids, focusAt));
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
    <section className="c4-bty" aria-label={v4("btyTitle")} data-cards="1" data-desk="buttery" data-role={role} data-density={density} data-board={board}>
      <header className="c4-bty-mast">
        <p className="c4-bty-seal" data-logo="mono">{v4("btyLogo")}</p>
        <div className="c4-bty-mast-copy">
          <p className="c4-bty-kicker">{v4("btySub")}</p>
          <h2 className="c4-title">{v4("btyTitle")}</h2>
        </div>
        <i className="c4-bty-rule" aria-hidden="true" />
      </header>
      <p className="c4-bty-links">
        <Link href={crmv4Href(base, "prv")}>{v4("btyPlates")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("btyCustomers")}</Link>
        <Link href={crmv4Href(base, "support")}>{v4("btySupport")}</Link>
      </p>
      {viewer && <p className="c4-bty-note">{v4("btyViewer")}</p>}
      <p className="c4-bty-lead">{v4("btyKeys")}</p>
      <p className="c4-bty-hint">{v4("btyHint")}</p>
      <p className="c4-bty-notice" role="status">{v4("btyNotice")} {counts.overdue}</p>
      <ol className="c4-bty-ledger" aria-label={v4("btyChart")}>
        <li><span>{v4("btyOpen")}</span><strong>{counts.open}</strong></li>
        <li><span>{v4("btyPause")}</span><strong>{counts.pause}</strong></li>
        <li><span>{v4("btySealed")}</span><strong>{counts.seal}</strong></li>
        <li><span>{v4("btyPinned")}</span><strong>{counts.pinned}</strong></li>
        <li><span>{v4("btyPeak")}</span><strong>{counts.peak}</strong></li>
        <li><span>{v4("btyQuiet")}</span><strong>{counts.quiet}</strong></li>
        <li><span>{v4("btySoon")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("btyOverdue")}</span><strong>{counts.overdue}</strong></li>
      </ol>
      <ol className="c4-bty-bars" aria-label={v4("btyBars")}>
        {bars.map((bar) => (
          <li key={bar.cellar} data-cellar={bar.cellar}>
            <span>{cellarLabel(v4, bar.cellar)}</span>
            <i style={{ width: `${Math.round((bar.count / ribbon) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </li>
        ))}
      </ol>
      <ol className="c4-bty-time" aria-label={v4("btyTimeline")}>
        {timeline.map((lane) => (
          <li key={lane.rank}><span>{lane.rank}</span><strong>{lane.titles.join(" · ")}</strong></li>
        ))}
      </ol>
      <div className="c4-bty-tools">
        <label className="c4-lab">
          <span>{v4("btyDesk")}</span>
          <select className="c4-select" aria-label={v4("btyDesk")} value={desk} onChange={(event) => setDesk(event.target.value)}>
            {BUTTERY_CELLARS.map((item) => <option key={item} value={item}>{cellarLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("btySearch")}</span>
          <input ref={searchRef} className="c4-field c4-bty-search" aria-label={v4("btySearch")} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("btySearch")} />
        </label>
        {(["open", "pause", "seal"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("btyOpen") : item === "pause" ? v4("btyPause") : v4("btySealed")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("btyHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((value) => !value)}>{v4("btyPeak")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((value) => !value)}>{v4("btyQuiet")}</button>
        <button type="button" className="c4-chip" data-on={sort === "steward" ? "1" : "0"} onClick={() => setSort((value) => value === "cellar" ? "steward" : "cellar")}>{sort === "steward" ? v4("btySortSteward") : v4("btySortCellar")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "roomy" ? "close" : "roomy")}>{density === "roomy" ? v4("btyRoomy") : v4("btyClose")}</button>
        <button type="button" className="c4-chip" onClick={() => setBoard((value) => value === "hall" ? "index" : "hall")}>{board === "hall" ? v4("btyHall") : v4("btyIndex")}</button>
      </div>
      <div className="c4-bty-tools">
        <select className="c4-select" aria-label={v4("btySteward")} value={stewardFilter} onChange={(event) => setStewardFilter(event.target.value)}>
          <option value="all">{v4("btyAll")}</option>
          {stewards.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("btyGlass")} value={glassFilter} onChange={(event) => setGlassFilter(event.target.value)}>
          <option value="all">{v4("btyAll")}</option>
          {GLASSES.map((item) => <option key={item} value={item}>{glassLabel(v4, item.toUpperCase())}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("btyPour")} value={pourFilter} onChange={(event) => setPourFilter(event.target.value)}>
          <option value="all">{v4("btyAll")}</option>
          {POURS.map((item) => <option key={item} value={item}>{pourLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("btyCellar")} value={cellarFilter} onChange={(event) => setCellarFilter(event.target.value)}>
          <option value="all">{v4("btyAll")}</option>
          <option value="peak">{v4("btyPeakCellar")}</option>
          <option value="quiet">{v4("btyQuietCellar")}</option>
          {BUTTERY_CELLARS.map((item) => <option key={item} value={item}>{cellarLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("btyWait")} value={waitFilter} onChange={(event) => setWaitFilter(event.target.value)}>
          <option value="all">{v4("btyAll")}</option>
          {WAITS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("btyRank")} value={rankFilter} onChange={(event) => setRankFilter(event.target.value)}>
          <option value="all">{v4("btyAll")}</option>
          {RANKS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      <form className="c4-bty-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addButtery(cards, { id: `bty-${Date.now()}`, title, note, steward, cellar, glass, pour, wait: waitMin, rank, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <label className="c4-lab"><span>{v4("btyTitleField")}</span><input className="c4-field" aria-label={v4("btyTitleField")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("btyNote")}</span><input className="c4-field" aria-label={v4("btyNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <p className="c4-bty-meta">{v4("btyNoteOptional")}</p>
        <label className="c4-lab"><span>{v4("btySteward")}</span><input className="c4-field" aria-label={v4("btySteward")} value={steward} disabled={viewer} onChange={(event) => setSteward(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("btyCellar")}</span>
          <select className="c4-select" aria-label={v4("btyCellar")} value={cellar} disabled={viewer} onChange={(event) => setCellar(event.target.value)}>
            <option value="">{v4("btyBlank")}</option>
            {BUTTERY_CELLARS.map((item) => <option key={item} value={item}>{cellarLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("btyGlass")}</span>
          <select className="c4-select" aria-label={v4("btyGlass")} value={glass} disabled={viewer} onChange={(event) => setGlass(event.target.value)}>
            <option value="">{v4("btyBlankGlass")}</option>
            {GLASSES.map((item) => <option key={item} value={item}>{glassLabel(v4, item.toUpperCase())}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("btyPour")}</span>
          <select className="c4-select" aria-label={v4("btyPour")} value={pour} disabled={viewer} onChange={(event) => setPour(event.target.value)}>
            <option value="">{v4("btyBlankPour")}</option>
            {POURS.map((item) => <option key={item} value={item}>{pourLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("btyWait")}</span>
          <select className="c4-select" aria-label={v4("btyWait")} value={waitMin} disabled={viewer} onChange={(event) => setWaitMin(event.target.value)}>
            <option value="">{v4("btyBlankWait")}</option>
            {WAITS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("btyRank")}</span>
          <select className="c4-select" aria-label={v4("btyRank")} value={rank} disabled={viewer} onChange={(event) => setRank(event.target.value)}>
            {RANKS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("btyTags")}</span><input className="c4-field" aria-label={v4("btyTags")} value={tags} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("btyAdd")}</button>
      </form>
      <form className="c4-bty-tools" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addButteryView(views, { id: `view-${Date.now()}`, name: viewName, tray, query, steward: stewardFilter, glass: glassFilter, pour: pourFilter, cellar: cellarFilter, wait: waitFilter, rank: rankFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("btyViewName")}</span><input className="c4-field" aria-label={v4("btyViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("btySaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-bty-view">
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("btyApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropButteryView(views, view.id))}>{v4("btyDropView")}</button>
          </span>
        ))}
      </form>
      {picked.length > 0 && (
        <div className="c4-bty-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkButteryPin(cards, picked))}>{v4("btyBulkPin")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkButterySeal(cards, picked))}>{v4("btyBulkSeal")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkButterySpark(cards, picked))}>{v4("btyBulkSpark")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkButteryAmber(cards, picked))}>{v4("btyBulkAmber")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkButteryTag(cards, picked, "b"))}>{v4("btyBulkTag")}</button>
        </div>
      )}
      <p className="c4-bty-meta">{v4("btySuggest")} {glassLabel(v4, suggested)} · {v4("btyFair")} {fair} · {v4("btyBusy")} {busy || v4("btyBlankSteward")} · {v4("btyNeighbors")} {neighborButteryCount(cards)} · {v4("btyClash")} {clashCellarCount(cards)} · {v4("btyWaitHint")} {suggestButteryWait(cards, clock)} · {v4("btyCellarHint")} {cellarLabel(v4, cellarHint)}</p>
      {(reminders.length > 0 || idling.length > 0) && (
        <p className="c4-bty-meta">{v4("btyDue")} {reminders.map((card) => card.title).join(" · ")} · {v4("btyIdle")} {idling.map((card) => card.title).join(" · ")}</p>
      )}
      {!shown.length && <p className="c4-bty-empty">{v4("btyEmpty")}</p>}
      <ol className={board === "index" ? "c4-bty-index" : "c4-bty-board"} data-density={density}>
        {shown.map((card, index) => {
          const dial = Math.round(((card.wait ?? 0) / 45) * 100);
          return (
            <li key={card.id} className="c4-bty-label" data-on={index === focusAt ? "1" : "0"} data-pinned={card.pinned ? "1" : "0"} data-overdue={overdueButtery(card) ? "1" : "0"} data-peak={peakCellar(card.cellar) ? "1" : "0"} data-quiet={quietCellar(card.cellar) ? "1" : "0"} data-house={houseGlass(card.glass) ? "1" : "0"} data-brisk={briskButtery(card) ? "1" : "0"} data-idle={idleButtery(card) ? "1" : "0"} data-resting={restingButtery(card) ? "1" : "0"} data-late={lateButtery(card, desk) ? "1" : "0"}>
              <div className="c4-bty-monogram" aria-hidden="true">{(card.title[0] || "·").toUpperCase()}</div>
              <label className="c4-bty-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => togglePick(card.id)} /></label>
              <div>
                <input className="c4-field" aria-label={v4("btyEdit")} value={card.title} disabled={viewer} onChange={(event) => store(editButtery(cards, card.id, event.target.value))} />
                <input className="c4-field" aria-label={v4("btyEditNote")} aria-required={false} value={card.note} disabled={viewer} onChange={(event) => store(editButteryNote(cards, card.id, event.target.value))} />
                <p className="c4-bty-meta">{card.steward || v4("btyBlankSteward")} · {cellarLabel(v4, card.cellar)} · {glassLabel(v4, card.glass)} · {pourLabel(v4, card.pour)} · {card.wait ?? v4("btyBlankWait")} · {v4("btyRank")} {card.rank} · {card.tags.join(" ") || v4("btyTags")}</p>
                <p className="c4-bty-dial" aria-label={v4("btyWait")} style={{ background: `conic-gradient(#c6a15b ${dial}%, #efe6d6 ${dial}% 100%)` }} />
                <p className="c4-bty-meta">{cellarLabel(v4, desk)} · {AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : v4("btyAuditSave")}</p>
                <div className="c4-bty-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setButteryPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("btyUnpin") : v4("btyPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer || card.sealed} onClick={() => store(setButteryPause(cards, card.id, !card.paused))}>{card.paused ? v4("btyResume") : v4("btyPause")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setButterySeal(cards, card.id, !card.sealed))}>{card.sealed ? v4("btyOpenAgain") : v4("btySealed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setButteryStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("btyUnstar") : v4("btyStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cyclePour(cards, card.id))}>{v4("btyTempo")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lengthenButtery(cards, card.id))}>{v4("btyLengthen")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(shortenButtery(cards, card.id))}>{v4("btyShorten")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseButtery(cards, card.id))}>{v4("btyRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerButtery(cards, card.id))}>{v4("btyLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setButteryGlass(cards, card.id, card.glass === "AMBER" ? "flint" : "amber"))}>{v4("btyGlass")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addButteryTag(cards, card.id, "c"))}>{v4("btyTags")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(butteryCopy(card)); setCopied(card.id); }}>{copied === card.id ? v4("btyCopied") : v4("btyCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <button type="button" className="c4-btn" onClick={() => download("buttery-slips.csv", butteryCsv(shown, desk))}>{v4("btyCsv")}</button>
    </section>
  );
}

export function ProvenancePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: TraderRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [shape, setShape] = useState<SourceShape>("all");
  const [review, setReview] = useState<SourceReview>("all");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<SourceRow[]>(() => (queue.data?.users || []).map((row, index) => ({
    id: row.id ? `trader-${row.id}` : `trader-${index}`,
    label: textField(row.name),
    note: { leadInvalidSource: textField(row.leadInvalidSource) } satisfies SourceValue,
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
    const present = presentSourceLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenSources(readJson(PRV_KEY, []), present);
    const nextReviewed = readReviewedSources(readJson(PRV_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(PRV_KEY, nextHidden);
    writeJson(PRV_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentSourceLanes(rows);
  const lanes = visibleSourceLanes(present, hidden, showHidden);
  const shown = visibleSources(rows, lane, hue, query, review, reviewed, shape).filter((row) => {
    const token = sourceLane(row.note);
    if (!token) return true;
    return showHidden || !hidden.includes(token);
  });
  const focusAt = shown.length ? focus % shown.length : 0;
  const bars = sourceLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingSource(rows);
  const leadHue = leadingSourceHue(rows);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveButteryFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveButteryFocus(index, shown.length, -1));
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
    writeJson(PRV_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(PRV_REVIEW_KEY, next);
  }
  return (
    <section className="c4-prv" aria-label={v4("prvTitle")} data-plates="1" data-traders={rows.length} data-role={role}>
      <header className="c4-prv-mast">
        <p className="c4-prv-seal" data-logo="mono">{v4("prvLogo")}</p>
        <div>
          <p className="c4-prv-kicker">{v4("prvSub")}</p>
          <h2 className="c4-title">{v4("prvTitle")}</h2>
        </div>
      </header>
      <ol className="c4-prv-index" aria-label={v4("prvTitle")}>
        <li data-tone="gold">{v4("prvChampagne")}</li>
        <li data-tone="ink">{v4("prvGraphite")}</li>
        <li data-tone="ivory">{v4("prvIvory")}</li>
      </ol>
      <p className="c4-prv-links">
        <Link href={crmv4Href(base, "bty")}>{v4("prvCards")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("btyCustomers")}</Link>
        <Link href={crmv4Href(base, "support")}>{v4("btySupport")}</Link>
      </p>
      <p className="c4-prv-hint">{v4("prvHint")}</p>
      {viewer && <p className="c4-prv-note">{v4("prvViewer")}</p>}
      {queue.loading && <p className="c4-prv-meta">{v4("prvEmpty")}</p>}
      {queue.error && <p className="c4-prv-meta">{queue.error}</p>}
      <ul className="c4-prv-kpis" aria-label={v4("prvRules")}>
        <li><span>{v4("prvLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("prvUnmarked")}</strong></li>
        <li><span>{v4("prvToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("prvUnmarked")}</strong></li>
        <li><span>{v4("prvShared")}</span><strong>{sharedSourceCount(rows)}</strong></li>
        <li><span>{v4("prvShare")}</span><strong>{sourceShare(laneSourceCount(rows, "hand"), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("prvKnown")}</span><strong>{rows.filter((row) => sourceKnown(row.note)).length}</strong></li>
        <li><span>{v4("prvTwin")}</span><strong>{rows.filter((row) => sourceTwin(row.note)).length}</strong></li>
        <li><span>{v4("prvSlash")}</span><strong>{rows.filter((row) => sourceSlash(row.note)).length}</strong></li>
        <li><span>{v4("prvEcho")}</span><strong>{rows.filter((row) => sourceEcho(row.note)).length}</strong></li>
      </ul>
      <div className="c4-prv-chart" aria-label={v4("prvRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-prv-bar" data-on={lane === bar.lane ? "1" : "0"} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
            <span>{laneLabel(v4, bar.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-prv-tools">
        <input ref={searchRef} className="c4-field c4-prv-search" aria-label={v4("prvSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("prvSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("prvAll") : hueLabel(v4, item)}</button>
        ))}
        {(["all", "hand", "clock", "mark", "join", "wide", "notch", "leap", "slash", "twin", "known", "echo"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>
            {item === "all" ? v4("prvShapeAll") : item === "wide" ? v4("prvShapeWide") : item === "notch" ? v4("prvShapeNotch") : item === "leap" ? v4("prvShapeLeap") : item === "slash" ? v4("prvShapeSlash") : item === "twin" ? v4("prvShapeTwin") : item === "known" ? v4("prvShapeKnown") : item === "echo" ? v4("prvShapeEcho") : laneLabel(v4, item)}
          </button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("prvAll") : item === "reviewed" ? v4("prvReviewed") : v4("prvUnreviewed")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("prvShow")}</button>
      </div>
      <ul className="c4-prv-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleSource(hidden, item))}>{hidden.includes(item) ? v4("prvShow") : v4("prvHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-prv-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkSourceReview(reviewed, picked, true))}>{v4("prvBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkSourceReview(reviewed, picked, false))}>{v4("prvBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-prv-empty">{v4("prvEmpty")}</p>}
      <ol className="c4-prv-board">
        {shown.map((row, index) => {
          const seen = reviewed.includes(row.id);
          return (
            <li key={row.id} className="c4-prv-card" data-on={index === focusAt ? "1" : "0"} data-lane={sourceLane(row.note)} data-hue={sourceHue(row.note)} data-reviewed={seen ? "1" : "0"} data-known={sourceKnown(row.note) ? "1" : "0"}>
              <p className="c4-prv-stamp">{sourceStamp(row.note) || "·"}</p>
              <label className="c4-prv-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label || row.id} onChange={() => setPicked((current) => current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id])} /></label>
              <div>
                <strong>{row.label || v4("prvUnmarked")}</strong>
                <p className="c4-prv-meta">{laneLabel(v4, sourceLane(row.note))} · {hueLabel(v4, sourceHue(row.note))} · {v4("prvStep")} {sourceStep(row.note)}{sourceCap(row.note) ? ` · ${v4("prvCap")}` : ""}{sourceTail(row.note) ? ` · ${v4("prvTail")}` : ""}{sourceWide(row.note) ? ` · ${v4("prvWide")}` : ""}{sourceNotch(row.note) ? ` · ${v4("prvNotch")}` : ""}{sourceLeap(row.note) ? ` · ${v4("prvLeap")}` : ""}</p>
                <div className="c4-prv-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleSourceReview(reviewed, row.id))}>{seen ? v4("prvReviewed") : v4("prvReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(sourceCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("prvCopied") : v4("prvCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="c4-prv-tools">
        <button type="button" className="c4-btn" onClick={() => download("provenance-lanes.csv", sourceLanesCsv(rows))}>{v4("prvCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("provenance-rows.csv", sourceRowsCsv(shown, reviewed))}>{v4("prvRowCsv")}</button>
      </div>
    </section>
  );
}
