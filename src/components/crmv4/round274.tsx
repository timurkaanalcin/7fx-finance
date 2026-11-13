"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  OCTANT_SIGHTS,
  OCT_DENSITY_KEY,
  OCT_KEY,
  OCT_VIEW_KEY,
  BNN_KEY,
  BNN_REVIEW_KEY,
  addArc,
  addArcTag,
  addArcView,
  briskArc,
  bulkArcChampagne,
  bulkArcShadeMirror,
  bulkArcLatch,
  bulkArcChest,
  bulkArcTag,
  bulkBannerReview,
  busiestKeeper,
  arcBars,
  arcCopy,
  arcCounts,
  arcCsv,
  arcDensity,
  arcKeepers,
  arcTimeline,
  clashSightCount,
  cycleMirror,
  dropArcView,
  editArc,
  editArcNote,
  fairKeeper,
  houseFinish,
  idleArc,
  idleArcs,
  laneBannerCount,
  lateArc,
  leadingBanner,
  leadingBannerHue,
  liftAltitude,
  liftAltitudeFocused,
  lowerShade,
  lowerShadeFocused,
  moveOctantFocus,
  neighborShadeCount,
  overdueArc,
  lockArcFocused,
  latchArcFocused,
  mirrorFocused,
  presentBannerLanes,
  keenSight,
  raiseShade,
  raiseShadeFocused,
  readArcs,
  readArcViews,
  readHiddenBanners,
  readReviewedBanners,
  reminderArcs,
  restingArc,
  setArcFinish,
  setArcLock,
  setArcLatch,
  setArcChest,
  setArcStar,
  sharedBannerCount,
  dipAltitude,
  dipAltitudeFocused,
  sortArcs,
  bannerCopy,
  bannerEcho,
  bannerHue,
  bannerKnown,
  bannerCap,
  bannerLane,
  bannerLanes,
  bannerLanesCsv,
  bannerLeap,
  bannerNotch,
  bannerRowsCsv,
  bannerShare,
  bannerSlash,
  bannerStamp,
  bannerStep,
  bannerTail,
  bannerTwin,
  bannerWide,
  starArcFocused,
  stillSight,
  suggestAltitude,
  suggestSight,
  suggestFinish,
  tagArcFocused,
  toggleBanner,
  toggleBannerReview,
  visibleArcs,
  visibleBannerLanes,
  visibleBanners,
  type ArcDensity,
  type OctantArc,
  type ArcSort,
  type ArcTray,
  type ArcView,
  type BannerReview,
  type BannerRow,
  type BannerShape,
  type BannerValue,
} from "@/lib/crmv4/round274";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const METALS = ["ivory", "graphite", "champagne"] as const;
const LIMBS = ["index", "horizon", "shade"] as const;
const ARCS = ["10", "30", "60"] as const;
const BEADS = ["1", "3", "5", "9"] as const;

const STATION_KEY: Record<string, CrmV4CopyKey> = {
  harbor: "octHarbor",
  headland: "octHeadland",
  reef: "octReef",
  offing: "octOffing",
  keen: "octKeenSight",
  still: "octStillSight",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "octAuditSave",
  edit: "octAuditEdit",
  note: "octAuditNote",
  mirror: "octAuditMirror",
  latch: "octAuditLatch",
  unlatch: "octAuditUnlatch",
  lock: "octAuditLock",
  resume: "octAuditResume",
  chest: "octAuditChest",
  open: "octAuditOpen",
  finish: "octAuditFinish",
  tag: "octAuditTag",
  shade: "octAuditShade",
  altitude: "octAuditAltitude",
  dip: "octAuditDip",
  star: "octAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  quay: "bnnQuay",
  loft: "bnnLoft",
  hall: "bnnHall",
  closet: "bnnCloset",
  pier: "bnnPier",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "bnnIvory",
  graphite: "bnnGraphite",
  champagne: "bnnChampagne",
};

