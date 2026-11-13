"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  AST_DENSITY_KEY,
  AST_KEY,
  AST_VIEW_KEY,
  ASTROLABE_PLATES,
  GNM_KEY,
  GNM_REVIEW_KEY,
  addAstrolabe,
  addAstrolabeTag,
  addAstrolabeView,
  briskRete,
  bulkAstrolabeChampagne,
  bulkAstrolabePin,
  bulkAstrolabeStow,
  bulkAstrolabeHold,
  bulkAstrolabeTag,
  bulkGivenReview,
  busiestAstrolabeKeeper,
  astrolabeBars,
  astrolabeCopy,
  astrolabeCounts,
  astrolabeCsv,
  astrolabeDensity,
  astrolabeKeepers,
  astrolabeTimeline,
  clashPlateCount,
  cycleMotion,
  dropAstrolabeView,
  editAstrolabe,
  editAstrolabeNote,
  fairAstrolabeKeeper,
  houseInk,
  idleRete,
  idleRetes,
  laneGivenCount,
  lateRete,
  leadingGiven,
  leadingGivenHue,
  lengthenAstrolabe,
  lengthenAstrolabeFocused,
  lowerAstrolabe,
  lowerAstrolabeFocused,
  moveAstrolabeFocus,
  neighborAstrolabeCount,
  overdueRete,
  stayAstrolabeFocused,
  peakPlate,
  pinAstrolabeFocused,
  motionFocused,
  presentGivenLanes,
  quietPlate,
  raiseAstrolabe,
  raiseAstrolabeFocused,
  readRetes,
  readAstrolabeViews,
  readHiddenGivens,
  readReviewedGivens,
  reminderRetes,
  restingRete,
  setAstrolabeInk,
  setAstrolabeStay,
  setAstrolabePin,
  setAstrolabeStow,
  setAstrolabeStar,
  sharedGivenCount,
  shortenAstrolabe,
  shortenAstrolabeFocused,
  sortRetes,
  givenCopy,
  givenEcho,
  givenHue,
  givenKnown,
  givenCap,
  givenLane,
  givenLanes,
  givenLanesCsv,
  givenLeap,
  givenNotch,
  givenRowsCsv,
  givenShare,
  givenSlash,
  givenStamp,
  givenStep,
  givenTail,
  givenTwin,
  givenWide,
  starAstrolabeFocused,
  suggestAstrolabeSpan,
  suggestPlate,
  suggestInk,
  tagAstrolabeFocused,
  toggleGiven,
  toggleGivenReview,
  visibleRetes,
  visibleGivenLanes,
  visibleGivens,
  type AstrolabeDensity,
  type AstrolabeRete,
  type AstrolabeSort,
  type AstrolabeTray,
  type AstrolabeView,
  type GivenReview,
  type GivenRow,
  type GivenShape,
  type GivenValue,
} from "@/lib/crmv4/round267";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const METALS = ["ivory", "graphite", "champagne"] as const;
const SIGHTS = ["lift", "hold", "set"] as const;
const ALTS = ["10", "20", "40"] as const;
const MAGS = ["2", "4", "6", "8"] as const;

const LIMB_KEY: Record<string, CrmV4CopyKey> = {
  mater: "astWarp",
  rete: "astWeft",
  rule: "astReed",
  alidade: "astBeam",
  peak: "astPeakFrame",
  quiet: "astQuietFrame",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "astAuditSave",
  edit: "astAuditEdit",
  note: "astAuditNote",
  shuttle: "astAuditShuttle",
  pin: "astAuditPin",
  unpin: "astAuditUnpin",
  pause: "astAuditPause",
  resume: "astAuditResume",
  seal: "astAuditSeal",
  open: "astAuditOpen",
  dye: "astAuditDye",
  tag: "astAuditTag",
  rank: "astAuditRank",
  wait: "astAuditWait",
  short: "astAuditShort",
  flag: "astAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  salon: "gnmSeal",
  gallery: "gnmCard",
  bay: "gnmMark",
  court: "gnmSeam",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "gnmIvory",
  graphite: "gnmGraphite",
  champagne: "gnmChampagne",
};

