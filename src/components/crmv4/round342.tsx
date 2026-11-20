"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  RSD_KEY,
  RSD_REVIEW_KEY,
  SNR_DENSITY_KEY,
  SNR_KEY,
  SNR_MODES,
  SNR_VIEW_KEY,
  addSonnerie,
  addSonnerieTag,
  addSonnerieView,
  briskSonnerie,
  bulkResidencyReview,
  bulkSonnerieCoffer,
  bulkSonnerieGraphite,
  bulkSonnerieRaise,
  bulkSonnerieTag,
  busiestStriker,
  dropSonnerieView,
  editSonnerie,
  editSonnerieNote,
  residencyBrief,
  residencyCopy,
  residencyDigit,
  residencyEven,
  residencyFamily,
  residencyFirst,
  residencyGap,
  residencyHeld,
  residencyAway,
  residencyHue,
  residencyJoin,
  residencyCitizen,
  residencyLane,
  residencyLanes,
  residencyLanesCsv,
  residencyLength,
  residencyLetter,
  residencyLower,
  residencyMixed,
  residencyOpen,
  residencyRowsCsv,
  residencyShare,
  residencySpace,
  residencyStamp,
  residencyTail,
  residencyUpper,
  residencyGuest,
  residencyVowel,
  fairStriker,
  finishFocused,
  sonnerieBars,
  sonnerieCopy,
  sonnerieCounts,
  sonnerieCsv,
  sonnerieDensity,
  sonnerieInner,
  sonnerieOuter,
  sonnerieTimeline,
  sonnerieKeepers,
  idleSonnerie,
  laneResidencyCount,
  lateSonnerie,
  leadingResidency,
  leadingResidencyHue,
  lowerHourFocused,
  lowerHammerFocused,
  moveSonnerieFocus,
  overdueSonnerie,
  pinSonnerieFocused,
  presentResidencyLanes,
  raiseHourFocused,
  raiseHammerFocused,
  readHiddenResidency,
  readSonneries,
  readSonnerieViews,
  readReviewedResidency,
  reminderSonneries,
  restingSonnerie,
  setSonnerieCoffer,
  setSonnerieFilm,
  setSonnerieFocused,
  setSonneriePin,
  setSonnerieRaised,
  setSonnerieStar,
  sortSonneries,
  starSonnerieFocused,
  suggestHour,
  suggestFinish,
  suggestMode,
  toggleResidency,
  toggleResidencyReview,
  visibleResidency,
  visibleResidencyLanes,
  visibleSonneries,
  type ResidencyReview,
  type ResidencyRow,
  type ResidencyShape,
  type ResidencyValue,
  type Sonnerie,
  type SonnerieDensity,
  type SonnerieSort,
  type SonnerieTray,
  type SonnerieView,
} from "@/lib/crmv4/round342";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["GILT", "IVORY", "GRAPHITE"] as const;
const DROPS = ["3", "6", "9", "12"] as const;
const LOCKS = ["2", "3", "5"] as const;

const PIECE_KEY: Record<string, CrmV4CopyKey> = {
  silent: "snrSilent",
  petite: "snrPetite",
  grande: "snrGrande",
  passing: "snrPassing",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "snrAuditSave",
  edit: "snrAuditEdit",
  note: "snrAuditNote",
  film: "snrAuditFilm",
  poise: "snrAuditPoise",
  free: "snrAuditFree",
  peg: "snrAuditPeg",
  return: "snrAuditReturn",
  coffer: "snrAuditCoffer",
  open: "snrAuditOpen",
  tag: "snrAuditTag",
  lock: "snrAuditRate",
  drop: "snrAuditBeat",
  lower: "snrAuditLower",
  star: "snrAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  home: "rsdHome",
  away: "rsdAway",
  guest: "rsdGuest",
  citizen: "rsdCitizen",
  join: "rsdJoin",
  gap: "rsdGap",
  brief: "rsdBrief",
  long: "rsdLong",
  mark: "rsdMark",
  vowel: "rsdVowel",
  plain: "rsdPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "rsdChampagne",
  ivory: "rsdIvory",
  graphite: "rsdGraphite",
};

