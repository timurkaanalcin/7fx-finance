"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  DTP_KEY,
  DTP_REVIEW_KEY,
  CZN_DENSITY_KEY,
  CZN_KEY,
  CZN_MODES,
  CZN_VIEW_KEY,
  addCloison,
  addCloisonTag,
  addCloisonView,
  briskCloison,
  bulkSelReview,
  bulkCloisonCoffer,
  bulkCloisonGraphite,
  bulkCloisonRaise,
  bulkCloisonTag,
  busiestKeeper,
  dropCloisonView,
  editCloison,
  editCloisonNote,
  dtpBrief,
  dtpCopy,
  dtpDigit,
  dtpEven,
  dtpFamily,
  dtpFirst,
  dtpRoute,
  dtpHeld,
  dtpAway,
  dtpHue,
  dtpJoin,
  dtpCitizen,
  dtpLane,
  dtpLanes,
  dtpLanesCsv,
  dtpLength,
  dtpLetter,
  dtpLower,
  dtpMixed,
  dtpOpen,
  dtpRowsCsv,
  dtpShare,
  dtpSpace,
  dtpStamp,
  dtpTail,
  dtpUpper,
  dtpGuest,
  dtpVowel,
  fairKeeper,
  finishFocused,
  cloisonBars,
  cloisonCopy,
  cloisonCounts,
  cloisonCsv,
  cloisonDensity,
  cloisonInner,
  cloisonOuter,
  cloisonTimeline,
  cloisonKeepers,
  idleCloison,
  laneSelCount,
  lateCloison,
  leadingSel,
  leadingSelHue,
  lowerHourFocused,
  lowerHammerFocused,
  moveCloisonFocus,
  overdueCloison,
  pinCloisonFocused,
  presentSelLanes,
  raiseHourFocused,
  raiseHammerFocused,
  readHiddenSel,
  readCloisonCards,
  readCloisonViews,
  readReviewedSel,
  reminderCloisonCards,
  restingCloison,
  setCloisonCoffer,
  setCloisonFilm,
  setCloisonFocused,
  setCloisonPin,
  setCloisonRaised,
  setCloisonStar,
  sortCloisonCards,
  starCloisonFocused,
  suggestHour,
  suggestFinish,
  suggestMode,
  toggleSel,
  toggleSelReview,
  visibleSel,
  visibleSelLanes,
  visibleCloisonCards,
  type DtpReview,
  type DtpRow,
  type DtpShape,
  type DtpValue,
  type Cloison,
  type CloisonDensity,
  type CloisonSort,
  type CloisonTray,
  type CloisonView,
} from "@/lib/crmv4/round370";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["FLUX", "IVORY", "GRAPHITE"] as const;
const DROPS = ["3", "6", "12", "24"] as const;
const LOCKS = ["3", "6", "9"] as const;

const PIECE_KEY: Record<string, CrmV4CopyKey> = {
  floor: "cznFloor",
  wall: "cznWall",
  wire: "cznWire",
  rim: "cznRim",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "cznAuditSave",
  edit: "cznAuditEdit",
  note: "cznAuditNote",
  film: "cznAuditFilm",
  poise: "cznAuditPoise",
  free: "cznAuditFree",
  peg: "cznAuditPeg",
  return: "cznAuditReturn",
  coffer: "cznAuditCoffer",
  open: "cznAuditOpen",
  tag: "cznAuditTag",
  lock: "cznAuditRate",
  drop: "cznAuditStep",
  lower: "cznAuditLower",
  star: "cznAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  hall: "dtpLaneHall",
  vacant: "dtpLaneVacant",
  hold: "dtpLaneHold",
  desk: "dtpLaneDesk",
  guest: "dtpLaneGuest",
  join: "dtpJoin",
  route: "dtpRoute",
  brief: "dtpBrief",
  long: "dtpLong",
  stamp: "dtpStampLane",
  vowel: "dtpVowel",
  plain: "dtpPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "dtpChampagne",
  ivory: "dtpIvory",
  graphite: "dtpGraphite",
};

const SHAPE_KEY: Record<DtpShape, CrmV4CopyKey> = {
  all: "dtpShapeAll",
  hall: "dtpShapeHall",
  vacant: "dtpShapeVacant",
  hold: "dtpShapeHold",
  guest: "dtpShapeGuest",
  join: "dtpShapeJoin",
  route: "dtpShapeRoute",
  brief: "dtpShapeBrief",
  long: "dtpShapeLong",
  stamp: "dtpShapeStamp",
  vowel: "dtpShapeVowel",
  plain: "dtpShapePlain",
  open: "dtpShapeOpen",
  soon: "dtpShapeOpen",
  letter: "dtpShapePlain",
  mixed: "dtpShapeStamp",
  upper: "dtpShapeUpper",
  lower: "dtpShapePlain",
  space: "dtpShapeSpace",
  even: "dtpShapeEven",
  odd: "dtpShapeEven",
  tail: "dtpShapeStamp",
  first: "dtpShapePlain",
  held: "dtpShapeLong",
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
  return key ? v4(key) : v4("cznBlankPiece");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "FLUX") return v4("cznFlux");
  if (film === "IVORY") return v4("cznIvory");
  if (film === "GRAPHITE") return v4("cznGraphite");
  return v4("cznAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("dtpBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("dtpBlank");
}

