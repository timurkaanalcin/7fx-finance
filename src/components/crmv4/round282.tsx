"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  LNG_KEY,
  LNG_REVIEW_KEY,
  QDR_DENSITY_KEY,
  QDR_KEY,
  QDR_VIEW_KEY,
  QUADRANT_ARCS,
  addQuadrant,
  addQuadrantTag,
  addQuadrantView,
  briskQuadrant,
  bulkLanguageReview,
  bulkQuadrantChampagne,
  bulkQuadrantLog,
  bulkQuadrantSlate,
  bulkQuadrantStow,
  bulkQuadrantTag,
  busiestKeeper,
  clashArcCount,
  cycleInk,
  dipSpan,
  dipSpanFocused,
  dropQuadrantView,
  editQuadrant,
  editQuadrantNote,
  fairKeeper,
  houseFinish,
  idleQuadrant,
  idleQuadrants,
  inkFocused,
  keenArc,
  laneLanguageCount,
  languageCap,
  languageCopy,
  languageDash,
  languageEcho,
  languageHue,
  languageKnown,
  languageLane,
  languageLanes,
  languageLanesCsv,
  languageLeap,
  languageRowsCsv,
  languageShare,
  languageStamp,
  languageStep,
  languageTail,
  languageTwin,
  languageVowel,
  languageWide,
  languageWords,
  lateQuadrant,
  leadingLanguage,
  leadingLanguageHue,
  liftSpan,
  liftSpanFocused,
  lockQuadrantFocused,
  logQuadrantFocused,
  lowerNotch,
  lowerNotchFocused,
  moveQuadrantFocus,
  neighborQuadrantCount,
  overdueQuadrant,
  presentLanguageLanes,
  quadrantBars,
  quadrantCopy,
  quadrantCounts,
  quadrantCsv,
  quadrantDensity,
  quadrantKeepers,
  quadrantTimeline,
  raiseNotch,
  raiseNotchFocused,
  readHiddenLanguages,
  readQuadrantViews,
  readQuadrants,
  readReviewedLanguages,
  reminderQuadrants,
  restingQuadrant,
  setQuadrantFinish,
  setQuadrantLock,
  setQuadrantLogged,
  setQuadrantStar,
  setQuadrantStow,
  sharedLanguageCount,
  sortQuadrants,
  starQuadrantFocused,
  stillArc,
  suggestArc,
  suggestFinish,
  suggestSpan,
  tagQuadrantFocused,
  toggleLanguage,
  toggleLanguageReview,
  visibleLanguageLanes,
  visibleLanguages,
  visibleQuadrants,
  type LanguageReview,
  type LanguageRow,
  type LanguageShape,
  type LanguageValue,
  type QuadrantDensity,
  type QuadrantSight,
  type QuadrantSort,
  type QuadrantTray,
  type QuadrantView,
} from "@/lib/crmv4/round282";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FINISHES = ["ivory", "graphite", "champagne"] as const;
const INKS = ["soot", "gilt", "slate"] as const;
const SPANS = ["20", "40", "80"] as const;
const NOTCHES = ["1", "4", "8"] as const;

const ARC_KEY: Record<string, CrmV4CopyKey> = {
  limb: "qdrLimb",
  vane: "qdrVane",
  shade: "qdrShade",
  horizon: "qdrHorizon",
  keen: "qdrKeen",
  still: "qdrStill",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "qdrAuditSave",
  edit: "qdrAuditEdit",
  note: "qdrAuditNote",
  ink: "qdrAuditInk",
  log: "qdrAuditLog",
  unlog: "qdrAuditUnlog",
  lock: "qdrAuditLock",
  resume: "qdrAuditResume",
  stow: "qdrAuditStow",
  open: "qdrAuditOpen",
  finish: "qdrAuditFinish",
  tag: "qdrAuditTag",
  notch: "qdrAuditNotch",
  span: "qdrAuditSpan",
  dip: "qdrAuditDip",
  star: "qdrAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  region: "lngRegion",
  house: "lngHouse",
  long: "lngLong",
  trio: "lngTrio",
  open: "lngOpen",
  pair: "lngPair",
  mark: "lngMark",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "lngIvory",
  graphite: "lngGraphite",
  champagne: "lngChampagne",
};

