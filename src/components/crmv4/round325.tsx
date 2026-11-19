"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  GHP_DENSITY_KEY,
  GHP_KEY,
  GHP_PARTS,
  GHP_VIEW_KEY,
  VVL_KEY,
  VVL_REVIEW_KEY,
  addGrasshopper,
  addGrasshopperTag,
  addGrasshopperView,
  briskGrasshopper,
  bulkGrasshopperGraphite,
  bulkGrasshopperTag,
  bulkGrasshopperCase,
  bulkGrasshopperSpring,
  bulkVolvelleReview,
  busiestSmith,
  dropGrasshopperView,
  editGrasshopper,
  editGrasshopperNote,
  fairSmith,
  idleGrasshopper,
  inkFocused,
  grasshopperBars,
  grasshopperCopy,
  grasshopperCounts,
  grasshopperCsv,
  grasshopperDensity,
  grasshopperInner,
  grasshopperSmiths,
  grasshopperOuter,
  grasshopperTimeline,
  laneVolvelleCount,
  lateGrasshopper,
  leadingVolvelle,
  leadingVolvelleHue,
  liftDropFocused,
  lowerArcFocused,
  lowerDropFocused,
  moveGrasshopperFocus,
  overdueGrasshopper,
  cockGrasshopperFocused,
  volvelleCopy,
  volvelleDigit,
  volvelleEven,
  volvelleFamily,
  volvelleFirst,
  volvelleSplit,
  volvelleHeld,
  volvelleHue,
  volvelleLane,
  volvelleLanes,
  volvelleLanesCsv,
  volvelleLength,
  volvelleLetter,
  volvelleLower,
  volvelleMixed,
  volvelleOpen,
  volvelleRowsCsv,
  volvelleShare,
  volvelleHyphen,
  volvelleSpace,
  volvelleStamp,
  volvelleTail,
  volvelleUpper,
  volvelleVowel,
  presentVolvelleLanes,
  raiseArcFocused,
  readHiddenVolvelle,
  readGrasshopperRules,
  readGrasshopperViews,
  readReviewedVolvelle,
  reminderGrasshopperRules,
  restingGrasshopper,
  setGrasshopperFocused,
  setGrasshopperCock,
  setGrasshopperInk,
  setGrasshopperStar,
  setGrasshopperCase,
  setGrasshopperSpring,
  sortGrasshopperRules,
  starGrasshopperFocused,
  suggestInk,
  suggestPart,
  suggestDrop,
  toggleVolvelle,
  toggleVolvelleReview,
  visibleGrasshopperRules,
  visibleVolvelle,
  visibleVolvelleLanes,
  type Grasshopper,
  type GrasshopperDensity,
  type GrasshopperSort,
  type GrasshopperTray,
  type GrasshopperView,
  type VolvelleReview,
  type VolvelleRow,
  type VolvelleShape,
  type VolvelleValue,
} from "@/lib/crmv4/round325";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const INKS = ["GILT", "IVORY", "GRAPHITE"] as const;
const DROPS = ["4", "8", "12", "16"] as const;
const ARCS = ["5", "10", "15"] as const;

const PART_KEY: Record<string, CrmV4CopyKey> = {
  pallet: "ghpLocking",
  arbor: "ghpImpulse",
  tooth: "ghpRoller",
  cheek: "ghpRuby",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "ghpAuditSave",
  edit: "ghpAuditEdit",
  note: "ghpAuditNote",
  ink: "ghpAuditInk",
  set: "ghpAuditSet",
  clear: "ghpAuditClear",
  cock: "ghpAuditCock",
  resume: "ghpAuditResume",
  case: "ghpAuditCase",
  open: "ghpAuditOpen",
  tag: "ghpAuditTag",
  arc: "ghpAuditArc",
  drop: "ghpAuditDrop",
  lower: "ghpAuditLower",
  star: "ghpAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  cardinal: "vvlCardinal",
  hyphen: "vvlHyphen",
  split: "vvlSplit",
  brief: "vvlBrief",
  banner: "vvlBanner",
  figure: "vvlFigure",
  twin: "vvlTwin",
  coast: "vvlCoast",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "vvlChampagne",
  ivory: "vvlIvory",
  graphite: "vvlGraphite",
};

