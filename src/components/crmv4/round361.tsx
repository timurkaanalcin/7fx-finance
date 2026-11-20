"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  JBT_KEY,
  JBT_REVIEW_KEY,
  CDR_DENSITY_KEY,
  CDR_KEY,
  CDR_MODES,
  CDR_VIEW_KEY,
  addCadrature,
  addCadratureTag,
  addCadratureView,
  briskCadrature,
  bulkSelReview,
  bulkCadratureCoffer,
  bulkCadratureGraphite,
  bulkCadratureRaise,
  bulkCadratureTag,
  busiestKeeper,
  dropCadratureView,
  editCadrature,
  editCadratureNote,
  jbtBrief,
  jbtCopy,
  jbtDigit,
  jbtEven,
  jbtFamily,
  jbtFirst,
  jbtRoute,
  jbtHeld,
  jbtAway,
  jbtHue,
  jbtJoin,
  jbtCitizen,
  jbtLane,
  jbtLanes,
  jbtLanesCsv,
  jbtLength,
  jbtLetter,
  jbtLower,
  jbtMixed,
  jbtOpen,
  jbtRowsCsv,
  jbtShare,
  jbtSpace,
  jbtStamp,
  jbtTail,
  jbtUpper,
  jbtGuest,
  jbtVowel,
  fairKeeper,
  finishFocused,
  cadratureBars,
  cadratureCopy,
  cadratureCounts,
  cadratureCsv,
  cadratureDensity,
  cadratureInner,
  cadratureOuter,
  cadratureTimeline,
  cadratureKeepers,
  idleCadrature,
  laneSelCount,
  lateCadrature,
  leadingSel,
  leadingSelHue,
  lowerHourFocused,
  lowerHammerFocused,
  moveCadratureFocus,
  overdueCadrature,
  pinCadratureFocused,
  presentSelLanes,
  raiseHourFocused,
  raiseHammerFocused,
  readHiddenSel,
  readCadratures,
  readCadratureViews,
  readReviewedSel,
  reminderCadratures,
  restingCadrature,
  setCadratureCoffer,
  setCadratureFilm,
  setCadratureFocused,
  setCadraturePin,
  setCadratureRaised,
  setCadratureStar,
  sortCadratures,
  starCadratureFocused,
  suggestHour,
  suggestFinish,
  suggestMode,
  toggleSel,
  toggleSelReview,
  visibleSel,
  visibleSelLanes,
  visibleCadratures,
  type JbtReview,
  type JbtRow,
  type JbtShape,
  type JbtValue,
  type Cadrature,
  type CadratureDensity,
  type CadratureSort,
  type CadratureTray,
  type CadratureView,
} from "@/lib/crmv4/round361";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["GILT", "IVORY", "GRAPHITE"] as const;
const DROPS = ["5", "10", "15", "30"] as const;
const LOCKS = ["1", "3", "6"] as const;

const PIECE_KEY: Record<string, CrmV4CopyKey> = {
  cannon: "cdrCloud",
  minute: "cdrWave",
  hour: "cdrSun",
  date: "cdrRing",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "cdrAuditSave",
  edit: "cdrAuditEdit",
  note: "cdrAuditNote",
  film: "cdrAuditFilm",
  poise: "cdrAuditPoise",
  free: "cdrAuditFree",
  peg: "cdrAuditPeg",
  return: "cdrAuditReturn",
  coffer: "cdrAuditCoffer",
  open: "cdrAuditOpen",
  tag: "cdrAuditTag",
  lock: "cdrAuditRate",
  drop: "cdrAuditStep",
  lower: "cdrAuditLower",
  star: "cdrAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  hall: "jbtLaneHall",
  vacant: "jbtLaneVacant",
  hold: "jbtLaneHold",
  desk: "jbtLaneDesk",
  guest: "jbtLaneGuest",
  join: "jbtJoin",
  route: "jbtRoute",
  brief: "jbtBrief",
  long: "jbtLong",
  stamp: "jbtStampLane",
  vowel: "jbtVowel",
  plain: "jbtPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "jbtChampagne",
  ivory: "jbtIvory",
  graphite: "jbtGraphite",
};

