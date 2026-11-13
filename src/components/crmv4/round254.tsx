"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  LRB_KEY,
  LRB_REVIEW_KEY,
  PARCEL_WATCHES,
  PSL_DENSITY_KEY,
  PSL_KEY,
  PSL_VIEW_KEY,
  addParcel,
  addParcelTag,
  addParcelView,
  bulkParcelCanter,
  bulkParcelFile,
  bulkParcelPin,
  bulkParcelSilk,
  bulkParcelTag,
  bulkRibbonReview,
  busiestCourier,
  clashWatchCount,
  cyclePace,
  dropParcelView,
  editParcel,
  editParcelNote,
  fairCourier,
  houseCloth,
  hueRibbonCount,
  idleParcel,
  idleParcels,
  laneRibbonCount,
  lateParcel,
  leadingRibbon,
  leadingRibbonHue,
  lengthenFocusedParcel,
  lengthenWatch,
  lowerFocusedParcel,
  lowerParcelRank,
  moveParcelFocus,
  neighborParcelCount,
  overdueParcel,
  paceFocusedParcel,
  parcelBars,
  parcelCopy,
  parcelCounts,
  parcelCouriers,
  parcelCsv,
  parcelDensity,
  parcelShare,
  parcelTimeline,
  peakWatch,
  pinFocusedParcel,
  presentRibbonLanes,
  quietWatch,
  raiseFocusedParcel,
  raiseParcelRank,
  readHiddenRibbons,
  readParcelViews,
  readParcels,
  readReviewedRibbons,
  reminderParcels,
  restingParcel,
  ribbonCopy,
  ribbonEcho,
  ribbonHue,
  ribbonLane,
  ribbonLanes,
  ribbonLanesCsv,
  ribbonNotch,
  ribbonRowsCsv,
  ribbonSpoken,
  ribbonShare,
  ribbonStamp,
  ribbonState,
  ribbonStep,
  ribbonWide,
  rushParcel,
  setParcelCloth,
  setParcelFile,
  setParcelPin,
  setParcelStar,
  setParcelWait,
  sharedRibbonCount,
  shortenFocusedParcel,
  shortenWatch,
  sortParcels,
  starFocusedParcel,
  suggestCloth,
  suggestWatch,
  tagFocusedParcel,
  toggleRibbon,
  toggleRibbonReview,
  visibleParcels,
  visibleRibbonLanes,
  visibleRibbons,
  waitFocusedParcel,
  type ParcelDensity,
  type ParcelSlip,
  type ParcelSort,
  type ParcelTray,
  type ParcelView,
  type RibbonReview,
  type RibbonRow,
  type RibbonShape,
  type RibbonValue,
} from "@/lib/crmv4/round254";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const CLOTHS = ["linen", "wool", "silk"] as const;
const PACES = ["walk", "trot", "canter"] as const;
const SPANS = ["20", "40", "80"] as const;
const RANKS = ["2", "4", "6", "8"] as const;

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "pslAuditSave",
  edit: "pslAuditEdit",
  note: "pslAuditNote",
  pace: "pslAuditPace",
  pin: "pslAuditPin",
  unpin: "pslAuditUnpin",
  hold: "pslAuditWait",
  resume: "pslAuditResume",
  shelve: "pslAuditFile",
  open: "pslAuditOpen",
  cloth: "pslAuditCloth",
  tag: "pslAuditTag",
  rank: "pslAuditRank",
  span: "pslAuditSpan",
  short: "pslAuditShort",
  flag: "pslAuditStar",
};

const WATCH_KEY: Record<string, CrmV4CopyKey> = {
  matins: "pslMatins",
  lauds: "pslLauds",
  prime: "pslPrime",
  terce: "pslTerce",
  sext: "pslSext",
  compline: "pslCompline",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  house: "lrbHouse",
  phrase: "lrbPhrase",
  pair: "lrbPair",
  locale: "lrbLocale",
  code: "lrbCode",
  essay: "lrbEssay",
  cipher: "lrbCipher",
  plain: "lrbPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "lrbIvory",
  graphite: "lrbGraphite",
  champagne: "lrbChampagne",
  ink: "lrbInk",
  vellum: "lrbVellum",
  ash: "lrbAsh",
};

