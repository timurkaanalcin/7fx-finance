"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  LSR_KEY,
  LSR_REVIEW_KEY,
  PGL_DENSITY_KEY,
  PGL_KEY,
  PGL_MODES,
  PGL_VIEW_KEY,
  addPerlage,
  addPerlageTag,
  addPerlageView,
  briskPerlage,
  bulkLsrReview,
  bulkPerlageCoffer,
  bulkPerlageGraphite,
  bulkPerlageRaise,
  bulkPerlageTag,
  busiestKeeper,
  dropPerlageView,
  editPerlage,
  editPerlageNote,
  lsrBrief,
  lsrCopy,
  lsrDigit,
  lsrEven,
  lsrFamily,
  lsrFirst,
  lsrRoute,
  lsrHeld,
  lsrAway,
  lsrHue,
  lsrJoin,
  lsrCitizen,
  lsrLane,
  lsrLanes,
  lsrLanesCsv,
  lsrLength,
  lsrLetter,
  lsrLower,
  lsrMixed,
  lsrOpen,
  lsrRowsCsv,
  lsrShare,
  lsrSpace,
  lsrStamp,
  lsrTail,
  lsrUpper,
  lsrGuest,
  lsrVowel,
  fairKeeper,
  finishFocused,
  perlageBars,
  perlageCopy,
  perlageCounts,
  perlageCsv,
  perlageDensity,
  perlageInner,
  perlageOuter,
  perlageTimeline,
  perlageKeepers,
  idlePerlage,
  laneLsrCount,
  latePerlage,
  leadingLsr,
  leadingLsrHue,
  lowerHourFocused,
  lowerHammerFocused,
  movePerlageFocus,
  overduePerlage,
  pinPerlageFocused,
  presentLsrLanes,
  raiseHourFocused,
  raiseHammerFocused,
  readHiddenLsr,
  readPerlages,
  readPerlageViews,
  readReviewedLsr,
  reminderPerlages,
  restingPerlage,
  setPerlageCoffer,
  setPerlageFilm,
  setPerlageFocused,
  setPerlagePin,
  setPerlageRaised,
  setPerlageStar,
  sortPerlages,
  starPerlageFocused,
  suggestHour,
  suggestFinish,
  suggestMode,
  toggleLsr,
  toggleLsrReview,
  visibleLsr,
  visibleLsrLanes,
  visiblePerlages,
  type LsrReview,
  type LsrRow,
  type LsrShape,
  type LsrValue,
  type Perlage,
  type PerlageDensity,
  type PerlageSort,
  type PerlageTray,
  type PerlageView,
} from "@/lib/crmv4/round354";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["GILT", "IVORY", "GRAPHITE"] as const;
const DROPS = ["3", "9", "18", "27"] as const;
const LOCKS = ["3", "6", "9"] as const;

const PIECE_KEY: Record<string, CrmV4CopyKey> = {
  cloud: "pglCloud",
  wave: "pglWave",
  sun: "pglSun",
  ring: "pglRing",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "pglAuditSave",
  edit: "pglAuditEdit",
  note: "pglAuditNote",
  film: "pglAuditFilm",
  poise: "pglAuditPoise",
  free: "pglAuditFree",
  peg: "pglAuditPeg",
  return: "pglAuditReturn",
  coffer: "pglAuditCoffer",
  open: "pglAuditOpen",
  tag: "pglAuditTag",
  lock: "pglAuditRate",
  drop: "pglAuditStep",
  lower: "pglAuditLower",
  star: "pglAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  home: "lsrLaneHome",
  vacant: "lsrLaneVacant",
  hold: "lsrLaneHold",
  desk: "lsrLaneDesk",
  guest: "lsrLaneGuest",
  join: "lsrJoin",
  route: "lsrRoute",
  brief: "lsrBrief",
  long: "lsrLong",
  stamp: "lsrStampLane",
  vowel: "lsrVowel",
  plain: "lsrPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "lsrChampagne",
  ivory: "lsrIvory",
  graphite: "lsrGraphite",
};

const SHAPE_KEY: Record<LsrShape, CrmV4CopyKey> = {
  all: "lsrShapeAll",
  home: "lsrShapeHome",
  vacant: "lsrShapeVacant",
  hold: "lsrShapeHold",
  guest: "lsrShapeGuest",
  join: "lsrShapeJoin",
  route: "lsrShapeRoute",
  brief: "lsrShapeBrief",
  long: "lsrShapeLong",
  stamp: "lsrShapeStamp",
  vowel: "lsrShapeVowel",
  plain: "lsrShapePlain",
  open: "lsrShapeOpen",
  soon: "lsrShapeOpen",
  letter: "lsrShapePlain",
  mixed: "lsrShapeStamp",
  upper: "lsrShapeUpper",
  lower: "lsrShapePlain",
  space: "lsrShapeSpace",
  even: "lsrShapeEven",
  odd: "lsrShapeEven",
  tail: "lsrShapeStamp",
  first: "lsrShapePlain",
  held: "lsrShapeLong",
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
  return key ? v4(key) : v4("pglBlankPiece");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "GILT") return v4("pglGilt");
  if (film === "IVORY") return v4("pglIvory");
  if (film === "GRAPHITE") return v4("pglGraphite");
  return v4("pglAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("lsrBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("lsrBlank");
}

