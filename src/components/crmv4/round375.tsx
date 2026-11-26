"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  VOD_KEY,
  VOD_REVIEW_KEY,
  PLQ_DENSITY_KEY,
  PLQ_KEY,
  PLQ_VIEW_KEY,
  PLQ_POINTS,
  addLantern,
  addLanternTag,
  addLanternView,
  briskLantern,
  bulkFrsReview,
  bulkLanternCoffer,
  bulkLanternInk,
  bulkLanternRaise,
  bulkLanternTag,
  busiestKeeper,
  dropLanternView,
  editLantern,
  editLanternNote,
  frsShort,
  frsCopy,
  frsDigit,
  frsEven,
  frsFamily,
  frsFirst,
  frsScope,
  frsHeld,
  frsShut,
  frsHue,
  frsPair,
  frsReturn,
  frsLane,
  frsLanes,
  frsLanesCsv,
  frsLength,
  frsLetter,
  frsLower,
  frsMixed,
  frsOpen,
  frsRowsCsv,
  frsShare,
  frsSpace,
  frsStamp,
  frsTail,
  frsUpper,
  frsWait,
  frsVowel,
  fairKeeper,
  finishFocused,
  lanternBars,
  lanternCopy,
  lanternCounts,
  lanternCsv,
  lanternDensity,
  lanternWarm,
  lanternCool,
  lanternTimeline,
  lanternKeepers,
  idleLantern,
  laneFrsCount,
  lateLantern,
  leadingFrs,
  leadingFrsHue,
  lowerSlaFocused,
  lowerDepthFocused,
  moveLanternFocus,
  overdueLantern,
  pinLanternFocused,
  presentFrsLanes,
  raiseSlaFocused,
  raiseDepthFocused,
  readHiddenFrs,
  readLanterns,
  readLanternViews,
  readReviewedFrs,
  reminderLanterns,
  restingLantern,
  setLanternCoffer,
  setLanternFinish,
  setLanternFocused,
  setLanternPin,
  setLanternRaised,
  setLanternStar,
  sortLanterns,
  starLanternFocused,
  suggestQuarter,
  suggestFoil,
  suggestPoint,
  toggleFrs,
  toggleFrsReview,
  visibleFrsLanes,
  visibleFrs,
  visibleLanterns,
  type FrsReview,
  type FrsRow,
  type FrsShape,
  type FrsValue,
  type Lantern,
  type LanternDensity,
  type LanternSort,
  type LanternTray,
  type LanternView,
} from "@/lib/crmv4/round375";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FINISHES = ["GOLD", "IVORY", "INK"] as const;
const SLAS = ["15", "30", "45", "90"] as const;
const BEADS = ["2", "4", "8"] as const;

const SEASON_KEY: Record<string, CrmV4CopyKey> = {
  north: "plqNorth",
  east: "plqEast",
  south: "plqSouth",
  west: "plqWest",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "plqAuditSave",
  edit: "plqAuditEdit",
  note: "plqAuditNote",
  film: "plqAuditFilm",
  raise: "plqAuditRaise",
  free: "plqAuditFree",
  pin: "plqAuditPin",
  return: "plqAuditReturn",
  vault: "plqAuditVault",
  open: "plqAuditOpen",
  tag: "plqAuditTag",
  bead: "plqAuditBead",
  sla: "plqAuditSla",
  lower: "plqAuditLower",
  star: "plqAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  court: "frsLaneCourt",
  shut: "frsLaneShut",
  wait: "frsLaneWait",
  bench: "frsLaneBench",
  return: "frsLaneReturn",
  pair: "frsPair",
  scope: "frsScope",
  short: "frsShort",
  span: "frsSpan",
  digit: "frsStampLane",
  openv: "frsVowel",
  bare: "frsBare",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "frsChampagne",
  ivory: "frsIvory",
  graphite: "frsGraphite",
};

