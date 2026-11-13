"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  CLN_DENSITY_KEY,
  CLN_KEY,
  CLN_VIEW_KEY,
  CLINO_LIMBS,
  PTN_KEY,
  PTN_REVIEW_KEY,
  addClino,
  addClinoTag,
  addClinoView,
  briskTube,
  bulkClinoChampagne,
  bulkClinoPin,
  bulkClinoStow,
  bulkClinoStill,
  bulkClinoTag,
  bulkPotentialReview,
  busiestClinoKeeper,
  clinoBars,
  clinoCopy,
  clinoCounts,
  clinoCsv,
  clinoDensity,
  clinoKeepers,
  clinoTimeline,
  clashLimbCount,
  cycleMotion,
  dropClinoView,
  editClino,
  editClinoNote,
  fairClinoKeeper,
  houseInk,
  idleTube,
  idleTubes,
  lanePotentialCount,
  lateTube,
  leadingPotential,
  leadingPotentialHue,
  lengthenClino,
  lengthenClinoFocused,
  lowerClino,
  lowerClinoFocused,
  moveClinoFocus,
  neighborClinoCount,
  overdueTube,
  stayClinoFocused,
  peakLimb,
  pinClinoFocused,
  motionFocused,
  presentPotentialLanes,
  quietLimb,
  raiseClino,
  raiseClinoFocused,
  readTubes,
  readClinoViews,
  readHiddenRegistries,
  readReviewedRegistries,
  reminderTubes,
  restingTube,
  setClinoInk,
  setClinoStay,
  setClinoPin,
  setClinoStow,
  setClinoStar,
  sharedPotentialCount,
  shortenClino,
  shortenClinoFocused,
  sortTubes,
  potentialCopy,
  potentialEcho,
  potentialHue,
  potentialKnown,
  potentialCap,
  potentialLane,
  potentialLanes,
  potentialLanesCsv,
  potentialLeap,
  potentialNotch,
  potentialRowsCsv,
  potentialShare,
  potentialSlash,
  potentialStamp,
  potentialStep,
  potentialTail,
  potentialTwin,
  potentialWide,
  starClinoFocused,
  suggestClinoSpan,
  suggestLimb,
  suggestInk,
  tagClinoFocused,
  togglePotential,
  togglePotentialReview,
  visibleTubes,
  visiblePotentialLanes,
  visibleRegistries,
  type ClinoDensity,
  type ClinoTube,
  type ClinoSort,
  type ClinoTray,
  type ClinoView,
  type PotentialReview,
  type PotentialRow,
  type PotentialShape,
  type PotentialValue,
} from "@/lib/crmv4/round270";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const METALS = ["ivory", "graphite", "champagne"] as const;
const SIGHTS = ["climb", "rest", "sink"] as const;
const ALTS = ["20", "40", "90"] as const;
const MAGS = ["3", "5", "7", "9"] as const;

const LIMB_KEY: Record<string, CrmV4CopyKey> = {
  level: "clnLevel",
  rise: "clnRise",
  fall: "clnFall",
  steep: "clnSteep",
  peak: "clnPeakFrame",
  quiet: "clnQuietFrame",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "clnAuditSave",
  edit: "clnAuditEdit",
  note: "clnAuditNote",
  shuttle: "clnAuditShuttle",
  pin: "clnAuditPin",
  unpin: "clnAuditUnpin",
  pause: "clnAuditPause",
  resume: "clnAuditResume",
  seal: "clnAuditSeal",
  open: "clnAuditOpen",
  dye: "clnAuditDye",
  tag: "clnAuditTag",
  rank: "clnAuditRank",
  wait: "clnAuditWait",
  short: "clnAuditShort",
  flag: "clnAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  kiln: "ptnKiln",
  hearth: "ptnHearth",
  hall: "ptnHall",
  porch: "ptnPorch",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "ptnIvory",
  graphite: "ptnGraphite",
  champagne: "ptnChampagne",
};

