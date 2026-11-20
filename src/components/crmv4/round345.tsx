"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  LGX_KEY,
  LGX_REVIEW_KEY,
  TBX_DENSITY_KEY,
  TBX_KEY,
  TBX_MODES,
  TBX_VIEW_KEY,
  addTourbillon,
  addTourbillonTag,
  addTourbillonView,
  briskTourbillon,
  bulkLanguageReview,
  bulkTourbillonCoffer,
  bulkTourbillonGraphite,
  bulkTourbillonRaise,
  bulkTourbillonTag,
  busiestKeeper,
  dropTourbillonView,
  editTourbillon,
  editTourbillonNote,
  languageBrief,
  languageCopy,
  languageDigit,
  languageEven,
  languageFamily,
  languageFirst,
  languageGap,
  languageHeld,
  languageAway,
  languageHue,
  languageJoin,
  languageCitizen,
  languageLane,
  languageLanes,
  languageLanesCsv,
  languageLength,
  languageLetter,
  languageLower,
  languageMixed,
  languageOpen,
  languageRowsCsv,
  languageShare,
  languageSpace,
  languageStamp,
  languageTail,
  languageUpper,
  languageGuest,
  languageVowel,
  fairKeeper,
  finishFocused,
  tourbillonBars,
  tourbillonCopy,
  tourbillonCounts,
  tourbillonCsv,
  tourbillonDensity,
  tourbillonInner,
  tourbillonOuter,
  tourbillonTimeline,
  tourbillonKeepers,
  idleTourbillon,
  laneLanguageCount,
  lateTourbillon,
  leadingLanguage,
  leadingLanguageHue,
  lowerHourFocused,
  lowerHammerFocused,
  moveTourbillonFocus,
  overdueTourbillon,
  pinTourbillonFocused,
  presentLanguageLanes,
  raiseHourFocused,
  raiseHammerFocused,
  readHiddenLanguage,
  readTourbillons,
  readTourbillonViews,
  readReviewedLanguage,
  reminderTourbillons,
  restingTourbillon,
  setTourbillonCoffer,
  setTourbillonFilm,
  setTourbillonFocused,
  setTourbillonPin,
  setTourbillonRaised,
  setTourbillonStar,
  sortTourbillons,
  starTourbillonFocused,
  suggestHour,
  suggestFinish,
  suggestMode,
  toggleLanguage,
  toggleLanguageReview,
  visibleLanguage,
  visibleLanguageLanes,
  visibleTourbillons,
  type LanguageReview,
  type LanguageRow,
  type LanguageShape,
  type LanguageValue,
  type Tourbillon,
  type TourbillonDensity,
  type TourbillonSort,
  type TourbillonTray,
  type TourbillonView,
} from "@/lib/crmv4/round345";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["GILT", "IVORY", "GRAPHITE"] as const;
const DROPS = ["5", "10", "15", "20"] as const;
const LOCKS = ["3", "5", "7"] as const;

const PIECE_KEY: Record<string, CrmV4CopyKey> = {
  cage: "tbxCage",
  flying: "tbxFlying",
  carriage: "tbxCarriage",
  karrusel: "tbxKarrusel",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "tbxAuditSave",
  edit: "tbxAuditEdit",
  note: "tbxAuditNote",
  film: "tbxAuditFilm",
  poise: "tbxAuditPoise",
  free: "tbxAuditFree",
  peg: "tbxAuditPeg",
  return: "tbxAuditReturn",
  coffer: "tbxAuditCoffer",
  open: "tbxAuditOpen",
  tag: "tbxAuditTag",
  lock: "tbxAuditRate",
  drop: "tbxAuditBeat",
  lower: "tbxAuditLower",
  star: "tbxAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  engl: "lgxEngl",
  turk: "lgxTurk",
  deut: "lgxDeut",
  arab: "lgxArab",
  join: "lgxJoin",
  gap: "lgxGap",
  brief: "lgxBrief",
  long: "lgxLong",
  mark: "lgxMark",
  vowel: "lgxVowel",
  plain: "lgxPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "lgxChampagne",
  ivory: "lgxIvory",
  graphite: "lgxGraphite",
};

