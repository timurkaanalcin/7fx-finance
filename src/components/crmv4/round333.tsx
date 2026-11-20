"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  TQM_KEY,
  TQM_REVIEW_KEY,
  OVC_DENSITY_KEY,
  OVC_KEY,
  OVC_LIMBS,
  OVC_VIEW_KEY,
  addOvercoil,
  addOvercoilTag,
  addOvercoilView,
  briskOvercoil,
  bulkTorquetumReview,
  bulkOvercoilCoffer,
  bulkOvercoilGraphite,
  bulkOvercoilPoise,
  bulkOvercoilTag,
  busiestMaker,
  dropOvercoilView,
  editOvercoil,
  editOvercoilNote,
  torquetumBead,
  torquetumCopy,
  torquetumDigit,
  torquetumEven,
  torquetumFamily,
  torquetumFirst,
  torquetumGap,
  torquetumHeld,
  torquetumHold,
  torquetumHue,
  torquetumJoin,
  torquetumRest,
  torquetumLane,
  torquetumLanes,
  torquetumLanesCsv,
  torquetumLength,
  torquetumLetter,
  torquetumLower,
  torquetumMixed,
  torquetumOpen,
  torquetumRowsCsv,
  torquetumShare,
  torquetumSpace,
  torquetumStamp,
  torquetumTail,
  torquetumUpper,
  torquetumWatch,
  torquetumVowel,
  fairMaker,
  filmFocused,
  overcoilBars,
  overcoilCopy,
  overcoilCounts,
  overcoilCsv,
  overcoilDensity,
  overcoilInner,
  overcoilOuter,
  overcoilTimeline,
  overcoilMakers,
  idleOvercoil,
  laneTorquetumCount,
  lateOvercoil,
  leadingTorquetum,
  leadingTorquetumHue,
  lowerBeatFocused,
  lowerRateFocused,
  moveOvercoilFocus,
  overdueOvercoil,
  pegOvercoilFocused,
  presentTorquetumLanes,
  raiseBeatFocused,
  raiseRateFocused,
  readHiddenTorquetum,
  readOvercoilRules,
  readOvercoilViews,
  readReviewedTorquetum,
  reminderOvercoilRules,
  restingOvercoil,
  setOvercoilCoffer,
  setOvercoilFilm,
  setOvercoilFocused,
  setOvercoilPeg,
  setOvercoilPoise,
  setOvercoilStar,
  sortOvercoilRules,
  starOvercoilFocused,
  suggestBeat,
  suggestFilm,
  suggestLimb,
  toggleTorquetum,
  toggleTorquetumReview,
  visibleTorquetum,
  visibleTorquetumLanes,
  visibleOvercoilRules,
  type TorquetumReview,
  type TorquetumRow,
  type TorquetumShape,
  type TorquetumValue,
  type Overcoil,
  type OvercoilDensity,
  type OvercoilSort,
  type OvercoilTray,
  type OvercoilView,
} from "@/lib/crmv4/round333";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["GILT", "IVORY", "GRAPHITE"] as const;
const BEATS = ["4", "8", "16", "24"] as const;
const RATES = ["2", "6", "10"] as const;

const LIMB_KEY: Record<string, CrmV4CopyKey> = {
  coil: "ovcCoil",
  collet: "ovcCollet",
  stud: "ovcStud",
  terminal: "ovcTerminal",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "ovcAuditSave",
  edit: "ovcAuditEdit",
  note: "ovcAuditNote",
  film: "ovcAuditFilm",
  poise: "ovcAuditPoise",
  free: "ovcAuditFree",
  peg: "ovcAuditPeg",
  return: "ovcAuditReturn",
  coffer: "ovcAuditCoffer",
  open: "ovcAuditOpen",
  tag: "ovcAuditTag",
  rate: "ovcAuditRate",
  beat: "ovcAuditBeat",
  lower: "ovcAuditLower",
  star: "ovcAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  live: "tqmLive",
  hold: "tqmHold",
  watch: "tqmWatch",
  rest: "tqmRest",
  join: "tqmJoin",
  gap: "tqmGap",
  bead: "tqmBead",
  ribbon: "tqmRibbon",
  mark: "tqmMark",
  vowel: "tqmVowel",
  plain: "tqmPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "tqmChampagne",
  ivory: "tqmIvory",
  graphite: "tqmGraphite",
};