type NameRow = {
  id?: string;
  name?: string | null;
  potentialStatus?: string | null;
  code?: string | null;
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
  return key ? v4(key) : v4("clnBlank");
}

function dyeLabel(v4: V4, dye: string): string {
  if (dye === "IVORY") return v4("clnFlax");
  if (dye === "GRAPHITE") return v4("clnWool");
  if (dye === "CHAMPAGNE") return v4("clnSilk");
  return v4("clnBlankDye");
}

function shuttleLabel(v4: V4, shuttle: string): string {
  if (shuttle === "climb") return v4("clnClimb");
  if (shuttle === "rest") return v4("clnRest");
  if (shuttle === "sink") return v4("clnSink");
  return v4("clnBlankShuttle");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("ptnUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("ptnUnmarked");
}

export function ClinometerCards({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<ClinoTube[]>([]);
  const [views, setViews] = useState<ClinoView[]>([]);
  const [density, setDensity] = useState<ClinoDensity>("roomy");
  const [sort, setSort] = useState<ClinoSort>("frame");
  const [tray, setTray] = useState<ClinoTray>("open");
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
  const [desk, setDesk] = useState("fall");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [weaver, setWeaver] = useState("");
  const [frame, setFrame] = useState("");
  const [dye, setDye] = useState("");
  const [shuttle, setShuttle] = useState("");
  const [waitMin, setWaitMin] = useState("");
  const [rank, setRank] = useState("3");
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
    setCards(readTubes(readJson(CLN_KEY, [])));
    setViews(readClinoViews(readJson(CLN_VIEW_KEY, [])));
    setDensity(clinoDensity(readJson(CLN_DENSITY_KEY, "roomy")));
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
  const counts = clinoCounts(cards, shown, desk);
  const timeline = clinoTimeline(cards);
  const reminders = reminderTubes(cards);
  const idling = idleTubes(cards);
  const pilots = clinoKeepers(cards);
  const bars = clinoBars(cards);
  const ribbon = Math.max(1, bars.reduce((sum, bar) => sum + bar.count, 0));
  const ids = shown.map((card) => card.id);
  const busy = busiestClinoKeeper(cards);
  const clock = new Date().getUTCHours();
  const suggested = suggestInk(cards);
  const fair = fairClinoKeeper(cards, pilots.join(", ") || "Nia, Sol");
  const frameHint = suggestLimb(clock);
  function store(next: ClinoTube[]) {
    const saved = readTubes(next);
    setCards(saved);
    writeJson(CLN_KEY, saved);
  }
  function storeViews(next: ClinoView[]) {
    const saved = readClinoViews(next);
    setViews(saved);
    writeJson(CLN_VIEW_KEY, saved);
  }
  function storeDensity(next: ClinoDensity) {
    setDensity(next);
    writeJson(CLN_DENSITY_KEY, next);
  }
  function togglePick(id: string) {
    setPicked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }
  function applyView(view: ClinoView) {
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
        setFocus((index) => moveClinoFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveClinoFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        if (!viewer) store(stayClinoFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        if (!viewer) store(pinClinoFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        if (!viewer) store(motionFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        if (!viewer) store(lengthenClinoFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        if (!viewer) store(shortenClinoFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        if (!viewer) store(tagClinoFocused(cards, ids, focusAt, "a"));
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        if (!viewer) store(starClinoFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        if (!viewer) store(raiseClinoFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "y" || event.key === "Y") {
        event.preventDefault();
        if (!viewer) store(lowerClinoFocused(cards, ids, focusAt));
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
    <section className="c4-clino" aria-label={v4("clnTitle")} data-cards="1" data-desk="clino" data-role={role} data-density={density} data-sheet={sheet}>
      <header className="c4-clino-mast">
        <p className="c4-clino-seal" data-logo="mono">{v4("clnLogo")}</p>
        <div className="c4-clino-mast-copy">
          <p className="c4-clino-kicker">{v4("clnSub")}</p>
          <h2 className="c4-title">{v4("clnTitle")}</h2>
        </div>
        <i className="c4-clino-rule" aria-hidden="true" />
      </header>
      <p className="c4-clino-links">
        <Link href={crmv4Href(base, "ptn")}>{v4("clnPlates")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("clnCustomers")}</Link>
        <Link href={crmv4Href(base, "support")}>{v4("clnSupport")}</Link>
      </p>
      {viewer && <p className="c4-clino-note">{v4("clnViewer")}</p>}
      <p className="c4-clino-lead">{v4("clnKeys")}</p>
      <p className="c4-clino-hint">{v4("clnHint")}</p>
      <p className="c4-clino-notice" role="status">{v4("clnNotice")} {counts.overdue}</p>
      <ol className="c4-clino-ledger" aria-label={v4("clnChart")}>
        <li><span>{v4("clnOpen")}</span><strong>{counts.open}</strong></li>
        <li><span>{v4("clnPause")}</span><strong>{counts.pause}</strong></li>
        <li><span>{v4("clnSealed")}</span><strong>{counts.seal}</strong></li>
        <li><span>{v4("clnPinned")}</span><strong>{counts.pinned}</strong></li>
        <li><span>{v4("clnPeak")}</span><strong>{counts.peak}</strong></li>
        <li><span>{v4("clnQuiet")}</span><strong>{counts.quiet}</strong></li>
        <li><span>{v4("clnSoon")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("clnOverdue")}</span><strong>{counts.overdue}</strong></li>
      </ol>
      <ol className="c4-clino-bars" aria-label={v4("clnBars")}>
        {bars.map((bar) => (
          <li key={bar.frame} data-frame={bar.frame}>
            <span>{frameLabel(v4, bar.frame)}</span>
            <i style={{ width: `${Math.round((bar.count / ribbon) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </li>
        ))}
      </ol>
      <ol className="c4-clino-time" aria-label={v4("clnTimeline")}>
        {timeline.map((lane) => (
          <li key={lane.rank}><span>{lane.rank}</span><strong>{lane.titles.join(" · ")}</strong></li>
        ))}
      </ol>
      <div className="c4-clino-tools">
        <label className="c4-lab">
          <span>{v4("clnDesk")}</span>
          <select className="c4-select" aria-label={v4("clnDesk")} value={desk} onChange={(event) => setDesk(event.target.value)}>
            {CLINO_LIMBS.map((item) => <option key={item} value={item}>{frameLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("clnSearch")}</span>
          <input ref={searchRef} className="c4-field c4-clino-search" aria-label={v4("clnSearch")} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("clnSearch")} />
        </label>
        {(["open", "pause", "seal"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("clnOpen") : item === "pause" ? v4("clnPause") : v4("clnSealed")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("clnHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((value) => !value)}>{v4("clnPeak")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((value) => !value)}>{v4("clnQuiet")}</button>
        <button type="button" className="c4-chip" data-on={sort === "weaver" ? "1" : "0"} onClick={() => setSort((value) => value === "frame" ? "weaver" : "frame")}>{sort === "weaver" ? v4("clnSortWeaver") : v4("clnSortFrame")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "roomy" ? "close" : "roomy")}>{density === "roomy" ? v4("clnRoomy") : v4("clnClose")}</button>
        <button type="button" className="c4-chip" onClick={() => setSheet((value) => value === "hall" ? "index" : "hall")}>{sheet === "hall" ? v4("clnHall") : v4("clnIndex")}</button>
      </div>
      <div className="c4-clino-tools">
        <select className="c4-select" aria-label={v4("clnWeaver")} value={weaverFilter} onChange={(event) => setWeaverFilter(event.target.value)}>
          <option value="all">{v4("clnAll")}</option>
          {pilots.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("clnDye")} value={dyeFilter} onChange={(event) => setDyeFilter(event.target.value)}>
          <option value="all">{v4("clnAll")}</option>
          {METALS.map((item) => <option key={item} value={item}>{dyeLabel(v4, item.toUpperCase())}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("clnShuttle")} value={shuttleFilter} onChange={(event) => setShuttleFilter(event.target.value)}>
          <option value="all">{v4("clnAll")}</option>
          {SIGHTS.map((item) => <option key={item} value={item}>{shuttleLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("clnFrame")} value={frameFilter} onChange={(event) => setFrameFilter(event.target.value)}>
          <option value="all">{v4("clnAll")}</option>
          <option value="peak">{v4("clnPeakFrame")}</option>
          <option value="quiet">{v4("clnQuietFrame")}</option>
          {CLINO_LIMBS.map((item) => <option key={item} value={item}>{frameLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("clnWait")} value={waitFilter} onChange={(event) => setWaitFilter(event.target.value)}>
          <option value="all">{v4("clnAll")}</option>
          {ALTS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("clnRank")} value={rankFilter} onChange={(event) => setRankFilter(event.target.value)}>
          <option value="all">{v4("clnAll")}</option>
          {MAGS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      <form className="c4-clino-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addClino(cards, { id: `cln-${Date.now()}`, title, note, weaver, frame, dye, shuttle, wait: waitMin, rank, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <label className="c4-lab"><span>{v4("clnTitleField")}</span><input className="c4-field" aria-label={v4("clnTitleField")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("clnNote")}</span><input className="c4-field" aria-label={v4("clnNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <p className="c4-clino-meta">{v4("clnNoteOptional")}</p>
        <label className="c4-lab"><span>{v4("clnWeaver")}</span><input className="c4-field" aria-label={v4("clnWeaver")} value={weaver} disabled={viewer} onChange={(event) => setWeaver(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("clnFrame")}</span>
          <select className="c4-select" aria-label={v4("clnFrame")} value={frame} disabled={viewer} onChange={(event) => setFrame(event.target.value)}>
            <option value="">{v4("clnBlank")}</option>
            {CLINO_LIMBS.map((item) => <option key={item} value={item}>{frameLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("clnDye")}</span>
          <select className="c4-select" aria-label={v4("clnDye")} value={dye} disabled={viewer} onChange={(event) => setDye(event.target.value)}>
            <option value="">{v4("clnBlankDye")}</option>
            {METALS.map((item) => <option key={item} value={item}>{dyeLabel(v4, item.toUpperCase())}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("clnShuttle")}</span>
          <select className="c4-select" aria-label={v4("clnShuttle")} value={shuttle} disabled={viewer} onChange={(event) => setShuttle(event.target.value)}>
            <option value="">{v4("clnBlankShuttle")}</option>
            {SIGHTS.map((item) => <option key={item} value={item}>{shuttleLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("clnWait")}</span>
          <select className="c4-select" aria-label={v4("clnWait")} value={waitMin} disabled={viewer} onChange={(event) => setWaitMin(event.target.value)}>
            <option value="">{v4("clnBlankWait")}</option>
            {ALTS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("clnRank")}</span>
          <select className="c4-select" aria-label={v4("clnRank")} value={rank} disabled={viewer} onChange={(event) => setRank(event.target.value)}>
            {MAGS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("clnTags")}</span><input className="c4-field" aria-label={v4("clnTags")} value={tags} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("clnAdd")}</button>
      </form>
      <form className="c4-clino-tools" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addClinoView(views, { id: `view-${Date.now()}`, name: viewName, tray, query, weaver: weaverFilter, dye: dyeFilter, shuttle: shuttleFilter, frame: frameFilter, wait: waitFilter, rank: rankFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("clnViewName")}</span><input className="c4-field" aria-label={v4("clnViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("clnSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-clino-view">
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("clnApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropClinoView(views, view.id))}>{v4("clnDropView")}</button>
          </span>
        ))}
      </form>
      {picked.length > 0 && (
        <div className="c4-clino-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkClinoPin(cards, picked))}>{v4("clnBulkPin")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkClinoStow(cards, picked))}>{v4("clnBulkSeal")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkClinoStill(cards, picked))}>{v4("clnBulkBeat")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkClinoChampagne(cards, picked))}>{v4("clnBulkSilk")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkClinoTag(cards, picked, "b"))}>{v4("clnBulkTag")}</button>
        </div>
      )}
      <p className="c4-clino-meta">{v4("clnSuggest")} {dyeLabel(v4, suggested)} · {v4("clnFair")} {fair} · {v4("clnBusy")} {busy || v4("clnBlankWeaver")} · {v4("clnNeighbors")} {neighborClinoCount(cards)} · {v4("clnClash")} {clashLimbCount(cards)} · {v4("clnWaitHint")} {suggestClinoSpan(cards, clock)} · {v4("clnFrameHint")} {frameLabel(v4, frameHint)}</p>
      {(reminders.length > 0 || idling.length > 0) && (
        <p className="c4-clino-meta">{v4("clnDue")} {reminders.map((card) => card.title).join(" · ")} · {v4("clnIdle")} {idling.map((card) => card.title).join(" · ")}</p>
      )}
      {!shown.length && <p className="c4-clino-empty">{v4("clnEmpty")}</p>}
      <ol className={sheet === "index" ? "c4-clino-index" : "c4-clino-board"} data-density={density}>
        {shown.map((card, index) => {
          const dial = Math.round(((card.wait ?? 0) / 60) * 100);
          return (
            <li key={card.id} className="c4-clino-label" data-on={index === focusAt ? "1" : "0"} data-pinned={card.pinned ? "1" : "0"} data-overdue={overdueTube(card) ? "1" : "0"} data-peak={peakLimb(card.frame) ? "1" : "0"} data-quiet={quietLimb(card.frame) ? "1" : "0"} data-house={houseInk(card.dye) ? "1" : "0"} data-brisk={briskTube(card) ? "1" : "0"} data-idle={idleTube(card) ? "1" : "0"} data-resting={restingTube(card) ? "1" : "0"} data-late={lateTube(card, desk) ? "1" : "0"}>
              <div className="c4-clino-monogram" aria-hidden="true">{(card.title[0] || "·").toUpperCase()}</div>
              <label className="c4-clino-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => togglePick(card.id)} /></label>
              <div>
                <input className="c4-field" aria-label={v4("clnEdit")} value={card.title} disabled={viewer} onChange={(event) => store(editClino(cards, card.id, event.target.value))} />
                <input className="c4-field" aria-label={v4("clnEditNote")} aria-required={false} value={card.note} disabled={viewer} onChange={(event) => store(editClinoNote(cards, card.id, event.target.value))} />
                <p className="c4-clino-meta">{card.weaver || v4("clnBlankWeaver")} · {frameLabel(v4, card.frame)} · {dyeLabel(v4, card.dye)} · {shuttleLabel(v4, card.shuttle)} · {card.wait ?? v4("clnBlankWait")} · {v4("clnRank")} {card.rank} · {card.tags.join(" ") || v4("clnTags")}</p>
                <p className="c4-clino-dial" aria-label={v4("clnWait")} style={{ background: `conic-gradient(#c6a15b ${dial}%, #efe6d6 ${dial}% 100%)` }} />
                <p className="c4-clino-meta">{frameLabel(v4, desk)} · {AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : v4("clnAuditSave")}</p>
                <div className="c4-clino-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setClinoPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("clnUnpin") : v4("clnPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer || card.sealed} onClick={() => store(setClinoStay(cards, card.id, !card.paused))}>{card.paused ? v4("clnResume") : v4("clnPause")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setClinoStow(cards, card.id, !card.sealed))}>{card.sealed ? v4("clnOpenAgain") : v4("clnSealed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setClinoStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("clnUnstar") : v4("clnStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleMotion(cards, card.id))}>{v4("clnTempo")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lengthenClino(cards, card.id))}>{v4("clnLengthen")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(shortenClino(cards, card.id))}>{v4("clnShorten")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseClino(cards, card.id))}>{v4("clnRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerClino(cards, card.id))}>{v4("clnLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setClinoInk(cards, card.id, card.dye === "CHAMPAGNE" ? "ivory" : "champagne"))}>{v4("clnDye")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addClinoTag(cards, card.id, "c"))}>{v4("clnTags")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(clinoCopy(card)); setCopied(card.id); }}>{copied === card.id ? v4("clnCopied") : v4("clnCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <button type="button" className="c4-btn" onClick={() => download("clinometer-cards.csv", clinoCsv(shown, desk))}>{v4("clnCsv")}</button>
    </section>
  );
}

export function PotentialPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: NameRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [shape, setShape] = useState<PotentialShape>("all");
  const [review, setReview] = useState<PotentialReview>("all");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<PotentialRow[]>(() => (queue.data?.users || []).map((row, index) => ({
    id: row.id ? `name-${row.id}` : `name-${index}`,
    label: textField(row.name),
    note: { potentialStatus: textField(row.potentialStatus) } satisfies PotentialValue,
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
    const present = presentPotentialLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenRegistries(readJson(PTN_KEY, []), present);
    const nextReviewed = readReviewedRegistries(readJson(PTN_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(PTN_KEY, nextHidden);
    writeJson(PTN_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentPotentialLanes(rows);
  const lanes = visiblePotentialLanes(present, hidden, showHidden);
  const shown = visibleRegistries(rows, lane, hue, query, review, reviewed, shape).filter((row) => {
    const token = potentialLane(row.note);
    if (!token) return true;
    return showHidden || !hidden.includes(token);
  });
  const focusAt = shown.length ? focus % shown.length : 0;
  const bars = potentialLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingPotential(rows);
  const leadHue = leadingPotentialHue(rows);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveClinoFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveClinoFocus(index, shown.length, -1));
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
    writeJson(PTN_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(PTN_REVIEW_KEY, next);
  }
  return (
    <section className="c4-potential" aria-label={v4("ptnTitle")} data-plates="1" data-names={rows.length} data-role={role}>
      <header className="c4-potential-mast">
        <p className="c4-potential-seal" data-logo="mono">{v4("ptnLogo")}</p>
        <div>
          <p className="c4-potential-kicker">{v4("ptnSub")}</p>
          <h2 className="c4-title">{v4("ptnTitle")}</h2>
        </div>
      </header>
      <ol className="c4-potential-index" aria-label={v4("ptnTitle")}>
        <li data-tone="gold">{v4("ptnChampagne")}</li>
        <li data-tone="ink">{v4("ptnGraphite")}</li>
        <li data-tone="ivory">{v4("ptnIvory")}</li>
      </ol>
      <p className="c4-potential-links">
        <Link href={crmv4Href(base, "cln")}>{v4("ptnSpools")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("clnCustomers")}</Link>
        <Link href={crmv4Href(base, "support")}>{v4("clnSupport")}</Link>
      </p>
      <p className="c4-potential-hint">{v4("ptnHint")}</p>
      {viewer && <p className="c4-potential-note">{v4("ptnViewer")}</p>}
      {queue.loading && <p className="c4-potential-meta">{v4("ptnEmpty")}</p>}
      {queue.error && <p className="c4-potential-meta">{queue.error}</p>}
      <ul className="c4-potential-kpis" aria-label={v4("ptnRules")}>
        <li><span>{v4("ptnLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("ptnUnmarked")}</strong></li>
        <li><span>{v4("ptnToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("ptnUnmarked")}</strong></li>
        <li><span>{v4("ptnShared")}</span><strong>{sharedPotentialCount(rows)}</strong></li>
        <li><span>{v4("ptnShare")}</span><strong>{potentialShare(lanePotentialCount(rows, "kiln"), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("ptnKnown")}</span><strong>{rows.filter((row) => potentialKnown(row.note)).length}</strong></li>
        <li><span>{v4("ptnTwin")}</span><strong>{rows.filter((row) => potentialTwin(row.note)).length}</strong></li>
        <li><span>{v4("ptnSlash")}</span><strong>{rows.filter((row) => potentialSlash(row.note)).length}</strong></li>
        <li><span>{v4("ptnEcho")}</span><strong>{rows.filter((row) => potentialEcho(row.note)).length}</strong></li>
      </ul>
      <div className="c4-potential-chart" aria-label={v4("ptnRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-potential-bar" data-on={lane === bar.lane ? "1" : "0"} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
            <span>{laneLabel(v4, bar.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-potential-tools">
        <input ref={searchRef} className="c4-field c4-potential-search" aria-label={v4("ptnSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("ptnSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("ptnAll") : hueLabel(v4, item)}</button>
        ))}
        {(["all", "kiln", "hearth", "hall", "porch", "wide", "notch", "leap", "slash", "twin", "known", "echo"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>
            {item === "all" ? v4("ptnShapeAll") : item === "wide" ? v4("ptnShapeWide") : item === "notch" ? v4("ptnShapeNotch") : item === "leap" ? v4("ptnShapeLeap") : item === "slash" ? v4("ptnShapeSlash") : item === "twin" ? v4("ptnShapeTwin") : item === "known" ? v4("ptnShapeKnown") : item === "echo" ? v4("ptnShapeEcho") : laneLabel(v4, item)}
          </button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("ptnAll") : item === "reviewed" ? v4("ptnReviewed") : v4("ptnUnreviewed")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("ptnShow")}</button>
      </div>
      <ul className="c4-potential-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(togglePotential(hidden, item))}>{hidden.includes(item) ? v4("ptnShow") : v4("ptnHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-potential-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkPotentialReview(reviewed, picked, true))}>{v4("ptnBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkPotentialReview(reviewed, picked, false))}>{v4("ptnBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-potential-empty">{v4("ptnEmpty")}</p>}
      <ol className="c4-potential-board">
        {shown.map((row, index) => {
          const seen = reviewed.includes(row.id);
          return (
            <li key={row.id} className="c4-potential-card" data-on={index === focusAt ? "1" : "0"} data-lane={potentialLane(row.note)} data-hue={potentialHue(row.note)} data-reviewed={seen ? "1" : "0"} data-known={potentialKnown(row.note) ? "1" : "0"}>
              <p className="c4-potential-stamp">{potentialStamp(row.note) || "·"}</p>
              <label className="c4-potential-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label || row.id} onChange={() => setPicked((current) => current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id])} /></label>
              <div>
                <strong>{row.label || v4("ptnUnmarked")}</strong>
                <p className="c4-potential-meta">{laneLabel(v4, potentialLane(row.note))} · {hueLabel(v4, potentialHue(row.note))} · {v4("ptnStep")} {potentialStep(row.note)}{potentialCap(row.note) ? ` · ${v4("ptnCap")}` : ""}{potentialTail(row.note) ? ` · ${v4("ptnTail")}` : ""}{potentialWide(row.note) ? ` · ${v4("ptnWide")}` : ""}{potentialNotch(row.note) ? ` · ${v4("ptnNotch")}` : ""}{potentialLeap(row.note) ? ` · ${v4("ptnLeap")}` : ""}</p>
                <div className="c4-potential-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(togglePotentialReview(reviewed, row.id))}>{seen ? v4("ptnReviewed") : v4("ptnReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(potentialCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("ptnCopied") : v4("ptnCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="c4-potential-tools">
        <button type="button" className="c4-btn" onClick={() => download("potential-berths.csv", potentialLanesCsv(rows))}>{v4("ptnCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("potential-rows.csv", potentialRowsCsv(shown, reviewed))}>{v4("ptnRowCsv")}</button>
      </div>
    </section>
  );
}
