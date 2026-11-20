"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  DVP_KEY,
  DVP_REVIEW_KEY,
  EWL_DENSITY_KEY,
  EWL_KEY,
  EWL_PIECES,
  EWL_VIEW_KEY,
  addEscape,
  addEscapeTag,
  addEscapeView,
  briskEscape,
  bulkDeviceReview,
  bulkEscapeCoffer,
  bulkEscapeGraphite,
  bulkEscapeRaise,
  bulkEscapeTag,
  busiestSetter,
  dropEscapeView,
  editEscape,
  editEscapeNote,
  devicePip,
  deviceCopy,
  deviceDigit,
  deviceEven,
  deviceFamily,
  deviceFirst,
  deviceGap,
  deviceHeld,
  deviceSlab,
  deviceHue,
  deviceJoin,
  deviceKios,
  deviceLane,
  deviceLanes,
  deviceLanesCsv,
  deviceLength,
  deviceLetter,
  deviceLower,
  deviceMixed,
  deviceOpen,
  deviceRowsCsv,
  deviceShare,
  deviceSpace,
  deviceStamp,
  deviceTail,
  deviceUpper,
  deviceMini,
  deviceVowel,
  fairSetter,
  filmFocused,
  escapeBars,
  escapeCopy,
  escapeCounts,
  escapeCsv,
  escapeDensity,
  escapeInner,
  escapeOuter,
  escapeTimeline,
  escapeSetters,
  idleEscape,
  laneDeviceCount,
  lateEscape,
  leadingDevice,
  leadingDeviceHue,
  lowerDropFocused,
  lowerLockFocused,
  moveEscapeFocus,
  overdueEscape,
  pinEscapeFocused,
  presentDeviceLanes,
  raiseDropFocused,
  raiseLockFocused,
  readHiddenDevice,
  readEscapeWheels,
  readEscapeViews,
  readReviewedDevice,
  reminderEscapeWheels,
  restingEscape,
  setEscapeCoffer,
  setEscapeFilm,
  setEscapeFocused,
  setEscapePin,
  setEscapeRaised,
  setEscapeStar,
  sortEscapeWheels,
  starEscapeFocused,
  suggestDrop,
  suggestFinish,
  suggestPiece,
  toggleDevice,
  toggleDeviceReview,
  visibleDevice,
  visibleDeviceLanes,
  visibleEscapeWheels,
  type DeviceReview,
  type DeviceRow,
  type DeviceShape,
  type DeviceValue,
  type EscapeWheel,
  type EscapeDensity,
  type EscapeSort,
  type EscapeTray,
  type EscapeView,
} from "@/lib/crmv4/round340";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["GILT", "IVORY", "GRAPHITE"] as const;
const DROPS = ["3", "9", "18", "27"] as const;
const LOCKS = ["3", "6", "9"] as const;

const PIECE_KEY: Record<string, CrmV4CopyKey> = {
  tooth: "ewlTooth",
  pinion: "ewlPinion",
  arbor: "ewlArbor",
  stone: "ewlStone",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "ewlAuditSave",
  edit: "ewlAuditEdit",
  note: "ewlAuditNote",
  film: "ewlAuditFilm",
  poise: "ewlAuditPoise",
  free: "ewlAuditFree",
  peg: "ewlAuditPeg",
  return: "ewlAuditReturn",
  coffer: "ewlAuditCoffer",
  open: "ewlAuditOpen",
  tag: "ewlAuditTag",
  lock: "ewlAuditRate",
  drop: "ewlAuditBeat",
  lower: "ewlAuditLower",
  star: "ewlAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  palm: "dvpPalm",
  slab: "dvpSlab",
  mini: "dvpMini",
  kios: "dvpKios",
  join: "dvpJoin",
  gap: "dvpGap",
  pip: "dvpPip",
  strap: "dvpStrap",
  mark: "dvpMark",
  vowel: "dvpVowel",
  plain: "dvpPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "dvpChampagne",
  ivory: "dvpIvory",
  graphite: "dvpGraphite",
};

