"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  FOG_WATCHES,
  FGL_DENSITY_KEY,
  FGL_KEY,
  FGL_VIEW_KEY,
  QPL_KEY,
  QPL_REVIEW_KEY,
  addBell,
  addBellTag,
  addBellView,
  bellBars,
  bellCopy,
  bellCounts,
  bellCsv,
  bellDensity,
  bellRingers,
  bellTimeline,
  briskBell,
  bulkBellChampagne,
  bulkBellBrass,
  bulkBellRing,
  bulkBellStow,
  bulkBellTag,
  bulkQuayReview,
  busiestRinger,
  clashWatchCount,
  cycleTone,
  dipPitch,
  dipPitchFocused,
  dropBellView,
  editBell,
  editBellNote,
  fairRinger,
  houseGlaze,
  idleBell,
  idleBells,
  keenWatch,
  laneQuayCount,
  lateBell,
  leadingQuay,
  leadingQuayHue,
  liftPitch,
  liftPitchFocused,
  lockBellFocused,
  lowerBead,
  lowerBeadFocused,
  moveBellFocus,
  neighborBellCount,
  overdueBell,
  presentQuayLanes,
  raiseBead,
  raiseBeadFocused,
  readBellViews,
  readBells,
  readHiddenQuays,
  readReviewedQuays,
  reminderBells,
  restingBell,
  setBellGlaze,
  setBellLock,
  setBellRung,
  setBellStar,
  setBellStow,
  sharedQuayCount,
  ringBellFocused,
  sortBells,
  quayCap,
  quayCopy,
  quayEcho,
  quayHue,
  quayKnown,
  quayLane,
  quayLanes,
  quayLanesCsv,
  quayLeap,
  quayNotch,
  quayRowsCsv,
  quayShare,
  quaySlash,
  quayStamp,
  quayStep,
  quayTail,
  quayTwin,
  quayWide,
  starBellFocused,
  stillWatch,
  suggestPitch,
  suggestGlaze,
  suggestWatch,
  tagBellFocused,
  toggleQuay,
  toggleQuayReview,
  toneFocused,
  visibleBells,
  visibleQuayLanes,
  visibleQuays,
  type BellDensity,
  type BellSort,
  type BellTray,
  type BellView,
  type FogBell,
  type QuayReview,
  type QuayRow,
  type QuayShape,
  type QuayValue,
} from "@/lib/crmv4/round277";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const METALS = ["ivory", "graphite", "champagne"] as const;
const VANES = ["glass", "cloth", "brass"] as const;
const ANGLES = ["10", "30", "60"] as const;
const RINGS = ["2", "4", "6", "8"] as const;

const STATION_KEY: Record<string, CrmV4CopyKey> = {
  lee: "fglLee",
  luff: "fglLuff",
  reach: "fglReach",
  run: "fglRun",
  keen: "fglKeen",
  still: "fglStill",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "fglAuditSave",
  edit: "fglAuditEdit",
  note: "fglAuditNote",
  vane: "fglAuditVane",
  sight: "fglAuditSight",
  unsight: "fglAuditUnsight",
  lock: "fglAuditLock",
  resume: "fglAuditResume",
  stow: "fglAuditStow",
  open: "fglAuditOpen",
  finish: "fglAuditFinish",
  tag: "fglAuditTag",
  ring: "fglAuditRing",
  angle: "fglAuditAngle",
  dip: "fglAuditDip",
  star: "fglAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  quay: "qplQuay",
  wharf: "qplWharf",
  mole: "qplMole",
  pier: "qplPier",
  channel: "qplChannel",
  roadstead: "qplRoadstead",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "qplIvory",
  graphite: "qplGraphite",
  champagne: "qplChampagne",
};

