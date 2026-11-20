"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  EXP_KEY,
  EXP_REVIEW_KEY,
  GLL_DENSITY_KEY,
  GLL_KEY,
  GLL_MODES,
  GLL_VIEW_KEY,
  addGuilloche,
  addGuillocheTag,
  addGuillocheView,
  briskGuilloche,
  bulkExpReview,
  bulkGuillocheCoffer,
  bulkGuillocheGraphite,
  bulkGuillocheRaise,
  bulkGuillocheTag,
  busiestKeeper,
  dropGuillocheView,
  editGuilloche,
  editGuillocheNote,
  expBrief,
  expCopy,
  expDigit,
  expEven,
  expFamily,
  expFirst,
  expRoute,
  expHeld,
  expAway,
  expHue,
  expJoin,
  expCitizen,
  expLane,
  expLanes,
  expLanesCsv,
  expLength,
  expLetter,
  expLower,
  expMixed,
  expOpen,
  expRowsCsv,
  expShare,
  expSpace,
  expStamp,
  expTail,
  expUpper,
  expGuest,
  expVowel,
  fairKeeper,
  finishFocused,
  guillocheBars,
  guillocheCopy,
  guillocheCounts,
  guillocheCsv,
  guillocheDensity,
  guillocheInner,
  guillocheOuter,
  guillocheTimeline,
  guillocheKeepers,
  idleGuilloche,
  laneExpCount,
  lateGuilloche,
  leadingExp,
  leadingExpHue,
  lowerHourFocused,
  lowerHammerFocused,
  moveGuillocheFocus,
  overdueGuilloche,
  pinGuillocheFocused,
  presentExpLanes,
  raiseHourFocused,
  raiseHammerFocused,
  readHiddenExp,
  readGuilloches,
  readGuillocheViews,
  readReviewedExp,
  reminderGuilloches,
  restingGuilloche,
  setGuillocheCoffer,
  setGuillocheFilm,
  setGuillocheFocused,
  setGuillochePin,
  setGuillocheRaised,
  setGuillocheStar,
  sortGuilloches,
  starGuillocheFocused,
  suggestHour,
  suggestFinish,
  suggestMode,
  toggleExp,
  toggleExpReview,
  visibleExp,
  visibleExpLanes,
  visibleGuilloches,
  type ExpReview,
  type ExpRow,
  type ExpShape,
  type ExpValue,
  type Guilloche,
  type GuillocheDensity,
  type GuillocheSort,
  type GuillocheTray,
  type GuillocheView,
} from "@/lib/crmv4/round355";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["GILT", "IVORY", "GRAPHITE"] as const;
const DROPS = ["4", "8", "16", "32"] as const;
const LOCKS = ["2", "4", "8"] as const;

const PIECE_KEY: Record<string, CrmV4CopyKey> = {
  barley: "gllCloud",
  basket: "gllWave",
  hobnail: "gllSun",
  rose: "gllRing",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "gllAuditSave",
  edit: "gllAuditEdit",
  note: "gllAuditNote",
  film: "gllAuditFilm",
  poise: "gllAuditPoise",
  free: "gllAuditFree",
  peg: "gllAuditPeg",
  return: "gllAuditReturn",
  coffer: "gllAuditCoffer",
  open: "gllAuditOpen",
  tag: "gllAuditTag",
  lock: "gllAuditRate",
  drop: "gllAuditStep",
  lower: "gllAuditLower",
  star: "gllAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  home: "expLaneHome",
  vacant: "expLaneVacant",
  hold: "expLaneHold",
  desk: "expLaneDesk",
  guest: "expLaneGuest",
  join: "expJoin",
  route: "expRoute",
  brief: "expBrief",
  long: "expLong",
  stamp: "expStampLane",
  vowel: "expVowel",
  plain: "expPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "expChampagne",
  ivory: "expIvory",
  graphite: "expGraphite",
};

const SHAPE_KEY: Record<ExpShape, CrmV4CopyKey> = {
  all: "expShapeAll",
  home: "expShapeHome",
  vacant: "expShapeVacant",
  hold: "expShapeHold",
  guest: "expShapeGuest",
  join: "expShapeJoin",
  route: "expShapeRoute",
  brief: "expShapeBrief",
  long: "expShapeLong",
  stamp: "expShapeStamp",
  vowel: "expShapeVowel",
  plain: "expShapePlain",
  open: "expShapeOpen",
  soon: "expShapeOpen",
  letter: "expShapePlain",
  mixed: "expShapeStamp",
  upper: "expShapeUpper",
  lower: "expShapePlain",
  space: "expShapeSpace",
  even: "expShapeEven",
  odd: "expShapeEven",
  tail: "expShapeStamp",
  first: "expShapePlain",
  held: "expShapeLong",
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
  return key ? v4(key) : v4("gllBlankPiece");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "GILT") return v4("gllGilt");
  if (film === "IVORY") return v4("gllIvory");
  if (film === "GRAPHITE") return v4("gllGraphite");
  return v4("gllAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("expBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("expBlank");
}

