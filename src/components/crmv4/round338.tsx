"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  RLP_KEY,
  RLP_REVIEW_KEY,
  KLW_DENSITY_KEY,
  KLW_KEY,
  KLW_LIMBS,
  KLW_VIEW_KEY,
  addKeyless,
  addKeylessTag,
  addKeylessView,
  briskKeyless,
  bulkRoleplateReview,
  bulkKeylessCoffer,
  bulkKeylessGraphite,
  bulkKeylessPoise,
  bulkKeylessTag,
  busiestWinder,
  dropKeylessView,
  editKeyless,
  editKeylessNote,
  roleplateBead,
  roleplateCopy,
  roleplateDigit,
  roleplateEven,
  roleplateFamily,
  roleplateFirst,
  roleplateGap,
  roleplateHeld,
  roleplateAdmin,
  roleplateHue,
  roleplateJoin,
  roleplateAudit,
  roleplateLane,
  roleplateLanes,
  roleplateLanesCsv,
  roleplateLength,
  roleplateLetter,
  roleplateLower,
  roleplateMixed,
  roleplateOpen,
  roleplateRowsCsv,
  roleplateShare,
  roleplateSpace,
  roleplateStamp,
  roleplateTail,
  roleplateUpper,
  roleplateOwner,
  roleplateVowel,
  fairWinder,
  filmFocused,
  keylessBars,
  keylessCopy,
  keylessCounts,
  keylessCsv,
  keylessDensity,
  keylessInner,
  keylessOuter,
  keylessTimeline,
  keylessWinders,
  idleKeyless,
  laneRoleplateCount,
  lateKeyless,
  leadingRoleplate,
  leadingRoleplateHue,
  lowerBeatFocused,
  lowerRateFocused,
  moveKeylessFocus,
  overdueKeyless,
  pegKeylessFocused,
  presentRoleplateLanes,
  raiseBeatFocused,
  raiseRateFocused,
  readHiddenRoleplate,
  readKeylessRules,
  readKeylessViews,
  readReviewedRoleplate,
  reminderKeylessRules,
  restingKeyless,
  setKeylessCoffer,
  setKeylessFilm,
  setKeylessFocused,
  setKeylessPeg,
  setKeylessPoise,
  setKeylessStar,
  sortKeylessRules,
  starKeylessFocused,
  suggestTurn,
  suggestFinish,
  suggestPart,
  toggleRoleplate,
  toggleRoleplateReview,
  visibleRoleplate,
  visibleRoleplateLanes,
  visibleKeylessRules,
  type RoleplateReview,
  type RoleplateRow,
  type RoleplateShape,
  type RoleplateValue,
  type Keyless,
  type KeylessDensity,
  type KeylessSort,
  type KeylessTray,
  type KeylessView,
} from "@/lib/crmv4/round338";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["GILT", "IVORY", "GRAPHITE"] as const;
const BEATS = ["4", "12", "20", "28"] as const;
const RATES = ["3", "6", "9"] as const;

const LIMB_KEY: Record<string, CrmV4CopyKey> = {
  stem: "klwStem",
  clutch: "klwClutch",
  castle: "klwCastle",
  yoke: "klwYoke",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "klwAuditSave",
  edit: "klwAuditEdit",
  note: "klwAuditNote",
  film: "klwAuditFilm",
  poise: "klwAuditPoise",
  free: "klwAuditFree",
  peg: "klwAuditPeg",
  return: "klwAuditReturn",
  coffer: "klwAuditCoffer",
  open: "klwAuditOpen",
  tag: "klwAuditTag",
  rate: "klwAuditRate",
  beat: "klwAuditBeat",
  lower: "klwAuditLower",
  star: "klwAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  trader: "rlpTrader",
  admin: "rlpAdmin",
  owner: "rlpOwner",
  audit: "rlpAudit",
  join: "rlpJoin",
  gap: "rlpGap",
  bead: "rlpBead",
  ribbon: "rlpRibbon",
  mark: "rlpMark",
  vowel: "rlpVowel",
  plain: "rlpPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "rlpChampagne",
  ivory: "rlpIvory",
  graphite: "rlpGraphite",
};

