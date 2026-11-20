"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  GNG_KEY,
  GNG_REVIEW_KEY,
  RPT_DENSITY_KEY,
  RPT_KEY,
  RPT_LIMBS,
  RPT_VIEW_KEY,
  addRepeater,
  addRepeaterTag,
  addRepeaterView,
  briskRepeater,
  bulkGongReview,
  bulkRepeaterCoffer,
  bulkRepeaterGraphite,
  bulkRepeaterPoise,
  bulkRepeaterTag,
  busiestStriker,
  dropRepeaterView,
  editRepeater,
  editRepeaterNote,
  gongBead,
  gongCopy,
  gongDigit,
  gongEven,
  gongFamily,
  gongFirst,
  gongGap,
  gongHeld,
  gongEdge,
  gongHue,
  gongJoin,
  gongVault,
  gongLane,
  gongLanes,
  gongLanesCsv,
  gongLength,
  gongLetter,
  gongLower,
  gongMixed,
  gongOpen,
  gongRowsCsv,
  gongShare,
  gongSpace,
  gongStamp,
  gongTail,
  gongUpper,
  gongPrime,
  gongVowel,
  fairStriker,
  filmFocused,
  repeaterBars,
  repeaterCopy,
  repeaterCounts,
  repeaterCsv,
  repeaterDensity,
  repeaterInner,
  repeaterOuter,
  repeaterTimeline,
  repeaterStrikers,
  idleRepeater,
  laneGongCount,
  lateRepeater,
  leadingGong,
  leadingGongHue,
  lowerBeatFocused,
  lowerRateFocused,
  moveRepeaterFocus,
  overdueRepeater,
  pegRepeaterFocused,
  presentGongLanes,
  raiseBeatFocused,
  raiseRateFocused,
  readHiddenGong,
  readRepeaterRules,
  readRepeaterViews,
  readReviewedGong,
  reminderRepeaterRules,
  restingRepeater,
  setRepeaterCoffer,
  setRepeaterFilm,
  setRepeaterFocused,
  setRepeaterPeg,
  setRepeaterPoise,
  setRepeaterStar,
  sortRepeaterRules,
  starRepeaterFocused,
  suggestBeat,
  suggestFilm,
  suggestLimb,
  toggleGong,
  toggleGongReview,
  visibleGong,
  visibleGongLanes,
  visibleRepeaterRules,
  type GongReview,
  type GongRow,
  type GongShape,
  type GongValue,
  type Repeater,
  type RepeaterDensity,
  type RepeaterSort,
  type RepeaterTray,
  type RepeaterView,
} from "@/lib/crmv4/round335";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["GILT", "IVORY", "GRAPHITE"] as const;
const BEATS = ["3", "6", "12", "24"] as const;
const RATES = ["2", "5", "8"] as const;

const LIMB_KEY: Record<string, CrmV4CopyKey> = {
  rack: "rptRack",
  snail: "rptSnail",
  hammer: "rptHammer",
  gong: "rptGong",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "rptAuditSave",
  edit: "rptAuditEdit",
  note: "rptAuditNote",
  film: "rptAuditFilm",
  poise: "rptAuditPoise",
  free: "rptAuditFree",
  peg: "rptAuditPeg",
  return: "rptAuditReturn",
  coffer: "rptAuditCoffer",
  open: "rptAuditOpen",
  tag: "rptAuditTag",
  rate: "rptAuditRate",
  beat: "rptAuditBeat",
  lower: "rptAuditLower",
  star: "rptAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  core: "gngCore",
  edge: "gngEdge",
  prime: "gngPrime",
  vault: "gngVault",
  join: "gngJoin",
  gap: "gngGap",
  bead: "gngBead",
  ribbon: "gngRibbon",
  mark: "gngMark",
  vowel: "gngVowel",
  plain: "gngPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "gngChampagne",
  ivory: "gngIvory",
  graphite: "gngGraphite",
};