const SHAPE_KEY: Record<DeviceShape, CrmV4CopyKey> = {
  all: "dvpShapeAll",
  palm: "dvpShapePalm",
  slab: "dvpShapeSlab",
  mini: "dvpShapeMini",
  kios: "dvpShapeKios",
  join: "dvpShapeJoin",
  gap: "dvpShapeGap",
  pip: "dvpShapePip",
  strap: "dvpShapeStrap",
  mark: "dvpShapeMark",
  vowel: "dvpShapeVowel",
  plain: "dvpShapePlain",
  open: "dvpShapeOpen",
  soon: "dvpShapeOpen",
  letter: "dvpShapePlain",
  mixed: "dvpShapeMark",
  upper: "dvpShapePalm",
  lower: "dvpShapePlain",
  space: "dvpShapeGap",
  even: "dvpShapeEven",
  odd: "dvpShapeEven",
  tail: "dvpShapeMark",
  first: "dvpShapePlain",
  held: "dvpShapeStrap",
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
  return key ? v4(key) : v4("ewlBlankPiece");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "GILT") return v4("ewlGilt");
  if (film === "IVORY") return v4("ewlIvory");
  if (film === "GRAPHITE") return v4("ewlGraphite");
  return v4("ewlAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("dvpBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("dvpBlank");
}

