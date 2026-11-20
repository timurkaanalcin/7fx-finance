"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  ASG_KEY,
  ASG_REVIEW_KEY,
  RTG_DENSITY_KEY,
  RTG_KEY,
  RTG_MODES,
  RTG_VIEW_KEY,
  addRetrograde,
  addRetrogradeTag,
  addRetrogradeView,
  briskRetrograde,
  bulkAssignmentReview,
  bulkRetrogradeCoffer,
  bulkRetrogradeGraphite,
  bulkRetrogradeRaise,
  bulkRetrogradeTag,
  busiestKeeper,
  dropRetrogradeView,
  editRetrograde,
  editRetrogradeNote,
  assignmentBrief,
  assignmentCopy,
  assignmentDigit,
  assignmentEven,
  assignmentFamily,
  assignmentFirst,
  assignmentGap,
  assignmentHeld,
  assignmentAway,
  assignmentHue,
  assignmentJoin,
  assignmentCitizen,
  assignmentLane,
  assignmentLanes,
  assignmentLanesCsv,
  assignmentLength,
  assignmentLetter,
  assignmentLower,
  assignmentMixed,
  assignmentOpen,
  assignmentRowsCsv,
  assignmentShare,
  assignmentSpace,
  assignmentStamp,
  assignmentTail,
  assignmentUpper,
  assignmentGuest,
  assignmentVowel,
  fairKeeper,
  finishFocused,
  retrogradeBars,
  retrogradeCopy,
  retrogradeCounts,
  retrogradeCsv,
  retrogradeDensity,
  retrogradeInner,
  retrogradeOuter,
  retrogradeTimeline,
  retrogradeKeepers,
  idleRetrograde,
  laneAssignmentCount,
  lateRetrograde,
  leadingAssignment,
  leadingAssignmentHue,
  lowerHourFocused,
  lowerHammerFocused,
  moveRetrogradeFocus,
  overdueRetrograde,
  pinRetrogradeFocused,
  presentAssignmentLanes,
  raiseHourFocused,
  raiseHammerFocused,
  readHiddenAssignment,
  readRetrogrades,
  readRetrogradeViews,
  readReviewedAssignment,
  reminderRetrogrades,
  restingRetrograde,
  setRetrogradeCoffer,
  setRetrogradeFilm,
  setRetrogradeFocused,
  setRetrogradePin,
  setRetrogradeRaised,
  setRetrogradeStar,
  sortRetrogrades,
  starRetrogradeFocused,
  suggestHour,
  suggestFinish,
  suggestMode,
  toggleAssignment,
  toggleAssignmentReview,
  visibleAssignment,
  visibleAssignmentLanes,
  visibleRetrogrades,
  type AssignmentReview,
  type AssignmentRow,
  type AssignmentShape,
  type AssignmentValue,
  type Retrograde,
  type RetrogradeDensity,
  type RetrogradeSort,
  type RetrogradeTray,
  type RetrogradeView,
} from "@/lib/crmv4/round347";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["GILT", "IVORY", "GRAPHITE"] as const;
const DROPS = ["3", "9", "15", "21"] as const;
const LOCKS = ["2", "5", "9"] as const;

const PIECE_KEY: Record<string, CrmV4CopyKey> = {
  sector: "rtgSector",
  arc: "rtgArc",
  fan: "rtgFan",
  snail: "rtgSnail",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "rtgAuditSave",
  edit: "rtgAuditEdit",
  note: "rtgAuditNote",
  film: "rtgAuditFilm",
  poise: "rtgAuditPoise",
  free: "rtgAuditFree",
  peg: "rtgAuditPeg",
  return: "rtgAuditReturn",
  coffer: "rtgAuditCoffer",
  open: "rtgAuditOpen",
  tag: "rtgAuditTag",
  lock: "rtgAuditRate",
  drop: "rtgAuditBeat",
  lower: "rtgAuditLower",
  star: "rtgAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  lead: "asgLaneLead",
  desk: "asgLaneDesk",
  retn: "asgLaneRetn",
  keep: "asgLaneKeep",
  join: "asgJoin",
  gap: "asgGap",
  brief: "asgBrief",
  long: "asgLong",
  mark: "asgMark",
  vowel: "asgVowel",
  plain: "asgPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "asgChampagne",
  ivory: "asgIvory",
  graphite: "asgGraphite",
};

