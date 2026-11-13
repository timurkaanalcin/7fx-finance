"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  DOOR_PLACES,
  MBP_KEY,
  MBP_REVIEW_KEY,
  VSL_DENSITY_KEY,
  VSL_KEY,
  VSL_VIEW_KEY,
  addVest,
  addVestTag,
  addVestView,
  bulkPlateReview,
  bulkVestFile,
  bulkVestLinen,
  bulkVestPin,
  bulkVestRush,
  bulkVestTag,
  busiestPorter,
  clashPlaceCount,
  cycleGait,
  dropVestView,
  editVest,
  editVestNote,
  fairPorter,
  gaitFocusedVest,
  houseCloth,
  idleVest,
  idleVests,
  lanePlateCount,
  lateVest,
  leadingPlate,
  leadingPlateHue,
  lengthenFocusedVest,
  lengthenWait,
  lowerFocusedVest,
  lowerRank,
  moveVestFocus,
  neighborVestCount,
  overdueVest,
  peakPlace,
  pinFocusedVest,
  plateCopy,
  plateEcho,
  plateHue,
  plateLane,
  plateLanes,
  plateLanesCsv,
  plateLeap,
  plateNotch,
  platePlus,
  plateRowsCsv,
  plateShare,
  plateSpoken,
  plateStamp,
  plateStep,
  plateWide,
  presentPlateLanes,
  quietPlace,
  raiseFocusedVest,
  raiseRank,
  readHiddenPlates,
  readReviewedPlates,
  readVestViews,
  readVests,
  reminderVests,
  restingVest,
  rushVest,
  seatFocusedVest,
  sharedPlateCount,
  setVestCloset,
  setVestCloth,
  setVestPin,
  setVestSeat,
  setVestStar,
  shortenFocusedVest,
  shortenWait,
  sortVests,
  starFocusedVest,
  suggestCloth,
  suggestWait,
  tagFocusedVest,
  togglePlate,
  togglePlateReview,
  vestibuleDensity,
  vestBars,
  vestCopy,
  vestCounts,
  vestCsv,
  vestPorters,
  vestTimeline,
  visiblePlateLanes,
  visiblePlates,
  visibleVests,
  type MailReview,
  type MailRow,
  type MailShape,
  type MailValue,
  type VestibuleDensity,
  type VestibuleSlip,
  type VestibuleSort,
  type VestibuleTray,
  type VestibuleView,
} from "@/lib/crmv4/round259";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const CLOTHS = ["wool", "silk", "linen"] as const;
const GAITS = ["still", "walk", "rush"] as const;
const WAITS = ["3", "9", "21"] as const;
const RANKS = ["1", "3", "5", "7"] as const;

const PLACE_KEY: Record<string, CrmV4CopyKey> = {
  porch: "vslPorch",
  court: "vslCourt",
  stair: "vslStair",
  loft: "vslLoft",
  peak: "vslPeakPlace",
  quiet: "vslQuietPlace",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "vslAuditSave",
  edit: "vslAuditEdit",
  note: "vslAuditNote",
  gait: "vslAuditGait",
  pin: "vslAuditPin",
  unpin: "vslAuditUnpin",
  seat: "vslAuditSeat",
  resume: "vslAuditResume",
  closet: "vslAuditFile",
  open: "vslAuditOpen",
  cloth: "vslAuditCloth",
  tag: "vslAuditTag",
  rank: "vslAuditRank",
  wait: "vslAuditWait",
  short: "vslAuditShort",
  flag: "vslAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  brief: "mbpBrief",
  desk: "mbpDesk",
  hall: "mbpHall",
  long: "mbpLong",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "mbpIvory",
  graphite: "mbpGraphite",
  champagne: "mbpChampagne",
};

type TraderRow = {
  id?: string;
  name?: string | null;
  email?: string | null;
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
  return key ? v4(key) : v4("vslBlank");
}

