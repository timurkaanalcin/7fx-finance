"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  LCO_KEY,
  LCO_REVIEW_KEY,
  RGR_DENSITY_KEY,
  RGR_KEY,
  RGR_MODES,
  RGR_VIEW_KEY,
  addRegulator,
  addRegulatorTag,
  addRegulatorView,
  briskRegulator,
  bulkLcoReview,
  bulkRegulatorCoffer,
  bulkRegulatorGraphite,
  bulkRegulatorRaise,
  bulkRegulatorTag,
  busiestKeeper,
  dropRegulatorView,
  editRegulator,
  editRegulatorNote,
  lcoBrief,
  lcoCopy,
  lcoDigit,
  lcoEven,
  lcoFamily,
  lcoFirst,
  lcoRoute,
  lcoHeld,
  lcoAway,
  lcoHue,
  lcoJoin,
  lcoCitizen,
  lcoLane,
  lcoLanes,
  lcoLanesCsv,
  lcoLength,
  lcoLetter,
  lcoLower,
  lcoMixed,
  lcoOpen,
  lcoRowsCsv,
  lcoShare,
  lcoSpace,
  lcoStamp,
  lcoTail,
  lcoUpper,
  lcoGuest,
  lcoVowel,
  fairKeeper,
  finishFocused,
  regulatorBars,
  regulatorCopy,
  regulatorCounts,
  regulatorCsv,
  regulatorDensity,
  regulatorInner,
  regulatorOuter,
  regulatorTimeline,
  regulatorKeepers,
  idleRegulator,
  laneLcoCount,
  lateRegulator,
  leadingLco,
  leadingLcoHue,
  lowerHourFocused,
  lowerHammerFocused,
  moveRegulatorFocus,
  overdueRegulator,
  pinRegulatorFocused,
  presentLcoLanes,
  raiseHourFocused,
  raiseHammerFocused,
  readHiddenLco,
  readRegulators,
  readRegulatorViews,
  readReviewedLco,
  reminderRegulators,
  restingRegulator,
  setRegulatorCoffer,
  setRegulatorFilm,
  setRegulatorFocused,
  setRegulatorPin,
  setRegulatorRaised,
  setRegulatorStar,
  sortRegulators,
  starRegulatorFocused,
  suggestHour,
  suggestFinish,
  suggestMode,
  toggleLco,
  toggleLcoReview,
  visibleLco,
  visibleLcoLanes,
  visibleRegulators,
  type LcoReview,
  type LcoRow,
  type LcoShape,
  type LcoValue,
  type Regulator,
  type RegulatorDensity,
  type RegulatorSort,
  type RegulatorTray,
  type RegulatorView,
} from "@/lib/crmv4/round352";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["GILT", "IVORY", "GRAPHITE"] as const;
const DROPS = ["6", "12", "24", "48"] as const;
const LOCKS = ["1", "3", "6"] as const;

const PIECE_KEY: Record<string, CrmV4CopyKey> = {
  pinion: "rgrPinion",
  arbor: "rgrArbor",
  sweep: "rgrSweep",
  window: "rgrWindow",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "rgrAuditSave",
  edit: "rgrAuditEdit",
  note: "rgrAuditNote",
  film: "rgrAuditFilm",
  poise: "rgrAuditPoise",
  free: "rgrAuditFree",
  peg: "rgrAuditPeg",
  return: "rgrAuditReturn",
  coffer: "rgrAuditCoffer",
  open: "rgrAuditOpen",
  tag: "rgrAuditTag",
  lock: "rgrAuditRate",
  drop: "rgrAuditStep",
  lower: "rgrAuditLower",
  star: "rgrAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  home: "lcoLaneHome",
  vacant: "lcoLaneVacant",
  hold: "lcoLaneHold",
  desk: "lcoLaneDesk",
  guest: "lcoLaneGuest",
  join: "lcoJoin",
  route: "lcoRoute",
  brief: "lcoBrief",
  long: "lcoLong",
  stamp: "lcoStampLane",
  vowel: "lcoVowel",
  plain: "lcoPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "lcoChampagne",
  ivory: "lcoIvory",
  graphite: "lcoGraphite",
};

