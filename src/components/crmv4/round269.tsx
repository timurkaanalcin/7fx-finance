"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  HYG_DENSITY_KEY,
  HYG_KEY,
  HYG_VIEW_KEY,
  HYGRO_LIMBS,
  RGS_KEY,
  RGS_REVIEW_KEY,
  addHygro,
  addHygroTag,
  addHygroView,
  briskTube,
  bulkHygroChampagne,
  bulkHygroPin,
  bulkHygroStow,
  bulkHygroStill,
  bulkHygroTag,
  bulkRegistryReview,
  busiestHygroKeeper,
  hygroBars,
  hygroCopy,
  hygroCounts,
  hygroCsv,
  hygroDensity,
  hygroKeepers,
  hygroTimeline,
  clashLimbCount,
  cycleMotion,
  dropHygroView,
  editHygro,
  editHygroNote,
  fairHygroKeeper,
  houseInk,
  idleTube,
  idleTubes,
  laneRegistryCount,
  lateTube,
  leadingRegistry,
  leadingRegistryHue,
  lengthenHygro,
  lengthenHygroFocused,
  lowerHygro,
  lowerHygroFocused,
  moveHygroFocus,
  neighborHygroCount,
  overdueTube,
  stayHygroFocused,
  peakLimb,
  pinHygroFocused,
  motionFocused,
  presentRegistryLanes,
  quietLimb,
  raiseHygro,
  raiseHygroFocused,
  readTubes,
  readHygroViews,
  readHiddenRegistries,
  readReviewedRegistries,
  reminderTubes,
  restingTube,
  setHygroInk,
  setHygroStay,
  setHygroPin,
  setHygroStow,
  setHygroStar,
  sharedRegistryCount,
  shortenHygro,
  shortenHygroFocused,
  sortTubes,
  registryCopy,
  registryEcho,
  registryHue,
  registryKnown,
  registryCap,
  registryLane,
  registryLanes,
  registryLanesCsv,
  registryLeap,
  registryNotch,
  registryRowsCsv,
  registryShare,
  registrySlash,
  registryStamp,
  registryStep,
  registryTail,
  registryTwin,
  registryWide,
  starHygroFocused,
  suggestHygroSpan,
  suggestLimb,
  suggestInk,
  tagHygroFocused,
  toggleRegistry,
  toggleRegistryReview,
  visibleTubes,
  visibleRegistryLanes,
  visibleRegistries,
  type HygroDensity,
  type HygroTube,
  type HygroSort,
  type HygroTray,
  type HygroView,
  type RegistryReview,
  type RegistryRow,
  type RegistryShape,
  type RegistryValue,
} from "@/lib/crmv4/round269";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const METALS = ["ivory", "graphite", "champagne"] as const;
const SIGHTS = ["swell", "hold", "ebb"] as const;
const ALTS = ["15", "30", "60"] as const;
const MAGS = ["2", "4", "6", "8"] as const;

const LIMB_KEY: Record<string, CrmV4CopyKey> = {
  dry: "hygDry",
  even: "hygEven",
  damp: "hygDamp",
  mist: "hygMist",
  peak: "hygPeakFrame",
  quiet: "hygQuietFrame",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "hygAuditSave",
  edit: "hygAuditEdit",
  note: "hygAuditNote",
  shuttle: "hygAuditShuttle",
  pin: "hygAuditPin",
  unpin: "hygAuditUnpin",
  pause: "hygAuditPause",
  resume: "hygAuditResume",
  seal: "hygAuditSeal",
  open: "hygAuditOpen",
  dye: "hygAuditDye",
  tag: "hygAuditTag",
  rank: "hygAuditRank",
  wait: "hygAuditWait",
  short: "hygAuditShort",
  flag: "hygAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  quay: "rgsQuay",
  pier: "rgsPier",
  dock: "rgsDock",
  buoy: "rgsBuoy",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "rgsIvory",
  graphite: "rgsGraphite",
  champagne: "rgsChampagne",
};

