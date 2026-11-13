"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  SXT_DENSITY_KEY,
  SXT_KEY,
  SXT_VIEW_KEY,
  SEXTANT_LIMBS,
  OFC_KEY,
  OFC_REVIEW_KEY,
  addSextant,
  addSextantTag,
  addSextantView,
  briskSight,
  bulkSextantGilt,
  bulkSextantPin,
  bulkSextantStow,
  bulkSextantHold,
  bulkSextantTag,
  bulkOfficeReview,
  busiestSextantPilot,
  sextantBars,
  sextantCopy,
  sextantCounts,
  sextantCsv,
  sextantDensity,
  sextantPilots,
  sextantTimeline,
  clashLimbCount,
  cycleSight,
  dropSextantView,
  editSextant,
  editSextantNote,
  fairSextantPilot,
  houseMetal,
  idleSight,
  idleSights,
  laneOfficeCount,
  lateSight,
  leadingOffice,
  leadingOfficeHue,
  lengthenSextant,
  lengthenSextantFocused,
  lowerSextant,
  lowerSextantFocused,
  moveSextantFocus,
  neighborSextantCount,
  overdueSight,
  staySextantFocused,
  peakLimb,
  pinSextantFocused,
  sightFocused,
  presentOfficeLanes,
  quietLimb,
  raiseSextant,
  raiseSextantFocused,
  readSights,
  readSextantViews,
  readHiddenOffices,
  readReviewedOffices,
  reminderSights,
  restingSight,
  setSextantMetal,
  setSextantStay,
  setSextantPin,
  setSextantStow,
  setSextantStar,
  sharedOfficeCount,
  shortenSextant,
  shortenSextantFocused,
  sortSights,
  officeCopy,
  officeEcho,
  officeHue,
  officeKnown,
  officeCap,
  officeLane,
  officeLanes,
  officeLanesCsv,
  officeLeap,
  officeNotch,
  officeRowsCsv,
  officeShare,
  officeSlash,
  officeStamp,
  officeStep,
  officeTail,
  officeTwin,
  officeWide,
  starSextantFocused,
  suggestSextantAlt,
  suggestLimb,
  suggestMetal,
  tagSextantFocused,
  toggleOffice,
  toggleOfficeReview,
  visibleSights,
  visibleOfficeLanes,
  visibleOffices,
  type SextantDensity,
  type SextantSight,
  type SextantSort,
  type SextantTray,
  type SextantView,
  type OfficeReview,
  type OfficeRow,
  type OfficeShape,
  type OfficeValue,
} from "@/lib/crmv4/round266";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const METALS = ["brass", "steel", "gilt"] as const;
const SIGHTS = ["rise", "hold", "set"] as const;
const ALTS = ["15", "30", "45"] as const;
const MAGS = ["1", "3", "5", "7"] as const;

const LIMB_KEY: Record<string, CrmV4CopyKey> = {
  arc: "sxtWarp",
  limb: "sxtWeft",
  index: "sxtReed",
  horizon: "sxtBeam",
  peak: "sxtPeakFrame",
  quiet: "sxtQuietFrame",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "sxtAuditSave",
  edit: "sxtAuditEdit",
  note: "sxtAuditNote",
  shuttle: "sxtAuditShuttle",
  pin: "sxtAuditPin",
  unpin: "sxtAuditUnpin",
  pause: "sxtAuditPause",
  resume: "sxtAuditResume",
  seal: "sxtAuditSeal",
  open: "sxtAuditOpen",
  dye: "sxtAuditDye",
  tag: "sxtAuditTag",
  rank: "sxtAuditRank",
  wait: "sxtAuditWait",
  short: "sxtAuditShort",
  flag: "sxtAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  hall: "ofcSeal",
  wing: "ofcCard",
  bay: "ofcMark",
  yard: "ofcSeam",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "ofcIvory",
  graphite: "ofcGraphite",
  champagne: "ofcChampagne",
};

