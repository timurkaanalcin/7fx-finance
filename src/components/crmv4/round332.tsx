"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  PSN_KEY,
  PSN_REVIEW_KEY,
  MSP_DENSITY_KEY,
  MSP_KEY,
  MSP_LIMBS,
  MSP_VIEW_KEY,
  addMainspring,
  addMainspringTag,
  addMainspringView,
  briskMainspring,
  bulkPlanisphereReview,
  bulkMainspringCoffer,
  bulkMainspringGraphite,
  bulkMainspringPoise,
  bulkMainspringTag,
  busiestWarden,
  dropMainspringView,
  editMainspring,
  editMainspringNote,
  planisphereBead,
  planisphereCopy,
  planisphereDigit,
  planisphereEven,
  planisphereFamily,
  planisphereFirst,
  planisphereGap,
  planisphereHeld,
  planisphereHue,
  planisphereJoin,
  planisphereLane,
  planisphereLanes,
  planisphereLanesCsv,
  planisphereLength,
  planisphereLetter,
  planisphereLower,
  planisphereMixed,
  planisphereOpen,
  planisphereRowsCsv,
  planisphereShare,
  planisphereSpace,
  planisphereStamp,
  planisphereTail,
  planisphereUpper,
  planisphereVowel,
  fairWarden,
  filmFocused,
  mainspringBars,
  mainspringCopy,
  mainspringCounts,
  mainspringCsv,
  mainspringDensity,
  mainspringInner,
  mainspringOuter,
  mainspringTimeline,
  mainspringWardens,
  idleMainspring,
  lanePlanisphereCount,
  lateMainspring,
  leadingPlanisphere,
  leadingPlanisphereHue,
  lowerBeatFocused,
  lowerRateFocused,
  moveMainspringFocus,
  overdueMainspring,
  pegMainspringFocused,
  presentPlanisphereLanes,
  raiseBeatFocused,
  raiseRateFocused,
  readHiddenPlanisphere,
  readMainspringRules,
  readMainspringViews,
  readReviewedPlanisphere,
  reminderMainspringRules,
  restingMainspring,
  setMainspringCoffer,
  setMainspringFilm,
  setMainspringFocused,
  setMainspringPeg,
  setMainspringPoise,
  setMainspringStar,
  sortMainspringRules,
  starMainspringFocused,
  suggestBeat,
  suggestFilm,
  suggestLimb,
  togglePlanisphere,
  togglePlanisphereReview,
  visiblePlanisphere,
  visiblePlanisphereLanes,
  visibleMainspringRules,
  type PlanisphereReview,
  type PlanisphereRow,
  type PlanisphereShape,
  type PlanisphereValue,
  type Mainspring,
  type MainspringDensity,
  type MainspringSort,
  type MainspringTray,
  type MainspringView,
} from "@/lib/crmv4/round332";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["GILT", "IVORY", "GRAPHITE"] as const;
const BEATS = ["3", "7", "12", "18"] as const;
const RATES = ["3", "9", "15"] as const;

const LIMB_KEY: Record<string, CrmV4CopyKey> = {
  barrel: "mspBarrel",
  arbor: "mspArbor",
  hook: "mspHook",
  click: "mspClick",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "mspAuditSave",
  edit: "mspAuditEdit",
  note: "mspAuditNote",
  film: "mspAuditFilm",
  poise: "mspAuditPoise",
  free: "mspAuditFree",
  peg: "mspAuditPeg",
  return: "mspAuditReturn",
  coffer: "mspAuditCoffer",
  open: "mspAuditOpen",
  tag: "mspAuditTag",
  rate: "mspAuditRate",
  beat: "mspAuditBeat",
  lower: "mspAuditLower",
  star: "mspAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  code: "psnCode",
  join: "psnJoin",
  gap: "psnGap",
  bead: "psnBead",
  ribbon: "psnRibbon",
  mark: "psnMark",
  vowel: "psnVowel",
  plain: "psnPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "psnChampagne",
  ivory: "psnIvory",
  graphite: "psnGraphite",
};

