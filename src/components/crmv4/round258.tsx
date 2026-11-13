"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  ATP_DENSITY_KEY,
  ATP_KEY,
  ATP_VIEW_KEY,
  ATRIUM_HOURS,
  LCP_KEY,
  LCP_REVIEW_KEY,
  addSlip,
  addSlipTag,
  addSlipView,
  atriumDensity,
  bulkPlateReview,
  bulkSlipCard,
  bulkSlipFile,
  bulkSlipPin,
  bulkSlipSprint,
  bulkSlipTag,
  busiestHost,
  clashHourCount,
  cyclePace,
  dropSlipView,
  editSlip,
  editSlipNote,
  fairHost,
  houseManner,
  huePlateCount,
  idleSlip,
  idleSlips,
  lanePlateCount,
  lateSlip,
  leadingPlate,
  leadingPlateHue,
  lengthenFocusedSlip,
  lengthenSpan,
  lowerFocusedSlip,
  lowerRank,
  moveSlipFocus,
  neighborSlipCount,
  overdueSlip,
  paceFocusedSlip,
  peakHour,
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
  quietHour,
  raiseFocusedSlip,
  raiseRank,
  readHiddenPlates,
  readReviewedPlates,
  readSlipViews,
  readSlips,
  reminderSlips,
  restingSlip,
  rushSlip,
  setSlipFile,
  setSlipManner,
  setSlipPin,
  setSlipStar,
  setSlipWait,
  sharedPlateCount,
  shortenFocusedSlip,
  shortenSpan,
  slipBars,
  slipCopy,
  slipCounts,
  slipCsv,
  slipHosts,
  slipTimeline,
  sortSlips,
  starFocusedSlip,
  suggestManner,
  suggestSpan,
  tagFocusedSlip,
  togglePlate,
  togglePlateReview,
  visiblePlateLanes,
  visiblePlates,
  visibleSlips,
  waitFocusedSlip,
  type AtriumDensity,
  type AtriumSlip,
  type AtriumSort,
  type AtriumTray,
  type AtriumView,
  type PlateReview,
  type PlateRow,
  type PlateShape,
  type PlateValue,
} from "@/lib/crmv4/round258";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const MANNERS = ["bow", "word", "card"] as const;
const PACES = ["hush", "stroll", "sprint"] as const;
const SPANS = ["2", "6", "14"] as const;
const RANKS = ["2", "4", "6", "8"] as const;

const HOUR_KEY: Record<string, CrmV4CopyKey> = {
  dawn: "grtDawn",
  noon: "grtNoon",
  dusk: "grtDusk",
  night: "grtNight",
  peak: "grtPeakHour",
  quiet: "grtQuietHour",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "grtAuditSave",
  edit: "grtAuditEdit",
  note: "grtAuditNote",
  pace: "grtAuditPace",
  pin: "grtAuditPin",
  unpin: "grtAuditUnpin",
  hold: "grtAuditWait",
  resume: "grtAuditResume",
  shelve: "grtAuditFile",
  open: "grtAuditOpen",
  manner: "grtAuditManner",
  tag: "grtAuditTag",
  rank: "grtAuditRank",
  span: "grtAuditSpan",
  short: "grtAuditShort",
  flag: "grtAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  hush: "lcpHush",
  desk: "lcpDesk",
  hall: "lcpHall",
  lamp: "lcpLamp",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "lcpIvory",
  graphite: "lcpGraphite",
  champagne: "lcpChampagne",
};

