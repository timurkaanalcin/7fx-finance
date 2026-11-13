"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  STAFF_REACHES,
  CRS_DENSITY_KEY,
  CRS_KEY,
  CRS_VIEW_KEY,
  SVR_KEY,
  SVR_REVIEW_KEY,
  addSight,
  addSightTag,
  addSightView,
  sightBars,
  sightCopy,
  sightCounts,
  sightCsv,
  sightDensity,
  sightKeepers,
  sightTimeline,
  briskSight,
  bulkSightChampagne,
  bulkSightGilt,
  bulkSightMark,
  bulkSightStow,
  bulkSightTag,
  bulkServerReview,
  busiestKeeper,
  clashReachCount,
  cycleShade,
  dipHeight,
  dipHeightFocused,
  dropSightView,
  editSight,
  editSightNote,
  fairKeeper,
  houseFinish,
  idleSight,
  idleSights,
  keenReach,
  laneServerCount,
  lateSight,
  leadingServer,
  leadingServerHue,
  liftHeight,
  liftHeightFocused,
  lockSightFocused,
  lowerBead,
  lowerBeadFocused,
  moveSightFocus,
  neighborSightCount,
  overdueSight,
  presentServerLanes,
  raiseBead,
  raiseBeadFocused,
  readSightViews,
  readSights,
  readHiddenServers,
  readReviewedServers,
  reminderSights,
  restingSight,
  setSightFinish,
  setSightLock,
  setSightMarked,
  setSightStar,
  setSightStow,
  sharedServerCount,
  markSightFocused,
  sortSights,
  serverCap,
  serverCopy,
  serverEcho,
  serverHue,
  serverKnown,
  serverLane,
  serverLanes,
  serverLanesCsv,
  serverLeap,
  serverNotch,
  serverRowsCsv,
  serverShare,
  serverSlash,
  serverStamp,
  serverStep,
  serverTail,
  serverTwin,
  serverWide,
  starSightFocused,
  stillReach,
  suggestHeight,
  suggestFinish,
  suggestReach,
  tagSightFocused,
  toggleServer,
  toggleServerReview,
  toneFocused,
  visibleSights,
  visibleServerLanes,
  visibleServers,
  type StaffDensity,
  type StaffSort,
  type StaffTray,
  type StaffView,
  type StaffSight,
  type ServerReview,
  type ServerRow,
  type ServerShape,
  type ServerValue,
} from "@/lib/crmv4/round278";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const METALS = ["ivory", "graphite", "champagne"] as const;
const VANES = ["mist", "ink", "gilt"] as const;
const ANGLES = ["12", "24", "48"] as const;
const RINGS = ["1", "3", "9"] as const;

const STATION_KEY: Record<string, CrmV4CopyKey> = {
  near: "crsNear",
  beam: "crsBeam",
  quarter: "crsQuarter",
  stern: "crsStern",
  keen: "crsKeen",
  still: "crsStill",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "crsAuditSave",
  edit: "crsAuditEdit",
  note: "crsAuditNote",
  vane: "crsAuditVane",
  sight: "crsAuditSight",
  unsight: "crsAuditUnsight",
  lock: "crsAuditLock",
  resume: "crsAuditResume",
  stow: "crsAuditStow",
  open: "crsAuditOpen",
  finish: "crsAuditFinish",
  tag: "crsAuditTag",
  ring: "crsAuditRing",
  angle: "crsAuditAngle",
  dip: "crsAuditDip",
  star: "crsAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  beacon: "svrBeacon",
  lantern: "svrLantern",
  house: "svrHouse",
  buoy: "svrBuoy",
  channel: "svrChannel",
  road: "svrRoad",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "svrIvory",
  graphite: "svrGraphite",
  champagne: "svrChampagne",
};

type NameRow = {
  id?: string;
  name?: string | null;
  tradingServer?: string | null;
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
  return key ? v4(key) : v4("crsBlank");
}

