"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  THEODOLITE_STATIONS,
  THD_DENSITY_KEY,
  THD_KEY,
  THD_VIEW_KEY,
  TIR_KEY,
  TIR_REVIEW_KEY,
  addCircle,
  addCircleTag,
  addCircleView,
  briskCircle,
  bulkCircleChampagne,
  bulkCircleClampLimb,
  bulkCircleClamp,
  bulkCircleCase,
  bulkCircleTag,
  bulkTierReview,
  busiestSurveyor,
  circleBars,
  circleCopy,
  circleCounts,
  circleCsv,
  circleDensity,
  circleSurveyors,
  circleTimeline,
  clashStationCount,
  cycleLimb,
  dropCircleView,
  editCircle,
  editCircleNote,
  fairSurveyor,
  houseFinish,
  idleCircle,
  idleCircles,
  laneTierCount,
  lateCircle,
  leadingTier,
  leadingTierHue,
  widenArc,
  widenArcFocused,
  lowerBead,
  lowerBeadFocused,
  moveTheodoliteFocus,
  neighborBeadCount,
  overdueCircle,
  benchCircleFocused,
  clampCircleFocused,
  limbFocused,
  presentTierLanes,
  keenStation,
  raiseBead,
  raiseBeadFocused,
  readCircles,
  readCircleViews,
  readHiddenTiers,
  readReviewedTiers,
  reminderCircles,
  restingCircle,
  setCircleFinish,
  setCircleBench,
  setCircleClamp,
  setCircleCase,
  setCircleStar,
  sharedTierCount,
  narrowArc,
  narrowArcFocused,
  sortCircles,
  tierCopy,
  tierEcho,
  tierHue,
  tierKnown,
  tierCap,
  tierLane,
  tierLanes,
  tierLanesCsv,
  tierLeap,
  tierNotch,
  tierRowsCsv,
  tierShare,
  tierSlash,
  tierStamp,
  tierStep,
  tierTail,
  tierTwin,
  tierWide,
  starCircleFocused,
  stillStation,
  suggestArc,
  suggestStation,
  suggestFinish,
  tagCircleFocused,
  toggleTier,
  toggleTierReview,
  visibleCircles,
  visibleTierLanes,
  visibleTiers,
  type CircleDensity,
  type TheodoliteCircle,
  type CircleSort,
  type CircleTray,
  type CircleView,
  type TierReview,
  type TierRow,
  type TierShape,
  type TierValue,
} from "@/lib/crmv4/round273";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const METALS = ["ivory", "graphite", "champagne"] as const;
const LIMBS = ["circle", "vernier", "clamp"] as const;
const ARCS = ["15", "45", "90"] as const;
const BEADS = ["2", "4", "8", "16"] as const;

const STATION_KEY: Record<string, CrmV4CopyKey> = {
  zenith: "thdZenith",
  transit: "thdTransit",
  azimuth: "thdAzimuth",
  nadir: "thdNadir",
  keen: "thdKeenStation",
  still: "thdStillStation",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "thdAuditSave",
  edit: "thdAuditEdit",
  note: "thdAuditNote",
  limb: "thdAuditLimb",
  clamp: "thdAuditClamp",
  unclamp: "thdAuditUnclamp",
  bench: "thdAuditBench",
  resume: "thdAuditResume",
  case: "thdAuditCase",
  open: "thdAuditOpen",
  finish: "thdAuditFinish",
  tag: "thdAuditTag",
  bead: "thdAuditBead",
  arc: "thdAuditArc",
  narrow: "thdAuditNarrow",
  star: "thdAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  nave: "tirNave",
  loft: "tirLoft",
  study: "tirStudy",
  closet: "tirCloset",
  stile: "tirStile",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "tirIvory",
  graphite: "tirGraphite",
  champagne: "tirChampagne",
};

type NameRow = {
  id?: string;
  name?: string | null;
  accountType?: string | null;
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
  return key ? v4(key) : v4("thdBlank");
}

