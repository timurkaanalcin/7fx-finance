"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  AFC_KEY,
  AFC_REVIEW_KEY,
  TCH_DENSITY_KEY,
  TCH_KEY,
  TCH_MODES,
  TCH_VIEW_KEY,
  addTachymeter,
  addTachymeterTag,
  addTachymeterView,
  briskTachymeter,
  bulkAffiliateReview,
  bulkTachymeterCoffer,
  bulkTachymeterGraphite,
  bulkTachymeterRaise,
  bulkTachymeterTag,
  busiestKeeper,
  dropTachymeterView,
  editTachymeter,
  editTachymeterNote,
  affiliateBrief,
  affiliateCopy,
  affiliateDigit,
  affiliateEven,
  affiliateFamily,
  affiliateFirst,
  affiliateGap,
  affiliateHeld,
  affiliateAway,
  affiliateHue,
  affiliateJoin,
  affiliateCitizen,
  affiliateLane,
  affiliateLanes,
  affiliateLanesCsv,
  affiliateLength,
  affiliateLetter,
  affiliateLower,
  affiliateMixed,
  affiliateOpen,
  affiliateRowsCsv,
  affiliateShare,
  affiliateSpace,
  affiliateStamp,
  affiliateTail,
  affiliateUpper,
  affiliateGuest,
  affiliateVowel,
  fairKeeper,
  finishFocused,
  tachymeterBars,
  tachymeterCopy,
  tachymeterCounts,
  tachymeterCsv,
  tachymeterDensity,
  tachymeterInner,
  tachymeterOuter,
  tachymeterTimeline,
  tachymeterKeepers,
  idleTachymeter,
  laneAffiliateCount,
  lateTachymeter,
  leadingAffiliate,
  leadingAffiliateHue,
  lowerHourFocused,
  lowerHammerFocused,
  moveTachymeterFocus,
  overdueTachymeter,
  pinTachymeterFocused,
  presentAffiliateLanes,
  raiseHourFocused,
  raiseHammerFocused,
  readHiddenAffiliate,
  readTachymeters,
  readTachymeterViews,
  readReviewedAffiliate,
  reminderTachymeters,
  restingTachymeter,
  setTachymeterCoffer,
  setTachymeterFilm,
  setTachymeterFocused,
  setTachymeterPin,
  setTachymeterRaised,
  setTachymeterStar,
  sortTachymeters,
  starTachymeterFocused,
  suggestHour,
  suggestFinish,
  suggestMode,
  toggleAffiliate,
  toggleAffiliateReview,
  visibleAffiliate,
  visibleAffiliateLanes,
  visibleTachymeters,
  type AffiliateReview,
  type AffiliateRow,
  type AffiliateShape,
  type AffiliateValue,
  type Tachymeter,
  type TachymeterDensity,
  type TachymeterSort,
  type TachymeterTray,
  type TachymeterView,
} from "@/lib/crmv4/round349";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["GILT", "IVORY", "GRAPHITE"] as const;
const DROPS = ["5", "15", "30", "60"] as const;
const LOCKS = ["2", "4", "8"] as const;

const PIECE_KEY: Record<string, CrmV4CopyKey> = {
  scale: "tchScale",
  spiral: "tchSpiral",
  pulse: "tchPulse",
  mile: "tchMile",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "tchAuditSave",
  edit: "tchAuditEdit",
  note: "tchAuditNote",
  film: "tchAuditFilm",
  poise: "tchAuditPoise",
  free: "tchAuditFree",
  peg: "tchAuditPeg",
  return: "tchAuditReturn",
  coffer: "tchAuditCoffer",
  open: "tchAuditOpen",
  tag: "tchAuditTag",
  lock: "tchAuditRate",
  drop: "tchAuditBeat",
  lower: "tchAuditLower",
  star: "tchAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  web: "afcLaneWeb",
  desk: "afcLaneDesk",
  mail: "afcLaneMail",
  fair: "afcLaneFair",
  join: "afcJoin",
  gap: "afcGap",
  brief: "afcBrief",
  long: "afcLong",
  mark: "afcMark",
  vowel: "afcVowel",
  plain: "afcPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "afcChampagne",
  ivory: "afcIvory",
  graphite: "afcGraphite",
};