type TraderRow = {
  id?: string;
  name?: string | null;
  lastContactAt?: string | null;
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

function hourLabel(v4: V4, hour: string): string {
  const key = HOUR_KEY[hour];
  return key ? v4(key) : v4("grtBlank");
}

function mannerLabel(v4: V4, manner: string): string {
  if (manner === "BOW") return v4("grtBow");
  if (manner === "WORD") return v4("grtWord");
  if (manner === "CARD") return v4("grtCard");
  return v4("grtBlankManner");
}

function paceLabel(v4: V4, pace: string): string {
  if (pace === "hush") return v4("grtHush");
  if (pace === "stroll") return v4("grtStroll");
  if (pace === "sprint") return v4("grtSprint");
  return v4("grtBlankPace");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("lcpUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("lcpUnmarked");
}

export function AtriumSlips({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<AtriumSlip[]>([]);
  const [views, setViews] = useState<AtriumView[]>([]);
  const [density, setDensity] = useState<AtriumDensity>("airy");
  const [sort, setSort] = useState<AtriumSort>("hour");
  const [tray, setTray] = useState<AtriumTray>("open");
  const [query, setQuery] = useState("");
  const [hostFilter, setHostFilter] = useState("all");
  const [mannerFilter, setMannerFilter] = useState("all");
  const [paceFilter, setPaceFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [spanFilter, setSpanFilter] = useState("all");
  const [rankFilter, setRankFilter] = useState("all");
  const [houseOnly, setHouseOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [desk, setDesk] = useState("noon");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [host, setHost] = useState("");
  const [hour, setHour] = useState("");
  const [manner, setManner] = useState("");
  const [pace, setPace] = useState("");
  const [spanDays, setSpanDays] = useState("");
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
    setCards(readSlips(readJson(ATP_KEY, [])));
    setViews(readSlipViews(readJson(ATP_VIEW_KEY, [])));
    setDensity(atriumDensity(readJson(ATP_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  const shown = sortSlips(visibleSlips(cards, tray, query, hostFilter, mannerFilter, paceFilter, hourFilter, spanFilter, rankFilter, houseOnly, peakOnly, quietOnly), sort);
  const focusAt = shown.length ? focus % shown.length : 0;
  const counts = slipCounts(cards, shown, desk);
  const timeline = slipTimeline(cards);
  const reminders = reminderSlips(cards);
  const idling = idleSlips(cards);
  const hosts = slipHosts(cards);
  const bars = slipBars(cards);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = shown.map((card) => card.id);
  const busy = busiestHost(cards);
  const clock = new Date().getUTCHours();
  const suggested = suggestManner(cards);
  const fair = fairHost(cards, hosts.join(", ") || "Ada, Bea");
  function store(next: AtriumSlip[]) {
    const saved = readSlips(next);
    setCards(saved);
    writeJson(ATP_KEY, saved);
  }
  function storeViews(next: AtriumView[]) {
    const saved = readSlipViews(next);
    setViews(saved);
    writeJson(ATP_VIEW_KEY, saved);
  }
  function storeDensity(next: AtriumDensity) {
    setDensity(next);
    writeJson(ATP_DENSITY_KEY, next);
  }
  function togglePick(id: string) {
    setPicked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }
  function applyView(view: AtriumView) {
    setTray(view.tray);
    setQuery(view.query);
    setHostFilter(view.host || "all");
    setMannerFilter(view.manner);
    setPaceFilter(view.pace);
    setHourFilter(view.hour);
    setSpanFilter(view.span);
    setRankFilter(view.rank);
  }
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setHost("");
        setHour("");
        setManner("");
        setPace("");
        setSpanDays("");
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
    <section className="c4-grt" aria-label={v4("grtTitle")} data-cards="1" data-desk="atrium" data-role={role} data-density={density} data-board={board}>
      <header className="c4-grt-mast">
        <p className="c4-grt-seal" data-logo="mono">{v4("grtLogo")}</p>
        <div>
          <p className="c4-grt-kicker">{v4("grtSub")}</p>
          <h2 className="c4-title">{v4("grtTitle")}</h2>
        </div>
        <ol className="c4-grt-index" aria-label={v4("grtTitle")}>
          <li data-tone="gold">{v4("grtChampagne")}</li>
          <li data-tone="ink">{v4("grtGraphite")}</li>
          <li data-tone="ivory">{v4("grtIvory")}</li>
        </ol>
      </header>
      <p className="c4-grt-links">
        <Link href={crmv4Href(base, "lcp")}>{v4("grtPlates")}</Link>
        <Link href={crmv4Href(base, "tags")}>{v4("grtTagsLink")}</Link>
        <Link href={crmv4Href(base, "thread")}>{v4("grtThread")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("grtCustomers")}</Link>
      </p>
      {viewer && <p className="c4-grt-note">{v4("grtViewer")}</p>}
      <p className="c4-grt-lead">{v4("grtKeys")}</p>
      <p className="c4-grt-hint">{v4("grtHint")}</p>
      <ul className="c4-grt-kpis" aria-label={v4("grtChart")}>
        <li><span>{v4("grtOpen")}</span><strong>{counts.open}</strong></li>
        <li><span>{v4("grtHeld")}</span><strong>{counts.held}</strong></li>
        <li><span>{v4("grtFile")}</span><strong>{counts.shelved}</strong></li>
        <li><span>{v4("grtPinned")}</span><strong>{counts.pinned}</strong></li>
        <li><span>{v4("grtPeak")}</span><strong>{counts.peak}</strong></li>
        <li><span>{v4("grtQuiet")}</span><strong>{counts.quiet}</strong></li>
        <li><span>{v4("grtSoon")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("grtRank")}</span><strong>{counts.rank}</strong></li>
        <li><span>{v4("grtHouse")}</span><strong>{counts.house}</strong></li>
        <li><span>{v4("grtOverdue")}</span><strong>{counts.overdue}</strong></li>
      </ul>
      <div className="c4-grt-chart" aria-label={v4("grtBars")}>
        {bars.map((bar) => (
          <div key={bar.hour} className="c4-grt-bar" data-hour={bar.hour}>
            <i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <span>{hourLabel(v4, bar.hour)}</span>
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <ol className="c4-grt-time" aria-label={v4("grtTimeline")}>
        {timeline.map((lane) => (
          <li key={lane.rank}><span>{lane.rank}</span><strong>{lane.titles.join(" · ")}</strong></li>
        ))}
      </ol>
      <div className="c4-grt-tools">
        <label className="c4-lab">
          <span>{v4("grtDesk")}</span>
          <select className="c4-select" aria-label={v4("grtDesk")} value={desk} onChange={(event) => setDesk(event.target.value)}>
            {ATRIUM_HOURS.map((item) => <option key={item} value={item}>{hourLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("grtSearch")}</span>
          <input ref={searchRef} className="c4-field c4-grt-search" aria-label={v4("grtSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        {(["open", "held", "shelved"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("grtOpen") : item === "held" ? v4("grtHeld") : v4("grtFile")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("grtHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((value) => !value)}>{v4("grtPeak")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((value) => !value)}>{v4("grtQuiet")}</button>
        <button type="button" className="c4-chip" data-on={sort === "host" ? "1" : "0"} onClick={() => setSort((value) => value === "hour" ? "host" : "hour")}>{sort === "host" ? v4("grtSortHost") : v4("grtSortHour")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "airy" ? "tight" : "airy")}>{density === "airy" ? v4("grtAiry") : v4("grtTight")}</button>
        <button type="button" className="c4-chip" onClick={() => setBoard((value) => value === "hall" ? "index" : "hall")}>{board === "hall" ? v4("grtHall") : v4("grtIndex")}</button>
      </div>
      <div className="c4-grt-tools">
        <select className="c4-select" aria-label={v4("grtHost")} value={hostFilter} onChange={(event) => setHostFilter(event.target.value)}>
          <option value="all">{v4("grtAll")}</option>
          {hosts.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("grtManner")} value={mannerFilter} onChange={(event) => setMannerFilter(event.target.value)}>
          <option value="all">{v4("grtAll")}</option>
          {MANNERS.map((item) => <option key={item} value={item}>{mannerLabel(v4, item.toUpperCase())}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("grtPace")} value={paceFilter} onChange={(event) => setPaceFilter(event.target.value)}>
          <option value="all">{v4("grtAll")}</option>
          {PACES.map((item) => <option key={item} value={item}>{paceLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("grtDesk")} value={hourFilter} onChange={(event) => setHourFilter(event.target.value)}>
          <option value="all">{v4("grtAll")}</option>
          <option value="peak">{v4("grtPeakHour")}</option>
          <option value="quiet">{v4("grtQuietHour")}</option>
          {ATRIUM_HOURS.map((item) => <option key={item} value={item}>{hourLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("grtSpan")} value={spanFilter} onChange={(event) => setSpanFilter(event.target.value)}>
          <option value="all">{v4("grtAll")}</option>
          {SPANS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("grtRank")} value={rankFilter} onChange={(event) => setRankFilter(event.target.value)}>
          <option value="all">{v4("grtAll")}</option>
          {RANKS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      <form className="c4-grt-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addSlip(cards, { id: `slip-${Date.now()}`, title, note, host, hour, manner, pace, span: spanDays, rank, tags });
        if (next === cards || next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <label className="c4-lab"><span>{v4("grtTitleField")}</span><input className="c4-field" aria-label={v4("grtTitleField")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("grtNote")}</span><input className="c4-field" aria-label={v4("grtNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <p className="c4-grt-meta">{v4("grtNoteOptional")}</p>
        <label className="c4-lab"><span>{v4("grtHost")}</span><input className="c4-field" aria-label={v4("grtHost")} value={host} disabled={viewer} onChange={(event) => setHost(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("grtDesk")}</span>
          <select className="c4-select" aria-label={v4("grtDawn")} value={hour} disabled={viewer} onChange={(event) => setHour(event.target.value)}>
            <option value="">{v4("grtBlank")}</option>
            {ATRIUM_HOURS.map((item) => <option key={item} value={item}>{hourLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("grtManner")}</span>
          <select className="c4-select" aria-label={v4("grtManner")} value={manner} disabled={viewer} onChange={(event) => setManner(event.target.value)}>
            <option value="">{v4("grtBlankManner")}</option>
            {MANNERS.map((item) => <option key={item} value={item}>{mannerLabel(v4, item.toUpperCase())}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("grtPace")}</span>
          <select className="c4-select" aria-label={v4("grtPace")} value={pace} disabled={viewer} onChange={(event) => setPace(event.target.value)}>
            <option value="">{v4("grtBlankPace")}</option>
            {PACES.map((item) => <option key={item} value={item}>{paceLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("grtSpan")}</span>
          <select className="c4-select" aria-label={v4("grtSpan")} value={spanDays} disabled={viewer} onChange={(event) => setSpanDays(event.target.value)}>
            <option value="">{v4("grtBlankSpan")}</option>
            {SPANS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("grtRank")}</span>
          <select className="c4-select" aria-label={v4("grtRank")} value={rank} disabled={viewer} onChange={(event) => setRank(event.target.value)}>
            {RANKS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("grtTags")}</span><input className="c4-field" aria-label={v4("grtTags")} value={tags} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("grtAdd")}</button>
      </form>
      <form className="c4-grt-tools" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addSlipView(views, { id: `view-${Date.now()}`, name: viewName, tray, query, host: hostFilter, manner: mannerFilter, pace: paceFilter, hour: hourFilter, span: spanFilter, rank: rankFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("grtViewName")}</span><input className="c4-field" aria-label={v4("grtViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("grtSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-grt-view">
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("grtApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropSlipView(views, view.id))}>{v4("grtDropView")}</button>
          </span>
        ))}
      </form>
      {picked.length > 0 && (
        <div className="c4-grt-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSlipPin(cards, picked))}>{v4("grtBulkPin")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSlipFile(cards, picked))}>{v4("grtBulkFile")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSlipSprint(cards, picked))}>{v4("grtBulkSprint")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSlipCard(cards, picked))}>{v4("grtBulkCard")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSlipTag(cards, picked, "b"))}>{v4("grtBulkTag")}</button>
        </div>
      )}
      <p className="c4-grt-meta">{v4("grtSuggest")} {mannerLabel(v4, suggested)} · {v4("grtFair")} {fair} · {v4("grtBusy")} {busy || v4("grtBlankHost")} · {v4("grtNeighbors")} {neighborSlipCount(cards)} · {v4("grtClash")} {clashHourCount(cards)} · {v4("grtSpanHint")} {suggestSpan(cards, clock)}</p>
      {(reminders.length > 0 || idling.length > 0) && (
        <p className="c4-grt-meta">{v4("grtDue")} {reminders.map((card) => card.title).join(" · ")} · {v4("grtIdle")} {idling.map((card) => card.title).join(" · ")}</p>
      )}
      {!shown.length && <p className="c4-grt-empty">{v4("grtEmpty")}</p>}
      <ol className="c4-grt-board" data-density={density}>
        {shown.map((card, index) => (
          <li key={card.id} className="c4-grt-card" data-on={index === focusAt ? "1" : "0"} data-pinned={card.pinned ? "1" : "0"} data-overdue={overdueSlip(card) ? "1" : "0"} data-peak={peakHour(card.hour) ? "1" : "0"} data-quiet={quietHour(card.hour) ? "1" : "0"} data-house={houseManner(card.manner) ? "1" : "0"} data-rush={rushSlip(card) ? "1" : "0"} data-idle={idleSlip(card) ? "1" : "0"} data-resting={restingSlip(card) ? "1" : "0"} data-late={lateSlip(card, desk) ? "1" : "0"}>
            <label className="c4-grt-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => togglePick(card.id)} /></label>
            <div>
              <input className="c4-field" aria-label={v4("grtEdit")} value={card.title} disabled={viewer} onChange={(event) => store(editSlip(cards, card.id, event.target.value))} />
              <input className="c4-field" aria-label={v4("grtEditNote")} aria-required={false} value={card.note} disabled={viewer} onChange={(event) => store(editSlipNote(cards, card.id, event.target.value))} />
              <p className="c4-grt-meta">{card.host || v4("grtBlankHost")} · {hourLabel(v4, card.hour)} · {mannerLabel(v4, card.manner)} · {paceLabel(v4, card.pace)} · {card.span ?? v4("grtBlankSpan")} · {v4("grtRank")} {card.rank} · {card.tags.join(" ") || v4("grtTags")}</p>
              <p className="c4-grt-sla" aria-label={v4("grtSpan")}><i style={{ width: `${Math.round(((card.span ?? 0) / 14) * 100)}%` }} /></p>
              <p className="c4-grt-meta">{hourLabel(v4, desk)} · {AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : v4("grtAuditSave")}</p>
              <div className="c4-grt-tools">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("grtUnpin") : v4("grtPin")}</button>
                <button type="button" className="c4-btn" disabled={viewer || card.shelved} onClick={() => store(setSlipWait(cards, card.id, !card.held))}>{card.held ? v4("grtResume") : v4("grtWait")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipFile(cards, card.id, !card.shelved))}>{card.shelved ? v4("grtOpenAgain") : v4("grtFile")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("grtUnstar") : v4("grtStar")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cyclePace(cards, card.id))}>{v4("grtTempo")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lengthenSpan(cards, card.id))}>{v4("grtLengthen")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(shortenSpan(cards, card.id))}>{v4("grtShorten")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseRank(cards, card.id))}>{v4("grtRaise")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerRank(cards, card.id))}>{v4("grtLower")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipManner(cards, card.id, card.manner === "CARD" ? "bow" : "card"))}>{v4("grtInk")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addSlipTag(cards, card.id, "c"))}>{v4("grtTags")}</button>
                <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(slipCopy(card)); setCopied(card.id); }}>{copied === card.id ? v4("grtCopied") : v4("grtCopy")}</button>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <button type="button" className="c4-btn" onClick={() => download("atrium-slips.csv", slipCsv(shown, desk))}>{v4("grtCsv")}</button>
    </section>
  );
}

export function ContactPlates({ base, v4 }: { base: string; v4: V4 }) {
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
    note: { lastContactAt: textField(row.lastContactAt) } satisfies PlateValue,
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
    const nextHidden = readHiddenPlates(readJson(LCP_KEY, []), present);
    const nextReviewed = readReviewedPlates(readJson(LCP_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(LCP_KEY, nextHidden);
    writeJson(LCP_REVIEW_KEY, nextReviewed);
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
    writeJson(LCP_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(LCP_REVIEW_KEY, next);
  }
  return (
    <section className="c4-lcp" aria-label={v4("lcpTitle")} data-plates="1" data-traders={rows.length} data-role={role}>
      <header className="c4-lcp-mast">
        <p className="c4-lcp-seal" data-logo="mono">{v4("lcpLogo")}</p>
        <div>
          <p className="c4-lcp-kicker">{v4("lcpSub")}</p>
          <h2 className="c4-title">{v4("lcpTitle")}</h2>
        </div>
        <ol className="c4-lcp-index" aria-label={v4("lcpTitle")}>
          <li data-tone="gold">{v4("lcpChampagne")}</li>
          <li data-tone="ink">{v4("lcpGraphite")}</li>
          <li data-tone="ivory">{v4("lcpIvory")}</li>
        </ol>
      </header>
      <p className="c4-lcp-links">
        <Link href={crmv4Href(base, "grt")}>{v4("lcpCards")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("grtCustomers")}</Link>
      </p>
      <p className="c4-lcp-hint">{v4("lcpHint")}</p>
      {viewer && <p className="c4-lcp-note">{v4("lcpViewer")}</p>}
      {queue.loading && <p className="c4-lcp-meta">{v4("lcpEmpty")}</p>}
      {queue.error && <p className="c4-lcp-meta">{queue.error}</p>}
      <ul className="c4-lcp-kpis" aria-label={v4("lcpRules")}>
        <li><span>{v4("lcpLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("lcpUnmarked")}</strong></li>
        <li><span>{v4("lcpToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("lcpUnmarked")}</strong></li>
        <li><span>{v4("lcpShared")}</span><strong>{sharedPlateCount(rows)}</strong></li>
        <li><span>{v4("lcpShare")}</span><strong>{plateShare(lanePlateCount(rows, "hush"), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("lcpWide")}</span><strong>{rows.filter((row) => plateWide(row.note)).length}</strong></li>
        <li><span>{v4("lcpNotch")}</span><strong>{rows.filter((row) => plateNotch(row.note)).length}</strong></li>
        <li><span>{v4("lcpEcho")}</span><strong>{rows.filter((row) => plateEcho(row.note)).length}</strong></li>
        <li><span>{v4("lcpLeap")}</span><strong>{rows.filter((row) => plateLeap(row.note)).length}</strong></li>
        <li><span>{v4("lcpWeekend")}</span><strong>{rows.filter((row) => plateSpoken(row.note)).length}</strong></li>
        <li><span>{v4("lcpIvory")}</span><strong>{huePlateCount(rows, "ivory")}</strong></li>
      </ul>
      <div className="c4-lcp-chart" aria-label={v4("lcpRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-lcp-bar" data-on={lane === bar.lane ? "1" : "0"} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <span>{laneLabel(v4, bar.lane)}</span>
            <strong>{bar.count}</strong>
          </button>
        ))}
      </div>
      <div className="c4-lcp-tools">
        <input ref={searchRef} className="c4-field c4-lcp-search" aria-label={v4("lcpSearch")} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("lcpSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("lcpAll") : hueLabel(v4, item)}</button>
        ))}
        {(["all", "hush", "desk", "hall", "lamp", "wide", "notch", "leap", "weekend"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{item === "all" ? v4("lcpShapeAll") : item === "wide" ? v4("lcpShapeWide") : item === "notch" ? v4("lcpShapeNotch") : item === "leap" ? v4("lcpShapeLeap") : item === "weekend" ? v4("lcpShapeWeekend") : laneLabel(v4, item)}</button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("lcpAll") : item === "reviewed" ? v4("lcpReviewed") : v4("lcpUnreviewed")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("lcpShow")}</button>
      </div>
      <ul className="c4-lcp-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(togglePlate(hidden, item))}>{hidden.includes(item) ? v4("lcpShow") : v4("lcpHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-lcp-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkPlateReview(reviewed, picked, true))}>{v4("lcpBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkPlateReview(reviewed, picked, false))}>{v4("lcpBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-lcp-empty">{v4("lcpEmpty")}</p>}
      <ol className="c4-lcp-board">
        {shown.map((row, index) => {
          const state = plateState(row.note);
          if (state === "") return null;
          return (
            <li key={row.id} className="c4-lcp-card" data-on={index === focusAt ? "1" : "0"} data-state={state} data-lane={plateLane(row.note)} data-hue={plateHue(row.note)} data-reviewed={reviewed.includes(row.id) ? "1" : "0"}>
              <label className="c4-lcp-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label} onChange={() => setPicked((current) => current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id])} /></label>
              <div>
                <strong>{row.label || v4("lcpUnmarked")}</strong>
                <p className="c4-lcp-meta">{plateStamp(row.note) || v4("lcpUnmarked")} · {laneLabel(v4, plateLane(row.note))} · {hueLabel(v4, plateHue(row.note))} · {v4("lcpStep")} {plateStep(row.note)}</p>
                <p className="c4-lcp-meta">{plateWide(row.note) ? v4("lcpWide") : ""} {plateNotch(row.note) ? v4("lcpNotch") : ""} {plateEcho(row.note) ? v4("lcpEcho") : ""} {plateLeap(row.note) ? v4("lcpLeap") : ""} {plateSpoken(row.note) ? v4("lcpWeekend") : ""}</p>
                <div className="c4-lcp-tools">
                  <button type="button" className="c4-btn" disabled={viewer || state !== "set"} onClick={() => storeReviewed(togglePlateReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("lcpReviewed") : v4("lcpReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(plateCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("lcpCopied") : v4("lcpCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="c4-lcp-tools">
        <button type="button" className="c4-btn" onClick={() => download("contact-lanes.csv", plateLanesCsv(rows))}>{v4("lcpCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("contact-rows.csv", plateRowsCsv(rows, reviewed))}>{v4("lcpRowCsv")}</button>
      </div>
    </section>
  );
}
