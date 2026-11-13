"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  FERRY_CROSSINGS,
  FRY_DENSITY_KEY,
  FRY_KEY,
  FRY_VIEW_KEY,
  RFR_KEY,
  RFR_REVIEW_KEY,
  activeCrossing,
  activeRung,
  activeSail,
  activeWait,
  activeWeather,
  addFerryPass,
  addFerryTag,
  addFerryView,
  bulkFerryArchive,
  bulkFerryGale,
  bulkFerryOak,
  bulkFerryPin,
  bulkFerryTag,
  bulkRibbonReview,
  busiestCoxswain,
  clashCrossingCount,
  crossingBand,
  cycleWeather,
  dropFerryView,
  editFerry,
  editFerryNote,
  fairCoxswain,
  ferryCopy,
  ferryCounts,
  ferryCoxswains,
  ferryCsv,
  ferryDensity,
  ferryShare,
  ferryTimeline,
  flagFocusedPass,
  holdFocusedPass,
  houseSail,
  hueRibbonCount,
  idlePass,
  idlePasses,
  laneRibbonCount,
  latePass,
  leadingRibbon,
  leadingRibbonHue,
  lengthenFocusedPass,
  lengthenWait,
  lowerFocusedPass,
  lowerRung,
  matchedPasses,
  moveFerryFocus,
  neighborPassCount,
  overduePass,
  peakCrossing,
  pinFocusedPass,
  presentRibbonLanes,
  quietCrossing,
  raiseFocusedPass,
  raiseRung,
  readFerryPasses,
  readFerryViews,
  readHiddenRibbons,
  readReviewedRibbons,
  reminderPasses,
  restingPass,
  ribbonBound,
  ribbonCopy,
  ribbonHue,
  ribbonJoin,
  ribbonLane,
  ribbonLanes,
  ribbonLanesCsv,
  ribbonNotch,
  ribbonRowsCsv,
  ribbonShare,
  ribbonStamp,
  ribbonState,
  ribbonStep,
  ribbonWide,
  rushPass,
  setPassArchive,
  setPassFlag,
  setPassHold,
  setPassPin,
  setPassRung,
  setPassSail,
  sharedRibbonCount,
  shortenFocusedPass,
  shortenWait,
  sortFerry,
  suggestSail,
  suggestWait,
  tagFocusedPass,
  toggleRibbon,
  toggleRibbonReview,
  visibleFerry,
  visibleRibbonLanes,
  visibleRibbons,
  weatherFocusedPass,
  type FerryPass,
  type FerryView,
  type PassDensity,
  type PassSort,
  type PassTray,
  type RibbonReview,
  type RibbonRow,
  type RibbonShape,
  type RibbonValue,
} from "@/lib/crmv4/round249";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const SAILS = ["canvas", "oak", "tar"] as const;
const WEATHERS = ["calm", "breeze", "gale"] as const;
const WAITS = ["12", "24", "36"] as const;
const RUNGS = ["1", "3", "5", "9"] as const;

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "fryAuditSave",
  edit: "fryAuditEdit",
  note: "fryAuditNote",
  weather: "fryAuditWeather",
  pin: "fryAuditPin",
  unpin: "fryAuditUnpin",
  hold: "fryAuditHold",
  resume: "fryAuditResume",
  archive: "fryAuditArchive",
  open: "fryAuditOpen",
  sail: "fryAuditSail",
  tag: "fryAuditTag",
  rung: "fryAuditRung",
  wait: "fryAuditWait",
  short: "fryAuditShort",
  flag: "fryAuditFlag",
};

const CROSSING_KEY: Record<string, CrmV4CopyKey> = {
  quay: "fryQuay",
  mole: "fryMole",
  pier: "fryPier",
  jetty: "fryJetty",
  slipway: "frySlipway",
  dock: "fryDock",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  twin: "rfrTwin",
  digit: "rfrDigit",
  brief: "rfrBrief",
  name: "rfrName",
  split: "rfrSplit",
  full: "rfrFull",
  mixed: "rfrMixed",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  gilt: "rfrGilt",
  slate: "rfrSlate",
  sand: "rfrSand",
  clay: "rfrClay",
  soot: "rfrSoot",
  pearl: "rfrPearl",
  mist: "rfrMist",
};

