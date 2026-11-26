"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  RTN_HIDE_KEY,
  RTN_REVIEW_KEY,
  PLN_DENSITY_KEY,
  PLN_KEY,
  PLN_VIEW_KEY,
  PLN_POINTS,
  addSpangle,
  addSpangleTag,
  addSpangleView,
  briskSpangle,
  bulkRtnReview,
  bulkSpangleCoffer,
  bulkSpangleInk,
  bulkSpangleRaise,
  bulkSpangleTag,
  busiestKeeper,
  dropSpangleView,
  editSpangle,
  editSpangleNote,
  rtnShort,
  rtnCopy,
  rtnDigit,
  rtnEven,
  rtnFamily,
  rtnFirst,
  rtnScope,
  rtnHeld,
  rtnShut,
  rtnHue,
  rtnPair,
  rtnReturn,
  rtnLane,
  rtnLanes,
  rtnLanesCsv,
  rtnLength,
  rtnLetter,
  rtnLower,
  rtnMixed,
  rtnOpen,
  rtnRowsCsv,
  rtnShare,
  rtnSpace,
  rtnStamp,
  rtnTail,
  rtnUpper,
  rtnWait,
  rtnVowel,
  fairKeeper,
  finishFocused,
  spangleBars,
  spangleCopy,
  spangleCounts,
  spangleCsv,
  spangleDensity,
  spangleWarm,
  spangleCool,
  spangleTimeline,
  spangleKeepers,
  idleSpangle,
  laneRtnCount,
  lateSpangle,
  leadingRtn,
  leadingRtnHue,
  lowerSlaFocused,
  lowerDepthFocused,
  moveSpangleFocus,
  overdueSpangle,
  pinSpangleFocused,
  presentRtnLanes,
  raiseSlaFocused,
  raiseDepthFocused,
  readHiddenRtn,
  readSpangles,
  readSpangleViews,
  readReviewedRtn,
  reminderSpangles,
  restingSpangle,
  setSpangleCoffer,
  setSpangleFinish,
  setSpangleFocused,
  setSpanglePin,
  setSpangleRaised,
  setSpangleStar,
  sortSpangles,
  starSpangleFocused,
  suggestQuarter,
  suggestFoil,
  suggestPoint,
  toggleRtn,
  toggleRtnReview,
  visibleRtnLanes,
  visibleRtn,
  visibleSpangles,
  type RtnReview,
  type RtnRow,
  type RtnShape,
  type RtnValue,
  type Spangle,
  type SpangleDensity,
  type SpangleSort,
  type SpangleTray,
  type SpangleView,
} from "@/lib/crmv4/round376";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FINISHES = ["GOLD", "IVORY", "INK"] as const;
const SLAS = ["12", "24", "36", "48"] as const;
const BEADS = ["3", "6", "9"] as const;

const SEASON_KEY: Record<string, CrmV4CopyKey> = {
  dawn: "plnDawn",
  noon: "plnNoon",
  dusk: "plnDusk",
  night: "plnNight",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "plnAuditSave",
  edit: "plnAuditEdit",
  note: "plnAuditNote",
  film: "plnAuditFilm",
  raise: "plnAuditRaise",
  free: "plnAuditFree",
  pin: "plnAuditPin",
  return: "plnAuditReturn",
  vault: "plnAuditVault",
  open: "plnAuditOpen",
  tag: "plnAuditTag",
  bead: "plnAuditBead",
  sla: "plnAuditSla",
  lower: "plnAuditLower",
  star: "plnAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  court: "rtnLaneCourt",
  shut: "rtnLaneShut",
  wait: "rtnLaneWait",
  bench: "rtnLaneBench",
  return: "rtnLaneReturn",
  pair: "rtnPair",
  scope: "rtnScope",
  short: "rtnShort",
  span: "rtnSpan",
  digit: "rtnStampLane",
  openv: "rtnVowel",
  bare: "rtnBare",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "rtnChampagne",
  ivory: "rtnIvory",
  graphite: "rtnGraphite",
};

