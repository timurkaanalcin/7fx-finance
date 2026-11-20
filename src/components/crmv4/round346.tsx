"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  CTX_KEY,
  CTX_REVIEW_KEY,
  FDX_DENSITY_KEY,
  FDX_KEY,
  FDX_MODES,
  FDX_VIEW_KEY,
  addFoudroyante,
  addFoudroyanteTag,
  addFoudroyanteView,
  briskFoudroyante,
  bulkContactReview,
  bulkFoudroyanteCoffer,
  bulkFoudroyanteGraphite,
  bulkFoudroyanteRaise,
  bulkFoudroyanteTag,
  busiestKeeper,
  dropFoudroyanteView,
  editFoudroyante,
  editFoudroyanteNote,
  contactBrief,
  contactCopy,
  contactDigit,
  contactEven,
  contactFamily,
  contactFirst,
  contactGap,
  contactHeld,
  contactAway,
  contactHue,
  contactJoin,
  contactCitizen,
  contactLane,
  contactLanes,
  contactLanesCsv,
  contactLength,
  contactLetter,
  contactLower,
  contactMixed,
  contactOpen,
  contactRowsCsv,
  contactShare,
  contactSpace,
  contactStamp,
  contactTail,
  contactUpper,
  contactGuest,
  contactVowel,
  fairKeeper,
  finishFocused,
  foudroyanteBars,
  foudroyanteCopy,
  foudroyanteCounts,
  foudroyanteCsv,
  foudroyanteDensity,
  foudroyanteInner,
  foudroyanteOuter,
  foudroyanteTimeline,
  foudroyanteKeepers,
  idleFoudroyante,
  laneContactCount,
  lateFoudroyante,
  leadingContact,
  leadingContactHue,
  lowerHourFocused,
  lowerHammerFocused,
  moveFoudroyanteFocus,
  overdueFoudroyante,
  pinFoudroyanteFocused,
  presentContactLanes,
  raiseHourFocused,
  raiseHammerFocused,
  readHiddenContact,
  readFoudroyantes,
  readFoudroyanteViews,
  readReviewedContact,
  reminderFoudroyantes,
  restingFoudroyante,
  setFoudroyanteCoffer,
  setFoudroyanteFilm,
  setFoudroyanteFocused,
  setFoudroyantePin,
  setFoudroyanteRaised,
  setFoudroyanteStar,
  sortFoudroyantes,
  starFoudroyanteFocused,
  suggestHour,
  suggestFinish,
  suggestMode,
  toggleContact,
  toggleContactReview,
  visibleContact,
  visibleContactLanes,
  visibleFoudroyantes,
  type ContactReview,
  type ContactRow,
  type ContactShape,
  type ContactValue,
  type Foudroyante,
  type FoudroyanteDensity,
  type FoudroyanteSort,
  type FoudroyanteTray,
  type FoudroyanteView,
} from "@/lib/crmv4/round346";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["GILT", "IVORY", "GRAPHITE"] as const;
const DROPS = ["2", "6", "10", "14"] as const;
const LOCKS = ["1", "4", "8"] as const;

const PIECE_KEY: Record<string, CrmV4CopyKey> = {
  whip: "fdxWhip",
  arbor: "fdxArbor",
  pinion: "fdxPinion",
  bridge: "fdxBridge",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "fdxAuditSave",
  edit: "fdxAuditEdit",
  note: "fdxAuditNote",
  film: "fdxAuditFilm",
  poise: "fdxAuditPoise",
  free: "fdxAuditFree",
  peg: "fdxAuditPeg",
  return: "fdxAuditReturn",
  coffer: "fdxAuditCoffer",
  open: "fdxAuditOpen",
  tag: "fdxAuditTag",
  lock: "fdxAuditRate",
  drop: "fdxAuditBeat",
  lower: "fdxAuditLower",
  star: "fdxAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  call: "ctxCall",
  mail: "ctxMail",
  meet: "ctxMeet",
  note: "ctxNote",
  join: "ctxJoin",
  gap: "ctxGap",
  brief: "ctxBrief",
  long: "ctxLong",
  mark: "ctxMark",
  vowel: "ctxVowel",
  plain: "ctxPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "ctxChampagne",
  ivory: "ctxIvory",
  graphite: "ctxGraphite",
};

