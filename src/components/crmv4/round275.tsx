"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  ANK_KEY,
  ANK_REVIEW_KEY,
  CBT_DENSITY_KEY,
  CBT_KEY,
  CBT_VIEW_KEY,
  CHRONO_WATCHES,
  addBeat,
  addBeatTag,
  addBeatView,
  anchorCap,
  anchorCopy,
  anchorEcho,
  anchorHue,
  anchorKnown,
  anchorLane,
  anchorLanes,
  anchorLanesCsv,
  anchorLeap,
  anchorNotch,
  anchorRowsCsv,
  anchorShare,
  anchorSlash,
  anchorStamp,
  anchorStep,
  anchorTail,
  anchorTwin,
  anchorWide,
  beatBars,
  beatCopy,
  beatCounts,
  beatCsv,
  beatDensity,
  beatKeepers,
  beatTimeline,
  briskBeat,
  bulkAnchorReview,
  bulkBeatCase,
  bulkBeatChampagne,
  bulkBeatCylinder,
  bulkBeatTag,
  bulkBeatWind,
  busiestKeeper,
  clashWatchCount,
  cycleEscapement,
  dipRate,
  dipRateFocused,
  dropBeatView,
  editBeat,
  editBeatNote,
  escapementFocused,
  fairKeeper,
  houseMetal,
  idleBeat,
  idleBeats,
  keenWatch,
  laneAnchorCount,
  lateBeat,
  leadingAnchor,
  leadingAnchorHue,
  liftRate,
  liftRateFocused,
  lockBeatFocused,
  lowerBeat,
  lowerBeatFocused,
  moveChronoFocus,
  neighborBeatCount,
  overdueBeat,
  presentAnchorLanes,
  raiseBeat,
  raiseBeatFocused,
  readBeatViews,
  readBeats,
  readHiddenAnchors,
  readReviewedAnchors,
  reminderBeats,
  restingBeat,
  setBeatCase,
  setBeatFinish,
  setBeatLock,
  setBeatStar,
  setBeatWind,
  sharedAnchorCount,
  sortBeats,
  starBeatFocused,
  stillWatch,
  suggestMetal,
  suggestRate,
  suggestWatch,
  tagBeatFocused,
  toggleAnchor,
  toggleAnchorReview,
  visibleAnchorLanes,
  visibleAnchors,
  visibleBeats,
  windBeatFocused,
  type AnchorReview,
  type AnchorRow,
  type AnchorShape,
  type AnchorValue,
  type BeatDensity,
  type BeatSort,
  type BeatTray,
  type BeatView,
  type ChronoBeat,
} from "@/lib/crmv4/round275";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const METALS = ["ivory", "graphite", "champagne"] as const;
const TRAINS = ["lever", "detent", "cylinder"] as const;
const RATES = ["0", "2", "6"] as const;
const BEATS = ["2", "4", "8", "16"] as const;

const WATCH_KEY: Record<string, CrmV4CopyKey> = {
  box: "cbtBox",
  gimbal: "cbtGimbal",
  fusee: "cbtFusee",
  rate: "cbtRateWatch",
  keen: "cbtKeenWatch",
  still: "cbtStillWatch",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "cbtAuditSave",
  edit: "cbtAuditEdit",
  note: "cbtAuditNote",
  escape: "cbtAuditEscape",
  wind: "cbtAuditWind",
  unwind: "cbtAuditUnwind",
  lock: "cbtAuditLock",
  resume: "cbtAuditResume",
  case: "cbtAuditCase",
  open: "cbtAuditOpen",
  finish: "cbtAuditFinish",
  tag: "cbtAuditTag",
  beat: "cbtAuditBeat",
  rate: "cbtAuditRate",
  dip: "cbtAuditDip",
  star: "cbtAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  quay: "ankQuay",
  loft: "ankLoft",
  hall: "ankHall",
  closet: "ankCloset",
  yard: "ankYard",
  pier: "ankPier",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "ankIvory",
  graphite: "ankGraphite",
  champagne: "ankChampagne",
};