const SHAPE_KEY: Record<VolvelleShape, CrmV4CopyKey> = {
  all: "vvlShapeAll",
  cardinal: "vvlShapeCardinal",
  hyphen: "vvlShapeHyphen",
  split: "vvlShapeSplit",
  brief: "vvlShapeBrief",
  banner: "vvlShapeBanner",
  figure: "vvlShapeFigure",
  twin: "vvlShapeTwin",
  coast: "vvlShapeCoast",
  open: "vvlShapeOpen",
  soon: "vvlShapeOpen",
  letter: "vvlShapeCoast",
  mixed: "vvlShapeFigure",
  upper: "vvlShapeCardinal",
  lower: "vvlShapeCoast",
  space: "vvlShapeSplit",
  even: "vvlShapeEven",
  odd: "vvlShapeEven",
  tail: "vvlShapeFigure",
  first: "vvlShapeCoast",
  held: "vvlShapeBanner",
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

function partLabel(v4: V4, part: string): string {
  const key = PART_KEY[part];
  return key ? v4(key) : v4("ghpBlankPart");
}

function inkLabel(v4: V4, ink: string): string {
  if (ink === "GILT") return v4("ghpGilt");
  if (ink === "IVORY") return v4("ghpIvory");
  if (ink === "GRAPHITE") return v4("ghpGraphite");
  return v4("ghpAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("vvlBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("vvlBlank");
}

export function GrasshopperRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Grasshopper[]>([]);
  const [views, setViews] = useState<GrasshopperView[]>([]);
  const [density, setDensity] = useState<GrasshopperDensity>("broad");
  const [tray, setTray] = useState<GrasshopperTray>("bench");
  const [query, setQuery] = useState("");
  const [smithFilter, setSmithFilter] = useState("");
  const [inkFilter, setInkFilter] = useState("all");
  const [partFilter, setPartFilter] = useState("all");
  const [dropFilter, setDropFilter] = useState("all");
  const [arcFilter, setArcFilter] = useState("all");
  const [sort, setSort] = useState<GrasshopperSort>("part");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [smith, setSmith] = useState("");
  const [part, setPart] = useState("");
  const [ink, setInk] = useState("");
  const [dropNo, setDropNo] = useState("");
  const [arcNo, setArcNo] = useState("");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteId, setNoteId] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [desk, setDesk] = useState("pallet");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readGrasshopperRules(readJson(GHP_KEY, [])));
    setViews(readGrasshopperViews(readJson(GHP_VIEW_KEY, [])));
    setDensity(grasshopperDensity(readJson(GHP_DENSITY_KEY, "broad")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Grasshopper[]) {
    setCards(next);
    writeJson(GHP_KEY, next);
  }
  function storeViews(next: GrasshopperView[]) {
    setViews(next);
    writeJson(GHP_VIEW_KEY, next);
  }
  function storeDensity(next: GrasshopperDensity) {
    setDensity(next);
    writeJson(GHP_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortGrasshopperRules(visibleGrasshopperRules(cards, tray, query, smithFilter, inkFilter, partFilter, dropFilter, arcFilter), sort),
    [cards, tray, query, smithFilter, inkFilter, partFilter, dropFilter, arcFilter, sort],
  );
  const counts = grasshopperCounts(cards, shown, desk);
  const bars = grasshopperBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = grasshopperTimeline(cards);
  const reminders = reminderGrasshopperRules(cards);
  const smiths = grasshopperSmiths(cards);
  const busy = busiestSmith(cards);
  const fair = fairSmith(cards, smiths.join(","));
  const suggestedInk = suggestInk(cards);
  const suggestedDrop = suggestDrop(cards, clock);
  const suggestedPart = suggestPart(clock);
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
        download("grasshopper-rules.csv", grasshopperCsv(shown, desk));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveGrasshopperFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveGrasshopperFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, desk]);

  function saveCard() {
    if (viewer) return;
    store(addGrasshopper(cards, { title, note, smith, part, drop: dropNo, ink, arc: arcNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-grasshopper" aria-label={v4("ghpTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-grasshopper-mast">
        <p className="c4-grasshopper-seal" data-logo="mono">{v4("ghpLogo")}</p>
        <div>
          <p className="c4-grasshopper-kicker">{v4("ghpSub")}</p>
          <h2 className="c4-title">{v4("ghpTitle")}</h2>
        </div>
        <p className="c4-grasshopper-count">{shown.length}</p>
      </header>
      <p className="c4-grasshopper-links">
        <Link href={crmv4Href(base, "vvl")}>{v4("vvlTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("ghpCustomers")}</Link>
      </p>
      <p className="c4-grasshopper-hint">{v4("ghpHint")}</p>
      {viewer && <p className="c4-grasshopper-note">{v4("ghpViewer")}</p>}
      <p className="c4-grasshopper-meta">{v4("ghpFair")} {fair || "—"} · {v4("ghpBusy")} {busy || "—"} · {v4("ghpSuggest")} {partLabel(v4, suggestedPart)} · {inkLabel(v4, suggestedInk)} · {suggestedDrop}</p>
      <ol className="c4-grasshopper-index" aria-label={v4("ghpRemind")}>
        <li data-tone="gold">{v4("ghpOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("ghpIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("ghpBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("ghpResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-grasshopper-remind c4-grasshopper-notices" role="status" aria-label={v4("ghpRemind")}>
          {reminders.map((name) => <li key={name}>{v4("ghpOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-grasshopper-chart" aria-label={v4("ghpChart")}>
        {bars.map((bar) => (
          <button key={bar.part} type="button" className="c4-grasshopper-column" data-on={partFilter === bar.part ? "1" : "0"} onClick={() => setPartFilter(partFilter === bar.part ? "all" : bar.part)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{partLabel(v4, bar.part)}</span>
          </button>
        ))}
      </div>
      <form className="c4-grasshopper-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("ghpEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("ghpEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("ghpNote")}<input className="c4-field" aria-label={v4("ghpNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("ghpSmith")}<input className="c4-field" aria-label={v4("ghpSmith")} aria-required={false} value={smith} maxLength={24} disabled={viewer} onChange={(event) => setSmith(event.target.value)} /></label>
        <label className="c4-lab">{v4("ghpLocking")}<select className="c4-field" aria-label={v4("ghpLocking")} value={part} disabled={viewer} onChange={(event) => setPart(event.target.value)}><option value="">{v4("ghpBlankPart")}</option>{GHP_PARTS.map((item) => <option key={item} value={item}>{partLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("ghpInk")}<select className="c4-field" aria-label={v4("ghpInk")} value={ink} disabled={viewer} onChange={(event) => setInk(event.target.value)}><option value="">{v4("ghpAll")}</option>{INKS.map((item) => <option key={item} value={item}>{inkLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("ghpDrop")}<select className="c4-field" aria-label={v4("ghpDrop")} value={dropNo} disabled={viewer} onChange={(event) => setDropNo(event.target.value)}><option value="">{v4("ghpAll")}</option>{DROPS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("ghpArc")}<select className="c4-field" aria-label={v4("ghpArc")} value={arcNo} disabled={viewer} onChange={(event) => setArcNo(event.target.value)}><option value="">{v4("ghpAll")}</option>{ARCS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("ghpTag")}<input className="c4-field" aria-label={v4("ghpTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("ghpAdd")}</button>
      </form>
      <div className="c4-grasshopper-tools">
        <input ref={searchRef} className="c4-field c4-grasshopper-search" aria-label={v4("ghpSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("ghpSearch")} />
        {(["bench", "cock", "case"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "bench" ? "ghpBench" : item === "cock" ? "ghpCock" : "ghpCase")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={partFilter === "inner" ? "1" : "0"} onClick={() => setPartFilter(partFilter === "inner" ? "all" : "inner")}>{v4("ghpInner")}</button>
        <button type="button" className="c4-chip" data-on={partFilter === "outer" ? "1" : "0"} onClick={() => setPartFilter(partFilter === "outer" ? "all" : "outer")}>{v4("ghpOuter")}</button>
        {INKS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={inkFilter === item ? "1" : "0"} onClick={() => setInkFilter(inkFilter === item ? "all" : item)}>{inkLabel(v4, item)}</button>
        ))}
        {DROPS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={dropFilter === item ? "1" : "0"} onClick={() => setDropFilter(dropFilter === item ? "all" : item)}>{item}</button>
        ))}
        {ARCS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={arcFilter === item ? "1" : "0"} onClick={() => setArcFilter(arcFilter === item ? "all" : item)}>{item}</button>
        ))}
        {smiths.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={smithFilter === name ? "1" : "0"} onClick={() => setSmithFilter(smithFilter === name ? "" : name)}>{name}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "smith" ? "1" : "0"} onClick={() => setSort(sort === "smith" ? "part" : "smith")}>{sort === "smith" ? v4("ghpSortSmith") : v4("ghpSortPart")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "broad" : "tight")}>{density === "tight" ? v4("ghpTight") : v4("ghpBroad")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("ghpTimeline")}</button>
        <label className="c4-lab">{v4("ghpDesk")}<select className="c4-field" aria-label={v4("ghpDesk")} value={desk} onChange={(event) => setDesk(event.target.value)}>{GHP_PARTS.map((item) => <option key={item} value={item}>{partLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-grasshopper-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addGrasshopperView(views, { id, name: viewName, tray, query, smith: smithFilter, ink: inkFilter, part: partFilter, drop: dropFilter, arc: arcFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("ghpViewName")}<input className="c4-field" aria-label={v4("ghpViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("ghpSaveView")}</button>
      </form>
      <ul className="c4-grasshopper-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setSmithFilter(view.smith); setInkFilter(view.ink); setPartFilter(view.part); setDropFilter(view.drop); setArcFilter(view.arc); }}>{v4("ghpApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropGrasshopperView(views, view.id))}>{v4("ghpDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-grasshopper-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkGrasshopperSpring(cards, picked))}>{v4("ghpBulkSpring")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkGrasshopperCase(cards, picked))}>{v4("ghpBulkCase")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkGrasshopperGraphite(cards, picked))}>{v4("ghpBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkGrasshopperTag(cards, picked))}>{v4("ghpBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("grasshopper-rules.csv", grasshopperCsv(shown, desk))}>{v4("ghpCsv")}</button>
        <p className="c4-grasshopper-meta">{v4("ghpKeys")} / n x a j k · {v4("ghpQuiet")} {counts.quiet} · {v4("ghpInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-grasshopper-time" aria-label={v4("ghpTimeline")}>
          {timeline.map((lane) => <li key={lane.drop}><span>{lane.drop}</span> {lane.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("ghpEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-grasshopper-list">
          {shown.map((card) => {
            const late = lateGrasshopper(card, desk);
            return (
              <li key={card.id} className="c4-grasshopper-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleGrasshopper(card) ? "1" : "0"} data-brisk={briskGrasshopper(card) ? "1" : "0"} data-overdue={overdueGrasshopper(card) ? "1" : "0"} data-resting={restingGrasshopper(card) ? "1" : "0"} data-inner={grasshopperInner(card.part) ? "1" : "0"} data-outer={grasshopperOuter(card.part) ? "1" : "0"}>
                <label className="c4-grasshopper-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editGrasshopper(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("ghpEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("ghpApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editGrasshopperNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("ghpNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-grasshopper-meta">{partLabel(v4, card.part)} · {inkLabel(v4, card.ink)} · {card.drop ?? "—"} · {card.arc} · {card.smith || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "ghpAuditSave")}` : ""}{late ? ` · ${v4("ghpOverdue")}` : ""}</p>
                </div>
                <div className="c4-grasshopper-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("ghpEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGrasshopperSpring(cards, card.id, !card.sprung))}>{card.sprung ? v4("ghpClear") : v4("ghpSpring")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGrasshopperInk(cards, card.id, suggestedInk))}>{v4("ghpSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGrasshopperCock(cards, card.id, !card.cocked))}>{card.cocked ? v4("ghpUncock") : v4("ghpCockIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGrasshopperCase(cards, card.id, !card.cased))}>{card.cased ? v4("ghpUncase") : v4("ghpCaseIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGrasshopperStar(cards, card.id, !card.starred))}>{card.starred ? v4("ghpUnstar") : v4("ghpStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addGrasshopperTag(cards, card.id, "d"))}>{v4("ghpTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftDropFocused(cards, card.id))}>{v4("ghpLift")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDropFocused(cards, card.id))}>{v4("ghpLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseArcFocused(cards, card.id))}>{v4("ghpArc")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerArcFocused(cards, card.id))}>{v4("ghpArc")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(inkFocused(cards, card.id))}>{v4("ghpInk")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGrasshopperFocused(cards, card.id))}>{v4("ghpSpring")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cockGrasshopperFocused(cards, card.id))}>{v4("ghpCock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starGrasshopperFocused(cards, card.id))}>{v4("ghpStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(grasshopperCopy(card))}>{v4("ghpCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type VolvelleUser = { id?: string; name?: string | null; desk?: string | null };

export function VolvellePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: VolvelleUser[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<VolvelleShape>("all");
  const [review, setReview] = useState<VolvelleReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): VolvelleRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { desk: textField(row.desk) } satisfies VolvelleValue,
    };
  }).filter((row): row is VolvelleRow => Boolean(row));
  const present = presentVolvelleLanes(rows);
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
    const next = readHiddenVolvelle(readJson(VVL_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(VVL_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedVolvelle(readJson(VVL_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(VVL_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleVolvelleLanes(present, hidden, showHidden);
  const shown = visibleVolvelle(rows, lanes.includes(lane) || lane === "all" ? lane : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = volvelleLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = volvelleLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingVolvelle(rows);
  const leadHue = leadingVolvelleHue(rows);
  const whole = rows.filter((row) => volvelleLane(row.code)).length;
  const share = volvelleShare(laneVolvelleCount(rows, "cardinal"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("volvelle-lanes.csv", volvelleLanesCsv(rows));
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
    writeJson(VVL_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(VVL_REVIEW_KEY, next);
  }

  return (
    <section className="c4-volvelle" aria-label={v4("vvlTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-volvelle-mast">
        <p className="c4-volvelle-seal" data-logo="mono">{v4("vvlLogo")}</p>
        <div>
          <p className="c4-volvelle-kicker">{v4("vvlSub")}</p>
          <h2 className="c4-title">{v4("vvlTitle")}</h2>
        </div>
        <p className="c4-volvelle-count">{shown.length}</p>
      </header>
      <p className="c4-volvelle-links">
        <Link href={crmv4Href(base, "ghp")}>{v4("ghpTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("vvlCustomer")}</Link>
      </p>
      <p className="c4-volvelle-hint">{v4("vvlHint")}</p>
      {viewer && <p className="c4-volvelle-note">{v4("vvlViewer")}</p>}
      <p className="c4-volvelle-meta">{v4("vvlLead")} {laneLabel(v4, lead)} · {v4("vvlToneLead")} {hueLabel(v4, leadHue)} · {v4("vvlShare")} {share}</p>
      <div className="c4-volvelle-chart" aria-label={v4("vvlChart")}>
        {lines.map((line) => (
          <button key={line.lane} type="button" className="c4-volvelle-column" data-on={lane === line.lane ? "1" : "0"} data-lane={line.lane} onClick={() => setLane(lane === line.lane ? "all" : line.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-volvelle-tools">
        <input ref={searchRef} className="c4-field c4-volvelle-search" aria-label={v4("vvlSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("vvlSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("vvlShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "vvlAll" : item === "reviewed" ? "vvlReviewed" : "vvlFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("vvlAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as VolvelleShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleVolvelle(hidden, item))}>{hidden.includes(item) ? v4("vvlShow") : v4("vvlHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-volvelle-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkVolvelleReview(reviewed, picked, true))}>{v4("vvlBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkVolvelleReview(reviewed, picked, false))}>{v4("vvlBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("volvelle-lanes.csv", volvelleLanesCsv(rows))}>{v4("vvlCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("volvelle-rows.csv", volvelleRowsCsv(shown, reviewed))}>{v4("vvlRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("vvlLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("vvlFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("vvlEmpty")}</p>}
      <ul className="c4-volvelle-list">
        {shown.map((row) => {
          const name = volvelleCopy(row.code);
          const tone = volvelleHue(row.code);
          return (
            <li key={row.id} className="c4-volvelle-card" data-lane={volvelleLane(row.code) || "open"} data-hue={tone || "none"} data-cardinal={volvelleLane(row.code) === "cardinal" ? "1" : "0"} data-open={volvelleOpen(row.code) ? "1" : "0"} data-even={volvelleEven(row.code) ? "1" : "0"} data-digit={volvelleDigit(row.code) ? "1" : "0"} data-letter={volvelleLetter(row.code) ? "1" : "0"} data-mixed={volvelleMixed(row.code) ? "1" : "0"} data-upper={volvelleUpper(row.code) ? "1" : "0"} data-lower={volvelleLower(row.code) ? "1" : "0"} data-space={volvelleSpace(row.code) ? "1" : "0"} data-vowel={volvelleVowel(row.code) ? "1" : "0"} data-tail={volvelleTail(row.code) ? "1" : "0"} data-first={volvelleFirst(row.code) ? "1" : "0"} data-held={volvelleHeld(row.code) ? "1" : "0"} data-slash={volvelleHyphen(row.code) ? "1" : "0"} data-gap={volvelleSplit(row.code) ? "1" : "0"}>
              <label className="c4-volvelle-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-volvelle-meta">{name || v4("vvlOpen")} · {volvelleStamp(row.code) || "—"} · {volvelleFamily(row.code) || "—"} · {volvelleLength(row.code) ?? "—"} · {laneLabel(v4, volvelleLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-volvelle-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleVolvelleReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("vvlReviewed") : v4("vvlReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = volvelleCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("vvlCopied") : v4("vvlCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("vvlCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