function finishLabel(v4: V4, finish: string): string {
  if (finish === "IVORY") return v4("crsIvory");
  if (finish === "GRAPHITE") return v4("crsGraphite");
  if (finish === "CHAMPAGNE") return v4("crsChampagne");
  return v4("crsBlankFinish");
}

function vaneLabel(v4: V4, vane: string): string {
  if (vane === "mist") return v4("crsMist");
  if (vane === "ink") return v4("crsInk");
  if (vane === "gilt") return v4("crsGilt");
  return v4("crsBlankVane");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("svrUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("svrUnmarked");
}

export function CrossStaff({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<StaffSight[]>([]);
  const [views, setViews] = useState<StaffView[]>([]);
  const [density, setDensity] = useState<StaffDensity>("open");
  const [sheet, setSheet] = useState<"rose" | "index">("rose");
  const [tray, setTray] = useState<StaffTray>("rail");
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
  const [sort, setSort] = useState<StaffSort>("band");
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
  const [desk, setDesk] = useState("near");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readSights(readJson(CRS_KEY, [])));
    setViews(readSightViews(readJson(CRS_VIEW_KEY, [])));
    setDensity(sightDensity(readJson(CRS_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: StaffSight[]) {
    setCards(next);
    writeJson(CRS_KEY, next);
  }
  function storeViews(next: StaffView[]) {
    setViews(next);
    writeJson(CRS_VIEW_KEY, next);
  }
  function storeDensity(next: StaffDensity) {
    setDensity(next);
    writeJson(CRS_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortSights(visibleSights(cards, tray, query, helmsmanFilter, finishFilter, vaneFilter, stationFilter, angleFilter, ringFilter, houseOnly, keenOnly, stillOnly), sort),
    [cards, tray, query, helmsmanFilter, finishFilter, vaneFilter, stationFilter, angleFilter, ringFilter, houseOnly, keenOnly, stillOnly, sort],
  );
  const counts = sightCounts(cards, shown, desk);
  const bars = sightBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = sightTimeline(cards);
  const helmsmen = sightKeepers(cards);
  const ids = shown.map((card) => card.id);
  const suggested = suggestFinish(cards);
  const fair = fairKeeper(cards, helmsmen.join(","));
  const busy = busiestKeeper(cards);
  const reminders = reminderSights(cards);
  const idling = idleSights(cards);
  const angleHint = suggestHeight(cards, clock);
  const stationHint = suggestReach(clock);

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
        setFocusAt((index) => moveSightFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveSightFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        if (!viewer) store(markSightFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        if (!viewer) store(lockSightFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        if (!viewer) store(toneFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        if (!viewer) store(liftHeightFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        if (!viewer) store(dipHeightFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        if (!viewer) store(tagSightFocused(cards, ids, focusAt, "c"));
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        if (!viewer) store(starSightFocused(cards, ids, focusAt));
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

  function applyView(view: StaffView) {
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
    <section className="c4-crossstaff" aria-label={v4("crsTitle")} data-cards="1" data-desk="crossstaff" data-role={role} data-density={density} data-sheet={sheet}>
      <header className="c4-crossstaff-mast">
        <p className="c4-crossstaff-rose" data-logo="mono" aria-hidden="true">
          <span>{v4("crsLogo")}</span>
          <i />
          <b />
        </p>
        <div className="c4-crossstaff-mast-copy">
          <p className="c4-crossstaff-kicker">{v4("crsSub")}</p>
          <h2 className="c4-title">{v4("crsTitle")}</h2>
        </div>
        <ol className="c4-crossstaff-vanes" aria-hidden="true">
          <li>{v4("crsMist")}</li>
          <li>{v4("crsInk")}</li>
          <li>{v4("crsGilt")}</li>
        </ol>
      </header>
      <p className="c4-crossstaff-links">
        <Link href={crmv4Href(base, "svr")}>{v4("svrTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("crsCustomers")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("crsDossier")}</Link>
      </p>
      {viewer && <p className="c4-crossstaff-note">{v4("crsViewer")}</p>}
      <p className="c4-crossstaff-lead">{v4("crsKeys")}</p>
      <p className="c4-crossstaff-hint">{v4("crsHint")}</p>
      <p className="c4-crossstaff-notice" role="status">{v4("crsNotice")} {counts.overdue}</p>
      <ol className="c4-crossstaff-dials" aria-label={v4("crsChart")}>
        <li><span>{v4("crsRail")}</span><strong>{counts.rail}</strong></li>
        <li><span>{v4("crsChest")}</span><strong>{counts.chest}</strong></li>
        <li><span>{v4("crsHold")}</span><strong>{counts.hold}</strong></li>
        <li><span>{v4("crsSighted")}</span><strong>{counts.sighted}</strong></li>
        <li><span>{v4("crsKeen")}</span><strong>{counts.keen}</strong></li>
        <li><span>{v4("crsStill")}</span><strong>{counts.still}</strong></li>
        <li><span>{v4("crsOverdue")}</span><strong>{counts.overdue}</strong></li>
        <li><span>{v4("crsHouse")}</span><strong>{counts.house}</strong></li>
      </ol>
      <div className="c4-crossstaff-chart" aria-label={v4("crsBars")}>
        {bars.map((bar) => (
          <div key={bar.station} className="c4-crossstaff-column" data-reach={bar.station}>
            <i style={{ height: `${Math.max(8, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{stationLabel(v4, bar.station)}</span>
          </div>
        ))}
      </div>
      <ol className="c4-crossstaff-timeline" aria-label={v4("crsRing")}>
        {timeline.map((lane) => (
          <li key={lane.ring}><span>{lane.ring}</span><strong>{lane.titles.join(" · ")}</strong></li>
        ))}
      </ol>
      <div className="c4-crossstaff-tools">
        {(["rail", "chest", "hold"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "rail" ? v4("crsRail") : item === "chest" ? v4("crsChest") : v4("crsHold")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("crsHouse")}</button>
        <button type="button" className="c4-chip" data-on={keenOnly ? "1" : "0"} onClick={() => setKeenOnly((value) => !value)}>{v4("crsKeen")}</button>
        <button type="button" className="c4-chip" data-on={stillOnly ? "1" : "0"} onClick={() => setStillOnly((value) => !value)}>{v4("crsStill")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "open" ? "close" : "open")}>{density === "open" ? v4("crsAiry") : v4("crsTight")}</button>
        <button type="button" className="c4-chip" data-on={sheet === "index" ? "1" : "0"} onClick={() => setSheet(sheet === "rose" ? "index" : "rose")}>{sheet === "rose" ? v4("crsRose") : v4("crsIndex")}</button>
      </div>
      <div className="c4-crossstaff-tools">
        <input ref={searchRef} className="c4-field c4-crossstaff-search" aria-label={v4("crsSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("crsSearch")} />
        <select className="c4-select" aria-label={v4("crsStation")} value={stationFilter} onChange={(event) => setStationFilter(event.target.value)}>
          <option value="all">{v4("crsAll")}</option>
          {STAFF_REACHES.map((item) => <option key={item} value={item}>{stationLabel(v4, item)}</option>)}
          <option value="keen">{v4("crsKeen")}</option>
          <option value="still">{v4("crsStill")}</option>
        </select>
        <select className="c4-select" aria-label={v4("crsFinish")} value={finishFilter} onChange={(event) => setFinishFilter(event.target.value)}>
          <option value="all">{v4("crsAll")}</option>
          {METALS.map((item) => <option key={item} value={item}>{finishLabel(v4, item.toUpperCase())}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("crsVane")} value={vaneFilter} onChange={(event) => setVaneFilter(event.target.value)}>
          <option value="all">{v4("crsAll")}</option>
          {VANES.map((item) => <option key={item} value={item}>{vaneLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("crsAngle")} value={angleFilter} onChange={(event) => setAngleFilter(event.target.value)}>
          <option value="all">{v4("crsAll")}</option>
          {ANGLES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("crsRing")} value={ringFilter} onChange={(event) => setRingFilter(event.target.value)}>
          <option value="all">{v4("crsAll")}</option>
          {RINGS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("crsFair")} value={helmsmanFilter} onChange={(event) => setHelmsmanFilter(event.target.value)}>
          <option value="all">{v4("crsAll")}</option>
          {helmsmen.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("crsStation")} value={desk} onChange={(event) => setDesk(event.target.value)}>
          {STAFF_REACHES.map((item) => <option key={item} value={item}>{stationLabel(v4, item)}</option>)}
        </select>
      </div>
      <form className="c4-crossstaff-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addSight(cards, { id: `crs-${Date.now()}`, title, note, helmsman, station, finish, vane, angle: angleNo, ring: ringNo, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <label className="c4-lab"><span>{v4("crsAdd")}</span><input className="c4-field" aria-label={v4("crsAdd")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("crsNote")}</span><input className="c4-field" aria-label={v4("crsNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("crsFair")}</span><input className="c4-field" aria-label={v4("crsFair")} aria-required={false} value={helmsman} disabled={viewer} onChange={(event) => setHelmsman(event.target.value)} /></label>
        <select className="c4-select" aria-label={v4("crsStation")} value={station} disabled={viewer} onChange={(event) => setStation(event.target.value)}>
          <option value="">{v4("crsBlankStation")}</option>
          {STAFF_REACHES.map((item) => <option key={item} value={item}>{stationLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("crsFinish")} value={finish} disabled={viewer} onChange={(event) => setFinish(event.target.value)}>
          <option value="">{v4("crsBlankFinish")}</option>
          {METALS.map((item) => <option key={item} value={item}>{finishLabel(v4, item.toUpperCase())}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("crsVane")} value={vane} disabled={viewer} onChange={(event) => setVane(event.target.value)}>
          <option value="">{v4("crsBlankVane")}</option>
          {VANES.map((item) => <option key={item} value={item}>{vaneLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("crsAngle")} value={angleNo} disabled={viewer} onChange={(event) => setAngleNo(event.target.value)}>
          <option value="">{v4("crsBlankAngle")}</option>
          {ANGLES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("crsRing")} value={ringNo} disabled={viewer} onChange={(event) => setRingNo(event.target.value)}>
          {RINGS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <label className="c4-lab"><span>{v4("crsTags")}</span><input className="c4-field" aria-label={v4("crsTags")} aria-required={false} value={tags} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("crsAdd")}</button>
      </form>
      <form className="c4-crossstaff-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addSightView(views, { id: `view-${Date.now()}`, name: viewName, tray, query, helmsman: helmsmanFilter, finish: finishFilter, vane: vaneFilter, station: stationFilter, angle: angleFilter, ring: ringFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("crsViewName")}</span><input className="c4-field" aria-label={v4("crsViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("crsSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-crossstaff-view">
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("crsApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropSightView(views, view.id))}>{v4("crsDropView")}</button>
          </span>
        ))}
      </form>
      {picked.length > 0 && (
        <div className="c4-crossstaff-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSightMark(cards, picked))}>{v4("crsBulkSight")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSightStow(cards, picked))}>{v4("crsBulkStow")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSightGilt(cards, picked))}>{v4("crsBulkMirror")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSightChampagne(cards, picked))}>{v4("crsBulkSilk")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkSightTag(cards, picked, "d"))}>{v4("crsBulkTag")}</button>
        </div>
      )}
      <p className="c4-crossstaff-meta">{v4("crsSuggest")} {finishLabel(v4, suggested)} · {v4("crsFair")} {fair} · {v4("crsBusy")} {busy || v4("crsBlankKeeper")} · {v4("crsNeighbors")} {neighborSightCount(cards)} · {v4("crsClash")} {clashReachCount(cards)} · {v4("crsAngleHint")} {angleHint} · {v4("crsStationHint")} {stationLabel(v4, stationHint)}</p>
      {(reminders.length > 0 || idling.length > 0) && (
        <p className="c4-crossstaff-meta">{v4("crsDue")} {reminders.map((card) => card.title).join(" · ")} · {v4("crsIdle")} {idling.map((card) => card.title).join(" · ")}</p>
      )}
      {!shown.length && <p className="c4-crossstaff-empty">{v4("crsEmpty")}</p>}
      <ol className={sheet === "index" ? "c4-crossstaff-index" : "c4-crossstaff-board"} data-density={density}>
        {shown.map((card, index) => {
          const sweep = card.angle === null ? 8 : Math.round((card.angle / 48) * 100);
          return (
            <li key={card.id} className="c4-crossstaff-card" data-on={index === focusAt ? "1" : "0"} data-sighted={card.sighted ? "1" : "0"} data-overdue={overdueSight(card) ? "1" : "0"} data-keen={keenReach(card.station) ? "1" : "0"} data-still={stillReach(card.station) ? "1" : "0"} data-house={houseFinish(card.finish) ? "1" : "0"} data-brisk={briskSight(card) ? "1" : "0"} data-idle={idleSight(card) ? "1" : "0"} data-resting={restingSight(card) ? "1" : "0"} data-late={lateSight(card, desk) ? "1" : "0"}>
              <div className="c4-crossstaff-face" aria-hidden="true">
                <i style={{ transform: `rotate(${sweep * 1.8 - 90}deg)` }} />
                <span>{card.angle ?? "·"}</span>
              </div>
              <ol className="c4-crossstaff-ticks" aria-hidden="true">
                {RINGS.map((tick) => <li key={tick} data-on={String(card.ring) === tick ? "1" : "0"} />)}
              </ol>
              <label className="c4-crossstaff-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => togglePick(card.id)} /></label>
              <div>
                <input className="c4-field" aria-label={v4("crsEdit")} value={card.title} disabled={viewer} onChange={(event) => store(editSight(cards, card.id, event.target.value))} />
                <input className="c4-field" aria-label={v4("crsEditNote")} aria-required={false} value={card.note} disabled={viewer} onChange={(event) => store(editSightNote(cards, card.id, event.target.value))} />
                <p className="c4-crossstaff-meta">{card.helmsman || v4("crsBlankKeeper")} · {stationLabel(v4, card.station)} · {finishLabel(v4, card.finish)} · {vaneLabel(v4, card.vane)} · {card.angle ?? v4("crsBlankAngle")} · {v4("crsRing")} {card.ring} · {card.tags.join(" ") || v4("crsTags")}</p>
                <p className="c4-crossstaff-meta">{stationLabel(v4, desk)} · {AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : v4("crsAuditSave")}</p>
                <div className="c4-crossstaff-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSightMarked(cards, card.id, !card.sighted))}>{card.sighted ? v4("crsUnsight") : v4("crsSight")}</button>
                  <button type="button" className="c4-btn" disabled={viewer || card.stowed} onClick={() => store(setSightLock(cards, card.id, !card.locked))}>{card.locked ? v4("crsResume") : v4("crsLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSightStow(cards, card.id, !card.stowed))}>{card.stowed ? v4("crsOpenAgain") : v4("crsStowed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSightStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("crsUnstar") : v4("crsStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleShade(cards, card.id))}>{v4("crsVane")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftHeight(cards, card.id))}>{v4("crsLift")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(dipHeight(cards, card.id))}>{v4("crsDip")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseBead(cards, card.id))}>{v4("crsRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerBead(cards, card.id))}>{v4("crsLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSightFinish(cards, card.id, card.finish === "CHAMPAGNE" ? "ivory" : "champagne"))}>{v4("crsFinish")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addSightTag(cards, card.id, "c"))}>{v4("crsTags")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(sightCopy(card)); setCopied(card.id); }}>{copied === card.id ? v4("crsCopied") : v4("crsCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <button type="button" className="c4-btn" onClick={() => { setSort(sort === "band" ? "keeper" : "band"); }}>{sort === "band" ? v4("crsSortHelmsman") : v4("crsSortStation")}</button>
      <button type="button" className="c4-btn" onClick={() => download("cross-staff.csv", sightCsv(shown, desk))}>{v4("crsCsv")}</button>
    </section>
  );
}

export function ServerPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: NameRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [shape, setShape] = useState<ServerShape>("all");
  const [review, setReview] = useState<ServerReview>("all");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<ServerRow[]>(() => (queue.data?.users || []).map((row, index) => ({
    id: row.id ? `name-${row.id}` : `name-${index}`,
    label: textField(row.name),
    note: { tradingServer: textField(row.tradingServer) } satisfies ServerValue,
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
    const present = presentServerLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenServers(readJson(SVR_KEY, []), present);
    const nextReviewed = readReviewedServers(readJson(SVR_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(SVR_KEY, nextHidden);
    writeJson(SVR_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentServerLanes(rows);
  const lanes = visibleServerLanes(present, hidden, showHidden);
  const shown = visibleServers(rows, lane, hue, query, review, reviewed, shape).filter((row) => {
    const token = serverLane(row.note);
    if (!token) return true;
    return showHidden || !hidden.includes(token);
  });
  const focusAt = shown.length ? focus % shown.length : 0;
  const bars = serverLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingServer(rows);
  const leadHue = leadingServerHue(rows);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveSightFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveSightFocus(index, shown.length, -1));
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
    writeJson(SVR_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(SVR_REVIEW_KEY, next);
  }
  return (
    <section className="c4-serverplate" aria-label={v4("svrTitle")} data-plates="1" data-names={rows.length} data-role={role}>
      <header className="c4-serverplate-mast">
        <p className="c4-serverplate-seal" data-logo="mono">{v4("svrLogo")}</p>
        <div>
          <p className="c4-serverplate-kicker">{v4("svrSub")}</p>
          <h2 className="c4-title">{v4("svrTitle")}</h2>
        </div>
      </header>
      <ol className="c4-serverplate-index" aria-label={v4("svrTitle")}>
        <li data-tone="gold">{v4("svrBuoy")}</li>
        <li data-tone="ink">{v4("svrBeacon")}</li>
        <li data-tone="ivory">{v4("svrLantern")}</li>
        <li data-tone="mist">{v4("svrHouse")}</li>
        <li data-tone="line">{v4("svrRoad")}</li>
      </ol>
      <p className="c4-serverplate-links">
        <Link href={crmv4Href(base, "crs")}>{v4("crsTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("crsCustomers")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("crsDossier")}</Link>
      </p>
      <p className="c4-serverplate-hint">{v4("svrHint")}</p>
      {viewer && <p className="c4-serverplate-note">{v4("svrViewer")}</p>}
      {queue.loading && <p className="c4-serverplate-meta">{v4("svrEmpty")}</p>}
      {queue.error && <p className="c4-serverplate-meta">{queue.error}</p>}
      <ul className="c4-serverplate-kpis" aria-label={v4("svrRules")}>
        <li><span>{v4("svrLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("svrUnmarked")}</strong></li>
        <li><span>{v4("svrToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("svrUnmarked")}</strong></li>
        <li><span>{v4("svrShared")}</span><strong>{sharedServerCount(rows)}</strong></li>
        <li><span>{v4("svrShare")}</span><strong>{serverShare(laneServerCount(rows, "buoy"), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("svrKnown")}</span><strong>{rows.filter((row) => serverKnown(row.note)).length}</strong></li>
        <li><span>{v4("svrTwin")}</span><strong>{rows.filter((row) => serverTwin(row.note)).length}</strong></li>
        <li><span>{v4("svrSlash")}</span><strong>{rows.filter((row) => serverSlash(row.note)).length}</strong></li>
        <li><span>{v4("svrEcho")}</span><strong>{rows.filter((row) => serverEcho(row.note)).length}</strong></li>
      </ul>
      <div className="c4-serverplate-chart" aria-label={v4("svrRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-serverplate-column" data-on={lane === bar.lane ? "1" : "0"} data-lane={bar.lane} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ height: `${Math.max(12, Math.round((bar.count / maxBar) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{laneLabel(v4, bar.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-serverplate-tools">
        <input ref={searchRef} className="c4-field c4-serverplate-search" aria-label={v4("svrSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("svrSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("svrAll") : hueLabel(v4, item)}</button>
        ))}
        {(["all", "beacon", "lantern", "house", "buoy", "channel", "road", "wide", "notch", "leap", "slash", "twin", "known", "echo"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>
            {item === "all" ? v4("svrShapeAll") : item === "wide" ? v4("svrShapeWide") : item === "notch" ? v4("svrShapeNotch") : item === "leap" ? v4("svrShapeLeap") : item === "slash" ? v4("svrShapeSlash") : item === "twin" ? v4("svrShapeTwin") : item === "known" ? v4("svrShapeKnown") : item === "echo" ? v4("svrShapeEcho") : laneLabel(v4, item)}
          </button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("svrAll") : item === "reviewed" ? v4("svrReviewed") : v4("svrUnreviewed")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("svrShow")}</button>
      </div>
      <ul className="c4-serverplate-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleServer(hidden, item))}>{hidden.includes(item) ? v4("svrShow") : v4("svrHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-serverplate-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkServerReview(reviewed, picked, true))}>{v4("svrBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkServerReview(reviewed, picked, false))}>{v4("svrBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-serverplate-empty">{v4("svrEmpty")}</p>}
      <ol className="c4-serverplate-board">
        {shown.map((row, index) => {
          const seen = reviewed.includes(row.id);
          return (
            <li key={row.id} className="c4-serverplate-card" data-on={index === focusAt ? "1" : "0"} data-lane={serverLane(row.note)} data-hue={serverHue(row.note)} data-reviewed={seen ? "1" : "0"} data-known={serverKnown(row.note) ? "1" : "0"}>
              <p className="c4-serverplate-stamp">{serverStamp(row.note) || "·"}</p>
              <label className="c4-serverplate-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label || row.id} onChange={() => setPicked((current) => (current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id]))} /></label>
              <div>
                <strong>{row.label || v4("svrUnmarked")}</strong>
                <p className="c4-serverplate-meta">{laneLabel(v4, serverLane(row.note))} · {hueLabel(v4, serverHue(row.note))} · {v4("svrStep")} {serverStep(row.note)}{serverCap(row.note) ? ` · ${v4("svrCap")}` : ""}{serverTail(row.note) ? ` · ${v4("svrTail")}` : ""}{serverWide(row.note) ? ` · ${v4("svrWide")}` : ""}{serverNotch(row.note) ? ` · ${v4("svrNotch")}` : ""}{serverLeap(row.note) ? ` · ${v4("svrLeap")}` : ""}</p>
                <div className="c4-serverplate-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleServerReview(reviewed, row.id))}>{seen ? v4("svrReviewed") : v4("svrReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(serverCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("svrCopied") : v4("svrCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="c4-serverplate-tools">
        <button type="button" className="c4-btn" onClick={() => download("server-lanes.csv", serverLanesCsv(rows))}>{v4("svrCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("server-rows.csv", serverRowsCsv(shown, reviewed))}>{v4("svrRowCsv")}</button>
      </div>
    </section>
  );
}