type NameRow = {
  id?: string;
  name?: string | null;
  affiliateA?: string | null;
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

function watchLabel(v4: V4, watch: string): string {
  const key = WATCH_KEY[watch];
  return key ? v4(key) : v4("cbtBlank");
}

function finishLabel(v4: V4, finish: string): string {
  if (finish === "IVORY") return v4("cbtIvory");
  if (finish === "GRAPHITE") return v4("cbtGraphite");
  if (finish === "CHAMPAGNE") return v4("cbtChampagne");
  return v4("cbtBlankFinish");
}

function trainLabel(v4: V4, escapement: string): string {
  if (escapement === "lever") return v4("cbtLever");
  if (escapement === "detent") return v4("cbtDetent");
  if (escapement === "cylinder") return v4("cbtCylinder");
  return v4("cbtBlankEscape");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("ankUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("ankUnmarked");
}

export function ChronometerBeats({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<ChronoBeat[]>([]);
  const [views, setViews] = useState<BeatView[]>([]);
  const [tray, setTray] = useState<BeatTray>("bench");
  const [query, setQuery] = useState("");
  const [keeperFilter, setKeeperFilter] = useState("all");
  const [finishFilter, setFinishFilter] = useState("all");
  const [trainFilter, setTrainFilter] = useState("all");
  const [watchFilter, setWatchFilter] = useState("all");
  const [rateFilter, setRateFilter] = useState("all");
  const [beatFilter, setBeatFilter] = useState("all");
  const [houseOnly, setHouseOnly] = useState(false);
  const [keenOnly, setKeenOnly] = useState(false);
  const [stillOnly, setStillOnly] = useState(false);
  const [sort, setSort] = useState<BeatSort>("watch");
  const [density, setDensity] = useState<BeatDensity>("airy");
  const [sheet, setSheet] = useState<"dial" | "index">("dial");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [keeper, setKeeper] = useState("");
  const [watch, setWatch] = useState("");
  const [finish, setFinish] = useState("");
  const [escapement, setEscapement] = useState("");
  const [rateNo, setRateNo] = useState("");
  const [beatNo, setBeatNo] = useState("2");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [copied, setCopied] = useState("");
  const [desk, setDesk] = useState("box");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readBeats(readJson(CBT_KEY, [])));
    setViews(readBeatViews(readJson(CBT_VIEW_KEY, [])));
    setDensity(beatDensity(readJson(CBT_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: ChronoBeat[]) {
    setCards(next);
    writeJson(CBT_KEY, next);
  }
  function storeViews(next: BeatView[]) {
    setViews(next);
    writeJson(CBT_VIEW_KEY, next);
  }
  function storeDensity(next: BeatDensity) {
    setDensity(next);
    writeJson(CBT_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortBeats(visibleBeats(cards, tray, query, keeperFilter, finishFilter, trainFilter, watchFilter, rateFilter, beatFilter, houseOnly, keenOnly, stillOnly), sort),
    [cards, tray, query, keeperFilter, finishFilter, trainFilter, watchFilter, rateFilter, beatFilter, houseOnly, keenOnly, stillOnly, sort],
  );
  const counts = beatCounts(cards, shown, desk);
  const bars = beatBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = beatTimeline(cards);
  const keepers = beatKeepers(cards);
  const ids = shown.map((card) => card.id);
  const suggested = suggestMetal(cards);
  const fair = fairKeeper(cards, keepers.join(","));
  const busy = busiestKeeper(cards);
  const reminders = reminderBeats(cards);
  const idling = idleBeats(cards);
  const rateHint = suggestRate(cards, clock);
  const watchHint = suggestWatch(clock);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setKeeper("");
        setWatch("");
        setFinish("");
        setEscapement("");
        setRateNo("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveChronoFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveChronoFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        if (!viewer) store(windBeatFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        if (!viewer) store(lockBeatFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        if (!viewer) store(escapementFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        if (!viewer) store(liftRateFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        if (!viewer) store(dipRateFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        if (!viewer) store(tagBeatFocused(cards, ids, focusAt, "q"));
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        if (!viewer) store(starBeatFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        if (!viewer) store(raiseBeatFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "y" || event.key === "Y") {
        event.preventDefault();
        if (!viewer) store(lowerBeatFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "b" || event.key === "B") {
        event.preventDefault();
        setSheet((value) => (value === "dial" ? "index" : "dial"));
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

  function applyView(view: BeatView) {
    setTray(view.tray);
    setQuery(view.query);
    setKeeperFilter(view.keeper || "all");
    setFinishFilter(view.finish);
    setTrainFilter(view.escapement);
    setWatchFilter(view.watch);
    setRateFilter(view.rate);
    setBeatFilter(view.beat);
  }

  return (
    <section className="c4-chrono" aria-label={v4("cbtTitle")} data-cards="1" data-desk="chronometer" data-role={role} data-density={density} data-sheet={sheet}>
      <header className="c4-chrono-mast">
        <p className="c4-chrono-wheel" data-logo="mono" aria-hidden="true">
          <span>{v4("cbtLogo")}</span>
          <i />
          <b />
        </p>
        <div className="c4-chrono-mast-copy">
          <p className="c4-chrono-kicker">{v4("cbtSub")}</p>
          <h2 className="c4-title">{v4("cbtTitle")}</h2>
        </div>
        <ol className="c4-chrono-train" aria-hidden="true">
          <li>{v4("cbtLever")}</li>
          <li>{v4("cbtDetent")}</li>
          <li>{v4("cbtCylinder")}</li>
        </ol>
      </header>
      <p className="c4-chrono-links">
        <Link href={crmv4Href(base, "ank")}>{v4("cbtPlates")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("cbtCustomers")}</Link>
        <Link href={crmv4Href(base, "heatmap")}>{v4("cbtHeat")}</Link>
      </p>
      {viewer && <p className="c4-chrono-note">{v4("cbtViewer")}</p>}
      <p className="c4-chrono-lead">{v4("cbtKeys")}</p>
      <p className="c4-chrono-hint">{v4("cbtHint")}</p>
      <p className="c4-chrono-notice" role="status">{v4("cbtNotice")} {counts.overdue}</p>
      <ol className="c4-chrono-dials" aria-label={v4("cbtChart")}>
        <li><span>{v4("cbtBench")}</span><strong>{counts.bench}</strong></li>
        <li><span>{v4("cbtSafe")}</span><strong>{counts.safe}</strong></li>
        <li><span>{v4("cbtCase")}</span><strong>{counts.case}</strong></li>
        <li><span>{v4("cbtWound")}</span><strong>{counts.wound}</strong></li>
        <li><span>{v4("cbtKeen")}</span><strong>{counts.keen}</strong></li>
        <li><span>{v4("cbtStill")}</span><strong>{counts.still}</strong></li>
        <li><span>{v4("cbtSoon")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("cbtOverdue")}</span><strong>{counts.overdue}</strong></li>
      </ol>
      <ol className="c4-chrono-fusee" aria-label={v4("cbtBars")}>
        {bars.map((bar) => (
          <li key={bar.watch} data-watch={bar.watch}>
            <i style={{ height: `${Math.max(12, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{watchLabel(v4, bar.watch)}</span>
          </li>
        ))}
      </ol>
      <ol className="c4-chrono-staff" aria-label={v4("cbtTimeline")}>
        {timeline.map((lane) => (
          <li key={lane.beat}><span>{lane.beat}</span><strong>{lane.titles.join(" · ")}</strong></li>
        ))}
      </ol>
      <div className="c4-chrono-tools">
        <label className="c4-lab">
          <span>{v4("cbtDesk")}</span>
          <select className="c4-select" aria-label={v4("cbtDesk")} value={desk} onChange={(event) => setDesk(event.target.value)}>
            {CHRONO_WATCHES.map((item) => <option key={item} value={item}>{watchLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("cbtSearch")}</span>
          <input ref={searchRef} className="c4-field c4-chrono-search" aria-label={v4("cbtSearch")} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("cbtSearch")} />
        </label>
        {(["bench", "safe", "case"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "bench" ? v4("cbtBench") : item === "safe" ? v4("cbtSafe") : v4("cbtCase")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("cbtHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={keenOnly ? "1" : "0"} onClick={() => setKeenOnly((value) => !value)}>{v4("cbtKeen")}</button>
        <button type="button" className="c4-chip" data-on={stillOnly ? "1" : "0"} onClick={() => setStillOnly((value) => !value)}>{v4("cbtStill")}</button>
        <button type="button" className="c4-chip" data-on={sort === "keeper" ? "1" : "0"} onClick={() => setSort((value) => (value === "watch" ? "keeper" : "watch"))}>{sort === "keeper" ? v4("cbtSortKeeper") : v4("cbtSortWatch")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "airy" ? "tight" : "airy")}>{density === "airy" ? v4("cbtAiry") : v4("cbtTight")}</button>
        <button type="button" className="c4-chip" onClick={() => setSheet((value) => (value === "dial" ? "index" : "dial"))}>{sheet === "dial" ? v4("cbtLedger") : v4("cbtRate")}</button>
      </div>
      <div className="c4-chrono-tools">
        <select className="c4-select" aria-label={v4("cbtKeeper")} value={keeperFilter} onChange={(event) => setKeeperFilter(event.target.value)}>
          <option value="all">{v4("cbtAll")}</option>
          {keepers.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("cbtFinish")} value={finishFilter} onChange={(event) => setFinishFilter(event.target.value)}>
          <option value="all">{v4("cbtAll")}</option>
          {METALS.map((item) => <option key={item} value={item}>{finishLabel(v4, item.toUpperCase())}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("cbtEscape")} value={trainFilter} onChange={(event) => setTrainFilter(event.target.value)}>
          <option value="all">{v4("cbtAll")}</option>
          {TRAINS.map((item) => <option key={item} value={item}>{trainLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("cbtWatch")} value={watchFilter} onChange={(event) => setWatchFilter(event.target.value)}>
          <option value="all">{v4("cbtAll")}</option>
          <option value="keen">{v4("cbtKeenWatch")}</option>
          <option value="still">{v4("cbtStillWatch")}</option>
          {CHRONO_WATCHES.map((item) => <option key={item} value={item}>{watchLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("cbtRate")} value={rateFilter} onChange={(event) => setRateFilter(event.target.value)}>
          <option value="all">{v4("cbtAll")}</option>
          {RATES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("cbtBeat")} value={beatFilter} onChange={(event) => setBeatFilter(event.target.value)}>
          <option value="all">{v4("cbtAll")}</option>
          {BEATS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      <form className="c4-chrono-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addBeat(cards, { id: `cbt-${Date.now()}`, title, note, keeper, watch, finish, escapement, rate: rateNo, beat: beatNo, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <label className="c4-lab"><span>{v4("cbtTitleField")}</span><input className="c4-field" aria-label={v4("cbtTitleField")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("cbtNote")}</span><input className="c4-field" aria-label={v4("cbtNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <p className="c4-chrono-meta">{v4("cbtNoteOptional")}</p>
        <label className="c4-lab"><span>{v4("cbtKeeper")}</span><input className="c4-field" aria-label={v4("cbtKeeper")} value={keeper} disabled={viewer} onChange={(event) => setKeeper(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("cbtWatch")}</span>
          <select className="c4-select" aria-label={v4("cbtWatch")} value={watch} disabled={viewer} onChange={(event) => setWatch(event.target.value)}>
            <option value="">{v4("cbtBlank")}</option>
            {CHRONO_WATCHES.map((item) => <option key={item} value={item}>{watchLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("cbtFinish")}</span>
          <select className="c4-select" aria-label={v4("cbtFinish")} value={finish} disabled={viewer} onChange={(event) => setFinish(event.target.value)}>
            <option value="">{v4("cbtBlankFinish")}</option>
            {METALS.map((item) => <option key={item} value={item}>{finishLabel(v4, item.toUpperCase())}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("cbtEscape")}</span>
          <select className="c4-select" aria-label={v4("cbtEscape")} value={escapement} disabled={viewer} onChange={(event) => setEscapement(event.target.value)}>
            <option value="">{v4("cbtBlankEscape")}</option>
            {TRAINS.map((item) => <option key={item} value={item}>{trainLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("cbtRate")}</span>
          <select className="c4-select" aria-label={v4("cbtRate")} value={rateNo} disabled={viewer} onChange={(event) => setRateNo(event.target.value)}>
            <option value="">{v4("cbtBlankRate")}</option>
            {RATES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("cbtBeat")}</span>
          <select className="c4-select" aria-label={v4("cbtBeat")} value={beatNo} disabled={viewer} onChange={(event) => setBeatNo(event.target.value)}>
            {BEATS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("cbtTags")}</span><input className="c4-field" aria-label={v4("cbtTags")} value={tags} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("cbtAdd")}</button>
      </form>
      <form className="c4-chrono-tools" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addBeatView(views, { id: `view-${Date.now()}`, name: viewName, tray, query, keeper: keeperFilter, finish: finishFilter, escapement: trainFilter, watch: watchFilter, rate: rateFilter, beat: beatFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("cbtViewName")}</span><input className="c4-field" aria-label={v4("cbtViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("cbtSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-chrono-view">
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("cbtApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropBeatView(views, view.id))}>{v4("cbtDropView")}</button>
          </span>
        ))}
      </form>
      {picked.length > 0 && (
        <div className="c4-chrono-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBeatWind(cards, picked))}>{v4("cbtBulkWind")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBeatCase(cards, picked))}>{v4("cbtBulkCase")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBeatCylinder(cards, picked))}>{v4("cbtBulkEscape")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBeatChampagne(cards, picked))}>{v4("cbtBulkSilk")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBeatTag(cards, picked, "r"))}>{v4("cbtBulkTag")}</button>
        </div>
      )}
      <p className="c4-chrono-meta">{v4("cbtSuggest")} {finishLabel(v4, suggested)} · {v4("cbtFair")} {fair} · {v4("cbtBusy")} {busy || v4("cbtBlankKeeper")} · {v4("cbtNeighbors")} {neighborBeatCount(cards)} · {v4("cbtClash")} {clashWatchCount(cards)} · {v4("cbtRateHint")} {rateHint} · {v4("cbtWatchHint")} {watchLabel(v4, watchHint)}</p>
      {(reminders.length > 0 || idling.length > 0) && (
        <p className="c4-chrono-meta">{v4("cbtDue")} {reminders.map((card) => card.title).join(" · ")} · {v4("cbtIdle")} {idling.map((card) => card.title).join(" · ")}</p>
      )}
      {!shown.length && <p className="c4-chrono-empty">{v4("cbtEmpty")}</p>}
      <ol className={sheet === "index" ? "c4-chrono-index" : "c4-chrono-board"} data-density={density}>
        {shown.map((card, index) => {
          const sweep = card.rate === null ? 8 : Math.round((card.rate / 6) * 100);
          return (
            <li key={card.id} className="c4-chrono-card" data-on={index === focusAt ? "1" : "0"} data-wound={card.wound ? "1" : "0"} data-overdue={overdueBeat(card) ? "1" : "0"} data-keen={keenWatch(card.watch) ? "1" : "0"} data-still={stillWatch(card.watch) ? "1" : "0"} data-house={houseMetal(card.finish) ? "1" : "0"} data-brisk={briskBeat(card) ? "1" : "0"} data-idle={idleBeat(card) ? "1" : "0"} data-resting={restingBeat(card) ? "1" : "0"} data-late={lateBeat(card, desk) ? "1" : "0"}>
              <div className="c4-chrono-face" aria-hidden="true">
                <i style={{ transform: `rotate(${sweep * 1.8 - 90}deg)` }} />
                <span>{card.rate ?? "·"}</span>
              </div>
              <ol className="c4-chrono-ticks" aria-hidden="true">
                {BEATS.map((tick) => <li key={tick} data-on={String(card.beat) === tick ? "1" : "0"} />)}
              </ol>
              <label className="c4-chrono-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => togglePick(card.id)} /></label>
              <div>
                <input className="c4-field" aria-label={v4("cbtEdit")} value={card.title} disabled={viewer} onChange={(event) => store(editBeat(cards, card.id, event.target.value))} />
                <input className="c4-field" aria-label={v4("cbtEditNote")} aria-required={false} value={card.note} disabled={viewer} onChange={(event) => store(editBeatNote(cards, card.id, event.target.value))} />
                <p className="c4-chrono-meta">{card.keeper || v4("cbtBlankKeeper")} · {watchLabel(v4, card.watch)} · {finishLabel(v4, card.finish)} · {trainLabel(v4, card.escapement)} · {card.rate ?? v4("cbtBlankRate")} · {v4("cbtBeat")} {card.beat} · {card.tags.join(" ") || v4("cbtTags")}</p>
                <p className="c4-chrono-meta">{watchLabel(v4, desk)} · {AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : v4("cbtAuditSave")}</p>
                <div className="c4-chrono-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBeatWind(cards, card.id, !card.wound))}>{card.wound ? v4("cbtUnwind") : v4("cbtWind")}</button>
                  <button type="button" className="c4-btn" disabled={viewer || card.cased} onClick={() => store(setBeatLock(cards, card.id, !card.locked))}>{card.locked ? v4("cbtResume") : v4("cbtLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBeatCase(cards, card.id, !card.cased))}>{card.cased ? v4("cbtOpenAgain") : v4("cbtCased")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBeatStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("cbtUnstar") : v4("cbtStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleEscapement(cards, card.id))}>{v4("cbtEscape")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftRate(cards, card.id))}>{v4("cbtLift")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(dipRate(cards, card.id))}>{v4("cbtDip")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseBeat(cards, card.id))}>{v4("cbtRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerBeat(cards, card.id))}>{v4("cbtLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBeatFinish(cards, card.id, card.finish === "CHAMPAGNE" ? "ivory" : "champagne"))}>{v4("cbtFinish")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addBeatTag(cards, card.id, "q"))}>{v4("cbtTags")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(beatCopy(card)); setCopied(card.id); }}>{copied === card.id ? v4("cbtCopied") : v4("cbtCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <button type="button" className="c4-btn" onClick={() => download("chronometer-beats.csv", beatCsv(shown, desk))}>{v4("cbtCsv")}</button>
    </section>
  );
}

export function AnchorPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: NameRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [shape, setShape] = useState<AnchorShape>("all");
  const [review, setReview] = useState<AnchorReview>("all");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<AnchorRow[]>(() => (queue.data?.users || []).map((row, index) => ({
    id: row.id ? `name-${row.id}` : `name-${index}`,
    label: textField(row.name),
    note: { affiliateA: textField(row.affiliateA) } satisfies AnchorValue,
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
    const present = presentAnchorLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenAnchors(readJson(ANK_KEY, []), present);
    const nextReviewed = readReviewedAnchors(readJson(ANK_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(ANK_KEY, nextHidden);
    writeJson(ANK_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentAnchorLanes(rows);
  const lanes = visibleAnchorLanes(present, hidden, showHidden);
  const shown = visibleAnchors(rows, lane, hue, query, review, reviewed, shape).filter((row) => {
    const token = anchorLane(row.note);
    if (!token) return true;
    return showHidden || !hidden.includes(token);
  });
  const focusAt = shown.length ? focus % shown.length : 0;
  const bars = anchorLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingAnchor(rows);
  const leadHue = leadingAnchorHue(rows);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveChronoFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveChronoFocus(index, shown.length, -1));
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
    writeJson(ANK_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(ANK_REVIEW_KEY, next);
  }
  return (
    <section className="c4-anchor" aria-label={v4("ankTitle")} data-plates="1" data-names={rows.length} data-role={role}>
      <header className="c4-anchor-mast">
        <p className="c4-anchor-seal" data-logo="mono">{v4("ankLogo")}</p>
        <div>
          <p className="c4-anchor-kicker">{v4("ankSub")}</p>
          <h2 className="c4-title">{v4("ankTitle")}</h2>
        </div>
      </header>
      <ol className="c4-anchor-index" aria-label={v4("ankTitle")}>
        <li data-tone="gold">{v4("ankYard")}</li>
        <li data-tone="ink">{v4("ankLoft")}</li>
        <li data-tone="ivory">{v4("ankQuay")}</li>
        <li data-tone="mist">{v4("ankHall")}</li>
        <li data-tone="line">{v4("ankPier")}</li>
      </ol>
      <p className="c4-anchor-links">
        <Link href={crmv4Href(base, "cbt")}>{v4("ankBeats")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("cbtCustomers")}</Link>
        <Link href={crmv4Href(base, "heatmap")}>{v4("cbtHeat")}</Link>
      </p>
      <p className="c4-anchor-hint">{v4("ankHint")}</p>
      {viewer && <p className="c4-anchor-note">{v4("ankViewer")}</p>}
      {queue.loading && <p className="c4-anchor-meta">{v4("ankEmpty")}</p>}
      {queue.error && <p className="c4-anchor-meta">{queue.error}</p>}
      <ul className="c4-anchor-kpis" aria-label={v4("ankRules")}>
        <li><span>{v4("ankLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("ankUnmarked")}</strong></li>
        <li><span>{v4("ankToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("ankUnmarked")}</strong></li>
        <li><span>{v4("ankShared")}</span><strong>{sharedAnchorCount(rows)}</strong></li>
        <li><span>{v4("ankShare")}</span><strong>{anchorShare(laneAnchorCount(rows, "yard"), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("ankKnown")}</span><strong>{rows.filter((row) => anchorKnown(row.note)).length}</strong></li>
        <li><span>{v4("ankTwin")}</span><strong>{rows.filter((row) => anchorTwin(row.note)).length}</strong></li>
        <li><span>{v4("ankSlash")}</span><strong>{rows.filter((row) => anchorSlash(row.note)).length}</strong></li>
        <li><span>{v4("ankEcho")}</span><strong>{rows.filter((row) => anchorEcho(row.note)).length}</strong></li>
      </ul>
      <div className="c4-anchor-chart" aria-label={v4("ankRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-anchor-column" data-on={lane === bar.lane ? "1" : "0"} data-lane={bar.lane} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ height: `${Math.max(12, Math.round((bar.count / maxBar) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{laneLabel(v4, bar.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-anchor-tools">
        <input ref={searchRef} className="c4-field c4-anchor-search" aria-label={v4("ankSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("ankSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("ankAll") : hueLabel(v4, item)}</button>
        ))}
        {(["all", "quay", "loft", "hall", "closet", "yard", "pier", "wide", "notch", "leap", "slash", "twin", "known", "echo"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>
            {item === "all" ? v4("ankShapeAll") : item === "wide" ? v4("ankShapeWide") : item === "notch" ? v4("ankShapeNotch") : item === "leap" ? v4("ankShapeLeap") : item === "slash" ? v4("ankShapeSlash") : item === "twin" ? v4("ankShapeTwin") : item === "known" ? v4("ankShapeKnown") : item === "echo" ? v4("ankShapeEcho") : laneLabel(v4, item)}
          </button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("ankAll") : item === "reviewed" ? v4("ankReviewed") : v4("ankUnreviewed")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("ankShow")}</button>
      </div>
      <ul className="c4-anchor-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleAnchor(hidden, item))}>{hidden.includes(item) ? v4("ankShow") : v4("ankHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-anchor-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkAnchorReview(reviewed, picked, true))}>{v4("ankBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkAnchorReview(reviewed, picked, false))}>{v4("ankBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-anchor-empty">{v4("ankEmpty")}</p>}
      <ol className="c4-anchor-board">
        {shown.map((row, index) => {
          const seen = reviewed.includes(row.id);
          return (
            <li key={row.id} className="c4-anchor-card" data-on={index === focusAt ? "1" : "0"} data-lane={anchorLane(row.note)} data-hue={anchorHue(row.note)} data-reviewed={seen ? "1" : "0"} data-known={anchorKnown(row.note) ? "1" : "0"}>
              <p className="c4-anchor-stamp">{anchorStamp(row.note) || "·"}</p>
              <label className="c4-anchor-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label || row.id} onChange={() => setPicked((current) => (current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id]))} /></label>
              <div>
                <strong>{row.label || v4("ankUnmarked")}</strong>
                <p className="c4-anchor-meta">{laneLabel(v4, anchorLane(row.note))} · {hueLabel(v4, anchorHue(row.note))} · {v4("ankStep")} {anchorStep(row.note)}{anchorCap(row.note) ? ` · ${v4("ankCap")}` : ""}{anchorTail(row.note) ? ` · ${v4("ankTail")}` : ""}{anchorWide(row.note) ? ` · ${v4("ankWide")}` : ""}{anchorNotch(row.note) ? ` · ${v4("ankNotch")}` : ""}{anchorLeap(row.note) ? ` · ${v4("ankLeap")}` : ""}</p>
                <div className="c4-anchor-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleAnchorReview(reviewed, row.id))}>{seen ? v4("ankReviewed") : v4("ankReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(anchorCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("ankCopied") : v4("ankCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="c4-anchor-tools">
        <button type="button" className="c4-btn" onClick={() => download("anchor-lanes.csv", anchorLanesCsv(rows))}>{v4("ankCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("anchor-rows.csv", anchorRowsCsv(shown, reviewed))}>{v4("ankRowCsv")}</button>
      </div>
    </section>
  );
}
