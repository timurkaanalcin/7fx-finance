"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  CAP_KEY,
  CAP_REVIEW_KEY,
  DMC_DENSITY_KEY,
  DMC_KEY,
  DMC_VIEW_KEY,
  DMC_WATCHES,
  addRibbon,
  addRibbonTag,
  addRibbonView,
  briskRibbon,
  bulkCapReview,
  bulkRibbonVault,
  bulkRibbonAsh,
  bulkRibbonRaise,
  bulkRibbonTag,
  busiestWatcher,
  dropRibbonView,
  editRibbon,
  editRibbonNote,
  capBrief,
  capCopy,
  capDigit,
  capEven,
  capFamily,
  capFirst,
  capRoute,
  capHeld,
  capAway,
  capHue,
  capJoin,
  capReturned,
  capLane,
  capLanes,
  capLanesCsv,
  capLength,
  capLetter,
  capLower,
  capMixed,
  capOpen,
  capRowsCsv,
  capShare,
  capSpace,
  capStamp,
  capTail,
  capUpper,
  capHold,
  capVowel,
  fairWatcher,
  finishFocused,
  ribbonBars,
  ribbonCopy,
  ribbonCounts,
  ribbonCsv,
  ribbonDensity,
  ribbonInner,
  ribbonOuter,
  ribbonTimeline,
  ribbonWatchers,
  idleRibbon,
  laneCapCount,
  lateRibbon,
  leadingCap,
  leadingCapHue,
  lowerSlaFocused,
  lowerBeadFocused,
  moveRibbonFocus,
  overdueRibbon,
  pinRibbonFocused,
  presentCapLanes,
  raiseSlaFocused,
  raiseBeadFocused,
  readHiddenCap,
  readRibbonCards,
  readRibbonViews,
  readReviewedCap,
  reminderRibbonCards,
  restingRibbon,
  setRibbonVault,
  setRibbonFinish,
  setRibbonFocused,
  setRibbonPin,
  setRibbonRaised,
  setRibbonStar,
  sortRibbonCards,
  starRibbonFocused,
  suggestSla,
  suggestFinish,
  suggestWatch,
  toggleCap,
  toggleCapReview,
  visibleCapLanes,
  visibleCap,
  visibleRibbonCards,
  type CapReview,
  type CapRow,
  type CapShape,
  type CapValue,
  type Ribbon,
  type RibbonDensity,
  type RibbonSort,
  type RibbonTray,
  type RibbonView,
} from "@/lib/crmv4/round373";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FINISHES = ["GILT", "ASH", "MIST"] as const;
const SLAS = ["15", "30", "45", "90"] as const;
const BEADS = ["2", "4", "8"] as const;

const WATCH_KEY: Record<string, CrmV4CopyKey> = {
  dawn: "dmcDawn",
  noon: "dmcNoon",
  dusk: "dmcDusk",
  night: "dmcNight",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "dmcAuditSave",
  edit: "dmcAuditEdit",
  note: "dmcAuditNote",
  film: "dmcAuditFilm",
  raise: "dmcAuditRaise",
  free: "dmcAuditFree",
  pin: "dmcAuditPin",
  return: "dmcAuditReturn",
  vault: "dmcAuditVault",
  open: "dmcAuditOpen",
  tag: "dmcAuditTag",
  bead: "dmcAuditBead",
  sla: "dmcAuditSla",
  lower: "dmcAuditLower",
  star: "dmcAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  hall: "capLaneHall",
  vacant: "capLaneVacant",
  hold: "capLaneHold",
  desk: "capLaneDesk",
  guest: "capLaneGuest",
  join: "capJoin",
  route: "capRoute",
  brief: "capBrief",
  long: "capLong",
  stamp: "capStampLane",
  vowel: "capVowel",
  plain: "capPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "capChampagne",
  ivory: "capIvory",
  graphite: "capGraphite",
};