type NameRow = {
  id?: string;
  name?: string | null;
  language?: string | null;
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

function arcLabel(v4: V4, arc: string): string {
  const key = ARC_KEY[arc];
  return key ? v4(key) : v4("qdrBlank");
}

function finishLabel(v4: V4, finish: string): string {
  if (finish === "IVORY") return v4("qdrIvory");
  if (finish === "GRAPHITE") return v4("qdrGraphite");
  if (finish === "CHAMPAGNE") return v4("qdrChampagne");
  return v4("qdrBlankFinish");
}

function inkLabel(v4: V4, ink: string): string {
  if (ink === "soot") return v4("qdrSoot");
  if (ink === "gilt") return v4("qdrGilt");
  if (ink === "slate") return v4("qdrSlate");
  return v4("qdrBlankInk");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("lngUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("lngUnmarked");
}

export function QuadrantSights({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<QuadrantSight[]>([]);
  const [views, setViews] = useState<QuadrantView[]>([]);
  const [density, setDensity] = useState<QuadrantDensity>("open");
  const [sheet, setSheet] = useState<"board" | "index">("board");
  const [tray, setTray] = useState<QuadrantTray>("deck");
  const [query, setQuery] = useState("");
  const [keeperFilter, setKeeperFilter] = useState("all");
  const [finishFilter, setFinishFilter] = useState("all");
  const [inkFilter, setInkFilter] = useState("all");
  const [arcFilter, setArcFilter] = useState("all");
  const [spanFilter, setSpanFilter] = useState("all");
  const [notchFilter, setNotchFilter] = useState("all");
  const [houseOnly, setHouseOnly] = useState(false);
  const [keenOnly, setKeenOnly] = useState(false);
  const [stillOnly, setStillOnly] = useState(false);
  const [sort, setSort] = useState<QuadrantSort>("arc");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [keeper, setKeeper] = useState("");
  const [arc, setArc] = useState("");
  const [finish, setFinish] = useState("");
  const [ink, setInk] = useState("");
  const [spanNo, setSpanNo] = useState("");
  const [notchNo, setNotchNo] = useState("1");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [copied, setCopied] = useState("");
  const [desk, setDesk] = useState("limb");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readQuadrants(readJson(QDR_KEY, [])));
    setViews(readQuadrantViews(readJson(QDR_VIEW_KEY, [])));
    setDensity(quadrantDensity(readJson(QDR_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: QuadrantSight[]) {
    setCards(next);
    writeJson(QDR_KEY, next);
  }
  function storeViews(next: QuadrantView[]) {
    setViews(next);
    writeJson(QDR_VIEW_KEY, next);
  }
  function storeDensity(next: QuadrantDensity) {
    setDensity(next);
    writeJson(QDR_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortQuadrants(visibleQuadrants(cards, tray, query, keeperFilter, finishFilter, inkFilter, arcFilter, spanFilter, notchFilter, houseOnly, keenOnly, stillOnly), sort),
    [cards, tray, query, keeperFilter, finishFilter, inkFilter, arcFilter, spanFilter, notchFilter, houseOnly, keenOnly, stillOnly, sort],
  );
  const counts = quadrantCounts(cards, shown, desk);
  const bars = quadrantBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = quadrantTimeline(cards);
  const keepers = quadrantKeepers(cards);
  const ids = shown.map((card) => card.id);
  const suggested = suggestFinish(cards);
  const fair = fairKeeper(cards, keepers.join(","));
  const busy = busiestKeeper(cards);
  const reminders = reminderQuadrants(cards);
  const idling = idleQuadrants(cards);
  const spanHint = suggestSpan(cards, clock);
  const arcHint = suggestArc(clock);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setKeeper("");
        setArc("");
        setFinish("");
        setInk("");
        setSpanNo("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveQuadrantFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveQuadrantFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        if (!viewer) store(logQuadrantFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        if (!viewer) store(lockQuadrantFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        if (!viewer) store(inkFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        if (!viewer) store(liftSpanFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        if (!viewer) store(dipSpanFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        if (!viewer) store(tagQuadrantFocused(cards, ids, focusAt, "e"));
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        if (!viewer) store(starQuadrantFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        if (!viewer) store(raiseNotchFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "y" || event.key === "Y") {
        event.preventDefault();
        if (!viewer) store(lowerNotchFocused(cards, ids, focusAt));
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

  function applyView(view: QuadrantView) {
    setTray(view.tray);
    setQuery(view.query);
    setKeeperFilter(view.keeper || "all");
    setFinishFilter(view.finish);
    setInkFilter(view.ink);
    setArcFilter(view.arc);
    setSpanFilter(view.span);
    setNotchFilter(view.notch);
  }

  return (
    <section className="c4-quadrant" aria-label={v4("qdrTitle")} data-cards="1" data-desk="deck" data-role={role} data-density={density} data-sheet={sheet}>
      <header className="c4-quadrant-mast">
        <p className="c4-quadrant-seal" data-logo="mono">{v4("qdrLogo")}</p>
        <div>
          <p className="c4-quadrant-kicker">{v4("qdrSub")}</p>
          <h2 className="c4-title">{v4("qdrTitle")}</h2>
        </div>
        <ol className="c4-quadrant-index" aria-label={v4("qdrTitle")}>
          <li data-tone="gold">{v4("qdrGilt")}</li>
          <li data-tone="ink">{v4("qdrSlate")}</li>
          <li data-tone="ivory">{v4("qdrSoot")}</li>
        </ol>
      </header>
      <p className="c4-quadrant-links">
        <Link href={crmv4Href(base, "lng")}>{v4("lngTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("qdrCustomers")}</Link>
        <Link href={crmv4Href(base, "accents")}>{v4("qdrWeek")}</Link>
      </p>
      {viewer && <p className="c4-quadrant-note">{v4("qdrViewer")}</p>}
      <p className="c4-quadrant-lead">{v4("qdrKeys")}</p>
      <p className="c4-quadrant-hint">{v4("qdrHint")}</p>
      <p className="c4-quadrant-notice" role="status">{v4("qdrNotice")} {counts.overdue}</p>
      <ol className="c4-quadrant-dials" aria-label={v4("qdrChart")}>
        <li><span>{v4("qdrDeck")}</span><strong>{counts.deck}</strong></li>
        <li><span>{v4("qdrCase")}</span><strong>{counts.case}</strong></li>
        <li><span>{v4("qdrLocker")}</span><strong>{counts.locker}</strong></li>
        <li><span>{v4("qdrLogged")}</span><strong>{counts.logged}</strong></li>
        <li><span>{v4("qdrOverdue")}</span><strong>{counts.overdue}</strong></li>
        <li><span>{v4("qdrEven")}</span><strong>{counts.even}</strong></li>
      </ol>
      <div className="c4-quadrant-chart" aria-label={v4("qdrBars")}>
        {bars.map((bar) => (
          <button key={bar.arc} type="button" className="c4-quadrant-column" data-on={arcFilter === bar.arc ? "1" : "0"} onClick={() => setArcFilter(arcFilter === bar.arc ? "all" : bar.arc)}>
            <i style={{ height: `${Math.max(8, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{arcLabel(v4, bar.arc)}</span>
          </button>
        ))}
      </div>
      <ol className="c4-quadrant-time" aria-label={v4("qdrIndex")}>
        {timeline.map((lane) => (
          <li key={lane.notch}><span>{lane.notch}</span><strong>{lane.titles.join(" · ")}</strong></li>
        ))}
      </ol>
      <form className="c4-quadrant-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const id = `qdr-${Date.now().toString(36)}`;
        store(addQuadrant(cards, { id, title, note, keeper, arc, finish, ink, span: spanNo, notch: notchNo, tags }));
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("qdrEdit")} aria-required={false} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} placeholder={v4("qdrTitle")} />
        <input className="c4-field" aria-label={v4("qdrNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} placeholder={v4("qdrNote")} />
        <input className="c4-field" aria-label={v4("qdrFair")} aria-required={false} value={keeper} disabled={viewer} onChange={(event) => setKeeper(event.target.value)} placeholder={v4("qdrBlankKeeper")} />
        <select className="c4-field" aria-label={v4("qdrArc")} value={arc} disabled={viewer} onChange={(event) => setArc(event.target.value)}>
          <option value="">{v4("qdrBlankArc")}</option>
          {QUADRANT_ARCS.map((item) => <option key={item} value={item}>{arcLabel(v4, item)}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("qdrFinish")} value={finish} disabled={viewer} onChange={(event) => setFinish(event.target.value)}>
          <option value="">{v4("qdrBlankFinish")}</option>
          {FINISHES.map((item) => <option key={item} value={item}>{finishLabel(v4, item.toUpperCase())}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("qdrTone")} value={ink} disabled={viewer} onChange={(event) => setInk(event.target.value)}>
          <option value="">{v4("qdrBlankInk")}</option>
          {INKS.map((item) => <option key={item} value={item}>{inkLabel(v4, item)}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("qdrSpan")} value={spanNo} disabled={viewer} onChange={(event) => setSpanNo(event.target.value)}>
          <option value="">{v4("qdrBlankSpan")}</option>
          {SPANS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("qdrNotch")} value={notchNo} disabled={viewer} onChange={(event) => setNotchNo(event.target.value)}>
          {NOTCHES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input className="c4-field" aria-label={v4("qdrTags")} aria-required={false} value={tags} disabled={viewer} onChange={(event) => setTags(event.target.value)} placeholder={v4("qdrTags")} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("qdrAdd")}</button>
      </form>
      <div className="c4-quadrant-tools">
        <input ref={searchRef} className="c4-field c4-quadrant-search" aria-label={v4("qdrSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("qdrSearch")} />
        {(["deck", "case", "locker"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "deck" ? v4("qdrDeck") : item === "case" ? v4("qdrCase") : v4("qdrLocker")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "open" : "close")}>{v4("qdrTight")}</button>
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("qdrHouse")}</button>
        <button type="button" className="c4-chip" data-on={keenOnly ? "1" : "0"} onClick={() => setKeenOnly((value) => !value)}>{v4("qdrKeen")}</button>
        <button type="button" className="c4-chip" data-on={stillOnly ? "1" : "0"} onClick={() => setStillOnly((value) => !value)}>{v4("qdrStill")}</button>
        <select className="c4-field" aria-label={v4("qdrFair")} value={keeperFilter} onChange={(event) => setKeeperFilter(event.target.value)}>
          <option value="all">{v4("qdrAll")}</option>
          {keepers.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("qdrFinish")} value={finishFilter} onChange={(event) => setFinishFilter(event.target.value)}>
          <option value="all">{v4("qdrAll")}</option>
          {FINISHES.map((item) => <option key={item} value={item}>{finishLabel(v4, item.toUpperCase())}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("qdrTone")} value={inkFilter} onChange={(event) => setInkFilter(event.target.value)}>
          <option value="all">{v4("qdrAll")}</option>
          {INKS.map((item) => <option key={item} value={item}>{inkLabel(v4, item)}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("qdrArc")} value={arcFilter} onChange={(event) => setArcFilter(event.target.value)}>
          <option value="all">{v4("qdrAll")}</option>
          <option value="keen">{v4("qdrKeen")}</option>
          <option value="still">{v4("qdrStill")}</option>
          {QUADRANT_ARCS.map((item) => <option key={item} value={item}>{arcLabel(v4, item)}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("qdrSpan")} value={spanFilter} onChange={(event) => setSpanFilter(event.target.value)}>
          <option value="all">{v4("qdrAll")}</option>
          {SPANS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("qdrNotch")} value={notchFilter} onChange={(event) => setNotchFilter(event.target.value)}>
          <option value="all">{v4("qdrAll")}</option>
          {NOTCHES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("qdrArc")} value={desk} onChange={(event) => setDesk(event.target.value)}>
          {QUADRANT_ARCS.map((item) => <option key={item} value={item}>{arcLabel(v4, item)}</option>)}
        </select>
      </div>
      <form className="c4-quadrant-views" onSubmit={(event) => {
        event.preventDefault();
        if (viewer || !viewName.trim()) return;
        storeViews(addQuadrantView(views, { id: `view-${Date.now().toString(36)}`, name: viewName, tray, query, keeper: keeperFilter, finish: finishFilter, ink: inkFilter, arc: arcFilter, span: spanFilter, notch: notchFilter }));
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("qdrViewName")} aria-required={false} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} placeholder={v4("qdrViewName")} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("qdrSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-quadrant-view">
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("qdrApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropQuadrantView(views, view.id))}>{v4("qdrDropView")}</button>
          </span>
        ))}
      </form>
      {picked.length > 0 && (
        <div className="c4-quadrant-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkQuadrantLog(cards, picked))}>{v4("qdrBulkLog")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkQuadrantStow(cards, picked))}>{v4("qdrBulkStow")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkQuadrantSlate(cards, picked))}>{v4("qdrBulkSlate")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkQuadrantChampagne(cards, picked))}>{v4("qdrBulkChampagne")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkQuadrantTag(cards, picked, "w"))}>{v4("qdrBulkTag")}</button>
        </div>
      )}
      <p className="c4-quadrant-meta">{v4("qdrSuggest")} {finishLabel(v4, suggested)} · {v4("qdrFair")} {fair} · {v4("qdrBusy")} {busy || v4("qdrBlankKeeper")} · {v4("qdrNeighbors")} {neighborQuadrantCount(cards)} · {v4("qdrClash")} {clashArcCount(cards)} · {v4("qdrSpanHint")} {spanHint} · {v4("qdrArcHint")} {arcLabel(v4, arcHint)}</p>
      {(reminders.length > 0 || idling.length > 0) && (
        <p className="c4-quadrant-meta">{v4("qdrDue")} {reminders.map((card) => card.title).join(" · ")} · {v4("qdrIdle")} {idling.map((card) => card.title).join(" · ")}</p>
      )}
      {!shown.length && <p className="c4-quadrant-empty">{v4("qdrEmpty")}</p>}
      <ol className={sheet === "index" ? "c4-quadrant-index-list" : "c4-quadrant-board"} data-density={density}>
        {shown.map((card, index) => (
          <li key={card.id} className="c4-quadrant-card" data-on={index === focusAt ? "1" : "0"} data-logged={card.logged ? "1" : "0"} data-overdue={overdueQuadrant(card) ? "1" : "0"} data-keen={keenArc(card.arc) ? "1" : "0"} data-still={stillArc(card.arc) ? "1" : "0"} data-house={houseFinish(card.finish) ? "1" : "0"} data-brisk={briskQuadrant(card) ? "1" : "0"} data-idle={idleQuadrant(card) ? "1" : "0"} data-resting={restingQuadrant(card) ? "1" : "0"} data-late={lateQuadrant(card, desk) ? "1" : "0"}>
            <ol className="c4-quadrant-ticks" aria-hidden="true">
              {NOTCHES.map((tick) => <li key={tick} data-on={String(card.notch) === tick ? "1" : "0"} />)}
            </ol>
            <label className="c4-quadrant-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => togglePick(card.id)} /></label>
            <div>
              <input className="c4-field" aria-label={v4("qdrEdit")} value={card.title} disabled={viewer} onChange={(event) => store(editQuadrant(cards, card.id, event.target.value))} />
              <input className="c4-field" aria-label={v4("qdrEditNote")} aria-required={false} value={card.note} disabled={viewer} onChange={(event) => store(editQuadrantNote(cards, card.id, event.target.value))} />
              <p className="c4-quadrant-meta">{card.keeper || v4("qdrBlankKeeper")} · {arcLabel(v4, card.arc)} · {finishLabel(v4, card.finish)} · {inkLabel(v4, card.ink)} · {card.span ?? v4("qdrBlankSpan")} · {v4("qdrNotch")} {card.notch} · {card.tags.join(" ") || v4("qdrTags")}</p>
              <p className="c4-quadrant-meta">{arcLabel(v4, desk)} · {AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : v4("qdrAuditSave")}</p>
              <div className="c4-quadrant-tools">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setQuadrantLogged(cards, card.id, !card.logged))}>{card.logged ? v4("qdrUnlog") : v4("qdrLog")}</button>
                <button type="button" className="c4-btn" disabled={viewer || card.stowed} onClick={() => store(setQuadrantLock(cards, card.id, !card.locked))}>{card.locked ? v4("qdrResume") : v4("qdrLock")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setQuadrantStow(cards, card.id, !card.stowed))}>{card.stowed ? v4("qdrOpenAgain") : v4("qdrStowed")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setQuadrantStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("qdrUnstar") : v4("qdrStar")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleInk(cards, card.id))}>{v4("qdrTone")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftSpan(cards, card.id))}>{v4("qdrLift")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(dipSpan(cards, card.id))}>{v4("qdrDip")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseNotch(cards, card.id))}>{v4("qdrRaise")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerNotch(cards, card.id))}>{v4("qdrLower")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setQuadrantFinish(cards, card.id, card.finish === "CHAMPAGNE" ? "graphite" : "champagne"))}>{v4("qdrFinish")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addQuadrantTag(cards, card.id, "e"))}>{v4("qdrTags")}</button>
                <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(quadrantCopy(card)); setCopied(card.id); }}>{copied === card.id ? v4("qdrCopied") : v4("qdrCopy")}</button>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <button type="button" className="c4-btn" onClick={() => { setSort(sort === "arc" ? "keeper" : "arc"); }}>{sort === "arc" ? v4("qdrSortKeeper") : v4("qdrSortArc")}</button>
      <button type="button" className="c4-btn" onClick={() => download("quadrant-sights.csv", quadrantCsv(shown, desk))}>{v4("qdrCsv")}</button>
    </section>
  );
}

export function LanguagePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: NameRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [shape, setShape] = useState<LanguageShape>("all");
  const [review, setReview] = useState<LanguageReview>("all");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<LanguageRow[]>(() => (queue.data?.users || []).map((row, index) => ({
    id: row.id ? `name-${row.id}` : `name-${index}`,
    label: textField(row.name),
    note: { language: textField(row.language) } satisfies LanguageValue,
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
    const present = presentLanguageLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenLanguages(readJson(LNG_KEY, []), present);
    const nextReviewed = readReviewedLanguages(readJson(LNG_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(LNG_KEY, nextHidden);
    writeJson(LNG_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentLanguageLanes(rows);
  const lanes = visibleLanguageLanes(present, hidden, showHidden);
  const shown = visibleLanguages(rows, lane, hue, query, review, reviewed, shape).filter((row) => {
    const token = languageLane(row.note);
    if (!token) return true;
    return showHidden || !hidden.includes(token);
  });
  const focusAt = shown.length ? focus % shown.length : 0;
  const bars = languageLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingLanguage(rows);
  const leadHue = leadingLanguageHue(rows);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveQuadrantFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveQuadrantFocus(index, shown.length, -1));
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
    writeJson(LNG_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(LNG_REVIEW_KEY, next);
  }
  return (
    <section className="c4-languageplate" aria-label={v4("lngTitle")} data-plates="1" data-names={rows.length} data-role={role}>
      <header className="c4-languageplate-mast">
        <p className="c4-languageplate-seal" data-logo="mono">{v4("lngLogo")}</p>
        <div>
          <p className="c4-languageplate-kicker">{v4("lngSub")}</p>
          <h2 className="c4-title">{v4("lngTitle")}</h2>
        </div>
      </header>
      <ol className="c4-languageplate-index" aria-label={v4("lngTitle")}>
        <li data-tone="gold">{v4("lngHouse")}</li>
        <li data-tone="ink">{v4("lngRegion")}</li>
        <li data-tone="ivory">{v4("lngPair")}</li>
        <li data-tone="mist">{v4("lngTrio")}</li>
        <li data-tone="line">{v4("lngLong")}</li>
      </ol>
      <p className="c4-languageplate-links">
        <Link href={crmv4Href(base, "qdr")}>{v4("qdrTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("qdrCustomers")}</Link>
        <Link href={crmv4Href(base, "accents")}>{v4("qdrWeek")}</Link>
      </p>
      <p className="c4-languageplate-hint">{v4("lngHint")}</p>
      {viewer && <p className="c4-languageplate-note">{v4("lngViewer")}</p>}
      {queue.loading && <p className="c4-languageplate-meta">{v4("lngEmpty")}</p>}
      {queue.error && <p className="c4-languageplate-meta">{queue.error}</p>}
      <ul className="c4-languageplate-kpis" aria-label={v4("lngRules")}>
        <li><span>{v4("lngLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("lngUnmarked")}</strong></li>
        <li><span>{v4("lngToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("lngUnmarked")}</strong></li>
        <li><span>{v4("lngShared")}</span><strong>{sharedLanguageCount(rows)}</strong></li>
        <li><span>{v4("lngShare")}</span><strong>{languageShare(laneLanguageCount(rows, "house"), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("lngKnown")}</span><strong>{rows.filter((row) => languageKnown(row.note)).length}</strong></li>
        <li><span>{v4("lngTwin")}</span><strong>{rows.filter((row) => languageTwin(row.note)).length}</strong></li>
        <li><span>{v4("lngVowel")}</span><strong>{rows.filter((row) => languageVowel(row.note)).length}</strong></li>
        <li><span>{v4("lngWords")}</span><strong>{rows.reduce((sum, row) => sum + languageWords(row.note), 0)}</strong></li>
      </ul>
      <div className="c4-languageplate-chart" aria-label={v4("lngRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-languageplate-column" data-on={lane === bar.lane ? "1" : "0"} data-lane={bar.lane} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ height: `${Math.max(12, Math.round((bar.count / maxBar) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{laneLabel(v4, bar.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-languageplate-tools">
        <input ref={searchRef} className="c4-field c4-languageplate-search" aria-label={v4("lngSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("lngSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("lngAll") : hueLabel(v4, item)}</button>
        ))}
        {(["all", "region", "house", "long", "trio", "open", "pair", "mark", "wide", "dash", "leap", "twin", "known", "echo", "vowel"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>
            {item === "all" ? v4("lngShapeAll") : item === "wide" ? v4("lngShapeWide") : item === "dash" ? v4("lngShapeDash") : item === "leap" ? v4("lngShapeLeap") : item === "twin" ? v4("lngShapeTwin") : item === "known" ? v4("lngShapeKnown") : item === "echo" ? v4("lngShapeEcho") : item === "vowel" ? v4("lngShapeVowel") : laneLabel(v4, item)}
          </button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("lngAll") : item === "reviewed" ? v4("lngReviewed") : v4("lngUnreviewed")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("lngShow")}</button>
      </div>
      <ul className="c4-languageplate-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleLanguage(hidden, item))}>{hidden.includes(item) ? v4("lngShow") : v4("lngHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-languageplate-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkLanguageReview(reviewed, picked, true))}>{v4("lngBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkLanguageReview(reviewed, picked, false))}>{v4("lngBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-languageplate-empty">{v4("lngEmpty")}</p>}
      <ol className="c4-languageplate-board">
        {shown.map((row, index) => {
          const seen = reviewed.includes(row.id);
          return (
            <li key={row.id} className="c4-languageplate-card" data-on={index === focusAt ? "1" : "0"} data-lane={languageLane(row.note)} data-hue={languageHue(row.note)} data-reviewed={seen ? "1" : "0"} data-known={languageKnown(row.note) ? "1" : "0"}>
              <p className="c4-languageplate-stamp">{languageStamp(row.note) || "·"}</p>
              <label className="c4-languageplate-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label || row.id} onChange={() => setPicked((current) => (current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id]))} /></label>
              <div>
                <strong>{row.label || v4("lngUnmarked")}</strong>
                <p className="c4-languageplate-meta">{laneLabel(v4, languageLane(row.note))} · {hueLabel(v4, languageHue(row.note))} · {v4("lngStep")} {languageStep(row.note)} · {v4("lngWords")} {languageWords(row.note)}{languageCap(row.note) ? ` · ${v4("lngCap")}` : ""}{languageTail(row.note) ? ` · ${v4("lngTail")}` : ""}{languageWide(row.note) ? ` · ${v4("lngWide")}` : ""}{languageDash(row.note) ? ` · ${v4("lngDash")}` : ""}{languageLeap(row.note) ? ` · ${v4("lngLeap")}` : ""}{languageEcho(row.note) ? ` · ${v4("lngEcho")}` : ""}</p>
                <div className="c4-languageplate-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleLanguageReview(reviewed, row.id))}>{seen ? v4("lngReviewed") : v4("lngReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(languageCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("lngCopied") : v4("lngCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="c4-languageplate-tools">
        <button type="button" className="c4-btn" onClick={() => download("language-lanes.csv", languageLanesCsv(rows))}>{v4("lngCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("language-rows.csv", languageRowsCsv(shown, reviewed))}>{v4("lngRowCsv")}</button>
      </div>
    </section>
  );
}