const SHAPE_KEY: Record<LanguageShape, CrmV4CopyKey> = {
  all: "lgxShapeAll",
  engl: "lgxShapeEngl",
  turk: "lgxShapeTurk",
  deut: "lgxShapeDeut",
  arab: "lgxShapeArab",
  join: "lgxShapeJoin",
  gap: "lgxShapeGap",
  brief: "lgxShapeBrief",
  long: "lgxShapeLong",
  mark: "lgxShapeMark",
  vowel: "lgxShapeVowel",
  plain: "lgxShapePlain",
  open: "lgxShapeOpen",
  soon: "lgxShapeOpen",
  letter: "lgxShapePlain",
  mixed: "lgxShapeMark",
  upper: "lgxShapeEngl",
  lower: "lgxShapePlain",
  space: "lgxShapeGap",
  even: "lgxShapeEven",
  odd: "lgxShapeEven",
  tail: "lgxShapeMark",
  first: "lgxShapePlain",
  held: "lgxShapeLong",
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
  return key ? v4(key) : v4("tbxBlankPiece");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "GILT") return v4("tbxGilt");
  if (film === "IVORY") return v4("tbxIvory");
  if (film === "GRAPHITE") return v4("tbxGraphite");
  return v4("tbxAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("lgxBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("lgxBlank");
}