type NameRow = {
  id?: string;
  name?: string | null;
  registrationCountry?: string | null;
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
  return key ? v4(key) : v4("hygBlank");
}

function dyeLabel(v4: V4, dye: string): string {
  if (dye === "IVORY") return v4("hygFlax");
  if (dye === "GRAPHITE") return v4("hygWool");
  if (dye === "CHAMPAGNE") return v4("hygSilk");
  return v4("hygBlankDye");
}

function shuttleLabel(v4: V4, shuttle: string): string {
  if (shuttle === "swell") return v4("hygSwell");
  if (shuttle === "hold") return v4("hygHold");
  if (shuttle === "ebb") return v4("hygEbb");
  return v4("hygBlankShuttle");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("rgsUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("rgsUnmarked");
}

export function HygrometerCards({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<HygroTube[]>([]);
  const [views, setViews] = useState<HygroView[]>([]);
  const [density, setDensity] = useState<HygroDensity>("roomy");
  const [sort, setSort] = useState<HygroSort>("frame");
  const [tray, setTray] = useState<HygroTray>("open");
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
  const [desk, setDesk] = useState("damp");
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
    setCards(readTubes(readJson(HYG_KEY, [])));
    setViews(readHygroViews(readJson(HYG_VIEW_KEY, [])));
    setDensity(hygroDensity(readJson(HYG_DENSITY_KEY, "roomy")));
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
  const counts = hygroCounts(cards, shown, desk);
  const timeline = hygroTimeline(cards);
  const reminders = reminderTubes(cards);
  const idling = idleTubes(cards);
  const pilots = hygroKeepers(cards);
  const bars = hygroBars(cards);
  const ribbon = Math.max(1, bars.reduce((sum, bar) => sum + bar.count, 0));
  const ids = shown.map((card) => card.id);
  const busy = busiestHygroKeeper(cards);
  const clock = new Date().getUTCHours();
  const suggested = suggestInk(cards);
  const fair = fairHygroKeeper(cards, pilots.join(", ") || "Nia, Sol");
  const frameHint = suggestLimb(clock);
  function store(next: HygroTube[]) {
    const saved = readTubes(next);
    setCards(saved);
    writeJson(HYG_KEY, saved);
  }
  function storeViews(next: HygroView[]) {
    const saved = readHygroViews(next);
    setViews(saved);
    writeJson(HYG_VIEW_KEY, saved);
  }
  function storeDensity(next: HygroDensity) {
    setDensity(next);
    writeJson(HYG_DENSITY_KEY, next);
  }
  function togglePick(id: string) {
    setPicked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }
  function applyView(view: HygroView) {
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
        setFocus((index) => moveHygroFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveHygroFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        if (!viewer) store(stayHygroFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        if (!viewer) store(pinHygroFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        if (!viewer) store(motionFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        if (!viewer) store(lengthenHygroFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        if (!viewer) store(shortenHygroFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        if (!viewer) store(tagHygroFocused(cards, ids, focusAt, "a"));
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        if (!viewer) store(starHygroFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        if (!viewer) store(raiseHygroFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "y" || event.key === "Y") {
        event.preventDefault();
        if (!viewer) store(lowerHygroFocused(cards, ids, focusAt));
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
    <section className="c4-hygro" aria-label={v4("hygTitle")} data-cards="1" data-desk="hygro" data-role={role} data-density={density} data-sheet={sheet}>
      <header className="c4-hygro-mast">
        <p className="c4-hygro-seal" data-logo="mono">{v4("hygLogo")}</p>
        <div className="c4-hygro-mast-copy">
          <p className="c4-hygro-kicker">{v4("hygSub")}</p>
          <h2 className="c4-title">{v4("hygTitle")}</h2>
        </div>
        <i className="c4-hygro-rule" aria-hidden="true" />
      </header>
      <p className="c4-hygro-links">
        <Link href={crmv4Href(base, "rgs")}>{v4("hygPlates")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("hygCustomers")}</Link>
        <Link href={crmv4Href(base, "support")}>{v4("hygSupport")}</Link>
      </p>
      {viewer && <p className="c4-hygro-note">{v4("hygViewer")}</p>}
      <p className="c4-hygro-lead">{v4("hygKeys")}</p>
      <p className="c4-hygro-hint">{v4("hygHint")}</p>
      <p className="c4-hygro-notice" role="status">{v4("hygNotice")} {counts.overdue}</p>
      <ol className="c4-hygro-ledger" aria-label={v4("hygChart")}>
        <li><span>{v4("hygOpen")}</span><strong>{counts.open}</strong></li>
        <li><span>{v4("hygPause")}</span><strong>{counts.pause}</strong></li>
        <li><span>{v4("hygSealed")}</span><strong>{counts.seal}</strong></li>
        <li><span>{v4("hygPinned")}</span><strong>{counts.pinned}</strong></li>
        <li><span>{v4("hygPeak")}</span><strong>{counts.peak}</strong></li>
        <li><span>{v4("hygQuiet")}</span><strong>{counts.quiet}</strong></li>
        <li><span>{v4("hygSoon")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("hygOverdue")}</span><strong>{counts.overdue}</strong></li>
      </ol>
      <ol className="c4-hygro-bars" aria-label={v4("hygBars")}>
        {bars.map((bar) => (
          <li key={bar.frame} data-frame={bar.frame}>
            <span>{frameLabel(v4, bar.frame)}</span>
            <i style={{ width: `${Math.round((bar.count / ribbon) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </li>
        ))}
      </ol>
      <ol className="c4-hygro-time" aria-label={v4("hygTimeline")}>
        {timeline.map((lane) => (
          <li key={lane.rank}><span>{lane.rank}</span><strong>{lane.titles.join(" · ")}</strong></li>
        ))}
      </ol>
      <div className="c4-hygro-tools">
        <label className="c4-lab">
          <span>{v4("hygDesk")}</span>
          <select className="c4-select" aria-label={v4("hygDesk")} value={desk} onChange={(event) => setDesk(event.target.value)}>
            {HYGRO_LIMBS.map((item) => <option key={item} value={item}>{frameLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("hygSearch")}</span>
          <input ref={searchRef} className="c4-field c4-hygro-search" aria-label={v4("hygSearch")} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("hygSearch")} />
        </label>
        {(["open", "pause", "seal"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("hygOpen") : item === "pause" ? v4("hygPause") : v4("hygSealed")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("hygHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((value) => !value)}>{v4("hygPeak")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((value) => !value)}>{v4("hygQuiet")}</button>
        <button type="button" className="c4-chip" data-on={sort === "weaver" ? "1" : "0"} onClick={() => setSort((value) => value === "frame" ? "weaver" : "frame")}>{sort === "weaver" ? v4("hygSortWeaver") : v4("hygSortFrame")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "roomy" ? "close" : "roomy")}>{density === "roomy" ? v4("hygRoomy") : v4("hygClose")}</button>
        <button type="button" className="c4-chip" onClick={() => setSheet((value) => value === "hall" ? "index" : "hall")}>{sheet === "hall" ? v4("hygHall") : v4("hygIndex")}</button>
      </div>
      <div className="c4-hygro-tools">
        <select className="c4-select" aria-label={v4("hygWeaver")} value={weaverFilter} onChange={(event) => setWeaverFilter(event.target.value)}>
          <option value="all">{v4("hygAll")}</option>
          {pilots.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("hygDye")} value={dyeFilter} onChange={(event) => setDyeFilter(event.target.value)}>
          <option value="all">{v4("hygAll")}</option>
          {METALS.map((item) => <option key={item} value={item}>{dyeLabel(v4, item.toUpperCase())}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("hygShuttle")} value={shuttleFilter} onChange={(event) => setShuttleFilter(event.target.value)}>
          <option value="all">{v4("hygAll")}</option>
          {SIGHTS.map((item) => <option key={item} value={item}>{shuttleLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("hygFrame")} value={frameFilter} onChange={(event) => setFrameFilter(event.target.value)}>
          <option value="all">{v4("hygAll")}</option>
          <option value="peak">{v4("hygPeakFrame")}</option>
          <option value="quiet">{v4("hygQuietFrame")}</option>
          {HYGRO_LIMBS.map((item) => <option key={item} value={item}>{frameLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("hygWait")} value={waitFilter} onChange={(event) => setWaitFilter(event.target.value)}>
          <option value="all">{v4("hygAll")}</option>
          {ALTS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("hygRank")} value={rankFilter} onChange={(event) => setRankFilter(event.target.value)}>
          <option value="all">{v4("hygAll")}</option>
          {MAGS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      <form className="c4-hygro-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addHygro(cards, { id: `hyg-${Date.now()}`, title, note, weaver, frame, dye, shuttle, wait: waitMin, rank, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <label className="c4-lab"><span>{v4("hygTitleField")}</span><input className="c4-field" aria-label={v4("hygTitleField")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("hygNote")}</span><input className="c4-field" aria-label={v4("hygNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <p className="c4-hygro-meta">{v4("hygNoteOptional")}</p>
        <label className="c4-lab"><span>{v4("hygWeaver")}</span><input className="c4-field" aria-label={v4("hygWeaver")} value={weaver} disabled={viewer} onChange={(event) => setWeaver(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("hygFrame")}</span>
          <select className="c4-select" aria-label={v4("hygFrame")} value={frame} disabled={viewer} onChange={(event) => setFrame(event.target.value)}>
            <option value="">{v4("hygBlank")}</option>
            {HYGRO_LIMBS.map((item) => <option key={item} value={item}>{frameLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("hygDye")}</span>
          <select className="c4-select" aria-label={v4("hygDye")} value={dye} disabled={viewer} onChange={(event) => setDye(event.target.value)}>
            <option value="">{v4("hygBlankDye")}</option>
            {METALS.map((item) => <option key={item} value={item}>{dyeLabel(v4, item.toUpperCase())}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("hygShuttle")}</span>
          <select className="c4-select" aria-label={v4("hygShuttle")} value={shuttle} disabled={viewer} onChange={(event) => setShuttle(event.target.value)}>
            <option value="">{v4("hygBlankShuttle")}</option>
            {SIGHTS.map((item) => <option key={item} value={item}>{shuttleLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("hygWait")}</span>
          <select className="c4-select" aria-label={v4("hygWait")} value={waitMin} disabled={viewer} onChange={(event) => setWaitMin(event.target.value)}>
            <option value="">{v4("hygBlankWait")}</option>
            {ALTS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("hygRank")}</span>
          <select className="c4-select" aria-label={v4("hygRank")} value={rank} disabled={viewer} onChange={(event) => setRank(event.target.value)}>
            {MAGS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("hygTags")}</span><input className="c4-field" aria-label={v4("hygTags")} value={tags} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("hygAdd")}</button>
      </form>
      <form className="c4-hygro-tools" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addHygroView(views, { id: `view-${Date.now()}`, name: viewName, tray, query, weaver: weaverFilter, dye: dyeFilter, shuttle: shuttleFilter, frame: frameFilter, wait: waitFilter, rank: rankFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("hygViewName")}</span><input className="c4-field" aria-label={v4("hygViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("hygSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-hygro-view">
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("hygApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropHygroView(views, view.id))}>{v4("hygDropView")}</button>
          </span>
        ))}
      </form>
      {picked.length > 0 && (
        <div className="c4-hygro-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkHygroPin(cards, picked))}>{v4("hygBulkPin")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkHygroStow(cards, picked))}>{v4("hygBulkSeal")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkHygroStill(cards, picked))}>{v4("hygBulkBeat")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkHygroChampagne(cards, picked))}>{v4("hygBulkSilk")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkHygroTag(cards, picked, "b"))}>{v4("hygBulkTag")}</button>
        </div>
      )}
      <p className="c4-hygro-meta">{v4("hygSuggest")} {dyeLabel(v4, suggested)} · {v4("hygFair")} {fair} · {v4("hygBusy")} {busy || v4("hygBlankWeaver")} · {v4("hygNeighbors")} {neighborHygroCount(cards)} · {v4("hygClash")} {clashLimbCount(cards)} · {v4("hygWaitHint")} {suggestHygroSpan(cards, clock)} · {v4("hygFrameHint")} {frameLabel(v4, frameHint)}</p>
      {(reminders.length > 0 || idling.length > 0) && (
        <p className="c4-hygro-meta">{v4("hygDue")} {reminders.map((card) => card.title).join(" · ")} · {v4("hygIdle")} {idling.map((card) => card.title).join(" · ")}</p>
      )}
      {!shown.length && <p className="c4-hygro-empty">{v4("hygEmpty")}</p>}
      <ol className={sheet === "index" ? "c4-hygro-index" : "c4-hygro-board"} data-density={density}>
        {shown.map((card, index) => {
          const dial = Math.round(((card.wait ?? 0) / 60) * 100);
          return (
            <li key={card.id} className="c4-hygro-label" data-on={index === focusAt ? "1" : "0"} data-pinned={card.pinned ? "1" : "0"} data-overdue={overdueTube(card) ? "1" : "0"} data-peak={peakLimb(card.frame) ? "1" : "0"} data-quiet={quietLimb(card.frame) ? "1" : "0"} data-house={houseInk(card.dye) ? "1" : "0"} data-brisk={briskTube(card) ? "1" : "0"} data-idle={idleTube(card) ? "1" : "0"} data-resting={restingTube(card) ? "1" : "0"} data-late={lateTube(card, desk) ? "1" : "0"}>
              <div className="c4-hygro-monogram" aria-hidden="true">{(card.title[0] || "·").toUpperCase()}</div>
              <label className="c4-hygro-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => togglePick(card.id)} /></label>
              <div>
                <input className="c4-field" aria-label={v4("hygEdit")} value={card.title} disabled={viewer} onChange={(event) => store(editHygro(cards, card.id, event.target.value))} />
                <input className="c4-field" aria-label={v4("hygEditNote")} aria-required={false} value={card.note} disabled={viewer} onChange={(event) => store(editHygroNote(cards, card.id, event.target.value))} />
                <p className="c4-hygro-meta">{card.weaver || v4("hygBlankWeaver")} · {frameLabel(v4, card.frame)} · {dyeLabel(v4, card.dye)} · {shuttleLabel(v4, card.shuttle)} · {card.wait ?? v4("hygBlankWait")} · {v4("hygRank")} {card.rank} · {card.tags.join(" ") || v4("hygTags")}</p>
                <p className="c4-hygro-dial" aria-label={v4("hygWait")} style={{ background: `conic-gradient(#c6a15b ${dial}%, #efe6d6 ${dial}% 100%)` }} />
                <p className="c4-hygro-meta">{frameLabel(v4, desk)} · {AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : v4("hygAuditSave")}</p>
                <div className="c4-hygro-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setHygroPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("hygUnpin") : v4("hygPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer || card.sealed} onClick={() => store(setHygroStay(cards, card.id, !card.paused))}>{card.paused ? v4("hygResume") : v4("hygPause")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setHygroStow(cards, card.id, !card.sealed))}>{card.sealed ? v4("hygOpenAgain") : v4("hygSealed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setHygroStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("hygUnstar") : v4("hygStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleMotion(cards, card.id))}>{v4("hygTempo")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lengthenHygro(cards, card.id))}>{v4("hygLengthen")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(shortenHygro(cards, card.id))}>{v4("hygShorten")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHygro(cards, card.id))}>{v4("hygRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHygro(cards, card.id))}>{v4("hygLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setHygroInk(cards, card.id, card.dye === "CHAMPAGNE" ? "ivory" : "champagne"))}>{v4("hygDye")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addHygroTag(cards, card.id, "c"))}>{v4("hygTags")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(hygroCopy(card)); setCopied(card.id); }}>{copied === card.id ? v4("hygCopied") : v4("hygCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <button type="button" className="c4-btn" onClick={() => download("hygrometer-cards.csv", hygroCsv(shown, desk))}>{v4("hygCsv")}</button>
    </section>
  );
}

export function RegistryPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: NameRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [shape, setShape] = useState<RegistryShape>("all");
  const [review, setReview] = useState<RegistryReview>("all");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<RegistryRow[]>(() => (queue.data?.users || []).map((row, index) => ({
    id: row.id ? `name-${row.id}` : `name-${index}`,
    label: textField(row.name),
    note: { registrationCountry: textField(row.registrationCountry) } satisfies RegistryValue,
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
    const present = presentRegistryLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenRegistries(readJson(RGS_KEY, []), present);
    const nextReviewed = readReviewedRegistries(readJson(RGS_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(RGS_KEY, nextHidden);
    writeJson(RGS_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentRegistryLanes(rows);
  const lanes = visibleRegistryLanes(present, hidden, showHidden);
  const shown = visibleRegistries(rows, lane, hue, query, review, reviewed, shape).filter((row) => {
    const token = registryLane(row.note);
    if (!token) return true;
    return showHidden || !hidden.includes(token);
  });
  const focusAt = shown.length ? focus % shown.length : 0;
  const bars = registryLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingRegistry(rows);
  const leadHue = leadingRegistryHue(rows);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveHygroFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveHygroFocus(index, shown.length, -1));
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
    writeJson(RGS_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(RGS_REVIEW_KEY, next);
  }
  return (
    <section className="c4-registry" aria-label={v4("rgsTitle")} data-plates="1" data-names={rows.length} data-role={role}>
      <header className="c4-registry-mast">
        <p className="c4-registry-seal" data-logo="mono">{v4("rgsLogo")}</p>
        <div>
          <p className="c4-registry-kicker">{v4("rgsSub")}</p>
          <h2 className="c4-title">{v4("rgsTitle")}</h2>
        </div>
      </header>
      <ol className="c4-registry-index" aria-label={v4("rgsTitle")}>
        <li data-tone="gold">{v4("rgsChampagne")}</li>
        <li data-tone="ink">{v4("rgsGraphite")}</li>
        <li data-tone="ivory">{v4("rgsIvory")}</li>
      </ol>
      <p className="c4-registry-links">
        <Link href={crmv4Href(base, "hyg")}>{v4("rgsSpools")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("hygCustomers")}</Link>
        <Link href={crmv4Href(base, "support")}>{v4("hygSupport")}</Link>
      </p>
      <p className="c4-registry-hint">{v4("rgsHint")}</p>
      {viewer && <p className="c4-registry-note">{v4("rgsViewer")}</p>}
      {queue.loading && <p className="c4-registry-meta">{v4("rgsEmpty")}</p>}
      {queue.error && <p className="c4-registry-meta">{queue.error}</p>}
      <ul className="c4-registry-kpis" aria-label={v4("rgsRules")}>
        <li><span>{v4("rgsLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("rgsUnmarked")}</strong></li>
        <li><span>{v4("rgsToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("rgsUnmarked")}</strong></li>
        <li><span>{v4("rgsShared")}</span><strong>{sharedRegistryCount(rows)}</strong></li>
        <li><span>{v4("rgsShare")}</span><strong>{registryShare(laneRegistryCount(rows, "quay"), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("rgsKnown")}</span><strong>{rows.filter((row) => registryKnown(row.note)).length}</strong></li>
        <li><span>{v4("rgsTwin")}</span><strong>{rows.filter((row) => registryTwin(row.note)).length}</strong></li>
        <li><span>{v4("rgsSlash")}</span><strong>{rows.filter((row) => registrySlash(row.note)).length}</strong></li>
        <li><span>{v4("rgsEcho")}</span><strong>{rows.filter((row) => registryEcho(row.note)).length}</strong></li>
      </ul>
      <div className="c4-registry-chart" aria-label={v4("rgsRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-registry-bar" data-on={lane === bar.lane ? "1" : "0"} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
            <span>{laneLabel(v4, bar.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-registry-tools">
        <input ref={searchRef} className="c4-field c4-registry-search" aria-label={v4("rgsSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("rgsSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("rgsAll") : hueLabel(v4, item)}</button>
        ))}
        {(["all", "quay", "pier", "dock", "buoy", "wide", "notch", "leap", "slash", "twin", "known", "echo"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>
            {item === "all" ? v4("rgsShapeAll") : item === "wide" ? v4("rgsShapeWide") : item === "notch" ? v4("rgsShapeNotch") : item === "leap" ? v4("rgsShapeLeap") : item === "slash" ? v4("rgsShapeSlash") : item === "twin" ? v4("rgsShapeTwin") : item === "known" ? v4("rgsShapeKnown") : item === "echo" ? v4("rgsShapeEcho") : laneLabel(v4, item)}
          </button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("rgsAll") : item === "reviewed" ? v4("rgsReviewed") : v4("rgsUnreviewed")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("rgsShow")}</button>
      </div>
      <ul className="c4-registry-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleRegistry(hidden, item))}>{hidden.includes(item) ? v4("rgsShow") : v4("rgsHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-registry-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkRegistryReview(reviewed, picked, true))}>{v4("rgsBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkRegistryReview(reviewed, picked, false))}>{v4("rgsBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-registry-empty">{v4("rgsEmpty")}</p>}
      <ol className="c4-registry-board">
        {shown.map((row, index) => {
          const seen = reviewed.includes(row.id);
          return (
            <li key={row.id} className="c4-registry-card" data-on={index === focusAt ? "1" : "0"} data-lane={registryLane(row.note)} data-hue={registryHue(row.note)} data-reviewed={seen ? "1" : "0"} data-known={registryKnown(row.note) ? "1" : "0"}>
              <p className="c4-registry-stamp">{registryStamp(row.note) || "·"}</p>
              <label className="c4-registry-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label || row.id} onChange={() => setPicked((current) => current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id])} /></label>
              <div>
                <strong>{row.label || v4("rgsUnmarked")}</strong>
                <p className="c4-registry-meta">{laneLabel(v4, registryLane(row.note))} · {hueLabel(v4, registryHue(row.note))} · {v4("rgsStep")} {registryStep(row.note)}{registryCap(row.note) ? ` · ${v4("rgsCap")}` : ""}{registryTail(row.note) ? ` · ${v4("rgsTail")}` : ""}{registryWide(row.note) ? ` · ${v4("rgsWide")}` : ""}{registryNotch(row.note) ? ` · ${v4("rgsNotch")}` : ""}{registryLeap(row.note) ? ` · ${v4("rgsLeap")}` : ""}</p>
                <div className="c4-registry-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleRegistryReview(reviewed, row.id))}>{seen ? v4("rgsReviewed") : v4("rgsReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(registryCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("rgsCopied") : v4("rgsCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="c4-registry-tools">
        <button type="button" className="c4-btn" onClick={() => download("registry-berths.csv", registryLanesCsv(rows))}>{v4("rgsCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("registry-rows.csv", registryRowsCsv(shown, reviewed))}>{v4("rgsRowCsv")}</button>
      </div>
    </section>
  );
}
