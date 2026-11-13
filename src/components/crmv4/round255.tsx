"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  BKC_KEY,
  BKC_REVIEW_KEY,
  WARRANT_HOURS,
  WNS_DENSITY_KEY,
  WNS_KEY,
  WNS_VIEW_KEY,
  addWarrant,
  addWarrantTag,
  addWarrantView,
  bulkWarrantBrisk,
  bulkWarrantFile,
  bulkWarrantPin,
  bulkWarrantGilt,
  bulkWarrantTag,
  bulkCrestReview,
  busiestClerk,
  clashHourCount,
  cycleTempo,
  dropWarrantView,
  editWarrant,
  editWarrantNote,
  fairClerk,
  houseInk,
  hueCrestCount,
  idleWarrant,
  idleWarrants,
  laneCrestCount,
  lateWarrant,
  leadingCrest,
  leadingCrestHue,
  lengthenFocusedWarrant,
  lengthenHour,
  lowerFocusedWarrant,
  lowerWarrantRank,
  moveWarrantFocus,
  neighborWarrantCount,
  overdueWarrant,
  paceFocusedWarrant,
  warrantBars,
  warrantCopy,
  warrantCounts,
  warrantClerks,
  warrantCsv,
  warrantDensity,
  warrantShare,
  warrantTimeline,
  peakHour,
  pinFocusedWarrant,
  presentCrestLanes,
  quietHour,
  raiseFocusedWarrant,
  raiseWarrantRank,
  readHiddenCrests,
  readWarrantViews,
  readWarrants,
  readReviewedCrests,
  reminderWarrants,
  restingWarrant,
  crestCopy,
  crestEcho,
  crestHue,
  crestLane,
  crestLanes,
  crestLanesCsv,
  crestNotch,
  crestRowsCsv,
  crestSpoken,
  crestShare,
  crestStamp,
  crestState,
  crestStep,
  crestWide,
  rushWarrant,
  setWarrantInk,
  setWarrantFile,
  setWarrantPin,
  setWarrantStar,
  setWarrantWait,
  sharedCrestCount,
  shortenFocusedWarrant,
  shortenHour,
  sortWarrants,
  starFocusedWarrant,
  suggestInk,
  suggestHour,
  tagFocusedWarrant,
  toggleCrest,
  toggleCrestReview,
  visibleWarrants,
  visibleCrestLanes,
  visibleCrests,
  waitFocusedWarrant,
  type WarrantDensity,
  type WarrantSlip,
  type WarrantSort,
  type WarrantTray,
  type WarrantView,
  type CrestReview,
  type CrestRow,
  type CrestShape,
  type CrestValue,
} from "@/lib/crmv4/round255";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const CLOTHS = ["soot", "oak", "gilt"] as const;
const PACES = ["still", "steady", "brisk"] as const;
const SPANS = ["15", "30", "60"] as const;
const RANKS = ["1", "3", "5", "7"] as const;

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "wnsAuditSave",
  edit: "wnsAuditEdit",
  note: "wnsAuditNote",
  pace: "wnsAuditTempo",
  pin: "wnsAuditPin",
  unpin: "wnsAuditUnpin",
  hold: "wnsAuditWait",
  resume: "wnsAuditResume",
  shelve: "wnsAuditFile",
  open: "wnsAuditOpen",
  cloth: "wnsAuditInk",
  tag: "wnsAuditTag",
  rank: "wnsAuditRank",
  span: "wnsAuditSpan",
  short: "wnsAuditShort",
  flag: "wnsAuditStar",
};

const WATCH_KEY: Record<string, CrmV4CopyKey> = {
  dawn: "wnsDawn",
  forenoon: "wnsForenoon",
  noon: "wnsNoon",
  afternoon: "wnsAfternoon",
  vespers: "wnsVespers",
  night: "wnsNight",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  house: "bkcHouse",
  phrase: "bkcPhrase",
  pair: "bkcPair",
  mark: "bkcMark",
  split: "bkcSplit",
  code: "bkcCode",
  essay: "bkcEssay",
  cipher: "bkcCipher",
  plain: "bkcPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "bkcIvory",
  graphite: "bkcGraphite",
  champagne: "bkcChampagne",
  ink: "bkcInk",
  vellum: "bkcVellum",
  ash: "bkcAsh",
};