type NameRow = {
  id?: string;
  name?: string | null;
  campaign?: string | null;
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

function stationLabel(v4: V4, sight: string): string {
  const key = STATION_KEY[sight];
  return key ? v4(key) : v4("octBlank");
}

function finishLabel(v4: V4, finish: string): string {
  if (finish === "IVORY") return v4("octIvory");
  if (finish === "GRAPHITE") return v4("octGraphite");
  if (finish === "CHAMPAGNE") return v4("octChampagne");
  return v4("octBlankFinish");
}

function limbLabel(v4: V4, mirror: string): string {
  if (mirror === "index") return v4("octIndex");
  if (mirror === "horizon") return v4("octHorizon");
  if (mirror === "shade") return v4("octShadeMirror");
  return v4("octBlankLimb");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("bnnUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("bnnUnmarked");
}

export function OctantArcs({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<OctantArc[]>([]);
  const [views, setViews] = useState<ArcView[]>([]);
  const [tray, setTray] = useState<ArcTray>("deck");
  const [query, setQuery] = useState("");
  const [surveyorFilter, setSurveyorFilter] = useState("all");
  const [finishFilter, setFinishFilter] = useState("all");
  const [limbFilter, setLimbFilter] = useState("all");
  const [stationFilter, setStationFilter] = useState("all");
  const [arcFilter, setArcFilter] = useState("all");
  const [beadFilter, setBeadFilter] = useState("all");
  const [houseOnly, setHouseOnly] = useState(false);
  const [keenOnly, setKeenOnly] = useState(false);
  const [stillOnly, setStillOnly] = useState(false);
  const [sort, setSort] = useState<ArcSort>("sight");
  const [density, setDensity] = useState<ArcDensity>("airy");
  const [sheet, setSheet] = useState<"altitude" | "index">("altitude");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [keeper, setSurveyor] = useState("");
  const [sight, setStation] = useState("");
  const [finish, setFinish] = useState("");
  const [mirror, setLimb] = useState("");
  const [arcNo, setArcNo] = useState("");
  const [shade, setBead] = useState("1");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [copied, setCopied] = useState("");
  const [desk, setDesk] = useState("harbor");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readArcs(readJson(OCT_KEY, [])));
    setViews(readArcViews(readJson(OCT_VIEW_KEY, [])));
    setDensity(arcDensity(readJson(OCT_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: OctantArc[]) {
    setCards(next);
    writeJson(OCT_KEY, next);
  }
  function storeViews(next: ArcView[]) {
    setViews(next);
    writeJson(OCT_VIEW_KEY, next);
  }
  function storeDensity(next: ArcDensity) {
    setDensity(next);
    writeJson(OCT_DENSITY_KEY, next);
  }

  const shown = useMemo(() => sortArcs(visibleArcs(cards, tray, query, surveyorFilter, finishFilter, limbFilter, stationFilter, arcFilter, beadFilter, houseOnly, keenOnly, stillOnly), sort), [cards, tray, query, surveyorFilter, finishFilter, limbFilter, stationFilter, arcFilter, beadFilter, houseOnly, keenOnly, stillOnly, sort]);
  const counts = arcCounts(cards, shown, desk);
  const bars = arcBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = arcTimeline(cards);
  const surveyors = arcKeepers(cards);
  const ids = shown.map((card) => card.id);
  const suggested = suggestFinish(cards);
  const fair = fairKeeper(cards, surveyors.join(","));
  const busy = busiestKeeper(cards);
  const reminders = reminderArcs(cards);
  const idling = idleArcs(cards);
  const arcHint = suggestAltitude(cards, clock);
  const stationHint = suggestSight(clock);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setSurveyor("");
        setStation("");
        setFinish("");
        setLimb("");
        setArcNo("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveOctantFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveOctantFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        if (!viewer) store(latchArcFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        if (!viewer) store(lockArcFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        if (!viewer) store(mirrorFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        if (!viewer) store(liftAltitudeFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        if (!viewer) store(dipAltitudeFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        if (!viewer) store(tagArcFocused(cards, ids, focusAt, "q"));
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        if (!viewer) store(starArcFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        if (!viewer) store(raiseShadeFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "y" || event.key === "Y") {
        event.preventDefault();
        if (!viewer) store(lowerShadeFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "b" || event.key === "B") {
        event.preventDefault();
        setSheet((value) => value === "altitude" ? "index" : "altitude");
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
    setPicked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function applyView(view: ArcView) {
    setTray(view.tray);
    setQuery(view.query);
    setSurveyorFilter(view.keeper || "all");
    setFinishFilter(view.finish);
    setLimbFilter(view.mirror);
    setStationFilter(view.sight);
    setArcFilter(view.altitude);
    setBeadFilter(view.shade);
  }

  return (
    <section className="c4-octant" aria-label={v4("octTitle")} data-cards="1" data-desk="octant" data-role={role} data-density={density} data-sheet={sheet}>
      <header className="c4-octant-mast">
        <p className="c4-octant-seal" data-logo="mono" aria-hidden="true">
          <span>{v4("octLogo")}</span>
          <i />
        </p>
        <div className="c4-octant-mast-copy">
          <p className="c4-octant-kicker">{v4("octSub")}</p>
          <h2 className="c4-title">{v4("octTitle")}</h2>
        </div>
        <ol className="c4-octant-limbs" aria-hidden="true">
          <li>{v4("octIndex")}</li>
          <li>{v4("octHorizon")}</li>
          <li>{v4("octShadeMirror")}</li>
        </ol>
      </header>
      <p className="c4-octant-links">
        <Link href={crmv4Href(base, "bnn")}>{v4("octPlates")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("octCustomers")}</Link>
        <Link href={crmv4Href(base, "settings", { area: "desks" })}>{v4("octDesks")}</Link>
      </p>
      {viewer && <p className="c4-octant-note">{v4("octViewer")}</p>}
      <p className="c4-octant-lead">{v4("octKeys")}</p>
      <p className="c4-octant-hint">{v4("octHint")}</p>
      <p className="c4-octant-notice" role="status">{v4("octNotice")} {counts.overdue}</p>
      <ol className="c4-octant-ledger" aria-label={v4("octChart")}>
        <li><span>{v4("octDeck")}</span><strong>{counts.deck}</strong></li>
        <li><span>{v4("octLocker")}</span><strong>{counts.locker}</strong></li>
        <li><span>{v4("octChest")}</span><strong>{counts.chest}</strong></li>
        <li><span>{v4("octLatched")}</span><strong>{counts.latched}</strong></li>
        <li><span>{v4("octKeen")}</span><strong>{counts.keen}</strong></li>
        <li><span>{v4("octStill")}</span><strong>{counts.still}</strong></li>
        <li><span>{v4("octSoon")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("octOverdue")}</span><strong>{counts.overdue}</strong></li>
      </ol>
      <ol className="c4-octant-sightbar" aria-label={v4("octBars")}>
        {bars.map((bar) => (
          <li key={bar.sight} data-sight={bar.sight}>
            <strong>{bar.count}</strong>
            <i style={{ width: `${Math.max(8, Math.round((bar.count / peak) * 100))}%` }} />
            <span>{stationLabel(v4, bar.sight)}</span>
          </li>
        ))}
      </ol>
      <ol className="c4-octant-time" aria-label={v4("octTimeline")}>
        {timeline.map((lane) => (
          <li key={lane.shade}><span>{lane.shade}</span><strong>{lane.titles.join(" · ")}</strong></li>
        ))}
      </ol>
      <div className="c4-octant-tools">
        <label className="c4-lab">
          <span>{v4("octDesk")}</span>
          <select className="c4-select" aria-label={v4("octDesk")} value={desk} onChange={(event) => setDesk(event.target.value)}>
            {OCTANT_SIGHTS.map((item) => <option key={item} value={item}>{stationLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("octSearch")}</span>
          <input ref={searchRef} className="c4-field c4-octant-search" aria-label={v4("octSearch")} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("octSearch")} />
        </label>
        {(["deck", "locker", "chest"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "deck" ? v4("octDeck") : item === "locker" ? v4("octLocker") : v4("octChest")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("octHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={keenOnly ? "1" : "0"} onClick={() => setKeenOnly((value) => !value)}>{v4("octKeen")}</button>
        <button type="button" className="c4-chip" data-on={stillOnly ? "1" : "0"} onClick={() => setStillOnly((value) => !value)}>{v4("octStill")}</button>
        <button type="button" className="c4-chip" data-on={sort === "keeper" ? "1" : "0"} onClick={() => setSort((value) => value === "sight" ? "keeper" : "sight")}>{sort === "keeper" ? v4("octSortKeeper") : v4("octSortSight")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "airy" ? "tight" : "airy")}>{density === "airy" ? v4("octAiry") : v4("octTight")}</button>
        <button type="button" className="c4-chip" onClick={() => setSheet((value) => value === "altitude" ? "index" : "altitude")}>{sheet === "altitude" ? v4("octLedger") : v4("octArc")}</button>
      </div>
      <div className="c4-octant-tools">
        <select className="c4-select" aria-label={v4("octSurveyor")} value={surveyorFilter} onChange={(event) => setSurveyorFilter(event.target.value)}>
          <option value="all">{v4("octAll")}</option>
          {surveyors.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("octFinish")} value={finishFilter} onChange={(event) => setFinishFilter(event.target.value)}>
          <option value="all">{v4("octAll")}</option>
          {METALS.map((item) => <option key={item} value={item}>{finishLabel(v4, item.toUpperCase())}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("octLimb")} value={limbFilter} onChange={(event) => setLimbFilter(event.target.value)}>
          <option value="all">{v4("octAll")}</option>
          {LIMBS.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("octStation")} value={stationFilter} onChange={(event) => setStationFilter(event.target.value)}>
          <option value="all">{v4("octAll")}</option>
          <option value="keen">{v4("octKeenStation")}</option>
          <option value="still">{v4("octStillStation")}</option>
          {OCTANT_SIGHTS.map((item) => <option key={item} value={item}>{stationLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("octArc")} value={arcFilter} onChange={(event) => setArcFilter(event.target.value)}>
          <option value="all">{v4("octAll")}</option>
          {ARCS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("octBead")} value={beadFilter} onChange={(event) => setBeadFilter(event.target.value)}>
          <option value="all">{v4("octAll")}</option>
          {BEADS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      <form className="c4-octant-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addArc(cards, { id: `oct-${Date.now()}`, title, note, keeper, sight, finish, mirror, altitude: arcNo, shade, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <label className="c4-lab"><span>{v4("octTitleField")}</span><input className="c4-field" aria-label={v4("octTitleField")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("octNote")}</span><input className="c4-field" aria-label={v4("octNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <p className="c4-octant-meta">{v4("octNoteOptional")}</p>
        <label className="c4-lab"><span>{v4("octSurveyor")}</span><input className="c4-field" aria-label={v4("octSurveyor")} value={keeper} disabled={viewer} onChange={(event) => setSurveyor(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("octStation")}</span>
          <select className="c4-select" aria-label={v4("octStation")} value={sight} disabled={viewer} onChange={(event) => setStation(event.target.value)}>
            <option value="">{v4("octBlank")}</option>
            {OCTANT_SIGHTS.map((item) => <option key={item} value={item}>{stationLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("octFinish")}</span>
          <select className="c4-select" aria-label={v4("octFinish")} value={finish} disabled={viewer} onChange={(event) => setFinish(event.target.value)}>
            <option value="">{v4("octBlankFinish")}</option>
            {METALS.map((item) => <option key={item} value={item}>{finishLabel(v4, item.toUpperCase())}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("octLimb")}</span>
          <select className="c4-select" aria-label={v4("octLimb")} value={mirror} disabled={viewer} onChange={(event) => setLimb(event.target.value)}>
            <option value="">{v4("octBlankLimb")}</option>
            {LIMBS.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("octArc")}</span>
          <select className="c4-select" aria-label={v4("octArc")} value={arcNo} disabled={viewer} onChange={(event) => setArcNo(event.target.value)}>
            <option value="">{v4("octBlankArc")}</option>
            {ARCS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("octBead")}</span>
          <select className="c4-select" aria-label={v4("octBead")} value={shade} disabled={viewer} onChange={(event) => setBead(event.target.value)}>
            {BEADS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("octTags")}</span><input className="c4-field" aria-label={v4("octTags")} value={tags} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("octAdd")}</button>
      </form>
      <form className="c4-octant-tools" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addArcView(views, { id: `view-${Date.now()}`, name: viewName, tray, query, keeper: surveyorFilter, finish: finishFilter, mirror: limbFilter, sight: stationFilter, altitude: arcFilter, shade: beadFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("octViewName")}</span><input className="c4-field" aria-label={v4("octViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("octSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-octant-view">
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("octApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropArcView(views, view.id))}>{v4("octDropView")}</button>
          </span>
        ))}
      </form>
      {picked.length > 0 && (
        <div className="c4-octant-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkArcLatch(cards, picked))}>{v4("octBulkClamp")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkArcChest(cards, picked))}>{v4("octBulkCase")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkArcShadeMirror(cards, picked))}>{v4("octBulkLimb")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkArcChampagne(cards, picked))}>{v4("octBulkSilk")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkArcTag(cards, picked, "r"))}>{v4("octBulkTag")}</button>
        </div>
      )}
      <p className="c4-octant-meta">{v4("octSuggest")} {finishLabel(v4, suggested)} · {v4("octFair")} {fair} · {v4("octBusy")} {busy || v4("octBlankSurveyor")} · {v4("octNeighbors")} {neighborShadeCount(cards)} · {v4("octClash")} {clashSightCount(cards)} · {v4("octArcHint")} {arcHint} · {v4("octStationHint")} {stationLabel(v4, stationHint)}</p>
      {(reminders.length > 0 || idling.length > 0) && (
        <p className="c4-octant-meta">{v4("octDue")} {reminders.map((card) => card.title).join(" · ")} · {v4("octIdle")} {idling.map((card) => card.title).join(" · ")}</p>
      )}
      {!shown.length && <p className="c4-octant-empty">{v4("octEmpty")}</p>}
      <ol className={sheet === "index" ? "c4-octant-index" : "c4-octant-board"} data-density={density}>
        {shown.map((card, index) => {
          const dial = Math.round(((card.altitude ?? 0) / 60) * 100);
          return (
            <li key={card.id} className="c4-octant-card" data-on={index === focusAt ? "1" : "0"} data-latched={card.latched ? "1" : "0"} data-overdue={overdueArc(card) ? "1" : "0"} data-keen={keenSight(card.sight) ? "1" : "0"} data-still={stillSight(card.sight) ? "1" : "0"} data-house={houseFinish(card.finish) ? "1" : "0"} data-brisk={briskArc(card) ? "1" : "0"} data-idle={idleArc(card) ? "1" : "0"} data-resting={restingArc(card) ? "1" : "0"} data-late={lateArc(card, desk) ? "1" : "0"}>
              <div className="c4-octant-ring" aria-hidden="true" style={{ background: `conic-gradient(#c6a15b ${dial}%, #efe6d6 ${dial}% 100%)` }}>
                <span>{(card.title[0] || "·").toUpperCase()}</span>
              </div>
              <label className="c4-octant-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => togglePick(card.id)} /></label>
              <div>
                <input className="c4-field" aria-label={v4("octEdit")} value={card.title} disabled={viewer} onChange={(event) => store(editArc(cards, card.id, event.target.value))} />
                <input className="c4-field" aria-label={v4("octEditNote")} aria-required={false} value={card.note} disabled={viewer} onChange={(event) => store(editArcNote(cards, card.id, event.target.value))} />
                <p className="c4-octant-meta">{card.keeper || v4("octBlankSurveyor")} · {stationLabel(v4, card.sight)} · {finishLabel(v4, card.finish)} · {limbLabel(v4, card.mirror)} · {card.altitude ?? v4("octBlankArc")} · {v4("octBead")} {card.shade} · {card.tags.join(" ") || v4("octTags")}</p>
                <p className="c4-octant-meta">{stationLabel(v4, desk)} · {AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : v4("octAuditSave")}</p>
                <div className="c4-octant-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setArcLatch(cards, card.id, !card.latched))}>{card.latched ? v4("octUnclamp") : v4("octClamp")}</button>
                  <button type="button" className="c4-btn" disabled={viewer || card.chested} onClick={() => store(setArcLock(cards, card.id, !card.locked))}>{card.locked ? v4("octResume") : v4("octBench")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setArcChest(cards, card.id, !card.chested))}>{card.chested ? v4("octOpenAgain") : v4("octCased")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setArcStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("octUnstar") : v4("octStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleMirror(cards, card.id))}>{v4("octLimb")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftAltitude(cards, card.id))}>{v4("octWiden")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(dipAltitude(cards, card.id))}>{v4("octNarrow")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseShade(cards, card.id))}>{v4("octRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerShade(cards, card.id))}>{v4("octLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setArcFinish(cards, card.id, card.finish === "CHAMPAGNE" ? "ivory" : "champagne"))}>{v4("octFinish")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addArcTag(cards, card.id, "q"))}>{v4("octTags")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(arcCopy(card)); setCopied(card.id); }}>{copied === card.id ? v4("octCopied") : v4("octCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <button type="button" className="c4-btn" onClick={() => download("octant-arcs.csv", arcCsv(shown, desk))}>{v4("octCsv")}</button>
    </section>
  );
}

export function BannerPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: NameRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [shape, setShape] = useState<BannerShape>("all");
  const [review, setReview] = useState<BannerReview>("all");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<BannerRow[]>(() => (queue.data?.users || []).map((row, index) => ({
    id: row.id ? `name-${row.id}` : `name-${index}`,
    label: textField(row.name),
    note: { campaign: textField(row.campaign) } satisfies BannerValue,
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
    const present = presentBannerLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenBanners(readJson(BNN_KEY, []), present);
    const nextReviewed = readReviewedBanners(readJson(BNN_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(BNN_KEY, nextHidden);
    writeJson(BNN_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentBannerLanes(rows);
  const lanes = visibleBannerLanes(present, hidden, showHidden);
  const shown = visibleBanners(rows, lane, hue, query, review, reviewed, shape).filter((row) => {
    const token = bannerLane(row.note);
    if (!token) return true;
    return showHidden || !hidden.includes(token);
  });
  const focusAt = shown.length ? focus % shown.length : 0;
  const bars = bannerLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingBanner(rows);
  const leadHue = leadingBannerHue(rows);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveOctantFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveOctantFocus(index, shown.length, -1));
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
    writeJson(BNN_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(BNN_REVIEW_KEY, next);
  }
  return (
    <section className="c4-banner" aria-label={v4("bnnTitle")} data-plates="1" data-names={rows.length} data-role={role}>
      <header className="c4-banner-mast">
        <p className="c4-banner-seal" data-logo="mono">{v4("bnnLogo")}</p>
        <div>
          <p className="c4-banner-kicker">{v4("bnnSub")}</p>
          <h2 className="c4-title">{v4("bnnTitle")}</h2>
        </div>
      </header>
      <ol className="c4-banner-index" aria-label={v4("bnnTitle")}>
        <li data-tone="gold">{v4("bnnQuay")}</li>
        <li data-tone="ink">{v4("bnnLoft")}</li>
        <li data-tone="ivory">{v4("bnnHall")}</li>
        <li data-tone="mist">{v4("bnnCloset")}</li>
        <li data-tone="line">{v4("bnnPier")}</li>
      </ol>
      <p className="c4-banner-links">
        <Link href={crmv4Href(base, "oct")}>{v4("bnnCircles")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("octCustomers")}</Link>
        <Link href={crmv4Href(base, "settings", { area: "groups" })}>{v4("bnnGroups")}</Link>
      </p>
      <p className="c4-banner-hint">{v4("bnnHint")}</p>
      {viewer && <p className="c4-banner-note">{v4("bnnViewer")}</p>}
      {queue.loading && <p className="c4-banner-meta">{v4("bnnEmpty")}</p>}
      {queue.error && <p className="c4-banner-meta">{queue.error}</p>}
      <ul className="c4-banner-kpis" aria-label={v4("bnnRules")}>
        <li><span>{v4("bnnLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("bnnUnmarked")}</strong></li>
        <li><span>{v4("bnnToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("bnnUnmarked")}</strong></li>
        <li><span>{v4("bnnShared")}</span><strong>{sharedBannerCount(rows)}</strong></li>
        <li><span>{v4("bnnShare")}</span><strong>{bannerShare(laneBannerCount(rows, "quay"), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("bnnKnown")}</span><strong>{rows.filter((row) => bannerKnown(row.note)).length}</strong></li>
        <li><span>{v4("bnnTwin")}</span><strong>{rows.filter((row) => bannerTwin(row.note)).length}</strong></li>
        <li><span>{v4("bnnSlash")}</span><strong>{rows.filter((row) => bannerSlash(row.note)).length}</strong></li>
        <li><span>{v4("bnnEcho")}</span><strong>{rows.filter((row) => bannerEcho(row.note)).length}</strong></li>
      </ul>
      <div className="c4-banner-chart" aria-label={v4("bnnRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-banner-stake" data-on={lane === bar.lane ? "1" : "0"} data-lane={bar.lane} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ width: `${Math.max(8, Math.round((bar.count / maxBar) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{laneLabel(v4, bar.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-banner-tools">
        <input ref={searchRef} className="c4-field c4-banner-search" aria-label={v4("bnnSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("bnnSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("bnnAll") : hueLabel(v4, item)}</button>
        ))}
        {(["all", "quay", "loft", "hall", "closet", "pier", "wide", "notch", "leap", "slash", "twin", "known", "echo"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>
            {item === "all" ? v4("bnnShapeAll") : item === "wide" ? v4("bnnShapeWide") : item === "notch" ? v4("bnnShapeNotch") : item === "leap" ? v4("bnnShapeLeap") : item === "slash" ? v4("bnnShapeSlash") : item === "twin" ? v4("bnnShapeTwin") : item === "known" ? v4("bnnShapeKnown") : item === "echo" ? v4("bnnShapeEcho") : laneLabel(v4, item)}
          </button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("bnnAll") : item === "reviewed" ? v4("bnnReviewed") : v4("bnnUnreviewed")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("bnnShow")}</button>
      </div>
      <ul className="c4-banner-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleBanner(hidden, item))}>{hidden.includes(item) ? v4("bnnShow") : v4("bnnHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-banner-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkBannerReview(reviewed, picked, true))}>{v4("bnnBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkBannerReview(reviewed, picked, false))}>{v4("bnnBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-banner-empty">{v4("bnnEmpty")}</p>}
      <ol className="c4-banner-board">
        {shown.map((row, index) => {
          const seen = reviewed.includes(row.id);
          return (
            <li key={row.id} className="c4-banner-card" data-on={index === focusAt ? "1" : "0"} data-lane={bannerLane(row.note)} data-hue={bannerHue(row.note)} data-reviewed={seen ? "1" : "0"} data-known={bannerKnown(row.note) ? "1" : "0"}>
              <p className="c4-banner-stamp">{bannerStamp(row.note) || "·"}</p>
              <label className="c4-banner-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label || row.id} onChange={() => setPicked((current) => current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id])} /></label>
              <div>
                <strong>{row.label || v4("bnnUnmarked")}</strong>
                <p className="c4-banner-meta">{laneLabel(v4, bannerLane(row.note))} · {hueLabel(v4, bannerHue(row.note))} · {v4("bnnStep")} {bannerStep(row.note)}{bannerCap(row.note) ? ` · ${v4("bnnCap")}` : ""}{bannerTail(row.note) ? ` · ${v4("bnnTail")}` : ""}{bannerWide(row.note) ? ` · ${v4("bnnWide")}` : ""}{bannerNotch(row.note) ? ` · ${v4("bnnNotch")}` : ""}{bannerLeap(row.note) ? ` · ${v4("bnnLeap")}` : ""}</p>
                <div className="c4-banner-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleBannerReview(reviewed, row.id))}>{seen ? v4("bnnReviewed") : v4("bnnReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(bannerCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("bnnCopied") : v4("bnnCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="c4-banner-tools">
        <button type="button" className="c4-btn" onClick={() => download("banner-lanes.csv", bannerLanesCsv(rows))}>{v4("bnnCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("tier-rows.csv", bannerRowsCsv(shown, reviewed))}>{v4("bnnRowCsv")}</button>
      </div>
    </section>
  );
}