export function TourbillonRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Tourbillon[]>([]);
  const [views, setViews] = useState<TourbillonView[]>([]);
  const [density, setDensity] = useState<TourbillonDensity>("airy");
  const [tray, setTray] = useState<TourbillonTray>("board");
  const [query, setQuery] = useState("");
  const [setterFilter, setSetterFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [pieceFilter, setPieceFilter] = useState("all");
  const [dropFilter, setDropFilter] = useState("all");
  const [lockFilter, setLockFilter] = useState("all");
  const [sort, setSort] = useState<TourbillonSort>("piece");
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
  const [station, setStation] = useState("cage");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readTourbillons(readJson(TBX_KEY, [])));
    setViews(readTourbillonViews(readJson(TBX_VIEW_KEY, [])));
    setDensity(tourbillonDensity(readJson(TBX_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Tourbillon[]) {
    setCards(next);
    writeJson(TBX_KEY, next);
  }
  function storeViews(next: TourbillonView[]) {
    setViews(next);
    writeJson(TBX_VIEW_KEY, next);
  }
  function storeDensity(next: TourbillonDensity) {
    setDensity(next);
    writeJson(TBX_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortTourbillons(visibleTourbillons(cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter), sort),
    [cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter, sort],
  );
  const counts = tourbillonCounts(cards, shown, station);
  const bars = tourbillonBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = tourbillonTimeline(cards);
  const reminders = reminderTourbillons(cards);
  const poisers = tourbillonKeepers(cards);
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
        download("tourbillon-rules.csv", tourbillonCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveTourbillonFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveTourbillonFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addTourbillon(cards, { title, note, setter: setter, piece, drop: dropNo, film, lock: lockNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-tourbillon" aria-label={v4("tbxTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-tourbillon-mast">
        <p className="c4-tourbillon-seal" data-logo="mono">{v4("tbxLogo")}</p>
        <div>
          <p className="c4-tourbillon-kicker">{v4("tbxSub")}</p>
          <h2 className="c4-title">{v4("tbxTitle")}</h2>
        </div>
        <p className="c4-tourbillon-count">{shown.length}</p>
      </header>
      <p className="c4-tourbillon-links">
        <Link href={crmv4Href(base, "lgx")}>{v4("lgxTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("tbxCustomers")}</Link>
      </p>
      <p className="c4-tourbillon-hint">{v4("tbxHint")}</p>
      {viewer && <p className="c4-tourbillon-note">{v4("tbxViewer")}</p>}
      <p className="c4-tourbillon-meta">{v4("tbxFair")} {fair || "—"} · {v4("tbxBusy")} {busy || "—"} · {v4("tbxSuggest")} {limbLabel(v4, suggestedLimb)} · {filmLabel(v4, suggestedFilm)} · {suggestedBeat}</p>
      <ol className="c4-tourbillon-index" aria-label={v4("tbxRemind")}>
        <li data-tone="gold">{v4("tbxOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("tbxIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("tbxBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("tbxResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-tourbillon-remind c4-tourbillon-notices" role="status" aria-label={v4("tbxRemind")}>
          {reminders.map((name) => <li key={name}>{v4("tbxOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-tourbillon-chart" aria-label={v4("tbxChart")}>
        {bars.map((bar) => (
          <button key={bar.piece} type="button" className="c4-tourbillon-column" data-on={pieceFilter === bar.piece ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === bar.piece ? "all" : bar.piece)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{limbLabel(v4, bar.piece)}</span>
          </button>
        ))}
      </div>
      <form className="c4-tourbillon-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("tbxEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("tbxEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("tbxNote")}<input className="c4-field" aria-label={v4("tbxNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("tbxSetter")}<input className="c4-field" aria-label={v4("tbxSetter")} aria-required={false} value={setter} maxLength={24} disabled={viewer} onChange={(event) => setSetter(event.target.value)} /></label>
        <label className="c4-lab">{v4("tbxPiece")}<select className="c4-field" aria-label={v4("tbxPiece")} value={piece} disabled={viewer} onChange={(event) => setPiece(event.target.value)}><option value="">{v4("tbxBlankPiece")}</option>{TBX_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("tbxFilm")}<select className="c4-field" aria-label={v4("tbxFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("tbxAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("tbxDrop")}<select className="c4-field" aria-label={v4("tbxDrop")} value={dropNo} disabled={viewer} onChange={(event) => setDropNo(event.target.value)}><option value="">{v4("tbxAll")}</option>{DROPS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("tbxLock")}<select className="c4-field" aria-label={v4("tbxLock")} value={lockNo} disabled={viewer} onChange={(event) => setLockNo(event.target.value)}><option value="">{v4("tbxAll")}</option>{LOCKS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("tbxTag")}<input className="c4-field" aria-label={v4("tbxTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("tbxAdd")}</button>
      </form>
      <div className="c4-tourbillon-tools">
        <input ref={searchRef} className="c4-field c4-tourbillon-search" aria-label={v4("tbxSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("tbxSearch")} />
        {(["board", "peg", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "board" ? "tbxBoard" : item === "peg" ? "tbxPeg" : "tbxCoffer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={pieceFilter === "inner" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "inner" ? "all" : "inner")}>{v4("tbxInner")}</button>
        <button type="button" className="c4-chip" data-on={pieceFilter === "outer" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "outer" ? "all" : "outer")}>{v4("tbxOuter")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "setter" ? "1" : "0"} onClick={() => setSort(sort === "setter" ? "piece" : "setter")}>{sort === "setter" ? v4("tbxSortSetter") : v4("tbxSortLimb")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("tbxClose") : v4("tbxAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("tbxTimeline")}</button>
        <label className="c4-lab">{v4("tbxDesk")}<select className="c4-field" aria-label={v4("tbxDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{TBX_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-tourbillon-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addTourbillonView(views, { id, name: viewName, tray, query, setter: setterFilter, film: filmFilter, piece: pieceFilter, drop: dropFilter, lock: lockFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("tbxViewName")}<input className="c4-field" aria-label={v4("tbxViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("tbxSaveView")}</button>
      </form>
      <ul className="c4-tourbillon-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setSetterFilter(view.setter); setFilmFilter(view.film); setPieceFilter(view.piece); setDropFilter(view.drop); setLockFilter(view.lock); }}>{v4("tbxApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropTourbillonView(views, view.id))}>{v4("tbxDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-tourbillon-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTourbillonRaise(cards, picked))}>{v4("tbxBulkPoise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTourbillonCoffer(cards, picked))}>{v4("tbxBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTourbillonGraphite(cards, picked))}>{v4("tbxBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTourbillonTag(cards, picked))}>{v4("tbxBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("tourbillon-rules.csv", tourbillonCsv(shown, station))}>{v4("tbxCsv")}</button>
        <p className="c4-tourbillon-meta">{v4("tbxKeys")} / n x a j k · {v4("tbxQuiet")} {counts.quiet} · {v4("tbxInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-tourbillon-time" aria-label={v4("tbxTimeline")}>
          {timeline.map((mail) => <li key={mail.drop}><span>{mail.drop}</span> {mail.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("tbxEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-tourbillon-list">
          {shown.map((card) => {
            const late = lateTourbillon(card, station);
            return (
              <li key={card.id} className="c4-tourbillon-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleTourbillon(card) ? "1" : "0"} data-brisk={briskTourbillon(card) ? "1" : "0"} data-overdue={overdueTourbillon(card) ? "1" : "0"} data-resting={restingTourbillon(card) ? "1" : "0"} data-inner={tourbillonInner(card.piece) ? "1" : "0"} data-outer={tourbillonOuter(card.piece) ? "1" : "0"}>
                <label className="c4-tourbillon-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editTourbillon(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("tbxEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("tbxApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editTourbillonNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("tbxNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-tourbillon-meta">{limbLabel(v4, card.piece)} · {filmLabel(v4, card.film)} · {card.drop ?? "—"} · {card.lock} · {card.setter || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "tbxAuditSave")}` : ""}{late ? ` · ${v4("tbxOverdue")}` : ""}</p>
                </div>
                <div className="c4-tourbillon-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("tbxEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTourbillonRaised(cards, card.id, !card.raised))}>{card.raised ? v4("tbxFree") : v4("tbxPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTourbillonFilm(cards, card.id, suggestedFilm))}>{v4("tbxSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTourbillonPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("tbxUnpeg") : v4("tbxPegIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTourbillonCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("tbxUncoffer") : v4("tbxCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTourbillonStar(cards, card.id, !card.starred))}>{card.starred ? v4("tbxUnstar") : v4("tbxStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addTourbillonTag(cards, card.id, "s"))}>{v4("tbxTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("tbxRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("tbxLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHammerFocused(cards, card.id))}>{v4("tbxLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHammerFocused(cards, card.id))}>{v4("tbxLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(finishFocused(cards, card.id))}>{v4("tbxFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTourbillonFocused(cards, card.id))}>{v4("tbxPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinTourbillonFocused(cards, card.id))}>{v4("tbxPeg")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starTourbillonFocused(cards, card.id))}>{v4("tbxStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(tourbillonCopy(card))}>{v4("tbxCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type LanguageUser = { id?: string; name?: string | null; language?: boolean | string | null };

export function LanguagePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: LanguageUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<LanguageShape>("all");
  const [review, setReview] = useState<LanguageReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): LanguageRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { language: textField(row.language) } satisfies LanguageValue,
    };
  }).filter((row): row is LanguageRow => Boolean(row));
  const present = presentLanguageLanes(rows);
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
    const next = readHiddenLanguage(readJson(LGX_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(LGX_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedLanguage(readJson(LGX_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(LGX_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleLanguageLanes(present, hidden, showHidden);
  const shown = visibleLanguage(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = languageLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = languageLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingLanguage(rows);
  const leadHue = leadingLanguageHue(rows);
  const whole = rows.filter((row) => languageLane(row.code)).length;
  const share = languageShare(laneLanguageCount(rows, "engl"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("language-lanes.csv", languageLanesCsv(rows));
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
    writeJson(LGX_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(LGX_REVIEW_KEY, next);
  }

  return (
    <section className="c4-language" aria-label={v4("lgxTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-language-mast">
        <p className="c4-language-seal" data-logo="mono">{v4("lgxLogo")}</p>
        <div>
          <p className="c4-language-kicker">{v4("lgxSub")}</p>
          <h2 className="c4-title">{v4("lgxTitle")}</h2>
        </div>
        <p className="c4-language-count">{shown.length}</p>
      </header>
      <p className="c4-language-links">
        <Link href={crmv4Href(base, "tbx")}>{v4("tbxTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("lgxCustomer")}</Link>
      </p>
      <p className="c4-language-hint">{v4("lgxHint")}</p>
      {viewer && <p className="c4-language-note">{v4("lgxViewer")}</p>}
      <p className="c4-language-meta">{v4("lgxLead")} {laneLabel(v4, lead)} · {v4("lgxToneLead")} {hueLabel(v4, leadHue)} · {v4("lgxShare")} {share}</p>
      <div className="c4-language-chart" aria-label={v4("lgxChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-language-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-language-tools">
        <input ref={searchRef} className="c4-field c4-language-search" aria-label={v4("lgxSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("lgxSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("lgxShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "lgxAll" : item === "reviewed" ? "lgxReviewed" : "lgxFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("lgxAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as LanguageShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleLanguage(hidden, item))}>{hidden.includes(item) ? v4("lgxShow") : v4("lgxHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-language-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkLanguageReview(reviewed, picked, true))}>{v4("lgxBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkLanguageReview(reviewed, picked, false))}>{v4("lgxBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("language-lanes.csv", languageLanesCsv(rows))}>{v4("lgxCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("language-rows.csv", languageRowsCsv(shown, reviewed))}>{v4("lgxRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("lgxLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("lgxFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("lgxEmpty")}</p>}
      <ul className="c4-language-list">
        {shown.map((row) => {
          const name = languageCopy(row.code);
          const tone = languageHue(row.code);
          return (
            <li key={row.id} className="c4-language-card" data-mail={languageLane(row.code) || "open"} data-hue={tone || "none"} data-lang-mark={languageLane(row.code) === "engl" ? "1" : "0"} data-away={languageAway(row.code) ? "1" : "0"} data-guest={languageGuest(row.code) ? "1" : "0"} data-citizen={languageCitizen(row.code) ? "1" : "0"} data-open={languageOpen(row.code) ? "1" : "0"} data-even={languageEven(row.code) ? "1" : "0"} data-digit={languageDigit(row.code) ? "1" : "0"} data-letter={languageLetter(row.code) ? "1" : "0"} data-mixed={languageMixed(row.code) ? "1" : "0"} data-upper={languageUpper(row.code) ? "1" : "0"} data-lower={languageLower(row.code) ? "1" : "0"} data-space={languageSpace(row.code) ? "1" : "0"} data-vowel={languageVowel(row.code) ? "1" : "0"} data-tail={languageTail(row.code) ? "1" : "0"} data-first={languageFirst(row.code) ? "1" : "0"} data-held={languageHeld(row.code) ? "1" : "0"} data-join={languageJoin(row.code) ? "1" : "0"} data-gap={languageGap(row.code) ? "1" : "0"} data-brief={languageBrief(row.code) ? "1" : "0"}>
              <label className="c4-language-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-language-meta">{name || v4("lgxOpen")} · {languageStamp(row.code) || "—"} · {languageFamily(row.code) || "—"} · {languageLength(row.code) ?? "—"} · {laneLabel(v4, languageLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-language-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleLanguageReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("lgxReviewed") : v4("lgxReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = languageCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("lgxCopied") : v4("lgxCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("lgxCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
