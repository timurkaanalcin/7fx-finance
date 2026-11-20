"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  MKP_KEY,
  MKP_REVIEW_KEY,
  FLQ_DENSITY_KEY,
  FLQ_KEY,
  FLQ_MODES,
  FLQ_VIEW_KEY,
  addFlinque,
  addFlinqueTag,
  addFlinqueView,
  briskFlinque,
  bulkSelReview,
  bulkFlinqueCoffer,
  bulkFlinqueGraphite,
  bulkFlinqueRaise,
  bulkFlinqueTag,
  busiestKeeper,
  dropFlinqueView,
  editFlinque,
  editFlinqueNote,
  mkpBrief,
  mkpCopy,
  mkpDigit,
  mkpEven,
  mkpFamily,
  mkpFirst,
  mkpRoute,
  mkpHeld,
  mkpAway,
  mkpHue,
  mkpJoin,
  mkpCitizen,
  mkpLane,
  mkpLanes,
  mkpLanesCsv,
  mkpLength,
  mkpLetter,
  mkpLower,
  mkpMixed,
  mkpOpen,
  mkpRowsCsv,
  mkpShare,
  mkpSpace,
  mkpStamp,
  mkpTail,
  mkpUpper,
  mkpGuest,
  mkpVowel,
  fairKeeper,
  finishFocused,
  flinqueBars,
  flinqueCopy,
  flinqueCounts,
  flinqueCsv,
  flinqueDensity,
  flinqueInner,
  flinqueOuter,
  flinqueTimeline,
  flinqueKeepers,
  idleFlinque,
  laneSelCount,
  lateFlinque,
  leadingSel,
  leadingSelHue,
  lowerHourFocused,
  lowerHammerFocused,
  moveFlinqueFocus,
  overdueFlinque,
  pinFlinqueFocused,
  presentSelLanes,
  raiseHourFocused,
  raiseHammerFocused,
  readHiddenSel,
  readFlinques,
  readFlinqueViews,
  readReviewedSel,
  reminderFlinques,
  restingFlinque,
  setFlinqueCoffer,
  setFlinqueFilm,
  setFlinqueFocused,
  setFlinquePin,
  setFlinqueRaised,
  setFlinqueStar,
  sortFlinques,
  starFlinqueFocused,
  suggestHour,
  suggestFinish,
  suggestMode,
  toggleSel,
  toggleSelReview,
  visibleSel,
  visibleSelLanes,
  visibleFlinques,
  type MkpReview,
  type MkpRow,
  type MkpShape,
  type MkpValue,
  type Flinque,
  type FlinqueDensity,
  type FlinqueSort,
  type FlinqueTray,
  type FlinqueView,
} from "@/lib/crmv4/round360";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["GILT", "IVORY", "GRAPHITE"] as const;
const DROPS = ["4", "9", "18", "36"] as const;
const LOCKS = ["2", "4", "8"] as const;

const PIECE_KEY: Record<string, CrmV4CopyKey> = {
  foil: "flqCloud",
  wave: "flqWave",
  scale: "flqSun",
  lace: "flqRing",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "flqAuditSave",
  edit: "flqAuditEdit",
  note: "flqAuditNote",
  film: "flqAuditFilm",
  poise: "flqAuditPoise",
  free: "flqAuditFree",
  peg: "flqAuditPeg",
  return: "flqAuditReturn",
  coffer: "flqAuditCoffer",
  open: "flqAuditOpen",
  tag: "flqAuditTag",
  lock: "flqAuditRate",
  drop: "flqAuditStep",
  lower: "flqAuditLower",
  star: "flqAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  hall: "mkpLaneHall",
  vacant: "mkpLaneVacant",
  hold: "mkpLaneHold",
  desk: "mkpLaneDesk",
  guest: "mkpLaneGuest",
  join: "mkpJoin",
  route: "mkpRoute",
  brief: "mkpBrief",
  long: "mkpLong",
  stamp: "mkpStampLane",
  vowel: "mkpVowel",
  plain: "mkpPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "mkpChampagne",
  ivory: "mkpIvory",
  graphite: "mkpGraphite",
};

const SHAPE_KEY: Record<MkpShape, CrmV4CopyKey> = {
  all: "mkpShapeAll",
  hall: "mkpShapeHall",
  vacant: "mkpShapeVacant",
  hold: "mkpShapeHold",
  guest: "mkpShapeGuest",
  join: "mkpShapeJoin",
  route: "mkpShapeRoute",
  brief: "mkpShapeBrief",
  long: "mkpShapeLong",
  stamp: "mkpShapeStamp",
  vowel: "mkpShapeVowel",
  plain: "mkpShapePlain",
  open: "mkpShapeOpen",
  soon: "mkpShapeOpen",
  letter: "mkpShapePlain",
  mixed: "mkpShapeStamp",
  upper: "mkpShapeUpper",
  lower: "mkpShapePlain",
  space: "mkpShapeSpace",
  even: "mkpShapeEven",
  odd: "mkpShapeEven",
  tail: "mkpShapeStamp",
  first: "mkpShapePlain",
  held: "mkpShapeLong",
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
  return key ? v4(key) : v4("flqBlankPiece");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "GILT") return v4("flqGilt");
  if (film === "IVORY") return v4("flqIvory");
  if (film === "GRAPHITE") return v4("flqGraphite");
  return v4("flqAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("mkpBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("mkpBlank");
}