type TraderRow = {
  id?: string;
  name?: string | null;
  language?: string | null;
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
  return key ? v4(key) : v4("pslBlank");
}

function clothLabel(v4: V4, cloth: string): string {
  if (cloth === "LINEN" || cloth === "linen") return v4("pslLinen");
  if (cloth === "WOOL" || cloth === "wool") return v4("pslWool");
  if (cloth === "SILK" || cloth === "silk") return v4("pslSilk");
  return v4("pslBlankCloth");
}

function paceLabel(v4: V4, pace: string): string {
  if (pace === "walk") return v4("pslWalk");
  if (pace === "trot") return v4("pslTrot");
  if (pace === "canter") return v4("pslCanter");
  return v4("pslBlankPace");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("lrbUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("lrbUnmarked");
}

export function ParcelSlips({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<ParcelSlip[]>([]);
  const [views, setViews] = useState<ParcelView[]>([]);
  const [density, setDensity] = useState<ParcelDensity>("airy");
  const [sort, setSort] = useState<ParcelSort>("watch");
  const [tray, setTray] = useState<ParcelTray>("open");
  const [query, setQuery] = useState("");
  const [courierFilter, setCourierFilter] = useState("all");
  const [clothFilter, setClothFilter] = useState("all");
  const [paceFilter, setPaceFilter] = useState("all");
  const [watchFilter, setWatchFilter] = useState("all");
  const [spanFilter, setSpanFilter] = useState("all");
  const [rankFilter, setRankFilter] = useState("all");
  const [houseOnly, setHouseOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [desk, setDesk] = useState("lauds");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [courier, setCourier] = useState("");
  const [watch, setWatch] = useState("");
  const [cloth, setCloth] = useState("");
  const [pace, setPace] = useState("");
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
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    setCards(readParcels(readJson(PSL_KEY, [])));
    setViews(readParcelViews(readJson(PSL_VIEW_KEY, [])));
    setDensity(parcelDensity(readJson(PSL_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  const shown = sortParcels(visibleParcels(cards, tray, query, courierFilter, clothFilter, paceFilter, watchFilter, spanFilter, rankFilter, houseOnly, peakOnly, quietOnly), sort);
  const focusAt = shown.length ? focus % shown.length : 0;
  const counts = parcelCounts(cards, shown, desk);
  const timeline = parcelTimeline(cards);
  const reminders = reminderParcels(cards);
  const idling = idleParcels(cards);
  const couriers = parcelCouriers(cards);
  const bars = parcelBars(cards);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = shown.map((card) => card.id);
  const busy = busiestCourier(cards);
  const hour = new Date().getUTCHours();
  function store(next: ParcelSlip[]) {
    const saved = readParcels(next);
    setCards(saved);
    writeJson(PSL_KEY, saved);
  }
  function storeViews(next: ParcelView[]) {
    const saved = readParcelViews(next);
    setViews(saved);
    writeJson(PSL_VIEW_KEY, saved);
  }
  function storeDensity(next: ParcelDensity) {
    setDensity(next);
    writeJson(PSL_DENSITY_KEY, next);
  }
  function togglePick(id: string) {
    setPicked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }
  function applyView(view: ParcelView) {
    setTray(view.tray);
    setQuery(view.query);
    setCourierFilter(view.courier || "all");
    setClothFilter(view.cloth);
    setPaceFilter(view.pace);
    setWatchFilter(view.watch);
    setSpanFilter(view.span);
    setRankFilter(view.rank);
  }
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setCourier("");
        setWatch("");
        setCloth("");
        setPace("");
        setSpanMin("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveParcelFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveParcelFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        if (!viewer) store(waitFocusedParcel(cards, ids, focusAt));
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        if (!viewer) store(pinFocusedParcel(cards, ids, focusAt));
        return;
      }
      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        if (!viewer) store(paceFocusedParcel(cards, ids, focusAt));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        if (!viewer) store(lengthenFocusedParcel(cards, ids, focusAt));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        if (!viewer) store(shortenFocusedParcel(cards, ids, focusAt));
        return;
      }
      if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        if (!viewer) store(tagFocusedParcel(cards, ids, focusAt, "a"));
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        if (!viewer) store(starFocusedParcel(cards, ids, focusAt));
        return;
      }
      if (event.key === "b" || event.key === "B") {
        event.preventDefault();
        if (!viewer) store(raiseFocusedParcel(cards, ids, focusAt));
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        if (!viewer) store(lowerFocusedParcel(cards, ids, focusAt));
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
    <section className="c4-psl" aria-label={v4("pslTitle")} data-cards="1" data-desk="parcel" data-role={role} data-density={density} data-board={board}>
      <header className="c4-psl-mast">
        <p className="c4-psl-seal" data-logo="mono">{v4("pslLogo")}</p>
        <div>
          <p className="c4-psl-kicker">{v4("pslSub")}</p>
          <h2 className="c4-title">{v4("pslTitle")}</h2>
        </div>
        <ol className="c4-psl-index" aria-label={v4("pslTitle")}>
          <li data-tone="gold">{v4("pslChampagne")}</li>
          <li data-tone="ink">{v4("pslGraphite")}</li>
          <li data-tone="ivory">{v4("pslIvory")}</li>
        </ol>
      </header>
      <p className="c4-psl-links">
        <Link href={crmv4Href(base, "lrb")}>{v4("pslRibbons")}</Link>
        <Link href={crmv4Href(base, "rejects")}>{v4("pslRejects")}</Link>
        <Link href={crmv4Href(base, "cheats")}>{v4("pslCheats")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("pslCustomers")}</Link>
      </p>
      {viewer && <p className="c4-psl-note">{v4("pslViewer")}</p>}
      <p className="c4-psl-lead">{v4("pslKeys")}</p>
      <p className="c4-psl-hint">{v4("pslHint")}</p>
      <ul className="c4-psl-kpis" aria-label={v4("pslChart")}>
        <li><span>{v4("pslOpen")}</span><strong>{counts.open}</strong></li>
        <li><span>{v4("pslHeld")}</span><strong>{counts.held}</strong></li>
        <li><span>{v4("pslFile")}</span><strong>{counts.shelved}</strong></li>
        <li><span>{v4("pslPinned")}</span><strong>{counts.pinned}</strong></li>
        <li><span>{v4("pslOverdue")}</span><strong>{counts.overdue}</strong></li>
        <li><span>{v4("pslPeak")}</span><strong>{counts.peak}</strong></li>
        <li><span>{v4("pslQuiet")}</span><strong>{counts.quiet}</strong></li>
        <li><span>{v4("pslHouse")}</span><strong>{parcelShare(counts.house, Math.max(1, counts.open))}%</strong></li>
        <li><span>{v4("pslIdle")}</span><strong>{counts.idle}</strong></li>
        <li><span>{v4("pslRush")}</span><strong>{counts.rush}</strong></li>
        <li><span>{v4("pslResting")}</span><strong>{counts.resting}</strong></li>
        <li><span>{v4("pslSoon")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("pslMatched")}</span><strong>{counts.matched}</strong></li>
        <li><span>{v4("pslClash")}</span><strong>{clashWatchCount(cards) || v4("pslClashNone")}</strong></li>
        <li><span>{v4("pslNeighbor")}</span><strong>{neighborParcelCount(cards)}</strong></li>
        <li><span>{v4("pslBusiest")}</span><strong>{busy || v4("pslBusiestNone")}</strong></li>
      </ul>
      <div className="c4-psl-bars" aria-label={v4("pslChart")}>
        {bars.map((bar) => (
          <div key={bar.watch} className="c4-psl-bar" data-watch={bar.watch}>
            <span>{watchLabel(v4, bar.watch)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      {board === "index" && (
        <ol className="c4-psl-time" aria-label={v4("pslTimeline")}>
          {timeline.map((lane) => (
            <li key={lane.rank}><span>{v4("pslRank")} {lane.rank}</span><strong>{lane.titles.join(" · ")}</strong></li>
          ))}
          {!timeline.length && <li>{v4("pslEmpty")}</li>}
        </ol>
      )}
      <form className="c4-psl-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addParcel(cards, {
          id: `psl-${Date.now().toString(36)}`,
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
        <label className="c4-lab"><span>{v4("pslTitleField")}</span><input ref={titleRef} className="c4-field" aria-label={v4("pslTitleField")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("pslNote")}</span><input className="c4-field" aria-label={v4("pslNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("pslCourier")}</span><input className="c4-field" aria-label={v4("pslCourier")} value={courier} disabled={viewer} onChange={(event) => setCourier(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("pslWatch")}</span>
          <select className="c4-select" aria-label={v4("pslWatch")} value={watch} disabled={viewer} onChange={(event) => setWatch(event.target.value)}>
            <option value="">{v4("pslBlank")}</option>
            {PARCEL_WATCHES.map((item) => <option key={item} value={item}>{watchLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("pslCloth")}</span>
          <select className="c4-select" aria-label={v4("pslCloth")} value={cloth} disabled={viewer} onChange={(event) => setCloth(event.target.value)}>
            <option value="">{v4("pslBlankCloth")}</option>
            {CLOTHS.map((item) => <option key={item} value={item}>{clothLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("pslPace")}</span>
          <select className="c4-select" aria-label={v4("pslPace")} value={pace} disabled={viewer} onChange={(event) => setPace(event.target.value)}>
            <option value="">{v4("pslBlankPace")}</option>
            {PACES.map((item) => <option key={item} value={item}>{paceLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("pslSpan")}</span>
          <select className="c4-select" aria-label={v4("pslSpan")} value={spanMin} disabled={viewer} onChange={(event) => setSpanMin(event.target.value)}>
            <option value="">{v4("pslBlankSpan")}</option>
            {SPANS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("pslRank")}</span>
          <select className="c4-select" aria-label={v4("pslRank")} value={rank} disabled={viewer} onChange={(event) => setRank(event.target.value)}>
            {RANKS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("pslTags")}</span><input className="c4-field" aria-label={v4("pslTags")} value={tags} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button className="c4-btn" type="submit" disabled={viewer}>{v4("pslAdd")}</button>
        <button className="c4-btn" type="button" disabled={viewer} onClick={() => setCloth(suggestCloth(cards).toLowerCase())}>{v4("pslSuggestCloth")} {clothLabel(v4, suggestCloth(cards))}</button>
        <button className="c4-btn" type="button" disabled={viewer} onClick={() => setSpanMin(String(suggestWatch(cards, hour)))}>{v4("pslSuggestSpan")} {suggestWatch(cards, hour)}</button>
        <button className="c4-btn" type="button" disabled={viewer} onClick={() => setCourier(fairCourier(cards, couriers.join(", ") || courier))}>{v4("pslFair")}</button>
      </form>
      <div className="c4-psl-tools">
        <label className="c4-lab"><span>{v4("pslSearch")}</span><input ref={searchRef} className="c4-field c4-psl-search" aria-label={v4("pslSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("pslDesk")}</span>
          <select className="c4-select" aria-label={v4("pslDesk")} value={desk} onChange={(event) => setDesk(event.target.value)}>
            {PARCEL_WATCHES.map((item) => <option key={item} value={item}>{watchLabel(v4, item)}</option>)}
          </select>
        </label>
        <button type="button" className="c4-chip" data-on={tray === "open" ? "1" : "0"} onClick={() => setTray("open")}>{v4("pslOpen")}</button>
        <button type="button" className="c4-chip" data-on={tray === "held" ? "1" : "0"} onClick={() => setTray("held")}>{v4("pslHeld")}</button>
        <button type="button" className="c4-chip" data-on={tray === "shelved" ? "1" : "0"} onClick={() => setTray("shelved")}>{v4("pslFile")}</button>
        <button type="button" className="c4-chip" data-on={board === "hall" ? "1" : "0"} onClick={() => setBoard("hall")}>{v4("pslHall")}</button>
        <button type="button" className="c4-chip" data-on={board === "index" ? "1" : "0"} onClick={() => setBoard("index")}>{v4("pslIndex")}</button>
        <button type="button" className="c4-chip" data-on={density === "airy" ? "1" : "0"} onClick={() => storeDensity("airy")}>{v4("pslAiry")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity("tight")}>{v4("pslTight")}</button>
        <button type="button" className="c4-chip" data-on={sort === "watch" ? "1" : "0"} onClick={() => setSort("watch")}>{v4("pslSortWatch")}</button>
        <button type="button" className="c4-chip" data-on={sort === "courier" ? "1" : "0"} onClick={() => setSort("courier")}>{v4("pslSortCourier")}</button>
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("pslHouse")}</button>
        <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((value) => !value)}>{v4("pslPeak")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((value) => !value)}>{v4("pslQuiet")}</button>
        <label className="c4-lab"><span>{v4("pslCourier")}</span>
          <select className="c4-select" aria-label={v4("pslFilters")} value={courierFilter} onChange={(event) => setCourierFilter(event.target.value)}>
            <option value="all">{v4("pslAll")}</option>
            {couriers.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("pslWatch")}</span>
          <select className="c4-select" aria-label={v4("pslWatch")} value={watchFilter} onChange={(event) => setWatchFilter(event.target.value)}>
            <option value="all">{v4("pslAll")}</option>
            <option value="peak">{v4("pslPeak")}</option>
            <option value="quiet">{v4("pslQuiet")}</option>
            {PARCEL_WATCHES.map((item) => <option key={item} value={item}>{watchLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("pslCloth")}</span>
          <select className="c4-select" aria-label={v4("pslCloth")} value={clothFilter} onChange={(event) => setClothFilter(event.target.value)}>
            <option value="all">{v4("pslAll")}</option>
            {CLOTHS.map((item) => <option key={item} value={item}>{clothLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("pslPace")}</span>
          <select className="c4-select" aria-label={v4("pslPace")} value={paceFilter} onChange={(event) => setPaceFilter(event.target.value)}>
            <option value="all">{v4("pslAll")}</option>
            {PACES.map((item) => <option key={item} value={item}>{paceLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("pslSpan")}</span>
          <select className="c4-select" aria-label={v4("pslSpan")} value={spanFilter} onChange={(event) => setSpanFilter(event.target.value)}>
            <option value="all">{v4("pslAll")}</option>
            {SPANS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("pslRank")}</span>
          <select className="c4-select" aria-label={v4("pslRank")} value={rankFilter} onChange={(event) => setRankFilter(event.target.value)}>
            <option value="all">{v4("pslAll")}</option>
            {RANKS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <button type="button" className="c4-btn" onClick={() => download("parcel-slips.csv", parcelCsv(shown, desk))}>{v4("pslCsv")}</button>
      </div>
      <form className="c4-psl-views" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addParcelView(views, { id: `view-${Date.now().toString(36)}`, name: viewName, tray, query, courier: courierFilter, cloth: clothFilter, pace: paceFilter, watch: watchFilter, span: spanFilter, rank: rankFilter });
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("pslViewName")}</span><input className="c4-field" aria-label={v4("pslViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} /></label>
        <button className="c4-btn" type="submit" disabled={viewer}>{v4("pslSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-psl-view">
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("pslApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropParcelView(views, view.id))}>{v4("pslDropView")}</button>
          </span>
        ))}
      </form>
      {picked.length > 0 && (
        <div className="c4-psl-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkParcelPin(cards, picked))}>{v4("pslBulkPin")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkParcelFile(cards, picked))}>{v4("pslBulkFile")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkParcelCanter(cards, picked))}>{v4("pslBulkCanter")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkParcelSilk(cards, picked))}>{v4("pslBulkSilk")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkParcelTag(cards, picked, "b"))}>{v4("pslBulkTag")}</button>
        </div>
      )}
      {(reminders.length > 0 || idling.length > 0) && (
        <p className="c4-psl-meta">{v4("pslDue")} {reminders.map((card) => card.title).join(" · ")} · {v4("pslIdle")} {idling.map((card) => card.title).join(" · ")}</p>
      )}
      {!shown.length && <p className="c4-psl-empty">{v4("pslEmpty")}</p>}
      <ol className="c4-psl-board" data-density={density}>
        {shown.map((card, index) => (
          <li key={card.id} className="c4-psl-card" data-on={index === focusAt ? "1" : "0"} data-pinned={card.pinned ? "1" : "0"} data-overdue={overdueParcel(card) ? "1" : "0"} data-peak={peakWatch(card.watch) ? "1" : "0"} data-quiet={quietWatch(card.watch) ? "1" : "0"} data-house={houseCloth(card.cloth) ? "1" : "0"} data-rush={rushParcel(card) ? "1" : "0"} data-idle={idleParcel(card) ? "1" : "0"} data-resting={restingParcel(card) ? "1" : "0"} data-late={lateParcel(card, desk) ? "1" : "0"}>
            <label className="c4-psl-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => togglePick(card.id)} /></label>
            <div>
              <input className="c4-field" aria-label={v4("pslEdit")} value={card.title} disabled={viewer} onChange={(event) => store(editParcel(cards, card.id, event.target.value))} />
              <input className="c4-field" aria-label={v4("pslEditNote")} aria-required={false} value={card.note} disabled={viewer} onChange={(event) => store(editParcelNote(cards, card.id, event.target.value))} />
              <p className="c4-psl-meta">{card.courier || v4("pslBlankCourier")} · {watchLabel(v4, card.watch)} · {clothLabel(v4, card.cloth)} · {paceLabel(v4, card.pace)} · {card.span ?? v4("pslBlankSpan")} · {v4("pslRank")} {card.rank} · {card.tags.join(" ") || v4("pslTags")}</p>
              <p className="c4-psl-sla" aria-label={v4("pslSpan")}><i style={{ width: `${Math.round(((card.span ?? 0) / 80) * 100)}%` }} /></p>
              <p className="c4-psl-meta">{watchLabel(v4, desk)} · {AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : v4("pslAuditSave")}</p>
              <div className="c4-psl-tools">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setParcelPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("pslUnpin") : v4("pslPin")}</button>
                <button type="button" className="c4-btn" disabled={viewer || card.shelved} onClick={() => store(setParcelWait(cards, card.id, !card.held))}>{card.held ? v4("pslResume") : v4("pslWait")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setParcelFile(cards, card.id, !card.shelved))}>{card.shelved ? v4("pslOpen") : v4("pslFile")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setParcelStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("pslUnstar") : v4("pslStar")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cyclePace(cards, card.id))}>{v4("pslPace")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lengthenWatch(cards, card.id))}>{v4("pslLengthen")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(shortenWatch(cards, card.id))}>{v4("pslShorten")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseParcelRank(cards, card.id))}>{v4("pslRaise")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerParcelRank(cards, card.id))}>{v4("pslLower")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setParcelCloth(cards, card.id, card.cloth === "SILK" ? "linen" : "silk"))}>{v4("pslCloth")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addParcelTag(cards, card.id, "c"))}>{v4("pslTag")}</button>
                <button type="button" className="c4-btn" onClick={() => { const body = parcelCopy(card); void navigator.clipboard.writeText(body).catch(() => undefined); setCopied(card.id); }}>{copied === card.id ? v4("pslCopied") : v4("pslCopy")}</button>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function markNote(row: TraderRow): RibbonValue {
  return { language: textField(row.language) };
}

export function TongueRibbons({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: TraderRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [review, setReview] = useState<RibbonReview>("all");
  const [shape, setShape] = useState<RibbonShape>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [focus, setFocus] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<RibbonRow[]>(() => (queue.data?.users || []).map((row, index) => ({
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
    const present = presentRibbonLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenRibbons(readJson(LRB_KEY, []), present);
    const nextReviewed = readReviewedRibbons(readJson(LRB_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(LRB_KEY, nextHidden);
    writeJson(LRB_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentRibbonLanes(rows);
  const lanes = visibleRibbonLanes(present, hidden, showHidden);
  const shown = visibleRibbons(rows, lane, hue, query, review, reviewed, shape).filter((row) => {
    const token = ribbonLane(row.note);
    if (!token) return true;
    return showHidden || !hidden.includes(token);
  });
  const focusAt = shown.length ? focus % shown.length : 0;
  const bars = ribbonLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingRibbon(rows);
  const leadHue = leadingRibbonHue(rows);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveParcelFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveParcelFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        const row = shown[focusAt];
        if (!row || viewer) return;
        const next = toggleRibbonReview(reviewed, row.id);
        setReviewed(next);
        writeJson(LRB_REVIEW_KEY, next);
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
    writeJson(LRB_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(LRB_REVIEW_KEY, next);
  }
  return (
    <section className="c4-lrb" aria-label={v4("lrbTitle")} data-ribbons="1" data-traders={rows.length} data-role={role}>
      <header className="c4-lrb-mast">
        <p className="c4-lrb-seal" data-logo="mono">{v4("lrbLogo")}</p>
        <div>
          <p className="c4-lrb-kicker">{v4("lrbSub")}</p>
          <h2 className="c4-title">{v4("lrbTitle")}</h2>
        </div>
        <ol className="c4-lrb-index" aria-label={v4("lrbTitle")}>
          <li data-tone="gold">{v4("lrbChampagne")}</li>
          <li data-tone="ink">{v4("lrbGraphite")}</li>
          <li data-tone="ivory">{v4("lrbIvory")}</li>
        </ol>
      </header>
      <p className="c4-lrb-links">
        <Link href={crmv4Href(base, "psl")}>{v4("lrbCards")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("pslCustomers")}</Link>
      </p>
      <p className="c4-lrb-hint">{v4("lrbHint")}</p>
      {viewer && <p className="c4-lrb-note">{v4("lrbViewer")}</p>}
      {queue.loading && <p className="c4-lrb-meta">{v4("lrbEmpty")}</p>}
      {queue.error && <p className="c4-lrb-meta">{queue.error}</p>}
      <ul className="c4-lrb-kpis" aria-label={v4("lrbRules")}>
        <li><span>{v4("lrbLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("lrbUnmarked")}</strong></li>
        <li><span>{v4("lrbToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("lrbUnmarked")}</strong></li>
        <li><span>{v4("lrbShared")}</span><strong>{sharedRibbonCount(rows)}</strong></li>
        <li><span>{v4("lrbShare")}</span><strong>{ribbonShare(laneRibbonCount(rows, "house"), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("lrbWide")}</span><strong>{rows.filter((row) => ribbonWide(row.note)).length}</strong></li>
        <li><span>{v4("lrbNotch")}</span><strong>{rows.filter((row) => ribbonNotch(row.note)).length}</strong></li>
        <li><span>{v4("lrbEcho")}</span><strong>{rows.filter((row) => ribbonEcho(row.note)).length}</strong></li>
        <li><span>{v4("lrbHouse")}</span><strong>{hueRibbonCount(rows, "ivory")}</strong></li>
      </ul>
      <div className="c4-lrb-bars" aria-label={v4("lrbRules")}>
        {bars.map((bar) => (
          <div key={bar.lane} className="c4-lrb-bar">
            <span>{laneLabel(v4, bar.lane)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <div className="c4-lrb-tools">
        <label className="c4-lab"><span>{v4("lrbSearch")}</span><input ref={searchRef} className="c4-field c4-lrb-search" aria-label={v4("lrbSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("lrbCode")}</span>
          <select className="c4-select" aria-label={v4("lrbCode")} value={lane} onChange={(event) => setLane(event.target.value)}>
            <option value="all">{v4("lrbAll")}</option>
            {present.map((item) => <option key={item} value={item}>{laneLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("lrbToneLead")}</span>
          <select className="c4-select" aria-label={v4("lrbToneLead")} value={hue} onChange={(event) => setHue(event.target.value)}>
            <option value="all">{v4("lrbAll")}</option>
            {(["ivory", "graphite", "champagne", "ink", "vellum", "ash"] as const).map((item) => <option key={item} value={item}>{hueLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("lrbShapeAll")}</span>
          <select className="c4-select" aria-label={v4("lrbShapeAll")} value={shape} onChange={(event) => setShape(event.target.value as RibbonShape)}>
            <option value="all">{v4("lrbShapeAll")}</option>
            <option value="house">{v4("lrbHouse")}</option>
            <option value="phrase">{v4("lrbPhrase")}</option>
            <option value="pair">{v4("lrbPair")}</option>
            <option value="locale">{v4("lrbLocale")}</option>
            <option value="code">{v4("lrbCode")}</option>
            <option value="essay">{v4("lrbEssay")}</option>
            <option value="cipher">{v4("lrbCipher")}</option>
            <option value="wide">{v4("lrbShapeWide")}</option>
            <option value="notch">{v4("lrbShapeNotch")}</option>
          </select>
        </label>
        <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} onClick={() => setReview("all")}>{v4("lrbAll")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview("reviewed")}>{v4("lrbReviewed")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview("fresh")}>{v4("lrbUnreviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("lrbShow")}</button>
        <button type="button" className="c4-btn" onClick={() => download("language-ribbons.csv", ribbonLanesCsv(rows))}>{v4("lrbCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("language-ribbon-rows.csv", ribbonRowsCsv(rows, reviewed))}>{v4("lrbRowCsv")}</button>
      </div>
      <div className="c4-lrb-lanes">
        {lanes.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hidden.includes(item) ? "1" : "0"} disabled={viewer} onClick={() => storeHidden(toggleRibbon(hidden, item))}>{v4("lrbHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      {picked.length > 0 && (
        <div className="c4-lrb-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkRibbonReview(reviewed, picked, true))}>{v4("lrbBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkRibbonReview(reviewed, picked, false))}>{v4("lrbBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-lrb-empty">{v4("lrbEmpty")}</p>}
      <ol className="c4-lrb-board">
        {shown.map((row, index) => {
          const state = ribbonState(row.note);
          return (
            <li key={row.id} className="c4-lrb-card" data-on={index === focusAt ? "1" : "0"} data-state={state} data-lane={ribbonLane(row.note)} data-hue={ribbonHue(row.note)} data-reviewed={reviewed.includes(row.id) ? "1" : "0"}>
              <label className="c4-lrb-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label} onChange={() => setPicked((current) => current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id])} /></label>
              <div>
                <strong>{row.label || v4("lrbUnmarked")}</strong>
                <p className="c4-lrb-meta">{ribbonStamp(row.note) || v4("lrbClear")} · {laneLabel(v4, ribbonLane(row.note))} · {hueLabel(v4, ribbonHue(row.note))} · {v4("lrbStep")} {ribbonStep(row.note)} · {ribbonSpoken(row.note) ? v4("lrbSpoken") : v4("lrbClear")}</p>
                <div className="c4-lrb-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleRibbonReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("lrbReviewed") : v4("lrbReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { const body = ribbonCopy(row.note); void navigator.clipboard.writeText(body).catch(() => undefined); setCopied(row.id); }}>{copied === row.id ? v4("lrbCopied") : v4("lrbCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
