"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  PELORUS_STATIONS,
  PLR_DENSITY_KEY,
  PLR_KEY,
  PLR_VIEW_KEY,
  SND_KEY,
  SND_REVIEW_KEY,
  addBearing,
  addBearingTag,
  addBearingView,
  bearingBars,
  bearingCopy,
  bearingCounts,
  bearingCsv,
  bearingDensity,
  bearingHelmsmen,
  bearingTimeline,
  briskBearing,
  bulkBearingChampagne,
  bulkBearingMirrored,
  bulkBearingSight,
  bulkBearingStow,
  bulkBearingTag,
  bulkSoundingReview,
  busiestHelmsman,
  clashStationCount,
  cycleVane,
  dipAngle,
  dipAngleFocused,
  dropBearingView,
  editBearing,
  editBearingNote,
  fairHelmsman,
  houseMetal,
  idleBearing,
  idleBearings,
  keenStation,
  laneSoundingCount,
  lateBearing,
  leadingSounding,
  leadingSoundingHue,
  liftAngle,
  liftAngleFocused,
  lockBearingFocused,
  lowerRing,
  lowerRingFocused,
  movePelorusFocus,
  neighborBearingCount,
  overdueBearing,
  presentSoundingLanes,
  raiseRing,
  raiseRingFocused,
  readBearingViews,
  readBearings,
  readHiddenSoundings,
  readReviewedSoundings,
  reminderBearings,
  restingBearing,
  setBearingFinish,
  setBearingLock,
  setBearingSight,
  setBearingStar,
  setBearingStow,
  sharedSoundingCount,
  sightBearingFocused,
  sortBearings,
  soundingCap,
  soundingCopy,
  soundingEcho,
  soundingHue,
  soundingKnown,
  soundingLane,
  soundingLanes,
  soundingLanesCsv,
  soundingLeap,
  soundingNotch,
  soundingRowsCsv,
  soundingShare,
  soundingSlash,
  soundingStamp,
  soundingStep,
  soundingTail,
  soundingTwin,
  soundingWide,
  starBearingFocused,
  stillStation,
  suggestAngle,
  suggestMetal,
  suggestStation,
  tagBearingFocused,
  toggleSounding,
  toggleSoundingReview,
  vaneFocused,
  visibleBearings,
  visibleSoundingLanes,
  visibleSoundings,
  type BearingDensity,
  type BearingSort,
  type BearingTray,
  type BearingView,
  type PelorusBearing,
  type SoundingReview,
  type SoundingRow,
  type SoundingShape,
  type SoundingValue,
} from "@/lib/crmv4/round276";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const METALS = ["ivory", "graphite", "champagne"] as const;
const VANES = ["plain", "shaded", "mirrored"] as const;
const ANGLES = ["0", "45", "90"] as const;
const RINGS = ["1", "3", "5", "7"] as const;

const STATION_KEY: Record<string, CrmV4CopyKey> = {
  bow: "plrBow",
  beam: "plrBeam",
  quarter: "plrQuarter",
  stern: "plrStern",
  keen: "plrKeen",
  still: "plrStill",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "plrAuditSave",
  edit: "plrAuditEdit",
  note: "plrAuditNote",
  vane: "plrAuditVane",
  sight: "plrAuditSight",
  unsight: "plrAuditUnsight",
  lock: "plrAuditLock",
  resume: "plrAuditResume",
  stow: "plrAuditStow",
  open: "plrAuditOpen",
  finish: "plrAuditFinish",
  tag: "plrAuditTag",
  ring: "plrAuditRing",
  angle: "plrAuditAngle",
  dip: "plrAuditDip",
  star: "plrAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  harbor: "sndHarbor",
  road: "sndRoad",
  cove: "sndCove",
  fathom: "sndFathom",
  channel: "sndChannel",
  estuary: "sndEstuary",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "sndIvory",
  graphite: "sndGraphite",
  champagne: "sndChampagne",
};

type NameRow = {
  id?: string;
  name?: string | null;
  affiliateB?: string | null;
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
  return key ? v4(key) : v4("plrBlank");
}

