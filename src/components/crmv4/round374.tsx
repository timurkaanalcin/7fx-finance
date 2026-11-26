"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  VOD_KEY,
  VOD_REVIEW_KEY,
  CHV_DENSITY_KEY,
  CHV_KEY,
  CHV_VIEW_KEY,
  CHV_SEASONS,
  addWell,
  addWellTag,
  addWellView,
  briskWell,
  bulkVodReview,
  bulkWellCoffer,
  bulkWellInk,
  bulkWellRaise,
  bulkWellTag,
  busiestSetter,
  dropWellView,
  editWell,
  editWellNote,
  vodShort,
  vodCopy,
  vodDigit,
  vodEven,
  vodFamily,
  vodFirst,
  vodScope,
  vodHeld,
  vodShut,
  vodHue,
  vodPair,
  vodReturn,
  vodLane,
  vodLanes,
  vodLanesCsv,
  vodLength,
  vodLetter,
  vodLower,
  vodMixed,
  vodOpen,
  vodRowsCsv,
  vodShare,
  vodSpace,
  vodStamp,
  vodTail,
  vodUpper,
  vodWait,
  vodVowel,
  fairSetter,
  finishFocused,
  wellBars,
  wellCopy,
  wellCounts,
  wellCsv,
  wellDensity,
  wellWarm,
  wellCool,
  wellTimeline,
  wellSetters,
  idleWell,
  laneVodCount,
  lateWell,
  leadingVod,
  leadingVodHue,
  lowerSlaFocused,
  lowerDepthFocused,
  moveWellFocus,
  overdueWell,
  pinWellFocused,
  presentVodLanes,
  raiseSlaFocused,
  raiseDepthFocused,
  readHiddenVod,
  readWells,
  readWellViews,
  readReviewedVod,
  reminderWells,
  restingWell,
  setWellCoffer,
  setWellFinish,
  setWellFocused,
  setWellPin,
  setWellRaised,
  setWellStar,
  sortWells,
  starWellFocused,
  suggestSla,
  suggestFinish,
  suggestSeason,
  toggleVod,
  toggleVodReview,
  visibleVodLanes,
  visibleVod,
  visibleWells,
  type VodReview,
  type VodRow,
  type VodShape,
  type VodValue,
  type Well,
  type WellDensity,
  type WellSort,
  type WellTray,
  type WellView,
} from "@/lib/crmv4/round374";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FINISHES = ["GOLD", "IVORY", "INK"] as const;
const SLAS = ["10", "20", "40", "80"] as const;
const BEADS = ["3", "6", "9"] as const;

const SEASON_KEY: Record<string, CrmV4CopyKey> = {
  spring: "chvSpring",
  summer: "chvSummer",
  autumn: "chvAutumn",
  winter: "chvWinter",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "chvAuditSave",
  edit: "chvAuditEdit",
  note: "chvAuditNote",
  film: "chvAuditFilm",
  raise: "chvAuditRaise",
  free: "chvAuditFree",
  pin: "chvAuditPin",
  return: "chvAuditReturn",
  vault: "chvAuditVault",
  open: "chvAuditOpen",
  tag: "chvAuditTag",
  bead: "chvAuditBead",
  sla: "chvAuditSla",
  lower: "chvAuditLower",
  star: "chvAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  court: "vodLaneCourt",
  shut: "vodLaneShut",
  wait: "vodLaneWait",
  bench: "vodLaneBench",
  return: "vodLaneReturn",
  pair: "vodPair",
  scope: "vodScope",
  short: "vodShort",
  span: "vodSpan",
  digit: "vodStampLane",
  openv: "vodVowel",
  bare: "vodBare",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "vodChampagne",
  ivory: "vodIvory",
  graphite: "vodGraphite",
};