const SHAPE_KEY: Record<RtnShape, CrmV4CopyKey> = {
  all: "rtnShapeAll",
  court: "rtnShapeCourt",
  shut: "rtnShapeShut",
  wait: "rtnShapeWait",
  return: "rtnShapeReturn",
  pair: "rtnShapePair",
  scope: "rtnShapeScope",
  short: "rtnShapeShort",
  span: "rtnShapeSpan",
  digit: "rtnShapeDigit",
  openv: "rtnShapeVowel",
  bare: "rtnShapeBare",
  open: "rtnShapeOpen",
  soon: "rtnShapeOpen",
  letter: "rtnShapeBare",
  mixed: "rtnShapeDigit",
  upper: "rtnShapeUpper",
  lower: "rtnShapeBare",
  space: "rtnShapeSpace",
  even: "rtnShapeEven",
  odd: "rtnShapeEven",
  tail: "rtnShapeDigit",
  first: "rtnShapeBare",
  held: "rtnShapeSpan",
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

function watchLabel(v4: V4, watch: string): string {
  const key = SEASON_KEY[watch];
  return key ? v4(key) : v4("plnBlankWindow");
}

function finishLabel(v4: V4, finish: string): string {
  if (finish === "GOLD") return v4("plnGold");
  if (finish === "INK") return v4("plnInk");
  if (finish === "IVORY") return v4("plnIvory");
  return v4("plnAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("rtnBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("rtnBlank");
}

export function PaillonSpangles({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Spangle[]>([]);
  const [views, setViews] = useState<SpangleView[]>([]);
  const [density, setDensity] = useState<SpangleDensity>("open");
  const [tray, setTray] = useState<SpangleTray>("bench");
  const [query, setQuery] = useState("");
  const [watcherFilter, setWatcherFilter] = useState("");
  const [finishFilter, setFinishFilter] = useState("all");
  const [watchFilter, setWatchFilter] = useState("all");
  const [slaFilter, setSlaFilter] = useState("all");
  const [beadFilter, setBeadFilter] = useState("all");
  const [sort, setSort] = useState<SpangleSort>("watch");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [watcher, setWatcher] = useState("");
  const [watch, setWatch] = useState("");
  const [finish, setFinish] = useState("");
  const [slaNo, setSlaNo] = useState("");
  const [beadNo, setBeadNo] = useState("");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteId, setNoteId] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [station, setStation] = useState("dawn");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readSpangles(readJson(PLN_KEY, [])));
    setViews(readSpangleViews(readJson(PLN_VIEW_KEY, [])));
    setDensity(spangleDensity(readJson(PLN_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Spangle[]) {
    setCards(next);
    writeJson(PLN_KEY, next);
  }
  function storeViews(next: SpangleView[]) {
    setViews(next);
    writeJson(PLN_VIEW_KEY, next);
  }
  function storeDensity(next: SpangleDensity) {
    setDensity(next);
    writeJson(PLN_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortSpangles(visibleSpangles(cards, tray, query, watcherFilter, finishFilter, watchFilter, slaFilter, beadFilter), sort),
    [cards, tray, query, watcherFilter, finishFilter, watchFilter, slaFilter, beadFilter, sort],
  );
  const counts = spangleCounts(cards, shown, station);
  const bars = spangleBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = spangleTimeline(cards);
  const reminders = reminderSpangles(cards);
  const watchers = spangleKeepers(cards);
  const busy = busiestKeeper(cards);
  const fair = fairKeeper(cards, watchers.join(","));
  const suggestedFinish = suggestFoil(cards);
  const suggestedSla = suggestQuarter(cards, clock);
  const suggestedWatch = suggestPoint(clock);
  const focused = shown[Math.min(focusAt, Math.max(0, shown.length - 1))];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "/" && !typingTarget(event)) {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (typingTarget(event) || viewer) return;
      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        titleRef.current?.focus();
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("paillon-spangles.csv", spangleCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveSpangleFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveSpangleFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addSpangle(cards, { title, note, watcher, watch, sla: slaNo, finish, bead: beadNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-paillon" aria-label={v4("plnTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-paillon-mast">
        <p className="c4-paillon-seal" data-logo="mono">{v4("plnLogo")}</p>
        <div>
          <p className="c4-paillon-kicker">{v4("plnSub")}</p>
          <h2 className="c4-title">{v4("plnTitle")}</h2>
        </div>
        <p className="c4-paillon-count">{shown.length}</p>
      </header>
      <p className="c4-paillon-links">
        <Link href={crmv4Href(base, "rtn")}>{v4("rtnTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("plnCustomers")}</Link>
      </p>
      <p className="c4-paillon-hint">{v4("plnHint")}</p>
      {viewer && <p className="c4-paillon-note">{v4("plnViewer")}</p>}
      <p className="c4-paillon-meta">{v4("plnFair")} {fair || "—"} · {v4("plnBusy")} {busy || "—"} · {v4("plnSuggest")} {watchLabel(v4, suggestedWatch)} · {finishLabel(v4, suggestedFinish)} · {suggestedSla}</p>
      <ol className="c4-paillon-index" aria-label={v4("plnRemind")}>
        <li data-tone="gold">{v4("plnOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("plnIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("plnBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("plnResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-paillon-remind c4-paillon-notices" role="status" aria-label={v4("plnRemind")}>
          {reminders.map((name) => <li key={name}>{v4("plnOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-paillon-chart" aria-label={v4("plnChart")}>
        {bars.map((bar) => (
          <button key={bar.watch} type="button" className="c4-paillon-column" data-on={watchFilter === bar.watch ? "1" : "0"} onClick={() => setWatchFilter(watchFilter === bar.watch ? "all" : bar.watch)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{watchLabel(v4, bar.watch)}</span>
          </button>
        ))}
      </div>
      <form className="c4-paillon-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("plnEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("plnEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("plnNote")}<input className="c4-field" aria-label={v4("plnNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("plnWatcher")}<input className="c4-field" aria-label={v4("plnWatcher")} aria-required={false} value={watcher} maxLength={24} disabled={viewer} onChange={(event) => setWatcher(event.target.value)} /></label>
        <label className="c4-lab">{v4("plnWindow")}<select className="c4-field" aria-label={v4("plnWindow")} value={watch} disabled={viewer} onChange={(event) => setWatch(event.target.value)}><option value="">{v4("plnBlankWindow")}</option>{PLN_POINTS.map((item) => <option key={item} value={item}>{watchLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("plnFilm")}<select className="c4-field" aria-label={v4("plnFilm")} value={finish} disabled={viewer} onChange={(event) => setFinish(event.target.value)}><option value="">{v4("plnAll")}</option>{FINISHES.map((item) => <option key={item} value={item}>{finishLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("plnSla")}<select className="c4-field" aria-label={v4("plnSla")} value={slaNo} disabled={viewer} onChange={(event) => setSlaNo(event.target.value)}><option value="">{v4("plnAll")}</option>{SLAS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("plnBead")}<select className="c4-field" aria-label={v4("plnBead")} value={beadNo} disabled={viewer} onChange={(event) => setBeadNo(event.target.value)}><option value="">{v4("plnAll")}</option>{BEADS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("plnTag")}<input className="c4-field" aria-label={v4("plnTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("plnAdd")}</button>
      </form>
      <div className="c4-paillon-tools">
        <input ref={searchRef} className="c4-field c4-paillon-search" aria-label={v4("plnSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("plnSearch")} />
        {(["bench", "pin", "vault"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "bench" ? "plnBench" : item === "pin" ? "plnPin" : "plnVault")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={watchFilter === "inner" ? "1" : "0"} onClick={() => setWatchFilter(watchFilter === "inner" ? "all" : "inner")}>{v4("plnInner")}</button>
        <button type="button" className="c4-chip" data-on={watchFilter === "outer" ? "1" : "0"} onClick={() => setWatchFilter(watchFilter === "outer" ? "all" : "outer")}>{v4("plnOuter")}</button>
        {FINISHES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={finishFilter === item ? "1" : "0"} onClick={() => setFinishFilter(finishFilter === item ? "all" : item)}>{finishLabel(v4, item)}</button>
        ))}
        {SLAS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={slaFilter === item ? "1" : "0"} onClick={() => setSlaFilter(slaFilter === item ? "all" : item)}>{item}</button>
        ))}
        {BEADS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={beadFilter === item ? "1" : "0"} onClick={() => setBeadFilter(beadFilter === item ? "all" : item)}>{item}</button>
        ))}
        {watchers.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={watcherFilter === name ? "1" : "0"} onClick={() => setWatcherFilter(watcherFilter === name ? "" : name)}>{name}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "watcher" ? "1" : "0"} onClick={() => setSort(sort === "watcher" ? "watch" : "watcher")}>{sort === "watcher" ? v4("plnSortWatcher") : v4("plnSortWindow")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("plnTight") : v4("plnOpen")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("plnTimeline")}</button>
        <label className="c4-lab">{v4("plnDesk")}<select className="c4-field" aria-label={v4("plnDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{PLN_POINTS.map((item) => <option key={item} value={item}>{watchLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-paillon-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addSpangleView(views, { id, name: viewName, tray, query, watcher: watcherFilter, finish: finishFilter, watch: watchFilter, sla: slaFilter, bead: beadFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("plnViewName")}<input className="c4-field" aria-label={v4("plnViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("plnSaveView")}</button>
      </form>
      <ul className="c4-paillon-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setWatcherFilter(view.watcher); setFinishFilter(view.finish); setWatchFilter(view.watch); setSlaFilter(view.sla); setBeadFilter(view.bead); }}>{v4("plnApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropSpangleView(views, view.id))}>{v4("plnDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-paillon-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSpangleRaise(cards, picked))}>{v4("plnBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSpangleCoffer(cards, picked))}>{v4("plnBulkVault")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSpangleInk(cards, picked))}>{v4("plnBulkAsh")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSpangleTag(cards, picked))}>{v4("plnBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("paillon-spangles.csv", spangleCsv(shown, station))}>{v4("plnCsv")}</button>
        <p className="c4-paillon-meta">{v4("plnKeys")} / c x a j k · {v4("plnQuiet")} {counts.quiet} · {v4("plnInner")} {counts.day}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-paillon-time" aria-label={v4("plnTimeline")}>
          {timeline.map((row) => <li key={row.sla}><span>{row.sla}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("plnEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-paillon-list">
          {shown.map((card) => {
            const late = lateSpangle(card, station);
            return (
              <li key={card.id} className="c4-paillon-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleSpangle(card) ? "1" : "0"} data-brisk={briskSpangle(card) ? "1" : "0"} data-overdue={overdueSpangle(card) ? "1" : "0"} data-resting={restingSpangle(card) ? "1" : "0"} data-inner={spangleWarm(card.watch) ? "1" : "0"} data-outer={spangleCool(card.watch) ? "1" : "0"}>
                <label className="c4-paillon-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editSpangle(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("plnEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("plnApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editSpangleNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("plnNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-paillon-meta">{watchLabel(v4, card.watch)} · {finishLabel(v4, card.finish)} · {card.sla ?? "—"} · {card.bead} · {card.watcher || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "plnAuditSave")}` : ""}{late ? ` · ${v4("plnOverdue")}` : ""}</p>
                </div>
                <div className="c4-paillon-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("plnEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSpangleRaised(cards, card.id, !card.raised))}>{card.raised ? v4("plnFree") : v4("plnRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSpangleFinish(cards, card.id, suggestedFinish))}>{v4("plnSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSpanglePin(cards, card.id, !card.pinned))}>{card.pinned ? v4("plnUnpin") : v4("plnPinIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSpangleCoffer(cards, card.id, !card.vaulted))}>{card.vaulted ? v4("plnUnvault") : v4("plnVaultIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSpangleStar(cards, card.id, !card.starred))}>{card.starred ? v4("plnUnstar") : v4("plnStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addSpangleTag(cards, card.id, "r"))}>{v4("plnTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseSlaFocused(cards, card.id))}>{v4("plnRaiseSla")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerSlaFocused(cards, card.id))}>{v4("plnLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseDepthFocused(cards, card.id))}>{v4("plnBead")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDepthFocused(cards, card.id))}>{v4("plnBead")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(finishFocused(cards, card.id))}>{v4("plnFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSpangleFocused(cards, card.id))}>{v4("plnRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinSpangleFocused(cards, card.id))}>{v4("plnPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starSpangleFocused(cards, card.id))}>{v4("plnStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(spangleCopy(card))}>{v4("plnCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type CapUser = { id?: string; name?: string | null; retentionNote?: string | null };

export function RetentionNotes({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: CapUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<RtnShape>("all");
  const [review, setReview] = useState<RtnReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): RtnRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: { retentionNote: textField(row.retentionNote) } satisfies RtnValue,
    };
  }).filter((row): row is RtnRow => Boolean(row));
  const present = presentRtnLanes(rows);
  const presentKey = present.join("\n");
  const idKey = rows.map((row) => row.id).join("\n");

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
    if (queue.loading || queue.error) return;
    const next = readHiddenRtn(readJson(RTN_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(RTN_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedRtn(readJson(RTN_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(RTN_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleRtnLanes(present, hidden, showHidden);
  const shown = visibleRtn(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = rtnLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = rtnLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingRtn(rows);
  const leadHue = leadingRtnHue(rows);
  const whole = rows.filter((row) => rtnLane(row.code)).length;
  const share = rtnShare(laneRtnCount(rows, "court"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("retention-lanes.csv", rtnLanesCsv(rows));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((row) => row.id));
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rows, shown]);

  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(RTN_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(RTN_REVIEW_KEY, next);
  }

  return (
    <section className="c4-retainnote" aria-label={v4("rtnTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-retainnote-mast">
        <p className="c4-retainnote-seal" data-logo="mono">{v4("rtnLogo")}</p>
        <div>
          <p className="c4-retainnote-kicker">{v4("rtnSub")}</p>
          <h2 className="c4-title">{v4("rtnTitle")}</h2>
        </div>
        <p className="c4-retainnote-count">{shown.length}</p>
      </header>
      <p className="c4-retainnote-links">
        <Link href={crmv4Href(base, "pln")}>{v4("plnTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("rtnCustomer")}</Link>
      </p>
      <p className="c4-retainnote-hint">{v4("rtnHint")}</p>
      {viewer && <p className="c4-retainnote-note">{v4("rtnViewer")}</p>}
      {queue.loading && <p className="c4-retainnote-meta">{v4("rtnLoading")}</p>}
      {queue.error && <p className="c4-retainnote-meta">{v4("rtnFailed")}</p>}
      <p className="c4-retainnote-meta">{v4("rtnLead")} {laneLabel(v4, lead)} · {v4("rtnToneLead")} {hueLabel(v4, leadHue)} · {v4("rtnShare")} {share}</p>
      <div className="c4-retainnote-chart" aria-label={v4("rtnChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-retainnote-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(12, Math.round((line.count / peak) * 72))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-retainnote-tools">
        <input ref={searchRef} className="c4-field c4-retainnote-search" aria-label={v4("rtnSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("rtnSearch")} />
        <label className="c4-lab">{v4("rtnChart")}<select className="c4-field" aria-label={v4("rtnChart")} value={shape} onChange={(event) => setShape(event.target.value as RtnShape)}>{(Object.keys(SHAPE_KEY) as RtnShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "champagne" ? "1" : "0"} onClick={() => setHue(hue === "champagne" ? "all" : "champagne")}>{v4("rtnChampagne")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ivory" ? "1" : "0"} onClick={() => setHue(hue === "ivory" ? "all" : "ivory")}>{v4("rtnIvory")}</button>
        <button type="button" className="c4-chip" data-on={hue === "graphite" ? "1" : "0"} onClick={() => setHue(hue === "graphite" ? "all" : "graphite")}>{v4("rtnGraphite")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("rtnFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("rtnReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("rtnShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleRtn(hidden, lane))}>{v4("rtnHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-retainnote-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkRtnReview(reviewed, picked, true))}>{v4("rtnBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkRtnReview(reviewed, picked, false))}>{v4("rtnBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("retention-notes.csv", rtnRowsCsv(shown, reviewed))}>{v4("rtnRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("rtntion-lanes.csv", rtnLanesCsv(rows))}>{v4("rtnCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("rtnEmpty")}</p>}
      <ul className="c4-retainnote-list">
        {shown.map((row) => {
          const tone = rtnHue(row.code);
          const name = rtnCopy(row.code);
          return (
            <li key={row.id} className="c4-retainnote-card" data-mail={rtnLane(row.code) || "open"} data-hue={tone || "none"} data-home={rtnLane(row.code) === "court" ? "1" : "0"} data-away={rtnShut(row.code) ? "1" : "0"} data-hold={rtnWait(row.code) ? "1" : "0"} data-guest={rtnReturn(row.code) ? "1" : "0"} data-open={rtnOpen(row.code) ? "1" : "0"} data-even={rtnEven(row.code) ? "1" : "0"} data-digit={rtnDigit(row.code) ? "1" : "0"} data-letter={rtnLetter(row.code) ? "1" : "0"} data-mixed={rtnMixed(row.code) ? "1" : "0"} data-upper={rtnUpper(row.code) ? "1" : "0"} data-lower={rtnLower(row.code) ? "1" : "0"} data-space={rtnSpace(row.code) ? "1" : "0"} data-vowel={rtnVowel(row.code) ? "1" : "0"} data-tail={rtnTail(row.code) ? "1" : "0"} data-first={rtnFirst(row.code) ? "1" : "0"} data-held={rtnHeld(row.code) ? "1" : "0"} data-join={rtnPair(row.code) ? "1" : "0"} data-route={rtnScope(row.code) ? "1" : "0"} data-brief={rtnShort(row.code) ? "1" : "0"}>
              <label className="c4-retainnote-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-retainnote-meta">{name || v4("rtnOpen")} · {rtnStamp(row.code) || "—"} · {rtnFamily(row.code) || "—"} · {rtnLength(row.code) ?? "—"} · {laneLabel(v4, rtnLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-retainnote-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleRtnReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("rtnReviewed") : v4("rtnReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(rtnCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("rtnCopied") : v4("rtnCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("rtnCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