export function CloisonRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Cloison[]>([]);
  const [views, setViews] = useState<CloisonView[]>([]);
  const [density, setDensity] = useState<CloisonDensity>("airy");
  const [tray, setTray] = useState<CloisonTray>("board");
  const [query, setQuery] = useState("");
  const [setterFilter, setSetterFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [pieceFilter, setPieceFilter] = useState("all");
  const [dropFilter, setDropFilter] = useState("all");
  const [lockFilter, setLockFilter] = useState("all");
  const [sort, setSort] = useState<CloisonSort>("piece");
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
  const [station, setStation] = useState("floor");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readCloisonCards(readJson(CZN_KEY, [])));
    setViews(readCloisonViews(readJson(CZN_VIEW_KEY, [])));
    setDensity(cloisonDensity(readJson(CZN_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Cloison[]) {
    setCards(next);
    writeJson(CZN_KEY, next);
  }
  function storeViews(next: CloisonView[]) {
    setViews(next);
    writeJson(CZN_VIEW_KEY, next);
  }
  function storeDensity(next: CloisonDensity) {
    setDensity(next);
    writeJson(CZN_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortCloisonCards(visibleCloisonCards(cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter), sort),
    [cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter, sort],
  );
  const counts = cloisonCounts(cards, shown, station);
  const bars = cloisonBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = cloisonTimeline(cards);
  const reminders = reminderCloisonCards(cards);
  const poisers = cloisonKeepers(cards);
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
      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        titleRef.current?.focus();
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("cloison-rules.csv", cloisonCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveCloisonFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveCloisonFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addCloison(cards, { title, note, setter: setter, piece, drop: dropNo, film, lock: lockNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-cloison" aria-label={v4("cznTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-cloison-mast">
        <p className="c4-cloison-seal" data-logo="mono">{v4("cznLogo")}</p>
        <div>
          <p className="c4-cloison-kicker">{v4("cznSub")}</p>
          <h2 className="c4-title">{v4("cznTitle")}</h2>
        </div>
        <p className="c4-cloison-count">{shown.length}</p>
      </header>
      <p className="c4-cloison-links">
        <Link href={crmv4Href(base, "dtp")}>{v4("dtpTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("cznCustomers")}</Link>
      </p>
      <p className="c4-cloison-hint">{v4("cznHint")}</p>
      {viewer && <p className="c4-cloison-note">{v4("cznViewer")}</p>}
      <p className="c4-cloison-meta">{v4("cznFair")} {fair || "—"} · {v4("cznBusy")} {busy || "—"} · {v4("cznSuggest")} {limbLabel(v4, suggestedLimb)} · {filmLabel(v4, suggestedFilm)} · {suggestedBeat}</p>
      <ol className="c4-cloison-index" aria-label={v4("cznRemind")}>
        <li data-tone="gold">{v4("cznOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("cznIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("cznBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("cznResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-cloison-remind c4-cloison-notices" role="status" aria-label={v4("cznRemind")}>
          {reminders.map((name) => <li key={name}>{v4("cznOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-cloison-chart" aria-label={v4("cznChart")}>
        {bars.map((bar) => (
          <button key={bar.piece} type="button" className="c4-cloison-column" data-on={pieceFilter === bar.piece ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === bar.piece ? "all" : bar.piece)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{limbLabel(v4, bar.piece)}</span>
          </button>
        ))}
      </div>
      <form className="c4-cloison-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("cznEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("cznEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("cznNote")}<input className="c4-field" aria-label={v4("cznNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("cznSetter")}<input className="c4-field" aria-label={v4("cznSetter")} aria-required={false} value={setter} maxLength={24} disabled={viewer} onChange={(event) => setSetter(event.target.value)} /></label>
        <label className="c4-lab">{v4("cznPiece")}<select className="c4-field" aria-label={v4("cznPiece")} value={piece} disabled={viewer} onChange={(event) => setPiece(event.target.value)}><option value="">{v4("cznBlankPiece")}</option>{CZN_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("cznFilm")}<select className="c4-field" aria-label={v4("cznFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("cznAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("cznDrop")}<select className="c4-field" aria-label={v4("cznDrop")} value={dropNo} disabled={viewer} onChange={(event) => setDropNo(event.target.value)}><option value="">{v4("cznAll")}</option>{DROPS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("cznLock")}<select className="c4-field" aria-label={v4("cznLock")} value={lockNo} disabled={viewer} onChange={(event) => setLockNo(event.target.value)}><option value="">{v4("cznAll")}</option>{LOCKS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("cznTag")}<input className="c4-field" aria-label={v4("cznTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("cznAdd")}</button>
      </form>
      <div className="c4-cloison-tools">
        <input ref={searchRef} className="c4-field c4-cloison-search" aria-label={v4("cznSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("cznSearch")} />
        {(["board", "peg", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "board" ? "cznBoard" : item === "peg" ? "cznPeg" : "cznCoffer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={pieceFilter === "inner" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "inner" ? "all" : "inner")}>{v4("cznInner")}</button>
        <button type="button" className="c4-chip" data-on={pieceFilter === "outer" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "outer" ? "all" : "outer")}>{v4("cznOuter")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "setter" ? "1" : "0"} onClick={() => setSort(sort === "setter" ? "piece" : "setter")}>{sort === "setter" ? v4("cznSortSetter") : v4("cznSortLimb")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("cznClose") : v4("cznAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("cznTimeline")}</button>
        <label className="c4-lab">{v4("cznDesk")}<select className="c4-field" aria-label={v4("cznDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{CZN_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-cloison-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addCloisonView(views, { id, name: viewName, tray, query, setter: setterFilter, film: filmFilter, piece: pieceFilter, drop: dropFilter, lock: lockFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("cznViewName")}<input className="c4-field" aria-label={v4("cznViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("cznSaveView")}</button>
      </form>
      <ul className="c4-cloison-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setSetterFilter(view.setter); setFilmFilter(view.film); setPieceFilter(view.piece); setDropFilter(view.drop); setLockFilter(view.lock); }}>{v4("cznApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropCloisonView(views, view.id))}>{v4("cznDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-cloison-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCloisonRaise(cards, picked))}>{v4("cznBulkPoise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCloisonCoffer(cards, picked))}>{v4("cznBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCloisonGraphite(cards, picked))}>{v4("cznBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCloisonTag(cards, picked))}>{v4("cznBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("cloison-rules.csv", cloisonCsv(shown, station))}>{v4("cznCsv")}</button>
        <p className="c4-cloison-meta">{v4("cznKeys")} / c x a j k · {v4("cznQuiet")} {counts.quiet} · {v4("cznInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-cloison-time" aria-label={v4("cznTimeline")}>
          {timeline.map((mail) => <li key={mail.drop}><span>{mail.drop}</span> {mail.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("cznEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-cloison-list">
          {shown.map((card) => {
            const late = lateCloison(card, station);
            return (
              <li key={card.id} className="c4-cloison-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleCloison(card) ? "1" : "0"} data-brisk={briskCloison(card) ? "1" : "0"} data-overdue={overdueCloison(card) ? "1" : "0"} data-resting={restingCloison(card) ? "1" : "0"} data-inner={cloisonInner(card.piece) ? "1" : "0"} data-outer={cloisonOuter(card.piece) ? "1" : "0"}>
                <label className="c4-cloison-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editCloison(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("cznEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("cznApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editCloisonNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("cznNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-cloison-meta">{limbLabel(v4, card.piece)} · {filmLabel(v4, card.film)} · {card.drop ?? "—"} · {card.lock} · {card.setter || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "cznAuditSave")}` : ""}{late ? ` · ${v4("cznOverdue")}` : ""}</p>
                </div>
                <div className="c4-cloison-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("cznEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCloisonRaised(cards, card.id, !card.raised))}>{card.raised ? v4("cznFree") : v4("cznPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCloisonFilm(cards, card.id, suggestedFilm))}>{v4("cznSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCloisonPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("cznUnpeg") : v4("cznPegIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCloisonCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("cznUncoffer") : v4("cznCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCloisonStar(cards, card.id, !card.starred))}>{card.starred ? v4("cznUnstar") : v4("cznStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addCloisonTag(cards, card.id, "c"))}>{v4("cznTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("cznRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("cznLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHammerFocused(cards, card.id))}>{v4("cznLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHammerFocused(cards, card.id))}>{v4("cznLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(finishFocused(cards, card.id))}>{v4("cznFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCloisonFocused(cards, card.id))}>{v4("cznPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinCloisonFocused(cards, card.id))}>{v4("cznPeg")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starCloisonFocused(cards, card.id))}>{v4("cznStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(cloisonCopy(card))}>{v4("cznCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}


type DtpDoc = { id?: string; name?: string | null; docType?: string | null; trader?: string | null; traderId?: string | null };

export function DocumentTypePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ documents?: DtpDoc[] }>("/api/admin/documents?take=24");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<DtpShape>("all");
  const [review, setReview] = useState<DtpReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.documents || []).map((row): DtpRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || textField(row.trader) || id,
      userId: textField(row.traderId),
      code: { docType: textField(row.docType) } satisfies DtpValue,
    };
  }).filter((row): row is DtpRow => Boolean(row));
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
    const next = readHiddenSel(readJson(DTP_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(DTP_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedSel(readJson(DTP_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(DTP_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleSelLanes(present, hidden, showHidden);
  const shown = visibleSel(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = dtpLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = dtpLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingSel(rows);
  const leadHue = leadingSelHue(rows);
  const whole = rows.filter((row) => dtpLane(row.code)).length;
  const share = dtpShare(laneSelCount(rows, "hall"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("document-types.csv", dtpLanesCsv(rows));
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
    writeJson(DTP_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(DTP_REVIEW_KEY, next);
  }

  return (
    <section className="c4-dtpplate" aria-label={v4("dtpTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-dtpplate-mast">
        <p className="c4-dtpplate-seal" data-logo="mono">{v4("dtpLogo")}</p>
        <div>
          <p className="c4-dtpplate-kicker">{v4("dtpSub")}</p>
          <h2 className="c4-title">{v4("dtpTitle")}</h2>
        </div>
        <p className="c4-dtpplate-count">{shown.length}</p>
      </header>
      <p className="c4-dtpplate-links">
        <Link href={crmv4Href(base, "czn")}>{v4("cznTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("dtpCustomer")}</Link>
      </p>
      <p className="c4-dtpplate-hint">{v4("dtpHint")}</p>
      {viewer && <p className="c4-dtpplate-note">{v4("dtpViewer")}</p>}
      <p className="c4-dtpplate-meta">{v4("dtpLead")} {laneLabel(v4, lead)} · {v4("dtpToneLead")} {hueLabel(v4, leadHue)} · {v4("dtpShare")} {share}</p>
      <div className="c4-dtpplate-chart" aria-label={v4("dtpChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-dtpplate-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-dtpplate-tools">
        <input ref={searchRef} className="c4-field c4-dtpplate-search" aria-label={v4("dtpSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("dtpSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("dtpShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "dtpAll" : item === "reviewed" ? "dtpReviewed" : "dtpFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("dtpAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as DtpShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleSel(hidden, item))}>{hidden.includes(item) ? v4("dtpShow") : v4("dtpHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-dtpplate-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSelReview(reviewed, picked, true))}>{v4("dtpBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSelReview(reviewed, picked, false))}>{v4("dtpBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("document-type-lanes.csv", dtpLanesCsv(rows))}>{v4("dtpCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("document-type-rows.csv", dtpRowsCsv(shown, reviewed))}>{v4("dtpRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("dtpLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("dtpFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("dtpEmpty")}</p>}
      <ul className="c4-dtpplate-list">
        {shown.map((row) => {
          const name = dtpCopy(row.code);
          const tone = dtpHue(row.code);
          return (
            <li key={row.id} className="c4-dtpplate-card" data-mail={dtpLane(row.code) || "open"} data-hue={tone || "none"} data-home={dtpLane(row.code) === "hall" ? "1" : "0"} data-away={dtpAway(row.code) ? "1" : "0"} data-guest={dtpGuest(row.code) ? "1" : "0"} data-citizen={dtpCitizen(row.code) ? "1" : "0"} data-open={dtpOpen(row.code) ? "1" : "0"} data-even={dtpEven(row.code) ? "1" : "0"} data-digit={dtpDigit(row.code) ? "1" : "0"} data-letter={dtpLetter(row.code) ? "1" : "0"} data-mixed={dtpMixed(row.code) ? "1" : "0"} data-upper={dtpUpper(row.code) ? "1" : "0"} data-lower={dtpLower(row.code) ? "1" : "0"} data-space={dtpSpace(row.code) ? "1" : "0"} data-vowel={dtpVowel(row.code) ? "1" : "0"} data-tail={dtpTail(row.code) ? "1" : "0"} data-first={dtpFirst(row.code) ? "1" : "0"} data-held={dtpHeld(row.code) ? "1" : "0"} data-join={dtpJoin(row.code) ? "1" : "0"} data-route={dtpRoute(row.code) ? "1" : "0"} data-brief={dtpBrief(row.code) ? "1" : "0"}>
              <label className="c4-dtpplate-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-dtpplate-meta">{name || v4("dtpOpen")} · {dtpStamp(row.code) || "—"} · {dtpFamily(row.code) || "—"} · {dtpLength(row.code) ?? "—"} · {laneLabel(v4, dtpLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-dtpplate-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleSelReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("dtpReviewed") : v4("dtpReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = dtpCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("dtpCopied") : v4("dtpCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, row.userId ? `customers/${row.userId}` : "customers")}>{v4("dtpCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
