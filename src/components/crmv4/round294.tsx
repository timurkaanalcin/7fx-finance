"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  LTC_KEY,
  LTC_REVIEW_KEY,
  TORQUETUM_ALTITUDES,
  TRQ_DENSITY_KEY,
  TRQ_KEY,
  TRQ_VIEW_KEY,
  addTorquetum,
  addTorquetumTag,
  addTorquetumView,
  airFocused,
  briskTorquetum,
  bulkLatchReview,
  bulkTorquetumChest,
  bulkTorquetumScribe,
  bulkTorquetumSquall,
  bulkTorquetumTag,
  busiestArcScribe,
  cycleAir,
  dropTorquetumView,
  editTorquetum,
  editTorquetumNote,
  fairArcScribe,
  idleTorquetum,
  innerAltitude,
  laneLatchCount,
  lateTorquetum,
  latchAhead,
  latchCopy,
  latchDust,
  latchEvening,
  latchEven,
  latchFirst,
  latchHeld,
  latchHue,
  latchLane,
  latchLanes,
  latchLanesCsv,
  latchLeap,
  latchMark,
  latchMinutes,
  latchMorning,
  latchOpen,
  latchRowsCsv,
  latchShare,
  latchSoon,
  latchSpace,
  latchSpark,
  latchStamp,
  latchStep,
  latchTail,
  latchToday,
  latchTwin,
  latchWeekday,
  latchWeekend,
  leadingLatch,
  leadingLatchHue,
  liftDegreeFocused,
  lowerDegreeFocused,
  lowerToothFocused,
  moveTorquetumFocus,
  outerAltitude,
  overdueTorquetum,
  presentLatchLanes,
  raiseToothFocused,
  readHiddenLatch,
  readReviewedLatch,
  readTorquetumViews,
  readTorquetums,
  reminderTorquetums,
  restingTorquetum,
  scribeTorquetumFocused,
  setTorquetumAir,
  setTorquetumChest,
  setTorquetumScribed,
  setTorquetumSleeve,
  setTorquetumStar,
  sleeveTorquetumFocused,
  sortTorquetums,
  starTorquetumFocused,
  suggestAltitude,
  suggestDegree,
  suggestTorquetumAir,
  tagTorquetumFocused,
  toggleLatch,
  toggleLatchReview,
  torquetumBars,
  torquetumCopy,
  torquetumCounts,
  torquetumCsv,
  torquetumDensity,
  torquetumScribes,
  torquetumTimeline,
  visibleLatch,
  visibleLatchLanes,
  visibleTorquetums,
  type LatchReview,
  type LatchRow,
  type LatchShape,
  type LatchValue,
  type Torquetum,
  type TorquetumDensity,
  type TorquetumSort,
  type TorquetumTray,
  type TorquetumView,
} from "@/lib/crmv4/round294";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type LockedRow = { id?: string; name?: string | null; loginBlockedAt?: string | null };

const AIRS = ["STILL", "HAZE", "SQUALL"] as const;
const DEGREES = ["15", "30", "45"] as const;
const TEETH = ["1", "3", "5"] as const;
const SHAPES: LatchShape[] = ["all", "spark", "day", "fortnight", "season", "dust", "ahead", "open", "soon", "today", "weekday", "weekend", "morning", "evening", "leap", "first", "even", "twin", "tail", "mark", "space", "held"];

const ALTITUDE_KEY: Record<string, CrmV4CopyKey> = {
  low: "trqLow",
  mid: "trqMid",
  high: "trqHigh",
  zenith: "trqZenith",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "trqAuditSave",
  edit: "trqAuditEdit",
  note: "trqAuditNote",
  air: "trqAuditAir",
  scribe: "trqAuditScribe",
  unscribe: "trqAuditUnscribe",
  sleeve: "trqAuditSleeve",
  resume: "trqAuditResume",
  chest: "trqAuditChest",
  open: "trqAuditOpen",
  tag: "trqAuditTag",
  tooth: "trqAuditTooth",
  degree: "trqAuditDegree",
  lower: "trqAuditLower",
  star: "trqAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  spark: "lbpSpark",
  day: "lbpDay",
  fortnight: "lbpFortnight",
  season: "lbpSeason",
  dust: "lbpDust",
  ahead: "lbpAhead",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "lbpIvory",
  graphite: "lbpGraphite",
  champagne: "lbpChampagne",
};