export function GuillocheRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Guilloche[]>([]);
  const [views, setViews] = useState<GuillocheView[]>([]);
  const [density, setDensity] = useState<GuillocheDensity>("airy");
  const [tray, setTray] = useState<GuillocheTray>("board");
  const [query, setQuery] = useState("");
  const [setterFilter, setSetterFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [pieceFilter, setPieceFilter] = useState("all");
  const [dropFilter, setDropFilter] = useState("all");
  const [lockFilter, setLockFilter] = useState("all");
  const [sort, setSort] = useState<GuillocheSort>("piece");
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
  const [station, setStation] = useState("barley");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readGuilloches(readJson(GLL_KEY, [])));
    setViews(readGuillocheViews(readJson(GLL_VIEW_KEY, [])));
    setDensity(guillocheDensity(readJson(GLL_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Guilloche[]) {
    setCards(next);
    writeJson(GLL_KEY, next);
  }
  function storeViews(next: GuillocheView[]) {
    setViews(next);
    writeJson(GLL_VIEW_KEY, next);
  }
  function storeDensity(next: GuillocheDensity) {
    setDensity(next);
    writeJson(GLL_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortGuilloches(visibleGuilloches(cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter), sort),
    [cards, tray, query, setterFilter, filmFilter, pieceFilter, dropFilter, lockFilter, sort],
  );
  const counts = guillocheCounts(cards, shown, station);
  const bars = guillocheBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = guillocheTimeline(cards);
  const reminders = reminderGuilloches(cards);
  const poisers = guillocheKeepers(cards);
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
        download("guilloche-rules.csv", guillocheCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveGuillocheFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveGuillocheFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addGuilloche(cards, { title, note, setter: setter, piece, drop: dropNo, film, lock: lockNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-guilloche" aria-label={v4("gllTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-guilloche-mast">
        <p className="c4-guilloche-seal" data-logo="mono">{v4("gllLogo")}</p>
        <div>
          <p className="c4-guilloche-kicker">{v4("gllSub")}</p>
          <h2 className="c4-title">{v4("gllTitle")}</h2>
        </div>
        <p className="c4-guilloche-count">{shown.length}</p>
      </header>
      <p className="c4-guilloche-links">
        <Link href={crmv4Href(base, "exp")}>{v4("expTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("gllCustomers")}</Link>
      </p>
      <p className="c4-guilloche-hint">{v4("gllHint")}</p>
      {viewer && <p className="c4-guilloche-note">{v4("gllViewer")}</p>}
      <p className="c4-guilloche-meta">{v4("gllFair")} {fair || "—"} · {v4("gllBusy")} {busy || "—"} · {v4("gllSuggest")} {limbLabel(v4, suggestedLimb)} · {filmLabel(v4, suggestedFilm)} · {suggestedBeat}</p>
      <ol className="c4-guilloche-index" aria-label={v4("gllRemind")}>
        <li data-tone="gold">{v4("gllOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("gllIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("gllBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("gllResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-guilloche-remind c4-guilloche-notices" role="status" aria-label={v4("gllRemind")}>
          {reminders.map((name) => <li key={name}>{v4("gllOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-guilloche-chart" aria-label={v4("gllChart")}>
        {bars.map((bar) => (
          <button key={bar.piece} type="button" className="c4-guilloche-column" data-on={pieceFilter === bar.piece ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === bar.piece ? "all" : bar.piece)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{limbLabel(v4, bar.piece)}</span>
          </button>
        ))}
      </div>
      <form className="c4-guilloche-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("gllEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("gllEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("gllNote")}<input className="c4-field" aria-label={v4("gllNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("gllSetter")}<input className="c4-field" aria-label={v4("gllSetter")} aria-required={false} value={setter} maxLength={24} disabled={viewer} onChange={(event) => setSetter(event.target.value)} /></label>
        <label className="c4-lab">{v4("gllPiece")}<select className="c4-field" aria-label={v4("gllPiece")} value={piece} disabled={viewer} onChange={(event) => setPiece(event.target.value)}><option value="">{v4("gllBlankPiece")}</option>{GLL_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("gllFilm")}<select className="c4-field" aria-label={v4("gllFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("gllAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("gllDrop")}<select className="c4-field" aria-label={v4("gllDrop")} value={dropNo} disabled={viewer} onChange={(event) => setDropNo(event.target.value)}><option value="">{v4("gllAll")}</option>{DROPS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("gllLock")}<select className="c4-field" aria-label={v4("gllLock")} value={lockNo} disabled={viewer} onChange={(event) => setLockNo(event.target.value)}><option value="">{v4("gllAll")}</option>{LOCKS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("gllTag")}<input className="c4-field" aria-label={v4("gllTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("gllAdd")}</button>
      </form>
      <div className="c4-guilloche-tools">
        <input ref={searchRef} className="c4-field c4-guilloche-search" aria-label={v4("gllSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("gllSearch")} />
        {(["board", "peg", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "board" ? "gllBoard" : item === "peg" ? "gllPeg" : "gllCoffer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={pieceFilter === "inner" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "inner" ? "all" : "inner")}>{v4("gllInner")}</button>
        <button type="button" className="c4-chip" data-on={pieceFilter === "outer" ? "1" : "0"} onClick={() => setPieceFilter(pieceFilter === "outer" ? "all" : "outer")}>{v4("gllOuter")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "setter" ? "1" : "0"} onClick={() => setSort(sort === "setter" ? "piece" : "setter")}>{sort === "setter" ? v4("gllSortSetter") : v4("gllSortLimb")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("gllClose") : v4("gllAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("gllTimeline")}</button>
        <label className="c4-lab">{v4("gllDesk")}<select className="c4-field" aria-label={v4("gllDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{GLL_MODES.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-guilloche-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addGuillocheView(views, { id, name: viewName, tray, query, setter: setterFilter, film: filmFilter, piece: pieceFilter, drop: dropFilter, lock: lockFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("gllViewName")}<input className="c4-field" aria-label={v4("gllViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("gllSaveView")}</button>
      </form>
      <ul className="c4-guilloche-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setSetterFilter(view.setter); setFilmFilter(view.film); setPieceFilter(view.piece); setDropFilter(view.drop); setLockFilter(view.lock); }}>{v4("gllApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropGuillocheView(views, view.id))}>{v4("gllDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-guilloche-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkGuillocheRaise(cards, picked))}>{v4("gllBulkPoise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkGuillocheCoffer(cards, picked))}>{v4("gllBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkGuillocheGraphite(cards, picked))}>{v4("gllBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkGuillocheTag(cards, picked))}>{v4("gllBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("guilloche-rules.csv", guillocheCsv(shown, station))}>{v4("gllCsv")}</button>
        <p className="c4-guilloche-meta">{v4("gllKeys")} / n x a j k · {v4("gllQuiet")} {counts.quiet} · {v4("gllInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-guilloche-time" aria-label={v4("gllTimeline")}>
          {timeline.map((mail) => <li key={mail.drop}><span>{mail.drop}</span> {mail.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("gllEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-guilloche-list">
          {shown.map((card) => {
            const late = lateGuilloche(card, station);
            return (
              <li key={card.id} className="c4-guilloche-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleGuilloche(card) ? "1" : "0"} data-brisk={briskGuilloche(card) ? "1" : "0"} data-overdue={overdueGuilloche(card) ? "1" : "0"} data-resting={restingGuilloche(card) ? "1" : "0"} data-inner={guillocheInner(card.piece) ? "1" : "0"} data-outer={guillocheOuter(card.piece) ? "1" : "0"}>
                <label className="c4-guilloche-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editGuilloche(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("gllEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("gllApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editGuillocheNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("gllNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-guilloche-meta">{limbLabel(v4, card.piece)} · {filmLabel(v4, card.film)} · {card.drop ?? "—"} · {card.lock} · {card.setter || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "gllAuditSave")}` : ""}{late ? ` · ${v4("gllOverdue")}` : ""}</p>
                </div>
                <div className="c4-guilloche-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("gllEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGuillocheRaised(cards, card.id, !card.raised))}>{card.raised ? v4("gllFree") : v4("gllPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGuillocheFilm(cards, card.id, suggestedFilm))}>{v4("gllSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGuillochePin(cards, card.id, !card.pinned))}>{card.pinned ? v4("gllUnpeg") : v4("gllPegIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGuillocheCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("gllUncoffer") : v4("gllCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGuillocheStar(cards, card.id, !card.starred))}>{card.starred ? v4("gllUnstar") : v4("gllStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addGuillocheTag(cards, card.id, "g"))}>{v4("gllTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("gllRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("gllLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHammerFocused(cards, card.id))}>{v4("gllLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHammerFocused(cards, card.id))}>{v4("gllLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(finishFocused(cards, card.id))}>{v4("gllFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGuillocheFocused(cards, card.id))}>{v4("gllPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinGuillocheFocused(cards, card.id))}>{v4("gllPeg")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starGuillocheFocused(cards, card.id))}>{v4("gllStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(guillocheCopy(card))}>{v4("gllCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}


type ExpUser = { id?: string; name?: string | null; birthDate?: string | boolean | null };

export function ExpiryPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: ExpUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<ExpShape>("all");
  const [review, setReview] = useState<ExpReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): ExpRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { birthDate: row.birthDate === true || row.birthDate === false ? row.birthDate : textField(row.birthDate) } satisfies ExpValue,
    };
  }).filter((row): row is ExpRow => Boolean(row));
  const present = presentExpLanes(rows);
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
    const next = readHiddenExp(readJson(EXP_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(EXP_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedExp(readJson(EXP_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(EXP_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleExpLanes(present, hidden, showHidden);
  const shown = visibleExp(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = expLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = expLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingExp(rows);
  const leadHue = leadingExpHue(rows);
  const whole = rows.filter((row) => expLane(row.code)).length;
  const share = expShare(laneExpCount(rows, "home"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("expiry-plates.csv", expLanesCsv(rows));
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
    <section className="c4-expplate" aria-label={v4("expTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-expplate-mast">
        <p className="c4-expplate-seal" data-logo="mono">{v4("expLogo")}</p>
        <div>
          <p className="c4-expplate-kicker">{v4("expSub")}</p>
          <h2 className="c4-title">{v4("expTitle")}</h2>
        </div>
        <p className="c4-expplate-count">{shown.length}</p>
      </header>
      <p className="c4-expplate-links">
        <Link href={crmv4Href(base, "gll")}>{v4("gllTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("expCustomer")}</Link>
      </p>
      <p className="c4-expplate-hint">{v4("expHint")}</p>
      {viewer && <p className="c4-expplate-note">{v4("expViewer")}</p>}
      <p className="c4-expplate-meta">{v4("expLead")} {laneLabel(v4, lead)} · {v4("expToneLead")} {hueLabel(v4, leadHue)} · {v4("expShare")} {share}</p>
      <div className="c4-expplate-chart" aria-label={v4("expChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-expplate-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-expplate-tools">
        <input ref={searchRef} className="c4-field c4-expplate-search" aria-label={v4("expSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("expSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("expShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "expAll" : item === "reviewed" ? "expReviewed" : "expFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("expAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as ExpShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleExp(hidden, item))}>{hidden.includes(item) ? v4("expShow") : v4("expHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-expplate-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkExpReview(reviewed, picked, true))}>{v4("expBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkExpReview(reviewed, picked, false))}>{v4("expBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("expiry-lanes.csv", expLanesCsv(rows))}>{v4("expCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("expiry-rows.csv", expRowsCsv(shown, reviewed))}>{v4("expRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("expLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("expFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("expEmpty")}</p>}
      <ul className="c4-expplate-list">
        {shown.map((row) => {
          const name = expCopy(row.code);
          const tone = expHue(row.code);
          return (
            <li key={row.id} className="c4-expplate-card" data-mail={expLane(row.code) || "open"} data-hue={tone || "none"} data-home={expLane(row.code) === "home" ? "1" : "0"} data-away={expAway(row.code) ? "1" : "0"} data-guest={expGuest(row.code) ? "1" : "0"} data-citizen={expCitizen(row.code) ? "1" : "0"} data-open={expOpen(row.code) ? "1" : "0"} data-even={expEven(row.code) ? "1" : "0"} data-digit={expDigit(row.code) ? "1" : "0"} data-letter={expLetter(row.code) ? "1" : "0"} data-mixed={expMixed(row.code) ? "1" : "0"} data-upper={expUpper(row.code) ? "1" : "0"} data-lower={expLower(row.code) ? "1" : "0"} data-space={expSpace(row.code) ? "1" : "0"} data-vowel={expVowel(row.code) ? "1" : "0"} data-tail={expTail(row.code) ? "1" : "0"} data-first={expFirst(row.code) ? "1" : "0"} data-held={expHeld(row.code) ? "1" : "0"} data-join={expJoin(row.code) ? "1" : "0"} data-route={expRoute(row.code) ? "1" : "0"} data-brief={expBrief(row.code) ? "1" : "0"}>
              <label className="c4-expplate-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-expplate-meta">{name || v4("expOpen")} · {expStamp(row.code) || "—"} · {expFamily(row.code) || "—"} · {expLength(row.code) ?? "—"} · {laneLabel(v4, expLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-expplate-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleExpReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("expReviewed") : v4("expReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = expCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("expCopied") : v4("expCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("expCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
