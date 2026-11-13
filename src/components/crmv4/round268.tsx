"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  BMT_DENSITY_KEY,
  BMT_KEY,
  BMT_VIEW_KEY,
  BAROMETER_LIMBS,
  SNM_KEY,
  SNM_REVIEW_KEY,
  addBarometer,
  addBarometerTag,
  addBarometerView,
  briskTube,
  bulkBarometerChampagne,
  bulkBarometerPin,
  bulkBarometerStow,
  bulkBarometerStill,
  bulkBarometerTag,
  bulkSurnameReview,
  busiestBarometerKeeper,
  barometerBars,
  barometerCopy,
  barometerCounts,
  barometerCsv,
  barometerDensity,
  barometerKeepers,
  barometerTimeline,
  clashLimbCount,
  cycleMotion,
  dropBarometerView,
  editBarometer,
  editBarometerNote,
  fairBarometerKeeper,
  houseInk,
  idleTube,
  idleTubes,
  laneSurnameCount,
  lateTube,
  leadingSurname,
  leadingSurnameHue,
  lengthenBarometer,
  lengthenBarometerFocused,
  lowerBarometer,
  lowerBarometerFocused,
  moveBarometerFocus,
  neighborBarometerCount,
  overdueTube,
  stayBarometerFocused,
  peakLimb,
  pinBarometerFocused,
  motionFocused,
  presentSurnameLanes,
  quietLimb,
  raiseBarometer,
  raiseBarometerFocused,
  readTubes,
  readBarometerViews,
  readHiddenSurnames,
  readReviewedSurnames,
  reminderTubes,
  restingTube,
  setBarometerInk,
  setBarometerStay,
  setBarometerPin,
  setBarometerStow,
  setBarometerStar,
  sharedSurnameCount,
  shortenBarometer,
  shortenBarometerFocused,
  sortTubes,
  surnameCopy,
  surnameEcho,
  surnameHue,
  surnameKnown,
  surnameCap,
  surnameLane,
  surnameLanes,
  surnameLanesCsv,
  surnameLeap,
  surnameNotch,
  surnameRowsCsv,
  surnameShare,
  surnameSlash,
  surnameStamp,
  surnameStep,
  surnameTail,
  surnameTwin,
  surnameWide,
  starBarometerFocused,
  suggestBarometerSpan,
  suggestLimb,
  suggestInk,
  tagBarometerFocused,
  toggleSurname,
  toggleSurnameReview,
  visibleTubes,
  visibleSurnameLanes,
  visibleSurnames,
  type BarometerDensity,
  type BarometerTube,
  type BarometerSort,
  type BarometerTray,
  type BarometerView,
  type SurnameReview,
  type SurnameRow,
  type SurnameShape,
  type SurnameValue,
} from "@/lib/crmv4/round268";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const METALS = ["ivory", "graphite", "champagne"] as const;
const SIGHTS = ["rise", "still", "fall"] as const;
const ALTS = ["12", "24", "48"] as const;
const MAGS = ["1", "3", "5", "7"] as const;

const LIMB_KEY: Record<string, CrmV4CopyKey> = {
  stem: "bmtStem",
  bowl: "bmtBowl",
  scale: "bmtScale",
  cistern: "bmtCistern",
  peak: "bmtPeakFrame",
  quiet: "bmtQuietFrame",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "bmtAuditSave",
  edit: "bmtAuditEdit",
  note: "bmtAuditNote",
  shuttle: "bmtAuditShuttle",
  pin: "bmtAuditPin",
  unpin: "bmtAuditUnpin",
  pause: "bmtAuditPause",
  resume: "bmtAuditResume",
  seal: "bmtAuditSeal",
  open: "bmtAuditOpen",
  dye: "bmtAuditDye",
  tag: "bmtAuditTag",
  rank: "bmtAuditRank",
  wait: "bmtAuditWait",
  short: "bmtAuditShort",
  flag: "bmtAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  hall: "snmHall",
  porch: "snmPorch",
  stair: "snmStair",
  gate: "snmGate",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "snmIvory",
  graphite: "snmGraphite",
  champagne: "snmChampagne",
};

