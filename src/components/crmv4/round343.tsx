"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  STT_KEY,
  STT_REVIEW_KEY,
  LVR_DENSITY_KEY,
  LVR_KEY,
  LVR_MODES,
  LVR_VIEW_KEY,
  addLever,
  addLeverTag,
  addLeverView,
  briskLever,
  bulkStreetReview,
  bulkLeverCoffer,
  bulkLeverGraphite,
  bulkLeverRaise,
  bulkLeverTag,
  busiestKeeper,
  dropLeverView,
  editLever,
  editLeverNote,
  streetBrief,
  streetCopy,
  streetDigit,
  streetEven,
  streetFamily,
  streetFirst,
  streetGap,
  streetHeld,
  streetAway,
  streetHue,
  streetJoin,
  streetCitizen,
  streetLane,
  streetLanes,
  streetLanesCsv,
  streetLength,
  streetLetter,
  streetLower,
  streetMixed,
  streetOpen,
  streetRowsCsv,
  streetShare,
  streetSpace,
  streetStamp,
  streetTail,
  streetUpper,
  streetGuest,
  streetVowel,
  fairKeeper,
  finishFocused,
  leverBars,
  leverCopy,
  leverCounts,
  leverCsv,
  leverDensity,
  leverInner,
  leverOuter,
  leverTimeline,
  leverKeepers,
  idleLever,
  laneStreetCount,
  lateLever,
  leadingStreet,
  leadingStreetHue,
  lowerHourFocused,
  lowerHammerFocused,
  moveLeverFocus,
  overdueLever,
  pinLeverFocused,
  presentStreetLanes,
  raiseHourFocused,
  raiseHammerFocused,
  readHiddenStreet,
  readLevers,
  readLeverViews,
  readReviewedStreet,
  reminderLevers,
  restingLever,
  setLeverCoffer,
  setLeverFilm,
  setLeverFocused,
  setLeverPin,
  setLeverRaised,
  setLeverStar,
  sortLevers,
  starLeverFocused,
  suggestHour,
  suggestFinish,
  suggestMode,
  toggleStreet,
  toggleStreetReview,
  visibleStreet,
  visibleStreetLanes,
  visibleLevers,
  type StreetReview,
  type StreetRow,
  type StreetShape,
  type StreetValue,
  type Lever,
  type LeverDensity,
  type LeverSort,
  type LeverTray,
  type LeverView,
} from "@/lib/crmv4/round343";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["GILT", "IVORY", "GRAPHITE"] as const;
const DROPS = ["3", "6", "9", "12"] as const;
const LOCKS = ["2", "3", "5"] as const;

const PIECE_KEY: Record<string, CrmV4CopyKey> = {
  draw: "lvrDraw",
  bank: "lvrBank",
  roller: "lvrRoller",
  guard: "lvrGuard",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "lvrAuditSave",
  edit: "lvrAuditEdit",
  note: "lvrAuditNote",
  film: "lvrAuditFilm",
  poise: "lvrAuditPoise",
  free: "lvrAuditFree",
  peg: "lvrAuditPeg",
  return: "lvrAuditReturn",
  coffer: "lvrAuditCoffer",
  open: "lvrAuditOpen",
  tag: "lvrAuditTag",
  lock: "lvrAuditRate",
  drop: "lvrAuditBeat",
  lower: "lvrAuditLower",
  star: "lvrAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  lane: "sttLane",
  court: "sttCourt",
  mews: "sttMews",
  yard: "sttYard",
  join: "sttJoin",
  gap: "sttGap",
  brief: "sttBrief",
  long: "sttLong",
  mark: "sttMark",
  vowel: "sttVowel",
  plain: "sttPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "sttChampagne",
  ivory: "sttIvory",
  graphite: "sttGraphite",
};

const SHAPE_KEY: Record<StreetShape, CrmV4CopyKey> = {
  all: "sttShapeAll",
  lane: "sttShapeLane",
  court: "sttShapeCourt",
  mews: "sttShapeMews",
  yard: "sttShapeYard",
  join: "sttShapeJoin",
  gap: "sttShapeGap",
  brief: "sttShapeBrief",
  long: "sttShapeLong",
  mark: "sttShapeMark",
  vowel: "sttShapeVowel",
  plain: "sttShapePlain",
  open: "sttShapeOpen",
  soon: "sttShapeOpen",
  letter: "sttShapePlain",
  mixed: "sttShapeMark",
  upper: "sttShapeLane",
  lower: "sttShapePlain",
  space: "sttShapeGap",
  even: "sttShapeEven",
  odd: "sttShapeEven",
  tail: "sttShapeMark",
  first: "sttShapePlain",
  held: "sttShapeLong",
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
  return key ? v4(key) : v4("lvrBlankPiece");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "GILT") return v4("lvrGilt");
  if (film === "IVORY") return v4("lvrIvory");
  if (film === "GRAPHITE") return v4("lvrGraphite");
  return v4("lvrAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("sttBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("sttBlank");
}