const SHAPE_KEY: Record<LcoShape, CrmV4CopyKey> = {
  all: "lcoShapeAll",
  home: "lcoShapeHome",
  vacant: "lcoShapeVacant",
  hold: "lcoShapeHold",
  guest: "lcoShapeGuest",
  join: "lcoShapeJoin",
  route: "lcoShapeRoute",
  brief: "lcoShapeBrief",
  long: "lcoShapeLong",
  stamp: "lcoShapeStamp",
  vowel: "lcoShapeVowel",
  plain: "lcoShapePlain",
  open: "lcoShapeOpen",
  soon: "lcoShapeOpen",
  letter: "lcoShapePlain",
  mixed: "lcoShapeStamp",
  upper: "lcoShapeUpper",
  lower: "lcoShapePlain",
  space: "lcoShapeSpace",
  even: "lcoShapeEven",
  odd: "lcoShapeEven",
  tail: "lcoShapeStamp",
  first: "lcoShapePlain",
  held: "lcoShapeLong",
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
  return key ? v4(key) : v4("rgrBlankPiece");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "GILT") return v4("rgrGilt");
  if (film === "IVORY") return v4("rgrIvory");
  if (film === "GRAPHITE") return v4("rgrGraphite");
  return v4("rgrAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("lcoBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("lcoBlank");
}