const SHAPE_KEY: Record<TorquetumShape, CrmV4CopyKey> = {
  all: "tqmShapeAll",
  live: "tqmShapeLive",
  hold: "tqmShapeHold",
  watch: "tqmShapeWatch",
  rest: "tqmShapeRest",
  join: "tqmShapeJoin",
  gap: "tqmShapeGap",
  bead: "tqmShapeBead",
  ribbon: "tqmShapeRibbon",
  mark: "tqmShapeMark",
  vowel: "tqmShapeVowel",
  plain: "tqmShapePlain",
  open: "tqmShapeOpen",
  soon: "tqmShapeOpen",
  letter: "tqmShapePlain",
  mixed: "tqmShapeMark",
  upper: "tqmShapeLive",
  lower: "tqmShapePlain",
  space: "tqmShapeGap",
  even: "tqmShapeEven",
  odd: "tqmShapeEven",
  tail: "tqmShapeMark",
  first: "tqmShapePlain",
  held: "tqmShapeRibbon",
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
  return key ? v4(key) : v4("ovcBlankLimb");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "GILT") return v4("ovcGilt");
  if (film === "IVORY") return v4("ovcIvory");
  if (film === "GRAPHITE") return v4("ovcGraphite");
  return v4("ovcAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("tqmBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("tqmBlank");
}