type NameRow = {
  id?: string;
  name?: string | null;
  firstName?: string | null;
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
  return key ? v4(key) : v4("astBlank");
}

function dyeLabel(v4: V4, dye: string): string {
  if (dye === "IVORY") return v4("astFlax");
  if (dye === "GRAPHITE") return v4("astWool");
  if (dye === "CHAMPAGNE") return v4("astSilk");
  return v4("astBlankDye");
}

function shuttleLabel(v4: V4, shuttle: string): string {
  if (shuttle === "lift") return v4("astDraw");
  if (shuttle === "hold") return v4("astBeat");
  if (shuttle === "set") return v4("astRest");
  return v4("astBlankShuttle");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("gnmUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("gnmUnmarked");
}

export function AstrolabeRetes({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<AstrolabeRete[]>([]);
  const [views, setViews] = useState<AstrolabeView[]>([]);
  const [density, setDensity] = useState<AstrolabeDensity>("roomy");
  const [sort, setSort] = useState<AstrolabeSort>("frame");
  const [tray, setTray] = useState<AstrolabeTray>("open");
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
  const [desk, setDesk] = useState("rule");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [weaver, setWeaver] = useState("");
  const [frame, setFrame] = useState("");
  const [dye, setDye] = useState("");
  const [shuttle, setShuttle] = useState("");
  const [waitMin, setWaitMin] = useState("");
  const [rank, setRank] = useState("2");
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
    setCards(readRetes(readJson(AST_KEY, [])));
    setViews(readAstrolabeViews(readJson(AST_VIEW_KEY, [])));
    setDensity(astrolabeDensity(readJson(AST_DENSITY_KEY, "roomy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  const shown = sortRetes(visibleRetes(cards, tray, query, weaverFilter, dyeFilter, shuttleFilter, frameFilter, waitFilter, rankFilter, houseOnly, peakOnly, quietOnly), sort);
  const focusAt = shown.length ? focus % shown.length : 0;
  const counts = astrolabeCounts(cards, shown, desk);
  const timeline = astrolabeTimeline(cards);
  const reminders = reminderRetes(cards);
  const idling = idleRetes(cards);
  const pilots = astrolabeKeepers(cards);
  const bars = astrolabeBars(cards);
  const ribbon = Math.max(1, bars.reduce((sum, bar) => sum + bar.count, 0));
  const ids = shown.map((card) => card.id);
  const busy = busiestAstrolabeKeeper(cards);
  const clock = new Date().getUTCHours();
  const suggested = suggestInk(cards);
  const fair = fairAstrolabeKeeper(cards, pilots.join(", ") || "Nia, Sol");
  const frameHint = suggestPlate(clock);
  function store(next: AstrolabeRete[]) {
    const saved = readRetes(next);
    setCards(saved);
    writeJson(AST_KEY, saved);
  }
  function storeViews(next: AstrolabeView[]) {
    const saved = readAstrolabeViews(next);
    setViews(saved);
    writeJson(AST_VIEW_KEY, saved);
  }
  function storeDensity(next: AstrolabeDensity) {
    setDensity(next);
    writeJson(AST_DENSITY_KEY, next);
  }
  function togglePick(id: string) {
    setPicked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }
  function applyView(view: AstrolabeView) {
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
        setFocus((index) => moveAstrolabeFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveAstrolabeFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        if (!viewer) store(stayAstrolabeFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        if (!viewer) store(pinAstrolabeFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        if (!viewer) store(motionFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        if (!viewer) store(lengthenAstrolabeFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        if (!viewer) store(shortenAstrolabeFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        if (!viewer) store(tagAstrolabeFocused(cards, ids, focusAt, "a"));
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        if (!viewer) store(starAstrolabeFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        if (!viewer) store(raiseAstrolabeFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "y" || event.key === "Y") {
        event.preventDefault();
        if (!viewer) store(lowerAstrolabeFocused(cards, ids, focusAt));
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
    <section className="c4-astrolabe" aria-label={v4("astTitle")} data-cards="1" data-desk="astrolabe" data-role={role} data-density={density} data-sheet={sheet}>
      <header className="c4-astrolabe-mast">
        <p className="c4-astrolabe-seal" data-logo="mono">{v4("astLogo")}</p>
        <div className="c4-astrolabe-mast-copy">
          <p className="c4-astrolabe-kicker">{v4("astSub")}</p>
          <h2 className="c4-title">{v4("astTitle")}</h2>
        </div>
        <i className="c4-astrolabe-rule" aria-hidden="true" />
      </header>
      <p className="c4-astrolabe-links">
        <Link href={crmv4Href(base, "gnm")}>{v4("astPlates")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("astCustomers")}</Link>
        <Link href={crmv4Href(base, "support")}>{v4("astSupport")}</Link>
      </p>
      {viewer && <p className="c4-astrolabe-note">{v4("astViewer")}</p>}
      <p className="c4-astrolabe-lead">{v4("astKeys")}</p>
      <p className="c4-astrolabe-hint">{v4("astHint")}</p>
      <p className="c4-astrolabe-notice" role="status">{v4("astNotice")} {counts.overdue}</p>
      <ol className="c4-astrolabe-ledger" aria-label={v4("astChart")}>
        <li><span>{v4("astOpen")}</span><strong>{counts.open}</strong></li>
        <li><span>{v4("astPause")}</span><strong>{counts.pause}</strong></li>
        <li><span>{v4("astSealed")}</span><strong>{counts.seal}</strong></li>
        <li><span>{v4("astPinned")}</span><strong>{counts.pinned}</strong></li>
        <li><span>{v4("astPeak")}</span><strong>{counts.peak}</strong></li>
        <li><span>{v4("astQuiet")}</span><strong>{counts.quiet}</strong></li>
        <li><span>{v4("astSoon")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("astOverdue")}</span><strong>{counts.overdue}</strong></li>
      </ol>
      <ol className="c4-astrolabe-bars" aria-label={v4("astBars")}>
        {bars.map((bar) => (
          <li key={bar.frame} data-frame={bar.frame}>
            <span>{frameLabel(v4, bar.frame)}</span>
            <i style={{ width: `${Math.round((bar.count / ribbon) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </li>
        ))}
      </ol>
      <ol className="c4-astrolabe-time" aria-label={v4("astTimeline")}>
        {timeline.map((lane) => (
          <li key={lane.rank}><span>{lane.rank}</span><strong>{lane.titles.join(" · ")}</strong></li>
        ))}
      </ol>
      <div className="c4-astrolabe-tools">
        <label className="c4-lab">
          <span>{v4("astDesk")}</span>
          <select className="c4-select" aria-label={v4("astDesk")} value={desk} onChange={(event) => setDesk(event.target.value)}>
            {ASTROLABE_PLATES.map((item) => <option key={item} value={item}>{frameLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("astSearch")}</span>
          <input ref={searchRef} className="c4-field c4-astrolabe-search" aria-label={v4("astSearch")} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("astSearch")} />
        </label>
        {(["open", "pause", "seal"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("astOpen") : item === "pause" ? v4("astPause") : v4("astSealed")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("astHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((value) => !value)}>{v4("astPeak")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((value) => !value)}>{v4("astQuiet")}</button>
        <button type="button" className="c4-chip" data-on={sort === "weaver" ? "1" : "0"} onClick={() => setSort((value) => value === "frame" ? "weaver" : "frame")}>{sort === "weaver" ? v4("astSortWeaver") : v4("astSortFrame")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "roomy" ? "close" : "roomy")}>{density === "roomy" ? v4("astRoomy") : v4("astClose")}</button>
        <button type="button" className="c4-chip" onClick={() => setSheet((value) => value === "hall" ? "index" : "hall")}>{sheet === "hall" ? v4("astHall") : v4("astIndex")}</button>
      </div>
      <div className="c4-astrolabe-tools">
        <select className="c4-select" aria-label={v4("astWeaver")} value={weaverFilter} onChange={(event) => setWeaverFilter(event.target.value)}>
          <option value="all">{v4("astAll")}</option>
          {pilots.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("astDye")} value={dyeFilter} onChange={(event) => setDyeFilter(event.target.value)}>
          <option value="all">{v4("astAll")}</option>
          {METALS.map((item) => <option key={item} value={item}>{dyeLabel(v4, item.toUpperCase())}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("astShuttle")} value={shuttleFilter} onChange={(event) => setShuttleFilter(event.target.value)}>
          <option value="all">{v4("astAll")}</option>
          {SIGHTS.map((item) => <option key={item} value={item}>{shuttleLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("astFrame")} value={frameFilter} onChange={(event) => setFrameFilter(event.target.value)}>
          <option value="all">{v4("astAll")}</option>
          <option value="peak">{v4("astPeakFrame")}</option>
          <option value="quiet">{v4("astQuietFrame")}</option>
          {ASTROLABE_PLATES.map((item) => <option key={item} value={item}>{frameLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("astWait")} value={waitFilter} onChange={(event) => setWaitFilter(event.target.value)}>
          <option value="all">{v4("astAll")}</option>
          {ALTS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("astRank")} value={rankFilter} onChange={(event) => setRankFilter(event.target.value)}>
          <option value="all">{v4("astAll")}</option>
          {MAGS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      <form className="c4-astrolabe-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addAstrolabe(cards, { id: `ast-${Date.now()}`, title, note, weaver, frame, dye, shuttle, wait: waitMin, rank, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <label className="c4-lab"><span>{v4("astTitleField")}</span><input className="c4-field" aria-label={v4("astTitleField")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("astNote")}</span><input className="c4-field" aria-label={v4("astNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <p className="c4-astrolabe-meta">{v4("astNoteOptional")}</p>
        <label className="c4-lab"><span>{v4("astWeaver")}</span><input className="c4-field" aria-label={v4("astWeaver")} value={weaver} disabled={viewer} onChange={(event) => setWeaver(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("astFrame")}</span>
          <select className="c4-select" aria-label={v4("astFrame")} value={frame} disabled={viewer} onChange={(event) => setFrame(event.target.value)}>
            <option value="">{v4("astBlank")}</option>
            {ASTROLABE_PLATES.map((item) => <option key={item} value={item}>{frameLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("astDye")}</span>
          <select className="c4-select" aria-label={v4("astDye")} value={dye} disabled={viewer} onChange={(event) => setDye(event.target.value)}>
            <option value="">{v4("astBlankDye")}</option>
            {METALS.map((item) => <option key={item} value={item}>{dyeLabel(v4, item.toUpperCase())}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("astShuttle")}</span>
          <select className="c4-select" aria-label={v4("astShuttle")} value={shuttle} disabled={viewer} onChange={(event) => setShuttle(event.target.value)}>
            <option value="">{v4("astBlankShuttle")}</option>
            {SIGHTS.map((item) => <option key={item} value={item}>{shuttleLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("astWait")}</span>
          <select className="c4-select" aria-label={v4("astWait")} value={waitMin} disabled={viewer} onChange={(event) => setWaitMin(event.target.value)}>
            <option value="">{v4("astBlankWait")}</option>
            {ALTS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("astRank")}</span>
          <select className="c4-select" aria-label={v4("astRank")} value={rank} disabled={viewer} onChange={(event) => setRank(event.target.value)}>
            {MAGS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("astTags")}</span><input className="c4-field" aria-label={v4("astTags")} value={tags} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("astAdd")}</button>
      </form>
      <form className="c4-astrolabe-tools" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addAstrolabeView(views, { id: `view-${Date.now()}`, name: viewName, tray, query, weaver: weaverFilter, dye: dyeFilter, shuttle: shuttleFilter, frame: frameFilter, wait: waitFilter, rank: rankFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("astViewName")}</span><input className="c4-field" aria-label={v4("astViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("astSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-astrolabe-view">
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("astApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropAstrolabeView(views, view.id))}>{v4("astDropView")}</button>
          </span>
        ))}
      </form>
      {picked.length > 0 && (
        <div className="c4-astrolabe-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkAstrolabePin(cards, picked))}>{v4("astBulkPin")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkAstrolabeStow(cards, picked))}>{v4("astBulkSeal")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkAstrolabeHold(cards, picked))}>{v4("astBulkBeat")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkAstrolabeChampagne(cards, picked))}>{v4("astBulkSilk")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkAstrolabeTag(cards, picked, "b"))}>{v4("astBulkTag")}</button>
        </div>
      )}
      <p className="c4-astrolabe-meta">{v4("astSuggest")} {dyeLabel(v4, suggested)} · {v4("astFair")} {fair} · {v4("astBusy")} {busy || v4("astBlankWeaver")} · {v4("astNeighbors")} {neighborAstrolabeCount(cards)} · {v4("astClash")} {clashPlateCount(cards)} · {v4("astWaitHint")} {suggestAstrolabeSpan(cards, clock)} · {v4("astFrameHint")} {frameLabel(v4, frameHint)}</p>
      {(reminders.length > 0 || idling.length > 0) && (
        <p className="c4-astrolabe-meta">{v4("astDue")} {reminders.map((card) => card.title).join(" · ")} · {v4("astIdle")} {idling.map((card) => card.title).join(" · ")}</p>
      )}
      {!shown.length && <p className="c4-astrolabe-empty">{v4("astEmpty")}</p>}
      <ol className={sheet === "index" ? "c4-astrolabe-index" : "c4-astrolabe-board"} data-density={density}>
        {shown.map((card, index) => {
          const dial = Math.round(((card.wait ?? 0) / 40) * 100);
          return (
            <li key={card.id} className="c4-astrolabe-label" data-on={index === focusAt ? "1" : "0"} data-pinned={card.pinned ? "1" : "0"} data-overdue={overdueRete(card) ? "1" : "0"} data-peak={peakPlate(card.frame) ? "1" : "0"} data-quiet={quietPlate(card.frame) ? "1" : "0"} data-house={houseInk(card.dye) ? "1" : "0"} data-brisk={briskRete(card) ? "1" : "0"} data-idle={idleRete(card) ? "1" : "0"} data-resting={restingRete(card) ? "1" : "0"} data-late={lateRete(card, desk) ? "1" : "0"}>
              <div className="c4-astrolabe-monogram" aria-hidden="true">{(card.title[0] || "·").toUpperCase()}</div>
              <label className="c4-astrolabe-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => togglePick(card.id)} /></label>
              <div>
                <input className="c4-field" aria-label={v4("astEdit")} value={card.title} disabled={viewer} onChange={(event) => store(editAstrolabe(cards, card.id, event.target.value))} />
                <input className="c4-field" aria-label={v4("astEditNote")} aria-required={false} value={card.note} disabled={viewer} onChange={(event) => store(editAstrolabeNote(cards, card.id, event.target.value))} />
                <p className="c4-astrolabe-meta">{card.weaver || v4("astBlankWeaver")} · {frameLabel(v4, card.frame)} · {dyeLabel(v4, card.dye)} · {shuttleLabel(v4, card.shuttle)} · {card.wait ?? v4("astBlankWait")} · {v4("astRank")} {card.rank} · {card.tags.join(" ") || v4("astTags")}</p>
                <p className="c4-astrolabe-dial" aria-label={v4("astWait")} style={{ background: `conic-gradient(#c6a15b ${dial}%, #efe6d6 ${dial}% 100%)` }} />
                <p className="c4-astrolabe-meta">{frameLabel(v4, desk)} · {AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : v4("astAuditSave")}</p>
                <div className="c4-astrolabe-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setAstrolabePin(cards, card.id, !card.pinned))}>{card.pinned ? v4("astUnpin") : v4("astPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer || card.sealed} onClick={() => store(setAstrolabeStay(cards, card.id, !card.paused))}>{card.paused ? v4("astResume") : v4("astPause")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setAstrolabeStow(cards, card.id, !card.sealed))}>{card.sealed ? v4("astOpenAgain") : v4("astSealed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setAstrolabeStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("astUnstar") : v4("astStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleMotion(cards, card.id))}>{v4("astTempo")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lengthenAstrolabe(cards, card.id))}>{v4("astLengthen")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(shortenAstrolabe(cards, card.id))}>{v4("astShorten")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseAstrolabe(cards, card.id))}>{v4("astRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerAstrolabe(cards, card.id))}>{v4("astLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setAstrolabeInk(cards, card.id, card.dye === "CHAMPAGNE" ? "ivory" : "champagne"))}>{v4("astDye")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addAstrolabeTag(cards, card.id, "c"))}>{v4("astTags")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(astrolabeCopy(card)); setCopied(card.id); }}>{copied === card.id ? v4("astCopied") : v4("astCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <button type="button" className="c4-btn" onClick={() => download("astrolabe-retes.csv", astrolabeCsv(shown, desk))}>{v4("astCsv")}</button>
    </section>
  );
}

export function GivenPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: NameRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [shape, setShape] = useState<GivenShape>("all");
  const [review, setReview] = useState<GivenReview>("all");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<GivenRow[]>(() => (queue.data?.users || []).map((row, index) => ({
    id: row.id ? `name-${row.id}` : `name-${index}`,
    label: textField(row.name),
    note: { firstName: textField(row.firstName) } satisfies GivenValue,
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
    const present = presentGivenLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenGivens(readJson(GNM_KEY, []), present);
    const nextReviewed = readReviewedGivens(readJson(GNM_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(GNM_KEY, nextHidden);
    writeJson(GNM_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentGivenLanes(rows);
  const lanes = visibleGivenLanes(present, hidden, showHidden);
  const shown = visibleGivens(rows, lane, hue, query, review, reviewed, shape).filter((row) => {
    const token = givenLane(row.note);
    if (!token) return true;
    return showHidden || !hidden.includes(token);
  });
  const focusAt = shown.length ? focus % shown.length : 0;
  const bars = givenLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingGiven(rows);
  const leadHue = leadingGivenHue(rows);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveAstrolabeFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveAstrolabeFocus(index, shown.length, -1));
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
    writeJson(GNM_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(GNM_REVIEW_KEY, next);
  }
  return (
    <section className="c4-given" aria-label={v4("gnmTitle")} data-plates="1" data-names={rows.length} data-role={role}>
      <header className="c4-given-mast">
        <p className="c4-given-seal" data-logo="mono">{v4("gnmLogo")}</p>
        <div>
          <p className="c4-given-kicker">{v4("gnmSub")}</p>
          <h2 className="c4-title">{v4("gnmTitle")}</h2>
        </div>
      </header>
      <ol className="c4-given-index" aria-label={v4("gnmTitle")}>
        <li data-tone="gold">{v4("gnmChampagne")}</li>
        <li data-tone="ink">{v4("gnmGraphite")}</li>
        <li data-tone="ivory">{v4("gnmIvory")}</li>
      </ol>
      <p className="c4-given-links">
        <Link href={crmv4Href(base, "ast")}>{v4("gnmSpools")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("astCustomers")}</Link>
        <Link href={crmv4Href(base, "support")}>{v4("astSupport")}</Link>
      </p>
      <p className="c4-given-hint">{v4("gnmHint")}</p>
      {viewer && <p className="c4-given-note">{v4("gnmViewer")}</p>}
      {queue.loading && <p className="c4-given-meta">{v4("gnmEmpty")}</p>}
      {queue.error && <p className="c4-given-meta">{queue.error}</p>}
      <ul className="c4-given-kpis" aria-label={v4("gnmRules")}>
        <li><span>{v4("gnmLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("gnmUnmarked")}</strong></li>
        <li><span>{v4("gnmToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("gnmUnmarked")}</strong></li>
        <li><span>{v4("gnmShared")}</span><strong>{sharedGivenCount(rows)}</strong></li>
        <li><span>{v4("gnmShare")}</span><strong>{givenShare(laneGivenCount(rows, "salon"), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("gnmKnown")}</span><strong>{rows.filter((row) => givenKnown(row.note)).length}</strong></li>
        <li><span>{v4("gnmTwin")}</span><strong>{rows.filter((row) => givenTwin(row.note)).length}</strong></li>
        <li><span>{v4("gnmSlash")}</span><strong>{rows.filter((row) => givenSlash(row.note)).length}</strong></li>
        <li><span>{v4("gnmEcho")}</span><strong>{rows.filter((row) => givenEcho(row.note)).length}</strong></li>
      </ul>
      <div className="c4-given-chart" aria-label={v4("gnmRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-given-bar" data-on={lane === bar.lane ? "1" : "0"} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
            <span>{laneLabel(v4, bar.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-given-tools">
        <input ref={searchRef} className="c4-field c4-given-search" aria-label={v4("gnmSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("gnmSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("gnmAll") : hueLabel(v4, item)}</button>
        ))}
        {(["all", "salon", "gallery", "bay", "court", "wide", "notch", "leap", "slash", "twin", "known", "echo"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>
            {item === "all" ? v4("gnmShapeAll") : item === "wide" ? v4("gnmShapeWide") : item === "notch" ? v4("gnmShapeNotch") : item === "leap" ? v4("gnmShapeLeap") : item === "slash" ? v4("gnmShapeSlash") : item === "twin" ? v4("gnmShapeTwin") : item === "known" ? v4("gnmShapeKnown") : item === "echo" ? v4("gnmShapeEcho") : laneLabel(v4, item)}
          </button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("gnmAll") : item === "reviewed" ? v4("gnmReviewed") : v4("gnmUnreviewed")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("gnmShow")}</button>
      </div>
      <ul className="c4-given-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleGiven(hidden, item))}>{hidden.includes(item) ? v4("gnmShow") : v4("gnmHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-given-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkGivenReview(reviewed, picked, true))}>{v4("gnmBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkGivenReview(reviewed, picked, false))}>{v4("gnmBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-given-empty">{v4("gnmEmpty")}</p>}
      <ol className="c4-given-board">
        {shown.map((row, index) => {
          const seen = reviewed.includes(row.id);
          return (
            <li key={row.id} className="c4-given-card" data-on={index === focusAt ? "1" : "0"} data-lane={givenLane(row.note)} data-hue={givenHue(row.note)} data-reviewed={seen ? "1" : "0"} data-known={givenKnown(row.note) ? "1" : "0"}>
              <p className="c4-given-stamp">{givenStamp(row.note) || "·"}</p>
              <label className="c4-given-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label || row.id} onChange={() => setPicked((current) => current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id])} /></label>
              <div>
                <strong>{row.label || v4("gnmUnmarked")}</strong>
                <p className="c4-given-meta">{laneLabel(v4, givenLane(row.note))} · {hueLabel(v4, givenHue(row.note))} · {v4("gnmStep")} {givenStep(row.note)}{givenCap(row.note) ? ` · ${v4("gnmCap")}` : ""}{givenTail(row.note) ? ` · ${v4("gnmTail")}` : ""}{givenWide(row.note) ? ` · ${v4("gnmWide")}` : ""}{givenNotch(row.note) ? ` · ${v4("gnmNotch")}` : ""}{givenLeap(row.note) ? ` · ${v4("gnmLeap")}` : ""}</p>
                <div className="c4-given-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleGivenReview(reviewed, row.id))}>{seen ? v4("gnmReviewed") : v4("gnmReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(givenCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("gnmCopied") : v4("gnmCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="c4-given-tools">
        <button type="button" className="c4-btn" onClick={() => download("given-lanes.csv", givenLanesCsv(rows))}>{v4("gnmCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("given-rows.csv", givenRowsCsv(shown, reviewed))}>{v4("gnmRowCsv")}</button>
      </div>
    </section>
  );
}
