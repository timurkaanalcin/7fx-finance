"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  HGL_DENSITY_KEY,
  HGL_KEY,
  HGL_VIEW_KEY,
  HOUR_ROOMS,
  SYL_KEY,
  SYL_REVIEW_KEY,
  activeGlass,
  activeGrain,
  activeMass,
  activeRoom,
  activeSpan,
  addHourSlip,
  addHourTag,
  addHourView,
  bulkHourArchive,
  bulkHourGlass,
  bulkHourGrain,
  bulkHourPin,
  bulkHourTag,
  bulkSyllableReview,
  busiestSteward,
  clashRoomCount,
  coolingSlip,
  coolingSlips,
  cycleGrain,
  dropHourView,
  editHour,
  editHourNote,
  fairSteward,
  grainFocusedHour,
  holdFocusedHour,
  hourCopy,
  hourCounts,
  hourCsv,
  hourDensity,
  hourShare,
  hourSort,
  hourStewards,
  hourTimeline,
  houseGlass,
  hueSyllableCount,
  laneSyllableCount,
  lateSlip,
  leadingSyllable,
  leadingSyllableHue,
  lengthenFocusedHour,
  lengthenSpan,
  massFocusedHour,
  massLoad,
  matchedSlips,
  moveHourFocus,
  neighborSlipCount,
  nextHour,
  pairStewardCount,
  peakRoom,
  pinFocusedHour,
  plateRowsCsv,
  platesCsv,
  presentSyllableLanes,
  quietRoom,
  readHiddenSyllables,
  readHourSlips,
  readHourViews,
  readReviewedSyllables,
  reminderSlips,
  restingSlip,
  roomBand,
  roomGap,
  rushSlip,
  setHourArchive,
  setHourGlass,
  setHourHold,
  setHourMass,
  setHourPin,
  setHourWax,
  sharedSyllableCount,
  shortenFocusedHour,
  shortenSpan,
  sortHour,
  spanClashCount,
  suggestGlass,
  suggestSpan,
  syllableBound,
  syllableCopy,
  syllableHue,
  syllableJoin,
  syllableLane,
  syllableLanes,
  syllableNotch,
  syllableShare,
  syllableStamp,
  syllableState,
  syllableStep,
  syllableWide,
  tagFocusedHour,
  toggleSyllable,
  toggleSyllableReview,
  visibleHour,
  visibleSyllableLanes,
  visibleSyllables,
  waxFocusedHour,
  type HourDensity,
  type HourSlip,
  type HourSort,
  type HourTray,
  type HourView,
  type SyllableReview,
  type SyllableRow,
  type SyllableShape,
  type SyllableValue,
} from "@/lib/crmv4/round243";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const GLASSES = ["clear", "smoked", "gilt"] as const;
const GRAINS = ["fine", "even", "coarse"] as const;
const SPANS = ["10", "20", "40"] as const;
const MASSES = ["2", "4", "8"] as const;

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "hglAuditSave",
  edit: "hglAuditEdit",
  note: "hglAuditNote",
  grain: "hglAuditGrain",
  pin: "hglAuditPin",
  unpin: "hglAuditUnpin",
  hold: "hglAuditHold",
  resume: "hglAuditResume",
  archive: "hglAuditArchive",
  open: "hglAuditOpen",
  glass: "hglAuditGlass",
  tag: "hglAuditTag",
  mass: "hglAuditMass",
  span: "hglAuditSpan",
  short: "hglAuditShort",
  wax: "hglAuditWax",
};

const ROOM_KEY: Record<string, CrmV4CopyKey> = {
  atrium: "hglAtrium",
  library: "hglLibrary",
  studio: "hglStudio",
  loft: "hglLoft",
  cellar: "hglCellar",
  porch: "hglPorch",
};