const SHAPE_KEY: Record<PlanisphereShape, CrmV4CopyKey> = {
  all: "psnShapeAll",
  code: "psnShapeCode",
  join: "psnShapeJoin",
  gap: "psnShapeGap",
  bead: "psnShapeBead",
  ribbon: "psnShapeRibbon",
  mark: "psnShapeMark",
  vowel: "psnShapeVowel",
  plain: "psnShapePlain",
  open: "psnShapeOpen",
  soon: "psnShapeOpen",
  letter: "psnShapePlain",
  mixed: "psnShapeMark",
  upper: "psnShapeCode",
  lower: "psnShapePlain",
  space: "psnShapeGap",
  even: "psnShapeEven",
  odd: "psnShapeEven",
  tail: "psnShapeMark",
  first: "psnShapePlain",
  held: "psnShapeRibbon",
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
  return key ? v4(key) : v4("mspBlankLimb");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "GILT") return v4("mspGilt");
  if (film === "IVORY") return v4("mspIvory");
  if (film === "GRAPHITE") return v4("mspGraphite");
  return v4("mspAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("psnBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("psnBlank");
}

export function MainspringRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Mainspring[]>([]);
  const [views, setViews] = useState<MainspringView[]>([]);
  const [density, setDensity] = useState<MainspringDensity>("airy");
  const [tray, setTray] = useState<MainspringTray>("board");
  const [query, setQuery] = useState("");
  const [wardenFilter, setWardenFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [limbFilter, setLimbFilter] = useState("all");
  const [beatFilter, setBeatFilter] = useState("all");
  const [rateFilter, setRateFilter] = useState("all");
  const [sort, setSort] = useState<MainspringSort>("limb");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [warden, setWarden] = useState("");
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
  const [station, setStation] = useState("barrel");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readMainspringRules(readJson(MSP_KEY, [])));
    setViews(readMainspringViews(readJson(MSP_VIEW_KEY, [])));
    setDensity(mainspringDensity(readJson(MSP_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Mainspring[]) {
    setCards(next);
    writeJson(MSP_KEY, next);
  }
  function storeViews(next: MainspringView[]) {
    setViews(next);
    writeJson(MSP_VIEW_KEY, next);
  }
  function storeDensity(next: MainspringDensity) {
    setDensity(next);
    writeJson(MSP_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortMainspringRules(visibleMainspringRules(cards, tray, query, wardenFilter, filmFilter, limbFilter, beatFilter, rateFilter), sort),
    [cards, tray, query, wardenFilter, filmFilter, limbFilter, beatFilter, rateFilter, sort],
  );
  const counts = mainspringCounts(cards, shown, station);
  const bars = mainspringBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = mainspringTimeline(cards);
  const reminders = reminderMainspringRules(cards);
  const wardens = mainspringWardens(cards);
  const busy = busiestWarden(cards);
  const fair = fairWarden(cards, wardens.join(","));
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
        download("mainspring-rules.csv", mainspringCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveMainspringFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveMainspringFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addMainspring(cards, { title, note, warden, limb, beat: beatNo, film, rate: rateNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-mainspring" aria-label={v4("mspTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-mainspring-mast">
        <p className="c4-mainspring-seal" data-logo="mono">{v4("mspLogo")}</p>
        <div>
          <p className="c4-mainspring-kicker">{v4("mspSub")}</p>
          <h2 className="c4-title">{v4("mspTitle")}</h2>
        </div>
        <p className="c4-mainspring-count">{shown.length}</p>
      </header>
      <p className="c4-mainspring-links">
        <Link href={crmv4Href(base, "psn")}>{v4("psnTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("mspCustomers")}</Link>
      </p>
      <p className="c4-mainspring-hint">{v4("mspHint")}</p>
      {viewer && <p className="c4-mainspring-note">{v4("mspViewer")}</p>}
      <p className="c4-mainspring-meta">{v4("mspFair")} {fair || "—"} · {v4("mspBusy")} {busy || "—"} · {v4("mspSuggest")} {limbLabel(v4, suggestedLimb)} · {filmLabel(v4, suggestedFilm)} · {suggestedBeat}</p>
      <ol className="c4-mainspring-index" aria-label={v4("mspRemind")}>
        <li data-tone="gold">{v4("mspOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("mspIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("mspBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("mspResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-mainspring-remind c4-mainspring-notices" role="status" aria-label={v4("mspRemind")}>
          {reminders.map((name) => <li key={name}>{v4("mspOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-mainspring-chart" aria-label={v4("mspChart")}>
        {bars.map((bar) => (
          <button key={bar.limb} type="button" className="c4-mainspring-column" data-on={limbFilter === bar.limb ? "1" : "0"} onClick={() => setLimbFilter(limbFilter === bar.limb ? "all" : bar.limb)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{limbLabel(v4, bar.limb)}</span>
          </button>
        ))}
      </div>
      <form className="c4-mainspring-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("mspEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("mspEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("mspNote")}<input className="c4-field" aria-label={v4("mspNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("mspWarden")}<input className="c4-field" aria-label={v4("mspWarden")} aria-required={false} value={warden} maxLength={24} disabled={viewer} onChange={(event) => setWarden(event.target.value)} /></label>
        <label className="c4-lab">{v4("mspLimb")}<select className="c4-field" aria-label={v4("mspLimb")} value={limb} disabled={viewer} onChange={(event) => setLimb(event.target.value)}><option value="">{v4("mspBlankLimb")}</option>{MSP_LIMBS.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("mspFilm")}<select className="c4-field" aria-label={v4("mspFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("mspAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("mspBeat")}<select className="c4-field" aria-label={v4("mspBeat")} value={beatNo} disabled={viewer} onChange={(event) => setBeatNo(event.target.value)}><option value="">{v4("mspAll")}</option>{BEATS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("mspRate")}<select className="c4-field" aria-label={v4("mspRate")} value={rateNo} disabled={viewer} onChange={(event) => setRateNo(event.target.value)}><option value="">{v4("mspAll")}</option>{RATES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("mspTag")}<input className="c4-field" aria-label={v4("mspTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("mspAdd")}</button>
      </form>
      <div className="c4-mainspring-tools">
        <input ref={searchRef} className="c4-field c4-mainspring-search" aria-label={v4("mspSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("mspSearch")} />
        {(["board", "peg", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "board" ? "mspBoard" : item === "peg" ? "mspPeg" : "mspCoffer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={limbFilter === "inner" ? "1" : "0"} onClick={() => setLimbFilter(limbFilter === "inner" ? "all" : "inner")}>{v4("mspInner")}</button>
        <button type="button" className="c4-chip" data-on={limbFilter === "outer" ? "1" : "0"} onClick={() => setLimbFilter(limbFilter === "outer" ? "all" : "outer")}>{v4("mspOuter")}</button>
        {FILMS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={filmFilter === item ? "1" : "0"} onClick={() => setFilmFilter(filmFilter === item ? "all" : item)}>{filmLabel(v4, item)}</button>
        ))}
        {BEATS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={beatFilter === item ? "1" : "0"} onClick={() => setBeatFilter(beatFilter === item ? "all" : item)}>{item}</button>
        ))}
        {RATES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rateFilter === item ? "1" : "0"} onClick={() => setRateFilter(rateFilter === item ? "all" : item)}>{item}</button>
        ))}
        {wardens.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={wardenFilter === name ? "1" : "0"} onClick={() => setWardenFilter(wardenFilter === name ? "" : name)}>{name}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "warden" ? "1" : "0"} onClick={() => setSort(sort === "warden" ? "limb" : "warden")}>{sort === "warden" ? v4("mspSortWarden") : v4("mspSortLimb")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("mspClose") : v4("mspAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("mspTimeline")}</button>
        <label className="c4-lab">{v4("mspDesk")}<select className="c4-field" aria-label={v4("mspDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{MSP_LIMBS.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-mainspring-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addMainspringView(views, { id, name: viewName, tray, query, warden: wardenFilter, film: filmFilter, limb: limbFilter, beat: beatFilter, rate: rateFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("mspViewName")}<input className="c4-field" aria-label={v4("mspViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("mspSaveView")}</button>
      </form>
      <ul className="c4-mainspring-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setWardenFilter(view.warden); setFilmFilter(view.film); setLimbFilter(view.limb); setBeatFilter(view.beat); setRateFilter(view.rate); }}>{v4("mspApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropMainspringView(views, view.id))}>{v4("mspDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-mainspring-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkMainspringPoise(cards, picked))}>{v4("mspBulkPoise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkMainspringCoffer(cards, picked))}>{v4("mspBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkMainspringGraphite(cards, picked))}>{v4("mspBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkMainspringTag(cards, picked))}>{v4("mspBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("mainspring-rules.csv", mainspringCsv(shown, station))}>{v4("mspCsv")}</button>
        <p className="c4-mainspring-meta">{v4("mspKeys")} / n x a j k · {v4("mspQuiet")} {counts.quiet} · {v4("mspInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-mainspring-time" aria-label={v4("mspTimeline")}>
          {timeline.map((lane) => <li key={lane.beat}><span>{lane.beat}</span> {lane.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("mspEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-mainspring-list">
          {shown.map((card) => {
            const late = lateMainspring(card, station);
            return (
              <li key={card.id} className="c4-mainspring-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleMainspring(card) ? "1" : "0"} data-brisk={briskMainspring(card) ? "1" : "0"} data-overdue={overdueMainspring(card) ? "1" : "0"} data-resting={restingMainspring(card) ? "1" : "0"} data-inner={mainspringInner(card.limb) ? "1" : "0"} data-outer={mainspringOuter(card.limb) ? "1" : "0"}>
                <label className="c4-mainspring-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editMainspring(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("mspEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("mspApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editMainspringNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("mspNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-mainspring-meta">{limbLabel(v4, card.limb)} · {filmLabel(v4, card.film)} · {card.beat ?? "—"} · {card.rate} · {card.warden || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "mspAuditSave")}` : ""}{late ? ` · ${v4("mspOverdue")}` : ""}</p>
                </div>
                <div className="c4-mainspring-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("mspEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setMainspringPoise(cards, card.id, !card.poised))}>{card.poised ? v4("mspFree") : v4("mspPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setMainspringFilm(cards, card.id, suggestedFilm))}>{v4("mspSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setMainspringPeg(cards, card.id, !card.pegged))}>{card.pegged ? v4("mspUnpeg") : v4("mspPegIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setMainspringCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("mspUncoffer") : v4("mspCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setMainspringStar(cards, card.id, !card.starred))}>{card.starred ? v4("mspUnstar") : v4("mspStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addMainspringTag(cards, card.id, "m"))}>{v4("mspTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseBeatFocused(cards, card.id))}>{v4("mspRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerBeatFocused(cards, card.id))}>{v4("mspLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseRateFocused(cards, card.id))}>{v4("mspRate")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerRateFocused(cards, card.id))}>{v4("mspRate")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(filmFocused(cards, card.id))}>{v4("mspFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setMainspringFocused(cards, card.id))}>{v4("mspPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pegMainspringFocused(cards, card.id))}>{v4("mspPeg")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starMainspringFocused(cards, card.id))}>{v4("mspStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(mainspringCopy(card))}>{v4("mspCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type PlanisphereUser = { id?: string; name?: string | null; lastCity?: string | null };

export function PlanispherePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: PlanisphereUser[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<PlanisphereShape>("all");
  const [review, setReview] = useState<PlanisphereReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): PlanisphereRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { lastCity: textField(row.lastCity) } satisfies PlanisphereValue,
    };
  }).filter((row): row is PlanisphereRow => Boolean(row));
  const present = presentPlanisphereLanes(rows);
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
    const next = readHiddenPlanisphere(readJson(PSN_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(PSN_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedPlanisphere(readJson(PSN_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(PSN_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visiblePlanisphereLanes(present, hidden, showHidden);
  const shown = visiblePlanisphere(rows, lanes.includes(lane) || lane === "all" ? lane : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = planisphereLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = planisphereLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingPlanisphere(rows);
  const leadHue = leadingPlanisphereHue(rows);
  const whole = rows.filter((row) => planisphereLane(row.code)).length;
  const share = planisphereShare(lanePlanisphereCount(rows, "code"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("planisphere-lanes.csv", planisphereLanesCsv(rows));
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
    writeJson(PSN_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(PSN_REVIEW_KEY, next);
  }

  return (
    <section className="c4-planisphere" aria-label={v4("psnTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-planisphere-mast">
        <p className="c4-planisphere-seal" data-logo="mono">{v4("psnLogo")}</p>
        <div>
          <p className="c4-planisphere-kicker">{v4("psnSub")}</p>
          <h2 className="c4-title">{v4("psnTitle")}</h2>
        </div>
        <p className="c4-planisphere-count">{shown.length}</p>
      </header>
      <p className="c4-planisphere-links">
        <Link href={crmv4Href(base, "msp")}>{v4("mspTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("psnCustomer")}</Link>
      </p>
      <p className="c4-planisphere-hint">{v4("psnHint")}</p>
      {viewer && <p className="c4-planisphere-note">{v4("psnViewer")}</p>}
      <p className="c4-planisphere-meta">{v4("psnLead")} {laneLabel(v4, lead)} · {v4("psnToneLead")} {hueLabel(v4, leadHue)} · {v4("psnShare")} {share}</p>
      <div className="c4-planisphere-chart" aria-label={v4("psnChart")}>
        {lines.map((line) => (
          <button key={line.lane} type="button" className="c4-planisphere-column" data-on={lane === line.lane ? "1" : "0"} data-lane={line.lane} onClick={() => setLane(lane === line.lane ? "all" : line.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-planisphere-tools">
        <input ref={searchRef} className="c4-field c4-planisphere-search" aria-label={v4("psnSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("psnSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("psnShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "psnAll" : item === "reviewed" ? "psnReviewed" : "psnFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("psnAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as PlanisphereShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(togglePlanisphere(hidden, item))}>{hidden.includes(item) ? v4("psnShow") : v4("psnHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-planisphere-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkPlanisphereReview(reviewed, picked, true))}>{v4("psnBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkPlanisphereReview(reviewed, picked, false))}>{v4("psnBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("planisphere-lanes.csv", planisphereLanesCsv(rows))}>{v4("psnCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("planisphere-rows.csv", planisphereRowsCsv(shown, reviewed))}>{v4("psnRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("psnLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("psnFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("psnEmpty")}</p>}
      <ul className="c4-planisphere-list">
        {shown.map((row) => {
          const name = planisphereCopy(row.code);
          const tone = planisphereHue(row.code);
          return (
            <li key={row.id} className="c4-planisphere-card" data-lane={planisphereLane(row.code) || "open"} data-hue={tone || "none"} data-code={planisphereLane(row.code) === "code" ? "1" : "0"} data-open={planisphereOpen(row.code) ? "1" : "0"} data-even={planisphereEven(row.code) ? "1" : "0"} data-digit={planisphereDigit(row.code) ? "1" : "0"} data-letter={planisphereLetter(row.code) ? "1" : "0"} data-mixed={planisphereMixed(row.code) ? "1" : "0"} data-upper={planisphereUpper(row.code) ? "1" : "0"} data-lower={planisphereLower(row.code) ? "1" : "0"} data-space={planisphereSpace(row.code) ? "1" : "0"} data-vowel={planisphereVowel(row.code) ? "1" : "0"} data-tail={planisphereTail(row.code) ? "1" : "0"} data-first={planisphereFirst(row.code) ? "1" : "0"} data-held={planisphereHeld(row.code) ? "1" : "0"} data-join={planisphereJoin(row.code) ? "1" : "0"} data-gap={planisphereGap(row.code) ? "1" : "0"} data-bead={planisphereBead(row.code) ? "1" : "0"}>
              <label className="c4-planisphere-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-planisphere-meta">{name || v4("psnOpen")} · {planisphereStamp(row.code) || "—"} · {planisphereFamily(row.code) || "—"} · {planisphereLength(row.code) ?? "—"} · {laneLabel(v4, planisphereLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-planisphere-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(togglePlanisphereReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("psnReviewed") : v4("psnReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = planisphereCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("psnCopied") : v4("psnCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("psnCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
