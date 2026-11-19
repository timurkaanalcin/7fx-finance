"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  DPX_DENSITY_KEY,
  DPX_KEY,
  DPX_PARTS,
  DPX_VIEW_KEY,
  WRS_KEY,
  WRS_REVIEW_KEY,
  addDuplex,
  addDuplexTag,
  addDuplexView,
  briskDuplex,
  bulkDuplexGraphite,
  bulkDuplexTag,
  bulkDuplexCase,
  bulkDuplexSpring,
  bulkWindroseReview,
  busiestSmith,
  dropDuplexView,
  editDuplex,
  editDuplexNote,
  fairSmith,
  idleDuplex,
  inkFocused,
  duplexBars,
  duplexCopy,
  duplexCounts,
  duplexCsv,
  duplexDensity,
  duplexInner,
  duplexSmiths,
  duplexOuter,
  duplexTimeline,
  laneWindroseCount,
  lateDuplex,
  leadingWindrose,
  leadingWindroseHue,
  liftDropFocused,
  lowerArcFocused,
  lowerDropFocused,
  moveDuplexFocus,
  overdueDuplex,
  cockDuplexFocused,
  windroseCopy,
  windroseDigit,
  windroseEven,
  windroseFamily,
  windroseFirst,
  windroseSplit,
  windroseHeld,
  windroseHue,
  windroseLane,
  windroseLanes,
  windroseLanesCsv,
  windroseLength,
  windroseLetter,
  windroseLower,
  windroseMixed,
  windroseOpen,
  windroseRowsCsv,
  windroseShare,
  windroseHyphen,
  windroseSpace,
  windroseStamp,
  windroseTail,
  windroseUpper,
  windroseVowel,
  presentWindroseLanes,
  raiseArcFocused,
  readHiddenWindrose,
  readDuplexRules,
  readDuplexViews,
  readReviewedWindrose,
  reminderDuplexRules,
  restingDuplex,
  setDuplexFocused,
  setDuplexCock,
  setDuplexInk,
  setDuplexStar,
  setDuplexCase,
  setDuplexSpring,
  sortDuplexRules,
  starDuplexFocused,
  suggestInk,
  suggestPart,
  suggestDrop,
  toggleWindrose,
  toggleWindroseReview,
  visibleDuplexRules,
  visibleWindrose,
  visibleWindroseLanes,
  type Duplex,
  type DuplexDensity,
  type DuplexSort,
  type DuplexTray,
  type DuplexView,
  type WindroseReview,
  type WindroseRow,
  type WindroseShape,
  type WindroseValue,
} from "@/lib/crmv4/round324";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const INKS = ["GILT", "IVORY", "GRAPHITE"] as const;
const DROPS = ["2", "6", "9", "12"] as const;
const ARCS = ["3", "6", "9"] as const;

const PART_KEY: Record<string, CrmV4CopyKey> = {
  locking: "dpxLocking",
  impulse: "dpxImpulse",
  roller: "dpxRoller",
  ruby: "dpxRuby",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "dpxAuditSave",
  edit: "dpxAuditEdit",
  note: "dpxAuditNote",
  ink: "dpxAuditInk",
  set: "dpxAuditSet",
  clear: "dpxAuditClear",
  cock: "dpxAuditCock",
  resume: "dpxAuditResume",
  case: "dpxAuditCase",
  open: "dpxAuditOpen",
  tag: "dpxAuditTag",
  arc: "dpxAuditArc",
  drop: "dpxAuditDrop",
  lower: "dpxAuditLower",
  star: "dpxAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  cardinal: "wrsCardinal",
  hyphen: "wrsHyphen",
  split: "wrsSplit",
  brief: "wrsBrief",
  banner: "wrsBanner",
  figure: "wrsFigure",
  twin: "wrsTwin",
  coast: "wrsCoast",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "wrsChampagne",
  ivory: "wrsIvory",
  graphite: "wrsGraphite",
};