type TraderRow = {
  id?: string;
  name?: string | null;
  campaign?: string | null;
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

function crossingLabel(v4: V4, crossing: string): string {
  const key = CROSSING_KEY[crossing];
  return key ? v4(key) : v4("fryBlank");
}

function sailLabel(v4: V4, sail: string): string {
  if (sail === "CANVAS" || sail === "canvas") return v4("fryCanvas");
  if (sail === "OAK" || sail === "oak") return v4("fryOak");
  if (sail === "TAR" || sail === "tar") return v4("fryTar");
  return v4("fryBlankSail");
}

function weatherLabel(v4: V4, weather: string): string {
  if (weather === "calm") return v4("fryCalm");
  if (weather === "breeze") return v4("fryBreeze");
  if (weather === "gale") return v4("fryGale");
  return v4("fryBlankWeather");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("rfrUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("rfrUnmarked");
}

export function FerryPasses({ base, v4 }: { base: string; v4: V4 }) {
  const [passes, setPasses] = useState<FerryPass[]>([]);
  const [views, setViews] = useState<FerryView[]>([]);
  const [density, setDensity] = useState<PassDensity>("airy");
  const [sort, setSort] = useState<PassSort>("crossing");
  const [tray, setTray] = useState<PassTray>("open");
  const [query, setQuery] = useState("");
  const [coxFilter, setCoxFilter] = useState("all");
  const [sailFilter, setSailFilter] = useState("all");
  const [weatherFilter, setWeatherFilter] = useState("all");
  const [crossingFilter, setCrossingFilter] = useState("all");
  const [waitFilter, setWaitFilter] = useState("all");
  const [rungFilter, setRungFilter] = useState("all");
  const [houseOnly, setHouseOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [desk, setDesk] = useState("mole");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [coxswain, setCoxswain] = useState("");
  const [crossing, setCrossing] = useState("");
  const [sail, setSail] = useState("");
  const [weather, setWeather] = useState("");
  const [waitMin, setWaitMin] = useState("");
  const [rung, setRung] = useState("1");
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
    setPasses(readFerryPasses(readJson(FRY_KEY, [])));
    setViews(readFerryViews(readJson(FRY_VIEW_KEY, [])));
    setDensity(ferryDensity(readJson(FRY_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  const shown = sortFerry(visibleFerry(passes, tray, query, coxFilter, sailFilter, weatherFilter, crossingFilter, waitFilter, rungFilter, houseOnly, peakOnly, quietOnly), sort);
  const focusAt = shown.length ? focus % shown.length : 0;
  const counts = ferryCounts(passes, shown, desk);
  const timeline = ferryTimeline(passes);
  const reminders = reminderPasses(passes);
  const idling = idlePasses(passes);
  const coxswains = ferryCoxswains(passes);
  const ids = shown.map((pass) => pass.id);
  function store(next: FerryPass[]) {
    const saved = readFerryPasses(next);
    setPasses(saved);
    writeJson(FRY_KEY, saved);
  }
  function storeViews(next: FerryView[]) {
    const saved = readFerryViews(next);
    setViews(saved);
    writeJson(FRY_VIEW_KEY, saved);
  }
  function storeDensity(next: PassDensity) {
    setDensity(next);
    writeJson(FRY_DENSITY_KEY, next);
  }
  function togglePick(id: string) {
    setPicked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }
  function applyView(view: FerryView) {
    setTray(view.tray);
    setQuery(view.query);
    setCoxFilter(view.coxswain || "all");
    setSailFilter(view.sail);
    setWeatherFilter(view.weather);
    setCrossingFilter(view.crossing);
    setWaitFilter(view.wait);
    setRungFilter(view.rung);
  }
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setCoxswain("");
        setCrossing("");
        setSail("");
        setWeather("");
        setWaitMin("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveFerryFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveFerryFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        if (!viewer) store(holdFocusedPass(passes, ids, focusAt));
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        if (!viewer) store(pinFocusedPass(passes, ids, focusAt));
        return;
      }
      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        if (!viewer) store(weatherFocusedPass(passes, ids, focusAt));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        if (!viewer) store(lengthenFocusedPass(passes, ids, focusAt));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        if (!viewer) store(shortenFocusedPass(passes, ids, focusAt));
        return;
      }
      if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        if (!viewer) store(tagFocusedPass(passes, ids, focusAt, "a"));
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        if (!viewer) store(flagFocusedPass(passes, ids, focusAt));
        return;
      }
      if (event.key === "b" || event.key === "B") {
        event.preventDefault();
        if (!viewer) store(raiseFocusedPass(passes, ids, focusAt));
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        if (!viewer) store(lowerFocusedPass(passes, ids, focusAt));
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
  const bars = FERRY_CROSSINGS.map((item) => ({ crossing: item, count: passes.filter((pass) => !pass.archived && !pass.held && pass.crossing === item).length }));
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const suggested = suggestSail(passes);
  const suggestedWait = suggestWait(passes, new Date().getUTCHours());
  const fair = fairCoxswain(passes, coxswains.join(", "));
  const busy = busiestCoxswain(passes);
  const clash = clashCrossingCount(passes);
  const neighbors = neighborPassCount(passes);
  return (
    <section className="c4-fry" aria-label={v4("fryTitle")} data-passes="1" data-desk="ferry" data-role={role} data-density={density} data-board={board}>
      <header className="c4-fry-mast">
        <p className="c4-fry-seal" data-logo="mono">{v4("fryLogo")}</p>
        <div>
          <p className="c4-fry-kicker">{v4("frySub")}</p>
          <h2 className="c4-title">{v4("fryTitle")}</h2>
        </div>
        <ol className="c4-fry-index" aria-label={v4("fryTitle")}>
          <li data-tone="gold">{v4("fryChampagne")}</li>
          <li data-tone="ink">{v4("fryGraphite")}</li>
          <li data-tone="ivory">{v4("fryIvory")}</li>
        </ol>
      </header>
      <p className="c4-fry-links">
        <Link href={crmv4Href(base, "cmp")}>{v4("fryRibbons")}</Link>
        <Link href={crmv4Href(base, "triage")}>{v4("fryTriage")}</Link>
        <Link href={crmv4Href(base, "alerts")}>{v4("fryAlerts")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("fryCustomers")}</Link>
      </p>
      {viewer && <p className="c4-fry-note">{v4("fryViewer")}</p>}
      <p className="c4-fry-lead" role="status">{v4("fryKeys")}</p>
      {reminders.length > 0 && (
        <ul className="c4-fry-due" aria-label={v4("fryDue")}>
          {reminders.map((pass) => <li key={pass.id}>{v4("fryDue")} · {pass.title}</li>)}
        </ul>
      )}
      <ul className="c4-fry-kpis" aria-label={v4("fryChart")}>
        <li><span>{v4("fryOpen")}</span><strong>{counts.open}</strong></li>
        <li><span>{v4("fryHeld")}</span><strong>{counts.held}</strong></li>
        <li><span>{v4("fryArchived")}</span><strong>{counts.archived}</strong></li>
        <li><span>{v4("fryPinned")}</span><strong>{counts.pinned}</strong></li>
        <li><span>{v4("fryPeak")}</span><strong>{counts.peak}</strong></li>
        <li><span>{v4("fryQuiet")}</span><strong>{counts.quiet}</strong></li>
        <li><span>{v4("frySoon")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("fryHouse")}</span><strong>{counts.house}</strong></li>
        <li><span>{v4("fryFlag")}</span><strong>{counts.flagged}</strong></li>
        <li><span>{v4("fryIdle")}</span><strong>{counts.idle}</strong></li>
        <li><span>{v4("fryRush")}</span><strong>{counts.rush}</strong></li>
        <li><span>{v4("fryResting")}</span><strong>{counts.resting}</strong></li>
        <li><span>{v4("fryOverdue")}</span><strong>{counts.overdue}</strong></li>
        <li><span>{v4("fryMatched")}</span><strong>{counts.matched}</strong></li>
        <li><span>{v4("fryShare")}</span><strong>{ferryShare(counts.house, Math.max(1, counts.open))}%</strong></li>
        <li><span>{v4("fryNeighbor")}</span><strong>{neighbors}</strong></li>
      </ul>
      <div className="c4-fry-bars" aria-label={v4("fryChart")}>
        {bars.map((bar) => (
          <div key={bar.crossing} className="c4-fry-bar" data-crossing={bar.crossing}>
            <span>{crossingLabel(v4, bar.crossing)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <p className="c4-fry-meta">{busy ? `${v4("fryBusiest")} ${busy}` : v4("fryBusiestNone")} · {clash ? `${v4("fryClash")} ${clash}` : v4("fryClashNone")} · {v4("frySuggestSail")} {sailLabel(v4, suggested)} · {v4("frySuggestWait")} {suggestedWait}</p>
      {board === "index" && (
        <ol className="c4-fry-timeline" aria-label={v4("fryTimeline")}>
          {timeline.map((lane) => <li key={lane.rung}><span>{v4("fryRung")} {lane.rung}</span><strong>{lane.titles.join(" · ")}</strong></li>)}
          {!timeline.length && <li>{v4("fryEmpty")}</li>}
        </ol>
      )}
      {idling.length > 0 && <p className="c4-fry-meta">{v4("fryIdle")} · {idling.map((pass) => pass.title).join(" · ")}</p>}
      <form className="c4-fry-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        store(addFerryPass(passes, { id: `fry-${Date.now()}`, title, note, coxswain, crossing, sail, weather, wait: waitMin, rung, tags }));
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <label className="c4-lab"><span>{v4("fryTitleField")}</span><input ref={titleRef} className="c4-field" aria-label={v4("fryTitleField")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("fryNote")}</span><input className="c4-field" aria-label={v4("fryNote")} aria-required={false} value={note} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("fryCox")}</span><input className="c4-field" aria-label={v4("fryCox")} value={coxswain} onChange={(event) => setCoxswain(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("fryCrossing")}</span>
          <select className="c4-select" aria-label={v4("fryCrossing")} value={crossing} onChange={(event) => setCrossing(event.target.value)}>
            <option value="">{v4("fryBlank")}</option>
            {FERRY_CROSSINGS.map((item) => <option key={item} value={item}>{crossingLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("frySail")}</span>
          <select className="c4-select" aria-label={v4("frySail")} value={sail} onChange={(event) => setSail(event.target.value)}>
            <option value="">{v4("fryBlankSail")}</option>
            {SAILS.map((item) => <option key={item} value={item}>{sailLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("fryWeather")}</span>
          <select className="c4-select" aria-label={v4("fryWeather")} value={weather} onChange={(event) => setWeather(event.target.value)}>
            <option value="">{v4("fryBlankWeather")}</option>
            {WEATHERS.map((item) => <option key={item} value={item}>{weatherLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("fryWait")}</span>
          <select className="c4-select" aria-label={v4("fryWait")} value={waitMin} onChange={(event) => setWaitMin(event.target.value)}>
            <option value="">{v4("fryBlankWait")}</option>
            {WAITS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("fryRung")}</span>
          <select className="c4-select" aria-label={v4("fryRung")} value={rung} onChange={(event) => setRung(event.target.value)}>
            {RUNGS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("fryTags")}</span><input className="c4-field" aria-label={v4("fryTags")} value={tags} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn c4-btn-hot" disabled={viewer}>{v4("fryAdd")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setSail(suggested.toLowerCase()); setWaitMin(String(suggestedWait)); }}>{v4("frySuggestSail")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setCoxswain(fair)}>{v4("fryAssign")}</button>
      </form>
      <div className="c4-fry-tools">
        <label className="c4-lab"><span>{v4("frySearch")}</span><input ref={searchRef} className="c4-field c4-fry-search" aria-label={v4("frySearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("fryDesk")}</span>
          <select className="c4-select" aria-label={v4("fryDesk")} value={desk} onChange={(event) => setDesk(event.target.value)}>
            {FERRY_CROSSINGS.map((item) => <option key={item} value={item}>{crossingLabel(v4, item)}</option>)}
          </select>
        </label>
        <button type="button" className="c4-btn" onClick={() => download("ferry-passes.csv", ferryCsv(passes, desk))}>{v4("fryCsv")}</button>
        <button type="button" className="c4-btn" aria-pressed={density === "tight"} onClick={() => storeDensity(density === "tight" ? "airy" : "tight")}>{density === "tight" ? v4("fryDensityAiry") : v4("fryDensityTight")}</button>
        <button type="button" className="c4-btn" aria-pressed={sort === "coxswain"} onClick={() => setSort(sort === "coxswain" ? "crossing" : "coxswain")}>{sort === "coxswain" ? v4("frySortCrossing") : v4("frySortCox")}</button>
        <button type="button" className="c4-btn" aria-pressed={board === "index"} onClick={() => setBoard(board === "hall" ? "index" : "hall")}>{board === "hall" ? v4("fryBoardIndex") : v4("fryBoardHall")}</button>
      </div>
      <div className="c4-fry-tools" role="group" aria-label={v4("fryAll")}>
        {(["open", "held", "archived"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("fryOpen") : item === "held" ? v4("fryHeld") : v4("fryArchived")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={crossingFilter === "all" ? "1" : "0"} onClick={() => setCrossingFilter("all")}>{v4("fryAll")}</button>
        <button type="button" className="c4-chip" data-on={crossingFilter === "peak" ? "1" : "0"} onClick={() => setCrossingFilter("peak")}>{v4("fryPeak")}</button>
        <button type="button" className="c4-chip" data-on={crossingFilter === "quiet" ? "1" : "0"} onClick={() => setCrossingFilter("quiet")}>{v4("fryQuiet")}</button>
        {FERRY_CROSSINGS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={crossingFilter === item ? "1" : "0"} onClick={() => setCrossingFilter(item)}>{crossingLabel(v4, item)}</button>
        ))}
        {WAITS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={waitFilter === item ? "1" : "0"} onClick={() => setWaitFilter(waitFilter === item ? "all" : item)}>{item}</button>
        ))}
        {RUNGS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rungFilter === item ? "1" : "0"} onClick={() => setRungFilter(rungFilter === item ? "all" : item)}>{v4("fryRung")} {item}</button>
        ))}
        {SAILS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={sailFilter === item ? "1" : "0"} onClick={() => setSailFilter(sailFilter === item ? "all" : item)}>{sailLabel(v4, item)}</button>
        ))}
        {WEATHERS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={weatherFilter === item ? "1" : "0"} onClick={() => setWeatherFilter(weatherFilter === item ? "all" : item)}>{weatherLabel(v4, item)}</button>
        ))}
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} aria-pressed={houseOnly} onClick={() => setHouseOnly((value) => !value)}>{v4("fryHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} aria-pressed={peakOnly} onClick={() => setPeakOnly((value) => !value)}>{v4("fryPeakOnly")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} aria-pressed={quietOnly} onClick={() => setQuietOnly((value) => !value)}>{v4("fryQuietOnly")}</button>
        {coxswains.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={coxFilter === item ? "1" : "0"} onClick={() => setCoxFilter(coxFilter === item ? "all" : item)}>{item}</button>
        ))}
      </div>
      <div className="c4-fry-tools">
        <label className="c4-lab"><span>{v4("fryViewName")}</span><input className="c4-field" aria-label={v4("fryViewName")} value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => { storeViews(addFerryView(views, { id: `view-${Date.now()}`, name: viewName, tray, query, coxswain: coxFilter, sail: sailFilter, weather: weatherFilter, crossing: crossingFilter, wait: waitFilter, rung: rungFilter })); setViewName(""); }}>{v4("frySaveView")}</button>
      </div>
      <ul className="c4-fry-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("fryApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropFerryView(views, view.id))}>{v4("fryDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-fry-tools">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkFerryArchive(passes, picked))}>{v4("fryBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkFerryPin(passes, picked))}>{v4("fryBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkFerryGale(passes, picked))}>{v4("fryBulkGale")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkFerryTag(passes, picked, "a"))}>{v4("fryBulkTag")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkFerryOak(passes, picked, "oak"))}>{v4("fryBulkOak")}</button>
      </div>
      {!shown.length && <p className="c4-fry-empty">{v4("fryEmpty")}</p>}
      <ol className="c4-fry-board">
        {shown.map((pass, index) => (
          <li key={pass.id} className="c4-fry-card" data-on={index === focusAt ? "1" : "0"} data-pinned={pass.pinned ? "1" : "0"} data-flag={pass.flagged ? "1" : "0"} data-overdue={overduePass(pass) ? "1" : "0"} data-late={latePass(pass, desk) ? "1" : "0"} data-idle={idlePass(pass) ? "1" : "0"} data-rush={rushPass(pass) ? "1" : "0"} data-resting={restingPass(pass) ? "1" : "0"} data-house={houseSail(pass.sail) ? "1" : "0"} data-peak={peakCrossing(pass.crossing) ? "1" : "0"} data-quiet={quietCrossing(pass.crossing) ? "1" : "0"}>
            <label className="c4-fry-pick"><input type="checkbox" checked={picked.includes(pass.id)} onChange={() => togglePick(pass.id)} aria-label={pass.title} /></label>
            <strong>{pass.title}</strong>
            <p className="c4-fry-meta">{pass.coxswain || v4("fryBlankCox")} · {crossingLabel(v4, pass.crossing)} · {sailLabel(v4, pass.sail)} · {weatherLabel(v4, pass.weather)} · {pass.wait ?? v4("fryBlankWait")} · {v4("fryRung")} {pass.rung} · {crossingBand(pass.crossing) || v4("fryBlank")} · {pass.tags.join(" ")}</p>
            <p className="c4-fry-meta">{pass.note}</p>
            <p className="c4-fry-meta">{pass.audit ? v4(AUDIT_KEY[pass.audit] || "fryAuditSave") : v4("fryBlank")}</p>
            <div className="c4-fry-tools">
              <label className="c4-lab"><span>{v4("fryEdit")}</span><input className="c4-field" aria-label={v4("fryEdit")} defaultValue={pass.title} disabled={viewer} onBlur={(event) => store(editFerry(passes, pass.id, event.target.value))} /></label>
              <label className="c4-lab"><span>{v4("fryEditNote")}</span><input className="c4-field" aria-label={v4("fryEditNote")} aria-required={false} defaultValue={pass.note} disabled={viewer} onBlur={(event) => store(editFerryNote(passes, pass.id, event.target.value))} /></label>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPassPin(passes, pass.id, !pass.pinned))}>{pass.pinned ? v4("fryUnpin") : v4("fryPin")}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPassHold(passes, pass.id, !pass.held))}>{pass.held ? v4("fryResume") : v4("fryHold")}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPassArchive(passes, pass.id, !pass.archived))}>{pass.archived ? v4("fryOpen") : v4("fryArchive")}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleWeather(passes, pass.id))}>{v4("fryWeather")}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPassFlag(passes, pass.id, !pass.flagged))}>{pass.flagged ? v4("fryUnflag") : v4("fryFlag")}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lengthenWait(passes, pass.id))}>{v4("fryLengthen")}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(shortenWait(passes, pass.id))}>{v4("fryShorten")}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseRung(passes, pass.id))}>{v4("fryRaise")}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerRung(passes, pass.id))}>{v4("fryLower")}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addFerryTag(passes, pass.id, "b"))}>{v4("fryTag")}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPassSail(passes, pass.id, "oak"))}>{v4("fryOak")}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPassRung(passes, pass.id, "5"))}>{v4("fryRung")}</button>
              <button type="button" className="c4-btn" onClick={() => { const body = ferryCopy(pass); void navigator.clipboard.writeText(body).catch(() => undefined); setCopied(pass.id); }}>{copied === pass.id ? v4("fryCopied") : v4("fryCopy")}</button>
            </div>
          </li>
        ))}
      </ol>
      <p className="c4-fry-meta">{v4("fryAhead")} {matchedPasses(passes, desk).length} · {activeCrossing(crossingFilter)} · {activeSail(sailFilter)} · {activeWeather(weatherFilter, WEATHERS)} · {activeWait(waitFilter)} · {activeRung(rungFilter)}</p>
    </section>
  );
}

