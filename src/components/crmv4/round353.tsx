"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  HBK_KEY,
  HBK_REVIEW_KEY,
  FUS_DENSITY_KEY,
  FUS_KEY,
  FUS_MODES,
  FUS_VIEW_KEY,
  addFusee,
  addFuseeTag,
  addFuseeView,
  briskFusee,
  bulkBrkReview,
  bulkFuseeCoffer,
  bulkFuseeGraphite,
  bulkFuseeRaise,
  bulkFuseeTag,
  busiestKeeper,
  dropFuseeView,
  editFusee,
  editFuseeNote,
  hbkBrief,
  hbkCopy,
  hbkDigit,
  hbkEven,
  hbkFamily,
  hbkFirst,
  hbkRoute,
  hbkHeld,
  hbkAway,
  hbkHue,
  hbkJoin,
  hbkCitizen,
  hbkLane,
  hbkLanes,
  hbkLanesCsv,
  hbkLength,
  hbkLetter,
  hbkLower,
  hbkMixed,
  hbkOpen,
  hbkRowsCsv,
  hbkShare,
  hbkSpace,
  hbkStamp,
  hbkTail,
  hbkUpper,
  hbkGuest,
  hbkVowel,
  fairKeeper,
  finishFocused,
  fuseeBars,
  fuseeCopy,
  fuseeCounts,
  fuseeCsv,
  fuseeDensity,
  fuseeInner,
  fuseeOuter,
  fuseeTimeline,
  fuseeKeepers,
  idleFusee,
  laneBrkCount,
  lateFusee,
  leadingBrk,
  leadingBrkHue,
  lowerHourFocused,
  lowerHammerFocused,
  moveFuseeFocus,
  overdueFusee,
  pinFuseeFocused,
  presentBrkLanes,
  raiseHourFocused,
  raiseHammerFocused,
  readHiddenBrk,
  readFusees,
  readFuseeViews,
  readReviewedBrk,
  reminderFusees,
  restingFusee,
  setFuseeCoffer,
  setFuseeFilm,
  setFuseeFocused,
  setFuseePin,
  setFuseeRaised,
  setFuseeStar,
  sortFusees,
  starFuseeFocused,
  suggestHour,
  suggestFinish,
  suggestMode,
  toggleBrk,
  toggleBrkReview,
  visibleBrk,
  visibleBrkLanes,
  visibleFusees,
  type BrkReview,
  type BrkRow,
  type BrkShape,
  type BrkValue,
  type Fusee,
  type FuseeDensity,
  type FuseeSort,
  type FuseeTray,
  type FuseeView,
} from "@/lib/crmv4/round353";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["GILT", "IVORY", "GRAPHITE"] as const;
const DROPS = ["4", "8", "16", "32"] as const;
const LOCKS = ["2", "4", "8"] as const;

const PIECE_KEY: Record<string, CrmV4CopyKey> = {
  cone: "fusCone",
  chain: "fusChain",
  snail: "fusSnail",
  stop: "fusStop",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "fusAuditSave",
  edit: "fusAuditEdit",
  note: "fusAuditNote",
  film: "fusAuditFilm",
  poise: "fusAuditPoise",
  free: "fusAuditFree",
  peg: "fusAuditPeg",
  return: "fusAuditReturn",
  coffer: "fusAuditCoffer",
  open: "fusAuditOpen",
  tag: "fusAuditTag",
  lock: "fusAuditRate",
  drop: "fusAuditStep",
  lower: "fusAuditLower",
  star: "fusAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  home: "hbkLaneHome",
  vacant: "hbkLaneVacant",
  hold: "hbkLaneHold",
  desk: "hbkLaneDesk",
  guest: "hbkLaneGuest",
  join: "hbkJoin",
  route: "hbkRoute",
  brief: "hbkBrief",
  long: "hbkLong",
  stamp: "hbkStampLane",
  vowel: "hbkVowel",
  plain: "hbkPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "hbkChampagne",
  ivory: "hbkIvory",
  graphite: "hbkGraphite",
};

const SHAPE_KEY: Record<BrkShape, CrmV4CopyKey> = {
  all: "hbkShapeAll",
  home: "hbkShapeHome",
  vacant: "hbkShapeVacant",
  hold: "hbkShapeHold",
  guest: "hbkShapeGuest",
  join: "hbkShapeJoin",
  route: "hbkShapeRoute",
  brief: "hbkShapeBrief",
  long: "hbkShapeLong",
  stamp: "hbkShapeStamp",
  vowel: "hbkShapeVowel",
  plain: "hbkShapePlain",
  open: "hbkShapeOpen",
  soon: "hbkShapeOpen",
  letter: "hbkShapePlain",
  mixed: "hbkShapeStamp",
  upper: "hbkShapeUpper",
  lower: "hbkShapePlain",
  space: "hbkShapeSpace",
  even: "hbkShapeEven",
  odd: "hbkShapeEven",
  tail: "hbkShapeStamp",
  first: "hbkShapePlain",
  held: "hbkShapeLong",
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
  return key ? v4(key) : v4("fusBlankPiece");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "GILT") return v4("fusGilt");
  if (film === "IVORY") return v4("fusIvory");
  if (film === "GRAPHITE") return v4("fusGraphite");
  return v4("fusAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("hbkBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("hbkBlank");
}