export function EscapeWheelRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<EscapeWheel[]>([]);
  const [views, setViews] = useState<EscapeView[]>([]);
  const [density, setDensity] = useState<EscapeDensity>("airy");
  const [tray, setTray] = useState<EscapeTray>("board");
  const [query, setQuery] = useState("");
  const [setterFilter, setSetterFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [pieceFilter, setPieceFilter] = useState("all");
  const [dropFilter, setDropFilter] = useState("all");
  const [lockFilter, setLockFilter] = useState("all");
  const [sort, setSort] = useState<EscapeSort>("piece");
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
  const [station, setStation] = useState("tooth");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readEscapeWheels(readJson(EWL_KEY, [])));
    setViews(readEscapeViews(readJson(EWL_VIEW_KEY, [])));
    setDensity(escapeDensity(readJson(EWL_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: EscapeWheel[]) {
    setCards(next);
    writeJson(EWL_KEY, next);
  }
  function storeViews(next: EscapeView[]) {
    setViews(next);
    writeJson(EWL_VIEW_KEY, next);
  }
  function storeDensity(next: EscapeDensity) {
    setDensity(next);
    writeJson(EWL_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortEscapeWheels(visibleEscapeWheels(cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter), sort),
    [cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter, sort],
  );
  const counts = escapeCounts(cards, shown, station);
  const bars = escapeBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = escapeTimeline(cards);
  const reminders = reminderEscapeWheels(cards);
  const poisers = escapeSetters(cards);
  const busy = busiestSetter(cards);
  const fair = fairSetter(cards, poisers.join(","));
  const suggestedFilm = suggestFinish(cards);
  const suggestedBeat = suggestDrop(cards, clock);
  const suggestedLimb = suggestPiece(clock);
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
        download("escapewheel-rules.csv", escapeCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveEscapeFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveEscapeFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addEscape(cards, { title, note, setter: setter, piece, drop: dropNo, film, lock: lockNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-escapewheel" aria-label={v4("ewlTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-escapewheel-mast">
        <p className="c4-escapewheel-seal" data-logo="mono">{v4("ewlLogo")}</p>
        <div>
          <p className="c4-escapewheel-kicker">{v4("ewlSub")}</p>
          <h2 className="c4-title">{v4("ewlTitle")}</h2>
        </div>
        <p className="c4-escapewheel-count">{shown.length}</p>
      </header>
      <p className="c4-escapewheel-links">
        <Link href={crmv4Href(base, "dvp")}>{v4("dvpTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("ewlCustomers")}</Link>
      </p>
      <p className="c4-escapewheel-hint">{v4("ewlHint")}</p>
      {viewer && <p className="c4-escapewheel-note">{v4("ewlViewer")}</p>}
      <p className="c4-escapewheel-meta">{v4("ewlFair")} {fair || "—"} · {v4("ewlBusy")} {busy || "—"} · {v4("ewlSuggest")} {limbLabel(v4, suggestedLimb)} · {filmLabel(v4, suggestedFilm)} · {suggestedBeat}</p>
      <ol className="c4-escapewheel-index" aria-label={v4("ewlRemind")}>
        <li data-tone="gold">{v4("ewlOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("ewlIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("ewlBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("ewlResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-escapewheel-remind c4-escapewheel-notices" role="status" aria-label={v4("ewlRemind")}>
          {reminders.map((name) => <li key={name}>{v4("ewlOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-escapewheel-chart" aria-label={v4("ewlChart")}>
        {bars.map((bar) => (
          <button key={bar.piece} type="button" className="c4-escapewheel-column" data-on={pieceFilter === bar.piece ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === bar.piece ? "all" : bar.piece)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{limbLabel(v4, bar.piece)}</span>
          </button>
        ))}
      </div>
      <form className="c4-escapewheel-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("ewlEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("ewlEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("ewlNote")}<input className="c4-field" aria-label={v4("ewlNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("ewlSetter")}<input className="c4-field" aria-label={v4("ewlSetter")} aria-required={false} value={setter} maxLength={24} disabled={viewer} onChange={(event) => setSetter(event.target.value)} /></label>
        <label className="c4-lab">{v4("ewlPiece")}<select className="c4-field" aria-label={v4("ewlPiece")} value={piece} disabled={viewer} onChange={(event) => setPiece(event.target.value)}><option value="">{v4("ewlBlankPiece")}</option>{EWL_PIECES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("ewlFilm")}<select className="c4-field" aria-label={v4("ewlFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("ewlAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("ewlDrop")}<select className="c4-field" aria-label={v4("ewlDrop")} value={dropNo} disabled={viewer} onChange={(event) => setDropNo(event.target.value)}><option value="">{v4("ewlAll")}</option>{DROPS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("ewlLock")}<select className="c4-field" aria-label={v4("ewlLock")} value={lockNo} disabled={viewer} onChange={(event) => setLockNo(event.target.value)}><option value="">{v4("ewlAll")}</option>{LOCKS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("ewlTag")}<input className="c4-field" aria-label={v4("ewlTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("ewlAdd")}</button>
      </form>
      <div className="c4-escapewheel-tools">
        <input ref={searchRef} className="c4-field c4-escapewheel-search" aria-label={v4("ewlSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("ewlSearch")} />
        {(["board", "peg", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "board" ? "ewlBoard" : item === "peg" ? "ewlPeg" : "ewlCoffer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={pieceFilter === "inner" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "inner" ? "all" : "inner")}>{v4("ewlInner")}</button>
        <button type="button" className="c4-chip" data-on={pieceFilter === "outer" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "outer" ? "all" : "outer")}>{v4("ewlOuter")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "setter" ? "1" : "0"} onClick={() => setSort(sort === "setter" ? "piece" : "setter")}>{sort === "setter" ? v4("ewlSortSetter") : v4("ewlSortLimb")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("ewlClose") : v4("ewlAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("ewlTimeline")}</button>
        <label className="c4-lab">{v4("ewlDesk")}<select className="c4-field" aria-label={v4("ewlDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{EWL_PIECES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-escapewheel-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addEscapeView(views, { id, name: viewName, tray, query, setter: setterFilter, film: filmFilter, piece: pieceFilter, drop: dropFilter, lock: lockFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("ewlViewName")}<input className="c4-field" aria-label={v4("ewlViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("ewlSaveView")}</button>
      </form>
      <ul className="c4-escapewheel-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setSetterFilter(view.setter); setFilmFilter(view.film); setPieceFilter(view.piece); setDropFilter(view.drop); setLockFilter(view.lock); }}>{v4("ewlApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropEscapeView(views, view.id))}>{v4("ewlDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-escapewheel-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkEscapeRaise(cards, picked))}>{v4("ewlBulkPoise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkEscapeCoffer(cards, picked))}>{v4("ewlBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkEscapeGraphite(cards, picked))}>{v4("ewlBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkEscapeTag(cards, picked))}>{v4("ewlBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("escapewheel-rules.csv", escapeCsv(shown, station))}>{v4("ewlCsv")}</button>
        <p className="c4-escapewheel-meta">{v4("ewlKeys")} / n x a j k · {v4("ewlQuiet")} {counts.quiet} · {v4("ewlInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-escapewheel-time" aria-label={v4("ewlTimeline")}>
          {timeline.map((lane) => <li key={lane.drop}><span>{lane.drop}</span> {lane.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("ewlEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-escapewheel-list">
          {shown.map((card) => {
            const late = lateEscape(card, station);
            return (
              <li key={card.id} className="c4-escapewheel-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleEscape(card) ? "1" : "0"} data-brisk={briskEscape(card) ? "1" : "0"} data-overdue={overdueEscape(card) ? "1" : "0"} data-resting={restingEscape(card) ? "1" : "0"} data-inner={escapeInner(card.piece) ? "1" : "0"} data-outer={escapeOuter(card.piece) ? "1" : "0"}>
                <label className="c4-escapewheel-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editEscape(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("ewlEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("ewlApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editEscapeNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("ewlNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-escapewheel-meta">{limbLabel(v4, card.piece)} · {filmLabel(v4, card.film)} · {card.drop ?? "—"} · {card.lock} · {card.setter || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "ewlAuditSave")}` : ""}{late ? ` · ${v4("ewlOverdue")}` : ""}</p>
                </div>
                <div className="c4-escapewheel-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("ewlEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setEscapeRaised(cards, card.id, !card.raised))}>{card.raised ? v4("ewlFree") : v4("ewlPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setEscapeFilm(cards, card.id, suggestedFilm))}>{v4("ewlSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setEscapePin(cards, card.id, !card.pinned))}>{card.pinned ? v4("ewlUnpeg") : v4("ewlPegIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setEscapeCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("ewlUncoffer") : v4("ewlCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setEscapeStar(cards, card.id, !card.starred))}>{card.starred ? v4("ewlUnstar") : v4("ewlStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addEscapeTag(cards, card.id, "c"))}>{v4("ewlTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseDropFocused(cards, card.id))}>{v4("ewlRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDropFocused(cards, card.id))}>{v4("ewlLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseLockFocused(cards, card.id))}>{v4("ewlLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerLockFocused(cards, card.id))}>{v4("ewlLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(filmFocused(cards, card.id))}>{v4("ewlFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setEscapeFocused(cards, card.id))}>{v4("ewlPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinEscapeFocused(cards, card.id))}>{v4("ewlPeg")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starEscapeFocused(cards, card.id))}>{v4("ewlStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(escapeCopy(card))}>{v4("ewlCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type DeviceUser = { id?: string; name?: string | null; lastDevice?: string | null };

export function DevicePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: DeviceUser[] }>("/api/admin/users?take=24&meta=0");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<DeviceShape>("all");
  const [review, setReview] = useState<DeviceReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): DeviceRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { lastDevice: textField(row.lastDevice) } satisfies DeviceValue,
    };
  }).filter((row): row is DeviceRow => Boolean(row));
  const present = presentDeviceLanes(rows);
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
    const next = readHiddenDevice(readJson(DVP_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(DVP_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedDevice(readJson(DVP_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(DVP_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleDeviceLanes(present, hidden, showHidden);
  const shown = visibleDevice(rows, lanes.includes(lane) || lane === "all" ? lane : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = deviceLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = deviceLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingDevice(rows);
  const leadHue = leadingDeviceHue(rows);
  const whole = rows.filter((row) => deviceLane(row.code)).length;
  const share = deviceShare(laneDeviceCount(rows, "palm"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("device-lanes.csv", deviceLanesCsv(rows));
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
    writeJson(DVP_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(DVP_REVIEW_KEY, next);
  }

  return (
    <section className="c4-device" aria-label={v4("dvpTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-device-mast">
        <p className="c4-device-seal" data-logo="mono">{v4("dvpLogo")}</p>
        <div>
          <p className="c4-device-kicker">{v4("dvpSub")}</p>
          <h2 className="c4-title">{v4("dvpTitle")}</h2>
        </div>
        <p className="c4-device-count">{shown.length}</p>
      </header>
      <p className="c4-device-links">
        <Link href={crmv4Href(base, "ewl")}>{v4("ewlTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("dvpCustomer")}</Link>
      </p>
      <p className="c4-device-hint">{v4("dvpHint")}</p>
      {viewer && <p className="c4-device-note">{v4("dvpViewer")}</p>}
      <p className="c4-device-meta">{v4("dvpLead")} {laneLabel(v4, lead)} · {v4("dvpToneLead")} {hueLabel(v4, leadHue)} · {v4("dvpShare")} {share}</p>
      <div className="c4-device-chart" aria-label={v4("dvpChart")}>
        {lines.map((line) => (
          <button key={line.lane} type="button" className="c4-device-column" data-on={lane === line.lane ? "1" : "0"} data-lane={line.lane} onClick={() => setLane(lane === line.lane ? "all" : line.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-device-tools">
        <input ref={searchRef} className="c4-field c4-device-search" aria-label={v4("dvpSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("dvpSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("dvpShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "dvpAll" : item === "reviewed" ? "dvpReviewed" : "dvpFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("dvpAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as DeviceShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleDevice(hidden, item))}>{hidden.includes(item) ? v4("dvpShow") : v4("dvpHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-device-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkDeviceReview(reviewed, picked, true))}>{v4("dvpBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkDeviceReview(reviewed, picked, false))}>{v4("dvpBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("device-lanes.csv", deviceLanesCsv(rows))}>{v4("dvpCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("device-rows.csv", deviceRowsCsv(shown, reviewed))}>{v4("dvpRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("dvpLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("dvpFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("dvpEmpty")}</p>}
      <ul className="c4-device-list">
        {shown.map((row) => {
          const name = deviceCopy(row.code);
          const tone = deviceHue(row.code);
          return (
            <li key={row.id} className="c4-device-card" data-lane={deviceLane(row.code) || "open"} data-hue={tone || "none"} data-palm={deviceLane(row.code) === "palm" ? "1" : "0"} data-slab={deviceSlab(row.code) ? "1" : "0"} data-mini={deviceMini(row.code) ? "1" : "0"} data-kios={deviceKios(row.code) ? "1" : "0"} data-open={deviceOpen(row.code) ? "1" : "0"} data-even={deviceEven(row.code) ? "1" : "0"} data-digit={deviceDigit(row.code) ? "1" : "0"} data-letter={deviceLetter(row.code) ? "1" : "0"} data-mixed={deviceMixed(row.code) ? "1" : "0"} data-upper={deviceUpper(row.code) ? "1" : "0"} data-lower={deviceLower(row.code) ? "1" : "0"} data-space={deviceSpace(row.code) ? "1" : "0"} data-vowel={deviceVowel(row.code) ? "1" : "0"} data-tail={deviceTail(row.code) ? "1" : "0"} data-first={deviceFirst(row.code) ? "1" : "0"} data-held={deviceHeld(row.code) ? "1" : "0"} data-join={deviceJoin(row.code) ? "1" : "0"} data-gap={deviceGap(row.code) ? "1" : "0"} data-pip={devicePip(row.code) ? "1" : "0"}>
              <label className="c4-device-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-device-meta">{name || v4("dvpOpen")} · {deviceStamp(row.code) || "—"} · {deviceFamily(row.code) || "—"} · {deviceLength(row.code) ?? "—"} · {laneLabel(v4, deviceLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-device-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleDeviceReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("dvpReviewed") : v4("dvpReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = deviceCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("dvpCopied") : v4("dvpCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("dvpCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