const SHAPE_KEY: Record<AffiliateShape, CrmV4CopyKey> = {
  all: "afcShapeAll",
  web: "afcShapeWeb",
  desk: "afcShapeDesk",
  mail: "afcShapeMail",
  fair: "afcShapeFair",
  join: "afcShapeJoin",
  gap: "afcShapeGap",
  brief: "afcShapeBrief",
  long: "afcShapeLong",
  mark: "afcShapeMark",
  vowel: "afcShapeVowel",
  plain: "afcShapePlain",
  open: "afcShapeOpen",
  soon: "afcShapeOpen",
  letter: "afcShapePlain",
  mixed: "afcShapeMark",
  upper: "afcShapeWeb",
  lower: "afcShapePlain",
  space: "afcShapeGap",
  even: "afcShapeEven",
  odd: "afcShapeEven",
  tail: "afcShapeMark",
  first: "afcShapePlain",
  held: "afcShapeLong",
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
  return key ? v4(key) : v4("tchBlankPiece");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "GILT") return v4("tchGilt");
  if (film === "IVORY") return v4("tchIvory");
  if (film === "GRAPHITE") return v4("tchGraphite");
  return v4("tchAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("afcBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("afcBlank");
}

export function TachymeterRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Tachymeter[]>([]);
  const [views, setViews] = useState<TachymeterView[]>([]);
  const [density, setDensity] = useState<TachymeterDensity>("airy");
  const [tray, setTray] = useState<TachymeterTray>("board");
  const [query, setQuery] = useState("");
  const [setterFilter, setSetterFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [pieceFilter, setPieceFilter] = useState("all");
  const [dropFilter, setDropFilter] = useState("all");
  const [lockFilter, setLockFilter] = useState("all");
  const [sort, setSort] = useState<TachymeterSort>("piece");
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
  const [station, setStation] = useState("scale");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readTachymeters(readJson(TCH_KEY, [])));
    setViews(readTachymeterViews(readJson(TCH_VIEW_KEY, [])));
    setDensity(tachymeterDensity(readJson(TCH_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Tachymeter[]) {
    setCards(next);
    writeJson(TCH_KEY, next);
  }
  function storeViews(next: TachymeterView[]) {
    setViews(next);
    writeJson(TCH_VIEW_KEY, next);
  }
  function storeDensity(next: TachymeterDensity) {
    setDensity(next);
    writeJson(TCH_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortTachymeters(visibleTachymeters(cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter), sort),
    [cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter, sort],
  );
  const counts = tachymeterCounts(cards, shown, station);
  const bars = tachymeterBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = tachymeterTimeline(cards);
  const reminders = reminderTachymeters(cards);
  const poisers = tachymeterKeepers(cards);
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
        download("tachymeter-rules.csv", tachymeterCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveTachymeterFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveTachymeterFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addTachymeter(cards, { title, note, setter: setter, piece, drop: dropNo, film, lock: lockNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-tachymeter" aria-label={v4("tchTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-tachymeter-mast">
        <p className="c4-tachymeter-seal" data-logo="mono">{v4("tchLogo")}</p>
        <div>
          <p className="c4-tachymeter-kicker">{v4("tchSub")}</p>
          <h2 className="c4-title">{v4("tchTitle")}</h2>
        </div>
        <p className="c4-tachymeter-count">{shown.length}</p>
      </header>
      <p className="c4-tachymeter-links">
        <Link href={crmv4Href(base, "afc")}>{v4("afcTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("tchCustomers")}</Link>
      </p>
      <p className="c4-tachymeter-hint">{v4("tchHint")}</p>
      {viewer && <p className="c4-tachymeter-note">{v4("tchViewer")}</p>}
      <p className="c4-tachymeter-meta">{v4("tchFair")} {fair || "—"} · {v4("tchBusy")} {busy || "—"} · {v4("tchSuggest")} {limbLabel(v4, suggestedLimb)} · {filmLabel(v4, suggestedFilm)} · {suggestedBeat}</p>
      <ol className="c4-tachymeter-index" aria-label={v4("tchRemind")}>
        <li data-tone="gold">{v4("tchOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("tchIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("tchBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("tchResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-tachymeter-remind c4-tachymeter-notices" role="status" aria-label={v4("tchRemind")}>
          {reminders.map((name) => <li key={name}>{v4("tchOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-tachymeter-chart" aria-label={v4("tchChart")}>
        {bars.map((bar) => (
          <button key={bar.piece} type="button" className="c4-tachymeter-column" data-on={pieceFilter === bar.piece ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === bar.piece ? "all" : bar.piece)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{limbLabel(v4, bar.piece)}</span>
          </button>
        ))}
      </div>
      <form className="c4-tachymeter-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("tchEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("tchEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("tchNote")}<input className="c4-field" aria-label={v4("tchNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("tchSetter")}<input className="c4-field" aria-label={v4("tchSetter")} aria-required={false} value={setter} maxLength={24} disabled={viewer} onChange={(event) => setSetter(event.target.value)} /></label>
        <label className="c4-lab">{v4("tchPiece")}<select className="c4-field" aria-label={v4("tchPiece")} value={piece} disabled={viewer} onChange={(event) => setPiece(event.target.value)}><option value="">{v4("tchBlankPiece")}</option>{TCH_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("tchFilm")}<select className="c4-field" aria-label={v4("tchFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("tchAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("tchDrop")}<select className="c4-field" aria-label={v4("tchDrop")} value={dropNo} disabled={viewer} onChange={(event) => setDropNo(event.target.value)}><option value="">{v4("tchAll")}</option>{DROPS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("tchLock")}<select className="c4-field" aria-label={v4("tchLock")} value={lockNo} disabled={viewer} onChange={(event) => setLockNo(event.target.value)}><option value="">{v4("tchAll")}</option>{LOCKS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("tchTag")}<input className="c4-field" aria-label={v4("tchTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("tchAdd")}</button>
      </form>
      <div className="c4-tachymeter-tools">
        <input ref={searchRef} className="c4-field c4-tachymeter-search" aria-label={v4("tchSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("tchSearch")} />
        {(["board", "peg", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "board" ? "tchBoard" : item === "peg" ? "tchPeg" : "tchCoffer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={pieceFilter === "inner" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "inner" ? "all" : "inner")}>{v4("tchInner")}</button>
        <button type="button" className="c4-chip" data-on={pieceFilter === "outer" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "outer" ? "all" : "outer")}>{v4("tchOuter")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "setter" ? "1" : "0"} onClick={() => setSort(sort === "setter" ? "piece" : "setter")}>{sort === "setter" ? v4("tchSortSetter") : v4("tchSortLimb")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("tchClose") : v4("tchAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("tchTimeline")}</button>
        <label className="c4-lab">{v4("tchDesk")}<select className="c4-field" aria-label={v4("tchDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{TCH_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-tachymeter-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addTachymeterView(views, { id, name: viewName, tray, query, setter: setterFilter, film: filmFilter, piece: pieceFilter, drop: dropFilter, lock: lockFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("tchViewName")}<input className="c4-field" aria-label={v4("tchViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("tchSaveView")}</button>
      </form>
      <ul className="c4-tachymeter-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setSetterFilter(view.setter); setFilmFilter(view.film); setPieceFilter(view.piece); setDropFilter(view.drop); setLockFilter(view.lock); }}>{v4("tchApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropTachymeterView(views, view.id))}>{v4("tchDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-tachymeter-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTachymeterRaise(cards, picked))}>{v4("tchBulkPoise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTachymeterCoffer(cards, picked))}>{v4("tchBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTachymeterGraphite(cards, picked))}>{v4("tchBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTachymeterTag(cards, picked))}>{v4("tchBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("tachymeter-rules.csv", tachymeterCsv(shown, station))}>{v4("tchCsv")}</button>
        <p className="c4-tachymeter-meta">{v4("tchKeys")} / n x a j k · {v4("tchQuiet")} {counts.quiet} · {v4("tchInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-tachymeter-time" aria-label={v4("tchTimeline")}>
          {timeline.map((mail) => <li key={mail.drop}><span>{mail.drop}</span> {mail.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("tchEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-tachymeter-list">
          {shown.map((card) => {
            const late = lateTachymeter(card, station);
            return (
              <li key={card.id} className="c4-tachymeter-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleTachymeter(card) ? "1" : "0"} data-brisk={briskTachymeter(card) ? "1" : "0"} data-overdue={overdueTachymeter(card) ? "1" : "0"} data-resting={restingTachymeter(card) ? "1" : "0"} data-inner={tachymeterInner(card.piece) ? "1" : "0"} data-outer={tachymeterOuter(card.piece) ? "1" : "0"}>
                <label className="c4-tachymeter-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editTachymeter(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("tchEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("tchApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editTachymeterNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("tchNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-tachymeter-meta">{limbLabel(v4, card.piece)} · {filmLabel(v4, card.film)} · {card.drop ?? "—"} · {card.lock} · {card.setter || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "tchAuditSave")}` : ""}{late ? ` · ${v4("tchOverdue")}` : ""}</p>
                </div>
                <div className="c4-tachymeter-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("tchEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTachymeterRaised(cards, card.id, !card.raised))}>{card.raised ? v4("tchFree") : v4("tchPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTachymeterFilm(cards, card.id, suggestedFilm))}>{v4("tchSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTachymeterPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("tchUnpeg") : v4("tchPegIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTachymeterCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("tchUncoffer") : v4("tchCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTachymeterStar(cards, card.id, !card.starred))}>{card.starred ? v4("tchUnstar") : v4("tchStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addTachymeterTag(cards, card.id, "s"))}>{v4("tchTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("tchRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("tchLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHammerFocused(cards, card.id))}>{v4("tchLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHammerFocused(cards, card.id))}>{v4("tchLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(finishFocused(cards, card.id))}>{v4("tchFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTachymeterFocused(cards, card.id))}>{v4("tchPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinTachymeterFocused(cards, card.id))}>{v4("tchPeg")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starTachymeterFocused(cards, card.id))}>{v4("tchStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(tachymeterCopy(card))}>{v4("tchCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}


type AffiliateUser = { id?: string; name?: string | null; affiliateC?: string | null };

export function AffiliatePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: AffiliateUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<AffiliateShape>("all");
  const [review, setReview] = useState<AffiliateReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): AffiliateRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { affiliateC: textField(row.affiliateC) } satisfies AffiliateValue,
    };
  }).filter((row): row is AffiliateRow => Boolean(row));
  const present = presentAffiliateLanes(rows);
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
    const next = readHiddenAffiliate(readJson(AFC_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(AFC_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedAffiliate(readJson(AFC_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(AFC_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleAffiliateLanes(present, hidden, showHidden);
  const shown = visibleAffiliate(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = affiliateLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = affiliateLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingAffiliate(rows);
  const leadHue = leadingAffiliateHue(rows);
  const whole = rows.filter((row) => affiliateLane(row.code)).length;
  const share = affiliateShare(laneAffiliateCount(rows, "web"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("affiliate-plates.csv", affiliateLanesCsv(rows));
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
    writeJson(AFC_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(AFC_REVIEW_KEY, next);
  }

  return (
    <section className="c4-afcplate" aria-label={v4("afcTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-afcplate-mast">
        <p className="c4-afcplate-seal" data-logo="mono">{v4("afcLogo")}</p>
        <div>
          <p className="c4-afcplate-kicker">{v4("afcSub")}</p>
          <h2 className="c4-title">{v4("afcTitle")}</h2>
        </div>
        <p className="c4-afcplate-count">{shown.length}</p>
      </header>
      <p className="c4-afcplate-links">
        <Link href={crmv4Href(base, "tch")}>{v4("tchTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("afcCustomer")}</Link>
      </p>
      <p className="c4-afcplate-hint">{v4("afcHint")}</p>
      {viewer && <p className="c4-afcplate-note">{v4("afcViewer")}</p>}
      <p className="c4-afcplate-meta">{v4("afcLead")} {laneLabel(v4, lead)} · {v4("afcToneLead")} {hueLabel(v4, leadHue)} · {v4("afcShare")} {share}</p>
      <div className="c4-afcplate-chart" aria-label={v4("afcChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-afcplate-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-afcplate-tools">
        <input ref={searchRef} className="c4-field c4-afcplate-search" aria-label={v4("afcSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("afcSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("afcShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "afcAll" : item === "reviewed" ? "afcReviewed" : "afcFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("afcAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as AffiliateShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleAffiliate(hidden, item))}>{hidden.includes(item) ? v4("afcShow") : v4("afcHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-afcplate-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkAffiliateReview(reviewed, picked, true))}>{v4("afcBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkAffiliateReview(reviewed, picked, false))}>{v4("afcBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("affiliate-lanes.csv", affiliateLanesCsv(rows))}>{v4("afcCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("affiliate-rows.csv", affiliateRowsCsv(shown, reviewed))}>{v4("afcRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("afcLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("afcFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("afcEmpty")}</p>}
      <ul className="c4-afcplate-list">
        {shown.map((row) => {
          const name = affiliateCopy(row.code);
          const tone = affiliateHue(row.code);
          return (
            <li key={row.id} className="c4-afcplate-card" data-mail={affiliateLane(row.code) || "open"} data-hue={tone || "none"} data-lang-mark={affiliateLane(row.code) === "web" ? "1" : "0"} data-away={affiliateAway(row.code) ? "1" : "0"} data-guest={affiliateGuest(row.code) ? "1" : "0"} data-citizen={affiliateCitizen(row.code) ? "1" : "0"} data-open={affiliateOpen(row.code) ? "1" : "0"} data-even={affiliateEven(row.code) ? "1" : "0"} data-digit={affiliateDigit(row.code) ? "1" : "0"} data-letter={affiliateLetter(row.code) ? "1" : "0"} data-mixed={affiliateMixed(row.code) ? "1" : "0"} data-upper={affiliateUpper(row.code) ? "1" : "0"} data-lower={affiliateLower(row.code) ? "1" : "0"} data-space={affiliateSpace(row.code) ? "1" : "0"} data-vowel={affiliateVowel(row.code) ? "1" : "0"} data-tail={affiliateTail(row.code) ? "1" : "0"} data-first={affiliateFirst(row.code) ? "1" : "0"} data-held={affiliateHeld(row.code) ? "1" : "0"} data-join={affiliateJoin(row.code) ? "1" : "0"} data-gap={affiliateGap(row.code) ? "1" : "0"} data-brief={affiliateBrief(row.code) ? "1" : "0"}>
              <label className="c4-afcplate-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-afcplate-meta">{name || v4("afcOpen")} · {affiliateStamp(row.code) || "—"} · {affiliateFamily(row.code) || "—"} · {affiliateLength(row.code) ?? "—"} · {laneLabel(v4, affiliateLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-afcplate-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleAffiliateReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("afcReviewed") : v4("afcReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = affiliateCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("afcCopied") : v4("afcCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("afcCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