const SHAPE_KEY: Record<GongShape, CrmV4CopyKey> = {
  all: "gngShapeAll",
  core: "gngShapeCore",
  edge: "gngShapeEdge",
  prime: "gngShapePrime",
  vault: "gngShapeVault",
  join: "gngShapeJoin",
  gap: "gngShapeGap",
  bead: "gngShapeBead",
  ribbon: "gngShapeRibbon",
  mark: "gngShapeMark",
  vowel: "gngShapeVowel",
  plain: "gngShapePlain",
  open: "gngShapeOpen",
  soon: "gngShapeOpen",
  letter: "gngShapePlain",
  mixed: "gngShapeMark",
  upper: "gngShapeCore",
  lower: "gngShapePlain",
  space: "gngShapeGap",
  even: "gngShapeEven",
  odd: "gngShapeEven",
  tail: "gngShapeMark",
  first: "gngShapePlain",
  held: "gngShapeRibbon",
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
  return key ? v4(key) : v4("rptBlankLimb");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "GILT") return v4("rptGilt");
  if (film === "IVORY") return v4("rptIvory");
  if (film === "GRAPHITE") return v4("rptGraphite");
  return v4("rptAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("gngBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("gngBlank");
}

export function RepeaterRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Repeater[]>([]);
  const [views, setViews] = useState<RepeaterView[]>([]);
  const [density, setDensity] = useState<RepeaterDensity>("airy");
  const [tray, setTray] = useState<RepeaterTray>("board");
  const [query, setQuery] = useState("");
  const [setterFilter, setSetterFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [limbFilter, setLimbFilter] = useState("all");
  const [beatFilter, setBeatFilter] = useState("all");
  const [rateFilter, setRateFilter] = useState("all");
  const [sort, setSort] = useState<RepeaterSort>("limb");
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
  const [station, setStation] = useState("rack");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readRepeaterRules(readJson(RPT_KEY, [])));
    setViews(readRepeaterViews(readJson(RPT_VIEW_KEY, [])));
    setDensity(repeaterDensity(readJson(RPT_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Repeater[]) {
    setCards(next);
    writeJson(RPT_KEY, next);
  }
  function storeViews(next: RepeaterView[]) {
    setViews(next);
    writeJson(RPT_VIEW_KEY, next);
  }
  function storeDensity(next: RepeaterDensity) {
    setDensity(next);
    writeJson(RPT_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortRepeaterRules(visibleRepeaterRules(cards, tray, query, setterFilter, filmFilter, limbFilter, beatFilter, rateFilter), sort),
    [cards, tray, query, setterFilter, filmFilter, limbFilter, beatFilter, rateFilter, sort],
  );
  const counts = repeaterCounts(cards, shown, station);
  const bars = repeaterBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = repeaterTimeline(cards);
  const reminders = reminderRepeaterRules(cards);
  const setters = repeaterStrikers(cards);
  const busy = busiestStriker(cards);
  const fair = fairStriker(cards, setters.join(","));
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
        download("repeater-rules.csv", repeaterCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveRepeaterFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveRepeaterFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addRepeater(cards, { title, note, striker: setter, limb, beat: beatNo, film, rate: rateNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-repeater" aria-label={v4("rptTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-repeater-mast">
        <p className="c4-repeater-seal" data-logo="mono">{v4("rptLogo")}</p>
        <div>
          <p className="c4-repeater-kicker">{v4("rptSub")}</p>
          <h2 className="c4-title">{v4("rptTitle")}</h2>
        </div>
        <p className="c4-repeater-count">{shown.length}</p>
      </header>
      <p className="c4-repeater-links">
        <Link href={crmv4Href(base, "gng")}>{v4("gngTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("rptCustomers")}</Link>
      </p>
      <p className="c4-repeater-hint">{v4("rptHint")}</p>
      {viewer && <p className="c4-repeater-note">{v4("rptViewer")}</p>}
      <p className="c4-repeater-meta">{v4("rptFair")} {fair || "—"} · {v4("rptBusy")} {busy || "—"} · {v4("rptSuggest")} {limbLabel(v4, suggestedLimb)} · {filmLabel(v4, suggestedFilm)} · {suggestedBeat}</p>
      <ol className="c4-repeater-index" aria-label={v4("rptRemind")}>
        <li data-tone="gold">{v4("rptOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("rptIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("rptBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("rptResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-repeater-remind c4-repeater-notices" role="status" aria-label={v4("rptRemind")}>
          {reminders.map((name) => <li key={name}>{v4("rptOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-repeater-chart" aria-label={v4("rptChart")}>
        {bars.map((bar) => (
          <button key={bar.limb} type="button" className="c4-repeater-column" data-on={limbFilter === bar.limb ? "1" : "0"} onClick={() => setLimbFilter(limbFilter === bar.limb ? "all" : bar.limb)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{limbLabel(v4, bar.limb)}</span>
          </button>
        ))}
      </div>
      <form className="c4-repeater-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("rptEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("rptEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("rptNote")}<input className="c4-field" aria-label={v4("rptNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("rptStriker")}<input className="c4-field" aria-label={v4("rptStriker")} aria-required={false} value={setter} maxLength={24} disabled={viewer} onChange={(event) => setSetter(event.target.value)} /></label>
        <label className="c4-lab">{v4("rptLimb")}<select className="c4-field" aria-label={v4("rptLimb")} value={limb} disabled={viewer} onChange={(event) => setLimb(event.target.value)}><option value="">{v4("rptBlankLimb")}</option>{RPT_LIMBS.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("rptFilm")}<select className="c4-field" aria-label={v4("rptFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("rptAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("rptQuarter")}<select className="c4-field" aria-label={v4("rptQuarter")} value={beatNo} disabled={viewer} onChange={(event) => setBeatNo(event.target.value)}><option value="">{v4("rptAll")}</option>{BEATS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("rptStrike")}<select className="c4-field" aria-label={v4("rptStrike")} value={rateNo} disabled={viewer} onChange={(event) => setRateNo(event.target.value)}><option value="">{v4("rptAll")}</option>{RATES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("rptTag")}<input className="c4-field" aria-label={v4("rptTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("rptAdd")}</button>
      </form>
      <div className="c4-repeater-tools">
        <input ref={searchRef} className="c4-field c4-repeater-search" aria-label={v4("rptSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("rptSearch")} />
        {(["board", "peg", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "board" ? "rptBoard" : item === "peg" ? "rptPeg" : "rptCoffer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={limbFilter === "inner" ? "1" : "0"} onClick={() => setLimbFilter(limbFilter === "inner" ? "all" : "inner")}>{v4("rptInner")}</button>
        <button type="button" className="c4-chip" data-on={limbFilter === "outer" ? "1" : "0"} onClick={() => setLimbFilter(limbFilter === "outer" ? "all" : "outer")}>{v4("rptOuter")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "striker" ? "1" : "0"} onClick={() => setSort(sort === "striker" ? "limb" : "striker")}>{sort === "striker" ? v4("rptSortStriker") : v4("rptSortLimb")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("rptClose") : v4("rptAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("rptTimeline")}</button>
        <label className="c4-lab">{v4("rptDesk")}<select className="c4-field" aria-label={v4("rptDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{RPT_LIMBS.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-repeater-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addRepeaterView(views, { id, name: viewName, tray, query, striker: setterFilter, film: filmFilter, limb: limbFilter, beat: beatFilter, rate: rateFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("rptViewName")}<input className="c4-field" aria-label={v4("rptViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("rptSaveView")}</button>
      </form>
      <ul className="c4-repeater-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setSetterFilter(view.striker); setFilmFilter(view.film); setLimbFilter(view.limb); setBeatFilter(view.beat); setRateFilter(view.rate); }}>{v4("rptApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropRepeaterView(views, view.id))}>{v4("rptDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-repeater-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRepeaterPoise(cards, picked))}>{v4("rptBulkPoise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRepeaterCoffer(cards, picked))}>{v4("rptBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRepeaterGraphite(cards, picked))}>{v4("rptBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRepeaterTag(cards, picked))}>{v4("rptBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("repeater-rules.csv", repeaterCsv(shown, station))}>{v4("rptCsv")}</button>
        <p className="c4-repeater-meta">{v4("rptKeys")} / n x a j k · {v4("rptQuiet")} {counts.quiet} · {v4("rptInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-repeater-time" aria-label={v4("rptTimeline")}>
          {timeline.map((lane) => <li key={lane.beat}><span>{lane.beat}</span> {lane.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("rptEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-repeater-list">
          {shown.map((card) => {
            const late = lateRepeater(card, station);
            return (
              <li key={card.id} className="c4-repeater-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleRepeater(card) ? "1" : "0"} data-brisk={briskRepeater(card) ? "1" : "0"} data-overdue={overdueRepeater(card) ? "1" : "0"} data-resting={restingRepeater(card) ? "1" : "0"} data-inner={repeaterInner(card.limb) ? "1" : "0"} data-outer={repeaterOuter(card.limb) ? "1" : "0"}>
                <label className="c4-repeater-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editRepeater(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("rptEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("rptApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editRepeaterNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("rptNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-repeater-meta">{limbLabel(v4, card.limb)} · {filmLabel(v4, card.film)} · {card.beat ?? "—"} · {card.rate} · {card.striker || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "rptAuditSave")}` : ""}{late ? ` · ${v4("rptOverdue")}` : ""}</p>
                </div>
                <div className="c4-repeater-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("rptEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRepeaterPoise(cards, card.id, !card.poised))}>{card.poised ? v4("rptFree") : v4("rptPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRepeaterFilm(cards, card.id, suggestedFilm))}>{v4("rptSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRepeaterPeg(cards, card.id, !card.pegged))}>{card.pegged ? v4("rptUnpeg") : v4("rptPegIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRepeaterCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("rptUncoffer") : v4("rptCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRepeaterStar(cards, card.id, !card.starred))}>{card.starred ? v4("rptUnstar") : v4("rptStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addRepeaterTag(cards, card.id, "r"))}>{v4("rptTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseBeatFocused(cards, card.id))}>{v4("rptRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerBeatFocused(cards, card.id))}>{v4("rptLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseRateFocused(cards, card.id))}>{v4("rptStrike")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerRateFocused(cards, card.id))}>{v4("rptStrike")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(filmFocused(cards, card.id))}>{v4("rptFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRepeaterFocused(cards, card.id))}>{v4("rptPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pegRepeaterFocused(cards, card.id))}>{v4("rptPeg")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starRepeaterFocused(cards, card.id))}>{v4("rptStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(repeaterCopy(card))}>{v4("rptCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type GongUser = { id?: string; name?: string | null; tradingGroup?: string | null };

export function GongPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: GongUser[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<GongShape>("all");
  const [review, setReview] = useState<GongReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): GongRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { tradingGroup: textField(row.tradingGroup) } satisfies GongValue,
    };
  }).filter((row): row is GongRow => Boolean(row));
  const present = presentGongLanes(rows);
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
    const next = readHiddenGong(readJson(GNG_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(GNG_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedGong(readJson(GNG_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(GNG_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleGongLanes(present, hidden, showHidden);
  const shown = visibleGong(rows, lanes.includes(lane) || lane === "all" ? lane : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = gongLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = gongLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingGong(rows);
  const leadHue = leadingGongHue(rows);
  const whole = rows.filter((row) => gongLane(row.code)).length;
  const share = gongShare(laneGongCount(rows, "core"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("gong-lanes.csv", gongLanesCsv(rows));
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
    writeJson(GNG_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(GNG_REVIEW_KEY, next);
  }

  return (
    <section className="c4-gong" aria-label={v4("gngTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-gong-mast">
        <p className="c4-gong-seal" data-logo="mono">{v4("gngLogo")}</p>
        <div>
          <p className="c4-gong-kicker">{v4("gngSub")}</p>
          <h2 className="c4-title">{v4("gngTitle")}</h2>
        </div>
        <p className="c4-gong-count">{shown.length}</p>
      </header>
      <p className="c4-gong-links">
        <Link href={crmv4Href(base, "rpt")}>{v4("rptTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("gngCustomer")}</Link>
      </p>
      <p className="c4-gong-hint">{v4("gngHint")}</p>
      {viewer && <p className="c4-gong-note">{v4("gngViewer")}</p>}
      <p className="c4-gong-meta">{v4("gngLead")} {laneLabel(v4, lead)} · {v4("gngToneLead")} {hueLabel(v4, leadHue)} · {v4("gngShare")} {share}</p>
      <div className="c4-gong-chart" aria-label={v4("gngChart")}>
        {lines.map((line) => (
          <button key={line.lane} type="button" className="c4-gong-column" data-on={lane === line.lane ? "1" : "0"} data-lane={line.lane} onClick={() => setLane(lane === line.lane ? "all" : line.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-gong-tools">
        <input ref={searchRef} className="c4-field c4-gong-search" aria-label={v4("gngSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("gngSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("gngShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "gngAll" : item === "reviewed" ? "gngReviewed" : "gngFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("gngAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as GongShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleGong(hidden, item))}>{hidden.includes(item) ? v4("gngShow") : v4("gngHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-gong-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkGongReview(reviewed, picked, true))}>{v4("gngBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkGongReview(reviewed, picked, false))}>{v4("gngBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("gong-lanes.csv", gongLanesCsv(rows))}>{v4("gngCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("gong-rows.csv", gongRowsCsv(shown, reviewed))}>{v4("gngRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("gngLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("gngFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("gngEmpty")}</p>}
      <ul className="c4-gong-list">
        {shown.map((row) => {
          const name = gongCopy(row.code);
          const tone = gongHue(row.code);
          return (
            <li key={row.id} className="c4-gong-card" data-lane={gongLane(row.code) || "open"} data-hue={tone || "none"} data-core={gongLane(row.code) === "core" ? "1" : "0"} data-edge={gongEdge(row.code) ? "1" : "0"} data-prime={gongPrime(row.code) ? "1" : "0"} data-vault={gongVault(row.code) ? "1" : "0"} data-open={gongOpen(row.code) ? "1" : "0"} data-even={gongEven(row.code) ? "1" : "0"} data-digit={gongDigit(row.code) ? "1" : "0"} data-letter={gongLetter(row.code) ? "1" : "0"} data-mixed={gongMixed(row.code) ? "1" : "0"} data-upper={gongUpper(row.code) ? "1" : "0"} data-lower={gongLower(row.code) ? "1" : "0"} data-space={gongSpace(row.code) ? "1" : "0"} data-vowel={gongVowel(row.code) ? "1" : "0"} data-tail={gongTail(row.code) ? "1" : "0"} data-first={gongFirst(row.code) ? "1" : "0"} data-held={gongHeld(row.code) ? "1" : "0"} data-join={gongJoin(row.code) ? "1" : "0"} data-gap={gongGap(row.code) ? "1" : "0"} data-bead={gongBead(row.code) ? "1" : "0"}>
              <label className="c4-gong-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-gong-meta">{name || v4("gngOpen")} · {gongStamp(row.code) || "—"} · {gongFamily(row.code) || "—"} · {gongLength(row.code) ?? "—"} · {laneLabel(v4, gongLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-gong-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleGongReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("gngReviewed") : v4("gngReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = gongCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("gngCopied") : v4("gngCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("gngCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
