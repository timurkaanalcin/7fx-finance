"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  MRK_KEY,
  MRK_REVIEW_KEY,
  PLS_DENSITY_KEY,
  PLS_KEY,
  PLS_MODES,
  PLS_VIEW_KEY,
  addPulsometer,
  addPulsometerTag,
  addPulsometerView,
  briskPulsometer,
  bulkMarkReview,
  bulkPulsometerCoffer,
  bulkPulsometerGraphite,
  bulkPulsometerRaise,
  bulkPulsometerTag,
  busiestKeeper,
  dropPulsometerView,
  editPulsometer,
  editPulsometerNote,
  markBrief,
  markCopy,
  markDigit,
  markEven,
  markFamily,
  markFirst,
  markGap,
  markHeld,
  markAway,
  markHue,
  markJoin,
  markCitizen,
  markLane,
  markLanes,
  markLanesCsv,
  markLength,
  markLetter,
  markLower,
  markMixed,
  markOpen,
  markRowsCsv,
  markShare,
  markSpace,
  markStamp,
  markTail,
  markUpper,
  markGuest,
  markVowel,
  fairKeeper,
  finishFocused,
  pulsometerBars,
  pulsometerCopy,
  pulsometerCounts,
  pulsometerCsv,
  pulsometerDensity,
  pulsometerInner,
  pulsometerOuter,
  pulsometerTimeline,
  pulsometerKeepers,
  idlePulsometer,
  laneMarkCount,
  latePulsometer,
  leadingMark,
  leadingMarkHue,
  lowerHourFocused,
  lowerHammerFocused,
  movePulsometerFocus,
  overduePulsometer,
  pinPulsometerFocused,
  presentMarkLanes,
  raiseHourFocused,
  raiseHammerFocused,
  readHiddenMark,
  readPulsometers,
  readPulsometerViews,
  readReviewedMark,
  reminderPulsometers,
  restingPulsometer,
  setPulsometerCoffer,
  setPulsometerFilm,
  setPulsometerFocused,
  setPulsometerPin,
  setPulsometerRaised,
  setPulsometerStar,
  sortPulsometers,
  starPulsometerFocused,
  suggestHour,
  suggestFinish,
  suggestMode,
  toggleMark,
  toggleMarkReview,
  visibleMark,
  visibleMarkLanes,
  visiblePulsometers,
  type MarkReview,
  type MarkRow,
  type MarkShape,
  type MarkValue,
  type Pulsometer,
  type PulsometerDensity,
  type PulsometerSort,
  type PulsometerTray,
  type PulsometerView,
} from "@/lib/crmv4/round350";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["GILT", "IVORY", "GRAPHITE"] as const;
const DROPS = ["4", "8", "16", "32"] as const;
const LOCKS = ["3", "6", "9"] as const;

const PIECE_KEY: Record<string, CrmV4CopyKey> = {
  beat: "plsBeat",
  count: "plsCount",
  rest: "plsRest",
  sprint: "plsSprint",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "plsAuditSave",
  edit: "plsAuditEdit",
  note: "plsAuditNote",
  film: "plsAuditFilm",
  poise: "plsAuditPoise",
  free: "plsAuditFree",
  peg: "plsAuditPeg",
  return: "plsAuditReturn",
  coffer: "plsAuditCoffer",
  open: "plsAuditOpen",
  tag: "plsAuditTag",
  lock: "plsAuditRate",
  drop: "plsAuditBeat",
  lower: "plsAuditLower",
  star: "plsAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  geo: "mrkLaneGeo",
  dupe: "mrkLaneDupe",
  trash: "mrkLaneTrash",
  age: "mrkLaneAge",
  join: "mrkJoin",
  gap: "mrkGap",
  brief: "mrkBrief",
  long: "mrkLong",
  mark: "mrkMark",
  vowel: "mrkVowel",
  plain: "mrkPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "mrkChampagne",
  ivory: "mrkIvory",
  graphite: "mrkGraphite",
};

const SHAPE_KEY: Record<MarkShape, CrmV4CopyKey> = {
  all: "mrkShapeAll",
  geo: "mrkShapeGeo",
  dupe: "mrkShapeDupe",
  trash: "mrkShapeTrash",
  age: "mrkShapeAge",
  join: "mrkShapeJoin",
  gap: "mrkShapeGap",
  brief: "mrkShapeBrief",
  long: "mrkShapeLong",
  mark: "mrkShapeMark",
  vowel: "mrkShapeVowel",
  plain: "mrkShapePlain",
  open: "mrkShapeOpen",
  soon: "mrkShapeOpen",
  letter: "mrkShapePlain",
  mixed: "mrkShapeMark",
  upper: "mrkShapeGeo",
  lower: "mrkShapePlain",
  space: "mrkShapeGap",
  even: "mrkShapeEven",
  odd: "mrkShapeEven",
  tail: "mrkShapeMark",
  first: "mrkShapePlain",
  held: "mrkShapeLong",
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
  return key ? v4(key) : v4("plsBlankPiece");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "GILT") return v4("plsGilt");
  if (film === "IVORY") return v4("plsIvory");
  if (film === "GRAPHITE") return v4("plsGraphite");
  return v4("plsAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("mrkBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("mrkBlank");
}