const SHAPE_KEY: Record<RoleplateShape, CrmV4CopyKey> = {
  all: "rlpShapeAll",
  trader: "rlpShapeTrader",
  admin: "rlpShapeAdmin",
  owner: "rlpShapeOwner",
  audit: "rlpShapeAudit",
  join: "rlpShapeJoin",
  gap: "rlpShapeGap",
  bead: "rlpShapeBead",
  ribbon: "rlpShapeRibbon",
  mark: "rlpShapeMark",
  vowel: "rlpShapeVowel",
  plain: "rlpShapePlain",
  open: "rlpShapeOpen",
  soon: "rlpShapeOpen",
  letter: "rlpShapePlain",
  mixed: "rlpShapeMark",
  upper: "rlpShapeTrader",
  lower: "rlpShapePlain",
  space: "rlpShapeGap",
  even: "rlpShapeEven",
  odd: "rlpShapeEven",
  tail: "rlpShapeMark",
  first: "rlpShapePlain",
  held: "rlpShapeRibbon",
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
  return key ? v4(key) : v4("klwBlankLimb");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "GILT") return v4("klwGilt");
  if (film === "IVORY") return v4("klwIvory");
  if (film === "GRAPHITE") return v4("klwGraphite");
  return v4("klwAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("rlpBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("rlpBlank");
}

