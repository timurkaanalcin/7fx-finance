"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  AML_DENSITY_KEY,
  AML_KEY,
  AML_VIEW_KEY,
  ARM_RINGS,
  CTY_KEY,
  CTY_REVIEW_KEY,
  addArmillary,
  addArmillaryTag,
  addArmillaryView,
  armillaryBars,
  armillaryCopy,
  armillaryCounts,
  armillaryCsv,
  armillaryDensity,
  armillaryKeepers,
  armillaryTimeline,
  briskArmillary,
  bulkArmillaryChampagne,
  bulkArmillaryLog,
  bulkArmillarySlate,
  bulkArmillaryStow,
  bulkArmillaryTag,
  bulkCityReview,
  busiestKeeper,
  cityCap,
  cityCopy,
  cityDash,
  cityDigit,
  cityEcho,
  cityGroups,
  cityHue,
  cityKnown,
  cityLane,
  cityLanes,
  cityLanesCsv,
  cityLeap,
  cityRowsCsv,
  cityShare,
  citySpace,
  cityStamp,
  cityStep,
  cityTail,
  cityTwin,
  cityWide,
  clashRingCount,
  cycleInk,
  dipDegree,
  dipDegreeFocused,
  dropArmillaryView,
  editArmillary,
  editArmillaryNote,
  fairKeeper,
  houseFinish,
  idleArmillary,
  idleArmillaryList,
  inkFocused,
  keenRing,
  laneCityCount,
  lateArmillary,
  leadingCity,
  leadingCityHue,
  liftDegree,
  liftDegreeFocused,
  lockArmillaryFocused,
  logArmillaryFocused,
  lowerBead,
  lowerBeadFocused,
  moveArmFocus,
  neighborArmCount,
  overdueArmillary,
  presentCityLanes,
  raiseBead,
  raiseBeadFocused,
  readArmillary,
  readArmillaryViews,
  readHiddenCities,
  readReviewedCities,
  reminderArmillary,
  restingArmillary,
  ringBand,
  setArmillaryFinish,
  setArmillaryLock,
  setArmillaryLogged,
  setArmillaryStar,
  setArmillaryStow,
  sharedCityCount,
  sortArmillary,
  starArmillaryFocused,
  stillRing,
  suggestDegree,
  suggestFinish,
  suggestRing,
  tagArmillaryFocused,
  toggleCity,
  toggleCityReview,
  visibleArmillary,
  visibleCities,
  visibleCityLanes,
  type ArmDensity,
  type ArmSort,
  type ArmTray,
  type ArmView,
  type ArmillaryRing,
  type CityReview,
  type CityRow,
  type CityShape,
  type CityValue,
} from "@/lib/crmv4/round284";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type NameRow = { id?: string; name?: string | null; lastCity?: string | null };

const FINISHES = ["ivory", "graphite", "champagne"] as const;
const INKS = ["pearl", "gilt", "slate"] as const;
const DEGREES = ["15", "45", "75"] as const;
const BEADS = ["3", "6", "9"] as const;

