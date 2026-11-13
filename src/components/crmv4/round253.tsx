"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  TGS_KEY,
  TGS_REVIEW_KEY,
  TRESTLE_BAYS,
  TRS_DENSITY_KEY,
  TRS_KEY,
  TRS_VIEW_KEY,
  addTrestle,
  addTrestleTag,
  addTrestleView,
  bulkSealReview,
  bulkTrestleFile,
  bulkTrestlePin,
  bulkTrestleSprint,
  bulkTrestleTag,
  bulkTrestleYew,
  busiestJoiner,
  clashBayCount,
  cycleGait,
  dropTrestleView,
  editTrestle,
  editTrestleNote,
  fairJoiner,
  gaitFocusedTrestle,
  houseTimber,
  hueSealCount,
  idleTrestle,
  idleTrestles,
  laneSealCount,
  lateTrestle,
  leadingSeal,
  leadingSealHue,
  lengthenFocusedTrestle,
  lengthenSpan,
  lowerFocusedTrestle,
  lowerRank,
  moveTrestleFocus,
  neighborTrestleCount,
  overdueTrestle,
  peakBay,
  pinFocusedTrestle,
  presentSealLanes,
  quietBay,
  raiseFocusedTrestle,
  raiseRank,
  readHiddenSeals,
  readReviewedSeals,
  readTrestleViews,
  readTrestles,
  reminderTrestles,
  restingTrestle,
  rushTrestle,
  sealBound,
  sealCopy,
  sealHue,
  sealJoin,
  sealLane,
  sealLanes,
  sealLanesCsv,
  sealNotch,
  sealRowsCsv,
  sealShare,
  sealStamp,
  sealState,
  sealStep,
  sealWide,
  setTrestleFile,
  setTrestlePin,
  setTrestleStar,
  setTrestleTimber,
  setTrestleWait,
  sharedSealCount,
  shortenFocusedTrestle,
  shortenSpan,
  sortTrestles,
  starFocusedTrestle,
  suggestSpan,
  suggestTimber,
  tagFocusedTrestle,
  toggleSeal,
  toggleSealReview,
  trestleBars,
  trestleCopy,
  trestleCounts,
  trestleCsv,
  trestleDensity,
  trestleJoiners,
  trestleShare,
  trestleTimeline,
  visibleSealLanes,
  visibleSeals,
  visibleTrestles,
  waitFocusedTrestle,
  type SealReview,
  type SealRow,
  type SealShape,
  type SealValue,
  type TrestleCard,
  type TrestleDensity,
  type TrestleSort,
  type TrestleTray,
  type TrestleView,
} from "@/lib/crmv4/round253";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const TIMBERS = ["oak", "ash", "yew"] as const;
const GAITS = ["stroll", "stride", "sprint"] as const;
const SPANS = ["15", "45", "90"] as const;
const RANKS = ["1", "3", "5", "9"] as const;

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "trsAuditSave",
  edit: "trsAuditEdit",
  note: "trsAuditNote",
  gait: "trsAuditGait",
  pin: "trsAuditPin",
  unpin: "trsAuditUnpin",
  hold: "trsAuditWait",
  resume: "trsAuditResume",
  shelve: "trsAuditFile",
  open: "trsAuditOpen",
  timber: "trsAuditTimber",
  tag: "trsAuditTag",
  rank: "trsAuditRank",
  span: "trsAuditSpan",
  short: "trsAuditShort",
  flag: "trsAuditStar",
};

const BAY_KEY: Record<string, CrmV4CopyKey> = {
  dawn: "trsDawn",
  noon: "trsNoon",
  dusk: "trsDusk",
  night: "trsNight",
  vigil: "trsVigil",
  rest: "trsRest",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  house: "tgsHouse",
  bench: "tgsBench",
  duo: "tgsDuo",
  split: "tgsSplit",
  brief: "tgsBrief",
  long: "tgsLong",
  mark: "tgsMark",
  plain: "tgsPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "tgsIvory",
  graphite: "tgsGraphite",
  champagne: "tgsChampagne",
  ink: "tgsInk",
  vellum: "tgsVellum",
  ash: "tgsAsh",
};