const SHAPE_KEY: Record<JbtShape, CrmV4CopyKey> = {
  all: "jbtShapeAll",
  hall: "jbtShapeHall",
  vacant: "jbtShapeVacant",
  hold: "jbtShapeHold",
  guest: "jbtShapeGuest",
  join: "jbtShapeJoin",
  route: "jbtShapeRoute",
  brief: "jbtShapeBrief",
  long: "jbtShapeLong",
  stamp: "jbtShapeStamp",
  vowel: "jbtShapeVowel",
  plain: "jbtShapePlain",
  open: "jbtShapeOpen",
  soon: "jbtShapeOpen",
  letter: "jbtShapePlain",
  mixed: "jbtShapeStamp",
  upper: "jbtShapeUpper",
  lower: "jbtShapePlain",
  space: "jbtShapeSpace",
  even: "jbtShapeEven",
  odd: "jbtShapeEven",
  tail: "jbtShapeStamp",
  first: "jbtShapePlain",
  held: "jbtShapeLong",
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
  return key ? v4(key) : v4("cdrBlankPiece");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "GILT") return v4("cdrGilt");
  if (film === "IVORY") return v4("cdrIvory");
  if (film === "GRAPHITE") return v4("cdrGraphite");
  return v4("cdrAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("jbtBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("jbtBlank");
}

