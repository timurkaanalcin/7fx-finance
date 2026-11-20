"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  CGN_KEY,
  CGN_REVIEW_KEY,
  PCH_DENSITY_KEY,
  PCH_KEY,
  PCH_MODES,
  PCH_VIEW_KEY,
  addParachute,
  addParachuteTag,
  addParachuteView,
  briskParachute,
  bulkSelReview,
  bulkParachuteCoffer,
  bulkParachuteGraphite,
  bulkParachuteRaise,
  bulkParachuteTag,
  busiestKeeper,
  dropParachuteView,
  editParachute,
  editParachuteNote,
  cgnBrief,
  cgnCopy,
  cgnDigit,
  cgnEven,
  cgnFamily,
  cgnFirst,
  cgnRoute,
  cgnHeld,
  cgnAway,
  cgnHue,
  cgnJoin,
  cgnCitizen,
  cgnLane,
  cgnLanes,
  cgnLanesCsv,
  cgnLength,
  cgnLetter,
  cgnLower,
  cgnMixed,
  cgnOpen,
  cgnRowsCsv,
  cgnShare,
  cgnSpace,
  cgnStamp,
  cgnTail,
  cgnUpper,
  cgnGuest,
  cgnVowel,
  fairKeeper,
  finishFocused,
  parachuteBars,
  parachuteCopy,
  parachuteCounts,
  parachuteCsv,
  parachuteDensity,
  parachuteInner,
  parachuteOuter,
  parachuteTimeline,
  parachuteKeepers,
  idleParachute,
  laneSelCount,
  lateParachute,
  leadingSel,
  leadingSelHue,
  lowerHourFocused,
  lowerHammerFocused,
  moveParachuteFocus,
  overdueParachute,
  pinParachuteFocused,
  presentSelLanes,
  raiseHourFocused,
  raiseHammerFocused,
  readHiddenSel,
  readParachutes,
  readParachuteViews,
  readReviewedSel,
  reminderParachutes,
  restingParachute,
  setParachuteCoffer,
  setParachuteFilm,
  setParachuteFocused,
  setParachutePin,
  setParachuteRaised,
  setParachuteStar,
  sortParachutes,
  starParachuteFocused,
  suggestHour,
  suggestFinish,
  suggestMode,
  toggleSel,
  toggleSelReview,
  visibleSel,
  visibleSelLanes,
  visibleParachutes,
  type CgnReview,
  type CgnRow,
  type CgnShape,
  type CgnValue,
  type Parachute,
  type ParachuteDensity,
  type ParachuteSort,
  type ParachuteTray,
  type ParachuteView,
} from "@/lib/crmv4/round362";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["GILT", "IVORY", "GRAPHITE"] as const;
const DROPS = ["6", "12", "24", "48"] as const;
const LOCKS = ["2", "4", "8"] as const;

const PIECE_KEY: Record<string, CrmV4CopyKey> = {
  lyre: "pchLyre",
  stud: "pchStud",
  spring: "pchSpring",
  jewel: "pchJewel",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "pchAuditSave",
  edit: "pchAuditEdit",
  note: "pchAuditNote",
  film: "pchAuditFilm",
  poise: "pchAuditPoise",
  free: "pchAuditFree",
  peg: "pchAuditPeg",
  return: "pchAuditReturn",
  coffer: "pchAuditCoffer",
  open: "pchAuditOpen",
  tag: "pchAuditTag",
  lock: "pchAuditRate",
  drop: "pchAuditStep",
  lower: "pchAuditLower",
  star: "pchAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  hall: "cgnLaneHall",
  vacant: "cgnLaneVacant",
  hold: "cgnLaneHold",
  desk: "cgnLaneDesk",
  guest: "cgnLaneGuest",
  join: "cgnJoin",
  route: "cgnRoute",
  brief: "cgnBrief",
  long: "cgnLong",
  stamp: "cgnStampLane",
  vowel: "cgnVowel",
  plain: "cgnPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "cgnChampagne",
  ivory: "cgnIvory",
  graphite: "cgnGraphite",
};

const SHAPE_KEY: Record<CgnShape, CrmV4CopyKey> = {
  all: "cgnShapeAll",
  hall: "cgnShapeHall",
  vacant: "cgnShapeVacant",
  hold: "cgnShapeHold",
  guest: "cgnShapeGuest",
  join: "cgnShapeJoin",
  route: "cgnShapeRoute",
  brief: "cgnShapeBrief",
  long: "cgnShapeLong",
  stamp: "cgnShapeStamp",
  vowel: "cgnShapeVowel",
  plain: "cgnShapePlain",
  open: "cgnShapeOpen",
  soon: "cgnShapeOpen",
  letter: "cgnShapePlain",
  mixed: "cgnShapeStamp",
  upper: "cgnShapeUpper",
  lower: "cgnShapePlain",
  space: "cgnShapeSpace",
  even: "cgnShapeEven",
  odd: "cgnShapeEven",
  tail: "cgnShapeStamp",
  first: "cgnShapePlain",
  held: "cgnShapeLong",
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
  return key ? v4(key) : v4("pchBlankPiece");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "GILT") return v4("pchGilt");
  if (film === "IVORY") return v4("pchIvory");
  if (film === "GRAPHITE") return v4("pchGraphite");
  return v4("pchAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("cgnBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("cgnBlank");
}