function clothLabel(v4: V4, cloth: string): string {
  if (cloth === "WOOL") return v4("vslWool");
  if (cloth === "SILK") return v4("vslSilk");
  if (cloth === "LINEN") return v4("vslLinen");
  return v4("vslBlankCloth");
}

function gaitLabel(v4: V4, gait: string): string {
  if (gait === "still") return v4("vslStill");
  if (gait === "walk") return v4("vslWalk");
  if (gait === "rush") return v4("vslRush");
  return v4("vslBlankGait");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("mbpUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("mbpUnmarked");
}

export function VestibuleSlips({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<VestibuleSlip[]>([]);
  const [views, setViews] = useState<VestibuleView[]>([]);
  const [density, setDensity] = useState<VestibuleDensity>("airy");
  const [sort, setSort] = useState<VestibuleSort>("place");
  const [tray, setTray] = useState<VestibuleTray>("door");
  const [query, setQuery] = useState("");
  const [porterFilter, setPorterFilter] = useState("all");
  const [clothFilter, setClothFilter] = useState("all");
  const [gaitFilter, setGaitFilter] = useState("all");
  const [placeFilter, setPlaceFilter] = useState("all");
  const [waitFilter, setWaitFilter] = useState("all");
  const [rankFilter, setRankFilter] = useState("all");
  const [houseOnly, setHouseOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [desk, setDesk] = useState("court");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [porter, setPorter] = useState("");
  const [place, setPlace] = useState("");
  const [cloth, setCloth] = useState("");
  const [gait, setGait] = useState("");
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
    setCards(readVests(readJson(VSL_KEY, [])));
    setViews(readVestViews(readJson(VSL_VIEW_KEY, [])));
    setDensity(vestibuleDensity(readJson(VSL_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  const shown = sortVests(visibleVests(cards, tray, query, porterFilter, clothFilter, gaitFilter, placeFilter, waitFilter, rankFilter, houseOnly, peakOnly, quietOnly), sort);
  const focusAt = shown.length ? focus % shown.length : 0;
  const counts = vestCounts(cards, shown, desk);
  const timeline = vestTimeline(cards);
  const reminders = reminderVests(cards);
  const idling = idleVests(cards);
  const porters = vestPorters(cards);
  const bars = vestBars(cards);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = shown.map((card) => card.id);
  const busy = busiestPorter(cards);
  const clock = new Date().getUTCHours();
  const suggested = suggestCloth(cards);
  const fair = fairPorter(cards, porters.join(", ") || "Ada, Bea");
  function store(next: VestibuleSlip[]) {
    const saved = readVests(next);
    setCards(saved);
    writeJson(VSL_KEY, saved);
  }
  function storeViews(next: VestibuleView[]) {
    const saved = readVestViews(next);
    setViews(saved);
    writeJson(VSL_VIEW_KEY, saved);
  }
  function storeDensity(next: VestibuleDensity) {
    setDensity(next);
    writeJson(VSL_DENSITY_KEY, next);
  }
  function togglePick(id: string) {
    setPicked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }
  function applyView(view: VestibuleView) {
    setTray(view.tray);
    setQuery(view.query);
    setPorterFilter(view.porter || "all");
    setClothFilter(view.cloth);
    setGaitFilter(view.gait);
    setPlaceFilter(view.place);
    setWaitFilter(view.wait);
    setRankFilter(view.rank);
  }
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setPorter("");
        setPlace("");
        setCloth("");
        setGait("");
        setWaitMin("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveVestFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveVestFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        if (!viewer) store(seatFocusedVest(cards, ids, focusAt));
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        if (!viewer) store(pinFocusedVest(cards, ids, focusAt));
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        if (!viewer) store(gaitFocusedVest(cards, ids, focusAt));
        return;
      }
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        if (!viewer) store(lengthenFocusedVest(cards, ids, focusAt));
        return;
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        if (!viewer) store(shortenFocusedVest(cards, ids, focusAt));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        if (!viewer) store(tagFocusedVest(cards, ids, focusAt, "x"));
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        if (!viewer) store(starFocusedVest(cards, ids, focusAt));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        if (!viewer) store(raiseFocusedVest(cards, ids, focusAt));
        return;
      }
      if (event.key === "y" || event.key === "Y") {
        event.preventDefault();
        if (!viewer) store(lowerFocusedVest(cards, ids, focusAt));
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
    <section className="c4-vsl" aria-label={v4("vslTitle")} data-cards="1" data-desk="vestibule" data-role={role} data-density={density} data-board={board}>
      <header className="c4-vsl-mast">
        <p className="c4-vsl-seal" data-logo="mono">{v4("vslLogo")}</p>
        <div>
          <p className="c4-vsl-kicker">{v4("vslSub")}</p>
          <h2 className="c4-title">{v4("vslTitle")}</h2>
        </div>
        <ol className="c4-vsl-index" aria-label={v4("vslTitle")}>
          <li data-tone="gold">{v4("vslChampagne")}</li>
          <li data-tone="ink">{v4("vslGraphite")}</li>
          <li data-tone="ivory">{v4("vslIvory")}</li>
        </ol>
      </header>
      <p className="c4-vsl-links">
        <Link href={crmv4Href(base, "mbp")}>{v4("vslPlates")}</Link>
        <Link href={crmv4Href(base, "payboard")}>{v4("vslPayboard")}</Link>
        <Link href={crmv4Href(base, "handoff")}>{v4("vslHandoff")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("vslCustomers")}</Link>
      </p>
      {viewer && <p className="c4-vsl-note">{v4("vslViewer")}</p>}
      <p className="c4-vsl-lead">{v4("vslKeys")}</p>
      <p className="c4-vsl-hint">{v4("vslHint")}</p>
      <ul className="c4-vsl-kpis" aria-label={v4("vslChart")}>
        <li><span>{v4("vslOpen")}</span><strong>{counts.door}</strong></li>
        <li><span>{v4("vslHeld")}</span><strong>{counts.seat}</strong></li>
        <li><span>{v4("vslFile")}</span><strong>{counts.closet}</strong></li>
        <li><span>{v4("vslPinned")}</span><strong>{counts.pinned}</strong></li>
        <li><span>{v4("vslPeak")}</span><strong>{counts.peak}</strong></li>
        <li><span>{v4("vslQuiet")}</span><strong>{counts.quiet}</strong></li>
        <li><span>{v4("vslSoon")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("vslRank")}</span><strong>{counts.rank}</strong></li>
        <li><span>{v4("vslHouse")}</span><strong>{counts.house}</strong></li>
        <li><span>{v4("vslOverdue")}</span><strong>{counts.overdue}</strong></li>
      </ul>
      <div className="c4-vsl-chart" aria-label={v4("vslBars")}>
        {bars.map((bar) => (
          <div key={bar.place} className="c4-vsl-bar" data-place={bar.place}>
            <i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <span>{placeLabel(v4, bar.place)}</span>
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <ol className="c4-vsl-time" aria-label={v4("vslTimeline")}>
        {timeline.map((lane) => (
          <li key={lane.rank}><span>{lane.rank}</span><strong>{lane.titles.join(" · ")}</strong></li>
        ))}
      </ol>
      <div className="c4-vsl-tools">
        <label className="c4-lab">
          <span>{v4("vslDesk")}</span>
          <select className="c4-select" aria-label={v4("vslDesk")} value={desk} onChange={(event) => setDesk(event.target.value)}>
            {DOOR_PLACES.map((item) => <option key={item} value={item}>{placeLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("vslSearch")}</span>
          <input ref={searchRef} className="c4-field c4-vsl-search" aria-label={v4("vslSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        {(["door", "seat", "closet"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "door" ? v4("vslOpen") : item === "seat" ? v4("vslHeld") : v4("vslFile")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("vslHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((value) => !value)}>{v4("vslPeak")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((value) => !value)}>{v4("vslQuiet")}</button>
        <button type="button" className="c4-chip" data-on={sort === "porter" ? "1" : "0"} onClick={() => setSort((value) => value === "place" ? "porter" : "place")}>{sort === "porter" ? v4("vslSortPorter") : v4("vslSortPlace")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "airy" ? "tight" : "airy")}>{density === "airy" ? v4("vslAiry") : v4("vslTight")}</button>
        <button type="button" className="c4-chip" onClick={() => setBoard((value) => value === "hall" ? "index" : "hall")}>{board === "hall" ? v4("vslHall") : v4("vslIndex")}</button>
      </div>
      <div className="c4-vsl-tools">
        <select className="c4-select" aria-label={v4("vslPorter")} value={porterFilter} onChange={(event) => setPorterFilter(event.target.value)}>
          <option value="all">{v4("vslAll")}</option>
          {porters.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("vslCloth")} value={clothFilter} onChange={(event) => setClothFilter(event.target.value)}>
          <option value="all">{v4("vslAll")}</option>
          {CLOTHS.map((item) => <option key={item} value={item}>{clothLabel(v4, item.toUpperCase())}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("vslGait")} value={gaitFilter} onChange={(event) => setGaitFilter(event.target.value)}>
          <option value="all">{v4("vslAll")}</option>
          {GAITS.map((item) => <option key={item} value={item}>{gaitLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("vslDesk")} value={placeFilter} onChange={(event) => setPlaceFilter(event.target.value)}>
          <option value="all">{v4("vslAll")}</option>
          <option value="peak">{v4("vslPeakPlace")}</option>
          <option value="quiet">{v4("vslQuietPlace")}</option>
          {DOOR_PLACES.map((item) => <option key={item} value={item}>{placeLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("vslWait")} value={waitFilter} onChange={(event) => setWaitFilter(event.target.value)}>
          <option value="all">{v4("vslAll")}</option>
          {WAITS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("vslRank")} value={rankFilter} onChange={(event) => setRankFilter(event.target.value)}>
          <option value="all">{v4("vslAll")}</option>
          {RANKS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      <form className="c4-vsl-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addVest(cards, { id: `vest-${Date.now()}`, title, note, porter, place, cloth, gait, wait: waitMin, rank, tags });
        if (next === cards || next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <label className="c4-lab"><span>{v4("vslTitleField")}</span><input className="c4-field" aria-label={v4("vslTitleField")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("vslNote")}</span><input className="c4-field" aria-label={v4("vslNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <p className="c4-vsl-meta">{v4("vslNoteOptional")}</p>
        <label className="c4-lab"><span>{v4("vslPorter")}</span><input className="c4-field" aria-label={v4("vslPorter")} value={porter} disabled={viewer} onChange={(event) => setPorter(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("vslDesk")}</span>
          <select className="c4-select" aria-label={v4("vslPorch")} value={place} disabled={viewer} onChange={(event) => setPlace(event.target.value)}>
            <option value="">{v4("vslBlank")}</option>
            {DOOR_PLACES.map((item) => <option key={item} value={item}>{placeLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("vslCloth")}</span>
          <select className="c4-select" aria-label={v4("vslCloth")} value={cloth} disabled={viewer} onChange={(event) => setCloth(event.target.value)}>
            <option value="">{v4("vslBlankCloth")}</option>
            {CLOTHS.map((item) => <option key={item} value={item}>{clothLabel(v4, item.toUpperCase())}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("vslGait")}</span>
          <select className="c4-select" aria-label={v4("vslGait")} value={gait} disabled={viewer} onChange={(event) => setGait(event.target.value)}>
            <option value="">{v4("vslBlankGait")}</option>
            {GAITS.map((item) => <option key={item} value={item}>{gaitLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("vslWait")}</span>
          <select className="c4-select" aria-label={v4("vslWait")} value={waitMin} disabled={viewer} onChange={(event) => setWaitMin(event.target.value)}>
            <option value="">{v4("vslBlankWait")}</option>
            {WAITS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("vslRank")}</span>
          <select className="c4-select" aria-label={v4("vslRank")} value={rank} disabled={viewer} onChange={(event) => setRank(event.target.value)}>
            {RANKS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("vslTags")}</span><input className="c4-field" aria-label={v4("vslTags")} value={tags} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("vslAdd")}</button>
      </form>
      <form className="c4-vsl-tools" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addVestView(views, { id: `view-${Date.now()}`, name: viewName, tray, query, porter: porterFilter, cloth: clothFilter, gait: gaitFilter, place: placeFilter, wait: waitFilter, rank: rankFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("vslViewName")}</span><input className="c4-field" aria-label={v4("vslViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("vslSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-vsl-view">
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("vslApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropVestView(views, view.id))}>{v4("vslDropView")}</button>
          </span>
        ))}
      </form>
      {picked.length > 0 && (
        <div className="c4-vsl-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkVestPin(cards, picked))}>{v4("vslBulkPin")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkVestFile(cards, picked))}>{v4("vslBulkFile")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkVestRush(cards, picked))}>{v4("vslBulkRush")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkVestLinen(cards, picked))}>{v4("vslBulkLinen")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkVestTag(cards, picked, "y"))}>{v4("vslBulkTag")}</button>
        </div>
      )}
      <p className="c4-vsl-meta">{v4("vslSuggest")} {clothLabel(v4, suggested)} · {v4("vslFair")} {fair} · {v4("vslBusy")} {busy || v4("vslBlankPorter")} · {v4("vslNeighbors")} {neighborVestCount(cards)} · {v4("vslClash")} {clashPlaceCount(cards)} · {v4("vslWaitHint")} {suggestWait(cards, clock)}</p>
      {(reminders.length > 0 || idling.length > 0) && (
        <p className="c4-vsl-meta">{v4("vslDue")} {reminders.map((card) => card.title).join(" · ")} · {v4("vslIdle")} {idling.map((card) => card.title).join(" · ")}</p>
      )}
      {!shown.length && <p className="c4-vsl-empty">{v4("vslEmpty")}</p>}
      <ol className="c4-vsl-board" data-density={density}>
        {shown.map((card, index) => (
          <li key={card.id} className="c4-vsl-card" data-on={index === focusAt ? "1" : "0"} data-pinned={card.pinned ? "1" : "0"} data-overdue={overdueVest(card) ? "1" : "0"} data-peak={peakPlace(card.place) ? "1" : "0"} data-quiet={quietPlace(card.place) ? "1" : "0"} data-house={houseCloth(card.cloth) ? "1" : "0"} data-rush={rushVest(card) ? "1" : "0"} data-idle={idleVest(card) ? "1" : "0"} data-resting={restingVest(card) ? "1" : "0"} data-late={lateVest(card, desk) ? "1" : "0"}>
            <label className="c4-vsl-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => togglePick(card.id)} /></label>
            <div>
              <input className="c4-field" aria-label={v4("vslEdit")} value={card.title} disabled={viewer} onChange={(event) => store(editVest(cards, card.id, event.target.value))} />
              <input className="c4-field" aria-label={v4("vslEditNote")} aria-required={false} value={card.note} disabled={viewer} onChange={(event) => store(editVestNote(cards, card.id, event.target.value))} />
              <p className="c4-vsl-meta">{card.porter || v4("vslBlankPorter")} · {placeLabel(v4, card.place)} · {clothLabel(v4, card.cloth)} · {gaitLabel(v4, card.gait)} · {card.wait ?? v4("vslBlankWait")} · {v4("vslRank")} {card.rank} · {card.tags.join(" ") || v4("vslTags")}</p>
              <p className="c4-vsl-sla" aria-label={v4("vslWait")}><i style={{ width: `${Math.round(((card.wait ?? 0) / 21) * 100)}%` }} /></p>
              <p className="c4-vsl-meta">{placeLabel(v4, desk)} · {AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : v4("vslAuditSave")}</p>
              <div className="c4-vsl-tools">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setVestPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("vslUnpin") : v4("vslPin")}</button>
                <button type="button" className="c4-btn" disabled={viewer || card.closed} onClick={() => store(setVestSeat(cards, card.id, !card.seated))}>{card.seated ? v4("vslResume") : v4("vslHeld")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setVestCloset(cards, card.id, !card.closed))}>{card.closed ? v4("vslOpenAgain") : v4("vslFile")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setVestStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("vslUnstar") : v4("vslStar")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleGait(cards, card.id))}>{v4("vslTempo")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lengthenWait(cards, card.id))}>{v4("vslLengthen")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(shortenWait(cards, card.id))}>{v4("vslShorten")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseRank(cards, card.id))}>{v4("vslRaise")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerRank(cards, card.id))}>{v4("vslLower")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setVestCloth(cards, card.id, card.cloth === "LINEN" ? "wool" : "linen"))}>{v4("vslCloth")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addVestTag(cards, card.id, "z"))}>{v4("vslTags")}</button>
                <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(vestCopy(card)); setCopied(card.id); }}>{copied === card.id ? v4("vslCopied") : v4("vslCopy")}</button>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <button type="button" className="c4-btn" onClick={() => download("vestibule-slips.csv", vestCsv(shown, desk))}>{v4("vslCsv")}</button>
    </section>
  );
}

export function MailboxPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: TraderRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [shape, setShape] = useState<MailShape>("all");
  const [review, setReview] = useState<MailReview>("all");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<MailRow[]>(() => (queue.data?.users || []).map((row, index) => ({
    id: row.id ? `trader-${row.id}` : `trader-${index}`,
    label: textField(row.name),
    note: { email: textField(row.email) } satisfies MailValue,
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
    const nextHidden = readHiddenPlates(readJson(MBP_KEY, []), present);
    const nextReviewed = readReviewedPlates(readJson(MBP_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(MBP_KEY, nextHidden);
    writeJson(MBP_REVIEW_KEY, nextReviewed);
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
        setFocus((index) => moveVestFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveVestFocus(index, shown.length, -1));
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
    writeJson(MBP_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(MBP_REVIEW_KEY, next);
  }
  return (
    <section className="c4-mbp" aria-label={v4("mbpTitle")} data-plates="1" data-traders={rows.length} data-role={role}>
      <header className="c4-mbp-mast">
        <p className="c4-mbp-seal" data-logo="mono">{v4("mbpLogo")}</p>
        <div>
          <p className="c4-mbp-kicker">{v4("mbpSub")}</p>
          <h2 className="c4-title">{v4("mbpTitle")}</h2>
        </div>
        <ol className="c4-mbp-index" aria-label={v4("mbpTitle")}>
          <li data-tone="gold">{v4("mbpChampagne")}</li>
          <li data-tone="ink">{v4("mbpGraphite")}</li>
          <li data-tone="ivory">{v4("mbpIvory")}</li>
        </ol>
      </header>
      <p className="c4-mbp-links">
        <Link href={crmv4Href(base, "vsl")}>{v4("mbpCards")}</Link>
        <Link href={crmv4Href(base, "payboard")}>{v4("vslPayboard")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("vslCustomers")}</Link>
      </p>
      <p className="c4-mbp-hint">{v4("mbpHint")}</p>
      {viewer && <p className="c4-mbp-note">{v4("mbpViewer")}</p>}
      {queue.loading && <p className="c4-mbp-meta">{v4("mbpEmpty")}</p>}
      {queue.error && <p className="c4-mbp-meta">{queue.error}</p>}
      <ul className="c4-mbp-kpis" aria-label={v4("mbpRules")}>
        <li><span>{v4("mbpLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("mbpUnmarked")}</strong></li>
        <li><span>{v4("mbpToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("mbpUnmarked")}</strong></li>
        <li><span>{v4("mbpShared")}</span><strong>{sharedPlateCount(rows)}</strong></li>
        <li><span>{v4("mbpShare")}</span><strong>{plateShare(lanePlateCount(rows, "brief"), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("mbpWide")}</span><strong>{rows.filter((row) => plateWide(row.note)).length}</strong></li>
        <li><span>{v4("mbpNotch")}</span><strong>{rows.filter((row) => plateNotch(row.note)).length}</strong></li>
        <li><span>{v4("mbpEcho")}</span><strong>{rows.filter((row) => plateEcho(row.note)).length}</strong></li>
        <li><span>{v4("mbpLeap")}</span><strong>{rows.filter((row) => plateLeap(row.note)).length}</strong></li>
        <li><span>{v4("mbpPlus")}</span><strong>{rows.filter((row) => platePlus(row.note)).length}</strong></li>
        <li><span>{v4("mbpVowels")}</span><strong>{rows.filter((row) => plateSpoken(row.note)).length}</strong></li>
      </ul>
      <div className="c4-mbp-chart" aria-label={v4("mbpRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-mbp-bar" data-on={lane === bar.lane ? "1" : "0"} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <span>{laneLabel(v4, bar.lane)}</span>
            <strong>{bar.count}</strong>
          </button>
        ))}
      </div>
      <div className="c4-mbp-tools">
        <input ref={searchRef} className="c4-field c4-mbp-search" aria-label={v4("mbpSearch")} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("mbpSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("mbpAll") : hueLabel(v4, item)}</button>
        ))}
        {(["all", "brief", "desk", "hall", "long", "wide", "notch", "leap", "plus", "vowels"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>
            {item === "all" ? v4("mbpShapeAll") : item === "wide" ? v4("mbpShapeWide") : item === "notch" ? v4("mbpShapeNotch") : item === "leap" ? v4("mbpShapeLeap") : item === "plus" ? v4("mbpShapePlus") : item === "vowels" ? v4("mbpShapeVowels") : laneLabel(v4, item)}
          </button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("mbpAll") : item === "reviewed" ? v4("mbpReviewed") : v4("mbpUnreviewed")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("mbpShow")}</button>
      </div>
      <ul className="c4-mbp-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(togglePlate(hidden, item))}>{hidden.includes(item) ? v4("mbpShow") : v4("mbpHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-mbp-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkPlateReview(reviewed, picked, true))}>{v4("mbpBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkPlateReview(reviewed, picked, false))}>{v4("mbpBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-mbp-empty">{v4("mbpEmpty")}</p>}
      <ol className="c4-mbp-board">
        {shown.map((row, index) => {
          const seen = reviewed.includes(row.id);
          return (
            <li key={row.id} className="c4-mbp-card" data-on={index === focusAt ? "1" : "0"} data-lane={plateLane(row.note)} data-hue={plateHue(row.note)} data-reviewed={seen ? "1" : "0"}>
              <label className="c4-mbp-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label || row.id} onChange={() => setPicked((current) => current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id])} /></label>
              <div>
                <strong>{row.label || v4("mbpUnmarked")}</strong>
                <p className="c4-mbp-meta">{plateStamp(row.note)} · {laneLabel(v4, plateLane(row.note))} · {hueLabel(v4, plateHue(row.note))} · {v4("mbpStep")} {plateStep(row.note)}</p>
                <div className="c4-mbp-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(togglePlateReview(reviewed, row.id))}>{seen ? v4("mbpReviewed") : v4("mbpReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(plateCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("mbpCopied") : v4("mbpCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="c4-mbp-tools">
        <button type="button" className="c4-btn" onClick={() => download("mailbox-lanes.csv", plateLanesCsv(rows))}>{v4("mbpCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("mailbox-rows.csv", plateRowsCsv(shown, reviewed))}>{v4("mbpRowCsv")}</button>
      </div>
    </section>
  );
}