const SHAPE_KEY: Record<FrsShape, CrmV4CopyKey> = {
  all: "frsShapeAll",
  court: "frsShapeCourt",
  shut: "frsShapeShut",
  wait: "frsShapeWait",
  return: "frsShapeReturn",
  pair: "frsShapePair",
  scope: "frsShapeScope",
  short: "frsShapeShort",
  span: "frsShapeSpan",
  digit: "frsShapeDigit",
  openv: "frsShapeVowel",
  bare: "frsShapeBare",
  open: "frsShapeOpen",
  soon: "frsShapeOpen",
  letter: "frsShapeBare",
  mixed: "frsShapeDigit",
  upper: "frsShapeUpper",
  lower: "frsShapeBare",
  space: "frsShapeSpace",
  even: "frsShapeEven",
  odd: "frsShapeEven",
  tail: "frsShapeDigit",
  first: "frsShapeBare",
  held: "frsShapeSpan",
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
  return key ? v4(key) : v4("plqBlankWindow");
}

function finishLabel(v4: V4, finish: string): string {
  if (finish === "GOLD") return v4("plqGold");
  if (finish === "INK") return v4("plqInk");
  if (finish === "IVORY") return v4("plqIvory");
  return v4("plqAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("frsBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("frsBlank");
}

export function PliqueLanterns({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Lantern[]>([]);
  const [views, setViews] = useState<LanternView[]>([]);
  const [density, setDensity] = useState<LanternDensity>("open");
  const [tray, setTray] = useState<LanternTray>("bench");
  const [query, setQuery] = useState("");
  const [watcherFilter, setWatcherFilter] = useState("");
  const [finishFilter, setFinishFilter] = useState("all");
  const [watchFilter, setWatchFilter] = useState("all");
  const [slaFilter, setSlaFilter] = useState("all");
  const [beadFilter, setBeadFilter] = useState("all");
  const [sort, setSort] = useState<LanternSort>("watch");
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
  const [station, setStation] = useState("north");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readLanterns(readJson(PLQ_KEY, [])));
    setViews(readLanternViews(readJson(PLQ_VIEW_KEY, [])));
    setDensity(lanternDensity(readJson(PLQ_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Lantern[]) {
    setCards(next);
    writeJson(PLQ_KEY, next);
  }
  function storeViews(next: LanternView[]) {
    setViews(next);
    writeJson(PLQ_VIEW_KEY, next);
  }
  function storeDensity(next: LanternDensity) {
    setDensity(next);
    writeJson(PLQ_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortLanterns(visibleLanterns(cards, tray, query, watcherFilter, finishFilter, watchFilter, slaFilter, beadFilter), sort),
    [cards, tray, query, watcherFilter, finishFilter, watchFilter, slaFilter, beadFilter, sort],
  );
  const counts = lanternCounts(cards, shown, station);
  const bars = lanternBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = lanternTimeline(cards);
  const reminders = reminderLanterns(cards);
  const watchers = lanternKeepers(cards);
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
        download("plique-lanterns.csv", lanternCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveLanternFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveLanternFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addLantern(cards, { title, note, watcher, watch, sla: slaNo, finish, bead: beadNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-plique" aria-label={v4("plqTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-plique-mast">
        <p className="c4-plique-seal" data-logo="mono">{v4("plqLogo")}</p>
        <div>
          <p className="c4-plique-kicker">{v4("plqSub")}</p>
          <h2 className="c4-title">{v4("plqTitle")}</h2>
        </div>
        <p className="c4-plique-count">{shown.length}</p>
      </header>
      <p className="c4-plique-links">
        <Link href={crmv4Href(base, "frs")}>{v4("frsTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("plqCustomers")}</Link>
      </p>
      <p className="c4-plique-hint">{v4("plqHint")}</p>
      {viewer && <p className="c4-plique-note">{v4("plqViewer")}</p>}
      <p className="c4-plique-meta">{v4("plqFair")} {fair || "—"} · {v4("plqBusy")} {busy || "—"} · {v4("plqSuggest")} {watchLabel(v4, suggestedWatch)} · {finishLabel(v4, suggestedFinish)} · {suggestedSla}</p>
      <ol className="c4-plique-index" aria-label={v4("plqRemind")}>
        <li data-tone="gold">{v4("plqOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("plqIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("plqBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("plqResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-plique-remind c4-plique-notices" role="status" aria-label={v4("plqRemind")}>
          {reminders.map((name) => <li key={name}>{v4("plqOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-plique-chart" aria-label={v4("plqChart")}>
        {bars.map((bar) => (
          <button key={bar.watch} type="button" className="c4-plique-column" data-on={watchFilter === bar.watch ? "1" : "0"} onClick={() => setWatchFilter(watchFilter === bar.watch ? "all" : bar.watch)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{watchLabel(v4, bar.watch)}</span>
          </button>
        ))}
      </div>
      <form className="c4-plique-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("plqEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("plqEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("plqNote")}<input className="c4-field" aria-label={v4("plqNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("plqWatcher")}<input className="c4-field" aria-label={v4("plqWatcher")} aria-required={false} value={watcher} maxLength={24} disabled={viewer} onChange={(event) => setWatcher(event.target.value)} /></label>
        <label className="c4-lab">{v4("plqWindow")}<select className="c4-field" aria-label={v4("plqWindow")} value={watch} disabled={viewer} onChange={(event) => setWatch(event.target.value)}><option value="">{v4("plqBlankWindow")}</option>{PLQ_POINTS.map((item) => <option key={item} value={item}>{watchLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("plqFilm")}<select className="c4-field" aria-label={v4("plqFilm")} value={finish} disabled={viewer} onChange={(event) => setFinish(event.target.value)}><option value="">{v4("plqAll")}</option>{FINISHES.map((item) => <option key={item} value={item}>{finishLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("plqSla")}<select className="c4-field" aria-label={v4("plqSla")} value={slaNo} disabled={viewer} onChange={(event) => setSlaNo(event.target.value)}><option value="">{v4("plqAll")}</option>{SLAS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("plqBead")}<select className="c4-field" aria-label={v4("plqBead")} value={beadNo} disabled={viewer} onChange={(event) => setBeadNo(event.target.value)}><option value="">{v4("plqAll")}</option>{BEADS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("plqTag")}<input className="c4-field" aria-label={v4("plqTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("plqAdd")}</button>
      </form>
      <div className="c4-plique-tools">
        <input ref={searchRef} className="c4-field c4-plique-search" aria-label={v4("plqSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("plqSearch")} />
        {(["bench", "pin", "vault"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "bench" ? "plqBench" : item === "pin" ? "plqPin" : "plqVault")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={watchFilter === "inner" ? "1" : "0"} onClick={() => setWatchFilter(watchFilter === "inner" ? "all" : "inner")}>{v4("plqInner")}</button>
        <button type="button" className="c4-chip" data-on={watchFilter === "outer" ? "1" : "0"} onClick={() => setWatchFilter(watchFilter === "outer" ? "all" : "outer")}>{v4("plqOuter")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "watcher" ? "1" : "0"} onClick={() => setSort(sort === "watcher" ? "watch" : "watcher")}>{sort === "watcher" ? v4("plqSortWatcher") : v4("plqSortWindow")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("plqTight") : v4("plqOpen")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("plqTimeline")}</button>
        <label className="c4-lab">{v4("plqDesk")}<select className="c4-field" aria-label={v4("plqDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{PLQ_POINTS.map((item) => <option key={item} value={item}>{watchLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-plique-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addLanternView(views, { id, name: viewName, tray, query, watcher: watcherFilter, finish: finishFilter, watch: watchFilter, sla: slaFilter, bead: beadFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("plqViewName")}<input className="c4-field" aria-label={v4("plqViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("plqSaveView")}</button>
      </form>
      <ul className="c4-plique-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setWatcherFilter(view.watcher); setFinishFilter(view.finish); setWatchFilter(view.watch); setSlaFilter(view.sla); setBeadFilter(view.bead); }}>{v4("plqApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropLanternView(views, view.id))}>{v4("plqDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-plique-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkLanternRaise(cards, picked))}>{v4("plqBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkLanternCoffer(cards, picked))}>{v4("plqBulkVault")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkLanternInk(cards, picked))}>{v4("plqBulkAsh")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkLanternTag(cards, picked))}>{v4("plqBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("plique-lanterns.csv", lanternCsv(shown, station))}>{v4("plqCsv")}</button>
        <p className="c4-plique-meta">{v4("plqKeys")} / c x a j k · {v4("plqQuiet")} {counts.quiet} · {v4("plqInner")} {counts.day}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-plique-time" aria-label={v4("plqTimeline")}>
          {timeline.map((row) => <li key={row.sla}><span>{row.sla}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("plqEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-plique-list">
          {shown.map((card) => {
            const late = lateLantern(card, station);
            return (
              <li key={card.id} className="c4-plique-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleLantern(card) ? "1" : "0"} data-brisk={briskLantern(card) ? "1" : "0"} data-overdue={overdueLantern(card) ? "1" : "0"} data-resting={restingLantern(card) ? "1" : "0"} data-inner={lanternWarm(card.watch) ? "1" : "0"} data-outer={lanternCool(card.watch) ? "1" : "0"}>
                <label className="c4-plique-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editLantern(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("plqEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("plqApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editLanternNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("plqNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-plique-meta">{watchLabel(v4, card.watch)} · {finishLabel(v4, card.finish)} · {card.sla ?? "—"} · {card.bead} · {card.watcher || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "plqAuditSave")}` : ""}{late ? ` · ${v4("plqOverdue")}` : ""}</p>
                </div>
                <div className="c4-plique-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("plqEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLanternRaised(cards, card.id, !card.raised))}>{card.raised ? v4("plqFree") : v4("plqRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLanternFinish(cards, card.id, suggestedFinish))}>{v4("plqSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLanternPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("plqUnpin") : v4("plqPinIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLanternCoffer(cards, card.id, !card.vaulted))}>{card.vaulted ? v4("plqUnvault") : v4("plqVaultIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLanternStar(cards, card.id, !card.starred))}>{card.starred ? v4("plqUnstar") : v4("plqStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addLanternTag(cards, card.id, "c"))}>{v4("plqTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseSlaFocused(cards, card.id))}>{v4("plqRaiseSla")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerSlaFocused(cards, card.id))}>{v4("plqLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseDepthFocused(cards, card.id))}>{v4("plqBead")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDepthFocused(cards, card.id))}>{v4("plqBead")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(finishFocused(cards, card.id))}>{v4("plqFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLanternFocused(cards, card.id))}>{v4("plqRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinLanternFocused(cards, card.id))}>{v4("plqPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starLanternFocused(cards, card.id))}>{v4("plqStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(lanternCopy(card))}>{v4("plqCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type CapUser = { id?: string; name?: string | null; registrationCountry?: string | null };

export function FrostMarks({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: CapUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<FrsShape>("all");
  const [review, setReview] = useState<FrsReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): FrsRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: { registrationCountry: textField(row.registrationCountry) } satisfies FrsValue,
    };
  }).filter((row): row is FrsRow => Boolean(row));
  const present = presentFrsLanes(rows);
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
    const next = readHiddenFrs(readJson(VOD_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(VOD_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedFrs(readJson(VOD_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(VOD_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleFrsLanes(present, hidden, showHidden);
  const shown = visibleFrs(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = frsLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = frsLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingFrs(rows);
  const leadHue = leadingFrsHue(rows);
  const whole = rows.filter((row) => frsLane(row.code)).length;
  const share = frsShare(laneFrsCount(rows, "court"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("frost-lanes.csv", frsLanesCsv(rows));
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
    writeJson(VOD_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(VOD_REVIEW_KEY, next);
  }

  return (
    <section className="c4-frostmark" aria-label={v4("frsTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-frostmark-mast">
        <p className="c4-frostmark-seal" data-logo="mono">{v4("frsLogo")}</p>
        <div>
          <p className="c4-frostmark-kicker">{v4("frsSub")}</p>
          <h2 className="c4-title">{v4("frsTitle")}</h2>
        </div>
        <p className="c4-frostmark-count">{shown.length}</p>
      </header>
      <p className="c4-frostmark-links">
        <Link href={crmv4Href(base, "plq")}>{v4("plqTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("frsCustomer")}</Link>
      </p>
      <p className="c4-frostmark-hint">{v4("frsHint")}</p>
      {viewer && <p className="c4-frostmark-note">{v4("frsViewer")}</p>}
      {queue.loading && <p className="c4-frostmark-meta">{v4("frsLoading")}</p>}
      {queue.error && <p className="c4-frostmark-meta">{v4("frsFailed")}</p>}
      <p className="c4-frostmark-meta">{v4("frsLead")} {laneLabel(v4, lead)} · {v4("frsToneLead")} {hueLabel(v4, leadHue)} · {v4("frsShare")} {share}</p>
      <div className="c4-frostmark-chart" aria-label={v4("frsChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-frostmark-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(12, Math.round((line.count / peak) * 72))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-frostmark-tools">
        <input ref={searchRef} className="c4-field c4-frostmark-search" aria-label={v4("frsSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("frsSearch")} />
        <label className="c4-lab">{v4("frsChart")}<select className="c4-field" aria-label={v4("frsChart")} value={shape} onChange={(event) => setShape(event.target.value as FrsShape)}>{(Object.keys(SHAPE_KEY) as FrsShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "champagne" ? "1" : "0"} onClick={() => setHue(hue === "champagne" ? "all" : "champagne")}>{v4("frsChampagne")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ivory" ? "1" : "0"} onClick={() => setHue(hue === "ivory" ? "all" : "ivory")}>{v4("frsIvory")}</button>
        <button type="button" className="c4-chip" data-on={hue === "graphite" ? "1" : "0"} onClick={() => setHue(hue === "graphite" ? "all" : "graphite")}>{v4("frsGraphite")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("frsFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("frsReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("frsShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleFrs(hidden, lane))}>{v4("frsHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-frostmark-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkFrsReview(reviewed, picked, true))}>{v4("frsBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkFrsReview(reviewed, picked, false))}>{v4("frsBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("frost-marks.csv", frsRowsCsv(shown, reviewed))}>{v4("frsRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("frstion-lanes.csv", frsLanesCsv(rows))}>{v4("frsCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("frsEmpty")}</p>}
      <ul className="c4-frostmark-list">
        {shown.map((row) => {
          const tone = frsHue(row.code);
          const name = frsCopy(row.code);
          return (
            <li key={row.id} className="c4-frostmark-card" data-mail={frsLane(row.code) || "open"} data-hue={tone || "none"} data-home={frsLane(row.code) === "court" ? "1" : "0"} data-away={frsShut(row.code) ? "1" : "0"} data-hold={frsWait(row.code) ? "1" : "0"} data-guest={frsReturn(row.code) ? "1" : "0"} data-open={frsOpen(row.code) ? "1" : "0"} data-even={frsEven(row.code) ? "1" : "0"} data-digit={frsDigit(row.code) ? "1" : "0"} data-letter={frsLetter(row.code) ? "1" : "0"} data-mixed={frsMixed(row.code) ? "1" : "0"} data-upper={frsUpper(row.code) ? "1" : "0"} data-lower={frsLower(row.code) ? "1" : "0"} data-space={frsSpace(row.code) ? "1" : "0"} data-vowel={frsVowel(row.code) ? "1" : "0"} data-tail={frsTail(row.code) ? "1" : "0"} data-first={frsFirst(row.code) ? "1" : "0"} data-held={frsHeld(row.code) ? "1" : "0"} data-join={frsPair(row.code) ? "1" : "0"} data-route={frsScope(row.code) ? "1" : "0"} data-brief={frsShort(row.code) ? "1" : "0"}>
              <label className="c4-frostmark-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-frostmark-meta">{name || v4("frsOpen")} · {frsStamp(row.code) || "—"} · {frsFamily(row.code) || "—"} · {frsLength(row.code) ?? "—"} · {laneLabel(v4, frsLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-frostmark-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleFrsReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("frsReviewed") : v4("frsReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(frsCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("frsCopied") : v4("frsCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("frsCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