const SHAPE_KEY: Record<LatchShape, CrmV4CopyKey> = {
  all: "lbpShapeAll",
  spark: "lbpShapeSpark",
  day: "lbpShapeDay",
  fortnight: "lbpShapeFortnight",
  season: "lbpShapeSeason",
  dust: "lbpShapeDust",
  ahead: "lbpShapeAhead",
  open: "lbpShapeOpen",
  soon: "lbpShapeSoon",
  today: "lbpShapeToday",
  weekday: "lbpShapeWeekday",
  weekend: "lbpShapeWeekend",
  morning: "lbpShapeMorning",
  evening: "lbpShapeEvening",
  leap: "lbpShapeLeap",
  first: "lbpShapeFirst",
  even: "lbpShapeEven",
  twin: "lbpShapeTwin",
  tail: "lbpShapeTail",
  mark: "lbpShapeMark",
  space: "lbpShapeSpace",
  held: "lbpShapeHeld",
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

function altitudeLabel(v4: V4, altitude: string): string {
  const key = ALTITUDE_KEY[altitude];
  return key ? v4(key) : v4("trqBlankAltitude");
}

function airLabel(v4: V4, air: string): string {
  if (air === "STILL") return v4("trqStill");
  if (air === "HAZE") return v4("trqHaze");
  if (air === "SQUALL") return v4("trqSquall");
  return v4("trqAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("lbpUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("lbpUnmarked");
}

export function TorquetumArcs({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Torquetum[]>([]);
  const [views, setViews] = useState<TorquetumView[]>([]);
  const [density, setDensity] = useState<TorquetumDensity>("wide");
  const [tray, setTray] = useState<TorquetumTray>("arc");
  const [query, setQuery] = useState("");
  const [scribeFilter, setScribeFilter] = useState("");
  const [airFilter, setAirFilter] = useState("all");
  const [altitudeFilter, setAltitudeFilter] = useState("all");
  const [degreeFilter, setDegreeFilter] = useState("all");
  const [toothFilter, setToothFilter] = useState("all");
  const [sort, setSort] = useState<TorquetumSort>("altitude");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [scribe, setScribe] = useState("");
  const [altitude, setAltitude] = useState("");
  const [air, setAir] = useState("");
  const [degreeNo, setDegreeNo] = useState("");
  const [toothNo, setToothNo] = useState("");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [desk, setDesk] = useState("low");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readTorquetums(readJson(TRQ_KEY, [])));
    setViews(readTorquetumViews(readJson(TRQ_VIEW_KEY, [])));
    setDensity(torquetumDensity(readJson(TRQ_DENSITY_KEY, "wide")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Torquetum[]) {
    setCards(next);
    writeJson(TRQ_KEY, next);
  }
  function storeViews(next: TorquetumView[]) {
    setViews(next);
    writeJson(TRQ_VIEW_KEY, next);
  }
  function storeDensity(next: TorquetumDensity) {
    setDensity(next);
    writeJson(TRQ_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortTorquetums(visibleTorquetums(cards, tray, query, scribeFilter, airFilter, altitudeFilter, degreeFilter, toothFilter), sort),
    [cards, tray, query, scribeFilter, airFilter, altitudeFilter, degreeFilter, toothFilter, sort],
  );
  const counts = torquetumCounts(cards, shown, desk);
  const bars = torquetumBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = torquetumTimeline(cards);
  const scribes = torquetumScribes(cards);
  const ids = shown.map((card) => card.id);
  const suggested = suggestTorquetumAir(cards);
  const fair = fairArcScribe(cards, scribes.join(","));
  const busy = busiestArcScribe(cards);
  const reminders = reminderTorquetums(cards);
  const degreeHint = suggestDegree(cards, clock);
  const altitudeHint = suggestAltitude(clock);
  const focused = shown[focusAt];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setScribe("");
        setAltitude("");
        setAir("");
        setDegreeNo("");
        setToothNo("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveTorquetumFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveTorquetumFocus(index, shown.length, -1));
        return;
      }
      if (viewer) return;
      const id = shown[focusAt]?.id || "";
      if (event.key === "q" || event.key === "Q") {
        event.preventDefault();
        store(liftDegreeFocused(cards, id));
        return;
      }
      if (event.key === "v" || event.key === "V") {
        event.preventDefault();
        store(setTorquetumChest(cards, id, !shown[focusAt]?.chested));
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        store(airFocused(cards, id));
        return;
      }
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        store(sleeveTorquetumFocused(cards, id));
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        store(scribeTorquetumFocused(cards, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("torquetum-arcs.csv", torquetumCsv(shown, desk));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        store(starTorquetumFocused(cards, id));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        store(raiseToothFocused(cards, id));
        return;
      }
      if (event.key === "y" || event.key === "Y") {
        event.preventDefault();
        store(lowerToothFocused(cards, id));
        return;
      }
      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        store(lowerDegreeFocused(cards, id));
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cards, desk, focusAt, shown, viewer]);

  return (
    <section className="c4-torquetum" aria-label={v4("trqTitle")} data-cards="1" data-desk={tray} data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-torquetum-mast">
        <p className="c4-torquetum-seal" data-logo="mono">{v4("trqLogo")}</p>
        <div>
          <p className="c4-torquetum-kicker">{v4("trqSub")}</p>
          <h2 className="c4-title">{v4("trqTitle")}</h2>
        </div>
        <ol className="c4-torquetum-index" aria-label={v4("trqTitle")}>
          <li data-tone="gold">{v4("trqSquall")}</li>
          <li data-tone="ink">{v4("trqHaze")}</li>
          <li data-tone="ivory">{v4("trqStill")}</li>
        </ol>
      </header>
      <p className="c4-torquetum-links">
        <Link href={crmv4Href(base, "lbp")}>{v4("lbpTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("trqCustomers")}</Link>
        <Link href={crmv4Href(base, "statusbanner")}>{v4("bnCourtKicker")}</Link>
      </p>
      <p className="c4-torquetum-hint">{v4("trqHint")}</p>
      {viewer && <p className="c4-torquetum-note">{v4("trqViewer")}</p>}
      {counts.overdue > 0 && <p className="c4-torquetum-notice" role="status">{v4("trqOverdue")} {counts.overdue}</p>}
      <ol className="c4-torquetum-dials" aria-label={v4("trqChart")}>
        <li><span>{v4("trqArc")}</span><strong>{counts.arc}</strong></li>
        <li><span>{v4("trqSleeve")}</span><strong>{counts.sleeve}</strong></li>
        <li><span>{v4("trqChest")}</span><strong>{counts.chest}</strong></li>
        <li><span>{v4("trqOverdue")}</span><strong>{counts.overdue}</strong></li>
        <li><span>{v4("trqIdle")}</span><strong>{counts.idle}</strong></li>
        <li><span>{v4("trqBrisk")}</span><strong>{counts.brisk}</strong></li>
        <li><span>{v4("trqFair")}</span><strong>{fair || "·"}</strong></li>
        <li><span>{v4("trqBusy")}</span><strong>{busy || "·"}</strong></li>
      </ol>
      <div className="c4-torquetum-chart" aria-label={v4("trqChart")}>
        {bars.map((bar) => (
          <button key={bar.altitude} type="button" className="c4-torquetum-column" data-on={altitudeFilter === bar.altitude ? "1" : "0"} data-altitude={bar.altitude} onClick={() => setAltitudeFilter(altitudeFilter === bar.altitude ? "all" : bar.altitude)}>
            <i style={{ height: `${Math.max(8, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{altitudeLabel(v4, bar.altitude)}</span>
          </button>
        ))}
      </div>
      <div className="c4-torquetum-tools">
        <input ref={searchRef} className="c4-field c4-torquetum-search" aria-label={v4("trqSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("trqSearch")} />
        {(["arc", "sleeve", "chest"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "arc" ? "trqArc" : item === "sleeve" ? "trqSleeve" : "trqChest")}</button>
        ))}
        {(["all", "inner", "outer", ...TORQUETUM_ALTITUDES] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={altitudeFilter === item ? "1" : "0"} onClick={() => setAltitudeFilter(item)}>{item === "all" ? v4("trqAll") : item === "inner" ? v4("trqInner") : item === "outer" ? v4("trqOuter") : altitudeLabel(v4, item)}</button>
        ))}
        {["all", ...AIRS].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={airFilter === item ? "1" : "0"} onClick={() => setAirFilter(item)}>{item === "all" ? v4("trqAir") : airLabel(v4, item)}</button>
        ))}
        {["all", ...DEGREES].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={degreeFilter === item ? "1" : "0"} onClick={() => setDegreeFilter(item)}>{item === "all" ? v4("trqDegree") : item}</button>
        ))}
        {["all", ...TEETH].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={toothFilter === item ? "1" : "0"} onClick={() => setToothFilter(item)}>{item === "all" ? v4("trqTooth") : item}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "scribe" ? "1" : "0"} onClick={() => setSort(sort === "altitude" ? "scribe" : "altitude")}>{sort === "altitude" ? v4("trqSortAltitude") : v4("trqSortScribe")}</button>
        <button type="button" className="c4-chip" data-on={density === "narrow" ? "1" : "0"} onClick={() => storeDensity(density === "wide" ? "narrow" : "wide")}>{density === "wide" ? v4("trqWide") : v4("trqNarrow")}</button>
        <button type="button" className="c4-btn" onClick={() => download("torquetum-arcs.csv", torquetumCsv(shown, desk))}>{v4("trqCsv")}</button>
      </div>
      <div className="c4-torquetum-tools" role="group" aria-label={v4("trqDesk")}>
        {TORQUETUM_ALTITUDES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={desk === item ? "1" : "0"} onClick={() => setDesk(item)}>{v4("trqDesk")} {altitudeLabel(v4, item)}</button>
        ))}
        <span className="c4-torquetum-meta">{v4("trqSuggest")} {airLabel(v4, suggested)} · {degreeHint} · {altitudeLabel(v4, altitudeHint)}</span>
      </div>
      <form className="c4-torquetum-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addTorquetum(cards, { title, note, scribe, altitude, air: air || suggested, degree: degreeNo, tooth: toothNo, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("trqEdit")} aria-required={false} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} placeholder={v4("trqTitle")} />
        <input className="c4-field" aria-label={v4("trqNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} placeholder={v4("trqNote")} />
        <input className="c4-field" aria-label={v4("trqScribeName")} aria-required={false} value={scribe} disabled={viewer} onChange={(event) => setScribe(event.target.value)} placeholder={v4("trqScribeName")} />
        <select className="c4-select" aria-label={v4("trqAltitude")} value={altitude} disabled={viewer} onChange={(event) => setAltitude(event.target.value)}>
          <option value="">{v4("trqBlankAltitude")}</option>
          {TORQUETUM_ALTITUDES.map((item) => <option key={item} value={item}>{altitudeLabel(v4, item)}</option>)}
        </select>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("trqAdd")}</button>
      </form>
      <form className="c4-torquetum-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addTorquetumView(views, { id: `v${Date.now().toString(36)}`, name: viewName, tray, query, scribe: scribeFilter, air: airFilter, altitude: altitudeFilter, degree: degreeFilter, tooth: toothFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("trqViewName")} aria-required={false} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} placeholder={v4("trqViewName")} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("trqSaveView")}</button>
      </form>
      <ul className="c4-torquetum-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setScribeFilter(view.scribe); setAirFilter(view.air); setAltitudeFilter(view.altitude); setDegreeFilter(view.degree); setToothFilter(view.tooth); }}>{v4("trqApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropTorquetumView(views, view.id))}>{v4("trqDrop")}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-torquetum-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkTorquetumSquall(cards, picked))}>{v4("trqBulkSquall")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkTorquetumScribe(cards, picked))}>{v4("trqBulkScribe")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkTorquetumChest(cards, picked))}>{v4("trqBulkChest")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkTorquetumTag(cards, picked))}>{v4("trqBulkTag")}</button>
        </div>
      )}
      <p className="c4-torquetum-meta">{v4("trqKeys")} · j k n l g v s f q u y x /</p>
      {timeline.length > 0 && (
        <ol className="c4-torquetum-time" aria-label={v4("trqTimeline")}>
          {timeline.map((lane) => (
            <li key={lane.degree}><span>{v4("trqDegree")} {lane.degree}</span><strong>{lane.titles.join(" · ")}</strong></li>
          ))}
        </ol>
      )}
      {reminders.length > 0 && <p className="c4-torquetum-meta">{v4("trqRemind")} {reminders.join(" · ")}</p>}
      {!shown.length && <p className="c4-torquetum-empty">{v4("trqEmpty")}</p>}
      <ol className="c4-torquetum-board">
        {shown.map((card, index) => {
          const on = index === focusAt;
          return (
            <li key={card.id} className="c4-torquetum-card" data-on={on ? "1" : "0"} data-overdue={overdueTorquetum(card) ? "1" : "0"} data-idle={idleTorquetum(card) ? "1" : "0"} data-brisk={briskTorquetum(card) ? "1" : "0"} data-resting={restingTorquetum(card) ? "1" : "0"} data-late={lateTorquetum(card, desk) ? "1" : "0"} data-outer={outerAltitude(card.altitude) ? "1" : "0"} data-inner={innerAltitude(card.altitude) ? "1" : "0"} data-star={card.flagged ? "1" : "0"}>
              <label className="c4-torquetum-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => setPicked((current) => (current.includes(card.id) ? current.filter((item) => item !== card.id) : [...current, card.id]))} /></label>
              <div>
                {on && !viewer ? (
                  <input className="c4-field" aria-label={v4("trqEdit")} aria-required={false} value={card.title} onChange={(event) => store(editTorquetum(cards, card.id, event.target.value))} />
                ) : (
                  <strong>{card.title}</strong>
                )}
                <p className="c4-torquetum-meta">{card.scribe || v4("trqScribeName")} · {altitudeLabel(v4, card.altitude)} · {airLabel(v4, card.air)} · {card.degree ?? "·"} · {v4("trqTooth")} {card.tooth}{card.tags.length ? ` · ${card.tags.join("")}` : ""}{card.audit ? ` · ${AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : card.audit}` : ""}</p>
                {on && !viewer ? (
                  <input className="c4-field" aria-label={v4("trqNote")} aria-required={false} value={card.note} onChange={(event) => store(editTorquetumNote(cards, card.id, event.target.value))} />
                ) : (
                  card.note && <p className="c4-torquetum-meta">{card.note}</p>
                )}
                <div className="c4-torquetum-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTorquetumScribed(cards, card.id, !card.scribed))}>{card.scribed ? v4("trqUnscribe") : v4("trqScribe")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTorquetumSleeve(cards, card.id, !card.sleeved))}>{card.sleeved ? v4("trqUnlock") : v4("trqSleeveIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTorquetumChest(cards, card.id, !card.chested))}>{card.chested ? v4("trqUnstow") : v4("trqStow")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTorquetumStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("trqUnstar") : v4("trqStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTorquetumAir(cards, card.id, cycleAir(card.air)))}>{v4("trqAir")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftDegreeFocused(cards, card.id))}>{v4("trqLift")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDegreeFocused(cards, card.id))}>{v4("trqLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseToothFocused(cards, card.id))}>{v4("trqTooth")}+</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerToothFocused(cards, card.id))}>{v4("trqTooth")}−</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addTorquetumTag(cards, card.id, "a"))}>{v4("trqTag")} a</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(tagTorquetumFocused(cards, card.id))}>{v4("trqTag")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(torquetumCopy(card)); }}>{v4("lbpCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="c4-torquetum-meta">{v4("trqMatched")} {counts.matched} · {ids.length}</p>
    </section>
  );
}

export function LatchPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: LockedRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<LatchShape>("all");
  const [review, setReview] = useState<LatchReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const now = Date.now();

  useEffect(() => {
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  const rows = useMemo<LatchRow[]>(() => {
    return (queue.data?.users || []).map((row, index) => ({
      id: textField(row.id) || `c${index}`,
      label: textField(row.name),
      blocked: { loginBlockedAt: textField(row.loginBlockedAt) } satisfies LatchValue,
    }));
  }, [queue.data]);

  useEffect(() => {
    const ids = rows.map((row) => row.id);
    const clock = Date.now();
    setHidden(readHiddenLatch(readJson(LTC_KEY, []), presentLatchLanes(rows, clock)));
    setReviewed(readReviewedLatch(readJson(LTC_REVIEW_KEY, []), ids));
  }, [rows]);

  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(LTC_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(LTC_REVIEW_KEY, next);
  }

  const lanes = visibleLatchLanes(presentLatchLanes(rows, now), hidden, showHidden);
  const shown = visibleLatch(rows, lane, hue, query, review, reviewed, shape, now).filter((row) => !hidden.includes(latchLane(row.blocked, now)) || showHidden);
  const bars = latchLanes(rows, now);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingLatch(rows, now);
  const leadHue = leadingLatchHue(rows, now);
  const soon = rows.filter((row) => latchSoon(row.blocked, now)).length;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveTorquetumFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveTorquetumFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        if (viewer) return;
        const id = shown[focusAt]?.id;
        if (id) storeReviewed(toggleLatchReview(reviewed, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("latch-rows.csv", latchRowsCsv(rows, reviewed, now));
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusAt, reviewed, rows, shown, viewer, now]);

  return (
    <section className="c4-latch" aria-label={v4("lbpTitle")} data-plates="1" data-names={rows.length} data-role={role}>
      <header className="c4-latch-mast">
        <p className="c4-latch-seal" data-logo="mono">{v4("lbpLogo")}</p>
        <div>
          <p className="c4-latch-kicker">{v4("lbpSub")}</p>
          <h2 className="c4-title">{v4("lbpTitle")}</h2>
        </div>
      </header>
      <ol className="c4-latch-index" aria-label={v4("lbpTitle")}>
        <li data-tone="gold">{v4("lbpSpark")}</li>
        <li data-tone="ink">{v4("lbpDust")}</li>
        <li data-tone="ivory">{v4("lbpDay")}</li>
        <li data-tone="mist">{v4("lbpSeason")}</li>
        <li data-tone="line">{v4("lbpAhead")}</li>
      </ol>
      <p className="c4-latch-links">
        <Link href={crmv4Href(base, "trq")}>{v4("trqTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("trqCustomers")}</Link>
        <Link href={crmv4Href(base, "doctype")}>{v4("dgCabinetKicker")}</Link>
      </p>
      <p className="c4-latch-hint">{v4("lbpHint")}</p>
      {viewer && <p className="c4-latch-note">{v4("lbpViewer")}</p>}
      {soon > 0 && <p className="c4-latch-notice" role="status">{v4("lbpSoon")} {soon}</p>}
      {queue.loading && <p className="c4-latch-meta">{v4("lbpEmpty")}</p>}
      {queue.error && <p className="c4-latch-meta">{queue.error}</p>}
      <ul className="c4-latch-kpis" aria-label={v4("lbpRules")}>
        <li><span>{v4("lbpLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("lbpUnmarked")}</strong></li>
        <li><span>{v4("lbpToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("lbpUnmarked")}</strong></li>
        <li><span>{v4("lbpSpark")}</span><strong>{laneLatchCount(rows, "spark", now)}</strong></li>
        <li><span>{v4("lbpDust")}</span><strong>{laneLatchCount(rows, "dust", now)}</strong></li>
        <li><span>{v4("lbpShare")}</span><strong>{latchShare(laneLatchCount(rows, "dust", now), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("lbpOpen")}</span><strong>{rows.filter((row) => latchOpen(row.blocked, now)).length}</strong></li>
        <li><span>{v4("lbpToday")}</span><strong>{rows.filter((row) => latchToday(row.blocked, now)).length}</strong></li>
        <li><span>{v4("lbpHeld")}</span><strong>{rows.filter((row) => latchHeld(row.blocked, now)).length}</strong></li>
        <li><span>{v4("lbpAhead")}</span><strong>{rows.filter((row) => latchAhead(row.blocked, now)).length}</strong></li>
      </ul>
      <div className="c4-latch-chart" aria-label={v4("lbpRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-latch-column" data-on={lane === bar.lane ? "1" : "0"} data-lane={bar.lane} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ height: `${Math.max(12, Math.round((bar.count / maxBar) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{laneLabel(v4, bar.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-latch-tools">
        <input ref={searchRef} className="c4-field c4-latch-search" aria-label={v4("lbpSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("lbpSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("lbpAll") : hueLabel(v4, item)}</button>
        ))}
        {SHAPES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("lbpAll") : item === "reviewed" ? v4("lbpReviewed") : v4("lbpFresh")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("lbpShow")}</button>
        <button type="button" className="c4-btn" onClick={() => download("latch-lanes.csv", latchLanesCsv(rows, now))}>{v4("lbpCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("latch-rows.csv", latchRowsCsv(rows, reviewed, now))}>{v4("lbpRowCsv")}</button>
      </div>
      <ul className="c4-latch-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleLatch(hidden, item))}>{hidden.includes(item) ? v4("lbpShow") : v4("lbpHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-latch-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkLatchReview(reviewed, picked, true))}>{v4("lbpBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkLatchReview(reviewed, picked, false))}>{v4("lbpBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-latch-empty">{v4("lbpEmpty")}</p>}
      <ol className="c4-latch-board">
        {shown.map((row, index) => {
          const seen = reviewed.includes(row.id);
          const minutes = latchMinutes(row.blocked, now);
          return (
            <li key={row.id} className="c4-latch-card" data-on={index === focusAt ? "1" : "0"} data-lane={latchLane(row.blocked, now)} data-hue={latchHue(row.blocked, now)} data-reviewed={seen ? "1" : "0"} data-spark={latchSpark(row.blocked, now) ? "1" : "0"} data-dust={latchDust(row.blocked, now) ? "1" : "0"} data-ahead={latchAhead(row.blocked, now) ? "1" : "0"} data-today={latchToday(row.blocked, now) ? "1" : "0"} data-soon={latchSoon(row.blocked, now) ? "1" : "0"}>
              <p className="c4-latch-stamp">{latchStamp(row.blocked, now) || "·"}</p>
              <label className="c4-latch-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label || row.id} onChange={() => setPicked((current) => (current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id]))} /></label>
              <div>
                <strong>{row.label || v4("lbpUnmarked")}</strong>
                <p className="c4-latch-meta">{laneLabel(v4, latchLane(row.blocked, now))} · {hueLabel(v4, latchHue(row.blocked, now))} · {v4("lbpStep")} {latchStep(row.blocked, now)}{minutes !== null ? ` · ${minutes}m` : ""}{latchWeekday(row.blocked, now) ? ` · ${v4("lbpWeekday")}` : ""}{latchWeekend(row.blocked, now) ? ` · ${v4("lbpWeekend")}` : ""}{latchMorning(row.blocked, now) ? ` · ${v4("lbpMorning")}` : ""}{latchEvening(row.blocked, now) ? ` · ${v4("lbpEvening")}` : ""}{latchEven(row.blocked, now) ? ` · ${v4("lbpEven")}` : ""}{latchLeap(row.blocked, now) ? ` · ${v4("lbpLeap")}` : ""}{latchFirst(row.blocked, now) ? ` · ${v4("lbpFirst")}` : ""}{latchHeld(row.blocked, now) ? ` · ${v4("lbpHeld")}` : ""}{latchSoon(row.blocked, now) ? ` · ${v4("lbpSoon")}` : ""}{latchTwin(row.blocked, now) ? ` · ${v4("lbpTwin")}` : ""}{latchTail(row.blocked) ? ` · ${v4("lbpTail")}` : ""}{latchMark(row.blocked) ? ` · ${v4("lbpMark")}` : ""}{latchSpace(row.blocked) ? ` · ${v4("lbpSpace")}` : ""}{latchOpen(row.blocked, now) ? ` · ${v4("lbpOpen")}` : ""}</p>
                <div className="c4-latch-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleLatchReview(reviewed, row.id))}>{seen ? v4("lbpReviewed") : v4("lbpReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(latchCopy(row.blocked)); setCopied(row.id); }}>{copied === row.id ? v4("lbpCopied") : v4("lbpCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
