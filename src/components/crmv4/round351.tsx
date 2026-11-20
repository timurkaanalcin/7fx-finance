"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  FDP_KEY,
  FDP_REVIEW_KEY,
  RHT_DENSITY_KEY,
  RHT_KEY,
  RHT_MODES,
  RHT_VIEW_KEY,
  addRehaut,
  addRehautTag,
  addRehautView,
  briskRehaut,
  bulkFdpReview,
  bulkRehautCoffer,
  bulkRehautGraphite,
  bulkRehautRaise,
  bulkRehautTag,
  busiestKeeper,
  dropRehautView,
  editRehaut,
  editRehautNote,
  fdpBrief,
  fdpCopy,
  fdpDigit,
  fdpEven,
  fdpFamily,
  fdpFirst,
  fdpGap,
  fdpHeld,
  fdpAway,
  fdpHue,
  fdpJoin,
  fdpCitizen,
  fdpLane,
  fdpLanes,
  fdpLanesCsv,
  fdpLength,
  fdpLetter,
  fdpLower,
  fdpMixed,
  fdpOpen,
  fdpRowsCsv,
  fdpShare,
  fdpSpace,
  fdpStamp,
  fdpTail,
  fdpUpper,
  fdpGuest,
  fdpVowel,
  fairKeeper,
  finishFocused,
  rehautBars,
  rehautCopy,
  rehautCounts,
  rehautCsv,
  rehautDensity,
  rehautInner,
  rehautOuter,
  rehautTimeline,
  rehautKeepers,
  idleRehaut,
  laneFdpCount,
  lateRehaut,
  leadingFdp,
  leadingFdpHue,
  lowerHourFocused,
  lowerHammerFocused,
  moveRehautFocus,
  overdueRehaut,
  pinRehautFocused,
  presentFdpLanes,
  raiseHourFocused,
  raiseHammerFocused,
  readHiddenFdp,
  readRehauts,
  readRehautViews,
  readReviewedFdp,
  reminderRehauts,
  restingRehaut,
  setRehautCoffer,
  setRehautFilm,
  setRehautFocused,
  setRehautPin,
  setRehautRaised,
  setRehautStar,
  sortRehauts,
  starRehautFocused,
  suggestHour,
  suggestFinish,
  suggestMode,
  toggleFdp,
  toggleFdpReview,
  visibleFdp,
  visibleFdpLanes,
  visibleRehauts,
  type FdpReview,
  type FdpRow,
  type FdpShape,
  type FdpValue,
  type Rehaut,
  type RehautDensity,
  type RehautSort,
  type RehautTray,
  type RehautView,
} from "@/lib/crmv4/round351";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["GILT", "IVORY", "GRAPHITE"] as const;
const DROPS = ["5", "10", "20", "40"] as const;
const LOCKS = ["2", "4", "8"] as const;

const PIECE_KEY: Record<string, CrmV4CopyKey> = {
  chapter: "rhtChapter",
  minute: "rhtMinute",
  railroad: "rhtRailroad",
  pulse: "rhtPulse",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "rhtAuditSave",
  edit: "rhtAuditEdit",
  note: "rhtAuditNote",
  film: "rhtAuditFilm",
  poise: "rhtAuditPoise",
  free: "rhtAuditFree",
  peg: "rhtAuditPeg",
  return: "rhtAuditReturn",
  coffer: "rhtAuditCoffer",
  open: "rhtAuditOpen",
  tag: "rhtAuditTag",
  lock: "rhtAuditRate",
  drop: "rhtAuditStep",
  lower: "rhtAuditLower",
  star: "rhtAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  funded: "fdpLaneFunded",
  vacant: "fdpLaneVacant",
  hold: "fdpLaneHold",
  demo: "fdpLaneDemo",
  join: "fdpJoin",
  gap: "fdpGap",
  brief: "fdpBrief",
  long: "fdpLong",
  stamp: "fdpStampLane",
  vowel: "fdpVowel",
  plain: "fdpPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "fdpChampagne",
  ivory: "fdpIvory",
  graphite: "fdpGraphite",
};

const SHAPE_KEY: Record<FdpShape, CrmV4CopyKey> = {
  all: "fdpShapeAll",
  funded: "fdpShapeFunded",
  vacant: "fdpShapeVacant",
  hold: "fdpShapeHold",
  demo: "fdpShapeDemo",
  join: "fdpShapeJoin",
  gap: "fdpShapeGap",
  brief: "fdpShapeBrief",
  long: "fdpShapeLong",
  stamp: "fdpShapeStamp",
  vowel: "fdpShapeVowel",
  plain: "fdpShapePlain",
  open: "fdpShapeOpen",
  soon: "fdpShapeOpen",
  letter: "fdpShapePlain",
  mixed: "fdpShapeStamp",
  upper: "fdpShapeFunded",
  lower: "fdpShapePlain",
  space: "fdpShapeGap",
  even: "fdpShapeEven",
  odd: "fdpShapeEven",
  tail: "fdpShapeStamp",
  first: "fdpShapePlain",
  held: "fdpShapeLong",
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
  return key ? v4(key) : v4("rhtBlankPiece");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "GILT") return v4("rhtGilt");
  if (film === "IVORY") return v4("rhtIvory");
  if (film === "GRAPHITE") return v4("rhtGraphite");
  return v4("rhtAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("fdpBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("fdpBlank");
}