export function KeylessRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Keyless[]>([]);
  const [views, setViews] = useState<KeylessView[]>([]);
  const [density, setDensity] = useState<KeylessDensity>("airy");
  const [tray, setTray] = useState<KeylessTray>("board");
  const [query, setQuery] = useState("");
  const [winderFilter, setWinderFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [limbFilter, setLimbFilter] = useState("all");
  const [beatFilter, setBeatFilter] = useState("all");
  const [rateFilter, setRateFilter] = useState("all");
  const [sort, setSort] = useState<KeylessSort>("limb");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [winder, setWinder] = useState("");
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
  const [station, setStation] = useState("stem");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readKeylessRules(readJson(KLW_KEY, [])));
    setViews(readKeylessViews(readJson(KLW_VIEW_KEY, [])));
    setDensity(keylessDensity(readJson(KLW_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Keyless[]) {
    setCards(next);
    writeJson(KLW_KEY, next);
  }
  function storeViews(next: KeylessView[]) {
    setViews(next);
    writeJson(KLW_VIEW_KEY, next);
  }
  function storeDensity(next: KeylessDensity) {
    setDensity(next);
    writeJson(KLW_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortKeylessRules(visibleKeylessRules(cards, tray, query, winderFilter, filmFilter, limbFilter, beatFilter, rateFilter), sort),
    [cards, tray, query, winderFilter, filmFilter, limbFilter, beatFilter, rateFilter, sort],
  );
  const counts = keylessCounts(cards, shown, station);
  const bars = keylessBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = keylessTimeline(cards);
  const reminders = reminderKeylessRules(cards);
  const winders = keylessWinders(cards);
  const busy = busiestWinder(cards);
  const fair = fairWinder(cards, winders.join(","));
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
        download("keyless-rules.csv", keylessCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveKeylessFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveKeylessFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addKeyless(cards, { title, note, winder: winder, limb, beat: beatNo, film, rate: rateNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-keyless" aria-label={v4("klwTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-keyless-mast">
        <p className="c4-keyless-seal" data-logo="mono">{v4("klwLogo")}</p>
        <div>
          <p className="c4-keyless-kicker">{v4("klwSub")}</p>
          <h2 className="c4-title">{v4("klwTitle")}</h2>
        </div>
        <p className="c4-keyless-count">{shown.length}</p>
      </header>
      <p className="c4-keyless-links">
        <Link href={crmv4Href(base, "rlp")}>{v4("rlpTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("klwCustomers")}</Link>
      </p>
      <p className="c4-keyless-hint">{v4("klwHint")}</p>
      {viewer && <p className="c4-keyless-note">{v4("klwViewer")}</p>}
      <p className="c4-keyless-meta">{v4("klwFair")} {fair || "—"} · {v4("klwBusy")} {busy || "—"} · {v4("klwSuggest")} {limbLabel(v4, suggestedLimb)} · {filmLabel(v4, suggestedFilm)} · {suggestedBeat}</p>
      <ol className="c4-keyless-index" aria-label={v4("klwRemind")}>
        <li data-tone="gold">{v4("klwOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("klwIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("klwBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("klwResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-keyless-remind c4-keyless-notices" role="status" aria-label={v4("klwRemind")}>
          {reminders.map((name) => <li key={name}>{v4("klwOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-keyless-chart" aria-label={v4("klwChart")}>
        {bars.map((bar) => (
          <button key={bar.limb} type="button" className="c4-keyless-column" data-on={limbFilter === bar.limb ? "1" : "0"} onClick={() => setLimbFilter(limbFilter === bar.limb ? "all" : bar.limb)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{limbLabel(v4, bar.limb)}</span>
          </button>
        ))}
      </div>
      <form className="c4-keyless-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("klwEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("klwEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("klwNote")}<input className="c4-field" aria-label={v4("klwNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("klwWinder")}<input className="c4-field" aria-label={v4("klwWinder")} aria-required={false} value={winder} maxLength={24} disabled={viewer} onChange={(event) => setWinder(event.target.value)} /></label>
        <label className="c4-lab">{v4("klwLimb")}<select className="c4-field" aria-label={v4("klwLimb")} value={limb} disabled={viewer} onChange={(event) => setLimb(event.target.value)}><option value="">{v4("klwBlankLimb")}</option>{KLW_LIMBS.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("klwFilm")}<select className="c4-field" aria-label={v4("klwFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("klwAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("klwQuarter")}<select className="c4-field" aria-label={v4("klwQuarter")} value={beatNo} disabled={viewer} onChange={(event) => setBeatNo(event.target.value)}><option value="">{v4("klwAll")}</option>{BEATS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("klwStrike")}<select className="c4-field" aria-label={v4("klwStrike")} value={rateNo} disabled={viewer} onChange={(event) => setRateNo(event.target.value)}><option value="">{v4("klwAll")}</option>{RATES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("klwTag")}<input className="c4-field" aria-label={v4("klwTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("klwAdd")}</button>
      </form>
      <div className="c4-keyless-tools">
        <input ref={searchRef} className="c4-field c4-keyless-search" aria-label={v4("klwSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("klwSearch")} />
        {(["board", "peg", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "board" ? "klwBoard" : item === "peg" ? "klwPeg" : "klwCoffer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={limbFilter === "inner" ? "1" : "0"} onClick={() => setLimbFilter(limbFilter === "inner" ? "all" : "inner")}>{v4("klwInner")}</button>
        <button type="button" className="c4-chip" data-on={limbFilter === "outer" ? "1" : "0"} onClick={() => setLimbFilter(limbFilter === "outer" ? "all" : "outer")}>{v4("klwOuter")}</button>
        {FILMS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={filmFilter === item ? "1" : "0"} onClick={() => setFilmFilter(filmFilter === item ? "all" : item)}>{filmLabel(v4, item)}</button>
        ))}
        {BEATS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={beatFilter === item ? "1" : "0"} onClick={() => setBeatFilter(beatFilter === item ? "all" : item)}>{item}</button>
        ))}
        {RATES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rateFilter === item ? "1" : "0"} onClick={() => setRateFilter(rateFilter === item ? "all" : item)}>{item}</button>
        ))}
        {winders.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={winderFilter === name ? "1" : "0"} onClick={() => setWinderFilter(winderFilter === name ? "" : name)}>{name}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "winder" ? "1" : "0"} onClick={() => setSort(sort === "winder" ? "limb" : "winder")}>{sort === "winder" ? v4("klwSortWinder") : v4("klwSortLimb")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "airy" : "close")}>{density === "close" ? v4("klwClose") : v4("klwAiry")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("klwTimeline")}</button>
        <label className="c4-lab">{v4("klwDesk")}<select className="c4-field" aria-label={v4("klwDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{KLW_LIMBS.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-keyless-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addKeylessView(views, { id, name: viewName, tray, query, winder: winderFilter, film: filmFilter, limb: limbFilter, beat: beatFilter, rate: rateFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("klwViewName")}<input className="c4-field" aria-label={v4("klwViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("klwSaveView")}</button>
      </form>
      <ul className="c4-keyless-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setWinderFilter(view.winder); setFilmFilter(view.film); setLimbFilter(view.limb); setBeatFilter(view.beat); setRateFilter(view.rate); }}>{v4("klwApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropKeylessView(views, view.id))}>{v4("klwDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-keyless-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkKeylessPoise(cards, picked))}>{v4("klwBulkPoise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkKeylessCoffer(cards, picked))}>{v4("klwBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkKeylessGraphite(cards, picked))}>{v4("klwBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkKeylessTag(cards, picked))}>{v4("klwBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("keyless-rules.csv", keylessCsv(shown, station))}>{v4("klwCsv")}</button>
        <p className="c4-keyless-meta">{v4("klwKeys")} / n x a j k · {v4("klwQuiet")} {counts.quiet} · {v4("klwInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-keyless-time" aria-label={v4("klwTimeline")}>
          {timeline.map((lane) => <li key={lane.beat}><span>{lane.beat}</span> {lane.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("klwEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-keyless-list">
          {shown.map((card) => {
            const late = lateKeyless(card, station);
            return (
              <li key={card.id} className="c4-keyless-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleKeyless(card) ? "1" : "0"} data-brisk={briskKeyless(card) ? "1" : "0"} data-overdue={overdueKeyless(card) ? "1" : "0"} data-resting={restingKeyless(card) ? "1" : "0"} data-inner={keylessInner(card.limb) ? "1" : "0"} data-outer={keylessOuter(card.limb) ? "1" : "0"}>
                <label className="c4-keyless-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editKeyless(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("klwEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("klwApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editKeylessNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("klwNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-keyless-meta">{limbLabel(v4, card.limb)} · {filmLabel(v4, card.film)} · {card.beat ?? "—"} · {card.rate} · {card.winder || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "klwAuditSave")}` : ""}{late ? ` · ${v4("klwOverdue")}` : ""}</p>
                </div>
                <div className="c4-keyless-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("klwEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setKeylessPoise(cards, card.id, !card.poised))}>{card.poised ? v4("klwFree") : v4("klwPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setKeylessFilm(cards, card.id, suggestedFilm))}>{v4("klwSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setKeylessPeg(cards, card.id, !card.pegged))}>{card.pegged ? v4("klwUnpeg") : v4("klwPegIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setKeylessCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("klwUncoffer") : v4("klwCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setKeylessStar(cards, card.id, !card.starred))}>{card.starred ? v4("klwUnstar") : v4("klwStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addKeylessTag(cards, card.id, "a"))}>{v4("klwTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseBeatFocused(cards, card.id))}>{v4("klwRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerBeatFocused(cards, card.id))}>{v4("klwLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseRateFocused(cards, card.id))}>{v4("klwStrike")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerRateFocused(cards, card.id))}>{v4("klwStrike")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(filmFocused(cards, card.id))}>{v4("klwFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setKeylessFocused(cards, card.id))}>{v4("klwPoise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pegKeylessFocused(cards, card.id))}>{v4("klwPeg")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starKeylessFocused(cards, card.id))}>{v4("klwStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(keylessCopy(card))}>{v4("klwCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type RoleplateUser = { id?: string; name?: string | null; role?: string | null };

export function RoleplatePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: RoleplateUser[] }>("/api/admin/users?take=24&meta=0");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<RoleplateShape>("all");
  const [review, setReview] = useState<RoleplateReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): RoleplateRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { role: textField(row.role) } satisfies RoleplateValue,
    };
  }).filter((row): row is RoleplateRow => Boolean(row));
  const present = presentRoleplateLanes(rows);
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
    const next = readHiddenRoleplate(readJson(RLP_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(RLP_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedRoleplate(readJson(RLP_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(RLP_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleRoleplateLanes(present, hidden, showHidden);
  const shown = visibleRoleplate(rows, lanes.includes(lane) || lane === "all" ? lane : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = roleplateLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = roleplateLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingRoleplate(rows);
  const leadHue = leadingRoleplateHue(rows);
  const whole = rows.filter((row) => roleplateLane(row.code)).length;
  const share = roleplateShare(laneRoleplateCount(rows, "trader"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("roleplate-lanes.csv", roleplateLanesCsv(rows));
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
    writeJson(RLP_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(RLP_REVIEW_KEY, next);
  }

  return (
    <section className="c4-roleplate" aria-label={v4("rlpTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-roleplate-mast">
        <p className="c4-roleplate-seal" data-logo="mono">{v4("rlpLogo")}</p>
        <div>
          <p className="c4-roleplate-kicker">{v4("rlpSub")}</p>
          <h2 className="c4-title">{v4("rlpTitle")}</h2>
        </div>
        <p className="c4-roleplate-count">{shown.length}</p>
      </header>
      <p className="c4-roleplate-links">
        <Link href={crmv4Href(base, "klw")}>{v4("klwTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("rlpCustomer")}</Link>
      </p>
      <p className="c4-roleplate-hint">{v4("rlpHint")}</p>
      {viewer && <p className="c4-roleplate-note">{v4("rlpViewer")}</p>}
      <p className="c4-roleplate-meta">{v4("rlpLead")} {laneLabel(v4, lead)} · {v4("rlpToneLead")} {hueLabel(v4, leadHue)} · {v4("rlpShare")} {share}</p>
      <div className="c4-roleplate-chart" aria-label={v4("rlpChart")}>
        {lines.map((line) => (
          <button key={line.lane} type="button" className="c4-roleplate-column" data-on={lane === line.lane ? "1" : "0"} data-lane={line.lane} onClick={() => setLane(lane === line.lane ? "all" : line.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-roleplate-tools">
        <input ref={searchRef} className="c4-field c4-roleplate-search" aria-label={v4("rlpSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("rlpSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("rlpShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "rlpAll" : item === "reviewed" ? "rlpReviewed" : "rlpFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("rlpAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as RoleplateShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleRoleplate(hidden, item))}>{hidden.includes(item) ? v4("rlpShow") : v4("rlpHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-roleplate-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkRoleplateReview(reviewed, picked, true))}>{v4("rlpBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkRoleplateReview(reviewed, picked, false))}>{v4("rlpBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("roleplate-lanes.csv", roleplateLanesCsv(rows))}>{v4("rlpCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("roleplate-rows.csv", roleplateRowsCsv(shown, reviewed))}>{v4("rlpRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("rlpLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("rlpFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("rlpEmpty")}</p>}
      <ul className="c4-roleplate-list">
        {shown.map((row) => {
          const name = roleplateCopy(row.code);
          const tone = roleplateHue(row.code);
          return (
            <li key={row.id} className="c4-roleplate-card" data-lane={roleplateLane(row.code) || "open"} data-hue={tone || "none"} data-trader={roleplateLane(row.code) === "trader" ? "1" : "0"} data-admin={roleplateAdmin(row.code) ? "1" : "0"} data-owner={roleplateOwner(row.code) ? "1" : "0"} data-audit={roleplateAudit(row.code) ? "1" : "0"} data-open={roleplateOpen(row.code) ? "1" : "0"} data-even={roleplateEven(row.code) ? "1" : "0"} data-digit={roleplateDigit(row.code) ? "1" : "0"} data-letter={roleplateLetter(row.code) ? "1" : "0"} data-mixed={roleplateMixed(row.code) ? "1" : "0"} data-upper={roleplateUpper(row.code) ? "1" : "0"} data-lower={roleplateLower(row.code) ? "1" : "0"} data-space={roleplateSpace(row.code) ? "1" : "0"} data-vowel={roleplateVowel(row.code) ? "1" : "0"} data-tail={roleplateTail(row.code) ? "1" : "0"} data-first={roleplateFirst(row.code) ? "1" : "0"} data-held={roleplateHeld(row.code) ? "1" : "0"} data-join={roleplateJoin(row.code) ? "1" : "0"} data-gap={roleplateGap(row.code) ? "1" : "0"} data-bead={roleplateBead(row.code) ? "1" : "0"}>
              <label className="c4-roleplate-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-roleplate-meta">{name || v4("rlpOpen")} · {roleplateStamp(row.code) || "—"} · {roleplateFamily(row.code) || "—"} · {roleplateLength(row.code) ?? "—"} · {laneLabel(v4, roleplateLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-roleplate-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleRoleplateReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("rlpReviewed") : v4("rlpReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = roleplateCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("rlpCopied") : v4("rlpCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("rlpCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