const SHAPE_KEY: Record<WindroseShape, CrmV4CopyKey> = {
  all: "wrsShapeAll",
  cardinal: "wrsShapeCardinal",
  hyphen: "wrsShapeHyphen",
  split: "wrsShapeSplit",
  brief: "wrsShapeBrief",
  banner: "wrsShapeBanner",
  figure: "wrsShapeFigure",
  twin: "wrsShapeTwin",
  coast: "wrsShapeCoast",
  open: "wrsShapeOpen",
  soon: "wrsShapeOpen",
  letter: "wrsShapeCoast",
  mixed: "wrsShapeFigure",
  upper: "wrsShapeCardinal",
  lower: "wrsShapeCoast",
  space: "wrsShapeSplit",
  even: "wrsShapeEven",
  odd: "wrsShapeEven",
  tail: "wrsShapeFigure",
  first: "wrsShapeCoast",
  held: "wrsShapeBanner",
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
  return key ? v4(key) : v4("dpxBlankPart");
}

function inkLabel(v4: V4, ink: string): string {
  if (ink === "GILT") return v4("dpxGilt");
  if (ink === "IVORY") return v4("dpxIvory");
  if (ink === "GRAPHITE") return v4("dpxGraphite");
  return v4("dpxAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("wrsBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("wrsBlank");
}

export function DuplexRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Duplex[]>([]);
  const [views, setViews] = useState<DuplexView[]>([]);
  const [density, setDensity] = useState<DuplexDensity>("broad");
  const [tray, setTray] = useState<DuplexTray>("bench");
  const [query, setQuery] = useState("");
  const [smithFilter, setSmithFilter] = useState("");
  const [inkFilter, setInkFilter] = useState("all");
  const [partFilter, setPartFilter] = useState("all");
  const [dropFilter, setDropFilter] = useState("all");
  const [arcFilter, setArcFilter] = useState("all");
  const [sort, setSort] = useState<DuplexSort>("part");
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
  const [desk, setDesk] = useState("locking");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readDuplexRules(readJson(DPX_KEY, [])));
    setViews(readDuplexViews(readJson(DPX_VIEW_KEY, [])));
    setDensity(duplexDensity(readJson(DPX_DENSITY_KEY, "broad")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Duplex[]) {
    setCards(next);
    writeJson(DPX_KEY, next);
  }
  function storeViews(next: DuplexView[]) {
    setViews(next);
    writeJson(DPX_VIEW_KEY, next);
  }
  function storeDensity(next: DuplexDensity) {
    setDensity(next);
    writeJson(DPX_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortDuplexRules(visibleDuplexRules(cards, tray, query, smithFilter, inkFilter, partFilter, dropFilter, arcFilter), sort),
    [cards, tray, query, smithFilter, inkFilter, partFilter, dropFilter, arcFilter, sort],
  );
  const counts = duplexCounts(cards, shown, desk);
  const bars = duplexBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = duplexTimeline(cards);
  const reminders = reminderDuplexRules(cards);
  const smiths = duplexSmiths(cards);
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
        download("duplex-rules.csv", duplexCsv(shown, desk));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveDuplexFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveDuplexFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, desk]);

  function saveCard() {
    if (viewer) return;
    store(addDuplex(cards, { title, note, smith, part, drop: dropNo, ink, arc: arcNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-duplex" aria-label={v4("dpxTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-duplex-mast">
        <p className="c4-duplex-seal" data-logo="mono">{v4("dpxLogo")}</p>
        <div>
          <p className="c4-duplex-kicker">{v4("dpxSub")}</p>
          <h2 className="c4-title">{v4("dpxTitle")}</h2>
        </div>
        <p className="c4-duplex-count">{shown.length}</p>
      </header>
      <p className="c4-duplex-links">
        <Link href={crmv4Href(base, "wrs")}>{v4("wrsTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("dpxCustomers")}</Link>
      </p>
      <p className="c4-duplex-hint">{v4("dpxHint")}</p>
      {viewer && <p className="c4-duplex-note">{v4("dpxViewer")}</p>}
      <p className="c4-duplex-meta">{v4("dpxFair")} {fair || "—"} · {v4("dpxBusy")} {busy || "—"} · {v4("dpxSuggest")} {partLabel(v4, suggestedPart)} · {inkLabel(v4, suggestedInk)} · {suggestedDrop}</p>
      <ol className="c4-duplex-index" aria-label={v4("dpxRemind")}>
        <li data-tone="gold">{v4("dpxOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("dpxIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("dpxBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("dpxResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-duplex-remind" aria-label={v4("dpxRemind")}>
          {reminders.map((name) => <li key={name}>{v4("dpxOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-duplex-chart" aria-label={v4("dpxChart")}>
        {bars.map((bar) => (
          <button key={bar.part} type="button" className="c4-duplex-column" data-on={partFilter === bar.part ? "1" : "0"} onClick={() => setPartFilter(partFilter === bar.part ? "all" : bar.part)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{partLabel(v4, bar.part)}</span>
          </button>
        ))}
      </div>
      <form className="c4-duplex-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("dpxEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("dpxEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("dpxNote")}<input className="c4-field" aria-label={v4("dpxNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("dpxSmith")}<input className="c4-field" aria-label={v4("dpxSmith")} aria-required={false} value={smith} maxLength={24} disabled={viewer} onChange={(event) => setSmith(event.target.value)} /></label>
        <label className="c4-lab">{v4("dpxLocking")}<select className="c4-field" aria-label={v4("dpxLocking")} value={part} disabled={viewer} onChange={(event) => setPart(event.target.value)}><option value="">{v4("dpxBlankPart")}</option>{DPX_PARTS.map((item) => <option key={item} value={item}>{partLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("dpxInk")}<select className="c4-field" aria-label={v4("dpxInk")} value={ink} disabled={viewer} onChange={(event) => setInk(event.target.value)}><option value="">{v4("dpxAll")}</option>{INKS.map((item) => <option key={item} value={item}>{inkLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("dpxDrop")}<select className="c4-field" aria-label={v4("dpxDrop")} value={dropNo} disabled={viewer} onChange={(event) => setDropNo(event.target.value)}><option value="">{v4("dpxAll")}</option>{DROPS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("dpxArc")}<select className="c4-field" aria-label={v4("dpxArc")} value={arcNo} disabled={viewer} onChange={(event) => setArcNo(event.target.value)}><option value="">{v4("dpxAll")}</option>{ARCS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("dpxTag")}<input className="c4-field" aria-label={v4("dpxTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("dpxAdd")}</button>
      </form>
      <div className="c4-duplex-tools">
        <input ref={searchRef} className="c4-field c4-duplex-search" aria-label={v4("dpxSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("dpxSearch")} />
        {(["bench", "cock", "case"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "bench" ? "dpxBench" : item === "cock" ? "dpxCock" : "dpxCase")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={partFilter === "inner" ? "1" : "0"} onClick={() => setPartFilter(partFilter === "inner" ? "all" : "inner")}>{v4("dpxInner")}</button>
        <button type="button" className="c4-chip" data-on={partFilter === "outer" ? "1" : "0"} onClick={() => setPartFilter(partFilter === "outer" ? "all" : "outer")}>{v4("dpxOuter")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "smith" ? "1" : "0"} onClick={() => setSort(sort === "smith" ? "part" : "smith")}>{sort === "smith" ? v4("dpxSortSmith") : v4("dpxSortPart")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "broad" : "tight")}>{density === "tight" ? v4("dpxTight") : v4("dpxBroad")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("dpxTimeline")}</button>
        <label className="c4-lab">{v4("dpxDesk")}<select className="c4-field" aria-label={v4("dpxDesk")} value={desk} onChange={(event) => setDesk(event.target.value)}>{DPX_PARTS.map((item) => <option key={item} value={item}>{partLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-duplex-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addDuplexView(views, { id, name: viewName, tray, query, smith: smithFilter, ink: inkFilter, part: partFilter, drop: dropFilter, arc: arcFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("dpxViewName")}<input className="c4-field" aria-label={v4("dpxViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("dpxSaveView")}</button>
      </form>
      <ul className="c4-duplex-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setSmithFilter(view.smith); setInkFilter(view.ink); setPartFilter(view.part); setDropFilter(view.drop); setArcFilter(view.arc); }}>{v4("dpxApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropDuplexView(views, view.id))}>{v4("dpxDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-duplex-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkDuplexSpring(cards, picked))}>{v4("dpxBulkSpring")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkDuplexCase(cards, picked))}>{v4("dpxBulkCase")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkDuplexGraphite(cards, picked))}>{v4("dpxBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkDuplexTag(cards, picked))}>{v4("dpxBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("duplex-rules.csv", duplexCsv(shown, desk))}>{v4("dpxCsv")}</button>
        <p className="c4-duplex-meta">{v4("dpxKeys")} / n x a j k · {v4("dpxQuiet")} {counts.quiet} · {v4("dpxInner")} {counts.inner}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-duplex-time" aria-label={v4("dpxTimeline")}>
          {timeline.map((lane) => <li key={lane.drop}><span>{lane.drop}</span> {lane.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("dpxEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-duplex-list">
          {shown.map((card) => {
            const late = lateDuplex(card, desk);
            return (
              <li key={card.id} className="c4-duplex-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleDuplex(card) ? "1" : "0"} data-brisk={briskDuplex(card) ? "1" : "0"} data-overdue={overdueDuplex(card) ? "1" : "0"} data-resting={restingDuplex(card) ? "1" : "0"} data-inner={duplexInner(card.part) ? "1" : "0"} data-outer={duplexOuter(card.part) ? "1" : "0"}>
                <label className="c4-duplex-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editDuplex(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("dpxEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("dpxApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editDuplexNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("dpxNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-duplex-meta">{partLabel(v4, card.part)} · {inkLabel(v4, card.ink)} · {card.drop ?? "—"} · {card.arc} · {card.smith || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "dpxAuditSave")}` : ""}{late ? ` · ${v4("dpxOverdue")}` : ""}</p>
                </div>
                <div className="c4-duplex-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("dpxEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDuplexSpring(cards, card.id, !card.sprung))}>{card.sprung ? v4("dpxClear") : v4("dpxSpring")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDuplexInk(cards, card.id, suggestedInk))}>{v4("dpxSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDuplexCock(cards, card.id, !card.cocked))}>{card.cocked ? v4("dpxUncock") : v4("dpxCockIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDuplexCase(cards, card.id, !card.cased))}>{card.cased ? v4("dpxUncase") : v4("dpxCaseIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDuplexStar(cards, card.id, !card.starred))}>{card.starred ? v4("dpxUnstar") : v4("dpxStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addDuplexTag(cards, card.id, "d"))}>{v4("dpxTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftDropFocused(cards, card.id))}>{v4("dpxLift")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDropFocused(cards, card.id))}>{v4("dpxLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseArcFocused(cards, card.id))}>{v4("dpxArc")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerArcFocused(cards, card.id))}>{v4("dpxArc")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(inkFocused(cards, card.id))}>{v4("dpxInk")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDuplexFocused(cards, card.id))}>{v4("dpxSpring")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cockDuplexFocused(cards, card.id))}>{v4("dpxCock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starDuplexFocused(cards, card.id))}>{v4("dpxStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(duplexCopy(card))}>{v4("dpxCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type WindroseUser = { id?: string; name?: string | null; desk?: string | null };

export function WindrosePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: WindroseUser[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<WindroseShape>("all");
  const [review, setReview] = useState<WindroseReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): WindroseRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { desk: textField(row.desk) } satisfies WindroseValue,
    };
  }).filter((row): row is WindroseRow => Boolean(row));
  const present = presentWindroseLanes(rows);
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
    const next = readHiddenWindrose(readJson(WRS_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(WRS_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedWindrose(readJson(WRS_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(WRS_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleWindroseLanes(present, hidden, showHidden);
  const shown = visibleWindrose(rows, lanes.includes(lane) || lane === "all" ? lane : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = windroseLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = windroseLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingWindrose(rows);
  const leadHue = leadingWindroseHue(rows);
  const whole = rows.filter((row) => windroseLane(row.code)).length;
  const share = windroseShare(laneWindroseCount(rows, "cardinal"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("windrose-lanes.csv", windroseLanesCsv(rows));
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
    writeJson(WRS_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(WRS_REVIEW_KEY, next);
  }

  return (
    <section className="c4-windrose" aria-label={v4("wrsTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-windrose-mast">
        <p className="c4-windrose-seal" data-logo="mono">{v4("wrsLogo")}</p>
        <div>
          <p className="c4-windrose-kicker">{v4("wrsSub")}</p>
          <h2 className="c4-title">{v4("wrsTitle")}</h2>
        </div>
        <p className="c4-windrose-count">{shown.length}</p>
      </header>
      <p className="c4-windrose-links">
        <Link href={crmv4Href(base, "dpx")}>{v4("dpxTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("wrsCustomer")}</Link>
      </p>
      <p className="c4-windrose-hint">{v4("wrsHint")}</p>
      {viewer && <p className="c4-windrose-note">{v4("wrsViewer")}</p>}
      <p className="c4-windrose-meta">{v4("wrsLead")} {laneLabel(v4, lead)} · {v4("wrsToneLead")} {hueLabel(v4, leadHue)} · {v4("wrsShare")} {share}</p>
      <div className="c4-windrose-chart" aria-label={v4("wrsChart")}>
        {lines.map((line) => (
          <button key={line.lane} type="button" className="c4-windrose-column" data-on={lane === line.lane ? "1" : "0"} data-lane={line.lane} onClick={() => setLane(lane === line.lane ? "all" : line.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-windrose-tools">
        <input ref={searchRef} className="c4-field c4-windrose-search" aria-label={v4("wrsSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("wrsSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("wrsShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "wrsAll" : item === "reviewed" ? "wrsReviewed" : "wrsFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("wrsAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as WindroseShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleWindrose(hidden, item))}>{hidden.includes(item) ? v4("wrsShow") : v4("wrsHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-windrose-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkWindroseReview(reviewed, picked, true))}>{v4("wrsBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkWindroseReview(reviewed, picked, false))}>{v4("wrsBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("windrose-lanes.csv", windroseLanesCsv(rows))}>{v4("wrsCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("windrose-rows.csv", windroseRowsCsv(shown, reviewed))}>{v4("wrsRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("wrsLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("wrsFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("wrsEmpty")}</p>}
      <ul className="c4-windrose-list">
        {shown.map((row) => {
          const name = windroseCopy(row.code);
          const tone = windroseHue(row.code);
          return (
            <li key={row.id} className="c4-windrose-card" data-lane={windroseLane(row.code) || "open"} data-hue={tone || "none"} data-cardinal={windroseLane(row.code) === "cardinal" ? "1" : "0"} data-open={windroseOpen(row.code) ? "1" : "0"} data-even={windroseEven(row.code) ? "1" : "0"} data-digit={windroseDigit(row.code) ? "1" : "0"} data-letter={windroseLetter(row.code) ? "1" : "0"} data-mixed={windroseMixed(row.code) ? "1" : "0"} data-upper={windroseUpper(row.code) ? "1" : "0"} data-lower={windroseLower(row.code) ? "1" : "0"} data-space={windroseSpace(row.code) ? "1" : "0"} data-vowel={windroseVowel(row.code) ? "1" : "0"} data-tail={windroseTail(row.code) ? "1" : "0"} data-first={windroseFirst(row.code) ? "1" : "0"} data-held={windroseHeld(row.code) ? "1" : "0"} data-slash={windroseHyphen(row.code) ? "1" : "0"} data-gap={windroseSplit(row.code) ? "1" : "0"}>
              <label className="c4-windrose-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-windrose-meta">{name || v4("wrsOpen")} · {windroseStamp(row.code) || "—"} · {windroseFamily(row.code) || "—"} · {windroseLength(row.code) ?? "—"} · {laneLabel(v4, windroseLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-windrose-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleWindroseReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("wrsReviewed") : v4("wrsReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = windroseCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("wrsCopied") : v4("wrsCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("wrsCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