export function RehautRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Rehaut[]>([]);
  const [views, setViews] = useState<RehautView[]>([]);
  const [density, setDensity] = useState<RehautDensity>("airy");
  const [tray, setTray] = useState<RehautTray>("board");
  const [query, setQuery] = useState("");
  const [setterFilter, setSetterFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [pieceFilter, setPieceFilter] = useState("all");
  const [dropFilter, setDropFilter] = useState("all");
  const [lockFilter, setLockFilter] = useState("all");
  const [sort, setSort] = useState<RehautSort>("piece");
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
  const [station, setStation] = useState("chapter");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readRehauts(readJson(RHT_KEY, [])));
    setViews(readRehautViews(readJson(RHT_VIEW_KEY, [])));
    setDensity(rehautDensity(readJson(RHT_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Rehaut[]) {
    setCards(next);
    writeJson(RHT_KEY, next);
  }
  function storeViews(next: RehautView[]) {
    setViews(next);
    writeJson(RHT_VIEW_KEY, next);
  }
  function storeDensity(next: RehautDensity) {
    setDensity(next);
    writeJson(RHT_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortRehauts(visibleRehauts(cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter), sort),
    [cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter, sort],
  );
  const counts = rehautCounts(cards, shown, station);
  const bars = rehautBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = rehautTimeline(cards);
  const reminders = reminderRehauts(cards);
  const poisers = rehautKeepers(cards);
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
        download("rehaut-rules.csv", rehautCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveRehautFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveRehautFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addRehaut(cards, { title, note, setter: setter, piece, drop: dropNo, film, lock: lockNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-rehaut" aria-label={v4("rhtTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-rehaut-mast">
        <p className="c4-rehaut-seal" data-logo="mono">{v4("rhtLogo")}</p>
        <div>
          <p className="c4-rehaut-kicker">{v4("rhtSub")}</p>
          <h2 className="c4-title">{v4("rhtTitle")}</h2>
        </div>
        <p className="c4-rehaut-count">{shown.length}</p>
      </header>
      <p className="c4-rehaut-links">
        <Link href={crmv4Href(base, "fdp")}>{v4("fdpTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("rhtCustomers")}</Link>
      </p>
      <p className="c4-rehaut-hint">{v4("rhtHint")}</p>
      {viewer && <p className="c4-rehaut-note">{v4("rhtViewer")}</p>}
      <p className="c4-rehaut-meta">{v4("rhtFair")} {fair || "—"} · {v4("rhtBusy")} {busy || "—"} · {v4("rhtSuggest")} {limbLabel(v4, suggestedLimb)} · {filmLabel(v4, suggestedFilm)} · {suggestedBeat}</p>
      <ol className="c4-rehaut-index" aria-label={v4("rhtRemind")}>
        <li data-tone="gold">{v4("rhtOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("rhtIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("rhtBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("rhtResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-rehaut-remind c4-rehaut-notices" role="status" aria-label={v4("rhtRemind")}>
          {reminders.map((name) => <li key={name}>{v4("rhtOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-rehaut-chart" aria-label={v4("rhtChart")}>
        {bars.map((bar) => (
          <button key={bar.piece} type="button" className="c4-rehaut-column" data-on={pieceFilter === bar.piece ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === bar.piece ? "all" : bar.piece)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{limbLabel(v4, bar.piece)}</span>
          </button>
        ))}
      </div>
      <form className="c4-rehaut-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("rhtEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("rhtEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("rhtNote")}<input className="c4-field" aria-label={v4("rhtNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("rhtSetter")}<input className="c4-field" aria-label={v4("rhtSetter")} aria-required={false} value={setter} maxLength={24} disabled={viewer} onChange={(event) => setSetter(event.target.value)} /></label>
        <label className="c4-lab">{v4("rhtPiece")}<select className="c4-field" aria-label={v4("rhtPiece")} value={piece} disabled={viewer} onChange={(event) => setPiece(event.target.value)}><option value="">{v4("rhtBlankPiece")}</option>{RHT_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("rhtFilm")}<select className="c4-field" aria-label={v4("rhtFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("rhtAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("rhtDrop")}<select className="c4-field" aria-label={v4("rhtDrop")} value={dropNo} disabled={viewer} onChange={(event) => setDropNo(event.target.value)}><option value="">{v4("rhtAll")}</option>{DROPS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("rhtLock")}<select className="c4-field" aria-label={v4("rhtLock")} value={lockNo} disabled={viewer} onChange={(event) => setLockNo(event.target.value)}><option value="">{v4("rhtAll")}</option>{LOCKS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("rhtTag")}<input className="c4-field" aria-label={v4("rhtTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("rhtAdd")}</button>
      </form>
      <div className="c4-rehaut-tools">
        <input ref={searchRef} className="c4-field c4-rehaut-search" aria-label={v4("rhtSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("rhtSearch")} />
        {(["board", "peg", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "board" ? "rhtBoard" : item === "peg" ? "rhtPeg" : "rhtCoffer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={pieceFilter === "inner" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "inner" ? "all" : "inner")}>{v4("rhtInner")}</button>
        <button type="button" className="c4-chip" data-on={pieceFilter === "outer" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "outer" ? "all" : "outer")}>{v4("rhtOuter")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "setter" ? "1" : "0"} onClick={() => setSort(sort === "setter" ? "piece" : "setter")}>{sort === "setter" ? v4("rhtSortSetter") : v4("rhtSortLimb")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("rhtClose") : v4("rhtAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("rhtTimeline")}</button>
        <label className="c4-lab">{v4("rhtDesk")}<select className="c4-field" aria-label={v4("rhtDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{RHT_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-rehaut-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addRehautView(views, { id, name: viewName, tray, query, setter: setterFilter, film: filmFilter, piece: pieceFilter, drop: dropFilter, lock: lockFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("rhtViewName")}<input className="c4-field" aria-label={v4("rhtViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("rhtSaveView")}</button>
      </form>
      <ul className="c4-rehaut-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setSetterFilter(view.setter); setFilmFilter(view.film); setPieceFilter(view.piece); setDropFilter(view.drop); setLockFilter(view.lock); }}>{v4("rhtApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropRehautView(views, view.id))}>{v4("rhtDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-rehaut-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRehautRaise(cards, picked))}>{v4("rhtBulkPoise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRehautCoffer(cards, picked))}>{v4("rhtBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRehautGraphite(cards, picked))}>{v4("rhtBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRehautTag(cards, picked))}>{v4("rhtBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("rehaut-rules.csv", rehautCsv(shown, station))}>{v4("rhtCsv")}</button>
        <p className="c4-rehaut-meta">{v4("rhtKeys")} / n x a j k · {v4("rhtQuiet")} {counts.quiet} · {v4("rhtInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-rehaut-time" aria-label={v4("rhtTimeline")}>
          {timeline.map((mail) => <li key={mail.drop}><span>{mail.drop}</span> {mail.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("rhtEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-rehaut-list">
          {shown.map((card) => {
            const late = lateRehaut(card, station);
            return (
              <li key={card.id} className="c4-rehaut-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleRehaut(card) ? "1" : "0"} data-brisk={briskRehaut(card) ? "1" : "0"} data-overdue={overdueRehaut(card) ? "1" : "0"} data-resting={restingRehaut(card) ? "1" : "0"} data-inner={rehautInner(card.piece) ? "1" : "0"} data-outer={rehautOuter(card.piece) ? "1" : "0"}>
                <label className="c4-rehaut-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editRehaut(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("rhtEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("rhtApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editRehautNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("rhtNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-rehaut-meta">{limbLabel(v4, card.piece)} · {filmLabel(v4, card.film)} · {card.drop ?? "—"} · {card.lock} · {card.setter || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "rhtAuditSave")}` : ""}{late ? ` · ${v4("rhtOverdue")}` : ""}</p>
                </div>
                <div className="c4-rehaut-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("rhtEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRehautRaised(cards, card.id, !card.raised))}>{card.raised ? v4("rhtFree") : v4("rhtPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRehautFilm(cards, card.id, suggestedFilm))}>{v4("rhtSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRehautPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("rhtUnpeg") : v4("rhtPegIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRehautCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("rhtUncoffer") : v4("rhtCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRehautStar(cards, card.id, !card.starred))}>{card.starred ? v4("rhtUnstar") : v4("rhtStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addRehautTag(cards, card.id, "c"))}>{v4("rhtTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("rhtRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("rhtLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHammerFocused(cards, card.id))}>{v4("rhtLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHammerFocused(cards, card.id))}>{v4("rhtLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(finishFocused(cards, card.id))}>{v4("rhtFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRehautFocused(cards, card.id))}>{v4("rhtPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinRehautFocused(cards, card.id))}>{v4("rhtPeg")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starRehautFocused(cards, card.id))}>{v4("rhtStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(rehautCopy(card))}>{v4("rhtCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}


type FdpUser = { id?: string; name?: string | null; ftd?: string | null };

export function FirstTradePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: FdpUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<FdpShape>("all");
  const [review, setReview] = useState<FdpReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): FdpRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { ftd: textField(row.ftd) } satisfies FdpValue,
    };
  }).filter((row): row is FdpRow => Boolean(row));
  const present = presentFdpLanes(rows);
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
    const next = readHiddenFdp(readJson(FDP_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(FDP_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedFdp(readJson(FDP_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(FDP_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleFdpLanes(present, hidden, showHidden);
  const shown = visibleFdp(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = fdpLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = fdpLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingFdp(rows);
  const leadHue = leadingFdpHue(rows);
  const whole = rows.filter((row) => fdpLane(row.code)).length;
  const share = fdpShare(laneFdpCount(rows, "funded"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("first-trade-plates.csv", fdpLanesCsv(rows));
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
    writeJson(FDP_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(FDP_REVIEW_KEY, next);
  }

  return (
    <section className="c4-fdpplate" aria-label={v4("fdpTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-fdpplate-mast">
        <p className="c4-fdpplate-seal" data-logo="mono">{v4("fdpLogo")}</p>
        <div>
          <p className="c4-fdpplate-kicker">{v4("fdpSub")}</p>
          <h2 className="c4-title">{v4("fdpTitle")}</h2>
        </div>
        <p className="c4-fdpplate-count">{shown.length}</p>
      </header>
      <p className="c4-fdpplate-links">
        <Link href={crmv4Href(base, "rht")}>{v4("rhtTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("fdpCustomer")}</Link>
      </p>
      <p className="c4-fdpplate-hint">{v4("fdpHint")}</p>
      {viewer && <p className="c4-fdpplate-note">{v4("fdpViewer")}</p>}
      <p className="c4-fdpplate-meta">{v4("fdpLead")} {laneLabel(v4, lead)} · {v4("fdpToneLead")} {hueLabel(v4, leadHue)} · {v4("fdpShare")} {share}</p>
      <div className="c4-fdpplate-chart" aria-label={v4("fdpChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-fdpplate-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-fdpplate-tools">
        <input ref={searchRef} className="c4-field c4-fdpplate-search" aria-label={v4("fdpSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("fdpSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("fdpShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "fdpAll" : item === "reviewed" ? "fdpReviewed" : "fdpFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("fdpAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as FdpShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleFdp(hidden, item))}>{hidden.includes(item) ? v4("fdpShow") : v4("fdpHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-fdpplate-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkFdpReview(reviewed, picked, true))}>{v4("fdpBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkFdpReview(reviewed, picked, false))}>{v4("fdpBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("first-trade-lanes.csv", fdpLanesCsv(rows))}>{v4("fdpCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("first-trade-rows.csv", fdpRowsCsv(shown, reviewed))}>{v4("fdpRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("fdpLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("fdpFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("fdpEmpty")}</p>}
      <ul className="c4-fdpplate-list">
        {shown.map((row) => {
          const name = fdpCopy(row.code);
          const tone = fdpHue(row.code);
          return (
            <li key={row.id} className="c4-fdpplate-card" data-mail={fdpLane(row.code) || "open"} data-hue={tone || "none"} data-funded={fdpLane(row.code) === "funded" ? "1" : "0"} data-away={fdpAway(row.code) ? "1" : "0"} data-guest={fdpGuest(row.code) ? "1" : "0"} data-citizen={fdpCitizen(row.code) ? "1" : "0"} data-open={fdpOpen(row.code) ? "1" : "0"} data-even={fdpEven(row.code) ? "1" : "0"} data-digit={fdpDigit(row.code) ? "1" : "0"} data-letter={fdpLetter(row.code) ? "1" : "0"} data-mixed={fdpMixed(row.code) ? "1" : "0"} data-upper={fdpUpper(row.code) ? "1" : "0"} data-lower={fdpLower(row.code) ? "1" : "0"} data-space={fdpSpace(row.code) ? "1" : "0"} data-vowel={fdpVowel(row.code) ? "1" : "0"} data-tail={fdpTail(row.code) ? "1" : "0"} data-first={fdpFirst(row.code) ? "1" : "0"} data-held={fdpHeld(row.code) ? "1" : "0"} data-join={fdpJoin(row.code) ? "1" : "0"} data-gap={fdpGap(row.code) ? "1" : "0"} data-brief={fdpBrief(row.code) ? "1" : "0"}>
              <label className="c4-fdpplate-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-fdpplate-meta">{name || v4("fdpOpen")} · {fdpStamp(row.code) || "—"} · {fdpFamily(row.code) || "—"} · {fdpLength(row.code) ?? "—"} · {laneLabel(v4, fdpLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-fdpplate-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleFdpReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("fdpReviewed") : v4("fdpReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = fdpCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("fdpCopied") : v4("fdpCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("fdpCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