export function FuseeRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Fusee[]>([]);
  const [views, setViews] = useState<FuseeView[]>([]);
  const [density, setDensity] = useState<FuseeDensity>("airy");
  const [tray, setTray] = useState<FuseeTray>("board");
  const [query, setQuery] = useState("");
  const [setterFilter, setSetterFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [pieceFilter, setPieceFilter] = useState("all");
  const [dropFilter, setDropFilter] = useState("all");
  const [lockFilter, setLockFilter] = useState("all");
  const [sort, setSort] = useState<FuseeSort>("piece");
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
  const [station, setStation] = useState("cone");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readFusees(readJson(FUS_KEY, [])));
    setViews(readFuseeViews(readJson(FUS_VIEW_KEY, [])));
    setDensity(fuseeDensity(readJson(FUS_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Fusee[]) {
    setCards(next);
    writeJson(FUS_KEY, next);
  }
  function storeViews(next: FuseeView[]) {
    setViews(next);
    writeJson(FUS_VIEW_KEY, next);
  }
  function storeDensity(next: FuseeDensity) {
    setDensity(next);
    writeJson(FUS_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortFusees(visibleFusees(cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter), sort),
    [cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter, sort],
  );
  const counts = fuseeCounts(cards, shown, station);
  const bars = fuseeBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = fuseeTimeline(cards);
  const reminders = reminderFusees(cards);
  const poisers = fuseeKeepers(cards);
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
        download("fusee-rules.csv", fuseeCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveFuseeFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveFuseeFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addFusee(cards, { title, note, setter: setter, piece, drop: dropNo, film, lock: lockNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-fusee" aria-label={v4("fusTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-fusee-mast">
        <p className="c4-fusee-seal" data-logo="mono">{v4("fusLogo")}</p>
        <div>
          <p className="c4-fusee-kicker">{v4("fusSub")}</p>
          <h2 className="c4-title">{v4("fusTitle")}</h2>
        </div>
        <p className="c4-fusee-count">{shown.length}</p>
      </header>
      <p className="c4-fusee-links">
        <Link href={crmv4Href(base, "hbk")}>{v4("hbkTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("fusCustomers")}</Link>
      </p>
      <p className="c4-fusee-hint">{v4("fusHint")}</p>
      {viewer && <p className="c4-fusee-note">{v4("fusViewer")}</p>}
      <p className="c4-fusee-meta">{v4("fusFair")} {fair || "—"} · {v4("fusBusy")} {busy || "—"} · {v4("fusSuggest")} {limbLabel(v4, suggestedLimb)} · {filmLabel(v4, suggestedFilm)} · {suggestedBeat}</p>
      <ol className="c4-fusee-index" aria-label={v4("fusRemind")}>
        <li data-tone="gold">{v4("fusOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("fusIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("fusBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("fusResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-fusee-remind c4-fusee-notices" role="status" aria-label={v4("fusRemind")}>
          {reminders.map((name) => <li key={name}>{v4("fusOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-fusee-chart" aria-label={v4("fusChart")}>
        {bars.map((bar) => (
          <button key={bar.piece} type="button" className="c4-fusee-column" data-on={pieceFilter === bar.piece ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === bar.piece ? "all" : bar.piece)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{limbLabel(v4, bar.piece)}</span>
          </button>
        ))}
      </div>
      <form className="c4-fusee-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("fusEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("fusEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("fusNote")}<input className="c4-field" aria-label={v4("fusNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("fusSetter")}<input className="c4-field" aria-label={v4("fusSetter")} aria-required={false} value={setter} maxLength={24} disabled={viewer} onChange={(event) => setSetter(event.target.value)} /></label>
        <label className="c4-lab">{v4("fusPiece")}<select className="c4-field" aria-label={v4("fusPiece")} value={piece} disabled={viewer} onChange={(event) => setPiece(event.target.value)}><option value="">{v4("fusBlankPiece")}</option>{FUS_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("fusFilm")}<select className="c4-field" aria-label={v4("fusFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("fusAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("fusDrop")}<select className="c4-field" aria-label={v4("fusDrop")} value={dropNo} disabled={viewer} onChange={(event) => setDropNo(event.target.value)}><option value="">{v4("fusAll")}</option>{DROPS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("fusLock")}<select className="c4-field" aria-label={v4("fusLock")} value={lockNo} disabled={viewer} onChange={(event) => setLockNo(event.target.value)}><option value="">{v4("fusAll")}</option>{LOCKS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("fusTag")}<input className="c4-field" aria-label={v4("fusTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("fusAdd")}</button>
      </form>
      <div className="c4-fusee-tools">
        <input ref={searchRef} className="c4-field c4-fusee-search" aria-label={v4("fusSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("fusSearch")} />
        {(["board", "peg", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "board" ? "fusBoard" : item === "peg" ? "fusPeg" : "fusCoffer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={pieceFilter === "inner" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "inner" ? "all" : "inner")}>{v4("fusInner")}</button>
        <button type="button" className="c4-chip" data-on={pieceFilter === "outer" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "outer" ? "all" : "outer")}>{v4("fusOuter")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "setter" ? "1" : "0"} onClick={() => setSort(sort === "setter" ? "piece" : "setter")}>{sort === "setter" ? v4("fusSortSetter") : v4("fusSortLimb")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("fusClose") : v4("fusAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("fusTimeline")}</button>
        <label className="c4-lab">{v4("fusDesk")}<select className="c4-field" aria-label={v4("fusDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{FUS_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-fusee-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addFuseeView(views, { id, name: viewName, tray, query, setter: setterFilter, film: filmFilter, piece: pieceFilter, drop: dropFilter, lock: lockFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("fusViewName")}<input className="c4-field" aria-label={v4("fusViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("fusSaveView")}</button>
      </form>
      <ul className="c4-fusee-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setSetterFilter(view.setter); setFilmFilter(view.film); setPieceFilter(view.piece); setDropFilter(view.drop); setLockFilter(view.lock); }}>{v4("fusApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropFuseeView(views, view.id))}>{v4("fusDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-fusee-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkFuseeRaise(cards, picked))}>{v4("fusBulkPoise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkFuseeCoffer(cards, picked))}>{v4("fusBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkFuseeGraphite(cards, picked))}>{v4("fusBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkFuseeTag(cards, picked))}>{v4("fusBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("fusee-rules.csv", fuseeCsv(shown, station))}>{v4("fusCsv")}</button>
        <p className="c4-fusee-meta">{v4("fusKeys")} / n x a j k · {v4("fusQuiet")} {counts.quiet} · {v4("fusInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-fusee-time" aria-label={v4("fusTimeline")}>
          {timeline.map((mail) => <li key={mail.drop}><span>{mail.drop}</span> {mail.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("fusEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-fusee-list">
          {shown.map((card) => {
            const late = lateFusee(card, station);
            return (
              <li key={card.id} className="c4-fusee-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleFusee(card) ? "1" : "0"} data-brisk={briskFusee(card) ? "1" : "0"} data-overdue={overdueFusee(card) ? "1" : "0"} data-resting={restingFusee(card) ? "1" : "0"} data-inner={fuseeInner(card.piece) ? "1" : "0"} data-outer={fuseeOuter(card.piece) ? "1" : "0"}>
                <label className="c4-fusee-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editFusee(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("fusEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("fusApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editFuseeNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("fusNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-fusee-meta">{limbLabel(v4, card.piece)} · {filmLabel(v4, card.film)} · {card.drop ?? "—"} · {card.lock} · {card.setter || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "fusAuditSave")}` : ""}{late ? ` · ${v4("fusOverdue")}` : ""}</p>
                </div>
                <div className="c4-fusee-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("fusEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFuseeRaised(cards, card.id, !card.raised))}>{card.raised ? v4("fusFree") : v4("fusPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFuseeFilm(cards, card.id, suggestedFilm))}>{v4("fusSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFuseePin(cards, card.id, !card.pinned))}>{card.pinned ? v4("fusUnpeg") : v4("fusPegIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFuseeCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("fusUncoffer") : v4("fusCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFuseeStar(cards, card.id, !card.starred))}>{card.starred ? v4("fusUnstar") : v4("fusStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addFuseeTag(cards, card.id, "c"))}>{v4("fusTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("fusRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("fusLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHammerFocused(cards, card.id))}>{v4("fusLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHammerFocused(cards, card.id))}>{v4("fusLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(finishFocused(cards, card.id))}>{v4("fusFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFuseeFocused(cards, card.id))}>{v4("fusPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinFuseeFocused(cards, card.id))}>{v4("fusPeg")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starFuseeFocused(cards, card.id))}>{v4("fusStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(fuseeCopy(card))}>{v4("fusCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}


type BrkUser = { id?: string; name?: string | null; brokerName?: string | boolean | null };

export function BrokerPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: BrkUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<BrkShape>("all");
  const [review, setReview] = useState<BrkReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): BrkRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { brokerName: row.brokerName === true || row.brokerName === false ? row.brokerName : textField(row.brokerName) } satisfies BrkValue,
    };
  }).filter((row): row is BrkRow => Boolean(row));
  const present = presentBrkLanes(rows);
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
    const next = readHiddenBrk(readJson(HBK_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(HBK_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedBrk(readJson(HBK_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(HBK_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleBrkLanes(present, hidden, showHidden);
  const shown = visibleBrk(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = hbkLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = hbkLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingBrk(rows);
  const leadHue = leadingBrkHue(rows);
  const whole = rows.filter((row) => hbkLane(row.code)).length;
  const share = hbkShare(laneBrkCount(rows, "home"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("broker-plates.csv", hbkLanesCsv(rows));
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
    writeJson(HBK_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(HBK_REVIEW_KEY, next);
  }

  return (
    <section className="c4-hbkplate" aria-label={v4("hbkTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-hbkplate-mast">
        <p className="c4-hbkplate-seal" data-logo="mono">{v4("hbkLogo")}</p>
        <div>
          <p className="c4-hbkplate-kicker">{v4("hbkSub")}</p>
          <h2 className="c4-title">{v4("hbkTitle")}</h2>
        </div>
        <p className="c4-hbkplate-count">{shown.length}</p>
      </header>
      <p className="c4-hbkplate-links">
        <Link href={crmv4Href(base, "fus")}>{v4("fusTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("hbkCustomer")}</Link>
      </p>
      <p className="c4-hbkplate-hint">{v4("hbkHint")}</p>
      {viewer && <p className="c4-hbkplate-note">{v4("hbkViewer")}</p>}
      <p className="c4-hbkplate-meta">{v4("hbkLead")} {laneLabel(v4, lead)} · {v4("hbkToneLead")} {hueLabel(v4, leadHue)} · {v4("hbkShare")} {share}</p>
      <div className="c4-hbkplate-chart" aria-label={v4("hbkChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-hbkplate-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-hbkplate-tools">
        <input ref={searchRef} className="c4-field c4-hbkplate-search" aria-label={v4("hbkSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("hbkSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("hbkShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "hbkAll" : item === "reviewed" ? "hbkReviewed" : "hbkFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("hbkAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as BrkShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleBrk(hidden, item))}>{hidden.includes(item) ? v4("hbkShow") : v4("hbkHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-hbkplate-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkBrkReview(reviewed, picked, true))}>{v4("hbkBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkBrkReview(reviewed, picked, false))}>{v4("hbkBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("broker-lanes.csv", hbkLanesCsv(rows))}>{v4("hbkCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("broker-rows.csv", hbkRowsCsv(shown, reviewed))}>{v4("hbkRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("hbkLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("hbkFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("hbkEmpty")}</p>}
      <ul className="c4-hbkplate-list">
        {shown.map((row) => {
          const name = hbkCopy(row.code);
          const tone = hbkHue(row.code);
          return (
            <li key={row.id} className="c4-hbkplate-card" data-mail={hbkLane(row.code) || "open"} data-hue={tone || "none"} data-home={hbkLane(row.code) === "home" ? "1" : "0"} data-away={hbkAway(row.code) ? "1" : "0"} data-guest={hbkGuest(row.code) ? "1" : "0"} data-citizen={hbkCitizen(row.code) ? "1" : "0"} data-open={hbkOpen(row.code) ? "1" : "0"} data-even={hbkEven(row.code) ? "1" : "0"} data-digit={hbkDigit(row.code) ? "1" : "0"} data-letter={hbkLetter(row.code) ? "1" : "0"} data-mixed={hbkMixed(row.code) ? "1" : "0"} data-upper={hbkUpper(row.code) ? "1" : "0"} data-lower={hbkLower(row.code) ? "1" : "0"} data-space={hbkSpace(row.code) ? "1" : "0"} data-vowel={hbkVowel(row.code) ? "1" : "0"} data-tail={hbkTail(row.code) ? "1" : "0"} data-first={hbkFirst(row.code) ? "1" : "0"} data-held={hbkHeld(row.code) ? "1" : "0"} data-join={hbkJoin(row.code) ? "1" : "0"} data-route={hbkRoute(row.code) ? "1" : "0"} data-brief={hbkBrief(row.code) ? "1" : "0"}>
              <label className="c4-hbkplate-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-hbkplate-meta">{name || v4("hbkOpen")} · {hbkStamp(row.code) || "—"} · {hbkFamily(row.code) || "—"} · {hbkLength(row.code) ?? "—"} · {laneLabel(v4, hbkLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-hbkplate-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleBrkReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("hbkReviewed") : v4("hbkReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = hbkCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("hbkCopied") : v4("hbkCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("hbkCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