const SHAPE_KEY: Record<ResidencyShape, CrmV4CopyKey> = {
  all: "rsdShapeAll",
  home: "rsdShapeHome",
  away: "rsdShapeAway",
  guest: "rsdShapeGuest",
  citizen: "rsdShapeCitizen",
  join: "rsdShapeJoin",
  gap: "rsdShapeGap",
  brief: "rsdShapeBrief",
  long: "rsdShapeLong",
  mark: "rsdShapeMark",
  vowel: "rsdShapeVowel",
  plain: "rsdShapePlain",
  open: "rsdShapeOpen",
  soon: "rsdShapeOpen",
  letter: "rsdShapePlain",
  mixed: "rsdShapeMark",
  upper: "rsdShapeHome",
  lower: "rsdShapePlain",
  space: "rsdShapeGap",
  even: "rsdShapeEven",
  odd: "rsdShapeEven",
  tail: "rsdShapeMark",
  first: "rsdShapePlain",
  held: "rsdShapeLong",
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
  return key ? v4(key) : v4("snrBlankPiece");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "GILT") return v4("snrGilt");
  if (film === "IVORY") return v4("snrIvory");
  if (film === "GRAPHITE") return v4("snrGraphite");
  return v4("snrAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("rsdBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("rsdBlank");
}