type NameRow = {
  id?: string;
  name?: string | null;
  lastName?: string | null;
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
  return key ? v4(key) : v4("bmtBlank");
}

function dyeLabel(v4: V4, dye: string): string {
  if (dye === "IVORY") return v4("bmtFlax");
  if (dye === "GRAPHITE") return v4("bmtWool");
  if (dye === "CHAMPAGNE") return v4("bmtSilk");
  return v4("bmtBlankDye");
}

function shuttleLabel(v4: V4, shuttle: string): string {
  if (shuttle === "rise") return v4("bmtRise");
  if (shuttle === "still") return v4("bmtStill");
  if (shuttle === "fall") return v4("bmtFall");
  return v4("bmtBlankShuttle");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("snmUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("snmUnmarked");
}

export function BarometerTubes({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<BarometerTube[]>([]);
  const [views, setViews] = useState<BarometerView[]>([]);
  const [density, setDensity] = useState<BarometerDensity>("roomy");
  const [sort, setSort] = useState<BarometerSort>("frame");
  const [tray, setTray] = useState<BarometerTray>("open");
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
  const [desk, setDesk] = useState("scale");
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
    setCards(readTubes(readJson(BMT_KEY, [])));
    setViews(readBarometerViews(readJson(BMT_VIEW_KEY, [])));
    setDensity(barometerDensity(readJson(BMT_DENSITY_KEY, "roomy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  const shown = sortTubes(visibleTubes(cards, tray, query, weaverFilter, dyeFilter, shuttleFilter, frameFilter, waitFilter, rankFilter, houseOnly, peakOnly, quietOnly), sort);
  const focusAt = shown.length ? focus % shown.length : 0;
  const counts = barometerCounts(cards, shown, desk);
  const timeline = barometerTimeline(cards);
  const reminders = reminderTubes(cards);
  const idling = idleTubes(cards);
  const pilots = barometerKeepers(cards);
  const bars = barometerBars(cards);
  const ribbon = Math.max(1, bars.reduce((sum, bar) => sum + bar.count, 0));
  const ids = shown.map((card) => card.id);
  const busy = busiestBarometerKeeper(cards);
  const clock = new Date().getUTCHours();
  const suggested = suggestInk(cards);
  const fair = fairBarometerKeeper(cards, pilots.join(", ") || "Nia, Sol");
  const frameHint = suggestLimb(clock);
  function store(next: BarometerTube[]) {
    const saved = readTubes(next);
    setCards(saved);
    writeJson(BMT_KEY, saved);
  }
  function storeViews(next: BarometerView[]) {
    const saved = readBarometerViews(next);
    setViews(saved);
    writeJson(BMT_VIEW_KEY, saved);
  }
  function storeDensity(next: BarometerDensity) {
    setDensity(next);
    writeJson(BMT_DENSITY_KEY, next);
  }
  function togglePick(id: string) {
    setPicked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }
  function applyView(view: BarometerView) {
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
        setFocus((index) => moveBarometerFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveBarometerFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        if (!viewer) store(stayBarometerFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        if (!viewer) store(pinBarometerFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        if (!viewer) store(motionFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        if (!viewer) store(lengthenBarometerFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        if (!viewer) store(shortenBarometerFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        if (!viewer) store(tagBarometerFocused(cards, ids, focusAt, "a"));
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        if (!viewer) store(starBarometerFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        if (!viewer) store(raiseBarometerFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "y" || event.key === "Y") {
        event.preventDefault();
        if (!viewer) store(lowerBarometerFocused(cards, ids, focusAt));
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
    <section className="c4-barometer" aria-label={v4("bmtTitle")} data-cards="1" data-desk="barometer" data-role={role} data-density={density} data-sheet={sheet}>
      <header className="c4-barometer-mast">
        <p className="c4-barometer-seal" data-logo="mono">{v4("bmtLogo")}</p>
        <div className="c4-barometer-mast-copy">
          <p className="c4-barometer-kicker">{v4("bmtSub")}</p>
          <h2 className="c4-title">{v4("bmtTitle")}</h2>
        </div>
        <i className="c4-barometer-rule" aria-hidden="true" />
      </header>
      <p className="c4-barometer-links">
        <Link href={crmv4Href(base, "snm")}>{v4("bmtPlates")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("bmtCustomers")}</Link>
        <Link href={crmv4Href(base, "support")}>{v4("bmtSupport")}</Link>
      </p>
      {viewer && <p className="c4-barometer-note">{v4("bmtViewer")}</p>}
      <p className="c4-barometer-lead">{v4("bmtKeys")}</p>
      <p className="c4-barometer-hint">{v4("bmtHint")}</p>
      <p className="c4-barometer-notice" role="status">{v4("bmtNotice")} {counts.overdue}</p>
      <ol className="c4-barometer-ledger" aria-label={v4("bmtChart")}>
        <li><span>{v4("bmtOpen")}</span><strong>{counts.open}</strong></li>
        <li><span>{v4("bmtPause")}</span><strong>{counts.pause}</strong></li>
        <li><span>{v4("bmtSealed")}</span><strong>{counts.seal}</strong></li>
        <li><span>{v4("bmtPinned")}</span><strong>{counts.pinned}</strong></li>
        <li><span>{v4("bmtPeak")}</span><strong>{counts.peak}</strong></li>
        <li><span>{v4("bmtQuiet")}</span><strong>{counts.quiet}</strong></li>
        <li><span>{v4("bmtSoon")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("bmtOverdue")}</span><strong>{counts.overdue}</strong></li>
      </ol>
      <ol className="c4-barometer-bars" aria-label={v4("bmtBars")}>
        {bars.map((bar) => (
          <li key={bar.frame} data-frame={bar.frame}>
            <span>{frameLabel(v4, bar.frame)}</span>
            <i style={{ width: `${Math.round((bar.count / ribbon) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </li>
        ))}
      </ol>
      <ol className="c4-barometer-time" aria-label={v4("bmtTimeline")}>
        {timeline.map((lane) => (
          <li key={lane.rank}><span>{lane.rank}</span><strong>{lane.titles.join(" · ")}</strong></li>
        ))}
      </ol>
      <div className="c4-barometer-tools">
        <label className="c4-lab">
          <span>{v4("bmtDesk")}</span>
          <select className="c4-select" aria-label={v4("bmtDesk")} value={desk} onChange={(event) => setDesk(event.target.value)}>
            {BAROMETER_LIMBS.map((item) => <option key={item} value={item}>{frameLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("bmtSearch")}</span>
          <input ref={searchRef} className="c4-field c4-barometer-search" aria-label={v4("bmtSearch")} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("bmtSearch")} />
        </label>
        {(["open", "pause", "seal"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("bmtOpen") : item === "pause" ? v4("bmtPause") : v4("bmtSealed")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("bmtHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((value) => !value)}>{v4("bmtPeak")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((value) => !value)}>{v4("bmtQuiet")}</button>
        <button type="button" className="c4-chip" data-on={sort === "weaver" ? "1" : "0"} onClick={() => setSort((value) => value === "frame" ? "weaver" : "frame")}>{sort === "weaver" ? v4("bmtSortWeaver") : v4("bmtSortFrame")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "roomy" ? "close" : "roomy")}>{density === "roomy" ? v4("bmtRoomy") : v4("bmtClose")}</button>
        <button type="button" className="c4-chip" onClick={() => setSheet((value) => value === "hall" ? "index" : "hall")}>{sheet === "hall" ? v4("bmtHall") : v4("bmtIndex")}</button>
      </div>
      <div className="c4-barometer-tools">
        <select className="c4-select" aria-label={v4("bmtWeaver")} value={weaverFilter} onChange={(event) => setWeaverFilter(event.target.value)}>
          <option value="all">{v4("bmtAll")}</option>
          {pilots.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("bmtDye")} value={dyeFilter} onChange={(event) => setDyeFilter(event.target.value)}>
          <option value="all">{v4("bmtAll")}</option>
          {METALS.map((item) => <option key={item} value={item}>{dyeLabel(v4, item.toUpperCase())}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("bmtShuttle")} value={shuttleFilter} onChange={(event) => setShuttleFilter(event.target.value)}>
          <option value="all">{v4("bmtAll")}</option>
          {SIGHTS.map((item) => <option key={item} value={item}>{shuttleLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("bmtFrame")} value={frameFilter} onChange={(event) => setFrameFilter(event.target.value)}>
          <option value="all">{v4("bmtAll")}</option>
          <option value="peak">{v4("bmtPeakFrame")}</option>
          <option value="quiet">{v4("bmtQuietFrame")}</option>
          {BAROMETER_LIMBS.map((item) => <option key={item} value={item}>{frameLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("bmtWait")} value={waitFilter} onChange={(event) => setWaitFilter(event.target.value)}>
          <option value="all">{v4("bmtAll")}</option>
          {ALTS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("bmtRank")} value={rankFilter} onChange={(event) => setRankFilter(event.target.value)}>
          <option value="all">{v4("bmtAll")}</option>
          {MAGS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      <form className="c4-barometer-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addBarometer(cards, { id: `bmt-${Date.now()}`, title, note, weaver, frame, dye, shuttle, wait: waitMin, rank, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <label className="c4-lab"><span>{v4("bmtTitleField")}</span><input className="c4-field" aria-label={v4("bmtTitleField")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("bmtNote")}</span><input className="c4-field" aria-label={v4("bmtNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <p className="c4-barometer-meta">{v4("bmtNoteOptional")}</p>
        <label className="c4-lab"><span>{v4("bmtWeaver")}</span><input className="c4-field" aria-label={v4("bmtWeaver")} value={weaver} disabled={viewer} onChange={(event) => setWeaver(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("bmtFrame")}</span>
          <select className="c4-select" aria-label={v4("bmtFrame")} value={frame} disabled={viewer} onChange={(event) => setFrame(event.target.value)}>
            <option value="">{v4("bmtBlank")}</option>
            {BAROMETER_LIMBS.map((item) => <option key={item} value={item}>{frameLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("bmtDye")}</span>
          <select className="c4-select" aria-label={v4("bmtDye")} value={dye} disabled={viewer} onChange={(event) => setDye(event.target.value)}>
            <option value="">{v4("bmtBlankDye")}</option>
            {METALS.map((item) => <option key={item} value={item}>{dyeLabel(v4, item.toUpperCase())}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("bmtShuttle")}</span>
          <select className="c4-select" aria-label={v4("bmtShuttle")} value={shuttle} disabled={viewer} onChange={(event) => setShuttle(event.target.value)}>
            <option value="">{v4("bmtBlankShuttle")}</option>
            {SIGHTS.map((item) => <option key={item} value={item}>{shuttleLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("bmtWait")}</span>
          <select className="c4-select" aria-label={v4("bmtWait")} value={waitMin} disabled={viewer} onChange={(event) => setWaitMin(event.target.value)}>
            <option value="">{v4("bmtBlankWait")}</option>
            {ALTS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("bmtRank")}</span>
          <select className="c4-select" aria-label={v4("bmtRank")} value={rank} disabled={viewer} onChange={(event) => setRank(event.target.value)}>
            {MAGS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("bmtTags")}</span><input className="c4-field" aria-label={v4("bmtTags")} value={tags} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("bmtAdd")}</button>
      </form>
      <form className="c4-barometer-tools" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addBarometerView(views, { id: `view-${Date.now()}`, name: viewName, tray, query, weaver: weaverFilter, dye: dyeFilter, shuttle: shuttleFilter, frame: frameFilter, wait: waitFilter, rank: rankFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("bmtViewName")}</span><input className="c4-field" aria-label={v4("bmtViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("bmtSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-barometer-view">
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("bmtApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropBarometerView(views, view.id))}>{v4("bmtDropView")}</button>
          </span>
        ))}
      </form>
      {picked.length > 0 && (
        <div className="c4-barometer-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBarometerPin(cards, picked))}>{v4("bmtBulkPin")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBarometerStow(cards, picked))}>{v4("bmtBulkSeal")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBarometerStill(cards, picked))}>{v4("bmtBulkBeat")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBarometerChampagne(cards, picked))}>{v4("bmtBulkSilk")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBarometerTag(cards, picked, "b"))}>{v4("bmtBulkTag")}</button>
        </div>
      )}
      <p className="c4-barometer-meta">{v4("bmtSuggest")} {dyeLabel(v4, suggested)} · {v4("bmtFair")} {fair} · {v4("bmtBusy")} {busy || v4("bmtBlankWeaver")} · {v4("bmtNeighbors")} {neighborBarometerCount(cards)} · {v4("bmtClash")} {clashLimbCount(cards)} · {v4("bmtWaitHint")} {suggestBarometerSpan(cards, clock)} · {v4("bmtFrameHint")} {frameLabel(v4, frameHint)}</p>
      {(reminders.length > 0 || idling.length > 0) && (
        <p className="c4-barometer-meta">{v4("bmtDue")} {reminders.map((card) => card.title).join(" · ")} · {v4("bmtIdle")} {idling.map((card) => card.title).join(" · ")}</p>
      )}
      {!shown.length && <p className="c4-barometer-empty">{v4("bmtEmpty")}</p>}
      <ol className={sheet === "index" ? "c4-barometer-index" : "c4-barometer-board"} data-density={density}>
        {shown.map((card, index) => {
          const dial = Math.round(((card.wait ?? 0) / 48) * 100);
          return (
            <li key={card.id} className="c4-barometer-label" data-on={index === focusAt ? "1" : "0"} data-pinned={card.pinned ? "1" : "0"} data-overdue={overdueTube(card) ? "1" : "0"} data-peak={peakLimb(card.frame) ? "1" : "0"} data-quiet={quietLimb(card.frame) ? "1" : "0"} data-house={houseInk(card.dye) ? "1" : "0"} data-brisk={briskTube(card) ? "1" : "0"} data-idle={idleTube(card) ? "1" : "0"} data-resting={restingTube(card) ? "1" : "0"} data-late={lateTube(card, desk) ? "1" : "0"}>
              <div className="c4-barometer-monogram" aria-hidden="true">{(card.title[0] || "·").toUpperCase()}</div>
              <label className="c4-barometer-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => togglePick(card.id)} /></label>
              <div>
                <input className="c4-field" aria-label={v4("bmtEdit")} value={card.title} disabled={viewer} onChange={(event) => store(editBarometer(cards, card.id, event.target.value))} />
                <input className="c4-field" aria-label={v4("bmtEditNote")} aria-required={false} value={card.note} disabled={viewer} onChange={(event) => store(editBarometerNote(cards, card.id, event.target.value))} />
                <p className="c4-barometer-meta">{card.weaver || v4("bmtBlankWeaver")} · {frameLabel(v4, card.frame)} · {dyeLabel(v4, card.dye)} · {shuttleLabel(v4, card.shuttle)} · {card.wait ?? v4("bmtBlankWait")} · {v4("bmtRank")} {card.rank} · {card.tags.join(" ") || v4("bmtTags")}</p>
                <p className="c4-barometer-dial" aria-label={v4("bmtWait")} style={{ background: `conic-gradient(#c6a15b ${dial}%, #efe6d6 ${dial}% 100%)` }} />
                <p className="c4-barometer-meta">{frameLabel(v4, desk)} · {AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : v4("bmtAuditSave")}</p>
                <div className="c4-barometer-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBarometerPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("bmtUnpin") : v4("bmtPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer || card.sealed} onClick={() => store(setBarometerStay(cards, card.id, !card.paused))}>{card.paused ? v4("bmtResume") : v4("bmtPause")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBarometerStow(cards, card.id, !card.sealed))}>{card.sealed ? v4("bmtOpenAgain") : v4("bmtSealed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBarometerStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("bmtUnstar") : v4("bmtStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleMotion(cards, card.id))}>{v4("bmtTempo")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lengthenBarometer(cards, card.id))}>{v4("bmtLengthen")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(shortenBarometer(cards, card.id))}>{v4("bmtShorten")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseBarometer(cards, card.id))}>{v4("bmtRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerBarometer(cards, card.id))}>{v4("bmtLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBarometerInk(cards, card.id, card.dye === "CHAMPAGNE" ? "ivory" : "champagne"))}>{v4("bmtDye")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addBarometerTag(cards, card.id, "c"))}>{v4("bmtTags")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(barometerCopy(card)); setCopied(card.id); }}>{copied === card.id ? v4("bmtCopied") : v4("bmtCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <button type="button" className="c4-btn" onClick={() => download("barometer-tubes.csv", barometerCsv(shown, desk))}>{v4("bmtCsv")}</button>
    </section>
  );
}

export function SurnamePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: NameRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [shape, setShape] = useState<SurnameShape>("all");
  const [review, setReview] = useState<SurnameReview>("all");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<SurnameRow[]>(() => (queue.data?.users || []).map((row, index) => ({
    id: row.id ? `name-${row.id}` : `name-${index}`,
    label: textField(row.name),
    note: { lastName: textField(row.lastName) } satisfies SurnameValue,
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
    const present = presentSurnameLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenSurnames(readJson(SNM_KEY, []), present);
    const nextReviewed = readReviewedSurnames(readJson(SNM_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(SNM_KEY, nextHidden);
    writeJson(SNM_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentSurnameLanes(rows);
  const lanes = visibleSurnameLanes(present, hidden, showHidden);
  const shown = visibleSurnames(rows, lane, hue, query, review, reviewed, shape).filter((row) => {
    const token = surnameLane(row.note);
    if (!token) return true;
    return showHidden || !hidden.includes(token);
  });
  const focusAt = shown.length ? focus % shown.length : 0;
  const bars = surnameLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingSurname(rows);
  const leadHue = leadingSurnameHue(rows);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveBarometerFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveBarometerFocus(index, shown.length, -1));
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
    writeJson(SNM_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(SNM_REVIEW_KEY, next);
  }
  return (
    <section className="c4-surname" aria-label={v4("snmTitle")} data-plates="1" data-names={rows.length} data-role={role}>
      <header className="c4-surname-mast">
        <p className="c4-surname-seal" data-logo="mono">{v4("snmLogo")}</p>
        <div>
          <p className="c4-surname-kicker">{v4("snmSub")}</p>
          <h2 className="c4-title">{v4("snmTitle")}</h2>
        </div>
      </header>
      <ol className="c4-surname-index" aria-label={v4("snmTitle")}>
        <li data-tone="gold">{v4("snmChampagne")}</li>
        <li data-tone="ink">{v4("snmGraphite")}</li>
        <li data-tone="ivory">{v4("snmIvory")}</li>
      </ol>
      <p className="c4-surname-links">
        <Link href={crmv4Href(base, "bmt")}>{v4("snmSpools")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("bmtCustomers")}</Link>
        <Link href={crmv4Href(base, "support")}>{v4("bmtSupport")}</Link>
      </p>
      <p className="c4-surname-hint">{v4("snmHint")}</p>
      {viewer && <p className="c4-surname-note">{v4("snmViewer")}</p>}
      {queue.loading && <p className="c4-surname-meta">{v4("snmEmpty")}</p>}
      {queue.error && <p className="c4-surname-meta">{queue.error}</p>}
      <ul className="c4-surname-kpis" aria-label={v4("snmRules")}>
        <li><span>{v4("snmLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("snmUnmarked")}</strong></li>
        <li><span>{v4("snmToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("snmUnmarked")}</strong></li>
        <li><span>{v4("snmShared")}</span><strong>{sharedSurnameCount(rows)}</strong></li>
        <li><span>{v4("snmShare")}</span><strong>{surnameShare(laneSurnameCount(rows, "hall"), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("snmKnown")}</span><strong>{rows.filter((row) => surnameKnown(row.note)).length}</strong></li>
        <li><span>{v4("snmTwin")}</span><strong>{rows.filter((row) => surnameTwin(row.note)).length}</strong></li>
        <li><span>{v4("snmSlash")}</span><strong>{rows.filter((row) => surnameSlash(row.note)).length}</strong></li>
        <li><span>{v4("snmEcho")}</span><strong>{rows.filter((row) => surnameEcho(row.note)).length}</strong></li>
      </ul>
      <div className="c4-surname-chart" aria-label={v4("snmRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-surname-bar" data-on={lane === bar.lane ? "1" : "0"} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
            <span>{laneLabel(v4, bar.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-surname-tools">
        <input ref={searchRef} className="c4-field c4-surname-search" aria-label={v4("snmSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("snmSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("snmAll") : hueLabel(v4, item)}</button>
        ))}
        {(["all", "hall", "porch", "stair", "gate", "wide", "notch", "leap", "slash", "twin", "known", "echo"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>
            {item === "all" ? v4("snmShapeAll") : item === "wide" ? v4("snmShapeWide") : item === "notch" ? v4("snmShapeNotch") : item === "leap" ? v4("snmShapeLeap") : item === "slash" ? v4("snmShapeSlash") : item === "twin" ? v4("snmShapeTwin") : item === "known" ? v4("snmShapeKnown") : item === "echo" ? v4("snmShapeEcho") : laneLabel(v4, item)}
          </button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("snmAll") : item === "reviewed" ? v4("snmReviewed") : v4("snmUnreviewed")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("snmShow")}</button>
      </div>
      <ul className="c4-surname-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleSurname(hidden, item))}>{hidden.includes(item) ? v4("snmShow") : v4("snmHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-surname-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkSurnameReview(reviewed, picked, true))}>{v4("snmBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkSurnameReview(reviewed, picked, false))}>{v4("snmBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-surname-empty">{v4("snmEmpty")}</p>}
      <ol className="c4-surname-board">
        {shown.map((row, index) => {
          const seen = reviewed.includes(row.id);
          return (
            <li key={row.id} className="c4-surname-card" data-on={index === focusAt ? "1" : "0"} data-lane={surnameLane(row.note)} data-hue={surnameHue(row.note)} data-reviewed={seen ? "1" : "0"} data-known={surnameKnown(row.note) ? "1" : "0"}>
              <p className="c4-surname-stamp">{surnameStamp(row.note) || "·"}</p>
              <label className="c4-surname-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label || row.id} onChange={() => setPicked((current) => current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id])} /></label>
              <div>
                <strong>{row.label || v4("snmUnmarked")}</strong>
                <p className="c4-surname-meta">{laneLabel(v4, surnameLane(row.note))} · {hueLabel(v4, surnameHue(row.note))} · {v4("snmStep")} {surnameStep(row.note)}{surnameCap(row.note) ? ` · ${v4("snmCap")}` : ""}{surnameTail(row.note) ? ` · ${v4("snmTail")}` : ""}{surnameWide(row.note) ? ` · ${v4("snmWide")}` : ""}{surnameNotch(row.note) ? ` · ${v4("snmNotch")}` : ""}{surnameLeap(row.note) ? ` · ${v4("snmLeap")}` : ""}</p>
                <div className="c4-surname-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleSurnameReview(reviewed, row.id))}>{seen ? v4("snmReviewed") : v4("snmReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(surnameCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("snmCopied") : v4("snmCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="c4-surname-tools">
        <button type="button" className="c4-btn" onClick={() => download("given-lanes.csv", surnameLanesCsv(rows))}>{v4("snmCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("given-rows.csv", surnameRowsCsv(shown, reviewed))}>{v4("snmRowCsv")}</button>
      </div>
    </section>
  );
}
