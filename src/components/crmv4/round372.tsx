"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  KPR_KEY,
  KPR_REVIEW_KEY,
  GRN_DENSITY_KEY,
  GRN_KEY,
  GRN_MODES,
  GRN_VIEW_KEY,
  addGranule,
  addGranuleTag,
  addGranuleView,
  briskGranule,
  bulkSelReview,
  bulkGranuleCoffer,
  bulkGranuleSoot,
  bulkGranuleRaise,
  bulkGranuleTag,
  busiestKeeper,
  dropGranuleView,
  editGranule,
  editGranuleNote,
  kprBrief,
  kprCopy,
  kprDigit,
  kprEven,
  kprFamily,
  kprFirst,
  kprRoute,
  kprHeld,
  kprAway,
  kprHue,
  kprJoin,
  kprCitizen,
  kprLane,
  kprLanes,
  kprLanesCsv,
  kprLength,
  kprLetter,
  kprLower,
  kprMixed,
  kprOpen,
  kprRowsCsv,
  kprShare,
  kprSpace,
  kprStamp,
  kprTail,
  kprUpper,
  kprGuest,
  kprVowel,
  fairKeeper,
  finishFocused,
  granuleBars,
  granuleCopy,
  granuleCounts,
  granuleCsv,
  granuleDensity,
  granuleInner,
  granuleOuter,
  granuleTimeline,
  granuleKeepers,
  idleGranule,
  laneSelCount,
  lateGranule,
  leadingSel,
  leadingSelHue,
  lowerHourFocused,
  lowerHammerFocused,
  moveGranuleFocus,
  overdueGranule,
  pinGranuleFocused,
  presentSelLanes,
  raiseHourFocused,
  raiseHammerFocused,
  readHiddenSel,
  readGranuleCards,
  readGranuleViews,
  readReviewedSel,
  reminderGranuleCards,
  restingGranule,
  setGranuleCoffer,
  setGranuleFilm,
  setGranuleFocused,
  setGranulePin,
  setGranuleRaised,
  setGranuleStar,
  sortGranuleCards,
  starGranuleFocused,
  suggestHour,
  suggestFinish,
  suggestMode,
  toggleSel,
  toggleSelReview,
  visibleSel,
  visibleSelLanes,
  visibleGranuleCards,
  type KprReview,
  type KprRow,
  type KprShape,
  type KprValue,
  type Granule,
  type GranuleDensity,
  type GranuleSort,
  type GranuleTray,
  type GranuleView,
} from "@/lib/crmv4/round372";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["BLOOM", "PEARL", "SOOT"] as const;
const DROPS = ["3", "6", "12", "24"] as const;
const LOCKS = ["3", "6", "9"] as const;

const PIECE_KEY: Record<string, CrmV4CopyKey> = {
  seed: "grnSeed",
  ring: "grnRing",
  field: "grnField",
  rim: "grnRim",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "grnAuditSave",
  edit: "grnAuditEdit",
  note: "grnAuditNote",
  film: "grnAuditFilm",
  poise: "grnAuditPoise",
  free: "grnAuditFree",
  peg: "grnAuditPeg",
  return: "grnAuditReturn",
  coffer: "grnAuditCoffer",
  open: "grnAuditOpen",
  tag: "grnAuditTag",
  lock: "grnAuditRate",
  drop: "grnAuditStep",
  lower: "grnAuditLower",
  star: "grnAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  hall: "kprLaneHall",
  vacant: "kprLaneVacant",
  hold: "kprLaneHold",
  desk: "kprLaneDesk",
  guest: "kprLaneGuest",
  join: "kprJoin",
  route: "kprRoute",
  brief: "kprBrief",
  long: "kprLong",
  stamp: "kprStampLane",
  vowel: "kprVowel",
  plain: "kprPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "kprChampagne",
  ivory: "kprIvory",
  graphite: "kprGraphite",
};

const SHAPE_KEY: Record<KprShape, CrmV4CopyKey> = {
  all: "kprShapeAll",
  hall: "kprShapeHall",
  vacant: "kprShapeVacant",
  hold: "kprShapeHold",
  guest: "kprShapeGuest",
  join: "kprShapeJoin",
  route: "kprShapeRoute",
  brief: "kprShapeBrief",
  long: "kprShapeLong",
  stamp: "kprShapeStamp",
  vowel: "kprShapeVowel",
  plain: "kprShapePlain",
  open: "kprShapeOpen",
  soon: "kprShapeOpen",
  letter: "kprShapePlain",
  mixed: "kprShapeStamp",
  upper: "kprShapeUpper",
  lower: "kprShapePlain",
  space: "kprShapeSpace",
  even: "kprShapeEven",
  odd: "kprShapeEven",
  tail: "kprShapeStamp",
  first: "kprShapePlain",
  held: "kprShapeLong",
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
  return key ? v4(key) : v4("grnBlankPiece");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "BLOOM") return v4("grnBloom");
  if (film === "PEARL") return v4("grnPearl");
  if (film === "SOOT") return v4("grnSoot");
  return v4("grnAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("kprBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("kprBlank");
}