type TraderRow = {
  id?: string;
  name?: string | null;
  brokerName?: string | null;
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

function watchLabel(v4: V4, watch: string): string {
  const key = WATCH_KEY[watch];
  return key ? v4(key) : v4("wnsBlank");
}

function clothLabel(v4: V4, cloth: string): string {
  if (cloth === "SOOT" || cloth === "soot") return v4("wnsSoot");
  if (cloth === "OAK" || cloth === "oak") return v4("wnsOak");
  if (cloth === "GILT" || cloth === "gilt") return v4("wnsGilt");
  return v4("wnsBlankInk");
}

function paceLabel(v4: V4, pace: string): string {
  if (pace === "still") return v4("wnsStill");
  if (pace === "steady") return v4("wnsSteady");
  if (pace === "brisk") return v4("wnsBrisk");
  return v4("wnsBlankTempo");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("bkcUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("bkcUnmarked");
}

export function WarrantSlips({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<WarrantSlip[]>([]);
  const [views, setViews] = useState<WarrantView[]>([]);
  const [density, setDensity] = useState<WarrantDensity>("airy");
  const [sort, setSort] = useState<WarrantSort>("watch");
  const [tray, setTray] = useState<WarrantTray>("open");
  const [query, setQuery] = useState("");
  const [courierFilter, setClerkFilter] = useState("all");
  const [clothFilter, setInkFilter] = useState("all");
  const [paceFilter, setTempoFilter] = useState("all");
  const [watchFilter, setHourFilter] = useState("all");
  const [spanFilter, setSpanFilter] = useState("all");
  const [rankFilter, setRankFilter] = useState("all");
  const [houseOnly, setHouseOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [desk, setDesk] = useState("forenoon");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [courier, setClerk] = useState("");
  const [watch, setHour] = useState("");
  const [cloth, setInk] = useState("");
  const [pace, setTempo] = useState("");
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
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    setCards(readWarrants(readJson(WNS_KEY, [])));
    setViews(readWarrantViews(readJson(WNS_VIEW_KEY, [])));
    setDensity(warrantDensity(readJson(WNS_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  const shown = sortWarrants(visibleWarrants(cards, tray, query, courierFilter, clothFilter, paceFilter, watchFilter, spanFilter, rankFilter, houseOnly, peakOnly, quietOnly), sort);
  const focusAt = shown.length ? focus % shown.length : 0;
  const counts = warrantCounts(cards, shown, desk);
  const timeline = warrantTimeline(cards);
  const reminders = reminderWarrants(cards);
  const idling = idleWarrants(cards);
  const couriers = warrantClerks(cards);
  const bars = warrantBars(cards);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = shown.map((card) => card.id);
  const busy = busiestClerk(cards);
  const hour = new Date().getUTCHours();
  function store(next: WarrantSlip[]) {
    const saved = readWarrants(next);
    setCards(saved);
    writeJson(WNS_KEY, saved);
  }
  function storeViews(next: WarrantView[]) {
    const saved = readWarrantViews(next);
    setViews(saved);
    writeJson(WNS_VIEW_KEY, saved);
  }
  function storeDensity(next: WarrantDensity) {
    setDensity(next);
    writeJson(WNS_DENSITY_KEY, next);
  }
  function togglePick(id: string) {
    setPicked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }
  function applyView(view: WarrantView) {
    setTray(view.tray);
    setQuery(view.query);
    setClerkFilter(view.courier || "all");
    setInkFilter(view.cloth);
    setTempoFilter(view.pace);
    setHourFilter(view.watch);
    setSpanFilter(view.span);
    setRankFilter(view.rank);
  }
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setClerk("");
        setHour("");
        setInk("");
        setTempo("");
        setSpanMin("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveWarrantFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveWarrantFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        if (!viewer) store(waitFocusedWarrant(cards, ids, focusAt));
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        if (!viewer) store(pinFocusedWarrant(cards, ids, focusAt));
        return;
      }
      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        if (!viewer) store(paceFocusedWarrant(cards, ids, focusAt));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        if (!viewer) store(lengthenFocusedWarrant(cards, ids, focusAt));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        if (!viewer) store(shortenFocusedWarrant(cards, ids, focusAt));
        return;
      }
      if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        if (!viewer) store(tagFocusedWarrant(cards, ids, focusAt, "e"));
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        if (!viewer) store(starFocusedWarrant(cards, ids, focusAt));
        return;
      }
      if (event.key === "b" || event.key === "B") {
        event.preventDefault();
        if (!viewer) store(raiseFocusedWarrant(cards, ids, focusAt));
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        if (!viewer) store(lowerFocusedWarrant(cards, ids, focusAt));
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
    <section className="c4-wns" aria-label={v4("wnsTitle")} data-cards="1" data-desk="warrant" data-role={role} data-density={density} data-board={board}>
      <header className="c4-wns-mast">
        <p className="c4-wns-seal" data-logo="mono">{v4("wnsLogo")}</p>
        <div>
          <p className="c4-wns-kicker">{v4("wnsSub")}</p>
          <h2 className="c4-title">{v4("wnsTitle")}</h2>
        </div>
        <ol className="c4-wns-index" aria-label={v4("wnsTitle")}>
          <li data-tone="gold">{v4("wnsChampagne")}</li>
          <li data-tone="ink">{v4("wnsGraphite")}</li>
          <li data-tone="ivory">{v4("wnsIvory")}</li>
        </ol>
      </header>
      <p className="c4-wns-links">
        <Link href={crmv4Href(base, "bkc")}>{v4("wnsCrests")}</Link>
        <Link href={crmv4Href(base, "kycglance")}>{v4("wnsGlance")}</Link>
        <Link href={crmv4Href(base, "roster")}>{v4("wnsRoster")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("wnsCustomers")}</Link>
      </p>
      {viewer && <p className="c4-wns-note">{v4("wnsViewer")}</p>}
      <p className="c4-wns-lead">{v4("wnsKeys")}</p>
      <p className="c4-wns-hint">{v4("wnsHint")}</p>
      <ul className="c4-wns-kpis" aria-label={v4("wnsChart")}>
        <li><span>{v4("wnsOpen")}</span><strong>{counts.open}</strong></li>
        <li><span>{v4("wnsHeld")}</span><strong>{counts.held}</strong></li>
        <li><span>{v4("wnsFile")}</span><strong>{counts.shelved}</strong></li>
        <li><span>{v4("wnsPinned")}</span><strong>{counts.pinned}</strong></li>
        <li><span>{v4("wnsOverdue")}</span><strong>{counts.overdue}</strong></li>
        <li><span>{v4("wnsPeak")}</span><strong>{counts.peak}</strong></li>
        <li><span>{v4("wnsQuiet")}</span><strong>{counts.quiet}</strong></li>
        <li><span>{v4("wnsHouse")}</span><strong>{warrantShare(counts.house, Math.max(1, counts.open))}%</strong></li>
        <li><span>{v4("wnsIdle")}</span><strong>{counts.idle}</strong></li>
        <li><span>{v4("wnsRush")}</span><strong>{counts.rush}</strong></li>
        <li><span>{v4("wnsResting")}</span><strong>{counts.resting}</strong></li>
        <li><span>{v4("wnsSoon")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("wnsMatched")}</span><strong>{counts.matched}</strong></li>
        <li><span>{v4("wnsClash")}</span><strong>{clashHourCount(cards) || v4("wnsClashNone")}</strong></li>
        <li><span>{v4("wnsNeighbor")}</span><strong>{neighborWarrantCount(cards)}</strong></li>
        <li><span>{v4("wnsBusiest")}</span><strong>{busy || v4("wnsBusiestNone")}</strong></li>
      </ul>
      <div className="c4-wns-bars" aria-label={v4("wnsChart")}>
        {bars.map((bar) => (
          <div key={bar.watch} className="c4-wns-bar" data-watch={bar.watch}>
            <span>{watchLabel(v4, bar.watch)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      {board === "index" && (
        <ol className="c4-wns-time" aria-label={v4("wnsTimeline")}>
          {timeline.map((lane) => (
            <li key={lane.rank}><span>{v4("wnsRank")} {lane.rank}</span><strong>{lane.titles.join(" · ")}</strong></li>
          ))}
          {!timeline.length && <li>{v4("wnsEmpty")}</li>}
        </ol>
      )}
      <form className="c4-wns-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addWarrant(cards, {
          id: `wns-${Date.now().toString(36)}`,
          title,
          note,
          courier,
          watch,
          cloth,
          pace,
          span: spanMin,
          rank,
          tags,
        });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
        titleRef.current?.focus();
      }}>
        <label className="c4-lab"><span>{v4("wnsTitleField")}</span><input ref={titleRef} className="c4-field" aria-label={v4("wnsTitleField")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("wnsNote")}</span><input className="c4-field" aria-label={v4("wnsNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("wnsClerk")}</span><input className="c4-field" aria-label={v4("wnsClerk")} value={courier} disabled={viewer} onChange={(event) => setClerk(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("wnsHour")}</span>
          <select className="c4-select" aria-label={v4("wnsHour")} value={watch} disabled={viewer} onChange={(event) => setHour(event.target.value)}>
            <option value="">{v4("wnsBlank")}</option>
            {WARRANT_HOURS.map((item) => <option key={item} value={item}>{watchLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("wnsInk")}</span>
          <select className="c4-select" aria-label={v4("wnsInk")} value={cloth} disabled={viewer} onChange={(event) => setInk(event.target.value)}>
            <option value="">{v4("wnsBlankInk")}</option>
            {CLOTHS.map((item) => <option key={item} value={item}>{clothLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("wnsTempo")}</span>
          <select className="c4-select" aria-label={v4("wnsTempo")} value={pace} disabled={viewer} onChange={(event) => setTempo(event.target.value)}>
            <option value="">{v4("wnsBlankTempo")}</option>
            {PACES.map((item) => <option key={item} value={item}>{paceLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("wnsSpan")}</span>
          <select className="c4-select" aria-label={v4("wnsSpan")} value={spanMin} disabled={viewer} onChange={(event) => setSpanMin(event.target.value)}>
            <option value="">{v4("wnsBlankSpan")}</option>
            {SPANS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("wnsRank")}</span>
          <select className="c4-select" aria-label={v4("wnsRank")} value={rank} disabled={viewer} onChange={(event) => setRank(event.target.value)}>
            {RANKS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("wnsTags")}</span><input className="c4-field" aria-label={v4("wnsTags")} value={tags} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button className="c4-btn" type="submit" disabled={viewer}>{v4("wnsAdd")}</button>
        <button className="c4-btn" type="button" disabled={viewer} onClick={() => setInk(suggestInk(cards).toLowerCase())}>{v4("wnsSuggestInk")} {clothLabel(v4, suggestInk(cards))}</button>
        <button className="c4-btn" type="button" disabled={viewer} onClick={() => setSpanMin(String(suggestHour(cards, hour)))}>{v4("wnsSuggestSpan")} {suggestHour(cards, hour)}</button>
        <button className="c4-btn" type="button" disabled={viewer} onClick={() => setClerk(fairClerk(cards, couriers.join(", ") || courier))}>{v4("wnsFair")}</button>
      </form>
      <div className="c4-wns-tools">
        <label className="c4-lab"><span>{v4("wnsSearch")}</span><input ref={searchRef} className="c4-field c4-wns-search" aria-label={v4("wnsSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("wnsDesk")}</span>
          <select className="c4-select" aria-label={v4("wnsDesk")} value={desk} onChange={(event) => setDesk(event.target.value)}>
            {WARRANT_HOURS.map((item) => <option key={item} value={item}>{watchLabel(v4, item)}</option>)}
          </select>
        </label>
        <button type="button" className="c4-chip" data-on={tray === "open" ? "1" : "0"} onClick={() => setTray("open")}>{v4("wnsOpen")}</button>
        <button type="button" className="c4-chip" data-on={tray === "held" ? "1" : "0"} onClick={() => setTray("held")}>{v4("wnsHeld")}</button>
        <button type="button" className="c4-chip" data-on={tray === "shelved" ? "1" : "0"} onClick={() => setTray("shelved")}>{v4("wnsFile")}</button>
        <button type="button" className="c4-chip" data-on={board === "hall" ? "1" : "0"} onClick={() => setBoard("hall")}>{v4("wnsHall")}</button>
        <button type="button" className="c4-chip" data-on={board === "index" ? "1" : "0"} onClick={() => setBoard("index")}>{v4("wnsIndex")}</button>
        <button type="button" className="c4-chip" data-on={density === "airy" ? "1" : "0"} onClick={() => storeDensity("airy")}>{v4("wnsAiry")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity("tight")}>{v4("wnsTight")}</button>
        <button type="button" className="c4-chip" data-on={sort === "watch" ? "1" : "0"} onClick={() => setSort("watch")}>{v4("wnsSortHour")}</button>
        <button type="button" className="c4-chip" data-on={sort === "courier" ? "1" : "0"} onClick={() => setSort("courier")}>{v4("wnsSortClerk")}</button>
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("wnsHouse")}</button>
        <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((value) => !value)}>{v4("wnsPeak")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((value) => !value)}>{v4("wnsQuiet")}</button>
        <label className="c4-lab"><span>{v4("wnsClerk")}</span>
          <select className="c4-select" aria-label={v4("wnsFilters")} value={courierFilter} onChange={(event) => setClerkFilter(event.target.value)}>
            <option value="all">{v4("wnsAll")}</option>
            {couriers.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("wnsHour")}</span>
          <select className="c4-select" aria-label={v4("wnsHour")} value={watchFilter} onChange={(event) => setHourFilter(event.target.value)}>
            <option value="all">{v4("wnsAll")}</option>
            <option value="peak">{v4("wnsPeak")}</option>
            <option value="quiet">{v4("wnsQuiet")}</option>
            {WARRANT_HOURS.map((item) => <option key={item} value={item}>{watchLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("wnsInk")}</span>
          <select className="c4-select" aria-label={v4("wnsInk")} value={clothFilter} onChange={(event) => setInkFilter(event.target.value)}>
            <option value="all">{v4("wnsAll")}</option>
            {CLOTHS.map((item) => <option key={item} value={item}>{clothLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("wnsTempo")}</span>
          <select className="c4-select" aria-label={v4("wnsTempo")} value={paceFilter} onChange={(event) => setTempoFilter(event.target.value)}>
            <option value="all">{v4("wnsAll")}</option>
            {PACES.map((item) => <option key={item} value={item}>{paceLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("wnsSpan")}</span>
          <select className="c4-select" aria-label={v4("wnsSpan")} value={spanFilter} onChange={(event) => setSpanFilter(event.target.value)}>
            <option value="all">{v4("wnsAll")}</option>
            {SPANS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("wnsRank")}</span>
          <select className="c4-select" aria-label={v4("wnsRank")} value={rankFilter} onChange={(event) => setRankFilter(event.target.value)}>
            <option value="all">{v4("wnsAll")}</option>
            {RANKS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <button type="button" className="c4-btn" onClick={() => download("warrant-slips.csv", warrantCsv(shown, desk))}>{v4("wnsCsv")}</button>
      </div>
      <form className="c4-wns-views" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addWarrantView(views, { id: `view-${Date.now().toString(36)}`, name: viewName, tray, query, courier: courierFilter, cloth: clothFilter, pace: paceFilter, watch: watchFilter, span: spanFilter, rank: rankFilter });
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("wnsViewName")}</span><input className="c4-field" aria-label={v4("wnsViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} /></label>
        <button className="c4-btn" type="submit" disabled={viewer}>{v4("wnsSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-wns-view">
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("wnsApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropWarrantView(views, view.id))}>{v4("wnsDropView")}</button>
          </span>
        ))}
      </form>
      {picked.length > 0 && (
        <div className="c4-wns-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkWarrantPin(cards, picked))}>{v4("wnsBulkPin")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkWarrantFile(cards, picked))}>{v4("wnsBulkFile")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkWarrantBrisk(cards, picked))}>{v4("wnsBulkBrisk")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkWarrantGilt(cards, picked))}>{v4("wnsBulkGilt")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkWarrantTag(cards, picked, "f"))}>{v4("wnsBulkTag")}</button>
        </div>
      )}
      {(reminders.length > 0 || idling.length > 0) && (
        <p className="c4-wns-meta">{v4("wnsDue")} {reminders.map((card) => card.title).join(" · ")} · {v4("wnsIdle")} {idling.map((card) => card.title).join(" · ")}</p>
      )}
      {!shown.length && <p className="c4-wns-empty">{v4("wnsEmpty")}</p>}
      <ol className="c4-wns-board" data-density={density}>
        {shown.map((card, index) => (
          <li key={card.id} className="c4-wns-card" data-on={index === focusAt ? "1" : "0"} data-pinned={card.pinned ? "1" : "0"} data-overdue={overdueWarrant(card) ? "1" : "0"} data-peak={peakHour(card.watch) ? "1" : "0"} data-quiet={quietHour(card.watch) ? "1" : "0"} data-house={houseInk(card.cloth) ? "1" : "0"} data-rush={rushWarrant(card) ? "1" : "0"} data-idle={idleWarrant(card) ? "1" : "0"} data-resting={restingWarrant(card) ? "1" : "0"} data-late={lateWarrant(card, desk) ? "1" : "0"}>
            <label className="c4-wns-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => togglePick(card.id)} /></label>
            <div>
              <input className="c4-field" aria-label={v4("wnsEdit")} value={card.title} disabled={viewer} onChange={(event) => store(editWarrant(cards, card.id, event.target.value))} />
              <input className="c4-field" aria-label={v4("wnsEditNote")} aria-required={false} value={card.note} disabled={viewer} onChange={(event) => store(editWarrantNote(cards, card.id, event.target.value))} />
              <p className="c4-wns-meta">{card.courier || v4("wnsBlankClerk")} · {watchLabel(v4, card.watch)} · {clothLabel(v4, card.cloth)} · {paceLabel(v4, card.pace)} · {card.span ?? v4("wnsBlankSpan")} · {v4("wnsRank")} {card.rank} · {card.tags.join(" ") || v4("wnsTags")}</p>
              <p className="c4-wns-sla" aria-label={v4("wnsSpan")}><i style={{ width: `${Math.round(((card.span ?? 0) / 80) * 100)}%` }} /></p>
              <p className="c4-wns-meta">{watchLabel(v4, desk)} · {AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : v4("wnsAuditSave")}</p>
              <div className="c4-wns-tools">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setWarrantPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("wnsUnpin") : v4("wnsPin")}</button>
                <button type="button" className="c4-btn" disabled={viewer || card.shelved} onClick={() => store(setWarrantWait(cards, card.id, !card.held))}>{card.held ? v4("wnsResume") : v4("wnsWait")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setWarrantFile(cards, card.id, !card.shelved))}>{card.shelved ? v4("wnsOpen") : v4("wnsFile")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setWarrantStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("wnsUnstar") : v4("wnsStar")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleTempo(cards, card.id))}>{v4("wnsTempo")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lengthenHour(cards, card.id))}>{v4("wnsLengthen")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(shortenHour(cards, card.id))}>{v4("wnsShorten")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseWarrantRank(cards, card.id))}>{v4("wnsRaise")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerWarrantRank(cards, card.id))}>{v4("wnsLower")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setWarrantInk(cards, card.id, card.cloth === "GILT" ? "soot" : "gilt"))}>{v4("wnsInk")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addWarrantTag(cards, card.id, "g"))}>{v4("wnsTag")}</button>
                <button type="button" className="c4-btn" onClick={() => { const body = warrantCopy(card); void navigator.clipboard.writeText(body).catch(() => undefined); setCopied(card.id); }}>{copied === card.id ? v4("wnsCopied") : v4("wnsCopy")}</button>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function markNote(row: TraderRow): CrestValue {
  return { brokerName: textField(row.brokerName) };
}

export function BrokerCrests({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: TraderRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [review, setReview] = useState<CrestReview>("all");
  const [shape, setShape] = useState<CrestShape>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [focus, setFocus] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<CrestRow[]>(() => (queue.data?.users || []).map((row, index) => ({
    id: row.id ? `trader-${row.id}` : `trader-${index}`,
    label: textField(row.name),
    note: markNote(row),
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
    const present = presentCrestLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenCrests(readJson(BKC_KEY, []), present);
    const nextReviewed = readReviewedCrests(readJson(BKC_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(BKC_KEY, nextHidden);
    writeJson(BKC_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentCrestLanes(rows);
  const lanes = visibleCrestLanes(present, hidden, showHidden);
  const shown = visibleCrests(rows, lane, hue, query, review, reviewed, shape).filter((row) => {
    const token = crestLane(row.note);
    if (!token) return true;
    return showHidden || !hidden.includes(token);
  });
  const focusAt = shown.length ? focus % shown.length : 0;
  const bars = crestLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingCrest(rows);
  const leadHue = leadingCrestHue(rows);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveWarrantFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveWarrantFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        const row = shown[focusAt];
        if (!row || viewer) return;
        const next = toggleCrestReview(reviewed, row.id);
        setReviewed(next);
        writeJson(BKC_REVIEW_KEY, next);
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
  }, [shown, focusAt, reviewed, viewer]);
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(BKC_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(BKC_REVIEW_KEY, next);
  }
  return (
    <section className="c4-bkc" aria-label={v4("bkcTitle")} data-crests="1" data-traders={rows.length} data-role={role}>
      <header className="c4-bkc-mast">
        <p className="c4-bkc-seal" data-logo="mono">{v4("bkcLogo")}</p>
        <div>
          <p className="c4-bkc-kicker">{v4("bkcSub")}</p>
          <h2 className="c4-title">{v4("bkcTitle")}</h2>
        </div>
        <ol className="c4-bkc-index" aria-label={v4("bkcTitle")}>
          <li data-tone="gold">{v4("bkcChampagne")}</li>
          <li data-tone="ink">{v4("bkcGraphite")}</li>
          <li data-tone="ivory">{v4("bkcIvory")}</li>
        </ol>
      </header>
      <p className="c4-bkc-links">
        <Link href={crmv4Href(base, "wns")}>{v4("bkcCards")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("wnsCustomers")}</Link>
      </p>
      <p className="c4-bkc-hint">{v4("bkcHint")}</p>
      {viewer && <p className="c4-bkc-note">{v4("bkcViewer")}</p>}
      {queue.loading && <p className="c4-bkc-meta">{v4("bkcEmpty")}</p>}
      {queue.error && <p className="c4-bkc-meta">{queue.error}</p>}
      <ul className="c4-bkc-kpis" aria-label={v4("bkcRules")}>
        <li><span>{v4("bkcLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("bkcUnmarked")}</strong></li>
        <li><span>{v4("bkcToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("bkcUnmarked")}</strong></li>
        <li><span>{v4("bkcShared")}</span><strong>{sharedCrestCount(rows)}</strong></li>
        <li><span>{v4("bkcShare")}</span><strong>{crestShare(laneCrestCount(rows, "house"), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("bkcWide")}</span><strong>{rows.filter((row) => crestWide(row.note)).length}</strong></li>
        <li><span>{v4("bkcNotch")}</span><strong>{rows.filter((row) => crestNotch(row.note)).length}</strong></li>
        <li><span>{v4("bkcEcho")}</span><strong>{rows.filter((row) => crestEcho(row.note)).length}</strong></li>
        <li><span>{v4("bkcHouse")}</span><strong>{hueCrestCount(rows, "ivory")}</strong></li>
      </ul>
      <div className="c4-bkc-bars" aria-label={v4("bkcRules")}>
        {bars.map((bar) => (
          <div key={bar.lane} className="c4-bkc-bar">
            <span>{laneLabel(v4, bar.lane)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <div className="c4-bkc-tools">
        <label className="c4-lab"><span>{v4("bkcSearch")}</span><input ref={searchRef} className="c4-field c4-bkc-search" aria-label={v4("bkcSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("bkcCode")}</span>
          <select className="c4-select" aria-label={v4("bkcCode")} value={lane} onChange={(event) => setLane(event.target.value)}>
            <option value="all">{v4("bkcAll")}</option>
            {present.map((item) => <option key={item} value={item}>{laneLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("bkcToneLead")}</span>
          <select className="c4-select" aria-label={v4("bkcToneLead")} value={hue} onChange={(event) => setHue(event.target.value)}>
            <option value="all">{v4("bkcAll")}</option>
            {(["ivory", "graphite", "champagne", "ink", "vellum", "ash"] as const).map((item) => <option key={item} value={item}>{hueLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("bkcShapeAll")}</span>
          <select className="c4-select" aria-label={v4("bkcShapeAll")} value={shape} onChange={(event) => setShape(event.target.value as CrestShape)}>
            <option value="all">{v4("bkcShapeAll")}</option>
            <option value="house">{v4("bkcHouse")}</option>
            <option value="phrase">{v4("bkcPhrase")}</option>
            <option value="pair">{v4("bkcPair")}</option>
            <option value="mark">{v4("bkcMark")}</option>
            <option value="split">{v4("bkcSplit")}</option>
            <option value="code">{v4("bkcCode")}</option>
            <option value="essay">{v4("bkcEssay")}</option>
            <option value="cipher">{v4("bkcCipher")}</option>
            <option value="wide">{v4("bkcShapeWide")}</option>
            <option value="notch">{v4("bkcShapeNotch")}</option>
          </select>
        </label>
        <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} onClick={() => setReview("all")}>{v4("bkcAll")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview("reviewed")}>{v4("bkcReviewed")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview("fresh")}>{v4("bkcUnreviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("bkcShow")}</button>
        <button type="button" className="c4-btn" onClick={() => download("broker-crests.csv", crestLanesCsv(rows))}>{v4("bkcCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("broker-crest-rows.csv", crestRowsCsv(rows, reviewed))}>{v4("bkcRowCsv")}</button>
      </div>
      <div className="c4-bkc-lanes">
        {lanes.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hidden.includes(item) ? "1" : "0"} disabled={viewer} onClick={() => storeHidden(toggleCrest(hidden, item))}>{v4("bkcHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      {picked.length > 0 && (
        <div className="c4-bkc-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkCrestReview(reviewed, picked, true))}>{v4("bkcBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkCrestReview(reviewed, picked, false))}>{v4("bkcBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-bkc-empty">{v4("bkcEmpty")}</p>}
      <ol className="c4-bkc-board">
        {shown.map((row, index) => {
          const state = crestState(row.note);
          return (
            <li key={row.id} className="c4-bkc-card" data-on={index === focusAt ? "1" : "0"} data-state={state} data-lane={crestLane(row.note)} data-hue={crestHue(row.note)} data-reviewed={reviewed.includes(row.id) ? "1" : "0"}>
              <label className="c4-bkc-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label} onChange={() => setPicked((current) => current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id])} /></label>
              <div>
                <strong>{row.label || v4("bkcUnmarked")}</strong>
                <p className="c4-bkc-meta">{crestStamp(row.note) || v4("bkcClear")} · {laneLabel(v4, crestLane(row.note))} · {hueLabel(v4, crestHue(row.note))} · {v4("bkcStep")} {crestStep(row.note)} · {crestSpoken(row.note) ? v4("bkcSpoken") : v4("bkcClear")}</p>
                <div className="c4-bkc-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleCrestReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("bkcReviewed") : v4("bkcReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { const body = crestCopy(row.note); void navigator.clipboard.writeText(body).catch(() => undefined); setCopied(row.id); }}>{copied === row.id ? v4("bkcCopied") : v4("bkcCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
