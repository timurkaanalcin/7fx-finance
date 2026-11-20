"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  BKS_KEY,
  BKS_REVIEW_KEY,
  BRL_DENSITY_KEY,
  BRL_KEY,
  BRL_LIMBS,
  BRL_VIEW_KEY,
  addBarrel,
  addBarrelTag,
  addBarrelView,
  briskBarrel,
  bulkBackstaffReview,
  bulkBarrelCoffer,
  bulkBarrelGraphite,
  bulkBarrelPoise,
  bulkBarrelTag,
  busiestWinder,
  dropBarrelView,
  editBarrel,
  editBarrelNote,
  backstaffBead,
  backstaffCopy,
  backstaffDigit,
  backstaffEven,
  backstaffFamily,
  backstaffFirst,
  backstaffGap,
  backstaffHeld,
  backstaffGbr,
  backstaffHue,
  backstaffJoin,
  backstaffTur,
  backstaffLane,
  backstaffLanes,
  backstaffLanesCsv,
  backstaffLength,
  backstaffLetter,
  backstaffLower,
  backstaffMixed,
  backstaffOpen,
  backstaffRowsCsv,
  backstaffShare,
  backstaffSpace,
  backstaffStamp,
  backstaffTail,
  backstaffUpper,
  backstaffDeu,
  backstaffVowel,
  fairWinder,
  filmFocused,
  barrelBars,
  barrelCopy,
  barrelCounts,
  barrelCsv,
  barrelDensity,
  barrelInner,
  barrelOuter,
  barrelTimeline,
  barrelWinders,
  idleBarrel,
  laneBackstaffCount,
  lateBarrel,
  leadingBackstaff,
  leadingBackstaffHue,
  lowerBeatFocused,
  lowerRateFocused,
  moveBarrelFocus,
  overdueBarrel,
  pegBarrelFocused,
  presentBackstaffLanes,
  raiseBeatFocused,
  raiseRateFocused,
  readHiddenBackstaff,
  readBarrelRules,
  readBarrelViews,
  readReviewedBackstaff,
  reminderBarrelRules,
  restingBarrel,
  setBarrelCoffer,
  setBarrelFilm,
  setBarrelFocused,
  setBarrelPeg,
  setBarrelPoise,
  setBarrelStar,
  sortBarrelRules,
  starBarrelFocused,
  suggestTurn,
  suggestFinish,
  suggestPart,
  toggleBackstaff,
  toggleBackstaffReview,
  visibleBackstaff,
  visibleBackstaffLanes,
  visibleBarrelRules,
  type BackstaffReview,
  type BackstaffRow,
  type BackstaffShape,
  type BackstaffValue,
  type Barrel,
  type BarrelDensity,
  type BarrelSort,
  type BarrelTray,
  type BarrelView,
} from "@/lib/crmv4/round336";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["GILT", "IVORY", "GRAPHITE"] as const;
const BEATS = ["4", "8", "16", "32"] as const;
const RATES = ["1", "4", "7"] as const;

const LIMB_KEY: Record<string, CrmV4CopyKey> = {
  arbor: "brlArbor",
  drum: "brlDrum",
  click: "brlClick",
  ratchet: "brlRatchet",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "brlAuditSave",
  edit: "brlAuditEdit",
  note: "brlAuditNote",
  film: "brlAuditFilm",
  poise: "brlAuditPoise",
  free: "brlAuditFree",
  peg: "brlAuditPeg",
  return: "brlAuditReturn",
  coffer: "brlAuditCoffer",
  open: "brlAuditOpen",
  tag: "brlAuditTag",
  rate: "brlAuditRate",
  beat: "brlAuditBeat",
  lower: "brlAuditLower",
  star: "brlAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  usa: "bksUsa",
  gbr: "bksGbr",
  deu: "bksDeu",
  tur: "bksTur",
  join: "bksJoin",
  gap: "bksGap",
  bead: "bksBead",
  ribbon: "bksRibbon",
  mark: "bksMark",
  vowel: "bksVowel",
  plain: "bksPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "bksChampagne",
  ivory: "bksIvory",
  graphite: "bksGraphite",
};

