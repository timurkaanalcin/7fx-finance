"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  EXP_KEY,
  EXP_REVIEW_KEY,
  AGL_DENSITY_KEY,
  AGL_KEY,
  AGL_MODES,
  AGL_VIEW_KEY,
  addAnglage,
  addAnglageTag,
  addAnglageView,
  briskAnglage,
  bulkSelReview,
  bulkAnglageCoffer,
  bulkAnglageGraphite,
  bulkAnglageRaise,
  bulkAnglageTag,
  busiestKeeper,
  dropAnglageView,
  editAnglage,
  editAnglageNote,
  selBrief,
  selCopy,
  selDigit,
  selEven,
  selFamily,
  selFirst,
  selRoute,
  selHeld,
  selAway,
  selHue,
  selJoin,
  selCitizen,
  selLane,
  selLanes,
  selLanesCsv,
  selLength,
  selLetter,
  selLower,
  selMixed,
  selOpen,
  selRowsCsv,
  selShare,
  selSpace,
  selStamp,
  selTail,
  selUpper,
  selGuest,
  selVowel,
  fairKeeper,
  finishFocused,
  anglageBars,
  anglageCopy,
  anglageCounts,
  anglageCsv,
  anglageDensity,
  anglageInner,
  anglageOuter,
  anglageTimeline,
  anglageKeepers,
  idleAnglage,
  laneSelCount,
  lateAnglage,
  leadingSel,
  leadingSelHue,
  lowerHourFocused,
  lowerHammerFocused,
  moveAnglageFocus,
  overdueAnglage,
  pinAnglageFocused,
  presentSelLanes,
  raiseHourFocused,
  raiseHammerFocused,
  readHiddenSel,
  readAnglages,
  readAnglageViews,
  readReviewedSel,
  reminderAnglages,
  restingAnglage,
  setAnglageCoffer,
  setAnglageFilm,
  setAnglageFocused,
  setAnglagePin,
  setAnglageRaised,
  setAnglageStar,
  sortAnglages,
  starAnglageFocused,
  suggestHour,
  suggestFinish,
  suggestMode,
  toggleSel,
  toggleSelReview,
  visibleSel,
  visibleSelLanes,
  visibleAnglages,
  type SelReview,
  type SelRow,
  type SelShape,
  type SelValue,
  type Anglage,
  type AnglageDensity,
  type AnglageSort,
  type AnglageTray,
  type AnglageView,
} from "@/lib/crmv4/round356";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["GILT", "IVORY", "GRAPHITE"] as const;
const DROPS = ["5", "10", "20", "40"] as const;
const LOCKS = ["3", "6", "12"] as const;

const PIECE_KEY: Record<string, CrmV4CopyKey> = {
  arris: "aglCloud",
  bevel: "aglWave",
  ogive: "aglSun",
  knife: "aglRing",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "aglAuditSave",
  edit: "aglAuditEdit",
  note: "aglAuditNote",
  film: "aglAuditFilm",
  poise: "aglAuditPoise",
  free: "aglAuditFree",
  peg: "aglAuditPeg",
  return: "aglAuditReturn",
  coffer: "aglAuditCoffer",
  open: "aglAuditOpen",
  tag: "aglAuditTag",
  lock: "aglAuditRate",
  drop: "aglAuditStep",
  lower: "aglAuditLower",
  star: "aglAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  home: "selLaneHome",
  vacant: "selLaneVacant",
  hold: "selLaneHold",
  desk: "selLaneDesk",
  guest: "selLaneGuest",
  join: "selJoin",
  route: "selRoute",
  brief: "selBrief",
  long: "selLong",
  stamp: "selStampLane",
  vowel: "selVowel",
  plain: "selPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "selChampagne",
  ivory: "selIvory",
  graphite: "selGraphite",
};

const SHAPE_KEY: Record<SelShape, CrmV4CopyKey> = {
  all: "selShapeAll",
  home: "selShapeHome",
  vacant: "selShapeVacant",
  hold: "selShapeHold",
  guest: "selShapeGuest",
  join: "selShapeJoin",
  route: "selShapeRoute",
  brief: "selShapeBrief",
  long: "selShapeLong",
  stamp: "selShapeStamp",
  vowel: "selShapeVowel",
  plain: "selShapePlain",
  open: "selShapeOpen",
  soon: "selShapeOpen",
  letter: "selShapePlain",
  mixed: "selShapeStamp",
  upper: "selShapeUpper",
  lower: "selShapePlain",
  space: "selShapeSpace",
  even: "selShapeEven",
  odd: "selShapeEven",
  tail: "selShapeStamp",
  first: "selShapePlain",
  held: "selShapeLong",
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
  return key ? v4(key) : v4("aglBlankPiece");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "GILT") return v4("aglGilt");
  if (film === "IVORY") return v4("aglIvory");
  if (film === "GRAPHITE") return v4("aglGraphite");
  return v4("aglAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("selBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("selBlank");
}