type TraderRow = {
  id?: string;
  name?: string | null;
  retentionStatus?: string | null;
  desk?: string | null;
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

function textField(raw: string | null | undefined): string {
  return typeof raw === "string" ? raw : "";
}

function glassLabel(v4: V4, glass: string): string {
  if (glass === "CLEAR" || glass === "clear") return v4("hglClear");
  if (glass === "SMOKED" || glass === "smoked") return v4("hglSmoked");
  if (glass === "GILT" || glass === "gilt") return v4("hglGilt");
  return v4("hglBlankGlass");
}

function grainLabel(v4: V4, grain: string): string {
  if (grain === "fine") return v4("hglFine");
  if (grain === "even") return v4("hglEven");
  if (grain === "coarse") return v4("hglCoarse");
  return v4("hglBlankGrain");
}

function roomLabel(v4: V4, room: string): string {
  return ROOM_KEY[room] ? v4(ROOM_KEY[room]) : v4("hglBlank");
}

function bandLabel(v4: V4, band: string): string {
  if (band === "north") return v4("hglNorth");
  if (band === "mid") return v4("hglMid");
  if (band === "south") return v4("hglSouth");
  return v4("hglBlank");
}

function laneLabel(v4: V4, lane: string): string {
  if (lane === "split") return v4("sylSplit");
  if (lane === "dotted") return v4("sylDotted");
  if (lane === "mono") return v4("sylMono");
  if (lane === "dual") return v4("sylDual");
  if (lane === "crowd") return v4("sylCrowd");
  if (lane === "hush") return v4("sylHush");
  return v4("sylUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  if (hue === "pearl") return v4("sylPearl");
  if (hue === "slate") return v4("sylSlate");
  if (hue === "sand") return v4("sylSand");
  if (hue === "clay") return v4("sylClay");
  if (hue === "soot") return v4("sylSoot");
  if (hue === "mist") return v4("sylMist");
  return v4("sylUnmarked");
}

export function HourglassSlips({ base, v4 }: { base: string; v4: V4 }) {
  const [slips, setSlips] = useState<HourSlip[]>([]);
  const [views, setViews] = useState<HourView[]>([]);
  const [density, setDensity] = useState<HourDensity>("airy");
  const [sort, setSort] = useState<HourSort>("room");
  const [tray, setTray] = useState<HourTray>("open");
  const [query, setQuery] = useState("");
  const [stewardFilter, setStewardFilter] = useState("all");
  const [glassFilter, setGlassFilter] = useState("all");
  const [grainFilter, setGrainFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");
  const [spanFilter, setSpanFilter] = useState("all");
  const [massFilter, setMassFilter] = useState("all");
  const [houseOnly, setHouseOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [desk, setDesk] = useState("library");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [steward, setSteward] = useState("");
  const [room, setRoom] = useState("");
  const [glass, setGlass] = useState("");
  const [grain, setGrain] = useState("");
  const [spanMin, setSpanMin] = useState("");
  const [mass, setMass] = useState("2");
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
    setSlips(readHourSlips(readJson(HGL_KEY, [])));
    setViews(readHourViews(readJson(HGL_VIEW_KEY, [])));
    setDensity(hourDensity(readJson(HGL_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  const shown = sortHour(visibleHour(slips, tray, query, stewardFilter, glassFilter, grainFilter, roomFilter, spanFilter, massFilter, houseOnly, peakOnly, quietOnly), sort);
  const focusAt = shown.length ? focus % shown.length : 0;
  const counts = hourCounts(slips, shown, desk);
  const timeline = hourTimeline(slips);
  const reminders = reminderSlips(slips);
  const cooling = coolingSlips(slips);
  const stewards = hourStewards(slips);
  const focused = shown[focusAt];
  const ids = shown.map((slip) => slip.id);
  function store(next: HourSlip[]) {
    const saved = readHourSlips(next);
    setSlips(saved);
    writeJson(HGL_KEY, saved);
  }
  function storeViews(next: HourView[]) {
    const saved = readHourViews(next);
    setViews(saved);
    writeJson(HGL_VIEW_KEY, saved);
  }
  function storeDensity(next: HourDensity) {
    setDensity(next);
    writeJson(HGL_DENSITY_KEY, next);
  }
  function togglePick(id: string) {
    setPicked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }
  function applyView(view: HourView) {
    setTray(view.tray);
    setQuery(view.query);
    setStewardFilter(view.steward || "all");
    setGlassFilter(view.glass);
    setGrainFilter(view.grain);
    setRoomFilter(view.room);
    setSpanFilter(view.span);
    setMassFilter(view.mass);
  }
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setSteward("");
        setRoom("");
        setGlass("");
        setGrain("");
        setSpanMin("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveHourFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveHourFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        if (!viewer) store(holdFocusedHour(slips, ids, focusAt));
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        if (!viewer) store(pinFocusedHour(slips, ids, focusAt));
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        if (!viewer) store(grainFocusedHour(slips, ids, focusAt));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        if (!viewer) store(lengthenFocusedHour(slips, ids, focusAt));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        if (!viewer) store(shortenFocusedHour(slips, ids, focusAt));
        return;
      }
      if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        if (!viewer) store(tagFocusedHour(slips, ids, focusAt, "x"));
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        if (!viewer) store(waxFocusedHour(slips, ids, focusAt));
        return;
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        if (!viewer) store(massFocusedHour(slips, ids, focusAt));
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
  });
  const bars = HOUR_ROOMS.map((item) => ({ room: item, count: slips.filter((slip) => !slip.archived && !slip.held && slip.room === item).length }));
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const suggested = suggestGlass(slips);
  const suggestedSpan = suggestSpan(slips, new Date().getUTCHours());
  const fair = fairSteward(slips, stewards.join(", "));
  return (
    <section className="c4-hgl" aria-label={v4("hglTitle")} data-slips="1" data-desk="salon" data-role={role} data-density={density}>
      <header className="c4-hgl-mast">
        <p className="c4-hgl-seal" data-logo="mono">{v4("hglLogo")}</p>
        <div>
          <p className="c4-hgl-kicker">{v4("hglSub")}</p>
          <h2 className="c4-title">{v4("hglTitle")}</h2>
        </div>
        <ol className="c4-hgl-index" aria-label={v4("hglTitle")}>
          <li data-tone="gold">{v4("hglChampagne")}</li>
          <li data-tone="ink">{v4("hglGraphite")}</li>
          <li data-tone="ivory">{v4("hglIvory")}</li>
        </ol>
      </header>
      <p className="c4-hgl-links">
        <Link href={crmv4Href(base, "syl")}>{v4("sylTitle")}</Link>
        <Link href={crmv4Href(base, "snippets")}>{v4("hglGallery")}</Link>
        <Link href={crmv4Href(base, "week")}>{v4("hglWeek")}</Link>
      </p>
      {viewer && <p className="c4-hgl-note">{v4("hglViewer")}</p>}
      <p className="c4-hgl-rule">{v4("hglHint")}</p>
      <p className="c4-hgl-meta">{v4("hglLocal")} · {v4("hglKeys")} · {v4("hglHoldKey")} · {v4("hglPinKey")} · {v4("hglSpanKey")} · {v4("hglShortKey")} · {v4("hglTagKey")} · {v4("hglBoardKey")} · {v4("hglMassKey")} · {v4("hglEscape")}</p>
      <ul className="c4-hgl-kpis" aria-label={v4("hglKpi")}>
        <li><span>{v4("hglOpen")}</span><strong>{counts.open}</strong></li>
        <li><span>{v4("hglHeld")}</span><strong>{counts.held}</strong></li>
        <li><span>{v4("hglArchived")}</span><strong>{counts.archived}</strong></li>
        <li><span>{v4("hglPin")}</span><strong>{counts.pinned}</strong></li>
        <li><span>{v4("hglPeak")}</span><strong>{counts.peak}</strong></li>
        <li><span>{v4("hglQuiet")}</span><strong>{counts.quiet}</strong></li>
        <li><span>{v4("hglSoon")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("hglLoad")}</span><strong>{counts.mass}</strong></li>
        <li><span>{v4("hglHouse")}</span><strong>{counts.house}</strong></li>
        <li><span>{v4("hglSpan")}</span><strong>{counts.span}</strong></li>
        <li><span>{v4("hglMatched")}</span><strong>{counts.matched}</strong></li>
        <li><span>{v4("hglWax")}</span><strong>{counts.wax}</strong></li>
        <li><span>{v4("hglCooling")}</span><strong>{counts.cooling}</strong></li>
        <li><span>{v4("hglRush")}</span><strong>{counts.rush}</strong></li>
        <li><span>{v4("hglResting")}</span><strong>{counts.resting}</strong></li>
        <li><span>{v4("hglLateShare")}</span><strong>{hourShare(shown.filter((slip) => lateSlip(slip, desk)).length, Math.max(1, shown.length))}%</strong></li>
        <li><span>{v4("hglShare")}</span><strong>{hourShare(counts.house, Math.max(1, counts.open))}%</strong></li>
        <li><span>{v4("hglNeighbors")}</span><strong>{neighborSlipCount(slips)}</strong></li>
        <li><span>{v4("hglClash")}</span><strong>{clashRoomCount(slips)}</strong></li>
        <li><span>{v4("hglSpanClash")}</span><strong>{spanClashCount(slips)}</strong></li>
      </ul>
      <div className="c4-hgl-bars" aria-label={v4("hglTimeline")}>
        {bars.map((bar) => (
          <div key={bar.room} className="c4-hgl-bar" data-room={bar.room}>
            <span>{roomLabel(v4, bar.room)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <p className="c4-hgl-meta">{v4("hglSuggest")} {glassLabel(v4, suggested)} · {v4("hglSpan")} {suggestedSpan} · {fair ? `${v4("hglAssign")} ${fair}` : v4("hglBlankSteward")} · {busiestSteward(slips) ? `${v4("hglBusiest")} ${busiestSteward(slips)}` : v4("hglBusiestNone")}</p>
      <form className="c4-hgl-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addHourSlip(slips, { id: `hgl-${Date.now()}`, title, note, steward, room, glass, grain, span: spanMin, mass, tags });
        if (next.length === slips.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
        titleRef.current?.focus();
      }}>
        <label className="c4-lab"><span>{v4("hglTitleField")}</span><input ref={titleRef} className="c4-field" aria-label={v4("hglTitleField")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("hglNote")}</span><input className="c4-field" aria-label={v4("hglNote")} value={note} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("hglSteward")}</span><input className="c4-field" aria-label={v4("hglSteward")} value={steward} onChange={(event) => setSteward(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("hglRoom")}</span>
          <select className="c4-field" aria-label={v4("hglRoom")} value={room} onChange={(event) => setRoom(event.target.value)}>
            <option value="">{v4("hglBlank")}</option>
            {HOUR_ROOMS.map((item) => <option key={item} value={item}>{roomLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("hglGlass")}</span>
          <select className="c4-field" aria-label={v4("hglGlass")} value={glass} onChange={(event) => setGlass(event.target.value)}>
            <option value="">{v4("hglBlankGlass")}</option>
            {GLASSES.map((item) => <option key={item} value={item}>{glassLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("hglGrain")}</span>
          <select className="c4-field" aria-label={v4("hglGrain")} value={grain} onChange={(event) => setGrain(event.target.value)}>
            <option value="">{v4("hglBlankGrain")}</option>
            {GRAINS.map((item) => <option key={item} value={item}>{grainLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("hglSpan")}</span>
          <select className="c4-field" aria-label={v4("hglSpan")} value={spanMin} onChange={(event) => setSpanMin(event.target.value)}>
            <option value="">{v4("hglBlankSpan")}</option>
            {SPANS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("hglMass")}</span>
          <select className="c4-field" aria-label={v4("hglMass")} value={mass} onChange={(event) => setMass(event.target.value)}>
            {MASSES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("hglTag")}</span><input className="c4-field" aria-label={v4("hglTag")} value={tags} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("hglAdd")}</button>
        <button type="button" className="c4-btn" onClick={() => { setGlass(suggested.toLowerCase()); setSpanMin(String(suggestedSpan)); if (fair) setSteward(fair); }}>{v4("hglSuggest")}</button>
      </form>
      <div className="c4-hgl-tools">
        <label className="c4-lab"><span>{v4("hglSearch")}</span><input ref={searchRef} className="c4-field c4-hgl-search" aria-label={v4("hglSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("hglDesk")}</span>
          <select className="c4-field" aria-label={v4("hglDesk")} value={desk} onChange={(event) => setDesk(event.target.value)}>
            {HOUR_ROOMS.map((item) => <option key={item} value={item}>{roomLabel(v4, item)}</option>)}
          </select>
        </label>
        <button type="button" className="c4-btn" onClick={() => download("hourglass-slips.csv", hourCsv(slips, desk))}>{v4("hglCsv")}</button>
        <button type="button" className="c4-btn" aria-pressed={density === "tight"} onClick={() => storeDensity(density === "airy" ? "tight" : "airy")}>{density === "airy" ? v4("hglDensityTight") : v4("hglDensityAiry")}</button>
        <button type="button" className="c4-btn" aria-pressed={sort === "steward"} onClick={() => setSort(hourSort(sort === "room" ? "steward" : "room"))}>{sort === "room" ? v4("hglSortSteward") : v4("hglSortRoom")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkHourPin(slips, picked))}>{v4("hglBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkHourArchive(slips, picked))}>{v4("hglBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkHourGrain(slips, picked))}>{v4("hglBulkGrain")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkHourTag(slips, picked, "y"))}>{v4("hglBulkTag")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkHourGlass(slips, picked, "gilt"))}>{v4("hglBulkGlass")}</button>
      </div>
      <div className="c4-hgl-tools" role="group" aria-label={v4("hglTray")}>
        {(["open", "held", "archived"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("hglOpen") : item === "held" ? v4("hglHeld") : v4("hglArchived")}</button>
        ))}
        {(["hall", "index"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={board === item ? "1" : "0"} onClick={() => setBoard(item)}>{item === "hall" ? v4("hglBoardHall") : v4("hglBoardIndex")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} aria-pressed={houseOnly} onClick={() => setHouseOnly((value) => !value)}>{v4("hglHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} aria-pressed={peakOnly} onClick={() => setPeakOnly((value) => !value)}>{v4("hglPeakOnly")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} aria-pressed={quietOnly} onClick={() => setQuietOnly((value) => !value)}>{v4("hglQuietOnly")}</button>
        <button type="button" className="c4-chip" data-on={stewardFilter === "all" ? "1" : "0"} onClick={() => setStewardFilter("all")}>{v4("hglAll")}</button>
        {stewards.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={stewardFilter === item ? "1" : "0"} onClick={() => setStewardFilter(item)}>{item}</button>
        ))}
        {GLASSES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={glassFilter === item ? "1" : "0"} onClick={() => setGlassFilter(activeGlass(glassFilter) === item ? "all" : item)}>{glassLabel(v4, item)}</button>
        ))}
        {GRAINS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={grainFilter === item ? "1" : "0"} onClick={() => setGrainFilter(activeGrain(grainFilter, GRAINS) === item ? "all" : item)}>{grainLabel(v4, item)}</button>
        ))}
        <button type="button" className="c4-chip" data-on={roomFilter === "all" ? "1" : "0"} onClick={() => setRoomFilter("all")}>{v4("hglAll")}</button>
        <button type="button" className="c4-chip" data-on={roomFilter === "peak" ? "1" : "0"} onClick={() => setRoomFilter("peak")}>{v4("hglPeak")}</button>
        <button type="button" className="c4-chip" data-on={roomFilter === "quiet" ? "1" : "0"} onClick={() => setRoomFilter("quiet")}>{v4("hglQuiet")}</button>
        {HOUR_ROOMS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={roomFilter === item ? "1" : "0"} onClick={() => setRoomFilter(activeRoom(roomFilter) === item ? "all" : item)}>{roomLabel(v4, item)}</button>
        ))}
        {SPANS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={spanFilter === item ? "1" : "0"} onClick={() => setSpanFilter(activeSpan(spanFilter) === item ? "all" : item)}>{item}</button>
        ))}
        {MASSES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={massFilter === item ? "1" : "0"} onClick={() => setMassFilter(activeMass(massFilter) === item ? "all" : item)}>{item}</button>
        ))}
      </div>
      <form className="c4-hgl-tools" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addHourView(views, { id: `view-${Date.now()}`, name: viewName, tray, query, steward: stewardFilter, glass: glassFilter, grain: grainFilter, room: roomFilter, span: spanFilter, mass: massFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("hglViewName")}</span><input className="c4-field" aria-label={v4("hglViewName")} value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("hglSaveView")}</button>
      </form>
      <ul className="c4-hgl-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("hglApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropHourView(views, view.id))}>{v4("hglDropView")}</button>
          </li>
        ))}
      </ul>
      {board === "hall" ? (
        <ol className="c4-hgl-board">
          {!shown.length && <li className="c4-hgl-empty">{v4("hglEmpty")}</li>}
          {shown.map((slip, index) => {
            const gap = roomGap(slip.room, desk);
            return (
              <li key={slip.id} className="c4-hgl-card" data-on={index === focusAt ? "1" : "0"} data-pinned={slip.pinned ? "1" : "0"} data-wax={slip.wax ? "1" : "0"} data-glass={slip.glass || "blank"} data-late={lateSlip(slip, desk) ? "1" : "0"} data-cooling={coolingSlip(slip) ? "1" : "0"} data-rush={rushSlip(slip) ? "1" : "0"} data-resting={restingSlip(slip) ? "1" : "0"}>
                <label className="c4-lab"><span>{v4("hglSelect")}</span><input type="checkbox" aria-label={v4("hglSelect")} checked={picked.includes(slip.id)} onChange={() => togglePick(slip.id)} /></label>
                <input className="c4-field" aria-label={v4("hglEdit")} value={slip.title} disabled={viewer} onChange={(event) => { if (!viewer) store(editHour(slips, slip.id, event.target.value)); }} />
                <input className="c4-field" aria-label={v4("hglEditNote")} value={slip.note} disabled={viewer} onChange={(event) => { if (!viewer) store(editHourNote(slips, slip.id, event.target.value)); }} />
                <p className="c4-hgl-meta">{slip.steward || v4("hglBlankSteward")} · {roomLabel(v4, slip.room)} · {glassLabel(v4, slip.glass)} · {grainLabel(v4, slip.grain)} · {slip.span ?? v4("hglBlankSpan")} · {v4("hglMass")} {slip.mass} · {slip.tags.join(" ") || v4("hglBlank")} · {bandLabel(v4, roomBand(slip.room))}{peakRoom(slip.room) ? ` · ${v4("hglPeak")}` : ""}{quietRoom(slip.room) ? ` · ${v4("hglQuiet")}` : ""}{houseGlass(slip.glass) ? ` · ${v4("hglHouse")}` : ""}{coolingSlip(slip) ? ` · ${v4("hglCooling")}` : ""}{rushSlip(slip) ? ` · ${v4("hglRush")}` : ""}{restingSlip(slip) ? ` · ${v4("hglResting")}` : ""}</p>
                <p className="c4-hgl-meta">{gap === null ? v4("hglBlank") : gap > 0 ? `${v4("hglPast")} ${gap}` : gap < 0 ? `${v4("hglAhead")} ${Math.abs(gap)}` : v4("hglDue")} · {AUDIT_KEY[slip.audit] ? v4(AUDIT_KEY[slip.audit]) : v4("hglBlank")} · {nextHour(slips, slip.id) ? `${v4("hglNext")} ${nextHour(slips, slip.id)?.title}` : v4("hglNextNone")}</p>
                <div className="c4-hgl-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleGrain(slips, slip.id))}>{v4("hglGrain")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setHourPin(slips, slip.id, !slip.pinned))}>{slip.pinned ? v4("hglUnpin") : v4("hglPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer || slip.archived} onClick={() => store(setHourHold(slips, slip.id, !slip.held))}>{slip.held ? v4("hglResume") : v4("hglHold")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setHourArchive(slips, slip.id, !slip.archived))}>{slip.archived ? v4("hglReopen") : v4("hglArchive")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setHourWax(slips, slip.id, !slip.wax))}>{slip.wax ? v4("hglUnwind") : v4("hglWax")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lengthenSpan(slips, slip.id))}>{v4("hglSpan")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(shortenSpan(slips, slip.id))}>{v4("hglShorten")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setHourMass(slips, slip.id, slip.mass === 8 ? "2" : slip.mass === 4 ? "8" : "4"))}>{v4("hglRaised")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setHourGlass(slips, slip.id, slip.glass === "GILT" ? "clear" : slip.glass === "SMOKED" ? "gilt" : "smoked"))}>{v4("hglGlass")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addHourTag(slips, slip.id, "z"))}>{v4("hglTag")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard.writeText(hourCopy(slip)).catch(() => undefined); setCopied(slip.id); }}>{copied === slip.id ? v4("hglCopied") : v4("hglCopy")}</button>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <ol className="c4-hgl-timeline">
          {!timeline.length && <li className="c4-hgl-empty">{v4("hglEmpty")}</li>}
          {timeline.map((lane) => <li key={lane.room}><span>{roomLabel(v4, lane.room)}</span><strong>{lane.titles.join(" · ")}</strong></li>)}
        </ol>
      )}
      <aside className="c4-hgl-side" aria-label={v4("hglReminders")}>
        <h3 className="c4-title">{v4("hglReminders")}</h3>
        {!reminders.length && <p>{v4("hglEmpty")}</p>}
        <ul>{reminders.map((slip) => <li key={slip.id}>{slip.title} · {lateSlip(slip, desk) ? v4("hglLate") : v4("hglSame")}</li>)}</ul>
        <h3 className="c4-title">{v4("hglCooling")}</h3>
        {!cooling.length && <p>{v4("hglCoolingEmpty")}</p>}
        <ul>{cooling.map((slip) => <li key={slip.id}>{slip.title}</li>)}</ul>
        {focused && <p>{v4("hglFocus")} {focused.title} · {hourShare(counts.house, Math.max(1, counts.open))}%</p>}
        <p>{clashRoomCount(slips) ? v4("hglClash") : v4("hglClashNone")} · {pairStewardCount(slips) ? v4("hglPair") : v4("hglPairNone")} · {massLoad(slips)} · {matchedSlips(slips, desk).length}</p>
      </aside>
    </section>
  );
}