type NameRow = {
  id?: string;
  name?: string | null;
  country?: string | null;
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

function stationLabel(v4: V4, station: string): string {
  const key = STATION_KEY[station];
  return key ? v4(key) : v4("fglBlank");
}

function finishLabel(v4: V4, finish: string): string {
  if (finish === "IVORY") return v4("fglIvory");
  if (finish === "GRAPHITE") return v4("fglGraphite");
  if (finish === "CHAMPAGNE") return v4("fglChampagne");
  return v4("fglBlankFinish");
}

function vaneLabel(v4: V4, vane: string): string {
  if (vane === "glass") return v4("fglGlass");
  if (vane === "cloth") return v4("fglCloth");
  if (vane === "brass") return v4("fglBrass");
  return v4("fglBlankVane");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("qplUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("qplUnmarked");
}

export function FogBells({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<FogBell[]>([]);
  const [views, setViews] = useState<BellView[]>([]);
  const [density, setDensity] = useState<BellDensity>("open");
  const [sheet, setSheet] = useState<"rose" | "index">("rose");
  const [tray, setTray] = useState<BellTray>("deck");
  const [query, setQuery] = useState("");
  const [helmsmanFilter, setHelmsmanFilter] = useState("all");
  const [finishFilter, setFinishFilter] = useState("all");
  const [vaneFilter, setVaneFilter] = useState("all");
  const [stationFilter, setStationFilter] = useState("all");
  const [angleFilter, setAngleFilter] = useState("all");
  const [ringFilter, setRingFilter] = useState("all");
  const [houseOnly, setHouseOnly] = useState(false);
  const [keenOnly, setKeenOnly] = useState(false);
  const [stillOnly, setStillOnly] = useState(false);
  const [sort, setSort] = useState<BellSort>("watch");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [helmsman, setHelmsman] = useState("");
  const [station, setStation] = useState("");
  const [finish, setFinish] = useState("");
  const [vane, setVane] = useState("");
  const [angleNo, setAngleNo] = useState("");
  const [ringNo, setRingNo] = useState("2");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [copied, setCopied] = useState("");
  const [desk, setDesk] = useState("lee");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readBells(readJson(FGL_KEY, [])));
    setViews(readBellViews(readJson(FGL_VIEW_KEY, [])));
    setDensity(bellDensity(readJson(FGL_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: FogBell[]) {
    setCards(next);
    writeJson(FGL_KEY, next);
  }
  function storeViews(next: BellView[]) {
    setViews(next);
    writeJson(FGL_VIEW_KEY, next);
  }
  function storeDensity(next: BellDensity) {
    setDensity(next);
    writeJson(FGL_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortBells(visibleBells(cards, tray, query, helmsmanFilter, finishFilter, vaneFilter, stationFilter, angleFilter, ringFilter, houseOnly, keenOnly, stillOnly), sort),
    [cards, tray, query, helmsmanFilter, finishFilter, vaneFilter, stationFilter, angleFilter, ringFilter, houseOnly, keenOnly, stillOnly, sort],
  );
  const counts = bellCounts(cards, shown, desk);
  const bars = bellBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = bellTimeline(cards);
  const helmsmen = bellRingers(cards);
  const ids = shown.map((card) => card.id);
  const suggested = suggestGlaze(cards);
  const fair = fairRinger(cards, helmsmen.join(","));
  const busy = busiestRinger(cards);
  const reminders = reminderBells(cards);
  const idling = idleBells(cards);
  const angleHint = suggestPitch(cards, clock);
  const stationHint = suggestWatch(clock);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setHelmsman("");
        setStation("");
        setFinish("");
        setVane("");
        setAngleNo("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveBellFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveBellFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        if (!viewer) store(ringBellFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        if (!viewer) store(lockBellFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        if (!viewer) store(toneFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        if (!viewer) store(liftPitchFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        if (!viewer) store(dipPitchFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        if (!viewer) store(tagBellFocused(cards, ids, focusAt, "a"));
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        if (!viewer) store(starBellFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        if (!viewer) store(raiseBeadFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "y" || event.key === "Y") {
        event.preventDefault();
        if (!viewer) store(lowerBeadFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "b" || event.key === "B") {
        event.preventDefault();
        setSheet((value) => (value === "rose" ? "index" : "rose"));
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown.length, viewer, cards, ids, focusAt]);

  function togglePick(id: string) {
    setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function applyView(view: BellView) {
    setTray(view.tray);
    setQuery(view.query);
    setHelmsmanFilter(view.helmsman || "all");
    setFinishFilter(view.finish);
    setVaneFilter(view.vane);
    setStationFilter(view.station);
    setAngleFilter(view.angle);
    setRingFilter(view.ring);
  }

  return (
    <section className="c4-fogbell" aria-label={v4("fglTitle")} data-cards="1" data-desk="fogbell" data-role={role} data-density={density} data-sheet={sheet}>
      <header className="c4-fogbell-mast">
        <p className="c4-fogbell-rose" data-logo="mono" aria-hidden="true">
          <span>{v4("fglLogo")}</span>
          <i />
          <b />
        </p>
        <div className="c4-fogbell-mast-copy">
          <p className="c4-fogbell-kicker">{v4("fglSub")}</p>
          <h2 className="c4-title">{v4("fglTitle")}</h2>
        </div>
        <ol className="c4-fogbell-vanes" aria-hidden="true">
          <li>{v4("fglGlass")}</li>
          <li>{v4("fglCloth")}</li>
          <li>{v4("fglBrass")}</li>
        </ol>
      </header>
      <p className="c4-fogbell-links">
        <Link href={crmv4Href(base, "qpl")}>{v4("fglPlates")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("fglCustomers")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("fglDossier")}</Link>
      </p>
      {viewer && <p className="c4-fogbell-note">{v4("fglViewer")}</p>}
      <p className="c4-fogbell-lead">{v4("fglKeys")}</p>
      <p className="c4-fogbell-hint">{v4("fglHint")}</p>
      <p className="c4-fogbell-notice" role="status">{v4("fglNotice")} {counts.overdue}</p>
      <ol className="c4-fogbell-dials" aria-label={v4("fglChart")}>
        <li><span>{v4("fglDeck")}</span><strong>{counts.deck}</strong></li>
        <li><span>{v4("fglBerth")}</span><strong>{counts.berth}</strong></li>
        <li><span>{v4("fglLocker")}</span><strong>{counts.locker}</strong></li>
        <li><span>{v4("fglSighted")}</span><strong>{counts.sighted}</strong></li>
        <li><span>{v4("fglKeen")}</span><strong>{counts.keen}</strong></li>
        <li><span>{v4("fglStill")}</span><strong>{counts.still}</strong></li>
        <li><span>{v4("fglOverdue")}</span><strong>{counts.overdue}</strong></li>
        <li><span>{v4("fglHouse")}</span><strong>{counts.house}</strong></li>
      </ol>
      <div className="c4-fogbell-chart" aria-label={v4("fglBars")}>
        {bars.map((bar) => (
          <div key={bar.station} className="c4-fogbell-column" data-watch={bar.station}>
            <i style={{ height: `${Math.max(8, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{stationLabel(v4, bar.station)}</span>
          </div>
        ))}
      </div>
      <ol className="c4-fogbell-timeline" aria-label={v4("fglRing")}>
        {timeline.map((lane) => (
          <li key={lane.ring}><span>{lane.ring}</span><strong>{lane.titles.join(" · ")}</strong></li>
        ))}
      </ol>
      <div className="c4-fogbell-tools">
        {(["deck", "berth", "locker"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "deck" ? v4("fglDeck") : item === "berth" ? v4("fglBerth") : v4("fglLocker")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("fglHouse")}</button>
        <button type="button" className="c4-chip" data-on={keenOnly ? "1" : "0"} onClick={() => setKeenOnly((value) => !value)}>{v4("fglKeen")}</button>
        <button type="button" className="c4-chip" data-on={stillOnly ? "1" : "0"} onClick={() => setStillOnly((value) => !value)}>{v4("fglStill")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "open" ? "close" : "open")}>{density === "open" ? v4("fglAiry") : v4("fglTight")}</button>
        <button type="button" className="c4-chip" data-on={sheet === "index" ? "1" : "0"} onClick={() => setSheet(sheet === "rose" ? "index" : "rose")}>{sheet === "rose" ? v4("fglRose") : v4("fglIndex")}</button>
      </div>
      <div className="c4-fogbell-tools">
        <input ref={searchRef} className="c4-field c4-fogbell-search" aria-label={v4("fglSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("fglSearch")} />
        <select className="c4-select" aria-label={v4("fglStation")} value={stationFilter} onChange={(event) => setStationFilter(event.target.value)}>
          <option value="all">{v4("fglAll")}</option>
          {FOG_WATCHES.map((item) => <option key={item} value={item}>{stationLabel(v4, item)}</option>)}
          <option value="keen">{v4("fglKeen")}</option>
          <option value="still">{v4("fglStill")}</option>
        </select>
        <select className="c4-select" aria-label={v4("fglFinish")} value={finishFilter} onChange={(event) => setFinishFilter(event.target.value)}>
          <option value="all">{v4("fglAll")}</option>
          {METALS.map((item) => <option key={item} value={item}>{finishLabel(v4, item.toUpperCase())}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("fglVane")} value={vaneFilter} onChange={(event) => setVaneFilter(event.target.value)}>
          <option value="all">{v4("fglAll")}</option>
          {VANES.map((item) => <option key={item} value={item}>{vaneLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("fglAngle")} value={angleFilter} onChange={(event) => setAngleFilter(event.target.value)}>
          <option value="all">{v4("fglAll")}</option>
          {ANGLES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("fglRing")} value={ringFilter} onChange={(event) => setRingFilter(event.target.value)}>
          <option value="all">{v4("fglAll")}</option>
          {RINGS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("fglFair")} value={helmsmanFilter} onChange={(event) => setHelmsmanFilter(event.target.value)}>
          <option value="all">{v4("fglAll")}</option>
          {helmsmen.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("fglStation")} value={desk} onChange={(event) => setDesk(event.target.value)}>
          {FOG_WATCHES.map((item) => <option key={item} value={item}>{stationLabel(v4, item)}</option>)}
        </select>
      </div>
      <form className="c4-fogbell-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addBell(cards, { id: `fgl-${Date.now()}`, title, note, helmsman, station, finish, vane, angle: angleNo, ring: ringNo, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <label className="c4-lab"><span>{v4("fglAdd")}</span><input className="c4-field" aria-label={v4("fglAdd")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("fglNote")}</span><input className="c4-field" aria-label={v4("fglNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("fglFair")}</span><input className="c4-field" aria-label={v4("fglFair")} aria-required={false} value={helmsman} disabled={viewer} onChange={(event) => setHelmsman(event.target.value)} /></label>
        <select className="c4-select" aria-label={v4("fglStation")} value={station} disabled={viewer} onChange={(event) => setStation(event.target.value)}>
          <option value="">{v4("fglBlankStation")}</option>
          {FOG_WATCHES.map((item) => <option key={item} value={item}>{stationLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("fglFinish")} value={finish} disabled={viewer} onChange={(event) => setFinish(event.target.value)}>
          <option value="">{v4("fglBlankFinish")}</option>
          {METALS.map((item) => <option key={item} value={item}>{finishLabel(v4, item.toUpperCase())}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("fglVane")} value={vane} disabled={viewer} onChange={(event) => setVane(event.target.value)}>
          <option value="">{v4("fglBlankVane")}</option>
          {VANES.map((item) => <option key={item} value={item}>{vaneLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("fglAngle")} value={angleNo} disabled={viewer} onChange={(event) => setAngleNo(event.target.value)}>
          <option value="">{v4("fglBlankAngle")}</option>
          {ANGLES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("fglRing")} value={ringNo} disabled={viewer} onChange={(event) => setRingNo(event.target.value)}>
          {RINGS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <label className="c4-lab"><span>{v4("fglTags")}</span><input className="c4-field" aria-label={v4("fglTags")} aria-required={false} value={tags} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("fglAdd")}</button>
      </form>
      <form className="c4-fogbell-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addBellView(views, { id: `view-${Date.now()}`, name: viewName, tray, query, helmsman: helmsmanFilter, finish: finishFilter, vane: vaneFilter, station: stationFilter, angle: angleFilter, ring: ringFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("fglViewName")}</span><input className="c4-field" aria-label={v4("fglViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("fglSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-fogbell-view">
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("fglApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropBellView(views, view.id))}>{v4("fglDropView")}</button>
          </span>
        ))}
      </form>
      {picked.length > 0 && (
        <div className="c4-fogbell-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBellRing(cards, picked))}>{v4("fglBulkSight")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBellStow(cards, picked))}>{v4("fglBulkStow")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBellBrass(cards, picked))}>{v4("fglBulkMirror")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBellChampagne(cards, picked))}>{v4("fglBulkSilk")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBellTag(cards, picked, "b"))}>{v4("fglBulkTag")}</button>
        </div>
      )}
      <p className="c4-fogbell-meta">{v4("fglSuggest")} {finishLabel(v4, suggested)} · {v4("fglFair")} {fair} · {v4("fglBusy")} {busy || v4("fglBlankKeeper")} · {v4("fglNeighbors")} {neighborBellCount(cards)} · {v4("fglClash")} {clashWatchCount(cards)} · {v4("fglAngleHint")} {angleHint} · {v4("fglStationHint")} {stationLabel(v4, stationHint)}</p>
      {(reminders.length > 0 || idling.length > 0) && (
        <p className="c4-fogbell-meta">{v4("fglDue")} {reminders.map((card) => card.title).join(" · ")} · {v4("fglIdle")} {idling.map((card) => card.title).join(" · ")}</p>
      )}
      {!shown.length && <p className="c4-fogbell-empty">{v4("fglEmpty")}</p>}
      <ol className={sheet === "index" ? "c4-fogbell-index" : "c4-fogbell-board"} data-density={density}>
        {shown.map((card, index) => {
          const sweep = card.angle === null ? 8 : Math.round((card.angle / 60) * 100);
          return (
            <li key={card.id} className="c4-fogbell-card" data-on={index === focusAt ? "1" : "0"} data-sighted={card.sighted ? "1" : "0"} data-overdue={overdueBell(card) ? "1" : "0"} data-keen={keenWatch(card.station) ? "1" : "0"} data-still={stillWatch(card.station) ? "1" : "0"} data-house={houseGlaze(card.finish) ? "1" : "0"} data-brisk={briskBell(card) ? "1" : "0"} data-idle={idleBell(card) ? "1" : "0"} data-resting={restingBell(card) ? "1" : "0"} data-late={lateBell(card, desk) ? "1" : "0"}>
              <div className="c4-fogbell-face" aria-hidden="true">
                <i style={{ transform: `rotate(${sweep * 1.8 - 90}deg)` }} />
                <span>{card.angle ?? "·"}</span>
              </div>
              <ol className="c4-fogbell-ticks" aria-hidden="true">
                {RINGS.map((tick) => <li key={tick} data-on={String(card.ring) === tick ? "1" : "0"} />)}
              </ol>
              <label className="c4-fogbell-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => togglePick(card.id)} /></label>
              <div>
                <input className="c4-field" aria-label={v4("fglEdit")} value={card.title} disabled={viewer} onChange={(event) => store(editBell(cards, card.id, event.target.value))} />
                <input className="c4-field" aria-label={v4("fglEditNote")} aria-required={false} value={card.note} disabled={viewer} onChange={(event) => store(editBellNote(cards, card.id, event.target.value))} />
                <p className="c4-fogbell-meta">{card.helmsman || v4("fglBlankKeeper")} · {stationLabel(v4, card.station)} · {finishLabel(v4, card.finish)} · {vaneLabel(v4, card.vane)} · {card.angle ?? v4("fglBlankAngle")} · {v4("fglRing")} {card.ring} · {card.tags.join(" ") || v4("fglTags")}</p>
                <p className="c4-fogbell-meta">{stationLabel(v4, desk)} · {AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : v4("fglAuditSave")}</p>
                <div className="c4-fogbell-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBellRung(cards, card.id, !card.sighted))}>{card.sighted ? v4("fglUnsight") : v4("fglSight")}</button>
                  <button type="button" className="c4-btn" disabled={viewer || card.stowed} onClick={() => store(setBellLock(cards, card.id, !card.locked))}>{card.locked ? v4("fglResume") : v4("fglLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBellStow(cards, card.id, !card.stowed))}>{card.stowed ? v4("fglOpenAgain") : v4("fglStowed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBellStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("fglUnstar") : v4("fglStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleTone(cards, card.id))}>{v4("fglVane")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftPitch(cards, card.id))}>{v4("fglLift")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(dipPitch(cards, card.id))}>{v4("fglDip")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseBead(cards, card.id))}>{v4("fglRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerBead(cards, card.id))}>{v4("fglLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBellGlaze(cards, card.id, card.finish === "CHAMPAGNE" ? "ivory" : "champagne"))}>{v4("fglFinish")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addBellTag(cards, card.id, "a"))}>{v4("fglTags")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(bellCopy(card)); setCopied(card.id); }}>{copied === card.id ? v4("fglCopied") : v4("fglCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <button type="button" className="c4-btn" onClick={() => { setSort(sort === "watch" ? "ringer" : "watch"); }}>{sort === "watch" ? v4("fglSortHelmsman") : v4("fglSortStation")}</button>
      <button type="button" className="c4-btn" onClick={() => download("fog-bells.csv", bellCsv(shown, desk))}>{v4("fglCsv")}</button>
    </section>
  );
}

export function QuayPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: NameRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [shape, setShape] = useState<QuayShape>("all");
  const [review, setReview] = useState<QuayReview>("all");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<QuayRow[]>(() => (queue.data?.users || []).map((row, index) => ({
    id: row.id ? `name-${row.id}` : `name-${index}`,
    label: textField(row.name),
    note: { country: textField(row.country) } satisfies QuayValue,
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
    const present = presentQuayLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenQuays(readJson(QPL_KEY, []), present);
    const nextReviewed = readReviewedQuays(readJson(QPL_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(QPL_KEY, nextHidden);
    writeJson(QPL_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentQuayLanes(rows);
  const lanes = visibleQuayLanes(present, hidden, showHidden);
  const shown = visibleQuays(rows, lane, hue, query, review, reviewed, shape).filter((row) => {
    const token = quayLane(row.note);
    if (!token) return true;
    return showHidden || !hidden.includes(token);
  });
  const focusAt = shown.length ? focus % shown.length : 0;
  const bars = quayLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingQuay(rows);
  const leadHue = leadingQuayHue(rows);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveBellFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveBellFocus(index, shown.length, -1));
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
  }, [shown.length, focusAt]);
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(QPL_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(QPL_REVIEW_KEY, next);
  }
  return (
    <section className="c4-quay" aria-label={v4("qplTitle")} data-plates="1" data-names={rows.length} data-role={role}>
      <header className="c4-quay-mast">
        <p className="c4-quay-seal" data-logo="mono">{v4("qplLogo")}</p>
        <div>
          <p className="c4-quay-kicker">{v4("qplSub")}</p>
          <h2 className="c4-title">{v4("qplTitle")}</h2>
        </div>
      </header>
      <ol className="c4-quay-index" aria-label={v4("qplTitle")}>
        <li data-tone="gold">{v4("qplPier")}</li>
        <li data-tone="ink">{v4("qplQuay")}</li>
        <li data-tone="ivory">{v4("qplWharf")}</li>
        <li data-tone="mist">{v4("qplMole")}</li>
        <li data-tone="line">{v4("qplChannel")}</li>
      </ol>
      <p className="c4-quay-links">
        <Link href={crmv4Href(base, "fgl")}>{v4("qplPelorus")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("fglCustomers")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("fglDossier")}</Link>
      </p>
      <p className="c4-quay-hint">{v4("qplHint")}</p>
      {viewer && <p className="c4-quay-note">{v4("qplViewer")}</p>}
      {queue.loading && <p className="c4-quay-meta">{v4("qplEmpty")}</p>}
      {queue.error && <p className="c4-quay-meta">{queue.error}</p>}
      <ul className="c4-quay-kpis" aria-label={v4("qplRules")}>
        <li><span>{v4("qplLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("qplUnmarked")}</strong></li>
        <li><span>{v4("qplToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("qplUnmarked")}</strong></li>
        <li><span>{v4("qplShared")}</span><strong>{sharedQuayCount(rows)}</strong></li>
        <li><span>{v4("qplShare")}</span><strong>{quayShare(laneQuayCount(rows, "pier"), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("qplKnown")}</span><strong>{rows.filter((row) => quayKnown(row.note)).length}</strong></li>
        <li><span>{v4("qplTwin")}</span><strong>{rows.filter((row) => quayTwin(row.note)).length}</strong></li>
        <li><span>{v4("qplSlash")}</span><strong>{rows.filter((row) => quaySlash(row.note)).length}</strong></li>
        <li><span>{v4("qplEcho")}</span><strong>{rows.filter((row) => quayEcho(row.note)).length}</strong></li>
      </ul>
      <div className="c4-quay-chart" aria-label={v4("qplRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-quay-column" data-on={lane === bar.lane ? "1" : "0"} data-lane={bar.lane} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ height: `${Math.max(12, Math.round((bar.count / maxBar) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{laneLabel(v4, bar.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-quay-tools">
        <input ref={searchRef} className="c4-field c4-quay-search" aria-label={v4("qplSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("qplSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("qplAll") : hueLabel(v4, item)}</button>
        ))}
        {(["all", "quay", "wharf", "mole", "pier", "channel", "roadstead", "wide", "notch", "leap", "slash", "twin", "known", "echo"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>
            {item === "all" ? v4("qplShapeAll") : item === "wide" ? v4("qplShapeWide") : item === "notch" ? v4("qplShapeNotch") : item === "leap" ? v4("qplShapeLeap") : item === "slash" ? v4("qplShapeSlash") : item === "twin" ? v4("qplShapeTwin") : item === "known" ? v4("qplShapeKnown") : item === "echo" ? v4("qplShapeEcho") : laneLabel(v4, item)}
          </button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("qplAll") : item === "reviewed" ? v4("qplReviewed") : v4("qplUnreviewed")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("qplShow")}</button>
      </div>
      <ul className="c4-quay-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleQuay(hidden, item))}>{hidden.includes(item) ? v4("qplShow") : v4("qplHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-quay-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkQuayReview(reviewed, picked, true))}>{v4("qplBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkQuayReview(reviewed, picked, false))}>{v4("qplBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-quay-empty">{v4("qplEmpty")}</p>}
      <ol className="c4-quay-board">
        {shown.map((row, index) => {
          const seen = reviewed.includes(row.id);
          return (
            <li key={row.id} className="c4-quay-card" data-on={index === focusAt ? "1" : "0"} data-lane={quayLane(row.note)} data-hue={quayHue(row.note)} data-reviewed={seen ? "1" : "0"} data-known={quayKnown(row.note) ? "1" : "0"}>
              <p className="c4-quay-stamp">{quayStamp(row.note) || "·"}</p>
              <label className="c4-quay-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label || row.id} onChange={() => setPicked((current) => (current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id]))} /></label>
              <div>
                <strong>{row.label || v4("qplUnmarked")}</strong>
                <p className="c4-quay-meta">{laneLabel(v4, quayLane(row.note))} · {hueLabel(v4, quayHue(row.note))} · {v4("qplStep")} {quayStep(row.note)}{quayCap(row.note) ? ` · ${v4("qplCap")}` : ""}{quayTail(row.note) ? ` · ${v4("qplTail")}` : ""}{quayWide(row.note) ? ` · ${v4("qplWide")}` : ""}{quayNotch(row.note) ? ` · ${v4("qplNotch")}` : ""}{quayLeap(row.note) ? ` · ${v4("qplLeap")}` : ""}</p>
                <div className="c4-quay-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleQuayReview(reviewed, row.id))}>{seen ? v4("qplReviewed") : v4("qplReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(quayCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("qplCopied") : v4("qplCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="c4-quay-tools">
        <button type="button" className="c4-btn" onClick={() => download("quay-lanes.csv", quayLanesCsv(rows))}>{v4("qplCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("quay-rows.csv", quayRowsCsv(shown, reviewed))}>{v4("qplRowCsv")}</button>
      </div>
    </section>
  );
}