function finishLabel(v4: V4, finish: string): string {
  if (finish === "IVORY") return v4("plrIvory");
  if (finish === "GRAPHITE") return v4("plrGraphite");
  if (finish === "CHAMPAGNE") return v4("plrChampagne");
  return v4("plrBlankFinish");
}

function vaneLabel(v4: V4, vane: string): string {
  if (vane === "plain") return v4("plrPlain");
  if (vane === "shaded") return v4("plrShaded");
  if (vane === "mirrored") return v4("plrMirrored");
  return v4("plrBlankVane");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("sndUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("sndUnmarked");
}

export function PelorusBearings({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<PelorusBearing[]>([]);
  const [views, setViews] = useState<BearingView[]>([]);
  const [density, setDensity] = useState<BearingDensity>("airy");
  const [sheet, setSheet] = useState<"rose" | "index">("rose");
  const [tray, setTray] = useState<BearingTray>("bridge");
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
  const [sort, setSort] = useState<BearingSort>("station");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [helmsman, setHelmsman] = useState("");
  const [station, setStation] = useState("");
  const [finish, setFinish] = useState("");
  const [vane, setVane] = useState("");
  const [angleNo, setAngleNo] = useState("");
  const [ringNo, setRingNo] = useState("1");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [copied, setCopied] = useState("");
  const [desk, setDesk] = useState("bow");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readBearings(readJson(PLR_KEY, [])));
    setViews(readBearingViews(readJson(PLR_VIEW_KEY, [])));
    setDensity(bearingDensity(readJson(PLR_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: PelorusBearing[]) {
    setCards(next);
    writeJson(PLR_KEY, next);
  }
  function storeViews(next: BearingView[]) {
    setViews(next);
    writeJson(PLR_VIEW_KEY, next);
  }
  function storeDensity(next: BearingDensity) {
    setDensity(next);
    writeJson(PLR_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortBearings(visibleBearings(cards, tray, query, helmsmanFilter, finishFilter, vaneFilter, stationFilter, angleFilter, ringFilter, houseOnly, keenOnly, stillOnly), sort),
    [cards, tray, query, helmsmanFilter, finishFilter, vaneFilter, stationFilter, angleFilter, ringFilter, houseOnly, keenOnly, stillOnly, sort],
  );
  const counts = bearingCounts(cards, shown, desk);
  const bars = bearingBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = bearingTimeline(cards);
  const helmsmen = bearingHelmsmen(cards);
  const ids = shown.map((card) => card.id);
  const suggested = suggestMetal(cards);
  const fair = fairHelmsman(cards, helmsmen.join(","));
  const busy = busiestHelmsman(cards);
  const reminders = reminderBearings(cards);
  const idling = idleBearings(cards);
  const angleHint = suggestAngle(cards, clock);
  const stationHint = suggestStation(clock);

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
        setFocusAt((index) => movePelorusFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => movePelorusFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        if (!viewer) store(sightBearingFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        if (!viewer) store(lockBearingFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        if (!viewer) store(vaneFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        if (!viewer) store(liftAngleFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        if (!viewer) store(dipAngleFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        if (!viewer) store(tagBearingFocused(cards, ids, focusAt, "a"));
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        if (!viewer) store(starBearingFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        if (!viewer) store(raiseRingFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "y" || event.key === "Y") {
        event.preventDefault();
        if (!viewer) store(lowerRingFocused(cards, ids, focusAt));
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

  function applyView(view: BearingView) {
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
    <section className="c4-pelorus" aria-label={v4("plrTitle")} data-cards="1" data-desk="pelorus" data-role={role} data-density={density} data-sheet={sheet}>
      <header className="c4-pelorus-mast">
        <p className="c4-pelorus-rose" data-logo="mono" aria-hidden="true">
          <span>{v4("plrLogo")}</span>
          <i />
          <b />
        </p>
        <div className="c4-pelorus-mast-copy">
          <p className="c4-pelorus-kicker">{v4("plrSub")}</p>
          <h2 className="c4-title">{v4("plrTitle")}</h2>
        </div>
        <ol className="c4-pelorus-vanes" aria-hidden="true">
          <li>{v4("plrPlain")}</li>
          <li>{v4("plrShaded")}</li>
          <li>{v4("plrMirrored")}</li>
        </ol>
      </header>
      <p className="c4-pelorus-links">
        <Link href={crmv4Href(base, "snd")}>{v4("plrPlates")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("plrCustomers")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("plrDossier")}</Link>
      </p>
      {viewer && <p className="c4-pelorus-note">{v4("plrViewer")}</p>}
      <p className="c4-pelorus-lead">{v4("plrKeys")}</p>
      <p className="c4-pelorus-hint">{v4("plrHint")}</p>
      <p className="c4-pelorus-notice" role="status">{v4("plrNotice")} {counts.overdue}</p>
      <ol className="c4-pelorus-dials" aria-label={v4("plrChart")}>
        <li><span>{v4("plrBridge")}</span><strong>{counts.bridge}</strong></li>
        <li><span>{v4("plrCabin")}</span><strong>{counts.cabin}</strong></li>
        <li><span>{v4("plrHold")}</span><strong>{counts.hold}</strong></li>
        <li><span>{v4("plrSighted")}</span><strong>{counts.sighted}</strong></li>
        <li><span>{v4("plrKeen")}</span><strong>{counts.keen}</strong></li>
        <li><span>{v4("plrStill")}</span><strong>{counts.still}</strong></li>
        <li><span>{v4("plrOverdue")}</span><strong>{counts.overdue}</strong></li>
        <li><span>{v4("plrHouse")}</span><strong>{counts.house}</strong></li>
      </ol>
      <div className="c4-pelorus-chart" aria-label={v4("plrBars")}>
        {bars.map((bar) => (
          <div key={bar.station} className="c4-pelorus-column" data-station={bar.station}>
            <i style={{ height: `${Math.max(8, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{stationLabel(v4, bar.station)}</span>
          </div>
        ))}
      </div>
      <ol className="c4-pelorus-timeline" aria-label={v4("plrRing")}>
        {timeline.map((lane) => (
          <li key={lane.ring}><span>{lane.ring}</span><strong>{lane.titles.join(" · ")}</strong></li>
        ))}
      </ol>
      <div className="c4-pelorus-tools">
        {(["bridge", "cabin", "hold"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "bridge" ? v4("plrBridge") : item === "cabin" ? v4("plrCabin") : v4("plrHold")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("plrHouse")}</button>
        <button type="button" className="c4-chip" data-on={keenOnly ? "1" : "0"} onClick={() => setKeenOnly((value) => !value)}>{v4("plrKeen")}</button>
        <button type="button" className="c4-chip" data-on={stillOnly ? "1" : "0"} onClick={() => setStillOnly((value) => !value)}>{v4("plrStill")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "airy" ? "tight" : "airy")}>{density === "airy" ? v4("plrAiry") : v4("plrTight")}</button>
        <button type="button" className="c4-chip" data-on={sheet === "index" ? "1" : "0"} onClick={() => setSheet(sheet === "rose" ? "index" : "rose")}>{sheet === "rose" ? v4("plrRose") : v4("plrIndex")}</button>
      </div>
      <div className="c4-pelorus-tools">
        <input ref={searchRef} className="c4-field c4-pelorus-search" aria-label={v4("plrSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("plrSearch")} />
        <select className="c4-select" aria-label={v4("plrStation")} value={stationFilter} onChange={(event) => setStationFilter(event.target.value)}>
          <option value="all">{v4("plrAll")}</option>
          {PELORUS_STATIONS.map((item) => <option key={item} value={item}>{stationLabel(v4, item)}</option>)}
          <option value="keen">{v4("plrKeen")}</option>
          <option value="still">{v4("plrStill")}</option>
        </select>
        <select className="c4-select" aria-label={v4("plrFinish")} value={finishFilter} onChange={(event) => setFinishFilter(event.target.value)}>
          <option value="all">{v4("plrAll")}</option>
          {METALS.map((item) => <option key={item} value={item}>{finishLabel(v4, item.toUpperCase())}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("plrVane")} value={vaneFilter} onChange={(event) => setVaneFilter(event.target.value)}>
          <option value="all">{v4("plrAll")}</option>
          {VANES.map((item) => <option key={item} value={item}>{vaneLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("plrAngle")} value={angleFilter} onChange={(event) => setAngleFilter(event.target.value)}>
          <option value="all">{v4("plrAll")}</option>
          {ANGLES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("plrRing")} value={ringFilter} onChange={(event) => setRingFilter(event.target.value)}>
          <option value="all">{v4("plrAll")}</option>
          {RINGS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("plrFair")} value={helmsmanFilter} onChange={(event) => setHelmsmanFilter(event.target.value)}>
          <option value="all">{v4("plrAll")}</option>
          {helmsmen.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("plrStation")} value={desk} onChange={(event) => setDesk(event.target.value)}>
          {PELORUS_STATIONS.map((item) => <option key={item} value={item}>{stationLabel(v4, item)}</option>)}
        </select>
      </div>
      <form className="c4-pelorus-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addBearing(cards, { id: `plr-${Date.now()}`, title, note, helmsman, station, finish, vane, angle: angleNo, ring: ringNo, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <label className="c4-lab"><span>{v4("plrAdd")}</span><input className="c4-field" aria-label={v4("plrAdd")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("plrNote")}</span><input className="c4-field" aria-label={v4("plrNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("plrFair")}</span><input className="c4-field" aria-label={v4("plrFair")} aria-required={false} value={helmsman} disabled={viewer} onChange={(event) => setHelmsman(event.target.value)} /></label>
        <select className="c4-select" aria-label={v4("plrStation")} value={station} disabled={viewer} onChange={(event) => setStation(event.target.value)}>
          <option value="">{v4("plrBlankStation")}</option>
          {PELORUS_STATIONS.map((item) => <option key={item} value={item}>{stationLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("plrFinish")} value={finish} disabled={viewer} onChange={(event) => setFinish(event.target.value)}>
          <option value="">{v4("plrBlankFinish")}</option>
          {METALS.map((item) => <option key={item} value={item}>{finishLabel(v4, item.toUpperCase())}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("plrVane")} value={vane} disabled={viewer} onChange={(event) => setVane(event.target.value)}>
          <option value="">{v4("plrBlankVane")}</option>
          {VANES.map((item) => <option key={item} value={item}>{vaneLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("plrAngle")} value={angleNo} disabled={viewer} onChange={(event) => setAngleNo(event.target.value)}>
          <option value="">{v4("plrBlankAngle")}</option>
          {ANGLES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("plrRing")} value={ringNo} disabled={viewer} onChange={(event) => setRingNo(event.target.value)}>
          {RINGS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <label className="c4-lab"><span>{v4("plrTags")}</span><input className="c4-field" aria-label={v4("plrTags")} aria-required={false} value={tags} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("plrAdd")}</button>
      </form>
      <form className="c4-pelorus-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addBearingView(views, { id: `view-${Date.now()}`, name: viewName, tray, query, helmsman: helmsmanFilter, finish: finishFilter, vane: vaneFilter, station: stationFilter, angle: angleFilter, ring: ringFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("plrViewName")}</span><input className="c4-field" aria-label={v4("plrViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("plrSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-pelorus-view">
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("plrApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropBearingView(views, view.id))}>{v4("plrDropView")}</button>
          </span>
        ))}
      </form>
      {picked.length > 0 && (
        <div className="c4-pelorus-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBearingSight(cards, picked))}>{v4("plrBulkSight")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBearingStow(cards, picked))}>{v4("plrBulkStow")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBearingMirrored(cards, picked))}>{v4("plrBulkMirror")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBearingChampagne(cards, picked))}>{v4("plrBulkSilk")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBearingTag(cards, picked, "b"))}>{v4("plrBulkTag")}</button>
        </div>
      )}
      <p className="c4-pelorus-meta">{v4("plrSuggest")} {finishLabel(v4, suggested)} · {v4("plrFair")} {fair} · {v4("plrBusy")} {busy || v4("plrBlankKeeper")} · {v4("plrNeighbors")} {neighborBearingCount(cards)} · {v4("plrClash")} {clashStationCount(cards)} · {v4("plrAngleHint")} {angleHint} · {v4("plrStationHint")} {stationLabel(v4, stationHint)}</p>
      {(reminders.length > 0 || idling.length > 0) && (
        <p className="c4-pelorus-meta">{v4("plrDue")} {reminders.map((card) => card.title).join(" · ")} · {v4("plrIdle")} {idling.map((card) => card.title).join(" · ")}</p>
      )}
      {!shown.length && <p className="c4-pelorus-empty">{v4("plrEmpty")}</p>}
      <ol className={sheet === "index" ? "c4-pelorus-index" : "c4-pelorus-board"} data-density={density}>
        {shown.map((card, index) => {
          const sweep = card.angle === null ? 8 : Math.round((card.angle / 90) * 100);
          return (
            <li key={card.id} className="c4-pelorus-card" data-on={index === focusAt ? "1" : "0"} data-sighted={card.sighted ? "1" : "0"} data-overdue={overdueBearing(card) ? "1" : "0"} data-keen={keenStation(card.station) ? "1" : "0"} data-still={stillStation(card.station) ? "1" : "0"} data-house={houseMetal(card.finish) ? "1" : "0"} data-brisk={briskBearing(card) ? "1" : "0"} data-idle={idleBearing(card) ? "1" : "0"} data-resting={restingBearing(card) ? "1" : "0"} data-late={lateBearing(card, desk) ? "1" : "0"}>
              <div className="c4-pelorus-face" aria-hidden="true">
                <i style={{ transform: `rotate(${sweep * 1.8 - 90}deg)` }} />
                <span>{card.angle ?? "·"}</span>
              </div>
              <ol className="c4-pelorus-ticks" aria-hidden="true">
                {RINGS.map((tick) => <li key={tick} data-on={String(card.ring) === tick ? "1" : "0"} />)}
              </ol>
              <label className="c4-pelorus-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => togglePick(card.id)} /></label>
              <div>
                <input className="c4-field" aria-label={v4("plrEdit")} value={card.title} disabled={viewer} onChange={(event) => store(editBearing(cards, card.id, event.target.value))} />
                <input className="c4-field" aria-label={v4("plrEditNote")} aria-required={false} value={card.note} disabled={viewer} onChange={(event) => store(editBearingNote(cards, card.id, event.target.value))} />
                <p className="c4-pelorus-meta">{card.helmsman || v4("plrBlankKeeper")} · {stationLabel(v4, card.station)} · {finishLabel(v4, card.finish)} · {vaneLabel(v4, card.vane)} · {card.angle ?? v4("plrBlankAngle")} · {v4("plrRing")} {card.ring} · {card.tags.join(" ") || v4("plrTags")}</p>
                <p className="c4-pelorus-meta">{stationLabel(v4, desk)} · {AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : v4("plrAuditSave")}</p>
                <div className="c4-pelorus-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBearingSight(cards, card.id, !card.sighted))}>{card.sighted ? v4("plrUnsight") : v4("plrSight")}</button>
                  <button type="button" className="c4-btn" disabled={viewer || card.stowed} onClick={() => store(setBearingLock(cards, card.id, !card.locked))}>{card.locked ? v4("plrResume") : v4("plrLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBearingStow(cards, card.id, !card.stowed))}>{card.stowed ? v4("plrOpenAgain") : v4("plrStowed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBearingStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("plrUnstar") : v4("plrStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleVane(cards, card.id))}>{v4("plrVane")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftAngle(cards, card.id))}>{v4("plrLift")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(dipAngle(cards, card.id))}>{v4("plrDip")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseRing(cards, card.id))}>{v4("plrRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerRing(cards, card.id))}>{v4("plrLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBearingFinish(cards, card.id, card.finish === "CHAMPAGNE" ? "ivory" : "champagne"))}>{v4("plrFinish")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addBearingTag(cards, card.id, "a"))}>{v4("plrTags")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(bearingCopy(card)); setCopied(card.id); }}>{copied === card.id ? v4("plrCopied") : v4("plrCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <button type="button" className="c4-btn" onClick={() => { setSort(sort === "station" ? "helmsman" : "station"); }}>{sort === "station" ? v4("plrSortHelmsman") : v4("plrSortStation")}</button>
      <button type="button" className="c4-btn" onClick={() => download("pelorus-bearings.csv", bearingCsv(shown, desk))}>{v4("plrCsv")}</button>
    </section>
  );
}

export function SoundingPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: NameRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [shape, setShape] = useState<SoundingShape>("all");
  const [review, setReview] = useState<SoundingReview>("all");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<SoundingRow[]>(() => (queue.data?.users || []).map((row, index) => ({
    id: row.id ? `name-${row.id}` : `name-${index}`,
    label: textField(row.name),
    note: { affiliateB: textField(row.affiliateB) } satisfies SoundingValue,
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
    const present = presentSoundingLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenSoundings(readJson(SND_KEY, []), present);
    const nextReviewed = readReviewedSoundings(readJson(SND_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(SND_KEY, nextHidden);
    writeJson(SND_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentSoundingLanes(rows);
  const lanes = visibleSoundingLanes(present, hidden, showHidden);
  const shown = visibleSoundings(rows, lane, hue, query, review, reviewed, shape).filter((row) => {
    const token = soundingLane(row.note);
    if (!token) return true;
    return showHidden || !hidden.includes(token);
  });
  const focusAt = shown.length ? focus % shown.length : 0;
  const bars = soundingLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingSounding(rows);
  const leadHue = leadingSoundingHue(rows);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => movePelorusFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => movePelorusFocus(index, shown.length, -1));
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
    writeJson(SND_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(SND_REVIEW_KEY, next);
  }
  return (
    <section className="c4-sounding" aria-label={v4("sndTitle")} data-plates="1" data-names={rows.length} data-role={role}>
      <header className="c4-sounding-mast">
        <p className="c4-sounding-seal" data-logo="mono">{v4("sndLogo")}</p>
        <div>
          <p className="c4-sounding-kicker">{v4("sndSub")}</p>
          <h2 className="c4-title">{v4("sndTitle")}</h2>
        </div>
      </header>
      <ol className="c4-sounding-index" aria-label={v4("sndTitle")}>
        <li data-tone="gold">{v4("sndFathom")}</li>
        <li data-tone="ink">{v4("sndHarbor")}</li>
        <li data-tone="ivory">{v4("sndRoad")}</li>
        <li data-tone="mist">{v4("sndCove")}</li>
        <li data-tone="line">{v4("sndChannel")}</li>
      </ol>
      <p className="c4-sounding-links">
        <Link href={crmv4Href(base, "plr")}>{v4("sndPelorus")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("plrCustomers")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("plrDossier")}</Link>
      </p>
      <p className="c4-sounding-hint">{v4("sndHint")}</p>
      {viewer && <p className="c4-sounding-note">{v4("sndViewer")}</p>}
      {queue.loading && <p className="c4-sounding-meta">{v4("sndEmpty")}</p>}
      {queue.error && <p className="c4-sounding-meta">{queue.error}</p>}
      <ul className="c4-sounding-kpis" aria-label={v4("sndRules")}>
        <li><span>{v4("sndLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("sndUnmarked")}</strong></li>
        <li><span>{v4("sndToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("sndUnmarked")}</strong></li>
        <li><span>{v4("sndShared")}</span><strong>{sharedSoundingCount(rows)}</strong></li>
        <li><span>{v4("sndShare")}</span><strong>{soundingShare(laneSoundingCount(rows, "fathom"), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("sndKnown")}</span><strong>{rows.filter((row) => soundingKnown(row.note)).length}</strong></li>
        <li><span>{v4("sndTwin")}</span><strong>{rows.filter((row) => soundingTwin(row.note)).length}</strong></li>
        <li><span>{v4("sndSlash")}</span><strong>{rows.filter((row) => soundingSlash(row.note)).length}</strong></li>
        <li><span>{v4("sndEcho")}</span><strong>{rows.filter((row) => soundingEcho(row.note)).length}</strong></li>
      </ul>
      <div className="c4-sounding-chart" aria-label={v4("sndRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-sounding-column" data-on={lane === bar.lane ? "1" : "0"} data-lane={bar.lane} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ height: `${Math.max(12, Math.round((bar.count / maxBar) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{laneLabel(v4, bar.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-sounding-tools">
        <input ref={searchRef} className="c4-field c4-sounding-search" aria-label={v4("sndSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("sndSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("sndAll") : hueLabel(v4, item)}</button>
        ))}
        {(["all", "harbor", "road", "cove", "fathom", "channel", "estuary", "wide", "notch", "leap", "slash", "twin", "known", "echo"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>
            {item === "all" ? v4("sndShapeAll") : item === "wide" ? v4("sndShapeWide") : item === "notch" ? v4("sndShapeNotch") : item === "leap" ? v4("sndShapeLeap") : item === "slash" ? v4("sndShapeSlash") : item === "twin" ? v4("sndShapeTwin") : item === "known" ? v4("sndShapeKnown") : item === "echo" ? v4("sndShapeEcho") : laneLabel(v4, item)}
          </button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("sndAll") : item === "reviewed" ? v4("sndReviewed") : v4("sndUnreviewed")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("sndShow")}</button>
      </div>
      <ul className="c4-sounding-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleSounding(hidden, item))}>{hidden.includes(item) ? v4("sndShow") : v4("sndHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-sounding-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkSoundingReview(reviewed, picked, true))}>{v4("sndBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkSoundingReview(reviewed, picked, false))}>{v4("sndBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-sounding-empty">{v4("sndEmpty")}</p>}
      <ol className="c4-sounding-board">
        {shown.map((row, index) => {
          const seen = reviewed.includes(row.id);
          return (
            <li key={row.id} className="c4-sounding-card" data-on={index === focusAt ? "1" : "0"} data-lane={soundingLane(row.note)} data-hue={soundingHue(row.note)} data-reviewed={seen ? "1" : "0"} data-known={soundingKnown(row.note) ? "1" : "0"}>
              <p className="c4-sounding-stamp">{soundingStamp(row.note) || "·"}</p>
              <label className="c4-sounding-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label || row.id} onChange={() => setPicked((current) => (current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id]))} /></label>
              <div>
                <strong>{row.label || v4("sndUnmarked")}</strong>
                <p className="c4-sounding-meta">{laneLabel(v4, soundingLane(row.note))} · {hueLabel(v4, soundingHue(row.note))} · {v4("sndStep")} {soundingStep(row.note)}{soundingCap(row.note) ? ` · ${v4("sndCap")}` : ""}{soundingTail(row.note) ? ` · ${v4("sndTail")}` : ""}{soundingWide(row.note) ? ` · ${v4("sndWide")}` : ""}{soundingNotch(row.note) ? ` · ${v4("sndNotch")}` : ""}{soundingLeap(row.note) ? ` · ${v4("sndLeap")}` : ""}</p>
                <div className="c4-sounding-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleSoundingReview(reviewed, row.id))}>{seen ? v4("sndReviewed") : v4("sndReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(soundingCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("sndCopied") : v4("sndCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="c4-sounding-tools">
        <button type="button" className="c4-btn" onClick={() => download("sounding-lanes.csv", soundingLanesCsv(rows))}>{v4("sndCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("sounding-rows.csv", soundingRowsCsv(shown, reviewed))}>{v4("sndRowCsv")}</button>
      </div>
    </section>
  );
}