function plateNote(row: TraderRow): SyllableValue {
  return { name: textField(row.name), ink: textField(row.retentionStatus), stand: textField(row.desk) };
}

export function SyllablePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: TraderRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [review, setReview] = useState<SyllableReview>("all");
  const [shape, setShape] = useState<SyllableShape>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const reviewRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  const rows = useMemo<SyllableRow[]>(() => (queue.data?.users || []).map((row, index) => ({
    id: row.id ? `trader-${row.id}` : `trader-${index}`,
    label: textField(row.name),
    note: plateNote(row),
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
    const present = presentSyllableLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenSyllables(readJson(SYL_KEY, []), present);
    const nextReviewed = readReviewedSyllables(readJson(SYL_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(SYL_KEY, nextHidden);
    writeJson(SYL_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentSyllableLanes(rows);
  const lanes = visibleSyllableLanes(present, hidden, showHidden);
  const shown = visibleSyllables(rows, lane, hue, query, review, reviewed, shape).filter((row) => {
    const token = syllableLane(row.note);
    if (!token) return true;
    return showHidden || !hidden.includes(token);
  });
  const focusAt = shown.length ? focus % shown.length : 0;
  useEffect(() => {
    reviewRef.current = () => {
      if (viewer) return;
      const row = shown[focusAt];
      if (!row) return;
      const next = toggleSyllableReview(reviewed, row.id);
      setReviewed(next);
      writeJson(SYL_REVIEW_KEY, next);
    };
  });
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveHourFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveHourFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        reviewRef.current();
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        const order: SyllableShape[] = ["all", "split", "wide", "bound", "notch", "dotted"];
        setShape((value) => order[(order.indexOf(value) + 1) % order.length]);
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown.length]);
  const lead = leadingSyllable(rows);
  const hueLead = leadingSyllableHue(rows);
  const shared = sharedSyllableCount(rows);
  const bound = rows.filter((row) => syllableBound(row.note)).length;
  const bars = syllableLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = shown.map((row) => row.id);
  const known = rows.filter((row) => syllableState(row.note) === "set").length;
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(SYL_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedSyllables(next, rows.map((row) => row.id));
    setReviewed(saved);
    writeJson(SYL_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-syl" aria-label={v4("sylTitle")} data-plates="1" data-desk="salon" data-traders={queue.data?.users?.length ? "1" : "0"} data-role={role} data-keyed={bound ? "1" : "0"}>
      <header className="c4-syl-mast">
        <p className="c4-syl-seal" data-logo="mono">{v4("sylLogo")}</p>
        <div>
          <p className="c4-syl-kicker">{v4("sylSub")}</p>
          <h2 className="c4-title">{v4("sylTitle")}</h2>
        </div>
        <ol className="c4-syl-index" aria-label={v4("sylTitle")}>
          <li data-tone="gold">{v4("sylChampagne")}</li>
          <li data-tone="ink">{v4("sylGraphite")}</li>
          <li data-tone="ivory">{v4("sylIvory")}</li>
        </ol>
      </header>
      <p className="c4-syl-links">
        <Link href={crmv4Href(base, "hgl")}>{v4("sylGallery")}</Link>
        <Link href={crmv4Href(base, "snippets")}>{v4("hglGallery")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("sylSub")}</Link>
      </p>
      {viewer && <p className="c4-syl-note">{v4("sylViewer")}</p>}
      <p className="c4-syl-rule">{v4("sylHint")}</p>
      <ul className="c4-syl-kpis" aria-label={v4("sylRules")}>
        <li><span>{v4("sylSet")}</span><strong>{known}</strong></li>
        <li><span>{v4("sylClear")}</span><strong>{rows.filter((row) => syllableState(row.note) === "clear").length}</strong></li>
        <li><span>{v4("sylSplit")}</span><strong>{laneSyllableCount(rows, "split")}</strong></li>
        <li><span>{v4("sylDotted")}</span><strong>{laneSyllableCount(rows, "dotted")}</strong></li>
        <li><span>{v4("sylMono")}</span><strong>{laneSyllableCount(rows, "mono")}</strong></li>
        <li><span>{v4("sylDual")}</span><strong>{laneSyllableCount(rows, "dual")}</strong></li>
        <li><span>{v4("sylCrowd")}</span><strong>{laneSyllableCount(rows, "crowd")}</strong></li>
        <li><span>{v4("sylHush")}</span><strong>{laneSyllableCount(rows, "hush")}</strong></li>
        <li><span>{v4("sylPearl")}</span><strong>{hueSyllableCount(rows, "pearl")}</strong></li>
        <li><span>{v4("sylNotch")}</span><strong>{rows.filter((row) => syllableNotch(row.note)).length}</strong></li>
        <li><span>{v4("sylWide")}</span><strong>{rows.filter((row) => syllableWide(row.note)).length}</strong></li>
        <li><span>{v4("sylJoin")}</span><strong>{rows.filter((row) => syllableJoin(row.note)).length}</strong></li>
        <li><span>{v4("sylShare")}</span><strong>{syllableShare(bound, Math.max(1, known))}%</strong></li>
        <li><span>{v4("sylShared")}</span><strong>{shared}</strong></li>
      </ul>
      <div className="c4-syl-bars" aria-label={v4("sylLead")}>
        {bars.map((bar) => (
          <div key={bar.lane} className="c4-syl-bar" data-lane={bar.lane}>
            <span>{laneLabel(v4, bar.lane)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <p className="c4-syl-meta">{lead ? `${v4("sylLead")} ${laneLabel(v4, lead)}` : v4("sylEmpty")} · {hueLead ? `${v4("sylToneLead")} ${hueLabel(v4, hueLead)}` : v4("sylUnmarked")}</p>
      <div className="c4-syl-tools">
        <label className="c4-lab"><span>{v4("sylSearch")}</span><input ref={searchRef} className="c4-field c4-syl-search" aria-label={v4("sylSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <button type="button" className="c4-btn" onClick={() => download("syllable-lanes.csv", platesCsv(rows))}>{v4("sylCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("syllable-rows.csv", plateRowsCsv(rows, reviewed))}>{v4("sylRowCsv")}</button>
        <button type="button" className="c4-btn" aria-pressed={showHidden} onClick={() => setShowHidden((value) => !value)}>{v4("sylShow")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkSyllableReview(reviewed, ids, true))}>{v4("sylBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkSyllableReview(reviewed, ids, false))}>{v4("sylBulkClear")}</button>
      </div>
      <div className="c4-syl-tools" role="group" aria-label={v4("sylAll")}>
        <button type="button" className="c4-chip" data-on={lane === "all" ? "1" : "0"} onClick={() => setLane("all")}>{v4("sylAll")}</button>
        {lanes.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={lane === item ? "1" : "0"} onClick={() => setLane(item)}>{laneLabel(v4, item)}</button>
        ))}
        {(["pearl", "slate", "sand", "clay", "soot", "mist"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(hue === item ? "all" : item)}>{hueLabel(v4, item)}</button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("sylAll") : item === "reviewed" ? v4("sylReviewed") : v4("sylUnreviewed")}</button>
        ))}
        {(["all", "split", "wide", "bound", "notch", "dotted"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{item === "all" ? v4("sylShapeAll") : item === "split" ? v4("sylShapeSplit") : item === "wide" ? v4("sylShapeWide") : item === "bound" ? v4("sylShapeBound") : item === "notch" ? v4("sylShapeNotch") : v4("sylShapeDotted")}</button>
        ))}
      </div>
      {!shown.length && <p className="c4-syl-empty">{v4("sylEmpty")}</p>}
      <ol className="c4-syl-board">
        {shown.map((row, index) => {
          const current = syllableLane(row.note);
          const hueName = syllableHue(row.note);
          return (
            <li key={row.id} className="c4-syl-card" data-on={index === focusAt ? "1" : "0"} data-lane={current || "blank"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"} data-wide={syllableWide(row.note) ? "1" : "0"} data-join={syllableJoin(row.note) ? "1" : "0"} data-notch={syllableNotch(row.note) ? "1" : "0"} data-bound={syllableBound(row.note) ? "1" : "0"}>
              <strong>{row.label || v4("sylClear")}</strong>
              <p className="c4-syl-meta">{v4("sylMark")} {syllableStamp(row.note) || v4("sylUnmarked")} · {laneLabel(v4, current)} · {hueLabel(v4, hueName)} · {v4("sylStep")} {syllableStep(row.note)} · {v4("sylStatus")} · {v4("sylDesk")}</p>
              <div className="c4-syl-tools">
                <button type="button" className="c4-btn" disabled={viewer || !current} onClick={() => storeHidden(toggleSyllable(hidden, current))}>{hidden.includes(current) ? v4("sylShow") : v4("sylHide")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleSyllableReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("sylReviewed") : v4("sylReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const body = syllableCopy(row.note); void navigator.clipboard.writeText(body).catch(() => undefined); setCopied(row.id); }}>{copied === row.id ? v4("sylCopied") : v4("sylCopy")}</button>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
