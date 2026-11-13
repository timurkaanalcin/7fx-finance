"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  NTE_KEY,
  NTE_REVIEW_KEY,
  TRAV_COURSES,
  TRV_DENSITY_KEY,
  TRV_KEY,
  TRV_VIEW_KEY,
  addTraverse,
  addTraverseTag,
  addTraverseView,
  briskTraverse,
  bulkNoteReview,
  bulkTraverseBrass,
  bulkTraverseChampagne,
  bulkTraverseLog,
  bulkTraverseStow,
  bulkTraverseTag,
  busiestHelm,
  clashCourseCount,
  courseBand,
  cycleThread,
  dipSpeed,
  dipSpeedFocused,
  dropTraverseView,
  editTraverse,
  editTraverseNote,
  fairHelmsman,
  houseThread,
  idleTraverse,
  idleTraverseList,
  laneNoteCount,
  lateTraverse,
  leadingNote,
  leadingNoteHue,
  leeCourse,
  liftSpeed,
  liftSpeedFocused,
  lockTraverseFocused,
  logTraverseFocused,
  lowerPeg,
  lowerPegFocused,
  moveTravFocus,
  neighborPegCount,
  noteCap,
  noteCopy,
  noteDigit,
  noteEcho,
  noteGroups,
  noteHue,
  noteKnown,
  noteLane,
  noteLanes,
  noteLanesCsv,
  noteLeap,
  noteRowsCsv,
  noteShare,
  noteSlash,
  noteSpace,
  noteStamp,
  noteStep,
  noteTail,
  noteTwin,
  noteWide,
  overdueTraverse,
  presentNoteLanes,
  raisePeg,
  raisePegFocused,
  readHiddenNotes,
  readReviewedNotes,
  readTraverse,
  readTraverseViews,
  reminderTraverse,
  restingTraverse,
  setTraverseFinish,
  setTraverseLock,
  setTraverseLogged,
  setTraverseStar,
  setTraverseStow,
  sharedNoteCount,
  sortTraverse,
  starTraverseFocused,
  suggestCourse,
  suggestSpeed,
  suggestTravFinish,
  tagTraverseFocused,
  threadFocused,
  toggleNote,
  toggleNoteReview,
  traverseBars,
  traverseCopy,
  traverseCsv,
  traverseCounts,
  traverseDensity,
  traverseHelms,
  traverseTimeline,
  visibleNoteLanes,
  visibleNotes,
  visibleTraverse,
  weatherCourse,
  type NoteReview,
  type NoteRow,
  type NoteShape,
  type NoteValue,
  type TravDensity,
  type TravSort,
  type TravTray,
  type TravView,
  type TraversePeg,
} from "@/lib/crmv4/round285";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type NameRow = { id?: string; name?: string | null; retentionNote?: string | null };

const FINISHES = ["ivory", "graphite", "champagne"] as const;
const THREADS = ["hemp", "silk", "brass"] as const;
const SPEEDS = ["2", "4", "8"] as const;
const PEGS = ["1", "2", "4"] as const;