export function ParachuteRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Parachute[]>([]);
  const [views, setViews] = useState<ParachuteView[]>([]);
  const [density, setDensity] = useState<ParachuteDensity>("airy");
  const [tray, setTray] = useState<ParachuteTray>("board");
  const [query, setQuery] = useState("");
  const [setterFilter, setSetterFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [pieceFilter, setPieceFilter] = useState("all");
  const [dropFilter, setDropFilter] = useState("all");
  const [lockFilter, setLockFilter] = useState("all");
  const [sort, setSort] = useState<ParachuteSort>("piece");
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
  const [station, setStation] = useState("lyre");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readParachutes(readJson(PCH_KEY, [])));
    setViews(readParachuteViews(readJson(PCH_VIEW_KEY, [])));
    setDensity(parachuteDensity(readJson(PCH_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Parachute[]) {
    setCards(next);
    writeJson(PCH_KEY, next);
  }
  function storeViews(next: ParachuteView[]) {
    setViews(next);
    writeJson(PCH_VIEW_KEY, next);
  }
  function storeDensity(next: ParachuteDensity) {
    setDensity(next);
    writeJson(PCH_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortParachutes(visibleParachutes(cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter), sort),
    [cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter, sort],
  );
  const counts = parachuteCounts(cards, shown, station);
  const bars = parachuteBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = parachuteTimeline(cards);
  const reminders = reminderParachutes(cards);
  const poisers = parachuteKeepers(cards);
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
        download("parachute-rules.csv", parachuteCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveParachuteFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveParachuteFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addParachute(cards, { title, note, setter: setter, piece, drop: dropNo, film, lock: lockNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-parachute" aria-label={v4("pchTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-parachute-mast">
        <p className="c4-parachute-seal" data-logo="mono">{v4("pchLogo")}</p>
        <div>
          <p className="c4-parachute-kicker">{v4("pchSub")}</p>
          <h2 className="c4-title">{v4("pchTitle")}</h2>
        </div>
        <p className="c4-parachute-count">{shown.length}</p>
      </header>
      <p className="c4-parachute-links">
        <Link href={crmv4Href(base, "cgn")}>{v4("cgnTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("pchCustomers")}</Link>
      </p>
      <p className="c4-parachute-hint">{v4("pchHint")}</p>
      {viewer && <p className="c4-parachute-note">{v4("pchViewer")}</p>}
      <p className="c4-parachute-meta">{v4("pchFair")} {fair || "—"} · {v4("pchBusy")} {busy || "—"} · {v4("pchSuggest")} {limbLabel(v4, suggestedLimb)} · {filmLabel(v4, suggestedFilm)} · {suggestedBeat}</p>
      <ol className="c4-parachute-index" aria-label={v4("pchRemind")}>
        <li data-tone="gold">{v4("pchOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("pchIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("pchBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("pchResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-parachute-remind c4-parachute-notices" role="status" aria-label={v4("pchRemind")}>
          {reminders.map((name) => <li key={name}>{v4("pchOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-parachute-chart" aria-label={v4("pchChart")}>
        {bars.map((bar) => (
          <button key={bar.piece} type="button" className="c4-parachute-column" data-on={pieceFilter === bar.piece ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === bar.piece ? "all" : bar.piece)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{limbLabel(v4, bar.piece)}</span>
          </button>
        ))}
      </div>
      <form className="c4-parachute-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("pchEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("pchEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("pchNote")}<input className="c4-field" aria-label={v4("pchNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("pchSetter")}<input className="c4-field" aria-label={v4("pchSetter")} aria-required={false} value={setter} maxLength={24} disabled={viewer} onChange={(event) => setSetter(event.target.value)} /></label>
        <label className="c4-lab">{v4("pchPiece")}<select className="c4-field" aria-label={v4("pchPiece")} value={piece} disabled={viewer} onChange={(event) => setPiece(event.target.value)}><option value="">{v4("pchBlankPiece")}</option>{PCH_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("pchFilm")}<select className="c4-field" aria-label={v4("pchFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("pchAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("pchDrop")}<select className="c4-field" aria-label={v4("pchDrop")} value={dropNo} disabled={viewer} onChange={(event) => setDropNo(event.target.value)}><option value="">{v4("pchAll")}</option>{DROPS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("pchLock")}<select className="c4-field" aria-label={v4("pchLock")} value={lockNo} disabled={viewer} onChange={(event) => setLockNo(event.target.value)}><option value="">{v4("pchAll")}</option>{LOCKS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("pchTag")}<input className="c4-field" aria-label={v4("pchTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("pchAdd")}</button>
      </form>
      <div className="c4-parachute-tools">
        <input ref={searchRef} className="c4-field c4-parachute-search" aria-label={v4("pchSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("pchSearch")} />
        {(["board", "peg", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "board" ? "pchBoard" : item === "peg" ? "pchPeg" : "pchCoffer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={pieceFilter === "inner" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "inner" ? "all" : "inner")}>{v4("pchInner")}</button>
        <button type="button" className="c4-chip" data-on={pieceFilter === "outer" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "outer" ? "all" : "outer")}>{v4("pchOuter")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "setter" ? "1" : "0"} onClick={() => setSort(sort === "setter" ? "piece" : "setter")}>{sort === "setter" ? v4("pchSortSetter") : v4("pchSortLimb")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("pchClose") : v4("pchAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("pchTimeline")}</button>
        <label className="c4-lab">{v4("pchDesk")}<select className="c4-field" aria-label={v4("pchDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{PCH_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-parachute-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addParachuteView(views, { id, name: viewName, tray, query, setter: setterFilter, film: filmFilter, piece: pieceFilter, drop: dropFilter, lock: lockFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("pchViewName")}<input className="c4-field" aria-label={v4("pchViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("pchSaveView")}</button>
      </form>
      <ul className="c4-parachute-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setSetterFilter(view.setter); setFilmFilter(view.film); setPieceFilter(view.piece); setDropFilter(view.drop); setLockFilter(view.lock); }}>{v4("pchApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropParachuteView(views, view.id))}>{v4("pchDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-parachute-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkParachuteRaise(cards, picked))}>{v4("pchBulkPoise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkParachuteCoffer(cards, picked))}>{v4("pchBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkParachuteGraphite(cards, picked))}>{v4("pchBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkParachuteTag(cards, picked))}>{v4("pchBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("parachute-rules.csv", parachuteCsv(shown, station))}>{v4("pchCsv")}</button>
        <p className="c4-parachute-meta">{v4("pchKeys")} / n x a j k · {v4("pchQuiet")} {counts.quiet} · {v4("pchInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-parachute-time" aria-label={v4("pchTimeline")}>
          {timeline.map((mail) => <li key={mail.drop}><span>{mail.drop}</span> {mail.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("pchEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-parachute-list">
          {shown.map((card) => {
            const late = lateParachute(card, station);
            return (
              <li key={card.id} className="c4-parachute-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleParachute(card) ? "1" : "0"} data-brisk={briskParachute(card) ? "1" : "0"} data-overdue={overdueParachute(card) ? "1" : "0"} data-resting={restingParachute(card) ? "1" : "0"} data-inner={parachuteInner(card.piece) ? "1" : "0"} data-outer={parachuteOuter(card.piece) ? "1" : "0"}>
                <label className="c4-parachute-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editParachute(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("pchEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("pchApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editParachuteNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("pchNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-parachute-meta">{limbLabel(v4, card.piece)} · {filmLabel(v4, card.film)} · {card.drop ?? "—"} · {card.lock} · {card.setter || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "pchAuditSave")}` : ""}{late ? ` · ${v4("pchOverdue")}` : ""}</p>
                </div>
                <div className="c4-parachute-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("pchEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setParachuteRaised(cards, card.id, !card.raised))}>{card.raised ? v4("pchFree") : v4("pchPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setParachuteFilm(cards, card.id, suggestedFilm))}>{v4("pchSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setParachutePin(cards, card.id, !card.pinned))}>{card.pinned ? v4("pchUnpeg") : v4("pchPegIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setParachuteCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("pchUncoffer") : v4("pchCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setParachuteStar(cards, card.id, !card.starred))}>{card.starred ? v4("pchUnstar") : v4("pchStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addParachuteTag(cards, card.id, "s"))}>{v4("pchTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("pchRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("pchLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHammerFocused(cards, card.id))}>{v4("pchLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHammerFocused(cards, card.id))}>{v4("pchLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(finishFocused(cards, card.id))}>{v4("pchFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setParachuteFocused(cards, card.id))}>{v4("pchPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinParachuteFocused(cards, card.id))}>{v4("pchPeg")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starParachuteFocused(cards, card.id))}>{v4("pchStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(parachuteCopy(card))}>{v4("pchCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}


type CgnUser = { id?: string; name?: string | null; campaign?: string | boolean | null };

export function CampaignPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: CgnUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<CgnShape>("all");
  const [review, setReview] = useState<CgnReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): CgnRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { campaign: row.campaign === true || row.campaign === false ? row.campaign : textField(row.campaign) } satisfies CgnValue,
    };
  }).filter((row): row is CgnRow => Boolean(row));
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
    const next = readHiddenSel(readJson(CGN_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(CGN_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedSel(readJson(CGN_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(CGN_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleSelLanes(present, hidden, showHidden);
  const shown = visibleSel(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = cgnLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = cgnLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingSel(rows);
  const leadHue = leadingSelHue(rows);
  const whole = rows.filter((row) => cgnLane(row.code)).length;
  const share = cgnShare(laneSelCount(rows, "hall"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("campaigns.csv", cgnLanesCsv(rows));
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
    writeJson(CGN_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(CGN_REVIEW_KEY, next);
  }

  return (
    <section className="c4-cgnplate" aria-label={v4("cgnTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-cgnplate-mast">
        <p className="c4-cgnplate-seal" data-logo="mono">{v4("cgnLogo")}</p>
        <div>
          <p className="c4-cgnplate-kicker">{v4("cgnSub")}</p>
          <h2 className="c4-title">{v4("cgnTitle")}</h2>
        </div>
        <p className="c4-cgnplate-count">{shown.length}</p>
      </header>
      <p className="c4-cgnplate-links">
        <Link href={crmv4Href(base, "pch")}>{v4("pchTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("cgnCustomer")}</Link>
      </p>
      <p className="c4-cgnplate-hint">{v4("cgnHint")}</p>
      {viewer && <p className="c4-cgnplate-note">{v4("cgnViewer")}</p>}
      <p className="c4-cgnplate-meta">{v4("cgnLead")} {laneLabel(v4, lead)} · {v4("cgnToneLead")} {hueLabel(v4, leadHue)} · {v4("cgnShare")} {share}</p>
      <div className="c4-cgnplate-chart" aria-label={v4("cgnChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-cgnplate-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-cgnplate-tools">
        <input ref={searchRef} className="c4-field c4-cgnplate-search" aria-label={v4("cgnSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("cgnSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("cgnShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "cgnAll" : item === "reviewed" ? "cgnReviewed" : "cgnFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("cgnAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as CgnShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleSel(hidden, item))}>{hidden.includes(item) ? v4("cgnShow") : v4("cgnHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-cgnplate-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSelReview(reviewed, picked, true))}>{v4("cgnBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSelReview(reviewed, picked, false))}>{v4("cgnBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("campaign-lanes.csv", cgnLanesCsv(rows))}>{v4("cgnCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("campaign-rows.csv", cgnRowsCsv(shown, reviewed))}>{v4("cgnRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("cgnLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("cgnFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("cgnEmpty")}</p>}
      <ul className="c4-cgnplate-list">
        {shown.map((row) => {
          const name = cgnCopy(row.code);
          const tone = cgnHue(row.code);
          return (
            <li key={row.id} className="c4-cgnplate-card" data-mail={cgnLane(row.code) || "open"} data-hue={tone || "none"} data-home={cgnLane(row.code) === "hall" ? "1" : "0"} data-away={cgnAway(row.code) ? "1" : "0"} data-guest={cgnGuest(row.code) ? "1" : "0"} data-citizen={cgnCitizen(row.code) ? "1" : "0"} data-open={cgnOpen(row.code) ? "1" : "0"} data-even={cgnEven(row.code) ? "1" : "0"} data-digit={cgnDigit(row.code) ? "1" : "0"} data-letter={cgnLetter(row.code) ? "1" : "0"} data-mixed={cgnMixed(row.code) ? "1" : "0"} data-upper={cgnUpper(row.code) ? "1" : "0"} data-lower={cgnLower(row.code) ? "1" : "0"} data-space={cgnSpace(row.code) ? "1" : "0"} data-vowel={cgnVowel(row.code) ? "1" : "0"} data-tail={cgnTail(row.code) ? "1" : "0"} data-first={cgnFirst(row.code) ? "1" : "0"} data-held={cgnHeld(row.code) ? "1" : "0"} data-join={cgnJoin(row.code) ? "1" : "0"} data-route={cgnRoute(row.code) ? "1" : "0"} data-brief={cgnBrief(row.code) ? "1" : "0"}>
              <label className="c4-cgnplate-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-cgnplate-meta">{name || v4("cgnOpen")} · {cgnStamp(row.code) || "—"} · {cgnFamily(row.code) || "—"} · {cgnLength(row.code) ?? "—"} · {laneLabel(v4, cgnLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-cgnplate-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleSelReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("cgnReviewed") : v4("cgnReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = cgnCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("cgnCopied") : v4("cgnCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("cgnCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