const SHAPE_KEY: Record<ContactShape, CrmV4CopyKey> = {
  all: "ctxShapeAll",
  call: "ctxShapeCall",
  mail: "ctxShapeMail",
  meet: "ctxShapeMeet",
  note: "ctxShapeNote",
  join: "ctxShapeJoin",
  gap: "ctxShapeGap",
  brief: "ctxShapeBrief",
  long: "ctxShapeLong",
  mark: "ctxShapeMark",
  vowel: "ctxShapeVowel",
  plain: "ctxShapePlain",
  open: "ctxShapeOpen",
  soon: "ctxShapeOpen",
  letter: "ctxShapePlain",
  mixed: "ctxShapeMark",
  upper: "ctxShapeCall",
  lower: "ctxShapePlain",
  space: "ctxShapeGap",
  even: "ctxShapeEven",
  odd: "ctxShapeEven",
  tail: "ctxShapeMark",
  first: "ctxShapePlain",
  held: "ctxShapeLong",
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
  return key ? v4(key) : v4("fdxBlankPiece");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "GILT") return v4("fdxGilt");
  if (film === "IVORY") return v4("fdxIvory");
  if (film === "GRAPHITE") return v4("fdxGraphite");
  return v4("fdxAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("ctxBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("ctxBlank");
}