export function CadratureRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Cadrature[]>([]);
  const [views, setViews] = useState<CadratureView[]>([]);
  const [density, setDensity] = useState<CadratureDensity>("airy");
  const [tray, setTray] = useState<CadratureTray>("board");
  const [query, setQuery] = useState("");
  const [setterFilter, setSetterFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [pieceFilter, setPieceFilter] = useState("all");
  const [dropFilter, setDropFilter] = useState("all");
  const [lockFilter, setLockFilter] = useState("all");
  const [sort, setSort] = useState<CadratureSort>("piece");
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
  const [station, setStation] = useState("cannon");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readCadratures(readJson(CDR_KEY, [])));
    setViews(readCadratureViews(readJson(CDR_VIEW_KEY, [])));
    setDensity(cadratureDensity(readJson(CDR_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Cadrature[]) {
    setCards(next);
    writeJson(CDR_KEY, next);
  }
  function storeViews(next: CadratureView[]) {
    setViews(next);
    writeJson(CDR_VIEW_KEY, next);
  }
  function storeDensity(next: CadratureDensity) {
    setDensity(next);
    writeJson(CDR_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortCadratures(visibleCadratures(cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter), sort),
    [cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter, sort],
  );
  const counts = cadratureCounts(cards, shown, station);
  const bars = cadratureBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = cadratureTimeline(cards);
  const reminders = reminderCadratures(cards);
  const poisers = cadratureKeepers(cards);
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
        download("cadrature-rules.csv", cadratureCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveCadratureFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveCadratureFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addCadrature(cards, { title, note, setter: setter, piece, drop: dropNo, film, lock: lockNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-cadrature" aria-label={v4("cdrTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-cadrature-mast">
        <p className="c4-cadrature-seal" data-logo="mono">{v4("cdrLogo")}</p>
        <div>
          <p className="c4-cadrature-kicker">{v4("cdrSub")}</p>
          <h2 className="c4-title">{v4("cdrTitle")}</h2>
        </div>
        <p className="c4-cadrature-count">{shown.length}</p>
      </header>
      <p className="c4-cadrature-links">
        <Link href={crmv4Href(base, "jbt")}>{v4("jbtTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("cdrCustomers")}</Link>
      </p>
      <p className="c4-cadrature-hint">{v4("cdrHint")}</p>
      {viewer && <p className="c4-cadrature-note">{v4("cdrViewer")}</p>}
      <p className="c4-cadrature-meta">{v4("cdrFair")} {fair || "—"} · {v4("cdrBusy")} {busy || "—"} · {v4("cdrSuggest")} {limbLabel(v4, suggestedLimb)} · {filmLabel(v4, suggestedFilm)} · {suggestedBeat}</p>
      <ol className="c4-cadrature-index" aria-label={v4("cdrRemind")}>
        <li data-tone="gold">{v4("cdrOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("cdrIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("cdrBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("cdrResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-cadrature-remind c4-cadrature-notices" role="status" aria-label={v4("cdrRemind")}>
          {reminders.map((name) => <li key={name}>{v4("cdrOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-cadrature-chart" aria-label={v4("cdrChart")}>
        {bars.map((bar) => (
          <button key={bar.piece} type="button" className="c4-cadrature-column" data-on={pieceFilter === bar.piece ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === bar.piece ? "all" : bar.piece)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{limbLabel(v4, bar.piece)}</span>
          </button>
        ))}
      </div>
      <form className="c4-cadrature-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("cdrEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("cdrEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("cdrNote")}<input className="c4-field" aria-label={v4("cdrNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("cdrSetter")}<input className="c4-field" aria-label={v4("cdrSetter")} aria-required={false} value={setter} maxLength={24} disabled={viewer} onChange={(event) => setSetter(event.target.value)} /></label>
        <label className="c4-lab">{v4("cdrPiece")}<select className="c4-field" aria-label={v4("cdrPiece")} value={piece} disabled={viewer} onChange={(event) => setPiece(event.target.value)}><option value="">{v4("cdrBlankPiece")}</option>{CDR_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("cdrFilm")}<select className="c4-field" aria-label={v4("cdrFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("cdrAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("cdrDrop")}<select className="c4-field" aria-label={v4("cdrDrop")} value={dropNo} disabled={viewer} onChange={(event) => setDropNo(event.target.value)}><option value="">{v4("cdrAll")}</option>{DROPS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("cdrLock")}<select className="c4-field" aria-label={v4("cdrLock")} value={lockNo} disabled={viewer} onChange={(event) => setLockNo(event.target.value)}><option value="">{v4("cdrAll")}</option>{LOCKS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("cdrTag")}<input className="c4-field" aria-label={v4("cdrTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("cdrAdd")}</button>
      </form>
      <div className="c4-cadrature-tools">
        <input ref={searchRef} className="c4-field c4-cadrature-search" aria-label={v4("cdrSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("cdrSearch")} />
        {(["board", "peg", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "board" ? "cdrBoard" : item === "peg" ? "cdrPeg" : "cdrCoffer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={pieceFilter === "inner" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "inner" ? "all" : "inner")}>{v4("cdrInner")}</button>
        <button type="button" className="c4-chip" data-on={pieceFilter === "outer" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "outer" ? "all" : "outer")}>{v4("cdrOuter")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "setter" ? "1" : "0"} onClick={() => setSort(sort === "setter" ? "piece" : "setter")}>{sort === "setter" ? v4("cdrSortSetter") : v4("cdrSortLimb")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("cdrClose") : v4("cdrAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("cdrTimeline")}</button>
        <label className="c4-lab">{v4("cdrDesk")}<select className="c4-field" aria-label={v4("cdrDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{CDR_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-cadrature-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addCadratureView(views, { id, name: viewName, tray, query, setter: setterFilter, film: filmFilter, piece: pieceFilter, drop: dropFilter, lock: lockFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("cdrViewName")}<input className="c4-field" aria-label={v4("cdrViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("cdrSaveView")}</button>
      </form>
      <ul className="c4-cadrature-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setSetterFilter(view.setter); setFilmFilter(view.film); setPieceFilter(view.piece); setDropFilter(view.drop); setLockFilter(view.lock); }}>{v4("cdrApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropCadratureView(views, view.id))}>{v4("cdrDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-cadrature-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCadratureRaise(cards, picked))}>{v4("cdrBulkPoise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCadratureCoffer(cards, picked))}>{v4("cdrBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCadratureGraphite(cards, picked))}>{v4("cdrBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCadratureTag(cards, picked))}>{v4("cdrBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("cadrature-rules.csv", cadratureCsv(shown, station))}>{v4("cdrCsv")}</button>
        <p className="c4-cadrature-meta">{v4("cdrKeys")} / n x a j k · {v4("cdrQuiet")} {counts.quiet} · {v4("cdrInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-cadrature-time" aria-label={v4("cdrTimeline")}>
          {timeline.map((mail) => <li key={mail.drop}><span>{mail.drop}</span> {mail.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("cdrEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-cadrature-list">
          {shown.map((card) => {
            const late = lateCadrature(card, station);
            return (
              <li key={card.id} className="c4-cadrature-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleCadrature(card) ? "1" : "0"} data-brisk={briskCadrature(card) ? "1" : "0"} data-overdue={overdueCadrature(card) ? "1" : "0"} data-resting={restingCadrature(card) ? "1" : "0"} data-inner={cadratureInner(card.piece) ? "1" : "0"} data-outer={cadratureOuter(card.piece) ? "1" : "0"}>
                <label className="c4-cadrature-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editCadrature(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("cdrEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("cdrApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editCadratureNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("cdrNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-cadrature-meta">{limbLabel(v4, card.piece)} · {filmLabel(v4, card.film)} · {card.drop ?? "—"} · {card.lock} · {card.setter || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "cdrAuditSave")}` : ""}{late ? ` · ${v4("cdrOverdue")}` : ""}</p>
                </div>
                <div className="c4-cadrature-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("cdrEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCadratureRaised(cards, card.id, !card.raised))}>{card.raised ? v4("cdrFree") : v4("cdrPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCadratureFilm(cards, card.id, suggestedFilm))}>{v4("cdrSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCadraturePin(cards, card.id, !card.pinned))}>{card.pinned ? v4("cdrUnpeg") : v4("cdrPegIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCadratureCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("cdrUncoffer") : v4("cdrCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCadratureStar(cards, card.id, !card.starred))}>{card.starred ? v4("cdrUnstar") : v4("cdrStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addCadratureTag(cards, card.id, "g"))}>{v4("cdrTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("cdrRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("cdrLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHammerFocused(cards, card.id))}>{v4("cdrLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHammerFocused(cards, card.id))}>{v4("cdrLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(finishFocused(cards, card.id))}>{v4("cdrFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCadratureFocused(cards, card.id))}>{v4("cdrPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinCadratureFocused(cards, card.id))}>{v4("cdrPeg")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starCadratureFocused(cards, card.id))}>{v4("cdrStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(cadratureCopy(card))}>{v4("cdrCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}


type JbtUser = { id?: string; name?: string | null; jobTitle?: string | boolean | null };

export function JobTitlePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: JbtUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<JbtShape>("all");
  const [review, setReview] = useState<JbtReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): JbtRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { jobTitle: row.jobTitle === true || row.jobTitle === false ? row.jobTitle : textField(row.jobTitle) } satisfies JbtValue,
    };
  }).filter((row): row is JbtRow => Boolean(row));
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
    const next = readHiddenSel(readJson(JBT_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(JBT_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedSel(readJson(JBT_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(JBT_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleSelLanes(present, hidden, showHidden);
  const shown = visibleSel(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = jbtLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = jbtLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingSel(rows);
  const leadHue = leadingSelHue(rows);
  const whole = rows.filter((row) => jbtLane(row.code)).length;
  const share = jbtShare(laneSelCount(rows, "hall"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("job-titles.csv", jbtLanesCsv(rows));
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
    writeJson(JBT_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(JBT_REVIEW_KEY, next);
  }

  return (
    <section className="c4-jbtplate" aria-label={v4("jbtTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-jbtplate-mast">
        <p className="c4-jbtplate-seal" data-logo="mono">{v4("jbtLogo")}</p>
        <div>
          <p className="c4-jbtplate-kicker">{v4("jbtSub")}</p>
          <h2 className="c4-title">{v4("jbtTitle")}</h2>
        </div>
        <p className="c4-jbtplate-count">{shown.length}</p>
      </header>
      <p className="c4-jbtplate-links">
        <Link href={crmv4Href(base, "cdr")}>{v4("cdrTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("jbtCustomer")}</Link>
      </p>
      <p className="c4-jbtplate-hint">{v4("jbtHint")}</p>
      {viewer && <p className="c4-jbtplate-note">{v4("jbtViewer")}</p>}
      <p className="c4-jbtplate-meta">{v4("jbtLead")} {laneLabel(v4, lead)} · {v4("jbtToneLead")} {hueLabel(v4, leadHue)} · {v4("jbtShare")} {share}</p>
      <div className="c4-jbtplate-chart" aria-label={v4("jbtChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-jbtplate-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-jbtplate-tools">
        <input ref={searchRef} className="c4-field c4-jbtplate-search" aria-label={v4("jbtSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("jbtSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("jbtShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "jbtAll" : item === "reviewed" ? "jbtReviewed" : "jbtFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("jbtAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as JbtShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleSel(hidden, item))}>{hidden.includes(item) ? v4("jbtShow") : v4("jbtHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-jbtplate-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSelReview(reviewed, picked, true))}>{v4("jbtBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSelReview(reviewed, picked, false))}>{v4("jbtBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("job-title-lanes.csv", jbtLanesCsv(rows))}>{v4("jbtCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("job-title-rows.csv", jbtRowsCsv(shown, reviewed))}>{v4("jbtRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("jbtLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("jbtFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("jbtEmpty")}</p>}
      <ul className="c4-jbtplate-list">
        {shown.map((row) => {
          const name = jbtCopy(row.code);
          const tone = jbtHue(row.code);
          return (
            <li key={row.id} className="c4-jbtplate-card" data-mail={jbtLane(row.code) || "open"} data-hue={tone || "none"} data-home={jbtLane(row.code) === "hall" ? "1" : "0"} data-away={jbtAway(row.code) ? "1" : "0"} data-guest={jbtGuest(row.code) ? "1" : "0"} data-citizen={jbtCitizen(row.code) ? "1" : "0"} data-open={jbtOpen(row.code) ? "1" : "0"} data-even={jbtEven(row.code) ? "1" : "0"} data-digit={jbtDigit(row.code) ? "1" : "0"} data-letter={jbtLetter(row.code) ? "1" : "0"} data-mixed={jbtMixed(row.code) ? "1" : "0"} data-upper={jbtUpper(row.code) ? "1" : "0"} data-lower={jbtLower(row.code) ? "1" : "0"} data-space={jbtSpace(row.code) ? "1" : "0"} data-vowel={jbtVowel(row.code) ? "1" : "0"} data-tail={jbtTail(row.code) ? "1" : "0"} data-first={jbtFirst(row.code) ? "1" : "0"} data-held={jbtHeld(row.code) ? "1" : "0"} data-join={jbtJoin(row.code) ? "1" : "0"} data-route={jbtRoute(row.code) ? "1" : "0"} data-brief={jbtBrief(row.code) ? "1" : "0"}>
              <label className="c4-jbtplate-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-jbtplate-meta">{name || v4("jbtOpen")} · {jbtStamp(row.code) || "—"} · {jbtFamily(row.code) || "—"} · {jbtLength(row.code) ?? "—"} · {laneLabel(v4, jbtLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-jbtplate-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleSelReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("jbtReviewed") : v4("jbtReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = jbtCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("jbtCopied") : v4("jbtCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("jbtCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