export function FlinqueRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Flinque[]>([]);
  const [views, setViews] = useState<FlinqueView[]>([]);
  const [density, setDensity] = useState<FlinqueDensity>("airy");
  const [tray, setTray] = useState<FlinqueTray>("board");
  const [query, setQuery] = useState("");
  const [setterFilter, setSetterFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [pieceFilter, setPieceFilter] = useState("all");
  const [dropFilter, setDropFilter] = useState("all");
  const [lockFilter, setLockFilter] = useState("all");
  const [sort, setSort] = useState<FlinqueSort>("piece");
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
  const [station, setStation] = useState("foil");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readFlinques(readJson(FLQ_KEY, [])));
    setViews(readFlinqueViews(readJson(FLQ_VIEW_KEY, [])));
    setDensity(flinqueDensity(readJson(FLQ_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Flinque[]) {
    setCards(next);
    writeJson(FLQ_KEY, next);
  }
  function storeViews(next: FlinqueView[]) {
    setViews(next);
    writeJson(FLQ_VIEW_KEY, next);
  }
  function storeDensity(next: FlinqueDensity) {
    setDensity(next);
    writeJson(FLQ_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortFlinques(visibleFlinques(cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter), sort),
    [cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter, sort],
  );
  const counts = flinqueCounts(cards, shown, station);
  const bars = flinqueBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = flinqueTimeline(cards);
  const reminders = reminderFlinques(cards);
  const poisers = flinqueKeepers(cards);
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
        download("flinque-foils.csv", flinqueCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveFlinqueFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveFlinqueFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addFlinque(cards, { title, note, setter: setter, piece, drop: dropNo, film, lock: lockNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-flinque" aria-label={v4("flqTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-flinque-mast">
        <p className="c4-flinque-seal" data-logo="mono">{v4("flqLogo")}</p>
        <div>
          <p className="c4-flinque-kicker">{v4("flqSub")}</p>
          <h2 className="c4-title">{v4("flqTitle")}</h2>
        </div>
        <p className="c4-flinque-count">{shown.length}</p>
      </header>
      <p className="c4-flinque-links">
        <Link href={crmv4Href(base, "mkp")}>{v4("mkpTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("flqCustomers")}</Link>
      </p>
      <p className="c4-flinque-hint">{v4("flqHint")}</p>
      {viewer && <p className="c4-flinque-note">{v4("flqViewer")}</p>}
      <p className="c4-flinque-meta">{v4("flqFair")} {fair || "—"} · {v4("flqBusy")} {busy || "—"} · {v4("flqSuggest")} {limbLabel(v4, suggestedLimb)} · {filmLabel(v4, suggestedFilm)} · {suggestedBeat}</p>
      <ol className="c4-flinque-index" aria-label={v4("flqRemind")}>
        <li data-tone="gold">{v4("flqOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("flqIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("flqBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("flqResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-flinque-remind c4-flinque-notices" role="status" aria-label={v4("flqRemind")}>
          {reminders.map((name) => <li key={name}>{v4("flqOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-flinque-chart" aria-label={v4("flqChart")}>
        {bars.map((bar) => (
          <button key={bar.piece} type="button" className="c4-flinque-column" data-on={pieceFilter === bar.piece ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === bar.piece ? "all" : bar.piece)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{limbLabel(v4, bar.piece)}</span>
          </button>
        ))}
      </div>
      <form className="c4-flinque-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("flqEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("flqEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("flqNote")}<input className="c4-field" aria-label={v4("flqNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("flqSetter")}<input className="c4-field" aria-label={v4("flqSetter")} aria-required={false} value={setter} maxLength={24} disabled={viewer} onChange={(event) => setSetter(event.target.value)} /></label>
        <label className="c4-lab">{v4("flqPiece")}<select className="c4-field" aria-label={v4("flqPiece")} value={piece} disabled={viewer} onChange={(event) => setPiece(event.target.value)}><option value="">{v4("flqBlankPiece")}</option>{FLQ_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("flqFilm")}<select className="c4-field" aria-label={v4("flqFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("flqAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("flqDrop")}<select className="c4-field" aria-label={v4("flqDrop")} value={dropNo} disabled={viewer} onChange={(event) => setDropNo(event.target.value)}><option value="">{v4("flqAll")}</option>{DROPS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("flqLock")}<select className="c4-field" aria-label={v4("flqLock")} value={lockNo} disabled={viewer} onChange={(event) => setLockNo(event.target.value)}><option value="">{v4("flqAll")}</option>{LOCKS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("flqTag")}<input className="c4-field" aria-label={v4("flqTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("flqAdd")}</button>
      </form>
      <div className="c4-flinque-tools">
        <input ref={searchRef} className="c4-field c4-flinque-search" aria-label={v4("flqSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("flqSearch")} />
        {(["board", "peg", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "board" ? "flqBoard" : item === "peg" ? "flqPeg" : "flqCoffer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={pieceFilter === "inner" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "inner" ? "all" : "inner")}>{v4("flqInner")}</button>
        <button type="button" className="c4-chip" data-on={pieceFilter === "outer" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "outer" ? "all" : "outer")}>{v4("flqOuter")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "setter" ? "1" : "0"} onClick={() => setSort(sort === "setter" ? "piece" : "setter")}>{sort === "setter" ? v4("flqSortSetter") : v4("flqSortLimb")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("flqClose") : v4("flqAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("flqTimeline")}</button>
        <label className="c4-lab">{v4("flqDesk")}<select className="c4-field" aria-label={v4("flqDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{FLQ_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-flinque-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addFlinqueView(views, { id, name: viewName, tray, query, setter: setterFilter, film: filmFilter, piece: pieceFilter, drop: dropFilter, lock: lockFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("flqViewName")}<input className="c4-field" aria-label={v4("flqViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("flqSaveView")}</button>
      </form>
      <ul className="c4-flinque-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setSetterFilter(view.setter); setFilmFilter(view.film); setPieceFilter(view.piece); setDropFilter(view.drop); setLockFilter(view.lock); }}>{v4("flqApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropFlinqueView(views, view.id))}>{v4("flqDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-flinque-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkFlinqueRaise(cards, picked))}>{v4("flqBulkPoise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkFlinqueCoffer(cards, picked))}>{v4("flqBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkFlinqueGraphite(cards, picked))}>{v4("flqBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkFlinqueTag(cards, picked))}>{v4("flqBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("flinque-foils.csv", flinqueCsv(shown, station))}>{v4("flqCsv")}</button>
        <p className="c4-flinque-meta">{v4("flqKeys")} / n x a j k · {v4("flqQuiet")} {counts.quiet} · {v4("flqInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-flinque-time" aria-label={v4("flqTimeline")}>
          {timeline.map((mail) => <li key={mail.drop}><span>{mail.drop}</span> {mail.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("flqEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-flinque-list">
          {shown.map((card) => {
            const late = lateFlinque(card, station);
            return (
              <li key={card.id} className="c4-flinque-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleFlinque(card) ? "1" : "0"} data-brisk={briskFlinque(card) ? "1" : "0"} data-overdue={overdueFlinque(card) ? "1" : "0"} data-resting={restingFlinque(card) ? "1" : "0"} data-inner={flinqueInner(card.piece) ? "1" : "0"} data-outer={flinqueOuter(card.piece) ? "1" : "0"}>
                <label className="c4-flinque-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editFlinque(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("flqEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("flqApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editFlinqueNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("flqNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-flinque-meta">{limbLabel(v4, card.piece)} · {filmLabel(v4, card.film)} · {card.drop ?? "—"} · {card.lock} · {card.setter || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "flqAuditSave")}` : ""}{late ? ` · ${v4("flqOverdue")}` : ""}</p>
                </div>
                <div className="c4-flinque-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("flqEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFlinqueRaised(cards, card.id, !card.raised))}>{card.raised ? v4("flqFree") : v4("flqPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFlinqueFilm(cards, card.id, suggestedFilm))}>{v4("flqSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFlinquePin(cards, card.id, !card.pinned))}>{card.pinned ? v4("flqUnpeg") : v4("flqPegIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFlinqueCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("flqUncoffer") : v4("flqCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFlinqueStar(cards, card.id, !card.starred))}>{card.starred ? v4("flqUnstar") : v4("flqStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addFlinqueTag(cards, card.id, "g"))}>{v4("flqTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("flqRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("flqLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHammerFocused(cards, card.id))}>{v4("flqLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHammerFocused(cards, card.id))}>{v4("flqLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(finishFocused(cards, card.id))}>{v4("flqFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFlinqueFocused(cards, card.id))}>{v4("flqPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinFlinqueFocused(cards, card.id))}>{v4("flqPeg")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starFlinqueFocused(cards, card.id))}>{v4("flqStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(flinqueCopy(card))}>{v4("flqCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}


type MkpUser = { id?: string; name?: string | null; canManageMethods?: string | boolean | null };

export function MethodKeeperPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: MkpUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<MkpShape>("all");
  const [review, setReview] = useState<MkpReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): MkpRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { canManageMethods: row.canManageMethods === true || row.canManageMethods === false ? row.canManageMethods : textField(row.canManageMethods) } satisfies MkpValue,
    };
  }).filter((row): row is MkpRow => Boolean(row));
  const present = presentSelLanes(rows);
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
    const next = readHiddenSel(readJson(MKP_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(MKP_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedSel(readJson(MKP_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(MKP_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleSelLanes(present, hidden, showHidden);
  const shown = visibleSel(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = mkpLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = mkpLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingSel(rows);
  const leadHue = leadingSelHue(rows);
  const whole = rows.filter((row) => mkpLane(row.code)).length;
  const share = mkpShare(laneSelCount(rows, "hall"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("method-keepers.csv", mkpLanesCsv(rows));
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
    writeJson(MKP_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(MKP_REVIEW_KEY, next);
  }

  return (
    <section className="c4-mkpplate" aria-label={v4("mkpTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-mkpplate-mast">
        <p className="c4-mkpplate-seal" data-logo="mono">{v4("mkpLogo")}</p>
        <div>
          <p className="c4-mkpplate-kicker">{v4("mkpSub")}</p>
          <h2 className="c4-title">{v4("mkpTitle")}</h2>
        </div>
        <p className="c4-mkpplate-count">{shown.length}</p>
      </header>
      <p className="c4-mkpplate-links">
        <Link href={crmv4Href(base, "flq")}>{v4("flqTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("mkpCustomer")}</Link>
      </p>
      <p className="c4-mkpplate-hint">{v4("mkpHint")}</p>
      {viewer && <p className="c4-mkpplate-note">{v4("mkpViewer")}</p>}
      <p className="c4-mkpplate-meta">{v4("mkpLead")} {laneLabel(v4, lead)} · {v4("mkpToneLead")} {hueLabel(v4, leadHue)} · {v4("mkpShare")} {share}</p>
      <div className="c4-mkpplate-chart" aria-label={v4("mkpChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-mkpplate-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-mkpplate-tools">
        <input ref={searchRef} className="c4-field c4-mkpplate-search" aria-label={v4("mkpSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("mkpSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("mkpShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "mkpAll" : item === "reviewed" ? "mkpReviewed" : "mkpFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("mkpAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as MkpShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleSel(hidden, item))}>{hidden.includes(item) ? v4("mkpShow") : v4("mkpHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-mkpplate-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSelReview(reviewed, picked, true))}>{v4("mkpBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSelReview(reviewed, picked, false))}>{v4("mkpBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("method-keeper-lanes.csv", mkpLanesCsv(rows))}>{v4("mkpCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("method-keeper-rows.csv", mkpRowsCsv(shown, reviewed))}>{v4("mkpRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("mkpLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("mkpFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("mkpEmpty")}</p>}
      <ul className="c4-mkpplate-list">
        {shown.map((row) => {
          const name = mkpCopy(row.code);
          const tone = mkpHue(row.code);
          return (
            <li key={row.id} className="c4-mkpplate-card" data-mail={mkpLane(row.code) || "open"} data-hue={tone || "none"} data-home={mkpLane(row.code) === "hall" ? "1" : "0"} data-away={mkpAway(row.code) ? "1" : "0"} data-guest={mkpGuest(row.code) ? "1" : "0"} data-citizen={mkpCitizen(row.code) ? "1" : "0"} data-open={mkpOpen(row.code) ? "1" : "0"} data-even={mkpEven(row.code) ? "1" : "0"} data-digit={mkpDigit(row.code) ? "1" : "0"} data-letter={mkpLetter(row.code) ? "1" : "0"} data-mixed={mkpMixed(row.code) ? "1" : "0"} data-upper={mkpUpper(row.code) ? "1" : "0"} data-lower={mkpLower(row.code) ? "1" : "0"} data-space={mkpSpace(row.code) ? "1" : "0"} data-vowel={mkpVowel(row.code) ? "1" : "0"} data-tail={mkpTail(row.code) ? "1" : "0"} data-first={mkpFirst(row.code) ? "1" : "0"} data-held={mkpHeld(row.code) ? "1" : "0"} data-join={mkpJoin(row.code) ? "1" : "0"} data-route={mkpRoute(row.code) ? "1" : "0"} data-brief={mkpBrief(row.code) ? "1" : "0"}>
              <label className="c4-mkpplate-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-mkpplate-meta">{name || v4("mkpOpen")} · {mkpStamp(row.code) || "—"} · {mkpFamily(row.code) || "—"} · {mkpLength(row.code) ?? "—"} · {laneLabel(v4, mkpLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-mkpplate-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleSelReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("mkpReviewed") : v4("mkpReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = mkpCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("mkpCopied") : v4("mkpCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("mkpCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