type DeskRow = {
  id?: string;
  name?: string | null;
  office?: string | null;
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

function frameLabel(v4: V4, frame: string): string {
  const key = LIMB_KEY[frame];
  return key ? v4(key) : v4("sxtBlank");
}

function dyeLabel(v4: V4, dye: string): string {
  if (dye === "BRASS") return v4("sxtFlax");
  if (dye === "STEEL") return v4("sxtWool");
  if (dye === "GILT") return v4("sxtSilk");
  return v4("sxtBlankDye");
}

function shuttleLabel(v4: V4, shuttle: string): string {
  if (shuttle === "rise") return v4("sxtDraw");
  if (shuttle === "hold") return v4("sxtBeat");
  if (shuttle === "set") return v4("sxtRest");
  return v4("sxtBlankShuttle");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("ofcUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("ofcUnmarked");
}

export function SextantSights({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<SextantSight[]>([]);
  const [views, setViews] = useState<SextantView[]>([]);
  const [density, setDensity] = useState<SextantDensity>("roomy");
  const [sort, setSort] = useState<SextantSort>("frame");
  const [tray, setTray] = useState<SextantTray>("open");
  const [query, setQuery] = useState("");
  const [weaverFilter, setWeaverFilter] = useState("all");
  const [dyeFilter, setDyeFilter] = useState("all");
  const [shuttleFilter, setShuttleFilter] = useState("all");
  const [frameFilter, setFrameFilter] = useState("all");
  const [waitFilter, setWaitFilter] = useState("all");
  const [rankFilter, setRankFilter] = useState("all");
  const [houseOnly, setHouseOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [desk, setDesk] = useState("index");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [weaver, setWeaver] = useState("");
  const [frame, setFrame] = useState("");
  const [dye, setDye] = useState("");
  const [shuttle, setShuttle] = useState("");
  const [waitMin, setWaitMin] = useState("");
  const [rank, setRank] = useState("1");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [sheet, setSheet] = useState<"hall" | "index">("hall");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    setCards(readSights(readJson(SXT_KEY, [])));
    setViews(readSextantViews(readJson(SXT_VIEW_KEY, [])));
    setDensity(sextantDensity(readJson(SXT_DENSITY_KEY, "roomy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  const shown = sortSights(visibleSights(cards, tray, query, weaverFilter, dyeFilter, shuttleFilter, frameFilter, waitFilter, rankFilter, houseOnly, peakOnly, quietOnly), sort);
  const focusAt = shown.length ? focus % shown.length : 0;
  const counts = sextantCounts(cards, shown, desk);
  const timeline = sextantTimeline(cards);
  const reminders = reminderSights(cards);
  const idling = idleSights(cards);
  const pilots = sextantPilots(cards);
  const bars = sextantBars(cards);
  const ribbon = Math.max(1, bars.reduce((sum, bar) => sum + bar.count, 0));
  const ids = shown.map((card) => card.id);
  const busy = busiestSextantPilot(cards);
  const clock = new Date().getUTCHours();
  const suggested = suggestMetal(cards);
  const fair = fairSextantPilot(cards, pilots.join(", ") || "Nia, Sol");
  const frameHint = suggestLimb(clock);
  function store(next: SextantSight[]) {
    const saved = readSights(next);
    setCards(saved);
    writeJson(SXT_KEY, saved);
  }
  function storeViews(next: SextantView[]) {
    const saved = readSextantViews(next);
    setViews(saved);
    writeJson(SXT_VIEW_KEY, saved);
  }
  function storeDensity(next: SextantDensity) {
    setDensity(next);
    writeJson(SXT_DENSITY_KEY, next);
  }
  function togglePick(id: string) {
    setPicked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }
  function applyView(view: SextantView) {
    setTray(view.tray);
    setQuery(view.query);
    setWeaverFilter(view.weaver || "all");
    setDyeFilter(view.dye);
    setShuttleFilter(view.shuttle);
    setFrameFilter(view.frame);
    setWaitFilter(view.wait);
    setRankFilter(view.rank);
  }
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setWeaver("");
        setFrame("");
        setDye("");
        setShuttle("");
        setWaitMin("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveSextantFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveSextantFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        if (!viewer) store(staySextantFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        if (!viewer) store(pinSextantFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        if (!viewer) store(sightFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        if (!viewer) store(lengthenSextantFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        if (!viewer) store(shortenSextantFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        if (!viewer) store(tagSextantFocused(cards, ids, focusAt, "x"));
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        if (!viewer) store(starSextantFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        if (!viewer) store(raiseSextantFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "y" || event.key === "Y") {
        event.preventDefault();
        if (!viewer) store(lowerSextantFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "b" || event.key === "B") {
        event.preventDefault();
        setSheet((value) => value === "hall" ? "index" : "hall");
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
    <section className="c4-sextant" aria-label={v4("sxtTitle")} data-cards="1" data-desk="sextant" data-role={role} data-density={density} data-sheet={sheet}>
      <header className="c4-sextant-mast">
        <p className="c4-sextant-seal" data-logo="mono">{v4("sxtLogo")}</p>
        <div className="c4-sextant-mast-copy">
          <p className="c4-sextant-kicker">{v4("sxtSub")}</p>
          <h2 className="c4-title">{v4("sxtTitle")}</h2>
        </div>
        <i className="c4-sextant-rule" aria-hidden="true" />
      </header>
      <p className="c4-sextant-links">
        <Link href={crmv4Href(base, "ofc")}>{v4("sxtPlates")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("sxtCustomers")}</Link>
        <Link href={crmv4Href(base, "support")}>{v4("sxtSupport")}</Link>
      </p>
      {viewer && <p className="c4-sextant-note">{v4("sxtViewer")}</p>}
      <p className="c4-sextant-lead">{v4("sxtKeys")}</p>
      <p className="c4-sextant-hint">{v4("sxtHint")}</p>
      <p className="c4-sextant-notice" role="status">{v4("sxtNotice")} {counts.overdue}</p>
      <ol className="c4-sextant-ledger" aria-label={v4("sxtChart")}>
        <li><span>{v4("sxtOpen")}</span><strong>{counts.open}</strong></li>
        <li><span>{v4("sxtPause")}</span><strong>{counts.pause}</strong></li>
        <li><span>{v4("sxtSealed")}</span><strong>{counts.seal}</strong></li>
        <li><span>{v4("sxtPinned")}</span><strong>{counts.pinned}</strong></li>
        <li><span>{v4("sxtPeak")}</span><strong>{counts.peak}</strong></li>
        <li><span>{v4("sxtQuiet")}</span><strong>{counts.quiet}</strong></li>
        <li><span>{v4("sxtSoon")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("sxtOverdue")}</span><strong>{counts.overdue}</strong></li>
      </ol>
      <ol className="c4-sextant-bars" aria-label={v4("sxtBars")}>
        {bars.map((bar) => (
          <li key={bar.frame} data-frame={bar.frame}>
            <span>{frameLabel(v4, bar.frame)}</span>
            <i style={{ width: `${Math.round((bar.count / ribbon) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </li>
        ))}
      </ol>
      <ol className="c4-sextant-time" aria-label={v4("sxtTimeline")}>
        {timeline.map((lane) => (
          <li key={lane.rank}><span>{lane.rank}</span><strong>{lane.titles.join(" · ")}</strong></li>
        ))}
      </ol>
      <div className="c4-sextant-tools">
        <label className="c4-lab">
          <span>{v4("sxtDesk")}</span>
          <select className="c4-select" aria-label={v4("sxtDesk")} value={desk} onChange={(event) => setDesk(event.target.value)}>
            {SEXTANT_LIMBS.map((item) => <option key={item} value={item}>{frameLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("sxtSearch")}</span>
          <input ref={searchRef} className="c4-field c4-sextant-search" aria-label={v4("sxtSearch")} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("sxtSearch")} />
        </label>
        {(["open", "pause", "seal"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("sxtOpen") : item === "pause" ? v4("sxtPause") : v4("sxtSealed")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("sxtHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((value) => !value)}>{v4("sxtPeak")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((value) => !value)}>{v4("sxtQuiet")}</button>
        <button type="button" className="c4-chip" data-on={sort === "weaver" ? "1" : "0"} onClick={() => setSort((value) => value === "frame" ? "weaver" : "frame")}>{sort === "weaver" ? v4("sxtSortWeaver") : v4("sxtSortFrame")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "roomy" ? "close" : "roomy")}>{density === "roomy" ? v4("sxtRoomy") : v4("sxtClose")}</button>
        <button type="button" className="c4-chip" onClick={() => setSheet((value) => value === "hall" ? "index" : "hall")}>{sheet === "hall" ? v4("sxtHall") : v4("sxtIndex")}</button>
      </div>
      <div className="c4-sextant-tools">
        <select className="c4-select" aria-label={v4("sxtWeaver")} value={weaverFilter} onChange={(event) => setWeaverFilter(event.target.value)}>
          <option value="all">{v4("sxtAll")}</option>
          {pilots.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("sxtDye")} value={dyeFilter} onChange={(event) => setDyeFilter(event.target.value)}>
          <option value="all">{v4("sxtAll")}</option>
          {METALS.map((item) => <option key={item} value={item}>{dyeLabel(v4, item.toUpperCase())}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("sxtShuttle")} value={shuttleFilter} onChange={(event) => setShuttleFilter(event.target.value)}>
          <option value="all">{v4("sxtAll")}</option>
          {SIGHTS.map((item) => <option key={item} value={item}>{shuttleLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("sxtFrame")} value={frameFilter} onChange={(event) => setFrameFilter(event.target.value)}>
          <option value="all">{v4("sxtAll")}</option>
          <option value="peak">{v4("sxtPeakFrame")}</option>
          <option value="quiet">{v4("sxtQuietFrame")}</option>
          {SEXTANT_LIMBS.map((item) => <option key={item} value={item}>{frameLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("sxtWait")} value={waitFilter} onChange={(event) => setWaitFilter(event.target.value)}>
          <option value="all">{v4("sxtAll")}</option>
          {ALTS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("sxtRank")} value={rankFilter} onChange={(event) => setRankFilter(event.target.value)}>
          <option value="all">{v4("sxtAll")}</option>
          {MAGS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      <form className="c4-sextant-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addSextant(cards, { id: `sxt-${Date.now()}`, title, note, weaver, frame, dye, shuttle, wait: waitMin, rank, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <label className="c4-lab"><span>{v4("sxtTitleField")}</span><input className="c4-field" aria-label={v4("sxtTitleField")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("sxtNote")}</span><input className="c4-field" aria-label={v4("sxtNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <p className="c4-sextant-meta">{v4("sxtNoteOptional")}</p>
        <label className="c4-lab"><span>{v4("sxtWeaver")}</span><input className="c4-field" aria-label={v4("sxtWeaver")} value={weaver} disabled={viewer} onChange={(event) => setWeaver(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("sxtFrame")}</span>
          <select className="c4-select" aria-label={v4("sxtFrame")} value={frame} disabled={viewer} onChange={(event) => setFrame(event.target.value)}>
            <option value="">{v4("sxtBlank")}</option>
            {SEXTANT_LIMBS.map((item) => <option key={item} value={item}>{frameLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("sxtDye")}</span>
          <select className="c4-select" aria-label={v4("sxtDye")} value={dye} disabled={viewer} onChange={(event) => setDye(event.target.value)}>
            <option value="">{v4("sxtBlankDye")}</option>
            {METALS.map((item) => <option key={item} value={item}>{dyeLabel(v4, item.toUpperCase())}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("sxtShuttle")}</span>
          <select className="c4-select" aria-label={v4("sxtShuttle")} value={shuttle} disabled={viewer} onChange={(event) => setShuttle(event.target.value)}>
            <option value="">{v4("sxtBlankShuttle")}</option>
            {SIGHTS.map((item) => <option key={item} value={item}>{shuttleLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("sxtWait")}</span>
          <select className="c4-select" aria-label={v4("sxtWait")} value={waitMin} disabled={viewer} onChange={(event) => setWaitMin(event.target.value)}>
            <option value="">{v4("sxtBlankWait")}</option>
            {ALTS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("sxtRank")}</span>
          <select className="c4-select" aria-label={v4("sxtRank")} value={rank} disabled={viewer} onChange={(event) => setRank(event.target.value)}>
            {MAGS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("sxtTags")}</span><input className="c4-field" aria-label={v4("sxtTags")} value={tags} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("sxtAdd")}</button>
      </form>
      <form className="c4-sextant-tools" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addSextantView(views, { id: `view-${Date.now()}`, name: viewName, tray, query, weaver: weaverFilter, dye: dyeFilter, shuttle: shuttleFilter, frame: frameFilter, wait: waitFilter, rank: rankFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("sxtViewName")}</span><input className="c4-field" aria-label={v4("sxtViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("sxtSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-sextant-view">
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("sxtApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropSextantView(views, view.id))}>{v4("sxtDropView")}</button>
          </span>
        ))}
      </form>
      {picked.length > 0 && (
        <div className="c4-sextant-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSextantPin(cards, picked))}>{v4("sxtBulkPin")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSextantStow(cards, picked))}>{v4("sxtBulkSeal")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSextantHold(cards, picked))}>{v4("sxtBulkBeat")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSextantGilt(cards, picked))}>{v4("sxtBulkSilk")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSextantTag(cards, picked, "y"))}>{v4("sxtBulkTag")}</button>
        </div>
      )}
      <p className="c4-sextant-meta">{v4("sxtSuggest")} {dyeLabel(v4, suggested)} · {v4("sxtFair")} {fair} · {v4("sxtBusy")} {busy || v4("sxtBlankWeaver")} · {v4("sxtNeighbors")} {neighborSextantCount(cards)} · {v4("sxtClash")} {clashLimbCount(cards)} · {v4("sxtWaitHint")} {suggestSextantAlt(cards, clock)} · {v4("sxtFrameHint")} {frameLabel(v4, frameHint)}</p>
      {(reminders.length > 0 || idling.length > 0) && (
        <p className="c4-sextant-meta">{v4("sxtDue")} {reminders.map((card) => card.title).join(" · ")} · {v4("sxtIdle")} {idling.map((card) => card.title).join(" · ")}</p>
      )}
      {!shown.length && <p className="c4-sextant-empty">{v4("sxtEmpty")}</p>}
      <ol className={sheet === "index" ? "c4-sextant-index" : "c4-sextant-board"} data-density={density}>
        {shown.map((card, index) => {
          const dial = Math.round(((card.wait ?? 0) / 45) * 100);
          return (
            <li key={card.id} className="c4-sextant-label" data-on={index === focusAt ? "1" : "0"} data-pinned={card.pinned ? "1" : "0"} data-overdue={overdueSight(card) ? "1" : "0"} data-peak={peakLimb(card.frame) ? "1" : "0"} data-quiet={quietLimb(card.frame) ? "1" : "0"} data-house={houseMetal(card.dye) ? "1" : "0"} data-brisk={briskSight(card) ? "1" : "0"} data-idle={idleSight(card) ? "1" : "0"} data-resting={restingSight(card) ? "1" : "0"} data-late={lateSight(card, desk) ? "1" : "0"}>
              <div className="c4-sextant-monogram" aria-hidden="true">{(card.title[0] || "·").toUpperCase()}</div>
              <label className="c4-sextant-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => togglePick(card.id)} /></label>
              <div>
                <input className="c4-field" aria-label={v4("sxtEdit")} value={card.title} disabled={viewer} onChange={(event) => store(editSextant(cards, card.id, event.target.value))} />
                <input className="c4-field" aria-label={v4("sxtEditNote")} aria-required={false} value={card.note} disabled={viewer} onChange={(event) => store(editSextantNote(cards, card.id, event.target.value))} />
                <p className="c4-sextant-meta">{card.weaver || v4("sxtBlankWeaver")} · {frameLabel(v4, card.frame)} · {dyeLabel(v4, card.dye)} · {shuttleLabel(v4, card.shuttle)} · {card.wait ?? v4("sxtBlankWait")} · {v4("sxtRank")} {card.rank} · {card.tags.join(" ") || v4("sxtTags")}</p>
                <p className="c4-sextant-dial" aria-label={v4("sxtWait")} style={{ background: `conic-gradient(#c6a15b ${dial}%, #efe6d6 ${dial}% 100%)` }} />
                <p className="c4-sextant-meta">{frameLabel(v4, desk)} · {AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : v4("sxtAuditSave")}</p>
                <div className="c4-sextant-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSextantPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("sxtUnpin") : v4("sxtPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer || card.sealed} onClick={() => store(setSextantStay(cards, card.id, !card.paused))}>{card.paused ? v4("sxtResume") : v4("sxtPause")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSextantStow(cards, card.id, !card.sealed))}>{card.sealed ? v4("sxtOpenAgain") : v4("sxtSealed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSextantStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("sxtUnstar") : v4("sxtStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleSight(cards, card.id))}>{v4("sxtTempo")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lengthenSextant(cards, card.id))}>{v4("sxtLengthen")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(shortenSextant(cards, card.id))}>{v4("sxtShorten")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseSextant(cards, card.id))}>{v4("sxtRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerSextant(cards, card.id))}>{v4("sxtLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSextantMetal(cards, card.id, card.dye === "GILT" ? "brass" : "gilt"))}>{v4("sxtDye")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addSextantTag(cards, card.id, "z"))}>{v4("sxtTags")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(sextantCopy(card)); setCopied(card.id); }}>{copied === card.id ? v4("sxtCopied") : v4("sxtCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <button type="button" className="c4-btn" onClick={() => download("sextant-sights.csv", sextantCsv(shown, desk))}>{v4("sxtCsv")}</button>
    </section>
  );
}

export function OfficePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ desks?: DeskRow[] }>("/api/admin/desks?take=24");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [shape, setShape] = useState<OfficeShape>("all");
  const [review, setReview] = useState<OfficeReview>("all");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<OfficeRow[]>(() => (queue.data?.desks || []).map((row, index) => ({
    id: row.id ? `desk-${row.id}` : `desk-${index}`,
    label: textField(row.name),
    note: { office: textField(row.office) } satisfies OfficeValue,
  })), [queue.data?.desks]);
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
    const present = presentOfficeLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenOffices(readJson(OFC_KEY, []), present);
    const nextReviewed = readReviewedOffices(readJson(OFC_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(OFC_KEY, nextHidden);
    writeJson(OFC_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentOfficeLanes(rows);
  const lanes = visibleOfficeLanes(present, hidden, showHidden);
  const shown = visibleOffices(rows, lane, hue, query, review, reviewed, shape).filter((row) => {
    const token = officeLane(row.note);
    if (!token) return true;
    return showHidden || !hidden.includes(token);
  });
  const focusAt = shown.length ? focus % shown.length : 0;
  const bars = officeLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingOffice(rows);
  const leadHue = leadingOfficeHue(rows);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveSextantFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveSextantFocus(index, shown.length, -1));
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
    writeJson(OFC_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(OFC_REVIEW_KEY, next);
  }
  return (
    <section className="c4-office" aria-label={v4("ofcTitle")} data-plates="1" data-desks={rows.length} data-role={role}>
      <header className="c4-office-mast">
        <p className="c4-office-seal" data-logo="mono">{v4("ofcLogo")}</p>
        <div>
          <p className="c4-office-kicker">{v4("ofcSub")}</p>
          <h2 className="c4-title">{v4("ofcTitle")}</h2>
        </div>
      </header>
      <ol className="c4-office-index" aria-label={v4("ofcTitle")}>
        <li data-tone="gold">{v4("ofcChampagne")}</li>
        <li data-tone="ink">{v4("ofcGraphite")}</li>
        <li data-tone="ivory">{v4("ofcIvory")}</li>
      </ol>
      <p className="c4-office-links">
        <Link href={crmv4Href(base, "sxt")}>{v4("ofcSpools")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("sxtCustomers")}</Link>
        <Link href={crmv4Href(base, "support")}>{v4("sxtSupport")}</Link>
      </p>
      <p className="c4-office-hint">{v4("ofcHint")}</p>
      {viewer && <p className="c4-office-note">{v4("ofcViewer")}</p>}
      {queue.loading && <p className="c4-office-meta">{v4("ofcEmpty")}</p>}
      {queue.error && <p className="c4-office-meta">{queue.error}</p>}
      <ul className="c4-office-kpis" aria-label={v4("ofcRules")}>
        <li><span>{v4("ofcLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("ofcUnmarked")}</strong></li>
        <li><span>{v4("ofcToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("ofcUnmarked")}</strong></li>
        <li><span>{v4("ofcShared")}</span><strong>{sharedOfficeCount(rows)}</strong></li>
        <li><span>{v4("ofcShare")}</span><strong>{officeShare(laneOfficeCount(rows, "hall"), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("ofcKnown")}</span><strong>{rows.filter((row) => officeKnown(row.note)).length}</strong></li>
        <li><span>{v4("ofcTwin")}</span><strong>{rows.filter((row) => officeTwin(row.note)).length}</strong></li>
        <li><span>{v4("ofcSlash")}</span><strong>{rows.filter((row) => officeSlash(row.note)).length}</strong></li>
        <li><span>{v4("ofcEcho")}</span><strong>{rows.filter((row) => officeEcho(row.note)).length}</strong></li>
      </ul>
      <div className="c4-office-chart" aria-label={v4("ofcRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-office-bar" data-on={lane === bar.lane ? "1" : "0"} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
            <span>{laneLabel(v4, bar.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-office-tools">
        <input ref={searchRef} className="c4-field c4-office-search" aria-label={v4("ofcSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("ofcSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("ofcAll") : hueLabel(v4, item)}</button>
        ))}
        {(["all", "hall", "wing", "bay", "yard", "wide", "notch", "leap", "slash", "twin", "known", "echo"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>
            {item === "all" ? v4("ofcShapeAll") : item === "wide" ? v4("ofcShapeWide") : item === "notch" ? v4("ofcShapeNotch") : item === "leap" ? v4("ofcShapeLeap") : item === "slash" ? v4("ofcShapeSlash") : item === "twin" ? v4("ofcShapeTwin") : item === "known" ? v4("ofcShapeKnown") : item === "echo" ? v4("ofcShapeEcho") : laneLabel(v4, item)}
          </button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("ofcAll") : item === "reviewed" ? v4("ofcReviewed") : v4("ofcUnreviewed")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("ofcShow")}</button>
      </div>
      <ul className="c4-office-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleOffice(hidden, item))}>{hidden.includes(item) ? v4("ofcShow") : v4("ofcHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-office-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkOfficeReview(reviewed, picked, true))}>{v4("ofcBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkOfficeReview(reviewed, picked, false))}>{v4("ofcBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-office-empty">{v4("ofcEmpty")}</p>}
      <ol className="c4-office-board">
        {shown.map((row, index) => {
          const seen = reviewed.includes(row.id);
          return (
            <li key={row.id} className="c4-office-card" data-on={index === focusAt ? "1" : "0"} data-lane={officeLane(row.note)} data-hue={officeHue(row.note)} data-reviewed={seen ? "1" : "0"} data-known={officeKnown(row.note) ? "1" : "0"}>
              <p className="c4-office-stamp">{officeStamp(row.note) || "·"}</p>
              <label className="c4-office-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label || row.id} onChange={() => setPicked((current) => current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id])} /></label>
              <div>
                <strong>{row.label || v4("ofcUnmarked")}</strong>
                <p className="c4-office-meta">{laneLabel(v4, officeLane(row.note))} · {hueLabel(v4, officeHue(row.note))} · {v4("ofcStep")} {officeStep(row.note)}{officeCap(row.note) ? ` · ${v4("ofcCap")}` : ""}{officeTail(row.note) ? ` · ${v4("ofcTail")}` : ""}{officeWide(row.note) ? ` · ${v4("ofcWide")}` : ""}{officeNotch(row.note) ? ` · ${v4("ofcNotch")}` : ""}{officeLeap(row.note) ? ` · ${v4("ofcLeap")}` : ""}</p>
                <div className="c4-office-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleOfficeReview(reviewed, row.id))}>{seen ? v4("ofcReviewed") : v4("ofcReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(officeCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("ofcCopied") : v4("ofcCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="c4-office-tools">
        <button type="button" className="c4-btn" onClick={() => download("office-lanes.csv", officeLanesCsv(rows))}>{v4("ofcCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("office-rows.csv", officeRowsCsv(shown, reviewed))}>{v4("ofcRowCsv")}</button>
      </div>
    </section>
  );
}
