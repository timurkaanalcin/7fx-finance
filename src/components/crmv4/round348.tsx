"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  TZN_KEY,
  TZN_REVIEW_KEY,
  CHG_DENSITY_KEY,
  CHG_KEY,
  CHG_MODES,
  CHG_VIEW_KEY,
  addChronograph,
  addChronographTag,
  addChronographView,
  briskChronograph,
  bulkTimezoneReview,
  bulkChronographCoffer,
  bulkChronographGraphite,
  bulkChronographRaise,
  bulkChronographTag,
  busiestKeeper,
  dropChronographView,
  editChronograph,
  editChronographNote,
  timezoneBrief,
  timezoneCopy,
  timezoneDigit,
  timezoneEven,
  timezoneFamily,
  timezoneFirst,
  timezoneGap,
  timezoneHeld,
  timezoneAway,
  timezoneHue,
  timezoneJoin,
  timezoneCitizen,
  timezoneLane,
  timezoneLanes,
  timezoneLanesCsv,
  timezoneLength,
  timezoneLetter,
  timezoneLower,
  timezoneMixed,
  timezoneOpen,
  timezoneRowsCsv,
  timezoneShare,
  timezoneSpace,
  timezoneStamp,
  timezoneTail,
  timezoneUpper,
  timezoneGuest,
  timezoneVowel,
  fairKeeper,
  finishFocused,
  chronographBars,
  chronographCopy,
  chronographCounts,
  chronographCsv,
  chronographDensity,
  chronographInner,
  chronographOuter,
  chronographTimeline,
  chronographKeepers,
  idleChronograph,
  laneTimezoneCount,
  lateChronograph,
  leadingTimezone,
  leadingTimezoneHue,
  lowerHourFocused,
  lowerHammerFocused,
  moveChronographFocus,
  overdueChronograph,
  pinChronographFocused,
  presentTimezoneLanes,
  raiseHourFocused,
  raiseHammerFocused,
  readHiddenTimezone,
  readChronographs,
  readChronographViews,
  readReviewedTimezone,
  reminderChronographs,
  restingChronograph,
  setChronographCoffer,
  setChronographFilm,
  setChronographFocused,
  setChronographPin,
  setChronographRaised,
  setChronographStar,
  sortChronographs,
  starChronographFocused,
  suggestHour,
  suggestFinish,
  suggestMode,
  toggleTimezone,
  toggleTimezoneReview,
  visibleTimezone,
  visibleTimezoneLanes,
  visibleChronographs,
  type TimezoneReview,
  type TimezoneRow,
  type TimezoneShape,
  type TimezoneValue,
  type Chronograph,
  type ChronographDensity,
  type ChronographSort,
  type ChronographTray,
  type ChronographView,
} from "@/lib/crmv4/round348";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["GILT", "IVORY", "GRAPHITE"] as const;
const DROPS = ["4", "8", "12", "16"] as const;
const LOCKS = ["3", "6", "12"] as const;

const PIECE_KEY: Record<string, CrmV4CopyKey> = {
  column: "chgColumn",
  clutch: "chgClutch",
  heart: "chgHeart",
  brake: "chgBrake",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "chgAuditSave",
  edit: "chgAuditEdit",
  note: "chgAuditNote",
  film: "chgAuditFilm",
  poise: "chgAuditPoise",
  free: "chgAuditFree",
  peg: "chgAuditPeg",
  return: "chgAuditReturn",
  coffer: "chgAuditCoffer",
  open: "chgAuditOpen",
  tag: "chgAuditTag",
  lock: "chgAuditRate",
  drop: "chgAuditBeat",
  lower: "chgAuditLower",
  star: "chgAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  utc: "tznLaneUtc",
  cet: "tznLaneCet",
  eet: "tznLaneEet",
  trt: "tznLaneTrt",
  join: "tznJoin",
  gap: "tznGap",
  brief: "tznBrief",
  long: "tznLong",
  mark: "tznMark",
  vowel: "tznVowel",
  plain: "tznPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "tznChampagne",
  ivory: "tznIvory",
  graphite: "tznGraphite",
};

const SHAPE_KEY: Record<TimezoneShape, CrmV4CopyKey> = {
  all: "tznShapeAll",
  utc: "tznShapeUtc",
  cet: "tznShapeCet",
  eet: "tznShapeEet",
  trt: "tznShapeTrt",
  join: "tznShapeJoin",
  gap: "tznShapeGap",
  brief: "tznShapeBrief",
  long: "tznShapeLong",
  mark: "tznShapeMark",
  vowel: "tznShapeVowel",
  plain: "tznShapePlain",
  open: "tznShapeOpen",
  soon: "tznShapeOpen",
  letter: "tznShapePlain",
  mixed: "tznShapeMark",
  upper: "tznShapeUtc",
  lower: "tznShapePlain",
  space: "tznShapeGap",
  even: "tznShapeEven",
  odd: "tznShapeEven",
  tail: "tznShapeMark",
  first: "tznShapePlain",
  held: "tznShapeLong",
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
  return key ? v4(key) : v4("chgBlankPiece");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "GILT") return v4("chgGilt");
  if (film === "IVORY") return v4("chgIvory");
  if (film === "GRAPHITE") return v4("chgGraphite");
  return v4("chgAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("tznBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("tznBlank");
}