export function LeverRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Lever[]>([]);
  const [views, setViews] = useState<LeverView[]>([]);
  const [density, setDensity] = useState<LeverDensity>("airy");
  const [tray, setTray] = useState<LeverTray>("board");
  const [query, setQuery] = useState("");
  const [setterFilter, setSetterFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [pieceFilter, setPieceFilter] = useState("all");
  const [dropFilter, setDropFilter] = useState("all");
  const [lockFilter, setLockFilter] = useState("all");
  const [sort, setSort] = useState<LeverSort>("piece");
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
  const [station, setStation] = useState("draw");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readLevers(readJson(LVR_KEY, [])));
    setViews(readLeverViews(readJson(LVR_VIEW_KEY, [])));
    setDensity(leverDensity(readJson(LVR_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Lever[]) {
    setCards(next);
    writeJson(LVR_KEY, next);
  }
  function storeViews(next: LeverView[]) {
    setViews(next);
    writeJson(LVR_VIEW_KEY, next);
  }
  function storeDensity(next: LeverDensity) {
    setDensity(next);
    writeJson(LVR_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortLevers(visibleLevers(cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter), sort),
    [cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter, sort],
  );
  const counts = leverCounts(cards, shown, station);
  const bars = leverBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = leverTimeline(cards);
  const reminders = reminderLevers(cards);
  const poisers = leverKeepers(cards);
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
        download("lever-rules.csv", leverCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveLeverFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveLeverFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addLever(cards, { title, note, setter: setter, piece, drop: dropNo, film, lock: lockNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-lever" aria-label={v4("lvrTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-lever-mast">
        <p className="c4-lever-seal" data-logo="mono">{v4("lvrLogo")}</p>
        <div>
          <p className="c4-lever-kicker">{v4("lvrSub")}</p>
          <h2 className="c4-title">{v4("lvrTitle")}</h2>
        </div>
        <p className="c4-lever-count">{shown.length}</p>
      </header>
      <p className="c4-lever-links">
        <Link href={crmv4Href(base, "stt")}>{v4("sttTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("lvrCustomers")}</Link>
      </p>
      <p className="c4-lever-hint">{v4("lvrHint")}</p>
      {viewer && <p className="c4-lever-note">{v4("lvrViewer")}</p>}
      <p className="c4-lever-meta">{v4("lvrFair")} {fair || "—"} · {v4("lvrBusy")} {busy || "—"} · {v4("lvrSuggest")} {limbLabel(v4, suggestedLimb)} · {filmLabel(v4, suggestedFilm)} · {suggestedBeat}</p>
      <ol className="c4-lever-index" aria-label={v4("lvrRemind")}>
        <li data-tone="gold">{v4("lvrOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("lvrIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("lvrBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("lvrResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-lever-remind c4-lever-notices" role="status" aria-label={v4("lvrRemind")}>
          {reminders.map((name) => <li key={name}>{v4("lvrOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-lever-chart" aria-label={v4("lvrChart")}>
        {bars.map((bar) => (
          <button key={bar.piece} type="button" className="c4-lever-column" data-on={pieceFilter === bar.piece ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === bar.piece ? "all" : bar.piece)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{limbLabel(v4, bar.piece)}</span>
          </button>
        ))}
      </div>
      <form className="c4-lever-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("lvrEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("lvrEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("lvrNote")}<input className="c4-field" aria-label={v4("lvrNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("lvrSetter")}<input className="c4-field" aria-label={v4("lvrSetter")} aria-required={false} value={setter} maxLength={24} disabled={viewer} onChange={(event) => setSetter(event.target.value)} /></label>
        <label className="c4-lab">{v4("lvrPiece")}<select className="c4-field" aria-label={v4("lvrPiece")} value={piece} disabled={viewer} onChange={(event) => setPiece(event.target.value)}><option value="">{v4("lvrBlankPiece")}</option>{LVR_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("lvrFilm")}<select className="c4-field" aria-label={v4("lvrFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("lvrAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("lvrDrop")}<select className="c4-field" aria-label={v4("lvrDrop")} value={dropNo} disabled={viewer} onChange={(event) => setDropNo(event.target.value)}><option value="">{v4("lvrAll")}</option>{DROPS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("lvrLock")}<select className="c4-field" aria-label={v4("lvrLock")} value={lockNo} disabled={viewer} onChange={(event) => setLockNo(event.target.value)}><option value="">{v4("lvrAll")}</option>{LOCKS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("lvrTag")}<input className="c4-field" aria-label={v4("lvrTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("lvrAdd")}</button>
      </form>
      <div className="c4-lever-tools">
        <input ref={searchRef} className="c4-field c4-lever-search" aria-label={v4("lvrSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("lvrSearch")} />
        {(["board", "peg", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "board" ? "lvrBoard" : item === "peg" ? "lvrPeg" : "lvrCoffer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={pieceFilter === "inner" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "inner" ? "all" : "inner")}>{v4("lvrInner")}</button>
        <button type="button" className="c4-chip" data-on={pieceFilter === "outer" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "outer" ? "all" : "outer")}>{v4("lvrOuter")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "setter" ? "1" : "0"} onClick={() => setSort(sort === "setter" ? "piece" : "setter")}>{sort === "setter" ? v4("lvrSortSetter") : v4("lvrSortLimb")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("lvrClose") : v4("lvrAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("lvrTimeline")}</button>
        <label className="c4-lab">{v4("lvrDesk")}<select className="c4-field" aria-label={v4("lvrDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{LVR_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-lever-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addLeverView(views, { id, name: viewName, tray, query, setter: setterFilter, film: filmFilter, piece: pieceFilter, drop: dropFilter, lock: lockFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("lvrViewName")}<input className="c4-field" aria-label={v4("lvrViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("lvrSaveView")}</button>
      </form>
      <ul className="c4-lever-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setSetterFilter(view.setter); setFilmFilter(view.film); setPieceFilter(view.piece); setDropFilter(view.drop); setLockFilter(view.lock); }}>{v4("lvrApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropLeverView(views, view.id))}>{v4("lvrDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-lever-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkLeverRaise(cards, picked))}>{v4("lvrBulkPoise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkLeverCoffer(cards, picked))}>{v4("lvrBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkLeverGraphite(cards, picked))}>{v4("lvrBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkLeverTag(cards, picked))}>{v4("lvrBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("lever-rules.csv", leverCsv(shown, station))}>{v4("lvrCsv")}</button>
        <p className="c4-lever-meta">{v4("lvrKeys")} / n x a j k · {v4("lvrQuiet")} {counts.quiet} · {v4("lvrInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-lever-time" aria-label={v4("lvrTimeline")}>
          {timeline.map((lane) => <li key={lane.drop}><span>{lane.drop}</span> {lane.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("lvrEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-lever-list">
          {shown.map((card) => {
            const late = lateLever(card, station);
            return (
              <li key={card.id} className="c4-lever-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleLever(card) ? "1" : "0"} data-brisk={briskLever(card) ? "1" : "0"} data-overdue={overdueLever(card) ? "1" : "0"} data-resting={restingLever(card) ? "1" : "0"} data-inner={leverInner(card.piece) ? "1" : "0"} data-outer={leverOuter(card.piece) ? "1" : "0"}>
                <label className="c4-lever-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editLever(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("lvrEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("lvrApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editLeverNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("lvrNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-lever-meta">{limbLabel(v4, card.piece)} · {filmLabel(v4, card.film)} · {card.drop ?? "—"} · {card.lock} · {card.setter || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "lvrAuditSave")}` : ""}{late ? ` · ${v4("lvrOverdue")}` : ""}</p>
                </div>
                <div className="c4-lever-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("lvrEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLeverRaised(cards, card.id, !card.raised))}>{card.raised ? v4("lvrFree") : v4("lvrPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLeverFilm(cards, card.id, suggestedFilm))}>{v4("lvrSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLeverPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("lvrUnpeg") : v4("lvrPegIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLeverCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("lvrUncoffer") : v4("lvrCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLeverStar(cards, card.id, !card.starred))}>{card.starred ? v4("lvrUnstar") : v4("lvrStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addLeverTag(cards, card.id, "d"))}>{v4("lvrTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("lvrRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("lvrLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHammerFocused(cards, card.id))}>{v4("lvrLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHammerFocused(cards, card.id))}>{v4("lvrLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(finishFocused(cards, card.id))}>{v4("lvrFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLeverFocused(cards, card.id))}>{v4("lvrPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinLeverFocused(cards, card.id))}>{v4("lvrPeg")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starLeverFocused(cards, card.id))}>{v4("lvrStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(leverCopy(card))}>{v4("lvrCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type StreetUser = { id?: string; name?: string | null; address?: boolean | string | null };

export function StreetLanePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: StreetUser[] }>("/api/admin/users?take=24&meta=0");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<StreetShape>("all");
  const [review, setReview] = useState<StreetReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): StreetRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { address: textField(row.address) } satisfies StreetValue,
    };
  }).filter((row): row is StreetRow => Boolean(row));
  const present = presentStreetLanes(rows);
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
    const next = readHiddenStreet(readJson(STT_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(STT_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedStreet(readJson(STT_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(STT_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleStreetLanes(present, hidden, showHidden);
  const shown = visibleStreet(rows, lanes.includes(lane) || lane === "all" ? lane : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = streetLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = streetLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingStreet(rows);
  const leadHue = leadingStreetHue(rows);
  const whole = rows.filter((row) => streetLane(row.code)).length;
  const share = streetShare(laneStreetCount(rows, "lane"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("street-lanes.csv", streetLanesCsv(rows));
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
    writeJson(STT_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(STT_REVIEW_KEY, next);
  }

  return (
    <section className="c4-street" aria-label={v4("sttTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-street-mast">
        <p className="c4-street-seal" data-logo="mono">{v4("sttLogo")}</p>
        <div>
          <p className="c4-street-kicker">{v4("sttSub")}</p>
          <h2 className="c4-title">{v4("sttTitle")}</h2>
        </div>
        <p className="c4-street-count">{shown.length}</p>
      </header>
      <p className="c4-street-links">
        <Link href={crmv4Href(base, "lvr")}>{v4("lvrTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("sttCustomer")}</Link>
      </p>
      <p className="c4-street-hint">{v4("sttHint")}</p>
      {viewer && <p className="c4-street-note">{v4("sttViewer")}</p>}
      <p className="c4-street-meta">{v4("sttLead")} {laneLabel(v4, lead)} · {v4("sttToneLead")} {hueLabel(v4, leadHue)} · {v4("sttShare")} {share}</p>
      <div className="c4-street-chart" aria-label={v4("sttChart")}>
        {lines.map((line) => (
          <button key={line.lane} type="button" className="c4-street-column" data-on={lane === line.lane ? "1" : "0"} data-lane={line.lane} onClick={() => setLane(lane === line.lane ? "all" : line.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-street-tools">
        <input ref={searchRef} className="c4-field c4-street-search" aria-label={v4("sttSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("sttSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("sttShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "sttAll" : item === "reviewed" ? "sttReviewed" : "sttFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("sttAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as StreetShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleStreet(hidden, item))}>{hidden.includes(item) ? v4("sttShow") : v4("sttHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-street-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkStreetReview(reviewed, picked, true))}>{v4("sttBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkStreetReview(reviewed, picked, false))}>{v4("sttBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("street-lanes.csv", streetLanesCsv(rows))}>{v4("sttCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("street-rows.csv", streetRowsCsv(shown, reviewed))}>{v4("sttRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("sttLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("sttFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("sttEmpty")}</p>}
      <ul className="c4-street-list">
        {shown.map((row) => {
          const name = streetCopy(row.code);
          const tone = streetHue(row.code);
          return (
            <li key={row.id} className="c4-street-card" data-lane={streetLane(row.code) || "open"} data-hue={tone || "none"} data-lane-mark={streetLane(row.code) === "lane" ? "1" : "0"} data-away={streetAway(row.code) ? "1" : "0"} data-guest={streetGuest(row.code) ? "1" : "0"} data-citizen={streetCitizen(row.code) ? "1" : "0"} data-open={streetOpen(row.code) ? "1" : "0"} data-even={streetEven(row.code) ? "1" : "0"} data-digit={streetDigit(row.code) ? "1" : "0"} data-letter={streetLetter(row.code) ? "1" : "0"} data-mixed={streetMixed(row.code) ? "1" : "0"} data-upper={streetUpper(row.code) ? "1" : "0"} data-lower={streetLower(row.code) ? "1" : "0"} data-space={streetSpace(row.code) ? "1" : "0"} data-vowel={streetVowel(row.code) ? "1" : "0"} data-tail={streetTail(row.code) ? "1" : "0"} data-first={streetFirst(row.code) ? "1" : "0"} data-held={streetHeld(row.code) ? "1" : "0"} data-join={streetJoin(row.code) ? "1" : "0"} data-gap={streetGap(row.code) ? "1" : "0"} data-brief={streetBrief(row.code) ? "1" : "0"}>
              <label className="c4-street-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-street-meta">{name || v4("sttOpen")} · {streetStamp(row.code) || "—"} · {streetFamily(row.code) || "—"} · {streetLength(row.code) ?? "—"} · {laneLabel(v4, streetLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-street-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleStreetReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("sttReviewed") : v4("sttReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = streetCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("sttCopied") : v4("sttCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("sttCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