export function GranulationNests({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Granule[]>([]);
  const [views, setViews] = useState<GranuleView[]>([]);
  const [density, setDensity] = useState<GranuleDensity>("open");
  const [tray, setTray] = useState<GranuleTray>("board");
  const [query, setQuery] = useState("");
  const [setterFilter, setSetterFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [pieceFilter, setPieceFilter] = useState("all");
  const [dropFilter, setDropFilter] = useState("all");
  const [lockFilter, setLockFilter] = useState("all");
  const [sort, setSort] = useState<GranuleSort>("piece");
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
  const [station, setStation] = useState("seed");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readGranuleCards(readJson(GRN_KEY, [])));
    setViews(readGranuleViews(readJson(GRN_VIEW_KEY, [])));
    setDensity(granuleDensity(readJson(GRN_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Granule[]) {
    setCards(next);
    writeJson(GRN_KEY, next);
  }
  function storeViews(next: GranuleView[]) {
    setViews(next);
    writeJson(GRN_VIEW_KEY, next);
  }
  function storeDensity(next: GranuleDensity) {
    setDensity(next);
    writeJson(GRN_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortGranuleCards(visibleGranuleCards(cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter), sort),
    [cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter, sort],
  );
  const counts = granuleCounts(cards, shown, station);
  const bars = granuleBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = granuleTimeline(cards);
  const reminders = reminderGranuleCards(cards);
  const poisers = granuleKeepers(cards);
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
        download("granulation-nests.csv", granuleCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveGranuleFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveGranuleFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addGranule(cards, { title, note, setter: setter, piece, drop: dropNo, film, lock: lockNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-granule" aria-label={v4("grnTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-granule-mast">
        <p className="c4-granule-seal" data-logo="mono">{v4("grnLogo")}</p>
        <div>
          <p className="c4-granule-kicker">{v4("grnSub")}</p>
          <h2 className="c4-title">{v4("grnTitle")}</h2>
        </div>
        <p className="c4-granule-count">{shown.length}</p>
      </header>
      <p className="c4-granule-links">
        <Link href={crmv4Href(base, "kpr")}>{v4("kprTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("grnCustomers")}</Link>
      </p>
      <p className="c4-granule-hint">{v4("grnHint")}</p>
      {viewer && <p className="c4-granule-note">{v4("grnViewer")}</p>}
      <p className="c4-granule-meta">{v4("grnFair")} {fair || "—"} · {v4("grnBusy")} {busy || "—"} · {v4("grnSuggest")} {limbLabel(v4, suggestedLimb)} · {filmLabel(v4, suggestedFilm)} · {suggestedBeat}</p>
      <ol className="c4-granule-index" aria-label={v4("grnRemind")}>
        <li data-tone="gold">{v4("grnOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("grnIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("grnBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("grnResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-granule-remind c4-granule-notices" role="status" aria-label={v4("grnRemind")}>
          {reminders.map((name) => <li key={name}>{v4("grnOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-granule-chart" aria-label={v4("grnChart")}>
        {bars.map((bar) => (
          <button key={bar.piece} type="button" className="c4-granule-column" data-on={pieceFilter === bar.piece ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === bar.piece ? "all" : bar.piece)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{limbLabel(v4, bar.piece)}</span>
          </button>
        ))}
      </div>
      <form className="c4-granule-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("grnEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("grnEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("grnNote")}<input className="c4-field" aria-label={v4("grnNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("grnSetter")}<input className="c4-field" aria-label={v4("grnSetter")} aria-required={false} value={setter} maxLength={24} disabled={viewer} onChange={(event) => setSetter(event.target.value)} /></label>
        <label className="c4-lab">{v4("grnPiece")}<select className="c4-field" aria-label={v4("grnPiece")} value={piece} disabled={viewer} onChange={(event) => setPiece(event.target.value)}><option value="">{v4("grnBlankPiece")}</option>{GRN_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("grnFilm")}<select className="c4-field" aria-label={v4("grnFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("grnAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("grnDrop")}<select className="c4-field" aria-label={v4("grnDrop")} value={dropNo} disabled={viewer} onChange={(event) => setDropNo(event.target.value)}><option value="">{v4("grnAll")}</option>{DROPS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("grnLock")}<select className="c4-field" aria-label={v4("grnLock")} value={lockNo} disabled={viewer} onChange={(event) => setLockNo(event.target.value)}><option value="">{v4("grnAll")}</option>{LOCKS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("grnTag")}<input className="c4-field" aria-label={v4("grnTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("grnAdd")}</button>
      </form>
      <div className="c4-granule-tools">
        <input ref={searchRef} className="c4-field c4-granule-search" aria-label={v4("grnSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("grnSearch")} />
        {(["board", "peg", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "board" ? "grnBoard" : item === "peg" ? "grnPeg" : "grnCoffer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={pieceFilter === "inner" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "inner" ? "all" : "inner")}>{v4("grnInner")}</button>
        <button type="button" className="c4-chip" data-on={pieceFilter === "outer" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "outer" ? "all" : "outer")}>{v4("grnOuter")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "setter" ? "1" : "0"} onClick={() => setSort(sort === "setter" ? "piece" : "setter")}>{sort === "setter" ? v4("grnSortSetter") : v4("grnSortLimb")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("grnTight") : v4("grnOpen")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("grnTimeline")}</button>
        <label className="c4-lab">{v4("grnDesk")}<select className="c4-field" aria-label={v4("grnDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{GRN_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-granule-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addGranuleView(views, { id, name: viewName, tray, query, setter: setterFilter, film: filmFilter, piece: pieceFilter, drop: dropFilter, lock: lockFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("grnViewName")}<input className="c4-field" aria-label={v4("grnViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("grnSaveView")}</button>
      </form>
      <ul className="c4-granule-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setSetterFilter(view.setter); setFilmFilter(view.film); setPieceFilter(view.piece); setDropFilter(view.drop); setLockFilter(view.lock); }}>{v4("grnApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropGranuleView(views, view.id))}>{v4("grnDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-granule-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkGranuleRaise(cards, picked))}>{v4("grnBulkPoise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkGranuleCoffer(cards, picked))}>{v4("grnBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkGranuleSoot(cards, picked))}>{v4("grnBulkSoot")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkGranuleTag(cards, picked))}>{v4("grnBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("granulation-nests.csv", granuleCsv(shown, station))}>{v4("grnCsv")}</button>
        <p className="c4-granule-meta">{v4("grnKeys")} / c x a j k · {v4("grnQuiet")} {counts.quiet} · {v4("grnInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-granule-time" aria-label={v4("grnTimeline")}>
          {timeline.map((mail) => <li key={mail.drop}><span>{mail.drop}</span> {mail.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("grnEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-granule-list">
          {shown.map((card) => {
            const late = lateGranule(card, station);
            return (
              <li key={card.id} className="c4-granule-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleGranule(card) ? "1" : "0"} data-brisk={briskGranule(card) ? "1" : "0"} data-overdue={overdueGranule(card) ? "1" : "0"} data-resting={restingGranule(card) ? "1" : "0"} data-inner={granuleInner(card.piece) ? "1" : "0"} data-outer={granuleOuter(card.piece) ? "1" : "0"}>
                <label className="c4-granule-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editGranule(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("grnEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("grnApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editGranuleNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("grnNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-granule-meta">{limbLabel(v4, card.piece)} · {filmLabel(v4, card.film)} · {card.drop ?? "—"} · {card.lock} · {card.setter || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "grnAuditSave")}` : ""}{late ? ` · ${v4("grnOverdue")}` : ""}</p>
                </div>
                <div className="c4-granule-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("grnEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGranuleRaised(cards, card.id, !card.raised))}>{card.raised ? v4("grnFree") : v4("grnPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGranuleFilm(cards, card.id, suggestedFilm))}>{v4("grnSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGranulePin(cards, card.id, !card.pinned))}>{card.pinned ? v4("grnUnpeg") : v4("grnPegIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGranuleCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("grnUncoffer") : v4("grnCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGranuleStar(cards, card.id, !card.starred))}>{card.starred ? v4("grnUnstar") : v4("grnStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addGranuleTag(cards, card.id, "g"))}>{v4("grnTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("grnRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("grnLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHammerFocused(cards, card.id))}>{v4("grnLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHammerFocused(cards, card.id))}>{v4("grnLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(finishFocused(cards, card.id))}>{v4("grnFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGranuleFocused(cards, card.id))}>{v4("grnPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinGranuleFocused(cards, card.id))}>{v4("grnPeg")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starGranuleFocused(cards, card.id))}>{v4("grnStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(granuleCopy(card))}>{v4("grnCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}


type KprUser = { id?: string; name?: string | null; canManageUsers?: string | null };

export function KeeperGrantPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: KprUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<KprShape>("all");
  const [review, setReview] = useState<KprReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): KprRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: { canManageUsers: textField(row.canManageUsers) } satisfies KprValue,
    };
  }).filter((row): row is KprRow => Boolean(row));
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
    const next = readHiddenSel(readJson(KPR_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(KPR_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedSel(readJson(KPR_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(KPR_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleSelLanes(present, hidden, showHidden);
  const shown = visibleSel(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = kprLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = kprLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingSel(rows);
  const leadHue = leadingSelHue(rows);
  const whole = rows.filter((row) => kprLane(row.code)).length;
  const share = kprShare(laneSelCount(rows, "hall"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("keeper-grants.csv", kprLanesCsv(rows));
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
    writeJson(KPR_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(KPR_REVIEW_KEY, next);
  }

  return (
    <section className="c4-kprplate" aria-label={v4("kprTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-kprplate-mast">
        <p className="c4-kprplate-seal" data-logo="mono">{v4("kprLogo")}</p>
        <div>
          <p className="c4-kprplate-kicker">{v4("kprSub")}</p>
          <h2 className="c4-title">{v4("kprTitle")}</h2>
        </div>
        <p className="c4-kprplate-count">{shown.length}</p>
      </header>
      <p className="c4-kprplate-links">
        <Link href={crmv4Href(base, "grn")}>{v4("grnTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("kprCustomer")}</Link>
      </p>
      <p className="c4-kprplate-hint">{v4("kprHint")}</p>
      {viewer && <p className="c4-kprplate-note">{v4("kprViewer")}</p>}
      <p className="c4-kprplate-meta">{v4("kprLead")} {laneLabel(v4, lead)} · {v4("kprToneLead")} {hueLabel(v4, leadHue)} · {v4("kprShare")} {share}</p>
      <div className="c4-kprplate-chart" aria-label={v4("kprChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-kprplate-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-kprplate-tools">
        <input ref={searchRef} className="c4-field c4-kprplate-search" aria-label={v4("kprSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("kprSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("kprShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "kprAll" : item === "reviewed" ? "kprReviewed" : "kprFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("kprAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as KprShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleSel(hidden, item))}>{hidden.includes(item) ? v4("kprShow") : v4("kprHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-kprplate-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSelReview(reviewed, picked, true))}>{v4("kprBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSelReview(reviewed, picked, false))}>{v4("kprBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("keeper-grant-lanes.csv", kprLanesCsv(rows))}>{v4("kprCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("keeper-grant-rows.csv", kprRowsCsv(shown, reviewed))}>{v4("kprRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("kprLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("kprFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("kprEmpty")}</p>}
      <ul className="c4-kprplate-list">
        {shown.map((row) => {
          const name = kprCopy(row.code);
          const tone = kprHue(row.code);
          return (
            <li key={row.id} className="c4-kprplate-card" data-mail={kprLane(row.code) || "open"} data-hue={tone || "none"} data-home={kprLane(row.code) === "hall" ? "1" : "0"} data-away={kprAway(row.code) ? "1" : "0"} data-guest={kprGuest(row.code) ? "1" : "0"} data-citizen={kprCitizen(row.code) ? "1" : "0"} data-open={kprOpen(row.code) ? "1" : "0"} data-even={kprEven(row.code) ? "1" : "0"} data-digit={kprDigit(row.code) ? "1" : "0"} data-letter={kprLetter(row.code) ? "1" : "0"} data-mixed={kprMixed(row.code) ? "1" : "0"} data-upper={kprUpper(row.code) ? "1" : "0"} data-lower={kprLower(row.code) ? "1" : "0"} data-space={kprSpace(row.code) ? "1" : "0"} data-vowel={kprVowel(row.code) ? "1" : "0"} data-tail={kprTail(row.code) ? "1" : "0"} data-first={kprFirst(row.code) ? "1" : "0"} data-held={kprHeld(row.code) ? "1" : "0"} data-join={kprJoin(row.code) ? "1" : "0"} data-route={kprRoute(row.code) ? "1" : "0"} data-brief={kprBrief(row.code) ? "1" : "0"}>
              <label className="c4-kprplate-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-kprplate-meta">{name || v4("kprOpen")} · {kprStamp(row.code) || "—"} · {kprFamily(row.code) || "—"} · {kprLength(row.code) ?? "—"} · {laneLabel(v4, kprLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-kprplate-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleSelReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("kprReviewed") : v4("kprReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = kprCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("kprCopied") : v4("kprCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, row.userId ? `customers/${row.userId}` : "customers")}>{v4("kprCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
