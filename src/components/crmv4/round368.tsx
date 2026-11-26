"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  AFB_KEY,
  AFB_REVIEW_KEY,
  RPS_DENSITY_KEY,
  RPS_KEY,
  RPS_MODES,
  RPS_VIEW_KEY,
  addRepousse,
  addRepousseTag,
  addRepousseView,
  briskRepousse,
  bulkSelReview,
  bulkRepousseCoffer,
  bulkRepousseGraphite,
  bulkRepousseRaise,
  bulkRepousseTag,
  busiestKeeper,
  dropRepousseView,
  editRepousse,
  editRepousseNote,
  afbBrief,
  afbCopy,
  afbDigit,
  afbEven,
  afbFamily,
  afbFirst,
  afbRoute,
  afbHeld,
  afbAway,
  afbHue,
  afbJoin,
  afbCitizen,
  afbLane,
  afbLanes,
  afbLanesCsv,
  afbLength,
  afbLetter,
  afbLower,
  afbMixed,
  afbOpen,
  afbRowsCsv,
  afbShare,
  afbSpace,
  afbStamp,
  afbTail,
  afbUpper,
  afbGuest,
  afbVowel,
  fairKeeper,
  finishFocused,
  repousseBars,
  repousseCopy,
  repousseCounts,
  repousseCsv,
  repousseDensity,
  repousseInner,
  repousseOuter,
  repousseTimeline,
  repousseKeepers,
  idleRepousse,
  laneSelCount,
  lateRepousse,
  leadingSel,
  leadingSelHue,
  lowerHourFocused,
  lowerHammerFocused,
  moveRepousseFocus,
  overdueRepousse,
  pinRepousseFocused,
  presentSelLanes,
  raiseHourFocused,
  raiseHammerFocused,
  readHiddenSel,
  readRepousseCards,
  readRepousseViews,
  readReviewedSel,
  reminderRepousseCards,
  restingRepousse,
  setRepousseCoffer,
  setRepousseFilm,
  setRepousseFocused,
  setRepoussePin,
  setRepousseRaised,
  setRepousseStar,
  sortRepousseCards,
  starRepousseFocused,
  suggestHour,
  suggestFinish,
  suggestMode,
  toggleSel,
  toggleSelReview,
  visibleSel,
  visibleSelLanes,
  visibleRepousseCards,
  type LisReview,
  type LisRow,
  type LisShape,
  type LisValue,
  type Repousse,
  type RepousseDensity,
  type RepousseSort,
  type RepousseTray,
  type RepousseView,
} from "@/lib/crmv4/round368";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["GILT", "IVORY", "GRAPHITE"] as const;
const DROPS = ["6", "12", "18", "36"] as const;
const LOCKS = ["3", "6", "9"] as const;

const PIECE_KEY: Record<string, CrmV4CopyKey> = {
  boss: "rpsBoss",
  lobe: "rpsLobe",
  scroll: "rpsScroll",
  rim: "rpsRim",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "rpsAuditSave",
  edit: "rpsAuditEdit",
  note: "rpsAuditNote",
  film: "rpsAuditFilm",
  poise: "rpsAuditPoise",
  free: "rpsAuditFree",
  peg: "rpsAuditPeg",
  return: "rpsAuditReturn",
  coffer: "rpsAuditCoffer",
  open: "rpsAuditOpen",
  tag: "rpsAuditTag",
  lock: "rpsAuditRate",
  drop: "rpsAuditStep",
  lower: "rpsAuditLower",
  star: "rpsAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  hall: "afbLaneHall",
  vacant: "afbLaneVacant",
  hold: "afbLaneHold",
  desk: "afbLaneDesk",
  guest: "afbLaneGuest",
  join: "afbJoin",
  route: "afbRoute",
  brief: "afbBrief",
  long: "afbLong",
  stamp: "afbStampLane",
  vowel: "afbVowel",
  plain: "afbPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "afbChampagne",
  ivory: "afbIvory",
  graphite: "afbGraphite",
};

const SHAPE_KEY: Record<LisShape, CrmV4CopyKey> = {
  all: "afbShapeAll",
  hall: "afbShapeHall",
  vacant: "afbShapeVacant",
  hold: "afbShapeHold",
  guest: "afbShapeGuest",
  join: "afbShapeJoin",
  route: "afbShapeRoute",
  brief: "afbShapeBrief",
  long: "afbShapeLong",
  stamp: "afbShapeStamp",
  vowel: "afbShapeVowel",
  plain: "afbShapePlain",
  open: "afbShapeOpen",
  soon: "afbShapeOpen",
  letter: "afbShapePlain",
  mixed: "afbShapeStamp",
  upper: "afbShapeUpper",
  lower: "afbShapePlain",
  space: "afbShapeSpace",
  even: "afbShapeEven",
  odd: "afbShapeEven",
  tail: "afbShapeStamp",
  first: "afbShapePlain",
  held: "afbShapeLong",
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
  return key ? v4(key) : v4("rpsBlankPiece");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "GILT") return v4("rpsGilt");
  if (film === "IVORY") return v4("rpsIvory");
  if (film === "GRAPHITE") return v4("rpsGraphite");
  return v4("rpsAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("afbBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("afbBlank");
}