export function AnglageRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Anglage[]>([]);
  const [views, setViews] = useState<AnglageView[]>([]);
  const [density, setDensity] = useState<AnglageDensity>("airy");
  const [tray, setTray] = useState<AnglageTray>("board");
  const [query, setQuery] = useState("");
  const [setterFilter, setSetterFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [pieceFilter, setPieceFilter] = useState("all");
  const [dropFilter, setDropFilter] = useState("all");
  const [lockFilter, setLockFilter] = useState("all");
  const [sort, setSort] = useState<AnglageSort>("piece");
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
  const [station, setStation] = useState("arris");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readAnglages(readJson(AGL_KEY, [])));
    setViews(readAnglageViews(readJson(AGL_VIEW_KEY, [])));
    setDensity(anglageDensity(readJson(AGL_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Anglage[]) {
    setCards(next);
    writeJson(AGL_KEY, next);
  }
  function storeViews(next: AnglageView[]) {
    setViews(next);
    writeJson(AGL_VIEW_KEY, next);
  }
  function storeDensity(next: AnglageDensity) {
    setDensity(next);
    writeJson(AGL_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortAnglages(visibleAnglages(cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter), sort),
    [cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter, sort],
  );
  const counts = anglageCounts(cards, shown, station);
  const bars = anglageBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = anglageTimeline(cards);
  const reminders = reminderAnglages(cards);
  const poisers = anglageKeepers(cards);
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
        download("anglage-rules.csv", anglageCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveAnglageFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveAnglageFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addAnglage(cards, { title, note, setter: setter, piece, drop: dropNo, film, lock: lockNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-anglage" aria-label={v4("aglTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-anglage-mast">
        <p className="c4-anglage-seal" data-logo="mono">{v4("aglLogo")}</p>
        <div>
          <p className="c4-anglage-kicker">{v4("aglSub")}</p>
          <h2 className="c4-title">{v4("aglTitle")}</h2>
        </div>
        <p className="c4-anglage-count">{shown.length}</p>
      </header>
      <p className="c4-anglage-links">
        <Link href={crmv4Href(base, "sel")}>{v4("selTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("aglCustomers")}</Link>
      </p>
      <p className="c4-anglage-hint">{v4("aglHint")}</p>
      {viewer && <p className="c4-anglage-note">{v4("aglViewer")}</p>}
      <p className="c4-anglage-meta">{v4("aglFair")} {fair || "—"} · {v4("aglBusy")} {busy || "—"} · {v4("aglSuggest")} {limbLabel(v4, suggestedLimb)} · {filmLabel(v4, suggestedFilm)} · {suggestedBeat}</p>
      <ol className="c4-anglage-index" aria-label={v4("aglRemind")}>
        <li data-tone="gold">{v4("aglOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("aglIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("aglBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("aglResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-anglage-remind c4-anglage-notices" role="status" aria-label={v4("aglRemind")}>
          {reminders.map((name) => <li key={name}>{v4("aglOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-anglage-chart" aria-label={v4("aglChart")}>
        {bars.map((bar) => (
          <button key={bar.piece} type="button" className="c4-anglage-column" data-on={pieceFilter === bar.piece ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === bar.piece ? "all" : bar.piece)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{limbLabel(v4, bar.piece)}</span>
          </button>
        ))}
      </div>
      <form className="c4-anglage-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("aglEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("aglEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("aglNote")}<input className="c4-field" aria-label={v4("aglNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("aglSetter")}<input className="c4-field" aria-label={v4("aglSetter")} aria-required={false} value={setter} maxLength={24} disabled={viewer} onChange={(event) => setSetter(event.target.value)} /></label>
        <label className="c4-lab">{v4("aglPiece")}<select className="c4-field" aria-label={v4("aglPiece")} value={piece} disabled={viewer} onChange={(event) => setPiece(event.target.value)}><option value="">{v4("aglBlankPiece")}</option>{AGL_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("aglFilm")}<select className="c4-field" aria-label={v4("aglFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("aglAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("aglDrop")}<select className="c4-field" aria-label={v4("aglDrop")} value={dropNo} disabled={viewer} onChange={(event) => setDropNo(event.target.value)}><option value="">{v4("aglAll")}</option>{DROPS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("aglLock")}<select className="c4-field" aria-label={v4("aglLock")} value={lockNo} disabled={viewer} onChange={(event) => setLockNo(event.target.value)}><option value="">{v4("aglAll")}</option>{LOCKS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("aglTag")}<input className="c4-field" aria-label={v4("aglTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("aglAdd")}</button>
      </form>
      <div className="c4-anglage-tools">
        <input ref={searchRef} className="c4-field c4-anglage-search" aria-label={v4("aglSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("aglSearch")} />
        {(["board", "peg", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "board" ? "aglBoard" : item === "peg" ? "aglPeg" : "aglCoffer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={pieceFilter === "inner" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "inner" ? "all" : "inner")}>{v4("aglInner")}</button>
        <button type="button" className="c4-chip" data-on={pieceFilter === "outer" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "outer" ? "all" : "outer")}>{v4("aglOuter")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "setter" ? "1" : "0"} onClick={() => setSort(sort === "setter" ? "piece" : "setter")}>{sort === "setter" ? v4("aglSortSetter") : v4("aglSortLimb")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("aglClose") : v4("aglAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("aglTimeline")}</button>
        <label className="c4-lab">{v4("aglDesk")}<select className="c4-field" aria-label={v4("aglDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{AGL_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-anglage-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addAnglageView(views, { id, name: viewName, tray, query, setter: setterFilter, film: filmFilter, piece: pieceFilter, drop: dropFilter, lock: lockFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("aglViewName")}<input className="c4-field" aria-label={v4("aglViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("aglSaveView")}</button>
      </form>
      <ul className="c4-anglage-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setSetterFilter(view.setter); setFilmFilter(view.film); setPieceFilter(view.piece); setDropFilter(view.drop); setLockFilter(view.lock); }}>{v4("aglApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropAnglageView(views, view.id))}>{v4("aglDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-anglage-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkAnglageRaise(cards, picked))}>{v4("aglBulkPoise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkAnglageCoffer(cards, picked))}>{v4("aglBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkAnglageGraphite(cards, picked))}>{v4("aglBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkAnglageTag(cards, picked))}>{v4("aglBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("anglage-rules.csv", anglageCsv(shown, station))}>{v4("aglCsv")}</button>
        <p className="c4-anglage-meta">{v4("aglKeys")} / n x a j k · {v4("aglQuiet")} {counts.quiet} · {v4("aglInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-anglage-time" aria-label={v4("aglTimeline")}>
          {timeline.map((mail) => <li key={mail.drop}><span>{mail.drop}</span> {mail.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("aglEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-anglage-list">
          {shown.map((card) => {
            const late = lateAnglage(card, station);
            return (
              <li key={card.id} className="c4-anglage-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleAnglage(card) ? "1" : "0"} data-brisk={briskAnglage(card) ? "1" : "0"} data-overdue={overdueAnglage(card) ? "1" : "0"} data-resting={restingAnglage(card) ? "1" : "0"} data-inner={anglageInner(card.piece) ? "1" : "0"} data-outer={anglageOuter(card.piece) ? "1" : "0"}>
                <label className="c4-anglage-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editAnglage(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("aglEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("aglApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editAnglageNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("aglNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-anglage-meta">{limbLabel(v4, card.piece)} · {filmLabel(v4, card.film)} · {card.drop ?? "—"} · {card.lock} · {card.setter || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "aglAuditSave")}` : ""}{late ? ` · ${v4("aglOverdue")}` : ""}</p>
                </div>
                <div className="c4-anglage-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("aglEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setAnglageRaised(cards, card.id, !card.raised))}>{card.raised ? v4("aglFree") : v4("aglPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setAnglageFilm(cards, card.id, suggestedFilm))}>{v4("aglSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setAnglagePin(cards, card.id, !card.pinned))}>{card.pinned ? v4("aglUnpeg") : v4("aglPegIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setAnglageCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("aglUncoffer") : v4("aglCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setAnglageStar(cards, card.id, !card.starred))}>{card.starred ? v4("aglUnstar") : v4("aglStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addAnglageTag(cards, card.id, "a"))}>{v4("aglTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("aglRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("aglLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHammerFocused(cards, card.id))}>{v4("aglLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHammerFocused(cards, card.id))}>{v4("aglLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(finishFocused(cards, card.id))}>{v4("aglFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setAnglageFocused(cards, card.id))}>{v4("aglPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinAnglageFocused(cards, card.id))}>{v4("aglPeg")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starAnglageFocused(cards, card.id))}>{v4("aglStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(anglageCopy(card))}>{v4("aglCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}


type SelUser = { id?: string; name?: string | null; crmReadOnly?: string | boolean | null };

export function ReadOnlyPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: SelUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<SelShape>("all");
  const [review, setReview] = useState<SelReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): SelRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { crmReadOnly: row.crmReadOnly === true || row.crmReadOnly === false ? row.crmReadOnly : textField(row.crmReadOnly) } satisfies SelValue,
    };
  }).filter((row): row is SelRow => Boolean(row));
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
    const next = readHiddenSel(readJson(EXP_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(EXP_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedSel(readJson(EXP_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(EXP_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleSelLanes(present, hidden, showHidden);
  const shown = visibleSel(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = selLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = selLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingSel(rows);
  const leadHue = leadingSelHue(rows);
  const whole = rows.filter((row) => selLane(row.code)).length;
  const share = selShare(laneSelCount(rows, "home"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("seal-plates.csv", selLanesCsv(rows));
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
    writeJson(EXP_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(EXP_REVIEW_KEY, next);
  }

  return (
    <section className="c4-selplate" aria-label={v4("selTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-selplate-mast">
        <p className="c4-selplate-seal" data-logo="mono">{v4("selLogo")}</p>
        <div>
          <p className="c4-selplate-kicker">{v4("selSub")}</p>
          <h2 className="c4-title">{v4("selTitle")}</h2>
        </div>
        <p className="c4-selplate-count">{shown.length}</p>
      </header>
      <p className="c4-selplate-links">
        <Link href={crmv4Href(base, "agl")}>{v4("aglTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("selCustomer")}</Link>
      </p>
      <p className="c4-selplate-hint">{v4("selHint")}</p>
      {viewer && <p className="c4-selplate-note">{v4("selViewer")}</p>}
      <p className="c4-selplate-meta">{v4("selLead")} {laneLabel(v4, lead)} · {v4("selToneLead")} {hueLabel(v4, leadHue)} · {v4("selShare")} {share}</p>
      <div className="c4-selplate-chart" aria-label={v4("selChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-selplate-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-selplate-tools">
        <input ref={searchRef} className="c4-field c4-selplate-search" aria-label={v4("selSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("selSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("selShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "selAll" : item === "reviewed" ? "selReviewed" : "selFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("selAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as SelShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleSel(hidden, item))}>{hidden.includes(item) ? v4("selShow") : v4("selHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-selplate-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSelReview(reviewed, picked, true))}>{v4("selBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSelReview(reviewed, picked, false))}>{v4("selBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("seal-lanes.csv", selLanesCsv(rows))}>{v4("selCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("seal-rows.csv", selRowsCsv(shown, reviewed))}>{v4("selRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("selLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("selFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("selEmpty")}</p>}
      <ul className="c4-selplate-list">
        {shown.map((row) => {
          const name = selCopy(row.code);
          const tone = selHue(row.code);
          return (
            <li key={row.id} className="c4-selplate-card" data-mail={selLane(row.code) || "open"} data-hue={tone || "none"} data-home={selLane(row.code) === "home" ? "1" : "0"} data-away={selAway(row.code) ? "1" : "0"} data-guest={selGuest(row.code) ? "1" : "0"} data-citizen={selCitizen(row.code) ? "1" : "0"} data-open={selOpen(row.code) ? "1" : "0"} data-even={selEven(row.code) ? "1" : "0"} data-digit={selDigit(row.code) ? "1" : "0"} data-letter={selLetter(row.code) ? "1" : "0"} data-mixed={selMixed(row.code) ? "1" : "0"} data-upper={selUpper(row.code) ? "1" : "0"} data-lower={selLower(row.code) ? "1" : "0"} data-space={selSpace(row.code) ? "1" : "0"} data-vowel={selVowel(row.code) ? "1" : "0"} data-tail={selTail(row.code) ? "1" : "0"} data-first={selFirst(row.code) ? "1" : "0"} data-held={selHeld(row.code) ? "1" : "0"} data-join={selJoin(row.code) ? "1" : "0"} data-route={selRoute(row.code) ? "1" : "0"} data-brief={selBrief(row.code) ? "1" : "0"}>
              <label className="c4-selplate-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-selplate-meta">{name || v4("selOpen")} · {selStamp(row.code) || "—"} · {selFamily(row.code) || "—"} · {selLength(row.code) ?? "—"} · {laneLabel(v4, selLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-selplate-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleSelReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("selReviewed") : v4("selReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = selCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("selCopied") : v4("selCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("selCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