const SHAPE_KEY: Record<CapShape, CrmV4CopyKey> = {
  all: "capShapeAll",
  hall: "capShapeHall",
  vacant: "capShapeVacant",
  hold: "capShapeHold",
  guest: "capShapeGuest",
  join: "capShapeJoin",
  route: "capShapeRoute",
  brief: "capShapeBrief",
  long: "capShapeLong",
  stamp: "capShapeStamp",
  vowel: "capShapeVowel",
  plain: "capShapePlain",
  open: "capShapeOpen",
  soon: "capShapeOpen",
  letter: "capShapePlain",
  mixed: "capShapeStamp",
  upper: "capShapeUpper",
  lower: "capShapePlain",
  space: "capShapeSpace",
  even: "capShapeEven",
  odd: "capShapeEven",
  tail: "capShapeStamp",
  first: "capShapePlain",
  held: "capShapeLong",
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
  const key = WATCH_KEY[watch];
  return key ? v4(key) : v4("dmcBlankWindow");
}

function finishLabel(v4: V4, finish: string): string {
  if (finish === "GILT") return v4("dmcGilt");
  if (finish === "ASH") return v4("dmcAsh");
  if (finish === "MIST") return v4("dmcMist");
  return v4("dmcAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("capBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("capBlank");
}

export function DamasceneRibbons({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Ribbon[]>([]);
  const [views, setViews] = useState<RibbonView[]>([]);
  const [density, setDensity] = useState<RibbonDensity>("open");
  const [tray, setTray] = useState<RibbonTray>("bench");
  const [query, setQuery] = useState("");
  const [watcherFilter, setWatcherFilter] = useState("");
  const [finishFilter, setFinishFilter] = useState("all");
  const [watchFilter, setWatchFilter] = useState("all");
  const [slaFilter, setSlaFilter] = useState("all");
  const [beadFilter, setBeadFilter] = useState("all");
  const [sort, setSort] = useState<RibbonSort>("watch");
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
    setCards(readRibbonCards(readJson(DMC_KEY, [])));
    setViews(readRibbonViews(readJson(DMC_VIEW_KEY, [])));
    setDensity(ribbonDensity(readJson(DMC_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Ribbon[]) {
    setCards(next);
    writeJson(DMC_KEY, next);
  }
  function storeViews(next: RibbonView[]) {
    setViews(next);
    writeJson(DMC_VIEW_KEY, next);
  }
  function storeDensity(next: RibbonDensity) {
    setDensity(next);
    writeJson(DMC_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortRibbonCards(visibleRibbonCards(cards, tray, query, watcherFilter, finishFilter, watchFilter, slaFilter, beadFilter), sort),
    [cards, tray, query, watcherFilter, finishFilter, watchFilter, slaFilter, beadFilter, sort],
  );
  const counts = ribbonCounts(cards, shown, station);
  const bars = ribbonBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = ribbonTimeline(cards);
  const reminders = reminderRibbonCards(cards);
  const watchers = ribbonWatchers(cards);
  const busy = busiestWatcher(cards);
  const fair = fairWatcher(cards, watchers.join(","));
  const suggestedFinish = suggestFinish(cards);
  const suggestedSla = suggestSla(cards, clock);
  const suggestedWatch = suggestWatch(clock);
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
        download("damascene-ribbons.csv", ribbonCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveRibbonFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveRibbonFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addRibbon(cards, { title, note, watcher, watch, sla: slaNo, finish, bead: beadNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-damascene" aria-label={v4("dmcTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-damascene-mast">
        <p className="c4-damascene-seal" data-logo="mono">{v4("dmcLogo")}</p>
        <div>
          <p className="c4-damascene-kicker">{v4("dmcSub")}</p>
          <h2 className="c4-title">{v4("dmcTitle")}</h2>
        </div>
        <p className="c4-damascene-count">{shown.length}</p>
      </header>
      <p className="c4-damascene-links">
        <Link href={crmv4Href(base, "cap")}>{v4("capTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("dmcCustomers")}</Link>
      </p>
      <p className="c4-damascene-hint">{v4("dmcHint")}</p>
      {viewer && <p className="c4-damascene-note">{v4("dmcViewer")}</p>}
      <p className="c4-damascene-meta">{v4("dmcFair")} {fair || "—"} · {v4("dmcBusy")} {busy || "—"} · {v4("dmcSuggest")} {watchLabel(v4, suggestedWatch)} · {finishLabel(v4, suggestedFinish)} · {suggestedSla}</p>
      <ol className="c4-damascene-index" aria-label={v4("dmcRemind")}>
        <li data-tone="gold">{v4("dmcOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("dmcIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("dmcBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("dmcResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-damascene-remind c4-damascene-notices" role="status" aria-label={v4("dmcRemind")}>
          {reminders.map((name) => <li key={name}>{v4("dmcOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-damascene-chart" aria-label={v4("dmcChart")}>
        {bars.map((bar) => (
          <button key={bar.watch} type="button" className="c4-damascene-column" data-on={watchFilter === bar.watch ? "1" : "0"} onClick={() => setWatchFilter(watchFilter === bar.watch ? "all" : bar.watch)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{watchLabel(v4, bar.watch)}</span>
          </button>
        ))}
      </div>
      <form className="c4-damascene-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("dmcEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("dmcEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("dmcNote")}<input className="c4-field" aria-label={v4("dmcNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("dmcWatcher")}<input className="c4-field" aria-label={v4("dmcWatcher")} aria-required={false} value={watcher} maxLength={24} disabled={viewer} onChange={(event) => setWatcher(event.target.value)} /></label>
        <label className="c4-lab">{v4("dmcWindow")}<select className="c4-field" aria-label={v4("dmcWindow")} value={watch} disabled={viewer} onChange={(event) => setWatch(event.target.value)}><option value="">{v4("dmcBlankWindow")}</option>{DMC_WATCHES.map((item) => <option key={item} value={item}>{watchLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("dmcFilm")}<select className="c4-field" aria-label={v4("dmcFilm")} value={finish} disabled={viewer} onChange={(event) => setFinish(event.target.value)}><option value="">{v4("dmcAll")}</option>{FINISHES.map((item) => <option key={item} value={item}>{finishLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("dmcSla")}<select className="c4-field" aria-label={v4("dmcSla")} value={slaNo} disabled={viewer} onChange={(event) => setSlaNo(event.target.value)}><option value="">{v4("dmcAll")}</option>{SLAS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("dmcBead")}<select className="c4-field" aria-label={v4("dmcBead")} value={beadNo} disabled={viewer} onChange={(event) => setBeadNo(event.target.value)}><option value="">{v4("dmcAll")}</option>{BEADS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("dmcTag")}<input className="c4-field" aria-label={v4("dmcTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("dmcAdd")}</button>
      </form>
      <div className="c4-damascene-tools">
        <input ref={searchRef} className="c4-field c4-damascene-search" aria-label={v4("dmcSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("dmcSearch")} />
        {(["bench", "pin", "vault"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "bench" ? "dmcBench" : item === "pin" ? "dmcPin" : "dmcVault")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={watchFilter === "inner" ? "1" : "0"} onClick={() => setWatchFilter(watchFilter === "inner" ? "all" : "inner")}>{v4("dmcInner")}</button>
        <button type="button" className="c4-chip" data-on={watchFilter === "outer" ? "1" : "0"} onClick={() => setWatchFilter(watchFilter === "outer" ? "all" : "outer")}>{v4("dmcOuter")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "watcher" ? "1" : "0"} onClick={() => setSort(sort === "watcher" ? "watch" : "watcher")}>{sort === "watcher" ? v4("dmcSortWatcher") : v4("dmcSortWindow")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("dmcTight") : v4("dmcOpen")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("dmcTimeline")}</button>
        <label className="c4-lab">{v4("dmcDesk")}<select className="c4-field" aria-label={v4("dmcDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{DMC_WATCHES.map((item) => <option key={item} value={item}>{watchLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-damascene-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addRibbonView(views, { id, name: viewName, tray, query, watcher: watcherFilter, finish: finishFilter, watch: watchFilter, sla: slaFilter, bead: beadFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("dmcViewName")}<input className="c4-field" aria-label={v4("dmcViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("dmcSaveView")}</button>
      </form>
      <ul className="c4-damascene-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setWatcherFilter(view.watcher); setFinishFilter(view.finish); setWatchFilter(view.watch); setSlaFilter(view.sla); setBeadFilter(view.bead); }}>{v4("dmcApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropRibbonView(views, view.id))}>{v4("dmcDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-damascene-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRibbonRaise(cards, picked))}>{v4("dmcBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRibbonVault(cards, picked))}>{v4("dmcBulkVault")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRibbonAsh(cards, picked))}>{v4("dmcBulkAsh")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRibbonTag(cards, picked))}>{v4("dmcBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("damascene-ribbons.csv", ribbonCsv(shown, station))}>{v4("dmcCsv")}</button>
        <p className="c4-damascene-meta">{v4("dmcKeys")} / c x a j k · {v4("dmcQuiet")} {counts.quiet} · {v4("dmcInner")} {counts.day}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-damascene-time" aria-label={v4("dmcTimeline")}>
          {timeline.map((row) => <li key={row.sla}><span>{row.sla}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("dmcEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-damascene-list">
          {shown.map((card) => {
            const late = lateRibbon(card, station);
            return (
              <li key={card.id} className="c4-damascene-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleRibbon(card) ? "1" : "0"} data-brisk={briskRibbon(card) ? "1" : "0"} data-overdue={overdueRibbon(card) ? "1" : "0"} data-resting={restingRibbon(card) ? "1" : "0"} data-inner={ribbonInner(card.watch) ? "1" : "0"} data-outer={ribbonOuter(card.watch) ? "1" : "0"}>
                <label className="c4-damascene-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editRibbon(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("dmcEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("dmcApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editRibbonNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("dmcNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-damascene-meta">{watchLabel(v4, card.watch)} · {finishLabel(v4, card.finish)} · {card.sla ?? "—"} · {card.bead} · {card.watcher || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "dmcAuditSave")}` : ""}{late ? ` · ${v4("dmcOverdue")}` : ""}</p>
                </div>
                <div className="c4-damascene-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("dmcEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRibbonRaised(cards, card.id, !card.raised))}>{card.raised ? v4("dmcFree") : v4("dmcRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRibbonFinish(cards, card.id, suggestedFinish))}>{v4("dmcSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRibbonPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("dmcUnpin") : v4("dmcPinIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRibbonVault(cards, card.id, !card.vaulted))}>{card.vaulted ? v4("dmcUnvault") : v4("dmcVaultIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRibbonStar(cards, card.id, !card.starred))}>{card.starred ? v4("dmcUnstar") : v4("dmcStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addRibbonTag(cards, card.id, "d"))}>{v4("dmcTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseSlaFocused(cards, card.id))}>{v4("dmcRaiseSla")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerSlaFocused(cards, card.id))}>{v4("dmcLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseBeadFocused(cards, card.id))}>{v4("dmcBead")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerBeadFocused(cards, card.id))}>{v4("dmcBead")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(finishFocused(cards, card.id))}>{v4("dmcFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRibbonFocused(cards, card.id))}>{v4("dmcRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinRibbonFocused(cards, card.id))}>{v4("dmcPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starRibbonFocused(cards, card.id))}>{v4("dmcStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(ribbonCopy(card))}>{v4("dmcCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type CapUser = { id?: string; name?: string | null; lastCountryName?: string | null };

export function CaptionPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: CapUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<CapShape>("all");
  const [review, setReview] = useState<CapReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): CapRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: { lastCountryName: textField(row.lastCountryName) } satisfies CapValue,
    };
  }).filter((row): row is CapRow => Boolean(row));
  const present = presentCapLanes(rows);
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
    const next = readHiddenCap(readJson(CAP_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(CAP_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedCap(readJson(CAP_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(CAP_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleCapLanes(present, hidden, showHidden);
  const shown = visibleCap(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = capLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = capLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingCap(rows);
  const leadHue = leadingCapHue(rows);
  const whole = rows.filter((row) => capLane(row.code)).length;
  const share = capShare(laneCapCount(rows, "hall"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("caption-plates.csv", capLanesCsv(rows));
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
    writeJson(CAP_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(CAP_REVIEW_KEY, next);
  }

  return (
    <section className="c4-capplate" aria-label={v4("capTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-capplate-mast">
        <p className="c4-capplate-seal" data-logo="mono">{v4("capLogo")}</p>
        <div>
          <p className="c4-capplate-kicker">{v4("capSub")}</p>
          <h2 className="c4-title">{v4("capTitle")}</h2>
        </div>
        <p className="c4-capplate-count">{shown.length}</p>
      </header>
      <p className="c4-capplate-links">
        <Link href={crmv4Href(base, "dmc")}>{v4("dmcTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("capCustomer")}</Link>
      </p>
      <p className="c4-capplate-hint">{v4("capHint")}</p>
      {viewer && <p className="c4-capplate-note">{v4("capViewer")}</p>}
      {queue.loading && <p className="c4-capplate-meta">{v4("capLoading")}</p>}
      {queue.error && <p className="c4-capplate-meta">{v4("capFailed")}</p>}
      <p className="c4-capplate-meta">{v4("capLead")} {laneLabel(v4, lead)} · {v4("capToneLead")} {hueLabel(v4, leadHue)} · {v4("capShare")} {share}</p>
      <div className="c4-capplate-chart" aria-label={v4("capChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-capplate-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(12, Math.round((line.count / peak) * 72))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-capplate-tools">
        <input ref={searchRef} className="c4-field c4-capplate-search" aria-label={v4("capSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("capSearch")} />
        <label className="c4-lab">{v4("capChart")}<select className="c4-field" aria-label={v4("capChart")} value={shape} onChange={(event) => setShape(event.target.value as CapShape)}>{(Object.keys(SHAPE_KEY) as CapShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "champagne" ? "1" : "0"} onClick={() => setHue(hue === "champagne" ? "all" : "champagne")}>{v4("capChampagne")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ivory" ? "1" : "0"} onClick={() => setHue(hue === "ivory" ? "all" : "ivory")}>{v4("capIvory")}</button>
        <button type="button" className="c4-chip" data-on={hue === "graphite" ? "1" : "0"} onClick={() => setHue(hue === "graphite" ? "all" : "graphite")}>{v4("capGraphite")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("capFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("capReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("capShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleCap(hidden, lane))}>{v4("capHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-capplate-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkCapReview(reviewed, picked, true))}>{v4("capBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkCapReview(reviewed, picked, false))}>{v4("capBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("caption-rows.csv", capRowsCsv(shown, reviewed))}>{v4("capRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("caption-lanes.csv", capLanesCsv(rows))}>{v4("capCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("capEmpty")}</p>}
      <ul className="c4-capplate-list">
        {shown.map((row) => {
          const tone = capHue(row.code);
          const name = capCopy(row.code);
          return (
            <li key={row.id} className="c4-capplate-card" data-mail={capLane(row.code) || "open"} data-hue={tone || "none"} data-home={capLane(row.code) === "hall" ? "1" : "0"} data-away={capAway(row.code) ? "1" : "0"} data-hold={capHold(row.code) ? "1" : "0"} data-guest={capReturned(row.code) ? "1" : "0"} data-open={capOpen(row.code) ? "1" : "0"} data-even={capEven(row.code) ? "1" : "0"} data-digit={capDigit(row.code) ? "1" : "0"} data-letter={capLetter(row.code) ? "1" : "0"} data-mixed={capMixed(row.code) ? "1" : "0"} data-upper={capUpper(row.code) ? "1" : "0"} data-lower={capLower(row.code) ? "1" : "0"} data-space={capSpace(row.code) ? "1" : "0"} data-vowel={capVowel(row.code) ? "1" : "0"} data-tail={capTail(row.code) ? "1" : "0"} data-first={capFirst(row.code) ? "1" : "0"} data-held={capHeld(row.code) ? "1" : "0"} data-join={capJoin(row.code) ? "1" : "0"} data-route={capRoute(row.code) ? "1" : "0"} data-brief={capBrief(row.code) ? "1" : "0"}>
              <label className="c4-capplate-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-capplate-meta">{name || v4("capOpen")} · {capStamp(row.code) || "—"} · {capFamily(row.code) || "—"} · {capLength(row.code) ?? "—"} · {laneLabel(v4, capLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-capplate-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleCapReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("capReviewed") : v4("capReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(capCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("capCopied") : v4("capCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("capCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
