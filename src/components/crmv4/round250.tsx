"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  BCN_DENSITY_KEY,
  BCN_KEY,
  BCN_VIEW_KEY,
  BEACON_CIRCUITS,
  VGL_KEY,
  VGL_REVIEW_KEY,
  addBeaconSlip,
  addBeaconTag,
  addBeaconView,
  beaconBars,
  beaconCopy,
  beaconCounts,
  beaconCsv,
  beaconDensity,
  beaconKeepers,
  beaconShare,
  beaconTimeline,
  bulkBeaconArchive,
  bulkBeaconPin,
  bulkBeaconRuby,
  bulkBeaconSquall,
  bulkBeaconTag,
  bulkGlyphReview,
  busiestKeeper,
  clashCircuitCount,
  cycleFog,
  dropBeaconView,
  editBeacon,
  editBeaconNote,
  fairKeeper,
  flagFocusedSlip,
  fogFocusedSlip,
  glyphBound,
  glyphCopy,
  glyphHue,
  glyphJoin,
  glyphLane,
  glyphLanes,
  glyphLanesCsv,
  glyphNotch,
  glyphRowsCsv,
  glyphShare,
  glyphStamp,
  glyphState,
  glyphStep,
  glyphWide,
  holdFocusedSlip,
  houseGlass,
  hueGlyphCount,
  idleSlip,
  idleSlips,
  laneGlyphCount,
  lateSlip,
  leadingGlyph,
  leadingGlyphHue,
  lengthenFocusedSlip,
  lengthenSpan,
  lowerFocusedSlip,
  lowerStep,
  moveBeaconFocus,
  neighborSlipCount,
  overdueSlip,
  peakCircuit,
  pinFocusedSlip,
  presentGlyphLanes,
  quietCircuit,
  raiseFocusedSlip,
  raiseStep,
  readBeaconSlips,
  readBeaconViews,
  readHiddenGlyphs,
  readReviewedGlyphs,
  reminderSlips,
  restingSlip,
  rushSlip,
  setSlipArchive,
  setSlipFlag,
  setSlipGlass,
  setSlipHold,
  setSlipPin,
  sharedGlyphCount,
  shortenFocusedSlip,
  shortenSpan,
  sortBeacon,
  suggestGlass,
  suggestSpan,
  tagFocusedSlip,
  toggleGlyph,
  toggleGlyphReview,
  visibleBeacon,
  visibleGlyphLanes,
  visibleGlyphs,
  type BeaconSlip,
  type BeaconView,
  type GlyphReview,
  type GlyphRow,
  type GlyphShape,
  type GlyphValue,
  type SlipDensity,
  type SlipSort,
  type SlipTray,
} from "@/lib/crmv4/round250";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const GLASSES = ["clear", "amber", "ruby"] as const;
const FOGS = ["still", "haze", "squall"] as const;
const SPANS = ["15", "30", "45"] as const;
const STEPS = ["2", "4", "6", "8"] as const;

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "bcnAuditSave",
  edit: "bcnAuditEdit",
  note: "bcnAuditNote",
  fog: "bcnAuditFog",
  pin: "bcnAuditPin",
  unpin: "bcnAuditUnpin",
  hold: "bcnAuditHold",
  resume: "bcnAuditResume",
  archive: "bcnAuditArchive",
  open: "bcnAuditOpen",
  glass: "bcnAuditGlass",
  tag: "bcnAuditTag",
  step: "bcnAuditStep",
  span: "bcnAuditSpan",
  short: "bcnAuditShort",
  flag: "bcnAuditFlag",
};

const CIRCUIT_KEY: Record<string, CrmV4CopyKey> = {
  lamp: "bcnLamp",
  reef: "bcnReef",
  bar: "bcnBar",
  cove: "bcnCove",
  spit: "bcnSpit",
  head: "bcnHead",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  digit: "vglDigit",
  brief: "vglBrief",
  vowel: "vglVowel",
  twin: "vglTwin",
  split: "vglSplit",
  long: "vglLong",
  plain: "vglPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  gilt: "vglGilt",
  slate: "vglSlate",
  sand: "vglSand",
  clay: "vglClay",
  soot: "vglSoot",
  pearl: "vglPearl",
  mist: "vglMist",
};