function markNote(row: TraderRow): RibbonValue {
  return { campaign: textField(row.campaign), code: textField(row.campaign) };
}

export function CampaignMarks({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: TraderRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [review, setReview] = useState<RibbonReview>("all");
  const [shape, setShape] = useState<RibbonShape>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const reviewRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  const rows = useMemo<RibbonRow[]>(() => (queue.data?.users || []).map((row, index) => ({
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
    const present = presentRibbonLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenRibbons(readJson(RFR_KEY, []), present);
    const nextReviewed = readReviewedRibbons(readJson(RFR_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(RFR_KEY, nextHidden);
    writeJson(RFR_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentRibbonLanes(rows);
  const lanes = visibleRibbonLanes(present, hidden, showHidden);
  const shown = visibleRibbons(rows, lane, hue, query, review, reviewed, shape).filter((row) => {
    const token = ribbonLane(row.note);
    if (!token) return true;
    return showHidden || !hidden.includes(token);
  });
  const focusAt = shown.length ? focus % shown.length : 0;
  useEffect(() => {
    reviewRef.current = () => {
      if (viewer) return;
      const row = shown[focusAt];
      if (!row) return;
      const next = toggleRibbonReview(reviewed, row.id);
      setReviewed(next);
      writeJson(RFR_REVIEW_KEY, next);
    };
  });
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveFerryFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveFerryFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        reviewRef.current();
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        setShowHidden((value) => !value);
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        const order: RibbonShape[] = ["all", "twin", "wide", "bound", "notch", "digit"];
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
  const lead = leadingRibbon(rows);
  const hueLead = leadingRibbonHue(rows);
  const shared = sharedRibbonCount(rows);
  const bound = rows.filter((row) => ribbonBound(row.note)).length;
  const bars = ribbonLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = shown.map((row) => row.id);
  const known = rows.filter((row) => ribbonState(row.note) === "set").length;
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(RFR_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedRibbons(next, rows.map((row) => row.id));
    setReviewed(saved);
    writeJson(RFR_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-rfr" aria-label={v4("rfrTitle")} data-ribbons="1" data-desk="ribbon" data-traders={queue.data?.users?.length ? "1" : "0"} data-role={role} data-keyed={bound ? "1" : "0"}>
      <header className="c4-rfr-mast">
        <p className="c4-rfr-seal" data-logo="mono">{v4("rfrLogo")}</p>
        <div>
          <p className="c4-rfr-kicker">{v4("rfrSub")}</p>
          <h2 className="c4-title">{v4("rfrTitle")}</h2>
        </div>
        <ol className="c4-rfr-index" aria-label={v4("rfrTitle")}>
          <li data-tone="gold">{v4("rfrChampagne")}</li>
          <li data-tone="ink">{v4("rfrGraphite")}</li>
          <li data-tone="ivory">{v4("rfrIvory")}</li>
        </ol>
      </header>
      <p className="c4-rfr-links">
        <Link href={crmv4Href(base, "fry")}>{v4("rfrFerry")}</Link>
        <Link href={crmv4Href(base, "triage")}>{v4("fryTriage")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("fryCustomers")}</Link>
      </p>
      {viewer && <p className="c4-rfr-note">{v4("rfrViewer")}</p>}
      <p className="c4-rfr-lead">{v4("rfrHint")}</p>
      <ul className="c4-rfr-kpis" aria-label={v4("rfrRules")}>
        <li><span>{v4("rfrSet")}</span><strong>{known}</strong></li>
        <li><span>{v4("rfrClear")}</span><strong>{rows.filter((row) => ribbonState(row.note) === "clear").length}</strong></li>
        <li><span>{v4("rfrTwin")}</span><strong>{laneRibbonCount(rows, "twin")}</strong></li>
        <li><span>{v4("rfrDigit")}</span><strong>{laneRibbonCount(rows, "digit")}</strong></li>
        <li><span>{v4("rfrBrief")}</span><strong>{laneRibbonCount(rows, "brief")}</strong></li>
        <li><span>{v4("rfrName")}</span><strong>{laneRibbonCount(rows, "name")}</strong></li>
        <li><span>{v4("rfrSplit")}</span><strong>{laneRibbonCount(rows, "split")}</strong></li>
        <li><span>{v4("rfrFull")}</span><strong>{laneRibbonCount(rows, "full")}</strong></li>
        <li><span>{v4("rfrMixed")}</span><strong>{laneRibbonCount(rows, "mixed")}</strong></li>
        <li><span>{v4("rfrGilt")}</span><strong>{hueRibbonCount(rows, "gilt")}</strong></li>
        <li><span>{v4("rfrNotch")}</span><strong>{rows.filter((row) => ribbonNotch(row.note)).length}</strong></li>
        <li><span>{v4("rfrWide")}</span><strong>{rows.filter((row) => ribbonWide(row.note)).length}</strong></li>
        <li><span>{v4("rfrJoin")}</span><strong>{rows.filter((row) => ribbonJoin(row.note)).length}</strong></li>
        <li><span>{v4("rfrShare")}</span><strong>{ribbonShare(bound, Math.max(1, known))}%</strong></li>
        <li><span>{v4("rfrShared")}</span><strong>{shared}</strong></li>
      </ul>
      <div className="c4-rfr-bars" aria-label={v4("rfrLead")}>
        {bars.map((bar) => (
          <div key={bar.lane} className="c4-rfr-bar" data-lane={bar.lane}>
            <span>{laneLabel(v4, bar.lane)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <p className="c4-rfr-meta">{lead ? `${v4("rfrLead")} ${laneLabel(v4, lead)}` : v4("rfrEmpty")} · {hueLead ? `${v4("rfrToneLead")} ${hueLabel(v4, hueLead)}` : v4("rfrUnmarked")}</p>
      <div className="c4-rfr-tools">
        <label className="c4-lab"><span>{v4("rfrSearch")}</span><input ref={searchRef} className="c4-field c4-rfr-search" aria-label={v4("rfrSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <button type="button" className="c4-btn" onClick={() => download("campaign-marks.csv", ribbonLanesCsv(rows))}>{v4("rfrCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("campaign-mark-rows.csv", ribbonRowsCsv(rows, reviewed))}>{v4("rfrRowCsv")}</button>
        <button type="button" className="c4-btn" aria-pressed={showHidden} onClick={() => setShowHidden((value) => !value)}>{v4("rfrShow")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkRibbonReview(reviewed, ids, true))}>{v4("rfrBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkRibbonReview(reviewed, ids, false))}>{v4("rfrBulkClear")}</button>
      </div>
      <div className="c4-rfr-tools" role="group" aria-label={v4("rfrAll")}>
        <button type="button" className="c4-chip" data-on={lane === "all" ? "1" : "0"} onClick={() => setLane("all")}>{v4("rfrAll")}</button>
        {lanes.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={lane === item ? "1" : "0"} onClick={() => setLane(item)}>{laneLabel(v4, item)}</button>
        ))}
        {(["gilt", "slate", "sand", "clay", "soot", "pearl", "mist"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(hue === item ? "all" : item)}>{hueLabel(v4, item)}</button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("rfrAll") : item === "reviewed" ? v4("rfrReviewed") : v4("rfrUnreviewed")}</button>
        ))}
        {(["all", "twin", "wide", "bound", "notch", "digit"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{item === "all" ? v4("rfrShapeAll") : item === "twin" ? v4("rfrShapeTwin") : item === "wide" ? v4("rfrShapeWide") : item === "bound" ? v4("rfrShapeBound") : item === "notch" ? v4("rfrShapeNotch") : v4("rfrShapeDigit")}</button>
        ))}
      </div>
      {!shown.length && <p className="c4-rfr-empty">{v4("rfrEmpty")}</p>}
      <ol className="c4-rfr-board">
        {shown.map((row, index) => {
          const current = ribbonLane(row.note);
          const hueName = ribbonHue(row.note);
          return (
            <li key={row.id} className="c4-rfr-card" data-on={index === focusAt ? "1" : "0"} data-lane={current || "blank"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"} data-wide={ribbonWide(row.note) ? "1" : "0"} data-join={ribbonJoin(row.note) ? "1" : "0"} data-notch={ribbonNotch(row.note) ? "1" : "0"} data-bound={ribbonBound(row.note) ? "1" : "0"}>
              <strong>{row.label || v4("rfrClear")}</strong>
              <p className="c4-rfr-meta">{v4("rfrMarkWord")} {ribbonStamp(row.note) || v4("rfrUnmarked")} · {laneLabel(v4, current)} · {hueLabel(v4, hueName)} · {v4("rfrStep")} {ribbonStep(row.note)} · {v4("rfrCode")}</p>
              <div className="c4-rfr-tools">
                <button type="button" className="c4-btn" disabled={viewer || !current} onClick={() => storeHidden(toggleRibbon(hidden, current))}>{hidden.includes(current) ? v4("rfrShow") : v4("rfrHide")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleRibbonReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("rfrReviewed") : v4("rfrReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const body = ribbonCopy(row.note); void navigator.clipboard.writeText(body).catch(() => undefined); setCopied(row.id); }}>{copied === row.id ? v4("rfrCopied") : v4("rfrCopy")}</button>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