const SHAPE_KEY: Record<BackstaffShape, CrmV4CopyKey> = {
  all: "bksShapeAll",
  usa: "bksShapeUsa",
  gbr: "bksShapeGbr",
  deu: "bksShapeDeu",
  tur: "bksShapeTur",
  join: "bksShapeJoin",
  gap: "bksShapeGap",
  bead: "bksShapeBead",
  ribbon: "bksShapeRibbon",
  mark: "bksShapeMark",
  vowel: "bksShapeVowel",
  plain: "bksShapePlain",
  open: "bksShapeOpen",
  soon: "bksShapeOpen",
  letter: "bksShapePlain",
  mixed: "bksShapeMark",
  upper: "bksShapeUsa",
  lower: "bksShapePlain",
  space: "bksShapeGap",
  even: "bksShapeEven",
  odd: "bksShapeEven",
  tail: "bksShapeMark",
  first: "bksShapePlain",
  held: "bksShapeRibbon",
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

function limbLabel(v4: V4, limb: string): string {
  const key = LIMB_KEY[limb];
  return key ? v4(key) : v4("brlBlankLimb");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "GILT") return v4("brlGilt");
  if (film === "IVORY") return v4("brlIvory");
  if (film === "GRAPHITE") return v4("brlGraphite");
  return v4("brlAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("bksBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("bksBlank");
}

export function BarrelRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Barrel[]>([]);
  const [views, setViews] = useState<BarrelView[]>([]);
  const [density, setDensity] = useState<BarrelDensity>("airy");
  const [tray, setTray] = useState<BarrelTray>("board");
  const [query, setQuery] = useState("");
  const [setterFilter, setSetterFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [limbFilter, setLimbFilter] = useState("all");
  const [beatFilter, setBeatFilter] = useState("all");
  const [rateFilter, setRateFilter] = useState("all");
  const [sort, setSort] = useState<BarrelSort>("limb");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [setter, setSetter] = useState("");
  const [limb, setLimb] = useState("");
  const [film, setFilm] = useState("");
  const [beatNo, setBeatNo] = useState("");
  const [rateNo, setRateNo] = useState("");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteId, setNoteId] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [station, setStation] = useState("arbor");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readBarrelRules(readJson(BRL_KEY, [])));
    setViews(readBarrelViews(readJson(BRL_VIEW_KEY, [])));
    setDensity(barrelDensity(readJson(BRL_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Barrel[]) {
    setCards(next);
    writeJson(BRL_KEY, next);
  }
  function storeViews(next: BarrelView[]) {
    setViews(next);
    writeJson(BRL_VIEW_KEY, next);
  }
  function storeDensity(next: BarrelDensity) {
    setDensity(next);
    writeJson(BRL_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortBarrelRules(visibleBarrelRules(cards, tray, query, setterFilter, filmFilter, limbFilter, beatFilter, rateFilter), sort),
    [cards, tray, query, setterFilter, filmFilter, limbFilter, beatFilter, rateFilter, sort],
  );
  const counts = barrelCounts(cards, shown, station);
  const bars = barrelBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = barrelTimeline(cards);
  const reminders = reminderBarrelRules(cards);
  const setters = barrelWinders(cards);
  const busy = busiestWinder(cards);
  const fair = fairWinder(cards, setters.join(","));
  const suggestedFilm = suggestFinish(cards);
  const suggestedBeat = suggestTurn(cards, clock);
  const suggestedLimb = suggestPart(clock);
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
        download("barrel-rules.csv", barrelCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveBarrelFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveBarrelFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addBarrel(cards, { title, note, striker: setter, limb, beat: beatNo, film, rate: rateNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-barrel" aria-label={v4("brlTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-barrel-mast">
        <p className="c4-barrel-seal" data-logo="mono">{v4("brlLogo")}</p>
        <div>
          <p className="c4-barrel-kicker">{v4("brlSub")}</p>
          <h2 className="c4-title">{v4("brlTitle")}</h2>
        </div>
        <p className="c4-barrel-count">{shown.length}</p>
      </header>
      <p className="c4-barrel-links">
        <Link href={crmv4Href(base, "bks")}>{v4("bksTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("brlCustomers")}</Link>
      </p>
      <p className="c4-barrel-hint">{v4("brlHint")}</p>
      {viewer && <p className="c4-barrel-note">{v4("brlViewer")}</p>}
      <p className="c4-barrel-meta">{v4("brlFair")} {fair || "—"} · {v4("brlBusy")} {busy || "—"} · {v4("brlSuggest")} {limbLabel(v4, suggestedLimb)} · {filmLabel(v4, suggestedFilm)} · {suggestedBeat}</p>
      <ol className="c4-barrel-index" aria-label={v4("brlRemind")}>
        <li data-tone="gold">{v4("brlOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("brlIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("brlBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("brlResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-barrel-remind c4-barrel-notices" role="status" aria-label={v4("brlRemind")}>
          {reminders.map((name) => <li key={name}>{v4("brlOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-barrel-chart" aria-label={v4("brlChart")}>
        {bars.map((bar) => (
          <button key={bar.limb} type="button" className="c4-barrel-column" data-on={limbFilter === bar.limb ? "1" : "0"} onClick={() => setLimbFilter(limbFilter === bar.limb ? "all" : bar.limb)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{limbLabel(v4, bar.limb)}</span>
          </button>
        ))}
      </div>
      <form className="c4-barrel-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("brlEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("brlEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("brlNote")}<input className="c4-field" aria-label={v4("brlNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("brlStriker")}<input className="c4-field" aria-label={v4("brlStriker")} aria-required={false} value={setter} maxLength={24} disabled={viewer} onChange={(event) => setSetter(event.target.value)} /></label>
        <label className="c4-lab">{v4("brlLimb")}<select className="c4-field" aria-label={v4("brlLimb")} value={limb} disabled={viewer} onChange={(event) => setLimb(event.target.value)}><option value="">{v4("brlBlankLimb")}</option>{BRL_LIMBS.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("brlFilm")}<select className="c4-field" aria-label={v4("brlFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("brlAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("brlQuarter")}<select className="c4-field" aria-label={v4("brlQuarter")} value={beatNo} disabled={viewer} onChange={(event) => setBeatNo(event.target.value)}><option value="">{v4("brlAll")}</option>{BEATS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("brlStrike")}<select className="c4-field" aria-label={v4("brlStrike")} value={rateNo} disabled={viewer} onChange={(event) => setRateNo(event.target.value)}><option value="">{v4("brlAll")}</option>{RATES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("brlTag")}<input className="c4-field" aria-label={v4("brlTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("brlAdd")}</button>
      </form>
      <div className="c4-barrel-tools">
        <input ref={searchRef} className="c4-field c4-barrel-search" aria-label={v4("brlSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("brlSearch")} />
        {(["board", "peg", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "board" ? "brlBoard" : item === "peg" ? "brlPeg" : "brlCoffer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={limbFilter === "inner" ? "1" : "0"} onClick={() => setLimbFilter(limbFilter === "inner" ? "all" : "inner")}>{v4("brlInner")}</button>
        <button type="button" className="c4-chip" data-on={limbFilter === "outer" ? "1" : "0"} onClick={() => setLimbFilter(limbFilter === "outer" ? "all" : "outer")}>{v4("brlOuter")}</button>
        {FILMS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={filmFilter === item ? "1" : "0"} onClick={() => setFilmFilter(filmFilter === item ? "all" : item)}>{filmLabel(v4, item)}</button>
        ))}
        {BEATS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={beatFilter === item ? "1" : "0"} onClick={() => setBeatFilter(beatFilter === item ? "all" : item)}>{item}</button>
        ))}
        {RATES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rateFilter === item ? "1" : "0"} onClick={() => setRateFilter(rateFilter === item ? "all" : item)}>{item}</button>
        ))}
        {setters.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={setterFilter === name ? "1" : "0"} onClick={() => setSetterFilter(setterFilter === name ? "" : name)}>{name}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "striker" ? "1" : "0"} onClick={() => setSort(sort === "striker" ? "limb" : "striker")}>{sort === "striker" ? v4("brlSortStriker") : v4("brlSortLimb")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("brlClose") : v4("brlAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("brlTimeline")}</button>
        <label className="c4-lab">{v4("brlDesk")}<select className="c4-field" aria-label={v4("brlDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{BRL_LIMBS.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-barrel-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addBarrelView(views, { id, name: viewName, tray, query, striker: setterFilter, film: filmFilter, limb: limbFilter, beat: beatFilter, rate: rateFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("brlViewName")}<input className="c4-field" aria-label={v4("brlViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("brlSaveView")}</button>
      </form>
      <ul className="c4-barrel-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setSetterFilter(view.striker); setFilmFilter(view.film); setLimbFilter(view.limb); setBeatFilter(view.beat); setRateFilter(view.rate); }}>{v4("brlApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropBarrelView(views, view.id))}>{v4("brlDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-barrel-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkBarrelPoise(cards, picked))}>{v4("brlBulkPoise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkBarrelCoffer(cards, picked))}>{v4("brlBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkBarrelGraphite(cards, picked))}>{v4("brlBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkBarrelTag(cards, picked))}>{v4("brlBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("barrel-rules.csv", barrelCsv(shown, station))}>{v4("brlCsv")}</button>
        <p className="c4-barrel-meta">{v4("brlKeys")} / n x a j k · {v4("brlQuiet")} {counts.quiet} · {v4("brlInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-barrel-time" aria-label={v4("brlTimeline")}>
          {timeline.map((lane) => <li key={lane.beat}><span>{lane.beat}</span> {lane.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("brlEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-barrel-list">
          {shown.map((card) => {
            const late = lateBarrel(card, station);
            return (
              <li key={card.id} className="c4-barrel-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleBarrel(card) ? "1" : "0"} data-brisk={briskBarrel(card) ? "1" : "0"} data-overdue={overdueBarrel(card) ? "1" : "0"} data-resting={restingBarrel(card) ? "1" : "0"} data-inner={barrelInner(card.limb) ? "1" : "0"} data-outer={barrelOuter(card.limb) ? "1" : "0"}>
                <label className="c4-barrel-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editBarrel(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("brlEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("brlApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editBarrelNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("brlNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-barrel-meta">{limbLabel(v4, card.limb)} · {filmLabel(v4, card.film)} · {card.beat ?? "—"} · {card.rate} · {card.striker || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "brlAuditSave")}` : ""}{late ? ` · ${v4("brlOverdue")}` : ""}</p>
                </div>
                <div className="c4-barrel-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("brlEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBarrelPoise(cards, card.id, !card.poised))}>{card.poised ? v4("brlFree") : v4("brlPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBarrelFilm(cards, card.id, suggestedFilm))}>{v4("brlSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBarrelPeg(cards, card.id, !card.pegged))}>{card.pegged ? v4("brlUnpeg") : v4("brlPegIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBarrelCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("brlUncoffer") : v4("brlCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBarrelStar(cards, card.id, !card.starred))}>{card.starred ? v4("brlUnstar") : v4("brlStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addBarrelTag(cards, card.id, "a"))}>{v4("brlTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseBeatFocused(cards, card.id))}>{v4("brlRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerBeatFocused(cards, card.id))}>{v4("brlLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseRateFocused(cards, card.id))}>{v4("brlStrike")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerRateFocused(cards, card.id))}>{v4("brlStrike")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(filmFocused(cards, card.id))}>{v4("brlFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBarrelFocused(cards, card.id))}>{v4("brlPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pegBarrelFocused(cards, card.id))}>{v4("brlPeg")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starBarrelFocused(cards, card.id))}>{v4("brlStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(barrelCopy(card))}>{v4("brlCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type BackstaffUser = { id?: string; name?: string | null; country?: string | null };

export function BackstaffPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: BackstaffUser[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<BackstaffShape>("all");
  const [review, setReview] = useState<BackstaffReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): BackstaffRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { country: textField(row.country) } satisfies BackstaffValue,
    };
  }).filter((row): row is BackstaffRow => Boolean(row));
  const present = presentBackstaffLanes(rows);
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
    const next = readHiddenBackstaff(readJson(BKS_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(BKS_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedBackstaff(readJson(BKS_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(BKS_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleBackstaffLanes(present, hidden, showHidden);
  const shown = visibleBackstaff(rows, lanes.includes(lane) || lane === "all" ? lane : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = backstaffLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = backstaffLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingBackstaff(rows);
  const leadHue = leadingBackstaffHue(rows);
  const whole = rows.filter((row) => backstaffLane(row.code)).length;
  const share = backstaffShare(laneBackstaffCount(rows, "usa"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("backstaff-lanes.csv", backstaffLanesCsv(rows));
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
    writeJson(BKS_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(BKS_REVIEW_KEY, next);
  }

  return (
    <section className="c4-backstaff" aria-label={v4("bksTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-backstaff-mast">
        <p className="c4-backstaff-seal" data-logo="mono">{v4("bksLogo")}</p>
        <div>
          <p className="c4-backstaff-kicker">{v4("bksSub")}</p>
          <h2 className="c4-title">{v4("bksTitle")}</h2>
        </div>
        <p className="c4-backstaff-count">{shown.length}</p>
      </header>
      <p className="c4-backstaff-links">
        <Link href={crmv4Href(base, "brl")}>{v4("brlTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("bksCustomer")}</Link>
      </p>
      <p className="c4-backstaff-hint">{v4("bksHint")}</p>
      {viewer && <p className="c4-backstaff-note">{v4("bksViewer")}</p>}
      <p className="c4-backstaff-meta">{v4("bksLead")} {laneLabel(v4, lead)} · {v4("bksToneLead")} {hueLabel(v4, leadHue)} · {v4("bksShare")} {share}</p>
      <div className="c4-backstaff-chart" aria-label={v4("bksChart")}>
        {lines.map((line) => (
          <button key={line.lane} type="button" className="c4-backstaff-column" data-on={lane === line.lane ? "1" : "0"} data-lane={line.lane} onClick={() => setLane(lane === line.lane ? "all" : line.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-backstaff-tools">
        <input ref={searchRef} className="c4-field c4-backstaff-search" aria-label={v4("bksSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("bksSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("bksShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "bksAll" : item === "reviewed" ? "bksReviewed" : "bksFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("bksAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as BackstaffShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleBackstaff(hidden, item))}>{hidden.includes(item) ? v4("bksShow") : v4("bksHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-backstaff-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkBackstaffReview(reviewed, picked, true))}>{v4("bksBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkBackstaffReview(reviewed, picked, false))}>{v4("bksBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("backstaff-lanes.csv", backstaffLanesCsv(rows))}>{v4("bksCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("backstaff-rows.csv", backstaffRowsCsv(shown, reviewed))}>{v4("bksRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("bksLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("bksFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("bksEmpty")}</p>}
      <ul className="c4-backstaff-list">
        {shown.map((row) => {
          const name = backstaffCopy(row.code);
          const tone = backstaffHue(row.code);
          return (
            <li key={row.id} className="c4-backstaff-card" data-lane={backstaffLane(row.code) || "open"} data-hue={tone || "none"} data-usa={backstaffLane(row.code) === "usa" ? "1" : "0"} data-gbr={backstaffGbr(row.code) ? "1" : "0"} data-deu={backstaffDeu(row.code) ? "1" : "0"} data-tur={backstaffTur(row.code) ? "1" : "0"} data-open={backstaffOpen(row.code) ? "1" : "0"} data-even={backstaffEven(row.code) ? "1" : "0"} data-digit={backstaffDigit(row.code) ? "1" : "0"} data-letter={backstaffLetter(row.code) ? "1" : "0"} data-mixed={backstaffMixed(row.code) ? "1" : "0"} data-upper={backstaffUpper(row.code) ? "1" : "0"} data-lower={backstaffLower(row.code) ? "1" : "0"} data-space={backstaffSpace(row.code) ? "1" : "0"} data-vowel={backstaffVowel(row.code) ? "1" : "0"} data-tail={backstaffTail(row.code) ? "1" : "0"} data-first={backstaffFirst(row.code) ? "1" : "0"} data-held={backstaffHeld(row.code) ? "1" : "0"} data-join={backstaffJoin(row.code) ? "1" : "0"} data-gap={backstaffGap(row.code) ? "1" : "0"} data-bead={backstaffBead(row.code) ? "1" : "0"}>
              <label className="c4-backstaff-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-backstaff-meta">{name || v4("bksOpen")} · {backstaffStamp(row.code) || "—"} · {backstaffFamily(row.code) || "—"} · {backstaffLength(row.code) ?? "—"} · {laneLabel(v4, backstaffLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-backstaff-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleBackstaffReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("bksReviewed") : v4("bksReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = backstaffCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("bksCopied") : v4("bksCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("bksCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