export function RegulatorRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Regulator[]>([]);
  const [views, setViews] = useState<RegulatorView[]>([]);
  const [density, setDensity] = useState<RegulatorDensity>("airy");
  const [tray, setTray] = useState<RegulatorTray>("board");
  const [query, setQuery] = useState("");
  const [setterFilter, setSetterFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [pieceFilter, setPieceFilter] = useState("all");
  const [dropFilter, setDropFilter] = useState("all");
  const [lockFilter, setLockFilter] = useState("all");
  const [sort, setSort] = useState<RegulatorSort>("piece");
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
  const [station, setStation] = useState("pinion");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readRegulators(readJson(RGR_KEY, [])));
    setViews(readRegulatorViews(readJson(RGR_VIEW_KEY, [])));
    setDensity(regulatorDensity(readJson(RGR_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Regulator[]) {
    setCards(next);
    writeJson(RGR_KEY, next);
  }
  function storeViews(next: RegulatorView[]) {
    setViews(next);
    writeJson(RGR_VIEW_KEY, next);
  }
  function storeDensity(next: RegulatorDensity) {
    setDensity(next);
    writeJson(RGR_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortRegulators(visibleRegulators(cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter), sort),
    [cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter, sort],
  );
  const counts = regulatorCounts(cards, shown, station);
  const bars = regulatorBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = regulatorTimeline(cards);
  const reminders = reminderRegulators(cards);
  const poisers = regulatorKeepers(cards);
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
        download("regulator-rules.csv", regulatorCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveRegulatorFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveRegulatorFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addRegulator(cards, { title, note, setter: setter, piece, drop: dropNo, film, lock: lockNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-regulator" aria-label={v4("rgrTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-regulator-mast">
        <p className="c4-regulator-seal" data-logo="mono">{v4("rgrLogo")}</p>
        <div>
          <p className="c4-regulator-kicker">{v4("rgrSub")}</p>
          <h2 className="c4-title">{v4("rgrTitle")}</h2>
        </div>
        <p className="c4-regulator-count">{shown.length}</p>
      </header>
      <p className="c4-regulator-links">
        <Link href={crmv4Href(base, "lco")}>{v4("lcoTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("rgrCustomers")}</Link>
      </p>
      <p className="c4-regulator-hint">{v4("rgrHint")}</p>
      {viewer && <p className="c4-regulator-note">{v4("rgrViewer")}</p>}
      <p className="c4-regulator-meta">{v4("rgrFair")} {fair || "—"} · {v4("rgrBusy")} {busy || "—"} · {v4("rgrSuggest")} {limbLabel(v4, suggestedLimb)} · {filmLabel(v4, suggestedFilm)} · {suggestedBeat}</p>
      <ol className="c4-regulator-index" aria-label={v4("rgrRemind")}>
        <li data-tone="gold">{v4("rgrOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("rgrIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("rgrBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("rgrResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-regulator-remind c4-regulator-notices" role="status" aria-label={v4("rgrRemind")}>
          {reminders.map((name) => <li key={name}>{v4("rgrOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-regulator-chart" aria-label={v4("rgrChart")}>
        {bars.map((bar) => (
          <button key={bar.piece} type="button" className="c4-regulator-column" data-on={pieceFilter === bar.piece ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === bar.piece ? "all" : bar.piece)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{limbLabel(v4, bar.piece)}</span>
          </button>
        ))}
      </div>
      <form className="c4-regulator-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("rgrEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("rgrEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("rgrNote")}<input className="c4-field" aria-label={v4("rgrNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("rgrSetter")}<input className="c4-field" aria-label={v4("rgrSetter")} aria-required={false} value={setter} maxLength={24} disabled={viewer} onChange={(event) => setSetter(event.target.value)} /></label>
        <label className="c4-lab">{v4("rgrPiece")}<select className="c4-field" aria-label={v4("rgrPiece")} value={piece} disabled={viewer} onChange={(event) => setPiece(event.target.value)}><option value="">{v4("rgrBlankPiece")}</option>{RGR_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("rgrFilm")}<select className="c4-field" aria-label={v4("rgrFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("rgrAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("rgrDrop")}<select className="c4-field" aria-label={v4("rgrDrop")} value={dropNo} disabled={viewer} onChange={(event) => setDropNo(event.target.value)}><option value="">{v4("rgrAll")}</option>{DROPS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("rgrLock")}<select className="c4-field" aria-label={v4("rgrLock")} value={lockNo} disabled={viewer} onChange={(event) => setLockNo(event.target.value)}><option value="">{v4("rgrAll")}</option>{LOCKS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("rgrTag")}<input className="c4-field" aria-label={v4("rgrTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("rgrAdd")}</button>
      </form>
      <div className="c4-regulator-tools">
        <input ref={searchRef} className="c4-field c4-regulator-search" aria-label={v4("rgrSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("rgrSearch")} />
        {(["board", "peg", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "board" ? "rgrBoard" : item === "peg" ? "rgrPeg" : "rgrCoffer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={pieceFilter === "inner" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "inner" ? "all" : "inner")}>{v4("rgrInner")}</button>
        <button type="button" className="c4-chip" data-on={pieceFilter === "outer" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "outer" ? "all" : "outer")}>{v4("rgrOuter")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "setter" ? "1" : "0"} onClick={() => setSort(sort === "setter" ? "piece" : "setter")}>{sort === "setter" ? v4("rgrSortSetter") : v4("rgrSortLimb")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("rgrClose") : v4("rgrAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("rgrTimeline")}</button>
        <label className="c4-lab">{v4("rgrDesk")}<select className="c4-field" aria-label={v4("rgrDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{RGR_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-regulator-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addRegulatorView(views, { id, name: viewName, tray, query, setter: setterFilter, film: filmFilter, piece: pieceFilter, drop: dropFilter, lock: lockFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("rgrViewName")}<input className="c4-field" aria-label={v4("rgrViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("rgrSaveView")}</button>
      </form>
      <ul className="c4-regulator-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setSetterFilter(view.setter); setFilmFilter(view.film); setPieceFilter(view.piece); setDropFilter(view.drop); setLockFilter(view.lock); }}>{v4("rgrApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropRegulatorView(views, view.id))}>{v4("rgrDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-regulator-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRegulatorRaise(cards, picked))}>{v4("rgrBulkPoise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRegulatorCoffer(cards, picked))}>{v4("rgrBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRegulatorGraphite(cards, picked))}>{v4("rgrBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRegulatorTag(cards, picked))}>{v4("rgrBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("regulator-rules.csv", regulatorCsv(shown, station))}>{v4("rgrCsv")}</button>
        <p className="c4-regulator-meta">{v4("rgrKeys")} / n x a j k · {v4("rgrQuiet")} {counts.quiet} · {v4("rgrInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-regulator-time" aria-label={v4("rgrTimeline")}>
          {timeline.map((mail) => <li key={mail.drop}><span>{mail.drop}</span> {mail.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("rgrEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-regulator-list">
          {shown.map((card) => {
            const late = lateRegulator(card, station);
            return (
              <li key={card.id} className="c4-regulator-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleRegulator(card) ? "1" : "0"} data-brisk={briskRegulator(card) ? "1" : "0"} data-overdue={overdueRegulator(card) ? "1" : "0"} data-resting={restingRegulator(card) ? "1" : "0"} data-inner={regulatorInner(card.piece) ? "1" : "0"} data-outer={regulatorOuter(card.piece) ? "1" : "0"}>
                <label className="c4-regulator-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editRegulator(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("rgrEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("rgrApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editRegulatorNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("rgrNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-regulator-meta">{limbLabel(v4, card.piece)} · {filmLabel(v4, card.film)} · {card.drop ?? "—"} · {card.lock} · {card.setter || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "rgrAuditSave")}` : ""}{late ? ` · ${v4("rgrOverdue")}` : ""}</p>
                </div>
                <div className="c4-regulator-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("rgrEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRegulatorRaised(cards, card.id, !card.raised))}>{card.raised ? v4("rgrFree") : v4("rgrPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRegulatorFilm(cards, card.id, suggestedFilm))}>{v4("rgrSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRegulatorPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("rgrUnpeg") : v4("rgrPegIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRegulatorCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("rgrUncoffer") : v4("rgrCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRegulatorStar(cards, card.id, !card.starred))}>{card.starred ? v4("rgrUnstar") : v4("rgrStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addRegulatorTag(cards, card.id, "c"))}>{v4("rgrTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("rgrRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("rgrLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHammerFocused(cards, card.id))}>{v4("rgrLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHammerFocused(cards, card.id))}>{v4("rgrLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(finishFocused(cards, card.id))}>{v4("rgrFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRegulatorFocused(cards, card.id))}>{v4("rgrPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinRegulatorFocused(cards, card.id))}>{v4("rgrPeg")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starRegulatorFocused(cards, card.id))}>{v4("rgrStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(regulatorCopy(card))}>{v4("rgrCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}


type LcoUser = { id?: string; name?: string | null; lastCountry?: string | boolean | null };

export function LastCountryPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: LcoUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<LcoShape>("all");
  const [review, setReview] = useState<LcoReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): LcoRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { lastCountry: row.lastCountry === true || row.lastCountry === false ? row.lastCountry : textField(row.lastCountry) } satisfies LcoValue,
    };
  }).filter((row): row is LcoRow => Boolean(row));
  const present = presentLcoLanes(rows);
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
    const next = readHiddenLco(readJson(LCO_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(LCO_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedLco(readJson(LCO_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(LCO_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleLcoLanes(present, hidden, showHidden);
  const shown = visibleLco(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = lcoLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = lcoLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingLco(rows);
  const leadHue = leadingLcoHue(rows);
  const whole = rows.filter((row) => lcoLane(row.code)).length;
  const share = lcoShare(laneLcoCount(rows, "home"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("country-plates.csv", lcoLanesCsv(rows));
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
    writeJson(LCO_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(LCO_REVIEW_KEY, next);
  }

  return (
    <section className="c4-lcoplate" aria-label={v4("lcoTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-lcoplate-mast">
        <p className="c4-lcoplate-seal" data-logo="mono">{v4("lcoLogo")}</p>
        <div>
          <p className="c4-lcoplate-kicker">{v4("lcoSub")}</p>
          <h2 className="c4-title">{v4("lcoTitle")}</h2>
        </div>
        <p className="c4-lcoplate-count">{shown.length}</p>
      </header>
      <p className="c4-lcoplate-links">
        <Link href={crmv4Href(base, "rgr")}>{v4("rgrTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("lcoCustomer")}</Link>
      </p>
      <p className="c4-lcoplate-hint">{v4("lcoHint")}</p>
      {viewer && <p className="c4-lcoplate-note">{v4("lcoViewer")}</p>}
      <p className="c4-lcoplate-meta">{v4("lcoLead")} {laneLabel(v4, lead)} · {v4("lcoToneLead")} {hueLabel(v4, leadHue)} · {v4("lcoShare")} {share}</p>
      <div className="c4-lcoplate-chart" aria-label={v4("lcoChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-lcoplate-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-lcoplate-tools">
        <input ref={searchRef} className="c4-field c4-lcoplate-search" aria-label={v4("lcoSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("lcoSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("lcoShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "lcoAll" : item === "reviewed" ? "lcoReviewed" : "lcoFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("lcoAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as LcoShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleLco(hidden, item))}>{hidden.includes(item) ? v4("lcoShow") : v4("lcoHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-lcoplate-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkLcoReview(reviewed, picked, true))}>{v4("lcoBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkLcoReview(reviewed, picked, false))}>{v4("lcoBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("country-lanes.csv", lcoLanesCsv(rows))}>{v4("lcoCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("country-rows.csv", lcoRowsCsv(shown, reviewed))}>{v4("lcoRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("lcoLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("lcoFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("lcoEmpty")}</p>}
      <ul className="c4-lcoplate-list">
        {shown.map((row) => {
          const name = lcoCopy(row.code);
          const tone = lcoHue(row.code);
          return (
            <li key={row.id} className="c4-lcoplate-card" data-mail={lcoLane(row.code) || "open"} data-hue={tone || "none"} data-home={lcoLane(row.code) === "home" ? "1" : "0"} data-away={lcoAway(row.code) ? "1" : "0"} data-guest={lcoGuest(row.code) ? "1" : "0"} data-citizen={lcoCitizen(row.code) ? "1" : "0"} data-open={lcoOpen(row.code) ? "1" : "0"} data-even={lcoEven(row.code) ? "1" : "0"} data-digit={lcoDigit(row.code) ? "1" : "0"} data-letter={lcoLetter(row.code) ? "1" : "0"} data-mixed={lcoMixed(row.code) ? "1" : "0"} data-upper={lcoUpper(row.code) ? "1" : "0"} data-lower={lcoLower(row.code) ? "1" : "0"} data-space={lcoSpace(row.code) ? "1" : "0"} data-vowel={lcoVowel(row.code) ? "1" : "0"} data-tail={lcoTail(row.code) ? "1" : "0"} data-first={lcoFirst(row.code) ? "1" : "0"} data-held={lcoHeld(row.code) ? "1" : "0"} data-join={lcoJoin(row.code) ? "1" : "0"} data-route={lcoRoute(row.code) ? "1" : "0"} data-brief={lcoBrief(row.code) ? "1" : "0"}>
              <label className="c4-lcoplate-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-lcoplate-meta">{name || v4("lcoOpen")} · {lcoStamp(row.code) || "—"} · {lcoFamily(row.code) || "—"} · {lcoLength(row.code) ?? "—"} · {laneLabel(v4, lcoLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-lcoplate-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleLcoReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("lcoReviewed") : v4("lcoReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = lcoCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("lcoCopied") : v4("lcoCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("lcoCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