const SHAPE_KEY: Record<AssignmentShape, CrmV4CopyKey> = {
  all: "asgShapeAll",
  lead: "asgShapeLead",
  desk: "asgShapeDesk",
  retn: "asgShapeRetn",
  keep: "asgShapeKeep",
  join: "asgShapeJoin",
  gap: "asgShapeGap",
  brief: "asgShapeBrief",
  long: "asgShapeLong",
  mark: "asgShapeMark",
  vowel: "asgShapeVowel",
  plain: "asgShapePlain",
  open: "asgShapeOpen",
  soon: "asgShapeOpen",
  letter: "asgShapePlain",
  mixed: "asgShapeMark",
  upper: "asgShapeLead",
  lower: "asgShapePlain",
  space: "asgShapeGap",
  even: "asgShapeEven",
  odd: "asgShapeEven",
  tail: "asgShapeMark",
  first: "asgShapePlain",
  held: "asgShapeLong",
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

function limbLabel(v4: V4, piece: string): string {
  const key = PIECE_KEY[piece];
  return key ? v4(key) : v4("rtgBlankPiece");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "GILT") return v4("rtgGilt");
  if (film === "IVORY") return v4("rtgIvory");
  if (film === "GRAPHITE") return v4("rtgGraphite");
  return v4("rtgAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("asgBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("asgBlank");
}

export function RetrogradeRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Retrograde[]>([]);
  const [views, setViews] = useState<RetrogradeView[]>([]);
  const [density, setDensity] = useState<RetrogradeDensity>("airy");
  const [tray, setTray] = useState<RetrogradeTray>("board");
  const [query, setQuery] = useState("");
  const [setterFilter, setSetterFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [pieceFilter, setPieceFilter] = useState("all");
  const [dropFilter, setDropFilter] = useState("all");
  const [lockFilter, setLockFilter] = useState("all");
  const [sort, setSort] = useState<RetrogradeSort>("piece");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [setter, setSetter] = useState("");
  const [piece, setPiece] = useState("");
  const [film, setFilm] = useState("");
  const [dropNo, setDropNo] = useState("");
  const [lockNo, setLockNo] = useState("");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteId, setNoteId] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [station, setStation] = useState("sector");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readRetrogrades(readJson(RTG_KEY, [])));
    setViews(readRetrogradeViews(readJson(RTG_VIEW_KEY, [])));
    setDensity(retrogradeDensity(readJson(RTG_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Retrograde[]) {
    setCards(next);
    writeJson(RTG_KEY, next);
  }
  function storeViews(next: RetrogradeView[]) {
    setViews(next);
    writeJson(RTG_VIEW_KEY, next);
  }
  function storeDensity(next: RetrogradeDensity) {
    setDensity(next);
    writeJson(RTG_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortRetrogrades(visibleRetrogrades(cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter), sort),
    [cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter, sort],
  );
  const counts = retrogradeCounts(cards, shown, station);
  const bars = retrogradeBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = retrogradeTimeline(cards);
  const reminders = reminderRetrogrades(cards);
  const poisers = retrogradeKeepers(cards);
  const busy = busiestKeeper(cards);
  const fair = fairKeeper(cards, poisers.join(","));
  const suggestedFilm = suggestFinish(cards);
  const suggestedBeat = suggestHour(cards, clock);
  const suggestedLimb = suggestMode(clock);
  const focused = shown[Math.min(focusAt, Math.max(0, shown.length - 1))];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "/" && !typingTarget(event)) {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (typingTarget(event) || viewer) return;
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        titleRef.current?.focus();
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("retrograde-rules.csv", retrogradeCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveRetrogradeFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveRetrogradeFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addRetrograde(cards, { title, note, setter: setter, piece, drop: dropNo, film, lock: lockNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-retrograde" aria-label={v4("rtgTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-retrograde-mast">
        <p className="c4-retrograde-seal" data-logo="mono">{v4("rtgLogo")}</p>
        <div>
          <p className="c4-retrograde-kicker">{v4("rtgSub")}</p>
          <h2 className="c4-title">{v4("rtgTitle")}</h2>
        </div>
        <p className="c4-retrograde-count">{shown.length}</p>
      </header>
      <p className="c4-retrograde-links">
        <Link href={crmv4Href(base, "asg")}>{v4("asgTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("rtgCustomers")}</Link>
      </p>
      <p className="c4-retrograde-hint">{v4("rtgHint")}</p>
      {viewer && <p className="c4-retrograde-note">{v4("rtgViewer")}</p>}
      <p className="c4-retrograde-meta">{v4("rtgFair")} {fair || "—"} · {v4("rtgBusy")} {busy || "—"} · {v4("rtgSuggest")} {limbLabel(v4, suggestedLimb)} · {filmLabel(v4, suggestedFilm)} · {suggestedBeat}</p>
      <ol className="c4-retrograde-index" aria-label={v4("rtgRemind")}>
        <li data-tone="gold">{v4("rtgOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("rtgIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("rtgBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("rtgResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-retrograde-remind c4-retrograde-notices" role="status" aria-label={v4("rtgRemind")}>
          {reminders.map((name) => <li key={name}>{v4("rtgOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-retrograde-chart" aria-label={v4("rtgChart")}>
        {bars.map((bar) => (
          <button key={bar.piece} type="button" className="c4-retrograde-column" data-on={pieceFilter === bar.piece ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === bar.piece ? "all" : bar.piece)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{limbLabel(v4, bar.piece)}</span>
          </button>
        ))}
      </div>
      <form className="c4-retrograde-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("rtgEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("rtgEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("rtgNote")}<input className="c4-field" aria-label={v4("rtgNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("rtgSetter")}<input className="c4-field" aria-label={v4("rtgSetter")} aria-required={false} value={setter} maxLength={24} disabled={viewer} onChange={(event) => setSetter(event.target.value)} /></label>
        <label className="c4-lab">{v4("rtgPiece")}<select className="c4-field" aria-label={v4("rtgPiece")} value={piece} disabled={viewer} onChange={(event) => setPiece(event.target.value)}><option value="">{v4("rtgBlankPiece")}</option>{RTG_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("rtgFilm")}<select className="c4-field" aria-label={v4("rtgFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("rtgAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("rtgDrop")}<select className="c4-field" aria-label={v4("rtgDrop")} value={dropNo} disabled={viewer} onChange={(event) => setDropNo(event.target.value)}><option value="">{v4("rtgAll")}</option>{DROPS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("rtgLock")}<select className="c4-field" aria-label={v4("rtgLock")} value={lockNo} disabled={viewer} onChange={(event) => setLockNo(event.target.value)}><option value="">{v4("rtgAll")}</option>{LOCKS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("rtgTag")}<input className="c4-field" aria-label={v4("rtgTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("rtgAdd")}</button>
      </form>
      <div className="c4-retrograde-tools">
        <input ref={searchRef} className="c4-field c4-retrograde-search" aria-label={v4("rtgSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("rtgSearch")} />
        {(["board", "peg", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "board" ? "rtgBoard" : item === "peg" ? "rtgPeg" : "rtgCoffer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={pieceFilter === "inner" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "inner" ? "all" : "inner")}>{v4("rtgInner")}</button>
        <button type="button" className="c4-chip" data-on={pieceFilter === "outer" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "outer" ? "all" : "outer")}>{v4("rtgOuter")}</button>
        {FILMS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={filmFilter === item ? "1" : "0"} onClick={() => setFilmFilter(filmFilter === item ? "all" : item)}>{filmLabel(v4, item)}</button>
        ))}
        {DROPS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={dropFilter === item ? "1" : "0"} onClick={() => setDropFilter(dropFilter === item ? "all" : item)}>{item}</button>
        ))}
        {LOCKS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={lockFilter === item ? "1" : "0"} onClick={() => setLockFilter(lockFilter === item ? "all" : item)}>{item}</button>
        ))}
        {poisers.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={setterFilter === name ? "1" : "0"} onClick={() => setSetterFilter(setterFilter === name ? "" : name)}>{name}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "setter" ? "1" : "0"} onClick={() => setSort(sort === "setter" ? "piece" : "setter")}>{sort === "setter" ? v4("rtgSortSetter") : v4("rtgSortLimb")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("rtgClose") : v4("rtgAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("rtgTimeline")}</button>
        <label className="c4-lab">{v4("rtgDesk")}<select className="c4-field" aria-label={v4("rtgDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{RTG_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-retrograde-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addRetrogradeView(views, { id, name: viewName, tray, query, setter: setterFilter, film: filmFilter, piece: pieceFilter, drop: dropFilter, lock: lockFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("rtgViewName")}<input className="c4-field" aria-label={v4("rtgViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("rtgSaveView")}</button>
      </form>
      <ul className="c4-retrograde-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setSetterFilter(view.setter); setFilmFilter(view.film); setPieceFilter(view.piece); setDropFilter(view.drop); setLockFilter(view.lock); }}>{v4("rtgApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropRetrogradeView(views, view.id))}>{v4("rtgDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-retrograde-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRetrogradeRaise(cards, picked))}>{v4("rtgBulkPoise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRetrogradeCoffer(cards, picked))}>{v4("rtgBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRetrogradeGraphite(cards, picked))}>{v4("rtgBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRetrogradeTag(cards, picked))}>{v4("rtgBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("retrograde-rules.csv", retrogradeCsv(shown, station))}>{v4("rtgCsv")}</button>
        <p className="c4-retrograde-meta">{v4("rtgKeys")} / n x a j k · {v4("rtgQuiet")} {counts.quiet} · {v4("rtgInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-retrograde-time" aria-label={v4("rtgTimeline")}>
          {timeline.map((mail) => <li key={mail.drop}><span>{mail.drop}</span> {mail.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("rtgEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-retrograde-list">
          {shown.map((card) => {
            const late = lateRetrograde(card, station);
            return (
              <li key={card.id} className="c4-retrograde-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleRetrograde(card) ? "1" : "0"} data-brisk={briskRetrograde(card) ? "1" : "0"} data-overdue={overdueRetrograde(card) ? "1" : "0"} data-resting={restingRetrograde(card) ? "1" : "0"} data-inner={retrogradeInner(card.piece) ? "1" : "0"} data-outer={retrogradeOuter(card.piece) ? "1" : "0"}>
                <label className="c4-retrograde-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editRetrograde(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("rtgEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("rtgApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editRetrogradeNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("rtgNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-retrograde-meta">{limbLabel(v4, card.piece)} · {filmLabel(v4, card.film)} · {card.drop ?? "—"} · {card.lock} · {card.setter || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "rtgAuditSave")}` : ""}{late ? ` · ${v4("rtgOverdue")}` : ""}</p>
                </div>
                <div className="c4-retrograde-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("rtgEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRetrogradeRaised(cards, card.id, !card.raised))}>{card.raised ? v4("rtgFree") : v4("rtgPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRetrogradeFilm(cards, card.id, suggestedFilm))}>{v4("rtgSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRetrogradePin(cards, card.id, !card.pinned))}>{card.pinned ? v4("rtgUnpeg") : v4("rtgPegIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRetrogradeCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("rtgUncoffer") : v4("rtgCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRetrogradeStar(cards, card.id, !card.starred))}>{card.starred ? v4("rtgUnstar") : v4("rtgStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addRetrogradeTag(cards, card.id, "r"))}>{v4("rtgTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("rtgRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("rtgLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHammerFocused(cards, card.id))}>{v4("rtgLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHammerFocused(cards, card.id))}>{v4("rtgLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(finishFocused(cards, card.id))}>{v4("rtgFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRetrogradeFocused(cards, card.id))}>{v4("rtgPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinRetrogradeFocused(cards, card.id))}>{v4("rtgPeg")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starRetrogradeFocused(cards, card.id))}>{v4("rtgStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(retrogradeCopy(card))}>{v4("rtgCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}


type AssignmentUser = { id?: string; name?: string | null; assigneeId?: string | null };

export function AssignmentPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: AssignmentUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<AssignmentShape>("all");
  const [review, setReview] = useState<AssignmentReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): AssignmentRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { assigneeId: textField(row.assigneeId) } satisfies AssignmentValue,
    };
  }).filter((row): row is AssignmentRow => Boolean(row));
  const present = presentAssignmentLanes(rows);
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
    const next = readHiddenAssignment(readJson(ASG_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(ASG_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedAssignment(readJson(ASG_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(ASG_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleAssignmentLanes(present, hidden, showHidden);
  const shown = visibleAssignment(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = assignmentLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = assignmentLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingAssignment(rows);
  const leadHue = leadingAssignmentHue(rows);
  const whole = rows.filter((row) => assignmentLane(row.code)).length;
  const share = assignmentShare(laneAssignmentCount(rows, "lead"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("assignment-plates.csv", assignmentLanesCsv(rows));
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
    writeJson(ASG_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(ASG_REVIEW_KEY, next);
  }

  return (
    <section className="c4-asgplate" aria-label={v4("asgTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-asgplate-mast">
        <p className="c4-asgplate-seal" data-logo="mono">{v4("asgLogo")}</p>
        <div>
          <p className="c4-asgplate-kicker">{v4("asgSub")}</p>
          <h2 className="c4-title">{v4("asgTitle")}</h2>
        </div>
        <p className="c4-asgplate-count">{shown.length}</p>
      </header>
      <p className="c4-asgplate-links">
        <Link href={crmv4Href(base, "rtg")}>{v4("rtgTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("asgCustomer")}</Link>
      </p>
      <p className="c4-asgplate-hint">{v4("asgHint")}</p>
      {viewer && <p className="c4-asgplate-note">{v4("asgViewer")}</p>}
      <p className="c4-asgplate-meta">{v4("asgLead")} {laneLabel(v4, lead)} · {v4("asgToneLead")} {hueLabel(v4, leadHue)} · {v4("asgShare")} {share}</p>
      <div className="c4-asgplate-chart" aria-label={v4("asgChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-asgplate-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-asgplate-tools">
        <input ref={searchRef} className="c4-field c4-asgplate-search" aria-label={v4("asgSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("asgSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("asgShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "asgAll" : item === "reviewed" ? "asgReviewed" : "asgFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("asgAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as AssignmentShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleAssignment(hidden, item))}>{hidden.includes(item) ? v4("asgShow") : v4("asgHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-asgplate-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkAssignmentReview(reviewed, picked, true))}>{v4("asgBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkAssignmentReview(reviewed, picked, false))}>{v4("asgBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("assignment-lanes.csv", assignmentLanesCsv(rows))}>{v4("asgCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("assignment-rows.csv", assignmentRowsCsv(shown, reviewed))}>{v4("asgRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("asgLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("asgFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("asgEmpty")}</p>}
      <ul className="c4-asgplate-list">
        {shown.map((row) => {
          const name = assignmentCopy(row.code);
          const tone = assignmentHue(row.code);
          return (
            <li key={row.id} className="c4-asgplate-card" data-mail={assignmentLane(row.code) || "open"} data-hue={tone || "none"} data-lang-mark={assignmentLane(row.code) === "lead" ? "1" : "0"} data-away={assignmentAway(row.code) ? "1" : "0"} data-guest={assignmentGuest(row.code) ? "1" : "0"} data-citizen={assignmentCitizen(row.code) ? "1" : "0"} data-open={assignmentOpen(row.code) ? "1" : "0"} data-even={assignmentEven(row.code) ? "1" : "0"} data-digit={assignmentDigit(row.code) ? "1" : "0"} data-letter={assignmentLetter(row.code) ? "1" : "0"} data-mixed={assignmentMixed(row.code) ? "1" : "0"} data-upper={assignmentUpper(row.code) ? "1" : "0"} data-lower={assignmentLower(row.code) ? "1" : "0"} data-space={assignmentSpace(row.code) ? "1" : "0"} data-vowel={assignmentVowel(row.code) ? "1" : "0"} data-tail={assignmentTail(row.code) ? "1" : "0"} data-first={assignmentFirst(row.code) ? "1" : "0"} data-held={assignmentHeld(row.code) ? "1" : "0"} data-join={assignmentJoin(row.code) ? "1" : "0"} data-gap={assignmentGap(row.code) ? "1" : "0"} data-brief={assignmentBrief(row.code) ? "1" : "0"}>
              <label className="c4-asgplate-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-asgplate-meta">{name || v4("asgOpen")} · {assignmentStamp(row.code) || "—"} · {assignmentFamily(row.code) || "—"} · {assignmentLength(row.code) ?? "—"} · {laneLabel(v4, assignmentLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-asgplate-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleAssignmentReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("asgReviewed") : v4("asgReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = assignmentCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("asgCopied") : v4("asgCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("asgCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