export function PulsometerRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Pulsometer[]>([]);
  const [views, setViews] = useState<PulsometerView[]>([]);
  const [density, setDensity] = useState<PulsometerDensity>("airy");
  const [tray, setTray] = useState<PulsometerTray>("board");
  const [query, setQuery] = useState("");
  const [setterFilter, setSetterFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [pieceFilter, setPieceFilter] = useState("all");
  const [dropFilter, setDropFilter] = useState("all");
  const [lockFilter, setLockFilter] = useState("all");
  const [sort, setSort] = useState<PulsometerSort>("piece");
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
  const [station, setStation] = useState("beat");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readPulsometers(readJson(PLS_KEY, [])));
    setViews(readPulsometerViews(readJson(PLS_VIEW_KEY, [])));
    setDensity(pulsometerDensity(readJson(PLS_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Pulsometer[]) {
    setCards(next);
    writeJson(PLS_KEY, next);
  }
  function storeViews(next: PulsometerView[]) {
    setViews(next);
    writeJson(PLS_VIEW_KEY, next);
  }
  function storeDensity(next: PulsometerDensity) {
    setDensity(next);
    writeJson(PLS_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortPulsometers(visiblePulsometers(cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter), sort),
    [cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter, sort],
  );
  const counts = pulsometerCounts(cards, shown, station);
  const bars = pulsometerBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = pulsometerTimeline(cards);
  const reminders = reminderPulsometers(cards);
  const poisers = pulsometerKeepers(cards);
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
        download("pulsometer-rules.csv", pulsometerCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => movePulsometerFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => movePulsometerFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addPulsometer(cards, { title, note, setter: setter, piece, drop: dropNo, film, lock: lockNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-pulsometer" aria-label={v4("plsTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-pulsometer-mast">
        <p className="c4-pulsometer-seal" data-logo="mono">{v4("plsLogo")}</p>
        <div>
          <p className="c4-pulsometer-kicker">{v4("plsSub")}</p>
          <h2 className="c4-title">{v4("plsTitle")}</h2>
        </div>
        <p className="c4-pulsometer-count">{shown.length}</p>
      </header>
      <p className="c4-pulsometer-links">
        <Link href={crmv4Href(base, "mrk")}>{v4("mrkTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("plsCustomers")}</Link>
      </p>
      <p className="c4-pulsometer-hint">{v4("plsHint")}</p>
      {viewer && <p className="c4-pulsometer-note">{v4("plsViewer")}</p>}
      <p className="c4-pulsometer-meta">{v4("plsFair")} {fair || "—"} · {v4("plsBusy")} {busy || "—"} · {v4("plsSuggest")} {limbLabel(v4, suggestedLimb)} · {filmLabel(v4, suggestedFilm)} · {suggestedBeat}</p>
      <ol className="c4-pulsometer-index" aria-label={v4("plsRemind")}>
        <li data-tone="gold">{v4("plsOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("plsIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("plsBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("plsResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-pulsometer-remind c4-pulsometer-notices" role="status" aria-label={v4("plsRemind")}>
          {reminders.map((name) => <li key={name}>{v4("plsOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-pulsometer-chart" aria-label={v4("plsChart")}>
        {bars.map((bar) => (
          <button key={bar.piece} type="button" className="c4-pulsometer-column" data-on={pieceFilter === bar.piece ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === bar.piece ? "all" : bar.piece)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{limbLabel(v4, bar.piece)}</span>
          </button>
        ))}
      </div>
      <form className="c4-pulsometer-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("plsEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("plsEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("plsNote")}<input className="c4-field" aria-label={v4("plsNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("plsSetter")}<input className="c4-field" aria-label={v4("plsSetter")} aria-required={false} value={setter} maxLength={24} disabled={viewer} onChange={(event) => setSetter(event.target.value)} /></label>
        <label className="c4-lab">{v4("plsPiece")}<select className="c4-field" aria-label={v4("plsPiece")} value={piece} disabled={viewer} onChange={(event) => setPiece(event.target.value)}><option value="">{v4("plsBlankPiece")}</option>{PLS_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("plsFilm")}<select className="c4-field" aria-label={v4("plsFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("plsAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("plsDrop")}<select className="c4-field" aria-label={v4("plsDrop")} value={dropNo} disabled={viewer} onChange={(event) => setDropNo(event.target.value)}><option value="">{v4("plsAll")}</option>{DROPS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("plsLock")}<select className="c4-field" aria-label={v4("plsLock")} value={lockNo} disabled={viewer} onChange={(event) => setLockNo(event.target.value)}><option value="">{v4("plsAll")}</option>{LOCKS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("plsTag")}<input className="c4-field" aria-label={v4("plsTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("plsAdd")}</button>
      </form>
      <div className="c4-pulsometer-tools">
        <input ref={searchRef} className="c4-field c4-pulsometer-search" aria-label={v4("plsSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("plsSearch")} />
        {(["board", "peg", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "board" ? "plsBoard" : item === "peg" ? "plsPeg" : "plsCoffer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={pieceFilter === "inner" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "inner" ? "all" : "inner")}>{v4("plsInner")}</button>
        <button type="button" className="c4-chip" data-on={pieceFilter === "outer" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "outer" ? "all" : "outer")}>{v4("plsOuter")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "setter" ? "1" : "0"} onClick={() => setSort(sort === "setter" ? "piece" : "setter")}>{sort === "setter" ? v4("plsSortSetter") : v4("plsSortLimb")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("plsClose") : v4("plsAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("plsTimeline")}</button>
        <label className="c4-lab">{v4("plsDesk")}<select className="c4-field" aria-label={v4("plsDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{PLS_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-pulsometer-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addPulsometerView(views, { id, name: viewName, tray, query, setter: setterFilter, film: filmFilter, piece: pieceFilter, drop: dropFilter, lock: lockFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("plsViewName")}<input className="c4-field" aria-label={v4("plsViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("plsSaveView")}</button>
      </form>
      <ul className="c4-pulsometer-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setSetterFilter(view.setter); setFilmFilter(view.film); setPieceFilter(view.piece); setDropFilter(view.drop); setLockFilter(view.lock); }}>{v4("plsApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropPulsometerView(views, view.id))}>{v4("plsDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-pulsometer-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkPulsometerRaise(cards, picked))}>{v4("plsBulkPoise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkPulsometerCoffer(cards, picked))}>{v4("plsBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkPulsometerGraphite(cards, picked))}>{v4("plsBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkPulsometerTag(cards, picked))}>{v4("plsBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("pulsometer-rules.csv", pulsometerCsv(shown, station))}>{v4("plsCsv")}</button>
        <p className="c4-pulsometer-meta">{v4("plsKeys")} / n x a j k · {v4("plsQuiet")} {counts.quiet} · {v4("plsInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-pulsometer-time" aria-label={v4("plsTimeline")}>
          {timeline.map((mail) => <li key={mail.drop}><span>{mail.drop}</span> {mail.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("plsEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-pulsometer-list">
          {shown.map((card) => {
            const late = latePulsometer(card, station);
            return (
              <li key={card.id} className="c4-pulsometer-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idlePulsometer(card) ? "1" : "0"} data-brisk={briskPulsometer(card) ? "1" : "0"} data-overdue={overduePulsometer(card) ? "1" : "0"} data-resting={restingPulsometer(card) ? "1" : "0"} data-inner={pulsometerInner(card.piece) ? "1" : "0"} data-outer={pulsometerOuter(card.piece) ? "1" : "0"}>
                <label className="c4-pulsometer-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editPulsometer(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("plsEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("plsApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editPulsometerNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("plsNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-pulsometer-meta">{limbLabel(v4, card.piece)} · {filmLabel(v4, card.film)} · {card.drop ?? "—"} · {card.lock} · {card.setter || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "plsAuditSave")}` : ""}{late ? ` · ${v4("plsOverdue")}` : ""}</p>
                </div>
                <div className="c4-pulsometer-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("plsEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPulsometerRaised(cards, card.id, !card.raised))}>{card.raised ? v4("plsFree") : v4("plsPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPulsometerFilm(cards, card.id, suggestedFilm))}>{v4("plsSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPulsometerPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("plsUnpeg") : v4("plsPegIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPulsometerCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("plsUncoffer") : v4("plsCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPulsometerStar(cards, card.id, !card.starred))}>{card.starred ? v4("plsUnstar") : v4("plsStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addPulsometerTag(cards, card.id, "b"))}>{v4("plsTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("plsRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("plsLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHammerFocused(cards, card.id))}>{v4("plsLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHammerFocused(cards, card.id))}>{v4("plsLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(finishFocused(cards, card.id))}>{v4("plsFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPulsometerFocused(cards, card.id))}>{v4("plsPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinPulsometerFocused(cards, card.id))}>{v4("plsPeg")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starPulsometerFocused(cards, card.id))}>{v4("plsStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(pulsometerCopy(card))}>{v4("plsCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}


type MarkUser = { id?: string; name?: string | null; leadInvalidReason?: string | null };

export function MarkPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: MarkUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<MarkShape>("all");
  const [review, setReview] = useState<MarkReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): MarkRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { leadInvalidReason: textField(row.leadInvalidReason) } satisfies MarkValue,
    };
  }).filter((row): row is MarkRow => Boolean(row));
  const present = presentMarkLanes(rows);
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
    const next = readHiddenMark(readJson(MRK_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(MRK_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedMark(readJson(MRK_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(MRK_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleMarkLanes(present, hidden, showHidden);
  const shown = visibleMark(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = markLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = markLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingMark(rows);
  const leadHue = leadingMarkHue(rows);
  const whole = rows.filter((row) => markLane(row.code)).length;
  const share = markShare(laneMarkCount(rows, "geo"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("invalid-mark-plates.csv", markLanesCsv(rows));
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
    writeJson(MRK_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(MRK_REVIEW_KEY, next);
  }

  return (
    <section className="c4-mrkplate" aria-label={v4("mrkTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-mrkplate-mast">
        <p className="c4-mrkplate-seal" data-logo="mono">{v4("mrkLogo")}</p>
        <div>
          <p className="c4-mrkplate-kicker">{v4("mrkSub")}</p>
          <h2 className="c4-title">{v4("mrkTitle")}</h2>
        </div>
        <p className="c4-mrkplate-count">{shown.length}</p>
      </header>
      <p className="c4-mrkplate-links">
        <Link href={crmv4Href(base, "pls")}>{v4("plsTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("mrkCustomer")}</Link>
      </p>
      <p className="c4-mrkplate-hint">{v4("mrkHint")}</p>
      {viewer && <p className="c4-mrkplate-note">{v4("mrkViewer")}</p>}
      <p className="c4-mrkplate-meta">{v4("mrkLead")} {laneLabel(v4, lead)} · {v4("mrkToneLead")} {hueLabel(v4, leadHue)} · {v4("mrkShare")} {share}</p>
      <div className="c4-mrkplate-chart" aria-label={v4("mrkChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-mrkplate-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-mrkplate-tools">
        <input ref={searchRef} className="c4-field c4-mrkplate-search" aria-label={v4("mrkSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("mrkSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("mrkShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "mrkAll" : item === "reviewed" ? "mrkReviewed" : "mrkFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("mrkAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as MarkShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleMark(hidden, item))}>{hidden.includes(item) ? v4("mrkShow") : v4("mrkHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-mrkplate-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkMarkReview(reviewed, picked, true))}>{v4("mrkBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkMarkReview(reviewed, picked, false))}>{v4("mrkBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("invalid-mark-lanes.csv", markLanesCsv(rows))}>{v4("mrkCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("invalid-mark-rows.csv", markRowsCsv(shown, reviewed))}>{v4("mrkRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("mrkLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("mrkFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("mrkEmpty")}</p>}
      <ul className="c4-mrkplate-list">
        {shown.map((row) => {
          const name = markCopy(row.code);
          const tone = markHue(row.code);
          return (
            <li key={row.id} className="c4-mrkplate-card" data-mail={markLane(row.code) || "open"} data-hue={tone || "none"} data-lang-mark={markLane(row.code) === "geo" ? "1" : "0"} data-away={markAway(row.code) ? "1" : "0"} data-guest={markGuest(row.code) ? "1" : "0"} data-citizen={markCitizen(row.code) ? "1" : "0"} data-open={markOpen(row.code) ? "1" : "0"} data-even={markEven(row.code) ? "1" : "0"} data-digit={markDigit(row.code) ? "1" : "0"} data-letter={markLetter(row.code) ? "1" : "0"} data-mixed={markMixed(row.code) ? "1" : "0"} data-upper={markUpper(row.code) ? "1" : "0"} data-lower={markLower(row.code) ? "1" : "0"} data-space={markSpace(row.code) ? "1" : "0"} data-vowel={markVowel(row.code) ? "1" : "0"} data-tail={markTail(row.code) ? "1" : "0"} data-first={markFirst(row.code) ? "1" : "0"} data-held={markHeld(row.code) ? "1" : "0"} data-join={markJoin(row.code) ? "1" : "0"} data-gap={markGap(row.code) ? "1" : "0"} data-brief={markBrief(row.code) ? "1" : "0"}>
              <label className="c4-mrkplate-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-mrkplate-meta">{name || v4("mrkOpen")} · {markStamp(row.code) || "—"} · {markFamily(row.code) || "—"} · {markLength(row.code) ?? "—"} · {laneLabel(v4, markLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-mrkplate-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleMarkReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("mrkReviewed") : v4("mrkReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = markCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("mrkCopied") : v4("mrkCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("mrkCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