type TraderRow = {
  id?: string;
  name?: string | null;
  tradingGroup?: string | null;
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

function bayLabel(v4: V4, bay: string): string {
  const key = BAY_KEY[bay];
  return key ? v4(key) : v4("trsBlank");
}

function timberLabel(v4: V4, timber: string): string {
  if (timber === "OAK" || timber === "oak") return v4("trsOak");
  if (timber === "ASH" || timber === "ash") return v4("trsAsh");
  if (timber === "YEW" || timber === "yew") return v4("trsYew");
  return v4("trsBlankTimber");
}

function gaitLabel(v4: V4, gait: string): string {
  if (gait === "stroll") return v4("trsStroll");
  if (gait === "stride") return v4("trsStride");
  if (gait === "sprint") return v4("trsSprint");
  return v4("trsBlankGait");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("tgsUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("tgsUnmarked");
}

export function TrestleCards({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<TrestleCard[]>([]);
  const [views, setViews] = useState<TrestleView[]>([]);
  const [density, setDensity] = useState<TrestleDensity>("airy");
  const [sort, setSort] = useState<TrestleSort>("bay");
  const [tray, setTray] = useState<TrestleTray>("open");
  const [query, setQuery] = useState("");
  const [joinerFilter, setJoinerFilter] = useState("all");
  const [timberFilter, setTimberFilter] = useState("all");
  const [gaitFilter, setGaitFilter] = useState("all");
  const [bayFilter, setBayFilter] = useState("all");
  const [spanFilter, setSpanFilter] = useState("all");
  const [rankFilter, setRankFilter] = useState("all");
  const [houseOnly, setHouseOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [desk, setDesk] = useState("noon");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [joiner, setJoiner] = useState("");
  const [bay, setBay] = useState("");
  const [timber, setTimber] = useState("");
  const [gait, setGait] = useState("");
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
    setCards(readTrestles(readJson(TRS_KEY, [])));
    setViews(readTrestleViews(readJson(TRS_VIEW_KEY, [])));
    setDensity(trestleDensity(readJson(TRS_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  const shown = sortTrestles(visibleTrestles(cards, tray, query, joinerFilter, timberFilter, gaitFilter, bayFilter, spanFilter, rankFilter, houseOnly, peakOnly, quietOnly), sort);
  const focusAt = shown.length ? focus % shown.length : 0;
  const counts = trestleCounts(cards, shown, desk);
  const timeline = trestleTimeline(cards);
  const reminders = reminderTrestles(cards);
  const idling = idleTrestles(cards);
  const joiners = trestleJoiners(cards);
  const bars = trestleBars(cards);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = shown.map((card) => card.id);
  const busy = busiestJoiner(cards);
  const hour = new Date().getUTCHours();
  function store(next: TrestleCard[]) {
    const saved = readTrestles(next);
    setCards(saved);
    writeJson(TRS_KEY, saved);
  }
  function storeViews(next: TrestleView[]) {
    const saved = readTrestleViews(next);
    setViews(saved);
    writeJson(TRS_VIEW_KEY, saved);
  }
  function storeDensity(next: TrestleDensity) {
    setDensity(next);
    writeJson(TRS_DENSITY_KEY, next);
  }
  function togglePick(id: string) {
    setPicked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }
  function applyView(view: TrestleView) {
    setTray(view.tray);
    setQuery(view.query);
    setJoinerFilter(view.joiner || "all");
    setTimberFilter(view.timber);
    setGaitFilter(view.gait);
    setBayFilter(view.bay);
    setSpanFilter(view.span);
    setRankFilter(view.rank);
  }
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setJoiner("");
        setBay("");
        setTimber("");
        setGait("");
        setSpanMin("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveTrestleFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveTrestleFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        if (!viewer) store(waitFocusedTrestle(cards, ids, focusAt));
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        if (!viewer) store(pinFocusedTrestle(cards, ids, focusAt));
        return;
      }
      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        if (!viewer) store(gaitFocusedTrestle(cards, ids, focusAt));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        if (!viewer) store(lengthenFocusedTrestle(cards, ids, focusAt));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        if (!viewer) store(shortenFocusedTrestle(cards, ids, focusAt));
        return;
      }
      if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        if (!viewer) store(tagFocusedTrestle(cards, ids, focusAt, "m"));
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        if (!viewer) store(starFocusedTrestle(cards, ids, focusAt));
        return;
      }
      if (event.key === "b" || event.key === "B") {
        event.preventDefault();
        if (!viewer) store(raiseFocusedTrestle(cards, ids, focusAt));
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        if (!viewer) store(lowerFocusedTrestle(cards, ids, focusAt));
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
    <section className="c4-trs" aria-label={v4("trsTitle")} data-cards="1" data-desk="trestle" data-role={role} data-density={density} data-board={board}>
      <header className="c4-trs-mast">
        <p className="c4-trs-seal" data-logo="mono">{v4("trsLogo")}</p>
        <div>
          <p className="c4-trs-kicker">{v4("trsSub")}</p>
          <h2 className="c4-title">{v4("trsTitle")}</h2>
        </div>
        <ol className="c4-trs-index" aria-label={v4("trsTitle")}>
          <li data-tone="gold">{v4("trsChampagne")}</li>
          <li data-tone="ink">{v4("trsGraphite")}</li>
          <li data-tone="ivory">{v4("trsIvory")}</li>
        </ol>
      </header>
      <p className="c4-trs-links">
        <Link href={crmv4Href(base, "tgs")}>{v4("trsSeals")}</Link>
        <Link href={crmv4Href(base, "jumps")}>{v4("trsJumps")}</Link>
        <Link href={crmv4Href(base, "expiry")}>{v4("trsExpiry")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("trsCustomers")}</Link>
      </p>
      {viewer && <p className="c4-trs-note">{v4("trsViewer")}</p>}
      <p className="c4-trs-lead">{v4("trsKeys")}</p>
      <p className="c4-trs-hint">{v4("trsHint")}</p>
      <ul className="c4-trs-kpis" aria-label={v4("trsChart")}>
        <li><span>{v4("trsOpen")}</span><strong>{counts.open}</strong></li>
        <li><span>{v4("trsHeld")}</span><strong>{counts.held}</strong></li>
        <li><span>{v4("trsFile")}</span><strong>{counts.shelved}</strong></li>
        <li><span>{v4("trsPinned")}</span><strong>{counts.pinned}</strong></li>
        <li><span>{v4("trsOverdue")}</span><strong>{counts.overdue}</strong></li>
        <li><span>{v4("trsPeak")}</span><strong>{counts.peak}</strong></li>
        <li><span>{v4("trsQuiet")}</span><strong>{counts.quiet}</strong></li>
        <li><span>{v4("trsHouse")}</span><strong>{trestleShare(counts.house, Math.max(1, counts.open))}%</strong></li>
        <li><span>{v4("trsIdle")}</span><strong>{counts.idle}</strong></li>
        <li><span>{v4("trsRush")}</span><strong>{counts.rush}</strong></li>
        <li><span>{v4("trsResting")}</span><strong>{counts.resting}</strong></li>
        <li><span>{v4("trsSoon")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("trsMatched")}</span><strong>{counts.matched}</strong></li>
        <li><span>{v4("trsClash")}</span><strong>{clashBayCount(cards) || v4("trsClashNone")}</strong></li>
        <li><span>{v4("trsNeighbor")}</span><strong>{neighborTrestleCount(cards)}</strong></li>
        <li><span>{v4("trsBusiest")}</span><strong>{busy || v4("trsBusiestNone")}</strong></li>
      </ul>
      <div className="c4-trs-bars" aria-label={v4("trsChart")}>
        {bars.map((bar) => (
          <div key={bar.bay} className="c4-trs-bar" data-bay={bar.bay}>
            <span>{bayLabel(v4, bar.bay)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      {board === "index" && (
        <ol className="c4-trs-time" aria-label={v4("trsTimeline")}>
          {timeline.map((lane) => (
            <li key={lane.rank}><span>{v4("trsRank")} {lane.rank}</span><strong>{lane.titles.join(" · ")}</strong></li>
          ))}
          {!timeline.length && <li>{v4("trsEmpty")}</li>}
        </ol>
      )}
      <form className="c4-trs-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addTrestle(cards, {
          id: `trs-${Date.now().toString(36)}`,
          title,
          note,
          joiner,
          bay,
          timber,
          gait,
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
        <label className="c4-lab"><span>{v4("trsTitleField")}</span><input ref={titleRef} className="c4-field" aria-label={v4("trsTitleField")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("trsNote")}</span><input className="c4-field" aria-label={v4("trsNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("trsJoiner")}</span><input className="c4-field" aria-label={v4("trsJoiner")} value={joiner} disabled={viewer} onChange={(event) => setJoiner(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("trsBay")}</span>
          <select className="c4-select" aria-label={v4("trsBay")} value={bay} disabled={viewer} onChange={(event) => setBay(event.target.value)}>
            <option value="">{v4("trsBlank")}</option>
            {TRESTLE_BAYS.map((item) => <option key={item} value={item}>{bayLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("trsTimber")}</span>
          <select className="c4-select" aria-label={v4("trsTimber")} value={timber} disabled={viewer} onChange={(event) => setTimber(event.target.value)}>
            <option value="">{v4("trsBlankTimber")}</option>
            {TIMBERS.map((item) => <option key={item} value={item}>{timberLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("trsGait")}</span>
          <select className="c4-select" aria-label={v4("trsGait")} value={gait} disabled={viewer} onChange={(event) => setGait(event.target.value)}>
            <option value="">{v4("trsBlankGait")}</option>
            {GAITS.map((item) => <option key={item} value={item}>{gaitLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("trsSpan")}</span>
          <select className="c4-select" aria-label={v4("trsSpan")} value={spanMin} disabled={viewer} onChange={(event) => setSpanMin(event.target.value)}>
            <option value="">{v4("trsBlankSpan")}</option>
            {SPANS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("trsRank")}</span>
          <select className="c4-select" aria-label={v4("trsRank")} value={rank} disabled={viewer} onChange={(event) => setRank(event.target.value)}>
            {RANKS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("trsTags")}</span><input className="c4-field" aria-label={v4("trsTags")} value={tags} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button className="c4-btn" type="submit" disabled={viewer}>{v4("trsAdd")}</button>
        <button className="c4-btn" type="button" disabled={viewer} onClick={() => setTimber(suggestTimber(cards).toLowerCase())}>{v4("trsSuggestTimber")} {timberLabel(v4, suggestTimber(cards))}</button>
        <button className="c4-btn" type="button" disabled={viewer} onClick={() => setSpanMin(String(suggestSpan(cards, hour)))}>{v4("trsSuggestSpan")} {suggestSpan(cards, hour)}</button>
        <button className="c4-btn" type="button" disabled={viewer} onClick={() => setJoiner(fairJoiner(cards, joiners.join(", ") || joiner))}>{v4("trsFair")}</button>
      </form>
      <div className="c4-trs-tools">
        <label className="c4-lab"><span>{v4("trsSearch")}</span><input ref={searchRef} className="c4-field c4-trs-search" aria-label={v4("trsSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("trsDesk")}</span>
          <select className="c4-select" aria-label={v4("trsDesk")} value={desk} onChange={(event) => setDesk(event.target.value)}>
            {TRESTLE_BAYS.map((item) => <option key={item} value={item}>{bayLabel(v4, item)}</option>)}
          </select>
        </label>
        <button type="button" className="c4-chip" data-on={tray === "open" ? "1" : "0"} onClick={() => setTray("open")}>{v4("trsOpen")}</button>
        <button type="button" className="c4-chip" data-on={tray === "held" ? "1" : "0"} onClick={() => setTray("held")}>{v4("trsHeld")}</button>
        <button type="button" className="c4-chip" data-on={tray === "shelved" ? "1" : "0"} onClick={() => setTray("shelved")}>{v4("trsFile")}</button>
        <button type="button" className="c4-chip" data-on={board === "hall" ? "1" : "0"} onClick={() => setBoard("hall")}>{v4("trsHall")}</button>
        <button type="button" className="c4-chip" data-on={board === "index" ? "1" : "0"} onClick={() => setBoard("index")}>{v4("trsIndex")}</button>
        <button type="button" className="c4-chip" data-on={density === "airy" ? "1" : "0"} onClick={() => storeDensity("airy")}>{v4("trsAiry")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity("tight")}>{v4("trsTight")}</button>
        <button type="button" className="c4-chip" data-on={sort === "bay" ? "1" : "0"} onClick={() => setSort("bay")}>{v4("trsSortBay")}</button>
        <button type="button" className="c4-chip" data-on={sort === "joiner" ? "1" : "0"} onClick={() => setSort("joiner")}>{v4("trsSortJoiner")}</button>
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("trsHouse")}</button>
        <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((value) => !value)}>{v4("trsPeak")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((value) => !value)}>{v4("trsQuiet")}</button>
        <label className="c4-lab"><span>{v4("trsJoiner")}</span>
          <select className="c4-select" aria-label={v4("trsFilters")} value={joinerFilter} onChange={(event) => setJoinerFilter(event.target.value)}>
            <option value="all">{v4("trsAll")}</option>
            {joiners.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("trsBay")}</span>
          <select className="c4-select" aria-label={v4("trsBay")} value={bayFilter} onChange={(event) => setBayFilter(event.target.value)}>
            <option value="all">{v4("trsAll")}</option>
            <option value="peak">{v4("trsPeak")}</option>
            <option value="quiet">{v4("trsQuiet")}</option>
            {TRESTLE_BAYS.map((item) => <option key={item} value={item}>{bayLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("trsTimber")}</span>
          <select className="c4-select" aria-label={v4("trsTimber")} value={timberFilter} onChange={(event) => setTimberFilter(event.target.value)}>
            <option value="all">{v4("trsAll")}</option>
            {TIMBERS.map((item) => <option key={item} value={item}>{timberLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("trsGait")}</span>
          <select className="c4-select" aria-label={v4("trsGait")} value={gaitFilter} onChange={(event) => setGaitFilter(event.target.value)}>
            <option value="all">{v4("trsAll")}</option>
            {GAITS.map((item) => <option key={item} value={item}>{gaitLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("trsSpan")}</span>
          <select className="c4-select" aria-label={v4("trsSpan")} value={spanFilter} onChange={(event) => setSpanFilter(event.target.value)}>
            <option value="all">{v4("trsAll")}</option>
            {SPANS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("trsRank")}</span>
          <select className="c4-select" aria-label={v4("trsRank")} value={rankFilter} onChange={(event) => setRankFilter(event.target.value)}>
            <option value="all">{v4("trsAll")}</option>
            {RANKS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <button type="button" className="c4-btn" onClick={() => download("trestle-cards.csv", trestleCsv(shown, desk))}>{v4("trsCsv")}</button>
      </div>
      <form className="c4-trs-views" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addTrestleView(views, { id: `view-${Date.now().toString(36)}`, name: viewName, tray, query, joiner: joinerFilter, timber: timberFilter, gait: gaitFilter, bay: bayFilter, span: spanFilter, rank: rankFilter });
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("trsViewName")}</span><input className="c4-field" aria-label={v4("trsViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} /></label>
        <button className="c4-btn" type="submit" disabled={viewer}>{v4("trsSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-trs-view">
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("trsApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropTrestleView(views, view.id))}>{v4("trsDropView")}</button>
          </span>
        ))}
      </form>
      {picked.length > 0 && (
        <div className="c4-trs-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkTrestlePin(cards, picked))}>{v4("trsBulkPin")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkTrestleFile(cards, picked))}>{v4("trsBulkFile")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkTrestleSprint(cards, picked))}>{v4("trsBulkSprint")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkTrestleYew(cards, picked))}>{v4("trsBulkYew")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkTrestleTag(cards, picked, "n"))}>{v4("trsBulkTag")}</button>
        </div>
      )}
      {(reminders.length > 0 || idling.length > 0) && (
        <p className="c4-trs-meta">{v4("trsDue")} {reminders.map((card) => card.title).join(" · ")} · {v4("trsIdle")} {idling.map((card) => card.title).join(" · ")}</p>
      )}
      {!shown.length && <p className="c4-trs-empty">{v4("trsEmpty")}</p>}
      <ol className="c4-trs-board" data-density={density}>
        {shown.map((card, index) => (
          <li key={card.id} className="c4-trs-card" data-on={index === focusAt ? "1" : "0"} data-pinned={card.pinned ? "1" : "0"} data-overdue={overdueTrestle(card) ? "1" : "0"} data-peak={peakBay(card.bay) ? "1" : "0"} data-quiet={quietBay(card.bay) ? "1" : "0"} data-house={houseTimber(card.timber) ? "1" : "0"} data-rush={rushTrestle(card) ? "1" : "0"} data-idle={idleTrestle(card) ? "1" : "0"} data-resting={restingTrestle(card) ? "1" : "0"} data-late={lateTrestle(card, desk) ? "1" : "0"}>
            <label className="c4-trs-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => togglePick(card.id)} /></label>
            <div>
              <input className="c4-field" aria-label={v4("trsEdit")} value={card.title} disabled={viewer} onChange={(event) => store(editTrestle(cards, card.id, event.target.value))} />
              <input className="c4-field" aria-label={v4("trsEditNote")} aria-required={false} value={card.note} disabled={viewer} onChange={(event) => store(editTrestleNote(cards, card.id, event.target.value))} />
              <p className="c4-trs-meta">{card.joiner || v4("trsBlankJoiner")} · {bayLabel(v4, card.bay)} · {timberLabel(v4, card.timber)} · {gaitLabel(v4, card.gait)} · {card.span ?? v4("trsBlankSpan")} · {v4("trsRank")} {card.rank} · {card.tags.join(" ") || v4("trsTags")}</p>
              <p className="c4-trs-sla" aria-label={v4("trsSpan")}><i style={{ width: `${Math.round(((card.span ?? 0) / 90) * 100)}%` }} /></p>
              <p className="c4-trs-meta">{bayLabel(v4, desk)} · {AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : v4("trsAuditSave")}</p>
              <div className="c4-trs-tools">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTrestlePin(cards, card.id, !card.pinned))}>{card.pinned ? v4("trsUnpin") : v4("trsPin")}</button>
                <button type="button" className="c4-btn" disabled={viewer || card.shelved} onClick={() => store(setTrestleWait(cards, card.id, !card.held))}>{card.held ? v4("trsResume") : v4("trsWait")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTrestleFile(cards, card.id, !card.shelved))}>{card.shelved ? v4("trsOpen") : v4("trsFile")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTrestleStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("trsUnstar") : v4("trsStar")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleGait(cards, card.id))}>{v4("trsGait")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lengthenSpan(cards, card.id))}>{v4("trsLengthen")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(shortenSpan(cards, card.id))}>{v4("trsShorten")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseRank(cards, card.id))}>{v4("trsRaise")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerRank(cards, card.id))}>{v4("trsLower")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTrestleTimber(cards, card.id, card.timber === "YEW" ? "oak" : "yew"))}>{v4("trsTimber")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addTrestleTag(cards, card.id, "o"))}>{v4("trsTag")}</button>
                <button type="button" className="c4-btn" onClick={() => { const body = trestleCopy(card); void navigator.clipboard.writeText(body).catch(() => undefined); setCopied(card.id); }}>{copied === card.id ? v4("trsCopied") : v4("trsCopy")}</button>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function markNote(row: TraderRow): SealValue {
  return { tradingGroup: textField(row.tradingGroup) };
}

export function GroupSeals({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: TraderRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [review, setReview] = useState<SealReview>("all");
  const [shape, setShape] = useState<SealShape>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [focus, setFocus] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<SealRow[]>(() => (queue.data?.users || []).map((row, index) => ({
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
    const present = presentSealLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenSeals(readJson(TGS_KEY, []), present);
    const nextReviewed = readReviewedSeals(readJson(TGS_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(TGS_KEY, nextHidden);
    writeJson(TGS_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentSealLanes(rows);
  const lanes = visibleSealLanes(present, hidden, showHidden);
  const shown = visibleSeals(rows, lane, hue, query, review, reviewed, shape).filter((row) => {
    const token = sealLane(row.note);
    if (!token) return true;
    return showHidden || !hidden.includes(token);
  });
  const focusAt = shown.length ? focus % shown.length : 0;
  const bars = sealLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingSeal(rows);
  const leadHue = leadingSealHue(rows);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveTrestleFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveTrestleFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        const row = shown[focusAt];
        if (!row || viewer) return;
        const next = toggleSealReview(reviewed, row.id);
        setReviewed(next);
        writeJson(TGS_REVIEW_KEY, next);
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
    writeJson(TGS_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(TGS_REVIEW_KEY, next);
  }
  return (
    <section className="c4-tgs" aria-label={v4("tgsTitle")} data-seals="1" data-traders={rows.length} data-role={role}>
      <header className="c4-tgs-mast">
        <p className="c4-tgs-seal" data-logo="mono">{v4("tgsLogo")}</p>
        <div>
          <p className="c4-tgs-kicker">{v4("tgsSub")}</p>
          <h2 className="c4-title">{v4("tgsTitle")}</h2>
        </div>
        <ol className="c4-tgs-index" aria-label={v4("tgsTitle")}>
          <li data-tone="gold">{v4("tgsChampagne")}</li>
          <li data-tone="ink">{v4("tgsGraphite")}</li>
          <li data-tone="ivory">{v4("tgsIvory")}</li>
        </ol>
      </header>
      <p className="c4-tgs-links">
        <Link href={crmv4Href(base, "trs")}>{v4("tgsCards")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("trsCustomers")}</Link>
      </p>
      <p className="c4-tgs-hint">{v4("tgsHint")}</p>
      {viewer && <p className="c4-tgs-note">{v4("tgsViewer")}</p>}
      {queue.loading && <p className="c4-tgs-meta">{v4("tgsEmpty")}</p>}
      {queue.error && <p className="c4-tgs-meta">{queue.error}</p>}
      <ul className="c4-tgs-kpis" aria-label={v4("tgsRules")}>
        <li><span>{v4("tgsLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("tgsUnmarked")}</strong></li>
        <li><span>{v4("tgsToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("tgsUnmarked")}</strong></li>
        <li><span>{v4("tgsShared")}</span><strong>{sharedSealCount(rows)}</strong></li>
        <li><span>{v4("tgsShare")}</span><strong>{sealShare(laneSealCount(rows, "house"), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("tgsWide")}</span><strong>{rows.filter((row) => sealWide(row.note)).length}</strong></li>
        <li><span>{v4("tgsNotch")}</span><strong>{rows.filter((row) => sealNotch(row.note)).length}</strong></li>
        <li><span>{v4("tgsJoin")}</span><strong>{rows.filter((row) => sealJoin(row.note)).length}</strong></li>
        <li><span>{v4("tgsHouse")}</span><strong>{hueSealCount(rows, "ivory")}</strong></li>
      </ul>
      <div className="c4-tgs-bars" aria-label={v4("tgsRules")}>
        {bars.map((bar) => (
          <div key={bar.lane} className="c4-tgs-bar">
            <span>{laneLabel(v4, bar.lane)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <div className="c4-tgs-tools">
        <label className="c4-lab"><span>{v4("tgsSearch")}</span><input ref={searchRef} className="c4-field c4-tgs-search" aria-label={v4("tgsSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("tgsCode")}</span>
          <select className="c4-select" aria-label={v4("tgsCode")} value={lane} onChange={(event) => setLane(event.target.value)}>
            <option value="all">{v4("tgsAll")}</option>
            {present.map((item) => <option key={item} value={item}>{laneLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("tgsToneLead")}</span>
          <select className="c4-select" aria-label={v4("tgsToneLead")} value={hue} onChange={(event) => setHue(event.target.value)}>
            <option value="all">{v4("tgsAll")}</option>
            {(["ivory", "graphite", "champagne", "ink", "vellum", "ash"] as const).map((item) => <option key={item} value={item}>{hueLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("tgsShapeAll")}</span>
          <select className="c4-select" aria-label={v4("tgsShapeAll")} value={shape} onChange={(event) => setShape(event.target.value as SealShape)}>
            <option value="all">{v4("tgsShapeAll")}</option>
            <option value="house">{v4("tgsHouse")}</option>
            <option value="bench">{v4("tgsBench")}</option>
            <option value="duo">{v4("tgsDuo")}</option>
            <option value="split">{v4("tgsSplit")}</option>
            <option value="brief">{v4("tgsBrief")}</option>
            <option value="long">{v4("tgsLong")}</option>
            <option value="mark">{v4("tgsMark")}</option>
            <option value="wide">{v4("tgsShapeWide")}</option>
            <option value="notch">{v4("tgsShapeNotch")}</option>
          </select>
        </label>
        <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} onClick={() => setReview("all")}>{v4("tgsAll")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview("reviewed")}>{v4("tgsReviewed")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview("fresh")}>{v4("tgsUnreviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("tgsShow")}</button>
        <button type="button" className="c4-btn" onClick={() => download("group-seals.csv", sealLanesCsv(rows))}>{v4("tgsCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("group-seal-rows.csv", sealRowsCsv(rows, reviewed))}>{v4("tgsRowCsv")}</button>
      </div>
      <div className="c4-tgs-lanes">
        {lanes.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hidden.includes(item) ? "1" : "0"} disabled={viewer} onClick={() => storeHidden(toggleSeal(hidden, item))}>{v4("tgsHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      {picked.length > 0 && (
        <div className="c4-tgs-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkSealReview(reviewed, picked, true))}>{v4("tgsBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkSealReview(reviewed, picked, false))}>{v4("tgsBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-tgs-empty">{v4("tgsEmpty")}</p>}
      <ol className="c4-tgs-board">
        {shown.map((row, index) => {
          const state = sealState(row.note);
          return (
            <li key={row.id} className="c4-tgs-card" data-on={index === focusAt ? "1" : "0"} data-state={state} data-lane={sealLane(row.note)} data-hue={sealHue(row.note)} data-reviewed={reviewed.includes(row.id) ? "1" : "0"}>
              <label className="c4-tgs-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label} onChange={() => setPicked((current) => current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id])} /></label>
              <div>
                <strong>{row.label || v4("tgsUnmarked")}</strong>
                <p className="c4-tgs-meta">{sealStamp(row.note) || v4("tgsClear")} · {laneLabel(v4, sealLane(row.note))} · {hueLabel(v4, sealHue(row.note))} · {v4("tgsStep")} {sealStep(row.note)} · {sealBound(row.note) ? v4("tgsSet") : v4("tgsClear")}</p>
                <div className="c4-tgs-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleSealReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("tgsReviewed") : v4("tgsReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { const body = sealCopy(row.note); void navigator.clipboard.writeText(body).catch(() => undefined); setCopied(row.id); }}>{copied === row.id ? v4("tgsCopied") : v4("tgsCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
