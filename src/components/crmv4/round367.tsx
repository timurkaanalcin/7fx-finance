"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  AFA_KEY,
  AFA_REVIEW_KEY,
  TPS_DENSITY_KEY,
  TPS_KEY,
  TPS_MODES,
  TPS_VIEW_KEY,
  addTapisserie,
  addTapisserieTag,
  addTapisserieView,
  briskTapisserie,
  bulkSelReview,
  bulkTapisserieCoffer,
  bulkTapisserieGraphite,
  bulkTapisserieRaise,
  bulkTapisserieTag,
  busiestKeeper,
  dropTapisserieView,
  editTapisserie,
  editTapisserieNote,
  afaBrief,
  afaCopy,
  afaDigit,
  afaEven,
  afaFamily,
  afaFirst,
  afaRoute,
  afaHeld,
  afaAway,
  afaHue,
  afaJoin,
  afaCitizen,
  afaLane,
  afaLanes,
  afaLanesCsv,
  afaLength,
  afaLetter,
  afaLower,
  afaMixed,
  afaOpen,
  afaRowsCsv,
  afaShare,
  afaSpace,
  afaStamp,
  afaTail,
  afaUpper,
  afaGuest,
  afaVowel,
  fairKeeper,
  finishFocused,
  tapisserieBars,
  tapisserieCopy,
  tapisserieCounts,
  tapisserieCsv,
  tapisserieDensity,
  tapisserieInner,
  tapisserieOuter,
  tapisserieTimeline,
  tapisserieKeepers,
  idleTapisserie,
  laneSelCount,
  lateTapisserie,
  leadingSel,
  leadingSelHue,
  lowerHourFocused,
  lowerHammerFocused,
  moveTapisserieFocus,
  overdueTapisserie,
  pinTapisserieFocused,
  presentSelLanes,
  raiseHourFocused,
  raiseHammerFocused,
  readHiddenSel,
  readTapisserieCards,
  readTapisserieViews,
  readReviewedSel,
  reminderTapisserieCards,
  restingTapisserie,
  setTapisserieCoffer,
  setTapisserieFilm,
  setTapisserieFocused,
  setTapisseriePin,
  setTapisserieRaised,
  setTapisserieStar,
  sortTapisserieCards,
  starTapisserieFocused,
  suggestHour,
  suggestFinish,
  suggestMode,
  toggleSel,
  toggleSelReview,
  visibleSel,
  visibleSelLanes,
  visibleTapisserieCards,
  type LisReview,
  type LisRow,
  type LisShape,
  type LisValue,
  type Tapisserie,
  type TapisserieDensity,
  type TapisserieSort,
  type TapisserieTray,
  type TapisserieView,
} from "@/lib/crmv4/round367";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["GILT", "IVORY", "GRAPHITE"] as const;
const DROPS = ["5", "10", "20", "40"] as const;
const LOCKS = ["4", "7", "11"] as const;

const PIECE_KEY: Record<string, CrmV4CopyKey> = {
  warp: "tpsWarp",
  weft: "tpsWeft",
  selvage: "tpsSelvage",
  fringe: "tpsFringe",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "tpsAuditSave",
  edit: "tpsAuditEdit",
  note: "tpsAuditNote",
  film: "tpsAuditFilm",
  poise: "tpsAuditPoise",
  free: "tpsAuditFree",
  peg: "tpsAuditPeg",
  return: "tpsAuditReturn",
  coffer: "tpsAuditCoffer",
  open: "tpsAuditOpen",
  tag: "tpsAuditTag",
  lock: "tpsAuditRate",
  drop: "tpsAuditStep",
  lower: "tpsAuditLower",
  star: "tpsAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  hall: "afaLaneHall",
  vacant: "afaLaneVacant",
  hold: "afaLaneHold",
  desk: "afaLaneDesk",
  guest: "afaLaneGuest",
  join: "afaJoin",
  route: "afaRoute",
  brief: "afaBrief",
  long: "afaLong",
  stamp: "afaStampLane",
  vowel: "afaVowel",
  plain: "afaPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "afaChampagne",
  ivory: "afaIvory",
  graphite: "afaGraphite",
};