const SHAPE_KEY: Record<VodShape, CrmV4CopyKey> = {
  all: "vodShapeAll",
  court: "vodShapeCourt",
  shut: "vodShapeShut",
  wait: "vodShapeWait",
  return: "vodShapeReturn",
  pair: "vodShapePair",
  scope: "vodShapeScope",
  short: "vodShapeShort",
  span: "vodShapeSpan",
  digit: "vodShapeDigit",
  openv: "vodShapeVowel",
  bare: "vodShapeBare",
  open: "vodShapeOpen",
  soon: "vodShapeOpen",
  letter: "vodShapeBare",
  mixed: "vodShapeDigit",
  upper: "vodShapeUpper",
  lower: "vodShapeBare",
  space: "vodShapeSpace",
  even: "vodShapeEven",
  odd: "vodShapeEven",
  tail: "vodShapeDigit",
  first: "vodShapeBare",
  held: "vodShapeSpan",
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
  return key ? v4(key) : v4("chvBlankWindow");
}

function finishLabel(v4: V4, finish: string): string {
  if (finish === "GOLD") return v4("chvGold");
  if (finish === "INK") return v4("chvInk");
  if (finish === "IVORY") return v4("chvIvory");
  return v4("chvAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("vodBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("vodBlank");
}

export function ChampleveWells({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Well[]>([]);
  const [views, setViews] = useState<WellView[]>([]);
  const [density, setDensity] = useState<WellDensity>("open");
  const [tray, setTray] = useState<WellTray>("bench");
  const [query, setQuery] = useState("");
  const [watcherFilter, setWatcherFilter] = useState("");
  const [finishFilter, setFinishFilter] = useState("all");
  const [watchFilter, setWatchFilter] = useState("all");
  const [slaFilter, setSlaFilter] = useState("all");
  const [beadFilter, setBeadFilter] = useState("all");
  const [sort, setSort] = useState<WellSort>("watch");
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
  const [station, setStation] = useState("spring");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readWells(readJson(CHV_KEY, [])));
    setViews(readWellViews(readJson(CHV_VIEW_KEY, [])));
    setDensity(wellDensity(readJson(CHV_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Well[]) {
    setCards(next);
    writeJson(CHV_KEY, next);
  }
  function storeViews(next: WellView[]) {
    setViews(next);
    writeJson(CHV_VIEW_KEY, next);
  }
  function storeDensity(next: WellDensity) {
    setDensity(next);
    writeJson(CHV_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortWells(visibleWells(cards, tray, query, watcherFilter, finishFilter, watchFilter, slaFilter, beadFilter), sort),
    [cards, tray, query, watcherFilter, finishFilter, watchFilter, slaFilter, beadFilter, sort],
  );
  const counts = wellCounts(cards, shown, station);
  const bars = wellBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = wellTimeline(cards);
  const reminders = reminderWells(cards);
  const watchers = wellSetters(cards);
  const busy = busiestSetter(cards);
  const fair = fairSetter(cards, watchers.join(","));
  const suggestedFinish = suggestFinish(cards);
  const suggestedSla = suggestSla(cards, clock);
  const suggestedWatch = suggestSeason(clock);
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
        download("champleve-wells.csv", wellCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveWellFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveWellFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addWell(cards, { title, note, watcher, watch, sla: slaNo, finish, bead: beadNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-champleve" aria-label={v4("chvTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-champleve-mast">
        <p className="c4-champleve-seal" data-logo="mono">{v4("chvLogo")}</p>
        <div>
          <p className="c4-champleve-kicker">{v4("chvSub")}</p>
          <h2 className="c4-title">{v4("chvTitle")}</h2>
        </div>
        <p className="c4-champleve-count">{shown.length}</p>
      </header>
      <p className="c4-champleve-links">
        <Link href={crmv4Href(base, "vod")}>{v4("vodTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("chvCustomers")}</Link>
      </p>
      <p className="c4-champleve-hint">{v4("chvHint")}</p>
      {viewer && <p className="c4-champleve-note">{v4("chvViewer")}</p>}
      <p className="c4-champleve-meta">{v4("chvFair")} {fair || "—"} · {v4("chvBusy")} {busy || "—"} · {v4("chvSuggest")} {watchLabel(v4, suggestedWatch)} · {finishLabel(v4, suggestedFinish)} · {suggestedSla}</p>
      <ol className="c4-champleve-index" aria-label={v4("chvRemind")}>
        <li data-tone="gold">{v4("chvOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("chvIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("chvBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("chvResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-champleve-remind c4-champleve-notices" role="status" aria-label={v4("chvRemind")}>
          {reminders.map((name) => <li key={name}>{v4("chvOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-champleve-chart" aria-label={v4("chvChart")}>
        {bars.map((bar) => (
          <button key={bar.watch} type="button" className="c4-champleve-column" data-on={watchFilter === bar.watch ? "1" : "0"} onClick={() => setWatchFilter(watchFilter === bar.watch ? "all" : bar.watch)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{watchLabel(v4, bar.watch)}</span>
          </button>
        ))}
      </div>
      <form className="c4-champleve-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("chvEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("chvEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("chvNote")}<input className="c4-field" aria-label={v4("chvNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("chvWatcher")}<input className="c4-field" aria-label={v4("chvWatcher")} aria-required={false} value={watcher} maxLength={24} disabled={viewer} onChange={(event) => setWatcher(event.target.value)} /></label>
        <label className="c4-lab">{v4("chvWindow")}<select className="c4-field" aria-label={v4("chvWindow")} value={watch} disabled={viewer} onChange={(event) => setWatch(event.target.value)}><option value="">{v4("chvBlankWindow")}</option>{CHV_SEASONS.map((item) => <option key={item} value={item}>{watchLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("chvFilm")}<select className="c4-field" aria-label={v4("chvFilm")} value={finish} disabled={viewer} onChange={(event) => setFinish(event.target.value)}><option value="">{v4("chvAll")}</option>{FINISHES.map((item) => <option key={item} value={item}>{finishLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("chvSla")}<select className="c4-field" aria-label={v4("chvSla")} value={slaNo} disabled={viewer} onChange={(event) => setSlaNo(event.target.value)}><option value="">{v4("chvAll")}</option>{SLAS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("chvBead")}<select className="c4-field" aria-label={v4("chvBead")} value={beadNo} disabled={viewer} onChange={(event) => setBeadNo(event.target.value)}><option value="">{v4("chvAll")}</option>{BEADS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("chvTag")}<input className="c4-field" aria-label={v4("chvTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("chvAdd")}</button>
      </form>
      <div className="c4-champleve-tools">
        <input ref={searchRef} className="c4-field c4-champleve-search" aria-label={v4("chvSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("chvSearch")} />
        {(["bench", "pin", "vault"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "bench" ? "chvBench" : item === "pin" ? "chvPin" : "chvVault")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={watchFilter === "inner" ? "1" : "0"} onClick={() => setWatchFilter(watchFilter === "inner" ? "all" : "inner")}>{v4("chvInner")}</button>
        <button type="button" className="c4-chip" data-on={watchFilter === "outer" ? "1" : "0"} onClick={() => setWatchFilter(watchFilter === "outer" ? "all" : "outer")}>{v4("chvOuter")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "watcher" ? "1" : "0"} onClick={() => setSort(sort === "watcher" ? "watch" : "watcher")}>{sort === "watcher" ? v4("chvSortWatcher") : v4("chvSortWindow")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("chvTight") : v4("chvOpen")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("chvTimeline")}</button>
        <label className="c4-lab">{v4("chvDesk")}<select className="c4-field" aria-label={v4("chvDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{CHV_SEASONS.map((item) => <option key={item} value={item}>{watchLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-champleve-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addWellView(views, { id, name: viewName, tray, query, watcher: watcherFilter, finish: finishFilter, watch: watchFilter, sla: slaFilter, bead: beadFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("chvViewName")}<input className="c4-field" aria-label={v4("chvViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("chvSaveView")}</button>
      </form>
      <ul className="c4-champleve-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setWatcherFilter(view.watcher); setFinishFilter(view.finish); setWatchFilter(view.watch); setSlaFilter(view.sla); setBeadFilter(view.bead); }}>{v4("chvApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropWellView(views, view.id))}>{v4("chvDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-champleve-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkWellRaise(cards, picked))}>{v4("chvBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkWellCoffer(cards, picked))}>{v4("chvBulkVault")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkWellInk(cards, picked))}>{v4("chvBulkAsh")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkWellTag(cards, picked))}>{v4("chvBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("champleve-wells.csv", wellCsv(shown, station))}>{v4("chvCsv")}</button>
        <p className="c4-champleve-meta">{v4("chvKeys")} / c x a j k · {v4("chvQuiet")} {counts.quiet} · {v4("chvInner")} {counts.day}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-champleve-time" aria-label={v4("chvTimeline")}>
          {timeline.map((row) => <li key={row.sla}><span>{row.sla}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("chvEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-champleve-list">
          {shown.map((card) => {
            const late = lateWell(card, station);
            return (
              <li key={card.id} className="c4-champleve-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleWell(card) ? "1" : "0"} data-brisk={briskWell(card) ? "1" : "0"} data-overdue={overdueWell(card) ? "1" : "0"} data-resting={restingWell(card) ? "1" : "0"} data-inner={wellWarm(card.watch) ? "1" : "0"} data-outer={wellCool(card.watch) ? "1" : "0"}>
                <label className="c4-champleve-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editWell(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("chvEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("chvApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editWellNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("chvNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-champleve-meta">{watchLabel(v4, card.watch)} · {finishLabel(v4, card.finish)} · {card.sla ?? "—"} · {card.bead} · {card.watcher || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "chvAuditSave")}` : ""}{late ? ` · ${v4("chvOverdue")}` : ""}</p>
                </div>
                <div className="c4-champleve-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("chvEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setWellRaised(cards, card.id, !card.raised))}>{card.raised ? v4("chvFree") : v4("chvRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setWellFinish(cards, card.id, suggestedFinish))}>{v4("chvSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setWellPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("chvUnpin") : v4("chvPinIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setWellCoffer(cards, card.id, !card.vaulted))}>{card.vaulted ? v4("chvUnvault") : v4("chvVaultIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setWellStar(cards, card.id, !card.starred))}>{card.starred ? v4("chvUnstar") : v4("chvStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addWellTag(cards, card.id, "c"))}>{v4("chvTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseSlaFocused(cards, card.id))}>{v4("chvRaiseSla")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerSlaFocused(cards, card.id))}>{v4("chvLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseDepthFocused(cards, card.id))}>{v4("chvBead")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDepthFocused(cards, card.id))}>{v4("chvBead")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(finishFocused(cards, card.id))}>{v4("chvFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setWellFocused(cards, card.id))}>{v4("chvRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinWellFocused(cards, card.id))}>{v4("chvPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starWellFocused(cards, card.id))}>{v4("chvStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(wellCopy(card))}>{v4("chvCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type CapUser = { id?: string; name?: string | null; leadInvalidAt?: string | null };

export function VoidStamps({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: CapUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<VodShape>("all");
  const [review, setReview] = useState<VodReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): VodRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: { leadInvalidAt: textField(row.leadInvalidAt) } satisfies VodValue,
    };
  }).filter((row): row is VodRow => Boolean(row));
  const present = presentVodLanes(rows);
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
    const next = readHiddenVod(readJson(VOD_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(VOD_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedVod(readJson(VOD_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(VOD_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleVodLanes(present, hidden, showHidden);
  const shown = visibleVod(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = vodLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = vodLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingVod(rows);
  const leadHue = leadingVodHue(rows);
  const whole = rows.filter((row) => vodLane(row.code)).length;
  const share = vodShare(laneVodCount(rows, "court"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("void-lanes.csv", vodLanesCsv(rows));
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
    <section className="c4-vodplate" aria-label={v4("vodTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-vodplate-mast">
        <p className="c4-vodplate-seal" data-logo="mono">{v4("vodLogo")}</p>
        <div>
          <p className="c4-vodplate-kicker">{v4("vodSub")}</p>
          <h2 className="c4-title">{v4("vodTitle")}</h2>
        </div>
        <p className="c4-vodplate-count">{shown.length}</p>
      </header>
      <p className="c4-vodplate-links">
        <Link href={crmv4Href(base, "chv")}>{v4("chvTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("vodCustomer")}</Link>
      </p>
      <p className="c4-vodplate-hint">{v4("vodHint")}</p>
      {viewer && <p className="c4-vodplate-note">{v4("vodViewer")}</p>}
      {queue.loading && <p className="c4-vodplate-meta">{v4("vodLoading")}</p>}
      {queue.error && <p className="c4-vodplate-meta">{v4("vodFailed")}</p>}
      <p className="c4-vodplate-meta">{v4("vodLead")} {laneLabel(v4, lead)} · {v4("vodToneLead")} {hueLabel(v4, leadHue)} · {v4("vodShare")} {share}</p>
      <div className="c4-vodplate-chart" aria-label={v4("vodChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-vodplate-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(12, Math.round((line.count / peak) * 72))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-vodplate-tools">
        <input ref={searchRef} className="c4-field c4-vodplate-search" aria-label={v4("vodSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("vodSearch")} />
        <label className="c4-lab">{v4("vodChart")}<select className="c4-field" aria-label={v4("vodChart")} value={shape} onChange={(event) => setShape(event.target.value as VodShape)}>{(Object.keys(SHAPE_KEY) as VodShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "champagne" ? "1" : "0"} onClick={() => setHue(hue === "champagne" ? "all" : "champagne")}>{v4("vodChampagne")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ivory" ? "1" : "0"} onClick={() => setHue(hue === "ivory" ? "all" : "ivory")}>{v4("vodIvory")}</button>
        <button type="button" className="c4-chip" data-on={hue === "graphite" ? "1" : "0"} onClick={() => setHue(hue === "graphite" ? "all" : "graphite")}>{v4("vodGraphite")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("vodFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("vodReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("vodShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleVod(hidden, lane))}>{v4("vodHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-vodplate-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkVodReview(reviewed, picked, true))}>{v4("vodBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkVodReview(reviewed, picked, false))}>{v4("vodBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("void-stamps.csv", vodRowsCsv(shown, reviewed))}>{v4("vodRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("vodtion-lanes.csv", vodLanesCsv(rows))}>{v4("vodCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("vodEmpty")}</p>}
      <ul className="c4-vodplate-list">
        {shown.map((row) => {
          const tone = vodHue(row.code);
          const name = vodCopy(row.code);
          return (
            <li key={row.id} className="c4-vodplate-card" data-mail={vodLane(row.code) || "open"} data-hue={tone || "none"} data-home={vodLane(row.code) === "court" ? "1" : "0"} data-away={vodShut(row.code) ? "1" : "0"} data-hold={vodWait(row.code) ? "1" : "0"} data-guest={vodReturn(row.code) ? "1" : "0"} data-open={vodOpen(row.code) ? "1" : "0"} data-even={vodEven(row.code) ? "1" : "0"} data-digit={vodDigit(row.code) ? "1" : "0"} data-letter={vodLetter(row.code) ? "1" : "0"} data-mixed={vodMixed(row.code) ? "1" : "0"} data-upper={vodUpper(row.code) ? "1" : "0"} data-lower={vodLower(row.code) ? "1" : "0"} data-space={vodSpace(row.code) ? "1" : "0"} data-vowel={vodVowel(row.code) ? "1" : "0"} data-tail={vodTail(row.code) ? "1" : "0"} data-first={vodFirst(row.code) ? "1" : "0"} data-held={vodHeld(row.code) ? "1" : "0"} data-join={vodPair(row.code) ? "1" : "0"} data-route={vodScope(row.code) ? "1" : "0"} data-brief={vodShort(row.code) ? "1" : "0"}>
              <label className="c4-vodplate-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-vodplate-meta">{name || v4("vodOpen")} · {vodStamp(row.code) || "—"} · {vodFamily(row.code) || "—"} · {vodLength(row.code) ?? "—"} · {laneLabel(v4, vodLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-vodplate-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleVodReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("vodReviewed") : v4("vodReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(vodCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("vodCopied") : v4("vodCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("vodCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