export function PerlageRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Perlage[]>([]);
  const [views, setViews] = useState<PerlageView[]>([]);
  const [density, setDensity] = useState<PerlageDensity>("airy");
  const [tray, setTray] = useState<PerlageTray>("board");
  const [query, setQuery] = useState("");
  const [setterFilter, setSetterFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [pieceFilter, setPieceFilter] = useState("all");
  const [dropFilter, setDropFilter] = useState("all");
  const [lockFilter, setLockFilter] = useState("all");
  const [sort, setSort] = useState<PerlageSort>("piece");
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
  const [station, setStation] = useState("cloud");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readPerlages(readJson(PGL_KEY, [])));
    setViews(readPerlageViews(readJson(PGL_VIEW_KEY, [])));
    setDensity(perlageDensity(readJson(PGL_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Perlage[]) {
    setCards(next);
    writeJson(PGL_KEY, next);
  }
  function storeViews(next: PerlageView[]) {
    setViews(next);
    writeJson(PGL_VIEW_KEY, next);
  }
  function storeDensity(next: PerlageDensity) {
    setDensity(next);
    writeJson(PGL_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortPerlages(visiblePerlages(cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter), sort),
    [cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter, sort],
  );
  const counts = perlageCounts(cards, shown, station);
  const bars = perlageBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = perlageTimeline(cards);
  const reminders = reminderPerlages(cards);
  const poisers = perlageKeepers(cards);
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
        download("perlage-rules.csv", perlageCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => movePerlageFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => movePerlageFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addPerlage(cards, { title, note, setter: setter, piece, drop: dropNo, film, lock: lockNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-perlage" aria-label={v4("pglTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-perlage-mast">
        <p className="c4-perlage-seal" data-logo="mono">{v4("pglLogo")}</p>
        <div>
          <p className="c4-perlage-kicker">{v4("pglSub")}</p>
          <h2 className="c4-title">{v4("pglTitle")}</h2>
        </div>
        <p className="c4-perlage-count">{shown.length}</p>
      </header>
      <p className="c4-perlage-links">
        <Link href={crmv4Href(base, "lsr")}>{v4("lsrTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("pglCustomers")}</Link>
      </p>
      <p className="c4-perlage-hint">{v4("pglHint")}</p>
      {viewer && <p className="c4-perlage-note">{v4("pglViewer")}</p>}
      <p className="c4-perlage-meta">{v4("pglFair")} {fair || "—"} · {v4("pglBusy")} {busy || "—"} · {v4("pglSuggest")} {limbLabel(v4, suggestedLimb)} · {filmLabel(v4, suggestedFilm)} · {suggestedBeat}</p>
      <ol className="c4-perlage-index" aria-label={v4("pglRemind")}>
        <li data-tone="gold">{v4("pglOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("pglIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("pglBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("pglResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-perlage-remind c4-perlage-notices" role="status" aria-label={v4("pglRemind")}>
          {reminders.map((name) => <li key={name}>{v4("pglOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-perlage-chart" aria-label={v4("pglChart")}>
        {bars.map((bar) => (
          <button key={bar.piece} type="button" className="c4-perlage-column" data-on={pieceFilter === bar.piece ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === bar.piece ? "all" : bar.piece)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{limbLabel(v4, bar.piece)}</span>
          </button>
        ))}
      </div>
      <form className="c4-perlage-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("pglEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("pglEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("pglNote")}<input className="c4-field" aria-label={v4("pglNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("pglSetter")}<input className="c4-field" aria-label={v4("pglSetter")} aria-required={false} value={setter} maxLength={24} disabled={viewer} onChange={(event) => setSetter(event.target.value)} /></label>
        <label className="c4-lab">{v4("pglPiece")}<select className="c4-field" aria-label={v4("pglPiece")} value={piece} disabled={viewer} onChange={(event) => setPiece(event.target.value)}><option value="">{v4("pglBlankPiece")}</option>{PGL_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("pglFilm")}<select className="c4-field" aria-label={v4("pglFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("pglAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("pglDrop")}<select className="c4-field" aria-label={v4("pglDrop")} value={dropNo} disabled={viewer} onChange={(event) => setDropNo(event.target.value)}><option value="">{v4("pglAll")}</option>{DROPS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("pglLock")}<select className="c4-field" aria-label={v4("pglLock")} value={lockNo} disabled={viewer} onChange={(event) => setLockNo(event.target.value)}><option value="">{v4("pglAll")}</option>{LOCKS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("pglTag")}<input className="c4-field" aria-label={v4("pglTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("pglAdd")}</button>
      </form>
      <div className="c4-perlage-tools">
        <input ref={searchRef} className="c4-field c4-perlage-search" aria-label={v4("pglSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("pglSearch")} />
        {(["board", "peg", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "board" ? "pglBoard" : item === "peg" ? "pglPeg" : "pglCoffer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={pieceFilter === "inner" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "inner" ? "all" : "inner")}>{v4("pglInner")}</button>
        <button type="button" className="c4-chip" data-on={pieceFilter === "outer" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "outer" ? "all" : "outer")}>{v4("pglOuter")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "setter" ? "1" : "0"} onClick={() => setSort(sort === "setter" ? "piece" : "setter")}>{sort === "setter" ? v4("pglSortSetter") : v4("pglSortLimb")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("pglClose") : v4("pglAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("pglTimeline")}</button>
        <label className="c4-lab">{v4("pglDesk")}<select className="c4-field" aria-label={v4("pglDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{PGL_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-perlage-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addPerlageView(views, { id, name: viewName, tray, query, setter: setterFilter, film: filmFilter, piece: pieceFilter, drop: dropFilter, lock: lockFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("pglViewName")}<input className="c4-field" aria-label={v4("pglViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("pglSaveView")}</button>
      </form>
      <ul className="c4-perlage-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setSetterFilter(view.setter); setFilmFilter(view.film); setPieceFilter(view.piece); setDropFilter(view.drop); setLockFilter(view.lock); }}>{v4("pglApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropPerlageView(views, view.id))}>{v4("pglDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-perlage-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkPerlageRaise(cards, picked))}>{v4("pglBulkPoise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkPerlageCoffer(cards, picked))}>{v4("pglBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkPerlageGraphite(cards, picked))}>{v4("pglBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkPerlageTag(cards, picked))}>{v4("pglBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("perlage-rules.csv", perlageCsv(shown, station))}>{v4("pglCsv")}</button>
        <p className="c4-perlage-meta">{v4("pglKeys")} / n x a j k · {v4("pglQuiet")} {counts.quiet} · {v4("pglInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-perlage-time" aria-label={v4("pglTimeline")}>
          {timeline.map((mail) => <li key={mail.drop}><span>{mail.drop}</span> {mail.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("pglEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-perlage-list">
          {shown.map((card) => {
            const late = latePerlage(card, station);
            return (
              <li key={card.id} className="c4-perlage-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idlePerlage(card) ? "1" : "0"} data-brisk={briskPerlage(card) ? "1" : "0"} data-overdue={overduePerlage(card) ? "1" : "0"} data-resting={restingPerlage(card) ? "1" : "0"} data-inner={perlageInner(card.piece) ? "1" : "0"} data-outer={perlageOuter(card.piece) ? "1" : "0"}>
                <label className="c4-perlage-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editPerlage(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("pglEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("pglApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editPerlageNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("pglNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-perlage-meta">{limbLabel(v4, card.piece)} · {filmLabel(v4, card.film)} · {card.drop ?? "—"} · {card.lock} · {card.setter || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "pglAuditSave")}` : ""}{late ? ` · ${v4("pglOverdue")}` : ""}</p>
                </div>
                <div className="c4-perlage-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("pglEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPerlageRaised(cards, card.id, !card.raised))}>{card.raised ? v4("pglFree") : v4("pglPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPerlageFilm(cards, card.id, suggestedFilm))}>{v4("pglSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPerlagePin(cards, card.id, !card.pinned))}>{card.pinned ? v4("pglUnpeg") : v4("pglPegIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPerlageCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("pglUncoffer") : v4("pglCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPerlageStar(cards, card.id, !card.starred))}>{card.starred ? v4("pglUnstar") : v4("pglStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addPerlageTag(cards, card.id, "c"))}>{v4("pglTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("pglRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("pglLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHammerFocused(cards, card.id))}>{v4("pglLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHammerFocused(cards, card.id))}>{v4("pglLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(finishFocused(cards, card.id))}>{v4("pglFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPerlageFocused(cards, card.id))}>{v4("pglPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinPerlageFocused(cards, card.id))}>{v4("pglPeg")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starPerlageFocused(cards, card.id))}>{v4("pglStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(perlageCopy(card))}>{v4("pglCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}


type LsrUser = { id?: string; name?: string | null; leadSource?: string | boolean | null };

export function SourcePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: LsrUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<LsrShape>("all");
  const [review, setReview] = useState<LsrReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): LsrRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { leadSource: row.leadSource === true || row.leadSource === false ? row.leadSource : textField(row.leadSource) } satisfies LsrValue,
    };
  }).filter((row): row is LsrRow => Boolean(row));
  const present = presentLsrLanes(rows);
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
    const next = readHiddenLsr(readJson(LSR_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(LSR_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedLsr(readJson(LSR_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(LSR_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleLsrLanes(present, hidden, showHidden);
  const shown = visibleLsr(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = lsrLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = lsrLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingLsr(rows);
  const leadHue = leadingLsrHue(rows);
  const whole = rows.filter((row) => lsrLane(row.code)).length;
  const share = lsrShare(laneLsrCount(rows, "home"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("source-plates.csv", lsrLanesCsv(rows));
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
    writeJson(LSR_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(LSR_REVIEW_KEY, next);
  }

  return (
    <section className="c4-lsrplate" aria-label={v4("lsrTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-lsrplate-mast">
        <p className="c4-lsrplate-seal" data-logo="mono">{v4("lsrLogo")}</p>
        <div>
          <p className="c4-lsrplate-kicker">{v4("lsrSub")}</p>
          <h2 className="c4-title">{v4("lsrTitle")}</h2>
        </div>
        <p className="c4-lsrplate-count">{shown.length}</p>
      </header>
      <p className="c4-lsrplate-links">
        <Link href={crmv4Href(base, "pgl")}>{v4("pglTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("lsrCustomer")}</Link>
      </p>
      <p className="c4-lsrplate-hint">{v4("lsrHint")}</p>
      {viewer && <p className="c4-lsrplate-note">{v4("lsrViewer")}</p>}
      <p className="c4-lsrplate-meta">{v4("lsrLead")} {laneLabel(v4, lead)} · {v4("lsrToneLead")} {hueLabel(v4, leadHue)} · {v4("lsrShare")} {share}</p>
      <div className="c4-lsrplate-chart" aria-label={v4("lsrChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-lsrplate-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-lsrplate-tools">
        <input ref={searchRef} className="c4-field c4-lsrplate-search" aria-label={v4("lsrSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("lsrSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("lsrShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "lsrAll" : item === "reviewed" ? "lsrReviewed" : "lsrFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("lsrAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as LsrShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleLsr(hidden, item))}>{hidden.includes(item) ? v4("lsrShow") : v4("lsrHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-lsrplate-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkLsrReview(reviewed, picked, true))}>{v4("lsrBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkLsrReview(reviewed, picked, false))}>{v4("lsrBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("source-lanes.csv", lsrLanesCsv(rows))}>{v4("lsrCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("source-rows.csv", lsrRowsCsv(shown, reviewed))}>{v4("lsrRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("lsrLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("lsrFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("lsrEmpty")}</p>}
      <ul className="c4-lsrplate-list">
        {shown.map((row) => {
          const name = lsrCopy(row.code);
          const tone = lsrHue(row.code);
          return (
            <li key={row.id} className="c4-lsrplate-card" data-mail={lsrLane(row.code) || "open"} data-hue={tone || "none"} data-home={lsrLane(row.code) === "home" ? "1" : "0"} data-away={lsrAway(row.code) ? "1" : "0"} data-guest={lsrGuest(row.code) ? "1" : "0"} data-citizen={lsrCitizen(row.code) ? "1" : "0"} data-open={lsrOpen(row.code) ? "1" : "0"} data-even={lsrEven(row.code) ? "1" : "0"} data-digit={lsrDigit(row.code) ? "1" : "0"} data-letter={lsrLetter(row.code) ? "1" : "0"} data-mixed={lsrMixed(row.code) ? "1" : "0"} data-upper={lsrUpper(row.code) ? "1" : "0"} data-lower={lsrLower(row.code) ? "1" : "0"} data-space={lsrSpace(row.code) ? "1" : "0"} data-vowel={lsrVowel(row.code) ? "1" : "0"} data-tail={lsrTail(row.code) ? "1" : "0"} data-first={lsrFirst(row.code) ? "1" : "0"} data-held={lsrHeld(row.code) ? "1" : "0"} data-join={lsrJoin(row.code) ? "1" : "0"} data-route={lsrRoute(row.code) ? "1" : "0"} data-brief={lsrBrief(row.code) ? "1" : "0"}>
              <label className="c4-lsrplate-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-lsrplate-meta">{name || v4("lsrOpen")} · {lsrStamp(row.code) || "—"} · {lsrFamily(row.code) || "—"} · {lsrLength(row.code) ?? "—"} · {laneLabel(v4, lsrLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-lsrplate-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleLsrReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("lsrReviewed") : v4("lsrReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = lsrCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("lsrCopied") : v4("lsrCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("lsrCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