type TraderRow = {
  id?: string;
  name?: string | null;
  validationStatus?: string | null;
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
  return typeof raw === "string" ? raw : "";
}

function circuitLabel(v4: V4, circuit: string): string {
  const key = CIRCUIT_KEY[circuit];
  return key ? v4(key) : v4("bcnBlank");
}

function glassLabel(v4: V4, glass: string): string {
  if (glass === "CLEAR" || glass === "clear") return v4("bcnClearGlass");
  if (glass === "AMBER" || glass === "amber") return v4("bcnAmber");
  if (glass === "RUBY" || glass === "ruby") return v4("bcnRuby");
  return v4("bcnBlankGlass");
}

function fogLabel(v4: V4, fog: string): string {
  if (fog === "still") return v4("bcnStill");
  if (fog === "haze") return v4("bcnHaze");
  if (fog === "squall") return v4("bcnSquall");
  return v4("bcnBlankFog");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("vglUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("vglUnmarked");
}

export function BeaconSlips({ base, v4 }: { base: string; v4: V4 }) {
  const [slips, setSlips] = useState<BeaconSlip[]>([]);
  const [views, setViews] = useState<BeaconView[]>([]);
  const [density, setDensity] = useState<SlipDensity>("airy");
  const [sort, setSort] = useState<SlipSort>("circuit");
  const [tray, setTray] = useState<SlipTray>("open");
  const [query, setQuery] = useState("");
  const [keeperFilter, setKeeperFilter] = useState("all");
  const [glassFilter, setGlassFilter] = useState("all");
  const [fogFilter, setFogFilter] = useState("all");
  const [circuitFilter, setCircuitFilter] = useState("all");
  const [spanFilter, setSpanFilter] = useState("all");
  const [stepFilter, setStepFilter] = useState("all");
  const [houseOnly, setHouseOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [desk, setDesk] = useState("reef");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [keeper, setKeeper] = useState("");
  const [circuit, setCircuit] = useState("");
  const [glass, setGlass] = useState("");
  const [fog, setFog] = useState("");
  const [spanMin, setSpanMin] = useState("");
  const [step, setStep] = useState("2");
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
    setSlips(readBeaconSlips(readJson(BCN_KEY, [])));
    setViews(readBeaconViews(readJson(BCN_VIEW_KEY, [])));
    setDensity(beaconDensity(readJson(BCN_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  const shown = sortBeacon(visibleBeacon(slips, tray, query, keeperFilter, glassFilter, fogFilter, circuitFilter, spanFilter, stepFilter, houseOnly, peakOnly, quietOnly), sort);
  const focusAt = shown.length ? focus % shown.length : 0;
  const counts = beaconCounts(slips, shown, desk);
  const timeline = beaconTimeline(slips);
  const reminders = reminderSlips(slips);
  const idling = idleSlips(slips);
  const keepers = beaconKeepers(slips);
  const bars = beaconBars(slips);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = shown.map((slip) => slip.id);
  const busy = busiestKeeper(slips);
  function store(next: BeaconSlip[]) {
    const saved = readBeaconSlips(next);
    setSlips(saved);
    writeJson(BCN_KEY, saved);
  }
  function storeViews(next: BeaconView[]) {
    const saved = readBeaconViews(next);
    setViews(saved);
    writeJson(BCN_VIEW_KEY, saved);
  }
  function storeDensity(next: SlipDensity) {
    setDensity(next);
    writeJson(BCN_DENSITY_KEY, next);
  }
  function togglePick(id: string) {
    setPicked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }
  function applyView(view: BeaconView) {
    setTray(view.tray);
    setQuery(view.query);
    setKeeperFilter(view.keeper || "all");
    setGlassFilter(view.glass);
    setFogFilter(view.fog);
    setCircuitFilter(view.circuit);
    setSpanFilter(view.span);
    setStepFilter(view.step);
  }
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setKeeper("");
        setCircuit("");
        setGlass("");
        setFog("");
        setSpanMin("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveBeaconFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveBeaconFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        if (!viewer) store(holdFocusedSlip(slips, ids, focusAt));
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        if (!viewer) store(pinFocusedSlip(slips, ids, focusAt));
        return;
      }
      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        if (!viewer) store(fogFocusedSlip(slips, ids, focusAt));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        if (!viewer) store(lengthenFocusedSlip(slips, ids, focusAt));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        if (!viewer) store(shortenFocusedSlip(slips, ids, focusAt));
        return;
      }
      if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        if (!viewer) store(tagFocusedSlip(slips, ids, focusAt, "a"));
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        if (!viewer) store(flagFocusedSlip(slips, ids, focusAt));
        return;
      }
      if (event.key === "b" || event.key === "B") {
        event.preventDefault();
        if (!viewer) store(raiseFocusedSlip(slips, ids, focusAt));
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        if (!viewer) store(lowerFocusedSlip(slips, ids, focusAt));
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
  }, [shown.length, viewer, slips, ids, focusAt]);
  return (
    <section className="c4-bcn" aria-label={v4("bcnTitle")} data-passes="1" data-desk="beacon" data-role={role} data-density={density} data-board={board}>
      <header className="c4-bcn-mast">
        <p className="c4-bcn-seal" data-logo="mono">{v4("bcnLogo")}</p>
        <div>
          <p className="c4-bcn-kicker">{v4("bcnSub")}</p>
          <h2 className="c4-title">{v4("bcnTitle")}</h2>
        </div>
        <ol className="c4-bcn-index" aria-label={v4("bcnTitle")}>
          <li data-tone="gold">{v4("bcnChampagne")}</li>
          <li data-tone="ink">{v4("bcnGraphite")}</li>
          <li data-tone="ivory">{v4("bcnIvory")}</li>
        </ol>
      </header>
      <p className="c4-bcn-links">
        <Link href={crmv4Href(base, "vgl")}>{v4("bcnGlyphs")}</Link>
        <Link href={crmv4Href(base, "packet")}>{v4("bcnPacket")}</Link>
        <Link href={crmv4Href(base, "pulse")}>{v4("bcnPulse")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("bcnCustomers")}</Link>
      </p>
      {viewer && <p className="c4-bcn-note">{v4("bcnViewer")}</p>}
      <p className="c4-bcn-lead">{v4("bcnKeys")}</p>
      <ul className="c4-bcn-kpis" aria-label={v4("bcnChart")}>
        <li><span>{v4("bcnOpen")}</span><strong>{counts.open}</strong></li>
        <li><span>{v4("bcnHeld")}</span><strong>{counts.held}</strong></li>
        <li><span>{v4("bcnArchived")}</span><strong>{counts.archived}</strong></li>
        <li><span>{v4("bcnPinned")}</span><strong>{counts.pinned}</strong></li>
        <li><span>{v4("bcnOverdue")}</span><strong>{counts.overdue}</strong></li>
        <li><span>{v4("bcnPeak")}</span><strong>{counts.peak}</strong></li>
        <li><span>{v4("bcnQuiet")}</span><strong>{counts.quiet}</strong></li>
        <li><span>{v4("bcnHouse")}</span><strong>{beaconShare(counts.house, Math.max(1, counts.open))}%</strong></li>
        <li><span>{v4("bcnIdle")}</span><strong>{counts.idle}</strong></li>
        <li><span>{v4("bcnRush")}</span><strong>{counts.rush}</strong></li>
        <li><span>{v4("bcnResting")}</span><strong>{counts.resting}</strong></li>
        <li><span>{v4("bcnSoon")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("bcnMatched")}</span><strong>{counts.matched}</strong></li>
        <li><span>{v4("bcnClash")}</span><strong>{clashCircuitCount(slips) || v4("bcnClashNone")}</strong></li>
        <li><span>{v4("bcnNeighbor")}</span><strong>{neighborSlipCount(slips)}</strong></li>
        <li><span>{v4("bcnBusiest")}</span><strong>{busy || v4("bcnBusiestNone")}</strong></li>
      </ul>
      <div className="c4-bcn-bars" aria-label={v4("bcnChart")}>
        {bars.map((bar) => (
          <div key={bar.circuit} className="c4-bcn-bar" data-circuit={bar.circuit}>
            <span>{circuitLabel(v4, bar.circuit)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      {board === "index" && (
        <ol className="c4-bcn-time" aria-label={v4("bcnTimeline")}>
          {timeline.map((lane) => (
            <li key={lane.step}><span>{v4("bcnStep")} {lane.step}</span><strong>{lane.titles.join(" · ")}</strong></li>
          ))}
          {!timeline.length && <li>{v4("bcnEmpty")}</li>}
        </ol>
      )}
      <form className="c4-bcn-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        store(addBeaconSlip(slips, { id: `bcn-${Date.now().toString(36)}`, title, note, keeper, circuit, glass, fog, span: spanMin, step, tags }));
        setTitle("");
        setNote("");
        setTags("");
        titleRef.current?.focus();
      }}>
        <label className="c4-lab"><span>{v4("bcnTitleField")}</span><input ref={titleRef} className="c4-field" aria-label={v4("bcnTitleField")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("bcnNote")}</span><input className="c4-field" aria-label={v4("bcnNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("bcnKeeper")}</span><input className="c4-field" aria-label={v4("bcnKeeper")} value={keeper} disabled={viewer} onChange={(event) => setKeeper(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("bcnCircuit")}</span>
          <select className="c4-select" aria-label={v4("bcnCircuit")} value={circuit} disabled={viewer} onChange={(event) => setCircuit(event.target.value)}>
            <option value="">{v4("bcnBlank")}</option>
            {BEACON_CIRCUITS.map((item) => <option key={item} value={item}>{circuitLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("bcnGlass")}</span>
          <select className="c4-select" aria-label={v4("bcnGlass")} value={glass} disabled={viewer} onChange={(event) => setGlass(event.target.value)}>
            <option value="">{v4("bcnBlankGlass")}</option>
            {GLASSES.map((item) => <option key={item} value={item}>{glassLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("bcnFog")}</span>
          <select className="c4-select" aria-label={v4("bcnFog")} value={fog} disabled={viewer} onChange={(event) => setFog(event.target.value)}>
            <option value="">{v4("bcnBlankFog")}</option>
            {FOGS.map((item) => <option key={item} value={item}>{fogLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("bcnSpan")}</span>
          <select className="c4-select" aria-label={v4("bcnSpan")} value={spanMin} disabled={viewer} onChange={(event) => setSpanMin(event.target.value)}>
            <option value="">{v4("bcnBlankSpan")}</option>
            {SPANS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("bcnStep")}</span>
          <select className="c4-select" aria-label={v4("bcnStep")} value={step} disabled={viewer} onChange={(event) => setStep(event.target.value)}>
            {STEPS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("bcnTags")}</span><input className="c4-field" aria-label={v4("bcnTags")} value={tags} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button className="c4-btn" type="submit" disabled={viewer}>{v4("bcnAdd")}</button>
        <button className="c4-btn" type="button" disabled={viewer} onClick={() => setKeeper(fairKeeper(slips, keeper || "Ada, Bea, Cem"))}>{v4("bcnAssign")}</button>
        <button className="c4-btn" type="button" disabled={viewer} onClick={() => setGlass(suggestGlass(slips).toLowerCase())}>{v4("bcnSuggestGlass")}</button>
        <button className="c4-btn" type="button" disabled={viewer} onClick={() => setSpanMin(String(suggestSpan(slips, new Date().getHours())))}>{v4("bcnSuggestSpan")}</button>
      </form>
      <div className="c4-bcn-tools">
        <label className="c4-lab"><span>{v4("bcnSearch")}</span><input ref={searchRef} className="c4-field c4-bcn-search" aria-label={v4("bcnSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("bcnDesk")}</span>
          <select className="c4-select" aria-label={v4("bcnDesk")} value={desk} onChange={(event) => setDesk(event.target.value)}>
            {BEACON_CIRCUITS.map((item) => <option key={item} value={item}>{circuitLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("bcnKeeper")}</span>
          <select className="c4-select" aria-label={v4("bcnKeeper")} value={keeperFilter} onChange={(event) => setKeeperFilter(event.target.value)}>
            <option value="all">{v4("bcnAll")}</option>
            {keepers.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <button type="button" className="c4-btn" onClick={() => download("beacon-slips.csv", beaconCsv(shown, desk))}>{v4("bcnCsv")}</button>
        <button type="button" className="c4-btn" aria-pressed={density === "tight"} onClick={() => storeDensity(density === "airy" ? "tight" : "airy")}>{density === "airy" ? v4("bcnDensityTight") : v4("bcnDensityAiry")}</button>
        <button type="button" className="c4-btn" onClick={() => setSort(sort === "circuit" ? "keeper" : "circuit")}>{sort === "circuit" ? v4("bcnSortKeeper") : v4("bcnSortCircuit")}</button>
        <button type="button" className="c4-btn" onClick={() => setBoard(board === "hall" ? "index" : "hall")}>{board === "hall" ? v4("bcnBoardIndex") : v4("bcnBoardHall")}</button>
      </div>
      <div className="c4-bcn-tools" role="group" aria-label={v4("bcnAll")}>
        {(["open", "held", "archived"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("bcnOpen") : item === "held" ? v4("bcnHeld") : v4("bcnArchived")}</button>
        ))}
        {GLASSES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={glassFilter === item ? "1" : "0"} onClick={() => setGlassFilter(glassFilter === item ? "all" : item)}>{glassLabel(v4, item)}</button>
        ))}
        {FOGS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={fogFilter === item ? "1" : "0"} onClick={() => setFogFilter(fogFilter === item ? "all" : item)}>{fogLabel(v4, item)}</button>
        ))}
        <button type="button" className="c4-chip" data-on={circuitFilter === "peak" ? "1" : "0"} onClick={() => setCircuitFilter(circuitFilter === "peak" ? "all" : "peak")}>{v4("bcnPeakOnly")}</button>
        <button type="button" className="c4-chip" data-on={circuitFilter === "quiet" ? "1" : "0"} onClick={() => setCircuitFilter(circuitFilter === "quiet" ? "all" : "quiet")}>{v4("bcnQuietOnly")}</button>
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("bcnHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((value) => !value)}>{v4("bcnPeak")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((value) => !value)}>{v4("bcnQuiet")}</button>
        {SPANS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={spanFilter === item ? "1" : "0"} onClick={() => setSpanFilter(spanFilter === item ? "all" : item)}>{item}</button>
        ))}
        {STEPS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={stepFilter === item ? "1" : "0"} onClick={() => setStepFilter(stepFilter === item ? "all" : item)}>{v4("bcnStep")} {item}</button>
        ))}
      </div>
      <form className="c4-bcn-tools" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        storeViews(addBeaconView(views, {
          id: `view-${Date.now().toString(36)}`,
          name: viewName,
          tray,
          query,
          keeper: keeperFilter,
          glass: glassFilter,
          fog: fogFilter,
          circuit: circuitFilter,
          span: spanFilter,
          step: stepFilter,
        }));
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("bcnViewName")}</span><input className="c4-field" aria-label={v4("bcnViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} /></label>
        <button className="c4-btn" type="submit" disabled={viewer}>{v4("bcnSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-bcn-view">
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("bcnApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropBeaconView(views, view.id))}>{v4("bcnDropView")}</button>
          </span>
        ))}
      </form>
      {picked.length > 0 && (
        <div className="c4-bcn-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBeaconPin(slips, picked))}>{v4("bcnBulkPin")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBeaconArchive(slips, picked))}>{v4("bcnBulkArchive")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBeaconSquall(slips, picked))}>{v4("bcnBulkSquall")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBeaconRuby(slips, picked, "ruby"))}>{v4("bcnBulkRuby")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBeaconTag(slips, picked, "b"))}>{v4("bcnBulkTag")}</button>
        </div>
      )}
      {(reminders.length > 0 || idling.length > 0) && (
        <p className="c4-bcn-meta">{v4("bcnDue")} {reminders.map((slip) => slip.title).join(" · ")} · {v4("bcnIdle")} {idling.map((slip) => slip.title).join(" · ")}</p>
      )}
      {!shown.length && <p className="c4-bcn-empty">{v4("bcnEmpty")}</p>}
      <ol className="c4-bcn-board" data-density={density}>
        {shown.map((slip, index) => (
          <li key={slip.id} className="c4-bcn-card" data-on={index === focusAt ? "1" : "0"} data-pinned={slip.pinned ? "1" : "0"} data-overdue={overdueSlip(slip) ? "1" : "0"} data-peak={peakCircuit(slip.circuit) ? "1" : "0"} data-quiet={quietCircuit(slip.circuit) ? "1" : "0"} data-house={houseGlass(slip.glass) ? "1" : "0"} data-rush={rushSlip(slip) ? "1" : "0"} data-idle={idleSlip(slip) ? "1" : "0"} data-resting={restingSlip(slip) ? "1" : "0"} data-late={lateSlip(slip, desk) ? "1" : "0"}>
            <label className="c4-bcn-pick"><input type="checkbox" checked={picked.includes(slip.id)} aria-label={slip.title} onChange={() => togglePick(slip.id)} /></label>
            <div>
              <input className="c4-field" aria-label={v4("bcnEdit")} value={slip.title} disabled={viewer} onChange={(event) => store(editBeacon(slips, slip.id, event.target.value))} />
              <input className="c4-field" aria-label={v4("bcnEditNote")} aria-required={false} value={slip.note} disabled={viewer} onChange={(event) => store(editBeaconNote(slips, slip.id, event.target.value))} />
              <p className="c4-bcn-meta">{slip.keeper || v4("bcnBlankKeeper")} · {circuitLabel(v4, slip.circuit)} · {glassLabel(v4, slip.glass)} · {fogLabel(v4, slip.fog)} · {slip.span ?? v4("bcnBlankSpan")} · {v4("bcnStep")} {slip.step} · {slip.tags.join(" ") || v4("bcnTags")}</p>
              <p className="c4-bcn-meta">{v4("bcnAhead")} {circuitLabel(v4, desk)} · {AUDIT_KEY[slip.audit] ? v4(AUDIT_KEY[slip.audit]) : v4("bcnAuditSave")}</p>
              <div className="c4-bcn-tools">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipPin(slips, slip.id, !slip.pinned))}>{slip.pinned ? v4("bcnUnpin") : v4("bcnPin")}</button>
                <button type="button" className="c4-btn" disabled={viewer || slip.archived} onClick={() => store(setSlipHold(slips, slip.id, !slip.held))}>{slip.held ? v4("bcnResume") : v4("bcnHold")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipArchive(slips, slip.id, !slip.archived))}>{slip.archived ? v4("bcnOpen") : v4("bcnArchive")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipFlag(slips, slip.id, !slip.flagged))}>{slip.flagged ? v4("bcnUnflag") : v4("bcnFlag")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleFog(slips, slip.id))}>{v4("bcnFog")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lengthenSpan(slips, slip.id))}>{v4("bcnLengthen")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(shortenSpan(slips, slip.id))}>{v4("bcnShorten")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseStep(slips, slip.id))}>{v4("bcnRaise")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerStep(slips, slip.id))}>{v4("bcnLower")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipGlass(slips, slip.id, slip.glass === "RUBY" ? "clear" : "ruby"))}>{v4("bcnGlass")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addBeaconTag(slips, slip.id, "a"))}>{v4("bcnTag")}</button>
                <button type="button" className="c4-btn" onClick={() => { const body = beaconCopy(slip); void navigator.clipboard.writeText(body).catch(() => undefined); setCopied(slip.id); }}>{copied === slip.id ? v4("bcnCopied") : v4("bcnCopy")}</button>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function markNote(row: TraderRow): GlyphValue {
  return { validationStatus: textField(row.validationStatus) };
}

export function ValidationGlyphs({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: TraderRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [review, setReview] = useState<GlyphReview>("all");
  const [shape, setShape] = useState<GlyphShape>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<GlyphRow[]>(() => (queue.data?.users || []).map((row, index) => ({
    id: row.id ? `trader-${row.id}` : `trader-${index}`,
    label: textField(row.name),
    note: markNote(row),
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
    const present = presentGlyphLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenGlyphs(readJson(VGL_KEY, []), present);
    const nextReviewed = readReviewedGlyphs(readJson(VGL_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(VGL_KEY, nextHidden);
    writeJson(VGL_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentGlyphLanes(rows);
  const lanes = visibleGlyphLanes(present, hidden, showHidden);
  const shown = visibleGlyphs(rows, lane, hue, query, review, reviewed, shape).filter((row) => {
    const token = glyphLane(row.note);
    if (!token) return true;
    return showHidden || !hidden.includes(token);
  });
  const focusAt = shown.length ? focus % shown.length : 0;
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveBeaconFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveBeaconFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        if (viewer) return;
        const row = shown[focusAt];
        if (!row) return;
        const next = toggleGlyphReview(reviewed, row.id);
        setReviewed(next);
        writeJson(VGL_REVIEW_KEY, next);
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        setShowHidden((value) => !value);
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        const order: GlyphShape[] = ["all", "twin", "wide", "bound", "notch", "digit", "vowel", "brief"];
        setShape((value) => order[(order.indexOf(value) + 1) % order.length]);
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown.length, viewer, shown, focusAt, reviewed]);
  const lead = leadingGlyph(rows);
  const hueLead = leadingGlyphHue(rows);
  const shared = sharedGlyphCount(rows);
  const bound = rows.filter((row) => glyphBound(row.note)).length;
  const glyphBars = glyphLanes(rows);
  const maxBar = Math.max(1, ...glyphBars.map((bar) => bar.count));
  const ids = shown.map((row) => row.id);
  const known = rows.filter((row) => glyphState(row.note) === "set").length;
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(VGL_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedGlyphs(next, rows.map((row) => row.id));
    setReviewed(saved);
    writeJson(VGL_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-vgl" aria-label={v4("vglTitle")} data-glyphs="1" data-desk="glyph" data-traders={queue.data?.users?.length ? "1" : "0"} data-role={role}>
      <header className="c4-vgl-mast">
        <p className="c4-vgl-seal" data-logo="mono">{v4("vglLogo")}</p>
        <div>
          <p className="c4-vgl-kicker">{v4("vglSub")}</p>
          <h2 className="c4-title">{v4("vglTitle")}</h2>
        </div>
        <ol className="c4-vgl-index" aria-label={v4("vglTitle")}>
          <li data-tone="gold">{v4("vglChampagne")}</li>
          <li data-tone="ink">{v4("vglGraphite")}</li>
          <li data-tone="ivory">{v4("vglIvory")}</li>
        </ol>
      </header>
      <p className="c4-vgl-links">
        <Link href={crmv4Href(base, "bcn")}>{v4("vglBeacons")}</Link>
        <Link href={crmv4Href(base, "packet")}>{v4("vglPacket")}</Link>
        <Link href={crmv4Href(base, "pulse")}>{v4("vglPulse")}</Link>
      </p>
      {viewer && <p className="c4-vgl-note">{v4("vglViewer")}</p>}
      <p className="c4-vgl-lead">{v4("vglHint")}</p>
      <ul className="c4-vgl-kpis" aria-label={v4("vglRules")}>
        <li><span>{v4("vglSet")}</span><strong>{known}</strong></li>
        <li><span>{v4("vglClear")}</span><strong>{rows.filter((row) => glyphState(row.note) === "clear").length}</strong></li>
        <li><span>{v4("vglPlain")}</span><strong>{laneGlyphCount(rows, "plain")}</strong></li>
        <li><span>{v4("vglVowel")}</span><strong>{laneGlyphCount(rows, "vowel")}</strong></li>
        <li><span>{v4("vglBrief")}</span><strong>{laneGlyphCount(rows, "brief")}</strong></li>
        <li><span>{v4("vglTwin")}</span><strong>{laneGlyphCount(rows, "twin")}</strong></li>
        <li><span>{v4("vglSplit")}</span><strong>{laneGlyphCount(rows, "split")}</strong></li>
        <li><span>{v4("vglLong")}</span><strong>{laneGlyphCount(rows, "long")}</strong></li>
        <li><span>{v4("vglDigit")}</span><strong>{laneGlyphCount(rows, "digit")}</strong></li>
        <li><span>{v4("vglWide")}</span><strong>{rows.filter((row) => glyphWide(row.note)).length}</strong></li>
        <li><span>{v4("vglNotch")}</span><strong>{rows.filter((row) => glyphNotch(row.note)).length}</strong></li>
        <li><span>{v4("vglJoin")}</span><strong>{rows.filter((row) => glyphJoin(row.note)).length}</strong></li>
        <li><span>{v4("vglShare")}</span><strong>{glyphShare(bound, Math.max(1, known))}%</strong></li>
        <li><span>{v4("vglShared")}</span><strong>{shared}</strong></li>
        <li><span>{v4("vglClay")}</span><strong>{hueGlyphCount(rows, "clay")}</strong></li>
      </ul>
      <div className="c4-vgl-bars" aria-label={v4("vglLead")}>
        {glyphBars.map((bar) => (
          <div key={bar.lane} className="c4-vgl-bar" data-lane={bar.lane}>
            <span>{laneLabel(v4, bar.lane)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <p className="c4-vgl-meta">{lead ? `${v4("vglLead")} ${laneLabel(v4, lead)}` : v4("vglEmpty")} · {hueLead ? `${v4("vglToneLead")} ${hueLabel(v4, hueLead)}` : v4("vglUnmarked")}</p>
      <div className="c4-vgl-tools">
        <label className="c4-lab"><span>{v4("vglSearch")}</span><input ref={searchRef} className="c4-field c4-vgl-search" aria-label={v4("vglSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <button type="button" className="c4-btn" onClick={() => download("validation-glyphs.csv", glyphLanesCsv(rows))}>{v4("vglCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("validation-glyph-rows.csv", glyphRowsCsv(rows, reviewed))}>{v4("vglRowCsv")}</button>
        <button type="button" className="c4-btn" aria-pressed={showHidden} onClick={() => setShowHidden((value) => !value)}>{v4("vglShow")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkGlyphReview(reviewed, ids, true))}>{v4("vglBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkGlyphReview(reviewed, ids, false))}>{v4("vglBulkClear")}</button>
      </div>
      <div className="c4-vgl-tools" role="group" aria-label={v4("vglAll")}>
        <button type="button" className="c4-chip" data-on={lane === "all" ? "1" : "0"} onClick={() => setLane("all")}>{v4("vglAll")}</button>
        {lanes.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={lane === item ? "1" : "0"} onClick={() => setLane(item)}>{laneLabel(v4, item)}</button>
        ))}
        {(["gilt", "slate", "sand", "clay", "soot", "pearl", "mist"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(hue === item ? "all" : item)}>{hueLabel(v4, item)}</button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("vglAll") : item === "reviewed" ? v4("vglReviewed") : v4("vglUnreviewed")}</button>
        ))}
        {(["all", "twin", "wide", "bound", "notch", "digit", "vowel", "brief"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>
            {item === "all" ? v4("vglShapeAll") : item === "twin" ? v4("vglShapeTwin") : item === "wide" ? v4("vglShapeWide") : item === "bound" ? v4("vglShapeBound") : item === "notch" ? v4("vglShapeNotch") : item === "digit" ? v4("vglShapeDigit") : item === "vowel" ? v4("vglShapeVowel") : v4("vglShapeBrief")}
          </button>
        ))}
      </div>
      {!shown.length && <p className="c4-vgl-empty">{v4("vglEmpty")}</p>}
      <ol className="c4-vgl-board">
        {shown.map((row, index) => {
          const current = glyphLane(row.note);
          const hueName = glyphHue(row.note);
          return (
            <li key={row.id} className="c4-vgl-card" data-on={index === focusAt ? "1" : "0"} data-lane={current || "blank"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"} data-wide={glyphWide(row.note) ? "1" : "0"} data-join={glyphJoin(row.note) ? "1" : "0"} data-notch={glyphNotch(row.note) ? "1" : "0"} data-bound={glyphBound(row.note) ? "1" : "0"}>
              <strong>{row.label || v4("vglClear")}</strong>
              <p className="c4-vgl-meta">{v4("vglCode")} {glyphStamp(row.note) || v4("vglUnmarked")} · {laneLabel(v4, current)} · {hueLabel(v4, hueName)} · {v4("vglStep")} {glyphStep(row.note)}</p>
              <div className="c4-vgl-tools">
                <button type="button" className="c4-btn" disabled={viewer || !current} onClick={() => storeHidden(toggleGlyph(hidden, current))}>{hidden.includes(current) ? v4("vglShow") : v4("vglHide")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleGlyphReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("vglReviewed") : v4("vglReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const body = glyphCopy(row.note); void navigator.clipboard.writeText(body).catch(() => undefined); setCopied(row.id); }}>{copied === row.id ? v4("vglCopied") : v4("vglCopy")}</button>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