export function ChronographRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Chronograph[]>([]);
  const [views, setViews] = useState<ChronographView[]>([]);
  const [density, setDensity] = useState<ChronographDensity>("airy");
  const [tray, setTray] = useState<ChronographTray>("board");
  const [query, setQuery] = useState("");
  const [setterFilter, setSetterFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [pieceFilter, setPieceFilter] = useState("all");
  const [dropFilter, setDropFilter] = useState("all");
  const [lockFilter, setLockFilter] = useState("all");
  const [sort, setSort] = useState<ChronographSort>("piece");
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
  const [station, setStation] = useState("column");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readChronographs(readJson(CHG_KEY, [])));
    setViews(readChronographViews(readJson(CHG_VIEW_KEY, [])));
    setDensity(chronographDensity(readJson(CHG_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Chronograph[]) {
    setCards(next);
    writeJson(CHG_KEY, next);
  }
  function storeViews(next: ChronographView[]) {
    setViews(next);
    writeJson(CHG_VIEW_KEY, next);
  }
  function storeDensity(next: ChronographDensity) {
    setDensity(next);
    writeJson(CHG_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortChronographs(visibleChronographs(cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter), sort),
    [cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter, sort],
  );
  const counts = chronographCounts(cards, shown, station);
  const bars = chronographBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = chronographTimeline(cards);
  const reminders = reminderChronographs(cards);
  const poisers = chronographKeepers(cards);
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
        download("chronograph-rules.csv", chronographCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveChronographFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveChronographFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addChronograph(cards, { title, note, setter: setter, piece, drop: dropNo, film, lock: lockNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-chronograph" aria-label={v4("chgTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-chronograph-mast">
        <p className="c4-chronograph-seal" data-logo="mono">{v4("chgLogo")}</p>
        <div>
          <p className="c4-chronograph-kicker">{v4("chgSub")}</p>
          <h2 className="c4-title">{v4("chgTitle")}</h2>
        </div>
        <p className="c4-chronograph-count">{shown.length}</p>
      </header>
      <p className="c4-chronograph-links">
        <Link href={crmv4Href(base, "tzn")}>{v4("tznTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("chgCustomers")}</Link>
      </p>
      <p className="c4-chronograph-hint">{v4("chgHint")}</p>
      {viewer && <p className="c4-chronograph-note">{v4("chgViewer")}</p>}
      <p className="c4-chronograph-meta">{v4("chgFair")} {fair || "—"} · {v4("chgBusy")} {busy || "—"} · {v4("chgSuggest")} {limbLabel(v4, suggestedLimb)} · {filmLabel(v4, suggestedFilm)} · {suggestedBeat}</p>
      <ol className="c4-chronograph-index" aria-label={v4("chgRemind")}>
        <li data-tone="gold">{v4("chgOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("chgIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("chgBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("chgResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-chronograph-remind c4-chronograph-notices" role="status" aria-label={v4("chgRemind")}>
          {reminders.map((name) => <li key={name}>{v4("chgOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-chronograph-chart" aria-label={v4("chgChart")}>
        {bars.map((bar) => (
          <button key={bar.piece} type="button" className="c4-chronograph-column" data-on={pieceFilter === bar.piece ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === bar.piece ? "all" : bar.piece)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{limbLabel(v4, bar.piece)}</span>
          </button>
        ))}
      </div>
      <form className="c4-chronograph-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("chgEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("chgEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("chgNote")}<input className="c4-field" aria-label={v4("chgNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("chgSetter")}<input className="c4-field" aria-label={v4("chgSetter")} aria-required={false} value={setter} maxLength={24} disabled={viewer} onChange={(event) => setSetter(event.target.value)} /></label>
        <label className="c4-lab">{v4("chgPiece")}<select className="c4-field" aria-label={v4("chgPiece")} value={piece} disabled={viewer} onChange={(event) => setPiece(event.target.value)}><option value="">{v4("chgBlankPiece")}</option>{CHG_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("chgFilm")}<select className="c4-field" aria-label={v4("chgFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("chgAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("chgDrop")}<select className="c4-field" aria-label={v4("chgDrop")} value={dropNo} disabled={viewer} onChange={(event) => setDropNo(event.target.value)}><option value="">{v4("chgAll")}</option>{DROPS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("chgLock")}<select className="c4-field" aria-label={v4("chgLock")} value={lockNo} disabled={viewer} onChange={(event) => setLockNo(event.target.value)}><option value="">{v4("chgAll")}</option>{LOCKS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("chgTag")}<input className="c4-field" aria-label={v4("chgTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("chgAdd")}</button>
      </form>
      <div className="c4-chronograph-tools">
        <input ref={searchRef} className="c4-field c4-chronograph-search" aria-label={v4("chgSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("chgSearch")} />
        {(["board", "peg", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "board" ? "chgBoard" : item === "peg" ? "chgPeg" : "chgCoffer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={pieceFilter === "inner" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "inner" ? "all" : "inner")}>{v4("chgInner")}</button>
        <button type="button" className="c4-chip" data-on={pieceFilter === "outer" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "outer" ? "all" : "outer")}>{v4("chgOuter")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "setter" ? "1" : "0"} onClick={() => setSort(sort === "setter" ? "piece" : "setter")}>{sort === "setter" ? v4("chgSortSetter") : v4("chgSortLimb")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("chgClose") : v4("chgAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("chgTimeline")}</button>
        <label className="c4-lab">{v4("chgDesk")}<select className="c4-field" aria-label={v4("chgDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{CHG_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-chronograph-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addChronographView(views, { id, name: viewName, tray, query, setter: setterFilter, film: filmFilter, piece: pieceFilter, drop: dropFilter, lock: lockFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("chgViewName")}<input className="c4-field" aria-label={v4("chgViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("chgSaveView")}</button>
      </form>
      <ul className="c4-chronograph-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setSetterFilter(view.setter); setFilmFilter(view.film); setPieceFilter(view.piece); setDropFilter(view.drop); setLockFilter(view.lock); }}>{v4("chgApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropChronographView(views, view.id))}>{v4("chgDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-chronograph-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkChronographRaise(cards, picked))}>{v4("chgBulkPoise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkChronographCoffer(cards, picked))}>{v4("chgBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkChronographGraphite(cards, picked))}>{v4("chgBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkChronographTag(cards, picked))}>{v4("chgBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("chronograph-rules.csv", chronographCsv(shown, station))}>{v4("chgCsv")}</button>
        <p className="c4-chronograph-meta">{v4("chgKeys")} / n x a j k · {v4("chgQuiet")} {counts.quiet} · {v4("chgInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-chronograph-time" aria-label={v4("chgTimeline")}>
          {timeline.map((mail) => <li key={mail.drop}><span>{mail.drop}</span> {mail.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("chgEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-chronograph-list">
          {shown.map((card) => {
            const late = lateChronograph(card, station);
            return (
              <li key={card.id} className="c4-chronograph-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleChronograph(card) ? "1" : "0"} data-brisk={briskChronograph(card) ? "1" : "0"} data-overdue={overdueChronograph(card) ? "1" : "0"} data-resting={restingChronograph(card) ? "1" : "0"} data-inner={chronographInner(card.piece) ? "1" : "0"} data-outer={chronographOuter(card.piece) ? "1" : "0"}>
                <label className="c4-chronograph-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editChronograph(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("chgEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("chgApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editChronographNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("chgNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-chronograph-meta">{limbLabel(v4, card.piece)} · {filmLabel(v4, card.film)} · {card.drop ?? "—"} · {card.lock} · {card.setter || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "chgAuditSave")}` : ""}{late ? ` · ${v4("chgOverdue")}` : ""}</p>
                </div>
                <div className="c4-chronograph-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("chgEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setChronographRaised(cards, card.id, !card.raised))}>{card.raised ? v4("chgFree") : v4("chgPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setChronographFilm(cards, card.id, suggestedFilm))}>{v4("chgSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setChronographPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("chgUnpeg") : v4("chgPegIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setChronographCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("chgUncoffer") : v4("chgCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setChronographStar(cards, card.id, !card.starred))}>{card.starred ? v4("chgUnstar") : v4("chgStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addChronographTag(cards, card.id, "r"))}>{v4("chgTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("chgRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("chgLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHammerFocused(cards, card.id))}>{v4("chgLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHammerFocused(cards, card.id))}>{v4("chgLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(finishFocused(cards, card.id))}>{v4("chgFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setChronographFocused(cards, card.id))}>{v4("chgPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinChronographFocused(cards, card.id))}>{v4("chgPeg")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starChronographFocused(cards, card.id))}>{v4("chgStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(chronographCopy(card))}>{v4("chgCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}


type TimezoneUser = { id?: string; name?: string | null; timezone?: string | null };

export function TimezonePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: TimezoneUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<TimezoneShape>("all");
  const [review, setReview] = useState<TimezoneReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): TimezoneRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { timezone: textField(row.timezone) } satisfies TimezoneValue,
    };
  }).filter((row): row is TimezoneRow => Boolean(row));
  const present = presentTimezoneLanes(rows);
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
    const next = readHiddenTimezone(readJson(TZN_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(TZN_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedTimezone(readJson(TZN_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(TZN_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleTimezoneLanes(present, hidden, showHidden);
  const shown = visibleTimezone(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = timezoneLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = timezoneLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingTimezone(rows);
  const leadHue = leadingTimezoneHue(rows);
  const whole = rows.filter((row) => timezoneLane(row.code)).length;
  const share = timezoneShare(laneTimezoneCount(rows, "utc"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("timezone-plates.csv", timezoneLanesCsv(rows));
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
    writeJson(TZN_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(TZN_REVIEW_KEY, next);
  }

  return (
    <section className="c4-tznplate" aria-label={v4("tznTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-tznplate-mast">
        <p className="c4-tznplate-seal" data-logo="mono">{v4("tznLogo")}</p>
        <div>
          <p className="c4-tznplate-kicker">{v4("tznSub")}</p>
          <h2 className="c4-title">{v4("tznTitle")}</h2>
        </div>
        <p className="c4-tznplate-count">{shown.length}</p>
      </header>
      <p className="c4-tznplate-links">
        <Link href={crmv4Href(base, "chg")}>{v4("chgTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("tznCustomer")}</Link>
      </p>
      <p className="c4-tznplate-hint">{v4("tznHint")}</p>
      {viewer && <p className="c4-tznplate-note">{v4("tznViewer")}</p>}
      <p className="c4-tznplate-meta">{v4("tznLead")} {laneLabel(v4, lead)} · {v4("tznToneLead")} {hueLabel(v4, leadHue)} · {v4("tznShare")} {share}</p>
      <div className="c4-tznplate-chart" aria-label={v4("tznChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-tznplate-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-tznplate-tools">
        <input ref={searchRef} className="c4-field c4-tznplate-search" aria-label={v4("tznSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("tznSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("tznShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "tznAll" : item === "reviewed" ? "tznReviewed" : "tznFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("tznAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as TimezoneShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleTimezone(hidden, item))}>{hidden.includes(item) ? v4("tznShow") : v4("tznHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-tznplate-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkTimezoneReview(reviewed, picked, true))}>{v4("tznBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkTimezoneReview(reviewed, picked, false))}>{v4("tznBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("timezone-lanes.csv", timezoneLanesCsv(rows))}>{v4("tznCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("timezone-rows.csv", timezoneRowsCsv(shown, reviewed))}>{v4("tznRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("tznLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("tznFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("tznEmpty")}</p>}
      <ul className="c4-tznplate-list">
        {shown.map((row) => {
          const name = timezoneCopy(row.code);
          const tone = timezoneHue(row.code);
          return (
            <li key={row.id} className="c4-tznplate-card" data-mail={timezoneLane(row.code) || "open"} data-hue={tone || "none"} data-lang-mark={timezoneLane(row.code) === "utc" ? "1" : "0"} data-away={timezoneAway(row.code) ? "1" : "0"} data-guest={timezoneGuest(row.code) ? "1" : "0"} data-citizen={timezoneCitizen(row.code) ? "1" : "0"} data-open={timezoneOpen(row.code) ? "1" : "0"} data-even={timezoneEven(row.code) ? "1" : "0"} data-digit={timezoneDigit(row.code) ? "1" : "0"} data-letter={timezoneLetter(row.code) ? "1" : "0"} data-mixed={timezoneMixed(row.code) ? "1" : "0"} data-upper={timezoneUpper(row.code) ? "1" : "0"} data-lower={timezoneLower(row.code) ? "1" : "0"} data-space={timezoneSpace(row.code) ? "1" : "0"} data-vowel={timezoneVowel(row.code) ? "1" : "0"} data-tail={timezoneTail(row.code) ? "1" : "0"} data-first={timezoneFirst(row.code) ? "1" : "0"} data-held={timezoneHeld(row.code) ? "1" : "0"} data-join={timezoneJoin(row.code) ? "1" : "0"} data-gap={timezoneGap(row.code) ? "1" : "0"} data-brief={timezoneBrief(row.code) ? "1" : "0"}>
              <label className="c4-tznplate-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-tznplate-meta">{name || v4("tznOpen")} · {timezoneStamp(row.code) || "—"} · {timezoneFamily(row.code) || "—"} · {timezoneLength(row.code) ?? "—"} · {laneLabel(v4, timezoneLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-tznplate-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleTimezoneReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("tznReviewed") : v4("tznReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = timezoneCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("tznCopied") : v4("tznCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("tznCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
