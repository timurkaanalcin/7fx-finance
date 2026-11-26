"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  LIS_KEY,
  LIS_REVIEW_KEY,
  OPL_DENSITY_KEY,
  OPL_KEY,
  OPL_MODES,
  OPL_VIEW_KEY,
  addOpaline,
  addOpalineTag,
  addOpalineView,
  briskOpaline,
  bulkSelReview,
  bulkOpalineCoffer,
  bulkOpalineGraphite,
  bulkOpalineRaise,
  bulkOpalineTag,
  busiestKeeper,
  dropOpalineView,
  editOpaline,
  editOpalineNote,
  lisBrief,
  lisCopy,
  lisDigit,
  lisEven,
  lisFamily,
  lisFirst,
  lisRoute,
  lisHeld,
  lisAway,
  lisHue,
  lisJoin,
  lisCitizen,
  lisLane,
  lisLanes,
  lisLanesCsv,
  lisLength,
  lisLetter,
  lisLower,
  lisMixed,
  lisOpen,
  lisRowsCsv,
  lisShare,
  lisSpace,
  lisStamp,
  lisTail,
  lisUpper,
  lisGuest,
  lisVowel,
  fairKeeper,
  finishFocused,
  opalineBars,
  opalineCopy,
  opalineCounts,
  opalineCsv,
  opalineDensity,
  opalineInner,
  opalineOuter,
  opalineTimeline,
  opalineKeepers,
  idleOpaline,
  laneSelCount,
  lateOpaline,
  leadingSel,
  leadingSelHue,
  lowerHourFocused,
  lowerHammerFocused,
  moveOpalineFocus,
  overdueOpaline,
  pinOpalineFocused,
  presentSelLanes,
  raiseHourFocused,
  raiseHammerFocused,
  readHiddenSel,
  readOpalineCards,
  readOpalineViews,
  readReviewedSel,
  reminderOpalineCards,
  restingOpaline,
  setOpalineCoffer,
  setOpalineFilm,
  setOpalineFocused,
  setOpalinePin,
  setOpalineRaised,
  setOpalineStar,
  sortOpalineCards,
  starOpalineFocused,
  suggestHour,
  suggestFinish,
  suggestMode,
  toggleSel,
  toggleSelReview,
  visibleSel,
  visibleSelLanes,
  visibleOpalineCards,
  type LisReview,
  type LisRow,
  type LisShape,
  type LisValue,
  type Opaline,
  type OpalineDensity,
  type OpalineSort,
  type OpalineTray,
  type OpalineView,
} from "@/lib/crmv4/round366";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["GILT", "IVORY", "GRAPHITE"] as const;
const DROPS = ["3", "6", "12", "24"] as const;
const LOCKS = ["3", "6", "9"] as const;

const PIECE_KEY: Record<string, CrmV4CopyKey> = {
  glaze: "oplGlaze",
  ground: "oplGround",
  veil: "oplVeil",
  rim: "oplRim",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "oplAuditSave",
  edit: "oplAuditEdit",
  note: "oplAuditNote",
  film: "oplAuditFilm",
  poise: "oplAuditPoise",
  free: "oplAuditFree",
  peg: "oplAuditPeg",
  return: "oplAuditReturn",
  coffer: "oplAuditCoffer",
  open: "oplAuditOpen",
  tag: "oplAuditTag",
  lock: "oplAuditRate",
  drop: "oplAuditStep",
  lower: "oplAuditLower",
  star: "oplAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  hall: "lisLaneHall",
  vacant: "lisLaneVacant",
  hold: "lisLaneHold",
  desk: "lisLaneDesk",
  guest: "lisLaneGuest",
  join: "lisJoin",
  route: "lisRoute",
  brief: "lisBrief",
  long: "lisLong",
  stamp: "lisStampLane",
  vowel: "lisVowel",
  plain: "lisPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "lisChampagne",
  ivory: "lisIvory",
  graphite: "lisGraphite",
};

const SHAPE_KEY: Record<LisShape, CrmV4CopyKey> = {
  all: "lisShapeAll",
  hall: "lisShapeHall",
  vacant: "lisShapeVacant",
  hold: "lisShapeHold",
  guest: "lisShapeGuest",
  join: "lisShapeJoin",
  route: "lisShapeRoute",
  brief: "lisShapeBrief",
  long: "lisShapeLong",
  stamp: "lisShapeStamp",
  vowel: "lisShapeVowel",
  plain: "lisShapePlain",
  open: "lisShapeOpen",
  soon: "lisShapeOpen",
  letter: "lisShapePlain",
  mixed: "lisShapeStamp",
  upper: "lisShapeUpper",
  lower: "lisShapePlain",
  space: "lisShapeSpace",
  even: "lisShapeEven",
  odd: "lisShapeEven",
  tail: "lisShapeStamp",
  first: "lisShapePlain",
  held: "lisShapeLong",
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
  return key ? v4(key) : v4("oplBlankPiece");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "GILT") return v4("oplGilt");
  if (film === "IVORY") return v4("oplIvory");
  if (film === "GRAPHITE") return v4("oplGraphite");
  return v4("oplAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("lisBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("lisBlank");
}