export function RepousseRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Repousse[]>([]);
  const [views, setViews] = useState<RepousseView[]>([]);
  const [density, setDensity] = useState<RepousseDensity>("airy");
  const [tray, setTray] = useState<RepousseTray>("board");
  const [query, setQuery] = useState("");
  const [setterFilter, setSetterFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [pieceFilter, setPieceFilter] = useState("all");
  const [dropFilter, setDropFilter] = useState("all");
  const [lockFilter, setLockFilter] = useState("all");
  const [sort, setSort] = useState<RepousseSort>("piece");
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
  const [station, setStation] = useState("boss");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readRepousseCards(readJson(RPS_KEY, [])));
    setViews(readRepousseViews(readJson(RPS_VIEW_KEY, [])));
    setDensity(repousseDensity(readJson(RPS_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Repousse[]) {
    setCards(next);
    writeJson(RPS_KEY, next);
  }
  function storeViews(next: RepousseView[]) {
    setViews(next);
    writeJson(RPS_VIEW_KEY, next);
  }
  function storeDensity(next: RepousseDensity) {
    setDensity(next);
    writeJson(RPS_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortRepousseCards(visibleRepousseCards(cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter), sort),
    [cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter, sort],
  );
  const counts = repousseCounts(cards, shown, station);
  const bars = repousseBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = repousseTimeline(cards);
  const reminders = reminderRepousseCards(cards);
  const poisers = repousseKeepers(cards);
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
        download("repousse-rules.csv", repousseCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveRepousseFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveRepousseFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addRepousse(cards, { title, note, setter: setter, piece, drop: dropNo, film, lock: lockNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-repousse" aria-label={v4("rpsTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-repousse-mast">
        <p className="c4-repousse-seal" data-logo="mono">{v4("rpsLogo")}</p>
        <div>
          <p className="c4-repousse-kicker">{v4("rpsSub")}</p>
          <h2 className="c4-title">{v4("rpsTitle")}</h2>
        </div>
        <p className="c4-repousse-count">{shown.length}</p>
      </header>
      <p className="c4-repousse-links">
        <Link href={crmv4Href(base, "afb")}>{v4("afbTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("rpsCustomers")}</Link>
      </p>
      <p className="c4-repousse-hint">{v4("rpsHint")}</p>
      {viewer && <p className="c4-repousse-note">{v4("rpsViewer")}</p>}
      <p className="c4-repousse-meta">{v4("rpsFair")} {fair || "—"} · {v4("rpsBusy")} {busy || "—"} · {v4("rpsSuggest")} {limbLabel(v4, suggestedLimb)} · {filmLabel(v4, suggestedFilm)} · {suggestedBeat}</p>
      <ol className="c4-repousse-index" aria-label={v4("rpsRemind")}>
        <li data-tone="gold">{v4("rpsOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("rpsIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("rpsBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("rpsResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-repousse-remind c4-repousse-notices" role="status" aria-label={v4("rpsRemind")}>
          {reminders.map((name) => <li key={name}>{v4("rpsOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-repousse-chart" aria-label={v4("rpsChart")}>
        {bars.map((bar) => (
          <button key={bar.piece} type="button" className="c4-repousse-column" data-on={pieceFilter === bar.piece ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === bar.piece ? "all" : bar.piece)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{limbLabel(v4, bar.piece)}</span>
          </button>
        ))}
      </div>
      <form className="c4-repousse-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("rpsEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("rpsEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("rpsNote")}<input className="c4-field" aria-label={v4("rpsNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("rpsSetter")}<input className="c4-field" aria-label={v4("rpsSetter")} aria-required={false} value={setter} maxLength={24} disabled={viewer} onChange={(event) => setSetter(event.target.value)} /></label>
        <label className="c4-lab">{v4("rpsPiece")}<select className="c4-field" aria-label={v4("rpsPiece")} value={piece} disabled={viewer} onChange={(event) => setPiece(event.target.value)}><option value="">{v4("rpsBlankPiece")}</option>{RPS_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("rpsFilm")}<select className="c4-field" aria-label={v4("rpsFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("rpsAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("rpsDrop")}<select className="c4-field" aria-label={v4("rpsDrop")} value={dropNo} disabled={viewer} onChange={(event) => setDropNo(event.target.value)}><option value="">{v4("rpsAll")}</option>{DROPS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("rpsLock")}<select className="c4-field" aria-label={v4("rpsLock")} value={lockNo} disabled={viewer} onChange={(event) => setLockNo(event.target.value)}><option value="">{v4("rpsAll")}</option>{LOCKS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("rpsTag")}<input className="c4-field" aria-label={v4("rpsTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("rpsAdd")}</button>
      </form>
      <div className="c4-repousse-tools">
        <input ref={searchRef} className="c4-field c4-repousse-search" aria-label={v4("rpsSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("rpsSearch")} />
        {(["board", "peg", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "board" ? "rpsBoard" : item === "peg" ? "rpsPeg" : "rpsCoffer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={pieceFilter === "inner" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "inner" ? "all" : "inner")}>{v4("rpsInner")}</button>
        <button type="button" className="c4-chip" data-on={pieceFilter === "outer" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "outer" ? "all" : "outer")}>{v4("rpsOuter")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "setter" ? "1" : "0"} onClick={() => setSort(sort === "setter" ? "piece" : "setter")}>{sort === "setter" ? v4("rpsSortSetter") : v4("rpsSortLimb")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("rpsClose") : v4("rpsAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("rpsTimeline")}</button>
        <label className="c4-lab">{v4("rpsDesk")}<select className="c4-field" aria-label={v4("rpsDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{RPS_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-repousse-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addRepousseView(views, { id, name: viewName, tray, query, setter: setterFilter, film: filmFilter, piece: pieceFilter, drop: dropFilter, lock: lockFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("rpsViewName")}<input className="c4-field" aria-label={v4("rpsViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("rpsSaveView")}</button>
      </form>
      <ul className="c4-repousse-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setSetterFilter(view.setter); setFilmFilter(view.film); setPieceFilter(view.piece); setDropFilter(view.drop); setLockFilter(view.lock); }}>{v4("rpsApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropRepousseView(views, view.id))}>{v4("rpsDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-repousse-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRepousseRaise(cards, picked))}>{v4("rpsBulkPoise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRepousseCoffer(cards, picked))}>{v4("rpsBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRepousseGraphite(cards, picked))}>{v4("rpsBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRepousseTag(cards, picked))}>{v4("rpsBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("repousse-rules.csv", repousseCsv(shown, station))}>{v4("rpsCsv")}</button>
        <p className="c4-repousse-meta">{v4("rpsKeys")} / n x a j k · {v4("rpsQuiet")} {counts.quiet} · {v4("rpsInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-repousse-time" aria-label={v4("rpsTimeline")}>
          {timeline.map((mail) => <li key={mail.drop}><span>{mail.drop}</span> {mail.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("rpsEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-repousse-list">
          {shown.map((card) => {
            const late = lateRepousse(card, station);
            return (
              <li key={card.id} className="c4-repousse-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleRepousse(card) ? "1" : "0"} data-brisk={briskRepousse(card) ? "1" : "0"} data-overdue={overdueRepousse(card) ? "1" : "0"} data-resting={restingRepousse(card) ? "1" : "0"} data-inner={repousseInner(card.piece) ? "1" : "0"} data-outer={repousseOuter(card.piece) ? "1" : "0"}>
                <label className="c4-repousse-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editRepousse(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("rpsEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("rpsApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editRepousseNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("rpsNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-repousse-meta">{limbLabel(v4, card.piece)} · {filmLabel(v4, card.film)} · {card.drop ?? "—"} · {card.lock} · {card.setter || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "rpsAuditSave")}` : ""}{late ? ` · ${v4("rpsOverdue")}` : ""}</p>
                </div>
                <div className="c4-repousse-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("rpsEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRepousseRaised(cards, card.id, !card.raised))}>{card.raised ? v4("rpsFree") : v4("rpsPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRepousseFilm(cards, card.id, suggestedFilm))}>{v4("rpsSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRepoussePin(cards, card.id, !card.pinned))}>{card.pinned ? v4("rpsUnpeg") : v4("rpsPegIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRepousseCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("rpsUncoffer") : v4("rpsCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRepousseStar(cards, card.id, !card.starred))}>{card.starred ? v4("rpsUnstar") : v4("rpsStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addRepousseTag(cards, card.id, "r"))}>{v4("rpsTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("rpsRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("rpsLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHammerFocused(cards, card.id))}>{v4("rpsLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHammerFocused(cards, card.id))}>{v4("rpsLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(finishFocused(cards, card.id))}>{v4("rpsFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRepousseFocused(cards, card.id))}>{v4("rpsPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinRepousseFocused(cards, card.id))}>{v4("rpsPeg")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starRepousseFocused(cards, card.id))}>{v4("rpsStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(repousseCopy(card))}>{v4("rpsCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}


type LisUser = { id?: string; name?: string | null; affiliateB?: string | boolean | null };

export function AffiliateBPlates({ base, v4 }: { base: string; v4: V4 }) {
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
      code: { affiliateB: row.affiliateB === true || row.affiliateB === false ? row.affiliateB : textField(row.affiliateB) } satisfies LisValue,
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
    const next = readHiddenSel(readJson(AFB_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(AFB_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedSel(readJson(AFB_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(AFB_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleSelLanes(present, hidden, showHidden);
  const shown = visibleSel(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = afbLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = afbLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingSel(rows);
  const leadHue = leadingSelHue(rows);
  const whole = rows.filter((row) => afbLane(row.code)).length;
  const share = afbShare(laneSelCount(rows, "hall"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("affiliates.csv", afbLanesCsv(rows));
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
    writeJson(AFB_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(AFB_REVIEW_KEY, next);
  }

  return (
    <section className="c4-afbplate" aria-label={v4("afbTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-afbplate-mast">
        <p className="c4-afbplate-seal" data-logo="mono">{v4("afbLogo")}</p>
        <div>
          <p className="c4-afbplate-kicker">{v4("afbSub")}</p>
          <h2 className="c4-title">{v4("afbTitle")}</h2>
        </div>
        <p className="c4-afbplate-count">{shown.length}</p>
      </header>
      <p className="c4-afbplate-links">
        <Link href={crmv4Href(base, "rps")}>{v4("rpsTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("afbCustomer")}</Link>
      </p>
      <p className="c4-afbplate-hint">{v4("afbHint")}</p>
      {viewer && <p className="c4-afbplate-note">{v4("afbViewer")}</p>}
      <p className="c4-afbplate-meta">{v4("afbLead")} {laneLabel(v4, lead)} · {v4("afbToneLead")} {hueLabel(v4, leadHue)} · {v4("afbShare")} {share}</p>
      <div className="c4-afbplate-chart" aria-label={v4("afbChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-afbplate-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-afbplate-tools">
        <input ref={searchRef} className="c4-field c4-afbplate-search" aria-label={v4("afbSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("afbSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("afbShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "afbAll" : item === "reviewed" ? "afbReviewed" : "afbFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("afbAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as LisShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleSel(hidden, item))}>{hidden.includes(item) ? v4("afbShow") : v4("afbHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-afbplate-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSelReview(reviewed, picked, true))}>{v4("afbBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSelReview(reviewed, picked, false))}>{v4("afbBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("affiliate-lanes.csv", afbLanesCsv(rows))}>{v4("afbCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("affiliate-rows.csv", afbRowsCsv(shown, reviewed))}>{v4("afbRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("afbLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("afbFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("afbEmpty")}</p>}
      <ul className="c4-afbplate-list">
        {shown.map((row) => {
          const name = afbCopy(row.code);
          const tone = afbHue(row.code);
          return (
            <li key={row.id} className="c4-afbplate-card" data-mail={afbLane(row.code) || "open"} data-hue={tone || "none"} data-home={afbLane(row.code) === "hall" ? "1" : "0"} data-away={afbAway(row.code) ? "1" : "0"} data-guest={afbGuest(row.code) ? "1" : "0"} data-citizen={afbCitizen(row.code) ? "1" : "0"} data-open={afbOpen(row.code) ? "1" : "0"} data-even={afbEven(row.code) ? "1" : "0"} data-digit={afbDigit(row.code) ? "1" : "0"} data-letter={afbLetter(row.code) ? "1" : "0"} data-mixed={afbMixed(row.code) ? "1" : "0"} data-upper={afbUpper(row.code) ? "1" : "0"} data-lower={afbLower(row.code) ? "1" : "0"} data-space={afbSpace(row.code) ? "1" : "0"} data-vowel={afbVowel(row.code) ? "1" : "0"} data-tail={afbTail(row.code) ? "1" : "0"} data-first={afbFirst(row.code) ? "1" : "0"} data-held={afbHeld(row.code) ? "1" : "0"} data-join={afbJoin(row.code) ? "1" : "0"} data-route={afbRoute(row.code) ? "1" : "0"} data-brief={afbBrief(row.code) ? "1" : "0"}>
              <label className="c4-afbplate-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-afbplate-meta">{name || v4("afbOpen")} · {afbStamp(row.code) || "—"} · {afbFamily(row.code) || "—"} · {afbLength(row.code) ?? "—"} · {laneLabel(v4, afbLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-afbplate-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleSelReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("afbReviewed") : v4("afbReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = afbCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("afbCopied") : v4("afbCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("afbCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