const SHAPE_KEY: Record<LisShape, CrmV4CopyKey> = {
  all: "afaShapeAll",
  hall: "afaShapeHall",
  vacant: "afaShapeVacant",
  hold: "afaShapeHold",
  guest: "afaShapeGuest",
  join: "afaShapeJoin",
  route: "afaShapeRoute",
  brief: "afaShapeBrief",
  long: "afaShapeLong",
  stamp: "afaShapeStamp",
  vowel: "afaShapeVowel",
  plain: "afaShapePlain",
  open: "afaShapeOpen",
  soon: "afaShapeOpen",
  letter: "afaShapePlain",
  mixed: "afaShapeStamp",
  upper: "afaShapeUpper",
  lower: "afaShapePlain",
  space: "afaShapeSpace",
  even: "afaShapeEven",
  odd: "afaShapeEven",
  tail: "afaShapeStamp",
  first: "afaShapePlain",
  held: "afaShapeLong",
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
  return key ? v4(key) : v4("tpsBlankPiece");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "GILT") return v4("tpsGilt");
  if (film === "IVORY") return v4("tpsIvory");
  if (film === "GRAPHITE") return v4("tpsGraphite");
  return v4("tpsAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("afaBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("afaBlank");
}

export function TapisserieRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Tapisserie[]>([]);
  const [views, setViews] = useState<TapisserieView[]>([]);
  const [density, setDensity] = useState<TapisserieDensity>("airy");
  const [tray, setTray] = useState<TapisserieTray>("board");
  const [query, setQuery] = useState("");
  const [setterFilter, setSetterFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [pieceFilter, setPieceFilter] = useState("all");
  const [dropFilter, setDropFilter] = useState("all");
  const [lockFilter, setLockFilter] = useState("all");
  const [sort, setSort] = useState<TapisserieSort>("piece");
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
  const [station, setStation] = useState("warp");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readTapisserieCards(readJson(TPS_KEY, [])));
    setViews(readTapisserieViews(readJson(TPS_VIEW_KEY, [])));
    setDensity(tapisserieDensity(readJson(TPS_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Tapisserie[]) {
    setCards(next);
    writeJson(TPS_KEY, next);
  }
  function storeViews(next: TapisserieView[]) {
    setViews(next);
    writeJson(TPS_VIEW_KEY, next);
  }
  function storeDensity(next: TapisserieDensity) {
    setDensity(next);
    writeJson(TPS_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortTapisserieCards(visibleTapisserieCards(cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter), sort),
    [cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter, sort],
  );
  const counts = tapisserieCounts(cards, shown, station);
  const bars = tapisserieBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = tapisserieTimeline(cards);
  const reminders = reminderTapisserieCards(cards);
  const poisers = tapisserieKeepers(cards);
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
        download("tapisserie-rules.csv", tapisserieCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveTapisserieFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveTapisserieFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addTapisserie(cards, { title, note, setter: setter, piece, drop: dropNo, film, lock: lockNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-tapisserie" aria-label={v4("tpsTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-tapisserie-mast">
        <p className="c4-tapisserie-seal" data-logo="mono">{v4("tpsLogo")}</p>
        <div>
          <p className="c4-tapisserie-kicker">{v4("tpsSub")}</p>
          <h2 className="c4-title">{v4("tpsTitle")}</h2>
        </div>
        <p className="c4-tapisserie-count">{shown.length}</p>
      </header>
      <p className="c4-tapisserie-links">
        <Link href={crmv4Href(base, "afa")}>{v4("afaTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("tpsCustomers")}</Link>
      </p>
      <p className="c4-tapisserie-hint">{v4("tpsHint")}</p>
      {viewer && <p className="c4-tapisserie-note">{v4("tpsViewer")}</p>}
      <p className="c4-tapisserie-meta">{v4("tpsFair")} {fair || "—"} · {v4("tpsBusy")} {busy || "—"} · {v4("tpsSuggest")} {limbLabel(v4, suggestedLimb)} · {filmLabel(v4, suggestedFilm)} · {suggestedBeat}</p>
      <ol className="c4-tapisserie-index" aria-label={v4("tpsRemind")}>
        <li data-tone="gold">{v4("tpsOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("tpsIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("tpsBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("tpsResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-tapisserie-remind c4-tapisserie-notices" role="status" aria-label={v4("tpsRemind")}>
          {reminders.map((name) => <li key={name}>{v4("tpsOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-tapisserie-chart" aria-label={v4("tpsChart")}>
        {bars.map((bar) => (
          <button key={bar.piece} type="button" className="c4-tapisserie-column" data-on={pieceFilter === bar.piece ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === bar.piece ? "all" : bar.piece)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{limbLabel(v4, bar.piece)}</span>
          </button>
        ))}
      </div>
      <form className="c4-tapisserie-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("tpsEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("tpsEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("tpsNote")}<input className="c4-field" aria-label={v4("tpsNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("tpsSetter")}<input className="c4-field" aria-label={v4("tpsSetter")} aria-required={false} value={setter} maxLength={24} disabled={viewer} onChange={(event) => setSetter(event.target.value)} /></label>
        <label className="c4-lab">{v4("tpsPiece")}<select className="c4-field" aria-label={v4("tpsPiece")} value={piece} disabled={viewer} onChange={(event) => setPiece(event.target.value)}><option value="">{v4("tpsBlankPiece")}</option>{TPS_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("tpsFilm")}<select className="c4-field" aria-label={v4("tpsFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("tpsAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("tpsDrop")}<select className="c4-field" aria-label={v4("tpsDrop")} value={dropNo} disabled={viewer} onChange={(event) => setDropNo(event.target.value)}><option value="">{v4("tpsAll")}</option>{DROPS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("tpsLock")}<select className="c4-field" aria-label={v4("tpsLock")} value={lockNo} disabled={viewer} onChange={(event) => setLockNo(event.target.value)}><option value="">{v4("tpsAll")}</option>{LOCKS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("tpsTag")}<input className="c4-field" aria-label={v4("tpsTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("tpsAdd")}</button>
      </form>
      <div className="c4-tapisserie-tools">
        <input ref={searchRef} className="c4-field c4-tapisserie-search" aria-label={v4("tpsSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("tpsSearch")} />
        {(["board", "peg", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "board" ? "tpsBoard" : item === "peg" ? "tpsPeg" : "tpsCoffer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={pieceFilter === "inner" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "inner" ? "all" : "inner")}>{v4("tpsInner")}</button>
        <button type="button" className="c4-chip" data-on={pieceFilter === "outer" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "outer" ? "all" : "outer")}>{v4("tpsOuter")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "setter" ? "1" : "0"} onClick={() => setSort(sort === "setter" ? "piece" : "setter")}>{sort === "setter" ? v4("tpsSortSetter") : v4("tpsSortLimb")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("tpsClose") : v4("tpsAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("tpsTimeline")}</button>
        <label className="c4-lab">{v4("tpsDesk")}<select className="c4-field" aria-label={v4("tpsDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{TPS_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-tapisserie-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addTapisserieView(views, { id, name: viewName, tray, query, setter: setterFilter, film: filmFilter, piece: pieceFilter, drop: dropFilter, lock: lockFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("tpsViewName")}<input className="c4-field" aria-label={v4("tpsViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("tpsSaveView")}</button>
      </form>
      <ul className="c4-tapisserie-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setSetterFilter(view.setter); setFilmFilter(view.film); setPieceFilter(view.piece); setDropFilter(view.drop); setLockFilter(view.lock); }}>{v4("tpsApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropTapisserieView(views, view.id))}>{v4("tpsDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-tapisserie-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTapisserieRaise(cards, picked))}>{v4("tpsBulkPoise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTapisserieCoffer(cards, picked))}>{v4("tpsBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTapisserieGraphite(cards, picked))}>{v4("tpsBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTapisserieTag(cards, picked))}>{v4("tpsBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("tapisserie-rules.csv", tapisserieCsv(shown, station))}>{v4("tpsCsv")}</button>
        <p className="c4-tapisserie-meta">{v4("tpsKeys")} / n x a j k · {v4("tpsQuiet")} {counts.quiet} · {v4("tpsInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-tapisserie-time" aria-label={v4("tpsTimeline")}>
          {timeline.map((mail) => <li key={mail.drop}><span>{mail.drop}</span> {mail.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("tpsEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-tapisserie-list">
          {shown.map((card) => {
            const late = lateTapisserie(card, station);
            return (
              <li key={card.id} className="c4-tapisserie-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleTapisserie(card) ? "1" : "0"} data-brisk={briskTapisserie(card) ? "1" : "0"} data-overdue={overdueTapisserie(card) ? "1" : "0"} data-resting={restingTapisserie(card) ? "1" : "0"} data-inner={tapisserieInner(card.piece) ? "1" : "0"} data-outer={tapisserieOuter(card.piece) ? "1" : "0"}>
                <label className="c4-tapisserie-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editTapisserie(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("tpsEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("tpsApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editTapisserieNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("tpsNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-tapisserie-meta">{limbLabel(v4, card.piece)} · {filmLabel(v4, card.film)} · {card.drop ?? "—"} · {card.lock} · {card.setter || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "tpsAuditSave")}` : ""}{late ? ` · ${v4("tpsOverdue")}` : ""}</p>
                </div>
                <div className="c4-tapisserie-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("tpsEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTapisserieRaised(cards, card.id, !card.raised))}>{card.raised ? v4("tpsFree") : v4("tpsPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTapisserieFilm(cards, card.id, suggestedFilm))}>{v4("tpsSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTapisseriePin(cards, card.id, !card.pinned))}>{card.pinned ? v4("tpsUnpeg") : v4("tpsPegIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTapisserieCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("tpsUncoffer") : v4("tpsCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTapisserieStar(cards, card.id, !card.starred))}>{card.starred ? v4("tpsUnstar") : v4("tpsStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addTapisserieTag(cards, card.id, "s"))}>{v4("tpsTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("tpsRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("tpsLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHammerFocused(cards, card.id))}>{v4("tpsLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHammerFocused(cards, card.id))}>{v4("tpsLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(finishFocused(cards, card.id))}>{v4("tpsFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTapisserieFocused(cards, card.id))}>{v4("tpsPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinTapisserieFocused(cards, card.id))}>{v4("tpsPeg")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starTapisserieFocused(cards, card.id))}>{v4("tpsStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(tapisserieCopy(card))}>{v4("tpsCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}


type LisUser = { id?: string; name?: string | null; affiliateA?: string | boolean | null };

export function AffiliatePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: LisUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<LisShape>("all");
  const [review, setReview] = useState<LisReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): LisRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { affiliateA: row.affiliateA === true || row.affiliateA === false ? row.affiliateA : textField(row.affiliateA) } satisfies LisValue,
    };
  }).filter((row): row is LisRow => Boolean(row));
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
    const next = readHiddenSel(readJson(AFA_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(AFA_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedSel(readJson(AFA_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(AFA_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleSelLanes(present, hidden, showHidden);
  const shown = visibleSel(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = afaLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = afaLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingSel(rows);
  const leadHue = leadingSelHue(rows);
  const whole = rows.filter((row) => afaLane(row.code)).length;
  const share = afaShare(laneSelCount(rows, "hall"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("affiliates.csv", afaLanesCsv(rows));
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
    writeJson(AFA_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(AFA_REVIEW_KEY, next);
  }

  return (
    <section className="c4-afaplate" aria-label={v4("afaTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-afaplate-mast">
        <p className="c4-afaplate-seal" data-logo="mono">{v4("afaLogo")}</p>
        <div>
          <p className="c4-afaplate-kicker">{v4("afaSub")}</p>
          <h2 className="c4-title">{v4("afaTitle")}</h2>
        </div>
        <p className="c4-afaplate-count">{shown.length}</p>
      </header>
      <p className="c4-afaplate-links">
        <Link href={crmv4Href(base, "tps")}>{v4("tpsTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("afaCustomer")}</Link>
      </p>
      <p className="c4-afaplate-hint">{v4("afaHint")}</p>
      {viewer && <p className="c4-afaplate-note">{v4("afaViewer")}</p>}
      <p className="c4-afaplate-meta">{v4("afaLead")} {laneLabel(v4, lead)} · {v4("afaToneLead")} {hueLabel(v4, leadHue)} · {v4("afaShare")} {share}</p>
      <div className="c4-afaplate-chart" aria-label={v4("afaChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-afaplate-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-afaplate-tools">
        <input ref={searchRef} className="c4-field c4-afaplate-search" aria-label={v4("afaSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("afaSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("afaShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "afaAll" : item === "reviewed" ? "afaReviewed" : "afaFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("afaAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as LisShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleSel(hidden, item))}>{hidden.includes(item) ? v4("afaShow") : v4("afaHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-afaplate-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSelReview(reviewed, picked, true))}>{v4("afaBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSelReview(reviewed, picked, false))}>{v4("afaBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("affiliate-lanes.csv", afaLanesCsv(rows))}>{v4("afaCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("affiliate-rows.csv", afaRowsCsv(shown, reviewed))}>{v4("afaRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("afaLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("afaFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("afaEmpty")}</p>}
      <ul className="c4-afaplate-list">
        {shown.map((row) => {
          const name = afaCopy(row.code);
          const tone = afaHue(row.code);
          return (
            <li key={row.id} className="c4-afaplate-card" data-mail={afaLane(row.code) || "open"} data-hue={tone || "none"} data-home={afaLane(row.code) === "hall" ? "1" : "0"} data-away={afaAway(row.code) ? "1" : "0"} data-guest={afaGuest(row.code) ? "1" : "0"} data-citizen={afaCitizen(row.code) ? "1" : "0"} data-open={afaOpen(row.code) ? "1" : "0"} data-even={afaEven(row.code) ? "1" : "0"} data-digit={afaDigit(row.code) ? "1" : "0"} data-letter={afaLetter(row.code) ? "1" : "0"} data-mixed={afaMixed(row.code) ? "1" : "0"} data-upper={afaUpper(row.code) ? "1" : "0"} data-lower={afaLower(row.code) ? "1" : "0"} data-space={afaSpace(row.code) ? "1" : "0"} data-vowel={afaVowel(row.code) ? "1" : "0"} data-tail={afaTail(row.code) ? "1" : "0"} data-first={afaFirst(row.code) ? "1" : "0"} data-held={afaHeld(row.code) ? "1" : "0"} data-join={afaJoin(row.code) ? "1" : "0"} data-route={afaRoute(row.code) ? "1" : "0"} data-brief={afaBrief(row.code) ? "1" : "0"}>
              <label className="c4-afaplate-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-afaplate-meta">{name || v4("afaOpen")} · {afaStamp(row.code) || "—"} · {afaFamily(row.code) || "—"} · {afaLength(row.code) ?? "—"} · {laneLabel(v4, afaLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-afaplate-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleSelReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("afaReviewed") : v4("afaReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = afaCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("afaCopied") : v4("afaCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("afaCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