const RING_KEY: Record<string, CrmV4CopyKey> = {
  equinoctial: "amlEquinoctial",
  solstitial: "amlSolstitial",
  meridian: "amlMeridian",
  colure: "amlColure",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "amlAuditSave",
  edit: "amlAuditEdit",
  note: "amlAuditNote",
  ink: "amlAuditInk",
  log: "amlAuditLog",
  unlog: "amlAuditUnlog",
  lock: "amlAuditLock",
  resume: "amlAuditResume",
  stow: "amlAuditStow",
  open: "amlAuditOpen",
  finish: "amlAuditFinish",
  tag: "amlAuditTag",
  bead: "amlAuditBead",
  degree: "amlAuditDegree",
  dip: "amlAuditDip",
  star: "amlAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  house: "ctyHouse",
  mark: "ctyMark",
  link: "ctyLink",
  court: "ctyCourt",
  span: "ctySpan",
  seal: "ctySeal",
  open: "ctyOpen",
  long: "ctyLong",
  short: "ctyShort",
  desk: "ctyDesk",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "ctyIvory",
  graphite: "ctyGraphite",
  champagne: "ctyChampagne",
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
  const target = event.target;
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

function textField(raw: unknown): string {
  return String(raw ?? "").replace(/\s+/g, " ").trim();
}

function ringLabel(v4: V4, ring: string): string {
  const key = RING_KEY[ring];
  return key ? v4(key) : v4("amlBlankRing");
}

function finishLabel(v4: V4, finish: string): string {
  if (finish === "IVORY" || finish === "ivory") return v4("amlIvory");
  if (finish === "GRAPHITE" || finish === "graphite") return v4("amlGraphite");
  if (finish === "CHAMPAGNE" || finish === "champagne") return v4("amlChampagne");
  return v4("amlBlankFinish");
}

function inkLabel(v4: V4, ink: string): string {
  if (ink === "pearl") return v4("amlPearl");
  if (ink === "gilt") return v4("amlGilt");
  if (ink === "slate") return v4("amlSlate");
  return v4("amlBlankInk");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("ctyUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("ctyUnmarked");
}

export function ArmillaryRings({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<ArmillaryRing[]>([]);
  const [views, setViews] = useState<ArmView[]>([]);
  const [density, setDensity] = useState<ArmDensity>("air");
  const [sheet, setSheet] = useState<"board" | "index">("board");
  const [tray, setTray] = useState<ArmTray>("bench");
  const [query, setQuery] = useState("");
  const [keeperFilter, setKeeperFilter] = useState("all");
  const [finishFilter, setFinishFilter] = useState("all");
  const [inkFilter, setInkFilter] = useState("all");
  const [ringFilter, setRingFilter] = useState("all");
  const [degreeFilter, setDegreeFilter] = useState("all");
  const [beadFilter, setBeadFilter] = useState("all");
  const [houseOnly, setHouseOnly] = useState(false);
  const [keenOnly, setKeenOnly] = useState(false);
  const [stillOnly, setStillOnly] = useState(false);
  const [sort, setSort] = useState<ArmSort>("ring");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [keeper, setKeeper] = useState("");
  const [ring, setRing] = useState("");
  const [finish, setFinish] = useState("");
  const [ink, setInk] = useState("");
  const [degreeNo, setDegreeNo] = useState("");
  const [beadNo, setBeadNo] = useState("3");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [copied, setCopied] = useState("");
  const [desk, setDesk] = useState("equinoctial");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readArmillary(readJson(AML_KEY, [])));
    setViews(readArmillaryViews(readJson(AML_VIEW_KEY, [])));
    setDensity(armillaryDensity(readJson(AML_DENSITY_KEY, "air")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: ArmillaryRing[]) {
    setCards(next);
    writeJson(AML_KEY, next);
  }
  function storeViews(next: ArmView[]) {
    setViews(next);
    writeJson(AML_VIEW_KEY, next);
  }
  function storeDensity(next: ArmDensity) {
    setDensity(next);
    writeJson(AML_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortArmillary(visibleArmillary(cards, tray, query, keeperFilter, finishFilter, inkFilter, ringFilter, degreeFilter, beadFilter, houseOnly, keenOnly, stillOnly), sort),
    [cards, tray, query, keeperFilter, finishFilter, inkFilter, ringFilter, degreeFilter, beadFilter, houseOnly, keenOnly, stillOnly, sort],
  );
  const counts = armillaryCounts(cards, shown, desk);
  const bars = armillaryBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = armillaryTimeline(cards);
  const keepers = armillaryKeepers(cards);
  const ids = shown.map((card) => card.id);
  const suggested = suggestFinish(cards);
  const fair = fairKeeper(cards, keepers.join(","));
  const busy = busiestKeeper(cards);
  const reminders = reminderArmillary(cards);
  const idling = idleArmillaryList(cards);
  const degreeHint = suggestDegree(cards, clock);
  const ringHint = suggestRing(clock);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setKeeper("");
        setRing("");
        setFinish("");
        setInk("");
        setDegreeNo("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveArmFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveArmFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        if (!viewer) store(logArmillaryFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        if (!viewer) store(lockArmillaryFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        if (!viewer) store(inkFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        if (!viewer) store(liftDegreeFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        if (!viewer) store(dipDegreeFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        if (!viewer) store(tagArmillaryFocused(cards, ids, focusAt, "e"));
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        if (!viewer) store(starArmillaryFocused(cards, ids, focusAt));
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
        setSheet((value) => (value === "board" ? "index" : "board"));
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

  function applyView(view: ArmView) {
    setTray(view.tray);
    setQuery(view.query);
    setKeeperFilter(view.keeper || "all");
    setFinishFilter(view.finish);
    setInkFilter(view.ink);
    setRingFilter(view.ring);
    setDegreeFilter(view.degree);
    setBeadFilter(view.bead);
  }

  return (
    <section className="c4-armillary" aria-label={v4("amlTitle")} data-cards="1" data-desk="bench" data-role={role} data-density={density} data-sheet={sheet}>
      <header className="c4-armillary-mast">
        <p className="c4-armillary-seal" data-logo="mono">{v4("amlLogo")}</p>
        <div>
          <p className="c4-armillary-kicker">{v4("amlSub")}</p>
          <h2 className="c4-title">{v4("amlTitle")}</h2>
        </div>
        <ol className="c4-armillary-index" aria-label={v4("amlTitle")}>
          <li data-tone="gold">{v4("amlGilt")}</li>
          <li data-tone="ink">{v4("amlSlate")}</li>
          <li data-tone="ivory">{v4("amlPearl")}</li>
        </ol>
      </header>
      <p className="c4-armillary-links">
        <Link href={crmv4Href(base, "cty")}>{v4("ctyTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("amlCustomers")}</Link>
        <Link href={crmv4Href(base, "phn")}>{v4("amlWeek")}</Link>
      </p>
      {viewer && <p className="c4-armillary-note">{v4("amlViewer")}</p>}
      <p className="c4-armillary-lead">{v4("amlKeys")}</p>
      <p className="c4-armillary-hint">{v4("amlHint")}</p>
      <p className="c4-armillary-notice" role="status">{v4("amlNotice")} {counts.overdue}</p>
      <ol className="c4-armillary-dials" aria-label={v4("amlChart")}>
        <li><span>{v4("amlBench")}</span><strong>{counts.bench}</strong></li>
        <li><span>{v4("amlCase")}</span><strong>{counts.case}</strong></li>
        <li><span>{v4("amlChest")}</span><strong>{counts.chest}</strong></li>
        <li><span>{v4("amlLogged")}</span><strong>{counts.logged}</strong></li>
        <li><span>{v4("amlOverdue")}</span><strong>{counts.overdue}</strong></li>
        <li><span>{v4("amlEven")}</span><strong>{counts.even}</strong></li>
      </ol>
      <div className="c4-armillary-chart" aria-label={v4("amlBars")}>
        {bars.map((bar) => (
          <button key={bar.ring} type="button" className="c4-armillary-column" data-on={ringFilter === bar.ring ? "1" : "0"} onClick={() => setRingFilter(ringFilter === bar.ring ? "all" : bar.ring)}>
            <i style={{ height: `${Math.max(8, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{ringLabel(v4, bar.ring)}</span>
          </button>
        ))}
      </div>
      <ol className="c4-armillary-time" aria-label={v4("amlMeridian")}>
        {timeline.map((lane) => (
          <li key={lane.bead}><span>{lane.bead}</span><strong>{lane.titles.join(" · ")}</strong></li>
        ))}
      </ol>
      <form className="c4-armillary-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const id = `aml-${Date.now().toString(36)}`;
        store(addArmillary(cards, { id, title, note, keeper, ring, finish, ink, degree: degreeNo, bead: beadNo, tags }));
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("amlEdit")} aria-required={false} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} placeholder={v4("amlTitle")} />
        <input className="c4-field" aria-label={v4("amlNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} placeholder={v4("amlNote")} />
        <input className="c4-field" aria-label={v4("amlFair")} aria-required={false} value={keeper} disabled={viewer} onChange={(event) => setKeeper(event.target.value)} placeholder={v4("amlBlankKeeper")} />
        <select className="c4-field" aria-label={v4("amlRing")} value={ring} disabled={viewer} onChange={(event) => setRing(event.target.value)}>
          <option value="">{v4("amlBlankRing")}</option>
          {ARM_RINGS.map((item) => <option key={item} value={item}>{ringLabel(v4, item)}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("amlFinish")} value={finish} disabled={viewer} onChange={(event) => setFinish(event.target.value)}>
          <option value="">{v4("amlBlankFinish")}</option>
          {FINISHES.map((item) => <option key={item} value={item}>{finishLabel(v4, item)}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("amlTone")} value={ink} disabled={viewer} onChange={(event) => setInk(event.target.value)}>
          <option value="">{v4("amlBlankInk")}</option>
          {INKS.map((item) => <option key={item} value={item}>{inkLabel(v4, item)}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("amlDegree")} value={degreeNo} disabled={viewer} onChange={(event) => setDegreeNo(event.target.value)}>
          <option value="">{v4("amlBlankDegree")}</option>
          {DEGREES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("amlBead")} value={beadNo} disabled={viewer} onChange={(event) => setBeadNo(event.target.value)}>
          {BEADS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input className="c4-field" aria-label={v4("amlTags")} aria-required={false} value={tags} disabled={viewer} onChange={(event) => setTags(event.target.value)} placeholder={v4("amlTags")} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("amlAdd")}</button>
      </form>
      <div className="c4-armillary-tools">
        <input ref={searchRef} className="c4-field c4-armillary-search" aria-label={v4("amlSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("amlSearch")} />
        {(["bench", "case", "chest"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "bench" ? v4("amlBench") : item === "case" ? v4("amlCase") : v4("amlChest")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "air" : "tight")}>{density === "tight" ? v4("amlAir") : v4("amlTight")}</button>
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("amlHouse")}</button>
        <button type="button" className="c4-chip" data-on={keenOnly ? "1" : "0"} onClick={() => setKeenOnly((value) => !value)}>{v4("amlKeen")}</button>
        <button type="button" className="c4-chip" data-on={stillOnly ? "1" : "0"} onClick={() => setStillOnly((value) => !value)}>{v4("amlStill")}</button>
        <select className="c4-field" aria-label={v4("amlFair")} value={keeperFilter} onChange={(event) => setKeeperFilter(event.target.value)}>
          <option value="all">{v4("amlAll")}</option>
          {keepers.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("amlFinish")} value={finishFilter} onChange={(event) => setFinishFilter(event.target.value)}>
          <option value="all">{v4("amlAll")}</option>
          {FINISHES.map((item) => <option key={item} value={item}>{finishLabel(v4, item)}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("amlTone")} value={inkFilter} onChange={(event) => setInkFilter(event.target.value)}>
          <option value="all">{v4("amlAll")}</option>
          {INKS.map((item) => <option key={item} value={item}>{inkLabel(v4, item)}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("amlRing")} value={ringFilter} onChange={(event) => setRingFilter(event.target.value)}>
          <option value="all">{v4("amlAll")}</option>
          <option value="keen">{v4("amlKeen")}</option>
          <option value="still">{v4("amlStill")}</option>
          {ARM_RINGS.map((item) => <option key={item} value={item}>{ringLabel(v4, item)}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("amlDegree")} value={degreeFilter} onChange={(event) => setDegreeFilter(event.target.value)}>
          <option value="all">{v4("amlAll")}</option>
          {DEGREES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("amlBead")} value={beadFilter} onChange={(event) => setBeadFilter(event.target.value)}>
          <option value="all">{v4("amlAll")}</option>
          {BEADS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("amlRing")} value={desk} onChange={(event) => setDesk(event.target.value)}>
          {ARM_RINGS.map((item) => <option key={item} value={item}>{ringLabel(v4, item)}</option>)}
        </select>
      </div>
      <form className="c4-armillary-views" onSubmit={(event) => {
        event.preventDefault();
        if (viewer || !viewName.trim()) return;
        storeViews(addArmillaryView(views, { id: `view-${Date.now().toString(36)}`, name: viewName, tray, query, keeper: keeperFilter, finish: finishFilter, ink: inkFilter, ring: ringFilter, degree: degreeFilter, bead: beadFilter }));
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("amlViewName")} aria-required={false} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} placeholder={v4("amlViewName")} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("amlSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-armillary-view">
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("amlApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropArmillaryView(views, view.id))}>{v4("amlDropView")}</button>
          </span>
        ))}
      </form>
      {picked.length > 0 && (
        <div className="c4-armillary-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkArmillaryLog(cards, picked))}>{v4("amlBulkLog")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkArmillaryStow(cards, picked))}>{v4("amlBulkStow")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkArmillarySlate(cards, picked))}>{v4("amlBulkSlate")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkArmillaryChampagne(cards, picked))}>{v4("amlBulkChampagne")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkArmillaryTag(cards, picked, "w"))}>{v4("amlBulkTag")}</button>
        </div>
      )}
      <p className="c4-armillary-meta">{v4("amlSuggest")} {finishLabel(v4, suggested)} · {v4("amlFair")} {fair} · {v4("amlBusy")} {busy || v4("amlBlankKeeper")} · {v4("amlNeighbors")} {neighborArmCount(cards)} · {v4("amlClash")} {clashRingCount(cards)} · {v4("amlDegreeHint")} {degreeHint} · {v4("amlRingHint")} {ringLabel(v4, ringHint)}</p>
      {(reminders.length > 0 || idling.length > 0) && (
        <p className="c4-armillary-meta">{v4("amlDue")} {reminders.map((card) => card.title).join(" · ")} · {v4("amlIdle")} {idling.map((card) => card.title).join(" · ")}</p>
      )}
      {!shown.length && <p className="c4-armillary-empty">{v4("amlEmpty")}</p>}
      <ol className={sheet === "index" ? "c4-armillary-index-list" : "c4-armillary-board"} data-density={density}>
        {shown.map((card, index) => (
          <li key={card.id} className="c4-armillary-card" data-on={index === focusAt ? "1" : "0"} data-logged={card.logged ? "1" : "0"} data-overdue={overdueArmillary(card) ? "1" : "0"} data-keen={keenRing(card.ring) ? "1" : "0"} data-still={stillRing(card.ring) ? "1" : "0"} data-house={houseFinish(card.finish) ? "1" : "0"} data-brisk={briskArmillary(card) ? "1" : "0"} data-idle={idleArmillary(card) ? "1" : "0"} data-resting={restingArmillary(card) ? "1" : "0"} data-late={lateArmillary(card, desk) ? "1" : "0"} data-band={ringBand(card.ring)}>
            <ol className="c4-armillary-ticks" aria-hidden="true">
              {BEADS.map((tick) => <li key={tick} data-on={String(card.bead) === tick ? "1" : "0"} />)}
            </ol>
            <label className="c4-armillary-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => togglePick(card.id)} /></label>
            <div>
              <input className="c4-field" aria-label={v4("amlEdit")} value={card.title} disabled={viewer} onChange={(event) => store(editArmillary(cards, card.id, event.target.value))} />
              <input className="c4-field" aria-label={v4("amlEditNote")} aria-required={false} value={card.note} disabled={viewer} onChange={(event) => store(editArmillaryNote(cards, card.id, event.target.value))} />
              <p className="c4-armillary-meta">{card.keeper || v4("amlBlankKeeper")} · {ringLabel(v4, card.ring)} · {finishLabel(v4, card.finish)} · {inkLabel(v4, card.ink)} · {card.degree ?? v4("amlBlankDegree")} · {v4("amlBead")} {card.bead} · {card.tags.join(" ") || v4("amlTags")}</p>
              <p className="c4-armillary-meta">{ringLabel(v4, desk)} · {AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : v4("amlAuditSave")}</p>
              <div className="c4-armillary-tools">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setArmillaryLogged(cards, card.id, !card.logged))}>{card.logged ? v4("amlUnlog") : v4("amlLog")}</button>
                <button type="button" className="c4-btn" disabled={viewer || card.stowed} onClick={() => store(setArmillaryLock(cards, card.id, !card.locked))}>{card.locked ? v4("amlResume") : v4("amlLock")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setArmillaryStow(cards, card.id, !card.stowed))}>{card.stowed ? v4("amlOpenAgain") : v4("amlStowed")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setArmillaryStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("amlUnstar") : v4("amlStar")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleInk(cards, card.id))}>{v4("amlTone")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftDegree(cards, card.id))}>{v4("amlLift")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(dipDegree(cards, card.id))}>{v4("amlDip")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseBead(cards, card.id))}>{v4("amlRaise")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerBead(cards, card.id))}>{v4("amlLower")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setArmillaryFinish(cards, card.id, card.finish === "CHAMPAGNE" ? "graphite" : "champagne"))}>{v4("amlFinish")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addArmillaryTag(cards, card.id, "e"))}>{v4("amlTags")}</button>
                <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(armillaryCopy(card)); setCopied(card.id); }}>{copied === card.id ? v4("amlCopied") : v4("amlCopy")}</button>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <button type="button" className="c4-btn" onClick={() => { setSort(sort === "ring" ? "keeper" : "ring"); }}>{sort === "ring" ? v4("amlSortKeeper") : v4("amlSortRing")}</button>
      <button type="button" className="c4-btn" onClick={() => download("armillary-rings.csv", armillaryCsv(shown, desk))}>{v4("amlCsv")}</button>
    </section>
  );
}

const SHAPES = ["all", "house", "mark", "link", "court", "span", "seal", "open", "long", "short", "desk", "wide", "dash", "leap", "twin", "known", "echo", "even", "odd", "space", "digit", "tail", "cap"] as const;

function shapeLabel(v4: V4, item: (typeof SHAPES)[number]): string {
  if (item === "all") return v4("ctyShapeAll");
  if (item === "house") return v4("ctyShapeHouse");
  if (item === "mark") return v4("ctyShapeMark");
  if (item === "link") return v4("ctyShapeLink");
  if (item === "court") return v4("ctyShapeCourt");
  if (item === "span") return v4("ctyShapeSpan");
  if (item === "seal") return v4("ctyShapeSeal");
  if (item === "open") return v4("ctyShapeOpen");
  if (item === "long") return v4("ctyShapeLong");
  if (item === "short") return v4("ctyShapeShort");
  if (item === "desk") return v4("ctyShapeDesk");
  if (item === "wide") return v4("ctyShapeWide");
  if (item === "dash") return v4("ctyShapeDash");
  if (item === "leap") return v4("ctyShapeLeap");
  if (item === "twin") return v4("ctyShapeTwin");
  if (item === "known") return v4("ctyShapeKnown");
  if (item === "echo") return v4("ctyShapeEcho");
  if (item === "even") return v4("ctyShapeEven");
  if (item === "odd") return v4("ctyShapeOdd");
  if (item === "space") return v4("ctyShapeSpace");
  if (item === "digit") return v4("ctyShapeDigit");
  if (item === "tail") return v4("ctyShapeTail");
  return v4("ctyShapeCap");
}

export function CityPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: NameRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [shape, setShape] = useState<CityShape>("all");
  const [review, setReview] = useState<CityReview>("all");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<CityRow[]>(() => (queue.data?.users || []).map((row, index) => ({
    id: row.id ? `city-${row.id}` : `city-${index}`,
    label: textField(row.name),
    note: { lastCity: textField(row.lastCity) } satisfies CityValue,
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
    const present = presentCityLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenCities(readJson(CTY_KEY, []), present);
    const nextReviewed = readReviewedCities(readJson(CTY_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(CTY_KEY, nextHidden);
    writeJson(CTY_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentCityLanes(rows);
  const lanes = visibleCityLanes(present, hidden, showHidden);
  const shown = visibleCities(rows, lane, hue, query, review, reviewed, shape).filter((row) => {
    const token = cityLane(row.note);
    if (!token) return true;
    return showHidden || !hidden.includes(token);
  });
  const focusAt = shown.length ? focus % shown.length : 0;
  const bars = cityLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingCity(rows);
  const leadHue = leadingCityHue(rows);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveArmFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveArmFocus(index, shown.length, -1));
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
    writeJson(CTY_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(CTY_REVIEW_KEY, next);
  }
  return (
    <section className="c4-cityplate" aria-label={v4("ctyTitle")} data-plates="1" data-names={rows.length} data-role={role}>
      <header className="c4-cityplate-mast">
        <p className="c4-cityplate-seal" data-logo="mono">{v4("ctyLogo")}</p>
        <div>
          <p className="c4-cityplate-kicker">{v4("ctySub")}</p>
          <h2 className="c4-title">{v4("ctyTitle")}</h2>
        </div>
      </header>
      <ol className="c4-cityplate-index" aria-label={v4("ctyTitle")}>
        <li data-tone="gold">{v4("ctyHouse")}</li>
        <li data-tone="ink">{v4("ctyMark")}</li>
        <li data-tone="ivory">{v4("ctySpan")}</li>
        <li data-tone="mist">{v4("ctyOpen")}</li>
        <li data-tone="line">{v4("ctyShort")}</li>
      </ol>
      <p className="c4-cityplate-links">
        <Link href={crmv4Href(base, "aml")}>{v4("amlTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("amlCustomers")}</Link>
        <Link href={crmv4Href(base, "phn")}>{v4("ctyWeek")}</Link>
      </p>
      <p className="c4-cityplate-hint">{v4("ctyHint")}</p>
      {viewer && <p className="c4-cityplate-note">{v4("ctyViewer")}</p>}
      {queue.loading && <p className="c4-cityplate-meta">{v4("ctyEmpty")}</p>}
      {queue.error && <p className="c4-cityplate-meta">{queue.error}</p>}
      <ul className="c4-cityplate-kpis" aria-label={v4("ctyRules")}>
        <li><span>{v4("ctyLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("ctyUnmarked")}</strong></li>
        <li><span>{v4("ctyToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("ctyUnmarked")}</strong></li>
        <li><span>{v4("ctyShared")}</span><strong>{sharedCityCount(rows)}</strong></li>
        <li><span>{v4("ctyShare")}</span><strong>{cityShare(laneCityCount(rows, "house"), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("ctyKnown")}</span><strong>{rows.filter((row) => cityKnown(row.note)).length}</strong></li>
        <li><span>{v4("ctyTwin")}</span><strong>{rows.filter((row) => cityTwin(row.note)).length}</strong></li>
        <li><span>{v4("ctyEven")}</span><strong>{rows.filter((row) => cityStep(row.note) > 0 && cityStep(row.note) % 2 === 0).length}</strong></li>
        <li><span>{v4("ctyWords")}</span><strong>{rows.reduce((sum, row) => sum + cityGroups(row.note), 0)}</strong></li>
      </ul>
      <div className="c4-cityplate-chart" aria-label={v4("ctyRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-cityplate-column" data-on={lane === bar.lane ? "1" : "0"} data-lane={bar.lane} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ height: `${Math.max(12, Math.round((bar.count / maxBar) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{laneLabel(v4, bar.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-cityplate-tools">
        <input ref={searchRef} className="c4-field c4-cityplate-search" aria-label={v4("ctySearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("ctySearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("ctyAll") : hueLabel(v4, item)}</button>
        ))}
        {SHAPES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{shapeLabel(v4, item)}</button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("ctyAll") : item === "reviewed" ? v4("ctyReviewed") : v4("ctyUnreviewed")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("ctyShow")}</button>
      </div>
      <ul className="c4-cityplate-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleCity(hidden, item))}>{hidden.includes(item) ? v4("ctyShow") : v4("ctyHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-cityplate-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkCityReview(reviewed, picked, true))}>{v4("ctyBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkCityReview(reviewed, picked, false))}>{v4("ctyBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-cityplate-empty">{v4("ctyEmpty")}</p>}
      <ol className="c4-cityplate-board">
        {shown.map((row, index) => {
          const seen = reviewed.includes(row.id);
          return (
            <li key={row.id} className="c4-cityplate-card" data-on={index === focusAt ? "1" : "0"} data-lane={cityLane(row.note)} data-hue={cityHue(row.note)} data-reviewed={seen ? "1" : "0"} data-known={cityKnown(row.note) ? "1" : "0"}>
              <p className="c4-cityplate-stamp">{cityStamp(row.note) || "·"}</p>
              <label className="c4-cityplate-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label || row.id} onChange={() => setPicked((current) => (current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id]))} /></label>
              <div>
                <strong>{row.label || v4("ctyUnmarked")}</strong>
                <p className="c4-cityplate-meta">{laneLabel(v4, cityLane(row.note))} · {hueLabel(v4, cityHue(row.note))} · {v4("ctyStep")} {cityStep(row.note)} · {v4("ctyWords")} {cityGroups(row.note)}{cityCap(row.note) ? ` · ${v4("ctyCap")}` : ""}{cityTail(row.note) ? ` · ${v4("ctyTail")}` : ""}{cityWide(row.note) ? ` · ${v4("ctyWide")}` : ""}{cityDash(row.note) ? ` · ${v4("ctyDash")}` : ""}{cityLeap(row.note) ? ` · ${v4("ctyLeap")}` : ""}{cityEcho(row.note) ? ` · ${v4("ctyEcho")}` : ""}{citySpace(row.note) ? ` · ${v4("ctySpace")}` : ""}{cityDigit(row.note) ? ` · ${v4("ctyDigit")}` : ""}{cityTwin(row.note) ? ` · ${v4("ctyTwin")}` : ""}</p>
                <div className="c4-cityplate-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleCityReview(reviewed, row.id))}>{seen ? v4("ctyReviewed") : v4("ctyReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(cityCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("ctyCopied") : v4("ctyCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="c4-cityplate-tools">
        <button type="button" className="c4-btn" onClick={() => download("city-lanes.csv", cityLanesCsv(rows))}>{v4("ctyCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("city-rows.csv", cityRowsCsv(shown, reviewed))}>{v4("ctyRowCsv")}</button>
      </div>
    </section>
  );
}