export function FoudroyanteRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Foudroyante[]>([]);
  const [views, setViews] = useState<FoudroyanteView[]>([]);
  const [density, setDensity] = useState<FoudroyanteDensity>("airy");
  const [tray, setTray] = useState<FoudroyanteTray>("board");
  const [query, setQuery] = useState("");
  const [setterFilter, setSetterFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [pieceFilter, setPieceFilter] = useState("all");
  const [dropFilter, setDropFilter] = useState("all");
  const [lockFilter, setLockFilter] = useState("all");
  const [sort, setSort] = useState<FoudroyanteSort>("piece");
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
  const [station, setStation] = useState("whip");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readFoudroyantes(readJson(FDX_KEY, [])));
    setViews(readFoudroyanteViews(readJson(FDX_VIEW_KEY, [])));
    setDensity(foudroyanteDensity(readJson(FDX_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Foudroyante[]) {
    setCards(next);
    writeJson(FDX_KEY, next);
  }
  function storeViews(next: FoudroyanteView[]) {
    setViews(next);
    writeJson(FDX_VIEW_KEY, next);
  }
  function storeDensity(next: FoudroyanteDensity) {
    setDensity(next);
    writeJson(FDX_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortFoudroyantes(visibleFoudroyantes(cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter), sort),
    [cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter, sort],
  );
  const counts = foudroyanteCounts(cards, shown, station);
  const bars = foudroyanteBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = foudroyanteTimeline(cards);
  const reminders = reminderFoudroyantes(cards);
  const poisers = foudroyanteKeepers(cards);
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
        download("foudroyante-rules.csv", foudroyanteCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveFoudroyanteFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveFoudroyanteFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addFoudroyante(cards, { title, note, setter: setter, piece, drop: dropNo, film, lock: lockNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-foudroyante" aria-label={v4("fdxTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-foudroyante-mast">
        <p className="c4-foudroyante-seal" data-logo="mono">{v4("fdxLogo")}</p>
        <div>
          <p className="c4-foudroyante-kicker">{v4("fdxSub")}</p>
          <h2 className="c4-title">{v4("fdxTitle")}</h2>
        </div>
        <p className="c4-foudroyante-count">{shown.length}</p>
      </header>
      <p className="c4-foudroyante-links">
        <Link href={crmv4Href(base, "ctx")}>{v4("ctxTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("fdxCustomers")}</Link>
      </p>
      <p className="c4-foudroyante-hint">{v4("fdxHint")}</p>
      {viewer && <p className="c4-foudroyante-note">{v4("fdxViewer")}</p>}
      <p className="c4-foudroyante-meta">{v4("fdxFair")} {fair || "—"} · {v4("fdxBusy")} {busy || "—"} · {v4("fdxSuggest")} {limbLabel(v4, suggestedLimb)} · {filmLabel(v4, suggestedFilm)} · {suggestedBeat}</p>
      <ol className="c4-foudroyante-index" aria-label={v4("fdxRemind")}>
        <li data-tone="gold">{v4("fdxOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("fdxIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("fdxBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("fdxResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-foudroyante-remind c4-foudroyante-notices" role="status" aria-label={v4("fdxRemind")}>
          {reminders.map((name) => <li key={name}>{v4("fdxOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-foudroyante-chart" aria-label={v4("fdxChart")}>
        {bars.map((bar) => (
          <button key={bar.piece} type="button" className="c4-foudroyante-column" data-on={pieceFilter === bar.piece ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === bar.piece ? "all" : bar.piece)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{limbLabel(v4, bar.piece)}</span>
          </button>
        ))}
      </div>
      <form className="c4-foudroyante-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("fdxEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("fdxEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("fdxNote")}<input className="c4-field" aria-label={v4("fdxNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("fdxSetter")}<input className="c4-field" aria-label={v4("fdxSetter")} aria-required={false} value={setter} maxLength={24} disabled={viewer} onChange={(event) => setSetter(event.target.value)} /></label>
        <label className="c4-lab">{v4("fdxPiece")}<select className="c4-field" aria-label={v4("fdxPiece")} value={piece} disabled={viewer} onChange={(event) => setPiece(event.target.value)}><option value="">{v4("fdxBlankPiece")}</option>{FDX_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("fdxFilm")}<select className="c4-field" aria-label={v4("fdxFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("fdxAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("fdxDrop")}<select className="c4-field" aria-label={v4("fdxDrop")} value={dropNo} disabled={viewer} onChange={(event) => setDropNo(event.target.value)}><option value="">{v4("fdxAll")}</option>{DROPS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("fdxLock")}<select className="c4-field" aria-label={v4("fdxLock")} value={lockNo} disabled={viewer} onChange={(event) => setLockNo(event.target.value)}><option value="">{v4("fdxAll")}</option>{LOCKS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("fdxTag")}<input className="c4-field" aria-label={v4("fdxTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("fdxAdd")}</button>
      </form>
      <div className="c4-foudroyante-tools">
        <input ref={searchRef} className="c4-field c4-foudroyante-search" aria-label={v4("fdxSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("fdxSearch")} />
        {(["board", "peg", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "board" ? "fdxBoard" : item === "peg" ? "fdxPeg" : "fdxCoffer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={pieceFilter === "inner" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "inner" ? "all" : "inner")}>{v4("fdxInner")}</button>
        <button type="button" className="c4-chip" data-on={pieceFilter === "outer" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "outer" ? "all" : "outer")}>{v4("fdxOuter")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "setter" ? "1" : "0"} onClick={() => setSort(sort === "setter" ? "piece" : "setter")}>{sort === "setter" ? v4("fdxSortSetter") : v4("fdxSortLimb")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("fdxClose") : v4("fdxAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("fdxTimeline")}</button>
        <label className="c4-lab">{v4("fdxDesk")}<select className="c4-field" aria-label={v4("fdxDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{FDX_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-foudroyante-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addFoudroyanteView(views, { id, name: viewName, tray, query, setter: setterFilter, film: filmFilter, piece: pieceFilter, drop: dropFilter, lock: lockFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("fdxViewName")}<input className="c4-field" aria-label={v4("fdxViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("fdxSaveView")}</button>
      </form>
      <ul className="c4-foudroyante-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setSetterFilter(view.setter); setFilmFilter(view.film); setPieceFilter(view.piece); setDropFilter(view.drop); setLockFilter(view.lock); }}>{v4("fdxApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropFoudroyanteView(views, view.id))}>{v4("fdxDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-foudroyante-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkFoudroyanteRaise(cards, picked))}>{v4("fdxBulkPoise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkFoudroyanteCoffer(cards, picked))}>{v4("fdxBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkFoudroyanteGraphite(cards, picked))}>{v4("fdxBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkFoudroyanteTag(cards, picked))}>{v4("fdxBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("foudroyante-rules.csv", foudroyanteCsv(shown, station))}>{v4("fdxCsv")}</button>
        <p className="c4-foudroyante-meta">{v4("fdxKeys")} / n x a j k · {v4("fdxQuiet")} {counts.quiet} · {v4("fdxInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-foudroyante-time" aria-label={v4("fdxTimeline")}>
          {timeline.map((mail) => <li key={mail.drop}><span>{mail.drop}</span> {mail.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("fdxEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-foudroyante-list">
          {shown.map((card) => {
            const late = lateFoudroyante(card, station);
            return (
              <li key={card.id} className="c4-foudroyante-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleFoudroyante(card) ? "1" : "0"} data-brisk={briskFoudroyante(card) ? "1" : "0"} data-overdue={overdueFoudroyante(card) ? "1" : "0"} data-resting={restingFoudroyante(card) ? "1" : "0"} data-inner={foudroyanteInner(card.piece) ? "1" : "0"} data-outer={foudroyanteOuter(card.piece) ? "1" : "0"}>
                <label className="c4-foudroyante-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editFoudroyante(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("fdxEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("fdxApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editFoudroyanteNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("fdxNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-foudroyante-meta">{limbLabel(v4, card.piece)} · {filmLabel(v4, card.film)} · {card.drop ?? "—"} · {card.lock} · {card.setter || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "fdxAuditSave")}` : ""}{late ? ` · ${v4("fdxOverdue")}` : ""}</p>
                </div>
                <div className="c4-foudroyante-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("fdxEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFoudroyanteRaised(cards, card.id, !card.raised))}>{card.raised ? v4("fdxFree") : v4("fdxPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFoudroyanteFilm(cards, card.id, suggestedFilm))}>{v4("fdxSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFoudroyantePin(cards, card.id, !card.pinned))}>{card.pinned ? v4("fdxUnpeg") : v4("fdxPegIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFoudroyanteCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("fdxUncoffer") : v4("fdxCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFoudroyanteStar(cards, card.id, !card.starred))}>{card.starred ? v4("fdxUnstar") : v4("fdxStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addFoudroyanteTag(cards, card.id, "f"))}>{v4("fdxTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("fdxRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("fdxLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHammerFocused(cards, card.id))}>{v4("fdxLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHammerFocused(cards, card.id))}>{v4("fdxLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(finishFocused(cards, card.id))}>{v4("fdxFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFoudroyanteFocused(cards, card.id))}>{v4("fdxPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinFoudroyanteFocused(cards, card.id))}>{v4("fdxPeg")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starFoudroyanteFocused(cards, card.id))}>{v4("fdxStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(foudroyanteCopy(card))}>{v4("fdxCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type ContactUser = { id?: string; name?: string | null; lastContactAt?: string | null };

export function ContactPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: ContactUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<ContactShape>("all");
  const [review, setReview] = useState<ContactReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): ContactRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { lastContactAt: textField(row.lastContactAt) } satisfies ContactValue,
    };
  }).filter((row): row is ContactRow => Boolean(row));
  const present = presentContactLanes(rows);
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
    const next = readHiddenContact(readJson(CTX_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(CTX_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedContact(readJson(CTX_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(CTX_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleContactLanes(present, hidden, showHidden);
  const shown = visibleContact(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = contactLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = contactLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingContact(rows);
  const leadHue = leadingContactHue(rows);
  const whole = rows.filter((row) => contactLane(row.code)).length;
  const share = contactShare(laneContactCount(rows, "call"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("contact-lanes.csv", contactLanesCsv(rows));
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
    writeJson(CTX_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(CTX_REVIEW_KEY, next);
  }

  return (
    <section className="c4-ctxplate" aria-label={v4("ctxTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-ctxplate-mast">
        <p className="c4-ctxplate-seal" data-logo="mono">{v4("ctxLogo")}</p>
        <div>
          <p className="c4-ctxplate-kicker">{v4("ctxSub")}</p>
          <h2 className="c4-title">{v4("ctxTitle")}</h2>
        </div>
        <p className="c4-ctxplate-count">{shown.length}</p>
      </header>
      <p className="c4-ctxplate-links">
        <Link href={crmv4Href(base, "fdx")}>{v4("fdxTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("ctxCustomer")}</Link>
      </p>
      <p className="c4-ctxplate-hint">{v4("ctxHint")}</p>
      {viewer && <p className="c4-ctxplate-note">{v4("ctxViewer")}</p>}
      <p className="c4-ctxplate-meta">{v4("ctxLead")} {laneLabel(v4, lead)} · {v4("ctxToneLead")} {hueLabel(v4, leadHue)} · {v4("ctxShare")} {share}</p>
      <div className="c4-ctxplate-chart" aria-label={v4("ctxChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-ctxplate-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-ctxplate-tools">
        <input ref={searchRef} className="c4-field c4-ctxplate-search" aria-label={v4("ctxSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("ctxSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("ctxShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "ctxAll" : item === "reviewed" ? "ctxReviewed" : "ctxFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("ctxAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as ContactShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleContact(hidden, item))}>{hidden.includes(item) ? v4("ctxShow") : v4("ctxHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-ctxplate-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkContactReview(reviewed, picked, true))}>{v4("ctxBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkContactReview(reviewed, picked, false))}>{v4("ctxBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("contact-lanes.csv", contactLanesCsv(rows))}>{v4("ctxCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("contact-rows.csv", contactRowsCsv(shown, reviewed))}>{v4("ctxRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("ctxLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("ctxFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("ctxEmpty")}</p>}
      <ul className="c4-ctxplate-list">
        {shown.map((row) => {
          const name = contactCopy(row.code);
          const tone = contactHue(row.code);
          return (
            <li key={row.id} className="c4-ctxplate-card" data-mail={contactLane(row.code) || "open"} data-hue={tone || "none"} data-lang-mark={contactLane(row.code) === "call" ? "1" : "0"} data-away={contactAway(row.code) ? "1" : "0"} data-guest={contactGuest(row.code) ? "1" : "0"} data-citizen={contactCitizen(row.code) ? "1" : "0"} data-open={contactOpen(row.code) ? "1" : "0"} data-even={contactEven(row.code) ? "1" : "0"} data-digit={contactDigit(row.code) ? "1" : "0"} data-letter={contactLetter(row.code) ? "1" : "0"} data-mixed={contactMixed(row.code) ? "1" : "0"} data-upper={contactUpper(row.code) ? "1" : "0"} data-lower={contactLower(row.code) ? "1" : "0"} data-space={contactSpace(row.code) ? "1" : "0"} data-vowel={contactVowel(row.code) ? "1" : "0"} data-tail={contactTail(row.code) ? "1" : "0"} data-first={contactFirst(row.code) ? "1" : "0"} data-held={contactHeld(row.code) ? "1" : "0"} data-join={contactJoin(row.code) ? "1" : "0"} data-gap={contactGap(row.code) ? "1" : "0"} data-brief={contactBrief(row.code) ? "1" : "0"}>
              <label className="c4-ctxplate-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-ctxplate-meta">{name || v4("ctxOpen")} · {contactStamp(row.code) || "—"} · {contactFamily(row.code) || "—"} · {contactLength(row.code) ?? "—"} · {laneLabel(v4, contactLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-ctxplate-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleContactReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("ctxReviewed") : v4("ctxReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = contactCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("ctxCopied") : v4("ctxCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("ctxCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