export function OpalineRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Opaline[]>([]);
  const [views, setViews] = useState<OpalineView[]>([]);
  const [density, setDensity] = useState<OpalineDensity>("airy");
  const [tray, setTray] = useState<OpalineTray>("board");
  const [query, setQuery] = useState("");
  const [setterFilter, setSetterFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [pieceFilter, setPieceFilter] = useState("all");
  const [dropFilter, setDropFilter] = useState("all");
  const [lockFilter, setLockFilter] = useState("all");
  const [sort, setSort] = useState<OpalineSort>("piece");
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
  const [station, setStation] = useState("glaze");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readOpalineCards(readJson(OPL_KEY, [])));
    setViews(readOpalineViews(readJson(OPL_VIEW_KEY, [])));
    setDensity(opalineDensity(readJson(OPL_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Opaline[]) {
    setCards(next);
    writeJson(OPL_KEY, next);
  }
  function storeViews(next: OpalineView[]) {
    setViews(next);
    writeJson(OPL_VIEW_KEY, next);
  }
  function storeDensity(next: OpalineDensity) {
    setDensity(next);
    writeJson(OPL_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortOpalineCards(visibleOpalineCards(cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter), sort),
    [cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter, sort],
  );
  const counts = opalineCounts(cards, shown, station);
  const bars = opalineBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = opalineTimeline(cards);
  const reminders = reminderOpalineCards(cards);
  const poisers = opalineKeepers(cards);
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
        download("opaline-rules.csv", opalineCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveOpalineFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveOpalineFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addOpaline(cards, { title, note, setter: setter, piece, drop: dropNo, film, lock: lockNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-opaline" aria-label={v4("oplTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-opaline-mast">
        <p className="c4-opaline-seal" data-logo="mono">{v4("oplLogo")}</p>
        <div>
          <p className="c4-opaline-kicker">{v4("oplSub")}</p>
          <h2 className="c4-title">{v4("oplTitle")}</h2>
        </div>
        <p className="c4-opaline-count">{shown.length}</p>
      </header>
      <p className="c4-opaline-links">
        <Link href={crmv4Href(base, "lis")}>{v4("lisTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("oplCustomers")}</Link>
      </p>
      <p className="c4-opaline-hint">{v4("oplHint")}</p>
      {viewer && <p className="c4-opaline-note">{v4("oplViewer")}</p>}
      <p className="c4-opaline-meta">{v4("oplFair")} {fair || "—"} · {v4("oplBusy")} {busy || "—"} · {v4("oplSuggest")} {limbLabel(v4, suggestedLimb)} · {filmLabel(v4, suggestedFilm)} · {suggestedBeat}</p>
      <ol className="c4-opaline-index" aria-label={v4("oplRemind")}>
        <li data-tone="gold">{v4("oplOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("oplIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("oplBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("oplResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-opaline-remind c4-opaline-notices" role="status" aria-label={v4("oplRemind")}>
          {reminders.map((name) => <li key={name}>{v4("oplOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-opaline-chart" aria-label={v4("oplChart")}>
        {bars.map((bar) => (
          <button key={bar.piece} type="button" className="c4-opaline-column" data-on={pieceFilter === bar.piece ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === bar.piece ? "all" : bar.piece)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{limbLabel(v4, bar.piece)}</span>
          </button>
        ))}
      </div>
      <form className="c4-opaline-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("oplEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("oplEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("oplNote")}<input className="c4-field" aria-label={v4("oplNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("oplSetter")}<input className="c4-field" aria-label={v4("oplSetter")} aria-required={false} value={setter} maxLength={24} disabled={viewer} onChange={(event) => setSetter(event.target.value)} /></label>
        <label className="c4-lab">{v4("oplPiece")}<select className="c4-field" aria-label={v4("oplPiece")} value={piece} disabled={viewer} onChange={(event) => setPiece(event.target.value)}><option value="">{v4("oplBlankPiece")}</option>{OPL_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("oplFilm")}<select className="c4-field" aria-label={v4("oplFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("oplAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("oplDrop")}<select className="c4-field" aria-label={v4("oplDrop")} value={dropNo} disabled={viewer} onChange={(event) => setDropNo(event.target.value)}><option value="">{v4("oplAll")}</option>{DROPS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("oplLock")}<select className="c4-field" aria-label={v4("oplLock")} value={lockNo} disabled={viewer} onChange={(event) => setLockNo(event.target.value)}><option value="">{v4("oplAll")}</option>{LOCKS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("oplTag")}<input className="c4-field" aria-label={v4("oplTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("oplAdd")}</button>
      </form>
      <div className="c4-opaline-tools">
        <input ref={searchRef} className="c4-field c4-opaline-search" aria-label={v4("oplSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("oplSearch")} />
        {(["board", "peg", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "board" ? "oplBoard" : item === "peg" ? "oplPeg" : "oplCoffer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={pieceFilter === "inner" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "inner" ? "all" : "inner")}>{v4("oplInner")}</button>
        <button type="button" className="c4-chip" data-on={pieceFilter === "outer" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "outer" ? "all" : "outer")}>{v4("oplOuter")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "setter" ? "1" : "0"} onClick={() => setSort(sort === "setter" ? "piece" : "setter")}>{sort === "setter" ? v4("oplSortSetter") : v4("oplSortLimb")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("oplClose") : v4("oplAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("oplTimeline")}</button>
        <label className="c4-lab">{v4("oplDesk")}<select className="c4-field" aria-label={v4("oplDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{OPL_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-opaline-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addOpalineView(views, { id, name: viewName, tray, query, setter: setterFilter, film: filmFilter, piece: pieceFilter, drop: dropFilter, lock: lockFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("oplViewName")}<input className="c4-field" aria-label={v4("oplViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("oplSaveView")}</button>
      </form>
      <ul className="c4-opaline-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setSetterFilter(view.setter); setFilmFilter(view.film); setPieceFilter(view.piece); setDropFilter(view.drop); setLockFilter(view.lock); }}>{v4("oplApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropOpalineView(views, view.id))}>{v4("oplDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-opaline-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkOpalineRaise(cards, picked))}>{v4("oplBulkPoise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkOpalineCoffer(cards, picked))}>{v4("oplBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkOpalineGraphite(cards, picked))}>{v4("oplBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkOpalineTag(cards, picked))}>{v4("oplBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("opaline-rules.csv", opalineCsv(shown, station))}>{v4("oplCsv")}</button>
        <p className="c4-opaline-meta">{v4("oplKeys")} / n x a j k · {v4("oplQuiet")} {counts.quiet} · {v4("oplInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-opaline-time" aria-label={v4("oplTimeline")}>
          {timeline.map((mail) => <li key={mail.drop}><span>{mail.drop}</span> {mail.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("oplEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-opaline-list">
          {shown.map((card) => {
            const late = lateOpaline(card, station);
            return (
              <li key={card.id} className="c4-opaline-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleOpaline(card) ? "1" : "0"} data-brisk={briskOpaline(card) ? "1" : "0"} data-overdue={overdueOpaline(card) ? "1" : "0"} data-resting={restingOpaline(card) ? "1" : "0"} data-inner={opalineInner(card.piece) ? "1" : "0"} data-outer={opalineOuter(card.piece) ? "1" : "0"}>
                <label className="c4-opaline-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editOpaline(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("oplEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("oplApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editOpalineNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("oplNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-opaline-meta">{limbLabel(v4, card.piece)} · {filmLabel(v4, card.film)} · {card.drop ?? "—"} · {card.lock} · {card.setter || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "oplAuditSave")}` : ""}{late ? ` · ${v4("oplOverdue")}` : ""}</p>
                </div>
                <div className="c4-opaline-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("oplEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOpalineRaised(cards, card.id, !card.raised))}>{card.raised ? v4("oplFree") : v4("oplPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOpalineFilm(cards, card.id, suggestedFilm))}>{v4("oplSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOpalinePin(cards, card.id, !card.pinned))}>{card.pinned ? v4("oplUnpeg") : v4("oplPegIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOpalineCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("oplUncoffer") : v4("oplCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOpalineStar(cards, card.id, !card.starred))}>{card.starred ? v4("oplUnstar") : v4("oplStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addOpalineTag(cards, card.id, "q"))}>{v4("oplTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("oplRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("oplLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHammerFocused(cards, card.id))}>{v4("oplLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHammerFocused(cards, card.id))}>{v4("oplLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(finishFocused(cards, card.id))}>{v4("oplFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOpalineFocused(cards, card.id))}>{v4("oplPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinOpalineFocused(cards, card.id))}>{v4("oplPeg")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starOpalineFocused(cards, card.id))}>{v4("oplStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(opalineCopy(card))}>{v4("oplCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}


type LisUser = { id?: string; name?: string | null; leadInvalidSource?: string | boolean | null };

export function OriginPlates({ base, v4 }: { base: string; v4: V4 }) {
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
      code: { leadInvalidSource: row.leadInvalidSource === true || row.leadInvalidSource === false ? row.leadInvalidSource : textField(row.leadInvalidSource) } satisfies LisValue,
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
    const next = readHiddenSel(readJson(LIS_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(LIS_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedSel(readJson(LIS_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(LIS_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleSelLanes(present, hidden, showHidden);
  const shown = visibleSel(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = lisLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = lisLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingSel(rows);
  const leadHue = leadingSelHue(rows);
  const whole = rows.filter((row) => lisLane(row.code)).length;
  const share = lisShare(laneSelCount(rows, "hall"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("origins.csv", lisLanesCsv(rows));
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
    writeJson(LIS_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(LIS_REVIEW_KEY, next);
  }

  return (
    <section className="c4-lisplate" aria-label={v4("lisTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-lisplate-mast">
        <p className="c4-lisplate-seal" data-logo="mono">{v4("lisLogo")}</p>
        <div>
          <p className="c4-lisplate-kicker">{v4("lisSub")}</p>
          <h2 className="c4-title">{v4("lisTitle")}</h2>
        </div>
        <p className="c4-lisplate-count">{shown.length}</p>
      </header>
      <p className="c4-lisplate-links">
        <Link href={crmv4Href(base, "opl")}>{v4("oplTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("lisCustomer")}</Link>
      </p>
      <p className="c4-lisplate-hint">{v4("lisHint")}</p>
      {viewer && <p className="c4-lisplate-note">{v4("lisViewer")}</p>}
      <p className="c4-lisplate-meta">{v4("lisLead")} {laneLabel(v4, lead)} · {v4("lisToneLead")} {hueLabel(v4, leadHue)} · {v4("lisShare")} {share}</p>
      <div className="c4-lisplate-chart" aria-label={v4("lisChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-lisplate-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-lisplate-tools">
        <input ref={searchRef} className="c4-field c4-lisplate-search" aria-label={v4("lisSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("lisSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("lisShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "lisAll" : item === "reviewed" ? "lisReviewed" : "lisFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("lisAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as LisShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleSel(hidden, item))}>{hidden.includes(item) ? v4("lisShow") : v4("lisHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-lisplate-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSelReview(reviewed, picked, true))}>{v4("lisBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSelReview(reviewed, picked, false))}>{v4("lisBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("origin-lanes.csv", lisLanesCsv(rows))}>{v4("lisCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("origin-rows.csv", lisRowsCsv(shown, reviewed))}>{v4("lisRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("lisLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("lisFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("lisEmpty")}</p>}
      <ul className="c4-lisplate-list">
        {shown.map((row) => {
          const name = lisCopy(row.code);
          const tone = lisHue(row.code);
          return (
            <li key={row.id} className="c4-lisplate-card" data-mail={lisLane(row.code) || "open"} data-hue={tone || "none"} data-home={lisLane(row.code) === "hall" ? "1" : "0"} data-away={lisAway(row.code) ? "1" : "0"} data-guest={lisGuest(row.code) ? "1" : "0"} data-citizen={lisCitizen(row.code) ? "1" : "0"} data-open={lisOpen(row.code) ? "1" : "0"} data-even={lisEven(row.code) ? "1" : "0"} data-digit={lisDigit(row.code) ? "1" : "0"} data-letter={lisLetter(row.code) ? "1" : "0"} data-mixed={lisMixed(row.code) ? "1" : "0"} data-upper={lisUpper(row.code) ? "1" : "0"} data-lower={lisLower(row.code) ? "1" : "0"} data-space={lisSpace(row.code) ? "1" : "0"} data-vowel={lisVowel(row.code) ? "1" : "0"} data-tail={lisTail(row.code) ? "1" : "0"} data-first={lisFirst(row.code) ? "1" : "0"} data-held={lisHeld(row.code) ? "1" : "0"} data-join={lisJoin(row.code) ? "1" : "0"} data-route={lisRoute(row.code) ? "1" : "0"} data-brief={lisBrief(row.code) ? "1" : "0"}>
              <label className="c4-lisplate-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-lisplate-meta">{name || v4("lisOpen")} · {lisStamp(row.code) || "—"} · {lisFamily(row.code) || "—"} · {lisLength(row.code) ?? "—"} · {laneLabel(v4, lisLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-lisplate-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleSelReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("lisReviewed") : v4("lisReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = lisCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("lisCopied") : v4("lisCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("lisCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