const COURSE_KEY: Record<string, CrmV4CopyKey> = {
  north: "trvNorth",
  east: "trvEast",
  south: "trvSouth",
  west: "trvWest",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "trvAuditSave",
  edit: "trvAuditEdit",
  note: "trvAuditNote",
  thread: "trvAuditThread",
  log: "trvAuditLog",
  unlog: "trvAuditUnlog",
  lock: "trvAuditLock",
  resume: "trvAuditResume",
  stow: "trvAuditStow",
  open: "trvAuditOpen",
  finish: "trvAuditFinish",
  tag: "trvAuditTag",
  peg: "trvAuditPeg",
  speed: "trvAuditSpeed",
  dip: "trvAuditDip",
  star: "trvAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  house: "nteHouse",
  mark: "nteMark",
  slash: "nteSlash",
  court: "nteCourt",
  span: "nteSpan",
  seal: "nteSeal",
  open: "nteOpen",
  long: "nteLong",
  short: "nteShort",
  desk: "nteDesk",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "nteIvory",
  graphite: "nteGraphite",
  champagne: "nteChampagne",
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

function courseLabel(v4: V4, course: string): string {
  const key = COURSE_KEY[course];
  return key ? v4(key) : v4("trvBlankCourse");
}

function finishLabel(v4: V4, finish: string): string {
  if (finish === "IVORY" || finish === "ivory") return v4("trvIvory");
  if (finish === "GRAPHITE" || finish === "graphite") return v4("trvGraphite");
  if (finish === "CHAMPAGNE" || finish === "champagne") return v4("trvChampagne");
  return v4("trvBlankFinish");
}

function threadLabel(v4: V4, thread: string): string {
  if (thread === "hemp") return v4("trvHemp");
  if (thread === "silk") return v4("trvSilk");
  if (thread === "brass") return v4("trvBrass");
  return v4("trvBlankThread");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("nteUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("nteUnmarked");
}

export function TraversePegs({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<TraversePeg[]>([]);
  const [views, setViews] = useState<TravView[]>([]);
  const [density, setDensity] = useState<TravDensity>("air");
  const [sheet, setSheet] = useState<"board" | "index">("board");
  const [tray, setTray] = useState<TravTray>("deck");
  const [query, setQuery] = useState("");
  const [helmFilter, setHelmFilter] = useState("all");
  const [finishFilter, setFinishFilter] = useState("all");
  const [threadFilter, setThreadFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [speedFilter, setSpeedFilter] = useState("all");
  const [pegFilter, setPegFilter] = useState("all");
  const [houseOnly, setHouseOnly] = useState(false);
  const [weatherOnly, setWeatherOnly] = useState(false);
  const [leeOnly, setLeeOnly] = useState(false);
  const [sort, setSort] = useState<TravSort>("course");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [helm, setHelm] = useState("");
  const [course, setCourse] = useState("");
  const [finish, setFinish] = useState("");
  const [thread, setThread] = useState("");
  const [speedNo, setSpeedNo] = useState("");
  const [pegNo, setPegNo] = useState("1");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [copied, setCopied] = useState("");
  const [desk, setDesk] = useState("north");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readTraverse(readJson(TRV_KEY, [])));
    setViews(readTraverseViews(readJson(TRV_VIEW_KEY, [])));
    setDensity(traverseDensity(readJson(TRV_DENSITY_KEY, "air")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: TraversePeg[]) {
    setCards(next);
    writeJson(TRV_KEY, next);
  }
  function storeViews(next: TravView[]) {
    setViews(next);
    writeJson(TRV_VIEW_KEY, next);
  }
  function storeDensity(next: TravDensity) {
    setDensity(next);
    writeJson(TRV_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortTraverse(visibleTraverse(cards, tray, query, helmFilter, finishFilter, threadFilter, courseFilter, speedFilter, pegFilter, houseOnly, weatherOnly, leeOnly), sort),
    [cards, tray, query, helmFilter, finishFilter, threadFilter, courseFilter, speedFilter, pegFilter, houseOnly, weatherOnly, leeOnly, sort],
  );
  const counts = traverseCounts(cards, shown, desk);
  const bars = traverseBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = traverseTimeline(cards);
  const helms = traverseHelms(cards);
  const ids = shown.map((card) => card.id);
  const suggested = suggestTravFinish(cards);
  const fair = fairHelmsman(cards, helms.join(","));
  const busy = busiestHelm(cards);
  const reminders = reminderTraverse(cards);
  const idling = idleTraverseList(cards);
  const speedHint = suggestSpeed(cards, clock);
  const courseHint = suggestCourse(clock);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setHelm("");
        setCourse("");
        setFinish("");
        setThread("");
        setSpeedNo("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveTravFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveTravFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        if (!viewer) store(logTraverseFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        if (!viewer) store(lockTraverseFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        if (!viewer) store(threadFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        if (!viewer) store(liftSpeedFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        if (!viewer) store(dipSpeedFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        if (!viewer) store(tagTraverseFocused(cards, ids, focusAt, "n"));
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        if (!viewer) store(starTraverseFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        if (!viewer) store(raisePegFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "y" || event.key === "Y") {
        event.preventDefault();
        if (!viewer) store(lowerPegFocused(cards, ids, focusAt));
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

  function applyView(view: TravView) {
    setTray(view.tray);
    setQuery(view.query);
    setHelmFilter(view.helm || "all");
    setFinishFilter(view.finish);
    setThreadFilter(view.thread);
    setCourseFilter(view.course);
    setSpeedFilter(view.speed);
    setPegFilter(view.peg);
  }

  return (
    <section className="c4-traverse" aria-label={v4("trvTitle")} data-cards="1" data-desk="deck" data-role={role} data-density={density} data-sheet={sheet}>
      <header className="c4-traverse-mast">
        <p className="c4-traverse-seal" data-logo="mono">{v4("trvLogo")}</p>
        <div>
          <p className="c4-traverse-kicker">{v4("trvSub")}</p>
          <h2 className="c4-title">{v4("trvTitle")}</h2>
        </div>
        <ol className="c4-traverse-index" aria-label={v4("trvTitle")}>
          <li data-tone="gold">{v4("trvBrass")}</li>
          <li data-tone="ink">{v4("trvSilk")}</li>
          <li data-tone="ivory">{v4("trvHemp")}</li>
        </ol>
      </header>
      <p className="c4-traverse-links">
        <Link href={crmv4Href(base, "nte")}>{v4("nteTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("trvCustomers")}</Link>
        <Link href={crmv4Href(base, "cty")}>{v4("trvWeek")}</Link>
      </p>
      {viewer && <p className="c4-traverse-note">{v4("trvViewer")}</p>}
      <p className="c4-traverse-lead">{v4("trvKeys")}</p>
      <p className="c4-traverse-hint">{v4("trvHint")}</p>
      <p className="c4-traverse-notice" role="status">{v4("trvNotice")} {counts.overdue}</p>
      <ol className="c4-traverse-dials" aria-label={v4("trvChart")}>
        <li><span>{v4("trvDeck")}</span><strong>{counts.deck}</strong></li>
        <li><span>{v4("trvLocker")}</span><strong>{counts.locker}</strong></li>
        <li><span>{v4("trvHold")}</span><strong>{counts.hold}</strong></li>
        <li><span>{v4("trvLogged")}</span><strong>{counts.logged}</strong></li>
        <li><span>{v4("trvOverdue")}</span><strong>{counts.overdue}</strong></li>
        <li><span>{v4("trvPair")}</span><strong>{counts.pair}</strong></li>
      </ol>
      <div className="c4-traverse-chart" aria-label={v4("trvBars")}>
        {bars.map((bar) => (
          <button key={bar.course} type="button" className="c4-traverse-column" data-on={courseFilter === bar.course ? "1" : "0"} data-course={bar.course} onClick={() => setCourseFilter(courseFilter === bar.course ? "all" : bar.course)}>
            <i style={{ height: `${Math.max(8, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{courseLabel(v4, bar.course)}</span>
          </button>
        ))}
      </div>
      <ol className="c4-traverse-time" aria-label={v4("trvNorth")}>
        {timeline.map((lane) => (
          <li key={lane.peg}><span>{lane.peg}</span><strong>{lane.titles.join(" · ")}</strong></li>
        ))}
      </ol>
      <form className="c4-traverse-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const id = `trv-${Date.now().toString(36)}`;
        store(addTraverse(cards, { id, title, note, helm, course, finish, thread, speed: speedNo, peg: pegNo, tags }));
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("trvEdit")} aria-required={false} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} placeholder={v4("trvTitle")} />
        <input className="c4-field" aria-label={v4("trvNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} placeholder={v4("trvNote")} />
        <input className="c4-field" aria-label={v4("trvFair")} aria-required={false} value={helm} disabled={viewer} onChange={(event) => setHelm(event.target.value)} placeholder={v4("trvBlankHelm")} />
        <select className="c4-field" aria-label={v4("trvCourse")} value={course} disabled={viewer} onChange={(event) => setCourse(event.target.value)}>
          <option value="">{v4("trvBlankCourse")}</option>
          {TRAV_COURSES.map((item) => <option key={item} value={item}>{courseLabel(v4, item)}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("trvFinish")} value={finish} disabled={viewer} onChange={(event) => setFinish(event.target.value)}>
          <option value="">{v4("trvBlankFinish")}</option>
          {FINISHES.map((item) => <option key={item} value={item}>{finishLabel(v4, item)}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("trvThread")} value={thread} disabled={viewer} onChange={(event) => setThread(event.target.value)}>
          <option value="">{v4("trvBlankThread")}</option>
          {THREADS.map((item) => <option key={item} value={item}>{threadLabel(v4, item)}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("trvSpeed")} value={speedNo} disabled={viewer} onChange={(event) => setSpeedNo(event.target.value)}>
          <option value="">{v4("trvBlankSpeed")}</option>
          {SPEEDS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("trvPeg")} value={pegNo} disabled={viewer} onChange={(event) => setPegNo(event.target.value)}>
          {PEGS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input className="c4-field" aria-label={v4("trvTags")} aria-required={false} value={tags} disabled={viewer} onChange={(event) => setTags(event.target.value)} placeholder={v4("trvTags")} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("trvAdd")}</button>
      </form>
      <div className="c4-traverse-tools">
        <input ref={searchRef} className="c4-field c4-traverse-search" aria-label={v4("trvSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("trvSearch")} />
        {(["deck", "locker", "hold"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "deck" ? v4("trvDeck") : item === "locker" ? v4("trvLocker") : v4("trvHold")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "air" : "tight")}>{density === "tight" ? v4("trvAir") : v4("trvTight")}</button>
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("trvHouse")}</button>
        <button type="button" className="c4-chip" data-on={weatherOnly ? "1" : "0"} onClick={() => setWeatherOnly((value) => !value)}>{v4("trvWeather")}</button>
        <button type="button" className="c4-chip" data-on={leeOnly ? "1" : "0"} onClick={() => setLeeOnly((value) => !value)}>{v4("trvLee")}</button>
        <select className="c4-field" aria-label={v4("trvFair")} value={helmFilter} onChange={(event) => setHelmFilter(event.target.value)}>
          <option value="all">{v4("trvAll")}</option>
          {helms.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("trvFinish")} value={finishFilter} onChange={(event) => setFinishFilter(event.target.value)}>
          <option value="all">{v4("trvAll")}</option>
          {FINISHES.map((item) => <option key={item} value={item}>{finishLabel(v4, item)}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("trvThread")} value={threadFilter} onChange={(event) => setThreadFilter(event.target.value)}>
          <option value="all">{v4("trvAll")}</option>
          {THREADS.map((item) => <option key={item} value={item}>{threadLabel(v4, item)}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("trvCourse")} value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)}>
          <option value="all">{v4("trvAll")}</option>
          <option value="weather">{v4("trvWeather")}</option>
          <option value="lee">{v4("trvLee")}</option>
          {TRAV_COURSES.map((item) => <option key={item} value={item}>{courseLabel(v4, item)}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("trvSpeed")} value={speedFilter} onChange={(event) => setSpeedFilter(event.target.value)}>
          <option value="all">{v4("trvAll")}</option>
          {SPEEDS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("trvPeg")} value={pegFilter} onChange={(event) => setPegFilter(event.target.value)}>
          <option value="all">{v4("trvAll")}</option>
          {PEGS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("trvCourse")} value={desk} onChange={(event) => setDesk(event.target.value)}>
          {TRAV_COURSES.map((item) => <option key={item} value={item}>{courseLabel(v4, item)}</option>)}
        </select>
      </div>
      <form className="c4-traverse-views" onSubmit={(event) => {
        event.preventDefault();
        if (viewer || !viewName.trim()) return;
        storeViews(addTraverseView(views, { id: `view-${Date.now().toString(36)}`, name: viewName, tray, query, helm: helmFilter, finish: finishFilter, thread: threadFilter, course: courseFilter, speed: speedFilter, peg: pegFilter }));
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("trvViewName")} aria-required={false} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} placeholder={v4("trvViewName")} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("trvSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-traverse-view">
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("trvApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropTraverseView(views, view.id))}>{v4("trvDropView")}</button>
          </span>
        ))}
      </form>
      {picked.length > 0 && (
        <div className="c4-traverse-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkTraverseLog(cards, picked))}>{v4("trvBulkLog")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkTraverseStow(cards, picked))}>{v4("trvBulkStow")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkTraverseBrass(cards, picked))}>{v4("trvBulkBrass")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkTraverseChampagne(cards, picked))}>{v4("trvBulkChampagne")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkTraverseTag(cards, picked, "s"))}>{v4("trvBulkTag")}</button>
        </div>
      )}
      <p className="c4-traverse-meta">{v4("trvSuggest")} {finishLabel(v4, suggested)} · {v4("trvFair")} {fair} · {v4("trvBusy")} {busy || v4("trvBlankHelm")} · {v4("trvNeighbors")} {neighborPegCount(cards)} · {v4("trvClash")} {clashCourseCount(cards)} · {v4("trvSpeedHint")} {speedHint} · {v4("trvCourseHint")} {courseLabel(v4, courseHint)}</p>
      {(reminders.length > 0 || idling.length > 0) && (
        <p className="c4-traverse-meta">{v4("trvDue")} {reminders.map((card) => card.title).join(" · ")} · {v4("trvIdle")} {idling.map((card) => card.title).join(" · ")}</p>
      )}
      {!shown.length && <p className="c4-traverse-empty">{v4("trvEmpty")}</p>}
      <ol className={sheet === "index" ? "c4-traverse-index-list" : "c4-traverse-board"} data-density={density}>
        {shown.map((card, index) => (
          <li key={card.id} className="c4-traverse-card" data-on={index === focusAt ? "1" : "0"} data-logged={card.logged ? "1" : "0"} data-overdue={overdueTraverse(card) ? "1" : "0"} data-weather={weatherCourse(card.course) ? "1" : "0"} data-lee={leeCourse(card.course) ? "1" : "0"} data-house={houseThread(card.thread) ? "1" : "0"} data-brisk={briskTraverse(card) ? "1" : "0"} data-idle={idleTraverse(card) ? "1" : "0"} data-resting={restingTraverse(card) ? "1" : "0"} data-late={lateTraverse(card, desk) ? "1" : "0"} data-band={courseBand(card.course)} data-course={card.course}>
            <ol className="c4-traverse-ticks" aria-hidden="true">
              {PEGS.map((tick) => <li key={tick} data-on={String(card.peg) === tick ? "1" : "0"} />)}
            </ol>
            <label className="c4-traverse-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => togglePick(card.id)} /></label>
            <div>
              <input className="c4-field" aria-label={v4("trvEdit")} value={card.title} disabled={viewer} onChange={(event) => store(editTraverse(cards, card.id, event.target.value))} />
              <input className="c4-field" aria-label={v4("trvEditNote")} aria-required={false} value={card.note} disabled={viewer} onChange={(event) => store(editTraverseNote(cards, card.id, event.target.value))} />
              <p className="c4-traverse-meta">{card.helm || v4("trvBlankHelm")} · {courseLabel(v4, card.course)} · {finishLabel(v4, card.finish)} · {threadLabel(v4, card.thread)} · {card.speed ?? v4("trvBlankSpeed")} · {v4("trvPeg")} {card.peg} · {card.tags.join(" ") || v4("trvTags")}</p>
              <p className="c4-traverse-meta">{courseLabel(v4, desk)} · {AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : v4("trvAuditSave")}</p>
              <div className="c4-traverse-tools">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTraverseLogged(cards, card.id, !card.logged))}>{card.logged ? v4("trvUnlog") : v4("trvLog")}</button>
                <button type="button" className="c4-btn" disabled={viewer || card.stowed} onClick={() => store(setTraverseLock(cards, card.id, !card.locked))}>{card.locked ? v4("trvResume") : v4("trvLock")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTraverseStow(cards, card.id, !card.stowed))}>{card.stowed ? v4("trvOpenAgain") : v4("trvStowed")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTraverseStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("trvUnstar") : v4("trvStar")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleThread(cards, card.id))}>{v4("trvThread")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftSpeed(cards, card.id))}>{v4("trvLift")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(dipSpeed(cards, card.id))}>{v4("trvDip")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raisePeg(cards, card.id))}>{v4("trvRaise")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerPeg(cards, card.id))}>{v4("trvLower")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTraverseFinish(cards, card.id, card.finish === "CHAMPAGNE" ? "graphite" : "champagne"))}>{v4("trvFinish")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addTraverseTag(cards, card.id, "n"))}>{v4("trvTags")}</button>
                <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(traverseCopy(card)); setCopied(card.id); }}>{copied === card.id ? v4("trvCopied") : v4("trvCopy")}</button>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <button type="button" className="c4-btn" onClick={() => { setSort(sort === "course" ? "helm" : "course"); }}>{sort === "course" ? v4("trvSortHelm") : v4("trvSortCourse")}</button>
      <button type="button" className="c4-btn" onClick={() => download("traverse-pegs.csv", traverseCsv(shown, desk))}>{v4("trvCsv")}</button>
    </section>
  );
}

const SHAPES = ["all", "house", "mark", "slash", "court", "span", "seal", "open", "long", "short", "desk", "wide", "leap", "twin", "known", "echo", "even", "odd", "space", "digit", "tail", "cap"] as const;

function shapeLabel(v4: V4, item: (typeof SHAPES)[number]): string {
  if (item === "all") return v4("nteShapeAll");
  if (item === "house") return v4("nteShapeHouse");
  if (item === "mark") return v4("nteShapeMark");
  if (item === "slash") return v4("nteShapeSlash");
  if (item === "court") return v4("nteShapeCourt");
  if (item === "span") return v4("nteShapeSpan");
  if (item === "seal") return v4("nteShapeSeal");
  if (item === "open") return v4("nteShapeOpen");
  if (item === "long") return v4("nteShapeLong");
  if (item === "short") return v4("nteShapeShort");
  if (item === "desk") return v4("nteShapeDesk");
  if (item === "wide") return v4("nteShapeWide");
  if (item === "leap") return v4("nteShapeLeap");
  if (item === "twin") return v4("nteShapeTwin");
  if (item === "known") return v4("nteShapeKnown");
  if (item === "echo") return v4("nteShapeEcho");
  if (item === "even") return v4("nteShapeEven");
  if (item === "odd") return v4("nteShapeOdd");
  if (item === "space") return v4("nteShapeSpace");
  if (item === "digit") return v4("nteShapeDigit");
  if (item === "tail") return v4("nteShapeTail");
  return v4("nteShapeCap");
}

export function NotePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: NameRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [shape, setShape] = useState<NoteShape>("all");
  const [review, setReview] = useState<NoteReview>("all");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<NoteRow[]>(() => (queue.data?.users || []).map((row, index) => ({
    id: row.id ? `note-${row.id}` : `note-${index}`,
    label: textField(row.name),
    note: { retentionNote: textField(row.retentionNote) } satisfies NoteValue,
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
    const present = presentNoteLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenNotes(readJson(NTE_KEY, []), present);
    const nextReviewed = readReviewedNotes(readJson(NTE_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(NTE_KEY, nextHidden);
    writeJson(NTE_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentNoteLanes(rows);
  const lanes = visibleNoteLanes(present, hidden, showHidden);
  const shown = visibleNotes(rows, lane, hue, query, review, reviewed, shape).filter((row) => {
    const token = noteLane(row.note);
    if (!token) return true;
    return showHidden || !hidden.includes(token);
  });
  const focusAt = shown.length ? focus % shown.length : 0;
  const bars = noteLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingNote(rows);
  const leadHue = leadingNoteHue(rows);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveTravFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveTravFocus(index, shown.length, -1));
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
    writeJson(NTE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(NTE_REVIEW_KEY, next);
  }
  return (
    <section className="c4-noteplate" aria-label={v4("nteTitle")} data-plates="1" data-names={rows.length} data-role={role}>
      <header className="c4-noteplate-mast">
        <p className="c4-noteplate-seal" data-logo="mono">{v4("nteLogo")}</p>
        <div>
          <p className="c4-noteplate-kicker">{v4("nteSub")}</p>
          <h2 className="c4-title">{v4("nteTitle")}</h2>
        </div>
      </header>
      <ol className="c4-noteplate-index" aria-label={v4("nteTitle")}>
        <li data-tone="gold">{v4("nteHouse")}</li>
        <li data-tone="ink">{v4("nteMark")}</li>
        <li data-tone="ivory">{v4("nteSpan")}</li>
        <li data-tone="mist">{v4("nteOpen")}</li>
        <li data-tone="line">{v4("nteShort")}</li>
      </ol>
      <p className="c4-noteplate-links">
        <Link href={crmv4Href(base, "trv")}>{v4("trvTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("trvCustomers")}</Link>
        <Link href={crmv4Href(base, "cty")}>{v4("nteWeek")}</Link>
      </p>
      <p className="c4-noteplate-hint">{v4("nteHint")}</p>
      {viewer && <p className="c4-noteplate-note">{v4("nteViewer")}</p>}
      {queue.loading && <p className="c4-noteplate-meta">{v4("nteEmpty")}</p>}
      {queue.error && <p className="c4-noteplate-meta">{queue.error}</p>}
      <ul className="c4-noteplate-kpis" aria-label={v4("nteRules")}>
        <li><span>{v4("nteLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("nteUnmarked")}</strong></li>
        <li><span>{v4("nteToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("nteUnmarked")}</strong></li>
        <li><span>{v4("nteShared")}</span><strong>{sharedNoteCount(rows)}</strong></li>
        <li><span>{v4("nteShare")}</span><strong>{noteShare(laneNoteCount(rows, "house"), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("nteKnown")}</span><strong>{rows.filter((row) => noteKnown(row.note)).length}</strong></li>
        <li><span>{v4("nteTwin")}</span><strong>{rows.filter((row) => noteTwin(row.note)).length}</strong></li>
        <li><span>{v4("nteEven")}</span><strong>{rows.filter((row) => noteStep(row.note) > 0 && noteStep(row.note) % 2 === 0).length}</strong></li>
        <li><span>{v4("nteWords")}</span><strong>{rows.reduce((sum, row) => sum + noteGroups(row.note), 0)}</strong></li>
      </ul>
      <div className="c4-noteplate-chart" aria-label={v4("nteRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-noteplate-column" data-on={lane === bar.lane ? "1" : "0"} data-lane={bar.lane} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ height: `${Math.max(12, Math.round((bar.count / maxBar) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{laneLabel(v4, bar.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-noteplate-tools">
        <input ref={searchRef} className="c4-field c4-noteplate-search" aria-label={v4("nteSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("nteSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("nteAll") : hueLabel(v4, item)}</button>
        ))}
        {SHAPES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{shapeLabel(v4, item)}</button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("nteAll") : item === "reviewed" ? v4("nteReviewed") : v4("nteUnreviewed")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("nteShow")}</button>
      </div>
      <ul className="c4-noteplate-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleNote(hidden, item))}>{hidden.includes(item) ? v4("nteShow") : v4("nteHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-noteplate-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkNoteReview(reviewed, picked, true))}>{v4("nteBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkNoteReview(reviewed, picked, false))}>{v4("nteBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-noteplate-empty">{v4("nteEmpty")}</p>}
      <ol className="c4-noteplate-board">
        {shown.map((row, index) => {
          const seen = reviewed.includes(row.id);
          return (
            <li key={row.id} className="c4-noteplate-card" data-on={index === focusAt ? "1" : "0"} data-lane={noteLane(row.note)} data-hue={noteHue(row.note)} data-reviewed={seen ? "1" : "0"} data-known={noteKnown(row.note) ? "1" : "0"}>
              <p className="c4-noteplate-stamp">{noteStamp(row.note) || "·"}</p>
              <label className="c4-noteplate-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label || row.id} onChange={() => setPicked((current) => (current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id]))} /></label>
              <div>
                <strong>{row.label || v4("nteUnmarked")}</strong>
                <p className="c4-noteplate-meta">{laneLabel(v4, noteLane(row.note))} · {hueLabel(v4, noteHue(row.note))} · {v4("nteStep")} {noteStep(row.note)} · {v4("nteWords")} {noteGroups(row.note)}{noteCap(row.note) ? ` · ${v4("nteCap")}` : ""}{noteTail(row.note) ? ` · ${v4("nteTail")}` : ""}{noteWide(row.note) ? ` · ${v4("nteWide")}` : ""}{noteSlash(row.note) ? ` · ${v4("nteSlash")}` : ""}{noteLeap(row.note) ? ` · ${v4("nteLeap")}` : ""}{noteEcho(row.note) ? ` · ${v4("nteEcho")}` : ""}{noteSpace(row.note) ? ` · ${v4("nteSpace")}` : ""}{noteDigit(row.note) ? ` · ${v4("nteDigit")}` : ""}{noteTwin(row.note) ? ` · ${v4("nteTwin")}` : ""}</p>
                <div className="c4-noteplate-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleNoteReview(reviewed, row.id))}>{seen ? v4("nteReviewed") : v4("nteReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(noteCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("nteCopied") : v4("nteCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="c4-noteplate-tools">
        <button type="button" className="c4-btn" onClick={() => download("note-lanes.csv", noteLanesCsv(rows))}>{v4("nteCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("note-rows.csv", noteRowsCsv(shown, reviewed))}>{v4("nteRowCsv")}</button>
      </div>
    </section>
  );
}