function finishLabel(v4: V4, finish: string): string {
  if (finish === "IVORY") return v4("thdIvory");
  if (finish === "GRAPHITE") return v4("thdGraphite");
  if (finish === "CHAMPAGNE") return v4("thdChampagne");
  return v4("thdBlankFinish");
}

function limbLabel(v4: V4, limb: string): string {
  if (limb === "circle") return v4("thdCircle");
  if (limb === "vernier") return v4("thdVernier");
  if (limb === "clamp") return v4("thdClampLimb");
  return v4("thdBlankLimb");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("tirUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("tirUnmarked");
}

export function TheodoliteCircles({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<TheodoliteCircle[]>([]);
  const [views, setViews] = useState<CircleView[]>([]);
  const [tray, setTray] = useState<CircleTray>("field");
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
  const [sort, setSort] = useState<CircleSort>("station");
  const [density, setDensity] = useState<CircleDensity>("airy");
  const [sheet, setSheet] = useState<"arc" | "index">("arc");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [surveyor, setSurveyor] = useState("");
  const [station, setStation] = useState("");
  const [finish, setFinish] = useState("");
  const [limb, setLimb] = useState("");
  const [arcNo, setArcNo] = useState("");
  const [bead, setBead] = useState("2");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [copied, setCopied] = useState("");
  const [desk, setDesk] = useState("zenith");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readCircles(readJson(THD_KEY, [])));
    setViews(readCircleViews(readJson(THD_VIEW_KEY, [])));
    setDensity(circleDensity(readJson(THD_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: TheodoliteCircle[]) {
    setCards(next);
    writeJson(THD_KEY, next);
  }
  function storeViews(next: CircleView[]) {
    setViews(next);
    writeJson(THD_VIEW_KEY, next);
  }
  function storeDensity(next: CircleDensity) {
    setDensity(next);
    writeJson(THD_DENSITY_KEY, next);
  }

  const shown = useMemo(() => sortCircles(visibleCircles(cards, tray, query, surveyorFilter, finishFilter, limbFilter, stationFilter, arcFilter, beadFilter, houseOnly, keenOnly, stillOnly), sort), [cards, tray, query, surveyorFilter, finishFilter, limbFilter, stationFilter, arcFilter, beadFilter, houseOnly, keenOnly, stillOnly, sort]);
  const counts = circleCounts(cards, shown, desk);
  const bars = circleBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = circleTimeline(cards);
  const surveyors = circleSurveyors(cards);
  const ids = shown.map((card) => card.id);
  const suggested = suggestFinish(cards);
  const fair = fairSurveyor(cards, surveyors.join(","));
  const busy = busiestSurveyor(cards);
  const reminders = reminderCircles(cards);
  const idling = idleCircles(cards);
  const arcHint = suggestArc(cards, clock);
  const stationHint = suggestStation(clock);

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
        setFocusAt((index) => moveTheodoliteFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveTheodoliteFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        if (!viewer) store(clampCircleFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        if (!viewer) store(benchCircleFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        if (!viewer) store(limbFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        if (!viewer) store(widenArcFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        if (!viewer) store(narrowArcFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        if (!viewer) store(tagCircleFocused(cards, ids, focusAt, "x"));
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        if (!viewer) store(starCircleFocused(cards, ids, focusAt));
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
        setSheet((value) => value === "arc" ? "index" : "arc");
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

  function applyView(view: CircleView) {
    setTray(view.tray);
    setQuery(view.query);
    setSurveyorFilter(view.surveyor || "all");
    setFinishFilter(view.finish);
    setLimbFilter(view.limb);
    setStationFilter(view.station);
    setArcFilter(view.arc);
    setBeadFilter(view.bead);
  }

  return (
    <section className="c4-theodolite" aria-label={v4("thdTitle")} data-cards="1" data-desk="theodolite" data-role={role} data-density={density} data-sheet={sheet}>
      <header className="c4-theodolite-mast">
        <p className="c4-theodolite-seal" data-logo="mono" aria-hidden="true">
          <span>{v4("thdLogo")}</span>
          <i />
        </p>
        <div className="c4-theodolite-mast-copy">
          <p className="c4-theodolite-kicker">{v4("thdSub")}</p>
          <h2 className="c4-title">{v4("thdTitle")}</h2>
        </div>
        <ol className="c4-theodolite-limbs" aria-hidden="true">
          <li>{v4("thdCircle")}</li>
          <li>{v4("thdVernier")}</li>
          <li>{v4("thdClampLimb")}</li>
        </ol>
      </header>
      <p className="c4-theodolite-links">
        <Link href={crmv4Href(base, "tir")}>{v4("thdPlates")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("thdCustomers")}</Link>
        <Link href={crmv4Href(base, "settings", { area: "desks" })}>{v4("thdDesks")}</Link>
      </p>
      {viewer && <p className="c4-theodolite-note">{v4("thdViewer")}</p>}
      <p className="c4-theodolite-lead">{v4("thdKeys")}</p>
      <p className="c4-theodolite-hint">{v4("thdHint")}</p>
      <p className="c4-theodolite-notice" role="status">{v4("thdNotice")} {counts.overdue}</p>
      <ol className="c4-theodolite-ledger" aria-label={v4("thdChart")}>
        <li><span>{v4("thdField")}</span><strong>{counts.field}</strong></li>
        <li><span>{v4("thdBench")}</span><strong>{counts.bench}</strong></li>
        <li><span>{v4("thdCased")}</span><strong>{counts.case}</strong></li>
        <li><span>{v4("thdClamped")}</span><strong>{counts.clamped}</strong></li>
        <li><span>{v4("thdKeen")}</span><strong>{counts.keen}</strong></li>
        <li><span>{v4("thdStill")}</span><strong>{counts.still}</strong></li>
        <li><span>{v4("thdSoon")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("thdOverdue")}</span><strong>{counts.overdue}</strong></li>
      </ol>
      <ol className="c4-theodolite-arc" aria-label={v4("thdBars")}>
        {bars.map((bar) => (
          <li key={bar.station} data-station={bar.station}>
            <strong>{bar.count}</strong>
            <i style={{ width: `${Math.max(8, Math.round((bar.count / peak) * 100))}%` }} />
            <span>{stationLabel(v4, bar.station)}</span>
          </li>
        ))}
      </ol>
      <ol className="c4-theodolite-time" aria-label={v4("thdTimeline")}>
        {timeline.map((lane) => (
          <li key={lane.bead}><span>{lane.bead}</span><strong>{lane.titles.join(" · ")}</strong></li>
        ))}
      </ol>
      <div className="c4-theodolite-tools">
        <label className="c4-lab">
          <span>{v4("thdDesk")}</span>
          <select className="c4-select" aria-label={v4("thdDesk")} value={desk} onChange={(event) => setDesk(event.target.value)}>
            {THEODOLITE_STATIONS.map((item) => <option key={item} value={item}>{stationLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("thdSearch")}</span>
          <input ref={searchRef} className="c4-field c4-theodolite-search" aria-label={v4("thdSearch")} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("thdSearch")} />
        </label>
        {(["field", "bench", "case"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "field" ? v4("thdField") : item === "bench" ? v4("thdBench") : v4("thdCased")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("thdHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={keenOnly ? "1" : "0"} onClick={() => setKeenOnly((value) => !value)}>{v4("thdKeen")}</button>
        <button type="button" className="c4-chip" data-on={stillOnly ? "1" : "0"} onClick={() => setStillOnly((value) => !value)}>{v4("thdStill")}</button>
        <button type="button" className="c4-chip" data-on={sort === "surveyor" ? "1" : "0"} onClick={() => setSort((value) => value === "station" ? "surveyor" : "station")}>{sort === "surveyor" ? v4("thdSortSurveyor") : v4("thdSortStation")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "airy" ? "tight" : "airy")}>{density === "airy" ? v4("thdAiry") : v4("thdTight")}</button>
        <button type="button" className="c4-chip" onClick={() => setSheet((value) => value === "arc" ? "index" : "arc")}>{sheet === "arc" ? v4("thdIndex") : v4("thdArc")}</button>
      </div>
      <div className="c4-theodolite-tools">
        <select className="c4-select" aria-label={v4("thdSurveyor")} value={surveyorFilter} onChange={(event) => setSurveyorFilter(event.target.value)}>
          <option value="all">{v4("thdAll")}</option>
          {surveyors.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("thdFinish")} value={finishFilter} onChange={(event) => setFinishFilter(event.target.value)}>
          <option value="all">{v4("thdAll")}</option>
          {METALS.map((item) => <option key={item} value={item}>{finishLabel(v4, item.toUpperCase())}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("thdLimb")} value={limbFilter} onChange={(event) => setLimbFilter(event.target.value)}>
          <option value="all">{v4("thdAll")}</option>
          {LIMBS.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("thdStation")} value={stationFilter} onChange={(event) => setStationFilter(event.target.value)}>
          <option value="all">{v4("thdAll")}</option>
          <option value="keen">{v4("thdKeenStation")}</option>
          <option value="still">{v4("thdStillStation")}</option>
          {THEODOLITE_STATIONS.map((item) => <option key={item} value={item}>{stationLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("thdArc")} value={arcFilter} onChange={(event) => setArcFilter(event.target.value)}>
          <option value="all">{v4("thdAll")}</option>
          {ARCS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("thdBead")} value={beadFilter} onChange={(event) => setBeadFilter(event.target.value)}>
          <option value="all">{v4("thdAll")}</option>
          {BEADS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      <form className="c4-theodolite-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addCircle(cards, { id: `thd-${Date.now()}`, title, note, surveyor, station, finish, limb, arc: arcNo, bead, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <label className="c4-lab"><span>{v4("thdTitleField")}</span><input className="c4-field" aria-label={v4("thdTitleField")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("thdNote")}</span><input className="c4-field" aria-label={v4("thdNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <p className="c4-theodolite-meta">{v4("thdNoteOptional")}</p>
        <label className="c4-lab"><span>{v4("thdSurveyor")}</span><input className="c4-field" aria-label={v4("thdSurveyor")} value={surveyor} disabled={viewer} onChange={(event) => setSurveyor(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("thdStation")}</span>
          <select className="c4-select" aria-label={v4("thdStation")} value={station} disabled={viewer} onChange={(event) => setStation(event.target.value)}>
            <option value="">{v4("thdBlank")}</option>
            {THEODOLITE_STATIONS.map((item) => <option key={item} value={item}>{stationLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("thdFinish")}</span>
          <select className="c4-select" aria-label={v4("thdFinish")} value={finish} disabled={viewer} onChange={(event) => setFinish(event.target.value)}>
            <option value="">{v4("thdBlankFinish")}</option>
            {METALS.map((item) => <option key={item} value={item}>{finishLabel(v4, item.toUpperCase())}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("thdLimb")}</span>
          <select className="c4-select" aria-label={v4("thdLimb")} value={limb} disabled={viewer} onChange={(event) => setLimb(event.target.value)}>
            <option value="">{v4("thdBlankLimb")}</option>
            {LIMBS.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("thdArc")}</span>
          <select className="c4-select" aria-label={v4("thdArc")} value={arcNo} disabled={viewer} onChange={(event) => setArcNo(event.target.value)}>
            <option value="">{v4("thdBlankArc")}</option>
            {ARCS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("thdBead")}</span>
          <select className="c4-select" aria-label={v4("thdBead")} value={bead} disabled={viewer} onChange={(event) => setBead(event.target.value)}>
            {BEADS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("thdTags")}</span><input className="c4-field" aria-label={v4("thdTags")} value={tags} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("thdAdd")}</button>
      </form>
      <form className="c4-theodolite-tools" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addCircleView(views, { id: `view-${Date.now()}`, name: viewName, tray, query, surveyor: surveyorFilter, finish: finishFilter, limb: limbFilter, station: stationFilter, arc: arcFilter, bead: beadFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("thdViewName")}</span><input className="c4-field" aria-label={v4("thdViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("thdSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-theodolite-view">
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("thdApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropCircleView(views, view.id))}>{v4("thdDropView")}</button>
          </span>
        ))}
      </form>
      {picked.length > 0 && (
        <div className="c4-theodolite-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkCircleClamp(cards, picked))}>{v4("thdBulkClamp")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkCircleCase(cards, picked))}>{v4("thdBulkCase")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkCircleClampLimb(cards, picked))}>{v4("thdBulkLimb")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkCircleChampagne(cards, picked))}>{v4("thdBulkSilk")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkCircleTag(cards, picked, "y"))}>{v4("thdBulkTag")}</button>
        </div>
      )}
      <p className="c4-theodolite-meta">{v4("thdSuggest")} {finishLabel(v4, suggested)} · {v4("thdFair")} {fair} · {v4("thdBusy")} {busy || v4("thdBlankSurveyor")} · {v4("thdNeighbors")} {neighborBeadCount(cards)} · {v4("thdClash")} {clashStationCount(cards)} · {v4("thdArcHint")} {arcHint} · {v4("thdStationHint")} {stationLabel(v4, stationHint)}</p>
      {(reminders.length > 0 || idling.length > 0) && (
        <p className="c4-theodolite-meta">{v4("thdDue")} {reminders.map((card) => card.title).join(" · ")} · {v4("thdIdle")} {idling.map((card) => card.title).join(" · ")}</p>
      )}
      {!shown.length && <p className="c4-theodolite-empty">{v4("thdEmpty")}</p>}
      <ol className={sheet === "index" ? "c4-theodolite-index" : "c4-theodolite-board"} data-density={density}>
        {shown.map((card, index) => {
          const dial = Math.round(((card.arc ?? 0) / 90) * 100);
          return (
            <li key={card.id} className="c4-theodolite-card" data-on={index === focusAt ? "1" : "0"} data-clamped={card.clamped ? "1" : "0"} data-overdue={overdueCircle(card) ? "1" : "0"} data-keen={keenStation(card.station) ? "1" : "0"} data-still={stillStation(card.station) ? "1" : "0"} data-house={houseFinish(card.finish) ? "1" : "0"} data-brisk={briskCircle(card) ? "1" : "0"} data-idle={idleCircle(card) ? "1" : "0"} data-resting={restingCircle(card) ? "1" : "0"} data-late={lateCircle(card, desk) ? "1" : "0"}>
              <div className="c4-theodolite-ring" aria-hidden="true" style={{ background: `conic-gradient(#c6a15b ${dial}%, #efe6d6 ${dial}% 100%)` }}>
                <span>{(card.title[0] || "·").toUpperCase()}</span>
              </div>
              <label className="c4-theodolite-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => togglePick(card.id)} /></label>
              <div>
                <input className="c4-field" aria-label={v4("thdEdit")} value={card.title} disabled={viewer} onChange={(event) => store(editCircle(cards, card.id, event.target.value))} />
                <input className="c4-field" aria-label={v4("thdEditNote")} aria-required={false} value={card.note} disabled={viewer} onChange={(event) => store(editCircleNote(cards, card.id, event.target.value))} />
                <p className="c4-theodolite-meta">{card.surveyor || v4("thdBlankSurveyor")} · {stationLabel(v4, card.station)} · {finishLabel(v4, card.finish)} · {limbLabel(v4, card.limb)} · {card.arc ?? v4("thdBlankArc")} · {v4("thdBead")} {card.bead} · {card.tags.join(" ") || v4("thdTags")}</p>
                <p className="c4-theodolite-meta">{stationLabel(v4, desk)} · {AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : v4("thdAuditSave")}</p>
                <div className="c4-theodolite-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCircleClamp(cards, card.id, !card.clamped))}>{card.clamped ? v4("thdUnclamp") : v4("thdClamp")}</button>
                  <button type="button" className="c4-btn" disabled={viewer || card.cased} onClick={() => store(setCircleBench(cards, card.id, !card.benched))}>{card.benched ? v4("thdResume") : v4("thdBench")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCircleCase(cards, card.id, !card.cased))}>{card.cased ? v4("thdOpenAgain") : v4("thdCased")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCircleStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("thdUnstar") : v4("thdStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleLimb(cards, card.id))}>{v4("thdLimb")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(widenArc(cards, card.id))}>{v4("thdWiden")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(narrowArc(cards, card.id))}>{v4("thdNarrow")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseBead(cards, card.id))}>{v4("thdRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerBead(cards, card.id))}>{v4("thdLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCircleFinish(cards, card.id, card.finish === "CHAMPAGNE" ? "ivory" : "champagne"))}>{v4("thdFinish")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addCircleTag(cards, card.id, "z"))}>{v4("thdTags")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(circleCopy(card)); setCopied(card.id); }}>{copied === card.id ? v4("thdCopied") : v4("thdCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <button type="button" className="c4-btn" onClick={() => download("theodolite-circles.csv", circleCsv(shown, desk))}>{v4("thdCsv")}</button>
    </section>
  );
}

export function TierPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: NameRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [shape, setShape] = useState<TierShape>("all");
  const [review, setReview] = useState<TierReview>("all");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<TierRow[]>(() => (queue.data?.users || []).map((row, index) => ({
    id: row.id ? `name-${row.id}` : `name-${index}`,
    label: textField(row.name),
    note: { accountType: textField(row.accountType) } satisfies TierValue,
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
    const present = presentTierLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenTiers(readJson(TIR_KEY, []), present);
    const nextReviewed = readReviewedTiers(readJson(TIR_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(TIR_KEY, nextHidden);
    writeJson(TIR_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentTierLanes(rows);
  const lanes = visibleTierLanes(present, hidden, showHidden);
  const shown = visibleTiers(rows, lane, hue, query, review, reviewed, shape).filter((row) => {
    const token = tierLane(row.note);
    if (!token) return true;
    return showHidden || !hidden.includes(token);
  });
  const focusAt = shown.length ? focus % shown.length : 0;
  const bars = tierLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingTier(rows);
  const leadHue = leadingTierHue(rows);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveTheodoliteFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveTheodoliteFocus(index, shown.length, -1));
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
    writeJson(TIR_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(TIR_REVIEW_KEY, next);
  }
  return (
    <section className="c4-tier" aria-label={v4("tirTitle")} data-plates="1" data-names={rows.length} data-role={role}>
      <header className="c4-tier-mast">
        <p className="c4-tier-seal" data-logo="mono">{v4("tirLogo")}</p>
        <div>
          <p className="c4-tier-kicker">{v4("tirSub")}</p>
          <h2 className="c4-title">{v4("tirTitle")}</h2>
        </div>
      </header>
      <ol className="c4-tier-index" aria-label={v4("tirTitle")}>
        <li data-tone="gold">{v4("tirNave")}</li>
        <li data-tone="ink">{v4("tirLoft")}</li>
        <li data-tone="ivory">{v4("tirStudy")}</li>
        <li data-tone="mist">{v4("tirCloset")}</li>
        <li data-tone="line">{v4("tirStile")}</li>
      </ol>
      <p className="c4-tier-links">
        <Link href={crmv4Href(base, "thd")}>{v4("tirCircles")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("thdCustomers")}</Link>
        <Link href={crmv4Href(base, "settings", { area: "groups" })}>{v4("tirGroups")}</Link>
      </p>
      <p className="c4-tier-hint">{v4("tirHint")}</p>
      {viewer && <p className="c4-tier-note">{v4("tirViewer")}</p>}
      {queue.loading && <p className="c4-tier-meta">{v4("tirEmpty")}</p>}
      {queue.error && <p className="c4-tier-meta">{queue.error}</p>}
      <ul className="c4-tier-kpis" aria-label={v4("tirRules")}>
        <li><span>{v4("tirLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("tirUnmarked")}</strong></li>
        <li><span>{v4("tirToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("tirUnmarked")}</strong></li>
        <li><span>{v4("tirShared")}</span><strong>{sharedTierCount(rows)}</strong></li>
        <li><span>{v4("tirShare")}</span><strong>{tierShare(laneTierCount(rows, "nave"), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("tirKnown")}</span><strong>{rows.filter((row) => tierKnown(row.note)).length}</strong></li>
        <li><span>{v4("tirTwin")}</span><strong>{rows.filter((row) => tierTwin(row.note)).length}</strong></li>
        <li><span>{v4("tirSlash")}</span><strong>{rows.filter((row) => tierSlash(row.note)).length}</strong></li>
        <li><span>{v4("tirEcho")}</span><strong>{rows.filter((row) => tierEcho(row.note)).length}</strong></li>
      </ul>
      <div className="c4-tier-chart" aria-label={v4("tirRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-tier-stake" data-on={lane === bar.lane ? "1" : "0"} data-lane={bar.lane} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ width: `${Math.max(8, Math.round((bar.count / maxBar) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{laneLabel(v4, bar.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-tier-tools">
        <input ref={searchRef} className="c4-field c4-tier-search" aria-label={v4("tirSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("tirSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("tirAll") : hueLabel(v4, item)}</button>
        ))}
        {(["all", "nave", "loft", "study", "closet", "stile", "wide", "notch", "leap", "slash", "twin", "known", "echo"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>
            {item === "all" ? v4("tirShapeAll") : item === "wide" ? v4("tirShapeWide") : item === "notch" ? v4("tirShapeNotch") : item === "leap" ? v4("tirShapeLeap") : item === "slash" ? v4("tirShapeSlash") : item === "twin" ? v4("tirShapeTwin") : item === "known" ? v4("tirShapeKnown") : item === "echo" ? v4("tirShapeEcho") : laneLabel(v4, item)}
          </button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("tirAll") : item === "reviewed" ? v4("tirReviewed") : v4("tirUnreviewed")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("tirShow")}</button>
      </div>
      <ul className="c4-tier-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleTier(hidden, item))}>{hidden.includes(item) ? v4("tirShow") : v4("tirHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-tier-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkTierReview(reviewed, picked, true))}>{v4("tirBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkTierReview(reviewed, picked, false))}>{v4("tirBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-tier-empty">{v4("tirEmpty")}</p>}
      <ol className="c4-tier-board">
        {shown.map((row, index) => {
          const seen = reviewed.includes(row.id);
          return (
            <li key={row.id} className="c4-tier-card" data-on={index === focusAt ? "1" : "0"} data-lane={tierLane(row.note)} data-hue={tierHue(row.note)} data-reviewed={seen ? "1" : "0"} data-known={tierKnown(row.note) ? "1" : "0"}>
              <p className="c4-tier-stamp">{tierStamp(row.note) || "·"}</p>
              <label className="c4-tier-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label || row.id} onChange={() => setPicked((current) => current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id])} /></label>
              <div>
                <strong>{row.label || v4("tirUnmarked")}</strong>
                <p className="c4-tier-meta">{laneLabel(v4, tierLane(row.note))} · {hueLabel(v4, tierHue(row.note))} · {v4("tirStep")} {tierStep(row.note)}{tierCap(row.note) ? ` · ${v4("tirCap")}` : ""}{tierTail(row.note) ? ` · ${v4("tirTail")}` : ""}{tierWide(row.note) ? ` · ${v4("tirWide")}` : ""}{tierNotch(row.note) ? ` · ${v4("tirNotch")}` : ""}{tierLeap(row.note) ? ` · ${v4("tirLeap")}` : ""}</p>
                <div className="c4-tier-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleTierReview(reviewed, row.id))}>{seen ? v4("tirReviewed") : v4("tirReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(tierCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("tirCopied") : v4("tirCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="c4-tier-tools">
        <button type="button" className="c4-btn" onClick={() => download("tier-lanes.csv", tierLanesCsv(rows))}>{v4("tirCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("tier-rows.csv", tierRowsCsv(shown, reviewed))}>{v4("tirRowCsv")}</button>
      </div>
    </section>
  );
}