export function SonnerieRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Sonnerie[]>([]);
  const [views, setViews] = useState<SonnerieView[]>([]);
  const [density, setDensity] = useState<SonnerieDensity>("airy");
  const [tray, setTray] = useState<SonnerieTray>("board");
  const [query, setQuery] = useState("");
  const [setterFilter, setSetterFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [pieceFilter, setPieceFilter] = useState("all");
  const [dropFilter, setDropFilter] = useState("all");
  const [lockFilter, setLockFilter] = useState("all");
  const [sort, setSort] = useState<SonnerieSort>("piece");
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
  const [station, setStation] = useState("silent");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readSonneries(readJson(SNR_KEY, [])));
    setViews(readSonnerieViews(readJson(SNR_VIEW_KEY, [])));
    setDensity(sonnerieDensity(readJson(SNR_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Sonnerie[]) {
    setCards(next);
    writeJson(SNR_KEY, next);
  }
  function storeViews(next: SonnerieView[]) {
    setViews(next);
    writeJson(SNR_VIEW_KEY, next);
  }
  function storeDensity(next: SonnerieDensity) {
    setDensity(next);
    writeJson(SNR_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortSonneries(visibleSonneries(cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter), sort),
    [cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter, sort],
  );
  const counts = sonnerieCounts(cards, shown, station);
  const bars = sonnerieBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = sonnerieTimeline(cards);
  const reminders = reminderSonneries(cards);
  const poisers = sonnerieKeepers(cards);
  const busy = busiestStriker(cards);
  const fair = fairStriker(cards, poisers.join(","));
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
        download("sonnerie-rules.csv", sonnerieCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveSonnerieFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveSonnerieFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addSonnerie(cards, { title, note, setter: setter, piece, drop: dropNo, film, lock: lockNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-sonnerie" aria-label={v4("snrTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-sonnerie-mast">
        <p className="c4-sonnerie-seal" data-logo="mono">{v4("snrLogo")}</p>
        <div>
          <p className="c4-sonnerie-kicker">{v4("snrSub")}</p>
          <h2 className="c4-title">{v4("snrTitle")}</h2>
        </div>
        <p className="c4-sonnerie-count">{shown.length}</p>
      </header>
      <p className="c4-sonnerie-links">
        <Link href={crmv4Href(base, "rsd")}>{v4("rsdTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("snrCustomers")}</Link>
      </p>
      <p className="c4-sonnerie-hint">{v4("snrHint")}</p>
      {viewer && <p className="c4-sonnerie-note">{v4("snrViewer")}</p>}
      <p className="c4-sonnerie-meta">{v4("snrFair")} {fair || "—"} · {v4("snrBusy")} {busy || "—"} · {v4("snrSuggest")} {limbLabel(v4, suggestedLimb)} · {filmLabel(v4, suggestedFilm)} · {suggestedBeat}</p>
      <ol className="c4-sonnerie-index" aria-label={v4("snrRemind")}>
        <li data-tone="gold">{v4("snrOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("snrIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("snrBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("snrResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-sonnerie-remind c4-sonnerie-notices" role="status" aria-label={v4("snrRemind")}>
          {reminders.map((name) => <li key={name}>{v4("snrOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-sonnerie-chart" aria-label={v4("snrChart")}>
        {bars.map((bar) => (
          <button key={bar.piece} type="button" className="c4-sonnerie-column" data-on={pieceFilter === bar.piece ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === bar.piece ? "all" : bar.piece)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{limbLabel(v4, bar.piece)}</span>
          </button>
        ))}
      </div>
      <form className="c4-sonnerie-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("snrEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("snrEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("snrNote")}<input className="c4-field" aria-label={v4("snrNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("snrSetter")}<input className="c4-field" aria-label={v4("snrSetter")} aria-required={false} value={setter} maxLength={24} disabled={viewer} onChange={(event) => setSetter(event.target.value)} /></label>
        <label className="c4-lab">{v4("snrPiece")}<select className="c4-field" aria-label={v4("snrPiece")} value={piece} disabled={viewer} onChange={(event) => setPiece(event.target.value)}><option value="">{v4("snrBlankPiece")}</option>{SNR_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("snrFilm")}<select className="c4-field" aria-label={v4("snrFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("snrAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("snrDrop")}<select className="c4-field" aria-label={v4("snrDrop")} value={dropNo} disabled={viewer} onChange={(event) => setDropNo(event.target.value)}><option value="">{v4("snrAll")}</option>{DROPS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("snrLock")}<select className="c4-field" aria-label={v4("snrLock")} value={lockNo} disabled={viewer} onChange={(event) => setLockNo(event.target.value)}><option value="">{v4("snrAll")}</option>{LOCKS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("snrTag")}<input className="c4-field" aria-label={v4("snrTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("snrAdd")}</button>
      </form>
      <div className="c4-sonnerie-tools">
        <input ref={searchRef} className="c4-field c4-sonnerie-search" aria-label={v4("snrSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("snrSearch")} />
        {(["board", "peg", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "board" ? "snrBoard" : item === "peg" ? "snrPeg" : "snrCoffer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={pieceFilter === "inner" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "inner" ? "all" : "inner")}>{v4("snrInner")}</button>
        <button type="button" className="c4-chip" data-on={pieceFilter === "outer" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "outer" ? "all" : "outer")}>{v4("snrOuter")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "setter" ? "1" : "0"} onClick={() => setSort(sort === "setter" ? "piece" : "setter")}>{sort === "setter" ? v4("snrSortSetter") : v4("snrSortLimb")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("snrClose") : v4("snrAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("snrTimeline")}</button>
        <label className="c4-lab">{v4("snrDesk")}<select className="c4-field" aria-label={v4("snrDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{SNR_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-sonnerie-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addSonnerieView(views, { id, name: viewName, tray, query, setter: setterFilter, film: filmFilter, piece: pieceFilter, drop: dropFilter, lock: lockFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("snrViewName")}<input className="c4-field" aria-label={v4("snrViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("snrSaveView")}</button>
      </form>
      <ul className="c4-sonnerie-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setSetterFilter(view.setter); setFilmFilter(view.film); setPieceFilter(view.piece); setDropFilter(view.drop); setLockFilter(view.lock); }}>{v4("snrApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropSonnerieView(views, view.id))}>{v4("snrDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-sonnerie-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSonnerieRaise(cards, picked))}>{v4("snrBulkPoise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSonnerieCoffer(cards, picked))}>{v4("snrBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSonnerieGraphite(cards, picked))}>{v4("snrBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSonnerieTag(cards, picked))}>{v4("snrBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("sonnerie-rules.csv", sonnerieCsv(shown, station))}>{v4("snrCsv")}</button>
        <p className="c4-sonnerie-meta">{v4("snrKeys")} / n x a j k · {v4("snrQuiet")} {counts.quiet} · {v4("snrInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-sonnerie-time" aria-label={v4("snrTimeline")}>
          {timeline.map((lane) => <li key={lane.drop}><span>{lane.drop}</span> {lane.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("snrEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-sonnerie-list">
          {shown.map((card) => {
            const late = lateSonnerie(card, station);
            return (
              <li key={card.id} className="c4-sonnerie-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleSonnerie(card) ? "1" : "0"} data-brisk={briskSonnerie(card) ? "1" : "0"} data-overdue={overdueSonnerie(card) ? "1" : "0"} data-resting={restingSonnerie(card) ? "1" : "0"} data-inner={sonnerieInner(card.piece) ? "1" : "0"} data-outer={sonnerieOuter(card.piece) ? "1" : "0"}>
                <label className="c4-sonnerie-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editSonnerie(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("snrEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("snrApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editSonnerieNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("snrNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-sonnerie-meta">{limbLabel(v4, card.piece)} · {filmLabel(v4, card.film)} · {card.drop ?? "—"} · {card.lock} · {card.setter || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "snrAuditSave")}` : ""}{late ? ` · ${v4("snrOverdue")}` : ""}</p>
                </div>
                <div className="c4-sonnerie-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("snrEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSonnerieRaised(cards, card.id, !card.raised))}>{card.raised ? v4("snrFree") : v4("snrPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSonnerieFilm(cards, card.id, suggestedFilm))}>{v4("snrSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSonneriePin(cards, card.id, !card.pinned))}>{card.pinned ? v4("snrUnpeg") : v4("snrPegIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSonnerieCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("snrUncoffer") : v4("snrCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSonnerieStar(cards, card.id, !card.starred))}>{card.starred ? v4("snrUnstar") : v4("snrStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addSonnerieTag(cards, card.id, "s"))}>{v4("snrTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("snrRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("snrLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHammerFocused(cards, card.id))}>{v4("snrLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHammerFocused(cards, card.id))}>{v4("snrLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(finishFocused(cards, card.id))}>{v4("snrFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSonnerieFocused(cards, card.id))}>{v4("snrPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinSonnerieFocused(cards, card.id))}>{v4("snrPeg")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starSonnerieFocused(cards, card.id))}>{v4("snrStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(sonnerieCopy(card))}>{v4("snrCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type ResidencyUser = { id?: string; name?: string | null; isResident?: boolean | string | null };

export function ResidencyPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: ResidencyUser[] }>("/api/admin/users?take=24&meta=0");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<ResidencyShape>("all");
  const [review, setReview] = useState<ResidencyReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): ResidencyRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { isResident: textField(row.isResident) } satisfies ResidencyValue,
    };
  }).filter((row): row is ResidencyRow => Boolean(row));
  const present = presentResidencyLanes(rows);
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
    const next = readHiddenResidency(readJson(RSD_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(RSD_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedResidency(readJson(RSD_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(RSD_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleResidencyLanes(present, hidden, showHidden);
  const shown = visibleResidency(rows, lanes.includes(lane) || lane === "all" ? lane : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = residencyLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = residencyLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingResidency(rows);
  const leadHue = leadingResidencyHue(rows);
  const whole = rows.filter((row) => residencyLane(row.code)).length;
  const share = residencyShare(laneResidencyCount(rows, "home"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("residency-lanes.csv", residencyLanesCsv(rows));
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
    writeJson(RSD_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(RSD_REVIEW_KEY, next);
  }

  return (
    <section className="c4-residency" aria-label={v4("rsdTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-residency-mast">
        <p className="c4-residency-seal" data-logo="mono">{v4("rsdLogo")}</p>
        <div>
          <p className="c4-residency-kicker">{v4("rsdSub")}</p>
          <h2 className="c4-title">{v4("rsdTitle")}</h2>
        </div>
        <p className="c4-residency-count">{shown.length}</p>
      </header>
      <p className="c4-residency-links">
        <Link href={crmv4Href(base, "snr")}>{v4("snrTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("rsdCustomer")}</Link>
      </p>
      <p className="c4-residency-hint">{v4("rsdHint")}</p>
      {viewer && <p className="c4-residency-note">{v4("rsdViewer")}</p>}
      <p className="c4-residency-meta">{v4("rsdLead")} {laneLabel(v4, lead)} · {v4("rsdToneLead")} {hueLabel(v4, leadHue)} · {v4("rsdShare")} {share}</p>
      <div className="c4-residency-chart" aria-label={v4("rsdChart")}>
        {lines.map((line) => (
          <button key={line.lane} type="button" className="c4-residency-column" data-on={lane === line.lane ? "1" : "0"} data-lane={line.lane} onClick={() => setLane(lane === line.lane ? "all" : line.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-residency-tools">
        <input ref={searchRef} className="c4-field c4-residency-search" aria-label={v4("rsdSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("rsdSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("rsdShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "rsdAll" : item === "reviewed" ? "rsdReviewed" : "rsdFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("rsdAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as ResidencyShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleResidency(hidden, item))}>{hidden.includes(item) ? v4("rsdShow") : v4("rsdHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-residency-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkResidencyReview(reviewed, picked, true))}>{v4("rsdBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkResidencyReview(reviewed, picked, false))}>{v4("rsdBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("residency-lanes.csv", residencyLanesCsv(rows))}>{v4("rsdCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("residency-rows.csv", residencyRowsCsv(shown, reviewed))}>{v4("rsdRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("rsdLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("rsdFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("rsdEmpty")}</p>}
      <ul className="c4-residency-list">
        {shown.map((row) => {
          const name = residencyCopy(row.code);
          const tone = residencyHue(row.code);
          return (
            <li key={row.id} className="c4-residency-card" data-lane={residencyLane(row.code) || "open"} data-hue={tone || "none"} data-home={residencyLane(row.code) === "home" ? "1" : "0"} data-away={residencyAway(row.code) ? "1" : "0"} data-guest={residencyGuest(row.code) ? "1" : "0"} data-citizen={residencyCitizen(row.code) ? "1" : "0"} data-open={residencyOpen(row.code) ? "1" : "0"} data-even={residencyEven(row.code) ? "1" : "0"} data-digit={residencyDigit(row.code) ? "1" : "0"} data-letter={residencyLetter(row.code) ? "1" : "0"} data-mixed={residencyMixed(row.code) ? "1" : "0"} data-upper={residencyUpper(row.code) ? "1" : "0"} data-lower={residencyLower(row.code) ? "1" : "0"} data-space={residencySpace(row.code) ? "1" : "0"} data-vowel={residencyVowel(row.code) ? "1" : "0"} data-tail={residencyTail(row.code) ? "1" : "0"} data-first={residencyFirst(row.code) ? "1" : "0"} data-held={residencyHeld(row.code) ? "1" : "0"} data-join={residencyJoin(row.code) ? "1" : "0"} data-gap={residencyGap(row.code) ? "1" : "0"} data-brief={residencyBrief(row.code) ? "1" : "0"}>
              <label className="c4-residency-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-residency-meta">{name || v4("rsdOpen")} · {residencyStamp(row.code) || "—"} · {residencyFamily(row.code) || "—"} · {residencyLength(row.code) ?? "—"} · {laneLabel(v4, residencyLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-residency-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleResidencyReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("rsdReviewed") : v4("rsdReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = residencyCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("rsdCopied") : v4("rsdCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("rsdCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
