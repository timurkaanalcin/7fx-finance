"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  PHN_KEY,
  PHN_REVIEW_KEY,
  REFLECT_CIRCLES,
  RFC_DENSITY_KEY,
  RFC_KEY,
  RFC_VIEW_KEY,
  addReflecting,
  addReflectingTag,
  addReflectingView,
  briskReflecting,
  bulkPhoneReview,
  bulkReflectingChampagne,
  bulkReflectingLog,
  bulkReflectingPitch,
  bulkReflectingStow,
  bulkReflectingTag,
  busiestKeeper,
  circleBand,
  clashCircleCount,
  cycleInk,
  dipDegree,
  dipDegreeFocused,
  dropReflectingView,
  editReflecting,
  editReflectingNote,
  fairKeeper,
  houseFinish,
  idleReflecting,
  idleReflectingList,
  inkFocused,
  keenCircle,
  lanePhoneCount,
  lateReflecting,
  leadingPhone,
  leadingPhoneHue,
  liftDegree,
  liftDegreeFocused,
  lockReflectingFocused,
  logReflectingFocused,
  lowerStop,
  lowerStopFocused,
  moveReflectFocus,
  neighborReflectCount,
  overdueReflecting,
  phoneCap,
  phoneCopy,
  phoneDash,
  phoneEcho,
  phoneGroups,
  phoneHue,
  phoneKnown,
  phoneLane,
  phoneLanes,
  phoneLanesCsv,
  phoneLeap,
  phoneRowsCsv,
  phoneShare,
  phoneSpace,
  phoneStamp,
  phoneStep,
  phoneTail,
  phoneTwin,
  phoneWide,
  presentPhoneLanes,
  raiseStop,
  raiseStopFocused,
  readHiddenPhones,
  readReflecting,
  readReflectingViews,
  readReviewedPhones,
  reflectingBars,
  reflectingCopy,
  reflectingCounts,
  reflectingCsv,
  reflectingDensity,
  reflectingKeepers,
  reflectingTimeline,
  reminderReflecting,
  restingReflecting,
  setReflectingFinish,
  setReflectingLock,
  setReflectingLogged,
  setReflectingStar,
  setReflectingStow,
  sharedPhoneCount,
  sortReflecting,
  starReflectingFocused,
  stillCircle,
  suggestCircle,
  suggestDegree,
  suggestFinish,
  tagReflectingFocused,
  togglePhone,
  togglePhoneReview,
  visiblePhoneLanes,
  visiblePhones,
  visibleReflecting,
  type PhoneReview,
  type PhoneRow,
  type PhoneShape,
  type PhoneValue,
  type ReflectDensity,
  type ReflectSort,
  type ReflectTray,
  type ReflectView,
  type ReflectingSight,
} from "@/lib/crmv4/round283";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FINISHES = ["ivory", "graphite", "champagne"] as const;
const INKS = ["pearl", "bronze", "pitch"] as const;
const DEGREES = ["30", "60", "90"] as const;
const STOPS = ["2", "6", "12"] as const;

const CIRCLE_KEY: Record<string, CrmV4CopyKey> = {
  mirror: "rfcMirror",
  vernier: "rfcVernier",
  index: "rfcIndex",
  alidade: "rfcAlidade",
  keen: "rfcKeen",
  still: "rfcStill",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "rfcAuditSave",
  edit: "rfcAuditEdit",
  note: "rfcAuditNote",
  ink: "rfcAuditInk",
  log: "rfcAuditLog",
  unlog: "rfcAuditUnlog",
  lock: "rfcAuditLock",
  resume: "rfcAuditResume",
  stow: "rfcAuditStow",
  open: "rfcAuditOpen",
  finish: "rfcAuditFinish",
  tag: "rfcAuditTag",
  stop: "rfcAuditStop",
  degree: "rfcAuditDegree",
  dip: "rfcAuditDip",
  star: "rfcAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  house: "phnHouse",
  plus: "phnPlus",
  trunk: "phnTrunk",
  long: "phnLong",
  desk: "phnDesk",
  short: "phnShort",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "phnIvory",
  graphite: "phnGraphite",
  champagne: "phnChampagne",
};