export function OvercoilRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Overcoil[]>([]);
  const [views, setViews] = useState<OvercoilView[]>([]);
  const [density, setDensity] = useState<OvercoilDensity>("airy");
  const [tray, setTray] = useState<OvercoilTray>("board");
  const [query, setQuery] = useState("");
  const [makerFilter, setMakerFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [limbFilter, setLimbFilter] = useState("all");
  const [beatFilter, setBeatFilter] = useState("all");
  const [rateFilter, setRateFilter] = useState("all");
  const [sort, setSort] = useState<OvercoilSort>("limb");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [maker, setMaker] = useState("");
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
  const [station, setStation] = useState("coil");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readOvercoilRules(readJson(OVC_KEY, [])));
    setViews(readOvercoilViews(readJson(OVC_VIEW_KEY, [])));
    setDensity(overcoilDensity(readJson(OVC_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Overcoil[]) {
    setCards(next);
    writeJson(OVC_KEY, next);
  }
  function storeViews(next: OvercoilView[]) {
    setViews(next);
    writeJson(OVC_VIEW_KEY, next);
  }
  function storeDensity(next: OvercoilDensity) {
    setDensity(next);
    writeJson(OVC_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortOvercoilRules(visibleOvercoilRules(cards, tray, query, makerFilter, filmFilter, limbFilter, beatFilter, rateFilter), sort),
    [cards, tray, query, makerFilter, filmFilter, limbFilter, beatFilter, rateFilter, sort],
  );
  const counts = overcoilCounts(cards, shown, station);
  const bars = overcoilBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = overcoilTimeline(cards);
  const reminders = reminderOvercoilRules(cards);
  const makers = overcoilMakers(cards);
  const busy = busiestMaker(cards);
  const fair = fairMaker(cards, makers.join(","));
  const suggestedFilm = suggestFilm(cards);
  const suggestedBeat = suggestBeat(cards, clock);
  const suggestedLimb = suggestLimb(clock);
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
        download("overcoil-rules.csv", overcoilCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveOvercoilFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveOvercoilFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addOvercoil(cards, { title, note, maker, limb, beat: beatNo, film, rate: rateNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-overcoil" aria-label={v4("ovcTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-overcoil-mast">
        <p className="c4-overcoil-seal" data-logo="mono">{v4("ovcLogo")}</p>
        <div>
          <p className="c4-overcoil-kicker">{v4("ovcSub")}</p>
          <h2 className="c4-title">{v4("ovcTitle")}</h2>
        </div>
        <p className="c4-overcoil-count">{shown.length}</p>
      </header>
      <p className="c4-overcoil-links">
        <Link href={crmv4Href(base, "tqm")}>{v4("tqmTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("ovcCustomers")}</Link>
      </p>
      <p className="c4-overcoil-hint">{v4("ovcHint")}</p>
      {viewer && <p className="c4-overcoil-note">{v4("ovcViewer")}</p>}
      <p className="c4-overcoil-meta">{v4("ovcFair")} {fair || "—"} · {v4("ovcBusy")} {busy || "—"} · {v4("ovcSuggest")} {limbLabel(v4, suggestedLimb)} · {filmLabel(v4, suggestedFilm)} · {suggestedBeat}</p>
      <ol className="c4-overcoil-index" aria-label={v4("ovcRemind")}>
        <li data-tone="gold">{v4("ovcOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("ovcIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("ovcBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("ovcResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-overcoil-remind c4-overcoil-notices" role="status" aria-label={v4("ovcRemind")}>
          {reminders.map((name) => <li key={name}>{v4("ovcOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-overcoil-chart" aria-label={v4("ovcChart")}>
        {bars.map((bar) => (
          <button key={bar.limb} type="button" className="c4-overcoil-column" data-on={limbFilter === bar.limb ? "1" : "0"} onClick={() => setLimbFilter(limbFilter === bar.limb ? "all" : bar.limb)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{limbLabel(v4, bar.limb)}</span>
          </button>
        ))}
      </div>
      <form className="c4-overcoil-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("ovcEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("ovcEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("ovcNote")}<input className="c4-field" aria-label={v4("ovcNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("ovcMaker")}<input className="c4-field" aria-label={v4("ovcMaker")} aria-required={false} value={maker} maxLength={24} disabled={viewer} onChange={(event) => setMaker(event.target.value)} /></label>
        <label className="c4-lab">{v4("ovcLimb")}<select className="c4-field" aria-label={v4("ovcLimb")} value={limb} disabled={viewer} onChange={(event) => setLimb(event.target.value)}><option value="">{v4("ovcBlankLimb")}</option>{OVC_LIMBS.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("ovcFilm")}<select className="c4-field" aria-label={v4("ovcFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("ovcAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("ovcBeat")}<select className="c4-field" aria-label={v4("ovcBeat")} value={beatNo} disabled={viewer} onChange={(event) => setBeatNo(event.target.value)}><option value="">{v4("ovcAll")}</option>{BEATS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("ovcRate")}<select className="c4-field" aria-label={v4("ovcRate")} value={rateNo} disabled={viewer} onChange={(event) => setRateNo(event.target.value)}><option value="">{v4("ovcAll")}</option>{RATES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("ovcTag")}<input className="c4-field" aria-label={v4("ovcTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("ovcAdd")}</button>
      </form>
      <div className="c4-overcoil-tools">
        <input ref={searchRef} className="c4-field c4-overcoil-search" aria-label={v4("ovcSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("ovcSearch")} />
        {(["board", "peg", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "board" ? "ovcBoard" : item === "peg" ? "ovcPeg" : "ovcCoffer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={limbFilter === "inner" ? "1" : "0"} onClick={() => setLimbFilter(limbFilter === "inner" ? "all" : "inner")}>{v4("ovcInner")}</button>
        <button type="button" className="c4-chip" data-on={limbFilter === "outer" ? "1" : "0"} onClick={() => setLimbFilter(limbFilter === "outer" ? "all" : "outer")}>{v4("ovcOuter")}</button>
        {FILMS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={filmFilter === item ? "1" : "0"} onClick={() => setFilmFilter(filmFilter === item ? "all" : item)}>{filmLabel(v4, item)}</button>
        ))}
        {BEATS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={beatFilter === item ? "1" : "0"} onClick={() => setBeatFilter(beatFilter === item ? "all" : item)}>{item}</button>
        ))}
        {RATES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rateFilter === item ? "1" : "0"} onClick={() => setRateFilter(rateFilter === item ? "all" : item)}>{item}</button>
        ))}
        {makers.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={makerFilter === name ? "1" : "0"} onClick={() => setMakerFilter(makerFilter === name ? "" : name)}>{name}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "maker" ? "1" : "0"} onClick={() => setSort(sort === "maker" ? "limb" : "maker")}>{sort === "maker" ? v4("ovcSortMaker") : v4("ovcSortLimb")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("ovcClose") : v4("ovcAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("ovcTimeline")}</button>
        <label className="c4-lab">{v4("ovcDesk")}<select className="c4-field" aria-label={v4("ovcDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{OVC_LIMBS.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-overcoil-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addOvercoilView(views, { id, name: viewName, tray, query, maker: makerFilter, film: filmFilter, limb: limbFilter, beat: beatFilter, rate: rateFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("ovcViewName")}<input className="c4-field" aria-label={v4("ovcViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("ovcSaveView")}</button>
      </form>
      <ul className="c4-overcoil-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setMakerFilter(view.maker); setFilmFilter(view.film); setLimbFilter(view.limb); setBeatFilter(view.beat); setRateFilter(view.rate); }}>{v4("ovcApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropOvercoilView(views, view.id))}>{v4("ovcDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-overcoil-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkOvercoilPoise(cards, picked))}>{v4("ovcBulkPoise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkOvercoilCoffer(cards, picked))}>{v4("ovcBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkOvercoilGraphite(cards, picked))}>{v4("ovcBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkOvercoilTag(cards, picked))}>{v4("ovcBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("overcoil-rules.csv", overcoilCsv(shown, station))}>{v4("ovcCsv")}</button>
        <p className="c4-overcoil-meta">{v4("ovcKeys")} / n x a j k · {v4("ovcQuiet")} {counts.quiet} · {v4("ovcInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-overcoil-time" aria-label={v4("ovcTimeline")}>
          {timeline.map((lane) => <li key={lane.beat}><span>{lane.beat}</span> {lane.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("ovcEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-overcoil-list">
          {shown.map((card) => {
            const late = lateOvercoil(card, station);
            return (
              <li key={card.id} className="c4-overcoil-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleOvercoil(card) ? "1" : "0"} data-brisk={briskOvercoil(card) ? "1" : "0"} data-overdue={overdueOvercoil(card) ? "1" : "0"} data-resting={restingOvercoil(card) ? "1" : "0"} data-inner={overcoilInner(card.limb) ? "1" : "0"} data-outer={overcoilOuter(card.limb) ? "1" : "0"}>
                <label className="c4-overcoil-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editOvercoil(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("ovcEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("ovcApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editOvercoilNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("ovcNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-overcoil-meta">{limbLabel(v4, card.limb)} · {filmLabel(v4, card.film)} · {card.beat ?? "—"} · {card.rate} · {card.maker || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "ovcAuditSave")}` : ""}{late ? ` · ${v4("ovcOverdue")}` : ""}</p>
                </div>
                <div className="c4-overcoil-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("ovcEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOvercoilPoise(cards, card.id, !card.poised))}>{card.poised ? v4("ovcFree") : v4("ovcPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOvercoilFilm(cards, card.id, suggestedFilm))}>{v4("ovcSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOvercoilPeg(cards, card.id, !card.pegged))}>{card.pegged ? v4("ovcUnpeg") : v4("ovcPegIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOvercoilCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("ovcUncoffer") : v4("ovcCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOvercoilStar(cards, card.id, !card.starred))}>{card.starred ? v4("ovcUnstar") : v4("ovcStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addOvercoilTag(cards, card.id, "c"))}>{v4("ovcTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseBeatFocused(cards, card.id))}>{v4("ovcRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerBeatFocused(cards, card.id))}>{v4("ovcLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseRateFocused(cards, card.id))}>{v4("ovcRate")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerRateFocused(cards, card.id))}>{v4("ovcRate")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(filmFocused(cards, card.id))}>{v4("ovcFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOvercoilFocused(cards, card.id))}>{v4("ovcPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pegOvercoilFocused(cards, card.id))}>{v4("ovcPeg")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starOvercoilFocused(cards, card.id))}>{v4("ovcStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(overcoilCopy(card))}>{v4("ovcCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type TorquetumUser = { id?: string; name?: string | null; active?: string | null };

export function TorquetumPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: TorquetumUser[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<TorquetumShape>("all");
  const [review, setReview] = useState<TorquetumReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): TorquetumRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { active: textField(row.active) } satisfies TorquetumValue,
    };
  }).filter((row): row is TorquetumRow => Boolean(row));
  const present = presentTorquetumLanes(rows);
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
    const next = readHiddenTorquetum(readJson(TQM_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(TQM_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedTorquetum(readJson(TQM_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(TQM_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleTorquetumLanes(present, hidden, showHidden);
  const shown = visibleTorquetum(rows, lanes.includes(lane) || lane === "all" ? lane : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = torquetumLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = torquetumLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingTorquetum(rows);
  const leadHue = leadingTorquetumHue(rows);
  const whole = rows.filter((row) => torquetumLane(row.code)).length;
  const share = torquetumShare(laneTorquetumCount(rows, "live"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("torquetum-lanes.csv", torquetumLanesCsv(rows));
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
    writeJson(TQM_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(TQM_REVIEW_KEY, next);
  }

  return (
    <section className="c4-torquetum" aria-label={v4("tqmTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-torquetum-mast">
        <p className="c4-torquetum-seal" data-logo="mono">{v4("tqmLogo")}</p>
        <div>
          <p className="c4-torquetum-kicker">{v4("tqmSub")}</p>
          <h2 className="c4-title">{v4("tqmTitle")}</h2>
        </div>
        <p className="c4-torquetum-count">{shown.length}</p>
      </header>
      <p className="c4-torquetum-links">
        <Link href={crmv4Href(base, "ovc")}>{v4("ovcTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("tqmCustomer")}</Link>
      </p>
      <p className="c4-torquetum-hint">{v4("tqmHint")}</p>
      {viewer && <p className="c4-torquetum-note">{v4("tqmViewer")}</p>}
      <p className="c4-torquetum-meta">{v4("tqmLead")} {laneLabel(v4, lead)} · {v4("tqmToneLead")} {hueLabel(v4, leadHue)} · {v4("tqmShare")} {share}</p>
      <div className="c4-torquetum-chart" aria-label={v4("tqmChart")}>
        {lines.map((line) => (
          <button key={line.lane} type="button" className="c4-torquetum-column" data-on={lane === line.lane ? "1" : "0"} data-lane={line.lane} onClick={() => setLane(lane === line.lane ? "all" : line.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-torquetum-tools">
        <input ref={searchRef} className="c4-field c4-torquetum-search" aria-label={v4("tqmSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("tqmSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("tqmShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "tqmAll" : item === "reviewed" ? "tqmReviewed" : "tqmFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("tqmAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as TorquetumShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleTorquetum(hidden, item))}>{hidden.includes(item) ? v4("tqmShow") : v4("tqmHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-torquetum-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkTorquetumReview(reviewed, picked, true))}>{v4("tqmBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkTorquetumReview(reviewed, picked, false))}>{v4("tqmBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("torquetum-lanes.csv", torquetumLanesCsv(rows))}>{v4("tqmCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("torquetum-rows.csv", torquetumRowsCsv(shown, reviewed))}>{v4("tqmRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("tqmLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("tqmFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("tqmEmpty")}</p>}
      <ul className="c4-torquetum-list">
        {shown.map((row) => {
          const name = torquetumCopy(row.code);
          const tone = torquetumHue(row.code);
          return (
            <li key={row.id} className="c4-torquetum-card" data-lane={torquetumLane(row.code) || "open"} data-hue={tone || "none"} data-live={torquetumLane(row.code) === "live" ? "1" : "0"} data-hold={torquetumHold(row.code) ? "1" : "0"} data-watch={torquetumWatch(row.code) ? "1" : "0"} data-rest={torquetumRest(row.code) ? "1" : "0"} data-open={torquetumOpen(row.code) ? "1" : "0"} data-even={torquetumEven(row.code) ? "1" : "0"} data-digit={torquetumDigit(row.code) ? "1" : "0"} data-letter={torquetumLetter(row.code) ? "1" : "0"} data-mixed={torquetumMixed(row.code) ? "1" : "0"} data-upper={torquetumUpper(row.code) ? "1" : "0"} data-lower={torquetumLower(row.code) ? "1" : "0"} data-space={torquetumSpace(row.code) ? "1" : "0"} data-vowel={torquetumVowel(row.code) ? "1" : "0"} data-tail={torquetumTail(row.code) ? "1" : "0"} data-first={torquetumFirst(row.code) ? "1" : "0"} data-held={torquetumHeld(row.code) ? "1" : "0"} data-join={torquetumJoin(row.code) ? "1" : "0"} data-gap={torquetumGap(row.code) ? "1" : "0"} data-bead={torquetumBead(row.code) ? "1" : "0"}>
              <label className="c4-torquetum-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-torquetum-meta">{name || v4("tqmOpen")} · {torquetumStamp(row.code) || "—"} · {torquetumFamily(row.code) || "—"} · {torquetumLength(row.code) ?? "—"} · {laneLabel(v4, torquetumLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-torquetum-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleTorquetumReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("tqmReviewed") : v4("tqmReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = torquetumCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("tqmCopied") : v4("tqmCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("tqmCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