type NameRow = {
  id?: string;
  name?: string | null;
  phone?: string | null;
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

function circleLabel(v4: V4, circle: string): string {
  const key = CIRCLE_KEY[circle];
  return key ? v4(key) : v4("rfcBlank");
}

function finishLabel(v4: V4, finish: string): string {
  if (finish === "IVORY" || finish === "ivory") return v4("rfcIvory");
  if (finish === "GRAPHITE" || finish === "graphite") return v4("rfcGraphite");
  if (finish === "CHAMPAGNE" || finish === "champagne") return v4("rfcChampagne");
  return v4("rfcBlankFinish");
}

function inkLabel(v4: V4, ink: string): string {
  if (ink === "pearl") return v4("rfcPearl");
  if (ink === "bronze") return v4("rfcBronze");
  if (ink === "pitch") return v4("rfcPitch");
  return v4("rfcBlankInk");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("phnUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("phnUnmarked");
}

export function ReflectingCircles({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<ReflectingSight[]>([]);
  const [views, setViews] = useState<ReflectView[]>([]);
  const [density, setDensity] = useState<ReflectDensity>("air");
  const [sheet, setSheet] = useState<"board" | "index">("board");
  const [tray, setTray] = useState<ReflectTray>("bench");
  const [query, setQuery] = useState("");
  const [keeperFilter, setKeeperFilter] = useState("all");
  const [finishFilter, setFinishFilter] = useState("all");
  const [inkFilter, setInkFilter] = useState("all");
  const [circleFilter, setCircleFilter] = useState("all");
  const [degreeFilter, setDegreeFilter] = useState("all");
  const [stopFilter, setStopFilter] = useState("all");
  const [houseOnly, setHouseOnly] = useState(false);
  const [keenOnly, setKeenOnly] = useState(false);
  const [stillOnly, setStillOnly] = useState(false);
  const [sort, setSort] = useState<ReflectSort>("circle");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [keeper, setKeeper] = useState("");
  const [circle, setCircle] = useState("");
  const [finish, setFinish] = useState("");
  const [ink, setInk] = useState("");
  const [degreeNo, setDegreeNo] = useState("");
  const [stopNo, setStopNo] = useState("2");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [copied, setCopied] = useState("");
  const [desk, setDesk] = useState("mirror");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readReflecting(readJson(RFC_KEY, [])));
    setViews(readReflectingViews(readJson(RFC_VIEW_KEY, [])));
    setDensity(reflectingDensity(readJson(RFC_DENSITY_KEY, "air")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: ReflectingSight[]) {
    setCards(next);
    writeJson(RFC_KEY, next);
  }
  function storeViews(next: ReflectView[]) {
    setViews(next);
    writeJson(RFC_VIEW_KEY, next);
  }
  function storeDensity(next: ReflectDensity) {
    setDensity(next);
    writeJson(RFC_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortReflecting(visibleReflecting(cards, tray, query, keeperFilter, finishFilter, inkFilter, circleFilter, degreeFilter, stopFilter, houseOnly, keenOnly, stillOnly), sort),
    [cards, tray, query, keeperFilter, finishFilter, inkFilter, circleFilter, degreeFilter, stopFilter, houseOnly, keenOnly, stillOnly, sort],
  );
  const counts = reflectingCounts(cards, shown, desk);
  const bars = reflectingBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = reflectingTimeline(cards);
  const keepers = reflectingKeepers(cards);
  const ids = shown.map((card) => card.id);
  const suggested = suggestFinish(cards);
  const fair = fairKeeper(cards, keepers.join(","));
  const busy = busiestKeeper(cards);
  const reminders = reminderReflecting(cards);
  const idling = idleReflectingList(cards);
  const degreeHint = suggestDegree(cards, clock);
  const circleHint = suggestCircle(clock);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setKeeper("");
        setCircle("");
        setFinish("");
        setInk("");
        setDegreeNo("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveReflectFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveReflectFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        if (!viewer) store(logReflectingFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        if (!viewer) store(lockReflectingFocused(cards, ids, focusAt));
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
        if (!viewer) store(tagReflectingFocused(cards, ids, focusAt, "n"));
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        if (!viewer) store(starReflectingFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        if (!viewer) store(raiseStopFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "y" || event.key === "Y") {
        event.preventDefault();
        if (!viewer) store(lowerStopFocused(cards, ids, focusAt));
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

  function applyView(view: ReflectView) {
    setTray(view.tray);
    setQuery(view.query);
    setKeeperFilter(view.keeper || "all");
    setFinishFilter(view.finish);
    setInkFilter(view.ink);
    setCircleFilter(view.circle);
    setDegreeFilter(view.degree);
    setStopFilter(view.stop);
  }

  return (
    <section className="c4-reflect" aria-label={v4("rfcTitle")} data-cards="1" data-desk="bench" data-role={role} data-density={density} data-sheet={sheet}>
      <header className="c4-reflect-mast">
        <p className="c4-reflect-seal" data-logo="mono">{v4("rfcLogo")}</p>
        <div>
          <p className="c4-reflect-kicker">{v4("rfcSub")}</p>
          <h2 className="c4-title">{v4("rfcTitle")}</h2>
        </div>
        <ol className="c4-reflect-index" aria-label={v4("rfcTitle")}>
          <li data-tone="gold">{v4("rfcBronze")}</li>
          <li data-tone="ink">{v4("rfcPitch")}</li>
          <li data-tone="ivory">{v4("rfcPearl")}</li>
        </ol>
      </header>
      <p className="c4-reflect-links">
        <Link href={crmv4Href(base, "phn")}>{v4("phnTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("rfcCustomers")}</Link>
        <Link href={crmv4Href(base, "qdr")}>{v4("rfcWeek")}</Link>
      </p>
      {viewer && <p className="c4-reflect-note">{v4("rfcViewer")}</p>}
      <p className="c4-reflect-lead">{v4("rfcKeys")}</p>
      <p className="c4-reflect-hint">{v4("rfcHint")}</p>
      <p className="c4-reflect-notice" role="status">{v4("rfcNotice")} {counts.overdue}</p>
      <ol className="c4-reflect-dials" aria-label={v4("rfcChart")}>
        <li><span>{v4("rfcBench")}</span><strong>{counts.bench}</strong></li>
        <li><span>{v4("rfcCase")}</span><strong>{counts.case}</strong></li>
        <li><span>{v4("rfcChest")}</span><strong>{counts.chest}</strong></li>
        <li><span>{v4("rfcLogged")}</span><strong>{counts.logged}</strong></li>
        <li><span>{v4("rfcOverdue")}</span><strong>{counts.overdue}</strong></li>
        <li><span>{v4("rfcEven")}</span><strong>{counts.even}</strong></li>
      </ol>
      <div className="c4-reflect-chart" aria-label={v4("rfcBars")}>
        {bars.map((bar) => (
          <button key={bar.circle} type="button" className="c4-reflect-column" data-on={circleFilter === bar.circle ? "1" : "0"} onClick={() => setCircleFilter(circleFilter === bar.circle ? "all" : bar.circle)}>
            <i style={{ height: `${Math.max(8, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{circleLabel(v4, bar.circle)}</span>
          </button>
        ))}
      </div>
      <ol className="c4-reflect-time" aria-label={v4("rfcIndex")}>
        {timeline.map((lane) => (
          <li key={lane.stop}><span>{lane.stop}</span><strong>{lane.titles.join(" · ")}</strong></li>
        ))}
      </ol>
      <form className="c4-reflect-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const id = `rfc-${Date.now().toString(36)}`;
        store(addReflecting(cards, { id, title, note, keeper, circle, finish, ink, degree: degreeNo, stop: stopNo, tags }));
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("rfcEdit")} aria-required={false} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} placeholder={v4("rfcTitle")} />
        <input className="c4-field" aria-label={v4("rfcNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} placeholder={v4("rfcNote")} />
        <input className="c4-field" aria-label={v4("rfcFair")} aria-required={false} value={keeper} disabled={viewer} onChange={(event) => setKeeper(event.target.value)} placeholder={v4("rfcBlankKeeper")} />
        <select className="c4-field" aria-label={v4("rfcCircle")} value={circle} disabled={viewer} onChange={(event) => setCircle(event.target.value)}>
          <option value="">{v4("rfcBlankCircle")}</option>
          {REFLECT_CIRCLES.map((item) => <option key={item} value={item}>{circleLabel(v4, item)}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("rfcFinish")} value={finish} disabled={viewer} onChange={(event) => setFinish(event.target.value)}>
          <option value="">{v4("rfcBlankFinish")}</option>
          {FINISHES.map((item) => <option key={item} value={item}>{finishLabel(v4, item)}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("rfcTone")} value={ink} disabled={viewer} onChange={(event) => setInk(event.target.value)}>
          <option value="">{v4("rfcBlankInk")}</option>
          {INKS.map((item) => <option key={item} value={item}>{inkLabel(v4, item)}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("rfcDegree")} value={degreeNo} disabled={viewer} onChange={(event) => setDegreeNo(event.target.value)}>
          <option value="">{v4("rfcBlankDegree")}</option>
          {DEGREES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("rfcStop")} value={stopNo} disabled={viewer} onChange={(event) => setStopNo(event.target.value)}>
          {STOPS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input className="c4-field" aria-label={v4("rfcTags")} aria-required={false} value={tags} disabled={viewer} onChange={(event) => setTags(event.target.value)} placeholder={v4("rfcTags")} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("rfcAdd")}</button>
      </form>
      <div className="c4-reflect-tools">
        <input ref={searchRef} className="c4-field c4-reflect-search" aria-label={v4("rfcSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("rfcSearch")} />
        {(["bench", "case", "chest"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "bench" ? v4("rfcBench") : item === "case" ? v4("rfcCase") : v4("rfcChest")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "air" : "tight")}>{density === "tight" ? v4("rfcAir") : v4("rfcTight")}</button>
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("rfcHouse")}</button>
        <button type="button" className="c4-chip" data-on={keenOnly ? "1" : "0"} onClick={() => setKeenOnly((value) => !value)}>{v4("rfcKeen")}</button>
        <button type="button" className="c4-chip" data-on={stillOnly ? "1" : "0"} onClick={() => setStillOnly((value) => !value)}>{v4("rfcStill")}</button>
        <select className="c4-field" aria-label={v4("rfcFair")} value={keeperFilter} onChange={(event) => setKeeperFilter(event.target.value)}>
          <option value="all">{v4("rfcAll")}</option>
          {keepers.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("rfcFinish")} value={finishFilter} onChange={(event) => setFinishFilter(event.target.value)}>
          <option value="all">{v4("rfcAll")}</option>
          {FINISHES.map((item) => <option key={item} value={item}>{finishLabel(v4, item)}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("rfcTone")} value={inkFilter} onChange={(event) => setInkFilter(event.target.value)}>
          <option value="all">{v4("rfcAll")}</option>
          {INKS.map((item) => <option key={item} value={item}>{inkLabel(v4, item)}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("rfcCircle")} value={circleFilter} onChange={(event) => setCircleFilter(event.target.value)}>
          <option value="all">{v4("rfcAll")}</option>
          <option value="keen">{v4("rfcKeen")}</option>
          <option value="still">{v4("rfcStill")}</option>
          {REFLECT_CIRCLES.map((item) => <option key={item} value={item}>{circleLabel(v4, item)}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("rfcDegree")} value={degreeFilter} onChange={(event) => setDegreeFilter(event.target.value)}>
          <option value="all">{v4("rfcAll")}</option>
          {DEGREES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("rfcStop")} value={stopFilter} onChange={(event) => setStopFilter(event.target.value)}>
          <option value="all">{v4("rfcAll")}</option>
          {STOPS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("rfcCircle")} value={desk} onChange={(event) => setDesk(event.target.value)}>
          {REFLECT_CIRCLES.map((item) => <option key={item} value={item}>{circleLabel(v4, item)}</option>)}
        </select>
      </div>
      <form className="c4-reflect-views" onSubmit={(event) => {
        event.preventDefault();
        if (viewer || !viewName.trim()) return;
        storeViews(addReflectingView(views, { id: `view-${Date.now().toString(36)}`, name: viewName, tray, query, keeper: keeperFilter, finish: finishFilter, ink: inkFilter, circle: circleFilter, degree: degreeFilter, stop: stopFilter }));
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("rfcViewName")} aria-required={false} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} placeholder={v4("rfcViewName")} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("rfcSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-reflect-view">
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("rfcApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropReflectingView(views, view.id))}>{v4("rfcDropView")}</button>
          </span>
        ))}
      </form>
      {picked.length > 0 && (
        <div className="c4-reflect-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkReflectingLog(cards, picked))}>{v4("rfcBulkLog")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkReflectingStow(cards, picked))}>{v4("rfcBulkStow")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkReflectingPitch(cards, picked))}>{v4("rfcBulkPitch")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkReflectingChampagne(cards, picked))}>{v4("rfcBulkChampagne")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkReflectingTag(cards, picked, "s"))}>{v4("rfcBulkTag")}</button>
        </div>
      )}
      <p className="c4-reflect-meta">{v4("rfcSuggest")} {finishLabel(v4, suggested)} · {v4("rfcFair")} {fair} · {v4("rfcBusy")} {busy || v4("rfcBlankKeeper")} · {v4("rfcNeighbors")} {neighborReflectCount(cards)} · {v4("rfcClash")} {clashCircleCount(cards)} · {v4("rfcDegreeHint")} {degreeHint} · {v4("rfcCircleHint")} {circleLabel(v4, circleHint)}</p>
      {(reminders.length > 0 || idling.length > 0) && (
        <p className="c4-reflect-meta">{v4("rfcDue")} {reminders.map((card) => card.title).join(" · ")} · {v4("rfcIdle")} {idling.map((card) => card.title).join(" · ")}</p>
      )}
      {!shown.length && <p className="c4-reflect-empty">{v4("rfcEmpty")}</p>}
      <ol className={sheet === "index" ? "c4-reflect-index-list" : "c4-reflect-board"} data-density={density}>
        {shown.map((card, index) => (
          <li key={card.id} className="c4-reflect-card" data-on={index === focusAt ? "1" : "0"} data-logged={card.logged ? "1" : "0"} data-overdue={overdueReflecting(card) ? "1" : "0"} data-keen={keenCircle(card.circle) ? "1" : "0"} data-still={stillCircle(card.circle) ? "1" : "0"} data-house={houseFinish(card.finish) ? "1" : "0"} data-brisk={briskReflecting(card) ? "1" : "0"} data-idle={idleReflecting(card) ? "1" : "0"} data-resting={restingReflecting(card) ? "1" : "0"} data-late={lateReflecting(card, desk) ? "1" : "0"} data-band={circleBand(card.circle)}>
            <ol className="c4-reflect-ticks" aria-hidden="true">
              {STOPS.map((tick) => <li key={tick} data-on={String(card.stop) === tick ? "1" : "0"} />)}
            </ol>
            <label className="c4-reflect-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => togglePick(card.id)} /></label>
            <div>
              <input className="c4-field" aria-label={v4("rfcEdit")} value={card.title} disabled={viewer} onChange={(event) => store(editReflecting(cards, card.id, event.target.value))} />
              <input className="c4-field" aria-label={v4("rfcEditNote")} aria-required={false} value={card.note} disabled={viewer} onChange={(event) => store(editReflectingNote(cards, card.id, event.target.value))} />
              <p className="c4-reflect-meta">{card.keeper || v4("rfcBlankKeeper")} · {circleLabel(v4, card.circle)} · {finishLabel(v4, card.finish)} · {inkLabel(v4, card.ink)} · {card.degree ?? v4("rfcBlankDegree")} · {v4("rfcStop")} {card.stop} · {card.tags.join(" ") || v4("rfcTags")}</p>
              <p className="c4-reflect-meta">{circleLabel(v4, desk)} · {AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : v4("rfcAuditSave")}</p>
              <div className="c4-reflect-tools">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setReflectingLogged(cards, card.id, !card.logged))}>{card.logged ? v4("rfcUnlog") : v4("rfcLog")}</button>
                <button type="button" className="c4-btn" disabled={viewer || card.stowed} onClick={() => store(setReflectingLock(cards, card.id, !card.locked))}>{card.locked ? v4("rfcResume") : v4("rfcLock")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setReflectingStow(cards, card.id, !card.stowed))}>{card.stowed ? v4("rfcOpenAgain") : v4("rfcStowed")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setReflectingStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("rfcUnstar") : v4("rfcStar")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleInk(cards, card.id))}>{v4("rfcTone")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftDegree(cards, card.id))}>{v4("rfcLift")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(dipDegree(cards, card.id))}>{v4("rfcDip")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseStop(cards, card.id))}>{v4("rfcRaise")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerStop(cards, card.id))}>{v4("rfcLower")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setReflectingFinish(cards, card.id, card.finish === "CHAMPAGNE" ? "graphite" : "champagne"))}>{v4("rfcFinish")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addReflectingTag(cards, card.id, "n"))}>{v4("rfcTags")}</button>
                <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(reflectingCopy(card)); setCopied(card.id); }}>{copied === card.id ? v4("rfcCopied") : v4("rfcCopy")}</button>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <button type="button" className="c4-btn" onClick={() => { setSort(sort === "circle" ? "keeper" : "circle"); }}>{sort === "circle" ? v4("rfcSortKeeper") : v4("rfcSortCircle")}</button>
      <button type="button" className="c4-btn" onClick={() => download("reflecting-sights.csv", reflectingCsv(shown, desk))}>{v4("rfcCsv")}</button>
    </section>
  );
}

const SHAPES = ["all", "house", "plus", "trunk", "long", "desk", "short", "wide", "dash", "leap", "twin", "known", "echo", "even", "odd", "space", "paren", "tail", "cap"] as const;

function shapeLabel(v4: V4, item: (typeof SHAPES)[number]): string {
  if (item === "all") return v4("phnShapeAll");
  if (item === "wide") return v4("phnShapeWide");
  if (item === "dash") return v4("phnShapeDash");
  if (item === "leap") return v4("phnShapeLeap");
  if (item === "twin") return v4("phnShapeTwin");
  if (item === "known") return v4("phnShapeKnown");
  if (item === "echo") return v4("phnShapeEcho");
  if (item === "even") return v4("phnShapeEven");
  if (item === "odd") return v4("phnShapeOdd");
  if (item === "space") return v4("phnShapeSpace");
  if (item === "paren") return v4("phnShapeParen");
  if (item === "tail") return v4("phnShapeTail");
  if (item === "cap") return v4("phnShapeCap");
  return laneLabel(v4, item);
}

export function PhonePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: NameRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [shape, setShape] = useState<PhoneShape>("all");
  const [review, setReview] = useState<PhoneReview>("all");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<PhoneRow[]>(() => (queue.data?.users || []).map((row, index) => ({
    id: row.id ? `name-${row.id}` : `name-${index}`,
    label: textField(row.name),
    note: { phone: textField(row.phone) } satisfies PhoneValue,
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
    const present = presentPhoneLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenPhones(readJson(PHN_KEY, []), present);
    const nextReviewed = readReviewedPhones(readJson(PHN_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(PHN_KEY, nextHidden);
    writeJson(PHN_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentPhoneLanes(rows);
  const lanes = visiblePhoneLanes(present, hidden, showHidden);
  const shown = visiblePhones(rows, lane, hue, query, review, reviewed, shape).filter((row) => {
    const token = phoneLane(row.note);
    if (!token) return true;
    return showHidden || !hidden.includes(token);
  });
  const focusAt = shown.length ? focus % shown.length : 0;
  const bars = phoneLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingPhone(rows);
  const leadHue = leadingPhoneHue(rows);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveReflectFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveReflectFocus(index, shown.length, -1));
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
    writeJson(PHN_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(PHN_REVIEW_KEY, next);
  }
  return (
    <section className="c4-phoneplate" aria-label={v4("phnTitle")} data-plates="1" data-names={rows.length} data-role={role}>
      <header className="c4-phoneplate-mast">
        <p className="c4-phoneplate-seal" data-logo="mono">{v4("phnLogo")}</p>
        <div>
          <p className="c4-phoneplate-kicker">{v4("phnSub")}</p>
          <h2 className="c4-title">{v4("phnTitle")}</h2>
        </div>
      </header>
      <ol className="c4-phoneplate-index" aria-label={v4("phnTitle")}>
        <li data-tone="gold">{v4("phnHouse")}</li>
        <li data-tone="ink">{v4("phnPlus")}</li>
        <li data-tone="ivory">{v4("phnTrunk")}</li>
        <li data-tone="mist">{v4("phnDesk")}</li>
        <li data-tone="line">{v4("phnShort")}</li>
      </ol>
      <p className="c4-phoneplate-links">
        <Link href={crmv4Href(base, "rfc")}>{v4("rfcTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("rfcCustomers")}</Link>
        <Link href={crmv4Href(base, "lng")}>{v4("phnWeek")}</Link>
      </p>
      <p className="c4-phoneplate-hint">{v4("phnHint")}</p>
      {viewer && <p className="c4-phoneplate-note">{v4("phnViewer")}</p>}
      {queue.loading && <p className="c4-phoneplate-meta">{v4("phnEmpty")}</p>}
      {queue.error && <p className="c4-phoneplate-meta">{queue.error}</p>}
      <ul className="c4-phoneplate-kpis" aria-label={v4("phnRules")}>
        <li><span>{v4("phnLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("phnUnmarked")}</strong></li>
        <li><span>{v4("phnToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("phnUnmarked")}</strong></li>
        <li><span>{v4("phnShared")}</span><strong>{sharedPhoneCount(rows)}</strong></li>
        <li><span>{v4("phnShare")}</span><strong>{phoneShare(lanePhoneCount(rows, "house"), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("phnKnown")}</span><strong>{rows.filter((row) => phoneKnown(row.note)).length}</strong></li>
        <li><span>{v4("phnTwin")}</span><strong>{rows.filter((row) => phoneTwin(row.note)).length}</strong></li>
        <li><span>{v4("phnEven")}</span><strong>{rows.filter((row) => phoneStep(row.note) > 0 && phoneStep(row.note) % 2 === 0).length}</strong></li>
        <li><span>{v4("phnWords")}</span><strong>{rows.reduce((sum, row) => sum + phoneGroups(row.note), 0)}</strong></li>
      </ul>
      <div className="c4-phoneplate-chart" aria-label={v4("phnRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-phoneplate-column" data-on={lane === bar.lane ? "1" : "0"} data-lane={bar.lane} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ height: `${Math.max(12, Math.round((bar.count / maxBar) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{laneLabel(v4, bar.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-phoneplate-tools">
        <input ref={searchRef} className="c4-field c4-phoneplate-search" aria-label={v4("phnSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("phnSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("phnAll") : hueLabel(v4, item)}</button>
        ))}
        {SHAPES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{shapeLabel(v4, item)}</button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("phnAll") : item === "reviewed" ? v4("phnReviewed") : v4("phnUnreviewed")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("phnShow")}</button>
      </div>
      <ul className="c4-phoneplate-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(togglePhone(hidden, item))}>{hidden.includes(item) ? v4("phnShow") : v4("phnHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-phoneplate-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkPhoneReview(reviewed, picked, true))}>{v4("phnBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkPhoneReview(reviewed, picked, false))}>{v4("phnBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-phoneplate-empty">{v4("phnEmpty")}</p>}
      <ol className="c4-phoneplate-board">
        {shown.map((row, index) => {
          const seen = reviewed.includes(row.id);
          return (
            <li key={row.id} className="c4-phoneplate-card" data-on={index === focusAt ? "1" : "0"} data-lane={phoneLane(row.note)} data-hue={phoneHue(row.note)} data-reviewed={seen ? "1" : "0"} data-known={phoneKnown(row.note) ? "1" : "0"}>
              <p className="c4-phoneplate-stamp">{phoneStamp(row.note) || "·"}</p>
              <label className="c4-phoneplate-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label || row.id} onChange={() => setPicked((current) => (current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id]))} /></label>
              <div>
                <strong>{row.label || v4("phnUnmarked")}</strong>
                <p className="c4-phoneplate-meta">{laneLabel(v4, phoneLane(row.note))} · {hueLabel(v4, phoneHue(row.note))} · {v4("phnStep")} {phoneStep(row.note)} · {v4("phnWords")} {phoneGroups(row.note)}{phoneCap(row.note) ? ` · ${v4("phnCap")}` : ""}{phoneTail(row.note) ? ` · ${v4("phnTail")}` : ""}{phoneWide(row.note) ? ` · ${v4("phnWide")}` : ""}{phoneDash(row.note) ? ` · ${v4("phnDash")}` : ""}{phoneLeap(row.note) ? ` · ${v4("phnLeap")}` : ""}{phoneEcho(row.note) ? ` · ${v4("phnEcho")}` : ""}{phoneSpace(row.note) ? ` · ${v4("phnSpace")}` : ""}{phoneTwin(row.note) ? ` · ${v4("phnTwin")}` : ""}</p>
                <div className="c4-phoneplate-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(togglePhoneReview(reviewed, row.id))}>{seen ? v4("phnReviewed") : v4("phnReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(phoneCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("phnCopied") : v4("phnCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="c4-phoneplate-tools">
        <button type="button" className="c4-btn" onClick={() => download("phone-lanes.csv", phoneLanesCsv(rows))}>{v4("phnCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("phone-rows.csv", phoneRowsCsv(shown, reviewed))}>{v4("phnRowCsv")}</button>
      </div>
    </section>
  );
}
